const packCons2 = (func) => new Cons2({ get: func });
const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

const ItemStats = {
    "copper": { damage: 0.05, desc: isEn() ? "[stat]+5% Dmg[]" : "[stat]+5% Sát thương[]" },
    "silicon": { reload: 0.05, desc: isEn() ? "[stat]+5% Fire Rate[]" : "[stat]+5% Tốc độ bắn[]" },
    "thorium": { range: 0.05, desc: isEn() ? "[stat]+5% Range[]" : "[stat]+5% Tầm bắn[]" },
    "sallowyr": { desc: isEn() ? "[stat]+1 Extra Bullet per shot[]" : "[stat]+1 Đạn mỗi lần bắn[]" },
    "obsidis": { damage: 0.10, reload: 0.10, range: 0.50, desc: isEn() ? "[stat]+10% Dmg/FireRate, +50% Range[]" : "[stat]+10% TC/TĐ, +50% Tầm bắn[]" },
    "starlight": { critChance: 0.05, critMultiplier: 0.15, desc: isEn() ? "[stat]+5% Crit | +15% CritDmg\nExecute targets below 5% HP (+1000 Copper)[]" : "[stat]+5% Bạo | +15% ST Bạo\nKết liễu mục tiêu <5% HP (+1000 Đồng)[]" }
};

function applyDamageWithStarlight(owner, target, baseDamage) {
    if (target == null || target.dead) return;

    let finalDamage = baseDamage;

    if (owner != null && typeof owner.getCritChance === "function") {
        let critChance = owner.getCritChance();
        if (Mathf.chance(critChance)) {
            finalDamage *= owner.getCritMultiplier();
        }
    }

    target.damage(finalDamage);

    if (owner != null && typeof owner.hasStarlightPassive === "function" && owner.hasStarlightPassive()) {
        if (target.health / target.maxHealth <= 0.05) {
            target.kill();
            let core = owner.team.core();
            if (core != null) {
                let copperItem = Vars.content.getByName(ContentType.item, "copper") || Items.copper;
                if (copperItem != null) core.items.add(copperItem, 1000);
            }
        }
    }
}

const absorbEnergyFx = new Effect(20, e => {
    Draw.color(Color.cyan, Color.white, e.fout());
    Lines.stroke(1.8 * e.fout());
    Mathf.rand.setSeed(e.id);
    let len = Mathf.rand.random(4, 12);
    let angle = Mathf.rand.random(360);
    Lines.lineAngle(e.x, e.y, angle, len * e.fin());
    Fill.circle(e.x, e.y, 1.5 * e.fout());
});

const muzzleSparkFx = new Effect(15, e => {
    Draw.color(Color.white, Color.cyan, e.fout());
    Lines.stroke(1.5 * e.fout());
    Mathf.rand.setSeed(e.id);
    for(let i = 0; i < 3; i++){
        let len = Mathf.rand.random(6, 16) * e.fin();
        let ang = e.rotation + Mathf.rand.range(20);
        Lines.lineAngle(e.x, e.y, ang, len);
    }
});

const customShootFx = new Effect(20, e => {
    Draw.color(Color.cyan, Color.white, e.fout());
    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, 18 * e.fin());
    Lines.lineAngle(e.x, e.y, e.rotation, 15 * e.fout());
});

