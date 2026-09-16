const arkyidData = {};
const arkyidOriginals = {};

const arkyidExplosionFx = new Effect(50, cons(e => {
    Draw.z(Layer.effect + 0.1);
    let maxRadius = 15 * Vars.tilesize;
    let alpha = 1.0 - e.fin();
    let col = Color.valueOf("a962ed");

    Draw.color(col);
    Draw.alpha(alpha * 0.35);
    Fill.circle(e.x, e.y, maxRadius);

    Draw.color(col);
    Draw.alpha(alpha * 0.7);
    Lines.stroke(2.5 * alpha);
    Lines.circle(e.x, e.y, maxRadius);

    const ringColors = [
        Color.valueOf("ffffff"), 
        Color.valueOf("dcc4f8"), 
        col 
    ];

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

const arkyidSubBullet = new BasicBulletType(3.5, 12);
arkyidSubBullet.width = 7;
arkyidSubBullet.height = 7;
arkyidSubBullet.lifetime = 40;
arkyidSubBullet.backColor = Color.valueOf("a962ed");
arkyidSubBullet.frontColor = Color.white;
arkyidSubBullet.shrinkY = 0;

const arkyidCircleBullet = new BasicBulletType(4, 35);
arkyidCircleBullet.width = 16;
arkyidCircleBullet.height = 16;
arkyidCircleBullet.lifetime = 60;
arkyidCircleBullet.backColor = Color.valueOf("a962ed");
arkyidCircleBullet.frontColor = Color.white;
arkyidCircleBullet.shrinkY = 0;
arkyidCircleBullet.fragBullet = arkyidSubBullet;
arkyidCircleBullet.fragBullets = 20;
arkyidCircleBullet.fragVelocityMin = 0.5;
arkyidCircleBullet.fragVelocityMax = 1.5;

Events.on(ClientLoadEvent, cons(e => {
    let arkyid = Vars.content.getByName(ContentType.unit, "arkyid");
    if (arkyid == null) return;

    arkyidOriginals.health = arkyid.health;
    arkyidOriginals.armor = arkyid.armor;
    arkyidOriginals.reloadList = [];
    arkyid.weapons.each(cons(w => {
        arkyidOriginals.reloadList.push(w.reload);
    }));
}));

Events.on(WorldLoadEvent, cons(e => {
    let arkyid = Vars.content.getByName(ContentType.unit, "arkyid");
    if (arkyid == null || arkyidOriginals.health == null) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    if (isEnabled) {
        arkyid.health = arkyidOriginals.health * 2.20;
        arkyid.armor = arkyidOriginals.armor + 12;
        let idx = 0;
        arkyid.weapons.each(cons(w => {
            if (arkyidOriginals.reloadList[idx] != null) {
                w.reload = arkyidOriginals.reloadList[idx] / 6.0;
            }
            idx++;
        }));
    } else {
        arkyid.health = arkyidOriginals.health;
        arkyid.armor = arkyidOriginals.armor;
        let idx = 0;
        arkyid.weapons.each(cons(w => {
            if (arkyidOriginals.reloadList[idx] != null) {
                w.reload = arkyidOriginals.reloadList[idx];
            }
            idx++;
        }));
    }
}));

Events.run(Trigger.update, () => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;
    if (!Core.settings.getBool("newex-logic-support-units", true)) return;

    let arkyidUnit = Vars.content.getByName(ContentType.unit, "arkyid");
    if (arkyidUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && !u.dead && u.type == arkyidUnit) {
            let id = u.id;

            if (!arkyidData[id]) {
                arkyidData[id] = {
                    circleTimer: 0,
                    nextCircleInterval: Mathf.range(30, 60),
                    hpGrowthTimer: 0,
                    lastHealth: u.health,
                    hpLossAccumulator: 0
                };
            }

            let data = arkyidData[id];

            data.hpGrowthTimer += Time.delta;
            if (data.hpGrowthTimer >= 60.0) {
                data.hpGrowthTimer = 0;
                
                if (u.maxHealth < 500000) {
                    u.maxHealth = Math.min(500000, u.maxHealth + 500);
                }
                
                u.heal(u.maxHealth * 0.01);
            }

            let damageTaken = data.lastHealth - u.health;
            if (damageTaken > 0) {
                u.health += damageTaken * 0.40;
                
                let actualDamage = damageTaken * 0.60;
                data.hpLossAccumulator += actualDamage;

                let threshold = u.maxHealth * 0.05;
                while (data.hpLossAccumulator >= threshold) {
                    data.hpLossAccumulator -= threshold;

                    arkyidExplosionFx.at(u.x, u.y);
                    Effect.shake(6, 6, u.x, u.y);
                    
                    Damage.damage(u.team, u.x, u.y, 15 * Vars.tilesize, 500, true, true);
                }
            }

            if (u.isShooting) {
                data.circleTimer += Time.delta;
                if (data.circleTimer >= data.nextCircleInterval) {
                    data.circleTimer = 0;
                    data.nextCircleInterval = Mathf.random(30, 60);

                    let baseAngle = u.rotation;
                    arkyidCircleBullet.create(u, u.team, u.x, u.y, baseAngle - 15);
                    arkyidCircleBullet.create(u, u.team, u.x, u.y, baseAngle + 15);
                }
            } else {
                data.circleTimer = 0;
            }

            data.lastHealth = u.health;
        }
    });
});

Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && arkyidData[e.unit.id]) {
        delete arkyidData[e.unit.id];
    }
}));