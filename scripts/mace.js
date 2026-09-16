// Tên file: mace.js
// Mô tả: Tăng giáp, tăng tốc độ bắn khi tấn công, giảm 50% sát thương nhận vào & nhân bản khi bị hạ gục. Bật/Tắt theo "newex-logic-support-units".

var baseMaceArmor = 4;

Events.on(ClientLoadEvent, () => {
    let mace = UnitTypes.mace;
    if(mace != null){
        baseMaceArmor = mace.armor;
    }
});

Events.on(WorldLoadEvent, () => {
    let mace = UnitTypes.mace;
    if(!mace) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);
    if(isEnabled){
        mace.armor = baseMaceArmor + 5;
    } else {
        mace.armor = baseMaceArmor;
    }
});

Events.on(ContentInitEvent, () => {
    const mace = Vars.content.unit("mace");

    if (mace != null) {
        const splitUnits = new ObjectSet();

        mace.constructor = () => extend(MechUnit, {
            shootWarmupTimer: 0,

            update() {
                this.super$update();

                let isEnabled = Core.settings.getBool("newex-logic-support-units", true);
                if (!isEnabled) {
                    this.reloadMultiplier = 1.0;
                    return;
                }

                if (this.isShooting) {
                    this.shootWarmupTimer = Math.min(300, this.shootWarmupTimer + Time.delta);
                } else {
                    this.shootWarmupTimer = Math.max(0, this.shootWarmupTimer - Time.delta * 2);
                }

                let speedBoost = 1 + (this.shootWarmupTimer / 300) * 2.0;
                this.reloadMultiplier = speedBoost;

                if (this.isShooting && Mathf.chance(0.80)) {
                    this.mounts.forEach(mount => {
                        if (mount.weapon != null && mount.bullet != null) {
                            mount.bullet.damage = mount.weapon.bullet.damage * 2.2;
                        }
                    });
                }
            },

            rawDamage(amount) {
                let isEnabled = Core.settings.getBool("newex-logic-support-units", true);
                if (isEnabled) {
                    return this.super$rawDamage(amount * 0.5); // Giảm 50% sát thương
                }
                return this.super$rawDamage(amount);
            },

            destroy() {
                let isEnabled = Core.settings.getBool("newex-logic-support-units", true);
                let isSplit = splitUnits.contains(this.id);

                if (isEnabled && !isSplit && !Vars.net.client()) {
                    for (let i = 0; i < 2; i++) {
                        let spawned = mace.create(this.team);
                        
                        spawned.set(this.x + Mathf.range(4), this.y + Mathf.range(4));
                        spawned.rotation = this.rotation + (i * 180);
                        
                        spawned.health = spawned.maxHealth;
                        spawned.add();
                        
                        splitUnits.add(spawned.id);

                        Call.effect(Fx.spawn, spawned.x, spawned.y, 0, this.team.color);
                    }
                }

                splitUnits.remove(this.id);
                this.super$destroy();
            }
        });
    }
});