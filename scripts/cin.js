const CRIT_CHANCE = 0.5;
const CRIT_MULTIPLIER = 1.8;

const HIT_RAGE_CHANCE = 0.5;
const RAGE_STEP = 0.01;
const RAGE_MAX = 100;
const POINTS_PER_HIT = 1;
const POINTS_NEEDED = 100;

const BLAST_RADIUS = 25 * Vars.tilesize;
const BLAST_DAMAGE = 1500;
const BLAST_HEAL = 0.1;
const ABSORB_RADIUS = 10 * Vars.tilesize;
const ABSORB_HEALTH = 0.1;
const ABSORB_TIME = 60;
const ABSORB_SCAN = 15;
const ABSORB_LEASH = 1.3;

const MAX_PER_TEAM = 1;

const BURST_CHANCE = 0.2;
const BURST_BULLETS = 10;
const BURST_SPREAD = 4;
const BURST_COOLDOWN = 20;
const FRENZY_TIME = 180;
const FRENZY_RELOAD = 6;

const BEAM_CHANCE = 0.2;
const BEAM_FORWARD = 4 * Vars.tilesize;
const BEAM_DAMAGE = 2400 + 112 * 1.71 * 3;
const BEAM_RADIUS = 40;
const BEAM_TIME = 12;
const BEAM_COOLDOWN = 30;
const BEAM_MIN_RANGE = 260;
const BEAM_HITS_AIR = true;

const beamColor = Color.valueOf("33ff55");
const blastColor = Color.valueOf("ffaa00");
const linkColor = Color.valueOf("ff4d6d");

const states = new IntMap();

const beamFx = new Effect(BEAM_TIME, 900, e => {
    let target = e.data;
    if(target == null) return;
    let f = e.fout();
    Draw.color(beamColor);
    Lines.stroke(16 * f);
    Lines.line(e.x, e.y, target.x, target.y);
    Fill.circle(e.x, e.y, 9 * f);
    Draw.color(Color.white);
    Lines.stroke(5 * f);
    Lines.line(e.x, e.y, target.x, target.y);
    Fill.circle(e.x, e.y, 4 * f);
    Draw.reset();
});

const blastFx = new Effect(30, BLAST_RADIUS * 2.5, e => {
    Draw.color(blastColor, Color.white, e.fout());
    Lines.stroke(e.fout() * 6 + 0.5);
    Lines.circle(e.x, e.y, e.finpow() * BLAST_RADIUS);
    Draw.reset();
});

const linkFx = new Effect(3, 400, e => {
    let t = e.data;
    if(t == null || t.dead) return;
    let p = e.rotation;
    let f = e.fout();
    let angle = Angles.angle(t.x, t.y, e.x, e.y);

    Draw.color(linkColor, Color.white, p);
    Lines.stroke((1 + 3 * p) * f);
    Lines.line(e.x, e.y, t.x, t.y);
    Lines.stroke((0.8 + 1.5 * p) * f);
    Lines.circle(t.x, t.y, t.hitSize * (1.3 - 0.7 * p));

    Draw.color(linkColor);
    Fill.circle(e.x, e.y, (4 + 10 * p) * f);

    for(let i = 0; i < 6; i++){
        let k = (Time.time * 0.03 * (1 + p * 2) + i / 6) % 1;
        let side = Mathf.sin(k * 12 + i) * 6 * (1 - k);
        let px = Mathf.lerp(t.x, e.x, k) + Angles.trnsx(angle + 90, side);
        let py = Mathf.lerp(t.y, e.y, k) + Angles.trnsy(angle + 90, side);
        Draw.color(Color.white, linkColor, k);
        Fill.circle(px, py, (1 + 2 * (1 - k)) * f);
    }
    Draw.reset();
});

const frenzyStatus = new StatusEffect("cin-frenzy");
frenzyStatus.reloadMultiplier = FRENZY_RELOAD;
frenzyStatus.show = false;

const coreStatus = extend(StatusEffect, "cin-core", {
    update(unit, time){
        this.super$update(unit, time);
        let s = states.get(unit.id);
        let m = s == null ? 1 : 1 + s.rage * RAGE_STEP;
        if(Mathf.chance(CRIT_CHANCE)) m *= CRIT_MULTIPLIER;
        unit.damageMultiplier *= m;
    }
});
coreStatus.permanent = true;
coreStatus.show = false;

