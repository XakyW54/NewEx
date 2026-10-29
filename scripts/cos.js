const CRIT_CHANCE = 0.5;
const CRIT_MULTIPLIER = 3.0; // Base + 200% bạo kích = 3.0x
const FOOT_UNIT_MULTIPLIER = 1.5; // +50% sát thương lên bộ binh

const PULSAL_SHOTS_NEEDED = 100;
const PULSAL_DURATION = 600; // 10 giây (600 ticks)
const PULSAL_LASER_DAMAGE = 420;
const PULSAL_LASER_RANGE = 420 * 1.5 * 2; // Gấp đôi tầm bắn sau khi tăng 50%

const LIGHTNING_INTERVAL = 60; // 1 giây (60 ticks)
const LIGHTNING_RADIUS = 20 * Vars.tilesize;
const LIGHTNING_HEAL_PERCENT = 0.10;
const LIGHTNING_ENEMY_MAX_HP_DAMAGE = 0.10;

const BUFF_RADIUS = 10 * Vars.tilesize;
const BUFF_MULTIPLIER = 3.0; // +200% = 3.0x

const SHIELD_THRESHOLD = 0.5;
const SHIELD_MAX_HEALTH = 100000;

const laserColor = Color.valueOf("84f4ff");
const lightningColor = Color.valueOf("84f4ff");

const states = new IntMap();

// Hiệu ứng tia laser Pusal
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

// Hiệu ứng tự vẽ khi kích hoạt trạng thái Pusal
const activateFx = new Effect(40, 200, e => {
    let f = e.fout();
    Draw.color(Color.valueOf("84f4ff"), Color.white, f);
    Lines.stroke(2 * f);
    Lines.circle(e.x, e.y, e.finpow() * 40);
    Fill.circle(e.x, e.y, 6 * f);
    Draw.reset();
});

const cosStatus = extend(StatusEffect, "cos-core", {
    update(unit, time){
        this.super$update(unit, time);
        let s = states.get(unit.id);
        if(s == null) return;

        let dmgMult = 1.0;
        
        // Tỉ lệ chí mạng
        if(Mathf.chance(CRIT_CHANCE)){
            dmgMult *= CRIT_MULTIPLIER;
        }

        // Hào quang đồng minh cùng loại: Tăng sát thương 200%
        if(s.hasNearbyCosBuff){
            dmgMult *= BUFF_MULTIPLIER;
        }

        unit.damageMultiplier = dmgMult;
        unit.reloadMultiplier = s.hasNearbyCosBuff ? BUFF_MULTIPLIER : 1.0;
    }
});
cosStatus.permanent = true;
cosStatus.show = false;

function createState(unit){
    let reloads = [];
    for(let i = 0; i < unit.mounts.length; i++){
        reloads.push(unit.mounts[i].reload);
    }
    return {
        shotsWeaponA: [0, 0],
        pulsalTimer: 0,
        pulsalLaserTimer: [0, 0],
        lightningTimer: 0,
        hasNearbyCosBuff: false,
        shieldActivated: false,
        lastX: unit.x,
        lastY: unit.y,
        reloads: reloads
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

    // Hồi HP đồng minh
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

    // Gây sát thương kẻ địch
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

function trackShots(unit, s){
    let mounts = unit.mounts;
    for(let i = 0; i < mounts.length; i++){
        let mount = mounts[i];
        let weapon = mount.weapon;
        let weaponName = weapon.name;

        if(weaponName.endsWith("cos-weapon-a") || weaponName == "cos-weapon-a"){
            if(s.pulsalTimer > 0){
                // Chặn hoàn toàn đạn mặc định trong trạng thái Pusal và bắn laser
                mount.reload = 0;
                s.pulsalLaserTimer[i] += Time.delta * unit.reloadMultiplier;
                if(s.pulsalLaserTimer[i] >= weapon.reload){
                    s.pulsalLaserTimer[i] = 0;
                    firePulsalLaser(unit, mount);
                }
            }else{
                // Càng bắn càng nhanh: tăng tốc độ nạp đạn dựa trên số lượng đạn đã bắn
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
        }
        s.reloads[i] = mount.reload;
    }
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

        updateShield(unit, s);
        updateNearbyCosBuff(unit, s);
        handleMovementLightning(unit, s);
        trackShots(unit, s);
    },
    death(unit){
        if(unit != null) states.remove(unit.id);
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

    // Tăng tầm nhìn/tầm nhắm của unit Cos lên 50%
    found.range *= 1.5;
}

Events.on(EventType.ContentInitEvent, e => patch());
Events.on(EventType.ClientLoadEvent, e => patch());
Events.on(EventType.ServerLoadEvent, e => patch());
Events.on(EventType.WorldLoadEvent, e => states.clear());
patch();