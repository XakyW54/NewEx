const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

const reqMK2 = { titanium: 500, silicon: 300, plastanium: 0 };
const reqMK2B = { titanium: 800, silicon: 400, plastanium: 200 }; 

// Hiệu ứng vụ nổ MK2B (bán kính 35 ô = 280px)
const fxTyteryiExplosion = new Effect(50, cons(e => {
    Draw.z(Layer.effect + 0.1);
    let maxRadius = 280;
    let alpha = 1.0 - e.fin();
    let col = Color.valueOf("#ff3300");

    Draw.color(col);
    Draw.alpha(alpha * 0.35);
    Fill.circle(e.x, e.y, maxRadius);

    Draw.color(col);
    Draw.alpha(alpha * 0.7);
    Lines.stroke(2.5 * alpha);
    Lines.circle(e.x, e.y, maxRadius);

    const ringColors = [
        Color.valueOf("#ffffff"), 
        Color.valueOf("#ffcc00"), 
        col 
    ];

    for (let i = 0; i < 3; i++) {
        let delay = i * 0.12;
        if (e.fin() > delay) {
            let progress = (e.fin() - delay) / (1.0 - delay);
            let smoothProgress = Interp.pow3Out.apply(progress);
            let dynamicRadius = maxRadius * smoothProgress;

            Draw.color(ringColors[i]);
            Draw.alpha(alpha * (1.0 - smoothProgress));
            Lines.stroke((14.0 - i * 3.0) * (1.0 - smoothProgress));
            Lines.circle(ringColors[i]);
            Lines.circle(e.x, e.y, dynamicRadius);
        }
    }

    Draw.reset();
}));

function createTyteryiBullet(baseProperties) {
    let bullet = extend(BasicBulletType, {
        hitEntity(b, other, initialHealth) {
            this.super$hitEntity(b, other, initialHealth);
            
            if (other != null && b != null && b.owner != null) {
                let turret = b.owner;
                let tier = turret.getTier ? turret.getTier() : 0;
                let isMaxCharged = turret.stackDmgBonus != null && turret.stackDmgBonus >= 50.0;

                // MK2: Tích đủ năng lượng gây thêm 1% max HP
                if (tier == 1 && isMaxCharged) {
                    other.damage(other.maxHealth * 0.01);
                }

                // MK2B: Tích đủ năng lượng nổ 35 ô gây 0.5% max HP
                if (tier == 2 && isMaxCharged) {
                    let exX = other.x;
                    let exY = other.y;
                    let radiusPx = 280;

                    fxTyteryiExplosion.at(exX, exY);
                    Effect.shake(6, 6, exX, exY);

                    Groups.unit.intersect(exX - radiusPx, exY - radiusPx, radiusPx * 2, radiusPx * 2, cons(nearUnit => {
                        if (nearUnit != null && nearUnit.isValid() && nearUnit.within(exX, exY, radiusPx) && nearUnit.team != turret.team) {
                            nearUnit.damage(nearUnit.maxHealth * 0.005);
                        }
                    }));
                }
            }
        }
    });

    Object.assign(bullet, baseProperties);
    return bullet;
}

// --- Silicon Bullets ---
const tyteryiBullet = createTyteryiBullet({
    speed: 8, damage: 67.5, lifetime: 48, width: 11, height: 16, 
    frontColor: Color.white, backColor: Color.valueOf("#e0b080"),
    pierce: true, pierceCap: 3, pierceBuilding: true, knockback: 1, impact: true,
    hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail,
    trailEffect: Fx.disperseTrail, trailChance: 0.20
});

const tyteryiMK2Bullet = createTyteryiBullet({
    speed: 10, damage: 97.5, lifetime: 45, width: 13, height: 20, 
    frontColor: Color.white, backColor: Color.valueOf("#ffaa66"),
    pierce: true, pierceCap: 5, pierceBuilding: true, knockback: 1.4, impact: true,
    hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail,
    trailEffect: Fx.disperseTrail, trailChance: 0.40
});

const tyteryiMK2BBullet = createTyteryiBullet({
    speed: 9, damage: 183.75, lifetime: 50, width: 5, height: 64, 
    frontColor: Color.white, backColor: Color.valueOf("#831006"),
    trailEffect: Fx.disperseTrail, trailChance: 0.40, 
    trailColor: Color.valueOf("#ff2525"),
    pierce: false, pierceBuilding: false, knockback: 2.8, impact: true, 
    homingPower: 0.15, homingRange: 200,
    hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail
});

