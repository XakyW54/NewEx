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

const bulletSlashEffect = new Effect(15, e => {
    let baseAngle = e.rotation;
    let len = 16.0 * e.fout();
    let width = 6.0 * e.fout();
    let stroke = 2.5 * e.fout();

    let cx = e.x;
    let cy = e.y;

    let cosA = Mathf.cosDeg(baseAngle);
    let sinA = Mathf.sinDeg(baseAngle);

    function getX(localX, localY) { return cx + (localX * cosA - localY * sinA); }
    function getY(localX, localY) { return cy + (localX * sinA + localY * cosA); }

    let pTipX = getX(len, 0);           
    let pTipY = getY(len, 0);
    let pMidLeftX = getX(len * 0.4, width * 0.5);   
    let pMidLeftY = getY(len * 0.4, width * 0.5);
    let pMidRightX = getX(len * 0.4, -width * 0.5);  
    let pMidRightY = getY(len * 0.4, -width * 0.5);
    let pTailX = getX(-len * 0.2, 0);   
    let pTailY = getY(-len * 0.2, 0);

    Draw.color(Color.valueOf("#ffe18f"));
    Lines.stroke(stroke);
    
    Lines.line(pTailX, pTailY, pMidLeftX, pMidLeftY);
    Lines.line(pMidLeftX, pMidLeftY, pTipX, pTipY);
    Lines.line(pTipX, pTipY, pMidRightX, pMidRightY);
    Lines.line(pMidRightX, pMidRightY, pTailX, pTailY);

    if (e.fout() > 0.15) {
        Draw.color(Color.white);
        Lines.stroke(stroke * 0.4);  
        
        let cTipX = getX(len * 0.9, 0);
        let cTipY = getY(len * 0.9, 0);
        let cMidLeftX = getX(len * 0.4, width * 0.3);
        let cMidLeftY = getY(len * 0.4, width * 0.3);
        let cMidRightX = getX(len * 0.4, -width * 0.3);
        let cMidRightY = getY(len * 0.4, -width * 0.3);
        let cTailX = getX(0, 0);
        let cTailY = getY(0, 0);

        Lines.line(cTailX, cTailY, cMidLeftX, cMidLeftY);
        Lines.line(cMidLeftX, cMidLeftY, cTipX, cTipY);
        Lines.line(cTipX, cTipY, cMidRightX, cMidRightY);
        Lines.line(cMidRightX, cMidRightY, cTailX, cTailY);
    }
    Draw.reset();
});

 const vendicumBullet = extend(BasicBulletType, {
    speed: 8, damage: 45, lifetime: 48, width: 11, height: 16, 
    frontColor: Color.white, backColor: Color.valueOf("#e0b080"),
    textType: "vendicumBullet",
    pierce: true, pierceCap: 3, pierceBuilding: true, knockback: 1, impact: true,
    
    hitEffect: Fx.disperseTrail,
    despawnEffect: Fx.disperseTrail,
    trailEffect: Fx.disperseTrail,
    trailChance: 0.20
});

 const vendicumMK2Bullet = extend(BasicBulletType, {
    speed: 10, damage: 65, lifetime: 45, width: 13, height: 20, 
    frontColor: Color.white, backColor: Color.valueOf("#ffaa66"),
    pierce: true, pierceCap: 5, pierceBuilding: true, knockback: 1.4, impact: true,
    
    hitEffect: Fx.disperseTrail,
    despawnEffect: Fx.disperseTrail,
    trailEffect: Fx.disperseTrail,
    trailChance: 0.40
});

 const vendicumMK2BBullet = extend(BasicBulletType, {
    speed: 9, damage: 122.5, lifetime: 50, width: 5, height: 64, 
    frontColor: Color.white, backColor: Color.valueOf("#831006"),
    trailEffect: Fx.disperseTrail, trailChance: 0.40, 
    trailColor: Color.valueOf("#ff2525"),
    pierce: false, pierceBuilding: false, knockback: 2.8, impact: true, 
    homingPower: 0.15, homingRange: 200,
    
    hitEffect: Fx.disperseTrail,
    despawnEffect: Fx.disperseTrail
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
    customRecoil: 0.0,

    peekAmmo(){
        let tier = this.getTier();
        if(tier == 1) return vendicumMK2Bullet;
        if(tier == 2) return vendicumMK2BBullet;
        return vendicumBullet;
    },

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
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Vendicum", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
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
                           "[cyan]Nhánh MK2:[]\n" +
                           " • Titan: " + titColor1 + currentTitanium + "[] / " + reqMK2.titanium + "\n" +
                           " • Silicon: " + silColor1 + currentSilicon + "[] / " + reqMK2.silicon + "\n" +
                           "[purple]Nhánh MK2B:[]\n" +
                           " • Titan: " + titColor2 + currentTitanium + "[] / " + reqMK2B.titanium + "\n" +
                           " • Silicon: " + silColor2 + currentSilicon + "[] / " + reqMK2B.silicon + "\n" +
                           " • Nhựa: " + plaColor2 + currentPlastanium + "[] / " + reqMK2B.plastanium;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2 - XUYÊN PHÁ)===[]").row();
                let b1D = b1.add("[white]• Máu cấu trúc: [green]+50%[] (1,800 HP)\n" +
                                 "• Tầm bắn: [green]+31.25%[] (420 px)\n" +
                                 "• sát thương gốc: [green]+44.4%[] (65 DMG)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Gia Tốc Từ Tính Xuyên Thấu — Đạn mở rộng khả năng xuyên qua tối đa 5 mục tiêu kẻ địch hoặc công trình, tích hợp mạch siêu sạc giúp rút ngắn thời gian hồi đầy năng lượng xuống 3.0 giây.[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(1)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B - TRUY ĐUỔI)===[]").row();
                let b2D = b2.add("[white]• Máu cấu trúc: [green]+33.3%[] (1,600 HP)\n" +
                                 "• Tầm bắn: [green]+12.5%[] (360 px)\n" +
                                 "• sát thương gốc: [green]+172.2%[] (122.5 DMG)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Xung Kích Tầm Nhiệt Truy Đuổi — Loại bỏ xuyên thấu để tích hợp chip cảm biến thông minh tự động bẻ lái truy đuổi mục tiêu xung quanh, tiết kiệm 70% năng lượng mỗi phát bắn.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                        core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(2)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp hệ thống Vendicum");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG VENDICUM ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Vendicum: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,200[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]320 pixel[]\n" +
                          "[lightgray]sát thương gốc:[] [yellow]45.00 DMG[]\n" +
                          "[lightgray]Khả năng xuyên thấu:[] [white]3 mục tiêu[]\n\n" +
                          "[sky]⚡ CƠ CHẾ NĂNG LƯỢNG TIÊU HAO:[]\n" +
                          "• [lightgray]Tiêu hao (Energy Loss):[] Mỗi phát bắn làm tiêu trừ [red]1.0%[] năng lượng tích lũy của lõi. Sát thương đầu ra tỷ lệ thuận với lượng điện tích hiện có.\n" +
                          "• [lightgray]Tốc độ tái nạp:[] Mất khoảng [yellow]5.0 giây[] để nạp đầy lại từ thanh trống (0% -> 100%) khi ngừng khai hỏa.";
            } 
            else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,800 [lime](+50%)[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]420 pixel [lime](+31.2%)[]\n" +
                          "[lightgray]sát thương gốc:[] [yellow]65.00 DMG [lime](+44.4%)[]\n" +
                          "[lightgray]Khả năng xuyên thấu:[] [yellow]5 mục tiêu [lime](+2 mục tiêu)[]\n\n" +
                          "[lime]⚡ CƠ CHẾ NĂNG LƯỢNG TIÊU HAO:[]\n" +
                          "• [lightgray]Tối ưu tiêu hao:[] Giảm thiểu mức tiêu hao năng lượng xuống chỉ còn [red]0.5%[] cho mỗi phát bắn (Giảm -50%).\n" +
                          "• [lightgray]Siêu sạc phản lực:[] Tốc độ nạp năng lượng đẩy mạnh vượt trội, chỉ mất [green]3.0 giây[] để hồi đầy bình tích lũy.";
            } 
            else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,600 [lime](+33.3%)[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]360 pixel [lime](+12.5%)[]\n" +
                          "[lightgray]sát thương gốc:[] [red]122.50 DMG (+172.2%)[]\n" +
                          "[lightgray]Khả năng xuyên thấu:[] [red]Không (Mất khả năng xuyên)[]\n\n" +
                          "[purple]🔥 CƠ CHẾ NĂNG LƯỢNG TIÊU HAO:[]\n" +
                          "• [lightgray]Mạch định vị:[] Đổi khả năng xuyên lấy cảm biến tích hợp, đạn [pink]tự động bẻ lái tìm mục tiêu[] trong phạm vi 200 pixel.\n" +
                          "• [lightgray]Mức ổn định cao:[] Năng lượng tiêu hao mỗi phát bắn giảm cực hạn xuống còn [green]0.3%[] giúp duy trì hỏa lực cực kỳ ổn định và lâu dài.";
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

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
        this.super$updateTile();
        let tier = this.getTier();

        let currentRegen = regenSpeedMK1;
        if(tier == 1) currentRegen = regenSpeedMK2;
        if(tier == 2) currentRegen = regenSpeedMK2B;

        if(!this.isShooting || !this.hasAmmo() || !this.isActive()){ 
            if(this.energyState < 1.0){ 
                this.energyState = Math.min(this.energyState + (currentRegen * Time.delta / 60), 1.0); 
            } 
        }

        this.customRecoil = Mathf.approach(this.customRecoil, 0.0, 0.12 * Time.delta);
    },

    shoot(type){
        this.super$shoot(type); 
        let tier = this.getTier();
        let currentLoss = lossPerShotMK1;
        if(tier == 1) currentLoss = lossPerShotMK2;
        if(tier == 2) currentLoss = lossPerShotMK2B;

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