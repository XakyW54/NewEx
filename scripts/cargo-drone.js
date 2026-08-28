global.mk2bUnits = global.mk2bUnits || {};
global.droneLauncherMap = global.droneLauncherMap || {};
global.droneRecallMap = global.droneRecallMap || {};
global.masterDroneSpawnTimers = global.masterDroneSpawnTimers || {};

const coalColor = Color.valueOf("272727");
const coalGlowColor = Color.valueOf("888888");

const masterPurpleColor = Color.valueOf("2b003b");
const masterGlowColor = Color.valueOf("a832d7");

// ==========================================
// ĐẠN KIẾM TRUY ĐUỔI (ĐÃ CHỈNH SỬA)
// ==========================================
const masterHomingSwordBullet = extend(BasicBulletType, {
    speed: 8.0,
    damage: 100,
    lifetime: 3600,
    width: 12,
    height: 35,
    shrinkY: 0,
    
    pierce: true,
    pierceBuilding: false,
    pierceCap: 3, // Giảm xuyên thấu xuống 3

    collidesAir: true,
    collidesGround: true,
    collidesTiles: false,

    homingPower: 0.05, // Giảm truy đuổi xuống yếu (0.05)
    homingRange: 800,
    homingDelay: 5,

    frontColor: Color.white,
    backColor: masterGlowColor,

    draw(b) {
        let swordRegion = Core.atlas.find("units/cargo/swordmaster", 
                          Core.atlas.find("cargo/swordmaster", 
                          Core.atlas.find("swordmaster", 
                          Core.atlas.find("newex-cargo-swordmaster", Core.atlas.find("newex-swordmaster")))));

        let angle = b.rotation();

        // Sprite kiếm
        Draw.z(Layer.bullet);
        if (swordRegion.found) {
            Draw.color(masterPurpleColor);
            Draw.rect(swordRegion, b.x, b.y, swordRegion.width * Draw.scl * 1.4, swordRegion.height * Draw.scl * 1.4, angle - 90);
            Draw.color(masterGlowColor);
            Draw.rect(swordRegion, b.x, b.y, swordRegion.width * Draw.scl * 1.1, swordRegion.height * Draw.scl * 1.1, angle - 90);
            Draw.reset();
        } else {
            this.super$draw(b);
        }

        // Vạch đuôi vẽ phía trước
        let trailLen = 35.0;
        let backX = b.x - Angles.trnsx(angle, trailLen);
        let backY = b.y - Angles.trnsy(angle, trailLen);

        Draw.z(Layer.bullet + 0.01);
        Draw.color(masterPurpleColor);
        Lines.stroke(6.0);
        Lines.line(b.x, b.y, backX, backY);

        Draw.color(masterGlowColor);
        Lines.stroke(3.0);
        Lines.line(b.x, b.y, backX, backY);

        Draw.color(Color.white);
        Lines.stroke(1.2);
        Lines.line(b.x, b.y, backX, backY);
        Draw.reset();
    }
});

const masterShockwaveRingEffect = new Effect(60, e => {
    Draw.z(Layer.effect + 0.1);
    let maxRadius = e.rotation;
    let waveCount = e.data || 1;

    for (let i = 0; i < waveCount; i++) {
        let offsetProg = (e.fin() + i * 0.4) % 1.0;
        let radius = maxRadius * offsetProg;
        let alpha = (1.0 - offsetProg) * e.fout();

        Draw.color(masterGlowColor);
        Lines.stroke(4.0 * alpha);
        Lines.circle(e.x, e.y, radius);

        Draw.color(masterPurpleColor);
        Lines.stroke(2.0 * alpha);
        Lines.circle(e.x, e.y, radius);
    }
    Draw.reset();
});

const swordImpactShockwaveEffect = new Effect(45, e => {
    Draw.z(Layer.effect + 0.2);
    let radius = 120.0 * e.fin(); 

    Draw.color(masterGlowColor);
    Lines.stroke(5.0 * e.fout());
    Lines.circle(e.x, e.y, radius);

    Draw.color(masterPurpleColor);
    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, radius * 0.8);

    Draw.color(Color.white);
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, radius);
    Draw.reset();
});

const masterBeamEffect = new Effect(40, e => {
    Draw.z(Layer.effect + 0.5);
    let nwX = e.x - 400;
    let nwY = e.y + 400;

    Drawf.light(e.x, e.y, 160.0 * e.fout(), masterGlowColor, 0.9 * e.fout());

    Draw.color(masterPurpleColor, Color.black, e.fout());
    Lines.stroke(18.0 * e.fout());
    Lines.line(nwX, nwY, e.x, e.y);

    Draw.color(masterGlowColor, Color.white, e.fout());
    Lines.stroke(9.0 * e.fout());
    Lines.line(nwX, nwY, e.x, e.y);

    Draw.color(Color.white, e.fout());
    Lines.stroke(3.0 * e.fout());
    Lines.line(nwX, nwY, e.x, e.y);
});

