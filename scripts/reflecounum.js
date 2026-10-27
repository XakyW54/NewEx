const NexNet = global.NexNet;
const packRun = (fn) => new java.lang.Runnable({ run: fn });
const packProv = (fn) => new Packages.arc.func.Prov({ get: fn });
const packCons2 = (fn) => new Cons2({ get: fn });
const packBoolf = (fn) => new Packages.arc.func.Boolf({ get: fn });
const packFloatp = (fn) => new Packages.arc.func.Floatp({ get: fn });
const packFunc = (fn) => new Packages.arc.func.Func({ get: fn });

 const isEn = () => {
    let loc = Core.settings ? Core.settings.get("locale", "") : "";
    return loc.startsWith("en");
};

const reqMK2 = { titanium: 400, silicon: 300, thorium: 200 };
const reqMK2B = { titanium: 600, silicon: 500, plastanium: 350, surgeAlloy: 150 };
const reqSpecial = { copper: 4000, lead: 4000, silicon: 4000 };

const reflectorColor = Color.valueOf("#d000ff");
const reflectorGlow = Color.valueOf("#00f0ff");

const perk4Bullet = extend(BasicBulletType, {
    speed: 8,
    damage: 30,
    lifetime: 180,
    homingPower: 0.20,
    homingRange: 300,
    pierce: true,
    pierceCap: 4,
    frontColor: reflectorGlow,
    backColor: Color.white
});

const perk6Bullet = extend(BasicBulletType, {
    speed: 18,
    damage: 150,
    lifetime: 60,
    homingPower: 0.15,
    homingRange: 400,
    pierce: true,
    pierceCap: 20,
    splashDamage: 120,
    splashDamageRadius: 20,
    frontColor: reflectorColor,
    backColor: Color.white
});

const reflectEffect = new Effect(15, e => {
    Draw.color(reflectorGlow, reflectorColor, e.fout());
    Lines.stroke(e.fout() * 2.5);
    Lines.poly(e.x, e.y, 6, e.fin() * 12);
});

const shockwaveFx = new Effect(30, e => {
    Draw.color(reflectorColor, reflectorGlow, e.fout());
    Lines.stroke(e.fout() * 3);
    Lines.circle(e.x, e.y, e.fin() * 200);
    Draw.reset();
});

function insideHex(px, py, cx, cy, r) {
    let ax = Math.abs(px - cx);
    let ay = Math.abs(py - cy);
    return ay <= r * 0.866 && 0.866 * ax + 0.5 * ay <= r * 0.866;
}

function drawHexClipped(x, y, r, others) {
    let steps = 4;
    for (let i = 0; i < 6; i++) {
        let x1 = x + Mathf.cosDeg(i * 60) * r;
        let y1 = y + Mathf.sinDeg(i * 60) * r;
        let x2 = x + Mathf.cosDeg((i + 1) * 60) * r;
        let y2 = y + Mathf.sinDeg((i + 1) * 60) * r;

        for (let k = 0; k < steps; k++) {
            let ax = x1 + (x2 - x1) * (k / steps);
            let ay = y1 + (y2 - y1) * (k / steps);
            let bx = x1 + (x2 - x1) * ((k + 1) / steps);
            let by = y1 + (y2 - y1) * ((k + 1) / steps);
            let mx = (ax + bx) / 2;
            let my = (ay + by) / 2;

            let covered = false;
            for (let j = 0; j < others.length; j++) {
                if (insideHex(mx, my, others[j].x, others[j].y, others[j].r - 1)) {
                    covered = true;
                    break;
                }
            }

            if (!covered) Lines.line(ax, ay, bx, by);
        }
    }
}

