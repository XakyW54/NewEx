// Tên file: zenith.js
// Mô tả: Khai báo toàn bộ dàn vũ khí phức tạp của Mod bằng JS. Bật/tắt theo setting "newex-logic-support-units".

const dashEffect = new Effect(25, e => {
    Draw.color(Color.valueOf("#fa9238"), Color.valueOf("#ffffff"), e.fin());
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 24 * e.fin());
    Effect.shake(2, 2, e.x, e.y);
});

const zenithDataMap = new ObjectMap();

// Nơi lưu danh sách vũ khí Vanilla gốc và Vũ khí Mod JS
const vanillaWeapons = new Seq();
const customModWeapons = new Seq();

// 1. TẠO TOÀN BỘ 5 VŨ KHÍ TỪ .HJSON SANG JAVASCRIPT
function initCustomWeapons(){
    if(!customModWeapons.isEmpty()) return;

    // --- VŨ KHÍ 1: large-mm ---
    let w1 = new Weapon("large-mm");
    w1.rotate = true;
    w1.shake = 1.8;
    w1.x = 7;
    w1.y = 0;
    w1.rotateSpeed = 2;
    w1.velocityRnd = 0.1;
    w1.inaccuracy = 12;
    w1.reload = 360;

    let b1 = new MissileBulletType(3.6, 57);
    b1.keepVelocity = false;
    b1.despawnShake = 2.25;
    b1.hitShake = 2.25;
    b1.shrinkX = 0.25;
    b1.shrinkY = 0.5;
    b1.pierceCap = 2;
    b1.drag = 0.003;
    b1.height = 12;
    b1.width = 8;
    b1.splashDamageRadius = 22;
    b1.splashDamage = 42;
    b1.homingPower = 0.002;
    b1.homingRange = 40;
    b1.weaveScale = 6;
    b1.lifetime = 95;
    b1.weaveMag = 1;
    b1.trailColor = Color.valueOf("454545");
    b1.trailInterval = 2;
    b1.trailWidth = 2.5;
    w1.bullet = b1;
    customModWeapons.add(w1);

    // --- VŨ KHÍ 2: hidden-bombing-mw ---
    let w2 = new Weapon("hidden-bombing-mw");
    w2.controllable = false;
    w2.layerOffset = -0.001;
    w2.baseRotation = -55;
    w2.autoTarget = true;
    w2.alternate = false;
    w2.shootCone = 360;
    w2.mirror = true;
    w2.shake = 1.75;
    w2.shootY = 1;
    w2.x = 9;
    w2.y = -4;
    w2.velocityRnd = 0.35;
    w2.reload = 160;

    let b2 = new BasicBulletType(1.25, 0);
    b2.sprite = "mine-bullet";
    b2.despawnShake = 3.2;
    b2.hitShake = 3.2;
    b2.maxRange = 250;
    b2.pierce = true;
    b2.shrinkX = 0;
    b2.shrinkY = 0;
    b2.height = 9;
    b2.width = 9;
    b2.drag = 0.06;
    b2.buildingDamageMultiplier = 0.5;
    b2.incendChance = 0.2;
    b2.incendSpread = 12;
    b2.incendAmount = 2;
    b2.splashDamageRadius = 20;
    b2.splashDamage = 96;
    b2.status = StatusEffects.burning;
    b2.statusDuration = 120;
    b2.lifetime = 120;
    b2.spin = 0.5;
    b2.frontColor = Color.valueOf("ffaa5f");
    b2.backColor = Color.valueOf("d37f47");
    b2.trailColor = Color.valueOf("d37f47");
    b2.trailLength = 12;
    w2.bullet = b2;
    customModWeapons.add(w2);

    // --- VŨ KHÍ 3: blaster-gun ---
    let w3 = new Weapon("blaster-gun");
    w3.baseRotation = -35;
    w3.shootCone = 360;
    w3.recoil = 0.15;
    w3.top = true;
    w3.x = 4;
    w3.y = -2;
    w3.velocityRnd = 0.2;
    w3.inaccuracy = 30;
    w3.reload = 15;

    let b3 = new BasicBulletType(4, 32);
    b3.height = 9;
    b3.width = 3;
    b3.homingPower = 0.1;
    b3.homingRange = 200;
    b3.lifetime = 34.5;
    b3.pierceCap = 2;
    b3.frontColor = Color.valueOf("ffffff");
    b3.backColor = Color.valueOf("fa9238");
    b3.hitColor = Color.valueOf("fa9238");
    b3.trailColor = Color.valueOf("fa9238");
    b3.trailLength = 24.5;
    b3.trailWidth = 1.5;
    w3.bullet = b3;
    customModWeapons.add(w3);

    // --- VŨ KHÍ 4: avert-weapon ---
    let w4 = new Weapon("avert-weapon");
    w4.reload = 60;
    w4.x = 0;
    w4.y = 7.25;
    w4.layerOffset = -0.01;
    w4.rotate = false;
    w4.mirror = false;
    w4.recoil = 1;
    w4.shootY = 5;
    w4.top = false;
    w4.inaccuracy = 10;

    let b4 = new BasicBulletType(4, 34);
    b4.height = 12;
    b4.width = 7;
    b4.drag = 0.01;
    b4.velocityScaleRandMin = 0.7;
    b4.velocityScaleRandMax = 1.2;
    b4.lifetime = 42;
    b4.homingPower = 0.1;
    b4.homingRange = 30;
    b4.homingDelay = 10;
    b4.frontColor = Color.valueOf("ffffff");
    b4.backColor = Color.valueOf("fa9238");
    b4.hitColor = Color.valueOf("fa9238");
    b4.trailColor = Color.valueOf("fa9238");
    b4.trailLength = 9;
    b4.trailWidth = 1.5;
    w4.bullet = b4;
    customModWeapons.add(w4);

    // --- VŨ KHÍ 5: BẮN ĐẠN XOAY PHỨC TẠP (Vũ khí đuôi xả khói + Frag) ---
    let w5 = new Weapon();
    w5.layerOffset = 0.0001;
    w5.rotateSpeed = 0;
    w5.rotate = false;
    w5.baseRotation = 180;
    w5.reload = 9;
    w5.recoil = 0;
    w5.shake = 0;
    w5.shootY = -9;
    w5.x = 0;
    w5.top = true;
    w5.y = -2;
    w5.controllable = false;
    w5.autoTarget = true;
    w5.inaccuracy = 35;
    w5.minShootVelocity = 0.8;
    w5.alwaysShooting = true;

    // Cấp Đạn C: Đạn con khóa mục tiêu xa 320
    let subFrag = new BasicBulletType(16, 60);
    subFrag.height = 12;
    subFrag.width = 7;
    subFrag.lifetime = 20;
    subFrag.homingPower = 0.6;
    subFrag.homingRange = 320;
    subFrag.frontColor = Color.valueOf("ffffff");
    subFrag.backColor = Color.valueOf("fa9238");
    subFrag.hitColor = Color.valueOf("fa9238");
    subFrag.trailColor = Color.valueOf("fa9238");
    subFrag.trailLength = 9;
    subFrag.trailWidth = 1.5;

    // Cấp Đạn B: Đạn xoay tròn (circleShooter)
    let midFrag = new BasicBulletType(6, 60);
    midFrag.height = 12;
    midFrag.width = 7;
    midFrag.velocityScaleRandMin = 0.7;
    midFrag.velocityScaleRandMax = 1.4;
    midFrag.lifetime = 120;
    midFrag.circleShooter = true;
    midFrag.circleShooterRadius = 15;
    midFrag.circleShooterRadiusSmooth = 10;
    midFrag.circleShooterRotateSpeed = 4;
    midFrag.frontColor = Color.valueOf("ffffff");
    midFrag.backColor = Color.valueOf("fa9238");
    midFrag.hitColor = Color.valueOf("fa9238");
    midFrag.trailColor = Color.valueOf("fa9238");
    midFrag.trailLength = 9;
    midFrag.trailWidth = 1.5;
    midFrag.fragBullets = 1;
    midFrag.fragVelocityMin = 1;
    midFrag.fragBullet = subFrag;

    // Cấp Đạn A: Đạn chính xả ra từ đít
    let mainBullet = new BasicBulletType(2.0, 60);
    mainBullet.height = 12;
    mainBullet.width = 7;
    mainBullet.drag = 0.07;
    mainBullet.keepVelocity = false;
    mainBullet.velocityScaleRandMin = 0.7;
    mainBullet.velocityScaleRandMax = 2.1;
    mainBullet.lifetime = 30;
    mainBullet.frontColor = Color.valueOf("ffffff");
    mainBullet.backColor = Color.valueOf("fa9238");
    mainBullet.hitColor = Color.valueOf("fa9238");
    mainBullet.trailColor = Color.valueOf("fa9238");
    mainBullet.trailLength = 15;
    mainBullet.trailWidth = 1.5;
    mainBullet.fragBullets = 1;
    mainBullet.fragBullet = midFrag;

    w5.bullet = mainBullet;
    customModWeapons.add(w5);
}

