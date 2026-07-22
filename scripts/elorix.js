// ==================== ELORIX.JS (FIXED DASH DIRECTION) ====================

function getElorixUpgradeRequirements(currentLevel) {
    return {
        copperNeeded: 500,
        titaniumNeeded: 200,
        copperItem: Items.copper,
        titaniumItem: Items.titanium
    };
}

const acidCorrosionEffect = new Effect(30, cons(e => {
    Draw.color(Color.valueOf("#a3e635"), Color.valueOf("#65a30d"), e.fin());
    Lines.stroke(e.fout() * 2);
    Mathf.rand.setSeed(e.id);
    for(let i = 0; i < 5; i++){
        let len = Mathf.rand.random(2, 14) * e.fin();
        let angle = Mathf.rand.random(360);
        let size = Mathf.rand.random(1, 4) * e.fout();
        Lines.circle(e.x + Angles.trnsx(angle, len), e.y + Angles.trnsy(angle, len), size);
    }
}));

const elorixBullets = [
    extend(BasicBulletType, {
        speed: 8.5, damage: 15, width: 7, height: 18, lifetime: 38,
        frontColor: Color.valueOf("#ffab40"), backColor: Color.valueOf("#ff6d00"), 
        trailColor: Color.valueOf("#ff6d00"), trailWidth: 1.5, trailLength: 5,
        splashDamage: 12, splashDamageRadius: 24, knockback: 1.2, statusDuration: 140,
        hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion, status: StatusEffects.blasted
    }),
    extend(BasicBulletType, {
        speed: 8.5, damage: 15, width: 7, height: 18, lifetime: 38,
        frontColor: Color.valueOf("#ffa726"), backColor: Color.valueOf("#f57c00"), 
        trailColor: Color.valueOf("#f57c00"), trailWidth: 1.5, trailLength: 5,
        splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
        hitEffect: Fx.melting, despawnEffect: Fx.melting, status: StatusEffects.melting
    }),
    extend(BasicBulletType, {
        speed: 8.5, damage: 15, width: 7, height: 18, lifetime: 38,
        frontColor: Color.valueOf("#ff7043"), backColor: Color.valueOf("#d84315"), 
        trailColor: Color.valueOf("#d84315"), trailWidth: 1.5, trailLength: 5,
        splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
        hitEffect: Fx.fire, despawnEffect: Fx.fire, status: StatusEffects.burning
    }),
    extend(BasicBulletType, {
        speed: 8.5, damage: 15, width: 7, height: 18, lifetime: 38,
        frontColor: Color.valueOf("#29b6f6"), backColor: Color.valueOf("#0288d1"), 
        trailColor: Color.valueOf("#0288d1"), trailWidth: 1.5, trailLength: 5,
        splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
        hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.freezing
    }),
    extend(BasicBulletType, {
        speed: 8.5, damage: 15, width: 7, height: 18, lifetime: 38,
        frontColor: Color.valueOf("#e1bee7"), backColor: Color.valueOf("#ba68c8"), 
        trailColor: Color.valueOf("#ba68c8"), trailWidth: 1.5, trailLength: 5,
        splashDamage: 12, splashDamageRadius: 24, knockback: 0.5, statusDuration: 140,
        hitEffect: Fx.lightning, despawnEffect: Fx.lightning, status: StatusEffects.shocked
    }),
    extend(BasicBulletType, {
        speed: 8.7, damage: 13, width: 6.5, height: 17, lifetime: 38,
        frontColor: Color.valueOf("#60a5fa"), backColor: Color.valueOf("#2563eb"), 
        trailColor: Color.valueOf("#2563eb"), trailWidth: 1.4, trailLength: 5,
        splashDamage: 10, splashDamageRadius: 24, knockback: 0.6, statusDuration: 180,
        hitEffect: Fx.freezing, despawnEffect: Fx.freezing, status: StatusEffects.wet
    }),
    extend(BasicBulletType, {
        speed: 8.3, damage: 16, width: 7, height: 17, lifetime: 38,
        frontColor: Color.valueOf("#bef264"), backColor: Color.valueOf("#65a30d"), 
        trailColor: Color.valueOf("#65a30d"), trailWidth: 1.5, trailLength: 6,
        splashDamage: 14, splashDamageRadius: 26, knockback: 0.3, statusDuration: 160,
        hitEffect: acidCorrosionEffect, despawnEffect: acidCorrosionEffect, status: StatusEffects.corroded
    })
];

