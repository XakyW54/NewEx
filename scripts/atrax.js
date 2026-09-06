const sta = require("sta");

const atraxExplosionFx = new Effect(35, cons(e => {
    Draw.color(Color.valueOf("e56f48"));
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, 160 * e.fin());

    Draw.color(Color.valueOf("ffaa59"));
    Fill.circle(e.x, e.y, 20 * e.fout());

    Angles.randLenVectors(e.id, 16, 160 * e.fin(), (x, y) => {
        let angle = Mathf.angle(x, y);
        let len = Mathf.len(x, y);
        Lines.stroke(2 * e.fout());
        Lines.lineAngle(e.x + x, e.y + y, angle, len * 0.2 + 3);
    });

    Draw.reset();
}));

const atraxData = {};

Timer.schedule(() => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;

    let atraxUnit = Vars.content.getByName(ContentType.unit, "atrax");
    if (atraxUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && u.isValid() && u.type == atraxUnit) {
            let id = u.id;
            if (!atraxData[id]) {
                atraxData[id] = {
                    scanTimer: 60,
                    healTimer: 0,
                    shootHealTimer: 0,
                    exploded50: false,
                    invulnerableTimer: 0,
                    invulnerableUsed: false,
                    lastHealth: u.health
                };
            }

            let data = atraxData[id];

            // ==========================================
            // XỬ LÝ SÁT THƯƠNG & EFFECT TỨ GIÁC MÉO
            // ==========================================
            let damageTaken = data.lastHealth - u.health;
            if (damageTaken > 0) {
                // Nếu đang BẤT TỬ
                if (u.hasEffect(sta.atraxInvulnerableBuff)) {
                    u.health = data.lastHealth; // Khóa máu, hoàn 100% HP

                    // Hiệu ứng hình tứ giác méo biến dạng hướng va chạm
                    let hitAngle = u.rotation;
                    let attacker = Units.closestEnemy(u.team, u.x, u.y, 300, e => true);
                    if (attacker != null) {
                        hitAngle = Mathf.angle(attacker.x - u.x, attacker.y - u.y);
                    } else {
                        hitAngle = Mathf.random(360);
                    }
                    
                    if (sta.atraxShieldHitFx != null) {
                        sta.atraxShieldHitFx.at(u.x, u.y, hitAngle, hitAngle);
                    }
                } 
                // Nếu đang mang Buff Di Chuyển (Giảm 70% sát thương)
                else if (u.hasEffect(sta.atraxSoloBuff)) {
                    u.health += damageTaken * 0.70; // Hoàn 70% lượng máu bị mất
                }
            }

            // ==========================================
            // 1. KIỂM TRA MỖI 1S: KHI DI CHUYỂN NHẬN BUFF TỒN TẠI 2S (120 TICKS)
            // ==========================================
            data.scanTimer += Time.delta;
            if (data.scanTimer >= 60.0) { // Mỗi 1 giây kiểm tra 1 lần
                data.scanTimer = 0;

                // Kiểm tra xem đơn vị có đang di chuyển không (moving/walking)
                let isMoving = u.isMoving && u.isMoving();

                if (isMoving && sta.atraxSoloBuff != null) {
                    u.apply(sta.atraxSoloBuff, 120); // Cấp/làm mới buff độc lập tồn tại 2 giây
                }
            }

            // ==========================================
            // 2. CƠ CHẾ HỒI MÁU KHI CÓ BUFF
            // ==========================================
            if (u.hasEffect(sta.atraxSoloBuff)) {
                // Mỗi 0.1s (6 ticks) hồi 0.1% max HP
                data.healTimer += Time.delta;
                if (data.healTimer >= 6.0) {
                    data.healTimer = 0;
                    u.heal(u.maxHealth * 0.001);
                }

                // Khi bắn: Cứ mỗi 1s (60 ticks) hồi 1% max HP
                if (u.isShooting) {
                    data.shootHealTimer += Time.delta;
                    if (data.shootHealTimer >= 60.0) {
                        data.shootHealTimer = 0;
                        u.heal(u.maxHealth * 0.01);
                    }
                } else {
                    data.shootHealTimer = 0;
                }
            }

            // ==========================================
            // 3. VỤ NỔ KHI MÁU DƯỚI 50% (1 LẦN DUY NHẤT)
            // ==========================================
            if (!data.exploded50 && u.health < u.maxHealth * 0.5) {
                data.exploded50 = true;
                atraxExplosionFx.at(u.x, u.y);
                Damage.damage(u.team, u.x, u.y, 160, 500, true, true);
            }

            // ==========================================
            // 4. BẤT TỬ KHI MÁU DƯỚI 15% (DUY TRÌ 10 S = 600 TICKS)
            // ==========================================
            if (!data.invulnerableUsed && u.health < u.maxHealth * 0.15) {
                data.invulnerableUsed = true;
                data.invulnerableTimer = 600; // 10 giây
            }

            if (data.invulnerableTimer > 0) {
                data.invulnerableTimer -= Time.delta;
                if (sta.atraxInvulnerableBuff != null) {
                    u.apply(sta.atraxInvulnerableBuff, 30);
                }
            }

            // Lưu máu để tính sát thương frame tiếp theo
            data.lastHealth = u.health;
        }
    });
}, 0, 0.016);

Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && atraxData[e.unit.id]) {
        delete atraxData[e.unit.id];
    }
}));