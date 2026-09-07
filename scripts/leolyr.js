function getLeolyrUpgradeRequirements(currentLevel) {
    return {
        copperNeeded: 400,
        siliconNeeded: 400,
        copperItem: Items.copper,
        siliconItem: Items.silicon
    };
}

const leolyrLeftBullet = extend(BasicBulletType, { speed: 9.0, damage: 15, width: 6, height: 11, lifetime: 35 });
const leolyrRightBullet = extend(BasicBulletType, { speed: 9.0, damage: 65, width: 6, height: 11, lifetime: 35 });

const leolyrDoubleTapInterval = 250; 
let leolyrStarSpeedsMap = new ObjectMap();

// Bảng lưu trạng thái Custom JS cho Leolyr
const leolyrDataMap = {};

function getLeolyrData(unit) {
    if (!unit || unit.id === undefined) return null;
    let id = unit.id;
    if (!leolyrDataMap[id]) {
        leolyrDataMap[id] = {
            level: 0,
            maxLevel: 10,
            copperAbsorbed: 0,
            siliconAbsorbed: 0,
            shotCount: 0,
            dashCooldown: 0,
            maxCooldownRecord: 300,
            shieldHealth: 0,
            hexSize: 5.5,
            ignoreNextDamage: false,
            myStaticShields: [],
            lastTapTimeInternal: 0,
            mk2TargetX: 0,
            mk2TargetY: 0,
            isMarkedMK2: false,
            wasTouchedPrev: false
        };
    }
    return leolyrDataMap[id];
}

function getSafeDashTarget(startX, startY, targetX, targetY) {
    let distance = Mathf.dst(startX, startY, targetX, targetY);
    let angle = Angles.angle(startX, startY, targetX, targetY);
    
    let endTile = Vars.world.tileWorld(targetX, targetY);
    let isEndTileTerrain = endTile != null && endTile.solid() && endTile.build == null;

    if (!isEndTileTerrain) {
        return { x: targetX, y: targetY };
    }

    let step = 4.0; 
    let currentDist = 0;

    while (currentDist < distance) {
        currentDist += step;
        if (currentDist > distance) currentDist = distance;

        let checkX = startX + Angles.trnsx(angle, currentDist);
        let checkY = startY + Angles.trnsy(angle, currentDist);

        let tile = Vars.world.tileWorld(checkX, checkY);
        let isTerrainWall = tile != null && tile.solid() && tile.build == null;

        if (isTerrainWall) {
            let safeDist = Math.max(0, currentDist - step - 6.0);
            return {
                x: startX + Angles.trnsx(angle, safeDist),
                y: startY + Angles.trnsy(angle, safeDist)
            };
        }
    }

    return { x: targetX, y: targetY };
}

function getLeolyrStarSpeeds(unitId, currentLevel) {
    let speeds = leolyrStarSpeedsMap.get(unitId);
    if (speeds == null) {
        speeds = [];
        leolyrStarSpeedsMap.put(unitId, speeds);
    }
    while (speeds.length <= currentLevel) {
        speeds.push(1.2 + Math.random() * 2.3);
    }
    return speeds;
}

function drawLeolyrStar4C(x, y, radius, rotation) {
    for(let i = 0; i < 4; i++) {
        let angle = rotation + (i * 90);
        let x1 = x + Angles.trnsx(angle, radius); let y1 = y + Angles.trnsy(angle, radius);
        let x2 = x + Angles.trnsx(angle + 45, radius * 0.3); let y2 = y + Angles.trnsy(angle + 45, radius * 0.3);
        Lines.line(x1, y1, x2, y2);
        let x3 = x + Angles.trnsx(angle - 45, radius * 0.3); let y3 = y + Angles.trnsy(angle - 45, radius * 0.3);
        Lines.line(x1, y1, x3, y3);
    }
}

