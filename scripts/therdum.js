const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqPerkA = { copper: 2000, lead: 2000, silicon: 2000 };
const reqPerkB = { titanium: 1000, thorium: 1000, graphite: 1000 };

// Hiệu ứng trúng đích / biến mất của đạn
const smokeHitFx = new Effect(30, cons(e => {
    Draw.z(Layer.effect + 0.01);
    let alpha = 1.0 - e.fin();
    Draw.color(Color.gray, Color.darkGray, e.fin());
    Draw.alpha(alpha * 0.7);
    
    for (let i = 0; i < 3; i++) {
        let angle = Mathf.randomSeed(e.id + i, 360);
        let dist = Mathf.randomSeed(e.id * 2 + i, 2, 8) * e.fin();
        let size = Mathf.randomSeed(e.id * 3 + i, 2.5, 4.5) * (1.0 - e.fin() * 0.3);
        
        let px = e.x + Angles.trnsx(angle, dist);
        let py = e.y + Angles.trnsy(angle, dist);
        Fill.circle(px, py, size);
    }
    Draw.reset();
}));

// Hiệu ứng vạch kẻ (lines) phun ra ngẫu nhiên từ nòng pháo
const shootMuzzleFx = new Effect(12, cons(e => {
    // Tắt effect nếu game đang bị Pause
    if (Vars.state.isPaused()) return;

    Draw.z(Layer.effect);
    Draw.color(Color.valueOf("#ffcc44"), Color.valueOf("#ff5500"), e.fin());
    
    let stroke = (1.0 - e.fin()) * 1.8;
    Lines.stroke(stroke);

    // Vẽ 5 vạch kẻ (lines) phun ra ngẫu nhiên theo góc bắn của pháo
    for (let i = 0; i < 5; i++) {
        let angle = e.rotation + Mathf.randomSeedRange(e.id + i, 16);
        let lenStart = Mathf.randomSeed(e.id * 2 + i, 2, 6) + e.fin() * 6;
        let lenEnd = lenStart + Mathf.randomSeed(e.id * 3 + i, 4, 10) * (1.0 - e.fin() * 0.5);

        let x1 = e.x + Angles.trnsx(angle, lenStart);
        let y1 = e.y + Angles.trnsy(angle, lenStart);
        let x2 = e.x + Angles.trnsx(angle, lenEnd);
        let y2 = e.y + Angles.trnsy(angle, lenEnd);

        Lines.line(x1, y1, x2, y2);
    }

    Draw.reset();
}));

const therdumBulletBase = extend(BasicBulletType, {
    speed: 6,
    damage: 30,
    width: 10,
    height: 14,
    hitEffect: smokeHitFx,
    despawnEffect: smokeHitFx,
    
    draw(b) {
        Draw.z(Layer.bullet);
        let colFront = Color.valueOf("#ffaa00");
        let colBack = Color.valueOf("#ff5500");

        Draw.color(colBack);
        Draw.alpha(0.6);
        Fill.circle(b.x, b.y, 4.5);

        Draw.color(colFront);
        Draw.alpha(1.0);
        Fill.circle(b.x, b.y, 2.5);

        Draw.reset();
    },

    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        if (other != null && b.owner != null && typeof b.owner.handleTherdumHit === "function") {
            b.owner.handleTherdumHit(b, other);
        }
    }
});

const therdum = extend(ItemTurret, "therdum", {
    configurable: true
});

therdum.health = 3600;
therdum.range = 105;
therdum.reload = 120;
therdum.shootOffset = 12.0; // Khoảng cách vị trí nòng súng (pixels)

therdum.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null) {
        let val = Number(value);
        if (val >= 20) {
            tile.setPerkB(val - 20);
        } else if (val >= 10) {
            tile.setPerkA(val - 10);
        }
    }
}));

