// ==========================================
// REYKOR & KECRA (UI & SKILL CONTROLLER) - SAFE SAVE/LOAD
// ==========================================
const aetherod2Sound = Vars.tree.loadSound("aetherod2");
const TRANSFORM_DELAY = 60;        
const TRANSFORM_COOLDOWN = 180;     
const SKILL2_COOLDOWN_KECRA = 600;  
const SKILL2_COOLDOWN_REYKOR = 120; 
const SKILL2_DURATION_KECRA = 900;  
const SKILL2_DURATION_REYKOR = 600; 
const BARR_SHOOT_DELAY = 120;       
const BARR_RANGE = 600;             
const DASH_COOLDOWN = 1200;         
const DASH_DISTANCE = 82;           

let moveX = 0;
let moveY = 0;

const tankaniBullet = extend(BasicBulletType, {
    speed: 15,
    damage: 900,
    width: 12,
    height: 36,
    lifetime: 60,
    frontColor: Color.valueOf("e0ea87"),
    backColor: Color.valueOf("e5ff00"),
    trailColor: Color.valueOf("daea80"),
    trailWidth: 3,
    trailLength: 10,
    hitEffect: Fx.blastExplosion,
    despawnEffect: Fx.hitBulletColor
});

function findTarget(unit) {
    return Units.closestTarget(unit.team, unit.x, unit.y, BARR_RANGE, u => u.checkTarget(true, true), b => true);
}

function transformToUnit(oldUnit, targetUnitName, remainingCooldown) {
    let targetType = Vars.content.getByName(ContentType.unit, "newex-" + targetUnitName);
    if (targetType == null) targetType = Vars.content.getByName(ContentType.unit, targetUnitName);

    if (targetType == null || !oldUnit.isValid()) return;

    let controllingPlayer = Groups.player.find(p => p.unit() == oldUnit);

    let newUnit = targetType.create(oldUnit.team);
    newUnit.set(oldUnit.x, oldUnit.y);
    newUnit.rotation = oldUnit.rotation;

    let maxH = oldUnit.maxHealth;
    let healthPercent = maxH > 0 ? (oldUnit.health / maxH) : 1.0;
    newUnit.health = newUnit.maxHealth * healthPercent;

    newUnit.add();

    if (newUnit.initUnitData) {
        newUnit.initUnitData(remainingCooldown);
    }

    oldUnit.remove();

    if (controllingPlayer != null) {
        controllingPlayer.unit(newUnit);
    }
}

