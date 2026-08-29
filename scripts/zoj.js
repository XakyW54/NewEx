const zojBullet = extend(BasicBulletType, {
    speed: 15,
    damage: 30,
    width: 4,
    height: 12,
    lifetime: 40,
    frontColor: Color.valueOf("#e0ea87"),
    backColor: Color.valueOf("#e5ff00"),
    trailColor: Color.valueOf("#daea80"),

     homingPower: 0.8,
    homingRange: 300,
    homingDelay: 0,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);

        let owner = b.owner;
        if (owner != null && owner.team != null && owner.isValid()) {
             let core = owner.team.core();
            if (core != null) {
                core.items.add(Items.copper, 20);
            }

             let healthPercent = owner.maxHealth * 0.10;

             if (Math.random() < 0.7) {
                 owner.damage(healthPercent);
                Fx.blockCrash.at(owner.x, owner.y); 
            } else {
                 if (owner.customSelfHeal !== undefined) {
                    owner.customSelfHeal(healthPercent);
                }
            }
        }
    }
});

Events.on(ClientLoadEvent, cons(e => {
    const zojBlock = Vars.content.getByName(ContentType.block, "newex-zoj");

    if (zojBlock != null) {
        zojBlock.ammoTypes.put(Items.copper, zojBullet);

        const baseCost = 16;
        const maxCost = 99999;

         let totalPlacedCount = 0;

         Events.on(WorldLoadEvent, cons(event => {
            totalPlacedCount = 0;
            updateCost();
        }));

         Events.on(BlockBuildEndEvent, cons(event => {
            if (event.tile != null && event.tile.block() === zojBlock && !event.breaking) {
                totalPlacedCount++;  
                updateCost();
            }
        }));

        function getDynamicCost() {
            let cost = Math.floor(baseCost * Math.pow(2, totalPlacedCount));
            if (cost > maxCost) {
                cost = maxCost;
            }
            return cost;
        }

        function updateCost() {
            if (zojBlock.requirements != null && zojBlock.requirements.length > 0) {
                zojBlock.requirements[0].amount = getDynamicCost();
            }
        }

         zojBlock.buildType = () => extend(ItemTurret.ItemTurretBuild, zojBlock, {
            
             heal(amount) {
             },

             customSelfHeal(amount) {
                this.health = Math.min(this.health + amount, this.maxHealth);
                Fx.heal.at(this.x, this.y);
            }
        });

         Events.run(Trigger.update, () => {
            updateCost();
        });
    }
}));