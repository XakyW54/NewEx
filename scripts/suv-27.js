// 1. Hàm yêu cầu tài nguyên nâng cấp
function getSuv27UpgradeRequirements(currentLevel) {
    return {
        leadNeeded: 340 + (currentLevel * 100),
        siliconNeeded: 400 + (currentLevel * 120),
        leadItem: Items.lead,
        siliconItem: Items.silicon
    };
}

// 2. EFFECT LỬA & KHÓI ĐUÔI TỰ ĐỘNG THAY ĐỔI THEO CHẾ ĐỘ
const dynamicEngineTrailEffect = new Effect(45, e => {
    let isRapid = (e.rotation == 0); // 0: Liên thanh (Vàng/Cam), 1: Tên lửa (Xanh)

    let flameColor = isRapid ? Color.valueOf("ffd37f") : Color.valueOf("66b1ff");
    let smokeFrom = isRapid ? Color.valueOf("ffaa44cc") : Color.valueOf("66b1ffcc");
    let smokeTo = Color.valueOf("55555511");

    Draw.draw(Layer.effect, () => {
        let angleRot = e.data; 
        let progress = e.fin();

        // Tia lửa năng lượng đuôi
        let flameLen = (isRapid ? 16 : 12) * e.fout();
        let fx = e.x + Angles.trnsx(angleRot + 180, flameLen);
        let fy = e.y + Angles.trnsy(angleRot + 180, flameLen);

        Lines.stroke(2.0 * e.fout());
        Draw.color(flameColor, Color.white, progress);
        Lines.line(e.x, e.y, fx, fy);

        // Hạt khói xả đuôi
        let pProgress = Interp.circleOut.apply(progress);
        let size = Mathf.lerp(3.0, 0.4, Interp.pow5In.apply(progress));
        let randAngle = angleRot + 180 + Mathf.range(10);
        let dist = (isRapid ? 28 : 20) * pProgress;

        let px = e.x + Angles.trnsx(randAngle, dist);
        let py = e.y + Angles.trnsy(randAngle, dist);

        Draw.color(smokeFrom, smokeTo, progress);
        Fill.circle(px, py, size);
    });
});

// 3. EFFECT DOUBLE-CLICK CHUYỂN CHẾ ĐỘ
const modeSwitchEffect = new Effect(25, e => {
    let isRapidMode = (e.rotation == 0);
    let mainColor = isRapidMode ? Color.valueOf("ffd37f") : Color.valueOf("66b1ff");
    let secColor = isRapidMode ? Color.valueOf("ff8833") : Color.valueOf("ffffff");

    Draw.color(mainColor, secColor, e.fin());
    Lines.stroke(3.0 * e.fout());

    Draw.draw(Layer.effect, () => {
        Lines.circle(e.x, e.y, 35 * e.finpow());
        
        for (let i = 0; i < 4; i++) {
            let angle = (i * 90) + (e.fin() * 45);
            let rad = angle * Mathf.degRad;
            let len = 40 * e.finpow();
            Lines.line(
                e.x + Math.cos(rad) * 10, e.y + Math.sin(rad) * 10,
                e.x + Math.cos(rad) * len, e.y + Math.sin(rad) * len
            );
        }
    });
});

// EFFECT DUY TRÌ XUNG QUANH
const missileWaveEffect = new Effect(30, e => {
    let unit = (e.data != null && e.data instanceof Unit) ? e.data : null;
    let px = (unit != null) ? unit.x : e.x;
    let py = (unit != null) ? unit.y : e.y;

    Draw.color(Color.valueOf("66b1ff"), Color.valueOf("ffffff"), e.fout());
    Lines.stroke(1.5 * e.fout());
    
    Draw.draw(Layer.effect, () => {
        Lines.circle(px, py, 20 * e.finpow());
    });
});

