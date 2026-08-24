Events.on(ContentInitEvent, () => {
    const coreBlock = Vars.content.block("newex-core-raykstone");
    const raykstoneBlock = Vars.content.block("newex-raykstone");

    if (coreBlock == null || raykstoneBlock == null) return;

    // Hiệu ứng hạt xanh lá nhạt
    const gatherEffect = new Effect(30, e => {
        Draw.color(Pal.heal, Color.white, e.fin());
        let radius = 18 * e.fout();
        let rad = e.rotation * Mathf.degRad;
        let rx = e.x + Math.cos(rad) * radius;
        let ry = e.y + Math.sin(rad) * radius;
        Fill.circle(rx, ry, 2.5 * e.fout());
    });

    let activeCores = [];

    // Tải danh sách vị trí 1 lần duy nhất khi load map
    Events.on(WorldLoadEvent, () => {
        activeCores = [];
        for (let x = 0; x < Vars.world.width(); x++) {
            for (let y = 0; y < Vars.world.height(); y++) {
                let tile = Vars.world.tile(x, y);
                if (tile != null && tile.block() === coreBlock) {
                    activeCores.push({
                        tile: tile,
                        time: 0,
                        targetTime: Mathf.random(60 * 60, 120 * 60)
                    });
                }
            }
        }
    });

    // Cập nhật logic
    Events.run(Trigger.update, () => {
        if (!Vars.state.isPlaying() || activeCores.length === 0) return;

        // Kiểm tra xem hiệu ứng ánh sáng (Bloom) có đang BẬT hay không
        let enableLightingEffects = Core.settings.getBool("bloom", true);

        let d2 = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let i = 0; i < activeCores.length; i++) {
            let data = activeCores[i];
            let tile = data.tile;

            let emptyTiles = [];
            for (let j = 0; j < d2.length; j++) {
                let nx = tile.x + d2[j][0];
                let ny = tile.y + d2[j][1];
                let nTile = Vars.world.tile(nx, ny);
                if (nTile != null && nTile.block() === Blocks.air && nTile.build == null) {
                    emptyTiles.push(nTile);
                }
            }

            if (emptyTiles.length > 0) {
                data.time += Time.delta;

                // CHỈ phát hiệu ứng hạt khi cài đặt ánh sáng đang MỞ
                if (enableLightingEffects && Mathf.chance(0.15)) {
                    gatherEffect.at(tile.drawx(), tile.drawy(), Mathf.random(360));
                }

                if (data.time >= data.targetTime) {
                    let randomIndex = Math.floor(Math.random() * emptyTiles.length);
                    let targetTile = emptyTiles[randomIndex];

                    if (targetTile != null) {
                        targetTile.setBlock(raykstoneBlock, Team.derelict);
                        Fx.placeBlock.at(targetTile.drawx(), targetTile.drawy(), 1);
                    }

                    data.time = 0;
                    data.targetTime = Mathf.random(60 * 60, 120 * 60);
                }
            } else {
                data.time = 0;
            }
        }
    });
});