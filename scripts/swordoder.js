const NexNet = global.NexNet;
const PerfCore = global.PerfCore;
const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqMK2 = { copper: 2000, lead: 2000, silicon: 2000 };
const reqMK2B = { titanium: 1000, thorium: 1000, graphite: 1000 };
const SLASH_DAMAGE = 1200.0;
const BULLET_DAMAGE = 500.0;
const BASE_RANGE = 210.0;
const MK2_CRIT_CHANCE = 0.5;
const MK2_CRIT_MULT = 2.45;

 function isEn() {
    let loc = "";
    if (typeof Core !== "undefined" && Core.settings) {
        loc = String(Core.settings.get("locale", "vi"));
    }
    return loc.startsWith("en");
}

function t(viText, enText) {
    return isEn() ? enText : viText;
}

 function drawSwordRegion(x, y, rot, scale) {
    let swordRegion = PerfCore.region("newex-swordoder-sword");
    if (!swordRegion.found()) swordRegion = PerfCore.region("swordoder-sword");

    if (swordRegion.found()) {
        let width = swordRegion.width * Draw.scl * scale;
        let height = swordRegion.height * Draw.scl * scale;
        Draw.rect(swordRegion, x, y, width, height, rot - 90);
    }
}

 function checkExecute(unit, team) {
    if (unit != null && unit.team != team && !unit.dead) {
        if (unit.health / unit.maxHealth <= 0.15) {
            unit.damagePierce(unit.maxHealth);
        }
    }
}

 function damageArc(team, x, y, rotation, radius, arcAngle, damageAmount, source) {
    let originX = x - Angles.trnsx(rotation, radius);
    let originY = y - Angles.trnsy(rotation, radius);

    let startAngle = rotation - arcAngle / 2;
    let steps = 18;
    let angleStep = arcAngle / steps;
    let hitRadius = 50.0;
    let rolledUnits = {};

    for (let i = 0; i <= steps; i++) {
        let currentAngle = startAngle + angleStep * i;
        let px = originX + Angles.trnsx(currentAngle, radius);
        let py = originY + Angles.trnsy(currentAngle, radius);

         Units.nearbyEnemies(team, px - hitRadius, py - hitRadius, hitRadius * 2, hitRadius * 2, cons(unit => {
            if (unit.within(px, py, hitRadius)) {
                unit.damage(damageAmount);
                checkExecute(unit, team);
                if (source != null && rolledUnits[unit.id] !== true) {
                    rolledUnits[unit.id] = true;
                    elementHit(source, unit, damageAmount);
                }
            }
        }));

         Damage.damage(team, px, py, hitRadius, damageAmount, true, true);
    }
}

 const vSlashHitFx = new Effect(24, cons(e => {
    Draw.z(Layer.effect + 0.01);

    let fin = e.fin();
    let rot = e.rotation;
    let turretX = e.x;
    let turretY = e.y;

    let fxX = e.x + Angles.trnsx(rot, 15.0);
    let fxY = e.y + Angles.trnsy(rot, 15.0);

    let radius = 240.0;
    let arcAngle = 90.0;

    let originX = fxX - Angles.trnsx(rot, radius);
    let originY = fxY - Angles.trnsy(rot, radius);

    let startAngle = rot - arcAngle / 2;
    let endAngle = rot + arcAngle / 2;

    let currentAngle = startAngle + (endAngle - startAngle) * fin;
    let swordX = originX + Angles.trnsx(currentAngle, radius - 33.0);
    let swordY = originY + Angles.trnsy(currentAngle, radius - 33.0);

    let swordRot = currentAngle;
    let scale = Math.max(0.0, 1.0 - fin) * 3.0;

    let alpha = 1.0 - fin;
    let headProgress = Math.min(1.0, fin * 1.2);
    let currentSweep = (startAngle + (endAngle - startAngle) * headProgress) - startAngle;

    if (currentSweep > 0) {
        Draw.color(PerfCore.color("#ffe066"), PerfCore.color("#ff5500"), fin);
        Draw.alpha(alpha);
        Lines.stroke(36.0 * (scale / 3.0));
        Lines.arc(originX, originY, radius - 18.0, currentSweep / 360, startAngle);

        Draw.color(Color.white);
        Draw.alpha(alpha);
        Lines.stroke(15.0 * (scale / 3.0));
        Lines.arc(originX, originY, radius - 24.0, currentSweep / 360, startAngle);
    }

    let smokeCount = 20;
    for (let i = 0; i <= smokeCount; i++) {
        let spawnProgress = i / smokeCount;

        if (fin >= spawnProgress) {
            let stepAngle = startAngle + (endAngle - startAngle) * spawnProgress;
            let px = originX + Angles.trnsx(stepAngle, radius);
            let py = originY + Angles.trnsy(stepAngle, radius);

            let smokeSeed = e.id * 100 + i;
            let particleLife = (fin - spawnProgress) / (1.0 - spawnProgress + 0.0001);

            let baseAngle = stepAngle + 25.0;
            let smAng = baseAngle + Mathf.randomSeed(smokeSeed, -30, 30);

            let flySpeed = 20.0 + Mathf.randomSeed(smokeSeed + 1, 0, 25);
            let flyDist = flySpeed * particleLife;

            let smX = px + Angles.trnsx(smAng, flyDist);
            let smY = py + Angles.trnsy(smAng, flyDist);

            let smSize = (2.5 + particleLife * 7.0 + Mathf.randomSeed(smokeSeed + 2, 0, 3));
            let smAlpha = alpha * (1.0 - particleLife) * 0.5;

            Draw.color(Color.gray, Color.darkGray, particleLife);
            Draw.alpha(Math.max(0.0, smAlpha));
            Fill.circle(smX, smY, smSize);

            if (Mathf.randomSeed(smokeSeed + 3, 0, 1) > 0.4) {
                Draw.color(PerfCore.color("#aee5ff"), Color.white, Mathf.randomSeed(smokeSeed + 4, 0, 1));
                Lines.stroke((1.5 + Mathf.randomSeed(smokeSeed + 5, 0, 1.5)) * (1.0 - particleLife));

                let sparkSeed = e.id * 1000 + i * 10 + Math.floor(fin * 15);
                let p1X = smX + Mathf.randomSeed(sparkSeed, -5, 5);
                let p1Y = smY + Mathf.randomSeed(sparkSeed + 1, -5, 5);
                let p2X = p1X + Mathf.randomSeed(sparkSeed + 2, -8, 8);
                let p2Y = p1Y + Mathf.randomSeed(sparkSeed + 3, -8, 8);

                Lines.line(p1X, p1Y, p2X, p2Y);
            }
        }
    }

    Draw.color(PerfCore.color("#aee5ff"), Color.white, Mathf.randomSeed(e.id + 99, 0, 1));
    Lines.stroke(2.5 * alpha);

    let beamLines = 3;
    for (let j = 0; j < beamLines; j++) {
        let beamSeed = e.id * 50 + j + Math.floor(fin * 20);
        let targetAngle = startAngle + (endAngle - startAngle) * Mathf.randomSeed(beamSeed, 0, fin);
        let targetX = originX + Angles.trnsx(targetAngle, radius);
        let targetY = originY + Angles.trnsy(targetAngle, radius);

        let midX = (turretX + targetX) / 2 + Mathf.randomSeed(beamSeed + 1, -20, 20);
        let midY = (turretY + targetY) / 2 + Mathf.randomSeed(beamSeed + 2, -20, 20);

        Lines.line(turretX, turretY, midX, midY);
        Lines.line(midX, midY, targetX, targetY);
    }

    drawSwordRegion(swordX, swordY, swordRot, scale);

    Draw.reset();
}));

