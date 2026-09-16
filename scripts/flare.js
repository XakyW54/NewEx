 
const sta = require("sta");

const flareLaserFx = new Effect(12, cons(e => {
    Draw.color(Color.yellow);
    Lines.stroke(2 * e.fout());
    if (e.data != null) {
        Lines.line(e.x, e.y, e.data.x, e.data.y);
    }
    Draw.reset();
}));

const flareLinkFx = new Effect(15, cons(e => {
    Draw.z(Layer.effect - 0.001);
    Draw.color(Color.valueOf("ffd700"));
    Lines.stroke(1.5 * e.fout());
    if (e.data != null) {
        Lines.line(e.x, e.y, e.data.x, e.data.y);
    }
    Draw.reset();
}));

const flareData = {};

Timer.schedule(() => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    let flareUnit = Vars.content.getByName(ContentType.unit, "flare");
    if (flareUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && u.isValid() && u.type == flareUnit) {
            let id = u.id;

            if (!isEnabled) {
                if (flareData[id]) delete flareData[id];
                return;
            }

            if (!flareData[id]) {
                flareData[id] = {
                    moveTimer: 0,
                    shootTimer: 0,
                    buffTimer: 0
                };
            }

            let data = flareData[id];

            let isMoving = u.vel.len() > 0.05;
            if (isMoving) {
                data.moveTimer = Math.min(300, data.moveTimer + Time.delta);
            } else {
                data.moveTimer = Math.max(0, data.moveTimer - Time.delta * 2);
            }

            if (data.moveTimer > 0) {
                u.apply(StatusEffects.overclock, 2);
            }

            data.shootTimer += Time.delta;
            if (data.shootTimer >= 60) {
                data.shootTimer = 0;

                let range = 160;
                let target = Units.closestTarget(u.team, u.x, u.y, range, u2 => u2.checkTarget(true, true), b => true);

                if (target != null) {
                    flareLaserFx.at(u.x, u.y, 0, target);
                    Fx.hitLancer.at(target.x, target.y, Color.yellow);

                    let baseDamage = 50;
                    let isCrit = Mathf.chance(0.50);
                    let finalDamage = isCrit ? baseDamage * 2.0 : baseDamage;

                    if (sta.flareBuff != null && u.hasEffect(sta.flareBuff)) {
                        finalDamage *= 1.20;
                    }

                    target.damage(finalDamage);

                    u.health = u.maxHealth;
                    Fx.heal.at(u.x, u.y);
                }
            }

            data.buffTimer += Time.delta;
            if (data.buffTimer >= 300) {
                data.buffTimer = 0;

                let linkRange = 120;
                let nearbyFlares = [];

                Groups.unit.intersect(u.x - linkRange, u.y - linkRange, linkRange * 2, linkRange * 2, cons(near => {
                    if (near.team == u.team && near.type == flareUnit && near.isValid()) {
                        let dst = Mathf.dst(u.x, u.y, near.x, near.y);
                        if (dst <= linkRange) {
                            nearbyFlares.push(near);
                        }
                    }
                }));

                if (nearbyFlares.length > 10) {
                    let unbuffedTargets = [];
                    let buffedTargets = [];

                    nearbyFlares.forEach(near => {
                        if (near != u) {
                            if (sta.flareBuff != null && !near.hasEffect(sta.flareBuff)) {
                                unbuffedTargets.push(near);
                            } else {
                                buffedTargets.push(near);
                            }
                        }
                    });

                    let target = unbuffedTargets.length > 0 ? unbuffedTargets[0] : (buffedTargets.length > 0 ? buffedTargets[0] : null);

                    if (target != null) {
                        if (u.id < target.id) {
                            flareLinkFx.at(u.x, u.y, 0, target);
                        }

                        if (sta.flareBuff != null) {
                            if (!u.hasEffect(sta.flareBuff)) u.apply(sta.flareBuff, 300);
                            if (!target.hasEffect(sta.flareBuff)) target.apply(sta.flareBuff, 300);
                        }
                    }
                }
            }
        }
    });
}, 0, 0.016);

Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && flareData[e.unit.id]) {
        delete flareData[e.unit.id];
    }
}));