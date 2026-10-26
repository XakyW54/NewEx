const PerfCore = global.PerfCore;
global.mk2bUnits = global.mk2bUnits || {};
global.droneLauncherMap = global.droneLauncherMap || {};
global.droneRecallMap = global.droneRecallMap || {};
global.masterDroneSpawnTimers = global.masterDroneSpawnTimers || {};

const coalColor = Color.valueOf("272727");
const coalGlowColor = Color.valueOf("888888");

const masterPurpleColor = Color.valueOf("2b003b");
const masterGlowColor = Color.valueOf("a832d7");

function isBloomEnabled() {
    try {
        return Core.settings.getBool("bloom", true);
    } catch (e) {
        return true;
    }
}

const masterLowParticleImpactEffect = new Effect(15, e => {
    Draw.z(Layer.effect + 0.1);
    Draw.color(masterGlowColor, Color.white, e.fout());
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, 10.0 * e.fin());
    Draw.reset();
});

const swordWindSlashFx = new Effect(18, 700, cons(e => {
    let d = e.data;
    if (!d) return;

    let ax = e.x, ay = e.y, bx = d.x2, by = d.y2;
    let dx = bx - ax, dy = by - ay;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1.0) return;

    let ux = dx / len, uy = dy / len;
    let nx = -uy, ny = ux;
    let fin = e.fin(), fout = e.fout();
    let baseW = d.w !== undefined ? d.w : 6.0;
    let w = baseW * Math.pow(fout, 1.3);
    if (w < 0.05) return;

    let tail = d.taper ? fin * 0.55 : 0.0;
    let sx = ax + dx * tail, sy = ay + dy * tail;
    let slen = len * (1.0 - tail);
    let seed = e.id * 37;
    let black = PerfCore.color("#000000");
    let white = PerfCore.color("#ffffff");
    let grey = PerfCore.color("#d0d0d0");

    Draw.z(Layer.effect + 0.06);

    if (d.taper) {
        let mx = sx + ux * slen * 0.38, my = sy + uy * slen * 0.38;
        Draw.color(grey);
        Draw.alpha(0.18 * fout);
        Fill.tri(sx, sy, mx + nx * w * 2.6, my + ny * w * 2.6, mx - nx * w * 2.6, my - ny * w * 2.6);
        Fill.tri(bx, by, mx + nx * w * 2.6, my + ny * w * 2.6, mx - nx * w * 2.6, my - ny * w * 2.6);

        Draw.color(black);
        Draw.alpha(0.95);
        Fill.tri(sx, sy, mx + nx * w, my + ny * w, mx - nx * w, my - ny * w);
        Fill.tri(bx, by, mx + nx * w, my + ny * w, mx - nx * w, my - ny * w);

        Draw.color(white);
        Draw.alpha(fout);
        Lines.stroke(1.3 * fout + 0.25);
        Lines.line(sx, sy, mx + nx * w, my + ny * w);
        Lines.line(mx + nx * w, my + ny * w, bx, by);
        Lines.line(sx, sy, mx - nx * w, my - ny * w);
        Lines.line(mx - nx * w, my - ny * w, bx, by);
    } else {
        Draw.color(grey);
        Draw.alpha(0.16 * fout);
        Fill.quad(sx + nx * w * 2.4, sy + ny * w * 2.4, bx + nx * w * 2.4, by + ny * w * 2.4,
                  bx - nx * w * 2.4, by - ny * w * 2.4, sx - nx * w * 2.4, sy - ny * w * 2.4);

        Draw.color(black);
        Draw.alpha(0.95);
        Fill.quad(sx + nx * w, sy + ny * w, bx + nx * w * 0.8, by + ny * w * 0.8,
                  bx - nx * w * 0.8, by - ny * w * 0.8, sx - nx * w, sy - ny * w);

        Draw.color(white);
        Draw.alpha(fout);
        Lines.stroke(1.2 * fout + 0.2);
        Lines.line(sx + nx * w, sy + ny * w, bx + nx * w * 0.8, by + ny * w * 0.8);
        Lines.line(sx - nx * w, sy - ny * w, bx - nx * w * 0.8, by - ny * w * 0.8);
    }

    let streaks = PerfCore.level() >= 1 ? 2 : 4;
    Draw.color(white);
    Lines.stroke(0.8 * fout + 0.15);
    for (let i = 0; i < streaks; i++) {
        let side = (i % 2 == 0) ? 1.0 : -1.0;
        let off = side * w * (1.8 + Mathf.randomSeed(seed + i * 5, 0.0, 2.2));
        let t0 = Mathf.randomSeed(seed + i * 5 + 1, 0.0, 0.4) + fin * 0.35;
        let t1 = Math.min(1.0, t0 + Mathf.randomSeed(seed + i * 5 + 2, 0.35, 0.6));
        Draw.alpha(0.85 * fout);
        Lines.line(sx + ux * slen * t0 + nx * off, sy + uy * slen * t0 + ny * off,
                   sx + ux * slen * t1 + nx * off, sy + uy * slen * t1 + ny * off);
    }

    if (d.head) {
        let ang = Angles.angle(ax, ay, bx, by) + 180.0;
        let vLen = Math.min(slen * 0.3, 70.0);
        Draw.color(white);
        Draw.alpha(fout);
        Lines.stroke(1.4 * fout + 0.2);
        Lines.line(bx, by, bx + Angles.trnsx(ang + 15.0, vLen), by + Angles.trnsy(ang + 15.0, vLen));
        Lines.line(bx, by, bx + Angles.trnsx(ang - 15.0, vLen), by + Angles.trnsy(ang - 15.0, vLen));
    }

    Draw.reset();
}));

