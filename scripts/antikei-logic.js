// antikei-logic.js

let antikeiBlock;
let mapHasAntikei = false;

// Lưu hướng di chuyển dạng Angle tùy chỉnh cho từng ô (Key dạng "x_y")
let flowDirectionMap = new java.util.HashMap();
// Lưu hướng đi tự động tối ưu tính toán sẵn dẫn tới Lõi
let autoFlowMap = new java.util.HashMap();
// Danh sách chứa toàn bộ tọa độ các ô antikei trên map
let antikeiTilesList = new java.util.ArrayList();
// Lưu hướng đi cuối cùng của Unit bằng ID
let unitLastAngles = new java.util.HashMap();

// Biến hỗ trợ nhận biết kéo chuột trong Editor
let lastEditorTile = null;

Events.on(ContentInitEvent, () => {
    antikeiBlock = Vars.content.block("newex-antikei");
});

// Sử dụng key dạng chuỗi "x_y" để loại bỏ hoàn toàn lỗi lệch tọa độ tâm khối
function getTileKey(x, y) {
    return x + "_" + y;
}

// Lấy định danh map an toàn
function getMapId() {
    if (Vars.state == null) return "default_map";
    if (Vars.state.map != null && Vars.state.map.name() != null) {
        return String(Vars.state.map.name()).replace(/[^a-zA-Z0-9_-]/g, "_");
    }
    return "editor_test_map";
}

// Lưu dữ liệu hướng mũi tên tùy chỉnh vào Core.settings dưới dạng JSON
function saveFlowData() {
    if (Vars.state.isMenu()) return;
    let mapId = "antikei_map_" + getMapId();
    let obj = {};
    let iterator = flowDirectionMap.entrySet().iterator();
    while (iterator.hasNext()) {
        let entry = iterator.next();
        obj[entry.getKey().toString()] = Number(entry.getValue());
    }
    Core.settings.put(mapId, JSON.stringify(obj));
}

// Tải dữ liệu hướng mũi tên tùy chỉnh từ Core.settings khi vào map
function loadFlowData() {
    flowDirectionMap.clear();
    if (Vars.state.isMenu()) return;
    let mapId = "antikei_map_" + getMapId();
    let jsonStr = Core.settings.getString(mapId, "");
    if (jsonStr !== "") {
        try {
            let obj = JSON.parse(jsonStr);
            for (let keyStr in obj) {
                let angle = obj[keyStr];
                flowDirectionMap.put(keyStr, java.lang.Float.valueOf(angle));
            }
        } catch (e) {
            print("Error loading antikei flow data: " + e);
        }
    }
}

// Tìm Lõi mục tiêu gần nhất
function getClosestCore(x, y, team) {
    try {
        let enemyTeam = team.enemy();
        let teamData = Vars.state.teams.get(enemyTeam);
        if (teamData != null && teamData.cores != null && teamData.cores.size > 0) {
            let closest = teamData.cores.first();
            let minDist = closest.dst2(x, y);
            for (let i = 0; i < teamData.cores.size; i++) {
                let c = teamData.cores.get(i);
                let d = c.dst2(x, y);
                if (d < minDist) {
                    minDist = d;
                    closest = c;
                }
            }
            return closest;
        }
    } catch (e) {}

    try {
        let playerTeamData = Vars.state.teams.get(Vars.player.team());
        if (playerTeamData != null && playerTeamData.cores != null && playerTeamData.cores.size > 0) {
            return playerTeamData.cores.first();
        }
    } catch (e) {}

    return null;
}

