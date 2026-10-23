const PerfCore = global.PerfCore;
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
                // Lấy chính xác loại Item từ băng đạn của pháo
                let ammoItem = Items.copper;
                if (owner.ammo != null && !owner.ammo.isEmpty()) {
                    let entry = owner.ammo.peek();
                    if (entry != null) {
                        ammoItem = entry.item || entry;
                    }
                }
                core.items.add(ammoItem, 30);
            }
        }
    }
});

Events.on(ClientLoadEvent, cons(e => {
    const zojBlock = Vars.content.getByName(ContentType.block, "newex-zoj");

    if (zojBlock != null) {
        let selectableItems = [Items.copper, Items.lead, Items.coal, Items.sand, Items.scrap];
        selectableItems.forEach(item => {
            zojBlock.ammoTypes.put(item, zojBullet);
        });

        const baseCost = 16;
        const maxCost = 99999;

        function getDynamicCost() {
            let count = PerfCore.teamCount(null, zojBlock);
            let cost = Math.floor(baseCost * Math.pow(2, count));
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
            shotsFired: 0,

            useAmmo() {
                let type = this.super$useAmmo();
                this.shotsFired++;
                if (this.shotsFired >= 100) {
                    this.kill();
                }
                return type;
            },

            write(write) {
                this.super$write(write);
                write.i(this.shotsFired);
            },

            read(read, revision) {
                this.super$read(read, revision);
                this.shotsFired = read.i();
            },

            heal(amount) {
            },

            customSelfHeal(amount) {
            }
        });

        Events.run(Trigger.update, () => {
            if (!PerfCore.every("zoj-cost", 20)) return;
            updateCost();
        });
    }
}));