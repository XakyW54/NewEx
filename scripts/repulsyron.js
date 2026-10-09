const customUnibeamHit = new Effect(14, e => {
    Draw.color(Color.white, Color.valueOf("#00c8ff"), e.fin());
    Lines.stroke(e.fout() * 2.2);
    Lines.circle(e.x, e.y, e.fin() * 14);
    Angles.randLenVectors(e.id, 5, e.fin() * 16, (x, y) => {
        Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), e.fout() * 5);
    });
});

const overloadHitEffect = new Effect(20, e => {
    Draw.color(Color.valueOf("#ff0055"), Color.valueOf("#ff99bb"), e.fin());
    Lines.stroke(e.fout() * 3);
    Lines.circle(e.x, e.y, e.fin() * 26);
    Angles.randLenVectors(e.id, 8, e.fin() * 30, (x, y) => {
        Fill.circle(e.x + x, e.y + y, e.fout() * 3.5);
    });
});

const cooldownSmoke = new Effect(40, e => {
    Draw.color(Color.gray, Color.darkGray, e.fout());
    Angles.randLenVectors(e.id, 2, e.fin() * 14, e.rotation, 30, (x, y) => {
        Fill.circle(e.x + x, e.y + y, e.fout() * 3.2);
    });
});

const secondaryLaserEffect = new Effect(12, e => {
    if (!e.data) return;
    let targetX = e.data.x;
    let targetY = e.data.y;

    Draw.color(Color.valueOf("#ff0055"), Color.white, e.fout());
    Lines.stroke(e.fout() * 2.5);
    Lines.line(e.x, e.y, targetX, targetY);
    Fill.circle(targetX, targetY, e.fout() * 3);
});

function updateRepulsyronVisibility() {
    const repulsyronBlock = Vars.content.block("newex-repulsyron") || Vars.content.block("repulsyron");
    if (!Vars.player || !repulsyronBlock) return;

    let playerTeam = Vars.player.team();
    let maxAllowed = playerTeam.cores().size;  
    
    let currentCount = 0;
    Groups.build.each(b => {
        if (b.block === repulsyronBlock && b.team === playerTeam) {
            currentCount++;
        }
    });

    if (currentCount < maxAllowed) {
        repulsyronBlock.buildVisibility = BuildVisibility.shown;
    } else {
        repulsyronBlock.buildVisibility = BuildVisibility.hidden;
    }
}

let wing1Region = null;
let wing2Region = null;

