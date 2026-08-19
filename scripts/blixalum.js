const packCons = (func) => new Cons({ get: func });
const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// ==============================================================================
// KHAI BÁO ÂM THANH
// ==============================================================================
const chargeSound = Vars.tree.loadSound("plasma-charge");
const shootSound = Vars.tree.loadSound("plasma-shot-3");

const reqBlixalumMK2 = { copper: 4000, lead: 4000, titanium: 0 };
const reqBlixalumMK2B = { copper: 4000, lead: 4000, titanium: 2000 };

function drawBlixalumWindRing(cx, cy, radiusX, radiusY, angle, strokeWidth, color) {
    Draw.color(color); 
    Lines.stroke(strokeWidth);
    let steps = 8; 
    let lastX = 0, lastY = 0;
    let rad = angle * Mathf.degRad;
    let cosA = Math.cos(rad); 
    let sinA = Math.sin(rad);
    
    for (let i = 0; i <= steps; i++) {
        let a = (i * (360 / steps)) * Mathf.degRad;
        let lx = Math.cos(a) * radiusX; 
        let ly = Math.sin(a) * radiusY;
        let rx = cx + (lx * cosA - ly * sinA); 
        let ry = cy + (lx * sinA + ly * cosA);
        if (i > 0) Lines.line(lastX, lastY, rx, ry);
        lastX = rx; 
        lastY = ry;
    }
    Draw.reset();
}

const blixalumMuzzleDistort = new Effect(16, e => {
    let tColor = e.data || Color.valueOf("#00d0ff");
    let baseAngle = e.rotation;
    let forwardOffset = 12 - (e.fin() * 24); 
    let bx = e.x + Angles.trnsx(baseAngle, forwardOffset);
    let by = e.y + Angles.trnsy(baseAngle, forwardOffset);
    let zoomRadiusX = 2.0 + (e.fin() * 10.0);
    let zoomRadiusY = 4.0 + (e.fin() * 18.0);
    let thickness = 2.0 * e.fout(); 
    drawBlixalumWindRing(bx, by, zoomRadiusX, zoomRadiusY, baseAngle, thickness, tColor);
});

const circleOut = new Effect(45, 500, packCons(e => {
    let maxRadius = (e.rotation > 0 && e.rotation <= 120) ? e.rotation : 56; 
    let currentRad = maxRadius * e.fin(Interp.pow3Out);

    Draw.color(e.color);

    Fill.circle(e.x, e.y, (maxRadius * 0.35) * e.fout());

    Lines.stroke(8.0 * e.fout(), e.color);
    Lines.circle(e.x, e.y, currentRad);

    Lines.stroke(4.0 * e.fout(), Color.white);
    Lines.circle(e.x, e.y, currentRad * 0.85);
}));

const createBlixalumBullet = (baseDmg, splashDmg, splashRad, bulletColor) => {
    return extend(BasicBulletType, {
        speed: 2.2, 
        damage: baseDmg, 
        width: 12, 
        height: 28, 
        lifetime: 60, 
        frontColor: bulletColor, 
        backColor: Color.white,
        hitEffect: circleOut, 
        despawnEffect: circleOut,
        hitColor: bulletColor,
        splashDamage: splashDmg, 
        splashDamageRadius: splashRad,

        draw(b) {
            this.super$draw(b);
            let bAngle = b.rotation();
            let travelProgress = ((b.time * 0.05)) % 1.0;
            let fout = 1.0 - travelProgress; 
            let offset = 16.0 - (travelProgress * 33.0);
            let rx = b.x + Angles.trnsx(bAngle, offset);
            let ry = b.y + Angles.trnsy(bAngle, offset);
            let zoomFactor = travelProgress * 1.5; 
            let radiusX = (2.0 + (zoomFactor * 4.0));
            let radiusY = (4.0 + (zoomFactor * 8.0));
            if (fout > 0.05) drawBlixalumWindRing(rx, ry, radiusX, radiusY, bAngle, 1.5 * fout, bulletColor);
        }
    });
};

const blixalumMK1Bullet = createBlixalumBullet(250, 875, 64, Color.valueOf("#00ddff"));
const blixalumMK2Bullet = createBlixalumBullet(250, 875, 80, Color.valueOf("#00ffffff"));
const blixalumMK2BBullet = createBlixalumBullet(300, 150, 48, Color.valueOf("#eaff00"));

const blixalumLaser = extend(LaserBulletType, {
    damage: 150, 
    length: 220, 
    width: 8.0, 
    lifetime: 16,
    colors: [Color.valueOf("#a1ff9a").cpy().mul(0.3), Color.valueOf("#b1ffae"), Color.white]
});

