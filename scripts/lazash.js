const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqPerkA = { copper: 2000, lead: 2000, silicon: 2000 };
const reqPerkB = { titanium: 1000, thorium: 1000, graphite: 1000 };

// 1. HIỆU ỨNG TỤ LỰC (CHARGING EFFECT)
const vChargeFx = new Effect(25, cons(e => {
    Draw.z(Layer.effect + 0.01);
    let fin = e.fin();
    let fout = e.fout();
    let rot = e.rotation;

    let startX = e.x;
    let startY = e.y;
    let slashLength = e.data != null ? Number(e.data) : 320.0;

    let endX = startX + Angles.trnsx(rot, slashLength);
    let endY = startY + Angles.trnsy(rot, slashLength);

    Draw.color(Color.valueOf("#ff4444"), Color.white, fin);
    Draw.alpha(fin * 0.8);
    Lines.stroke(1.5 * fin);
    Lines.line(startX, startY, endX, endY);

    Draw.color(Color.white, Color.valueOf("#ff5533"), fin);
    let sparkCount = 4;
    for (let i = 0; i < sparkCount; i++) {
        let seed = e.id * 50 + i + Math.floor(fin * 8);
        let dist = Mathf.randomSeed(seed, 10, 35) * fout;
        let angle = rot + Mathf.randomSeed(seed + 1, -180, 180);

        let sx = startX + Angles.trnsx(angle, dist);
        let sy = startY + Angles.trnsy(angle, dist);

        Lines.stroke(1.2 * fin);
        Lines.line(sx, sy, startX, startY);
    }
    Draw.reset();
}));

// 2. HIỆU ỨNG NHÁT CHÉM THẲNG (VFX Đỏ Cam - Hỗ trợ độ rộng & độ dài động)
const vSlashHitFx = new Effect(25, cons(e => {
    Draw.z(Layer.effect + 0.02);
    
    let fin = e.fin(); 
    let fout = e.fout();
    let rot = e.rotation;

    let startX = e.x;
    let startY = e.y;
    
    // e.data truyền vào dạng { len: float, widthMult: float }
    let slashLength = (e.data != null && e.data.len) ? e.data.len : 320.0;
    let wMult = (e.data != null && e.data.widthMult) ? e.data.widthMult : 1.0;

    let endX = startX + Angles.trnsx(rot, slashLength * Math.min(1.0, fin * 1.5));
    let endY = startY + Angles.trnsy(rot, slashLength * Math.min(1.0, fin * 1.5));

    // Glow bên ngoài
    Draw.color(Color.valueOf("#ff3333"), Color.valueOf("#ff6644"), fin);
    Draw.alpha(fout * 0.7);
    Lines.stroke(32.0 * wMult * fout);
    Lines.line(startX, startY, endX, endY);

    // Thân nhát chém lớn
    Draw.color(Color.valueOf("#ff8866"), Color.valueOf("#ffe0cc"), fin);
    Draw.alpha(fout);
    
    let layers = 5;
    for (let i = 0; i < layers; i++) {
        let offset = (i - layers / 2) * 2.5 * wMult;
        let perpX = Angles.trnsx(rot + 90, offset);
        let perpY = Angles.trnsy(rot + 90, offset);
        let strokeSize = (14.0 - Math.abs(i - layers / 2) * 2.2) * wMult * fout;
        
        Lines.stroke(strokeSize);
        Lines.line(startX + perpX, startY + perpY, endX + perpX, endY + perpY);
    }

    // Lõi trắng sáng
    Draw.color(Color.white);
    Draw.alpha(fout);
    Lines.stroke(6.0 * wMult * fout);
    Lines.line(startX, startY, endX, endY);

    Draw.reset();
}));

// 3. ĐẠN QUẢ CẦU NĂNG LƯỢNG (PHÚC LỢI 2B)
const energyOrbBullet = extend(BasicBulletType, {
    speed: 7.0,
    damage: 35,
    lifetime: 60,
    width: 16,
    height: 16,
    shrinkX: 0,
    shrinkY: 0,

    draw(b) {
        Draw.z(Layer.bullet);
        let fout = b.fout();
        
        // Quả cầu nén nhiều lớp đỏ cam trắng
        Draw.color(Color.valueOf("#ff3333"));
        Fill.circle(b.x, b.y, 10.0);
        
        Draw.color(Color.valueOf("#ff8866"));
        Fill.circle(b.x, b.y, 7.0);

        Draw.color(Color.white);
        Fill.circle(b.x, b.y, 4.0);

        // Vòng năng lượng tỏa nhẹ
        Lines.stroke(1.5 * fout, Color.valueOf("#ff6644"));
        Lines.circle(b.x, b.y, 12.0 + (1.0 - fout) * 4.0);

        Draw.reset();
    }
});

