 

const damagePopups = new Seq();
const tempColor = new Color();
const entityHpCache = new ObjectMap();
const entityDamageCache = new ObjectMap();

 
Events.on(ClientLoadEvent, () => {
 
    Vars.ui.settings.game.checkPref(
        "show-hp-popup-eatsuki-tt",
        true,
        val => {
            if (val) {
 
                Core.settings.put("show-damage-popup", false);
 
                if (Vars.ui.settings != null) Vars.ui.settings.game.rebuild();
            }
        }
    );

 
    Vars.ui.settings.game.checkPref(
        "show-damage-popup",
        false,
        val => {
            if (val) {
 
                Core.settings.put("show-hp-popup-eatsuki-tt", false);
 
                if (Vars.ui.settings != null) Vars.ui.settings.game.rebuild();
            }
        }
    );
});

 
Events.on(WorldLoadEvent, () => {
    damagePopups.clear();
    entityHpCache.clear();
    entityDamageCache.clear();
});

Events.on(StateChangeEvent, e => {
    if (e.to !== GameState.State.playing || e.from === GameState.State.paused) return;
    damagePopups.clear();
    entityHpCache.clear();
    entityDamageCache.clear();
});

function isZoomedTooFar() {
    return Core.camera.width > 1024;
}

 
function getActiveMode() {
    if (isZoomedTooFar()) return "none";

    let isEatsukiOn = Core.settings.getBool("show-hp-popup-eatsuki-tt", true);
    let isPopupOn = Core.settings.getBool("show-damage-popup", false);

    if (isEatsukiOn) return "eatsuki";
    if (isPopupOn) return "popup";

    return "none";
}

 

function findEatsukiPopup(entityId) {
    for (let i = 0; i < damagePopups.size; i++) {
        let popup = damagePopups.get(i);
        if (popup.entityId === entityId && popup.type === "eatsuki") {
            return popup;
        }
    }
    return null;
}

function addEatsukiDamage(entity, damage, hitSize) {
    if (damage < 0.1) return;

    let id = entity.id;
    let data = entityDamageCache.get(id);

    if (data === null || data === undefined) {
        data = { total: 0, idle: 0 };
        entityDamageCache.put(id, data);
    }

    data.total += damage;
    data.idle = 0;

    let popup = findEatsukiPopup(id);

    if (popup === null) {
        damagePopups.add({
            type: "eatsuki",
            entityId: id,
            x: entity.x,
            y: entity.y,
            hitSize: hitSize,
            total: data.total,
            life: 45.0,
            maxLife: 45.0
        });
    } else {
        popup.x = entity.x;
        popup.y = entity.y;
        popup.hitSize = hitSize;
        popup.total = data.total;
        popup.life = 45.0;
    }
}

 

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

function createFloatingPopup(x, y, amount, isHeal, hitSize, entityId) {
    if (Math.abs(amount) < 0.5) return;

    let isBigDamage = Math.abs(amount) >= 1000;

    damagePopups.add({
        type: "popup",
        x: x + Mathf.random(-6, 6),
        y: y + (hitSize / 4) + Mathf.random(-2, 2),
        amount: Math.abs(amount),
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

 

Events.run(Trigger.update, () => {
    let mode = getActiveMode();

    if (mode === "none") {
        if (damagePopups.size > 0) damagePopups.clear();
        entityHpCache.clear();
        entityDamageCache.clear();
        return;
    }

    if (Vars.state.isPaused()) return;

    let bounds = Core.camera.bounds(new Rect());

 
    Groups.unit.intersect(bounds.x, bounds.y, bounds.width, bounds.height, cons(u => {
        if (!u.isValid() || u.health === Number.POSITIVE_INFINITY) return;

        let id = u.id;
        let lastHp = entityHpCache.get(id);

        if (lastHp !== null && lastHp !== undefined) {
            let diff = lastHp - u.health;

            if (mode === "eatsuki" && diff >= 0.8) {
                addEatsukiDamage(u, diff, u.hitSize);
            } else if (mode === "popup" && Math.abs(diff) >= 0.8) {
                createFloatingPopup(u.x, u.y, -diff, diff < 0, u.hitSize, u.id);
            }
        }
        entityHpCache.put(id, u.health);
    }));

 
    for (let i = damagePopups.size - 1; i >= 0; i--) {
        let popup = damagePopups.get(i);

        if (popup.type === "eatsuki") {
            let data = entityDamageCache.get(popup.entityId);
            if (data === null || data === undefined) {
                damagePopups.remove(i);
                continue;
            }

            data.idle += Time.delta;
            popup.total = data.total;
            popup.life -= Time.delta;

            if (data.idle >= 90.0 || popup.life <= 0) {
                entityDamageCache.remove(popup.entityId);
                damagePopups.remove(i);
            }
        }
    }

    if (entityHpCache.size > 2000) entityHpCache.clear();
    if (entityDamageCache.size > 1000) entityDamageCache.clear();
});

 

Events.run(Trigger.draw, () => {
    let mode = getActiveMode();
    if (mode === "none" || damagePopups.size === 0) return;

    Draw.z(116);
    let font = Fonts.outline;
    let oldX = font.getData().scaleX;
    let oldY = font.getData().scaleY;

    let isGamePaused = Vars.state.isPaused();

    for (let i = 0; i < damagePopups.size; i++) {
        let popup = damagePopups.get(i);

 
        if (mode === "eatsuki" && popup.type === "eatsuki") {
            let fadeOut = popup.life / popup.maxLife;
            let curX = popup.x;
            let curY = popup.y + (popup.hitSize / 2) + 12;
            let text = "[scarlet]" + Math.round(popup.total) + "[]";

            font.getData().setScale(0.32);
            tempColor.set(Color.white);
            tempColor.a = fadeOut * fadeOut;
            font.setColor(tempColor);
            font.draw(text, curX, curY, Align.center);
        }
        
 
        else if (mode === "popup" && popup.type === "popup") {
            let progress = (popup.maxLife - popup.life) / popup.maxLife;
            let fadeOut = popup.life / popup.maxLife;

            let curX = popup.x + (Mathf.randomSeed(popup.id, -8, 8) * progress);
            let curY = popup.y + (Mathf.randomSeed(popup.id + 1, 10, 20) * (1.0 - (1.0 - progress) * (1.0 - progress)));

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
                i--;
            }
        }
    }

    font.getData().setScale(oldX, oldY);
    Draw.reset();
});

 
Events.on(BuildDamageEvent, e => {
    let mode = getActiveMode();
    if (mode === "none") return;

    let b = e.build;
    if (b === null || !b.isValid() || b.health === Number.POSITIVE_INFINITY) return;

    let id = b.id;
    let lastHp = entityHpCache.get(id);
    let diff = 0;

    if (lastHp !== null && lastHp !== undefined) {
        diff = lastHp - b.health;
    } else if (e.source !== null && e.source !== undefined) {
        diff = e.source.damage;
        if (diff > b.health) diff = b.health;
    }

    entityHpCache.put(id, b.health);

    if (diff >= 0.8) {
        if (mode === "eatsuki") {
            addEatsukiDamage(b, diff, b.block.size * Vars.tilesize);
        } else if (mode === "popup") {
            createFloatingPopup(b.x, b.y, diff, false, b.block.size * Vars.tilesize, b.id);
        }
    }
});