const rapidQuadOrbitEffect = new Effect(40, e => {
    let unit = (e.data != null && e.data instanceof Unit) ? e.data : null;
    let px = (unit != null) ? unit.x : e.x;
    let py = (unit != null) ? unit.y : e.y;

    Draw.color(Color.valueOf("ffd37f"), Color.valueOf("ffffff"), e.fout());

    Draw.draw(Layer.effect, () => {
        let orbitRadius = 14; 
        let spinDirection = (e.rotation != 0) ? e.rotation : 1; 
        let currentAngle = (e.fin() * 360 * spinDirection) + (e.id % 360);
        let rad = currentAngle * Mathf.degRad;

        let ox = px + Math.cos(rad) * orbitRadius;
        let oy = py + Math.sin(rad) * orbitRadius;

        Fill.rect(ox, oy, 3 * e.fout(), 3 * e.fout(), currentAngle);
    });
});

// Đạn vật lý liên thanh (Chỉ dùng riêng cho Chế độ 0)
const physicalBullet = extend(BasicBulletType, {
    speed: 7.5,
    damage: 18,
    width: 3,
    height: 9,
    lifetime: 35,
    shootEffect: Fx.shootSmall,
    smokeEffect: Fx.none,
    frontColor: Color.valueOf("ffffff"),
    backColor: Color.valueOf("ffd37f")
});

