 
const customNovaExplosionFx = new Effect(25, cons(e => {
    Draw.color(Color.valueOf("84f491"));

    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 80 * e.fin());

    Draw.alpha(e.fout());
    Fill.circle(e.x, e.y, 15 * e.fout());

    Angles.randLenVectors(e.id, 10, 80 * e.fin(), (x, y) => {
        let angle = Mathf.angle(x, y);
        let len = Mathf.len(x, y);
        Lines.stroke(1.5 * e.fout());
        Lines.lineAngle(e.x + x, e.y + y, angle, len * 0.3 + 2);
    });

    Draw.reset();
}));

const customNovaBullet = extend(BasicBulletType, 2.5, 10, {
    sprite: "bullet",
    frontColor: Color.valueOf("84f491"),
    backColor: Color.valueOf("62ae72"),
    width: 7,
    height: 9,
    lifetime: 60,

    despawned(b) {
        this.super$despawned(b);

        let explosionRange = 80;

        customNovaExplosionFx.at(b.x, b.y);

        Damage.damage(
            b.team,
            b.x,
            b.y,
            explosionRange,
            150,
            true,
            true
        );
    }
});

const novaData = {};

Timer.schedule(() => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    let novaUnit = Vars.content.getByName(ContentType.unit, "nova");
    if (novaUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && u.isValid() && u.type == novaUnit) {
            let id = u.id;

            if (!isEnabled) {
                if (novaData[id]) delete novaData[id];
                return;
            }

            if (!novaData[id]) {
                novaData[id] = {
                    shootTimer: 0
                };
            }

            let data = novaData[id];

            data.shootTimer += Time.delta;
            if (data.shootTimer >= 60) {
                data.shootTimer = 0;

                let range = 160;
                let target = Units.closestTarget(u.team, u.x, u.y, range, u2 => u2.checkTarget(true, true), b => true);

                if (target != null) {
                    for (let i = 0; i < 3; i++) {
                        let angleOffset = (i - 1) * 6;
                        let angle = u.angleTo(target) + angleOffset;

                        customNovaBullet.create(u, u.team, u.x, u.y, angle);
                    }
                }
            }
        }
    });
}, 0, 0.016);

Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && novaData[e.unit.id]) {
        delete novaData[e.unit.id];
    }
}));