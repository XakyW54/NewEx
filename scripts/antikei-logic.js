// antikei-logic.js

let antikeiBlock;
let mapHasAntikei = false;

// Lưu hướng di chuyển dạng Angle cho từng ô
let flowDirectionMap = new java.util.HashMap();
// Lưu hướng đi cuối cùng của Unit bằng ID để tránh lỗi customData
let unitLastAngles = new java.util.HashMap();

Events.on(ContentInitEvent, () => {
    antikeiBlock = Vars.content.block("newex-antikei");
});

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

// Cập nhật đường đi tự động ban đầu
function updateDynamicFlowMapMultiCore() {
    if (!antikeiBlock || Vars.world == null) return;

    let teamData = Vars.state.teams.get(Vars.player.team());
    if (teamData == null || teamData.cores == null || teamData.cores.isEmpty()) {
        flowDirectionMap.clear();
        return;
    }

    let newDirMap = new java.util.HashMap();
    let queue = [];
    let visited = new java.util.HashSet();
    let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];

    teamData.cores.each(core => {
        let coreTileX = core.tileX();
        let coreTileY = core.tileY();
        let radius = 12;

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
                
                // Mũi tên mặc định hướng về Lõi
                let angle = Angles.angle(neighbor.worldx(), neighbor.worldy(), current.worldx(), current.worldy());
                
                // Nếu người chơi đã xoay hướng mũi tên thủ công trước đó thì giữ nguyên
                if (flowDirectionMap.containsKey(neighborKey)) {
                    newDirMap.put(neighborKey, flowDirectionMap.get(neighborKey));
                } else {
                    newDirMap.put(neighborKey, java.lang.Float.valueOf(angle));
                }
                
                queue.push(neighbor);
            }
        }
    }

    flowDirectionMap = newDirMap;
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

    for (let r = 1; r <= 20; r++) {
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

    // NHẤP CHUỘT GIỮA ĐỂ XOAY HƯỚNG MŨI TÊN CHỈ ĐƯỜNG
    if (Core.input.keyTap(KeyCode.mouseMiddle)) {
        let mouseVec = Core.camera.unproject(Core.input.mouse());
        let tile = Vars.world.tileWorld(mouseVec.x, mouseVec.y);

        if (tile != null && tile.floor() === antikeiBlock) {
            let key = getTileKey(tile.x, tile.y);
            let currentAngle = flowDirectionMap.containsKey(key) ? Number(flowDirectionMap.get(key)) : 0;
            
            // Xoay 90 độ mỗi lần nhấp chuột giữa
            let nextAngle = (currentAngle + 90) % 360;
            flowDirectionMap.put(key, java.lang.Float.valueOf(nextAngle));
        }
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
        let moveAngle = 0;

        // BÀN CỜ DẪN ĐƯỜNG
        if (currentTile.floor() === antikeiBlock) {
            let currentKey = getTileKey(uTileX, uTileY);
            let arrowDir = flowDirectionMap.get(currentKey);

            if (arrowDir != null) {
                moveAngle = Number(arrowDir);
                unitLastAngles.put(unit.id, java.lang.Float.valueOf(moveAngle)); // Lưu hướng vào Map an toàn
            } else {
                moveAngle = unit.angleTo(liveCore.x, liveCore.y);
            }
        } else {
            // KHI RỜI KHỎI KHỐI: Đi thẳng theo hướng mũi tên cuối cùng
            if (unitLastAngles.containsKey(unit.id)) {
                moveAngle = Number(unitLastAngles.get(unit.id));

                let checkX = unit.x + Angles.trnsx(moveAngle, 24);
                let checkY = unit.y + Angles.trnsy(moveAngle, 24);
                let futureTile = Vars.world.tileWorld(checkX, checkY);

                if (futureTile == null || futureTile.floor() !== antikeiBlock) {
                    let nearest = findNearestAntikeiFast(unit);
                    if (nearest != null) {
                        moveAngle = unit.angleTo(nearest.worldx(), nearest.worldy());
                    } else {
                        moveAngle = unit.angleTo(liveCore.x, liveCore.y);
                    }
                }
            } else {
                let nearest = findNearestAntikeiFast(unit);
                if (nearest != null) {
                    moveAngle = unit.angleTo(nearest.worldx(), nearest.worldy());
                } else {
                    moveAngle = unit.angleTo(liveCore.x, liveCore.y);
                }
            }
        }

        // Áp dụng vận tốc
        unit.vel.trns(moveAngle, unit.speed());

        // Ngắm và bắn khi di chuyển
        let range = unit.range ? unit.range() : 100;
        let target = Units.closestTarget(unit.team, unit.x, unit.y, range);

        if (target != null) {
            unit.lookAt(target.x, target.y);
            unit.aim(target.x, target.y);
            unit.controlWeapons(true, true);
        } else {
            unit.lookAt(moveAngle);
            unit.aim(unit.x + Angles.trnsx(moveAngle, 10), unit.y + Angles.trnsy(moveAngle, 10));
            unit.controlWeapons(false, false);
        }
    });
});

// VẼ MŨI TÊN CHỈ ĐƯỜNG TRÊN Ô ANTIKEI
Events.run(Trigger.draw, () => {
    if (!mapHasAntikei || !antikeiBlock || Vars.state.isMenu()) return;

    Draw.z(Layer.floor + 0.1);
    
    let iterator = flowDirectionMap.entrySet().iterator();
    while (iterator.hasNext()) {
        let entry = iterator.next();
        let key = entry.getKey();
        let angleObj = entry.getValue();

        let x = key & 0xFFFF;
        let y = (key >> 16) & 0xFFFF;
        
        let worldX = x * Vars.tilesize + Vars.tilesize / 2;
        let worldY = y * Vars.tilesize + Vars.tilesize / 2;

        if (Core.camera.bounds(Tmp.r1).contains(worldX, worldY)) {
            let angle = Number(angleObj);
            
            Draw.color(Pal.accent);
            Lines.stroke(1.2);
            
            // Vẽ thân và đầu mũi tên
            Lines.lineAngleCenter(worldX, worldY, angle, 4);
            Lines.lineAngle(worldX + Angles.trnsx(angle, 2), worldY + Angles.trnsy(angle, 2), angle + 135, 2);
            Lines.lineAngle(worldX + Angles.trnsx(angle, 2), worldY + Angles.trnsy(angle, 2), angle - 135, 2);
        }
    }

    Draw.reset();
});