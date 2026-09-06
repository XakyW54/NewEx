// Tự định nghĩa Effect vụ nổ tùy chỉnh (không sử dụng Fx.)
const customNovaExplosionFx = new Effect(25, cons(e => {
    Draw.color(Color.valueOf("84f491")); // Màu xanh lục của Nova

    // 1. Sóng nổ hình tròn mở rộng ra phạm vi 10 ô (80 units)
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 80 * e.fin());

    // 2. Vòng tròn sáng ở tâm thu nhỏ dần
    Draw.alpha(e.fout());
    Fill.circle(e.x, e.y, 15 * e.fout());

    // 3. Các tia bắn văng ra xung quanh bằng Mathf.angle/Mathf.len
    Angles.randLenVectors(e.id, 10, 80 * e.fin(), (x, y) => {
        let angle = Mathf.angle(x, y);
        let len = Mathf.len(x, y);
        Lines.stroke(1.5 * e.fout());
        Lines.lineAngle(e.x + x, e.y + y, angle, len * 0.3 + 2);
    });

    Draw.reset();
}));

// Tạo loại đạn Nova tùy chỉnh bằng extend()
const customNovaBullet = extend(BasicBulletType, 2.5, 10, {
    sprite: "bullet",
    frontColor: Color.valueOf("84f491"),
    backColor: Color.valueOf("62ae72"),
    width: 7,
    height: 9,
    lifetime: 60,

    // Ghi đè hàm despawned chuẩn của BulletType
    despawned(b) {
        this.super$despawned(b); // Gọi logic gốc của BulletType

        let explosionRange = 80; // 10 ô (1 ô = 8 units)

        // Kích hoạt Effect tự vẽ
        customNovaExplosionFx.at(b.x, b.y);

        // Gây 150 sát thương diện rộng trong bán kính 10 ô
        Damage.damage(
            b.team,
            b.x,
            b.y,
            explosionRange,
            150,
            true, // Sát thương công trình/đơn vị bay & đất
            true
        );
    }
});

// Lưu trữ dữ liệu cho từng Nova
const novaData = {};

Timer.schedule(() => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;

    let novaUnit = Vars.content.getByName(ContentType.unit, "nova");
    if (novaUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && u.isValid() && u.type == novaUnit) {
            let id = u.id;
            if (!novaData[id]) {
                novaData[id] = {
                    shootTimer: 0
                };
            }

            let data = novaData[id];

            // Bắn đạn mỗi 1 giây (60 ticks)
            data.shootTimer += Time.delta;
            if (data.shootTimer >= 60) {
                data.shootTimer = 0;

                let range = 160; // Bán kính 20 ô
                let target = Units.closestTarget(u.team, u.x, u.y, range, u2 => u2.checkTarget(true, true), b => true);

                if (target != null) {
                    // Bắn 3 viên đạn tỏa nhẹ
                    for (let i = 0; i < 3; i++) {
                        let angleOffset = (i - 1) * 6; // Độ lệch góc (-6°, 0°, +6°)
                        let angle = u.angleTo(target) + angleOffset;

                        customNovaBullet.create(u, u.team, u.x, u.y, angle);
                    }
                }
            }
        }
    });
}, 0, 0.016);

// Dọn dẹp dữ liệu bộ nhớ khi Nova bị tiêu diệt
Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && novaData[e.unit.id]) {
        delete novaData[e.unit.id];
    }
}));