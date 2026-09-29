// Tên file: eclipse-buff.js
const eclipseDataMap = new ObjectMap();
const antumbraRed = Color.valueOf("feb380");
const eclipseOriginals = {};

// Đạn tròn & Đạn ngôi sao kèm theo
const orbBullet = new BasicBulletType(5, 1);
orbBullet.width = 18;
orbBullet.height = 18;
orbBullet.shrinkY = 0;
orbBullet.frontColor = Color.white;
orbBullet.backColor = Color.valueOf("ffd37f");
orbBullet.trailColor = Color.valueOf("ffd37f");
orbBullet.trailWidth = 3;
orbBullet.trailLength = 12;
orbBullet.hitEffect = Fx.blastExplosion;
orbBullet.despawnEffect = Fx.none;

const starBullet = new BasicBulletType(12, 1);
starBullet.width = 12;
starBullet.height = 12;
starBullet.frontColor = Color.white;
starBullet.backColor = antumbraRed;
starBullet.trailColor = antumbraRed;
starBullet.trailWidth = 2;
starBullet.trailLength = 18;
starBullet.spin = 6;
starBullet.hitEffect = Fx.hitBulletColor;
starBullet.despawnEffect = Fx.none;

Events.on(ClientLoadEvent, () => {
    let eclipse = UnitTypes.eclipse;
    if(!eclipse) return;

    eclipseOriginals.speed = eclipse.speed;
    eclipseOriginals.maxRange = eclipse.maxRange;
    eclipseOriginals.aimDst = eclipse.aimDst;
    eclipseOriginals.weapons = [];

    if(eclipse.weapons != null){
        for(let i = 0; i < eclipse.weapons.size; i++){
            let w = eclipse.weapons.get(i);
            if(!w || !w.bullet) continue;
            eclipseOriginals.weapons.push({
                speed: w.bullet.speed,
                lifetime: w.bullet.lifetime,
                height: w.bullet.height,
                width: w.bullet.width,
                length: (w.bullet instanceof LaserBulletType) ? w.bullet.length : 0,
                range: w.bullet.range
            });
        }
    }
});

Events.on(WorldLoadEvent, () => {
    let eclipse = UnitTypes.eclipse;
    if(!eclipse || eclipseOriginals.speed == null) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    if(isEnabled){
        eclipse.speed = eclipseOriginals.speed * 1.2;

        let totalDPS = 0;
        let maxLaserLifetime = 60;
        let actualLaserLength = 280; 

        if(eclipse.weapons != null){
            for(let i = 0; i < eclipse.weapons.size; i++){
                let w = eclipse.weapons.get(i);
                if(!w || !w.bullet) continue;
                
                let shots = w.shoot ? w.shoot.shots : 1;
                let dps = (w.bullet.damage * shots) / (w.reload / 60);
                totalDPS += dps;

                if(w.bullet instanceof LaserBulletType){
                    maxLaserLifetime = w.bullet.lifetime;
                    w.bullet.length = eclipseOriginals.weapons[i].length * 2.5; 
                    actualLaserLength = w.bullet.length;
                    w.bullet.range = w.bullet.length;
                }
            }

            orbBullet.damage = totalDPS * 1.2;
            starBullet.damage = totalDPS * 0.8;
            
            orbBullet.lifetime = actualLaserLength / orbBullet.speed;
            orbBullet.range = orbBullet.speed * orbBullet.lifetime;

            starBullet.lifetime = maxLaserLifetime;
            starBullet.range = starBullet.speed * starBullet.lifetime;

            let maxWeaponRange = 0;

            for(let i = 0; i < eclipse.weapons.size; i++){
                let w = eclipse.weapons.get(i);
                let orig = eclipseOriginals.weapons[i];
                if(!w || !w.bullet || !orig) continue;

                if(!(w.bullet instanceof LaserBulletType)){
                    w.bullet.speed = orig.speed * 2;
                    w.bullet.lifetime = maxLaserLifetime;
                    w.bullet.height = orig.height * 1.5;
                    w.bullet.width = orig.width * 0.7;

                    if(w.bullet.spawnBullets == null){
                        w.bullet.spawnBullets = Seq.with(orbBullet, starBullet);
                    } else if(!w.bullet.spawnBullets.contains(orbBullet)){
                        w.bullet.spawnBullets.add(orbBullet);
                        w.bullet.spawnBullets.add(starBullet);
                    }
                    
                    w.bullet.range = w.bullet.speed * w.bullet.lifetime;
                } else {
                    w.bullet.range = w.bullet.length;
                }

                if(w.bullet.range > maxWeaponRange){
                    maxWeaponRange = w.bullet.range;
                }
            }

            eclipse.maxRange = maxWeaponRange;
            eclipse.aimDst = maxWeaponRange;
        }
    } else {
        eclipse.speed = eclipseOriginals.speed;
        eclipse.maxRange = eclipseOriginals.maxRange;
        eclipse.aimDst = eclipseOriginals.aimDst;

        if(eclipse.weapons != null){
            for(let i = 0; i < eclipse.weapons.size; i++){
                let w = eclipse.weapons.get(i);
                let orig = eclipseOriginals.weapons[i];
                if(!w || !w.bullet || !orig) continue;

                if(!(w.bullet instanceof LaserBulletType)){
                    w.bullet.speed = orig.speed;
                    w.bullet.lifetime = orig.lifetime;
                    w.bullet.height = orig.height;
                    w.bullet.width = orig.width;

                    if(w.bullet.spawnBullets != null){
                        w.bullet.spawnBullets.remove(orbBullet);
                        w.bullet.spawnBullets.remove(starBullet);
                    }
                } else if(w.bullet instanceof LaserBulletType) {
                    w.bullet.length = orig.length;
                }

                w.bullet.range = orig.range;
            }
        }
    }
});

