 

const damagePopups = new Seq();
const tempColor = new Color();
const entityHpCache = new ObjectMap();

Events.on(ClientLoadEvent, () => {
 
    Vars.ui.settings.game.checkPref("show-damage-popup", true);
});

Events.on(WorldLoadEvent, () => {
    damagePopups.clear();
    entityHpCache.clear();
});

Events.on(StateChangeEvent, e => {
    if (e.to !== GameState.State.playing || e.from === GameState.State.paused) return;
    damagePopups.clear();
    entityHpCache.clear();
});

function isZoomedTooFar() {
    return Core.camera.width > 1024; 
}

function isDisplayEnabled() {
    let isDamagePopupOn = Core.settings.getBool("show-damage-popup", true);
    let isEatsukiOn = Core.settings.getBool("show-hp-popup-eatsuki-tt", true);

 
    return isDamagePopupOn && !isEatsukiOn && !isZoomedTooFar();
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

function createPopup(x, y, amount, isHeal, hitSize, entityId) {
    if (!isDisplayEnabled() || Math.abs(amount) < 0.5) return;

    let isBigDamage = Math.abs(amount) >= 1000;

    damagePopups.add({
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

Events.run(Trigger.update, () => {
    if (!isDisplayEnabled()) {
        if (damagePopups.size > 0) damagePopups.clear();
        return;
    }

    if (Vars.state.isPaused()) return;

    let bounds = Core.camera.bounds(new Rect());

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

    if (entityHpCache.size > 1000) entityHpCache.clear();
});

Events.run(Trigger.draw, () => {
    if (!isDisplayEnabled() || damagePopups.size === 0) return;

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

    font.getData().setScale(oldX, oldY);
    Draw.reset();
});

function packComparator(func) {
    return new java.util.Comparator({ compare: func });
}