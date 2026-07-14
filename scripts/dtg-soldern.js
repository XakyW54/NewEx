
function dashCircle(x, y, radius, color) {
    Draw.color(color);
    let segments = 48;
    for (let i = 0; i < segments; i += 2) {
        let a1 = i / segments * 360;
        let a2 = (i + 1) / segments * 360;
        Lines.line(x + Angles.trnsx(a1, radius), y + Angles.trnsy(a1, radius), 
                   x + Angles.trnsx(a2, radius), y + Angles.trnsy(a2, radius));
    }
    Draw.reset();
}

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });


const reqMK2 = {
    titanium: 4000,
    silicon: 4000,
    plastanium: 0
};

const reqMK2B = {
    titanium: 8800,
    silicon: 6400,
    plastanium: 4200
};

const maxShieldRadius = 48;    
const shieldAngleWidth = 120;  
const zoomSpeed = 0.08;        
const REGEN_COOLDOWN = 60 * 10; 
const hexSize = 5;             

const shieldHealthMK1 = 5000;
const shieldHealthMK2 = 6500;
const shieldHealthMK3 = 12000;

const turretHealthMK1 = 2200;
const turretHealthMK2 = 2860;
const turretHealthMK3 = 4400;

function getMaxShieldHealth(tier) {
    if (tier == 1) return shieldHealthMK2;
    if (tier == 2) return shieldHealthMK3;
    return shieldHealthMK1;
}

function getMaxTurretHealth(tier) {
    if (tier == 1) return turretHealthMK2;
    if (tier == 2) return turretHealthMK3;
    return turretHealthMK1;
}

function getDynamicRange(tier) {
    if (tier == 1) return 468; 
    if (tier == 2) return 252; 
    return 360;
}

function getAngleDiff(angle1, angle2) {
    let diff = (angle1 - angle2 + 180) % 360 - 180;
    if (diff < -180) diff += 360;
    return Math.abs(diff);
}


const dtgSoldernNormalBullet = extend(BasicBulletType, {
    speed: 7,
    damage: 63,
    width: 9,
    height: 22,
    lifetime: 52, 
    frontColor: Color.valueOf("#e0f7fa"),
    backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"),
    trailWidth: 1.8,
    trailLength: 6,
    hitEffect: Fx.hitBulletColor,
    despawnEffect: Fx.hitBulletColor
});

const dtgSoldernSmallSprayBullet = extend(BasicBulletType, {
    sprite: "bullet",
    speed: 8.5,
    damage: 21,
    width: 3.5,
    height: 9,
    lifetime: 12,
    frontColor: Color.valueOf("#e0f7fa"),
    backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"),
    trailWidth: 0.75,
    trailLength: 3,
    hitEffect: Fx.hitBulletColor,
    despawnEffect: Fx.hitBulletColor
});

const dtgSoldernmk2NormalBullet = extend(BasicBulletType, {
    speed: 10.4,
    damage: 56,
    width: 9.5,
    height: 24,
    lifetime: 45,      
    frontColor: Color.valueOf("#e0f7fa"),
    backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"),
    trailWidth: 2.0,
    trailLength: 7,    
    hitEffect: Fx.hitBulletColor,
    despawnEffect: Fx.hitBulletColor
});

const dtgSoldernmk2SmallSprayBullet = extend(BasicBulletType, {
    sprite: "bullet",
    speed: 9.0,
    damage: 30.6,
    width: 3.85,
    height: 10,
    lifetime: 12, 
    frontColor: Color.valueOf("#e0f7fa"),
    backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"),
    trailWidth: 0.82,
    trailLength: 4,
    hitEffect: Fx.hitBulletColor,
    despawnEffect: Fx.hitBulletColor
});

const dtgSoldernmk2bSmallSprayBullet = extend(BasicBulletType, {
    sprite: "bullet",
    speed: 8.5,
    damage: 23,
    width: 3.5,
    height: 9,
    lifetime: 14,
    frontColor: Color.valueOf("#ff8a80"),
    backColor: Color.valueOf("#ff1744"),
    trailColor: Color.valueOf("#ff5252"),
    trailWidth: 0.8,
    trailLength: 3,
    hitEffect: Fx.hitBulletColor,
    despawnEffect: Fx.hitBulletColor
});

