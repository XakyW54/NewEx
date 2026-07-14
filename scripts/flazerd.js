print("FLAZERD - MK2B MILESTONE SUB-LASER SYSTEM LOADED");

const deadZone = 40; 
const laserColor = Color.valueOf("bf7fff"); 
const particleColor = Color.valueOf("e8bfff"); 
const greenLaserColor = Color.valueOf("33ff55"); 
const amberTextColor = Color.valueOf("ffaa00"); 

const reqMK2 = { copper: 4000, graphite: 4000 };
const reqMK3 = { lead: 4500, silicon: 5700 };

const turretTierMap = new ObjectMap();         
const turretChargeMap = new ObjectMap();       
const turretMilestoneMap = new ObjectMap();    
const turretCountdownMap = new ObjectMap();

// Bộ lưu trữ danh sách mục tiêu phụ cho MK2b ứng với các mốc điểm
const subTargetsMap = new ObjectMap(); 

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

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

function drawLaserRing(cx, cy, radiusX, radiusY, laserAngle, strokeWidth, color){
    Draw.color(color); Lines.stroke(strokeWidth);
    let steps = 16; let lastX = 0, lastY = 0;
    let cosA = Math.cos(laserAngle * Mathf.degRad); let sinA = Math.sin(laserAngle * Mathf.degRad);
    for(let i = 0; i <= steps; i++){
        let angle = (i * (360 / steps)) * Mathf.degRad;
        let lx = Math.cos(angle) * radiusX; let ly = Math.sin(angle) * radiusY;
        let rx = cx + (lx * cosA - ly * sinA); let ry = cy + (lx * sinA + ly * cosA);
        if(i > 0) Lines.line(lastX, lastY, rx, ry);
        lastX = rx; lastY = ry;
    }
}

function drawCurvedSubLaser(startX, startY, endX, endY, laserAngle, thickness, sideSign) {
    let dist = Mathf.dst(startX, startY, endX, endY);
    let steps = Math.floor(dist / 8); 
    if(steps < 2) return;

    let lastX = startX;
    let lastY = startY;

    for (let i = 1; i <= steps; i++) {
        let t = i / steps;
        let baseX = Mathf.lerp(startX, endX, t);
        let fillY = Mathf.lerp(startY, endY, t);
        let wave = Math.sin(t * Math.PI * 4 - Time.time * 0.25) * 8.0 * Math.sin(t * Math.PI) * sideSign;

        let curX = baseX + Angles.trnsx(laserAngle + 90, wave);
        let curY = fillY + Angles.trnsy(laserAngle + 90, wave);

        Lines.stroke(thickness);
        Lines.line(lastX, lastY, curX, curY);

        lastX = curX;
        lastY = curY;
    }
}

function isValidTarget(u, centerX, centerY, range) {
    return u && !u.dead && u.isAdded() && !u.isFlying() && Mathf.dst(centerX, centerY, u.x, u.y) <= range && Mathf.dst(centerX, centerY, u.x, u.y) >= deadZone;
}

