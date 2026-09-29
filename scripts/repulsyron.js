// =======================================================
// REPULSYRON - IRON MAN UNIBEAM / REPULSOR LASER TURRET
// =======================================================

// Hiệu ứng tia va chạm chuẩn (Hit Effect)
const customUnibeamHit = new Effect(14, e => {
    Draw.color(Color.white, Color.valueOf("#00c8ff"), e.fin());
    Lines.stroke(e.fout() * 2.2);
    Lines.circle(e.x, e.y, e.fin() * 14);
    Angles.randLenVectors(e.id, 5, e.fin() * 16, (x, y) => {
        Lines.lineAngle(e.x + x, e.y + y, Mathf.angle(x, y), e.fout() * 5);
    });
});

// Hiệu ứng Overload quá tải khi bắn lâu (Sát thương Max HP)
const overloadHitEffect = new Effect(20, e => {
    Draw.color(Color.valueOf("#ff0055"), Color.valueOf("#ff99bb"), e.fin());
    Lines.stroke(e.fout() * 3);
    Lines.circle(e.x, e.y, e.fin() * 26);
    Angles.randLenVectors(e.id, 8, e.fin() * 30, (x, y) => {
        Fill.circle(e.x + x, e.y + y, e.fout() * 3.5);
    });
});

// Hiệu ứng khói bốc ra từ nòng pháo khi đang nguội (Cooldown 5s)
const cooldownSmoke = new Effect(40, e => {
    Draw.color(Color.gray, Color.darkGray, e.fout());
    Angles.randLenVectors(e.id, 2, e.fin() * 14, e.rotation, 30, (x, y) => {
        Fill.circle(e.x + x, e.y + y, e.fout() * 3.2);
    });
});

// =======================================================
// HÀM QUẢN LÝ ẨN/HIỆN MENU XÂY DỰNG THEO SỐ LƯỢNG LÕI
// =======================================================
function updateRepulsyronVisibility() {
    const repulsyronBlock = Vars.content.block("newex-repulsyron") || Vars.content.block("repulsyron");
    if (!Vars.player || !repulsyronBlock) return;

    let playerTeam = Vars.player.team();
    let maxAllowed = playerTeam.cores().size;  
    
    let currentCount = 0;
    Groups.build.each(b => {
        if (b.block === repulsyronBlock && b.team === playerTeam) {
            currentCount++;
        }
    });

    if (currentCount < maxAllowed) {
        repulsyronBlock.buildVisibility = BuildVisibility.shown;
    } else {
        repulsyronBlock.buildVisibility = BuildVisibility.hidden;
    }
}

