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
        life: 40.0,
        maxLife: 40.0
    });
}

 
Events.run(Trigger.update, () => {
    if (!Core.settings.getBool("show-damage-popup", true) || Vars.state.isPaused()) return;

 
    let bounds = Core.camera.bounds(new Rect());
    
 
    Groups.unit.intersect(bounds.x, bounds.y, bounds.width, bounds.height, cons(u => {
        if (!u.isValid()) return;

        let lastHp = entityHpCache.get(u.id);
        if (lastHp !== null && lastHp !== undefined) {
            if (u.health !== lastHp) {
     
                createIndicatorPopup(u.x, u.y, u.health, lastHp, u.hitSize);
                entityHpCache.put(u.id, u.health);
            }
        } else {
            entityHpCache.put(u.id, u.health);
        }
    }));

 
    let startX = Math.max(0, Math.floor(bounds.x / Vars.tilesize));
    let startY = Math.max(0, Math.floor(bounds.y / Vars.tilesize));
    let endX = Math.min(Vars.world.width() - 1, Math.ceil((bounds.x + bounds.width) / Vars.tilesize));
    let endY = Math.min(Vars.world.height() - 1, Math.ceil((bounds.y + bounds.height) / Vars.tilesize));

    for (let x = startX; x <= endX; x += 2) {   
        for (let y = startY; y <= endY; y += 2) {
            let b = Vars.world.build(x, y);
            if (b != null && b.isValid()) {
                let lastHp = entityHpCache.get(b.id);
                if (lastHp !== null && lastHp !== undefined) {
                    if (b.health !== lastHp) {
                       
                        createIndicatorPopup(b.x, b.y, b.health, lastHp, b.block.size * Vars.tilesize);
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