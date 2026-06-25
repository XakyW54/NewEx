print("LAVUNDER - ULTIMATE BALANCE & OVERLOAD SYSTEM (MK2 & MK2B) LOADED");

const deadZone = 40; 
const laserColor = Color.valueOf("bf7fff"); 
const particleColor = Color.valueOf("e8bfff"); 
const greenLaserColor = Color.valueOf("33ff55"); 

// Định nghĩa yêu cầu tài nguyên nâng cấp từ kho lõi
const reqMK2 = { titanium: 800, silicon: 600 };
const reqMK3 = { titanium: 3000, silicon: 2500 };

// Các bảng lưu trữ dữ liệu đồng bộ hệ thống theo ID tháp pháo
const turretTierMap = new ObjectMap();         
const turretChargeMap = new ObjectMap();       
const turretBurstTimerMap = new ObjectMap();   
const turretMilestoneMap = new ObjectMap();    

// Bộ quản lý hiển thị và kích nổ chuỗi Tia Laser Phụ trễ 0.5s của MK2b
const mk3TripleExplosionMap = new ObjectMap(); 
// Bảng theo dõi thời gian vẽ hiển thị đồ họa cho tia la-zer xanh lá phụ
const greenLaserRenderMap = new ObjectMap();

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

// 1. LOGIC VÀ ĐỒ HỌA ĐẠN LASER PHÂN NHÁNH
const lavunderLaserBullet = extend(BulletType, {
    init(b){
        if(!b) return;
        b.data = {
            targetUnit: null,
            lastX: b.x + Angles.trnsx(b.rotation(), 320),
            lastY: b.y + Angles.trnsy(b.rotation(), 320)
        };
    },

    update(b){
        if(!b || !b.owner) return;
        
        let turretId = b.owner.id;
        let range = 320;

        // Khởi tạo an toàn dữ liệu tháp pháo
        if(!turretTierMap.containsKey(turretId)) turretTierMap.put(turretId, 1);
        if(!turretChargeMap.containsKey(turretId)) turretChargeMap.put(turretId, 0);
        if(!turretBurstTimerMap.containsKey(turretId)) turretBurstTimerMap.put(turretId, 0);
        if(!turretMilestoneMap.containsKey(turretId)) turretMilestoneMap.put(turretId, 0);

        let tier = turretTierMap.get(turretId);
        let currentPoints = turretChargeMap.get(turretId);
        let burstTimer = turretBurstTimerMap.get(turretId);

        if(burstTimer > 0){
            burstTimer--;
            turretBurstTimerMap.put(turretId, burstTimer);
        }

        // Đếm ngược thời gian hiển thị tia laser phụ màu xanh lá
        if(greenLaserRenderMap.containsKey(turretId)){
            let gData = greenLaserRenderMap.get(turretId);
            if(gData.duration > 0){
                gData.duration--;
            } else {
                greenLaserRenderMap.remove(turretId);
            }
        }

        // --- CƠ CHẾ TÍNH TOÁN SÁT THƯƠNG GỐC CẬP NHẬT THEO TIỀN TỐ TIẾN HÓA ---
        let baseDamage = 33;
        if(tier == 2){
            baseDamage = 33 * 3.5; // MK2: Tăng 250% (Gốc 100% + 250% = 350% -> x3.5)
        } else if(tier == 3){
            baseDamage = 33 * 6.0; // MK2b: Giảm 40% sát thương gốc so với bản trước (Còn lại x6.0 sát thương gốc ban đầu)
        }
        let currentTickDamage = baseDamage * (1 + (currentPoints / 100));

        // XỬ LÝ CHUỖI 3 TIA LASER PHỤ MỐC 100 CỦA MK2b (2400 dmg + 300% Sát thương gốc)
        if(mk3TripleExplosionMap.containsKey(turretId)){
            let exData = mk3TripleExplosionMap.get(turretId);
            if(exData.count > 0){
                exData.timer--;
                if(exData.timer <= 0){
                    greenLaserRenderMap.put(turretId, {
                        x: exData.x,
                        y: exData.y,
                        duration: 12
                    });

                    Fx.scatheExplosion.at(exData.x, exData.y);
                    Effect.shake(6, 6, exData.x, exData.y);
                    
                    let targetRadius = 40;
                    // Tính sát thương mốc 100 của MK2b: 2400 + 300% Sát thương gốc thực tế
                    let m100DamageValue = 2400 + (currentTickDamage * 3.0);

                    Units.nearbyEnemies(b.team, exData.x - targetRadius, exData.y - targetRadius, targetRadius * 2, targetRadius * 2, u => {
                        if(u && !u.dead && !u.isFlying() && Mathf.dst(exData.x, exData.y, u.x, u.y) <= targetRadius){
                            u.damage(m100DamageValue);
                        }
                    });
                    
                    exData.count--;
                    exData.timer = 30; // Khoảng cách chuỗi bắn trễ 0.5s (30 ticks)
                }
            } else {
                mk3TripleExplosionMap.remove(turretId);
            }
        }

        let target = Units.closestTarget(
            b.team, b.x, b.y, range,
            u => u && !u.dead && !u.isFlying() && Mathf.dst(b.x, b.y, u.x, u.y) >= deadZone,
            t => true
        );

        if(target){
            b.data.targetUnit = target;
            b.data.lastX = target.x;
            b.data.lastY = target.y;

            // Gây sát thương liên tục lên mục tiêu chính diện
            target.damage(currentTickDamage / 60);

            // Xử lý sạc tích lũy điểm hỏa lực
            if(currentPoints < 100){
                let chargeSpeedMultiplier = 1 + Math.pow(currentPoints / 50, 2);
                let speedBonus = (tier == 2) ? 1.8 : 1.0; 
                
                currentPoints += (1 / 60) * chargeSpeedMultiplier * speedBonus;
                
                // --- NHÁNH MK1 & MK2 ---
                if(tier == 1 || tier == 2){
                    if(currentPoints >= 100){
                        // MK2 Tinh Chỉnh: Đạt mốc 100 reset về 0, xúc xắc 50% tỷ lệ cộng ngay 80 điểm!
                        let refundPoints = (tier == 2 && Mathf.chance(0.50)) ? 80 : 0;
                        currentPoints = refundPoints;
                        
                        turretBurstTimerMap.put(turretId, 14);

                        let explosionRadius = 40;
                        let hpPercent = (tier == 2) ? 0.02 : 0.01; 
                        let flatDamage = (tier == 2) ? 320 : 100; 

                        Units.nearbyEnemies(b.team, target.x - explosionRadius, target.y - explosionRadius, explosionRadius * 2, explosionRadius * 2, u => {
                            if(u && !u.dead && !u.isFlying() && Mathf.dst(target.x, target.y, u.x, u.y) <= explosionRadius){
                                u.damage((u.maxHealth * hpPercent) + flatDamage);
                            }
                        });
                        
                        Fx.scatheExplosion.at(target.x, target.y);
                        Effect.shake(tier == 2 ? 8 : 6, tier == 2 ? 8 : 6, target.x, target.y);
                    }
                } 
                // --- NHÁNH MK2b ---
                else if(tier == 3) {
                    // Xử lý mốc phụ: 20, 40, 60, 80 (800 DMG + 1500% Sát thương gốc)
                    let milestones = [20, 40, 60, 80];
                    let lastScannedMilestone = turretMilestoneMap.get(turretId);

                    for(let i = 0; i < milestones.length; i++){
                        let stone = milestones[i];
                        if(currentPoints >= stone && lastScannedMilestone < stone){
                            turretMilestoneMap.put(turretId, stone);
                            
                            if(Mathf.chance(0.70)){
                                greenLaserRenderMap.put(turretId, {
                                    x: target.x,
                                    y: target.y,
                                    duration: 12
                                });

                                Fx.scatheExplosion.at(target.x, target.y);
                                let targetRadius = 40;
                                // Sát thương mốc phụ: 800 + 1500% (tức là nhân với 15) sát thương hiện tại
                                let subMilestoneDamage = 800 + (currentTickDamage * 15.0);

                                Units.nearbyEnemies(b.team, target.x - targetRadius, target.y - targetRadius, targetRadius * 2, targetRadius * 2, u => {
                                    if(u && !u.dead && !u.isFlying() && Mathf.dst(target.x, target.y, u.x, u.y) <= targetRadius){
                                        u.damage(subMilestoneDamage);
                                    }
                                });
                            }
                        }
                    }

                    // Xử lý khi đạt mốc cực đại 100 điểm của MK2b
                    if(currentPoints >= 100){
                        currentPoints = 0;
                        turretMilestoneMap.put(turretId, 0); 
                        turretBurstTimerMap.put(turretId, 14);

                        // Phát bắn phát đầu tiên mốc 100 (Áp dụng chỉ số phát nổ của chuỗi 3 loạt)
                        if(Mathf.chance(0.70)){
                            greenLaserRenderMap.put(turretId, {
                                x: target.x,
                                y: target.y,
                                duration: 12
                            });

                            Fx.scatheExplosion.at(target.x, target.y);
                            let targetRadius = 40;
                            let firstBlastDamage = 2400 + (currentTickDamage * 3.0);

                            Units.nearbyEnemies(b.team, target.x - targetRadius, target.y - targetRadius, targetRadius * 2, targetRadius * 2, u => {
                                if(u && !u.dead && !u.isFlying() && Mathf.dst(target.x, target.y, u.x, u.y) <= targetRadius){
                                    u.damage(firstBlastDamage);
                                }
                            });
                        }

                        // Điều chỉnh tỷ lệ kích hoạt lên 80% cho chuỗi 3 loạt xả tia laser phụ
                        if(Mathf.chance(0.80)){
                            mk3TripleExplosionMap.put(turretId, {
                                count: 3,     
                                timer: 30,    
                                x: target.x,
                                y: target.y
                            });
                        }
                    }
                }
                turretChargeMap.put(turretId, currentPoints);
            }

            if(Mathf.chance(0.25)){
                Fx.hitLancer.at(target.x, target.y, laserColor);
            }
        } else {
            b.data.targetUnit = null;
            b.data.lastX = b.x + Angles.trnsx(b.rotation(), range);
            b.data.lastY = b.y + Angles.trnsy(b.rotation(), range);

            if(currentPoints > 0){
                currentPoints -= (2 / 60); 
                if(currentPoints < 0) currentPoints = 0;
                turretChargeMap.put(turretId, currentPoints);
                if(currentPoints == 0) turretMilestoneMap.put(turretId, 0);
            }
        }
    },

    draw(b){
        if(!b || !b.data || !b.owner) return;

        let turretId = b.owner.id;
        let startX = b.x; let startY = b.y;
        let endX = b.data.lastX; let endY = b.data.lastY;
        let dist = Mathf.dst(startX, startY, endX, endY);
        let laserAngle = Angles.angle(startX, startY, endX, endY);

        let currentPoints = turretChargeMap.containsKey(turretId) ? turretChargeMap.get(turretId) : 0;
        let burstTimer = turretBurstTimerMap.containsKey(turretId) ? turretBurstTimerMap.get(turretId) : 0;

        // ĐỒ HỌA TIA LASER PHỤ MÀU XANH LÁ (Giảm kích thước xuống còn tầm ~2 ô gạch -> Stroke = 16)
        if(greenLaserRenderMap.containsKey(turretId)){
            let gData = greenLaserRenderMap.get(turretId);
            let zoom = gData.duration / 12;
            
            Draw.color(greenLaserColor);
            Lines.stroke(16.0 * zoom); // Điều chỉnh giảm từ 24 xuống 16 (tương thích đúng chiều rộng 2 ô)
            Lines.line(startX, startY, gData.x, gData.y);
            
            Draw.color(Color.white);
            Lines.stroke(5.0 * zoom); 
            Lines.line(startX, startY, gData.x, gData.y);
        }

        // Vẽ tia bộc phá năng lượng mốc 100 thường
        if(burstTimer > 0){
            let zoomFactor = burstTimer / 14; 
            Draw.color(Color.white);
            Lines.stroke(9.0 * zoomFactor); 
            Lines.line(startX, startY, endX, endY);
        } else {
            Draw.color(laserColor); Lines.stroke(0.3); Lines.line(startX, startY, endX, endY);
            Draw.color(Color.white); Lines.stroke(0.1); Lines.line(startX, startY, endX, endY);
        }

        // GIỮ NGUYÊN HOÀN TOÀN CẤU TRÚC ĐỒ HỌA HẠT VÀ NHẪN NĂNG LƯỢNG
        if(currentPoints > 2) {
            let scaleFactor = 1 + (currentPoints / 180); 
            let ringCount = 3;
            for(let r = 0; r < ringCount; r++){
                let ringProgress = ((Time.time * 0.8) + (r * (dist / ringCount))) % dist;
                let rt = ringProgress / dist;
                let rx = Mathf.lerp(startX, endX, rt); let ry = Mathf.lerp(startY, endY, rt);
                drawLaserRing(rx, ry, 1.5 * scaleFactor, 4.0 * scaleFactor, laserAngle, 0.4 * Mathf.sin(rt * Math.PI), laserColor);
            }

            let particleCount = Math.floor(Mathf.lerp(8, 48, currentPoints / 100));
            Draw.color(particleColor);
            for(let i = 0; i < particleCount; i++){
                let speedSeed = i * 17.3 + (turretId % 11);
                let progress = ((Time.time * (0.4 + (i % 3) * 0.25)) + (i * (dist / particleCount))) % dist;
                let t = progress / dist;
                let px = Mathf.lerp(startX, endX, t); let py = Mathf.lerp(startY, endY, t);
                let currentAngle = (Time.time * (1.0 + (i % 4) * 0.7)) + (i * (360 / particleCount));
                let rad = currentAngle * Mathf.degRad;
                let ox = px + ((Math.cos(rad) * 1.2 * scaleFactor) * Math.cos(laserAngle * Mathf.degRad) - (Math.sin(rad) * 3.5 * scaleFactor) * Math.sin(laserAngle * Mathf.degRad));
                let oy = py + ((Math.cos(rad) * 1.2 * scaleFactor) * Math.sin(laserAngle * Mathf.degRad) + (Math.sin(rad) * 3.5 * scaleFactor) * Math.cos(laserAngle * Mathf.degRad));
                Fill.circle(ox, oy, 0.4 + ((i % 3) * 0.2)); 
            }
        }
        Draw.reset();
    }
});