function sendLeolyrDashCommand(targetX, targetY) {
    if (Vars.net.client()) {
        Call.sendChatMessage("/leolyr_dash " + targetX + " " + targetY);
    } else if (Vars.player != null && Vars.player.unit() != null) {
        executeLeolyrDash(Vars.player.unit(), targetX, targetY);
    }
}

function executeLeolyrDash(unit, targetX, targetY) {
    if (unit == null || !unit.isValid()) return;
    let data = getLeolyrData(unit);
    if (!data || data.dashCooldown > 0) return;

    let atkSpeedStatus = Vars.content.getByName(ContentType.status, "newex-atkspeed") || Vars.content.getByName(ContentType.status, "atkspeed");

    let currentMaxShield = 100 + (data.level * 250); 
    let currentShieldRadius = (7 * 8) * (1.0 + (data.level * 0.10)); 
    let cooldownReduction = 1.0 - (data.level * 0.05);
    let maxDashCooldown = 300 * cooldownReduction;

    let safePos = getSafeDashTarget(unit.x, unit.y, targetX, targetY);
    let oldX = unit.x;
    let oldY = unit.y;

    unit.set(safePos.x, safePos.y);
    Call.effect(Fx.spawnShockwave, unit.x, unit.y, 0, Color.white);

    data.maxCooldownRecord = maxDashCooldown;
    data.dashCooldown = maxDashCooldown;
    data.shieldHealth = currentMaxShield;

    if (atkSpeedStatus != null) {
        unit.apply(atkSpeedStatus, 300);
    }

    data.myStaticShields.push({
        x: oldX,
        y: oldY,
        rad: currentShieldRadius,
        hp: currentMaxShield * 1.5,
        lifetime: 600
    });
}

Events.on(PlayerChatEvent, event => {
    if (event.message != null && event.message.startsWith("/leolyr_dash ")) {
        let parts = event.message.split(" ");
        if (parts.length >= 3) {
            let tx = parseFloat(parts[1]);
            let ty = parseFloat(parts[2]);
            if (!isNaN(tx) && !isNaN(ty) && event.player != null && event.player.unit() != null) {
                executeLeolyrDash(event.player.unit(), tx, ty);
            }
        }
    }
});

let leolyrWing1Region = null;
let leolyrWing2Region = null;

