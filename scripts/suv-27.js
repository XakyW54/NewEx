 

function getSuv27UpgradeRequirements(currentLevel) {
    return {
        leadNeeded: 340 + (currentLevel * 100),
        siliconNeeded: 400 + (currentLevel * 120),
        leadItem: Items.lead,
        siliconItem: Items.silicon
    };
}

const TRANSFORM_DELAY = 60;    
const TRANSFORM_COOLDOWN = 180; 
const CONE_SHOT_COOLDOWN = 180; 
const HYBRID_SKILL_COOLDOWN = 60; 
const DOUBLE_TAP_COOLDOWN = 60; 

let suvShotgunBulletType = null;
let pulseBulletType = null;
let rapid8mmBulletType = null;
let pulseBurstEffect = null;
let healEffect = null;

let moveX = 0;
let moveY = 0;

function transformToUnit(oldUnit, targetUnitName, remainingCooldown) {
    let targetType = Vars.content.getByName(ContentType.unit, "newex-" + targetUnitName);
    if (targetType == null) targetType = Vars.content.getByName(ContentType.unit, targetUnitName);

    if (targetType == null || !oldUnit.isValid()) return;

    let savedLevel = (oldUnit.level !== undefined && oldUnit.level !== null) ? oldUnit.level : 0;
    let savedLead = (oldUnit.leadAbsorbed !== undefined && oldUnit.leadAbsorbed !== null) ? oldUnit.leadAbsorbed : 0;
    let savedSilicon = (oldUnit.siliconAbsorbed !== undefined && oldUnit.siliconAbsorbed !== null) ? oldUnit.siliconAbsorbed : 0;

    let controllingPlayer = Groups.player.find(p => p.unit() == oldUnit);

    let newUnit = targetType.create(oldUnit.team);
    newUnit.set(oldUnit.x, oldUnit.y);
    newUnit.rotation = oldUnit.rotation;

    let maxH = oldUnit.maxHealth;
    let healthPercent = maxH > 0 ? (oldUnit.health / maxH) : 1.0;
    newUnit.health = newUnit.maxHealth * healthPercent;

    newUnit.add();

    if (newUnit.initUnitData) {
        newUnit.initUnitData(savedLevel, savedLead, savedSilicon, remainingCooldown);
    }

    oldUnit.remove();

    if (controllingPlayer != null) {
        controllingPlayer.unit(newUnit);
    }
}

function fireSUVShotgun(unit) {
    if (suvShotgunBulletType == null) return;

    let bulletCount = Mathf.random(12, 16); 
    for (let i = 0; i < bulletCount; i++) {
        let spreadAngle = unit.rotation + Mathf.range(10);
        let customLifetime = Mathf.random(24, 60);

        let b = suvShotgunBulletType.create(unit, unit.team, unit.x, unit.y, spreadAngle);
        if (b != null) {
            b.lifetime = customLifetime;
        }
    }
}

