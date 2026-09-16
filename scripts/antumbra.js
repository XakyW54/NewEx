// Tên file: antumbra-laser.js
const antumbraRed = Color.valueOf("#feb380");
const antumbraOriginals = {};

const needleBullet = extend(BasicBulletType, {
    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        if(entity != null && entity.health > 0){
            let percentDamage = entity.health * 0.01;
            entity.damage(percentDamage);
        }
    }
});

needleBullet.speed = 12;
needleBullet.damage = 10;
needleBullet.width = 2;
needleBullet.height = 80;
needleBullet.frontColor = Color.white;
needleBullet.backColor = antumbraRed;
needleBullet.trailColor = antumbraRed;
needleBullet.trailWidth = 1;
needleBullet.trailLength = 15;
needleBullet.lifetime = 45;
needleBullet.pierce = true;
needleBullet.pierceCap = 3;
needleBullet.hitEffect = Fx.hitBulletColor;
needleBullet.despawnEffect = Fx.none;

Events.on(ClientLoadEvent, () => {
    let antumbra = UnitTypes.antumbra;
    if(antumbra != null && antumbra.weapons != null){
        antumbraOriginals.maxRange = antumbra.maxRange;
        antumbraOriginals.aimDst = antumbra.aimDst;
        antumbraOriginals.weapons = [];

        for(let i = 0; i < antumbra.weapons.size; i++){
            let w = antumbra.weapons.get(i);
            if(!w || !w.bullet) continue;
            antumbraOriginals.weapons.push({
                lifetime: w.bullet.lifetime,
                range: w.bullet.range
            });
        }
    }
});

Events.on(WorldLoadEvent, () => {
    let antumbra = UnitTypes.antumbra;
    if(!antumbra || !antumbra.weapons || !antumbraOriginals.weapons) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);
    let newRange = needleBullet.speed * needleBullet.lifetime;

    if(isEnabled){
        for(let i = 0; i < antumbra.weapons.size; i++){
            let w = antumbra.weapons.get(i);
            if(!w || !w.bullet) continue;

            w.bullet.lifetime = needleBullet.lifetime;
            w.bullet.range = newRange;

            if(w.bullet.spawnBullets == null){
                w.bullet.spawnBullets = Seq.with(needleBullet);
            } else if(!w.bullet.spawnBullets.contains(needleBullet)){
                w.bullet.spawnBullets.add(needleBullet);
            }
        }
        antumbra.maxRange = newRange;
        antumbra.aimDst = newRange;
    } else {
        for(let i = 0; i < antumbra.weapons.size; i++){
            let w = antumbra.weapons.get(i);
            let orig = antumbraOriginals.weapons[i];
            if(!w || !w.bullet || !orig) continue;

            w.bullet.lifetime = orig.lifetime;
            w.bullet.range = orig.range;

            if(w.bullet.spawnBullets != null){
                w.bullet.spawnBullets.remove(needleBullet);
            }
        }
        antumbra.maxRange = antumbraOriginals.maxRange;
        antumbra.aimDst = antumbraOriginals.aimDst;
    }
});