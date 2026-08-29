const DIR_X = [1, 0, -1, 0];
const DIR_Y = [0, 1, 0, -1];

const lyvervonLightningColor = Color.valueOf("7fd4ff");
const transferColor = Color.valueOf("00ffcc");

 
const lyvervonLightningEffect = new Effect(10, e => {
    if (!(e.data instanceof Seq)) return;
    const points = e.data;
    let thickness = e.rotation > 0 ? e.rotation : 2.5;
    
    Draw.color(lyvervonLightningColor, Color.white, e.fin());
    Lines.stroke(thickness * e.fout());
    for (let i = 0; i < points.size - 1; i++) {
        let a = points.get(i);
        let b = points.get(i + 1);
        Lines.line(a.x, a.y, b.x, b.y, false);
    }
    Draw.reset();
});

 
const comduikTransferFx = new Effect(30, cons(e => {
    Draw.z(Layer.effect + 0.05);

    let targetSize = (e.data != null && typeof e.data === "number") ? e.data : 16;
    let baseRadius = (targetSize * (2 / 3)) / 2; 

    let pulse = Math.sin(e.fin() * Math.PI * 2) * (baseRadius * 0.25); 
    let currentRadius = Math.max(2, baseRadius + pulse);
    let alpha = 0.8 * (1.0 - e.fin());

    Draw.color(transferColor);
    Draw.alpha(alpha * 0.25);
    Fill.circle(e.x, e.y, currentRadius);

    Draw.color(transferColor);
    Draw.alpha(alpha);
    Lines.stroke(2.0 * (1.0 - e.fin()));
    Lines.circle(e.x, e.y, currentRadius);

    Draw.reset();
}));

 
const helTransfer = new Effect(25, cons(e => {
    Draw.z(Layer.effect + 0.01);
    if (e.data == null || typeof e.data.tx === "undefined") return;

    let x1 = e.x, y1 = e.y;
    let x2 = e.data.tx, y2 = e.data.ty;
    let alpha = 1.0 - e.fin();

    let colorRand = Mathf.randomSeed(e.id + Math.floor(e.fin() * 10));
    Draw.color(transferColor, Color.white, colorRand);
    Lines.stroke(1.2 * alpha);

    let segments = 6;
    let lastX = x1, lastY = y1;

    for (let i = 1; i <= segments; i++) {
        let progress = i / segments;
        let nx = Mathf.lerp(x1, x2, progress);
        let ny = Mathf.lerp(y1, y2, progress);

        if (i < segments) {
            let offset = (1.0 - Math.abs(progress - 0.5) * 2) * 4.0;
            let randX = Mathf.randomSeed(e.id * 100 + i + Math.floor(e.fin() * 5), -offset, offset);
            let randY = Mathf.randomSeed(e.id * 200 + i + Math.floor(e.fin() * 5), -offset, offset);
            nx += randX;
            ny += randY;
        }

        Lines.line(lastX, lastY, nx, ny);
        lastX = nx;
        lastY = ny;
    }

    Draw.reset();
}));

function createLyvervonLightningReverse(wallX, wallY, comduikX, comduikY, thickness) {
    let dst = Mathf.dst(wallX, wallY, comduikX, comduikY);
    let segs = Math.max(4, Math.floor(dst / 6));
    let points = new Seq();
    
    points.add(new Vec2(wallX, wallY));
    let angle = Angles.angle(wallX, wallY, comduikX, comduikY);

    for (let i = 1; i < segs; i++) {
        let t = i / segs;
        let px = Mathf.lerp(wallX, comduikX, t);
        let py = Mathf.lerp(wallY, comduikY, t);
        
        let noise = Mathf.range(8);
        Tmp.v1.trns(angle + 90, noise);
        points.add(new Vec2(px + Tmp.v1.x, py + Tmp.v1.y));
    }
    points.add(new Vec2(comduikX, comduikY));
    
    lyvervonLightningEffect.at((wallX + comduikX) / 2, (wallY + comduikY) / 2, thickness, points);
}

