const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// THUẬT TOÁN ĐỒ HỌA: Vẽ vòng elip dẹt 3D đồng thời XOAY NGHIÊNG một góc theo trục la-zer
function draw3DRotatedEllipseWave(centerX, centerY, radiusX, radiusY, rotationDeg) {
    let points = 24;
    let rotationRad = rotationDeg * Mathf.degRad;
    let cosRot = Math.cos(rotationRad);
    let sinRot = Math.sin(rotationRad);
    
    let localX = radiusX;
    let localY = 0;
    let lastX = centerX + (localX * cosRot - localY * sinRot);
    let lastY = centerY + (localX * sinRot + localY * cosRot);
    
    for (let i = 1; i <= points; i++) {
        let angle = (i * 360 / points) * Mathf.degRad;
        localX = Math.cos(angle) * radiusX;
        localY = Math.sin(angle) * radiusY;
        
        // Ma trận xoay giúp bẻ nghiêng vòng tròn theo độ dốc của tia laser
        let nextX = centerX + (localX * cosRot - localY * sinRot);
        let nextY = centerY + (localX * sinRot + localY * cosRot);
        
        Lines.line(lastX, lastY, nextX, nextY);
        
        lastX = nextX;
        lastY = nextY;
    }
}

// =========================================================================
// VFX 1: RADAR ĐỒNG TÂM TRÒN ĐỀU VÀ KHÓA MỤC TIÊU VUÔNG + CÓ DẤU (+) Ở TÂM
// =========================================================================
const orbitalLockOnEffect = new Effect(40, packCons((e) => {
    let progress = e.data; 
    
    Draw.z(Layer.effect + 2); 
    let targetColor = Color.orange.cpy().lerp(Color.sky, 1.0 - progress);
    
    // 1. Vòng radar định vị TRÒN ĐỀU hoàn hảo không dẹt
    Lines.stroke(1.2, targetColor);
    Lines.circle(e.x, e.y, 24 * progress); 
    Lines.circle(e.x, e.y, 12 * progress);

    // 2. Khung khóa mục tiêu HÌNH VUÔNG cân xứng tuyệt đối
    let size = 14 + (16 * progress); 
    let len = 6; 
    Lines.stroke(1.6, targetColor);
    
    // Góc trên - bên phải
    Lines.line(e.x + size, e.y + size, e.x + size - len, e.y + size);
    Lines.line(e.x + size, e.y + size, e.x + size, e.y + size - len);
    // Góc trên - bên trái
    Lines.line(e.x - size, e.y + size, e.x - size + len, e.y + size);
    Lines.line(e.x - size, e.y + size, e.x - size, e.y + size - len);
    // Góc dưới - bên phải
    Lines.line(e.x + size, e.y - size, e.x + size - len, e.y - size);
    Lines.line(e.x + size, e.y - size, e.x + size, e.y - size + len);
    // Góc dưới - bên trái
    Lines.line(e.x - size, e.y - size, e.x - size + len, e.y - size);
    Lines.line(e.x - size, e.y - size, e.x - size, e.y - size + len);

    // Dấu (+) mảnh nằm ngay chính giữa trung tâm hình vuông định vị
    Lines.stroke(1.0, targetColor);
    Lines.line(e.x - 4, e.y, e.x + 4, e.y); 
    Lines.line(e.x, e.y - 4, e.x, e.y + 4); 

    // 3. TIA LA-ZER CHIẾU XIÊN NGHIÊNG: Dội từ hướng Tây Bắc (-140, +250) xuống tâm kén (0, 0)
    Lines.stroke((0.4 + (0.7 * (1.0 - progress))) * progress, targetColor);
    Lines.line(e.x - 140, e.y + 250, e.x, e.y); 
    
    Draw.reset();
}));