const UniversalItemUI = {
    buildSlotUI(table, build, onConfigChange) {
        let slotsTable = new Table();
        slotsTable.background(Styles.black6);
        slotsTable.margin(6);

        let maxSlots = 4;
        let core = build.team.core();

        for (let i = 0; i < maxSlots; i++) {
            let slotIndex = i;
            let slotType = Number(build.equipSlots[slotIndex]);
            let currentItem = this.getItemBySlotType(slotType);

            let slotBtn = slotsTable.button(cons(b => {
                b.clearChildren();
                if (currentItem != null) {
                    b.image(currentItem.uiIcon).size(28);
                } else {
                    b.add("[gray]+[]").fontScale(1.2);
                }
            }), Styles.defaultb, () => {
                if (currentItem != null) {
                    let currentCore = build.team.core();
                    if (currentCore != null && (Vars.net.server() || !Vars.net.active())) {
                        currentCore.items.add(currentItem, 1);
                    }
                    build.equipSlots[slotIndex] = 0;
                    if (onConfigChange) onConfigChange();
                } else {
                    this.showItemSelectionDialog(build, (selectedType) => {
                        build.equipSlots[slotIndex] = selectedType;
                        if (onConfigChange) onConfigChange();
                    });
                }
            }).size(44).pad(3).get();

            if (currentItem != null) {
                let cleanName = currentItem.name.replace("newex-", "");
                let buffText = ItemStats[cleanName] ? ItemStats[cleanName].desc : "[gray]Không có chỉ số buff[]";
                let tooltipText = "[accent]" + currentItem.localizedName + "[]\n" + buffText;
                let hasItemInCore = core != null && core.items.has(currentItem, 1);
                
                slotBtn.addListener(new Tooltip(cons(t => {
                    t.background(Styles.black6).margin(8);
                    t.add(tooltipText);
                })));
                slotBtn.setColor(hasItemInCore ? Pal.heal : Pal.remove);
            } else {
                slotBtn.addListener(new Tooltip(cons(t => {
                    t.background(Styles.black6).margin(8);
                    t.add(isEn() ? "[gray]Click to equip item[]" : "[gray]Nhấp để gắn trang bị[]");
                })));
                slotBtn.setColor(Color.white);
            }
        }
        table.add(slotsTable);
    },

    getItemBySlotType(type) {
        if (type === 1) return Vars.content.getByName(ContentType.item, "copper") || Items.copper;
        if (type === 2) return Vars.content.getByName(ContentType.item, "silicon") || Items.silicon;
        if (type === 3) return Vars.content.getByName(ContentType.item, "thorium") || Items.thorium;
        if (type === 4) return Vars.content.getByName(ContentType.item, "newex-sallowyr");
        if (type === 5) return Vars.content.getByName(ContentType.item, "newex-obsidis");
        if (type === 6) return Vars.content.getByName(ContentType.item, "newex-starlight");
        return null;
    },

    getSlotTypeByItem(item) {
        if (!item) return 0;
        let cleanName = item.name.replace("newex-", "");
        if (cleanName === "copper") return 1;
        if (cleanName === "silicon") return 2;
        if (cleanName === "thorium") return 3;
        if (cleanName === "sallowyr") return 4;
        if (cleanName === "obsidis") return 5;
        if (cleanName === "starlight") return 6;
        return 0;
    },

    showItemSelectionDialog(build, onSelect) {
        let dialog = new BaseDialog(isEn() ? "Equipment Storage" : "Kho Trang Bị");
        dialog.addCloseButton();
        let dialogWidth = Math.min(Core.graphics.getWidth() * 0.85, 360);

        dialog.cont.pane(p => {
            p.margin(6);
            let core = build.team.core();
            let validItems = ["copper", "silicon", "thorium", "newex-sallowyr", "newex-obsidis", "newex-starlight"];

            validItems.forEach(itemName => {
                let item = Vars.content.getByName(ContentType.item, itemName);
                if (!item) return;

                let cleanName = item.name.replace("newex-", "");
                let statData = ItemStats[cleanName];
                if (!statData) return;

                let count = core != null ? core.items.get(item) : 0;
                let hasItem = count > 0;

                let btn = new Button(Styles.cleart);
                btn.margin(8);
                btn.add(new Image(item.uiIcon)).size(32).padRight(10).top();

                let infoTable = new Table();
                infoTable.left();
                let statusColor = hasItem ? "[#84f491]" : "[#ff795e]";
                
                let titleLabel = infoTable.add(item.localizedName + " " + statusColor + "(Lõi: " + count + ")[]").left().growX().get();
                titleLabel.setWrap(true);
                infoTable.row();
                
                let buffLabel = infoTable.add(statData.desc).fontScale(0.85).left().growX().get();
                buffLabel.setWrap(true);

                btn.add(infoTable).growX().width(dialogWidth - 80);
                btn.setColor(hasItem ? Pal.heal : Pal.remove);

                btn.clicked(() => {
                    if (hasItem) {
                        if (core != null && (Vars.net.server() || !Vars.net.active())) {
                            core.items.remove(item, 1);
                        }
                        onSelect(this.getSlotTypeByItem(item));
                        dialog.hide();
                    } else {
                        Vars.ui.showInfoToast(isEn() ? "[red]Core missing this item![]" : "[red]Lõi không có nguyên liệu này![]", 2);
                    }
                });
                p.add(btn).width(dialogWidth - 20).pad(3).row();
            });
        }).scrollX(false).grow();
        dialog.show();
    }
};

const GOLDEN_RATIO = 1.61803398875;
const GOLDEN_ANGLE_DEG = 137.507764;

const acidCorrosionEffect = new Effect(30, cons(e => {
    Draw.color(Color.valueOf("#a3e635"), Color.valueOf("#65a30d"), e.fin());
    Lines.stroke(e.fout() * 2);
    Mathf.rand.setSeed(e.id);
    for(let i = 0; i < 5; i++){
        let len = Mathf.rand.random(2, 14) * e.fin();
        let angle = Mathf.rand.random(360);
        let size = Mathf.rand.random(1, 4) * e.fout();
        Lines.circle(e.x + Angles.trnsx(angle, len), e.y + Angles.trnsy(angle, len), size);
    }
}));

const mergeEnergyFx = new Effect(35, cons(e => {
    Draw.color(Color.cyan, Color.white, e.fout());
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, 32 * e.fin());
    Fill.circle(e.x, e.y, 12 * e.fout());
    
    for(let i = 0; i < 6; i++){
        let ang = i * 60 + Mathf.randomSeed(e.id + i, 360);
        let len = 20 * e.fin();
        Lines.lineAngle(e.x + Mathf.cosDeg(ang) * len, e.y + Mathf.sinDeg(ang) * len, ang, 8 * e.fout());
    }
}));

const distortedShockwaveFx = new Effect(35, cons(e => {
    let fin = e.fin();
    let fout = e.fout();
    let steps = 24;

    let rad = e.rotation * Mathf.degRad;
    let cosA = Math.cos(rad);
    let sinA = Math.sin(rad);

    Draw.color(Color.white, Color.cyan, fin);
    Lines.stroke(3.5 * fout);

    for(let layer = 0; layer < 2; layer++){
        let layerOffset = layer * 12;
        let radiusX = (fin * 25) + layerOffset * 0.2;
        let radiusY = (fin * 65) + layerOffset * 0.5;
        let offset = (fin * 50) + layerOffset;

        let cx = e.x + cosA * offset;
        let cy = e.y + sinA * offset;

        let lastX = 0, lastY = 0;

        for(let i = 0; i <= steps; i++){
            let angle = (i * (360 / steps)) * Mathf.degRad;
            let lx = Math.cos(angle) * radiusX;
            let ly = Math.sin(angle) * radiusY;

            let rx = cx + (lx * cosA - ly * sinA);
            let ry = cy + (lx * sinA + ly * cosA);

            if(i > 0) Lines.line(lastX, lastY, rx, ry);
            lastX = rx;
            lastY = ry;
        }
    }
    Draw.reset();
}));