function clamp01(v) {
    return v < 0 ? 0 : (v > 1 ? 1 : v);
}

function elementHit(source, unit, dmg) {
    if (source == null || unit == null) return;
    if (global.NexElement != null && typeof global.NexElement.hit === "function") {
        global.NexElement.hit(source, unit, dmg);
    }
}

const RIFT_MAX_POINTS = 26;
const riftPx = new Array(RIFT_MAX_POINTS + 1);
const riftPy = new Array(RIFT_MAX_POINTS + 1);
const riftNx = new Array(RIFT_MAX_POINTS + 1);
const riftNy = new Array(RIFT_MAX_POINTS + 1);
const riftHl = new Array(RIFT_MAX_POINTS + 1);
const riftHr = new Array(RIFT_MAX_POINTS + 1);
const riftSpawnTimes = [];

function riftDetail() {
    let now = Time.time;
    if (riftSpawnTimes.length > 0 && now < riftSpawnTimes[0]) riftSpawnTimes.length = 0;
    while (riftSpawnTimes.length > 0 && now - riftSpawnTimes[0] > 70) riftSpawnTimes.shift();
    riftSpawnTimes.push(now);

    let n = riftSpawnTimes.length;
    let lod = PerfCore.level();
    if (n > 10) lod = Math.max(lod, 2);
    else if (n > 4) lod = Math.max(lod, 1);
    return lod;
}

function riftBody(fin) {
    let opening = fin < 0.1 ? 1.0 - Math.pow(1.0 - fin / 0.1, 3.0) : 1.0;
    let closeK = fin < 0.4 ? 0.0 : (fin - 0.4) / 0.6;
    return opening * Math.pow(1.0 - closeK, 1.5);
}

