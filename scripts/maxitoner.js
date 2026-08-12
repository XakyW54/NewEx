const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// ==================== TÙY CHỈNH MÀU SẮC VỤ NỔ NITOUÍ ====================
// Bạn có thể đổi Color.orange, Color.red, Color.purple, Color.lime,... tùy thích
const EXPLODE_COLOR = Color.orange; 
const EXPLODE_COLOR_LIGHT = Color.valueOf("#ffdfa9"); // Màu ánh sáng tâm/nhân vụ nổ

// Chi phí Roll Phúc lợi Maxitoner
const reqPerkA = { copper: 1500, lead: 1500, silicon: 1500 };
const reqPerkB = { titanium: 1500, thorium: 1500, silicon: 1500 };
const reqPerkC = { surgeAlloy: 500, phaseFabric: 500, silicon: 2000 };

// Map lưu trữ trạng thái cộng dồn Nitoui: Map<Unit, { count: number }>
const nitouiMap = new java.util.WeakHashMap();

// ==================== 1. HIỆU ỨNG VỤ NỔ NITOUÍ (ĐỔI MÀU TÙY CHỌN) ====================
const nitouiExplodeFx = new Effect(35, cons(e => {
    Draw.z(Layer.effect + 0.1);
    
    let radius = e.rotation;
    let fin = e.fin();
    let fout = e.fout();

    Draw.blend(Blending.additive);
    
    let zoomProgress = Math.sin(fin * Math.PI); 
    let coreScale = 0.2 + 0.8 * zoomProgress;
    let coreRadius = (radius * 0.3) * coreScale;

    // AURA VỤ NỔ (Sử dụng màu tùy chỉnh)
    Draw.color(EXPLODE_COLOR);
    Draw.alpha(0.5 * fout);
    Fill.circle(e.x, e.y, coreRadius * 3.5);

    Draw.color(EXPLODE_COLOR_LIGHT);
    Draw.alpha(0.8 * fout);
    Fill.circle(e.x, e.y, coreRadius * 2.0);

    Draw.color(EXPLODE_COLOR);
    Draw.alpha(1.0 * fout);
    Fill.circle(e.x, e.y, coreRadius * 1.3);

    // VIỀN VÒNG TRÒN
    let ringStroke = 3.0 * Math.sin(fin * Math.PI);
    Draw.color(EXPLODE_COLOR);
    Draw.alpha(0.6 * fout);
    Lines.stroke(ringStroke * 2.5);
    Lines.circle(e.x, e.y, radius * fin);

    Draw.color(EXPLODE_COLOR_LIGHT);
    Draw.alpha(0.9 * fout);
    Lines.stroke(ringStroke);
    Lines.circle(e.x, e.y, radius * fin);

    // TỨ GIÁC BẮT SÁNG
    let quadCount = 12;
    for (let i = 0; i < quadCount; i++) {
        let seed = e.id + i * 123;
        let angle = Mathf.randomSeed(seed, 0, 360);
        let dist = Mathf.randomSeed(seed + 1, 5, radius * 0.85) * fin;
        let px = e.x + Angles.trnsx(angle, dist);
        let py = e.y + Angles.trnsy(angle, dist);
        let quadSize = Mathf.randomSeed(seed + 2, 2.5, 7.0) * fout;
        let rot = Mathf.randomSeed(seed + 3, 0, 360) + Time.time * 2;

        Draw.color(EXPLODE_COLOR);
        Draw.alpha(0.7 * fout);
        Fill.poly(px, py, 4, quadSize * 2.2, rot);
    }
    
    Draw.blend();

    // NHÂN VỤ NỔ SẮC NÉT
    Draw.color(Color.white);
    Fill.circle(e.x, e.y, coreRadius * 0.6 * fout);

    for (let i = 0; i < quadCount; i++) {
        let seed = e.id + i * 123;
        let angle = Mathf.randomSeed(seed, 0, 360);
        let dist = Mathf.randomSeed(seed + 1, 5, radius * 0.85) * fin;
        let px = e.x + Angles.trnsx(angle, dist);
        let py = e.y + Angles.trnsy(angle, dist);
        let quadSize = Mathf.randomSeed(seed + 2, 2.5, 7.0) * fout;
        let rot = Mathf.randomSeed(seed + 3, 0, 360) + Time.time * 2;

        Draw.color(EXPLODE_COLOR_LIGHT, EXPLODE_COLOR, Mathf.randomSeed(seed + 4, 0, 1));
        if (i % 2 === 0) {
            Fill.poly(px, py, 4, quadSize, rot);
        } else {
            Lines.stroke(1.2 * fout);
            Lines.poly(px, py, 4, quadSize, rot);
        }
    }

    Draw.reset();
}));

