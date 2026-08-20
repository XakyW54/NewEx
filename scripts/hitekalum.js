print("HITEKALUM SYSTEM INITIALIZED - EVENT-BASED PERK SYSTEM READY");

const hitekalumColor = Color.valueOf("#ff1a1a");
const lightningColor = Color.valueOf("#ff3333");
const subLightningColor = Color.valueOf("#ff9999");

// --- EFFECT VẼ HIỆU ỨNG ---
const arcmotLightningEffect = new Effect(14, e => {
    if(!(e.data instanceof Seq)) return;
    const points = e.data;
    let thickness = e.rotation > 0 ? e.rotation : 2.8;
    Draw.color(lightningColor, Color.white, e.fin());
    Lines.stroke(thickness * e.fout());
    for(let i = 0; i < points.size - 1; i++){
        let a = points.get(i);
        let b = points.get(i + 1);
        Lines.line(a.x, a.y, b.x, b.y, false);
    }
});

const microLightningEffect = new Effect(8, e => {
    if(!(e.data instanceof Seq)) return;
    const points = e.data;
    Draw.color(subLightningColor, Color.white, e.fin());
    Lines.stroke(1.0 * e.fout());
    for(let i = 0; i < points.size - 1; i++){
        let a = points.get(i);
        let b = points.get(i + 1);
        Lines.line(a.x, a.y, b.x, b.y, false);
    }
});

const sonicShockwaveEffect = new Effect(45, e => {
    Draw.color(lightningColor);
    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 32);
    Draw.alpha(e.fout() * 0.4);
    Fill.circle(e.x, e.y, e.fin() * 20);
    Draw.reset();
});

const mk3ExplosionFX = new Effect(30, e => {
    Draw.color(hitekalumColor, Color.white, e.fin());
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 45); 
    Angles.randLenVectors(e.id, 20, 45 * e.fin(), (x, y) => {
        Fill.circle(e.x + x, y + y, 3.5 * e.fout());
    });
    Draw.reset();
});

const laserBeamEffect = new Effect(15, e => {
    if(!e.data || typeof e.data.tx === "undefined") return;
    Draw.color(hitekalumColor, Color.white, e.fin());
    Lines.stroke(4.0 * e.fout());
    Lines.line(e.x, e.y, e.data.tx, e.data.ty);
    Fill.circle(e.data.tx, e.data.ty, 6.0 * e.fout());
    Draw.reset();
});

function createLightningStandard(x1, y1, x2, y2, thickness, isMicro){
    let dst = Mathf.dst(x1, y1, x2, y2);
    let segs = Math.max(4, Math.floor(dst / 7));
    let points = new Seq();
    points.add(new Vec2(x1, y1));
    let angle = Angles.angle(x1, y1, x2, y2);

    for(let i = 1; i < segs; i++){
        let t = i / segs;
        let px = Mathf.lerp(x1, x2, t);
        let py = Mathf.lerp(y1, y2, t);
        let jitter = isMicro ? 4 : 10;   
        let noise = Mathf.range(jitter) * (1 - t);

        Tmp.v1.trns(angle + 90, noise);
        points.add(new Vec2(px + Tmp.v1.x, py + Tmp.v1.y));
    }
    points.add(new Vec2(x2, y2));
    
    if(isMicro){
        microLightningEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
    } else {
        arcmotLightningEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
    }
}

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// --- ĐÃ ĐỔI SILICON THÀNH OBSIDIS VÀ GIẢM GIÁ 50% CHO OBSIDIS ---
const reqPerkHitekA = { copper: 1000, lead: 1000, obsidis: 375 };
const reqPerkHitekB = { titanium: 1000, thorium: 500, obsidis: 500 };
const reqPerkHitekC = { surgeAlloy: 400, phaseFabric: 400, obsidis: 625 };