let blixalum = extend(ItemTurret, "blixalum", {
    squareSprite: false,
    basePrefix: "reinforced-", 
    
    load() {
        this.super$load();
        this.customBaseRegion = Core.atlas.find(this.basePrefix + "block-" + this.size);
        this.btu1Region = Core.atlas.find("newex-blixalum-barrel");
        this.region = Core.atlas.find("newex-blixalum-body");
        
        this.w1Region = Core.atlas.find("newex-blixalum-w1");
        this.w2Region = Core.atlas.find("newex-blixalum-w2");
        this.wing1Region = Core.atlas.find("newex-blixalum-wing1");
        this.wing2Region = Core.atlas.find("newex-blixalum-wing2");
        
        this.wa1Region = Core.atlas.find("newex-blixalum-wa1");
        this.wa2Region = Core.atlas.find("newex-blixalum-wa2");
        this.winga1Region = Core.atlas.find("newex-blixalum-winga1");
        this.winga2Region = Core.atlas.find("newex-blixalum-winga2");
    }
});

blixalum.health = 3500;
blixalum.size = 3;
blixalum.reload = 60; 
blixalum.configurable = true;
blixalum.category = Category.turret;
blixalum.ammo(Items.titanium, blixalumMK1Bullet); 

blixalum.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) tile.setTier(value);
}));