// ==================== 2. HẠT STATUS NITOUÍ CỰC NHỎ & ĐÚNG SỐ TẦNG ====================
const nitouiIngatherFx = new Effect(20, cons(e => {
    Draw.z(Layer.effect + 0.05);
    
    let seed = e.id;
    let startDist = 12.0 + Mathf.randomSeed(seed, 0, 6); 
    let dist = startDist * (1.0 - e.fin());
    let angle = Mathf.randomSeed(seed + 1, 0, 360);
    
    let px = e.x + Angles.trnsx(angle, dist);
    let py = e.y + Angles.trnsy(angle, dist);
    
    // KÍCH THƯỚC HẠT ĐƯỢC THU NHỎ RẤT NHIỀU (0.4px - 1.0px)
    let size = (0.4 + Mathf.randomSeed(seed + 2, 0, 0.6)) * e.fout();
    let rot = Mathf.randomSeed(seed + 3, 0, 360) + Time.time * 4;

    Draw.blend(Blending.additive);
    Draw.color(EXPLODE_COLOR);
    Draw.alpha(0.8 * e.fout());
    Fill.poly(px, py, 4, size * 1.8, rot);
    Draw.blend();

    Draw.color(EXPLODE_COLOR_LIGHT);
    Draw.alpha(1.0 * e.fout());
    Fill.poly(px, py, 4, size, rot);
    
    Draw.reset();
}));

var nitouiStatus = extend(StatusEffect, "nitoui-status", {
    init() {
        this.super$init();
        this.uiIcon = StatusEffects.shocked.uiIcon;
        this.fullIcon = StatusEffects.shocked.fullIcon;
    },
    color: EXPLODE_COLOR,
    
    update(unit, time) {
        this.super$update(unit, time);
        
        let data = nitouiMap.get(unit);
        if (data != null && data.count > 0) {
            // TẠO ĐÚNG SỐ HẠT BẰNG SỐ TẦNG TÍCH LŨY (5 TẦNG = 5 HẠT, 9 TẦNG = 9 HẠT)
            for (let i = 0; i < data.count; i++) {
                nitouiIngatherFx.at(unit.x, unit.y);
            }
        }
    }
});

// Hiệu ứng bắn gốc
const maxitonerShootFx = new Effect(25, cons(e => {
    Draw.z(Layer.effect);
    Draw.blend(Blending.additive);
    Draw.color(EXPLODE_COLOR);
    Draw.alpha(0.5 * e.fout());
    Fill.poly(e.x, e.y, 4, (6 + 4 * e.fin()), 0);
    Draw.blend();

    Draw.color(EXPLODE_COLOR_LIGHT, EXPLODE_COLOR, e.fin());
    Lines.stroke(1.5 * e.fout()); 
    let size = 5 + 3 * e.fin();
    Lines.poly(e.x, e.y, 4, size, 0);
    
    Draw.color(Color.white, EXPLODE_COLOR, e.fin());
    Fill.poly(e.x, e.y, 4, (size * 0.4) * e.fout(), 0);
    
    Draw.reset();
}));

// Hiệu ứng bắn NHỎ
const maxitonerShootFxSmall = new Effect(20, cons(e => {
    Draw.z(Layer.effect);
    Draw.blend(Blending.additive);
    Draw.color(EXPLODE_COLOR);
    Draw.alpha(0.4 * e.fout());
    Fill.poly(e.x, e.y, 4, (4 + 3 * e.fin()), 0);
    Draw.blend();

    Draw.color(EXPLODE_COLOR_LIGHT, EXPLODE_COLOR, e.fin());
    Lines.stroke(1.0 * e.fout()); 
    let size = 3 + 2 * e.fin();
    Lines.poly(e.x, e.y, 4, size, 0);
    
    Draw.color(Color.white, EXPLODE_COLOR, e.fin());
    Fill.poly(e.x, e.y, 4, (size * 0.4) * e.fout(), 0);
    
    Draw.reset();
}));

