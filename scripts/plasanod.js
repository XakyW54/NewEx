/* PLASANOD TURRET SYSTEM - DUAL BEAMS WITH CUSTOM UPGRADES */

let sta = null;
try {
    sta = require("sta");
} catch(e) {
    Log.err("Plasanod: Không thể nạp module sta.js!");
}

const packCons = (func) => new Cons({ get: func });
const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqPlasanodMK2 = { silicon: 3000, plastanium: 1500, surgeAlloy: 500 };
const reqPlasanodMK2B = { silicon: 4000, thorium: 2000, phaseFabric: 800 };
const reqSpecialPlasanod = { copper: 4000, lead: 4000, silicon: 4000 };

if (typeof global !== "undefined" && !global.ceiLastAppliedTurret) {
    global.ceiLastAppliedTurret = {};
}

function distToSegment(x, y, x1, y1, x2, y2) {
    let l2 = Mathf.dst2(x1, y1, x2, y2);
    if (l2 === 0) return Mathf.dst(x, y, x1, y1);
    let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    let projX = x1 + t * (x2 - x1);
    let projY = y1 + t * (y2 - y1);
    return Mathf.dst(x, y, projX, projY);
}

// --- ĐẠN VẬT LÝ DÀI (GÁN STATUS CEI) ---
const physicalBullet = extend(BasicBulletType, {
    speed: 9,
    damage: 150,
    pierce: true,
    pierceCap: 20,
    pierceBuilding: true,
    lifetime: 600 / 9,
    width: 14,
    height: 28,
    frontColor: Color.valueOf("ffcc66"),
    backColor: Color.valueOf("e67e22"),
    splashDamage: 120,
    splashDamageRadius: 20,
    status: (sta != null && sta.cei != null) ? sta.cei : StatusEffects.freezing,
    statusDuration: 7200,
    hitEffect: Fx.select,
    despawnEffect: Fx.select
});

// --- ĐẠN LASER CHÍNH ---
function createPlasanodLaser(baseDmg, hitHex, beamLen) {
    return extend(PointLaserBulletType, {
        damage: baseDmg,
        beamLength: beamLen,
        buildingDamageMultiplier: 0.4,
        hitColor: Color.valueOf(hitHex),
        status: (sta != null && sta.cei != null) ? sta.cei : StatusEffects.freezing,
        statusDuration: 7200
    });
}

const laserMK1 = createPlasanodLaser(35, "84e184", 600);
const laserMK2 = createPlasanodLaser(140, "00ffcc", 780);
const laserMK2B = createPlasanodLaser(160, "bf40bf", 600);

let plasanod = extend(ContinuousTurret, "plasanod", {
    squareSprite: false,
    basePrefix: "reinforced-",
    
    load(){
        this.super$load();
        this.customBaseRegion = Core.atlas.find(this.basePrefix + "block-" + this.size);
    }
});

plasanod.health = 4200;
plasanod.size = 3;
plasanod.range = 600;
plasanod.targetAir = true;
plasanod.targetGround = true;
plasanod.configurable = true;
plasanod.playerControllable = true;
plasanod.unitSort = UnitSorts.strongest;
plasanod.category = Category.turret;
plasanod.shootType = laserMK1;
plasanod.scaleDamageEfficiency = true;
plasanod.shootWarmupSpeed = 0.08;
plasanod.shootCone = 360;
plasanod.aimChangeSpeed = 0.9;
plasanod.rotateSpeed = 0.9;
plasanod.shootY = 0.5;
plasanod.shootSound = Sounds.none;
plasanod.loopSoundVolume = 1.0;
plasanod.loopSound = Sounds.beamLustre;
plasanod.hasPower = true;
plasanod.hasLiquids = true;
plasanod.consumePower(15.0);
plasanod.consumeLiquid(Liquids.cryofluid, 12.0 / 60.0);

plasanod.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null) {
        let val = Number(value);
        if (val >= 10) {
            tile.setPerkTier(val - 10);
        } else {
            tile.setTier(val);
        }
    }
}));

const ContinuousTurretBuildClass = Packages.mindustry.world.blocks.defense.turrets.ContinuousTurret.ContinuousTurretBuild;

