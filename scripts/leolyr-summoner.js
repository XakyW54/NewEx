// File: scripts/leolyr-summoner.js

// Lắng nghe sự kiện khi BẤT KỲ block nào được xây xong hoàn tất
Events.on(BlockBuildEndEvent, (event) => {
    // Kiểm tra nếu sự kiện hợp lệ, có tile, và đây là hành động XÂY (không phải PHÁ)
    if (event.tile != null && event.tile.block() != null && !event.breaking) {
        
        // Lấy tên định danh nội bộ của block (Mindustry tự thêm tiền tố id mod vào trước)
        let blockName = event.tile.block().name;
        
        // Kiểm tra xem có đúng là block kén triệu hồi của bạn không
        if (blockName === "newex-leolyr-spawner" || blockName === "leolyr-spawner") {
            let tile = event.tile;
            let build = tile.build; // Lấy thực thể công trình hiện tại
            
            if (build == null) return;

            // Hiệu ứng nạp năng lượng xuất hiện ngay khi vừa xây xong
            Fx.shieldApply.at(build.x, build.y, 0, Color.sky);

            // Tạo bộ hẹn giờ chạy độc lập bằng luồng Java chuẩn sau 5 giây (300 ticks)
            let task = new java.lang.Runnable({
                run: function() {
                    // Kiểm tra xem sau 5 giây công trình đó có còn nguyên vẹn ở vị trí cũ không
                    if (tile.build == build && build.isValid()) {
                        
                        // 1. Tìm loại Unit Leolyr trong mod của bạn
                        let leolyrType = Vars.content.getByName(ContentType.unit, "newex-leolyr");
                        if (leolyrType != null) {
                            let unit = leolyrType.create(build.team);
                            unit.set(build.x, build.y);
                            unit.add(); // Triệu hồi unit xuất hiện tại chỗ
                            
                            if (unit.isGalileoJS) {
                                unit.level = 1; // Gán cấp độ 1 ban đầu
                            }
                        }

                        // 2. Tạo hiệu ứng nổ giải phóng
                        Fx.spawnShockwave.at(build.x, build.y);
                        Fx.shockwave.at(build.x, build.y);

                        // 3. Phá hủy block, đưa ô đất về trạng thái trống (Air)
                        tile.setAir();
                    }
                }
            });

            // Kích hoạt hẹn giờ
            Time.run(300, task);
        }
    }
});