Events.on(ContentInitEvent, () => {
    let repulsyron = Vars.content.block("newex-repulsyron") || Vars.content.block("repulsyron");
    if (!repulsyron) return;

    repulsyron.buildType = () => extend(PowerTurret.PowerTurretBuild, repulsyron, {
        beamProgress: 0,      // Tiến trình vươn tia từ nòng tới mục tiêu (0.2s = 12 ticks)
        damageTimer: 0,       // Bộ đếm thời gian gây sát thương (mỗi 0.1s = 6 ticks)
        firingTimer: 0,       // Bộ đếm thời gian bắn liên tục trên 1 mục tiêu (ticks)
        fadeProgress: 0,      // Tiến trình thu hồi tia khi ngắt/mục tiêu chết
        chargeTimer: 0,       // Bộ đếm thời gian tụ lực trước khi bắn (0.5s = 30 ticks)
        cooldownTimer: 0,     // Bộ đếm thời gian làm nguội pháo (5s = 300 ticks)
        
        isCharging: false,
        isFiring: false,
        isFading: false,
        
        lockedTarget: null,   // Khóa mục tiêu duy nhất đến khi tiêu diệt
        
        startX: 0, startY: 0,
        endX: 0, endY: 0,
        fadeStartX: 0, fadeStartY: 0,
        fadeEndX: 0, fadeEndY: 0,

        updateTile() {
            this.super$updateTile();

            let muzzleX = this.x + Angles.trnsx(this.rotation, repulsyron.size * 4);
            let muzzleY = this.y + Angles.trnsy(this.rotation, repulsyron.size * 4);

            // 1. XỬ LÝ NGUỘI PHÁO (COOLDOWN 5s) & TẠO KHÓI Ở NÒNG
            if (this.cooldownTimer > 0) {
                this.cooldownTimer -= Time.delta;
                if (Mathf.chance(0.25)) {
                    cooldownSmoke.at(muzzleX, muzzleY, this.rotation);
                }
            }

            // Hàm kiểm tra mục tiêu hợp lệ
            let isTargetValid = (t) => {
                if (t == null) return false;
                let isDead = (typeof t.dead === "function") ? t.dead() : t.dead;
                let hp = (typeof t.health === "function") ? t.health() : t.health;
                if (isDead || hp <= 0) return false;
                return this.within(t, repulsyron.range);
            };

            // Sticky Targeting: Giữ mục tiêu duy nhất
            if (this.lockedTarget != null && isTargetValid(this.lockedTarget)) {
                this.target = this.lockedTarget;
            } else if (this.lockedTarget != null) {
                this.stopFiringAndStartFade(muzzleX, muzzleY);
                this.lockedTarget = null;
            }

            // Chỉ tụ lực / bắn khi đã nguội hoàn toàn (cooldownTimer <= 0)
            if (this.isShooting && this.efficiency > 0 && this.cooldownTimer <= 0) {
                let currentTarget = this.target;

                if (currentTarget != null && isTargetValid(currentTarget)) {
                    // Đổi mục tiêu mới -> Reset trạng thái
                    if (this.lockedTarget !== currentTarget) {
                        this.lockedTarget = currentTarget;
                        this.beamProgress = 0;
                        this.firingTimer = 0;
                        this.damageTimer = 0;
                        this.chargeTimer = 0;
                    }

                    // 2. PHA 1: TỤ LỰC TRONG 0.5s (30 TIKCS)
                    if (this.chargeTimer < 30) {
                        this.isCharging = true;
                        this.isFiring = false;
                        this.chargeTimer += Time.delta;
                    } else {
                        // 3. PHA 2: BẮN TIA LASER
                        this.isCharging = false;
                        this.isFiring = true;
                        this.isFading = false;

                        this.firingTimer += Time.delta;

                        // Vươn tia laser trong 0.2s (12 ticks)
                        if (this.beamProgress < 1.0) {
                            this.beamProgress = Math.min(1.0, this.beamProgress + (Time.delta / 12));
                        }

                        this.startX = muzzleX;
                        this.startY = muzzleY;

                        let realTargetX = currentTarget.getX();
                        let realTargetY = currentTarget.getY();

                        this.endX = Mathf.lerp(this.startX, realTargetX, this.beamProgress);
                        this.endY = Mathf.lerp(this.startY, realTargetY, this.beamProgress);

                        // Gây sát thương mỗi 0.1s (6 ticks)
                        this.damageTimer += Time.delta;
                        if (this.damageTimer >= 6) {
                            this.damageTimer = 0;

                            let secondsFired = this.firingTimer / 60;
                            let damageMultiplier = 1 + (secondsFired * 0.15);
                            let baseDamage = 20 * this.efficiency * damageMultiplier;

                            // Bắn > 10s -> Tăng dần % Max HP gây thêm
                            let maxHpBonus = 0;
                            let maxHp = 0;
                            if (typeof currentTarget.maxHealth === "function") {
                                maxHp = currentTarget.maxHealth();
                            } else if (currentTarget.maxHealth != undefined) {
                                maxHp = currentTarget.maxHealth;
                            }

                            if (secondsFired >= 10 && maxHp > 0) {
                                maxHpBonus = maxHp * 0.01 * this.efficiency;
                            }

                            let totalDamage = baseDamage + maxHpBonus;

                            if (currentTarget.damage != null) {
                                currentTarget.damage(totalDamage);
                            } else if (Damage != null) {
                                Damage.damage(this.team, this.endX, this.endY, 8, totalDamage);
                            }

                            if (secondsFired >= 10) {
                                overloadHitEffect.at(this.endX, this.endY);
                            } else {
                                customUnibeamHit.at(this.endX, this.endY);
                            }
                        }
                    }
                } else {
                    this.stopFiringAndStartFade(muzzleX, muzzleY);
                }
            } else {
                this.stopFiringAndStartFade(muzzleX, muzzleY);
            }

            // 4. XỬ LÝ THU HỒI TIA LASER CHÍNH XÁC (KHÔNG BỊ LỆCH NÒNG PHÁO)
            if (this.isFading) {
                this.fadeProgress += Time.delta / 12; // Thu hồi tia trong 0.2s
                
                this.startX = Mathf.lerp(this.fadeStartX, this.fadeEndX, this.fadeProgress);
                this.startY = Mathf.lerp(this.fadeStartY, this.fadeEndY, this.fadeProgress);
                this.endX = this.fadeEndX;
                this.endY = this.fadeEndY;

                if (this.fadeProgress >= 1.0) {
                    this.isFading = false;
                    this.beamProgress = 0;
                    this.fadeProgress = 0;
                    this.firingTimer = 0;
                }
            }
        },

        stopFiringAndStartFade(muzzleX, muzzleY) {
            if (this.isFiring || this.isCharging) {
                // Kích hoạt Cooldown 5s mỗi khi ngắt bắn hoặc đổi mục tiêu
                if (this.isFiring) {
                    this.cooldownTimer = 300; 
                }
                
                this.isFiring = false;
                this.isCharging = false;
                this.isFading = true;
                this.fadeProgress = 0;
                this.damageTimer = 0;
                this.chargeTimer = 0;

                // Khóa điểm bắt đầu và kết thúc chuẩn xác để lerp không bị lệch
                this.fadeStartX = muzzleX;
                this.fadeStartY = muzzleY;
                this.fadeEndX = this.endX;
                this.fadeEndY = this.endY;
            }
        },

        draw() {
            this.super$draw();

            let muzzleX = this.x + Angles.trnsx(this.rotation, repulsyron.size * 4);
            let muzzleY = this.y + Angles.trnsy(this.rotation, repulsyron.size * 4);

            // A. VẼ HIỆU ỨNG TỤ LỰC Ở NÒNG PHÁO (0.5s)
            if (this.isCharging) {
                let chargeRatio = Mathf.clamp(this.chargeTimer / 30);
                Draw.z(Layer.bullet + 2);
                Draw.color(Color.valueOf("#00e1ff"), Color.white, chargeRatio);
                Fill.circle(muzzleX, muzzleY, chargeRatio * 5);
                Lines.stroke((1 - chargeRatio) * 3);
                Lines.circle(muzzleX, muzzleY, (1 - chargeRatio) * 16);
                Draw.reset();
            }

            // B. VẼ TIA LASER & CÁC HIỆU ỨNG ĐI KÈM
            if ((this.isFiring || this.isFading) && (this.beamProgress > 0)) {
                Draw.z(Layer.bullet + 2);

                let secondsFired = this.firingTimer / 60;

                // Kích thước tăng dần theo thời gian
                let sizeScale = 1 + Math.min(1.8, secondsFired * 0.12);

                // 5. ĐỔI MÀU TỪ TỪ TỪ XANH DƯƠNG SANG HỒNG NEON (Trong khoảng từ 2s -> 10s)
                let colorFactor = Mathf.clamp((secondsFired - 2) / 8); 
                let cOuter = Color.valueOf("#0077ff").cpy().lerp(Color.valueOf("#ff0055"), colorFactor);
                let cMid   = Color.valueOf("#00e1ff").cpy().lerp(Color.valueOf("#ff66aa"), colorFactor);
                let cInner = Color.white;

                let alpha = this.isFading ? (1.0 - this.fadeProgress) : 1.0;

                let outerWidth = 7.5 * sizeScale;
                let midWidth   = 4.0 * sizeScale;
                let innerWidth = 1.8 * sizeScale;

                // 1. Lớp hào quang ngoài
                Draw.color(cOuter);
                Draw.alpha(alpha * 0.6);
                Lines.stroke(outerWidth);
                Lines.line(this.startX, this.startY, this.endX, this.endY);
                Fill.circle(this.startX, this.startY, outerWidth * 0.5);
                Fill.circle(this.endX, this.endY, outerWidth * 0.5);

                // 6. DÂY NĂNG LƯỢNG VÀ HẠT PHOTON XUẤT HIỆN TỪ TỪ (Fade in mượt từ 0s -> 3s)
                let effectProgress = Mathf.clamp(secondsFired / 3.0); 

                if (effectProgress > 0 && this.isFiring) {
                    let len = Mathf.len(this.endX - this.startX, this.endY - this.startY);
                    let angle = Mathf.angle(this.endX - this.startX, this.endY - this.startY);
                    let segments = Math.floor(len / 8);

                    // Vẽ 2 dây năng lượng xoắn với độ đậm tăng từ từ
                    Draw.color(cMid);
                    Draw.alpha(alpha * 0.85 * effectProgress);
                    Lines.stroke(1.6 * sizeScale * effectProgress);

                    for (let side = -1; side <= 1; side += 2) {
                        let prevX = this.startX;
                        let prevY = this.startY;

                        for (let i = 1; i <= segments; i++) {
                            let progress = i / segments;
                            let px = Mathf.lerp(this.startX, this.endX, progress);
                            let py = Mathf.lerp(this.startY, this.endY, progress);

                            let wave = Mathf.sinDeg(Time.time * 14 + progress * 360) * (7 * sizeScale * effectProgress) * side;
                            let wx = px + Angles.trnsx(angle + 90, wave);
                            let wy = py + Angles.trnsy(angle + 90, wave);

                            Lines.line(prevX, prevY, wx, wy);
                            prevX = wx;
                            prevY = wy;
                        }
                    }

                    // 7. VẼ HẠT PHOTON VỚI KÍCH THƯỚC NGẪU NHIÊN CỐ ĐỊNH CHO MỖI HẠT
                    Draw.color(cInner);
                    let photonCount = Math.floor(14 * effectProgress);
                    for (let p = 0; p < photonCount; p++) {
                        let pTime = ((Time.time * 0.05 + p / 14) % 1.0);
                        let px = Mathf.lerp(this.startX, this.endX, pTime);
                        let py = Mathf.lerp(this.startY, this.endY, pTime);
                        let offset = Mathf.sinDeg(Time.time * 20 + p * 50) * (5 * sizeScale);
                        
                        let fx = px + Angles.trnsx(angle + 90, offset);
                        let fy = py + Angles.trnsy(angle + 90, offset);

                        // Kích thước ngẫu nhiên theo chỉ số p (từ 0.6x đến 1.5x)
                        let randomFactor = 0.6 + ((p * 17) % 10) / 10.0 * 0.9;
                        let pSize = 1.4 * sizeScale * randomFactor;

                        Draw.alpha(alpha * 0.9 * effectProgress);
                        Fill.circle(fx, fy, pSize);
                    }
                }

                // Lớp thân giữa
                Draw.color(cMid);
                Draw.alpha(alpha * 0.85);
                Lines.stroke(midWidth);
                Lines.line(this.startX, this.startY, this.endX, this.endY);
                Fill.circle(this.startX, this.startY, midWidth * 0.5);
                Fill.circle(this.endX, this.endY, midWidth * 0.5);

                // Lõi năng lượng trắng
                Draw.color(cInner);
                Draw.alpha(alpha);
                Lines.stroke(innerWidth);
                Lines.line(this.startX, this.startY, this.endX, this.endY);
                Fill.circle(this.startX, this.startY, innerWidth * 0.5);
                Fill.circle(this.endX, this.endY, innerWidth * 0.5);

                Draw.reset();
            }
        }
    });
});

