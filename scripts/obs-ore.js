let obsOre = null;
let obsidisOre = null;

 Events.on(ClientLoadEvent, e => {
    obsOre = Vars.content.block("newex-obs-ore");
    obsidisOre = Vars.content.block("newex-ore-obsidis");
});

 Events.on(BlockBuildBeginEvent, event => {
    if(!obsOre) obsOre = Vars.content.block("newex-obs-ore");
    if(!obsidisOre) obsidisOre = Vars.content.block("newex-ore-obsidis");

    if(!obsOre || !obsidisOre) return;

    let tile = event.tile;
    if(tile == null || event.breaking) return;
 
    let build = tile.build;
    let block = build != null ? build.block : tile.block();
 
    let size = (block != null && block.size) ? block.size : 1;

     let startX = tile.x - Math.floor((size - 1) / 2);
    let startY = tile.y - Math.floor((size - 1) / 2);

    let hasObsUnderneath = false;

     for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let currentTile = Vars.world.tile(startX + x, startY + y);
            
            if (currentTile != null) {
                 let isObs = (currentTile.overlay() === obsOre) || (currentTile.floor() === obsOre);

                if (isObs) {
                    hasObsUnderneath = true;
 
                    if (currentTile.overlay() === obsOre) {
                        currentTile.setOverlayNet(obsidisOre);
                    } else {
                        currentTile.setFloorNet(obsidisOre);
                    }

 
                    try {
                        Fx.smallExplode.at(currentTile.worldx(), currentTile.worldy());
                    } catch(err) {}
                }
            }
        }
    }
 
    if (hasObsUnderneath) {
        Time.run(1, () => {
            if (tile.build != null) {
                tile.build.kill();
            } else {
                tile.setNet(Blocks.air);
            }
        });
    }
});