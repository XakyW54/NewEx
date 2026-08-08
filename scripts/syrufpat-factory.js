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

const superExplosionFx = new Effect(60, cons(e => {
    let maxRadius = 800; 
    let innerRadius = maxRadius * e.fin(); 

    Draw.color(Color.scarlet);
    Draw.alpha(0.35 * e.fout());
    
    let fillThickness = maxRadius - innerRadius;
    if (fillThickness > 0) {
        Lines.stroke(fillThickness);
        Lines.circle(e.x, e.y, innerRadius + fillThickness / 2);
    }

    Draw.color(Color.white);
    Draw.alpha(e.fout());
    Lines.stroke(6.0 * e.fout());
    Lines.circle(e.x, e.y, maxRadius);

    Draw.color(Color.scarlet);
    Draw.alpha(e.fout());
    Lines.stroke(4.0 * e.fout());
    Lines.circle(e.x, e.y, innerRadius);
}));

const COLOR_GRAPHITE  = Color.valueOf("92a4bd");
const COLOR_SILICON   = Color.valueOf("535661");
const COLOR_OIL       = Color.valueOf("313131");
const COLOR_PLAST     = Color.valueOf("cbd97f");

const CRAFT_TIME = 1.0 * 60;

Events.on(ContentInitEvent, () => {
    const syrufpatFactory = Vars.content.getByName(ContentType.block, "newex-syrufpat-factory");

    if (syrufpatFactory == null) return;

    syrufpatFactory.configurable = true;
    syrufpatFactory.hasLiquids = true;
    syrufpatFactory.hasItems = true;

    if (syrufpatFactory.liquidCapacity <= 0) {
        syrufpatFactory.liquidCapacity = 500;
    }

    syrufpatFactory.addBar("overheat_status", new Func({
        get: function(e){
            return new Bar(
                new Prov({ 
                    get: function(){ 
                        let timeLeft = e.getOverheatTimeLeft();
                        if (e.overheatTimer <= 0) return "TRẠNG THÁI: AN TOÀN";
                        if (e.isOverItemLimit()) return "[scarlet]KHO VƯỢT QUÁ 1100 ITEM! NỔ TRONG: " + timeLeft + "s[]";
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

    syrufpatFactory.buildType = () => extend(GenericCrafter.GenericCrafterBuild, syrufpatFactory, {
        created() {
            this.super$created();
            this.craftTimer = 0;
            this.selectedOutput = 0; 
            this.overheatTimer = 0;
            this.hasStartedBefore = false;
            
            // Biến lưu trạng thái giai đoạn sản xuất (0: Graphite, 1: Silicon, 2: Oil, 3: Plastanium)
            this.productionStage = 0;

            // Hàng chờ xả vật phẩm
            this.dumpGraphiteLeft = 0;
            this.dumpSiliconLeft = 0;
            this.dumpPlastaniumLeft = 0;

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

        isOverItemLimit() {
            if (this.items == null) return false;
            return this.items.total() > 1100;
        },

        acceptItem(source, item) {
            if (this.items == null) return false;

            if (item == Items.thorium) {
                return this.getOutputSelection() == 3 && this.items.get(Items.thorium) < syrufpatFactory.itemCapacity;
            }

            if (item == Items.coal || item == Items.sand || item == Items.lead || item == Items.titanium) {
                return this.items.get(item) < syrufpatFactory.itemCapacity;
            }

            return false;
        },

        acceptLiquid(source, liquid) {
            return liquid == Liquids.cryofluid && this.liquids != null && this.liquids.get(liquid) < syrufpatFactory.liquidCapacity;
        },

        draw() {
            this.super$draw();

            if (this.items == null || this.liquids == null) return;

            let pColor = COLOR_GRAPHITE;
            if (this.productionStage == 0) pColor = COLOR_GRAPHITE;
            else if (this.productionStage == 1) pColor = COLOR_SILICON;
            else if (this.productionStage == 2) pColor = COLOR_OIL;
            else if (this.productionStage == 3) pColor = COLOR_PLAST;

            if (this.efficiency > 0) {
                let progress = Math.min(1.0, this.craftTimer / CRAFT_TIME);
                let radius = 25 * (1.0 - progress);

                Draw.color(pColor);
                Lines.stroke(2.0 * (1.0 - progress));
                Lines.circle(this.x, this.y, radius);
            }
        },

        triggerInstantDeathExplosion() {
            let explosionRadius = 800; 

            superExplosionFx.at(this.x, this.y);

            Units.nearby(null, this.x, this.y, explosionRadius, cons(unit => {
                unit.kill();
            }));

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

            Fx.impactReactorExplosion.at(this.x, this.y);
            Effect.shake(25, 80, this.x, this.y);

            this.kill();
        },

        updateTile() {
            if (this.liquids == null || this.items == null) return;

            if (this.efficiency > 0) {
                this.hasStartedBefore = true;
            }

            let requiredCryoPerTick = 500.0 / 60.0;
            let hasEnoughCryo = this.liquids.get(Liquids.cryofluid) >= requiredCryoPerTick;
            let overLimit = this.isOverItemLimit();

            // CƠ CHẾ NỔ CẢNH BÁO
            if (this.hasStartedBefore) {
                if (overLimit || (!hasEnoughCryo && this.efficiency > 0)) {
                    this.overheatTimer += Time.delta;

                    if (this.overheatTimer >= 60.0 * 60) {
                        this.triggerInstantDeathExplosion();
                        return;
                    }
                } 
                else if (!overLimit && hasEnoughCryo) {
                    this.liquids.remove(Liquids.cryofluid, requiredCryoPerTick);
                    this.overheatTimer = Math.max(0, this.overheatTimer - Time.delta);
                }
            }

            // LOGIC XẢ HÀNG
            let currentSelection = this.getOutputSelection();
            
            if (currentSelection == 0) {
                if (this.items.get(Items.graphite) > 0) this.dump(Items.graphite);
            } else if (currentSelection == 1) {
                if (this.items.get(Items.silicon) > 0) this.dump(Items.silicon);
            } else if (currentSelection == 2) {
                if (this.items.get(Items.plastanium) > 0) this.dump(Items.plastanium);
            } else if (currentSelection == 3) {
                if (this.items.get(Items.thorium) >= 1) {
                    this.items.remove(Items.thorium, 1);
                    this.dumpGraphiteLeft += 1;
                    this.dumpSiliconLeft += 1;
                    this.dumpPlastaniumLeft += 1;
                } else if (this.items.get(Items.thorium) <= 0) {
                    this.dumpGraphiteLeft = 0;
                    this.dumpSiliconLeft = 0;
                    this.dumpPlastaniumLeft = 0;
                }

                if (this.dumpGraphiteLeft > 0 && this.items.get(Items.graphite) > 0) {
                    if (this.dump(Items.graphite)) this.dumpGraphiteLeft--;
                }
                if (this.dumpSiliconLeft > 0 && this.items.get(Items.silicon) > 0) {
                    if (this.dump(Items.silicon)) this.dumpSiliconLeft--;
                }
                if (this.dumpPlastaniumLeft > 0 && this.items.get(Items.plastanium) > 0) {
                    if (this.dump(Items.plastanium)) this.dumpPlastaniumLeft--;
                }
            }

            if (this.liquids.get(Liquids.oil) > 0) {
                this.dumpLiquid(Liquids.oil);
            }

            if (this.efficiency <= 0) return;

            // ---------------------------------------------------------------------
            // LOGIC SẢN XUẤT TỰ ĐỘNG XOAY VÒNG 4 GIAI ĐOẠN (TẠO 100 SẢN PHẨM/LẦN)
            // ---------------------------------------------------------------------
            this.craftTimer += Time.delta;

            // GIAI ĐOẠN 0: Graphite (Tạo 100 Graphite)
            if (this.productionStage == 0) {
                if (this.items.get(Items.coal) >= 10 && this.items.get(Items.sand) >= 10 && this.items.get(Items.titanium) >= 10) {
                    if (this.craftTimer >= CRAFT_TIME) {
                        this.items.remove(Items.coal, 10);
                        this.items.remove(Items.sand, 10);
                        this.items.remove(Items.titanium, 10);
                        this.items.add(Items.graphite, 100);
                        this.craftTimer = 0;
                        expandCircleFx.at(this.x, this.y, 0, COLOR_GRAPHITE);
                        Effect.shake(2, 5, this.x, this.y);
                        this.productionStage = 1; // Chuyển sang giai đoạn 1
                    }
                }
                return;
            }

            // GIAI ĐOẠN 1: Silicon (Tạo 100 Silicon)
            if (this.productionStage == 1) {
                if (this.items.get(Items.coal) >= 10 && this.items.get(Items.sand) >= 10 && this.items.get(Items.titanium) >= 10) {
                    if (this.craftTimer >= CRAFT_TIME) {
                        this.items.remove(Items.coal, 10);
                        this.items.remove(Items.sand, 10);
                        this.items.remove(Items.titanium, 10);
                        this.items.add(Items.silicon, 100);
                        this.craftTimer = 0;
                        expandCircleFx.at(this.x, this.y, 0, COLOR_SILICON);
                        Effect.shake(2, 5, this.x, this.y);
                        this.productionStage = 2; // Chuyển sang giai đoạn 2
                    }
                }
                return;
            }

            // GIAI ĐOẠN 2: Oil (Tạo 100 Oil)
            if (this.productionStage == 2) {
                if (this.items.get(Items.coal) >= 10 && this.items.get(Items.sand) >= 10 && this.items.get(Items.titanium) >= 10) {
                    if (this.craftTimer >= CRAFT_TIME) {
                        this.items.remove(Items.coal, 10);
                        this.items.remove(Items.sand, 10);
                        this.items.remove(Items.titanium, 10);
                        this.liquids.add(Liquids.oil, 100);
                        this.craftTimer = 0;
                        expandCircleFx.at(this.x, this.y, 0, COLOR_OIL);
                        Effect.shake(2, 5, this.x, this.y);
                        this.productionStage = 3; // Chuyển sang giai đoạn 3
                    }
                }
                return;
            }

            // GIAI ĐOẠN 3: Plastanium (Tạo 100 Plastanium)
            if (this.productionStage == 3) {
                if (this.liquids.get(Liquids.oil) >= 10 && this.items.get(Items.coal) >= 10 && this.items.get(Items.sand) >= 10 && this.items.get(Items.titanium) >= 10) {
                    if (this.craftTimer >= CRAFT_TIME) {
                        this.liquids.remove(Liquids.oil, 10);
                        this.items.remove(Items.coal, 10);
                        this.items.remove(Items.sand, 10);
                        this.items.remove(Items.titanium, 10);
                        this.items.add(Items.plastanium, 100);
                        this.craftTimer = 0;
                        expandCircleFx.at(this.x, this.y, 0, COLOR_PLAST);
                        Effect.shake(2, 5, this.x, this.y);
                        this.productionStage = 0; // Quay trở lại giai đoạn 0
                    }
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

                optTable.add("[yellow]CHỌN SẢN PHẨM ĐẨY RA BĂNG CHUYỀN:[]").padBottom(10).row();
                createOptBtn("Than chì (Graphite)", 0);
                createOptBtn("Silicon", 1);
                createOptBtn("Nhựa (Plastanium)", 2);
                createOptBtn("Xả toàn bộ sản phẩm (Tiêu thụ Thorium)", 3);

                let scroll = new ScrollPane(optTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(350);
                dialog.addCloseButton();
                dialog.show();
            })).size(50, 40);

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = " Thông số Nhà máy Syrufpat ";
                let descStr = "[gold]⚡ QUY TRÌNH SẢN XUẤT TUẦN TỰ (1s/GIAI ĐOẠN) ⚡[]\n\n" +
                              "[cyan]• Lớp 1 (Than chì):[] 10 Coal + 10 Sand + 10 Titanium ➔ [green]100 Graphite[] (1s)\n" +
                              "[cyan]• Lớp 2 (Silicon):[] 10 Coal + 10 Sand + 10 Titanium ➔ [green]100 Silicon[] (1s)\n" +
                              "[cyan]• Lớp 3 (Dầu mỏ):[] 10 Coal + 10 Sand + 10 Titanium ➔ [green]100 Oil[] (1s)\n" +
                              "[cyan]• Lớp 4 (Nhựa Plast):[] 10 Oil + 10 Coal + 10 Sand + 10 Titanium ➔ [green]100 Plastanium[] (1s)\n\n" +
                              "[lightgray]* Quy trình xoay vòng liên tục Lớp 1 ➔ 2 ➔ 3 ➔ 4 ➔ 1 bất kể xả hàng hay không.[]\n\n" +
                              "[gold]⚡ TÙY CHỌN BỎ QUA LỰA CHỌN ⚡[]\n" +
                              "• Mỗi [accent]1 Thorium[] nạp vào cho phép xả đồng loạt [green]1 Graphite, 1 Silicon, 1 Plastanium[] ra ngoài.\n" +
                              "• Hết Thorium nhà máy sẽ ngưng xả hàng ngay lập tức.\n\n" +
                              "[scarlet]⚠ CƠ CHẾ NỔ HỦY DIỆT TẬN THẾ ⚠[]\n" +
                              "• Yêu cầu [cyan]500 Cryofluid/s[] để hạ nhiệt.\n" +
                              "• Đếm ngược 60s nổ khi kho chứa [red]vượt quá 1100 item[] hoặc thiếu Cryofluid.\n" +
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
            write.b(this.productionStage);
            write.i(this.dumpGraphiteLeft);
            write.i(this.dumpSiliconLeft);
            write.i(this.dumpPlastaniumLeft);
        },
        read(read, revision) {
            this.super$read(read, revision);
            this.setOutputSelection(read.b());
            this.overheatTimer = read.f();
            this.hasStartedBefore = read.bool();
            this.productionStage = read.b();
            this.dumpGraphiteLeft = read.i();
            this.dumpSiliconLeft = read.i();
            this.dumpPlastaniumLeft = read.i();
        }
    });
});