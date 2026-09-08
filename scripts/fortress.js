// Tên file: fortress.js
// Mô tả: Đạn Fortress hình tứ giác rỗng lõi nghiêng 45 độ, kích thước nhỏ gấp đôi, zoom từ ngoài vào tâm

const lightOrange = Color.valueOf("ffc27d");
const deepOrange = Color.valueOf("ffa85c");

// 1. HIỆU ỨNG TỰ VẼ (KHÔNG DÙNG Fx)
const customHitEffect = new Effect(15, e => {
    Draw.color(lightOrange, deepOrange, e.fin());
    Lines.stroke(1.2 * e.fout());
    Lines.square(e.x, e.y, 1.5 + e.fin() * 6, 45);
});

const customDespawnEffect = new Effect(12, e => {
    Draw.color(lightOrange);
    Lines.stroke(0.8 * e.fout());
    Lines.square(e.x, e.y, 1.0 + e.fin() * 4, 45);
});

const customHealEffect = new Effect(20, e => {
    Draw.color(Color.valueOf("84f491"));
    Lines.stroke(1.5 * e.fout());
    Lines.square(e.x, e.y, 2 + e.fin() * 8, 45);
});

const customCritEffect = new Effect(25, e => {
    Draw.color(Color.white, lightOrange, e.fin());
    Lines.stroke(2.0 * e.fout());
    Lines.square(e.x, e.y, 3 + e.fin() * 9, 45);
});

// Trạng thái Buff của Fortress
const fortressBuffMap = new ObjectMap();

const orbitBullet = extend(BasicBulletType, {
    height: 6, // Giảm kích thước va chạm nhỏ gấp đôi (12 -> 6)
    width: 6,
    damage: 32,
    speed: 0,
    lifetime: 600, // Tồn tại 10 giây
    pierceCap: 2,

    homingPower: 0.08,
    homingRange: 400,

    frontColor: Color.valueOf("ffffff"),
    backColor: lightOrange,
    hitColor: deepOrange,
    trailColor: lightOrange,

    trailLength: 18,
    trailWidth: 1.0,

    lightColor: lightOrange,
    lightOpacity: 0.7,
    lightRadius: 16,

    hitEffect: customHitEffect,
    despawnEffect: customDespawnEffect,
    smokeEffect: Fx.none,

    init(b){
        if(!b) return;
        this.super$init(b);

        if(b.owner){
            let unitId = b.owner.id;
            if(!fortressBuffMap.containsKey(unitId)){
                fortressBuffMap.put(unitId, {
                    buffTimer: 0,
                    speedStacks: 0,
                    speedTimer: 0,
                    baseSpeed: b.owner.type.speed
                });
            }

            b.data = {
                startAngle: b.time * 15 + Mathf.random(360),
                currentRadius: 24,
                maxRadius: 48,
                orbitSpeed: 8,
                isHoming: false
            };
        }
    },

    update(b){
        this.super$update(b);
        if(!b) return;

        if(!b.data){
            b.data = {
                startAngle: 0,
                currentRadius: 24,
                maxRadius: 48,
                orbitSpeed: 8,
                isHoming: false
            };
        }

        let target = Units.closestTarget(b.team, b.x, b.y, this.homingRange, u => u && !u.dead, t => true);
        if(target != null){
            b.data.isHoming = true;
        }

        if(b.data.isHoming && target != null){
            let moveSpeed = 6.0;
            let targetAngle = Angles.angle(b.x, b.y, target.x, target.y);
            
            let newAngle = Angles.moveToward(b.rotation(), targetAngle, 5);
            b.rotation(newAngle);

            let nextX = b.x + Angles.trnsx(newAngle, moveSpeed);
            let nextY = b.y + Angles.trnsy(newAngle, moveSpeed);
            b.set(nextX, nextY);
        } 
        else if(b.owner && !b.owner.dead){
            if(b.data.currentRadius < b.data.maxRadius){
                b.data.currentRadius = Mathf.lerpDelta(b.data.currentRadius, b.data.maxRadius, 0.05);
            }

            let currentAngle = b.data.startAngle + (b.time * b.data.orbitSpeed);
            let targetX = b.owner.x + Angles.trnsx(currentAngle, b.data.currentRadius);
            let targetY = b.owner.y + Angles.trnsy(currentAngle, b.data.currentRadius);

            b.set(targetX, targetY);
            b.rotation(currentAngle + 90);
        }
    },

    // 2. VẼ TỨ GIÁC NHỎ GẤP ĐÔI VÀ CÓ GÓC NGHIÊNG 45 ĐỘ
    draw(b){
        if(!b) return;

        let spawnProgress = Mathf.clamp(b.time / 15);
        
        // Kích thước nhỏ gấp đôi: Zoom từ 10px về 3px ở tâm
        let outerZoomSize = Mathf.lerp(10, 3, spawnProgress);
        let innerSize = 3;

        // Góc nghiêng cố định 45 độ làm hình thoi nghiêng
        let tiltAngle = b.rotation() + 45;

        Lines.stroke(1.2);
        Draw.color(lightOrange);

        // Khung thu nhỏ từ ngoài vào với góc nghiêng
        Lines.square(b.x, b.y, outerZoomSize, tiltAngle + (1 - spawnProgress) * 45);

        // Khung tứ giác rỗng tâm nhỏ nghiêng
        if(spawnProgress > 0.3){
            Draw.color(Color.white);
            Lines.square(b.x, b.y, innerSize, tiltAngle);
        }

        Draw.reset();
    },

    hitEntity(b, other, initialHealth){
        this.super$hitEntity(b, other, initialHealth);

        if(b.owner && !b.owner.dead){
            let owner = b.owner;
            let unitId = owner.id;

            // Hồi 1% máu tối đa
            owner.heal(owner.maxHealth * 0.01);
            customHealEffect.at(owner.x, owner.y);

            let buffData = fortressBuffMap.get(unitId);
            if(buffData){
                buffData.buffTimer = 300;

                if(buffData.speedStacks < 10){
                    buffData.speedStacks += 1;
                }
                buffData.speedTimer = 300;
            }

            let baseDmg = this.damage * 1.20;
            let isCrit = Mathf.chance(0.20);

            let finalDamage = baseDmg;
            if(isCrit){
                finalDamage = baseDmg * 1.20;
                customCritEffect.at(other.x, other.y);
            }

            other.damage(finalDamage);
        }
    }
});

// Quản lý đếm ngược Buff & Tốc độ di chuyển
Events.run(Trigger.update, () => {
    Groups.unit.each(u => {
        if(u.type == UnitTypes.fortress && fortressBuffMap.containsKey(u.id)){
            let data = fortressBuffMap.get(u.id);

            if(data.buffTimer > 0){
                data.buffTimer--;
            }

            if(data.speedTimer > 0){
                data.speedTimer--;
                let speedMultiplier = 1.0 + (data.speedStacks * 0.10);
                u.speedMultiplier = speedMultiplier; 
            } else {
                data.speedStacks = 0;
                u.speedMultiplier = 1.0;
            }
        }
    });
});

// Cấu hình Fortress tự động bắn
Events.on(ClientLoadEvent, () => {
    let fortress = UnitTypes.fortress;
    if(fortress != null){
        fortress.targetFlags = null;
        
        if(fortress.weapons.size > 0){
            fortress.weapons.each(w => {
                w.bullet = orbitBullet;
                w.alwaysShooting = true;
                w.alwaysContinuous = true;
                w.shootCone = 360;
                w.rotate = true;
                w.rotateSpeed = 15;
                w.reload = 45;
                w.aiControllable = true;
            });
        }
    }
});