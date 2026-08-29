Events.on(ContentInitEvent, () => {
    const redstoneWall = Vars.content.block("newex-redstone-wall");

    if (redstoneWall != null) {
        redstoneWall.update = true;

        redstoneWall.buildType = prov(() => {
            return extend(Building, {
                lifetime: 300 * 60,
                timeRemaining: 300 * 60,
                shockTimer: 0,
                nextShockTime: 60,
                drainTicks: 0,

                placed() {
                    this.super$placed();
                    this.timeRemaining = this.lifetime;
                    this.nextShockTime = Mathf.random(60, 120);
                },

 
                applyComduikDrain() {
                    this.drainTicks = 2;  
                },

                updateTile() {
                    this.super$updateTile();
 
                    let decayMultiplier = (this.drainTicks > 0) ? 1.8 : 1.0;
                    if (this.drainTicks > 0) this.drainTicks--;

                    this.timeRemaining -= Time.delta * decayMultiplier;

                    if (this.timeRemaining <= 0) {
                        this.tile.setAir();
                        return;
                    }

                    let lifeProgress = Math.max(0, this.timeRemaining / this.lifetime);

                    this.shockTimer += Time.delta;
                    if (this.shockTimer >= this.nextShockTime) {
                        this.shockTimer = 0;
                        this.nextShockTime = Mathf.random(60, 120);

                        let maxBolts = Math.floor(1 + lifeProgress * 4);
                        let boltCount = Math.floor(Mathf.random(1, maxBolts + 1));

                        for (let i = 0; i < boltCount; i++) {
                            let randomAngle = Mathf.random(360);
                            Lightning.create(this.team, Color.valueOf("ff4444"), 20, this.x, this.y, randomAngle, 5);
                        }

                        try { Fx.spark.at(this.x, this.y); } catch(e) {}
                    }
                },

                draw() {
                    let progress = Math.max(0, this.timeRemaining / this.lifetime);
                    let gray = Tmp.c1.set(0.4, 0.4, 0.4, 1.0);
                    let current = Tmp.c2.set(Color.white).lerp(gray, 1.0 - progress);

                    Draw.color(current);
                    Draw.rect(this.block.region, this.x, this.y);
                    Draw.reset();
                }
            });
        });
    }
});