const state3ShockwaveFx = new Effect(30, cons(e => {
    let fin = e.fin();
    let fout = e.fout();
    let steps = 24;

    let rad = e.rotation * Mathf.degRad;
    let cosA = Math.cos(rad);
    let sinA = Math.sin(rad);

    Draw.color(Color.white, Color.cyan, fin);
    Lines.stroke(3.0 * fout);

    let radiusX = fin * 30; 
    let radiusY = fin * 70; 
    let offset = (1.0 - fin) * 60;  

    let cx = e.x + cosA * offset;
    let cy = e.y + sinA * offset;
    let lastX = 0, lastY = 0;

    for(let i = 0; i <= steps; i++){
        let angle = (i * (360 / steps)) * Mathf.degRad;
        let lx = Math.cos(angle) * radiusX;
        let ly = Math.sin(angle) * radiusY;
        let rx = cx + (lx * cosA - ly * sinA);
        let ry = cy + (lx * sinA + ly * cosA);

        if(i > 0) Lines.line(lastX, lastY, rx, ry);
        lastX = rx;
        lastY = ry;
    }
    Draw.reset();
}));

const lightningAroundTurretFx = new Effect(30, cons(e => {
    Draw.color(Color.cyan, Color.white, e.fout());
    Lines.stroke(2.5 * e.fout());
    Mathf.rand.setSeed(e.id);

    for(let i = 0; i < 8; i++){
        let angle = i * 45 + Mathf.rand.random(-15, 15);
        let len = Mathf.rand.random(30, 70);
        let px = e.x + Angles.trnsx(angle, len * e.fin());
        let py = e.y + Angles.trnsy(angle, len * e.fin());

        Lines.lineAngle(e.x, e.y, angle, len * e.fin());
        Fill.circle(px, py, 3 * e.fout());
    }
}));

const chargeHitFx = new Effect(45, cons(e => {
    Draw.color(Color.cyan, Color.white, e.fout());
    Lines.stroke(5 * e.fout());
    Lines.circle(e.x, e.y, 60 * e.fin());
    
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, 35 * e.fin());
    
    for(let i = 0; i < 16; i++){
        let ang = i * 22.5 + Mathf.randomSeed(e.id + i, 360);
        let len = 48 * e.fin();
        Fill.circle(e.x + Mathf.cosDeg(ang) * len, e.y + Mathf.sinDeg(ang) * len, 5 * e.fout());
    }
}));

function drawAsymmetricStar(x, y, rotation, scale, frontColor, backColor) {
    let rad = rotation * Mathf.degRad;
    let cos = Mathf.cos(rad);
    let sin = Mathf.sin(rad);

    let points = [
        {x: 20 * scale, y: 0},
        {x: 2 * scale, y: 3 * scale},
        {x: 0, y: 7 * scale},
        {x: -2 * scale, y: 3 * scale},
        {x: -8 * scale, y: 0},
        {x: -2 * scale, y: -3 * scale},
        {x: 0, y: -7 * scale},
        {x: 2 * scale, y: -3 * scale}
    ];

    let worldPoints = points.map(p => {
        let rx = p.x * cos - p.y * sin;
        let ry = p.x * sin + p.y * cos;
        return {x: x + rx, y: y + ry};
    });

    Draw.color(backColor);
    for (let i = 0; i < worldPoints.length; i++) {
        let p1 = worldPoints[i];
        let p2 = worldPoints[(i + 1) % worldPoints.length];
        Fill.tri(x, y, p1.x, p1.y, p2.x, p2.y);
    }

    Draw.color(frontColor);
    for (let i = 0; i < worldPoints.length; i++) {
        let p1 = worldPoints[i];
        let p2 = worldPoints[(i + 1) % worldPoints.length];
        let mx1 = Mathf.lerp(x, p1.x, 0.65);
        let my1 = Mathf.lerp(y, p1.y, 0.65);
        let mx2 = Mathf.lerp(x, p2.x, 0.65);
        let my2 = Mathf.lerp(y, p2.y, 0.65);
        Fill.tri(x, y, mx1, my1, mx2, my2);
    }
}

const createAetherStarBullet = (frontCol, backCol, hitEf, statusEff) => {
    return extend(BasicBulletType, {
        init(){
            this.super$init();
            this.speed = 5.5;
            this.damage = 215;
            this.lifetime = 65;
            this.hitEffect = hitEf;
            this.despawnEffect = hitEf;
            this.status = statusEff;
            this.statusDuration = 140;
            this.lightColor = frontCol;
            this.lightOpacity = 0.7;
            this.lightRadius = 25;
            this.homingPower = 0.08;
            this.homingRange = 220;
            this.drawSize = 25;
        },
        update(b){
            this.super$update(b);
            if(!b) return;
            let timeAcc = b.time;
            let curveStrength = 3.2 * (1.0 - (b.time / b.lifetime));
            let waveOffset = Mathf.sin(timeAcc * 0.25 + (b.id % 8) * GOLDEN_RATIO) * curveStrength;
            let currentAngle = b.rotation();
            let targetAngle = currentAngle + waveOffset;
            b.vel.setAngle(Mathf.slerp(currentAngle, targetAngle, 0.4));
        },
        hitEntity(b, other, initialHealth) {
            this.super$hitEntity(b, other, initialHealth);
            if (b != null && b.owner != null && other != null) {
                let dmgMult = b.owner.getDamageMultiplier ? b.owner.getDamageMultiplier() : 1.0;
                applyDamageWithStarlight(b.owner, other, this.damage * dmgMult);
            }
        },
        draw(b){
            drawAsymmetricStar(b.x, b.y, b.rotation(), 0.8, frontCol, backCol);
        }
    });
};