const masterSwordsSummonEffect = new Effect(70, e => {
    Draw.z(Layer.flyingUnit + 2.5);

    let swordRegion = Core.atlas.find("units/cargo/swordmaster", 
                      Core.atlas.find("cargo/swordmaster", 
                      Core.atlas.find("swordmaster", 
                      Core.atlas.find("newex-cargo-swordmaster", Core.atlas.find("newex-swordmaster")))));

    let neAngle = 45;
    let baseOffsetAngle = neAngle + 90;
    let randomSeeds = e.data || [0, 0, 0];

    for (let i = -1; i <= 1; i++) {
        let baseSpacing = i * 22; 
        let randShift = randomSeeds[i + 1] || 0;
        let totalShift = baseSpacing + randShift;

        let posX = e.x + Angles.trnsx(baseOffsetAngle, totalShift);
        let posY = e.y + Angles.trnsy(baseOffsetAngle, totalShift);

        Drawf.light(posX, posY, 60 * e.fout(), masterGlowColor, 0.8 * e.fout());

        if (swordRegion.found) {
            Draw.color(masterPurpleColor);
            Draw.alpha(0.9 * e.fout());
            Draw.rect(swordRegion, posX, posY, 
                      swordRegion.width * Draw.scl * 1.5, swordRegion.height * Draw.scl * 1.5, neAngle - 90);

            Draw.color(masterGlowColor);
            Draw.alpha(0.7 * e.fout());
            Draw.rect(swordRegion, posX, posY, 
                      swordRegion.width * Draw.scl * 1.35, swordRegion.height * Draw.scl * 1.35, neAngle - 90);
        } else {
            let len = 34.0;
            let tipX = posX + Angles.trnsx(neAngle, len);
            let tipY = posY + Angles.trnsy(neAngle, len);

            Draw.color(masterPurpleColor, e.fout());
            Lines.stroke(6.0 * e.fout());
            Lines.line(posX, posY, tipX, tipY);

            Draw.color(masterGlowColor, e.fout());
            Lines.stroke(3.5 * e.fout());
            Lines.line(posX, posY, tipX, tipY);
        }
    }
    Draw.reset();
});

const skySwordHoverEffect = new Effect(450, e => {
    Draw.z(Layer.flyingUnit + 2.8);

    let swordRegion = Core.atlas.find("units/cargo/swordmaster", 
                      Core.atlas.find("cargo/swordmaster", 
                      Core.atlas.find("swordmaster", 
                      Core.atlas.find("newex-cargo-swordmaster", Core.atlas.find("newex-swordmaster")))));

    let alpha = Math.min(1.0, e.fin() * 6.0) * e.fout();
    let angle = e.rotation;

    let skyX = e.x;
    let skyY = e.y;

    if (swordRegion.found) {
        Draw.color(masterPurpleColor);
        Draw.alpha(alpha);
        Draw.rect(swordRegion, skyX, skyY, swordRegion.width * Draw.scl * 1.5, swordRegion.height * Draw.scl * 1.5, angle - 90);
        Draw.color(masterGlowColor);
        Draw.alpha(alpha * 0.8);
        Draw.rect(swordRegion, skyX, skyY, swordRegion.width * Draw.scl * 1.25, swordRegion.height * Draw.scl * 1.25, angle - 90);
    } else {
        let len = 30.0;
        let tipX = skyX + Angles.trnsx(angle, len);
        let tipY = skyY + Angles.trnsy(angle, len);
        Draw.color(masterPurpleColor, alpha);
        Lines.stroke(6.0);
        Lines.line(skyX, skyY, tipX, tipY);
        Draw.color(masterGlowColor, alpha);
        Lines.stroke(3.0);
        Lines.line(skyX, skyY, tipX, tipY);
    }
    Draw.reset();
});

const skySwordRainEffect = new Effect(20, e => {
    Draw.z(Layer.flyingUnit + 3.0);

    let data = e.data;
    if (!data) return;

    let startX = data.skyX;
    let startY = data.skyY;
    let targetX = data.targetX;
    let targetY = data.targetY;
    let angle = e.rotation;

    let currentX = Mathf.lerp(startX, targetX, e.fin());
    let currentY = Mathf.lerp(startY, targetY, e.fin());

    let trailLen = 120.0;
    let backX = currentX - Angles.trnsx(angle, trailLen);
    let backY = currentY - Angles.trnsy(angle, trailLen);

    Draw.color(Color.white, e.fout());
    Lines.stroke(4.5 * e.fout());
    Lines.line(currentX, currentY, backX, backY);

    Draw.color(masterGlowColor, e.fout());
    Lines.stroke(2.0 * e.fout());
    Lines.line(currentX, currentY, backX, backY);

    let swordRegion = Core.atlas.find("units/cargo/swordmaster", 
                      Core.atlas.find("cargo/swordmaster", 
                      Core.atlas.find("swordmaster", 
                      Core.atlas.find("newex-cargo-swordmaster", Core.atlas.find("newex-swordmaster")))));

    if (swordRegion.found) {
        Draw.color(masterPurpleColor);
        Draw.rect(swordRegion, currentX, currentY, swordRegion.width * Draw.scl * 1.6, swordRegion.height * Draw.scl * 1.6, angle - 90);
        Draw.color(masterGlowColor);
        Draw.rect(swordRegion, currentX, currentY, swordRegion.width * Draw.scl * 1.3, swordRegion.height * Draw.scl * 1.3, angle - 90);
    } else {
        Draw.color(masterPurpleColor);
        Lines.stroke(8.0);
        Lines.line(currentX, currentY, currentX + Angles.trnsx(angle, 35), currentY + Angles.trnsy(angle, 35));
        Draw.color(masterGlowColor);
        Lines.stroke(4.0);
        Lines.line(currentX, currentY, currentX + Angles.trnsx(angle, 35), currentY + Angles.trnsy(angle, 35));
    }

    if (e.fin() >= 0.9) {
        Drawf.light(targetX, targetY, 120, masterGlowColor, 0.9);
    }
    Draw.reset();
});

