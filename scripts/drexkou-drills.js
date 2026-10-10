const globalLockedTiles = new ObjectSet();
const isEn = () => Core.settings.getString("locale").startsWith("en");

function getTileKey(x, y) {
    return (x << 16) | (y & 0xFFFF);
}

Events.on(ContentInitEvent, () => {
    const drexkouDrill = Vars.content.block("newex-drexkou-drills");

    if (drexkouDrill != null) {
        drexkouDrill.configurable = true;

        drexkouDrill.hasItems = true;
        drexkouDrill.itemCapacity = 1000;
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
            sallowyrTimer: 0,
            retargetTimer: 0,

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

            acceptLiquid(source, liquid) {
                return this.block.hasLiquids && (liquid === Liquids.water || liquid === Liquids.cryofluid);
            },

            acceptItem(source, item) {
                let sallowyrItem = Vars.content.item("newex-sallowyr") || Vars.content.item("sallowyr");
                if (item === sallowyrItem) {
                    return this.sallowyrTimer <= 0;
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
                    let key = getTileKey(this.targetTile.x, this.targetTile.y);
                    globalLockedTiles.remove(key);
                    this.targetTile = null;
                }
            },

            setTarget(tile) {
                this.releaseTarget();
                if (tile != null) {
                    let key = getTileKey(tile.x, tile.y);
                    globalLockedTiles.add(key);
                    this.targetTile = tile;
                }
            },

            isValidTarget(tile) {
                if (tile == null) return false;
                if (this.selectedItem == null) return false;
                
                let drop = this.getTileDrop(tile);
                if (drop == null || drop !== this.selectedItem) return false;

                if (tile.build != null) {
                    let name = tile.block().name;
                    let isGraphiteWall = (name === "graphitic-wall" || name === "ore-wall-graphite" || name === "graphite-wall");
                    if (!isGraphiteWall) return false;
                }

                if (this.items.get(drop) >= this.block.itemCapacity) {
                    return false;
                }

                let key = getTileKey(tile.x, tile.y);
                if (globalLockedTiles.contains(key) && this.targetTile !== tile) {
                    return false;
                }

                return true;
            },

            findTarget() {
                if (this.selectedItem == null || this.cachedTiles.length === 0) {
                    this.setTarget(null);
                    return;
                }

                for (let i = 0; i < this.cachedTiles.length; i++) {
                    let t = this.cachedTiles[i];
                    if (this.isValidTarget(t)) {
                        this.setTarget(t);
                        return;
                    }
                }

                this.setTarget(null);
            },

            buildConfiguration(table) {
                table.clearChildren();

                let itemsInArea = new Seq();
                for (let i = 0; i < this.cachedTiles.length; i++) {
                    let drop = this.getTileDrop(this.cachedTiles[i]);
                    if (drop != null && !itemsInArea.contains(drop)) {
                        itemsInArea.add(drop);
                    }
                }

                table.button(Icon.info, Styles.cleari, 40, () => {
                    let dialog = new Dialog(isEn() ? "[accent]Drill Block Manual[ ]" : "[accent]Hướng Dẫn Sử Dụng Khối Khoan[ ]");
                    dialog.cont.margin(15);
                    
                    let infoText = isEn() ?
                        "[cyan]● Select Resource:[ ] Tap resource icons to select drill target. The drill will only operate after a resource is selected.\n\n" +
                        "[yellow]● Yield Boost Mechanics:[ ] Base yield is 100 items per second.\n" +
                        "  - [white]Water Supply:[ ] Boosts yield to [green]150 items/s (+50%)[ ].\n" +
                        "  - [white]Cryofluid Supply:[ ] Boosts yield to [green]200 items/s (+100%)[ ].\n" +
                        "  - [white]Sallowyr Item Absorption:[ ] Absorbs 1 [accent]Sallowyr[ ] to boost yield to [orange]600 items/s (+500%)[ ] for [stat]10 seconds[ ].\n\n" +
                        "[lightgray]Note: Combine liquid supply with Sallowyr to maximize drill output![ ]"
                        :
                        "[cyan]● Chọn tài nguyên:[ ] Bấm vào các biểu tượng tài nguyên bên cạnh để bắt đầu khai thác. Máy chỉ hoạt động sau khi người chơi chủ động chọn tài nguyên.\n\n" +
                        "[yellow]● Cơ chế Tăng Số Lượng Thu Hoạch:[ ] Tốc độ cơ bản thu 100 item/giây.\n" +
                        "  - [white]Cấp Nước (Water):[ ] Tăng sản lượng lên [green]150 item/giây (+50%)[ ].\n" +
                        "  - [white]Cấp Chất làm lạnh (Cryofluid):[ ] Tăng sản lượng lên [green]200 item/giây (+100%)[ ].\n" +
                        "  - [white]Hấp thụ Item Sallowyr:[ ] Tăng sản lượng lên [orange]600 item/giây (+500%)[ ] trong [stat]10 giây[ ].\n\n" +
                        "[lightgray]Lưu ý: Kết hợp Chất lưu và Sallowyr cùng lúc để tối đa hóa lượng item thu được![ ]";

                    dialog.cont.add(infoText).width(380).wrap().get();
                    
                    dialog.buttons.button(isEn() ? "Close" : "Đóng", () => {
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
                if (!Vars.net.client()) {
                    let sallowyrItem = Vars.content.item("newex-sallowyr") || Vars.content.item("sallowyr");
                    
                    if (sallowyrItem != null && this.items.has(sallowyrItem)) {
                        this.items.remove(sallowyrItem, 1);
                        this.sallowyrTimer = 600; 
                        Call.effect(Fx.upgradeCore, this.x, this.y, 0, Color.sky);
                    }

                    let boostMultiplier = 1.0;

                    if (this.liquids.get(Liquids.cryofluid) > 0.01) {
                        boostMultiplier += 1.0;
                        this.liquids.remove(Liquids.cryofluid, 0.15 * Time.delta);
                    } else if (this.liquids.get(Liquids.water) > 0.01) {
                        boostMultiplier += 0.5;
                        this.liquids.remove(Liquids.water, 0.2 * Time.delta);
                    }

                    if (this.sallowyrTimer > 0) {
                        this.sallowyrTimer -= Time.delta;
                        boostMultiplier += 5.0;

                        if (Mathf.chance(0.1)) {
                            Call.effect(Fx.reactorsmoke, this.x + Mathf.range(4), this.y + Mathf.range(4), 0, Color.sky);
                        }
                    }

                    if (this.items.total() > 0) {
                        this.dump();
                    }

                    if (this.efficiency > 0 && this.selectedItem != null) {
                        if (!this.isValidTarget(this.targetTile)) {
                            this.retargetTimer += Time.delta;
                            if (this.retargetTimer >= 20) {
                                this.retargetTimer = 0;
                                this.releaseTarget();
                                this.findTarget();
                            }
                        } else {
                            this.retargetTimer = 0;
                        }

                        if (this.targetTile != null) {
                            let item = this.getTileDrop(this.targetTile);

                            if (item != null && this.items.get(item) < this.block.itemCapacity) {
                                // Đếm thời gian đào (60 ticks = 1 giây)
                                this.mineTimer += Time.delta * this.efficiency;

                                if (this.mineTimer >= 60.0) {
                                    this.mineTimer -= 60.0;
                                    
                                    // Mặc định 100 item/s, nhân với hệ số buff từ nước/cryo/sallowyr
                                    let amountToAdd = Math.floor(100 * boostMultiplier);
                                    this.items.add(item, amountToAdd);

                                    try {
                                        Call.effect(Fx.mined, this.targetTile.worldx(), this.targetTile.worldy(), 0, item.color);
                                    } catch(e) {}
                                }
                            }
                        }
                    }
                }

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
                        let cosA = Mathf.cosDeg(laserAngle + 90);
                        let sinA = Mathf.sinDeg(laserAngle + 90);

                        for (let i = 0; i < 2; i++) {
                            let progress = ((Time.time * 0.025 + i * 0.5) % 1.0);
                            let baseX = Mathf.lerp(tx, this.x, progress);
                            let baseY = Mathf.lerp(ty, this.y, progress);

                            let offset = Mathf.sin(Time.time * 0.15 + i * 2.0) * 6.0;

                            let px = baseX + cosA * offset;
                            let py = baseY + sinA * offset;

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