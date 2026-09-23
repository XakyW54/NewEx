// =========================================================================
// 1. CÁC HÀM EFFECT TỰ TẠO
// =========================================================================

// Effect hồi máu nhẹ
const customHealFx = new Effect(20, e => {
    Draw.color(Color.valueOf("#00e5ff"));
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, 4 + e.fin() * 12);
});

// Effect tia sét nhỏ
const customSparkFx = new Effect(15, e => {
    Draw.color(Color.valueOf("#80d8ff"), Color.white, e.fin());
    Lines.stroke(1.2 * e.fout());
    Lines.spikes(e.x, e.y, 2 + e.fin() * 6, 2, 4, e.rotation);
});

// Effect nổ của tên lửa
const customRocketExplosionFx = new Effect(30, e => {
    Draw.color(Color.valueOf("#00e5ff"), Color.valueOf("#0091ea"), e.fin());
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 24);
    Fill.circle(e.x, e.y, e.fout() * 8);
});

// Effect nổ lớn của Laser Ulti
const customUltiExplosionFx = new Effect(45, e => {
    Draw.color(Color.valueOf("#00e5ff"), Color.white, e.fin());
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 60);
    
    Draw.color(Color.valueOf("#80d8ff"));
    for (let i = 0; i < 8; i++) {
        let ang = i * 45 + e.fin() * 90;
        Lines.lineAngle(e.x, e.y, ang, 8 + e.fin() * 20);
    }
});

// Function hỗ trợ vẽ nét đứt (Dash Circle)
function dashCircle(x, y, radius, color) {
    Draw.color(color);
    let segments = 48;
    for (let i = 0; i < segments; i += 2) {
        let a1 = (i / segments) * 360;
        let a2 = ((i + 1) / segments) * 360;
        Lines.line(
            x + Angles.trnsx(a1, radius), y + Angles.trnsy(a1, radius), 
            x + Angles.trnsx(a2, radius), y + Angles.trnsy(a2, radius)
        );
    }
    Draw.reset();
}

// =========================================================================
// 2. CÁC LOẠI ĐẠN ĐẶC BIỆT
// =========================================================================

// Đạn móc kéo
const xeanGrappleBullet = extend(BasicBulletType, {
    speed: 12.0,
    damage: 80,
    width: 6,
    height: 16,
    lifetime: 30,
    frontColor: Color.valueOf("#e0f7fa"),
    backColor: Color.valueOf("#00e5ff"),
    trailColor: Color.valueOf("#00b0ff"),
    trailWidth: 2,
    trailLength: 10,

    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        if (other && other.build == null) {
            Lightning.create(b.team, Color.valueOf("#00e5ff"), 40, b.x, b.y, b.rotation(), 8);
            customSparkFx.at(b.x, b.y, b.rotation());

            let angleToTurret = Mathf.angle(b.owner.x - other.x, b.owner.y - other.y);
            let pullDistance = 45.0;
            other.impulse(Angles.trnsx(angleToTurret, pullDistance * 8), Angles.trnsy(angleToTurret, pullDistance * 8));
        }
    }
});

// Tên lửa đẻ sét (Đã sửa hoàn toàn chống StackOverflow)
const xeanRocketBullet = extend(MissileBulletType, {
    speed: 7.5,
    damage: 150,
    width: 10,
    height: 14,
    shrinkY: 0,
    lifetime: 45,
    homingRange: 160,
    homingPower: 0.08,
    frontColor: Color.valueOf("#80d8ff"),
    backColor: Color.valueOf("#0091ea"),
    trailColor: Color.valueOf("#40c4ff"),
    hitEffect: customRocketExplosionFx,
    despawnEffect: customRocketExplosionFx,

    // Thay vì override hit(), dùng hitEntity và hitTile an toàn hơn nhiều
    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        this.spawnLightnings(b);
    },

    hitTile(b, tile, build, x, y, side, damage) {
        this.super$hitTile(b, tile, build, x, y, side, damage);
        this.spawnLightnings(b);
    },

    // Hàm phụ trợ tạo sét
    spawnLightnings(b) {
        if (!b.data) b.data = {};
        if (!b.data.hasHit) {
            b.data.hasHit = true;
            for (let i = 0; i < 4; i++) {
                Lightning.create(b.team, Color.valueOf("#80d8ff"), 35, b.x, b.y, b.rotation() + Mathf.range(180), 10);
            }
        }
    }
});