const masterHomingSwordBullet = extend(BasicBulletType, {
    speed: 18.0,
    damage: 1500,
    lifetime: 3600,
    width: 14,
    height: 40,
    shrinkY: 0,

    pierce: true,
    pierceBuilding: true,
    pierceCap: 6,

    collidesAir: true,
    collidesGround: true,
    collidesTiles: true,

    homingPower: 0.15,
    homingRange: 1000,
    homingDelay: 2,

    frontColor: Color.white,
    backColor: masterGlowColor,

    update(b) {
        this.super$update(b);
        if (PerfCore.level() >= 2 || !b.timer.get(1, 2)) return;
        let ang = b.rotation();
        let seg = b.vel.len() * 2.0 + 6.0;
        swordWindSlashFx.at(b.x - Angles.trnsx(ang, seg), b.y - Angles.trnsy(ang, seg), 0, {
            x2: b.x, y2: b.y, w: 5.5, taper: false, head: false
        });
    },

    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);

        if (other && other.maxHealth) {
            let bonusDmg = other.maxHealth * 0.10;
            other.health -= bonusDmg;
            if (other.health <= 0) other.kill();
        }
    },

    draw(b) {
        let angle = b.rotation();

        Draw.z(Layer.bullet);
        drawSwordStar(b.x, b.y, angle, 1.3, 1.0, true, b.id, false);
        Draw.reset();

        let trailLen = 45.0;
        let backX = b.x - Angles.trnsx(angle, trailLen);
        let backY = b.y - Angles.trnsy(angle, trailLen);

        Draw.z(Layer.bullet + 0.01);
        Draw.color(Color.black);
        Lines.stroke(8.0);
        Lines.line(b.x, b.y, backX, backY);

        Draw.color(Color.lightGray);
        Lines.stroke(4.0);
        Lines.line(b.x, b.y, backX, backY);

        Draw.color(Color.white);
        Lines.stroke(1.8);
        Lines.line(b.x, b.y, backX, backY);
        Draw.reset();
    }
});

const masterBurstAuraSwordBullet = extend(BasicBulletType, {
    speed: 10.0,
    damage: 900,
    lifetime: 12,
    width: 10,
    height: 30,
    shrinkY: 0,

    pierce: false,
    pierceBuilding: false,

    collidesAir: true,
    collidesGround: true,
    collidesTiles: true,

    homingPower: 0,
    homingRange: 0,

    frontColor: Color.white,
    backColor: masterGlowColor,

    update(b) {
        this.super$update(b);
        if (PerfCore.level() >= 1 || !b.timer.get(1, 2)) return;
        let ang = b.rotation();
        let seg = b.vel.len() * 2.0 + 4.0;
        swordWindSlashFx.at(b.x - Angles.trnsx(ang, seg), b.y - Angles.trnsy(ang, seg), 0, {
            x2: b.x, y2: b.y, w: 3.2, taper: false, head: false
        });
    },

    draw(b) {
        let angle = b.rotation();

        Draw.z(Layer.bullet);
        drawSwordStar(b.x, b.y, angle, 0.95, 1.0, true, b.id, false);
        Draw.reset();

        let trailLen = 20.0;
        let backX = b.x - Angles.trnsx(angle, trailLen);
        let backY = b.y - Angles.trnsy(angle, trailLen);

        Draw.z(Layer.bullet + 0.01);
        Draw.color(Color.black);
        Lines.stroke(4.0);
        Lines.line(b.x, b.y, backX, backY);

        Draw.color(Color.lightGray);
        Lines.stroke(2.0);
        Lines.line(b.x, b.y, backX, backY);

        Draw.color(Color.white);
        Lines.stroke(1.0);
        Lines.line(b.x, b.y, backX, backY);
        Draw.reset();
    }
});

const masterKeySwordFlyEffect = new Effect(25, e => {
    Draw.z(Layer.flyingUnit + 2.9);

    let data = e.data;
    if (!data) return;

    let startX = data.startX;
    let startY = data.startY;
    let targetX = data.targetX;
    let targetY = data.targetY;
    let angle = Angles.angle(startX, startY, targetX, targetY);

    let curX = Mathf.lerp(startX, targetX, e.fin());
    let curY = Mathf.lerp(startY, targetY, e.fin());

    let trailLen = 60.0 * e.fout();
    let backX = curX - Angles.trnsx(angle, trailLen);
    let backY = curY - Angles.trnsy(angle, trailLen);

    Draw.color(Color.black, e.fout());
    Lines.stroke(6.0 * e.fout());
    Lines.line(curX, curY, backX, backY);

    Draw.color(Color.white, e.fout());
    Lines.stroke(2.5 * e.fout());
    Lines.line(curX, curY, backX, backY);

    drawSwordStar(curX, curY, angle, 1.3, 1.0, true, e.id, false);

    if (e.fin() >= 0.85) {
        if (isBloomEnabled()) Drawf.light(targetX, targetY, 150, masterGlowColor, 1.0);
        Lines.stroke(3.0 * e.fout());
        Lines.circle(targetX, targetY, 40 * (1.0 - e.fout()));
    }
    Draw.reset();
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

    if (isBloomEnabled()) Drawf.light(e.x, e.y, 160.0 * e.fout(), masterGlowColor, 0.9 * e.fout());

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

    let neAngle = 45;
    let baseOffsetAngle = neAngle + 90;
    let randomSeeds = e.data || [0, 0, 0];

    for (let i = -1; i <= 1; i++) {
        let baseSpacing = i * 22;
        let randShift = randomSeeds[i + 1] || 0;
        let totalShift = baseSpacing + randShift;

        let posX = e.x + Angles.trnsx(baseOffsetAngle, totalShift);
        let posY = e.y + Angles.trnsy(baseOffsetAngle, totalShift);

        if (isBloomEnabled()) Drawf.light(posX, posY, 60 * e.fout(), masterGlowColor, 0.8 * e.fout());

        drawSwordStar(posX, posY, neAngle, 1.3, 0.9 * e.fout(), true, e.id + i * 5, false);
    }
    Draw.reset();
});

const skySwordHoverEffect = new Effect(450, e => {
    Draw.z(Layer.flyingUnit + 2.8);

    let alpha = Math.min(1.0, e.fin() * 6.0) * e.fout();
    let angle = e.rotation;

    let skyX = e.x;
    let skyY = e.y;

    drawSwordStar(skyX, skyY, angle, 1.3, alpha, true, e.id, false);
    Draw.reset();
});