// Tìm khối antikei nhanh nhất trong bán kính rộng để quái ngoài tự tìm tới
function findNearestAntikeiFast(unit) {
    let uTileX = unit.tileX();
    let uTileY = unit.tileY();

    for (let r = 1; r <= 300; r++) {
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

// Quét toàn bộ ô antikei và tự động tính toán tuyến đường tối ưu dẫn tới Lõi
function cacheAntikeiTiles() {
    antikeiTilesList.clear();
    autoFlowMap.clear();
    mapHasAntikei = false;
    if (!antikeiBlock || Vars.world == null) return;

    for (let x = 0; x < Vars.world.width(); x++) {
        for (let y = 0; y < Vars.world.height(); y++) {
            let tile = Vars.world.tile(x, y);
            if (tile != null && tile.floor() === antikeiBlock) {
                antikeiTilesList.add(getTileKey(x, y));
                mapHasAntikei = true;
            }
        }
    }

    if (!mapHasAntikei) return;

    let sampleCore = getClosestCore(Vars.world.width() * 4, Vars.world.height() * 4, Team.crux);
    if (sampleCore == null) return;

    let coreTileX = World.toTile(sampleCore.x);
    let coreTileY = World.toTile(sampleCore.y);

    let queue = [];
    let distanceMap = {};

    for (let i = 0; i < antikeiTilesList.size(); i++) {
        let key = antikeiTilesList.get(i);
        let parts = key.split("_");
        let tx = parseInt(parts[0]);
        let ty = parseInt(parts[1]);
        if (Math.abs(tx - coreTileX) <= 3 && Math.abs(ty - coreTileY) <= 3) {
            distanceMap[key] = 0;
            queue.push({x: tx, y: ty, key: key});
        }
    }

    if (queue.length == 0 && antikeiTilesList.size() > 0) {
        let firstKey = antikeiTilesList.get(0);
        let parts = firstKey.split("_");
        let fx = parseInt(parts[0]);
        let fy = parseInt(parts[1]);
        distanceMap[firstKey] = 0;
        queue.push({x: fx, y: fy, key: firstKey});
    }

    let dxs = [0, 0, 1, -1];
    let dys = [1, -1, 0, 0];

    while (queue.length > 0) {
        let curr = queue.shift();
        let currDist = distanceMap[curr.key];

        for (let i = 0; i < 4; i++) {
            let nx = curr.x + dxs[i];
            let ny = curr.y + dys[i];
            let nKey = getTileKey(nx, ny);

            let tile = Vars.world.tile(nx, ny);
            if (tile != null && tile.floor() === antikeiBlock) {
                if (distanceMap[nKey] === undefined) {
                    distanceMap[nKey] = currDist + 1;
                    queue.push({x: nx, y: ny, key: nKey});
                }
            }
        }
    }

    for (let i = 0; i < antikeiTilesList.size(); i++) {
        let key = antikeiTilesList.get(i);
        let parts = key.split("_");
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);
        let currentDist = distanceMap[key];
        if (currentDist === undefined) continue;

        let bestNx = x, bestNy = y;
        let minDst = currentDist;

        for (let j = 0; j < 4; j++) {
            let nx = x + dxs[j];
            let ny = y + dys[j];
            let nKey = getTileKey(nx, ny);
            let nDist = distanceMap[nKey];

            if (nDist !== undefined && nDist < minDst) {
                minDst = nDist;
                bestNx = nx;
                bestNy = ny;
            }
        }

        if (bestNx !== x || bestNy !== y) {
            let worldX = x * Vars.tilesize + Vars.tilesize / 2;
            let worldY = y * Vars.tilesize + Vars.tilesize / 2;
            let targetX = bestNx * Vars.tilesize + Vars.tilesize / 2;
            let targetY = bestNy * Vars.tilesize + Vars.tilesize / 2;

            let angle = Angles.angle(worldX, worldY, targetX, targetY);
            autoFlowMap.put(key, java.lang.Float.valueOf(angle));
        }
    }
}

function clearOresOnAntikei() {
    if (!antikeiBlock || Vars.world == null) return;

    for (let i = 0; i < antikeiTilesList.size(); i++) {
        let key = antikeiTilesList.get(i);
        let parts = key.split("_");
        let tx = parseInt(parts[0]);
        let ty = parseInt(parts[1]);
        let tile = Vars.world.tile(tx, ty);
        if (tile != null && tile.overlay() != null && tile.overlay() != Blocks.air) {
            tile.setOverlay(Blocks.air);
        }
    }
}

function getOptimalAngle(worldX, worldY, key, unitTeam) {
    if (flowDirectionMap.containsKey(key)) {
        return Number(flowDirectionMap.get(key));
    }
    if (autoFlowMap.containsKey(key)) {
        return Number(autoFlowMap.get(key));
    }
    let core = getClosestCore(worldX, worldY, unitTeam);
    if (core != null) {
        return Angles.angle(worldX, worldY, core.x, core.y);
    }
    return 0;
}

Events.on(WorldLoadEvent, () => {
    cacheAntikeiTiles();
    if (mapHasAntikei) {
        clearOresOnAntikei();
        loadFlowData();
    }
});

Events.run(Trigger.update, () => {
    if (!antikeiBlock || Vars.state.isMenu()) return;

    // 1. KÉO CHUỘT TRONG MAP EDITOR ĐỂ ĐẶT HƯỚNG MŨI TÊN TÙY CHỈNH (Khi không giữ phím R)
    if (Vars.state.isEditor() && !Core.input.keyDown(KeyCode.r) && (Core.input.keyDown(KeyCode.mouseLeft) || Core.input.isTouched())) {
        let mouseVec = Core.camera.unproject(Core.input.mouse());
        let currentTile = Vars.world.tileWorld(mouseVec.x, mouseVec.y);

        if (currentTile != null && currentTile.floor() === antikeiBlock) {
            if (lastEditorTile != null && (lastEditorTile.x !== currentTile.x || lastEditorTile.y !== currentTile.y)) {
                let dragAngle = Angles.angle(lastEditorTile.worldx(), lastEditorTile.worldy(), currentTile.worldx(), currentTile.worldy());
                
                let lastKey = getTileKey(lastEditorTile.x, lastEditorTile.y);
                let currentKey = getTileKey(currentTile.x, currentTile.y);

                flowDirectionMap.put(lastKey, java.lang.Float.valueOf(dragAngle));
                flowDirectionMap.put(currentKey, java.lang.Float.valueOf(dragAngle));
                saveFlowData();
            } else {
                let currentKey = getTileKey(currentTile.x, currentTile.y);
                if (!flowDirectionMap.containsKey(currentKey)) {
                    flowDirectionMap.put(currentKey, java.lang.Float.valueOf(0));
                    saveFlowData();
                }
            }
            lastEditorTile = currentTile;
        } else {
            lastEditorTile = null;
        }
    } else {
        lastEditorTile = null;
    }

    if (!mapHasAntikei) return;

    if (Vars.state.isPlaying() && Time.time % 60 == 0) {
        clearOresOnAntikei();
    }

    // 2. NHẤP CHUỘT GIỮA ĐỂ XOAY HƯỚNG MŨI TÊN TÙY CHỈNH
    if (Core.input.keyTap(KeyCode.mouseMiddle)) {
        let mouseVec = Core.camera.unproject(Core.input.mouse());
        let tile = Vars.world.tileWorld(mouseVec.x, mouseVec.y);

        if (tile != null && tile.floor() === antikeiBlock) {
            let key = getTileKey(tile.x, tile.y);
            let rawVal = flowDirectionMap.get(key);
            if (rawVal == null && autoFlowMap.containsKey(key)) {
                rawVal = autoFlowMap.get(key);
            }
            let currentAngleNum = rawVal != null ? Number(rawVal) : 0;
            
            let nextAngle = (currentAngleNum + 90) % 360;
            flowDirectionMap.put(key, java.lang.Float.valueOf(nextAngle));
            saveFlowData();
        }
    }

    // 3. NHẤN GIỮ NÚT R + LIA CHUỘT ĐỂ XÓA MŨI TÊN TÙY CHỈNH
    if (Vars.state.isEditor() && Core.input.keyDown(KeyCode.r) && (Core.input.keyDown(KeyCode.mouseLeft) || Core.input.isTouched())) {
        let mouseVec = Core.camera.unproject(Core.input.mouse());
        let tile = Vars.world.tileWorld(mouseVec.x, mouseVec.y);

        if (tile != null && tile.floor() === antikeiBlock) {
            let key = getTileKey(tile.x, tile.y);
            if (flowDirectionMap.containsKey(key)) {
                flowDirectionMap.remove(key);
                saveFlowData();
            }
        }
    }

    // ĐIỀU KHIỂN DI CHUYỂN CỦA UNIT
    Groups.unit.each(unit => {
        if (unit == null || !unit.isAdded() || unit.isFlying()) return;

        let currentTile = unit.tileOn();
        let moveAngle = 0;

        if (currentTile != null && currentTile.floor() === antikeiBlock) {
            // ĐANG ĐỨNG TRÊN ANTIKEI: Đi theo hướng mũi tên
            let uTileX = unit.tileX();
            let uTileY = unit.tileY();
            let currentKey = getTileKey(uTileX, uTileY);
            let worldX = uTileX * Vars.tilesize + Vars.tilesize / 2;
            let worldY = uTileY * Vars.tilesize + Vars.tilesize / 2;

            moveAngle = getOptimalAngle(worldX, worldY, currentKey, unit.team);
            unitLastAngles.put(unit.id, java.lang.Float.valueOf(moveAngle));
        } else {
            // ĐANG Ở NGOÀI: Tự động tìm khối antikei gần nhất để di chuyển vào hệ thống
            let nearest = findNearestAntikeiFast(unit);
            if (nearest != null) {
                moveAngle = unit.angleTo(nearest.worldx(), nearest.worldy());
            } else {
                let core = getClosestCore(unit.x, unit.y, unit.team);
                if (core != null) {
                    moveAngle = unit.angleTo(core.x, core.y);
                } else {
                    moveAngle = unit.rotation;
                }
            }
        }

        unit.vel.trns(moveAngle, unit.speed());

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

// VẼ MŨI TÊN CHÍNH XÁC TUYỆT ĐỐI NGAY CHÍNH GIỮA TÂM KHỐI
Events.run(Trigger.draw, () => {
    if (!antikeiBlock || Vars.state.isMenu()) return;

    Draw.z(Layer.floor + 0.1);
    
    for (let i = 0; i < antikeiTilesList.size(); i++) {
        let key = antikeiTilesList.get(i);
        let parts = key.split("_");
        let x = parseInt(parts[0]);
        let y = parseInt(parts[1]);
        
        // Tính chuẩn tọa độ tâm ô (World Center)
        let worldX = x * Vars.tilesize + Vars.tilesize / 2;
        let worldY = y * Vars.tilesize + Vars.tilesize / 2;

        if (Core.camera.bounds(Tmp.r1).contains(worldX, worldY)) {
            let angle = getOptimalAngle(worldX, worldY, key, Team.crux);
            
            Draw.color(Pal.accent);
            Lines.stroke(1.2);
            
            // Vẽ mũi tên cân đối ngay chính giữa tâm khối
            Lines.lineAngleCenter(worldX, worldY, angle, 4);
            Lines.lineAngle(worldX + Angles.trnsx(angle, 2), worldY + Angles.trnsy(angle, 2), angle + 135, 2);
            Lines.lineAngle(worldX + Angles.trnsx(angle, 2), worldY + Angles.trnsy(angle, 2), angle - 135, 2);
        }
    }

    Draw.reset();
});