const DIR_X = [1, 0, -1, 0];
const DIR_Y = [0, 1, 0, -1];

Events.on(ContentInitEvent, () => {
    const genMachine = Vars.content.block("newex-generat-machine");
    const redstoneWall = Vars.content.block("newex-redstone-wall");
    const raykstone = Vars.content.item("newex-raykstone");

    if (genMachine != null && redstoneWall != null && raykstone != null) {
        genMachine.rotate = true;
        genMachine.update = true;
        genMachine.hasItems = true;

        genMachine.buildType = prov(() => {
            return extend(Building, {
                spawnTimer: 0,
                nextSpawnTime: 120 * 60,
                fuelTimer: 0, // Bộ đếm thời gian nhiên liệu (tính bằng tick)

                placed() {
                    this.super$placed();
                    this.resetTimer();
                },

                resetTimer() {
                    this.spawnTimer = 0;
                    this.nextSpawnTime = Mathf.random(120 * 60, 300 * 60);
                },

                // Định nghĩa đúng hàm acceptItem ở cấp Building
                acceptItem(source, item) {
                    return item === raykstone && this.items.get(raykstone) < this.block.itemCapacity;
                },

                getTargetTile() {
                    let rot = this.rotation & 3;
                    let dx = DIR_X[rot];
                    let dy = DIR_Y[rot];

                    let tx = Math.floor((this.x + dx * 16) / 8);
                    let ty = Math.floor((this.y + dy * 16) / 8);

                    return Vars.world.tile(tx, ty);
                },

                getFacingMachinesCount() {
                    let target = this.getTargetTile();
                    if (target == null) return 1;

                    let count = 0;
                    let targetX = target.worldx();
                    let targetY = target.worldy();

                    Units.nearbyBuildings(targetX, targetY, 32, cons(b => {
                        if (b != null && b.block === genMachine) {
                            let rot = b.rotation & 3;
                            let bDx = DIR_X[rot];
                            let bDy = DIR_Y[rot];

                            let bTargetX = b.x + bDx * 16;
                            let bTargetY = b.y + bDy * 16;

                            if (Math.abs(bTargetX - targetX) < 4 && Math.abs(bTargetY - targetY) < 4) {
                                count++;
                            }
                        }
                    }));

                    return Math.max(1, count);
                },

                canSpawn() {
                    let rot = this.rotation & 3;
                    let dx = DIR_X[rot];
                    let dy = DIR_Y[rot];

                    let spawnX = this.x + dx * 16;
                    let spawnY = this.y + dy * 16;

                    let startTileX = Math.floor((spawnX - 8 + 4) / 8);
                    let startTileY = Math.floor((spawnY - 8 + 4) / 8);

                    for (let x = 0; x < 2; x++) {
                        for (let y = 0; y < 2; y++) {
                            let checkTile = Vars.world.tile(startTileX + x, startTileY + y);
                            if (checkTile == null) return false;

                            if (checkTile.build != null || checkTile.solid() || checkTile.block() !== Blocks.air) {
                                return false;
                            }
                        }
                    }

                    let hasUnit = false;
                    Units.nearbyEnemies(this.team, spawnX - 8, spawnY - 8, 16, 16, cons(u => {
                        hasUnit = true;
                    }));

                    if (!hasUnit) {
                        Units.nearby(this.team, spawnX - 8, spawnY - 8, 16, 16, cons(u => {
                            hasUnit = true;
                        }));
                    }

                    return !hasUnit;
                },

                // Xử lý tiêu thụ 1 item raykstone = 1 giây (60 ticks)
                consumeFuel() {
                    if (this.fuelTimer > 0) {
                        this.fuelTimer -= Time.delta;
                        return true;
                    }

                    if (this.items.has(raykstone, 1)) {
                        this.items.remove(raykstone, 1);
                        this.fuelTimer += 60; // 60 ticks = 1 giây
                        return true;
                    }

                    return false;
                },

                updateTile() {
                    this.super$updateTile();

                    if (this.efficiency <= 0) return;

                    if (this.canSpawn()) {
                        let hasPowerFuel = this.consumeFuel();

                        if (hasPowerFuel) {
                            let multiplier = this.getFacingMachinesCount();
                            this.spawnTimer += Time.delta * multiplier;

                            if (this.spawnTimer >= this.nextSpawnTime) {
                                let target = this.getTargetTile();
                                if (target != null) {
                                    target.setBlock(redstoneWall, this.team, 0);
                                }
                                this.resetTimer();
                            }
                        }
                    }
                },

                drawSelect() {
                    this.super$drawSelect();
                    this.drawRangeOutline();
                },

                drawRangeOutline() {
                    let rot = this.rotation & 3;
                    let dx = DIR_X[rot];
                    let dy = DIR_Y[rot];

                    let spawnX = this.x + dx * 16;
                    let spawnY = this.y + dy * 16;

                    let minX = spawnX - 8;
                    let minY = spawnY - 8;
                    let maxX = spawnX + 8;
                    let maxY = spawnY + 8;

                    let isReady = this.canSpawn() && (this.fuelTimer > 0 || this.items.has(raykstone, 1));
                    let outlineColor = isReady ? Pal.accent : Color.scarlet;

                    Draw.z(Layer.power + 1);
                    Drawf.dashLine(outlineColor, minX, minY, maxX, minY);
                    Drawf.dashLine(outlineColor, maxX, minY, maxX, maxY);
                    Drawf.dashLine(outlineColor, maxX, maxY, minX, maxY);
                    Drawf.dashLine(outlineColor, minX, maxY, minX, minY);
                    Draw.reset();
                },

                draw() {
                    this.super$draw();

                    if (this.efficiency > 0) {
                        this.drawRangeOutline();

                        if (this.canSpawn() && (this.fuelTimer > 0 || this.items.has(raykstone, 1))) {
                            let rot = this.rotation & 3;
                            let dx = DIR_X[rot];
                            let dy = DIR_Y[rot];

                            let spawnX = this.x + dx * 16;
                            let spawnY = this.y + dy * 16;

                            let progress = Math.min(1.0, Math.max(0.0, this.spawnTimer / this.nextSpawnTime));
                            let region = redstoneWall.region;

                            if (region != null && region.found()) {
                                Draw.z(Layer.blockOver);
                                Draw.color(Color.white, progress);
                                Draw.rect(region, spawnX, spawnY, 16 * progress, 16 * progress);
                                Draw.reset();
                            }
                        }
                    }
                }
            });
        });
    }
});