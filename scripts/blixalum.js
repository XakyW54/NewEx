/*BLIXALUM TURRET SYSTEM - ADVANCED 8-WING MECHANICAL DRAWING ENGINE*/

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqBlixalumMK2 = { copper: 4000, lead: 4000, titanium: 0 };
const reqBlixalumMK2B = { copper: 4000, lead: 4000, titanium: 2000 };

function drawBlixalumWindRing(cx, cy, radiusX, radiusY, angle, strokeWidth, color){
    Draw.color(color); 
    Lines.stroke(strokeWidth);
    let steps = 16; let lastX = 0, lastY = 0;
    let cosA = Math.cos(angle * Mathf.degRad); let sinA = Math.sin(angle * Mathf.degRad);
    
    for(let i = 0; i <= steps; i++){
        let a = (i * (360 / steps)) * Mathf.degRad;
        let lx = Math.cos(a) * radiusX; let ly = Math.sin(a) * radiusY;
        let rx = cx + (lx * cosA - ly * sinA); let ry = cy + (lx * sinA + ly * cosA);
        if(i > 0) Lines.line(lastX, lastY, rx, ry);
        lastX = rx; lastY = ry;
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

const blixalumExplosionFX = new Effect(24, e => {
    let splashRad = e.rotation > 0 ? e.rotation : 5.0;
    let tColor = e.data || Color.valueOf("#00d5ff");
    
    // --- CHỈNH SỬA THÊM: Sửa lỗi không thay đổi phạm vi zoom vòng tròn vụ nổ ---
    // Lấy bán kính thực tế từ viên đạn nếu có va chạm, nếu không có thì dùng phạm vi mặc định theo loại đạn
    if (e.data && typeof e.data === 'object' && e.data.type) {
        splashRad = e.data.type.splashDamageRadius;
    } else if (Vars.state && Vars.state.rules) {
        // Dự phòng: Tự động map độ rộng vòng tròn theo Tier nếu e.rotation bị lỗi truyền hướng nòng
        splashRad = (splashRad > 90) ? 48 : (splashRad > 70 ? 80 : 64);
    }
    
    // ĐÃ THAY THẾ: Sử dụng hiệu ứng va chạm nhỏ thay vì blastExplosion để tâm nổ nhẹ nhàng, không lóa mắt
    Fx.hitBulletSmall.at(e.x, e.y);
    
    // Giữ lại duy nhất vòng tròn mở rộng mượt mà bao phủ vùng nổ
    Draw.color(tColor);
    Lines.stroke(2.0 * e.fout());
    let currentRadius = e.fin() * splashRad;
    Lines.circle(e.x, e.y, currentRadius);
    
    Draw.reset();
});

const createBlixalumBullet = (baseDmg, splashDmg, splashRad, bulletColor) => {
    return extend(BasicBulletType, {
        speed: 2.2, damage: baseDmg, width: 12, height: 28, lifetime: 60, 
        frontColor: bulletColor, backColor: Color.white,
        hitEffect: blixalumExplosionFX, despawnEffect: blixalumExplosionFX,
        splashDamage: splashDmg, splashDamageRadius: splashRad,
        draw(b) {
            this.super$draw(b);
            let bAngle = b.rotation();
            let ringCount = 2; 
            for(let i = 0; i < ringCount; i++) {
                let travelProgress = ((b.time * 0.05) + (i * (1.0 / ringCount))) % 1.0;
                let fout = 1.0 - travelProgress; 
                let offset = 16.0 - (travelProgress * 33.0);
                let rx = b.x + Angles.trnsx(bAngle, offset);
                let ry = b.y + Angles.trnsy(bAngle, offset);
                let zoomFactor = travelProgress * 1.5; 
                let radiusX = (2.0 + (zoomFactor * 4.0)) * (1.0 + Mathf.absin(Time.time, 2.5, 0.1));
                let radiusY = (4.0 + (zoomFactor * 8.0)) * (1.0 + Mathf.absin(Time.time, 2.5, 0.1));
                if (fout > 0.05) drawBlixalumWindRing(rx, ry, radiusX, radiusY, bAngle, 1.5 * fout, bulletColor);
            }
        }
    });
};

const blixalumMK1Bullet = createBlixalumBullet(250, 875, 64, Color.valueOf("#00ddff"));
const blixalumMK2Bullet = createBlixalumBullet(250, 875, 80, Color.valueOf("#00ffffff"));
const blixalumMK2BBullet = createBlixalumBullet(300, 150, 48, Color.valueOf("#eaff00"));

const blixalumLaser = extend(LaserBulletType, {
    damage: 150, length: 220, width: 8.0, lifetime: 16,
    colors: [Color.valueOf("#a1ff9a").cpy().mul(0.3), Color.valueOf("#b1ffae"), Color.white]
});

// ==========================================
// KHỞI TẠO KHỐI THÁP PHÁO BLIXALUM
// ==========================================
let blixalum = extend(ItemTurret, "blixalum", {
    squareSprite: false,
    basePrefix: "reinforced-", 
    
    load(){
        this.super$load();
        this.customBaseRegion = Core.atlas.find(this.basePrefix + "block-" + this.size);
        
        this.btu1Region = Core.atlas.find("newex-blixalum-barrel");
        this.region = Core.atlas.find("newex-blixalum-body");
        
        // BÊN PHẢI (w và wing)
        this.w1Region = Core.atlas.find("newex-blixalum-w1");
        this.w2Region = Core.atlas.find("newex-blixalum-w2");
        this.wing1Region = Core.atlas.find("newex-blixalum-wing1");
        this.wing2Region = Core.atlas.find("newex-blixalum-wing2");
        
        // BÊN TRÁI (wa và winga)
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

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ this.tierState = val; this.chargeTimer = 0; this.isCharged = false; this.laserTimer = 0; },
    range(){ return (this.getTier() == 1) ? 340 : 260; },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Nâng Cấp Chuỗi Hệ Thống Blixalum", {});
                dialog.cont.add("[gold]=== TIẾN HÓA LÕI THÁP PHÁO BLIXALUM ===[]").padBottom(15).row();
                dialog.cont.label(packProv(() => {
                    let core = this.team.core(); if(core == null) return "[red]Không tìm thấy Kho cốt lõi![]";
                    let cCop = core.items.get(Items.copper); let cLea = core.items.get(Items.lead); let cTit = core.items.get(Items.titanium);
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" + 
                           "[cyan]Nhánh MK2:[] Copper: " + (cCop >= reqBlixalumMK2.copper ? "[green]" : "[red]") + cCop + "[]/" + reqBlixalumMK2.copper + " | Lead: " + (cLea >= reqBlixalumMK2.lead ? "[green]" : "[red]") + cLea + "[]/" + reqBlixalumMK2.lead + "\n" +
                           "[purple]Nhánh MK2B:[] Copper: " + (cCop >= reqBlixalumMK2B.copper ? "[green]" : "[red]") + cCop + "[]/" + reqBlixalumMK2B.copper + " | Lead: " + (cLea >= reqBlixalumMK2B.lead ? "[green]" : "[red]") + cLea + "[]/" + reqBlixalumMK2B.lead + " | Titanium: " + (cTit >= reqBlixalumMK2B.titanium ? "[green]" : "[red]") + cTit + "[]/" + reqBlixalumMK2B.titanium;
                })).padBottom(15).row();

                let branchesTable = new Table();
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12, 16, 12, 16);
                b1.add("[cyan]NHÁNH 1: QUÁ TẢI TỐC ĐỘ (MK2)[]").padBottom(4).row();
                let b1D = b1.add("[lightgray]Cải tiến lõi từ trường tăng tầm bắn phụ và đột biến giới hạn tốc hỏa.\n• [green]Gia tăng giới hạn:[] Đẩy mốc cộng dồn tốc độ bắn tối đa từ [yellow]100% lên 300%[] khi tầm quét dày đặc kẻ địch.");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqBlixalumMK2.copper && core.items.get(Items.lead) >= reqBlixalumMK2.lead){
                        core.items.remove(Items.copper, reqBlixalumMK2.copper); core.items.remove(Items.lead, reqBlixalumMK2.lead);
                        Fx.upgradeCore.at(this.x, this.y); this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(220, 40);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12, 16, 12, 16);
                b2.add("[purple]NHÁNH 2: MA TRẬN LAZE XUNG KÍCH (MK2B)[]").padBottom(4).row();
                let b2D = b2.add("[lightgray]Chuyển đổi sang lõi năng lượng hỗn hợp Laze phá hủy cao cơ động.\n• [orange]Hỏa lực gốc:[] Tăng mạnh sát thương gốc [green]+120%[] (300 DMG).\n• [red]Thu hẹp diện nổ:[] Giảm sát thương nổ lan xuống còn [yellow]50%[] gốc.\n• [cyan]Xung kích Laze thụ động:[] Cứ mỗi 5s chiến đấu, đồng loạt khai hỏa [yellow]4 tia laze vanilla[] quét thẳng mục tiêu.");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqBlixalumMK2B.copper && core.items.get(Items.lead) >= reqBlixalumMK2B.lead && core.items.get(Items.titanium) >= reqBlixalumMK2B.titanium){
                        core.items.remove(Items.copper, reqBlixalumMK2B.copper); core.items.remove(Items.lead, reqBlixalumMK2B.lead); core.items.remove(Items.titanium, reqBlixalumMK2B.titanium);
                        Fx.bigShockwave.at(this.x, this.y); this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(220, 40);

                branchesTable.add(b1).width(340); branchesTable.row(); branchesTable.add().height(15).row(); branchesTable.add(b2).width(340);
                dialog.cont.add(branchesTable); dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Tiến hóa công nghệ pháo Blixalum");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo(tier == 1 ? "[cyan]HỆ THỐNG ĐANG HOẠT ĐỘNG Ở CẤU CẤU HÌNH BLIXALUM MK2![]" : "[purple]HỆ THỐNG ĐANG HOẠT ĐỘNG Ở CẤU CẤU HÌNH BLIXALUM MK2B![]");
            })).size(50, 40).tooltip("Đã khóa nhánh tiến hóa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = "📊 THÔNG SỐ TRẠNG THÁI BLIXALUM: "; let currentTier = this.getTier(); let descStr = "";
            if (currentTier == 0 || currentTier == 1) {
                title += (currentTier == 0) ? "[lightgray]MK1 MẶC ĐỊNH[]" : "[cyan]MK2 TIẾN HÓA[]";
                // --- CHỈNH SỬA THÊM: Cập nhật text mô tả thông số UI từ 0.5s thành 1.0s ---
                descStr = "[accent]⚙️ CƠ CHẾ ĐẠN VÀ TỤ LỰC XÉ GIÓ:[]\n• Nòng pháo cần [yellow]2.0 giây đầu tiên[] tích tụ điện từ trường.\n• Phóng ra viên đạn vật lý có hiệu ứng vòng biến dạng giãn nở chuyển động chậm.\n• Giãn cách hỏa lực duy trì liên tục: [green]1.0 giây / phát bắn[].\n\n[orange]📈 TỐC ĐỘ HOẢ LỰC ĐỘNG:[]\n• Mỗi mục tiêu trong tầm bắn [green]+10% tốc độ bắn[].\n• Giới hạn tối đa: " + (currentTier == 1 ? "[green]+300% (MK2)[]" : "[yellow]+100% (MK1)[]") + ".";
            } else if (currentTier == 2) {
                title += "[purple]MK2B LAZE XUNG KÍCH[]";
                descStr = "[accent]⚙️ BIẾN THỂ MA TRẬN PHÁ HỦY HỖN HỢP:[]\n• Sát thương vật lý gốc tăng vọt: [green]300 DMG[] | Sát thương nổ lan hẹp: [red]150 DMG[].\n• Giới hạn tốc độ bắn động tối đa: [yellow]+80%[].\n• [pink]Đặc quyền laze:[] Trong giao tranh, cứ mỗi [cyan]5 giây[] pháo tự động nạp bắn song hành [orange]4 tia laze vanilla[] quét đám đông.";
            }
            let dialog = extend(BaseDialog, title, {}); let cell = dialog.cont.add(descStr).width(380);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left); dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem thông số chi tiết");
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
        this.super$updateTile();
        let tier = this.getTier();

        this.customRecoil = Mathf.lerpDelta(this.customRecoil, 0.0, 0.12);

        let hasEnemy = false;
        if (this.target != null) {
            hasEnemy = true;
        } else {
            hasEnemy = Units.closestTarget(this.team, this.x, this.y, this.range()) != null;
        }

        if (hasEnemy) {
            this.wingAnimation = Mathf.lerpDelta(this.wingAnimation, 1.0, 0.05);
        } else {
            this.wingAnimation = Mathf.lerpDelta(this.wingAnimation, 0.0, 0.04);
        }

        let enemyCount = 0; let currentRange = this.range();
        Units.nearbyEnemies(this.team, this.x - currentRange, this.y - currentRange, currentRange * 2, currentRange * 2, u => {
            if(u && !u.dead && this.dst(u) <= currentRange) enemyCount++;
        });
        let maxBonus = (tier == 1) ? 3.0 : ((tier == 2) ? 0.8 : 1.0); 
        this.dynamicSpeedBonus = 1.0 + Math.min(maxBonus, enemyCount * 0.1);

        if(this.isShooting() && this.hasAmmo()){
            this.reloadCounter += Time.delta * (this.dynamicSpeedBonus - 1.0) * this.efficiency;
            if(!this.isCharged){
                if(this.reloadCounter > 0) this.reloadCounter = 0; 
                this.chargeTimer += Time.delta * this.efficiency;
                if(this.chargeTimer >= 120) this.isCharged = true; 
            }
            if(tier == 2){
                this.laserTimer += Time.delta * this.efficiency;
                if(this.laserTimer >= 300){ this.laserTimer = 0; this.fireTier2BLasers(); }
            }
        } else {
            this.chargeTimer = Math.max(0, this.chargeTimer - Time.delta * 1.5);
            this.isCharged = false; this.laserTimer = 0;
        }
    },

    fireTier2BLasers(){
        if(this.target == null) return;
        let baseAngle = this.rotation; let targetAngle = Angles.angle(this.x, this.y, this.target.x, this.target.y);
        let localY = -5; let localXOffsets = [8, 3, -3, -8];
        for(let i = 0; i < localXOffsets.length; i++){
            let spawnX = this.x + Angles.trnsx(baseAngle, localY, localXOffsets[i]);
            let spawnY = this.y + Angles.trnsy(baseAngle, localY, localXOffsets[i]);
            blixalumLaser.create(this, this.team, spawnX, spawnY, targetAngle, 1.0, 1.0);
        }
    },

    shoot(type){
        if(!this.isCharged) return;
        let tier = this.getTier();
        let selectedBullet = (tier == 1) ? blixalumMK2Bullet : ((tier == 2) ? blixalumMK2BBullet : blixalumMK1Bullet);
        let spawnX = this.x + Angles.trnsx(this.rotation, 8);
        let spawnY = this.y + Angles.trnsy(this.rotation, 8);
        Call.createBullet(selectedBullet, this.team, spawnX, spawnY, this.rotation, selectedBullet.damage, selectedBullet.speed, 1.0);
        let tierColor = (tier == 1) ? Color.valueOf("#00ffff") : ((tier == 2) ? Color.valueOf("#33ddff") : Color.valueOf("#e5ff00"));
        blixalumMuzzleDistort.at(spawnX, spawnY, this.rotation, tierColor);

        this.customRecoil = 1.0;
    },

