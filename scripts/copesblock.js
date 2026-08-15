const copesBuffCircleEffect = new Effect(35, e => {
    let rand = new Rand(e.id);
    let zoomSpeed = rand.random(6.0, 14.0); 
    let zoomAmplitude = rand.random(1.5, 3.5); 
    let currentRadius = 5.0 + Mathf.absin(Time.time, zoomSpeed, zoomAmplitude);
    
    Lines.stroke(1.5 * e.fout());
    Draw.color(Color.purple);
    Lines.circle(e.x, e.y, currentRadius);
    Draw.reset();
});

Events.on(ContentInitEvent, () => {
    const wallBuff = Vars.content.block("newex-copesblock") || Vars.content.block("copesblock");

    if (wallBuff) {
        wallBuff.update = true;
        const rangeSize = 96;

        wallBuff.buildType = () => extend(Wall.WallBuild, wallBuff, {
            range: rangeSize,         
            boostTimer: 0,     

            updateTile() {
                this.super$updateTile();

                // Logic tăng tốc cho các Drill xung quanh
                this.boostTimer += Time.delta;
                if (this.boostTimer >= 30) {
                    this.boostTimer = 0;
                    this.applyPerformanceBoost();
                }
            },

            applyPerformanceBoost() {
                Groups.build.each(building => {
                    if (building === this) return;

                    let inSquare = Math.abs(building.x - this.x) <= this.range && 
                                   Math.abs(building.y - this.y) <= this.range;

                    if (inSquare) {
                        if (building.team == this.team && building instanceof Drill.DrillBuild) {
                            building.applyBoost(1.5, 35); 
                            if (Math.random() < 0.45) {
                                copesBuffCircleEffect.at(building.x, building.y);
                            }
                        }
                    }
                });
            },

            drawSelect() {
                this.super$drawSelect();
                Drawf.dashSquare(Pal.accent, this.x, this.y, this.range * 2);
            }
        });
    }
});

// CHỈNH SỬA: Ẩn/Hiện khối khỏi Build Menu theo thời gian thực (Real-time Menu Visibility)
Events.run(Trigger.update, () => {
    if (Vars.state.isMenu()) return;

    const wallBuff = Vars.content.block("newex-copesblock") || Vars.content.block("copesblock");
    if (!wallBuff || !Vars.player) return;

    let playerTeam = Vars.player.team();
    
    // Đếm số lượng khối thuộc đội của người chơi đang có trên bản đồ
    let exists = Groups.build.contains(b => b.block === wallBuff && b.team === playerTeam);

    // Nếu đã có -> Ẩn khối khỏi Build Menu (hidden)
    // Nếu chưa có / đã bị phá hủy -> Mở lại khối trong Build Menu (shown)
    if (exists) {
        wallBuff.buildVisibility = BuildVisibility.hidden;
    } else {
        wallBuff.buildVisibility = BuildVisibility.shown;
    }
});

// Hiển thị tầm hiệu ứng (Range Square) khi đang chọn khối để đặt
Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && (build.name == "newex-copesblock" || build.name == "copesblock")) {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        
        if (tile != null) {
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;
            let rangeSize = 80;

            Drawf.dashSquare(Pal.accent, centerX, centerY, rangeSize * 2);
        }
    }
});