// 2. TẢI CLIENT VÀ SAO CHÉP VŨ KHÍ VANILLA GỐC
Events.on(ClientLoadEvent, () => {
    let zenith = UnitTypes.zenith;
    if(!zenith) return;

    // Lưu lại bộ vũ khí tên lửa chuẩn Vanilla
    if(zenith.weapons != null && !zenith.weapons.isEmpty()){
        zenith.weapons.each(w => {
            vanillaWeapons.add(w.copy());
        });
    }

    // Khởi tạo bộ vũ khí Mod JS
    initCustomWeapons();
});

// 3. CHUYỂN ĐỔI BẬT / TẮT KHI VÀO BẢN ĐỒ
Events.on(WorldLoadEvent, () => {
    let zenith = UnitTypes.zenith;
    if(!zenith) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    zenith.weapons.clear();
    if(isEnabled){
        // --- BẬT: Nạp dàn 5 vũ khí Mod JS ---
        zenith.weapons.addAll(customModWeapons);
    } else {
        // --- TẮT: Trả về tên lửa Vanilla ---
        zenith.weapons.addAll(vanillaWeapons);
    }
});

// 4. KỸ NĂNG DASH 2 GIÂY (CHỈ CHẠY KHI BẬT CÔNG TẮC)
Events.run(Trigger.update, () => {
    if(Vars.state.isPaused() || Vars.state.isMenu()) return;
    if(!Core.settings.getBool("newex-logic-support-units", true)) return;

    Groups.unit.each(u => {
        if(!u || u.dead || u.type != UnitTypes.zenith) return;

        if(!zenithDataMap.containsKey(u.id)){
            zenithDataMap.put(u.id, {
                moveTimer: 0,
                lastX: u.x,
                lastY: u.y
            });
        }

        let data = zenithDataMap.get(u.id);
        let isMoving = Mathf.dst(u.x, u.y, data.lastX, data.lastY) > 0.05;
        data.lastX = u.x;
        data.lastY = u.y;

        if(isMoving){
            data.moveTimer += Time.delta;

            if(data.moveTimer >= 120){
                data.moveTimer = 0;

                let angle = u.rotation;
                let dashDistance = 80;
                let targetX = u.x + Angles.trnsx(angle, dashDistance);
                let targetY = u.y + Angles.trnsy(angle, dashDistance);

                dashEffect.at(u.x, u.y);
                u.set(targetX, targetY);
                u.vel.trns(angle, 4.5);
                dashEffect.at(targetX, targetY);
            }
        } else {
            data.moveTimer = 0;
        }
    });
});

Events.on(EventType.UnitDestroyEvent, event => {
    let u = event.unit;
    if(u && u.type == UnitTypes.zenith){
        zenithDataMap.remove(u.id);
    }
});