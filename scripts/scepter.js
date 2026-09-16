// Tên file: scepter.js
// Mô tả: Đạn Star 4 cánh tự vẽ, dồn 10 tầng nổ Unit & nổ công trình. Bật/Tắt theo "newex-logic-support-units".

const starColorFront = Color.valueOf("ffffff");
const starColorBack = Color.valueOf("ffd27d");
const starColorGlow = Color.valueOf("ff8c00");

const starHitEffect = new Effect(20, e => {
    Draw.color(starColorFront, starColorBack, e.fin());
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, 4 + e.fin() * 16);

    for(let i = 0; i < 4; i++){
        let angle = i * 90 + 45;
        let len = e.fin() * 20;
        Lines.lineAngle(e.x, e.y, angle, len);
    }
});

const buildingExplodeEffect = new Effect(40, e => {
    Draw.color(starColorGlow, starColorBack, e.fin());
    Lines.stroke(3.5 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 96);

    Draw.color(Color.white);
    Lines.stroke(2.0 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 60);
});

const markDetonateEffect = new Effect(35, e => {
    Draw.color(Color.white, starColorGlow, e.fin());
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, 8 + e.fin() * 40);

    Draw.color(starColorBack);
    for(let i = 0; i < 4; i++){
        let angle = i * 90;
        let rx = e.x + Angles.trnsx(angle, e.fin() * 30);
        let ry = e.y + Angles.trnsy(angle, e.fin() * 30);
        Lines.stroke(2.5 * e.fout());
        Lines.square(rx, ry, 6 * e.fout(), 45);
    }
});

const markApplyEffect = new Effect(15, e => {
    Draw.color(starColorBack);
    Lines.stroke(1.5 * e.fout());
    Lines.square(e.x, e.y, 4 + e.fin() * 8, 45);
});

const unitMarkMap = new ObjectMap();

const starBullet = extend(BasicBulletType, {
    speed: 12,
    damage: 450,
    lifetime: 45,
    pierce: true,
    pierceCap: 12,
    pierceBuilding: true,

    hitEffect: starHitEffect,
    despawnEffect: starHitEffect,
    smokeEffect: Fx.none,

    draw(b){
        if(!b) return;

        let size = 12;
        let innerSize = 2.5;

        Draw.color(starColorBack);
        
        for(let i = 0; i < 4; i++){
            let angle = b.rotation() + i * 90;
            let nextAngle = b.rotation() + (i + 1) * 90;

            let px = b.x + Angles.trnsx(angle, size);
            let py = b.y + Angles.trnsy(angle, size);

            let mx = b.x + Angles.trnsx(angle + 45, innerSize);
            let my = b.y + Angles.trnsy(angle + 45, innerSize);

            Fill.tri(b.x, b.y, px, py, mx, my);
            
            let npx = b.x + Angles.trnsx(nextAngle, size);
            let npy = b.y + Angles.trnsy(nextAngle, size);
            Fill.tri(b.x, b.y, mx, my, npx, npy);
        }

        Draw.color(starColorFront);
        for(let i = 0; i < 4; i++){
            let angle = b.rotation() + i * 90;
            let px = b.x + Angles.trnsx(angle, size * 0.6);
            let py = b.y + Angles.trnsy(angle, size * 0.6);
            let mx = b.x + Angles.trnsx(angle + 45, innerSize * 0.6);
            let my = b.y + Angles.trnsy(angle + 45, innerSize * 0.6);

            Fill.tri(b.x, b.y, px, py, mx, my);
        }

        Draw.reset();
    },

    hitTile(b, tile, x, y, initialHealth, direct){
        this.super$hitTile(b, tile, x, y, initialHealth, direct);

        let radius = 96;
        Damage.damage(b.team, x, y, radius, 300);
        buildingExplodeEffect.at(x, y);
    },

    hitEntity(b, other, initialHealth){
        this.super$hitEntity(b, other, initialHealth);

        if(other && !other.dead && other instanceof Unit){
            let targetId = other.id;
            let currentStacks = unitMarkMap.containsKey(targetId) ? unitMarkMap.get(targetId) : 0;
            currentStacks++;

            markApplyEffect.at(other.x, other.y);

            if(currentStacks >= 10){
                let scepterDmg = 600;
                let maxHPDmg = other.maxHealth * 0.10;
                let totalExplosionDmg = scepterDmg + maxHPDmg;

                other.damage(totalExplosionDmg);
                markDetonateEffect.at(other.x, other.y);

                unitMarkMap.put(targetId, 0);
            } else {
                unitMarkMap.put(targetId, currentStacks);
            }
        }
    }
});

Events.run(Trigger.update, () => {
    if(Vars.state.isPaused() || Vars.state.isMenu()) return;
    
    // KIỂM TRA CÔNG TẮC SWITCH
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    Groups.unit.each(u => {
        if(u && !u.dead && u.type == UnitTypes.scepter && u.isShooting){
            if(u.mounts && u.mounts.length > 0){
                for(let i = 0; i < u.mounts.length; i++){
                    let mount = u.mounts[i];
                    if(mount.reload <= 1.0 && mount.shoot){
                        if(Mathf.chance(0.08)){
                            let bulletAngle = u.rotation + Mathf.range(12);
                            starBullet.create(u, u.team, u.x + Angles.trnsx(u.rotation, 10), u.y + Angles.trnsy(u.rotation, 10), bulletAngle);
                        }
                    }
                }
            }
        }
    });
});