Events.on(ClientLoadEvent, () => {
    if (Vars.ui && Vars.ui.settings) {
        Vars.ui.settings.game.checkPref("Hiệu ứng giáp Leolyr (Hexagon)", true, val => {
            Core.settings.put("leolyr-hex-shield", val);
        });
    }

    leolyrWing1Region = Core.atlas.find("newex-leolyr-wing1") || Core.atlas.find("leolyr-wing1");
    leolyrWing2Region = Core.atlas.find("newex-leolyr-wing2") || Core.atlas.find("leolyr-wing2");

    const leolyrUnit = Vars.content.getByName(ContentType.unit, "newex-leolyr") || Vars.content.getByName(ContentType.unit, "leolyr");
    if (leolyrUnit != null) {
        if (leolyrUnit.weapons.size >= 2) {
            leolyrUnit.weapons.get(0).bullet = leolyrLeftBullet;
            leolyrUnit.weapons.get(1).bullet = leolyrRightBullet;
        }

        leolyrUnit.constructor = () => {
            return extend(Packages.mindustry.gen.LegsUnit, {
                damage(amount) {
                    let data = getLeolyrData(this);
                    if (data && data.ignoreNextDamage) {
                        data.ignoreNextDamage = false;
                        return;
                    }
                    this.super$damage(amount);
                },

                update() {
                    this.super$update();
                    let data = getLeolyrData(this);
                    if (!data) return;

                    if (data.dashCooldown > 0) data.dashCooldown -= Time.delta;

                    let currentShieldRadius = (7 * 8) * (1.0 + (data.level * 0.10));

                    if (!Vars.net.client()) {
                        // 1. Xử lý lá chắn di động
                        if (data.shieldHealth > 0) {
                            let self = this;
                            Groups.bullet.intersect(this.x - currentShieldRadius - 16, this.y - currentShieldRadius - 16, (currentShieldRadius + 16) * 2, (currentShieldRadius + 16) * 2, cons(b => {
                                if (b.team != self.team && b.type != null && b.type.damage > 0) {
                                    let dst = Mathf.dst(self.x, self.y, b.x, b.y);
                                    if (dst <= currentShieldRadius + 4.0) {
                                        data.shieldHealth -= b.damage;
                                        data.ignoreNextDamage = true;
                                        Call.effect(Fx.shieldBreak, b.x, b.y, 5, Color.sky);

                                        if (Math.random() < (data.level * 0.01)) {
                                            b.team = self.team;
                                            b.vel.rotate(180);
                                        } else {
                                            b.remove();
                                        }

                                        if (data.shieldHealth <= 0) {
                                            data.shieldHealth = 0;
                                            Call.effect(Fx.shieldBreak, self.x, self.y, currentShieldRadius, Color.sky);
                                        }
                                    }
                                }
                            }));
                        }
                        data.ignoreNextDamage = false;

                        // 2. Xử lý các lá chắn tĩnh sau khi lướt
                        if (data.myStaticShields != null && data.myStaticShields.length > 0) {
                            let self = this;
                            for (let i = data.myStaticShields.length - 1; i >= 0; i--) {
                                let s = data.myStaticShields[i];
                                s.lifetime -= Time.delta;

                                if (s.hp > 0 && s.lifetime > 0) {
                                    Groups.bullet.intersect(s.x - s.rad - 16, s.y - s.rad - 16, (s.rad + 16) * 2, (s.rad + 16) * 2, cons(b => {
                                        if (b.team != self.team && b.type != null && b.type.damage > 0) {
                                            let dst = Mathf.dst(s.x, s.y, b.x, b.y);
                                            if (dst <= s.rad + 4.0) {
                                                s.hp -= b.damage;
                                                Call.effect(Fx.shieldBreak, b.x, b.y, 5, Color.sky);
                                                if (Math.random() < (data.level * 0.01)) {
                                                    b.team = self.team;
                                                    b.vel.rotate(180);
                                                } else {
                                                    b.remove();
                                                }
                                            }
                                        }
                                    }));
                                }

                                if (s.lifetime <= 0 || s.hp <= 0) {
                                    data.myStaticShields.splice(i, 1);
                                }
                            }
                        }

                        // 3. Xử lý nâng cấp tài nguyên
                        let req = getLeolyrUpgradeRequirements(data.level);
                        if (data.level < data.maxLevel && this.stack != null) {
                            if (data.copperAbsorbed < req.copperNeeded && this.stack.item == req.copperItem && this.stack.amount > 0) {
                                let consumeAmt = Math.min(2, this.stack.amount); this.stack.amount -= consumeAmt; data.copperAbsorbed += consumeAmt;
                            } else if (data.siliconAbsorbed < req.siliconNeeded && this.stack.item == req.siliconItem && this.stack.amount > 0) {
                                let consumeAmt = Math.min(2, this.stack.amount); this.stack.amount -= consumeAmt; data.siliconAbsorbed += consumeAmt;
                            }

                            if (data.copperAbsorbed >= req.copperNeeded && data.siliconAbsorbed >= req.siliconNeeded) {
                                data.copperAbsorbed = 0; data.siliconAbsorbed = 0;
                                data.level++;
                                Call.effect(Fx.upgradeCore, this.x, this.y, 0, Color.white);
                                Call.effect(Fx.shockwave, this.x, this.y, 0, Color.white);
                            }
                        }

                        // Bot tự động lướt
                        if (Vars.player == null || Vars.player.unit() != this) {
                            if (this.vel.len() > 0.1 && data.dashCooldown <= 0 && Mathf.chance(0.02)) {
                                let dashDistance = 80 + (data.level * 40);
                                let angle = this.vel.angle();
                                let rawTargetX = this.x + Angles.trnsx(angle, dashDistance);
                                let rawTargetY = this.y + Angles.trnsy(angle, dashDistance);
                                executeLeolyrDash(this, rawTargetX, rawTargetY);
                            }
                        }
                    }

                    // 4. Nhận Input điều khiển từ Player local
                    if (Vars.player != null && Vars.player.unit() == this) {
                        let isTouchedNow = Core.input.isTouched();
                        if (isTouchedNow && !data.wasTouchedPrev) {
                            let currentTime = Time.millis();
                            if ((currentTime - data.lastTapTimeInternal) < leolyrDoubleTapInterval) {
                                if (data.level >= 10) {
                                    if (!data.isMarkedMK2 && data.dashCooldown <= 0) {
                                        data.mk2TargetX = Vars.player.mouseX;
                                        data.mk2TargetY = Vars.player.mouseY;
                                        data.isMarkedMK2 = true;

                                        Call.effect(Fx.shieldBreak, data.mk2TargetX, data.mk2TargetY, data.hexSize * 2, Color.sky);
                                        Call.effect(Fx.shieldApply, data.mk2TargetX, data.mk2TargetY, 0, Color.sky);
                                    } else if (data.isMarkedMK2 && data.dashCooldown <= 0) {
                                        sendLeolyrDashCommand(data.mk2TargetX, data.mk2TargetY);
                                        data.isMarkedMK2 = false;
                                    }
                                } else {
                                    if (data.dashCooldown <= 0) {
                                        let dashDistance = 80 + (data.level * 40);
                                        let angle = this.rotation; if (this.vel.len() > 0.1) angle = this.vel.angle();
                                        let rawTargetX = this.x + Angles.trnsx(angle, dashDistance);
                                        let rawTargetY = this.y + Angles.trnsy(angle, dashDistance);

                                        sendLeolyrDashCommand(rawTargetX, rawTargetY);
                                    }
                                }
                            }
                            data.lastTapTimeInternal = currentTime;
                        }
                        data.wasTouchedPrev = isTouchedNow;
                    }
                },

                updateWeapons() {
                    let data = getLeolyrData(this);
                    let currentLevel = data ? data.level : 0;
                    let reloadMultiplier = 1 + (currentLevel * 2);
                    let damageMultiplier = 1.0 + (currentLevel * 0.20);

                    leolyrLeftBullet.damage = 15 * damageMultiplier;
                    leolyrRightBullet.damage = 65 * damageMultiplier;

                    if (!Vars.net.client() && this.isShooting && this.weapons.size >= 2) {
                        let leftW = this.weapons.get(0);
                        let rightW = this.weapons.get(1);

                        leftW.bullet = leolyrLeftBullet;
                        rightW.bullet = leolyrRightBullet;

                        if (leftW.reload > 0) leftW.reload -= (reloadMultiplier - 1) * Time.delta;
                        if (rightW.reload > 0) rightW.reload -= (reloadMultiplier - 1) * Time.delta;

                        if (leftW.reload <= 0 && data.shotCount % 2 === 0) {
                            leftW.shoot(this);
                            data.shotCount++;
                        } else if (rightW.reload <= 0 && data.shotCount % 2 === 1) {
                            rightW.shoot(this);
                            data.shotCount++;
                        }
                    }
                    this.super$updateWeapons();
                },

                draw() {
                    let data = getLeolyrData(this);
                    if (!data) return;

                    let showHex = Core.settings.getBool("leolyr-hex-shield", true);

                    Draw.z(Layer.flyingUnit - 2.0); Lines.stroke(1.2);
                    let totalStars = data.level + 1; let baseRadius = this.hitSize * 0.65;
                    let speeds = getLeolyrStarSpeeds(this.id, data.level);

                    for (let i = 0; i < totalStars; i++) {
                        let colorPulse = (Math.sin(Time.time / 5 + i) + 1) / 2; Draw.color(Color.white.cpy().lerp(Color.blue, colorPulse));
                        let speed = speeds[i] ? speeds[i] : 2.0; let direction = (i % 2 === 0) ? 1 : -1;
                        let orbitAngle = (Time.time * speed * direction) + (i * (360 / totalStars));
                        drawLeolyrStar4C(this.x + Angles.trnsx(orbitAngle, baseRadius + (i * 2.0)), this.y + Angles.trnsy(orbitAngle, baseRadius + (i * 2.0)), 1.5, Time.time * (speed * 1.8) * direction);
                    }

                    let dashProgress = 0; let isRetracting = false;
                    if (data.dashCooldown > 0) {
                        let activeFrames = data.maxCooldownRecord - data.dashCooldown;
                        if (activeFrames < 40) { dashProgress = 1.0; } else { dashProgress = data.dashCooldown / data.maxCooldownRecord; isRetracting = true; }
                    }

                    Draw.z(Layer.flyingUnit - 0.001); Draw.color();
                    let upwardY = 8 * dashProgress; let baseSideOffset = 14; let sideExpand = 10 * dashProgress;
                    let w1X = this.x, w1Y = this.y; let w2X = this.x, w2Y = this.y;
                    if (leolyrWing1Region != null && leolyrWing2Region != null) {
                        w1X = this.x + Angles.trnsx(this.rotation + 90, baseSideOffset + sideExpand) + Angles.trnsx(this.rotation, upwardY);
                        w1Y = this.y + Angles.trnsy(this.rotation + 90, baseSideOffset + sideExpand) + Angles.trnsy(this.rotation, upwardY);
                        w2X = this.x + Angles.trnsx(this.rotation - 90, baseSideOffset + sideExpand) + Angles.trnsx(this.rotation, upwardY);
                        w2Y = this.y + Angles.trnsy(this.rotation - 90, baseSideOffset + sideExpand) + Angles.trnsy(this.rotation, upwardY);
                        Draw.rect(leolyrWing1Region, w1X, w1Y, this.rotation); Draw.rect(leolyrWing2Region, w2X, w2Y, this.rotation);
                    }

                    if (isRetracting) {
                        Draw.z(Layer.flyingUnit - 0.002); let laserPulse = (Math.sin(Time.time / 1.5) + 1) / 2;
                        let laserOriginX = this.x + Angles.trnsx(this.rotation, -4); let laserOriginY = this.y + Angles.trnsy(this.rotation, -4);
                        let shortFactor = 0.45;
                        let target1X = Mathf.lerp(laserOriginX, w1X, shortFactor); let target1Y = Mathf.lerp(laserOriginY, w1Y, shortFactor);
                        let target2X = Mathf.lerp(laserOriginX, w2X, shortFactor); let target2Y = Mathf.lerp(laserOriginY, w2Y, shortFactor);
                        Lines.stroke(1.4 + laserPulse * 0.8); Draw.color(Color.sky);
                        Lines.line(laserOriginX, laserOriginY, target1X, target1Y); Lines.line(laserOriginX, laserOriginY, target2X, target2Y);
                        Lines.stroke(0.4 + laserPulse * 0.3); Draw.color(Color.white);
                        Lines.line(laserOriginX, laserOriginY, target1X, target1Y); Lines.line(laserOriginX, laserOriginY, target2X, target2Y);
                        let ballRadius = 1.5 + (laserPulse * 1.0); Draw.color(Color.sky); Fill.circle(laserOriginX, laserOriginY, ballRadius + 0.8);
                        Draw.color(Color.white); Fill.circle(laserOriginX, laserOriginY, ballRadius * 0.6); Draw.color();
                    }

                    if (data.isMarkedMK2 && Vars.player != null && Vars.player.unit() == this && data.level >= 10) {
                        Draw.z(Layer.effect);
                        Draw.color(Color.sky, 0.4 + Mathf.absin(Time.time, 3.0, 0.2));
                        Lines.stroke(1.0);
                        Lines.poly(data.mk2TargetX, data.mk2TargetY, 6, data.hexSize * 1.8, Time.time * 2);
                        Lines.circle(data.mk2TargetX, data.mk2TargetY, 4);
                        Draw.reset();
                    }

                    this.super$draw();

                    let DynamicRadius = (7 * 8) * (1.0 + (data.level * 0.10));
                    if (data.shieldHealth > 0) {
                        Draw.z(Layer.effect);

                        if (showHex) {
                            let hSpacing = data.hexSize * 1.5; let vSpacing = data.hexSize * Math.sqrt(3);
                            let minX = Math.floor((this.x - DynamicRadius) / hSpacing) - 1;
                            let maxX = Math.ceil((this.x + DynamicRadius) / hSpacing) + 1;
                            let minY = Math.floor((this.y - DynamicRadius) / vSpacing) - 1;
                            let maxY = Math.ceil((this.y + DynamicRadius) / vSpacing) + 1;

                            for (let i = minX; i <= maxX; i++) {
                                for (let j = minY; j <= maxY; j++) {
                                    let checkX = i * hSpacing;
                                    let checkY = j * vSpacing + ((i % 2 === 0) ? 0 : vSpacing / 2);
                                    let currentDst = Mathf.dst(this.x, this.y, checkX, checkY);
                                    if (Math.floor(currentDst) < DynamicRadius - 1) {
                                        let edgeFade = (1.0 - (currentDst / DynamicRadius));
                                        let hexAlpha = (0.28 + Mathf.absin(Time.time, 4.0, 0.08)) * edgeFade;
                                        Draw.color(Color.sky, hexAlpha); Lines.stroke(0.75);
                                        Lines.poly(checkX, checkY, 6, data.hexSize);
                                    }
                                }
                            }
                        }

                        Draw.color(Color.sky, 0.75); Lines.stroke(1.3);
                        Lines.circle(this.x, this.y, DynamicRadius); Draw.reset();
                    }

                    if (data.myStaticShields != null) {
                        data.myStaticShields.forEach(s => {
                            if (s.hp > 0 && s.lifetime > 0) {
                                Draw.z(Layer.effect);

                                if (showHex) {
                                    let hSpacing = data.hexSize * 1.5; let vSpacing = data.hexSize * Math.sqrt(3);
                                    let minX = Math.floor((s.x - s.rad) / hSpacing) - 1; let maxX = Math.ceil((s.x + s.rad) / hSpacing) + 1;
                                    let minY = Math.floor((s.y - s.rad) / vSpacing) - 1; let maxY = Math.ceil((s.y + s.rad) / vSpacing) + 1;

                                    for (let i = minX; i <= maxX; i++) {
                                        for (let j = minY; j <= maxY; j++) {
                                            let checkX = i * hSpacing;
                                            let checkY = j * vSpacing + ((i % 2 === 0) ? 0 : vSpacing / 2);
                                            let currentDst = Mathf.dst(s.x, s.y, checkX, checkY);
                                            if (Math.floor(currentDst) < s.rad - 1) {
                                                let edgeFade = (1.0 - (currentDst / s.rad));
                                                Draw.color(Color.sky, 0.22 * edgeFade); Lines.stroke(0.6);
                                                Lines.poly(checkX, checkY, 6, data.hexSize);
                                            }
                                        }
                                    }
                                }

                                Draw.color(Color.sky, 0.60); Lines.stroke(1.1);
                                Lines.circle(s.x, s.y, s.rad); Draw.reset();
                            }
                        });
                    }
                },

                maxHealth() {
                    let data = getLeolyrData(this);
                    let lvl = data ? data.level : 0;
                    return leolyrUnit.health * (1.0 + (lvl * 0.20));
                },

                speed() {
                    let data = getLeolyrData(this);
                    let lvl = data ? data.level : 0;
                    if (lvl >= 2) return leolyrUnit.speed * 1.40;
                    return leolyrUnit.speed;
                }
            });
        };
    }
});