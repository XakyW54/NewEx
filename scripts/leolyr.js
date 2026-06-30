// File: scripts/leolyr.js

// ==========================================
// [CẤU HÌNH HỆ THỐNG NÂNG CẤP NGUYÊN BẢN]
// ==========================================
function getUpgradeRequirements(currentLevel) {
    return {
        copperNeeded: 40,
        siliconNeeded: 40,
        copperItem: Items.copper,
        siliconItem: Items.silicon
    };
}
// ==========================================

const leftBullet = extend(BasicBulletType, { speed: 8.0, damage: 15, width: 6, height: 9, lifetime: 25 });
const rightBullet = extend(BasicBulletType, { speed: 3.5, damage: 65, width: 14, height: 20, lifetime: 55 });

let lastTapTime = 0;
const doubleTapInterval = 250; 

// Biến hỗ trợ kỹ năng Dash MK2 (Cấp 10+)
let mk2TargetX = 0;
let mk2TargetY = 0;
let isMarkedMK2 = false;

let staticShields = []; 
let globalStarSpeedsMap = new ObjectMap();

function getUnitStarSpeeds(unitId, currentLevel) {
    let speeds = globalStarSpeedsMap.get(unitId);
    if (speeds == null) {
        speeds = [];
        globalStarSpeedsMap.put(unitId, speeds);
    }
    while (speeds.length <= currentLevel) {
        speeds.push(1.2 + Math.random() * 2.3);
    }
    return speeds;
}

function drawStar4C(x, y, radius, rotation) {
    for(let i = 0; i < 4; i++) {
        let angle = rotation + (i * 90);
        let x1 = x + Angles.trnsx(angle, radius); let y1 = y + Angles.trnsy(angle, radius);
        let x2 = x + Angles.trnsx(angle + 45, radius * 0.3); let y2 = y + Angles.trnsy(angle + 45, radius * 0.3);
        Lines.line(x1, y1, x2, y2);
        let x3 = x + Angles.trnsx(angle - 45, radius * 0.3); let y3 = y + Angles.trnsy(angle - 45, radius * 0.3);
        Lines.line(x1, y1, x3, y3);
    }
}

let wing1Region = null;
let wing2Region = null;