draw(){
        // Vẽ khối đế pháo
        if(blixalum.customBaseRegion != null && blixalum.customBaseRegion.found()){
            Draw.rect(blixalum.customBaseRegion, this.x, this.y);
        } else {
            Draw.rect(blixalum.baseRegion, this.x, this.y);
        }

        let sAngle = this.rotation; 
        let drawAngle = sAngle - 90;
        let anim = this.wingAnimation; // Giá trị chạy từ 0.0 -> 1.0 khi có địch

        // =================================================================
        // BẢNG ĐIỀU CHỈNH HOẠT ẢNH (BẠN TỰ DO THAY ĐỔI CÁC SỐ DƯỚI ĐÂY)
        // =================================================================
        // Số ÂM (-) = Di chuyển về SAU pháo | Số DƯƠNG (+) = Di chuyển về TRƯỚC pháo
        // Số DƯƠNG (+) đối với Side = Bung ra ngoài vế của nó | Số ÂM (-) = Thu vào tâm pháo
        
        // --- Nhóm w (Bên Phải) ---
        let w1_Back  = -5.0 * anim;   // w1: Chỉ di chuyển về sau pháo
        let w1_Side  = 0.0;
        
        let w2_Back  = -6.5 * anim;   // w2: Di chuyển về sau pháo...
        let w2_Side  = 1.5 * anim;    // ...và di chuyển sang PHẢI một tí (Trục Phải: sAngle - 90)

        // --- Nhóm wa (Bên Trái) ---
        let wa2_Back = -5.0 * anim;   // wa2: Chỉ di chuyển về sau pháo
        let wa2_Side = 0.0;
        
        let wa1_Back = -6.5 * anim;   // wa1: Di chuyển về sau pháo...
        let wa1_Side = 1.5 * anim;    // ...và di chuyển sang TRÁI một tí (Trục Trái: sAngle + 90)

        // --- Nhóm wing (Bên Phải) ---
        let wing1_Back = -2.0;
        let wing1_Side = 1.5 * anim;  // wing1: Chỉ di chuyển sang bên PHẢI
        
        let wing2_Back = 0.0 * anim; // wing2: Di chuyển về sau pháo một tí...
        let wing2_Side = 1.0 * anim;  // ...và di chuyển sang bên PHẢI

        // --- Nhóm winga (Bên Trái) ---
        let winga1_Back = 0.0;
        let winga1_Side = 1.0 * anim; // winga1: Chỉ di chuyển sang bên TRÁI
        
        let winga2_Back = -2.0 * anim; // winga2: Di chuyển về sau pháo một tí...
        let winga2_Side = 1.5 * anim;  // ...và di chuyển sang bên TRÁI

        // --- Nòng súng (Giật nòng khi bắn) ---
        let barrelRecoil = -7.5 * this.customRecoil;

        // =================================================================
        // XỬ LÝ TOÁN HỌC TỌA ĐỘ VỊ TRÍ (HẠN CHẾ SỬA KHU VỰC NÀY)
        // =================================================================
        
        // Nhóm cánh bên PHẢI (Sử dụng trục sAngle - 90 để dịch ngang sang phải)
        let w1X = this.x + Angles.trnsx(sAngle, w1_Back) + Angles.trnsx(sAngle - 90, w1_Side);
        let w1Y = this.y + Angles.trnsy(sAngle, w1_Back) + Angles.trnsy(sAngle - 90, w1_Side);
        
        let w2X = this.x + Angles.trnsx(sAngle, w2_Back) + Angles.trnsx(sAngle - 90, w2_Side);
        let w2Y = this.y + Angles.trnsy(sAngle, w2_Back) + Angles.trnsy(sAngle - 90, w2_Side);
        
        let wing1X = this.x + Angles.trnsx(sAngle, wing1_Back) + Angles.trnsx(sAngle - 90, wing1_Side);
        let wing1Y = this.y + Angles.trnsy(sAngle, wing1_Back) + Angles.trnsy(sAngle - 90, wing1_Side);
        
        let wing2X = this.x + Angles.trnsx(sAngle, wing2_Back) + Angles.trnsx(sAngle - 90, wing2_Side);
        let wing2Y = this.y + Angles.trnsy(sAngle, wing2_Back) + Angles.trnsy(sAngle - 90, wing2_Side);

        // Nhóm cánh bên TRÁI (Sử dụng trục sAngle + 90 để dịch ngang sang trái)
        let wa2X = this.x + Angles.trnsx(sAngle, wa2_Back) + Angles.trnsx(sAngle + 90, wa2_Side);
        let wa2Y = this.y + Angles.trnsy(sAngle, wa2_Back) + Angles.trnsy(sAngle + 90, wa2_Side);
        
        let wa1X = this.x + Angles.trnsx(sAngle, wa1_Back) + Angles.trnsx(sAngle + 90, wa1_Side);
        let wa1Y = this.y + Angles.trnsy(sAngle, wa1_Back) + Angles.trnsy(sAngle + 90, wa1_Side);
        
        let winga1X = this.x + Angles.trnsx(sAngle, winga1_Back) + Angles.trnsx(sAngle + 90, winga1_Side);
        let winga1Y = this.y + Angles.trnsy(sAngle, winga1_Back) + Angles.trnsy(sAngle + 90, winga1_Side);
        
        let winga2X = this.x + Angles.trnsx(sAngle, winga2_Back) + Angles.trnsx(sAngle + 90, winga2_Side);
        let winga2Y = this.y + Angles.trnsy(sAngle, winga2_Back) + Angles.trnsy(sAngle + 90, winga2_Side);

        // Vị trí nòng súng
        let btu1X = this.x + Angles.trnsx(sAngle, barrelRecoil);
        let btu1Y = this.y + Angles.trnsy(sAngle, barrelRecoil);

        // =================================================================
        // THỨ TỰ THỰC HIỆN VẼ LỚP (LAYER DRAWER)
        // =================================================================
        // Lớp dưới cùng: Vẽ nhóm cánh lớn (wing / winga) trước
        if(blixalum.wing2Region != null && blixalum.wing2Region.found()){ Draw.rect(blixalum.wing2Region, wing2X, wing2Y, drawAngle); }
        if(blixalum.winga2Region != null && blixalum.winga2Region.found()){ Draw.rect(blixalum.winga2Region, winga2X, winga2Y, drawAngle); }
        if(blixalum.wing1Region != null && blixalum.wing1Region.found()){ Draw.rect(blixalum.wing1Region, wing1X, wing1Y, drawAngle); }
        if(blixalum.winga1Region != null && blixalum.winga1Region.found()){ Draw.rect(blixalum.winga1Region, winga1X, winga1Y, drawAngle); }

        // Lớp giữa: Vẽ nhóm khớp nối nhỏ đè lên cánh lớn (w / wa)
        if(blixalum.w2Region != null && blixalum.w2Region.found()){ Draw.rect(blixalum.w2Region, w2X, w2Y, drawAngle); }
        if(blixalum.wa2Region != null && blixalum.wa2Region.found()){ Draw.rect(blixalum.wa2Region, wa2X, wa2Y, drawAngle); }
        if(blixalum.w1Region != null && blixalum.w1Region.found()){ Draw.rect(blixalum.w1Region, w1X, w1Y, drawAngle); }
        if(blixalum.wa1Region != null && blixalum.wa1Region.found()){ Draw.rect(blixalum.wa1Region, wa1X, wa1Y, drawAngle); }
        
        // Lớp nòng súng: Nằm dưới thân pháo chính
        if(blixalum.btu1Region != null && blixalum.btu1Region.found()){ Draw.rect(blixalum.btu1Region, btu1X, btu1Y, drawAngle); }
        
        // Lớp trên cùng: Thân pháo (Body) che khuất toàn bộ phần gốc
        if(blixalum.region != null && blixalum.region.found()){ Draw.rect(blixalum.region, this.x, this.y, drawAngle); }

        // Hiệu ứng tụ năng lượng bắn pháo (Giữ nguyên logic cũ)
        if(this.isShooting() && !this.isCharged && this.hasAmmo()){
            let progress = this.chargeTimer / 120; let inverseProgress = 1.0 - progress; 
            let muzzleX = this.x + Angles.trnsx(this.rotation, 10); let muzzleY = this.y + Angles.trnsy(this.rotation, 10);
            let tier = this.getTier();
            let glowColor = (tier == 1) ? Color.valueOf("#00ffff") : ((tier == 2) ? Color.valueOf("#33fcff") : Color.valueOf("#e1ff00"));

            Draw.draw(Layer.effect + 1, packRun(() => {
                let pulse = (0.8 + Mathf.absin(Time.time, 6.0, 0.2));
                drawBlixalumWindRing(muzzleX, muzzleY, 5.0 * pulse, 5.0 * pulse, this.rotation, 1.0, glowColor);

                if (inverseProgress > 0) {
                    let rX1 = 12.0 * inverseProgress * pulse; let rY1 = 12.0 * inverseProgress * pulse;
                    drawBlixalumWindRing(muzzleX, muzzleY, rX1, rY1, this.rotation + (Time.time * 2), 1.2 * inverseProgress, glowColor);
                    let rX2 = 18.0 * inverseProgress * pulse; let rY2 = 18.0 * inverseProgress * pulse;
                    drawBlixalumWindRing(muzzleX, muzzleY, rX2, rY2, this.rotation - (Time.time * 2), 0.8 * inverseProgress, Color.white);
                }
                Fill.circle(muzzleX, muzzleY, 2.0 * progress);
            }));
        }
    },

    write(write){ this.super$write(write); write.b(this.getTier()); },
    read(read, revision){ this.super$read(read, revision); this.setTier(read.b()); }
});