// =========================================================================
// VFX 2: HIỆU ỨNG VA CHẠM VÀ HỆ THỐNG ĐỒNG BỘ ĐA VÒNG SÓNG BAY THEO LASER
// =========================================================================
const satelliteImpactEffect = new Effect(60, packCons((e) => {
    Draw.z(Layer.effect + 3);
    
    let f = e.fin();
    let beamIntensity = Interp.pow3Out.apply(f);
    let alpha = 1.0 - beamIntensity;
    
    // 1. CỘT SÁNG VA CHẠM NGHIÊNG: Trục xiên dội từ bầu trời Tây Bắc xuống
    Lines.stroke(18 * alpha, Color.sky);
    Lines.line(e.x - 140, e.y + 250, e.x, e.y);
    Lines.stroke(8 * alpha, Color.white);
    Lines.line(e.x - 140, e.y + 250, e.x, e.y);

    // 2. Vòng tròn sóng nổ xung kích dội chấn động dưới mặt đất TRÒN ĐỀU hoàn hảo
    Lines.stroke(3.5 * (1.0 - f), Color.sky);
    Lines.circle(e.x, e.y, 8 + (55 * f));
    
    // 3. Hạt bụi năng lượng nổ văng tung tóe đều góc
    Draw.color(Color.white, Color.sky, f);
    let rand = new Rand(e.id);
    for(let i = 0; i < 18; i++){
        let angle = rand.random(360);
        let speed = rand.random(2.0, 6.0);
        let distance = speed * f * 10.0;
        Fill.circle(e.x + Angles.trnsx(angle, distance), e.y + Angles.trnsy(angle, distance), 2.5 * (1.0 - f));
    }

    // =========================================================================
    // ĐỒNG BỘ HOÀN TOÀN: ĐA VÒNG SÓNG 3D XOAY NGHIÊNG & BAY DỌC THEO ĐƯỜNG LASER
    // =========================================================================
    // Góc xoay phối cảnh chuẩn của đường la-zer xiên Tây Bắc là ~33 độ
    let laserAngle = 33; 
    
    // Tính toán tỷ lệ tịnh tiến bay ngược hướng la-zer (Lên trên và lệch sang Trái: X âm, Y dương)
    let moveX = -140 * Interp.pow2Out.apply(f);
    let moveY = 250 * Interp.pow2Out.apply(f);

    // VÒNG TRÒN 1 (Vòng gốc): Zoom to, mờ dần và bay dọc lên theo tia laser
    let wave1X = e.x + moveX; 
    let wave1Y = e.y + moveY; 
    let radius1 = 4 + (48 * Interp.pow3Out.apply(f));   
    
    Lines.stroke(2.5 * (1.0 - f), Color.sky.cpy().mul(1.0 - f));
    draw3DRotatedEllipseWave(wave1X, wave1Y, radius1, radius1 * 0.45, laserAngle);

    // VÒNG TRÒN 2 (Vòng phụ): Nhỏ hơn 2/3, cũng đồng bộ nghiêng và cùng di chuyển hướng lên bám theo đường laser
    // Cho vòng 2 xuất hiện dịch chuyển trễ một chút bằng cách nhân thêm trọng số f để tạo chiều sâu lập thể
    let wave2X = e.x + (moveX * 0.7); 
    let wave2Y = e.y + (moveY * 0.7); 
    let radius2 = (4 + (48 * Interp.pow3Out.apply(f))) * (2 / 3); 
    
    Lines.stroke(1.8 * (1.0 - f), Color.cyan.cpy().mul(1.0 - f)); 
    draw3DRotatedEllipseWave(wave2X, wave2Y, radius2, radius2 * 0.45, laserAngle); 
    
    Draw.reset();
}));


