const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// ==============================================================================
// KHAI BÁO ÂM THANH
// ==============================================================================
const shootSoundBlaster = Vars.tree.loadSound("loudly-blaster-shot-1");

// Hàm tìm Sprite an toàn (tìm tên gốc -> newex- -> reinforced-)
function getModRegion(spriteName) {
    if (Core.atlas.has(spriteName)) return Core.atlas.find(spriteName);
    if (Core.atlas.has("newex-" + spriteName)) return Core.atlas.find("newex-" + spriteName);
    if (Core.atlas.has("reinforced-" + spriteName)) return Core.atlas.find("reinforced-" + spriteName);
    return Core.atlas.find("clear");
}

// Yêu cầu tài nguyên nâng cấp từ MK1
const reqMK2 = { copper: 8000, lead: 4000, titanium: 0 };
const reqMK2B = { copper: 8000, lead: 4000, titanium: 2000 };

// --- EFFECT HẠT BAY TRƯỚC VÀ SAU VIÊN ĐẠN ---
const heliyronParticleEffect = new Effect(18, e => {
    Draw.color(e.color);
    let angles = [0, 90, 180, 270];
    
    for (let i = 0; i < angles.length; i++) {
        Angles.randLenVectors(e.id + i * 10, 3, 8 + e.fin() * 12, e.rotation + angles[i], 25, (x, y) => {
            Fill.circle(e.x + x, e.y + y, 1.5 * e.fout());
        });
    }
});

// --- BULLET TYPES ---
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

// --- ĐẠN PHỤ NÓNG BẮN THẲNG (NHÓM 1 - 4 VIÊN) ---
const heliyronSubBullet = extend(BasicBulletType, {
    speed: 15, damage: 120, width: 5, height: 26, lifetime: 50,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#ff9800"),
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    homingPower: 0.35,  // Đuổi mạnh
    homingRange: 80,    // Phạm vi ngắn
    trailEffect: heliyronParticleEffect,
    trailInterval: 3
});

// --- ĐẠN PHỤ BẮN CHÉO (NHÓM 2 - 4 VIÊN THÊM SAU) ---
const heliyronSubBullet2 = extend(BasicBulletType, {
    speed: 16, damage: 120, width: 5, height: 26, lifetime: 50,
    frontColor: Color.valueOf("#ffffff"), backColor: Color.valueOf("#00e5ff"),
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    homingPower: 0.25,  
    homingRange: 240,   // Phạm vi truy đuổi cao
    trailEffect: heliyronParticleEffect,
    trailInterval: 3
});

// --- BLOCK CONFIG ---
let heliyron = extend(ItemTurret, "heliyron", {
    squareSprite: false,

    load(){
        this.super$load();
        // Nạp phụ kiện custom
        this.bodyRegion = getModRegion("heliyron-body") || getModRegion("heliyron");
        this.c1Region = getModRegion("heliyron-c1");
        this.c2Region = getModRegion("heliyron-c2");
        this.efcoreRegion = getModRegion("heliyron-efcore");
    }
});

heliyron.health = 1450;
heliyron.size = 3;
heliyron.reload = 35;
heliyron.recoil = 0; // Quản lý recoil mượt bằng JS
heliyron.configurable = true;
heliyron.category = Category.turret;
heliyron.shootSound = shootSoundBlaster; // Gán âm thanh bắn mặc định

heliyron.ammo(Items.copper, heliyronMK1Bullet, Items.lead, heliyronMK1Bullet);

heliyron.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

