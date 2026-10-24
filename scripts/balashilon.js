const NexNet = global.NexNet;
const PerfCore = global.PerfCore;
const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

function draw3DRotatedEllipseWave(centerX, centerY, radiusX, radiusY, rotationDeg) {
    let points = 20;
    let rotationRad = rotationDeg * Mathf.degRad;
    let cosRot = Math.cos(rotationRad);
    let sinRot = Math.sin(rotationRad);

    let localX = radiusX;
    let localY = 0;
    let lastX = centerX + (localX * cosRot - localY * sinRot);
    let lastY = centerY + (localX * sinRot + localY * cosRot);

    for (let i = 1; i <= points; i++) {
        let angle = (i * 360 / points) * Mathf.degRad;
        localX = Math.cos(angle) * radiusX;
        localY = Math.sin(angle) * radiusY;

        let nextX = centerX + (localX * cosRot - localY * sinRot);
        let nextY = centerY + (localX * sinRot + localY * cosRot);

        Lines.line(lastX, lastY, nextX, nextY);

        lastX = nextX;
        lastY = nextY;
    }
}

const customShockwaveEffect = new Effect(40, packCons((e) => {
    Draw.z(Layer.effect + 4);
    let f = e.fin();
    let alpha = 1.0 - Interp.pow3Out.apply(f);
    let radius = 10 + (240 * Interp.pow2Out.apply(f));

    Lines.stroke(6 * alpha, Color.valueOf("ffb380"));
    Lines.circle(e.x, e.y, radius);

    Lines.stroke(3 * alpha, Color.white);
    Lines.circle(e.x, e.y, radius * 0.85);

    Draw.reset();
}));

const balashilonLaserBeamEffect = new Effect(50, packCons((e) => {
    Draw.z(Layer.effect + 3);
    let f = e.fin();
    let alpha = 1.0 - Interp.pow3Out.apply(f);

    let mainColor = Color.valueOf("00f0ff");
    let coreColor = Color.white;

    let farX = e.x + 1000;
    let farY = e.y + 1500;

    Lines.stroke(18 * alpha, mainColor);
    Lines.line(farX, farY, e.x, e.y);
    Lines.stroke(8 * alpha, coreColor);
    Lines.line(farX, farY, e.x, e.y);

    Lines.stroke(4 * (1.0 - f), mainColor);
    Lines.circle(e.x, e.y, 8 + (60 * f));

    Draw.reset();
}));

const meteorFallingEffect = new Effect(50, packCons((e) => {
    Draw.z(Layer.effect + 5);
    let f = e.fin();

    let portalX = e.x - 220;
    let portalY = e.y + 450;

    let currentX = Mathf.lerp(portalX, e.x, f);
    let currentY = Mathf.lerp(portalY, e.y, f);

    if (f < 0.85) {
        let portalAlpha = f < 0.15 ? f / 0.15 : (0.85 - f) / 0.7;

        let starRegion = PerfCore.region("newex-star-field");
        if (!starRegion.found()) starRegion = PerfCore.region("star-field");

        if (starRegion.found()) {
            Draw.color(Color.white);
            Draw.alpha(portalAlpha * 0.8);
            Draw.rect(starRegion, portalX, portalY, 108, 108, Time.time * 3.0);
        }

        let blackholeRegion = PerfCore.region("newex-blackhole-pulse");
        if (!blackholeRegion.found()) blackholeRegion = PerfCore.region("blackhole-pulse");

        if (blackholeRegion.found()) {
            Draw.color(Color.white);
            Draw.alpha(portalAlpha);
            Draw.rect(blackholeRegion, portalX, portalY, 90, 90, Time.time * -6.0);
        }

        Draw.color(PerfCore.color("1a1721"));
        Draw.alpha(portalAlpha * 0.6);
        Fill.circle(portalX, portalY, 18 + Math.sin(Time.time * 0.15) * 2);

        Draw.color(Color.black);
        Draw.alpha(portalAlpha);
        Fill.circle(portalX, portalY, 14);
    }

    let waveAngle = 33;
    let waveRadius = 6 + (28 * Interp.pow2Out.apply(f));
    Lines.stroke(2.0 * (1.0 - f), Color.valueOf("ffb380"));
    draw3DRotatedEllipseWave(currentX, currentY, waveRadius, waveRadius * 0.4, waveAngle);

    let flightAngle = Angles.angle(portalX, portalY, e.x, e.y);
    let tailAngle = flightAngle + 180;

    if (Mathf.chance(0.8)) {
        let tailX = currentX + Angles.trnsx(tailAngle, 6);
        let tailY = currentY + Angles.trnsy(tailAngle, 6);
        Fx.smoke.at(tailX + Mathf.range(3), tailY + Mathf.range(3));
    }

    let meteorRegion = PerfCore.region("newex-basalt-bluff");
    if (!meteorRegion.found()) {
        meteorRegion = PerfCore.region("basalt-bluff");
    }

    if (meteorRegion.found()) {
        Draw.color(Color.white);
        let rotation = Time.time * 15.0;
        Draw.rect(meteorRegion, currentX, currentY, 24, 24, rotation);
    } else {
        Draw.color(PerfCore.color("594e48"));
        Fill.circle(currentX, currentY, 9);
    }

    Draw.reset();
}));

