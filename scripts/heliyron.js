const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// Yêu cầu tài nguyên nâng cấp từ MK1
const reqMK2 = { copper: 8000, lead: 4000, titanium: 0 };
const reqMK2B = { copper: 8000, lead: 4000, titanium: 2000 };

// --- EFFECT HẠT BAY TRƯỚC VÀ SAU VIÊN ĐẠN ---
const heliyronParticleEffect = new Effect(18, e => {
    Draw.color(e.color);
    
    // 4 góc cần phun (0°, 90°, 180°, 270° so với hướng đạn - hoặc bạn có thể chỉnh thành 45, 135, 225, 315)
    let angles = [0, 90, 180, 270];
    
    for (let i = 0; i < angles.length; i++) {
 
        Angles.randLenVectors(e.id + i * 10, 3, 8 + e.fin() * 12, e.rotation + angles[i], 25, (x, y) => {
 
            Fill.circle(e.x + x, e.y + y, 1.5 * e.fout());
        });
    }
});

// --- BULLET TYPES ---
// 1. Đạn cho MK1
const heliyronMK1Bullet = extend(BasicBulletType, {
    speed: 17, damage: 150, width: 7, height: 38, lifetime: 33,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#d47c00"),
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    
    trailEffect: heliyronParticleEffect,
    trailInterval: 2,

    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        if(b.owner != null && b.owner.damageSelfPercent != undefined){
            b.owner.damageSelfPercent(1);
        }
    }
});

// 2. Đạn cho MK2
const heliyronMK2Bullet = extend(BasicBulletType, {
    speed: 17, damage: 150, width: 7, height: 38, lifetime: 33,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#d47c00"),
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    
    trailEffect: heliyronParticleEffect,
    trailInterval: 2,

    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        if(b.owner != null && b.owner.damageSelfPercent != undefined){
            b.owner.damageSelfPercent(1);
        }
    }
});

// 3. Đạn cho MK2B
const heliyronMK2BBullet = extend(BasicBulletType, {
    speed: 17, damage: 150, width: 7, height: 38, lifetime: 33,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#d47c00"),
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    
    homingPower: 0.12, homingRange: 160,

    trailEffect: heliyronParticleEffect,
    trailInterval: 2,

    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        if(b.owner != null && b.owner.damageSelfPercent != undefined){
            b.owner.damageSelfPercent(1);
        }
    }
});

// --- BLOCK CONFIG ---
let heliyron = extend(ItemTurret, "heliyron", {
    squareSprite: false
});

heliyron.health = 1450; // HP cơ bản cấp MK1
heliyron.size = 3;
heliyron.reload = 35; 
heliyron.configurable = true;
heliyron.category = Category.turret;

heliyron.ammo(Items.copper, heliyronMK1Bullet, Items.lead, heliyronMK1Bullet);

heliyron.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