function drawSpaceRift(e, isArc, length, halfWidth, lod) {
    let fin = e.fin();
    let body = riftBody(fin);
    if (body <= 0.01) return;

    let seed = e.id * 977;
    let n = lod >= 2 ? 16 : RIFT_MAX_POINTS;
    let grow = clamp01(fin / 0.1);
    let closeK = fin < 0.4 ? 0.0 : (fin - 0.4) / 0.6;
    let rot = e.rotation;

    let arcRadius = 240.0;
    let arcAngle = 90.0;
    let originX = e.x - Angles.trnsx(rot, arcRadius);
    let originY = e.y - Angles.trnsy(rot, arcRadius);
    let startAngle = rot - arcAngle / 2;

    for (let i = 0; i <= n; i++) {
        let u = i / n;
        let mid = Math.sin(Math.PI * u);
        let bx, by, tx, ty;

        if (isArc) {
            let ang = startAngle + arcAngle * u;
            bx = originX + Angles.trnsx(ang, arcRadius);
            by = originY + Angles.trnsy(ang, arcRadius);
            tx = Angles.trnsx(ang + 90.0, 1.0);
            ty = Angles.trnsy(ang + 90.0, 1.0);
        } else {
            let d = (u - 0.5) * length;
            bx = e.x + Angles.trnsx(rot, d);
            by = e.y + Angles.trnsy(rot, d);
            tx = Angles.trnsx(rot, 1.0);
            ty = Angles.trnsy(rot, 1.0);
        }

        let nx = -ty;
        let ny = tx;
        let jag = (Mathf.randomSeed(seed + i * 31, -1, 1) + Mathf.randomSeed(seed + i * 53 + 7, -0.5, 0.5)) * 4.5 * Math.pow(mid, 0.5);

        riftPx[i] = bx + nx * jag;
        riftPy[i] = by + ny * jag;
        riftNx[i] = nx;
        riftNy[i] = ny;

        let reveal = clamp01((grow - u) * 8.0 + 0.0001);
        let shape = Math.pow(mid, 0.65) * body * reveal * (1.0 - closeK * (1.0 - mid) * 0.85);
        riftHl[i] = halfWidth * shape * (1.0 + 0.4 * Mathf.randomSeed(seed + i * 17 + 3, -1, 1));
        riftHr[i] = halfWidth * shape * (1.0 + 0.4 * Mathf.randomSeed(seed + i * 19 + 5, -1, 1));
    }

    Draw.z(Layer.effect + 0.02);

    Draw.color(PerfCore.color("#000008"));
    Draw.alpha(0.5 * body);
    for (let i = 0; i < n; i++) {
        let w0l = riftHl[i] * 1.55 + 1.5 * body, w0r = riftHr[i] * 1.55 + 1.5 * body;
        let w1l = riftHl[i + 1] * 1.55 + 1.5 * body, w1r = riftHr[i + 1] * 1.55 + 1.5 * body;
        if (riftHl[i] <= 0.05 && riftHl[i + 1] <= 0.05) continue;
        Fill.quad(
            riftPx[i] + riftNx[i] * w0l, riftPy[i] + riftNy[i] * w0l,
            riftPx[i + 1] + riftNx[i + 1] * w1l, riftPy[i + 1] + riftNy[i + 1] * w1l,
            riftPx[i + 1] - riftNx[i + 1] * w1r, riftPy[i + 1] - riftNy[i + 1] * w1r,
            riftPx[i] - riftNx[i] * w0r, riftPy[i] - riftNy[i] * w0r
        );
    }

    Draw.color(PerfCore.color("#04010f"));
    Draw.alpha(0.97);
    for (let i = 0; i < n; i++) {
        if (riftHl[i] <= 0.05 && riftHl[i + 1] <= 0.05) continue;
        Fill.quad(
            riftPx[i] + riftNx[i] * riftHl[i], riftPy[i] + riftNy[i] * riftHl[i],
            riftPx[i + 1] + riftNx[i + 1] * riftHl[i + 1], riftPy[i + 1] + riftNy[i + 1] * riftHl[i + 1],
            riftPx[i + 1] - riftNx[i + 1] * riftHr[i + 1], riftPy[i + 1] - riftNy[i + 1] * riftHr[i + 1],
            riftPx[i] - riftNx[i] * riftHr[i], riftPy[i] - riftNy[i] * riftHr[i]
        );
    }

    Draw.blend(Blending.additive);

    for (let i = 2; i < n - 1; i += 4) {
        let hw = Math.max(riftHl[i], riftHr[i]);
        if (hw <= 1.0) continue;
        Draw.color(i % 8 == 2 ? PerfCore.color("#5b21b6") : PerfCore.color("#1d4ed8"));
        Draw.alpha(0.3 * body);
        Fill.circle(riftPx[i], riftPy[i], hw * 0.9);
    }

    let starCount = lod >= 2 ? 8 : (lod == 1 ? 18 : 34);
    for (let s = 0; s < starCount; s++) {
        let u = Mathf.randomSeed(seed + s * 13 + 1, 0.05, 0.95);
        let idx = u * n;
        let i = Math.min(n - 1, Math.floor(idx));
        let f = idx - i;
        let cx = riftPx[i] + (riftPx[i + 1] - riftPx[i]) * f;
        let cy = riftPy[i] + (riftPy[i + 1] - riftPy[i]) * f;
        let nxs = riftNx[i], nys = riftNy[i];
        let v = Mathf.randomSeed(seed + s * 13 + 2, -0.9, 0.9);
        let half = (v >= 0 ? riftHl[i] : riftHr[i]) * (1.0 - f) + (v >= 0 ? riftHl[i + 1] : riftHr[i + 1]) * f;
        if (half < 0.8) continue;

        let sx = cx + nxs * half * v;
        let sy = cy + nys * half * v;
        let phase = Mathf.randomSeed(seed + s * 13 + 3, 0, 6.28);
        let tw = 0.55 + 0.45 * Math.sin(e.time * (0.25 + (s % 5) * 0.07) + phase);
        let kind = s % 4;

        Draw.color(kind == 0 ? PerfCore.color("#ffffff") : (kind == 1 ? PerfCore.color("#aee5ff") : (kind == 2 ? PerfCore.color("#ffd1f5") : PerfCore.color("#fff4b0"))));
        Draw.alpha(tw * Math.min(1.0, body * 1.4));
        Fill.circle(sx, sy, (0.5 + (s % 3) * 0.35) * (0.6 + 0.4 * tw));

        if (s % 7 == 0 && lod == 0) {
            Lines.stroke(0.7);
            Lines.line(sx - 2.8 * tw, sy, sx + 2.8 * tw, sy);
            Lines.line(sx, sy - 2.8 * tw, sx, sy + 2.8 * tw);
        }
    }

    if (fin < 0.18) {
        let flash = 1.0 - fin / 0.18;
        Draw.color(Color.white);
        Draw.alpha(flash);
        Lines.stroke(1.5 + 5.0 * flash);
        for (let i = 0; i < n; i++) {
            if (riftHl[i] <= 0.05 && riftHl[i + 1] <= 0.05) continue;
            Lines.line(riftPx[i], riftPy[i], riftPx[i + 1], riftPy[i + 1]);
        }
    }

    for (let pass = 0; pass < 2; pass++) {
        if (pass == 0) {
            Draw.color(PerfCore.color("#a855f7"));
            Draw.alpha(0.28 * body);
            Lines.stroke(4.0 * body + 0.6);
        } else {
            Draw.color(PerfCore.color("#ffffff"), PerfCore.color("#8fd8ff"), fin);
            Draw.alpha(0.95 * Math.min(1.0, body * 1.6));
            Lines.stroke(1.3 * body + 0.35);
        }
        for (let i = 0; i < n; i++) {
            if (riftHl[i] > 0.15 || riftHl[i + 1] > 0.15) {
                Lines.line(
                    riftPx[i] + riftNx[i] * riftHl[i], riftPy[i] + riftNy[i] * riftHl[i],
                    riftPx[i + 1] + riftNx[i + 1] * riftHl[i + 1], riftPy[i + 1] + riftNy[i + 1] * riftHl[i + 1]
                );
            }
            if (riftHr[i] > 0.15 || riftHr[i + 1] > 0.15) {
                Lines.line(
                    riftPx[i] - riftNx[i] * riftHr[i], riftPy[i] - riftNy[i] * riftHr[i],
                    riftPx[i + 1] - riftNx[i + 1] * riftHr[i + 1], riftPy[i + 1] - riftNy[i + 1] * riftHr[i + 1]
                );
            }
        }
    }

    let branchCount = lod >= 2 ? 0 : (lod == 1 ? 3 : 7);
    let branchGrow = clamp01((fin - 0.04) / 0.16);
    if (branchCount > 0 && branchGrow > 0) {
        for (let k = 0; k < branchCount; k++) {
            let bi = 3 + Math.floor(Mathf.randomSeed(seed + k * 41 + 9, 0, n - 6.01));
            let side = Mathf.randomSeed(seed + k * 41 + 10, -1, 1) >= 0 ? 1 : -1;
            let hw = side > 0 ? riftHl[bi] : riftHr[bi];
            if (hw < 0.8) continue;

            let bx = riftPx[bi] + riftNx[bi] * hw * side;
            let by = riftPy[bi] + riftNy[bi] * hw * side;
            let dir = Mathf.angle(riftNx[bi] * side, riftNy[bi] * side) + Mathf.randomSeed(seed + k * 41 + 11, -40, 40);
            let segs = 3;

            for (let sg = 0; sg < segs; sg++) {
                if (branchGrow < (sg / segs)) break;
                let segLen = Mathf.randomSeed(seed + k * 41 + sg * 3 + 12, 9, 22) * clamp01(branchGrow * segs - sg + 0.2);
                let ex = bx + Angles.trnsx(dir, segLen);
                let ey = by + Angles.trnsy(dir, segLen);
                Draw.color(PerfCore.color("#d8b4fe"), PerfCore.color("#ffffff"), 1.0 - sg / segs);
                Draw.alpha(0.85 * Math.pow(body, 0.8));
                Lines.stroke(1.5 - sg * 0.45);
                Lines.line(bx, by, ex, ey);
                bx = ex;
                by = ey;
                dir += Mathf.randomSeed(seed + k * 41 + sg * 3 + 13, -32, 32);
            }
        }
    }

    if (lod == 0 && fin < 0.55) {
        let t = fin / 0.55;
        for (let d = 0; d < 12; d++) {
            let di = 2 + Math.floor(Mathf.randomSeed(seed + d * 23 + 21, 0, n - 4.01));
            let side = Mathf.randomSeed(seed + d * 23 + 22, -1, 1) >= 0 ? 1 : -1;
            let hw = side > 0 ? riftHl[di] : riftHr[di];
            if (hw < 0.8) continue;
            let dirA = Mathf.angle(riftNx[di] * side, riftNy[di] * side) + Mathf.randomSeed(seed + d * 23 + 23, -55, 55);
            let dist = Math.sqrt(t) * Mathf.randomSeed(seed + d * 23 + 24, 14, 46);
            let dx = riftPx[di] + riftNx[di] * hw * side + Angles.trnsx(dirA, dist);
            let dy = riftPy[di] + riftNy[di] * hw * side + Angles.trnsy(dirA, dist);
            Draw.color(PerfCore.color("#e0f2ff"), PerfCore.color("#a855f7"), t);
            Draw.alpha(1.0 - t);
            Lines.stroke(1.2 * (1.0 - t) + 0.2);
            Lines.line(dx, dy, dx + Angles.trnsx(dirA, 3.0 + 4.0 * (1.0 - t)), dy + Angles.trnsy(dirA, 3.0 + 4.0 * (1.0 - t)));
        }
    }

    Draw.blend();
    Draw.reset();
}

