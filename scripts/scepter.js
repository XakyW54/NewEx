// Tên file: scepter.js
// Mô tả: Nâng cấp Unit Scepter bắn ra đạn Star 4 cánh tự vẽ, tích ấn nổ 10 tầng và nổ công trình 12 ô

const starColorFront = Color.valueOf("ffffff");
const starColorBack = Color.valueOf("ffd27d");
const starColorGlow = Color.valueOf("ff8c00");

// 1. TỰ VẼ CÁC HIỆU ỨNG TỰ ĐỊNH NGHĨA (KHÔNG DÙNG Fx)

// Hiệu ứng va chạm đạn Star
const starHitEffect = new Effect(20, e => {
    Draw.color(starColorFront, starColorBack, e.fin());
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, 4 + e.fin() * 16);

    for(let i = 0; i < 4; i++){
        let angle = i * 90 + 45;
        let len = e.fin() * 20;
        Lines.lineAngle(e.x, e.y, angle, len);
    }
});

// Hiệu ứng nổ công trình (Bán kính 12 ô = 96 pixels)
const buildingExplodeEffect = new Effect(40, e => {
    Draw.color(starColorGlow, starColorBack, e.fin());
    Lines.stroke(3.5 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 96);

    Draw.color(Color.white);
    Lines.stroke(2.0 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 60);
});

// Hiệu ứng nổ khi đủ 10 tầng Ấn Scepter
const markDetonateEffect = new Effect(35, e => {
    Draw.color(Color.white, starColorGlow, e.fin());
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, 8 + e.fin() * 40);

    Draw.color(starColorBack);
    for(let i = 0; i < 4; i++){
        let angle = i * 90;
        let rx = e.x + Angles.trnsx(angle, e.fin() * 30);
        let ry = e.y + Angles.trnsy(angle, e.fin() * 30);
        Lines.stroke(2.5 * e.fout());
        Lines.square(rx, ry, 6 * e.fout(), 45);
    }
});

// Hiệu ứng hiển thị khi bị gắn Ấn Scepter trên Unit
const markApplyEffect = new Effect(15, e => {
    Draw.color(starColorBack);
    Lines.stroke(1.5 * e.fout());
    Lines.square(e.x, e.y, 4 + e.fin() * 8, 45);
});

// Quản lý dồn tầng ấn (Mark) trên Unit
const unitMarkMap = new ObjectMap();

// 2. TẠO ĐẠN NGÔI SAO 4 CÁNH (STAR BULLET)
const starBullet = extend(BasicBulletType, {
    speed: 12,           // Tốc độ cao
    damage: 450,         // 150% DPS Scepter
    lifetime: 45,
    pierce: true,
    pierceCap: 12,       // Xuyên thấu 12 mục tiêu
    pierceBuilding: true,

    hitEffect: starHitEffect,
    despawnEffect: starHitEffect,
    smokeEffect: Fx.none,

    // Hàm tự vẽ Ngôi Sao 4 Cánh theo mẫu ảnh
    draw(b){
        if(!b) return;

        let size = 12;
        let innerSize = 2.5;

        Draw.color(starColorBack);
        
        for(let i = 0; i < 4; i++){
            let angle = b.rotation() + i * 90;
            let nextAngle = b.rotation() + (i + 1) * 90;

            let px = b.x + Angles.trnsx(angle, size);
            let py = b.y + Angles.trnsy(angle, size);

            let mx = b.x + Angles.trnsx(angle + 45, innerSize);
            let my = b.y + Angles.trnsy(angle + 45, innerSize);

            Fill.tri(b.x, b.y, px, py, mx, my);
            
            let npx = b.x + Angles.trnsx(nextAngle, size);
            let npy = b.y + Angles.trnsy(nextAngle, size);
            Fill.tri(b.x, b.y, mx, my, npx, npy);
        }

        Draw.color(starColorFront);
        for(let i = 0; i < 4; i++){
            let angle = b.rotation() + i * 90;
            let px = b.x + Angles.trnsx(angle, size * 0.6);
            let py = b.y + Angles.trnsy(angle, size * 0.6);
            let mx = b.x + Angles.trnsx(angle + 45, innerSize * 0.6);
            let my = b.y + Angles.trnsy(angle + 45, innerSize * 0.6);

            Fill.tri(b.x, b.y, px, py, mx, my);
        }

        Draw.reset();
    },

    // Xử lý khi va chạm Công trình (Building)
    hitTile(b, tile, x, y, initialHealth, direct){
        this.super$hitTile(b, tile, x, y, initialHealth, direct);

        let radius = 96; // 12 ô (12 * 8px)
        Damage.damage(b.team, x, y, radius, 300);
        buildingExplodeEffect.at(x, y);
    },

    // Xử lý khi va chạm Unit (Gắn Ấn Scepter & Tích 10 Tầng Nổ)
    hitEntity(b, other, initialHealth){
        this.super$hitEntity(b, other, initialHealth);

        if(other && !other.dead && other instanceof Unit){
            let targetId = other.id;
            let currentStacks = unitMarkMap.containsKey(targetId) ? unitMarkMap.get(targetId) : 0;
            currentStacks++;

            markApplyEffect.at(other.x, other.y);

            if(currentStacks >= 10){
                let scepterDmg = 600; // 200% DPS Scepter
                let maxHPDmg = other.maxHealth * 0.10; // 10% Max HP
                let totalExplosionDmg = scepterDmg + maxHPDmg;

                other.damage(totalExplosionDmg);
                markDetonateEffect.at(other.x, other.y);

                unitMarkMap.put(targetId, 0);
            } else {
                unitMarkMap.put(targetId, currentStacks);
            }
        }
    }
});

// 3. QUẢN LÝ BẮN ĐẠN STAR BẰNG TRIGGER.UPDATE (AN TOÀN TUYỆT ĐỐI)
Events.run(Trigger.update, () => {
    Groups.unit.each(u => {
        if(u && !u.dead && u.type == UnitTypes.scepter && u.isShooting){
            // Kiểm tra trạng thái nạp đạn của vũ khí
            if(u.mounts && u.mounts.length > 0){
                for(let i = 0; i < u.mounts.length; i++){
                    let mount = u.mounts[i];
                    // Khi vũ khí vừa xả đạn (reload tiệm cận 0)
                    if(mount.reload <= 1.0 && mount.shoot){
                        if(Mathf.chance(0.08)){ // Tỉ lệ xuất hiện đạn Star đều đặn theo mỗi nhịp bắn
                            let bulletAngle = u.rotation + Mathf.range(12);
                            starBullet.create(u, u.team, u.x + Angles.trnsx(u.rotation, 10), u.y + Angles.trnsy(u.rotation, 10), bulletAngle);
                        }
                    }
                }
            }
        }
    });
});