plasanod.buildType = () => extend(ContinuousTurretBuildClass, plasanod, {
    created() {
        this.super$created();
        this.tierState = 0;
        this.perkTierState = 0;
        
        this.aimTimer = 0;
        this.physShootTimer = 0;
        this.ceiStackTimer = 0;
        this.lastRotation = 0;
        return this;
    },

    getPerkTier() {
        return (this.perkTierState == null) ? 0 : this.perkTierState;
    },

    setPerkTier(val) {
        this.perkTierState = Number(val);
        this.setTier(this.getTier());
    },

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    
    setTier(val){ 
        this.tierState = val;
        let baseH = (val == 2) ? 6500 : 4200; 

        if (this.getPerkTier() == 1) baseH = Math.round(baseH * 1.50);

        this.health = baseH; 
        this.maxHealth = this.health;
        
        let currentRange = this.range();
        let baseBullet = (val == 2) ? createPlasanodLaser(160, "bf40bf", currentRange) : 
                        ((val == 1) ? createPlasanodLaser(140, "00ffcc", currentRange) : createPlasanodLaser(35, "84e184", currentRange));

        if (this.getPerkTier() == 4) {
            this.shootType = extend(PointLaserBulletType, {
                damage: baseBullet.damage * 11,
                beamLength: currentRange,
                buildingDamageMultiplier: 0.4,
                hitColor: baseBullet.hitColor,
                status: baseBullet.status,
                statusDuration: 7200
            });
        } else {
            this.shootType = baseBullet;
        }
    },

    range(){
        let baseR = 600;
        let perk = this.getPerkTier();
        let tier = this.getTier();

        if (tier == 1) baseR = 780;

        if (perk == 2 || perk == 4) {
            baseR += 300;
        }

        return baseR;
    },

    buildConfiguration(table) {
        table.clear(); 
        table.row();

        // ==================== NÚT 1: NÚT NÂNG CẤP ^ ====================
        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Plasanod", {});
            
            let reqCell = dialog.cont.label(packProv(() => {
                let core = this.team.core();
                if (core == null) return "[red]Không tìm thấy Lõi Đội![]";
                let cCop = core.items.get(Items.copper);
                let cLea = core.items.get(Items.lead);
                let cSil = core.items.get(Items.silicon);
                let cPla = core.items.get(Items.plastanium);
                let cSur = core.items.get(Items.surgeAlloy);
                let cTho = core.items.get(Items.thorium);
                let cPha = core.items.get(Items.phaseFabric);

                let copCol = cCop >= reqSpecialPlasanod.copper ? "[green]" : "[red]";
                let leaCol = cLea >= reqSpecialPlasanod.lead ? "[green]" : "[red]";
                let silColSp = cSil >= reqSpecialPlasanod.silicon ? "[green]" : "[red]";

                let silColor1 = cSil >= reqPlasanodMK2.silicon ? "[green]" : "[red]";
                let plaColor1 = cPla >= reqPlasanodMK2.plastanium ? "[green]" : "[red]";
                let surColor1 = cSur >= reqPlasanodMK2.surgeAlloy ? "[green]" : "[red]";
                
                let silColor2 = cSil >= reqPlasanodMK2B.silicon ? "[green]" : "[red]";
                let thoColor2 = cTho >= reqPlasanodMK2B.thorium ? "[green]" : "[red]";
                let phaColor2 = cPha >= reqPlasanodMK2B.phaseFabric ? "[green]" : "[red]";

                return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                       "[gold]★ PHÚC LỢI ĐẶC BIỆT:[] Đồng: " + copCol + cCop + "[]/4000 | Chì: " + leaCol + cLea + "[]/4000 | Silicon: " + silColSp + cSil + "[]/4000\n" +
                       "[cyan]Nhánh MK2:[] Silicon: " + silColor1 + cSil + "[]/" + reqPlasanodMK2.silicon + " | Plastanium: " + plaColor1 + cPla + "[]/" + reqPlasanodMK2.plastanium + " | Surge Alloy: " + surColor1 + cSur + "[]/" + reqPlasanodMK2.surgeAlloy + "\n" +
                       "[purple]Nhánh MK2B:[] Silicon: " + silColor2 + cSil + "[]/" + reqPlasanodMK2B.silicon + " | Thorium: " + thoColor2 + cTho + "[]/" + reqPlasanodMK2B.thorium + " | Phase Fabric: " + phaColor2 + cPha + "[]/" + reqPlasanodMK2B.phaseFabric;
            }));
            
            reqCell.width(380).get().setWrap(true);
            reqCell.get().setAlignment(Align.left);
            dialog.cont.row(); 
            dialog.cont.add().height(10).row();

            let branchesTable = new Table();

            // --- KHU VỰC PHÚC LỢI ĐẶC BIỆT ---
            let spBox = new Table(); 
            spBox.background(Styles.black6); 
            spBox.margin(12);
            spBox.add("[gold]★ PHÚC LỢI NÂNG CẤP ĐẶC BIỆT (NGẪU NHIÊN) ★[]").row();

            let currentPerk = this.getPerkTier();
            let tier = this.getTier();

            if (currentPerk == 0) {
                let spD = spBox.add("Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 6 phúc lợi vĩnh viễn:\n" +
                                     " • [yellow]Phúc lợi 1 (~19.6%):[] +215% Sát thương gốc, Tăng tốc độ nạp chùm tia Laser.\n" +
                                     " • [orange]Phúc lợi 2 (~29.4%):[] +50% Tầm bắn hiệu dụng, Tăng 150% Sát thương Tia Năng Lượng.\n" +
                                     " • [cyan]Phúc lợi 3 (~19.6%):[] +50% Tất cả chỉ số (DPS, Phạm vi bắn, Tỷ lệ phóng sét lan).\n" +
                                     " • [purple]Phúc lợi 4 (~29.4%):[] +50% Tầm bắn hiệu dụng, Tự động phóng đạn Vật Lý Kép xuyên phá.\n" +
                                     " • [green]Phúc lợi 5 (1% SIÊU HIẾM):[] Phóng chùm Laser đa hướng, Mở rộng phạm vi nổ nguyên tố & Buff pháo đồng minh gần nhất.\n" +
                                     " • [red]Phúc lợi 6 (1% SIÊU HIẾM):[] +500% Sát thương gốc, Thiêu rụi đối phương với chuỗi bộc phá Sét Ma Quỷ liên tục!");
                spD.width(360).get().setWrap(true); 
                spD.get().setAlignment(Align.left); 
                spBox.row();

                spBox.button("[gold]QUAY PHÚC LỢI (4K Đồng/Chì/Silicon)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.copper) >= 4000 && core.items.get(Items.lead) >= 4000 && core.items.get(Items.silicon) >= 4000) {
                        core.items.remove(Items.copper, 4000); 
                        core.items.remove(Items.lead, 4000); 
                        core.items.remove(Items.silicon, 4000);

                        let rand = Mathf.random(100);
                        let resultPerk = 3; 

                        if (rand < 1.0) {
                            resultPerk = 5; 
                        } else if (rand < 2.0) {
                            resultPerk = 6; 
                        } else if (rand < 2.0 + 19.6) {
                            resultPerk = 1;
                        } else if (rand < 2.0 + 19.6 + 29.4) {
                            resultPerk = 2;
                        } else if (rand < 2.0 + 19.6 + 29.4 + 19.6) {
                            resultPerk = 3;
                        } else {
                            resultPerk = 4;
                        }

                        this.setPerkTier(resultPerk);
                        this.configure(10 + resultPerk); 

                        Fx.upgradeCore.at(this.x, this.y); 
                        Effect.shake(6, 6, this.x, this.y);

                        let perkName = "";
                        if (resultPerk == 1) perkName = "[yellow]PHÚC LỢI 1[]";
                        else if (resultPerk == 2) perkName = "[orange]PHÚC LỢI 2 (+50% Tầm xa)[]";
                        else if (resultPerk == 3) perkName = "[cyan]PHÚC LỢI 3[]";
                        else if (resultPerk == 4) perkName = "[purple]PHÚC LỢI 4 (+50% Tầm xa)[]";
                        else if (resultPerk == 5) perkName = "[green]★ PHÚC LỢI 5 (1% SIÊU HIẾM) ★[]";
                        else perkName = "[red]★ PHÚC LỢI 6 (1% SIÊU HIẾM) ★[]";

                        Vars.ui.showInfo("[gold]BẠN ĐÃ TRÚNG:[]\n" + perkName);

                        dialog.hide(); 
                        this.deselect();
                    } else { 
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho Phúc Lợi Đặc Biệt![]"); 
                    }
                })).size(300, 40);
            } else {
                let perkText = "";
                if (currentPerk == 1) perkText = "[yellow]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1\n• Sát thương gốc +215%\n• Tăng tốc độ quét & hội tụ chùm Laser[]";
                if (currentPerk == 2) perkText = "[orange]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2\n• Tầm bắn hiệu dụng +50%\n• Sát thương Laser Siêu Dẫn +150%[]";
                if (currentPerk == 3) perkText = "[cyan]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3\n• Tăng 50% Mọi chỉ số pháo & hiệu ứng bộc phá[]";
                if (currentPerk == 4) perkText = "[purple]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 4\n• Tầm bắn hiệu dụng +50%\n• Kích hoạt bắn thêm đạn Vật Lý Kép xuyên phá[]";
                if (currentPerk == 5) perkText = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 5 (1% SIÊU HIẾM)\n• Chùm Laser đa hướng tự động phân tách\n• Mở rộng bán kính Xoáy Trọng Lực\n• Buff năng lượng cho 4 pháo đồng minh lân cận[]";
                if (currentPerk == 6) perkText = "[red]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 6 (1% SIÊU HIẾM)\n• Sát thương gốc +500%\n• Tự động xả chuỗi bộc phá Sét Ma Quỷ diện rộng liên tục![]";

                let spD = spBox.add(perkText);
                spD.width(360).get().setWrap(true); 
                spD.get().setAlignment(Align.left);
            }

            branchesTable.add(spBox).width(360); 
            branchesTable.row();
            branchesTable.add().height(12).row();

            // --- KHU VỰC CHỌN NHÁNH NÂNG CẤP (MK2 / MK2B) ---
            if (tier == 0) {
                let b1 = new Table(); 
                b1.background(Styles.black6); 
                b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("[white]• Máu cấu trúc: [gray]+0%[] (4,200 HP)\n" +
                                 "• Tầm bắn: [green]+30%[] (780 px)\n" +
                                 "• Sát thương gốc: [green]+300%[] (140 DPS)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Cấu Hình Tia Siêu Dẫn Tầm Xa — Tập trung chùm tia năng lượng siêu dẫn tầm xa, bổ sung hiệu ứng Giật Điện (Shocked) kèm 15% tỷ lệ phóng sét lan rộng sang các mục tiêu lân cận.[]");
                b1D.width(340).get().setWrap(true); 
                b1D.get().setAlignment(Align.left); 
                b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.silicon) >= reqPlasanodMK2.silicon && core.items.get(Items.plastanium) >= reqPlasanodMK2.plastanium && core.items.get(Items.surgeAlloy) >= reqPlasanodMK2.surgeAlloy) {
                        core.items.remove(Items.silicon, reqPlasanodMK2.silicon); 
                        core.items.remove(Items.plastanium, reqPlasanodMK2.plastanium); 
                        core.items.remove(Items.surgeAlloy, reqPlasanodMK2.surgeAlloy);
                        
                        this.setTier(1);
                        this.configure(1); 

                        Fx.upgradeCore.at(this.x, this.y); 
                        Fx.impactReactorExplosion.at(this.x, this.y); 
                        Effect.shake(8, 8, this.x, this.y);

                        dialog.hide(); 
                        this.deselect();
                    } else { 
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); 
                    }
                })).size(180, 38);

                let b2 = new Table(); 
                b2.background(Styles.black6); 
                b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("[white]• Máu cấu trúc: [green]+55%[] (6,500 HP)\n" +
                                 "• Tầm bắn: [gray]+0%[] (600 px)\n" +
                                 "• Sát thương gốc: [green]+357%[] (160 DPS)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Biến Thể Xoáy Trọng Lực Cận Chiến — Tối ưu hóa pháo ở tầm gần, gắn liên tục +3 tầng hiệu ứng CEI/giây (bao gồm Nóng Chảy, Điện Hóa và Sét Ma Quỷ) lên mục tiêu.[]");
                b2D.width(340).get().setWrap(true); 
                b2D.get().setAlignment(Align.left); 
                b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.silicon) >= reqPlasanodMK2B.silicon && core.items.get(Items.thorium) >= reqPlasanodMK2B.thorium && core.items.get(Items.phaseFabric) >= reqPlasanodMK2B.phaseFabric) {
                        core.items.remove(Items.silicon, reqPlasanodMK2B.silicon); 
                        core.items.remove(Items.thorium, reqPlasanodMK2B.thorium); 
                        core.items.remove(Items.phaseFabric, reqPlasanodMK2B.phaseFabric);
                        
                        this.setTier(2);
                        this.configure(2); 

                        Fx.bigShockwave.at(this.x, this.y); 
                        Fx.reactorExplosion.at(this.x, this.y); 
                        Effect.shake(10, 10, this.x, this.y);

                        dialog.hide(); 
                        this.deselect();
                    } else { 
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); 
                    }
                })).size(180, 38);

                branchesTable.add(b1).width(360); 
                branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(360);
            } else {
                let statusLabel = (tier == 1) ? "[cyan]ĐÃ NÂNG CẤP THÀNH PHÁO MK2[]" : "[purple]ĐÃ NÂNG CẤP THÀNH PHÁO MK2B[]";
                branchesTable.add(statusLabel).row();
            }

            let scroll = new ScrollPane(branchesTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton(); 
            dialog.show();
        })).size(50, 40).tooltip("Trung tâm nâng cấp pháo Plasanod");

        // ==================== NÚT 2: NÚT THÔNG TIN i ====================
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Plasanod ";
            let descStr = "";
            let currentTier = this.getTier();
            let currentPerk = this.getPerkTier();

            let bonusRangeText = (currentPerk == 2 || currentPerk == 4) ? " [gold](+50% từ Phúc Lợi)[]" : "";

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]4,200 HP[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]" + this.range() + " pixel[]" + bonusRangeText + "\n" +
                          "[lightgray]Sát thương gốc:[] [yellow]35.00 DPS (Mỗi tia)[]\n\n" +
                          "[sky]⚡ CƠ CHẾ KĨ NĂNG:[]\n" +
                          "• Quét 2 chùm Laser Năng Lượng Liên Tục kết hợp xả đạn Vật Lý Dài xuyên phá.";
            } else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]4,200 HP[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]" + this.range() + " pixel [lime](+30%)[]" + bonusRangeText + "\n" +
                          "[lightgray]Sát thương gốc:[] [yellow]140.00 DPS [lime](+300%)[]\n\n" +
                          "[lime]⚡ CƠ CHẾ KĨ NĂNG:[]\n" +
                          "• [lightgray]Laser Siêu Dẫn Tầm Xa:[] Gây hiệu ứng Giật Điện (Shocked) kèm 15% tỷ lệ phóng sét lan rộng sang các mục tiêu.";
            } else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]6,500 HP [lime](+55%)[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]" + this.range() + " pixel[]" + bonusRangeText + "\n" +
                          "[lightgray]Sát thương gốc:[] [red]160.00 DPS [lime](+357%)[]\n\n" +
                          "[purple]🔥 CƠ CHẾ KĨ NĂNG ĐẶC BIỆT:[]\n" +
                          "• [lightgray]Xoáy Trọng Lực Cận Chiến:[] Áp dụng đồng thời trạng thái Nóng Chảy & Điện Hóa, liên tục cộng dồn +3 tầng CEI/giây.";
            }

            if (currentPerk > 0) {
                descStr += "\n\n[gold]★ ĐÃ KÍCH HOẠT PHÚC LỢI ĐẶC BIỆT ★[]";
                if (currentPerk == 1) descStr += "\n[yellow]• Phúc lợi 1: Sát thương gốc +215%, Tăng tốc độ hội tụ chùm Laser.[]";
                if (currentPerk == 2) descStr += "\n[orange]• Phúc lợi 2: Tầm bắn +50%, Sát thương Laser Siêu Dẫn +150%.[]";
                if (currentPerk == 3) descStr += "\n[cyan]• Phúc lợi 3: +50% Mọi chỉ số pháo & hiệu ứng bộc phá.[]";
                if (currentPerk == 4) descStr += "\n[purple]• Phúc lợi 4: Tầm bắn +50%, Bắn thêm đạn Vật Lý Kép xuyên phá.[]";
                if (currentPerk == 5) descStr += "\n[green]• Phúc lợi 5 (1%): Laser đa hướng, Mở rộng Xoáy Trọng Lực, Buff năng lượng cho 4 pháo đồng minh lân cận.[]";
                if (currentPerk == 6) descStr += "\n[red]• Phúc lợi 6 (1%): Sát thương gốc +500%, Bộc phá Sét Ma Quỷ diện rộng liên tục![]";
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
        })).size(50, 40).tooltip("Xem thông số chi tiết pháo Plasanod");
    },

    config() { return java.lang.Integer(this.getTier()); },

    updateTile(){
        this.super$updateTile();

        if(this.efficiency > 0 && this.isShooting){
            let rot = this.rotation;

            if(Math.abs(Angles.angleDist(rot, this.lastRotation)) < 0.2){
                this.aimTimer += Time.delta;
            } else {
                this.aimTimer = 0;
                this.physShootTimer = 0;
                this.ceiStackTimer = 0;
            }
            this.lastRotation = rot;

            let maxLen = this.range();
            let bx = this.x, by = this.y;
            let startX = bx + Angles.trnsx(rot, 6);
            let startY = by + Angles.trnsy(rot, 6);

            if(this.aimTimer >= 60){
                this.physShootTimer += Time.delta;
                this.ceiStackTimer += Time.delta;

                if(this.physShootTimer >= 24){
                    physicalBullet.create(this, this.team, startX, startY, rot);
                    this.physShootTimer = 0;
                }

                let dpsDamage = (200 / 60) * Time.delta * this.efficiency;

                let off1X = bx + Angles.trnsx(rot + 90, 6);
                let off1Y = by + Angles.trnsy(rot + 90, 6);
                let e1X = off1X + Angles.trnsx(rot, maxLen);
                let e1Y = off1Y + Angles.trnsy(rot, maxLen);

                let off2X = bx + Angles.trnsx(rot - 90, 6);
                let off2Y = by + Angles.trnsy(rot - 90, 6);
                let e2X = off2X + Angles.trnsx(rot, maxLen);
                let e2Y = off2Y + Angles.trnsy(rot, maxLen);

                let applyCeiBonus = false;
                if (this.getTier() == 2 && this.ceiStackTimer >= 60) {
                    applyCeiBonus = true;
                }

                Units.nearbyEnemies(this.team, bx, by, maxLen, packCons(u => {
                    if (u.checkTarget(true, true)) {
                        let hitTia1 = distToSegment(u.x, u.y, off1X, off1Y, e1X, e1Y) <= u.hitSize + 4;
                        let hitTia2 = distToSegment(u.x, u.y, off2X, off2Y, e2X, e2Y) <= u.hitSize + 4;

                        if (hitTia1 || hitTia2) {
                            let totalHits = (hitTia1 ? 1 : 0) + (hitTia2 ? 1 : 0);
                            u.damage(dpsDamage * totalHits);

                            if (sta != null && sta.cei != null) {
                                u.apply(sta.cei, 7200);
                                if (applyCeiBonus) {
                                    for (let i = 0; i < 3; i++) {
                                        u.apply(sta.cei, 7200);
                                    }
                                }
                            }
                        }
                    }
                }));

                if (applyCeiBonus) {
                    this.ceiStackTimer = 0;
                }
            }

            let endX = startX + Angles.trnsx(rot, maxLen);
            let endY = startY + Angles.trnsy(rot, maxLen);

            let targetUnit = Units.closestEnemy(this.team, startX, startY, maxLen, u => {
                return u.checkTarget(true, true) && distToSegment(u.x, u.y, startX, startY, endX, endY) <= u.hitSize + 4;
            });

            if(targetUnit != null){
                if(sta != null && sta.cei != null){
                    targetUnit.apply(sta.cei, 7200);
                    if (global.ceiLastAppliedTurret) {
                        global.ceiLastAppliedTurret[targetUnit.id] = this;
                    }
                }

                let tier = this.getTier();
                let themeColor = (tier == 2) ? Color.valueOf("bf40bf") : ((tier == 1) ? Color.valueOf("00ffcc") : Color.valueOf("84e184"));

                if(Mathf.chanceDelta(0.12)){
                    Lightning.create(this.team, themeColor, 20, targetUnit.x, targetUnit.y, Mathf.random(360), 5);
                }
            }
        } else {
            this.aimTimer = 0;
            this.physShootTimer = 0;
            this.ceiStackTimer = 0;
        }
    },

    draw(){
        if(plasanod.customBaseRegion != null && plasanod.customBaseRegion.found()){
            Draw.rect(plasanod.customBaseRegion, this.x, this.y);
        } else {
            Draw.rect(plasanod.baseRegion, this.x, this.y);
        }

        if(plasanod.region != null && plasanod.region.found()){
            Draw.rect(plasanod.region, this.x, this.y, this.rotation - 90);
        }

        if(this.efficiency > 0 && this.isShooting){
            let tier = this.getTier();
            let tmpColor = (tier == 2) ? Color.valueOf("bf40bf") : ((tier == 1) ? Color.valueOf("00ffcc") : Color.valueOf("84e184"));
            
            let bx = this.x, by = this.y;
            let rot = this.rotation;

            if(this.aimTimer >= 60){
                Draw.draw(Layer.effect, packRun(() => {
                    Draw.color(tmpColor, Color.white, Mathf.absin(Time.time, 2, 0.4));
                    Lines.stroke(1.5);
                    Lines.circle(bx, by, 10 + Mathf.absin(Time.time, 3, 2));
                    Draw.reset();
                }));

                Draw.draw(Layer.bullet, packRun(() => {
                    let len = this.range();
                    
                    let off1X = bx + Angles.trnsx(rot + 90, 6);
                    let off1Y = by + Angles.trnsy(rot + 90, 6);
                    let e1X = off1X + Angles.trnsx(rot, len);
                    let e1Y = off1Y + Angles.trnsy(rot, len);

                    Draw.color(Color.valueOf("00ffcc"), Color.white, 0.8 + Mathf.absin(Time.time, 1, 0.2));
                    Lines.stroke(2.5 + Mathf.absin(Time.time, 2, 1.0));
                    Lines.line(off1X, off1Y, e1X, e1Y);
                    Fill.circle(e1X, e1Y, 3 + Mathf.absin(Time.time, 2, 1.5));

                    let off2X = bx + Angles.trnsx(rot - 90, 6);
                    let off2Y = by + Angles.trnsy(rot - 90, 6);
                    let e2X = off2X + Angles.trnsx(rot, len);
                    let e2Y = off2Y + Angles.trnsy(rot, len);

                    Draw.color(Color.valueOf("ffcc66"), Color.white, 0.8 + Mathf.absin(Time.time, 1, 0.2));
                    Lines.stroke(2.5 + Mathf.absin(Time.time, 2, 1.0));
                    Lines.line(off2X, off2Y, e2X, e2Y);
                    Fill.circle(e2X, e2Y, 3 + Mathf.absin(Time.time, 2, 1.5));

                    Draw.reset();
                }));
            }

            Draw.draw(Layer.effect, packRun(() => {
                let particles = 64;
                let particleLife = 60.0;
                let particleLen = 6.0;
                let rand = new Rand(this.id);

                let base = Time.time / particleLife;
                for (let i = 0; i < particles; i++) {
                    let fin = (rand.random(1.0) + base) % 1.0;
                    let fout = 1.0 - fin;
                    let fslope = (fin < 0.5) ? fin * 2.0 : (1.0 - fin) * 2.0;
                    let particleLength = rand.random(particleLen * 0.7, particleLen * 1.3) * Mathf.curve(fin, 0.2, 0.9) * (this.efficiency / 2.5 + 1.0);
                    let centerDeg = rand.random(Mathf.pi);

                    let pow3InVal = fin * fin * fin;
                    let pow2OutVal = 1.0 - (1.0 - fin) * (1.0 - fin);

                    Tmp.v1.trns(rot, pow3InVal * rand.random(30, 60) - rand.range(8) - 6, (((rand.random(18, 28) * (fout + 1.0) / 2.0 + 2.0) / (3.0 * fin / 7.0 + 1.3) - 1.0) + rand.range(3)) * Math.cos(centerDeg));
                    let angle = Mathf.slerp(Tmp.v1.angle() - 180, rot, pow2OutVal);
                    Tmp.v1.scl(this.efficiency / 3.7 + 1.0);
                    Tmp.v1.add(bx, by);

                    Draw.color(Tmp.c2.set(tmpColor), Color.white, fin * 0.7);
                    Lines.stroke(Mathf.curve(fslope, 0, 0.42) * 1.2 * Mathf.curve(fin, 0, 0.6));
                    Lines.lineAngleCenter(Tmp.v1.x, Tmp.v1.y, angle, particleLength);
                }

                Draw.reset();
            }));
        }
    },

    write(write){ 
        this.super$write(write); 
        write.b(this.getTier()); 
        write.b(this.getPerkTier());
    },
    read(read, revision){ 
        this.super$read(read, revision); 
        this.setTier(read.b()); 
        if (revision >= 1) {
            this.setPerkTier(read.b());
        } else {
            this.perkTierState = 0;
        }
    }
});