const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });
const packBoolf = (func) => new Boolf({ get: func });
const packFloatp = (func) => new Floatp({ get: func });

function isEn() {
    let loc = Core.settings.get("locale", "");
    return loc && loc.startsWith("en");
}

const RED_BLOOD  = Color.valueOf("#b30000");
const RED_BRIGHT = Color.valueOf("#ff1a40");
const ORANGE_GLOW = Color.valueOf("#ff8000");

const reqMK2 = { thorium: 400, silicon: 300 };
const reqMK2B = { surgeAlloy: 150, silicon: 500, phaseFabric: 100 };

const critEffect = new Effect(20, e => {
    Draw.color(RED_BRIGHT, ORANGE_GLOW, e.fin());
    for (let i = 0; i < 4; i++) {
        let angle = i * 90 + 45;
        let len = 3 + e.fin() * 12;
        Drawf.tri(e.x + Mathf.cosDeg(angle) * (len * 0.2), e.y + Mathf.sinDeg(angle) * (len * 0.2), 3.5 * e.fout(), len, angle);
    }
});

const starShrinkHitEffect = new Effect(20, e => {
    let x = e.x, y = e.y;
    let sizeScale = e.fout();

    Draw.color(RED_BLOOD);
    Lines.stroke(2.5 * sizeScale);
    Lines.circle(x, y, 8 * sizeScale);

    Draw.color(RED_BRIGHT);
    for (let i = 0; i < 4; i++) {
        let angle = i * 90;
        Drawf.tri(x, y, 4.0 * sizeScale, 14 * sizeScale, angle);
    }

    Draw.color(ORANGE_GLOW);
    for (let i = 0; i < 4; i++) {
        let angle = i * 90 + 45;
        Drawf.tri(x, y, 2.5 * sizeScale, 9 * sizeScale, angle);
    }

    Fill.circle(x, y, 3.0 * sizeScale);
    Draw.reset();
});

const starBullet = extend(BasicBulletType, {
    speed: 18,
    damage: 45,
    lifetime: 50,
    width: 14,
    height: 14,
    shrinkX: 0,
    shrinkY: 0,
    ammoMultiplier: 4,
    reloadMultiplier: 1.3,
    pierceArmor: true, 
    collidesGround: false,
    collidesAir: true,
    frontColor: ORANGE_GLOW,
    backColor: RED_BRIGHT,

    lightRadius: 35,
    lightOpacity: 0.8,
    lightColor: RED_BRIGHT,

    hitEffect: starShrinkHitEffect,
    despawnEffect: starShrinkHitEffect,

    draw(b) {
        let x = b.x, y = b.y;
        let rotation = b.time * 12;

        let z = Draw.z();
        Draw.z(Layer.bullet);

        Draw.color(RED_BLOOD);
        Lines.stroke(2.0);
        Lines.circle(x, y, 5 + Mathf.absin(b.time, 2, 2));

        for (let i = 0; i < 4; i++) {
            let angle = rotation + i * 90;
            Drawf.tri(x, y, 4.5, 15, angle);
        }

        Draw.color(RED_BRIGHT);
        for (let i = 0; i < 4; i++) {
            let angle = rotation + i * 90;
            Drawf.tri(x, y, 3.0, 11, angle);
        }

        Draw.color(ORANGE_GLOW);
        for (let i = 0; i < 4; i++) {
            let angle = rotation + i * 90 + 45;
            Drawf.tri(x, y, 2.0, 7, angle);
        }

        Fill.circle(x, y, 2.5);

        Draw.z(z);
        Draw.reset();
    },

    hit(b, x, y) {
        if (this.hitEffect != null) {
            this.hitEffect.at(x, y, b.rotation(), this.backColor);
        }
        
        let target = Units.closestEnemy(b.team, x, y, 24, packBoolf(u => true));

        if (target != null && target.isFlying()) {
            let owner = b.owner;
            let mult = (owner != null && typeof owner.getAirDmgMultiplier === "function") ? owner.getAirDmgMultiplier() : 1.5;

            if (owner != null && typeof owner.addAirDmgBuff === "function") {
                let maxCap = (owner.getTier() == 1) ? 20.0 : 10.0;
                if (Mathf.chance(0.05)) {
                    owner.addAirDmgBuff(0.05, maxCap);
                }
                if (owner.getTier() == 2 && Mathf.chance(0.01)) {
                    owner.triggerMk2bBuff();
                }
            }

            let totalBulletDmg = b.damage * mult;
            target.damage(totalBulletDmg);

            if (target.shield != null && target.shield > 0) {
                let extraShieldDmg = totalBulletDmg * 5.0;
                target.shield = Math.max(0, target.shield - extraShieldDmg);
                Fx.shieldBreak.at(target.x, target.y, 15, ORANGE_GLOW);
            }

            if (target.health != null) {
                let curHP = target.health;
                target.health = Math.max(0, curHP - 99.0);

                if (target.health <= 0) {
                    target.kill();
                }

                Lightning.create(b.team, ORANGE_GLOW, 12, target.x, target.y, b.rotation(), 2);
                Fx.hitLancer.at(target.x, target.y, ORANGE_GLOW);

                let labelText = isEn() ? "[orange]-99 HP Energy (Shield Pierce)![]" : "[orange]-99 HP Energy (Xuyên Khiên)![]";
                Call.label(labelText, 1.0, target.x, target.y + 12);
            }
        }
    }
});