const flazerdLaserBullet = extend(BulletType, {
    init(b){
        if(!b) return;
        b.data = {
            mainTargetId: -1,
            lastX: b.owner.x + Angles.trnsx(b.rotation(), 320),
            lastY: b.owner.y + Angles.trnsy(b.rotation(), 320)
        };
    },

    update(b){
        if(!b || !b.owner) return;
        
        let turretId = b.owner.id;
        let range = 320;
        let centerX = b.owner.x;
        let centerY = b.owner.y;

        if(!turretTierMap.containsKey(turretId)) turretTierMap.put(turretId, 1);
        if(!turretChargeMap.containsKey(turretId)) turretChargeMap.put(turretId, 0);
        if(!turretMilestoneMap.containsKey(turretId)) turretMilestoneMap.put(turretId, 0);
        if(!turretCountdownMap.containsKey(turretId)) turretCountdownMap.put(turretId, -1);
        if(!subTargetsMap.containsKey(turretId)) subTargetsMap.put(turretId, new java.util.ArrayList());

        let tier = turretTierMap.get(turretId);
        let currentPoints = turretChargeMap.get(turretId);
        let countdown = turretCountdownMap.get(turretId);
        let subTargetsList = subTargetsMap.get(turretId);

        let baseDamage = 33;
        if(tier == 2) baseDamage = 33 * 3.5; 
        else if(tier == 3) baseDamage = 33 * 6.0; 

        // 1 điểm sạc tăng 2% sát thương cho cấu hình mới của tháp pháo
        let damageBonusPercent = currentPoints * 0.02; 
        let currentTickDamage = baseDamage * (1 + damageBonusPercent);

        // --- HỆ THỐNG KHÓA MỤC TIÊU CHO TIA CHÍNH ---
        let mainTarget = null;
        if(b.data.mainTargetId != -1){
            let potential = Groups.unit.getByID(b.data.mainTargetId);
            if(isValidTarget(potential, centerX, centerY, range)){
                mainTarget = potential;
            }
        }

        if(!mainTarget){
            mainTarget = Units.closestTarget(b.team, centerX, centerY, range, u => isValidTarget(u, centerX, centerY, range), t => true);
            if(mainTarget) b.data.mainTargetId = mainTarget.id;
            else b.data.mainTargetId = -1;
        }

        if(mainTarget){
            b.data.lastX = mainTarget.x;
            b.data.lastY = mainTarget.y;

            mainTarget.damage(currentTickDamage / 60);

            // Xử lý sạc tụ năng lượng %
            if(currentPoints >= 200){
                if(countdown == -1){
                    turretCountdownMap.put(turretId, 300); 
                } else if(countdown > 0){
                    countdown--;
                    turretCountdownMap.put(turretId, countdown);
                } else if(countdown == 0){
                    currentPoints = 0;
                    turretChargeMap.put(turretId, 0);
                    turretMilestoneMap.put(turretId, 0);
                    turretCountdownMap.put(turretId, -1);
                    subTargetsList.clear();
                }
            } else {
                let chargeSpeedMultiplier = (1 + Math.pow(currentPoints / 100, 2)) * 1.0; 
                let speedBonus = (tier == 2) ? 1.5 : 1.0; 
                
                currentPoints += (1 / 60) * chargeSpeedMultiplier * speedBonus;
                if(currentPoints >= 200) {
                    currentPoints = 200;
                    turretCountdownMap.put(turretId, 300); 
                }
                turretChargeMap.put(turretId, currentPoints);
            }

            // --- CHỈNH SỬA CHO MK2B (TIER 3): CƠ CHẾ TIA PHỤ THEO MỐC 20 -> 200 SẠC ---
            if(tier == 3) {
                subTargetsList.clear(); // Làm mới các tia phụ mỗi tick

                // Xác định số lượng tia phụ tối đa được mở dựa trên mốc điểm hiện tại
                // Điểm sạc đạt mốc nào, tháp pháo kích hoạt mốc đó (Ví dụ: 85 điểm sạc => mở 4 tia phụ)
                let activeMilestones = 0;
                let milestoneLimits = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
                for(let k = 0; k < milestoneLimits.length; k++) {
                    if(currentPoints >= milestoneLimits[k]) {
                        activeMilestones++;
                    }
                }

                if(activeMilestones > 0) {
                    // Thu thập toàn bộ kẻ địch trong tầm bắn trừ mục tiêu chính
                    let poolEnemies = new java.util.ArrayList();
                    Units.nearbyEnemies(b.team, centerX - range, centerY - range, range * 2, range * 2, u => {
                        if(isValidTarget(u, centerX, centerY, range) && u.id != mainTarget.id){
                            poolEnemies.add(u);
                        }
                    });

                    // Sắp xếp ưu tiên mục tiêu gần điểm va chạm của tia chính trước
                    if(poolEnemies.size() > 0) {
                        poolEnemies.sort((o1, o2) => {
                            let d1 = Mathf.dst(mainTarget.x, mainTarget.y, o1.x, o1.y);
                            let d2 = Mathf.dst(mainTarget.x, mainTarget.y, o2.x, o2.y);
                            return d1 < d2 ? -1 : (d1 > d2 ? 1 : 0);
                        });

                        // Sát thương của tia phụ bằng chính xác 50% sát thương tia chính đang có
                        let subDamageTick = (currentTickDamage * 0.5) / 60;
                        let countToShoot = Math.min(activeMilestones, poolEnemies.size());

                        for(let i = 0; i < countToShoot; i++) {
                            let chosen = poolEnemies.get(i);
                            subTargetsList.add({ id: chosen.id, x: chosen.x, y: chosen.y });

                            // Gây sát thương liên tục lên mục tiêu phụ tương ứng
                            chosen.damage(subDamageTick);

                            if(Mathf.chance(0.15)){
                                Fx.hitLancer.at(chosen.x, chosen.y, greenLaserColor);
                            }
                        }
                    }
                }
            }

            if(Mathf.chance(0.25)){
                Fx.hitLancer.at(mainTarget.x, mainTarget.y, laserColor);
            }
        } else {
            b.data.mainTargetId = -1;
            subTargetsList.clear();

            b.data.lastX = centerX + Angles.trnsx(b.rotation(), range);
            b.data.lastY = centerY + Angles.trnsy(b.rotation(), range);

            turretCountdownMap.put(turretId, -1);
            if(currentPoints > 0){
                currentPoints -= (3 / 60); 
                if(currentPoints < 0) currentPoints = 0;
                turretChargeMap.put(turretId, currentPoints);
                if(currentPoints == 0) turretMilestoneMap.put(turretId, 0);
            }
        }
    },

    draw(b){
        if(!b || !b.data || !b.owner) return;

        let turretId = b.owner.id;
        let tier = turretTierMap.containsKey(turretId) ? turretTierMap.get(turretId) : 1;
        let startX = b.owner.x; 
        let startY = b.owner.y;
        let endX = b.data.lastX; let endY = b.data.lastY;
        let dist = Mathf.dst(startX, startY, endX, endY);
        let laserAngle = Angles.angle(startX, startY, endX, endY);

        let currentPoints = turretChargeMap.containsKey(turretId) ? turretChargeMap.get(turretId) : 0;
        let countdown = turretCountdownMap.containsKey(turretId) ? turretCountdownMap.get(turretId) : -1;

        let damageBonusPercent = currentPoints * 0.02; 
        let thicknessScale = 1.0 + (damageBonusPercent * 0.5); 

        // Vẽ trục laser chính tâm
        Draw.color(laserColor); Lines.stroke(3.6 * thicknessScale); Lines.line(startX, startY, endX, endY);
        Draw.color(Color.white); Lines.stroke(1.2 * thicknessScale); Lines.line(startX, startY, endX, endY);

        // CHUẨN MK2 (Tier 2): Thêm 2 tia phụ uốn lượn hình sin chạy dọc bám đối xứng trục chính
        if (tier == 2 && currentPoints > 2) {
            Draw.color(particleColor);
            let subThickness = 0.8 * thicknessScale;
            drawCurvedSubLaser(startX, startY, endX, endY, laserAngle, subThickness, 1.0);  
            drawCurvedSubLaser(startX, startY, endX, endY, laserAngle, subThickness, -1.0); 
        }

        // CHUẨN MK2B (Tier 3): Vẽ chùm tia phụ rẽ nhánh từ tia chính bắn sang các mục tiêu thuộc mốc điểm kích hoạt
        if (tier == 3) {
            let subTargetsList = subTargetsMap.get(turretId);
            if(subTargetsList && subTargetsList.size() > 0){
                for(let m = 0; m < subTargetsList.size(); m++){
                    let node = subTargetsList.get(m);
                    
                    // Vẽ tia phụ màu xanh lá đặc trưng phóng ra từ đầu va chạm của tia chính
                    Draw.color(greenLaserColor);
                    Lines.stroke(1.8 * thicknessScale);
                    Lines.line(endX, endY, node.x, node.y);
                    
                    Draw.color(Color.white);
                    Lines.stroke(0.5 * thicknessScale);
                    Lines.line(endX, endY, node.x, node.y);
                }
            }
        }

        if(currentPoints > 2) {
            let scaleFactor = 1 + (currentPoints / 240);
            let distortionFactor = Math.max(0.05, 1.0 - (currentPoints / 200.0)); 
            
            let ringCount = 3;
            for(let r = 0; r < ringCount; r++){
                let ringProgress = ((Time.time * 0.8) + (r * (dist / ringCount))) % dist;
                let rt = ringProgress / dist;
                let rx = Mathf.lerp(startX, endX, rt); let ry = Mathf.lerp(startY, endY, rt);
                
                let rxSize = 1.5 * scaleFactor;
                let rySize = 4.0 * scaleFactor * distortionFactor;
                let strokeWidth = 0.4 * Mathf.sin(rt * Math.PI) * thicknessScale;

                drawLaserRing(rx, ry, rxSize, rySize, laserAngle, strokeWidth, laserColor);
            }
        }

        if(currentPoints > 0) {
            Draw.z(Layer.effect + 10); 
            Draw.color(Color.white); 
            
            let font = Fonts.outline;
            font.getData().setScale(0.12); 
            let displayString = Math.floor(currentPoints) + "%"; 
            
            if(countdown > 0) {
                if (Math.floor(Time.time / 6) % 2 == 0) {
                    displayString = "[scarlet]" + Math.ceil(countdown / 60) + "s[]";
                } else {
                    displayString = "[white]" + Math.ceil(countdown / 60) + "s[]";
                }
            }
            
            font.draw(displayString, b.owner.x, b.owner.y, Align.center);
            font.getData().setScale(1.0); 
        }
        Draw.reset();
    }
});

