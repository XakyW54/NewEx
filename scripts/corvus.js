// Tên file: corvus.js
const laserColor = Color.valueOf("84f491"); 
const spacing13TilesPx = 13 * 8;
const maxCircleRadiusPx = (33 * 8) / 2;

const chargingUnits = new Set();
const activeLightningZones = [];
const corvusOriginals = {};

function drawReguLaserRing(cx, cy, radiusX, radiusY, laserAngle, strokeWidth, color, isFill){
    Draw.color(color); 
    if(!isFill) Lines.stroke(strokeWidth);
    let steps = 24; let lastX = 0, lastY = 0;
    let cosA = Math.cos(laserAngle * Mathf.degRad); 
    let sinA = Math.sin(laserAngle * Mathf.degRad);
    
    if(isFill) {
        for(let r = radiusY; r > 0; r -= 2.0) {
            let curRadX = (r / radiusY) * radiusX;
            for(let i = 0; i <= steps; i++){
                let angle = (i * (360 / steps)) * Mathf.degRad;
                let lx = Math.cos(angle) * curRadX; 
                let ly = Math.sin(angle) * r;
                let rx = cx + (lx * cosA - ly * sinA); 
                let ry = cy + (lx * sinA + ly * cosA);
                if(i > 0) Lines.line(lastX, lastY, rx, ry);
                lastX = rx; lastY = ry;
            }
        }
    } else {
        for(let i = 0; i <= steps; i++){
            let angle = (i * (360 / steps)) * Mathf.degRad;
            let lx = Math.cos(angle) * radiusX; 
            let ly = Math.sin(angle) * radiusY;
            let rx = cx + (lx * cosA - ly * sinA); 
            let ry = cy + (lx * sinA + ly * cosA);
            if(i > 0) Lines.line(lastX, lastY, rx, ry);
            lastX = rx; lastY = ry;
        }
    }
}

const corvusFrontSingleRingEffect = new Effect(20, e => {
    let fout = e.fout();
    let rad = e.rotation * Mathf.degRad;
    let cosA = Math.cos(rad);
    let sinA = Math.sin(rad);

    let currentOffset = fout * (spacing13TilesPx * 0.9); 
    let cx = e.x + cosA * currentOffset;
    let cy = e.y + sinA * currentOffset;

    let radX = fout * 16; 
    let radY = fout * 45;

    drawReguLaserRing(cx, cy, radX, radY, e.rotation, 3.0 * fout, laserColor, false);
});

const corvusBigOuterRingEffect = new Effect(60, e => {
    let fout = e.fout();
    let fin = e.fin();

    let outerRingRadius = fout * 70; 
    Draw.color(Color.white, laserColor, fin);
    Lines.stroke(3.5 * fout);
    Lines.circle(e.x, e.y, outerRingRadius);
    Draw.reset();
});

const corvusContinuousParticleEffect = new Effect(25, e => {
    let fout = e.fout();
    let fin = e.fin();

    Draw.color(laserColor, Color.white, fin);
    for(let i = 0; i < 5; i++){
        let pAngle = Mathf.randomSeed(e.id * 3 + i, 0, 360); 
        let startDist = Mathf.randomSeed(e.id * 5 + i, 30, 110);
        let currentDist = startDist * fout; 
        
        let px = e.x + Angles.trnsx(pAngle, currentDist);
        let py = e.y + Angles.trnsy(pAngle, currentDist);
        let particleSize = Mathf.randomSeed(e.id * 7 + i, 0.5, 4.0) * fout;
        
        Fill.circle(px, py, particleSize);
    }
    Draw.reset();
});

const corvusLaserZoomEffect = new Effect(40, e => {
    let fin = e.fin();
    let fout = e.fout();

    let expandProgress = Interp.pow2Out.apply(fin);
    let targetRadX = (5 + (maxCircleRadiusPx - 5) * expandProgress) * 0.4;
    let targetRadY = (5 + (maxCircleRadiusPx - 5) * expandProgress);

    drawReguLaserRing(e.x, e.y, targetRadX, targetRadY, e.rotation, 3.5 * fout, Color.white, false);
    drawReguLaserRing(e.x, e.y, targetRadX * 0.7, targetRadY * 0.7, e.rotation, 2.0 * fout, laserColor, false);
    Draw.reset();
});

const corvusMuzzleSmokeEffect = new Effect(60, e => {
    Draw.color(Color.gray, laserColor, e.fout());
    Angles.randLenVectors(e.id, 16, 50 * e.finpow(), e.rotation, 45, (x, y) => {
        Fill.circle(e.x + x, e.y + y, (3.5 + Mathf.randomSeed(e.id, 2, 5)) * e.fout());
    });
    Draw.reset();
});

