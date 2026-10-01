print("LYVERVON SYSTEM CORE - BREATHING HALO ENERGY UPDATE");

const greenColor = Color.valueOf("7fd4ff");
const lyvervonColor = Color.valueOf("#a488ff");
const deadZone = 80;

const arcmotgreenEffect = new Effect(14, e => {
    if(!(e.data instanceof Seq)) return;
    const points = e.data;
    let thickness = e.rotation > 0 ? e.rotation : 2.8;
    Draw.color(greenColor, Color.white, e.fin());
    Lines.stroke(thickness * e.fout());
    for(let i = 0; i < points.size - 1; i++){
        let a = points.get(i);
        let b = points.get(i + 1);
        Lines.line(a.x, a.y, b.x, b.y, false);
    }
});

const sonicShockwaveEffect = new Effect(45, e => {
    Draw.color(greenColor);
    Lines.stroke(2.5 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 32);
    Draw.alpha(e.fout() * 0.4);
    Fill.circle(e.x, e.y, e.fin() * 20);
    Draw.reset();
});

const mk3ExplosionFX = new Effect(30, e => {
    Draw.color(lyvervonColor, Color.white, e.fin());
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 45); 
    Angles.randLenVectors(e.id, 20, 45 * e.fin(), (x, y) => {
        Fill.circle(e.x + x, y + y, 3.5 * e.fout());
    });
    Draw.reset();
});

function isEnglish() {
    try {
        let loc = Core.settings.get("locale", "default");
        if (loc && loc.startsWith("en")) return true;
        if (Vars.ui && Vars.ui.getLanguage && Vars.ui.getLanguage().startsWith("en")) return true;
    } catch(e) {}
    return false;
}

function dashCircle(x, y, radius, color){
    Draw.color(color);
    let segments = 24; 
    for(let i = 0; i < segments; i += 2){
        let a1 = i / segments * 360;
        let a2 = (i + 1) / segments * 360;
        Lines.line(x + Angles.trnsx(a1, radius), y + Angles.trnsy(a1, radius), x + Angles.trnsx(a2, radius), y + Angles.trnsy(a2, radius));
    }
    Draw.reset();
}

function drawPolyHex(x, y, radius, stroke, rotation, color) {
    Draw.color(color);
    Lines.stroke(stroke);
    let sides = 6;
    for(let i = 0; i < sides; i++){
        let a1 = rotation + (i * 360 / sides);
        let a2 = rotation + ((i + 1) * 360 / sides);
        Lines.line(x + Angles.trnsx(a1, radius), y + Angles.trnsy(a1, radius), x + Angles.trnsx(a2, radius), y + Angles.trnsy(a2, radius));
    }
    Draw.reset();
}

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// Yêu cầu tài nguyên nâng cấp
const reqMK2 = { copper: 120, silicon: 250 };
const reqMK3 = { copper: 200, lead: 290 };

function creategreenStandard(x1, y1, x2, y2, thickness){
    let dst = Mathf.dst(x1, y1, x2, y2);
    let segs = Math.max(4, Math.floor(dst / 7));
    let points = new Seq();
    points.add(new Vec2(x1, y1));
    let angle = Angles.angle(x1, y1, x2, y2);

    for(let i = 1; i < segs; i++){
        let t = i / segs;
        let px = Mathf.lerp(x1, x2, t);
        let py = Mathf.lerp(y1, y2, t);
        let maxCurve = 18; 
        let jitter = 13;   
        let arc = Mathf.sin(t * Math.PI) * maxCurve;
        let noise = Mathf.range(jitter) * (1 - t);

        Tmp.v1.trns(angle + 90, arc + noise);
        points.add(new Vec2(px + Tmp.v1.x, py + Tmp.v1.y));
    }
    points.add(new Vec2(x2, y2));
    arcmotgreenEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
}

