// ==========================================
// Damage Display Mod for Mindustry
// Auto-disable on High Zoom Out
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
    // Core.camera.width tính theo world unit (1 tile = 8 world units)
    // 120 tile ngang (~960 units) là khoảng zoom xa bắt đầu khó nhìn chữ
    return Core.camera.width > 1024; 
}

function isDisplayEnabled() {
    return Core.settings.getBool("show-damage-popup", true) && !isZoomedTooFar();
}

// Hàm tạo popup với phong cách Text & Màu sắc chuẩn
function createPopup(x, y, amount, isHeal, hitSize) {
    if (!isDisplayEnabled() || Math.abs(amount) < 0.5) return;

    let text = "";
    if (!isHeal) {
        let dmgAmount = Math.abs(amount);
        text = dmgAmount >= 1000 
            ? "[scarlet]💥 " + Math.round(dmgAmount) + "[]" 
            : "[orange]" + Math.round(dmgAmount) + "[]";
    } else {
        text = "[lime]+" + Math.round(amount) + "[]";
    }

    damagePopups.add({
        x: x + Mathf.random(-6, 6),
        y: y + (hitSize / 4),
        text: text,
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
        createPopup(e.unit.x, e.unit.y, dmg, false, e.unit.hitSize);
    }
});

Events.on(BuildDamageEvent, e => {
    if (!isDisplayEnabled()) return;
    if (e.build.health === Number.POSITIVE_INFINITY) return;
    
    let dmg = e.source ? e.source.damage : 0;
    if (dmg > 0) {
        createPopup(e.build.x, e.build.y, dmg, false, e.build.block.size * Vars.tilesize);
    }
});

// Vòng lặp cập nhật theo dõi hồi máu & các thay đổi máu khác
Events.run(Trigger.update, () => {
    // Tự động dừng hoàn toàn nếu người chơi zoom quá xa hoặc Pause game
    if (!isDisplayEnabled() || Vars.state.isPaused()) {
        if (damagePopups.size > 0) damagePopups.clear();
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
                createPopup(u.x, u.y, diff, diff > 0, u.hitSize);
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
                        createPopup(b.x, b.y, diff, diff > 0, b.block.size * Vars.tilesize);
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

        let size = Math.max(0.15, 0.3 * Interp.pow2Out.apply(fadeOut));

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