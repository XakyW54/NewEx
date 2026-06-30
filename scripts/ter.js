 
let lastTapTimeTer = 0;
const doubleTapIntervalTer = 250;  

 const terLaserBullet = extend(LaserBulletType, {
    damage: 45, 
    length: 160,  
    width: 8, 
    colors: [Color.purple.cpy().mul(0.6), Color.purple, Color.white] 
});

Events.on(ClientLoadEvent, () => {
    const terUnit = Vars.content.getByName(ContentType.unit, "newex-ter");
    
    if(terUnit != null){
        terUnit.constructor = () => {
            return extend(Packages.mindustry.gen.TankUnit, {
                 wasTouchedPrevTer: false, 
                
                 isLaserModeActive: false,
                laserShotTimer: 0,

                update(){
                    this.super$update(); 

                     if(Vars.player.unit() == this){ 
                        let isTouchedNow = Core.input.isTouched(); 
                        if(isTouchedNow && !this.wasTouchedPrevTer){ 
                            let currentTime = Time.millis(); 
                            if((currentTime - lastTapTimeTer) < doubleTapIntervalTer){ 
                                if(!this.dead){
                                     this.isLaserModeActive = !this.isLaserModeActive;
                                    
                                     if(this.isLaserModeActive){
                                        Fx.heal.at(this.x, this.y, 16, Color.purple);
                                    } else {
                                        Fx.smoke.at(this.x, this.y);
                                    }
                                }
                            }
                            lastTapTimeTer = currentTime; 
                        }
                        this.wasTouchedPrevTer = isTouchedNow; 
                    }

                     if(this.isLaserModeActive && !this.dead){
                        this.laserShotTimer += Time.delta;
                        
                         if(Math.floor(this.laserShotTimer) % 10 === 0){ 
                             for(let i = -1; i <= 1; i++){ 
                                let shotAngle = this.rotation + (i * 4); 
                                terLaserBullet.create(this, this.team, this.x, this.y, shotAngle); 
                            }
                        }
                    } else {
                        this.laserShotTimer = 0;
                    }
                },

                draw(){
                    this.super$draw(); 

                     if(this.isLaserModeActive && !this.dead){
                        Draw.z(Layer.effect); 
                        Draw.color(Color.purple, Mathf.absin(Time.time, 2.0, 0.4));
                        Lines.stroke(1.5);
                        Lines.circle(this.x, this.y, this.hitSize + 3 + Mathf.absin(Time.time, 1.0, 1.0)); 
                        Draw.reset(); 
                    }
                }
            });
        };
    }
});