const darkVoidHitFx = new Effect(30, cons(e => {
    Draw.color(Color.valueOf("#2e1065"), Color.valueOf("#a855f7"), e.fin());
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 25 * e.fin());
    Fill.circle(e.x, e.y, 8 * e.fout());
}));

const aetherDarkVoidBullet = extend(BasicBulletType, {
    init(){
        this.super$init();
        this.speed = 6.0;
        this.damage = 215;
        this.lifetime = 65;
        this.hitEffect = darkVoidHitFx;
        this.despawnEffect = darkVoidHitFx;
        this.status = StatusEffects.unmoving;
        this.statusDuration = 60;
        this.lightColor = Color.valueOf("#a855f7");
        this.lightOpacity = 0.9;
        this.lightRadius = 30;
        this.homingPower = 0.12;
        this.homingRange = 250;
        this.drawSize = 30;
    },
    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        if (other != null && other.isValid() && !other.dead) {
            let percentageDmg = other.maxHealth * 0.50;
            other.damage(percentageDmg);
            darkVoidHitFx.at(other.x, other.y);
        }
        if (b != null && b.owner != null && other != null) {
            let dmgMult = b.owner.getDamageMultiplier ? b.owner.getDamageMultiplier() : 1.0;
            applyDamageWithStarlight(b.owner, other, this.damage * dmgMult);
        }
    },
    draw(b){
        drawAsymmetricStar(b.x, b.y, b.rotation(), 1.0, Color.valueOf("#18002e"), Color.valueOf("#7e22ce"));
    }
});

const aetherNormalBlasted  = createAetherStarBullet(Color.valueOf("#ffab40"), Color.valueOf("#ff6d00"), darkVoidHitFx, StatusEffects.blasted);
const aetherNormalMelting  = createAetherStarBullet(Color.valueOf("#ffa726"), Color.valueOf("#f57c00"), darkVoidHitFx, StatusEffects.melting);
const aetherNormalBurning  = createAetherStarBullet(Color.valueOf("#ff7043"), Color.valueOf("#d84315"), darkVoidHitFx, StatusEffects.burning);
const aetherNormalFreezing = createAetherStarBullet(Color.valueOf("#29b6f6"), Color.valueOf("#0288d1"), darkVoidHitFx, StatusEffects.freezing);
const aetherNormalShocked  = createAetherStarBullet(Color.valueOf("#e1bee7"), Color.valueOf("#ba68c8"), darkVoidHitFx, StatusEffects.shocked);
const aetherNormalWet      = createAetherStarBullet(Color.valueOf("#60a5fa"), Color.valueOf("#2563eb"), darkVoidHitFx, StatusEffects.wet);
const aetherNormalCorroded = createAetherStarBullet(Color.valueOf("#bef264"), Color.valueOf("#65a30d"), acidCorrosionEffect, StatusEffects.corroded);

const aetherNormalBulletPool = [
    aetherNormalBlasted,
    aetherNormalMelting,
    aetherNormalBurning,
    aetherNormalFreezing,
    aetherNormalShocked,
    aetherNormalWet,
    aetherNormalCorroded
];

const normalBullet = aetherNormalBlasted;

const chargedBulletState2 = extend(BasicBulletType, {
    init(){
        this.super$init();
        this.speed = 8.0;
        this.damage = 1075;
        this.lifetime = 50;
        this.splashDamage = 450;
        this.splashDamageRadius = 40;
        this.hitEffect = chargeHitFx;
        this.despawnEffect = chargeHitFx;
        this.pierce = true;
        this.pierceCap = 3;
        this.status = StatusEffects.shocked;
        this.statusDuration = 120;
        this.lightColor = Color.cyan;
        this.lightOpacity = 0.9;
        this.lightRadius = 50;
        this.drawSize = 40;
    },
    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        if (b != null && b.owner != null && other != null) {
            let dmgMult = b.owner.getDamageMultiplier ? b.owner.getDamageMultiplier() : 1.0;
            applyDamageWithStarlight(b.owner, other, this.damage * dmgMult);
        }
    },
    draw(b){
        drawAsymmetricStar(b.x, b.y, b.rotation(), 1.5, Color.white, Color.cyan);
    }
});

const chargedBulletState3 = extend(BasicBulletType, {
    init(){
        this.super$init();
        this.speed = 8.0;
        this.damage = 1827.5;
        this.lifetime = 50;
        this.splashDamage = 450;
        this.splashDamageRadius = 40;
        this.hitEffect = chargeHitFx;
        this.despawnEffect = chargeHitFx;
        this.pierce = true;
        this.pierceCap = 3;
        this.status = StatusEffects.shocked;
        this.statusDuration = 120;
        this.lightColor = Color.cyan;
        this.lightOpacity = 0.9;
        this.lightRadius = 50;
        this.drawSize = 40;
    },
    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        if (b != null && b.owner != null && other != null) {
            let dmgMult = b.owner.getDamageMultiplier ? b.owner.getDamageMultiplier() : 1.0;
            applyDamageWithStarlight(b.owner, other, this.damage * dmgMult);
        }
    },
    draw(b){
        drawAsymmetricStar(b.x, b.y, b.rotation(), 1.5, Color.white, Color.cyan);
    }
});

function updateAetherSpiralVisibility() {
    const aetherTurret = Vars.content.block("newex-aether-spiral") || Vars.content.block("aether-spiral");
    if (!Vars.player || !aetherTurret) return;

    let playerTeam = Vars.player.team();
    let maxAllowed = playerTeam.cores().size;

    let currentCount = 0;
    Groups.build.each(b => {
        if (b.block === aetherTurret && b.team === playerTeam) {
            currentCount++;
        }
    });

    if (currentCount < maxAllowed) {
        aetherTurret.buildVisibility = BuildVisibility.shown;
    } else {
        aetherTurret.buildVisibility = BuildVisibility.hidden;
    }
}

