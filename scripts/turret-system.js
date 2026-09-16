// ==========================================
// 1. HELPER & UTILS
// ==========================================
const packCons2 = (func) => new Cons2({ get: func });
const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const isEn = () => Core.settings.getString("locale").startsWith("en");

const customNoneFx = new Effect(0, e => {});

const critEffect = new Effect(20, e => {
    Draw.color(Color.gold, Color.scarlet, e.fin());
    for (let i = 0; i < 4; i++) {
        let angle = i * 90 + 45;
        let len = 3 + e.fin() * 10;
        Drawf.tri(e.x + Mathf.cosDeg(angle) * (len * 0.2), e.y + Mathf.sinDeg(angle) * (len * 0.2), 3 * e.fout(), len, angle);
    }
});

const executeFx = new Effect(25, e => {
    Draw.color(Pal.accent, Color.white, e.fin());
    Lines.stroke(e.fout() * 3.0);
    Lines.circle(e.x, e.y, e.finpow() * 25.0);
    Draw.color(Color.gold);
    for (let i = 0; i < 4; i++) {
        Lines.lineAngle(e.x, e.y, i * 90 + 45, e.finpow() * 20.0);
    }
});

const physicalImpactFx = new Effect(25, e => {
    Draw.color(Pal.lightOrange, Color.gray, e.fin());
    Lines.stroke(e.fout() * 2.5);
    Lines.circle(e.x, e.y, e.finpow() * 16.0);
    Draw.color(Pal.accent);
    Fill.circle(e.x, e.y, e.fout() * 5.0);
});

const miniCrosshairWarningFx = new Effect(60, e => {
    if (Vars.state.isPaused()) return;
    Draw.z(Layer.effect + 0.01);
    let fout = e.fout(), fin = e.fin(), color = Pal.accent;
    Draw.color(color);
    Lines.stroke(1.8 * fout);
    Lines.circle(e.x, e.y, 30.0 * fin);
    let crossSize = 16.0 * fout;
    Lines.stroke(2.0 * fout, color);
    Lines.line(e.x - crossSize, e.y, e.x + crossSize, e.y);
    Lines.line(e.x, e.y - crossSize, e.x, e.y + crossSize);
    Fill.circle(e.x, e.y, 3.0 * fout);
    Draw.reset();
});

const chargedExplosionFx = new Effect(35, e => {
    Draw.color(Color.valueOf("a855f7"), Color.valueOf("fef08a"), e.fin());
    Lines.stroke(e.fout() * 4.0); Lines.circle(e.x, e.y, e.finpow() * 20.0);
    Lines.stroke(e.fout() * 2.0); Lines.circle(e.x, e.y, e.finpow() * 12.0);
    Draw.color(Color.valueOf("fef08a")); Fill.circle(e.x, e.y, e.fout() * 8.0);
});

const laserBeamFx = new Effect(20, e => {
    if (!e.data) return;
    Draw.color(Color.valueOf("fef08a"), Color.valueOf("a855f7"), e.fin());
    Lines.stroke(e.fout() * 3.5); Lines.line(e.x, e.y, e.data.x, e.data.y);
    Fill.circle(e.x, e.y, e.fout() * 4.0); Fill.circle(e.data.x, e.data.y, e.fout() * 5.0);
});

const mainToSpawnLaserFx = new Effect(20, e => {
    if (!e.data) return;
    Draw.color(Color.valueOf("fef08a"), Color.white, e.fin());
    Lines.stroke(e.fout() * 3.0); Lines.line(e.x, e.y, e.data.x, e.data.y);
    Fill.circle(e.x, e.y, e.fout() * 5.0);
});

const starSwordBullet = extend(BasicBulletType, {
    speed: 9.0, damage: 120, lifetime: 45, width: 8.0, height: 12.0,
    frontColor: Color.valueOf("#ffffff"), backColor: Color.valueOf("#ffd700"),
    trailColor: Color.valueOf("#75e3ff"), trailEffect: Fx.disperseTrail, trailChance: 0.3,
    pierce: true, pierceCap: 2, hitEffect: critEffect, despawnEffect: critEffect,
    draw(b) {
        let region = Core.atlas.find("newex-starsword", Core.atlas.find("starsword"));
        if (region.found()) Draw.rect(region, b.x, b.y, this.width, this.height, b.rotation() - 90);
        else this.super$draw(b);
    }
});

const directBeamLaser = extend(LaserBulletType, {
    damage: 150, length: 120, width: 12, lifetime: 20, colors: [Pal.accent, Color.white]
});

const dummyBullet = extend(BasicBulletType, {
    speed: 0, lifetime: 0, damage: 0, collides: false, hitEffect: customNoneFx, despawnEffect: customNoneFx
});

