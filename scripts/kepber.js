 
let lastTapTimeKepber = 0;
const doubleTapIntervalKepber = 250; 

 const kepberLaserBullet = extend(LaserBulletType, {
    damage: 45,
    length: 160,  
    width: 8,
    colors: [Color.purple.cpy().mul(0.6), Color.purple, Color.white]
});

Events.on(ClientLoadEvent, () => {
    const kepberUnit = Vars.content.getByName(ContentType.unit, "newex-kepber");
    
    if(kepberUnit != null){
        kepberUnit.constructor = () => {
            return extend(Packages.mindustry.gen.LegsUnit, {
                 
                moveTimer: 0,
                teleportCooldown: 0,
                isTeleportingEffect: false,
                wasTouchedPrevKepber: false,
                
                effectTimer: 0,
                maxEffectDuration: 25, 
                posA_X: 0, posA_Y: 0,
                posB_X: 0, posB_Y: 0,

                 stillTimer: 0,
                laserCooldown: 0,
                isLaserFiring: false,
                laserFireDuration: 0,

                update(){
                    this.super$update();

                    if(this.teleportCooldown > 0) this.teleportCooldown--;
                    if(this.laserCooldown > 0) this.laserCooldown--;

                    let shouldTriggerTP = false;

                     if(Vars.player.unit() == this){
                        let isTouchedNow = Core.input.isTouched();
                        if(isTouchedNow && !this.wasTouchedPrevKepber){
                            let currentTime = Time.millis();
                            if((currentTime - lastTapTimeKepber) < doubleTapIntervalKepber){
                                if(this.teleportCooldown <= 0 && !this.dead){
                                    shouldTriggerTP = true;
                                }
                            }
                            lastTapTimeKepber = currentTime;
                        }
                        this.wasTouchedPrevKepber = isTouchedNow;
                    }

                     if(this.vel.len() > 0.1 && !this.dead){
                        this.moveTimer += Time.delta;
                        if(this.moveTimer >= 120 && this.teleportCooldown <= 0){
                            shouldTriggerTP = true;
                        }
                        this.stillTimer = 0; 
                    } else if(!this.dead) {
                        this.moveTimer = 0;
                        this.stillTimer += Time.delta; 
                    }

                     if(shouldTriggerTP){
                         let randomTiles = 3 + Math.floor(Math.random() * 5); 
                        let tpDistance = randomTiles * 8; 
                        let moveAngle = this.vel.len() > 0.1 ? this.vel.angle() : this.rotation;

                        let targetX = this.x + Angles.trnsx(moveAngle, tpDistance);
                        let targetY = this.y + Angles.trnsy(moveAngle, tpDistance);

                         let isTargetSolid = Vars.world.solid(Vars.world.toTile(targetX), Vars.world.toTile(targetY));

                        if(isTargetSolid){
                             this.posA_X = this.x;
                            this.posA_Y = this.y;
                            this.posB_X = this.x;
                            this.posB_Y = this.y;
                        } else {
                             this.posA_X = this.x;
                            this.posA_Y = this.y;
                            this.posB_X = targetX;
                            this.posB_Y = targetY;
                            this.set(this.posB_X, this.posB_Y);
                        }

                         Damage.damage(this.team, this.posB_X, this.posB_Y, 32, 100, false, true);
                        Fx.blastExplosion.at(this.posB_X, this.posB_Y);
                        Fx.shockwave.at(this.posB_X, this.posB_Y); 

                        this.isTeleportingEffect = true;
                        this.effectTimer = this.maxEffectDuration;

                        this.moveTimer = 0;
                        this.teleportCooldown = 30; 
                    }

 
                    if(this.stillTimer >= 180 && this.laserCooldown <= 0 && !this.isLaserFiring && !this.dead){
                        this.isLaserFiring = true;
                         this.laserFireDuration = 240 + Math.floor(Math.random() * 120); 
                    }

                    if(this.isLaserFiring){
                         if(Math.floor(this.laserFireDuration) % 10 === 0){
                             for(let i = -1; i <= 1; i++){
                                let shotAngle = this.rotation + (i * 4);
                                kepberLaserBullet.create(this, this.team, this.x, this.y, shotAngle);
                            }
                        }
                        
                        this.laserFireDuration -= Time.delta;
                        
                         if(this.laserFireDuration <= 0 || this.vel.len() > 0.1 || this.dead){
                            this.isLaserFiring = false;
                            this.laserCooldown = 180; 
                        }
                    }

                     if(this.isTeleportingEffect){
                        this.effectTimer -= Time.delta;
                        if(this.effectTimer <= 0) this.isTeleportingEffect = false;
                    }
                },

                draw(){
                    this.super$draw();

                     if(this.isTeleportingEffect){
                        Draw.z(Layer.effect + 1); 
                        
                        let progress = this.effectTimer / this.maxEffectDuration;
                        let zoomScale = progress > 0.5 ? 1.0 : (progress * 2.0); 
                        let currentRadius = this.hitSize * zoomScale; 

                        if(currentRadius > 0.1){
                             Draw.color(Color.black);
                            Fill.circle(this.posA_X, this.posA_Y, currentRadius);
                            Draw.color(Color.purple);
                            Lines.stroke(2.5 * zoomScale); 
                            Lines.circle(this.posA_X, this.posA_Y, currentRadius + Mathf.absin(Time.time, 1.5, 1.5 * zoomScale));

                             Draw.color(Color.black);
                            Fill.circle(this.posB_X, this.posB_Y, currentRadius);
                            Draw.color(Color.purple);
                            Lines.stroke(2.5 * zoomScale);
                            Lines.circle(this.posB_X, this.posB_Y, currentRadius + Mathf.absin(Time.time, 1.5, 1.5 * zoomScale));
                            
                            Draw.reset(); 
                        }
                    }

                     if(this.stillTimer >= 60 && this.laserCooldown <= 0 && !this.dead){
                        Draw.z(Layer.effect);
                        Draw.color(Color.purple, Mathf.absin(Time.time, 2.0, 0.4));
                        Lines.stroke(1.2);
                        Lines.circle(this.x, this.y, this.hitSize + 2 + Mathf.absin(Time.time, 1.0, 1.0));
                        Draw.reset();
                    }
                }
            });
        };
    }
});