const spaceRiftArcFx = new Effect(120, 700, cons(e => {
    let d = e.data;
    let lod = (d != null && d.lod !== undefined) ? d.lod : 0;
    drawSpaceRift(e, true, 340.0, 13.0, lod);
}));

const spaceRiftCutFx = new Effect(100, 600, cons(e => {
    let d = e.data;
    let lod = (d != null && d.lod !== undefined) ? d.lod : 0;
    let len = (d != null && d.len !== undefined) ? Number(d.len) : 240.0;
    drawSpaceRift(e, false, len, 8.5, lod);
}));

const spaceRiftBigFx = new Effect(150, 700, cons(e => {
    let d = e.data;
    let lod = (d != null && d.lod !== undefined) ? d.lod : 0;
    let len = (d != null && d.len !== undefined) ? Number(d.len) : 340.0;
    drawSpaceRift(e, false, len, 15.0, lod);
}));

const samuraiCutFx = new Effect(20, 600, cons(e => {
    let d = e.data;
    let len = (d != null && d.len !== undefined) ? Number(d.len) : 240.0;
    let fin = e.fin();
    let rot = e.rotation;

    let head = 1.0 - Math.pow(1.0 - clamp01(fin / 0.3), 3.0);
    let tail = clamp01((fin - 0.12) / 0.88);
    tail = tail * tail;

    let ax = e.x - Angles.trnsx(rot, len / 2);
    let ay = e.y - Angles.trnsy(rot, len / 2);
    let bx = e.x + Angles.trnsx(rot, len / 2);
    let by = e.y + Angles.trnsy(rot, len / 2);

    let p0x = ax + (bx - ax) * tail;
    let p0y = ay + (by - ay) * tail;
    let p1x = ax + (bx - ax) * head;
    let p1y = ay + (by - ay) * head;
    if (head <= tail) return;

    let mx = (p0x + p1x) / 2;
    let my = (p0y + p1y) / 2;
    let nx = -Angles.trnsy(rot, 1.0);
    let ny = Angles.trnsx(rot, 1.0);
    let w = 6.0 * Math.pow(1.0 - fin, 1.3);

    Draw.z(Layer.effect + 0.03);
    Draw.blend(Blending.additive);

    Draw.color(PerfCore.color("#7dd3fc"));
    Draw.alpha(0.8 * (1.0 - fin));
    Fill.tri(p0x, p0y, mx + nx * w * 1.8, my + ny * w * 1.8, mx - nx * w * 1.8, my - ny * w * 1.8);
    Fill.tri(p1x, p1y, mx + nx * w * 1.8, my + ny * w * 1.8, mx - nx * w * 1.8, my - ny * w * 1.8);

    Draw.color(Color.white);
    Draw.alpha(1.0 - fin * 0.6);
    Fill.tri(p0x, p0y, mx + nx * w * 0.8, my + ny * w * 0.8, mx - nx * w * 0.8, my - ny * w * 0.8);
    Fill.tri(p1x, p1y, mx + nx * w * 0.8, my + ny * w * 0.8, mx - nx * w * 0.8, my - ny * w * 0.8);

    if (fin < 0.5) {
        let k = fin / 0.5;
        Draw.color(PerfCore.color("#e0f2ff"), PerfCore.color("#a855f7"), k);
        Draw.alpha(1.0 - k);
        Lines.stroke(1.4 * (1.0 - k) + 0.2);
        for (let i = 0; i < 6; i++) {
            let a = rot + 90.0 + Mathf.randomSeed(e.id * 7 + i, -70, 70) + (i % 2 == 0 ? 0 : 180);
            let dist = 6.0 + k * Mathf.randomSeed(e.id * 7 + i + 100, 14, 36);
            let sx = p1x + Angles.trnsx(a, dist);
            let sy = p1y + Angles.trnsy(a, dist);
            Lines.line(sx, sy, sx + Angles.trnsx(a, 4.0), sy + Angles.trnsy(a, 4.0));
        }
    }

    Draw.blend();
    Draw.reset();
}));

