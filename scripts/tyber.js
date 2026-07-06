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
                this.super$updateTile();


                let count = 0;
                let firstBuild = null;
                
                Groups.build.each(b => {
                    if(b.block == tyberBase && b.team == this.team) { 
                        count++; 
                        if(firstBuild == null) firstBuild = b; 
                    }
                });

                if(count > 10 && this !== firstBuild){
                    Call.sendMessage("[red]Giới hạn: Chỉ được phép đặt tối đa 10 pháo thuộc dòng Tyber System![]");
                    this.kill(); 
                    return; 
                }

                
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
                table.clearChildren(); 
                
                // --- NÚT TIẾN HÓA ---
                if(this.evolution == 0){
                    table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => { 
                        let dialog = extend(BaseDialog, "Trung Tâm Chuyển Đổi Công Nghệ Tyber", {}); 
                        
                        dialog.cont.add("[gold]=== CHỌN NHÁNH TIẾN HÓA LÕI THÁP PHÁO TYBER ===[]").padBottom(15).row(); 

                        dialog.cont.label(packProv(() => {
                            let core = this.team.core();
                            if(core == null) return "[red]Không tìm thấy Kho cốt lõi![]";
                            
                            let currentTitanium = core.items.get(Items.titanium);
                            let currentSilicon = core.items.get(Items.silicon);
                            let currentPlastanium = core.items.get(Items.plastanium);

                            let titColor1 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                            let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";

                            let titColor2 = currentTitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                            let silColor2 = currentSilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                            let plaColor2 = currentPlastanium >= reqMK2B.plastanium ? "[green]" : "[red]";

                            return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" + 
                                   "[cyan]Nhánh MK2:[] Titanium: " + titColor1 + currentTitanium + "[]/" + reqMK2.titanium + " | Silicon: " + silColor1 + currentSilicon + "[]/" + reqMK2.silicon + "\n" +
                                   "[purple]Nhánh MK2B:[] Titanium: " + titColor2 + currentTitanium + "[]/" + reqMK2B.titanium + " | Silicon: " + silColor2 + currentSilicon + "[]/" + reqMK2B.silicon + " | Plastanium: " + plaColor2 + currentPlastanium + "[]/" + reqMK2B.plastanium;
                        })).padBottom(15).row();

                        let branchesTable = new Table();
                        
                        // Nhánh MK2: Oanh tạc Diện Rộng
                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12, 16, 12, 16);
                        b1.add("[cyan]NHÁNH 1: CẤU HÌNH OANH TẠC (MK2)[]").padBottom(4).row(); 
                        
                        let b1D = b1.add("[lightgray]Cải tiến hệ thống lên 5 nòng xả đạn luân phiên. Tầm bắn tổng lực tăng +50%.\n" +
                                 "Khai hỏa bổ sung dòng Tên lửa hành trình tầm nhiệt hạng nhẹ (Tốc độ: 3).\n" +
                                 "Sở hữu [ bão kích diện rộng ] giải phóng chấn động nổ cực đại lên tới [orange]300 bán kính[] để quét sạch công sự đám đông![]");
                        b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                        b1.add().height(8).row();
                        
                        b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => { 
                            let core = this.team.core(); 
                            if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){ 
                                core.items.remove(Items.titanium, reqMK2.titanium); 
                                core.items.remove(Items.silicon, reqMK2.silicon);
                                Fx.upgradeCore.at(this.x, this.y); 
                                this.evolution = 1; dialog.hide(); this.deselect(); 
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho cấu hình MK2![]"); } 
                        })).size(220, 40); 

                        // Nhánh MK2B: Biến thể phòng thủ Bạo Kích Tập Trung
                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12, 16, 12, 16);
                        b2.add("[orange]NHÁNH 2: BIẾN THỂ PHÒNG THỦ (MK2B)[]").padBottom(4).row(); 
                        
                        let b2D = b2.add("[lightgray]Nén loạt bắn thành 1 nòng tâm bạo kích, tốc độ nạp đạn nhanh gấp đôi.\n" +
                                 "Phóng liên tục cặp tên lửa sườn xé gió siêu tốc (Tốc độ: 6).\n" +
                                 "Tích hợp lõi hủy diệt nén điểm, gây [ ngập tràn sát thương ] lên tới [red]1350 bạo kích[] tại tầm gần (Bán kính: 30)![]");
                        b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                        b2.add().height(8).row();

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
                        })).size(220, 40); 

                        branchesTable.add(b1).width(340); branchesTable.row(); 
                        branchesTable.add().height(15).row(); 
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

                // --- NÚT THÔNG TIN THÔNG SỐ CHÍNH XÁC ---
                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = "📊 THÔNG SỐ PHÁO TIẾN HÓA TYBER: ";
                    let descStr = "";
                    let ev = this.evolution;

                    if (ev == 0 || ev == 1) {
                        title += (ev == 0) ? "[lightgray]MK1 TIÊU CHUẨN[]" : "[cyan]MK2 TIẾN HÓA[]";
                        descStr = "[accent]⚙️ THÔNG SỐ TRẠNG THÁI:[]\n" +
                                  "• [heart] Máu pháo:[] 565 HP | [aim] Tầm bắn:[] " + (ev == 1 ? "[green]930 pixel[] (+50%)" : "[white]620 pixel[]") + "\n" +
                                  "[scarlet]⚠ GIỚI HẠN DÒNG: Tối đa 10 cấu trúc/Đội trên chiến trường[]\n\n" +
                                  "[sky]⚡ CƠ CHẾ HỎA LỰC CHÍNH:[]\n" +
                                  "• [orange]Hệ thống nòng:[] " + (ev == 1 ? "Cải tiến [cyan]5 nòng súng song song[] bắn luân phiên liên tục (Giãn cách: 4)." : "Mặc định gồm [yellow]3 nòng súng cốt lõi[] xả loạt đạn luân phiên (Giãn cách: 6).") + "\n" +
                                  "• [lightgray]Đạn chính (Titanium):[] Triệu hồi Tên lửa hạng nặng Tyber vọt tầm xa.\n\n" +
                                  "[lime]⚡ HỆ THỐNG PHỤ TRỢ TỰ ĐỘNG:[]\n" +
                                  "• [orange]Tên lửa định vị phụ (Tốc độ 3):[] Tự động kích hoạt phóng tầm nhiệt từ bệ sườn mỗi " + (ev == 1 ? "[green]4.0 giây[]" : "[white]5.0 giây[]") + " khi chiến đấu. Khi va chạm giải phóng sát thương vùng diện rộng cực đại lên tới [orange]300 bán kính[] (Sát thương nổ: 235).\n" +
                                  "• [red]⚡ XUNG NỔ ĐẠI ĐỊA:[] Định kỳ mỗi " + (ev == 1 ? "[green]6.0 giây[]" : "[white]7.0 giây[]") + " liên tục kích nổ lõi nhiệt hạch ngay tại tâm pháo, gây [yellow]1700 Sát thương[] diện rộng trong bán kính [lightgray]176 ô[] (Chặn đứng kẻ địch cận chiến).";
                    } 
                    else if (ev == 2) {
                        title += "[orange]MK2B BIẾN THỂ PHÒNG THỦ[]";
                        descStr = "[accent]⚙️ THÔNG SỐ TRẠNG THÁI:[]\n" +
                                  "• [heart] Máu pháo:[] 565 HP | [aim] Tầm bắn:[] [white]620 pixel[]\n" +
                                  "[scarlet]⚠ GIỚI HẠN DÒNG: Tối đa 10 cấu trúc/Đội trên chiến trường[]\n\n" +
                                  "[purple]🔥 HỎA LỰC HỘI TỤ SIÊU TRỌNG:[]\n" +
                                  "• [orange]Chế độ nòng trung tâm:[] Gom hỏa lực xả [red]1 viên bạo kích duy nhất[] tập trung, giảm Reload xuống còn [green]40 Tích tắc[] (Bắn nhanh gấp đôi).\n\n" +
                                  "[lime]⚡ HỆ THỐNG PHỤ TRỢ TỰ ĐỘNG (MK2B):[]\n" +
                                  "• [orange]Cặp tên lửa bạo kích siêu tốc (Tốc độ 6):[] Khai hỏa đồng thời [yellow]2 tên lửa phụ dạt góc 12°[] liên tục mỗi [green]3.0 giây[]. Đòn nổ tập trung nén điểm gây [red]1350 Sát thương bạo kích[] cực lớn trong bán kính hẹp [lightgray]30[].\n" +
                                  "• [red]⚡ XUNG NỔ ĐẠI ĐỊA CẤP TỐC:[] Tốc độ nạp xung kích tại tâm rút ngắn kỷ lục xuống còn [red]3.0 giây/lần[], giải phóng sóng chấn động tỏa hạt đỏ, gây [yellow]1700 Sát thương[] phá hủy vòng trong phạm vi [lightgray]176 ô[].";
                    }

                    let dialog = extend(BaseDialog, title, {});
                    let cell = dialog.cont.add(descStr).width(380);
                    cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                    dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip("Xem chi tiết thông số trạng thái");
            }
        });
    }
});