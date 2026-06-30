// =========================================================================
// 1. ĐỊNH NGHĨA HIỆU ỨNG ĐỒ HỌA (EFFECTS FX)
// =========================================================================
const laserAimColor = Color.valueOf("#ff8888"); 
const secondaryLaserAimColor = Color.valueOf("#ffaa00"); 
const bulletColor = Color.valueOf("#00ffff");   

const mainBulletHitFX = new Effect(18, e => {
    Draw.color(bulletColor, Color.white, e.fin());
    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 18);
    Angles.randLenVectors(e.id, 8, 26 * e.fin(), (x, y) => {
        Fill.circle(e.x + x, e.y + y, 2.0 * e.fout());
    });
    Draw.reset();
});

const muzzleFlashFX = new Effect(12, e => {
    Draw.color(bulletColor);
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 12);
    Draw.reset();
});

const shieldHitFX = new Effect(10, e => {
    Draw.color(bulletColor, Color.white, e.fin());
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * e.rotation); 
    Draw.reset();
});

// =========================================================================
// 2. CÁC HÀM ĐÓNG GÓI ĐỐI TƯỢNG JAVA (PACKERS)
// =========================================================================
const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqMK2 = { titanium: 4000, silicon: 4000, plastanium: 0 };
const reqMK2B = { titanium: 8800, silicon: 6400, plastanium: 4200 };

// =========================================================================
// 3. CÁC HÀM HOẠT ẢNH DRAWER
// =========================================================================
function drawExpandingBarrels(build) {
    if (build.animRecoil === undefined) build.animRecoil = 0;
    build.animRecoil = Mathf.lerpDelta(build.animRecoil, 0, 0.08);

    let openOffset = build.animRecoil * 12; 
    let baseAngle = build.rotation;

    Draw.z(Layer.turret + 0.1); 
    let spriteNames = ["holyderwing2", "holyderwing1", "holyderwing3", "holyderwing4"];

    for (let i = 0; i < 4; i++) {
        let angleOffset = 45 + (i * 90);
        let finalAngle = baseAngle + angleOffset;
        let drawX = build.x + Angles.trnsx(finalAngle, openOffset);
        let drawY = build.y + Angles.trnsy(finalAngle, openOffset);
        
        let region = Core.atlas.find("newex-" + spriteNames[i]);
        if (!region.found) region = Core.atlas.find(spriteNames[i]); 
        if (region.found) Draw.rect(region, drawX, drawY, baseAngle);
    }
    Draw.reset();
}

function drawGatlingRotation(build) {
    let rotationSpeed = 2.0 + (build.laserCharge * 0.18);
    let currentRotation = (Time.time * rotationSpeed) % 360;

    Draw.z(Layer.bullet + 1);
    Draw.color(Color.white);
    
    let gunX = build.x + Angles.trnsx(build.rotation, 11);
    let gunY = build.y + Angles.trnsy(build.rotation, 11);
    Fill.circle(gunX, gunY, 2.5); 

    Draw.color(bulletColor);
    for (let i = 0; i < 4; i++) {
        let orbitAngle = currentRotation + (i * 90);
        let muzzleX = gunX + Angles.trnsx(orbitAngle, 4.0);
        let muzzleY = gunY + Angles.trnsy(orbitAngle, 4.0);
        Fill.circle(muzzleX, muzzleY, 1.2); 
    }
    Draw.reset();
}

function drawHexagonAperture(build) {
    let scale = 1.0 - (build.lockTimer / 60 * 0.4);
    if (build.lockTimer == 0 && build.target != null) scale = 1.6;

    let apertureRadius = (7 * scale) * build.shieldVisualScale;
    let spinAngle = -Time.time * 1.5; 

    Draw.z(Layer.bullet + 1);
    Draw.color(bulletColor, 0.55);
    Lines.stroke(1.0);
    
    let gunX = build.x + Angles.trnsx(build.rotation, 13);
    let gunY = build.y + Angles.trnsy(build.rotation, 13);
    Lines.poly(gunX, gunY, 6, apertureRadius, spinAngle);
    Draw.reset();
}

