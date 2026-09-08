// Tên file: corvus.js
// Vị trí: scripts/corvus.js

const laserColor = Color.valueOf("84f491"); 

const spacing13TilesPx = 13 * 8; // 104px (khoảng cách 13 ô)
const maxCircleRadiusPx = (33 * 8) / 2; // Giảm kích thước vòng laser xuống 1/2

const chargingUnits = new Set();
const activeLightningZones = [];

// =========================================================================
// THUẬT TOÁN VẼ VÒNG TRÒN MÉO CHUẨN TỪ REGUILATER.JS
// =========================================================================
function drawReguLaserRing(cx, cy, radiusX, radiusY, laserAngle, strokeWidth, color, isFill){
    Draw.color(color); 
    if(!isFill) Lines.stroke(strokeWidth);
    let steps = 24; let lastX = 0, lastY = 0;
    let cosA = Math.cos(laserAngle * Mathf.degRad); 
    let sinA = Math.sin(laserAngle * Mathf.degRad);
    
    if(isFill) {
        for(let r = radiusY; r > 0; r -= 2.0) {
            let curRadX = (r / radiusY) * radiusX;
            for(let i = 0; i <= steps; i++){
                let angle = (i * (360 / steps)) * Mathf.degRad;
                let lx = Math.cos(angle) * curRadX; 
                let ly = Math.sin(angle) * r;
                let rx = cx + (lx * cosA - ly * sinA); 
                let ry = cy + (lx * sinA + ly * cosA);
                if(i > 0) Lines.line(lastX, lastY, rx, ry);
                lastX = rx; lastY = ry;
            }
        }
    } else {
        for(let i = 0; i <= steps; i++){
            let angle = (i * (360 / steps)) * Mathf.degRad;
            let lx = Math.cos(angle) * radiusX; 
            let ly = Math.sin(angle) * radiusY;
            let rx = cx + (lx * cosA - ly * sinA); 
            let ry = cy + (lx * sinA + ly * cosA);
            if(i > 0) Lines.line(lastX, lastY, rx, ry);
            lastX = rx; lastY = ry;
        }
    }
}

// 1. HIỆU ỨNG 1 VÒNG MÉO TỪ PHÍA TRƯỚC HÚT VỀ TÂM (Thời lượng 20 Ticks)
const corvusFrontSingleRingEffect = new Effect(20, e => {
    let fout = e.fout();

    let rad = e.rotation * Mathf.degRad;
    let cosA = Math.cos(rad);
    let sinA = Math.sin(rad);

    let currentOffset = fout * (spacing13TilesPx * 0.9); 
    let cx = e.x + cosA * currentOffset;
    let cy = e.y + sinA * currentOffset;

    let radX = fout * 16; 
    let radY = fout * 45;

    drawReguLaserRing(cx, cy, radX, radY, e.rotation, 3.0 * fout, laserColor, false);
});

// 2. HIỆU ỨNG VÒNG LỚN ZOOM TỪ NGOÀI VÀO TÂM (60 Ticks)
const corvusBigOuterRingEffect = new Effect(60, e => {
    let fout = e.fout();
    let fin = e.fin();

    let outerRingRadius = fout * 70; 
    Draw.color(Color.white, laserColor, fin);
    Lines.stroke(3.5 * fout);
    Lines.circle(e.x, e.y, outerRingRadius);
    Draw.reset();
});

// 3. HIỆU ỨNG HẠT TRÒN BẮT ĐẦU BAY LIÊN TỤC VÀO TÂM (Tần suất dày đặc)
const corvusContinuousParticleEffect = new Effect(25, e => {
    let fout = e.fout();
    let fin = e.fin();

    Draw.color(laserColor, Color.white, fin);
    for(let i = 0; i < 5; i++){
        let pAngle = Mathf.randomSeed(e.id * 3 + i, 0, 360); 
        let startDist = Mathf.randomSeed(e.id * 5 + i, 30, 110);
        let currentDist = startDist * fout; 
        
        let px = e.x + Angles.trnsx(pAngle, currentDist);
        let py = e.y + Angles.trnsy(pAngle, currentDist);
        
        // Kích thước ngẫu nhiên từ 1px đến 8px (1 ô)
        let particleSize = Mathf.randomSeed(e.id * 7 + i, 0.5, 4.0) * fout;
        
        Fill.circle(px, py, particleSize);
    }
    Draw.reset();
});

// 4. HIỆU ỨNG VÒNG MÉO TRÊN ĐƯỜNG LASER KHI BẮN
const corvusLaserZoomEffect = new Effect(40, e => {
    let fin = e.fin();
    let fout = e.fout();

    let expandProgress = Interp.pow2Out.apply(fin);
    let targetRadX = (5 + (maxCircleRadiusPx - 5) * expandProgress) * 0.4;
    let targetRadY = (5 + (maxCircleRadiusPx - 5) * expandProgress);

    drawReguLaserRing(e.x, e.y, targetRadX, targetRadY, e.rotation, 3.5 * fout, Color.white, false);
    drawReguLaserRing(e.x, e.y, targetRadX * 0.7, targetRadY * 0.7, e.rotation, 2.0 * fout, laserColor, false);
    Draw.reset();
});