function fireShotgunBurst(unit, mount, customSound) {
    let statMultiplier = 1.0 + (unit.level * 0.05);
    let wx = unit.x + Angles.trnsx(unit.rotation, mount.weapon.x, mount.weapon.y);
    let wy = unit.y + Angles.trnsy(unit.rotation, mount.weapon.x, mount.weapon.y);
    let baseAngle = unit.rotation + mount.rotation;

    unit.armorRecoil = 6.0;

    if (customSound != null) {
        customSound.at(wx, wy);
    }

    for (let i = 0; i < 35; i++) {
        let spread = (Math.random() - 0.5) * 12.0; 
        let randomIndex = Math.floor(Math.random() * elorixBullets.length);
        let selectedBullet = elorixBullets[randomIndex];
        
        let b = selectedBullet.create(unit, unit.team, wx, wy, baseAngle + spread);
        if (b != null) {
            b.damage = 15 * statMultiplier;
            b.vel.scl(1 + (Math.random() - 0.5) * 0.2);
        }
    }
}

let elorixLastTapTime = 0;
const elorixDoubleTapInterval = 250; 
let elorixStarSpeedsMap = new ObjectMap();

function getElorixStarSpeeds(unitId, currentLevel) {
    let speeds = elorixStarSpeedsMap.get(unitId);
    if (speeds == null) {
        speeds = [];
        elorixStarSpeedsMap.put(unitId, speeds);
    }
    while (speeds.length <= currentLevel) {
        speeds.push(1.2 + Math.random() * 2.3);
    }
    return speeds;
}

function drawElorixStar4C(x, y, radius, rotation) {
    for(let i = 0; i < 4; i++) {
        let angle = rotation + (i * 90);
        let x1 = x + Angles.trnsx(angle, radius); let y1 = y + Angles.trnsy(angle, radius);
        let x2 = x + Angles.trnsx(angle + 45, radius * 0.3); let y2 = y + Angles.trnsy(angle + 45, radius * 0.3);
        Lines.line(x1, y1, x2, y2);
        let x3 = x + Angles.trnsx(angle - 45, radius * 0.3); let y3 = y + Angles.trnsy(angle - 45, radius * 0.3);
        Lines.line(x1, y1, x3, y3);
    }
}

let elorixWing1Region = null;
let elorixWing2Region = null;
let thinArmorRegion = null;

