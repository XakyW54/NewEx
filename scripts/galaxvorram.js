const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

function findContent(type, name) {
    let found = Vars.content.getByName(type, name);
    if (!found) found = Vars.content.getByName(type, "newex-" + name);
    return found;
}

const itemObs = findContent(ContentType.item, "newex-obs");
const REDSTONE_NAMES = ["redstone-wall", "newex-redstone-wall"];
const PINFYR_NAMES = ["pinfyr", "newex-pinfyr"];

const pinfyrStackMap = new ObjectMap();

const AMMO_DATA = [
    {
        name: "1. Đạn Tiêu Chuẩn Galax",
        desc: "Sát thương gốc: [accent]5600 Dmg (100%)[]\nYêu cầu: Thorium x2 + 20 Điện/s (+500 Điện khi bắn)",
        val: 0,
        dmgMult: 1.0,
        reqThorium: 2,
        extraPowerCost: 500,
        c1: Color.valueOf("#c084fc"),
        c2: Color.valueOf("#e879f9"),
        reqItem: Items.thorium,
        reqAmount: 2
    },
    {
        name: "2. Đạn Chi Phí Thấp",
        desc: "Sát thương: [accent]4480 Dmg (80%)[]\nYêu cầu: Thorium x2 + Silicon x2 | +400 Điện khi bắn",
        val: 1,
        dmgMult: 0.8,
        reqThorium: 2,
        extraPowerCost: 400,
        c1: Color.valueOf("#38bdf8"),
        c2: Color.valueOf("#818cf8"),
        reqItem: Items.silicon,
        reqAmount: 2
    },
    {
        name: "3. Đạn Hạt Nhân Diện RỘNG",
        desc: "Sát thương: [accent]10080 Dmg (180%)[]\nYêu cầu: Thorium x4 + Surge Alloy x4 | +900 Điện khi bắn",
        val: 2,
        dmgMult: 1.8,
        reqThorium: 4,
        extraPowerCost: 900,
        c1: Color.valueOf("#facc15"),
        c2: Color.valueOf("#f97316"),
        reqItem: Items.surgeAlloy,
        reqAmount: 4
    },
    {
        name: "4. Đạn Xung Độc Điện Từ",
        desc: "Sát thương: [accent]6720 Dmg (120%)[]\nYêu cầu: Thorium x2 + Phase Fabric x2 | +600 Điện khi bắn",
        val: 3,
        dmgMult: 1.2,
        reqThorium: 2,
        extraPowerCost: 600,
        c1: Color.valueOf("#4ade80"),
        c2: Color.valueOf("#22d3ee"),
        reqItem: Items.phaseFabric,
        reqAmount: 2
    },
    {
        name: "5. Siêu Đạn Obs Khai Diệt",
        desc: "Sát thương: [accent]28000 Dmg (500%)[]\nYêu cầu: Thorium x1000 + Obs x1200 | +1200 Điện khi bắn\n[lightgray]Tạo 5-14 nổ phụ lần lượt xung quanh. Tone màu Trắng-Đen.[]",
        val: 4,
        dmgMult: 5.0,
        reqThorium: 1000,
        extraPowerCost: 1200,
        c1: Color.valueOf("#ffffff"),
        c2: Color.valueOf("#18181b"),
        reqItem: itemObs,
        reqAmount: 1200
    }
];

const ELEC_OUTER_BLACK = Color.valueOf("#18181b");
const ELEC_MID_GRAY    = Color.valueOf("#52525b");
const ELEC_CORE_WHITE  = Color.valueOf("#ffffff");

const CHARGE_DARK_PINK_RED = Color.valueOf("#be123c");
const CHARGE_LIGHT_PINK    = Color.valueOf("#fb7185");

const armorShredStatus = extend(StatusEffect, "pinfyr-armor-shred", {
    init() {
        this.super$init();
        this.color = Color.valueOf("#fb7185");
        this.speedMultiplier = 0.85;
        this.healthMultiplier = 0.95;
    },
    
    update(unit, time) {
        this.super$update(unit, time);
        if (unit != null) { 
            unit.armor = 0;
            
            if (unit.dead || unit.health <= 0) {
                pinfyrStackMap.remove(unit.id);
            }
        }
    }
});

const burstLaserType = extend(LaserBulletType, {
    length: 480,
    width: 18,
    sideLength: 0,
    sideWidth: 0,
    lifetime: 25,
    colors: [ELEC_OUTER_BLACK, Color.valueOf("#c084fc"), Color.white]
});

function createPinfyrDynamicLaser(targetDst) {
    return extend(LaserBulletType, {
        damage: 2002,
        length: Math.max(16, targetDst),
        width: 10,
        sideLength: 0,
        sideWidth: 0,
        lifetime: 20,
        armorPiercing: true,
        colors: [Color.valueOf("#f43f5e"), Color.valueOf("#fb7185"), Color.white],
        
        hitEntity(b, entity, health) {
            this.super$hitEntity(b, entity, health);
            if (entity != null && typeof entity.apply === "function") {
                let unitId = entity.id;
                let currentStacks = pinfyrStackMap.get(unitId, 0);

                currentStacks++;
                pinfyrStackMap.put(unitId, currentStacks);

                entity.apply(armorShredStatus, 300);
            }
        }
    });
}

