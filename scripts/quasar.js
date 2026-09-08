// Tên file: quasar.js
// Mô tả: Sửa triệt để lỗi gán hitEntity, hỗ trợ tăng tốc bắn 500%, hồi khiên 0.5s và hồi 1% HP khi gây sát thương.

const rampMap = new Map();
const quasarRampEffect = new StatusEffect("quasar-ramp-effect");
quasarRampEffect.show = false;

Events.on(ContentInitEvent, () => {
    const quasar = UnitTypes.quasar;
    if(!quasar) return;

    // 1. TĂNG CHỈ SỐ CƠ BẢN
    quasar.armor += 20;          // +20 giáp
    quasar.speed *= 2.5;         // +150% tốc độ bay

    // 2. CẤU HÌNH KHIÊN: Thời gian hồi khiên nguyên vẹn = 0.5s (30 ticks)
    if(quasar.abilities){
        for(let i = 0; i < quasar.abilities.size; i++){
            let ab = quasar.abilities.get(i);
            if(ab instanceof ForceFieldAbility){
                ab.max *= 3.0;        // +200% độ bền khiên
                ab.cooldown = 30;      // 0.5s thời gian hồi khi chưa bị vỡ khiên completely
            }
        }
    }
});

// 3. CƠ CHẾ HỒI 1% MÁU KHI BẮN TRÚNG MỤC TIÊU (AN TOÀN BẰNG EVENT)
Events.on(UnitDamageEvent, e => {
    // Kiểm tra đạn gây sát thương có nguồn gốc từ Quasar không
    if(e.source && e.source instanceof Bullet && e.source.owner){
        let owner = e.source.owner;
        if(!owner.dead && owner.type === UnitTypes.quasar){
            let healAmount = owner.maxHealth * 0.01; // 1% HP tối đa
            owner.heal(healAmount);
        }
    }
});

// 4. CƠ CHẾ TĂNG TỐC BẮN 500% (MỖI 0.1s +10%)
Events.run(Trigger.update, () => {
    const quasar = UnitTypes.quasar;
    if(!quasar) return;

    Groups.unit.each(u => {
        if(u.type === quasar && !u.dead){
            let ticks = rampMap.get(u.id) || 0;

            let isShooting = u.isShooting;
            if(!isShooting && u.mounts){
                for(let i = 0; i < u.mounts.length; i++){
                    if(u.mounts[i].shooting || u.mounts[i].charging){
                        isShooting = true;
                        break;
                    }
                }
            }

            if(isShooting){
                ticks = Math.min(300, ticks + Time.delta);
            } else {
                ticks = Math.max(0, ticks - Time.delta * 2.0);
            }

            rampMap.set(u.id, ticks);

            if(ticks > 0){
                let intervals = ticks / 6.0;
                let boost = Math.min(5.0, intervals * 0.1);

                quasarRampEffect.reloadMultiplier = 1.0 + boost;
                u.apply(quasarRampEffect, 15);
            }
        }
    });
});

Events.on(UnitDestroyEvent, e => {
    if(e.unit) rampMap.delete(e.unit.id);
});