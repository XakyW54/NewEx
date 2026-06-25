

const smoothHpMap = new ObjectMap();
const lastDamageTimeMap = new ObjectMap(); 
Events.on(ClientLoadEvent, () => {
    Vars.ui.settings.game.checkPref("show-unit-hp", true);
});

Events.run(Trigger.draw, () => {
    if(!Core.settings.getBool("show-unit-hp", true)) return;

    Groups.unit.each(u => {
        if(u == null || u.dead || !u.isAdded()) return;

        let lastHp = lastDamageTimeMap.get(u.id + "_hp") || u.maxHealth;
        
        if (u.health < lastHp) {
            lastDamageTimeMap.put(u.id + "_time", Time.time);
        }
        lastDamageTimeMap.put(u.id + "_hp", u.health);

        let lastDmgTime = lastDamageTimeMap.get(u.id + "_time") || -999;
        if (Time.time - lastDmgTime > 120) return; 

        let realHp = (u.health / u.maxHealth) * 100;
        let smoothHp = smoothHpMap.get(u.id) || realHp;
        smoothHp = Mathf.lerpDelta(smoothHp, realHp, 0.08);
        smoothHpMap.put(u.id, smoothHp);

        let hpPercent = Math.floor(smoothHp);
        if(hpPercent >= 100) return;

        let x = u.x;
        let y = u.y + (u.hitSize / 2) + 4;
        let hpColor = hpPercent < 20 ? Color.red : (hpPercent < 50 ? Color.yellow : Color.green);

        Draw.z(115);
        let font = Fonts.outline;
        let oldX = font.getData().scaleX;
        let oldY = font.getData().scaleY;

        font.getData().setScale(0.11 * (u.hitSize / 8));
        font.setColor(hpColor);
        font.draw(hpPercent + "%", x, y, Align.center);

        let barWidth = 4;
        let barHeight = 22;

        Draw.color(Color.valueOf("1f1f1f"));
        Fill.rect(x - 12, y - 8, barWidth, barHeight);

        if(hpPercent <= 20){
            Draw.alpha(0.5 + Mathf.absin(Time.time, 6, 0.5));
        }

        Draw.color(hpColor);
        let hpHeight = (barHeight - 2) * (smoothHp / 100);
        Fill.rect(x - 12, y - 18 + hpHeight / 2, barWidth - 1, hpHeight);

        Draw.alpha(0.18);
        Draw.color(Color.white);
        Fill.rect(x - 11.3, y - 18 + hpHeight / 2, 0.6, hpHeight);

        font.getData().setScale(oldX, oldY);
        Draw.reset();
    });
});