// 4. LOGIC CHÍNH SUV-27
Events.on(ClientLoadEvent, () => {
    let suv27Unit = Vars.content.getByName(ContentType.unit, "newex-suv-27");
    if (suv27Unit == null) suv27Unit = Vars.content.getByName(ContentType.unit, "suv-27");

    if (suv27Unit != null) {
        suv27Unit.constructor = () => {
            return extend(Packages.mindustry.gen.UnitEntity, {
                isGalileoJS: true,     
                level: 0,              
                maxLevel: 10,          
                leadAbsorbed: 0,       
                siliconAbsorbed: 0,    
                
                weaponMode: 1,          // Mặc định ban đầu Chế độ 1: Bắn Tên Lửa Chuẩn
                lastClickTime: 0,       
                
                continuousFiringTimer: 0, 
                buffTimer: 0,             
                cooldownTimer: 0,         
                rapidFireShootTimer: 0,   

                ambientEffectTimer: 0,
                engineTrailTimer: 0,

                update() {
                    this.super$update();

                    // === 1. DOUBLE-CLICK ĐỔI CHẾ ĐỘ ===
                    if (Vars.player != null && Vars.player.unit() == this) {
                        if (Core.input.justTouched()) {
                            let now = Time.millis();
                            if (now - this.lastClickTime < 350) {
                                this.weaponMode = (this.weaponMode == 0) ? 1 : 0;
                                
                                this.continuousFiringTimer = 0;
                                this.buffTimer = 0;
                                this.cooldownTimer = 0;

                                modeSwitchEffect.at(this.x, this.y, this.weaponMode);

                                let modeName = (this.weaponMode == 0) ? "[yellow]Chế độ: Súng Liên Thanh" : "[cyan]Chế độ: Tên Lửa";
                                Vars.ui.hudfrag.showToast(modeName);
                            }
                            this.lastClickTime = now;
                        }
                    }

                    // === 2. ĐIỀU KHIỂN NÒNG BẮN THEO CHẾ ĐỘ ===
                    if (this.mounts.length > 0) {
                        for (let i = 0; i < this.mounts.length; i++) {
                            let mount = this.mounts[i];
                            
                            // Nếu không phải nòng ContinuousFlameBulletType ở đuôi
                            if (!(mount.weapon.bullet instanceof ContinuousFlameBulletType)) {
                                if (this.weaponMode == 0) {
                                    // Ở Chế độ liên thanh: Khóa nòng tên lửa hjson lại không cho tự bắn
                                    mount.reload = mount.weapon.reload;
                                }
                                // Ở Chế độ 1: Không can thiệp, để nòng tên lửa tự hoạt động theo file .hjson
                            }
                        }
                    }

                    // === 3. XỬ LÝ LỬA & KHÓI ĐUÔI DI CHUYỂN ===
                    if (this.moving() || this.vel.len() > 0.1) {
                        let trailDelay = (this.weaponMode == 0) ? 2 : 4; 
                        
                        this.engineTrailTimer += Time.delta;
                        if (this.engineTrailTimer >= trailDelay) {
                            this.engineTrailTimer = 0;
                            
                            let tailX = this.x + Angles.trnsx(this.rotation - 180, 3.5);
                            let tailY = this.y + Angles.trnsy(this.rotation - 180, 3.5);

                            dynamicEngineTrailEffect.at(tailX, tailY, this.weaponMode, this.rotation);
                        }
                    }

                    // === 4. HIỆU ỨNG DUY TRÌ ===
                    this.ambientEffectTimer += Time.delta;
                    if (this.weaponMode == 1) {
                        if (this.ambientEffectTimer >= 60) {
                            this.ambientEffectTimer = 0;
                            missileWaveEffect.at(this.x, this.y, 0, this);
                        }
                    } else {
                        if (this.ambientEffectTimer >= 30) {
                            this.ambientEffectTimer = 0;
                            let randomDir = Mathf.chance(0.5) ? 1 : -1;
                            rapidQuadOrbitEffect.at(this.x, this.y, randomDir, this);
                        }
                    }

                    // === 5. LOGIC BẮN LIÊN THANH (CHỈ CHẠY KHI Ở CHẾ ĐỘ 0) ===
                    if (this.weaponMode == 0) {
                        if (this.cooldownTimer > 0) {
                            this.cooldownTimer -= Time.delta;
                        } else {
                            if (this.isShooting) {
                                if (this.buffTimer > 0) {
                                    this.buffTimer -= Time.delta;
                                    this.fireRapidBullet(2); 
                                } else {
                                    this.continuousFiringTimer += Time.delta;
                                    this.fireRapidBullet(6);

                                    if (this.continuousFiringTimer >= 300) {
                                        this.continuousFiringTimer = 0;
                                        this.buffTimer = 120; 
                                        Fx.overdriveWave.at(this.x, this.y);
                                    }
                                }
                            } else {
                                if (this.buffTimer > 0) {
                                    this.buffTimer -= Time.delta;
                                    if (this.buffTimer <= 0) this.cooldownTimer = 180;
                                } else if (this.continuousFiringTimer > 0) {
                                    this.continuousFiringTimer = Math.max(0, this.continuousFiringTimer - Time.delta * 1.5);
                                }
                            }

                            if (this.buffTimer <= 0 && this.continuousFiringTimer >= 300) {
                                this.continuousFiringTimer = 0;
                                this.cooldownTimer = 180; 
                                Fx.fireSmoke.at(this.x, this.y);
                            }
                        }
                    }

                    // === 6. CƠ CHẾ NÂNG CẤP BẰNG TÀI NGUYÊN ===
                    let req = getSuv27UpgradeRequirements(this.level);
                    if (this.level < this.maxLevel && this.stack != null) {
                        if (this.leadAbsorbed < req.leadNeeded && this.stack.item == req.leadItem && this.stack.amount > 0) {
                            let consumeAmt = Math.min(2, this.stack.amount);
                            this.stack.amount -= consumeAmt;
                            this.leadAbsorbed += consumeAmt;
                        }
                        else if (this.siliconAbsorbed < req.siliconNeeded && this.stack.item == req.siliconItem && this.stack.amount > 0) {
                            let consumeAmt = Math.min(2, this.stack.amount);
                            this.stack.amount -= consumeAmt;
                            this.siliconAbsorbed += consumeAmt;
                        }

                        if (this.leadAbsorbed >= req.leadNeeded && this.siliconAbsorbed >= req.siliconNeeded) {
                            this.leadAbsorbed = 0;
                            this.siliconAbsorbed = 0;
                            this.level++;
                            
                            Fx.upgradeCore.at(this.x, this.y);
                            Fx.shockwave.at(this.x, this.y);
                        }
                    }
                },

                fireRapidBullet(delayTicks) {
                    this.rapidFireShootTimer += Time.delta;
                    if (this.rapidFireShootTimer >= delayTicks) {
                        this.rapidFireShootTimer = 0;

                        let offset = 4;
                        for (let side of [-1, 1]) {
                            let bx = this.x + Angles.trnsx(this.rotation - 90 * side, offset);
                            let by = this.y + Angles.trnsy(this.rotation - 90 * side, offset);

                            physicalBullet.create(this, this.team, bx, by, this.rotation + Mathf.range(2));
                        }
                    }
                },

                maxHealth() {
                    return suv27Unit.health * (1.0 + (this.level * 0.20));
                },

                speed() {
                    return suv27Unit.speed * (1.0 + (this.level * 0.08));
                }
            });
        };
    }
});