// --- BUILD TYPE ---
heliyron.buildType = () => extend(ItemTurret.ItemTurretBuild, heliyron, {
    tierState: 0,
    customRecoil: 0.0,
    coreScaleVisual: 0.3,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){
        this.tierState = val;
        if(val == 0) this.health = 1450;
        if(val == 1) this.health = 2175;
        if(val == 2) this.health = 2610;
        this.maxHealth = this.health;
    },

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

    getDamageMultiplier(){
        let missingHpPercent = Math.max(0, (1 - (this.health / this.maxHealth)) * 100);
        let steps = Math.floor(missingHpPercent / 10);
        let tier = this.getTier();
        return tier == 1 ? (1 + steps * 0.50) : (1 + steps * 0.20);
    },

    range(){
        let tier = this.getTier();
        if(tier == 2) return 560;
        if(tier == 1) return 570;
        return 550;
    },

    updateTile(){
        this.super$updateTile();

        // Giảm recoil theo thời gian
        this.customRecoil = Mathf.approach(this.customRecoil, 0.0, 0.08 * Time.delta);

        // Nội suy zoom lõi efcore theo lượng HP đã mất
        let missingHpRatio = Math.max(0, 1 - (this.health / this.maxHealth));
        let targetScale = 0.3 + (missingHpRatio * 0.7);
        this.coreScaleVisual = Mathf.approach(this.coreScaleVisual, targetScale, 0.05 * Time.delta);

        // Nội tại MK2B
        let tier = this.getTier();
        if(tier == 2 && (this.health / this.maxHealth) < 0.50){
            if(this.isShooting && this.hasAmmo()){
                this.reloadCounter += Time.delta * (this.efficiency * 2.0);
            }
        }
    },

    shoot(type){
        let tier = this.getTier();
        let bullet = heliyronMK1Bullet;
        if (tier == 1) bullet = heliyronMK2Bullet;
        if (tier == 2) bullet = heliyronMK2BBullet;
        
        this.customRecoil = 1.0;

        let dmgMultiplier = this.getDamageMultiplier();
        
        // PHÁT ÂM THANH BẮN (với độ biến thiên pitch nhẹ)
        if (shootSoundBlaster) shootSoundBlaster.at(this.x, this.y, Mathf.random(0.9, 1.1));

        // 1. BẮN VIÊN ĐẠN CHÍNH
        let b = bullet.create(this, this.team, this.x, this.y, this.rotation);
        if(b != null){
            b.damage = bullet.damage * dmgMultiplier;
        }

        // 2. 40% CƠ HỘI BẮN THÊM 8 VIÊN ĐẠN PHỤ
        if(Mathf.chance(0.4)){
            let rad = this.rotation * Mathf.degRad;
            let cos = Math.cos(rad);
            let sin = Math.sin(rad);

            // Sát thương bằng 80% đạn gốc
            let subDamage = (bullet.damage * 0.8) * dmgMultiplier;

            // --- NHÓM 1: BẮN THẲNG (CỰ LÝ TRUY ĐUỔI NGẮN) ---
            let sideOffsets1 = [-2.0, 2.0];
            for(let i = 0; i < sideOffsets1.length; i++){
                let side = sideOffsets1[i];
                let sx = this.x + (-sin * side);
                let sy = this.y + (cos * side);
                let sb = heliyronSubBullet.create(this, this.team, sx, sy, this.rotation);
                if(sb != null) sb.damage = subDamage;
            }

            let botSideOffsets3 = [-3.0, 3.0];
            let backDist3 = -3.0;
            for(let i = 0; i < botSideOffsets3.length; i++){
                let side = botSideOffsets3[i];
                let bx = this.x + (-sin * side) + (cos * backDist3);
                let by = this.y + (cos * side) + (sin * backDist3);
                let sb = heliyronSubBullet.create(this, this.team, bx, by, this.rotation);
                if(sb != null) sb.damage = subDamage;
            }

            // --- NHÓM 2: BẮN CHÉO (CỰ LÝ TRUY ĐUỔI TẦM XA) ---
            let sideOffsets10 = [-10.0, 10.0];
            let angleOffsets10 = [-25.0, 25.0];
            for(let i = 0; i < sideOffsets10.length; i++){
                let side = sideOffsets10[i];
                let sx = this.x + (-sin * side);
                let sy = this.y + (cos * side);
                let sb = heliyronSubBullet2.create(this, this.team, sx, sy, this.rotation + angleOffsets10[i]);
                if(sb != null) sb.damage = subDamage;
            }

            let botSideOffsets1 = [-1.0, 1.0];
            let angleOffsets45 = [-45.0, 45.0];
            let backDist5 = -5.0;
            for(let i = 0; i < botSideOffsets1.length; i++){
                let side = botSideOffsets1[i];
                let bx = this.x + (-sin * side) + (cos * backDist5);
                let by = this.y + (cos * side) + (sin * backDist5);
                let sb = heliyronSubBullet2.create(this, this.team, bx, by, this.rotation + angleOffsets45[i]);
                if(sb != null) sb.damage = subDamage;
            }

            Fx.shootBig.at(this.x, this.y, this.rotation);
        }
    },

    // --- VẼ CÁC PHỤ KIỆN VÀ ANIMATION (MINDUSTRY TỰ VẼ ĐẾ QUA super$draw) ---
    draw() {
        this.super$draw();

        let rot = this.rotation - 90;
        let rad = this.rotation * Mathf.degRad;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);

        // 1. VẼ KHUNG BODY (heliyron-body)
        if (heliyron.bodyRegion != null && heliyron.bodyRegion.found()) {
            Draw.rect(heliyron.bodyRegion, this.x, this.y, rot);
        }

        // 2. TÍNH TOÁN VÀ VẼ CÁNH C1, C2 KHI GIẬT
        let recoilDist = this.customRecoil * 5.0;

        // heliyron-c1: Di chuyển sang trái 5px + lùi 5px
        let c1X = this.x + (-sin * recoilDist) - (cos * recoilDist);
        let c1Y = this.y + (cos * recoilDist) - (sin * recoilDist);

        // heliyron-c2: Di chuyển sang phải 5px + lùi 5px
        let c2X = this.x + (sin * recoilDist) - (cos * recoilDist);
        let c2Y = this.y + (-cos * recoilDist) - (sin * recoilDist);

        if (heliyron.c1Region != null && heliyron.c1Region.found()) {
            Draw.rect(heliyron.c1Region, c1X, c1Y, rot);
        }
        if (heliyron.c2Region != null && heliyron.c2Region.found()) {
            Draw.rect(heliyron.c2Region, c2X, c2Y, rot);
        }

        // 3. VẼ LÕI EFCORE VỚI ANIMATION ZOOM MƯỢT
        if (heliyron.efcoreRegion != null && heliyron.efcoreRegion.found()) {
            Draw.z(Layer.turret + 0.01);
            let coreWidth = heliyron.efcoreRegion.width * Draw.scl * this.coreScaleVisual;
            let coreHeight = heliyron.efcoreRegion.height * Draw.scl * this.coreScaleVisual;

            Draw.blend(Blending.additive);
            Draw.rect(heliyron.efcoreRegion, this.x, this.y, coreWidth, coreHeight, rot);
            Draw.blend();
            Draw.z(Layer.turret);
        }
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        // --- NÚT NÂNG CẤP (Icon ^) ---
        if(tier == 0) {
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

                // NHÁNH 1: MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(CẤU HÌNH MK2)===[]").row();
                let b1D = b1.add(
                    " [white]• Máu: [green]+50%[] (lên 2,175 HP)\n" +
                    " [white]• Sát thương gốc: [lightgray]150[]\n" +
                    " [white]• Phạm vi bắn: [orange]+3.6%[] (lên 570 px)\n" +
                    " [white]• Nội tại: [yellow]+50% Sát thương[] với mỗi [red]10% HP mất[]\n" +
                    " [white]• Cơ chế: Mất [red]1% HP[] khi trúng địch | 40% cơ hội bắn thêm 8 đạn phụ (4 thẳng 80% SD, 4 chéo 80% SD tầm xa)"
                );
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead){
                        core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho MK2![]"); }
                })).size(180, 38);

                // NHÁNH 2: MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(CẤU HÌNH MK2B)===[]").row();
                let b2D = b2.add(
                    " [white]• Máu: [green]+80%[] (lên 2,610 HP)\n" +
                    " [white]• Sát thương gốc: [lightgray]150[] (Đạn tự dẫn đường 12%)\n" +
                    " [white]• Phạm vi bắn: [orange]+1.8%[] (lên 560 px)\n" +
                    " [white]• Nội tại Cuồng Bạo: Khi Máu [red]< 50% HP[] -> [yellow]+200% Tốc bắn (x3)[]\n" +
                    " [white]• Cơ chế: Mất [red]1% HP[] khi trúng địch | 40% cơ hội bắn thêm 8 đạn phụ (4 thẳng 80% SD, 4 chéo 80% SD tầm xa)"
                );
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
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]PHÁO HELIYRON ĐÃ ĐẠT CẤP TỐI ĐA TRONG NHÁNH![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // --- NÚT THÔNG TIN (Icon i) ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let currentTier = this.getTier();
            let title = " Thông số Heliyron: ";
            let descStr = "";

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ HELIYRON MK1 ⚡[]\n" +
                          "[lightgray]Máu tối đa:[] [green]1,450 HP[]\n" +
                          "[lightgray]Sát thương gốc:[] [orange]150[]\n" +
                          "[lightgray]Phạm vi bắn:[] [orange]550 px[]\n\n" +
                          "[yellow]CƠ CHẾ BẮN & NỘI TẠI:[]\n" +
                          "• Mất [red]10% HP[] -> [yellow]+20% Sát thương[] cho mọi đạn.\n" +
                          "• Tự tổn hại: Mất [red]1% HP[] hiện tại mỗi khi bắn trúng mục tiêu.\n" +
                          "• Đạn phụ: [cyan]40% cơ hội[] kích hoạt 8 đạn phụ có sát thương bằng [yellow]80%[] đạn gốc:\n" +
                          "   - [orange]4 viên bắn thẳng:[] Phạm vi đuổi ngắn.\n" +
                          "   - [cyan]4 viên bắn chéo:[] Phạm vi truy đuổi rộng (tầm xa).";
            } else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ HELIYRON MK2 ⚡[]\n" +
                          "[lightgray]Máu tối đa:[] [green]2,175 HP[] [lime](+50%)[]\n" +
                          "[lightgray]Sát thương gốc:[] [orange]150[]\n" +
                          "[lightgray]Phạm vi bắn:[] [orange]570 px[] [lime](+3.6%)[]\n\n" +
                          "[yellow]CƠ CHẾ BẮN & NỘI TẠI:[]\n" +
                          "• Mất [red]10% HP[] -> [yellow]+50% Sát thương[] cho mọi đạn!\n" +
                          "• Tự tổn hại: Mất [red]1% HP[] hiện tại mỗi khi bắn trúng mục tiêu.\n" +
                          "• Đạn phụ: [cyan]40% cơ hội[] kích hoạt 8 đạn phụ có sát thương bằng [yellow]80%[] đạn gốc:\n" +
                          "   - [orange]4 viên bắn thẳng:[] Phạm vi đuổi ngắn.\n" +
                          "   - [cyan]4 viên bắn chéo:[] Phạm vi truy đuổi rộng (tầm xa).";
            } else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ HELIYRON MK2B ⚡[]\n" +
                          "[lightgray]Máu tối đa:[] [green]2,610 HP[] [lime](+80%)[]\n" +
                          "[lightgray]Sát thương gốc:[] [orange]150[] [cyan](Đạn tự dẫn đường 12%)[]\n" +
                          "[lightgray]Phạm vi bắn:[] [orange]560 px[] [lime](+1.8%)[]\n\n" +
                          "[yellow]CƠ CHẾ BẮN & NỘI TẠI:[]\n" +
                          "• Mất [red]10% HP[] -> [yellow]+20% Sát thương[] cho mọi đạn.\n" +
                          "• [orange]Nội tại Cuồng Bạo:[] Khi Máu [red]< 50% HP[] -> [yellow]+200% Tốc bắn (x3)[]!\n" +
                          "• Tự tổn hại: Mất [red]1% HP[] hiện tại mỗi khi bắn trúng mục tiêu.\n" +
                          "• Đạn phụ: [cyan]40% cơ hội[] kích hoạt 8 đạn phụ có sát thương bằng [yellow]80%[] đạn gốc:\n" +
                          "   - [orange]4 viên bắn thẳng:[] Phạm vi đuổi ngắn.\n" +
                          "   - [cyan]4 viên bắn chéo:[] Phạm vi truy đuổi rộng (tầm xa).";
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

    write(write){
        this.super$write(write);
        write.b(this.getTier());
    },
    read(read, revision){
        this.super$read(read, revision);
        this.setTier(read.b());
        this.customRecoil = 0.0;
        this.coreScaleVisual = 0.3;
    }
});