function startTripleChargeProcess(gunX, gunY, rotation){
    corvusBigOuterRingEffect.at(gunX, gunY, rotation);
    corvusFrontSingleRingEffect.at(gunX, gunY, rotation);

    Time.run(20, () => {
        corvusFrontSingleRingEffect.at(gunX, gunY, rotation);
    });

    Time.run(40, () => {
        corvusFrontSingleRingEffect.at(gunX, gunY, rotation);
    });
}

function triggerCorvusShotFeatures(team, gunX, gunY, rotation){
    corvusMuzzleSmokeEffect.at(gunX, gunY, rotation);

    for(let c = 1; c <= 12; c++){
        let dist = c * spacing13TilesPx;
        let px = gunX + Angles.trnsx(rotation, dist);
        let py = gunY + Angles.trnsy(rotation, dist);

        Time.run(c * 1.5, () => {
            corvusLaserZoomEffect.at(px, py, rotation);
        });
    }

    for(let d = 32; d < 1200; d += 48){
        let ex = gunX + Angles.trnsx(rotation, d);
        let ey = gunY + Angles.trnsy(rotation, d);

        activeLightningZones.push({
            x: ex,
            y: ey,
            team: team,
            life: 600,
            maxLife: 600,
            id: Mathf.random(10000)
        });
    }
}

Events.on(ClientLoadEvent, () => {
    const corvus = UnitTypes.corvus;
    if(!corvus || !corvus.weapons) return;

    corvusOriginals.weapons = [];
    for(let i = 0; i < corvus.weapons.size; i++){
        let w = corvus.weapons.get(i);
        let b = w.bullet;
        corvusOriginals.weapons.push({
            cooldownTime: w.cooldownTime,
            chargeEffect: b ? b.chargeEffect : null,
            shootEffect: b ? b.shootEffect : null,
            damage: b ? b.damage : 0,
            length: b ? b.length : 0,
            width: b ? b.width : 0,
            pierceArmor: b ? b.pierceArmor : false,
            absorbable: b ? b.absorbable : true
        });
    }
});

Events.on(WorldLoadEvent, () => {
    const corvus = UnitTypes.corvus;
    if(!corvus || !corvus.weapons || !corvusOriginals.weapons) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    for(let i = 0; i < corvus.weapons.size; i++){
        let w = corvus.weapons.get(i);
        let orig = corvusOriginals.weapons[i];
        if(!orig) continue;

        if(isEnabled){
            w.cooldownTime = 220;
            if(w.bullet){
                let b = w.bullet;
                b.chargeEffect = Fx.none;
                b.shootEffect = Fx.none;
                b.damage = orig.damage * 6.0;
                if(b.length !== undefined) b.length = orig.length * 3.0;
                if(b.width !== undefined) b.width = orig.width * 2.0;
                b.pierceArmor = true;
                b.absorbable = false;
            }
        } else {
            w.cooldownTime = orig.cooldownTime;
            if(w.bullet){
                let b = w.bullet;
                b.chargeEffect = orig.chargeEffect;
                b.shootEffect = orig.shootEffect;
                b.damage = orig.damage;
                if(b.length !== undefined) b.length = orig.length;
                if(b.width !== undefined) b.width = orig.width;
                b.pierceArmor = orig.pierceArmor;
                b.absorbable = orig.absorbable;
            }
        }
    }
});

Events.run(Trigger.update, () => {
    if(Vars.state.isPaused() || Vars.state.isMenu()) return;
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    const corvus = UnitTypes.corvus;
    if(!corvus) return;

    Groups.unit.each(u => {
        if(u.type === corvus && !u.dead && u.mounts){
            for(let i = 0; i < u.mounts.length; i++){
                let mount = u.mounts[i];
                let weapon = mount.weapon;

                let gunX = u.x + Angles.trnsx(u.rotation - 90, weapon.x, weapon.y);
                let gunY = u.y + Angles.trnsy(u.rotation - 90, weapon.x, weapon.y);

                let key = u.id + "_" + i;

                if(mount.charging){
                    if(!chargingUnits.has(key)){
                        chargingUnits.add(key);
                        startTripleChargeProcess(gunX, gunY, u.rotation);
                    }

                    if(Time.time % 2 < 1){
                        corvusContinuousParticleEffect.at(gunX, gunY, u.rotation);
                    }
                } 
                else if(chargingUnits.has(key)){
                    triggerCorvusShotFeatures(u.team, gunX, gunY, u.rotation);
                    chargingUnits.delete(key);
                }
            }
        }
    });

    for(let i = activeLightningZones.length - 1; i >= 0; i--){
        let zone = activeLightningZones[i];
        zone.life -= Time.delta;

        if(zone.life <= 0){
            activeLightningZones.splice(i, 1);
            continue;
        }

        if(Mathf.chance(0.25)){
            let pAngle = Mathf.random(360);
            Lightning.create(zone.team, laserColor, 25, zone.x, zone.y, pAngle, 12);
            Damage.damage(zone.team, zone.x, zone.y, 32, 35, false, true);
        }
    }
});