// ==================== KHAI BÁO GLOBAL & STATUS EFFECTS ====================
global.deotLastHealth = {};  
global.deotDamagedTime = {}; 
global.doteiStacks = {};     
global.bemodStacks = {};

let isDoteiDamageActive = false;

// --- KHAI BÁO CÁC STATUS EFFECT ---
var dotei = extend(StatusEffect, "dotei", {
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

var deot = extend(StatusEffect, "deot", {
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

// --- HIỆU ỨNG VÒNG TRÒN THU NHỎ (IMPLOSION) CỦA BEMOD ---
const bemodLoopFx = new Effect(35, cons(e => {
    Draw.z(Layer.effect + 0.05);
    
    let seed = e.id;
    let baseSize = 20 + Mathf.randomSeed(seed, -5, 10);
    let radius = baseSize * (1.0 - e.fin());
    let alpha = e.fout();

    Draw.color(Color.valueOf("ff4500"));
    Draw.alpha(alpha);
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, radius);

    Draw.reset();
}));

var bemod = extend(StatusEffect, "bemod", {
    init() {
        this.super$init();
        this.uiIcon = StatusEffects.blasted.uiIcon; 
        this.fullIcon = StatusEffects.blasted.fullIcon;
    },
    color: Color.valueOf("ff4500"),
    
    update(unit, time) {
        this.super$update(unit, time);
        
        if (Mathf.chanceDelta(1.0 / 60.0)) {
            let id = unit.id;
            let stacks = global.bemodStacks[id] || 1;
            
            for (let i = 0; i < stacks; i++) {
                let delay = Mathf.random(0, 30);
                Time.run(delay, packRun(() => {
                    if (unit != null && unit.isValid()) {
                        bemodLoopFx.at(unit.x, unit.y);
                    }
                }));
            }
        }
    },

    onRemoved(unit) {
        delete global.bemodStacks[unit.id];
    }
});

function packRun(func) {
    return new java.lang.Runnable({ run: func });
}

// --- HIỆU ỨNG NỔ BEMOD MỚI (3 VÒNG SÓNG XUNG KÍCH ZOOM NỐI TIẾP) ---
const bemodExplosionFx = new Effect(50, cons(e => {
    Draw.z(Layer.effect + 0.1);
    
    let maxRadius = 150;        
    let alpha = 1.0 - e.fin();  

    Draw.color(Color.valueOf("ff4500"));
    Draw.alpha(alpha * 0.35);
    Fill.circle(e.x, e.y, maxRadius);

    Draw.color(Color.valueOf("ff6b35"));
    Draw.alpha(alpha * 0.7);
    Lines.stroke(2.5 * alpha);
    Lines.circle(e.x, e.y, maxRadius);

    const ringColors = [
        Color.valueOf("ffffff"), 
        Color.valueOf("ffa500"), 
        Color.valueOf("ff2200")  
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

global.bemodExplosionFx = bemodExplosionFx;

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

var atkspeed = extend(StatusEffect, "atkspeed", {
    reloadMultiplier: 2.5,
    effect: customAtkSpeedFx,
    effectChance: 0.18,
    color: Color.sky
});

// ==================== XỬ LÝ SỰ KIỆN (EVENTS) ====================
Events.on(UnitDamageEvent, cons(e => {
    let unit = e.unit;
    if (unit != null && typeof dotei !== "undefined" && dotei != null) {
        
        // --- XỬ LÝ DEOT & DOTEI ---
        if (typeof deot !== "undefined" && deot != null && unit.hasEffect(deot)) {
            let id = unit.id;

            if (!isDoteiDamageActive) {
                if (!global.doteiStacks[id]) {
                    global.doteiStacks[id] = 1;
                } else if (global.doteiStacks[id] < 999) {
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
    }
}));

Events.run(Trigger.update, () => {
    Groups.unit.each(cons(unit => {
        if (typeof deot !== "undefined" && deot != null && unit.hasEffect(deot)) {
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
    delete global.bemodStacks[id];
}));

Events.on(ClientLoadEvent, () => {
    dotei.localizedName = "Dotei";
    dotei.description = "Gây 10 sát thương/giây trên mỗi tầng tích lũy. Tối đa 999 tầng.";
    
    deot.localizedName = "Deot";
    deot.description = "Hệ phòng thủ: Hấp thụ 99% mọi sát thương từ bên ngoài (Ngoại trừ Dotei). Tự tăng tầng Dotei khi chịu đòn liên tục.";
    
    atkspeed.localizedName = "Leolyr Frenzy";

    bemod.localizedName = "Bemod";
    bemod.description = "Tích lũy 10 tầng sẽ kích nổ phạm vi 150px. Gây 100 + 1% HP tối đa của mọi mục tiêu trong vùng nổ.";
});

module.exports = {
    deot: deot,      
    dotei: dotei,
    atkspeed: atkspeed,
    bemod: bemod
};
