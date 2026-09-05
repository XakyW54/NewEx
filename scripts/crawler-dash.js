// ----------------------------------------------------
// HIỆU ỨNG VỤ NỔ CỦA PHÁO INDENITER
// ----------------------------------------------------
function createIndeniterExplosionFx(radius, colorHex) {
    let col = colorHex ? Color.valueOf(colorHex) : Color.valueOf("#ff3300");
    return new Effect(50, cons(e => {
        Draw.z(Layer.effect + 0.1);
        let maxRadius = radius;
        let alpha = 1.0 - e.fin();

        Draw.color(col);
        Draw.alpha(alpha * 0.35);
        Fill.circle(e.x, e.y, maxRadius);

        Draw.color(col);
        Draw.alpha(alpha * 0.7);
        Lines.stroke(2.5 * alpha);
        Lines.circle(e.x, e.y, maxRadius);

        const ringColors = [
            Color.valueOf("#ffffff"), 
            Color.valueOf("#ffcc00"), 
            col 
        ];

        for (let i = 0; i < 3; i++) {
            let delay = i * 0.12;
            if (e.fin() > delay) {
                let progress = (e.fin() - delay) / (1.0 - delay);
                let smoothProgress = Interp.pow3Out.apply(progress);
                let dynamicRadius = maxRadius * smoothProgress;

                Draw.color(ringColors[i]);
                Draw.alpha(alpha * (1.0 - smoothProgress));
                Lines.stroke((14.0 - i * 3.0) * (1.0 - smoothProgress));
                Lines.circle(e.x, e.y, dynamicRadius);
            }
        }

        Draw.reset();
    }));
}

// Effect vụ nổ Indeniter 15 ô (120px) và 20 ô (160px)
const fxIndeniter15 = createIndeniterExplosionFx(120, "#ff6b35");
const fxIndeniter20 = createIndeniterExplosionFx(160, "#ff3300");

// Effect lướt
const dashStartFx = new Effect(25, cons(e => {
    Draw.z(Layer.effect);
    Draw.color(Color.valueOf("ffa665"), Color.gray, e.fin());
    for (let i = 0; i < 4; i++) {
        let seed = e.id + i;
        let angle = e.rotation + 180 + Mathf.randomSeed(seed, -30, 30);
        let dist = e.fin() * (12 + Mathf.randomSeed(seed + 1, 0, 8));
        let px = e.x + Angles.trnsx(angle, dist);
        let py = e.y + Angles.trnsy(angle, dist);
        let size = (3 + Mathf.randomSeed(seed + 2, 0, 2)) * e.fout();
        Fill.circle(px, py, size);
    }
    Draw.reset();
}));

// ----------------------------------------------------
// BỘ LƯU TRỮ DỮ LIỆU & VÒNG LẶP CHÍNH
// ----------------------------------------------------
const crawlerData = {};

Timer.schedule(() => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;

    let crawlerType = Vars.content.getByName(ContentType.unit, "crawler");
    if (crawlerType == null) return;

    Groups.unit.each(u => {
        if (u != null && u.isValid() && u.type == crawlerType) {
            let id = u.id;

            if (!crawlerData[id]) {
                crawlerData[id] = { 
                    moveTimer: 0, 
                    dashCooldown: 0, 
                    speedBoost: 0 
                };
            }

            let data = crawlerData[id];

            if (data.dashCooldown > 0) {
                data.dashCooldown -= Time.delta;
            }

            let isMoving = u.vel != null && u.vel.len() > 0.01;

            if (isMoving) {
                // TĂNG TỐC AN TOÀN (GIỚI HẠN VẬN TỐC TỐI ĐA ĐỂ TRÁNH TRƯỢT XUYÊN TƯỜNG)
                data.speedBoost = Mathf.approach(data.speedBoost, 1.0, 0.005 * Time.delta);
                if (u.vel.len() < crawlerType.speed * 1.5) {
                    u.vel.scl(1.0 + data.speedBoost * 0.02);
                }

                data.moveTimer += Time.delta;

                // TÌM KẺ ĐỊCH TRONG PHẠM VI 20 Ô (160 PIXELS)
                let target = Units.closestTarget(u.team, u.x, u.y, 160, e => e.checkTarget(true, true));

                if (target != null && data.dashCooldown <= 0) {
                    performTargetDashAndExplode(u, target);
                    data.moveTimer = 0;
                    data.dashCooldown = 120.0;
                } else if (data.moveTimer >= 120.0 && data.dashCooldown <= 0) {
                    performNormalDash(u);
                    data.moveTimer = 0;
                    data.dashCooldown = 120.0;
                }
            } else {
                data.speedBoost = Mathf.approach(data.speedBoost, 0.0, 0.02 * Time.delta);
                data.moveTimer = 0;
            }
        }
    });
}, 0, 0.016);

