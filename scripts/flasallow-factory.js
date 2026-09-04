const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

// Effect vòng tròn mở rộng khi hoàn thành mẻ sản xuất
const expandCircleFx = new Effect(25, cons(e => {
    let radius = 25 * e.fin(); 
    Draw.color(e.color);
    Lines.stroke(2.5 * e.fout()); 
    Lines.circle(e.x, e.y, radius);
}));

// Effect nổ siêu cấp (bán kính 1600 ô)
const doubleSuperExplosionFx = new Effect(80, cons(e => {
    let maxRadius = 1600; 
    let innerRadius = maxRadius * e.fin(); 

    Draw.color(Color.scarlet);
    Draw.alpha(0.4 * e.fout());
    
    let fillThickness = maxRadius - innerRadius;
    if (fillThickness > 0) {
        Lines.stroke(fillThickness);
        Lines.circle(e.x, e.y, innerRadius + fillThickness / 2);
    }

    Draw.color(Color.white);
    Draw.alpha(e.fout());
    Lines.stroke(10.0 * e.fout());
    Lines.circle(e.x, e.y, maxRadius);

    Draw.color(Color.orange);
    Draw.alpha(e.fout());
    Lines.stroke(6.0 * e.fout());
    Lines.circle(e.x, e.y, innerRadius);
}));

const COLOR_SURGE  = Color.valueOf("f3e979");
const COLOR_EMERALIFT = Color.valueOf("38e250");
const COLOR_REDSTONE  = Color.valueOf("ff3b3b");

const BASE_CRAFT_TIME = 185; // Craft time cơ bản theo json

