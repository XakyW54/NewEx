// ==================== SUMMONER BLOCK (LEOLYR & ELORIX) ====================

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
        
        let nextX = centerX + (localX * cosRot - localY * sinRot);
        let nextY = centerY + (localX * sinRot + localY * cosRot);
        
        Lines.line(lastX, lastY, nextX, nextY);
        
        lastX = nextX;
        lastY = nextY;
    }
}

// VFX 1: RADAR ĐỒNG TÂM TRÒN ĐỀU VÀ KHÓA MỤC TIÊU VUÔNG + TIA LAZER
const orbitalLockOnEffect = new Effect(40, packCons((e) => {
    let progress = e.data; 
    
    Draw.z(Layer.effect + 2); 
    let targetColor = Color.orange.cpy().lerp(Color.sky, 1.0 - progress);
    
    Lines.stroke(1.2, targetColor);
    Lines.circle(e.x, e.y, 24 * progress); 
    Lines.circle(e.x, e.y, 12 * progress);

    let size = 14 + (16 * progress); 
    let len = 6; 
    Lines.stroke(1.6, targetColor);
    
    Lines.line(e.x + size, e.y + size, e.x + size - len, e.y + size);
    Lines.line(e.x + size, e.y + size, e.x + size, e.y + size - len);
    Lines.line(e.x - size, e.y + size, e.x - size + len, e.y + size);
    Lines.line(e.x - size, e.y + size, e.x - size, e.y + size - len);
    Lines.line(e.x + size, e.y - size, e.x + size - len, e.y - size);
    Lines.line(e.x + size, e.y - size, e.x + size, e.y - size + len);
    Lines.line(e.x - size, e.y - size, e.x - size + len, e.y - size);
    Lines.line(e.x - size, e.y - size, e.x - size, e.y - size + len);

    Lines.stroke(1.0, targetColor);
    Lines.line(e.x - 4, e.y, e.x + 4, e.y); 
    Lines.line(e.x, e.y - 4, e.x, e.y + 4); 

    Lines.stroke((0.4 + (0.7 * (1.0 - progress))) * progress, targetColor);
    Lines.line(e.x - 140, e.y + 250, e.x, e.y); 
    
    Draw.reset();
}));

// VFX 2: HIỆU ỨNG VA CHẠM VÀ HỆ THỐNG ĐỒNG BỘ ĐA VÒNG SÓNG BAY THEO LASER
const satelliteImpactEffect = new Effect(60, packCons((e) => {
    Draw.z(Layer.effect + 3);
    
    let f = e.fin();
    let beamIntensity = Interp.pow3Out.apply(f);
    let alpha = 1.0 - beamIntensity;
    
    Lines.stroke(18 * alpha, Color.sky);
    Lines.line(e.x - 140, e.y + 250, e.x, e.y);
    Lines.stroke(8 * alpha, Color.white);
    Lines.line(e.x - 140, e.y + 250, e.x, e.y);

    Lines.stroke(3.5 * (1.0 - f), Color.sky);
    Lines.circle(e.x, e.y, 8 + (55 * f));
    
    Draw.color(Color.white, Color.sky, f);
    let rand = new Rand(e.id);
    for(let i = 0; i < 18; i++){
        let angle = rand.random(360);
        let speed = rand.random(2.0, 6.0);
        let distance = speed * f * 10.0;
        Fill.circle(e.x + Angles.trnsx(angle, distance), e.y + Angles.trnsy(angle, distance), 2.5 * (1.0 - f));
    }

    let laserAngle = 33; 
    let moveX = -140 * Interp.pow2Out.apply(f);
    let moveY = 250 * Interp.pow2Out.apply(f);

    let wave1X = e.x + moveX; 
    let wave1Y = e.y + moveY; 
    let radius1 = 4 + (48 * Interp.pow3Out.apply(f));   
    
    Lines.stroke(2.5 * (1.0 - f), Color.sky.cpy().mul(1.0 - f));
    draw3DRotatedEllipseWave(wave1X, wave1Y, radius1, radius1 * 0.45, laserAngle);

    let wave2X = e.x + (moveX * 0.7); 
    let wave2Y = e.y + (moveY * 0.7); 
    let radius2 = (4 + (48 * Interp.pow3Out.apply(f))) * (2 / 3); 
    
    Lines.stroke(1.8 * (1.0 - f), Color.cyan.cpy().mul(1.0 - f)); 
    draw3DRotatedEllipseWave(wave2X, wave2Y, radius2, radius2 * 0.45, laserAngle); 
    
    Draw.reset();
}));

