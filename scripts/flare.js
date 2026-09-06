const sta = require("sta"); // Nhập cấu hình Status Effect từ file sta.js nếu có

// Hiệu ứng tia laser vàng tấn công
const flareLaserFx = new Effect(12, cons(e => {
    Draw.color(Color.yellow);
    Lines.stroke(2 * e.fout());
    if (e.data != null) {
        Lines.line(e.x, e.y, e.data.x, e.data.y);
    }
    Draw.reset();
}));

// Hiệu ứng liên kết buff giữa các Flare
const flareLinkFx = new Effect(15, cons(e => {
    Draw.z(Layer.effect - 0.001);
    Draw.color(Color.valueOf("ffd700")); // Màu vàng kim
    Lines.stroke(1.5 * e.fout());
    if (e.data != null) {
        Lines.line(e.x, e.y, e.data.x, e.data.y);
    }
    Draw.reset();
}));

// Lưu trữ dữ liệu bộ đếm cho từng Flare
const flareData = {};

Timer.schedule(() => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;

    let flareUnit = Vars.content.getByName(ContentType.unit, "flare");
    if (flareUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && u.isValid() && u.type == flareUnit) {
            let id = u.id;
            if (!flareData[id]) {
                flareData[id] = {
                    moveTimer: 0,
                    shootTimer: 0,
                    buffTimer: 0
                };
            }

            let data = flareData[id];

            // 1. TĂNG TỐC KHI DI CHUYỂN (Tối đa 5 giây)
            let isMoving = u.vel.len() > 0.05;
            if (isMoving) {
                data.moveTimer = Math.min(300, data.moveTimer + Time.delta);
            } else {
                data.moveTimer = Math.max(0, data.moveTimer - Time.delta * 2);
            }

            if (data.moveTimer > 0) {
                u.apply(StatusEffects.overclock, 2);
            }

            // 2. BẮN LASER + BẠO KÍCH + HỒI ĐẦY MÁU (Mỗi 1 giây)
            data.shootTimer += Time.delta;
            if (data.shootTimer >= 60) {
                data.shootTimer = 0;

                let range = 160; // 20 tiles
                let target = Units.closestTarget(u.team, u.x, u.y, range, u2 => u2.checkTarget(true, true), b => true);

                if (target != null) {
                    // Tạo hiệu ứng tia laser
                    flareLaserFx.at(u.x, u.y, 0, target);
                    Fx.hitLancer.at(target.x, target.y, Color.yellow);

                    // TÍNH TOÁN SÁT THƯƠNG BẠO KÍCH:
                    // Cơ bản 50 dmg | 50% tỉ lệ Bạo Kích | 200% Sát Thương Bạo Kích (Gấp 2 lần = 100 dmg)
                    let baseDamage = 50;
                    let isCrit = Mathf.chance(0.50); // 50% cơ hội
                    let finalDamage = isCrit ? baseDamage * 2.0 : baseDamage;

                    // Kiểm tra nếu có buff tăng 20% dmg từ liên kết bầy đàn
                    if (sta.flareBuff != null && u.hasEffect(sta.flareBuff)) {
                        finalDamage *= 1.20;
                    }

                    // Gây sát thương
                    target.damage(finalDamage);

                    // HỒI ĐẦY MÁU KHI BẮN LASER
                    u.health = u.maxHealth;
                    Fx.heal.at(u.x, u.y);
                }
            }

            // 3. BUFF BẦY ĐÀN KHI CÓ TRÊN 10 FLARE Ở GẦN NHAU (Mỗi 5 giây = 300 ticks)
            data.buffTimer += Time.delta;
            if (data.buffTimer >= 300) {
                data.buffTimer = 0;

                let linkRange = 120; // Phạm vi liên kết
                let nearbyFlares = [];

                // Quét danh sách các Flare ở gần
                Groups.unit.intersect(u.x - linkRange, u.y - linkRange, linkRange * 2, linkRange * 2, cons(near => {
                    if (near.team == u.team && near.type == flareUnit && near.isValid()) {
                        let dst = Mathf.dst(u.x, u.y, near.x, near.y);
                        if (dst <= linkRange) {
                            nearbyFlares.push(near);
                        }
                    }
                }));

                // Chỉ kích hoạt khi có HƠN 10 Flare ở gần nhau
                if (nearbyFlares.length > 10) {
                    let unbuffedTargets = [];
                    let buffedTargets = [];

                    nearbyFlares.forEach(near => {
                        if (near != u) {
                            if (sta.flareBuff != null && !near.hasEffect(sta.flareBuff)) {
                                unbuffedTargets.push(near);
                            } else {
                                buffedTargets.push(near);
                            }
                        }
                    });

                    // Ưu tiên chọn Flare chưa có buff để tạo liên kết
                    let target = unbuffedTargets.length > 0 ? unbuffedTargets[0] : (buffedTargets.length > 0 ? buffedTargets[0] : null);

                    if (target != null) {
                        if (u.id < target.id) {
                            flareLinkFx.at(u.x, u.y, 0, target);
                        }

                        // Áp dụng buff (Tăng 20% dmg & Bỏ qua phòng thủ) trong 5 giây nếu chưa có
                        if (sta.flareBuff != null) {
                            if (!u.hasEffect(sta.flareBuff)) u.apply(sta.flareBuff, 300);
                            if (!target.hasEffect(sta.flareBuff)) target.apply(sta.flareBuff, 300);
                        }
                    }
                }
            }
        }
    });
}, 0, 0.016);

// Dọn dẹp bộ nhớ khi Flare bị tiêu diệt
Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && flareData[e.unit.id]) {
        delete flareData[e.unit.id];
    }
}));