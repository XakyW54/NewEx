
const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqMK2 = { titanium: 500, silicon: 300 };
const reqMK2B = { titanium: 800, silicon: 400, plastanium: 200 }; 

const lossPerShotMK1 = 0.01; 
const regenSpeedMK1 = 0.20; 
const lossPerShotMK2 = 0.005; 
const regenSpeedMK2 = 0.34;    
const lossPerShotMK2B = 0.003; 
const regenSpeedMK2B = 0.40;   



const vendicumBullet = extend(BasicBulletType, {
    speed: 8, damage: 45, lifetime: 48, width: 11, height: 16, frontColor: Color.white, backColor: Color.valueOf("#e0b080"),
    trailEffect: Fx.disperseTrail, trailChance: 0.95, trailColor: Color.valueOf("#feb380"), hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    pierce: true, pierceCap: 3, pierceBuilding: true, knockback: 1, impact: true
});

const vendicumMK2Bullet = extend(BasicBulletType, {
    speed: 10, damage: 65, lifetime: 45, width: 13, height: 20, frontColor: Color.white, backColor: Color.valueOf("#ffaa66"),
    trailEffect: Fx.disperseTrail, trailChance: 0.98, trailColor: Color.valueOf("#ffcc88"), hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    pierce: true, pierceCap: 5, pierceBuilding: true, knockback: 1.4, impact: true
});

const vendicumMK2BBullet = extend(BasicBulletType, {
    speed: 9, damage: 22.5, lifetime: 50, width: 5, height: 64, frontColor: Color.white, backColor: Color.valueOf("#ff8a80"),
    trailEffect: Fx.disperseTrail, trailChance: 0.98, trailColor: Color.valueOf("#ff5252"), hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    pierce: false, pierceBuilding: false, knockback: 0.8, impact: true, homingPower: 0.15, homingRange: 200        
});


const vendicum = extend(ItemTurret, "vendicum", {
    configurable: true
});

vendicum.addBar("dmg_bonus", new Func({
    get: function(e){
        return new Bar(
            new Prov({ get: function(){ return "DMG: +" + Math.floor(e.getDmgRatio() * 500) + "%"; } }),
            new Prov({ get: function(){ return Color.orange; } }),
            new Floatp({ get: function(){ return e.getDmgRatio(); } })
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

vendicum.ammo(Items.silicon, vendicumBullet);

vendicum.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));


vendicum.buildType = () => extend(ItemTurret.ItemTurretBuild, vendicum, {
    energyState: 1.0,
    tierState: 0, 
    limitCheck: 0,
    
    customRecoil: 0.0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        if(val == 0) { this.health = 1200; }
        if(val == 1) { this.health = 1800; }
        if(val == 2) { this.health = 1600; }
        this.maxHealth = this.health;
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

        // --- NÚT NÂNG CẤP (PHONG CÁCH HÀNG DỌC GỌN GÀNG TRONG 1 GUI CỦA LAVUNDER) ---
        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Hệ Thống Tiến Hóa Vendicum", {});
                
                dialog.cont.add("[gold]=== TIẾN HÓA LÕI ĐA CHỨC NĂNG VENDICUM ===[]").row();
                dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Kho cốt lõi![]";
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
                })).row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // Nhánh 1: MK2 (Xuyên Phá)
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]TIẾN HÓA: VENDICUM MK2 (XUYÊN PHÁ)[]").row();
                let b1D = b1.add("Cải tiến kết cấu rãnh nòng gia tốc từ tính:\n" +
                                 " [white]• Tăng sát thương đạn lên [green]65 đơn vị[] và mở rộng tầm bắn đạt [green]420 pixel[].[]\n" +
                                 " [white]• Đạn bắn xuyên qua tối đa [yellow]5 mục tiêu[] kẻ địch hoặc công trình.[]\n" +
                                 " [white]• Giảm mức hao hụt năng lượng, tối ưu hóa hồi phục buff chỉ mất [pink]3 giây[].[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(1)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Nâng cấp thất bại! Tài nguyên chưa đủ.[]"); }
                })).size(180, 38);

                // Nhánh 2: MK2B (Truy Đuổi)
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]TIẾN HÓA: VENDICUM MK2B (TRUY ĐUỔI)[]").row();
                let b2D = b2.add("Chuyển đổi sang lõi năng lượng xung kích tầm nhiệt:\n" +
                                 " [white]• Thay đổi cấu trúc đạn thuôn dài, tích hợp cảm biến [orange]tự động bẻ lái truy đuổi[].[]\n" +
                                 " [white]• Loại bỏ cơ chế xuyên thấu, sát thương cơ bản giảm còn [red]22.5[] nhưng tầm bắn đạt [green]360[].[]\n" +
                                 " [white]• Giảm thiểu tiêu hao, tăng mạnh tần suất bắn trúng và hồi buff tối ưu.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                        core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(2)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Nâng cấp thất bại! Tài nguyên chưa đủ.[]"); }
                })).size(180, 38);

                // Sắp xếp bố cục dọc chuẩn Lavunder trong cùng một GUI duy nhất
                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

