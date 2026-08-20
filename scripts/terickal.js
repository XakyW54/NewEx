// ==========================================
// TERICKAL & HERICKAL (FIXED ALL SHIELD FX CRASH)
// ==========================================

function getTerickalUpgradeRequirements(currentLevel) {
    return {
        leadNeeded: 340 + (currentLevel * 100),
        siliconNeeded: 400 + (currentLevel * 120),
        leadItem: Items.lead,
        siliconItem: Items.silicon
    };
}

const TRANSFORM_DELAY = 60;    
const TRANSFORM_COOLDOWN = 180; 
const SKILL_2_COOLDOWN = 1800; // 30s
const SHIELD_SKILL_COOLDOWN = 1200; // 20s
const DOUBLE_TAP_COOLDOWN = 60; 

let homingRectangleBullet = null;

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

function applyTransformLogic(unitEntity, uType, targetUnitName, isHerickal) {
    return {
        isGalileoJS: true,     
        level: 0,              
        maxLevel: 10,          
        leadAbsorbed: 0,       
        siliconAbsorbed: 0,    
        
        transformTimer: 0,     
        transformCooldown: 0,  
        skill2Cooldown: 0, 
        shieldSkillCooldown: 0, 
        doubleTapCooldown: 0,

        // Buff Tốc độ Herickal State
        herickalSpeedBoost: 0,      
        herickalBoostTimer: 0,      
        herickalBoostDuration: 0,   
        isBoostingSpeed: false,
        autoShootTimer: 0,          

        // Shield state
        shieldHealth: 0,            
        maxShieldHealth: 8000,
        shieldActive: false,

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

            if (isHerickal) {
                let rocketType = Vars.content.getByName(ContentType.unit, "newex-terickal-rocket");
                if (rocketType == null) rocketType = Vars.content.getByName(ContentType.unit, "terickal-rocket");

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
            }
        },

        triggerTransform() {
            if (this.transformCooldown <= 0 && this.transformTimer <= 0) {
                this.transformTimer = TRANSFORM_DELAY;
                this.transformCooldown = TRANSFORM_COOLDOWN;
            }
        },

        triggerPulseCone() {
            if (this.skill2Cooldown <= 0) {
                this.skill2Cooldown = SKILL_2_COOLDOWN; 

                if (isHerickal) {
                    this.vel.add(Angles.trnsx(this.rotation, 10), Angles.trnsy(this.rotation, 10));

                    this.herickalSpeedBoost = 0.20; 
                    this.herickalBoostTimer = 0;
                    this.herickalBoostDuration = 1200; 
                    this.isBoostingSpeed = true;

                    Call.effect(Fx.generate, this.x, this.y, this.rotation, Color.valueOf("38bdf8"));
                }
            }
        },

        triggerHybridSkill() {
            if (this.shieldSkillCooldown <= 0) {
                this.shieldSkillCooldown = SHIELD_SKILL_COOLDOWN; 
                this.shieldActive = true;
                this.shieldHealth = this.maxShieldHealth; 

                Call.effect(Fx.shieldApply, this.x, this.y, this.hitSize * 2.2, Color.valueOf("38bdf8"));
            }
        },

        damage(amount) {
            if (this.shieldActive && this.shieldHealth > 0) {
                if (amount <= this.shieldHealth) {
                    this.shieldHealth -= amount;
                    // Dùng Fx.sparkExplosion an toàn 100%, không lo văng game
                    Call.effect(Fx.sparkExplosion, this.x, this.y, 0, Color.valueOf("38bdf8"));
                    return;
                } else {
                    amount -= this.shieldHealth;
                    this.shieldHealth = 0;
                    this.shieldActive = false;
                }
            }
            this.super$damage(amount);
        },

        update() {
            this.super$update();

            if (this.transformCooldown > 0) this.transformCooldown -= Time.delta;
            if (this.skill2Cooldown > 0) this.skill2Cooldown -= Time.delta;
            if (this.shieldSkillCooldown > 0) this.shieldSkillCooldown -= Time.delta;
            if (this.doubleTapCooldown > 0) this.doubleTapCooldown -= Time.delta;

            if (isHerickal && this.isBoostingSpeed) {
                this.herickalBoostDuration -= Time.delta;

                if (this.herickalSpeedBoost < 2.00) {
                    this.herickalBoostTimer += Time.delta;
                    if (this.herickalBoostTimer >= 30) { 
                        this.herickalBoostTimer = 0;
                        this.herickalSpeedBoost = Math.min(2.00, this.herickalSpeedBoost + 0.20);
                    }
                }

                this.autoShootTimer += Time.delta;
                if (this.autoShootTimer >= 10) { 
                    this.autoShootTimer = 0;
                    let speedTarget = Units.closestTarget(this.team, this.x, this.y, 400, u => u.checkTarget(this.type.targetAir, this.type.targetGround));
                    if (speedTarget != null && homingRectangleBullet != null) {
                        let shootAngle = Angles.angle(this.x, this.y, speedTarget.x, speedTarget.y);
                        
                        let leftX = this.x + Angles.trnsx(this.rotation + 90, 5);
                        let leftY = this.y + Angles.trnsy(this.rotation + 90, 5);
                        homingRectangleBullet.create(this, this.team, leftX, leftY, shootAngle);

                        let rightX = this.x + Angles.trnsx(this.rotation - 90, 5);
                        let rightY = this.y + Angles.trnsy(this.rotation - 90, 5);
                        homingRectangleBullet.create(this, this.team, rightX, rightY, shootAngle);
                    }
                }

                if (this.moving()) {
                    let backX = this.x + Angles.trnsx(this.rotation + 180, this.hitSize * 0.8);
                    let backY = this.y + Angles.trnsy(this.rotation + 180, this.hitSize * 0.8);

                    Call.effect(Fx.trailFade, backX, backY, 14, Color.valueOf("38bdf8"));
                    
                    if (Mathf.chance(0.5)) {
                        Call.effect(Fx.reactorsmoke, backX, backY, this.rotation + 180, Color.valueOf("38bdf8"));
                    }
                }

                if (this.herickalBoostDuration <= 0) {
                    this.herickalSpeedBoost = 0;
                    this.isBoostingSpeed = false;
                    this.autoShootTimer = 0;
                }
            }

            if (this.shieldActive) {
                if (this.shieldHealth < this.maxShieldHealth) {
                    this.shieldHealth = Math.min(this.maxShieldHealth, this.shieldHealth + (100 / 60) * Time.delta);
                }
            }

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
                        let moveSpeed = this.prefSpeed();
                        this.moveAt(Tmp.v1.set(moveX, moveY).setLength(moveSpeed));
                    }
                }
            }

            let currentRange = isHerickal ? 400 : 200;
            let target = Units.closestTarget(this.team, this.x, this.y, currentRange, u => u.checkTarget(this.type.targetAir, this.type.targetGround));

            if (target != null) {
                let targetAngle = Angles.angle(this.x, this.y, target.x, target.y);
                this.rotation = Angles.moveToward(this.rotation, targetAngle, this.type.rotateSpeed * Time.delta);

                this.aim(target.x, target.y);
                this.isShooting = true;
            } else {
                if (Vars.mobile && (moveX !== 0 || moveY !== 0)) {
                    let moveAngle = Tmp.v1.set(moveX, moveY).angle();
                    this.rotation = Angles.moveToward(this.rotation, moveAngle, this.type.rotateSpeed * Time.delta);
                }
                this.isShooting = false;
            }

            let req = getTerickalUpgradeRequirements(this.level);
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
                let currentRange = isHerickal ? 400 : 200;
                Draw.z(Layer.power + 10);
                Draw.color(Color.valueOf("38bdf8"), 0.45);
                Lines.stroke(2.0);
                Lines.dashCircle(this.x, this.y, currentRange);
                Draw.reset();
            }

            if (isHerickal && this.isBoostingSpeed) {
                Draw.z(Layer.effect);
                let speedAlpha = 0.4 + Math.sin(Time.time / 3) * 0.25; 
                let boostRadius = this.hitSize * 1.8;

                Draw.color(Color.valueOf("38bdf8"), speedAlpha);
                Lines.stroke(3.0);
                Lines.circle(this.x, this.y, boostRadius);
                Draw.reset();
            }

            if (this.shieldActive && this.shieldHealth > 0) {
                let shieldRadius = this.hitSize * 2.2;
                let alpha = (this.shieldHealth / this.maxShieldHealth) * 0.5 + 0.25;

                Draw.z(Layer.shields);
                Draw.color(Color.valueOf("38bdf8"), alpha);
                Fill.circle(this.x, this.y, shieldRadius);
                Draw.color(Color.white, alpha + 0.2);
                Lines.stroke(1.5);
                Lines.circle(this.x, this.y, shieldRadius);
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

        prefSpeed() {
            let currentLevel = (this.level !== undefined && this.level !== null) ? this.level : 0;
            let baseSpeed = uType.speed * (1.0 + (currentLevel * 0.08));
            
            if (isHerickal) {
                return baseSpeed * (1.0 + this.herickalSpeedBoost);
            }
            return baseSpeed;
        },

        speed() {
            return this.prefSpeed();
        },

        write(write) {
            this.super$write(write);
            try {
                write.i(this.level || 0);
                write.f(this.transformCooldown || 0);
                write.f(this.shieldHealth || 0);
            } catch (e) {
                Log.err("Write error: " + e);
            }
        },

        read(read, revision) {
            this.super$read(read, revision);
            try {
                this.level = read.i();
                this.transformCooldown = read.f();
                this.shieldHealth = read.f();
                if (this.shieldHealth > 0) this.shieldActive = true;
            } catch (e) {
                Log.err("Read error: " + e);
            }
        }
    };
}