const skySwordRainEffect = new Effect(14, e => {
    Draw.z(Layer.flyingUnit + 3.0);

    let data = e.data;
    if (!data) return;

    let startX = data.skyX;
    let startY = data.skyY;
    let targetX = data.targetX;
    let targetY = data.targetY;
    let angle = e.rotation;
    let hasLaser = data.hasLaser;

    let currentX = Mathf.lerp(startX, targetX, e.fin());
    let currentY = Mathf.lerp(startY, targetY, e.fin());

    if (hasLaser) {
        Draw.z(Layer.effect + 0.4);
        let skyTopX = targetX - Angles.trnsx(angle, 600);
        let skyTopY = targetY - Angles.trnsy(angle, 600);

        Draw.color(Color.black, Color.white, e.fout());
        Lines.stroke(6.0 * e.fout());
        Lines.line(skyTopX, skyTopY, targetX, targetY);

        Draw.color(Color.white, e.fout());
        Lines.stroke(2.0 * e.fout());
        Lines.line(skyTopX, skyTopY, targetX, targetY);
        Draw.z(Layer.flyingUnit + 3.0);
    }

    let trailLen = 120.0;
    let backX = currentX - Angles.trnsx(angle, trailLen);
    let backY = currentY - Angles.trnsy(angle, trailLen);

    Draw.color(Color.black, e.fout());
    Lines.stroke(6.0 * e.fout());
    Lines.line(currentX, currentY, backX, backY);

    Draw.color(Color.white, e.fout());
    Lines.stroke(2.2 * e.fout());
    Lines.line(currentX, currentY, backX, backY);

    drawSwordStar(currentX, currentY, angle, 1.35, 1.0, true, e.id, false);

    if (e.fin() >= 0.9) {
        if (isBloomEnabled()) Drawf.light(targetX, targetY, 120, masterGlowColor, 0.9);
    }
    Draw.reset();
});

