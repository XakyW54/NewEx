const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqPerkA = { copper: 2000, lead: 2000, silicon: 2000 };
const reqPerkB = { titanium: 1000, thorium: 1000, graphite: 1000 };

const vChainLinkFx = new Effect(15, cons(e => {
    Draw.z(Layer.effect + 0.05);
    let fout = e.fout();

    if (e.data != null) {
        let tx = e.data.x;
        let ty = e.data.y;
        
        Draw.color(Color.valueOf("#ff2222"), Color.white, e.fin());
        Lines.stroke(4.0 * fout);
        Lines.line(e.x, e.y, tx, ty);

        Draw.color(Color.white);
        Lines.stroke(1.5 * fout);
        Lines.line(e.x, e.y, tx, ty);

        Fill.circle(e.x, e.y, 5.0 * fout);
        Fill.circle(tx, ty, 5.0 * fout);
    }
    Draw.reset();
}));

const vChargeFx = new Effect(20, cons(e => {
    Draw.z(Layer.effect + 0.01);
    let fin = e.fin();
    let rot = e.rotation;

    let startX = e.x;
    let startY = e.y;
    let slashLength = e.data != null ? Number(e.data) : 1100.0;

    let endX = startX + Angles.trnsx(rot, slashLength);
    let endY = startY + Angles.trnsy(rot, slashLength);

    Draw.color(Color.valueOf("#ff4444"), Color.white, fin);
    Draw.alpha(fin * 0.5);
    Lines.stroke(1.2 * fin);
    Lines.line(startX, startY, endX, endY);
    Draw.reset();
}));

const vSlashHitFx = new Effect(25, cons(e => {
    Draw.z(Layer.effect + 0.02);
    
    let fin = e.fin(); 
    let fout = e.fout();
    let rot = e.rotation;

    let startX = e.x;
    let startY = e.y;
    
    let slashLength = (e.data != null && e.data.len) ? e.data.len : 1100.0;
    let wMult = (e.data != null && e.data.widthMult) ? e.data.widthMult : 1.0;

    let endX = startX + Angles.trnsx(rot, slashLength * Math.min(1.0, fin * 1.5));
    let endY = startY + Angles.trnsy(rot, slashLength * Math.min(1.0, fin * 1.5));

    Draw.color(Color.valueOf("#ff3333"), Color.valueOf("#ff6644"), fin);
    Draw.alpha(fout * 0.7);
    Lines.stroke(24.0 * wMult * fout);
    Lines.line(startX, startY, endX, endY);

    Draw.color(Color.white);
    Draw.alpha(fout);
    Lines.stroke(4.0 * wMult * fout);
    Lines.line(startX, startY, endX, endY);

    Draw.reset();
}));

const energyOrbBullet = extend(BasicBulletType, {
    speed: 7.0,
    damage: 35,
    lifetime: 60,
    width: 14,
    height: 14,
    shrinkX: 0,
    shrinkY: 0,

    draw(b) {
        Draw.z(Layer.bullet);
        Draw.color(Color.valueOf("#ff3333"));
        Fill.circle(b.x, b.y, 8.0);
        
        Draw.color(Color.white);
        Fill.circle(b.x, b.y, 3.0);
        Draw.reset();
    }
});

function damageStraightSlash(team, startX, startY, rotation, length, damageAmount) {
    let steps = Math.floor(length / 30.0);
    let stepDist = length / steps;
    let hitRadius = 24.0;

    for (let i = 0; i <= steps; i++) {
        let px = startX + Angles.trnsx(rotation, stepDist * i);
        let py = startY + Angles.trnsy(rotation, stepDist * i);

        Damage.damage(team, px, py, hitRadius, damageAmount, true, true);
    }
}

const lazash = extend(PowerTurret, "lazash", {
    configurable: true
});

lazash.health = 3600;
lazash.range = 1100;
lazash.reload = 120; 

lazash.targetAir = false;
lazash.targetGround = false;
lazash.targetBuildings = true;

lazash.shootType = extend(LaserBulletType, {
    damage: 10, 
    length: 1100, 
    width: 18,
    colors: [Color.valueOf("#ff4444"), Color.valueOf("#ff8866"), Color.white]
});

lazash.powerCapacity = 1200;
lazash.consumePower(12.0);

lazash.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null) {
        let val = Number(value);
        if (val >= 20) {
            tile.setPerkB(val - 20);
        } else if (val >= 10) {
            tile.setPerkA(val - 10);
        }
    }
}));

