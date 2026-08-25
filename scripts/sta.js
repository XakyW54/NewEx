 global.deotLastHealth = {};  
global.deotDamagedTime = {}; 
global.doteiStacks = {};     
global.bemodStacks = {};
global.ceiStacks = {};   
global.ceiTimers = {};    

let isDoteiDamageActive = false;

 
const ceiSmokeIngatherFx = new Effect(30, cons(e => {
    Draw.z(Layer.effect + 0.1);
    
    let startDist = 18.0 + Mathf.randomSeed(e.id, -4, 6); 
    let dist = startDist * (1.0 - e.fin()); 
    let angle = Mathf.randomSeed(e.id * 2, 0, 360);
    
    let px = e.x + Angles.trnsx(angle, dist);
    let py = e.y + Angles.trnsy(angle, dist);
    
    let size = (2.5 + Mathf.randomSeed(e.id * 3, 0, 1.5)) * e.fout();
    
    Draw.color(Color.valueOf("90e0ef"));
    Draw.alpha(0.8 * e.fout());
    Fill.circle(px, py, size);
    
    Draw.reset();
}));

 const ceiFieldFx = new Effect(1800, cons(e => { 
    let radius = (e.data != null && typeof e.data === "number") ? e.data : 200; 
    let x = e.x, y = e.y;

    Draw.z(Layer.effect + 0.5);

     Draw.color(Color.valueOf("90e0ef"));
    Draw.alpha(0.18 * e.fout());
    Fill.circle(x, y, radius);

    Draw.color(Color.valueOf("00b4d8"));
    Draw.alpha(0.85 * e.fout());
    Lines.stroke(1.2); 
    Lines.circle(x, y, radius);

     const particleColors = [
        Color.valueOf("0077b6"), 
        Color.valueOf("00b4d8"), 
        Color.valueOf("90e0ef"), 
        Color.valueOf("caf0f8")  
    ];

    for (let i = 0; i < 20; i++) {
        let seed = e.id + i * 133;
        
        let baseDist = Mathf.randomSeed(seed, 15, Math.max(16, radius - 15));
        let speed = Mathf.randomSeed(seed + 1, 1.8, 6.0); 
        let dir = (i % 2 === 0) ? 1 : -1;
        
        let angle = Mathf.randomSeed(seed + 2, 0, 360) + (Time.time * speed * dir);
        let distOffset = Math.sin((Time.time + seed) * 0.08) * 12;
        let currentDist = Mathf.clamp(baseDist + distOffset, 10, Math.max(11, radius - 10));

        let px = x + Angles.trnsx(angle, currentDist);
        let py = y + Angles.trnsy(angle, currentDist);
        
        let pSize = Mathf.randomSeed(seed + 3, 1.2, 3.2);
        let colIndex = Math.floor(Mathf.randomSeed(seed + 4, 0, particleColors.length));

        Draw.color(particleColors[colIndex]);
        Draw.alpha(0.85 * e.fout());
        Fill.circle(px, py, pSize);
    }

     Lines.stroke(1.5);
    for (let i = 0; i < 12; i++) {
        let seed = e.id + i * 555;
        
        let arcDist = Mathf.randomSeed(seed, 30, Math.max(31, radius - 20));
        let arcSpeed = Mathf.randomSeed(seed + 1, 1.2, 3.5);
        let dir = (i % 3 === 0) ? -1 : 1;
        
        let angle = Mathf.randomSeed(seed + 2, 0, 360) + (Time.time * arcSpeed * dir);
        let arcLength = Mathf.randomSeed(seed + 3, 12, 28); 

        Draw.color(Color.valueOf("caf0f8"));
        Draw.alpha(0.6 * e.fout());
        
        Lines.arc(x, y, arcDist, arcLength / 360, angle);
    }

    Draw.reset();
}));

 let activeCeiFields = [];

