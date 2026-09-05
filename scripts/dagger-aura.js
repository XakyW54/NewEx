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

            // Quét đồng minh xung quanh mỗi 1 giây (60 ticks)
            if (daggerTimers[id] >= 60.0) {
                daggerTimers[id] = 0;

                let range = 80;
                let hasNearbyDagger = false;

                Groups.unit.intersect(u.x - range, u.y - range, range * 2, range * 2, cons(near => {
                    if (near != u && near.team == u.team && near.type == daggerUnit && near.isValid()) {
                        let dst = Mathf.dst(u.x, u.y, near.x, near.y);
                        if (dst <= range) {
                            hasNearbyDagger = true;

                            if (u.id < near.id) {
                                linkPulseFx.at(u.x, u.y, 0, near);
                            }
                        }
                    }
                }));

                if (hasNearbyDagger) {
                    // Tăng 10% tốc độ trong 1 giây
                    if (sta.daggerSpeed != null) {
                        u.apply(sta.daggerSpeed, 60);
                    }

                    // Áp dụng trạng thái bảo vệ (Giảm 99% sát thương) trong 10 giây
                    if (sta.daggerProtect != null) {
                        u.apply(sta.daggerProtect, 600);
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