flazerdLaserBullet.speed = 0;
flazerdLaserBullet.damage = 33; 
flazerdLaserBullet.lifetime = 12; 
flazerdLaserBullet.collides = false;

const flazerd = extend(PowerTurret, "flazerd", {
    init(){ this.super$init(); },
    load(){
        this.super$load();
        this.bodyRegion = Core.atlas.find(this.name + "-body");
        this.downxRegion = Core.atlas.find(this.name + "-downx");
        this.a1Region = Core.atlas.find(this.name + "-a1");
        this.a2Region = Core.atlas.find(this.name + "-a2");
    },
    drawPlace(x, y, rotation, valid){
        this.super$drawPlace(x, y, rotation, valid);
        Draw.color(Pal.remove); Lines.stroke(2);
        dashCircle(x * Vars.tilesize, y * Vars.tilesize, deadZone, Pal.remove);
        Draw.reset();        
    }
});

flazerd.health = 2300;
flazerd.size = 4;
flazerd.targetAir = false;
flazerd.targetGround = true;
flazerd.range = 320;
flazerd.reload = 10; 
flazerd.shootType = flazerdLaserBullet;
flazerd.recoil = 0; 
flazerd.consumePower(22);
flazerd.configurable = true;
flazerd.canControl = false;

flazerd.config(java.lang.Integer, packCons2((tile, value) => {
    if(tile != null && value != null) {
        let turretId = tile.id;
        let valInt = (typeof value.intValue === "function") ? value.intValue() : Number(value);
        
        turretTierMap.put(turretId, valInt);
        if(valInt == 1) tile.health = 2300;
        else if(valInt == 2) tile.health = 3500;
        else if(valInt == 3) tile.health = 4200;
    }
}));

