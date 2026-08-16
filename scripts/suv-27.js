// 1. Hàm tính toán tài nguyên nâng cấp theo Cấp độ
function getSuv27UpgradeRequirements(currentLevel) {
    return {
        leadNeeded: 340 + (currentLevel * 100),
        siliconNeeded: 400 + (currentLevel * 120),
        leadItem: Items.lead,
        siliconItem: Items.silicon
    };
}

const doubleTapInterval = 250; 
const TRANSFORM_DELAY = 60;    
const TRANSFORM_COOLDOWN = 180; 

// Biến lưu mẫu loại đạn Shotgun cho SUV-27
let suvShotgunBulletType = null;

// 2. Hàm hoán đổi Unit (Giữ nguyên % máu đã mất & Cooldown)
function transformToUnit(oldUnit, targetUnitName, remainingCooldown) {
    let targetType = Vars.content.getByName(ContentType.unit, "newex-" + targetUnitName);
    if (targetType == null) targetType = Vars.content.getByName(ContentType.unit, targetUnitName);

    if (targetType == null || !oldUnit.isValid()) return;

    let newUnit = targetType.create(oldUnit.team);
    newUnit.set(oldUnit.x, oldUnit.y);
    newUnit.rotation = oldUnit.rotation;

    // Tính tỷ lệ % máu còn lại
    let maxH = oldUnit.maxHealth;
    let healthPercent = maxH > 0 ? (oldUnit.health / maxH) : 1.0;
    newUnit.health = newUnit.maxHealth * healthPercent;

    let player = Vars.player;
    let isPlayerControlling = (player != null && player.unit() == oldUnit);

    newUnit.add();

    if (newUnit.setCooldown) {
        newUnit.setCooldown(remainingCooldown);
    }

    oldUnit.remove();

    if (isPlayerControlling) {
        player.unit(newUnit);
    }
}

// Hàm xả đạn Shotgun khi SUV-27 dừng đột ngột (ĐÃ FIX LỖI TEXTURE NULL)
function fireSUVShotgun(unit) {
    if (suvShotgunBulletType == null) return;

    let bulletCount = Math.floor(Mathf.random(12, 16)); 
    for (let i = 0; i < bulletCount; i++) {
        // Tỏa đạn 20 độ (-10 đến +10 độ)
        let spreadAngle = unit.rotation + Mathf.range(10);
        // Lifetime ngẫu nhiên tối đa 1s (24 đến 60 ticks)
        let customLifetime = Mathf.random(24, 60);

        let b = suvShotgunBulletType.create(unit, unit.team, unit.x, unit.y, spreadAngle);
        if (b != null) {
            b.lifetime = customLifetime;
        }
    }
}

