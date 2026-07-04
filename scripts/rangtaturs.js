
const chargeTimeMax = 180;   
const berserkTimeMax = 300;  
const chargeTimeMaxMK2 = 140;   
const berserkTimeMaxMK2 = 360;  


const reqRangtatursMK2 = {
    copper: 8000,
    lead: 7000,
    silicon: 0
};

const reqRangtatursMK2B = {
    copper: 12000,
    lead: 9500,
    silicon: 5500
};


const acidCorrosionEffect = new Effect(30, cons(e => {
    Draw.color(Color.valueOf("#a3e635"), Color.valueOf("#65a30d"), e.fin());
    Lines.stroke(e.fout() * 2);
    Mathf.rand.setSeed(e.id);
    for(let i = 0; i < 5; i++){
        let len = Mathf.rand.random(2, 14) * e.fin();
        let angle = Mathf.rand.random(360);
        let size = Mathf.rand.random(1, 4) * e.fout();
        Lines.circle(e.x + Angles.trnsx(angle, len), e.y + Angles.trnsy(angle, len), size);
    }
}));


const rangtatursNormalBlasted = extend(BasicBulletType, {
    speed: 7, damage: 16, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#ffab40"), backColor: Color.valueOf("#ff6d00"), 
    trailColor: Color.valueOf("#ff6d00"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 1.2, statusDuration: 140,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion, status: StatusEffects.blasted
});
const rangtatursNormalMelting = extend(BasicBulletType, {
    speed: 7, damage: 16, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#ffa726"), backColor: Color.valueOf("#f57c00"), 
    trailColor: Color.valueOf("#f57c00"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
    hitEffect: Fx.melting, despawnEffect: Fx.melting, status: StatusEffects.melting
});
const rangtatursNormalBurning = extend(BasicBulletType, {
    speed: 7, damage: 16, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#ff7043"), backColor: Color.valueOf("#d84315"), 
    trailColor: Color.valueOf("#d84315"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
    hitEffect: Fx.fire, despawnEffect: Fx.fire, status: StatusEffects.burning
});
const rangtatursNormalFreezing = extend(BasicBulletType, {
    speed: 7, damage: 16, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#29b6f6"), backColor: Color.valueOf("#0288d1"), 
    trailColor: Color.valueOf("#0288d1"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.freezing
});
const rangtatursNormalShocked = extend(BasicBulletType, {
    speed: 7, damage: 16, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#e1bee7"), backColor: Color.valueOf("#ba68c8"), 
    trailColor: Color.valueOf("#ba68c8"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
    hitEffect: Fx.lightning, despawnEffect: Fx.lightning, status: StatusEffects.shocked
});
const rangtatursNormalWet = extend(BasicBulletType, {
    speed: 7.2, damage: 15, width: 6.5, height: 17, lifetime: 43,
    frontColor: Color.valueOf("#60a5fa"), backColor: Color.valueOf("#2563eb"), 
    trailColor: Color.valueOf("#2563eb"), trailWidth: 1.4, trailLength: 5,
    splashDamage: 10, splashDamageRadius: 24, knockback: 0.6, statusDuration: 180,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.wet
});
const rangtatursNormalCorroded = extend(BasicBulletType, {
    speed: 6.8, damage: 17, width: 7, height: 17, lifetime: 43,
    frontColor: Color.valueOf("#bef264"), backColor: Color.valueOf("#65a30d"), 
    trailColor: Color.valueOf("#65a30d"), trailWidth: 1.5, trailLength: 6,
    splashDamage: 14, splashDamageRadius: 26, knockback: 0.3, statusDuration: 160,
    hitEffect: acidCorrosionEffect, despawnEffect: acidCorrosionEffect, status: StatusEffects.corroded
});

const rangtatursNormalBullet = rangtatursNormalBlasted; 


const rangtatursmk2NormalBlasted = extend(BasicBulletType, {
    speed: 7.7, damage: 17.5, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#ffab40"), backColor: Color.valueOf("#ff6d00"),
    trailColor: Color.valueOf("#ff6d00"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 1.4, statusDuration: 140,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion, status: StatusEffects.blasted
});
const rangtatursmk2NormalMelting = extend(BasicBulletType, {
    speed: 7.7, damage: 17.5, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#ffa726"), backColor: Color.valueOf("#f57c00"),
    trailColor: Color.valueOf("#f57c00"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 0.6, statusDuration: 140,
    hitEffect: Fx.melting, despawnEffect: Fx.melting, status: StatusEffects.melting
});
const rangtatursmk2NormalBurning = extend(BasicBulletType, {
    speed: 7.7, damage: 17.5, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#ff7043"), backColor: Color.valueOf("#d84315"),
    trailColor: Color.valueOf("#d84315"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 0.6, statusDuration: 140,
    hitEffect: Fx.fire, despawnEffect: Fx.fire, status: StatusEffects.burning
});
const rangtatursmk2NormalFreezing = extend(BasicBulletType, {
    speed: 7.7, damage: 17.5, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#29b6f6"), backColor: Color.valueOf("#0288d1"),
    trailColor: Color.valueOf("#0288d1"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 0.6, statusDuration: 140,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.freezing
});
const rangtatursmk2NormalShocked = extend(BasicBulletType, {
    speed: 7.7, damage: 17.5, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#e1bee7"), backColor: Color.valueOf("#ba68c8"),
    trailColor: Color.valueOf("#ba68c8"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 0.6, statusDuration: 140,
    hitEffect: Fx.lightning, despawnEffect: Fx.lightning, status: StatusEffects.shocked
});
const rangtatursmk2NormalWet = extend(BasicBulletType, {
    speed: 7.9, damage: 16.5, width: 7.2, height: 18.5, lifetime: 43,      
    frontColor: Color.valueOf("#60a5fa"), backColor: Color.valueOf("#2563eb"),
    trailColor: Color.valueOf("#2563eb"), trailWidth: 1.55, trailLength: 6,    
    splashDamage: 12, splashDamageRadius: 28, knockback: 0.7, statusDuration: 180,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.wet
});
const rangtatursmk2NormalCorroded = extend(BasicBulletType, {
    speed: 7.5, damage: 18.5, width: 7.7, height: 18.5, lifetime: 43,      
    frontColor: Color.valueOf("#bef264"), backColor: Color.valueOf("#65a30d"),
    trailColor: Color.valueOf("#65a30d"), trailWidth: 1.65, trailLength: 7,    
    splashDamage: 17, splashDamageRadius: 30, knockback: 0.4, statusDuration: 160,
    hitEffect: acidCorrosionEffect, despawnEffect: acidCorrosionEffect, status: StatusEffects.corroded
});


const normalBulletBBlasted = extend(BasicBulletType, {
    speed: 8.5, damage: 20, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#ff5252"), backColor: Color.valueOf("#ff1744"), 
    trailColor: Color.valueOf("#ff1744"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 1.8, statusDuration: 180,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion, status: StatusEffects.blasted
});
const normalBulletBMelting = extend(BasicBulletType, {
    speed: 8.5, damage: 20, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#ffa726"), backColor: Color.valueOf("#f57c00"), 
    trailColor: Color.valueOf("#f57c00"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 0.8, statusDuration: 180,
    hitEffect: Fx.melting, despawnEffect: Fx.melting, status: StatusEffects.melting
});
const normalBulletBBurning = extend(BasicBulletType, {
    speed: 8.5, damage: 20, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#ff7043"), backColor: Color.valueOf("#d84315"), 
    trailColor: Color.valueOf("#d84315"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 0.8, statusDuration: 180,
    hitEffect: Fx.fire, despawnEffect: Fx.fire, status: StatusEffects.burning
});
const normalBulletBFreezing = extend(BasicBulletType, {
    speed: 8.5, damage: 20, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#29b6f6"), backColor: Color.valueOf("#0288d1"), 
    trailColor: Color.valueOf("#0288d1"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 0.8, statusDuration: 180,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.freezing
});
const normalBulletBShocked = extend(BasicBulletType, {
    speed: 8.5, damage: 20, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#e1bee7"), backColor: Color.valueOf("#ba68c8"), 
    trailColor: Color.valueOf("#ba68c8"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 0.8, statusDuration: 180,
    hitEffect: Fx.lightning, despawnEffect: Fx.lightning, status: StatusEffects.shocked
});
const normalBulletBWet = extend(BasicBulletType, {
    speed: 8.7, damage: 19, width: 7.5, height: 19, lifetime: 40,
    frontColor: Color.valueOf("#93c5fd"), backColor: Color.valueOf("#1d4ed8"), 
    trailColor: Color.valueOf("#1d4ed8"), trailWidth: 1.9, trailLength: 6,
    splashDamage: 18, splashDamageRadius: 36, knockback: 0.9, statusDuration: 220,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.wet
});
const normalBulletBCorroded = extend(BasicBulletType, {
    speed: 8.3, damage: 22, width: 8, height: 19, lifetime: 40,
    frontColor: Color.valueOf("#bef264"), backColor: Color.valueOf("#4d7c0f"), 
    trailColor: Color.valueOf("#4d7c0f"), trailWidth: 2, trailLength: 7,
    splashDamage: 26, splashDamageRadius: 38, knockback: 0.5, statusDuration: 200,
    hitEffect: acidCorrosionEffect, despawnEffect: acidCorrosionEffect, status: StatusEffects.corroded
});


const createLaser = (dmg, w, lt, col, st, hitEf) => {
    return extend(LaserBulletType, {
        length: 120, damage: dmg, width: w, lifetime: lt, colors: col, status: st, statusDuration: 180,
        hitEffect: hitEf, chargeEffect: Fx.lancerLaserCharge, smokeEffect: Fx.smoke
    });
};

const colorsOrange = [Color.valueOf("#ffab40"), Color.valueOf("#ff6d00"), Color.white];
const colorsBlue = [Color.valueOf("#60a5fa"), Color.valueOf("#2563eb"), Color.white];
const colorsGreen = [Color.valueOf("#bef264"), Color.valueOf("#4d7c0f"), Color.white];
const colorsRed = [Color.valueOf("#ff1744"), Color.valueOf("#b71c1c"), Color.white];

const laserMK1_Blasted  = createLaser(45, 24, 30, colorsOrange, StatusEffects.blasted, Fx.blastExplosion);
const laserMK1_Melting  = createLaser(45, 24, 30, colorsOrange, StatusEffects.melting, Fx.melting);
const laserMK1_Burning  = createLaser(45, 24, 30, colorsOrange, StatusEffects.burning, Fx.fire);
const laserMK1_Freezing = createLaser(45, 24, 30, colorsOrange, StatusEffects.freezing, Fx.freezing);
const laserMK1_Shocked  = createLaser(45, 24, 30, colorsOrange, StatusEffects.shocked, Fx.lightning);
const laserMK1_Wet      = createLaser(42, 26, 30, colorsBlue, StatusEffects.wet, Fx.freezing);
const laserMK1_Corroded = createLaser(48, 22, 30, colorsGreen, StatusEffects.corroded, acidCorrosionEffect);

const laserMK2_Blasted  = createLaser(50, 26.4, 33, colorsOrange, StatusEffects.blasted, Fx.blastExplosion);
const laserMK2_Melting  = createLaser(50, 26.4, 33, colorsOrange, StatusEffects.melting, Fx.melting);
const laserMK2_Burning  = createLaser(50, 26.4, 33, colorsOrange, StatusEffects.burning, Fx.fire);
const laserMK2_Freezing = createLaser(50, 26.4, 33, colorsOrange, StatusEffects.freezing, Fx.freezing);
const laserMK2_Shocked  = createLaser(50, 26.4, 33, colorsOrange, StatusEffects.shocked, Fx.lightning);
const laserMK2_Wet      = createLaser(46, 28.5, 33, colorsBlue, StatusEffects.wet, Fx.freezing);
const laserMK2_Corroded = createLaser(54, 24.0, 33, colorsGreen, StatusEffects.corroded, acidCorrosionEffect);

const laserB_Blasted   = createLaser(65, 28, 30, colorsRed, StatusEffects.blasted, Fx.blastExplosion);
const laserB_Melting   = createLaser(65, 28, 30, colorsRed, StatusEffects.melting, Fx.melting);
const laserB_Burning   = createLaser(65, 28, 30, colorsRed, StatusEffects.burning, Fx.fire);
const laserB_Freezing  = createLaser(65, 28, 30, colorsRed, StatusEffects.freezing, Fx.freezing);
const laserB_Shocked   = createLaser(65, 28, 30, colorsRed, StatusEffects.shocked, Fx.lightning);
const laserB_Wet       = createLaser(60, 30, 30, colorsBlue, StatusEffects.wet, Fx.freezing);
const laserB_Corroded  = createLaser(70, 26, 30, colorsGreen, StatusEffects.corroded, acidCorrosionEffect);


const handleShotgunShoot = (build, poolType, pellets, spread, damageMultiplier, speedMultiplier) => {
    let muzzleX = build.x + Angles.trnsx(build.rotation, 12);
    let muzzleY = build.y + Angles.trnsy(build.rotation, 12);

    for(let i = 0; i < pellets; i++){
        let angle = build.rotation + Mathf.range(spread);
        let r = Math.floor(Math.random() * 7); 
        let selectedBulletType = rangtatursNormalBlasted;

        if (poolType == 0) {
            if (r == 0) selectedBulletType = rangtatursNormalBlasted;
            else if (r == 1) selectedBulletType = rangtatursNormalMelting;
            else if (r == 2) selectedBulletType = rangtatursNormalBurning;
            else if (r == 3) selectedBulletType = rangtatursNormalFreezing;
            else if (r == 4) selectedBulletType = rangtatursNormalShocked;
            else if (r == 5) selectedBulletType = rangtatursNormalWet;
            else selectedBulletType = rangtatursNormalCorroded;
        } else if (poolType == 1) {
            if (r == 0) selectedBulletType = rangtatursmk2NormalBlasted;
            else if (r == 1) selectedBulletType = rangtatursmk2NormalMelting;
            else if (r == 2) selectedBulletType = rangtatursmk2NormalBurning;
            else if (r == 3) selectedBulletType = rangtatursmk2NormalFreezing;
            else if (r == 4) selectedBulletType = rangtatursmk2NormalShocked;
            else if (r == 5) selectedBulletType = rangtatursmk2NormalWet;
            else selectedBulletType = rangtatursmk2NormalCorroded;
        } else {
            if (r == 0) selectedBulletType = normalBulletBBlasted;
            else if (r == 1) selectedBulletType = normalBulletBMelting;
            else if (r == 2) selectedBulletType = normalBulletBBurning;
            else if (r == 3) selectedBulletType = normalBulletBFreezing;
            else if (r == 4) selectedBulletType = normalBulletBShocked;
            else if (r == 5) selectedBulletType = normalBulletBWet;
            else selectedBulletType = normalBulletBCorroded;
        }

        let b = selectedBulletType.create(build, build.team, muzzleX, muzzleY, angle);
        if(b != null){
            b.damage *= damageMultiplier;
            b.vel.scl((1 + Mathf.range(0.3)) * speedMultiplier);
            b.lifetime *= Mathf.random(0.7, 1.2);
        }
    }
};


const rangtaturs = extend(ItemTurret, "rangtaturs", {
    squareSprite: false,
});

rangtaturs.health = 1400; rangtaturs.size = 3; rangtaturs.reload = 95; rangtaturs.range = 240; rangtaturs.configurable = true;
rangtaturs.ammo(Items.silicon, rangtatursNormalBullet);

rangtaturs.buildType = () => extend(ItemTurret.ItemTurretBuild, rangtaturs, {
    evolutionTier: 0, 
    chargeTimer: 0, superShotCount: 0, berserkTimer: 0,
    laserCount: 0, burstTimer: 0, customReloadTimer: 0,
    checkTimer: 0, 

    buildConfiguration(table) {
        table.clear(); table.row();
        let tier = this.evolutionTier;

        // 1. NÚT NÂNG CẤP (^) - PHONG CÁCH DỌC CỦA LAVUNDER (ĐÃ SỬA LỖI RUNNABLE)
        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, () => {
                let dialog = extend(BaseDialog, "Trung Tâm Chỉnh Sửa Cấu Trúc Rangtaturs", {});
                
                dialog.cont.label(prov(() => {
                    let core = this.team.core();
                    if(!core) return "[red]Không tìm thấy Kho cốt lõi![]";
                    
                    let currentCopper = core.items.get(Items.copper);
                    let currentLead = core.items.get(Items.lead);
                    let currentSilicon = core.items.get(Items.silicon);
                    
                    let copColor1 = currentCopper >= reqRangtatursMK2.copper ? "[green]" : "[red]";
                    let ledColor1 = currentLead >= reqRangtatursMK2.lead ? "[green]" : "[red]";
                    
                    let copColor2 = currentCopper >= reqRangtatursMK2B.copper ? "[green]" : "[red]";
                    let ledColor2 = currentLead >= reqRangtatursMK2B.lead ? "[green]" : "[red]";
                    let silColor2 = currentSilicon >= reqRangtatursMK2B.silicon ? "[green]" : "[red]";

                    return "[yellow]=== CHỌN NHÁNH TIẾN HÓA RANGTATURS ===[]\n" +
                           "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[] Đồng: " + copColor1 + currentCopper + "[]/" + reqRangtatursMK2.copper + " | Chì: " + ledColor1 + currentLead + "[]/" + reqRangtatursMK2.lead + "\n" +
                           "[orange]Nhánh MK2B:[] Đồng: " + copColor2 + currentCopper + "[]/" + reqRangtatursMK2B.copper + " | Chì: " + ledColor2 + currentLead + "[]/" + reqRangtatursMK2B.lead + " | Silicon: " + silColor2 + currentSilicon + "[]/" + reqRangtatursMK2B.silicon;
                })).row(); dialog.cont.add().height(15).row();

                let branchesTable = new Table();

                // Nhánh 1: MK2 xếp dọc
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]NHÁNH 1: TIÊU CHUẨN (MK2)[]").row();
                let b1D = b1.add("Cấu hình tăng cường mật độ mảnh hỏa lực:\n" +
                                 " [white]• Mưa đạn trạng thái: Đẩy mạnh lên [green]39 viên đạn mảnh[] dải thảm.[]\n" +
                                 " [white]• Sát thương đạn thường tăng tiến lên [yellow]17.5 đơn vị[].[]\n" +
                                 " [white]• Siêu Laser tích tụ: Thời gian sạc rút ngắn còn [yellow]140 tick[].[]\n" +
                                 " [white]• Đại pháo năng lượng giải phóng sức mạnh kích nổ nhân [red]310% hỏa lực[].[]\n" +
                                 " [white]• Siêu cuồng nộ: Kéo dài thời gian Berserk mượt mà tăng tốc bắn gấp [orange]250%[].[]");
                b1D.width(360).get().setWrap(true); b1D.get().setAlignment(Align.left);
                b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", () => {
                    let core = this.team.core();
                    if(core && core.items.get(Items.copper) >= reqRangtatursMK2.copper && core.items.get(Items.lead) >= reqRangtatursMK2.lead){
                        core.items.remove(Items.copper, reqRangtatursMK2.copper);
                        core.items.remove(Items.lead, reqRangtatursMK2.lead);
                        this.evolutionTier = 1;
                        Fx.upgradeCore.at(this.x, this.y);
                        dialog.hide(); this.deselect();
                    } else {
                        Vars.ui.showInfoToast("[red]Không đủ tài nguyên nâng cấp![]", 2);
                    }
                }).size(180, 40);

                // Nhánh 2: MK2b xếp dọc ngay phía dưới
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[orange]NHÁNH 2: BÃO TỐ LOẠN TRẠNG THÁI (MK2B)[]").row();
                let b2D = b2.add("Cấu hình tối thượng hủy diệt bão đạn:\n" +
                                 " [white]• Siêu bão hỗn hợp: Loạt bắn thường xả [green]50 viên đạn[] dồn tâm cực đại.[]\n" +
                                 " [white]• Đạn thường đột biến tăng mạnh sát thương gốc lên [red]20 hỏa lực[].[]\n" +
                                 " [white]• Loại bỏ nạp đạn thường, ép chu kỳ nén riêng biệt [yellow]70 tick[] mỗi loạt.[]\n" +
                                 " [white]• Burst Mode: Tích đủ 6 phát giải phóng siêu bão [orange]100 viên đạn nén[].[]\n" +
                                 " [white]• Quá tải nhiệt làm mát hệ thống bắt buộc trong vòng [purple]180 tick[].[]");
                b2D.width(360).get().setWrap(true); b2D.get().setAlignment(Align.left);
                b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", () => {
                    let core = this.team.core();
                    if(core && core.items.get(Items.copper) >= reqRangtatursMK2B.copper && core.items.get(Items.lead) >= reqRangtatursMK2B.lead && core.items.get(Items.silicon) >= reqRangtatursMK2B.silicon){
                        core.items.remove(Items.copper, reqRangtatursMK2B.copper);
                        core.items.remove(Items.lead, reqRangtatursMK2B.lead);
                        core.items.remove(Items.silicon, reqRangtatursMK2B.silicon);
                        this.evolutionTier = 2;
                        Fx.bigShockwave.at(this.x, this.y);
                        dialog.hide(); this.deselect();
                    } else {
                        Vars.ui.showInfoToast("[red]Không đủ tài nguyên nâng cấp![]", 2);
                    }
                }).size(180, 40);

                // Ghép nối cấu hình dọc
                branchesTable.add(b1).width(360); branchesTable.row();
                branchesTable.add().height(10).row();
                branchesTable.add(b2).width(360);
                dialog.cont.add(branchesTable);
                dialog.addCloseButton(); dialog.show();
            }).size(50, 40).tooltip("Tiến hóa tháp pháo");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, () => {}).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // 2. NÚT THÔNG TIN (i) - PHONG CÁCH BỐ CỰC DOR VÀ PHÂN TÁCH BIỂU TƯỢNG GAME (ĐÃ SỬA LỖI RUNNABLE)
        table.button(Icon.info, Styles.cleari, 40, () => {
            let dialog = extend(BaseDialog, "📊 THÔNG SỐ KỸ THUẬT RANGTATURS", {});
            let currentTier = this.evolutionTier;
            let descStr = "";

            if (currentTier == 0) {
                descStr = "[cyan]⚙️ [white]Cấu Hình: [accent]MK1 (Trạng Thái Gốc)[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]" + this.health + "[]\n" +
                          "[layers] [lightgray]Kích thước khối:[] [orange]" + this.block.size + "x" + this.block.size + "[]\n" +
                          "[power] [lightgray]Năng lượng tiêu thụ:[] [gainsboro]Nội động lực tích tụ (Hộp đạn)[]\n" +
                          "[aim] [lightgray]Mục tiêu phát xạ:[] [yellow]Mặt đất[] (Không thể bắn bay)\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[orange]📌 Giới hạn điều động: Tối đa 10 cấu trúc dòng Rangtaturs toàn đội.[]\n\n" +
                          "[lightgray]Đặc tính vận hành sạc điểm và laze phụ:[]\n" +
                          "[white]• Chế độ thường: Xả loạt 9 viên Shotgun hỗn hợp mang đầy đủ 7 trạng thái dị biệt.\n" +
                          "[white]• Chu kỳ tích tụ: Sau 180 tick tự động nạp sạc, phát hỏa kế tiếp kích hoạt Đại Pháo Laser khổng lồ gây siêu sát thương đột biến nhân tiến [gold]280%[].\n" +
                          "[white]• Mạch cuồng nộ (Berserk): Tích lũy đủ 3 phát đại pháo laser đưa toàn tháp vào trạng thái quá tải, gia tăng [red]150%[] tốc hỏa lực bắn thường liên tục.";
            } else if (currentTier == 1) {
                descStr = "[cyan]⚙️ [white]Cấu Hình: [orange]MK2 (Mật Độ Mảnh Tốc Lực)[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]" + this.health + "[]\n" +
                          "[layers] [lightgray]Kích thước khối:[] [orange]" + this.block.size + "x" + this.block.size + "[]\n" +
                          "[power] [lightgray]Năng lượng tiêu thụ:[] [gainsboro]Nội động lực tích tụ (Hộp đạn)[]\n" +
                          "[aim] [lightgray]Mục tiêu phát xạ:[] [yellow]Mặt đất[] (Không thể bắn bay)\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[orange]📌 Giới hạn điều động: Tối đa 10 cấu trúc dòng Rangtaturs toàn đội.[]\n\n" +
                          "[lightgray]Đặc tính vận hành sạc điểm và laze phụ:[]\n" +
                          "[white]• Mưa đạn trạng thái: Đẩy cao số lượng đạn mảnh dải thảm lên 39 viên đạn dồn ép diện rộng.\n" +
                          "[white]• Sạc xung ngắn mạch: Thời gian tích tụ rút ngắn còn 140 tick, sát thương khuếch đại dòng laze lõi tăng vọt tới [red]310%[] hỏa lực thường.\n" +
                          "[white]• Chu kỳ Siêu cuồng nộ: Kéo dài thời gian bộc phá dồn dập, đẩy tốc độ xả đạn thường lên cực hạn đạt mức [red]250%[].";
            } else {
                descStr = "[scarlet]⚡ [white]Cấu Cấu Hình: [purple]MK2b (Siêu Bão Loạn Trạng Thái)[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]" + this.health + "[]\n" +
                          "[layers] [lightgray]Kích thước khối:[] [orange]" + this.block.size + "x" + this.block.size + "[]\n" +
                          "[power] [lightgray]Năng lượng tiêu thụ:[] [gainsboro]Nội động lực tích tụ (Hộp đạn)[]\n" +
                          "[aim] [lightgray]Mục tiêu phát xạ:[] [yellow]Mặt đất[] (Không thể bắn bay)\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[orange]📌 Giới hạn điều động: Tối đa 10 cấu trúc dòng Rangtaturs toàn đội.[]\n\n" +
                          "[lightgray]Đặc tính vận hành sạc điểm và laze phụ:[]\n" +
                          "[white]• Siêu bão hỗn hợp: Chuyển đổi loạt bắn thường sang dạng shotgun gom tâm mật độ siêu cao 50 viên đạn áp đảo.\n" +
                          "[white]• Cơ chế nén ép xung: Triệt tiêu cơ chế nạp đạn của cấu trúc game, khóa cố định chu kỳ nạp [yellow]70 tick[] mỗi loạt laze nén thông thường.\n" +
                          "[white]• Tuyệt chiêu Xả Bão (Burst Mode): Nạp tích đủ 6 chu kỳ phát phát hỏa, giải phóng siêu bão đơn cực đại chứa [red]100 viên đạn hỗn hợp[], rơi vào quá tải cưỡng bức làm mát trong [white]180 tick[].";
            }

            let cell = dialog.cont.add(descStr).width(390);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            dialog.addCloseButton(); dialog.show();
        }).size(50, 40).tooltip("Xem thông số chi tiết");
    },

    updateTile(){
        this.checkTimer += Time.delta;
        if(this.checkTimer >= 15){
            this.checkTimer = 0;
            let count = 0;      
            let firstBuild = null;
            
            Groups.build.each(b => {
                let mk2Block = Vars.content.getByName(ContentType.block, "newex-rangtatursmk2") || Vars.content.getByName(ContentType.block, "rangtatursmk2");
                let mk2bBlock = Vars.content.getByName(ContentType.block, "newex-rangtatursmk2b") || Vars.content.getByName(ContentType.block, "rangtatursmk2b");
                
                if((b.block == rangtaturs || b.block == mk2Block || b.block == mk2bBlock) && b.team == this.team) {
                    count++;
                    if(firstBuild == null) firstBuild = b;
                }
            });

            if(count > 10){
                if(this !== firstBuild){
                    Call.sendMessage("[red]Giới hạn: Chỉ được phép đặt tối đa 10 pháo thuộc dòng Rangtaturs![]");
                    this.kill(); 
                    return;    
                }
            }
        }

        this.super$updateTile();

        if(this.evolutionTier == 2){
            if (this.customReloadTimer > 0) {
                this.customReloadTimer -= Time.delta;
                this.reloadCounter = 0; 
            }
            return;
        }

        let maxCharge = this.evolutionTier == 1 ? chargeTimeMaxMK2 : chargeTimeMax;
        let efficiencyMultiplier = this.evolutionTier == 1 ? 2.5 : 1.5;

        if (this.berserkTimer > 0) {
            this.berserkTimer -= Time.delta;
            if (this.berserkTimer < 0) this.berserkTimer = 0;
            if (this.isShooting() && this.hasAmmo()) {
                this.reloadCounter += Time.delta * (this.efficiency * efficiencyMultiplier);
            }
        } else {
            if (this.chargeTimer < maxCharge) {
                this.chargeTimer += Time.delta;
                if (this.chargeTimer > maxCharge) this.chargeTimer = maxCharge;
            }
        }
    },

    shoot(type){
        this.super$shoot(type);

        let rLaser = Math.floor(Math.random() * 7); 
        let muzzleX = this.x + Angles.trnsx(this.rotation, 12);
        let muzzleY = this.y + Angles.trnsy(this.rotation, 12);

        if(this.evolutionTier == 2){
            if (this.customReloadTimer <= 0) {
                if (this.burstTimer == 1) {
                    handleShotgunShoot(this, 2, 100, 35, 1.0, 1.2); 
                    Fx.bigShockwave.at(this.x, this.y);
                    
                    this.burstTimer = 0;
                    this.laserCount = 0;
                    this.customReloadTimer = 180; 
                } else {
                    let targetLaser = laserB_Blasted;
                    if (rLaser == 0) targetLaser = laserB_Blasted;
                    else if (rLaser == 1) targetLaser = laserB_Melting;
                    else if (rLaser == 2) targetLaser = laserB_Burning;
                    else if (rLaser == 3) targetLaser = laserB_Freezing;
                    else if (rLaser == 4) targetLaser = laserB_Shocked;
                    else if (rLaser == 5) targetLaser = laserB_Wet;
                    else targetLaser = laserB_Corroded;
                    
                    let currentBullet = this.peekAmmo();
                    targetLaser.damage = (currentBullet != null ? currentBullet.damage : type.damage) * 3.1;
                    
                    targetLaser.create(this, this.team, muzzleX, muzzleY, this.rotation);
                    Fx.lightningCharge.at(this.x, this.y);
                    
                    handleShotgunShoot(this, 2, 50, 4, 1.0, 1.1); 
                    
                    this.laserCount++;
                    this.customReloadTimer = 70; 

                    if(this.laserCount >= 6){
                        this.burstTimer = 1; 
                    }
                }
            }
            return;
        }

        let maxCharge = this.evolutionTier == 1 ? chargeTimeMaxMK2 : chargeTimeMax;
        let maxBerserk = this.evolutionTier == 1 ? berserkTimeMaxMK2 : berserkTimeMax;
        let laserDmgMultiplier = this.evolutionTier == 1 ? 3.1 : 2.8;

        if (this.chargeTimer >= maxCharge && this.berserkTimer <= 0) {
            Fx.lightningCharge.at(this.x, this.y);
            
            let targetLaserBullet = laserMK1_Blasted;
            if (this.evolutionTier == 1) {
                if (rLaser == 0) targetLaserBullet = laserMK2_Blasted;
                else if (rLaser == 1) targetLaserBullet = laserMK2_Melting;
                else if (rLaser == 2) targetLaserBullet = laserMK2_Burning;
                else if (rLaser == 3) targetLaserBullet = laserMK2_Freezing;
                else if (rLaser == 4) targetLaserBullet = laserMK2_Shocked;
                else if (rLaser == 5) targetLaserBullet = laserMK2_Wet;
                else targetLaserBullet = laserMK2_Corroded;
            } else {
                if (rLaser == 0) targetLaserBullet = laserMK1_Blasted;
                else if (rLaser == 1) targetLaserBullet = laserMK1_Melting;
                else if (rLaser == 2) targetLaserBullet = laserMK1_Burning;
                else if (rLaser == 3) targetLaserBullet = laserMK1_Freezing;
                else if (rLaser == 4) targetLaserBullet = laserMK1_Shocked;
                else if (rLaser == 5) targetLaserBullet = laserMK1_Wet;
                else targetLaserBullet = laserMK1_Corroded;
            }
            
            let currentBullet = this.peekAmmo();
            targetLaserBullet.damage = (currentBullet != null ? currentBullet.damage : type.damage) * laserDmgMultiplier;
            
            targetLaserBullet.create(this, this.team, muzzleX, muzzleY, this.rotation);

            this.superShotCount++;
            this.chargeTimer = 0;

            if (this.superShotCount >= 3) { 
                this.berserkTimer = maxBerserk; 
                this.superShotCount = 0; 
                Fx.upgradeCore.at(this.x, this.y); 
            }
        } else {
            let pType = this.evolutionTier;
            let pellets = 9;       
            let spread = 8;        
            let dmgMul = 1.0;      
            let spdMul = 1.0;      

            if(this.evolutionTier == 1){ 
                pellets = 39; 
                spread = 8;
                dmgMul = 0.95; 
            } 

            handleShotgunShoot(this, pType, pellets, spread, dmgMul, spdMul);
        }
    },

    write(write){
        this.super$write(write);
        write.b(this.evolutionTier);
    },

    read(read, revision){
        this.super$read(read, revision);
        this.evolutionTier = read.b();
    }
});