// Hàm đếm số lượng Eclipse hiện tại của Team
function getEclipseCount(team) {
    let count = 0;
    Groups.unit.each(u => {
        if (u.team == team && u.type == UnitTypes.eclipse && !u.dead) {
            count++;
        }
    });
    return count;
}

Events.on(EventType.UnitDamageEvent, event => {
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    let u = event.unit;
    let b = event.bullet;

    if(b && b.owner && b.owner.type == UnitTypes.eclipse && u && u.team != b.team){
        if(Math.random() < 0.15){
            u.health -= (b.damage * 0.5);
            Fx.hitBulletColor.at(u.x, u.y, antumbraRed);
        }
    }

    if(u && !u.dead && u.type == UnitTypes.eclipse){
        let damageTaken = b ? b.damage : 0;
        if(damageTaken > 0){
            u.health += damageTaken * 0.90;
            if(u.health > u.maxHealth){
                u.health = u.maxHealth;
            }
        }
    }
});

// Xử lý hồi sinh tại Core khi Eclipse chết (chỉ hồi sinh nếu số lượng < 3)
Events.on(EventType.UnitDestroyEvent, event => {
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    let u = event.unit;
    if(u && u.type == UnitTypes.eclipse){
        eclipseDataMap.remove(u.id);

        let ownTeamData = Vars.state.teams.get(u.team);
        if(ownTeamData != null && ownTeamData.cores != null && !ownTeamData.cores.isEmpty()){
            let nearestCore = ownTeamData.cores.first();

            Time.run(2, () => {
                // Kiểm tra lại nếu số lượng chưa tới 3 mới cho spawn hồi sinh
                if(getEclipseCount(u.team) < 3){
                    let revivedUnit = UnitTypes.eclipse.spawn(u.team, nearestCore.x, nearestCore.y);
                    if(revivedUnit != null){
                        Fx.spawn.at(nearestCore.x, nearestCore.y);
                        Fx.heal.at(nearestCore.x, nearestCore.y);
                    }
                }
            });
        }
    }
});

// Vòng lặp Trigger.update: Giới hạn tối đa 3 Eclipse/team + Hồi máu định kỳ
Events.run(Trigger.update, () => {
    if(Vars.state.isPaused() || Vars.state.isMenu()) return;
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    // 1. GIỚI HẠN TỐI ĐA 3 ECLIPSE MỖI TEAM
    let teamEclipses = {};

    Groups.unit.each(u => {
        if (u && !u.dead && u.type == UnitTypes.eclipse) {
            let teamId = u.team.id;
            if (!teamEclipses[teamId]) {
                teamEclipses[teamId] = [];
            }
            teamEclipses[teamId].push(u);
        }
    });

    for (let teamId in teamEclipses) {
        let list = teamEclipses[teamId];
        // Nếu số lượng vượt quá 3 con
        if (list.length > 3) {
            // Giữ lại 3 con đầu tiên, xóa các con thừa thứ 4 trở đi
            for (let i = 3; i < list.length; i++) {
                let excessUnit = list[i];
                Fx.spawn.at(excessUnit.x, excessUnit.y);
                eclipseDataMap.remove(excessUnit.id);
                excessUnit.remove();
            }
        }
    }

    // 2. HỒI MÁU ĐỊNH KỲ
    let units = Groups.unit.copy();
    for(let i = 0; i < units.size; i++){
        let u = units.get(i);
        if(!u || u.dead || u.type != UnitTypes.eclipse) continue;

        if(!eclipseDataMap.containsKey(u.id)){
            eclipseDataMap.put(u.id, { healTimer: 0 });
        }

        let data = eclipseDataMap.get(u.id);
        data.healTimer += Time.delta;

        if(data.healTimer >= 60){
            data.healTimer = 0;
            if(u.health < u.maxHealth){
                u.health = Math.min(u.maxHealth, u.health + u.maxHealth * 0.01);
                Fx.heal.at(u.x, u.y);
            }
        }
    }
});