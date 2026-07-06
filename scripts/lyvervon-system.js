print("LYVERVON SYSTEM CORE - BREATHING HALO ENERGY UPDATE");

// =========================================================================
// 1. ĐỊNH NGHĨA HIỆU ỨNG ĐỒ HỌA (EFFECTS FX)
// =========================================================================
const lightningColor = Color.valueOf("7fd4ff");
const lyvervonColor = Color.valueOf("#a488ff");
const deadZone = 80;

// Hiệu ứng tia điện chính (Dùng mảng tọa độ cố định - Tự động ngưng đọng khi pause)
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

const sonicShockwaveEffect = new Effect(45, e => {
    Draw.color(lightningColor);
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

function dashCircle(x, y, radius, color){
    Draw.color(color);
    let segments = 48;
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

const reqMK2 = { titanium: 1200, thorium: 5000 };
const reqMK3 = { copper: 8000, plastanium: 2900 };

const checkLyvervonLimitation = (buildInstance, targetBlock, maxCount, message) => {
    let count = 0;
    Groups.build.each(b => {
        let blockName = b.block.name;
        if(b.block == targetBlock || blockName == "newex-" + targetBlock.name || blockName == targetBlock.name){
            if(b.team == buildInstance.team) count++;
        }
    });
    if(count > maxCount){
        Call.sendMessage(message);
        buildInstance.kill();
        return true;
    }
    return false;
};

// =========================================================================
// 2. HÀM TẠO SÉT (CHÍNH & CHAOS ĐỂ TẤN CÔNG)
// =========================================================================
function createLightningStandard(x1, y1, x2, y2, thickness){
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
    arcmotLightningEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
}

function createLightningChaos(x1, y1, x2, y2, thickness){
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
    arcmotLightningEffect.at((x1 + x2) / 2, (y1 + y2) / 2, thickness, points);
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

// =========================================================================
// 3. BLOCK PHÁO CHÍNH
// =========================================================================
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

// ================= CẤU HÌNH LƯU TRỮ VÀ TIÊU THỤ ĐIỆN NĂNG =================
lyvervon.powerCapacity = 5000;         // Khả năng lưu trữ điện của pháo chứa được 5000 đơn vị
lyvervon.consumePower(100 / 60);       // Giá trị khởi tạo mặc định cho MK1 (100 điện / 60 ticks = 1s)
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
        checkLyvervonLimitation(this, lyvervon, 2, "[red]Giới hạn: Chỉ được đặt tối đa 2 pháo lyvervon![]");
        // Đảm bảo cập nhật chính xác lượng điện tiêu thụ ngay khi đặt tháp pháo xuống
        this.setTier(this.getTier());
    },

    canControl(){
        return false;
    },

    setTier(val){
        this.lyvervonTier = val;
        // Chia cho 60 vì Mindustry xử lý lượng tiêu thụ năng lượng theo từng tick (60 ticks = 1 giây)
        if(val == 1){
            this.health = 1700; this.block.reload = 6; this.block.range = 300;
            this.block.consPower.usage = 100 / 60;   // MK1 tiêu tốn 100 điện để bắn trong 1s
        } else if(val == 2){
            this.health = 2950; this.block.reload = 6; this.block.range = 350;
            this.block.consPower.usage = 1200 / 60;  // MK2 tiêu tốn 1200 điện để bắn trong 1s
        } else if(val == 3){
            this.health = 3600; this.block.reload = 6; this.block.range = 380;
            this.block.consPower.usage = 850 / 60;   // MK2b tiêu tốn 850 điện để bắn trong 1s
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
            if(target && !target.dead) target.damage(10);
            createLightningStandard(this.x, this.y, endX, endY, 2.8);
            Fx.hitLancer.at(endX, endY, lightningColor);
            Effect.shake(2, 2, endX, endY);
        } 
        else if(tier == 2){
            let baseDamage = 8;
            let finalDamage = baseDamage * (1 + this.damageBonus / 100);
            
            let thicknessProgress = this.damageBonus / 1499;
            let lightningThickness = 2.8 * (1 + (thicknessProgress * 0.5));
            let rangeSub = 180;

            if(target && !target.dead) target.damage(finalDamage);
            createLightningStandard(this.x, this.y, endX, endY, lightningThickness);

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
                    if(charge >= 500){
                        turretChargeMap.put(turretId, 0);
                        sonicShockwaveEffect.at(targetUnit.x, targetUnit.y);
                    } else {
                        turretChargeMap.put(turretId, charge);
                    }
                };

                let targetB = findSubTarget(target.x, target.y, rangeSub, excludeList, this.team);
                if(targetB != null){
                    excludeList.add(targetB); applySubCharge(targetB);
                    createLightningStandard(target.x, target.y, targetB.x, targetB.y, subThickness);
                    
                    let targetC = findSubTarget(targetB.x, targetB.y, rangeSub, excludeList, this.team);
                    if(targetC != null){
                        excludeList.add(targetC); applySubCharge(targetC);
                        createLightningStandard(targetB.x, targetB.y, targetC.x, targetC.y, subThickness);
                        
                        let targetD = findSubTarget(targetC.x, targetC.y, rangeSub, excludeList, this.team);
                        if(targetD != null){
                            excludeList.add(targetD); applySubCharge(targetD);
                            createLightningStandard(targetC.x, targetC.y, targetD.x, targetD.y, subThickness);
                            
                            let targetE = findSubTarget(targetD.x, targetD.y, rangeSub, excludeList, this.team);
                            if(targetE != null){
                                excludeList.add(targetE); applySubCharge(targetE);
                                createLightningStandard(targetD.x, targetD.y, targetE.x, targetE.y, subThickness);

                                let extraTargets = findHighHpTargetsForMK2(targetE.x, targetE.y, rangeSub, excludeList, this.team, 5);
                                for(let i = 0; i < extraTargets.size; i++) {
                                    let extraTarget = extraTargets.get(i);
                                    applySubCharge(extraTarget);
                                    createLightningStandard(targetE.x, targetE.y, extraTarget.x, extraTarget.y, subThickness * 0.9);
                                    Fx.hitLancer.at(extraTarget.x, extraTarget.y, lightningColor);
                                }
                            }
                        }
                    }
                }
            }
            Fx.hitLancer.at(endX, endY, lightningColor);
            let shakeIntensity = 2 + (finalDamage / 500);
            Effect.shake(shakeIntensity, shakeIntensity, endX, endY);
        } 
        else if(tier == 3){
            let thicknessProgressMK3 = this.damageBonus / 1499;
            let lightningThicknessMK3 = 3.5 * (1 + (thicknessProgressMK3 * 0.5));

            if(target && !target.dead) target.damage(12);
            createLightningStandard(this.x, this.y, endX, endY, lightningThicknessMK3);
            Fx.hitLancer.at(endX, endY, lyvervonColor);
            Effect.shake(3, 3, endX, endY);
        }
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 1) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Nâng Cấp Chuỗi Hệ Thống Lyvervon", {});
                let titleCell = dialog.cont.add("[gold]=== TIẾN HÓA LÕI THÁP PHÁO LYVERVON ===[]");
                titleCell.row(); titleCell.padBottom(10);
                
                let labelCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentTitanium = core.items.get(Items.titanium);
                    let currentThorium = core.items.get(Items.thorium);
                    let currentCopper = core.items.get(Items.copper);
                    let currentPlastanium = core.items.get(Items.plastanium);
                    
                    let titColor1 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                    let thoColor1 = currentThorium >= reqMK2.thorium ? "[green]" : "[red]";
                    let copColor2 = currentCopper >= reqMK3.copper ? "[green]" : "[red]"; 
                    let plaColor2 = currentPlastanium >= reqMK3.plastanium ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[] Titanium: " + titColor1 + reqMK2.titanium + "[]/" + currentTitanium + " | Thorium: " + thoColor1 + reqMK2.thorium + "[]/" + currentThorium + "\n" +
                           "[purple]Nhánh MK2b:[] Copper: " + copColor2 + reqMK3.copper + "[]/" + currentCopper + " | Plastanium: " + plaColor2 + reqMK3.plastanium + "[]/" + currentPlastanium;
                }));
                labelCell.row(); labelCell.padBottom(20);

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12, 16, 12, 16);
                let b1T = b1.add("[cyan]CẤU HÌNH TIÊU CHUẨN XUNG KÍCH (MK2)[]"); b1T.row(); b1T.padBottom(6);
                let b1D = b1.add("[lightgray]Mô-đun siêu liên hoàn truyền dẫn:\n• Tăng HP lên [green]2950[], tầm bắn mở rộng [green]350[].\n• Tiêu tốn điện năng: [orange]1200 đv/s[].\n• Sét chính tự động tích năng lượng tăng tiến dần lên tới [yellow]1499%[] uy lực (phình đại tia [orange]150%[]).\n• Chuỗi phóng điện liên tục truyền dẫn qua 5 nấc [yellow]A->B->C->D->E[], tại vị trí mục tiêu cuối tự nổ thêm 5 tia phụ quét đơn vị máu cao nhất![]"); 
                b1D.width(320); b1D.get().setWrap(true); b1D.row(); b1D.padBottom(10);
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.thorium) >= reqMK2.thorium){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.thorium, reqMK2.thorium);
                        Fx.upgradeCore.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(220, 40);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12, 16, 12, 16);
                let b2T = b2.add("[purple]TRỌNG XUNG KÍCH KÍCH NỔ ĐỒNG TÂM (MK2b)[]"); b2T.row(); b2T.padBottom(6);
                let b2D = b2.add("[lightgray]Lõi cộng hương bão điện Chaos:\n• Tăng mạnh HP lên [green]3600[], tầm bắn tối đa [green]380[].\n• Tiêu tốn điện năng: [orange]850 đv/s[].\n• Tích lũy chu kỳ sạc [purple]5 điểm/giây[] khi tháp pháo bắn liên tục.\n• Đạt mốc [yellow]25 điểm[], lập tức kích hoạt [red]Xung Kích Kép Đồng Thời[]: phát nổ hủy diệt tại cả vị trí tâm pháo lẫn mục tiêu, phóng [orange]13 luồng sét Chaos[] càn quét loạn xạ![]"); 
                b2D.width(320); b2D.get().setWrap(true); b2D.row(); b2D.padBottom(10);
                b2.button("[orange]KÍCH HOẠT MK2b[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK3.copper && core.items.get(Items.plastanium) >= reqMK3.plastanium){
                        core.items.remove(Items.copper, reqMK3.copper); core.items.remove(Items.plastanium, reqMK3.plastanium);
                        Fx.bigShockwave.at(this.x, this.y); Effect.shake(6, 6, this.x, this.y);
                        this.configure(java.lang.Integer(3)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2b![]"); }
                })).size(220, 40);

                branchesTable.add(b1).width(340); branchesTable.row();
                let spaceCell = branchesTable.add(); spaceCell.height(18); spaceCell.row();
                branchesTable.add(b2).width(340);