const builderBulletType = extend(BasicBulletType, {
    speed: 8,
    damage: 0,
    width: 12,
    height: 24,
    shrinkY: 0,
    lifetime: 180,
    frontColor: Color.valueOf("00f0ff"),
    backColor: Color.valueOf("00a2ff"),

    despawned(b) {
        this.super$despawned(b);

        let tx = b.x;
        let ty = b.y;
        let team = b.team;

        Fx.spawn.at(tx, ty);
        Fx.placeBlock.at(tx, ty, 4);

        let centerTile = Vars.world.tileWorld(tx, ty);
        if (centerTile == null) return;

        let blastDrill = Blocks.blastDrill;
        if (blastDrill != null) {
            centerTile.setNet(blastDrill, team, 0);
        }

        let leftTile = Vars.world.tile(centerTile.x - 3, centerTile.y);
        let pinfyrBlock = Vars.content.getByName(ContentType.block, "battery-large");
        if (pinfyrBlock == null) {
            pinfyrBlock = Vars.content.getByName(ContentType.block, "battery-large");
        }

        if (leftTile != null && pinfyrBlock != null) {
            leftTile.setNet(pinfyrBlock, team, 0);

            let pinBuild = leftTile.build;
            if (pinBuild != null) {
                if (pinBuild.power != null) {
                    pinBuild.power.status = 1.0;
                }
                if ("energy" in pinBuild) {
                    pinBuild.energy = pinfyrBlock.consPower ? pinfyrBlock.consPower.capacity : 10000;
                }
            }
        }

        let rightTile = Vars.world.tile(centerTile.x + 3, centerTile.y);
        let container = Blocks.container;
        if (rightTile != null && container != null) {
            rightTile.setNet(container, team, 0);
        }
    }
});

let balashilonBlock = null;
let balashilonReady = false;
const METEOR_COST = 200;

NexNet.on("balashilon", (player, payload) => {
    let b = Vars.world.build(parseInt(payload));
    if (b == null || typeof b.queueMeteor !== "function") return;
    if (player != null && b.team != player.team()) return;

    let core = b.team.core();
    if (core == null || !core.items.has(Items.copper, METEOR_COST)) {
        NexNet.toastTo(player, "[red]Không đủ 200 Đồng![]", 2);
        return;
    }

    core.items.remove(Items.copper, METEOR_COST);
    b.queueMeteor();
}, true, 250);

