const zojBullet = extend(BasicBulletType, {
    speed: 15,
    damage: 30,
    width: 4,
    height: 12,
    lifetime: 40,
    frontColor: Color.valueOf("#e0ea87"),
    backColor: Color.valueOf("#e5ff00"),
    trailColor: Color.valueOf("#daea80"),

    // Hiệu ứng truy đuổi
    homingPower: 0.8,
    homingRange: 300,
    homingDelay: 0,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);

        let owner = b.owner;
        if (owner != null && owner.team != null && owner.isValid()) {
            // 1. Cộng 20 Copper vào Lõi
            let core = owner.team.core();
            if (core != null) {
                core.items.add(Items.copper, 20);
            }

            // Tính 10% lượng máu tối đa
            let healthPercent = owner.maxHealth * 0.10;

            // 2. Logic thực tế: 70% Giảm máu / 30% Hồi máu
            if (Math.random() < 0.7) {
                // 70% Trừ 10% máu
                owner.damage(healthPercent);
                Fx.blockCrash.at(owner.x, owner.y); // Hiệu ứng vỡ/mất máu
            } else {
                // 30% Hồi 10% máu (Dùng hàm nội bộ để né chặn hồi máu ngoài)
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

        // Biến toàn cục lưu tổng số lần ĐÃ ĐẶT pháo
        let totalPlacedCount = 0;

        // Reset điểm đếm khi vào trận mới hoặc tải lại map
        Events.on(WorldLoadEvent, cons(event => {
            totalPlacedCount = 0;
            updateCost();
        }));

        // Lắng nghe sự kiện XÂY HOÀN TẤT một công trình
        Events.on(BlockBuildEndEvent, cons(event => {
            if (event.tile != null && event.tile.block() === zojBlock && !event.breaking) {
                totalPlacedCount++; // Tăng 1 điểm khi đặt pháo
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

        // Cấu hình BuildType để chặn hồi máu từ bên ngoài
        zojBlock.buildType = () => extend(ItemTurret.ItemTurretBuild, zojBlock, {
            
            // CHẶN HỒI MÁU TỪ BÊN NGOÀI (Chặn công trình hồi máu, mender, beam,...)
            heal(amount) {
                // Không làm gì cả để vô hiệu hóa hoàn toàn hồi máu bên ngoài
            },

            // Hàm tự hồi máu nội bộ dành riêng cho đạn pháo
            customSelfHeal(amount) {
                this.health = Math.min(this.health + amount, this.maxHealth);
                Fx.heal.at(this.x, this.y);
            }
        });

        // Cập nhật giá theo thời gian thực
        Events.run(Trigger.update, () => {
            updateCost();
        });
    }
}));