const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// Chi phí nâng cấp tháp pháo Blaw
const reqBlawMK2 = { copper: 4000, lead: 4000, titanium: 0 };
const reqBlawMK2B = { copper: 4000, lead: 4000, titanium: 2000 };

// ==========================================
// THIẾT LẬP ĐẠN BĂNG LỬA CẢI TIẾN
// ==========================================

var doubleSparks = extend(ParticleEffect, {
    particles: 4,
    line: true,
    length: 11,
    lifetime: 10,
    lenFrom: 8,
    lenTo: 1,
    strokeFrom: 1,
    cone: 45,
    strokeTo: 1,
    colorFrom: Color.valueOf("ffe18f"),
    colorTo: Color.valueOf("ffe18f"),
});

var mirrorSparks = extend(RadialEffect, {
    rotationSpacing: 180,
    amount: 2,
    effect: doubleSparks,
});

// --- CẤP MK1 ---
const blawBlueMK1 = extend(BasicBulletType, {
    speed: 2.5, damage: 200, width: 9, height: 22, lifetime: 140,
    sprite: "newex-diamond-shard",
    hitEffect: mirrorSparks,
    despawnEffect: mirrorSparks,
    trailEffect: mirrorSparks,
    smokeEffect: Fx.shootBigSmoke,
    frontColor: Color.valueOf("0031FFFF"), backColor: Color.white,
    trailColor: Color.valueOf("E8DBDBFF"), trailWidth: 2, trailLength: 8,
    trailInterval: 2.0,
    status: StatusEffects.freezing, statusDuration: 600,
    textLength: 0, 
    piece: true, pierceCap: 3
});

const blawRedMK1 = extend(BasicBulletType, {
    speed: 2.5, damage: 200, width: 9, height: 22, lifetime: 140,
    frontColor: Color.valueOf("FF0000FF"), backColor: Color.white, 
    trailColor: Color.valueOf("E8DBDBFF"), trailWidth: 2, trailLength: 8,
    trailEffect: Fx.smoke, trailInterval: 2.0,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    splashDamage: 80, splashDamageRadius: 24, 
    status: StatusEffects.blasted, statusDuration: 80
});

// --- CẤP MK2 ---
const blawBlueMK2 = extend(BasicBulletType, {
    speed: 2.8, damage: 200, width: 10, height: 24, lifetime: 160,
    frontColor: Color.valueOf("0031FFFF"), backColor: Color.white,
    trailColor: Color.valueOf("0031FFFF"), trailWidth: 2.2, trailLength: 10,
    trailEffect: Fx.smoke, trailInterval: 1.8,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    status: StatusEffects.freezing, statusDuration: 600,
    pierce: true, pierceCap: 3
});

const blawRedMK2 = extend(BasicBulletType, {
    speed: 2.8, damage: 200, width: 10, height: 24, lifetime: 160,
    frontColor: Color.valueOf("FF0000FF"), backColor: Color.white,
    trailColor: Color.valueOf("FF0000FF"), trailWidth: 2.2, trailLength: 10,
    trailEffect: Fx.smoke, trailInterval: 1.8,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    splashDamage: 120, splashDamageRadius: 32,
    status: StatusEffects.blasted, statusDuration: 80
});

// --- CẤP MK2B ---
const blawBlueBulletMK2B = extend(BasicBulletType, {
    speed: 12.2, damage: 220, width: 5, height: 12, lifetime: 10,
    frontColor: Color.valueOf("0031FFFF"), backColor: Color.white, 
    trailColor: Color.valueOf("0031FFFF"), trailWidth: 1.5, trailLength: 6,
    trailEffect: Fx.smoke, trailInterval: 2.5,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    pierce: true, pierceCap: 2,
    status: StatusEffects.freezing, statusDuration: 300
});

const blawRedBulletMK2B = extend(BasicBulletType, {
    speed: 12.2, damage: 220, width: 5, height: 12, lifetime: 10,
    frontColor: Color.valueOf("FF5A00FF"), backColor: Color.white, 
    trailColor: Color.valueOf("FF5A00FF"), trailWidth: 1.5, trailLength: 6,
    trailEffect: Fx.smoke, trailInterval: 2.5,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    splashDamage: 40, splashDamageRadius: 16,
    status: StatusEffects.blasted, statusDuration: 80
});

