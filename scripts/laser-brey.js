const RAYKSTONE_NAME = "newex-raykstone";
const CORE_RAYKSTONE_NAME = "newex-core-raykstone";
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

        // Cache biến toàn cục để tránh truy vấn nhiều lần
        let emeraliftBlocks = [];
        let raykItem = null;
        let uraniumShardItem = null;

        laserBrey.buildType = () => extend(Building, {
            target1: null,
            target2: null,
            timer1: 0,
            timer2: 0,
            itemTimer1: 0,
            itemTimer2: 0,
            shardTimer1: 0, // Bộ đếm 1 giây cho target 1
            shardTimer2: 0, // Bộ đếm 1 giây cho target 2
            baseMaxTiles: 5,
            hasBuff: false,
            buffCount: 0,

            // Biến đếm Cooldown tối ưu FPS/TPS
            buffCheckTimer: 0,
            targetSearchTimer: 0,
            initialized: false,

            // Dùng created() để khởi tạo thay vì override init() gây lỗi super$init
            created() {
                this.super$created();
                if (emeraliftBlocks.length === 0) {
                    EMERALIFT_NAMES.forEach(name => {
                        let b = Vars.content.block(name);
                        if (b != null) emeraliftBlocks.push(b);
                    });
                }
                if (raykItem == null) {
                    raykItem = Vars.content.item(RAYKSTONE_NAME);
                }
                if (uraniumShardItem == null) {
                    uraniumShardItem = Vars.content.item("newex-uranilum-shard");
                }
            },

            onDestroy() {
                this.super$onDestroy();
            },

            isEmeraliftBlock(block) {
                if (block == null) return false;
                for (let i = 0; i < emeraliftBlocks.length; i++) {
                    if (block === emeraliftBlocks[i]) return true;
                }
                return false;
            },

            checkEmeraldBuff() {
                let rot = this.rotation & 3;
                let count = 0;
                let rSq = BUFF_RADIUS * BUFF_RADIUS;

                for (let dx = -BUFF_RADIUS; dx <= BUFF_RADIUS; dx++) {
                    let dxSq = dx * dx;
                    let isFrontX = DIR_X[rot] !== 0 && Math.sign(dx) === DIR_X[rot];

                    for (let dy = -BUFF_RADIUS; dy <= BUFF_RADIUS; dy++) {
                        if (dxSq + dy * dy > rSq) continue;

                        let isFrontY = DIR_Y[rot] !== 0 && Math.sign(dy) === DIR_Y[rot];
                        if (isFrontX || isFrontY) continue;

                        let neighborTile = Vars.world.tile(this.tile.x + dx, this.tile.y + dy);
                        if (neighborTile != null && neighborTile.build != null) {
                            if (this.isEmeraliftBlock(neighborTile.build.block)) {
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

            isCoreRaykstone(tile) {
                if (tile == null) return false;
                let b = tile.block();
                return b != null && b.name === CORE_RAYKSTONE_NAME;
            },

            isVanillaWall(tile) {
                if (tile == null) return false;
                let b = tile.block();
                return b != null && b.isStatic() && !b.synthetic() && b.name !== RAYKSTONE_NAME && b.name !== CORE_RAYKSTONE_NAME;
            },

            isMineable(tile) {
                return this.isRaykstone(tile) || this.isCoreRaykstone(tile) || this.isVanillaWall(tile);
            },

            findTargets() {
                if (this.hasBuff) {
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

            handleMining(tile, itemTimerKey, shardTimerKey, progress) {
                if (tile == null) return;

                let isRayk = this.isRaykstone(tile);
                let isCore = this.isCoreRaykstone(tile);
                let isVanilla = this.isVanillaWall(tile);

                // --- 1. Xử lý nhận newex-uranilum-shard: Mỗi 1 giây (60 ticks) có 10% cơ hội ---
                this[shardTimerKey] += progress;
                if (this[shardTimerKey] >= 60) {
                    this[shardTimerKey] %= 60;
                    if (uraniumShardItem != null && Mathf.chance(0.10)) {
                        this.handleItem(this, uraniumShardItem);
                        try { Fx.itemTransfer.at(tile.worldx(), tile.worldy(), 0, uraniumShardItem, this); } catch(e) {}
                    }
                }

                // --- 2. Xử lý nhận raykItem: Mỗi 1 giây (60 ticks) đào ra item ---
                this[itemTimerKey] += progress;
                if (this[itemTimerKey] >= 60) {
                    this[itemTimerKey] %= 60;

                    if (raykItem != null) {
                        // Khối Raykstone & Core Raykstone luôn cấp 1 item mỗi giây
                        if (isRayk || isCore) {
                            this.handleItem(this, raykItem);
                            try { Fx.itemTransfer.at(tile.worldx(), tile.worldy(), 0, raykItem, this); } catch(e) {}
                        } 
                        // Khối Tường Vanilla có tỉ lệ rớt item mỗi giây tùy theo buff
                        else if (isVanilla) {
                            let dropChance = this.hasBuff ? 0.60 : 0.40;
                            if (Mathf.chance(dropChance)) {
                                this.handleItem(this, raykItem);
                                try { Fx.itemTransfer.at(tile.worldx(), tile.worldy(), 0, raykItem, this); } catch(e) {}
                            }
                        }
                    }
                }
            },

            processTarget(tile, timerKey, progress) {
                if (tile == null) return 0;

                if (Mathf.chance(0.25)) {
                    try { Fx.mine.at(tile.worldx(), tile.worldy()); } catch(e) {}
                }

                // Khối newex-core-raykstone sẽ không bao giờ bị phá hủy
                if (this.isCoreRaykstone(tile)) {
                    return progress;
                }

                if (this[timerKey] + progress >= BREAK_TIME) {
                    let tx = tile.worldx();
                    let ty = tile.worldy();

                    // Phá hủy khối khi đủ thời gian đào vỡ
                    tile.setBlock(Blocks.air);

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

                // Tối ưu kiểm tra Buff (chỉ chạy mỗi 30 tick)
                this.buffCheckTimer += Time.delta;
                if (this.buffCheckTimer >= 30) {
                    this.checkEmeraldBuff();
                    this.buffCheckTimer = 0;
                }

                let liquidBoost = (this.liquids != null && this.liquids.currentAmount() > 0) ? 0.5 : 0;
                let progress = this.delta() * this.efficiency * (1 + liquidBoost);

                // Tối ưu tìm mục tiêu khi thiếu target (chờ 20 tick mới tìm lại)
                if (!this.isMineable(this.target1) || !this.isMineable(this.target2)) {
                    this.targetSearchTimer += Time.delta;
                    if (this.targetSearchTimer >= 20) {
                        this.findTargets();
                        this.targetSearchTimer = 0;
                    }
                }

                let vanillaSpeedMult = this.hasBuff ? (1.75 * (1 + 0.50 * this.buffCount)) : 1.75;

                if (this.target1 != null) {
                    this.handleMining(this.target1, "itemTimer1", "shardTimer1", progress);

                    let targetProgress1 = this.isVanillaWall(this.target1) ? progress * vanillaSpeedMult : progress;

                    let added = this.processTarget(this.target1, "timer1", targetProgress1);
                    if (added === null) {
                        this.target1 = null;
                        this.itemTimer1 = 0;
                        this.shardTimer1 = 0;
                    } else this.timer1 += added;
                } else {
                    this.timer1 = 0;
                    this.itemTimer1 = 0;
                    this.shardTimer1 = 0;
                }

                if (this.target2 != null) {
                    this.handleMining(this.target2, "itemTimer2", "shardTimer2", progress);

                    let targetProgress2 = this.isVanillaWall(this.target2) ? progress * vanillaSpeedMult : progress;

                    let added = this.processTarget(this.target2, "timer2", targetProgress2);
                    if (added === null) {
                        this.target2 = null;
                        this.itemTimer2 = 0;
                        this.shardTimer2 = 0;
                    } else this.timer2 += added;
                } else {
                    this.timer2 = 0;
                    this.itemTimer2 = 0;
                    this.shardTimer2 = 0;
                }

                this.dumpAccumulate();
            },

            drawSelect() {
                let rot = this.rotation & 3;
                let lineColor = this.hasBuff ? Color.valueOf("#10b981") : Pal.accent;

                if (this.hasBuff) {
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

                Draw.z(Layer.turret + 2);
                Drawf.dashCircle(this.x, this.y, BUFF_RADIUS * 8, Color.valueOf("#10b981"));

                let rSq = BUFF_RADIUS * BUFF_RADIUS;
                for (let dx = -BUFF_RADIUS; dx <= BUFF_RADIUS; dx++) {
                    let dxSq = dx * dx;
                    let isFrontX = DIR_X[rot] !== 0 && Math.sign(dx) === DIR_X[rot];

                    for (let dy = -BUFF_RADIUS; dy <= BUFF_RADIUS; dy++) {
                        if (dxSq + dy * dy > rSq) continue;

                        let isFrontY = DIR_Y[rot] !== 0 && Math.sign(dy) === DIR_Y[rot];
                        if (isFrontX || isFrontY) continue;

                        let checkTile = Vars.world.tile(this.tile.x + dx, this.tile.y + dy);
                        if (checkTile != null && checkTile.build != null) {
                            if (this.isEmeraliftBlock(checkTile.build.block)) {
                                Lines.stroke(1.5, Color.valueOf("#10b981"));
                                Lines.dashLine(this.x, this.y, checkTile.build.x, checkTile.build.y, 4);
                            }
                        }
                    }
                }
                Draw.reset();
            },

            draw() {
                // Đặt Layer của khối hiển thị ở mức Layer.turret (ngang tầm tháp pháo/cao hơn tường) khi vẽ
                Draw.z(Layer.turret);
                this.super$draw();

                if (this.items != null) {
                    let totalItems = this.items.total();
                    if (totalItems > 0) {
                        let storageRegion = Core.atlas.find("newex-storage", Core.atlas.find("storage"));
                        if (storageRegion != null && storageRegion.found()) {
                            let tier = Math.floor(totalItems / 10);
                            let calculatedSize = 4 + (tier * 1.2);
                            let size = Math.min(calculatedSize, 16);

                            Draw.z(Layer.turret + 0.1);
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

                Draw.z(Layer.turret + 1);

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

        Draw.z(Layer.turret + 2);
        Drawf.dashCircle(worldX, worldY, BUFF_RADIUS * 8, Color.valueOf("#10b981"));

        let rSq = BUFF_RADIUS * BUFF_RADIUS;
        for (let dx = -BUFF_RADIUS; dx <= BUFF_RADIUS; dx++) {
            let dxSq = dx * dx;
            let isFrontX = DIR_X[rot] !== 0 && Math.sign(dx) === DIR_X[rot];

            for (let dy = -BUFF_RADIUS; dy <= BUFF_RADIUS; dy++) {
                if (dxSq + dy * dy > rSq) continue;

                let isFrontY = DIR_Y[rot] !== 0 && Math.sign(dy) === DIR_Y[rot];
                if (isFrontX || isFrontY) continue;

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