function applyTransformLogic(unitEntity, uType, targetUnitName, isKecra) {
    return {
        transformTimer: 0,     
        transformCooldown: 0,  
        skill2Cooldown: 0, 
        barrTimer: 0,          
        damageBoostTimer: 0,   
        shootTimer: 0,         
        barrRecoil: 0,         
        dashCooldown: 0,       

        initUnitData(cd) {
            this.transformCooldown = cd;
        },

        triggerTransform() {
            if (this.transformCooldown <= 0 && this.transformTimer <= 0) {
                this.transformTimer = TRANSFORM_DELAY;
                this.transformCooldown = TRANSFORM_COOLDOWN;
            }
        },

        triggerSkill2() {
            if (isKecra) {
                if (this.barrTimer > 0) {
                    this.barrTimer = 0;
                    this.skill2Cooldown = SKILL2_COOLDOWN_KECRA;
                    return;
                }

                if (this.skill2Cooldown <= 0) {
                    this.skill2Cooldown = SKILL2_COOLDOWN_KECRA;
                    this.barrTimer = SKILL2_DURATION_KECRA;
                    this.shootTimer = 0;
                    this.barrRecoil = 0;
                    Call.effect(Fx.shockwave, this.x, this.y, 0, Color.valueOf("e5ff00"));
                }
            } else {
                if (this.skill2Cooldown <= 0 && this.damageBoostTimer <= 0) {
                    this.damageBoostTimer = SKILL2_DURATION_REYKOR;
                    Call.effect(Fx.overclocked, this.x, this.y, 0, Color.valueOf("c084fc"));
                }
            }
        },

        triggerDash() {
            if (this.dashCooldown <= 0) {
                this.dashCooldown = DASH_COOLDOWN;

                let startX = this.x;
                let startY = this.y;

                let dashX = Angles.trnsx(this.rotation, DASH_DISTANCE);
                let dashY = Angles.trnsy(this.rotation, DASH_DISTANCE);

                this.x += dashX;
                this.y += dashY;

                Call.effect(Fx.titanSmoke, startX, startY, this.rotation, Color.valueOf("f59e0b"));
                Call.effect(Fx.shockwave, startX, startY, 0, Color.valueOf("c084fc"));
                Call.effect(Fx.rocketSmoke, this.x, this.y, this.rotation + 180, Color.valueOf("f59e0b"));
                Call.effect(Fx.sparkShoot, this.x, this.y, this.rotation, Color.valueOf("f59e0b"));

                if (isKecra) {
                    this.damageBoostTimer = SKILL2_DURATION_REYKOR;
                    Call.effect(Fx.overclocked, this.x, this.y, 0, Color.valueOf("e5ff00"));
                } else {
                    let healAmount = this.maxHealth * 0.02;
                    this.health = Math.min(this.maxHealth, this.health + healAmount);
                    Call.effect(Fx.heal, this.x, this.y, 0, Color.green);
                }
            }
        },

        update() {
            this.super$update();

            if (this.transformCooldown > 0) this.transformCooldown -= Time.delta;
            if (this.skill2Cooldown > 0) this.skill2Cooldown -= Time.delta;
            if (this.dashCooldown > 0) this.dashCooldown -= Time.delta;

            if (this.damageBoostTimer > 0) {
                this.damageBoostTimer -= Time.delta;
                if (StatusEffects.overclock != null) {
                    this.apply(StatusEffects.overclock, 12);
                }

                if (!isKecra && this.damageBoostTimer <= 0) {
                    this.skill2Cooldown = SKILL2_COOLDOWN_REYKOR;
                }
            }

            if (isKecra) {
                if (this.barrRecoil > 0) {
                    this.barrRecoil = Math.max(0, this.barrRecoil - (6.0 / BARR_SHOOT_DELAY) * Time.delta);
                }

                if (this.barrTimer > 0) {
                    this.barrTimer -= Time.delta;
                    this.shootTimer += Time.delta;

                    this.vel.set(0, 0);

                    let target = findTarget(this);
                    if (target != null) {
                        let targetAngle = this.angleTo(target);
                        this.rotation = Angles.moveToward(this.rotation, targetAngle, 8 * Time.delta);

                        if (this.shootTimer >= BARR_SHOOT_DELAY) {
                            this.shootTimer = 0;

                            let bulletX = this.x + Angles.trnsx(this.rotation, 5);
                            let bulletY = this.y + Angles.trnsy(this.rotation, 5);

                            tankaniBullet.create(this, this.team, bulletX, bulletY, this.rotation);
                            Effect.shake(0.5, 0.5, this.x, this.y);
                            this.barrRecoil = 6.0;

                            // GẮN ÂM THANH AETHEROD2 KHI BẮN
if (aetherod2Sound != null) {
    aetherod2Sound.at(this.x, this.y);
}
                        }
                    }
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

            // TỰ ĐỘNG XOAY THÂN THEO HƯỚNG DI CHUYỂN DẠNG NHỆN KHI KHÔNG BẮN SKILL 2
            if (this.moving() || (this.vel != null && this.vel.len() > 0.1)) {
                if (!isKecra || this.barrTimer <= 0) {
                    let moveAngle = this.vel.angle();
                    this.rotation = Angles.moveToward(this.rotation, moveAngle, uType.rotateSpeed * Time.delta);
                }
            }

            if (Vars.player != null && Vars.player.unit() == this) {
                if (Core.input.keyTap(KeyCode.num1)) this.triggerTransform();
                if (Core.input.keyTap(KeyCode.num2)) this.triggerSkill2();
                if (Core.input.keyTap(KeyCode.num3)) this.triggerDash();

                if (Vars.mobile && (moveX !== 0 || moveY !== 0)) {
                    if (!isKecra || this.barrTimer <= 0) {
                        let moveSpeed = this.speed();
                        this.moveAt(Tmp.v1.set(moveX, moveY).setLength(moveSpeed));
                        
                        // Xoay thân theo joystick điều khiển mobile
                        let moveAngle = Tmp.v1.set(moveX, moveY).angle();
                        this.rotation = Angles.moveToward(this.rotation, moveAngle, uType.rotateSpeed * Time.delta);
                    }
                }
            }
        },

        draw() {
            if (isKecra && this.barrTimer > 0) {
                let totalOffsetY = 20.0 - this.barrRecoil;
                let drawX = this.x + Angles.trnsx(this.rotation, totalOffsetY);
                let drawY = this.y + Angles.trnsy(this.rotation, totalOffsetY);

                let barrRegion = Core.atlas.find(uType.name + "-barr", uType.name);
                if (barrRegion.found()) {
                    Draw.z(Layer.legUnit - 0.95);
                    Draw.rect(barrRegion, drawX, drawY, this.rotation - 90);
                }

                let bakrrrRegion = Core.atlas.find(uType.name + "-bakrrr", uType.name);
                if (bakrrrRegion.found()) {
                    Draw.z(Layer.legUnit - 0.9); 
                    Draw.rect(bakrrrRegion, this.x, this.y, this.rotation - 90);
                }

                Draw.z(Layer.effect);
                Draw.color(Color.valueOf("e5ff00"), 0.3);
                Lines.stroke(1.5);
                Lines.circle(this.x, this.y, BARR_RANGE);
                Draw.reset();
            }

            this.super$draw();

            // GIỐNG HIỆU ỨNG HỐ ĐEN KHI BIẾN HÌNH TỪ SUV-27
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

        write(write) {
            this.super$write(write);
        },

        read(read, revision) {
            this.super$read(read, revision);
        }
    };
}

Events.on(ClientLoadEvent, function() {
    let kecraNames = ["kecra", "newex-kecra"];
    let reykorNames = ["reykor", "newex-reykor"];

    kecraNames.forEach(function(name) {
        let uType = Vars.content.getByName(ContentType.unit, name);
        if (uType != null) {
            uType.constructor = function() {
                return extend(Packages.mindustry.gen.LegsUnit, applyTransformLogic(this, uType, "reykor", true));
            };
        }
    });

    reykorNames.forEach(function(name) {
        let uType = Vars.content.getByName(ContentType.unit, name);
        if (uType != null) {
            uType.constructor = function() {
                return extend(Packages.mindustry.gen.MechUnit, applyTransformLogic(this, uType, "kecra", false));
            };
        }
    });

    function isControllingSpecialUnit() {
        if (!Vars.state.isGame() || Vars.player == null) return false;
        var unit = Vars.player.unit();
        if (unit == null || unit.type == null) return false;

        var name = unit.type.name;
        return name === "kecra" || name === "newex-kecra" || name === "reykor" || name === "newex-reykor";
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
                moveStartX = x; moveStartY = y;
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

    var btn2 = skillContainer.button("[2] SKILL 2", Icon.commandRally, Styles.defaultt, run(function() {
        if (Vars.player != null && Vars.player.unit() != null && Vars.player.unit().triggerSkill2) {
            Vars.player.unit().triggerSkill2();
        }
    })).size(135, 42).pad(2).color(Color.valueOf("e5ff00")).get();

    btn2.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            var unitName = unit.type ? unit.type.name : "";
            var isKecraUnit = unitName.includes("kecra") && !unitName.includes("reykor");

            if (isKecraUnit) {
                if (unit.barrTimer > 0) {
                    btn2.setText("[2] CANCEL (" + (unit.barrTimer / 60.0).toFixed(1) + "s)");
                    btn2.setDisabled(false);
                } else if (unit.skill2Cooldown > 0) {
                    btn2.setText("[2] (" + (unit.skill2Cooldown / 60.0).toFixed(1) + "s)");
                    btn2.setDisabled(true);
                } else {
                    btn2.setText("[2] BARR MODE");
                    btn2.setDisabled(false);
                }
            } else {
                if (unit.damageBoostTimer > 0) {
                    btn2.setText("[2] DMG +10% (" + (unit.damageBoostTimer / 60.0).toFixed(1) + "s)");
                    btn2.setDisabled(true);
                } else if (unit.skill2Cooldown > 0) {
                    btn2.setText("[2] CD (" + (unit.skill2Cooldown / 60.0).toFixed(1) + "s)");
                    btn2.setDisabled(true);
                } else {
                    btn2.setText("[2] DMG +10%");
                    btn2.setDisabled(false);
                }
            }
        }
    }));

    var btn3 = skillContainer.button("[3] DASH", Icon.up, Styles.defaultt, run(function() {
        if (Vars.player != null && Vars.player.unit() != null && Vars.player.unit().triggerDash) {
            Vars.player.unit().triggerDash();
        }
    })).size(125, 42).pad(2).color(Color.valueOf("f59e0b")).get();

    btn3.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();

            if (unit.dashCooldown > 0) {
                var secondsLeft = (unit.dashCooldown / 60.0).toFixed(1);
                btn3.setText("[3] DASH (" + secondsLeft + "s)");
                btn3.setDisabled(true);
            } else {
                btn3.setText("[3] DASH 82PX");
                btn3.setDisabled(false);
            }
        }
    }));

    skillContainer.visibility = boolp(isControllingSpecialUnit);
    Core.scene.add(skillContainer);
});