Events.on(ClientLoadEvent, function() {
    homingRectangleBullet = new BasicBulletType(8.0, 35);
    homingRectangleBullet.width = 5;
    homingRectangleBullet.height = 12;
    homingRectangleBullet.lifetime = 60;
    homingRectangleBullet.frontColor = Color.white;
    homingRectangleBullet.backColor = Color.valueOf("38bdf8");
    homingRectangleBullet.trailColor = Color.valueOf("38bdf8");
    homingRectangleBullet.trailLength = 6;
    homingRectangleBullet.trailWidth = 1.8;
    
    homingRectangleBullet.homingPower = 0.25;  
    homingRectangleBullet.homingRange = 400;   
    homingRectangleBullet.load();

    let terickalNames = ["terickal", "newex-terickal"];
    let herickalNames = ["herickal", "newex-herickal"];

    terickalNames.forEach(function(name) {
        let uType = Vars.content.getByName(ContentType.unit, name);
        if (uType != null) {
            uType.health = 24000;
            uType.omniMovement = false;
            uType.constructor = function() {
                return extend(Packages.mindustry.gen.TankUnit, applyTransformLogic(this, uType, "herickal", false));
            };
        }
    });

    herickalNames.forEach(function(name) {
        let uType = Vars.content.getByName(ContentType.unit, name);
        if (uType != null) {
            uType.health = 780;
            uType.omniMovement = true;
            uType.constructor = function() {
                return extend(Packages.mindustry.gen.UnitEntity, applyTransformLogic(this, uType, "terickal", true));
            };
        }
    });

    function isControllingSpecialUnit() {
        if (!Vars.state.isGame() || Vars.player == null) return false;
        var unit = Vars.player.unit();
        if (unit == null || unit.type == null) return false;

        var name = unit.type.name;
        return name === "terickal" || name === "newex-terickal" || name === "herickal" || name === "newex-herickal";
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

    var btn2 = skillContainer.button("[2] DASH & BOOST", Icon.commandRally, Styles.defaultt, run(function() {
        if (Vars.player != null && Vars.player.unit() != null && Vars.player.unit().triggerPulseCone) {
            Vars.player.unit().triggerPulseCone();
        }
    })).size(130, 42).pad(2).color(Color.valueOf("38bdf8")).get();

    btn2.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            if (unit.skill2Cooldown > 0) {
                btn2.setText("[2] (" + (unit.skill2Cooldown / 60.0).toFixed(1) + "s)");
                btn2.setDisabled(true);
            } else {
                btn2.setText("[2] DASH & BOOST");
                btn2.setDisabled(false);
            }
        }
    }));

    var btn3 = skillContainer.button("[3] SHIELD", Icon.defense, Styles.defaultt, run(function() {
        if (Vars.player != null && Vars.player.unit() != null && Vars.player.unit().triggerHybridSkill) {
            Vars.player.unit().triggerHybridSkill();
        }
    })).size(125, 42).pad(2).color(Color.valueOf("38bdf8")).get();

    btn3.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            if (unit.shieldSkillCooldown > 0) {
                var secondsLeft = (unit.shieldSkillCooldown / 60.0).toFixed(1);
                btn3.setText("[3] SHIELD (" + secondsLeft + "s)");
                btn3.setDisabled(true);
            } else {
                btn3.setText("[3] SHIELD 8000");
                btn3.setDisabled(false);
            }
        }
    }));

    skillContainer.visibility = boolp(isControllingSpecialUnit);
    Core.scene.add(skillContainer);
});