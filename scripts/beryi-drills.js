const isEn = () => Core.settings.getString("locale").startsWith("en");

const customExplosion = new Effect(35, e => {
    if (Vars.state.isPaused()) {
        e.time -= e.delta;
    }
    Draw.color(Color.purple, Color.lightGray, e.fin());
    Lines.stroke(e.fout() * 3);
    Lines.circle(e.x, e.y, e.fin() * 24);
});

Events.on(ContentInitEvent, () => {
    const beryiDrill = Vars.content.block("newex-beryi-drills");

    if (beryiDrill != null) {
        beryiDrill.configurable = true;

        beryiDrill.hasItems = true;
        beryiDrill.itemCapacity = 1000;
        beryiDrill.hasLiquids = true;
        beryiDrill.liquidCapacity = 30;

        beryiDrill.buildType = () => extend(Building, {
            mineTimer: 0,
            rotation: 90,
            
            radiusTiles: 25,
            cachedTiles: [],  
            sallowyrTimer: 0,
            copesBoostTime: 0,
            copesBoostIntensity: 1.0,

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

            applyBoost(intensity, duration) {
                this.copesBoostIntensity = intensity;
                this.copesBoostTime = duration;
            },

            write(write) {
                this.super$write(write);
                write.f(this.sallowyrTimer);
                write.f(this.copesBoostTime);
                write.f(this.copesBoostIntensity);
            },

            read(read, revision) {
                this.super$read(read, revision);
                this.sallowyrTimer = read.f();
                this.copesBoostTime = read.f();
                this.copesBoostIntensity = read.f();
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
            },

            created() {
                this.super$created();
                Core.app.post(() => {
                    if (this.added) {
                        this.scanAndCacheTiles();
                    }
                });
            },

            onDestroy() {
                this.cachedTiles = [];
                this.super$onDestroy();
            },

            scanAndCacheTiles() {
                this.cachedTiles = [];
                let tX = this.tileX();
                let tY = this.tileY();

                for (let x = -this.radiusTiles; x <= this.radiusTiles; x++) {
                    for (let y = -this.radiusTiles; y <= this.radiusTiles; y++) {
                        let t = Vars.world.tile(tX + x, tY + y);
                        if (t != null) {
                            if (this.getTileDrop(t) != null) {
                                this.cachedTiles.push(t);
                            }
                        }
                    }
                }
            },

            buildConfiguration(table) {
                table.clearChildren();

                table.button(Icon.info, Styles.cleari, 40, () => {
                    let dialog = new Dialog(isEn() ? "[accent]Beryi Drill Manual[]" : "[accent]Hướng Dẫn Sử Dụng Khối Khoan Beryi[]");
                    dialog.cont.margin(15);
                    
                    let infoText = isEn() ?
                        "[cyan]● Automatic Square Area Mining:[ ] Automatically mines random resources within a perfectly grid-aligned 25-tile square range.\n\n" +
                        "[yellow]● Yield Boost Mechanics:[ ] Base yield is 2 items per second.\n" +
                        "  - [white]Water Supply:[ ] Boosts yield to [green]3 items/s (+50%)[ ].\n" +
                        "  - [white]Cryofluid Supply:[ ] Boosts yield to [green]4 items/s (+100%)[ ].\n" +
                        "  - [white]Sallowyr Item Absorption:[ ] Absorbs 1 [accent]Sallowyr[ ] to boost yield to [orange]12 items/s (+500%)[ ] for [stat]10 seconds[ ].\n\n" +
                        "[lightgray]Note: When inventory reaches 1000 items, a 'V' conversion button appears![ ]"
                        :
                        "[cyan]● Khai thác tự động vùng hình vuông:[ ] Tự động ngẫu nhiên khai thác tài nguyên trong phạm vi hình vuông 25 ô.\n\n" +
                        "[yellow]● Cơ chế Tăng Số Lượng Thu Hoạch:[ ] Tốc độ cơ bản thu 2 item/giây.\n" +
                        "  - [white]Cấp Nước (Water):[ ] Tăng sản lượng lên [green]3 item/giây (+50%)[ ].\n" +
                        "  - [white]Cấp Chất làm lạnh (Cryofluid):[ ] Tăng sản lượng lên [green]4 item/giây (+100%)[ ].\n" +
                        "  - [white]Hấp thụ Item Sallowyr:[ ] Tăng sản lượng lên [orange]12 item/giây (+500%)[ ] trong [stat]10 giây[ ].\n\n" +
                        "[lightgray]Lưu ý: Khi kho chứa đạt đủ 1000 item, nút chuyển đổi 'V' sẽ xuất hiện![ ]";

                    dialog.cont.add(infoText).width(380).wrap().get();
                    
                    dialog.buttons.button(isEn() ? "Close" : "Đóng", () => {
                        dialog.hide();
                    }).size(140, 50);

                    dialog.show();
                }).size(44).pad(2);

                if (this.items.total() >= 1000) {
                    table.button("V", () => {
                        if (!Vars.net.client()) {
                            let coreBlock = Vars.content.block("newex-core-raykstone");
                            let centerTile = Vars.world.tileWorld(this.x, this.y);

                            if (centerTile != null) {
                                this.remove();

                                if (coreBlock != null) {
                                    centerTile.setBlock(coreBlock, this.team, 0);
                                }

                                customExplosion.at(this.x, this.y, 0, Color.purple);
                            }
                        }
                    }).size(44).pad(2);
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

                    if (this.copesBoostTime > 0) {
                        this.copesBoostTime -= Time.delta;
                        boostMultiplier *= this.copesBoostIntensity;
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

                    if (this.efficiency > 0 && this.cachedTiles.length > 0) {
                        this.mineTimer += Time.delta * this.efficiency;

                        if (this.mineTimer >= 60.0) {
                            this.mineTimer -= 60.0;
                            
                            let randomTile = this.cachedTiles[Math.floor(Mathf.random(0, this.cachedTiles.length))];
                            let item = this.getTileDrop(randomTile);

                            if (item != null) {
                                let amountToAdd = Math.max(1, Math.floor(2 * boostMultiplier));
                                this.items.add(item, amountToAdd);

                                try {
                                    Call.effect(Fx.mined, randomTile.worldx(), randomTile.worldy(), 0, item.color);
                                } catch(e) {}
                            }
                        }
                    }
                }
            },

            drawSelect() {
                let tX = this.tileX();
                let tY = this.tileY();
                let minX = tX - this.radiusTiles;
                let maxX = tX + this.radiusTiles;
                let minY = tY - this.radiusTiles;
                let maxY = tY + this.radiusTiles;

                let worldLeft = minX * 8;
                let worldBottom = minY * 8;
                let boxWidth = (maxX - minX + 1) * 8;
                let boxHeight = (maxY - minY + 1) * 8;

                Draw.color(Pal.accent, 0.12);
                Fill.rect(worldLeft + boxWidth / 2, worldBottom + boxHeight / 2, boxWidth, boxHeight);
                
                Draw.color(Pal.accent);
                Lines.stroke(1.5);
                Lines.rect(worldLeft, worldBottom, boxWidth, boxHeight);

                if (this.cachedTiles && this.cachedTiles.length > 0) {
                    Draw.color(Pal.accent, 0.85);
                    Lines.stroke(1.0);
                    for (let i = 0; i < this.cachedTiles.length; i++) {
                        let t = this.cachedTiles[i];
                        if (t != null) {
                            let itemDrop = this.getTileDrop(t);
                            // Không vẽ viền cho cát (Items.sand)
                            if (itemDrop === Items.sand) continue;

                            let wx = t.worldx();
                            let wy = t.worldy();

                            let rightTile = Vars.world.tile(t.x + 1, t.y);
                            let leftTile = Vars.world.tile(t.x - 1, t.y);
                            let topTile = Vars.world.tile(t.x, t.y + 1);
                            let bottomTile = Vars.world.tile(t.x, t.y - 1);

                            let hasRight = (rightTile != null && rightTile.x >= minX && rightTile.x <= maxX && rightTile.y >= minY && rightTile.y <= maxY && this.getTileDrop(rightTile) != null && this.getTileDrop(rightTile) !== Items.sand);
                            let hasLeft = (leftTile != null && leftTile.x >= minX && leftTile.x <= maxX && leftTile.y >= minY && leftTile.y <= maxY && this.getTileDrop(leftTile) != null && this.getTileDrop(leftTile) !== Items.sand);
                            let hasTop = (topTile != null && topTile.x >= minX && topTile.x <= maxX && topTile.y >= minY && topTile.y <= maxY && this.getTileDrop(topTile) != null && this.getTileDrop(topTile) !== Items.sand);
                            let hasBottom = (bottomTile != null && bottomTile.x >= minX && bottomTile.x <= maxX && bottomTile.y >= minY && bottomTile.y <= maxY && this.getTileDrop(bottomTile) != null && this.getTileDrop(bottomTile) !== Items.sand);

                            if (!hasLeft)   Lines.line(wx - 4, wy - 4, wx - 4, wy + 4);
                            if (!hasRight)  Lines.line(wx + 4, wy - 4, wx + 4, wy + 4);
                            if (!hasBottom) Lines.line(wx - 4, wy - 4, wx + 4, wy - 4);
                            if (!hasTop)    Lines.line(wx - 4, wy + 4, wx + 4, wy + 4);
                        }
                    }
                }
                Draw.reset();
            },

            drawPlace(x, y, rotation, valid) {
                let radiusTiles = 25;
                let minX = x - radiusTiles;
                let maxX = x + radiusTiles;
                let minY = y - radiusTiles;
                let maxY = y + radiusTiles;

                let worldLeft = minX * 8;
                let worldBottom = minY * 8;
                let boxWidth = (maxX - minX + 1) * 8;
                let boxHeight = (maxY - minY + 1) * 8;

                Draw.color(Pal.accent, 0.12);
                Fill.rect(worldLeft + boxWidth / 2, worldBottom + boxHeight / 2, boxWidth, boxHeight);
                
                Draw.color(Pal.accent);
                Lines.stroke(1.5);
                Lines.rect(worldLeft, worldBottom, boxWidth, boxHeight);
                Draw.reset();
            },

            draw() {
                this.super$draw();

                let region = Core.atlas.find(this.block.name + "-barr");
                if (region.found()) {
                    Draw.rect(region, this.x, this.y, this.rotation - 90);
                }
            }
        });
    }
});

Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && build.name === "newex-beryi-drills") {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        if (tile != null) {
            let radiusTiles = 25;
            let minX = tile.x - radiusTiles;
            let maxX = tile.x + radiusTiles;
            let minY = tile.y - radiusTiles;
            let maxY = tile.y + radiusTiles;

            let worldLeft = minX * 8;
            let worldBottom = minY * 8;
            let boxWidth = (maxX - minX + 1) * 8;
            let boxHeight = (maxY - minY + 1) * 8;

            Draw.color(Pal.accent, 0.12);
            Fill.rect(worldLeft + boxWidth / 2, worldBottom + boxHeight / 2, boxWidth, boxHeight);
            Draw.color(Pal.accent);
            Lines.stroke(1.5);
            Lines.rect(worldLeft, worldBottom, boxWidth, boxHeight);
            Draw.reset();
        }
    }
});