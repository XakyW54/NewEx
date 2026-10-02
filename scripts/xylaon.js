const customCritEffect = new Effect(15, e => {
    Draw.color(Color.yellow, Color.white, e.fin());
    Lines.stroke(e.fout() * 1.5);
    Lines.lineAngle(e.x, e.y, e.rotation, e.fout() * 12);
});

const customHitBullet = new Effect(14, e => {
    Draw.color(Color.orange, Color.white, e.fin());
    Lines.stroke(e.fout() * 2);
    Lines.circle(e.x, e.y, e.fin() * 10);
});

const customHitLancer = new Effect(20, e => {
    Draw.color(Color.valueOf("#b92eff"), Color.white, e.fin());
    Lines.stroke(e.fout() * 2.5);
    Lines.circle(e.x, e.y, e.fin() * 14);
});

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

const reqMK2 = { titanium: 400, silicon: 400, plastanium: 0 };
const reqMK2B = { titanium: 500, silicon: 400, plastanium: 200 };

const overheatCapTable = [60 * 9, 60 * 8, 60 * 8];
const cooldownCapTable = [60 * 4, 60 * 3, 60 * 1.5]; 
const maxAsCapTable = [60 * 3, 60 * 3, 60 * 3];
const asMultiplierTable = [3.5, 4.5, 9.99];          

let xylaon = extend(ItemTurret, "xylaon", {});
xylaon.health = 2400;
xylaon.size = 4;
xylaon.reload = 20;
xylaon.range = 420;
xylaon.configurable = true;
xylaon.category = Category.turret;

xylaon.itemCapacity = 30;     
xylaon.ammoPerShot = 1;        
xylaon.shots = 5;              
xylaon.inaccuracy = 4.5;       

const setupBulletSpecs = (bullet) => {
    bullet.pierce = true;             
    bullet.pierceCap = 3;             
    bullet.homingPower = 0.04;        
    bullet.homingRange = 120;        
};

let xylaonBullet = extend(BasicBulletType, {
    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        if(Mathf.chance(0.5)){
            entity.damage(b.damage * 0.8);
            customCritEffect.at(b.x, b.y, b.rotation());
        }
    }
});
xylaonBullet.speed = 12;
xylaonBullet.damage = 20;
xylaonBullet.lifetime = 35;
xylaonBullet.width = 4;
xylaonBullet.height = 18;
xylaonBullet.trailChance = 0.2; 
xylaonBullet.trailEffect = Fx.disperseTrail;
xylaonBullet.trailColor = Color.valueOf("#66ccff");
xylaonBullet.backColor = Color.valueOf("#88ddff");
xylaonBullet.frontColor = Color.white;
setupBulletSpecs(xylaonBullet);

let xylaonCopperBullet = extend(BasicBulletType, {
    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        if(Mathf.chance(0.5)){
            entity.damage(b.damage * 0.8);
            customCritEffect.at(b.x, b.y, b.rotation());
        }
    }
});
xylaonCopperBullet.speed = 11;
xylaonCopperBullet.damage = 12;
xylaonCopperBullet.lifetime = 38;
xylaonCopperBullet.width = 3.5;
xylaonCopperBullet.height = 15;
xylaonCopperBullet.trailChance = 0.15;
xylaonCopperBullet.trailEffect = Fx.disperseTrail;
xylaonCopperBullet.trailColor = Color.valueOf("#d99d73");
xylaonCopperBullet.backColor = Color.valueOf("#ebaa78");
xylaonCopperBullet.frontColor = Color.white;
setupBulletSpecs(xylaonCopperBullet);

let xylaonMK2Bullet = extend(BasicBulletType, {
    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        if(Mathf.chance(0.5)){
            entity.damage(b.damage * 0.8);
            customCritEffect.at(b.x, b.y, b.rotation());
        }
    }
});
xylaonMK2Bullet.speed = 15.6; 
xylaonMK2Bullet.damage = 26; 
xylaonMK2Bullet.lifetime = 35; 
xylaonMK2Bullet.width = 5.2; 
xylaonMK2Bullet.height = 23.4; 
xylaonMK2Bullet.hitSize = 13;
xylaonMK2Bullet.trailChance = 0.2;   
xylaonMK2Bullet.trailEffect = Fx.disperseTrail; 
xylaonMK2Bullet.trailColor = Color.valueOf("#ffaa66");
xylaonMK2Bullet.backColor = Color.valueOf("#ffcc88"); 
xylaonMK2Bullet.frontColor = Color.white; 
xylaonMK2Bullet.despawnEffect = customHitBullet;
xylaonMK2Bullet.knockback = 1.3; 
xylaonMK2Bullet.impact = true;
setupBulletSpecs(xylaonMK2Bullet);