lazash.buildType = () => extend(PowerTurret.PowerTurretBuild, lazash, {
    created() {
        this.super$created();
        this.perkAState = 0;
        this.perkBState = 0;

        this.chargeTimer = 0.0;
        this.isChargingState = false;
        this.reloadTimer = 0.0;
        this.laserTimer = 0.0;

        this.slashCount2B = 0;
        this.isFrenzy2B = false;
        this.frenzyShotsLeft = 0;
        this.frenzyTimer = 0.0;

        this.targetScanTimer = 0.0;
        this.isChainFiring = false;
        
        this.slaveTicks = 0;
        this.slaveTargetAngle = 0.0;
        this.slaveIsShooting = false;

        return this;
    },

    getPerkA() { return this.perkAState || 0; },
    setPerkA(val) { this.perkAState = Number(val); },
    getPerkB() { return this.perkBState || 0; },
    setPerkB(val) { this.perkBState = Number(val); },

    getIsCharging() { return !!this.isChargingState; },

    setSlaveCommand(angle, isShooting) {
        this.slaveTicks = 5; 
        this.slaveTargetAngle = Number(angle);
        this.slaveIsShooting = !!isShooting;
    },

    range() {
        let perkA = this.getPerkA();
        return (perkA == 2) ? 1100.0 * 1.12 : 1100.0;
    },

    findTarget() {
        let perkA = this.getPerkA();
        let r = this.range();

        if (perkA == 3) {
            let enemyCore = null;
            let minDist = r;

            let activeTeams = Vars.state.teams.present;
            for (let i = 0; i < activeTeams.size; i++) {
                let teamData = activeTeams.get(i);
                if (teamData.team != this.team) {
                    let core = teamData.core();
                    if (core != null && core.isValid() && this.within(core, minDist)) {
                        enemyCore = core;
                        minDist = this.dst(core);
                    }
                }
            }

            if (enemyCore != null) {
                this.target = enemyCore;
                return;
            }
        }

        let bestTarget = null;
        let bestVal = -1;

        let activeTeams = Vars.state.teams.present;
        for (let i = 0; i < activeTeams.size; i++) {
            let teamData = activeTeams.get(i);
            if (teamData.team != this.team) {
                let buildings = teamData.buildings;
                if (buildings != null) {
                    for (let j = 0; j < buildings.size; j++) {
                        let build = buildings.get(j);
                        if (build != null && build.isValid() && this.within(build, r)) {
                            let score = 0;
                            if (perkA == 1) score = 9999999 - build.health;
                            else if (perkA == 2) score = build.maxHealth;
                            else score = 999999 - this.dst(build);

                            if (score > bestVal) {
                                bestVal = score;
                                bestTarget = build;
                            }
                        }
                    }
                }
            }
        }
        this.target = bestTarget;
    },

    executeSlash(angleOffset) {
        let perkA = this.getPerkA();
        let perkB = this.getPerkB();

        let angle = this.rotation + angleOffset;
        let slashLen = this.range(); 
        let baseSlashDmg = 49.0;

        let dmgMult = 1.0;
        if (perkA == 1) dmgMult += 0.50;
        if (perkA == 2) dmgMult += 0.08;
        if (perkB == 1) dmgMult += 0.50;
        if (perkB == 3) dmgMult += 2.00;

        let widthMult = (perkB == 3) ? 2.5 : 1.0; 

        let spawnX = this.x + Angles.trnsx(angle, 13.0);
        let spawnY = this.y + Angles.trnsy(angle, 13.0);

        vSlashHitFx.at(spawnX, spawnY, angle, { len: slashLen, widthMult: widthMult });
        damageStraightSlash(this.team, spawnX, spawnY, angle, slashLen, baseSlashDmg * dmgMult);

        if (perkB == 2 && !this.isFrenzy2B) {
            this.slashCount2B++;
            if (this.slashCount2B >= 5) {
                this.slashCount2B = 0;
                this.isFrenzy2B = true;
                this.frenzyShotsLeft = 100;
            }
        }
    },

    syncChainCommand(targetAngle, isShooting) {
        if (this.isChainFiring) return;
        this.isChainFiring = true;

        let adjacentRadius = (this.block.size * 8) + 8.0; 

        Units.nearbyBuildings(this.x, this.y, adjacentRadius, cons(b => {
            if (b != null && b !== this && b.block === this.block && b.team === this.team) {
                let dstX = Math.abs(this.x - b.x);
                let dstY = Math.abs(this.y - b.y);
                
                let isAdjacent = (dstX < 4.0 && dstY <= adjacentRadius) || (dstY < 4.0 && dstX <= adjacentRadius);

                if (isAdjacent && typeof b.setSlaveCommand === "function") {
                    b.setSlaveCommand(targetAngle, isShooting);

                    if (isShooting) {
                        vChainLinkFx.at(this.x, this.y, 0, { x: Number(b.x), y: Number(b.y) });
                    }

                    if (typeof b.syncChainCommand === "function") {
                        b.syncChainCommand(targetAngle, isShooting);
                    }
                }
            }
        }));

        this.isChainFiring = false;
    },

    drawSelect() {
        this.super$drawSelect();

        let adjacentRadius = (this.block.size * 8) + 8.0;

        Units.nearbyBuildings(this.x, this.y, adjacentRadius, cons(b => {
            if (b != null && b !== this && b.block === this.block && b.team === this.team) {
                let dstX = Math.abs(this.x - b.x);
                let dstY = Math.abs(this.y - b.y);
                
                let isAdjacent = (dstX < 4.0 && dstY <= adjacentRadius) || (dstY < 4.0 && dstX <= adjacentRadius);

                if (isAdjacent) {
                    Draw.z(Layer.power + 1);
                    
                    Draw.color(Color.valueOf("#ff2222"));
                    Lines.stroke(2.5);
                    Lines.line(this.x, this.y, b.x, b.y);

                    Draw.color(Color.white);
                    Lines.stroke(1.0);
                    Lines.line(this.x, this.y, b.x, b.y);

                    Draw.color(Color.valueOf("#ff4444"));
                    Fill.circle(b.x, b.y, 3.5);

                    Draw.reset();
                }
            }
        }));
    },

    updateTile() {
        this.super$updateTile();

        if (this.slaveTicks > 0) {
            this.slaveTicks--;
        }

        let perkA = this.getPerkA();
        let perkB = this.getPerkB();

        let speedMult = 1.0;
        if (perkA == 3) speedMult *= 1.5;
        if (perkB == 1) speedMult *= 1.428; 
        if (perkB == 3) speedMult *= 0.5; 

        if (this.reloadTimer > 0) {
            this.reloadTimer -= Time.delta * speedMult;
        }

        let isDirectControlled = this.isControlled() || this.logicControlled();
        let isSlaveControlled = (this.slaveTicks > 0);
        let hasPower = this.power != null && this.power.status > 0.1;

        let spawnX = this.x + Angles.trnsx(this.rotation, 13.0);
        let spawnY = this.y + Angles.trnsy(this.rotation, 13.0);

        if (this.isFrenzy2B) {
            if (hasPower) {
                this.frenzyTimer += Time.delta;
                if (this.frenzyTimer >= 3.0) {
                    this.frenzyTimer = 0.0;
                    let targetAngle = this.rotation;
                    if (this.target != null) targetAngle = this.angleTo(this.target);
                    
                    let spreadAngle = targetAngle + Mathf.range(8.0);
                    let orbSpawnX = this.x + Angles.trnsx(spreadAngle, 13.0);
                    let orbSpawnY = this.y + Angles.trnsy(spreadAngle, 13.0);
                    energyOrbBullet.create(this, this.team, orbSpawnX, orbSpawnY, spreadAngle);

                    this.frenzyShotsLeft--;
                    if (this.frenzyShotsLeft <= 0) this.isFrenzy2B = false;
                }
            }
            return;
        }

        if (isDirectControlled) {
            this.slaveTicks = 0;
            let u = this.unit;
            if (u != null) {
                let aimAngle = this.angleTo(u.aimX, u.aimY);
                this.rotation = aimAngle; 
                
                this.syncChainCommand(aimAngle, this.isShooting);
            }
        } else if (isSlaveControlled) {
            this.rotation = this.slaveTargetAngle;
        } else {
            this.targetScanTimer += Time.delta;
            if (this.targetScanTimer >= 15.0) {
                this.targetScanTimer = 0.0;
                this.findTarget();
            }

            if (hasPower && this.target != null && this.within(this.target, this.range())) {
                this.turnToTarget(this.angleTo(this.target));
            }
        }

        let canShoot = false;
        if (hasPower) {
            if (isDirectControlled) {
                canShoot = this.isShooting;
            } else if (isSlaveControlled) {
                canShoot = this.slaveIsShooting;
            } else {
                canShoot = (this.target != null && this.within(this.target, this.range()));
            }
        }

        if (canShoot) {
            this.laserTimer += Time.delta;
            if (this.laserTimer >= 12.0) { 
                this.laserTimer = 0.0;
                let lType = lazash.shootType;
                lType.length = this.range();
                lType.create(this, this.team, spawnX, spawnY, this.rotation);
            }
        } else {
            this.laserTimer = 0.0;
        }

        if (canShoot && this.reloadTimer <= 0 && !this.isChargingState) {
            this.isChargingState = true;
            this.chargeTimer = 25.0; 
        }

        if (this.isChargingState) {
            this.chargeTimer -= Time.delta;
            
            if (Mathf.chance(0.2)) {
                vChargeFx.at(spawnX, spawnY, this.rotation, this.range());
            }

            if (this.chargeTimer <= 0) {
                this.isChargingState = false;
                this.reloadTimer = 120.0; 
                this.executeSlash(0.0);
            }
        }
    },

    buildConfiguration(table) {
        table.clear();
        table.row();

        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Lazash", {});

            let reqCell = dialog.cont.label(packProv(() => {
                let core = this.team.core();
                if (core == null) return "[red]Không tìm thấy Lõi Đội![]";

                let cCop = core.items.get(Items.copper);
                let cLea = core.items.get(Items.lead);
                let cSil = core.items.get(Items.silicon);
                let cTit = core.items.get(Items.titanium);
                let cTho = core.items.get(Items.thorium);
                let cGra = core.items.get(Items.graphite);

                let colCop = cCop >= reqPerkA.copper ? "[green]" : "[red]";
                let colLea = cLea >= reqPerkA.lead ? "[green]" : "[red]";
                let colSil = cSil >= reqPerkA.silicon ? "[green]" : "[red]";

                let colTit = cTit >= reqPerkB.titanium ? "[green]" : "[red]";
                let colTho = cTho >= reqPerkB.thorium ? "[green]" : "[red]";
                let colGra = cGra >= reqPerkB.graphite ? "[green]" : "[red]";

                return "[gold]YÊU CẦU TÀI NGUYÊN LÕI:[]\n" +
                       "[yellow]★ ROLL PHÚC LỢI A:[] Đồng: " + colCop + cCop + "[]/2000 | Chì: " + colLea + cLea + "[]/2000 | Silicon: " + colSil + cSil + "[]/2000\n" +
                       "[cyan]★ ROLL PHÚC LỢI B:[] Titan: " + colTit + cTit + "[]/1000 | Thorium: " + colTho + cTho + "[]/1000 | Than chì: " + colGra + cGra + "[]/1000\n";
            }));

            reqCell.width(380).get().setWrap(true);
            reqCell.get().setAlignment(Align.left);
            dialog.cont.row();
            dialog.cont.add().height(10).row();

            let mainTable = new Table();

            let boxA = new Table();
            boxA.background(Styles.black6);
            boxA.margin(12);
            boxA.add("[yellow]★ ROLL PHÚC LỢI A (NGẪU NHIÊN) ★[]").row();

            let perkA = this.getPerkA();
            if (perkA == 0) {
                let txtADesc = boxA.add("Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi A (Tỉ lệ 50% mỗi Option):\n" +
                                        " • [green]Phúc lợi 1A:[] Ưu tiên bắn các công trình máu giấy, tăng 50% dmg gốc.\n" +
                                        " • [green]Phúc lợi 2A:[] Tăng 12% phạm vi bắn, 8% dmg gốc và dmg phụ, ưu tiên bắn các công trình có máu trâu.\n" +
                                        " • [green]Phúc lợi 3A:[] Ưu tiên bắn base địch, tăng tốc độ bắn.");
                txtADesc.width(340).get().setWrap(true);
                txtADesc.get().setAlignment(Align.left);
                boxA.row();

                boxA.button("[yellow]QUAY PHÚC LỢI A (2K Đồng/Chì/Silicon)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.copper) >= 2000 && core.items.get(Items.lead) >= 2000 && core.items.get(Items.silicon) >= 2000) {
                        core.items.remove(Items.copper, 2000);
                        core.items.remove(Items.lead, 2000);
                        core.items.remove(Items.silicon, 2000);

                        let res = 1;
                        let options = [];
                        if (Mathf.chance(0.50)) options.push(1);
                        if (Mathf.chance(0.50)) options.push(2);
                        if (Mathf.chance(0.50)) options.push(3);

                        if (options.length > 0) {
                            res = options[Math.floor(Mathf.random(0, options.length - 0.01))];
                        } else {
                            res = Math.floor(Mathf.random(1, 3.99));
                        }

                        this.setPerkA(res);
                        this.configure(10 + res);

                        Fx.upgradeCore.at(this.x, this.y);
                        Effect.shake(4, 4, this.x, this.y);
                        Vars.ui.showInfo("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[yellow]PHÚC LỢI " + res + "A[]");
                        dialog.hide();
                        this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên roll Phúc lợi A![]");
                    }
                })).size(280, 40);
            } else {
                let txtA = "";
                if (perkA == 1) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1A\n• Ưu tiên bắn công trình máu giấy\n• Sát thương gốc +50%[]";
                if (perkA == 2) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2A\n• Ưu tiên bắn công trình máu trâu\n• Tầm bắn +12%\n• Sát thương gốc & phụ +8%[]";
                if (perkA == 3) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3A\n• Ưu tiên bắn Base/Lõi địch\n• Tăng 50% tốc độ bắn[]";

                let txtACell = boxA.add(txtA);
                txtACell.width(340).get().setWrap(true);
                txtACell.get().setAlignment(Align.left);
            }

            mainTable.add(boxA).width(360).row();
            mainTable.add().height(12).row();

            let boxB = new Table();
            boxB.background(Styles.black6);
            boxB.margin(12);
            boxB.add("[cyan]★ ROLL PHÚC LỢI B (NGẪU NHIÊN) ★[]").row();

            let perkB = this.getPerkB();
            if (perkB == 0) {
                let txtBDesc = boxB.add("Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi B:\n" +
                                        " • [cyan]Phúc lợi 1B:[] Giảm 30% thời gian bắn vSlashHitFx, +50% Sát thương.\n" +
                                        " • [cyan]Phúc lợi 2B:[] Bắn đủ 5 tia vSlashHitFx -> Tự động xả loạn 100 viên cầu năng lượng (độ lệch 8°).\n" +
                                        " • [cyan]Phúc lợi 3B:[] Kích thước diện rộng vSlashHitFx +150%, +200% Sát thương, Giảm 50% tốc độ bắn.");
                txtBDesc.width(340).get().setWrap(true);
                txtBDesc.get().setAlignment(Align.left);
                boxB.row();

                boxB.button("[cyan]QUAY PHÚC LỢI B (1K Titan/Thorium/Graphite)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.titanium) >= 1000 && core.items.get(Items.thorium) >= 1000 && core.items.get(Items.graphite) >= 1000) {
                        core.items.remove(Items.titanium, 1000);
                        core.items.remove(Items.thorium, 1000);
                        core.items.remove(Items.graphite, 1000);

                        let res = Math.floor(Mathf.random(1, 3.99));
                        this.setPerkB(res);
                        this.configure(20 + res);

                        Fx.upgradeCore.at(this.x, this.y);
                        Effect.shake(4, 4, this.x, this.y);
                        Vars.ui.showInfo("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[cyan]PHÚC LỢI " + res + "B[]");
                        dialog.hide();
                        this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên roll Phúc lợi B![]");
                    }
                })).size(280, 40);
            } else {
                let txtB = "";
                if (perkB == 1) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1B\n• Giảm 30% thời gian bắn nhát chém\n• Sát thương vSlashHitFx +50%[]";
                if (perkB == 2) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2B\n• Bắn đủ 5 nhát chém -> Bắn loạn 100 viên cầu năng lượng[]";
                if (perkB == 3) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3B\n• Kích thước diện rộng vSlashHitFx +150%\n• Sát thương vSlashHitFx +200%\n• Tốc độ bắn -50%[]";

                let txtBCell = boxB.add(txtB);
                txtBCell.width(340).get().setWrap(true);
                txtBCell.get().setAlignment(Align.left);
            }

            mainTable.add(boxB).width(360);

            let scroll = new ScrollPane(mainTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton();
            dialog.show();
        })).size(50, 40).tooltip("Trung tâm nâng cấp pháo Lazash");

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Lazash ";
            let descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN PHÁO LAZASH ⚡[]\n" +
                          "• Máu: 3,600 | Tầm bắn mặc định: 1100px\n" +
                          "• Mục tiêu: Chỉ bắn Công Trình phe địch\n" +
                          "• Sát thương vSlashHitFx: 49.0 | Sát thương Laser Vanilla: 10.0 (0.2s/lần)\n" +
                          "• [cyan]Cơ chế liên kết:[] Xây các pháo kề sát vách 4 hướng. Khi player nhảy vào điều khiển 1 pháo, toàn bộ pháo liên kết sẽ ngưng tự bắn, tự động xoay và chỉ xả đạn đồng loạt khi player bấm nút bắn!";

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true);
            cell.get().setAlignment(Align.left);

            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton();
            dialog.show();
        })).size(50, 40).tooltip("Xem thông số pháo Lazash");
    },

    write(write) {
        this.super$write(write);
        write.b(this.getPerkA());
        write.b(this.getPerkB());
    },

    read(read, revision) {
        this.super$read(read, revision);
        this.setPerkA(read.b());
        this.setPerkB(read.b());
    }
});