// 3. Logic chung cho cả 2 dạng Unit
function applyTransformLogic(unitEntity, uType, targetUnitName, isSUV) {
    return {
        isGalileoJS: true,     
        level: 0,              
        maxLevel: 10,          
        leadAbsorbed: 0,       
        siliconAbsorbed: 0,    
        lastClickTime: 0,       
        
        transformTimer: 0,     
        transformCooldown: 0,  

        firingDuration: 0,     
        overdriveTimer: 0,    

        flightAccelTimer: 0,
        wasMoving: false,

        setCooldown(cd) {
            this.transformCooldown = cd;
        },

        getCooldown() {
            return this.transformCooldown;
        },

        update() {
            this.super$update();

            if (this.transformCooldown > 0) {
                this.transformCooldown -= Time.delta;
            }

            if (this.transformTimer > 0) {
                this.transformTimer -= Time.delta;
                this.vel.set(0, 0);

                if (this.transformTimer <= 0) {
                    this.transformTimer = 0;
                    transformToUnit(this, targetUnitName, this.transformCooldown);
                    return;
                }
            }

            // Bắn 2s -> Buff 1500% tốc bắn trong 1s
            if (this.isShooting) {
                if (this.overdriveTimer <= 0) {
                    this.firingDuration += Time.delta;
                    if (this.firingDuration >= 120) { 
                        this.overdriveTimer = 60;      
                        this.firingDuration = 0;
                    }
                }
            } else {
                this.firingDuration = Math.max(0, this.firingDuration - Time.delta * 2);
            }

            if (this.overdriveTimer > 0) {
                this.overdriveTimer -= Time.delta;
                
                if (this.mounts != null && this.mounts.length > 0) {
                    for (let i = 0; i < this.mounts.length; i++) {
                        let mount = this.mounts[i];
                        if (mount.reload > 0) {
                            mount.reload = Math.max(0, mount.reload - (Time.delta * 15.0));
                        }
                    }
                }
            }

            // Dành riêng cho SUV-27: Bay tăng tốc & Dừng xả shotgun
            if (isSUV) {
                let isCurrentlyMoving = this.moving() || (this.vel != null && this.vel.len() > 0.2);

                if (isCurrentlyMoving) {
                    this.flightAccelTimer = Math.min(180, this.flightAccelTimer + Time.delta);
                    this.wasMoving = true;
                } else {
                    if (this.wasMoving && this.flightAccelTimer > 30) {
                        fireSUVShotgun(this);
                    }
                    this.flightAccelTimer = 0;
                    this.wasMoving = false;
                }
            }

            // Kích hoạt biến hình bằng Double Tap
            if (Vars.player != null && Vars.player.unit() == this) {
                if (Core.input.justTouched()) {
                    let now = Time.millis();
                    if (now - this.lastClickTime < doubleTapInterval) {
                        if (this.transformCooldown <= 0 && this.transformTimer <= 0) {
                            if (isSUV && this.flightAccelTimer > 30) {
                                fireSUVShotgun(this);
                            }
                            this.transformTimer = TRANSFORM_DELAY;
                            this.transformCooldown = TRANSFORM_COOLDOWN;
                        }
                    }
                    this.lastClickTime = now;
                }
            }

            // Tự động hút Chì & Silicon trong kho hàng để nâng cấp
            let req = getSuv27UpgradeRequirements(this.level);
            if (this.level < this.maxLevel && this.stack != null) {
                if (this.leadAbsorbed < req.leadNeeded && this.stack.item == req.leadItem && this.stack.amount > 0) {
                    let consumeAmt = Math.min(2, this.stack.amount);
                    this.stack.amount -= consumeAmt;
                    this.leadAbsorbed += consumeAmt;
                } else if (this.siliconAbsorbed < req.siliconNeeded && this.stack.item == req.siliconItem && this.stack.amount > 0) {
                    let consumeAmt = Math.min(2, this.stack.amount);
                    this.stack.amount -= consumeAmt;
                    this.siliconAbsorbed += consumeAmt;
                }

                if (this.leadAbsorbed >= req.leadNeeded && this.siliconAbsorbed >= req.siliconNeeded) {
                    this.leadAbsorbed = 0;
                    this.siliconAbsorbed = 0;
                    this.level++;
                }
            }
        },

        draw() {
            this.super$draw();

            if (this.transformTimer > 0) {
                let progress = 1.0 - (this.transformTimer / TRANSFORM_DELAY);
                let scale = Math.sin(progress * Math.PI);
                let maxRadius = 26 * scale;

                Draw.z(Layer.effect + 0.1);

                Draw.color(Color.valueOf("c084fc"));
                Lines.stroke(3.0 * scale);
                Lines.circle(this.x, this.y, maxRadius + 2.0);

                Draw.color(Color.valueOf("7e22ce"));
                Fill.circle(this.x, this.y, maxRadius);

                Draw.color(Color.black);
                Fill.circle(this.x, this.y, maxRadius * 0.60);

                Draw.reset();
            }
        },

        maxHealth() {
            return uType.health * (1.0 + (this.level * 0.20));
        },

        speed() {
            let baseSpeed = uType.speed * (1.0 + (this.level * 0.08));
            if (isSUV) {
                let accelBonus = (this.flightAccelTimer / 180.0) * 2.0; // Tối đa +200%
                return baseSpeed * (1.0 + accelBonus);
            }
            return baseSpeed;
        }
    };
}

// 4. Lắng nghe sự kiện Client Load
Events.on(ClientLoadEvent, () => {
    // Khởi tạo mẫu đạn Shotgun bằng cách copy từ đạn Flare (Đảm bảo đầy đủ Texture/Sprite)
    let flareType = Vars.content.getByName(ContentType.unit, "flare");
    if (flareType != null && flareType.weapons.size > 0) {
        suvShotgunBulletType = flareType.weapons.get(0).bullet.copy();
        suvShotgunBulletType.damage = 20;
        suvShotgunBulletType.speed = 5.5;
        suvShotgunBulletType.lifetime = 60;
        suvShotgunBulletType.width = 7;
        suvShotgunBulletType.height = 10;
        suvShotgunBulletType.frontColor = Color.white;
        suvShotgunBulletType.backColor = Color.valueOf("c084fc");
    }

    let suvNames = ["suv-27", "newex-suv-27"];
    let vusNames = ["vus-27", "newex-vus-27"];

    suvNames.forEach(name => {
        let uType = Vars.content.getByName(ContentType.unit, name);
        if (uType != null) {
            uType.health = 780;
            uType.constructor = () => extend(Packages.mindustry.gen.UnitEntity, applyTransformLogic(this, uType, "vus-27", true));
        }
    });

    vusNames.forEach(name => {
        let uType = Vars.content.getByName(ContentType.unit, name);
        if (uType != null) {
            uType.health = 24000;
            uType.constructor = () => extend(Packages.mindustry.gen.LegsUnit, applyTransformLogic(this, uType, "suv-27", false));

            if (uType.weapons.size >= 2) {
                let wLeft = uType.weapons.get(0);
                wLeft.reload = 10;
                if (flareType != null && flareType.weapons.size > 0) {
                    let bLeft = flareType.weapons.get(0).bullet.copy();
                    bLeft.damage = 25;
                    bLeft.speed = 6.5;
                    bLeft.lifetime = 35;
                    bLeft.frontColor = Color.white;
                    bLeft.backColor = Color.valueOf("c084fc");
                    wLeft.bullet = bLeft;
                }

                let wRight = uType.weapons.get(1);
                wRight.reload = 72;
                let bRight = new LaserBulletType(160);
                bRight.length = 240;
                bRight.width = 20;
                bRight.colors = [Color.valueOf("7e22ce"), Color.valueOf("c084fc"), Color.white];
                wRight.bullet = bRight;
            }
        }
    });
});