const lyvervon3LayerLightningFx = new Effect(14, e => {
    if (Vars.state.isPaused()) return;
    if (!(e.data instanceof Seq)) return;
    
    const points = e.data;
    let baseWidth = e.rotation > 0 ? e.rotation : 3.5;
    let fout = e.fout();

    Draw.z(Layer.effect + 0.2);

    Draw.color(ELEC_OUTER_BLACK);
    Lines.stroke(baseWidth * 1.8 * fout);
    for (let i = 0; i < points.size - 1; i++) {
        Lines.line(points.get(i).x, points.get(i).y, points.get(i+1).x, points.get(i+1).y, false);
    }

    Draw.color(ELEC_MID_GRAY);
    Lines.stroke(baseWidth * 1.0 * fout);
    for (let i = 0; i < points.size - 1; i++) {
        Lines.line(points.get(i).x, points.get(i).y, points.get(i+1).x, points.get(i+1).y, false);
    }

    Draw.color(ELEC_CORE_WHITE);
    Lines.stroke(baseWidth * 0.45 * fout);
    for (let i = 0; i < points.size - 1; i++) {
        Lines.line(points.get(i).x, points.get(i).y, points.get(i+1).x, points.get(i+1).y, false);
    }

    Draw.reset();
});

function create3LayerLightningStandard(x1, y1, x2, y2, thickness) {
    let dst = Mathf.dst(x1, y1, x2, y2);
    let segs = Math.max(4, Math.floor(dst / 7));
    let points = new Seq();
    points.add(new Vec2(x1, y1));
    let angle = Angles.angle(x1, y1, x2, y2);

    for (let i = 1; i < segs; i++) {
        let t = i / segs;
        let px = Mathf.lerp(x1, x2, t);
        let py = Mathf.lerp(y1, y2, t);
        let maxCurve = 18; 
        let jitter = 13;   
        let arc = Mathf.sin(t * Math.PI) * maxCurve;
        let noise = Mathf.range(jitter) * (1 - t);

        Tmp.v1.trns(angle + 90, arc + noise);
        points.add(new Vec2(px + Tmp.v1.x, py + Tmp.v1.y));
    }
    points.add(new Vec2(x2, y2));
    lyvervon3LayerLightningFx.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
}

const vGalaxChargeFx = new Effect(120, cons(e => {
    if (Vars.state.isPaused()) return;
    Draw.z(Layer.effect + 0.1);
    
    let fin = e.fin(); 
    let fout = e.fout();

    const rings = [
        { initRadius: 120, speedMult: 1.0, stroke: 3.0 },
        { initRadius: 90,  speedMult: 1.3, stroke: 2.2 },
        { initRadius: 150, speedMult: 0.8, stroke: 4.0 },
        { initRadius: 70,  speedMult: 1.6, stroke: 1.8 }
    ];

    rings.forEach(ring => {
        let currentProgress = Math.min(1.0, fin * ring.speedMult);
        let currentRadius = ring.initRadius * (1.0 - currentProgress);

        if (currentRadius > 0.5) {
            Draw.color(CHARGE_DARK_PINK_RED, CHARGE_LIGHT_PINK, currentProgress);
            Lines.stroke(ring.stroke * (1.0 - currentProgress));
            Lines.circle(e.x, e.y, currentRadius);

            Draw.color(Color.white);
            Lines.stroke((ring.stroke * 0.5) * (1.0 - currentProgress));
            Lines.circle(e.x, e.y, currentRadius);
        }
    });

    if (Mathf.chanceDelta(0.3)) {
        let angle = Mathf.random(360);
        let startX = e.x + Angles.trnsx(angle, 40 * fout);
        let startY = e.y + Angles.trnsy(angle, 40 * fout);
        Fx.lightning.at(startX, startY, angle + 180, CHARGE_DARK_PINK_RED);
    }

    Draw.reset();
}));

function createIndeniterExplosionFx(radius) {
    return new Effect(50, cons(e => {
        if (Vars.state.isPaused()) return;
        Draw.z(Layer.effect + 0.1);
        let maxRadius = radius;
        let alpha = 1.0 - e.fin();

        let colorArray = e.data || [Color.valueOf("#c084fc"), Color.valueOf("#e879f9")];
        let col = colorArray[0];
        let col2 = colorArray[1];

        Draw.color(col);
        Draw.alpha(alpha * 0.35);
        Fill.circle(e.x, e.y, maxRadius);

        Draw.color(col);
        Draw.alpha(alpha * 0.7);
        Lines.stroke(2.5 * alpha);
        Lines.circle(e.x, e.y, maxRadius);

        const ringColors = [Color.white, col2, col];

        for (let i = 0; i < 3; i++) {
            let delay = i * 0.12;
            if (e.fin() > delay) {
                let progress = (e.fin() - delay) / (1.0 - delay);
                let smoothProgress = Interp.pow3Out.apply(progress);
                let dynamicRadius = maxRadius * smoothProgress;

                Draw.color(ringColors[i]);
                Draw.alpha(alpha * (1.0 - smoothProgress));
                Lines.stroke((14.0 - i * 3.0) * (1.0 - smoothProgress));
                Lines.circle(e.x, e.y, dynamicRadius);
            }
        }

        Draw.reset();
    }));
}