const hitekalumBulletSystem = extend(BulletType, {
    init(b){ if(b) b.remove(); },
    draw(b){}
});
hitekalumBulletSystem.speed = 0;
hitekalumBulletSystem.lifetime = 1;
hitekalumBulletSystem.collides = false;

let hitekalumBlock = null;

Events.on(ContentInitEvent, () => {
    hitekalumBlock = Vars.content.getByName(ContentType.block, "newex-hitekalum");

    if(hitekalumBlock != null){
        hitekalumBlock.shootType = hitekalumBulletSystem;
        hitekalumBlock.configurable = true;

        hitekalumBlock.config(java.lang.Integer, packCons2((tile, value) => {
            if(tile != null && tile.setPerkData !== undefined) {
                tile.setPerkData(value);
            }
        }));

        hitekalumBlock.buildType = () => extend(PowerTurret.PowerTurretBuild, hitekalumBlock, {
            created(){
                this.super$created();
                this.perkTier1 = 0;
                this.perkTier2 = 0;
                this.perkCState = 0;
                this.laserTimer = 0.0;
                this.executedTargets = new ObjectSet();
                return this;
            },

            getPerkA() { return Math.round(this.perkTier1 || 0); },
            setPerkA(val) { this.perkTier1 = Math.round(val); this.applyStatsFromPerk(); },
            getPerkB() { return Math.round(this.perkTier2 || 0); },
            setPerkB(val) { this.perkTier2 = Math.round(val); this.applyStatsFromPerk(); },
            getPerkC() { return Math.round(this.perkCState || 0); },
            setPerkC(val) { this.perkCState = Math.round(val); this.applyStatsFromPerk(); },

            applyStatsFromPerk(){
                let mult = 1.0;
                if(this.getPerkB() == 1) mult += 2.0;
                if(this.getPerkC() == 3) mult += 0.10;
                if(this.getPerkC() == 4) mult += 1.0;

                this.healthMultiplier = mult;
            },

            setPerkData(val){
                let code = Math.round(Number(val));
                if (code >= 30) {
                    this.perkCState = code - 30;
                } else if (code >= 20) {
                    this.perkTier2 = code - 20;
                } else if (code >= 10) {
                    this.perkTier1 = code - 10;
                }
                this.applyStatsFromPerk();
            },

            config() { 
                return java.lang.Integer(this.getPerkA() * 100 + this.getPerkB() * 10 + this.getPerkC()); 
            },

            range(){
                let baseR = 320;
                let rangeMult = 1.0;

                if(this.getPerkA() == 1) rangeMult += 0.40; 
                if(this.getPerkC() == 3) rangeMult += 0.10; 
                if(this.getPerkC() == 4) rangeMult += 1.0; 

                return baseR * rangeMult;
            },

            getRawDamage(){
                let baseDmg = 120;
                let dmgMult = 1.0;

                if(this.getPerkA() == 3) dmgMult += 0.30; 
                if(this.getPerkC() == 3) dmgMult += 0.10; 
                if(this.getPerkC() == 4) dmgMult += 1.0; 

                let finalDmg = baseDmg * Math.max(0.1, dmgMult);

                let critChance = 0.05;
                let critDmgMult = 1.50;

                if(this.getPerkC() == 1) { critChance += 0.10; critDmgMult += 1.50; } 
                if(this.getPerkC() == 3) { critChance += 0.20; critDmgMult += 0.50; } 

                if(Mathf.chance(critChance)) {
                    finalDmg *= critDmgMult;
                }

                return finalDmg;
            },

            collision(other) {
                this.super$collision(other);
                if (this.getPerkB() == 1 && other != null && other.team != this.team) {
                    if (typeof other.damage === "function") {
                        other.damage(this.maxHealth * 0.15);
                        Fx.spark.at(other.x, other.y);
                    }
                }
            },

            applyHitekalumDamage(targetUnit, baseDamage){
                if(targetUnit == null || targetUnit.dead) return;

                let finalDmg = baseDamage;
                let statusElectrified = Vars.content.getByName(ContentType.status, "electrified") || StatusEffects.shocked;

                if(targetUnit.hasEffect(statusElectrified)){
                    let mult = (this.getPerkA() == 2) ? 4.0 : 2.0;
                    finalDmg *= mult;
                }

                if(targetUnit.armor !== undefined && targetUnit.armor > 0){
                    targetUnit.armor = Math.max(0, targetUnit.armor * 0.95);
                }

                targetUnit.damage(finalDmg);

                if(this.getPerkC() == 2) {
                    targetUnit.apply(statusElectrified, 60 * 5);

                    let slowRange = 50;
                    Units.nearbyEnemies(this.team, targetUnit.x - slowRange, targetUnit.y - slowRange, slowRange * 2, slowRange * 2, u => {
                        if(!u.dead && targetUnit.dst(u) <= slowRange) {
                            u.apply(StatusEffects.slow, 60 * 3);
                        }
                    });
                }
            },

            shoot(type){
                let target = this.target;
                if(target == null || target.dead) return;

                let currentDmg = this.getRawDamage();

                createLightningStandard(this.x, this.y, target.x, target.y, 3.2, false);
                sonicShockwaveEffect.at(target.x, target.y);
                mk3ExplosionFX.at(target.x, target.y);
                Effect.shake(3, 3, target.x, target.y);

                this.applyHitekalumDamage(target, currentDmg);

                if(this.getPerkA() == 1){
                    let subTarget = Units.closestEnemy(this.team, target.x, target.y, 120, u => !u.dead && u != target);
                    if(subTarget != null){
                        createLightningStandard(target.x, target.y, subTarget.x, subTarget.y, 2.0, false);
                        this.applyHitekalumDamage(subTarget, currentDmg * 0.8);
                    }
                }

                if(this.getPerkB() == 2){
                    let rangeVal = this.range();
                    let list = new Seq();
                    
                    Units.nearbyEnemies(this.team, this.x - rangeVal, this.y - rangeVal, rangeVal * 2, rangeVal * 2, u => {
                        if(!u.dead && this.dst(u) <= rangeVal){
                            list.add(u);
                        }
                    });

                    list.sort(new Floatf({ get: u => -u.maxHealth }));

                    let count = 0;
                    for(let i = 0; i < list.size; i++){
                        if(count >= 3) break;
                        let tankyUnit = list.get(i);
                        
                        createLightningStandard(this.x, this.y, tankyUnit.x, tankyUnit.y, 2.5, true);
                        let subDmg = (currentDmg * 0.20) + (tankyUnit.maxHealth * 0.01);
                        this.applyHitekalumDamage(tankyUnit, subDmg);
                        count++;
                    }
                }
            },

            updateTile(){
                this.super$updateTile();

                if(this.power == null || this.power.status <= 0) return;

                if(this.getPerkB() == 3 && this.reloadCounter > 0){
                    this.reloadCounter += Time.delta * 1.0; 
                }

                let target = this.target;
                let isTargetValid = (target != null && !target.dead);
                let currentRange = this.range();

                if(this.getPerkB() == 3 && isTargetValid && this.isShooting){
                    this.laserTimer += Time.delta;
                    if(this.laserTimer >= 90){
                        this.laserTimer = 0;
                        let laserDmg = this.getRawDamage() * 1.50;
                        laserBeamEffect.at(this.x, this.y, 0, { tx: target.x, ty: target.y });
                        this.applyHitekalumDamage(target, laserDmg);
                        Effect.shake(4, 4, target.x, target.y);
                    }
                }

                Units.nearbyEnemies(this.team, this.x - currentRange, this.y - currentRange, currentRange * 2, currentRange * 2, u => {
                    if(!u.dead && this.dst(u) <= currentRange && (u.health / u.maxHealth) < 0.05){
                        if(!this.executedTargets.contains(u.id)){
                            this.executedTargets.add(u.id);

                            if(this.getPerkC() == 4) {
                                createLightningStandard(this.x, this.y, u.x, u.y, 6.0, false);
                                laserBeamEffect.at(this.x, this.y, 0, { tx: u.x, ty: u.y });
                                let execDmg = (120 * 50.0) + (u.maxHealth * 0.05);
                                u.damage(execDmg);
                            } else {
                                createLightningStandard(this.x, this.y, u.x, u.y, 5.0, false);
                                u.damage((120 * 10.0) + (u.maxHealth * 0.05));
                            }

                            mk3ExplosionFX.at(u.x, u.y);
                            Effect.shake(6, 6, u.x, u.y);
                        }
                    }
                });
            },

            buildConfiguration(table) {
                table.clear();
                table.row();

                table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                    let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Hitekalum", {});

                    let reqCell = dialog.cont.label(packProv(() => {
                        let core = this.team.core();
                        if (core == null) return "[red]Không tìm thấy Lõi Đội![]";

                        let itemObsidis = Vars.content.getByName(ContentType.item, "newex-obsidis");

                        let cCop = core.items.get(Items.copper);
                        let cLea = core.items.get(Items.lead);
                        let cObs = itemObsidis ? core.items.get(itemObsidis) : 0;
                        let cTit = core.items.get(Items.titanium);
                        let cTho = core.items.get(Items.thorium);
                        let cSur = core.items.get(Items.surgeAlloy);
                        let cPha = core.items.get(Items.phaseFabric);

                        let colCopA = cCop >= reqPerkHitekA.copper ? "[green]" : "[red]";
                        let colLeaA = cLea >= reqPerkHitekA.lead ? "[green]" : "[red]";
                        let colObsA = cObs >= reqPerkHitekA.obsidis ? "[green]" : "[red]";

                        let colTitB = cTit >= reqPerkHitekB.titanium ? "[green]" : "[red]";
                        let colThoB = cTho >= reqPerkHitekB.thorium ? "[green]" : "[red]";
                        let colObsB = cObs >= reqPerkHitekB.obsidis ? "[green]" : "[red]";

                        let colSurC = cSur >= reqPerkHitekC.surgeAlloy ? "[green]" : "[red]";
                        let colPhaC = cPha >= reqPerkHitekC.phaseFabric ? "[green]" : "[red]";
                        let colObsC = cObs >= reqPerkHitekC.obsidis ? "[green]" : "[red]";

                        return "[gold]YÊU CẦU TÀI NGUYÊN LÕI (HITEKALUM):[]\n" +
                               "[yellow]★ ROLL PHÚC LỢI A:[] Đồng: " + colCopA + cCop + "[]/1000 | Chì: " + colLeaA + cLea + "[]/1000 | Obsidis: " + colObsA + cObs + "[]/375\n" +
                               "[cyan]★ ROLL PHÚC LỢI B:[] Titan: " + colTitB + cTit + "[]/1000 | Thorium: " + colThoB + cTho + "[]/500 | Obsidis: " + colObsB + cObs + "[]/500\n" +
                               "[purple]★ ROLL PHÚC LỢI C:[] Surge: " + colSurC + cSur + "[]/400 | Phase: " + colPhaC + cPha + "[]/400 | Obsidis: " + colObsC + cObs + "[]/625";
                    }));

                    reqCell.width(380).get().setWrap(true);
                    reqCell.get().setAlignment(Align.left);
                    dialog.cont.row();
                    dialog.cont.add().height(10).row();

                    let mainTable = new Table();

                    let boxA = new Table(); boxA.background(Styles.black6); boxA.margin(12);
                    boxA.add("[yellow]★ ROLL PHÚC LỢI A (NGẪU NHIÊN) ★[]").row();

                    let perkA = this.getPerkA();
                    if (perkA == 0) {
                        let txtADesc = boxA.add("Kích hoạt nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi A:\n" +
                                                " • [yellow]Phúc lợi 1A:[] Tầm bắn +40%, đạn giật điện lây sang 1 mục tiêu.\n" +
                                                " • [yellow]Phúc lợi 2A:[] Tiết kiệm 50% điện năng, x4 Sát thương lên mục tiêu Nhiễm Điện.\n" +
                                                " • [yellow]Phúc lợi 3A:[] +30% Sát thương, gây dmg xuyên giáp 100%.");
                        txtADesc.width(340).get().setWrap(true);
                        txtADesc.get().setAlignment(Align.left);
                        boxA.row();

                        boxA.button("[yellow]QUAY PHÚC LỢI A[]", packRun(() => {
                            let core = this.team.core();
                            let itemObsidis = Vars.content.getByName(ContentType.item, "newex-obsidis");
                            if (core != null && itemObsidis != null && core.items.get(Items.copper) >= reqPerkHitekA.copper && core.items.get(Items.lead) >= reqPerkHitekA.lead && core.items.get(itemObsidis) >= reqPerkHitekA.obsidis) {
                                core.items.remove(Items.copper, reqPerkHitekA.copper);
                                core.items.remove(Items.lead, reqPerkHitekA.lead);
                                core.items.remove(itemObsidis, reqPerkHitekA.obsidis);

                                let res = Mathf.rand.nextInt(3) + 1; 
                                this.setPerkA(res);

                                Fx.upgradeCore.at(this.x, this.y);
                                Effect.shake(4, 4, this.x, this.y);

                                let descMapA = {
                                    1: "• Tầm bắn +40%\n• Đạn giật điện lây sang 1 mục tiêu gần đó.",
                                    2: "• Tiết kiệm 50% điện năng tiêu thụ.\n• Tăng sát thương gây ra lên mục tiêu bị Nhiễm Điện từ x2 -> x4.",
                                    3: "• +30% Sát thương gốc\n• Sát thương bỏ qua 100% giáp kẻ địch."
                                };

                                Vars.ui.showInfo("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[yellow]PHÚC LỢI " + res + "A[]\n\n[white]" + descMapA[res]);
                                dialog.hide();
                                this.deselect();
                            } else {
                                Vars.ui.showInfo("[red]Không đủ tài nguyên trong Lõi để roll Phúc lợi A![]");
                            }
                        })).size(280, 40);
                    } else {
                        let txtA = "";
                        if (perkA == 1) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1A\n• Tầm bắn +40%\n• Đạn giật điện lây sang 1 mục tiêu gần đó[]";
                        if (perkA == 2) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2A\n• Tiết kiệm 50% điện tiêu thụ\n• x4 Sát thương lên kẻ địch Nhiễm Điện[]";
                        if (perkA == 3) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3A\n• +30% Sát thương\n• Sát thương xuyên giáp 100%[]";

                        let txtACell = boxA.add(txtA);
                        txtACell.width(340).get().setWrap(true);
                        txtACell.get().setAlignment(Align.left);
                    }
                    mainTable.add(boxA).width(360).row();
                    mainTable.add().height(12).row();

                    let boxB = new Table(); boxB.background(Styles.black6); boxB.margin(12);
                    boxB.add("[cyan]★ ROLL PHÚC LỢI B (NGẪU NHIÊN) ★[]").row();

                    let perkB = this.getPerkB();
                    if (perkB == 0) {
                        let txtBDesc = boxB.add("Kích hoạt nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi B:\n" +
                                                " • [cyan]Phúc lợi 1B:[] +200% Máu pháo, phản 15% sát thương cận chiến.\n" +
                                                " • [cyan]Phúc lợi 2B:[] Bắn thêm 3 tia điện đến 3 mục tiêu trâu nhất (20% Dmg gốc + 1% Max HP).\n" +
                                                " • [cyan]Phúc lợi 3B:[] Tăng x2 tốc độ bắn tia điện, đòn laser 150% dmg mỗi 1.5s.");
                        txtBDesc.width(340).get().setWrap(true);
                        txtBDesc.get().setAlignment(Align.left);
                        boxB.row();

                        boxB.button("[cyan]QUAY PHÚC LỢI B[]", packRun(() => {
                            let core = this.team.core();
                            let itemObsidis = Vars.content.getByName(ContentType.item, "newex-obsidis");
                            if (core != null && itemObsidis != null && core.items.get(Items.titanium) >= reqPerkHitekB.titanium && core.items.get(Items.thorium) >= reqPerkHitekB.thorium && core.items.get(itemObsidis) >= reqPerkHitekB.obsidis) {
                                core.items.remove(Items.titanium, reqPerkHitekB.titanium);
                                core.items.remove(Items.thorium, reqPerkHitekB.thorium);
                                core.items.remove(itemObsidis, reqPerkHitekB.obsidis);

                                let res = Mathf.rand.nextInt(3) + 1; 
                                this.setPerkB(res);

                                Fx.upgradeCore.at(this.x, this.y);
                                Effect.shake(4, 4, this.x, this.y);

                                let descMapB = {
                                    1: "• Máu pháo +200%\n• Tạo khiên phản 15% sát thương cận chiến.",
                                    2: "• Bắn thêm 3 tia điện tới 3 kẻ địch có Máu lớn nhất\n• Sát thương: 20% Dmg gốc + 1% Max HP mục tiêu.",
                                    3: "• Tốc độ bắn tia điện chính: x2 (1s -> 0.5s/bắn)\n• Đòn đánh Laser phụ gây 150% Dmg mỗi 1.5 giây."
                                };

                                Vars.ui.showInfo("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[cyan]PHÚC LỢI " + res + "B[]\n\n[white]" + descMapB[res]);
                                dialog.hide();
                                this.deselect();
                            } else {
                                Vars.ui.showInfo("[red]Không đủ tài nguyên trong Lõi để roll Phúc lợi B![]");
                            }
                        })).size(280, 40);
                    } else {
                        let txtB = "";
                        if (perkB == 1) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1B\n• Máu +200%\n• Phản 15% sát thương cận chiến[]";
                        if (perkB == 2) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2B\n• Bắn 3 tia điện tới 3 mục tiêu trâu nhất\n• Gây 20% Dmg gốc + 1% Max HP[]";
                        if (perkB == 3) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3B\n• Tốc độ bắn tia điện: x2 (0.5s/bắn)\n• Đòn Laser phụ 150% Dmg mỗi 1.5s[]";

                        let txtBCell = boxB.add(txtB);
                        txtBCell.width(340).get().setWrap(true);
                        txtBCell.get().setAlignment(Align.left);
                    }
                    mainTable.add(boxB).width(360).row();
                    mainTable.add().height(12).row();

                    let boxC = new Table(); boxC.background(Styles.black6); boxC.margin(12);
                    boxC.add("[purple]★ ROLL PHÚC LỢI C (NGẪU NHIÊN) ★[]").row();

                    let perkC = this.getPerkC();
                    if (perkC == 0) {
                        let txtCDesc = boxC.add("Kích hoạt nâng cấp ngẫu nhiên nhận 1 trong 4 phúc lợi C:\n" +
                                                " • [purple]Phúc lợi 1C (40%):[] Sát thương bạo kích +150%, Tỉ lệ bạo kích +10%.\n" +
                                                " • [purple]Phúc lợi 2C (30%):[] Gắn ấn Nhiễm Điện lên kẻ địch, xung kích làm chậm 80% xung quanh 50px.\n" +
                                                " • [purple]Phúc lợi 3C (20%):[] +10% Dmg, Range, HP | +20% Crit Rate, +50% Crit Dmg.\n" +
                                                " • [purple]Phúc lợi 4C (10%):[] +100% Dmg, Range, HP. Siêu đòn kết liễu Sét + Laser khi địch <5% HP.");
                        txtCDesc.width(340).get().setWrap(true);
                        txtCDesc.get().setAlignment(Align.left);
                        boxC.row();

                        boxC.button("[purple]QUAY PHÚC LỢI C[]", packRun(() => {
                            let core = this.team.core();
                            let itemObsidis = Vars.content.getByName(ContentType.item, "newex-obsidis");
                            if (core != null && itemObsidis != null && core.items.get(Items.surgeAlloy) >= reqPerkHitekC.surgeAlloy && core.items.get(Items.phaseFabric) >= reqPerkHitekC.phaseFabric && core.items.get(itemObsidis) >= reqPerkHitekC.obsidis) {
                                core.items.remove(Items.surgeAlloy, reqPerkHitekC.surgeAlloy);
                                core.items.remove(Items.phaseFabric, reqPerkHitekC.phaseFabric);
                                core.items.remove(itemObsidis, reqPerkHitekC.obsidis);

                                let chance = Mathf.rand.nextInt(100);
                                let res = chance < 40 ? 1 : (chance < 70 ? 2 : (chance < 90 ? 3 : 4));
                                this.setPerkC(res);

                                Fx.upgradeCore.at(this.x, this.y);
                                Effect.shake(4, 4, this.x, this.y);

                                let descMapC = {
                                    1: "• Sát thương bạo kích +150%\n• Tỉ lệ bạo kích +10%.",
                                    2: "• Đòn đánh gắn ấn Nhiễm Điện (Electrified) cho mục tiêu\n• Sóng xung kích làm chậm 80% kẻ địch trong phạm vi 50px.",
                                    3: "• +10% Dmg, Phạm vi, Máu\n• +20% Tỉ lệ bạo kích, +50% Sát thương bạo kích.",
                                    4: "• +100% Dmg, Phạm vi, Máu\n• Kết liễu địch <5% HP bằng Sét + Laser (5000% Dmg + 5% max HP)."
                                };

                                Vars.ui.showInfo("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[purple]PHÚC LỢI " + res + "C[]\n\n[white]" + descMapC[res]);
                                dialog.hide();
                                this.deselect();
                            } else {
                                Vars.ui.showInfo("[red]Không đủ tài nguyên trong Lõi để roll Phúc lợi C![]");
                            }
                        })).size(280, 40);
                    } else {
                        let txtC = "";
                        if (perkC == 1) txtC = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1C\n• Sát thương bạo kích +150%\n• Tỉ lệ bạo kích +10%[]";
                        if (perkC == 2) txtC = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2C\n• Gắn ấn Nhiễm Điện cho mục tiêu\n• Xung kích làm chậm 80% xung quanh 50px[]";
                        if (perkC == 3) txtC = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3C\n• +10% Dmg, Phạm vi, Máu\n• +20% Tỉ lệ bạo kích, +50% Sát thương bạo kích[]";
                        if (perkC == 4) txtC = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 4C\n• +100% Dmg, Phạm vi, Máu\n• Siêu đòn kết liễu Sét + Laser (5000% Dmg + 5% max HP)[]";

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
                })).size(50, 40).tooltip("Trung tâm nâng cấp pháo Hitekalum");

                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = " Thông số pháo Hitekalum ";
                    
                    let curHp = Math.round(this.health);
                    let maxHp = Math.round(this.maxHealth);
                    let curRng = Math.round(this.range() / 8); 
                    let curDmg = Math.round(this.getRawDamage());

                    let descStr = "[gold]⚡ BẢNG THÔNG SỐ HIỆN TẠI ⚡[]\n" +
                                  "• [white]Máu cơ bản:[] [green]" + curHp + "/" + maxHp + " HP[]\n" +
                                  "• [white]Tầm bắn:[] [cyan]" + curRng + " Ô (Tiles)[]\n" +
                                  "• [white]Sát thương cơ bản:[] [orange]" + curDmg + " Dmg[]\n" +
                                  "• [white]Nội tại cố định:[] [lightgray]5% Tỉ lệ Bạo kích, 50% Dmg Bạo kích, Trúng đạn giảm 5% giáp địch[]\n" +
                                  "• [white]Nội tại Nhiễm điện:[] [lightgray]Gây x2 Dmg (x4 nếu có Phúc lợi 2A) khi đánh kẻ địch bị Nhiễm Điện[]\n\n" +
                                  "[gold]TRẠNG THÁI NÂNG CẤP PHÚC LỢI:[]";

                    let perkA = this.getPerkA();
                    let perkB = this.getPerkB();
                    let perkC = this.getPerkC();

                    if (perkA > 0) {
                        descStr += "\n\n[yellow]★ PHÚC LỢI A:[] ";
                        if (perkA == 1) descStr += "[green]Phúc lợi 1A[]\n  └ Tầm bắn +40%, Đạn giật điện lây sang 1 mục tiêu.";
                        if (perkA == 2) descStr += "[green]Phúc lợi 2A[]\n  └ Tiết kiệm 50% điện, x4 Dmg lên kẻ địch Nhiễm Điện.";
                        if (perkA == 3) descStr += "[green]Phúc lợi 3A[]\n  └ Sát thương +30%, Bỏ qua 100% giáp.";
                    } else {
                        descStr += "\n\n[yellow]★ PHÚC LỢI A:[] [lightgray]Chưa kích hoạt[]";
                    }

                    if (perkB > 0) {
                        descStr += "\n\n[cyan]★ PHÚC LỢI B:[] ";
                        if (perkB == 1) descStr += "[green]Phúc lợi 1B[]\n  └ Máu +200%, Phản 15% sát thương cận chiến.";
                        if (perkB == 2) descStr += "[green]Phúc lợi 2B[]\n  └ Bắn 3 tia điện đến 3 kẻ địch trâu nhất (20% Dmg + 1% Max HP).";
                        if (perkB == 3) descStr += "[green]Phúc lợi 3B[]\n  └ Tốc độ bắn tia điện: x2 (0.5s/bắn), Laser 150% Dmg mỗi 1.5s.";
                    } else {
                        descStr += "\n\n[cyan]★ PHÚC LỢI B:[] [lightgray]Chưa kích hoạt[]";
                    }

                    if (perkC > 0) {
                        descStr += "\n\n[purple]★ PHÚC LỢI C:[] ";
                        if (perkC == 1) descStr += "[green]Phúc lợi 1C[]\n  └ Crit Dmg +150%, Crit Rate +10%.";
                        if (perkC == 2) descStr += "[green]Phúc lợi 2C[]\n  └ Gắn ấn Nhiễm Điện, Xung kích làm chậm 80% xung quanh 50px.";
                        if (perkC == 3) descStr += "[green]Phúc lợi 3C[]\n  └ +10% All Stats, +20% Crit Rate, +50% Crit Dmg.";
                        if (perkC == 4) descStr += "[green]Phúc lợi 4C[]\n  └ +100% All Stats, Siêu đòn kết liễu Sét + Laser.";
                    } else {
                        descStr += "\n\n[purple]★ PHÚC LỢI C:[] [lightgray]Chưa kích hoạt[]";
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
                })).size(50, 40).tooltip("Xem thông số pháo Hitekalum");
            },

            write(write){
                this.super$write(write);
                write.b(this.getPerkA());
                write.b(this.getPerkB());
                write.b(this.getPerkC());
            },
            read(read, revision){
                this.super$read(read, revision);
                this.perkTier1 = read.b();
                this.perkTier2 = read.b();
                this.perkCState = read.b();
                this.applyStatsFromPerk();
            }
        });
    }
});

exports.hitekalum = hitekalumBlock;