therdum.buildType = () => extend(ItemTurret.ItemTurretBuild, therdum, {
    created() {
        this.super$created();
        this.perkAState = 0;
        this.perkBState = 0;
        this.buff3BTimer = 0.0;
        return this;
    },

    getPerkA() { return this.perkAState || 0; },
    setPerkA(val) { this.perkAState = Number(val); },
    getPerkB() { return this.perkBState || 0; },
    setPerkB(val) { this.perkBState = Number(val); },

    range() {
        let perkA = this.getPerkA();
        let baseR = 105;
        if (perkA == 1) baseR = 105 * 1.5;
        if (perkA == 2) baseR = 105 * 1.2;
        if (perkA == 3) baseR = 105 * 0.7;
        return baseR;
    },

    handleTherdumHit(bullet, target) {
        let perkA = this.getPerkA();

        if (perkA == 2 && target != null) {
            Damage.damage(this.team, target.x, target.y, 10, 10, false, true);
        }

        if (this.getPerkB() == 1 && Mathf.chance(0.15)) {
            this.fireExtraSubBullets(10, 8.0);
        }

        if (this.getPerkB() == 3 && Mathf.chance(0.30)) {
            this.buff3BTimer = 15 * 60;
        }
    },

    fireExtraSubBullets(count, spreadDeg) {
        let currentRange = this.range();
        let offset = therdum.shootOffset || 12.0;
        
        let spawnX = this.x + Angles.trnsx(this.rotation, offset);
        let spawnY = this.y + Angles.trnsy(this.rotation, offset);

        // Vị trí effect lùi về hướng tâm pháo thêm 4 pixel (tổng offset - 6.0)
        let fxX = this.x + Angles.trnsx(this.rotation, offset - 4.0);
        let fxY = this.y + Angles.trnsy(this.rotation, offset - 4.0);
        shootMuzzleFx.at(fxX, fxY, this.rotation);

        for (let i = 0; i < count; i++) {
            let rndSpeed = Mathf.random(4.0, 10.0);
            let calculatedLifetime = currentRange / rndSpeed;
            let angle = this.rotation + Mathf.range(spreadDeg);
            
            let b = therdumBulletBase.create(this, this.team, spawnX, spawnY, angle);
            if (b != null) {
                b.vel.setLength(rndSpeed);
                b.lifetime = calculatedLifetime;
                b.damage = 30;
            }
        }
    },

    shoot(type) {
        if (!this.hasAmmo()) return;

        let perkA = this.getPerkA();
        let perkB = this.getPerkB();

        let baseDmg = 30;
        let bulletCount = 40;
        let spreadDeg = 12.0;
        let currentRange = this.range();
        let offset = therdum.shootOffset || 12.0;

        let spawnX = this.x + Angles.trnsx(this.rotation, offset);
        let spawnY = this.y + Angles.trnsy(this.rotation, offset);

        // Vị trí effect lùi về hướng tâm pháo thêm 4 pixel (tổng offset - 6.0)
        let fxX = this.x + Angles.trnsx(this.rotation, offset - 6.0);
        let fxY = this.y + Angles.trnsy(this.rotation, offset - 6.0);
        shootMuzzleFx.at(fxX, fxY, this.rotation);

        if (perkA == 1) {
            baseDmg *= 1.5;
            bulletCount += 10;
        } else if (perkA == 2) {
            baseDmg *= 1.2;
        } else if (perkA == 3) {
            baseDmg *= 3.0;
        }

        if (perkB == 2 && Mathf.chance(0.50)) {
            let healAmount = this.maxHealth;
            let excess = (this.health + healAmount) - this.maxHealth;
            this.health = Math.min(this.maxHealth, this.health + healAmount);

            if (excess > 0) {
                this.fireExtraSubBullets(20, 4.0);
            }
        }

        for (let i = 0; i < bulletCount; i++) {
            let rndSpeed = Mathf.random(3.0, 9.0);
            let calculatedLifetime = currentRange / rndSpeed;
            let angle = this.rotation + Mathf.range(spreadDeg);

            let b = therdumBulletBase.create(this, this.team, spawnX, spawnY, angle);
            if (b != null) {
                b.vel.setLength(rndSpeed);
                b.lifetime = calculatedLifetime;
                b.damage = baseDmg;
            }
        }
        this.useAmmo();
    },

    updateTile() {
        this.super$updateTile();

        if (this.buff3BTimer > 0) {
            this.buff3BTimer -= Time.delta;
        }

        let perkA = this.getPerkA();
        let baseReload = (perkA == 3) ? 60 : 120;

        if (this.buff3BTimer > 0) {
            this.reloadTime = baseReload / 2.2;
        } else {
            this.reloadTime = baseReload;
        }
    },

    buildConfiguration(table) {
        table.clear();
        table.row();

        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Therdum", {});

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

                return "[gold]YÊU CẦU TÀI NGUYÊN LÕI (CẤP MK1):[]\n" +
                       "[yellow]★ ROLL PHÚC LỢI A:[] Đồng: " + colCop + cCop + "[]/2000 | Chì: " + colLea + cLea + "[]/2000 | Silicon: " + colSil + cSil + "[]/2000\n" +
                       "[cyan]★ ROLL PHÚC LỢI B:[] Titan: " + colTit + cTit + "[]/1000 | Thorium: " + colTho + cTho + "[]/1000 | Than chì: " + colGra + cGra + "[]/1000\n" +
                       "[gray](Pháo Therdum Mk1 nâng cấp trực tiếp qua hệ thống Phúc lợi)[]";
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
                                        " • [green]Phúc lợi 1A:[] +50% Sát thương, Tầm bắn +50% (157.5px), +10 Viên đạn.\n" +
                                        " • [green]Phúc lợi 2A:[] +20% Sát thương, Tầm bắn +20% (126px), +10 Dmg lan (10px).\n" +
                                        " • [green]Phúc lợi 3A:[] +200% Sát thương, Tầm bắn -30% (73.5px), Nạp đạn nhanh (2s -> 1s).");
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
                if (perkA == 1) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1A\n• Sát thương +50% (45)\n• Tầm bắn +50% (157.5px)\n• Số đạn +10 (50 viên)[]";
                if (perkA == 2) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2A\n• Sát thương +20% (36)\n• Tầm bắn +20% (126px)\n• Gây thêm 10 Dmg lan (Phạm vi 10px)[]";
                if (perkA == 3) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3A\n• Sát thương +200% (90)\n• Tầm bắn -30% (73.5px)\n• Tốc độ nạp đạn tăng 100% (2s -> 1s)[]";

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
                                        " • [cyan]Phúc lợi 1B:[] 15% Cơ hội bắn thêm 10 đạn phụ phân tán (Độ lệch 8°).\n" +
                                        " • [cyan]Phúc lợi 2B:[] 50% Cơ hội hồi 100% máu khi bắn (Hồi dư xả 20 đạn phụ).\n" +
                                        " • [cyan]Phúc lợi 3B:[] 30% Cơ hội tăng 120% Tốc độ bắn trong 15s khi trúng địch.");
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
                if (perkB == 1) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1B\n• 15% Tỉ lệ bắn thêm 10 đạn phụ (Độ lệch 8°)[]";
                if (perkB == 2) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2B\n• 50% Tỉ lệ hồi 100% máu khi bắn\n• Nếu vượt Max HP: Bắn thêm 20 đạn phụ (Độ lệch 4°)[]";
                if (perkB == 3) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3B\n• 30% Tỉ lệ tăng 120% tốc độ bắn trong 15s khi trúng mục tiêu[]";

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
        })).size(50, 40).tooltip("Trung tâm nâng cấp pháo Therdum");

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Therdum Mk1 ";
            
            let descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN PHÁO THERDUM (MK1) ⚡[]\n" +
                          "• Máu: 3,600 | Tầm bắn: 105px (13.1 ô) | Sát thương gốc: 30.0\n" +
                          "• Cơ chế: Bắn shotgun tỏa 40 viên đạn, lifetime đạn tự điều chỉnh chuẩn theo tầm bắn.\n" +
                          "• Nâng cấp: Nâng cấp trực tiếp chỉ số và kỹ năng qua hệ thống Phúc lợi A & B.";

            let perkA = this.getPerkA();
            let perkB = this.getPerkB();

            if (perkA > 0) {
                descStr += "\n\n[yellow]★ ĐÃ KÍCH HOẠT PHÚC LỢI A ★[]";
                if (perkA == 1) {
                    descStr += "\n[green]• Phúc lợi 1A: Sát thương +50% (45), Tầm bắn +50% (157.5px), Số đạn +10 (50 viên).[]\n" +
                               "  [gray]Kỹ năng đặc biệt: Tăng quy mô hỏa lực diện rộng và khoảng cách áp chế.[]";
                }
                if (perkA == 2) {
                    descStr += "\n[green]• Phúc lợi 2A: Sát thương +20% (36), Tầm bắn +20% (126px).[]\n" +
                               "  [gray]Kỹ năng đặc biệt: Đạn gây thêm 10 Dmg lan trong phạm vi 10px quanh mục tiêu.[]";
                }
                if (perkA == 3) {
                    descStr += "\n[green]• Phúc lợi 3A: Sát thương +200% (90), Tầm bắn -30% (73.5px), Nạp đạn nhanh +100% (1s).[]\n" +
                               "  [gray]Kỹ năng đặc biệt: Biến thành pháo cận chiến siêu sát thương với tốc độ xả đạn cực nhanh.[]";
                }
            }

            if (perkB > 0) {
                descStr += "\n\n[cyan]★ ĐÃ KÍCH HOẠT PHÚC LỢI B ★[]";
                if (perkB == 1) {
                    descStr += "\n[green]• Phúc lợi 1B: Giữ nguyên các chỉ số cơ bản.[]\n" +
                               "  [gray]Kỹ năng đặc biệt: 15% cơ hội bắn bổ sung loạt 10 đạn phụ phân tán khi trúng mục tiêu.[]";
                }
                if (perkB == 2) {
                    descStr += "\n[green]• Phúc lợi 2B: Giữ nguyên các chỉ số cơ bản.[]\n" +
                               "  [gray]Kỹ năng đặc biệt: 50% cơ hội hồi 100% máu khi bắn. Nếu máu đã đầy, bắn xả thêm 20 đạn phụ.[]";
                }
                if (perkB == 3) {
                    descStr += "\n[green]• Phúc lợi 3B: Tốc độ bắn buff +120% khi kích hoạt.[]\n" +
                               "  [gray]Kỹ năng đặc biệt: 30% cơ hội tự kích hoạt buff siêu tốc độ bắn duy trì trong 15s mỗi khi bắn trúng địch.[]";
                }
            }

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
        })).size(50, 40).tooltip("Xem thông số pháo Therdum Mk1");
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