const vGalaxIndeniterExplosionFx = createIndeniterExplosionFx(960.0);
const vGalaxMiniExplosionFx = createIndeniterExplosionFx(96.0);

const vGalaxCollapseFx = new Effect(45, cons(e => {
    if (Vars.state.isPaused()) return;
    Draw.z(Layer.effect + 0.05);
    let fout = e.fout();
    let maxRadius = 960.0;
    let currentRadius = maxRadius * fout;
    
    let colors = e.data || [Color.valueOf("#c084fc"), Color.valueOf("#e879f9")];

    Draw.color(colors[0], colors[1], e.fin());
    Lines.stroke(4.0 * fout);
    Lines.circle(e.x, e.y, currentRadius);

    Draw.color(Color.white);
    Lines.stroke(1.5 * fout);
    Lines.circle(e.x, e.y, currentRadius);

    Draw.reset();
}));

function draw3DRotatedEllipseWave(centerX, centerY, radiusX, radiusY, rotationDeg) {
    let points = 24;
    let rotationRad = rotationDeg * Mathf.degRad;
    let cosRot = Math.cos(rotationRad);
    let sinRot = Math.sin(rotationRad);
    
    let localX = radiusX;
    let localY = 0;
    let lastX = centerX + (localX * cosRot - localY * sinRot);
    let lastY = centerY + (localX * sinRot + localY * cosRot);
    
    for (let i = 1; i <= points; i++) {
        let angle = (i * 360 / points) * Mathf.degRad;
        localX = Math.cos(angle) * radiusX;
        localY = Math.sin(angle) * radiusY;
        
        let nextX = centerX + (localX * cosRot - localY * sinRot);
        let nextY = centerY + (localX * sinRot + localY * cosRot);
        
        Lines.line(lastX, lastY, nextX, nextY);
        
        lastX = nextX;
        lastY = nextY;
    }
}

const vGalaxSkyStrikeFx = new Effect(50, cons(e => {
    if (Vars.state.isPaused()) return;
    Draw.z(Layer.effect + 3);
    
    let f = e.fin();
    let alpha = 1.0 - Interp.pow3Out.apply(f);
    
    let colors = e.data || [Color.valueOf("#c084fc"), Color.valueOf("#e879f9")];
    let primaryColor = colors[0];
    let secondaryColor = colors[1];

    let startX = e.x - 600;
    let startY = e.y + 1100;

    Lines.stroke(32 * alpha, primaryColor);
    Lines.line(startX, startY, e.x, e.y);
    Lines.stroke(14 * alpha, Color.white);
    Lines.line(startX, startY, e.x, e.y);

    for (let i = 0; i < 5; i++) {
        let t1 = Mathf.random(1.0);
        let t2 = Math.min(1.0, t1 + 0.2);
        let lx1 = Mathf.lerp(startX, e.x, t1) + Mathf.range(30.0);
        let ly1 = Mathf.lerp(startY, e.y, t1) + Mathf.range(30.0);
        let lx2 = Mathf.lerp(startX, e.x, t2) + Mathf.range(30.0);
        let ly2 = Mathf.lerp(startY, e.y, t2) + Mathf.range(30.0);

        create3LayerLightningStandard(lx1, ly1, lx2, ly2, 3.0);
    }

    let laserAngle = 33;
    let moveX = (startX - e.x) * 0.2 * Interp.pow2Out.apply(f);
    let moveY = (startY - e.y) * 0.2 * Interp.pow2Out.apply(f);

    let wave1X = e.x + moveX; 
    let wave1Y = e.y + moveY; 
    let radius1 = 10 + (120 * Interp.pow3Out.apply(f));   
    
    Lines.stroke(3.5 * (1.0 - f), primaryColor);
    draw3DRotatedEllipseWave(wave1X, wave1Y, radius1, radius1 * 0.45, laserAngle);

    let wave2X = e.x + (moveX * 0.7); 
    let wave2Y = e.y + (moveY * 0.7); 
    let radius2 = radius1 * 0.66; 
    
    Lines.stroke(2.0 * (1.0 - f), secondaryColor); 
    draw3DRotatedEllipseWave(wave2X, wave2Y, radius2, radius2 * 0.45, laserAngle); 
    
    Draw.reset();
}));

