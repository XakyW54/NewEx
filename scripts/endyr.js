const packCons2 = (func) => new Cons2({ get: func });
const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

const customNoneFx = new Effect(0, e => {});

const chargedExplosionFx = new Effect(35, e => {
    let purple = Color.valueOf("a855f7"); 
    let lightYellow = Color.valueOf("fef08a"); 

    Draw.color(purple, lightYellow, e.fin());
    Lines.stroke(e.fout() * 4.0);
    Lines.circle(e.x, e.y, e.finpow() * 20.0);

    Lines.stroke(e.fout() * 2.0);
    Lines.circle(e.x, e.y, e.finpow() * 12.0);

    Draw.color(lightYellow);
    Fill.circle(e.x, e.y, e.fout() * 8.0);
});

const laserBeamFx = new Effect(20, e => {
    if (!e.data) return;
    let tx = e.data.x;
    let ty = e.data.y;

    Draw.color(Color.valueOf("fef08a"), Color.valueOf("a855f7"), e.fin());
    Lines.stroke(e.fout() * 3.5);
    Lines.line(e.x, e.y, tx, ty);
    Fill.circle(e.x, e.y, e.fout() * 4.0);
    Fill.circle(tx, ty, e.fout() * 5.0);
});

// Effect tạo đường laser nối từ tâm pháo đến điểm phát tia laser
const mainToSpawnLaserFx = new Effect(20, e => {
    if (!e.data) return;
    let spawnX = e.data.x;
    let spawnY = e.data.y;

    Draw.color(Color.valueOf("fef08a"), Color.white, e.fin());
    Lines.stroke(e.fout() * 3.0);
    Lines.line(e.x, e.y, spawnX, spawnY);
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
    let critChance = sourceBuild.getCritChance ? sourceBuild.getCritChance() : 0.0;
    let critDmgMult = sourceBuild.getCritMultiplier ? sourceBuild.getCritMultiplier() : 1.0;
    let hasStarlightPassive = sourceBuild.hasStarlightPassive ? sourceBuild.hasStarlightPassive() : false;

    let finalDmg = baseDmg;
    let isCrit = Mathf.chance(critChance);

    if (isCrit) {
        finalDmg *= critDmgMult;
    }

    targetUnit.damage(finalDmg);

    if (hasStarlightPassive && targetUnit.isValid() && !targetUnit.dead) {
        if (targetUnit.health <= targetUnit.maxHealth * 0.05) {
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

Events.on(ContentInitEvent, () => {
    const turretBlock = Vars.content.getByName(ContentType.block, "newex-endyr");

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
            burstIntervalTimer: 0,

            // Biến quản lý góc xoay đầu pháo theo chiều kim đồng hồ
            spinAngle: 0,

            equipSlots: [0, 0, 0, 0],

            created() {
                this.super$created();
                this.targetX = this.x;
                this.targetY = this.y;
                this.hasTargetSet = true;
            },

            placed() {
                this.super$placed();
                this.targetX = this.x;
                this.targetY = this.y;
                this.hasTargetSet = true;
            },

            getSlotType(slotIdx) {
                return this.equipSlots[slotIdx];
            },

            getItemCount(type) {
                let count = 0;
                for (let i = 0; i < 4; i++) {
                    if (this.equipSlots[i] === type) count++;
                }
                return count;
            },

            setSlotConfig(val) {
                let mask = val;
                for (let i = 0; i < 4; i++) {
                    this.equipSlots[i] = (mask >> (i * 3)) & 7;
                }
            },

            getSlotConfig() {
                let mask = 0;
                for (let i = 0; i < 4; i++) {
                    mask |= ((this.equipSlots[i] & 7) << (i * 3));
                }
                return mask;
            },

            getDamageMultiplier() {
                let oCount = this.getItemCount(2);
                return 1.0 + (oCount * 0.10);
            },

            getSpeedMultiplier() {
                let oCount = this.getItemCount(2);
                return 1.0 + (oCount * 0.10);
            },

            getRangeMultiplier() {
                let oCount = this.getItemCount(2);
                return 1.0 + (oCount * 0.50);
            },

            getCritChance() {
                let stCount = this.getItemCount(3);
                return stCount * 0.05;
            },

            getCritMultiplier() {
                let stCount = this.getItemCount(3);
                return 1.0 + (stCount * 0.15);
            },

            hasStarlightPassive() {
                return this.getItemCount(3) > 0;
            },

            hasSallowyrPassive() {
                return this.getItemCount(1) > 0;
            },

            range() {
                return this.baseMaxRange * this.getRangeMultiplier();
            },

            updateShooting() {
                this.reloadCounter = 0;
            },

            buildConfiguration(table) {
                table.clear(); table.row();

                table.button(Icon.commandRally, Styles.cleari, 40, packRun(() => {
                    this.deselect();
                    this.selectingTarget = true;
                    Vars.ui.hudfrag.showToast(isEn() ? "Click target location within range!" : "Nhấp vào vị trí mục tiêu bắn trong tầm hoạt động!");
                })).size(50, 40).tooltip(isEn() ? "Set Target Location" : "Đặt vị trí mục tiêu bắn");

                let slotsTable = new Table();
                let itemSallowyr = Vars.content.getByName(ContentType.item, "newex-sallowyr");
                let itemObsidis = Vars.content.getByName(ContentType.item, "newex-obsidis");
                let itemStarlight = Vars.content.getByName(ContentType.item, "newex-starlight");

                for (let i = 0; i < 4; i++) {
                    let slotIdx = i;
                    let slotType = this.equipSlots[slotIdx];

                    if (slotType === 0) {
                        slotsTable.button(Icon.add, Styles.cleari, 36, packRun(() => {
                            let core = this.team.core();
                            if (core == null) {
                                Vars.ui.showInfo(isEn() ? "[red]Team Core Not Found![]" : "[red]Không tìm thấy Lõi Đội![]");
                                return;
                            }

                            let dialog = extend(BaseDialog, isEn() ? "Select Equipment" : "Chọn vật phẩm trang bị", {});
                            let content = new Table();
                            let foundAny = false;

                            if (itemSallowyr != null && core.items.get(itemSallowyr) > 0) {
                                foundAny = true;
                                let countS = core.items.get(itemSallowyr);
                                let itemRow = new Table();
                                itemRow.button(new TextureRegionDrawable(itemSallowyr.uiIcon), Styles.cleari, 40, packRun(() => {
                                    if (core.items.get(itemSallowyr) > 0) {
                                        core.items.remove(itemSallowyr, 1);
                                        this.equipSlots[slotIdx] = 1;
                                        this.configure(java.lang.Integer(this.getSlotConfig()));
                                        Fx.mineHuge.at(this.x, this.y);
                                        dialog.hide();
                                        this.deselect();
                                    }
                                })).size(50, 50);
                                itemRow.add(isEn() ? " Sallowyr (Bonus Laser 150% Base Dmg vs <80% HP) [" + countS + "]" : " Sallowyr (Bắn thêm laser 150% gốc khi <80% HP) [" + countS + "]").padLeft(8);
                                content.add(itemRow).left().row();
                            }

                            if (itemObsidis != null && core.items.get(itemObsidis) > 0) {
                                foundAny = true;
                                let countO = core.items.get(itemObsidis);
                                let itemRow = new Table();
                                itemRow.button(new TextureRegionDrawable(itemObsidis.uiIcon), Styles.cleari, 40, packRun(() => {
                                    if (core.items.get(itemObsidis) > 0) {
                                        core.items.remove(itemObsidis, 1);
                                        this.equipSlots[slotIdx] = 2;
                                        this.configure(java.lang.Integer(this.getSlotConfig()));
                                        Fx.mineHuge.at(this.x, this.y);
                                        dialog.hide();
                                        this.deselect();
                                    }
                                })).size(50, 50);
                                itemRow.add(isEn() ? " Obsidis (+10% Dmg/Spd, +50% Range) [" + countO + "]" : " Obsidis (+10% TC/TĐ, +50% PB) [" + countO + "]").padLeft(8);
                                content.add(itemRow).left().row();
                            }

                            if (itemStarlight != null && core.items.get(itemStarlight) > 0) {
                                foundAny = true;
                                let countSt = core.items.get(itemStarlight);
                                let itemRow = new Table();
                                itemRow.button(new TextureRegionDrawable(itemStarlight.uiIcon), Styles.cleari, 40, packRun(() => {
                                    if (core.items.get(itemStarlight) > 0) {
                                        core.items.remove(itemStarlight, 1);
                                        this.equipSlots[slotIdx] = 3;
                                        this.configure(java.lang.Integer(this.getSlotConfig()));
                                        Fx.mineHuge.at(this.x, this.y);
                                        dialog.hide();
                                        this.deselect();
                                    }
                                })).size(50, 50);
                                itemRow.add(isEn() ? " Starlight (+5% Crit, +15% CritDmg, Execute <5% HP) [" + countSt + "]" : " Starlight (+5% Bạo, +15% ST Bạo, Kết liễu <5% HP) [" + countSt + "]").padLeft(8);
                                content.add(itemRow).left().row();
                            }

                            if (!foundAny) {
                                content.add(isEn() ? "[red]No valid items in Core![]" : "[red]Không có vật phẩm phù hợp trong Lõi![]");
                            }

                            dialog.cont.add(content);
                            dialog.addCloseButton();
                            dialog.show();
                        })).size(40, 40).tooltip(isEn() ? "Empty Slot (Click to Equip)" : "Ô Trống (Nhấp để trang bị)");
                    } else {
                        let equippedItem = (slotType === 1) ? itemSallowyr : ((slotType === 2) ? itemObsidis : itemStarlight);
                        let itemIconDrawable = (equippedItem != null) ? new TextureRegionDrawable(equippedItem.uiIcon) : Icon.cancel;
                        let itemName = (slotType === 1) ? "Sallowyr" : ((slotType === 2) ? "Obsidis" : "Starlight");

                        slotsTable.button(itemIconDrawable, Styles.cleari, 32, packRun(() => {
                            let dialog = extend(BaseDialog, isEn() ? "Unequip Item" : "Tháo trang bị", {});
                            dialog.cont.add(isEn() ? "Unequip '" + itemName + "' back to Core?" : "Tháo '" + itemName + "' và trả về Lõi?").row();
                            dialog.cont.add().height(10).row();
                            
                            let btnTable = new Table();
                            btnTable.button(Icon.cancel, Styles.cleari, 36, packRun(() => {
                                let core = this.team.core();
                                if (core != null && equippedItem != null) {
                                    core.items.add(equippedItem, 1);
                                }
                                this.equipSlots[slotIdx] = 0;
                                this.configure(java.lang.Integer(this.getSlotConfig()));
                                Fx.smoke.at(this.x, this.y);
                                dialog.hide();
                                this.deselect();
                            })).size(50, 50).tooltip(isEn() ? "Confirm Unequip" : "Xác nhận tháo");
                            
                            dialog.cont.add(btnTable);
                            dialog.addCloseButton();
                            dialog.show();
                        })).size(40, 40).tooltip(isEn() ? "Equipped: " + itemName + " (Click to Unequip)" : "Đã trang bị: " + itemName + " (Nhấp để tháo)");
                    }
                }

                table.add(slotsTable);

                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = isEn() ? " Endyr Turret Stats " : " Thông số pháo Endyr ";
                    let sCount = this.getItemCount(1);
                    let oCount = this.getItemCount(2);
                    let stCount = this.getItemCount(3);

                    let statDmgPercent = Math.round(this.getDamageMultiplier() * 100);
                    let statSpeedPercent = Math.round(this.getSpeedMultiplier() * 100);
                    let statRangePercent = Math.round(this.getRangeMultiplier() * 100);
                    let currentRangePx = Math.round(this.range());

                    let critChance = Math.round(this.getCritChance() * 100);
                    let critDmgPercent = Math.round(this.getCritMultiplier() * 100);

                    let descStr = isEn() ?
                        "[gold]⚡ TURRET EQUIPMENT STATS ⚡[]\n" +
                        "[lightgray]Equipped Sallowyr:[] [yellow]" + sCount + " / 4[]\n" +
                        "[lightgray]Equipped Obsidis:[] [yellow]" + oCount + " / 4[]\n" +
                        "[lightgray]Equipped Starlight:[] [yellow]" + stCount + " / 4[]\n\n" +
                        "[lightgray]Attack Multiplier:[] [green]" + statDmgPercent + "%[]\n" +
                        "[lightgray]Fire Rate Multiplier:[] [green]" + statSpeedPercent + "%[]\n" +
                        "[lightgray]Effective Range:[] [orange]" + currentRangePx + " px[] [lime](" + statRangePercent + "%)[]\n" +
                        "[lightgray]Crit Chance:[] [cyan]" + critChance + "%[]\n" +
                        "[lightgray]Crit Damage:[] [cyan]" + critDmgPercent + "%[]\n\n" +
                        "[sky]⚡ ITEM BUFF MECHANIC:[]\n" +
                        "• [yellow]Sallowyr:[] Passive: Fires an extra laser beam dealing 150% base dmg when target HP < 80%.\n" +
                        "• [yellow]Obsidis:[] +10% Attack, +10% Speed, +50% Range.\n" +
                        "• [yellow]Starlight:[] +5% Crit Chance, +15% Crit Dmg, Execute targets below 5% HP (+1000 Copper)." :
                        "[gold]⚡ THÔNG SỐ TRANG BỊ THÁP PHÁO ⚡[]\n" +
                        "[lightgray]Số Sallowyr đã lắp:[] [yellow]" + sCount + " / 4[]\n" +
                        "[lightgray]Số Obsidis đã lắp:[] [yellow]" + oCount + " / 4[]\n" +
                        "[lightgray]Số Starlight đã lắp:[] [yellow]" + stCount + " / 4[]\n\n" +
                        "[lightgray]Tấn công:[] [green]" + statDmgPercent + "%[]\n" +
                        "[lightgray]Tốc độ bắn:[] [green]" + statSpeedPercent + "%[]\n" +
                        "[lightgray]Tầm bắn hiệu dụng:[] [orange]" + currentRangePx + " pixel[] [lime](" + statRangePercent + "%)[]\n" +
                        "[lightgray]Tỉ lệ bạo kích:[] [cyan]" + critChance + "%[]\n" +
                        "[lightgray]Sát thương bạo kích:[] [cyan]" + critDmgPercent + "%[]\n\n" +
                        "[sky]⚡ CƠ CHẾ BUFF TRANG BỊ:[]\n" +
                        "• [yellow]Sallowyr:[] Nội tại: Bắn thêm 1 tia laser 150% ST gốc khi máu mục tiêu < 80%.\n" +
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
                        this.burstQueue = 3;
                        this.burstIntervalTimer = 0;

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

                // Xoay đầu pháo liên tục theo chiều kim đồng hồ
                this.spinAngle = (this.spinAngle - 1.5 * dt) % 360;

                if (this.selectingTarget) {
                    if (Core.input.keyTap(KeyCode.mouseLeft)) {
                        let worldVec = Core.camera.unproject(Core.input.mouse());
                        let tile = Vars.world.tileWorld(worldVec.x, worldVec.y);
                        
                        if (tile != null) {
                            this.configure(Point2.pack(tile.x, tile.y));
                        }
                        this.selectingTarget = false;
                    }
                }

                let speedMultiplier = this.getSpeedMultiplier();
                let adjustedDt = dt * speedMultiplier;

                if (this.hasTargetSet) {
                    if (this.burstQueue > 0) {
                        if (this.burstDelayTimer > 0) {
                            this.burstDelayTimer -= adjustedDt;
                        } else {
                            if (this.burstIntervalTimer > 0) {
                                this.burstIntervalTimer -= adjustedDt;
                            } else {
                                if (this.isReadyToShoot()) {
                                    this.fireAtTarget();

                                    if (this.hasAmmo()) {
                                        this.useAmmo();
                                    }

                                    this.burstQueue--;
                                    this.burstIntervalTimer = 15;
                                }
                            }
                        }
                    } else {
                        this.burstDelayTimer = Mathf.random(12, 120) / speedMultiplier;
                        this.burstQueue = 3;
                        this.burstIntervalTimer = 0;
                    }
                }
            },

            fireAtTarget() {
                let tx = this.targetX;
                let ty = this.targetY;
                let dmgMultiplier = this.getDamageMultiplier();
                let hasSallowyr = this.hasSallowyrPassive();

                let zoneRadius = 30.0 * Vars.tilesize;
                let baseSubBeamDmg = 80.0;
                let subBeamDmg = baseSubBeamDmg * dmgMultiplier;
                let outerTurretRadius = 4.0 * Vars.tilesize;

                let targets = [];
                Units.nearbyEnemies(this.team, tx - zoneRadius, ty - zoneRadius, zoneRadius * 2, zoneRadius * 2, packCons(unit => {
                    if (unit.within(tx, ty, zoneRadius)) {
                        targets.push(unit);
                    }
                }));

                if (targets.length > 0) {
                    for (let i = targets.length - 1; i > 0; i--) {
                        let j = Math.floor(Mathf.random(i + 1));
                        let temp = targets[i];
                        targets[i] = targets[j];
                        targets[j] = temp;
                    }

                    let maxTargets = Math.min(targets.length, 3);
                    for (let i = 0; i < maxTargets; i++) {
                        let unit = targets[i];
                        let randAngle = Mathf.random(360.0);
                        let spawnX = this.x + Angles.trnsx(randAngle, outerTurretRadius);
                        let spawnY = this.y + Angles.trnsy(randAngle, outerTurretRadius);

                        // 1. Tia laser dẫn đường chiếu từ tâm pháo (this.x, this.y) đến vị trí tạo tia laser (spawnX, spawnY)
                        mainToSpawnLaserFx.at(this.x, this.y, 0, Color.white, { x: spawnX, y: spawnY });

                        // 2. Bắn tia laser chính từ vị trí đó vào kẻ địch
                        applyDamageWithStarlight(this, unit, subBeamDmg);
                        laserBeamFx.at(spawnX, spawnY, 0, Color.white, { x: unit.x, y: unit.y });
                        chargedExplosionFx.at(unit.x, unit.y, 0.2);

                        if (hasSallowyr && unit.isValid() && !unit.dead && unit.health < unit.maxHealth * 0.80) {
                            let extraBeamDmg = baseSubBeamDmg * 1.50;
                            let extraAngle = Mathf.random(360.0);
                            let extraSpawnX = this.x + Angles.trnsx(extraAngle, outerTurretRadius);
                            let extraSpawnY = this.y + Angles.trnsy(extraAngle, outerTurretRadius);

                            // Tia laser dẫn đường bổ sung từ tâm pháo tới điểm bắn thêm
                            mainToSpawnLaserFx.at(this.x, this.y, 0, Color.white, { x: extraSpawnX, y: extraSpawnY });

                            applyDamageWithStarlight(this, unit, extraBeamDmg);
                            laserBeamFx.at(extraSpawnX, extraSpawnY, 0, Color.red, { x: unit.x, y: unit.y });
                            chargedExplosionFx.at(unit.x, unit.y, 0.3);
                        }
                    }
                }
            },

            isReadyToShoot() {
                return this.isValid() && this.hasAmmo();
            },

            drawSelect() {
                this.super$drawSelect();
                Drawf.dashCircle(this.x, this.y, this.block.size * 4, Color.green);
            },

            drawConfigure() {
                this.super$drawConfigure();
                let currentRange = this.range();
                let zoneRadius = 30.0 * Vars.tilesize;
                let outerTurretRadius = 4.0 * Vars.tilesize;

                Drawf.dashCircle(this.x, this.y, currentRange, Pal.accent);
                Drawf.dashCircle(this.x, this.y, outerTurretRadius, Color.valueOf("a855f7"));

                if (this.hasTargetSet && Mathf.dst(this.x, this.y, this.targetX, this.targetY) <= currentRange) {
                    Drawf.dashLine(Pal.accent, this.x, this.y, this.targetX, this.targetY);
                    Drawf.square(this.targetX, this.targetY, 6.0, 0, Pal.accent);
                    Drawf.dashCircle(this.targetX, this.targetY, zoneRadius, Color.valueOf("fef08a"));
                }
            },

            // Hàm draw vẽ phần đầu pháo tự quay tròn theo chiều kim đồng hồ
            // Đế pháo được tự động vẽ dựa theo thiết lập hjson (drawBase: true)
            draw() {
                // Gọi super.draw() để Mindustry tự vẽ đế pháo cấu hình từ hjson
                this.super$draw();

                // Lấy sprite đầu pháo 'turretRegion' hoặc 'region'
                let turretRegion = (this.block.turretRegion && this.block.turretRegion.found()) 
                    ? this.block.turretRegion 
                    : this.block.region;

                // Vẽ đầu pháo đè lên đế và xoay theo chiều kim đồng hồ
                Draw.rect(turretRegion, this.x, this.y, this.spinAngle);

                // Giữ nguyên giao diện UI khi đang chọn vị trí mục tiêu bằng chuột
                if (this.selectingTarget) {
                    let currentRange = this.range();
                    let zoneRadius = 30.0 * Vars.tilesize;

                    Drawf.dashCircle(this.x, this.y, currentRange, Pal.accent);

                    let mouseWorld = Core.camera.unproject(Core.input.mouse());
                    let dist = Mathf.dst(this.x, this.y, mouseWorld.x, mouseWorld.y);
                    let isWithinRange = dist <= currentRange;
                    let targetColor = isWithinRange ? Pal.accent : Color.red;

                    Drawf.dashLine(targetColor, this.x, this.y, mouseWorld.x, mouseWorld.y);
                    Drawf.square(mouseWorld.x, mouseWorld.y, 6.0, 0, targetColor);
                    Drawf.dashCircle(mouseWorld.x, mouseWorld.y, zoneRadius, isWithinRange ? Color.valueOf("fef08a") : Color.red);
                }
            }
        });
    }
});

Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && build.name === "newex-endyr") {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        if (tile != null) {
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;
            Drawf.dashCircle(centerX, centerY, 380, Pal.accent);
        }
    }
});