// GIẢM 100% SÁT THƯƠNG NHẬN VÀO
Events.on(UnitDamageEvent, cons(e => {
    let unit = e.unit;
    let crawlerType = Vars.content.getByName(ContentType.unit, "crawler");
    if (unit != null && unit.isValid() && crawlerType != null && unit.type == crawlerType) {
        unit.health = Math.min(unit.maxHealth, unit.health + e.damage);
    }
}));

// DASH THƯỜNG -> NỔ 15 Ô (100 DMG)
function performNormalDash(unit) {
    let dashDistance = 40; // 5 ô
    let angle = unit.rotation;
    let targetX = unit.x + Angles.trnsx(angle, dashDistance);
    let targetY = unit.y + Angles.trnsy(angle, dashDistance);

    // Kiểm tra chướng ngại vật trước khi di chuyển
    let safePos = getSafeDashPosition(unit.x, unit.y, targetX, targetY, angle, dashDistance);
    if (safePos.x !== unit.x || safePos.y !== unit.y) {
        dashStartFx.at(unit.x, unit.y, angle);
        unit.set(safePos.x, safePos.y);
        explodeAt(unit, safePos.x, safePos.y, 120, 100, fxIndeniter15);
    }
}

// DASH MỤC TIÊU -> KIỂM TRA TƯỜNG TRƯỚC KHI TỚI GẦN
function performTargetDashAndExplode(unit, target) {
    let angle = unit.angleTo(target);
    let dist = Mathf.dst(unit.x, unit.y, target.x, target.y);
    
    // Tìm vị trí an toàn xa nhất trên đường lướt tới mục tiêu
    let safePos = getSafeDashPosition(unit.x, unit.y, target.x, target.y, angle, dist);

    dashStartFx.at(unit.x, unit.y, angle);
    unit.set(safePos.x, safePos.y);

    explodeAt(unit, safePos.x, safePos.y, 120, 100, fxIndeniter15);
    explodeAt(unit, safePos.x, safePos.y, 160, 200, fxIndeniter20);
}

// XỬ LÝ SÁT THƯƠNG
function explodeAt(unit, x, y, radiusPixels, damage, fxEffect) {
    fxEffect.at(x, y);
    Effect.shake(5, 5, x, y);
    Damage.damage(unit.team, x, y, radiusPixels, damage, true, true);
}

// TÌM TỌA ĐỘ LƯỚT AN TOÀN KHÔNG CHẠM TƯỜNG
function getSafeDashPosition(startX, startY, targetX, targetY, angle, maxDist) {
    let steps = 10;
    let lastSafeX = startX;
    let lastSafeY = startY;

    for (let i = 1; i <= steps; i++) {
        let checkX = startX + Angles.trnsx(angle, (maxDist / steps) * i);
        let checkY = startY + Angles.trnsy(angle, (maxDist / steps) * i);
        
        let tile = Vars.world.tileWorld(checkX, checkY);
        // Nếu chạm tường hoặc công trình thì dừng tại điểm an toàn trước đó
        if (tile == null || tile.build != null || (tile.block() != null && tile.block().solid)) {
            break;
        }
        lastSafeX = checkX;
        lastSafeY = checkY;
    }

    return { x: lastSafeX, y: lastSafeY };
}

// DỌN DẸP BỘ NHỚ
Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null && crawlerData[e.unit.id]) {
        delete crawlerData[e.unit.id];
    }
}));