// Khởi động lắng nghe sự kiện nạp Mod của hệ thống game Mindustry
Events.on(ClientLoadEvent, () => {
    let leolyrSummoner = Vars.content.getByName(ContentType.block, "newex-leolyr-spawner");
    
    if(leolyrSummoner == null){
        leolyrSummoner = Vars.content.getByName(ContentType.block, "leolyr-spawner");
    }

    if(leolyrSummoner != null){
        leolyrSummoner.configurable = true;
        leolyrSummoner.update = true;

        leolyrSummoner.buildType = () => extend(Building, {
            summoning: false,       
            summonTimer: 0,         
            selectedUnit: "newex-leolyr", 

            buildConfiguration(table){
                table.clear();
                if(this.summoning) return;
                table.row();

                // NÚT KHÓA TỌA ĐỘ
                table.button(Icon.ok, Styles.cleari, 40, packRun(() => {
                    this.summoning = true;
                    this.summonTimer = 300; 
                    Fx.shieldApply.at(this.x, this.y, 0, Color.orange);
                    this.deselect(); 
                })).size(50, 40).tooltip("Xác nhận tọa độ - Ra lệnh vệ tinh thả đơn vị (5s)");

// Thay thế đoạn xử lý NÚT PHÂN TÍCH THÔNG TIN UNIT trong buildConfiguration(table) của leolyr-summoner.js:

table.button(Icon.add, Styles.cleari, 40, packRun(() => {
    let dialog = extend(BaseDialog, "Hệ Thống Kén Triệu Hồi", {});
    dialog.cont.add("[yellow]DANH SÁCH ĐƠN VỊ CÓ THỂ TRIỆU HỒI:[]").row();
    dialog.cont.add().height(10).row();

    // 1. Tạo bảng chứa nội dung thẻ thông tin (Ép độ rộng cố định để kích hoạt tự động xuống dòng)
    let infoCard = new Table();
    infoCard.background(Styles.black6);
    infoCard.margin(10);
    
    infoCard.button("[cyan]🤖 TRIỆU HỒI: LEOLYR UNIT[]", packRun(() => {
        this.selectedUnit = "newex-leolyr";
        Vars.ui.showInfo("[cyan]Mục tiêu: Đã cài đặt Leolyr[]");
        dialog.hide();
    })).size(280, 42).row();
    
    infoCard.add().height(8).row();

let descStr = "[gold]📊 DỮ LIỆU PHÂN TÍCH THỰC THỂ LEOLYR:[]\n" +
                                  "• [accent]Hệ thống Tiến hóa:[] Hấp thụ Đồng và Silicon trực tiếp từ kho đồ để nâng cấp (Tối đa Cấp 10).\n" +
                                  "• [pink]Vũ khí kép (Dual Weapon):[] Bắn luân phiên, tốc độ xả đạn và sát thương tăng tiến vượt bậc theo cấp độ.\n" +
                                  "• [sky]Lướt Không Gian & Phòng Thủ:[] Nhấp đúp chuột để lướt tăng tốc, đồng thời để lại một [lõi khiên tĩnh] tại vị trí cũ (Tồn tại 10 giây). Đồng thời khởi tạo lớp [khiên năng lượng Hex bao bọc] bảo vệ bản thân hấp thụ và chặn đạn kẻ địch hoàn toàn.\n" +
                                  "• [scarlet]Dịch chuyển chiến thuật (Cấp 10):[] Nhấp đúp lần 1 để chọn vị trí bất kỳ trên màn hình, nhấp đúp lần 2 để biến dịch tầm xa tới mục tiêu định vị.\n" +
                                  "• [orange]Giới hạn Thực thể:[] Tối đa [white]2 đơn vị[] cùng phe hoạt động trên sân để đảm bảo ổn định hệ thống phần cứng (thực thể vượt quá sẽ tự hủy ngay lập tức).";
                                  
    let desc = infoCard.add(descStr).width(320);
    desc.get().setWrap(true); 
    desc.get().setAlignment(Align.left);

    // 2. Nhúng bảng infoCard vào thanh cuộn dọc (ScrollPane) giống pháo Dor
    let scroll = new ScrollPane(infoCard);
    scroll.setScrollingDisabled(true, false); // Khóa cuộn ngang (X), chỉ cho phép cuộn dọc (Y)
    
    // 3. Đẩy thanh cuộn vào giao diện Dialog và giới hạn chiều cao hiển thị tối đa là 400 pixel
    dialog.cont.add(scroll).maxHeight(400).width(340);
    
    dialog.addCloseButton();
    dialog.show();
})).size(50, 40).tooltip("Chọn đơn vị triệu hồi & Xem phân tích thông số");
            },

            updateTile(){
                this.super$updateTile();

                if(this.summoning){
                    this.summonTimer -= Time.delta;
                    let progressRatio = Math.max(0.0, this.summonTimer / 300.0);

                    if(Mathf.chance(0.65)){
                        orbitalLockOnEffect.at(this.x, this.y, 0, java.lang.Float(progressRatio));
                    }

                    if(Mathf.chance(0.0)){
                        Fx.sparkShoot.at(this.x, this.y);
                    }

                    if(this.summonTimer <= 0){
                        this.summoning = false;

                        let leolyrType = Vars.content.getByName(ContentType.unit, this.selectedUnit);
                        if (leolyrType != null) {
                            let unit = leolyrType.create(this.team);
                            unit.set(this.x, this.y);
                            unit.add();  
                            if (unit.isGalileoJS) {
                                unit.level = 1;  
                            }
                        }

                        satelliteImpactEffect.at(this.x, this.y);
                        
                        Fx.smokeCloud.at(this.x, this.y);       
                        Fx.spawnShockwave.at(this.x, this.y);   
                        Effect.shake(7, 7, this.x, this.y); 

                        this.tile.setAir(); 
                    }
                }
            }
        });
    }
});