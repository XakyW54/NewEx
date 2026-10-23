// ============================================================================
// perf-core.js — Tiện ích tối ưu hiệu năng dùng chung cho mod NewEx
// Nạp ĐẦU TIÊN trong main.js, các file khác dùng qua: const PerfCore = global.PerfCore;
// Không thay đổi cơ chế/pháo: chỉ cung cấp hàm đếm/cache/giới hạn tần suất nhanh hơn.
// ============================================================================
(function () {
    const colorCache = {};
    const frameCountCache = {};   // dùng cho phương án dự phòng (quét 1 lần / tick)
    const slotLast = {};

    // Lấy TextureRegion. KHÔNG cache: atlas của game có thể bị dựng lại sau khi nạp
    // (region cũ trỏ vào texture đã hủy -> khối bị vẽ ĐEN). Giữ hàm này để các file gọi thống nhất.
    function region(name, fallback) {
        if (fallback !== undefined) return Core.atlas.find(name, fallback);
        return Core.atlas.find(name);
    }

    // Color.valueOf(hex) parse chuỗi + cấp phát đối tượng mỗi lần gọi. Hàm này dùng lại 1 đối tượng.
    // CHỈ dùng khi truyền vào Draw.color/Draw.tint (không bị sửa giá trị). Đừng gọi .a()/.mul()/.lerp() lên kết quả.
    function color(hex) {
        let c = colorCache[hex];
        if (c === undefined) { c = Color.valueOf(hex); colorCache[hex] = c; }
        return c;
    }

    // Danh sách công trình của 1 loại khối thuộc 1 đội — O(1), thay cho Groups.build.each quét toàn map.
    function teamBlocks(team, block) {
        try {
            return team.data().getBuildings(block);
        } catch (e) {
            return null;
        }
    }

    // Phương án dự phòng: quét toàn map nhưng chỉ 1 lần mỗi tick cho mỗi (team, block).
    function scanCount(team, block) {
        const key = (team ? team.id : -1) + ":" + block.id;
        let e = frameCountCache[key];
        if (e !== undefined && e.t === Time.time) return e;
        let count = 0, first = null;
        Groups.build.each(b => {
            if (b.block === block && (team == null || b.team === team)) {
                count++;
                if (first == null) first = b;
            }
        });
        e = { t: Time.time, count: count, first: first };
        frameCountCache[key] = e;
        return e;
    }

    // Số lượng khối `block` của đội `team` (team = null: mọi đội).
    function teamCount(team, block) {
        if (block == null) return 0;
        if (team != null) {
            let l = teamBlocks(team, block);
            if (l != null) return l.size;
            return scanCount(team, block).count;
        }
        try {
            let total = 0;
            let act = Vars.state.teams.active;
            for (let i = 0; i < act.size; i++) total += act.get(i).getBuildings(block).size;
            return total;
        } catch (e) {
            return scanCount(null, block).count;
        }
    }

    // Khối đầu tiên của loại `block` thuộc `team` (hoặc null).
    function firstOf(team, block) {
        let l = teamBlocks(team, block);
        if (l != null) return l.size > 0 ? l.first() : null;
        return scanCount(team, block).first;
    }

    // Giới hạn tần suất: trả true nếu đã qua >= ticks kể từ lần true gần nhất của `key`.
    function every(key, ticks) {
        let last = slotLast[key];
        if (last === undefined || Time.time - last >= ticks || Time.time < last) {
            slotLast[key] = Time.time;
            return true;
        }
        return false;
    }

    // Có đang nằm trong khung nhìn camera không (dùng để bỏ qua hiệu ứng/vẽ ngoài màn hình).
    const _vr = new Rect();
    function onScreen(x, y, pad) {
        Core.camera.bounds(_vr);
        let p = pad === undefined ? 0 : pad;
        return x >= _vr.x - p && x <= _vr.x + _vr.width + p && y >= _vr.y - p && y <= _vr.y + _vr.height + p;
    }

    // Theo dõi FPS: level 0 = mượt, 1 = hơi giật (<40), 2 = nặng (<25). Có thể dùng để giảm hiệu ứng.
    let lvl = 0, lowCount = 0, midCount = 0;
    Events.run(Trigger.update, () => {
        if (!Vars.state.isGame() || Time.time % 30 > Time.delta) return;
        let fps = Core.graphics.getFramesPerSecond();
        if (fps < 25) { lowCount++; midCount++; } else if (fps < 40) { lowCount = 0; midCount++; } else { lowCount = 0; midCount = 0; }
        lvl = lowCount >= 4 ? 2 : (midCount >= 4 ? 1 : 0);
    });
    function level() { return lvl; }

    global.PerfCore = {
        region: region, color: color,
        teamBlocks: teamBlocks, teamCount: teamCount, firstOf: firstOf,
        every: every, onScreen: onScreen, level: level
    };
})();
