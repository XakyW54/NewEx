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

// Bảng lưu trữ trạng thái Custom JS cho từng Unit ID
const unitDataMap = {};

function getUnitData(unit) {
    if (!unit || unit.id === undefined) return null;
    let id = unit.id;
    if (!unitDataMap[id]) {
        unitDataMap[id] = {
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
            lastTapTimeInternal: 0
        };
    }
    return unitDataMap[id];
}

function sendSkillCommand(action) {
    if (Vars.net.client()) {
        Call.sendChatMessage("/suv_action " + action);
    } else if (Vars.player != null && Vars.player.unit() != null) {
        executeUnitAction(Vars.player.unit(), action);
    }
}

function transformToUnit(oldUnit, targetUnitName, remainingCooldown) {
    if (Vars.net.client() || !oldUnit || !oldUnit.isValid()) return;

    let targetType = Vars.content.getByName(ContentType.unit, "newex-" + targetUnitName)
                  || Vars.content.getByName(ContentType.unit, targetUnitName);

    if (targetType == null) return;

    let oldData = getUnitData(oldUnit);
    let savedLevel = oldData ? oldData.level : 0;
    let savedLead = oldData ? oldData.leadAbsorbed : 0;
    let savedSilicon = oldData ? oldData.siliconAbsorbed : 0;

    let controllingPlayer = Groups.player.find(p => p.unit() == oldUnit);

    let oldX = oldUnit.x;
    let oldY = oldUnit.y;
    let oldRot = oldUnit.rotation;
    let oldTeam = oldUnit.team;
    let healthPercent = oldUnit.maxHealth > 0 ? (oldUnit.health / oldUnit.maxHealth) : 1.0;

    // 1. Khởi tạo Unit mới tại vị trí cũ
    let newUnit = targetType.create(oldTeam);
    newUnit.set(oldX, oldY);
    newUnit.rotation = oldRot;
    newUnit.health = newUnit.maxHealth * healthPercent;
    newUnit.add();

    // 2. Chuyển quyền điều khiển của Player sang Unit mới
    if (controllingPlayer != null) {
        controllingPlayer.unit(newUnit);
    }

    // 3. Gọi lệnh hủy Unit cũ đồng bộ qua mạng gửi tới tất cả Client
    delete unitDataMap[oldUnit.id];
    Call.unitDestroy(oldUnit.id);
    if (oldUnit.added) oldUnit.remove();

    // 4. Gán dữ liệu Custom JS cho Unit mới
    let newData = getUnitData(newUnit);
    if (newData) {
        newData.level = savedLevel;
        newData.leadAbsorbed = savedLead;
        newData.siliconAbsorbed = savedSilicon;
        newData.transformCooldown = remainingCooldown;
    }
}

function fireSUVShotgun(unit) {
    if (suvShotgunBulletType == null) return;

    let bulletCount = Mathf.random(12, 16); 
    for (let i = 0; i < bulletCount; i++) {
        let spreadAngle = unit.rotation + Mathf.range(10);
        Call.createBullet(suvShotgunBulletType, unit.team, unit.x, unit.y, spreadAngle, suvShotgunBulletType.damage, 1, 1);
    }
}