let scroll = new ScrollPane(branchesTable);
scroll.setScrollingDisabled(true, false);
dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Tiến hóa tháp pháo Lyvervon");
        } 
        else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA CỦA NHÁNH ĐÃ CHỌN![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = "📊 THÔNG SỐ PHÁO LYVERVON: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 1) {
                title += "[yellow]Trạng thái gốc (MK1)[]";
                descStr = "[accent]⚙️ 1. CƠ CHẾ LOGIC CƠ BẢN:[]\n" +
                          "• Máu hệ thống: [lightgray]1,700 HP[] | Quy cách: [lightgray]4x4[]\n" +
                          "• Sát thương thô: [purple]10 đơn vị / xung điện sấm sét[]\n" +
                          "• Năng lượng yêu cầu: [lightning]100 điện / giây[] (Lưu trữ max: 5000)\n" +
                          "• Tầm bắn mặc định: [lightgray]300[] | Tốc độ nạp xả: [green]0.1 giây / phát[]\n" +
                          "• Vùng mù bắt buộc (Deadzone): [scarlet]80 ô xung quanh tâm pháo[]\n" +
                          "• Chế độ bắn mục tiêu: Chỉ quét mục tiêu [lightgray]Mặt Đất[]\n\n" +
                          "[orange]⚠ Giới hạn lắp đặt:[] Do lượng xung từ trường cực đại làm nhiễu loạn mạng điện, mỗi đội chỉ cho phép đặt tối đa [red]2 tháp pháo Lyvervon[] trên toàn bản đồ.";
            } else if (currentTier == 2) {
                title += "[cyan]CẤU HÌNH TIÊU CHUẨN (MK2)[]";
                descStr = "[accent]⚙️ 1. MÔ-ĐUN TĂNG TIẾN UY LỰC LÕI SẠC:[]\n" +
                          "• Kết cấu bền bỉ: [lightgray]2,950 HP[] | Tầm bắn mở rộng: [lightgray]350[]\n" +
                          "• Năng lượng yêu cầu: [lightning]1,200 điện / giây[] (Lưu trữ max: 5000)\n" +
                          "• Sát thương nền tia điện: [purple]8 Sát thương thô / xung kích[]\n" +
                          "• Tiến trình tăng ích hỏa lực liên tục tối đa [yellow]1499%[] rồi tự động Reset. Trong trạng thái xả hỏa lực, tia điện chính tỷ lệ phình to lên tối đa [orange]150%[] kích thước.\n\n" +
                          "[sky]⚡ 2. THUẬT TOÁN CHUỖI SÉT TRUYỀN DẪN ĐA MỤC TIÊU:[]\n" +
                          "• Khi tia chính đánh trúng đích đầu tiên, luồng xung điện tự động tìm kiếm nối mạch tuần tự qua 5 kẻ địch [lightgray]A -> B -> C -> D -> E[] trong tầm tỏa [lightgray]180[] ô.\n" +
                          "• Mỗi nấc truyền dẫn gây 70% sát thương tăng tiến hiện tại. Khi tia điện truyền chạm tới đích cuối cùng (vị trí E), nó kích hoạt một sóng chấn động Sonic nổ tung diện rộng và xả thêm [orange]5 tia sét phụ cực đại[] ghim thẳng vào 5 kẻ địch xung quanh có lượng HP cao nhất.";
            } else if (currentTier == 3) {
                title += "[purple]KÍCH NỔ ĐỒNG TÂM KÉP (MK2b)[]";
                descStr = "[accent]⚙️ 1. THÔNG SỐ NÂNG CẤP ĐẠI THỂ (MK2b):[]\n" +
                          "• Kết cấu tối đa: [lightgray]3,600 HP[] | Tầm bắn càn quét: [lightgray]380[]\n" +
                          "• Năng lượng yêu cầu: [lightning]850 điện / giây[] (Lưu trữ max: 5000)\n" +
                          "• Sát thương gốc tia chính: [purple]12 Sát thương thô / phát bắn[]\n" +
                          "• Chu kỳ tích nạp điểm sạc: Nhận [green]5 điểm / giây[] khi duy trì xả xích sét vào mục tiêu.\n\n" +
                          "[scarlet]💥 2. CƠ CHẾ KÍCH NỔ ĐỒNG TÂM KÉP BÃO ĐIỆN (CHAOS):[]\n" +
                          "• Khi thanh năng lượng sạc chạm ngưỡng tối đa [yellow]25/25 điểm[], lõi pháo tự giải phóng chuỗi phản ứng hủy diệt kích nổ [yellow]Kép Đồng Thời[]: tạo chấn chấn động nổ cực mạnh tại vị trí kẻ địch bị khóa và phát nổ ngược ngay tại chính tâm tháp pháo.\n" +
                          "• Mỗi chấn tâm vụ nổ gây lượng sát thương cực đại gấp 2.5 lần và bắn ra loạt chùm [orange]13 luồng sét phụ cấu trúc hỗn mang (Chaos)[] có biên độ gãy khúc rộng, càn quét toàn bộ quân địch trong bán kính 45 ô xung quanh.";
            }