const NexReflect = {
    list: [],
    buffers: [],
    blockBuffers: [],
    baseline: {},
    lines: [],
    lineCache: {},
    lineClasses: null,
    EXT: 320,
    hideFx: false,
    fpsLow: 0,
    fpsHigh: 0,

    register(build) {
        for (let i = 0; i < this.list.length; i++) {
            if (this.list[i].id == build.id) return;
        }
        this.list.push(build);
    },

    active() {
        let out = [];
        for (let i = this.list.length - 1; i >= 0; i--) {
            let s = this.list[i];
            if (s == null || !s.isValid()) {
                this.list.splice(i, 1);
                continue;
            }
            if (!s.isShieldBroken() && s.getShieldHp() > 0) out.push(s);
        }
        return out;
    },

    isProtected(e) {
        if (e == null) return false;
        let shields = this.active();
        for (let i = 0; i < shields.length; i++) {
            let s = shields[i];
            if (s.team == e.team && Mathf.within(s.x, s.y, e.x, e.y, s.getShieldRadius())) return true;
        }
        return false;
    },

    sizeOf(e, isB) {
        return isB ? e.block.size * 8 : e.hitSize;
    },

    maxHp(e, isB) {
        let m = e.maxHealth;
        if (typeof m === "function") return e.maxHealth();
        return Number(m);
    },

    initLineClasses() {
        this.lineClasses = [];
        let names = ["LaserBulletType", "ContinuousBulletType", "RailBulletType", "PointLaserBulletType", "SapBulletType"];
        for (let i = 0; i < names.length; i++) {
            try {
                this.lineClasses.push(java.lang.Class.forName("mindustry.entities.bullet." + names[i]));
            } catch (err) {
            }
        }
    },

    lineInfo(type) {
        let id = type.id;
        let c = this.lineCache[id];
        if (c !== undefined) return c;
        if (this.lineClasses == null) this.initLineClasses();

        let line = false;
        for (let i = 0; i < this.lineClasses.length; i++) {
            if (this.lineClasses[i].isInstance(type)) line = true;
        }

        let len = Number(type.length);
        if (!(len > 0)) len = Number(type.speed) * Number(type.lifetime);
        let w = Number(type.width);
        let half = (w > 0 ? w * 0.5 : 8) + 4;

        c = { line: line, len: len, half: half };
        this.lineCache[id] = c;
        return c;
    },

    collectLines(shields) {
        let out = [];
        let group = Groups.bullet;
        let n = group.size();
        for (let i = 0; i < n; i++) {
            let b = group.index(i);
            if (b == null) continue;
            let info = this.lineInfo(b.type);
            if (!info.line || !(info.len > 0)) continue;

            let ang = b.rotation() * Mathf.degRad;
            let dx = Math.cos(ang);
            let dy = Math.sin(ang);
            let ox = b.x;
            let oy = b.y;

            for (let j = 0; j < shields.length; j++) {
                let s = shields[j];
                if (b.team == s.team) continue;
                let R = s.getShieldRadius();
                let rx = s.x - ox;
                let ry = s.y - oy;
                let proj = rx * dx + ry * dy;
                let perp2 = rx * rx + ry * ry - proj * proj;
                if (perp2 > R * R) continue;
                let t1 = proj - Math.sqrt(R * R - perp2);
                if (t1 < 0 || t1 > info.len) continue;
                out.push({
                    sx: ox + dx * t1,
                    sy: oy + dy * t1,
                    ex: ox + dx * info.len,
                    ey: oy + dy * info.len,
                    half: info.half,
                    shield: s
                });
            }
        }
        return out;
    },

    hasLines(s) {
        for (let i = 0; i < this.lines.length; i++) {
            if (this.lines[i].shield.id == s.id) return true;
        }
        return false;
    },

    segDist(px, py, ax, ay, bx, by) {
        let vx = bx - ax;
        let vy = by - ay;
        let wx = px - ax;
        let wy = py - ay;
        let c1 = vx * wx + vy * wy;
        if (c1 <= 0) return Math.sqrt(wx * wx + wy * wy);
        let c2 = vx * vx + vy * vy;
        if (c2 <= c1) {
            let ux = px - bx;
            let uy = py - by;
            return Math.sqrt(ux * ux + uy * uy);
        }
        let t = c1 / c2;
        let qx = ax + t * vx;
        let qy = ay + t * vy;
        return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
    },

    inCorridor(x, y, size, s) {
        for (let i = 0; i < this.lines.length; i++) {
            let l = this.lines[i];
            if (l.shield.id != s.id) continue;
            if (this.segDist(x, y, l.sx, l.sy, l.ex, l.ey) <= l.half + size / 2) return true;
        }
        return false;
    },

    visit(cb, ringOnlyWithLines) {
        let shields = this.active();
        if (shields.length == 0) return;
        let seen = {};

        for (let phase = 0; phase < 2; phase++) {
            for (let i = 0; i < shields.length; i++) {
                let s = shields[i];
                if (phase == 1 && ringOnlyWithLines && !this.hasLines(s)) continue;
                let R = s.getShieldRadius();
                let sx = s.x;
                let sy = s.y;
                let query = phase == 0 ? R : R + this.EXT;

                Units.nearby(s.team, sx, sy, query, cons(u => {
                    if (u == null || !u.isValid() || u.dead || seen[u.id] === true) return;
                    let inDisk = Mathf.within(sx, sy, u.x, u.y, R + u.hitSize / 2);
                    if (phase == 0 ? !inDisk : inDisk) return;
                    seen[u.id] = true;
                    cb(u, s, u.id, false, phase);
                }));

                Vars.indexer.eachBlock(s.team, sx, sy, query, packBoolf(b => true), cons(b => {
                    if (b == null || !b.isValid() || seen[b.id] === true) return;
                    if (String(b.block.name).indexOf("build") == 0) return;
                    let inDisk = Mathf.within(sx, sy, b.x, b.y, R + b.block.size * 4);
                    if (phase == 0 ? !inDisk : inDisk) return;
                    seen[b.id] = true;
                    cb(b, s, b.id, true, phase);
                }));
            }
        }
    },

    strip() {
        let recs = this.buffers;
        this.buffers = [];
        for (let i = 0; i < recs.length; i++) {
            let u = recs[i].unit;
            if (u != null && u.isValid() && !u.dead) u.shield = recs[i].base;
        }

        let brecs = this.blockBuffers;
        this.blockBuffers = [];
        for (let i = 0; i < brecs.length; i++) {
            let b = brecs[i].build;
            if (b != null && b.isValid()) b.health = brecs[i].base;
        }
    },

    applyBuffers() {
        this.strip();
        if (Vars.net.client()) return;

        let shields = this.active();
        if (shields.length == 0) return;

        this.visit((e, s, id, isB, phase) => {
            if (phase == 1 && !this.inCorridor(e.x, e.y, this.sizeOf(e, isB), s)) return;
            let cap = s.getShieldHp();

            if (!isB) {
                let base = e.shield;
                e.shield = base + cap;
                this.buffers.push({ unit: e, shield: s, base: base, buf: cap });
                return;
            }

            let base = e.health;
            let max = this.maxHp(e, true);
            let target = base >= max - 0.05 ? base + cap : Math.min(base + cap, max * 0.75);
            if (target <= base) return;
            e.health = target;
            this.blockBuffers.push({ build: e, shield: s, base: base, pre: target });
        }, true);
    },

    pay(s, amount) {
        if (s == null || !s.isValid() || s.isShieldBroken()) return 0;
        let p = Math.min(amount, s.getShieldHp());
        if (p > 0) {
            s.damageShield(p);
            s._hitTimer = 25;
        }
        return p;
    },

    sync(b) {
        if (Vars.net.server()) {
            try { Call.tileDamage(b, b.health); } catch (err) {}
        }
    },

    settle() {
        if (Vars.net.client()) {
            this.buffers = [];
            this.blockBuffers = [];
            this.baseline = {};
            this.lines = [];
            return;
        }

        let recs = this.buffers;
        this.buffers = [];
        let excess = {};

        for (let i = 0; i < recs.length; i++) {
            let r = recs[i];
            let u = r.unit;
            if (u == null || !u.isValid() || u.dead) continue;

            let after = u.shield;
            let consumed = Math.max(0, r.base + r.buf - after);
            let fromBuf = Math.min(consumed, r.buf);
            u.shield = consumed > r.buf ? Math.max(0, after) : r.base;

            if (fromBuf > 0.001) {
                let paid = this.pay(r.shield, fromBuf);
                if (fromBuf - paid > 0.001) excess[u.id] = fromBuf - paid;
            }
        }

        let brecs = this.blockBuffers;
        this.blockBuffers = [];

        for (let i = 0; i < brecs.length; i++) {
            let r = brecs[i];
            let b = r.build;
            if (b == null || !b.isValid()) continue;

            let net = b.health - r.pre;
            if (net < 0) {
                let loss = -net;
                let paid = this.pay(r.shield, loss);
                b.health = r.base;
                let rest = loss - paid;
                if (rest > 0.001) {
                    let hp = r.base - rest;
                    if (hp > 0) {
                        b.health = hp;
                        this.sync(b);
                    } else {
                        b.health = 0;
                        b.kill();
                    }
                } else {
                    this.sync(b);
                }
            } else {
                b.health = r.base + net;
                if (net > 0) this.sync(b);
            }
        }

        let shields = this.active();
        this.lines = shields.length > 0 ? this.collectLines(shields) : [];

        let nextBase = {};

        this.visit((e, s, id, isB, phase) => {
            let prev = this.baseline[id];
            let cur = e.health;

            if (prev !== undefined && cur < prev - 0.01 && !s.isShieldBroken()) {
                if (phase == 0 || this.inCorridor(e.x, e.y, this.sizeOf(e, isB), s)) {
                    let paid = this.pay(s, prev - cur);
                    if (paid > 0.01) {
                        e.health = cur + paid;
                        if (isB) this.sync(e);
                    }
                }
            }

            if (!isB && excess[id] !== undefined) {
                e.damagePierce(excess[id]);
            }

            nextBase[id] = e.health;
        });

        this.baseline = nextBase;
    }
};

global.NexReflect = NexReflect;