lavunderLaserBullet.speed = 0;
lavunderLaserBullet.damage = 33; 
lavunderLaserBullet.lifetime = 12; 
lavunderLaserBullet.collides = false;

// 2. KHỞI TẠO KHỐI THÁP PHÁO 
const lavunder = extend(PowerTurret, "lavunder", {
    init(){ this.super$init(); },
    drawPlace(x, y, rotation, valid){
        this.super$drawPlace(x, y, rotation, valid);
        Draw.color(Pal.remove); Lines.stroke(2);
        dashCircle(x * Vars.tilesize, y * Vars.tilesize, deadZone, Pal.remove);
        Draw.reset();        
    }
});

lavunder.health = 2300;
lavunder.size = 4;
lavunder.targetAir = false;
lavunder.targetGround = true;
lavunder.range = 320;
lavunder.reload = 10; 
lavunder.shootType = lavunderLaserBullet;
lavunder.consumePower(22);
lavunder.configurable = true;

lavunder.config(java.lang.Integer, packCons2((tile, value) => {
    if(tile != null) {
        let turretId = tile.id;
        turretTierMap.put(turretId, value);
        if(value == 1) tile.health = 2300;
        else if(value == 2) tile.health = 3500;
        else if(value == 3) tile.health = 4200;
    }
}));

