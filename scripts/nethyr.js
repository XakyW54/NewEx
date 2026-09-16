const packCons2 = (func) => new Cons2({ get: func });
const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");
const customNoneFx = new Effect(0, e => {});

const ItemStats = {
    "copper": { damage: 0.05, desc: isEn() ? "[stat]+5% Dmg[]" : "[stat]+5% Sát thương[]" },
    "silicon": { reload: 0.05, desc: isEn() ? "[stat]+5% Fire Rate[]" : "[stat]+5% Tốc độ bắn[]" },
    "thorium": { range: 0.05, desc: isEn() ? "[stat]+5% Range[]" : "[stat]+5% Tầm bắn[]" },
    "sallowyr": { desc: isEn() ? "[stat]Bonus 1 physical projectile (150% Base Dmg) when target HP <80%[]" : "[stat]Bắn thêm 1 đạn vật lý (150% ST gốc) khi máu <80%[]" },
    "obsidis": { damage: 0.10, reload: 0.10, range: 0.50, desc: isEn() ? "[stat]+10% Dmg/FireRate, +50% Range[]" : "[stat]+10% TC/TĐ, +50% Tầm bắn[]" },
    "starlight": { critChance: 0.05, critMultiplier: 0.15, desc: isEn() ? "[stat]+5% Crit | +15% CritDmg\nExecute targets below 5% HP (+1000 Copper)[]" : "[stat]+5% Bạo | +15% ST Bạo\nKết liễu mục tiêu <5% HP (+1000 Đồng)[]" }
};

const physicalImpactFx = new Effect(25, e => {
    Draw.color(Pal.lightOrange, Color.gray, e.fin());
    Lines.stroke(e.fout() * 2.5);
    Lines.circle(e.x, e.y, e.finpow() * 16.0);
    Draw.color(Pal.accent);
    Fill.circle(e.x, e.y, e.fout() * 5.0);
});

const executeFx = new Effect(25, e => {
    Draw.color(Pal.accent, Color.white, e.fin());
    Lines.stroke(e.fout() * 3.0);
    Lines.circle(e.x, e.y, e.finpow() * 25.0);
    Draw.color(Color.gold);
    for (let i = 0; i < 4; i++) {
        let angle = i * 90 + 45;
        Lines.lineAngle(e.x, e.y, angle, e.finpow() * 20.0);
    }
});