Events.run(Trigger.update, () => {
    if (Core.graphics == null || !Vars.state.isGame() || Time.time % 30 > Time.delta) return;
    let fps = Core.graphics.getFramesPerSecond();
    if (fps < 25) {
        NexReflect.fpsLow++;
        NexReflect.fpsHigh = 0;
        if (NexReflect.fpsLow >= 2) NexReflect.hideFx = true;
    } else {
        NexReflect.fpsLow = 0;
        NexReflect.fpsHigh++;
        if (NexReflect.fpsHigh >= 3) NexReflect.hideFx = false;
    }
});

if (Trigger.beforeGameUpdate !== undefined && Trigger.afterGameUpdate !== undefined) {
    Events.run(Trigger.beforeGameUpdate, () => {
        try {
            NexReflect.applyBuffers();
        } catch (err) {
            Log.err("[NexReflect] " + err);
        }
    });

    Events.run(Trigger.afterGameUpdate, () => {
        try {
            NexReflect.settle();
        } catch (err) {
            Log.err("[NexReflect] " + err);
        }
    });
} else {
    Events.run(Trigger.update, () => {
        try {
            NexReflect.settle();
        } catch (err) {
            Log.err("[NexReflect] " + err);
        }
    });
}

const reflecounum = extend(Turret, "reflecounum", {
    size: 3,
    health: 23000,
    hasPower: true,
    hasItems: true,
    configurable: true,
    saveConfig: true,

    init() {
        this.super$init();
    }
});

reflecounum.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null) {
        let val = Number(value);
        if (val >= 10) {
            tile.setPerkTier(val - 10);
        } else {
            tile.setTier(val);
        }
    }
}));