lavunder.buildType = () => extend(PowerTurret.PowerTurretBuild, lavunder, {
    placed(){
        this.super$placed();
        let count = 0;
        Groups.build.each(b => { 
            if(b.block == lavunder && b.team == this.team) count++;
        });
        if(count > 2){
            Call.sendMessage("[purple]Lavunder Giới hạn:[] Chỉ đặt tối đa 2 tháp pháo!");
            this.kill(); 
        }
    },

    destroyed(){
        this.super$destroyed();
        let turretId = this.id;
        turretTierMap.remove(turretId);
        turretChargeMap.remove(turretId);
        turretBurstTimerMap.remove(turretId);
        turretMilestoneMap.remove(turretId);
        mk3TripleExplosionMap.remove(turretId);
        greenLaserRenderMap.remove(turretId);
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let turretId = this.id;
        if(!turretTierMap.containsKey(turretId)) turretTierMap.put(turretId, 1);
        let tier = turretTierMap.get(turretId);

        if(tier == 1){
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trạm Nâng Cấp Lavunder", {});
                dialog.cont.add("[purple]=== LỰA CHỌN PHÂN NHÁNH TIẾN HÓA MẠCH ===[]").padBottom(10).row();
                
                let labelCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core(); if(!core) return "[red]Không tìm thấy Kho Lõi![]";
                    let curT = core.items.get(Items.titanium); let curS = core.items.get(Items.silicon);
                    return "[yellow]TÀI NGUYÊN TRONG KHO LÕI:[]\n" +
                           "[cyan]Cấu hình MK2:[] Titanium: " + (curT >= reqMK2.titanium ? "[green]":"[red]") + reqMK2.titanium + "[]/" + curT + " | Silicon: " + (curS >= reqMK2.silicon ? "[green]":"[red]") + reqMK2.silicon + "[]\n" +
                           "[green]Cấu hình MK2b:[] Titanium: " + (curT >= reqMK3.titanium ? "[green]":"[red]") + reqMK3.titanium + "[]/" + curT + " | Silicon: " + (curS >= reqMK3.silicon ? "[green]":"[red]") + reqMK3.silicon + "[]";
                }));
                dialog.cont.row(); labelCell.padBottom(20);

                let branchesTable = new Table();
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]CẤU HÌNH CONFIG MK2[]").row();
                b1.add("[lightgray]• Sát thương tăng 250% / Sạc điểm tăng tốc 80%\n• Nổ mốc 100 tăng thành 2% HP tối đa + 320 Sát thương\n• Khi reset mốc 100 về 0, có 50% tỷ lệ hồi ngay 80 điểm hỏa lực![]").padBottom(10).row();
                b1.button("[green]KÍCH HOẠT CONFIG MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                        this.configure(java.lang.Integer(2)); Fx.upgradeCore.at(this.x, this.y); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên chế tạo MK2![]"); }
                })).size(240, 40);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[green]CẤU HÌNH CONFIG MK2b[]").row();
                b2.add("[lightgray]• Sát thương gốc tăng 500% (Cân bằng lại 40%)\n• Tia laser phụ thu gọn còn 2 ô gạch.\n• Mốc 20,40,60,80: 70% nổ tia phụ xanh lá (800 DMG + 1500% dame gốc)\n• Mốc 100: 80% nổ chuỗi 3 loạt tia phụ (2400 DMG + 300% dame gốc)![]").padBottom(10).row();
                b2.button("[orange]KÍCH HOẠT CONFIG MK2b[]", packRun(() => {
                    let core = this.team.core();
                    if(core && core.items.get(Items.titanium) >= reqMK3.titanium && core.items.get(Items.silicon) >= reqMK3.silicon){
                        core.items.remove(Items.titanium, reqMK3.titanium); core.items.remove(Items.silicon, reqMK3.silicon);
                        this.configure(java.lang.Integer(3)); Fx.bigShockwave.at(this.x, this.y); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên chế tạo MK2b![]"); }
                })).size(240, 40);

                branchesTable.add(b1).width(380).row(); branchesTable.add().height(15).row(); branchesTable.add(b2).width(380);
                dialog.cont.add(branchesTable); dialog.addCloseButton(); dialog.show();
            })).size(50, 40);
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => { Vars.ui.showInfo("[scarlet]HỆ THỐNG ĐÃ TIẾN HÓA MỨC TỐI ĐA![]"); })).size(50, 40);
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let dialog = extend(BaseDialog, "Báo cáo trạng thái", {});
            let points = turretChargeMap.containsKey(turretId) ? turretChargeMap.get(turretId) : 0;
            let currentTier = turretTierMap.get(turretId);
            let status = currentTier == 1 ? "Gốc (MK1)" : (currentTier == 2 ? "Quá Tải (MK2)" : "Đại Quang Phổ (MK2b)");
            dialog.cont.add("[purple]Cấu hình hệ thống:[] " + status + "\n[purple]Năng lượng tích lũy:[] " + Math.floor(points) + " / 100");
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).padLeft(5);
        
        table.row();
        table.label(() => {
            let points = turretChargeMap.containsKey(turretId) ? turretChargeMap.get(turretId) : 0;
            return "[purple]Điểm hỏa lực:[] " + Math.floor(points) + " / 100";
        }).pad(10);
    },

    findTarget(){
        this.target = Units.closestTarget(this.team, this.x, this.y, 320, u => !u.dead && !u.type.flying && Mathf.dst(this.x, this.y, u.x, u.y) >= deadZone, b => true);
    },
    drawSelect(){ this.super$drawSelect(); dashCircle(this.x, this.y, deadZone, Pal.remove); },
    write(write){ this.super$write(write); write.b(turretTierMap.containsKey(this.id) ? turretTierMap.get(this.id) : 1); },
    read(read, revision){ this.super$read(read, revision); turretTierMap.put(this.id, read.b()); }
});

exports.lavunder = lavunder;