// =========================================================================
// 4. ĐỊNH NGHĨA HỆ THỐNG ĐẠN
// =========================================================================
const holyderMainBullet = extend(BasicBulletType, {});
holyderMainBullet.speed = 35;             
holyderMainBullet.lifetime = 15;          
holyderMainBullet.width = 12;             
holyderMainBullet.height = 16;            
holyderMainBullet.frontColor = Color.white; 
holyderMainBullet.backColor = bulletColor;  
holyderMainBullet.hitEffect = mainBulletHitFX;
holyderMainBullet.despawnEffect = Fx.none;
holyderMainBullet.collides = true;
holyderMainBullet.collidesTiles = true;
holyderMainBullet.shrinkX = 0;            
holyderMainBullet.shrinkY = 0;

const holyderMainBulletMK2B = extend(BasicBulletType, {});
holyderMainBulletMK2B.speed = 35;             
holyderMainBulletMK2B.lifetime = 15;          
holyderMainBulletMK2B.width = 12;             
holyderMainBulletMK2B.height = 16;            
holyderMainBulletMK2B.frontColor = Color.white; 
holyderMainBulletMK2B.backColor = bulletColor;  
holyderMainBulletMK2B.hitEffect = mainBulletHitFX;
holyderMainBulletMK2B.despawnEffect = Fx.none;
holyderMainBulletMK2B.collides = true;
holyderMainBulletMK2B.collidesTiles = true;
holyderMainBulletMK2B.shrinkX = 0;            
holyderMainBulletMK2B.shrinkY = 0;
holyderMainBulletMK2B.pierce = false;         

const holyderSecondaryBullet = extend(BasicBulletType, {});
holyderSecondaryBullet.speed = 35;             
holyderSecondaryBullet.lifetime = 18;          
holyderSecondaryBullet.width = 8;             
holyderSecondaryBullet.height = 11;            
holyderSecondaryBullet.frontColor = Color.white; 
holyderSecondaryBullet.backColor = Color.valueOf("#ffaa00");  
holyderSecondaryBullet.hitEffect = Fx.hitBulletSmall;
holyderSecondaryBullet.despawnEffect = Fx.none;

const holyderlaser = extend(BulletType, {
    init(b) { if (b) b.remove(); },
    draw(b) {}
});
holyderlaser.speed = 0;
holyderlaser.lifetime = 1;

