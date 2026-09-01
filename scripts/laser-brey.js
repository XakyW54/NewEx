const RAYKSTONE_NAME = "newex-raykstone";
const EMERALIFT_NAMES = ["emeralift-wall", "newex-emeralift-wall"];
const BREAK_TIME = 60 * 60;
const BUFF_RADIUS = 5;

const DIR_X = [1, 0, -1, 0];
const DIR_Y = [0, 1, 0, -1];

Events.on(ContentInitEvent, () => {
    const laserBrey = Vars.content.block("newex-laser-brey");

    if (laserBrey != null) {
        laserBrey.rotate = true;
        laserBrey.drawArrow = false;
        laserBrey.hasItems = true;
        laserBrey.itemCapacity = 100;

        laserBrey.buildType = () => extend(Building, {
            target1: null,
            target2: null,
            timer1: 0,
            timer2: 0,
            itemTimer1: 0,
            itemTimer2: 0,
            baseMaxTiles: 5,
            hasBuff: false,
            buffCount: 0,

            onDestroy() {
                this.super$onDestroy();
            },

            checkEmeraldBuff() {
                let rot = this.rotation & 3;
                let count = 0;

                for (let dx = -BUFF_RADIUS; dx <= BUFF_RADIUS; dx++) {
                    for (let dy = -BUFF_RADIUS; dy <= BUFF_RADIUS; dy++) {
                        if (dx * dx + dy * dy > BUFF_RADIUS * BUFF_RADIUS) continue;

                        let checkX = this.tile.x + dx;
                        let checkY = this.tile.y + dy;

                        let isFront = false;
                        if (DIR_X[rot] !== 0) isFront = Math.sign(dx) === DIR_X[rot];
                        if (DIR_Y[rot] !== 0) isFront = Math.sign(dy) === DIR_Y[rot];

                        if (isFront) continue;

                        let neighborTile = Vars.world.tile(checkX, checkY);
                        if (neighborTile != null && neighborTile.build != null) {
                            let bName = neighborTile.build.block.name;
                            if (EMERALIFT_NAMES.some(name => bName === name || bName.endsWith("/" + name))) {
                                count++;
                            }
                        }
                    }
                }
                this.buffCount = count;
                this.hasBuff = count > 0;
                return this.hasBuff;
            },

            isRaykstone(tile) {
                if (tile == null) return false;
                let b = tile.block();
                let f = tile.floor();
                let o = tile.overlay();

                return (b != null && b.name === RAYKSTONE_NAME) ||
                       (f != null && f.name === RAYKSTONE_NAME) ||
                       (o != null && o.name === RAYKSTONE_NAME);
            },

            isVanillaWall(tile) {
                if (tile == null) return false;
                let b = tile.block();
                return b != null && b.isStatic() && !b.synthetic() && b.name !== RAYKSTONE_NAME;
            },

            isMineable(tile) {
                return this.isRaykstone(tile) || this.isVanillaWall(tile);
            },

            findTargets() {
                if (this.hasBuff) {
                    // Mỗi tầng cộng dồn 20% phạm vi (Gốc 31 ô -> Bán kính 15 ô)
                    let baseRadius = 15;
                    let areaRadius = Math.floor(baseRadius * (1 + 0.20 * this.buffCount));
                    let targets = [];

                    for (let dx = -areaRadius; dx <= areaRadius; dx++) {
                        for (let dy = -areaRadius; dy <= areaRadius; dy++) {
                            let checkTile = Vars.world.tile(this.tile.x + dx, this.tile.y + dy);
                            if (this.isMineable(checkTile)) {
                                targets.push(checkTile);
                                if (targets.length >= 2) break;
                            }
                        }
                        if (targets.length >= 2) break;
                    }

                    this.target1 = targets.length > 0 ? targets[0] : null;
                    this.target2 = targets.length > 1 ? targets[1] : null;
                } else {
                    // Khoan thẳng mặc định
                    let rot = this.rotation & 3;
                    let dirX = DIR_X[rot];
                    let dirY = DIR_Y[rot];

                    let pX = -DIR_Y[rot] * 4;
                    let pY = DIR_X[rot] * 4;

                    let startX = this.x + dirX * 8;
                    let startY = this.y + dirY * 8;

                    this.target1 = null;
                    for (let i = 1; i <= this.baseMaxTiles; i++) {
                        let checkX = startX + pX + dirX * (i * 8 - 4);
                        let checkY = startY + pY + dirY * (i * 8 - 4);
                        let checkTile = Vars.world.tileWorld(checkX, checkY);

                        if (this.isMineable(checkTile)) {
                            this.target1 = checkTile;
                            break;
                        }
                    }

                    this.target2 = null;
                    for (let i = 1; i <= this.baseMaxTiles; i++) {
                        let checkX = startX - pX + dirX * (i * 8 - 4);
                        let checkY = startY - pY + dirY * (i * 8 - 4);
                        let checkTile = Vars.world.tileWorld(checkX, checkY);

                        if (this.isMineable(checkTile)) {
                            this.target2 = checkTile;
                            break;
                        }
                    }
                }
            },

            handleMining(tile, itemTimerKey, progress) {
                if (tile == null || !this.isRaykstone(tile)) return;

                if (this[itemTimerKey] === 0) {
                    this[itemTimerKey] = Mathf.random(60, 120);
                }

                this[itemTimerKey] -= progress;

                if (this[itemTimerKey] <= 0) {
                    let item = Vars.content.item(RAYKSTONE_NAME);
                    if (item != null) {
                        this.handleItem(this, item);
                    }
                    this[itemTimerKey] = 0;
                }
            },

            processTarget(tile, timerKey, progress) {
                if (tile == null) return 0;

                if (Mathf.chance(0.25)) {
                    try { Fx.mine.at(tile.worldx(), tile.worldy()); } catch(e) {}
                }

                if (this[timerKey] + progress >= BREAK_TIME) {
                    let tx = tile.worldx();
                    let ty = tile.worldy();
                    let isVanilla = this.isVanillaWall(tile);

                    tile.setBlock(Blocks.air);

                    let dropChance = this.hasBuff ? 0.60 : 0.40;

                    if (isVanilla && Mathf.chance(dropChance)) {
                        let raykItem = Vars.content.item(RAYKSTONE_NAME);
                        if (raykItem != null) {
                            this.handleItem(this, raykItem);
                            try { Fx.itemTransfer.at(tx, ty, 0, raykItem, this); } catch(e) {}
                        }
                    }

                    try {
                        Fx.smallExplosion.at(tx, ty);
                        Effect.scorch(tx, ty, 2);
                        Damage.damage(tx, ty, 15, 0);
                    } catch(e) {}

                    this[timerKey] = 0;
                    return null;
                }
                return progress;
            },

            updateTile() {
                if (this.efficiency <= 0 || !this.shouldConsume()) return;

                this.checkEmeraldBuff();

                let liquidBoost = (this.liquids != null && this.liquids.currentAmount() > 0) ? 0.5 : 0;
                let progress = this.delta() * this.efficiency * (1 + liquidBoost);

                if (!this.isMineable(this.target1) || !this.isMineable(this.target2)) {
                    this.findTargets();
                }

                // Tăng 50% tốc độ đào tường cho mỗi tầng khối buff
                let vanillaSpeedMult = this.hasBuff ? (1.75 * (1 + 0.50 * this.buffCount)) : 1.75;

                if (this.target1 != null) {
                    this.handleMining(this.target1, "itemTimer1", progress);

                    let targetProgress1 = this.isVanillaWall(this.target1) ? progress * vanillaSpeedMult : progress;

                    let added = this.processTarget(this.target1, "timer1", targetProgress1);
                    if (added === null) {
                        this.target1 = null;
                        this.itemTimer1 = 0;
                    } else this.timer1 += added;
                } else {
                    this.timer1 = 0;
                    this.itemTimer1 = 0;
                }

                if (this.target2 != null) {
                    this.handleMining(this.target2, "itemTimer2", progress);

                    let targetProgress2 = this.isVanillaWall(this.target2) ? progress * vanillaSpeedMult : progress;

                    let added = this.processTarget(this.target2, "timer2", targetProgress2);
                    if (added === null) {
                        this.target2 = null;
                        this.itemTimer2 = 0;
                    } else this.timer2 += added;
                } else {
                    this.timer2 = 0;
                    this.itemTimer2 = 0;
                }

                this.dumpAccumulate();
            },

            drawSelect() {
                let rot = this.rotation & 3;
                let lineColor = this.hasBuff ? Color.valueOf("#10b981") : Pal.accent;

                if (this.hasBuff) {
                    // Hiển thị phạm vi hình vuông đường nét xen kẽ (mỗi tầng +20%)
                    let totalTiles = Math.floor(31 * (1 + 0.20 * this.buffCount));
                    let size = totalTiles * 8;
                    Drawf.dashSquare(lineColor, this.x, this.y, size);
                } else {
                    let dirX = DIR_X[rot];
                    let dirY = DIR_Y[rot];
                    let startX = this.x + dirX * 8;
                    let startY = this.y + dirY * 8;
                    let pX = -DIR_Y[rot] * 4;
                    let pY = DIR_X[rot] * 4;
                    let range = this.baseMaxTiles * 8;

                    Drawf.dashLine(lineColor, startX + pX, startY + pY, startX + pX + dirX * range, startY + pY + dirY * range);
                    Drawf.dashLine(lineColor, startX - pX, startY - pY, startX - pX + dirX * range, startY - pY + dirY * range);
                }

                Draw.z(Layer.power + 1);
                
                // Hiển thị vòng tròn phạm vi nhận buff nét xen kẽ
                Drawf.dashCircle(this.x, this.y, BUFF_RADIUS * 8, Color.valueOf("#10b981"));

                for (let dx = -BUFF_RADIUS; dx <= BUFF_RADIUS; dx++) {
                    for (let dy = -BUFF_RADIUS; dy <= BUFF_RADIUS; dy++) {
                        if (dx * dx + dy * dy > BUFF_RADIUS * BUFF_RADIUS) continue;

                        let isFront = false;
                        if (DIR_X[rot] !== 0) isFront = Math.sign(dx) === DIR_X[rot];
                        if (DIR_Y[rot] !== 0) isFront = Math.sign(dy) === DIR_Y[rot];

                        if (isFront) continue;

                        let checkTile = Vars.world.tile(this.tile.x + dx, this.tile.y + dy);
                        if (checkTile != null && checkTile.build != null) {
                            let bName = checkTile.build.block.name;
                            if (EMERALIFT_NAMES.some(name => bName === name || bName.endsWith("/" + name))) {
                                Lines.stroke(1.5, Color.valueOf("#10b981"));
                                Lines.dashLine(this.x, this.y, checkTile.build.x, checkTile.build.y, 4);
                            }
                        }
                    }
                }
                Draw.reset();
            },

            draw() {
                this.super$draw();

                if (this.items != null) {
                    let totalItems = this.items.total();
                    
                    if (totalItems > 0) {
                        let storageRegion = Core.atlas.find("newex-storage", Core.atlas.find("storage"));

                        if (storageRegion != null && storageRegion.found()) {
                            let tier = Math.floor(totalItems / 10);
                            let calculatedSize = 4 + (tier * 1.2);
                            let size = Math.min(calculatedSize, 16);

                            Draw.z(Layer.block + 0.1);
                            Draw.rect(storageRegion, this.x, this.y, size, size);
                        }
                    }
                }

                if (this.efficiency <= 0 || !this.shouldConsume()) return;

                let rot = this.rotation & 3;
                let dirX = DIR_X[rot];
                let dirY = DIR_Y[rot];

                let startX = this.x + dirX * 8;
                let startY = this.y + dirY * 8;

                let pX = -DIR_Y[rot] * 4;
                let pY = DIR_X[rot] * 4;

                let laserColor = this.hasBuff ? Color.valueOf("#10b981") : Color.valueOf("#ffd37f");
                let pulse = Mathf.absin(Time.time, 4, 0.2);

                Draw.z(Layer.power + 1);

                if (this.target1 != null) {
                    let endLineX = this.target1.worldx();
                    let endLineY = this.target1.worldy();
                    let startLineX = this.hasBuff ? this.x : startX + pX;
                    let startLineY = this.hasBuff ? this.y : startY + pY;

                    Lines.stroke(2.2, laserColor);
                    Lines.line(startLineX, startLineY, endLineX, endLineY);
                    Lines.stroke(0.8, Color.white);
                    Lines.line(startLineX, startLineY, endLineX, endLineY);
                    Fill.circle(endLineX, endLineY, 2 + pulse);
                }

                if (this.target2 != null) {
                    let endLineX = this.target2.worldx();
                    let endLineY = this.target2.worldy();
                    let startLineX = this.hasBuff ? this.x : startX - pX;
                    let startLineY = this.hasBuff ? this.y : startY - pY;

                    Lines.stroke(2.2, laserColor);
                    Lines.line(startLineX, startLineY, endLineX, endLineY);
                    Lines.stroke(0.8, Color.white);
                    Lines.line(startLineX, startLineY, endLineX, endLineY);
                    Fill.circle(endLineX, endLineY, 2 + pulse);
                }
                Draw.reset();
            }
        });
    }
});