let xylaonMK2BBullet = extend(BasicBulletType, {
    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        if(Mathf.chance(0.5)){
            entity.damage(b.damage * 0.8);
            customCritEffect.at(b.x, b.y, b.rotation());
        }
    }
});
xylaonMK2BBullet.speed = 16.5; 
xylaonMK2BBullet.damage = 13; 
xylaonMK2BBullet.lifetime = 18; 
xylaonMK2BBullet.width = 4.5; 
xylaonMK2BBullet.height = 25.0; 
xylaonMK2BBullet.hitSize = 11;
xylaonMK2BBullet.trailChance = 0.1; 
xylaonMK2BBullet.trailEffect = Fx.disperseTrail; 
xylaonMK2BBullet.trailColor = Color.valueOf("#b92eff");
xylaonMK2BBullet.backColor = Color.valueOf("#e09cf1"); 
xylaonMK2BBullet.frontColor = Color.white; 
xylaonMK2BBullet.despawnEffect = customHitLancer;
xylaonMK2BBullet.despawnColor = Color.valueOf("#aa2ee8");
xylaonMK2BBullet.knockback = 0.8; 
xylaonMK2BBullet.impact = true;
setupBulletSpecs(xylaonMK2BBullet);

xylaon.ammo(
    Items.graphite, xylaonBullet,
    Items.copper, xylaonCopperBullet
);

xylaon.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

xylaon.addBar("heat", e => new Bar(
    new Prov({
        get: function(){
            let heat = e.getHeat();
            return heat < 0 ? 
                "COOLING: " + (Math.floor(Math.abs(heat / 6)) / 10) + "s" : 
                "HEAT: " + (Math.floor(heat / 6) / 10) + "s";
        }
    }),
    new Prov({
        get: function(){ return e.getHeat() < 0 ? Pal.heal : Pal.lightOrange; }
    }),
    new Floatp({
        get: function(){
            let heat = e.getHeat();
            let tier = e.getTier();
            return heat < 0 ? Math.min(Math.abs(heat) / cooldownCapTable[tier], 1) : Math.min(heat / overheatCapTable[tier], 1);
        }
    })
));

xylaon.addBar("as", e => new Bar(
    new Prov({
        get: function(){
            let tier = e.getTier();
            let heat = Math.max(e.getHeat(), 0);
            let currentAsBonus = Math.min(heat / maxAsCapTable[tier], 1) * asMultiplierTable[tier] * 100;
            return "+" + Math.floor(currentAsBonus) + "% AS";
        }
    }),
    new Prov({
        get: function(){ return Color.cyan; }
    }),
    new Floatp({
        get: function(){ 
            let tier = e.getTier();
            return Math.min(Math.max(e.getHeat(), 0) / maxAsCapTable[tier], 1); 
        }
    })
));