let scroll = new ScrollPane(branchesTable);
scroll.setScrollingDisabled(true, false);
dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Mở bảng tiến hóa hệ thống");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG VENDICUM ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA CỦA NHÁNH![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // --- NÚT THÔNG TIN (PHONG CÁCH BỐ CỰC ĐẶC TRƯNG CỦA DOR) ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = "📊 THÔNG SỐ PHÁO VENDICUM: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow]Trạng thái gốc (MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]1,200[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]3x3[]\n" +
                          "[aim] Tầm bắn hiệu dụng:[] [orange]320 pixel[]\n" +
                          "[zap] Sát thương đạn thô:[] [yellow]45.00[] (Xuyên: [lightgray]3 mục tiêu[])\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                          "[sky]⚡ CƠ CHẾ NĂNG LƯỢNG TIÊU HAO:[]\n" +
                          "• Hiệu ứng: Mỗi phát bắn tiêu trừ 1.0% mức tích lũy năng lượng lõi. Sát thương của đạn phụ thuộc hoàn toàn vào thanh năng lượng hiện tại.\n" +
                          "• Hồi phục: Tốc độ nạp lại cơ bản mất khoảng 5 giây để nạp đầy từ 0% lên 100% khi ngừng bắn.";
            } 
            else if (currentTier == 1) {
                title += "[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]1,800[] [yellow](+50%)[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]3x3[]\n" +
                          "[aim] Tầm bắn hiệu dụng:[] [orange]420 pixel[] [yellow](+31.2%)[]\n" +
                          "[zap] Sát thương đạn nâng cấp:[] [yellow]65.00[] (Xuyên: [lightgray]5 mục tiêu[])\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                          "[lime]⚡ CƠ CHẾ NĂNG LƯỢNG TIÊU HAO:[]\n" +
                          "• Hiệu ứng: Mức tiêu hao năng lượng giảm một nửa (chỉ còn 0.5% mỗi phát bắn).\n" +
                          "• Hồi phục: Tốc độ tái nạp năng lượng lõi đẩy mạnh siêu tốc, chỉ mất 3 giây để đầy thanh chứa, giúp duy trì chuỗi sát thương đại pháo tối đa lâu hơn.";
            } 
            else if (currentTier == 2) {
                title += "[purple]BIẾN THỂ ĐẠN ĐUỔI (MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[heart] [lightgray]Máu tháp pháo:[] [green]1,600[] [yellow](+33.3%)[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]3x3[]\n" +
                          "[aim] Tầm bắn hiệu dụng:[] [orange]360 pixel[] [yellow](+12.5%)[]\n" +
                          "[zap] Sát thương đạn thuôn dài:[] [yellow]22.50[] [coral](-50%)[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                          "[purple]🔥 CƠ CHẾ NĂNG LƯỢNG TIÊU HAO:[]\n" +
                          "• Hiệu ứng: Đạn mất hoàn toàn khả năng xuyên thấu, đổi lấy bộ định vị tự động bẻ góc bám đuổi kẻ địch xung quanh.\n" +
                          "• Ổn định: Năng lượng tiêu hao mỗi phát bắn giảm xuống mức thấp nhất (0.3%), giúp vũ khí liên tục duy trì trạng thái hỏa lực ổn định.";
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
        })).size(50, 40).tooltip("Xem chi tiết thông số trạng thái");
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
        this.limitCheck += Time.delta;
        if(this.limitCheck >= 15){
            this.limitCheck = 0; let count = 0; let firstBuild = null;
            Groups.build.each(b => { if(b.block == vendicum && b.team == this.team) { count++; if(firstBuild == null) firstBuild = b; } });
            if(count > 10 && this !== firstBuild){ Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 10 pháo Vendicum!"); this.kill(); return; }
        }

        this.super$updateTile();
        let tier = this.getTier();

        let currentRegen = regenSpeedMK1;
        if(tier == 1) currentRegen = regenSpeedMK2;
        if(tier == 2) currentRegen = regenSpeedMK2B;

        if(!this.isShooting() || !this.hasAmmo() || !this.isActive()){ 
            if(this.energyState < 1.0){ 
                this.energyState = Math.min(this.energyState + (currentRegen * Time.delta / 60), 1.0); 
            } 
        }

        this.customRecoil = Mathf.approach(this.customRecoil, 0.0, 0.12 * Time.delta);
    },

    shoot(type){
        let tier = this.getTier();
        let bulletToShoot = vendicumBullet;
        let currentLoss = lossPerShotMK1;

        if(tier == 1) {
            bulletToShoot = vendicumMK2Bullet;
            currentLoss = lossPerShotMK2;
        } else if(tier == 2) {
            bulletToShoot = vendicumMK2BBullet;
            currentLoss = lossPerShotMK2B;
        }

        this.super$shoot(bulletToShoot); 
        this.energyState = Math.max(this.energyState - currentLoss, 0.0); 
        
 
        this.customRecoil = 1.0;
    },

    handleBullet(bullet, x, y, angle){ 
        if(bullet != null) bullet.damage = bullet.type.damage * (1 + this.energyState * 5); 
        this.super$handleBullet(bullet, x, y, angle); 
    },

    baseReloadSpeed(){ return this.efficiency * (1 + this.energyState * 2.5); },
    getDmgRatio(){ return this.energyState; }, 
    getAsRatio(){ return this.energyState; },


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


        let invEnergy = 1.0 - this.energyState; 
        let sideMoveDistance = invEnergy * 4.0; 



        let barrel1Region = Core.atlas.find(modName + "-vendicum-barrel1");
        if(barrel1Region.found()){
            let b1x = this.x - (sideMoveDistance * sin);
            let b1y = this.y + (sideMoveDistance * cos);
            Draw.rect(barrel1Region, b1x, b1y, this.rotation);
        }

        let barrel2Region = Core.atlas.find(modName + "-vendicum-barrel2");
        if(barrel2Region.found()){
            let b2x = this.x + (sideMoveDistance * sin);
            let b2y = this.y - (sideMoveDistance * cos);
            Draw.rect(barrel2Region, b2x, b2y, this.rotation);
        }



        let b1Offset = this.customRecoil * maxBarrelRecoilDistance;
        let b1Region = Core.atlas.find(modName + "-vendicum-b1");
        if (b1Region.found()) {
            let b1ax = this.x + b1Offset * cos;
            let b1ay = this.y + b1Offset * sin;
            Draw.rect(b1Region, b1ax, b1ay, this.rotation);
        }
    },

    write(write){ 
        this.super$write(write); 
        write.b(this.getTier()); 
        write.f(this.energyState != null ? this.energyState : 1.0); 
    },
    read(read, revision){ 
        this.super$read(read, revision); 
        this.setTier(read.b()); 
        if(revision >= 1) this.energyState = read.f(); 
        this.customRecoil = 0.0;
    }
});