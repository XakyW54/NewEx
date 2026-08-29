let antikeiBlock;
let mapHasAntikei = false;
let flowMap = new java.util.HashMap();

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

function getClosestPlayerCoreDynamic(x, y) {
    let teamData = Vars.state.teams.get(Vars.player.team());
    if (teamData != null && teamData.cores != null && !teamData.cores.isEmpty()) {
        return Geometry.findClosest(x, y, teamData.cores);
    }
    return null;
}

function getTileKey(x, y) {
    return (x & 0xFFFF) | ((y & 0xFFFF) << 16);
}

function updateDynamicFlowMapMultiCore() {
    if (!antikeiBlock || Vars.world == null) return;

    let teamData = Vars.state.teams.get(Vars.player.team());
    if (teamData == null || teamData.cores == null || teamData.cores.isEmpty()) {
        flowMap.clear();
        return;
    }

    let dynamicFlowMap = new java.util.HashMap();
    let queue = [];
    let visited = new java.util.HashSet();
    let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];

    teamData.cores.each(core => {
        let coreTileX = core.tileX();
        let coreTileY = core.tileY();
        let radius = 10;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                let tile = Vars.world.tile(coreTileX + dx, coreTileY + dy);
                if (tile != null && tile.floor() === antikeiBlock) {
                    let key = getTileKey(tile.x, tile.y);
                    if (!visited.contains(key)) {
                        visited.add(key);
                        queue.push(tile);
                    }
                }
            }
        }
    });

    while (queue.length > 0) {
        let current = queue.shift();

        for (let i = 0; i < dirs.length; i++) {
            let nx = current.x + dirs[i][0];
            let ny = current.y + dirs[i][1];
            let neighborKey = getTileKey(nx, ny);

            let neighbor = Vars.world.tile(nx, ny);
            if (neighbor != null && neighbor.floor() === antikeiBlock && !visited.contains(neighborKey)) {
                visited.add(neighborKey);
                dynamicFlowMap.put(neighborKey, current);
                queue.push(neighbor);
            }
        }
    }

    flowMap = dynamicFlowMap;
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

function findNearestAntikeiFast(unit) {
    let uTileX = unit.tileX();
    let uTileY = unit.tileY();

    for (let r = 1; r <= 15; r++) {
        for (let dx = -r; dx <= r; dx++) {
            let tile1 = Vars.world.tile(uTileX + dx, uTileY - r);
            if (tile1 != null && tile1.floor() === antikeiBlock) return tile1;
            let tile2 = Vars.world.tile(uTileX + dx, uTileY + r);
            if (tile2 != null && tile2.floor() === antikeiBlock) return tile2;
        }
        for (let dy = -r + 1; dy <= r - 1; dy++) {
            let tile1 = Vars.world.tile(uTileX - r, uTileY + dy);
            if (tile1 != null && tile1.floor() === antikeiBlock) return tile1;
            let tile2 = Vars.world.tile(uTileX + r, uTileY + dy);
            if (tile2 != null && tile2.floor() === antikeiBlock) return tile2;
        }
    }
    return null;
}

Events.on(WorldLoadEvent, () => {
    checkMapHasAntikei();
    if (mapHasAntikei) {
        clearOresOnAntikei();
        updateDynamicFlowMapMultiCore();
    }
});

Events.on(BlockDestroyEvent, event => {
    if (!mapHasAntikei) return;
    if (event.tile != null && event.tile.build != null && event.tile.build.team == Vars.player.team()) {
        updateDynamicFlowMapMultiCore();
    }
});

Events.run(Trigger.update, () => {
    if (!antikeiBlock || Vars.state.isMenu() || !mapHasAntikei) return;

    if (Vars.state.isPlaying() && Time.time % 60 == 0) {
        clearOresOnAntikei();
        updateDynamicFlowMapMultiCore();
    }

    let playerTeam = Vars.player.team();

    Groups.unit.each(unit => {
        if (unit == null || !unit.isAdded() || unit.isFlying() || unit.team == playerTeam) return;

        let liveCore = getClosestPlayerCoreDynamic(unit.x, unit.y);
        if (liveCore == null) {
            unit.vel.set(0, 0);
            return;
        }

        let currentTile = unit.tileOn();
        if (currentTile == null) return;

        let uTileX = unit.tileX();
        let uTileY = unit.tileY();
        let moveTargetX = unit.x;
        let moveTargetY = unit.y;

        if (currentTile.floor() === antikeiBlock) {
            let currentKey = getTileKey(uTileX, uTileY);
            let nextTile = flowMap.get(currentKey);

            if (nextTile != null) {
                moveTargetX = nextTile.worldx();
                moveTargetY = nextTile.worldy();
            } else {
                moveTargetX = liveCore.x;
                moveTargetY = liveCore.y;
            }
        } else {
            let nearestAntikei = findNearestAntikeiFast(unit);
            if (nearestAntikei != null) {
                moveTargetX = nearestAntikei.worldx();
                moveTargetY = nearestAntikei.worldy();
            } else {
                moveTargetX = liveCore.x;
                moveTargetY = liveCore.y;
            }
        }

        let moveAngle = unit.angleTo(moveTargetX, moveTargetY);
        unit.vel.trns(moveAngle, unit.speed());

        let range = unit.range ? unit.range() : 100;
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