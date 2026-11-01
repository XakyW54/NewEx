const CRIT_CHANCE = 0.5;
const CRIT_MULTIPLIER = 3.0;
const FOOT_UNIT_MULTIPLIER = 1.5;

const PULSAL_SHOTS_NEEDED = 100;
const PULSAL_DURATION = 600;
const PULSAL_LASER_DAMAGE = 420;
const PULSAL_LASER_RANGE = 420 * 1.5 * 2;

const LIGHTNING_INTERVAL = 60;
const LIGHTNING_RADIUS = 20 * Vars.tilesize;
const LIGHTNING_HEAL_PERCENT = 0.10;
const LIGHTNING_ENEMY_MAX_HP_DAMAGE = 0.10;

const BUFF_RADIUS = 10 * Vars.tilesize;
const BUFF_MULTIPLIER = 3.0;
const BUFF_CHECK_INTERVAL = 10;

const SHIELD_THRESHOLD = 0.5;
const SHIELD_MAX_HEALTH = 100000;

const CORVUS_SPAWN_COUNT = 3;
const CORVUS_SPAWN_SPREAD = 14;

const BEAM_HITS_NEEDED = 12;
const BEAM_CHARGE_TIME = 300;
const BEAM_STAR_TIME = 60;
const BEAM_DAMAGE = 10000;
const BEAM_SCALE = 5;
const BEAM_FRONT_OFFSET = 4 * Vars.tilesize;
const BEAM_BASE_LENGTH = 160;
const BEAM_BASE_WIDTH = 15;
const BEAM_ROWS_PER_TICK = 6;
const BEAM_MAX_HALF_WIDTH = 12;
const BEAM_AIM_INTERVAL = 10;
const BEAM_DESTROY_ALLY_BLOCKS = true;
const BEAM_RING_SPACING = 18 * Vars.tilesize;
const BEAM_RING_TRAVEL = 12 * Vars.tilesize;
const BEAM_RING_LIFE = 24;
const BEAM_RING_SIZE = 1.2;
const BEAM_RING_WAVE_SPEED = 40;
const BEAM_RING_MAX = 40;
const BEAM_EDGE_LIFE = 55;
const CHARGE_PARTICLES = 28;
const CHARGE_RADIUS = 100;

const EDGE_MAX = 110;
const RUBBLE_MAX = 140;
const RUBBLE_HOLD = 60;
const RUBBLE_FADE = 60;
const RUBBLE_POP = 14;
const RUBBLE_LIFE = RUBBLE_HOLD + RUBBLE_FADE + 36;
const RUBBLE_BAND = 4 * Vars.tilesize;
const RUBBLE_LAYER = (Layer.debris != null) ? Layer.debris : Layer.bullet - 1;

const DEG = Math.PI / 180;
const PT = 17;
const CK = 6;
const RB = 13;
const CP = 9;
const AR = 9;
const RG = 7;

const laserColor = Color.valueOf("84f4ff");
const lightningColor = Color.valueOf("84f4ff");
const chargeColor = Color.valueOf("b2ffc4");
const rockColor = Color.valueOf("a8a08c");
const rockDark = Color.valueOf("5f5a4c");
const rockLight = Color.valueOf("d2cbb4");
const dustColor = Color.valueOf("7d7868");
const hotColor = Color.valueOf("ffb36b");
const crackDark = Color.valueOf("3a362e");

const states = new IntMap();
const beams = [];

let bBeamLength = BEAM_BASE_LENGTH;
let bBeamWidth = BEAM_BASE_WIDTH;

const RING_SEG = 24;
const WARP_SEG = 36;
const RC = [];
const RS = [];
const WC = [];
const WS = [];
for(let j = 0; j <= RING_SEG; j++){
    RC.push(Math.cos(j * 2 * Math.PI / RING_SEG));
    RS.push(Math.sin(j * 2 * Math.PI / RING_SEG));
}
for(let j = 0; j <= WARP_SEG; j++){
    WC.push(Math.cos(j * 2 * Math.PI / WARP_SEG));
    WS.push(Math.sin(j * 2 * Math.PI / WARP_SEG));
}

const cam = [0, 0, 0, 0];
const swirlOut = [0, 0];

const megaLaser = extend(LaserBulletType, {
    damage: BEAM_DAMAGE,
    lifetime: 40,
    length: BEAM_BASE_LENGTH * BEAM_SCALE,
    width: BEAM_BASE_WIDTH * BEAM_SCALE,
    largeHit: true,
    laserAbsorb: false
});

