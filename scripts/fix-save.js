// File: scripts/fix-save.js

// ==========================================
// [DANH SÁCH UNIT CẦN QUÉT - BẠN CÓ THỂ TÙY CHỈNH THÊM / XÓA Ở ĐÂY]
// ==========================================
function getTargetUnitNames() {
    return [
        "newex-leolyr", // Đã cập nhật tên mới của Galileo
        "newex-kepber" // Bạn có thể thêm tên bất kỳ Unit Mod nào khác cần sửa lỗi save vào đây
    ];
}
// ==========================================

Events.on(WorldLoadEvent, () => {
    // Chạy trễ 15 frames để dữ liệu map và mod được đồng bộ vững vàng ổn định
    Time.run(15, () => {
        if (Vars.state.isMenu() || Groups.unit == null) return;

        // Lấy mảng danh sách tên đã cấu hình ở trên
        let unitNames = getTargetUnitNames();
        let validTypes = [];

        // Chuyển chuỗi tên thành các Object UnitType hệ thống
        unitNames.forEach(name => {
            let type = Vars.content.getByName(ContentType.unit, name);
            if (type != null) {
                validTypes.push(type);
            }
        });

        if (validTypes.length === 0) return;

        let targetsToReplace = [];

        // Quét toàn bộ Unit trên bản đồ xem có chủ thể nào thuộc danh sách cần sửa lỗi không
        Groups.unit.each(u => {
            if (u != null && validTypes.includes(u.type)) {
                // Kiểm tra xem thực thể bị mất bộ não JS (Undefined) sau khi tải save hay không
                if (u.isGalileoJS === undefined || u.level === undefined) {
                    
                    let savedLevel = 0;
                    
                    // Giải mã kiểm tra túi đồ chứa SporePod để phục hồi cấp độ
                    try {
                        if (u.stack != null && u.stack.item != null) {
                            if (u.stack.item.name === "spore-pod" || u.stack.item == Items.sporePod) {
                                savedLevel = u.stack.amount;
                            }
                        }
                    } catch (e) {
                        savedLevel = 0;
                    }

                    targetsToReplace.push({
                        type: u.type,
                        x: u.x,
                        y: u.y,
                        rotation: u.rotation,
                        team: u.team,
                        health: u.health,
                        level: savedLevel,
                        isPlayer: (Vars.player.unit() == u),
                        rawUnit: u
                    });
                }
            }
        });

        // Tiến hành thay thế để phục hồi Logic não bộ JS cho các thực thể lỗi
        targetsToReplace.forEach(t => {
            try {
                t.rawUnit.remove();

                // Tạo lại thực thể mới chứa đầy đủ logic JS
                let newUnit = t.type.spawn(t.team, t.x, t.y);
                if (newUnit != null) {
                    newUnit.rotation = t.rotation;
                    newUnit.health = Math.min(t.health, newUnit.maxHealth());

                    // Nạp trả lại cấp độ tiến hóa cũ
                    if (t.level > 0) {
                        newUnit.level = Math.min(10, t.level);
                        if (newUnit.stack != null) {
                            newUnit.stack.item = Items.sporePod;
                            newUnit.stack.amount = newUnit.level;
                        }
                    }

                    // Chuyển hồn người chơi về lại Unit mới nếu đang điều khiển trước khi lưu game
                    if (t.isPlayer) {
                        Vars.player.unit(newUnit);
                    }
                }
            } catch (err) {}
        });
    });
});