function createState(unit){
    let reloads = [];
    for(let i = 0; i < unit.mounts.length; i++){
        reloads.push(unit.mounts[i].reload);
    }
    return {
        hp: unit.health,
        rage: 0,
        points: 0,
        reloads: reloads,
        burstReady: 0,
        beamReady: 0,
        absorbTarget: null,
        absorbTimer: 0,
        scanTimer: ABSORB_SCAN
    };
}

function blast(unit, s){
    let x = unit.x;
    let y = unit.y;
    let team = unit.team;
    let bonus = 1 + s.rage * RAGE_STEP;

    let damage = BLAST_DAMAGE * bonus;
    Units.nearbyEnemies(team, x - BLAST_RADIUS, y - BLAST_RADIUS, BLAST_RADIUS * 2, BLAST_RADIUS * 2, u => {
        if(!u.dead && Mathf.dst(x, y, u.x, u.y) <= BLAST_RADIUS){
            u.damage(damage);
        }
    });

    unit.heal(unit.maxHealth * BLAST_HEAL);

    blastFx.at(x, y);
    Fx.massiveExplosion.at(x, y);
    Effect.shake(10, 20, x, y);
}

const isReign = u => !u.dead && u.type == UnitTypes.reign;

function absorbDone(unit, target){
    let gain = unit.type.health * ABSORB_HEALTH;
    unit.maxHealth += gain;
    unit.heal(gain);
    Fx.massiveExplosion.at(target.x, target.y);
    Fx.hitLancer.at(unit.x, unit.y, linkColor);
    target.kill();
}

function trackAbsorb(unit, s){
    let target = s.absorbTarget;
    if(target != null){
        if(target.dead || !target.isValid() || Mathf.dst(unit.x, unit.y, target.x, target.y) > ABSORB_RADIUS * ABSORB_LEASH){
            s.absorbTarget = null;
            s.absorbTimer = 0;
            return;
        }
        s.absorbTimer += Time.delta;
        let progress = Math.min(s.absorbTimer / ABSORB_TIME, 1);
        linkFx.at(unit.x, unit.y, progress, linkColor, target);
        if(s.absorbTimer >= ABSORB_TIME){
            absorbDone(unit, target);
            s.absorbTarget = null;
            s.absorbTimer = 0;
            s.scanTimer = ABSORB_SCAN;
        }
        return;
    }

    s.scanTimer += Time.delta;
    if(s.scanTimer < ABSORB_SCAN) return;
    s.scanTimer = 0;
    let found = Units.closest(unit.team, unit.x, unit.y, ABSORB_RADIUS, isReign);
    if(found != null){
        s.absorbTarget = found;
        s.absorbTimer = 0;
    }
}

function trackDamage(unit, s){
    let hp = unit.health;
    if(hp < s.hp - 0.01){
        if(Mathf.chance(HIT_RAGE_CHANCE)){
            if(s.rage < RAGE_MAX) s.rage++;
        }else{
            s.points += POINTS_PER_HIT;
            if(s.points >= POINTS_NEEDED){
                s.points -= POINTS_NEEDED;
                blast(unit, s);
            }
        }
    }
    s.hp = unit.health;
}

function fireBurst(unit, mount){
    let weapon = mount.weapon;
    let bullet = weapon.bullet;
    let base = unit.rotation - 90;
    let mx = unit.x + Angles.trnsx(base, weapon.x, weapon.y);
    let my = unit.y + Angles.trnsy(base, weapon.x, weapon.y);
    let wr = base + (weapon.rotate ? mount.rotation : weapon.baseRotation);
    let bx = mx + Angles.trnsx(wr, weapon.shootX, weapon.shootY);
    let by = my + Angles.trnsy(wr, weapon.shootX, weapon.shootY);
    let angle = weapon.rotate ? wr + 90 : Angles.angle(bx, by, mount.aimX, mount.aimY) + (unit.rotation - unit.angleTo(mount.aimX, mount.aimY));
    let half = (BURST_BULLETS - 1) / 2;
    for(let i = 0; i < BURST_BULLETS; i++){
        bullet.create(unit, unit.team, bx, by, angle + (i - half) * BURST_SPREAD);
    }
}