function applyTransformLogic(unitEntity, uType, targetUnitName, isSUV) {
    return {
        isGalileoJS: true,     
        level: 0,              
        maxLevel: 10,          
        leadAbsorbed: 0,       
        siliconAbsorbed: 0,    
        
        transformTimer: 0,     
        transformCooldown: 0,  
        coneShotCooldown: 0, 
        hybridSkillCooldown: 0, 
        doubleTapCooldown: 0,

        firingDuration: 0,     
        overdriveTimer: 0,    
        autoPulseTimer: 0, 

        flightAccelTimer: 0,
        wasMoving: false,
        gunMode: 0, 

        lastTapTimeInternal: 0,

        initUnitData(lvl, lead, silicon, cd) {
            this.level = lvl;
            this.leadAbsorbed = lead;
            this.siliconAbsorbed = silicon;
            this.transformCooldown = cd;
        },

        triggerDoubleTap() {
            if (this.doubleTapCooldown > 0) return;
            this.doubleTapCooldown = DOUBLE_TAP_COOLDOWN;

            if (isSUV) {
                let rocketType = Vars.content.getByName(ContentType.unit, "newex-vus-27-rocket");
                if (rocketType == null) rocketType = Vars.content.getByName(ContentType.unit, "vus-27-rocket");

                if (rocketType != null) {
                    try {
                        let sideOffset = 12;
                        let rx1 = this.x + Angles.trnsx(this.rotation + 90, sideOffset);
                        let ry1 = this.y + Angles.trnsy(this.rotation + 90, sideOffset);
                        let r1 = rocketType.create(this.team);
                        r1.set(rx1, ry1);
                        r1.rotation = this.rotation;
                        r1.add();

                        let rx2 = this.x + Angles.trnsx(this.rotation - 90, sideOffset);
                        let ry2 = this.y + Angles.trnsy(this.rotation - 90, sideOffset);
                        let r2 = rocketType.create(this.team);
                        r2.set(rx2, ry2);
                        r2.rotation = this.rotation;
                        r2.add();
                    } catch(e) {
                        Log.err("Lỗi tạo rocket: " + e);
                    }
                }
                Call.effect(Fx.shootBig, this.x, this.y, this.rotation, Color.white);
            } else {
                this.vel.add(Angles.trnsx(this.rotation, 8), Angles.trnsy(this.rotation, 8));

                let healAmount = this.maxHealth * 0.01;
                this.health = Math.min(this.maxHealth, this.health + healAmount);

                Call.effect(Fx.sparkExplosion, this.x, this.y, this.rotation, Color.white);
                if (healEffect != null) {
                    Call.effect(healEffect, this.x, this.y, 0, Color.white);
                }
            }
        },

        triggerTransform() {
            if (this.transformCooldown <= 0 && this.transformTimer <= 0) {
                if (isSUV && this.flightAccelTimer > 30) {
                    fireSUVShotgun(this);
                }
                this.transformTimer = TRANSFORM_DELAY;
                this.transformCooldown = TRANSFORM_COOLDOWN;
            }
        },

        triggerPulseCone() {
            if (this.coneShotCooldown <= 0) {
                this.coneShotCooldown = CONE_SHOT_COOLDOWN;

                if (pulseBurstEffect != null) {
                    Call.effect(pulseBurstEffect, this.x, this.y, 0, Color.white);
                }

                if (pulseBulletType != null) {
                    let bulletCount = 20;
                    let spread = 12.0; 
                    let baseAngle = this.rotation;

                    for (let i = 0; i < bulletCount; i++) {
                        let fireAngle = baseAngle + Mathf.range(spread / 2.0);
                        pulseBulletType.create(this, this.team, this.x, this.y, fireAngle);
                    }
                }
            }
        },

        triggerHybridSkill() {
            if (this.hybridSkillCooldown <= 0) {
                if (isSUV) {
                    this.gunMode = this.gunMode === 0 ? 1 : 0;
                    this.hybridSkillCooldown = HYBRID_SKILL_COOLDOWN;
                } else {
                    this.hybridSkillCooldown = HYBRID_SKILL_COOLDOWN;
                    let healAmount = this.maxHealth * 0.01;
                    this.health = Math.min(this.maxHealth, this.health + healAmount);

                    if (healEffect != null) {
                        Call.effect(healEffect, this.x, this.y, 0, Color.white);
                    }
                }
            }
        },

        setCooldown(cd) {
            this.transformCooldown = cd;
        },

        getCooldown() {
            return this.transformCooldown;
        },

        update() {
            this.super$update();

            if (this.transformCooldown > 0) this.transformCooldown -= Time.delta;
            if (this.coneShotCooldown > 0) this.coneShotCooldown -= Time.delta;
            if (this.hybridSkillCooldown > 0) this.hybridSkillCooldown -= Time.delta;
            if (this.doubleTapCooldown > 0) this.doubleTapCooldown -= Time.delta;

            if (this.transformTimer > 0) {
                this.transformTimer -= Time.delta;
                this.vel.set(0, 0);

                if (this.transformTimer <= 0) {
                    this.transformTimer = 0;
                    transformToUnit(this, targetUnitName, this.transformCooldown);
                    return;
                }
            }

            if (Vars.player != null && Vars.player.unit() == this) {
                if (Core.input.keyTap(KeyCode.num1)) this.triggerTransform();
                if (Core.input.keyTap(KeyCode.num2)) this.triggerPulseCone();
                if (Core.input.keyTap(KeyCode.num3)) this.triggerHybridSkill();

                if (Core.input.justTouched()) {
                    let now = Time.millis();
                    if (now - this.lastTapTimeInternal < 300) {
                        this.triggerDoubleTap();
                    }
                    this.lastTapTimeInternal = now;
                }

                if (Vars.mobile) {
                    Core.camera.position.set(this.x, this.y);
                    if (moveX !== 0 || moveY !== 0) {
                        let moveSpeed = this.speed();
                        this.moveAt(Tmp.v1.set(moveX, moveY).setLength(moveSpeed));
                    }
                }
            }

            let currentRange = isSUV ? (this.gunMode === 1 ? 600 : 400) : 200;
            let target = Units.closestTarget(this.team, this.x, this.y, currentRange, u => u.checkTarget(this.type.targetAir, this.type.targetGround));

            if (target != null) {
                let targetAngle = Angles.angle(this.x, this.y, target.x, target.y);
                this.rotation = Angles.moveToward(this.rotation, targetAngle, this.type.rotateSpeed * Time.delta);

                this.aim(target.x, target.y);
                this.isShooting = true;

                if (isSUV) {
                    this.autoPulseTimer += Time.delta;
                    if (this.gunMode === 0) {
                        if (this.autoPulseTimer >= 30) { 
                            this.autoPulseTimer = 0;
                            if (pulseBulletType != null) {
                                pulseBulletType.create(this, this.team, this.x, this.y, targetAngle);
                            }
                        }
                    } else {
                        if (this.autoPulseTimer >= 5) {
                            this.autoPulseTimer = 0;
                            if (rapid8mmBulletType != null) {
                                let spreadAngle = targetAngle + Mathf.range(3.5);
                                rapid8mmBulletType.create(this, this.team, this.x, this.y, spreadAngle);
                            }
                        }
                    }
                }

                if (!isSUV && this.mounts != null && this.mounts.length > 0) {
                    for (let i = 0; i < this.mounts.length; i++) {
                        let mount = this.mounts[i];
                        mount.shoot = true;
                        mount.rotate = true;
                        mount.aimX = target.x;
                        mount.aimY = target.y;
                    }
                }
            } else {
                if (Vars.mobile && (moveX !== 0 || moveY !== 0)) {
                    let moveAngle = Tmp.v1.set(moveX, moveY).angle();
                    this.rotation = Angles.moveToward(this.rotation, moveAngle, this.type.rotateSpeed * Time.delta);
                }
                this.isShooting = false;
                this.autoPulseTimer = 0;
                if (this.mounts != null && this.mounts.length > 0) {
                    for (let i = 0; i < this.mounts.length; i++) {
                        this.mounts[i].shoot = false;
                    }
                }
            }

            if (!isSUV) {
                if (this.isShooting) {
                    if (this.overdriveTimer <= 0) {
                        this.firingDuration += Time.delta;
                        if (this.firingDuration >= 120) { 
                            this.overdriveTimer = 60;    
                            this.firingDuration = 0;
                        }
                    }
                } else {
                    this.firingDuration = Math.max(0, this.firingDuration - Time.delta * 2);
                }

                if (this.overdriveTimer > 0) {
                    this.overdriveTimer -= Time.delta;
                    if (this.mounts != null && this.mounts.length > 0) {
                        for (let i = 0; i < this.mounts.length; i++) {
                            let mount = this.mounts[i];
                            if (mount.reload > 0) {
                                mount.reload = Math.max(0, mount.reload - (Time.delta * 4.0));
                            }
                        }
                    }
                }
            }

            if (isSUV) {
                let isCurrentlyMoving = this.moving() || (this.vel != null && this.vel.len() > 0.2);
                if (isCurrentlyMoving) {
                    this.flightAccelTimer = Math.min(180, this.flightAccelTimer + Time.delta);
                    this.wasMoving = true;
                } else {
                    if (this.wasMoving && this.flightAccelTimer > 30) {
                        fireSUVShotgun(this);
                    }
                    this.flightAccelTimer = 0;
                    this.wasMoving = false;
                }
            }

            let req = getSuv27UpgradeRequirements(this.level);
            if (this.level < this.maxLevel && this.stack != null) {
                if (this.leadAbsorbed < req.leadNeeded && this.stack.item == req.leadItem && this.stack.amount > 0) {
                    let consumeAmt = Math.min(2, this.stack.amount);
                    this.stack.amount -= consumeAmt;
                    this.leadAbsorbed += consumeAmt;
                } else if (this.siliconAbsorbed < req.siliconNeeded && this.stack.item == req.siliconItem && this.stack.amount > 0) {
                    let consumeAmt = Math.min(2, this.stack.amount);
                    this.stack.amount -= consumeAmt;
                    this.siliconAbsorbed += consumeAmt;
                }

                if (this.leadAbsorbed >= req.leadNeeded && this.siliconAbsorbed >= req.siliconNeeded) {
                    this.leadAbsorbed = 0;
                    this.siliconAbsorbed = 0;
                    this.level++;
                }
            }
        },

        draw() {
            this.super$draw();

            if (Vars.player != null && Vars.player.unit() == this) {
                let currentRange = isSUV ? (this.gunMode === 1 ? 600 : 400) : 200;
                Draw.z(Layer.power + 10);
                Draw.color(this.gunMode === 1 ? Color.valueOf("f59e0b") : Color.valueOf("c084fc"), 0.45);
                Lines.stroke(2.0);
                Lines.dashCircle(this.x, this.y, currentRange);
                Draw.reset();
            }

            if (this.transformTimer > 0) {
                let progress = 1.0 - (this.transformTimer / TRANSFORM_DELAY);
                let scale = Math.sin(progress * Math.PI);
                let maxRadius = 26 * scale;

                Draw.z(Layer.effect + 0.1);
                Draw.color(Color.valueOf("c084fc"));
                Lines.stroke(3.0 * scale);
                Lines.circle(this.x, this.y, maxRadius + 2.0);

                Draw.color(Color.valueOf("7e22ce"));
                Fill.circle(this.x, this.y, maxRadius);

                Draw.color(Color.black);
                Fill.circle(this.x, this.y, maxRadius * 0.60);
                Draw.reset();
            }
        },

        maxHealth() {
            let currentLevel = (this.level !== undefined && this.level !== null) ? this.level : 0;
            return uType.health * (1.0 + (currentLevel * 0.20));
        },

        speed() {
            let currentLevel = (this.level !== undefined && this.level !== null) ? this.level : 0;
            let baseSpeed = uType.speed * (1.0 + (currentLevel * 0.08));
            if (isSUV) {
                let accelBonus = (this.flightAccelTimer / 180.0) * 3.0;
                return baseSpeed * (1.0 + accelBonus);
            }
            return baseSpeed;
        },

        write(write) {
            this.super$write(write);
            write.b((this.level !== undefined && this.level !== null) ? this.level : 0);
            write.b((this.gunMode !== undefined && this.gunMode !== null) ? this.gunMode : 0);
            write.f((this.transformCooldown !== undefined && this.transformCooldown !== null) ? this.transformCooldown : 0);
        },

        read(read, revision) {
            this.super$read(read, revision);
            this.level = read.b();
            this.gunMode = read.b();
            this.transformCooldown = read.f();
        }
    };
}