function damageCut(team, x, y, angle, length, damageAmount, source) {
    let half = length / 2;
    let radius = 28.0;
    let steps = Math.max(1, Math.ceil(length / (radius * 1.5)));
    let rolled = {};

    for (let i = 0; i <= steps; i++) {
        let d = -half + (length * i) / steps;
        let px = x + Angles.trnsx(angle, d);
        let py = y + Angles.trnsy(angle, d);

        Damage.damage(team, px, py, radius, damageAmount, true, true);

        Units.nearbyEnemies(team, px - radius, py - radius, radius * 2, radius * 2, cons(unit => {
            if (unit.within(px, py, radius)) {
                checkExecute(unit, team);
                if (source != null && rolled[unit.id] !== true) {
                    rolled[unit.id] = true;
                    elementHit(source, unit, damageAmount);
                }
            }
        }));
    }
}

function triggerSlashArea(b) {
    if (b == null) return;

    let dataObj = b.data;
    if (dataObj != null && typeof dataObj === "object") {
        if (dataObj.slashed === true) return;
        dataObj.slashed = true;

        let mult = dataObj.mult !== undefined ? dataObj.mult : 1.0;
        let slashDmg = mult * SLASH_DAMAGE;
        spaceRiftArcFx.at(b.x, b.y, b.rotation(), Color.white, { lod: riftDetail() });
        damageArc(b.team, b.x, b.y, b.rotation(), 240.0, 90.0, slashDmg, b.owner);
    } else if (b.data === true) {
        return;
    } else {
        b.data = { slashed: true, mult: 1.0 };
        spaceRiftArcFx.at(b.x, b.y, b.rotation(), Color.white, { lod: riftDetail() });
        damageArc(b.team, b.x, b.y, b.rotation(), 240.0, 90.0, SLASH_DAMAGE, b.owner);
    }
}

 const swordoderBulletBase = extend(BasicBulletType, {
    speed: 6,
    damage: 500,
    width: 24,
    height: 24,
    hitEffect: vSlashHitFx,
    despawnEffect: vSlashHitFx,
    buildingDamageMultiplier: 1.0,

    despawned(b) {
        this.super$despawned(b);
        triggerSlashArea(b);
    },

    collided(b, other) {
        let result = this.super$collided(b, other);

        if (other != null && other.team != b.team && other.health !== undefined) {
            checkExecute(other, b.team);
        }

        triggerSlashArea(b);

        if (other != null && b.owner != null && typeof b.owner.handleSwordoderHit === "function") {
            b.owner.handleSwordoderHit(b, other);
        }
        return result;
    },

    draw(b) {
        Draw.z(Layer.bullet);

        let reg = PerfCore.region("newex-swordoder-sword");
        if (!reg.found()) reg = PerfCore.region("swordoder-sword");

        if (reg.found()) {
            Draw.rect(reg, b.x, b.y, reg.width * Draw.scl, reg.height * Draw.scl, b.rotation() - 90);
        } else {
            this.super$draw(b);
        }
        Draw.reset();
    }
});

 const swordoder = extend(ItemTurret, "swordoder", {
    configurable: true
});

swordoder.health = 867000;
swordoder.range = 210;
swordoder.reload = 120;
swordoder.recoil = 8;

