
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

        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trang Tiến Hóa Tháp Pháo", {});
                let titleText = Vars.mobile ? "[gold]=== TIẾN HÓA THÁP PHÁO ===[]" : "[gold]=== CHỌN NHÁNH TIẾN HÓA CHO THÁP PHÁO VENDICUM ===[]";
                dialog.cont.add(titleText).padBottom(15).row();
                
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
                })).padBottom(15).row();

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(10);
                b1.add("[cyan]TIẾN HÓA: VENDICUM MK2 (XUYÊN PHÁ)[]").pad(5).row();
                b1.add("[gray]- Tăng sát thương gốc đạn lên 65, tăng tầm bắn và khả năng xuyên thấu (5 mục tiêu)\n- Giảm hao hụt năng lượng súng, hồi phục buff siêu tốc chỉ 3 giây[]").left().pad(5).row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(1)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Nâng cấp thất bại! Tài nguyên chưa đủ.[]"); }
                })).size(180, 40).pad(5);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(10);
                b2.add("[purple]TIẾN HÓA: VENDICUM MK2B (TRUY ĐUỔI)[]").pad(5).row();
                b2.add("[gray]- Chuyển đổi hoàn toàn sang hệ thống Đạn Truy Đuổi mục tiêu tự động\n- Loại bỏ cơ chế xuyên thấu. Hình dáng đạn thuôn mảnh và dài gấp 4 lần\n- Sát thương thô giảm 50% nhưng bù lại tần suất bắn trúng và hồi buff tối ưu cực cao[]").left().pad(5).row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                        core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(2)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Nâng cấp thất bại! Tài nguyên chưa đủ.[]"); }
                })).size(180, 40).pad(5);

                branchesTable.add(b1).width(Vars.mobile ? 280 : 360).padBottom(10).row();
                branchesTable.add(b2).width(Vars.mobile ? 280 : 360);
                dialog.cont.add(branchesTable);
                
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Mở bảng tiến hóa hệ thống");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA CỦA NHÁNH ĐÃ CHỌN![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = "📊 THÔNG SỐ PHÁO VENDICUM: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow]Cấu hình trạng thái gốc (MK1)[]";
                descStr = "[accent]⚙️ CƠ BẢN:[] Sát thương gốc: [lightgray]45[] | Xuyên thấu: [lightgray]3 mục tiêu[]\n\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "[sky]⚡ ĐẶC TÍNH HOẠT ĐỘNG:[]\n" +
                          "• Mỗi phát bắn mất [coral]1%[] năng lượng. Tốc độ hồi phục cơ bản [yellow](Mất khoảng 5 giây để hồi đầy từ 0%)[].";
            } 
            else if (currentTier == 1) {
                title += "[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]";
                descStr = "[accent]⚙️ NÂNG CẤP:[] Sát thương cường hóa: [lightgray]65[] | Khả năng xuyên thấu tăng mạnh: [lightgray]5 mục tiêu[]\n\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "[lime]⚡ ĐẶC TÍNH NHÁNH TIÊU CHUẨN:[]\n" +
                          "• Giảm một nửa lượng hao hụt mỗi phát bắn [yellow](chỉ còn 0.5%)[], đồng thời tốc độ hồi phục buff được tăng tốc siêu phàm (chỉ mất khoảng 3 giây để nạp đầy lại năng lượng). Nhánh này giúp tháp pháo duy trì sát thương cao lâu hơn.\n" ;
        
            } 
            else if (currentTier == 2) {
                title += "[purple]BIẾN THỂ ĐẠN ĐUỔI (MK2B)[]";
                descStr = "[accent]⚙️ NÂNG CẤP:[] Sát thương thô: [lightgray]22.5 (-50%)[] | Xuyên thấu: [red]Không[]\n\n" +
                          "[scarlet]⚠ GIỚI HẠN: Tối đa 10 cấu trúc/Đội trên sân[]\n\n" +
                "[purple]🔥 ĐẶC TÍNH PHÂN NHÁNH TRUY ĐUỔI:[]\n" +
                      
                          "• Đạn sở hữu bộ tìm đường, tự động bẻ lái truy đuổi mục tiêu xung quanh với độ chính xác tuyệt đối.";
            }

            let dialog = extend(BaseDialog, title, {});
            let cell = dialog.cont.add(descStr).width(360);
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
        
        // Kích hoạt phản lực giật lùi khi bắn
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

        // 1. Vẽ khối nền Base
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