xylaon.buildType = () => extend(ItemTurret.ItemTurretBuild, xylaon, {
    thermalstate: 0,
    tierState: 0, 

    paidTitanium: 0,
    paidSilicon: 0,
    paidPlastanium: 0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        this.paidTitanium = 0;
        this.paidSilicon = 0;
        this.paidPlastanium = 0;
        if(val == 0) this.health = 2400;
        if(val == 1) this.health = 3120;
        if(val == 2) this.health = 3750;
        this.maxHealth = this.health;
    },

    processPartialUpgrade(targetTier, reqObj){
        let core = this.team.core();
        if(core == null) {
            Vars.ui.showInfo(isEn() ? "[red]Team Core Not Found![]" : "[red]Không tìm thấy Lõi Đội![]");
            return false;
        }

        let reqT = reqObj.titanium || 0;
        let reqS = reqObj.silicon || 0;
        let reqP = reqObj.plastanium || 0;

        let remT = reqT - this.paidTitanium;
        let remS = reqS - this.paidSilicon;
        let remP = reqP - this.paidPlastanium;

        let inv = core.items;
        let curT = inv.get(Items.titanium);
        let curS = inv.get(Items.silicon);
        let curP = inv.get(Items.plastanium);

        let tColor = curT >= remT ? "[green]" : "[red]";
        let sColor = curS >= remS ? "[green]" : "[red]";
        let pColor = curP >= remP ? "[green]" : "[red]";

        let scanMsg = "";
        if(isEn()){
            scanMsg = "[yellow]SINGLE SCAN - CORE ITEMS VS REQUIRED:[]\n";
            if(reqT > 0) scanMsg += " • Titanium: " + tColor + curT + "[] / " + remT + "\n";
            if(reqS > 0) scanMsg += " • Silicon: " + sColor + curS + "[] / " + remS + "\n";
            if(reqP > 0) scanMsg += " • Plastanium: " + pColor + curP + "[] / " + remP + "\n";
        } else {
            scanMsg = "[yellow]KẾT QUẢ QUÉT LÕI - TÀI NGUYÊN / YÊU CẦU:[]\n";
            if(reqT > 0) scanMsg += " • Titan: " + tColor + curT + "[] / " + remT + "\n";
            if(reqS > 0) scanMsg += " • Silicon: " + sColor + curS + "[] / " + remS + "\n";
            if(reqP > 0) scanMsg += " • Nhựa Plastanium: " + pColor + curP + "[] / " + remP + "\n";
        }

        let takeT = Math.min(curT, Math.max(0, remT));
        let takeS = Math.min(curS, Math.max(0, remS));
        let takeP = Math.min(curP, Math.max(0, remP));

        if(takeT > 0) { core.items.remove(Items.titanium, takeT); this.paidTitanium += takeT; }
        if(takeS > 0) { core.items.remove(Items.silicon, takeS); this.paidSilicon += takeS; }
        if(takeP > 0) { core.items.remove(Items.plastanium, takeP); this.paidPlastanium += takeP; }

        if(this.paidTitanium >= reqT && this.paidSilicon >= reqS && this.paidPlastanium >= reqP){
            if(targetTier == 1) Fx.upgradeCore.at(this.x, this.y);
            else Fx.bigShockwave.at(this.x, this.y);
            Fx.mineHuge.at(this.x, this.y);
            Effect.shake(5, 5, this.x, this.y);
            
            if(Vars.net.active()){
                Call.tileConfig(Vars.player, this, java.lang.Integer(targetTier));
            } else {
                this.configure(java.lang.Integer(targetTier));
            }
            return true;
        } else {
            Vars.ui.showInfo(scanMsg + (isEn() ? "\n[red]Not enough resources in Core![]" : "\n[red]Thiếu tài nguyên trong Lõi![]"));
            return false;
        }
    },

    range(){
        let tier = this.getTier();
        if(tier == 2) return 294; 
        if(tier == 1) return 544;
        return 420;
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, isEn() ? "Xylaon Upgrade Center" : "Trung tâm nâng cấp pháo Xylaon", {});

                let reqCell = dialog.cont.label(packProv(() => {
                    let needMK2_T = Math.max(0, reqMK2.titanium - this.paidTitanium);
                    let needMK2_S = Math.max(0, reqMK2.silicon - this.paidSilicon);
                    
                    let needMK2B_T = Math.max(0, reqMK2B.titanium - this.paidTitanium);
                    let needMK2B_S = Math.max(0, reqMK2B.silicon - this.paidSilicon);
                    let needMK2B_P = Math.max(0, reqMK2B.plastanium - this.paidPlastanium);

                    if(isEn()){
                        return "[yellow]RESOURCE REQUIREMENTS FOR UPGRADE:[]\n" +
                               "[cyan]MK2 Branch:[]\n" +
                               " • Titanium: [green]" + needMK2_T + "[]\n" +
                               " • Silicon: [green]" + needMK2_S + "[]\n" +
                               "[purple]MK2B Branch:[]\n" +
                               " • Titanium: [green]" + needMK2B_T + "[]\n" +
                               " • Silicon: [green]" + needMK2B_S + "[]\n" +
                               " • Plastanium: [green]" + needMK2B_P + "[]";
                    }

                    return "[yellow]YÊU CẦU TÀI NGUYÊN NÂNG CẤP:[]\n" +
                           "[cyan]Nhánh MK2:[]\n" +
                           " • Titan: [green]" + needMK2_T + "[]\n" +
                           " • Silicon: [green]" + needMK2_S + "[]\n" +
                           "[purple]Nhánh MK2B:[]\n" +
                           " • Titan: [green]" + needMK2B_T + "[]\n" +
                           " • Silicon: [green]" + needMK2B_S + "[]\n" +
                           " • Nhựa Plastanium: [green]" + needMK2B_P + "[]";
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add(isEn() ?
                                 "[white]• Health: [green]+30%[] ([green]3,120[] HP)\n" +
                                 "• Range: [green]+29.5%[] ([orange]544[] px)\n" +
                                 "• Base Damage: [green]+30%[] ([yellow]26[] DMG/bullet)\n\n" +
                                 "[gray]Special Ability: Accelerated Semiconductor Cooling — Attack speed increases up to [green]+450%[] based on heat buildup, while reducing cooldown lock time down to [orange]3.0s[].[]" :
                                 "[white]• Máu cấu trúc: [green]+30%[] ([green]3,120[] HP)\n" +
                                 "• Tầm bắn: [green]+29.5%[] ([orange]544[] px)\n" +
                                 "• Sát thương gốc: [green]+30%[] ([yellow]26[] DMG/viên)\n\n" +
                                 "[gray]Kỹ năng đặc biệt: Tản Nhiệt Bán Dẫn Gia Tốc — Tốc độ xả đạn gia tăng tối đa [green]+450%[] theo nhiệt tích lũy, đồng thời giảm thời gian khóa xả nhiệt xuống chỉ còn [orange]3.0[] giây.[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button(isEn() ? "[green]UPGRADE MK2[]" : "[green]NÂNG CẤP MK2[]", packRun(() => {
                    let done = this.processPartialUpgrade(1, reqMK2);
                    if(done){ dialog.hide(); this.deselect(); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add(isEn() ?
                                 "[white]• Health: [green]+56.25%[] ([green]3,750[] HP)\n" +
                                 "• Range: [red]-30%[] ([orange]294[] px)\n" +
                                 "• Base Damage: [red]-35%[] ([yellow]13[] DMG/bullet)\n\n" +
                                 "[gray]Special Ability: Cyclic Super-Impulse Burst — Accelerated fire rate hits an explosive [green]+999%[], automatically triggering ultra-fast [orange]1.5s[] cooling to maintain relentless close-range firepower.[]" :
                                 "[white]• Máu cấu trúc: [green]+56.25%[] ([green]3,750[] HP)\n" +
                                 "• Tầm bắn: [red]-30%[] ([orange]294[] px)\n" +
                                 "• Sát thương gốc: [red]-35%[] ([yellow]13[] DMG/viên)\n\n" +
                                 "[gray]Kỹ năng đặc biệt: Siêu Xung Bùng Nổ Chu Kỳ Tốc Độ — Tốc độ bắn gia tốc chạm mốc bùng nổ [green]+999%[], tự động kích hoạt xả nhiệt cực nhanh chỉ trong [orange]1.5[] giây để duy trì mật độ hỏa lực tầm gần liên tục.[]");
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
            })).size(50, 40).tooltip(isEn() ? "Upgrade Xylaon turret" : "Nâng cấp tháp pháo Xylaon");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo(isEn() ? "[red]XYLAON HAS REACHED MAX EVOLUTION LEVEL![]" : "[red]HỆ THỐNG XYLAON ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip(isEn() ? "Max level reached" : "Đã đạt cấp tối đa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = isEn() ? "Xylaon Turret Stats: " : "Thông số pháo Xylaon: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = isEn() ? 
                          "[yellow]⚡ BASE STATS (MK1) ⚡[]\n" +
                          "[white]Turret HP: [green]2,400[]\n" +
                          "Range: [orange]420[] px\n" +
                          "Base Damage (Graphite): [yellow]20[] DMG/bullet\n" +
                          "Base Damage (Copper): [yellow]12[] DMG/bullet[]\n\n" +
                          "[gray]Special Ability: Thermal Circuit System — Each shot builds [orange]1%[] heat ([yellow]540[] max). Overheat forces a [orange]4.0s[] cooling shutdown. Sustained firing for [orange]3.0s[] grants up to [green]+350%[] attack speed.[]" :
                          "[yellow]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]2,400[]\n" +
                          "Tầm bắn: [orange]420[] px\n" +
                          "Sát thương gốc (Graphite): [yellow]20[] DMG/viên\n" +
                          "Sát thương gốc (Chì/Đồng): [yellow]12[] DMG/viên[]\n\n" +
                          "[gray]Kỹ năng đặc biệt: Hệ Thống Nhiệt Mạch — Mỗi phát bắn tích lũy [orange]1%[] nhiệt lượng ([yellow]540[] điểm). Quá nhiệt sẽ khóa pháo [orange]4.0[] giây để làm mát. Duy trì bắn liên tục trong [orange]3.0[] giây gia tăng tối đa [green]+350%[] tốc độ bắn.[]";
            } 
            else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = isEn() ? 
                          "[cyan]⚡ UPGRADE STATS (MK2) ⚡[]\n" +
                          "[white]Turret HP: [green]3,120[] ([green]+30%[])\n" +
                          "Range: [orange]544[] px ([green]+29.5%[])\n" +
                          "Base Damage: [yellow]26[] DMG/bullet ([green]+30%[])[]\n\n" +
                          "[gray]Special Ability: Enhanced Semiconductor Cooling — Max heat reduced to [yellow]480[] points. Cooling system lock duration reduced to [orange]3.0s[]. Peak attack speed increased to [green]+450%[].[]" :
                          "[cyan]⚡ THÔNG SỐ NÂNG CẤP (MK2) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]3,120[] ([green]+30%[])\n" +
                          "Tầm bắn: [orange]544[] px ([green]+29.5%[])\n" +
                          "Sát thương gốc: [yellow]26[] DMG/viên ([green]+30%[])[]\n\n" +
                          "[gray]Kỹ năng đặc biệt: Tản Nhiệt Tăng Cường — Giới hạn chịu nhiệt giảm còn [yellow]480[] điểm. Thời gian khóa xả nhiệt rút ngắn còn [orange]3.0[] giây. Tốc độ bắn gia tốc cực đại đạt [green]+450%[].[]";
            } 
            else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = isEn() ? 
                          "[purple]⚡ SUPER-IMPULSE STATS (MK2B) ⚡[]\n" +
                          "[white]Turret HP: [green]3,750[] ([green]+56.25%[])\n" +
                          "Range: [orange]294[] px ([red]-30%[])\n" +
                          "Base Damage: [yellow]13[] DMG/bullet ([red]-35%[])[]\n\n" +
                          "[gray]Special Ability: Cyclic Super-Impulse System — Reaches an explosive [green]+999%[] fire rate. System lock duration to flush heat is reduced to an extreme [orange]1.5s[] for continuous close-range output.[]" :
                          "[purple]⚡ THÔNG SỐ SIÊU XUNG (MK2B) ⚡[]\n" +
                          "[white]Máu tháp pháo: [green]3,750[] ([green]+56.25%[])\n" +
                          "Tầm bắn: [orange]294[] px ([red]-30%[])\n" +
                          "Sát thương gốc: [yellow]13[] DMG/viên ([red]-35%[])[]\n\n" +
                          "[gray]Kỹ năng đặc biệt: Hệ Thống Siêu Xung Chu Kỳ — Tốc độ bắn gia tốc bùng nổ lên mốc [green]+999%[]. Thời gian khóa xả sạch nhiệt giảm cực hạn xuống còn [orange]1.5[] giây giúp duy trì hỏa lực tầm gần liên tục.[]";
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

    update(){
        let tier = this.getTier();

        let cooldownCap = cooldownCapTable[tier];
        if(this.thermalstate == null) this.thermalstate = -cooldownCap;
        
        if(!this.isShooting || this.thermalstate < 0.2){
            let sign = this.thermalstate > 0 ? 1 : -1;
            this.thermalstate -= Math.min(Math.abs(this.thermalstate), Time.delta) * sign;
        }
        
        this.super$update();
    },

    baseReloadSpeed(){
        if(this.thermalstate < 0) return 0;
        let tier = this.getTier();
        let maxAsCap = maxAsCapTable[tier];
        let asMultiplier = asMultiplierTable[tier];
        let bonus = Math.min(Math.max(this.thermalstate, 0) / maxAsCap, 1);
        return this.efficiency * (1 + bonus * asMultiplier);
    },

    getHeat(){ return this.thermalstate == null ? 0 : this.thermalstate; },

    shoot(type){
        let tier = this.getTier();
        let overheatCap = overheatCapTable[tier];
        let cooldownCap = cooldownCapTable[tier];

        this.thermalstate += overheatCap / 100;
        if(this.thermalstate >= overheatCap) this.thermalstate = -cooldownCap;
        
        let activeBullet = type;
        if(tier == 1) activeBullet = xylaonMK2Bullet;
        if(tier == 2) activeBullet = xylaonMK2BBullet;
        
        this.super$shoot(activeBullet);
    },

    updateReload(){
        if(this.getHeat() >= 0) this.super$updateReload();
        else this.reloadCounter = 0;
    },

    shouldTurn(){ return this.thermalstate >= 0; },
    
    write(write){ 
        this.super$write(write); 
        write.f(this.thermalstate != null ? this.thermalstate : 0); 
        write.b(this.getTier()); 
        write.i(this.paidTitanium);
        write.i(this.paidSilicon);
        write.i(this.paidPlastanium);
    },
    read(read, revision){ 
        this.super$read(read, revision); 
        this.thermalstate = read.f(); 
        this.setTier(read.b()); 
        this.paidTitanium = read.i();
        this.paidSilicon = read.i();
        this.paidPlastanium = read.i();
    }
});