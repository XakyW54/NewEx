const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

global.mk2bUnits = global.mk2bUnits || {};
global.droneLauncherMap = global.droneLauncherMap || {};

const reqMK2 = { copper: 2000, lead: 1500, silicon: 1000 };
const reqMK2B = { copper: 2000, lead: 1500, titanium: 1000 };

Events.on(ClientLoadEvent, cons(e => {
    let launcherBlock = Vars.content.getByName(ContentType.block, "newex-drone-launcher") ||
                        Vars.content.getByName(ContentType.block, "drone-launcher");

    if (launcherBlock != null) {
        launcherBlock.configurable = true;

        launcherBlock.config(java.lang.Integer, packCons2((tile, value) => {
            if (tile != null && tile.setTier !== undefined) {
                tile.setTier(value);
            }
        }));

        launcherBlock.buildType = () => extend(PowerTurret.PowerTurretBuild, launcherBlock, {
            spawnTimer: 0,
            spawnInterval: 120,
            tierState: 0,

            doorTimer: 0,
            maxDoorTime: 60,
            
            spawnDelayTimer: 0,
            isSpawning: false,

            getTier() { return this.tierState == null ? 0 : this.tierState; },
            
            setTier(val) { 
                this.tierState = val;
                if (val == 0) this.health = 1200;
                if (val == 1) this.health = 1800; 
                if (val == 2) this.health = 2400;
                this.maxHealth = this.health;
            },

            getMaxDrones() {
                let tier = this.getTier();
                if (tier == 1) return 6;
                return 4;
            },

            getRange() {
                let baseRange = this.block.range || 380;
                return this.getTier() == 2 ? baseRange * 2.2 : baseRange;
            },

            triggerDoor() {
                this.doorTimer = this.maxDoorTime;
            },

            getMasterSwordUnitType() {
                return Vars.content.getByName(ContentType.unit, "cargo-master-sword-drone") ||
                       Vars.content.getByName(ContentType.unit, "newex-cargo-master-sword-drone");
            },

            getSwordUnitType() {
                return Vars.content.getByName(ContentType.unit, "newex-cargo-sword-drone") ||
                       Vars.content.getByName(ContentType.unit, "cargo-sword-drone") ||
                       Vars.content.getByName(ContentType.unit, "cargo-sworddrone");
            },

            getMK2UnitType() {
                return Vars.content.getByName(ContentType.unit, "newex-cargo-drone-mk2") ||
                       Vars.content.getByName(ContentType.unit, "cargo-drone-mk2") ||
                       Vars.content.getByName(ContentType.unit, "newex-cargo-dronemk2") ||
                       Vars.content.getByName(ContentType.unit, "cargo-dronemk2");
            },

            getNormalUnitType() {
                return Vars.content.getByName(ContentType.unit, "newex-combat-drone") ||
                       Vars.content.getByName(ContentType.unit, "combat-drone") ||
                       Vars.content.getByName(ContentType.unit, "newex-cargo-drone") ||
                       Vars.content.getByName(ContentType.unit, "cargo-drone");
            },

            countActiveDrones() {
                let count = 0;
                let combatDroneType = this.getNormalUnitType();
                let mk2DroneType = this.getMK2UnitType();
                let swordDroneType = this.getSwordUnitType();
                let masterSwordDroneType = this.getMasterSwordUnitType();

                Groups.unit.each(u => {
                    if ((u.type == combatDroneType || u.type == mk2DroneType || u.type == swordDroneType || u.type == masterSwordDroneType) && !u.dead && u.team == this.team) {
                        if (global.droneLauncherMap[u.id] === this.id) count++;
                    }
                });
                return count;
            },

            countActiveMK2Drones() {
                let count = 0;
                let mk2DroneType = this.getMK2UnitType();

                Groups.unit.each(u => {
                    if (u.type == mk2DroneType && !u.dead && u.team == this.team) {
                        if (global.droneLauncherMap[u.id] === this.id) count++;
                    }
                });
                return count;
            },

            recallAllDrones() {
                let combatDroneType = this.getNormalUnitType();
                let mk2DroneType = this.getMK2UnitType();
                let swordDroneType = this.getSwordUnitType();
                let masterSwordDroneType = this.getMasterSwordUnitType();

                this.triggerDoor();

                Groups.unit.each(u => {
                    if ((u.type == combatDroneType || u.type == mk2DroneType || u.type == swordDroneType || u.type == masterSwordDroneType) && !u.dead && u.team == this.team) {
                        if (global.droneLauncherMap[u.id] === this.id) {
                            global.droneRecallMap = global.droneRecallMap || {};
                            global.droneRecallMap[u.id] = true;
                        }
                    }
                });
            },

            updateTile() {
                this.super$updateTile();

                if (this.doorTimer > 0) {
                    this.doorTimer -= Time.delta;
                    if (this.doorTimer < 0) this.doorTimer = 0;
                }

                if (this.efficiency <= 0) return;

                if (this.isSpawning) {
                    this.spawnDelayTimer -= Time.delta;
                    if (this.spawnDelayTimer <= 0) {
                        this.isSpawning = false;
                        this.spawnCombatDrone();
                    }
                    return;
                }

                let shooting = this.isShooting || (this.isAttacking !== undefined && this.isAttacking());

                if (shooting && this.countActiveDrones() < this.getMaxDrones()) {
                    this.spawnTimer += Time.delta;
                    if (this.spawnTimer >= this.spawnInterval) {
                        this.spawnTimer = 0;
                        this.triggerDoor();
                        this.isSpawning = true;
                        this.spawnDelayTimer = 30;
                    }
                }
            },

            spawnCombatDrone() {
                let tier = this.getTier();
                let droneType = null;

                if (tier == 2 && Mathf.chance(0.10)) {
                    droneType = this.getMasterSwordUnitType();
                }

                if (droneType == null) {
                    let isSwordSpawn = Mathf.chance(0.50);
                    let swordType = this.getSwordUnitType();

                    if (isSwordSpawn && swordType != null) {
                        droneType = swordType;
                    } else {
                        droneType = this.getNormalUnitType();
                        if (tier == 1 && this.countActiveMK2Drones() < 2) {
                            droneType = this.getMK2UnitType();
                        }
                    }
                }

                if (droneType != null) {
                    let unit = droneType.create(this.team);
                    unit.set(this.x, this.y);
                    
                    global.droneLauncherMap[unit.id] = this.id;

                    if (tier == 2) {
                        global.mk2bUnits[unit.id] = true;
                    }

                    unit.controller(new FlyingAI());
                    unit.add();
                    Fx.spawn.at(this.x, this.y);
                }
            },

            draw() {
                this.super$draw();

                let progress = 0;
                if (this.doorTimer > 0) {
                    let rawProg = 1 - (this.doorTimer / this.maxDoorTime);
                    progress = Mathf.sin(rawProg * Math.PI);
                }

                let offset = progress * 6.0;

                let top1 = Core.atlas.find("newex-drone-launcher-top1", Core.atlas.find("drone-launcher-top1"));
                let top2 = Core.atlas.find("newex-drone-launcher-top2", Core.atlas.find("drone-launcher-top2"));
                let top3 = Core.atlas.find("newex-drone-launcher-top3", Core.atlas.find("drone-launcher-top3"));
                let top4 = Core.atlas.find("newex-drone-launcher-top4", Core.atlas.find("drone-launcher-top4"));

                if (top1.found) Draw.rect(top1, this.x - offset, this.y);
                if (top2.found) Draw.rect(top2, this.x, this.y + offset);
                if (top3.found) Draw.rect(top3, this.x + offset, this.y);
                if (top4.found) Draw.rect(top4, this.x, this.y - offset);
            },

            buildConfiguration(table) {
                table.clear();
                let tier = this.getTier();
                let buttonTable = new Table();

                if (tier == 0) {
                    buttonTable.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                        let dialog = extend(BaseDialog, "Trung tâm nâng cấp Drone Launcher", {});
                        
                        let reqCell = dialog.cont.label(packProv(() => {
                            let core = this.team.core();
                            if (core == null) return "[red]Không tìm thấy Lõi![]";
                            let currentcopper = core.items.get(Items.copper);
                            let currentlead = core.items.get(Items.lead);
                            let currentsilicon = core.items.get(Items.silicon);
                            let currenttitanium = core.items.get(Items.titanium);
                            
                            let copColor1 = currentcopper >= reqMK2.copper ? "[green]" : "[red]";
                            let leaColor1 = currentlead >= reqMK2.lead ? "[green]" : "[red]";
                            let silColor1 = currentsilicon >= reqMK2.silicon ? "[green]" : "[red]";
                            
                            let copColor2 = currentcopper >= reqMK2B.copper ? "[green]" : "[red]";
                            let leaColor2 = currentlead >= reqMK2B.lead ? "[green]" : "[red]";
                            let titColor2 = currenttitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                            
                            return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                                   "[cyan]Nhánh MK2 (Chuyên Số Lượng):[]\n" +
                                   " • Đồng: " + copColor1 + currentcopper + "[] / " + reqMK2.copper + "\n" +
                                   " • Chì: " + leaColor1 + currentlead + "[] / " + reqMK2.lead + "\n" +
                                   " • Silicon: " + silColor1 + currentsilicon + "[] / " + reqMK2.silicon + "\n" +
                                   "[purple]Nhánh MK2B (Chuyên Tăng Cường Chi Lực):[]\n" +
                                   " • Đồng: " + copColor2 + currentcopper + "[] / " + reqMK2B.copper + "\n" +
                                   " • Chì: " + leaColor2 + currentlead + "[] / " + reqMK2B.lead + "\n" +
                                   " • Titan: " + titColor2 + currenttitanium + "[] / " + reqMK2B.titanium;
                        }));
                        
                        reqCell.width(360).get().setWrap(true);
                        reqCell.get().setAlignment(Align.left);
                        dialog.cont.row(); dialog.cont.add().height(10).row();

                        let branchesTable = new Table();

                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                        b1.add("[cyan]===(CẤU HÌNH MK2)===[]").row();
                        let b1D = b1.add("Tăng cường lực lượng không quân:\n" +
                                         " [white]• Tăng thêm [green]+2 Unit Drone Mk2[] (Tổng 6 Drones: 2 MK2 + 4 Thường/Sword).[]\n" +
                                         " [white]• Tăng máu tháp pháo lên [green]1800 HP[].[]");
                        b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                        b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                            let core = this.team.core();
                            if (core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead && core.items.get(Items.silicon) >= reqMK2.silicon) {
                                core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead); core.items.remove(Items.silicon, reqMK2.silicon);
                                Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                                
                                this.setTier(1);
                                this.configure(java.lang.Integer.valueOf(1)); 
                                dialog.hide(); this.deselect();
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                        })).size(180, 38);

                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                        b2.add("[purple]===(CẤU HÌNH MK2B)===[]").row();
                        let b2D = b2.add("Đột phá công nghệ cường hóa toàn diện:\n" +
                                         " [white]• Tăng [green]+100% Máu gốc[], [green]+100% Giáp[] cho Drone.[]\n" +
                                         " [white]• Tăng [red]+100% Sát thương[], [sky]+100% Tầm bắn[] đạn/chém.[]\n" +
                                         " [white]• Tăng [yellow]+20% Tốc độ bay[] cho Drone.[]\n" +
                                         " [white]• Tăng [gold]+120% Phạm vi bắn[] cho Tháp Pháo.[]\n" +
                                         " [white]• Gia tăng máu tháp pháo lên [green]2400 HP[].[]");
                        b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                        b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                            let core = this.team.core();
                            if (core != null && core.items.get(Items.copper) >= reqMK2B.copper && core.items.get(Items.lead) >= reqMK2B.lead && core.items.get(Items.titanium) >= reqMK2B.titanium) {
                                core.items.remove(Items.copper, reqMK2B.copper); core.items.remove(Items.lead, reqMK2B.lead); core.items.remove(Items.titanium, reqMK2B.titanium);
                                Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                                
                                this.setTier(2);
                                this.configure(java.lang.Integer.valueOf(2)); 
                                dialog.hide(); this.deselect();
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                        })).size(180, 38);

                        branchesTable.add(b1).width(340); branchesTable.row();
                        branchesTable.add().height(12).row();
                        branchesTable.add(b2).width(340);

                        let scroll = new ScrollPane(branchesTable);
                        scroll.setScrollingDisabled(true, false);
                        dialog.cont.add(scroll).maxHeight(400);
                        dialog.addCloseButton(); dialog.show();
                    })).size(45, 40).tooltip("Nâng cấp mô-đun điều phối Drone");
                } else {
                    buttonTable.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                        Vars.ui.showInfo("[scarlet]THÁP PHÁO ĐÃ ĐẠT CẤP ĐỘ TIẾN HÓA TỐI ĐA![]");
                    })).size(45, 40).tooltip("Đã đạt cấp tối đa");
                }

                buttonTable.button(Icon.leftOpen, Styles.cleari, 40, packRun(() => {
                    this.recallAllDrones();
                    Fx.tapBlock.at(this.x, this.y);
                })).size(45, 40).tooltip("Thu hồi toàn bộ Drone thuộc tháp pháo này");

                buttonTable.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = " Thông tin Drone Launcher: ";
                    let descStr = "";
                    let currentTier = this.getTier();

                    if (currentTier == 0) {
                        title += "[yellow](MK1 - Mặc định)[]";
                        descStr = "[gold]⚡ TRẠNG THÁI NGUYÊN BẢN (MK1) ⚡[]\n" +
                                  "[lightgray]Máu pháo:[] [green]1200 HP[]\n" +
                                  "[lightgray]Số lượng Drone tối đa:[] [yellow]4 Units[]\n" +
                                  "[lightgray]Loại Drone:[] Combat / Sword / Cargo Drone (50% Sword)";
                    } else if (currentTier == 1) {
                        title += "[cyan](MK2 - Số Lượng)[]";
                        descStr = "[cyan]⚡ CẤU HÌNH TRIỆU HỒI MK2 ⚡[]\n" +
                                  "[lightgray]Máu pháo:[] [green]1800 HP[]\n" +
                                  "[lightgray]Số lượng Drone tối đa:[] [green]6 Units[]\n" +
                                  "[lightgray]Thành phần:[] [yellow]2 Cargo Drone Mk2[] + [white]4 Drone Thường/Sword[]";
                    } else if (currentTier == 2) {
                        title += "[purple](MK2B - Cường Hóa)[]";
                        descStr = "[purple]⚡ CẤU HÌNH BIẾN THỂ MK2B ⚡[]\n" +
                                  "[lightgray]Máu pháo:[] [green]2400 HP[]\n" +
                                  "[lightgray]Phạm vi pháo:[] [gold]+120%[]\n" +
                                  "[lightgray]Số lượng Drone:[] [yellow]4 Units[]\n" +
                                  "[lightgray]Máu & Giáp Drone:[] [green]+100%[]\n" +
                                  "[lightgray]Tốc độ di chuyển:[] [yellow]+20%[]\n" +
                                  "[lightgray]Sát thương Lướt & Bắn:[] [red]+100%[]";
                    }

                    let dialog = extend(BaseDialog, title, {});
                    let infoTable = new Table();
                    let cell = infoTable.add(descStr).width(360);
                    cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                    let scroll = new ScrollPane(infoTable);
                    scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400);
                    dialog.addCloseButton(); dialog.show();
                })).size(45, 40).tooltip("Xem chi tiết thông số hệ thống");

                table.add(buttonTable);
            },

            config() { return java.lang.Integer.valueOf(this.getTier()); },

            write(write) {
                this.super$write(write); 
                write.b(this.getTier()); 
            },
            
            read(read, revision) {
                this.super$read(read, revision); 
                this.setTier(read.b()); 
            }
        });
    }
}));