Events.on(ContentInitEvent, () => {
 
    const emeraliftWall = Vars.content.block("newex-emeralift-wall");

    if (emeraliftWall != null) {
 
        const circleWaveFx = new Effect(30, cons(e => {
            Draw.color(Color.valueOf("84e070"));  
            Lines.stroke(1.5 * e.fout());  
            Lines.circle(e.x, e.y, 4 + e.fin() * 16); 
            Draw.reset();
        }));

        emeraliftWall.update = true;

        emeraliftWall.buildType = prov(() => {
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

                    this.shockTimer += Time.delta;
                    if (this.shockTimer >= this.nextShockTime) {
                        this.shockTimer = 0;
                        this.nextShockTime = Mathf.random(60, 120);

                
                        circleWaveFx.at(this.x, this.y);
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