Events.on(ClientLoadEvent, function() {
    pulseBurstEffect = new Effect(30, cons(e => {
        Draw.color(Color.valueOf("8aa3f4"), Color.valueOf("c084fc"), e.fin());
        Lines.stroke(4.0 * e.fout());
        Lines.circle(e.x, e.y, 60.0 * e.fin());
        Draw.color(Color.white, e.fout());
        Fill.circle(e.x, e.y, 18.0 * e.fout());
    }));

    healEffect = new Effect(40, cons(e => {
        Draw.color(Color.valueOf("84cc16"), Color.white, e.fin());
        Lines.stroke(3.0 * e.fout());
        Lines.circle(e.x, e.y, 25.0 * e.fin());
        Fill.circle(e.x, e.y, 10.0 * e.fout());
    }));

    pulseBulletType = new BasicBulletType(3.5, 25);
    pulseBulletType.sprite = "circle";
    pulseBulletType.lifetime = 115; 
    pulseBulletType.drag = -0.01;
    pulseBulletType.width = 9;
    pulseBulletType.height = 9;
    pulseBulletType.hitColor = Color.valueOf("8aa3f4");
    pulseBulletType.backColor = Color.valueOf("8aa3f4");
    pulseBulletType.frontColor = Color.white;

    pulseBulletType.lightning = 3;
    pulseBulletType.lightningLength = 12;
    pulseBulletType.lightningColor = Color.valueOf("8aa3f4");
    pulseBulletType.lightningDamage = 8;
    pulseBulletType.load();

    rapid8mmBulletType = new BasicBulletType(12.0, 45);
    rapid8mmBulletType.lifetime = 50; 
    rapid8mmBulletType.width = 4;
    rapid8mmBulletType.height = 14;
    rapid8mmBulletType.frontColor = Color.white;
    rapid8mmBulletType.backColor = Color.valueOf("f59e0b");
    rapid8mmBulletType.trailLength = 8;
    rapid8mmBulletType.trailWidth = 2.0;
    rapid8mmBulletType.trailColor = Color.valueOf("f59e0b");
    rapid8mmBulletType.load();

    let flareType = Vars.content.getByName(ContentType.unit, "flare");
    if (flareType != null && flareType.weapons.size > 0) {
        suvShotgunBulletType = flareType.weapons.get(0).bullet.copy();
        suvShotgunBulletType.damage = 20;
        suvShotgunBulletType.speed = 5.5;
        suvShotgunBulletType.lifetime = 60;
    }

    let suvNames = ["suv-27", "newex-suv-27"];
    let vusNames = ["vus-27", "newex-vus-27"];

    suvNames.forEach(function(name) {
        let uType = Vars.content.getByName(ContentType.unit, name);
        if (uType != null) {
            uType.health = 780;
            uType.omniMovement = true;
            uType.constructor = function() {
                return extend(Packages.mindustry.gen.UnitEntity, applyTransformLogic(this, uType, "vus-27", true));
            };
        }
    });

    vusNames.forEach(function(name) {
        let uType = Vars.content.getByName(ContentType.unit, name);
        if (uType != null) {
            uType.health = 24000;
            uType.omniMovement = true;
            uType.constructor = function() {
                return extend(Packages.mindustry.gen.LegsUnit, applyTransformLogic(this, uType, "suv-27", false));
            };

            if (uType.weapons.size >= 2) {
                let wLeft = uType.weapons.get(0);
                wLeft.reload = 10;
                if (flareType != null && flareType.weapons.size > 0) {
                    let bLeft = flareType.weapons.get(0).bullet.copy();
                    bLeft.damage = 25;
                    bLeft.speed = 6.5;
                    bLeft.lifetime = 35;
                    bLeft.frontColor = Color.white;
                    bLeft.backColor = Color.valueOf("c084fc");
                    wLeft.bullet = bLeft;
                }

                let wRight = uType.weapons.get(1);
                wRight.reload = 72;
                let bRight = new LaserBulletType(160);
                bRight.length = 240;
                bRight.width = 20;
                bRight.colors = [Color.valueOf("7e22ce"), Color.valueOf("c084fc"), Color.white];
                wRight.bullet = bRight;
            }
        }
    });

    function isControllingSpecialUnit() {
        if (!Vars.state.isGame() || Vars.player == null) return false;
        var unit = Vars.player.unit();
        if (unit == null || unit.type == null) return false;

        var name = unit.type.name;
        return name === "suv-27" || name === "newex-suv-27" || name === "vus-27" || name === "newex-vus-27";
    }

    var outerRadius = 70;
    var innerRadius = 28;

    if (Vars.mobile) {
        var moveContainer = new Table();
        moveContainer.setFillParent(true);
        moveContainer.bottom().left();

        var movePointer = -1;
        var moveStartX = 0, moveStartY = 0;
        var moveKnobX = 0, moveKnobY = 0;

        var moveJoystick = extend(Element, {
            draw() {
                this.super$draw();
                var cx = this.x + outerRadius;
                var cy = this.y + outerRadius;

                Draw.color(Color.black, 0.4);
                Fill.circle(cx, cy, outerRadius);
                Draw.color(Color.valueOf("c084fc"), 0.8);
                Lines.stroke(3);
                Lines.circle(cx, cy, outerRadius);

                Draw.color(Color.valueOf("7e22ce"), 0.9);
                Fill.circle(cx + moveKnobX, cy + moveKnobY, innerRadius);
                Draw.color(Color.white, 0.9);
                Lines.stroke(2);
                Lines.circle(cx + moveKnobX, cy + moveKnobY, innerRadius);
                Draw.reset();
            }
        });

        moveJoystick.addListener(extend(InputListener, {
            touchDown(event, x, y, pointer, button) {
                if (movePointer !== -1) return false;
                movePointer = pointer;
                moveStartX = x;
                moveStartY = y;
                moveKnobX = 0; moveKnobY = 0;
                return true;
            },
            touchDragged(event, x, y, pointer) {
                if (pointer !== movePointer) return;
                var dx = x - moveStartX;
                var dy = y - moveStartY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > outerRadius) {
                    dx = (dx / dist) * outerRadius;
                    dy = (dy / dist) * outerRadius;
                }
                moveKnobX = dx; moveKnobY = dy;
                moveX = dx / outerRadius; moveY = dy / outerRadius;
            },
            touchUp(event, x, y, pointer, button) {
                if (pointer !== movePointer) return;
                movePointer = -1;
                moveKnobX = 0; moveKnobY = 0;
                moveX = 0; moveY = 0;
            }
        }));

        moveContainer.add(moveJoystick).size(outerRadius * 2, outerRadius * 2).pad(25);
        moveContainer.visibility = boolp(isControllingSpecialUnit);
        Core.scene.add(moveContainer);
    }

    var skillContainer = new Table();
    skillContainer.setFillParent(true);
    skillContainer.bottom().left();
    skillContainer.margin(0, 150, 15, 0); 

    var btn1 = skillContainer.button("[1] TRANSFORM", Icon.refresh, Styles.defaultt, run(function() {
        if (Vars.player != null && Vars.player.unit() != null && Vars.player.unit().triggerTransform) {
            Vars.player.unit().triggerTransform();
        }
    })).size(120, 42).pad(2).color(Color.valueOf("c084fc")).get();

    btn1.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            if (unit.transformCooldown > 0) {
                btn1.setText("[1] (" + (unit.transformCooldown / 60.0).toFixed(1) + "s)");
                btn1.setDisabled(true);
            } else {
                btn1.setText("[1] TRANSFORM");
                btn1.setDisabled(false);
            }
        }
    }));

    var btn2 = skillContainer.button("[2] PULSE CONE", Icon.commandRally, Styles.defaultt, run(function() {
        if (Vars.player != null && Vars.player.unit() != null && Vars.player.unit().triggerPulseCone) {
            Vars.player.unit().triggerPulseCone();
        }
    })).size(120, 42).pad(2).color(Color.valueOf("8aa3f4")).get();

    btn2.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            if (unit.coneShotCooldown > 0) {
                btn2.setText("[2] (" + (unit.coneShotCooldown / 60.0).toFixed(1) + "s)");
                btn2.setDisabled(true);
            } else {
                btn2.setText("[2] PULSE CONE");
                btn2.setDisabled(false);
            }
        }
    }));

    var btn3 = skillContainer.button("[3] SKILL 3", Icon.up, Styles.defaultt, run(function() {
        if (Vars.player != null && Vars.player.unit() != null && Vars.player.unit().triggerHybridSkill) {
            Vars.player.unit().triggerHybridSkill();
        }
    })).size(125, 42).pad(2).color(Color.valueOf("f59e0b")).get();

    btn3.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            var unitName = unit.type ? unit.type.name : "";
            var isSUVUnit = unitName.includes("suv-27") && !unitName.includes("vus-27");

            if (unit.hybridSkillCooldown > 0) {
                var secondsLeft = (unit.hybridSkillCooldown / 60.0).toFixed(1);
                var modeText = isSUVUnit ? (unit.gunMode === 1 ? "8MM" : "PULSE") : "REPAIR";
                btn3.setText("[3] " + modeText + " (" + secondsLeft + "s)");
                btn3.setDisabled(true);
            } else {
                if (isSUVUnit) {
                    btn3.setText(unit.gunMode === 1 ? "[3] GUN: 8MM" : "[3] GUN: PULSE");
                } else {
                    btn3.setText("[3] REPAIR 1%");
                }
                btn3.setDisabled(false);
            }
        }
    }));

    skillContainer.visibility = boolp(isControllingSpecialUnit);
    Core.scene.add(skillContainer);
});