// Hàm Gây Sát Thương Dọc Theo Nhát Chém
function damageStraightSlash(team, startX, startY, rotation, length, damageAmount) {
    let steps = Math.floor(length / 25.0);
    let stepDist = length / steps;
    let hitRadius = 24.0;

    for (let i = 0; i <= steps; i++) {
        let px = startX + Angles.trnsx(rotation, stepDist * i);
        let py = startY + Angles.trnsy(rotation, stepDist * i);

        Damage.damage(team, px, py, hitRadius, damageAmount, true, true);
    }
}

// Khai báo pháo LAZASH
const lazash = extend(PowerTurret, "lazash", {
    configurable: true
});

lazash.health = 3600;
lazash.range = 320; 
lazash.reload = 120; 

// Đạn Laser Vanilla (10 dmg mỗi 0.2s)
lazash.shootType = extend(LaserBulletType, {
    damage: 10, 
    length: 320, 
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
        this.isCharging = false;
        this.reloadTimer = 0.0;
        this.laserTimer = 0.0;

        // Trạng thái cho Phúc lợi 2B
        this.slashCount2B = 0;
        this.isFrenzy2B = false;
        this.frenzyShotsLeft = 0;
        this.frenzyTimer = 0.0;

        return this;
    },

    getPerkA() { return this.perkAState || 0; },
    setPerkA(val) { this.perkAState = Number(val); },
    getPerkB() { return this.perkBState || 0; },
    setPerkB(val) { this.perkBState = Number(val); },

    // Tính toán Tầm bắn dựa trên Phúc lợi
    range() {
        let perkA = this.getPerkA();
        let baseR = 320.0;
        if (perkA == 3) baseR = 320.0 * 2.5; // Phúc lợi 3A: Tăng 150% (320 * 2.5 = 800px)
        return baseR;
    },

    executeSlash(angleOffset) {
        let perkA = this.getPerkA();
        let perkB = this.getPerkB();

        let angle = this.rotation + angleOffset;
        let slashLen = this.range(); 
        let baseSlashDmg = 49.0;

        // --- CỘNG DỒN MULTIPLIER SÁT THƯƠNG ---
        let dmgMult = 1.0;
        if (perkA == 3) dmgMult += 0.20; // 3A: +20%
        if (perkB == 1) dmgMult += 0.50; // 1B: +50%
        if (perkB == 3) dmgMult += 2.00; // 3B: +200%

        let widthMult = (perkB == 3) ? 2.5 : 1.0; // 3B: Tăng 150% kích thước diện rộng (2.5x)

        // Vẽ FX nhát chém
        vSlashHitFx.at(this.x, this.y, angle, { len: slashLen, widthMult: widthMult });
        damageStraightSlash(this.team, this.x, this.y, angle, slashLen, baseSlashDmg * dmgMult);

        // Phúc lợi 1A: 50% tỉ lệ bắn thêm 1 tia vSlashHitFx phụ
        if (perkA == 1 && Mathf.chance(0.50)) {
            let bonusAngle = angle + Mathf.range(15);
            vSlashHitFx.at(this.x, this.y, bonusAngle, { len: slashLen, widthMult: widthMult });
            damageStraightSlash(this.team, this.x, this.y, bonusAngle, slashLen, (baseSlashDmg * dmgMult) * 0.5);
        }

        // Đếm số lần bắn cho Phúc lợi 2B
        if (perkB == 2 && !this.isFrenzy2B) {
            this.slashCount2B++;
            if (this.slashCount2B >= 5) {
                this.slashCount2B = 0;
                this.isFrenzy2B = true;
                this.frenzyShotsLeft = 100; // Khóa pháo bắn 100 viên
            }
        }
    },

    updateTile() {
        this.super$updateTile();

        let perkA = this.getPerkA();
        let perkB = this.getPerkB();

        // Tốc độ hồi nạp đạn (Reload Speed Multiplier)
        let speedMult = 1.0;
        if (perkA == 2) speedMult *= 2.0; // 2A: Giảm 50% thời gian bắn (gấp 2 tốc độ)
        if (perkB == 1) speedMult *= 1.428; // 1B: Giảm 30% thời gian bắn (gấp 1/0.7 tốc độ)
        if (perkB == 3) speedMult *= 0.5; // 3B: Giảm 50% tốc độ bắn

        if (this.reloadTimer > 0) {
            this.reloadTimer -= Time.delta * speedMult;
        }

        this.findTarget();
        let isControlled = this.isControlled() || this.logicControlled();
        let hasPower = this.power != null && this.power.status > 0.5;

        // --- TRẠNG THÁI BẮN LOẠN 100 VIÊN (PHÚC LỢI 2B) ---
        if (this.isFrenzy2B) {
            if (hasPower) {
                this.frenzyTimer += Time.delta;
                if (this.frenzyTimer >= 3.0) { // Bắn nhanh liên tục mỗi 3 ticks
                    this.frenzyTimer = 0.0;

                    let targetAngle = this.rotation;
                    if (this.target != null) {
                        targetAngle = this.angleTo(this.target);
                    }
                    let spreadAngle = targetAngle + Mathf.range(8.0); // Độ lệch 8 độ

                    energyOrbBullet.create(this, this.team, this.x, this.y, spreadAngle);
                    Fx.shootBig.at(this.x, this.y, spreadAngle);

                    this.frenzyShotsLeft--;
                    if (this.frenzyShotsLeft <= 0) {
                        this.isFrenzy2B = false; // Xả hết 100 viên mới thoát trạng thái
                    }
                }
            }
            return; // Đang bắn loạn thì tạm dừng các cơ chế bắn thường
        }

        // --- BẮN THƯỜNG / XOAY NÒNG ---
        if (hasPower) {
            if (isControlled) {
                let u = this.unit;
                if (u != null) {
                    this.turnToTarget(this.angleTo(u.aimX, u.aimY));
                }
            } else if (this.target != null && this.within(this.target, this.range())) {
                this.turnToTarget(this.angleTo(this.target));
            }
        }

        let canShoot = hasPower && (
            (isControlled && this.isShooting) || 
            (!isControlled && this.target != null && this.within(this.target, this.range()))
        );

        // Bắn Tia Laser Vanilla mỗi 0.2s
        if (canShoot) {
            this.laserTimer += Time.delta;
            if (this.laserTimer >= 12.0) { 
                this.laserTimer = 0.0;
                let lType = lazash.shootType;
                lType.length = this.range(); // Cập nhật độ dài tia laser bằng range
                lType.create(this, this.team, this.x, this.y, this.rotation);
            }
        } else {
            this.laserTimer = 0.0;
        }

        if (canShoot && this.reloadTimer <= 0 && !this.isCharging) {
            this.isCharging = true;
            this.chargeTimer = 25.0; 
        }

        if (this.isCharging) {
            this.chargeTimer -= Time.delta;
            
            if (Mathf.chance(0.6)) {
                vChargeFx.at(this.x, this.y, this.rotation, this.range());
            }

            if (this.chargeTimer <= 0) {
                this.isCharging = false;
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
                let txtADesc = boxA.add("Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi A:\n" +
                                        " • [green]Phúc lợi 1A:[] 50% Tỉ lệ bắn thêm 1 tia vSlashHitFx khi trúng.\n" +
                                        " • [green]Phúc lợi 2A:[] Giảm 50% thời gian hồi bắn tia vSlashHitFx.\n" +
                                        " • [green]Phúc lợi 3A:[] Tăng phạm vi & độ dài vSlashHitFx thêm +150% (800px), +20% Sát thương.");
                txtADesc.width(340).get().setWrap(true);
                txtADesc.get().setAlignment(Align.left);
                boxA.row();

                boxA.button("[yellow]QUAY PHÚC LỢI A (2K Đồng/Chì/Silicon)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.copper) >= 2000 && core.items.get(Items.lead) >= 2000 && core.items.get(Items.silicon) >= 2000) {
                        core.items.remove(Items.copper, 2000);
                        core.items.remove(Items.lead, 2000);
                        core.items.remove(Items.silicon, 2000);

                        let res = Math.floor(Mathf.random(1, 3.99));
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
                if (perkA == 1) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1A\n• 50% Cơ hội bắn thêm 1 tia vSlashHitFx phụ[]";
                if (perkA == 2) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2A\n• Giảm 50% thời gian hồi bắn nhát chém[]";
                if (perkA == 3) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3A\n• Tầm bắn & Độ dài tia +150% (800px)\n• Sát thương vSlashHitFx +20%[]";

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
                          "• Máu: 3,600 | Tầm bắn mặc định: 320px\n" +
                          "• Sát thương vSlashHitFx: 49.0 | Sát thương Laser Vanilla: 10.0 (0.2s/lần)";

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