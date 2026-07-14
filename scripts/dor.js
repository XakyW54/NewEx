const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqMK2 = {
    copper: 4000,
    lead: 4000,
    titanium: 0
};

const reqMK2B = {
    copper: 4000,
    lead: 4000,
    titanium: 2000
};

const CHARGE_TIME_MK1 = 60;    
const CHARGE_TIME_MK2 = 48;    
const CHARGE_TIME_MK2B = 72;   

const BERSERK_TIME_MK1 = 300;  
const BERSERK_TIME_MK2 = 360;  


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
        if(val == 2) this.health = 2610;
        this.maxHealth = this.health;
    },

    range(){
        let tier = this.getTier();
        if(tier == 2) return 240; 
        if(tier == 1) return 390; 
        return 300;
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
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

                // Nhánh 1: MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("Nâng cấp mạch sạc xung điện cao cấp:\n" +
                                 " [white]• Tăng [green]+30% Máu[] (1,885) và mở rộng [green]+30% Tầm bắn[] (390 px).[]\n" +
                                 " [white]• Đạn thường tăng [yellow]+75% Sát thương[] (21.00), vận tốc bay +10%.[]\n" +
                                 " [white]• Tốc độ sạc tăng [orange]20%[] (Mất 0.8s), bão đạn tỏa tăng gấp đôi lên [sky]20 viên/loạt[].[]\n" +
                                 " [white]• Trạng thái Nộ (Berserk) kích hoạt sau [pink]2 loạt sạc[], duy trì liên tục [pink]6.0 giây[] và tăng tốc xả đạn thường lên [orange]+260%[] (Gấp 2.6 lần).[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead){
                        core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                // Nhánh 2: MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("Chuyển đổi sang lõi cấu trúc trọng lực thô tuần hoàn:\n" +
                                 " [white]• Tăng cực đại [green]+80% Máu[] (2,610) nhưng giảm tầm bắn [red]-20%[] (240 px).[]\n" +
                                 " [white]• Cơ chế tuần hoàn mới: Bắn liên tiếp [orange]3 phát tia Laser[] siêu tải (18.00 đm), giãn cách [cyan]1.2 giây[] mỗi phát.[]\n" +
                                 " [white]• Bão hòa chu kỳ: Xả bão đạn gồm [pink]100 viên Trọng Đạn[] tự dẫn đường (27.00 đm), tốc độ bay giảm [red]-20%[]. Nghỉ hồi nạp lại [cyan]1.2 giây[].[]\n" +
                                 " [white]• [scarlet]Lưu ý:[] Loại bỏ hoàn toàn cơ chế tích tụ sạc đạn chùm tỏa và trạng thái nộ cũ.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2B.copper && core.items.get(Items.lead) >= reqMK2B.lead && core.items.get(Items.titanium) >= reqMK2B.titanium){
                        core.items.remove(Items.copper, reqMK2B.copper); core.items.remove(Items.lead, reqMK2B.lead); core.items.remove(Items.titanium, reqMK2B.titanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                // Bố cục xếp dọc chuẩn Lavunder bằng ScrollPane
                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp tháp pháo Dor");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG DOR ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // --- NÚT THÔNG TIN ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Dor: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,450[]\n" +
                          "📐 Kích thước khối:[] [white]3x3[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]300 pixel[]\n" +
                          "Sát thương đạn gốc:[] [yellow]12.00[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc/đội[]\n\n" +
                          "[sky]⚡ CƠ CHẾ HOẠT ĐỘNG XUNG ĐIỆN:[]\n" +
                          "• [lightgray]Chế độ Sạc:[] Chu kỳ sạc diễn ra mỗi [yellow]1.0 giây[]. Tích đủ điện tự động bắn ra loạt [cyan]10 viên đạn chùm tỏa[] (Sát thương [white]21.00[]/viên).\n" +
                          "• [lightgray]Trạng thái Nộ (Berserk):[] Khi xả đủ [yellow]3 loạt đạn sạc chùm[], kích hoạt trạng thái cuồng bạo trong [yellow]5.0 giây[]. Tốc độ bắn đạn thường tăng thêm [green]+50%[] (Gấp 1.5 lần tốc độ gốc).";
            } 
            else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,885 [lime](+30%)[]\n" +
                          "📐 Kích thước khối:[] [white]3x3[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]390 pixel [lime](+30%)[]\n" +
                          "Sát thương đạn gốc:[] [yellow]21.00 [lime](+75%)[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc/đội[]\n\n" +
                          "[lime]⚡ CƠ CHẾ HOẠT ĐỘNG NÂNG CAO:[]\n" +
                          "• [lightgray]Sạc tốc độ cao:[] Thời gian sạc giảm [green]-20%[] còn [yellow]0.8 giây[], giải phóng loạt bão đạn tỏa lên tới [sky]20 viên[] (Sát thương [white]25.50[]/viên).\n" +
                          "• [lightgray]Nộ mở rộng:[] Chu kỳ tích nộ rút ngắn chỉ cần [yellow]2 loạt đạn sạc[]. Thời gian nộ tăng lên [green]6.0 giây[], cường hóa hỏa lực đạn thường siêu tốc đạt [orange]260%[] (Gấp 2.6 lần).";
            } 
            else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,610 [lime](+80%)[]\n" +
                          "📐 Kích thước khối:[] [white]3x3[]\n" +
                          "Tầm bắn hiệu dụng:[] [red]240 pixel (-20%)[]\n" +
                          "Sát thương tuần hoàn:[] [yellow]Laser: 18.00 | Trọng Đạn: 27.00[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc/đội[]\n\n" +
                          "[purple]🔥 CƠ CHẾ HOẠT ĐỘNG TUẦN HOÀN TRỌNG LỰC:[]\n" +
                          "• Loại bỏ hoàn toàn cơ chế tích tụ sạc đạn chùm và thanh nộ cuồng bạo.\n" +
                          "• [lightgray]Giai đoạn Tích Điện:[] Bắn ra [orange]3 phát tia Laser[] liên tiếp, giãn cách hồi giữa mỗi phát bắn là [cyan]1.2 giây[].\n" +
                          "• [lightgray]Giai đoạn Giải Phóng:[] Ngay sau phát Laser thứ 3, kích nổ mạch xả liên hoàn chuỗi [pink]100 viên Trọng Đạn[] khổng lồ có tự dẫn đường. Vận tốc đạn bay chậm đi [red]-20%[]. Khi dứt chuỗi, hệ thống tốn [cyan]1.2 giây[] ngắt nhiệt hồi nạp chu kỳ.";
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

        if(tier == 2){
            if (this.burstTimer > 0) {
                if (this.isShooting && this.hasAmmo()) { this.reloadCounter += this.block.reload; }
            } else {
                if (this.customReloadTimer > 0) {
                    this.customReloadTimer -= Time.delta;
                    this.reloadCounter = 0; 
                }
            }
        } else {
            let speedBoost = (tier == 1) ? 2.6 : 1.5;
            let currentChargeMax = (tier == 1) ? CHARGE_TIME_MK2 : CHARGE_TIME_MK1;

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

        if(tier == 2){
            if(this.burstTimer > 0){
                this.super$shoot(normalBulletB); 
                this.rotation += Mathf.range(45); 
                this.burstShotsFired++;

                if(this.burstShotsFired >= 100){ 
                    this.burstTimer = 0;
                    this.burstShotsFired = 0;
                    this.laserCount = 0; 
                    this.customReloadTimer = CHARGE_TIME_MK2B; 
                }
            } 
            else {
                if (this.customReloadTimer <= 0) {
                    this.super$shoot(laserBulletB); 
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

        let currentChargeMax = (tier == 1) ? CHARGE_TIME_MK2 : CHARGE_TIME_MK1;
        let currentBerserkMax = (tier == 1) ? BERSERK_TIME_MK2 : BERSERK_TIME_MK1;
        let activeNormalBullet = (tier == 1) ? dormk2NormalBullet : dorNormalBullet;
        let requiredSuperShots = (tier == 1) ? 2 : 3;

        if (this.chargeTimer >= currentChargeMax && this.berserkTimer <= 0) {
            Fx.lightningCharge.at(this.x, this.y);
            
            if(tier == 1){
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
                
                if(tier == 1) {
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
