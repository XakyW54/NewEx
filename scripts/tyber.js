const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });


const reqMK2 = {
    titanium: 4000,
    silicon: 4000,
    plastanium: 0
};

const reqMK2B = {
    titanium: 6250,
    silicon: 8200,
    plastanium: 4100
};


const tyberExplosionFx = new Effect(40, cons(e => {
    Draw.color(Color.valueOf("d1efff"), Color.valueOf("66b1ff"), e.fin());
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 80 * e.fin()); 
    Angles.randLenVectors(e.id, 15, 80 * e.fin(), e.rotation, 360, new Floatc2({
        get: function(x, y){ Fill.circle(e.x + x, e.y + y, 1 + 3 * e.fout()); }
    }));
}));

const tyberExplosionBigFx = new Effect(50, cons(e => {
    Draw.color(Color.valueOf("ff8a80"), Color.valueOf("ff1744"), e.fin());
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, 136 * e.fin()); 
    Angles.randLenVectors(e.id, 25, 136 * e.fin(), e.rotation, 360, new Floatc2({
        get: function(x, y){ Fill.circle(e.x + x, e.y + y, 1 + 4 * e.fout()); }
    }));
}));

const shootMK1 = new ShootAlternate(); shootMK1.shots = 3; shootMK1.shotDelay = 6; shootMK1.barrels = 3; shootMK1.spread = 5;
const shootMK2 = new ShootAlternate(); shootMK2.shots = 5; shootMK2.shotDelay = 4; shootMK2.barrels = 5; shootMK2.spread = 4;
const shootMK2B = new ShootPattern(); shootMK2B.shots = 1;

