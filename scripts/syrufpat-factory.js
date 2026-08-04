const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

// -----------------------------------------------------------------------------
// CUSTOM EFFECTS & MÀU SẮC
// -----------------------------------------------------------------------------
const expandCircleFx = new Effect(25, cons(e => {
    let radius = 25 * e.fin(); 
    Draw.color(e.color);
    Lines.stroke(2.5 * e.fout()); 
    Lines.circle(e.x, e.y, radius);
}));

// HIỆU ỨNG NỔ: VÒNG TRÒN VÀ SPRITE TOP ZOOM TO CỰC NHANH
const superExplosionFx = new Effect(60, cons(e => {
    let maxRadius = 800; 
    
    // Bán kính hổng ở tâm lan ra ngoài
    let innerRadius = maxRadius * e.fin(); 

    // 1. VẼ RUỘT MỜ (Xóa dần từ tâm)
    Draw.color(Color.scarlet);
    Draw.alpha(0.35 * e.fout());
    
    let fillThickness = maxRadius - innerRadius;
    if (fillThickness > 0) {
        Lines.stroke(fillThickness);
        Lines.circle(e.x, e.y, innerRadius + fillThickness / 2);
    }

    // 2. VẼ VIỀN NGOÀI CỐ ĐỊNH
    Draw.color(Color.white);
    Draw.alpha(e.fout());
    Lines.stroke(6.0 * e.fout());
    Lines.circle(e.x, e.y, maxRadius);

    // 3. VIỀN SÓNG XUNG KÍCH BÊN TRONG
    Draw.color(Color.scarlet);
    Draw.alpha(e.fout());
    Lines.stroke(4.0 * e.fout());
    Lines.circle(e.x, e.y, innerRadius);

    // 4. DRAW SPRITE TOP ZOOM CỰC NHANH GẤP 3 LẦN TẠI THỜI ĐIỂM NỔ
    let topRegion = Core.atlas.find("newex-syrufpat-factory-top");
    if (topRegion.found()) {
        let zoomProgress = Math.min(1.0, e.fin() * 4.0); // Phóng to cực nhanh trong 1/4 thời gian đầu
        let zoomScale = zoomProgress * 3.0; 
        
        Draw.color(Color.white);
        Draw.alpha(e.fout());
        
        let blowRot = e.time * 12.0; 
        
        Draw.rect(topRegion, e.x, e.y, topRegion.width * Draw.scl * zoomScale, topRegion.height * Draw.scl * zoomScale, blowRot);
    }
}));

const COLOR_GRAPHITE  = Color.valueOf("92a4bd");
const COLOR_SILICON   = Color.valueOf("535661");
const COLOR_OIL       = Color.valueOf("313131");
const COLOR_PLAST     = Color.valueOf("cbd97f");

const CRAFT_TIME = 2.0 * 60;
const ACCEL_TIME = 3.0 * 60; // Thời gian tăng tốc cánh quạt: 3 giây
const MAX_SPIN_SPEED = 12.0;  // Tốc độ quay tối đa

