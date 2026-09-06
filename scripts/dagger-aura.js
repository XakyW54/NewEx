const sta = require("sta");

// Hiệu ứng tia chớp liên kết
const linkPulseFx = new Effect(15, cons(e => {
    Draw.z(Layer.effect - 0.001);
    Draw.color(Color.valueOf("84f491"));
    Lines.stroke(1.5 * e.fout());
    if (e.data != null) {
        Lines.line(e.x, e.y, e.data.x, e.data.y);
    }
    Draw.reset();
}));

// Lưu trữ dữ liệu bộ đếm thời gian cho từng Dagger
const daggerTimers = {};

Timer.schedule(() => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;

    let daggerUnit = Vars.content.getByName(ContentType.unit, "dagger");
    if (daggerUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && u.isValid() && u.type == daggerUnit) {
            
            let id = u.id;
            if (!daggerTimers[id]) {
                daggerTimers[id] = 0;
            }

            daggerTimers[id] += Time.delta;

            // Quét đồng minh xung quanh mỗi 10 giây (600 ticks)
            if (daggerTimers[id] >= 600.0) {
                daggerTimers[id] = 0;

                // Phạm vi bán kính 40 units
                let range = 40;
                let unbuffedTargets = [];
                let buffedTargets = [];

                Groups.unit.intersect(u.x - range, u.y - range, range * 2, range * 2, cons(near => {
                    if (near != u && near.team == u.team && near.type == daggerUnit && near.isValid()) {
                        let dst = Mathf.dst(u.x, u.y, near.x, near.y);
                        if (dst <= range) {
                            // Phân loại các Dagger xung quanh: chưa có buff và đã có buff
                            if (sta.daggerProtect != null && !near.hasEffect(sta.daggerProtect)) {
                                unbuffedTargets.push(near);
                            } else {
                                buffedTargets.push(near);
                            }
                        }
                    }
                }));

                // Ưu tiên chọn Dagger chưa có buff, nếu không có mới dùng danh sách đã buff
                let target = unbuffedTargets.length > 0 ? unbuffedTargets[0] : (buffedTargets.length > 0 ? buffedTargets[0] : null);

                if (target != null) {
                    // Tạo hiệu ứng tia chớp nối với mục tiêu được chọn
                    if (u.id < target.id) {
                        linkPulseFx.at(u.x, u.y, 0, target);
                    }

                    // Nếu bản thân Dagger hiện tại chưa có buff thì tự áp dụng cho chính nó
                    if (sta.daggerProtect != null && !u.hasEffect(sta.daggerProtect)) {
                        u.apply(sta.daggerProtect, 600);
                    }

                    // Nếu mục tiêu được chọn chưa có buff thì áp dụng luôn buff cho mục tiêu đó
                    if (sta.daggerProtect != null && !target.hasEffect(sta.daggerProtect)) {
                        target.apply(sta.daggerProtect, 600);
                    }
                }
            }
        }
    });
}, 0, 0.016);

// Dọn dẹp bộ nhớ khi Unit chết
Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && daggerTimers[e.unit.id]) {
        delete daggerTimers[e.unit.id];
    }
}));