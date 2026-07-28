// ==========================================
// Damage Display Mod for Mindustry
// Optimized with Aggregation & Pause Freeze
// ==========================================

const damagePopups = new Seq();
const tempColor = new Color();
const entityHpCache = new ObjectMap();

// Đăng ký tùy chọn bật/tắt trong Cài đặt Game
Events.on(ClientLoadEvent, () => {
    Vars.ui.settings.game.checkPref("show-damage-popup", true);
});

// Reset dữ liệu khi load map
Events.on(WorldLoadEvent, () => {
    damagePopups.clear();
    entityHpCache.clear();
});

Events.on(StateChangeEvent, e => {
    if (e.to !== GameState.State.playing || e.from === GameState.State.paused) return;
    damagePopups.clear();
    entityHpCache.clear();
});

// Kiểm tra xem camera có đang zoom quá xa hay không
function isZoomedTooFar() {
    return Core.camera.width > 1024; 
}

function isDisplayEnabled() {
    return Core.settings.getBool("show-damage-popup", true) && !isZoomedTooFar();
}

// Format chữ cho Popup
function formatPopupText(amount, isHeal) {
    let absAmount = Math.round(Math.abs(amount));
    if (isHeal) {
        return "[lime]+" + absAmount + "[]";
    } else {
        return absAmount >= 1000 
            ? "[scarlet]💥 " + absAmount + "[]" 
            : "[orange]" + absAmount + "[]";
    }
}

// Hàm tạo hoặc GỘP Popup (Damage Aggregation)
function createPopup(x, y, amount, isHeal, hitSize, entityId) {
    if (!isDisplayEnabled() || Math.abs(amount) < 0.5) return;

    // Khoảng cách tối đa để tính là cùng một chỗ (dựa theo kích thước entity)
    let mergeRadius = Math.max(8.0, hitSize / 2);

    // 1. Tìm xem có Popup nào cùng loại (Hồi máu / Sát thương) gần đó vừa tạo gần đây không
    for (let i = 0; i < damagePopups.size; i++) {
        let p = damagePopups.get(i);
        
        // Nếu cùng ID entity (hoặc ở sát vị trí) và mới xuất hiện (life còn lớn hơn 25/40)
        let isSameEntity = (entityId !== null && entityId !== undefined && p.entityId === entityId);
        let isNear = Mathf.dst(p.x, p.y) < mergeRadius;

        if ((isSameEntity || isNear) && p.isHeal === isHeal && p.life > 25.0) {
            // Cộng dồn lượng sát thương / hồi máu
            p.amount += amount;
            p.hitCount++;
            
            // Cập nhật lại Text hiển thị tổng
            p.text = formatPopupText(p.amount, isHeal);
            
            // Reset nhẹ thời gian sống để chữ không bị biến mất quá nhanh khi đang dồn dmg
            p.life = Math.min(p.maxLife, p.life + 10.0);
            return;
        }
    }

    // 2. Nếu không tìm thấy Popup cũ phù hợp thì tạo mới
    damagePopups.add({
        x: x + Mathf.random(-4, 4),
        y: y + (hitSize / 4),
        amount: amount,
        isHeal: isHeal,
        entityId: entityId,
        hitCount: 1,
        text: formatPopupText(amount, isHeal),
        id: Mathf.random(99999),
        life: 40.0,
        maxLife: 40.0
    });
}

// ----------------------------------------------------
// EVENT LISTENERS
// ----------------------------------------------------

Events.on(UnitDamageEvent, e => {
    if (!isDisplayEnabled()) return;
    if (e.unit.hasEffect(StatusEffects.invincible) || e.unit.health === Number.POSITIVE_INFINITY) return;
    
    let dmg = e.bullet ? e.bullet.damage : 0;
    if (dmg > 0) {
        createPopup(e.unit.x, e.unit.y, dmg, false, e.unit.hitSize, e.unit.id);
    }
});