Events.on(ContentInitEvent, () => {
    const comduik = Vars.content.block("newex-comduik");
    const redstoneWall = Vars.content.block("newex-redstone-wall");

    if (comduik != null && redstoneWall != null) {
        comduik.rotate = true;
        comduik.update = true;
        comduik.hasPower = true;

        const maxCapacity = 100000000;
        comduik.consumePowerBuffered(maxCapacity);

        comduik.addBar("power", b => new Bar(
            prov(() => "Power: " + Math.floor(b.power.status * b.block.consPower.capacity) + " / " + b.block.consPower.capacity),
            prov(() => Pal.powerBar),
            floatp(() => b.power.status)
        ));

        comduik.buildType = prov(() => {
            return extend(Building, {
                lightningTimer: 0,
                transferTimer: 0,
                activeTargets: [],

                getRangeBounds() {
                    let rot = this.rotation & 3;
                    let dx = DIR_X[rot];
                    let dy = DIR_Y[rot];

                    let minX = (dx > 0) ? this.x + 8 : ((dx < 0) ? this.x - 48 : this.x - 8);
                    let minY = (dy > 0) ? this.y + 8 : ((dy < 0) ? this.y - 48 : this.y - 8);
                    let maxX = minX + ((dx !== 0) ? 40 : 16);
                    let maxY = minY + ((dy !== 0) ? 40 : 16);

                    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
                },

                updateTile() {
                    this.super$updateTile();

                    let bounds = this.getRangeBounds();
                    this.activeTargets = [];

           
                    Units.nearbyBuildings(
                        (bounds.minX + bounds.maxX) / 2, 
                        (bounds.minY + bounds.maxY) / 2, 
                        48, 
                        cons(b => {
                            if (b != null && b.block === redstoneWall) {
                                if (b.x >= bounds.minX && b.x <= bounds.maxX && b.y >= bounds.minY && b.y <= bounds.maxY) {
                                    this.activeTargets.push(b);

                                    if (this.power) {
                                        let capacity = this.block.consPower.capacity;
                                        let currentPower = this.power.status * capacity;
                                        let newPower = Math.min(capacity, currentPower + (800 / 60));
                                        this.power.status = newPower / capacity;
                                    }

                                    if (b.applyComduikDrain) {
                                        b.applyComduikDrain();
                                    }

                                    this.lightningTimer += Time.delta;
                                    if (this.lightningTimer >= 30) {
                                        this.lightningTimer = 0;
                                        createLyvervonLightningReverse(b.x, b.y, this.x, this.y, 2.5);
                                        try { 
                                            Fx.hitLancer.at(this.x, this.y, lyvervonLightningColor); 
                                        } catch(e) {}
                                    }
                                }
                            }
                        })
                    );

                   
                    if (this.power && this.power.status > 0) {
                        let capacity = this.block.consPower.capacity;
                        let currentStored = this.power.status * capacity;

                        let rot = this.rotation & 3;
                        let sideDirections = [(rot + 1) % 4, (rot + 2) % 4, (rot + 3) % 4];

                        this.transferTimer += Time.delta;
                        let canPlayFx = false;
                        if (this.transferTimer >= 15) {
                            this.transferTimer = 0;
                            canPlayFx = true;
                        }

                        let processedTargets = {};

                     
                        Units.nearbyBuildings(this.x, this.y, (this.block.size * 8) + 16, cons(target => {
                            if (target == null || target === this || target.team !== this.team || processedTargets[target.id]) return;

                            
                            let isSideTarget = false;
                            for (let i = 0; i < sideDirections.length; i++) {
                                let dir = sideDirections[i];
                                let checkX = this.x + DIR_X[dir] * (this.block.size * 4 + 4);
                                let checkY = this.y + DIR_Y[dir] * (this.block.size * 4 + 4);
                                
                                if (target.dst(checkX, checkY) <= (target.block.size * 8)) {
                                    isSideTarget = true;
                                    break;
                                }
                            }

                            if (isSideTarget && target.power != null && target.block.consPower != null) {
                                processedTargets[target.id] = true;
                                let targetCap = target.block.consPower.capacity;
                                
                                if (targetCap > 0) {
                                    let targetCurrent = target.power.status * targetCap;
                                    let needed = targetCap - targetCurrent;

                                    if (needed > 0 && currentStored > 0) {
                                        let transfer = Math.min(currentStored, Math.min(needed, 800 / 60));
                                        currentStored -= transfer;
                                        
                                        target.power.status = Math.min(1.0, (targetCurrent + transfer) / targetCap);

                                
                                        if (canPlayFx) {
                                            let targetPixelSize = target.block.size * Vars.tilesize;
                                            comduikTransferFx.at(target.x, target.y, 0, targetPixelSize);
                                            helTransfer.at(this.x, this.y, 0, { tx: target.x, ty: target.y });
                                        }
                                    }
                                }
                            }
                        }));

                        this.power.status = currentStored / capacity;
                    }
                },

                drawSelect() {
                    this.super$drawSelect();

                    let bounds = this.getRangeBounds();
                    let outlineColor = (this.activeTargets.length > 0) ? Pal.accent : Color.scarlet;

                    Draw.z(Layer.power + 1);
                    Drawf.dashLine(outlineColor, bounds.minX, bounds.minY, bounds.maxX, bounds.minY);
                    Drawf.dashLine(outlineColor, bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY);
                    Drawf.dashLine(outlineColor, bounds.maxX, bounds.maxY, bounds.minX, bounds.maxY);
                    Drawf.dashLine(outlineColor, bounds.minX, bounds.maxY, bounds.minX, bounds.minY);
                    Draw.reset();
                }
            });
        });
    }
});
