 
const copesBuffCircleEffect = new Effect(35, e => {
    let rand = new Rand(e.id);
    let zoomSpeed = rand.random(6.0, 14.0); 
    let zoomAmplitude = rand.random(1.5, 3.5); 
    let currentRadius = 5.0 + Mathf.absin(Time.time, zoomSpeed, zoomAmplitude);
    
    Lines.stroke(1.5 * e.fout());
    Draw.color(Color.purple);
    Lines.circle(e.x, e.y, currentRadius);
    Draw.reset();
});

 
Events.on(ContentInitEvent, () => {
 
    const wallBuff = Vars.content.block("newex-copesblock") || Vars.content.block("copesblock");

    if (wallBuff) {
        wallBuff.update = true;
        const rangeSize = 80;  

 
        wallBuff.buildType = () => extend(Wall.WallBuild, wallBuff, {
            range: rangeSize,         
            boostTimer: 0,     
            limitCheck: 0,     

            updateTile() {
                this.super$updateTile();
 
                this.limitCheck += Time.delta;
                if (this.limitCheck >= 15) { 
                    this.limitCheck = 0; 
                    let count = 0; 
                    let firstBuild = null;

                    Groups.build.each(b => {
                        if (b.block == wallBuff && b.team == this.team) { 
                            count++; 
                            if (firstBuild == null) firstBuild = b; 
                        }
                    });

                    if (count > 1 && this !== firstBuild) {
                        Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 1 khối copesblock! Cấu trúc thừa đã tự hủy![]"); 
                        this.kill(); 
                        return;
                    }
                }

 
                this.boostTimer += Time.delta;
                if (this.boostTimer >= 30) {
                    this.boostTimer = 0;
                    this.applyPerformanceBoost();
                }
            },

 
            applyPerformanceBoost() {
                Groups.build.each(cons(building => {
                    if (building === this) return;

                    let inSquare = Math.abs(building.x - this.x) <= this.range && 
                                   Math.abs(building.y - this.y) <= this.range;

                    if (inSquare) {
                        if (building.team == this.team && building instanceof Drill.DrillBuild) {
                            building.applyBoost(1.5, 35); 
                            if (Math.random() < 0.45) {
                                copesBuffCircleEffect.at(building.x, building.y);
                            }
                        }
                    }
                }));
            },

 
            drawSelect() {
                this.super$drawSelect();
                Drawf.dashSquare(Pal.accent, this.x, this.y, this.range * 2);
            }
        });
    }
});

 
Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && (build.name == "newex-copesblock" || build.name == "copesblock")) {
 
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        
        if (tile != null) {
 
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;

            let rangeSize = 80;

 
            Drawf.dashSquare(Pal.accent, centerX, centerY, rangeSize * 2);
        }
    }
});