// =======================================================
// XỬ LÝ SỰ KIỆN QUẢN LÝ GIỚI HẠN VÀ TỰ HỦY REPUlSYRON
// =======================================================
Events.on(WorldLoadEvent, event => {
    Time.run(10, () => {
        updateRepulsyronVisibility();
    });
});

Events.on(BlockBuildEndEvent, event => {
    updateRepulsyronVisibility();
});

Events.on(BlockDestroyEvent, event => {
    const repulsyronBlock = Vars.content.block("newex-repulsyron") || Vars.content.block("repulsyron");
    if (!repulsyronBlock) return;

    let destroyedTile = event.tile;
    if (!destroyedTile || !destroyedTile.build) return;

    let destroyedBuild = destroyedTile.build;
    let victimTeam = destroyedBuild.team;

    if (destroyedBuild.block instanceof CoreBlock) {
        let teamData = victimTeam.data();
        let maxAllowed = teamData.cores.size - 1;
        if (maxAllowed < 0) maxAllowed = 0;

        let teamBlocks = [];
        Groups.build.each(b => {
            if (b.block === repulsyronBlock && b.team === victimTeam) {
                teamBlocks.push(b);
            }
        });

        if (teamBlocks.length > maxAllowed) {
            let toDestroy = teamBlocks.length - maxAllowed;
            for (let i = 0; i < toDestroy; i++) {
                let lastBlock = teamBlocks.pop();
                Call.sendMessage("[red]Đội " + victimTeam.name + " bị mất Lõi! Pháo Repulsyron thừa đã tự hủy![]");
                lastBlock.kill();
            }
        }
    }

    updateRepulsyronVisibility();
});