const renderAttachedMasterSwordsEffect = new Effect(2, e => {
    Draw.z(Layer.flyingUnit + 2.0);
    
    let swordRegion = Core.atlas.find("units/cargo/swordmaster", 
                      Core.atlas.find("cargo/swordmaster", 
                      Core.atlas.find("swordmaster", 
                      Core.atlas.find("newex-cargo-swordmaster", Core.atlas.find("newex-swordmaster")))));

    let swordAngle = 45; 
    let perpendicularAngle = swordAngle - 90;

    let offsets = [
        { forward: 18, side: -12 }, 
        { forward: 0,  side: 0 },   
        { forward: -18, side: 14 }  
    ];

    for (let i = 0; i < offsets.length; i++) {
        let off = offsets[i];
        let sx = e.x + Angles.trnsx(swordAngle, off.forward) + Angles.trnsx(perpendicularAngle, off.side);
        let sy = e.y + Angles.trnsy(swordAngle, off.forward) + Angles.trnsy(perpendicularAngle, off.side);

        Drawf.light(sx, sy, 35, masterGlowColor, 0.8);

        if (swordRegion.found) {
            Draw.color(masterPurpleColor);
            Draw.rect(swordRegion, sx, sy, swordRegion.width * Draw.scl * 1.25, swordRegion.height * Draw.scl * 1.25, swordAngle - 90);
            Draw.color(masterGlowColor);
            Draw.rect(swordRegion, sx, sy, swordRegion.width * Draw.scl * 1.05, swordRegion.height * Draw.scl * 1.05, swordAngle - 90);
        } else {
            let tipX = sx + Angles.trnsx(swordAngle, 22);
            let tipY = sy + Angles.trnsy(swordAngle, 22);
            Draw.color(masterPurpleColor);
            Lines.stroke(4.5);
            Lines.line(sx, sy, tipX, tipY);
            Draw.color(masterGlowColor);
            Lines.stroke(2.2);
            Lines.line(sx, sy, tipX, tipY);
        }
    }
    Draw.reset();
});

const recallLaserEffect = new Effect(30, e => {
    let originX = e.data ? e.data[0] : e.x;
    let originY = e.data ? e.data[1] : e.y;

    Draw.color(Color.sky, Color.white, e.fout());
    Lines.stroke(4 * e.fout());
    Lines.line(originX, originY, e.x, e.y);

    Draw.color(Color.white);
    Lines.stroke(1.5 * e.fout());
    Lines.line(originX, originY, e.x, e.y);

    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, 16 * e.fin());
});

const swordDashTrailEffect = new Effect(45, e => {
    Draw.z(Layer.flyingUnit - 0.1);
    
    let tailLen = 90.0;
    let backX = e.x - Angles.trnsx(e.rotation, tailLen);
    let backY = e.y - Angles.trnsy(e.rotation, tailLen);

    Drawf.light(e.x, e.y, 120.0 * e.fout(), Color.white, e.fout());
    Drawf.light(backX, backY, 90.0 * e.fout(), coalGlowColor, 0.8 * e.fout());

    Draw.color(Color.white, coalGlowColor, e.fin());
    Draw.alpha(0.6 * e.fout());
    Fill.circle(e.x, e.y, 22.0 * e.fout());
    Fill.circle(backX, backY, 12.0 * e.fout());

    Draw.color(coalColor, Color.black, e.fout());
    Lines.stroke(20.0 * e.fout());
    Lines.line(e.x, e.y, backX, backY);

    Draw.color(coalGlowColor, Color.white, e.fout());
    Lines.stroke(10.0 * e.fout());
    Lines.line(e.x, e.y, backX, backY);

    Draw.color(Color.white, e.fout());
    Lines.stroke(3.5 * e.fout());
    Lines.line(e.x, e.y, backX, backY);
});

const swordDissolveSparkEffect = new Effect(40, e => {
    Draw.z(Layer.flyingUnit + 2.1);
    Draw.color(coalGlowColor, Color.black, e.fout());
    Fill.circle(e.x, e.y, 3.5 * e.fout());
});

