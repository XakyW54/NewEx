/*BLAW TURRET SYSTEM - OPTIMIZED ENGINE WITH FAST CIRCLE HIT EFFECT*/

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqBlawMK2 = { copper: 4000, lead: 4000, titanium: 0 };
const reqBlawMK2B = { copper: 4000, lead: 4000, titanium: 2000 };

// --- HIỆU ỨNG VÒNG TRÒN SÓNG XUNG KÍCH (ĐÃ GIẢM KÍCH THƯỚC & TĂNG TỐC ĐỘ BIẾN MẤT) ---
const nhCircleHitEffect = new Effect(40, cons(e => {
    // Lấy màu sắc trực tiếp theo màu hiệu ứng đạn
    Draw.color(e.color);

    // 1. Vòng tròn mờ (Bán kính nở ra tối đa 35)
    let smoothRadius = 35 * Interp.pow2Out.apply(e.fin());
    Draw.alpha(0.35 * e.fout());
    Fill.circle(e.x, e.y, smoothRadius);

    // 2. Vòng sóng lớn (Bán kính 40, dày 2.5px)
    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, 40 * Interp.pow2Out.apply(e.fin()));

    // 3. Vòng sóng nhỏ (Bán kính 20, dày 1.5px)
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, 20 * Interp.pow2Out.apply(e.fin()));

    Draw.reset();
}));

var doubleSparks = extend(ParticleEffect, {
    particles: 3, line: true, length: 8, lifetime: 8, lenFrom: 6, lenTo: 1,
    strokeFrom: 1, cone: 30, strokeTo: 1,
    colorFrom: Color.valueOf("ffe18f"), colorTo: Color.valueOf("ffe18f"),
});

var mirrorSparks = extend(RadialEffect, {
    rotationSpacing: 180, amount: 2, effect: doubleSparks,
});

// --- CÁC LOẠI ĐẠN ĐÃ ĐƯỢC GÁN nhCircleHitEffect ---
const blawBlueMK1 = extend(BasicBulletType, {
    speed: 2.5, damage: 20, width: 9, height: 22, lifetime: 60,
    sprite: "newex-diamond-shard", 
    hitEffect: nhCircleHitEffect, despawnEffect: nhCircleHitEffect,
    hitColor: Color.valueOf("0031FFFF"),
    frontColor: Color.valueOf("0031FFFF"), backColor: Color.white,
    status: StatusEffects.freezing, statusDuration: 600, pierce: true, pierceCap: 3
});

const blawRedMK1 = extend(BasicBulletType, {
    speed: 2.5, damage: 20, width: 9, height: 22, lifetime: 60,
    frontColor: Color.valueOf("FF0000FF"), backColor: Color.white, 
    hitEffect: nhCircleHitEffect, despawnEffect: nhCircleHitEffect,
    hitColor: Color.valueOf("FF0000FF"),
    splashDamage: 80, splashDamageRadius: 24, status: StatusEffects.blasted, statusDuration: 80
});

const blawBlueMK2 = extend(BasicBulletType, {
    speed: 2.8, damage: 20, width: 10, height: 24, lifetime: 60,
    frontColor: Color.valueOf("0031FFFF"), backColor: Color.white,
    hitEffect: nhCircleHitEffect, despawnEffect: nhCircleHitEffect,
    hitColor: Color.valueOf("0031FFFF"),
    status: StatusEffects.freezing, statusDuration: 600, pierce: true, pierceCap: 3
});

const blawRedMK2 = extend(BasicBulletType, {
    speed: 2.8, damage: 20, width: 10, height: 24, lifetime: 160,
    frontColor: Color.valueOf("FF0000FF"), backColor: Color.white,
    hitEffect: nhCircleHitEffect, despawnEffect: nhCircleHitEffect,
    hitColor: Color.valueOf("FF0000FF"),
    splashDamage: 120, splashDamageRadius: 32, status: StatusEffects.blasted, statusDuration: 80
});

const blawBlueBulletMK2B = extend(BasicBulletType, {
    speed: 12.2, damage: 220, width: 5, height: 12, lifetime: 10,
    frontColor: Color.valueOf("0031FFFF"), backColor: Color.white, 
    hitEffect: nhCircleHitEffect, despawnEffect: nhCircleHitEffect,
    hitColor: Color.valueOf("0031FFFF"),
    pierce: true, pierceCap: 2, status: StatusEffects.freezing, statusDuration: 300
});

