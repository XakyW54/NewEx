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

 
function updateMenuVisibility() {
    const wallBuff = Vars.content.block("newex-copesblock") || Vars.content.block("copesblock");
    if (!Vars.player || !wallBuff) return;

    let playerTeam = Vars.player.team();
    let maxAllowed = playerTeam.cores().size;  
    
    let currentCount = 0;
    Groups.build.each(b => {
        if (b.block === wallBuff && b.team === playerTeam) {
            currentCount++;
        }
    });

 
    if (currentCount < maxAllowed) {
        wallBuff.buildVisibility = BuildVisibility.shown;
    } else {
        wallBuff.buildVisibility = BuildVisibility.hidden;
    }
}

Events.on(ContentInitEvent, () => {
    const wallBuff = Vars.content.block("newex-copesblock") || Vars.content.block("copesblock");

    if (wallBuff) {
        wallBuff.update = true;
        const rangeSize = 96;

        wallBuff.buildType = () => extend(Wall.WallBuild, wallBuff, {
            range: rangeSize,         
            boostTimer: 0,     

            updateTile() {
                this.super$updateTile();

                this.boostTimer += Time.delta;
                if (this.boostTimer >= 30) {
                    this.boostTimer = 0;
                    this.applyPerformanceBoost();
                }
            },

            applyPerformanceBoost() {
                Groups.build.each(building => {
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
                });
            },

            drawSelect() {
                this.super$drawSelect();
                Drawf.dashSquare(Pal.accent, this.x, this.y, this.range * 2);
            }
        });
    }
});

 
Events.on(WorldLoadEvent, event => {
    Time.run(10, () => {
        updateMenuVisibility();
    });
});

 
Events.on(BlockBuildEndEvent, event => {
    updateMenuVisibility();
});

 
Events.on(BlockDestroyEvent, event => {
    const wallBuff = Vars.content.block("newex-copesblock") || Vars.content.block("copesblock");
    if (!wallBuff) return;

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
            if (b.block === wallBuff && b.team === victimTeam) {
                teamBlocks.push(b);
            }
        });

        if (teamBlocks.length > maxAllowed) {
            let toDestroy = teamBlocks.length - maxAllowed;
            for (let i = 0; i < toDestroy; i++) {
                let lastBlock = teamBlocks.pop();
                Call.sendMessage("[red]Đội " + victimTeam.name + " bị mất Lõi! Khối copesblock thừa đã tự hủy![]");
                lastBlock.kill();
            }
        }
    }

    updateMenuVisibility();
});

 
Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && (build.name == "newex-copesblock" || build.name == "copesblock")) {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        
        if (tile != null) {
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;
            let rangeSize = 96;

            Drawf.dashSquare(Pal.accent, centerX, centerY, rangeSize * 2);
        }
    }
});