Events.on(ContentInitEvent, () => {
    let repulsyron = Vars.content.block("newex-repulsyron") || Vars.content.block("repulsyron");
    if (!repulsyron) return;

    repulsyron.buildType = () => extend(PowerTurret.PowerTurretBuild, repulsyron, {
        beamProgress: 0,
        damageTimer: 0,
        firingTimer: 0,
        fadeProgress: 0,
        chargeTimer: 0,
        cooldownTimer: 0,
        
        isCharging: false,
        isFiring: false,
        isFading: false,
        
        lockedTarget: null,
        
        startX: 0, startY: 0,
        endX: 0, endY: 0,
        fadeStartX: 0, fadeStartY: 0,
        fadeEndX: 0, fadeEndY: 0,

        wingMoveProgress: 0,
        wingHeatProgress: 0,

        updateTile() {
            this.super$updateTile();

            let muzzleX = this.x + Angles.trnsx(this.rotation, repulsyron.size * 4);
            let muzzleY = this.y + Angles.trnsy(this.rotation, repulsyron.size * 4);

            if (this.cooldownTimer > 0) {
                this.cooldownTimer -= Time.delta;
                if (Mathf.chance(0.25)) {
                    cooldownSmoke.at(muzzleX, muzzleY, this.rotation);
                }
            }

            let isControlledByPlayer = this.isControlled();

            let isTargetValid = (t) => {
                if (t == null) return false;
                let isDead = (typeof t.dead === "function") ? t.dead() : t.dead;
                let hp = (typeof t.health === "function") ? t.health() : t.health;
                if (isDead || hp <= 0) return false;
                return this.within(t, repulsyron.range);
            };

            if (!isControlledByPlayer) {
                if (this.lockedTarget != null && isTargetValid(this.lockedTarget)) {
                    this.target = this.lockedTarget;
                } else if (this.lockedTarget != null) {
                    this.stopFiringAndStartFade(muzzleX, muzzleY);
                    this.lockedTarget = null;
                }
            }

            if (this.isShooting && this.efficiency > 0 && this.cooldownTimer <= 0) {
                let targetX = 0;
                let targetY = 0;

                if (isControlledByPlayer) {
                    let curAimX = (typeof this.aimX === "function") ? this.aimX() : this.aimX;
                    let curAimY = (typeof this.aimY === "function") ? this.aimY() : this.aimY;

                    if (curAimX !== undefined && curAimY !== undefined && !isNaN(curAimX) && !isNaN(curAimY)) {
                        targetX = curAimX;
                        targetY = curAimY;
                    } else {
                        targetX = muzzleX + Angles.trnsx(this.rotation, repulsyron.range);
                        targetY = muzzleY + Angles.trnsy(this.rotation, repulsyron.range);
                    }
                } else {
                    let currentTarget = this.target;
                    if (currentTarget != null && isTargetValid(currentTarget)) {
                        if (this.lockedTarget !== currentTarget) {
                            this.lockedTarget = currentTarget;
                            this.beamProgress = 0;
                            this.firingTimer = 0;
                            this.damageTimer = 0;
                            this.chargeTimer = 0;
                        }
                        targetX = currentTarget.getX();
                        targetY = currentTarget.getY();
                    }
                }

                if (isControlledByPlayer || this.lockedTarget != null) {
                    if (this.chargeTimer < 30) {
                        this.isCharging = true;
                        this.isFiring = false;
                        this.chargeTimer += Time.delta;
                    } else {
                        this.isCharging = false;
                        this.isFiring = true;
                        this.isFading = false;

                        this.firingTimer += Time.delta;

                        if (this.beamProgress < 1.0) {
                            this.beamProgress = Math.min(1.0, this.beamProgress + (Time.delta / 12));
                        }

                        this.startX = muzzleX;
                        this.startY = muzzleY;

                        this.endX = Mathf.lerp(this.startX, targetX, this.beamProgress);
                        this.endY = Mathf.lerp(this.startY, targetY, this.beamProgress);

                        this.damageTimer += Time.delta;
                        if (this.damageTimer >= 6) {
                            this.damageTimer = 0;

                            let secondsFired = this.firingTimer / 60;
                            let dmgMultiplier = 1 + (secondsFired * 10);
                            let currentDamage = 20 * this.efficiency * dmgMultiplier;
                            let laserWidth = 12;

                            Units.nearbyEnemies(this.team, Math.min(this.startX, this.endX) - 30, Math.min(this.startY, this.endY) - 30, Math.abs(this.endX - this.startX) + 60, Math.abs(this.endY - this.startY) + 60, cons(unit => {
                                if (unit != null && Intersector.distanceSegmentPoint(this.startX, this.startY, this.endX, this.endY, unit.x, unit.y) <= (laserWidth + unit.hitSize / 2)) {
                                    unit.damage(currentDamage);

                                    if (secondsFired >= 5) {
                                        overloadHitEffect.at(unit.x, unit.y);
                                        Units.nearbyEnemies(this.team, unit.x - 120, unit.y - 120, 240, 240, cons(subUnit => {
                                            if (subUnit != null && subUnit !== unit && subUnit.within(unit.x, unit.y, 120)) {
                                                subUnit.damagePierce(5000);
                                                secondaryLaserEffect.at(unit.x, unit.y, 0, Color.white, { x: subUnit.x, y: subUnit.y });
                                            }
                                        }));
                                    } else {
                                        customUnibeamHit.at(unit.x, unit.y);
                                    }
                                }
                            }));

                            let x1 = World.toTile(this.startX), y1 = World.toTile(this.startY);
                            let x2 = World.toTile(this.endX), y2 = World.toTile(this.endY);
                            World.raycast(x1, y1, x2, y2, (wx, wy) => {
                                let tile = Vars.world.tile(wx, wy);
                                if (tile != null && tile.build != null && tile.build.team != this.team) {
                                    let build = tile.build;
                                    build.damage(this.team, currentDamage);

                                    if (secondsFired >= 5) {
                                        overloadHitEffect.at(build.x, build.y);
                                        Units.nearbyEnemies(this.team, build.x - 120, build.y - 120, 240, 240, cons(subUnit => {
                                            if (subUnit != null && subUnit.within(build.x, build.y, 120)) {
                                                subUnit.damagePierce(5000);
                                                secondaryLaserEffect.at(build.x, build.y, 0, Color.white, { x: subUnit.x, y: subUnit.y });
                                            }
                                        }));
                                    }
                                }
                                return false;
                            });

                            if (secondsFired >= 5) {
                                overloadHitEffect.at(this.endX, this.endY);
                            } else {
                                customUnibeamHit.at(this.endX, this.endY);
                            }
                        }
                    }
                } else {
                    this.stopFiringAndStartFade(muzzleX, muzzleY);
                }
            } else {
                this.stopFiringAndStartFade(muzzleX, muzzleY);
            }

            let secondsFired = this.firingTimer / 60;
            let targetMove = (this.isFiring || this.isCharging) ? 1.0 : 0.0;
            let targetHeat = (this.isFiring && secondsFired >= 5) ? 1.0 : 0.0;

            let moveSpeed = (targetMove < this.wingMoveProgress) ? (Time.delta / 60) : (Time.delta / 30);
            this.wingMoveProgress = Mathf.lerpDelta(this.wingMoveProgress, targetMove, moveSpeed);
            this.wingHeatProgress = Mathf.lerpDelta(this.wingHeatProgress, targetHeat, Time.delta / 40);

            if (this.isFading) {
                this.fadeProgress += Time.delta / 12;
                this.startX = Mathf.lerp(this.fadeStartX, this.fadeEndX, this.fadeProgress);
                this.startY = Mathf.lerp(this.fadeStartY, this.fadeEndY, this.fadeProgress);
                this.endX = this.fadeEndX;
                this.endY = this.fadeEndY;

                if (this.fadeProgress >= 1.0) {
                    this.isFading = false;
                    this.beamProgress = 0;
                    this.fadeProgress = 0;
                    this.firingTimer = 0;
                }
            }
        },

        stopFiringAndStartFade(muzzleX, muzzleY) {
            if (this.isFiring || this.isCharging) {
                if (this.isFiring) {
                    this.cooldownTimer = 300; 
                }
                
                this.isFiring = false;
                this.isCharging = false;
                this.isFading = true;
                this.fadeProgress = 0;
                this.damageTimer = 0;
                this.chargeTimer = 0;

                this.fadeStartX = muzzleX;
                this.fadeStartY = muzzleY;
                this.fadeEndX = this.endX;
                this.fadeEndY = this.endY;
            }
        },

        draw() {
            this.super$draw();

            let muzzleX = this.x + Angles.trnsx(this.rotation, repulsyron.size * 4);
            let muzzleY = this.y + Angles.trnsy(this.rotation, repulsyron.size * 4);

            if (wing1Region == null || !wing1Region.found()) {
                wing1Region = Core.atlas.find("newex-repulsyron-wing1", Core.atlas.find("repulsyron-wing1"));
            }
            if (wing2Region == null || !wing2Region.found()) {
                wing2Region = Core.atlas.find("newex-repulsyron-wing2", Core.atlas.find("repulsyron-wing2"));
            }

            if (wing1Region && wing1Region.found() && wing2Region && wing2Region.found()) {
                Draw.z(Layer.turret + 0.05);

                let moveDist = 6 * this.wingMoveProgress;

                let w1X = this.x + Angles.trnsx(this.rotation - 90, moveDist);
                let w1Y = this.y + Angles.trnsy(this.rotation - 90, moveDist);

                let w2X = this.x + Angles.trnsx(this.rotation + 90, moveDist);
                let w2Y = this.y + Angles.trnsy(this.rotation + 90, moveDist);

                Draw.rect(wing1Region, w1X, w1Y, this.rotation);
                Draw.rect(wing2Region, w2X, w2Y, this.rotation);

                if (this.wingHeatProgress > 0) {
                    Draw.color(Color.valueOf("#ffbb88"));
                    Draw.alpha(this.wingHeatProgress * 0.85);
                    Draw.blend(Blending.additive);
                    
                    Draw.rect(wing1Region, w1X, w1Y, this.rotation);
                    Draw.rect(wing2Region, w2X, w2Y, this.rotation);

                    Draw.blend();
                    Draw.reset();
                }
            }

            if (this.isCharging) {
                let chargeRatio = Mathf.clamp(this.chargeTimer / 30);
                Draw.z(Layer.bullet + 2);
                Draw.color(Color.valueOf("#00e1ff"), Color.white, chargeRatio);
                Fill.circle(muzzleX, muzzleY, chargeRatio * 5);
                Lines.stroke((1 - chargeRatio) * 3);
                Lines.circle(muzzleX, muzzleY, (1 - chargeRatio) * 16);
                Draw.reset();
            }

            if ((this.isFiring || this.isFading) && (this.beamProgress > 0)) {
                Draw.z(Layer.bullet + 2);

                let secondsFired = this.firingTimer / 60;
                let sizeScale = 1 + Math.min(1.8, secondsFired * 0.12);

                let colorFactor = Mathf.clamp((secondsFired - 2) / 8); 
                let cOuter = Color.valueOf("#0077ff").cpy().lerp(Color.valueOf("#ff0055"), colorFactor);
                let cMid   = Color.valueOf("#00e1ff").cpy().lerp(Color.valueOf("#ff66aa"), colorFactor);
                let cInner = Color.white;

                let alpha = this.isFading ? (1.0 - this.fadeProgress) : 1.0;

                let outerWidth = 7.5 * sizeScale;
                let midWidth   = 4.0 * sizeScale;
                let innerWidth = 1.8 * sizeScale;

                Draw.color(cOuter);
                Draw.alpha(alpha * 0.6);
                Lines.stroke(outerWidth);
                Lines.line(this.startX, this.startY, this.endX, this.endY);
                Fill.circle(this.startX, this.startY, outerWidth * 0.5);
                Fill.circle(this.endX, this.endY, outerWidth * 0.5);

                let effectProgress = Mathf.clamp(secondsFired / 3.0); 

                if (effectProgress > 0 && this.isFiring) {
                    let len = Mathf.len(this.endX - this.startX, this.endY - this.startY);
                    let angle = Mathf.angle(this.endX - this.startX, this.endY - this.startY);
                    let segments = Math.floor(len / 8);

                    Draw.color(cMid);
                    Draw.alpha(alpha * 0.85 * effectProgress);
                    Lines.stroke(1.6 * sizeScale * effectProgress);

                    for (let side = -1; side <= 1; side += 2) {
                        let prevX = this.startX;
                        let prevY = this.startY;

                        for (let i = 1; i <= segments; i++) {
                            let progress = i / segments;
                            let px = Mathf.lerp(this.startX, this.endX, progress);
                            let py = Mathf.lerp(this.startY, this.endY, progress);

                            let wave = Mathf.sinDeg(Time.time * 14 + progress * 360) * (7 * sizeScale * effectProgress) * side;
                            let wx = px + Angles.trnsx(angle + 90, wave);
                            let wy = py + Angles.trnsy(angle + 90, wave);

                            Lines.line(prevX, prevY, wx, wy);
                            prevX = wx;
                            prevY = wy;
                        }
                    }

                    Draw.color(cInner);
                    let photonCount = Math.floor(14 * effectProgress);
                    for (let p = 0; p < photonCount; p++) {
                        let pTime = ((Time.time * 0.05 + p / 14) % 1.0);
                        let px = Mathf.lerp(this.startX, this.endX, pTime);
                        let py = Mathf.lerp(this.startY, this.endY, pTime);
                        let offset = Mathf.sinDeg(Time.time * 20 + p * 50) * (5 * sizeScale);
                        
                        let fx = px + Angles.trnsx(angle + 90, offset);
                        let fy = py + Angles.trnsy(angle + 90, offset);

                        let randomFactor = 0.6 + ((p * 17) % 10) / 10.0 * 0.9;
                        let pSize = 1.4 * sizeScale * randomFactor;

                        Draw.alpha(alpha * 0.9 * effectProgress);
                        Fill.circle(fx, fy, pSize);
                    }
                }

                Draw.color(cMid);
                Draw.alpha(alpha * 0.85);
                Lines.stroke(midWidth);
                Lines.line(this.startX, this.startY, this.endX, this.endY);
                Fill.circle(this.startX, this.startY, midWidth * 0.5);
                Fill.circle(this.endX, this.endY, midWidth * 0.5);

                Draw.color(cInner);
                Draw.alpha(alpha);
                Lines.stroke(innerWidth);
                Lines.line(this.startX, this.startY, this.endX, this.endY);
                Fill.circle(this.startX, this.startY, innerWidth * 0.5);
                Fill.circle(this.endX, this.endY, innerWidth * 0.5);

                Draw.reset();
            }
        }
    });
});

