// ==================== KHAI BÁO GLOBAL & STATUS EFFECTS ====================
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
        unit.damage(damagePerTick, true); 
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

// --- HIỆU ỨNG TỰ VẼ HÌNH ^ ĐƯỢC ÉP LAYER LÊN TRÊN CÙNG ---
const customAtkSpeedFx = new Effect(45, cons(e => {
    Draw.z(Layer.effect + 0.01);
    Draw.color(Color.valueOf("ff6e6e"));
    Lines.stroke(1.5);
    
    let randX = Mathf.randomSeed(e.id * 2, -14, 14);
    let startY = Mathf.randomSeed(e.id * 3, -12, 4);
    let moveUpY = e.fin() * (16 + Mathf.randomSeed(e.id, 10)); 
    
    let topX = e.x + randX;
    let topY = e.y + startY + moveUpY;
    
    Lines.line(topX - 3.5, topY - 3.5, topX, topY);
    Lines.line(topX + 3.5, topY - 3.5, topX, topY);
    
    Draw.reset();
}));

const atkspeed = extend(StatusEffect, "atkspeed", {
    reloadMultiplier: 2.5,
    effect: customAtkSpeedFx,
    effectChance: 0.18,
    color: Color.sky
});

// ==================== XỬ LÝ SỰ KIỆN DEOT & DOTEI ====================
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
        
        global.deotLastHealth[id] = unit.health;
    }
}));

// FIX LỖI CRASH: Thay Events.on bằng Events.run cho Trigger.update
Events.run(Trigger.update, () => {
    Groups.unit.each(cons(unit => {
        if (unit.hasEffect(deot)) {
            let id = unit.id;
            if (global.deotLastHealth[id] === undefined || unit.health > global.deotLastHealth[id]) {
                global.deotLastHealth[id] = unit.health;
            }
        }
    }));
});

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