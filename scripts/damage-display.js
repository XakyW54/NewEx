// ==========================================
// Damage Display Mod for Mindustry
// Direct Popup Display (Priority High Damage On Top)
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
    let absAmount = Math.abs(amount);
    let displayNum = absAmount < 1 ? absAmount.toFixed(1) : Math.round(absAmount);

    if (isHeal) {
        return "[lime]+" + displayNum + "[]";
    } else {
        return absAmount >= 1000 
            ? "[scarlet]💥 " + displayNum + "[]" 
            : "[orange]" + displayNum + "[]";
    }
}

// Hàm tạo Popup mới độc lập
function createPopup(x, y, amount, isHeal, hitSize, entityId) {
    if (!isDisplayEnabled() || Math.abs(amount) < 0.5) return;

    // Phóng to nhẹ cho các con số có sát thương lớn (>= 1000)
    let isBigDamage = Math.abs(amount) >= 1000;

    damagePopups.add({
        x: x + Mathf.random(-6, 6),
        y: y + (hitSize / 4) + Mathf.random(-2, 2),
        amount: Math.abs(amount), // Dùng để so sánh độ ưu tiên
        rawAmount: amount,
        isHeal: isHeal,
        entityId: entityId,
        isBigDamage: isBigDamage,
        text: formatPopupText(amount, isHeal),
        id: Mathf.rand.nextInt(99999),
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
    if (dmg >= 1.0) {
        createPopup(e.unit.x, e.unit.y, dmg, false, e.unit.hitSize, e.unit.id);
    }
});

Events.on(BuildDamageEvent, e => {
    if (!isDisplayEnabled()) return;
    if (e.build.health === Number.POSITIVE_INFINITY) return;
    
    let dmg = e.source ? e.source.damage : 0;
    if (dmg >= 1.0) {
        createPopup(e.build.x, e.build.y, dmg, false, e.build.block.size * Vars.tilesize, e.build.id);
    }
});

// Vòng lặp cập nhật theo dõi hồi máu & thay đổi máu thực tế
Events.run(Trigger.update, () => {
    if (!isDisplayEnabled()) {
        if (damagePopups.size > 0) damagePopups.clear();
        return;
    }

    if (Vars.state.isPaused()) {
        return;
    }

    let bounds = Core.camera.bounds(new Rect());

    // 1. Kiểm tra Unit
    Groups.unit.intersect(bounds.x, bounds.y, bounds.width, bounds.height, cons(u => {
        if (!u.isValid()) return;

        let lastHp = entityHpCache.get(u.id);
        if (lastHp !== null && lastHp !== undefined) {
            let diff = u.health - lastHp;
            if (Math.abs(diff) >= 0.8) {
                createPopup(u.x, u.y, diff, diff > 0, u.hitSize, u.id);
                entityHpCache.put(u.id, u.health);
            }
        } else {
            entityHpCache.put(u.id, u.health);
        }
    }));

    // 2. Kiểm tra Building
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
                    if (Math.abs(diff) >= 0.8) {
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
// RENDER ENGINE (ƯU TIÊN VẼ SỐ LỚN ĐÈ LÊN SỐ NHỎ)
// ----------------------------------------------------

Events.run(Trigger.draw, () => {
    if (!isDisplayEnabled() || damagePopups.size === 0) return;

    // SẮP XẾP CHUẨN: Dùng java.lang.Float.compare để tránh lỗi TimSort
    damagePopups.sort(packComparator((a, b) => {
        if (a.amount === b.amount) return 0;
        return a.amount > b.amount ? 1 : -1;
    }));

    Draw.z(116);
    let font = Fonts.outline;
    let oldX = font.getData().scaleX;
    let oldY = font.getData().scaleY;

    let isGamePaused = Vars.state.isPaused();

    for (let i = 0; i < damagePopups.size; i++) {
        let popup = damagePopups.get(i);

        let progress = (popup.maxLife - popup.life) / popup.maxLife;
        let fadeOut = popup.life / popup.maxLife;

        let curX = popup.x + (Mathf.randomSeed(popup.id, -8, 8) * progress);
        let curY = popup.y + (Mathf.randomSeed(popup.id + 1, 10, 20) * (1.0 - (1.0 - progress) * (1.0 - progress)));

        // Số lớn (>= 1000) sẽ có kích thước chữ bự hơn nổi bật hẳn lên
        let baseScale = popup.isBigDamage ? 0.42 : 0.28;
        let size = Math.max(0.15, baseScale * (1.0 - (1.0 - fadeOut) * (1.0 - fadeOut)));

        font.getData().setScale(size);

        tempColor.set(Color.white);
        tempColor.a = fadeOut * fadeOut * fadeOut;
        font.setColor(tempColor);

        font.draw(popup.text, curX, curY, Align.center);

        if (!isGamePaused) {
            popup.life -= Time.delta;
        }

        if (popup.life <= 0) {
            damagePopups.remove(i);
            i--; // Điều chỉnh chỉ số sau khi xóa
        }
    }

    font.getData().setScale(oldX, oldY);
    Draw.reset();
});

// Hàm tạo Comparator tương thích Rhino
function packComparator(func) {
    return new java.util.Comparator({ compare: func });
}