const vTargetWarningFx = new Effect(240, cons(e => {
    if (Vars.state.isPaused()) return;
    Draw.z(Layer.effect + 0.01);
    let fout = e.fout();
    let fin = e.fin();
    
    let color = e.data || Color.valueOf("#c084fc");

    Draw.color(color);
    Lines.stroke(2.5 * fout);
    Lines.circle(e.x, e.y, 960.0 * fin);

    let crossSize = 25.0 * fout;
    Lines.stroke(2.0 * fout, color);
    Lines.line(e.x - crossSize, e.y, e.x + crossSize, e.y);
    Lines.line(e.x, e.y - crossSize, e.x, e.y + crossSize);

    Lines.stroke(1.0 * fout, Color.white);
    Lines.line(e.x - crossSize * 0.6, e.y, e.x + crossSize * 0.6, e.y);
    Lines.line(e.x, e.y - crossSize * 0.6, e.x, e.y + crossSize * 0.6);

    let triOffset = 40.0 + (30.0 * fin);
    let triSize = 10.0 * fout;

    for (let i = 0; i < 4; i++) {
        let angle = i * 90;
        let tx = e.x + Angles.trnsx(angle, triOffset);
        let ty = e.y + Angles.trnsy(angle, triOffset);

        Draw.color(color);
        Fill.poly(tx, ty, 3, triSize, angle + 180);
        Draw.color(Color.white);
        Fill.poly(tx, ty, 3, triSize * 0.5, angle + 180);
    }

    Fill.circle(e.x, e.y, 4.0 * fout);
    Draw.reset();
}));

const vSkyLaunchFx = new Effect(35, cons(e => {
    if (Vars.state.isPaused()) return;
    Draw.z(Layer.effect + 2);
    
    let fin = e.fin();
    let fout = e.fout();
    let colors = e.data || [Color.valueOf("#c084fc"), Color.valueOf("#e879f9")];

    let currentDist = 1200 * Interp.pow2Out.apply(fin);
    let endX = e.x + (180 * (currentDist / 1200));
    let endY = e.y + currentDist;

    Lines.stroke(18 * fout, colors[0]);
    Lines.line(e.x, e.y, endX, endY);
    Lines.stroke(8 * fout, Color.white);
    Lines.line(e.x, e.y, endX, endY);

    for (let i = 0; i < 4; i++) {
        let t1 = Mathf.random(0.8);
        let t2 = Math.min(1.0, t1 + 0.2);
        let lx1 = Mathf.lerp(e.x, endX, t1) + Mathf.range(20.0);
        let ly1 = Mathf.lerp(e.y, endY, t1) + Mathf.range(20.0);
        let lx2 = Mathf.lerp(e.x, endX, t2) + Mathf.range(20.0);
        let ly2 = Mathf.lerp(e.y, endY, t2) + Mathf.range(20.0);

        create3LayerLightningStandard(lx1, ly1, lx2, ly2, 2.8);
    }

    Fill.circle(e.x, e.y, 12 * fout);
    Draw.reset();
}));

const vChainLinkFx = new Effect(15, cons(e => {
    if (Vars.state.isPaused()) return;
    Draw.z(Layer.effect + 0.05);
    let fout = e.fout();

    if (e.data != null) {
        let tx = e.data.x;
        let ty = e.data.y;
        
        Draw.color(Color.valueOf("#c084fc"), Color.white, e.fin());
        Lines.stroke(2.0 * fout);
        Lines.line(e.x, e.y, tx, ty);

        Draw.color(Color.white);
        Lines.stroke(1.0 * fout);
        Lines.line(e.x, e.y, tx, ty);

        Fill.circle(e.x, e.y, 3.0 * fout);
        Fill.circle(tx, ty, 3.0 * fout);
    }
    Draw.reset();
}));

const dummyLaserSkyType = extend(LaserBulletType, {
    damage: 0,
    length: 1200,
    width: 22,
    collides: false,
    collidesTiles: false,
    collidesAir: false,
    collidesGround: false
});

const galaxvorram = extend(PowerTurret, "galaxvorram", {
    configurable: true
});

galaxvorram.health = 4500;
galaxvorram.range = 1400; 
galaxvorram.reload = 240;

galaxvorram.hasItems = true;
galaxvorram.itemCapacity = 2000;

galaxvorram.targetAir = false;
galaxvorram.targetGround = false;
galaxvorram.targetBuildings = true;

galaxvorram.shootType = dummyLaserSkyType;
galaxvorram.powerCapacity = 10000;
galaxvorram.consumePower(20.0);

galaxvorram.acceptItem = func((building, item) => {
    let targetObs = itemObs || findContent(ContentType.item, "newex-obs");
    return item === Items.thorium || 
           item === Items.silicon || 
           item === Items.surgeAlloy || 
           item === Items.phaseFabric ||
           (targetObs != null && item === targetObs);
});

galaxvorram.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && typeof tile.setAmmoTypeIndex === "function") {
        tile.setAmmoTypeIndex(Number(value));
    }
}));