// ==========================================
// KHỔI TẠO THÁP PHÁO BLAW
// ==========================================
let blaw = extend(ItemTurret, "blaw", {
    squareSprite: false,
    basePrefix: "reinforced-", 
    
    load(){
        this.super$load();
        this.leftBarrelRegion = Core.atlas.find(this.name + "-at");
        this.rightBarrelRegion = Core.atlas.find(this.name + "-ap");
        this.customBaseRegion = Core.atlas.find(this.basePrefix + "block-" + this.size);
    }
});

blaw.health = 3000;
blaw.size = 3;
blaw.reload = 30; 
blaw.deadZone = 0; 
blaw.configurable = true;
blaw.category = Category.turret;
blaw.ammo(Items.lead, blawBlueMK1); 

blaw.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

// ==========================================
// LOGIC ĐIỀU KHIỂN CHI TIẾT (BUILD TYPE)
// ==========================================
blaw.buildType = () => extend(ItemTurret.ItemTurretBuild, blaw, {
    tierState: 0,
    barrelSide: false, 
    shotgunTimer: 0, 
    shotCount: 0,    
    
    recoilLeft: 0,
    recoilRight: 0,
    limitCheck: 0, // Biến đếm thời gian kiểm tra giới hạn

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        if(val == 0) this.health = 3000;
        if(val == 1) this.health = 3000;
        if(val == 2) this.health = 4500; 
        this.maxHealth = this.health;
        this.shotCount = 0;
    },

    range(){
        let tier = this.getTier();
        let baseRange = 260; 
        if(tier == 1) return baseRange * 1.5; 
        if(tier == 2) return baseRange * 0.7; 
        return baseRange;
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Blaw", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentCopper = core.items.get(Items.copper);
                    let currentLead = core.items.get(Items.lead);
                    let currentTitanium = core.items.get(Items.titanium);
                    
                    let copColor1 = currentCopper >= reqBlawMK2.copper ? "[green]" : "[red]";
                    let leaColor1 = currentLead >= reqBlawMK2.lead ? "[green]" : "[red]";
                    
                    let copColor2 = currentCopper >= reqBlawMK2B.copper ? "[green]" : "[red]";
                    let leaColor2 = currentLead >= reqBlawMK2B.lead ? "[green]" : "[red]";
                    let titColor2 = currentTitanium >= reqBlawMK2B.titanium ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[]\n" +
                           " • Đồng: " + copColor1 + currentCopper + "[] / " + reqBlawMK2.copper + "\n" +
                           " • Chì: " + leaColor1 + currentLead + "[] / " + reqBlawMK2.lead + "\n" +
                           "[purple]Nhánh MK2B:[]\n" +
                           " • Đồng: " + copColor2 + currentCopper + "[] / " + reqBlawMK2B.copper + "\n" +
                           " • Chì: " + leaColor2 + currentLead + "[] / " + reqBlawMK2B.lead + "\n" +
                           " • Titan: " + titColor2 + currentTitanium + "[] / " + reqBlawMK2B.titanium;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // Nhánh 1: MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("Cải tiến lõi đạn Băng Hỏa tầm xa tối ưu:\n" +
                                 " [white]• Tầm bắn tăng mạnh [green]+50%[] (Đạt mốc 390 px).[]\n" +
                                 " [white]• Tốc độ hồi nòng gia tăng cố định [green]+20%[].[]\n" +
                                 " [white]• [sky]Băng giá MK2:[] Sát thương 200, xuyên [yellow]3 mục tiêu[] + Đóng băng 10s.[]\n" +
                                 " [white]• [scarlet]Hỏa ngục MK2:[] Sát thương 200 + Nổ lan [yellow]120 DMG[] (Bán kính 32).[]\n" +
                                 " [white]• [orange]Khuếch đại Anti-Tank:[] Mục tiêu có +100 máu tăng [green]+2% DMG[], tăng thêm [green]+1%[] hỏa lực cho mỗi 1000 máu tiếp theo.[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqBlawMK2.copper && core.items.get(Items.lead) >= reqBlawMK2.lead){
                        core.items.remove(Items.copper, reqBlawMK2.copper); core.items.remove(Items.lead, reqBlawMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                // Nhánh 2: MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("Chuyển hóa cấu trúc phòng thủ cận chiến hạng nặng:\n" +
                                 " [white]• Gia cố kết cấu: Máu tháp pháo tăng vọt lên [green]4,500 HP[] (Tăng [green]+150%[]).[]\n" +
                                 " [white]• Tầm bắn co cụm bóp giảm mạnh [red]-30%[] (Còn 182 px) để tập trung hỏa lực.[]\n" +
                                 " [white]• Khai hỏa bùng nổ giải phóng đồng thời [yellow]20 viên đạn hỗn hợp[] góc rộng (220 DMG/viên).[]\n" +
                                 " [white]• [orange]Đột biến vạch máu:[] Mục tiêu có +100 máu tăng [pink]+5% Sát thương[] dồn vô hạn![]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqBlawMK2B.copper && core.items.get(Items.lead) >= reqBlawMK2B.lead && core.items.get(Items.titanium) >= reqBlawMK2B.titanium){
                        core.items.remove(Items.copper, reqBlawMK2B.copper); core.items.remove(Items.lead, reqBlawMK2B.lead); core.items.remove(Items.titanium, reqBlawMK2B.titanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                // Xếp các bảng nhánh theo hàng dọc
                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp chuỗi hệ thống Blaw");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo(tier == 1 ? "[cyan]HỆ THỐNG ĐANG HOẠT ĐỘNG Ở CẤU HÌNH BLAW MK2![]" : "[purple]HỆ THỐNG ĐANG HOẠT ĐỘNG Ở CẤU HÌNH BLAW MK2B![]");
            })).size(50, 40).tooltip("Hệ thống đã đạt giới hạn tiến hóa");
        }

        // --- NÚT THÔNG TIN ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Blaw: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1 MẶC ĐỊNH) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]3,000 HP[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]260 pixel[]\n" +
                          "Sát thương cơ bản:[] [white]200 DMG[]\n\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 1 cấu trúc/đội[]\n\n" +
                          "[sky]🔄 CƠ CHẾ HOẠT ĐỘNG NÒNG NHỊP ĐIỆU:[]\n" +
                          "• Bắn luân phiên thay đổi liên tục giữa 2 dòng đạn Băng và Hỏa.\n" +
                          "• [lightgray]Gia tốc nạp ngẫu nhiên:[] Tốc độ hồi nòng biến thiên liên tục khi xả hỏa lực.\n\n" +
                          "[orange]📈 CƠ CHẾ SÁT THƯƠNG THEO MÁU (ANTI-TANK):[]\n" +
                          "• Khi mục tiêu vượt trên 100 máu: Cứ mỗi [green]+100 HP[] của mục tiêu sẽ kích hoạt tăng thêm [cyan]+1% Sát thương tổng[] thực tế.";
            } 
            else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2 TIẾN HÓA) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]3,000 HP[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]390 pixel [lime](+50%)[]\n" +
                          "Tốc độ nạp hồi nòng:[] [lime]Tăng cố định +20%[]\n\n" +
                          "[sky]❄️ THUỘC TÍNH ĐẠN XANH LAM (BĂNG PHÁO):[]\n" +
                          "• Sát thương gốc: 200 | Khả năng [yellow]Xuyên thấu tối đa 3 mục tiêu[].\n" +
                          "• Khi trúng đích áp đặt trạng thái [freeze] Đóng băng (Freezing)[] làm chậm trong 10 giây.\n\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 1 cấu trúc/đội[]\n\n" +
                          "[scarlet]🔥 THUỘC TÍNH ĐẠN ĐỎ RỰC (HỎA PHÁO):[]\n" +
                          "• Sát thương gốc: 200 | Sát thương nổ lan: [orange]120 DMG[] (Bán kính: 32).\n" +
                          "• Áp hiệu ứng trạng thái cấu rỉa bùng nổ.\n\n" +
                          "[orange]📈 CƠ CHẾ SÁT THƯƠNG THEO MÁU VƯỢT TRỘI:[]\n" +
                          "• Mục tiêu vượt trên 100 máu: Cứ mỗi [green]+100 HP[] sẽ tăng [cyan]+2% Sát thương tổng[].\n" +
                          "• Đặc quyền MK2: Mục tiêu siêu khủng vượt trên 1000 máu sẽ được cộng dồn thêm [cyan]+1% Sát thương[] cho mỗi 1000 HP tiếp theo!";
            } 
            else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B SHOTGUN) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]4,500 HP [lime](+150%)[]\n" +
                          "Tầm bắn hiệu dụng:[] [red]182 pixel (-30%)[]\n" +
                          "Sát thương mảnh đạn:[] [pink]220 DMG / viên[]\n\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 1 cấu trúc/đội[]\n\n" +
                          "[purple]🍇 CƠ CHẾ KHAI HỎA CHU KỲ SHOTGUN CẬN CHIẾN:[]\n" +
                          "• Bắn liên tiếp luân phiên 2 phát (Phát 1: Nòng trái phóng chùm 10 viên đạn xanh | Phát 2: Nòng phải phóng chùm 10 viên đạn đỏ).\n" +
                          "• [yellow]Cứ sau khi xả hết 2 phát (1 băng đạn), pháo sẽ nghỉ đúng 3 giây (180 ticks)[] để nạp lượt kế tiếp.\n" +
                          "• Mảnh đạn Shotgun thừa hưởng trọn vẹn các hiệu ứng trạng thái của đạn MK2.\n\n" +
                          "[orange]📈 CƠ CHẾ SÁT THƯƠNG ĐỘT BIẾN THEO MÁU:[]\n" +
                          "• Cứ mỗi [green]+100 HP[] vượt thêm của mục tiêu sẽ tăng mạnh [pink]+5% Sát thương[] dồn vô hạn!";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem thông số chi tiết hệ thống pháo");
    }
