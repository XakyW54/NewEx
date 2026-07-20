// =========================================================
// HIỆU ỨNG VÒNG TRÒN TÍM ZOOM NGẪU NHIÊN CHO BLOCK ĐƯỢC BUFF
// =========================================================
const copesBuffCircleEffect = new Effect(35, e => {
    // Sử dụng Rand dựa trên e.id để đảm bảo độ ngẫu nhiên riêng biệt cho từng block
    let rand = new Rand(e.id);
    
    // Tốc độ nhấp nháy/zoom ngẫu nhiên từ 6.0 đến 14.0
    let zoomSpeed = rand.random(6.0, 14.0); 
    // Biên độ phóng to thu nhỏ ngẫu nhiên xung quanh mốc 5 pixel
    let zoomAmplitude = rand.random(1.5, 3.5); 
    
    // Áp dụng hàm hình sin absin để tạo chuyển động co giãn (zoom to nhỏ từ từ)
    let currentRadius = 5.0 + Mathf.absin(Time.time, zoomSpeed, zoomAmplitude);
    
    // Độ dày nét vẽ mờ dần theo thời gian sống của hạt hiệu ứng
    Lines.stroke(1.5 * e.fout());
    
    // Đặt màu tím cho vòng tròn hiệu ứng
    Draw.color(Color.purple);
    
    // Vẽ vòng tròn tại tâm block nhận buff
    Lines.circle(e.x, e.y, currentRadius);
    
    Draw.reset();
});

Events.on(ClientLoadEvent, () => {
    const wallBuff = Vars.content.block("newex-copesblock");

    if (wallBuff) {
        wallBuff.update = true;

        wallBuff.buildType = () => extend(Wall.WallBuild, wallBuff, {
            range: 80,         // Phạm vi quét (10 ô)
            boostTimer: 0,     
            limitCheck: 0,     // Biến đếm thời gian kiểm tra giới hạn đặt block

            update() {
                this.super$update();

                // --- GIỚI HẠN XÂY DỰNG TỐI ĐA LÀ 1 ---
                this.limitCheck += Time.delta;
                if (this.limitCheck >= 15) { 
                    this.limitCheck = 0; 
                    let count = 0; 
                    let firstBuild = null;

                    Groups.build.each(b => {
                        if (b.block == wallBuff && b.team == this.team) { 
                            count++; 
                            if (firstBuild == null) firstBuild = b; 
                        }
                    });

                    if (count > 1 && this !== firstBuild) {
                        Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 1 khối copesblock! Cấu trúc thừa đã tự hủy![]"); 
                        this.kill(); 
                        return;
                    }
                }

                // Cứ sau mỗi 0,5 giây (30 tick) thực hiện quét áp buff và kích hiệu ứng
                this.boostTimer += Time.delta;
                if (this.boostTimer >= 30) {
                    this.boostTimer = 0;
                    this.applyPerformanceBoost();
                }
            },

            applyPerformanceBoost() {
                let maxDst = this.range * this.range; 

                Groups.build.each(cons(building => {
                    if (building === this) return;

                    if (this.dst2(building) <= maxDst) {
                        // Chỉ lọc riêng các block thuộc lớp Máy khoan (Drills) của cùng đội
                        if (building.team == this.team && building instanceof Drill.DrillBuild) {
                            building.applyBoost(1.5, 35); 
                            
                            // KHỞI CHẠY HIỆU ỨNG TẠI TÂM MÁY KHOAN ĐƯỢC BUFF
                            // Tỉ lệ xuất hiện ngẫu nhiên khoảng 45% mỗi chu kỳ quét
                            if (Math.random() < 0.45) {
                                copesBuffCircleEffect.at(building.x, building.y);
                            }
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