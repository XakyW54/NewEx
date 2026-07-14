global.deotLastHealth = {};  
global.deotDamagedTime = {}; 
global.doteiStacks = {};     

let isDoteiDamageActive = false;

const dotei = extend(StatusEffect, "dotei", {
    init() {
        this.super$init();
        this.uiIcon = StatusEffects.corroded.uiIcon; 
        this.fullIcon = StatusEffects.corroded.fullIcon;
    },
    color: Color.valueOf("a15bf7"),
    damage: 0, 
    update(unit, time) {
        this.super$update(unit, time);
        
        let id = unit.id;
        if (!global.doteiStacks[id]) global.doteiStacks[id] = 1;
        
        let damagePerTick = (1 * global.doteiStacks[id]) / 60;
        
        isDoteiDamageActive = true;
        unit.damagePierce(damagePerTick); 
        isDoteiDamageActive = false; 
    },
    onRemoved(unit) {
        delete global.doteiStacks[unit.id];
    }
});

const deot = extend(StatusEffect, "deot", {
    init() {
        this.super$init();
        this.uiIcon = StatusEffects.shielded.uiIcon;
        this.fullIcon = StatusEffects.shielded.fullIcon;
    },
    color: Color.valueOf("4be391"),
    update(unit, time) {
        this.super$update(unit, time);
        
        let id = unit.id;
        if (global.deotDamagedTime[id] === undefined) global.deotDamagedTime[id] = 0;
    },
    onRemoved(unit) {
        delete global.deotLastHealth[unit.id];
        delete global.deotDamagedTime[unit.id];
    }
});



// --- HIỆU ỨNG HẠT HÌNH "^" DI CHUYỂN TỪ DƯỚI LÊN ---
// --- HIỆU ỨNG TỰ VẼ HÌNH ^ DI CHUYỂN TỪ DƯỚI LÊN ---
// --- HIỆU ỨNG TỰ VẼ HÌNH ^ ĐƯỢC ÉP LAYER LÊN TRÊN CÙNG ---
const customAtkSpeedFx = new Effect(45, cons(e => {
    // Ép Mindustry đưa lệnh vẽ này lên trên cùng layer hiệu ứng, không bị unit hay khiên che khuất
    Draw.draw(Layer.effect + 0.01, run(() => {
        Draw.color(Color.valueOf("ff6e6e"));
        Lines.stroke(1.5); // Tăng độ dày lên một chút để nhìn rõ hơn
        
        // Tạo vị trí ngang X ngẫu nhiên xung quanh tâm Unit
        let randX = Mathf.randomSeed(e.id * 2, -14, 14);
        
        // Xuất phát ngẫu nhiên từ phần thân dưới của unit
        let startY = Mathf.randomSeed(e.id * 3, -12, 4);
        
        // Hạt tịnh tiến bay dần lên trên (Trục Y tăng dần) theo vòng đời e.fin()
        let moveUpY = e.fin() * (16 + Mathf.randomSeed(e.id, 10)); 
        
        // Tọa độ đỉnh nhọn của hình ^
        let topX = e.x + randX;
        let topY = e.y + startY + moveUpY;
        
        // Vẽ hai nhánh của hình ^
        Lines.line(topX - 3.5, topY - 3.5, topX, topY);
        Lines.line(topX + 3.5, topY - 3.5, topX, topY);
        
        Draw.reset();
    }));
}));



// --- TRẠNG THÁI ATKSPEED ĐÃ ĐƯỢC TÍCH HỢP HIỆU ỨNG VÀ CHỈ SỐ ---
const atkspeed = extend(StatusEffect, "atkspeed", {
    reloadMultiplier: 2.5,       // Đảm bảo tăng 2.5 lần tốc độ đánh
    effect: customAtkSpeedFx,    // Gán hiệu ứng hạt hình ^ vừa tạo ở trên vào đây
    effectChance: 0.18,          // Tỉ lệ xuất hiện hạt liên tục rõ ràng hơn
    color: Color.sky
});

Events.on(UnitDamageEvent, cons(e => {
    let unit = e.unit;
    if (unit != null && unit.hasEffect(deot)) {
        let id = unit.id;

        if (!isDoteiDamageActive) {
            if (!global.doteiStacks[id]) {
                global.doteiStacks[id] = 1;
            } else if (global.doteiStacks[id] < 9) {
                global.doteiStacks[id] += 1;
            }
            
            unit.apply(dotei, 60 * 5);

            if (global.deotLastHealth[id] !== undefined && unit.health < global.deotLastHealth[id]) {
                let damageTaken = global.deotLastHealth[id] - unit.health;
                unit.health += damageTaken * 0.99;
                if (unit.health > unit.maxHealth) unit.health = unit.maxHealth;
            }
        }
    }
    
    if (unit != null) {
        global.deotLastHealth[unit.id] = unit.health;
    }
}));

Events.on(Trigger.update, cons(() => {
    Groups.unit.each(cons(unit => {
        if (unit.hasEffect(deot)) {
            if (global.deotLastHealth[unit.id] === undefined || unit.health > global.deotLastHealth[unit.id]) {
                global.deotLastHealth[unit.id] = unit.health;
            }
        }
    }));
}));

Events.on(UnitDestroyEvent, cons(e => {
    let id = e.unit.id;
    delete global.deotLastHealth[id];
    delete global.deotDamagedTime[id];
    delete global.doteiStacks[id];
}));

Events.on(ClientLoadEvent, () => {
    dotei.localizedName = "Dotei";
    dotei.description = "Gây 10 sát thương/giây trên mỗi tầng tích lũy. Tối đa 999 tầng.";
    
    deot.localizedName = "Deot";
    deot.description = "Hệ phòng thủ: Hấp thụ 99% mọi sát thương từ bên ngoài (Ngoại trừ Dotei). Tự tăng tầng Dotei khi chịu đòn liên tục.";
    
    atkspeed.localizedName = "Leolyr Frenzy";
});

module.exports = {
    deot: deot,      
    dotei: dotei,
    atkspeed: atkspeed
};