function createPerseferBullet(baseSpeed, baseDamage, baseLifetime, extraProps) {
    let bType = extend(BasicBulletType, {
        speed: baseSpeed,
        damage: baseDamage,
        lifetime: baseLifetime,
        collidesGround: false,
        collidesAir: true,

        hit(b, x, y) {
            if (this.hitEffect != null) {
                this.hitEffect.at(x, y, b.rotation(), this.backColor);
            }
            
            let target = Units.closestEnemy(b.team, x, y, 24, packBoolf(u => true));

            if (target != null && target.isFlying()) {
                let owner = b.owner;
                let mult = (owner != null && typeof owner.getAirDmgMultiplier === "function") ? owner.getAirDmgMultiplier() : 1.5;

                if (owner != null && typeof owner.addAirDmgBuff === "function") {
                    let maxCap = (owner.getTier() == 1) ? 20.0 : 10.0;
                    if (Mathf.chance(0.05)) {
                        owner.addAirDmgBuff(0.05, maxCap);
                    }
                    if (owner.getTier() == 2 && Mathf.chance(0.01)) {
                        owner.triggerMk2bBuff();
                    }
                }

                let totalBulletDmg = b.damage * mult;
                target.damage(totalBulletDmg);
            }
        }
    });

    if (extraProps != null) {
        Object.assign(bType, extraProps);
    }

    return bType;
}

const copperBullet = createPerseferBullet(12, 22, 75, { ammoMultiplier: 2, reloadMultiplier: 0.6 });
const graphiteBullet = createPerseferBullet(14, 35, 65, { ammoMultiplier: 3, reloadMultiplier: 0.5 });
const siliconBullet = createPerseferBullet(13, 26, 70, { homingPower: 0.12, homingRange: 120, ammoMultiplier: 3, reloadMultiplier: 0.6 });
const thoriumBaseBullet = createPerseferBullet(15, 40, 60, { ammoMultiplier: 4, reloadMultiplier: 0.8 });

let perseferBlock = null;