const renderSwordEffect = new Effect(2, e => {
    let data = e.data;
    if (!data) return;

    let rot = e.rotation;
    let rx = e.x;
    let ry = e.y;

    let isCharging = data.isCharging;
    let isDashing = data.isDashing;
    let chargeProgress = data.chargeProgress;
    let dashProgress = data.dashProgress;
    let alpha = data.alpha;

    Draw.z(Layer.flyingUnit + 2.0);

    let swordRegion = Core.atlas.find("units/cargo/sword", 
                      Core.atlas.find("cargo/sword", 
                      Core.atlas.find("sword", 
                      Core.atlas.find("newex-cargo-sword", Core.atlas.find("newex-sword")))));

    let swordX = rx;
    let swordY = ry;
    let swordAngle = rot;

    if (isCharging) {
        let sideAngle = rot - 90;
        swordX = rx + Angles.trnsx(rot, 4) + Angles.trnsx(sideAngle, 12);
        swordY = ry + Angles.trnsy(rot, 4) + Angles.trnsy(sideAngle, 12);
        swordAngle = rot + 20;

        let circleRadius = 20 * (1.0 - chargeProgress);
        Draw.color(coalColor, alpha);
        Lines.stroke(3.0 * alpha);
        Lines.circle(swordX, swordY, circleRadius);
        Draw.color(Color.black, alpha * 0.6);
        Fill.circle(swordX, swordY, circleRadius * 0.7);

    } else if (isDashing) {
        let t = Math.min(1.0, Math.max(0.0, dashProgress));
        swordAngle = rot - Mathf.lerp(0, 140, t);

        swordX = rx;
        swordY = ry;

        let ghostCount = 5;
        for (let g = 1; g <= ghostCount; g++) {
            let ghostT = Math.max(0.0, t - g * 0.05);
            let gAngle = rot - Mathf.lerp(0, 140, ghostT);
            let ghostAlpha = alpha * (1.0 - (g / (ghostCount + 1))) * 0.6;

            if (swordRegion.found) {
                Draw.color(coalColor);
                Draw.alpha(ghostAlpha);
                Draw.rect(swordRegion, rx, ry, 
                          swordRegion.width * Draw.scl * 1.3, swordRegion.height * Draw.scl * 1.3, gAngle - 90);
            } else {
                let len = 26.0;
                let tipX = rx + Angles.trnsx(gAngle, len);
                let tipY = ry + Angles.trnsy(gAngle, len);
                Draw.color(coalColor, ghostAlpha);
                Lines.stroke((5.0 - g * 0.6) * alpha);
                Lines.line(rx, ry, tipX, tipY);
            }
        }
    } else {
        let sideAngle = rot + 90;
        swordX = rx + Angles.trnsx(sideAngle, 12);
        swordY = ry + Angles.trnsy(sideAngle, 12);
        swordAngle = rot - 140;
    }

    if (alpha <= 0.001) return;

    Drawf.light(swordX, swordY, 50 * alpha, Color.white, 0.9 * alpha);

    if (swordRegion.found) {
        Draw.color(coalColor);
        Draw.alpha(alpha);
        Draw.rect(swordRegion, swordX, swordY, 
                  swordRegion.width * Draw.scl * 1.3, swordRegion.height * Draw.scl * 1.3, swordAngle - 90);
    } else {
        let len = 26.0;
        let tipX = swordX + Angles.trnsx(swordAngle, len);
        let tipY = swordY + Angles.trnsy(swordAngle, len);
        Draw.color(coalColor, alpha);
        Lines.stroke(4.0 * alpha);
        Lines.line(swordX, swordY, tipX, tipY);
        Draw.color(coalGlowColor, alpha);
        Lines.stroke(2.0 * alpha);
        Lines.line(swordX, swordY, tipX, tipY);
    }

    Draw.reset();
});

const droneBulletNormal = extend(BasicBulletType, {
    speed: 23.5,
    damage: 60,
    lifetime: 35,
    width: 5,
    height: 29,
    frontColor: Color.valueOf("ffe265"),
    backColor: Color.valueOf("d29600")
});

const droneBulletMK2B = extend(BasicBulletType, {
    speed: 26.0,
    damage: 120,  
    lifetime: 60,
    width: 6,
    height: 32,
    frontColor: Color.valueOf("ff5252"),
    backColor: Color.valueOf("ff1744")
});

const droneData = {};

Events.on(UnitDestroyEvent, event => {
    if (event.unit && droneData[event.unit.id]) {
        delete droneData[event.unit.id];
        delete global.mk2bUnits[event.unit.id];
        delete global.droneLauncherMap[event.unit.id];
        delete global.droneRecallMap[event.unit.id];
        delete global.masterDroneSpawnTimers[event.unit.id];
    }
});