function creategreenChaos(x1, y1, x2, y2, thickness){
    let dst = Mathf.dst(x1, y1, x2, y2);
    let segs = Math.max(5, Math.floor(dst / 5)); 
    let points = new Seq();
    points.add(new Vec2(x1, y1));
    let angle = Angles.angle(x1, y1, x2, y2);

    for(let i = 1; i < segs; i++){
        let t = i / segs;
        let px = Mathf.lerp(x1, x2, t);
        let py = Mathf.lerp(y1, y2, t);
        
        let maxCurve = 22 + Math.random() * 12; 
        let jitter = 16 + Math.random() * 10;   
        let arc = Mathf.sin(t * Math.PI) * (Math.random() > 0.5 ? maxCurve : -maxCurve);
        let noise = Mathf.range(jitter); 

        Tmp.v1.trns(angle + 90, arc + noise);
        points.add(new Vec2(px + Tmp.v1.x, py + Tmp.v1.y));
    }
    points.add(new Vec2(x2, y2));
    arcmotgreenEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
}

function findSubTarget(x, y, range, excludeSeq, team){
    let best = null; let maxHp = -1;
    Units.nearbyEnemies(team, x - range, y - range, range * 2, range * 2, u => {
        if(!u.dead && !u.type.flying && Mathf.dst(x, y, u.x, u.y) <= range && !excludeSeq.contains(u)){
            if(u.health > maxHp){ maxHp = u.health; best = u; }
        }
    });
    return best;
}

function findHighHpTargetsForMK2(x, y, range, excludeSeq, team, maxCount){
    let jsList = [];
    Units.nearbyEnemies(team, x - range, y - range, range * 2, range * 2, u => {
        if(!u.dead && !u.type.flying && Mathf.dst(x, y, u.x, u.y) <= range && !excludeSeq.contains(u)){
            jsList.push(u);
        }
    });
    jsList.sort((a, b) => b.health - a.health);
    
    let result = new Seq();
    for(let i = 0; i < Math.min(maxCount, jsList.length); i++){
        result.add(jsList[i]);
    }
    return result;
}

const turretChargeMap = new ObjectMap();

const lyvervonBulletSystem = extend(BulletType, {
    init(b){ if(b) b.remove(); },
    draw(b){}
});
lyvervonBulletSystem.speed = 0;
lyvervonBulletSystem.lifetime = 1;
lyvervonBulletSystem.collides = false;

const lyvervon = extend(PowerTurret, "lyvervon", {
    init(){
        this.super$init();
    },
    drawPlace(x, y, rotation, valid){
        this.super$drawPlace(x, y, rotation, valid);
        Draw.color(Pal.remove); Lines.stroke(2);
        dashCircle(x * Vars.tilesize, y * Vars.tilesize, deadZone, Pal.remove);
        Draw.reset();        
    }
});

lyvervon.health = 1700; lyvervon.size = 4; lyvervon.targetAir = false; lyvervon.targetGround = true;
lyvervon.range = 300; lyvervon.reload = 6; 
lyvervon.shootType = lyvervonBulletSystem;

lyvervon.powerCapacity = 5000;         
lyvervon.consumePower(100 / 60);       
lyvervon.configurable = true;

lyvervon.config(java.lang.Integer, packCons2((tile, value) => {
    if(tile != null && tile.setTier !== undefined) tile.setTier(value);
}));

