const packCons2 = (func) => new Cons2({ get: func });
const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

// Đạn đánh chặn tốc độ cao vẽ bằng Sprite sonicor-bullet
const interceptBulletType = extend(BasicBulletType, {
    speed: 24,
    damage: 0,
    lifetime: 20,
    width: 8,
    height: 16,
    frontColor: Color.white,
    backColor: Pal.accent,
    hitEffect: Fx.hitLaser,
    despawnEffect: Fx.hitLaser,
    collides: false,
    collidesTiles: false,
    collidesAir: false,
    collidesGround: false,
    
    sprite: "newex-sonicor-bullet",
    
    draw(b) {
        let region = Core.atlas.find("newex-sonicor-bullet", Core.atlas.find("sonicor-bullet", Core.atlas.find("bullet")));
        Draw.color(Pal.accent);
        Draw.rect(region, b.x, b.y, b.rotation() - 90);
        Draw.reset();
    }
});

// Hiệu ứng sóng âm dạng vòng tròn lan tỏa
function drawSonicWave(x, y, radius, alpha) {
    if (radius <= 0 || alpha <= 0) return;
    Draw.color(Pal.accent);
    Draw.alpha(alpha);
    Lines.stroke(3);
    Lines.circle(x, y, radius);
    Draw.reset();
}

// Hàm vẽ khung hình chữ nhật kiểu chuẩn Vanilla Mindustry
function drawVanillaRect(x, y, width, height, color, alpha) {
    if (alpha === undefined) alpha = 1.0;
    if (alpha <= 0) return;

    Draw.color(color);
    Draw.alpha(alpha);
    
    Lines.dashLine(x, y, x + width, y, Math.floor(width / 8));
    Lines.dashLine(x + width, y, x + width, y + height, Math.floor(height / 8));
    Lines.dashLine(x + width, y + height, x, y + height, Math.floor(width / 8));
    Lines.dashLine(x, y + height, x, y, Math.floor(height / 8));

    let cornerLen = 6;
    Drawf.square(x, y, cornerLen, 0, color);
    Drawf.square(x + width, y, cornerLen, 0, color);
    Drawf.square(x + width, y + height, cornerLen, 0, color);
    Drawf.square(x, y + height, cornerLen, 0, color);

    Draw.reset();
}

