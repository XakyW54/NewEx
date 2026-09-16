const spiroctData = {};
const spiroctOriginals = {};

const spiroctAtkBuff = new StatusEffect("spiroct-atk-buff");
spiroctAtkBuff.damageMultiplier = 1.5;
spiroctAtkBuff.show = true;

const spiroctBasicBullet = new BasicBulletType(5, 20);
spiroctBasicBullet.width = 8;
spiroctBasicBullet.height = 11;
spiroctBasicBullet.lifetime = 45;
spiroctBasicBullet.homingPower = 0.15;
spiroctBasicBullet.homingRange = 160;

const spiroctLaserBullet = new LaserBulletType();
spiroctLaserBullet.damage = 50;
spiroctLaserBullet.length = 160;
spiroctLaserBullet.width = 12;
spiroctLaserBullet.colors = [Color.valueOf("ec7458"), Color.valueOf("ff9e84"), Color.white];
spiroctLaserBullet.recoil = 0;

spiroctLaserBullet.fragBullet = spiroctBasicBullet;
spiroctLaserBullet.fragBullets = 3;
spiroctLaserBullet.fragVelocityMin = 0.8;
spiroctLaserBullet.fragVelocityMax = 1.3;
spiroctLaserBullet.fragSpread = 30;

Events.on(ClientLoadEvent, cons(e => {
    let spiroctUnit = Vars.content.getByName(ContentType.unit, "spiroct");
    if (spiroctUnit == null) return;

    spiroctOriginals.speed = spiroctUnit.speed;
    spiroctOriginals.armor = spiroctUnit.armor;
    
    // Khởi tạo Seq thủ công để tránh lỗi undefined
    spiroctOriginals.weapons = new Seq();
    spiroctUnit.weapons.each(w => spiroctOriginals.weapons.add(w));

    if (spiroctLaserBullet.spawnBullets == null) {
        spiroctLaserBullet.spawnBullets = Seq.with(spiroctBasicBullet);
    } else if (!spiroctLaserBullet.spawnBullets.contains(spiroctBasicBullet)) {
        spiroctLaserBullet.spawnBullets.add(spiroctBasicBullet);
    }
}));

Events.on(WorldLoadEvent, cons(e => {
    let spiroctUnit = Vars.content.getByName(ContentType.unit, "spiroct");
    if (spiroctUnit == null || spiroctOriginals.speed == null) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    if (isEnabled) {
        spiroctUnit.speed = spiroctOriginals.speed * 1.50;
        spiroctUnit.armor = spiroctOriginals.armor + 22;

        spiroctUnit.weapons.clear();

        const weaponMounts = [
            { x: 4, y: 3 },
            { x: -4, y: 3 },
            { x: 6, y: -3 },
            { x: -6, y: -3 }
        ];

        weaponMounts.forEach(mount => {
            let w = new Weapon("spiroct-weapon");
            w.x = mount.x;
            w.y = mount.y;
            w.reload = 30;
            w.alternate = false;
            w.mirror = false;
            w.rotate = true;
            w.rotateSpeed = 20;
            w.bullet = spiroctLaserBullet;

            w.recoil = 0;
            w.recoilTime = 0;
            w.top = false;

            w.load();
            spiroctUnit.weapons.add(w);
        });
    } else {
        spiroctUnit.speed = spiroctOriginals.speed;
        spiroctUnit.armor = spiroctOriginals.armor;

        spiroctUnit.weapons.clear();
        if (spiroctOriginals.weapons != null) {
            spiroctOriginals.weapons.each(w => spiroctUnit.weapons.add(w));
        }
    }
}));

Events.run(Trigger.update, () => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;
    if (!Core.settings.getBool("newex-logic-support-units", true)) return;

    let spiroctUnit = Vars.content.getByName(ContentType.unit, "spiroct");
    if (spiroctUnit == null) return;

    Groups.unit.each(u => {
        if (u != null && !u.dead && u.type == spiroctUnit) {
            let id = u.id;
            
            if (!spiroctData[id]) {
                spiroctData[id] = {
                    skillTimer: 0,
                    lastHealth: u.health
                };
            }

            let data = spiroctData[id];

            if (u.mounts != null) {
                for (let i = 0; i < u.mounts.length; i++) {
                    let m = u.mounts[i];

                    if (u.isShooting && m.reload <= 1.0 && m.shoot) {
                        if (Mathf.chance(0.25)) {
                            let bulletAngle = u.rotation + Mathf.range(20);
                            spiroctBasicBullet.create(
                                u, 
                                u.team, 
                                u.x + Angles.trnsx(u.rotation, 6), 
                                u.y + Angles.trnsy(u.rotation, 6), 
                                bulletAngle
                            );
                        }
                    }

                    if (m.reload <= 0 && u.isShooting) {
                        m.weapon.reload = Mathf.random(6, 60);
                    }
                }
            }

            let damageTaken = data.lastHealth - u.health;
            if (damageTaken > 0) {
                let lostHealthPercent = ((u.maxHealth - u.health) / u.maxHealth) * 100;
                let reductionRate = Math.min((lostHealthPercent * 0.009), 0.90);

                if (reductionRate > 0) {
                    u.health += damageTaken * reductionRate;
                }
            }

            data.skillTimer += Time.delta;
            if (data.skillTimer >= 300.0) {
                data.skillTimer = 0;
                u.apply(spiroctAtkBuff, 240);
            }

            data.lastHealth = u.health;
        }
    });
});

Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && spiroctData[e.unit.id]) {
        delete spiroctData[e.unit.id];
    }
}));