function fireBeam(unit, s){
    let ox = unit.x + Angles.trnsx(unit.rotation, BEAM_FORWARD);
    let oy = unit.y + Angles.trnsy(unit.rotation, BEAM_FORWARD);
    let team = unit.team;
    let range = Math.max(unit.type.range, BEAM_MIN_RANGE);

    let target = Units.closestTarget(team, ox, oy, range, u => !u.dead && (BEAM_HITS_AIR || !u.isFlying()), b => true);
    if(target == null) return false;

    let tx = target.x;
    let ty = target.y;
    let damage = BEAM_DAMAGE * (1 + s.rage * RAGE_STEP) * (Mathf.chance(CRIT_CHANCE) ? CRIT_MULTIPLIER : 1);

    beamFx.at(ox, oy, 0, beamColor, new Vec2(tx, ty));
    Fx.hitLancer.at(ox, oy, beamColor);
    Fx.scatheExplosion.at(tx, ty);
    Effect.shake(6, 6, tx, ty);

    target.damage(damage);
    Units.nearbyEnemies(team, tx - BEAM_RADIUS, ty - BEAM_RADIUS, BEAM_RADIUS * 2, BEAM_RADIUS * 2, u => {
        if(u != target && !u.dead && Mathf.dst(tx, ty, u.x, u.y) <= BEAM_RADIUS){
            u.damage(damage);
        }
    });
    return true;
}

function onShoot(unit, mount, s, now){
    if(now >= s.burstReady && Mathf.chance(BURST_CHANCE)){
        s.burstReady = now + BURST_COOLDOWN;
        unit.apply(frenzyStatus, FRENZY_TIME);
        fireBurst(unit, mount);
    }
    if(now >= s.beamReady && Mathf.chance(BEAM_CHANCE)){
        if(fireBeam(unit, s)) s.beamReady = now + BEAM_COOLDOWN;
    }
}

function trackShots(unit, s){
    let mounts = unit.mounts;
    let now = Time.time;
    for(let i = 0; i < mounts.length; i++){
        let reload = mounts[i].reload;
        let fired = reload > s.reloads[i] + 0.5;
        s.reloads[i] = reload;
        if(fired) onShoot(unit, mounts[i], s, now);
    }
}

function isOverLimit(unit){
    return unit.team != Vars.state.rules.waveTeam && unit.team.data().countType(unit.type) > MAX_PER_TEAM;
}

function rejectExtra(unit){
    if(!Vars.headless && Vars.ui != null && unit.team == Vars.player.team()){
        let isEn = Core.settings.getString("locale").startsWith("en");
        Vars.ui.showInfoToast(isEn ? "[scarlet]Each team can only have 1 Cin![]" : "[scarlet]Mỗi phe chỉ được có 1 unit Cin![]", 4);
    }
    unit.remove();
}

const cinAbility = extend(Ability, {
    update(unit){
        if(unit == null || unit.dead || Vars.net.client()) return;
        let s = states.get(unit.id);
        if(s == null){
            if(isOverLimit(unit)){
                rejectExtra(unit);
                return;
            }
            s = createState(unit);
            states.put(unit.id, s);
            unit.apply(coreStatus, 1);
        }
        trackAbsorb(unit, s);
        trackDamage(unit, s);
        trackShots(unit, s);
    },
    death(unit){
        if(unit != null) states.remove(unit.id);
    },
    localized(){
        return "Cin";
    }
});

let patched = false;

function isCin(name){
    let n = name.toLowerCase();
    return n == "cin" || n.endsWith("-cin");
}

function patch(){
    if(patched) return;
    let found = null;
    Vars.content.units().each(u => {
        if(found == null && isCin(u.name)) found = u;
    });
    if(found == null) return;
    patched = true;
    found.abilities.add(cinAbility);
}

Events.on(EventType.ContentInitEvent, e => patch());
Events.on(EventType.ClientLoadEvent, e => patch());
Events.on(EventType.ServerLoadEvent, e => patch());
Events.on(EventType.WorldLoadEvent, e => states.clear());
patch();