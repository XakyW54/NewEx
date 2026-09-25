const lightningColor = Color.valueOf("7fd4ff");
const decayLightningColor = Color.valueOf("a957ff");

// Effect sóng âm 4 ô tại vị trí đích trên mặt đất
const shockwaveEffect = new Effect(20, e => {
    Draw.color(e.color, Color.white, e.fin());
    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 4 * Vars.tilesize);
});

// Effect nạp điện: Vòng tròn sóng âm ZOOM TỪ NGOÀI VÀO TRONG (4 ô -> 0 ô)
const absorbLightningEffect = new Effect(25, e => {
    Draw.color(e.color, Color.white, e.fout());
    Lines.stroke(2.0 * e.fout());
    let radius = (1.0 - e.fin()) * 4 * Vars.tilesize;
    Lines.circle(e.x, e.y, radius);
});

// Effect tia sét chính nối từ quả cầu tới điểm đích
const progressiveLightningEffect = new Effect(18, e => {
    if (!e.data || !(e.data instanceof Seq)) return;
    const points = e.data;
    if (points.size <= 1) return;

    let thickness = e.rotation > 0 ? e.rotation : 2.8;
    let progress = Math.min(1.0, e.fin() * 1.5); 
    let maxIndex = Math.floor((points.size - 1) * progress);

    Draw.color(e.color, Color.white, e.fin());
    Lines.stroke(thickness * e.fout());

    for (let i = 0; i < maxIndex; i++) {
        let a = points.get(i);
        let b = points.get(i + 1);
        Lines.line(a.x, a.y, b.x, b.y, false);
    }
});

function createProgressiveLightning(x1, y1, x2, y2, thickness, color) {
    let dst = Mathf.dst(x1, y1, x2, y2);
    let segs = Math.max(5, Math.floor(dst / 7));
    let points = new Seq();
    points.add(new Vec2(x1, y1));
    let angle = Angles.angle(x1, y1, x2, y2);

    for (let i = 1; i < segs; i++) {
        let t = i / segs;
        let px = Mathf.lerp(x1, x2, t);
        let py = Mathf.lerp(y1, y2, t);

        let jitter = 10;
        let noise = Mathf.range(jitter);

        Tmp.v1.trns(angle + 90, noise);
        points.add(new Vec2(px + Tmp.v1.x, py + Tmp.v1.y));
    }
    points.add(new Vec2(x2, y2));
    
    let effColor = color || lightningColor;
    progressiveLightningEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, effColor, points);
}

// EFFECT THỰC THỂ ĐỘC LẬP: Quả cầu mất kiểm soát trong 60 giây (3600 frames)
const unstableOrbEffect = new Effect(3600, e => {
    let chargeProgress = 1.0 - e.fin(); // Giảm dần từ 100% về 0% trong 60s
    let mainOrbRadius = (15.0 + Math.sin(e.time / 8) * 0.8) * Math.max(0.3, chargeProgress);

    let cOuter = Color.valueOf("8b38fb");
    let cMid = Color.valueOf("b866ff");
    let cCore = Color.valueOf("6a1fca");
    let cLightning = decayLightningColor;

    Draw.z(Layer.effect + 2);
    if (mainOrbRadius > 0.5) {
        Draw.color(cOuter, 0.3 * chargeProgress);
        Fill.circle(e.x, e.y, mainOrbRadius + 10 * chargeProgress);

        Draw.color(cMid, 0.5 * chargeProgress);
        Fill.circle(e.x, e.y, mainOrbRadius + 4 * chargeProgress);

        Draw.color(cCore);
        Fill.circle(e.x, e.y, mainOrbRadius);

        Draw.color(cMid, 0.8);
        Fill.circle(e.x, e.y, mainOrbRadius * 0.65);

        Draw.color(Color.white, 0.8 * chargeProgress);
        Fill.circle(e.x, e.y, mainOrbRadius * 0.25);

        // BẮN TIA ĐIỆN TÀN PHÁ TƯƠNG TÁC PHÁ HỦY TRỰC TIẾP (DESTROY INSTEAD OF DAMAGE)
        if (Mathf.chance(0.45 * chargeProgress) && !Vars.state.isPaused()) {
            let randAngle = Mathf.random(360);
            let randDist = Mathf.random(45, 105) * chargeProgress * Vars.tilesize;

            let targetX = e.x + Angles.trnsx(randAngle, randDist);
            let targetY = e.y + Angles.trnsy(randAngle, randDist);

            createProgressiveLightning(e.x, e.y, targetX, targetY, 3.5 * chargeProgress, cLightning);

            if (Mathf.chance(0.5)) {
                shockwaveEffect.at(targetX, targetY, 0, cLightning);
            }

            Fx.blastExplosion.at(targetX, targetY);

            // 1. Phá hủy tất cả công trình/khối trong bán kính tia sét
            let destroyRadius = 45.0; // Bán kính tàn phá của điểm tia sét rơi xuống
            Vars.indexer.allBuildings(targetX, targetY, destroyRadius, build => {
                build.kill(); // Phá hủy trực tiếp thay vì gây dmg
            });

            // 2. Phá hủy tất cả Unit trong bán kính tia sét
            Units.nearby(targetX - destroyRadius, targetY - destroyRadius, destroyRadius * 2, destroyRadius * 2, unit => {
                if (unit.within(targetX, targetY, destroyRadius)) {
                    unit.kill(); // Phá hủy trực tiếp thay vì gây dmg
                }
            });
        }
    }

    // Kết thúc 60s thì nổ lớn diện rộng - PHÁ HỦY TOÀN BỘ KHỐI VÀ UNIT
    if (e.time >= 3590) {
        Fx.impactReactorExplosion.at(e.x, e.y);

        let explosionRadius = 60 * Vars.tilesize;

        // Phá hủy toàn bộ công trình trong vùng nổ
        Vars.indexer.allBuildings(e.x, e.y, explosionRadius, build => {
            build.kill();
        });

        // Phá hủy toàn bộ Unit trong vùng nổ
        Units.nearby(e.x - explosionRadius, e.y - explosionRadius, explosionRadius * 2, explosionRadius * 2, unit => {
            if (unit.within(e.x, e.y, explosionRadius)) {
                unit.kill();
            }
        });
    }
});

