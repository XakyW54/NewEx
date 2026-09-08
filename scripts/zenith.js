// Tên file: zenith-dash.js
// Mô tả: Mỗi 2 giây di chuyển liên tục, Zenith lướt nhanh về phía trước 10 ô (80px).

// 1. TẠO HIỆU ỨNG TẠO SÓNG BẬT KHI LƯỚT (DASH EFFECT)
const dashEffect = new Effect(25, e => {
    Draw.color(Color.valueOf("#fa9238"), Color.valueOf("#ffffff"), e.fin());
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 24 * e.fin()); // Vòng sóng lan tỏa
    Effect.shake(2, 2, e.x, e.y);
});

const zenithDataMap = new ObjectMap();

// 2. VÒNG LẶP UPDATE KIỂM TRA CHUYỂN ĐỘNG VÀ KÍCH HOẠT LƯỚT
Events.run(Trigger.update, () => {
    Groups.unit.each(u => {
        // Chỉ áp dụng cho Zenith
        if(!u || u.dead || u.type != UnitTypes.zenith) return;

        if(!zenithDataMap.containsKey(u.id)){
            zenithDataMap.put(u.id, {
                moveTimer: 0,
                lastX: u.x,
                lastY: u.y
            });
        }

        let data = zenithDataMap.get(u.id);

        // Kiểm tra xem Zenith có đang di chuyển không
        let isMoving = Mathf.dst(u.x, u.y, data.lastX, data.lastY) > 0.05;
        data.lastX = u.x;
        data.lastY = u.y;

        if(isMoving){
            data.moveTimer += Time.delta;

            // Đủ 2 giây di chuyển (2s * 60 ticks = 120 ticks)
            if(data.moveTimer >= 120){
                data.moveTimer = 0; // Reset đếm giờ

                // Lấy góc quay/hướng di chuyển hiện tại của Zenith
                let angle = u.rotation;

                // Tính vị trí dịch chuyển 10 ô (1 ô = 8px -> 10 ô = 80px)
                let dashDistance = 80;
                let targetX = u.x + Angles.trnsx(angle, dashDistance);
                let targetY = u.y + Angles.trnsy(angle, dashDistance);

                // Hiệu ứng sóng tại vị trí bắt đầu
                dashEffect.at(u.x, u.y);

                // Thực hiện lướt vị trí & cộng thêm vận tốc lực đẩy (Impulse)
                u.set(targetX, targetY);
                u.vel.trns(angle, 4.5); // Lực đẩy giúp cú lướt mượt mà

                // Hiệu ứng tại vị trí đáp xuống
                dashEffect.at(targetX, targetY);
            }
        } else {
            // Đứng yên thì reset đếm ngược
            data.moveTimer = 0;
        }
    });
});

// 3. DỌN DẸP DỮ LIỆU KHI ZENITH BỊ HẠ GỤC
Events.on(EventType.UnitDestroyEvent, event => {
    let u = event.unit;
    if(u && u.type == UnitTypes.zenith){
        zenithDataMap.remove(u.id);
    }
});