const blawRedBulletMK2B = extend(BasicBulletType, {
    speed: 12.2, damage: 220, width: 5, height: 12, lifetime: 10,
    frontColor: Color.valueOf("FF5A00FF"), backColor: Color.white, 
    hitEffect: nhCircleHitEffect, despawnEffect: nhCircleHitEffect,
    hitColor: Color.valueOf("FF5A00FF"),
    splashDamage: 40, splashDamageRadius: 16, status: StatusEffects.blasted, statusDuration: 80
});

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
blaw.ammo(Items.titanium, blawBlueMK1); 

blaw.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) tile.setTier(value);
}));

blaw.buildType = () => extend(ItemTurret.ItemTurretBuild, blaw, {
    tierState: 0,
    barrelSide: false, 
    shotgunTimer: 0, 
    shotCount: 0,    
    recoilLeft: 0,
    recoilRight: 0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        this.health = (val == 2) ? 4500 : 3000; 
        this.maxHealth = this.health;
        this.shotCount = 0;
    },

    range(){
        let tier = this.getTier();
        return (tier == 1) ? 390 : ((tier == 2) ? 182 : 260);
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
                           "[cyan]Nhánh MK2:[]\n • Đồng: " + copColor1 + currentCopper + "[] / " + reqBlawMK2.copper + "\n • Chì: " + leaColor1 + currentLead + "[] / " + reqBlawMK2.lead + "\n" +
                           "[purple]Nhánh MK2B:[]\n • Đồng: " + copColor2 + currentCopper + "[] / " + reqBlawMK2B.copper + "\n • Chì: " + leaColor2 + currentLead + "[] / " + reqBlawMK2B.lead + "\n • Titan: " + titColor2 + currentTitanium + "[] / " + reqBlawMK2B.titanium;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("Cải tiến Băng Hỏa tầm xa:\n [white]• Tầm bắn +50% (390 px).[]\n [white]• Tốc độ nòng +20%.[]\n [white]• [sky]Băng MK2:[] Xuyên 3 mục tiêu.[]\n [white]• [scarlet]Hỏa MK2:[] Nổ lan 120 DMG.[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqBlawMK2.copper && core.items.get(Items.lead) >= reqBlawMK2.lead){
                        core.items.remove(Items.copper, reqBlawMK2.copper); core.items.remove(Items.lead, reqBlawMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("Cấu trúc phòng thủ cận chiến hạng nặng:\n [white]• Máu tăng 4,500 HP (+150%).[]\n [white]• Tầm bắn bóp giảm (182 px).[]\n [white]• Bắn chùm [yellow]20 viên đạn hỗn hợp[].[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqBlawMK2B.copper && core.items.get(Items.lead) >= reqBlawMK2B.lead && core.items.get(Items.titanium) >= reqBlawMK2B.titanium){
                        core.items.remove(Items.copper, reqBlawMK2B.copper); core.items.remove(Items.lead, reqBlawMK2B.lead); core.items.remove(Items.titanium, reqBlawMK2B.titanium);
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
            })).size(50, 40).tooltip("Nâng cấp tháp pháo Blaw");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo(tier == 1 ? "[cyan]ĐANG HOẠT ĐỘNG Ở CẤU HÌNH BLAW MK2![]" : "[purple]ĐANG HOẠT ĐỘNG Ở CẤU HÌNH BLAW MK2B![]");
            })).size(50, 40).tooltip("Đã đạt giới hạn tiến hóa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Blaw: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\nMáu: [green]3,000 HP[] | Tầm bắn: [orange]260 px[]\nSát thương: [white]200 DMG[]";
            } else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\nMáu: [green]3,000 HP[] | Tầm bắn: [orange]390 px[]\nTốc độ nạp: [lime]+20%[]";
            } else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B SHOTGUN) ⚡[]\nMáu: [green]4,500 HP[] | Tầm bắn: [red]182 px[]\nSát thương: [pink]220 DMG / viên[]";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem thông số chi tiết");
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
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
            if(tier == 1) this.reloadCounter += Time.delta * 0.2 * this.efficiency;
        }
    },

    shoot(type){
        let tier = this.getTier();
        if(tier == 2 && this.shotgunTimer > 0) return; 

        let damageMultiplier = 1.0;
        let targetEnt = this.target;
        if (targetEnt != null && targetEnt.health !== undefined) {
            let targetHp = targetEnt.health;
            if (targetHp > 100) {
                let factor = (tier == 2) ? 0.05 : ((tier == 1) ? 0.02 : 0.01);
                damageMultiplier += Math.floor((targetHp - 100) / 100) * factor;
            }
            if (tier == 1 && targetHp > 1000) {
                damageMultiplier += Math.floor((targetHp - 1000) / 1000) * 0.01;
            }
        }

        this.barrelSide = !this.barrelSide;
        if(this.barrelSide) this.recoilLeft = 1.0;
        else this.recoilRight = 1.0;

        let offsetDistance = 6; 
        let angleRad = (this.rotation + (this.barrelSide ? 90 : -90)) * Mathf.degRad; 
        let spawnX = this.x + Math.cos(angleRad) * offsetDistance;
        let spawnY = this.y + Math.sin(angleRad) * offsetDistance;

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
            let selectedBulletType = (tier == 1) 
                ? (this.barrelSide ? blawBlueMK2 : blawRedMK2) 
                : (this.barrelSide ? blawBlueMK1 : blawRedMK1);
            
            let finalDmg = selectedBulletType.damage * damageMultiplier;
            Call.createBullet(selectedBulletType, this.team, spawnX, spawnY, this.rotation, finalDmg, selectedBulletType.speed, 1.0);
        }
    },

    draw(){
        if(blaw.customBaseRegion != null && blaw.customBaseRegion.found()){
            Draw.rect(blaw.customBaseRegion, this.x, this.y);
        } else {
            Draw.rect(blaw.baseRegion, this.x, this.y);
        }
        
        let angleRad = this.rotation * Mathf.degRad;
        let cos = Math.cos(angleRad);
        let sin = Math.sin(angleRad);
        let recoilLength = 4; 

        let rxLeft = this.x - cos * (this.recoilLeft * recoilLength);
        let ryLeft = this.y - sin * (this.recoilLeft * recoilLength);

        let rxRight = this.x - cos * (this.recoilRight * recoilLength);
        let ryRight = this.y - sin * (this.recoilRight * recoilLength);

        if(blaw.leftBarrelRegion != null && blaw.leftBarrelRegion.found()){
            Draw.rect(blaw.leftBarrelRegion, rxLeft, ryLeft, this.rotation - 90);
        }
        if(blaw.rightBarrelRegion != null && blaw.rightBarrelRegion.found()){
            Draw.rect(blaw.rightBarrelRegion, rxRight, ryRight, this.rotation - 90);
        }
        if(blaw.region != null && blaw.region.found()){
            Draw.rect(blaw.region, this.x, this.y, this.rotation - 90);
        }

        let sideAngleRad = (this.rotation + 90) * Mathf.degRad;
        let ballSideCos = Math.cos(sideAngleRad) * 6; 
        let ballSideSin = Math.sin(sideAngleRad) * 6;

        let bxLeft = (this.x - cos * (this.recoilLeft * recoilLength)) + ballSideCos - cos * 3;
        let byLeft = (this.y - sin * (this.recoilLeft * recoilLength)) + ballSideSin - sin * 3;
        
        let bxRight = (this.x - cos * (this.recoilRight * recoilLength)) - ballSideCos - cos * 3;
        let byRight = (this.y - sin * (this.recoilRight * recoilLength)) - ballSideSin - sin * 3;

        let baseRadius = 1.5; 

        Draw.draw(Layer.effect + 1, packRun(() => {
            let zoomLeft = baseRadius * (1.0 + this.recoilLeft * 1.5);
            Draw.color(Color.valueOf("0031FFFF"), 0.35);
            Fill.circle(bxLeft, byLeft, zoomLeft * 2.0);
            Draw.color(Color.white);
            Fill.circle(bxLeft, byLeft, zoomLeft);

            let zoomRight = baseRadius * (1.0 + this.recoilRight * 1.5);
            Draw.color(Color.valueOf("FF3B00FF"), 0.35);
            Fill.circle(bxRight, byRight, zoomRight * 2.0);
            Draw.color(Color.white);
            Fill.circle(bxRight, byRight, zoomRight);
            
            Draw.reset(); 
        }));
    },

    write(write){ this.super$write(write); write.b(this.getTier()); },
    read(read, revision){ this.super$read(read, revision); this.setTier(read.b()); }
});