const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// Yêu cầu tài nguyên
const reqMK2 = { copper: 4000, lead: 4000, titanium: 0 };
const reqMK2B = { copper: 4000, lead: 4000, titanium: 2000 };
const reqMK3 = { copper: 8000, lead: 8000, titanium: 4000 };

// Tài nguyên rẽ nhánh cho MK2B
const reqMK2B1 = { copper: 8000, lead: 8000, titanium: 4000 };
const reqMK3B = { copper: 16000, lead: 16000, titanium: 8000 };

const CHARGE_TIME_MK1 = 60;    
const CHARGE_TIME_MK2 = 48;    
const CHARGE_TIME_MK2B = 72;   

const BERSERK_TIME_MK1 = 300;  
const BERSERK_TIME_MK2 = 360;  
const BERSERK_TIME_MK3 = 486;  

// --- BULLET TYPES ---
const dorNormalBullet = extend(BasicBulletType, {
    speed: 7, damage: 12, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 1.5, trailLength: 5,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dorSmallSprayBullet = extend(BasicBulletType, {
    speed: 8.5, damage: 21, width: 3.5, height: 9, lifetime: 35,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 0.75, trailLength: 3,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dormk2NormalBullet = extend(BasicBulletType, {
    speed: 7.7, damage: 21, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 1.65, trailLength: 6,    
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dormk2SmallSprayBullet = extend(BasicBulletType, {
    speed: 9.0, damage: 25.5, width: 3.85, height: 10, lifetime: 35,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 0.82, trailLength: 4,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dormk3NormalBullet = extend(BasicBulletType, {
    speed: 8.5, damage: 28.35, width: 8.5, height: 21.5, lifetime: 45,      
    frontColor: Color.valueOf("#fff59d"), backColor: Color.valueOf("#fbc02d"),
    trailColor: Color.valueOf("#ffee58"), trailWidth: 1.8, trailLength: 7,    
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dormk3SmallSprayBullet = extend(BasicBulletType, {
    speed: 9.5, damage: 34.425, width: 4.2, height: 11, lifetime: 35,
    frontColor: Color.valueOf("#fff59d"), backColor: Color.valueOf("#fbc02d"),
    trailColor: Color.valueOf("#ffee58"), trailWidth: 0.9, trailLength: 5,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

// --- NHÁNH B BULLETS ---
const normalBulletB = extend(BasicBulletType, {
    speed: 8, damage: 27, width: 8, height: 20, lifetime: 40, 
    frontColor: Color.valueOf("#ff8a80"), backColor: Color.valueOf("#ff1744"), 
    trailColor: Color.valueOf("#ff5252"), trailWidth: 2, trailLength: 6,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    homingPower: 0.12, homingRange: 160
});

const laserBulletB = extend(LaserBulletType, {
    length: 240, damage: 18, width: 24, lifetime: 25,
    colors: [Color.valueOf("#ff1744"), Color.valueOf("#b71c1c"), Color.white],
    hitEffect: Fx.hitLaserColor, chargeEffect: Fx.lancerLaserCharge, smokeEffect: Fx.smoke
});

const normalBulletB1 = extend(BasicBulletType, {
    speed: 8.8, damage: 29.7, width: 8.8, height: 22, lifetime: 40, 
    frontColor: Color.valueOf("#ff8a80"), backColor: Color.valueOf("#ff1744"), 
    trailColor: Color.valueOf("#ff5252"), trailWidth: 2.2, trailLength: 7,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    homingPower: 0.15, homingRange: 180
});

const laserBulletB1 = extend(LaserBulletType, {
    length: 264, damage: 19.8, width: 26.4, lifetime: 25,
    colors: [Color.valueOf("#ff1744"), Color.valueOf("#b71c1c"), Color.white],
    hitEffect: Fx.hitLaserColor, chargeEffect: Fx.lancerLaserCharge, smokeEffect: Fx.smoke
});

const shotgunBulletB3 = extend(BasicBulletType, {
    speed: 9.5, damage: 40.5, width: 9, height: 18, lifetime: 45, 
    frontColor: Color.valueOf("#ea80fc"), backColor: Color.valueOf("#aa00ff"), 
    trailColor: Color.valueOf("#e040fb"), trailWidth: 2.5, trailLength: 8,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    homingPower: 0.2, homingRange: 220
});

const laserBulletB3 = extend(LaserBulletType, {
    length: 360, damage: 27, width: 36, lifetime: 25,
    colors: [Color.valueOf("#ea80fc"), Color.valueOf("#aa00ff"), Color.white],
    hitEffect: Fx.hitLaserColor, chargeEffect: Fx.lancerLaserCharge, smokeEffect: Fx.smoke
});


let dor = extend(ItemTurret, "dor", {
    squareSprite: false
});

dor.health = 1450;
dor.size = 3;
dor.reload = 40; 
dor.configurable = true;
dor.category = Category.turret;

dor.ammo(Items.lead, dorNormalBullet);

dor.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));


dor.buildType = () => extend(ItemTurret.ItemTurretBuild, dor, {
    chargeTimer: 0,
    berserkTimer: 0,
    superShotCount: 0,
    tierState: 0,

    laserCount: 0,
    burstTimer: 0,
    burstShotsFired: 0,
    customReloadTimer: 0,
    limitCheck: 0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        if(val == 0) this.health = 1450;
        if(val == 1) this.health = 1885;
        if(val == 2) this.health = 2610; // MK2B
        if(val == 3) this.health = 2545; // MK3
        if(val == 4) this.health = 2871; // MK2B1 (+10% HP)
        if(val == 5) this.health = 3915; // MK3B (+50% HP)
        this.maxHealth = this.health;
    },

    range(){
        let tier = this.getTier();
        if(tier == 5) return 360;   // MK3B
        if(tier == 4) return 264;   // MK2B1
        if(tier == 3) return 526.5; // MK3
        if(tier == 2) return 240;   // MK2B
        if(tier == 1) return 390;   // MK2
        return 300;
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
            // MK1 -> MK2 / MK2B
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Dor", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentcopper = core.items.get(Items.copper);
                    let currentlead = core.items.get(Items.lead);
                    let currenttitanium = core.items.get(Items.titanium);
                    
                    let copColor1 = currentcopper >= reqMK2.copper ? "[green]" : "[red]";
                    let leaColor1 = currentlead >= reqMK2.lead ? "[green]" : "[red]";
                    
                    let copColor2 = currentcopper >= reqMK2B.copper ? "[green]" : "[red]";
                    let leaColor2 = currentlead >= reqMK2B.lead ? "[green]" : "[red]";
                    let titColor2 = currenttitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh Cấu Hình MK2:[]\n" +
                           " • Đồng: " + copColor1 + currentcopper + "[] / " + reqMK2.copper + "\n" +
                           " • Chì: " + leaColor1 + currentlead + "[] / " + reqMK2.lead + "\n" +
                           "[purple]Nhánh Biến Thể MK2B:[]\n" +
                           " • Đồng: " + copColor2 + currentcopper + "[] / " + reqMK2B.copper + "\n" +
                           " • Chì: " + leaColor2 + currentlead + "[] / " + reqMK2B.lead + "\n" +
                           " • Titan: " + titColor2 + currenttitanium + "[] / " + reqMK2B.titanium;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("Nâng cấp mạch sạc xung điện cao cấp:\n" +
                                 " [white]• Tăng [green]+30% Máu[] (1,885) và mở rộng [green]+30% Tầm bắn[] (390 px).[]\n" +
                                 " [white]• Đạn thường tăng [yellow]+75% Sát thương[] (21.00).\n" +
                                 " [white]• Sạc tốc độ cao 0.8s, xả đạn tỏa [sky]20 viên/loạt[].[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead){
                        core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                // MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("Chuyển đổi sang lõi cấu trúc trọng lực thô tuần hoàn:\n" +
                                 " [white]• Tăng cực đại [green]+80% Máu[] (2,610).\n" +
                                 " [white]• Bắn [orange]3 phát Laser[] liên tiếp, sau đó xả [pink]100 viên Trọng Đạn[] tự dẫn đường.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2B.copper && core.items.get(Items.lead) >= reqMK2B.lead && core.items.get(Items.titanium) >= reqMK2B.titanium){
                        core.items.remove(Items.copper, reqMK2B.copper); core.items.remove(Items.lead, reqMK2B.lead); core.items.remove(Items.titanium, reqMK2B.titanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp tháp pháo Dor");
        } else if (tier == 1) {
            // MK2 -> MK3
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm tiến hóa MK3 - Dor", {});

                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentcopper = core.items.get(Items.copper);
                    let currentlead = core.items.get(Items.lead);
                    let currenttitanium = core.items.get(Items.titanium);

                    let copColor = currentcopper >= reqMK3.copper ? "[green]" : "[red]";
                    let leaColor = currentlead >= reqMK3.lead ? "[green]" : "[red]";
                    let titColor = currenttitanium >= reqMK3.titanium ? "[green]" : "[red]";

                    return "[yellow]YÊU CẦU TÀI NGUYÊN TIẾN HÓA MK3:[]\n" +
                           " • Đồng: " + copColor + currentcopper + "[] / " + reqMK3.copper + "\n" +
                           " • Chì: " + leaColor + currentlead + "[] / " + reqMK3.lead + "\n" +
                           " • Titan: " + titColor + currenttitanium + "[] / " + reqMK3.titanium;
                }));

                reqCell.width(360).get().setWrap(true); reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let b3 = new Table(); b3.background(Styles.black6); b3.margin(12);
                b3.add("[gold]===(TIẾN HÓA CẤP MK3)===[]").row();
                let b3D = b3.add("Toàn bộ thông số tăng trưởng [gold]+35%[] so với MK2.");
                b3D.width(340).get().setWrap(true); b3D.get().setAlignment(Align.left); b3.row();
                b3.button("[gold]KÍCH HOẠT MK3[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK3.copper && core.items.get(Items.lead) >= reqMK3.lead && core.items.get(Items.titanium) >= reqMK3.titanium){
                        core.items.remove(Items.copper, reqMK3.copper); core.items.remove(Items.lead, reqMK3.lead); core.items.remove(Items.titanium, reqMK3.titanium);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(8, 8, this.x, this.y);
                        this.configure(java.lang.Integer(3)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên nâng cấp MK3![]"); }
                })).size(180, 38);

                dialog.cont.add(b3).width(360);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp pháo lên MK3");
        } else if (tier == 2) {
            // MK2B -> RẼ NHÁNH (MK2B1 HOẶC MK3B)
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm Rẽ Nhánh Tiến Hóa MK2B", {});

                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentcopper = core.items.get(Items.copper);
                    let currentlead = core.items.get(Items.lead);
                    let currenttitanium = core.items.get(Items.titanium);

                    let copColor1 = currentcopper >= reqMK2B1.copper ? "[green]" : "[red]";
                    let leaColor1 = currentlead >= reqMK2B1.lead ? "[green]" : "[red]";
                    let titColor1 = currenttitanium >= reqMK2B1.titanium ? "[green]" : "[red]";

                    let copColor2 = currentcopper >= reqMK3B.copper ? "[green]" : "[red]";
                    let leaColor2 = currentlead >= reqMK3B.lead ? "[green]" : "[red]";
                    let titColor2 = currenttitanium >= reqMK3B.titanium ? "[green]" : "[red]";

                    return "[yellow]YÊU CẦU TÀI NGUYÊN (CHỌN 1 TRONG 2 NHÁNH):[]\n" +
                           "[purple]Cấu Hình MK2B1:[]\n" +
                           " • Đồng: " + copColor1 + currentcopper + "[] / " + reqMK2B1.copper +
                           " | Chì: " + leaColor1 + currentlead + "[] / " + reqMK2B1.lead +
                           " | Titan: " + titColor1 + currenttitanium + "[] / " + reqMK2B1.titanium + "\n" +
                           "[pink]Cấu Hình Tối Thượng MK3B:[]\n" +
                           " • Đồng: " + copColor2 + currentcopper + "[] / " + reqMK3B.copper +
                           " | Chì: " + leaColor2 + currentlead + "[] / " + reqMK3B.lead +
                           " | Titan: " + titColor2 + currenttitanium + "[] / " + reqMK3B.titanium;
                }));

                reqCell.width(360).get().setWrap(true); reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // NÚT 1: CHỌN MK2B1
                let b4 = new Table(); b4.background(Styles.black6); b4.margin(12);
                b4.add("[purple]===(NHÁNH 1: CẤU HÌNH MK2B1)===[]").row();
                let b4D = b4.add(" [white]• Tăng [green]+10% chỉ số[] (Máu: 2,871 HP, Tầm: 264 px).\n" +
                                 " [white]• Bắn [orange]2 tia Laser song song[] cùng lúc.\n" +
                                 " [white]• Xả gấp đôi lên [pink]200 viên Trọng Đạn[] liên hoàn.");
                b4D.width(340).get().setWrap(true); b4D.get().setAlignment(Align.left); b4.row();
                b4.button("[purple]CHỌN MK2B1[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2B1.copper && core.items.get(Items.lead) >= reqMK2B1.lead && core.items.get(Items.titanium) >= reqMK2B1.titanium){
                        core.items.remove(Items.copper, reqMK2B1.copper); core.items.remove(Items.lead, reqMK2B1.lead); core.items.remove(Items.titanium, reqMK2B1.titanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(8, 8, this.x, this.y);
                        this.configure(java.lang.Integer(4)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho MK2B1![]"); }
                })).size(180, 38);

                // NÚT 2: CHỌN MK3B
                let b5 = new Table(); b5.background(Styles.black6); b5.margin(12);
                b5.add("[pink]===(NHÁNH 2: TỐI THƯỢNG MK3B)===[]").row();
                let b5D = b5.add(" [white]• Tăng [green]+50% chỉ số[] (Máu: 3,915 HP, Tầm: 360 px).\n" +
                                 " [white]• Laser Siêu Tải chùm rộng.\n" +
                                 " [white]• Chuyển đạn xả lẻ thành [magenta]Loạt Shotgun Chùm Bão Tỏa 200 viên[] diện rộng.");
                b5D.width(340).get().setWrap(true); b5D.get().setAlignment(Align.left); b5.row();
                b5.button("[pink]CHỌN MK3B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK3B.copper && core.items.get(Items.lead) >= reqMK3B.lead && core.items.get(Items.titanium) >= reqMK3B.titanium){
                        core.items.remove(Items.copper, reqMK3B.copper); core.items.remove(Items.lead, reqMK3B.lead); core.items.remove(Items.titanium, reqMK3B.titanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(12, 12, this.x, this.y);
                        this.configure(java.lang.Integer(5)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho MK3B![]"); }
                })).size(180, 38);

                branchesTable.add(b4).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b5).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Lựa chọn nhánh nâng cấp cho MK2B");
        } else {
            // Khóa nâng cấp
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG DOR ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA CẤP CAO![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa của nhánh");
        }

        // --- NÚT THÔNG TIN (I) - ĐÃ KHÔI PHỤC TOÀN BỘ CHỈ SỐ ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let currentTier = this.getTier();
            let title = " Thông số pháo Dor: ";
            let descStr = "";

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,450[] | [lightgray]Tầm bắn:[] [orange]300 px[]\n\n" +
                          "[cyan]🔥 CƠ CHẾ NỘ XẢ ĐẠN THƯỜNG:[]\n" +
                          "• Bắn thường: [white]Sát thương 12.00[]\n" +
                          "• Tích sạc 1.0s (60 ticks) -> Xả loạt 10 viên đạn tỏa (21.00 đm)\n" +
                          "• Bắn đủ 3 đợt tỏa -> Kích hoạt [red]Trạng thái Điên Cường[] trong 5 giây (x1.5 tốc bắn).";
            } else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ NÂNG CẤP (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,885 (+30%)[] | [lightgray]Tầm bắn:[] [orange]390 px (+30%)[]\n\n" +
                          "[cyan]🔥 CƠ CHẾ NỘ TĂNG CƯỜNG:[]\n" +
                          "• Bắn thường: [white]Sát thương 21.00 (+75%)[]\n" +
                          "• Tích sạc nhanh 0.8s -> Xả loạt 20 viên đạn tỏa (25.50 đm)\n" +
                          "• Bắn đủ 2 đợt tỏa -> Kích hoạt [red]Điên Cường Cấp 2[] trong 6 giây (x2.6 tốc bắn).";
            } else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ TRỌNG LỰC (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,610 (+80%)[] | [lightgray]Tầm bắn:[] [red]240 px[]\n\n" +
                          "[purple]🔥 CƠ CHẾ TUẦN HOÀN TRỌNG LỰC:[]\n" +
                          "• Bắn 3 phát [orange]Laser Trọng Lực[] liên tiếp (18.00 đm, xuyên thấu 240px).\n" +
                          "• Ngay sau đó xả liên hoàn [pink]100 viên Trọng Đạn[] tự dẫn đường (27.00 đm/viên).";
            } else if (currentTier == 3) {
                title += "[gold](MK3)[]";
                descStr = "[gold]⚡ THÔNG SỐ TIẾN HÓA (MK3) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,545 (+35% MK2)[] | [lightgray]Tầm bắn:[] [orange]526.5 px (+35% MK2)[]\n\n" +
                          "[gold]🔥 CƠ CHẾ SIÊU NỘ TỐI THƯỢNG:[]\n" +
                          "• Bắn thường: [white]Sát thương 28.35[]\n" +
                          "• Bão đạn tỏa [yellow]27 viên/loạt[] (34.42 đm/viên)\n" +
                          "• Trạng thái [red]Cuồng Báo Tối Thượng[] kéo dài 8.1 giây (x3.51 tốc bắn).";
            } else if (currentTier == 4) {
                title += "[purple](MK2B1)[]";
                descStr = "[purple]⚡ THÔNG SỐ CẤU HÌNH (MK2B1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,871 (+10% MK2B)[] | [lightgray]Tầm bắn:[] [orange]264 px (+10% MK2B)[]\n\n" +
                          "[purple]🔥 CƠ CHẾ ĐỘT PHÁ CẤU HÌNH:[]\n" +
                          "• [orange]Bắn Laser Kép:[] Phát ra 2 tia Laser song song cùng lúc (19.80 đm/tia, dài 264px).\n" +
                          "• [pink]Bão Đạn Nhân Đôi:[] Xả bão đạn cuồng bạo [pink]200 viên Trọng Đạn[] liên hoàn tự dẫn đường (29.70 đm/viên).";
            } else if (currentTier == 5) {
                title += "[pink](MK3B)[]";
                descStr = "[pink]👑 THÔNG SỐ TỐI THƯỢNG (MK3B) 👑[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]3,915 (+50% MK2B)[] | [lightgray]Tầm bắn:[] [orange]360 px (+50% MK2B)[]\n\n" +
                          "[pink]🔥 CHẾ ĐỘ CỰC HẠN TRỌNG LỰC:[]\n" +
                          "• Bắn ra 3 đợt Laser Siêu Tải chùm rộng (27.00 đm, dài 360px).\n" +
                          "• Chuyển đổi đạn xả lẻ thành [magenta]Loạt Shotgun Chùm Bão Tỏa 200 viên[] (40.50 đm/viên) dội thẳng diện rộng cực đại.";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem thông số chi tiết hệ thống");
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
        this.limitCheck += Time.delta;
        if(this.limitCheck >= 15){
            this.limitCheck = 0; let count = 0; let firstBuild = null;
            Groups.build.each(b => {
                if(b.block == dor && b.team == this.team) { 
                    count++; if(firstBuild == null) firstBuild = b; 
                }
            });
            if(count > 10 && this !== firstBuild){
                Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 10 tháp pháo Dor! Cấu trúc thừa đã tự hủy![]"); 
                this.kill(); return;
            }
        }

        this.super$updateTile();
        let tier = this.getTier();

        if(tier == 2 || tier == 4 || tier == 5){
            if (this.burstTimer > 0) {
                if (this.isShooting && this.hasAmmo()) { this.reloadCounter += this.block.reload; }
            } else {
                if (this.customReloadTimer > 0) {
                    this.customReloadTimer -= Time.delta;
                    this.reloadCounter = 0; 
                }
            }
        } else {
            let speedBoost = (tier == 3) ? 3.51 : ((tier == 1) ? 2.6 : 1.5);
            let currentChargeMax = (tier == 1 || tier == 3) ? CHARGE_TIME_MK2 : CHARGE_TIME_MK1;

            if (this.berserkTimer > 0) {
                this.berserkTimer -= Time.delta;
                if (this.berserkTimer < 0) this.berserkTimer = 0;
                
                if (this.isShooting && this.hasAmmo()) {
                    this.reloadCounter += Time.delta * (this.efficiency * speedBoost);
                }
            } else {
                if (this.chargeTimer < currentChargeMax) {
                    this.chargeTimer += Time.delta;
                    if (this.chargeTimer > currentChargeMax) this.chargeTimer = currentChargeMax;
                }
            }
        }
    },

    shoot(type){
        let tier = this.getTier();

        // --- XỬ LÝ NHÁNH B (MK2B - Tier 2 | MK2B1 - Tier 4 | MK3B - Tier 5) ---
        if(tier == 2 || tier == 4 || tier == 5){
            if(this.burstTimer > 0){
                if(tier == 5){
                    // MK3B: Shotgun Chùm Bão Tỏa
                    for(let i = 0; i < 40; i++){
                        let angleOffset = Mathf.range(35);
                        shotgunBulletB3.create(this, this.team, this.x, this.y, this.rotation + angleOffset);
                    }
                    this.burstShotsFired += 40;

                    if(this.burstShotsFired >= 200){ 
                        this.burstTimer = 0;
                        this.burstShotsFired = 0;
                        this.laserCount = 0; 
                        this.customReloadTimer = CHARGE_TIME_MK2B; 
                    }
                } else {
                    // MK2B (100 viên) & MK2B1 (200 viên)
                    let activeBullet = (tier == 4) ? normalBulletB1 : normalBulletB;
                    let maxShots = (tier == 4) ? 200 : 100;

                    this.super$shoot(activeBullet); 
                    this.rotation += Mathf.range(45); 
                    this.burstShotsFired++;

                    if(this.burstShotsFired >= maxShots){ 
                        this.burstTimer = 0;
                        this.burstShotsFired = 0;
                        this.laserCount = 0; 
                        this.customReloadTimer = CHARGE_TIME_MK2B; 
                    }
                }
            } 
            else {
                if (this.customReloadTimer <= 0) {
                    if(tier == 4){
                        // MK2B1: Laser Kép Song Song
                        let tr = new Vec2();
                        tr.trns(this.rotation + 90, 8);
                        laserBulletB1.create(this, this.team, this.x + tr.x, this.y + tr.y, this.rotation);
                        laserBulletB1.create(this, this.team, this.x - tr.x, this.y - tr.y, this.rotation);
                    } else if(tier == 5){
                        // MK3B: Laser Siêu Tải
                        this.super$shoot(laserBulletB3);
                    } else {
                        // MK2B
                        this.super$shoot(laserBulletB);
                    }

                    Fx.lightningCharge.at(this.x, this.y);
                    this.laserCount++;
                    this.customReloadTimer = CHARGE_TIME_MK2B; 

                    if(this.laserCount >= 3){ 
                        this.burstTimer = 1; 
                        this.customReloadTimer = 0; 
                        Fx.bigShockwave.at(this.x, this.y);
                    }
                }
            }
            return;
        }

        // --- XỬ LÝ NHÁNH A (MK1 - Tier 0 | MK2 - Tier 1 | MK3 - Tier 3) ---
        let currentChargeMax = (tier == 1 || tier == 3) ? CHARGE_TIME_MK2 : CHARGE_TIME_MK1;
        let currentBerserkMax = (tier == 3) ? BERSERK_TIME_MK3 : ((tier == 1) ? BERSERK_TIME_MK2 : BERSERK_TIME_MK1);
        
        let activeNormalBullet = dorNormalBullet;
        if (tier == 1) activeNormalBullet = dormk2NormalBullet;
        if (tier == 3) activeNormalBullet = dormk3NormalBullet;

        let requiredSuperShots = (tier == 1 || tier == 3) ? 2 : 3;

        if (this.chargeTimer >= currentChargeMax && this.berserkTimer <= 0) {
            Fx.lightningCharge.at(this.x, this.y);
            
            if(tier == 3){
                for(let i = 0; i < 27; i++){
                    let angleOffset = Mathf.range(8); 
                    dormk3SmallSprayBullet.create(this, this.team, this.x, this.y, this.rotation + angleOffset);
                }
            } else if(tier == 1){
                for(let i = 0; i < 20; i++){
                    let angleOffset = Mathf.range(6); 
                    dormk2SmallSprayBullet.create(this, this.team, this.x, this.y, this.rotation + angleOffset);
                }
            } else {
                for(let i = 0; i < 10; i++){
                    let angleOffset = Mathf.range(4); 
                    dorSmallSprayBullet.create(this, this.team, this.x, this.y, this.rotation + angleOffset);
                }
            }
            
            this.superShotCount++;
            this.chargeTimer = 0;

            if (this.superShotCount >= requiredSuperShots) {
                this.berserkTimer = currentBerserkMax;
                this.superShotCount = 0;
                
                if(tier == 1 || tier == 3) {
                    Fx.upgradeCore.at(this.x, this.y);
                } else {
                    Fx.bigShockwave.at(this.x, this.y);
                }
            }
        } else {
            this.super$shoot(activeNormalBullet);
        }
    },

    write(write){
        this.super$write(write); write.b(this.getTier()); 
    },
    read(read, revision){
        this.super$read(read, revision); 
        this.setTier(read.b()); 
        this.chargeTimer = 0; this.berserkTimer = 0; this.superShotCount = 0;
        this.laserCount = 0; this.burstTimer = 0; this.burstShotsFired = 0; this.customReloadTimer = 0;
    }
});