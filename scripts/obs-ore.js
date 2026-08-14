let obsOre = null;
let obsidisOre = null;

// Chờ content tải xong để lấy tham chiếu block
Events.on(ClientLoadEvent, e => {
    obsOre = Vars.content.block("newex-obs-ore");
    obsidisOre = Vars.content.block("newex-ore-obsidis");
});

// Lắng nghe sự kiện ngay khi móng/công trình bắt đầu được đặt xuống
Events.on(BlockBuildBeginEvent, event => {
    if(!obsOre) obsOre = Vars.content.block("newex-obs-ore");
    if(!obsidisOre) obsidisOre = Vars.content.block("newex-ore-obsidis");

    if(!obsOre || !obsidisOre) return;

    let tile = event.tile;
    if(tile == null || event.breaking) return;

    // Lấy thông tin công trình/móng xây dựng
    let build = tile.build;
    let block = build != null ? build.block : tile.block();

    // Nếu không có block cụ thể, lấy mặc định size là 1
    let size = (block != null && block.size) ? block.size : 1;

    // Tính toán tọa độ góc trên-trái của khối dựa theo Size
    let startX = tile.x - Math.floor((size - 1) / 2);
    let startY = tile.y - Math.floor((size - 1) / 2);

    let hasObsUnderneath = false;

    // Duyệt qua toàn bộ các ô tile nằm trong diện tích (footprint) của khối
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            let currentTile = Vars.world.tile(startX + x, startY + y);
            
            if (currentTile != null) {
                // Kiểm tra xem tile này có phải là quặng obs không
                let isObs = (currentTile.overlay() === obsOre) || (currentTile.floor() === obsOre);

                if (isObs) {
                    hasObsUnderneath = true;

                    // Chuyển hóa ô quặng obs tương ứng thành obsidis
                    if (currentTile.overlay() === obsOre) {
                        currentTile.setOverlayNet(obsidisOre);
                    } else {
                        currentTile.setFloorNet(obsidisOre);
                    }

                    // Hiệu ứng nổ nhỏ tại vị trí ô quặng biến đổi
                    try {
                        Fx.smallExplode.at(currentTile.worldx(), currentTile.worldy());
                    } catch(err) {}
                }
            }
        }
    }

    // Nếu phát hiện có quặng obs nằm dưới footprint -> Phá hủy khối vừa đặt
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