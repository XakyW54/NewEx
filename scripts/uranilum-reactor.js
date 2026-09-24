const lightningColor = Color.valueOf("7fd4ff");

const progressiveLightningEffect = new Effect(18, e => {
    if (!(e.data instanceof Seq)) return;
    const points = e.data;
    let thickness = e.rotation > 0 ? e.rotation : 2.8;

    let progress = Math.min(1.0, e.fin() * 1.5); 
    let maxIndex = Math.floor((points.size - 1) * progress);

    Draw.color(lightningColor, Color.white, e.fin());
    Lines.stroke(thickness * e.fout());

    for (let i = 0; i < maxIndex; i++) {
        let a = points.get(i);
        let b = points.get(i + 1);
        Lines.line(a.x, a.y, b.x, b.y, false);
    }
});

function createProgressiveLightning(x1, y1, x2, y2, thickness) {
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
    progressiveLightningEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
}

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
                    this.chargeTimer = Math.max(0, this.chargeTimer - Time.delta * 1.5);
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

                    if (mainOrbRadius > 0.5) {
                        Draw.color(Color.valueOf("389bfb"), 0.25 * chargeProgress);
                        Fill.circle(this.x, this.y, mainOrbRadius + 10 * chargeProgress);

                        Draw.color(Color.valueOf("66b1ff"), 0.45 * chargeProgress);
                        Fill.circle(this.x, this.y, mainOrbRadius + 4 * chargeProgress);

                        Draw.color(Color.valueOf("1f65ca"));
                        Fill.circle(this.x, this.y, mainOrbRadius);

                        Draw.color(Color.valueOf("66b1ff"), 0.75);
                        Fill.circle(this.x, this.y, mainOrbRadius * 0.65);

                        Draw.color(Color.white, 0.7 * chargeProgress);
                        Fill.circle(this.x, this.y, mainOrbRadius * 0.25);

                        if (Mathf.chance(0.35 * chargeProgress) && !Vars.state.isPaused()) {
                            let randAngle = Mathf.random(360);
                            let randDist = Mathf.random(15, 35) * chargeProgress * Vars.tilesize;

                            let targetX = this.x + Angles.trnsx(randAngle, randDist);
                            let targetY = this.y + Angles.trnsy(randAngle, randDist);

                            createProgressiveLightning(this.x, this.y, targetX, targetY, 2.8 * chargeProgress);
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
                            createProgressiveLightning(this.x, this.y, this.targetBuilding.x, this.targetBuilding.y, 3.2);
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