swordoder.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

 swordoder.buildType = () => extend(ItemTurret.ItemTurretBuild, swordoder, {
    created() {
        this.super$created();
        this.tierState = 0;
        this.subBulletTaskTimer = 0.0;
        this.pendingSubBullets = 0;
        this.customRecoil = 0.0;
        this.comboQueue = [];
        this.comboClock = 0.0;
        this.lockedTargets = [];
        this.mk2bTimer = 60.0;
        this.mk2bScanTimer = 0.0;
        return this;
    },

    updateTile() {
        this.super$updateTile();

        if (!this.comboQueue) {
            this.comboQueue = [];
            this.comboClock = 0.0;
        }

        if (this.comboQueue.length > 0) {
            this.comboClock += Time.delta;
            while (this.comboQueue.length > 0 && this.comboQueue[0].t <= this.comboClock) {
                this.executeSamuraiCut(this.comboQueue.shift());
            }
            if (this.comboQueue.length == 0) this.comboClock = 0.0;
        }

        if (this.customRecoil > 0) {
            this.customRecoil = Math.max(0, this.customRecoil - Time.delta * 0.15);
        }

        if (this.pendingSubBullets > 0) {
            this.subBulletTaskTimer -= Time.delta;
            if (this.subBulletTaskTimer <= 0) {
                this.fire1BSidePattern(30.0);
                this.pendingSubBullets = 0;
            }
        }

        if (this.getTier() == 2) {
            this.updateMk2bStrike();
            return;
        }

        let currentReload = 120;

        if (this.hasAmmo()) {
            if (this.timer.get(0, currentReload)) {
                this.findTarget();

                let isControlled = this.isControlled() || this.logicControlled();

                if (this.target != null) {
                    this.wasShooting = true;
                    this.turnToTarget(this.angleTo(this.target));
                    this.shoot(swordoderBulletBase);
                } else if (isControlled && this.isShooting) {
                    this.wasShooting = true;
                    this.shoot(swordoderBulletBase);
                } else {
                    this.wasShooting = false;
                }
            }
        }
    },

    draw() {
        this.super$draw();

        let swordRegion = PerfCore.region("newex-swordoder-sword");
        if (!swordRegion.found()) swordRegion = PerfCore.region("swordoder-sword");

        if (swordRegion.found()) {
            Draw.z(Layer.turret + 0.01);

            let offset = -this.customRecoil * swordoder.recoil;
            let rx = this.x + Angles.trnsx(this.rotation, offset);
            let ry = this.y + Angles.trnsy(this.rotation, offset);

            Draw.rect(swordRegion, rx, ry, this.rotation - 90);
        }

        if (this.getTier() == 2 && this.lockedTargets != null && this.lockedTargets.length > 0) {
            Draw.z(Layer.effect);
            Draw.color(Pal.remove);
            Lines.stroke(1.5);
            for (let i = 0; i < this.lockedTargets.length; i++) {
                let lockU = this.lockedTargets[i];
                if (lockU != null && lockU.isValid() && !lockU.dead) {
                    Lines.circle(lockU.x, lockU.y, lockU.hitSize / 2 + 6);
                }
            }
            Draw.reset();
        }
    },

    getTier() { return this.tierState || 0; },
    setTier(val) {
        let tierValue = Number(val);
        if (tierValue == 1 || tierValue == 2) {
            if (this.getTier() == 0) {
                this.tierState = tierValue;
                this.lockedTargets = [];
                this.mk2bTimer = 60.0;
            }
        }
    },

    config() { return java.lang.Integer(this.getTier()); },

    range() {
        if (this.getTier() == 2) return BASE_RANGE * 6.0;
        return BASE_RANGE;
    },

    rollCrit() {
        if (this.getTier() == 1 && Mathf.chance(MK2_CRIT_CHANCE)) return MK2_CRIT_MULT;
        return 1.0;
    },

    handleSwordoderHit(bullet, target) {
    },

    updateMk2bStrike() {
        if (!this.lockedTargets) this.lockedTargets = [];

        this.mk2bTimer = Math.min(60.0, this.mk2bTimer + Time.delta);
        this.mk2bScanTimer += Time.delta;

        if (this.mk2bScanTimer >= 10.0) {
            this.mk2bScanTimer = 0.0;
            let rng = this.range();

            for (let i = this.lockedTargets.length - 1; i >= 0; i--) {
                let lockU = this.lockedTargets[i];
                if (lockU == null || !lockU.isValid() || lockU.dead || !this.within(lockU, rng)) {
                    this.lockedTargets.splice(i, 1);
                }
            }

            if (this.lockedTargets.length < 3) {
                let found = [];
                Units.nearbyEnemies(this.team, this.x - rng, this.y - rng, rng * 2, rng * 2, cons(u => {
                    if (u.isValid() && !u.dead && this.within(u, rng)) {
                        let already = false;
                        for (let i = 0; i < this.lockedTargets.length; i++) {
                            if (this.lockedTargets[i].id == u.id) already = true;
                        }
                        if (!already) found.push(u);
                    }
                }));

                found.sort((a, b) => this.dst2(a) - this.dst2(b));

                for (let i = 0; i < found.length && this.lockedTargets.length < 3; i++) {
                    this.lockedTargets.push(found[i]);
                }
            }
        }

        if (this.lockedTargets.length > 0) {
            this.turnToTarget(this.angleTo(this.lockedTargets[0]));
        }

        if (this.mk2bTimer >= 60.0 && this.lockedTargets.length > 0 && this.hasAmmo()) {
            this.mk2bTimer = 0.0;
            this.customRecoil = 1.0;
            this.useAmmo();

            for (let i = 0; i < this.lockedTargets.length; i++) {
                let lockU = this.lockedTargets[i];
                if (lockU != null && lockU.isValid() && !lockU.dead) {
                    this.executeSamuraiCut({
                        x: lockU.x,
                        y: lockU.y,
                        ang: Mathf.random(0.0, 180.0),
                        big: true,
                        dmg: SLASH_DAMAGE
                    });
                }
            }
        }
    },

    fire1BSidePattern(angleOffset) {
        let currentRange = this.range();
        let targetDist = Math.max(1.0, currentRange - 1.0);

        if (this.targetPos != null && (this.target != null || this.isControlled())) {
            let distToTarget = Mathf.dst(this.x, this.y, this.targetPos.x, this.targetPos.y);
            targetDist = Math.min(distToTarget, targetDist);
        }

        let baseAngle = this.rotation + angleOffset;
        let critMult = this.rollCrit();
        let rndSpeed = 6.0;
        let calculatedLifetime = targetDist / rndSpeed;

        let b = swordoderBulletBase.create(this, this.team, this.x, this.y, baseAngle);
        if (b != null) {
            b.data = { slashed: false, mult: critMult };
            b.vel.setLength(rndSpeed);
            b.lifetime = calculatedLifetime;
            b.damage = BULLET_DAMAGE * critMult;
        }
    },

    startSamuraiCombo() {
        if (!this.comboQueue) {
            this.comboQueue = [];
            this.comboClock = 0.0;
        }
        if (this.comboQueue.length > 0) return;

        let range = this.range();
        let aimAngle = this.rotation;
        let dist = range * 0.75;

        if (this.target != null) {
            aimAngle = this.angleTo(this.target);
            dist = Math.min(range, Mathf.dst(this.x, this.y, this.target.x, this.target.y));
        } else if (this.targetPos != null) {
            aimAngle = Mathf.angle(this.targetPos.x - this.x, this.targetPos.y - this.y);
            dist = Math.min(range, Mathf.dst(this.x, this.y, this.targetPos.x, this.targetPos.y));
        }

        let cx = this.x + Angles.trnsx(aimAngle, dist);
        let cy = this.y + Angles.trnsy(aimAngle, dist);

        let baseAng = Mathf.random(0.0, 180.0);
        let travelDelay = dist / 6.0;
        let pattern = [
            { da: -38, d: 0 },
            { da: 38, d: 7 },
            { da: 90, d: 14 },
            { da: 0, d: 21 },
            { da: -64, d: 28 },
            { da: 64, d: 35 },
            { da: 96, d: 46, big: true }
        ];

        for (let i = 0; i < pattern.length; i++) {
            let step = pattern[i];
            this.comboQueue.push({
                t: this.comboClock + travelDelay + step.d,
                x: cx + (step.big ? 0.0 : Mathf.range(14.0)),
                y: cy + (step.big ? 0.0 : Mathf.range(14.0)),
                ang: baseAng + step.da,
                big: step.big === true,
                dmg: SLASH_DAMAGE * this.rollCrit() * (step.big ? 3.0 : 1.0)
            });
        }
    },

    executeSamuraiCut(cut) {
        if (cut == null || !this.isValid()) return;

        let len = cut.big ? 340.0 : 240.0;
        let lod = riftDetail();

        samuraiCutFx.at(cut.x, cut.y, cut.ang, Color.white, { len: len });
        (cut.big ? spaceRiftBigFx : spaceRiftCutFx).at(cut.x, cut.y, cut.ang, Color.white, { len: len, lod: lod });

        if (!Vars.headless) {
            Effect.shake(cut.big ? 5.0 : 1.8, cut.big ? 12.0 : 5.0, cut.x, cut.y);
        }

        if (!Vars.net.client()) {
            damageCut(this.team, cut.x, cut.y, cut.ang, len, cut.dmg, this);
        }
    },

    shoot(type) {
        let tier = this.getTier();
        if (tier == 2) return;

        this.customRecoil = 1.0;

        if (Mathf.chance(0.5)) {
            this.startSamuraiCombo();
        }

        if (tier == 1) {
            this.fire1BSidePattern(-30.0);
            this.pendingSubBullets = 1;
            this.subBulletTaskTimer = 12.0;
            this.useAmmo();
            return;
        }

        let currentRange = this.range();
        let targetDist = Math.max(1.0, currentRange - 1.0);

        if (this.targetPos != null && (this.target != null || this.isControlled())) {
            let distToTarget = Mathf.dst(this.x, this.y, this.targetPos.x, this.targetPos.y);
            targetDist = Math.min(distToTarget, targetDist);
        }

        let rndSpeed = 6.0;
        let calculatedLifetime = targetDist / rndSpeed;

        let b = swordoderBulletBase.create(this, this.team, this.x, this.y, this.rotation);
        if (b != null) {
            b.data = { slashed: false, mult: 1.0 };
            b.vel.setLength(rndSpeed);
            b.lifetime = calculatedLifetime;
            b.damage = BULLET_DAMAGE;
        }

        this.useAmmo();
    },

    buildConfiguration(table) {
        table.clear();
        table.row();

        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialog = extend(BaseDialog, t("Trung tâm nâng cấp pháo Swordoder", "Swordoder Turret Upgrade Center"), {});

            let reqSnapshot = (() => {
                let core = this.team.core();
                if (core == null) return t("[red]Không tìm thấy Lõi Đội![]", "[red]Team Core not found![]");

                let cCop = core.items.get(Items.copper);
                let cLea = core.items.get(Items.lead);
                let cSil = core.items.get(Items.silicon);
                let cTit = core.items.get(Items.titanium);
                let cTho = core.items.get(Items.thorium);
                let cGra = core.items.get(Items.graphite);

                let colCop = cCop >= reqMK2.copper ? "[green]" : "[red]";
                let colLea = cLea >= reqMK2.lead ? "[green]" : "[red]";
                let colSil = cSil >= reqMK2.silicon ? "[green]" : "[red]";

                let colTit = cTit >= reqMK2B.titanium ? "[green]" : "[red]";
                let colTho = cTho >= reqMK2B.thorium ? "[green]" : "[red]";
                let colGra = cGra >= reqMK2B.graphite ? "[green]" : "[red]";

                return t(
                    "[yellow]YÊU CẦU TÀI NGUYÊN LÕI (CẤP MK1):[]\n" +
                    "[cyan]Nhánh MK2:[]\n" +
                    " • Đồng: " + colCop + cCop + "[] / " + reqMK2.copper + "\n" +
                    " • Chì: " + colLea + cLea + "[] / " + reqMK2.lead + "\n" +
                    " • Silicon: " + colSil + cSil + "[] / " + reqMK2.silicon + "\n" +
                    "[cyan]Nhánh MK2B:[]\n" +
                    " • Titan: " + colTit + cTit + "[] / " + reqMK2B.titanium + "\n" +
                    " • Thorium: " + colTho + cTho + "[] / " + reqMK2B.thorium + "\n" +
                    " • Than chì: " + colGra + cGra + "[] / " + reqMK2B.graphite,

                    "[yellow]CORE RESOURCE REQUIREMENTS (MK1 TIER):[]\n" +
                    "[cyan]MK2 Branch:[]\n" +
                    " • Copper: " + colCop + cCop + "[] / " + reqMK2.copper + "\n" +
                    " • Lead: " + colLea + cLea + "[] / " + reqMK2.lead + "\n" +
                    " • Silicon: " + colSil + cSil + "[] / " + reqMK2.silicon + "\n" +
                    "[cyan]MK2B Branch:[]\n" +
                    " • Titanium: " + colTit + cTit + "[] / " + reqMK2B.titanium + "\n" +
                    " • Thorium: " + colTho + cTho + "[] / " + reqMK2B.thorium + "\n" +
                    " • Graphite: " + colGra + cGra + "[] / " + reqMK2B.graphite
                );
            })();
            let reqCell = dialog.cont.add(reqSnapshot.toString());

            reqCell.width(380).get().setWrap(true);
            reqCell.get().setAlignment(Align.left);
            dialog.cont.row();
            dialog.cont.add().height(10).row();

            let tryUpgrade = (targetTier, reqList) => {
                let core = this.team.core();
                let enough = core != null;
                for (let i = 0; enough && i < reqList.length; i++) {
                    if (core.items.get(reqList[i].item) < reqList[i].amount) enough = false;
                }

                if (enough && this.getTier() == 0) {
                    for (let i = 0; i < reqList.length; i++) {
                        NexNet.take(core, reqList[i].item, reqList[i].amount);
                    }
                    NexNet.configure(this, java.lang.Integer(targetTier));
                    NexNet.fx(Fx.upgradeCore, this.x, this.y);
                    NexNet.shake(4, 4, this.x, this.y);
                    dialog.hide();
                    this.deselect();
                } else {
                    Vars.ui.showInfo(t("[red]Không đủ tài nguyên để nâng cấp![]", "[red]Not enough resources to upgrade![]"));
                }
            };

            let mainTable = new Table();
            let tier = this.getTier();

            let boxA = new Table();
            boxA.background(Styles.black6);
            boxA.margin(12);
            boxA.add(t("[yellow]===(MK2)===[]", "[yellow]===(MK2)===[]")).row();

            let txtA = tier == 1 ? t("[green]✔ ĐÃ NÂNG CẤP MK2[]\n", "[green]✔ MK2 UPGRADED[]\n") : "";
            txtA += t(
                "Kiếm sĩ song hướng:\n" +
                " [white]• Kiểu bắn mới: [green]2 bên góc 30°[] (30° trước, 30° sau [yellow]0.2s[])\n" +
                " • Tỉ lệ bạo kích: [green]+50%[]\n" +
                " • Sát thương bạo kích: [green]+145%[]\n" +
                " • Áp dụng cho đạn và vệt chém[]",

                "Dual-side swordsman:\n" +
                " [white]• New firing pattern: [green]both sides at 30°[] (30° front, 30° back after [yellow]0.2s[])\n" +
                " • Crit chance: [green]+50%[]\n" +
                " • Crit damage: [green]+145%[]\n" +
                " • Applies to bullets and slashes[]"
            );
            let txtACell = boxA.add(txtA);
            txtACell.width(340).get().setWrap(true);
            txtACell.get().setAlignment(Align.left);
            boxA.row();

            if (tier == 0) {
                boxA.button(t("[yellow]NÂNG CẤP MK2[]", "[yellow]UPGRADE MK2[]"), packRun(() => {
                    tryUpgrade(1, [
                        { item: Items.copper, amount: reqMK2.copper },
                        { item: Items.lead, amount: reqMK2.lead },
                        { item: Items.silicon, amount: reqMK2.silicon }
                    ]);
                })).size(280, 40);
            }

            mainTable.add(boxA).width(360).row();
            mainTable.add().height(12).row();

            let boxB = new Table();
            boxB.background(Styles.black6);
            boxB.margin(12);
            boxB.add(t("[cyan]===(MK2B)===[]", "[cyan]===(MK2B)===[]")).row();

            let txtB = tier == 2 ? t("[green]✔ ĐÃ NÂNG CẤP MK2B[]\n", "[green]✔ MK2B UPGRADED[]\n") : "";
            txtB += t(
                "Trảm kiếm tầm xa:\n" +
                " [white]• Tầm bắn: [green]+500%[] (1,260px)\n" +
                " • Mục tiêu vào tầm bắn: lập tức [yellow]mỗi 1s[] tạo nhát chém ngay tại vị trí mục tiêu\n" +
                " • Khóa tối đa [green]3 mục tiêu[]\n" +
                " • Không còn bắn đạn thường[]",

                "Long-range slayer:\n" +
                " [white]• Range: [green]+500%[] (1,260px)\n" +
                " • Target in range: instantly [yellow]every 1s[] creates a slash at the target position\n" +
                " • Locks up to [green]3 targets[]\n" +
                " • No longer fires normal bullets[]"
            );
            let txtBCell = boxB.add(txtB);
            txtBCell.width(340).get().setWrap(true);
            txtBCell.get().setAlignment(Align.left);
            boxB.row();

            if (tier == 0) {
                boxB.button(t("[cyan]NÂNG CẤP MK2B[]", "[cyan]UPGRADE MK2B[]"), packRun(() => {
                    tryUpgrade(2, [
                        { item: Items.titanium, amount: reqMK2B.titanium },
                        { item: Items.thorium, amount: reqMK2B.thorium },
                        { item: Items.graphite, amount: reqMK2B.graphite }
                    ]);
                })).size(280, 40);
            }

            mainTable.add(boxB).width(360);

            let scroll = new ScrollPane(mainTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton();
            dialog.show();
        })).size(50, 40).tooltip(t("Trung tâm nâng cấp pháo Swordoder", "Swordoder Turret Upgrade Center"));

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let tier = this.getTier();
            let tierName = tier == 2 ? "Mk2B" : (tier == 1 ? "Mk2" : "Mk1");
            let title = t(" Thông số pháo Swordoder " + tierName + " ", " Swordoder " + tierName + " Stats ");

            let rangePx = tier == 2 ? 1260 : 210;
            let rangeTiles = (rangePx / 8).toFixed(1);

            let descStr = t(
                "[gold]⚡ THÔNG SỐ PHÁO SWORDODER (" + tierName.toUpperCase() + ") ⚡[]\n" +
                "[lightgray]Máu:[] [green]867,000[]\n" +
                "[lightgray]Tầm bắn:[] [green]" + rangePx + "px (" + rangeTiles + " ô)[]\n" +
                "[lightgray]Sát thương gốc:[] [green]500[] (đạn) + [green]1,200[] (chém)\n" +
                "[red]• Tận diệt:[] Mục tiêu còn [yellow]<= 15% máu[] chịu sát thương bằng [yellow]100% máu tối đa[]\n" +
                "[white]• Khi đạn chạm hoặc hết tầm tạo vệt chém diện rộng[]",

                "[gold]⚡ SWORDODER TURRET STATS (" + tierName.toUpperCase() + ") ⚡[]\n" +
                "[lightgray]Health:[] [green]867,000[]\n" +
                "[lightgray]Range:[] [green]" + rangePx + "px (" + rangeTiles + " tiles)[]\n" +
                "[lightgray]Base Damage:[] [green]500[] (bullet) + [green]1,200[] (slash)\n" +
                "[red]• Execute:[] Targets at [yellow]<= 15% HP[] take damage equal to [yellow]100% max HP[]\n" +
                "[white]• On hit or when range ends, bullets create an area slash[]"
            );

            if (tier == 1) {
                descStr += t(
                    "\n\n[yellow]===(MK2)===[]\n[white]• Bắn 2 bên góc 30° (30° trước, 30° sau 0.2s)\n• Bạo kích: [green]50%[] tỉ lệ, [green]+145%[] sát thương[]",
                    "\n\n[yellow]===(MK2)===[]\n[white]• Fires both sides at 30° (30° front, 30° back after 0.2s)\n• Crit: [green]50%[] chance, [green]+145%[] damage[]"
                );
            }

            if (tier == 2) {
                descStr += t(
                    "\n\n[cyan]===(MK2B)===[]\n[white]• Tầm bắn +500%\n• Mỗi 1s tạo nhát chém tại vị trí mục tiêu\n• Khóa tối đa 3 mục tiêu[]",
                    "\n\n[cyan]===(MK2B)===[]\n[white]• Range +500%\n• Every 1s creates a slash at target position\n• Locks up to 3 targets[]"
                );
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true);
            cell.get().setAlignment(Align.left);

            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton();
            dialog.show();
        })).size(50, 40).tooltip(t("Xem thông số pháo Swordoder", "View Swordoder Stats"));
    },

    write(write) {
        this.super$write(write);
        write.b(100 + this.getTier());
        write.b(0);
    },

    read(read, revision) {
        this.super$read(read, revision);
        let storedTier = read.b();
        read.b();
        this.tierState = (storedTier >= 100 && storedTier <= 102) ? (storedTier - 100) : 0;
    }
});
