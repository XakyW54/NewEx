
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
    speed: 7, damage: 1, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#ffab40"), backColor: Color.valueOf("#ff6d00"), 
    trailColor: Color.valueOf("#ff6d00"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 1.2, statusDuration: 140,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion, status: StatusEffects.blasted
});
const rangtatursNormalMelting = extend(BasicBulletType, {
    speed: 7, damage: 1, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#ffa726"), backColor: Color.valueOf("#f57c00"), 
    trailColor: Color.valueOf("#f57c00"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
    hitEffect: Fx.melting, despawnEffect: Fx.melting, status: StatusEffects.melting
});
const rangtatursNormalBurning = extend(BasicBulletType, {
    speed: 7, damage: 1, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#ff7043"), backColor: Color.valueOf("#d84315"), 
    trailColor: Color.valueOf("#d84315"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
    hitEffect: Fx.fire, despawnEffect: Fx.fire, status: StatusEffects.burning
});
const rangtatursNormalFreezing = extend(BasicBulletType, {
    speed: 7, damage: 1, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#29b6f6"), backColor: Color.valueOf("#0288d1"), 
    trailColor: Color.valueOf("#0288d1"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.freezing
});
const rangtatursNormalShocked = extend(BasicBulletType, {
    speed: 7, damage: 1, width: 7, height: 18, lifetime: 43,
    frontColor: Color.valueOf("#e1bee7"), backColor: Color.valueOf("#ba68c8"), 
    trailColor: Color.valueOf("#ba68c8"), trailWidth: 1.5, trailLength: 5,
    splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
    hitEffect: Fx.lightning, despawnEffect: Fx.lightning, status: StatusEffects.shocked
});
const rangtatursNormalWet = extend(BasicBulletType, {
    speed: 7.2, damage: 1, width: 6.5, height: 17, lifetime: 43,
    frontColor: Color.valueOf("#60a5fa"), backColor: Color.valueOf("#2563eb"), 
    trailColor: Color.valueOf("#2563eb"), trailWidth: 1.4, trailLength: 5,
    splashDamage: 10, splashDamageRadius: 24, knockback: 0.6, statusDuration: 180,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.wet
});
const rangtatursNormalCorroded = extend(BasicBulletType, {
    speed: 6.8, damage: 1, width: 7, height: 17, lifetime: 43,
    frontColor: Color.valueOf("#bef264"), backColor: Color.valueOf("#65a30d"), 
    trailColor: Color.valueOf("#65a30d"), trailWidth: 1.5, trailLength: 6,
    splashDamage: 14, splashDamageRadius: 26, knockback: 0.3, statusDuration: 160,
    hitEffect: acidCorrosionEffect, despawnEffect: acidCorrosionEffect, status: StatusEffects.corroded
});

const rangtatursNormalBullet = rangtatursNormalBlasted; 


const rangtatursmk2NormalBlasted = extend(BasicBulletType, {
    speed: 7.7, damage: 1, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#ffab40"), backColor: Color.valueOf("#ff6d00"),
    trailColor: Color.valueOf("#ff6d00"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 1.4, statusDuration: 140,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion, status: StatusEffects.blasted
});
const rangtatursmk2NormalMelting = extend(BasicBulletType, {
    speed: 7.7, damage: 1, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#ffa726"), backColor: Color.valueOf("#f57c00"),
    trailColor: Color.valueOf("#f57c00"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 0.6, statusDuration: 140,
    hitEffect: Fx.melting, despawnEffect: Fx.melting, status: StatusEffects.melting
});
const rangtatursmk2NormalBurning = extend(BasicBulletType, {
    speed: 7.7, damage: 1, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#ff7043"), backColor: Color.valueOf("#d84315"),
    trailColor: Color.valueOf("#d84315"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 0.6, statusDuration: 140,
    hitEffect: Fx.fire, despawnEffect: Fx.fire, status: StatusEffects.burning
});
const rangtatursmk2NormalFreezing = extend(BasicBulletType, {
    speed: 7.7, damage: 1, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#29b6f6"), backColor: Color.valueOf("#0288d1"),
    trailColor: Color.valueOf("#0288d1"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 0.6, statusDuration: 140,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.freezing
});
const rangtatursmk2NormalShocked = extend(BasicBulletType, {
    speed: 7.7, damage: 1, width: 7.7, height: 19.8, lifetime: 43,      
    frontColor: Color.valueOf("#e1bee7"), backColor: Color.valueOf("#ba68c8"),
    trailColor: Color.valueOf("#ba68c8"), trailWidth: 1.65, trailLength: 6,    
    splashDamage: 15, splashDamageRadius: 28, knockback: 0.6, statusDuration: 140,
    hitEffect: Fx.lightning, despawnEffect: Fx.lightning, status: StatusEffects.shocked
});
const rangtatursmk2NormalWet = extend(BasicBulletType, {
    speed: 7.9, damage: 1, width: 7.2, height: 18.5, lifetime: 43,      
    frontColor: Color.valueOf("#60a5fa"), backColor: Color.valueOf("#2563eb"),
    trailColor: Color.valueOf("#2563eb"), trailWidth: 1.55, trailLength: 6,    
    splashDamage: 12, splashDamageRadius: 28, knockback: 0.7, statusDuration: 180,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.wet
});
const rangtatursmk2NormalCorroded = extend(BasicBulletType, {
    speed: 7.5, damage: 1, width: 7.7, height: 18.5, lifetime: 43,      
    frontColor: Color.valueOf("#bef264"), backColor: Color.valueOf("#65a30d"),
    trailColor: Color.valueOf("#65a30d"), trailWidth: 1.65, trailLength: 7,    
    splashDamage: 17, splashDamageRadius: 30, knockback: 0.4, statusDuration: 160,
    hitEffect: acidCorrosionEffect, despawnEffect: acidCorrosionEffect, status: StatusEffects.corroded
});


const normalBulletBBlasted = extend(BasicBulletType, {
    speed: 8.5, damage: 1, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#ff5252"), backColor: Color.valueOf("#ff1744"), 
    trailColor: Color.valueOf("#ff1744"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 1.8, statusDuration: 180,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion, status: StatusEffects.blasted
});
const normalBulletBMelting = extend(BasicBulletType, {
    speed: 8.5, damage: 1, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#ffa726"), backColor: Color.valueOf("#f57c00"), 
    trailColor: Color.valueOf("#f57c00"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 0.8, statusDuration: 180,
    hitEffect: Fx.melting, despawnEffect: Fx.melting, status: StatusEffects.melting
});
const normalBulletBBurning = extend(BasicBulletType, {
    speed: 8.5, damage: 1, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#ff7043"), backColor: Color.valueOf("#d84315"), 
    trailColor: Color.valueOf("#d84315"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 0.8, statusDuration: 180,
    hitEffect: Fx.fire, despawnEffect: Fx.fire, status: StatusEffects.burning
});
const normalBulletBFreezing = extend(BasicBulletType, {
    speed: 8.5, damage: 1, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#29b6f6"), backColor: Color.valueOf("#0288d1"), 
    trailColor: Color.valueOf("#0288d1"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 0.8, statusDuration: 180,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.freezing
});
const normalBulletBShocked = extend(BasicBulletType, {
    speed: 8.5, damage: 1, width: 8, height: 20, lifetime: 40,
    frontColor: Color.valueOf("#e1bee7"), backColor: Color.valueOf("#ba68c8"), 
    trailColor: Color.valueOf("#ba68c8"), trailWidth: 2, trailLength: 6,
    splashDamage: 22, splashDamageRadius: 36, knockback: 0.8, statusDuration: 180,
    hitEffect: Fx.lightning, despawnEffect: Fx.lightning, status: StatusEffects.shocked
});
const normalBulletBWet = extend(BasicBulletType, {
    speed: 8.7, damage: 1, width: 7.5, height: 19, lifetime: 40,
    frontColor: Color.valueOf("#93c5fd"), backColor: Color.valueOf("#1d4ed8"), 
    trailColor: Color.valueOf("#1d4ed8"), trailWidth: 1.9, trailLength: 6,
    splashDamage: 18, splashDamageRadius: 36, knockback: 0.9, statusDuration: 220,
    hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.wet
});
const normalBulletBCorroded = extend(BasicBulletType, {
    speed: 8.3, damage: 1, width: 8, height: 19, lifetime: 40,
    frontColor: Color.valueOf("#bef264"), backColor: Color.valueOf("#4d7c0f"), 
    trailColor: Color.valueOf("#4d7c0f"), trailWidth: 2, trailLength: 7,
    splashDamage: 26, splashDamageRadius: 38, knockback: 0.5, statusDuration: 200,
    hitEffect: acidCorrosionEffect, despawnEffect: acidCorrosionEffect, status: StatusEffects.corroded
});


const createLaser = (dmg, w, lt, col, st, hitEf) => {
    return extend(LaserBulletType, {
        length: 240, damage: dmg, width: w, lifetime: lt, colors: col, status: st, statusDuration: 180,
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

        // 1. NÚT NÂNG CẤP (^)
        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, run(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Rangtaturs", {});
                
                // Sử dụng hàm prov chuẩn của Mindustry JS
                let reqCell = dialog.cont.label(prov(() => {
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

                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[]\n" +
                           " • Đồng: " + copColor1 + currentCopper + "[] / " + reqRangtatursMK2.copper + "\n" +
                           " • Chì: " + ledColor1 + currentLead + "[] / " + reqRangtatursMK2.lead + "\n" +
                           "[purple]Nhánh MK2B:[]\n" +
                           " • Đồng: " + copColor2 + currentCopper + "[] / " + reqRangtatursMK2B.copper + "\n" +
                           " • Chì: " + ledColor2 + currentLead + "[] / " + reqRangtatursMK2B.lead + "\n" +
                           " • Silic: " + silColor2 + currentSilicon + "[] / " + reqRangtatursMK2B.silicon;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // Nhánh 1: MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("Cấu hình tăng cường mật độ mảnh hỏa lực:\n" +
                                 " [white]• Mưa đạn trạng thái: Đẩy mạnh lên [green]39 viên đạn mảnh[] [lime](+333.3%)[].[]\n" +
                                 " [white]• Siêu Laser tích tụ: Thời gian sạc rút ngắn còn [yellow]2.33 giây (140 tick)[] [lime](Giảm -22.2%)[].[]\n" +
                                 " [white]• Laze kích nổ: Sát thương đột biến nhân tiến đạt mức [red]310% hỏa lực[] cơ bản.[]\n" +
                                 " [white]• Chu kỳ Cuồng nộ: Kéo dài thời gian bộc phá lên [orange]6.0 giây[] [lime](+20%)[], đẩy tốc bắn thường lên [red]250%[].[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left);
                b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", run(() => {
                    let core = this.team.core();
                    if(core && core.items.get(Items.copper) >= reqRangtatursMK2.copper && core.items.get(Items.lead) >= reqRangtatursMK2.lead){
                        core.items.remove(Items.copper, reqRangtatursMK2.copper);
                        core.items.remove(Items.lead, reqRangtatursMK2.lead);
                        this.evolutionTier = 1;
                        Fx.upgradeCore.at(this.x, this.y);
                        dialog.hide(); this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên nâng cấp cho nhánh MK2![]");
                    }
                })).size(180, 38);

                // Nhánh 2: MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("Cấu hình tối thượng hủy diệt bão đạn diện rộng:\n" +
                                 " [white]• Siêu bão hỗn hợp: Loạt bắn shotgun tăng số lượng mảnh lên [green]50 viên đạn[] [lime](+455.5%)[].[]\n" +
                                 " [white]• Chu kỳ nén ép xung: Khóa cố định thời gian năng lượng hồi loạt bắn thường còn [yellow]1.16 giây (70 tick)[].[]\n" +
                                 " [white]• Tuyệt chiêu Xả Bão (Burst): Bắn đủ 6 phát giải phóng bão đơn cực cực đại [orange]100 viên đạn nén[].[]\n" +
                                 " [white]• Quá tải nhiệt: Hệ thống rơi vào trạng thái làm mát cưỡng bức, ngắt nòng trong [purple]3.0 giây (180 tick)[].[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left);
                b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", run(() => {
                    let core = this.team.core();
                    if(core && core.items.get(Items.copper) >= reqRangtatursMK2B.copper && core.items.get(Items.lead) >= reqRangtatursMK2B.lead && core.items.get(Items.silicon) >= reqRangtatursMK2B.silicon){
                        core.items.remove(Items.copper, reqRangtatursMK2B.copper);
                        core.items.remove(Items.lead, reqRangtatursMK2B.lead);
                        core.items.remove(Items.silicon, reqRangtatursMK2B.silicon);
                        this.evolutionTier = 2;
                        Fx.bigShockwave.at(this.x, this.y);
                        dialog.hide(); this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên nâng cấp cho nhánh MK2B![]");
                    }
                })).size(180, 38);

                // Bố cục ScrollPane dọc chống tràn
                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);
                
                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp tháp pháo Rangtaturs");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, run(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG RANGTATURS ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // 2. NÚT THÔNG TIN (i)
        table.button(Icon.info, Styles.cleari, 40, run(() => {
            let title = " Thông số pháo Rangtaturs: ";
            let descStr = "";
            let currentTier = this.evolutionTier;

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]" + this.health + "[]\n" +
                          "📐 Kích thước khối:[] [white]" + this.block.size + "x" + this.block.size + "[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]" + this.block.range + " pixel[]\n" +
                          "Mục tiêu phát xạ:[] [yellow]Mặt đất (Không bắn phòng không)[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc dòng Rangtaturs[]\n\n" +
                          "[sky]⚡ ĐẶC TÍNH HỎA LỰC VÀ CHU KỲ CƠ CHẾ:[]\n" +
                          "• [lightgray]Bắn Shotgun thường:[] Phóng loạt gồm [green]9 viên đạn mảnh[] mang ngẫu nhiên hiệu ứng bộ 7 trạng thái bất lợi.\n" +
                          "• [lightgray]Chu kỳ Tích tụ (Sạc điểm):[] Bắn thường liên tục trong [yellow]3.0 giây (180 tick)[] kích hoạt Đại Pháo Laser gây sát thương nhân tiến lên [gold]280%[].[]\n" +
                          "• [lightgray]Mạch Cuồng nộ (Berserk):[] Tích đủ 3 phát Laze đưa lõi pháo vào trạng thái quá tải trong [orange]5.0 giây (300 tick)[], tăng tốc độ hồi đạn bắn thường lên [green]+150%[].";
            } else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]" + this.health + "[]\n" +
                          "📐 Kích thước khối:[] [white]" + this.block.size + "x" + this.block.size + "[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]" + this.block.range + " pixel[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc dòng Rangtaturs[]\n\n" +
                          "[lime]⚡ ĐẶC TÍNH HỎA LỰC VÀ CHU KỲ CƠ CHẾ:[]\n" +
                          "• [lightgray]Mưa đạn trạng thái:[] Số lượng đạn Shotgun tăng mạnh lên [green]39 viên mảnh[] [lime](+333.3%)[].\n" +
                          "• [lightgray]Sạc xung ngắn mạch:[] Thời gian tích tụ năng lượng Laser rút xuống còn [yellow]2.33 giây (140 tick) [lime](Giảm -22.2%)[], sát thương Laser lõi tăng vọt đạt [red]310%[].[]\n" +
                          "• [lightgray]Chu kỳ Siêu cuồng nộ:[] Thời gian bộc phá tăng lên [orange]6.0 giây (360 tick) [lime](+20%)[], ép tốc độ xả đạn bắn thường lên mức cực đại [red]250%[].";
            } else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]" + this.health + "[]\n" +
                          "📐 Kích thước khối:[] [white]" + this.block.size + "x" + this.block.size + "[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]" + this.block.range + " pixel[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc dòng Rangtaturs[]\n\n" +
                          "[purple]🔥 🔥 CƠ CHẾ SIÊU BÃO LOẠN TRẠNG THÁI TRỌNG LỰC:[]\n" +
                          "• Hệ thống loại bỏ hoàn toàn cơ chế sạc tích tụ điểm và thanh cuồng nộ cũ.\n" +
                          "• [lightgray]Bão Shotgun hỗn hợp:[] Phóng ra tia Laze nén kèm chùm đạn shotgun tập trung mật độ cao lên tới [green]50 viên đạn[] [lime](+455.5%)[].\n" +
                          "• [lightgray]Cơ chế nén ép xung:[] Khóa cố định chu kỳ thời gian hồi giữa các loạt bắn thông thường thành [yellow]1.16 giây (70 tick)[].[]\n" +
                          "• [lightgray]Tuyệt chiêu Xả Bão (Burst Mode):[] Tích lũy đủ 6 phát bắn, pháo tự động giải phóng một siêu bão tổng lực cực đại gồm [red]100 viên đạn hỗn hợp[], sau đó rơi vào trạng thái đóng băng hệ thống làm mát ngắt nòng trong [white]3.0 giây (180 tick)[].";
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
            if (this.isShooting && this.hasAmmo()) {
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