Events.on(BuildDamageEvent, e => {
    if (!isDisplayEnabled()) return;
    if (e.build.health === Number.POSITIVE_INFINITY) return;
    
    let dmg = e.source ? e.source.damage : 0;
    if (dmg > 0) {
        createPopup(e.build.x, e.build.y, dmg, false, e.build.block.size * Vars.tilesize, e.build.id);
    }
});

// Vòng lặp cập nhật theo dõi hồi máu & các thay đổi máu khác
Events.run(Trigger.update, () => {
    if (!isDisplayEnabled()) {
        if (damagePopups.size > 0) damagePopups.clear();
        return;
    }

    if (Vars.state.isPaused()) {
        return;
    }

    let bounds = Core.camera.bounds(new Rect());

    // 1. Kiểm tra Unit trong màn hình
    Groups.unit.intersect(bounds.x, bounds.y, bounds.width, bounds.height, cons(u => {
        if (!u.isValid()) return;

        let lastHp = entityHpCache.get(u.id);
        if (lastHp !== null && lastHp !== undefined) {
            let diff = u.health - lastHp;
            if (Math.abs(diff) >= 0.5) {
                createPopup(u.x, u.y, diff, diff > 0, u.hitSize, u.id);
                entityHpCache.put(u.id, u.health);
            }
        } else {
            entityHpCache.put(u.id, u.health);
        }
    }));

    // 2. Kiểm tra Building trong màn hình
    let step = Vars.tilesize * 2;
    let minX = bounds.x;
    let minY = bounds.y;
    let maxX = bounds.x + bounds.width;
    let maxY = bounds.y + bounds.height;

    for (let x = minX; x <= maxX; x += step) {
        for (let y = minY; y <= maxY; y += step) {
            let b = Vars.world.buildWorld(x, y);
            if (b != null && b.isValid()) {
                let lastHp = entityHpCache.get(b.id);
                if (lastHp !== null && lastHp !== undefined) {
                    let diff = b.health - lastHp;
                    if (Math.abs(diff) >= 0.5) {
                        createPopup(b.x, b.y, diff, diff > 0, b.block.size * Vars.tilesize, b.id);
                        entityHpCache.put(b.id, b.health);
                    }
                } else {
                    entityHpCache.put(b.id, b.health);
                }
            }
        }
    }

    if (entityHpCache.size > 1000) {
        entityHpCache.clear();
    }
});

// ----------------------------------------------------
// VẼ HÀM RENDER DÙNG FONTS.OUTLINE
// ----------------------------------------------------

Events.run(Trigger.draw, () => {
    if (!isDisplayEnabled() || damagePopups.size === 0) return;

    Draw.z(116);
    let font = Fonts.outline;
    let oldX = font.getData().scaleX;
    let oldY = font.getData().scaleY;

    let isGamePaused = Vars.state.isPaused();

    for (let i = damagePopups.size - 1; i >= 0; i--) {
        let popup = damagePopups.get(i);

        let progress = (popup.maxLife - popup.life) / popup.maxLife;
        let fadeOut = popup.life / popup.maxLife;

        let curX = popup.x + (Mathf.randomSeed(popup.id, -8, 8) * progress);
        let curY = popup.y + (Mathf.randomSeed(popup.id + 1, 10, 20) * Interp.pow2Out.apply(progress));

        // Nếu nhận nhiều hơn 3 lần sát thương/hồi máu thì phóng to chữ nhẹ một chút để tạo cảm giác "chắc tay"
        let baseScale = popup.hitCount >= 3 ? 0.38 : 0.3;
        let size = Math.max(0.15, baseScale * Interp.pow2Out.apply(fadeOut));

        font.getData().setScale(size);

        tempColor.set(Color.white);
        tempColor.a = Interp.pow3In.apply(fadeOut);
        font.setColor(tempColor);

        font.draw(popup.text, curX, curY, Align.center);

        if (!isGamePaused) {
            popup.life -= Time.delta;
        }

        if (popup.life <= 0) {
            damagePopups.remove(i);
        }
    }

    font.getData().setScale(oldX, oldY);
    Draw.reset();
});