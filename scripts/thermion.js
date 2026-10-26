const packCons2 = (func) => new Cons2({ get: func });
const packCons = (func) => new Cons({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

function drawCustomElectricEffect(x, y, radius, color, points) {
    Draw.color(color);
    Lines.stroke(1.5);
    for (let i = 0; i < points; i++) {
        let angle = (Time.time * 3 + i * (360 / points)) % 360;
        let rad = angle * Mathf.degRad;
        let rx = x + Math.cos(rad) * radius * (0.6 + Math.sin(Time.time * 0.1 + i) * 0.4);
        let ry = y + Math.sin(rad) * radius * (0.6 + Math.sin(Time.time * 0.1 + i) * 0.4);
        Lines.line(x, y, rx, ry);
        Fill.circle(rx, ry, 2);
    }
    Draw.reset();
}

function drawCustomCorePulse(x, y, color, scale) {
    Draw.color(color);
    let r = (Time.time * 2) % 24 * scale;
    let alpha = 1.0 - (r / (24 * scale));
    Draw.alpha(Math.max(0, alpha));
    Lines.stroke(2);
    Lines.poly(x, y, 6, r, Time.time * 2);
    Draw.reset();
}

function drawCustomDualBlade(x, y, radius, angle) {
    Draw.color(Color.gold);
    Lines.stroke(3);
    let a1 = angle;
    let a2 = angle + 180;

    Lines.arc(x, y, radius, 60, a1);
    Lines.arc(x, y, radius, 60, a2);

    Fill.circle(x + Mathf.cosDeg(a1) * radius, y + Mathf.sinDeg(a1) * radius, 4);
    Fill.circle(x + Mathf.cosDeg(a2) * radius, y + Mathf.sinDeg(a2) * radius, 4);
    Draw.reset();
}

function drawCustomMeteorImpact(x, y, radius, progress) {
    Draw.color(Color.scarlet, Color.orange, progress);
    Lines.stroke(3 * (1 - progress));
    Lines.circle(x, y, radius * progress);

    Draw.color(Color.orange);
    Fill.circle(x, y, (1 - progress) * 8);
    Draw.reset();
}

function drawCustomThermionRange(x, y, radius, formColor, level) {
    Draw.z(Layer.overlayUI);

    Draw.color(formColor);
    Draw.alpha(0.6);
    Lines.stroke(2);
    Lines.poly(x, y, 12, radius, Time.time * 0.5);

    let pulseR = (Time.time % 90) / 90 * radius;
    Draw.alpha(1.0 - (pulseR / radius));
    Lines.stroke(1);
    Lines.circle(x, y, pulseR);

    Draw.alpha(0.8);
    for (let i = 0; i < 4; i++) {
        let a = i * 90 + Time.time * 0.2;
        let px = x + Mathf.cosDeg(a) * radius;
        let py = y + Mathf.sinDeg(a) * radius;
        Fill.square(px, py, 3, a);
    }

    Draw.alpha(0.15);
    Fill.circle(x, y, radius);

    Draw.reset();
}

const ThermionForm = {
    YELLOW: 0,
    BLUE: 1,
    PURPLE: 2,
    DEAD: 3
};

Events.on(ContentInitEvent, () => {
    const thermionBlock = Vars.content.getByName(ContentType.block, "newex-thermion");

    if (thermionBlock != null) {
        thermionBlock.configurable = true;

        thermionBlock.buildType = () => extend(Building, {
            currentForm: ThermionForm.YELLOW,
            level: 1,
            affectRadius: 280,
            baseRadius: 280,

            empCooldown: 0,
            megaHypnosisCooldown: 0,
            asteroidChargeTimer: 0,
            isAsteroidCharging: false,

            generalTimer: 0,
            bladeAngle: 0,

            created() {
                this.super$created();
            },

            placed() {
                this.super$placed();
            },

            range() {
                return this.affectRadius;
            },

            buildConfiguration(table) {
                table.clear();
                table.row();

                if (this.currentForm === ThermionForm.DEAD) {
                    table.add(isEn() ? "[red]THERMION DESTROYED (DEAD FORM)[]" : "[red]THERMION ĐÃ TỰ HỦY (DẠNG CHẾT)[]");
                    return;
                }

                let requiredPower = this.level * this.level * 1000;
                let currentSurplus = (this.power != null && this.power.graph != null) ? (this.power.graph.powerProduction - this.power.graph.powerNeeded) : 0;

                table.add(isEn() ? "[lightgray]Req Power: [orange]" + requiredPower + "[]" : "[lightgray]Năng lượng yêu cầu: [orange]" + requiredPower + "[]").colspan(3);
                table.row();
                table.add(isEn() ? "[lightgray]Net Surplus: [sky]" + Math.floor(currentSurplus) + "[]" : "[lightgray]Lưới điện dư: [sky]" + Math.floor(currentSurplus) + "[]").colspan(3);
                table.row();

                table.button("💛 Form Yellow", packRun(() => {
                    this.currentForm = ThermionForm.YELLOW;
                    this.deselect();
                })).size(110, 40).tooltip(isEn() ? "Electrified & Crowd Control" : "Khống chế & Điện từ");

                table.button("💙 Form Blue", packRun(() => {
                    this.currentForm = ThermionForm.BLUE;
                    this.deselect();
                })).size(110, 40).tooltip(isEn() ? "Orbital Firepower" : "Hỏa lực quỹ đạo");

                table.button("💜 Form Purple", packRun(() => {
                    this.currentForm = ThermionForm.PURPLE;
                    this.deselect();
                })).size(110, 40).tooltip(isEn() ? "Mind Control & Hypnosis" : "Thao túng & Cướp quân");

                table.row();

                table.button("Lv -", packRun(() => {
                    if (this.level > 1) this.level--;
                })).size(40, 40);

                table.add("[gold] Lv: " + this.level + " []").pad(5);

                table.button("Lv +", packRun(() => {
                    if (this.level < 5) this.level++;
                })).size(40, 40);

                table.row();

                if (this.level >= 5) {
                    if (this.currentForm === ThermionForm.YELLOW) {
                        let isReady = this.empCooldown <= 0;
                        table.button(isReady ? "⚡ EMP Pulse" : "⚡ EMP (" + Math.ceil(this.empCooldown / 60) + "s)", packRun(() => {
                            if (this.empCooldown <= 0) {
                                this.useElectromagneticPulse();
                                this.deselect();
                            }
                        })).size(220, 40).disabled(!isReady);
                    } else if (this.currentForm === ThermionForm.BLUE) {
                        let statusText = this.isAsteroidCharging ? "☄️ Charging... (" + Math.ceil((3600 - this.asteroidChargeTimer) / 60) + "s)" : "☄️ Launch Asteroid";
                        table.button(statusText, packRun(() => {
                            if (!this.isAsteroidCharging) {
                                this.isAsteroidCharging = true;
                                this.asteroidChargeTimer = 0;
                                this.deselect();
                            }
                        })).size(220, 40);
                    } else if (this.currentForm === ThermionForm.PURPLE) {
                        let isReady = this.megaHypnosisCooldown <= 0;
                        table.button(isReady ? "👁️ Mega Hypnosis" : "👁️ Hypnosis (" + Math.ceil(this.megaHypnosisCooldown / 60) + "s)", packRun(() => {
                            if (this.megaHypnosisCooldown <= 0) {
                                this.useMegaHypnosis();
                                this.deselect();
                            }
                        })).size(220, 40).disabled(!isReady);
                    }
                }
            },

            useElectromagneticPulse() {
                this.empCooldown = 7200;

                Groups.unit.each(packCons(u => {
                    if (u.team != this.team && Mathf.dst(this.x, this.y, u.x, u.y) <= this.affectRadius) {
                        u.apply(StatusEffects.unmoving, 300);
                    }
                }));

                Groups.build.each(packCons(b => {
                    if (b.team != this.team && Mathf.dst(this.x, this.y, b.x, b.y) <= this.affectRadius) {
                        b.applyBoost(0, 300);
                    }
                }));

                Vars.ui.showInfoToast(isEn() ? "[yellow]Electromagnetic Pulse Activated! Stunned for 5s.[]" : "[yellow]Đã kích hoạt Xung Điện Từ! Tê liệt kẻ địch 5s.[]", 4);
            },

            useMegaHypnosis() {
                this.megaHypnosisCooldown = 10800;
                let count = 0;

                Groups.unit.each(packCons(u => {
                    if (u.team != this.team && Mathf.dst(this.x, this.y, u.x, u.y) <= this.affectRadius) {
                        u.team = this.team;
                        count++;
                    }
                }));

                Vars.ui.showInfoToast(isEn() ? "[purple]Mega Hypnosis! Stole " + count + " enemy units![]" : "[purple]Siêu Thao Túng! Đã cướp " + count + " đơn vị địch![]", 4);
            },

            executeAsteroidImpact() {
                Groups.unit.each(packCons(u => {
                    if (u.team != this.team && Mathf.dst(this.x, this.y, u.x, u.y) > this.affectRadius) {
                        u.kill();
                    }
                }));

                Groups.build.each(packCons(b => {
                    if (b.team != this.team && Mathf.dst(this.x, this.y, b.x, b.y) > this.affectRadius) {
                        b.kill();
                    }
                }));

                this.currentForm = ThermionForm.DEAD;
                this.isAsteroidCharging = false;
                Vars.ui.showInfoToast(isEn() ? "[red]ASTEROID IMPACTED! Thermion entered DEAD status.[]" : "[red]TIỂU HÀNH TINH GIẢI THẢM! Thermion chuyển sang dạng CHẾT.[]", 6);
            },

            onDestroyed() {
                if (this.currentForm === ThermionForm.PURPLE && this.level >= 3) {
                    Groups.unit.each(packCons(u => {
                        if (u.team != this.team && Mathf.dst(this.x, this.y, u.x, u.y) <= this.affectRadius) {
                            u.team = this.team;
                        }
                    }));
                }
                this.super$onDestroyed();
            },

            enemiesInRange() {
                let list = [];
                let r = this.affectRadius;
                Units.nearbyEnemies(this.team, this.x - r, this.y - r, r * 2, r * 2, packCons(u => {
                    if (u.isValid() && Mathf.dst(this.x, this.y, u.x, u.y) <= r) list.push(u);
                }));
                return list;
            },

            updateTile() {
                this.super$updateTile();

                if (this.currentForm === ThermionForm.DEAD) return;

                let requiredPower = this.level * this.level * 1000;
                let hasEnoughPower = false;
                let powerSurplus = 0;

                if (this.power != null && this.power.graph != null) {
                    let production = this.power.graph.powerProduction;
                    let needed = this.power.graph.powerNeeded;
                    powerSurplus = production - needed;

                    if (production >= requiredPower && this.power.status >= 1.0) {
                        hasEnoughPower = true;
                    }
                }

                let baseR = 280;
                if (powerSurplus > 0) {
                    this.affectRadius = baseR + Math.min(300, powerSurplus * 0.05);
                } else {
                    this.affectRadius = baseR;
                }

                if (!hasEnoughPower || this.efficiency <= 0) {
                    this.nearEnemies = null;
                    return;
                }

                if (this.empCooldown > 0) this.empCooldown -= Time.delta;
                if (this.megaHypnosisCooldown > 0) this.megaHypnosisCooldown -= Time.delta;

                this.generalTimer += Time.delta;
                this.bladeAngle += 4 * Time.delta;

                if (this.isAsteroidCharging) {
                    this.asteroidChargeTimer += Time.delta;
                    if (this.asteroidChargeTimer >= 3600) {
                        this.executeAsteroidImpact();
                    }
                }

                this.scanTimer = (this.scanTimer || 0) + Time.delta;
                let doScan = this.scanTimer >= 10;
                if (doScan) {
                    this.scanTimer = 0;
                    this.nearEnemies = this.enemiesInRange();
                }
                let enemies = this.nearEnemies || [];
                let enemyCount = enemies.length;

                if (this.currentForm === ThermionForm.YELLOW) {
                    if (doScan && this.level >= 1) {
                        for (let i = 0; i < enemyCount; i++) {
                            let u = enemies[i];
                            if (u.isValid()) u.apply(StatusEffects.slow, 60);
                        }
                    }

                    if (this.level >= 4 && this.generalTimer % 60 < Time.delta) {
                        for (let i = 0; i < enemyCount; i++) {
                            let u = enemies[i];
                            if (u.isValid()) u.damage(u.maxHealth * 0.05);
                        }
                    }

                    if (this.level >= 2 && enemyCount > 0 && this.generalTimer % 120 < Time.delta) {
                        for (let i = 0; i < enemyCount; i++) {
                            let u = enemies[i];
                            if (u.isValid()) u.damage(30 * enemyCount);
                        }
                    }
                }
                else if (this.currentForm === ThermionForm.BLUE) {
                    if (this.level >= 4) {
                        let r = this.affectRadius;
                        Groups.bullet.intersect(this.x - r, this.y - r, r * 2, r * 2, packCons(b => {
                            if (b.team != this.team && Mathf.dst(this.x, this.y, b.x, b.y) <= r) {
                                b.vel.scl(0.99);
                            }
                        }));
                    }

                    for (let i = 0; i < enemyCount; i++) {
                        let u = enemies[i];
                        if (!u.isValid()) continue;

                        if (this.level >= 1 && this.generalTimer % 30 < Time.delta) {
                            u.damage(45);
                        }

                        if (this.level >= 2 && this.generalTimer % 180 < Time.delta) {
                            u.damage(u.maxHealth * 0.08);
                            Puddles.deposit(Vars.world.tileWorld(u.x, u.y), Liquids.slag, 20);
                        }

                        if (doScan && this.level >= 3) {
                            u.apply(StatusEffects.slow, 60);
                        }
                    }
                }
                else if (this.currentForm === ThermionForm.PURPLE) {
                    if (doScan) {
                        for (let i = 0; i < enemyCount; i++) {
                            let u = enemies[i];
                            if (!u.isValid()) continue;

                            if (this.level >= 1) {
                                u.apply(StatusEffects.derelict, 60);
                            }

                            if (this.level >= 4 && Mathf.chance(0.01)) {
                                u.team = this.team;
                            }
                        }
                    }
                }
            },

            drawConfigure() {
                this.super$drawConfigure();

                let formColor = Color.gold;
                if (this.currentForm === ThermionForm.BLUE) formColor = Color.sky;
                else if (this.currentForm === ThermionForm.PURPLE) formColor = Color.purple;
                else if (this.currentForm === ThermionForm.DEAD) formColor = Color.gray;

                drawCustomThermionRange(this.x, this.y, this.affectRadius, formColor, this.level);
            },

            draw() {
                this.super$draw();

                if (this.currentForm === ThermionForm.DEAD) return;

                let formColor = Color.gold;
                if (this.currentForm === ThermionForm.BLUE) formColor = Color.sky;
                else if (this.currentForm === ThermionForm.PURPLE) formColor = Color.purple;

                drawCustomCorePulse(this.x, this.y, formColor, 1.0);

                if (this.currentForm === ThermionForm.YELLOW) {
                    drawCustomElectricEffect(this.x, this.y, 25, Color.gold, 4);
                    if (this.level >= 4) {
                        drawCustomDualBlade(this.x, this.y, 35, this.bladeAngle);
                    }
                } else if (this.currentForm === ThermionForm.BLUE) {
                    drawCustomElectricEffect(this.x, this.y, 30, Color.sky, 6);
                    if (this.isAsteroidCharging) {
                        let progress = this.asteroidChargeTimer / 3600;
                        drawCustomMeteorImpact(this.x, this.y, 50, progress);
                    }
                } else if (this.currentForm === ThermionForm.PURPLE) {
                    drawCustomElectricEffect(this.x, this.y, 20, Color.purple, 5);
                }

                let near = this.nearEnemies;
                if (near != null) {
                    for (let i = 0; i < near.length; i++) {
                        let u = near[i];
                        if (u.isValid() && u.team != this.team) drawCustomCorePulse(u.x, u.y, formColor, 0.5);
                    }
                }
            }
        });
    }
});