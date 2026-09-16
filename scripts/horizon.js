// Tên file: horizon.js
// Mô tả: Di chuyển tích tầng Zon, Stealth mờ hình, ép pháo/unit bỏ nhắm mục tiêu. Bật/Tắt theo "newex-logic-support-units".

const horizonYellow = Color.valueOf("#ffd27d");

const zonTextEffect = new Effect(40, e => {
    Draw.color(horizonYellow);
    let offsetY = e.finpow() * 20;
    let scale = 1.0 + Math.sin(e.fin() * Math.PI) * 0.4;

    Lines.stroke(2.0 * e.fout());
    let x = e.x, y = e.y + offsetY;
    let s = 6 * scale;

    Lines.line(x - s/2, y + s, x + s/2, y + s);
    Lines.line(x + s/2, y + s, x - s/2, y - s);
    Lines.line(x - s/2, y - s, x + s/2, y - s);
});

const homingPierceBullet = new BasicBulletType(5, 25);
homingPierceBullet.width = 10;
homingPierceBullet.height = 10;
homingPierceBullet.shrinkX = 0;
homingPierceBullet.shrinkY = 0;
homingPierceBullet.frontColor = Color.valueOf("#ffffff");
homingPierceBullet.backColor = horizonYellow;
homingPierceBullet.trailColor = horizonYellow;
homingPierceBullet.trailWidth = 2;
homingPierceBullet.trailLength = 8;
homingPierceBullet.lifetime = 120;
homingPierceBullet.homingPower = 0.15;
homingPierceBullet.homingRange = 200;
homingPierceBullet.pierce = true;
homingPierceBullet.pierceCap = 20;
homingPierceBullet.pierceBuilding = true;

const customBombExplosion = new Effect(30, e => {
    Draw.color(horizonYellow);
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 80 * e.fin());
    Fx.blastExplosion.at(e.x, e.y);
    Effect.shake(4, 4, e.x, e.y);
});

const horizonDataMap = new ObjectMap();
var baseHorizonHealth = 160;
var baseHorizonSpeed = 1.6;
var vanillaBomb = null; // Lưu đạn bom Vanilla gốc

Events.on(ClientLoadEvent, () => {
    let horizon = UnitTypes.horizon;
    if(horizon != null && horizon.weapons.size > 0){
        baseHorizonHealth = horizon.health;
        baseHorizonSpeed = horizon.speed;
        // Lưu bản sao đạn bom Vanilla
        vanillaBomb = horizon.weapons.get(0).bullet.copy();
    }
});

// Chuyển đổi trạng thái đạn bom Horizon khi tải bản đồ
Events.on(WorldLoadEvent, () => {
    let horizon = UnitTypes.horizon;
    if(!horizon || horizon.weapons.size == 0) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);
    let bomb = horizon.weapons.get(0).bullet;

    if(isEnabled){
        bomb.splashDamageRadius = 80;
        bomb.splashDamage = 60;
        bomb.hitEffect = customBombExplosion;
        bomb.despawnEffect = customBombExplosion;
        bomb.fragBullet = homingPierceBullet;
        bomb.fragBullets = 20;
        bomb.fragVelocityMin = 0.8;
        bomb.fragVelocityMax = 1.2;
        bomb.fragSpread = 360;
        bomb.fragRandomSpread = 0;
    } else if(vanillaBomb != null){
        // Khôi phục đạn bom Vanilla
        bomb.splashDamageRadius = vanillaBomb.splashDamageRadius;
        bomb.splashDamage = vanillaBomb.splashDamage;
        bomb.hitEffect = vanillaBomb.hitEffect;
        bomb.despawnEffect = vanillaBomb.despawnEffect;
        bomb.fragBullet = vanillaBomb.fragBullet;
        bomb.fragBullets = vanillaBomb.fragBullets;
    }
});

