const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

const reqMK2 = { copper: 200, lead: 200, titanium: 0 };
const reqMK2B = { copper: 200, lead: 200, titanium: 100 };
const reqMK3 = { copper: 400, lead: 400, titanium: 200 };

const reqMK2B1 = { copper: 400, lead: 400, titanium: 200 };
const reqMK3B = { copper: 800, lead: 800, titanium: 400 };

const CHARGE_TIME_MK1 = 60;    
const CHARGE_TIME_MK2 = 48;    
const CHARGE_TIME_MK2B = 72;   

const BERSERK_TIME_MK1 = 300;  
const BERSERK_TIME_MK2 = 360;  
const BERSERK_TIME_MK3 = 486;  

const dorNormalBullet = extend(BasicBulletType, {
    speed: 7, damage: 12, width: 7, height: 18, lifetime: 42.86,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 1.5, trailLength: 5,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dorSmallSprayBullet = extend(BasicBulletType, {
    speed: 8.5, damage: 21, width: 3.5, height: 9, lifetime: 35.29,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 0.75, trailLength: 3,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dormk2NormalBullet = extend(BasicBulletType, {
    speed: 7.7, damage: 21, width: 7.7, height: 19.8, lifetime: 50.65,      
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 1.65, trailLength: 6,    
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dormk2SmallSprayBullet = extend(BasicBulletType, {
    speed: 9.0, damage: 25.5, width: 3.85, height: 10, lifetime: 43.33,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 0.82, trailLength: 4,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dormk3NormalBullet = extend(BasicBulletType, {
    speed: 8.5, damage: 28.35, width: 8.5, height: 21.5, lifetime: 61.94,      
    frontColor: Color.valueOf("#fff59d"), backColor: Color.valueOf("#fbc02d"),
    trailColor: Color.valueOf("#ffee58"), trailWidth: 1.8, trailLength: 7,    
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const dormk3SmallSprayBullet = extend(BasicBulletType, {
    speed: 9.5, damage: 34.425, width: 4.2, height: 11, lifetime: 55.42,
    frontColor: Color.valueOf("#fff59d"), backColor: Color.valueOf("#fbc02d"),
    trailColor: Color.valueOf("#ffee58"), trailWidth: 0.9, trailLength: 5,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor
});

const normalBulletB = extend(BasicBulletType, {
    speed: 8, damage: 27, width: 8, height: 20, lifetime: 30, 
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
    speed: 8.8, damage: 29.7, width: 8.8, height: 22, lifetime: 30, 
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
    speed: 9.5, damage: 81, width: 9, height: 18, lifetime: 37.89, 
    frontColor: Color.valueOf("#ea80fc"), backColor: Color.valueOf("#aa00ff"), 
    trailColor: Color.valueOf("#e040fb"), trailWidth: 2.5, trailLength: 6,
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

    paidCopper: 0,
    paidLead: 0,
    paidTitanium: 0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        this.paidCopper = 0;
        this.paidLead = 0;
        this.paidTitanium = 0;
        if(val == 0) this.health = 1450;
        if(val == 1) this.health = 1885;
        if(val == 2) this.health = 2610;  
        if(val == 3) this.health = 2545; 
        if(val == 4) this.health = 2871;  
        if(val == 5) this.health = 3915;  
        this.maxHealth = this.health;
    },

    processPartialUpgrade(targetTier, reqObj){
        let core = this.team.core();
        if(core == null) return false;

        let reqC = reqObj.copper || 0;
        let reqL = reqObj.lead || 0;
        let reqT = reqObj.titanium || 0;

        let remC = reqC - this.paidCopper;
        let remL = reqL - this.paidLead;
        let remT = reqT - this.paidTitanium;

        let inv = core.items;
        let takeC = Math.min(inv.get(Items.copper), Math.max(0, remC));
        let takeL = Math.min(inv.get(Items.lead), Math.max(0, remL));
        let takeT = Math.min(inv.get(Items.titanium), Math.max(0, remT));

        if(takeC > 0) { core.items.remove(Items.copper, takeC); this.paidCopper += takeC; }
        if(takeL > 0) { core.items.remove(Items.lead, takeL); this.paidLead += takeL; }
        if(takeT > 0) { core.items.remove(Items.titanium, takeT); this.paidTitanium += takeT; }

        if(this.paidCopper >= reqC && this.paidLead >= reqL && this.paidTitanium >= reqT){
            if(targetTier == 1 || targetTier == 3) Fx.upgradeCore.at(this.x, this.y);
            else Fx.bigShockwave.at(this.x, this.y);
            Fx.mineHuge.at(this.x, this.y);
            Effect.shake(6, 6, this.x, this.y);
            
            if(Vars.net.active()){
                Call.tileConfig(Vars.player, this, java.lang.Integer(targetTier));
            } else {
                this.configure(java.lang.Integer(targetTier));
            }
            return true;
        }
        return false;
    },

    range(){
        let tier = this.getTier();
        if(tier == 5) return 360;   
        if(tier == 4) return 264;   
        if(tier == 3) return 526.5; 
        if(tier == 2) return 240;   
        if(tier == 1) return 390;   
        return 300;
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, isEn() ? "Dor Turret Upgrade Center" : "Trung tâm nâng cấp pháo Dor", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let cMK2 = Math.max(0, reqMK2.copper - this.paidCopper);
                    let lMK2 = Math.max(0, reqMK2.lead - this.paidLead);

                    let cMK2B = Math.max(0, reqMK2B.copper - this.paidCopper);
                    let lMK2B = Math.max(0, reqMK2B.lead - this.paidLead);
                    let tMK2B = Math.max(0, reqMK2B.titanium - this.paidTitanium);

                    if(isEn()){
                        return "[yellow]CORE RESOURCE REQUIREMENTS FOR UPGRADE:[]\n" +
                               "[cyan]MK2 Branch:[]\n" +
                               " • Copper: [green]" + cMK2 + "[]\n" +
                               " • Lead: [green]" + lMK2 + "[]\n" +
                               "[purple]MK2B Branch:[]\n" +
                               " • Copper: [green]" + cMK2B + "[]\n" +
                               " • Lead: [green]" + lMK2B + "[]\n" +
                               " • Titanium: [green]" + tMK2B + "[]";
                    }

                    return "[yellow]YÊU CẦU TÀI NGUYÊN NÂNG CẤP:[]\n" +
                           "[cyan]Nhánh MK2:[]\n" +
                           " • Đồng: [green]" + cMK2 + "[]\n" +
                           " • Chì: [green]" + lMK2 + "[]\n" +
                           "[purple]Nhánh MK2B:[]\n" +
                           " • Đồng: [green]" + cMK2B + "[]\n" +
                           " • Chì: [green]" + lMK2B + "[]\n" +
                           " • Titan: [green]" + tMK2B + "[]";
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add(isEn() ?
                                 "[white]• Health: [green]+30%[] ([green]1,885[] HP)\n" +
                                 "• Range: [green]+30%[] ([orange]390[] px)\n" +
                                 "• Base Damage: [green]+75%[] ([yellow]21[] DMG/bullet)\n\n" +
                                 "[lightgray]Special Ability: Pulse Charge Core — Charges in [orange]0.8s[] to unleash [yellow]20[] spray bullets. Triggering [yellow]2[] bursts activates Berserk Mode Lvl 2 for [orange]6s[] (x[yellow]2.6[] Fire Rate).[]" :
                                 "[white]• Máu cấu trúc: [green]+30%[] ([green]1,885[] HP)\n" +
                                 "• Tầm bắn: [green]+30%[] ([orange]390[] px)\n" +
                                 "• Sát thương gốc: [green]+75%[] ([yellow]21[] DMG/viên)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Mạch Tích Xung Điện — Tích sạc [orange]0.8s[] xả loạt [yellow]20[] viên đạn tỏa. Bắn đủ [yellow]2[] đợt kích hoạt Điên Cường Cấp 2 trong [orange]6[] giây (x[yellow]2.6[] tốc bắn).[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button(isEn() ? "[green]UPGRADE MK2[]" : "[green]NÂNG CẤP MK2[]", packRun(() => {
                    let done = this.processPartialUpgrade(1, reqMK2);
                    if(done){ dialog.hide(); this.deselect(); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add(isEn() ?
                                 "[white]• Health: [green]+80%[] ([green]2,610[] HP)\n" +
                                 "• Range: [red]-20%[] ([orange]240[] px)\n" +
                                 "• Base Damage: [yellow]27[] DMG/bullet\n\n" +
                                 "[lightgray]Special Ability: Gravity Core Cycle — Fires [yellow]3[] consecutive Gravity Lasers ([yellow]18[] DMG, pierces [orange]240[]px), followed by [yellow]100[] Homing Heavy Bullets.[]" :
                                 "[white]• Máu cấu trúc: [green]+80%[] ([green]2,610[] HP)\n" +
                                 "• Tầm bắn: [red]-20%[] ([orange]240[] px)\n" +
                                 "• Sát thương gốc: [yellow]27[] DMG/viên\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Tuần Hoàn Lõi Trọng Lực — Bắn [yellow]3[] phát Laser Trọng Lực liên tiếp ([yellow]18[] DMG, xuyên thấu [orange]240[]px), sau đó xả [yellow]100[] viên Trọng Đạn tự dẫn đường.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button(isEn() ? "[orange]UPGRADE MK2B[]" : "[orange]NÂNG CẤP MK2B[]", packRun(() => {
                    let done = this.processPartialUpgrade(2, reqMK2B);
                    if(done){ dialog.hide(); this.deselect(); }
                })).size(180, 38);

                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip(isEn() ? "Upgrade Dor turret" : "Nâng cấp tháp pháo Dor");
        } else if (tier == 1) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, isEn() ? "Dor MK3 Evolution Center" : "Trung tâm tiến hóa MK3 - Dor", {});

                let reqCell = dialog.cont.label(packProv(() => {
                    let cMK3 = Math.max(0, reqMK3.copper - this.paidCopper);
                    let lMK3 = Math.max(0, reqMK3.lead - this.paidLead);
                    let tMK3 = Math.max(0, reqMK3.titanium - this.paidTitanium);

                    if(isEn()){
                        return "[yellow]CORE RESOURCE REQUIREMENTS FOR MK3:[]\n" +
                               " • Copper: [green]" + cMK3 + "[]\n" +
                               " • Lead: [green]" + lMK3 + "[]\n" +
                               " • Titanium: [green]" + tMK3 + "[]";
                    }

                    return "[yellow]YÊU CẦU TÀI NGUYÊN NÂNG CẤP MK3:[]\n" +
                           " • Đồng: [green]" + cMK3 + "[]\n" +
                           " • Chì: [green]" + lMK3 + "[]\n" +
                           " • Titan: [green]" + tMK3 + "[]";
                }));

                reqCell.width(360).get().setWrap(true); reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let b3 = new Table(); b3.background(Styles.black6); b3.margin(12);
                b3.add("[gold]===(MK3 EVOLUTION)===[]").row();
                let b3D = b3.add(isEn() ?
                                 "[white]• Health: [green]+35%[] ([green]2,545[] HP)\n" +
                                 "• Range: [green]+35%[] ([orange]526.5[] px)\n" +
                                 "• Base Damage: [green]+35%[] ([yellow]28.35[] DMG/bullet)\n\n" +
                                 "[lightgray]Special Ability: Ultimate Rampage Burst — Spread storm of [yellow]27[] bullets/salvo ([yellow]34.42[] DMG). Triggers Ultimate Rampage state for [orange]8.1s[] (x[yellow]3.51[] Fire Rate).[]" :
                                 "[white]• Máu cấu trúc: [green]+35%[] ([green]2,545[] HP)\n" +
                                 "• Tầm bắn: [green]+35%[] ([orange]526.5[] px)\n" +
                                 "• Sát thương gốc: [green]+35%[] ([yellow]28.35[] DMG/viên)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Bão Nộ Tối Thượng — Bão đạn tỏa [yellow]27[] viên/loạt ([yellow]34.42[] DMG). Kích hoạt Cuồng Báo Tối Thượng kéo dài [orange]8.1[] giây (x[yellow]3.51[] tốc bắn).[]");
                b3D.width(340).get().setWrap(true); b3D.get().setAlignment(Align.left); b3.row();
                b3.button(isEn() ? "[gold]UPGRADE MK3[]" : "[gold]NÂNG CẤP MK3[]", packRun(() => {
                    let done = this.processPartialUpgrade(3, reqMK3);
                    if(done){ dialog.hide(); this.deselect(); }
                })).size(180, 38);

                dialog.cont.add(b3).width(360);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip(isEn() ? "Upgrade turret to MK3" : "Nâng cấp pháo lên MK3");
        } else if (tier == 2) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, isEn() ? "MK2B Branch Evolution Center" : "Trung tâm Rẽ Nhánh Tiến Hóa MK2B", {});

                let reqCell = dialog.cont.label(packProv(() => {
                    let cMK2B1 = Math.max(0, reqMK2B1.copper - this.paidCopper);
                    let lMK2B1 = Math.max(0, reqMK2B1.lead - this.paidLead);
                    let tMK2B1 = Math.max(0, reqMK2B1.titanium - this.paidTitanium);

                    let cMK3B = Math.max(0, reqMK3B.copper - this.paidCopper);
                    let lMK3B = Math.max(0, reqMK3B.lead - this.paidLead);
                    let tMK3B = Math.max(0, reqMK3B.titanium - this.paidTitanium);

                    if(isEn()){
                        return "[yellow]RESOURCE REQUIREMENTS FOR EVOLUTION:[]\n" +
                               "[purple]MK2B1 Config:[]\n" +
                               " • Copper: [green]" + cMK2B1 + "[] | Lead: [green]" + lMK2B1 + "[] | Titanium: [green]" + tMK2B1 + "[]\n" +
                               "[pink]Ultimate MK3B:[]\n" +
                               " • Copper: [green]" + cMK3B + "[] | Lead: [green]" + lMK3B + "[] | Titanium: [green]" + tMK3B + "[]";
                    }

                    return "[yellow]YÊU CẦU TÀI NGUYÊN NÂNG CẤP:[]\n" +
                           "[purple]Cấu Hình MK2B1:[]\n" +
                           " • Đồng: [green]" + cMK2B1 + "[] | Chì: [green]" + lMK2B1 + "[] | Titan: [green]" + tMK2B1 + "[]\n" +
                           "[pink]Cấu Hình MK3B:[]\n" +
                           " • Đồng: [green]" + cMK3B + "[] | Chì: [green]" + lMK3B + "[] | Titan: [green]" + tMK3B + "[]";
                }));

                reqCell.width(360).get().setWrap(true); reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b4 = new Table(); b4.background(Styles.black6); b4.margin(12);
                b4.add("[purple]===(BRANCH 1: MK2B1)===[]").row();
                let b4D = b4.add(isEn() ?
                                 "[white]• Health: [green]+10%[] ([green]2,871[] HP)\n" +
                                 "• Range: [green]+10%[] ([orange]264[] px)\n" +
                                 "• Base Damage: [green]+10%[] ([yellow]29.7[] DMG/bullet)\n\n" +
                                 "[lightgray]Special Ability: Dual Laser Barrage — Fires [yellow]2[] parallel Lasers ([yellow]19.8[] DMG) simultaneously, followed by a double storm of [yellow]200[] Homing Heavy Bullets.[]" :
                                 "[white]• Máu cấu trúc: [green]+10%[] ([green]2,871[] HP)\n" +
                                 "• Tầm bắn: [green]+10%[] ([orange]264[] px)\n" +
                                 "• Sát thương gốc: [green]+10%[] ([yellow]29.7[] DMG/viên)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Bão Laser Kép — Bắn [yellow]2[] tia Laser song song cùng lúc ([yellow]19.8[] DMG), sau đó xả nhân đôi lên [yellow]200[] viên Trọng Đạn tự dẫn đường.[]");
                b4D.width(340).get().setWrap(true); b4D.get().setAlignment(Align.left); b4.row();
                b4.button(isEn() ? "[purple]UPGRADE MK2B1[]" : "[purple]NÂNG CẤP MK2B1[]", packRun(() => {
                    let done = this.processPartialUpgrade(4, reqMK2B1);
                    if(done){ dialog.hide(); this.deselect(); }
                })).size(180, 38);

                let b5 = new Table(); b5.background(Styles.black6); b5.margin(12);
                b5.add("[pink]===(BRANCH 2: ULTIMATE MK3B)===[]").row();
                let b5D = b5.add(isEn() ?
                                 "[white]• Health: [green]+50%[] ([green]3,915[] HP)\n" +
                                 "• Range: [green]+50%[] ([orange]360[] px)\n" +
                                 "• Shotgun Damage: [green]+200%[] ([yellow]81[] DMG/bullet)\n\n" +
                                 "[lightgray]Special Ability: Extreme Gravity Storm — Fires [yellow]3[] wide Supercharged Lasers ([yellow]27[] DMG). Replaces single bursts with a [yellow]100[]-bullet Shotgun Storm Salvo (FPS Optimized).[]" :
                                 "[white]• Máu cấu trúc: [green]+50%[] ([green]3,915[] HP)\n" +
                                 "• Tầm bắn: [green]+50%[] ([orange]360[] px)\n" +
                                 "• Sát thương Shotgun: [green]+200%[] ([yellow]81[] DMG/viên)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Bão Cực Hạn Trọng Lực — Bắn [yellow]3[] đợt Laser Siêu Tải chùm rộng ([yellow]27[] DMG). Chuyển đạn xả lẻ thành loạt Shotgun Bão Tỏa [yellow]100[] viên (Đã tối ưu FPS).[]");
                b5D.width(340).get().setWrap(true); b5D.get().setAlignment(Align.left); b5.row();
                b5.button(isEn() ? "[pink]UPGRADE MK3B[]" : "[pink]NÂNG CẤP MK3B[]", packRun(() => {
                    let done = this.processPartialUpgrade(5, reqMK3B);
                    if(done){ dialog.hide(); this.deselect(); }
                })).size(180, 38);

                branchesTable.add(b4).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b5).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip(isEn() ? "Select evolution branch for MK2B" : "Lựa chọn nhánh nâng cấp cho MK2B");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo(isEn() ? "[red]DOR SYSTEM HAS REACHED MAX EVOLUTION LEVEL![]" : "[red]HỆ THỐNG DOR ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA CẤP CAO![]");
            })).size(50, 40).tooltip(isEn() ? "Reached max level of branch" : "Đã đạt cấp tối đa của nhánh");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let currentTier = this.getTier();
            let title = isEn() ? "Dor Turret Stats: " : "Thông số pháo Dor: ";
            let descStr = "";

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = isEn() ? 
                          "[yellow]⚡ BASE STATS (MK1) ⚡[]\n" +
                          "[white]Turret HP: [green]1,450[]\n" +
                          "Range: [orange]300[] px\n" +
                          "Base Damage: [yellow]12[] DMG/bullet[]\n\n" +
                          "[lightgray]Special Ability: Pulse Charge Burst — Normal shots deal [yellow]12[] DMG. Charges for [orange]1.0s[] to fire [yellow]10[] spread bullets ([yellow]21[] DMG). Firing [yellow]3[] bursts activates Berserk State for [orange]5s[] (x[yellow]1.5[] Fire Rate).[]" :
                          "[yellow]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]1,450[]\n" +
                          "Tầm bắn: [orange]300[] px\n" +
                          "Sát thương gốc: [yellow]12[] DMG/viên[]\n\n" +
                          "[lightgray]Kỹ năng đặc biệt: Tích Sạc Tỏa Đạn — Bắn thường gây [yellow]12[] DMG. Tích sạc [orange]1.0s[] xả loạt [yellow]10[] viên đạn tỏa ([yellow]21[] DMG). Bắn đủ [yellow]3[] đợt kích hoạt Trạng Thái Điên Cường trong [orange]5[] giây (x[yellow]1.5[] tốc bắn).[]";
            } else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = isEn() ? 
                          "[cyan]⚡ UPGRADE STATS (MK2) ⚡[]\n" +
                          "[white]Turret HP: [green]1,885[] ([green]+30%[])\n" +
                          "Range: [orange]390[] px ([green]+30%[])\n" +
                          "Base Damage: [yellow]21[] DMG/bullet ([green]+75%[])[]\n\n" +
                          "[lightgray]Special Ability: Enhanced Pulse Charge — Fast [orange]0.8s[] charge fires [yellow]20[] spread bullets ([yellow]25.5[] DMG). Firing [yellow]2[] bursts activates Berserk Lvl 2 for [orange]6s[] (x[yellow]2.6[] Fire Rate).[]" :
                          "[cyan]⚡ THÔNG SỐ NÂNG CẤP (MK2) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]1,885[] ([green]+30%[])\n" +
                          "Tầm bắn: [orange]390[] px ([green]+30%[])\n" +
                          "Sát thương gốc: [yellow]21[] DMG/viên ([green]+75%[])[]\n\n" +
                          "[lightgray]Kỹ năng đặc biệt: Tích Sạc Tăng Cường — Tích sạc [orange]0.8s[] xả loạt [yellow]20[] viên đạn tỏa ([yellow]25.5[] DMG). Bắn đủ [yellow]2[] đợt kích hoạt Điên Cường Cấp 2 trong [orange]6[] giây (x[yellow]2.6[] tốc bắn).[]";
            } else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = isEn() ? 
                          "[purple]⚡ GRAVITY STATS (MK2B) ⚡[]\n" +
                          "[white]Turret HP: [green]2,610[] ([green]+80%[])\n" +
                          "Range: [orange]240[] px ([red]-20%[])\n" +
                          "Base Damage: [yellow]27[] DMG/bullet[]\n\n" +
                          "[lightgray]Special Ability: Gravity Cycle Mode — Fires [yellow]3[] Gravity Lasers ([yellow]18[] DMG, [orange]240[]px piercing), followed immediately by [yellow]100[] Homing Heavy Bullets ([yellow]27[] DMG/bullet).[]" :
                          "[purple]⚡ THÔNG SỐ TRỌNG LỰC (MK2B) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]2,610[] ([green]+80%[])\n" +
                          "Tầm bắn: [orange]240[] px ([red]-20%[])\n" +
                          "Sát thương gốc: [yellow]27[] DMG/viên[]\n\n" +
                          "[lightgray]Kỹ năng đặc biệt: Chế Độ Tuần Hoàn Trọng Lực — Bắn [yellow]3[] phát Laser Trọng Lực ([yellow]18[] DMG, xuyên thấu [orange]240[]px), sau đó xả [yellow]100[] viên Trọng Đạn tự dẫn đường ([yellow]27[] DMG/viên).[]";
            } else if (currentTier == 3) {
                title += "[gold](MK3)[]";
                descStr = isEn() ? 
                          "[gold]⚡ EVOLUTION STATS (MK3) ⚡[]\n" +
                          "[white]Turret HP: [green]2,545[] ([green]+35%[])\n" +
                          "Range: [orange]526.5[] px ([green]+35%[])\n" +
                          "Base Damage: [yellow]28.35[] DMG/bullet[]\n\n" +
                          "[lightgray]Special Ability: Ultimate Burst Storm — Fires spread storm of [yellow]27[] bullets/salvo ([yellow]34.42[] DMG). Ultimate Rampage state lasts [orange]8.1s[] (x[yellow]3.51[] Fire Rate).[]" :
                          "[gold]⚡ THÔNG SỐ TIẾN HÓA (MK3) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]2,545[] ([green]+35%[])\n" +
                          "Tầm bắn: [orange]526.5[] px ([green]+35%[])\n" +
                          "Sát thương gốc: [yellow]28.35[] DMG/viên[]\n\n" +
                          "[lightgray]Kỹ năng đặc biệt: Bão Siêu Nộ Tối Thượng — Bão đạn tỏa [yellow]27[] viên/loạt ([yellow]34.42[] DMG). Trạng thái Cuồng Báo Tối Thượng kéo dài [orange]8.1[] giây (x[yellow]3.51[] tốc bắn).[]";
            } else if (currentTier == 4) {
                title += "[purple](MK2B1)[]";
                descStr = isEn() ? 
                          "[purple]⚡ CONFIGURATION STATS (MK2B1) ⚡[]\n" +
                          "[white]Turret HP: [green]2,871[] ([green]+10%[])\n" +
                          "Range: [orange]264[] px ([green]+10%[])\n" +
                          "Base Damage: [yellow]29.7[] DMG/bullet[]\n\n" +
                          "[lightgray]Special Ability: Dual Breakthrough Mode — Fires [yellow]2[] parallel Lasers ([yellow]19.8[] DMG). Releases a double storm of [yellow]200[] Homing Heavy Bullets ([yellow]29.7[] DMG/bullet).[]" :
                          "[purple]⚡ THÔNG SỐ CẤU HÌNH (MK2B1) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]2,871[] ([green]+10%[])\n" +
                          "Tầm bắn: [orange]264[] px ([green]+10%[])\n" +
                          "Sát thương gốc: [yellow]29.7[] DMG/viên[]\n\n" +
                          "[lightgray]Kỹ năng đặc biệt: Chế Độ Đột Phá Kép — Bắn [yellow]2[] tia Laser song song ([yellow]19.8[] DMG). Xả bão đạn nhân đôi [yellow]200[] viên Trọng Đạn tự dẫn đường ([yellow]29.7[] DMG/viên).[]";
            } else if (currentTier == 5) {
                title += "[pink](MK3B)[]";
                descStr = isEn() ? 
                          "[pink]⚡ ULTIMATE STATS (MK3B) ⚡[]\n" +
                          "[white]Turret HP: [green]3,915[] ([green]+50%[])\n" +
                          "Range: [orange]360[] px ([green]+50%[])\n" +
                          "Shotgun Damage: [yellow]81[] DMG/bullet[]\n\n" +
                          "[lightgray]Special Ability: Extreme Gravity Mode — Fires [yellow]3[] wide Supercharged Lasers ([yellow]27[] DMG). Replaces burst shots with [yellow]100[]-bullet Shotgun Storm Salvos (FPS Optimized).[]" :
                          "[pink]⚡ THÔNG SỐ TỐI THƯỢNG (MK3B) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]3,915[] ([green]+50%[])\n" +
                          "Tầm bắn: [orange]360[] px ([green]+50%[])\n" +
                          "Sát thương Shotgun: [yellow]81[] DMG/viên[]\n\n" +
                          "[lightgray]Kỹ năng đặc biệt: Chế Độ Cực Hạn Trọng Lực — Bắn [yellow]3[] đợt Laser Siêu Tải chùm rộng ([yellow]27[] DMG). Chuyển đạn xả lẻ thành Loạt Shotgun Bão Tỏa [yellow]100[] viên (Đã tối ưu FPS).[]";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip(isEn() ? "View detailed stats" : "Xem thông số chi tiết hệ thống");
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
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

        if(tier == 2 || tier == 4 || tier == 5){
            if(this.burstTimer > 0){
                if(tier == 5){
                    for(let i = 0; i < 20; i++){
                        let angleOffset = Mathf.range(35);
                        shotgunBulletB3.create(this, this.team, this.x, this.y, this.rotation + angleOffset);
                    }
                    this.burstShotsFired += 20;

                    if(this.burstShotsFired >= 100){ 
                        this.burstTimer = 0;
                        this.burstShotsFired = 0;
                        this.laserCount = 0; 
                        this.customReloadTimer = CHARGE_TIME_MK2B; 
                    }
                } else {
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
                        let tr = new Vec2();
                        tr.trns(this.rotation + 90, 8);
                        laserBulletB1.create(this, this.team, this.x + tr.x, this.y + tr.y, this.rotation);
                        laserBulletB1.create(this, this.team, this.x - tr.x, this.y - tr.y, this.rotation);
                    } else if(tier == 5){
                        this.super$shoot(laserBulletB3);
                    } else {
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
        this.super$write(write); 
        write.b(this.getTier()); 
        write.i(this.paidCopper);
        write.i(this.paidLead);
        write.i(this.paidTitanium);
    },
    read(read, revision){
        this.super$read(read, revision); 
        this.setTier(read.b()); 
        this.paidCopper = read.i();
        this.paidLead = read.i();
        this.paidTitanium = read.i();
        this.chargeTimer = 0; this.berserkTimer = 0; this.superShotCount = 0;
        this.laserCount = 0; this.burstTimer = 0; this.burstShotsFired = 0; this.customReloadTimer = 0;
    }
});