function rnd(seed, k){
    let n = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

function fxSeed(e){
    return (e.id % 1000) * 100000;
}

function clamp01(x){
    return x < 0 ? 0 : (x > 1 ? 1 : x);
}

function easeOut(x, p){
    return 1 - Math.pow(1 - clamp01(x), p);
}

function updateCam(margin){
    let c = Core.camera;
    let hw = c.width / 2 + margin;
    let hh = c.height / 2 + margin;
    cam[0] = c.position.x - hw;
    cam[1] = c.position.y - hh;
    cam[2] = c.position.x + hw;
    cam[3] = c.position.y + hh;
}

function inCam(x, y){
    return x >= cam[0] && x <= cam[2] && y >= cam[1] && y <= cam[3];
}

function segVisible(x1, y1, x2, y2){
    return !(Math.max(x1, x2) < cam[0] || Math.min(x1, x2) > cam[2] || Math.max(y1, y2) < cam[1] || Math.min(y1, y2) > cam[3]);
}

function wobbleRing(cx, cy, r, amp, f1, f2, p1, p2, s1, s2, time){
    let lx = 0;
    let ly = 0;
    for(let j = 0; j <= RING_SEG; j++){
        let ang = j * 15;
        let rr = r + Math.sin((ang * f1 + p1 + time * s1) * DEG) * amp + Math.sin((ang * f2 + p2 - time * s2) * DEG) * amp * 0.6;
        let x = cx + RC[j] * rr;
        let y = cy + RS[j] * rr;
        if(j > 0) Lines.line(lx, ly, x, y);
        lx = x;
        ly = y;
    }
}

function wobbleRingSeed(cx, cy, r, amp, sd, time){
    wobbleRing(
        cx, cy, r, amp,
        2 + Math.floor(rnd(sd, 3) * 3), 3 + Math.floor(rnd(sd, 4) * 4),
        rnd(sd, 1) * 360, rnd(sd, 2) * 360,
        5 + rnd(sd, 5) * 8, 7 + rnd(sd, 6) * 10,
        time
    );
}

function rollParticle(pp, o){
    pp[o + 2] = Math.random() * 360;
    pp[o + 3] = CHARGE_RADIUS * (0.4 + Math.random());
    pp[o + 4] = (Math.random() - 0.5) * 300;
    pp[o + 5] = 0.7 + Math.random() * 2.3;
    pp[o + 6] = Math.random() * 360;
    pp[o + 7] = Math.random() * 7;
    pp[o + 8] = 0.05 + Math.random() * 0.1;
}

function rollArcs(ar){
    for(let j = 0; j < 8; j++){
        let o = j * AR;
        ar[o] = Math.random() < 0.35 ? 1 : 0;
        ar[o + 1] = Math.random() * 360;
        ar[o + 2] = 1.3 + Math.random() * 2.2;
        ar[o + 3] = Math.random();
        ar[o + 4] = 0.4 + 0.6 * Math.random();
        ar[o + 5] = 0.8 + Math.random() * 1.4;
        ar[o + 6] = Math.random() - 0.5;
        ar[o + 7] = Math.random() - 0.5;
        ar[o + 8] = Math.random() - 0.5;
    }
}

function initChargeCache(s){
    let pp = [];
    let pc = [];
    for(let i = 0; i < CHARGE_PARTICLES; i++){
        pc.push(-1);
        for(let k = 0; k < CP; k++) pp.push(0);
        pp[i * CP] = 26 + Math.random() * 44;
        pp[i * CP + 1] = Math.random();
        rollParticle(pp, i * CP);
    }
    let rg = [];
    for(let k = 0; k < 3; k++){
        rg.push(
            2 + Math.floor(Math.random() * 3), 3 + Math.floor(Math.random() * 4),
            Math.random() * 360, Math.random() * 360,
            5 + Math.random() * 8, 7 + Math.random() * 10,
            Math.random()
        );
    }
    let ar = [];
    for(let k = 0; k < 8 * AR; k++) ar.push(0);
    rollArcs(ar);
    s.pp = pp;
    s.pc = pc;
    s.rg = rg;
    s.ar = ar;
    s.arB = -1;
}

function buildBeamData(eh){
    let L = megaLaser.length;
    let half = megaLaser.width / 2;
    let step = 3 * Vars.tilesize;
    let n = Math.ceil(L / step);

    let pt = [];
    let ptCount = Math.min(EDGE_MAX, Math.round(L / 6));
    for(let i = 0; i < ptCount; i++){
        let d = Math.random() * L;
        let a0 = Math.random() * 360 * DEG;
        let a1 = a0 + (120 + Math.random() * 30) * DEG;
        let a2 = a0 + (230 + Math.random() * 30) * DEG;
        pt.push(
            d,
            Math.random() < 0.5 ? -1 : 1,
            Math.random(),
            (d / L) * 0.22 + Math.random() * 0.08,
            25 + Math.random() * 130,
            (Math.random() - 0.5) * 40,
            half * (0.85 + Math.random() * 0.3),
            3.5 + Math.random() * 7,
            (Math.random() - 0.5) * 720,
            Math.random(),
            Math.cos(a0), Math.sin(a0),
            Math.cos(a1) * 0.8, Math.sin(a1) * 0.8,
            Math.cos(a2) * 0.9, Math.sin(a2) * 0.9,
            0
        );
    }

    let ck = [];
    for(let side = 0; side < 2; side++){
        for(let j = 0; j <= n; j++){
            ck.push(
                3 + Math.random() * 14,
                0.8 + Math.random() * 2,
                Math.random() > 0.72 ? 1 : 0,
                50 + Math.random() * 40,
                18 + Math.random() * 50,
                (Math.random() - 0.5) * 10
            );
        }
    }

    let rb = [];
    let rbCount = Math.min(RUBBLE_MAX, Math.round(L / 5));
    for(let i = 0; i < rbCount; i++){
        let d = Math.random() * L;
        let big = Math.random() < 0.12;
        let a0 = Math.random() * 360 * DEG;
        let a1 = a0 + (110 + Math.random() * 40) * DEG;
        let a2 = a0 + (225 + Math.random() * 40) * DEG;
        rb.push(
            d,
            Math.random() < 0.5 ? -1 : 1,
            Math.min(30, d / (BEAM_ROWS_PER_TICK * Vars.tilesize)) + Math.random() * 5,
            eh + (Math.random() * 1.3 - 0.3) * RUBBLE_BAND,
            big ? 10 + Math.random() * 6 : 3.5 + Math.random() * 6,
            Math.random(),
            (Math.random() - 0.5) * 540,
            Math.cos(a0), Math.sin(a0),
            Math.cos(a1) * 0.8, Math.sin(a1) * 0.8,
            Math.cos(a2) * 0.9, Math.sin(a2) * 0.9
        );
    }

    return {
        L: L,
        half: half,
        eh: eh,
        step: step,
        n: n,
        pt: pt,
        ptCount: ptCount,
        ck: ck,
        rb: rb,
        rbCount: rbCount
    };
}

const pulsalLaserFx = new Effect(15, 900, e => {
    let target = e.data;
    if(target == null) return;
    let f = e.fout();
    Draw.color(laserColor);
    Lines.stroke(8 * f);
    Lines.line(e.x, e.y, target.x, target.y);
    Fill.circle(e.x, e.y, 6 * f);
    Draw.color(Color.white);
    Lines.stroke(3 * f);
    Lines.line(e.x, e.y, target.x, target.y);
    Fill.circle(e.x, e.y, 4 * f);
    Draw.reset();
});

const activateFx = new Effect(40, 200, e => {
    let f = e.fout();
    Draw.color(Color.valueOf("84f4ff"), Color.white, f);
    Lines.stroke(2 * f);
    Lines.circle(e.x, e.y, e.finpow() * 40);
    Fill.circle(e.x, e.y, 6 * f);
    Draw.reset();
});

const chargeFx = new Effect(BEAM_CHARGE_TIME, 4000, e => {
    let u = e.data;
    if(u == null || u.dead || !u.isAdded()) return;
    let s = states.get(u.id);
    if(s == null || s.pp == null) return;

    let f = e.fin();
    let time = e.time;
    let a = s.chargeAngle;
    let ca = Math.cos(a * DEG);
    let sa = Math.sin(a * DEG);
    let px = u.x + ca * BEAM_FRONT_OFFSET;
    let py = u.y + sa * BEAM_FRONT_OFFSET;
    let len = megaLaser.length;
    let ex = px + ca * len;
    let ey = py + sa * len;

    updateCam(260);
    if(!segVisible(px, py, ex, ey)) return;
    updateCam(CHARGE_RADIUS * 2);

    if(inCam(px, py)){
        let pp = s.pp;
        let pc = s.pc;
        let rg = s.rg;
        let ar = s.ar;

        let pulse = 1 + 0.12 * Math.sin(time * 7 * DEG) + 0.07 * Math.sin((time * 19 + 40) * DEG) + 0.04 * Math.sin(time * 43 * DEG);
        let coreR = (6 + f * 30) * pulse;

        for(let k = 0; k < 3; k++){
            let o = k * RG;
            let q = (time / (48 + k * 13) + rg[o + 6]) % 1;
            let r = CHARGE_RADIUS * 0.85 * (1 - q * q) + coreR * 0.4;
            Draw.color(chargeColor, Color.white, q * 0.5);
            Draw.alpha(Math.sin(q * Math.PI) * (0.25 + 0.35 * f));
            Lines.stroke(0.8 + 1.8 * q);
            wobbleRing(px, py, r, r * 0.07, rg[o], rg[o + 1], rg[o + 2], rg[o + 3], rg[o + 4], rg[o + 5], time);
        }

        let active = 0.3 + 0.7 * f;
        for(let i = 0; i < CHARGE_PARTICLES; i++){
            let gate = clamp01(active * CHARGE_PARTICLES - i);
            if(gate <= 0) break;

            let o = i * CP;
            let t = time / pp[o] + pp[o + 1];
            let cyc = Math.floor(t);
            let p = t - cyc;
            if(pc[i] !== cyc){
                pc[i] = cyc;
                rollParticle(pp, o);
            }

            let startR = pp[o + 3];
            let twist = pp[o + 4];
            let p2 = p - pp[o + 8];
            if(p2 < 0) p2 = 0;
            let w = Math.sin((time * 11 + pp[o + 6]) * DEG) * pp[o + 7] * (1 - p);

            let an = (pp[o + 2] + twist * p * p) * DEG;
            let cA = Math.cos(an);
            let sA = Math.sin(an);
            let r = startR * (1 - p * p);
            let x = px + cA * r - sA * w;
            let y = py + sA * r + cA * w;

            let an2 = (pp[o + 2] + twist * p2 * p2) * DEG;
            let r2 = startR * (1 - p2 * p2);
            let x2 = px + Math.cos(an2) * r2 - Math.sin(an2) * w;
            let y2 = py + Math.sin(an2) * r2 + Math.cos(an2) * w;

            let size = pp[o + 5];
            Draw.color(chargeColor, Color.white, p * p);
            Draw.alpha(clamp01(p * 7) * (0.45 + 0.55 * p) * gate);
            Lines.stroke(size * 0.6);
            Lines.line(x, y, x2, y2);
            Fill.circle(x, y, size * (0.7 + 0.6 * p));
        }

        let bucket = Math.floor(time / 3);
        if(s.arB !== bucket){
            s.arB = bucket;
            rollArcs(ar);
        }
        let arcs = 2 + Math.floor(f * 6);
        for(let j = 0; j < arcs; j++){
            let o = j * AR;
            if(ar[o] > 0) continue;
            let cA = Math.cos(ar[o + 1] * DEG);
            let sA = Math.sin(ar[o + 1] * DEG);
            let start = coreR * 0.7;
            let alen = coreR * ar[o + 2];
            let lx = px + cA * start;
            let ly = py + sA * start;
            Draw.color(Color.white, chargeColor, ar[o + 3]);
            Draw.alpha(ar[o + 4] * (0.4 + 0.6 * f));
            Lines.stroke(ar[o + 5]);
            for(let i = 1; i <= 4; i++){
                let d = start + alen * i / 4;
                let off = i == 4 ? 0 : ar[o + 5 + i] * coreR * 0.6;
                let x = px + cA * d - sA * off;
                let y = py + sA * d + cA * off;
                Lines.line(lx, ly, x, y);
                lx = x;
                ly = y;
            }
        }

        Draw.color(chargeColor);
        Draw.alpha(0.12);
        Fill.circle(px, py, coreR * 1.7);
        Draw.alpha(0.22);
        Fill.circle(px, py, coreR * 1.25);
        Draw.alpha(0.4);
        Fill.circle(px, py, coreR);
        Draw.color(Color.white);
        Draw.alpha(0.85);
        Fill.circle(px, py, coreR * 0.45);
    }

    Draw.color(chargeColor);
    Draw.alpha((0.12 + 0.2 * f) * (0.85 + 0.15 * Math.sin(time * 17 * DEG)));
    Lines.stroke(1.5 + f);
    Lines.line(px, py, ex, ey);
    Draw.reset();
});

const starFx = new Effect(36, 600, e => {
    let f = e.fin();
    let sd = fxSeed(e) + 70000;
    let k = Mathf.curve(f, 0, 0.25) * (1 - Mathf.curve(f, 0.25, 1));
    k *= 0.9 + 0.1 * Math.sin(e.time * 53 * DEG);
    let rot = e.rotation + f * 30;

    Draw.color(chargeColor);
    for(let i = 0; i < 4; i++){
        let ln = 135 + rnd(sd, i + 1) * 55;
        Drawf.tri(e.x, e.y, 18 * k, ln * k, rot + i * 90 + (rnd(sd, i + 8) - 0.5) * 6);
        let ln2 = 55 + rnd(sd, i + 20) * 45;
        Drawf.tri(e.x, e.y, 10 * k, ln2 * k, rot + 45 + i * 90 + (rnd(sd, i + 28) - 0.5) * 12);
    }
    Draw.color(Color.white);
    for(let i = 0; i < 4; i++){
        Drawf.tri(e.x, e.y, 8 * k, (90 + rnd(sd, i + 40) * 40) * k, rot + i * 90);
    }
    Fill.circle(e.x, e.y, 10 * k);

    for(let i = 0; i < 12; i++){
        let ang = rnd(sd, 50 + i) * 360 * DEG;
        let ln = 40 + rnd(sd, 70 + i) * 130;
        let c = Math.cos(ang);
        let s = Math.sin(ang);
        Draw.color(chargeColor, Color.white, rnd(sd, 90 + i));
        Draw.alpha(0.7 * k);
        Lines.stroke((0.6 + rnd(sd, 110 + i)) * 1.6 * k);
        Lines.line(e.x + c * 8, e.y + s * 8, e.x + c * ln * k, e.y + s * ln * k);
    }

    for(let i = 0; i < 24; i++){
        let local = clamp01((f - 0.18 - rnd(sd, 130 + i) * 0.12) / 0.62);
        if(local <= 0 || local >= 1) continue;
        let ang = rnd(sd, 150 + i) * 360 * DEG;
        let c = Math.cos(ang);
        let s = Math.sin(ang);
        let dist = (30 + rnd(sd, 170 + i) * 150) * easeOut(local, 2.2);
        let back = dist * 0.82;
        Draw.color(Color.white, chargeColor, local);
        Draw.alpha(1 - local);
        Lines.stroke(1.2 * (1 - local));
        Lines.line(e.x + c * back, e.y + s * back, e.x + c * dist, e.y + s * dist);
        Fill.circle(e.x + c * dist, e.y + s * dist, (1 + rnd(sd, 190 + i) * 1.8) * (1 - local));
    }

    Draw.color(chargeColor);
    Draw.alpha(1 - f);
    Lines.stroke(1 + 2.5 * (1 - f));
    wobbleRingSeed(e.x, e.y, 10 + 50 * e.finpow(), 3 * (1 - f), sd, e.time);
    Draw.reset();
});

function drawWarpRing(cx, cy, radiusX, radiusY, angle, strokeWidth, color){
    Draw.color(color);
    Lines.stroke(strokeWidth);
    let lastX = 0;
    let lastY = 0;
    let cosA = Math.cos(angle * DEG);
    let sinA = Math.sin(angle * DEG);
    for(let i = 0; i <= WARP_SEG; i++){
        let lx = WC[i] * radiusX;
        let ly = WS[i] * radiusY;
        let rx = cx + (lx * cosA - ly * sinA);
        let ry = cy + (lx * sinA + ly * cosA);
        if(i > 0) Lines.line(lastX, lastY, rx, ry);
        lastX = rx;
        lastY = ry;
    }
}

const warpRingFx = new Effect(BEAM_RING_LIFE, 900, e => {
    let t = e.fin();
    let progress = e.fout();

    let maxY = megaLaser.width * 0.5 * BEAM_RING_SIZE;
    let baseY = maxY / 7;
    let baseX = baseY * 0.4;

    let off = BEAM_RING_TRAVEL * (50 / 64) - t * BEAM_RING_TRAVEL;
    let cx = e.x + Math.cos(e.rotation * DEG) * off;
    let cy = e.y + Math.sin(e.rotation * DEG) * off;

    updateCam(maxY + 40);
    if(!inCam(cx, cy)) return;

    let stroke = Math.max(2, maxY * 0.07) * progress;
    drawWarpRing(cx, cy, baseX * (1 + t * 6), baseY * (1 + t * 6), e.rotation, stroke, chargeColor);
    Draw.reset();
});

const edgeFx = new Effect(BEAM_EDGE_LIFE, 10000, e => {
    let fd = e.data;
    if(fd == null) return;

    let L = fd.L;
    let half = fd.half;
    let rot = e.rotation * DEG;
    let cs = Math.cos(rot);
    let sn = Math.sin(rot);

    updateCam(300);
    if(!segVisible(e.x, e.y, e.x + cs * L, e.y + sn * L)) return;
    updateCam(90);

    let f = e.fin();
    let fo = e.fout();
    let ck = fd.ck;
    let n = fd.n;
    let step = fd.step;
    let sweep = clamp01(f / 0.2) * L;

    for(let side = 0; side < 2; side++){
        let sg = side == 0 ? -1 : 1;
        let base = side * (n + 1) * CK;
        let lx = 0;
        let ly = 0;
        for(let j = 0; j <= n; j++){
            let d = Math.min(L, j * step);
            if(d > sweep) break;
            let o = base + j * CK;
            let lat = sg * (half + ck[o] + f * 10);
            let x = e.x + cs * d - sn * lat;
            let y = e.y + sn * d + cs * lat;
            let vis = inCam(x, y);

            if(j > 0 && (vis || inCam(lx, ly))){
                Draw.color(Color.white, chargeColor, f);
                Draw.alpha(0.4 + 0.6 * fo);
                Lines.stroke(ck[o + 1] * (0.3 + 0.7 * fo));
                Lines.line(lx, ly, x, y);
            }

            if(j > 0 && vis && ck[o + 2] > 0){
                let bAng = (e.rotation + sg * ck[o + 3]) * DEG;
                let bc = Math.cos(bAng);
                let bs = Math.sin(bAng);
                let bLen = ck[o + 4] * easeOut(f * 2.5, 2);
                let mo = ck[o + 5];
                let mx = x + bc * bLen * 0.5 - bs * mo;
                let my = y + bs * bLen * 0.5 + bc * mo;
                Draw.color(chargeColor, Color.white, 0.4);
                Draw.alpha(0.6 * fo);
                Lines.stroke(0.8 + fo);
                Lines.line(x, y, mx, my);
                Lines.line(mx, my, x + bc * bLen, y + bs * bLen);
            }
            lx = x;
            ly = y;
        }
    }

    let pt = fd.pt;
    let count = fd.ptCount;
    for(let i = 0; i < count; i++){
        let o = i * PT;
        let delay = pt[o + 3];
        let local = (f - delay) / (1 - delay);
        if(local <= 0 || local >= 1) continue;

        let sg = pt[o + 1];
        let q = 1 - local;
        let ease = 1 - q * q * Math.sqrt(q);
        let out = pt[o + 6] + pt[o + 4] * ease;
        let along = pt[o] + pt[o + 5] * ease;
        let x = e.x + cs * along - sn * sg * out;
        let y = e.y + sn * along + cs * sg * out;
        if(!inCam(x, y)) continue;

        let kind = pt[o + 2];
        if(kind < 0.5){
            let sz = pt[o + 7] * (1 - local * 0.5);
            let ang = pt[o + 8] * local * DEG;
            let ca = Math.cos(ang) * sz;
            let sa = Math.sin(ang) * sz;
            Draw.color(rockColor, dustColor, pt[o + 9]);
            Draw.alpha(1 - local * local * local);
            Fill.tri(
                x + pt[o + 10] * ca - pt[o + 11] * sa, y + pt[o + 10] * sa + pt[o + 11] * ca,
                x + pt[o + 12] * ca - pt[o + 13] * sa, y + pt[o + 12] * sa + pt[o + 13] * ca,
                x + pt[o + 14] * ca - pt[o + 15] * sa, y + pt[o + 14] * sa + pt[o + 15] * ca
            );
        }else if(kind < 0.8){
            let ln = 3 + pt[o + 4] * 0.06 * q;
            Draw.color(Color.white, hotColor, local);
            Draw.alpha(q);
            Lines.stroke(1.4 * q + 0.3);
            Lines.line(x, y, x + sn * sg * ln, y - cs * sg * ln);
            Fill.circle(x, y, 1.2 * q);
        }else{
            Draw.color(dustColor);
            Draw.alpha(0.22 * q);
            Fill.circle(x, y, 2 + pt[o + 7] * 0.9 * (0.5 + local));
        }
    }
    Draw.reset();
});

const rubbleFx = new Effect(RUBBLE_LIFE, 10000, e => {
    let fd = e.data;
    if(fd == null) return;

    let L = fd.L;
    let rot = e.rotation * DEG;
    let cs = Math.cos(rot);
    let sn = Math.sin(rot);

    updateCam(300);
    if(!segVisible(e.x, e.y, e.x + cs * L, e.y + sn * L)) return;
    updateCam(60);

    Draw.z(RUBBLE_LAYER);
    let time = e.time;
    let eh = fd.eh;

    let gl = time < RUBBLE_HOLD + 16 ? 1 : 1 - (time - RUBBLE_HOLD - 16) / RUBBLE_FADE;
    if(gl > 0){
        let ck = fd.ck;
        let n = fd.n;
        let step = fd.step;
        let reveal = Math.min(L, time * BEAM_ROWS_PER_TICK * Vars.tilesize);
        let cool = clamp01(time / 70);
        for(let side = 0; side < 2; side++){
            let sg = side == 0 ? -1 : 1;
            let base = side * (n + 1) * CK;
            let lx = 0;
            let ly = 0;
            for(let j = 0; j <= n; j++){
                let d = Math.min(L, j * step);
                if(d > reveal) break;
                let o = base + j * CK;
                let lat = sg * (eh + ck[o] * 0.5);
                let x = e.x + cs * d - sn * lat;
                let y = e.y + sn * d + cs * lat;
                if(j > 0 && (inCam(x, y) || inCam(lx, ly))){
                    Draw.color(crackDark);
                    Draw.alpha(0.7 * gl);
                    Lines.stroke(ck[o + 1] * 1.3);
                    Lines.line(lx, ly, x, y);
                    Draw.color(hotColor, crackDark, cool);
                    Draw.alpha((1 - cool) * 0.8 * gl);
                    Lines.stroke(ck[o + 1] * 0.5);
                    Lines.line(lx, ly, x, y);
                }
                lx = x;
                ly = y;
            }
        }
    }

    let rb = fd.rb;
    let count = fd.rbCount;
    let start = fd.half * 0.6;
    for(let i = 0; i < count; i++){
        let o = i * RB;
        let tl = time - rb[o + 2];
        if(tl <= 0) continue;
        let a = tl <= RUBBLE_HOLD ? 1 : 1 - (tl - RUBBLE_HOLD) / RUBBLE_FADE;
        if(a <= 0) continue;

        let pop = tl >= RUBBLE_POP ? 1 : easeOut(tl / RUBBLE_POP, 2);
        let sg = rb[o + 1];
        let lat = sg * (start + (rb[o + 3] - start) * pop);
        let x = e.x + cs * rb[o] - sn * lat;
        let y = e.y + sn * rb[o] + cs * lat;
        if(pop < 1) y += Math.sin(pop * Math.PI) * 10;
        if(!inCam(x, y)) continue;

        let sz = rb[o + 4] * (0.7 + 0.3 * a);
        let v0x = rb[o + 7];
        let v0y = rb[o + 8];
        let v1x = rb[o + 9];
        let v1y = rb[o + 10];
        let v2x = rb[o + 11];
        let v2y = rb[o + 12];
        let ca = sz;
        let sa = 0;
        if(pop < 1){
            let ang = rb[o + 6] * (1 - pop) * DEG;
            ca = Math.cos(ang) * sz;
            sa = Math.sin(ang) * sz;
        }
        let x0 = x + v0x * ca - v0y * sa;
        let y0 = y + v0x * sa + v0y * ca;
        let x1 = x + v1x * ca - v1y * sa;
        let y1 = y + v1x * sa + v1y * ca;
        let x2 = x + v2x * ca - v2y * sa;
        let y2 = y + v2x * sa + v2y * ca;

        Draw.color(Color.black);
        Draw.alpha(0.3 * a);
        Fill.tri(x0 + 1.5, y0 - 1.5, x1 + 1.5, y1 - 1.5, x2 + 1.5, y2 - 1.5);
        Draw.color(rockDark, rockColor, rb[o + 5]);
        Draw.alpha(a);
        Fill.tri(x0, y0, x1, y1, x2, y2);
        Draw.color(rockLight);
        Draw.alpha(0.5 * a);
        Fill.tri(x0, y0, x1, y1, x, y);
    }
    Draw.reset();
});

const muzzleBurstFx = new Effect(32, 800, e => {
    let f = e.fin();
    let fo = e.fout();
    let sd = fxSeed(e) + 90000;

    Draw.color(chargeColor);
    Draw.alpha(0.5 * fo);
    Fill.circle(e.x, e.y, 20 + 40 * e.finpow());
    Draw.color(Color.white);
    Draw.alpha(0.9 * fo * fo);
    Fill.circle(e.x, e.y, 10 + 14 * f);

    let ease = easeOut(f, 2.2);
    for(let i = 0; i < 28; i++){
        let forward = rnd(sd, i + 1) < 0.65;
        let ang = (forward ? e.rotation + (rnd(sd, i + 50) - 0.5) * 70 : rnd(sd, i + 50) * 360) * DEG;
        let c = Math.cos(ang);
        let s = Math.sin(ang);
        let dist = (25 + rnd(sd, i + 100) * 150) * ease;
        let tail = dist * (0.55 + rnd(sd, i + 150) * 0.3);
        Draw.color(Color.white, chargeColor, f);
        Draw.alpha(fo);
        Lines.stroke(0.8 + 1.6 * fo);
        Lines.line(e.x + c * tail, e.y + s * tail, e.x + c * dist, e.y + s * dist);
    }

    Draw.color(chargeColor);
    Draw.alpha(fo);
    Lines.stroke(1 + 3 * fo);
    wobbleRingSeed(e.x, e.y, 15 + 90 * e.finpow(), 5 * fo, sd, e.time);
    Draw.reset();
});

const cosStatus = extend(StatusEffect, "cos-core", {
    update(unit, time){
        this.super$update(unit, time);
        let s = states.get(unit.id);
        if(s == null) return;

        let dmgMult = 1.0;

        if(Mathf.chance(CRIT_CHANCE)){
            dmgMult *= CRIT_MULTIPLIER;
        }

        if(s.hasNearbyCosBuff){
            dmgMult *= BUFF_MULTIPLIER;
        }

        unit.damageMultiplier = dmgMult;
        unit.reloadMultiplier = s.hasNearbyCosBuff ? BUFF_MULTIPLIER : 1.0;

        if(s.charging){
            unit.speedMultiplier = 0;
        }
    }
});
cosStatus.permanent = true;
cosStatus.show = false;

function createState(unit){
    let reloads = [];
    let kinds = [];
    for(let i = 0; i < unit.mounts.length; i++){
        let mount = unit.mounts[i];
        let name = mount.weapon.name;
        reloads.push(mount.reload);
        kinds.push(name.endsWith("cos-weapon-a") ? 1 : (name.endsWith("cos-weapon-b") ? 2 : 0));
    }
    return {
        shotsWeaponA: [0, 0],
        pulsalTimer: 0,
        pulsalLaserTimer: [0, 0],
        lightningTimer: 0,
        hasNearbyCosBuff: false,
        buffTimer: Math.random() * BUFF_CHECK_INTERVAL,
        shieldActivated: false,
        lastX: unit.x,
        lastY: unit.y,
        reloads: reloads,
        kinds: kinds,
        hitsB: 0,
        charging: false,
        chargeTimer: 0,
        chargeAngle: 0,
        aimTimer: 0,
        starDone: false,
        pp: null,
        pc: null,
        rg: null,
        ar: null,
        arB: -1
    };
}

function updateShield(unit, s){
    if(!s.shieldActivated && unit.health / unit.maxHealth < SHIELD_THRESHOLD){
        s.shieldActivated = true;
        unit.shield += SHIELD_MAX_HEALTH;
        Fx.shieldApply.at(unit.x, unit.y, unit.hitSize);
        Fx.shockwave.at(unit.x, unit.y);
    }
}

function updateNearbyCosBuff(unit, s){
    let count = 0;
    Units.nearby(unit.team, unit.x - BUFF_RADIUS, unit.y - BUFF_RADIUS, BUFF_RADIUS * 2, BUFF_RADIUS * 2, u => {
        if(!u.dead && u != unit && u.type == unit.type && Mathf.dst(unit.x, unit.y, u.x, u.y) <= BUFF_RADIUS){
            count++;
        }
    });
    s.hasNearbyCosBuff = (count > 0);
}

function triggerLightningPulse(unit){
    let x = unit.x;
    let y = unit.y;

    Units.nearby(unit.team, x - LIGHTNING_RADIUS, y - LIGHTNING_RADIUS, LIGHTNING_RADIUS * 2, LIGHTNING_RADIUS * 2, u => {
        if(!u.dead && Mathf.dst(x, y, u.x, u.y) <= LIGHTNING_RADIUS){
            u.heal(u.maxHealth * LIGHTNING_HEAL_PERCENT);
            Fx.heal.at(u.x, u.y);
            Lightning.create(unit.team, lightningColor, 10, x, y, Angles.angle(x, y, u.x, u.y), Mathf.dst(x, y, u.x, u.y) / Vars.tilesize);
        }
    });

    Vars.indexer.eachBlock(unit.team, x, y, LIGHTNING_RADIUS, b => true, b => {
        b.heal(b.maxHealth * LIGHTNING_HEAL_PERCENT);
        Fx.healBlock.at(b.x * Vars.tilesize, b.y * Vars.tilesize);
    });

    Units.nearbyEnemies(unit.team, x - LIGHTNING_RADIUS, y - LIGHTNING_RADIUS, LIGHTNING_RADIUS * 2, LIGHTNING_RADIUS * 2, u => {
        if(!u.dead && Mathf.dst(x, y, u.x, u.y) <= LIGHTNING_RADIUS){
            u.damage(u.maxHealth * LIGHTNING_ENEMY_MAX_HP_DAMAGE);
            Fx.hitLancer.at(u.x, u.y, lightningColor);
            Lightning.create(unit.team, lightningColor, 20, x, y, Angles.angle(x, y, u.x, u.y), Mathf.dst(x, y, u.x, u.y) / Vars.tilesize);
        }
    });
}

function handleMovementLightning(unit, s){
    let isMoving = Mathf.dst(unit.x, unit.y, s.lastX, s.lastY) > 0.1;
    s.lastX = unit.x;
    s.lastY = unit.y;

    if(isMoving){
        s.lightningTimer += Time.delta;
        if(s.lightningTimer >= LIGHTNING_INTERVAL){
            s.lightningTimer = 0;
            triggerLightningPulse(unit);
        }
    }else{
        s.lightningTimer = 0;
    }
}

function firePulsalLaser(unit, mount){
    let target = Units.closestTarget(unit.team, unit.x, unit.y, PULSAL_LASER_RANGE, u => !u.dead, b => true);
    if(target == null) return;

    let totalDmg = PULSAL_LASER_DAMAGE;
    if(target instanceof Unit && !target.isFlying()){
        totalDmg *= FOOT_UNIT_MULTIPLIER;
    }

    pulsalLaserFx.at(unit.x, unit.y, 0, laserColor, new Vec2(target.x, target.y));
    Fx.hitLancer.at(target.x, target.y, laserColor);
    target.damage(totalDmg);
}

function beamWillHit(unit, mount){
    let w = mount.weapon;
    let x1 = unit.x + Angles.trnsx(unit.rotation - 90, w.x, w.y);
    let y1 = unit.y + Angles.trnsy(unit.rotation - 90, w.x, w.y);
    let ang = w.rotate ? Angles.angle(x1, y1, mount.aimX, mount.aimY) : unit.rotation + w.baseRotation;
    let x2 = x1 + Angles.trnsx(ang, bBeamLength);
    let y2 = y1 + Angles.trnsy(ang, bBeamLength);
    let hw = bBeamWidth / 2;
    let hit = false;

    let minX = Math.min(x1, x2) - hw;
    let minY = Math.min(y1, y2) - hw;
    Units.nearbyEnemies(unit.team, minX, minY, Math.abs(x2 - x1) + hw * 2, Math.abs(y2 - y1) + hw * 2, u => {
        if(!hit && !u.dead && Intersector.distanceSegmentPoint(x1, y1, x2, y2, u.x, u.y) <= u.hitSize / 2 + hw){
            hit = true;
        }
    });
    if(hit) return true;

    Vars.world.raycast(Math.round(x1 / Vars.tilesize), Math.round(y1 / Vars.tilesize), Math.round(x2 / Vars.tilesize), Math.round(y2 / Vars.tilesize), (tx, ty) => {
        let t = Vars.world.tile(tx, ty);
        if(t != null && t.build != null && t.build.team != unit.team && t.build.team != Team.derelict){
            hit = true;
            return true;
        }
        return false;
    });
    return hit;
}

function aimAngle(unit){
    let t = Units.closestTarget(unit.team, unit.x, unit.y, PULSAL_LASER_RANGE, u => !u.dead, b => true);
    if(t == null) return unit.rotation;
    return Angles.angle(unit.x, unit.y, t.x, t.y);
}

function startCharge(unit, s){
    s.charging = true;
    s.chargeTimer = BEAM_CHARGE_TIME;
    s.aimTimer = 0;
    s.hitsB = 0;
    s.starDone = false;
    s.chargeAngle = aimAngle(unit);
    if(!Vars.headless){
        initChargeCache(s);
        chargeFx.at(unit.x, unit.y, 0, chargeColor, unit);
    }
}

function fireBeam(unit, s){
    let a = aimAngle(unit);
    let cs = Mathf.cosDeg(a);
    let sn = Mathf.sinDeg(a);
    let ox = unit.x + Angles.trnsx(a, BEAM_FRONT_OFFSET);
    let oy = unit.y + Angles.trnsy(a, BEAM_FRONT_OFFSET);
    let half = Math.min(BEAM_MAX_HALF_WIDTH, Math.ceil(megaLaser.width / Vars.tilesize / 2));

    megaLaser.create(unit, unit.team, ox, oy, a);
    Effect.shake(12, 40, ox, oy);
    Fx.shockwave.at(ox, oy);

    if(!Vars.headless){
        muzzleBurstFx.at(ox, oy, a, chargeColor);

        for(let d = 0, n = 0; d <= megaLaser.length && n < BEAM_RING_MAX; d += BEAM_RING_SPACING, n++){
            let rx = ox + cs * d;
            let ry = oy + sn * d;
            let delay = d / BEAM_RING_WAVE_SPEED;
            if(delay <= 0){
                warpRingFx.at(rx, ry, a, chargeColor);
            }else{
                Time.run(delay, () => warpRingFx.at(rx, ry, a, chargeColor));
            }
        }

        let fd = buildBeamData(half * Vars.tilesize);
        edgeFx.at(ox, oy, a, chargeColor, fd);
        rubbleFx.at(ox, oy, a, chargeColor, fd);
    }

    beams.push({
        x: ox,
        y: oy,
        cos: cs,
        sin: sn,
        row: 0,
        rows: Math.ceil(megaLaser.length / Vars.tilesize),
        half: half,
        team: unit.team
    });
}

function updateCharge(unit, s){
    if(!s.charging) return;
    unit.vel.setZero();

    s.aimTimer += Time.delta;
    if(s.aimTimer >= BEAM_AIM_INTERVAL){
        s.aimTimer = 0;
        s.chargeAngle = aimAngle(unit);
    }

    s.chargeTimer -= Time.delta;

    if(!s.starDone && s.chargeTimer <= BEAM_STAR_TIME){
        s.starDone = true;
        if(!Vars.headless){
            starFx.at(
                unit.x + Angles.trnsx(s.chargeAngle, BEAM_FRONT_OFFSET),
                unit.y + Angles.trnsy(s.chargeAngle, BEAM_FRONT_OFFSET),
                s.chargeAngle, chargeColor
            );
        }
    }

    if(s.chargeTimer <= 0){
        s.charging = false;
        fireBeam(unit, s);
    }
}

function breakTile(t, team){
    let b = t.build;
    if(b != null){
        if(BEAM_DESTROY_ALLY_BLOCKS || b.team != team) b.kill();
    }else if(t.block() != Blocks.air){
        t.setNet(Blocks.air);
    }

    let f = t.floor();
    if(f != Blocks.hotrock && f != Blocks.magmarock){
        t.setFloorNet(Mathf.chance(0.5) ? Blocks.hotrock : Blocks.magmarock);
    }
}

function sweepRow(bm, r){
    let d = r * Vars.tilesize;
    let cx = bm.x + bm.cos * d;
    let cy = bm.y + bm.sin * d;
    for(let k = -bm.half; k <= bm.half; k++){
        let t = Vars.world.tileWorld(cx - bm.sin * k * Vars.tilesize, cy + bm.cos * k * Vars.tilesize);
        if(t != null) breakTile(t, bm.team);
    }
}

function trackShots(unit, s){
    let mounts = unit.mounts;
    let kinds = s.kinds;
    for(let i = 0; i < mounts.length; i++){
        let kind = kinds[i];
        if(kind == 0){
            s.reloads[i] = mounts[i].reload;
            continue;
        }
        let mount = mounts[i];
        let weapon = mount.weapon;

        if(kind == 1){
            if(s.pulsalTimer > 0){
                mount.reload = 0;
                s.pulsalLaserTimer[i] += Time.delta * unit.reloadMultiplier;
                if(s.pulsalLaserTimer[i] >= weapon.reload){
                    s.pulsalLaserTimer[i] = 0;
                    firePulsalLaser(unit, mount);
                }
            }else{
                let bonusSpeed = 1.0 + Math.min(s.shotsWeaponA[i] * 0.015, 2.0);
                mount.reload += Time.delta * (bonusSpeed - 1.0);

                let reload = mount.reload;
                let fired = reload > s.reloads[i] + 0.5;
                if(fired){
                    s.shotsWeaponA[i]++;
                    if(s.shotsWeaponA[0] >= PULSAL_SHOTS_NEEDED && s.shotsWeaponA[1] >= PULSAL_SHOTS_NEEDED){
                        s.pulsalTimer = PULSAL_DURATION;
                        s.shotsWeaponA[0] = 0;
                        s.shotsWeaponA[1] = 0;
                        activateFx.at(unit.x, unit.y);
                    }
                }
            }
        }else if(!s.charging){
            if(mount.reload > s.reloads[i] + 0.5 && beamWillHit(unit, mount)){
                s.hitsB++;
                if(s.hitsB >= BEAM_HITS_NEEDED){
                    startCharge(unit, s);
                }
            }
        }
        s.reloads[i] = mount.reload;
    }
}

function spawnCorvus(unit){
    let type = UnitTypes.corvus;
    if(type == null) return;
    let spawnCount = 3;
    let spawnSpread = 20;
    let base = Math.random() * 360;
    for(let i = 0; i < spawnCount; i++){
        let ang = base + i * (360 / spawnCount);
        let x = unit.x + Angles.trnsx(ang, spawnSpread);
        let y = unit.y + Angles.trnsy(ang, spawnSpread);
        let c = type.spawn(unit.team, x, y);
        if(c != null){
            c.rotation = unit.rotation;
        }
    }
    Fx.shockwave.at(unit.x, unit.y);
}

const cosAbility = extend(Ability, {
    update(unit){
        if(unit == null || unit.dead || Vars.net.client()) return;
        let s = states.get(unit.id);
        if(s == null){
            s = createState(unit);
            states.put(unit.id, s);
            unit.apply(cosStatus, 1);
        }

        if(s.pulsalTimer > 0){
            s.pulsalTimer -= Time.delta;
        }

        s.buffTimer += Time.delta;
        if(s.buffTimer >= BUFF_CHECK_INTERVAL){
            s.buffTimer = 0;
            updateNearbyCosBuff(unit, s);
        }

        updateShield(unit, s);
        handleMovementLightning(unit, s);
        trackShots(unit, s);
        updateCharge(unit, s);
    },
    death(unit){
        if(unit == null) return;
        states.remove(unit.id);
        if(Vars.net.client()) return;
        spawnCorvus(unit);
    },
    localized(){
        return "Cos Ability";
    }
});

let patched = false;

function isCos(name){
    if(!name) return false;
    let n = name.toLowerCase();
    return n == "cos" || n.endsWith("-cos");
}

function patch(){
    if(patched) return;
    let found = null;
    Vars.content.units().each(u => {
        if(found == null && isCos(u.name)) found = u;
    });
    if(found == null) return;
    patched = true;
    found.abilities.add(cosAbility);

    found.range *= 1.5;

    found.weapons.each(w => {
        if(w.name.endsWith("cos-weapon-b") && w.bullet instanceof LaserBulletType){
            bBeamLength = w.bullet.length;
            bBeamWidth = w.bullet.width;
        }
    });
    megaLaser.length = bBeamLength * BEAM_SCALE;
    megaLaser.width = bBeamWidth * BEAM_SCALE;
    megaLaser.drawSize = megaLaser.length * 2;
}

Events.run(EventType.Trigger.update, () => {
    if(beams.length == 0 || Vars.state.isPaused() || Vars.net.client()) return;
    for(let i = beams.length - 1; i >= 0; i--){
        let bm = beams[i];
        let end = Math.min(bm.row + BEAM_ROWS_PER_TICK, bm.rows);
        for(let r = bm.row; r < end; r++){
            sweepRow(bm, r);
        }
        bm.row = end;
        if(end >= bm.rows) beams.splice(i, 1);
    }
});

Events.on(EventType.ContentInitEvent, e => patch());
Events.on(EventType.ClientLoadEvent, e => patch());
Events.on(EventType.ServerLoadEvent, e => patch());
Events.on(EventType.WorldLoadEvent, e => {
    states.clear();
    beams.length = 0;
});