,
    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
        // --- ĐOẠN CODE THÊM VÀO: GIỚI HẠN XÂY DỰNG TỐI ĐA LÀ 1 ---
        this.limitCheck += Time.delta;
        if(this.limitCheck >= 15){
            this.limitCheck = 0; let count = 0; let firstBuild = null;
            Groups.build.each(b => {
                if(b.block == blaw && b.team == this.team) { 
                    count++; if(firstBuild == null) firstBuild = b; 
                }
            });
            if(count > 1 && this !== firstBuild){
                Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 1 tháp pháo Blaw! Cấu trúc thừa đã tự hủy![]"); 
                this.kill(); return;
            }
        }
        // ---------------------------------------------------------

        this.super$updateTile();
        let tier = this.getTier();
        
        if(tier == 2 && this.shotgunTimer > 0) {
            this.shotgunTimer -= Time.delta;
        }

        if(this.recoilLeft > 0) this.recoilLeft = Math.max(0, this.recoilLeft - Time.delta * 0.1);
        if(this.recoilRight > 0) this.recoilRight = Math.max(0, this.recoilRight - Time.delta * 0.1);

        if(this.isShooting && this.hasAmmo()){
            let randomBoost = Mathf.random(0.0, 2.0); 
            this.reloadCounter += Time.delta * randomBoost * this.efficiency;

            if(tier == 1){
                this.reloadCounter += Time.delta * 0.2 * this.efficiency;
            }
        }
    },

    shoot(type){
        let tier = this.getTier();
        
        if(tier == 2 && this.shotgunTimer > 0) {
            return; 
        }

        let damageMultiplier = 1.0;
        let targetEnt = this.target;
        if (targetEnt != null && targetEnt.health !== undefined) {
            let targetHp = targetEnt.health;
            if (tier == 0) {
                if (targetHp > 100) {
                    let extraHp = targetHp - 100;
                    damageMultiplier += Math.floor(extraHp / 100) * 0.01;
                }
            } 
            else if (tier == 1) {
                if (targetHp > 100) {
                    let extraHp = targetHp - 100;
                    damageMultiplier += Math.floor(extraHp / 100) * 0.02;
                }
                if (targetHp > 1000) {
                    let extraHp1000 = targetHp - 1000;
                    damageMultiplier += Math.floor(extraHp1000 / 1000) * 0.01;
                }
            } 
            else if (tier == 2) {
                if (targetHp > 100) {
                    let extraHp = targetHp - 100;
                    damageMultiplier += Math.floor(extraHp / 100) * 0.05;
                }
            }
        }

        this.barrelSide = !this.barrelSide;
        
        if(this.barrelSide) {
            this.recoilLeft = 1.0;
        } else {
            this.recoilRight = 1.0;
        }

        let offsetDistance = 6; 
        let angleRad = (this.rotation + (this.barrelSide ? 90 : -90)) * Mathf.degRad; 
        let spawnX = this.x + Math.cos(angleRad) * offsetDistance;
        let spawnY = this.y + Math.sin(angleRad) * offsetDistance;

        let baseAngleRad = this.rotation * Mathf.degRad;
        let baseCos = Math.cos(baseAngleRad);
        let baseSin = Math.sin(baseAngleRad);
        let sideAngleRad = (this.rotation + 90) * Mathf.degRad;
        let ballSideCos = Math.cos(sideAngleRad) * 6; 
        let ballSideSin = Math.sin(sideAngleRad) * 6;
        let backOffset = 3; 

        if(this.barrelSide) {
            let bxLeft = this.x + ballSideCos - baseCos * backOffset;
            let byLeft = this.y + ballSideSin - baseSin * backOffset;
            mirrorSparks.at(bxLeft, byLeft);
        } else {
            let bxRight = this.x - ballSideCos - baseCos * backOffset;
            let byRight = this.y - ballSideSin - baseSin * backOffset;
            Fx.smoke.at(bxRight, byRight);
        }

        if (tier == 2) {
            let calculatedDmg = 220 * damageMultiplier;
            let selectedShotgunBullet = this.barrelSide ? blawBlueBulletMK2B : blawRedBulletMK2B;

            for(let i = 0; i < 10; i++){
                let randomSpeed = Mathf.random(1.5, 3.5); 
                let randomSpread = Mathf.range(15); 
                Call.createBullet(selectedShotgunBullet, this.team, spawnX, spawnY, this.rotation + randomSpread, calculatedDmg, randomSpeed, 1.0);
            }

            this.shotCount++;
            if(this.shotCount >= 2) {
                this.shotgunTimer = 180; 
                this.shotCount = 0; 
            }
        } else {
            let selectedBulletType;
            if (tier == 1) {
                selectedBulletType = this.barrelSide ? blawBlueMK2 : blawRedMK2;
            } else {
                selectedBulletType = this.barrelSide ? blawBlueMK1 : blawRedMK1;
            }
            
            let finalDmg = selectedBulletType.damage * damageMultiplier;
            Call.createBullet(selectedBulletType, this.team, spawnX, spawnY, this.rotation, finalDmg, selectedBulletType.speed, 1.0);
        }
    },

    draw(){
        // 1. Vẽ đế pháo trước
        if(blaw.customBaseRegion != null && blaw.customBaseRegion.found()){
            Draw.rect(blaw.customBaseRegion, this.x, this.y);
        } else {
            Draw.rect(blaw.baseRegion, this.x, this.y);
        }
        
        let angleRad = this.rotation * Mathf.degRad;
        let cos = Math.cos(angleRad);
        let sin = Math.sin(angleRad);
        
        let sideAngleRad = (this.rotation + 90) * Mathf.degRad;
        let sideCos = Math.cos(sideAngleRad) * 0;
        let sideSin = Math.sin(sideAngleRad) * 0;

        let recoilLength = 4; 

        let rxLeft = this.x + sideCos - cos * (this.recoilLeft * recoilLength);
        let ryLeft = this.y + sideSin - sin * (this.recoilLeft * recoilLength);

        let rxRight = this.x - sideCos - cos * (this.recoilRight * recoilLength);
        let ryRight = this.y - sideSin - sin * (this.recoilRight * recoilLength);

        // 2. Vẽ nòng Trái
        if(blaw.leftBarrelRegion != null && blaw.leftBarrelRegion.found()){
            Draw.rect(blaw.leftBarrelRegion, rxLeft, ryLeft, this.rotation - 90);
        }

        // 3. Vẽ nòng Phải
        if(blaw.rightBarrelRegion != null && blaw.rightBarrelRegion.found()){
            Draw.rect(blaw.rightBarrelRegion, rxRight, ryRight, this.rotation - 90);
        }

        // 4. Vẽ đỉnh tháp pháo đè lên nòng
        if(blaw.region != null && blaw.region.found()){
            Draw.rect(blaw.region, this.x, this.y, this.rotation - 90);
        }

        // ========================================================
        // THIẾT KỂ ĐỒ HỌA MỚI: LÕI MA THUẬT CỰC HẠN (SIÊU ĐẸP & GIẢM 50% SIZE)
        // ========================================================
        let ballSideCos = Math.cos(sideAngleRad) * 6; 
        let ballSideSin = Math.sin(sideAngleRad) * 6;
        let backOffset = 3; 

        let bxLeft = (this.x - cos * (this.recoilLeft * recoilLength)) + ballSideCos - cos * backOffset;
        let byLeft = (this.y - sin * (this.recoilLeft * recoilLength)) + ballSideSin - sin * backOffset;
        
        let bxRight = (this.x - cos * (this.recoilRight * recoilLength)) - ballSideCos - cos * backOffset;
        let byRight = (this.y - sin * (this.recoilRight * recoilLength)) - ballSideSin - sin * backOffset;

        // Giảm kích thước xuống một nửa (~1.5 pixel)
        let baseRadius = 1.5; 
        let timeRotation = Time.time * 2.5; // Tốc độ xoay tự nhiên của lõi năng lượng

        Draw.draw(Layer.effect + 1, packRun(() => {
            
            // --- Cơ chế Đồ họa Nòng bên trái (Lõi Năng lượng Băng Lam) ---
            let zoomLeft = baseRadius * (1.0 + this.recoilLeft * 1.5);
            let rotLeft = timeRotation * (1.0 + this.recoilLeft * 2.0); // Bắn càng nhanh xoay càng tợn
            
            // Lớp 1: Hào quang nền nhấp nháy (Glow Aura)
            Draw.color(Color.valueOf("0031FFFF"), 0.35 + Math.sin(Time.time * 0.1) * 0.15);
            Fill.circle(bxLeft, byLeft, zoomLeft * 2.5);
            
            // Lớp 2: Vòng quỹ đạo Ma trận vuông 1 (Orbit Ring A)
            Draw.color(Color.valueOf("00A2FFFF"));
            Lines.stroke(0.6);
            Lines.poly(bxLeft, byLeft, 4, zoomLeft * 2.0, rotLeft);
            
            // Lớp 3: Vòng quỹ đạo Ma trận vuông 2 xoay ngược (Orbit Ring B)
            Lines.poly(bxLeft, byLeft, 4, zoomLeft * 1.5, -rotLeft * 1.4);
            
            // Lớp 4: Nhụy lõi sáng đặc (Core Flare)
            Draw.color(Color.white);
            Fill.circle(bxLeft, byLeft, zoomLeft);


            // --- Cơ chế Đồ họa Nòng bên phải (Lõi Năng lượng Hỏa Ngục) ---
            let zoomRight = baseRadius * (1.0 + this.recoilRight * 1.5);
            let rotRight = timeRotation * (1.0 + this.recoilRight * 2.0);
            
            // Lớp 1: Hào quang nền nhấp nháy (Glow Aura)
            Draw.color(Color.valueOf("FF3B00FF"), 0.35 + Math.sin(Time.time * 0.1) * 0.15);
            Fill.circle(bxRight, byRight, zoomRight * 2.5);
            
            // Lớp 2: Vòng quỹ đạo Ma trận vuông 1 (Orbit Ring A)
            Draw.color(Color.valueOf("FF9000FF"));
            Lines.stroke(0.6);
            Lines.poly(bxRight, byRight, 4, zoomRight * 2.0, rotRight + 45); // Lệch góc tạo khác biệt
            
            // Lớp 3: Vòng quỹ đạo Ma trận vuông 2 xoay ngược (Orbit Ring B)
            Lines.poly(bxRight, byRight, 4, zoomRight * 1.5, -rotRight * 1.4);
            
            // Lớp 4: Nhụy lõi sáng đặc (Core Flare)
            Draw.color(Color.white);
            Fill.circle(bxRight, byRight, zoomRight);
            
            Draw.reset(); 
        }));
        // ========================================================
    },

    write(write){
        this.super$write(write); write.b(this.getTier()); 
    },
    read(read, revision){
        this.super$read(read, revision); 
        this.setTier(read.b()); 
    }
});