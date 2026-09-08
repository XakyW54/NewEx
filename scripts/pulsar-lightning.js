// Tên file: pulsar-lightning.js
// Mô tả: Sửa lỗi StackOverflowError bằng cách thay thế override hit/despawn bằng deselect/hitTile/hitEntity an toàn.

const pulsarGreen = Color.valueOf("#84f491");
const pulsarGreenLight = Color.valueOf("#c0ffc8");

// 1. HIỆU ỨNG VẼ TIA ĐIỆN VÀ SÓNG XUNG KÍCH
const greenLightningEffect = new Effect(14, e => {
    if(!(e.data instanceof Seq)) return;
    const points = e.data;
    let thickness = e.rotation > 0 ? e.rotation : 2.5;
    Draw.color(pulsarGreen, Color.white, e.fin());
    Lines.stroke(thickness * e.fout());
    for(let i = 0; i < points.size - 1; i++){
        let a = points.get(i);
        let b = points.get(i + 1);
        Lines.line(a.x, a.y, b.x, b.y, false);
    }
});

const greenShockwaveEffect = new Effect(30, e => {
    Draw.color(pulsarGreen);
    Lines.stroke(2.0 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 25);
    Draw.reset();
});

function createGreenLightning(x1, y1, x2, y2, thickness){
    let dst = Mathf.dst(x1, y1, x2, y2);
    let segs = Math.max(4, Math.floor(dst / 7));
    let points = new Seq();
    points.add(new Vec2(x1, y1));
    let angle = Angles.angle(x1, y1, x2, y2);

    for(let i = 1; i < segs; i++){
        let t = i / segs;
        let px = Mathf.lerp(x1, x2, t);
        let py = Mathf.lerp(y1, y2, t);
        let noise = Mathf.range(8) * (1 - t);

        Tmp.v1.trns(angle + 90, noise);
        points.add(new Vec2(px + Tmp.v1.x, py + Tmp.v1.y));
    }
    points.add(new Vec2(x2, y2));
    
    greenLightningEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
}

// Xử lý kích hoạt tia điện khi va chạm
function triggerLightningCluster(b){
    if(!b || b.data === true) return; 
    b.data = true;

    greenShockwaveEffect.at(b.x, b.y);

    let range = 110;
    let targets = new Seq();

    Units.nearbyEnemies(b.team, b.x - range, b.y - range, range * 2, range * 2, enemy => {
        if(enemy && !enemy.dead && Mathf.dst(b.x, b.y, enemy.x, enemy.y) <= range){
            targets.add(enemy);
        }
    });

    targets.sort(new Floatf({ get: u => Mathf.dst(b.x, b.y, u.x, u.y) }));
    let count = Math.min(10, targets.size);

    for(let i = 0; i < count; i++){
        let target = targets.get(i);
        createGreenLightning(b.x, b.y, target.x, target.y, 2.5);
        target.damage(12);
        target.apply(StatusEffects.shocked, 120);
    }

    let remaining = 10 - count;
    for(let k = 0; k < remaining; k++){
        let angle = (360 / 10) * (count + k) + Mathf.range(15);
        let tx = b.x + Angles.trnsx(angle, range * 0.7);
        let ty = b.y + Angles.trnsy(angle, range * 0.7);
        createGreenLightning(b.x, b.y, tx, ty, 2.0);
    }
}

// 2. CẤU HÌNH STATS VÀ ĐẠN CHO PULSAR
Events.on(ContentInitEvent, () => {
    const pulsar = UnitTypes.pulsar;
    if(!pulsar) return;

    // A. CHỈ SỐ CƠ BẢN
    pulsar.speed *= 1.5;            // +50% Tốc độ di chuyển
    pulsar.health *= 1.15;          // Giảm 15% sát thương nhận vào (tương đương +15% HP)
    pulsar.armor += 3;              // Cộng thêm giáp chống chịu

    // B. KHẮC PHỤC LỖI STACKOVERFLOW: Khai báo BulletType bằng cách gán sự kiện va chạm chuẩn
    const greenOrbBullet = extend(BasicBulletType, {
        hitEntity(b, entity, health){
            triggerLightningCluster(b);
        },
        hitTile(b, tile, build, x, y, hitx, hity, param){
            triggerLightningCluster(b);
        },
        despawn(b){
            triggerLightningCluster(b);
        }
    });

    greenOrbBullet.speed = 4.0;
    greenOrbBullet.damage = 14;
    greenOrbBullet.lifetime = 35;
    greenOrbBullet.width = 10;
    greenOrbBullet.height = 10;
    greenOrbBullet.shrinkX = 0;
    greenOrbBullet.shrinkY = 0;
    greenOrbBullet.frontColor = pulsarGreenLight;
    greenOrbBullet.backColor = pulsarGreen;
    greenOrbBullet.trailColor = pulsarGreen;
    greenOrbBullet.trailWidth = 2.2;
    greenOrbBullet.trailLength = 7;

    // C. CẤU HÌNH VŨ KHÍ PULSAR
    if(pulsar.weapons && pulsar.weapons.size > 0){
        for(let i = 0; i < pulsar.weapons.size; i++){
            let w = pulsar.weapons.get(i);
            w.reload /= 1.5; // +50% Tốc độ bắn

            if(w.bullet){
                w.bullet.fragBullet = greenOrbBullet;
                w.bullet.fragBullets = 3;
                w.bullet.fragVelocityMin = 0.8;
                w.bullet.fragVelocityMax = 1.2;
                w.bullet.fragRandomSpread = 25;
            }
        }
    }
});