// Đạn gốc Maxitoner
const maxitonerBulletBase = extend(BasicBulletType, {
    speed: 7.0,
    damage: 10,
    width: 8,
    height: 12,
    frontColor: EXPLODE_COLOR_LIGHT,
    backColor: EXPLODE_COLOR,
    shootEffect: maxitonerShootFx,
    
    draw(b) {
        Draw.z(Layer.bullet);
        
        Draw.blend(Blending.additive);
        Draw.color(EXPLODE_COLOR);
        Draw.alpha(0.5);
        Fill.poly(b.x, b.y, 4, 8.0, b.rotation());
        Draw.blend();

        Draw.color(this.backColor);
        Fill.poly(b.x, b.y, 4, 5.0, b.rotation());
        
        Draw.color(this.frontColor);
        Fill.poly(b.x, b.y, 4, 3.0, b.rotation());
        
        Draw.reset();
    },

    hitEntity(b, other, initialHealth) {
        this.super$hitEntity(b, other, initialHealth);
        if (other != null && b.owner != null && typeof b.owner.handleMaxitonerHit === "function") {
            b.owner.handleMaxitonerHit(b, other);
        }
    }
});

// Khởi tạo Pháo Maxitoner
const maxitoner = extend(ItemTurret, "maxitoner", {
    configurable: true
});

maxitoner.health = 120;
maxitoner.range = 350;
maxitoner.reload = 48;
maxitoner.recoil = 3.0;
maxitoner.shootX = 0;
maxitoner.shootY = 5;
maxitoner.shootEffect = maxitonerShootFx;
maxitoner.ammo(Items.metaglass, maxitonerBulletBase);

maxitoner.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null) {
        let val = Number(value);
        if (val >= 30) {
            tile.setPerkC(val - 30);
        } else if (val >= 20) {
            tile.setPerkB(val - 20);
        } else if (val >= 10) {
            tile.setPerkA(val - 10);
        }
    }
}));