function spawnCeiField(x, y, targetUnit, sourceTurret) {
    let perkTier = (sourceTurret != null && typeof sourceTurret.getPerkTier === "function") ? sourceTurret.getPerkTier() : 0;
    
     let radius = 200;
    if (perkTier == 2) radius *= 2.20;      
    if (perkTier == 3) radius *= 0.50;      
    if (perkTier == 5) radius *= 0.80;    
    if (perkTier == 6) radius *= 3.00;     

    ceiFieldFx.at(x, y, 0, radius); 
    
    let attackerTeam = (targetUnit.team == Team.sharded) ? Team.crux : Team.sharded;

    activeCeiFields.push({
        x: x,
        y: y,
        attackerTeam: attackerTeam, 
        victimTeam: targetUnit.team, 
        timer: 0,        
        totalTime: 1800,
        radius: radius,
        perkTier: perkTier,
        sourceTurret: sourceTurret
    });
}

 Events.run(Trigger.update, () => {
    for (let i = activeCeiFields.length - 1; i >= 0; i--) {
        let field = activeCeiFields[i];
        
        field.timer += Time.delta;
        field.totalTime -= Time.delta;

        if (field.timer >= 180.0) {  
            field.timer = 0;

            let fx = field.x;
            let fy = field.y;
            let vTeam = field.victimTeam;
            let r = field.radius;
            let perk = field.perkTier;

            let hpPercent = (perk == 5) ? 0.05 : 0.01;

             Groups.unit.each(u => {
                if (u != null && u.isValid() && u.team == vTeam && Mathf.dst(u.x, u.y, fx, fy) <= r) {
                    let baseDmg = 330;
                    if (perk == 1) baseDmg *= 1.50;  
                    
                    let dmg = baseDmg + (u.maxHealth * hpPercent);
                    
                     if (perk == 2) dmg += 300; 

                    u.damage(dmg);

                     if (perk == 6) {
                        u.damage(200); 
                    }

                    u.apply(StatusEffects.freezing, 300); 
                    u.apply(StatusEffects.wet, 300);

                     if (perk == 5) {
                        let uid = u.id;
                        if (!global.ceiStacks[uid]) global.ceiStacks[uid] = 0;
                        global.ceiStacks[uid] += 5;
                    }
                }
            });

             Vars.indexer.eachBlock(null, fx, fy, r, b => b.team == vTeam, b => {
                let baseDmg = 330;
                if (perk == 1) baseDmg *= 1.50;
                let dmg = baseDmg + (b.maxHealth * hpPercent);
                if (perk == 2) dmg += 300;
                b.damage(dmg);
            });
        }

        if (field.totalTime <= 0) {
            activeCeiFields.splice(i, 1);
        }
    }
});

 var cei = extend(StatusEffect, "cei", {
    init() {
        this.super$init();
        this.uiIcon = StatusEffects.freezing.uiIcon;
        this.fullIcon = StatusEffects.freezing.fullIcon;
    },
    color: Color.valueOf("90e0ef"),
    
    update(unit, time) {
        this.super$update(unit, time);

        let id = unit.id;
        if (!global.ceiStacks[id]) global.ceiStacks[id] = 0;
        if (!global.ceiTimers[id]) global.ceiTimers[id] = 0;

        global.ceiTimers[id] += Time.delta;
        if (global.ceiTimers[id] >= 60.0) {
            global.ceiTimers[id] = 0;
            
             global.ceiStacks[id] += 1;

            let currentStacks = global.ceiStacks[id];

            if (currentStacks % 5 === 0) {
                ceiSmokeIngatherFx.at(unit.x, unit.y);
            }

             let reqLimit = 75;
            let lastTurret = global.ceiLastAppliedTurret ? global.ceiLastAppliedTurret[id] : null;
            let perk = (lastTurret != null && typeof lastTurret.getPerkTier === "function") ? lastTurret.getPerkTier() : 0;

            if (perk == 3) reqLimit = 60;
            if (perk == 6) reqLimit = 30;

            if (currentStacks >= reqLimit) {
                global.ceiStacks[id] = 0; 
                spawnCeiField(unit.x, unit.y, unit, lastTurret); 
            }
        }
    },

     draw(unit) {
        let stacks = global.ceiStacks[unit.id] || 0;
        if (stacks <= 0) return;

        Draw.z(Layer.effect + 0.05);
        Draw.color(Color.valueOf("90e0ef"));
        
         Lines.stroke(1.2 / Scl.scl(1.0));

         let arcDegree = 12;                      
        let arcFraction = arcDegree / 360.0;     

        for (let i = 0; i < stacks; i++) {
             let seed = unit.id * 1000 + i;

             let baseAngle = Mathf.randomSeed(seed, 0, 360);
            
             let rotSpeed = Mathf.randomSeed(seed + 1, 1.0, 3.5);
            let dir = (i % 2 === 0) ? 1 : -1;
            let currentAngle = baseAngle + (Time.time * rotSpeed * dir);

             let minR = Math.max(3.0, unit.hitSize * 0.4);
            let maxR = unit.hitSize + 2.0;
            let baseRadius = Mathf.randomSeed(seed + 2, minR, maxR);
            
             let radiusOffset = Math.sin((Time.time + seed) * 0.1) * 1.5;
            let currentRadius = Math.max(2.0, baseRadius + radiusOffset);

             Lines.arc(unit.x, unit.y, currentRadius, arcFraction, currentAngle);
        }

        Draw.reset();
    },

    onRemoved(unit) {
        delete global.ceiStacks[unit.id];
        delete global.ceiTimers[unit.id];
        if (global.ceiLastAppliedTurret) delete global.ceiLastAppliedTurret[unit.id];
    }
});

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
    onRemoved(unit) { delete global.doteiStacks[unit.id]; }
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

 const bemodLoopFx = new Effect(35, cons(e => {
    Draw.z(Layer.effect + 0.05);
    let seed = e.id;
    let baseSize = 20 + Mathf.randomSeed(seed, -5, 10);
    let radius = baseSize * (1.0 - e.fin());
    Draw.color(Color.valueOf("ff4500"));
    Draw.alpha(e.fout());
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
                Time.run(Mathf.random(0, 30), packRun(() => { 
                    if (unit != null && unit.isValid()) bemodLoopFx.at(unit.x, unit.y); 
                }));
            }
        }
    },
    onRemoved(unit) { delete global.bemodStacks[unit.id]; }
});

function packRun(func) { return new java.lang.Runnable({ run: func }); }

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

 Events.on(UnitDestroyEvent, cons(e => {
    let id = e.unit.id;
    delete global.deotLastHealth[id];
    delete global.deotDamagedTime[id];
    delete global.doteiStacks[id];
    delete global.bemodStacks[id];
    delete global.ceiStacks[id];
    delete global.ceiTimers[id];
    if (global.ceiLastAppliedTurret) delete global.ceiLastAppliedTurret[id];
}));

 Events.on(ClientLoadEvent, () => {
    cei.localizedName = "Cei Frost Field";
    cei.description = "Tích lũy 1 điểm mỗi giây. Đủ mốc sẽ tạo Vùng Băng Giá tồn tại 30s.";
    dotei.localizedName = "Dotei";
    deot.localizedName = "Deot";
    atkspeed.localizedName = "Leolyr Frenzy";
    bemod.localizedName = "Bemod";
});

module.exports = { cei: cei, deot: deot, dotei: dotei, atkspeed: atkspeed, bemod: bemod };