// 5. HIỆU ỨNG KHÓI BỐC LÊN KHI BẮN
const corvusMuzzleSmokeEffect = new Effect(60, e => {
    Draw.color(Color.gray, laserColor, e.fout());
    Angles.randLenVectors(e.id, 16, 50 * e.finpow(), e.rotation, 45, (x, y) => {
        Fill.circle(e.x + x, e.y + y, (3.5 + Mathf.randomSeed(e.id, 2, 5)) * e.fout());
    });
    Draw.reset();
});

// 6. HÀM KÍCH HOẠT CHUỖI 3 VÒNG MÉO CHUẨN ĐỒNG BỘ TỚI PHÁT BẮN
function startTripleChargeProcess(gunX, gunY, rotation){
    // Vòng tròn lớn zoom ngoài vào tâm
    corvusBigOuterRingEffect.at(gunX, gunY, rotation);

    // Vòng méo 1 (0 -> 20 Ticks)
    corvusFrontSingleRingEffect.at(gunX, gunY, rotation);

    // Vòng méo 2 (20 -> 40 Ticks)
    Time.run(20, () => {
        corvusFrontSingleRingEffect.at(gunX, gunY, rotation);
    });

    // Vòng méo 3 (40 -> 60 Ticks - Vừa chạm tâm là phát bắn nổ ra)
    Time.run(40, () => {
        corvusFrontSingleRingEffect.at(gunX, gunY, rotation);
    });
}

// 7. HÀM KÍCH HOẠT KHI BẮN
function triggerCorvusShotFeatures(team, gunX, gunY, rotation){
    // Khói bốc lên tại nòng
    corvusMuzzleSmokeEffect.at(gunX, gunY, rotation);

    // 12 vòng méo nối tiếp trên đường laser
    for(let c = 1; c <= 12; c++){
        let dist = c * spacing13TilesPx;
        let px = gunX + Angles.trnsx(rotation, dist);
        let py = gunY + Angles.trnsy(rotation, dist);

        Time.run(c * 1.5, () => {
            corvusLaserZoomEffect.at(px, py, rotation);
        });
    }

    // Vùng nhiễm điện 10s gây sát thương
    for(let d = 32; d < 1200; d += 48){
        let ex = gunX + Angles.trnsx(rotation, d);
        let ey = gunY + Angles.trnsy(rotation, d);

        activeLightningZones.push({
            x: ex,
            y: ey,
            team: team,
            life: 600,
            maxLife: 600,
            id: Mathf.random(10000)
        });
    }
}

// 8. THIẾT LẬP CORVUS
Events.on(ContentInitEvent, () => {
    const corvus = UnitTypes.corvus;
    if(!corvus || !corvus.weapons) return;

    for(let i = 0; i < corvus.weapons.size; i++){
        let w = corvus.weapons.get(i);
        w.cooldownTime = 220;

        if(w.bullet){
            let b = w.bullet;

            b.chargeEffect = Fx.none;
            b.shootEffect = Fx.none;

            b.damage *= 6.0;
            if(b.length !== undefined) b.length *= 3.0;
            if(b.width !== undefined) b.width *= 2.0;

            b.pierceArmor = true;
            b.absorbable = false;
        }
    }
});

// 9. VÒNG LẶP UPDATE CHÍNH (SPAWN HẠT TRÒN TỪNG TICK)
Events.run(Trigger.update, () => {
    if(Vars.state.isPaused()) return;

    const corvus = UnitTypes.corvus;
    if(!corvus) return;

    Groups.unit.each(u => {
        if(u.type === corvus && !u.dead && u.mounts){
            for(let i = 0; i < u.mounts.length; i++){
                let mount = u.mounts[i];
                let weapon = mount.weapon;

                let gunX = u.x + Angles.trnsx(u.rotation - 90, weapon.x, weapon.y);
                let gunY = u.y + Angles.trnsy(u.rotation - 90, weapon.x, weapon.y);

                let key = u.id + "_" + i;

                if(mount.charging){
                    // A. Kích hoạt chuỗi 3 vòng méo chuẩn thời gian khi bắt đầu gồng
                    if(!chargingUnits.has(key)){
                        chargingUnits.add(key);
                        startTripleChargeProcess(gunX, gunY, u.rotation);
                    }

                    // B. TẠO HẠT TRÒN HÚT VÀO TÂM LIÊN TỤC TRONG TOÀN BỘ THỜI GIAN GỒNG LỰC
                    if(Time.time % 2 < 1){ // Cứ 2 ticks spawn 1 đợt hạt mới liên tục
                        corvusContinuousParticleEffect.at(gunX, gunY, u.rotation);
                    }
                } 
                else if(chargingUnits.has(key)){
                    triggerCorvusShotFeatures(u.team, gunX, gunY, u.rotation);
                    chargingUnits.delete(key);
                }
            }
        }
    });

    // Cập nhật vùng nhiễm điện 10 giây (Gây sát thương)
    for(let i = activeLightningZones.length - 1; i >= 0; i--){
        let zone = activeLightningZones[i];
        zone.life -= Time.delta;

        if(zone.life <= 0){
            activeLightningZones.splice(i, 1);
            continue;
        }

        if(Mathf.chance(0.25)){
            let pAngle = Mathf.random(360);
            Lightning.create(zone.team, laserColor, 25, zone.x, zone.y, pAngle, 12);
            Damage.damage(zone.team, zone.x, zone.y, 32, 35, false, true);
        }
    }
});