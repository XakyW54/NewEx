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
                
                table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => { 
                    let dialog = extend(BaseDialog, "Trung Tâm Chuyển Đổi Công Nghệ Tyber", {}); 
                    if(this.evolution == 0){
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
                                   "[cyan]Nhánh MK2:[] Titanium: " + titColor1 + reqMK2.titanium + "[]/" + currentTitanium + " | Silicon: " + silColor1 + reqMK2.silicon + "[]/" + currentSilicon + "\n" +
                                   "[purple]Nhánh MK2B:[] Titanium: " + titColor2 + reqMK2B.titanium + "[]/" + currentTitanium + " | Silicon: " + silColor2 + reqMK2B.silicon + "[]/" + currentSilicon + " | Plastanium: " + plaColor2 + reqMK2B.plastanium + "[]/" + currentPlastanium;
                        })).padBottom(15).row();

                        let branchesTable = new Table();
                        
                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12, 16, 12, 16);
                        b1.add("[cyan]NHÁNH 1: CẤU HÌNH OANH TẠC (MK2)[]").padBottom(4).row(); 
                        b1.add("[lightgray]Cải tiến hệ thống xả đạn luân phiên qua 5 nòng súng.\nTầm bắn tổng lực được cường hóa tăng thêm +50%.[]").padBottom(8).row(); 
                        
                        b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => { 
                            let core = this.team.core(); 
                            if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){ 
                                core.items.remove(Items.titanium, reqMK2.titanium); 
                                core.items.remove(Items.silicon, reqMK2.silicon);
                                Fx.upgradeCore.at(this.x, this.y); 
                                this.evolution = 1; dialog.hide(); this.deselect(); 
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho cấu hình MK2![]"); } 
                        })).size(220, 40); 

                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12, 16, 12, 16);
                        b2.add("[orange]NHÁNH 2: BIẾN THỂ PHÒNG THỦ (MK2B)[]").padBottom(4).row(); 
                        b2.add("[lightgray]Hội tụ loạt bắn nén nòng trung tâm bạo kích siêu nặng.\nXung nổ diện rộng tại tâm: +120% Sát thương, +70% Tầm nổ.[]").padBottom(8).row(); 

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
                        dialog.cont.add(branchesTable);
                    } else {
                        dialog.cont.add(this.evolution == 1 ? "[cyan]HỆ THỐNG ĐANG VẬN HÀNH: TYBER MK2[]" : "[orange]HỆ THỐNG ĐANG VẬN HÀNH: TYBER MK2B[]");
                    }
                    dialog.addCloseButton(); dialog.show(); 
                })).size(50, 40).tooltip("Nâng cấp cấu trúc tháp pháo Tyber"); 

                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = "📊 THÔNG SỐ PHÁO TIẾN HÓA TYBER: ";
                    let descStr = "";
                    let ev = this.evolution;

                    if (ev == 0 || ev == 1) {
                        title += (ev == 0) ? "[lightgray]MK1 TIÊU CHUẨN[]" : "[cyan]MK2 TIẾN HÓA[]";
                        descStr = "[accent]⚙️ CƠ BẢN:[] 565 HP | Tầm bắn: 620\n" +
                                  "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội[]\n\n" +
                                  "• Đạn thường: [lightgray]1350 Sát thương[]\n" +
                                  "[sky]⚡ ĐẶC TÍNH HOẠT ĐỘNG:[]\n" +
                                  "• [orange]Hệ thống nòng súng:[] " + (ev == 1 ? "Nâng cấp [cyan]5 nòng xếp hàng ngang[] luân phiên xả đạn kích cỡ lớn." : "Mặc định sử dụng [yellow]5 nòng súng cốt lõi[] bắn 3 tên lửa.") + "\n" +
                                  "• [cyan]Cơ chế phụ trợ:[] Tự động phóng định kỳ tên lửa tầm xa tầm nhiệt từ trục phụ với [yellow]18%[] sát thương.\n" +
                                  "• [red]⚡ XUNG NỔ ĐẠI ĐỊA:[] Kích nổ lõi năng lượng lớn tại tâm mỗi [yellow]5s[], tạo vùng sát thương hủy diệt [yellow]1700 DMG[] trong phạm vi rộng [lightgray]176 ô[].";
                    } 
                    else if (ev == 2) {
                        title += "[orange]MK2B PHÒNG THỦ BIẾN THỂ[]";
                        descStr = "[accent]⚙️ CƠ BẢN:[] 565 HP | Tầm bắn: 620\n" +
                                  "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội[]\n\n"+
                                  "• Đạn thường: [lightgray]1350 Sát thương[]\n" +
                                  "[orange]🔥 CẤU HÌNH ĐẠN HỘI TỤ:[]\n" +
                                  "• [orange]Chế độ nòng trung tâm:[] từ 3 tên lửa thành 1 bắn ra.\n" +
                                  "• [cyan]Cơ chế phụ trợ:[] Khai hỏa đồng thời cặp 2 tên lửa định hướng từ cả hai phía nòng phụ cánh sườn dạt góc 12° với [yellow]18%[] sát thương.\n" +
                                  "• [red]⚡ XUNG NỔ ĐẠI ĐỊA:[] Kích nổ lõi năng lượng lớn tại tâm mỗi [yellow]3s[], tạo vùng sát thương hủy diệt [yellow]1700 DMG[] trong phạm vi rộng [lightgray]176 ô[].";
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