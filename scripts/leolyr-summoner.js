// ==================== SUMMONER BLOCK (LEOLYR, ELORIX & VUS-27) ====================

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

// VFX 1: RADAR KHÓA MỤC TIÊU DÙNG CHO CẢ 5s SPAWN (ĐỔI MÀU THÀNH TÍM HỒNG ĐA SẮC)
const orbitalLockOnEffect = new Effect(40, packCons((e) => {
    let progress = e.data; 
    
    Draw.z(Layer.effect + 2); 
    let purpleColor = Color.valueOf("c084fc");
    let pinkColor = Color.valueOf("e879f9");
    let targetColor = purpleColor.cpy().lerp(pinkColor, 1.0 - progress);
    
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

// VFX 2: HIỆU ỨNG VA CHẠM TÍM HỒNG KHI KẾT THÚC TRIỆU HỒI
const satelliteImpactEffect = new Effect(60, packCons((e) => {
    Draw.z(Layer.effect + 3);
    
    let f = e.fin();
    let beamIntensity = Interp.pow3Out.apply(f);
    let alpha = 1.0 - beamIntensity;
    
    let purpleColor = Color.valueOf("c084fc");
    let pinkColor = Color.valueOf("e879f9");

    Lines.stroke(18 * alpha, purpleColor);
    Lines.line(e.x - 140, e.y + 250, e.x, e.y);
    Lines.stroke(8 * alpha, Color.white);
    Lines.line(e.x - 140, e.y + 250, e.x, e.y);

    Lines.stroke(3.5 * (1.0 - f), pinkColor);
    Lines.circle(e.x, e.y, 8 + (55 * f));
    
    Draw.color(Color.white, purpleColor, f);
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
    
    Lines.stroke(2.5 * (1.0 - f), purpleColor.cpy().mul(1.0 - f));
    draw3DRotatedEllipseWave(wave1X, wave1Y, radius1, radius1 * 0.45, laserAngle);

    let wave2X = e.x + (moveX * 0.7); 
    let wave2Y = e.y + (moveY * 0.7); 
    let radius2 = (4 + (48 * Interp.pow3Out.apply(f))) * (2 / 3); 
    
    Lines.stroke(1.8 * (1.0 - f), pinkColor.cpy().mul(1.0 - f)); 
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
        
        // CẤU HÌNH KHO CHỨA ĐỂ NHẬN ITEM TỰ ĐỘNG
        leolyrSummoner.hasItems = true;
        leolyrSummoner.itemCapacity = 10000;
        leolyrSummoner.acceptsItems = true;

        leolyrSummoner.buildType = () => extend(Building, {
            summoning: false,       
            summonTimer: 0,         
            selectedUnit: "newex-elorix", // Mặc định chọn Elorix

            acceptItem(source, item){
                return this.items.get(item) < this.block.itemCapacity;
            },

            // Lấy chi phí tài nguyên yêu cầu tùy theo unit
            getRequirements(){
                if (this.selectedUnit.includes("elorix")) {
                    return { copper: 4000, silicon: 500 };
                } else if (this.selectedUnit.includes("vus") || this.selectedUnit.includes("suv")) {
                    return { copper: 3500, silicon: 600 };
                } else {
                    return { copper: 2000, silicon: 300 };
                }
            },

            buildConfiguration(table){
                table.clear();
                if(this.summoning) return;
                table.row();

                // 1. NÚT KÍCH HOẠT TRIỆU HỒI BẰNG TAY (RÚT TÀI NGUYÊN TỪ CORE)
                table.button(Icon.ok, Styles.cleari, 40, packRun(() => {
                    let core = this.team.core();
                    if(core == null) {
                        Vars.ui.showInfo("[scarlet]Không tìm thấy nhà chính (Core)![]");
                        return;
                    }

                    let req = this.getRequirements();

                    // KIỂM TRA TÀI NGUYÊN TRONG NHA CHÍNH (CORE)
                    if(!core.items.has(Items.copper, req.copper) || !core.items.has(Items.silicon, req.silicon)){
                        Vars.ui.showInfo(
                            "[scarlet]Không đủ tài nguyên trong Lõi![]\n" +
                            "Cần có: [accent]" + req.copper + " Copper[] và [accent]" + req.silicon + " Silicon[] trong Core."
                        );
                        return;
                    }

                    // TRỪ TÀI NGUYÊN TRONG LÕI
                    core.items.remove(Items.copper, req.copper);
                    core.items.remove(Items.silicon, req.silicon);

                    this.summoning = true;
                    this.summonTimer = 300; // Đếm ngược 5 giây (300 ticks)
                    
                    Fx.shieldApply.at(this.x, this.y, 0, Color.valueOf("c084fc"));
                    this.deselect(); 
                })).size(50, 40).tooltip("Triệu hồi thủ công (Rút tài nguyên từ Lõi Core & Chờ 5s)");

                // 2. NÚT CHỌN ĐƠN VỊ & XEM CHI TIẾT
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
                        "• [sky]Lướt & Tạo Giáp:[] Nhấp đúp để lướt dẹp chướng ngại vật, nhận hiệu ứng giáp [Thin Armor] phòng thủ 5s.";
                    
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
                        "• [sky]Lướt & Tạo Lõi Khiên:[] Lướt tạo lõi khiên tĩnh tồn tại 10 giây.";
                                          
                    let leolyrDesc = infoCard.add(leolyrDescStr).width(320);
                    leolyrDesc.get().setWrap(true); 
                    leolyrDesc.get().setAlignment(Align.left);

                    infoCard.add().height(16).row();

                    // --- NÚT CHỌN VUS-27 ---
                    infoCard.button("[purple]👾 CHỌN TRIỆU HỒI: VUS-27 UNIT[]", packRun(() => {
                        this.selectedUnit = "newex-vus-27";
                        Vars.ui.showInfo("[purple]Đã cài đặt mục tiêu: VUS-27[]");
                        dialog.hide();
                    })).size(300, 42).row();
                    infoCard.add().height(6).row();

                    let vusDescStr = "[gold]📊 DỮ LIỆU PHÂN TÍCH THỰC THỂ VUS-27:[]\n" +
                        "• [accent]Chi phí triệu hồi:[] [white]3500 Copper[] + [white]600 Silicon[]\n" +
                        "• [accent]Khả năng Biến hình:[] Nhấp đúp (Double Tap) để chuyển đổi qua lại giữa VUS-27 và SUV-27.\n" +
                        "• [pink]Hỏa lực VUS-27:[] Pháo Laser (160 Dmg, 240 dài) & Overdrive buff 1500% tốc bắn.\n" +
                        "• [sky]Cơ chế SUV-27:[] Càng bay càng nhanh (+200% Tốc độ), dừng đột ngột xả Shotgun 20 độ.";
                    
                    let vusDesc = infoCard.add(vusDescStr).width(320);
                    vusDesc.get().setWrap(true); 
                    vusDesc.get().setAlignment(Align.left);

                    let scroll = new ScrollPane(infoCard);
                    scroll.setScrollingDisabled(true, false); 
                    
                    dialog.cont.add(scroll).maxHeight(400).width(340);
                    
                    dialog.addCloseButton();
                    dialog.show();
                })).size(50, 40).tooltip("Chọn đơn vị triệu hồi & Xem phân tích thông số");
            },

            updateTile(){
                this.super$updateTile();

                // TỰ ĐỘNG TÍCH LŨY ITEM TỪ BĂNG CHUYỀN
                if(!this.summoning){
                    let req = this.getRequirements();
                    if(this.items.has(Items.copper, req.copper) && this.items.has(Items.silicon, req.silicon)){
                        // Khấu trừ tài nguyên tích lũy trong kho của khối
                        this.items.remove(Items.copper, req.copper);
                        this.items.remove(Items.silicon, req.silicon);

                        this.summoning = true;
                        this.summonTimer = 300; // Đếm ngược 5s
                        Fx.shieldApply.at(this.x, this.y, 0, Color.valueOf("c084fc"));
                    }
                }

                // TIẾN TRÌNH ĐẾM NGƯỢC VÀ SPAWN
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