galaxvorram.buildType = () => extend(PowerTurret.PowerTurretBuild, galaxvorram, {
    created() {
        this.super$created();
        this._ammoTypeIndex = 0; 

        this.reloadTimer = 0.0;
        this.targetScanTimer = 0.0;
        
        this.pinfyrTimer = 0.0;
        this.pinfyrNextInterval = Mathf.random(30.0, 120.0);

        this.isChainFiring = false;
        this.lockRotationTimer = 0.0;

        this.slaveTicks = 0;
        this.slaveTargetAngle = 0.0;
        this.slaveIsShooting = false;
        this.slaveAimX = 0;
        this.slaveAimY = 0;

        return this;
    },

    getCornerBuildings(targetTypeStr, minPowerRequired) {
        let foundList = new Seq();
        let validNames = (targetTypeStr === "redstone") ? REDSTONE_NAMES : PINFYR_NAMES;
        
        let searchRadius = (targetTypeStr === "pinfyr") ? (21 * 8) : ((this.block.size * 8) + 16);

        Units.nearbyBuildings(this.x, this.y, searchRadius, cons(building => {
            if (building != null && building.team === this.team && !foundList.contains(building)) {
                let bName = building.block.name;
                let isMatch = validNames.some(name => bName === name || bName.endsWith("/" + name));

                if (isMatch) {
                    if (minPowerRequired > 0) {
                        let pModule = building.power;
                        let pCap = building.block.powerCapacity || 4000;
                        let currentStored = pModule != null ? (pModule.status * pCap) : 0;
                        if (currentStored >= minPowerRequired) {
                            foundList.add(building);
                        }
                    } else {
                        foundList.add(building);
                    }
                }
            }
        }));

        return foundList;
    },

    getCornerBlockCount(targetTypeStr, minPowerRequired) {
        return this.getCornerBuildings(targetTypeStr, minPowerRequired).size;
    },

    range() {
        let redstoneWallCount = this.getCornerBlockCount("redstone", 0);
        return galaxvorram.range + (redstoneWallCount * 800);
    },

    turnToTarget(targetAngle) {
        if (this.lockRotationTimer > 0) return;
        this.super$turnToTarget(targetAngle);
    },

    getMaximumAccepted(item) {
        let targetObs = itemObs || findContent(ContentType.item, "newex-obs");
        if (item === Items.thorium || 
            item === Items.silicon || 
            item === Items.surgeAlloy || 
            item === Items.phaseFabric ||
            (targetObs != null && item === targetObs)) {
            return galaxvorram.itemCapacity;
        }
        return 0;
    },

    acceptItem(source, item) {
        let targetObs = itemObs || findContent(ContentType.item, "newex-obs");
        let isValidItem = (item === Items.thorium || 
                           item === Items.silicon || 
                           item === Items.surgeAlloy || 
                           item === Items.phaseFabric ||
                           (targetObs != null && item === targetObs));
        
        if (!isValidItem || this.items == null) return false;
        return this.items.get(item) < this.getMaximumAccepted(item);
    },

    getAmmoTypeIndex() { 
        return this._ammoTypeIndex !== undefined ? this._ammoTypeIndex : 0; 
    },
    
    setAmmoTypeIndex(val) { 
        this._ammoTypeIndex = Number(val); 
    },

    setSlaveCommand(angle, isShooting, aimX, aimY) {
        this.slaveTicks = 5;
        this.slaveTargetAngle = Number(angle);
        this.slaveIsShooting = !!isShooting;
        this.slaveAimX = Number(aimX);
        this.slaveAimY = Number(aimY);
    },

    syncChainCommand(targetAngle, isShooting, aimX, aimY) {
        if (this.isChainFiring) return;
        this.isChainFiring = true;

        let adjacentRadius = (this.block.size * 8) + 8.0; 

        Units.nearbyBuildings(this.x, this.y, adjacentRadius, cons(b => {
            if (b != null && b !== this && b.block === this.block && b.team === this.team) {
                let dstX = Math.abs(this.x - b.x);
                let dstY = Math.abs(this.y - b.y);
                
                let isAdjacent = (dstX < 4.0 && dstY <= adjacentRadius) || (dstY < 4.0 && dstX <= adjacentRadius);

                if (isAdjacent && typeof b.setSlaveCommand === "function" && !b.isChainFiring) {
                    b.setSlaveCommand(targetAngle, isShooting, aimX, aimY);

                    if (isShooting) {
                        vChainLinkFx.at(this.x, this.y, 0, { x: Number(b.x), y: Number(b.y) });
                    }

                    if (typeof b.syncChainCommand === "function") {
                        b.syncChainCommand(targetAngle, isShooting, aimX, aimY);
                    }
                }
            }
        }));

        this.isChainFiring = false;
    },

    drawSelect() {
        this.super$drawSelect();
        let adjacentRadius = (this.block.size * 8) + 8.0;

           Draw.z(Layer.power + 1);
        Draw.color(Color.valueOf("#fb7185"));
        Lines.stroke(1.0);
        Lines.dashCircle(this.x, this.y, 21 * 8);
        Draw.reset();

           Units.nearbyBuildings(this.x, this.y, adjacentRadius, cons(b => {
            if (b != null && b !== this && b.block === this.block && b.team === this.team) {
                let dstX = Math.abs(this.x - b.x);
                let dstY = Math.abs(this.y - b.y);
                let isAdjacent = (dstX < 4.0 && dstY <= adjacentRadius) || (dstY < 4.0 && dstX <= adjacentRadius);

                if (isAdjacent) {
                    Draw.z(Layer.power + 1);
                    Draw.color(AMMO_DATA[this.getAmmoTypeIndex()].c1);
                    Lines.stroke(1.2);
                    Lines.line(this.x, this.y, b.x, b.y);

                    Draw.color(Color.white);
                    Lines.stroke(0.6);
                    Lines.line(this.x, this.y, b.x, b.y);

                    Fill.circle(b.x, b.y, 2.0);
                    Draw.reset();
                }
            }
        }));

           let redstoneList = this.getCornerBuildings("redstone", 0);
        redstoneList.each(b => {
            Draw.z(Layer.power + 1);
            Draw.color(Color.valueOf("#ef4444"));
            Lines.stroke(1.0);
            Lines.dashLine(this.x, this.y, b.x, b.y, Math.floor(Mathf.dst(this.x, this.y, b.x, b.y) / 12));

            Draw.color(Color.white);
            Fill.circle(b.x, b.y, 2.0);
            Lines.stroke(0.8);
            Lines.circle(b.x, b.y, b.block.size * 4);
            Draw.reset();
        });

          let pinfyrList = this.getCornerBuildings("pinfyr", 0);
        pinfyrList.each(b => {
            let pCap = b.block.powerCapacity || 4000;
            let currentP = b.power != null ? (b.power.status * pCap) : 0;
            let hasPower = currentP >= 1000;

            Draw.z(Layer.power + 1);
            Draw.color(hasPower ? Color.valueOf("#fb7185") : Color.gray);
            Lines.stroke(1.0);
            Lines.dashLine(this.x, this.y, b.x, b.y, Math.floor(Mathf.dst(this.x, this.y, b.x, b.y) / 12));

            Draw.color(hasPower ? Color.white : Color.darkGray);
            Fill.circle(b.x, b.y, 2.0);
            Draw.reset();
        });
    },

    hasAmmoAndPowerToShoot() {
        if (this.items == null || this.power == null) return false;

        let ammo = AMMO_DATA[this.getAmmoTypeIndex()];
        let targetObs = itemObs || findContent(ContentType.item, "newex-obs");
        
        if (this.items.get(Items.thorium) < ammo.reqThorium) return false;
        
        let requiredItem = (ammo.val === 4) ? targetObs : ammo.reqItem;
        if (requiredItem != null && requiredItem !== Items.thorium) {
            if (this.items.get(requiredItem) < ammo.reqAmount) return false;
        }

        return (this.power.status * galaxvorram.powerCapacity) >= ammo.extraPowerCost;
    },

    executeSkyStrike(targetX, targetY) {
        let ammoIndex = this.getAmmoTypeIndex();
        let ammo = AMMO_DATA[ammoIndex];
        let targetObs = itemObs || findContent(ContentType.item, "newex-obs");

        if (this.items != null) {
            this.items.remove(Items.thorium, ammo.reqThorium);
            let requiredItem = (ammoIndex === 4) ? targetObs : ammo.reqItem;
            if (requiredItem != null && requiredItem !== Items.thorium) {
                this.items.remove(requiredItem, ammo.reqAmount);
            }
        }

        if (this.power != null) {
            this.power.status -= (ammo.extraPowerCost / galaxvorram.powerCapacity);
            if (this.power.status < 0) this.power.status = 0;
        }

        this.lockRotationTimer = 180.0;

        vGalaxChargeFx.at(this.x, this.y);
        vTargetWarningFx.at(targetX, targetY, 0, ammo.c1);

        let team = this.team;
        let colors = [ammo.c1, ammo.c2];
        let dmgMult = ammo.dmgMult;
        let launchX = this.x;
        let launchY = this.y;

        Time.run(120, packRun(() => {
            vSkyLaunchFx.at(launchX, launchY, 0, colors);

            Time.run(120, packRun(() => {
                let baseDmg = 5600.0 * dmgMult;

                vGalaxSkyStrikeFx.at(targetX, targetY, 0, colors);
                vGalaxCollapseFx.at(targetX, targetY, 0, colors);
                vGalaxIndeniterExplosionFx.at(targetX, targetY, 0, colors);

                let laserDmg = baseDmg * 0.5;
                let laserCount = 12;
                
                for (let i = 0; i < laserCount; i++) {
                    let randomAngle = (i * (360 / laserCount)) + Mathf.range(15.0);
                    burstLaserType.create(this, team, targetX, targetY, randomAngle, laserDmg, 1.0);
                }

                Damage.damage(team, targetX, targetY, 960.0, baseDmg, true, true);

                if (ammoIndex === 4) {
                    let subExplosionCount = Mathf.random(5, 14);
                    let subDmg = 5600.0 * 0.5; 
                    let currentDelay = 0;

                    for (let i = 0; i < subExplosionCount; i++) {
                        let offsetDist = Mathf.random(80.0, 960.0 * 0.85);
                        let offsetAngle = Mathf.random(360.0);
                        let subX = targetX + Angles.trnsx(offsetAngle, offsetDist);
                        let subY = targetY + Angles.trnsy(offsetAngle, offsetDist);

                        currentDelay += Mathf.random(3, 12);

                        Time.run(currentDelay, packRun(() => {
                            vGalaxMiniExplosionFx.at(subX, subY, 0, colors);
                            Damage.damage(team, subX, subY, 96.0, subDmg, true, true);
                            Fx.reactorExplosion.at(subX, subY);
                        }));
                    }
                }

                Effect.shake(14.0, 14.0, targetX, targetY);
                Fx.reactorExplosion.at(targetX, targetY);
            }));
        }));
    },

    updateTile() {
        this.super$updateTile();

        if (this.slaveTicks > 0) this.slaveTicks--;
        if (this.reloadTimer > 0) this.reloadTimer -= Time.delta;
        if (this.lockRotationTimer > 0) this.lockRotationTimer -= Time.delta;

        let pinfyrActiveBuildings = this.getCornerBuildings("pinfyr", 1000); 
        if (pinfyrActiveBuildings.size > 0) {
            this.pinfyrTimer += Time.delta;

            if (this.pinfyrTimer >= this.pinfyrNextInterval) {
                this.pinfyrTimer = 0.0;
                this.pinfyrNextInterval = Mathf.random(30.0, 120.0);

                pinfyrActiveBuildings.each(pBuilding => {
                    if (pBuilding.power != null) {
                        let pCap = pBuilding.block.powerCapacity || 4000;
                        let currentStored = pBuilding.power.status * pCap;

                        if (currentStored >= 1000) {
                            let newPower = currentStored - 1000;
                            pBuilding.power.status = Math.max(0, newPower / pCap);

                            let enemyTarget = Units.closestTarget(
                                this.team, 
                                this.x, 
                                this.y, 
                                4000.0, 
                                u => u.checkTarget(true, true), 
                                b => !(b.block instanceof CoreBlock)
                            );

                            if (enemyTarget != null) {
                                let dst = Mathf.dst(pBuilding.x, pBuilding.y, enemyTarget.x, enemyTarget.y);
                                let aimAngle = Angles.angle(pBuilding.x, pBuilding.y, enemyTarget.x, enemyTarget.y);

                                let pLaser = createPinfyrDynamicLaser(dst);
                                pLaser.create(this, this.team, pBuilding.x, pBuilding.y, aimAngle, 1.0, 1.0);
                            }
                        }
                    }
                });
            }
        }

        let isLocked = (this.lockRotationTimer > 0);
        let isDirectControlled = this.isControlled() || this.logicControlled();
        let isSlaveControlled = (this.slaveTicks > 0);
        let hasPower = this.power != null && this.power.status > 0.1;

        let targetX = this.x;
        let targetY = this.y;

        if (isDirectControlled) {
            this.slaveTicks = 0;
            let u = this.unit;
            if (u != null) {
                targetX = u.aimX;
                targetY = u.aimY;
                
                if (!isLocked) {
                    let targetAngle = this.angleTo(targetX, targetY);
                    this.rotation = Angles.moveToward(this.rotation, targetAngle, galaxvorram.rotateSpeed * Time.delta);
                }
                
                this.syncChainCommand(this.rotation, this.isShooting, targetX, targetY);
            }
        } else if (isSlaveControlled) {
            targetX = this.slaveAimX;
            targetY = this.slaveAimY;
            
            if (!isLocked) {
                this.rotation = Angles.moveToward(this.rotation, this.slaveTargetAngle, galaxvorram.rotateSpeed * Time.delta);
            }
        } else {
            this.targetScanTimer += Time.delta;
            if (this.targetScanTimer >= 15.0) {
                this.targetScanTimer = 0.0;

                let enemyCore = Vars.state.teams.closestEnemyCore(this.x, this.y, this.team);
                if (enemyCore != null && this.within(enemyCore, this.range())) {
                    this.target = enemyCore;
                } else {
                    this.target = null;
                }
            }

            if (hasPower && this.target != null) {
                targetX = this.target.x;
                targetY = this.target.y;
                this.turnToTarget(this.angleTo(this.target));
            }
        }

        let targetAngle = this.angleTo(targetX, targetY);
        let isAimed = Angles.near(this.rotation, targetAngle, 5.0);

        let canShoot = false;
        if (!isLocked && hasPower && isAimed && this.hasAmmoAndPowerToShoot()) {
            if (isDirectControlled) canShoot = this.isShooting;
            else if (isSlaveControlled) canShoot = this.slaveIsShooting;
            else canShoot = (this.target != null && this.within(this.target, this.range()));
        }

        if (canShoot && this.reloadTimer <= 0) {
            this.reloadTimer = galaxvorram.reload;
            this.executeSkyStrike(targetX, targetY);
        }
    },

    buildConfiguration(table) {
        table.clear();
        table.row();

        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialog = new BaseDialog("Hệ Thống Lựa Chọn Loại Đạn - Galaxvorram");

            let mainTable = new Table();
            mainTable.background(Styles.black6);
            mainTable.margin(12);

            mainTable.add("[gold]★ BẢNG ĐIỀU CHỈNH CHẾ ĐỘ ĐẠN GALAXVORRAM ★[]").row();
            mainTable.add().height(10).row();

            AMMO_DATA.forEach(ammo => {
                let isSelected = (this.getAmmoTypeIndex() === ammo.val);
                let btnText = (isSelected ? "[green]✔ " : "[white]") + ammo.name;

                mainTable.button(btnText, packRun(() => {
                    this.setAmmoTypeIndex(ammo.val);
                    this.configure(java.lang.Integer.valueOf(ammo.val));
                    Fx.upgradeCore.at(this.x, this.y);
                    Vars.ui.showInfo("[gold]Đã cài đặt loại đạn:[]\n" + ammo.name);
                    dialog.hide();
                    this.deselect();
                })).size(340, 42).row();

                let descCell = mainTable.add(ammo.desc).width(320);
                descCell.get().setWrap(true);
                descCell.get().setAlignment(Align.left);
                mainTable.add().height(12).row();
            });

            let scroll = new ScrollPane(mainTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton();
            dialog.show();
        })).size(50, 40).tooltip("Chọn loại đạn bắn cho pháo Galaxvorram");

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let redstoneCount = this.getCornerBlockCount("redstone", 0);
            let pinfyrList = this.getCornerBuildings("pinfyr", 0);
            let pinfyrActiveCount = this.getCornerBlockCount("pinfyr", 1000);

            let totalRange = galaxvorram.range + (redstoneCount * 800);

            let pinfyrInfoStr = "";
            pinfyrList.each((b, i) => {
                let pCap = b.block.powerCapacity || 4000;
                let currentP = b.power != null ? Math.floor(b.power.status * pCap) : 0;
                let statusColor = currentP >= 1000 ? "[green]" : "[scarlet]";
                pinfyrInfoStr += "\n  └ Khối Pinfyr #" + (i + 1) + ": " + statusColor + currentP + " / " + pCap + " Điện[] (Cần ≥ 1,000)";
            });

            let dialog = new BaseDialog("Thông số pháo Galaxvorram");
            let infoTable = new Table();
            infoTable.margin(10);

            let descStr = "[gold]⚡ THÔNG SỐ VŨ KHÍ GALAXVORRAM ⚡[]\n" +
                          "• Máu: 4,500\n" +
                          "• Tầm ngắm gốc: 1,400px\n" +
                          "• Sức chứa kho đạn: 2,000\n" +
                          "• Sát thương gốc: [accent]5600 Dmg[]\n\n" +
                          "[scarlet]━━━━ TRẠNG THÁI BUFF REALTIME ━━━━[]\n\n" +
                          "[red]● Khối Redstone-Wall:[] " + redstoneCount + " khối trong tầm kết nối\n" +
                          "  └ Tầm bắn bổ sung: [green]+" + (redstoneCount * 800) + "px[]\n" +
                          "  └ Tổng Tầm Bắn hiện tại: [accent]" + totalRange + "px[]\n\n" +
                          "[pink]● Khối Pinfyr:[] " + pinfyrList.size + " khối trong phạm vi 21 ô xung quanh pháo\n" +
                          "  └ Khối SẴN SÀNG (≥1k Điện): [accent]" + pinfyrActiveCount + "/" + pinfyrList.size + "[]" +
                          (pinfyrList.size > 0 ? pinfyrInfoStr : "") + "\n" +
                          "  └ Tiêu hao điện: [yellow]1,000 Điện / 1 lần bắn / 1 khối[]\n" +
                          "  └ Sát thương tia phụ: [accent]2002 Dmg[] (Xuyên giáp + Trừ 100% Giáp)\n" +
                          "  └ Chiều dài tia: [lightgray]Tự động kéo dài tới vị trí mục tiêu (Không bắn Lõi)[]\n" +
                          "  └ Hiệu ứng cộng dồn: [pink]Không giới hạn tầng[]";

            let cell = infoTable.add(descStr).width(380);
            cell.get().setWrap(true);
            cell.get().setAlignment(Align.left);

            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton();
            dialog.show();
        })).size(50, 40).tooltip("Xem thông số pháo & trạng thái Buff");
    },

    write(write) {
        this.super$write(write);
        write.b(this.getAmmoTypeIndex());
    },

    read(read, revision) {
        this.super$read(read, revision);
        this.setAmmoTypeIndex(read.b());
    }
});