const spraySpreadB = extend(BasicBulletType, {
    sprite: "bullet",
    speed: 11.0,
    damage: 23,
    width: 4.0,
    height: 12,
    lifetime: 20,
    frontColor: Color.valueOf("#ff5252"),
    backColor: Color.valueOf("#b71c1c"),
    trailColor: Color.valueOf("#ff1744"),
    trailWidth: 1.0,
    trailLength: 5,
    hitEffect: Fx.hitBulletColor,
    despawnEffect: Fx.hitBulletColor
});

const laserBulletB = extend(LaserBulletType, {
    length: 252,
    damage: 122,
    width: 24,
    lifetime: 25, 
    colors: [Color.valueOf("#ff1744"), Color.valueOf("#b71c1c"), Color.white],
    hitEffect: Fx.hitLaserColor,
    smokeEffect: Fx.smoke
});


const dtgSoldernTurret = extend(ItemTurret, "dtg-soldern", {
    squareSprite: false,

    drawPlace(x, y, rotation, valid){
        this.super$drawPlace(x, y, rotation, valid);
        Draw.color(Pal.remove);
        Lines.stroke(1.5);
        dashCircle(x * Vars.tilesize, y * Vars.tilesize, 100, Pal.remove);
        dashCircle(x * Vars.tilesize, y * Vars.tilesize, 145, Pal.remove);
        Draw.reset();        
    }
});

dtgSoldernTurret.health = turretHealthMK1; 
dtgSoldernTurret.size = 3;
dtgSoldernTurret.reload = 40; 
dtgSoldernTurret.configurable = true;
dtgSoldernTurret.category = Category.turret;
dtgSoldernTurret.ammo(Items.silicon, dtgSoldernNormalBullet); 

dtgSoldernTurret.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));


