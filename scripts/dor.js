
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
                let dialog = extend(BaseDialog, "Nâng Cấp Chuỗi Hệ Thống Dor", {});
                
                let titleCell = dialog.cont.add("[gold]=== TIẾN HÓA LÕI THÁP PHÁO DOR ===[]");
                titleCell.row(); titleCell.padBottom(10);
                
                let labelCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentcopper = core.items.get(Items.copper);
                    let currentlead = core.items.get(Items.lead);
                    let currenttitanium = core.items.get(Items.titanium);
                    
                    let titColor1 = currentcopper >= reqMK2.copper ? "[green]" : "[red]";
                    let silColor1 = currentlead >= reqMK2.lead ? "[green]" : "[red]";
                    
                    let titColor2 = currentcopper >= reqMK2B.copper ? "[green]" : "[red]";
                    let silColor2 = currentlead >= reqMK2B.lead ? "[green]" : "[red]";
                    let plaColor2 = currenttitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[] copper: " + titColor1 + reqMK2.copper + "[]/" + currentcopper + " | lead: " + silColor1 + reqMK2.lead + "[]/" + currentlead + "\n" +
                           "[purple]Nhánh MK2B:[] copper: " + titColor2 + reqMK2B.copper + "[]/" + currentcopper + " | lead: " + silColor2 + reqMK2B.lead + "[]/" + currentlead + " | titanium: " + plaColor2 + reqMK2B.titanium + "[]/" + currenttitanium;
                }));
                labelCell.row(); labelCell.padBottom(20);

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12, 16, 12, 16);
                let b1T = b1.add("[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]"); b1T.row(); b1T.padBottom(6);
                let b1D = b1.add("[lightgray]Máu tăng lên 1885 (+30%), Tầm bắn mở rộng lên 390 (+30%).\nĐạn thường +75% sát thương (21) và +30% vận tốc (9.1).\nRút ngắn 20% thời gian sạc đạn chùm (0.8s) và tăng 20% thời gian cuồng bạo (6s).[]"); b1D.row(); b1D.padBottom(10);
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead){
                        core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(200, 40);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12, 16, 12, 16);
                let b2T = b2.add("[purple]BIẾN THỂ TRỌNG PHÁO (MK2B)[]"); b2T.row(); b2T.padBottom(6);
                let b2D = b2.add("[lightgray]Tầm bắn giảm còn 240 (-20%), bù lại cấu trúc gia cố Máu siêu khủng 2610 (+80%).\nĐạn biến đổi thành Trọng Đạn khổng lồ: Sát thương đột biến +275% (45).\nVận tốc bay giảm 20% (5.6). Không còn cơ chế bắn chùm và cuồng bạo.[]"); b2D.row(); b2D.padBottom(10);
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2B.copper && core.items.get(Items.lead) >= reqMK2B.lead && core.items.get(Items.titanium) >= reqMK2B.titanium){
                        core.items.remove(Items.copper, reqMK2B.copper); core.items.remove(Items.lead, reqMK2B.lead); core.items.remove(Items.titanium, reqMK2B.titanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(200, 40);

                branchesTable.add(b1).width(320); branchesTable.row();
                let spaceCell = branchesTable.add(); spaceCell.height(20); spaceCell.row();
                branchesTable.add(b2).width(320);
                dialog.cont.add(branchesTable);

                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Tiến hóa tháp pháo Dor");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA CỦA NHÁNH ĐÃ CHỌN![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = "📊 THÔNG SỐ PHÁO DOR: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow]Cấu hình trạng thái gốc (MK1):[]\n\n";
                descStr = "[accent]⚙️ CƠ BẢN:[] Đạn tiêu chuẩn: [lightgray]12 Sát thương[] | Đạn chùm: [lightgray]4 Sát thương[]\n | 1,450 HP | Tầm bắn: 300\n\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "[sky]⚡ ĐẶC TÍNH HOẠT ĐỘNG:[]\n" +
                          "• Cơ chế: Mỗi 1.0 giây sạc bắn ra một loạt 10 viên đạn chùm tỏa.\n" +
                          "• Nộ (Berserk): Tích đủ 3 loạt đạn chùm kích hoạt trạng thái cuồng bạo tăng mạnh hỏa lực trong [yellow]5[] giây.";
            } 
            else if (currentTier == 1) {
                title += "[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]";
                descStr = "[accent]⚙️ NÂNG CẤP:[] Đạn cường hóa: [lightgray]21 Sát thương [yellow](+75%)[] | Đạn chùm: [lightgray]7.2 Sát thương [yellow](+80%)[]\n | 1,885 HP [yellow](+30%)[] | Tầm bắn: 390 [yellow](+30%)[]\n\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "[lime]⚡ ĐẶC TÍNH NHÁNH TIÊU CHUẨN:[]\n" +
                          "• Sạc chùm tốc độ cao: Thời gian sạc giảm [yellow]20%[] còn [yellow]0.8s[], giải phóng loạt 20 viên đạn chùm.\n" +
                          "• Cuồng bạo mở rộng: Thời gian duy trì trạng thái Berserk tăng thêm [yellow]20%[] thành [yellow]6[] giây.";
            } 
            else if (currentTier == 2) {
                title += "[purple]BIẾN THỂ TRỌNG PHÁO (MK2B)[]";
                descStr = "[accent]⚙️ NÂNG CẤP:[] Siêu trọng đạn: [lightgray]45 Sát thương [yellow](+275%)[]\n | 2,610 HP [yellow](+80%)[] | Tầm bắn: 240 [coral](-20%)[]\n\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "[purple]🔥 ĐẶC TÍNH PHÁ PHÁO NẶNG:[]\n" +
                          "• Hỏa lực: Kích thước đạn tăng mạnh cực đại, vận tốc bay chậm đi [coral]20%[].\n" +
                          "• Lưu ý: Hệ thống lõi chuyển đổi sang thuần sát thương thô, loại bỏ hoàn toàn cơ chế tích tụ xung điện sạc đạn phụ tỏa và nộ cuồng bạo.";
            }

            let dialog = extend(BaseDialog, title, {});
            let cell = dialog.cont.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem chi tiết thông số trạng thái");
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
                if (this.isShooting() && this.hasAmmo()) { this.reloadCounter += this.block.reload; }
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
                
                if (this.isShooting() && this.hasAmmo()) {
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