Events.on(ContentInitEvent, () => {
    let aetherSpiral = Vars.content.block("newex-aether-spiral") || Vars.content.block("aether-spiral");

    if(aetherSpiral != null){
        aetherSpiral.configurable = true;

        if (aetherSpiral.ammoTypes != null) {
            aetherSpiral.ammoTypes.put(Items.surgeAlloy, normalBullet);
            aetherSpiral.ammoTypes.put(Items.silicon, normalBullet);
        }

        aetherSpiral.config(java.lang.Integer, packCons2((tile, value) => {
            if (tile != null && tile.setSlotConfig !== undefined) {
                tile.setSlotConfig(value);
            }
        }));

        aetherSpiral.buildType = () => extend(ItemTurret.ItemTurretBuild, aetherSpiral, {
            normalShotCount: 0,
            chargeShotCount: 0,
            chargeState: 0,
            chargeTimer: 0,
            chargeDuration: 50,
            cornerOffset: 16,
            convergenceDistance: 24,

            baseMaxRange: 320,
            equipSlots: [0, 0, 0, 0],

            state2SubStage: 0,
            state2ShotIndex: 0,
            state2MoveTimer: 0,
            state2MoveDuration: 10,

            customRecoil: 0,
            orbVisualRadius: 0,

            rotateSpeed: 5.0,

            created() {
                this.super$created();
                return this;
            },

            getSlotType(slotIdx) { return Number(this.equipSlots[slotIdx]); },

            getItemCount(type) {
                let count = 0;
                for (let i = 0; i < 4; i++) {
                    if (Number(this.equipSlots[i]) === Number(type)) count++;
                }
                return count;
            },

            setSlotConfig(val) {
                let mask = Number(val);
                for (let i = 0; i < 4; i++) {
                    this.equipSlots[i] = (mask >> (i * 3)) & 7;
                }
            },

            getSlotConfig() {
                let mask = 0;
                for (let i = 0; i < 4; i++) {
                    mask |= ((Number(this.equipSlots[i]) & 7) << (i * 3));
                }
                return mask;
            },

            getDamageMultiplier() { return 1.0 + (this.getItemCount(1) * 0.05) + (this.getItemCount(5) * 0.10); },
            getSpeedMultiplier() { return 1.0 + (this.getItemCount(2) * 0.05) + (this.getItemCount(5) * 0.10); },
            getRangeMultiplier() { return 1.0 + (this.getItemCount(3) * 0.05) + (this.getItemCount(5) * 0.50); },
            getCritChance() { return this.getItemCount(6) * 0.05; },
            getCritMultiplier() { return 1.0 + (this.getItemCount(6) * 0.15); },
            hasStarlightPassive() { return this.getItemCount(6) > 0; },
            getExtraBullets() { return this.getItemCount(4); },
            range() { return this.baseMaxRange * this.getRangeMultiplier(); },

            buildConfiguration(table) {
                table.clear();

                let topRowTable = new Table();
                topRowTable.background(Styles.black6);
                topRowTable.margin(0);

                topRowTable.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = isEn() ? " Aether Spiral Turret Stats " : " Thông số pháo Aether Spiral ";
                    let statDmgPercent = Math.round(this.getDamageMultiplier() * 100);
                    let statSpeedPercent = Math.round(this.getSpeedMultiplier() * 100);
                    let statRangePercent = Math.round(this.getRangeMultiplier() * 100);
                    let currentRangePx = Math.round(this.range());

                    let critChance = Math.round(this.getCritChance() * 100);
                    let critDmgPercent = Math.round(this.getCritMultiplier() * 100);

                    let descStr = isEn() ?
                        "[gold]⚡ TURRET EQUIPMENT STATS ⚡[]\n" +
                        "[lightgray]Copper:[] [yellow]" + this.getItemCount(1) + " / 4[] | " +
                        "[lightgray]Silicon:[] [yellow]" + this.getItemCount(2) + " / 4[] | " +
                        "[lightgray]Thorium:[] [yellow]" + this.getItemCount(3) + " / 4[]\n" +
                        "[lightgray]Sallowyr:[] [yellow]" + this.getItemCount(4) + " / 4[] | " +
                        "[lightgray]Obsidis:[] [yellow]" + this.getItemCount(5) + " / 4[] | " +
                        "[lightgray]Starlight:[] [yellow]" + this.getItemCount(6) + " / 4[]\n\n" +
                        "[lightgray]Attack Multiplier:[] [green]" + statDmgPercent + "%[]\n" +
                        "[lightgray]Fire Rate Multiplier:[] [green]" + statSpeedPercent + "%[]\n" +
                        "[lightgray]Effective Range:[] [orange]" + currentRangePx + " px[] [lime](" + statRangePercent + "%)[]\n" +
                        "[lightgray]Crit Chance:[] [cyan]" + critChance + "%[]\n" +
                        "[lightgray]Crit Damage:[] [cyan]" + critDmgPercent + "%[]\n\n" +
                        "[sky]⚡ SPECIAL ABILITY:[]\n" +
                        "• Normal shots have [purple]10% chance[] to fire Dark Void Star deals [scarlet]50% Target Max HP Damage[].\n\n" +
                        "[sky]⚡ ITEM BUFF MECHANIC:[]\n" +
                        "• [yellow]Copper / Silicon / Thorium:[] +5% Dmg / FireRate / Range per slot.\n" +
                        "• [yellow]Sallowyr:[] +1 Extra Bullet per slot equipped.\n" +
                        "• [yellow]Obsidis:[] +10% Attack, +10% Speed, +50% Range.\n" +
                        "• [yellow]Starlight:[] +5% Crit Chance, +15% Crit Dmg, Execute targets below 5% HP (+1000 Copper)." :
                        "[gold]⚡ THÔNG SỐ TRANG BỊ THÁP PHÁO ⚡[]\n" +
                        "[lightgray]Đồng:[] [yellow]" + this.getItemCount(1) + " / 4[] | " +
                        "[lightgray]Silicon:[] [yellow]" + this.getItemCount(2) + " / 4[] | " +
                        "[lightgray]Thorium:[] [yellow]" + this.getItemCount(3) + " / 4[]\n" +
                        "[lightgray]Sallowyr:[] [yellow]" + this.getItemCount(4) + " / 4[] | " +
                        "[lightgray]Obsidis:[] [yellow]" + this.getItemCount(5) + " / 4[] | " +
                        "[lightgray]Starlight:[] [yellow]" + this.getItemCount(6) + " / 4[]\n\n" +
                        "[lightgray]Tấn công:[] [green]" + statDmgPercent + "%[]\n" +
                        "[lightgray]Tốc độ bắn:[] [green]" + statSpeedPercent + "%[]\n" +
                        "[lightgray]Tầm bắn hiệu dụng:[] [orange]" + currentRangePx + " pixel[] [lime](" + statRangePercent + "%)[]\n" +
                        "[lightgray]Tỉ lệ bạo kích:[] [cyan]" + critChance + "%[]\n" +
                        "[lightgray]Sát thương bạo kích:[] [cyan]" + critDmgPercent + "%[]\n\n" +
                        "[sky]⚡ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                        "• Bắn thường có [purple]10% tỉ lệ[] bắn ra Sao Đen Tím gây [scarlet]50% Max HP của mục tiêu[].\n\n" +
                        "[sky]⚡ CƠ CHẾ BUFF TRANG BỊ:[]\n" +
                        "• [yellow]Đồng / Silicon / Thorium:[] +5% Tấn công / Tốc độ / Tầm bắn mỗi ô.\n" +
                        "• [yellow]Sallowyr:[] +1 Đạn bắn ra cho mỗi trang bị.\n" +
                        "• [yellow]Obsidis:[] +10% TC/TĐ, +50% PB.\n" +
                        "• [yellow]Starlight:[] +5% Bạo, +15% ST Bạo, Kết liễu mục tiêu <5% HP (+1000 Đồng).";

                    let dialog = extend(BaseDialog, title, {});
                    let infoTable = new Table();
                    let cell = infoTable.add(descStr).width(360);
                    cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                    let scroll = new ScrollPane(infoTable);
                    scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400);
                    dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip(isEn() ? "View detailed stats" : "Xem thông số chi tiết hệ thống");

                table.add(topRowTable).center().padBottom(3).row();

                UniversalItemUI.buildSlotUI(table, this, () => {
                    this.configure(java.lang.Integer(this.getSlotConfig()));
                    this.deselect();
                });
            },

            config() { return java.lang.Integer(this.getSlotConfig()); },

            configured(builder, value) {
                this.super$configured(builder, value);
            },

            write(write) {
                this.super$write(write);
                write.s(this.getSlotConfig());
            },

            read(read, revision) {
                this.super$read(read, revision);
                this.setSlotConfig(read.s());
            },

            spawnCustomBullet(bulletType, x, y, angle) {
                let b = bulletType.create(this, this.team, x, y, angle);
                if (b != null) {
                    b.lifetime = bulletType.lifetime * this.getRangeMultiplier();
                }
                return b;
            },

            getFaceCorners(){
                let d = 18;
                return [
                    {x: d, y: d},
                    {x: -d, y: d},
                    {x: -d, y: -d},
                    {x: d, y: -d}
                ];
            },

            applyRecoil(amount) {
                this.customRecoil = Math.min(6.0, this.customRecoil + amount);
            },

            updateTile(){
                this.super$updateTile();

                let isDirectControlled = this.isControlled() || this.logicControlled();
                let targetAngle = this.rotation;

                if (isDirectControlled) {
                    let u = this.unit;
                    if (u != null) {
                        targetAngle = this.angleTo(u.aimX, u.aimY);
                        if (this.isShooting && this.reloadCounter <= 0 && this.hasAmmo()) {
                            this.shoot(this.peekAmmo());
                        }
                    }
                }

                if (this.hasAmmo()) {
                    this.rotation = Angles.moveToward(this.rotation, targetAngle, this.rotateSpeed * Time.delta);
                }

                let dt = Time.delta * this.getSpeedMultiplier();

                this.customRecoil = Mathf.lerpDelta(this.customRecoil, 0, 0.12);

                let targetOrbRadius = 0;
                let maxOrbRadius = 9.0;
                let midOrbRadius = 6.0;

                if(this.chargeState === 0){
                    targetOrbRadius = (this.normalShotCount / 5.0) * maxOrbRadius;
                } else if(this.chargeState === 1){
                    let shotsDone = Mathf.clamp(this.chargeShotCount, 0, 3);
                    targetOrbRadius = maxOrbRadius - (shotsDone / 3.0) * (maxOrbRadius - midOrbRadius);
                } else if(this.chargeState === 2){
                    let shotsDone = Mathf.clamp(this.state2ShotIndex, 0, 4);
                    targetOrbRadius = midOrbRadius - (shotsDone / 4.0) * midOrbRadius;
                }

                this.orbVisualRadius = Mathf.lerpDelta(this.orbVisualRadius, targetOrbRadius, 0.08);

                let orbX = this.x - Mathf.cosDeg(this.rotation) * 5;
                let orbY = this.y - Mathf.sinDeg(this.rotation) * 5;

                if(this.chargeState === 1){
                    this.chargeTimer += dt;
                    let muzzleX = this.x + Mathf.cosDeg(this.rotation) * this.convergenceDistance;
                    let muzzleY = this.y + Mathf.sinDeg(this.rotation) * this.convergenceDistance;

                    if(Mathf.chanceDelta(0.6)){
                        let randAng = Mathf.rand.random(360);
                        let randDist = Mathf.rand.random(8, 20);
                        let px = orbX + Angles.trnsx(randAng, randDist);
                        let py = orbY + Angles.trnsy(randAng, randDist);
                        absorbEnergyFx.at(px, py);
                    }

                    if(Mathf.chanceDelta(0.4)){
                        muzzleSparkFx.at(muzzleX, muzzleY, this.rotation);
                    }

                    if(this.chargeTimer >= this.chargeDuration){
                        this.finishChargeAndShoot(muzzleX, muzzleY);
                    }
                }

                if(this.chargeState === 2){
                    this.chargeTimer += dt;

                    if(this.state2SubStage === 0){
                        if(this.chargeTimer >= 40){
                            this.state2SubStage = 1;
                            this.state2ShotIndex = 0;
                            this.state2MoveTimer = 0;
                        }
                    } else if(this.state2SubStage === 1){
                        this.state2MoveTimer += dt;

                        if(Mathf.chanceDelta(0.5)){
                            let ang = Mathf.rand.random(360);
                            let len = Mathf.rand.random(10, 25);
                            absorbEnergyFx.at(orbX + Angles.trnsx(ang, len), orbY + Angles.trnsy(ang, len));
                        }

                        if(this.state2MoveTimer >= this.state2MoveDuration){
                            let muzzleX = this.x + Mathf.cosDeg(this.rotation) * this.convergenceDistance;
                            let muzzleY = this.y + Mathf.sinDeg(this.rotation) * this.convergenceDistance;

                            let lightningX = muzzleX + Mathf.cosDeg(this.rotation) * 5;
                            let lightningY = muzzleY + Mathf.sinDeg(this.rotation) * 5;

                            this.spawnCustomBullet(chargedBulletState3, muzzleX, muzzleY, this.rotation);
                            this.applyRecoil(5.0);

                            state3ShockwaveFx.at(muzzleX, muzzleY, this.rotation);
                            lightningAroundTurretFx.at(lightningX, lightningY);
                            Effect.shake(6, 8, this.x, this.y);
                            customShootFx.at(muzzleX, muzzleY, this.rotation);

                            this.state2ShotIndex++;
                            this.state2MoveTimer = 0;

                            if(this.state2ShotIndex >= 4){
                                this.chargeState = 0;
                                this.normalShotCount = 0;
                                this.chargeShotCount = 0;
                                this.state2SubStage = 0;
                            }
                        }
                    }
                }
            },

            shoot(type){
                if(this.chargeState !== 0) return;

                if(this.normalShotCount < 5){
                    this.fireFourCornerBullets();
                    this.normalShotCount++;

                    if(this.normalShotCount >= 5){
                        this.chargeState = 1;
                        this.chargeTimer = 0;
                    }
                }
                this.useAmmo();
            },

            fireFourCornerBullets(){
                let rad = this.rotation * Mathf.degRad;
                let cos = Mathf.cos(rad);
                let sin = Mathf.sin(rad);

                let offsets = [
                    {x: 0, y: this.cornerOffset},
                    {x: 0, y: -this.cornerOffset},
                    {x: -this.cornerOffset, y: 0},
                    {x: this.cornerOffset, y: 0}
                ];

                for(let i = 0; i < 4; i++){
                    let rx = offsets[i].x * cos - offsets[i].y * sin;
                    let ry = offsets[i].x * sin + offsets[i].y * cos;
                    let spawnX = this.x + rx;
                    let spawnY = this.y + ry;
                    let angleSpread = (i - 1.5) * (GOLDEN_ANGLE_DEG * 0.05);

                    let selectedBullet;
                    if(Mathf.chance(0.10)){
                        selectedBullet = aetherDarkVoidBullet;
                    } else {
                        let randomIndex = Math.floor(Math.random() * aetherNormalBulletPool.length);
                        selectedBullet = aetherNormalBulletPool[randomIndex];
                    }

                    this.spawnCustomBullet(selectedBullet, spawnX, spawnY, this.rotation + angleSpread);
                }

                let extraCount = this.getExtraBullets();
                for(let k = 0; k < extraCount; k++){
                    let spreadAngle = (k + 1) * 8.0;
                    
                    let randLeft = Mathf.chance(0.10) ? aetherDarkVoidBullet : aetherNormalBulletPool[Math.floor(Math.random() * aetherNormalBulletPool.length)];
                    let randRight = Mathf.chance(0.10) ? aetherDarkVoidBullet : aetherNormalBulletPool[Math.floor(Math.random() * aetherNormalBulletPool.length)];
                    
                    this.spawnCustomBullet(randLeft, this.x, this.y, this.rotation + spreadAngle);
                    this.spawnCustomBullet(randRight, this.x, this.y, this.rotation - spreadAngle);
                }

                customShootFx.at(this.x, this.y, this.rotation);
            },

            finishChargeAndShoot(targetX, targetY){
                mergeEnergyFx.at(targetX, targetY);
                this.spawnCustomBullet(chargedBulletState2, targetX, targetY, this.rotation);
                this.applyRecoil(4.0);

                distortedShockwaveFx.at(targetX, targetY, this.rotation);
                Effect.shake(6, 8, this.x, this.y);

                this.chargeShotCount++;
                this.chargeTimer = 0;

                if(this.chargeShotCount >= 3){
                    this.chargeState = 2;
                    this.state2SubStage = 0;
                    this.state2ShotIndex = 0;
                } else {
                    this.chargeState = 1;
                }
            },

            draw(){
                this.super$draw();

                let rad = this.rotation * Mathf.degRad;
                let cos = Mathf.cos(rad);
                let sin = Mathf.sin(rad);

                let topRegion = Core.atlas.find("newex-aether-spiral-top");
                if(topRegion.found){
                    let recoilPx = this.customRecoil;
                    let drawOffset = 10 - recoilPx;
                    let drawX = this.x + cos * drawOffset;
                    let drawY = this.y + sin * drawOffset;

                    Draw.z(Layer.turret + 0.1);
                    Draw.rect(topRegion, drawX, drawY, this.rotation - 90);
                }

                let muzzleX = this.x + Mathf.cosDeg(this.rotation) * this.convergenceDistance;
                let muzzleY = this.y + Mathf.sinDeg(this.rotation) * this.convergenceDistance;

                let orbX = this.x - cos * 5;
                let orbY = this.y - sin * 5;

                if(this.orbVisualRadius > 0.2){
                    Draw.z(Layer.bullet + 0.9);
                    
                    Draw.color(Color.cyan);
                    Draw.alpha(0.6 + 0.2 * Mathf.sin(Time.time * 0.1));
                    Fill.circle(orbX, orbY, this.orbVisualRadius * 1.25);

                    Draw.color(Color.white);
                    Draw.alpha(0.9);
                    Fill.circle(orbX, orbY, this.orbVisualRadius * 0.65);

                    Draw.reset();
                }

                if(this.chargeState === 1){
                    let progress = Mathf.clamp(this.chargeTimer / this.chargeDuration);

                    let offsets = [
                        {x: 0, y: this.cornerOffset},
                        {x: 0, y: -this.cornerOffset},
                        {x: -this.cornerOffset, y: 0},
                        {x: this.cornerOffset, y: 0}
                    ];

                    Draw.z(Layer.bullet + 1);
                    for(let i = 0; i < 4; i++){
                        let rx = offsets[i].x * cos - offsets[i].y * sin;
                        let ry = offsets[i].x * sin + offsets[i].y * cos;
                        let startX = this.x + rx;
                        let startY = this.y + ry;
                        let easeProgress = Mathf.pow(progress, 2);
                        let curX = Mathf.lerp(startX, muzzleX, easeProgress);
                        let curY = Mathf.lerp(startY, muzzleY, easeProgress);

                        drawAsymmetricStar(curX, curY, this.rotation, progress * 0.8, Color.white, Color.cyan);
                    }
                    Draw.reset();
                }

                if(this.chargeState === 2){
                    let faceCorners = this.getFaceCorners();

                    Draw.z(Layer.bullet + 1);

                    for(let i = 0; i < 4; i++){
                        if(this.state2SubStage === 1 && i < this.state2ShotIndex) continue;

                        let corner = faceCorners[i];
                        let rx = corner.x * cos - corner.y * sin;
                        let ry = corner.x * sin + corner.y * cos;
                        let startX = this.x + rx;
                        let startY = this.y + ry;

                        let curX = startX;
                        let curY = startY;
                        let curRot = this.rotation;

                        if(this.state2SubStage === 0){
                            let progress = Mathf.clamp(this.chargeTimer / 40);
                            drawAsymmetricStar(curX, curY, curRot, progress * 1.1, Color.white, Color.sky);
                        } else if(this.state2SubStage === 1){
                            if(i === this.state2ShotIndex){
                                let moveProgress = Mathf.clamp(this.state2MoveTimer / this.state2MoveDuration);
                                curX = Mathf.lerp(startX, muzzleX, moveProgress);
                                curY = Mathf.lerp(startY, muzzleY, moveProgress);
                                drawAsymmetricStar(curX, curY, curRot, 1.2, Color.white, Color.cyan);
                            } else {
                                drawAsymmetricStar(curX, curY, curRot, 1.1, Color.white, Color.sky);
                            }
                        }
                    }
                    Draw.reset();
                }
            }
        });
    }
});