// --- Copper Bullets ---
const tyteryiCopperBullet = createTyteryiBullet({
    speed: 8, damage: 33.75, lifetime: 48, width: 11, height: 16, 
    frontColor: Color.white, backColor: Color.valueOf("#d99d73"),
    pierce: true, pierceCap: 3, pierceBuilding: true, knockback: 1, impact: true,
    hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail,
    trailEffect: Fx.disperseTrail, trailChance: 0.20
});

const tyteryiCopperMK2Bullet = createTyteryiBullet({
    speed: 10, damage: 48.75, lifetime: 45, width: 13, height: 20, 
    frontColor: Color.white, backColor: Color.valueOf("#d99d73"),
    pierce: true, pierceCap: 5, pierceBuilding: true, knockback: 1.4, impact: true,
    hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail,
    trailEffect: Fx.disperseTrail, trailChance: 0.40
});

const tyteryiCopperMK2BBullet = createTyteryiBullet({
    speed: 9, damage: 91.875, lifetime: 50, width: 5, height: 64, 
    frontColor: Color.white, backColor: Color.valueOf("#b85b37"),
    trailEffect: Fx.disperseTrail, trailChance: 0.40, 
    trailColor: Color.valueOf("#d99d73"),
    pierce: false, pierceBuilding: false, knockback: 2.8, impact: true, 
    homingPower: 0.15, homingRange: 200,
    hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail
});