function executeUnitAction(unit, action) {
    if (unit == null) return;
    let data = getUnitData(unit);
    if (!data) return;

    let isSUV = unit.type && unit.type.name && unit.type.name.includes("suv-27") && !unit.type.name.includes("vus-27");

    if (action === "transform") {
        if (data.transformCooldown <= 0 && data.transformTimer <= 0) {
            if (isSUV && data.flightAccelTimer > 30) {
                fireSUVShotgun(unit);
            }
            data.transformTimer = TRANSFORM_DELAY;
            data.transformCooldown = TRANSFORM_COOLDOWN;
        }
    } else if (action === "pulse_cone") {
        if (data.coneShotCooldown <= 0) {
            data.coneShotCooldown = CONE_SHOT_COOLDOWN;
            if (pulseBurstEffect != null) Call.effect(pulseBurstEffect, unit.x, unit.y, 0, Color.white);

            if (pulseBulletType != null) {
                let bulletCount = 20;
                let spread = 12.0; 
                let baseAngle = unit.rotation;
                for (let i = 0; i < bulletCount; i++) {
                    let fireAngle = baseAngle + Mathf.range(spread / 2.0);
                    Call.createBullet(pulseBulletType, unit.team, unit.x, unit.y, fireAngle, pulseBulletType.damage, 1, 1);
                }
            }
        }
    } else if (action === "hybrid_skill") {
        if (data.hybridSkillCooldown <= 0) {
            if (isSUV) {
                data.gunMode = data.gunMode === 0 ? 1 : 0;
                data.hybridSkillCooldown = HYBRID_SKILL_COOLDOWN;
            } else {
                data.hybridSkillCooldown = HYBRID_SKILL_COOLDOWN;
                let healAmount = unit.maxHealth * 0.01;
                unit.health = Math.min(unit.maxHealth, unit.health + healAmount);
                if (healEffect != null) Call.effect(healEffect, unit.x, unit.y, 0, Color.white);
            }
        }
    } else if (action === "double_tap") {
        if (data.doubleTapCooldown <= 0) {
            data.doubleTapCooldown = DOUBLE_TAP_COOLDOWN;
            if (isSUV) {
                let rocketType = Vars.content.getByName(ContentType.unit, "newex-vus-27-rocket") || Vars.content.getByName(ContentType.unit, "vus-27-rocket");
                if (rocketType != null) {
                    try {
                        let sideOffset = 12;
                        let rx1 = unit.x + Angles.trnsx(unit.rotation + 90, sideOffset);
                        let ry1 = unit.y + Angles.trnsy(unit.rotation + 90, sideOffset);
                        let r1 = rocketType.create(unit.team);
                        r1.set(rx1, ry1);
                        r1.rotation = unit.rotation;
                        r1.add();

                        let rx2 = unit.x + Angles.trnsx(unit.rotation - 90, sideOffset);
                        let ry2 = unit.y + Angles.trnsy(unit.rotation - 90, sideOffset);
                        let r2 = rocketType.create(unit.team);
                        r2.set(rx2, ry2);
                        r2.rotation = unit.rotation;
                        r2.add();
                    } catch(e) {}
                }
                Call.effect(Fx.shootBig, unit.x, unit.y, unit.rotation, Color.white);
            } else {
                unit.vel.add(Angles.trnsx(unit.rotation, 8), Angles.trnsy(unit.rotation, 8));
                let healAmount = unit.maxHealth * 0.01;
                unit.health = Math.min(unit.maxHealth, unit.health + healAmount);
                Call.effect(Fx.sparkExplosion, unit.x, unit.y, unit.rotation, Color.white);
                if (healEffect != null) Call.effect(healEffect, unit.x, unit.y, 0, Color.white);
            }
        }
    }
}

