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

 xylaon.itemCapacity = 30;     
xylaon.ammoPerShot = 1;        
xylaon.shots = 5;              
xylaon.inaccuracy = 4.5;       

 const applyBulletUpgrades = (bullet) => {
    bullet.pierce = true;             
    bullet.pierceCap = 3;             
    bullet.homingPower = 0.04;        
    bullet.homingRange = 120;        
};

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
applyBulletUpgrades(xylaonBullet);

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
applyBulletUpgrades(xylaonMK2Bullet);

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
applyBulletUpgrades(xylaonMK2BBullet);

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

        // --- NÚT NÂNG CẤP (PHONG CÁCH HÀNG DỌC GỌN GÀNG TRONG 1 GUI CỦA LAVUNDER) ---
        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trạm Nâng Cấp Hệ Thống Xylaon", {});
                
                dialog.cont.add("[gold]=== TIẾN HÓA LÕI NHIỆT MẠCH XYLAON ===[]").row();
                dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currenttitanium = core.items.get(Items.titanium);
                    let currentsilicon = core.items.get(Items.silicon);
                    let currentplastanium = core.items.get(Items.plastanium);
                    
                    let titColor1 = currenttitanium >= reqMK2.titanium ? "[green]" : "[red]";
                    let silColor1 = currentsilicon >= reqMK2.silicon ? "[green]" : "[red]";
                    
                    let titColor2 = currenttitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                    let silColor2 = currentsilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                    let plaColor2 = currentplastanium >= reqMK2B.plastanium ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[] Titanium: " + titColor1 + reqMK2.titanium + "[]/" + currenttitanium + " | Silicon: " + silColor1 + reqMK2.silicon + "[]/" + currentsilicon + "\n" +
                           "[purple]Nhánh MK2B:[] Titanium: " + titColor2 + reqMK2B.titanium + "[]/" + currenttitanium + " | Silicon: " + silColor2 + reqMK2B.silicon + "[]/" + currentsilicon + "\n | Plastanium: " + plaColor2 + reqMK2B.plastanium + "[]/" + currentplastanium;
                })).row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // Nhánh 1: MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]CẤU HÌNH TĂNG TỐC QUÁ NHIỆT (MK2)[]").row();
                let b1D = b1.add("Mô-đun tối ưu hóa hệ thống sả nhiệt bán dẫn:\n" +
                                 " [white]• Rút ngắn thời gian đóng băng Cooldown xuống [green]3.0 giây[].[]\n" +
                                 " [white]• Tốc độ xả đạn gia tăng tối đa [yellow]+450%[] dựa theo nhiệt tích lũy.[]\n" +
                                 " [white]• Nâng cấp lõi đạn năng lượng tăng cường vận tốc hỏa lực.[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.setTier(1); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                // Nhánh 2: MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]BIẾN THỂ SIÊU XUNG ĐA LUỒNG (MK2B)[]").row();
                let b2D = b2.add("Cấu hình mạch xung kích bùng nổ chu kỳ ngắn:\n" +
                                 " [white]• Thời gian đóng băng tự động giảm siêu tốc xuống chỉ còn [green]1.5 giây[].[]\n" +
                                 " [white]• Tốc độ xả đạn tăng trưởng chạm mốc điên rồ [red]+999%[].[]\n" +
                                 " [white]• Lõi phóng tích nhiệt thứ cấp tạo luồng xung kích áp chế dồn dập kẻ địch.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                        core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.setTier(2); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                // Xếp các bảng nhánh theo hàng dọc chuẩn Lavunder
                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

let scroll = new ScrollPane(branchesTable);
scroll.setScrollingDisabled(true, false);
dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp tháp pháo Xylaon");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG XYLAON ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // --- NÚT THÔNG TIN (PHONG CÁCH BỐ CỰC ĐẶC TRƯNG CỦA DOR) ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = "📊 THÔNG SỐ PHÁO XYLAON: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow]Cấu hình gốc (MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]1,600[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]4x4[]\n" +
                          "[aim] Tầm bắn hiệu dụng:[] [orange]420 pixel[]\n" +
                          "[lightning] Tốc độ bắn cơ bản:[] [white]30.00 hỏa lực[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[sky]⚡ CƠ CHẾ HOẠT ĐỘNG NHIỆT MẠCH:[]\n" +
                          "• Quá nhiệt (Overheat): Mỗi phát bắn tích lũy 10% lượng nhiệt. Khi đạt ngưỡng [red]540 điểm[] nhiệt, tháp pháo sẽ rơi vào trạng thái quá tải an toàn.\n" +
                          "• Đóng băng hệ thống: Khi quá tải, pháo ngừng quay và không thể bắn trong [yellow]4.0 giây[] để xả hoàn toàn thanh nhiệt.\n" +
                          "• Cơ chế gia tốc: Nhiệt lượng càng cao, tốc độ hồi nạp đạn bắn càng nhanh (Tối đa [cyan]+350%[] tốc độ bắn).";
            } 
            else if (currentTier == 1) {
                title += "[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]2,080[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]4x4[]\n" +
                          "[aim] Tầm bắn hiệu dụng:[] [orange]544 pixel[]\n" +
                          "[lightning] Tốc độ bắn gia tốc:[] [yellow]Tối đa +450%[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[lime]⚡ CƠ CHẾ HOẠT ĐỘNG NHIỆT MẠCH:[]\n" +
                          "• Quá nhiệt nâng cao: Giới hạn chịu nhiệt tối đa đạt [red]480 điểm[].\n" +
                          "• Rút ngắn xả tải: Thời gian khóa hệ thống để làm mát đóng băng giảm mạnh xuống còn [yellow]3.0 giây[].\n" +
                          "• Hỏa lực tăng cường: Sử dụng biến thể đạn MK2 tăng tiến vận tốc mạnh mẽ.";
            } 
            else if (currentTier == 2) {
                title += "[purple]BIẾN THỂ SIÊU XUNG (MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]2,500[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]4x4[]\n" +
                          "[aim] Tầm bắn hiệu dụng:[] [orange]294 pixel[]\n" +
                          "[lightning] Tốc độ bắn bùng nổ:[] [pink]Tối đa +999%[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[purple]🔥 CƠ CHẾ HOẠT ĐỘNG NHIỆT MẠCH:[]\n" +
                          "• Chu kỳ siêu ngắn: Chịu nhiệt giới hạn [red]480 điểm[] nhưng bùng nổ tốc độ nạp đạn điên rồ lên tới [red]9.99 lần[] tốc độ gốc.\n" +
                          "• Siêu làm mát phản lực: Thời gian đóng băng hệ thống để xả sập sàn toàn bộ nhiệt lượng giảm cực hạn chỉ còn [green]1.5 giây swipes[].";
            }

            let dialog = extend(BaseDialog, title, {});
let infoTable = new Table();
let cell = infoTable.add(descStr).width(360);
cell.get().setWrap(true); cell.get().setAlignment(Align.left);
let scroll = new ScrollPane(infoTable);
scroll.setScrollingDisabled(true, false);
dialog.cont.add(scroll).maxHeight(400);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem thông số chi tiết hệ thống");
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