// ==========================================
// 2. ITEM STATS & PASSIVES
// ==========================================
const ItemStats = {
    "copper": { damage: 0.05, desc: "[stat]+5% Sát thương[]" },
    "silicon": { reload: 0.05, desc: "[stat]+5% Tốc độ bắn[]" },
    "thorium": { range: 0.05, desc: "[stat]+5% Tầm bắn[]" },
    "starlight": { critChance: 0.15, critMultiplier: 0.50, extraBullet: starSwordBullet, desc: "[stat]+15% Chí mạng | +50% ST Chí mạng\nBắn kèm đạn Kiếm Sao (150% + 120 ST)[]" },
    "sallowyr": { desc: "[stat]Bắn thêm 1 đạn/laser (150% ST gốc) khi HP <80%[]" },
    "obsidis": { damage: 0.10, reload: 0.10, range: 0.50, desc: "[stat]+10% TC/TĐ, +50% Tầm bắn[]" }
};

function applyDamageWithStarlight(sourceBuild, targetUnit, baseDmg) {
    if (targetUnit == null || !targetUnit.isValid() || targetUnit.dead) return;
    let critChance = sourceBuild.getCritChance ? sourceBuild.getCritChance() : 0.0;
    let critDmgMult = sourceBuild.getCritMultiplier ? sourceBuild.getCritMultiplier() : 1.0;
    let hasStarlightPassive = sourceBuild.hasStarlightPassive ? sourceBuild.hasStarlightPassive() : false;

    let hpRatioBeforeHit = targetUnit.health / targetUnit.maxHealth;
    let finalDmg = baseDmg * Mathf.random(0.5, 2.0);

    if (Mathf.chance(critChance)) finalDmg *= critDmgMult;
    targetUnit.damage(finalDmg);

    if (hasStarlightPassive && targetUnit.isValid() && !targetUnit.dead) {
        if (hpRatioBeforeHit <= 0.05 || targetUnit.health <= targetUnit.maxHealth * 0.05) {
            targetUnit.kill();
            executeFx.at(targetUnit.x, targetUnit.y);
            let core = sourceBuild.team.core();
            if (core != null) {
                let copperItem = Vars.content.getByName(ContentType.item, "copper") || Items.copper;
                if (copperItem != null) {
                    core.items.add(copperItem, 1000);
                    Call.label("+1000 Copper", 1.5, targetUnit.x, targetUnit.y);
                }
            }
        }
    }
}

// ==========================================
// 3. UNIVERSAL ITEM UI
// ==========================================
const UniversalItemUI = {
    buildSlotUI(table, build, itemStorage, onItemChange) {
        let slotsTable = new Table();
        slotsTable.background(Styles.black6);
        slotsTable.margin(6);

        let maxSlots = build.block.maxEquipmentSlots || 4;
        let core = build.team.core();

        for (let i = 0; i < maxSlots; i++) {
            let slotIndex = i;
            let currentItem = itemStorage.slots[slotIndex] || null;
            let hasItemInCore = currentItem != null && core != null && core.items.has(currentItem, 1);

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
                    if (currentCore != null) currentCore.items.add(currentItem, 1);
                    itemStorage.slots[slotIndex] = null;
                    if (onItemChange) onItemChange(build, slotIndex, null);
                } else {
                    this.showItemSelectionDialog(build, (selectedItem) => {
                        itemStorage.slots[slotIndex] = selectedItem;
                        if (onItemChange) onItemChange(build, slotIndex, selectedItem);
                    });
                }
            }).size(44).pad(3).get();

            if (currentItem != null) {
                let cleanName = currentItem.name.replace("newex-", "");
                let buffText = ItemStats[cleanName] ? ItemStats[cleanName].desc : "[gray]Không có chỉ số buff[]";
                let tooltipText = "[accent]" + currentItem.localizedName + "[]\n" + buffText;
                slotBtn.addListener(new Tooltip(cons(t => {
                    t.background(Styles.black6).margin(8);
                    t.add(tooltipText);
                })));
                slotBtn.setColor(hasItemInCore ? Pal.heal : Pal.remove);
            } else {
                slotBtn.addListener(new Tooltip(cons(t => {
                    t.background(Styles.black6).margin(8);
                    t.add("[gray]Nhấp để gắn trang bị[]");
                })));
                slotBtn.setColor(Color.white);
            }
        }
        table.add(slotsTable).padLeft(6);
    },

    showItemSelectionDialog(build, onSelect) {
        let dialog = new BaseDialog("Kho Trang Bị");
        dialog.addCloseButton();
        let dialogWidth = Math.min(Core.graphics.getWidth() * 0.85, 360);

        dialog.cont.pane(p => {
            p.margin(6);
            let core = build.team.core();

            Vars.content.items().each(item => {
                let cleanName = item.name.replace("newex-", "");
                let statData = ItemStats[cleanName];
                if (!statData) return;

                let hasItem = core != null && core.items.has(item, 1);
                let btn = new Button(Styles.cleart);
                btn.margin(8);
                btn.add(new Image(item.uiIcon)).size(32).padRight(10).top();

                let infoTable = new Table();
                infoTable.left();
                let count = core != null ? core.items.get(item) : 0;
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
                        core.items.remove(item, 1);
                        onSelect(item);
                        dialog.hide();
                    } else {
                        Vars.ui.showInfoToast("[red]Lõi không có nguyên liệu này![]", 2);
                    }
                });
                p.add(btn).width(dialogWidth - 20).pad(3).row();
            });
        }).scrollX(false).grow();
        dialog.show();
    }
};