function applyTransformLogic(unitEntity, uType, targetUnitName, isSUV) {
    return {
        update() {
            this.super$update();
            let data = getUnitData(this);
            if (!data) return;

            if (data.transformCooldown > 0) data.transformCooldown -= Time.delta;
            if (data.coneShotCooldown > 0) data.coneShotCooldown -= Time.delta;
            if (data.hybridSkillCooldown > 0) data.hybridSkillCooldown -= Time.delta;
            if (data.doubleTapCooldown > 0) data.doubleTapCooldown -= Time.delta;

            if (data.transformTimer > 0) {
                data.transformTimer -= Time.delta;
                this.vel.set(0, 0);

                if (data.transformTimer <= 0) {
                    data.transformTimer = 0;
                    if (!Vars.net.client()) {
                        transformToUnit(this, targetUnitName, data.transformCooldown);
                    }
                    return;
                }
            }

            if (Vars.player != null && Vars.player.unit() == this) {
                if (Core.input.keyTap(KeyCode.num1)) sendSkillCommand("transform");
                if (Core.input.keyTap(KeyCode.num2)) sendSkillCommand("pulse_cone");
                if (Core.input.keyTap(KeyCode.num3)) sendSkillCommand("hybrid_skill");

                if (Core.input.justTouched()) {
                    let now = Time.millis();
                    if (now - data.lastTapTimeInternal < 300) {
                        sendSkillCommand("double_tap");
                    }
                    data.lastTapTimeInternal = now;
                }

                if (Vars.mobile) {
                    Core.camera.position.set(this.x, this.y);
                    if (moveX !== 0 || moveY !== 0) {
                        let moveSpeed = this.speed();
                        this.moveAt(Tmp.v1.set(moveX, moveY).setLength(moveSpeed));
                    }
                }
            }

            if (!Vars.net.client()) {
                let currentRange = isSUV ? (data.gunMode === 1 ? 600 : 400) : 200;
                let target = Units.closestTarget(this.team, this.x, this.y, currentRange, u => u.checkTarget(this.type.targetAir, this.type.targetGround));

                if (target != null) {
                    let targetAngle = Angles.angle(this.x, this.y, target.x, target.y);
                    this.rotation = Angles.moveToward(this.rotation, targetAngle, this.type.rotateSpeed * Time.delta);

                    this.aim(target.x, target.y);
                    this.isShooting = true;

                    if (isSUV) {
                        data.autoPulseTimer += Time.delta;
                        if (data.gunMode === 0) {
                            if (data.autoPulseTimer >= 30) { 
                                data.autoPulseTimer = 0;
                                if (pulseBulletType != null) {
                                    Call.createBullet(pulseBulletType, this.team, this.x, this.y, targetAngle, pulseBulletType.damage, 1, 1);
                                }
                            }
                        } else {
                            if (data.autoPulseTimer >= 5) {
                                data.autoPulseTimer = 0;
                                if (rapid8mmBulletType != null) {
                                    let spreadAngle = targetAngle + Mathf.range(3.5);
                                    Call.createBullet(rapid8mmBulletType, this.team, this.x, this.y, spreadAngle, rapid8mmBulletType.damage, 1, 1);
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
                    data.autoPulseTimer = 0;
                    if (this.mounts != null && this.mounts.length > 0) {
                        for (let i = 0; i < this.mounts.length; i++) {
                            this.mounts[i].shoot = false;
                        }
                    }
                }

                if (!isSUV) {
                    if (this.isShooting) {
                        if (data.overdriveTimer <= 0) {
                            data.firingDuration += Time.delta;
                            if (data.firingDuration >= 120) { 
                                data.overdriveTimer = 60;    
                                data.firingDuration = 0;
                            }
                        }
                    } else {
                        data.firingDuration = Math.max(0, data.firingDuration - Time.delta * 2);
                    }

                    if (data.overdriveTimer > 0) {
                        data.overdriveTimer -= Time.delta;
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
                        data.flightAccelTimer = Math.min(180, data.flightAccelTimer + Time.delta);
                        data.wasMoving = true;
                    } else {
                        if (data.wasMoving && data.flightAccelTimer > 30) {
                            fireSUVShotgun(this);
                        }
                        data.flightAccelTimer = 0;
                        data.wasMoving = false;
                    }
                }

                let req = getSuv27UpgradeRequirements(data.level);
                if (data.level < data.maxLevel && this.stack != null) {
                    if (data.leadAbsorbed < req.leadNeeded && this.stack.item == req.leadItem && this.stack.amount > 0) {
                        let consumeAmt = Math.min(2, this.stack.amount);
                        this.stack.amount -= consumeAmt;
                        data.leadAbsorbed += consumeAmt;
                    } else if (data.siliconAbsorbed < req.siliconNeeded && this.stack.item == req.siliconItem && this.stack.amount > 0) {
                        let consumeAmt = Math.min(2, this.stack.amount);
                        this.stack.amount -= consumeAmt;
                        data.siliconAbsorbed += consumeAmt;
                    }

                    if (data.leadAbsorbed >= req.leadNeeded && data.siliconAbsorbed >= req.siliconNeeded) {
                        data.leadAbsorbed = 0;
                        data.siliconAbsorbed = 0;
                        data.level++;
                    }
                }
            }
        },

        draw() {
            this.super$draw();
            let data = getUnitData(this);
            if (!data) return;

            if (Vars.player != null && Vars.player.unit() == this) {
                let currentRange = isSUV ? (data.gunMode === 1 ? 600 : 400) : 200;
                Draw.z(Layer.power + 10);
                Draw.color(data.gunMode === 1 ? Color.valueOf("f59e0b") : Color.valueOf("c084fc"), 0.45);
                Lines.stroke(2.0);
                Lines.dashCircle(this.x, this.y, currentRange);
                Draw.reset();
            }

            if (data.transformTimer > 0) {
                let progress = 1.0 - (data.transformTimer / TRANSFORM_DELAY);
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
            let data = getUnitData(this);
            let currentLevel = data ? data.level : 0;
            return uType.health * (1.0 + (currentLevel * 0.20));
        },

        speed() {
            let data = getUnitData(this);
            let currentLevel = data ? data.level : 0;
            let baseSpeed = uType.speed * (1.0 + (currentLevel * 0.08));
            if (isSUV && data) {
                let accelBonus = (data.flightAccelTimer / 180.0) * 3.0;
                return baseSpeed * (1.0 + accelBonus);
            }
            return baseSpeed;
        }
    };
}

Events.on(PlayerChatEvent, event => {
    if (event.message != null && event.message.startsWith("/suv_action ")) {
        let action = event.message.replace("/suv_action ", "").trim();
        let player = event.player;

        if (player != null && player.unit() != null) {
            executeUnitAction(player.unit(), action);
        }
    }
});

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
        sendSkillCommand("transform");
    })).size(120, 42).pad(2).color(Color.valueOf("c084fc")).get();

    btn1.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            var data = getUnitData(unit);
            var cd = data ? data.transformCooldown : 0;
            if (cd > 0) {
                btn1.setText("[1] (" + (cd / 60.0).toFixed(1) + "s)");
                btn1.setDisabled(true);
            } else {
                btn1.setText("[1] TRANSFORM");
                btn1.setDisabled(false);
            }
        }
    }));

    var btn2 = skillContainer.button("[2] PULSE CONE", Icon.commandRally, Styles.defaultt, run(function() {
        sendSkillCommand("pulse_cone");
    })).size(120, 42).pad(2).color(Color.valueOf("8aa3f4")).get();

    btn2.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            var data = getUnitData(unit);
            var cd = data ? data.coneShotCooldown : 0;
            if (cd > 0) {
                btn2.setText("[2] (" + (cd / 60.0).toFixed(1) + "s)");
                btn2.setDisabled(true);
            } else {
                btn2.setText("[2] PULSE CONE");
                btn2.setDisabled(false);
            }
        }
    }));

    var btn3 = skillContainer.button("[3] SKILL 3", Icon.up, Styles.defaultt, run(function() {
        sendSkillCommand("hybrid_skill");
    })).size(125, 42).pad(2).color(Color.valueOf("f59e0b")).get();

    btn3.update(run(function() {
        if (Vars.player != null && Vars.player.unit() != null) {
            var unit = Vars.player.unit();
            var data = getUnitData(unit);
            var unitName = unit.type ? unit.type.name : "";
            var isSUVUnit = unitName.includes("suv-27") && !unitName.includes("vus-27");
            var cd = data ? data.hybridSkillCooldown : 0;
            var mode = data ? data.gunMode : 0;

            if (cd > 0) {
                var secondsLeft = (cd / 60.0).toFixed(1);
                var modeText = isSUVUnit ? (mode === 1 ? "8MM" : "PULSE") : "REPAIR";
                btn3.setText("[3] " + modeText + " (" + secondsLeft + "s)");
                btn3.setDisabled(true);
            } else {
                if (isSUVUnit) {
                    btn3.setText(mode === 1 ? "[3] GUN: 8MM" : "[3] GUN: PULSE");
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