Events.on(EventType.ContentInitEvent, () => {
    
    const soundShootMain = Vars.tree.loadSound("shootBig");     
    const soundShootSecondary = Vars.tree.loadSound("rocklaunch"); 
    const soundExplosionNormal = Vars.tree.loadSound("explosion"); 
    const soundExplosionBig = Vars.tree.loadSound("explosionbig"); 

    const mainRocketUnit = Vars.content.getByName(ContentType.unit, "newex-tyberrocket"); 
    const rocket2bUnit = Vars.content.getByName(ContentType.unit, "newex-tyberrocket2b");

    let tyberBullet = new BasicBulletType();
    tyberBullet.damage = 0;
    tyberBullet.speed = 0.01; 
    tyberBullet.instantDisappear = true;
    if(soundShootMain != null) tyberBullet.shootSound = soundShootMain; 
    tyberBullet.spawnUnit = mainRocketUnit; 
    tyberBullet.shootEffect = Fx.shootBig;
    tyberBullet.smokeEffect = Fx.shootSmokeMissile;

    const tyberBase = Vars.content.getByName(ContentType.block, "newex-tyber");
    if(tyberBase != null){
        tyberBase.configurable = true; 
        tyberBase.ammoTypes.put(Items.titanium, tyberBullet);

        tyberBase.buildType = () => extend(ItemTurret.ItemTurretBuild, tyberBase, {
            shootingTimer: 0.0,      
            lastRocketTime: 0.0,     
            lastExplosionTime: 0.0,  
            evolution: 0, 
            limitCheck: 0, // Thêm biến đếm thời gian kiểm tra giới hạn giống pháo Dor

            range(){
                if(this.evolution == 1) return this.super$range() * 1.5;
                return this.super$range();
            },

            peekAmmo(){
                let ammo = this.super$peekAmmo();
                if(ammo != null){
                    if(this.evolution == 1){
                        tyberBase.shoot = shootMK2; 
                        tyberBase.reload = 80; 
                    } 
                    else if(this.evolution == 2){ 
                        tyberBase.shoot = shootMK2B; 
                        tyberBase.reload = 40; 
                    } 
                    else { 
                        tyberBase.shoot = shootMK1; 
                        tyberBase.reload = 80; 
                    }
                }
                return ammo;
            },

            getCustomPos(sOffset, fOffset){
                let baseRad = this.rotation * Mathf.degRad;
                let cos = Math.cos(baseRad);
                let sin = Math.sin(baseRad);
                return {x: this.x + (fOffset * cos - sOffset * sin), y: this.y + (fOffset * sin + sOffset * cos)};
            },

            updateTile(){
                // --- ĐOẠN CODE KIỂM TRA GIỚI HẠN ĐƯỢC THÊM VÀO (GIỚI HẠN LÀ 1) ---
                this.limitCheck += Time.delta;
                if(this.limitCheck >= 15){
                    this.limitCheck = 0; let count = 0; let firstBuild = null;
                    Groups.build.each(b => {
                        if(b.block == tyberBase && b.team == this.team) { 
                            count++; if(firstBuild == null) firstBuild = b; 
                        }
                    });
                    if(count > 1 && this !== firstBuild){
                        Call.sendMessage("[red]Giới hạn: Chỉ được phép đặt tối đa 1 tháp pháo thuộc dòng Tyber System! Cấu trúc thừa đã tự hủy![]"); 
                        this.kill(); return;
                    }
                }
                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                this.super$updateTile();
                
                if(this.isShooting && this.hasAmmo() && this.isActive()){
                    this.shootingTimer += Time.delta;

                    let rocketCooldown = 300; 
                    if(this.evolution == 1){
                        rocketCooldown = 240; 
                    } else if(this.evolution == 2){
                        rocketCooldown = 180; 
                    }

                    if(this.shootingTimer - this.lastRocketTime >= rocketCooldown){ 
                        this.lastRocketTime = this.shootingTimer; 
                        if(rocket2bUnit != null){ 
                            if(this.evolution == 2){ 
                                let posL = this.getCustomPos(-6, 4); let posR = this.getCustomPos(6, 4);
                                let unitA = rocket2bUnit.spawn(this.team, posL.x, posL.y); if(unitA != null) unitA.rotation = this.rotation - 12; 
                                let unitB = rocket2bUnit.spawn(this.team, posR.x, posR.y); if(unitB != null) unitB.rotation = this.rotation + 12; 
                            } else {
                                let posM = this.getCustomPos(0, 6);
                                let spawnedUnit = rocket2bUnit.spawn(this.team, posM.x, posM.y); if(spawnedUnit != null) spawnedUnit.rotation = this.rotation; 
                            }
                            if(soundShootSecondary != null) soundShootSecondary.at(this.x, this.y, 1.2, 0.8); 
                        }
                    }

                    let explosionCooldown = 420; 
                    if(this.evolution == 1){
                        explosionCooldown = 360; 
                    } else if(this.evolution == 2){
                        explosionCooldown = 180; 
                    }

                    if(this.shootingTimer - this.lastExplosionTime >= explosionCooldown){ 
                        this.lastExplosionTime = this.shootingTimer; 
                        if(this.evolution == 2){ 
                            tyberExplosionBigFx.at(this.x, this.y); if(soundExplosionBig != null) soundExplosionBig.at(this.x, this.y); 
                            Damage.damage(this.team, this.x, this.y, 1700, 176, false, true); 
                        } else { 
                            tyberExplosionFx.at(this.x, this.y); 
                            if(this.evolution == 1 && soundExplosionBig != null) soundExplosionBig.at(this.x, this.y);
                            else if(soundExplosionNormal != null) soundExplosionNormal.at(this.x, this.y); 
                            Damage.damage(this.team, this.x, this.y, 1700, 176, false, true); 
                        }
                    }
                } else {
                    if(this.shootingTimer > 0){ 
                        this.shootingTimer = 0.0; this.lastRocketTime = 0.0; this.lastExplosionTime = 0.0;
                    }
                }
            },

            write(write){ this.super$write(write); write.b(this.evolution); },
            read(read, revision){ this.super$read(read, revision); this.evolution = read.b(); },

            buildConfiguration(table){
                table.clear(); table.row();
                let ev = this.evolution;

                // --- NÚT TIẾN HÓA (PHONG CÁCH HÀNG DỌC GỌN GÀNG TRONG 1 GUI CỦA LAVUNDER) ---
                if(ev == 0){
                    table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => { 
                        let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Tyber", {}); 
                        
                        let reqCell = dialog.cont.label(packProv(() => {
                            let core = this.team.core();
                            if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                            
                            let currentTitanium = core.items.get(Items.titanium);
                            let currentSilicon = core.items.get(Items.silicon);
                            let currentPlastanium = core.items.get(Items.plastanium);

                            let titColor1 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                            let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";

                            let titColor2 = currentTitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                            let silColor2 = currentSilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                            let plaColor2 = currentPlastanium >= reqMK2B.plastanium ? "[green]" : "[red]";

                            return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" + 
                                   "[cyan]Nhánh MK2:[]\n" +
                                   " • Titan: " + titColor1 + currentTitanium + "[] / " + reqMK2.titanium + "\n" +
                                   " • Silicon: " + silColor1 + currentSilicon + "[] / " + reqMK2.silicon + "\n" +
                                   "[purple]Nhánh MK2B:[]\n" +
                                   " • Titan: " + titColor2 + currentTitanium + "[] / " + reqMK2B.titanium + "\n" +
                                   " • Silicon: " + silColor2 + currentSilicon + "[] / " + reqMK2B.silicon + "\n" +
                                   " • Nhựa: " + plaColor2 + currentPlastanium + "[] / " + reqMK2B.plastanium;
                        }));
                        
                        reqCell.width(360).get().setWrap(true);
                        reqCell.get().setAlignment(Align.left);
                        dialog.cont.row(); dialog.cont.add().height(10).row();

                        let branchesTable = new Table();
                        
                        // Nhánh MK2: Oanh tạc Diện Rộng
                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                        b1.add("[cyan]===(MK2)===[]").row(); 
                        let b1D = b1.add("Cải tiến hệ thống lên 5 nòng xả đạn luân phiên:\n" +
                                 " [white]• Tầm bắn tổng lực gia tăng thêm [green]+50%[] đạt mốc [orange]930 pixel[].[]\n" +
                                 " [white]• Tự động kích hoạt phóng Tên lửa tầm nhiệt hạng nhẹ tầm xa (Tốc độ: 3).[]\n" +
                                 " [white]• Tên lửa va chạm giải phóng bão kích diện rộng lên tới [yellow]300 bán kính[] để quét sạch đám đông.[]\n" +
                                 " [white]• Thời gian sạc xung nổ đại địa tại tâm rút xuống còn [pink]6.0 giây[].[]");
                        b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                        b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => { 
                            let core = this.team.core(); 
                            if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){ 
                                core.items.remove(Items.titanium, reqMK2.titanium); 
                                core.items.remove(Items.silicon, reqMK2.silicon);
                                Fx.upgradeCore.at(this.x, this.y); 
                                this.evolution = 1; dialog.hide(); this.deselect(); 
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho cấu hình MK2![]"); } 
                        })).size(180, 38); 

                        // Nhánh MK2B: Biến thể phòng thủ Bạo Kích Tập Trung
                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                        b2.add("[purple]===(MK2B)===[]").row(); 
                        let b2D = b2.add("Nén loạt bắn thành 1 nòng tâm bạo kích hội tụ:\n" +
                                 " [white]• Tốc độ nạp đạn cốt lõi gia tăng thần tốc, giảm Reload xuống [green]40 tích tắc[] (Bắn nhanh gấp đôi).[]\n" +
                                 " [white]• Khai hỏa đồng thời cặp tên lửa sườn xé gió siêu tốc (Tốc độ: 6) định kỳ mỗi [pink]3.0 giây[].[]\n" +
                                 " [white]• Đòn nổ tập trung nén điểm gây [red]1350 sát thương bạo kích[] trong bán kính hẹp [yellow]30[].[]\n" +
                                 " [white]• Xung nổ hỏa lực tại tâm nạp siêu tốc [pink]3.0 giây/lần[], giải phóng sóng chấn động tỏa hạt đỏ hạt nhân.[]");
                        b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                        b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => { 
                            let core = this.team.core(); 
                            if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && 
                               core.items.get(Items.silicon) >= reqMK2B.silicon && 
                               core.items.get(Items.plastanium) >= reqMK2B.plastanium){ 
                                
                                core.items.remove(Items.titanium, reqMK2B.titanium); 
                                core.items.remove(Items.silicon, reqMK2B.silicon);
                                core.items.remove(Items.plastanium, reqMK2B.plastanium);
                                
                                if (typeof Fx.bigShockwave !== 'undefined') Fx.bigShockwave.at(this.x, this.y); 
                                this.evolution = 2; dialog.hide(); this.deselect(); 
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho cấu hình MK2B![]"); } 
                        })).size(180, 38); 

                        // Xếp các bảng nhánh theo hàng dọc chuẩn Lavunder
                        branchesTable.add(b1).width(340); branchesTable.row(); 
                        branchesTable.add().height(12).row(); 
                        branchesTable.add(b2).width(340);

                        let scroll = new ScrollPane(branchesTable);
                        scroll.setScrollingDisabled(true, false);
                        dialog.cont.add(scroll).maxHeight(400);
                        dialog.addCloseButton(); dialog.show(); 
                    })).size(50, 40).tooltip("Nâng cấp cấu trúc tháp pháo Tyber"); 
                } else {
                    table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                        Vars.ui.showInfo(this.evolution == 1 ? "[cyan]HỆ THỐNG ĐANG HOẠT ĐỘNG Ở CẤU HÌNH TYBER MK2![]" : "[orange]HỆ THỐNG ĐANG HOẠT ĐỘNG Ở CẤU HÌNH TYBER MK2B![]");
                    })).size(50, 40).tooltip("Đã khóa nhánh tiến hóa");
                }

                // --- NÚT THÔNG TIN THÔNG SỐ CHÍNH XÁC (PHONG CÁCH BỐ CỰC ĐẶC TRƯNG CỦA DOR) ---
                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = " Thông số pháo Tyber: ";
                    let descStr = "";

                    if (ev == 0 || ev == 1) {
                        title += (ev == 0) ? "[yellow](MK1)[]" : "[cyan](MK2)[]";
                        descStr = (ev == 0) ? "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" : "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n";
                        descStr += "[lightgray]Máu tháp pháo:[] [green]565 HP[]\n" +
                                  "[lightgray]Tầm bắn hiệu dụng:[] " + (ev == 1 ? "[orange]930 pixel [lime](+50%)[]" : "[orange]620 pixel[]") + "\n" +
                                  "[scarlet]⚠ Giới hạn dòng: Tối đa 1 cấu trúc/Đội trên chiến trường[]\n\n" +
                                  "[sky]⚡ CƠ CHẾ HỎA LỰC CHÍNH:[]\n" +
                                  "• [lightgray]Hệ thống nòng súng:[] " + (ev == 1 ? "Cải tiến [cyan]5 nòng song song[] bắn luân phiên liên tục (Giãn cách: 4)." : "Mặc định gồm [yellow]3 nòng cốt lõi[] xả loạt đạn luân phiên (Giãn cách: 6).") + "\n" +
                                  "• [lightgray]Đạn chính (Titanium):[] Triệu hồi Tên lửa hạng nặng Tyber vọt tầm xa.\n\n" +
                                  "[scarlet]⚠ Giới hạn đặt: Tối đa 1 cấu trúc/đội[]\n\n" +
                                  "[lime]⚡ HỆ THỐNG PHỤ TRỢ TỰ ĐỘNG:[]\n" +
                                  "• [lightgray]Tên lửa định vị phụ (Tốc độ 3):[] Phóng tầm nhiệt sườn định kỳ mỗi " + (ev == 1 ? "[green]4.0 giây[]" : "[yellow]5.0 giây[]") + ". Khi chạm nổ giải phóng phá hủy diện rộng cực đại lên tới [orange]300 bán kính[] (Sát thương nổ: 235).\n" +
                                  "• [lightgray]Xung nổ đại địa:[] Kích nổ lõi nhiệt hạch tại tâm pháo định kỳ mỗi " + (ev == 1 ? "[green]6.0 giây[]" : "[yellow]7.0 giây[]") + ", gây [red]1700 Sát thương diện rộng[] trong phạm vi [lightgray]176 ô[] giúp chống tiếp cận.";
                    } 
                    else if (ev == 2) {
                        title += "[purple](MK2B)[]";
                        descStr = "[purple]⚡ THÔNG SỐ BIẾN THỂ (MK2B) ⚡[]\n" +
                                  "[lightgray]Máu tháp pháo:[] [green]565 HP[]\n" +
                                  "[lightgray]Tầm bắn hiệu dụng:[] [orange]620 pixel[]\n" +
                                  "[scarlet]⚠ Giới hạn dòng: Tối đa 1 cấu trúc/Đội trên chiến trường[]\n\n" +
                                  "[purple]🔥 HỎA LỰC HỘI TỤ SIÊU TRỌNG:[]\n" +
                                  "• [lightgray]Chế độ nòng tâm:[] Gom hỏa lực xả [red]1 viên bạo kích duy nhất[] tập trung, giảm Reload xuống chỉ còn [green]40 tích tắc[] (Tốc độ bắn nhanh gấp đôi).\n\n" +
                                  "[scarlet]⚠ Giới hạn đặt: Tối đa 1 cấu trúc/đội[]\n\n" +
                                  "[lime]⚡ HỆ THỐNG PHỤ TRỢ TỰ ĐỘNG (MK2B):[]\n" +
                                  "• [lightgray]Cặp tên lửa bạo kích phụ (Tốc độ 6):[] Khai hỏa đồng thời [yellow]2 tên lửa phụ dạt góc 12°[] liên tục mỗi [green]3.0 giây[]. Đòn nổ nén điểm tập trung gây [red]1350 sát thương bạo kích[] cực lớn trong phạm vi hẹp [lightgray]30[].\n" +
                                  "• [lightgray]Xung nổ đại địa cấp tốc:[] Tốc độ nạp xung kích tại tâm rút ngắn kỷ lục xuống còn [green]3.0 giây/lần[], giải phóng sóng chấn động tỏa hạt đỏ hạt nhân, gây [red]1700 Sát thương[] diện rộng phạm vi [lightgray]176 ô[].";
                    }

                    let dialog = extend(BaseDialog, title, {});
                    let infoTable = new Table();
                    let cell = infoTable.add(descStr).width(360);
                    cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                    let scroll = new ScrollPane(infoTable);
                    scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400);
                    dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip("Xem chi tiết thông số trạng thái");
            }
        });
    }
});