Events.on(ContentInitEvent, () => {
    perseferBlock = Vars.content.blocks().find(b => b != null && b.name != null && b.name.endsWith("persefer"));
    if (perseferBlock == null) return;

    perseferBlock.configurable = true;

    perseferBlock.addBar("starConvert", entity => {
        return new Bar(
            packProv(() => (isEn() ? "Star Ammo Conversion Ratio: " : "Tỉ lệ đạn Star: ") + Math.round(entity.getStarConversionProgress() * 100) + "%"),
            packProv(() => ORANGE_GLOW),
            packFloatp(() => entity.getStarConversionProgress())
        );
    });

    perseferBlock.ammoTypes.clear();
    perseferBlock.ammoTypes.put(Items.copper, copperBullet);
    perseferBlock.ammoTypes.put(Items.graphite, graphiteBullet);
    perseferBlock.ammoTypes.put(Items.silicon, siliconBullet);
    perseferBlock.ammoTypes.put(Items.thorium, thoriumBaseBullet);

    perseferBlock.config(java.lang.Integer, packCons2((tile, value) => {
        if (tile != null && tile.setTier !== undefined) {
            tile.setTier(value);
        }
    }));

    perseferBlock.buildType = () => extend(ItemTurret.ItemTurretBuild, perseferBlock, {
        tierState: 0, 
        continuousShootTime: 0,
        airDmgBonus: 1.5,
        haloAlpha: 0,

        mk2bStacks: 0,
        mk2bTimer: 0,

        nextBulletIsStar: false,

        created() {
            this.super$created();
            return this;
        },

        getTier(){ return this.tierState == null ? 0 : this.tierState; },

        setTier(val){
            this.tierState = val;
            Fx.upgradeCore.at(this.x, this.y);
        },

        getCritRate(){ 
            let baseRate = 0.05;
            if (this.getTier() == 1) baseRate += 0.15;
            let stackBonus = (this.mk2bTimer > 0) ? (this.mk2bStacks * 0.01) : 0;
            return Math.min(1.0, baseRate + stackBonus); 
        },

        getCritDamageMultiplier(){ 
            let baseMult = 0.50;
            if (this.getTier() == 1) baseMult += 0.30;
            let stackBonus = (this.mk2bTimer > 0) ? (this.mk2bStacks * 0.02) : 0;
            return baseMult + stackBonus; 
        },

        triggerMk2bBuff() {
            if (this.mk2bStacks < 100) {
                this.mk2bStacks += 1;
            }
            this.mk2bTimer = 40 * 60;
            Fx.heal.at(this.x, this.y);

            let labelText = isEn() ?
                "[gold]+1% Critical![]\n[orange](" + this.mk2bStacks + "/100)[]" :
                "[gold]+1% Bạo Kích![]\n[orange](" + this.mk2bStacks + "/100)[]";
            Call.label(labelText, 1.2, this.x, this.y + 12);
        },

        range() {
            let baseRange = this.super$range();
            return (this.getTier() == 2) ? (baseRange * 1.5) : baseRange;
        },

        addAirDmgBuff(amount, maxCap) {
            let cap = maxCap || 10.0;
            if (this.airDmgBonus < cap) {
                this.airDmgBonus = Math.min(cap, this.airDmgBonus + amount);
            }
        },

        getAirDmgMultiplier() {
            return this.airDmgBonus;
        },

        getStarConversionProgress() {
            let delayTicks = 120; 
            let rampUpTicks = (this.getTier() === 0) ? 1200 : 600; 
            
            if (this.continuousShootTime <= delayTicks) {
                return 0.0;
            }
            
            let progress = (this.continuousShootTime - delayTicks) / rampUpTicks;
            return Math.min(1.0, progress);
        },

        updateTile() {
            this.super$updateTile();

            if (this.mk2bTimer > 0) {
                this.mk2bTimer -= Time.delta;
                if (this.mk2bTimer <= 0) {
                    this.mk2bStacks = 0;
                }
            }

            let maxTime = (this.getTier() === 0) ? (120 + 1200) : (120 + 600);

            if (this.isShooting) {
                this.continuousShootTime = Math.min(maxTime, this.continuousShootTime + Time.delta);
                this.haloAlpha = Math.min(1.0, this.haloAlpha + Time.delta * 0.05);
            } else {
                this.continuousShootTime = Math.max(0, this.continuousShootTime - Time.delta * 1.5);
                this.haloAlpha = Math.max(0.0, this.haloAlpha - Time.delta * 0.03);
            }
        },

        draw() {
            this.super$draw();

            if (this.haloAlpha <= 0.001) return;

            let haloX = this.x + Angles.trnsx(this.rotation + 180, 8);
            let haloY = this.y + Angles.trnsy(this.rotation + 180, 8);

            let radiusX = 10.0; 
            let radiusY = 3.2;  
            let rotationDeg = this.rotation + 90;

            let points = 24;
            let rotRad = rotationDeg * Mathf.degRad;
            let cosRot = Math.cos(rotRad);
            let sinRot = Math.sin(rotRad);

            let getHaloVec = (angleDeg) => {
                let rad = angleDeg * Mathf.degRad;
                let lx = Math.cos(rad) * radiusX;
                let ly = Math.sin(rad) * radiusY;
                let rx = haloX + (lx * cosRot - ly * sinRot);
                let ry = haloY + (lx * sinRot + ly * cosRot);
                return new Vec2(rx, ry);
            };

            Draw.draw(Layer.effect + 0.1, packRun(() => {
                let curAlpha = this.haloAlpha;

                Draw.color(RED_BLOOD);
                Draw.alpha(curAlpha * 0.7);
                Lines.stroke(3.5);
                let lastP = getHaloVec(0);
                for (let i = 1; i <= points; i++) {
                    let nextP = getHaloVec(i * (360 / points));
                    Lines.line(lastP.x, lastP.y, nextP.x, nextP.y);
                    lastP = nextP;
                }

                Draw.color(RED_BRIGHT);
                Draw.alpha(curAlpha * 0.9);
                Lines.stroke(2.0);
                lastP = getHaloVec(0);
                for (let i = 1; i <= points; i++) {
                    let nextP = getHaloVec(i * (360 / points));
                    Lines.line(lastP.x, lastP.y, nextP.x, nextP.y);
                    lastP = nextP;
                }

                Draw.color(ORANGE_GLOW);
                Draw.alpha(curAlpha * 1.0);
                Lines.stroke(0.9);
                lastP = getHaloVec(0);
                for (let i = 1; i <= points; i++) {
                    let nextP = getHaloVec(i * (360 / points));
                    Lines.line(lastP.x, lastP.y, nextP.x, nextP.y);
                    lastP = nextP;
                }

                Draw.reset();
            }));
        },

        useAmmo() {
            let starChance = this.getStarConversionProgress();
            this.nextBulletIsStar = Mathf.chance(starChance);

            return this.super$useAmmo();
        },

        peekAmmo() {
            let baseType = this.super$peekAmmo();
            if (baseType == null) return null;

            if (this.nextBulletIsStar) {
                return starBullet;
            }

            return baseType;
        },

        handleBullet(bullet, x, y, angle){
            this.super$handleBullet(bullet, x, y, angle);

            if(bullet != null){
                if(this.getTier() == 1){
                    bullet.damage *= 1.5;
                }

                if(this.getTier() == 2){
                    bullet.lifetime *= 1.5;
                }

                if(Mathf.chance(this.getCritRate())){
                    bullet.damage *= (1.0 + this.getCritDamageMultiplier());
                    critEffect.at(bullet.x, bullet.y);
                }
            }
        },

        buildConfiguration(table){
            if (table == null) return;
            table.clear(); table.row();
            let tier = this.getTier();

            if(tier == 0) {
                table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                    if (Vars.ui == null) return;
                    let dialogTitle = isEn() ? "Persefer Turret Upgrade Center" : "Trung tâm nâng cấp pháo Persefer";
                    let dialog = extend(BaseDialog, dialogTitle, {});
                    
                    if (dialog.cont != null) {
                        let reqCell = dialog.cont.add(new Table());
                        reqCell.get().add(new Label(packProv(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if(core == null) return isEn() ? "[red]Team Core Not Found![]" : "[red]Không tìm thấy Lõi Đội![]";
                            let currentThorium = core.items.get(Items.thorium);
                            let currentSilicon = core.items.get(Items.silicon);
                            let currentSurge = core.items.get(Items.surgeAlloy);
                            let currentPhase = core.items.get(Items.phaseFabric);

                            let thoColor1 = currentThorium >= reqMK2.thorium ? "[green]" : "[red]";
                            let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
                            
                            let surColor2 = currentSurge >= reqMK2B.surgeAlloy ? "[green]" : "[red]";
                            let silColor2 = currentSilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                            let phaColor2 = currentPhase >= reqMK2B.phaseFabric ? "[green]" : "[red]";

                            return isEn() ?
                                "[yellow]CORE STORAGE REQUIREMENTS:[]\n" +
                                "[cyan]MK2 Branch:[]\n" +
                                " • Thorium: " + thoColor1 + currentThorium + "[] / " + reqMK2.thorium + "\n" +
                                " • Silicon: " + silColor1 + currentSilicon + "[] / " + reqMK2.silicon + "\n" +
                                "[purple]MK2B Branch:[]\n" +
                                " • Surge Alloy: " + surColor2 + currentSurge + "[] / " + reqMK2B.surgeAlloy + "\n" +
                                " • Silicon: " + silColor2 + currentSilicon + "[] / " + reqMK2B.silicon + "\n" +
                                " • Phase Fabric: " + phaColor2 + currentPhase + "[] / " + reqMK2B.phaseFabric :
                                "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                                "[cyan]Nhánh MK2:[]\n" +
                                " • Thorium: " + thoColor1 + currentThorium + "[] / " + reqMK2.thorium + "\n" +
                                " • Silicon: " + silColor1 + currentSilicon + "[] / " + reqMK2.silicon + "\n" +
                                "[purple]Nhánh MK2B:[]\n" +
                                " • Kim loại Surge: " + surColor2 + currentSurge + "[] / " + reqMK2B.surgeAlloy + "\n" +
                                " • Silicon: " + silColor2 + currentSilicon + "[] / " + reqMK2B.silicon + "\n" +
                                " • Vải Phase: " + phaColor2 + currentPhase + "[] / " + reqMK2B.phaseFabric;
                        }))).growX();

                        dialog.cont.row(); dialog.cont.add().height(10).row();

                        let branchesTable = new Table();

                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                        b1.add(isEn() ? "[cyan]===(MK2 - AA ENHANCEMENT)===[]" : "[cyan]===(MK2 - CƯỜNG HÓA PHÒNG KHÔNG)===[]").row();
                        let b1DText = isEn() ?
                            "[white]• Base bullet damage: [green]+50%[]\n" +
                            "• Crit chance: [orange]+15%[] | Crit damage: [yellow]+30%[]\n" +
                            "• Reduce Star bullet convert time to: [gold]10s[]\n" +
                            "• Air damage stack cap: [scarlet]2000%[]" :
                            "[white]• Sát thương gốc đạn: [green]+50%[]\n" +
                            "• Tỉ lệ bạo kích: [orange]+15%[] | Sát thương bạo kích: [yellow]+30%[]\n" +
                            "• Giảm thời gian biến đổi đạn Star xuống: [gold]10 giây[]\n" +
                            "• Giới hạn cộng dồn sát thương không quân: [scarlet]2000%[]";
                        let b1D = b1.add(b1DText);
                        b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                        b1.button(isEn() ? "[green]ACTIVATE MK2[]" : "[green]KÍCH HOẠT MK2[]", packRun(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if(core != null && core.items.get(Items.thorium) >= reqMK2.thorium && core.items.get(Items.silicon) >= reqMK2.silicon){
                                core.items.remove(Items.thorium, reqMK2.thorium); core.items.remove(Items.silicon, reqMK2.silicon);
                                Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                                this.configure(java.lang.Integer(1)); 
                                dialog.hide(); this.deselect();
                            } else { if(Vars.ui != null && Vars.ui.showInfo != null) Vars.ui.showInfo(isEn() ? "[red]Not enough resources for MK2![]" : "[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                        })).size(180, 38);

                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                        b2.add(isEn() ? "[purple]===(MK2B - DAMAGE MULTIPLIER)===[]" : "[purple]===(MK2B - BỘI PHÁT SÁT THƯƠNG)===[]").row();
                        let b2DText = isEn() ?
                            "[white]• Range & Lifetime: [green]+50%[]\n" +
                            "• Reduce Star bullet convert time to: [gold]10s[]\n" +
                            "• On hit: [gold]1% chance[] to stack buff (lasts 40s):\n" +
                            "  + Gain [orange]+1% Crit Chance[] (Max 100%)\n" +
                            "  + Gain [yellow]+2% Crit Damage[] (Max 200%)" :
                            "[white]• Tầm bắn & Thời gian bay của đạn: [green]+50%[]\n" +
                            "• Giảm thời gian biến đổi đạn Star xuống: [gold]10 giây[]\n" +
                            "• Trúng đạn: [gold]1% cơ hội[] tích buff (tồn tại 40s):\n" +
                            "  + Tăng [orange]+1% tỉ lệ bạo kích[] (Tối đa 100%)\n" +
                            "  + Tăng [yellow]+2% sát thương bạo kích[] (Tối đa 200%)";
                        let b2D = b2.add(b2DText);
                        b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                        b2.button(isEn() ? "[orange]ACTIVATE MK2B[]" : "[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if(core != null && core.items.get(Items.surgeAlloy) >= reqMK2B.surgeAlloy && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.phaseFabric) >= reqMK2B.phaseFabric){
                                core.items.remove(Items.surgeAlloy, reqMK2B.surgeAlloy); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.phaseFabric, reqMK2B.phaseFabric);
                                Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                                this.configure(java.lang.Integer(2)); 
                                dialog.hide(); this.deselect();
                            } else { if(Vars.ui != null && Vars.ui.showInfo != null) Vars.ui.showInfo(isEn() ? "[red]Not enough resources for MK2B![]" : "[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                        })).size(180, 38);

                        branchesTable.add(b1).width(340); branchesTable.row();
                        branchesTable.add().height(12).row();
                        branchesTable.add(b2).width(340);

                        let scroll = new ScrollPane(branchesTable);
                        scroll.setScrollingDisabled(true, false);
                        dialog.cont.add(scroll).maxHeight(400);
                        dialog.addCloseButton(); dialog.show();
                    }
                })).size(50, 40).tooltip(isEn() ? "Upgrade Persefer System" : "Nâng cấp hệ thống Persefer");
            } else {
                table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                    if (Vars.ui != null && Vars.ui.showInfo != null) Vars.ui.showInfo(isEn() ? "[scarlet]PERSEFER SYSTEM HAS REACHED MAXIMUM EVOLUTION LEVEL![]" : "[scarlet]HỆ THỐNG PERSEFER ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
                })).size(50, 40).tooltip(isEn() ? "Max Level Reached" : "Đã đạt cấp tối đa");
            }

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let currentBonusPct = Math.round((this.airDmgBonus - 1.5) * 100);
                let critRatePct = (this.getCritRate() * 100).toFixed(1);
                let critDmgPct = (this.getCritDamageMultiplier() * 100).toFixed(1);
                let remainingTime = (this.mk2bTimer / 60).toFixed(1);
                let convertPct = Math.round(this.getStarConversionProgress() * 100);
                let transformTimeStr = (this.getTier() === 0) ? (isEn() ? "20 seconds" : "20 giây") : (isEn() ? "10 seconds" : "10 giây");

                let title = isEn() ? " Persefer Turret Stats: " : " Thông số pháo Persefer: ";
                let descStr = isEn() ?
                    "[red]⚡ HALO AA SYSTEM ⚡[]\n" +
                    "[lightgray]Current Crit Chance:[] [orange]" + critRatePct + "%[]\n" +
                    "[lightgray]Current Crit Damage:[] [yellow]+" + critDmgPct + "%[]\n" +
                    "[lightgray]Star Ammo Convert Ratio:[] [gold]" + convertPct + "%[]\n\n" +
                    "• Default [scarlet]+150%[] extra damage against air targets.\n" +
                    "• [gold]5% chance[] per hit to add +5% air damage (Current: +" + currentBonusPct + "%).\n" +
                    "• Normal fire for 2s, then converts to [gold]Star Ammo[] over the next " + transformTimeStr + ".\n" +
                    "• [gold]Star Ammo deals +400% Shield Damage & Pierces Shield to deal -99 HP.[]\n" :
                    "[red]⚡ HỆ THỐNG PHÒNG KHÔNG HALO ⚡[]\n" +
                    "[lightgray]Tỉ lệ bạo kích hiện tại:[] [orange]" + critRatePct + "%[]\n" +
                    "[lightgray]Sát thương bạo kích hiện tại:[] [yellow]+" + critDmgPct + "%[]\n" +
                    "[lightgray]Tỉ lệ chuyển đổi đạn Star:[] [gold]" + convertPct + "%[]\n\n" +
                    "• Mặc định tăng [scarlet]+150%[] sát thương lên không quân.\n" +
                    "• [gold]5% cơ hội[] mỗi đạn trúng tăng +5% sát thương không quân (Đã tích: +" + currentBonusPct + "%).\n" +
                    "• Bắn 2s đầu, sau đó chuyển đổi thành [gold]Đạn Star[] trong " + transformTimeStr + " tiếp theo.\n" +
                    "• [gold]Đạn Star gây +400% Sát Thương Khiên & Xuyên Khiên trừ 99 HP.[]\n";

                if (this.getTier() == 2) {
                    descStr += isEn() ?
                        "\n[purple]⚡ MK2B STACK BUFFS ⚡[]\n" +
                        "• Stack Count: [gold]" + this.mk2bStacks + " / 100 stacks[]\n" +
                        "• Time Remaining: [cyan]" + (this.mk2bTimer > 0 ? remainingTime + "s" : "Expired") + "[]" :
                        "\n[purple]⚡ BUFF TÍCH LŨY MK2B ⚡[]\n" +
                        "• Số điểm tích lũy: [gold]" + this.mk2bStacks + " / 100 stack[]\n" +
                        "• Thời gian còn lại: [cyan]" + (this.mk2bTimer > 0 ? remainingTime + "s" : "Hết hiệu lực") + "[]";
                }

                if (Vars.ui == null) return;
                let dialog = extend(BaseDialog, title, {});
                let infoTable = new Table();
                let cell = infoTable.add(descStr).width(360);
                cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                let scroll = new ScrollPane(infoTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip(isEn() ? "View detailed stats" : "Xem thông số chi tiết");
        },

        config() { return java.lang.Integer(this.getTier()); },

        write(write){ 
            this.super$write(write); 
            write.i(this.getTier());
            write.f(this.airDmgBonus);
            write.i(this.mk2bStacks);
            write.f(this.mk2bTimer);
            write.f(this.continuousShootTime);
        },
        read(read, revision){ 
            this.super$read(read, revision); 
            this.tierState = read.i();
            this.airDmgBonus = read.f();
            this.mk2bStacks = read.i();
            this.mk2bTimer = read.f();
            this.continuousShootTime = read.f();
        }
    });
});

module.exports = {};