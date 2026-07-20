const lastUnitHpMap = new ObjectMap();
const lastBuildHpMap = new ObjectMap();
const damagePopups = new Seq();

Events.on(ClientLoadEvent, () => {
    Vars.ui.settings.game.checkPref("show-damage-popup", true);
});

// Hàm tạo popup hiển thị (Sát thương / Hồi máu)
function createIndicatorPopup(x, y, currentHp, previousHp, hitSize) {
    if (currentHp < previousHp) {
        let dmgAmount = previousHp - currentHp;

        if (dmgAmount > 0.5) {
            let dmgText = "[orange]" + Math.round(dmgAmount) + "[]";
            if (dmgAmount >= 1000) {
                dmgText = "[scarlet]💥 " + Math.round(dmgAmount) + "[]";
            }

            damagePopups.add({
                x: x + Mathf.random(-6, 6),
                y: y + (hitSize / 4),
                text: dmgText,
                id: Mathf.random(99999),
                life: 45.0,
                maxLife: 45.0
            });
        }
    }
    else if (currentHp > previousHp) {
        let healAmount = currentHp - previousHp;

        if (healAmount > 0.5) {
            let healText = "[lime]+" + Math.round(healAmount) + "[]"; 

            damagePopups.add({
                x: x + Mathf.random(-6, 6),
                y: y + (hitSize / 4),
                text: healText,
                id: Mathf.random(99999),
                life: 45.0,
                maxLife: 45.0
            });
        }
    }
}

Events.run(Trigger.draw, () => {
    if (!Core.settings.getBool("show-damage-popup", true)) return;

    // 1. Quét danh sách Unit (Giữ nguyên logic cũ chạy rất tốt)
    Groups.unit.each(u => {
        if (u == null || u.dead || !u.isAdded()) return;

        let previousHp = lastUnitHpMap.get(u.id) || u.health;
        createIndicatorPopup(u.x, u.y, u.health, previousHp, u.hitSize);
        
        lastUnitHpMap.put(u.id, u.health);
    });

    // 2. GIẢI PHÁP SỬA LỖI TƯỜNG: Quét các block trong vùng camera nhìn thấy (Bao gồm cả TƯỜNG)
    // Cách này giúp lấy được mọi Building/Wall đang hiển thị trên màn hình một cách chính xác nhất
    let camera = Core.camera;
    let minX = Math.max(0, Math.floor((camera.position.x - camera.width / 2) / Vars.tilesize));
    let minY = Math.max(0, Math.floor((camera.position.y - camera.height / 2) / Vars.tilesize));
    let maxX = Math.min(Vars.world.width() - 1, Math.floor((camera.position.x + camera.width / 2) / Vars.tilesize));
    let maxY = Math.min(Vars.world.height() - 1, Math.floor((camera.position.y + camera.height / 2) / Vars.tilesize));

    // Dùng một Set tạm thời để không quét trùng một block nhiều ô (vì block to chiếm nhiều ô tile)
    let processedBuilds = new ObjectSet();

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            let tile = Vars.world.tile(x, y);
            if (tile != null && tile.build != null) {
                let b = tile.build;
                
                // Nếu block này chưa được xử lý trong frame này
                if (!processedBuilds.contains(b.id)) {
                    processedBuilds.add(b.id);

                    if (b.isValid()) {
                        let previousHp = lastBuildHpMap.get(b.id) || b.health;
                        createIndicatorPopup(b.x, b.y, b.health, previousHp, b.block.size * Vars.tilesize);
                        
                        lastBuildHpMap.put(b.id, b.health);
                    }
                }
            }
        }
    }

    // 3. Tiến hành vẽ (Render) các Popup chữ nổi lên màn hình
    if (damagePopups.size > 0) {
        Draw.z(116);
        let font = Fonts.outline;
        let oldX = font.getData().scaleX;
        let oldY = font.getData().scaleY;

        let isGamePaused = Vars.state.isPaused();

        for (let i = damagePopups.size - 1; i >= 0; i--) {
            let popup = damagePopups.get(i);
            
            let progress = (popup.maxLife - popup.life) / popup.maxLife;
            let fadeOut = popup.life / popup.maxLife;

            let curX = popup.x + (Mathf.randomSeed(popup.id, -10, 10) * progress);
            let curY = popup.y + (Mathf.randomSeed(popup.id + 1, 12, 24) * Interp.pow2Out.apply(progress));

            let size = 0.32 * Interp.pow2Out.apply(fadeOut);
            if (size < 0.15) size = 0.15;

            font.getData().setScale(size);
            
            let color = Color.white.cpy();
            color.a = Interp.pow3In.apply(fadeOut);
            font.setColor(color);

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
    }
});