// Laser Nộ Ulti
const xeanUltiLaser = extend(LaserBulletType, {
    length: 2200, 
    damage: 2500,
    width: 45,
    lifetime: 60,
    colors: [Color.valueOf("#00e5ff"), Color.valueOf("#80d8ff"), Color.white],
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
// 3. LOGIC THÁP PHÁO XEAN TỪ HJSON
// =========================================================================

Events.on(ContentInitEvent, () => {
    const xeanTurret = Vars.content.block("newex-xean");
    if (!xeanTurret) return;

    xeanTurret.squareSprite = false;

    xeanTurret.buildType = () => extend(ItemTurret.ItemTurretBuild, xeanTurret, {
        rage: 0,
        maxRage: 100,
        ringRotation: 0,
        heatSpeedBonus: 0, 
        shieldScale: 0,

        handleDamageRegen() {
            let healAmount = this.maxHealth * 0.002;
            this.heal(healAmount);
            customHealFx.at(this.x, this.y);
        },

        updateTile() {
            this.super$updateTile();

            // Xoay vòng ma pháp
            this.ringRotation += (2.0 + (this.rage / 20)) * Time.delta;

            if (!this.isShooting) {
                this.heatSpeedBonus = Mathf.approach(this.heatSpeedBonus, 0, 0.005 * Time.delta);
                this.shieldScale = Mathf.approach(this.shieldScale, 0.0, 0.05 * Time.delta);
            } else {
                this.shieldScale = Mathf.approach(this.shieldScale, 1.0, 0.1 * Time.delta);
            }

            // Máu thấp bắn nhanh & khỏe hơn
            let healthPercent = Math.max(0.05, this.health / this.maxHealth);
            let lowHealthSpeedMultiplier = 1.0 + (1.0 - healthPercent) * 1.5; 
            let lowHealthDamageMultiplier = 1.0 + (1.0 - healthPercent) * 1.0; 

            let currentReloadSpeed = (1.0 + this.heatSpeedBonus) * lowHealthSpeedMultiplier;
            
            // 2 Vòng phụ bắn đạn kéo
            if (this.target != null && this.hasAmmo() && Mathf.chanceDelta(0.02 * currentReloadSpeed)) {
                let sideOffset = 18.0;
                for (let side of [-1, 1]) {
                    let rx = this.x + Angles.trnsx(this.rotation + 90 * side, sideOffset);
                    let ry = this.y + Angles.trnsy(this.rotation + 90 * side, sideOffset);
                    xeanGrappleBullet.create(this, this.team, rx, ry, this.rotation);
                }
            }

            // Giật sét phía trước
            if (this.isShooting && Mathf.chanceDelta(0.1)) {
                let frontX = this.x + Angles.trnsx(this.rotation, 20);
                let frontY = this.y + Angles.trnsy(this.rotation, 20);
                
                Units.nearbyEnemies(this.team, frontX, frontY, 120, cons(unit => {
                    unit.damage(25 * lowHealthDamageMultiplier);
                    unit.apply(StatusEffects.slownorm, 120); 
                    customSparkFx.at(frontX, frontY, this.rotation);
                }));
            }

            // Bắn tên lửa đẻ sét
            if (this.isShooting && Mathf.chanceDelta(0.03 * currentReloadSpeed)) {
                xeanRocketBullet.create(this, this.team, this.x, this.y, this.rotation + Mathf.range(20));
            }

            // TÍCH ĐỦ NỘ -> BẮN LASER ULT
            if (this.rage >= this.maxRage) {
                this.rage = 0; 
                xeanUltiLaser.create(this, this.team, this.x, this.y, this.rotation);
                customUltiExplosionFx.at(this.x, this.y);
                Effect.shake(6, 6, this.x, this.y);
            }
        },

        shoot(type) {
            this.super$shoot(type);

            this.heatSpeedBonus = Math.min(2.0, this.heatSpeedBonus + 0.05);
            this.rage = Math.min(this.maxRage, this.rage + 4);

            this.handleDamageRegen();
        },

        draw() {
            this.super$draw();

            if (Vars.headless) return; // Tránh chạy render nếu ở Dedicated Server

            let rad = this.rotation * Mathf.degRad;
            let cos = Math.cos(rad);
            let sin = Math.sin(rad);

            // Vẽ vòng ma pháp MagicTech
            Draw.z(Layer.turret - 0.01);
            dashCircle(this.x, this.y, 28 + Math.sin(Time.time * 0.05) * 2, Color.valueOf("#00e5ff"));
            
            let sideOffset = 18.0;
            for (let side of [-1, 1]) {
                let rx = this.x + Angles.trnsx(this.rotation + 90 * side, sideOffset);
                let ry = this.y + Angles.trnsy(this.rotation + 90 * side, sideOffset);
                
                Draw.color(Color.valueOf("#80d8ff"));
                Lines.poly(rx, ry, 6, 8, this.ringRotation * side);
                Draw.color(Color.white);
                Fill.circle(rx, ry, 2.5);
            }

            // Vẽ khiên chắn
            if (this.shieldScale > 0.01) {
                Draw.z(Layer.shields);
                let shieldX = this.x + cos * 20;
                let shieldY = this.y + sin * 20;

                Draw.color(Color.valueOf("#00e5ff"), 0.4 * this.shieldScale);
                Lines.stroke(2.5 * this.shieldScale);
                Lines.arc(shieldX, shieldY, 24, 0.35, this.rotation - 50);
                Draw.reset();
            }

            // Thanh Nộ (Rage Bar)
            Draw.z(Layer.effect + 1);
            let barY = this.y - 18;
            let barWidth = 28;
            
            Draw.color(Color.black, 0.6);
            Lines.stroke(3);
            Lines.line(this.x - barWidth / 2, barY, this.x + barWidth / 2, barY);

            Draw.color(Color.valueOf("#00e5ff"));
            Lines.stroke(2);
            Lines.line(this.x - barWidth / 2, barY, this.x - barWidth / 2 + (barWidth * (this.rage / this.maxRage)), barY);
            
            Draw.reset();
        }
    });
});