Events.on(WorldLoadEvent, event => {
    Time.run(10, () => {
        updateRepulsyronVisibility();
    });
});

Events.on(BlockBuildEndEvent, event => {
    updateRepulsyronVisibility();
});

Events.on(BlockDestroyEvent, event => {
    const repulsyronBlock = Vars.content.block("newex-repulsyron") || Vars.content.block("repulsyron");
    if (!repulsyronBlock) return;

    let destroyedTile = event.tile;
    if (!destroyedTile || !destroyedTile.build) return;

    let destroyedBuild = destroyedTile.build;
    let victimTeam = destroyedBuild.team;

    if (destroyedBuild.block instanceof CoreBlock) {
        let teamData = victimTeam.data();
        let maxAllowed = teamData.cores.size - 1;
        if (maxAllowed < 0) maxAllowed = 0;

        let teamBlocks = [];
        Groups.build.each(b => {
            if (b.block === repulsyronBlock && b.team === victimTeam) {
                teamBlocks.push(b);
            }
        });

        if (teamBlocks.length > maxAllowed) {
            let toDestroy = teamBlocks.length - maxAllowed;
            for (let i = 0; i < toDestroy; i++) {
                let lastBlock = teamBlocks.pop();
                Call.sendMessage("[red]Đội " + victimTeam.name + " bị mất Lõi! Pháo Repulsyron thừa đã tự hủy![]");
                lastBlock.kill();
            }
        }
    }

    updateRepulsyronVisibility();
});