Events.on(ClientLoadEvent, () => {
    wing1Region = Core.atlas.find("newex-leolyr-wing1");
    wing2Region = Core.atlas.find("newex-leolyr-wing2");
    
    if(wing1Region == null || !wing1Region.found()){ wing1Region = Core.atlas.find("leolyr-wing1"); }
    if(wing2Region == null || !wing2Region.found()){ wing2Region = Core.atlas.find("leolyr-wing2"); }

    const leolyrUnit = Vars.content.getByName(ContentType.unit, "newex-leolyr");
    if(leolyrUnit != null){
        if(leolyrUnit.weapons.size >= 2){
            leolyrUnit.weapons.get(0).bullet = leftBullet;
            leolyrUnit.weapons.get(1).bullet = rightBullet;
        }

        leolyrUnit.constructor = () => {
            return extend(Packages.mindustry.gen.LegsUnit, {
                isGalileoJS: true, 
                level: 0, 
                maxLevel: 10, 
                copperAbsorbed: 0, 
                siliconAbsorbed: 0, 
                shotCount: 0, 
                dashCooldown: 0, 
                maxCooldownRecord: 300, 
                wasTouchedPrev: false,
                shieldHealth: 0,
                hexSize: 5.5,              
                ignoreNextDamage: false,   

                damage(amount){
                    if(this.ignoreNextDamage){
                        this.ignoreNextDamage = false; 
                        return; 
                    }
                    this.super$damage(amount);
                },

                update(){
                    this.super$update(); 
                    if(this.dashCooldown > 0) this.dashCooldown--;

                    let currentMaxShield = 100 + (this.level * 250); 
                    let currentShieldRadius = (7 * 8) * (1.0 + (this.level * 0.10)); 

                    // 1. QUÉT KHIÊN DI ĐỘNG
                    if(this.shieldHealth > 0){
                        let currentShield = this;
                        Groups.bullet.intersect(this.x - currentShieldRadius - 16, this.y - currentShieldRadius - 16, (currentShieldRadius + 16) * 2, (currentShieldRadius + 16) * 2, cons(b => {
                            if(b.team != currentShield.team && b.type != null && b.type.damage > 0){
                                let dst = Mathf.dst(currentShield.x, currentShield.y, b.x, b.y);
                                if(dst <= currentShieldRadius + 4.0){
                                    currentShield.shieldHealth -= b.damage;
                                    currentShield.ignoreNextDamage = true;
                                    Fx.shieldBreak.at(b.x, b.y, 5, Color.sky);
                                    
                                    if(Math.random() < (currentShield.level * 0.01)){
                                        b.team = currentShield.team;
                                        b.vel.rotate(180); 
                                    } else {
                                        b.remove();
                                    }

                                    if(currentShield.shieldHealth <= 0){
                                        currentShield.shieldHealth = 0;
                                        Fx.shieldBreak.at(currentShield.x, currentShield.y, currentShieldRadius, Color.sky);
                                    }
                                }
                            }
                        }));
                    }
                    this.ignoreNextDamage = false; 

                    // 2. QUÉT KHIÊN TĨNH TRÊN MẶT ĐẤT
                    staticShields = staticShields.filter(s => s.lifetime > 0); 
                    let currentUnit = this;
                    staticShields.forEach(s => {
                        s.lifetime -= Time.delta;
                        if(s.hp > 0){
                            Groups.bullet.intersect(s.x - s.rad - 16, s.y - s.rad - 16, (s.rad + 16) * 2, (s.rad + 16) * 2, cons(b => {
                                if(b.team != currentUnit.team && b.type != null && b.type.damage > 0){
                                    let dst = Mathf.dst(s.x, s.y, b.x, b.y);
                                    if(dst <= s.rad + 4.0){
                                        s.hp -= b.damage;
                                        Fx.shieldBreak.at(b.x, b.y, 5, Color.sky);
                                        if(Math.random() < (currentUnit.level * 0.01)){
                                            b.team = currentUnit.team;
                                            b.vel.rotate(180);
                                        } else {
                                            b.remove();
                                        }
                                    }
                                }
                            }));
                        }
                    });

                    // Cơ chế hấp thụ khoáng sản nâng cấp level
                    let req = getUpgradeRequirements(this.level);
                    if(this.level < this.maxLevel && this.stack != null){
                        if(this.copperAbsorbed < req.copperNeeded && this.stack.item == req.copperItem && this.stack.amount > 0){
                            let consumeAmt = Math.min(2, this.stack.amount); this.stack.amount -= consumeAmt; this.copperAbsorbed += consumeAmt;
                        }
                        else if(this.siliconAbsorbed < req.siliconNeeded && this.stack.item == req.siliconItem && this.stack.amount > 0){
                            let consumeAmt = Math.min(2, this.stack.amount); this.stack.amount -= consumeAmt; this.siliconAbsorbed += consumeAmt;
                        }
                        
                        if(this.copperAbsorbed >= req.copperNeeded && this.siliconAbsorbed >= req.siliconNeeded){
                            this.copperAbsorbed = 0; this.siliconAbsorbed = 0; 
                            this.level++; 
                            Fx.upgradeCore.at(this.x, this.y); Fx.shockwave.at(this.x, this.y);
                        }
                    }

                    // XỬ LÝ KỸ NĂNG DASH / DASH MK2 TỪ LEVEL 10+
                    let cooldownReduction = 1.0 - (this.level * 0.05);
                    let maxDashCooldown = 300 * cooldownReduction;
                    let executeDash = false;
                    let finalX = this.x, finalY = this.y;

                    if(Vars.player.unit() == this){
                        let isTouchedNow = Core.input.isTouched();
                        if(isTouchedNow && !this.wasTouchedPrev){
                            let currentTime = Time.millis();
                            if((currentTime - lastTapTime) < doubleTapInterval){
                                
                                if(this.level >= 10){
                                    // LOGIC DASH MK2 (LEVEL 10+)
                                    if(!isMarkedMK2 && this.dashCooldown <= 0){
                                        // Nhấn đúp lần 1: Đánh dấu vị trí
                                        mk2TargetX = Vars.player.mouseX;
                                        mk2TargetY = Vars.player.mouseY;
                                        isMarkedMK2 = true;
                                        
                                        // ĐÃ SỬA: Thay thế hiệu ứng lỗi hitShieldPlasma bằng hiệu ứng an toàn gốc
                                        Fx.shieldBreak.at(mk2TargetX, mk2TargetY, this.hexSize * 2, Color.sky);
                                        Fx.shieldApply.at(mk2TargetX, mk2TargetY, 0, Color.sky);
                                    } else if(isMarkedMK2 && this.dashCooldown <= 0){
                                        // Nhấn đúp lần 2: Lướt tới đúng điểm đã đánh dấu
                                        executeDash = true;
                                        finalX = mk2TargetX;
                                        finalY = mk2TargetY;
                                        isMarkedMK2 = false; 
                                    }
                                } else {
                                    // LOGIC DASH CƠ BẢN (DƯỚI LEVEL 10)
                                    if(this.dashCooldown <= 0){
                                        executeDash = true;
                                        let dashDistance = 80 + (this.level * 40);
                                        let angle = this.rotation; if(this.vel.len() > 0.1) angle = this.vel.angle();
                                        finalX = this.x + Angles.trnsx(angle, dashDistance);
                                        finalY = this.y + Angles.trnsy(angle, dashDistance);
                                    }
                                }
                            }
                            lastTapTime = currentTime;
                        }
                        this.wasTouchedPrev = isTouchedNow;
                    } else {
                        // AI lướt tự động như cũ
                        if(this.vel.len() > 0.1 && this.dashCooldown <= 0 && Mathf.chance(0.02)){
                            executeDash = true;
                            let dashDistance = 80 + (this.level * 40);
                            let angle = this.vel.angle();
                            finalX = this.x + Angles.trnsx(angle, dashDistance);
                            finalY = this.y + Angles.trnsy(angle, dashDistance);
                        }
                    }

                    // Thực thi dịch chuyển vị trí khi đủ điều kiện kích hoạt
                    if(executeDash){
                        let oldX = this.x; let oldY = this.y;
                        
                        this.set(finalX, finalY);
                        Fx.spawnShockwave.at(this.x, this.y);
                        
                        this.maxCooldownRecord = maxDashCooldown; 
                        this.dashCooldown = maxDashCooldown;
                        this.shieldHealth = currentMaxShield; 
                        
                        staticShields.push({
                            x: oldX, y: oldY, 
                            rad: currentShieldRadius, 
                            hp: currentMaxShield * 0.8, 
                            lifetime: 600
                        });
                    }
                },

                updateWeapons(){
                    let reloadMultiplier = 1 + (this.level * 2);
                    let damageMultiplier = 1.0 + (this.level * 0.20);
                    leftBullet.damage = 15 * damageMultiplier; rightBullet.damage = 65 * damageMultiplier;
                    if(this.isShooting && this.weapons.size >= 2){
                        let leftW = this.weapons.get(0); let rightW = this.weapons.get(1);
                        if(leftW.reload > 0) leftW.reload -= (reloadMultiplier - 1) * Time.delta;
                        if(rightW.reload > 0) rightW.reload -= (reloadMultiplier - 1) * Time.delta;
                        if(leftW.reload <= 0 && this.shotCount % 2 === 0){ leftW.shoot(this); this.shotCount++; } 
                        else if(rightW.reload <= 0 && this.shotCount % 2 === 1){ rightW.shoot(this); this.shotCount++; }
                    }
                    this.super$updateWeapons();
                },

                draw(){
                    Draw.z(Layer.flyingUnit - 2.0); Lines.stroke(1.2);
                    let totalStars = this.level + 1; let baseRadius = this.hitSize * 0.65;
                    let speeds = getUnitStarSpeeds(this.id, this.level);
                    
                    for(let i = 0; i < totalStars; i++){
                        let colorPulse = (Math.sin(Time.time / 5 + i) + 1) / 2; Draw.color(Color.white.cpy().lerp(Color.blue, colorPulse));
                        let speed = speeds[i] ? speeds[i] : 2.0; let direction = (i % 2 === 0) ? 1 : -1;
                        let orbitAngle = (Time.time * speed * direction) + (i * (360 / totalStars));
                        drawStar4C(this.x + Angles.trnsx(orbitAngle, baseRadius + (i * 2.0)), this.y + Angles.trnsy(orbitAngle, baseRadius + (i * 2.0)), 1.5, Time.time * (speed * 1.8) * direction);
                    }
                    
                    let dashProgress = 0; let isRetracting = false;
                    if(this.dashCooldown > 0){
                        let activeFrames = this.maxCooldownRecord - this.dashCooldown;
                        if(activeFrames < 40){ dashProgress = 1.0; } else { dashProgress = this.dashCooldown / this.maxCooldownRecord; isRetracting = true; }
                    }

                    Draw.z(Layer.flyingUnit - 0.001); Draw.color();
                    let upwardY = 8 * dashProgress; let baseSideOffset = 14; let sideExpand = 10 * dashProgress;
                    let w1X = this.x, w1Y = this.y; let w2X = this.x, w2Y = this.y;
                    if(wing1Region != null && wing2Region != null){
                        w1X = this.x + Angles.trnsx(this.rotation + 90, baseSideOffset + sideExpand) + Angles.trnsx(this.rotation, upwardY);
                        w1Y = this.y + Angles.trnsy(this.rotation + 90, baseSideOffset + sideExpand) + Angles.trnsy(this.rotation, upwardY);
                        w2X = this.x + Angles.trnsx(this.rotation - 90, baseSideOffset + sideExpand) + Angles.trnsx(this.rotation, upwardY);
                        w2Y = this.y + Angles.trnsy(this.rotation - 90, baseSideOffset + sideExpand) + Angles.trnsy(this.rotation, upwardY);
                        Draw.rect(wing1Region, w1X, w1Y, this.rotation); Draw.rect(wing2Region, w2X, w2Y, this.rotation);
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

                    // VẼ HIỆU ỨNG ĐÁNH DẤU CHO ĐIỂM ĐÁNH DẤU DASH MK2 (CHỈ NGƯỜI CHƠI THẤY)
                    if(isMarkedMK2 && Vars.player.unit() == this && this.level >= 10){
                        Draw.z(Layer.effect);
                        Draw.color(Color.sky, 0.4 + Mathf.absin(Time.time, 3.0, 0.2));
                        Lines.stroke(1.0);
                        Lines.poly(mk2TargetX, mk2TargetY, 6, this.hexSize * 1.8, Time.time * 2);
                        Lines.circle(mk2TargetX, mk2TargetY, 4);
                        Draw.reset();
                    }

                    this.super$draw();

                    let DynamicRadius = (7 * 8) * (1.0 + (this.level * 0.10));
                    if(this.shieldHealth > 0){
                        Draw.z(Layer.effect);
                        let hSpacing = this.hexSize * 1.5; let vSpacing = this.hexSize * Math.sqrt(3);
                        let minX = Math.floor((this.x - DynamicRadius) / hSpacing) - 1;
                        let maxX = Math.ceil((this.x + DynamicRadius) / hSpacing) + 1;
                        let minY = Math.floor((this.y - DynamicRadius) / vSpacing) - 1;
                        let maxY = Math.ceil((this.y + DynamicRadius) / vSpacing) + 1;
                        
                        for (let i = minX; i <= maxX; i++) {
                            for (let j = minY; j <= maxY; j++) {
                                let checkX = i * hSpacing;
                                let checkY = j * vSpacing + ((i % 2 === 0) ? 0 : vSpacing / 2);
                                let currentDst = Mathf.dst(this.x, this.y, checkX, checkY);
                                if (Math.floor(currentDst) < DynamicRadius - 1) {
                                    let edgeFade = (1.0 - (currentDst / DynamicRadius));
                                    let hexAlpha = (0.28 + Mathf.absin(Time.time, 4.0, 0.08)) * edgeFade;
                                    Draw.color(Color.sky, hexAlpha); Lines.stroke(0.75);
                                    Lines.poly(checkX, checkY, 6, this.hexSize); 
                                }
                            }
                        }
                        Draw.color(Color.sky, 0.75); Lines.stroke(1.3);
                        Lines.circle(this.x, this.y, DynamicRadius); Draw.reset();
                    }

                    staticShields.forEach(s => {
                        if(s.hp > 0){
                            Draw.z(Layer.effect);
                            let hSpacing = this.hexSize * 1.5; let vSpacing = this.hexSize * Math.sqrt(3);
                            let minX = Math.floor((s.x - s.rad) / hSpacing) - 1; let maxX = Math.ceil((s.x + s.rad) / hSpacing) + 1;
                            let minY = Math.floor((s.y - s.rad) / vSpacing) - 1; let maxY = Math.ceil((s.y + s.rad) / vSpacing) + 1;
                            
                            for (let i = minX; i <= maxX; i++) {
                                for (let j = minY; j <= maxY; j++) {
                                    let checkX = i * hSpacing;
                                    let checkY = j * vSpacing + ((i % 2 === 0) ? 0 : vSpacing / 2);
                                    let currentDst = Mathf.dst(s.x, s.y, checkX, checkY);
                                    if (Math.floor(currentDst) < s.rad - 1) {
                                        let edgeFade = (1.0 - (currentDst / s.rad));
                                        let lifeFade = s.lifetime > 60 ? 1.0 : (s.lifetime / 60); 
                                        Draw.color(Color.sky, 0.22 * edgeFade * lifeFade); Lines.stroke(0.6);
                                        Lines.poly(checkX, checkY, 6, this.hexSize);
                                    }
                                }
                            }
                            Draw.color(Color.sky, 0.60 * (s.lifetime > 60 ? 1.0 : (s.lifetime / 60))); Lines.stroke(1.1);
                            Lines.circle(s.x, s.y, s.rad); Draw.reset();
                        }
                    });
                },

                maxHealth(){ return leolyrUnit.health * (1.0 + (this.level * 0.20)); },
                speed(){ if(this.level >= 2) return leolyrUnit.speed * 1.40; return leolyrUnit.speed; }
            });
        };
    }
});
