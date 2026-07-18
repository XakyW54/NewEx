const lastUnitHpMap = new ObjectMap();
const lastBuildHpMap = new ObjectMap();
const damagePopups = new Seq();

Events.on(ClientLoadEvent, () => {
    Vars.ui.settings.game.checkPref("show-damage-popup", true);
});

function createDamagePopup(x, y, currentHp, previousHp, hitSize) {
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
}

Events.run(Trigger.draw, () => {
    if(!Core.settings.getBool("show-damage-popup", true)) return;

    Groups.unit.each(u => {
        if(u == null || u.dead || !u.isAdded()) return;

        let previousHp = lastUnitHpMap.get(u.id) || u.maxHealth;
        createDamagePopup(u.x, u.y, u.health, previousHp, u.hitSize);
        
        lastUnitHpMap.put(u.id, u.health);
    });

    Groups.build.each(b => {
        if(b == null || !b.isValid()) return;

        let previousHp = lastBuildHpMap.get(b.id) || b.maxHealth;
        createDamagePopup(b.x, b.y, b.health, previousHp, b.block.size * Vars.tilesize);
        
        lastBuildHpMap.put(b.id, b.health);
    });

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