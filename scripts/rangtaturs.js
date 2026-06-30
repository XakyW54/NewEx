
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

    buildConfiguration(table){
        table.clear();
        table.row(); 

        table.button(Icon.upOpen, Styles.cleari, 40, () => {
            let dialog = extend(BaseDialog, "Trung Tâm Chỉnh Sửa Cấu Trúc Rangtaturs", {});
            
            if(this.evolutionTier == 0){
                let titleText = "[gold]=== CHỌN NHÁNH TIẾN HÓA RANGTATURS ===[]";
                dialog.cont.add(titleText).padBottom(15).row();
                
                dialog.cont.label(prov(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Kho cốt lõi![]";
                    let currentCopper = core.items.get(Items.copper);
                    let currentLead = core.items.get(Items.lead);
                    let currentSilicon = core.items.get(Items.silicon);
                    
                    let copColor1 = currentCopper >= reqRangtatursMK2.copper ? "[green]" : "[red]";
                    let ledColor1 = currentLead >= reqRangtatursMK2.lead ? "[green]" : "[red]";
                    
                    let copColor2 = currentCopper >= reqRangtatursMK2B.copper ? "[green]" : "[red]";
                    let ledColor2 = currentLead >= reqRangtatursMK2B.lead ? "[green]" : "[red]";
                    let silColor2 = currentSilicon >= reqRangtatursMK2B.silicon ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" + 
                           "[cyan]Nhánh MK2:[] Copper: " + copColor1 + reqRangtatursMK2.copper + "[]/" + currentCopper + " | Lead: " + ledColor1 + reqRangtatursMK2.lead + "[]/" + currentLead + "\n" +
                           "[orange]Nhánh MK2B:[] Copper: " + copColor2 + reqRangtatursMK2B.copper + "[]/" + currentCopper + " | Lead: " + ledColor2 + reqRangtatursMK2B.lead + "[]/" + currentLead + " | Silicon: " + silColor2 + reqRangtatursMK2B.silicon + "[]/" + currentSilicon;
                })).padBottom(15).row();

                let branchesTable = extend(Table, {});
                
                let b1 = extend(Table, {}); b1.background(Styles.black6);
                b1.add("[cyan]NHÁNH 1: TIÊU CHUẨN (MK2)[]").pad(5).row();
                b1.add("[gray]- Tăng số lượng mảnh đạn hỗn hợp: +30 viên/loạt\n- Giữ nguyên cơ chế tích tụ tia laser giải phóng hiệu ứng hỗn hợp (7 trạng thái)[]").left().pad(5).row();
                b1.button("[green]KÍCH HOẠT MK2[]", () => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqRangtatursMK2.copper && core.items.get(Items.lead) >= reqRangtatursMK2.lead){
                        core.items.remove(Items.copper, reqRangtatursMK2.copper);
                        core.items.remove(Items.lead, reqRangtatursMK2.lead);
                        this.evolutionTier = 1;
                        Fx.upgradeCore.at(this.x, this.y);
                        dialog.hide(); this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Tiến hóa thất bại![]\nKhông đủ tài nguyên cho nhánh MK2.");
                    }
                }).size(200, 45).pad(10);

                let b2 = extend(Table, {}); b2.background(Styles.black6);
                b2.add("[orange]NHÁNH 2: BÃO TỐ LOẠN TRẠNG THÁI (MK2B)[]").pad(5).row();
                b2.add("[gray]- Bắn thường shotgun giải phóng 50 viên đạn hỗn hợp 7 trạng thái cực mạnh\n- Tích đủ 6 phát kích hoạt SIÊU BÃO ĐA TRẠNG THÁI[]").left().pad(5).row();
                b2.button("[green]KÍCH HOẠT MK2B[]", () => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqRangtatursMK2B.copper && core.items.get(Items.lead) >= reqRangtatursMK2B.lead && core.items.get(Items.silicon) >= reqRangtatursMK2B.silicon){
                        core.items.remove(Items.copper, reqRangtatursMK2B.copper);
                        core.items.remove(Items.lead, reqRangtatursMK2B.lead);
                        core.items.remove(Items.silicon, reqRangtatursMK2B.silicon);
                        this.evolutionTier = 2;
                        Fx.bigShockwave.at(this.x, this.y);
                        dialog.hide(); this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Tiến hóa thất bại![]\nKhông đủ tài nguyên cho nhánh MK2B.");
                    }
                }).size(200, 45).pad(10);

                branchesTable.add(b1).pad(5).width(340).row();
                branchesTable.add().height(10).row(); 
                branchesTable.add(b2).pad(5).width(340).row();
                
                dialog.cont.add(branchesTable).row();
            } else {
                let currentLabel = this.evolutionTier == 1 ? "[cyan]ĐANG SỬ DỤNG CẤU TRÚC: RANGTATURS MK2[]" : "[orange]ĐANG SỬ DỤNG CẤU TRÚC: RANGTATURS MK2B[]";
                dialog.cont.add("[gold]=== TRẠNG THÁI HỆ THỐNG ===[]").padBottom(10).row();
                dialog.cont.add(currentLabel).padBottom(10).row();
            }
            dialog.addCloseButton(); dialog.show();
        }).size(50, 40);

        table.button(Icon.info, Styles.cleari, 40, () => {
            let dialog = extend(BaseDialog, "Thông tin chi tiết", {});
            
            let headerText = "[white]THÁP PHÁO RANGTATURS MK1[]";
            if (this.evolutionTier == 1) headerText = "[cyan]THÁP PHÁO RANGTATURS MK2[]";
            if (this.evolutionTier == 2) headerText = "[orange]THÁP PHÁO RANGTATURS MK2B[]";
            
            dialog.cont.add(headerText).padBottom(15).row();
            
            let contentTable = extend(Table, {});
            let descriptionText = "";

            if(this.evolutionTier == 0){
                descriptionText = "[yellow]Cấu hình trạng thái gốc (MK1):[]\n\n" +
                                         "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" + 
                "• Đạn thường: [lightgray]16 Sát thương[]\n" +
                            "[lightgray]1. Chế độ thường:[] Bắn ra loạt [white]9 viên đạn Shotgun[] tỏa rộng dồn ép mục tiêu.\n" +
                            "Các loại hiệu ứng sau:\n" +
                            " - [orange]Blasted:[] Gây nổ lan và đẩy lùi mạnh mục tiêu.\n" +
                            " - [yellow]Melting:[] Axit nhiệt đốt cháy, làm tan chảy lớp giáp.\n" +
                            " - [coral]Burning:[] Thiêu đốt liên tục theo thời gian.\n" +
                            " - [cyan]Freezing:[] Đóng băng làm chậm tốc độ di chuyển kẻ địch.\n" +
                            " - [purple]Shocked:[] Kích hoạt chuỗi sét lan truyền sát thương.\n" +
                            " - [blue]Wet:[] Gây ướt diện rộng, tạo combo dẫn điện cực mạnh.\n" +
                            " - [lime]Corroded:[] Ăn mòn axit độc quyền phá hủy cấu trúc mục tiêu.\n\n" +
                            "[lightgray]2. Đòn tích tụ Laser:[] Sau [white]180 tick[] nạp năng lượng tự động, phát bắn kế tiếp sẽ phóng ra một [orange]Tia Laser Đại Pháo Khổng Lề[] mang sát thương nhân [gold]280%[] kèm trạng thái ngẫu nhiên.\n\n" +
                            "[lightgray]3. Trạng thái Cuồng Nộ:[] Bắn đủ [white]3 phát Đại Pháo Laser[], pháo đi vào trạng thái [red]Berserk Mode[] giúp tăng tốc độ xả đạn thường lên [gold]150%[] liên tục.";
            } else if(this.evolutionTier == 1) {
                descriptionText = "[cyan]Cấu hình nâng cấp tốc độ và mật độ (MK2):[]\n\n" +
                                            "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "• Đạn thường: [lightgray]17.5 Sát thương[]\n" +
                            "[lightgray]1. Mưa Đạn Trạng Thái:[] Số lượng đạn thường tăng vọt lên [green]39 viên đạn mảnh[] dải thảm.\n" +
                            "Các loại hiệu ứng sau:\n" +
                            " - [orange]Blasted:[] Gây nổ lan và đẩy lùi mạnh mục tiêu.\n" +
                            " - [yellow]Melting:[] Axit nhiệt đốt cháy, làm tan chảy lớp giáp.\n" +
                            " - [coral]Burning:[] Thiêu đốt liên tục theo thời gian.\n" +
                            " - [cyan]Freezing:[] Đóng băng làm chậm tốc độ di chuyển kẻ địch.\n" +
                            " - [purple]Shocked:[] Kích hoạt chuỗi sét lan truyền sát thương.\n" +
                            " - [blue]Wet:[] Gây ướt diện rộng, tạo combo dẫn điện cực mạnh.\n" +
                            " - [lime]Corroded:[] Ăn mòn axit độc quyền phá hủy cấu trúc mục tiêu.\n\n" +
                            "[lightgray]2. Siêu Laser Tích Tụ:[] Thời gian sạc rút ngắn xuống [white]140 tick[], sát thương tia đại pháo laser nâng cấp mạnh lên nhân [gold]310%[].\n\n" +
                            "[lightgray]3. Siêu Cuồng Nộ:[] Kéo dài thời gian Berserk mượt mà hơn và đẩy tốc độ bắn lên cực đại gấp [red]250%[].";
            } else {
                descriptionText = "[orange]Cấu hình Tối Thượng hủy diệt (MK2B):[]\n\n" +
                                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "• Đạn thường: [lightgray]20 Sát thương[]\n" +
                            "[lightgray]1. Siêu bão hỗn hợp:[] Phát bắn thường thay thế bằng loạt [white]50 viên đạn[] gom tâm dồn sát thương cực đại.\n" +
                            "Các loại hiệu ứng sau:\n" +
                            " - [orange]Blasted:[] Gây nổ lan và đẩy lùi mạnh mục tiêu.\n" +
                            " - [yellow]Melting:[] Axit nhiệt đốt cháy, làm tan chảy lớp giáp.\n" +
                            " - [coral]Burning:[] Thiêu đốt liên tục theo thời gian.\n" +
                            " - [cyan]Freezing:[] Đóng băng làm chậm tốc độ di chuyển kẻ địch.\n" +
                            " - [purple]Shocked:[] Kích hoạt chuỗi sét lan truyền sát thương.\n" +
                            " - [blue]Wet:[] Gây ướt diện rộng, tạo combo dẫn điện cực mạnh.\n" +
                            " - [lime]Corroded:[] Ăn mòn axit độc quyền phá hủy cấu trúc mục tiêu.\n\n" +
                            "[lightgray]2. Cơ chế nén năng lượng đột phá:[] Loại bỏ nạp đạn thường của game, ép tháp pháo hoạt động theo chu kỳ nén riêng biệt ([white]70 tick[] mỗi loạt bắn laser thường).\n\n" +
                            "[lightgray]3. Tuyệt chiêu Xả Bão Đa Trạng Thái (Burst Mode):[] Tích đủ 6 phát bắn, pháo giải phóng chu kỳ bão đơn cực đại [red]100 viên đạn nén hỗn hợp siêu bão[], sau đó rơi vào trạng thái quá tải nhiệt làm mát trong [white]180 tick[].";
            }

            let infoLabel = new Label(prov(() => descriptionText));
            infoLabel.setWrap(true); 
            contentTable.add(infoLabel).width(380).left().pad(10);

            let scrollPane = new Packages.arc.scene.ui.ScrollPane(contentTable, Styles.defaultPane);
            scrollPane.setFlickScroll(true); 
            
            let mainWrapperTable = extend(Table, {});
            mainWrapperTable.background(Styles.black6);
            mainWrapperTable.add(scrollPane).width(420).height(320).scrollX(false).scrollY(true);

            dialog.cont.add(mainWrapperTable).row();
            dialog.addCloseButton(); dialog.show();
        }).size(50, 40);
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