// ==========================================
// 4. BASE BUILD TEMPLATE
// ==========================================
function setupBaseTurret(turretBlock, baseMaxRange) {
    turretBlock.configurable = true;
    turretBlock.maxEquipmentSlots = 4;

    if (turretBlock.ammoTypes != null) {
        turretBlock.ammoTypes.put(Items.silicon, dummyBullet);
    }

    return {
        equipmentStorage: null,
        targetX: 0, targetY: 0, selectingTarget: false, baseMaxRange: baseMaxRange,
        hasTargetSet: false, burstQueue: 0, burstDelayTimer: 0, spinAngle: 0, orbitingBullets: [],

        initEq() {
            if (!this.equipmentStorage) {
                this.equipmentStorage = { slots: new Array(4).fill(null), timers: new Array(4).fill(0) };
            }
        },

        getItemCountByName(targetName) {
            this.initEq();
            let count = 0;
            for (let i = 0; i < 4; i++) {
                let item = this.equipmentStorage.slots[i];
                if (item && item.name.replace("newex-", "") === targetName) count++;
            }
            return count;
        },

        getDamageMultiplier() { return 1.0 + (this.getItemCountByName("obsidis") * 0.10) + (this.getItemCountByName("copper") * 0.05); },
        getSpeedMultiplier() { return 1.0 + (this.getItemCountByName("obsidis") * 0.10) + (this.getItemCountByName("silicon") * 0.05); },
        getRangeMultiplier() { return 1.0 + (this.getItemCountByName("obsidis") * 0.50) + (this.getItemCountByName("thorium") * 0.05); },
        getCritChance() { return this.getItemCountByName("starlight") * 0.15; },
        getCritMultiplier() { return 1.0 + (this.getItemCountByName("starlight") * 0.50); },
        hasStarlightPassive() { return this.getItemCountByName("starlight") > 0; },
        hasSallowyrPassive() { return this.getItemCountByName("sallowyr") > 0; },
        range() { return this.baseMaxRange * this.getRangeMultiplier(); },

        buildConfiguration(table) {
            this.initEq();
            table.clear(); table.row();

            table.button(Icon.commandRally, Styles.cleari, 40, packRun(() => {
                this.deselect();
                this.selectingTarget = true;
                Vars.ui.hudfrag.showToast(isEn() ? "Click target location within range!" : "Nhấp vào vị trí mục tiêu bắn trong tầm hoạt động!");
            })).size(50, 40).tooltip(isEn() ? "Set Target Location" : "Đặt vị trí mục tiêu bắn");

            UniversalItemUI.buildSlotUI(table, this, this.equipmentStorage, (b, idx, item) => {
                b.deselect();
            });
        },

        write(write) {
            this.super$write(write);
            this.initEq();
            write.i(this.equipmentStorage.slots.length);
            for (let i = 0; i < this.equipmentStorage.slots.length; i++) {
                let item = this.equipmentStorage.slots[i];
                write.s(item != null ? item.id : -1);
            }
            write.f(this.targetX); write.f(this.targetY); write.bool(this.hasTargetSet);
        },

        read(read, revision) {
            this.super$read(read, revision);
            this.initEq();
            let count = read.i();
            for (let i = 0; i < count; i++) {
                let itemId = read.s();
                if (i < 4) this.equipmentStorage.slots[i] = (itemId !== -1) ? Vars.content.item(itemId) : null;
            }
            this.targetX = read.f(); this.targetY = read.f(); this.hasTargetSet = read.bool();
        }
    };
}

module.exports = {
    setupBaseTurret: setupBaseTurret,
    applyDamageWithStarlight: applyDamageWithStarlight,
    directBeamLaser: directBeamLaser,
    miniCrosshairWarningFx: miniCrosshairWarningFx,
    physicalImpactFx: physicalImpactFx,
    mainToSpawnLaserFx: mainToSpawnLaserFx,
    laserBeamFx: laserBeamFx,
    chargedExplosionFx: chargedExplosionFx,
    packCons: packCons,
    packRun: packRun,
    isEn: isEn
};