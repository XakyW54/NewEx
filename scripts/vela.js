const sta = require("sta");

// Dữ liệu lưu trữ trạng thái pháo kích của Vela
const velaData = {};

// Độ dài gốc của tia Laser Vela trong Mindustry
const BASE_LASER_LENGTH = 220.0;

// Hàm hỗ trợ kiểm tra trạng thái bắn an toàn cho cả AI và Player
function isUnitShooting(u) {
    if (u == null || !u.isValid()) return false;
    
    if (u.isPlayer()) {
        let player = u.player;
        if (player != null) {
            return player.shooting;
        }
    }
    return u.isShooting;
}

// 1. EFFECT CRIT DAMAGE (50% TỈ LỆ)
const customCritFx = new Effect(25, cons(e => {
    Draw.z(Layer.effect);
    Draw.color(Color.valueOf("ffa663"), Color.valueOf("ff3838"), e.fin());
    Lines.stroke(1.8 * e.fout());
    for (let i = 0; i < 4; i++) {
        let angle = i * 90 + 45;
        let length = 4 + e.fin() * 12;
        Lines.line(e.x, e.y, e.x + Angles.trnsx(angle, length), e.y + Angles.trnsy(angle, length));
    }
    Lines.circle(e.x, e.y, 2 + e.fin() * 8);
    Draw.reset();
}));

// 2. EFFECT KHIÊN LỤC GIÁC BÙNG SÁNG KHI NHẬN SÁT THƯƠNG
const hexShieldHitFx = new Effect(18, cons(e => {
    Draw.z(Layer.effect + 0.2);
    Draw.color(Color.white, Color.valueOf("ffaa59"), e.fin());
    Lines.stroke(2.2 * e.fout());
    Lines.poly(e.x, e.y, 6, e.data + 3, Time.time * 2.0);
    Draw.reset();
}));

// 3. EFFECT VÒNG SÓNG HỒI MÁU ĐỒNG MINH
const allyHealAuraFx = new Effect(30, cons(e => {
    Draw.z(Layer.effect);
    Draw.color(Color.valueOf("84f491"));
    Lines.stroke(1.2 * e.fout());
    Lines.circle(e.x, e.y, e.data * e.fin());
    Draw.reset();
}));

// VÒNG LẶP CẬP NHẬT TRẠNG THÁI
Timer.schedule(() => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;

    let velaType = Vars.content.getByName(ContentType.unit, "vela");
    if (velaType == null) return;

    Groups.unit.each(u => {
        if (u != null && u.isValid() && u.type == velaType) {
            let id = u.id;
            if (!velaData[id]) {
                velaData[id] = { 
                    chargeTime: 0 
                };
            }

            let data = velaData[id];
            let shooting = isUnitShooting(u);

            if (shooting) {
                // ÁP DỤNG STATUS SIEGE
                if (sta.velaSiege != null) {
                    u.apply(sta.velaSiege, 15);
                }

                // TĂNG ĐỘ DÀI TIA TỪ 0% ĐẾN KHI KẾT THÚC ĐỢT BẮN (+100%)
                data.chargeTime += Time.delta;
                let progress = Math.min(1.0, data.chargeTime / 150.0);
                let currentLength = BASE_LASER_LENGTH * (1.0 + progress);

                u.mounts.forEach(mount => {
                    if (mount.weapon != null && mount.weapon.bullet != null) {
                        if (mount.weapon.bullet.length !== undefined) {
                            mount.weapon.bullet.length = currentLength;
                        }
                    }
                });

            } else {
                // RESET CHIỀU DÀI TIA KHI NGỪNG BẮN
                if (data.chargeTime > 0) {
                    data.chargeTime = 0;
                    u.mounts.forEach(mount => {
                        if (mount.weapon != null && mount.weapon.bullet != null) {
                            if (mount.weapon.bullet.length !== undefined) {
                                mount.weapon.bullet.length = BASE_LASER_LENGTH;
                            }
                        }
                    });
                }

                // HỒI MÁU ĐỒNG MINH XUNG QUANH KHI KHÔNG BẮN
                let healRadius = 160.0;
                if (Mathf.chanceDelta(0.1)) {
                    allyHealAuraFx.at(u.x, u.y, 0, healRadius);
                }

                Groups.unit.each(ally => {
                    if (ally != null && ally.isValid() && ally.team == u.team && ally != u && Mathf.dst(u.x, u.y, ally.x, ally.y) <= healRadius) {
                        let healAmount = ally.maxHealth * 0.0015 * Time.delta;
                        ally.health = Math.min(ally.maxHealth, ally.health + healAmount);

                        if (sta.velaHealBuff != null) {
                            ally.apply(sta.velaHealBuff, 60);
                        }
                    }
                });
            }
        }
    });
}, 0, 0.016);

// SỰ KIỆN XỬ LÝ SÁT THƯƠNG & CRIT DAMAGE
Events.on(UnitDamageEvent, cons(e => {
    let target = e.unit;
    let bullet = e.bullet;
    let velaType = Vars.content.getByName(ContentType.unit, "vela");

    if (target != null && target.isValid() && target.type == velaType) {
        // TRIỆT TIÊU 100% SÁT THƯƠNG NHẬN VÀO (KHÔNG HỒI MÁU TRUYỀN THỐNG)
        if (isUnitShooting(target)) {
            if (bullet != null) {
                target.health = Math.min(target.maxHealth, target.health + bullet.damage);
            }
            hexShieldHitFx.at(target.x, target.y, 0, target.hitSize + 6);
        }
    }

    // Tỉ lệ 50% gây Crit Damage gấp đôi
    if (bullet != null && bullet.owner != null && target != null && target.isValid()) {
        if (bullet.owner.type == velaType) {
            if (Mathf.chance(0.50)) {
                target.damage(bullet.damage * 1.0);
                customCritFx.at(target.x, target.y);
            }
        }
    }
}));

Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && velaData[e.unit.id]) {
        delete velaData[e.unit.id];
    }
}));