// --- BUILD TYPE ---
heliyron.buildType = () => extend(ItemTurret.ItemTurretBuild, heliyron, {
    tierState: 0, // 0: MK1 | 1: MK2 | 2: MK2B
    limitCheck: 0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        if(val == 0) this.health = 1450; // MK1
        if(val == 1) this.health = 2175; // MK2 (+50% HP)
        if(val == 2) this.health = 2610; // MK2B
        this.maxHealth = this.health;
    },

    // Trừ 1% HP tối đa khi hit kẻ địch (Dừng khi HP <= 1%)
    damageSelfPercent(percent){
        let minHealthLimit = this.maxHealth * 0.01;
        if(this.health > minHealthLimit){
            let damageAmount = this.maxHealth * (percent / 100);
            this.health -= damageAmount;
            if(this.health < minHealthLimit){
                this.health = minHealthLimit;
            }
        }
    },

    // Tỉ lệ sát thương nhân thêm theo máu thiếu
    getDamageMultiplier(){
        let missingHpPercent = Math.max(0, (1 - (this.health / this.maxHealth)) * 100);
        let steps = Math.floor(missingHpPercent / 10);
        
        let tier = this.getTier();
        if(tier == 1){
            // MK2: Cứ 10% máu tụt -> tăng 50% dmg gốc
            return 1 + (steps * 0.50);
        } else {
            // MK1 & MK2B: Cứ 10% máu tụt -> tăng 20% dmg gốc
            return 1 + (steps * 0.20);
        }
    },

    range(){
        let tier = this.getTier();
        if(tier == 2) return 560; // MK2B
        if(tier == 1) return 570; // MK2
        return 550;               // MK1
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
            // Menu lựa chọn từ MK1 -> MK2 hoặc MK2B
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm Nâng cấp Heliyron", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentcopper = core.items.get(Items.copper);
                    let currentlead = core.items.get(Items.lead);
                    let currenttitanium = core.items.get(Items.titanium);
                    
                    let copColor1 = currentcopper >= reqMK2.copper ? "[green]" : "[red]";
                    let leaColor1 = currentlead >= reqMK2.lead ? "[green]" : "[red]";
                    
                    let copColor2 = currentcopper >= reqMK2B.copper ? "[green]" : "[red]";
                    let leaColor2 = currentlead >= reqMK2B.lead ? "[green]" : "[red]";
                    let titColor2 = currenttitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN NÂNG CẤP:[]\n" +
                           "[cyan]Nhánh MK2:[] " + copColor1 + "Đồng " + currentcopper + "/" + reqMK2.copper + "[] | " + leaColor1 + "Chì " + currentlead + "/" + reqMK2.lead + "[]\n" +
                           "[purple]Nhánh MK2B:[] " + copColor2 + "Đồng " + currentcopper + "/" + reqMK2B.copper + "[] | " + leaColor2 + "Chì " + currentlead + "/" + reqMK2B.lead + "[] | " + titColor2 + "Titan " + currenttitanium + "/" + reqMK2B.titanium + "[]";
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // NÚT CHỌN MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(CẤU HÌNH MK2)===[]").row();
                let b1D = b1.add(" [white]• Tăng [green]+50% Máu[] (2,175 HP).\n" +
                                 " [white]• Tụt máu buff sát thương cực đại: [yellow]+50% Sát thương gốc với mỗi 10% HP mất đi[].");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead){
                        core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho MK2![]"); }
                })).size(180, 38);

                // NÚT CHỌN MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(CẤU HÌNH MK2B)===[]").row();
                let b2D = b2.add(" [white]• Máu tối đa: [green]2,610 HP[].\n" +
                                 " [white]• [orange]Nội tại Cuồng Bạo:[] Khi máu [red]dưới 50% HP[] sẽ [yellow]tăng tốc bắn lên 200% (x3)[]!\n" +
                                 " [white]• Đạn có khả năng tự dẫn đường nhẹ.");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2B.copper && core.items.get(Items.lead) >= reqMK2B.lead && core.items.get(Items.titanium) >= reqMK2B.titanium){
                        core.items.remove(Items.copper, reqMK2B.copper); core.items.remove(Items.lead, reqMK2B.lead); core.items.remove(Items.titanium, reqMK2B.titanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho MK2B![]"); }
                })).size(180, 38);

                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp pháo Heliyron");
        } else {
            // Đã nâng cấp lên MK2 hoặc MK2B -> Khóa
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]PHÁO HELIYRON ĐÃ ĐẠT CẤP TỐI ĐA TRONG NHÁNH![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // BẢNG THÔNG TIN CẤU HÌNH
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let currentTier = this.getTier();
            let title = " Thông số Heliyron: ";
            let descStr = "";

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ HELIYRON MK1 ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,450 HP[] | [lightgray]Tầm bắn:[] [orange]300 px[]\n\n" +
                          "[cyan]🔥 CƠ CHẾ CƠ BẢN:[]\n" +
                          "• Cứ mất [red]10% HP[] $\\rightarrow$ [yellow]Tăng +20% Sát thương gốc[].\n" +
                          "• Hit trúng mục tiêu: Tự trừ [red]1% HP max[] (dừng trừ khi HP còn 1%).\n" +
                          "• Đạn tạo hạt li ti bắn ra phía trước và sau.";
            } else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ HELIYRON MK2 ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,175 HP (+50%)[] | [lightgray]Tầm bắn:[] [orange]390 px[]\n\n" +
                          "[cyan]🔥 CƠ CHẾ TĂNG CƯỜNG SÁT THƯƠNG:[]\n" +
                          "• Cứ mất [red]10% HP[] $\\rightarrow$ [yellow]Tăng +50% Sát thương gốc[]!\n" +
                          "• Hit trúng mục tiêu: Tự trừ [red]1% HP max[] (dừng trừ khi HP còn 1%).";
            } else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ HELIYRON MK2B ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,610 HP[] | [lightgray]Tầm bắn:[] [orange]320 px[]\n\n" +
                          "[purple]🔥 CƠ CHẾ CUỒNG BẠO:[]\n" +
                          "• Khi máu [red]dưới 50% HP[] $\\rightarrow$ [yellow]Tăng tốc bắn lên 200% (x3 Tốc độ)[]!\n" +
                          "• Cứ mất [red]10% HP[] $\\rightarrow$ [yellow]Tăng +20% Sát thương gốc[].\n" +
                          "• Hit trúng mục tiêu: Tự trừ [red]1% HP max[] (dừng trừ khi HP còn 1%).";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem thông số pháo Heliyron");
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
        // Giới hạn đặt tối đa 10 pháo trên bản đồ
        this.limitCheck += Time.delta;
        if(this.limitCheck >= 15){
            this.limitCheck = 0; let count = 0; let firstBuild = null;
            Groups.build.each(b => {
                if(b.block == heliyron && b.team == this.team) { 
                    count++; if(firstBuild == null) firstBuild = b; 
                }
            });
            if(count > 10 && this !== firstBuild){
                Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 10 tháp pháo Heliyron! Cấu trúc thừa tự hủy![]"); 
                this.kill(); return;
            }
        }

        this.super$updateTile();

        // Xử lý tăng tốc bắn cho MK2B khi dưới 50% HP
        let tier = this.getTier();
        if(tier == 2 && (this.health / this.maxHealth) < 0.50){
            if(this.isShooting && this.hasAmmo()){
                // Tăng thêm 200% tốc độ bắn (Tốc độ tổng = x3)
                this.reloadCounter += Time.delta * (this.efficiency * 2.0);
            }
        }
    },

    shoot(type){
        let tier = this.getTier();
        
        let bullet = heliyronMK1Bullet;
        if (tier == 1) bullet = heliyronMK2Bullet;
        if (tier == 2) bullet = heliyronMK2BBullet;
        
        let dmgMultiplier = this.getDamageMultiplier();

        let b = bullet.create(this, this.team, this.x, this.y, this.rotation);
        if(b != null){
            b.damage = bullet.damage * dmgMultiplier;
        }
    },

    write(write){
        this.super$write(write); 
        write.b(this.getTier()); 
    },
    read(read, revision){
        this.super$read(read, revision); 
        this.setTier(read.b()); 
    }
});