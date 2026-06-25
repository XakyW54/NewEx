
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqMK2 = {
    titanium: 4000,
    silicon: 4000
};

const reqMK2B = {
    titanium: 5000,
    silicon: 4000,
    plastanium: 2000
};

const overheatCapTable = [60 * 9, 60 * 8, 60 * 8];
const cooldownCapTable = [60 * 4, 60 * 3, 60 * 1.5]; 
const maxAsCapTable = [60 * 3, 60 * 3, 60 * 3];
const asMultiplierTable = [3.5, 4.5, 9.99];          

let xylaon = extend(ItemTurret, "xylaon", {});
xylaon.health = 1600;
xylaon.size = 4;
xylaon.reload = 30;
xylaon.range = 420;
xylaon.configurable = true;
xylaon.category = Category.turret;

let xylaonBullet = extend(BasicBulletType, {});
xylaonBullet.speed = 12;
xylaonBullet.damage = 20;
xylaonBullet.lifetime = 35;
xylaonBullet.width = 4;
xylaonBullet.height = 18;
xylaonBullet.trailChance = 0.5;
xylaonBullet.trailEffect = Fx.disperseTrail;
xylaonBullet.trailColor = Color.valueOf("#66ccff");
xylaonBullet.backColor = Color.valueOf("#88ddff");
xylaonBullet.frontColor = Color.white;

let xylaonMK2Bullet = extend(BasicBulletType, {});
xylaonMK2Bullet.speed = 15.6; 
xylaonMK2Bullet.damage = 26; 
xylaonMK2Bullet.lifetime = 35; 
xylaonMK2Bullet.width = 5.2; 
xylaonMK2Bullet.height = 23.4; 
xylaonMK2Bullet.hitSize = 13;
xylaonMK2Bullet.trailChance = 0.5; 
xylaonMK2Bullet.trailEffect = Fx.disperseTrail; 
xylaonMK2Bullet.trailColor = Color.valueOf("#ffaa66");
xylaonMK2Bullet.backColor = Color.valueOf("#ffcc88"); 
xylaonMK2Bullet.frontColor = Color.white; 
xylaonMK2Bullet.despawnEffect = Fx.hitBulletColor;
xylaonMK2Bullet.knockback = 1.3; 
xylaonMK2Bullet.impact = true;

let xylaonMK2BBullet = extend(BasicBulletType, {});
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
xylaonMK2BBullet.despawnEffect = Fx.hitLancer;
xylaonMK2BBullet.despawnColor = Color.valueOf("#aa2ee8");
xylaonMK2BBullet.knockback = 0.8; 
xylaonMK2BBullet.impact = true;

xylaon.ammo(Items.graphite, xylaonBullet);

xylaon.addBar("heat", new Func({
    get: function(e){
        let tier = e.getTier();
        let cooldownCap = cooldownCapTable[tier];
        let overheatCap = overheatCapTable[tier];
        return new Bar(
            new Prov({
                get: function(){
                    let heat = e.getHeat();
                    return heat < 0 ? 
                        "COOLING: " + Math.floor(Math.abs(heat / 6)) / 10 + "s" : 
                        "HEAT: " + Math.floor(heat / 6) / 10 + "s";
                }
            }),
            new Prov({
                get: function(){ return e.getHeat() < 0 ? Pal.heal : Pal.lightOrange; }
            }),
            new Floatp({
                get: function(){
                    let heat = e.getHeat();
                    return heat < 0 ? Math.min(Math.abs(heat) / cooldownCap, 1) : Math.min(heat / overheatCap, 1);
                }
            })
        );
    }
}));

xylaon.addBar("as", new Func({
    get: function(e){
        let tier = e.getTier();
        let maxAsCap = maxAsCapTable[tier];
        let asMultiplier = asMultiplierTable[tier];
        return new Bar(
            new Prov({
                get: function(){
                    let heat = Math.max(e.getHeat(), 0);
                    let currentAsBonus = Math.min(heat / maxAsCap, 1) * asMultiplier * 100;
                    return "+" + Math.floor(currentAsBonus) + "% AS";
                }
            }),
            new Prov({
                get: function(){ return Color.cyan; }
            }),
            new Floatp({
                get: function(){ return Math.min(Math.max(e.getHeat(), 0) / maxAsCap, 1); }
            })
        );
    }
}));

