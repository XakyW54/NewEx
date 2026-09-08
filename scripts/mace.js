Events.on(ContentInitEvent, () => {
    const mace = Vars.content.unit("mace");

    if (mace != null) {
         mace.armor += 5;

         const splitUnits = new ObjectSet();

        mace.constructor = () => extend(MechUnit, {
            shootWarmupTimer: 0,

            update() {
                this.super$update();

 
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
                return this.super$rawDamage(amount * 0.5);
            },

             destroy() {
                let isSplit = splitUnits.contains(this.id);

                if (!isSplit && !Vars.net.client()) {
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