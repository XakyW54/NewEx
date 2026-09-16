// antikei-logic.js

let antikeiBlock;
let mapHasAntikei = false;

// Lưu hướng di chuyển dạng Angle cho từng ô
let flowDirectionMap = new java.util.HashMap();
// Lưu hướng đi cuối cùng của Unit bằng ID
let unitLastAngles = new java.util.HashMap();

// Biến hỗ trợ nhận biết kéo chuột trong Editor
let lastEditorTile = null;

Events.on(ContentInitEvent, () => {
    antikeiBlock = Vars.content.block("newex-antikei");
});

function getTileKey(x, y) {
    return (x & 0xFFFF) | ((y & 0xFFFF) << 16);
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
    }
});

Events.run(Trigger.update, () => {
    if (!antikeiBlock || Vars.state.isMenu()) return;

    // KÉO CHUỘT TRONG MAP EDITOR ĐỂ ĐẶT HƯỚNG MŨI TÊN TỰ DO (KHÔNG DỰA VÀO LÕI)
    if (Vars.state.isEditor() && (Core.input.keyDown(KeyCode.mouseLeft) || Core.input.isTouched())) {
        let mouseVec = Core.camera.unproject(Core.input.mouse());
        let currentTile = Vars.world.tileWorld(mouseVec.x, mouseVec.y);

        if (currentTile != null && currentTile.floor() === antikeiBlock) {
            if (lastEditorTile != null && (lastEditorTile.x !== currentTile.x || lastEditorTile.y !== currentTile.y)) {
                // Hướng đi đúng theo đường kéo của tay người dùng
                let dragAngle = Angles.angle(lastEditorTile.worldx(), lastEditorTile.worldy(), currentTile.worldx(), currentTile.worldy());
                
                let lastKey = getTileKey(lastEditorTile.x, lastEditorTile.y);
                let currentKey = getTileKey(currentTile.x, currentTile.y);

                flowDirectionMap.put(lastKey, java.lang.Float.valueOf(dragAngle));
                flowDirectionMap.put(currentKey, java.lang.Float.valueOf(dragAngle));
                mapHasAntikei = true;
            } else {
                // Nếu chỉ click 1 điểm mà chưa có hướng, mặc định cho hướng góc 0 độ
                let currentKey = getTileKey(currentTile.x, currentTile.y);
                if (!flowDirectionMap.containsKey(currentKey)) {
                    flowDirectionMap.put(currentKey, java.lang.Float.valueOf(0));
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

    // NHẤP CHUỘT GIỮA ĐỂ XOAY HƯỚNG MŨI TÊN THỦ CÔNG
    if (Core.input.keyTap(KeyCode.mouseMiddle)) {
        let mouseVec = Core.camera.unproject(Core.input.mouse());
        let tile = Vars.world.tileWorld(mouseVec.x, mouseVec.y);

        if (tile != null && tile.floor() === antikeiBlock) {
            let key = getTileKey(tile.x, tile.y);
            let currentAngle = flowDirectionMap.containsKey(key) ? Number(flowDirectionMap.get(key)) : 0;
            
            let nextAngle = (currentAngle + 90) % 360;
            flowDirectionMap.put(key, java.lang.Float.valueOf(nextAngle));
        }
    }

    let playerTeam = Vars.player.team();

    Groups.unit.each(unit => {
        if (unit == null || !unit.isAdded() || unit.isFlying() || unit.team == playerTeam) return;

        let currentTile = unit.tileOn();
        if (currentTile == null) return;

        let uTileX = unit.tileX();
        let uTileY = unit.tileY();
        let moveAngle = 0;

        // DI CHUYỂN HOÀN TOÀN THEO HƯỚNG BẠN ĐÃ TẠO
        if (currentTile.floor() === antikeiBlock) {
            let currentKey = getTileKey(uTileX, uTileY);
            let arrowDir = flowDirectionMap.get(currentKey);

            if (arrowDir != null) {
                moveAngle = Number(arrowDir);
                unitLastAngles.put(unit.id, java.lang.Float.valueOf(moveAngle));
            } else {
                moveAngle = unit.rotation;
            }
        } else {
            // RỜI KHỎI Ô ANTIKEI: Giữ nguyên hướng đi thẳng cũ
            if (unitLastAngles.containsKey(unit.id)) {
                moveAngle = Number(unitLastAngles.get(unit.id));

                let checkX = unit.x + Angles.trnsx(moveAngle, 24);
                let checkY = unit.y + Angles.trnsy(moveAngle, 24);
                let futureTile = Vars.world.tileWorld(checkX, checkY);

                if (futureTile == null || futureTile.floor() !== antikeiBlock) {
                    let nearest = findNearestAntikeiFast(unit);
                    if (nearest != null) {
                        moveAngle = unit.angleTo(nearest.worldx(), nearest.worldy());
                    }
                }
            } else {
                let nearest = findNearestAntikeiFast(unit);
                if (nearest != null) {
                    moveAngle = unit.angleTo(nearest.worldx(), nearest.worldy());
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

// VẼ MŨI TÊN CHỈ ĐƯỜNG TRÊN CÁC Ô ANTIKEI
Events.run(Trigger.draw, () => {
    if (!antikeiBlock || Vars.state.isMenu()) return;

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
            
            Lines.lineAngleCenter(worldX, worldY, angle, 4);
            Lines.lineAngle(worldX + Angles.trnsx(angle, 2), worldY + Angles.trnsy(angle, 2), angle + 135, 2);
            Lines.lineAngle(worldX + Angles.trnsx(angle, 2), worldY + Angles.trnsy(angle, 2), angle - 135, 2);
        }
    }

    Draw.reset();
});