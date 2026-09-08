// Tên file: eclipse-buff.js
// Mô tả: Buff Eclipse chuẩn xác (Sửa triệt để cơ chế hồi sinh tại Core khi chết).

const eclipseDataMap = new ObjectMap();
const antumbraRed = Color.valueOf("feb380");

// 1. TẠO ĐẠN TRÒN CHẬM VÀ ĐẠN NGÔI SAO NHANH
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

// 2. KHỞI TẠO VÀ PHÂN LOẠI VŨ KHÍ ECLIPSE
Events.on(ClientLoadEvent, () => {
    let eclipse = UnitTypes.eclipse;
    if(eclipse != null){
        eclipse.speed *= 1.2;

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
                    w.bullet.length *= 2; 
                    actualLaserLength = w.bullet.length;
                }
            }

            orbBullet.damage = totalDPS * 1.2;
            starBullet.damage = totalDPS * 0.8;

            orbBullet.lifetime = actualLaserLength / orbBullet.speed;
            starBullet.lifetime = maxLaserLifetime;

            let maxWeaponRange = 0;

            for(let i = 0; i < eclipse.weapons.size; i++){
                let w = eclipse.weapons.get(i);
                if(!w || !w.bullet) continue;

                if(!(w.bullet instanceof LaserBulletType)){
                    w.bullet.speed *= 2;
                    w.bullet.lifetime = maxLaserLifetime;
                    w.bullet.height *= 1.5;
                    w.bullet.width *= 0.7;

                    if(w.bullet.spawnBullets == null){
                        w.bullet.spawnBullets = Seq.with(orbBullet, starBullet);
                    } else if(!w.bullet.spawnBullets.contains(orbBullet)){
                        w.bullet.spawnBullets.add(orbBullet);
                        w.bullet.spawnBullets.add(starBullet);
                    }
                }

                if(w.bullet instanceof LaserBulletType){
                    w.bullet.range = w.bullet.length;
                } else {
                    w.bullet.range = w.bullet.speed * w.bullet.lifetime;
                }

                if(w.bullet.range > maxWeaponRange){
                    maxWeaponRange = w.bullet.range;
                }
            }

            eclipse.maxRange = maxWeaponRange;
            eclipse.aimDst = maxWeaponRange;
        }
    }
});

// 3. XỬ LÝ BẠO KÍCH VÀ GIẢM SÁT THƯƠNG
Events.on(EventType.UnitDamageEvent, event => {
    let u = event.unit;
    let b = event.bullet;

    // A. BẠO KÍCH TẤN CÔNG (15% tỉ lệ, +50% sát thương)
    if(b && b.owner && b.owner.type == UnitTypes.eclipse && u && u.team != b.team){
        if(Math.random() < 0.15){
            u.health -= (b.damage * 0.5);
            Fx.hitBulletColor.at(u.x, u.y, antumbraRed);
        }
    }

    // B. GIẢM 90% SÁT THƯƠNG NHẬN VÀO CHO ECLIPSE
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

// 4. NỘI TẠI HỒI SINH TẠI LÕI KHI BỊ BẮN HẠ
Events.on(EventType.UnitDestroyEvent, event => {
    let u = event.unit;
    if(u && u.type == UnitTypes.eclipse){
        // Xóa timer cũ
        eclipseDataMap.remove(u.id);

        let ownTeamData = Vars.state.teams.get(u.team);
        if(ownTeamData != null && ownTeamData.cores != null && !ownTeamData.cores.isEmpty()){
            let nearestCore = ownTeamData.cores.first();

            // Spawn lại 1 con Eclipse mới tại Core ngay lập tức
            Time.run(1, () => {
                let revivedUnit = UnitTypes.eclipse.spawn(u.team, nearestCore.x, nearestCore.y);
                if(revivedUnit != null){
                    Fx.spawn.at(nearestCore.x, nearestCore.y);
                    Fx.heal.at(nearestCore.x, nearestCore.y);
                }
            });
        }
    }
});

// 5. SPAWN UNIT, ĐIỀU KHIỂN TẤN CÔNG VÀ HỒI MÁU
Events.run(Trigger.update, () => {
    Groups.unit.each(u => {
        if(!u || u.dead || u.type != UnitTypes.eclipse) return;

        if(!eclipseDataMap.containsKey(u.id)){
            eclipseDataMap.put(u.id, { healTimer: 0, spawnTimer: 0 });
        }

        let data = eclipseDataMap.get(u.id);
        data.healTimer += Time.delta;
        data.spawnTimer += Time.delta;

        if(data.spawnTimer >= 300){
            data.spawnTimer = 0;

            if(UnitTypes.flare != null){
                UnitTypes.flare.spawn(u.team, u.x + Mathf.range(12), u.y + Mathf.range(12));
            }
            if(UnitTypes.dagger != null){
                UnitTypes.dagger.spawn(u.team, u.x + Mathf.range(12), u.y + Mathf.range(12));
            }

            Fx.spawn.at(u.x, u.y);

            let flareCount = Groups.unit.count(other => other.team == u.team && !other.dead && other.type == UnitTypes.flare);
            let daggerCount = Groups.unit.count(other => other.team == u.team && !other.dead && other.type == UnitTypes.dagger);

            let target = Units.closestTarget(u.team, u.x, u.y, 8000);
            
            if(target == null){
                let teamData = Vars.state.teams.get(u.team);
                if(teamData != null && teamData.cores != null && !teamData.cores.isEmpty()){
                    target = teamData.cores.first();
                }
            }

            if(target != null){
                if(flareCount >= 15){
                    Groups.unit.each(other => {
                        if(other.team == u.team && !other.dead && other.type == UnitTypes.flare){
                            other.resetController();
                            other.lookAt(target.x, target.y);
                            if(other.isFlying()){
                                other.moveAt(Tmp.v1.set(target.x - other.x, target.y - other.y).limit(other.speed()));
                            }
                        }
                    });
                }
                if(daggerCount >= 15){
                    Groups.unit.each(other => {
                        if(other.team == u.team && !other.dead && other.type == UnitTypes.dagger){
                            other.resetController();
                            other.lookAt(target.x, target.y);
                            other.moveAt(Tmp.v1.set(target.x - other.x, target.y - other.y).limit(other.speed()));
                        }
                    });
                }
            }
        }

        if(data.healTimer >= 60){
            data.healTimer = 0;
            let teamUnitCount = Groups.unit.count(other => other.team == u.team && !other.dead);

            if(teamUnitCount <= 1){
                if(u.health < u.maxHealth){
                    u.health = Math.min(u.maxHealth, u.health + u.maxHealth * 0.01);
                    Fx.heal.at(u.x, u.y);
                }
            }
        }
    });
});