function setupBalashilon() {
    if (balashilonReady) return;

    balashilonBlock = Vars.content.getByName(ContentType.block, "newex-balashilon");
    if (balashilonBlock == null) {
        balashilonBlock = Vars.content.getByName(ContentType.block, "balashilon");
    }
    if (balashilonBlock == null) return;

    balashilonReady = true;
    balashilonBlock.configurable = true;
    balashilonBlock.update = true;

    balashilonBlock.buildType = () => extend(Building, {
        meteorQueue: [],
        shootQueue: [],

        queueMeteor() {
            NexNet.fx(balashilonLaserBeamEffect, this.x, this.y);
            NexNet.fx(Fx.shieldApply, this.x, this.y, 0, Color.valueOf("00f0ff"));

            let delayTicks = Mathf.random(180, 360);
            let maxRadiusPixels = 150 * Vars.tilesize;
            let angle = Mathf.random(360);
            let distance = Mathf.random(16, maxRadiusPixels);

            this.meteorQueue.push({
                timer: delayTicks,
                falling: false,
                x: this.x + Angles.trnsx(angle, distance),
                y: this.y + Angles.trnsy(angle, distance)
            });
        },

        buildConfiguration(table) {
            table.clear();
            table.row();

            table.button(Icon.ok, Styles.cleari, 40, packRun(() => {
                let teamCore = this.team.core();
                if (teamCore == null || !teamCore.items.has(Items.copper, METEOR_COST)) {
                    Vars.ui.showInfoToast("[red]Không đủ 200 Đồng![]", 2);
                    return;
                }

                NexNet.send("balashilon", this.pos());
                this.deselect();
            })).size(50, 40).tooltip("Kích hoạt gọi Thiên thạch (Tốn 200 Đồng)");
        },

        updateTile() {
            this.super$updateTile();
            if (Vars.net.client()) return;

            for (let i = this.meteorQueue.length - 1; i >= 0; i--) {
                let item = this.meteorQueue[i];
                item.timer -= Time.delta;

                if (!item.falling && item.timer <= 50) {
                    item.falling = true;
                    NexNet.fx(meteorFallingEffect, item.x, item.y);
                }

                if (item.timer <= 0) {
                    this.spawnRandomMeteorOre(item.x, item.y);

                    this.shootQueue.push({
                        timer: 180,
                        x: item.x,
                        y: item.y
                    });

                    this.meteorQueue.splice(i, 1);
                }
            }

            for (let i = this.shootQueue.length - 1; i >= 0; i--) {
                let s = this.shootQueue[i];
                s.timer -= Time.delta;

                if (s.timer <= 0) {
                    let angle = Angles.angle(this.x, this.y, s.x, s.y);
                    let dst = Mathf.dst(this.x, this.y, s.x, s.y);
                    let lifeScale = dst / (builderBulletType.speed * builderBulletType.lifetime);

                    Call.createBullet(builderBulletType, this.team, this.x, this.y, angle, 0, 1, lifeScale);

                    this.shootQueue.splice(i, 1);
                }
            }
        },

        spawnRandomMeteorOre(tx, ty) {
            let targetTile = Vars.world.tileWorld(tx, ty);
            if (targetTile == null) return;

            NexNet.fx(Fx.reactorExplosion, tx, ty);
            NexNet.fx(Fx.dynamicExplosion, tx, ty);
            NexNet.fx(Fx.smokeCloud, tx, ty);
            NexNet.fx(customShockwaveEffect, tx, ty);
            NexNet.shake(14, 14, tx, ty);

            Damage.damage(tx, ty, 30 * Vars.tilesize, 1000);

            let destroyRadius = 15;
            let outerRadius = 30;

            for (let rx = -outerRadius; rx <= outerRadius; rx++) {
                for (let ry = -outerRadius; ry <= outerRadius; ry++) {
                    let dist = Math.sqrt(rx * rx + ry * ry);
                    let t = Vars.world.tile(targetTile.x + rx, targetTile.y + ry);

                    if (t != null && t.build != null) {
                        let b = t.build;

                        if (dist <= destroyRadius) {
                            b.kill();
                        } else if (dist <= outerRadius) {
                            b.damage(1000);
                        }
                    }
                }
            }

            let vanillaOres = [
                Blocks.oreCopper,
                Blocks.oreLead,
                Blocks.oreCoal,
                Blocks.oreTitanium,
                Blocks.oreThorium,
                Blocks.oreScrap
            ];

            if (Blocks.oreBeryllium != null) vanillaOres.push(Blocks.oreBeryllium);
            if (Blocks.oreTungsten != null) vanillaOres.push(Blocks.oreTungsten);

            let availableOres = vanillaOres.filter(o => o != null);
            let selectedOre = availableOres[Math.floor(Mathf.random(0, availableOres.length))];

            if (selectedOre == null) return;

            let oreRadius = Math.floor(Mathf.random(2, 5));

            for (let rx = -oreRadius; rx <= oreRadius; rx++) {
                for (let ry = -oreRadius; ry <= oreRadius; ry++) {
                    let dist = Math.sqrt(rx * rx + ry * ry);

                    if (dist <= oreRadius && Mathf.chance(1.0 - (dist / (oreRadius + 1.0)))) {
                        let t = Vars.world.tile(targetTile.x + rx, targetTile.y + ry);

                        if (t != null && t.floor() != null && !t.floor().isLiquid) {
                            NexNet.setOverlay(t, selectedOre);
                        }
                    }
                }
            }
        }
    });
}

Events.on(ClientLoadEvent, setupBalashilon);
Events.on(ServerLoadEvent, setupBalashilon);