Events.on(ContentInitEvent, () => {
    const reactor = Vars.content.block("newex-uranilum-reactor");

    if (reactor != null) {
        reactor.configurable = true;

        reactor.buildType = () => extend(ImpactReactor.ImpactReactorBuild, reactor, {
            activeLasers: 0,
            isSupercharged: false,
            targetBuilding: null,

            chargeTimer: 0,
            chargeMaxTime: 15 * 60,

            miniOrbs: [],
            seedOffset: 0,
            animTime: 0,

            created() {
                this.super$created();
                this.seedOffset = Mathf.random(1000);
                this.initMiniOrbs();
            },

            initMiniOrbs() {
                let count = Mathf.random(1, 3);
                this.miniOrbs = [];
                for (let i = 0; i < count; i++) {
                    this.miniOrbs.push({
                        speedX: Mathf.random(0.5, 1.5),
                        speedY: Mathf.random(0.5, 1.5),
                        phase: Mathf.random(100),
                        radius: Mathf.random(2.0, 3.5)
                    });
                }
            },

            onDestroyed() {
                // Tạo quả cầu năng lượng mất kiểm soát nếu đang được 4 laser chiếu vào lúc bị phá hủy
                if (this.activeLasers >= 4 || this.chargeTimer > 60) {
                    unstableOrbEffect.at(this.x, this.y);
                }
                this.super$onDestroyed();
            },

            updateTile() {
                this.super$updateTile();

                if (!Vars.state.isPaused()) {
                    this.animTime += Time.delta;
                }

                let has4Lasers = (this.activeLasers >= 4);
                let isGeneratingPower = (this.warmup > 0.5 && this.productionEfficiency > 0);

                if (has4Lasers && isGeneratingPower) {
                    if (this.chargeTimer < this.chargeMaxTime) {
                        this.chargeTimer += Time.delta;
                    }

                    let chargeProgress = Math.min(1.0, this.chargeTimer / this.chargeMaxTime);
                    this.productionEfficiency = 1.0 + (chargeProgress * 9.0);

                    if (chargeProgress >= 1.0) {
                        if (!this.isSupercharged) {
                            this.initMiniOrbs();
                            Call.announce("[gold]LÒ PHẢN ỨNG ĐÃ ĐẠT CÔNG SUẤT TỐI ĐA![]");
                        }
                        this.isSupercharged = true;

                        if (this.targetBuilding != null) {
                            let maxDist = 150 * Vars.tilesize;
                            if (!this.targetBuilding.isValid() || this.dst(this.targetBuilding) > maxDist) {
                                this.targetBuilding = null;
                            }
                        }

                        if (this.targetBuilding != null && this.targetBuilding.power != null) {
                            let transferAmount = 10000.0 / 60.0;
                            let graph = this.targetBuilding.power.graph;

                            if (graph != null && graph.batteries != null && graph.batteries.size > 0) {
                                let pPerBattery = transferAmount / graph.batteries.size;
                                for (let i = 0; i < graph.batteries.size; i++) {
                                    let bat = graph.batteries.get(i);
                                    if (bat != null && bat.power != null) {
                                        bat.power.status = Math.min(1.0, bat.power.status + (pPerBattery / bat.block.consPower.capacity));
                                    }
                                }
                            } else {
                                this.targetBuilding.power.status = 1.0;
                            }
                        }
                    }
                } else {
                    if (this.chargeTimer > 300 && !has4Lasers) {
                        unstableOrbEffect.at(this.x, this.y);
                        this.kill();
                        return;
                    } else {
                        this.chargeTimer = Math.max(0, this.chargeTimer - Time.delta * 1.5);
                    }
                    this.isSupercharged = false;
                }

                this.activeLasers = 0;
            },

            addLaser() {
                this.activeLasers++;
            },

            buildConfiguration(table) {
                this.super$buildConfiguration(table);

                table.button(Icon.power, Styles.cleari, () => {
                    this.configure(this.targetBuilding != null ? null : this.pos());
                }).size(40).tooltip("Chọn khối mục tiêu trong phạm vi 150 ô để truyền 10k điện/s");
            },

            onConfigureBuildTapped(other) {
                if (this === other) {
                    this.targetBuilding = null;
                    return true;
                }

                if (other != null && other.power != null) {
                    if (this.dst(other) <= 150 * Vars.tilesize) {
                        this.targetBuilding = other;
                        return false;
                    }
                }

                return true;
            },

            draw() {
                this.super$draw();

                if (this.chargeTimer > 0) {
                    Draw.z(Layer.effect + 2);

                    let chargeProgress = Math.min(1.0, this.chargeTimer / this.chargeMaxTime);
                    let mainOrbRadius = (15.0 + Math.sin(this.animTime / 8) * 0.8) * chargeProgress;

                    let cOuter = Color.valueOf("389bfb");
                    let cMid = Color.valueOf("66b1ff");
                    let cCore = Color.valueOf("1f65ca");
                    let cLightning = lightningColor;

                    if (mainOrbRadius > 0.5) {
                        Draw.color(cOuter, 0.25 * chargeProgress);
                        Fill.circle(this.x, this.y, mainOrbRadius + 10 * chargeProgress);

                        Draw.color(cMid, 0.45 * chargeProgress);
                        Fill.circle(this.x, this.y, mainOrbRadius + 4 * chargeProgress);

                        Draw.color(cCore);
                        Fill.circle(this.x, this.y, mainOrbRadius);

                        Draw.color(cMid, 0.75);
                        Fill.circle(this.x, this.y, mainOrbRadius * 0.65);

                        Draw.color(Color.white, 0.7 * chargeProgress);
                        Fill.circle(this.x, this.y, mainOrbRadius * 0.25);

                        if (Mathf.chance(0.4 * chargeProgress) && !Vars.state.isPaused()) {
                            let randAngle = Mathf.random(360);
                            let randDist = Mathf.random(15, 35) * chargeProgress * Vars.tilesize;

                            let targetX = this.x + Angles.trnsx(randAngle, randDist);
                            let targetY = this.y + Angles.trnsy(randAngle, randDist);

                            createProgressiveLightning(this.x, this.y, targetX, targetY, 2.8 * chargeProgress, cLightning);

                            let isGroundHit = Mathf.chance(0.5);
                            if (isGroundHit) {
                                shockwaveEffect.at(targetX, targetY, 0, cLightning);
                            }

                            Vars.indexer.eachBlock(this.team, targetX, targetY, 4 * Vars.tilesize, b => true, targetBuild => {
                                let isCharged = false;

                                if (targetBuild.block instanceof Battery) {
                                    let capacity = targetBuild.block.consPower.capacity;
                                    if (capacity > 0 && targetBuild.power != null) {
                                        let addStatus = 1000.0 / capacity;
                                        targetBuild.power.status = Math.min(1.0, targetBuild.power.status + addStatus);
                                        isCharged = true;
                                    }
                                }

                                if (isCharged) {
                                    absorbLightningEffect.at(targetBuild.x, targetBuild.y, 0, cLightning);
                                }
                            });
                        }

                        if (this.isSupercharged) {
                            let maxAllowedOffset = mainOrbRadius * 0.4;

                            for (let i = 0; i < this.miniOrbs.length; i++) {
                                let orb = this.miniOrbs[i];

                                let offsetX = Math.sin((this.animTime * 0.04 * orb.speedX) + orb.phase + this.seedOffset) * maxAllowedOffset;
                                let offsetY = Math.cos((this.animTime * 0.03 * orb.speedY) + orb.phase + this.seedOffset) * maxAllowedOffset;

                                let mx = this.x + offsetX;
                                let my = this.y + offsetY;

                                Draw.color(Color.valueOf("99d1ff"));
                                Fill.circle(mx, my, orb.radius + 1.0);

                                Draw.color(Color.white);
                                Fill.circle(mx, my, orb.radius);
                            }
                        }
                    }

                    if (this.isSupercharged && this.targetBuilding != null && this.targetBuilding.isValid()) {
                        Draw.z(Layer.power + 2);

                        let beamWidth = 5.0 + Mathf.absin(this.animTime, 1.5, 1.5);

                        Draw.color(Color.valueOf("389bfb"), 0.4);
                        Lines.stroke(beamWidth + 4.0);
                        Lines.line(this.x, this.y, this.targetBuilding.x, this.targetBuilding.y);

                        Draw.color(Color.valueOf("66b1ff"));
                        Lines.stroke(beamWidth);
                        Lines.line(this.x, this.y, this.targetBuilding.x, this.targetBuilding.y);

                        Draw.color(Color.white);
                        Lines.stroke(beamWidth * 0.4);
                        Lines.line(this.x, this.y, this.targetBuilding.x, this.targetBuilding.y);

                        if (Mathf.chance(0.5) && !Vars.state.isPaused()) {
                            createProgressiveLightning(this.x, this.y, this.targetBuilding.x, this.targetBuilding.y, 3.2, lightningColor);
                        }
                    }

                    Draw.reset();
                }
            },

            drawSelect() {
                this.super$drawSelect();
                this.drawLaserPositions();
                this.drawTargetLink();
            },

            drawConfigure() {
                this.super$drawConfigure();
                this.drawLaserPositions();
                this.drawTargetLink();

                Draw.z(Layer.power);
                Draw.color(Color.valueOf("66b1ff"), 0.35);
                Lines.stroke(1.5);
                Lines.circle(this.x, this.y, 150 * Vars.tilesize);
                Draw.reset();
            },

            drawTargetLink() {
                if (this.targetBuilding != null && this.targetBuilding.isValid()) {
                    Draw.z(Layer.power);
                    Draw.color(Color.valueOf("66b1ff"));
                    Lines.stroke(2);
                    Lines.square(this.targetBuilding.x, this.targetBuilding.y, (this.targetBuilding.block.size * Vars.tilesize) / 2 + 2);
                    Lines.dashLine(this.x, this.y, this.targetBuilding.x, this.targetBuilding.y, 8);
                    Draw.reset();
                }
            },

            drawLaserPositions() {
                const dist = 15 * Vars.tilesize;
                const targetPositions = [
                    [this.x - dist, this.y],
                    [this.x + dist, this.y],
                    [this.x, this.y - dist],
                    [this.x, this.y + dist]
                ];

                Draw.z(Layer.power);

                for (let i = 0; i < targetPositions.length; i++) {
                    let wx = targetPositions[i][0];
                    let wy = targetPositions[i][1];

                    let tile = Vars.world.tileWorld(wx, wy);
                    let isPlaced = tile && tile.build && 
                                   tile.build.block.name.endsWith("laser-charger-uranilum") &&
                                   Math.abs(tile.build.x - wx) < 8 && Math.abs(tile.build.y - wy) < 8;

                    if (isPlaced) {
                        Draw.color(Color.valueOf("66b1ff"));
                    } else {
                        Draw.color(Color.orange, Color.white, Mathf.absin(this.animTime, 4, 0.3));
                    }

                    Lines.stroke(1.5);
                    Lines.dashLine(this.x, this.y, wx, wy, 12);
                    Lines.stroke(2);
                    Lines.square(wx, wy, Vars.tilesize);
                }

                Draw.reset();
            }
        });
    }
});