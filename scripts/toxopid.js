const toxopidData = {};

const toxopidExplosionFx = new Effect(30, cons(e => {
    Draw.z(Layer.effect + 0.1);
    let maxRadius = 9 * Vars.tilesize;
    let progress = e.fin();
    let currentRadius = maxRadius * progress;
    let alpha = 1.0 - progress;
    let col = Color.valueOf("a962ed");

    Draw.color(col);
    Draw.alpha(alpha * 0.4);
    Fill.circle(e.x, e.y, currentRadius);

    Draw.color(col);
    Draw.alpha(alpha * 0.8);
    Lines.stroke(3.0 * alpha);
    Lines.circle(e.x, e.y, maxRadius);

    Draw.reset();
}));

Events.run(Trigger.update, () => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;
    if (!Core.settings.getBool("newex-logic-support-units", true)) return;

    let toxopidUnit = Vars.content.getByName(ContentType.unit, "toxopid");
    if (toxopidUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && !u.dead && u.type == toxopidUnit) {
            let id = u.id;

            if (!toxopidData[id]) {
                toxopidData[id] = {
                    healTimer: 0,
                    moveExplodeTimer: 0,
                    lastHealth: u.health
                };
            }

            let data = toxopidData[id];

            let damageTaken = data.lastHealth - u.health;
            if (damageTaken > 0) {
                if (data.lastHealth <= 1.0) {
                    u.kill();
                    return;
                }

                let reducedDamage = damageTaken * 0.001;
                let newHealth = data.lastHealth - reducedDamage;

                if (newHealth <= 1.0) {
                    u.health = 1.0;
                } else {
                    u.health = newHealth;
                }
            }

            data.healTimer += Time.delta;
            if (data.healTimer >= 60.0) {
                data.healTimer = 0;
                u.heal(u.maxHealth * 0.05);
            }

            if (u.moving()) {
                data.moveExplodeTimer += Time.delta;
                if (data.moveExplodeTimer >= 60.0) {
                    data.moveExplodeTimer = 0;

                    let offsetX = Mathf.range(8 * Vars.tilesize);
                    let offsetY = Mathf.range(8 * Vars.tilesize);
                    let targetX = u.x + offsetX;
                    let targetY = u.y + offsetY;

                    toxopidExplosionFx.at(targetX, targetY);
                    Effect.shake(5, 5, targetX, targetY);
                    Damage.damage(u.team, targetX, targetY, 9 * Vars.tilesize, 1500, true, true);
                }
            } else {
                data.moveExplodeTimer = 0;
            }

            data.lastHealth = u.health;
        }
    });
});

Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && toxopidData[e.unit.id]) {
        delete toxopidData[e.unit.id];
    }
}));