Events.on(ContentInitEvent, () => {
    const flasallowFactory = Vars.content.getByName(ContentType.block, "newex-flasallow-factory");

    if (flasallowFactory == null) return;

    flasallowFactory.configurable = true;
    flasallowFactory.hasLiquids = true;
    flasallowFactory.hasItems = true;

    if (flasallowFactory.liquidCapacity <= 0) {
        flasallowFactory.liquidCapacity = 500;
    }

    // Lấy các Content tham chiếu
    const emeraliftWall = Vars.content.getByName(ContentType.block, "newex-emeralift-wall");
    const redstoneWall  = Vars.content.getByName(ContentType.block, "newex-redstone-wall");
    const itemNewexObs  = Vars.content.getByName(ContentType.item, "newex-obs");
    const itemNewexSallowyr = Vars.content.getByName(ContentType.item, "newex-sallowyr");

    // Khai báo Bar đếm ngược đúng chuẩn Engine Mindustry
    flasallowFactory.setBars();
    flasallowFactory.addBar("obs_status", e => new Bar(
        prov(() => {
            if (e.obsTimer > 0) {
                return "[scarlet]NỔ DO OBS TRONG: " + Math.ceil(e.obsTimer / 60) + "s[]";
            }
            return "TRẠNG THÁI: AN TOÀN";
        }),
        prov(() => e.obsTimer > 0 ? Color.red : Color.green),
        floatp(() => e.obsTimer > 0 ? (e.obsTimer / (5.0 * 60.0 * 60.0)) : 1.0)
    ));

    flasallowFactory.config(java.lang.Integer, packCons2((tile, value) => {
        if (tile != null) {
            let val = Number(value);
            if (val === 0 || val === 1) {
                tile.setBuffEnabled(val === 1);
            }
        }
    }));

    flasallowFactory.buildType = () => extend(GenericCrafter.GenericCrafterBuild, flasallowFactory, {
        created() {
            this.super$created();
            this.craftTimer = 0;
            this.obsTimer = 0; 
            this.sallowyrCounter = 0;

            this._buffEnabled = true;
            this.hasEmeraliftNearby = false;
            this.hasRedstoneNearby = false;
            
            // Theo dõi số lượng tường buff đang kết nối
            this.lastEmeraliftCount = 0;
            this.lastRedstoneCount = 0;

            return this;
        },

        setBuffEnabled(enabled) {
            this._buffEnabled = enabled;
            // Reset số lượng lưu trữ khi tắt nhận buff
            if (!enabled) {
                this.lastEmeraliftCount = 0;
                this.lastRedstoneCount = 0;
                this.hasEmeraliftNearby = false;
                this.hasRedstoneNearby = false;
            }
        },

        isBuffEnabled() {
            return this._buffEnabled;
        },

        acceptItem(source, item) {
            if (this.items == null) return false;

            if (itemNewexObs != null && item == itemNewexObs) {
                return this.items.get(itemNewexObs) < flasallowFactory.itemCapacity;
            }

            if (item == Items.copper || item == Items.lead || item == Items.titanium || item == Items.silicon || item == Items.thorium) {
                return this.items.get(item) < flasallowFactory.itemCapacity;
            }

            return false;
        },

        acceptLiquid(source, liquid) {
            return (liquid == Liquids.cryofluid || liquid == Liquids.oil) && 
                   this.liquids != null && this.liquids.get(liquid) < flasallowFactory.liquidCapacity;
        },

        checkNearbyWalls() {
            // Nếu tắt buff thì bỏ qua kiểm tra
            if (!this._buffEnabled) {
                this.hasEmeraliftNearby = false;
                this.hasRedstoneNearby = false;
                this.lastEmeraliftCount = 0;
                this.lastRedstoneCount = 0;
                return;
            }

            let currentEmeralift = 0;
            let currentRedstone = 0;

            let range = Math.ceil(flasallowFactory.size / 2) + 1;
            let startX = this.tileX() - range;
            let startY = this.tileY() - range;
            let endX = this.tileX() + range;
            let endY = this.tileY() + range;

            for (let x = startX; x <= endX; x++) {
                for (let y = startY; y <= endY; y++) {
                    let tile = Vars.world.tile(x, y);
                    if (tile != null && tile.build != null && tile.build != this) {
                        let block = tile.build.block;
                        if (emeraliftWall != null && block == emeraliftWall) {
                            currentEmeralift++;
                        }
                        if (redstoneWall != null && block == redstoneWall) {
                            currentRedstone++;
                        }
                    }
                }
            }

            // KIỂM TRA TỰ ĐỘNG NỔ: Nếu lượng tường buff hiện tại ít hơn lượng tường buff đã nhận trước đó -> NỔ!
            if ((currentEmeralift < this.lastEmeraliftCount) || (currentRedstone < this.lastRedstoneCount)) {
                this.triggerDoubleSuperExplosion();
                return;
            }

            // Cập nhật số lượng tường hiện tại
            this.lastEmeraliftCount = currentEmeralift;
            this.lastRedstoneCount = currentRedstone;
            this.hasEmeraliftNearby = currentEmeralift > 0;
            this.hasRedstoneNearby = currentRedstone > 0;
        },

        triggerDoubleSuperExplosion() {
            let explosionRadius = 1600; 

            doubleSuperExplosionFx.at(this.x, this.y);

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
            Effect.shake(50, 160, this.x, this.y);

            this.kill();
        },

        draw() {
            if (flasallowFactory.drawer != null) {
                flasallowFactory.drawer.draw(this);
            } else {
                this.super$draw();
            }

            if (this.efficiency > 0) {
                let progress = Math.min(1.0, this.craftTimer / BASE_CRAFT_TIME);
                let radius = 25 * (1.0 - progress);

                Draw.color(COLOR_SURGE);
                Lines.stroke(2.0 * (1.0 - progress));
                Lines.circle(this.x, this.y, radius);
            }

            if (this._buffEnabled) {
                Draw.draw(Layer.overlayUI, packRun(() => {
                    let detectRadius = (flasallowFactory.size / 2 + 1) * Vars.tilesize;

                    if (this.hasEmeraliftNearby) {
                        Draw.color(COLOR_EMERALIFT);
                        Draw.alpha(0.6 + 0.4 * Mathf.absin(Time.time, 6.0, 1.0));
                        Lines.stroke(2.5);
                        Lines.circle(this.x, this.y, detectRadius);
                        
                        Draw.alpha(0.15);
                        Fill.circle(this.x, this.y, detectRadius);
                    }

                    if (this.hasRedstoneNearby) {
                        Draw.color(COLOR_REDSTONE);
                        Draw.alpha(0.6 + 0.4 * Mathf.absin(Time.time, 6.0, 1.0));
                        Lines.stroke(2.5);
                        Lines.square(this.x, this.y, detectRadius);
                        
                        Draw.alpha(0.15);
                        Fill.square(this.x, this.y, detectRadius);
                    }
                    Draw.reset();
                }));
            }
        },

        drawSelect() {
            this.super$drawSelect();

            if (this._buffEnabled) {
                Draw.draw(Layer.overlayUI, packRun(() => {
                    let detectRadius = (flasallowFactory.size / 2 + 1) * Vars.tilesize;
                    
                    Draw.color(COLOR_EMERALIFT);
                    Lines.stroke(2.0);
                    Lines.circle(this.x, this.y, detectRadius);

                    Draw.color(COLOR_REDSTONE);
                    Lines.stroke(2.0);
                    Lines.square(this.x, this.y, detectRadius);
                    Draw.reset();
                }));
            }
        },

        updateTile() {
            if (this.liquids == null || this.items == null) return;

            // Kiểm tra trạng thái khối tường buff mỗi 10 ticks để phản hồi nổ tức thì
            if (this.timer.get(0, 10)) {
                this.checkNearbyWalls();
            }

            // Xử lý tiêu thụ OBS và sinh Sallowyr mỗi 1 giây (60 ticks)
            if (itemNewexObs != null && this.items.get(itemNewexObs) > 0) {
                if (this.obsTimer <= 0) {
                    this.obsTimer = 5 * 60 * 60; // 5 phút đếm ngược nổ
                }

                this.sallowyrCounter += Time.delta;
                if (this.sallowyrCounter >= 60.0) {
                    this.sallowyrCounter -= 60.0;
                    
                    this.items.remove(itemNewexObs, 1);
                    
                    if (itemNewexSallowyr != null) {
                        this.items.add(itemNewexSallowyr, 1);
                    }
                }
            } else {
                this.sallowyrCounter = 0;
            }

            // Xử lý đếm ngược nổ do OBS
            let isObsActive = this.obsTimer > 0;
            if (isObsActive) {
                this.obsTimer -= Time.delta;

                if (this.obsTimer <= 0) {
                    this.triggerDoubleSuperExplosion();
                    return;
                }
            }

            // Tự động đẩy sản phẩm ra ngoài
            if (this.items.get(Items.phaseFabric) > 0) this.dump(Items.phaseFabric);
            if (this.items.get(Items.surgeAlloy) > 0) this.dump(Items.surgeAlloy);
            if (this.items.get(Items.plastanium) > 0) this.dump(Items.plastanium);
            if (itemNewexSallowyr != null && this.items.get(itemNewexSallowyr) > 0) this.dump(itemNewexSallowyr);

            if (this.efficiency <= 0) return;

            let speedMultiplier = isObsActive ? 16.0 : 1.0;

            if (this.items.get(Items.copper) >= 50 &&
                this.items.get(Items.lead) >= 50 &&
                this.items.get(Items.titanium) >= 50 &&
                this.items.get(Items.silicon) >= 50 &&
                this.items.get(Items.thorium) >= 50 &&
                this.liquids.get(Liquids.oil) >= 150) {

                this.craftTimer += Time.delta * speedMultiplier;

                if (this.craftTimer >= BASE_CRAFT_TIME) {
                    this.craftTimer = 0;

                    this.items.remove(Items.copper, 50);
                    this.items.remove(Items.lead, 50);
                    this.items.remove(Items.titanium, 50);
                    this.items.remove(Items.silicon, 50);
                    this.items.remove(Items.thorium, 50);
                    this.liquids.remove(Liquids.oil, 150);

                    let phaseAmount = 100;
                    let surgeAmount = (this._buffEnabled && this.hasRedstoneNearby) ? 100 * 5 : 100;
                    let plastAmount = (this._buffEnabled && this.hasEmeraliftNearby) ? 100 * 5 : 100;

                    this.items.add(Items.phaseFabric, phaseAmount);
                    this.items.add(Items.surgeAlloy, surgeAmount);
                    this.items.add(Items.plastanium, plastAmount);

                    expandCircleFx.at(this.x, this.y, 0, COLOR_SURGE);
                    Effect.shake(3, 8, this.x, this.y);
                }
            }
        },

        onConfigureBuild(tile) {
            return true;
        },

        buildConfiguration(table) {
            table.clear();

            table.button(Icon.settings, Styles.cleari, 40, packRun(() => {
                let newState = !this._buffEnabled;
                this.setBuffEnabled(newState);
                this.configure(newState ? 1 : 0);
            })).update(btn => {
                btn.getStyle().imageUpColor = this._buffEnabled ? Color.lime : Color.gray;
            }).size(50, 40);

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = " Thông số Nhà máy Flasallow Factory ";
                let descStr = "[gold]⚡ NGUYÊN LIỆU TIÊU THỤ & ĐẦU RA ⚡[]\n\n" +
                              "• [cyan]Nguyên liệu/mẻ:[] 50 Đồng + 50 Chì + 50 Titanium + 50 Silicon + 50 Thorium + 150 Dầu mỏ\n" +
                              "• [green]Sản lượng cơ sở:[] 100 Sợi lượng tử + 100 Hợp kim + 100 Nhựa\n\n" +
                              "[gold]⚡ TÍNH NĂNG NHẬN BUFF LÂN CẬN ⚡[]\n" +
                              "• Nhấn [yellow]Nút Con Vít[] để [lime]Bật[] hoặc [red]Tắt[] tính năng nhận Buff & Hiển thị phạm vi.\n" +
                              "• Đặt cạnh [green]Emeralift Wall[] ➔ Sản xuất Plastanium [lime]gấp 5 lần[] (500/mẻ)\n" +
                              "• Đặt cạnh [red]Redstone Wall[] ➔ Sản xuất Surge Alloy [yellow]gấp 5 lần[] (500/mẻ)\n" +
                              "• [scarlet]⚠ CẢNH BÁO:[] Nếu khối tường buff lân cận bị phá hủy/mất khi BẬT BUFF ➔ [red]NHÀ MÁY LẬP TỨC NỔ SIÊU CẤP![] (Tắt nhận buff trước khi phá tường để an toàn).\n\n" +
                              "[scarlet]⚡ QUÁ TẢI TIÊU THỤ NEWEX-OBS ⚡[]\n" +
                              "• Tiêu thụ [accent]1 newex-obs/giây[] để tạo ra [cyan]1 newex-sallowyr[]\n" +
                              "  - Tăng tốc độ sản xuất lên [yellow]1500%[] (x16 lần tốc độ)\n" +
                              "  - [red]Kích hoạt đếm ngược 5 phút (300s). Hết 5 phút sẽ nổ siêu cấp![]\n\n" +
                              "[scarlet]⚠ BÁN KÍNH NỔ ⚠[]\n" +
                              "• [red]BÁN KÍNH NỔ: 1600 Ô![] San phẳng toàn bộ Unit & Block xung quanh!";

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

        config() { return this._buffEnabled ? 1 : 0; },

        write(write) {
            this.super$write(write);
            write.bool(this._buffEnabled);
            write.f(this.obsTimer);
            write.f(this.sallowyrCounter);
            write.i(this.lastEmeraliftCount);
            write.i(this.lastRedstoneCount);
        },
        read(read, revision) {
            this.super$read(read, revision);
            this._buffEnabled = read.bool();
            this.obsTimer = read.f();
            this.sallowyrCounter = read.f();
            this.lastEmeraliftCount = read.i();
            this.lastRedstoneCount = read.i();
        }
    });
});