blixalum.buildType = () => extend(ItemTurret.ItemTurretBuild, blixalum, {
    tierState: 0, 
    chargeTimer: 0, 
    isCharged: false, 
    laserTimer: 0, 
    dynamicSpeedBonus: 1.0,
    wingAnimation: 0.0, 
    customRecoil: 0.0,
    scanTimer: 0,
    chargeSoundTimer: 0,

    getTier() { return this.tierState == null ? 0 : this.tierState; },
    setTier(val) { this.tierState = val; this.chargeTimer = 0; this.isCharged = false; this.laserTimer = 0; },
    range() { return (this.getTier() == 1) ? 340 : 260; },

    buildConfiguration(table) {
        table.clear(); 
        table.row();
        let tier = this.getTier();

        if (tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if (core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let inv = core.items;
                    
                    let c = inv.get(Items.copper), l = inv.get(Items.lead), t = inv.get(Items.titanium);
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh Cấu Hình MK2[]\n" +
                           " • Đồng: " + (c >= reqBlixalumMK2.copper ? "[green]" : "[red]") + c + "[] / " + reqBlixalumMK2.copper + "\n" +
                           " • Chì: " + (l >= reqBlixalumMK2.lead ? "[green]" : "[red]") + l + "[] / " + reqBlixalumMK2.lead + "\n" +
                           "[purple]Nhánh Biến Thể MK2B[]\n" +
                           " • Đồng: " + (c >= reqBlixalumMK2B.copper ? "[green]" : "[red]") + c + "[] / " + reqBlixalumMK2B.copper + "\n" +
                           " • Chì: " + (l >= reqBlixalumMK2B.lead ? "[green]" : "[red]") + l + "[] / " + reqBlixalumMK2B.lead + "\n" +
                           " • Titan: " + (t >= reqBlixalumMK2B.titanium ? "[green]" : "[red]") + t + "[] / " + reqBlixalumMK2B.titanium;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); 
                dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b1 = new Table(); 
                b1.background(Styles.black6); 
                b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("[white]• Tầm bắn: [green]+30%[] (340 px)\n" +
                                 "• Tốc độ bắn tối đa: [green]+200%[]\n" +
                                 "• Bán kính nổ lan: [green]+25%[] (80 px)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Tần Tốc Thông Minh — Tự động quét từ trường xung quanh và gia tăng tốc độ hỏa lực đột biến theo mật độ kẻ địch trong tầm bắn.[]");
                b1D.width(340).get().setWrap(true); 
                b1D.get().setAlignment(Align.left); 
                b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.copper) >= reqBlixalumMK2.copper && core.items.get(Items.lead) >= reqBlixalumMK2.lead) {
                        core.items.remove(Items.copper, reqBlixalumMK2.copper); 
                        core.items.remove(Items.lead, reqBlixalumMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); 
                        Fx.mineHuge.at(this.x, this.y); 
                        Effect.shake(5, 5, this.x, this.y);
                        this.setTier(1); 
                        dialog.hide(); 
                        this.deselect();
                    } else { 
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); 
                    }
                })).size(180, 38);

                let b2 = new Table(); 
                b2.background(Styles.black6); 
                b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("[white]• sát thương gốc: [green]+20%[] (300 DMG)\n" +
                                 "• Bán kính nổ lan: [red]-25%[] (48 px)\n" +
                                 "• Tốc độ bắn tối đa: [red]-20%[]\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Bảo Táp Laser — Tích tụ ma trận lõi năng lượng và tự động kích hoạt phóng 4 tia Laser hội tụ thiêu rụi mục tiêu mỗi 5 giây.[]");
                b2D.width(340).get().setWrap(true); 
                b2D.get().setAlignment(Align.left); 
                b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.copper) >= reqBlixalumMK2B.copper && core.items.get(Items.lead) >= reqBlixalumMK2B.lead && core.items.get(Items.titanium) >= reqBlixalumMK2B.titanium) {
                        core.items.remove(Items.copper, reqBlixalumMK2B.copper); 
                        core.items.remove(Items.lead, reqBlixalumMK2B.lead); 
                        core.items.remove(Items.titanium, reqBlixalumMK2B.titanium);
                        Fx.bigShockwave.at(this.x, this.y); 
                        Fx.mineHuge.at(this.x, this.y); 
                        Effect.shake(5, 5, this.x, this.y);
                        this.setTier(2); 
                        dialog.hide(); 
                        this.deselect();
                    } else { 
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); 
                    }
                })).size(180, 38);

                branchesTable.add(b1).width(340); 
                branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); 
                dialog.show();
            })).size(50, 40).tooltip("Nâng cấp tháp pháo lên");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]Nâng cấp tháp pháo đã đạt giới hạn![]");
            })).size(50, 40).tooltip("Nâng cấp tháp pháo");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let currentTier = this.getTier();
            let title = " Thông số pháo \"Blixalum\": ";
            let descStr = "";

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu cấu trúc:[] [green]3,500 HP[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]260 pixel[]\n" +
                          "[lightgray]sát thương gốc:[] [white]250 DMG / phát bắn[]\n" +
                          "[lightgray]Sát thương nổ lan:[] [white]875 DMG (64 px)[]\n\n" +
                          "[cyan]⚡ CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                          "• Tích Năng Lượng Từ Trường: Cần 2 giây nạp sạc trước khi xả đạn xung kích.\n" +
                          "• Tốc hỏa thích ứng: Tự động tăng +10% tốc độ bắn với mỗi kẻ địch xuất hiện trong tầm bắn (tối đa +100%).";
            } else if (currentTier == 1) {
                title += "[cyan]THÔNG SỐ NÂNG CẤP MK2[]";
                descStr = "[cyan]⚡ THÔNG SỐ NÂNG CẤP MK2 ⚡[]\n" +
                          "[lightgray]Máu cấu trúc:[] [green]3,500 HP[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]340 pixel (+30%)[]\n" +
                          "[lightgray]sát thương gốc:[] [white]250 DMG / phát bắn[]\n" +
                          "[lightgray]Sát thương nổ lan:[] [white]875 DMG (80 px) (+25%)[]\n\n" +
                          "[cyan]⚡ CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                          "• Mở Rộng Tần Tốc Thông Minh: Cải tiến lõi từ trường tối ưu tần suất quét tự động.\n" +
                          "• Tốc hỏa đột biến: Tăng +10% tốc độ bắn cho mỗi kẻ địch trong tầm bắn (tối đa +300%).";
            } else if (currentTier == 2) {
                title += "[purple]THÔNG SỐ NÂNG CẤP MK2B[]";
                descStr = "[purple]⚡ THÔNG SỐ NÂNG CẤP MK2B ⚡[]\n" +
                          "[lightgray]Máu cấu trúc:[] [green]3,500 HP[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [red]260 pixel[]\n" +
                          "[lightgray]sát thương gốc:[] [white]300 DMG / phát bắn (+20%)[]\n" +
                          "[lightgray]Sát thương nổ lan:[] [white]150 DMG (48 px) (-25%)[]\n\n" +
                          "[purple]🔥 CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                          "• Bảo Táp Laser Đột Phá: Hợp nhất ma trận lõi năng lượng laser phá hủy cơ động.\n" +
                          "• Xung kích phụ: Mỗi 5 giây nạp sạc sẽ tự động bắn 4 tia Laser (150 DMG/tia) dội thẳng vào mục tiêu.";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); 
            cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); 
            dialog.show();
        })).size(50, 40).tooltip("Trung tâm nâng cấp pháo");
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile() {
        this.super$updateTile();
        let tier = this.getTier();

        this.customRecoil = Mathf.lerpDelta(this.customRecoil, 0.0, 0.12);

        let hasEnemy = this.target != null;
        this.wingAnimation = Mathf.lerpDelta(this.wingAnimation, hasEnemy ? 1.0 : 0.0, 0.05);

        this.scanTimer += Time.delta;
        if (this.scanTimer >= 15) {
            this.scanTimer = 0;
            let enemyCount = 0; 
            let currentRange = this.range();
            Units.nearbyEnemies(this.team, this.x - currentRange, this.y - currentRange, currentRange * 2, currentRange * 2, u => {
                if (u && !u.dead && this.dst(u) <= currentRange) enemyCount++;
            });
            let maxBonus = (tier == 1) ? 3.0 : ((tier == 2) ? 0.8 : 1.0); 
            this.dynamicSpeedBonus = 1.0 + Math.min(maxBonus, enemyCount * 0.1);
        }

        if (this.isShooting && this.hasAmmo()) {
            this.reloadCounter += Time.delta * (this.dynamicSpeedBonus - 1.0) * this.efficiency;
            if (!this.isCharged) {
                if (this.reloadCounter > 0) this.reloadCounter = 0; 
                this.chargeTimer += Time.delta * this.efficiency;

                // Âm thanh nạp sạc
                this.chargeSoundTimer += Time.delta;
                if (this.chargeSoundTimer >= 30 && chargeSound != null) {
                    this.chargeSoundTimer = 0;
                    chargeSound.at(this.x, this.y, 0.8 + (this.chargeTimer / 120) * 0.4);
                }

                if (this.chargeTimer >= 120) this.isCharged = true; 
            }
            if (tier == 2) {
                this.laserTimer += Time.delta * this.efficiency;
                if (this.laserTimer >= 300) { 
                    this.laserTimer = 0; 
                    this.fireTier2BLasers(); 
                }
            }
        } else {
            this.chargeTimer = Math.max(0, this.chargeTimer - Time.delta * 1.5);
            this.isCharged = false; 
            this.laserTimer = 0;
            this.chargeSoundTimer = 0;
        }
    },

    fireTier2BLasers() {
        if (this.target == null) return;
        let baseAngle = this.rotation; 
        let targetAngle = Angles.angle(this.x, this.y, this.target.x, this.target.y);
        let localY = -5;
        let offsets = [8, 3, -3, -8];
        for (let i = 0; i < 4; i++) {
            let spawnX = this.x + Angles.trnsx(baseAngle, localY, offsets[i]);
            let spawnY = this.y + Angles.trnsy(baseAngle, localY, offsets[i]);
            blixalumLaser.create(this, this.team, spawnX, spawnY, targetAngle, 1.0, 1.0);
        }
    },

    shoot(type) {
        if (!this.isCharged) return;
        let tier = this.getTier();
        let selectedBullet = (tier == 1) ? blixalumMK2Bullet : ((tier == 2) ? blixalumMK2BBullet : blixalumMK1Bullet);
        let spawnX = this.x + Angles.trnsx(this.rotation, 8);
        let spawnY = this.y + Angles.trnsy(this.rotation, 8);
        Call.createBullet(selectedBullet, this.team, spawnX, spawnY, this.rotation, selectedBullet.damage, selectedBullet.speed, 1.0);
        let tierColor = (tier == 1) ? Color.valueOf("#00ffff") : ((tier == 2) ? Color.valueOf("#33ddff") : Color.valueOf("#e5ff00"));
        blixalumMuzzleDistort.at(spawnX, spawnY, this.rotation, tierColor);

        // --- PHÁT ÂM THANH BẮN CỐ ĐỊNH (PLASMA-SHOT-3) ---
        if (shootSound != null) {
            shootSound.at(this.x, this.y, Mathf.random(0.9, 1.1));
        }

        this.customRecoil = 1.0;
    },

    draw() {
        if (blixalum.customBaseRegion != null && blixalum.customBaseRegion.found()) {
            Draw.rect(blixalum.customBaseRegion, this.x, this.y);
        } else {
            Draw.rect(blixalum.baseRegion, this.x, this.y);
        }

        let sAngle = this.rotation; 
        let drawAngle = sAngle - 90;
        let anim = this.wingAnimation; 

        let w1_Back  = -5.0 * anim;
        let w2_Back  = -6.5 * anim; 
        let w2_Side  = 1.5 * anim;
        let wa2_Back = -5.0 * anim;
        let wa1_Back = -6.5 * anim; 
        let wa1_Side = 1.5 * anim;

        let wing1_Back = -2.0; 
        let wing1_Side = 1.5 * anim;
        let wing2_Side = 1.0 * anim;
        let winga1_Side = 1.0 * anim;
        let winga2_Back = -2.0 * anim; 
        let winga2_Side = 1.5 * anim;

        let barrelRecoil = -7.5 * this.customRecoil;

        let w1X = this.x + Angles.trnsx(sAngle, w1_Back);
        let w1Y = this.y + Angles.trnsy(sAngle, w1_Back);
        
        let w2X = this.x + Angles.trnsx(sAngle, w2_Back) + Angles.trnsx(sAngle - 90, w2_Side);
        let w2Y = this.y + Angles.trnsy(sAngle, w2_Back) + Angles.trnsy(sAngle - 90, w2_Side);
        
        let wing1X = this.x + Angles.trnsx(sAngle, wing1_Back) + Angles.trnsx(sAngle - 90, wing1_Side);
        let wing1Y = this.y + Angles.trnsy(sAngle, wing1_Back) + Angles.trnsy(sAngle - 90, wing1_Side);
        
        let wing2X = this.x + Angles.trnsx(sAngle - 90, wing2_Side);
        let wing2Y = this.y + Angles.trnsy(sAngle - 90, wing2_Side);

        let wa2X = this.x + Angles.trnsx(sAngle, wa2_Back);
        let wa2Y = this.y + Angles.trnsy(sAngle, wa2_Back);
        
        let wa1X = this.x + Angles.trnsx(sAngle, wa1_Back) + Angles.trnsx(sAngle + 90, wa1_Side);
        let wa1Y = this.y + Angles.trnsy(sAngle, wa1_Back) + Angles.trnsy(sAngle + 90, wa1_Side);
        
        let winga1X = this.x + Angles.trnsx(sAngle + 90, winga1_Side);
        let winga1Y = this.y + Angles.trnsy(sAngle + 90, winga1_Side);
        
        let winga2X = this.x + Angles.trnsx(sAngle, winga2_Back) + Angles.trnsx(sAngle + 90, winga2_Side);
        let winga2Y = this.y + Angles.trnsy(sAngle, winga2_Back) + Angles.trnsy(sAngle + 90, winga2_Side);

        let btu1X = this.x + Angles.trnsx(sAngle, barrelRecoil);
        let btu1Y = this.y + Angles.trnsy(sAngle, barrelRecoil);

        if (blixalum.wing2Region != null && blixalum.wing2Region.found()) { Draw.rect(blixalum.wing2Region, wing2X, wing2Y, drawAngle); }
        if (blixalum.winga2Region != null && blixalum.winga2Region.found()) { Draw.rect(blixalum.winga2Region, winga2X, winga2Y, drawAngle); }
        if (blixalum.wing1Region != null && blixalum.wing1Region.found()) { Draw.rect(blixalum.wing1Region, wing1X, wing1Y, drawAngle); }
        if (blixalum.winga1Region != null && blixalum.winga1Region.found()) { Draw.rect(blixalum.winga1Region, winga1X, winga1Y, drawAngle); }

        if (blixalum.w2Region != null && blixalum.w2Region.found()) { Draw.rect(blixalum.w2Region, w2X, w2Y, drawAngle); }
        if (blixalum.wa2Region != null && blixalum.wa2Region.found()) { Draw.rect(blixalum.wa2Region, wa2X, wa2Y, drawAngle); }
        if (blixalum.w1Region != null && blixalum.w1Region.found()) { Draw.rect(blixalum.w1Region, w1X, w1Y, drawAngle); }
        if (blixalum.wa1Region != null && blixalum.wa1Region.found()) { Draw.rect(blixalum.wa1Region, wa1X, wa1Y, drawAngle); }
        
        if (blixalum.btu1Region != null && blixalum.btu1Region.found()) { Draw.rect(blixalum.btu1Region, btu1X, btu1Y, drawAngle); }
        if (blixalum.region != null && blixalum.region.found()) { Draw.rect(blixalum.region, this.x, this.y, drawAngle); }

        if (this.isShooting && !this.isCharged && this.hasAmmo()) {
            let progress = this.chargeTimer / 120;
            let muzzleX = this.x + Angles.trnsx(this.rotation, 10); 
            let muzzleY = this.y + Angles.trnsy(this.rotation, 10);

            Draw.draw(Layer.effect + 1, packRun(() => {
                Fill.circle(muzzleX, muzzleY, 2.0 * progress);
            }));
        }
    },

    write(write) { this.super$write(write); write.b(this.getTier()); },
    read(read, revision) { this.super$read(read, revision); this.setTier(read.b()); }
});