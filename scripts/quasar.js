// Tên file: quasar.js
const rampMap = new Map();
const quasarRampEffect = new StatusEffect("quasar-ramp-effect");
quasarRampEffect.show = false;
const quasarOriginals = {};

Events.on(ClientLoadEvent, () => {
    const quasar = UnitTypes.quasar;
    if(!quasar) return;

    quasarOriginals.armor = quasar.armor;
    quasarOriginals.speed = quasar.speed;
    quasarOriginals.abilities = [];

    if(quasar.abilities){
        for(let i = 0; i < quasar.abilities.size; i++){
            let ab = quasar.abilities.get(i);
            if(ab instanceof ForceFieldAbility){
                quasarOriginals.abilities.push({
                    max: ab.max,
                    cooldown: ab.cooldown
                });
            }
        }
    }
});

Events.on(WorldLoadEvent, () => {
    const quasar = UnitTypes.quasar;
    if(!quasar || quasarOriginals.speed == null) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    if(isEnabled){
        quasar.armor = quasarOriginals.armor + 20;
        quasar.speed = quasarOriginals.speed * 2.5;

        if(quasar.abilities){
            let idx = 0;
            for(let i = 0; i < quasar.abilities.size; i++){
                let ab = quasar.abilities.get(i);
                if(ab instanceof ForceFieldAbility && quasarOriginals.abilities[idx]){
                    ab.max = quasarOriginals.abilities[idx].max * 3.0;
                    ab.cooldown = 30;
                    idx++;
                }
            }
        }
    } else {
        quasar.armor = quasarOriginals.armor;
        quasar.speed = quasarOriginals.speed;

        if(quasar.abilities){
            let idx = 0;
            for(let i = 0; i < quasar.abilities.size; i++){
                let ab = quasar.abilities.get(i);
                if(ab instanceof ForceFieldAbility && quasarOriginals.abilities[idx]){
                    ab.max = quasarOriginals.abilities[idx].max;
                    ab.cooldown = quasarOriginals.abilities[idx].cooldown;
                    idx++;
                }
            }
        }
    }
});

Events.on(UnitDamageEvent, e => {
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    if(e.source && e.source instanceof Bullet && e.source.owner){
        let owner = e.source.owner;
        if(!owner.dead && owner.type === UnitTypes.quasar){
            let healAmount = owner.maxHealth * 0.01;
            owner.heal(healAmount);
        }
    }
});

Events.run(Trigger.update, () => {
    if(Vars.state.isPaused() || Vars.state.isMenu()) return;
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    const quasar = UnitTypes.quasar;
    if(!quasar) return;

    Groups.unit.each(u => {
        if(u.type === quasar && !u.dead){
            let ticks = rampMap.get(u.id) || 0;

            let isShooting = u.isShooting;
            if(!isShooting && u.mounts){
                for(let i = 0; i < u.mounts.length; i++){
                    if(u.mounts[i].shooting || u.mounts[i].charging){
                        isShooting = true;
                        break;
                    }
                }
            }

            if(isShooting){
                ticks = Math.min(300, ticks + Time.delta);
            } else {
                ticks = Math.max(0, ticks - Time.delta * 2.0);
            }

            rampMap.set(u.id, ticks);

            if(ticks > 0){
                let intervals = ticks / 6.0;
                let boost = Math.min(5.0, intervals * 0.1);

                quasarRampEffect.reloadMultiplier = 1.0 + boost;
                u.apply(quasarRampEffect, 15);
            }
        }
    });
});

Events.on(UnitDestroyEvent, e => {
    if(e.unit) rampMap.delete(e.unit.id);
});