reflecounum.buildType = () => extend(Turret.TurretBuild, reflecounum, {

    created() {
        this.super$created();
        this._tier = 0;
        this._perkTier = 0;
        this._maxShieldHp = 5000;
        this._shieldHp = 5000;
        this._absorbedDamage = 0;
        this._shieldBroken = false;
        this._cooldownTimer = 0;
        this._hitTimer = 0;

        this._perk1Timer = 0;
        this._perk2Timer = 0;
        this._rebuildTimer = 0;
        this._perk5Timer = 0;
        this._perk6Absorbed = 0;
        this._orbitingBullets = [];

        this.updateMaxShield();
        this._shieldHp = this._maxShieldHp;
        NexReflect.register(this);
        this._registered = true;
    },

    getMaxShieldHp() {
        if (this._maxShieldHp === undefined || isNaN(this._maxShieldHp) || this._maxShieldHp <= 0) {
            this.updateMaxShield();
        }
        return this._maxShieldHp || 5000;
    },

    getShieldHp() {
        if (this._shieldHp === undefined || isNaN(this._shieldHp)) {
            this._shieldHp = this.getMaxShieldHp();
        }
        return Math.max(0, this._shieldHp);
    },

    isShieldBroken() {
        return !!this._shieldBroken;
    },

    getTier() {
        return this._tier !== undefined ? this._tier : 0;
    },

    setTier(val) {
        this._tier = Number(val);
        this.updateMaxShield();
    },

    getPerkTier() {
        return this._perkTier !== undefined ? this._perkTier : 0;
    },

    setPerkTier(val) {
        this._perkTier = Number(val);
        this.updateMaxShield();
    },

    damageShield(amount) {
        if (this.isShieldBroken()) return;

        this._shieldHp = (this.getShieldHp()) - amount;
        this._absorbedDamage = (this._absorbedDamage || 0) + amount;

        if (this._shieldHp <= 0) {
            this._shieldHp = 0;
            this._shieldBroken = true;
            this._cooldownTimer = 0;
            Fx.shieldBreak.at(this.x, this.y, this.getShieldRadius(), reflectorColor);
        }
    },

    getShieldRadius() {
        let baseRadius = (reflecounum.size * Vars.tilesize) / 2 + 8;
        let perkMult = 3.0;
        let p = this.getPerkTier();

        if (p === 1) perkMult += 1.50;
        else if (p === 2) perkMult += 0.50;
        else if (p === 3) perkMult += 0.30;
        else if (p === 4) perkMult += 1.00;
        else if (p === 5) perkMult += 2.00;
        else if (p === 6) perkMult += 2.00;

        return baseRadius * perkMult;
    },

    updateMaxShield() {
        let t = this.getTier();
        let baseMax = 5000;
        if (t === 1) baseMax = 7500;
        else if (t === 2) baseMax = 15000;

        let perkMult = 1.0;
        let p = this.getPerkTier();
        if (p === 1) perkMult += 0.50;
        else if (p === 2) perkMult += 0.90;
        else if (p === 3) perkMult += 0.30;
        else if (p === 4) perkMult += 1.00;
        else if (p === 5) perkMult += 3.00;
        else if (p === 6) perkMult += 3.00;

        let oldMax = this._maxShieldHp || baseMax;
        this._maxShieldHp = baseMax * perkMult;

        if (this._shieldHp === undefined) {
            this._shieldHp = this._maxShieldHp;
        } else if (!this._shieldBroken) {
            this._shieldHp = Math.min(this._maxShieldHp, (this._shieldHp / oldMax) * this._maxShieldHp);
        }
    },

    getAbsorbRatio() {
        let t = this.getTier();
        if (t === 1) return 0.80;
        if (t === 2) return 0.40;
        return 0.50;
    },

    getReflectingChance() {
        let t = this.getTier();
        if (t === 1) return 0.75;
        if (t === 2) return 1.00;
        return 0.60;
    },

    updateTile() {
        this.super$updateTile();

        if (!this._registered) {
            NexReflect.register(this);
            this._registered = true;
        }

        if (this._hitTimer > 0) {
            this._hitTimer -= Time.delta;
        }

        if (this.isShieldBroken()) {
            this._shieldHp = 0;
            this._cooldownTimer += Time.delta;

            if (this._cooldownTimer >= 300) {
                this.updateMaxShield();
                this._shieldBroken = false;
                this._shieldHp = this.getMaxShieldHp();
                this._cooldownTimer = 0;
                Fx.shieldWave.at(this.x, this.y, this.getShieldRadius(), reflectorColor);
            }
            return;
        }

        let perk = this.getPerkTier();
        let currentRadius = this.getShieldRadius();

        if (perk === 1) {
            this._perk1Timer += Time.delta;
            if (this._perk1Timer >= 30) {
                this._perk1Timer = 0;
                Units.nearby(this.team, this.x, this.y, 200, cons(u => {
                    if (u != null && u.isValid()) {
                        u.heal(u.maxHealth * 0.10);
                        Fx.heal.at(u.x, u.y);
                    }
                }));
            }
        }

        if (perk === 2) {
            this._perk2Timer += Time.delta;
            if (this._perk2Timer >= 60) {
                this._perk2Timer = 0;
                Vars.indexer.eachBlock(this.team, this.x, this.y, 350, packBoolf(b => b.damaged()), cons(b => {
                    b.heal(b.maxHealth * 0.05);
                    Fx.healBlock.at(b.x, b.y);
                }));
            }

            if (this._rebuildTimer === undefined) this._rebuildTimer = 0;
            this._rebuildTimer += Time.delta;

            if (this._rebuildTimer >= 300) {
                let teamData = this.team.data();
                if (teamData != null && teamData.plans != null && teamData.plans.size > 0) {
                    let range = 350;
                    let rebuiltAny = false;

                    for (let i = teamData.plans.size - 1; i >= 0; i--) {
                        let plan = teamData.plans.get(i);

                        if (plan != null && plan.block != null) {
                            let wx = plan.x * Vars.tilesize;
                            let wy = plan.y * Vars.tilesize;

                            if (Mathf.within(this.x, this.y, wx, wy, range)) {
                                let tile = Vars.world.tile(plan.x, plan.y);

                                if (tile != null) {
                                    if (tile.block() === plan.block) {
                                        teamData.plans.remove(i);
                                        continue;
                                    }

                                    tile.setNet(plan.block, this.team, plan.rotation);

                                    Fx.chainLightning.at(this.x, this.y, 0, reflectorGlow, new Vec2(wx, wy));
                                    Fx.placeBlock.at(wx, wy, plan.block.size);

                                    teamData.plans.remove(i);
                                    rebuiltAny = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (rebuiltAny) {
                        this._rebuildTimer = 0;
                    }
                }
            }
        }

        if (perk === 5) {
            this._perk5Timer += Time.delta;
            if (this._perk5Timer >= 300) {
                this._perk5Timer = 0;
                Units.nearby(this.team, this.x, this.y, 500, cons(u => {
                    if (u != null && u.isValid()) {
                        u.heal(u.maxHealth * 0.10);
                        Fx.heal.at(u.x, u.y);
                    }
                }));

                Vars.indexer.eachBlock(this.team, this.x, this.y, 500, packBoolf(b => b.damaged()), cons(b => {
                    if (b != null && b.isValid()) {
                        b.heal(b.maxHealth * 0.10);
                        Fx.healBlock.at(b.x, b.y);
                    }
                }));
            }
        }

        if (!this.isShieldBroken() && Groups.bullet != null && Groups.bullet.size() > 0) {
            try {
                Groups.bullet.intersect(this.x - currentRadius, this.y - currentRadius, currentRadius * 2, currentRadius * 2, cons(b => {
                    if (this.isShieldBroken()) return;

                    if (b != null && b.team != this.team && b.type != null && Mathf.within(this.x, this.y, b.x, b.y, currentRadius)) {

                        this._hitTimer = 25;
                        let rawDamage = b.damage;
                        let absorbRatio = this.getAbsorbRatio();
                        let absorbed = rawDamage * absorbRatio;

                        this.damageShield(absorbed);

                        if (this.isShieldBroken()) return;

                        if (perk === 3 && (this._absorbedDamage || 0) >= 1000) {
                            shockwaveFx.at(this.x, this.y);
                            Units.nearbyEnemies(this.team, this.x, this.y, 200, cons(enemy => {
                                if (enemy != null && enemy.isValid()) enemy.damage(100);
                            }));
                            Units.nearby(this.team, this.x, this.y, 200, cons(ally => {
                                if (ally != null && ally.isValid()) ally.heal(100);
                            }));
                            Vars.indexer.eachBlock(this.team, this.x, this.y, 200, packBoolf(b => true), cons(build => {
                                if (build != null && build.isValid()) build.heal(100);
                            }));
                        }

                        if (perk === 6) {
                            this._perk6Absorbed = (this._perk6Absorbed || 0) + absorbed;
                            if (this._perk6Absorbed >= 100 && this._orbitingBullets.length < 8) {
                                this._orbitingBullets.push(true);
                                this._perk6Absorbed -= 100;
                            }

                            if ((this._absorbedDamage || 0) >= 1000 && this._orbitingBullets.length >= 8) {
                                let target = Units.bestTarget(this.team, this.x, this.y, 600, e => true, b => true, (unit, x, y) => -unit.maxHealth);
                                let targetX = target ? target.x : this.x + 100;
                                let targetY = target ? target.y : this.y + 100;

                                for (let i = 0; i < 8; i++) {
                                    let angle = (i / 8) * 360;
                                    let bx = this.x + Mathf.cosDeg(angle) * 20;
                                    let by = this.y + Mathf.sinDeg(angle) * 20;
                                    perk6Bullet.create(this, this.team, bx, by, Angles.angle(bx, by, targetX, targetY));
                                }
                                this._orbitingBullets = [];
                            }
                        }

                        if ((this._absorbedDamage || 0) >= 1000) {
                            this._absorbedDamage -= 1000;
                        }

                        if (Mathf.chance(this.getReflectingChance())) {
                            let oldX = b.x;
                            let oldY = b.y;
                            let oldRot = b.rotation();

                            if (perk === 4) {
                                b.remove();
                                let target = Units.closestEnemy(this.team, oldX, oldY, 300, e => true);
                                let targetAngle = target ? Angles.angle(oldX, oldY, target.x, target.y) : oldRot + 180;

                                perk4Bullet.damage = rawDamage;
                                perk4Bullet.create(this, this.team, oldX, oldY, targetAngle);
                            } else {
                                b.team = this.team;
                                b.rotation(oldRot + 180);
                                b.vel.trns(oldRot + 180, b.vel.len());
                            }

                            reflectEffect.at(oldX, oldY, oldRot);
                        } else {
                            b.remove();
                        }
                    }
                }));
            } catch (err) {
            }
        }
    },

    getOverlaps(r) {
        if (this._ovAt === undefined || Time.time - this._ovAt > 20 || Time.time < this._ovAt) {
            this._ovAt = Time.time;
            let out = [];
            let l = NexReflect.list;
            for (let i = 0; i < l.length; i++) {
                let o = l[i];
                if (o.id == this.id || !o.isValid() || o.team != this.team) continue;
                if (o.isShieldBroken() || o.getShieldHp() <= 0) continue;
                let orad = o.getShieldRadius();
                if (Mathf.dst(this.x, this.y, o.x, o.y) < r + orad) out.push({ x: o.x, y: o.y, r: orad });
            }
            this._ov = out;
        }
        return this._ov;
    },

    draw() {
        this.super$draw();

        let currentRadius = this.getShieldRadius();

        if (!this.isShieldBroken() && this.getShieldHp() > 0) {
            if (NexReflect.hideFx) return;
            if (global.PerfCore != null && !global.PerfCore.onScreen(this.x, this.y, currentRadius + 16)) return;

            let isHit = this._hitTimer > 0;
            let hitFactor = isHit ? (this._hitTimer / 25) : 0;
            let animated = Vars.renderer != null && Vars.renderer.animateShields;

            if (animated) {
                Draw.z(Layer.shields + 0.001 * hitFactor);
                Draw.color(reflectorColor, Color.white, hitFactor);
                Fill.poly(this.x, this.y, 6, currentRadius);
                Draw.z(Layer.shields + 2);
            } else {
                Draw.z(Layer.shields);

                let others = this.getOverlaps(currentRadius);

                let coreAlpha = 0.08 + (hitFactor * 0.25);
                Draw.color(isHit ? reflectorGlow : reflectorColor, coreAlpha);
                Fill.poly(this.x, this.y, 6, currentRadius);

                Lines.stroke(isHit ? 2.8 : 1.5);
                Draw.color(isHit ? Color.white : reflectorColor, 0.8 + (hitFactor * 0.2));
                if (others.length == 0) {
                    Lines.poly(this.x, this.y, 6, currentRadius);
                } else {
                    drawHexClipped(this.x, this.y, currentRadius, others);
                }

                Draw.color(reflectorGlow, 0.5 + (hitFactor * 0.5));
                Lines.stroke(1.0);
                if (others.length == 0) {
                    Lines.poly(this.x, this.y, 6, currentRadius - 3);
                } else {
                    drawHexClipped(this.x, this.y, currentRadius - 3, others);
                }
            }

            if (isHit) {
                Draw.color(reflectorGlow, hitFactor);
                Lines.stroke(1.2);

                let innerRad = currentRadius * 0.65;
                Lines.poly(this.x, this.y, 6, innerRad);

                for (let i = 0; i < 6; i++) {
                    let a1 = i * 60;
                    let a2 = (i + 1) * 60;
                    Lines.line(
                        this.x + Mathf.cosDeg(a1) * innerRad,
                        this.y + Mathf.sinDeg(a1) * innerRad,
                        this.x + Mathf.cosDeg(a2) * currentRadius,
                        this.y + Mathf.sinDeg(a2) * currentRadius
                    );
                }
            }

            if (this.getPerkTier() === 6 && this._orbitingBullets.length > 0) {
                Draw.color(reflectorGlow);
                for (let i = 0; i < this._orbitingBullets.length; i++) {
                    let angle = (i / 8) * 360 + Time.time * 2;
                    let bx = this.x + Mathf.cosDeg(angle) * 20;
                    let by = this.y + Mathf.sinDeg(angle) * 20;
                    Fill.circle(bx, by, 3.5);
                }
            }

            Draw.reset();
        }
    },

    buildConfiguration(table) {
        table.clear(); table.row();
        let tier = this.getTier();

        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialogTitle = isEn() ? "Reflecounum Turret Upgrade Center" : "Trung tâm nâng cấp pháo Reflecounum";
            let dialog = extend(BaseDialog, dialogTitle, {});

            let reqSnapshot = (() => {
                let core = this.team.core();
                if (core == null) return isEn() ? "[red]Team Core Not Found![]" : "[red]Không tìm thấy Lõi Đội![]";

                let currentCopper = core.items.get(Items.copper);
                let currentLead = core.items.get(Items.lead);
                let currentTitanium = core.items.get(Items.titanium);
                let currentSilicon = core.items.get(Items.silicon);
                let currentThorium = core.items.get(Items.thorium);
                let currentPlastanium = core.items.get(Items.plastanium);
                let currentSurge = core.items.get(Items.surgeAlloy);

                let copCol = currentCopper >= reqSpecial.copper ? "[green]" : "[red]";
                let leaCol = currentLead >= reqSpecial.lead ? "[green]" : "[red]";
                let silColSp = currentSilicon >= reqSpecial.silicon ? "[green]" : "[red]";

                let titColor1 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
                let thoColor1 = currentThorium >= reqMK2.thorium ? "[green]" : "[red]";

                let titColor2 = currentTitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                let silColor2 = currentSilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                let plaColor2 = currentPlastanium >= reqMK2B.plastanium ? "[green]" : "[red]";
                let surColor2 = currentSurge >= reqMK2B.surgeAlloy ? "[green]" : "[red]";

                if (isEn()) {
                    return "[gold]CORE RESOURCE REQUIREMENTS:[]\n" +
                           "[orange]★ SPECIAL PERK:[] Copper: " + copCol + currentCopper + "[]/4000 | Lead: " + leaCol + currentLead + "[]/4000 | Silicon: " + silColSp + currentSilicon + "[]/4000\n" +
                           "[cyan]MK2 Branch:[] Titanium: " + titColor1 + currentTitanium + "[]/" + reqMK2.titanium + " | Silicon: " + silColor1 + currentSilicon + "[]/" + reqMK2.silicon + " | Thorium: " + thoColor1 + currentThorium + "[]/" + reqMK2.thorium + "\n" +
                           "[purple]MK2B Branch:[] Titanium: " + titColor2 + currentTitanium + "[]/" + reqMK2B.titanium + " | Silicon: " + silColor2 + currentSilicon + "[]/" + reqMK2B.silicon + " | Plastanium: " + plaColor2 + currentPlastanium + "[]/" + reqMK2B.plastanium + " | Surge: " + surColor2 + currentSurge + "[]/" + reqMK2B.surgeAlloy;
                }

                return "[gold]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                       "[orange]★ PHÚC LỢI ĐẶC BIỆT:[] Đồng: " + copCol + currentCopper + "[]/4000 | Chì: " + leaCol + currentLead + "[]/4000 | Silicon: " + silColSp + currentSilicon + "[]/4000\n" +
                       "[cyan]Nhánh MK2:[] Titan: " + titColor1 + currentTitanium + "[]/" + reqMK2.titanium + " | Silicon: " + silColor1 + currentSilicon + "[]/" + reqMK2.silicon + " | Thorium: " + thoColor1 + currentThorium + "[]/" + reqMK2.thorium + "\n" +
                       "[purple]Nhánh MK2B:[] Titan: " + titColor2 + currentTitanium + "[]/" + reqMK2B.titanium + " | Silicon: " + silColor2 + currentSilicon + "[]/" + reqMK2B.silicon + " | Nhựa: " + plaColor2 + currentPlastanium + "[]/" + reqMK2B.plastanium + " | Surge: " + surColor2 + currentSurge + "[]/" + reqMK2B.surgeAlloy;
            })();
            let reqCell = dialog.cont.add(reqSnapshot.toString());

            reqCell.width(380).get().setWrap(true);
            reqCell.get().setAlignment(Align.left);
            dialog.cont.row(); dialog.cont.add().height(10).row();

            let branchesTable = new Table();

            let spBox = new Table();
            spBox.background(Styles.black6);
            spBox.margin(12);
            spBox.add(isEn() ? "[gold]★ SPECIAL UPGRADE PERKS (RANDOM) ★[]" : "[gold]★ PHÚC LỢI NÂNG CẤP ĐẶC BIỆT (NGẪU NHIÊN) ★[]").row();

            let currentPerk = this.getPerkTier();

            if (currentPerk == 0) {
                let spDText = isEn() ?
                    "Activate random protocol to obtain 1 of 6 permanent perks:\n" +
                    " • [yellow]Perk 1 (~19.6%):[] Shield radius +150%, Shield HP +50%, Heal 10% HP/0.5s for Units within 200px.\n" +
                    " • [orange]Perk 2 (~29.4%):[] Shield radius +50%, Shield HP +90%, Auto rebuild walls & turrets within 350px (every 5s).\n" +
                    " • [cyan]Perk 3 (~19.6%):[] Shield radius +30%, Shield HP +30%, Store 1000 Dmg to release 100 Dmg shockwave (200px) & heal allies 100 HP.\n" +
                    " • [purple]Perk 4 (~29.4%):[] Shield radius +100%, Shield HP +100%, Reflected bullets gain Homing & Pierce 4.\n" +
                    " • [green]Perk 5 (1% ULTRA RARE):[] Shield radius +200%, Shield HP +300%, Heal 10% HP/5s within 500px, Share 50% ally damage to shield.\n" +
                    " • [red]Perk 6 (1% ULTRA RARE):[] Shield radius +200%, Shield HP +300%, Store 100 Dmg to spawn orbiting energy, 1000 Dmg fires 8 piercing bullets at highest HP target!" :
                    "Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 6 phúc lợi vĩnh viễn:\n" +
                    " • [yellow]Phúc lợi 1 (~19.6%):[] Bán kính khiên +150%, HP khiên +50%, Hồi 10% HP/0.5s cho Unit trong 200px.\n" +
                    " • [orange]Phúc lợi 2 (~29.4%):[] Bán kính khiên +50%, HP khiên +90%, Tự động xây lại tường & pháo bị nổ trong 350px (mỗi 5s).\n" +
                    " • [cyan]Phúc lợi 3 (~19.6%):[] Bán kính khiên +30%, HP khiên +30%, Tích 1000 Dmg nổ sóng âm 100 Dmg (200px) & hồi 100 HP cho đồng minh.\n" +
                    " • [purple]Phúc lợi 4 (~29.4%):[] Bán kính khiên +100%, HP khiên +100%, Đạn phản có Truy đuổi & Xuyên thấu 4.\n" +
                    " • [green]Phúc lợi 5 (1% SIÊU HIẾM):[] Bán kính khiên +200%, HP khiên +300%, Hồi 10% HP/5s trong 500px, Chia sẻ 50% Dmg từ đồng minh vào khiên.\n" +
                    " • [red]Phúc lợi 6 (1% SIÊU HIẾM):[] Bán kính khiên +200%, HP khiên +300%, Tích 100 Dmg đẻ 1 đạn năng lượng quanh pháo, Đủ 1000 Dmg bắn 8 đạn xé gió mục tiêu HP cao nhất!";

                let spD = spBox.add(spDText);
                spD.width(360).get().setWrap(true);
                spD.get().setAlignment(Align.left);
                spBox.row();

                let rollBtnText = isEn() ? "[gold]ROLL PERK (4K Copper/Lead/Silicon)[]" : "[gold]QUAY PHÚC LỢI (4K Đồng/Chì/Silicon)[]";
                spBox.button(rollBtnText, packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.copper) >= 4000 && core.items.get(Items.lead) >= 4000 && core.items.get(Items.silicon) >= 4000) {
                        NexNet.take(core, Items.copper, 4000);
                        NexNet.take(core, Items.lead, 4000);
                        NexNet.take(core, Items.silicon, 4000);

                        let rand = Mathf.random(100);
                        let resultPerk = 3;

                        if (rand < 1.0) {
                            resultPerk = 5;
                        } else if (rand < 2.0) {
                            resultPerk = 6;
                        } else if (rand < 2.0 + 19.6) {
                            resultPerk = 1;
                        } else if (rand < 2.0 + 19.6 + 29.4) {
                            resultPerk = 2;
                        } else if (rand < 2.0 + 19.6 + 29.4 + 19.6) {
                            resultPerk = 3;
                        } else {
                            resultPerk = 4;
                        }

                        this.setPerkTier(resultPerk);
                        this.configure(java.lang.Integer(10 + resultPerk));

                        NexNet.fx(Fx.upgradeCore, this.x, this.y);
                        NexNet.shake(6, 6, this.x, this.y);

                        let perkName = "";
                        if (isEn()) {
                            if (resultPerk == 1) perkName = "[yellow]PERK 1[]";
                            else if (resultPerk == 2) perkName = "[orange]PERK 2[]";
                            else if (resultPerk == 3) perkName = "[cyan]PERK 3[]";
                            else if (resultPerk == 4) perkName = "[purple]PERK 4[]";
                            else if (resultPerk == 5) perkName = "[green]★ PERK 5 (1% ULTRA RARE) ★[]";
                            else perkName = "[red]★ PERK 6 (1% ULTRA RARE) ★[]";
                            Vars.ui.showInfo("[gold]YOU OBTAINED:[]\n" + perkName);
                        } else {
                            if (resultPerk == 1) perkName = "[yellow]PHÚC LỢI 1[]";
                            else if (resultPerk == 2) perkName = "[orange]PHÚC LỢI 2[]";
                            else if (resultPerk == 3) perkName = "[cyan]PHÚC LỢI 3[]";
                            else if (resultPerk == 4) perkName = "[purple]PHÚC LỢI 4[]";
                            else if (resultPerk == 5) perkName = "[green]★ PHÚC LỢI 5 (1% SIÊU HIẾM) ★[]";
                            else perkName = "[red]★ PHÚC LỢI 6 (1% SIÊU HIẾM) ★[]";
                            Vars.ui.showInfo("[gold]BẠN ĐÃ TRÚNG:[]\n" + perkName);
                        }

                        dialog.hide();
                        this.deselect();
                    } else {
                        Vars.ui.showInfo(isEn() ? "[red]Not enough resources for Special Perk![]" : "[red]Không đủ tài nguyên cho Phúc Lợi Đặc Biệt![]");
                    }
                })).size(300, 40);
            } else {
                let perkText = "";
                if (isEn()) {
                    if (currentPerk == 1) perkText = "[yellow]✔ ACTIVATED: PERK 1\n• Shield radius +150%\n• Shield HP +50%\n• Heal 10% HP/0.5s for ally Units in 200px[]";
                    if (currentPerk == 2) perkText = "[orange]✔ ACTIVATED: PERK 2\n• Shield radius +50%\n• Shield HP +90%\n• Auto rebuild destroyed walls & turrets in 350px (every 5s)[]";
                    if (currentPerk == 3) perkText = "[cyan]✔ ACTIVATED: PERK 3\n• Shield radius +30%\n• Shield HP +30%\n• Store 1000 Dmg to release 100 Dmg shockwave (200px) & heal allies 100 HP[]";
                    if (currentPerk == 4) perkText = "[purple]✔ ACTIVATED: PERK 4\n• Shield radius +100%\n• Shield HP +100%\n• Reflected bullets gain Homing & Pierce 4[]";
                    if (currentPerk == 5) perkText = "[green]✔ ACTIVATED: PERK 5 (1% ULTRA RARE)\n• Shield radius +200%\n• Shield HP +300%\n• Heal 10% HP/5s for Units & Structures in 500px\n• Share 50% ally damage taken in 250px[]";
                    if (currentPerk == 6) perkText = "[red]✔ ACTIVATED: PERK 6 (1% ULTRA RARE)\n• Shield radius +200%\n• Shield HP +300%\n• Store 1000 Dmg to fire 8 piercing energy bullets (Pierce 20, Splash Dmg 20px) at highest HP target![]";
                } else {
                    if (currentPerk == 1) perkText = "[yellow]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1\n• Bán kính khiên +150%\n• Độ bền khiên +50%\n• Hồi 10% HP/0.5s cho Unit đồng minh trong 200px[]";
                    if (currentPerk == 2) perkText = "[orange]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2\n• Bán kính khiên +50%\n• Độ bền khiên +90%\n• Tự động xây lại tường & pháo bị hủy hoàn toàn trong 350px (mỗi 5s)[]";
                    if (currentPerk == 3) perkText = "[cyan]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3\n• Bán kính khiên +30%\n• Độ bền khiên +30%\n• Tích 1000 Dmg nổ sóng âm 100 Dmg (200px) & hồi 100 HP cho đồng minh[]";
                    if (currentPerk == 4) perkText = "[purple]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 4\n• Bán kính khiên +100%\n• Độ bền khiên +100%\n• Đạn phản ngược có Truy đuổi & Xuyên thấu 4[]";
                    if (currentPerk == 5) perkText = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 5 (1% SIÊU HIẾM)\n• Bán kính khiên +200%\n• Độ bền khiên +300%\n• Hồi 10% HP/5s cho Unit & Công trình trong 500px\n• Chia sẻ 50% Dmg nhận vào từ đồng minh trong 250px[]";
                    if (currentPerk == 6) perkText = "[red]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 6 (1% SIÊU HIẾM)\n• Bán kính khiên +200%\n• Độ bền khiên +300%\n• Đủ 1000 Dmg hấp thụ bắn 8 đạn năng lượng xé gió (Xuyên 20, Splash Dmg 20px) vào mục tiêu HP cao nhất![]";
                }

                let spD = spBox.add(perkText);
                spD.width(360).get().setWrap(true);
                spD.get().setAlignment(Align.left);
            }

            branchesTable.add(spBox).width(360);
            branchesTable.row();
            branchesTable.add().height(12).row();

            if (tier == 0) {
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add(isEn() ? "[cyan]===(MK2 - SHIELD DEFENDER)===[]" : "[cyan]===(MK2 - TRỐNG THỦ KHIÊN)===[]").row();

                let b1DText = isEn() ?
                    "[white]• Shield Dmg Absorb: [green]80%[] (+30%)\n" +
                    "• Base Shield HP: [green]7,500 HP[] (+50%)\n" +
                    "• Reflection Chance: [yellow]75%[] (+15%)\n" +
                    "• Shield Cooldown: [white]5.0 seconds[]" :
                    "[white]• Hấp thụ sát thương khiên: [green]80%[] (+30%)\n" +
                    "• Độ bền khiên gốc: [green]7,500 HP[] (+50%)\n" +
                    "• Tỷ lệ phản ngược đạn: [yellow]75%[] (+15%)\n" +
                    "• Thời gian hồi khi khiên vỡ: [white]5.0 giây[]";

                let b1D = b1.add(b1DText);
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();

                let b1Btn = isEn() ? "[green]ACTIVATE MK2[]" : "[green]KÍCH HOẠT MK2[]";
                b1.button(b1Btn, packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon && core.items.get(Items.thorium) >= reqMK2.thorium) {
                        NexNet.take(core, Items.titanium, reqMK2.titanium);
                        NexNet.take(core, Items.silicon, reqMK2.silicon);
                        NexNet.take(core, Items.thorium, reqMK2.thorium);

                        NexNet.fx(Fx.upgradeCore, this.x, this.y); NexNet.fx(Fx.shieldWave, this.x, this.y, this.getShieldRadius(), reflectorColor); NexNet.shake(4, 4, this.x, this.y);
                        this.setTier(1);
                        this.configure(java.lang.Integer(1));
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo(isEn() ? "[red]Not enough resources for MK2 branch![]" : "[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add(isEn() ? "[purple]===(MK2B - ABSOLUTE REFLECTION)===[]" : "[purple]===(MK2B - PHẢN XẠ TUYỆT ĐỐI)===[]").row();

                let b2DText = isEn() ?
                    "[white]• Shield Dmg Absorb: [red]40%[] (-10%)\n" +
                    "• Base Shield HP: [green]15,000 HP[] (+200%)\n" +
                    "• Reflection Chance: [gold]100% ABSOLUTE[]\n" +
                    "• Shield Cooldown: [green]2.0 seconds[] (Super Fast)" :
                    "[white]• Hấp thụ sát thương khiên: [red]40%[] (-10%)\n" +
                    "• Độ bền khiên gốc: [green]15,000 HP[] (+200%)\n" +
                    "• Tỷ lệ phản ngược đạn: [gold]100% TUYỆT ĐỐI[]\n" +
                    "• Thời gian hồi khi khiên vỡ: [green]2.0 giây[] (Siêu tốc)";

                let b2D = b2.add(b2DText);
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();

                let b2Btn = isEn() ? "[orange]ACTIVATE MK2B[]" : "[orange]KÍCH HOẠT MK2B[]";
                b2.button(b2Btn, packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium && core.items.get(Items.surgeAlloy) >= reqMK2B.surgeAlloy) {
                        NexNet.take(core, Items.titanium, reqMK2B.titanium);
                        NexNet.take(core, Items.silicon, reqMK2B.silicon);
                        NexNet.take(core, Items.plastanium, reqMK2B.plastanium);
                        NexNet.take(core, Items.surgeAlloy, reqMK2B.surgeAlloy);

                        NexNet.fx(Fx.bigShockwave, this.x, this.y); NexNet.fx(Fx.shieldWave, this.x, this.y, this.getShieldRadius(), reflectorColor); NexNet.shake(4, 4, this.x, this.y);
                        this.setTier(2);
                        this.configure(java.lang.Integer(2));
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo(isEn() ? "[red]Not enough resources for MK2B branch![]" : "[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);
            } else {
                let statusLabel = "";
                if (isEn()) {
                    statusLabel = (tier == 1) ? "[cyan]UPGRADED TO MK2 TURRET[]" : "[purple]UPGRADED TO MK2B TURRET[]";
                } else {
                    statusLabel = (tier == 1) ? "[cyan]ĐÃ NÂNG CẤP THÀNH PHÁO MK2[]" : "[purple]ĐÃ NÂNG CẤP THÀNH PHÁO MK2B[]";
                }
                branchesTable.add(statusLabel).row();
            }

            let scroll = new ScrollPane(branchesTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip(packProv(() => isEn() ? "Upgrade Reflecounum System" : "Nâng cấp hệ thống Reflecounum"));

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = isEn() ? " Reflecounum Turret Stats " : " Thông số pháo Reflecounum ";
            let descStr = "";
            let currentTier = this.getTier();

            if (isEn()) {
                if (currentTier == 0) descStr = "[gold]⚡ BASE STATS (MK1) ⚡[]\n• Shield HP: 5,000 HP | Absorb Rate: 50%\n• Reflect Chance: 60% | Recharge Cooldown: 5.0s";
                else if (currentTier == 1) descStr = "[cyan]⚡ BASE STATS (MK2) ⚡[]\n• Shield HP: 7,500 HP | Absorb Rate: 80%\n• Reflect Chance: 75% | Recharge Cooldown: 5.0s";
                else if (currentTier == 2) descStr = "[purple]⚡ BASE STATS (MK2B) ⚡[]\n• Shield HP: 15,000 HP | Absorb Rate: 40%\n• Reflect Chance: 100% ABSOLUTE | Recharge Cooldown: 2.0s";

                let perk = this.getPerkTier();
                if (perk > 0) {
                    descStr += "\n\n[gold]★ ACTIVATED SPECIAL PERK ★[]";
                    if (perk == 1) descStr += "\n[yellow]• Perk 1: Shield radius +150%, Shield HP +50%, Heal 10% HP/0.5s for Units in 200px.[]";
                    if (perk == 2) descStr += "\n[orange]• Perk 2: Shield radius +50%, Shield HP +90%, Auto rebuild walls & turrets in 350px (every 5s).[]";
                    if (perk == 3) descStr += "\n[cyan]• Perk 3: Shield radius +30%, Shield HP +30%, Store 1000 Dmg shockwave 100 Dmg & heal 100 HP to allies.[]";
                    if (perk == 4) descStr += "\n[purple]• Perk 4: Shield radius +100%, Shield HP +100%, Reflected bullets gain Homing & Pierce 4.[]";
                    if (perk == 5) descStr += "\n[green]• Perk 5 (1%): Shield radius +200%, Shield HP +300%, Heal 10% HP/5s in 500px, Share 50% ally Dmg to shield.[]";
                    if (perk == 6) descStr += "\n[red]• Perk 6 (1%): Shield radius +200%, Shield HP +300%, Store 1000 Dmg to fire 8 piercing bullets at highest HP target.[]";
                }
            } else {
                if (currentTier == 0) descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n• Độ bền khiên: 5,000 HP | Tỷ lệ hấp thụ: 50%\n• Tỷ lệ phản đạn: 60% | Tái nạp khi vỡ: 5.0s";
                else if (currentTier == 1) descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n• Độ bền khiên: 7,500 HP | Tỷ lệ hấp thụ: 80%\n• Tỷ lệ phản đạn: 75% | Tái nạp khi vỡ: 5.0s";
                else if (currentTier == 2) descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n• Độ bền khiên: 15,000 HP | Tỷ lệ hấp thụ: 40%\n• Tỷ lệ phản đạn: 100% TUYỆT ĐỐI | Tái nạp khi vỡ: 2.0s";

                let perk = this.getPerkTier();
                if (perk > 0) {
                    descStr += "\n\n[gold]★ ĐÃ KÍCH HOẠT PHÚC LỢI ĐẶC BIỆT ★[]";
                    if (perk == 1) descStr += "\n[yellow]• Phúc lợi 1: Bán kính khiên +150%, HP khiên +50%, Hồi 10% HP/0.5s cho Unit trong 200px.[]";
                    if (perk == 2) descStr += "\n[orange]• Phúc lợi 2: Bán kính khiên +50%, HP khiên +90%, Tự động xây lại tường & pháo bị hủy hoàn toàn trong 350px (mỗi 5s).[]";
                    if (perk == 3) descStr += "\n[cyan]• Phúc lợi 3: Bán kính khiên +30%, HP khiên +30%, Tích 1000 Dmg nổ sóng âm 100 Dmg & hồi 100 HP cho đồng minh.[]";
                    if (perk == 4) descStr += "\n[purple]• Phúc lợi 4: Bán kính khiên +100%, HP khiên +100%, Đạn phản ngược có Truy đuổi & Xuyên 4.[]";
                    if (perk == 5) descStr += "\n[green]• Phúc lợi 5 (1%): Bán kính khiên +200%, HP khiên +300%, Hồi 10% HP/5s trong 500px, Chia sẻ 50% Dmg từ đồng minh vào khiên.[]";
                    if (perk == 6) descStr += "\n[red]• Phúc lợi 6 (1%): Bán kính khiên +200%, HP khiên +300%, Tích 1000 Dmg bắn 8 đạn xé gió mục tiêu HP cao nhất.[]";
                }
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip(packProv(() => isEn() ? "View Detailed Turret Stats" : "Xem thông số chi tiết pháo"));
    },

    write(write) {
        this.super$write(write);
        write.b(this.getTier());
        write.b(this.getPerkTier());
        write.f(this.getShieldHp());
        write.f(this._absorbedDamage !== undefined ? this._absorbedDamage : 0);
        write.bool(this.isShieldBroken());
    },

    read(read, revision) {
        this.super$read(read, revision);
        this.setTier(read.b());
        if (revision >= 1) {
            this.setPerkTier(read.b());
        } else {
            this._perkTier = 0;
        }
        this._shieldHp = read.f();
        this._absorbedDamage = read.f();
        this._shieldBroken = read.bool();

        this.updateMaxShield();
        if (isNaN(this._shieldHp)) this._shieldHp = this.getMaxShieldHp();
    }
});

reflecounum.addBar("shield", packFunc(e => {
    return new Bar(
        packProv(() => {
            let labelText = isEn() ? "Shield: " : "Khiên: ";
            let brokenText = isEn() ? "Shield: [BROKEN]" : "Khiên: [ĐÃ VỠ]";

            if (!e) return labelText + "0 / 0";
            if (e.isShieldBroken()) return brokenText;

            let cur = Math.floor(e.getShieldHp());
            let max = Math.floor(e.getMaxShieldHp());

            return labelText + cur + " / " + max;
        }),
        packProv(() => (e && e.isShieldBroken()) ? Color.gray : reflectorColor),
        packFloatp(() => {
            if (!e || e.isShieldBroken()) return 0.0;
            let cur = e.getShieldHp();
            let max = e.getMaxShieldHp();
            if (max <= 0) return 0.0;

            return Math.max(0.0, Math.min(1.0, cur / max));
        })
    );
}));

Events.on(UnitDamageEvent, cons(e => {
    let unit = e.unit;
    if (unit == null || !unit.isValid()) return;

    let range = 250;
    Vars.indexer.eachBlock(unit.team, unit.x, unit.y, range, packBoolf(b => true), cons(build => {
        if (build != null && build.isValid()) {
            if (typeof build.damageShield === "function" && typeof build.getPerkTier === "function" && typeof build.isShieldBroken === "function") {
                if (build.getPerkTier() === 5 && !build.isShieldBroken()) {
                    let sharedDmg = e.amount * 0.50;
                    build.damageShield(sharedDmg);
                }
            }
        }
    }));
}));