lyvervon.buildType = () => extend(PowerTurret.PowerTurretBuild, lyvervon, {
    lyvervonTier: 1,
    damageBonus: 0,      
    mk3ChargePoints: 0,  
    mk3Timer: 0,
    zoomAnimation: 0, 

    downxOffset: 0,
    wingsOffset: 0,
    
    placed(){
        this.super$placed();
        this.setTier(this.getTier());
    },

    canControl(){
        return false;
    },

    setTier(val){
        this.lyvervonTier = val;
        if(val == 1){
            this.health = 1700; this.block.reload = 6; this.block.range = 300;
            this.block.consPower.usage = 100 / 60;   
        } else if(val == 2){
            this.health = 2950; this.block.reload = 6; this.block.range = 350;
            this.block.consPower.usage = 1200 / 60;  
        } else if(val == 3){
            this.health = 3600; this.block.reload = 6; this.block.range = 380;
            this.block.consPower.usage = 850 / 60;   
        }
    },
    getTier() { return this.lyvervonTier !== undefined ? this.lyvervonTier : 1; },
    config() { return java.lang.Integer(this.getTier()); },

    shoot(type){
        let tier = this.getTier();
        let target = this.target;

        let endX = this.x, endY = this.y;
        if(target && !target.dead){
            endX = target.x; endY = target.y;
        } else {
            let r = this.block.range;
            endX = this.x + Angles.trnsx(this.rotation, r);
            endY = this.y + Angles.trnsy(this.rotation, r);
        }

        if(tier == 1){
            if(target && !target.dead) target.damage(510);
            creategreenStandard(this.x, this.y, endX, endY, 2.8);
            Fx.hitLancer.at(endX, endY, greenColor);
            Effect.shake(2, 2, endX, endY);
        } 
        else if(tier == 2){
            let baseDamage = 408;
            let finalDamage = baseDamage * (1 + this.damageBonus / 100);
            
            let thicknessProgress = this.damageBonus / 1499;
            let greenThickness = 2.8 * (1 + (thicknessProgress * 0.5));
            let rangeSub = 180;

            if(target && !target.dead) target.damage(finalDamage);
            creategreenStandard(this.x, this.y, endX, endY, greenThickness);

            if(target && !target.dead){
                let turretId = this.id;
                let currentSubBonus = turretChargeMap.containsKey(turretId) ? turretChargeMap.get(turretId) : 0;
                let subDamage = finalDamage * 0.7; 
                let subThickness = 2.5 + (currentSubBonus / 200);

                let excludeList = new Seq();
                excludeList.add(target);

                let applySubCharge = (targetUnit) => {
                    targetUnit.damage(subDamage);
                    let charge = currentSubBonus + 40;
                    if(charge >= 100){
                        turretChargeMap.put(turretId, 0);
                        sonicShockwaveEffect.at(targetUnit.x, targetUnit.y);
                    } else {
                        turretChargeMap.put(turretId, charge);
                    }
                };

                let targetB = findSubTarget(target.x, target.y, rangeSub, excludeList, this.team);
                if(targetB != null){
                    excludeList.add(targetB); applySubCharge(targetB);
                    creategreenStandard(target.x, target.y, targetB.x, targetB.y, subThickness);
                    
                    let targetC = findSubTarget(targetB.x, targetB.y, rangeSub, excludeList, this.team);
                    if(targetC != null){
                        excludeList.add(targetC); applySubCharge(targetC);
                        creategreenStandard(targetB.x, targetB.y, targetC.x, targetC.y, subThickness);
                        
                        let targetD = findSubTarget(targetC.x, targetC.y, rangeSub, excludeList, this.team);
                        if(targetD != null){
                            excludeList.add(targetD); applySubCharge(targetD);
                            creategreenStandard(targetC.x, targetC.y, targetD.x, targetD.y, subThickness);
                            
                            let targetE = findSubTarget(targetD.x, targetD.y, rangeSub, excludeList, this.team);
                            if(targetE != null){
                                excludeList.add(targetE); applySubCharge(targetE);
                                creategreenStandard(targetD.x, targetD.y, targetE.x, targetE.y, subThickness);

                                let extraTargets = findHighHpTargetsForMK2(targetE.x, targetE.y, rangeSub, excludeList, this.team, 5);
                                for(let i = 0; i < extraTargets.size; i++) {
                                    let extraTarget = extraTargets.get(i);
                                    applySubCharge(extraTarget);
                                    creategreenStandard(targetE.x, targetE.y, extraTarget.x, extraTarget.y, subThickness * 0.9);
                                    Fx.hitLancer.at(extraTarget.x, extraTarget.y, greenColor);
                                }
                            }
                        }
                    }
                }
            }
            Fx.hitLancer.at(endX, endY, greenColor);
            let shakeIntensity = 2 + (finalDamage / 500);
            Effect.shake(shakeIntensity, shakeIntensity, endX, endY);
        } 
        else if(tier == 3){
            let thicknessProgressMK3 = this.damageBonus / 1499;
            let greenThicknessMK3 = 3.5 * (1 + (thicknessProgressMK3 * 0.5));

            if(target && !target.dead) target.damage(612);
            creategreenStandard(this.x, this.y, endX, endY, greenThicknessMK3);
            Fx.hitLancer.at(endX, endY, lyvervonColor);
            Effect.shake(3, 3, endX, endY);
        }
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();
        let en = isEnglish();

        if(tier == 1) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialogTitle = en ? "Lyvervon Upgrade Center" : "Trung tâm nâng cấp pháo Lyvervon";
                let dialog = extend(BaseDialog, dialogTitle, {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return en ? "[red]Team Core Not Found![]" : "[red]Không tìm thấy Lõi Đội![]";
                    let currentCopper = core.items.get(Items.copper);
                    let currentSilicon = core.items.get(Items.silicon);
                    let currentLead = core.items.get(Items.lead);
                    
                    let copColor1 = currentCopper >= reqMK2.copper ? "[green]" : "[red]";
                    let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
                    
                    let copColor2 = currentCopper >= reqMK3.copper ? "[green]" : "[red]"; 
                    let leaColor2 = currentLead >= reqMK3.lead ? "[green]" : "[red]";
                    
                    if (en) {
                        return "[yellow]CORE RESOURCE REQUIREMENTS:[]\n" +
                               "[cyan]MK2 Branch:[]\n" +
                               " • Copper: " + copColor1 + currentCopper + "[] / " + reqMK2.copper + "\n" +
                               " • Silicon: " + silColor1 + currentSilicon + "[] / " + reqMK2.silicon + "\n" +
                               "[purple]MK2B Branch:[]\n" +
                               " • Copper: " + copColor2 + currentCopper + "[] / " + reqMK3.copper + "\n" +
                               " • Lead: " + leaColor2 + currentLead + "[] / " + reqMK3.lead;
                    } else {
                        return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                               "[cyan]Nhánh MK2:[]\n" +
                               " • Đồng: " + copColor1 + currentCopper + "[] / " + reqMK2.copper + "\n" +
                               " • Silicon: " + silColor1 + currentSilicon + "[] / " + reqMK2.silicon + "\n" +
                               "[purple]Nhánh MK2B:[]\n" +
                               " • Đồng: " + copColor2 + currentCopper + "[] / " + reqMK3.copper + "\n" +
                               " • Chì: " + leaColor2 + currentLead + "[] / " + reqMK3.lead;
                    }
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1Text = en ?
                    "[white]• Health: [green]+73.5%[] (2,950 HP)\n" +
                    "• Range: [green]+16.6%[] (350 px)\n" +
                    "• Power Usage: [orange]+1100%[] (1,200/s)\n\n" +
                    "[lightgray]Special Ability: Chain green Discharge — Continuous firing increases damage up to +1499%. green chains across up to 5 targets, triggering Sonic Shockwaves at max charge.[]" :
                    "[white]• Máu cấu trúc: [green]+73.5%[] (2,950 HP)\n" +
                    "• Tầm bắn: [green]+16.6%[] (350 px)\n" +
                    "• Tiêu thụ điện: [orange]+1100%[] (1,200/s)\n\n" +
                    "[lightgray]Kỹ năng đặc biệt: Chuỗi Điện Truyền Dẫn — Bắn liên tục tăng tiến sát thương lên tới +1499%. Sét tự động nảy qua 5 mục tiêu và kích nổ xung Sonic khi tích đủ điểm.[]";
                let b1D = b1.add(b1Text);
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button(en ? "[green]ACTIVATE MK2[]" : "[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.silicon, reqMK2.silicon);
                        Fx.upgradeCore.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo(en ? "[red]Not enough resources for MK2![]" : "[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2Text = en ?
                    "[white]• Health: [green]+111.7%[] (3,600 HP)\n" +
                    "• Range: [green]+26.6%[] (380 px)\n" +
                    "• Power Usage: [orange]+750%[] (850/s)\n\n" +
                    "[lightgray]Special Ability: Dual Chaos Explosion — Charges 5 pts/sec while firing. Reaching max charge triggers simultaneous explosions at both turret and target, releasing 13 Chaos green bolts.[]" :
                    "[white]• Máu cấu trúc: [green]+111.7%[] (3,600 HP)\n" +
                    "• Tầm bắn: [green]+26.6%[] (380 px)\n" +
                    "• Tiêu thụ điện: [orange]+750%[] (850/s)\n\n" +
                    "[lightgray]Kỹ năng đặc biệt: Kích Nổ Kép Chaos — Bắn duy trì nạp 5 điểm/giây. Đạt mốc kích nổ đồng thời tại tâm pháo và mục tiêu, tung 13 luồng sét Chaos diện rộng.[]";
                let b2D = b2.add(b2Text);
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button(en ? "[orange]ACTIVATE MK2B[]" : "[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK3.copper && core.items.get(Items.lead) >= reqMK3.lead){
                        core.items.remove(Items.copper, reqMK3.copper); core.items.remove(Items.lead, reqMK3.lead);
                        Fx.bigShockwave.at(this.x, this.y); Effect.shake(6, 6, this.x, this.y);
                        this.configure(java.lang.Integer(3)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo(en ? "[red]Not enough resources for MK2B![]" : "[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip(en ? "Upgrade Lyvervon turret" : "Nâng cấp tháp pháo Lyvervon");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo(en ? "[scarlet]LYVERVON HAS REACHED MAX EVOLUTION LEVEL![]" : "[scarlet]HỆ THỐNG LYVERVON ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip(en ? "Max level reached" : "Đã đạt cấp tối đa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = en ? "📊 LYVERVON STATS: " : "📊 THÔNG SỐ PHÁO LYVERVON: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 1) {
                title += en ? "[yellow]Base Config (MK1)[]" : "[yellow]Cấu hình gốc (MK1)[]";
                descStr = en ?
                          "[gold]⚡ BASE STATS (MK1) ⚡[]\n" +
                          "[lightgray]Turret HP:[] [green]1,700[]\n" +
                          "[gray]📐 Block Size:[] [white]4x4[]\n" +
                          "[lightgray]Effective Range:[] [orange]300 px[]\n" +
                          "[lightgray]Base Beam Damage:[] [purple]510 DMG / pulse[]\n" +
                          "[green] Fire Rate:[] [white]0.1s / shot[]\n" +
                          "[green] Power Usage:[] [white]100 / sec[]\n" +
                          "[scarlet] Deadzone Radius:[] [white]80 px[]\n\n" +
                          "[sky]⚡ SYSTEM MECHANIC:[]\n" +
                          "• [lightgray]Targeting:[] Only locks onto [lightgray]Ground[] targets outside the deadzone.\n" +
                          "• [lightgray]Energy Core:[] Internal battery holds up to 5,000 units." :
                          "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,700[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]4x4[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]300 pixel[]\n" +
                          "[lightgray]Sát thương gốc:[] [purple]510 DMG / xung[]\n" +
                          "[green] Tốc độ xả đạn:[] [white]0.1s / phát[]\n" +
                          "[green] Tiêu thụ điện:[] [white]100 / giây[]\n" +
                          "[scarlet] Vùng mù (Deadzone):[] [white]80 pixel[]\n\n" +
                          "[sky]⚡ CƠ CHẾ HOẠT ĐỘNG:[]\n" +
                          "• [lightgray]Khóa mục tiêu:[] Chỉ tấn công kẻ địch [lightgray]Mặt Đất[] nằm ngoài vùng mù.\n" +
                          "• [lightgray]Lõi năng lượng:[] Trữ lượng pin nội bộ tối đa 5,000 đơn vị.";
            } 
            else if (currentTier == 2) {
                title += en ? "[cyan]STANDARD CONFIG (MK2)[]" : "[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]";
                descStr = en ?
                          "[cyan]⚡ BASE STATS (MK2) ⚡[]\n" +
                          "[lightgray]Turret HP:[] [green]2,950 [lime](+73.5%)[]\n" +
                          "[gray]📐 Block Size:[] [white]4x4[]\n" +
                          "[lightgray]Effective Range:[] [orange]350 px [lime](+16.6%)[]\n" +
                          "[lightgray]Base Beam Damage:[] [purple]408 DMG / pulse[]\n" +
                          "[green] Power Usage:[] [orange]1,200 / sec [red](+1100%)[]\n" +
                          "[green] Max Charge Boost:[] [yellow]Up to +1499% DMG[]\n\n" +
                          "[sky]⚡ CHAIN green MECHANIC:[]\n" +
                          "• [lightgray]Damage Ramp-up:[] Continuous firing boosts damage up to [yellow]+1499%[] and expands beam size by [orange]+150%[].\n" +
                          "• [lightgray]Multi-Chain:[] green chains sequentially through 5 targets within [lightgray]180 px[].\n" +
                          "• [lightgray]Sonic Finish:[] Chain links deal 70% DMG. Reaching 100 pts triggers a sonic shockwave launching 5 sub-bolts at high HP targets." :
                          "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,950 [lime](+73.5%)[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]4x4[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]350 pixel [lime](+16.6%)[]\n" +
                          "[lightgray]Sát thương gốc:[] [purple]408 DMG / xung[]\n" +
                          "[green] Tiêu thụ điện:[] [orange]1,200 / giây [red](+1100%)[]\n" +
                          "[green] Gia tốc tích tụ:[] [yellow]Tối đa +1499% Sát thương[]\n\n" +
                          "[sky]⚡ CƠ CHẾ CHUỖI SÉT TRUYỀN DẪN:[]\n" +
                          "• [lightgray]Tăng tiến hỏa lực:[] Duy trì bắn liên tục tăng hỏa lực lên đến [yellow]+1499%[] và phình to tia sét [orange]+150%[].\n" +
                          "• [lightgray]Nảy chuỗi:[] Tự động nối mạch qua 5 mục tiêu liên tiếp trong bán kính [lightgray]180 pixel[].\n" +
                          "• [lightgray]Xung Sonic:[] Tia phụ gây 70% DMG. Đạt 100 điểm kích nổ sóng chấn phóng thêm 5 tia phụ ghim vào kẻ địch máu cao.";
            } 
            else if (currentTier == 3) {
                title += en ? "[purple]CHAOS EXPLOSION VARIANT (MK2B)[]" : "[purple]BIẾN THỂ KÍCH NỔ CHAOS (MK2B)[]";
                descStr = en ?
                          "[purple]⚡ BASE STATS (MK2B) ⚡[]\n" +
                          "[lightgray]Turret HP:[] [green]3,600 [lime](+111.7%)[]\n" +
                          "[gray]📐 Block Size:[] [white]4x4[]\n" +
                          "[lightgray]Effective Range:[] [orange]380 px [lime](+26.6%)[]\n" +
                          "[lightgray]Base Beam Damage:[] [purple]612 DMG / pulse[]\n" +
                          "[green] Power Usage:[] [orange]850 / sec [red](+750%)[]\n" +
                          "[green] Explosion Cycle:[] [pink]Every 5 pts (1 sec)[]\n\n" +
                          "[purple]🔥 DUAL CHAOS EXPLOSION MECHANIC:[]\n" +
                          "• [lightgray]Charge Speed:[] Automatically gains [green]5 pts / sec[] while continuously firing.\n" +
                          "• [lightgray]Dual Detonation:[] Reaching 5 pts triggers dual explosions at both [yellow]Turret Center[] and [yellow]Target Position[].\n" +
                          "• [lightgray]Chaos Scatter:[] Each blast deals 1,530 DMG (2.5x) and releases [orange]13 Chaos sub-bolts[] within a 45 px radius." :
                          "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]3,600 [lime](+111.7%)[]\n" +
                          "[gray]📐 Kích thước khối:[] [white]4x4[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]380 pixel [lime](+26.6%)[]\n" +
                          "[lightgray]Sát thương gốc:[] [purple]612 DMG / xung[]\n" +
                          "[green] Tiêu thụ điện:[] [orange]850 / giây [red](+750%)[]\n" +
                          "[green] Chu kỳ kích nổ:[] [pink]Mỗi 5 điểm (1 giây)[]\n\n" +
                          "[purple]🔥 CƠ CHẾ KÍCH NỔ KÉP CHAOS:[]\n" +
                          "• [lightgray]Tốc độ nạp điểm:[] Tự động tích [green]5 điểm / giây[] khi duy trì xả đạn liên tục.\n" +
                          "• [lightgray]Nổ đồng thời:[] Đạt 5 điểm tự động kích nổ đồng thời tại [yellow]Tâm tháp pháo[] và [yellow]Kẻ địch bị khóa[].\n" +
                          "• [lightgray]Sét Chaos gãy khúc:[] Mỗi tâm nổ gây 1,530 DMG (gấp 2.5 lần) và tỏa ra [orange]13 tia sét Chaos[] bán kính 45 pixel.";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip(en ? "View detailed stats" : "Xem thông số chi tiết hệ thống");
    },

    findTarget(){
        let currentRange = this.block.range;
        if(this.getTier() == 1){
            this.target = Units.closestTarget(this.team, this.x, this.y, currentRange, u => !u.dead && !u.type.flying && Mathf.dst(this.x, this.y, u.x, u.y) >= deadZone, b => Mathf.dst(this.x, this.y, b.x, b.y) >= deadZone);
        } else {
            let closeTarget = null; let minHp = Infinity;
            Units.nearbyEnemies(this.team, this.x - currentRange, this.y - currentRange, currentRange * 2, currentRange * 2, u => {
                if(!u.dead && !u.type.flying && this.dst(u) <= currentRange && this.dst(u) >= deadZone){
                    if(u.health < minHp){ minHp = u.health; closeTarget = u; }
                }
            });
            this.target = closeTarget;
        }
    },

    updateTile(){
        this.super$updateTile();
        let tier = this.getTier();

        if(this.power == null || this.power.status <= 0){
            this.mk3ChargePoints = 0; this.mk3Timer = 0;
            this.zoomAnimation = Math.max(0, this.zoomAnimation - Time.delta / 8);
            return;
        }

        if(this.isShooting && this.target != null && !this.target.dead){
            this.zoomAnimation = Math.min(1, this.zoomAnimation + Time.delta / 10);
            
            if(tier == 2 || tier == 3){
                this.damageBonus += Time.delta / 60 * 60;
                if(this.damageBonus >= 1499){
                    this.damageBonus = 0;
                }
            }
        } else {
            this.zoomAnimation = Math.max(0, this.zoomAnimation - Time.delta / 8);
        }

        let currentRange = this.block.range;
        let anyEnemy = Units.closestTarget(this.team, this.x, this.y, currentRange, u => !u.dead && !u.type.flying, b => !b.dead);
        if(anyEnemy == null){
            this.mk3ChargePoints = 0; this.mk3Timer = 0;
            return;
        }

        if(tier == 3 && this.isShooting && this.target != null && !this.target.dead){
            this.mk3Timer += Time.delta;
            if(this.mk3Timer >= 60){
                this.mk3ChargePoints += 5;
                this.mk3Timer = 0;

                if(this.mk3ChargePoints >= 5){
                    this.mk3ChargePoints = 0; 
                    let mainDamageMK3 = 612;
                    let explosionDamage = mainDamageMK3 * 2.5;
                    
                    let targetX = this.target.x; let targetY = this.target.y;
                    let turretX = this.x; let turretY = this.y;

                    Damage.damage(this.team, targetX, targetY, 45, explosionDamage, false, true);
                    mk3ExplosionFX.at(targetX, targetY);
                    Effect.shake(5, 5, targetX, targetY);

                    let lits = 13; 
                    for(let i = 0; i < lits; i++){
                        let randAngle = Math.random() * 360;
                        let randDist = 15 + Math.random() * 75; 
                        let extX = targetX + Angles.trnsx(randAngle, randDist);
                        let extY = targetY + Angles.trnsy(randAngle, randDist);

                        let subEnemy = Units.closestTarget(this.team, extX, extY, 45, u => !u.dead && !u.type.flying, b => !b.dead);
                        if(subEnemy != null){
                            subEnemy.damage(explosionDamage * 0.4); 
                            creategreenChaos(targetX, targetY, subEnemy.x, subEnemy.y, 2.5);
                            Fx.hitLancer.at(subEnemy.x, subEnemy.y, lyvervonColor);
                        } else {
                            creategreenChaos(targetX, targetY, extX, extY, 2.0);
                        }
                    }

                    Damage.damage(this.team, turretX, turretY, 45, explosionDamage, false, true);
                    mk3ExplosionFX.at(turretX, turretY);
                    Effect.shake(5, 5, turretX, turretY);

                    for(let i = 0; i < lits; i++){
                        let randAngle = Math.random() * 360;
                        let randDist = 15 + Math.random() * 75; 
                        let extX = turretX + Angles.trnsx(randAngle, randDist);
                        let extY = turretY + Angles.trnsy(randAngle, randDist);

                        let subEnemy = Units.closestTarget(this.team, extX, extY, 45, u => !u.dead && !u.type.flying && Mathf.dst(this.x, this.y, u.x, u.y) >= deadZone, b => !b.dead);
                        if(subEnemy != null){
                            subEnemy.damage(explosionDamage * 0.4); 
                            creategreenChaos(turretX, turretY, subEnemy.x, subEnemy.y, 2.5);
                            Fx.hitLancer.at(subEnemy.x, subEnemy.y, lyvervonColor);
                        } else {
                            creategreenChaos(turretX, turretY, extX, extY, 2.0);
                        }
                    }
                }
            }
        }
    },

    draw(){
        let baseRegion = Core.atlas.find(this.block.name + "-base");
        if(!baseRegion.found) baseRegion = Core.atlas.find("lyvervon-base");
        if(!baseRegion.found) baseRegion = Core.atlas.find("block-" + this.block.size); 

        Draw.z(Layer.turret - 1); 
        if(baseRegion.found){
            Draw.rect(baseRegion, this.x, this.y);
        }
        Draw.reset();

        let tier = this.getTier();

        if(this.zoomAnimation > 0){
            Draw.z(Layer.turret + 1); 

            if(this.isShooting && this.target != null && !this.target.dead){
                if(Mathf.chance(0.12)){ 
                    Fx.smoke.at(this.x + Mathf.range(2), this.y + Mathf.range(2));
                }
                
                let fxColor = (tier == 3) ? lyvervonColor : greenColor;
                let currentZoom = Interp.pow3Out.apply(0, 1, this.zoomAnimation);
                let pulse = Vars.state.isPaused() ? 0 : Mathf.absin(Time.time, 4, 3.5);
                let haloRadius = (14.0 + pulse) * currentZoom;

                Draw.color(fxColor);
                Draw.alpha(0.24);
                Lines.stroke(4.0 * currentZoom);
                Lines.circle(this.x, this.y, haloRadius);

                Draw.color(fxColor, Color.white, 0.3);
                Draw.alpha(0.6);
                Lines.stroke(1.8 * currentZoom);
                Lines.circle(this.x, this.y, haloRadius);

                Draw.color(Color.white);
                Draw.alpha(0.95);
                Lines.stroke(0.6 * currentZoom);
                Lines.circle(this.x, this.y, haloRadius);
                Draw.reset();
            }

            let ballColor = (tier == 3) ? lyvervonColor : greenColor;
            let currentBallSize = Interp.pow3Out.apply(0, 1, this.zoomAnimation);
            
            let baseRadius = 2.0 * currentBallSize; 
            if(this.isShooting && this.zoomAnimation >= 0.9 && !Vars.state.isPaused()){
                baseRadius += Mathf.absin(Time.time, 3, 0.4); 
            }

            Draw.color(ballColor);
            Fill.circle(this.x, this.y, baseRadius + 1.0);
            Draw.color(Color.white);
            Fill.circle(this.x, this.y, baseRadius);
            Draw.reset();
        }

        if((tier == 2 || tier == 3) && this.zoomAnimation > 0){
            let hexColor = (tier == 2) ? Color.valueOf("#ffd84d") : lyvervonColor;
            
            let currentZoomSize = Interp.pow3Out.apply(0, 1, this.zoomAnimation);
            let radius = (12 + Mathf.absin(Time.time, 4, 1.5)) * currentZoomSize;
            let stroke = 1.6 * currentZoomSize;
            let rotationAngle = Vars.state.isPaused() ? this.id * 15 : Time.time * 2.2; 
            
            Draw.z(Layer.effect + 5);
            drawPolyHex(this.x, this.y, radius, stroke, rotationAngle, hexColor);
            Draw.reset();
        }

        if(tier == 3 && this.mk3ChargePoints > 0){
            Draw.z(Layer.effect + 10);
            let barWidth = 28;
            let progress = this.mk3ChargePoints / 5;
            Draw.color(Color.black, 0.5); Lines.stroke(3);
            Lines.line(this.x - barWidth / 2, this.y - 22, this.x + barWidth / 2, this.y - 22);
            Draw.color(lyvervonColor); Lines.stroke(2);
            Lines.line(this.x - barWidth / 2, this.y - 22, this.x - barWidth / 2 + (barWidth * progress), this.y - 22);
            Draw.reset();
        }
    },

    drawSelect(){ this.super$drawSelect(); dashCircle(this.x, this.y, deadZone, Pal.remove); },

    write(write){
        this.super$write(write);
        write.b(this.getTier());
    },
    read(read, revision){
        this.super$read(read, revision);
        this.setTier(read.b());
    }
});