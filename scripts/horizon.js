// Tên file: horizon.js
// Mô tả: Horizon nhận 1 tầng Zon (+10% Speed, Max HP, DMG) mỗi 1s di chuyển.
// Stealth: Giữ nguyên Team. Di chuyển -> Mờ hình (Alpha 0.25), ÉP PHÁO & UNIT ĐỊCH BỎ MỤC TIÊU (Không nhắm bắn), Đạn bay xuyên. Tấn công -> Hiện hình & Cho phép nhắm bắn.

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
homingPierceBullet.lifetime = 120;

homingPierceBullet.homingPower = 0.15;
homingPierceBullet.homingRange = 200;
homingPierceBullet.pierce = true;
homingPierceBullet.pierceCap = 20;
homingPierceBullet.pierceBuilding = true;

// 3. HIỆU ỨNG NỔ 10 Ô (80px)
const customBombExplosion = new Effect(30, e => {
    Draw.color(horizonYellow);
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 80 * e.fin());
    
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
            
            bomb.splashDamageRadius = 80;
            bomb.splashDamage = 60;
            bomb.hitEffect = customBombExplosion;
            bomb.despawnEffect = customBombExplosion;

            bomb.fragBullet = homingPierceBullet;
            bomb.fragBullets = 20;
            bomb.fragVelocityMin = 0.8;
            bomb.fragVelocityMax = 1.2;
            bomb.fragSpread = 360;
            bomb.fragRandomSpread = 0;
        }
    }
});

// 5. UPDATE TẦNG ZON, ÉP PHÁO VÀ UNIT ĐỊCH BỎ NHẮM MỤC TIÊU AN TOÀN
Events.run(Trigger.update, () => {
    Groups.unit.each(u => {
        if(!u || u.dead || u.type != UnitTypes.horizon) return;

        if(!horizonDataMap.containsKey(u.id)){
            horizonDataMap.put(u.id, {
                moveTimer: 0,
                zonStacks: [],
                lastX: u.x,
                lastY: u.y,
                isStealth: false,
                lastMaxHealth: baseHorizonHealth
            });
        }

        let data = horizonDataMap.get(u.id);
        let now = Time.time;

        // Xóa các tầng hết hạn (60s)
        while(data.zonStacks.length > 0 && data.zonStacks[0] <= now){
            data.zonStacks.shift();
        }

        let isMoving = Mathf.dst(u.x, u.y, data.lastX, data.lastY) > 0.05;
        let isAttacking = u.isShooting || u.isCharging;

        data.lastX = u.x;
        data.lastY = u.y;

        // --- CƠ CHẾ STEALTH: AN TOÀN, KHÔNG ĐỔI TEAM, KHÔNG CRASH ---
        if(isMoving && !isAttacking){
            data.isStealth = true;

            // 1. Ép tất cả UNIT ĐỊCH đang nhắm vào Horizon phải bỏ mục tiêu
            Groups.unit.each(enemy => {
                if(enemy && enemy.team != u.team && enemy.target == u){
                    enemy.target = null;
                }
            });

            // 2. Ép tất cả THÁP PHÁO ĐỊCH (Turrets) đang nhắm vào Horizon phải bỏ mục tiêu (Dùng Groups.build.each an toàn 100%)
            let detectRangeSq = 400 * 400; // Bán kính 50 ô
            Groups.build.each(b => {
                if(b && b.team != u.team && b.target == u){
                    if(Mathf.dst2(b.x, b.y, u.x, u.y) <= detectRangeSq){
                        b.target = null; // Huỷ khoá mục tiêu của pháo
                    }
                }
            });

            // 3. Xoá đạn địch bay vào gần Horizon (Đạn bay xuyên qua không dính)
            let hitRadiusSq = 20 * 20;
            Groups.bullet.each(b => {
                if(b && b.team != u.team){
                    if(Mathf.dst2(b.x, b.y, u.x, u.y) <= hitRadiusSq){
                        b.remove();
                    }
                }
            });

            // 4. Tăng tầng Zon mỗi 1s di chuyển
            data.moveTimer += Time.delta;
            if(data.moveTimer >= 60){
                data.moveTimer = 0;
                if(data.zonStacks.length < 100){
                    data.zonStacks.push(now + 3600);
                    zonTextEffect.at(u.x, u.y);
                }
            }
        } else {
            // Khi ĐỨNG YÊN hoặc ĐANG TẤN CÔNG: Cho phép nhắm bắn lại bình thường
            data.isStealth = false;
            data.moveTimer = 0;
        }

        // --- CẬP NHẬT TẦNG ZON & CHỈ SỐ BUFF ---
        let currentStacks = data.zonStacks.length;
        let boostRatio = currentStacks * 0.10;
        let multiplier = 1.0 + boostRatio;

        // A. Tốc độ di chuyển
        if(isMoving && boostRatio > 0){
            let targetSpeed = baseHorizonSpeed * multiplier;
            if(u.vel.len() > targetSpeed){
                u.vel.setLength(targetSpeed);
            } else {
                u.vel.scl(1.0 + (boostRatio * 0.02));
            }
        }

        // B. Sát thương
        u.damageMultiplier = multiplier;

        // C. Cập nhật Max HP
        let newMaxHealth = baseHorizonHealth * multiplier;
        if(Math.abs(data.lastMaxHealth - newMaxHealth) > 0.01){
            let healthPercent = u.health / u.maxHealth;
            u.maxHealth = newMaxHealth;
            u.health = newMaxHealth * healthPercent;
            data.lastMaxHealth = newMaxHealth;
        }
    });
});

// 6. XỬ LÝ VẼ MỜ SPRITE (ALPHA = 0.25) KHI STEALTH
Events.run(Trigger.draw, () => {
    Groups.unit.each(u => {
        if(!u || u.dead || u.type != UnitTypes.horizon) return;
        
        let data = horizonDataMap.get(u.id);
        if(data && data.isStealth){
            Draw.z(Layer.flyingUnit + 0.1);
            Draw.color(horizonYellow);
            Draw.alpha(0.25); // Hiển thị mờ 25%
            Draw.rect(u.type.region, u.x, u.y, u.rotation - 90);
            Draw.reset();
        }
    });
});

// 7. DỌN DẸP DỮ LIỆU KHI HORIZON BỊ HẠ GỤC
Events.on(EventType.UnitDestroyEvent, event => {
    let u = event.unit;
    if(u && u.type == UnitTypes.horizon){
        horizonDataMap.remove(u.id);
    }
});