dtgSoldernTurret.buildType = () => extend(ItemTurret.ItemTurretBuild, dtgSoldernTurret, {
    dtgSoldernInternalTier: 0, 
    limitCheck: 0,
    wasInShotgunRange: false,
    canInstantRegenShield: true, 

    mainWeaponVisual: 0.0, 
    subWeaponVisual: 0.0,  

    sideRecoil: 0.0,
    shotgunBarrelRecoil: 0.0, 
    mainWeaponRecoil: 0.0,    

    shotgunMagTimer: 0,       
    firedMagazines: 0,        
    shotgunReloadTimer: 0,    

    shieldHealth: shieldHealthMK1, 
    shieldHitTime: 0,              
    shieldScale: 0,                
    regenTimer: REGEN_COOLDOWN,    

    energyBallCharge: 0.0,
    particleTimer: 0.0,
    hadEnergyBall: false,

    range() {
        return getDynamicRange(this.getTier());
    },

    setTier(val) { 
        this.dtgSoldernInternalTier = val; 
        this.maxHealth = getMaxTurretHealth(val);
        this.health = this.maxHealth;
    },
    getTier() { return this.dtgSoldernInternalTier !== undefined ? this.dtgSoldernInternalTier : 0; },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        // --- NÚT TIẾN HÓA (PHONG CÁCH HÀNG DỌC GỌN GÀNG CỦA LAVUNDER) ---
        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo DTG Soldern", {});
                
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

                // Khối Nhánh 1: Cấu hình Tiêu chuẩn MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("Cải tiến năng lực hỏa lực và năng lượng xung kích:\n" +
                                 " [white]• Kết cấu HP pháo tăng mạnh lên [green]2860 HP[] (+30%).[]\n" + 
                                 " [white]• Lõi khiên mở rộng, gia tăng độ bền màng chắn lên [cyan]6500[].[]\n" +
                                 " [white]• Tầm bắn tầm xa mở rộng vượt trội đạt [green]468 pixel[] (+30%).[]\n" +
                                 " [white]• Đạn tầm xa nâng cấp lên dạng MK2 (Vận tốc: 10.4, Sát thương: 56).[]\n" +
                                 " [white]• Cận chiến: Giữ nguyên cự ly áp sát 100, cường hóa đạn rải lên [yellow]30.6[].[]\n" +
                                 " [white]• Cơ chế đặc biệt: Cho phép sạc đầy lại màng khiên tức thời khi mục tiêu lọt vào tầm gần lần đầu.[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                // Khối Nhánh 2: Biến thể Trọng lực Laser MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("Chuyển đổi toàn diện sang dạng Trọng Pháo Laser bạo nén:\n" +
                                 " [white]• Kết cấu khung vững chắc nâng HP pháo lên mức siêu cấp [green]4400 HP[] (+100%).[]\n" +
                                 " [white]• Lõi nén lá chắn hấp thụ đạt mốc tối đa [cyan]12000[] độ bền.[]\n" +
                                 " [white]• Tầm bắn tầm xa thu hẹp còn [red]252 pixel[], bù lại chuyển sang dạng [orange]Chùm tia Laser xuyên phá[] tầm trung cực đại [red]122 sát thương[].[]\n" +
                                 " [white]• Cận chiến: Tầm quét kích hoạt shotgun mở rộng lên [yellow]145 pixel[].[]\n" +
                                 " [white]• Giải phóng hỏa lực shotgun hỗn hợp: Phóng đồng thời [scarlet]14 đạn rải đỏ[] kèm [orange]6 tia đạn tỏa diện rộng[] quét sạch vật cản xung quanh.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                        core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                // Sắp xếp các bảng theo hàng dọc chuẩn cấu trúc
                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Tiến hóa tháp pháo DTG Soldern");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo(this.getTier() == 1 ? "[cyan]HỆ THỐNG ĐANG HOẠT ĐỘNG Ở CẤU HÌNH TIÊU CHUẨN MK2![]" : "[purple]HỆ THỐNG ĐANG HOẠT ĐỘNG Ở BIẾN THỂ TRỌNG LỰC LASER MK2B![]");
            })).size(50, 40).tooltip("Hệ thống đã khóa nhánh tiến hóa");
        }

        // --- NÚT THÔNG TIN THÔNG SỐ CHÍNH XÁC (PHONG CÁCH BỐ CỰC ĐẶC TRƯNG CỦA DOR) ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo DTG Soldern: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "• [lightgray]Máu tháp pháo:[] [green]2200 HP[]\n" +
                          "• [lightgray]Độ bền lá chắn:[] [cyan]" + shieldHealthMK1 + "[]\n" +
                          "• [lightgray]Tầm bắn hiệu dụng:[] [orange]" + this.range() + " pixel[]\n" +
                          "• [lightgray]Sát thương tầm xa:[] [yellow]63.0[] (Tốc độ đạn: 7)\n" +
                          "[scarlet]⚠ Giới hạn dòng: Tối đa 10 cấu trúc/Đội trên chiến trường[]\n\n" +
                          "[sky]⚡ CƠ CHẾ ĐA DỤNG:[]\n" +
                          "• [lightgray]Màng chắn năng lượng:[] Tự động bung góc chặn 120° theo hướng nòng súng khi bắn để triệt tiêu đạn địch.\n" +
                          "• [lightgray]Chế độ Cận chiến (Shotgun):[] Kích hoạt vuốt máy khi mục tiêu lọt vào cự ly [yellow]100 pixel[]. Xả loạt 14 đạn rải (Sát thương: 21) liên thanh liên tục trong 10 băng đạn.";
            } 
            else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CẤU HÌNH NÂNG CẤP (MK2) ⚡[]\n" +
                          "• [lightgray]Máu tháp pháo:[] [green]2860 HP [yellow](+30%)[]\n" +
                          "• [lightgray]Độ bền lá chắn:[] [cyan]" + shieldHealthMK2 + "[]\n" +
                          "• [lightgray]Tầm bắn hiệu dụng:[] [orange]" + this.range() + " pixel [yellow](+30%)[]\n" +
                          "• [lightgray]Sát thương tầm xa:[] [yellow]56.0[] (Gia tốc đạn tăng vọt: 10.4)\n" +
                          "[scarlet]⚠ Giới hạn dòng: Tối đa 10 cấu trúc/Đội trên chiến trường[]\n\n" +
                          "[lime]⚡ CƠ CHẾ ĐA DỤNG BỔ SUNG:[]\n" +
                          "• [lightgray]Nạp khiên tức thời:[] Khiên tự động sạc đầy lại hoàn toàn khi kẻ địch lần đầu tiên bước vào vùng cận chiến.\n" +
                          "• [lightgray]Hỏa lực shotgun cải tiến:[] Tăng mạnh sát thương mỗi viên đạn rải trong loạt tỏa cận chiến lên [yellow]30.6[].";
            } 
            else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ BIẾN THỂ TRỌNG LỰC (MK2B) ⚡[]\n" +
                          "• [lightgray]Máu tháp pháo:[] [green]4400 HP [yellow](+100%)[]\n" +
                          "• [lightgray]Độ bền lá chắn:[] [cyan]" + shieldHealthMK3 + "[]\n" +
                          "• [lightgray]Tầm bắn hiệu dụng:[] [orange]" + this.range() + " pixel [coral](Thu hẹp)[]\n" +
                          "• [lightgray]Chế độ tầm xa:[] Chuyển hẳn thành [orange]Laser hủy diệt[] nén điểm gây [red]122 sát thương[] trực diện.\n" +
                          "[scarlet]⚠ Giới hạn dòng: Tối đa 10 cấu trúc/Đội trên chiến trường[]\n\n" +
                          "[purple]🔥 SỨC MẠNH ÁP SÁT TỐI THƯỢNG:[]\n" +
                          "• [lightgray]Mở rộng tầm Shotgun:[] Ngưỡng kích hoạt tăng lên [yellow]145 pixel[].\n" +
                          "• [lightgray]Hỏa lực hỗn hợp:[] Khai hỏa đồng loạt tổ hợp bạo kích gồm [scarlet]14 đạn rải đỏ[] (Sát thương: 23) đan xen [sharp]6 tia đạn tỏa chéo dạt góc 12°[] (Sát thương: 23) để xóa sổ quân địch trong tích tắc.";
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
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
        let tier = this.getTier();
        
        this.super$updateTile();

        this.limitCheck += Time.delta;
        if(this.limitCheck >= 15){
            this.limitCheck = 0;
            let count = 0;
            let firstBuild = null;
            Groups.build.each(b => {
                if(b.block == dtgSoldernTurret && b.team == this.team) {
                    count++;
                    if(firstBuild == null) firstBuild = b;
                }
            });
            if(count > 10 && this !== firstBuild){
                Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 10 tháp pháo DTG Soldern! Cấu trúc thừa đã tự hủy![]");
                this.kill();
                return;
            }
        }

        let currentMaxShield = getMaxShieldHealth(tier);
        let targetInShotgunRange = false;
        let activationThreshold = (tier == 2) ? 145 : 100;

        if(this.target != null){
            let distance = Mathf.dst(this.x, this.y, this.target.x, this.target.y);
            if(distance < activationThreshold){
                targetInShotgunRange = true;
            }
        }

        let visualSpeed = 0.05 * Time.delta;
        if (targetInShotgunRange) {
            this.subWeaponVisual = Mathf.approach(this.subWeaponVisual, 1.0, visualSpeed);
            this.mainWeaponVisual = Mathf.approach(this.mainWeaponVisual, 0.0, visualSpeed);
        } else {
            this.subWeaponVisual = Mathf.approach(this.subWeaponVisual, 0.0, visualSpeed);
            this.mainWeaponVisual = Mathf.approach(this.mainWeaponVisual, 1.0, visualSpeed);
        }

        this.sideRecoil = Mathf.approach(this.sideRecoil, 0.0, 0.08 * Time.delta);
        this.shotgunBarrelRecoil = Mathf.approach(this.shotgunBarrelRecoil, 0.0, 0.12 * Time.delta);
        this.mainWeaponRecoil = Mathf.approach(this.mainWeaponRecoil, 0.0, 0.12 * Time.delta);

        let rad = this.rotation * Mathf.degRad;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);
        let muzzleDist = 13.0;
        let muzzleX = this.x + cos * muzzleDist;
        let muzzleY = this.y + sin * muzzleDist;

        let ballX = this.x - cos * 12;
        let ballY = this.y - sin * 12;
        let ballColor = (tier == 2) ? Color.valueOf("#ff1744") : Color.valueOf("#00bcd4");

        if (this.subWeaponVisual >= 0.95) {
            this.energyBallCharge = Mathf.approach(this.energyBallCharge, 1.0, 0.05 * Time.delta);
            this.hadEnergyBall = true;
            this.particleTimer += Time.delta;

            if (this.shotgunReloadTimer > 0) {
                if (this.particleTimer >= 7) {
                    this.particleTimer = 0;
                    Fx.lightningCharge.at(ballX + Mathf.range(5), ballY + Mathf.range(5), this.rotation, ballColor);
                    if(Mathf.chance(0.4)) {
                        Fx.smoke.at(ballX, ballY, this.rotation, ballColor);
                    }
                }
            } else {
                if (this.particleTimer >= 30) {
                    this.particleTimer = 0;
                    Fx.lightningCharge.at(ballX, ballY, this.rotation, ballColor);
                }
            }
        } else {
            if (this.hadEnergyBall && this.subWeaponVisual < 0.2) {
                this.energyBallCharge = 0.0;
                this.hadEnergyBall = false;
                Fx.shieldBreak.at(ballX, ballY, this.rotation, ballColor);
            } else {
                this.energyBallCharge = Mathf.approach(this.energyBallCharge, 0.0, 0.08 * Time.delta);
            }
        }

        if(targetInShotgunRange && !this.wasInShotgunRange){
            if(tier == 1 && this.canInstantRegenShield && this.shieldHealth > 0){
                this.shieldHealth = currentMaxShield;
                this.canInstantRegenShield = false;
                Fx.shieldBreak.at(this.x, this.y);
            }
        }
        this.wasInShotgunRange = targetInShotgunRange;

        if(targetInShotgunRange && this.isShooting && this.hasAmmo()){
            if(this.shotgunReloadTimer > 0){
                this.shotgunReloadTimer -= Time.delta;
            } else {
                this.shotgunMagTimer += Time.delta;
                if(this.shotgunMagTimer >= 12){
                    this.shotgunMagTimer = 0;
                    this.shotgunBarrelRecoil = 1.0;

                    if(tier == 2) {
                        for(let i = 0; i < 14; i++){
                            let angleOffset = Mathf.range(15);
                            let b = dtgSoldernmk2bSmallSprayBullet.create(this, this.team, muzzleX, muzzleY, this.rotation + angleOffset);
                            if(b != null) b.vel.setLength(Mathf.random(5.0, 12.0));
                        }
                        for(let j = 0; j < 6; j++){
                            let angleOffset = (j - 2.5) * 8;
                            spraySpreadB.create(this, this.team, muzzleX, muzzleY, this.rotation + angleOffset);
                        }
                    } else {
                        let baseBulletType = (tier == 1) ? dtgSoldernmk2SmallSprayBullet : dtgSoldernSmallSprayBullet;
                        for(let i = 0; i < 14; i++){
                            let angleOffset = Mathf.range(15);
                            let b = baseBulletType.create(this, this.team, muzzleX, muzzleY, this.rotation + angleOffset);
                            if(b != null) b.vel.setLength(Mathf.random(5.0, 12.0));
                        }
                    }
                    
                    Fx.shootBig.at(muzzleX, muzzleY, this.rotation);
                    this.useAmmo();
                    this.firedMagazines++;
                    if(this.firedMagazines >= 10){
                        this.shotgunReloadTimer = 180;
                        this.firedMagazines = 0;
                    }
                }
            }
        } else {
            if(this.shotgunReloadTimer > 0) this.shotgunReloadTimer -= Time.delta;
        }

        if(targetInShotgunRange){
            this.reloadCounter = 0; 
        } else {
            if(tier == 2){
                this.block.reload = 60;
            } else {
                this.block.reload = 40;
            }
        }

        if (this.shieldHealth < currentMaxShield) {
            this.regenTimer += Time.delta;
            if (this.regenTimer >= REGEN_COOLDOWN) {
                this.shieldHealth = currentMaxShield;
                this.regenTimer = REGEN_COOLDOWN;
                if(tier == 1) this.canInstantRegenShield = true;
                Fx.shieldBreak.at(this.x, this.y);
            }
        }

        if(this.isShooting && this.shieldHealth > 0){
            this.shieldScale = Math.min(1.0, this.shieldScale + zoomSpeed * Time.delta);
        } else {
            this.shieldScale = Math.max(0.0, this.shieldScale - zoomSpeed * Time.delta);
        }

        let currentRadius = maxShieldRadius * this.shieldScale;

        if(this.shieldHealth > 0 && this.shieldScale > 0.2){
            Groups.bullet.each(b => {
                if(b.team != this.team && b.type != null && b.type.damage > 0){
                    let dst = Mathf.dst(this.x, this.y, b.x, b.y);
                    if(dst >= (currentRadius - 12) && dst <= (currentRadius + 8)){
                        let angleToBullet = Mathf.angle(b.x - this.x, b.y - this.y);
                        let angleDiff = getAngleDiff(this.rotation, angleToBullet);
                        if(angleDiff <= (shieldAngleWidth / 2)){
                            this.shieldHealth = Math.max(0, this.shieldHealth - b.damage);
                            this.shieldHitTime = 5;
                            this.regenTimer = 0;
                            if(this.shieldHealth <= 0){
                                Fx.shieldBreak.at(this.x, this.y);
                            } else {
                                Fx.hitBulletColor.at(b.x, b.y, this.rotation, Color.valueOf("ff9d00"));
                            }
                            b.remove();
                        }
                    }
                }
            });
        }
        if(this.shieldHitTime > 0) this.shieldHitTime -= Time.delta;
    },

    shoot(type){
        let tier = this.getTier();
        let activationThreshold = (tier == 2) ? 145 : 100;

        if(this.target != null){
            let distance = Mathf.dst(this.x, this.y, this.target.x, this.target.y);
            if(distance < activationThreshold){
                return; 
            }
        }

        this.sideRecoil = 1.0;
        this.mainWeaponRecoil = 1.0;

        let rad = this.rotation * Mathf.degRad;
        let muzzleDist = 13.0;
        let muzzleX = this.x + Math.cos(rad) * muzzleDist;
        let muzzleY = this.y + Math.sin(rad) * muzzleDist;

        if(tier == 2){
            laserBulletB.create(this, this.team, muzzleX, muzzleY, this.rotation);
            Fx.lightningCharge.at(muzzleX, muzzleY);
        } else {
            let activeNormalBullet = (tier == 1) ? dtgSoldernmk2NormalBullet : dtgSoldernNormalBullet;
            activeNormalBullet.create(this, this.team, muzzleX, muzzleY, this.rotation);
        }
        
        Fx.shootBig.at(muzzleX, muzzleY, this.rotation);
    },

    write(write){
        this.super$write(write); write.b(this.getTier()); 
    },
    read(read, revision){
        this.super$read(read, revision); 
        this.setTier(read.b()); 
        this.shotgunMagTimer = 0; this.firedMagazines = 0; this.shotgunReloadTimer = 0;
        this.shieldHealth = getMaxShieldHealth(this.getTier()); 
        this.shieldScale = 0; this.regenTimer = REGEN_COOLDOWN;
        this.wasInShotgunRange = false;
        this.canInstantRegenShield = true;
        this.mainWeaponVisual = 0.0; this.subWeaponVisual = 0.0;
        this.sideRecoil = 0.0; this.shotgunBarrelRecoil = 0.0; this.mainWeaponRecoil = 0.0;
        this.energyBallCharge = 0.0; this.particleTimer = 0.0; this.hadEnergyBall = false;
    },

    drawSelect(){ 
        this.super$drawSelect(); 
        let currentThreshold = (this.getTier() == 2) ? 145 : 100;
        dashCircle(this.x, this.y, currentThreshold, Pal.remove); 
    },

    draw(){
        let modName = this.block.name.split("-")[0]; 

        let baseRegion = Core.atlas.find(this.block.basePrefix + "block-" + this.block.size);
        if(baseRegion.found()){
            Draw.rect(baseRegion, this.x, this.y);
        } else {
            this.super$draw(); 
        }

        let rad = this.rotation * Mathf.degRad;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);

        let maxSideRecoilDistance = -4.0;   
        let maxBarrelRecoilDistance = -4.5; 

        if(this.block.region.found()){
            Draw.rect(this.block.region, this.x, this.y, this.rotation);
        }

        let bodyRegion = Core.atlas.find(modName + "-dtg-soldern-body");
        if(bodyRegion.found()){
            Draw.rect(bodyRegion, this.x, this.y, this.rotation);
        }

        let spreadX = this.subWeaponVisual * 5.0; 
        let subLeftRegion = Core.atlas.find(modName + "-dtg-soldern-sub-left");
        let subRightRegion = Core.atlas.find(modName + "-dtg-soldern-sub-right");
        
        if (subLeftRegion.found() && subRightRegion.found()) {
            let lx = this.x - spreadX * sin;
            let ly = this.y + spreadX * cos;
            Draw.rect(subLeftRegion, lx, ly, this.rotation);

            let rx = this.x + spreadX * sin;
            let ry = this.y - spreadX * cos;
            Draw.rect(subRightRegion, rx, ry, this.rotation);
        } else {
            let subFallback = Core.atlas.find(modName + "-dtg-soldern-sub");
            if (subFallback.found()) Draw.rect(subFallback, this.x, this.y, this.rotation);
        }

        let pushY = this.mainWeaponVisual * 4.5; 
        let mainRegion = Core.atlas.find(modName + "-dtg-soldern-main");
        if (mainRegion.found()) {
            let mx = this.x + pushY * cos;
            let my = this.y + pushY * sin;
            Draw.rect(mainRegion, mx, my, this.rotation);
        }

        let barrelOffset = this.shotgunBarrelRecoil * maxBarrelRecoilDistance;
        let barrelRegion = Core.atlas.find(modName + "-dtg-soldern-barrel");
        if (barrelRegion.found()) {
            let bx = this.x + barrelOffset * cos;
            let by = this.y + barrelOffset * sin;
            Draw.rect(barrelRegion, bx, by, this.rotation);
        }

        let b1Offset = this.mainWeaponRecoil * maxBarrelRecoilDistance;
        let barrel1aRegion = Core.atlas.find(modName + "-dtg-soldern-b1");
        if (barrel1aRegion.found()) {
            let b1ax = this.x + b1Offset * cos;
            let b1ay = this.y + b1Offset * sin;
            Draw.rect(barrel1aRegion, b1ax, b1ay, this.rotation);
        }

        let clawRecoilOffset = this.sideRecoil * maxSideRecoilDistance;
        let clawSideMove = this.subWeaponVisual * 2.0; 
        
        let clawForwardMove = 0.0;
        let t = this.subWeaponVisual;

        if (t > 0.0) {
            if (t <= 0.5) {
                clawForwardMove = (t / 0.5) * 4.5;
            } else {
                let factor = (t - 0.5) / 0.5; 
                clawForwardMove = 4.5 - (factor * 8.5); 
            }
        }

        Draw.z(Layer.turret + 0.01);

        let clawR1 = Core.atlas.find(modName + "-dtg-soldern-claw-r1");
        let clawR2 = Core.atlas.find(modName + "-dtg-soldern-claw-r2");

        if(clawR1.found()){
            let cx = this.x + ((clawRecoilOffset + clawForwardMove) * cos) - (clawSideMove * sin);
            let cy = this.y + ((clawRecoilOffset + clawForwardMove) * sin) + (clawSideMove * cos);
            Draw.rect(clawR1, cx, cy, this.rotation);
        }

        if(clawR2.found()){
            let cx = this.x + ((clawRecoilOffset + clawForwardMove) * cos) + (clawSideMove * sin);
            let cy = this.y + ((clawRecoilOffset + clawForwardMove) * sin) - (clawSideMove * cos);
            Draw.rect(clawR2, cx, cy, this.rotation);
        }

        Draw.z(Layer.turret);

        let topRegion = Core.atlas.find(modName + "-dtg-soldern-top");
        if (topRegion.found()) {
            Draw.rect(topRegion, this.x, this.y, this.rotation);
        }

        if (this.energyBallCharge > 0.01) {
            Draw.z(Layer.turret + 0.05); 
            let ballX = this.x - cos * 12;
            let ballY = this.y - sin * 12;
            let ballColor = (this.getTier() == 2) ? Color.valueOf("#ff1744") : Color.valueOf("#00bcd4");
            
            let chargePulse = 0.0;
            if (this.shotgunReloadTimer > 0) {
                chargePulse = Math.abs(Math.sin(Time.time * 0.3)) * 0.5 * (this.shotgunReloadTimer / 180.0);
            }
            
            let currentBallRadius = (3.2 + chargePulse + Mathf.range(0.2)) * this.energyBallCharge;
            
            Draw.color(ballColor, (0.35 + (this.shotgunReloadTimer > 0 ? 0.25 : 0.0)) * this.energyBallCharge);
            Fill.circle(ballX, ballY, currentBallRadius * 1.7);
            
            Draw.color(Color.white, 0.9 * this.energyBallCharge);
            Fill.circle(ballX, ballY, currentBallRadius);
            
            Draw.reset();
        }

        let input = (typeof Vars !== 'undefined' && Vars.control) ? Vars.control.input : null;
        if (input != null && input.selected == this) {
            let currentThreshold = (this.getTier() == 2) ? 145 : 100;
            dashCircle(this.x, this.y, currentThreshold, Pal.remove); 
        }

        let currentMaxShield = getMaxShieldHealth(this.getTier());

        if(this.shieldHealth > 0 && this.shieldScale > 0.05){
            Draw.z(Layer.effect + 5); 
            let glitchAmount = this.shieldHitTime > 0 ? Mathf.range(1.2) : Mathf.range(0.3);
            let currentRadius = (maxShieldRadius + glitchAmount) * this.shieldScale;
            let baseColor = (this.getTier() == 2) ? Color.valueOf("ff1744") : Color.valueOf("ff9d00");
            let alpha = (0.28 + (this.shieldHealth / currentMaxShield) * 0.42) * this.shieldScale;

            if(this.shieldHitTime > 0 && Mathf.chance(0.3)){ Draw.color(Color.white); } else { Draw.color(baseColor, alpha); }
            Lines.stroke(1.0 * this.shieldScale); 

            let hSpacing = hexSize * 1.5;
            let vSpacing = hexSize * Math.sqrt(3);
            
            for(let xOffset = -currentRadius; xOffset <= currentRadius; xOffset += hSpacing){
                for(let yOffset = -currentRadius; yOffset <= currentRadius; yOffset += vSpacing){
                    let col = Math.floor((xOffset + currentRadius) / hSpacing);
                    let finalYOffset = yOffset + ((col % 2 == 0) ? 0 : vSpacing / 2);
                    let cellGlitchX = (this.shieldHitTime > 0 || Mathf.chance(0.02)) ? Mathf.range(0.4) : 0;
                    let checkX = this.x + xOffset + cellGlitchX;
                    let checkY = this.y + finalYOffset; 
                    
                    let dst = Mathf.dst(this.x, this.y, checkX, checkY);
                    
                    if(dst < currentRadius && dst > 14){ 
                        let angle = Mathf.angle(checkX - this.x, checkY - this.y);
                        let diff = getAngleDiff(this.rotation, angle);
                        if(diff <= (shieldAngleWidth / 2)){
                            let edgeFade = Math.min(1.0, (currentRadius - dst) / 6);
                            let cellAlpha = alpha * (1.0 - (dst / currentRadius) * 0.35) * edgeFade;
                            if(this.shieldHitTime > 0 && Mathf.chance(0.2)){
                                Draw.color(Color.white, cellAlpha * 1.2);
                            } else {
                                Draw.color(baseColor, cellAlpha);
                            }
                            Lines.poly(checkX, checkY, 6, hexSize * this.shieldScale);
                        }
                    }
                }
            }
            Draw.reset();
        }

        Draw.z(Layer.effect + 1); 
        let barY = this.y - 14; 
        let barWidth = 24;      
        let barHeight = 2;      
        Draw.color(Color.black, 0.5);
        Lines.stroke(barHeight + 1);
        Lines.line(this.x - (barWidth / 2), barY, this.x + (barWidth / 2), barY);
        if (this.shieldHealth <= 0) {
            Draw.color(Color.cyan); 
            let regenProgress = this.regenTimer / REGEN_COOLDOWN; 
            Lines.stroke(barHeight);
            Lines.line(this.x - (barWidth / 2), barY, this.x - (barWidth / 2) + (barWidth * regenProgress), barY);
        } else {
            Draw.color((this.getTier() == 2) ? Color.valueOf("ff1744") : Pal.lightOrange); 
            let healthProgress = this.shieldHealth / currentMaxShield; 
            Lines.stroke(barHeight);
            Lines.line(this.x - (barWidth / 2), barY, this.x - (barWidth / 2) + (barWidth * healthProgress), barY);
        }
        Draw.reset();
    }
});