maxitoner.buildType = () => extend(ItemTurret.ItemTurretBuild, maxitoner, {
    created() {
        this.super$created();
        this.perkAState = 0;
        this.perkBState = 0;
        this.perkCState = 0;
        this.autoFireTimer = 0;
        return this;
    },

    getPerkA() { return this.perkAState || 0; },
    setPerkA(val) { this.perkAState = Number(val); },
    getPerkB() { return this.perkBState || 0; },
    setPerkB(val) { this.perkBState = Number(val); },
    getPerkC() { return this.perkCState || 0; },
    setPerkC(val) { this.perkCState = Number(val); },

    maxHealth() {
        let hp = 120;
        if (this.getPerkB() == 1) hp *= 6.0;
        if (this.getPerkB() == 3) hp *= 0.5;
        return hp;
    },

    range() {
        let baseR = 350;
        let perkA = this.getPerkA();
        let perkB = this.getPerkB();

        if (perkA == 1) baseR *= 1.5;
        if (perkA == 3) baseR *= 1.2;
        if (perkB == 1) baseR *= 0.8;
        if (perkB == 2) baseR *= 3.6;
        return baseR;
    },

    findTarget() {
        if (this.getPerkB() == 1) {
            let r = this.range();
            let highestHpTarget = null;
            let maxHp = -1;

            Units.nearbyEnemies(this.team, this.x - r, this.y - r, r * 2, r * 2, cons(e => {
                if (e.within(this.x, this.y, r) && e.health > maxHp) {
                    maxHp = e.health;
                    highestHpTarget = e;
                }
            }));

            if (highestHpTarget != null) {
                this.target = highestHpTarget;
                return;
            }
        }
        this.super$findTarget();
    },

    handleMaxitonerHit(bullet, target) {
        if (target == null || !(target instanceof Unit)) return;

        let perkB = this.getPerkB();
        let perkC = this.getPerkC();

        if (perkC == 3) {
            Damage.damage(this.team, target.x, target.y, 100, 500, false, true);
            nitouiExplodeFx.at(target.x, target.y, 100);
        }

        let addStacks = 1;
        if (perkB == 2) addStacks += 3;

        this.addNitouiStack(target, addStacks);
    },

    addNitouiStack(target, amount) {
        let perkA = this.getPerkA();
        let perkB = this.getPerkB();
        let perkC = this.getPerkC();

        let reqStacks = (perkB == 3) ? 7 : 9;

        let data = nitouiMap.get(target);
        if (data == null) {
            data = { count: 0 };
            nitouiMap.put(target, data);
        }

        data.count += amount;
        target.apply(nitouiStatus, 60);

        if (data.count >= reqStacks) {
            nitouiMap.remove(target);

            let currentBaseDmg = 10;
            if (perkB == 3) currentBaseDmg *= 25.0;
            if (perkC == 3) currentBaseDmg *= 6.0;

            // SÁT THƯƠNG NỔ = 4200% SÁT THƯƠNG GỐC CỦA PHÁO
            let explosionDmg = currentBaseDmg * 42.0;

            if (perkA == 1) explosionDmg *= 2.5;
            if (perkA == 3) explosionDmg *= 1.2;

            let explosionRadius = 100;
            if (perkC == 2) explosionRadius *= 2.0;

            Damage.damage(this.team, target.x, target.y, explosionRadius, explosionDmg, false, true);
            nitouiExplodeFx.at(target.x, target.y, explosionRadius);

            if (perkA == 2) {
                let tankiest = null;
                let maxHp = -1;
                Units.nearbyEnemies(this.team, target.x - explosionRadius, target.y - explosionRadius, explosionRadius * 2, explosionRadius * 2, cons(e => {
                    if (e != target && e.within(target.x, target.y, explosionRadius) && e.health > maxHp) {
                        maxHp = e.health;
                        tankiest = e;
                    }
                }));
                if (tankiest != null) {
                    this.addNitouiStack(tankiest, 7);
                }
            }

            if (perkA == 3) {
                for (let i = 0; i < 9; i++) {
                    let angle = Mathf.random(360);
                    Lightning.create(this.team, EXPLODE_COLOR, 50, target.x, target.y, angle, 10);
                }
            }

            if (perkC == 2) {
                Units.nearbyEnemies(this.team, target.x - explosionRadius, target.y - explosionRadius, explosionRadius * 2, explosionRadius * 2, cons(e => {
                    if (e != target && e.within(target.x, target.y, explosionRadius)) {
                        let subData = nitouiMap.get(e) || { count: 0 };
                        subData.count += 2;
                        if (subData.count >= 9) {
                            Damage.damage(this.team, e.x, e.y, explosionRadius, explosionDmg, false, true);
                            nitouiExplodeFx.at(e.x, e.y, explosionRadius);
                            nitouiMap.remove(e);
                        } else {
                            nitouiMap.put(e, subData);
                        }
                    }
                }));
            }
        }
    },

    spawnBullet(angleOffset, extraDmgMult, pierce, homing, isExtraBullet) {
        let curRange = this.range();
        let bulletSpeed = 7.0;
        let calculatedLifetime = curRange / bulletSpeed;

        let perkB = this.getPerkB();
        let perkC = this.getPerkC();

        let baseDmg = 10;
        if (perkB == 3) baseDmg *= 25.0;
        if (perkC == 3) baseDmg *= 6.0;

        let b = maxitonerBulletBase.create(this, this.team, this.x, this.y, this.rotation + angleOffset);
        if (b != null) {
            b.vel.setLength(bulletSpeed);
            b.lifetime = calculatedLifetime;
            b.damage = baseDmg * extraDmgMult;

            if (pierce) {
                b.type.pierce = true;
                b.type.pierceCap = 20;
            }
            if (homing) {
                b.type.homingPower = 0.08;
                b.type.homingRange = 150;
            }

            if (isExtraBullet) {
                maxitonerShootFxSmall.at(this.x, this.y);
            }
        }
    },

    shoot(type) {
        if (!this.hasAmmo()) return;

        maxitonerShootFx.at(this.x, this.y);

        let perkB = this.getPerkB();
        let perkC = this.getPerkC();

        let extraBullets = 0;
        if (perkB == 3) extraBullets += 2;
        if (perkC == 1) extraBullets += 5;

        let totalBullets = 1 + extraBullets;
        let spread = totalBullets > 1 ? 10.0 : 0.0;

        let is3C = (perkC == 3);
        this.spawnBullet(0, 1.0, is3C, is3C, false);

        for (let i = 1; i < totalBullets; i++) {
            let angle = Mathf.range(spread);
            this.spawnBullet(angle, 1.0, is3C, is3C, true);
        }
    },

    updateTile() {
        this.super$updateTile();

        let perkA = this.getPerkA();
        let perkB = this.getPerkB();
        let perkC = this.getPerkC();

        if (perkC == 1 && this.isShooting && this.hasAmmo()) {
            this.autoFireTimer += Time.delta;
            if (this.autoFireTimer >= 60) {
                this.autoFireTimer = 0;
                for (let i = 0; i < 3; i++) {
                    this.spawnBullet(Mathf.range(4.0), 1.0, false, false, true);
                }
            }
        }

        let reloadMult = 1.0;
        if (perkA == 2) reloadMult += 0.80;
        if (perkA == 3) reloadMult += 0.20;
        if (perkB == 1) reloadMult += 1.20;
        if (perkB == 2) reloadMult -= 0.50;

        this.reloadTime = 48 / Math.max(0.1, reloadMult);
    },

    buildConfiguration(table) {
        table.clear();
        table.row();

        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Maxitoner", {});

            let reqCell = dialog.cont.label(packProv(() => {
                let core = this.team.core();
                if (core == null) return "[red]Không tìm thấy Lõi Đội![]";

                let cCop = core.items.get(Items.copper);
                let cLea = core.items.get(Items.lead);
                let cSil = core.items.get(Items.silicon);
                let cTit = core.items.get(Items.titanium);
                let cTho = core.items.get(Items.thorium);
                let cSur = core.items.get(Items.surgeAlloy);
                let cPha = core.items.get(Items.phaseFabric);

                let colCopA = cCop >= reqPerkA.copper ? "[green]" : "[red]";
                let colLeaA = cLea >= reqPerkA.lead ? "[green]" : "[red]";
                let colSilA = cSil >= reqPerkA.silicon ? "[green]" : "[red]";

                let colTitB = cTit >= reqPerkB.titanium ? "[green]" : "[red]";
                let colThoB = cTho >= reqPerkB.thorium ? "[green]" : "[red]";
                let colSilB = cSil >= reqPerkB.silicon ? "[green]" : "[red]";

                let colSurC = cSur >= reqPerkC.surgeAlloy ? "[green]" : "[red]";
                let colPhaC = cPha >= reqPerkC.phaseFabric ? "[green]" : "[red]";
                let colSilC = cSil >= reqPerkC.silicon ? "[green]" : "[red]";

                return "[gold]YÊU CẦU TÀI NGUYÊN LÕI (MAXITONER):[]\n" +
                       "[yellow]★ ROLL PHÚC LỢI A:[] Đồng: " + colCopA + cCop + "[]/1500 | Chì: " + colLeaA + cLea + "[]/1500 | Silicon: " + colSilA + cSil + "[]/1500\n" +
                       "[cyan]★ ROLL PHÚC LỢI B:[] Titan: " + colTitB + cTit + "[]/1500 | Thorium: " + colThoB + cTho + "[]/1500 | Silicon: " + colSilB + cSil + "[]/1500\n" +
                       "[purple]★ ROLL PHÚC LỢI C:[] Surge: " + colSurC + cSur + "[]/500 | Phase: " + colPhaC + cPha + "[]/500 | Silicon: " + colSilC + cSil + "[]/2000";
            }));

            reqCell.width(380).get().setWrap(true);
            reqCell.get().setAlignment(Align.left);
            dialog.cont.row();
            dialog.cont.add().height(10).row();

            let mainTable = new Table();

            // BOX PHÚC LỢI A
            let boxA = new Table(); boxA.background(Styles.black6); boxA.margin(12);
            boxA.add("[yellow]★ ROLL PHÚC LỢI A (NGẪU NHIÊN) ★[]").row();

            let perkA = this.getPerkA();
            if (perkA == 0) {
                let txtADesc = boxA.add("Kích hoạt nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi A:\n" +
                                        " • [yellow]Phúc lợi 1A (50%):[] Tầm bắn +50%, Sát thương nổ Nitoui +150%.\n" +
                                        " • [yellow]Phúc lợi 2A (30%):[] Tốc bắn +80%, Nổ Nitoui ngẫu nhiên gắn 7 tầng cho trâu nhất.\n" +
                                        " • [yellow]Phúc lợi 3A (20%):[] Tầm bắn +20%, Tốc bắn +20%, Dmg nổ +20%, Bắn 9 tia laze khi nổ.");
                txtADesc.width(340).get().setWrap(true);
                txtADesc.get().setAlignment(Align.left);
                boxA.row();

                boxA.button("[yellow]QUAY PHÚC LỢI A (1.5K Đồng/Chì/Silicon)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.copper) >= reqPerkA.copper && core.items.get(Items.lead) >= reqPerkA.lead && core.items.get(Items.silicon) >= reqPerkA.silicon) {
                        core.items.remove(Items.copper, reqPerkA.copper);
                        core.items.remove(Items.lead, reqPerkA.lead);
                        core.items.remove(Items.silicon, reqPerkA.silicon);

                        let chance = Mathf.random(100);
                        let res = chance < 50 ? 1 : (chance < 80 ? 2 : 3);
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
                if (perkA == 1) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1A\n• Tầm bắn +50% (525px)\n• Sát thương nổ Nitoui +150%[]";
                if (perkA == 2) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2A\n• Tốc độ bắn +80%\n• Vụ nổ Nitoui lây 7 tầng cho kẻ địch trâu nhất gần đó[]";
                if (perkA == 3) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3A\n• Tầm bắn +20%, Tốc bắn +20%, Dmg nổ +20%\n• Vụ nổ Nitoui phóng thêm 9 tia laze (50 Dmg)[]";

                let txtACell = boxA.add(txtA);
                txtACell.width(340).get().setWrap(true);
                txtACell.get().setAlignment(Align.left);
            }
            mainTable.add(boxA).width(360).row();
            mainTable.add().height(12).row();

            // BOX PHÚC LỢI B
            let boxB = new Table(); boxB.background(Styles.black6); boxB.margin(12);
            boxB.add("[cyan]★ ROLL PHÚC LỢI B (NGẪU NHIÊN) ★[]").row();

            let perkB = this.getPerkB();
            if (perkB == 0) {
                let txtBDesc = boxB.add("Kích hoạt nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi B:\n" +
                                        " • [cyan]Phúc lợi 1B (50%):[] Tốc bắn +120%, Máu +500%, Tầm bắn -20%, Nhắm địch nhiều máu nhất.\n" +
                                        " • [cyan]Phúc lợi 2B (20%):[] Tầm bắn +260%, Tốc bắn -50%, Bắn trúng +3 tầng Nitoui.\n" +
                                        " • [cyan]Phúc lợi 3B (10%):[] Tốc bắn giảm, Máu -50%, Sát thương gốc +2400%, Bắn thêm 2 đạn, Mốc nổ giảm xuống 7 tầng.");
                txtBDesc.width(340).get().setWrap(true);
                txtBDesc.get().setAlignment(Align.left);
                boxB.row();

                boxB.button("[cyan]QUAY PHÚC LỢI B (1.5K Titan/Thorium/Silicon)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.titanium) >= reqPerkB.titanium && core.items.get(Items.thorium) >= reqPerkB.thorium && core.items.get(Items.silicon) >= reqPerkB.silicon) {
                        core.items.remove(Items.titanium, reqPerkB.titanium);
                        core.items.remove(Items.thorium, reqPerkB.thorium);
                        core.items.remove(Items.silicon, reqPerkB.silicon);

                        let chance = Mathf.random(100);
                        let res = chance < 50 ? 1 : (chance < 70 ? 2 : 3);
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
                if (perkB == 1) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1B\n• Tốc bắn +120%, Máu +500% (720 HP), Tầm bắn -20%\n• Khóa mục tiêu nhiều máu nhất[]";
                if (perkB == 2) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2B\n• Tầm bắn +260% (1260px), Tốc bắn -50%\n• Đạn trúng mục tiêu gắn ngay +3 tầng Nitoui[]";
                if (perkB == 3) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3B\n• Sát thương gốc +2400% (250 Dmg), Bắn +2 đạn phụ\n• Máu -50% (60 HP), Giảm mốc nổ Nitoui xuống 7 tầng[]";

                let txtBCell = boxB.add(txtB);
                txtBCell.width(340).get().setWrap(true);
                txtBCell.get().setAlignment(Align.left);
            }
            mainTable.add(boxB).width(360).row();
            mainTable.add().height(12).row();

            // BOX PHÚC LỢI C
            let boxC = new Table(); boxC.background(Styles.black6); boxC.margin(12);
            boxC.add("[purple]★ ROLL PHÚC LỢI C (NGẪU NHIÊN) ★[]").row();

            let perkC = this.getPerkC();
            if (perkC == 0) {
                let txtCDesc = boxC.add("Kích hoạt nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi C:\n" +
                                        " • [purple]Phúc lợi 1C (98%):[] Bắn thêm +5 đạn phụ, mỗi 1s tự động bắn thêm 3 đạn.\n" +
                                        " • [purple]Phúc lợi 2C (1%):[] Phạm vi nổ Nitoui +100% (200px), lây +2 tầng cho kẻ địch xung quanh.\n" +
                                        " • [purple]Phúc lợi 3C (1%):[] Đạn gốc +500% Dmg, xuyên 20 mục tiêu, đuổi địch, kích nổ 500 Dmg khi trúng.");
                txtCDesc.width(340).get().setWrap(true);
                txtCDesc.get().setAlignment(Align.left);
                boxC.row();

                boxC.button("[purple]QUAY PHÚC LỢI C (500 Surge/Phase, 2K Silicon)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.surgeAlloy) >= reqPerkC.surgeAlloy && core.items.get(Items.phaseFabric) >= reqPerkC.phaseFabric && core.items.get(Items.silicon) >= reqPerkC.silicon) {
                        core.items.remove(Items.surgeAlloy, reqPerkC.surgeAlloy);
                        core.items.remove(Items.phaseFabric, reqPerkC.phaseFabric);
                        core.items.remove(Items.silicon, reqPerkC.silicon);

                        let chance = Mathf.random(100);
                        let res = chance < 98 ? 1 : (chance < 99 ? 2 : 3);
                        this.setPerkC(res);
                        this.configure(30 + res);

                        Fx.upgradeCore.at(this.x, this.y);
                        Effect.shake(4, 4, this.x, this.y);
                        Vars.ui.showInfo("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[purple]PHÚC LỢI " + res + "C[]");
                        dialog.hide();
                        this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên roll Phúc lợi C![]");
                    }
                })).size(280, 40);
            } else {
                let txtC = "";
                if (perkC == 1) txtC = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1C\n• Bắn thêm +5 đạn phụ\n• Mỗi 1 giây tự động xả thêm 3 viên đạn phụ[]";
                if (perkC == 2) txtC = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2C\n• Phạm vi nổ Nitoui +100% (200px)\n• Nổ Nitoui lây ngay 2 tầng cho kẻ địch trong phạm vi[]";
                if (perkC == 3) txtC = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3C\n• Đạn gốc +500% Sát thương (60 Dmg), Xuyên 20 mục tiêu, Truy đuổi\n• Đạn trúng mục tiêu gây nổ 500 Dmg (Bán kính 100px)[]";

                let txtCCell = boxC.add(txtC);
                txtCCell.width(340).get().setWrap(true);
                txtCCell.get().setAlignment(Align.left);
            }
            mainTable.add(boxC).width(360);

            let scroll = new ScrollPane(mainTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton();
            dialog.show();
        })).size(50, 40).tooltip("Trung tâm nâng cấp pháo Maxitoner");

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Maxitoner ";
            
            let descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN PHÁO MAXITONER ⚡[]\n" +
                          "• Máu: 120 HP | Tầm bắn: 350px (43.7 ô) | Sát thương đạn: 10.0\n" +
                          "• Cơ chế: Bắn tích tầng hiệu ứng Nitoui lên mục tiêu. Đủ 9 tầng gây nổ diện rộng bằng 4200% Dmg gốc của pháo (Bán kính 100px).\n" +
                          "• Nâng cấp: Tối đa 3 nhóm Phúc lợi độc lập A, B, C nâng cấp đa dạng chiến thuật.";

            let perkA = this.getPerkA();
            let perkB = this.getPerkB();
            let perkC = this.getPerkC();

            if (perkA > 0) {
                descStr += "\n\n[yellow]★ ĐÃ KÍCH HOẠT PHÚC LỢI A ★[]";
                if (perkA == 1) descStr += "\n[green]• Phúc lợi 1A: Tầm bắn +50% (525px), Dmg nổ Nitoui +150%.[]";
                if (perkA == 2) descStr += "\n[green]• Phúc lợi 2A: Tốc bắn +80%, Nổ Nitoui ngẫu nhiên lây 7 tầng cho kẻ địch trâu nhất.[]";
                if (perkA == 3) descStr += "\n[green]• Phúc lợi 3A: Tầm bắn +20%, Tốc bắn +20%, Dmg nổ +20%, Nổ Nitoui bắn 9 tia laze.[]";
            }

            if (perkB > 0) {
                descStr += "\n\n[cyan]★ ĐÃ KÍCH HOẠT PHÚC LỢI B ★[]";
                if (perkB == 1) descStr += "\n[green]• Phúc lợi 1B: Tốc bắn +120%, Máu +500% (720 HP), Tầm bắn -20%, Nhắm địch trâu nhất.[]";
                if (perkB == 2) descStr += "\n[green]• Phúc lợi 2B: Tầm bắn +260% (1260px), Tốc bắn -50%, Bắn trúng +3 tầng Nitoui.[]";
                if (perkB == 3) descStr += "\n[green]• Phúc lợi 3B: Sát thương gốc +2400%, Bắn thêm 2 đạn, Máu -50%, Mốc nổ giảm còn 7 tầng.[]";
            }

            if (perkC > 0) {
                descStr += "\n\n[purple]★ ĐÃ KÍCH HOẠT PHÚC LỢI C ★[]";
                if (perkC == 1) descStr += "\n[green]• Phúc lợi 1C: Bắn thêm +5 đạn, mỗi 1s tự bắn thêm 3 đạn phụ.[]";
                if (perkC == 2) descStr += "\n[green]• Phúc lợi 2C: Phạm vi nổ Nitoui +100% (200px), lây 2 tầng cho kẻ địch xung quanh.[]";
                if (perkC == 3) descStr += "\n[green]• Phúc lợi 3C: Đạn gốc +500% Dmg (60 Dmg), Xuyên 20 mục tiêu, Đuổi địch, Nổ 500 Dmg khi trúng.[]";
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
        })).size(50, 40).tooltip("Xem thông số pháo Maxitoner");
    },

    write(write) {
        this.super$write(write);
        write.b(this.getPerkA());
        write.b(this.getPerkB());
        write.b(this.getPerkC());
    },

    read(read, revision) {
        this.super$read(read, revision);
        this.setPerkA(read.b());
        this.setPerkB(read.b());
        this.setPerkC(read.b());
    }
});

