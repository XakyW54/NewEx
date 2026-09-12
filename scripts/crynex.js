const packCons2 = (func) => new Cons2({ get: func });
const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

// --- TẠO HIỆU ỨNG LASER TỰ ĐỊNH NGHĨA HOÀN TOÀN KHÔNG DÙNG Fx ---
const customLaserEffect = new Effect(60, new Cons({
    get(e) {
        Draw.color(Color.cyan);
        Lines.stroke(3.0 * e.fout());
        // e.x, e.y là điểm xuất phát; e.rotation, e.color hoặc dùng Linef/Drawf.line
        Lines.line(e.x, e.y, e.rotation, e.data);
        Draw.reset();
    }
}));

Events.on(ContentInitEvent, () => {
    const block = Vars.content.getByName(ContentType.block, "newex-crynex");

    if (block != null) {
        block.hasLiquids = true;
        block.liquidCapacity = 5000;
        block.configurable = true;

        block.config(java.lang.Integer, packCons2((tile, value) => {
            if (tile != null && tile.setTargetPos !== undefined) {
                tile.setTargetPos(value);
            }
        }));

        block.buildType = () => extend(GenericCrafter.GenericCrafterBuild, block, {
            targetX: 0,
            targetY: 0,
            hasTargetSet: false,
            selectingTarget: false,
            baseMaxRange: 204, // Phạm vi hình vuông 51x51 ô
            laserTimer: 0,

            created() {
                this.super$created();
                this.targetX = this.x;
                this.targetY = this.y;
            },

            placed() {
                this.super$placed();
                this.targetX = this.x;
                this.targetY = this.y;
            },

            range() {
                return this.baseMaxRange;
            },

            setTargetPos(val) {
                if (typeof val === "number") {
                    let pos = Point2.unpack(val);
                    let destX = pos.x * Vars.tilesize;
                    let destY = pos.y * Vars.tilesize;

                    if (Math.abs(destX - this.x) <= this.range() && Math.abs(destY - this.y) <= this.range()) {
                        this.targetX = destX;
                        this.targetY = destY;
                        this.hasTargetSet = true;
                    }
                }
            },

            config() {
                if (this.hasTargetSet) {
                    let tileX = Math.floor(this.targetX / Vars.tilesize);
                    let tileY = Math.floor(this.targetY / Vars.tilesize);
                    return java.lang.Integer(Point2.pack(tileX, tileY));
                }
                return null;
            },

            configured(builder, value) {
                this.super$configured(builder, value);
                if (typeof value === "number") {
                    this.setTargetPos(value);
                }
            },

            write(write) {
                this.super$write(write);
                write.f(this.targetX);
                write.f(this.targetY);
                write.bool(this.hasTargetSet);
            },

            read(read, revision) {
                this.super$read(read, revision);
                this.targetX = read.f();
                this.targetY = read.f();
                this.hasTargetSet = read.bool();
            },

            updateTile() {
                this.super$updateTile();

                if (this.selectingTarget) {
                    if (Core.input.keyTap(KeyCode.mouseLeft)) {
                        let worldVec = Core.camera.unproject(Core.input.mouse());
                        let tile = Vars.world.tileWorld(worldVec.x, worldVec.y);
                        
                        if (tile != null) {
                            this.configure(java.lang.Integer(Point2.pack(tile.x, tile.y)));
                        }
                        this.selectingTarget = false;
                    }
                }

                let cryoAmount = this.liquids.get(Liquids.cryofluid);

                // Đếm timer hiệu ứng laser (mỗi 60 frames ~ 1 giây)
                this.laserTimer += this.delta();
                let shouldShowLaser = (this.laserTimer >= 60.0);

                // --- KIỂM TRA ĐIỀU KIỆN KORYND Ở CẠNH BÊN ---
                let hasKoryndAdjacent = false;
                if (this.proximity != null) {
                    this.proximity.each(other => {
                        if (other != null && other.block != null && other.block.name === "newex-korynd") {
                            hasKoryndAdjacent = true;
                        }
                    });
                }

                // Bổ sung kiểm tra hasKoryndAdjacent vào logic dịch chuyển chất lỏng
                if (hasKoryndAdjacent && cryoAmount > 10 && this.hasTargetSet) {
                    let targetBoxRadius = 84; // Vùng mục tiêu hình vuông 21x21 ô

                    Units.nearbyBuildings(this.targetX, this.targetY, targetBoxRadius * 1.5, packCons(other => {
                        if (other != null && other.team === this.team && other.isValid() && other !== this) {
                            if (Math.abs(other.x - this.targetX) <= targetBoxRadius && Math.abs(other.y - this.targetY) <= targetBoxRadius) {
                                
                                if (other.block.hasLiquids && other.liquids != null) {
                                    let maxCap = other.block.liquidCapacity;
                                    let currentLiquid = other.liquids.get(Liquids.cryofluid);

                                    if (currentLiquid < maxCap) {
                                        // Tốc độ dịch chuyển đúng 100 đơn vị / giây (100 / 60 mỗi frame)
                                        let transferRate = (100.0 / 60.0) * this.delta();
                                        let amountToMove = Math.min(transferRate, this.liquids.get(Liquids.cryofluid) - 10);
                                        amountToMove = Math.min(amountToMove, maxCap - currentLiquid);

                                        if (amountToMove > 0) {
                                            this.liquids.remove(Liquids.cryofluid, amountToMove);
                                            other.handleLiquid(this, Liquids.cryofluid, amountToMove);

                                            // Gọi custom effect, truyền tọa độ đích vào rotation và data
                                            if (shouldShowLaser) {
                                                customLaserEffect.at(this.x, this.y, other.x, other.y);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }));
                }

                if (shouldShowLaser) {
                    this.laserTimer = 0;
                }
            },

            buildConfiguration(table) {
                table.clear(); table.row();
                
                table.button(Icon.commandRally, Styles.cleari, 40, packRun(() => {
                    this.deselect();
                    this.selectingTarget = true;
                    Vars.ui.hudfrag.showToast(isEn() ? "Select target location to teleport Cryofluid!" : "Chọn vị trí mục tiêu để dịch chuyển Chất làm lạnh!");
                })).size(50, 40).tooltip(isEn() ? "Set Teleport Target Zone" : "Đặt vị trí Dịch chuyển Chất làm lạnh");

                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let descStr = isEn() ?
                        "[accent]Crynex Teleport Info[]\n\n" +
                        "• Liquid Capacity: [cyan]5000[] units.\n" +
                        "• Range: [cyan]51x51 blocks[].\n" +
                        "• Transfer Speed: [yellow]100 units/s[].\n" +
                        "• When holding [cyan]> 10 Cryofluid[], teleports Cryofluid directly to allied buildings in target zone." :
                        "[accent]Thông số khối Crynex[]\n\n" +
                        "• Sức chứa chất lỏng: [cyan]5000[] units.\n" +
                        "• Phạm vi hoạt động: [cyan]Vùng vuông 51x51 ô[].\n" +
                        "• Tốc độ dịch chuyển: [yellow]100 đơn vị/giây[].\n" +
                        "• Khi có [cyan]> 10 Chất làm lạnh[], tự động dịch chuyển đến công trình đồng minh tại khu vực mục tiêu.";

                    let dialog = extend(BaseDialog, isEn() ? " Crynex Stats " : " Thông số Crynex ", {});
                    let infoTable = new Table();
                    let cell = infoTable.add(descStr).width(360);
                    cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                    let scroll = new ScrollPane(infoTable);
                    scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400);
                    dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip(isEn() ? "View detailed info" : "Mô tả chi tiết khối Crynex");
            },

            drawSquareRange(cx, cy, halfSize, color) {
                Drawf.dashLine(color, cx - halfSize, cy - halfSize, cx + halfSize, cy - halfSize);
                Drawf.dashLine(color, cx + halfSize, cy - halfSize, cx + halfSize, cy + halfSize);
                Drawf.dashLine(color, cx + halfSize, cy + halfSize, cx - halfSize, cy + halfSize);
                Drawf.dashLine(color, cx - halfSize, cy + halfSize, cx - halfSize, cy - halfSize);
            },

            drawSelect() {
                this.super$drawSelect();
                this.drawSquareRange(this.x, this.y, this.range(), Color.cyan);
            },

            drawConfigure() {
                this.super$drawConfigure();
                let currentRange = this.range();

                this.drawSquareRange(this.x, this.y, currentRange, Color.cyan);

                if (this.hasTargetSet && Math.abs(this.targetX - this.x) <= currentRange && Math.abs(this.targetY - this.y) <= currentRange) {
                    Drawf.dashLine(Color.cyan, this.x, this.y, this.targetX, this.targetY);
                    this.drawSquareRange(this.targetX, this.targetY, 84, Color.cyan);
                    Drawf.square(this.targetX, this.targetY, 6.0, 0, Color.cyan);
                }
            },

            draw() {
                this.super$draw();

                if (this.selectingTarget) {
                    let currentRange = this.range();
                    this.drawSquareRange(this.x, this.y, currentRange, Color.cyan);

                    let mouseWorld = Core.camera.unproject(Core.input.mouse());
                    let isWithinRange = Math.abs(mouseWorld.x - this.x) <= currentRange && Math.abs(mouseWorld.y - this.y) <= currentRange;
                    let targetColor = isWithinRange ? Color.cyan : Color.red;

                    Drawf.dashLine(targetColor, this.x, this.y, mouseWorld.x, mouseWorld.y);
                    this.drawSquareRange(mouseWorld.x, mouseWorld.y, 84, targetColor);

                    let mouseTile = Vars.world.tileWorld(mouseWorld.x, mouseWorld.y);
                    if (mouseTile != null) {
                        Drawf.square(mouseTile.drawx(), mouseTile.drawy(), 4, 0, targetColor);
                    }
                }
            }
        });
    }
});

Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && build.name === "newex-crynex") {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        if (tile != null) {
            let cx = tile.drawx() + build.offset;
            let cy = tile.drawy() + build.offset;
            let halfSize = 204;
            
            // Vẽ phạm vi vùng 51x51 bao quanh
            Drawf.dashLine(Color.cyan, cx - halfSize, cy - halfSize, cx + halfSize, cy - halfSize);
            Drawf.dashLine(Color.cyan, cx + halfSize, cy - halfSize, cx + halfSize, cy + halfSize);
            Drawf.dashLine(Color.cyan, cx + halfSize, cy + halfSize, cx - halfSize, cy + halfSize);
            Drawf.dashLine(Color.cyan, cx - halfSize, cy + halfSize, cx - halfSize, cy - halfSize);

            // Ô nhỏ hiển thị đúng ngay tại tâm con trỏ chuột (đường nét liền trơn, không gạch đứt)
            Drawf.square(cx, cy, 4, 0, Color.cyan);
        }
    }
});