// LẮP LOGIC VÀO BLOCK TỪ HJSON KHI GAME NẠP XONG CONTENT
Events.on(ContentInitEvent, cons(e => {
    const vendicum = Vars.content.block("newex-tyteryi");
    if (!vendicum) return;

    vendicum.shootSound = Sounds.none;
    vendicum.shootEffect = Fx.none;
    vendicum.unitSort = UnitSorts.closest;

    vendicum.shoot = new ShootBarrel();
    vendicum.shoot.shots = 1;
    vendicum.shoot.shotDelay = 3.75;

    vendicum.drawer = new DrawTurret("reinforced-");

    vendicum.ammo(
        Items.silicon, tyteryiBullet,
        Items.copper, tyteryiCopperBullet
    );

    // Thêm các thanh Bar hiển thị Buff
    vendicum.setBars();
    
    vendicum.addBar("dmg_bonus", new Func({
        get: function(e){
            return new Bar(
                new Prov({ get: function(){ 
                    let totalBonus = Math.floor((e.getDmgRatio() * 5 + (e.stackDmgBonus || 0)) * 100);
                    return "DMG: +" + totalBonus + "%"; 
                } }),
                new Prov({ get: function(){ return Color.orange; } }),
                new Floatp({ get: function(){ return Math.min(1.0, (e.getDmgRatio() * 5 + (e.stackDmgBonus || 0)) / 14.99); } })
            );
        }
    }));

    vendicum.addBar("as_bonus", new Func({
        get: function(e){
            return new Bar(
                new Prov({ get: function(){ return "AS: " + (Math.floor(e.getAsRatio() * 250) >= 0 ? "+" : "") + Math.floor(e.getAsRatio() * 250) + "%"; } }),
                new Prov({ get: function(){ return Color.cyan; } }),
                new Floatp({ get: function(){ return Math.max(e.getAsRatio(), 0); } })
            );
        }
    }));

    vendicum.config(java.lang.Integer, packCons2((tile, value) => {
        if (tile != null && tile.tryUpgrade !== undefined) {
            let val = Number(value);
            if (val == 1 || val == 2) {
                tile.tryUpgrade(val);
            } else {
                tile.setTier(val);
            }
        }
    }));

    // Cấu hình BuildType (Entity điều khiển)
    vendicum.buildType = () => extend(ItemTurret.ItemTurretBuild, vendicum, {
        energyState: 1.0, // Ban đầu đạt 100% (cho 500% tốc độ bắn)
        tierState: 0, 
        customRecoil: 0.0,
        stackDmgBonus: 0.0, // Sát thương cộng thêm (tối đa 50.0 = +5000%)

        paidTitanium: 0,
        paidSilicon: 0,
        paidPlastanium: 0,

        getDmgRatio(){ return this.stackDmgBonus || 0; },
        getAsRatio(){ return this.energyState || 0; },

        peekAmmo(){
            let tier = this.getTier();
            let isCopper = false;

            if (this.hasAmmo()) {
                let entry = this.ammo.peek();
                if (entry != null && entry.item === Items.copper) {
                    isCopper = true;
                }
            }

            if(tier == 1) return isCopper ? tyteryiCopperMK2Bullet : tyteryiMK2Bullet;
            if(tier == 2) return isCopper ? tyteryiCopperMK2BBullet : tyteryiMK2BBullet;
            return isCopper ? tyteryiCopperBullet : tyteryiBullet;
        },

        getTier(){ return this.tierState == null ? 0 : this.tierState; },
        setTier(val){ 
            this.tierState = val;
            this.paidTitanium = 0;
            this.paidSilicon = 0;
            this.paidPlastanium = 0;
            if(val == 0) { this.health = 1200; }
            if(val == 1) { this.health = 1800; }
            if(val == 2) { this.health = 1600; }
            this.maxHealth = this.health;
        },

        tryUpgrade(targetTier){
            if(this.getTier() != 0) return false;

            let req = (targetTier == 1) ? reqMK2 : (targetTier == 2 ? reqMK2B : null);
            if(req == null) return false;

            let core = this.team.core();
            if(core == null) return false;

            let reqT = req.titanium || 0;
            let reqS = req.silicon || 0;
            let reqP = req.plastanium || 0;

            let coreT = core.items.get(Items.titanium);
            let coreS = core.items.get(Items.silicon);
            let coreP = core.items.get(Items.plastanium);

            if(coreT >= reqT && coreS >= reqS && coreP >= reqP){
                if(reqT > 0) core.items.remove(Items.titanium, reqT);
                if(reqS > 0) core.items.remove(Items.silicon, reqS);
                if(reqP > 0) core.items.remove(Items.plastanium, reqP);

                this.setTier(targetTier);

                if(targetTier == 1) Fx.upgradeCore.at(this.x, this.y);
                else Fx.bigShockwave.at(this.x, this.y);
                Fx.mineHuge.at(this.x, this.y);
                Effect.shake(4, 4, this.x, this.y);
                return true;
            } else {
                if(!Vars.headless && Vars.player != null){
                    Vars.ui.showInfo(isEn() ? "[scarlet]Not enough resources in core![]" : "[scarlet]Không đủ tài nguyên trong lõi![]");
                }
                return false;
            }
        },

        range(){
            let tier = this.getTier();
            if(tier == 1) return 420; 
            if(tier == 2) return 360; 
            return 320;               
        },

        buildConfiguration(table){
            table.clear(); table.row();
            let tier = this.getTier();

            if(tier == 0) {
                table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                    let core = this.team.core();
                    let availT = core ? core.items.get(Items.titanium) : 0;
                    let availS = core ? core.items.get(Items.silicon) : 0;
                    let availP = core ? core.items.get(Items.plastanium) : 0;

                    let dialog = extend(BaseDialog, isEn() ? "Tyteryi Upgrade Center" : "Trung tâm nâng cấp pháo Tyteryi", {});
                    
                    let textT_MK2 = (availT >= reqMK2.titanium ? "[green]" : "[scarlet]") + availT + "[] / " + reqMK2.titanium;
                    let textS_MK2 = (availS >= reqMK2.silicon ? "[green]" : "[scarlet]") + availS + "[] / " + reqMK2.silicon;

                    let textT_MK2B = (availT >= reqMK2B.titanium ? "[green]" : "[scarlet]") + availT + "[] / " + reqMK2B.titanium;
                    let textS_MK2B = (availS >= reqMK2B.silicon ? "[green]" : "[scarlet]") + availS + "[] / " + reqMK2B.silicon;
                    let textP_MK2B = (availP >= reqMK2B.plastanium ? "[green]" : "[scarlet]") + availP + "[] / " + reqMK2B.plastanium;

                    let reqStr = isEn() ?
                        "[yellow]CORE RESOURCES / REQUIRED FOR UPGRADE:[]\n" +
                        "[cyan]MK2 Branch:[]\n" +
                        " • Titanium: " + textT_MK2 + "\n" +
                        " • Silicon: " + textS_MK2 + "\n" +
                        "[purple]MK2B Branch:[]\n" +
                        " • Titanium: " + textT_MK2B + "\n" +
                        " • Silicon: " + textS_MK2B + "\n" +
                        " • Plastanium: " + textP_MK2B :
                        "[yellow]TÀI NGUYÊN TRONG LÕI / CẦN NÂNG CẤP:[]\n" +
                        "[cyan]Nhánh MK2:[]\n" +
                        " • Titan: " + textT_MK2 + "\n" +
                        " • Silicon: " + textS_MK2 + "\n" +
                        "[purple]Nhánh MK2B:[]\n" +
                        " • Titan: " + textT_MK2B + "\n" +
                        " • Silicon: " + textS_MK2B + "\n" +
                        " • Nhựa Plastanium: " + textP_MK2B;

                    let reqCell = dialog.cont.add(reqStr);
                    reqCell.width(360).get().setWrap(true);
                    reqCell.get().setAlignment(Align.left);
                    dialog.cont.row(); dialog.cont.add().height(10).row();

                    let branchesTable = new Table();

                    let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                    b1.add("[cyan]===(MK2 - PENETRATION)===[]").row();
                    let b1D = b1.add(isEn() ? 
                                    "[white]• Health: [green]+50%[] (1,800 HP)\n" +
                                    "• Range: [green]+31.25%[] (420 px)\n" +
                                    "• Base Damage: [green]+44.4%[] (97.5 DMG)\n\n" +
                                    "[lightgray]Special Perk: Full Heat Empowerment — Reaching max stack adds +1% Max HP true damage per bullet.[]" :
                                    "[white]• Máu cấu trúc: [green]+50%[] (1,800 HP)\n" +
                                    "• Tầm bắn: [green]+31.25%[] (420 px)\n" +
                                    "• Sát thương gốc: [green]+44.4%[] (97.5 DMG)\n\n" +
                                    "[lightgray]Nội tại nâng cấp: Tích đủ tần giới hạn, đạn bắn ra sẽ gây thêm 1% Max HP của mục tiêu.[]");
                    b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                    b1.button(isEn() ? "[green]UPGRADE MK2[]" : "[green]NÂNG CẤP MK2[]", packRun(() => {
                        if(Vars.net.active()){
                            Call.tileConfig(Vars.player, this, java.lang.Integer(1));
                        } else {
                            this.tryUpgrade(1);
                        }
                        dialog.hide();
                        this.deselect();
                    })).size(180, 38);

                    let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                    b2.add("[purple]===(MK2B - HOMING)===[]").row();
                    let b2D = b2.add(isEn() ? 
                                    "[white]• Health: [green]+33.3%[] (1,600 HP)\n" +
                                    "• Range: [green]+12.5%[] (360 px)\n" +
                                    "• Base Damage: [green]+172.2%[] (183.75 DMG)\n\n" +
                                    "[lightgray]Special Perk: Full Heat Blast — Reaching max stack causes bullet hits to trigger a 35-tile explosion dealing 0.5% Max HP.[]" :
                                    "[white]• Máu cấu trúc: [green]+33.3%[] (1,600 HP)\n" +
                                    "• Tầm bắn: [green]+12.5%[] (360 px)\n" +
                                    "• Sát thương gốc: [green]+172.2%[] (183.75 DMG)\n\n" +
                                    "[lightgray]Nội tại nâng cấp: Tích đủ tần giới hạn, đạn bắn ra nổ phạm vi 35 ô với 0.5% Max HP.[]");
                    b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                    b2.button(isEn() ? "[orange]UPGRADE MK2B[]" : "[orange]NÂNG CẤP MK2B[]", packRun(() => {
                        if(Vars.net.active()){
                            Call.tileConfig(Vars.player, this, java.lang.Integer(2));
                        } else {
                            this.tryUpgrade(2);
                        }
                        dialog.hide();
                        this.deselect();
                    })).size(180, 38);

                    branchesTable.add(b1).width(340); branchesTable.row();
                    branchesTable.add().height(12).row();
                    branchesTable.add(b2).width(340);

                    let scroll = new ScrollPane(branchesTable);
                    scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400);
                    dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip(isEn() ? "Upgrade Tyteryi system" : "Nâng cấp hệ thống Tyteryi");
            } else {
                table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                    Vars.ui.showInfo(isEn() ? "[scarlet]TYTERYI HAS REACHED MAX EVOLUTION LEVEL![]" : "[scarlet]HỆ THỐNG TYTERYI ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
                })).size(50, 40).tooltip(isEn() ? "Max level reached" : "Đã đạt cấp tối đa");
            }

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = isEn() ? " Tyteryi Turret Stats: " : " Thông số pháo Tyteryi: ";
                let descStr = "";
                let currentTier = this.getTier();

                if (currentTier == 0) {
                    title += "[yellow](MK1)[]";
                    descStr = isEn() ? 
                              "[gold]⚡ BASE STATS (MK1) ⚡[]\n" +
                              "[lightgray]Turret HP:[] [green]1,200[]\n" +
                              "[lightgray]Effective Range:[] [orange]320 px[]\n" +
                              "[lightgray]Base Damage (Silicon):[] [yellow]67.50 DMG[]\n" +
                              "[lightgray]Base Damage (Copper):[] [orange]33.75 DMG[]\n" +
                              "[lightgray]Penetration:[] [white]3 targets[]\n\n" +
                              "[sky]⚡ MECHANIC:[]\n" +
                              "• Starts at 500% Attack Speed, decreasing by 5%/s while firing.\n" +
                              "• Damage starts at 0% bonus and increases by 50%/s up to 5000%." :
                              "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                              "[lightgray]Máu tháp pháo:[] [green]1,200[]\n" +
                              "[lightgray]Tầm bắn hiệu dụng:[] [orange]320 pixel[]\n" +
                              "[lightgray]Sát thương Silicon:[] [yellow]67.50 DMG[]\n" +
                              "[lightgray]Sát thương Đồng (Copper):[] [orange]33.75 DMG[]\n" +
                              "[lightgray]Khả năng xuyên thấu:[] [white]3 mục tiêu[]\n\n" +
                              "[sky]⚡ CƠ CHẾ BẮN VÀ TÍCH LŨY:[]\n" +
                              "• Tốc độ bắn ban đầu là 500%, giảm dần 5%/giây khi liên tục bắn.\n" +
                              "• Sát thương tăng dần 50%/giây khi bắn, tối đa cộng thêm +5000% DMG.";
                } 
                else if (currentTier == 1) {
                    title += "[cyan](MK2)[]";
                    descStr = isEn() ? 
                              "[cyan]⚡ BASE STATS (MK2) ⚡[]\n" +
                              "[lightgray]Turret HP:[] [green]1,800 [lime](+50%)[]\n" +
                              "[lightgray]Effective Range:[] [orange]420 px [lime](+31.2%)[]\n" +
                              "[lightgray]Base Damage (Silicon):[] [yellow]97.50 DMG [lime](+44.4%)[]\n" +
                              "[lightgray]Base Damage (Copper):[] [orange]48.75 DMG[]\n" +
                              "[lightgray]Penetration:[] [yellow]5 targets[]\n\n" +
                              "[lime]⚡ SPECIAL EFFECT:[]\n" +
                              "• Firing until max stack deals [green]+1% Max HP[] bonus damage." :
                              "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                              "[lightgray]Máu tháp pháo:[] [green]1,800 [lime](+50%)[]\n" +
                              "[lightgray]Tầm bắn hiệu dụng:[] [orange]420 pixel [lime](+31.2%)[]\n" +
                              "[lightgray]Sát thương Silicon:[] [yellow]97.50 DMG [lime](+44.4%)[]\n" +
                              "[lightgray]Sát thương Đồng (Copper):[] [orange]48.75 DMG[]\n" +
                              "[lightgray]Khả năng xuyên thấu:[] [yellow]5 mục tiêu[]\n\n" +
                              "[lime]⚡ HIỆU ỨNG ĐẶC BIỆT:[]\n" +
                              "• Khi đạt đủ mốc giới hạn tích lũy, đạn bắn ra gây thêm [green]1% Max HP[] của mục tiêu.";
                } 
                else if (currentTier == 2) {
                    title += "[purple](MK2B)[]";
                    descStr = isEn() ? 
                              "[purple]⚡ BASE STATS (MK2B) ⚡[]\n" +
                              "[lightgray]Turret HP:[] [green]1,600 [lime](+33.3%)[]\n" +
                              "[lightgray]Effective Range:[] [orange]360 px [lime](+12.5%)[]\n" +
                              "[lightgray]Base Damage (Silicon):[] [red]183.75 DMG (+172.2%)[]\n" +
                              "[lightgray]Base Damage (Copper):[] [orange]91.875 DMG[]\n\n" +
                              "[purple]🔥 SPECIAL EFFECT:[]\n" +
                              "• Firing until max stack triggers a 35-tile AOE explosion dealing [pink]0.5% Max HP[]." :
                              "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                              "[lightgray]Máu tháp pháo:[] [green]1,600 [lime](+33.3%)[]\n" +
                              "[lightgray]Tầm bắn hiệu dụng:[] [orange]360 pixel [lime](+12.5%)[]\n" +
                              "[lightgray]Sát thương Silicon:[] [red]183.75 DMG (+172.2%)[]\n" +
                              "[lightgray]Sát thương Đồng (Copper):[] [orange]91.875 DMG[]\n\n" +
                              "[purple]🔥 HIỆU ỨNG ĐẶC BIỆT:[]\n" +
                              "• Khi đạt đủ mốc giới hạn tích lũy, đạn bắn ra nổ phạm vi 35 ô với [pink]0.5% Max HP[].";
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

            if(this.isShooting && this.hasAmmo() && this.isActive()){
                // Tốc độ bắn giảm 5%/giây khi bắn (0.05 / 60)
                this.energyState = Math.max(0.0, this.energyState - (0.05 * Time.delta / 60));
                
                // Damage Bonus tăng 50%/giây (0.50 / 60 = 0.008333) -> Tối đa +5000% (50.0)
                this.stackDmgBonus = Math.min(50.0, (this.stackDmgBonus || 0) + (0.50 * Time.delta / 60));
            } else {
                // Tự động hồi lại tốc độ bắn khi nghỉ
                if(this.energyState < 1.0){ 
                    this.energyState = Math.min(1.0, this.energyState + (0.20 * Time.delta / 60)); 
                }
                // Giảm dần sát thương tích lũy khi nghỉ
                if(this.stackDmgBonus > 0.0){
                    this.stackDmgBonus = Math.max(0.0, this.stackDmgBonus - (0.50 * Time.delta / 60));
                }
            }

            this.customRecoil = Mathf.approach(this.customRecoil, 0.0, 0.12 * Time.delta);
        },

        shoot(type){
            this.super$shoot(type); 
            this.customRecoil = 1.0;
        },

        handleBullet(bullet, x, y, angle){ 
            if(bullet != null) {
                // Áp dụng lượng dmg bonus đang tích lũy
                bullet.damage = bullet.type.damage * (1.0 + (this.stackDmgBonus || 0)); 
                bullet.owner = this;
            }
            this.super$handleBullet(bullet, x, y, angle); 
        },

        baseReloadSpeed(){ 
            // Ban đầu energyState = 1.0 -> 1.0 + 4.0 = 5.0 (500% tốc bắn)
            let speedMult = 1.0 + ((this.energyState || 0) * 4.0);
            return this.efficiency * speedMult; 
        },

        draw(){
            let modName = this.block.name.split("-")[0]; 
            let baseRegion = Core.atlas.find(this.block.basePrefix + "" + this.block.size);
            if(baseRegion.found()){
                Draw.rect(baseRegion, this.x, this.y);
            } else {
                this.super$draw(); 
            }

            let rad = this.rotation * Mathf.degRad;
            let cos = Math.cos(rad);
            let sin = Math.sin(rad);

            let maxBarrelRecoilDistance = -5.0; 
            let sideMoveDistance = (this.energyState || 0) * 4.0; 

            let barrel1Region = Core.atlas.find(modName + "-tyteryi-barrel1");
            if(barrel1Region.found()){
                let b1x = this.x - (sideMoveDistance * sin);
                let b1y = this.y + (sideMoveDistance * cos);
                Draw.rect(barrel1Region, b1x, b1y, this.rotation);
            }

            let barrel2Region = Core.atlas.find(modName + "-tyteryi-barrel2");
            if(barrel2Region.found()){
                let b2x = this.x + (sideMoveDistance * sin);
                let b2y = this.y - (sideMoveDistance * cos);
                Draw.rect(barrel2Region, b2x, b2y, this.rotation);
            }

            let b1Offset = this.customRecoil * maxBarrelRecoilDistance;
            let b1Region = Core.atlas.find(modName + "-tyteryi-b1");
            if (b1Region.found()) {
                let b1ax = this.x + b1Offset * cos;
                let b1ay = this.y + b1Offset * sin;
                Draw.rect(b1Region, b1ax, b1ay, this.rotation);
            }
        },

        write(write){ 
            this.super$write(write); 
            write.b(this.getTier()); 
            write.i(this.paidTitanium);
            write.i(this.paidSilicon);
            write.i(this.paidPlastanium);
            write.f(this.energyState != null ? this.energyState : 1.0); 
            write.f(this.stackDmgBonus != null ? this.stackDmgBonus : 0.0);
        },
        read(read, revision){ 
            this.super$read(read, revision); 
            this.setTier(read.b()); 
            this.paidTitanium = read.i();
            this.paidSilicon = read.i();
            this.paidPlastanium = read.i();
            if(revision >= 1) this.energyState = read.f(); 
            if(revision >= 2) this.stackDmgBonus = read.f(); else this.stackDmgBonus = 0.0;
            this.customRecoil = 0.0;
        }
    });
}));