Events.on(ContentInitEvent, () => {
    const syrufpatFactory = Vars.content.getByName(ContentType.block, "newex-syrufpat-factory");

    if (syrufpatFactory == null) return;

    syrufpatFactory.configurable = true;
    syrufpatFactory.hasLiquids = true;
    syrufpatFactory.hasItems = true;

    if (syrufpatFactory.liquidCapacity <= 0) {
        syrufpatFactory.liquidCapacity = 500;
    }

    // THANH BAR CẢNH BÁO NỔ
    syrufpatFactory.addBar("overheat_status", new Func({
        get: function(e){
            return new Bar(
                new Prov({ 
                    get: function(){ 
                        let timeLeft = e.getOverheatTimeLeft();
                        if (e.overheatTimer <= 0) return "TRẠNG THÁI: AN TOÀN";
                        if (e.isInventoryFull()) return "[scarlet]KHO ĐẦY! NỔ TRONG: " + timeLeft + "s[]";
                        return "CẢNH BÁO NỔ: " + timeLeft + "s"; 
                    } 
                }),
                new Prov({ 
                    get: function(){ 
                        return Color.yellow.cpy().lerp(Color.red, e.getOverheatRatio()); 
                    } 
                }),
                new Floatp({ 
                    get: function(){ 
                        return e.getOverheatRatio(); 
                    } 
                })
            );
        }
    }));

    syrufpatFactory.config(java.lang.Integer, packCons2((tile, value) => {
        if (tile != null) tile.setOutputSelection(Number(value));
    }));

    // LOGIC BUILD TYPE
    syrufpatFactory.buildType = () => extend(GenericCrafter.GenericCrafterBuild, syrufpatFactory, {
        created() {
            this.super$created();
            this.craftTimer = 0;
            this.selectedOutput = 0; 
            this.overheatTimer = 0;
            this.hasStartedBefore = false;
            this.topRotation = 0;
            this.spinTimer = 0; // Bộ đếm thời gian tăng tốc
            return this;
        },

        getOverheatRatio() {
            return Math.min(1.0, Math.max(0.0, this.overheatTimer / (60.0 * 60.0)));
        },

        getOverheatTimeLeft() {
            return Math.max(0, Math.ceil(60 - (this.overheatTimer / 60.0)));
        },

        setOutputSelection(val) {
            this.selectedOutput = val;
        },

        getOutputSelection() {
            return (this.selectedOutput == null) ? 0 : this.selectedOutput;
        },

        isInventoryFull() {
            if (this.items == null || this.liquids == null) return false;
            let cap = syrufpatFactory.itemCapacity;
            let liqCap = syrufpatFactory.liquidCapacity;

            return (this.items.get(Items.graphite) >= cap ||
                    this.items.get(Items.silicon) >= cap ||
                    this.liquids.get(Liquids.oil) >= liqCap ||
                    this.items.get(Items.plastanium) >= cap);
        },

        acceptItem(source, item) {
            return this.items != null && this.items.get(item) < syrufpatFactory.itemCapacity;
        },

        acceptLiquid(source, liquid) {
            return liquid == Liquids.cryofluid && this.liquids != null && this.liquids.get(liquid) < syrufpatFactory.liquidCapacity;
        },

        draw() {
            this.super$draw();

            if (this.items == null || this.liquids == null) return;

            let pColor = COLOR_GRAPHITE;
            let isWorking = false;

            if (this.items.get(Items.graphite) < 100 && this.items.get(Items.coal) >= 20) {
                pColor = COLOR_GRAPHITE; isWorking = true;
            } else if (this.items.get(Items.graphite) >= 100 && this.items.get(Items.silicon) < 100 && this.items.get(Items.sand) >= 30 && this.items.get(Items.coal) >= 10 && this.items.get(Items.graphite) >= 5) {
                pColor = COLOR_SILICON; isWorking = true;
            } else if (this.items.get(Items.silicon) >= 100 && this.liquids.get(Liquids.oil) < 100 && this.items.get(Items.coal) >= 20) {
                pColor = COLOR_OIL; isWorking = true;
            } else if (this.liquids.get(Liquids.oil) >= 30 && this.items.get(Items.titanium) >= 20) {
                pColor = COLOR_PLAST; isWorking = true;
            }

            // Draw vòng tròn tiến trình sản xuất
            if (isWorking && this.efficiency > 0) {
                let progress = Math.min(1.0, this.craftTimer / CRAFT_TIME);
                let radius = 25 * (1.0 - progress);

                Draw.color(pColor);
                Lines.stroke(2.0 * (1.0 - progress));
                Lines.circle(this.x, this.y, radius);
            }

            // -----------------------------------------------------------------
            // DRAW SPRITE TOP (TĂNG TỐC QUAY TRONG 3S + THU NHỎ KHI SẮP NỔ)
            // -----------------------------------------------------------------
            let topRegion = Core.atlas.find("newex-syrufpat-factory-top");
            if (topRegion.found()) {
                let currentScale = Math.max(0.0, 1.0 - this.getOverheatRatio());

                if (currentScale > 0) {
                    Draw.color(Color.white);
                    
                    let width = topRegion.width * Draw.scl * currentScale;
                    let height = topRegion.height * Draw.scl * currentScale;

                    Draw.rect(topRegion, this.x, this.y, width, height, this.topRotation);
                }
            }
        },

        // HÀM XỬ LÝ VỤ NỔ HỦY DIỆT
        triggerInstantDeathExplosion() {
            let explosionRadius = 800; 

            // 1. KÍCH HOẠT CUSTOM EFFECT
            superExplosionFx.at(this.x, this.y);

            // 2. Tiêu diệt TẤT CẢ UNIT trong bán kính
            Units.nearby(null, this.x, this.y, explosionRadius, cons(unit => {
                unit.kill();
            }));

            // 3. Tiêu diệt TẤT CẢ BLOCK/CÔNG TRÌNH trong bán kính
            let tileRadius = Math.ceil(explosionRadius / Vars.tilesize);
            let startX = Math.max(0, this.tileX() - tileRadius);
            let startY = Math.max(0, this.tileY() - tileRadius);
            let endX = Math.min(Vars.world.width() - 1, this.tileX() + tileRadius);
            let endY = Math.min(Vars.world.height() - 1, this.tileY() + tileRadius);

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    let otherTile = Vars.world.tile(x, y);
                    if (otherTile != null && otherTile.build != null) {
                        let dist = Mathf.dst(this.x, this.y, otherTile.worldx(), otherTile.worldy());
                        if (dist <= explosionRadius && otherTile.build != this) {
                            otherTile.build.kill();
                        }
                    }
                }
            }

            // 4. Âm thanh / Rung màn hình
            Fx.impactReactorExplosion.at(this.x, this.y);
            Effect.shake(25, 80, this.x, this.y);

            // Tự xóa sổ bản thân nhà máy
            this.kill();
        },

        updateTile() {
            if (this.liquids == null || this.items == null) return;

            // ---------------------------------------------------------------------
            // LOGIC TĂNG TỐC CÁNH QUẠT TRONG 3 GIÂY
            // ---------------------------------------------------------------------
            if (this.efficiency > 0) {
                this.hasStartedBefore = true;
                // Tăng bộ đếm spinTimer tối đa tới 3 giây (ACCEL_TIME)
                this.spinTimer = Math.min(ACCEL_TIME, this.spinTimer + Time.delta);
            } else {
                // Nếu dừng hoạt động, giảm tốc từ từ về 0
                this.spinTimer = Math.max(0, this.spinTimer - Time.delta);
            }

            // Tính tỷ lệ tăng tốc từ 0.0 -> 1.0 trong 3s
            let speedRatio = this.spinTimer / ACCEL_TIME;
            let currentSpinSpeed = MAX_SPIN_SPEED * speedRatio;

            // Cập nhật góc quay dựa trên tốc độ hiện tại
            this.topRotation = (this.topRotation + currentSpinSpeed * Time.delta) % 360;

            let requiredCryoPerTick = 500.0 / 60.0;
            let hasEnoughCryo = this.liquids.get(Liquids.cryofluid) >= requiredCryoPerTick;
            let fullInventory = this.isInventoryFull();

            // ---------------------------------------------------------------------
            // CƠ CHẾ ĐẾM NGƯỢC NỔ
            // ---------------------------------------------------------------------
            if (this.hasStartedBefore) {
                if (fullInventory || (!hasEnoughCryo && this.efficiency > 0)) {
                    this.overheatTimer += Time.delta;

                    if (this.overheatTimer >= 60.0 * 60) {
                        this.triggerInstantDeathExplosion();
                        return;
                    }
                } 
                else if (!fullInventory && hasEnoughCryo) {
                    this.liquids.remove(Liquids.cryofluid, requiredCryoPerTick);
                    this.overheatTimer = Math.max(0, this.overheatTimer - Time.delta);
                }
            }

            // ---------------------------------------------------------------------
            // CHỈ RÚT ĐÚNG TÀI NGUYÊN ĐƯỢC CHỌN TRONG UI
            // ---------------------------------------------------------------------
            let currentSelection = this.getOutputSelection();
            
            if (currentSelection == 0) {
                if (this.items.get(Items.graphite) > 0) this.dump(Items.graphite);
            } else if (currentSelection == 1) {
                if (this.items.get(Items.silicon) > 0) this.dump(Items.silicon);
            } else if (currentSelection == 2) {
                if (this.items.get(Items.plastanium) > 0) this.dump(Items.plastanium);
            }

            if (this.liquids.get(Liquids.oil) > 0) {
                this.dumpLiquid(Liquids.oil);
            }

            if (this.efficiency <= 0) return;

            // ---------------------------------------------------------------------
            // LOGIC SẢN XUẤT (2 GIÂY / GIAI ĐOẠN)
            // ---------------------------------------------------------------------
            this.craftTimer += Time.delta;

            // GIAI ĐOẠN 1: Graphite
            if (this.items.get(Items.graphite) < 100 && this.items.get(Items.coal) >= 20) {
                if (this.craftTimer >= CRAFT_TIME) {
                    this.items.remove(Items.coal, 20);
                    this.items.add(Items.graphite, 20);
                    this.craftTimer = 0;
                    expandCircleFx.at(this.x, this.y, 0, COLOR_GRAPHITE);
                    Effect.shake(2, 5, this.x, this.y);
                }
                return;
            }

            // GIAI ĐOẠN 2: Silicon
            if (this.items.get(Items.graphite) >= 100 && this.items.get(Items.silicon) < 100) {
                if (this.items.get(Items.sand) >= 30 && this.items.get(Items.coal) >= 10 && this.items.get(Items.graphite) >= 5) {
                    if (this.craftTimer >= CRAFT_TIME) {
                        this.items.remove(Items.sand, 30);
                        this.items.remove(Items.coal, 10);
                        this.items.remove(Items.graphite, 5);
                        this.items.add(Items.silicon, 100);
                        this.craftTimer = 0;
                        expandCircleFx.at(this.x, this.y, 0, COLOR_SILICON);
                        Effect.shake(2, 5, this.x, this.y);
                    }
                }
                return;
            }

            // GIAI ĐOẠN 3: Oil
            if (this.items.get(Items.silicon) >= 100 && this.liquids.get(Liquids.oil) < 100) {
                if (this.items.get(Items.coal) >= 20) {
                    if (this.craftTimer >= CRAFT_TIME) {
                        this.items.remove(Items.coal, 20);
                        this.liquids.add(Liquids.oil, 100);
                        this.craftTimer = 0;
                        expandCircleFx.at(this.x, this.y, 0, COLOR_OIL);
                        Effect.shake(2, 5, this.x, this.y);
                    }
                }
                return;
            }

            // GIAI ĐOẠN 4: Plastanium
            if (this.liquids.get(Liquids.oil) >= 30 && this.items.get(Items.titanium) >= 20) {
                if (this.craftTimer >= CRAFT_TIME) {
                    this.liquids.remove(Liquids.oil, 30);
                    this.items.remove(Items.titanium, 20);
                    this.items.add(Items.plastanium, 20);
                    this.craftTimer = 0;
                    expandCircleFx.at(this.x, this.y, 0, COLOR_PLAST);
                    Effect.shake(2, 5, this.x, this.y);
                }
            }
        },

        onConfigureBuild(tile) {
            return true;
        },

        buildConfiguration(table) {
            table.clear();

            table.button(Icon.settings, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm Tùy chọn Đầu ra", {});
                let optTable = new Table();

                const createOptBtn = (name, index) => {
                    let isCurrent = (this.getOutputSelection() == index);
                    let prefix = isCurrent ? "[lime]✓ " : "[lightgray]";
                    let btn = optTable.button(prefix + name + "[]", packRun(() => {
                        this.setOutputSelection(index);
                        this.configure(index);
                        dialog.hide();
                    })).size(280, 42).margin(4);
                    btn.row();
                };

                optTable.add("[yellow]CHỌN SẢN PHẨM DUY NHẤT ĐẨY RẤ BĂNG CHUYỀN:[]").padBottom(10).row();
                createOptBtn("Than chì (Graphite)", 0);
                createOptBtn("Silicon", 1);
                createOptBtn("Nhựa (Plastanium)", 2);

                let scroll = new ScrollPane(optTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(350);
                dialog.addCloseButton();
                dialog.show();
            })).size(50, 40);

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = " Thông số Nhà máy Syrufpat ";
                let descStr = "[gold]⚡ QUY TRÌNH SẢN XUẤT TỰ ĐỘNG (2s/GIAI ĐOẠN) ⚡[]\n\n" +
                              "[cyan]• Giai đoạn 1 (Than chì):[] 20 Coal ➔ [green]20 Graphite[] (2s)\n" +
                              "[cyan]• Giai đoạn 2 (Silicon):[] 30 Sand + 10 Coal + 5 Graphite ➔ [green]100 Silicon[] (2s)\n" +
                              "[cyan]• Giai đoạn 3 (Dầu mỏ):[] 20 Coal ➔ [green]100 Oil[] (2s)\n" +
                              "[cyan]• Giai đoạn 4 (Nhựa Plast):[] 30 Oil + 20 Titanium ➔ [green]20 Plastanium[] (2s)\n\n" +
                              "[scarlet]⚠ CƠ CHẾ NỔ HỦY DIỆT TẬN THẾ ⚠[]\n" +
                              "• Yêu cầu [cyan]500 Cryofluid/s[] để hạ nhiệt.\n" +
                              "• Đếm ngược 60s nổ khi kho đầy hoặc thiếu Cryofluid.\n" +
                              "• [red]SỨC NỔ: Tiêu diệt NGAY LẬP TỨC toàn bộ Unit và Block[] trong bán kính 100 ô!";

                let dialog = extend(BaseDialog, title, {});
                let infoTable = new Table();
                let cell = infoTable.add(descStr).width(360);
                cell.get().setWrap(true); 
                cell.get().setAlignment(Align.left);

                let scroll = new ScrollPane(infoTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); 
                dialog.show();
            })).size(50, 40);
        },

        config() { return this.getOutputSelection(); },

        write(write) {
            this.super$write(write);
            write.b(this.getOutputSelection());
            write.f(this.overheatTimer);
            write.bool(this.hasStartedBefore);
            write.f(this.topRotation);
            write.f(this.spinTimer);
        },
        read(read, revision) {
            this.super$read(read, revision);
            this.setOutputSelection(read.b());
            this.overheatTimer = read.f();
            this.hasStartedBefore = read.bool();
            this.topRotation = read.f();
            this.spinTimer = read.f();
        }
    });
});