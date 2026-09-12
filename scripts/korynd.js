const koryndMineFx = new Effect(25, cons(e => {
    Draw.color(Color.valueOf("3a3a3a"), Color.gray, e.fin());
    let rand = new Rand(e.id);
    for (let i = 0; i < 6; i++) {
        let v = rand.range(360);
        let len = rand.random(12.0) * e.finpow();
        let x = e.x + Angles.trnsx(v, len);
        let y = e.y + Angles.trnsy(v, len);
        Fill.square(x, y, 1.5 * e.fout(), 45);
    }
}));

const koryndCraftFx = new Effect(30, cons(e => {
    Draw.color(Color.valueOf("5b637a"), Color.valueOf("98a2b3"), e.fin());
    Lines.stroke(2.0 * e.fout());
    Lines.circle(e.x, e.y, 8.0 * e.finpow());
    Fill.circle(e.x, e.y, 3.0 * e.fout());
}));

Events.on(ContentInitEvent, () => {
    const block = Vars.content.getByName(ContentType.block, "newex-korynd");

    if (block != null) {
        block.craftEffect = koryndCraftFx;

        block.buildType = () => extend(GenericCrafter.GenericCrafterBuild, block, {
            mineTimer: 0,
            nextMineDelay: 60,

            created() {
                this.super$created();
                this.nextMineDelay = Mathf.random(6, 120);
            },

            // Cho phép nhận Item Than từ bên ngoài
            acceptItem(source, item) {
                if (item === Items.coal) {
                    return this.items.get(Items.coal) < this.block.itemCapacity;
                }
                return this.super$acceptItem(source, item);
            },

            updateTile() {
                // Tự kiểm tra xem có Crynex kề cạnh hay không
                let hasCrynex = false;
                this.proximity.each(other => {
                    if (other.block != null && other.block.name === "newex-crynex") {
                        hasCrynex = true;
                    }
                });

                // Kiếm tra xem có Chất làm lạnh trong khối hay không để tăng năng suất
                let hasCryo = (this.liquids != null && this.liquids.get(Liquids.cryofluid) > 0);

                // Nếu có chất làm lạnh -> Tốc độ x4.0 (gốc 1.0 + cộng thêm 3.0)
                let speedMultiplier = hasCryo ? 4.0 : 1.0;

                // 1. Tự động đào Than
                if (this.enabled) {
                    this.mineTimer += Time.delta * speedMultiplier;
                    if (this.mineTimer >= this.nextMineDelay) {
                        this.mineTimer = 0;
                        this.nextMineDelay = Mathf.random(6, 120);

                        if (this.items.get(Items.coal) < this.block.itemCapacity) {
                            this.items.add(Items.coal, 1);
                            koryndMineFx.at(this.x, this.y);
                        }
                    }
                }

                // 2. Chạy chế tạo Than chì (Bắt buộc phải có Crynex ở cạnh bên mới chế tạo; Nhân x4 tốc độ nếu có chất làm lạnh)
                if (hasCrynex && this.shouldConsume()) {
                    let bonusBoost = hasCryo ? 3.0 : 0.0;
                    this.progress += this.delta() * (1.0 + bonusBoost);
                }

                this.super$updateTile();
            },

            shouldConsume() {
                return this.enabled && this.items.get(Items.coal) >= 2;
            },

            craft() {
                if (this.items.get(Items.coal) >= 2) {
                    this.items.remove(Items.coal, 2);
                    this.items.add(Items.graphite, 1);
                    koryndCraftFx.at(this.x, this.y);
                }
            }
        });
    }
});