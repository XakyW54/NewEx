const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqPerkA = { copper: 2000, lead: 2000, silicon: 2000 };
const reqPerkB = { titanium: 1000, thorium: 1000, graphite: 1000 };

 function isEn() {
    let loc = "";
    if (typeof Core !== "undefined" && Core.settings) {
        loc = String(Core.settings.get("locale", "vi"));
    }
    return loc.startsWith("en");
}

function t(viText, enText) {
    return isEn() ? enText : viText;
}

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

 const shootMuzzleFx = new Effect(12, cons(e => {
     if (Vars.state.isPaused()) return;

    Draw.z(Layer.effect);
    Draw.color(Color.valueOf("#ffcc44"), Color.valueOf("#ff5500"), e.fin());
    
    let stroke = (1.0 - e.fin()) * 1.8;
    Lines.stroke(stroke);

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
    damage: 48,
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
therdum.shootOffset = 12.0; 

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
                b.damage = 48;
            }
        }
    },

    shoot(type) {
        if (!this.hasAmmo()) return;

        let perkA = this.getPerkA();
        let perkB = this.getPerkB();

        let baseDmg = 48;
        let bulletCount = 40;
        let spreadDeg = 12.0;
        let currentRange = this.range();
        let offset = therdum.shootOffset || 12.0;

        let spawnX = this.x + Angles.trnsx(this.rotation, offset);
        let spawnY = this.y + Angles.trnsy(this.rotation, offset);

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
            let dialog = extend(BaseDialog, t("Trung tâm nâng cấp pháo Therdum", "Therdum Turret Upgrade Center"), {});

            let reqCell = dialog.cont.label(packProv(() => {
                let core = this.team.core();
                if (core == null) return t("[red]Không tìm thấy Lõi Đội![]", "[red]Team Core not found![]");

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

                return t(
                    "[gold]YÊU CẦU TÀI NGUYÊN LÕI (CẤP MK1):[]\n" +
                    "[yellow]★ ROLL PHÚC LỢI A:[] Đồng: " + colCop + cCop + "[]/2000 | Chì: " + colLea + cLea + "[]/2000 | Silicon: " + colSil + cSil + "[]/2000\n" +
                    "[cyan]★ ROLL PHÚC LỢI B:[] Titan: " + colTit + cTit + "[]/1000 | Thorium: " + colTho + cTho + "[]/1000 | Than chì: " + colGra + cGra + "[]/1000\n" +
                    "[gray](Pháo Therdum Mk1 nâng cấp trực tiếp qua hệ thống Phúc lợi)[]",

                    "[gold]CORE RESOURCE REQUIREMENTS (MK1 TIER):[]\n" +
                    "[yellow]★ ROLL PERK A:[] Copper: " + colCop + cCop + "[]/2000 | Lead: " + colLea + cLea + "[]/2000 | Silicon: " + colSil + cSil + "[]/2000\n" +
                    "[cyan]★ ROLL PERK B:[] Titanium: " + colTit + cTit + "[]/1000 | Thorium: " + colTho + cTho + "[]/1000 | Graphite: " + colGra + cGra + "[]/1000\n" +
                    "[gray](Therdum Mk1 upgrades directly via Perk system)[]"
                );
            }));

            reqCell.width(380).get().setWrap(true);
            reqCell.get().setAlignment(Align.left);
            dialog.cont.row();
            dialog.cont.add().height(10).row();

            let mainTable = new Table();

            let boxA = new Table();
            boxA.background(Styles.black6);
            boxA.margin(12);
            boxA.add(t("[yellow]★ ROLL PHÚC LỢI A (NGẪU NHIÊN) ★[]", "[yellow]★ ROLL PERK A (RANDOM) ★[]")).row();

            let perkA = this.getPerkA();
            if (perkA == 0) {
                let txtADesc = boxA.add(t(
                    "Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi A:\n" +
                    " • [green]Phúc lợi 1A:[] +50% Sát thương, Tầm bắn +50% (157.5px), +10 Viên đạn.\n" +
                    " • [green]Phúc lợi 2A:[] +20% Sát thương, Tầm bắn +20% (126px), +10 Dmg lan (10px).\n" +
                    " • [green]Phúc lợi 3A:[] +200% Sát thương, Tầm bắn -30% (73.5px), Nạp đạn nhanh (2s -> 1s).",

                    "Activate upgrade protocol to randomly get 1 of 3 Perk A choices:\n" +
                    " • [green]Perk 1A:[] +50% Damage, Range +50% (157.5px), +10 Bullets.\n" +
                    " • [green]Perk 2A:[] +20% Damage, Range +20% (126px), +10 Splash Dmg (10px).\n" +
                    " • [green]Perk 3A:[] +200% Damage, Range -30% (73.5px), Fast Reload (2s -> 1s)."
                ));
                txtADesc.width(340).get().setWrap(true);
                txtADesc.get().setAlignment(Align.left);
                boxA.row();

                boxA.button(t("[yellow]QUAY PHÚC LỢI A (2K Đồng/Chì/Silicon)[]", "[yellow]ROLL PERK A (2K Cop/Lead/Sil)[]"), packRun(() => {
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
                        Vars.ui.showInfo(t("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[yellow]PHÚC LỢI " + res + "A[]", "[gold]YOU ROLLED:[]\n[yellow]PERK " + res + "A[]"));
                        dialog.hide();
                        this.deselect();
                    } else {
                        Vars.ui.showInfo(t("[red]Không đủ tài nguyên roll Phúc lợi A![]", "[red]Not enough resources to roll Perk A![]"));
                    }
                })).size(280, 40);
            } else {
                let txtA = "";
                if (perkA == 1) txtA = t("[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1A\n• Sát thương +50% (72)\n• Tầm bắn +50% (157.5px)\n• Số đạn +10 (50 viên)[]", "[green]✔ ACTIVATED: PERK 1A\n• Damage +50% (72)\n• Range +50% (157.5px)\n• Bullets +10 (50 count)[]");
                if (perkA == 2) txtA = t("[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2A\n• Sát thương +20% (57.6)\n• Tầm bắn +20% (126px)\n• Gây thêm 10 Dmg lan (Phạm vi 10px)[]", "[green]✔ ACTIVATED: PERK 2A\n• Damage +20% (57.6)\n• Range +20% (126px)\n• +10 Splash Dmg (10px Radius)[]");
                if (perkA == 3) txtA = t("[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3A\n• Sát thương +200% (144)\n• Tầm bắn -30% (73.5px)\n• Tốc độ nạp đạn tăng 100% (2s -> 1s)[]", "[green]✔ ACTIVATED: PERK 3A\n• Damage +200% (144)\n• Range -30% (73.5px)\n• Reload Speed +100% (2s -> 1s)[]");

                let txtACell = boxA.add(txtA);
                txtACell.width(340).get().setWrap(true);
                txtACell.get().setAlignment(Align.left);
            }

            mainTable.add(boxA).width(360).row();
            mainTable.add().height(12).row();

            let boxB = new Table();
            boxB.background(Styles.black6);
            boxB.margin(12);
            boxB.add(t("[cyan]★ ROLL PHÚC LỢI B (NGẪU NHIÊN) ★[]", "[cyan]★ ROLL PERK B (RANDOM) ★[]")).row();

            let perkB = this.getPerkB();
            if (perkB == 0) {
                let txtBDesc = boxB.add(t(
                    "Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi B:\n" +
                    " • [cyan]Phúc lợi 1B:[] 15% Cơ hội bắn thêm 10 đạn phụ phân tán (Độ lệch 8°).\n" +
                    " • [cyan]Phúc lợi 2B:[] 50% Cơ hội hồi 100% máu khi bắn (Hồi dư xả 20 đạn phụ).\n" +
                    " • [cyan]Phúc lợi 3B:[] 30% Cơ hội tăng 120% Tốc độ bắn trong 15s khi trúng địch.",

                    "Activate upgrade protocol to randomly get 1 of 3 Perk B choices:\n" +
                    " • [cyan]Perk 1B:[] 15% Chance to fire 10 extra sub-bullets (8° spread).\n" +
                    " • [cyan]Perk 2B:[] 50% Chance to heal 100% HP on fire (Overheal fires 20 sub-bullets).\n" +
                    " • [cyan]Perk 3B:[] 30% Chance to increase Fire Rate by 120% for 15s on hit."
                ));
                txtBDesc.width(340).get().setWrap(true);
                txtBDesc.get().setAlignment(Align.left);
                boxB.row();

                boxB.button(t("[cyan]QUAY PHÚC LỢI B (1K Titan/Thorium/Graphite)[]", "[cyan]ROLL PERK B (1K Tit/Tho/Graph)[]"), packRun(() => {
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
                        Vars.ui.showInfo(t("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[cyan]PHÚC LỢI " + res + "B[]", "[gold]YOU ROLLED:[]\n[cyan]PERK " + res + "B[]"));
                        dialog.hide();
                        this.deselect();
                    } else {
                        Vars.ui.showInfo(t("[red]Không đủ tài nguyên roll Phúc lợi B![]", "[red]Not enough resources to roll Perk B![]"));
                    }
                })).size(280, 40);
            } else {
                let txtB = "";
                if (perkB == 1) txtB = t("[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1B\n• 15% Tỉ lệ bắn thêm 10 đạn phụ (Độ lệch 8°)[]", "[green]✔ ACTIVATED: PERK 1B\n• 15% Chance to fire 10 sub-bullets (8° spread)[]");
                if (perkB == 2) txtB = t("[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2B\n• 50% Tỉ lệ hồi 100% máu khi bắn\n• Nếu vượt Max HP: Bắn thêm 20 đạn phụ (Độ lệch 4°)[]", "[green]✔ ACTIVATED: PERK 2B\n• 50% Chance to heal 100% HP on fire\n• Overheal: Fires 20 extra sub-bullets (4° spread)[]");
                if (perkB == 3) txtB = t("[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3B\n• 30% Tỉ lệ tăng 120% tốc độ bắn trong 15s khi trúng mục tiêu[]", "[green]✔ ACTIVATED: PERK 3B\n• 30% Chance to gain +120% Fire Rate for 15s on hit[]");

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
        })).size(50, 40).tooltip(t("Trung tâm nâng cấp pháo Therdum", "Therdum Turret Upgrade Center"));

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = t(" Thông số pháo Therdum Mk1 ", " Therdum Mk1 Stats ");
            
            let descStr = t(
                "[gold]⚡ THÔNG SỐ CƠ BẢN PHÁO THERDUM (MK1) ⚡[]\n" +
                "• Máu: 3,600 | Tầm bắn: 105px (13.1 ô) | Sát thương gốc: 48.0\n" +
                "• Cơ chế: Bắn shotgun tỏa 40 viên đạn, lifetime đạn tự điều chỉnh chuẩn theo tầm bắn.\n" +
                "• Nâng cấp: Nâng cấp trực tiếp chỉ số và kỹ năng qua hệ thống Phúc lợi A & B.",

                "[gold]⚡ THERDUM TURRET BASIC STATS (MK1) ⚡[]\n" +
                "• Health: 3,600 | Range: 105px (13.1 tiles) | Base Damage: 48.0\n" +
                "• Mechanism: Shotgun spread firing 40 bullets, bullet lifetime auto-adjusts to range.\n" +
                "• Upgrades: Directly upgrade stats and skills via Perk A & B system."
            );

            let perkA = this.getPerkA();
            let perkB = this.getPerkB();

            if (perkA > 0) {
                descStr += t("\n\n[yellow]★ ĐÃ KÍCH HOẠT PHÚC LỢI A ★[]", "\n\n[yellow]★ PERK A ACTIVATED ★[]");
                if (perkA == 1) {
                    descStr += t(
                        "\n[green]• Phúc lợi 1A: Sát thương +50% (72), Tầm bắn +50% (157.5px), Số đạn +10 (50 viên).[]\n" +
                        "  [gray]Kỹ năng đặc biệt: Tăng quy mô hỏa lực diện rộng và khoảng cách áp chế.[]",

                        "\n[green]• Perk 1A: Damage +50% (72), Range +50% (157.5px), Bullets +10 (50 count).[]\n" +
                        "  [gray]Special Skill: Increases wide-area firepower and suppression distance.[]"
                    );
                }
                if (perkA == 2) {
                    descStr += t(
                        "\n[green]• Phúc lợi 2A: Sát thương +20% (57.6), Tầm bắn +20% (126px).[]\n" +
                        "  [gray]Kỹ năng đặc biệt: Đạn gây thêm 10 Dmg lan trong phạm vi 10px quanh mục tiêu.[]",

                        "\n[green]• Perk 2A: Damage +20% (57.6), Range +20% (126px).[]\n" +
                        "  [gray]Special Skill: Bullets deal +10 splash damage in 10px radius around target.[]"
                    );
                }
                if (perkA == 3) {
                    descStr += t(
                        "\n[green]• Phúc lợi 3A: Sát thương +200% (144), Tầm bắn -30% (73.5px), Nạp đạn nhanh +100% (1s).[]\n" +
                        "  [gray]Kỹ năng đặc biệt: Biến thành pháo cận chiến siêu sát thương với tốc độ xả đạn cực nhanh.[]",

                        "\n[green]• Perk 3A: Damage +200% (144), Range -30% (73.5px), Fast Reload +100% (1s).[]\n" +
                        "  [gray]Special Skill: Transforms into ultra-high damage melee turret with extreme burst rate.[]"
                    );
                }
            }

            if (perkB > 0) {
                descStr += t("\n\n[cyan]★ ĐÃ KÍCH HOẠT PHÚC LỢI B ★[]", "\n\n[cyan]★ PERK B ACTIVATED ★[]");
                if (perkB == 1) {
                    descStr += t(
                        "\n[green]• Phúc lợi 1B: Giữ nguyên các chỉ số cơ bản.[]\n" +
                        "  [gray]Kỹ năng đặc biệt: 15% cơ hội bắn bổ sung loạt 10 đạn phụ phân tán khi trúng mục tiêu.[]",

                        "\n[green]• Perk 1B: Keeps base stats unchanged.[]\n" +
                        "  [gray]Special Skill: 15% chance to trigger extra 10 sub-bullets spread fire on hit.[]"
                    );
                }
                if (perkB == 2) {
                    descStr += t(
                        "\n[green]• Phúc lợi 2B: Giữ nguyên các chỉ số cơ bản.[]\n" +
                        "  [gray]Kỹ năng đặc biệt: 50% cơ hội hồi 100% máu khi bắn. Nếu máu đã đầy, bắn xả thêm 20 đạn phụ.[]",

                        "\n[green]• Perk 2B: Keeps base stats unchanged.[]\n" +
                        "  [gray]Special Skill: 50% chance to heal 100% HP when firing. Overheal releases 20 sub-bullets.[]"
                    );
                }
                if (perkB == 3) {
                    descStr += t(
                        "\n[green]• Phúc lợi 3B: Tốc độ bắn buff +120% khi kích hoạt.[]\n" +
                        "  [gray]Kỹ năng đặc biệt: 30% cơ hội tự kích hoạt buff siêu tốc độ bắn duy trì trong 15s mỗi khi bắn trúng địch.[]",

                        "\n[green]• Perk 3B: Fire rate buffed +120% when active.[]\n" +
                        "  [gray]Special Skill: 30% chance to trigger super fire rate buff for 15s upon hitting target.[]"
                    );
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
        })).size(50, 40).tooltip(t("Xem thông số pháo Therdum Mk1", "View Therdum Mk1 Stats"));
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