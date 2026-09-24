const RANGE_IN_TILES = 15;
const CHARGE_TIME = 90;

const lightningColor = Color.valueOf("7fd4ff");

const lyvervonLightningEffect = new Effect(14, e => {
    if (!(e.data instanceof Seq)) return;
    const points = e.data;
    let thickness = e.rotation > 0 ? e.rotation : 2.8;
    Draw.color(lightningColor, Color.white, e.fin());
    Lines.stroke(thickness * e.fout());
    for (let i = 0; i < points.size - 1; i++) {
        let a = points.get(i);
        let b = points.get(i + 1);
        Lines.line(a.x, a.y, b.x, b.y, false);
    }
});

function createLyvervonLightning(x1, y1, x2, y2, thickness) {
    let dst = Mathf.dst(x1, y1, x2, y2);
    let segs = Math.max(4, Math.floor(dst / 7));
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
    lyvervonLightningEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
}

Events.on(ContentInitEvent, () => {
    const laserBlock = Vars.content.block("newex-laser-charger-uranilum");

    if (laserBlock != null) {
        laserBlock.buildType = () => extend(GenericCrafter.GenericCrafterBuild, laserBlock, {
            chargeProgress: 0,
            animTime: 0,
            directions: [
                [-1, 0], [1, 0], [0, -1], [0, 1]
            ],

            getUranilumItem() {
                return Vars.content.item("newex-uranilum");
            },

            hasRequiredResources() {
                let uranilum = this.getUranilumItem();
                let hasItem = uranilum != null ? this.items.get(uranilum) >= 5 : true;
                let hasPower = (this.power != null && this.power.status >= 0.9);

                return hasItem && hasPower;
            },

            findTargetReactor() {
                let dist = RANGE_IN_TILES * Vars.tilesize;

                for (let i = 0; i < this.directions.length; i++) {
                    let tx = this.x + (this.directions[i][0] * dist);
                    let ty = this.y + (this.directions[i][1] * dist);

                    let tile = Vars.world.tileWorld(tx, ty);
                    if (tile && tile.build && tile.build.block.name.endsWith("uranilum-reactor")) {
                        if (Math.abs(tile.build.x - tx) < 8 && Math.abs(tile.build.y - ty) < 8) {
                            return tile.build;
                        }
                    }
                }
                return null;
            },

            updateTile() {
                this.super$updateTile();

                if (!Vars.state.isPaused()) {
                    this.animTime += Time.delta;
                }

                let reactorBuild = this.findTargetReactor();

                if (reactorBuild != null && this.hasRequiredResources()) {
                    if (this.chargeProgress < 1.0) {
                        this.chargeProgress = Math.min(1.0, this.chargeProgress + (1.0 / CHARGE_TIME));
                    } else {
                        if (reactorBuild.addLaser !== undefined) {
                            reactorBuild.addLaser();
                        }
                    }
                } else {
                    this.chargeProgress = Math.max(0.0, this.chargeProgress - 0.05);
                }
            },

            draw() {
                this.super$draw();

                let reactorBuild = this.findTargetReactor();

                if (this.chargeProgress > 0) {
                    Draw.z(Layer.power + 1);

                    let orbPulse = Mathf.absin(this.animTime, 1.5, 0.8);
                    let orbRadius = (this.chargeProgress * 6.5) + orbPulse * this.chargeProgress;

                    Draw.color(Color.valueOf("389bfb"), 0.35 * this.chargeProgress);
                    Fill.circle(this.x, this.y, orbRadius + 5);

                    Draw.color(Color.valueOf("66b1ff"), 0.7 * this.chargeProgress);
                    Fill.circle(this.x, this.y, orbRadius + 2);

                    Draw.color(Color.white, this.chargeProgress);
                    Fill.circle(this.x, this.y, orbRadius * 0.55);

                    if (this.chargeProgress < 1.0) {
                        for (let i = 0; i < 3; i++) {
                            let angle = (this.animTime * 4 + i * 120) % 360;
                            let dist = (1.0 - ((this.animTime * 0.05 + i * 0.33) % 1.0)) * 18;
                            let px = this.x + Angles.trnsx(angle, dist);
                            let py = this.y + Angles.trnsy(angle, dist);

                            Draw.color(Color.valueOf("66b1ff"), this.chargeProgress);
                            Fill.circle(px, py, 1.5);
                        }
                    }

                    if (this.chargeProgress >= 1.0 && reactorBuild != null) {
                        Draw.z(Layer.power + 2);

                        let pulse = Mathf.absin(this.animTime, 1.2, 1.8);
                        let baseWidth = 7.0 + pulse;

                        Draw.color(Color.valueOf("1f65ca"), 0.25);
                        Lines.stroke(baseWidth + 12.0);
                        Lines.line(this.x, this.y, reactorBuild.x, reactorBuild.y);

                        Draw.color(Color.valueOf("389bfb"), 0.6);
                        Lines.stroke(baseWidth + 5.0);
                        Lines.line(this.x, this.y, reactorBuild.x, reactorBuild.y);

                        Draw.color(Color.valueOf("66b1ff"));
                        Lines.stroke(baseWidth);
                        Lines.line(this.x, this.y, reactorBuild.x, reactorBuild.y);

                        Draw.color(Color.white);
                        Lines.stroke(baseWidth * 0.4);
                        Lines.line(this.x, this.y, reactorBuild.x, reactorBuild.y);

                        if (Mathf.chance(0.6) && !Vars.state.isPaused()) {
                            let p1 = Mathf.random(0.1, 0.4);
                            let p2 = p1 + Mathf.random(0.3, 0.5);

                            let lx1 = Mathf.lerp(this.x, reactorBuild.x, p1);
                            let ly1 = Mathf.lerp(this.y, reactorBuild.y, p1);
                            let lx2 = Mathf.lerp(this.x, reactorBuild.x, p2);
                            let ly2 = Mathf.lerp(this.y, reactorBuild.y, p2);

                            createLyvervonLightning(lx1, ly1, lx2, ly2, 2.5);
                        }

                        Draw.color(Color.valueOf("66b1ff"), 0.7);
                        Fill.circle(reactorBuild.x, reactorBuild.y, 7 + pulse);
                        Draw.color(Color.white);
                        Fill.circle(reactorBuild.x, reactorBuild.y, 3.5 + pulse * 0.5);
                    }

                    Draw.reset();
                }
            }
        });
    }
});