Events.on(ClientLoadEvent, () => {
    elorixWing1Region = Core.atlas.find("newex-elorix-wing1");
    elorixWing2Region = Core.atlas.find("newex-elorix-wing2");
    if(elorixWing1Region == null || !elorixWing1Region.found()){ elorixWing1Region = Core.atlas.find("elorix-wing1"); }
    if(elorixWing2Region == null || !elorixWing2Region.found()){ elorixWing2Region = Core.atlas.find("elorix-wing2"); }

    thinArmorRegion = Core.atlas.find("newex-thin-armor");
    if(thinArmorRegion == null || !thinArmorRegion.found()){ thinArmorRegion = Core.atlas.find("thin-armor"); }

    let elorixUnit = Vars.content.getByName(ContentType.unit, "newex-elorix");
    if(elorixUnit == null) elorixUnit = Vars.content.getByName(ContentType.unit, "elorix");

    if(elorixUnit != null){
        let minalSound = Vars.tree.loadSound("minal");

        let jsWeapon = extend(Weapon, "elorix-weapon", {
            reload: 180,
            x: 0,
            y: 0,
            shootSound: Sounds.none,
            rotate: true,
            mirror: false,
            top: false,
            
            bullet: extend(BasicBulletType, {
                speed: 0, damage: 0, lifetime: 0, width: 0, height: 0,
                shootEffect: Fx.none, smokeEffect: Fx.none, hitEffect: Fx.none, despawnEffect: Fx.none,
                draw(b){}
            }),
            
            draw(unit, mount){},
            drawOutline(unit, mount){}
        });

        elorixUnit.weapons.clear();
        elorixUnit.weapons.add(jsWeapon);

        elorixUnit.constructor = () => {
            return extend(Packages.mindustry.gen.LegsUnit, {
                isGalileoJS: true, 
                level: 0, 
                maxLevel: 10, 
                copperAbsorbed: 0, 
                titaniumAbsorbed: 0, 
                
                customReloadTimer: 0,
                burstQueue: 0,
                burstTimer: 0,
                
                dashCooldown: 0, 
                maxCooldownRecord: 300, 
                wasTouchedPrev: false,
                dashDelayTimer: 0,
                dashAngleToMove: 0, // Lưu góc hướng di chuyển khi dash

                thinArmorTimer: 0,
                armorRecoil: 0,

                update(){
                    this.super$update(); 

                    let speedMultiplier = 1.0 + (this.level * 0.05);
                    if (this.customReloadTimer > 0) {
                        this.customReloadTimer -= speedMultiplier * Time.delta;
                    }

                    if (this.isShooting && this.customReloadTimer <= 0 && this.burstQueue == 0) {
                        this.burstQueue = 2;
                        this.burstTimer = 0;
                        this.customReloadTimer = jsWeapon.reload;
                    }

                    if (this.burstQueue > 0 && this.mounts != null && this.mounts.length > 0) {
                        let m = this.mounts[0];
                        if (m != null) {
                            if (this.burstTimer <= 0) {
                                fireShotgunBurst(this, m, minalSound);
                                this.burstQueue--;
                                this.burstTimer = 8;
                            } else {
                                this.burstTimer -= Time.delta;
                            }
                        }
                    }

                    if (this.level > 0 && this.vel.len() > 0.01) {
                        this.vel.scl(1.0 + (0.05 * Time.delta));
                    }

                    if(this.dashCooldown > 0) this.dashCooldown--;
                    
                    if(this.thinArmorTimer > 0) this.thinArmorTimer -= Time.delta;

                    if(this.armorRecoil > 0) {
                        this.armorRecoil = Mathf.lerpDelta(this.armorRecoil, 0, 0.15);
                    }

                    // XỬ LÝ DASH & TELEPORT THEO HƯỚNG ĐÃ KHÓA
                    if(this.dashDelayTimer > 0) {
                        this.dashDelayTimer -= Time.delta;

                        // Khóa vận tốc trong thời gian gồng
                        this.vel.set(0, 0);

                        if(this.dashDelayTimer <= 0) {
                            let dashDistance = 15 * 8;
                            let angle = this.dashAngleToMove; 

                            let targetX = this.x + Angles.trnsx(angle, dashDistance);
                            let targetY = this.y + Angles.trnsy(angle, dashDistance);

                            let hitX = targetX;
                            let hitY = targetY;
                            let hit = Vars.world.raycast(
                                World.toTile(this.x), World.toTile(this.y),
                                World.toTile(targetX), World.toTile(targetY),
                                (x, y) => {
                                    let tile = Vars.world.tile(x, y);
                                    return tile != null && tile.solid();
                                }
                            );

                            if(hit != null && hit.tile != null){
                                hitX = hit.tile.worldx() - Angles.trnsx(angle, 8);
                                hitY = hit.tile.worldy() - Angles.trnsy(angle, 8);
                            }

                            this.set(hitX, hitY);
                            Fx.spawnShockwave.at(this.x, this.y);

                            try {
                                const sta = require("sta");
                                if (sta && sta.deot) {
                                    this.apply(sta.deot, 300);
                                }
                            } catch(err) {}

                            this.thinArmorTimer = 300;

                            if (global.deotLastHealth) {
                                global.deotLastHealth[this.id] = this.health;
                            }
                            
                            let cooldownReduction = 1.0 - (this.level * 0.05);
                            let maxDashCooldown = 300 * cooldownReduction;
                            this.maxCooldownRecord = maxDashCooldown; 
                            this.dashCooldown = maxDashCooldown;
                        }
                    }

                    // TỰ ĐỘNG HÚT VẬT LIỆU NÂNG CẤP
                    let req = getElorixUpgradeRequirements(this.level);
                    if(this.level < this.maxLevel && this.stack != null){
                        if(this.copperAbsorbed < req.copperNeeded && this.stack.item == req.copperItem && this.stack.amount > 0){
                            let consumeAmt = Math.min(2, this.stack.amount); this.stack.amount -= consumeAmt; this.copperAbsorbed += consumeAmt;
                        }
                        else if(this.titaniumAbsorbed < req.titaniumNeeded && this.stack.item == req.titaniumItem && this.stack.amount > 0){
                            let consumeAmt = Math.min(2, this.stack.amount); this.stack.amount -= consumeAmt; this.titaniumAbsorbed += consumeAmt;
                        }
                        
                        if(this.copperAbsorbed >= req.copperNeeded && this.titaniumAbsorbed >= req.titaniumNeeded){
                            this.copperAbsorbed = 0; this.titaniumAbsorbed = 0; 
                            this.level++; 
                            Fx.upgradeCore.at(this.x, this.y); Fx.shockwave.at(this.x, this.y);
                        }
                    }

                    // NHẤP ĐÚP ĐỂ LƯỚT - KHÓA GÓC DI CHUYỂN NGAY LÚC BẤM
                    if(Vars.player.unit() == this){
                        let isTouchedNow = Core.input.isTouched();
                        if(isTouchedNow && !this.wasTouchedPrev){
                            let currentTime = Time.millis();
                            if((currentTime - elorixLastTapTime) < elorixDoubleTapInterval){
                                if(this.dashCooldown <= 0 && this.dashDelayTimer <= 0){
                                    this.dashDelayTimer = 42; 
                                    
                                    // Bắt hướng di chuyển từ vận tốc (nếu đang di chuyển) hoặc hướng mặt quay của unit
                                    if(this.vel.len() > 0.05) {
                                        this.dashAngleToMove = this.vel.angle();
                                    } else {
                                        this.dashAngleToMove = this.rotation;
                                    }

                                    Fx.shieldApply.at(this.x, this.y, 0, Color.sky);
                                }
                            }
                            elorixLastTapTime = currentTime;
                        }
                        this.wasTouchedPrev = isTouchedNow;
                    }
                },

                draw(){
                    Draw.z(Layer.flyingUnit - 2.0); Lines.stroke(1.2);
                    let totalStars = this.level + 1; let baseRadius = this.hitSize * 0.65;
                    let speeds = getElorixStarSpeeds(this.id, this.level);
                    
                    for(let i = 0; i < totalStars; i++){
                        let colorPulse = (Math.sin(Time.time / 5 + i) + 1) / 2; Draw.color(Color.white.cpy().lerp(Color.blue, colorPulse));
                        let speed = speeds[i] ? speeds[i] : 2.0; let direction = (i % 2 === 0) ? 1 : -1;
                        let orbitAngle = (Time.time * speed * direction) + (i * (360 / totalStars));
                        drawElorixStar4C(this.x + Angles.trnsx(orbitAngle, baseRadius + (i * 2.0)), this.y + Angles.trnsy(orbitAngle, baseRadius + (i * 2.0)), 1.5, Time.time * (speed * 1.8) * direction);
                    }
                    
                    let dashProgress = 0; let isRetracting = false;
                    if(this.dashCooldown > 0){
                        let activeFrames = this.maxCooldownRecord - this.dashCooldown;
                        if(activeFrames < 40){ dashProgress = 1.0; } else { dashProgress = this.dashCooldown / this.maxCooldownRecord; isRetracting = true; }
                    }

                    Draw.z(Layer.flyingUnit - 0.001); Draw.color();
                    let upwardY = 8 * dashProgress; let baseSideOffset = 14; let sideExpand = 10 * dashProgress;
                    let w1X = this.x, w1Y = this.y; let w2X = this.x, w2Y = this.y;
                    if(elorixWing1Region != null && elorixWing2Region != null){
                        w1X = this.x + Angles.trnsx(this.rotation + 90, baseSideOffset + sideExpand) + Angles.trnsx(this.rotation, upwardY);
                        w1Y = this.y + Angles.trnsy(this.rotation + 90, baseSideOffset + sideExpand) + Angles.trnsy(this.rotation, upwardY);
                        w2X = this.x + Angles.trnsx(this.rotation - 90, baseSideOffset + sideExpand) + Angles.trnsx(this.rotation, upwardY);
                        w2Y = this.y + Angles.trnsy(this.rotation - 90, baseSideOffset + sideExpand) + Angles.trnsy(this.rotation, upwardY);
                        Draw.rect(elorixWing1Region, w1X, w1Y, this.rotation); Draw.rect(elorixWing2Region, w2X, w2Y, this.rotation);
                    }

                    if(isRetracting){
                        Draw.z(Layer.flyingUnit - 0.002); let laserPulse = (Math.sin(Time.time / 1.5) + 1) / 2;
                        let laserOriginX = this.x + Angles.trnsx(this.rotation, -4); let laserOriginY = this.y + Angles.trnsy(this.rotation, -4);
                        let shortFactor = 0.45;
                        let target1X = Mathf.lerp(laserOriginX, w1X, shortFactor); let target1Y = Mathf.lerp(laserOriginY, w1Y, shortFactor);
                        let target2X = Mathf.lerp(laserOriginX, w2X, shortFactor); let target2Y = Mathf.lerp(laserOriginY, w2Y, shortFactor);
                        Lines.stroke(1.4 + laserPulse * 0.8); Draw.color(Color.sky);
                        Lines.line(laserOriginX, laserOriginY, target1X, target1Y); Lines.line(laserOriginX, laserOriginY, target2X, target2Y);
                        Lines.stroke(0.4 + laserPulse * 0.3); Draw.color(Color.white);
                        Lines.line(laserOriginX, laserOriginY, target1X, target1Y); Lines.line(laserOriginX, laserOriginY, target2X, target2Y);
                        let ballRadius = 1.5 + (laserPulse * 1.0); Draw.color(Color.sky); Fill.circle(laserOriginX, laserOriginY, ballRadius + 0.8);
                        Draw.color(Color.white); Fill.circle(laserOriginX, laserOriginY, ballRadius * 0.6); Draw.color();
                    }

                    // --- VẼ THIN-ARMOR DRAWER (GIẬT LÙI KHI BẮN, KHÔNG XOAY TRÒN) ---
                    if(this.thinArmorTimer > 0 && thinArmorRegion != null && thinArmorRegion.found()){
                        let progress = 1.0 - (this.thinArmorTimer / 300.0);
                        
                        let scale = 1.0;
                        if(progress < 0.1) {
                            scale = progress / 0.1; 
                        } else if(progress > 0.9) {
                            scale = (1.0 - progress) / 0.1; 
                        }

                        let alpha = Math.min(scale, 1.0);

                        Draw.z(Layer.flyingUnit + 0.01);
                        Draw.color(Color.white, alpha);

                        let width = thinArmorRegion.width * Draw.scl * scale * 1.2;
                        let height = thinArmorRegion.height * Draw.scl * scale * 1.2;

                        let drawX = this.x - Angles.trnsx(this.rotation, this.armorRecoil);
                        let drawY = this.y - Angles.trnsy(this.rotation, this.armorRecoil);

                        Draw.rect(thinArmorRegion, drawX, drawY, width, height, this.rotation);
                        Draw.reset();
                    }

                    this.super$draw();
                }
            });
        };
    }
});