const renderAttachedMasterSwordsEffect = new Effect(2, e => {
    Draw.z(Layer.flyingUnit + 2.0);

    let unitAngle = e.rotation;
    let sideAngle = unitAngle - 90;

    let eData = e.data || {};
    let hideIndex = (eData.hideIndex !== undefined) ? eData.hideIndex : -1;

    let offsets = [
        { forward: 6,  side: 14 },
        { forward: -6, side: 18 },
        { forward: -18, side: 22 }
    ];

    for (let i = 0; i < offsets.length; i++) {
        if (i === hideIndex) continue;

        let off = offsets[i];
        let sx = e.x + Angles.trnsx(unitAngle, off.forward) + Angles.trnsx(sideAngle, off.side);
        let sy = e.y + Angles.trnsy(unitAngle, off.forward) + Angles.trnsy(sideAngle, off.side);

        if (isBloomEnabled()) Drawf.light(sx, sy, 35, masterGlowColor, 0.8);

        let renderAngle = unitAngle + 90;

        drawSwordStar(sx, sy, renderAngle + 90, 1.05, 1.0, true, i * 7 + 3, false);
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

    if (isBloomEnabled()) {
        Drawf.light(e.x, e.y, 120.0 * e.fout(), Color.white, e.fout());
        Drawf.light(backX, backY, 90.0 * e.fout(), coalGlowColor, 0.8 * e.fout());
    }

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

const starVx = new Array(8);
const starVy = new Array(8);
const STAR_RADII_UNIT = [30.0, 3.2, 10.0, 3.2, 10.0, 3.2, 10.0, 3.2];

function starRingAlpha(seed) {
    let s1 = Math.sin(Time.time * 0.045 + seed * 1.37);
    if (s1 <= 0) return 0.0;
    return Math.pow(s1, 0.8) * (0.6 + 0.4 * Math.sin(Time.time * 0.021 + seed * 3.1));
}

function drawSwordStar(cx, cy, angle, scale, alpha, master, seed, noRing) {
    for (let k = 0; k < 8; k++) {
        let a = angle + 45.0 * k;
        starVx[k] = cx + Angles.trnsx(a, STAR_RADII_UNIT[k] * scale);
        starVy[k] = cy + Angles.trnsy(a, STAR_RADII_UNIT[k] * scale);
    }

    let body = master ? masterPurpleColor : PerfCore.color("#0b0b0e");
    let edge = master ? masterGlowColor : Color.white;

    Draw.color(body);
    Draw.alpha(alpha);
    for (let k = 0; k < 8; k++) {
        let n = (k + 1) % 8;
        Fill.tri(cx, cy, starVx[k], starVy[k], starVx[n], starVy[n]);
    }

    Draw.color(edge);
    Draw.alpha(alpha);
    Lines.stroke(Math.max(0.6, 0.9 * scale));
    for (let k = 0; k < 8; k++) {
        let n = (k + 1) % 8;
        Lines.line(starVx[k], starVy[k], starVx[n], starVy[n]);
    }

    Draw.color(Color.white);
    Draw.alpha(0.85 * alpha);
    Lines.stroke(Math.max(0.5, 0.7 * scale));
    Lines.line(cx, cy, cx + (starVx[0] - cx) * 0.9, cy + (starVy[0] - cy) * 0.9);
    Fill.circle(cx, cy, 1.5 * scale);

    if (!noRing) {
        let ra = starRingAlpha(seed) * alpha;
        if (ra > 0.02) {
            let ringAng = angle + 55.0;
            let ca = Angles.trnsx(ringAng, 1.0), sa = Angles.trnsy(ringAng, 1.0);
            let ra1 = 9.0 * scale, rb1 = 3.3 * scale;
            let px = 0, py = 0;
            Draw.color(master ? masterGlowColor : Color.white);
            Draw.alpha(ra);
            Lines.stroke(Math.max(0.5, 0.8 * scale));
            for (let j = 0; j <= 20; j++) {
                let th = (j / 20.0) * Math.PI * 2.0;
                let lx = Math.cos(th) * ra1, ly = Math.sin(th) * rb1;
                let wx = cx + ca * lx - sa * ly;
                let wy = cy + sa * lx + ca * ly;
                if (j > 0) Lines.line(px, py, wx, wy);
                px = wx;
                py = wy;
            }
        }
    }
}

const swordHitSlashFx = new Effect(30, 400, cons(e => {
    let d = e.data;
    let size = (d && d.size !== undefined) ? d.size : 10.0;
    let len = 70.0 + size * 2.0;
    let fout = e.fout();
    Draw.z(Layer.effect + 0.07);
    Draw.color(Color.white);
    Draw.alpha(0.6 * fout * fout);
    Fill.circle(e.x, e.y, (6.0 + size * 0.6) * fout);
    Draw.reset();
}));

function spawnSwordHitSlash(x, y, dashAngle, size) {
    let len = 80.0 + size * 2.0;
    let side = Mathf.chance(0.5) ? 1.0 : -1.0;
    let a1 = dashAngle + 55.0 * side;
    let a2 = dashAngle - 40.0 * side;

    swordHitSlashFx.at(x, y, 0, { size: size });
    swordWindSlashFx.at(x - Angles.trnsx(a1, len / 2), y - Angles.trnsy(a1, len / 2), 0, {
        x2: x + Angles.trnsx(a1, len / 2), y2: y + Angles.trnsy(a1, len / 2), w: 7.5, taper: true, head: true
    });

    Time.run(3, () => {
        let l2 = len * 0.75;
        swordWindSlashFx.at(x - Angles.trnsx(a2, l2 / 2), y - Angles.trnsy(a2, l2 / 2), 0, {
            x2: x + Angles.trnsx(a2, l2 / 2), y2: y + Angles.trnsy(a2, l2 / 2), w: 5.0, taper: true, head: false
        });
    });
}

function clamp01(v) {
    return v < 0 ? 0 : (v > 1 ? 1 : v);
}

const SWORD_FAN_RADIUS = 120.0;
const SWORD_FAN_CRACK_WIDTH = 46.0;
const SWORD_FAN_SWEEP_TICKS = 30.0;
const SWORD_FAN_BURST_AT = 60.0;
const SWORD_FAN_CRACK_LIFE = 75.0;
const FAN_CRACK_MAX_POINTS = 30;

const fcOx = new Array(FAN_CRACK_MAX_POINTS + 1);
const fcOy = new Array(FAN_CRACK_MAX_POINTS + 1);
const fcIx = new Array(FAN_CRACK_MAX_POINTS + 1);
const fcIy = new Array(FAN_CRACK_MAX_POINTS + 1);
const fcRx = new Array(FAN_CRACK_MAX_POINTS + 1);
const fcRy = new Array(FAN_CRACK_MAX_POINTS + 1);
const fcW = new Array(FAN_CRACK_MAX_POINTS + 1);
const fcPt = [0.0, 0.0, 0.0];

function fanCrackPoint(u, v, n) {
    let idx = u * n;
    let i = Math.min(n - 1, Math.max(0, Math.floor(idx)));
    let f = idx - i;
    let ox = fcOx[i] + (fcOx[i + 1] - fcOx[i]) * f;
    let oy = fcOy[i] + (fcOy[i + 1] - fcOy[i]) * f;
    let ix = fcIx[i] + (fcIx[i + 1] - fcIx[i]) * f;
    let iy = fcIy[i] + (fcIy[i + 1] - fcIy[i]) * f;
    fcPt[0] = ix + (ox - ix) * v;
    fcPt[1] = iy + (oy - iy) * v;
    fcPt[2] = fcW[i] + (fcW[i + 1] - fcW[i]) * f;
    return fcPt;
}

const swordStarBullet = extend(BasicBulletType, {
    speed: 5.5,
    damage: 140,
    lifetime: 70,
    drag: 0.045,
    width: 8,
    height: 8,
    hitSize: 7,
    collidesAir: true,
    collidesGround: true,
    collidesTiles: false,
    pierce: true,
    pierceCap: 2,
    hitEffect: Fx.none,
    despawnEffect: Fx.none,
    shootEffect: Fx.none,
    smokeEffect: Fx.none,
    frontColor: Color.white,
    backColor: Color.black,

    draw(b) {
        let f = b.fout();
        let ang = b.rotation();
        let scl = 0.28 + 0.62 * f;
        let a = Math.pow(f, 0.5);
        let backLen = 22.0 * f;

        Draw.z(Layer.bullet + 0.05);
        Draw.color(Color.white);
        Draw.alpha(0.55 * a);
        Lines.stroke(2.2 * f + 0.3);
        Lines.line(b.x, b.y, b.x - Angles.trnsx(ang, backLen), b.y - Angles.trnsy(ang, backLen));

        drawSwordStar(b.x, b.y, ang, scl, a, false, b.id, true);
        Draw.reset();
    }
});

const swordFanCrackFx = new Effect(SWORD_FAN_CRACK_LIFE, 700, cons(e => {
    let d = e.data;
    if (!d) return;

    let t = e.time;
    let lod = PerfCore.level();
    let n = lod >= 2 ? 18 : FAN_CRACK_MAX_POINTS;
    let seed = e.id * 211;
    let k = t > d.burstAt ? clamp01((t - d.burstAt) / (SWORD_FAN_CRACK_LIFE - d.burstAt)) : 0.0;
    let closeF = Math.pow(1.0 - k, 1.8);
    if (closeF <= 0.01) return;
    let pre = clamp01((t - (d.burstAt - 18.0)) / 18.0);

    for (let i = 0; i <= n; i++) {
        let u = i / n;
        let ang = d.a0 + d.sweep * u;
        let cs = Angles.trnsx(ang, 1.0), sn = Angles.trnsy(ang, 1.0);
        let sh = Math.pow(Math.sin(Math.PI * u), 0.8);
        let open = clamp01((t - u * d.sweepTicks) / 6.0);
        open = open * open * (3.0 - 2.0 * open);
        let w = d.W * sh * open * closeF * (1.0 + 0.12 * pre * Math.sin(t * 1.7 + i));
        let jag = clamp01(w / 3.0);
        let ro = d.R + Mathf.randomSeed(seed + i * 31, -1, 1) * 2.0 * jag;
        let ri = ro - w + Mathf.randomSeed(seed + i * 53 + 7, -1, 1) * 3.5 * jag;
        if (w < 0.05) ri = ro;

        fcRx[i] = cs;
        fcRy[i] = sn;
        fcOx[i] = d.cx + cs * ro;
        fcOy[i] = d.cy + sn * ro;
        fcIx[i] = d.cx + cs * ri;
        fcIy[i] = d.cy + sn * ri;
        fcW[i] = ro - ri;
    }

    let black = PerfCore.color("#02010a");
    Draw.z(Layer.effect + 0.02);

    Draw.color(PerfCore.color("#000008"));
    Draw.alpha(0.5 * closeF);
    for (let i = 0; i < n; i++) {
        if (fcW[i] <= 0.1 && fcW[i + 1] <= 0.1) continue;
        Fill.quad(
            fcOx[i] + fcRx[i] * 2.2, fcOy[i] + fcRy[i] * 2.2,
            fcOx[i + 1] + fcRx[i + 1] * 2.2, fcOy[i + 1] + fcRy[i + 1] * 2.2,
            fcIx[i + 1] - fcRx[i + 1] * 3.2, fcIy[i + 1] - fcRy[i + 1] * 3.2,
            fcIx[i] - fcRx[i] * 3.2, fcIy[i] - fcRy[i] * 3.2
        );
    }

    Draw.color(black);
    Draw.alpha(0.97);
    for (let i = 0; i < n; i++) {
        if (fcW[i] <= 0.1 && fcW[i + 1] <= 0.1) continue;
        Fill.quad(fcOx[i], fcOy[i], fcOx[i + 1], fcOy[i + 1], fcIx[i + 1], fcIy[i + 1], fcIx[i], fcIy[i]);
    }

    Draw.blend(Blending.additive);

    for (let i = 3; i < n - 2; i += 5) {
        if (fcW[i] < 6.0) continue;
        let mx = (fcOx[i] + fcIx[i]) / 2, my = (fcOy[i] + fcIy[i]) / 2;
        Draw.color(i % 10 == 3 ? PerfCore.color("#5b21b6") : PerfCore.color("#1d4ed8"));
        Draw.alpha(0.3 * closeF);
        Fill.circle(mx, my, fcW[i] * 0.55);
    }

    let starCount = lod >= 2 ? 8 : (lod == 1 ? 16 : 30);
    for (let s = 0; s < starCount; s++) {
        let u = Mathf.randomSeed(seed + s * 13 + 1, 0.04, 0.96);
        let v = Mathf.randomSeed(seed + s * 13 + 2, 0.08, 0.92);
        let pt = fanCrackPoint(u, v, n);
        if (pt[2] < 2.5) continue;
        let phase = Mathf.randomSeed(seed + s * 13 + 3, 0, 6.28);
        let tw = 0.55 + 0.45 * Math.sin(t * (0.25 + (s % 5) * 0.07) + phase);
        let kind = s % 4;
        Draw.color(kind == 0 ? PerfCore.color("#ffffff") : (kind == 1 ? PerfCore.color("#aee5ff") : (kind == 2 ? PerfCore.color("#ffd1f5") : PerfCore.color("#fff4b0"))));
        Draw.alpha(tw * closeF);
        Fill.circle(pt[0], pt[1], (0.55 + (s % 3) * 0.35) * (0.6 + 0.4 * tw));
        if (s % 6 == 0 && lod == 0) {
            Lines.stroke(0.7);
            Lines.line(pt[0] - 3.0 * tw, pt[1], pt[0] + 3.0 * tw, pt[1]);
            Lines.line(pt[0], pt[1] - 3.0 * tw, pt[0], pt[1] + 3.0 * tw);
        }
    }

    if (lod < 2) {
        for (let m = 0; m < 4; m++) {
            let ph = (t * 0.032 + Mathf.randomSeed(seed + m * 17 + 600, 0, 1)) % 1.0;
            let u0 = Mathf.randomSeed(seed + m * 17 + 601, 0.15, 0.7);
            let hu = u0 + 0.12 * ph, hv = 0.93 - 0.84 * ph;
            let tp = Math.max(0.0, ph - 0.18);
            let tu = u0 + 0.12 * tp, tv = 0.93 - 0.84 * tp;
            let hx, hy, hw, tx, ty;
            let p1 = fanCrackPoint(Math.min(0.98, hu), hv, n);
            hx = p1[0]; hy = p1[1]; hw = p1[2];
            let p2 = fanCrackPoint(Math.min(0.98, tu), tv, n);
            tx = p2[0]; ty = p2[1];
            if (hw < 4.0) continue;
            Draw.color(PerfCore.color("#ffffff"));
            Draw.alpha(0.9 * closeF * (1.0 - ph * 0.5));
            Lines.stroke(1.1);
            Lines.line(hx, hy, tx, ty);
            Fill.circle(hx, hy, 0.9);
        }
    }

    if (t >= d.burstAt && t < d.burstAt + 8.0) {
        let fl = 1.0 - (t - d.burstAt) / 8.0;
        Draw.color(Color.white);
        Draw.alpha(0.35 * fl);
        for (let i = 0; i < n; i++) {
            if (fcW[i] <= 0.1 && fcW[i + 1] <= 0.1) continue;
            Fill.quad(fcOx[i], fcOy[i], fcOx[i + 1], fcOy[i + 1], fcIx[i + 1], fcIy[i + 1], fcIx[i], fcIy[i]);
        }
    }

    for (let pass = 0; pass < 2; pass++) {
        if (pass == 0) {
            Draw.color(PerfCore.color("#a855f7"));
            Draw.alpha((0.28 + 0.3 * pre) * closeF);
            Lines.stroke(4.0 * closeF + 0.6 + 2.0 * pre);
        } else {
            Draw.color(PerfCore.color("#ffffff"), PerfCore.color("#8fd8ff"), clamp01(t / d.burstAt));
            Draw.alpha(Math.min(1.0, 0.95 * closeF * 1.6));
            Lines.stroke(1.3 * closeF + 0.35);
        }
        for (let i = 0; i < n; i++) {
            if (fcW[i] <= 0.15 && fcW[i + 1] <= 0.15) continue;
            Lines.line(fcOx[i], fcOy[i], fcOx[i + 1], fcOy[i + 1]);
            Lines.line(fcIx[i], fcIy[i], fcIx[i + 1], fcIy[i + 1]);
        }
    }

    if (lod == 0) {
        for (let b = 0; b < 6; b++) {
            let bi = 3 + Math.floor(Mathf.randomSeed(seed + b * 41 + 9, 0, n - 6.01));
            if (fcW[bi] < 8.0) continue;
            let outer = Mathf.randomSeed(seed + b * 41 + 10, -1, 1) >= 0;
            let bx = outer ? fcOx[bi] : fcIx[bi];
            let by = outer ? fcOy[bi] : fcIy[bi];
            let dir = Mathf.angle(fcRx[bi], fcRy[bi]) + (outer ? 0.0 : 180.0) + Mathf.randomSeed(seed + b * 41 + 11, -35, 35);
            let grow = clamp01((t - (bi / n) * d.sweepTicks - 4.0) / 10.0);
            if (grow <= 0) continue;
            for (let sg = 0; sg < 3; sg++) {
                if (grow < sg / 3.0) break;
                let segLen = Mathf.randomSeed(seed + b * 41 + sg * 3 + 12, 7, 14) * clamp01(grow * 3.0 - sg + 0.2);
                let ex = bx + Angles.trnsx(dir, segLen), ey = by + Angles.trnsy(dir, segLen);
                Draw.color(PerfCore.color("#d8b4fe"), PerfCore.color("#ffffff"), 1.0 - sg / 3.0);
                Draw.alpha(0.85 * closeF);
                Lines.stroke(1.4 - sg * 0.4);
                Lines.line(bx, by, ex, ey);
                bx = ex;
                by = ey;
                dir += Mathf.randomSeed(seed + b * 41 + sg * 3 + 13, -30, 30);
            }
        }
    }

    Draw.blend();
    Draw.reset();
}));

function startSwordFan(unit, data, dashAngle, isMK2B) {
    let cx = unit.x, cy = unit.y;
    let a0 = dashAngle + 80.0;
    let sweep = -160.0;

    data.fanX = cx;
    data.fanY = cy;
    data.fanA0 = a0;
    data.fanSweep = sweep;
    data.fanTimer = 0.0;
    data.fanHit = {};

    swordFanCrackFx.at(cx, cy, 0, {
        cx: cx, cy: cy, a0: a0, sweep: sweep,
        R: SWORD_FAN_RADIUS, W: SWORD_FAN_CRACK_WIDTH,
        sweepTicks: SWORD_FAN_SWEEP_TICKS, burstAt: SWORD_FAN_BURST_AT
    });

    let team = unit.team;
    Time.run(SWORD_FAN_BURST_AT, () => {
        for (let i = 0; i < 12; i++) {
            let u = Mathf.random(0.06, 0.94);
            let sh = Math.pow(Math.sin(Math.PI * u), 0.8);
            let r = SWORD_FAN_RADIUS - SWORD_FAN_CRACK_WIDTH * sh * Mathf.random(0.1, 0.9);
            let ang = a0 + sweep * u;
            let bx = cx + Angles.trnsx(ang, r);
            let by = cy + Angles.trnsy(ang, r);
            // SỬA TỪ null THÀNH unit ĐỂ KHẮC PHỤC LỖI AMBIGUOUS METHOD
            let shot = swordStarBullet.create(unit, team, bx, by, Mathf.random(360.0));
            if (shot != null && isMK2B) shot.damage *= 2.0;
        }
    });
}

function swordFanDamage(unit, data, prog) {
    if (Vars.net.client()) return;
    let aNow = data.fanA0 + data.fanSweep * prog;
    let cx = data.fanX, cy = data.fanY;
    let reach = SWORD_FAN_RADIUS;

    Units.nearbyEnemies(unit.team, cx, cy, reach + 30.0, enemy => {
        if (!enemy || !enemy.isValid() || enemy.dead || data.fanHit["u" + enemy.id]) return;
        if (!enemy.within(cx, cy, reach + enemy.hitSize / 2)) return;
        let ang = Angles.angle(cx, cy, enemy.x, enemy.y);
        let rel = ((ang - data.fanA0) % 360.0 + 540.0) % 360.0 - 180.0;
        let frac = rel / data.fanSweep;
        if (frac < -0.04 || frac > prog + 0.04) return;
        data.fanHit["u" + enemy.id] = true;
        enemy.damagePierce(enemy.maxHealth * 0.10);
    });

    for (let r = 0.3; r <= 1.0; r += 0.35) {
        let bx = cx + Angles.trnsx(aNow, reach * r);
        let by = cy + Angles.trnsy(aNow, reach * r);
        let bld = Vars.world.buildWorld(bx, by);
        if (bld != null && bld.team != unit.team && !data.fanHit["b" + bld.pos()]) {
            data.fanHit["b" + bld.pos()] = true;
            bld.damage(bld.maxHealth * 0.10);
        }
    }
}

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
    let seed = data.seed !== undefined ? data.seed : 0;
    let swordScale = 1.0;

    Draw.z(Layer.flyingUnit + 2.0);

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

    } else if (data.isFan) {
        swordScale = 2.4;
        swordAngle = data.fanAngle;
        swordX = rx + Angles.trnsx(swordAngle, 48.0);
        swordY = ry + Angles.trnsy(swordAngle, 48.0);
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

            drawSwordStar(rx, ry, gAngle, 1.0, ghostAlpha * 0.7, false, seed, true);
        }
    } else {
        let sideAngle = rot + 90;
        swordX = rx + Angles.trnsx(sideAngle, 12);
        swordY = ry + Angles.trnsy(sideAngle, 12);
        swordAngle = rot - 140;
    }

    if (alpha <= 0.001) return;

    if (isBloomEnabled()) Drawf.light(swordX, swordY, 50 * alpha, Color.white, 0.9 * alpha);

    drawSwordStar(swordX, swordY, swordAngle, swordScale, alpha, false, seed, false);

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

let cargoTypeCache = null;
Events.run(Trigger.update, () => {
    if (Vars.state.isPaused()) return;

    let _ct = cargoTypeCache;
    if (_ct == null) {
        _ct = {
            normal: Vars.content.getByName(ContentType.unit, "newex-combat-drone") ||
                    Vars.content.getByName(ContentType.unit, "combat-drone") ||
                    Vars.content.getByName(ContentType.unit, "newex-cargo-drone") ||
                    Vars.content.getByName(ContentType.unit, "cargo-drone"),
            mk2: Vars.content.getByName(ContentType.unit, "newex-cargo-drone-mk2") ||
                    Vars.content.getByName(ContentType.unit, "cargo-drone-mk2") ||
                    Vars.content.getByName(ContentType.unit, "newex-cargo-dronemk2") ||
                    Vars.content.getByName(ContentType.unit, "cargo-dronemk2"),
            sword: Vars.content.getByName(ContentType.unit, "newex-cargo-sword-drone") ||
                    Vars.content.getByName(ContentType.unit, "cargo-sword-drone") ||
                    Vars.content.getByName(ContentType.unit, "cargo-sworddrone"),
            master: Vars.content.getByName(ContentType.unit, "cargo-master-sword-drone") ||
                    Vars.content.getByName(ContentType.unit, "newex-cargo-master-sword-drone")
        };
        if (_ct.normal != null || _ct.mk2 != null || _ct.sword != null || _ct.master != null) cargoTypeCache = _ct;
    }
    let cargoDroneType = _ct.normal;
    let cargoDroneMK2Type = _ct.mk2;
    let swordDroneType = _ct.sword;
    let masterSwordDroneType = _ct.master;

    if (cargoDroneType == null && cargoDroneMK2Type == null && swordDroneType == null && masterSwordDroneType == null) return;

    Groups.unit.each(unit => {
        let isMasterSwordDrone = (masterSwordDroneType != null && unit.type == masterSwordDroneType);
        let isSwordDrone = (swordDroneType != null && unit.type == swordDroneType);
        let isNormalDrone = (unit.type == cargoDroneType || unit.type == cargoDroneMK2Type);

        if ((isNormalDrone || isSwordDrone || isMasterSwordDrone) && !unit.dead) {
            let id = unit.id;

            if (global.mk2bUnits[id] && !droneData[id] && masterSwordDroneType != null) {
                let currentLauncherId = global.droneLauncherMap[id];

                let hasMasterAlready = false;
                let rollMaster = !Vars.net.client() && Mathf.chance(0.10) && unit.type != masterSwordDroneType;
                if (rollMaster && currentLauncherId) {
                    Groups.unit.each(u => {
                        if (u.type == masterSwordDroneType && !u.dead && global.droneLauncherMap[u.id] === currentLauncherId) {
                            hasMasterAlready = true;
                        }
                    });
                }

                if (!hasMasterAlready && rollMaster) {
                    let newUnit = masterSwordDroneType.create(unit.team);
                    newUnit.set(unit.x, unit.y);
                    newUnit.add();

                    global.mk2bUnits[newUnit.id] = true;
                    global.droneLauncherMap[newUnit.id] = currentLauncherId;

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
                    masterHomingShootTimer: 0,
                    activeKeySwordIndex: -1
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
                    renderAttachedMasterSwordsEffect.at(unit.x, unit.y, unit.rotation, {
                        hideIndex: data.activeKeySwordIndex
                    });
                }

                if (data.masterAttackState === "charging" || data.masterAttackState === "barrage") {
                    unit.vel.set(0, 0);
                } else {
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

                    let tankyEnemies = [];
                    if (data.masterSwordsSpawned < 3) {
                        Units.nearbyEnemies(unit.team, unit.x - 1100, unit.y - 1100, 2200, 2200, u => {
                            if (!u.dead && Mathf.dst(unit.x, unit.y, u.x, u.y) <= 1100) {
                                tankyEnemies.push(u);
                            }
                        });

                        tankyEnemies.sort((a, b) => b.maxHealth - a.maxHealth);
                    }

                    let swordsPerFrame = 14;
                    for (let s = 0; s < swordsPerFrame; s++) {
                        if (data.masterSwordsSpawned < data.masterTotalSwords) {
                            data.masterSwordsSpawned++;

                            let targetX, targetY;
                            let isSpecialTankTarget = false;

                            if (data.masterSwordsSpawned <= 3) {
                                let tankIdx = data.masterSwordsSpawned - 1;
                                if (tankIdx < tankyEnemies.length && tankyEnemies[tankIdx].isValid()) {
                                    let tankUnit = tankyEnemies[tankIdx];
                                    targetX = tankUnit.x + Mathf.range(15);
                                    targetY = tankUnit.y + Mathf.range(15);
                                    isSpecialTankTarget = true;
                                }
                            }

                            if (!isSpecialTankTarget) {
                                let targetDist = Mathf.random(50, 750);
                                let targetAngle = attackAngle + Mathf.range(35);

                                targetX = unit.x + Angles.trnsx(targetAngle, targetDist);
                                targetY = unit.y + Angles.trnsy(targetAngle, targetDist);
                            }

                            let skyX = targetX - Angles.trnsx(attackAngle, 350);
                            let skyY = targetY - Angles.trnsy(attackAngle, 350);

                            if (data.activeKeySwordIndex !== -1) {
                                let unitAngle = unit.rotation;
                                let sideAngle = unitAngle - 90;
                                let offsets = [{ forward: 6, side: 14 }, { forward: -6, side: 18 }, { forward: -18, side: 22 }];
                                let off = offsets[data.activeKeySwordIndex];

                                let startX = unit.x + Angles.trnsx(unitAngle, off.forward) + Angles.trnsx(sideAngle, off.side);
                                let startY = unit.y + Angles.trnsy(unitAngle, off.forward) + Angles.trnsy(sideAngle, off.side);

                                masterKeySwordFlyEffect.at(skyX, skyY, 0, {
                                    startX: startX,
                                    startY: startY,
                                    targetX: skyX,
                                    targetY: skyY
                                });
                            }

                            let isLaserSword = Mathf.chance(0.20);

                            data.masterSwordPositions.push({
                                skyX: skyX,
                                skyY: skyY,
                                targetX: targetX,
                                targetY: targetY,
                                angle: attackAngle,
                                hasLaser: isLaserSword,
                                isSpecialTankTarget: isSpecialTankTarget
                            });

                            if (isBloomEnabled() || Mathf.chance(0.50)) {
                                skySwordHoverEffect.at(skyX, skyY, attackAngle);
                            }
                        }
                    }

                    if (data.masterChargeTimer >= 180 || data.masterSwordsSpawned >= data.masterTotalSwords) {
                        data.masterAttackState = "barrage";
                        data.masterChargeTimer = 0;
                        data.masterBarrageTimer = 0;

                        data.activeKeySwordIndex = -1;

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
                    unit.vel.set(0, 0);

                    let strikeBatch = 40;
                    for (let k = 0; k < strikeBatch; k++) {
                        if (data.masterSwordPositions.length > 0) {
                            let pos = data.masterSwordPositions.pop();
                            if (pos) {
                                let finalTargetX = pos.targetX;
                                let finalTargetY = pos.targetY;
                                let finalAngle = pos.angle;

                                if (!pos.isSpecialTankTarget && Mathf.chance(0.30)) {
                                    let extraDist = Mathf.random(250, 500);
                                    let extraAngleSpread = Mathf.range(35);

                                    finalAngle += extraAngleSpread;
                                    finalTargetX += Angles.trnsx(finalAngle, extraDist);
                                    finalTargetY += Angles.trnsy(finalAngle, extraDist);
                                }

                                if (isBloomEnabled() || Mathf.chance(0.50)) {
                                    skySwordRainEffect.at(finalTargetX, finalTargetY, finalAngle, {
                                        skyX: pos.skyX,
                                        skyY: pos.skyY,
                                        targetX: finalTargetX,
                                        targetY: finalTargetY,
                                        hasLaser: pos.hasLaser
                                    });
                                }

                                let uTeam = unit.team;
                                let tx = finalTargetX;
                                let ty = finalTargetY;
                                let isSpecial = pos.isSpecialTankTarget;

                                Time.run(10, () => {
                                    Units.nearbyEnemies(uTeam, tx, ty, 450, enemy => {
                                        if (enemy && enemy.isValid()) {
                                            enemy.health -= 500;
                                            if (enemy.health <= 0) enemy.kill();
                                        }
                                    });

                                    Damage.damage(uTeam, tx, ty, 450, 500, false, true);

                                    if (isBloomEnabled()) {
                                        Fx.blastExplosion.at(tx, ty);
                                        swordImpactShockwaveEffect.at(tx, ty);
                                    } else {
                                        masterLowParticleImpactEffect.at(tx, ty);
                                    }

                                    if (isSpecial) {
                                        for (let auraI = 0; auraI < 40; auraI++) {
                                            let auraAngle = (360 / 40) * auraI + Mathf.range(1.5);
                                            masterBurstAuraSwordBullet.create(unit, uTeam, tx, ty, auraAngle);
                                        }
                                    }
                                });
                            }
                        }
                    }

                    if (data.masterSwordPositions.length === 0 || data.masterBarrageTimer >= 300) {
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
                        let unitAngle = unit.rotation;
                        let sideAngle = unitAngle - 90;

                        let swordSideOffsets = [
                            { forward: 6,   side: 14 },
                            { forward: -6,  side: 18 },
                            { forward: -18, side: 22 },
                            { forward: 6,   side: -14 },
                            { forward: -6,  side: -18 }
                        ];

                        for (let i = 0; i < 5; i++) {
                            let off = swordSideOffsets[i];
                            let spawnX = unit.x + Angles.trnsx(unitAngle, off.forward) + Angles.trnsx(sideAngle, off.side);
                            let spawnY = unit.y + Angles.trnsy(unitAngle, off.forward) + Angles.trnsy(sideAngle, off.side);

                            let spreadAngle = baseAngle + (i - 2) * 15 + Mathf.range(4);

                            masterHomingSwordBullet.create(unit, unit.team, spawnX, spawnY, spreadAngle);
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

                    let maxSwords = isBloomEnabled() ? Math.floor(Mathf.random(1000, 1100)) : Math.floor(Mathf.random(500, 550));
                    data.masterTotalSwords = maxSwords;
                    data.masterSwordPositions = [];

                    data.activeKeySwordIndex = Math.floor(Mathf.random(0, 3));
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
                        seed: unit.id,
                        isCharging: true, isDashing: false, chargeProgress: prog, dashProgress: 0, alpha: prog
                    });

                } else if (data.swordState === "dashing") {
                    let dashProg = Math.min(1.0, data.dashTimer / data.maxDashTime);
                    renderSwordEffect.at(unit.x, unit.y, unit.rotation, {
                        seed: unit.id,
                        isCharging: false, isDashing: true, chargeProgress: 1.0, dashProgress: dashProg, alpha: 1.0
                    });

                } else if (data.swordState === "fanslash") {
                    let fanProg = Math.min(1.0, data.fanTimer / SWORD_FAN_SWEEP_TICKS);
                    renderSwordEffect.at(data.fanX, data.fanY, unit.rotation, {
                        seed: unit.id,
                        isFan: true, fanAngle: data.fanA0 + data.fanSweep * fanProg, alpha: 1.0
                    });

                } else if (data.swordState === "resting") {
                    let alpha = Math.max(0.0, 1.0 - (data.restTimer / 60.0));
                    renderSwordEffect.at(unit.x, unit.y, unit.rotation, {
                        seed: unit.id,
                        isCharging: false, isDashing: false, chargeProgress: 1.0, dashProgress: 0, alpha: alpha
                    });

                    if (Mathf.chance(0.35)) {
                        let sparkX = unit.x + Mathf.range(12);
                        let sparkY = unit.y + Mathf.range(12);
                        swordDissolveSparkEffect.at(sparkX, sparkY);
                    }

                } else if (data.swordState === "idle") {
                    renderSwordEffect.at(unit.x, unit.y, unit.rotation, {
                        seed: unit.id,
                        isCharging: false, isDashing: false, chargeProgress: 1.0, dashProgress: 0, alpha: 1.0
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
                        data.dashHit = {};
                        data.dashHitCount = 0;
                        data.fanRolled = false;

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

                    let swordDmg = 150 * (isMK2BUnit ? 2.0 : 1.0);
                    let steps = 6;
                    if (!data.dashHit) {
                        data.dashHit = {};
                        data.dashHitCount = 0;
                    }
                    for (let i = 0; i <= steps; i++) {
                        let sampleX = Mathf.lerp(prevX, unit.x, i / steps);
                        let sampleY = Mathf.lerp(prevY, unit.y, i / steps);
                        Damage.damage(unit.team, sampleX, sampleY, 36, swordDmg, true, true);

                        if (data.dashHitCount < 14) {
                            Units.nearbyEnemies(unit.team, sampleX, sampleY, 36, enemy => {
                                if (!enemy || !enemy.isValid() || data.dashHit["u" + enemy.id]) return;
                                if (!enemy.within(sampleX, sampleY, 36 + enemy.hitSize / 2)) return;
                                data.dashHit["u" + enemy.id] = true;
                                data.dashHitCount++;
                                spawnSwordHitSlash(enemy.x, enemy.y, dashAngle, enemy.hitSize);
                            });

                            let hitBuild = Vars.world.buildWorld(sampleX, sampleY);
                            if (hitBuild != null && hitBuild.team != unit.team && !data.dashHit["b" + hitBuild.pos()]) {
                                data.dashHit["b" + hitBuild.pos()] = true;
                                data.dashHitCount++;
                                spawnSwordHitSlash(hitBuild.x, hitBuild.y, dashAngle, hitBuild.block.size * 8);
                            }
                        }
                    }

                    if (data.dashHitCount > 0 && !data.fanRolled) {
                        data.fanRolled = true;
                        if (Mathf.chance(0.20)) {
                            unit.vel.set(0, 0);
                            startSwordFan(unit, data, dashAngle, isMK2BUnit);
                            data.swordState = "fanslash";
                            return;
                        }
                    }

                    if (data.dashTimer >= data.maxDashTime) {
                        data.swordState = "resting";
                        data.restTimer = 0;
                        data.dashTimer = 0;
                    }
                    return;

                } else if (data.swordState === "fanslash") {
                    data.fanTimer += Time.delta;
                    unit.vel.set(0, 0);

                    let fanProg = Math.min(1.0, data.fanTimer / SWORD_FAN_SWEEP_TICKS);
                    swordFanDamage(unit, data, fanProg);

                    if (data.fanTimer >= SWORD_FAN_SWEEP_TICKS) {
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