Events.run(Trigger.update, () => {
    if (Vars.state.isPaused()) return;

    let cargoDroneType = Vars.content.getByName(ContentType.unit, "newex-combat-drone") ||
                        Vars.content.getByName(ContentType.unit, "combat-drone") ||
                        Vars.content.getByName(ContentType.unit, "newex-cargo-drone") ||
                        Vars.content.getByName(ContentType.unit, "cargo-drone");
    
    let cargoDroneMK2Type = Vars.content.getByName(ContentType.unit, "newex-cargo-drone-mk2") ||
                           Vars.content.getByName(ContentType.unit, "cargo-drone-mk2") ||
                           Vars.content.getByName(ContentType.unit, "newex-cargo-dronemk2") ||
                           Vars.content.getByName(ContentType.unit, "cargo-dronemk2");

    let swordDroneType = Vars.content.getByName(ContentType.unit, "newex-cargo-sword-drone") ||
                        Vars.content.getByName(ContentType.unit, "cargo-sword-drone") ||
                        Vars.content.getByName(ContentType.unit, "cargo-sworddrone");

    let masterSwordDroneType = Vars.content.getByName(ContentType.unit, "cargo-master-sword-drone") ||
                              Vars.content.getByName(ContentType.unit, "newex-cargo-master-sword-drone");

    if (cargoDroneType == null && cargoDroneMK2Type == null && swordDroneType == null && masterSwordDroneType == null) return;

    Groups.unit.each(unit => {
        let isMasterSwordDrone = (masterSwordDroneType != null && unit.type == masterSwordDroneType);
        let isSwordDrone = (swordDroneType != null && unit.type == swordDroneType);
        let isNormalDrone = (unit.type == cargoDroneType || unit.type == cargoDroneMK2Type);

        if ((isNormalDrone || isSwordDrone || isMasterSwordDrone) && !unit.dead) {
            let id = unit.id;

            if (global.mk2bUnits[id] && !droneData[id] && masterSwordDroneType != null) {
                if (Mathf.chance(0.10) && unit.type != masterSwordDroneType) {
                    let newUnit = masterSwordDroneType.create(unit.team);
                    newUnit.set(unit.x, unit.y);
                    newUnit.add();

                    global.mk2bUnits[newUnit.id] = true;
                    global.droneLauncherMap[newUnit.id] = global.droneLauncherMap[id];

                    delete droneData[id];
                    delete global.mk2bUnits[id];
                    delete global.droneLauncherMap[id];
                    unit.remove();
                    return;
                }
            }

            let isMK2BUnit = !!global.mk2bUnits[id];

            if (!droneData[id]) {
                droneData[id] = { 
                    shootTimer: 0, 
                    targetX: unit.x, 
                    targetY: unit.y, 
                    repathTimer: 0, 
                    initializedMK2B: false,
                    aiMode: null,
                    orbitAngle: Mathf.random(360),
                    strafeDir: Mathf.chance(0.5) ? 1 : -1,
                    targetId: -1,
                    swordState: "idle",  
                    chargeTimer: 0,
                    dashTimer: 0,
                    maxDashTime: 9.33,
                    restTimer: 0,
                    dashDirX: 0,
                    dashDirY: 0,
                    hasAttachedSwords: false,
                    masterAttackState: "idle",
                    masterChargeTimer: 0,
                    masterBarrageTimer: 0,
                    masterSwordsSpawned: 0,
                    masterTotalSwords: 0,
                    masterSwordPositions: [],
                    masterIdleTimer: 0,
                    masterMoveTargetX: unit.x,
                    masterMoveTargetY: unit.y,
                    masterHomingShootTimer: 0
                };

                if (isMasterSwordDrone) {
                    global.masterDroneSpawnTimers[id] = {
                        timer: 0,
                        triggered: false
                    };
                }
            }

            if (isMasterSwordDrone && global.masterDroneSpawnTimers[id]) {
                let st = global.masterDroneSpawnTimers[id];
                if (!st.triggered) {
                    st.timer += Time.delta;
                    if (st.timer >= 30) {
                        st.triggered = true;

                        masterBeamEffect.at(unit.x, unit.y);

                        let randOffsets = [
                            Mathf.range(8.0),
                            Mathf.range(8.0),
                            Mathf.range(8.0)
                        ];

                        masterSwordsSummonEffect.at(unit.x, unit.y, 0, randOffsets);
                        droneData[id].hasAttachedSwords = true;
                    }
                }
            }

            let data = droneData[id];

            if (isMK2BUnit && !data.initializedMK2B) {
                data.initializedMK2B = true;
                unit.maxHealth = unit.type.health * 2;
                unit.health = unit.maxHealth;
                unit.armor = unit.type.armor * 2;
            }

            let launcherId = global.droneLauncherMap[id];
            let launcher = launcherId ? Groups.build.find(b => b.id == launcherId) : null;
            let isBeingRecalled = !!global.droneRecallMap[id];

            if (launcher == null || launcher.dead || !launcher.isValid()) {
                let nwX = unit.x - 300;
                let nwY = unit.y + 300;
                recallLaserEffect.at(unit.x, unit.y, 0, [nwX, nwY]);

                delete droneData[id];
                delete global.mk2bUnits[id];
                delete global.droneLauncherMap[id];
                delete global.droneRecallMap[id];
                delete global.masterDroneSpawnTimers[id];
                unit.remove();
                return;
            }

            let shouldRecall = (isSwordDrone || isMasterSwordDrone) ? isBeingRecalled : (unit.health < unit.maxHealth || isBeingRecalled);

            if (shouldRecall) {
                if (launcher.triggerDoor !== undefined) {
                    launcher.triggerDoor();
                }

                recallLaserEffect.at(unit.x, unit.y, 0, [launcher.x, launcher.y]);

                delete droneData[id];
                delete global.mk2bUnits[id];
                delete global.droneLauncherMap[id];
                delete global.droneRecallMap[id];
                delete global.masterDroneSpawnTimers[id];
                unit.remove();
                return;
            }

            let maxRange = launcher.getRange();
            let moveSpeed = isMK2BUnit ? unit.type.speed * 1.2 : unit.type.speed;

            if (isMasterSwordDrone) {
                if (data.hasAttachedSwords) {
                    renderAttachedMasterSwordsEffect.at(unit.x, unit.y, unit.rotation);
                }

                if (data.masterAttackState !== "charging") {
                    data.masterIdleTimer += Time.delta;

                    if (data.masterIdleTimer >= 120 + Mathf.random(120) || Mathf.dst2(unit.x, unit.y, data.masterMoveTargetX, data.masterMoveTargetY) < 100) {
                        data.masterIdleTimer = 0;
                        if (Mathf.chance(0.35)) {
                            data.masterMoveTargetX = unit.x;
                            data.masterMoveTargetY = unit.y;
                        } else {
                            let randAngle = Mathf.random(360);
                            let randDist = Mathf.random(20, 80);
                            data.masterMoveTargetX = launcher.x + Angles.trnsx(randAngle, randDist);
                            data.masterMoveTargetY = launcher.y + Angles.trnsy(randAngle, randDist);
                        }
                    }

                    unit.moveAt(Tmp.v1.set(data.masterMoveTargetX - unit.x, data.masterMoveTargetY - unit.y).limit(moveSpeed));
                } else {
                    unit.vel.set(0, 0);
                }

                let target = Units.closestTarget(unit.team, unit.x, unit.y, 900);
                if (target) unit.lookAt(target.x, target.y);

                if (data.masterAttackState === "charging") {
                    data.masterChargeTimer += Time.delta;

                    if (Math.floor(data.masterChargeTimer) % 30 === 0) {
                        let waves = Mathf.chance(0.5) ? 1 : 2;
                        masterShockwaveRingEffect.at(unit.x, unit.y, 900, waves);
                    }

                    let attackAngle = target ? unit.angleTo(target) : unit.rotation;
                    
                    let swordsPerFrame = 12;
                    for (let s = 0; s < swordsPerFrame; s++) {
                        if (data.masterSwordsSpawned < data.masterTotalSwords) {
                            data.masterSwordsSpawned++;

                            let targetDist = Mathf.random(50, 900);
                            let targetAngle = attackAngle + Mathf.range(50);

                            let targetX = unit.x + Angles.trnsx(targetAngle, targetDist);
                            let targetY = unit.y + Angles.trnsy(targetAngle, targetDist);

                            let skyX = targetX - Angles.trnsx(attackAngle, 350);
                            let skyY = targetY - Angles.trnsy(attackAngle, 350);

                            data.masterSwordPositions.push({ 
                                skyX: skyX, 
                                skyY: skyY, 
                                targetX: targetX, 
                                targetY: targetY, 
                                angle: attackAngle 
                            });

                            skySwordHoverEffect.at(skyX, skyY, attackAngle);
                        }
                    }

                    if (data.masterChargeTimer >= 200 || data.masterSwordsSpawned >= data.masterTotalSwords) {
                        data.masterAttackState = "barrage";
                        data.masterChargeTimer = 0;
                        data.masterBarrageTimer = 0;

                        for (let i = data.masterSwordPositions.length - 1; i > 0; i--) {
                            let j = Math.floor(Mathf.random(i + 1));
                            let temp = data.masterSwordPositions[i];
                            data.masterSwordPositions[i] = data.masterSwordPositions[j];
                            data.masterSwordPositions[j] = temp;
                        }
                    }
                    return;
                }

                if (data.masterAttackState === "barrage") {
                    data.masterBarrageTimer += Time.delta;

                    let strikeBatch = 20;
                    for (let k = 0; k < strikeBatch; k++) {
                        if (data.masterSwordPositions.length > 0) {
                            let pos = data.masterSwordPositions.pop();
                            if (pos) {
                                skySwordRainEffect.at(pos.targetX, pos.targetY, pos.angle, {
                                    skyX: pos.skyX,
                                    skyY: pos.skyY,
                                    targetX: pos.targetX,
                                    targetY: pos.targetY
                                });

                                let uTeam = unit.team;
                                let tx = pos.targetX;
                                let ty = pos.targetY;

                                Time.run(12, () => {
                                    Damage.damage(uTeam, tx, ty, 100, 450, true, true);
                                    Fx.blastExplosion.at(tx, ty);
                                    swordImpactShockwaveEffect.at(tx, ty);
                                });
                            }
                        }
                    }

                    if (data.masterSwordPositions.length === 0 || data.masterBarrageTimer >= 240) {
                        data.masterAttackState = "homing_burst";
                        data.masterHomingShootTimer = 0;
                    }
                    return;
                }

                if (data.masterAttackState === "homing_burst") {
                    data.masterHomingShootTimer += Time.delta;

                    if (data.masterHomingShootTimer >= 120) {
                        data.masterHomingShootTimer = 0;

                        let baseAngle = target ? unit.angleTo(target) : unit.rotation;

                        for (let i = 0; i < 5; i++) {
                            let spreadAngle = baseAngle + (i - 2) * 18 + Mathf.range(5);
                            masterHomingSwordBullet.create(unit, unit.team, unit.x, unit.y, spreadAngle);
                        }
                    }

                    data.masterChargeTimer += Time.delta;
                    if (data.masterChargeTimer >= 600) {
                        data.masterAttackState = "cooldown";
                        data.masterChargeTimer = 0;
                    }
                }

                if (data.masterAttackState === "cooldown") {
                    data.masterChargeTimer += Time.delta;
                    if (data.masterChargeTimer >= 180) {
                        data.masterAttackState = "idle";
                        data.masterChargeTimer = 0;
                    }
                }

                if (target != null && data.masterAttackState === "idle") {
                    data.masterAttackState = "charging";
                    data.masterChargeTimer = 0;
                    data.masterSwordsSpawned = 0;
                    data.masterTotalSwords = Math.floor(Mathf.random(1000, 1200));
                    data.masterSwordPositions = [];
                }
                return;
            }

            if (isSwordDrone) {
                let target = null;
                if (data.targetId !== -1) {
                    let existingUnit = Groups.unit.find(u => u.id == data.targetId);
                    let existingBuild = existingUnit == null ? Groups.build.find(b => b.id == data.targetId) : null;
                    let existingTarget = existingUnit || existingBuild;
                    if (existingTarget != null && !existingTarget.dead && existingTarget.team != unit.team) {
                        target = existingTarget;
                    }
                }
                if (target == null) {
                    target = Units.closestTarget(unit.team, launcher.x, launcher.y, maxRange);
                    if (target) data.targetId = target.id;
                }

                if (data.swordState === "charging") {
                    let prog = Math.min(1.0, data.chargeTimer / 72.0);
                    renderSwordEffect.at(unit.x, unit.y, unit.rotation, {
                        isCharging: true, isDashing: false, chargeProgress: prog, dashProgress: 0, alpha: prog
                    });

                } else if (data.swordState === "dashing") {
                    let dashProg = Math.min(1.0, data.dashTimer / data.maxDashTime);
                    renderSwordEffect.at(unit.x, unit.y, unit.rotation, {
                        isCharging: false, isDashing: true, chargeProgress: 1.0, dashProgress: dashProg, alpha: 1.0
                    });

                } else if (data.swordState === "resting") {
                    let alpha = Math.max(0.0, 1.0 - (data.restTimer / 60.0));
                    renderSwordEffect.at(unit.x, unit.y, unit.rotation, {
                        isCharging: false, isDashing: false, chargeProgress: 1.0, dashProgress: 1.0, alpha: alpha
                    });

                    if (Mathf.chance(0.35)) {
                        let sparkX = unit.x + Mathf.range(12);
                        let sparkY = unit.y + Mathf.range(12);
                        swordDissolveSparkEffect.at(sparkX, sparkY);
                    }

                } else if (data.swordState === "idle") {
                    renderSwordEffect.at(unit.x, unit.y, unit.rotation, {
                        isCharging: false, isDashing: false, chargeProgress: 1.0, dashProgress: 1.0, alpha: 1.0
                    });
                }

                if (data.swordState === "charging") {
                    data.chargeTimer += Time.delta;
                    if (target) unit.lookAt(target.x, target.y);

                    if (data.chargeTimer >= 72) {
                        data.swordState = "dashing";
                        data.chargeTimer = 0;
                        data.dashTimer = 0;
                        data.maxDashTime = 9.33;

                        let angle = target ? unit.angleTo(target) : unit.rotation;
                        data.dashDirX = Angles.trnsx(angle, 1);
                        data.dashDirY = Angles.trnsy(angle, 1);
                    }
                    return;

                } else if (data.swordState === "dashing") {
                    data.dashTimer += Time.delta;
                    
                    let totalDistance = 400.0;
                    let dashSpeed = totalDistance / data.maxDashTime;

                    let prevX = unit.x;
                    let prevY = unit.y;

                    unit.moveAt(Tmp.v1.set(data.dashDirX * dashSpeed, data.dashDirY * dashSpeed));
                    let dashAngle = Angles.angle(0, 0, data.dashDirX, data.dashDirY);
                    unit.rotation = dashAngle;

                    if (Mathf.chance(0.4)) {
                        swordDashTrailEffect.at(unit.x, unit.y, dashAngle);
                    }

                    let swordDmg = 150 * (isMK2BUnit ? 2.0 : 1.0);
                    let steps = 6;
                    for (let i = 0; i <= steps; i++) {
                        let sampleX = Mathf.lerp(prevX, unit.x, i / steps);
                        let sampleY = Mathf.lerp(prevY, unit.y, i / steps);
                        Damage.damage(unit.team, sampleX, sampleY, 36, swordDmg, true, true);
                    }

                    if (data.dashTimer >= data.maxDashTime) {
                        data.swordState = "resting";
                        data.restTimer = 0;
                        data.dashTimer = 0;
                    }
                    return;

                } else if (data.swordState === "resting") {
                    data.restTimer += Time.delta;
                    if (data.restTimer >= 60) {
                        data.swordState = "cooldown";
                        data.dashTimer = 0;
                    }
                    return;

                } else if (data.swordState === "cooldown") {
                    data.dashTimer += Time.delta;
                    if (data.dashTimer >= 30) {
                        data.swordState = "idle";
                        data.dashTimer = 0;
                    }
                }

                if (target != null) {
                    let dst = Mathf.dst(unit.x, unit.y, target.x, target.y);
                    unit.lookAt(target.x, target.y);

                    if (dst <= 320 && data.swordState === "idle") {
                        data.swordState = "charging";
                        data.chargeTimer = 0;
                    } else {
                        let angleToTarget = Angles.angle(unit.x, unit.y, target.x, target.y);
                        let destX = target.x - Angles.trnsx(angleToTarget, 140);
                        let destY = target.y - Angles.trnsy(angleToTarget, 140);
                        unit.moveAt(Tmp.v1.set(destX - unit.x, destY - unit.y).limit(moveSpeed));
                    }
                } else {
                    data.repathTimer += Time.delta;
                    if (data.repathTimer >= 120 || Mathf.dst2(unit.x, unit.y, data.targetX, data.targetY) < 400) {
                        data.repathTimer = 0;
                        let randomAngle = Mathf.random(360);
                        let randomDist = Mathf.random(20, maxRange - 40);
                        data.targetX = launcher.x + Angles.trnsx(randomAngle, randomDist);
                        data.targetY = launcher.y + Angles.trnsy(randomAngle, randomDist);
                    }
                    unit.moveAt(Tmp.v1.set(data.targetX - unit.x, data.targetY - unit.y).limit(moveSpeed));
                    unit.lookAt(data.targetX, data.targetY);
                }
                return;
            }

            let target = null;
            if (data.aiMode != null && data.targetId !== -1) {
                let existingUnit = Groups.unit.find(u => u.id == data.targetId);
                let existingBuild = existingUnit == null ? Groups.build.find(b => b.id == data.targetId) : null;
                let existingTarget = existingUnit || existingBuild;

                if (existingTarget != null && !existingTarget.dead && existingTarget.team != unit.team) {
                    target = existingTarget;
                }
            }

            if (target == null) {
                target = Units.closestTarget(unit.team, launcher.x, launcher.y, maxRange);
            }

            if (target != null) {
                if (data.targetId !== target.id) {
                    data.targetId = target.id;
                    let rand = Mathf.random(1.0);
                    if (rand < 0.40) data.aiMode = "strafe";
                    else if (rand < 0.80) data.aiMode = "orbit";
                    else data.aiMode = "pursue";
                }

                let destX = target.x;
                let destY = target.y;

                if (data.aiMode === "strafe") {
                    let angleToTarget = Angles.angle(unit.x, unit.y, target.x, target.y);
                    let sideAngle = angleToTarget + (90 * data.strafeDir);
                    destX = target.x - Angles.trnsx(angleToTarget, 100) + Angles.trnsx(sideAngle, 50);
                    destY = target.y - Angles.trnsy(angleToTarget, 100) + Angles.trnsy(sideAngle, 50);

                    if (Mathf.chance(0.02)) data.strafeDir *= -1;

                } else if (data.aiMode === "orbit") {
                    data.orbitAngle += (moveSpeed / 1.5);
                    let orbitRadius = 120;
                    destX = target.x + Angles.trnsx(data.orbitAngle, orbitRadius);
                    destY = target.y + Angles.trnsy(data.orbitAngle, orbitRadius);

                } else {
                    let safeDistance = 110;
                    let angleToTarget = Angles.angle(unit.x, unit.y, target.x, target.y);
                    destX = target.x - Angles.trnsx(angleToTarget, safeDistance);
                    destY = target.y - Angles.trnsy(angleToTarget, safeDistance);
                }

                if (Mathf.dst2(destX, destY, launcher.x, launcher.y) > maxRange * maxRange) {
                    let angleFromLauncher = Angles.angle(launcher.x, launcher.y, destX, destY);
                    destX = launcher.x + Angles.trnsx(angleFromLauncher, maxRange - 20);
                    destY = launcher.y + Angles.trnsy(angleFromLauncher, maxRange - 20);
                }

                unit.moveAt(Tmp.v1.set(destX - unit.x, destY - unit.y).limit(moveSpeed));

                let bulletToShoot = isMK2BUnit ? droneBulletMK2B : droneBulletNormal;
                let bulletSpeed = bulletToShoot.speed;
                let aimX = target.x;
                let aimY = target.y;

                if (target.deltaX !== undefined && target.deltaY !== undefined) {
                    let dst = Mathf.dst(unit.x, unit.y, target.x, target.y);
                    let timeToTarget = dst / bulletSpeed;
                    aimX += target.deltaX * timeToTarget * 0.8;
                    aimY += target.deltaY * timeToTarget * 0.8;
                }

                unit.lookAt(aimX, aimY);

                data.shootTimer += Time.delta;
                if (data.shootTimer >= 15) {
                    data.shootTimer = 0;
                    bulletToShoot.create(unit, unit.team, unit.x, unit.y, Angles.angle(unit.x, unit.y, aimX, aimY) + Mathf.range(3));
                }
            } else {
                data.aiMode = null;
                data.targetId = -1;

                data.repathTimer += Time.delta;
                if (data.repathTimer >= 120 || Mathf.dst2(unit.x, unit.y, data.targetX, data.targetY) < 400) {
                    data.repathTimer = 0;
                    let randomAngle = Mathf.random(360);
                    let randomDist = Mathf.random(20, maxRange - 40);
                    data.targetX = launcher.x + Angles.trnsx(randomAngle, randomDist);
                    data.targetY = launcher.y + Angles.trnsy(randomAngle, randomDist);
                }

                unit.moveAt(Tmp.v1.set(data.targetX - unit.x, data.targetY - unit.y).limit(moveSpeed));
                unit.lookAt(data.targetX, data.targetY);
            }
        }
    });
});