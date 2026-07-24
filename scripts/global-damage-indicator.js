const lastUnitHpMap = new ObjectMap();
const lastBuildHpMap = new ObjectMap();
const damagePopups = new Seq();

// Tái sử dụng tempColor để tối ưu bộ nhớ
const tempColor = new Color();

Events.on(ClientLoadEvent, () => {
    Vars.ui.settings.game.checkPref("show-damage-popup", true);
});

// Xóa cache khi đổi map mới
Events.on(WorldLoadEvent, () => {
    lastUnitHpMap.clear();
    lastBuildHpMap.clear();
    damagePopups.clear();
});

function createIndicatorPopup(x, y, currentHp, previousHp, hitSize) {
    let diff = currentHp - previousHp;
    if (Math.abs(diff) < 0.5) return;

    let text = "";
    if (diff < 0) {
        let dmgAmount = -diff;
        text = dmgAmount >= 1000 
            ? "[scarlet]💥 " + Math.round(dmgAmount) + "[]" 
            : "[orange]" + Math.round(dmgAmount) + "[]";
    } else {
        let healAmount = diff;
        text = "[lime]+" + Math.round(healAmount) + "[]";
    }

    damagePopups.add({
        x: x + Mathf.random(-6, 6),
        y: y + (hitSize / 4),
        text: text,
        id: Mathf.random(99999),
        life: 45.0,
        maxLife: 45.0
    });
}

Events.run(Trigger.update, () => {
    if (!Core.settings.getBool("show-damage-popup", true) || Vars.state.isPaused()) return;

    // 1. Quét danh sách Unit
    Groups.unit.each(u => {
        if (u == null || !u.isValid()) return;

        let prev = lastUnitHpMap.get(u.id);
        if (prev !== null && prev !== undefined) {
            createIndicatorPopup(u.x, u.y, u.health, prev, u.hitSize);
        }
        lastUnitHpMap.put(u.id, u.health);
    });

    // 2. Quét tất cả Building thông qua các Teams đang hoạt động (Nhanh, Chính xác, Hết lag)
    let teams = Vars.state.teams.active;
    for (let i = 0; i < teams.size; i++) {
        let teamData = teams.get(i);
        if (teamData == null) continue;

        // Lấy danh sách tất cả các Building của team này
        let builds = teamData.buildings;
        if (builds == null) continue;

        let iterator = builds.iterator();
        while (iterator.hasNext()) {
            let b = iterator.next();
            if (b == null || !b.isValid()) continue;

            let prev = lastBuildHpMap.get(b.id);
            if (prev !== null && prev !== undefined) {
                createIndicatorPopup(b.x, b.y, b.health, prev, b.block.size * Vars.tilesize);
            }
            lastBuildHpMap.put(b.id, b.health);
        }
    }
});

// Render Popup
Events.run(Trigger.draw, () => {
    if (!Core.settings.getBool("show-damage-popup", true) || damagePopups.size === 0) return;

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

        let size = Math.max(0.15, 0.32 * Interp.pow2Out.apply(fadeOut));

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