Events.run(Trigger.draw, () => {
    let input = Vars.control.input;
    if (input == null) return;

    let block = input.block; 
    if (block != null && block.name === "newex-laser-brey") {
        let cursorX = Core.input.mouseWorldX();
        let cursorY = Core.input.mouseWorldY();

        let tileX = Math.floor(cursorX / 8);
        let tileY = Math.floor(cursorY / 8);
        let worldX = tileX * 8 + 4;
        let worldY = tileY * 8 + 4;

        let rot = input.rotation & 3;
        let dirX = DIR_X[rot];
        let dirY = DIR_Y[rot];

        let startX = worldX + dirX * 8;
        let startY = worldY + dirY * 8;

        let pX = -DIR_Y[rot] * 4;
        let pY = DIR_X[rot] * 4;
        let range = 5 * 8;

        Drawf.dashLine(Pal.accent, startX + pX, startY + pY, startX + pX + dirX * range, startY + pY + dirY * range);
        Drawf.dashLine(Pal.accent, startX - pX, startY - pY, startX - pX + dirX * range, startY - pY + dirY * range);

        Draw.z(Layer.power + 1);
        
        // Nét đứt xen kẽ ở chế độ xem trước đặt công trình
        Drawf.dashCircle(worldX, worldY, BUFF_RADIUS * 8, Color.valueOf("#10b981"));

        for (let dx = -BUFF_RADIUS; dx <= BUFF_RADIUS; dx++) {
            for (let dy = -BUFF_RADIUS; dy <= BUFF_RADIUS; dy++) {
                if (dx * dx + dy * dy > BUFF_RADIUS * BUFF_RADIUS) continue;

                let isFront = false;
                if (DIR_X[rot] !== 0) isFront = Math.sign(dx) === DIR_X[rot];
                if (DIR_Y[rot] !== 0) isFront = Math.sign(dy) === DIR_Y[rot];

                if (isFront) continue;

                let checkTile = Vars.world.tile(tileX + dx, tileY + dy);
                if (checkTile != null && checkTile.build != null) {
                    let bName = checkTile.build.block.name;
                    if (EMERALIFT_NAMES.some(name => bName === name || bName.endsWith("/" + name))) {
                        Lines.stroke(1.5, Color.valueOf("#10b981"));
                        Lines.dashLine(worldX, worldY, checkTile.build.x, checkTile.build.y, 4);
                    }
                }
            }
        }
        Draw.reset();
    }
});