flazerd.buildType = () => extend(PowerTurret.PowerTurretBuild, flazerd, {
    wingsOffset: 0, 

    canControl() { return false; },

    placed(){
        this.super$placed();
        let count = 0;
        Groups.build.each(b => { 
            if(b.block == flazerd && b.team == this.team) count++;
        });
        if(count > 2){
            Call.sendMessage("[purple]Flazerd Giới hạn:[] Chỉ đặt tối đa 2 tháp pháo!");
            this.kill(); 
        }
        this.wingsOffset = 0;
    },

    destroyed(){
        this.super$destroyed();
        let turretId = this.id;
        turretTierMap.remove(turretId);
        turretChargeMap.remove(turretId);
        turretMilestoneMap.remove(turretId);
        turretCountdownMap.remove(turretId);
        subTargetsMap.remove(turretId);
    },

    updateTile(){
        this.super$updateTile();
        let targetRadius = 320;
        let hasTarget = Units.closestTarget(this.team, this.x, this.y, targetRadius, u => !u.dead && !u.type.flying && Mathf.dst(this.x, this.y, u.x, u.y) >= deadZone, b => true) != null;

        if(hasTarget){
            this.wingsOffset = Mathf.lerpDelta(this.wingsOffset, 1.0, 0.15);
        } else {
            this.wingsOffset = Mathf.lerpDelta(this.wingsOffset, 0.0, 0.1);
        }
    },

    draw() {
        let baseRegion = Core.atlas.find(flazerd.basePrefix + "block-" + flazerd.size);
        if (baseRegion && baseRegion.found()) {
            Draw.rect(baseRegion, this.x, this.y);
        } else {
            this.super$draw();
        }

        let rad = this.rotation * Mathf.degRad;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);

        if (flazerd.bodyRegion && flazerd.bodyRegion.found()) {
            Draw.rect(flazerd.bodyRegion, this.x, this.y, this.rotation);
        }

        if (flazerd.downxRegion && flazerd.downxRegion.found()) {
            Draw.rect(flazerd.downxRegion, this.x, this.y, this.rotation);
        }

        let wingBackOffset = -4.0 * this.wingsOffset; 
        let combatSideMove = 4.0 * this.wingsOffset;

        if (flazerd.a1Region && flazerd.a1Region.found()) {
            let a1x = this.x + (wingBackOffset * cos) - (combatSideMove * sin);
            let a1y = this.y + (wingBackOffset * sin) + (combatSideMove * cos);
            Draw.rect(flazerd.a1Region, a1x, a1y, this.rotation);
        }

        if (flazerd.a2Region && flazerd.a2Region.found()) {
            let a2x = this.x + (wingBackOffset * cos) + (combatSideMove * sin);
            let a2y = this.y + (wingBackOffset * sin) - (combatSideMove * cos);
            Draw.rect(flazerd.a2Region, a2x, a2y, this.rotation);
        }

        Draw.reset();
    },

    buildConfiguration(table) {
        table.clear(); table.row();
        let turretId = this.id;
        if(!turretTierMap.containsKey(turretId)) turretTierMap.put(turretId, 1);
        let tier = turretTierMap.get(turretId);

        if(tier == 1) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Flazerd", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentcopper = core.items.get(Items.copper);
                    let currentgraphite = core.items.get(Items.graphite);
                    let currentlead = core.items.get(Items.lead);
                    let currentsilicon = core.items.get(Items.silicon);
                    
                    let copColor = currentcopper >= reqMK2.copper ? "[green]" : "[red]";
                    let graColor = currentgraphite >= reqMK2.graphite ? "[green]" : "[red]";
                    
                    let leaColor = currentlead >= reqMK3.lead ? "[green]" : "[red]";
                    let silColor = currentsilicon >= reqMK3.silicon ? "[green]" : "[red]";
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[]\n" +
                           " • Đồng: " + copColor + currentcopper + "[] / " + reqMK2.copper + "\n" +
                           " • Graphite: " + graColor + currentgraphite + "[] / " + reqMK2.graphite + "\n" +
                           "[purple]Nhánh MK2B:[]\n" +
                           " • Chì: " + leaColor + currentlead + "[] / " + reqMK3.lead + "\n" +
                           " • Silicon: " + silColor + currentsilicon + "[] / " + reqMK3.silicon;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // Nhánh 1: MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("Mô-đun mạch xung hỏa lực bứt tốc:\n" +
                                 " [white]• Tốc độ sạc tụ gia tốc vượt bậc đạt ngưỡng [yellow]150%[].[]\n" +
                                 " [white]• Tăng tiến [red]+2% Sát thương[] tổng ứng với mỗi 1% năng lượng sạc.[]\n" +
                                 " [white]• Gia cố [green]+3,500 Máu[] và mở rộng tầm phát xạ lên [green]340 pixel[].[]\n" +
                                 " [white]• Kích hoạt cặp laze sóng uốn cong đối xứng dọc trục chính.");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.graphite) >= reqMK2.graphite){
                        core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.graphite, reqMK2.graphite);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(new java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfoToast("[red]Không đủ tài nguyên cho nhánh MK2![]", 2); }
                })).size(180, 38);

                // Nhánh 2: MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("Lõi hội tụ đa chùm phổ hủy diệt tầng cao:\n" +
                                 " [white]• Siêu gia cố Máu đạt mốc cực đại [green]4,200 Máu[] (Tầm bắn [orange]320 pixel[]).[]\n" +
                                 " [white]• Tự động kích hoạt phóng thêm các tia laze phụ khi điểm sạc vượt các mốc [yellow]20 -> 200[].[]\n" +
                                 " [white]• Mở rộng tối đa lên tới 10 chùm tia quang phổ phân rã mục tiêu xung quanh.[]\n" +
                                 " [white]• Mỗi tia phụ gây lượng sát thương bằng [red]chính xác 50%[] của tia laze chính.");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.lead) >= reqMK3.lead && core.items.get(Items.silicon) >= reqMK3.silicon){
                        core.items.remove(Items.lead, reqMK3.lead); core.items.remove(Items.silicon, reqMK3.silicon);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(new java.lang.Integer(3)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfoToast("[red]Không đủ tài nguyên cho nhánh MK2B![]", 2); }
                })).size(180, 38);

                // Xếp các bảng nhánh theo hàng dọc chuẩn Lavunder
                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Tiến hóa pháo Flazerd");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG FLAZERD ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // --- NÚT THÔNG TIN (PHONG CÁCH BỐ CỰC ĐẶC TRƯNG CỦA DOR) ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Flazerd: ";
            let descStr = "";
            let currentTier = turretTierMap.containsKey(this.id) ? turretTierMap.get(this.id) : 1;

            if (currentTier == 1) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,300[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]320 pixel[]\n" +
                          "Sát thương liên tục:[] [white]33.00 hỏa lực/s[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 2 cấu trúc/đội[]\n\n" +
                          "[sky]⚡ CƠ CHẾ HOẠT ĐỘNG NHIỆT MẠCH:[]\n" +
                          "• [lightgray]Phát xạ mục tiêu:[] Phóng chùm tia laze đơn liên tục bám khóa chặt kẻ địch mặt đất.\n" +
                          "• [lightgray]Màn hình Holyder:[] Giao diện kỹ thuật số hiển thị thời gian thực số % sạc tụ lõi tâm.\n" +
                          "• [lightgray]Tích tụ năng lượng:[] Giới hạn sạc mở rộng lên [yellow]200%[] giúp tăng tiến dần sát thương tổng.";
            } 
            else if (currentTier == 2) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]3,500 [lime](+52%)[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]340 pixel [lime](+6.25%)[]\n" +
                          "Sát thương cơ bản:[] [white]115.50 hỏa lực/s[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 2 cấu trúc/đội[]\n\n" +
                          "[lime]⚡ CƠ CHẾ HOẠT ĐỘNG NHIỆT MẠCH:[]\n" +
                          "• [lightgray]Mạch hỏa tốc:[] Tốc độ sạc tụ năng lượng gia tốc vượt bậc đạt ngưỡng đỉnh [yellow]150%[].\n" +
                          "• [lightgray]Xung lực hỏa lực:[] Cứ mỗi 1% điểm sạc tích lũy cộng trực tiếp [red]+2% sát thương[] tổng.\n" +
                          "• [lightgray]Laser Helix:[] Kích hoạt thêm 2 tia sóng phụ uốn lượn hình sin bám dọc đối xứng hai bên trục chính.\n" +
                          "• [lightgray]Xả quá tải an toàn:[] Tự động đếm ngược và reset điểm về 0 sau khi duy trì đỉnh năng lượng.";
            } 
            else if (currentTier == 3) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]4,200 [lime](+82.6%)[]\n" +
                          "Tầm bắn hiệu dụng:[] [orange]320 pixel[]\n" +
                          "Sát thương cơ bản:[] [white]198.00 hỏa lực/s[]\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 2 cấu trúc/đội[]\n\n" +
                          "[purple]🔥 CƠ CHẾ HOẠT ĐỘNG NHIỆT MẠCH:[]\n" +
                          "• [lightgray]Phân chùm đa mốc:[] Tách thêm tia laze phụ xanh lá bắn phá mục tiêu xung quanh khi điểm sạc vượt qua các mốc [yellow]20, 40, 60, 80, 100, 120, 140, 160, 180, 200[].\n" +
                          "• [lightgray]Hỏa lực rẽ nhánh:[] Mỗi tia phụ rẽ nhánh tự động gây sát thương bằng [red]chính xác 50%[] hỏa lực tia chính.\n" +
                          "• [lightgray]Xả tụ thông minh:[] Tự động thiết lập lại điểm năng lượng về 0 sau chu kỳ bắn để chuẩn bị cho loạt xung năng mới.";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem thông số chi tiết hệ thống");
    },

    findTarget(){
        this.target = Units.closestTarget(this.team, this.x, this.y, 320, u => !u.dead && !u.type.flying && Mathf.dst(this.x, this.y, u.x, u.y) >= deadZone, b => true);
    },
    drawSelect(){ this.super$drawSelect(); dashCircle(this.x, this.y, deadZone, Pal.remove); },
    write(write){ this.super$write(write); write.b(turretTierMap.containsKey(this.id) ? turretTierMap.get(this.id) : 1); },
    read(read, revision){ this.super$read(read, revision); turretTierMap.put(this.id, read.b()); }
});

exports.flazerd = flazerd;