// Khởi động lắng nghe sự kiện nạp Mod
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
            selectedUnit: "newex-elorix", // Mặc định chọn Elorix

            buildConfiguration(table){
                table.clear();
                if(this.summoning) return;
                table.row();

                // NÚT KHÓA TỌA ĐỘ & TRIỆU HỒI
                table.button(Icon.ok, Styles.cleari, 40, packRun(() => {
                    let core = this.team.core();
                    if(core == null) {
                        Vars.ui.showInfo("[scarlet]Không tìm thấy nhà chính (Core)![]");
                        return;
                    }

                    // ĐỊNH NGHĨA TÀI NGUYÊN YÊU CẦU DỰA TRÊN UNIT ĐƯỢC CHỌN
                    let reqCopper = (this.selectedUnit.includes("elorix")) ? 4000 : 2000;
                    let reqSilicon = (this.selectedUnit.includes("elorix")) ? 500 : 300;

                    // KIỂM TRA TÀI NGUYÊN TRONG CORE
                    if(!core.items.has(Items.copper, reqCopper) || !core.items.has(Items.silicon, reqSilicon)){
                        Vars.ui.showInfo(
                            "[scarlet]Không đủ tài nguyên triệu hồi![]\n" +
                            "Cần có: [accent]" + reqCopper + " Copper[] và [accent]" + reqSilicon + " Silicon[] trong Core."
                        );
                        return;
                    }

                    // TRỪ TÀI NGUYÊN TRONG CORE
                    core.items.remove(Items.copper, reqCopper);
                    core.items.remove(Items.silicon, reqSilicon);

                    this.summoning = true;
                    this.summonTimer = 300; 
                    Fx.shieldApply.at(this.x, this.y, 0, Color.orange);
                    this.deselect(); 
                })).size(50, 40).tooltip("Xác nhận triệu hồi (Tốn tài nguyên & Chờ 5s)");

                // NÚT CHỌN ĐƠN VỊ & XEM CHI TIẾT
                table.button(Icon.add, Styles.cleari, 40, packRun(() => {
                    let dialog = extend(BaseDialog, "Hệ Thống Kén Triệu Hồi", {});
                    dialog.cont.add("[yellow]DANH SÁCH ĐƠN VỊ CÓ THỂ TRIỆU HỒI:[]").row();
                    dialog.cont.add().height(10).row();

                    let infoCard = new Table();
                    infoCard.background(Styles.black6);
                    infoCard.margin(10);
                    
                    // --- NÚT CHỌN ELORIX ---
                    infoCard.button("[orange]⚡ CHỌN TRIỆU HỒI: ELORIX UNIT[]", packRun(() => {
                        this.selectedUnit = "newex-elorix";
                        Vars.ui.showInfo("[orange]Đã cài đặt mục tiêu: Elorix[]");
                        dialog.hide();
                    })).size(300, 42).row();
                    infoCard.add().height(6).row();

                    let elorixDescStr = "[gold]📊 DỮ LIỆU PHÂN TÍCH THỰC THỂ ELORIX:[]\n" +
                        "• [accent]Chi phí triệu hồi:[] [white]4000 Copper[] + [white]500 Silicon[]\n" +
                        "• [accent]Tăng tiến cấp độ:[] Tự động hút Copper & Titanium từ kho cá nhân để nâng cấp (Max Lv10).\n" +
                        "• [pink]Hỏa lực Shotgun:[] Bắn chùm đạn đa nguyên tố xả diện rộng cực mạnh.\n" +
                        "• [sky]Lướt & Tạo Giáp:[] Nhấp đúp để lướt dẹp chướng ngại vật, nhận hiệu ứng giáp [Thin Armor] phòng thủ và kháng sát thương trong 5 giây.";
                    
                    let elorixDesc = infoCard.add(elorixDescStr).width(320);
                    elorixDesc.get().setWrap(true); 
                    elorixDesc.get().setAlignment(Align.left);

                    infoCard.add().height(16).row();

                    // --- NÚT CHỌN LEOLYR ---
                    infoCard.button("[cyan]🤖 CHỌN TRIỆU HỒI: LEOLYR UNIT[]", packRun(() => {
                        this.selectedUnit = "newex-leolyr";
                        Vars.ui.showInfo("[cyan]Đã cài đặt mục tiêu: Leolyr[]");
                        dialog.hide();
                    })).size(300, 42).row();
                    infoCard.add().height(6).row();

                    let leolyrDescStr = "[gold]📊 DỮ LIỆU PHÂN TÍCH THỰC THỂ LEOLYR:[]\n" +
                        "• [accent]Chi phí triệu hồi:[] [white]2000 Copper[] + [white]300 Silicon[]\n" +
                        "• [accent]Hệ thống Tiến hóa:[] Hấp thụ Đồng và Silicon trực tiếp từ kho đồ (Tối đa Cấp 10).\n" +
                        "• [pink]Vũ khí kép:[] Bắn luân phiên, tăng tiến tốc độ xả đạn theo level.\n" +
                        "• [sky]Lướt & Tạo Lõi Khiên:[] Lướt tạo lõi khiên tĩnh tồn tại 10 giây và khiên năng lượng Hex.";
                                          
                    let leolyrDesc = infoCard.add(leolyrDescStr).width(320);
                    leolyrDesc.get().setWrap(true); 
                    leolyrDesc.get().setAlignment(Align.left);

                    let scroll = new ScrollPane(infoCard);
                    scroll.setScrollingDisabled(true, false); 
                    
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

                    if(this.summonTimer <= 0){
                        this.summoning = false;

                        let unitType = Vars.content.getByName(ContentType.unit, this.selectedUnit);
                        if(unitType == null && this.selectedUnit.startsWith("newex-")){
                            // Thử tìm name rút gọn nếu không có prefix
                            unitType = Vars.content.getByName(ContentType.unit, this.selectedUnit.replace("newex-", ""));
                        }

                        if (unitType != null) {
                            let unit = unitType.create(this.team);
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