Events.on(ContentInitEvent, () => {
    const sonicorBlock = Vars.content.getByName(ContentType.block, "newex-sonicor");

    if (sonicorBlock != null) {
        sonicorBlock.configurable = true;

        sonicorBlock.config(java.lang.Integer, packCons2((tile, value) => {
            if (tile != null && tile.setTargetPosition !== undefined) {
                tile.setTargetPosition(value);
            }
        }));

        sonicorBlock.buildType = () => extend(Building, {
            targetX: 0,
            targetY: 0,
            rectWidth: 80,
            selectingTarget: false,
            baseMaxRange: 320,

            linkedWithDTG: false,
            dtgBuilding: null,
            savedDtgTileX: -1,
            savedDtgTileY: -1,
            
            sonicTimer: 0,
            waveProgress: 0,
            isWaveActive: false,
            
            shootTimer: 0,

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

            setTargetPosition(val) {
                let pos = Point2.unpack(val);
                this.targetX = pos.x * Vars.tilesize;
                this.targetY = pos.y * Vars.tilesize;
            },

            getTargetPosition() {
                return Point2.pack(Math.floor(this.targetX / Vars.tilesize), Math.floor(this.targetY / Vars.tilesize));
            },

            getRectBounds(tx, ty) {
                let minX = Math.min(this.x, tx) - this.rectWidth / 2;
                let minY = Math.min(this.y, ty) - this.rectWidth / 2;
                let width = Math.abs(tx - this.x) + this.rectWidth;
                let height = Math.abs(ty - this.y) + this.rectWidth;
                return { minX: minX, minY: minY, width: width, height: height };
            },

            buildConfiguration(table) {
                table.clear(); 
                table.row();

                table.button(Icon.commandRally, Styles.cleari, 40, packRun(() => {
                    this.deselect();
                    this.selectingTarget = true;
                    Vars.ui.hudfrag.showToast(isEn() ? "Select target to form rectangular wave zone!" : "Nhấp chọn vị trí để tạo vùng hình chữ nhật!");
                })).size(50, 40).tooltip(isEn() ? "Set Wave Rect Zone" : "Đặt vị trí vùng chữ nhật sóng âm");

                table.button(Icon.link, Styles.cleari, 40, packRun(() => {
                    let found = null;
                    Units.nearbyBuildings(this.x, this.y, 240, packCons(b => {
                        if (b.block.name.includes("soldern") || b.block.name.includes("dtg")) {
                            found = b;
                        }
                    }));

                    if (found != null) {
                        this.dtgBuilding = found;
                        this.linkedWithDTG = true;
                        this.savedDtgTileX = found.tileX();
                        this.savedDtgTileY = found.tileY();
                        Fx.select.at(found.x, found.y);
                        Vars.ui.showInfoToast(isEn() ? "[green]Linked with DTG-Soldern! Interception Active.[]" : "[green]Đã liên kết với DTG-Soldern! Kích hoạt đạn đánh chặn.[]", 3);
                    } else {
                        this.linkedWithDTG = false;
                        this.dtgBuilding = null;
                        this.savedDtgTileX = -1;
                        this.savedDtgTileY = -1;
                        Fx.smeltsmoke.at(this.x, this.y);
                        Vars.ui.showInfoToast(isEn() ? "[red]No DTG-Soldern found within range![]" : "[red]Không tìm thấy công trình liên kết trong phạm vi![]", 3);
                    }
                    this.deselect();
                })).size(50, 40).tooltip(isEn() ? "Link with DTG-Soldern for Buff" : "Liên kết với DTG-Soldern nhận Buff");

                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = isEn() ? " Sonicor Turret Stats " : " Thông số pháo Sonicor ";
                    let isLinked = (this.linkedWithDTG && this.dtgBuilding != null && this.dtgBuilding.isValid());

                    let descStr = isEn() ?
                        "[gold]⚡ SONICOR WAVE TURRET ⚡[]\n" +
                        "[lightgray]Status:[] " + (isLinked ? "[green]Linked with DTG-Soldern[]" : "[yellow]Standalone Mode[]") + "\n" +
                        "[lightgray]Base Damage:[] [red]10% Max HP / wave[]\n" +
                        "[lightgray]Target Type:[] [sky]Air Units Only[]\n\n" +
                        "[sky]⚡ MECHANICS:[]\n" +
                        "• [yellow]Sonic Pulse Repulsion:[] Deals 10% Max HP damage then repels all air units out of the zone.\n" +
                        "• [yellow]DTG-Soldern Link:[] Intercepts enemy bullets inside the zone with Sonicor Bullets." :
                        "[gold]⚡ THÔNG SỐ PHÁO SÓNG ÂM SONICOR ⚡[]\n" +
                        "[lightgray]Trạng thái:[] " + (isLinked ? "[green]Đã liên kết DTG-Soldern[]" : "[yellow]Chế độ độc lập[]") + "\n" +
                        "[lightgray]Sát thương cơ bản:[] [red]10% Max HP / đợt[]\n" +
                        "[lightgray]Mục tiêu:[] [sky]Chỉ không quân[]\n\n" +
                        "[sky]⚡ CƠ CHẾ HOẠT ĐỘNG:[]\n" +
                        "• [yellow]Sóng âm đẩy lùi:[] Gây 10% Max HP sát thương rồi đẩy văng mọi loại unit bay ra khỏi vùng chữ nhật.\n" +
                        "• [yellow]Liên kết DTG-Soldern:[] Bắn đạn Sonicor đánh chặn đạn địch đi vào vùng hình chữ nhật.";

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
                })).size(50, 40).tooltip(isEn() ? "View detailed stats" : "Xem thông số chi tiết pháo");
            },

            config() { 
                return java.lang.Integer(this.getTargetPosition()); 
            },

            configured(builder, value) {
                this.super$configured(builder, value);
                if (typeof value === "number") {
                    let pos = Point2.unpack(value);
                    let destX = pos.x * Vars.tilesize;
                    let destY = pos.y * Vars.tilesize;

                    if (Mathf.dst(this.x, this.y, destX, destY) <= this.range()) {
                        this.targetX = destX;
                        this.targetY = destY;
                        Fx.select.at(destX, destY);
                    } else {
                        Fx.smeltsmoke.at(destX, destY);
                    }
                }
            },

            // CỐ ĐỊNH LỖI MẤT LIÊN KẾT KHI OUT MAP: Ghi thêm tọa độ ô Tile của DTG-Soldern
            write(write) {
                this.super$write(write);
                write.f(this.targetX);
                write.f(this.targetY);
                write.bool(this.linkedWithDTG);
                write.i(this.dtgBuilding != null ? this.dtgBuilding.tileX() : (this.savedDtgTileX || -1));
                write.i(this.dtgBuilding != null ? this.dtgBuilding.tileY() : (this.savedDtgTileY || -1));
            },

            read(read, revision) {
                this.super$read(read, revision);
                this.targetX = read.f();
                this.targetY = read.f();
                this.linkedWithDTG = read.bool();
                this.savedDtgTileX = read.i();
                this.savedDtgTileY = read.i();
            },

            updateTile() {
                this.super$updateTile();

                // TỰ ĐỘNG KHÔI PHỤC THỰC THỂ DTG-SOLDERN KHI VÀO LẠI MAP
                if (this.linkedWithDTG && (this.dtgBuilding == null || !this.dtgBuilding.isValid())) {
                    if (this.savedDtgTileX >= 0 && this.savedDtgTileY >= 0) {
                        let building = Vars.world.build(this.savedDtgTileX, this.savedDtgTileY);
                        if (building != null && building.team == this.team && (building.block.name.includes("soldern") || building.block.name.includes("dtg"))) {
                            this.dtgBuilding = building;
                        } else {
                            // Nếu pháo DTG đã bị phá hủy thì hủy liên kết
                            this.linkedWithDTG = false;
                            this.dtgBuilding = null;
                        }
                    }
                }

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

                if (this.efficiency <= 0) return;

                let rect = this.getRectBounds(this.targetX, this.targetY);
                this.sonicTimer += Time.delta;

                // --- 1. SÓNG ÂM ĐẨY LÙI MỖI 2S ---
                if (this.sonicTimer >= 120) {
                    let hasEnemyAir = false;

                    Groups.unit.intersect(rect.minX, rect.minY, rect.width, rect.height, packCons(u => {
                        if (u.team != this.team && u.isFlying()) {
                            hasEnemyAir = true;
                        }
                    }));

                    if (hasEnemyAir) {
                        this.sonicTimer = 0;
                        this.isWaveActive = true;
                        this.waveProgress = 0;

                        Groups.unit.intersect(rect.minX, rect.minY, rect.width, rect.height, packCons(unit => {
                            if (unit.team != this.team && unit.isFlying()) {
                                let damageAmount = unit.maxHealth * 0.10;
                                unit.damage(damageAmount);

                                let angle = Angles.angle(this.x, this.y, unit.x, unit.y);
                                let pushDistance = 60; 
                                let pushX = Mathf.cosDeg(angle) * pushDistance;
                                let pushY = Mathf.sinDeg(angle) * pushDistance;

                                unit.vel.add(pushX * 0.2, pushY * 0.2);
                                unit.moveAt(Tmp.v1.set(pushX, pushY));

                                Fx.hitLaser.at(unit.x, unit.y);
                            }
                        }));
                    }
                }

                if (this.isWaveActive) {
                    this.waveProgress += (Time.delta / 30);
                    if (this.waveProgress >= 1.0) {
                        this.isWaveActive = false;
                        this.waveProgress = 0;
                    }
                }

                // --- 2. BẮN ĐẠN ĐÁNH CHẶN ĐẠN ĐỊCH NẾU CÓ ĐÃ LIÊN KẾT ---
                if (this.shootTimer > 0) {
                    this.shootTimer -= Time.delta;
                }

                if (this.linkedWithDTG && this.dtgBuilding != null && this.dtgBuilding.isValid()) {
                    let targetBullet = null;

                    Groups.bullet.intersect(rect.minX, rect.minY, rect.width, rect.height, packCons(b => {
                        if (targetBullet == null && b.team != this.team && b.type != interceptBulletType) {
                            targetBullet = b;
                        }
                    }));

                    if (targetBullet != null && this.shootTimer <= 0) {
                        let angle = Angles.angle(this.x, this.y, targetBullet.x, targetBullet.y);
                        
                        interceptBulletType.create(this, this.team, this.x, this.y, angle, 1.0);
                        Fx.shootBig.at(this.x, this.y, angle);

                        Fx.hitLaser.at(targetBullet.x, targetBullet.y);
                        targetBullet.remove();

                        this.shootTimer = 6;
                    }
                }
            },

            drawConfigure() {
                this.super$drawConfigure();
                let currentRange = this.range();
                let rect = this.getRectBounds(this.targetX, this.targetY);

                Draw.z(Layer.overlayUI);
                Drawf.dashCircle(this.x, this.y, currentRange, Pal.accent);

                if (Mathf.dst(this.x, this.y, this.targetX, this.targetY) <= currentRange) {
                    Drawf.dashLine(Pal.accent, this.x, this.y, this.targetX, this.targetY);
                    drawVanillaRect(rect.minX, rect.minY, rect.width, rect.height, Pal.accent, 1.0);
                }

                if (this.linkedWithDTG && this.dtgBuilding != null && this.dtgBuilding.isValid()) {
                    Drawf.dashLine(Pal.heal, this.x, this.y, this.dtgBuilding.x, this.dtgBuilding.y);
                }

                if (this.isWaveActive) {
                    let centerX = (this.x + this.targetX) / 2;
                    let centerY = (this.y + this.targetY) / 2;
                    let maxRadius = Math.max(rect.width, rect.height) / 2;
                    let currentRadius = this.waveProgress * maxRadius;
                    let alpha = 1.0 - this.waveProgress;
                    
                    drawSonicWave(centerX, centerY, currentRadius, alpha);
                }

                Draw.reset();
            },

            draw() {
                this.super$draw();

                let rect = this.getRectBounds(this.targetX, this.targetY);

                if (this.isWaveActive) {
                    let alpha = 1.0 - this.waveProgress;

                    Draw.z(Layer.effect);
                    drawVanillaRect(rect.minX, rect.minY, rect.width, rect.height, Pal.accent, alpha);

                    let topRegion = Core.atlas.find("newex-sonicor-top", Core.atlas.find("sonicor-top", this.block.region));
                    if (topRegion.found()) {
                        let scale = 1.0 + (this.waveProgress * 0.8);

                        Draw.z(Layer.turret + 0.1);
                        Draw.color(Pal.accent);
                        Draw.alpha(alpha);
                        Draw.rect(topRegion, this.x, this.y, topRegion.width * Draw.scl * scale, topRegion.height * Draw.scl * scale);
                        Draw.reset();
                    }
                }

                if (this.selectingTarget) {
                    let currentRange = this.range();
                    
                    Draw.z(Layer.overlayUI);
                    Drawf.dashCircle(this.x, this.y, currentRange, Pal.accent);

                    let mouseWorld = Core.camera.unproject(Core.input.mouse());
                    let dist = Mathf.dst(this.x, this.y, mouseWorld.x, mouseWorld.y);
                    let isWithinRange = dist <= currentRange;
                    let targetColor = isWithinRange ? Pal.accent : Color.red;

                    Drawf.dashLine(targetColor, this.x, this.y, mouseWorld.x, mouseWorld.y);

                    let mouseTile = Vars.world.tileWorld(mouseWorld.x, mouseWorld.y);
                    let tx = mouseTile != null ? mouseTile.drawx() : mouseWorld.x;
                    let ty = mouseTile != null ? mouseTile.drawy() : mouseWorld.y;

                    let previewRect = this.getRectBounds(tx, ty);
                    
                    drawVanillaRect(previewRect.minX, previewRect.minY, previewRect.width, previewRect.height, targetColor, 1.0);

                    Draw.reset();
                }
            }
        });
    }
});