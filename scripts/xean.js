// =========================================================================
// 1. CÁC HÀM HỖ TRỢ & HIỆU ỨNG TỐI ƯU HÓA (GRAPHICS & UTILS)
// =========================================================================

const COLOR_CYAN = Color.valueOf("#00e5ff");
const COLOR_BLUE = Color.valueOf("#0091ea");
const COLOR_LIGHT_BLUE = Color.valueOf("#80d8ff");
const COLOR_OVERHEAT = Color.valueOf("#ff5252");

// Effect hồi máu nâng cấp
const customHealFx = new Effect(24, e => {
    Draw.color(COLOR_CYAN, Color.white, e.fout());
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, 4 + e.finpow() * 16);
    Draw.color(COLOR_LIGHT_BLUE);
    Fill.circle(e.x, e.y, e.fout() * 3);
});

// Effect tia sét spark
const customSparkFx = new Effect(16, e => {
    Draw.color(COLOR_LIGHT_BLUE, Color.white, e.fin());
    Lines.stroke(1.5 * e.fout());
    Lines.spikes(e.x, e.y, 3 + e.fin() * 8, 3, 4, e.rotation);
});

// Effect nổ tên lửa
const customRocketExplosionFx = new Effect(32, e => {
    Draw.color(COLOR_CYAN, COLOR_BLUE, e.fin());
    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, e.finpow() * 28);
    Fill.circle(e.x, e.y, e.fout() * 10);
    Draw.color(COLOR_LIGHT_BLUE);
    Angles.randLenVectors(e.id, 6, 18 * e.finpow(), (x, y) => {
        Fill.circle(e.x + x, e.y + y, e.fout() * 2.5);
    });
});

// Effect Laser Ulti
const customUltiExplosionFx = new Effect(50, e => {
    Draw.color(COLOR_CYAN, Color.white, e.fin());
    Lines.stroke(5 * e.fout());
    Lines.circle(e.x, e.y, e.finpow() * 70);
    
    Draw.color(COLOR_LIGHT_BLUE);
    for (let i = 0; i < 12; i++) {
        let ang = i * 30 + e.fin() * 60;
        Lines.lineAngle(e.x, e.y, ang, 10 + e.finpow() * 25);
    }
});

// Hàm vẽ vòng ma pháp nâng cấp
function drawMagicCircle(x, y, radius, rotation, color) {
    Draw.color(color);
    Lines.stroke(1.2);
    Lines.poly(x, y, 6, radius, rotation);
    Lines.poly(x, y, 6, radius * 0.7, -rotation * 1.5);
    
    let segments = 24;
    for (let i = 0; i < segments; i += 2) {
        let a1 = (i / segments) * 360 + rotation;
        let a2 = ((i + 1) / segments) * 360 + rotation;
        Lines.line(
            x + Angles.trnsx(a1, radius * 1.2), y + Angles.trnsy(a1, radius * 1.2),
            x + Angles.trnsx(a2, radius * 1.2), y + Angles.trnsy(a2, radius * 1.2)
        );
    }
    Draw.reset();
}

// =========================================================================
// 2. LOẠI ĐẠN ĐẶC BIỆT
// =========================================================================

const xeanGrappleBullet = extend(BasicBulletType, {
    speed: 13.0,
    damage: 85,
    width: 7,
    height: 18,
    lifetime: 28,
    frontColor: Color.white,
    backColor: COLOR_CYAN,
    trailColor: COLOR_BLUE,
    trailWidth: 2.2,
    trailLength: 12,

    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        if (other && other.build == null) {
            Lightning.create(b.team, COLOR_CYAN, 45, b.x, b.y, b.rotation(), 8);
            customSparkFx.at(b.x, b.y, b.rotation());

            if (b.owner) {
                let angleToTurret = Mathf.angle(b.owner.x - other.x, b.owner.y - other.y);
                other.impulse(Angles.trnsx(angleToTurret, 400), Angles.trnsy(angleToTurret, 400));
            }
        }
    }
});

const xeanRocketBullet = extend(MissileBulletType, {
    speed: 8.0,
    damage: 160,
    width: 10,
    height: 14,
    lifetime: 50,
    homingRange: 180,
    homingPower: 0.1,
    frontColor: COLOR_LIGHT_BLUE,
    backColor: COLOR_BLUE,
    trailColor: COLOR_CYAN,
    hitEffect: customRocketExplosionFx,
    despawnEffect: customRocketExplosionFx,

    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        this.spawnLightnings(b);
    },

    hitTile(b, tile, build, x, y, side, damage) {
        this.super$hitTile(b, tile, build, x, y, side, damage);
        this.spawnLightnings(b);
    },

    spawnLightnings(b) {
        if (!b.data) b.data = {};
        if (!b.data.hasHit) {
            b.data.hasHit = true;
            for (let i = 0; i < 4; i++) {
                Lightning.create(b.team, COLOR_LIGHT_BLUE, 35, b.x, b.y, b.rotation() + Mathf.range(180), 10);
            }
        }
    }
});