function applyDamageWithStarlight(sourceBuild, targetUnit, baseDmg) {
    if (targetUnit == null || !targetUnit.isValid() || targetUnit.dead) return;

    let critChance = sourceBuild.getCritChance ? sourceBuild.getCritChance() : 0.0;
    let critDmgMult = sourceBuild.getCritMultiplier ? sourceBuild.getCritMultiplier() : 1.0;
    let hasStarlightPassive = sourceBuild.hasStarlightPassive ? sourceBuild.hasStarlightPassive() : false;

    let hpRatioBeforeHit = targetUnit.health / targetUnit.maxHealth;
    let finalDmg = baseDmg * Mathf.random(0.5, 2.0);

    if (Mathf.chance(critChance)) {
        finalDmg *= critDmgMult;
    }

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

const dummyBullet = extend(BasicBulletType, {
    speed: 0, lifetime: 0, damage: 0, collides: false,
    hitEffect: customNoneFx, despawnEffect: customNoneFx
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
                    if (currentCore != null) currentCore.items.add(currentItem, 1);
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
                        core.items.remove(item, 1);
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

Events.on(ContentInitEvent, () => {
    const turretBlock = Vars.content.getByName(ContentType.block, "newex-nethyr");

    if (turretBlock != null) {
        turretBlock.configurable = true;

        if (turretBlock.ammoTypes != null) {
            turretBlock.ammoTypes.put(Items.silicon, dummyBullet);
        }

        turretBlock.config(java.lang.Integer, packCons2((tile, value) => {
            if (tile != null && tile.setSlotConfig !== undefined) {
                tile.setSlotConfig(value);
            }
        }));

        turretBlock.buildType = () => extend(ItemTurret.ItemTurretBuild, turretBlock, {
            targetX: 0,
            targetY: 0,
            selectingTarget: false,
            baseMaxRange: 380,

            hasTargetSet: false,
            burstQueue: 0,
            burstDelayTimer: 0,

            spinAngle: 0,
            equipSlots: [0, 0, 0, 0],
            orbitingBullets: [],

            created() {
                this.super$created();
                this.targetX = this.x;
                this.targetY = this.y;
                this.hasTargetSet = true;
                this.orbitingBullets = [];
            },

            placed() {
                this.super$placed();
                this.targetX = this.x;
                this.targetY = this.y;
                this.hasTargetSet = true;
                this.orbitingBullets = [];
            },

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
            hasSallowyrPassive() { return this.getItemCount(4) > 0; },
            range() { return this.baseMaxRange * this.getRangeMultiplier(); },
            updateShooting() { this.reloadCounter = 0; },

            buildConfiguration(table) {
                table.clear();

                let topRowTable = new Table();
                topRowTable.background(Styles.black6);
                topRowTable.margin(0);

                topRowTable.button(Icon.commandRally, Styles.cleari, 40, packRun(() => {
                    this.deselect();
                    this.selectingTarget = true;
                    Vars.ui.hudfrag.showToast(isEn() ? "Click target location within range!" : "Nhấp vào vị trí mục tiêu bắn trong tầm hoạt động!");
                })).size(50, 40).tooltip(isEn() ? "Set Target Location" : "Đặt vị trí mục tiêu bắn");

                topRowTable.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = isEn() ? " Nethyr Turret Stats " : " Thông số pháo Nethyr ";
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
                        "[sky]⚡ ITEM BUFF MECHANIC:[]\n" +
                        "• [yellow]Copper / Silicon / Thorium:[] +5% Dmg / FireRate / Range per slot.\n" +
                        "• [yellow]Sallowyr:[] Passive: Fires 1 extra physical projectile dealing 150% base dmg when target HP < 80%.\n" +
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
                        "[sky]⚡ CƠ CHẾ BUFF TRANG BỊ:[]\n" +
                        "• [yellow]Đồng / Silicon / Thorium:[] +5% Tấn công / Tốc độ / Tầm bắn mỗi ô.\n" +
                        "• [yellow]Sallowyr:[] Nội tại: Bắn thêm 1 đạn vật lý 150% ST gốc khi máu mục tiêu < 80%.\n" +
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
                if (typeof value === "number") {
                    let pos = Point2.unpack(value);
                    let destX = pos.x * Vars.tilesize;
                    let destY = pos.y * Vars.tilesize;

                    if (Mathf.dst(this.x, this.y, destX, destY) <= this.range()) {
                        this.targetX = destX;
                        this.targetY = destY;

                        this.hasTargetSet = true;
                        this.burstDelayTimer = Mathf.random(12, 120);
                        this.burstQueue = 1;
                        Fx.select.at(destX, destY);
                    } else {
                        Fx.smeltsmoke.at(destX, destY);
                    }
                }
            },

            write(write) {
                this.super$write(write);
                write.s(this.getSlotConfig());
                write.f(this.targetX);
                write.f(this.targetY);
                write.bool(this.hasTargetSet);
            },

            read(read, revision) {
                this.super$read(read, revision);
                this.setSlotConfig(read.s());
                this.targetX = read.f();
                this.targetY = read.f();
                this.hasTargetSet = read.bool();
            },

            updateTile() {
                this.super$updateTile();
                let dt = Time.delta;

                this.spinAngle = (this.spinAngle - 1.5 * dt) % 360;

                if (this.selectingTarget) {
                    if (Core.input.keyTap(KeyCode.mouseLeft)) {
                        let rawWorld = Core.camera.unproject(Core.input.mouse());
                        let currentRange = this.range();
                        let dist = Mathf.dst(this.x, this.y, rawWorld.x, rawWorld.y);
                        let finalX = rawWorld.x;
                        let finalY = rawWorld.y;

                        if (dist > currentRange) {
                            let angle = Angles.angle(this.x, this.y, rawWorld.x, rawWorld.y);
                            finalX = this.x + Angles.trnsx(angle, currentRange);
                            finalY = this.y + Angles.trnsy(angle, currentRange);
                        }

                        let tile = Vars.world.tileWorld(finalX, finalY);
                        if (tile != null) {
                            this.configure(Point2.pack(tile.x, tile.y));
                        }
                        this.selectingTarget = false;
                    }
                }

                let speedMultiplier = this.getSpeedMultiplier();
                let adjustedDt = dt * speedMultiplier;

                if (this.hasTargetSet) {
                    let zoneRadius = 30.0 * Vars.tilesize;
                    let targetEnemyFound = false;

                    Units.nearbyEnemies(this.team, this.targetX - zoneRadius, this.targetY - zoneRadius, zoneRadius * 2, zoneRadius * 2, packCons(u => {
                        if (u.within(this.targetX, this.targetY, zoneRadius) && !u.dead) {
                            targetEnemyFound = true;
                        }
                    }));

                    if (targetEnemyFound) {
                        if (this.burstQueue > 0) {
                            if (this.burstDelayTimer > 0) {
                                this.burstDelayTimer -= adjustedDt;
                            } else {
                                if (this.isReadyToShoot()) {
                                    this.fireAtTarget();
                                    if (this.hasAmmo()) this.useAmmo();
                                    this.burstQueue--;
                                }
                            }
                        } else {
                            this.burstDelayTimer = (Mathf.random(12, 120)) / speedMultiplier;
                            this.burstQueue = 1;
                        }
                    }
                }

                for (let i = this.orbitingBullets.length - 1; i >= 0; i--) {
                    let b = this.orbitingBullets[i];
                    b.timer += dt;

                    let orbitDuration = 100.0;
                    if (b.state === "orbit") {
                        let progress = b.timer / orbitDuration;
                        if (progress >= 1.0) {
                            b.state = "launch";
                            b.timer = 0;
                            let distToTarget = Mathf.dst(b.x, b.y, this.targetX, this.targetY);
                            let flySpeedPerTick = 12.0;
                            b.maxLifetime = distToTarget / flySpeedPerTick;
                            b.reachedInitialPoint = false;
                        } else {
                            let currentAngle = b.startAngle + progress * 720.0;
                            let orbitRadius = progress * 24.0;
                            b.x = this.x + Angles.trnsx(currentAngle, orbitRadius);
                            b.y = this.y + Angles.trnsy(currentAngle, orbitRadius);
                            b.rotation = currentAngle;
                        }
                    } else if (b.state === "launch") {
                        let flySpeed = 12.0 * dt;

                        if (!b.reachedInitialPoint) {
                            if (Mathf.dst(b.x, b.y, this.targetX, this.targetY) <= flySpeed) {
                                b.reachedInitialPoint = true;
                                b.x = this.targetX;
                                b.y = this.targetY;
                            }
                        }

                        if (b.reachedInitialPoint) {
                            if (b.targetUnit == null || !b.targetUnit.isValid() || b.targetUnit.dead) {
                                let zoneRadius = 30.0 * Vars.tilesize;
                                let chosenTarget = null;
                                Units.nearbyEnemies(this.team, this.targetX - zoneRadius, this.targetY - zoneRadius, zoneRadius * 2, zoneRadius * 2, packCons(u => {
                                    if (chosenTarget == null && u.within(this.targetX, this.targetY, zoneRadius) && !u.dead) {
                                        chosenTarget = u;
                                    }
                                }));
                                b.targetUnit = chosenTarget;
                            }
                        }

                        let destX = (b.reachedInitialPoint && b.targetUnit != null && b.targetUnit.isValid() && !b.targetUnit.dead) ? b.targetUnit.x : this.targetX;
                        let destY = (b.reachedInitialPoint && b.targetUnit != null && b.targetUnit.isValid() && !b.targetUnit.dead) ? b.targetUnit.y : this.targetY;

                        if (!b.reachedInitialPoint || (b.targetUnit != null && b.targetUnit.isValid() && !b.targetUnit.dead)) {
                            let angle = Angles.angle(b.x, b.y, destX, destY);
                            b.x += Angles.trnsx(angle, flySpeed);
                            b.y += Angles.trnsy(angle, flySpeed);
                            b.rotation = angle;

                            if (Mathf.chance(0.3)) {
                                Fx.shootHeal.at(b.x, b.y, angle, Pal.accent);
                            }
                        }

                        let hitEnemy = (b.reachedInitialPoint && b.targetUnit != null && b.targetUnit.isValid() && !b.targetUnit.dead && Mathf.dst(b.x, b.y, b.targetUnit.x, b.targetUnit.y) <= flySpeed);
                        let reachedMaxLife = (b.timer >= b.maxLifetime && (b.targetUnit == null || !b.targetUnit.isValid() || b.targetUnit.dead));

                        if (hitEnemy || reachedMaxLife) {
                            physicalImpactFx.at(b.x, b.y);

                            if (b.targetUnit != null && b.targetUnit.isValid() && !b.targetUnit.dead) {
                                let enemyHpRatio = b.targetUnit.health / b.targetUnit.maxHealth;

                                applyDamageWithStarlight(this, b.targetUnit, b.damage);

                                if (b.isExtra === false && this.hasSallowyrPassive() && enemyHpRatio < 0.80) {
                                    let extraDmg = 80.0 * 1.50 * this.getDamageMultiplier();
                                    this.spawnOrbitBullet(b.startAngle + 180, extraDmg, true);
                                }
                            } else {
                                Damage.damage(this.team, b.x, b.y, 16.0, b.damage);
                            }

                            this.orbitingBullets.splice(i, 1);
                        }
                    }
                }
            },

            spawnOrbitBullet(startAngle, baseDmg, isExtra) {
                this.orbitingBullets.push({
                    x: this.x,
                    y: this.y,
                    startAngle: startAngle,
                    timer: 0,
                    state: "orbit",
                    damage: baseDmg,
                    isExtra: !!isExtra,
                    targetUnit: null,
                    reachedInitialPoint: false,
                    maxLifetime: 180,
                    rotation: startAngle
                });
            },

            fireAtTarget() {
                let baseSubBeamDmg = 80.0;
                let subBeamDmg = baseSubBeamDmg * this.getDamageMultiplier();

                for (let i = 0; i < 3; i++) {
                    let angle = i * 120.0 + Mathf.random(360.0);
                    this.spawnOrbitBullet(angle, subBeamDmg, false);
                }
            },

            isReadyToShoot() {
                return this.isValid() && this.hasAmmo();
            },

            drawSelect() {
                this.super$drawSelect();
                Draw.z(Layer.overlayUI);
                Drawf.dashCircle(this.x, this.y, this.block.size * 4, Color.green);
                Draw.reset();
            },

            drawConfigure() {
                this.super$drawConfigure();
                let currentRange = this.range();
                let zoneRadius = 30.0 * Vars.tilesize;

                Draw.z(Layer.overlayUI);
                Drawf.dashCircle(this.x, this.y, currentRange, Pal.accent);

                if (this.hasTargetSet && Mathf.dst(this.x, this.y, this.targetX, this.targetY) <= currentRange) {
                    Drawf.dashLine(Pal.accent, this.x, this.y, this.targetX, this.targetY);
                    Drawf.square(this.targetX, this.targetY, 6.0, 0, Pal.accent);
                    Drawf.dashCircle(this.targetX, this.targetY, zoneRadius, Color.valueOf("fef08a"));
                }
                Draw.reset();
            },

            draw() {
                this.super$draw();

                let turretRegion = (this.block.turretRegion && typeof this.block.turretRegion.found === "function" && this.block.turretRegion.found()) 
                    ? this.block.turretRegion 
                    : this.block.region;

                Draw.rect(turretRegion, this.x, this.y, this.spinAngle);

                let bulletRegion = Core.atlas.find("newex-nethyr-bullet");

                for (let i = 0; i < this.orbitingBullets.length; i++) {
                    let b = this.orbitingBullets[i];
                    let rot = b.rotation || 0;

                    Drawf.light(b.x, b.y, 50.0, Pal.accent, 0.8);

                    if (bulletRegion.found()) {
                        Draw.color(Pal.accent);
                        Draw.rect(bulletRegion, b.x, b.y, bulletRegion.width * 1.25 / 4.0, bulletRegion.height * 1.25 / 4.0, rot - 90);
                        Draw.color();
                        Draw.rect(bulletRegion, b.x, b.y, rot - 90);
                    } else {
                        Draw.color(Pal.accent, Color.white, 0.4);
                        Lines.stroke(3.0);
                        Lines.poly(b.x, b.y, 5, 6.0, rot);

                        Draw.color(Pal.accent);
                        Lines.stroke(1.8);
                        Lines.poly(b.x, b.y, 5, 5.0, rot);

                        Draw.color(Color.white);
                        Lines.stroke(1.2);
                        Lines.poly(b.x, b.y, 5, 2.5, rot);
                    }
                }

                if (this.selectingTarget) {
                    let currentRange = this.range();
                    let zoneRadius = 30.0 * Vars.tilesize;

                    Draw.z(Layer.overlayUI);
                    Drawf.dashCircle(this.x, this.y, currentRange, Pal.accent);

                    let mouseWorld = Core.camera.unproject(Core.input.mouse());
                    let dist = Mathf.dst(this.x, this.y, mouseWorld.x, mouseWorld.y);
                    let isWithinRange = dist <= currentRange;
                    let targetColor = isWithinRange ? Pal.accent : Color.red;

                    Drawf.dashLine(targetColor, this.x, this.y, mouseWorld.x, mouseWorld.y);

                    let mouseTile = Vars.world.tileWorld(mouseWorld.x, mouseWorld.y);
                    if (mouseTile != null) {
                        Drawf.square(mouseTile.drawx(), mouseTile.drawy(), 6.0, 0, targetColor);
                        Drawf.dashCircle(mouseTile.drawx(), mouseTile.drawy(), zoneRadius, isWithinRange ? Color.valueOf("fef08a") : Color.red);
                    } else {
                        Drawf.square(mouseWorld.x, mouseWorld.y, 6.0, 0, targetColor);
                        Drawf.dashCircle(mouseWorld.x, mouseWorld.y, zoneRadius, isWithinRange ? Color.valueOf("fef08a") : Color.red);
                    }
                    Draw.reset();
                }
            }
        });
    }
});

Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && build.name === "newex-nethyr") {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        if (tile != null) {
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;
            Draw.z(Layer.overlayUI);
            Drawf.dashCircle(centerX, centerY, 380, Pal.accent);
            Draw.reset();
        }
    }
});