Events.run(Trigger.update, () => {
    if(Vars.state.isPaused() || Vars.state.isMenu()) return;
    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    Groups.unit.each(u => {
        if(!u || u.dead || u.type != UnitTypes.horizon) return;

        // Nếu TẮT Setting -> Reset chỉ số về Vanilla gốc
        if(!isEnabled){
            u.damageMultiplier = 1.0;
            u.maxHealth = baseHorizonHealth;
            if(u.health > u.maxHealth) u.health = u.maxHealth;
            horizonDataMap.remove(u.id);
            return;
        }

        if(!horizonDataMap.containsKey(u.id)){
            horizonDataMap.put(u.id, {
                moveTimer: 0,
                zonStacks: [],
                lastX: u.x,
                lastY: u.y,
                isStealth: false,
                lastMaxHealth: baseHorizonHealth
            });
        }

        let data = horizonDataMap.get(u.id);
        let now = Time.time;

        while(data.zonStacks.length > 0 && data.zonStacks[0] <= now){
            data.zonStacks.shift();
        }

        let isMoving = Mathf.dst(u.x, u.y, data.lastX, data.lastY) > 0.05;
        let isAttacking = u.isShooting || u.isCharging;

        data.lastX = u.x;
        data.lastY = u.y;

        if(isMoving && !isAttacking){
            data.isStealth = true;

            Groups.unit.each(enemy => {
                if(enemy && enemy.team != u.team && enemy.target == u){
                    enemy.target = null;
                }
            });

            let detectRangeSq = 400 * 400;
            Groups.build.each(b => {
                if(b && b.team != u.team && b.target == u){
                    if(Mathf.dst2(b.x, b.y, u.x, u.y) <= detectRangeSq){
                        b.target = null;
                    }
                }
            });

            let hitRadiusSq = 20 * 20;
            Groups.bullet.each(b => {
                if(b && b.team != u.team){
                    if(Mathf.dst2(b.x, b.y, u.x, u.y) <= hitRadiusSq){
                        b.remove();
                    }
                }
            });

            data.moveTimer += Time.delta;
            if(data.moveTimer >= 60){
                data.moveTimer = 0;
                if(data.zonStacks.length < 100){
                    data.zonStacks.push(now + 3600);
                    zonTextEffect.at(u.x, u.y);
                }
            }
        } else {
            data.isStealth = false;
            data.moveTimer = 0;
        }

        let currentStacks = data.zonStacks.length;
        let boostRatio = currentStacks * 0.10;
        let multiplier = 1.0 + boostRatio;

        if(isMoving && boostRatio > 0){
            let targetSpeed = baseHorizonSpeed * multiplier;
            if(u.vel.len() > targetSpeed){
                u.vel.setLength(targetSpeed);
            } else {
                u.vel.scl(1.0 + (boostRatio * 0.02));
            }
        }

        u.damageMultiplier = multiplier;

        let newMaxHealth = baseHorizonHealth * multiplier;
        if(Math.abs(data.lastMaxHealth - newMaxHealth) > 0.01){
            let healthPercent = u.health / u.maxHealth;
            u.maxHealth = newMaxHealth;
            u.health = newMaxHealth * healthPercent;
            data.lastMaxHealth = newMaxHealth;
        }
    });
});

Events.run(Trigger.draw, () => {
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    Groups.unit.each(u => {
        if(!u || u.dead || u.type != UnitTypes.horizon) return;
        
        let data = horizonDataMap.get(u.id);
        if(data && data.isStealth){
            Draw.z(Layer.flyingUnit + 0.1);
            Draw.color(horizonYellow);
            Draw.alpha(0.25);
            Draw.rect(u.type.region, u.x, u.y, u.rotation - 90);
            Draw.reset();
        }
    });
});

Events.on(EventType.UnitDestroyEvent, event => {
    let u = event.unit;
    if(u && u.type == UnitTypes.horizon){
        horizonDataMap.remove(u.id);
    }
});