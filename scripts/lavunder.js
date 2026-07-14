print("LAVUNDER - ULTIMATE BALANCE & OVERLOAD SYSTEM (MK2 & MK2B) LOADED");

const deadZone = 40; 
const laserColor = Color.valueOf("bf7fff"); 
const particleColor = Color.valueOf("e8bfff"); 
const greenLaserColor = Color.valueOf("33ff55"); 
const amberTextColor = Color.valueOf("ffaa00"); 

const reqMK2 = { copper: 4000, graphite: 4000 };
const reqMK3 = { lead: 4500, silicon: 5700 };

const turretTierMap = new ObjectMap();         
const turretChargeMap = new ObjectMap();       
const turretBurstTimerMap = new ObjectMap();   
const turretMilestoneMap = new ObjectMap();    
const mk3TripleExplosionMap = new ObjectMap(); 
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

const lavunderLaserBullet = extend(BulletType, {
    init(b){
        if(!b) return;
        b.data = {
            hasTarget: false,
            lastX: b.x + Angles.trnsx(b.rotation(), 320),
            lastY: b.y + Angles.trnsy(b.rotation(), 320)
        };
    },

    update(b){
        if(!b || !b.owner) return;
        
        let turretId = b.owner.id;
        let range = 320;

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

        if(greenLaserRenderMap.containsKey(turretId)){
            let gData = greenLaserRenderMap.get(turretId);
            if(gData.duration > 0){
                gData.duration--;
            } else {
                greenLaserRenderMap.remove(turretId);
            }
        }

        let baseDamage = 33;
        if(tier == 2){
            baseDamage = 33 * 3.5; 
        } else if(tier == 3){
            baseDamage = 33 * 6.0; 
        }
        let currentTickDamage = baseDamage * (1 + (currentPoints / 100));

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
                    let m100DamageValue = 2400 + (currentTickDamage * 3.0);

                    Units.nearbyEnemies(b.team, exData.x - targetRadius, exData.y - targetRadius, targetRadius * 2, targetRadius * 2, u => {
                        if(u && !u.dead && !u.isFlying() && Mathf.dst(exData.x, exData.y, u.x, u.y) <= targetRadius){
                            u.damage(m100DamageValue);
                        }
                    });
                    
                    exData.count--;
                    exData.timer = 30; 
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
            b.data.hasTarget = true;
            b.data.lastX = target.x;
            b.data.lastY = target.y;

            target.damage(currentTickDamage / 60);

            if(currentPoints < 100){
                let chargeSpeedMultiplier = 1 + Math.pow(currentPoints / 50, 2);
                let speedBonus = (tier == 2) ? 1.8 : 1.0; 
                
                currentPoints += (1 / 60) * chargeSpeedMultiplier * speedBonus;
                
                if(tier == 1 || tier == 2){
                    if(currentPoints >= 100){
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
                else if(tier == 3) {
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
                                let subMilestoneDamage = 800 + (currentTickDamage * 15.0);

                                Units.nearbyEnemies(b.team, target.x - targetRadius, target.y - targetRadius, targetRadius * 2, targetRadius * 2, u => {
                                    if(u && !u.dead && !u.isFlying() && Mathf.dst(target.x, target.y, u.x, u.y) <= targetRadius){
                                        u.damage(subMilestoneDamage);
                                    }
                                });
                            }
                        }
                    }

                    if(currentPoints >= 100){
                        currentPoints = 0;
                        turretMilestoneMap.put(turretId, 0); 
                        turretBurstTimerMap.put(turretId, 14);

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
            b.data.hasTarget = false;
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

        if(greenLaserRenderMap.containsKey(turretId)){
            let gData = greenLaserRenderMap.get(turretId);
            let zoom = gData.duration / 12;
            Draw.color(greenLaserColor);
            Lines.stroke(16.0 * zoom); 
            Lines.line(startX, startY, gData.x, gData.y);
            Draw.color(Color.white);
            Lines.stroke(5.0 * zoom); 
            Lines.line(startX, startY, gData.x, gData.y);
        }

        if(burstTimer > 0){
            let zoomFactor = burstTimer / 14; 
            Draw.color(Color.white);
            Lines.stroke(9.0 * zoomFactor); 
            Lines.line(startX, startY, endX, endY);
        } else {
            Draw.color(laserColor); Lines.stroke(0.3); Lines.line(startX, startY, endX, endY);
            Draw.color(Color.white); Lines.stroke(0.1); Lines.line(startX, startY, endX, endY);
        }

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

        if(b.data.hasTarget){
            let baseRadius = 3.5 + (currentPoints * 0.05); 
            let ringRadius = baseRadius * 1.6;             

            Draw.color(laserColor);
            Lines.stroke(0.8 + (Mathf.sin(Time.time * 0.15) * 0.3)); 
            Lines.circle(endX, endY, ringRadius);

            Draw.color(particleColor);
            Fill.circle(endX, endY, baseRadius);
            Draw.color(Color.white);
            Fill.circle(endX, endY, baseRadius * 0.55); 

            let pCount = Math.floor(Mathf.lerp(4, 15, currentPoints / 100));
            Draw.color(particleColor);
            for(let i = 0; i < pCount; i++){
                let hSeed = i * 45.7 + turretId;
                let baseProgress = (Time.time * 0.4 + hSeed) % 1.0; 
                let acceleratedProgress = Math.pow(baseProgress, 3); 
                let invT = 1.0 - acceleratedProgress; 
                let pAngle = (hSeed + i * (360 / pCount)) % 360;
                let startDist = ringRadius * 3.5; 
                let curDist = startDist * invT;   

                let finalAngle = pAngle + (acceleratedProgress * 80.0); 
                let hx = endX + Angles.trnsx(finalAngle, curDist);
                let hy = endY + Angles.trnsy(finalAngle, curDist);
                Fill.circle(hx, hy, 0.3 + (acceleratedProgress * 0.5)); 
            }
        }

        if(currentPoints > 0) {
            Draw.color(amberTextColor);
            Fonts.outline.getData().setScale(0.25);
            Fonts.outline.draw(java.lang.String.valueOf(Math.floor(currentPoints)), b.owner.x, b.owner.y + 3, Align.center);
            Fonts.outline.getData().setScale(1.0);
        }
        Draw.reset();
    }
});

lavunderLaserBullet.speed = 0;
lavunderLaserBullet.damage = 33; 
lavunderLaserBullet.lifetime = 12; 
lavunderLaserBullet.collides = false;

const lavunder = extend(PowerTurret, "lavunder", {
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

lavunder.health = 2300;
lavunder.size = 4;
lavunder.targetAir = false;
lavunder.targetGround = true;
lavunder.range = 320;
lavunder.reload = 10; 
lavunder.shootType = lavunderLaserBullet;
lavunder.recoil = 0; 
lavunder.consumePower(22);
lavunder.configurable = true;
lavunder.canControl = false;

// SỬA LẠI ĐOẠN NÀY TRONG FILE CỦA BẠN:
lavunder.config(java.lang.Integer, packCons2((tile, value) => {
    if(tile != null && value != null) {
        let turretId = tile.id;
        // Sửa ở đây: Sử dụng trực tiếp 'value' thay vì 'value.intValue()'
        let valInt = Math.floor(value); 
        
        turretTierMap.put(turretId, valInt);
        if(valInt == 1) tile.health = 2300;
        else if(valInt == 2) tile.health = 3500;
        else if(valInt == 3) tile.health = 4200;
    }
}));

lavunder.buildType = () => extend(PowerTurret.PowerTurretBuild, lavunder, {
    downxOffset: 0,
    wingsOffset: 0, 

    canControl() { return false; },

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
        this.downxOffset = 0;
        this.wingsOffset = 0;
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

    updateTile(){
        this.super$updateTile();
        let targetRadius = 320;
        let hasTarget = Units.closestTarget(this.team, this.x, this.y, targetRadius, u => !u.dead && !u.type.flying && Mathf.dst(this.x, this.y, u.x, u.y) >= deadZone, b => true) != null;

        if(hasTarget){
            this.downxOffset = Mathf.lerpDelta(this.downxOffset, -4.0, 0.15);
            this.wingsOffset = Mathf.lerpDelta(this.wingsOffset, 1.0, 0.15);
        } else {
            this.downxOffset = Mathf.lerpDelta(this.downxOffset, 0.0, 0.1);
            this.wingsOffset = Mathf.lerpDelta(this.wingsOffset, 0.0, 0.1);
        }
    },

    draw() {
        let baseRegion = Core.atlas.find(lavunder.basePrefix + "block-" + lavunder.size);
        if (baseRegion && baseRegion.found()) {
            Draw.rect(baseRegion, this.x, this.y);
        } else {
            this.super$draw();
        }

        let rad = this.rotation * Mathf.degRad;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);

        if (lavunder.bodyRegion && lavunder.bodyRegion.found()) {
            Draw.rect(lavunder.bodyRegion, this.x, this.y, this.rotation);
        }

        if (lavunder.downxRegion && lavunder.downxRegion.found()) {
            let dx = this.x + this.downxOffset * cos;
            let dy = this.y + this.downxOffset * sin;
            Draw.rect(lavunder.downxRegion, dx, dy, this.rotation);
        }

        let wingBackOffset = -4.0 * this.wingsOffset; 
        let combatSideMove = 4.0 * this.wingsOffset;

        if (lavunder.a1Region && lavunder.a1Region.found()) {
            let a1x = this.x + (wingBackOffset * cos) - (combatSideMove * sin);
            let a1y = this.y + (wingBackOffset * sin) + (combatSideMove * cos);
            Draw.rect(lavunder.a1Region, a1x, a1y, this.rotation);
        }

        if (lavunder.a2Region && lavunder.a2Region.found()) {
            let a2x = this.x + (wingBackOffset * cos) + (combatSideMove * sin);
            let a2y = this.y + (wingBackOffset * sin) - (combatSideMove * cos);
            Draw.rect(lavunder.a2Region, a2x, a2y, this.rotation);
        }

        Draw.reset();
    },

    buildConfiguration(table) {
        table.clear(); table.row();
        let tier = turretTierMap.containsKey(this.id) ? turretTierMap.get(this.id) : 1;

        if(tier == 1) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Lavunder", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(!core) return "[red]Không tìm thấy Lõi Đội![]";
                    
                    let copperAmt = core.items.get(Items.copper);
                    let graphiteAmt = core.items.get(Items.graphite);
                    let leadAmt = core.items.get(Items.lead);
                    let siliconAmt = core.items.get(Items.silicon);
                    
                    let copperColor = copperAmt >= reqMK2.copper ? "[green]" : "[red]";
                    let graphiteColor = graphiteAmt >= reqMK2.graphite ? "[green]" : "[red]";
                    let leadColor = leadAmt >= reqMK3.lead ? "[green]" : "[red]";
                    let siliconColor = siliconAmt >= reqMK3.silicon ? "[green]" : "[red]";

                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh MK2:[]\n" +
                           " • Đồng: " + copperColor + copperAmt + "[] / " + reqMK2.copper + "\n" +
                           " • Graphite: " + graphiteColor + graphiteAmt + "[] / " + reqMK2.graphite + "\n" +
                           "[purple]Nhánh MK2B:[]\n" +
                           " • Chì: " + leadColor + leadAmt + "[] / " + reqMK3.lead + "\n" +
                           " • Silicon: " + siliconColor + siliconAmt + "[] / " + reqMK3.silicon;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                // Nhánh 1: MK2
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("Mô-đun kích xung hỏa lực liên hoàn:\n" +
                                 " [white]• Sát thương liên tục gia tăng cực mạnh lên mốc [yellow]+250%[] (115.5 đv/s).[]\n" +
                                 " [white]• Tốc độ gia tốc sạc điểm năng lượng tăng trưởng nhanh [green]+80%[].[]\n" +
                                 " [white]• Khi đạt [yellow]100 sạc[]: Gây [red]320 ST flat[] + [cyan]2% HP tối đa[] diện rộng.[]\n" +
                                 " [white]• [green]Mạch Phản Hồi[]: Có [orange]50%[] tỷ lệ hoàn trả [yellow]80 điểm sạc[] ngay sau nổ.[]\n" +
                                 " [white]• Tăng [green]+52.17% Máu[] (3,500) và mở rộng [green]+6.25% Tầm bắn[] (340 px).");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.graphite) >= reqMK2.graphite){
                        core.items.remove(Items.copper, reqMK2.copper);
                        core.items.remove(Items.graphite, reqMK2.graphite);
                        this.configure(java.lang.Integer(2)); 
                        dialog.hide(); this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]");
                    }
                })).size(180, 38);

                // Nhánh 2: MK2B
                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("Lõi hội tụ quang phổ hủy diệt diện rộng:\n" +
                                 " [white]• Sát thương liên tục đột biến chạm mốc kinh hoàng [red]+500%[] (198.0 đv/s).[]\n" +
                                 " [white]• [cyan]Cơ chế Sạc Đa Tầng[]: Tại mốc [yellow]20,40,60,80[] có [white]70%[] tỷ lệ nổ phụ tia.[]\n" +
                                 " [white]• Khi chạm [yellow]100 sạc[]: Kích hoạt chuỗi [orange]3 loạt bộc phá liên tiếp[] hủy diệt.[]\n" +
                                 " [white]• Siêu gia cố cấu trúc tăng [green]+82.6% Máu[] (4,200).[]\n" +
                                 " [white]• Giữ nguyên [yellow]Tầm bắn[] (320 px) để duy trì mật độ tập trung năng lượng.");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core && core.items.get(Items.lead) >= reqMK3.lead && core.items.get(Items.silicon) >= reqMK3.silicon){
                        core.items.remove(Items.lead, reqMK3.lead);
                        core.items.remove(Items.silicon, reqMK3.silicon);
                        this.configure(java.lang.Integer(3)); 
                        dialog.hide(); this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]");
                    }
                })).size(180, 38);

                // Xếp các bảng nhánh theo hàng dọc chuẩn Lavunder
                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Nâng cấp tháp pháo Lavunder");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG LAVUNDER ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // --- NÚT THÔNG TIN (PHONG CÁCH BỐ CỰC ĐẶC TRƯNG CỦA DOR / LAVUNDER) ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Lavunder: ";
            let descStr = "";
            let currentTier = turretTierMap.containsKey(this.id) ? turretTierMap.get(this.id) : 1;

            if (currentTier == 1) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]2,300[]\n" +
                          "[lightgray]Tầm bắn phát xạ:[] [orange]320 pixel[] (Vùng mù: <40 px)\n" +
                          "[lightgray]Sát thương liên tục:[] [white]33.00 hỏa lực/giây[]\n" +
                          "[lightgray]Năng lượng tiêu thụ:[] [gainsboro]22.00 đơn vị/giây[]\n\n" +
                                                    "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc/đội[]\n\n" +

                          "[sky]⚡ CƠ CHẾ HOẠT ĐỘNG MẠCH XUNG KÍCH:[]\n" +
                           "• [lightgray]Bám dính mục tiêu:[] Chỉ tấn công mặt đất, tự động tích lũy năng lượng sạc điểm khi duy trì tia bắn liên tục.\n" +
                          "• [lightgray]Xung kích năng lượng:[] Khi đạt [yellow]100 điểm sạc[] phóng nổ diện rộng gây [red]100 sát thương[] + [cyan]1% HP tối đa[] mục tiêu.";
            } 
            else if (currentTier == 2) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]3,500 [lime](+52.17%)[]\n" +
                          "[lightgray]Tầm bắn phát xạ:[] [orange]340 pixel [lime](+6.25%)[]\n" +
                          "[lightgray]Sát thương liên tục:[] [yellow]115.50 hỏa lực/giây (+250%)[]\n" +
                          "[lightgray]Năng lượng tiêu thụ:[] [gainsboro]22.00 đơn vị/giây[]\n\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc/đội[]\n\n" +
                          "[lime]⚡ CƠ CHẾ HOẠT ĐỘNG MẠCH XUNG KÍCH:[]\n" +
                          "• [lightgray]Gia tốc dòng sạc:[] Tốc độ tích lũy năng lượng điểm được đẩy mạnh thêm [yellow]+80%[].\n" +
                          "• [lightgray]Siêu áp suất nổ:[] Tại mốc [yellow]100 điểm sạc[] giải phóng chấn động cực đại: [red]320 sát thương[] + [cyan]2% HP tối đa[].\n" +
                          "• [lightgray]Mạch hồi lưu sạc:[] Sở hữu [orange]50%[] tỷ lệ hoàn trả ngay lập tức [yellow]80 điểm sạc[] để kích chuỗi vụ nổ kế tiếp.";
            } 
            else if (currentTier == 3) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]4,200 [lime](+82.60%)[]\n" +
                          "[lightgray]Tầm bắn phát xạ:[] [orange]320 pixel [yellow](0%)[]\n" +
                          "[lightgray]Sát thương liên tục:[] [pink]198.00 hỏa lực/giây (+500%)[]\n" +
                          "[lightgray]Năng lượng tiêu thụ:[] [gainsboro]22.00 đơn vị/giây[]\n\n" +
                          "[scarlet]⚠ Giới hạn đặt: Tối đa 10 cấu trúc/đội[]\n\n" +
                          "[purple]🔥 CƠ CHẾ HOẠT ĐỘNG ĐẠI QUANG PHỔ:[]\n" +
                          "• [lightgray]Sạc đa tầng quang phổ:[] Duy trì bắn tích năng lượng qua các mốc [yellow]20, 40, 60, 80[] có [white]70%[] cơ hội nổ phụ tia laser phụ.\n" +
                          "• [lightgray]Đại bộc phá chu kỳ:[] Đạt đỉnh [yellow]100 điểm sạc[] kích nổ chuỗi [red]3 loạt bộc phá liên hoàn siêu cấp[] diện rộng, càn quét toàn bộ đội hình địch.";
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

exports.lavunder = lavunder;