const xeanUltiLaser = extend(LaserBulletType, {
    length: 2200,
    damage: 2800,
    width: 50,
    lifetime: 65,
    colors: [COLOR_CYAN, COLOR_LIGHT_BLUE, Color.white],
    hitEffect: customUltiExplosionFx,

    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        if (other && other.apply) {
            other.apply(StatusEffects.unmoving, 180);
            other.apply(StatusEffects.slow, 300);
        }
    }
});

// =========================================================================
// 3. LOGIC THÁP PHÁO XEAN TỐI ƯU & THÔNG MINH
// =========================================================================

Events.on(ContentInitEvent, () => {
    const xeanTurret = Vars.content.block("newex-xean");
    if (!xeanTurret) return;

    xeanTurret.squareSprite = false;

    xeanTurret.buildType = () => extend(ItemTurret.ItemTurretBuild, xeanTurret, {
        rage: 0,
        maxRage: 100,
        
        // Cơ chế Quá nhiệt từ Pháo Xylaon
        heat: 0,            // 0 -> 100
        maxHeat: 100,
        isOverheated: false,
        cooldownTimer: 0,
        
        ringRotation: 0,
        shieldAlpha: 0,

        handleDamageRegen() {
            let healAmount = this.maxHealth * 0.0025;
            this.heal(healAmount);
            customHealFx.at(this.x, this.y);
        },

        // --- AI THÔNG MINH (Smart AI Target & Predict) ---
        findSmartTarget() {
            let range = xeanTurret.range;
            let bestTarget = null;
            let maxScore = -999999;

            Units.nearbyEnemies(this.team, this.x - range, this.y - range, range * 2, cons(unit => {
                if (!unit.isValid() || !unit.within(this.x, this.y, range)) return;

                // Tính điểm ưu tiên: Máu cao + khoảng cách phù hợp + đe dọa lớn
                let dist = this.dst(unit);
                let score = (unit.maxHealth * 0.5) - dist;

                if (unit.isBoss()) score += 2000;
                if (score > maxScore) {
                    maxScore = score;
                    bestTarget = unit;
                }
            }));

            return bestTarget;
        },

        updateTile() {
            this.super$updateTile();

            // AI Target Overwrite
            let smartTarget = this.findSmartTarget();
            if (smartTarget != null) {
                // Dự đoán đường đi Kẻ địch (Predictive Aiming)
                let timeToHit = this.dst(smartTarget) / 12.0; 
                let predictX = smartTarget.x + smartTarget.vel.x * timeToHit;
                let predictY = smartTarget.y + smartTarget.vel.y * timeToHit;
                
                let targetRot = Angles.angle(this.x, this.y, predictX, predictY);
                this.rotation = Mathf.slerpDelta(this.rotation, targetRot, 0.15);
            }

            // Xoay đồ họa
            this.ringRotation += (2.0 + (this.heat / 15)) * Time.delta;

            // XỬ LÝ NHIỆT (XYLAON OVERHEAT MECHANIC)
            if (this.isOverheated) {
                this.isShooting = false; // Cưỡng ép dừng bắn khi quá nhiệt
                this.heat = Mathf.approach(this.heat, 0, 0.45 * Time.delta); // Làm nguội
                if (this.heat <= 0) {
                    this.isOverheated = false;
                }
            } else {
                if (!this.isShooting) {
                    this.heat = Mathf.approach(this.heat, 0, 0.3 * Time.delta);
                }
            }

            // AI tự động điều tiết nhấp nhả khi sắp quá nhiệt (Adaptive Fire)
            if (this.heat > 90 && this.rage < this.maxRage - 10) {
                this.isShooting = false; 
            }

            // XỬ LÝ KHIÊN TRƯỚC MẶT (DTG SOLDERN SHIELD MECHANIC)
            if (this.isShooting && !this.isOverheated) {
                this.shieldAlpha = Mathf.approach(this.shieldAlpha, 1.0, 0.1 * Time.delta);
                
                // Khiên chặn đạn kẻ địch ở hướng trước mặt
                let shieldRadius = 26.0;
                let shieldArc = 80; // Góc phủ của khiên
                let shieldX = this.x + Angles.trnsx(this.rotation, 16);
                let shieldY = this.y + Angles.trnsy(this.rotation, 16);

                Groups.bullet.intersect(shieldX - shieldRadius, shieldY - shieldRadius, shieldRadius * 2, shieldRadius * 2, cons(b => {
                    if (b.team != this.team && b.type != null) {
                        let angleToBullet = Angles.angle(shieldX, shieldY, b.x, b.y);
                        if (Angles.near(this.rotation, angleToBullet, shieldArc / 2)) {
                            customSparkFx.at(b.x, b.y, b.rotation() + 180);
                            b.remove(); // Triệt tiêu đạn
                        }
                    }
                }));
            } else {
                this.shieldAlpha = Mathf.approach(this.shieldAlpha, 0.0, 0.08 * Time.delta);
            }

            // Tốc độ xả đạn ăn theo Quá Nhiệt (+350% khi nhiệt tối đa)
            let heatSpeedBonus = (this.heat / this.maxHeat) * 3.5;
            let currentReloadSpeed = 1.0 + heatSpeedBonus;

            // Vòng phụ bắn đạn kéo
            if (this.isShooting && !this.isOverheated && Mathf.chanceDelta(0.025 * currentReloadSpeed)) {
                for (let side of [-1, 1]) {
                    let rx = this.x + Angles.trnsx(this.rotation + 90 * side, 18);
                    let ry = this.y + Angles.trnsy(this.rotation + 90 * side, 18);
                    xeanGrappleBullet.create(this, this.team, rx, ry, this.rotation);
                }
            }

            // Bắn Tên Lửa
            if (this.isShooting && !this.isOverheated && Mathf.chanceDelta(0.035 * currentReloadSpeed)) {
                xeanRocketBullet.create(this, this.team, this.x, this.y, this.rotation + Mathf.range(15));
            }

            // TÍCH ĐỦ NỘ -> BẮN ULT
            if (this.rage >= this.maxRage) {
                this.rage = 0;
                xeanUltiLaser.create(this, this.team, this.x, this.y, this.rotation);
                customUltiExplosionFx.at(this.x, this.y);
                Effect.shake(6, 6, this.x, this.y);
            }
        },

        shoot(type) {
            if (this.isOverheated) return;

            this.super$shoot(type);

            // Tăng nhiệt độ
            this.heat += 1.8;
            if (this.heat >= this.maxHeat) {
                this.heat = this.maxHeat;
                this.isOverheated = true; // Cưỡng ép ngắt bắn
            }

            this.rage = Math.min(this.maxRage, this.rage + 3.5);
            this.handleDamageRegen();
        },

        draw() {
            this.super$draw();
            if (Vars.headless) return;

            // 1. Vòng ma pháp chuyển màu theo Overheat
            Draw.z(Layer.turret - 0.01);
            let circleColor = this.isOverheated ? COLOR_OVERHEAT : COLOR_CYAN;
            drawMagicCircle(this.x, this.y, 28 + Math.sin(Time.time * 0.06) * 2, this.ringRotation, circleColor);

            // 2. Vẽ Khiên chắn DTG Soldern dạng Arc trước mặt khi đang bắn
            if (this.shieldAlpha > 0.01) {
                Draw.z(Layer.shields);
                let shieldX = this.x + Angles.trnsx(this.rotation, 16);
                let shieldY = this.y + Angles.trnsy(this.rotation, 16);

                Draw.color(this.isOverheated ? COLOR_OVERHEAT : COLOR_CYAN, 0.6 * this.shieldAlpha);
                Lines.stroke(3.0 * this.shieldAlpha);
                Lines.arc(shieldX, shieldY, 24, 80 / 360, this.rotation - 40);
                
                Draw.color(Color.white, 0.3 * this.shieldAlpha);
                Lines.stroke(1.0 * this.shieldAlpha);
                Lines.arc(shieldX, shieldY, 22, 76 / 360, this.rotation - 38);
                Draw.reset();
            }

            // 3. Thanh hiển thị Quá Nhiệt & Thanh Nộ
            Draw.z(Layer.effect + 1);
            let barWidth = 28;
            
            // Thanh Nhiệt (Heat Bar - Pháo Xylaon)
            let heatBarY = this.y - 18;
            Draw.color(Color.black, 0.5);
            Lines.stroke(3);
            Lines.line(this.x - barWidth / 2, heatBarY, this.x + barWidth / 2, heatBarY);

            Draw.color(this.isOverheated ? COLOR_OVERHEAT : COLOR_LIGHT_BLUE);
            Lines.stroke(2);
            Lines.line(this.x - barWidth / 2, heatBarY, this.x - barWidth / 2 + (barWidth * (this.heat / this.maxHeat)), heatBarY);

            // Thanh Nộ (Rage Bar)
            let rageBarY = this.y - 22;
            Draw.color(Color.black, 0.5);
            Lines.stroke(3);
            Lines.line(this.x - barWidth / 2, rageBarY, this.x + barWidth / 2, rageBarY);

            Draw.color(COLOR_CYAN);
            Lines.stroke(2);
            Lines.line(this.x - barWidth / 2, rageBarY, this.x - barWidth / 2 + (barWidth * (this.rage / this.maxRage)), rageBarY);

            Draw.reset();
        }
    });
});