let dialog = extend(BaseDialog, title, {});
            
            // Tích hợp ScrollPane lướt vuốt tại đây
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            
            let infoScroll = new ScrollPane(infoTable);
            infoScroll.setScrollingDisabled(true, false);
            dialog.cont.add(infoScroll).size(380, 400);
            
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem chi tiết thông số trạng thái");
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

        if(this.isShooting() && this.target != null && !this.target.dead){
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

        if(tier == 3 && this.isShooting() && this.target != null && !this.target.dead){
            this.mk3Timer += Time.delta;
            if(this.mk3Timer >= 60){
                this.mk3ChargePoints += 5;
                this.mk3Timer = 0;

                if(this.mk3ChargePoints >= 25){
                    this.mk3ChargePoints = 0; 
                    let mainDamageMK3 = 12; 
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
                            createLightningChaos(targetX, targetY, subEnemy.x, subEnemy.y, 2.5);
                            Fx.hitLancer.at(subEnemy.x, subEnemy.y, lyvervonColor);
                        } else {
                            createLightningChaos(targetX, targetY, extX, extY, 2.0);
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
                            createLightningChaos(turretX, turretY, subEnemy.x, subEnemy.y, 2.5);
                            Fx.hitLancer.at(subEnemy.x, subEnemy.y, lyvervonColor);
                        } else {
                            createLightningChaos(turretX, turretY, extX, extY, 2.0);
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

            if(this.isShooting() && this.target != null && !this.target.dead){
                if(Mathf.chance(0.12)){ 
                    Fx.smoke.at(this.x + Mathf.range(2), this.y + Mathf.range(2));
                }
                
                let fxColor = (tier == 3) ? lyvervonColor : lightningColor;
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

            let ballColor = (tier == 3) ? lyvervonColor : lightningColor;
            let currentBallSize = Interp.pow3Out.apply(0, 1, this.zoomAnimation);
            
            let baseRadius = 2.0 * currentBallSize; 
            if(this.isShooting() && this.zoomAnimation >= 0.9 && !Vars.state.isPaused()){
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
            
            let text = Math.floor(this.damageBonus) + "%";
            Draw.color(Color.white);
            Draw.alpha(this.zoomAnimation);
            let font = Fonts.outline; font.getData().setScale(0.11);
            font.draw(text, this.x, this.y + 5, Align.center);
            Draw.reset();
        }

        if(tier == 3 && this.mk3ChargePoints > 0){
            Draw.z(Layer.effect + 10);
            Draw.color(Color.white);
            let font = Fonts.outline; font.getData().setScale(0.12);
            let textPoints = "[purple]CHARGE:[] " + this.mk3ChargePoints + "/25";
            font.draw(textPoints, this.x, this.y + 18, Align.center);

            let barWidth = 28;
            let progress = this.mk3ChargePoints / 25;
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