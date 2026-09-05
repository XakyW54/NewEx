const mainColor = Color.valueOf("90caf9");
const lightColor = Color.valueOf("e3f2fd");
const coreColor = Color.white;

const customHitEffect = new Effect(24, new Cons({
    get: function(e){
        Draw.color(mainColor, lightColor, e.fout());
        Lines.stroke(e.fout() * 2.5);
        Lines.circle(e.x, e.y, e.fin() * 14.0);

        let count = 6;
        for(let i = 0; i < count; i++){
            let ang = (360 / count) * i + Mathf.randomSeed(e.id + i, -15, 15);
            let len = (2.0 + 16.0 * e.finpow());
            let px = e.x + Angles.trnsx(ang, len);
            let py = e.y + Angles.trnsy(ang, len);

            Lines.stroke(e.fout() * 2.0);
            Lines.lineAngle(px, py, ang, 1.0 + e.fout() * 3.0);
        }

        Drawf.light(e.x, e.y, 40, mainColor, 0.7 * e.fout());
    }
}));

 
const droneBeam = extend(LaserBulletType, {
    damage: 45,
    length: 280,
    width: 28,
    lifetime: 5,
    layer: 115,
    colors: [mainColor, lightColor, coreColor],
    sideAngle: 45,
    sideWidth: 2.2,
    sideLength: 26,
    hitEffect: customHitEffect,
    despawnEffect: Fx.none,
    drawSize: 300,
    pierce: true,

    draw(b){
        this.super$draw(b);
        Drawf.light(b.x, b.y, b.x + Angles.trnsx(b.rotation(), this.length), b.y + Angles.trnsy(b.rotation(), this.length), this.width * 2.5, mainColor, 0.9);
    },

    hitEntity(b, other, initialHealth){
        this.super$hitEntity(b, other, initialHealth);
        if(other != null && other.isFlying !== undefined && other.isFlying()){
            other.damage(this.damage * 2.0);
        }
    }
});

 
const droneStorage = {};

 
const erysidusDroneAI = () => extend(FlyingAI, {
    updateMovement(){
        let target = this.target;
        if(target != null){
   
            this.circleAttack(200);
        } else {
            let core = this.unit.closestCore();
            if(core != null){
                this.moveTo(core, 80);
            }
        }
    }
});

Events.on(ClientLoadEvent, new Cons({
    get: function(e){
        let droneType = Vars.content.getByName(ContentType.unit, "newex-erysidus-drone") || Vars.content.getByName(ContentType.unit, "erysidus-drone");

        if(droneType != null){
            droneType.aiController = erysidusDroneAI;
        }

   
        Events.run(Trigger.update, new java.lang.Runnable({
            run: function(){
                if(Vars.state.isMenu()) return;

                Groups.unit.each(u => {
                    if(u != null && u.type === droneType && u.isValid()){
                        
                        if(droneStorage[u.id] === undefined){
                            droneStorage[u.id] = {
                                beamDurationTimer: 0,
                                beamCooldownTimer: 0
                            };
                        }

                        let data = droneStorage[u.id];
                        let tier = u.maxHealth > 2000 ? 2 : (u.maxHealth > 1500 ? 1 : 0);

                 
                        Draw.draw(Layer.flyingUnit - 0.01, () => {
                            Drawf.light(u.x, u.y, 50, mainColor, 0.6);

                            if(data.beamDurationTimer > 0){
                                Drawf.light(u.x, u.y, 90, mainColor, 0.95);
                            }
                        });

                        if(data.beamDurationTimer > 0){
                            data.beamDurationTimer -= Time.delta;

                            // Đã sửa lỗi: lọc mục tiêu bằng boolean và truyền hàm so sánh máu chính xác
                            let target = Units.bestTarget(u.team, u.x, u.y, 280, e => e.checkTarget(true, true), e => true, (a, b) => b.health - a.health);
                            let targetAngle = u.rotation;
                            if(target != null){
                                targetAngle = u.angleTo(target);
                                u.rotation = Mathf.slerpDelta(u.rotation, targetAngle, 0.25);
                            }

                            if(Mathf.mod(data.beamDurationTimer, 3) < Time.delta){
                                let beamDmg = (tier === 2) ? 68 : 45;
                                let beam = droneBeam.create(u, u.team, u.x, u.y, targetAngle, 1, 1);
                                if(beam != null) beam.damage = beamDmg;
                                Effect.shake(1.5, 1.5, u.x, u.y);
                            }

                            if(data.beamDurationTimer <= 0){
                                data.beamCooldownTimer = 300;  
                            }
                        } 
                        else if(data.beamCooldownTimer > 0){
                            data.beamCooldownTimer = Math.max(0, data.beamCooldownTimer - Time.delta);
                        } 
                        else {
                            let target = Units.closestTarget(u.team, u.x, u.y, 280);
                            if(target != null){
                                data.beamDurationTimer = 42;  
                            }
                        }
                    }
                });
            }
        }));
 
        Events.on(UnitDestroyEvent, new Cons({
            get: function(event){
                if(event.unit != null && droneStorage[event.unit.id] !== undefined){
                    delete droneStorage[event.unit.id];
                }
            }
        }));
    }
}));