Events.on(WorldLoadEvent, event => {
    Time.run(10, () => {
        updateAetherSpiralVisibility();
    });
});

Events.on(BlockBuildEndEvent, event => {
    updateAetherSpiralVisibility();
});

Events.on(BlockDestroyEvent, event => {
    const aetherTurret = Vars.content.block("newex-aether-spiral") || Vars.content.block("aether-spiral");
    if (!aetherTurret) return;

    let destroyedTile = event.tile;
    if (!destroyedTile || !destroyedTile.build) return;

    let destroyedBuild = destroyedTile.build;
    let victimTeam = destroyedBuild.team;

    if (destroyedBuild.block instanceof CoreBlock) {
        let teamData = victimTeam.data();
        let maxAllowed = teamData.cores.size - 1;
        if (maxAllowed < 0) maxAllowed = 0;

        let teamTurrets = [];
        Groups.build.each(b => {
            if (b.block === aetherTurret && b.team === victimTeam) {
                teamTurrets.push(b);
            }
        });

        if (teamTurrets.length > maxAllowed) {
            let toDestroy = teamTurrets.length - maxAllowed;
            for (let i = 0; i < toDestroy; i++) {
                let lastTurret = teamTurrets.pop();
                Call.sendMessage("[red]Đội " + victimTeam.name + " bị mất Lõi! Pháo Aether Spiral thừa đã tự hủy![]");
                lastTurret.kill();
            }
        }
    }

    updateAetherSpiralVisibility();
});