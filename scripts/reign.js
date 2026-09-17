// Tên file: reign.js
// Mô tả: Reign duy nhất/team, khóa sát thương 500 DMG/lần, bảo hộ chống bị kill tức thì & bất tử chỉ kích hoạt 1 lần.

const reignYellowWhite = Color.valueOf("#fff5cc");
const reignSoftGold = Color.valueOf("#fffbbf");
const reignWhite = Color.valueOf("#ffffff");

// 1. HIỆU ỨNG VỤ NỔ INDENITER CỦA BUFF F (Màu vàng trắng nhạt)
function createIndeniterExplosionEffect(radius) {
    return new Effect(50, e => {
        Draw.z(Layer.effect + 0.1);
        let maxRadius = radius;
        let alpha = 1.0 - e.fin();

        Draw.color(reignYellowWhite);
        Draw.alpha(alpha * 0.35);
        Fill.circle(e.x, e.y, maxRadius);

        Draw.color(reignSoftGold);
        Draw.alpha(alpha * 0.7);
        Lines.stroke(2.5 * alpha);
        Lines.circle(e.x, e.y, maxRadius);

        const ringColors = [
            reignWhite, 
            reignSoftGold, 
            reignYellowWhite 
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
    });
}

// 2. TỰ VẼ HIỆU ỨNG CHỮ CÁI NẢY LÊN (FLOATING LETTER EFFECT)
function createFloatingLetterEffect(letter, color) {
    return new Effect(40, e => {
        Draw.color(color);
        let offsetY = e.finpow() * 25;
        let scale = 1.0 + Math.sin(e.fin() * Math.PI) * 0.5;

        Lines.stroke(2.5 * e.fout());
        let x = e.x, y = e.y + offsetY;
        let s = 8 * scale;

        switch(letter) {
            case "A":
                Lines.line(x - s/2, y - s, x, y + s);
                Lines.line(x, y + s, x + s/2, y - s);
                Lines.line(x - s/4, y, x + s/4, y);
                break;
            case "B":
                Lines.line(x - s/2, y - s, x - s/2, y + s);
                Lines.line(x - s/2, y + s, x + s/4, y + s);
                Lines.line(x + s/4, y + s, x + s/4, y);
                Lines.line(x + s/4, y, x - s/2, y);
                Lines.line(x - s/2, y, x + s/3, y);
                Lines.line(x + s/3, y, x + s/3, y - s);
                Lines.line(x + s/3, y - s, x - s/2, y - s);
                break;
            case "C":
                Lines.line(x + s/2, y + s, x - s/2, y + s);
                Lines.line(x - s/2, y + s, x - s/2, y - s);
                Lines.line(x - s/2, y - s, x + s/2, y - s);
                break;
            case "D":
                Lines.line(x - s/2, y - s, x - s/2, y + s);
                Lines.line(x - s/2, y + s, x + s/4, y + s);
                Lines.line(x + s/4, y + s, x + s/2, y);
                Lines.line(x + s/2, y, x + s/4, y - s);
                Lines.line(x + s/4, y - s, x - s/2, y - s);
                break;
            case "E":
                Lines.line(x + s/2, y + s, x - s/2, y + s);
                Lines.line(x - s/2, y + s, x - s/2, y - s);
                Lines.line(x - s/2, y - s, x + s/2, y - s);
                Lines.line(x - s/2, y, x + s/4, y);
                break;
            case "F":
                Lines.line(x + s/2, y + s, x - s/2, y + s);
                Lines.line(x - s/2, y + s, x - s/2, y - s);
                Lines.line(x - s/2, y, x + s/4, y);
                break;
        }
    });
}

const letterAEffect = createFloatingLetterEffect("A", Color.valueOf("84f491"));
const letterBEffect = createFloatingLetterEffect("B", Color.valueOf("fffbbf"));
const letterCEffect = createFloatingLetterEffect("C", Color.valueOf("ff5d5d"));
const letterDEffect = createFloatingLetterEffect("D", Color.valueOf("e868ff"));
const letterEEffect = createFloatingLetterEffect("E", Color.valueOf("72f2ff"));
const letterFEffect = createFloatingLetterEffect("F", Color.valueOf("fff5cc"));

const reignDataMap = new ObjectMap();

// 3. CHỈ SỐ CƠ BẢN
Events.on(ClientLoadEvent, () => {
    let reign = UnitTypes.reign;
    if(reign != null){
        reign.health = 72000; // Tăng 200% máu tối đa
        reign.armor = 90;     // Giáp 90
    }
});

// 4. VÒNG LẶP UPDATE HỆ THỐNG REIGN
Events.run(Trigger.update, () => {
    let activeReignsByTeam = new ObjectMap();

    Groups.unit.each(u => {
        if(!u || u.dead || u.type != UnitTypes.reign) return;

        let teamId = u.team.id;

        // KIỂM TRA ĐIỀU KIỆN REIGN DUY NHẤT
        if(activeReignsByTeam.containsKey(teamId)){
            let primaryReign = activeReignsByTeam.get(teamId);
            if(primaryReign && !primaryReign.dead){
                primaryReign.heal(primaryReign.maxHealth);
                letterAEffect.at(primaryReign.x, primaryReign.y);
                
                // Con thứ 2 biến mất hoàn toàn
                u.remove();
                return;
            }
        } else {
            activeReignsByTeam.put(teamId, u);
        }

        // ĐÁNH DẤU LÀ CON DUY NHẤT VÀ KHỞI TẠO CÁC BIẾN BẤT TỬ (CHỈ 1 LẦN)
        if(!reignDataMap.containsKey(u.id)){
            reignDataMap.put(u.id, {
                isUniquePrimary: true,
                timerA: 0,
                timerB: 0,
                buffBTimer: 0,
                
                // Kỹ năng E (Dưới 30% HP) -> Bất tử 20s (Chỉ 1 lần)
                usedImmuneE: false,
                immuneETimer: 0,
                
                // Nội tại Bảo Hộ Chống Kill Tức Thì -> Bất tử 30s (Chỉ 1 lần)
                usedInstantKillProtection: false,
                instantKillImmuneTimer: 0,
                
                lastHealth: u.health
            });
        }

        let data = reignDataMap.get(u.id);

        // NỘI TẠI MỚI: NẾU BỊ ĐỊCH TẤN CÔNG BẰNG ĐÒN KILL TỨC THÌ (SÁT THƯƠNG QUÁ LỚN HOẶC BỊ TRỪ SẠCH MÁU VỀ 0)
        if(u.health <= 0 || (data.lastHealth - u.health > u.maxHealth * 0.9)){
            if(!data.usedInstantKillProtection){
                data.usedInstantKillProtection = true; // ĐÁNH DẤU ĐÃ DÙNG (CHỈ KÍCH HOẠT 1 LẦN)
                data.instantKillImmuneTimer = 1800;    // 30 giây bất tử (1800 ticks)
                u.health = u.maxHealth * 0.50;         // Hồi ngay 50% HP
                letterEEffect.at(u.x, u.y);
            }
        }

        // E. MÁU DƯỚI 30% -> BẤT TỬ 20S (CHỈ KÍCH HOẠT 1 LẦN)
        if(u.healthf() < 0.30 && !data.usedImmuneE){
            data.usedImmuneE = true;                   // ĐÁNH DẤU ĐÃ DÙNG (CHỈ KÍCH HOẠT 1 LẦN)
            data.immuneETimer = 1200;                  // 20 giây bất tử (1200 ticks)
            letterEEffect.at(u.x, u.y);
        }

        // XỬ LÝ CÁC ĐẠI TRẠNG THÁI BẤT TỬ
        if(data.instantKillImmuneTimer > 0){
            data.instantKillImmuneTimer--;
            u.health = Math.max(u.health, data.lastHealth);
        } else if(data.immuneETimer > 0){
            data.immuneETimer--;
            u.health = Math.max(u.health, data.lastHealth);
        } else {
            // ÉP SÁT THƯƠNG NHẬN VÀO: TỐI ĐA 500 DMG CHO MỖI LẦN TRỪ MÁU
            if(u.health < data.lastHealth){
                let rawDmg = data.lastHealth - u.health;
                
                // Khóa cứng lượng sát thương thực tế chỉ nhận tối đa 500 DMG
                let finalDamageTaken = Math.min(500, rawDmg);
                u.health = data.lastHealth - finalDamageTaken;
            }
        }
        data.lastHealth = u.health;

        // A. HỒI 70% MÁU MỖI 5 GIÂY
        data.timerA++;
        if(data.timerA >= 300){
            data.timerA = 0;
            u.heal(u.maxHealth * 0.70);
            letterAEffect.at(u.x, u.y);
        }

        // B. MỖI 2S CÓ 60% TỈ LỆ TĂNG 5000% TỐC ĐỘ XẢ ĐẠN TRONG 2S
        data.timerB++;
        if(data.timerB >= 120){
            data.timerB = 0;
            if(Mathf.chance(0.60)){
                data.buffBTimer = 120;
                letterBEffect.at(u.x, u.y);
            }
        }

        if(data.buffBTimer > 0){
            data.buffBTimer--;
            u.reloadMultiplier = 50.0;
            if(u.mounts && u.mounts.length > 0){
                for(let i = 0; i < u.mounts.length; i++){
                    let mount = u.mounts[i];
                    mount.reload = Math.max(0, mount.reload - 49 * Time.delta);
                }
            }
        } else {
            u.reloadMultiplier = 1.0;
        }

        // C. MÁU DƯỚI 50% -> TĂNG 500% DMG
        if(u.healthf() < 0.50){
            u.damageMultiplier = 5.0;
            if(Mathf.chance(0.03)){
                letterCEffect.at(u.x, u.y);
            }
        } else {
            u.damageMultiplier = 1.0;
        }
    });
});

// 5. D. 40% TỈ LỆ HỒI SINH & SPAWN 3 SCEPTER KHU BỊ HẠ GỤC
Events.on(EventType.UnitDestroyEvent, event => {
    let u = event.unit;
    if(u && u.type == UnitTypes.reign){
        let data = reignDataMap.get(u.id);

        if(data && data.isUniquePrimary){
            if(Mathf.chance(0.40)){
                let newReign = UnitTypes.reign.spawn(u.team, u.x, u.y);
                newReign.heal(newReign.maxHealth);
                letterDEffect.at(u.x, u.y);

                for(let i = 0; i < 3; i++){
                    UnitTypes.scepter.spawn(u.team, u.x + Mathf.range(24), u.y + Mathf.range(24));
                }
            }
        }
        reignDataMap.remove(u.id);
    }
});

// 6. F. 20% TẤN CÔNG TẠO VỤ NỔ MÀU VÀNG TRẮNG NHẠT (1500 DMG)
Events.on(EventType.UnitBulletDestroyEvent, event => {
    let b = event.bullet;
    if(b && b.owner && b.owner.type == UnitTypes.reign){
        if(Mathf.chance(0.20)){
            let isDoubleRange = Mathf.chance(0.50);
            let baseRadius = 160;
            let finalRadius = isDoubleRange ? baseRadius * 2 : baseRadius;

            Damage.damage(b.team, b.x, b.y, finalRadius, 1500);
            
            let fxExplosion = createIndeniterExplosionEffect(finalRadius);
            fxExplosion.at(b.x, b.y);
            Effect.shake(6, 6, b.x, b.y);

            letterFEffect.at(b.x, b.y);
        }
    }
});