xylaon.buildType = () => extend(ItemTurret.ItemTurretBuild, xylaon, {
    thermalstate: 0,
    checkTimer: 0, 
    tierState: 0, 

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        if(val == 1) this.health = 2080;
        if(val == 2) this.health = 2500;
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
                let dialog = extend(BaseDialog, "Nâng Cấp Hệ Thống Xylaon", {});
                
                let titleCell = dialog.cont.add("[gold]=== TIẾN HÓA LÕI THÁP PHÁO XYLAON ===[]");
                titleCell.row(); titleCell.padBottom(10);
                
                let labelCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core(); 
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentTitanium = core.items.get(Items.titanium); 
                    let currentSilicon = core.items.get(Items.silicon);
                    let currentPlastanium = core.items.get(Items.plastanium);
                    
                    let titColor1 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                    let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
                    
                    let titColor2 = currentTitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                    let silColor2 = currentSilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                    let plaColor2 = currentPlastanium >= reqMK2B.plastanium ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[] Titanium: " + titColor1 + reqMK2.titanium + "[]/" + currentTitanium + " | Silicon: " + silColor1 + reqMK2.silicon + "[]/" + currentSilicon + "\n" +
                           "[purple]Nhánh MK2B:[] Titanium: " + titColor2 + reqMK2B.titanium + "[]/" + currentTitanium + " | Silicon: " + silColor2 + reqMK2B.silicon + "[]/" + currentSilicon + " | Plastanium: " + plaColor2 + reqMK2B.plastanium + "[]/" + currentPlastanium;
                }));
                labelCell.row(); labelCell.padBottom(20);

                let branchesTable = new Table();
                
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12, 16, 12, 16);
                let b1T = b1.add("[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]"); b1T.row(); b1T.padBottom(6);
                let b1D = b1.add("[lightgray]Tăng tầm bắn lên 544 (+29.5%), tăng máu lên 2080 (+30%).\nTốc độ bắn tối đa khi đầy nhiệt +450% AS.\nĐạn tăng +30% sát thương (26) và +30% tốc độ bay (15.6).[]"); b1D.row(); b1D.padBottom(10);
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.setTier(1); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(200, 40);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12, 16, 12, 16); 
                let b2T = b2.add("[purple]BIẾN THỂ ĐỘT PHÁ (MK2B)[]"); b2T.row(); b2T.padBottom(6);
                let b2D = b2.add("[lightgray]Tầm bắn giảm còn 294 (-30%), bù lại Máu tăng mạnh lên 2500 (+56.2%).\nĐột phá siêu tốc bắn cực hạn đầy nhiệt +999% AS.\nGiảm 50% thời gian xả sấy, sát thương mỗi viên giảm 35% (13).[]"); b2D.row(); b2D.padBottom(10);
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                        core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.setTier(2); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(200, 40);

                branchesTable.add(b1).width(320); branchesTable.row();
                let spaceCell = branchesTable.add(); spaceCell.height(20); spaceCell.row();
                branchesTable.add(b2).width(320);
                dialog.cont.add(branchesTable);
                
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Tiến hóa tháp pháo Xylaon");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA CỦA NHÁNH ĐÃ CHỌN![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = "📊 THÔNG SỐ PHÁO XYLAON: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow]Cấu hình trạng thái gốc (MK1):[]\n\n";
                descStr = "[accent]⚙️ CƠ BẢN:[] Đạn thường: [lightgray]20 Sát thương[]\n | 1,600 HP | Tầm bắn: 420\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                          "[sky]⚡ ĐẶC TÍNH HOẠT ĐỘNG:[]\n" +
                          "• Cơ chế: Quá tải lõi gia tăng tốc độ hỏa lực tối đa [yellow]+350% AS.[]";
            } 
            else if (currentTier == 1) {
                title += "[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]";
                descStr = "[accent]⚙️ NÂNG CẤP:[] Đạn cường hóa: [lightgray]26 Sát thương (+30%)[]\n | 2,080 HP (+30%) | Tầm bắn: 544 (+29.5%)\n\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "[lime]⚡ ĐẶC TÍNH NHÁNH TIÊU CHUẨN:[]\n" +
                          "• Cơ chế: Quá tải lõi tăng tốc độ hỏa lực tối đa lên [yellow]+450% AS[] (+28.5% so với MK1).\n" +
                          "• Cải tiến: Tốc độ đạn bay nhanh hơn 30% (15.6).";
            } 
            else if (currentTier == 2) {
                title += "[purple]BIẾN THỂ ĐỘT PHÁ (MK2B)[]";
                descStr = "[accent]⚙️ NÂNG CẤP:[] Đạn siêu tốc: [lightgray]13 Sát thương (-35%)[]\n | 2,500 HP (+56.2%) | Tầm bắn: 294 (-30%)\n\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "[purple]🔥 TRẠNG THÁI CUỒNG BẠO (OVERCLOCK):[]\n" +
                          "• Tốc bắn: Bẻ khóa giới hạn động cơ xả đạn cực hạn lên đến [cyan]+999% AS[] (+185.4% so với MK1).\n" +
                          "• Hiệu ứng: Giảm 50% thời gian sấy (9s xuống 8s), gia tăng thời gian nguội thêm 50% (3s lên 4.5s) giúp duy trì nhịp bắn điên cuồng.";
            }

            let dialog = extend(BaseDialog, title, {});
            let cell = dialog.cont.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem chi tiết thông số trạng thái");
    },

    update(){
        let tier = this.getTier();
        
        this.checkTimer += Time.delta;
        if(this.checkTimer >= 15){
            this.checkTimer = 0;
            let count = 0, firstBuild = null;
            Groups.build.each(b => { 
                if(b.block == xylaon && b.team == this.team) {
                    count++; if(firstBuild == null) firstBuild = b; 
                }
            });
            if(count > 10 && this !== firstBuild){
                Call.sendMessage("[red]Giới hạn: Hệ thống chỉ được phép tồn tại tối đa 10 pháo thuộc chuỗi Xylaon trên sân!");
                this.kill(); return;     
            }
        }

        let cooldownCap = cooldownCapTable[tier];
        if(this.thermalstate == null) this.thermalstate = -cooldownCap;
        
        if(!this.isShooting() || this.thermalstate < 0.2){
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
        
        let activeBullet = xylaonBullet;
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
    },
    read(read, revision){ 
        this.super$read(read, revision); 
        this.thermalstate = read.f(); 
        this.setTier(read.b()); 
    }
});