// Tên file: horizon.js
// Mô tả: Horizon nhận 1 tầng Zon (+10% Speed, Max HP, DMG) mỗi 1s di chuyển.
// Bom nổ 10 ô và xả 20 đạn con tự tìm mục tiêu, xuyên thấu 20 kẻ địch.

const horizonYellow = Color.valueOf("#ffd27d");

// 1. HIỆU ỨNG CHỮ ZON NẢY LÊN
const zonTextEffect = new Effect(40, e => {
    Draw.color(horizonYellow);
    let offsetY = e.finpow() * 20;
    let scale = 1.0 + Math.sin(e.fin() * Math.PI) * 0.4;

    Lines.stroke(2.0 * e.fout());
    let x = e.x, y = e.y + offsetY;
    let s = 6 * scale;

    Lines.line(x - s/2, y + s, x + s/2, y + s);
    Lines.line(x + s/2, y + s, x - s/2, y - s);
    Lines.line(x - s/2, y - s, x + s/2, y - s);
});

// 2. LOẠI ĐẠN CON TRUY ĐUỔI VÀ XUYÊN THẤU 20 KẺ ĐỊCH
const homingPierceBullet = new BasicBulletType(5, 25);
homingPierceBullet.width = 10;
homingPierceBullet.height = 10;
homingPierceBullet.shrinkX = 0;
homingPierceBullet.shrinkY = 0;
homingPierceBullet.frontColor = Color.valueOf("#ffffff");
homingPierceBullet.backColor = horizonYellow;
homingPierceBullet.trailColor = horizonYellow;
homingPierceBullet.trailWidth = 2;
homingPierceBullet.trailLength = 8;
homingPierceBullet.lifetime = 120; // 2 giây

homingPierceBullet.homingPower = 0.15;
homingPierceBullet.homingRange = 200;
homingPierceBullet.pierce = true;
homingPierceBullet.pierceCap = 20;
homingPierceBullet.pierceBuilding = true;

// 3. HIỆU ỨNG NỔ 10 Ô (80px)
const customBombExplosion = new Effect(30, e => {
    Draw.color(horizonYellow);
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 80 * e.fin()); // 10 ô
    
    Fx.blastExplosion.at(e.x, e.y);
    Effect.shake(4, 4, e.x, e.y);
});

const horizonDataMap = new ObjectMap();
var baseHorizonHealth = 160;
var baseHorizonSpeed = 1.6;

// 4. CẤU HÌNH LOẠI UNIT VÀ BOM KHI TẢI GAME
Events.on(ClientLoadEvent, () => {
    let horizon = UnitTypes.horizon;
    if(horizon != null){
        baseHorizonHealth = horizon.health;
        baseHorizonSpeed = horizon.speed;

        if(horizon.weapons.size > 0){
            let bomb = horizon.weapons.get(0).bullet;
            
            // Cấu hình vụ nổ 10 ô
            bomb.splashDamageRadius = 80;
            bomb.splashDamage = 60;
            bomb.hitEffect = customBombExplosion;
            bomb.despawnEffect = customBombExplosion;

            // Cơ chế spawn 20 đạn con
            bomb.fragBullet = homingPierceBullet;
            bomb.fragBullets = 20;
            bomb.fragVelocityMin = 0.8;
            bomb.fragVelocityMax = 1.2;
            bomb.fragSpread = 360;
            bomb.fragRandomSpread = 0;
        }
    }
});

// 5. UPDATE TẦNG ZON VÀ CẬP NHẬT CHỈ SỐ BUFF
Events.run(Trigger.update, () => {
    Groups.unit.each(u => {
        if(!u || u.dead || u.type != UnitTypes.horizon) return;

        if(!horizonDataMap.containsKey(u.id)){
            horizonDataMap.put(u.id, {
                moveTimer: 0,
                zonStacks: [],
                lastX: u.x,
                lastY: u.y
            });
        }

        let data = horizonDataMap.get(u.id);
        let now = Time.time;

        // Xóa các tầng hết hạn (60 giây = 3600 ticks)
        while(data.zonStacks.length > 0 && data.zonStacks[0] <= now){
            data.zonStacks.shift();
        }

        let isMoving = Mathf.dst(u.x, u.y, data.lastX, data.lastY) > 0.05;
        data.lastX = u.x;
        data.lastY = u.y;

        if(isMoving){
            data.moveTimer += Time.delta;
            if(data.moveTimer >= 60){ // Tăng 1 tầng mỗi 1s di chuyển
                data.moveTimer = 0;
                if(data.zonStacks.length < 100){
                    data.zonStacks.push(now + 3600);
                    zonTextEffect.at(u.x, u.y);
                }
            }
        } else {
            data.moveTimer = 0;
        }

        let currentStacks = data.zonStacks.length;
        let boostRatio = currentStacks * 0.10; // +10% mỗi tầng
        let multiplier = 1.0 + boostRatio;

        // A. Cập nhật tốc độ di chuyển chuẩn (Giới hạn vận tốc theo hệ số chuẩn)
        if(isMoving && boostRatio > 0){
            let targetSpeed = baseHorizonSpeed * multiplier;
            if(u.vel.len() > targetSpeed){
                u.vel.setLength(targetSpeed);
            } else {
                u.vel.scl(1.0 + (boostRatio * 0.02)); // Nhân gia tốc nhẹ nhàng, không bị nhân dồn
            }
        }

        // B. Cập nhật sát thương (+10% / tầng)
        u.damageMultiplier = multiplier;

        // C. Cập nhật Max HP (+10% / tầng)
        let newMaxHealth = baseHorizonHealth * multiplier;
        if(Math.abs(u.maxHealth - newMaxHealth) > 0.1){
            let healthRatio = u.healthf();
            u.maxHealth = newMaxHealth;
            u.health = newMaxHealth * healthRatio;
        }
    });
});

// 6. DỌN DẸP DỮ LIỆU KHI HY BỊ HẠ GỤC
Events.on(EventType.UnitDestroyEvent, event => {
    let u = event.unit;
    if(u && u.type == UnitTypes.horizon){
        horizonDataMap.remove(u.id);
    }
});