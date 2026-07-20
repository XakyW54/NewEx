Events.on(ClientLoadEvent, () => {
    const wallBuff = Vars.content.block("newex-copesblock");

    if (wallBuff) {
        wallBuff.update = true;

        wallBuff.buildType = () => extend(Wall.WallBuild, wallBuff, {
            range: 80,         // Phạm vi quét (10 ô)
            boostTimer: 0,     

            update() {
                this.super$update();

                // Cứ sau mỗi 0,5 giây (30 tick) thì thực hiện quét một lần
                this.boostTimer += Time.delta;
                if (this.boostTimer >= 30) {
                    this.boostTimer = 0;
                    this.applyPerformanceBoost();
                }
            },

            applyPerformanceBoost() {
                let maxDst = this.range * this.range; 

                Groups.build.each(cons(building => {
                    if (this.dst2(building) <= maxDst) {
                        if (building.team == this.team && building.block.canOverdrive) {
                            building.applyBoost(1.5, 30);
                        }
                    }
                }));
            },

            // Hiển thị vòng tròn nét đứt khi player lia chuột hoặc click vào block đã xây trên sân
            drawSelect() {
                this.super$drawSelect();
                Drawf.dashCircle(this.x, this.y, this.range, Pal.accent);
            }
        });
    }
});