let antikeiBlock;

Events.on(ContentInitEvent, () => {
    antikeiBlock = Vars.content.block("newex-antikei");
});

// Hàm dọn dẹp xóa tất cả Ore nằm đè lên Antikei
function clearOresOnAntikei() {
    if (!antikeiBlock || Vars.world == null) return;

    for (let x = 0; x < Vars.world.width(); x++) {
        for (let y = 0; y < Vars.world.height(); y++) {
            let tile = Vars.world.tile(x, y);
            if (tile != null && tile.floor() === antikeiBlock) {
                // Nếu ô có chứa Ore (Overlay block), tiến hành xóa Ore
                if (tile.overlay() != null && tile.overlay() != Blocks.air) {
                    tile.setOverlay(Blocks.air);
                }
            }
        }
    }
}

// Xóa Ore ngay khi load bản đồ/vào trận
Events.on(WorldLoadEvent, () => {
    clearOresOnAntikei();
});

// Tìm ô Antikei TIẾP THEO (bắt buộc khác ô hiện tại) tiến về phía Core
function getNextAntikeiTile(unit) {
    let uTileX = unit.tileX();
    let uTileY = unit.tileY();
    let bestTile = null;
    let minDst = Infinity;

    let enemyCore = unit.closestEnemyCore();
    let targetX = enemyCore ? enemyCore.x : unit.x;
    let targetY = enemyCore ? enemyCore.y : unit.y;

    // Quét 8 ô xung quanh (loại bỏ dx=0, dy=0)
    let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];

    for (let i = 0; i < dirs.length; i++) {
        let dx = dirs[i][0];
        let dy = dirs[i][1];

        let tile = Vars.world.tile(uTileX + dx, uTileY + dy);
        if (tile != null && tile.floor() === antikeiBlock) {
            let dstToTarget = Mathf.dst2(tile.worldx(), tile.worldy(), targetX, targetY);
            if (dstToTarget < minDst) {
                minDst = dstToTarget;
                bestTile = tile;
            }
        }
    }
    return bestTile;
}

Events.run(Trigger.update, () => {
    if (!antikeiBlock || Vars.state.isMenu()) return;

    // Kiểm tra và dọn dẹp Ore liên tục (nếu ai cố tình vẽ Ore trong trận)
    if (Vars.state.isPlaying() && Time.time % 60 == 0) { // Quét mỗi 1 giây 1 lần để tối ưu hiệu năng
        clearOresOnAntikei();
    }

    let isDefenseOrPlanetSector = Vars.state.rules.mode().id == 1 || Vars.state.rules.mode().id == 2 || Vars.state.isCampaign();
    let hasEnemyUnits = Groups.unit.contains(u => u.team != Vars.player.team());

    if (!isDefenseOrPlanetSector && !hasEnemyUnits) return;

    Groups.unit.each(unit => {
        if (unit == null || !unit.isAdded() || unit.isFlying()) return;

        let currentTile = unit.tileOn();
        if (currentTile == null) return;

        let uTileX = unit.tileX();
        let uTileY = unit.tileY();

        // Trường hợp 1: Unit đứng trên khối Antikei
        if (currentTile.floor() === antikeiBlock) {
            let nextTile = getNextAntikeiTile(unit);

            if (nextTile != null) {
                let angle = unit.angleTo(nextTile.worldx(), nextTile.worldy());

                unit.rotation = Mathf.slerpDelta(unit.rotation, angle, 0.3);
                unit.vel.trns(angle, unit.speed());
            } else {
                // Đi đến ô Antikei cuối cùng -> Đứng chờ
                let centerAngle = unit.angleTo(currentTile.worldx(), currentTile.worldy());
                if (Mathf.dst(unit.x, unit.y, currentTile.worldx(), currentTile.worldy()) > 2) {
                    unit.vel.trns(centerAngle, unit.speed() * 0.5);
                } else {
                    unit.vel.set(0, 0);
                }
            }
        } 
        // Trường hợp 2: Spawn ngoài hoặc văng ra ngoài dải Antikei
        else {
            let nearestAntikei = null;
            let minDst = Infinity;

            for (let dx = -12; dx <= 12; dx++) {
                for (let dy = -12; dy <= 12; dy++) {
                    let tile = Vars.world.tile(uTileX + dx, uTileY + dy);
                    if (tile != null && tile.floor() === antikeiBlock) {
                        let dst = Mathf.dst2(unit.x, unit.y, tile.worldx(), tile.worldy());
                        if (dst < minDst) {
                            minDst = dst;
                            nearestAntikei = tile;
                        }
                    }
                }
            }

            if (nearestAntikei != null) {
                let angle = unit.angleTo(nearestAntikei.worldx(), nearestAntikei.worldy());
                unit.rotation = Mathf.slerpDelta(unit.rotation, angle, 0.3);
                unit.vel.trns(angle, unit.speed());
            } else {
                unit.vel.set(0, 0);
            }
        }
    });
});