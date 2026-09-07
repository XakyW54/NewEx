const globalLockedTiles = new Set();

Events.on(ContentInitEvent, () => {
    const drexkouDrill = Vars.content.block("newex-drexkou-drills");

    if (drexkouDrill != null) {
        drexkouDrill.configurable = true;

        // Cấu hình kho chứa Item & Chất lưu trực tiếp trên Block
        drexkouDrill.hasItems = true;
        drexkouDrill.itemCapacity = 30;
        drexkouDrill.hasLiquids = true;
        drexkouDrill.liquidCapacity = 30;

        drexkouDrill.buildType = () => extend(Building, {
            targetTile: null,
            selectedItem: null,
            mineTimer: 0,
            rotation: 90,
            
            mineSpeed: 40,
            range: 200,
            cachedTiles: [],  
            sallowyrTimer: 0, // Bộ đếm thời gian hiệu ứng sallowyr (frames)

            getTileDrop(t) {
                if (t == null) return null;
                
                let drop = t.drop();
                if (drop != null) return drop;

                if (t.block() != null) {
                    let name = t.block().name;
                    if (name === "graphitic-wall" || name === "ore-wall-graphite" || name === "graphite-wall") {
                        return Items.graphite;
                    }
                }

                return null;
            },

            // --- ĐỒNG BỘ MẠNG (NETWORKING CONFIG) ---
            config() {
                return this.selectedItem;
            },

            write(write) {
                this.super$write(write);
                write.s(this.selectedItem != null ? this.selectedItem.id : -1);
                write.f(this.sallowyrTimer);
            },

            read(read, revision) {
                this.super$read(read, revision);
                let itemId = read.s();
                if (itemId !== -1) {
                    this.selectedItem = Vars.content.item(itemId);
                } else {
                    this.selectedItem = null;
                }
                this.sallowyrTimer = read.f();
            },

            configured(builder, value) {
                this.super$configured(builder, value);
                if (value instanceof Item) {
                    this.selectedItem = value;
                } else {
                    this.selectedItem = null;
                }
                
                this.releaseTarget();
                this.findTarget();
            },
            // ----------------------------------------

            // Chấp nhận cấp nước/cryofluid và item sallowyr
            acceptLiquid(source, liquid) {
                return this.block.hasLiquids && (liquid === Liquids.water || liquid === Liquids.cryofluid);
            },

            acceptItem(source, item) {
                let sallowyrItem = Vars.content.item("newex-sallowyr") || Vars.content.item("sallowyr");
                if (item === sallowyrItem) {
                    return this.sallowyrTimer <= 0; // Chỉ nhận khi hiệu ứng cũ đã hết
                }
                return false;
            },

            placed() {
                this.super$placed();
                this.scanAndCacheTiles();
                this.findTarget();
            },

            created() {
                this.super$created();
                Core.app.post(() => {
                    if (this.added) {
                        this.scanAndCacheTiles();
                        this.findTarget();
                    }
                });
            },

            onDestroy() {
                this.releaseTarget();
                this.cachedTiles = [];
                this.super$onDestroy();
            },

            scanAndCacheTiles() {
                this.cachedTiles = [];
                let rangeTiles = Math.ceil(this.range / 8);
                let tileX = Math.floor(this.x / 8);
                let tileY = Math.floor(this.y / 8);

                for (let x = -rangeTiles; x <= rangeTiles; x++) {
                    for (let y = -rangeTiles; y <= rangeTiles; y++) {
                        let t = Vars.world.tile(tileX + x, tileY + y);
                        if (t != null && this.within(t.worldx(), t.worldy(), this.range)) {
                            if (this.getTileDrop(t) != null) {
                                this.cachedTiles.push(t);
                            }
                        }
                    }
                }
            },

            releaseTarget() {
                if (this.targetTile != null) {
                    let key = this.targetTile.x + "," + this.targetTile.y;
                    globalLockedTiles.delete(key);
                    this.targetTile = null;
                }
            },

            setTarget(tile) {
                this.releaseTarget();
                if (tile != null) {
                    let key = tile.x + "," + tile.y;
                    globalLockedTiles.add(key);
                    this.targetTile = tile;
                }
            },

            isValidTarget(tile) {
                if (tile == null) return false;
                
                let drop = this.getTileDrop(tile);
                if (drop == null) return false;

                if (tile.build != null) {
                    let name = tile.block().name;
                    let isGraphiteWall = (name === "graphitic-wall" || name === "ore-wall-graphite" || name === "graphite-wall");
                    if (!isGraphiteWall) return false;
                }

                if (this.items.get(drop) >= this.block.itemCapacity) {
                    return false;
                }

                if (this.selectedItem != null && drop !== this.selectedItem) {
                    return false;
                }

                let key = tile.x + "," + tile.y;
                if (globalLockedTiles.has(key) && this.targetTile !== tile) {
                    return false;
                }

                return true;
            },

            findTarget() {
                if (this.cachedTiles.length === 0) {
                    this.setTarget(null);
                    return;
                }

                let bestObsTile = null;
                let candidateTiles = [];

                let obsOre = Vars.content.block("newex-ore-obs");
                let core = this.team.core();

                let obsItem = obsOre != null ? obsOre.itemDrop : null;
                let isObsFullInCore = false;

                if (core != null && obsItem != null) {
                    if (core.items.get(obsItem) >= core.storageCapacity) {
                        isObsFullInCore = true;
                    }
                }
 
                for (let i = 0; i < this.cachedTiles.length; i++) {
                    let t = this.cachedTiles[i];
                    
                    if (this.isValidTarget(t)) {
                        if (this.selectedItem != null) {
                            this.setTarget(t);
                            return;
                        }

                        if (t.overlay() === obsOre || t.floor() === obsOre) {
                            if (!isObsFullInCore) {
                                bestObsTile = t;
                                break;
                            } else {
                                candidateTiles.push(t);
                            }
                        } else {
                            candidateTiles.push(t);
                        }
                    }
                }

                if (bestObsTile != null) {
                    this.setTarget(bestObsTile);
                    return;
                }

                if (candidateTiles.length > 0) {
                    let bestTile = candidateTiles[0];

                    if (core != null) {
                        let minAmount = Infinity;

                        for (let i = 0; i < candidateTiles.length; i++) {
                            let t = candidateTiles[i];
                            let item = this.getTileDrop(t);
                            
                            if (item != null) {
                                let amountInCore = core.items.get(item);
                                if (amountInCore < minAmount) {
                                    minAmount = amountInCore;
                                    bestTile = t;
                                }
                            }
                        }
                    }

                    this.setTarget(bestTile);
                } else {
                    this.setTarget(null);
                }
            },

            // --- BẢNG CẤU HÌNH VÀ NÚT THÔNG TIN (i) ---
            buildConfiguration(table) {
                table.clearChildren();

                let itemsInArea = new Seq();
                for (let i = 0; i < this.cachedTiles.length; i++) {
                    let drop = this.getTileDrop(this.cachedTiles[i]);
                    if (drop != null && !itemsInArea.contains(drop)) {
                        itemsInArea.add(drop);
                    }
                }

                // Nút "i" - Xem Thông Tin
                table.button(Icon.info, Styles.cleari, 40, () => {
                    let dialog = new Dialog("[accent]Hướng Dẫn Sử Dụng Khối Khoan[ ]");
                    dialog.cont.margin(15);
                    
                    let infoText = 
                        "[cyan]● Chọn tài nguyên:[ ] Bấm vào các biểu tượng tài nguyên bên cạnh để bắt buộc máy tập trung khoan loại quặng đó. Nếu không chọn, máy sẽ tự động chọn quặng thiếu nhất trong Lõi.\n\n" +
                        "[yellow]● Cơ chế Tăng Tốc độ Khoan:[ ]\n" +
                        "  - [white]Cấp Nước (Water):[ ] Tăng [green]+50%[ ] tốc độ khai thác.\n" +
                        "  - [white]Cấp Chất làm lạnh (Cryofluid):[ ] Tăng [green]+100%[ ] tốc độ khai thác.\n" +
                        "  - [white]Hấp thụ Item Sallowyr:[ ] Khi nhận 1 [accent]Sallowyr[ ], khối sẽ hấp thụ và tăng [orange]+500%[ ] hiệu suất khai thác trong vòng [stat]10 giây[ ].\n\n" +
                        "[lightgray]Lưu ý: Tối đa hóa hiệu quả bằng cách kết hợp cấp Chất lưu và Sallowyr cùng lúc![ ]";

                    dialog.cont.add(infoText).width(380).wrap().get();
                    
                    // Tạo nút Đóng thủ công
                    dialog.buttons.button("Đóng", () => {
                        dialog.hide();
                    }).size(140, 50);

                    dialog.show();
                }).size(44).pad(2);

                let count = 1;
                for (let i = 0; i < itemsInArea.size; i++) {
                    let item = itemsInArea.get(i);
                    
                    let btn = table.button(new TextureRegionDrawable(item.uiIcon), Styles.clearTogglei, 40, () => {
                        let nextItem = (this.selectedItem === item) ? null : item;
                        this.configure(nextItem);
                        this.deselect();
                    }).size(44).pad(2).get();

                    btn.setChecked(this.selectedItem === item);

                    count++;
                    if (count % 4 === 0) table.row();
                }
            },

            updateTile() {
                // CHỈ XỬ LÝ LOGIC TRÊN HOST / SERVER
                if (!Vars.net.client()) {
                    let sallowyrItem = Vars.content.item("newex-sallowyr") || Vars.content.item("sallowyr");
                    
                    // 1. Kiểm tra và hấp thụ sallowyr nếu có trong kho
                    if (sallowyrItem != null && this.items.has(sallowyrItem)) {
                        this.items.remove(sallowyrItem, 1);
                        this.sallowyrTimer = 600; // 10 giây (60fps * 10)
                        Call.effect(Fx.upgradeCore, this.x, this.y, 0, Color.sky);
                    }

                    // 2. Tính toán hệ số Tăng Tốc (Boost Multiplier)
                    let boostMultiplier = 1.0;

                    // Nước: +50% | Cryofluid: +100%
                    if (this.liquids.get(Liquids.cryofluid) > 0.01) {
                        boostMultiplier += 1.0;
                        this.liquids.remove(Liquids.cryofluid, 0.15 * Time.delta);
                    } else if (this.liquids.get(Liquids.water) > 0.01) {
                        boostMultiplier += 0.5;
                        this.liquids.remove(Liquids.water, 0.2 * Time.delta);
                    }

                    // Sallowyr: +500% trong 10 giây
                    if (this.sallowyrTimer > 0) {
                        this.sallowyrTimer -= Time.delta;
                        boostMultiplier += 5.0;

                        if (Mathf.chance(0.1)) {
                            Call.effect(Fx.reactorsmoke, this.x + Mathf.range(4), this.y + Mathf.range(4), 0, Color.sky);
                        }
                    }

                    // 3. Xả Item ra các băng chuyền xung quanh
                    if (this.items.total() > 0) {
                        this.dump();
                    }

                    // 4. Tiến trình Khoan Quặng
                    if (this.efficiency > 0) {
                        if (!this.isValidTarget(this.targetTile)) {
                            this.releaseTarget();
                            this.findTarget();
                        }

                        if (this.targetTile != null) {
                            let item = this.getTileDrop(this.targetTile);

                            if (item != null && this.items.get(item) < this.block.itemCapacity) {
                                let hardness = item.hardness > 0 ? item.hardness : 1;
                                let hardnessPenalty = 1 / (1 + (hardness - 1) * 0.15);
                                
                                this.mineTimer += (8 / 60) * hardnessPenalty * this.efficiency * boostMultiplier;

                                if (this.mineTimer >= 1.0) {
                                    let amountToAdd = Math.floor(this.mineTimer);
                                    this.items.add(item, amountToAdd);
                                    this.mineTimer -= amountToAdd;

                                    try {
                                        Call.effect(Fx.mined, this.targetTile.worldx(), this.targetTile.worldy(), 0, item.color);
                                    } catch(e) {}
                                }
                            }
                        }
                    }
                }

                // Xoay hướng công trình
                if (this.targetTile != null) {
                    let tx = this.targetTile.worldx();
                    let ty = this.targetTile.worldy();
                    let targetAngle = Angles.angle(this.x, this.y, tx, ty);
                    this.rotation = Angles.moveToward(this.rotation, targetAngle, 5);
                }
            },

            drawSelect() {
                Drawf.dashCircle(this.x, this.y, this.range, Pal.accent);
            },

            drawPlace(x, y, rotation, valid) {
                Drawf.dashCircle(x * 8, y * 8, 200, Pal.accent);
            },

            draw() {
                this.super$draw();

                let region = Core.atlas.find(this.block.name + "-barr");
                if (region.found()) {
                    Draw.rect(region, this.x, this.y, this.rotation - 90);
                }

                let currentItem = this.targetTile != null ? this.getTileDrop(this.targetTile) : null;

                if (this.efficiency > 0 && this.targetTile != null) {
                    let tx = this.targetTile.worldx();
                    let ty = this.targetTile.worldy();

                    Draw.z(Layer.power + 1);

                    let laserColor = currentItem != null ? currentItem.color : Pal.accent;
                    let basePulse = Mathf.absin(Time.time, 4, 0.2);

                    Draw.color(laserColor, 0.35 + basePulse);
                    Lines.stroke(5.5);
                    Lines.line(this.x, this.y, tx, ty);

                    Draw.color(laserColor, 0.85);
                    Lines.stroke(3.0);
                    Lines.line(this.x, this.y, tx, ty);

                    Draw.color(Color.white, 0.9);
                    Lines.stroke(1.2);
                    Lines.line(this.x, this.y, tx, ty);

                    Draw.color(laserColor, 0.4);
                    Fill.circle(tx, ty, 6 + Mathf.absin(Time.time, 3, 2));
                    Draw.color(Color.white);
                    Fill.circle(tx, ty, 2.5);

                    let showGlowParticles = Core.settings.getBool("bloom", true) && Core.settings.getBool("effects", true);

                    if (showGlowParticles) {
                        let laserAngle = Angles.angle(tx, ty, this.x, this.y);
                        
                        let perpX = Mathf.cosDeg(laserAngle + 90);
                        let perpY = Mathf.sinDeg(laserAngle + 90);

                        for (let i = 0; i < 4; i++) {
                            let progress = ((Time.time * 0.025 + i * 0.25) % 1.0);
                            let baseX = Mathf.lerp(tx, this.x, progress);
                            let baseY = Mathf.lerp(ty, this.y, progress);

                            let offset = Mathf.sin(Time.time * 0.15 + i * 2.0) * 6.0;

                            let px = baseX + perpX * offset;
                            let py = baseY + perpY * offset;

                            let particleSpin = Time.time * 6.0 + i * 90;

                            Draw.color(laserColor, 0.4);
                            Fill.poly(px, py, 3, 4.8, particleSpin);

                            Draw.color(laserColor, 0.95);
                            Fill.poly(px, py, 3, 2.8, particleSpin);
                        }
                    }

                    Draw.reset();
                }
            }
        });
    }
});

Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && build.name === "newex-drexkou-drills") {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        if (tile != null) {
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;
            Drawf.dashCircle(centerX, centerY, 200, Pal.accent);
        }
    }
});