// =========================================================================
// 5. LOGIC BUILD CHUNG CHỨA HỆ THỐNG GIAO DIỆN NÂNG CẤP & THÔNG TIN
// =========================================================================
function makeBuildSetup(initialTier) {
    return {
        holyderInternalTier: initialTier,
        laserCharge: 0,
        lockTimer: 0,     
        shootCooldown: 0,       
        isNewTargetLocking: false, 
        secondaryTarget: null, 

        shieldHealth: 0,      
        maxShield: (initialTier == 3) ? 1000 : 9000,       
        shieldRadius: 32,     
        shieldActive: false,  
        shieldVisualScale: 0, 
        shieldHitTime: 0,     
        hexSize: 5,           
        
        regenTimer: 0,
        maxRegenCooldown: (initialTier == 3) ? 720 : 600, 
        isShieldBroken: false, 

        // Ngăn chặn người chơi điều khiển thủ công ở tầng Build
        canControl() {
            return false;
        },

        // --- BẮT ĐẦU LOGIC GIỚI HẠN BLOCK ĐẶT RA LÀ 4 ---
        placed() {
            this.super$placed();
            let count = 0;
            Groups.build.each(b => {
                if (b.block == holyder && b.team == this.team) count++;
            });
            if (count > 4) {
                Call.sendMessage("[red]Giới hạn: Mỗi đội chỉ được phép xây dựng tối đa 4 tháp pháo Holyder trên sân!");
                this.kill();
                return;
            }
        },
        // --- KẾT THÚC LOGIC GIỚI HẠN ---

        setTier(val) {
            this.holyderInternalTier = val;
            if (val == 1) {
                this.maxShield = 9000;
                this.health = 2500;
            } else if (val == 2) {
                this.maxShield = 9000;
                this.health = 3200;
            } else if (val == 3) {
                this.maxShield = 1000; 
                this.health = 4000;
            }
            this.shieldHealth = this.maxShield;
        },
        getTier() { return this.holyderInternalTier !== undefined ? this.holyderInternalTier : 1; },

        config() {
            return java.lang.Integer(this.getTier());
        },

        buildConfiguration(table) {
            table.clear(); table.row();
            let tier = this.getTier();

            if(tier == 1) {
                table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                    let dialog = extend(BaseDialog, "Nâng Cấp Chuỗi Hệ Thống Dor", {});
                    
                    let titleCell = dialog.cont.add("[purple]=== TIẾN HÓA LÕI THÁP PHÁO HOLYDER ===[]");
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
                               "[cyan]Nhánh MK2:[] Titanium: " + titColor1 + reqMK2.titanium + "[]/" + currentTitanium + " | Silicon: " + silColor1 + reqMK2.silicon + "\n" +
                               "[green]Nhánh MK2B:[] Titanium: " + titColor2 + reqMK2B.titanium + "[]/" + currentTitanium + " | Silicon: " + silColor2 + reqMK2B.silicon + " | Plastanium: " + plaColor2 + reqMK2B.plastanium;
                    }));
                    labelCell.row(); labelCell.padBottom(20);

                    let branchesTable = new Table();

                    let b1 = new Table(); b1.background(Styles.black6); b1.margin(12, 16, 12, 16);
                    b1.add("[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]").row(); b1.add().height(6).row();
                    
                    let b1D = b1.add("[lightgray]Máu tăng 3200 (+28%). Tầm bắn mở rộng lên 340.\nTăng giới hạn tích điểm xung kích cực đại lên [yellow]200%[].\nTự động nạp hỏa lực bắn thêm mục tiêu phụ ngẫu nhiên với [orange]50% sát thương đạn chính[].[]");
                    b1D.width(340); b1D.get().setWrap(true); b1D.get().setAlignment(Align.left);
                    b1D.row(); b1.add().height(10).row();
                    
                    b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                        let core = this.team.core();
                        if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                            core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                            Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                            this.configure(java.lang.Integer(2)); 
                            dialog.hide(); this.deselect();
                        } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                    })).size(200, 40);

                    let b2 = new Table(); b2.background(Styles.black6); b2.margin(12, 16, 12, 16);
                    b2.add("[green]BIẾN THỂ TRỌNG PHÁO GIÁP (MK2B)[]").row(); b2.add().height(6).row();
                    
                    let b2D = b2.add("[lightgray]Máu siêu gia cố 4000 (+60%). Tầm bắn cực đại 360.\nGiới hạn sạc điểm giảm xuống mốc [yellow]50%[] giúp xả đạn nhanh.\nĐặc tính Quá Tải: Khi trường khiên vỡ, tốc độ sạc và chu kỳ hồi nạp xả kích của pháo [orange]tăng đột biến lên 500%[].[]");
                    b2D.width(340); b2D.get().setWrap(true); b2D.get().setAlignment(Align.left);
                    b2D.row(); b2.add().height(10).row();
                    
                    b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                        let core = this.team.core();
                        if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                            core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                            Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                            this.configure(java.lang.Integer(3)); 
                            dialog.hide(); this.deselect();
                        } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                    })).size(200, 40);

                    branchesTable.add(b1).width(340); branchesTable.row();
                    let spaceCell = branchesTable.add(); spaceCell.height(15); spaceCell.row();
                    branchesTable.add(b2).width(340);
                    dialog.cont.add(branchesTable);

                    dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip("Tiến hóa tháp pháo Holyder");
            } else {
                table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                    Vars.ui.showInfo("[scarlet]HỆ THỐNG ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA CỦA NHÁNH ĐÃ CHỌN![]");
                })).size(50, 40).tooltip("Đã đạt cấp tối đa");
            }

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = "📊 THÔNG SỐ PHÁO HOLYDER: ";
                let descStr = "";
                let currentTier = this.getTier();

                if (currentTier == 1) {
                    title += "[yellow]Cấu hình trạng thái gốc (MK1)[]";
                    descStr = "[accent]🛡️ Chỉ số cơ bản:[] Máu hệ thống: [lightgray]2,500 HP[] (Quy cách 3x3) | Sát thương gốc: [purple]380 Sát thương thô / viên[]\n" +
                              "[orange]📌 Giới hạn xây dựng:[] Không giới hạn số lượng đặt tháp pháo trên sân đội\n" +
                              "[sky]⚡ Phương thức vận hành:[] Tầm bắn hiệu dụng: [lightgray]320[] | Loại mục tiêu bắn: [lightgray]Chỉ mặt đất[] | Cơ chế khóa mục tiêu bằng tia laser định vị đỏ trước khi sạc hỏa lực\n" +
                              "[lime]⚙️ Cơ chế đặc biệt:[] Tích hợp trường năng lượng khiên bảo vệ hấp thụ sát thương [teal]9,000 HP[] (Thời gian tự động tái khởi động lõi khiên là 10 giây sau khi bị phá vỡ).";
                } 
                else if (currentTier == 2) {
                    title += "[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]";
                    descStr = "[accent]🛡️ Chỉ số cơ bản:[] Máu hệ thống: [lightgray]3,200 HP [yellow](+28%)[] | Sát thương chính: [purple]380[] + [orange]50% sát thương đạn chính từ nòng phụ[]\n" +
                              "[orange]📌 Giới hạn xây dựng:[] Không giới hạn số lượng đặt tháp pháo trên sân đội\n" +
                              "[sky]⚡ Phương thức vận hành:[] Tầm bắn mở rộng: [lightgray]340[] | Loại mục tiêu bắn: [lightgray]Chỉ mặt đất[] | Giới hạn tích lũy điểm xung kích cực đại tăng vọt lên mức [yellow]200%[]\n" +
                              "[lime]⚙️ Cơ chế đặc biệt:[] Duy trì trường khiên [teal]9,000 HP[]. Kích hoạt thêm nòng phụ hỏa lực gia tốc, tự động bắn hỗ trợ ngẫu nhiên vào 1 mục tiêu phụ lân cận.";
                } 
                else if (currentTier == 3) {
                    title += "[green]BIẾN THỂ TRỌNG PHÁO GIÁP (MK2B)[]";
                    descStr = "[accent]🛡️ Chỉ số cơ bản:[] Máu siêu gia cố: [lightgray]4,000 HP [yellow](+60%)[] | Sát thương nạp hỏa lực xung kích tối đa cực đại\n" +
                              "[orange]📌 Giới hạn xây dựng:[] Không giới hạn số lượng đặt tháp pháo trên sân đội\n" +
                              "[sky]⚡ Phương thức vận hành:[] Tầm bắn cực đại: [lightgray]360[] | Loại mục tiêu bắn: [lightgray]Chỉ mặt đất[] | Giới hạn sạc điểm giảm xuống mốc [yellow]50%[] hỗ trợ xả đạn thần tốc\n" +
                              "[lime]⚙️ Cơ chế đặc biệt:[] Lõi khiên năng lượng giảm tải còn [purple]1,000 HP[] (Hồi khiên sau 12s vỡ). Khi khiên vỡ, kích hoạt Mạch Quá Tải (Overloaded) tăng mạnh tốc độ sạc và chu kỳ nạp đạn tháp pháo lên [orange]500%[] (Gấp 5 lần bình thường).";
                }

                let dialog = extend(BaseDialog, title, {});
                let cell = dialog.cont.add(descStr).width(360);
                cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Xem chi tiết thông số trạng thái");
        },

        updateTile() {
            if (!this.enabled) return;

            let tier = this.getTier();
            this.maxShield = (tier == 3) ? 1000 : 9000; 

            if (this.shieldHitTime > 0) this.shieldHitTime -= Time.delta;
            
            if (this.shootCooldown > 0) {
                if (tier == 3 && this.isShieldBroken) {
                    this.shootCooldown -= Time.delta * 5.0; 
                } else {
                    this.shootCooldown -= Time.delta;
                }
            }

            if (this.isShieldBroken) {
                this.regenTimer += Time.delta;
                if (this.regenTimer >= this.maxRegenCooldown) {
                    this.isShieldBroken = false;
                    this.shieldActive = true;
                    this.shieldHealth = (tier == 3) ? 200 : 1000; 
                    this.regenTimer = 0;
                }
            }

            if (this.power != null && this.power.status > 0) {
                let currentTarget = Units.closestTarget(this.team, this.x, this.y, this.block.range, u => u && !u.dead && !u.isFlying(), b => b && !b.dead);

                if (currentTarget != null && !currentTarget.dead) {
                    if (this.target !== currentTarget) {
                        this.target = currentTarget;
                        this.isNewTargetLocking = true;
                    }

                    this.turnToTarget(currentTarget);

                    if (tier == 2) {
                        this.secondaryTarget = Units.closestTarget(this.team, this.x, this.y, this.block.range, 
                            u => u && !u.dead && u !== currentTarget && !u.isFlying(), 
                            b => b && !b.dead && b !== currentTarget
                        );
                    } else {
                        this.secondaryTarget = null;
                    }

                    if (!this.shieldActive && !this.isShieldBroken) {
                        this.shieldActive = true;
                        if (this.shieldHealth <= 0) this.shieldHealth = (tier == 3) ? 200 : 1000;
                    }

                    if (this.shieldActive && this.shieldHealth > 0 && !this.isShieldBroken) {
                        this.shieldVisualScale = Math.min(this.shieldVisualScale + Time.delta * 0.08, 1.0);
                    } else {
                        this.shieldVisualScale = Math.max(this.shieldVisualScale - Time.delta * 0.08, 0);
                    }

                    let maxCharge = (tier == 2) ? 200 : ((tier == 3) ? 50 : 100); 
                    
                    let chargeSpeed = (tier == 3 && this.isShieldBroken) ? 5.0 : 1.0;
                    this.laserCharge = Math.min(this.laserCharge + (Time.delta / 60) * 10 * chargeSpeed, maxCharge);
                    
                    if (Mathf.chance(0.12)) {
                        Fx.lightningCharge.at(this.x + Mathf.range(6), this.y + Mathf.range(6), bulletColor);
                    }

                    if (this.shootCooldown <= 0) {
                        this.isNewTargetLocking = false;
                        
                        if (tier == 3 && this.isShieldBroken) {
                            this.lockTimer += Time.delta * 5.0; 
                        } else {
                            this.lockTimer += Time.delta;
                        }

                        let requiredLockTime = 60; 

                        if (this.lockTimer >= requiredLockTime) { 
                            this.lockTimer = 0; 
                            this.shootCooldown = 60; 

                            this.animRecoil = 1.0; 
                            this.recoil = 1.0; 

                            let angle = Angles.angle(this.x, this.y, currentTarget.x, currentTarget.y);
                            let baseDamage = 380; 
                            let damageMultiplier = 1 + (this.laserCharge / 100); 
                            let finalDamage = baseDamage * damageMultiplier;

                            let bulletType = (tier == 3) ? holyderMainBulletMK2B : holyderMainBullet;
                            let bullet = bulletType.create(this, this.team, this.x, this.y, angle);
                            if (bullet != null) bullet.damage = finalDamage; 

                            if (tier == 2 && this.secondaryTarget != null) {
                                let subAngle = Angles.angle(this.x, this.y, this.secondaryTarget.x, this.secondaryTarget.y);
                                let subBullet = holyderSecondaryBullet.create(this, this.team, this.x, this.y, subAngle);
                                if (subBullet != null) subBullet.damage = finalDamage * 0.5; 
                            }

                            if (this.shieldActive && !this.isShieldBroken && this.shieldHealth > 0) {
                                this.shieldHealth = Math.min(this.shieldHealth + 450, this.maxShield);
                            }

                            muzzleFlashFX.at(this.x, this.y);
                            Effect.shake(2.5 + (this.laserCharge / 30), 2.5 + (this.laserCharge / 30), this.x, this.y);
                        }
                    } else {
                        this.lockTimer = 0;
                    }
                } else {
                    this.resetTargetsAndCharge();
                }
            } else {
                this.resetTargetsAndCharge();
            }

            if (this.shieldActive && this.shieldHealth > 0 && !this.isShieldBroken) {
                let currentRadius = this.shieldRadius * this.shieldVisualScale;
                Groups.bullet.intersect(this.x - currentRadius, this.y - currentRadius, currentRadius * 2, currentRadius * 2, new Cons({
                    get: b => {
                        if (b.team != this.team && b.type != null && Mathf.dst(this.x, this.y, b.x, b.y) <= currentRadius) {
                            this.shieldHealth -= b.damage;
                            this.shieldHitTime = 6; 
                            shieldHitFX.at(b.x, b.y, currentRadius);
                            b.remove();

                            if (this.shieldHealth <= 0) {
                                this.shieldHealth = 0;
                                this.shieldActive = false;
                                this.isShieldBroken = true; 
                                this.regenTimer = 0;
                                Fx.shieldBreak.at(this.x, this.y, currentRadius, bulletColor);
                            }
                        }
                    }
                }));
            }
        },

        resetTargetsAndCharge() {
            this.target = null;
            this.secondaryTarget = null;
            this.isNewTargetLocking = false; 
            this.laserCharge = Math.max(this.laserCharge - (Time.delta / 60) * 15, 0);
            this.lockTimer = 0;
            this.shieldActive = false;
            this.shieldVisualScale = Math.max(this.shieldVisualScale - Time.delta * 0.05, 0);
        },

        draw() {
            this.super$draw();
            let tier = this.getTier();
            
            if (this.target != null && !this.target.dead && this.laserCharge > 0 && !this.isNewTargetLocking) {
                let currentTarget = this.target;
                Draw.z(Layer.bullet + 1);
                let finalThinStroke = 0.2 + Mathf.absin(Time.time, 2.5, 0.05);

                Draw.color(laserAimColor);
                Lines.stroke(finalThinStroke);
                Lines.line(this.x, this.y, currentTarget.x, currentTarget.y);

                if (tier == 2 && this.secondaryTarget != null && !this.secondaryTarget.dead) {
                    Draw.color(secondaryLaserAimColor);
                    Lines.stroke(finalThinStroke * 0.8); 
                    Lines.line(this.x, this.y, this.secondaryTarget.x, this.secondaryTarget.y);
                }
                Draw.reset();
            }

            if (this.shieldVisualScale > 0 && this.shieldHealth > 0 && !this.isShieldBroken) {
                Draw.z(Layer.bullet + 2); 
                let currentRadius = this.shieldRadius * this.shieldVisualScale;
                Draw.color(bulletColor, 0.12 + Mathf.absin(Time.time, 3.0, 0.04));
                Fill.circle(this.x, this.y, currentRadius);
                
                let hSpacing = this.hexSize * 1.5;
                let vSpacing = this.hexSize * Math.sqrt(3);
                let minX = Math.floor((this.x - currentRadius) / hSpacing) - 1;
                let maxX = Math.ceil((this.x + currentRadius) / hSpacing) + 1;
                let minY = Math.floor((this.y - currentRadius) / vSpacing) - 1;
                let maxY = Math.ceil((this.y + currentRadius) / vSpacing) + 1;
                
                for (let i = minX; i <= maxX; i++) {
                    for (let j = minY; j <= maxY; j++) {
                        let checkX = i * hSpacing;
                        let checkY = j * vSpacing + ((i % 2 === 0) ? 0 : vSpacing / 2);
                        if (Math.floor(Mathf.dst(this.x, this.y, checkX, checkY)) < currentRadius - 1) {
                            let edgeFade = (1.0 - (Mathf.dst(this.x, this.y, checkX, checkY) / currentRadius));
                            let hexAlpha = (0.35 + Mathf.absin(Time.time, 4.0, 0.1)) * edgeFade;
                            Draw.color(this.shieldHitTime > 0 ? Color.white : bulletColor, hexAlpha * (this.shieldHitTime > 0 ? 1.5 : 1));
                            Lines.stroke(0.8);
                            Lines.poly(checkX, checkY, 6, this.hexSize * this.shieldVisualScale);
                        }
                    }
                }
                Draw.color(this.shieldHitTime > 0 ? Color.white : bulletColor, 0.7);
                Lines.stroke(1.2);
                Lines.circle(this.x, this.y, currentRadius);
                Draw.reset();
            }

            if (this.laserCharge > 0) {
                drawExpandingBarrels(this);  
                drawGatlingRotation(this);   
                drawHexagonAperture(this);   
            }

            if (this.laserCharge > 0) {
                Draw.z(Layer.effect + 10);
                Draw.color(Color.white);
                let font = Fonts.outline;
                font.getData().setScale(0.12);
                
                let textCharge = Math.floor(this.laserCharge) + "%";
                font.draw(textCharge, this.x, this.y, Align.center);
                
                let barWidth = 28;

                if (this.isShieldBroken) {
                    let timeLeft = Math.ceil((this.maxRegenCooldown - this.regenTimer) / 60);
                    let textShield = "[scarlet]OVERLOADED (5x ATK):[] " + timeLeft + "s";
                    font.draw(textShield, this.x, this.y - 20, Align.center);
                    
                    let progress = this.regenTimer / this.maxRegenCooldown;
                    Draw.color(Color.black, 0.5); Lines.stroke(3);
                    Lines.line(this.x - barWidth/2, this.y - 28, this.x + barWidth/2, this.y - 28);
                    Draw.color(Color.cyan, 0.7); Lines.stroke(2);
                    Lines.line(this.x - barWidth/2, this.y - 28, this.x - barWidth/2 + (barWidth * progress), this.y - 28);
                } 
                else if (this.shieldHealth > 0) {
                    let progress = this.shieldHealth / this.maxShield;
                    Draw.color(Color.black, 0.5); Lines.stroke(3);
                    Lines.line(this.x - barWidth/2, this.y - 28, this.x + barWidth/2, this.y - 28);
                    Draw.color(bulletColor); Lines.stroke(2);
                    Lines.line(this.x - barWidth/2, this.y - 28, this.x - barWidth/2 + (barWidth * progress), this.y - 28);
                }
                Draw.reset();
            }
        },

        write(write) {
            this.super$write(write);
            write.b(this.getTier());
        },
        read(read, revision) {
            this.super$read(read, revision);
            this.setTier(read.b());
        }
    };
}

// =========================================================================
// 6. KHỞI TẠO BLOCK CỐT LÕI
// =========================================================================
const holyder = extend(PowerTurret, "holyder", {
    init() { this.super$init(); },
    setBars() { this.super$setBars(); }
});

holyder.health = 2500;
holyder.size = 3;
holyder.range = 320;
holyder.reload = 9999;           
holyder.shootType = holyderlaser;
holyder.consumePower(15);
holyder.targetAir = false;       
holyder.targetGround = true;
holyder.configurable = true; 

// Ngăn chặn người chơi thủ công nhập vào điều khiển tháp pháo ở cấp Block
holyder.canControl = false;

// ĐỒNG BỘ TUYỆT ĐỐI THEO FILE DOR.JS: Nhận dạng chuẩn Integer từ Java Core gửi xuống
holyder.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

holyder.buildType = () => extend(PowerTurret.PowerTurretBuild, holyder, makeBuildSetup(1));