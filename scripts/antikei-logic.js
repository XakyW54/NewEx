let antikeiBlock;
let mapHasAntikei = false;
let flowMap = {}; 

Events.on(ContentInitEvent, () => {
    antikeiBlock = Vars.content.block("newex-antikei");
});

function getPlayerCore() {
    let teamData = Vars.state.teams.get(Vars.player.team());
    if (teamData != null && teamData.cores != null && !teamData.cores.isEmpty()) {
        return teamData.cores.first();
    }
    return null;
}

function generateFlowMap() {
    flowMap = {};
    if (!antikeiBlock || Vars.world == null) return;

    let targetCore = getPlayerCore();
    if (!targetCore) return;

    let queue = [];
    let visited = new java.util.HashSet();

    let startTile = null;
    let minDst = Infinity;

    for (let x = 0; x < Vars.world.width(); x++) {
        for (let y = 0; y < Vars.world.height(); y++) {
            let tile = Vars.world.tile(x, y);
            if (tile != null && tile.floor() === antikeiBlock) {
                let dst = Mathf.dst2(tile.worldx(), tile.worldy(), targetCore.x, targetCore.y);
                if (dst < minDst) {
                    minDst = dst;
                    startTile = tile;
                }
            }
        }
    }

    if (!startTile) return;

    let key = startTile.x + "," + startTile.y;
    queue.push(startTile);
    visited.add(key);

    let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];

    while (queue.length > 0) {
        let current = queue.shift();

        for (let i = 0; i < dirs.length; i++) {
            let nx = current.x + dirs[i][0];
            let ny = current.y + dirs[i][1];
            let neighborKey = nx + "," + ny;

            let neighbor = Vars.world.tile(nx, ny);
            if (neighbor != null && neighbor.floor() === antikeiBlock && !visited.contains(neighborKey)) {
                visited.add(neighborKey);
                flowMap[neighborKey] = current;
                queue.push(neighbor);
            }
        }
    }
}

function checkMapHasAntikei() {
    mapHasAntikei = false;
    if (!antikeiBlock || Vars.world == null) return;

    for (let x = 0; x < Vars.world.width(); x++) {
        for (let y = 0; y < Vars.world.height(); y++) {
            let tile = Vars.world.tile(x, y);
            if (tile != null && tile.floor() === antikeiBlock) {
                mapHasAntikei = true;
                return;
            }
        }
    }
}

function clearOresOnAntikei() {
    if (!antikeiBlock || Vars.world == null) return;

    for (let x = 0; x < Vars.world.width(); x++) {
        for (let y = 0; y < Vars.world.height(); y++) {
            let tile = Vars.world.tile(x, y);
            if (tile != null && tile.floor() === antikeiBlock) {
                if (tile.overlay() != null && tile.overlay() != Blocks.air) {
                    tile.setOverlay(Blocks.air);
                }
            }
        }
    }
}

function findNearestAntikei(unit) {
    let uTileX = unit.tileX();
    let uTileY = unit.tileY();
    let nearest = null;
    let minDst = Infinity;
    let radius = 30;

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            let tile = Vars.world.tile(uTileX + dx, uTileY + dy);
            if (tile != null && tile.floor() === antikeiBlock) {
                let dst = Mathf.dst2(unit.x, unit.y, tile.worldx(), tile.worldy());
                if (dst < minDst) {
                    minDst = dst;
                    nearest = tile;
                }
            }
        }
    }
    return nearest;
}

Events.on(WorldLoadEvent, () => {
    checkMapHasAntikei();
    if (mapHasAntikei) {
        clearOresOnAntikei();
        generateFlowMap();
    }
});

Events.run(Trigger.update, () => {
    if (!antikeiBlock || Vars.state.isMenu() || !mapHasAntikei) return;

    if (Vars.state.isPlaying() && Time.time % 60 == 0) {
        clearOresOnAntikei();
    }

    let isDefenseOrPlanetSector = Vars.state.rules.mode().id == 1 || Vars.state.rules.mode().id == 2 || Vars.state.isCampaign();
    let hasEnemyUnits = Groups.unit.contains(u => u.team != Vars.player.team());

    if (!isDefenseOrPlanetSector && !hasEnemyUnits) return;

    let targetCore = getPlayerCore();

    Groups.unit.each(unit => {
        if (unit == null || !unit.isAdded() || unit.isFlying()) return;

        // BỎ QUA UNIT PHE NGƯỜI CHƠI (CHỈ ÁP DỤNG VỚI QUÁI ĐỊCH)
        if (unit.team == Vars.player.team()) return;

        let range = unit.range ? unit.range() : 100;
        let currentTile = unit.tileOn();
        if (currentTile == null) return;

        let uTileX = unit.tileX();
        let uTileY = unit.tileY();
        let moveTargetX = unit.x;
        let moveTargetY = unit.y;

        if (currentTile.floor() === antikeiBlock) {
            let currentKey = uTileX + "," + uTileY;
            let nextTile = flowMap[currentKey];

            if (nextTile != null) {
                moveTargetX = nextTile.worldx();
                moveTargetY = nextTile.worldy();
            } else if (targetCore) {
                moveTargetX = targetCore.x;
                moveTargetY = targetCore.y;
            }
        } else {
            let nearestAntikei = findNearestAntikei(unit);
            if (nearestAntikei != null) {
                moveTargetX = nearestAntikei.worldx();
                moveTargetY = nearestAntikei.worldy();
            } else {
                unit.vel.set(0, 0);
                return;
            }
        }

        let moveAngle = unit.angleTo(moveTargetX, moveTargetY);
        unit.vel.trns(moveAngle, unit.speed());

        let target = Units.closestTarget(unit.team, unit.x, unit.y, range);

        if (target != null) {
            unit.lookAt(target.x, target.y);
            unit.aim(target.x, target.y);
            unit.controlWeapons(true, true);
        } else {
            unit.lookAt(moveAngle);
            unit.aim(moveTargetX, moveTargetY);
            unit.controlWeapons(false, false);
        }
    });
});