// ==================== 3. HIỂN THỊ HP UNIT (SMOOTH HP BAR) ====================
const smoothHpMap = new ObjectMap();
const lastDamageTimeMap = new ObjectMap(); 

Events.on(ClientLoadEvent, () => {
    Vars.ui.settings.game.checkPref("show-unit-hp", true);
});

Events.run(Trigger.draw, () => {
    if(!Core.settings.getBool("show-unit-hp", true)) return;

    Groups.unit.each(u => {
        if(u == null || u.dead || !u.isAdded()) return;

        let lastHp = lastDamageTimeMap.get(u.id + "_hp") || u.maxHealth;
        
        if (u.health < lastHp) {
            lastDamageTimeMap.put(u.id + "_time", Time.time);
        }
        lastDamageTimeMap.put(u.id + "_hp", u.health);

        let lastDmgTime = lastDamageTimeMap.get(u.id + "_time") || -999;
        if (Time.time - lastDmgTime > 120) return; 

        let realHp = (u.health / u.maxHealth) * 100;
        let smoothHp = smoothHpMap.get(u.id) || realHp;
        smoothHp = Mathf.lerpDelta(smoothHp, realHp, 0.08);
        smoothHpMap.put(u.id, smoothHp);

        let hpPercent = Math.floor(smoothHp);
        if(hpPercent >= 100) return;

        let x = u.x;
        let y = u.y + (u.hitSize / 2) + 4;
        let hpColor = hpPercent < 20 ? Color.red : (hpPercent < 50 ? Color.yellow : Color.green);

        Draw.z(115);
        let font = Fonts.outline;
        let oldX = font.getData().scaleX;
        let oldY = font.getData().scaleY;

        font.getData().setScale(0.11 * (u.hitSize / 8));
        font.setColor(hpColor);
        font.draw(hpPercent + "%", x, y, Align.center);

        let barWidth = 4;
        let barHeight = 22;

        Draw.color(Color.valueOf("1f1f1f"));
        Fill.rect(x - 12, y - 8, barWidth, barHeight);

        if(hpPercent <= 20){
            Draw.alpha(0.5 + Mathf.absin(Time.time, 6, 0.5));
        }

        Draw.color(hpColor);
        let hpHeight = (barHeight - 2) * (smoothHp / 100);
        Fill.rect(x - 12, y - 18 + hpHeight / 2, barWidth - 1, hpHeight);

        Draw.alpha(0.18);
        Draw.color(Color.white);
        Fill.rect(x - 11.3, y - 18 + hpHeight / 2, 0.6, hpHeight);

        font.getData().setScale(oldX, oldY);
        Draw.reset();
    });
});