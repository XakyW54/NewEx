print("REGUILATER SYSTEM CORE - ENHANCED ENERGY BALL & COMPRESSED SHOT INTEGRATED");

const reguReqMK2 = { copper: 4000, silicon: 7500 };
const reguReqMK3 = { thorium: 12000, titanium: 4000 };
 
const reguAimColor = new Color(0, 1, 0.66, 0.27); 

const colorNormal = Color.valueOf("#00ffaa");   
const colorCrit = Color.valueOf("#ffaa00");     
const colorExplode = Color.valueOf("#d35400");  
const colorUltimate = Color.valueOf("#ff3333"); 

const reguMuzzleFX = new Effect(15, e => {
    let tColor = e.data || colorNormal;
    Draw.color(tColor);
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 16);
    Draw.reset();
});

const reguHitFX = new Effect(20, e => {
    let tColor = e.data || colorNormal;
    Draw.color(Color.white, tColor, e.fin());
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 20);
    Angles.randLenVectors(e.id, 8, 26 * e.fin(), (x, y) => {
        Fill.circle(e.x + x, e.y + y, 2.0 * e.fout());
    });
    Draw.reset();
});

const reguAreaExplosionFX = new Effect(25, e => {
    Draw.color(colorExplode, Color.white, e.fin());
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 40);
    Angles.randLenVectors(e.id, 12, 35 * e.fin(), (x, y) => {
        Fill.circle(e.x + x, e.y + y, 3.0 * e.fout());
    });
    Draw.reset();
});

const reguSplitLaser = extend(LaserBulletType, {});
reguSplitLaser.damage = 60;          
reguSplitLaser.length = 160; 
reguSplitLaser.width = 5.0;
reguSplitLaser.lifetime = 14;
reguSplitLaser.colors = [new Color(1, 0.2, 0.2, 0.2), colorUltimate, Color.white];

const reguFakeBullet = extend(BulletType, {
    init(b) { if (b) b.remove(); },
    draw(b) {}
});
reguFakeBullet.speed = 0;
reguFakeBullet.lifetime = 1;

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqMK2 = { titanium: 6000, silicon: 12000 };
const reqMK2B = { titanium: 2000, silicon: 9000, thorium: 4000 };

function drawReguLaserRing(cx, cy, radiusX, radiusY, laserAngle, strokeWidth, color, isFill){
    Draw.color(color); 
    if(!isFill) Lines.stroke(strokeWidth);
    let steps = 24; let lastX = 0, lastY = 0;
    let cosA = Math.cos(laserAngle * Mathf.degRad); let sinA = Math.sin(laserAngle * Mathf.degRad);
    
    if(isFill) {
        for(let r = radiusY; r > 0; r -= 1.5) {
            let curRadX = (r / radiusY) * radiusX;
            for(let i = 0; i <= steps; i++){
                let angle = (i * (360 / steps)) * Mathf.degRad;
                let lx = Math.cos(angle) * curRadX; let ly = Math.sin(angle) * r;
                let rx = cx + (lx * cosA - ly * sinA); let ry = cy + (lx * sinA + ly * cosA);
                if(i > 0) Lines.line(lastX, lastY, rx, ry);
                lastX = rx; lastY = ry;
            }
        }
    } else {
         for(let i = 0; i <= steps; i++){
            let angle = (i * (360 / steps)) * Mathf.degRad;
            let lx = Math.cos(angle) * radiusX; let ly = Math.sin(angle) * radiusY;
            let rx = cx + (lx * cosA - ly * sinA); let ry = cy + (lx * sinA + ly * cosA);
            if(i > 0) Lines.line(lastX, lastY, rx, ry);
            lastX = rx; lastY = ry;
        }
    }
}
 
function makeReguBuild() {
    return {
        reguTier: 1, 
        lockTimer: 0,
        shootCooldown: 0,
        laserActiveTimer: 0, 
        laserEndX: 0,
        laserEndY: 0,
        currentLaserColor: colorNormal, 
        currentLaserSize: 5.0, 

        continuousShotCount: 0,
        maxContinuousBonus: 25, 
        idleResetTimer: 0,
        isBurstShooting: false,

        canControl() { return false; },

        setTier(val) { this.reguTier = val; },
        getTier() { return this.reguTier !== undefined ? this.reguTier : 1; },
        config() { return java.lang.Integer(this.getTier()); },

        buildConfiguration(table) {
            table.clear(); table.row();
            let tier = this.getTier();

            if (tier == 1) {
                table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                    let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo", {});
                    
                    let reqCell = dialog.cont.label(packProv(() => {
                        let core = this.team.core();
                        if (!core) return "[red]Không tìm thấy Lõi Đội![]";
                        
                        let coAmt = core.items.get(Items.copper);
                        let siAmt = core.items.get(Items.silicon);
                        let thAmt = core.items.get(Items.thorium);
                        let tiAmt = core.items.get(Items.titanium);
                        
                        let coColor = coAmt >= reguReqMK2.copper ? "[green]" : "[red]";
                        let siColor = siAmt >= reguReqMK2.silicon ? "[green]" : "[red]";
                        let thColor = thAmt >= reguReqMK3.thorium ? "[green]" : "[red]";
                        let tiColor = tiAmt >= reguReqMK3.titanium ? "[green]" : "[red]";

                        return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                               "[cyan]Nhánh Cấu Hình MK2[]\n" +
                               " • Đồng: " + coColor + coAmt + "[] / " + reguReqMK2.copper + "\n" +
                               " • Silicon: " + siColor + siAmt + "[] / " + reguReqMK2.silicon + "\n" +
                               "[purple]Nhánh Biến Thể MK2B[]\n" +
                               " • Thori: " + thColor + thAmt + "[] / " + reguReqMK3.thorium + "\n" +
                               " • Titan: " + tiColor + tiAmt + "[] / " + reguReqMK3.titanium;
                    }));
                    
                    reqCell.width(360).get().setWrap(true);
                    reqCell.get().setAlignment(Align.left);
                    dialog.cont.row(); dialog.cont.add().height(10).row();

                    let branchesTable = new Table();

                    let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                    b1.add("[cyan]===(MK2)===[]").row();
                    let b1D = b1.add("[white]• Tầm bắn: [green]+50%[]\n" +
                                     "• sát thương gốc: [green]+150%[]\n" +
                                     "• Tốc độ ngắm: [green]+60%[]\n\n" +
                                     "[lightgray]Kỹ năng đặc biệt: Nén Áp Suất Kép — Mở khóa cơ chế bắn bồi Burst-Shot siêu tốc và bộc phát đòn bạo kích Crit gây gấp đôi sát thương.[]");
                    b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                    b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                        let core = this.team.core();
                        if (core && core.items.get(Items.copper) >= reguReqMK2.copper && core.items.get(Items.silicon) >= reguReqMK2.silicon) {
                            core.items.remove(Items.copper, reguReqMK2.copper);
                            core.items.remove(Items.silicon, reguReqMK2.silicon);
                            this.setTier(2);
                            Fx.upgradeCore.at(this.x, this.y); dialog.hide(); this.deselect();
                        } else {
                            Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]");
                        }
                    })).size(180, 38);

                    let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                    b2.add("[purple]===(MK2B)===[]").row();
                    let b2D = b2.add("[white]• Máu cấu trúc: [green]250,000 HP[]\n" +
                                     "• Tầm bắn: [red]-30%[]\n" +
                                     "• sát thương gốc: [green]+500%[]\n\n" +
                                     "[lightgray]Kỹ năng đặc biệt: Mạch Bão Hòa Hủy Diệt — Tự động phân tách chuỗi liên laser phụ (tối đa 6 tia) thiêu rụi mục tiêu lân cận khi đánh trúng kẻ địch.[]");
                    b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                    b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                        let core = this.team.core();
                        if (core && core.items.get(Items.thorium) >= reguReqMK3.thorium && core.items.get(Items.titanium) >= reguReqMK3.titanium) {
                            core.items.remove(Items.thorium, reguReqMK3.thorium);
                            core.items.remove(Items.titanium, reguReqMK3.titanium);
                            this.setTier(3);
                            this.health = 250000;   
                            Fx.bigShockwave.at(this.x, this.y); dialog.hide(); this.deselect();
                        } else {
                            Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]");
                        }
                    })).size(180, 38);

                    branchesTable.add(b1).width(340); branchesTable.row();
                    branchesTable.add().height(12).row();
                    branchesTable.add(b2).width(340);

                    let scroll = new ScrollPane(branchesTable);
                    scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400);
                    dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip("Nâng cấp tháp pháo lên");
            } else {
                table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                    Vars.ui.showInfo("[scarlet]Nâng cấp tháp pháo đã đạt giới hạn![]");
                })).size(50, 40).tooltip("Nâng cấp tháp pháo");
            }

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = " Thông số pháo \"Reguilater\": ";
                let descStr = "";
                let currentTier = this.getTier();

                if (currentTier == 1) {
                    title += "[yellow](MK1)[]";
                    descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                              "[lightgray]Máu cấu trúc:[] [green]250,000[]\n" +
                              "[lightgray]Tầm bắn hiệu dụng:[] [orange]280 pixel[] (35 Ô)\n" +
                              "[lightgray]sát thương gốc:[] [yellow]120 DMG / phát bắn[]\n" +
                              "[lightgray]Năng lượng yêu cầu:[] [gainsboro]12.00 đơn vị/giây[]\n\n" +
                              "[sky]⚡ CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                              "• Tập trung năng lượng khóa và bắn mục tiêu hỗn hợp Không & Đất.\n" +
                              "• Tốc độ xoay nòng tăng tiến liên tục theo thời gian bám đuổi mục tiêu.\n" +
                              "• Sát thương tăng tiến tuyến tính, đạt tối đa +100% khi duy trì xả súng liên tục.";
                } 
                else if (currentTier == 2) {
                    title += "[cyan]THÔNG SỐ NÂNG CẤP MK2[]";
                    descStr = "[cyan]⚡ THÔNG SỐ NÂNG CẤP MK2 ⚡[]\n" +
                              "[lightgray]Máu cấu trúc:[] [green]250,000[]\n" +
                              "[lightgray]Tầm bắn hiệu dụng:[] [orange]420 pixel (+50%)[]\n" +
                              "[lightgray]sát thương gốc:[] [yellow]300 DMG / phát bắn (+150%)[]\n" +
                              "[lightgray]Năng lượng yêu cầu:[] [gainsboro]12.00 đơn vị/giây[]\n\n" +
                              "[lime]⚡ CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                              "• Nén áp suất mật độ hạt trường điện từ giúp mở rộng cự ly bắn cực đại.\n" +
                              "• Kích hoạt tỷ lệ bắn bồi Burst-Shot siêu tốc.\n" +
                              "• Tự động tích tụ hạt chuyển màu cam, mở khóa tỷ lệ đòn bạo kích Crit gây gấp đôi sát thương.";
                } 
                else if (currentTier == 3) {
                    title += "[purple]THÔNG SỐ NÂNG CẤP MK2B[]";
                    descStr = "[purple]⚡ THÔNG SỐ NÂNG CẤP MK2B ⚡[]\n" +
                              "[lightgray]Máu cấu trúc:[] [green]250,000[]\n" +
                              "[lightgray]Tầm bắn hiệu dụng:[] [red]280 pixel (-30%)[]\n" +
                              "[lightgray]sát thương gốc:[] [pink]720 DMG / phát bắn (+500%)[]\n" +
                              "[lightgray]Năng lượng yêu cầu:[] [gainsboro]12.00 đơn vị/giây[]\n\n" +
                              "[purple]🔥 CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                              "• Tích tụ quả cầu hạt nhân năng lượng tối thượng tại đồng trục nòng pháo.\n" +
                              "• Khi bắn trúng kẻ địch chính, tự động phân tách chuỗi liên laser phụ (tối đa 6 tia) thiêu rụi các mục tiêu lân cận.\n" +
                              "• Hy sinh cự ly bắn để tập trung mật độ phá hủy tối đa ở tầm gần.";
                }

                let dialog = extend(BaseDialog, title, {});
                let infoTable = new Table();
                let cell = infoTable.add(descStr).width(360);
                cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                let scroll = new ScrollPane(infoTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Trung tâm nâng cấp pháo");
        },

        range() {
            let tier = this.getTier();
            return (tier == 2) ? (this.super$range() * 1.5) : this.super$range();
        },

        updateTile() {
            if (!this.enabled) return;

            if (this.shootCooldown > 0) this.shootCooldown -= Time.delta;
            if (this.laserActiveTimer > 0) this.laserActiveTimer -= Time.delta;

            if (this.target == null || this.shootCooldown > 40) {
                this.idleResetTimer += Time.delta;
                if (this.idleResetTimer >= 150) { 
                    this.continuousShotCount = Math.max(0, this.continuousShotCount - Time.delta * 0.15);
                }
            } else {
                this.idleResetTimer = 0;
            }

            if (this.power != null && this.power.status > 0) {
                let currentTarget = Units.closestTarget(this.team, this.x, this.y, this.range(), u => u && !u.dead, b => b && !b.dead);

                if (currentTarget != null && !currentTarget.dead) {
                    this.target = currentTarget;
                    
                    let targetAngle = Angles.angle(this.x, this.y, currentTarget.x, currentTarget.y);
                    this.rotation = targetAngle; 

                    if (this.shootCooldown <= 0) {
                        this.lockTimer += Time.delta;

                        let requiredLockTime = this.isBurstShooting ? 2 : ((this.getTier() == 2) ? 24 : 60);

                        if (this.lockTimer >= requiredLockTime) {
                            this.lockTimer = 0; 
                            this.laserActiveTimer = 16; 
                            this.laserEndX = currentTarget.x;
                            this.laserEndY = currentTarget.y;

                            let tier = this.getTier();

                            if (tier == 2) {
                                if (this.isBurstShooting) {
                                    this.shootCooldown = 32;
                                    this.isBurstShooting = false; 
                                } else {
                                    if (Mathf.random(100) <= 50) {
                                        this.shootCooldown = 4; 
                                        this.isBurstShooting = true; 
                                        Fx.lightningCharge.at(this.x, this.y); 
                                    } else {
                                        this.shootCooldown = 32; 
                                    }
                                }
                            } else {
                                this.shootCooldown = 80; 
                            }

                            if (this.continuousShotCount < this.maxContinuousBonus) {
                                this.continuousShotCount++;
                            }

                            let dmgMultiplier = 1.0 + (this.continuousShotCount / this.maxContinuousBonus);
                            let baseDmg = (tier == 3 ? 720 : (tier == 2 ? 300 : 120)) * dmgMultiplier; 

                            let chance = Mathf.random(100);

                            if (chance <= 1) { 
                                this.currentLaserColor = colorUltimate; this.currentLaserSize = 12.0; 
                                let finalDmg = (baseDmg * 5) + (currentTarget.maxHealth * 0.1);
                                currentTarget.damage(finalDmg);
                                reguHitFX.at(currentTarget.x, currentTarget.y, 0, colorUltimate);
                                Effect.shake(6, 6, this.x, this.y);
                            } else if (chance <= 34) { 
                                this.currentLaserColor = colorNormal; this.currentLaserSize = 5.0; 
                                let finalDmg = baseDmg + (currentTarget.health * 0.01);
                                currentTarget.damage(finalDmg);
                                reguHitFX.at(currentTarget.x, currentTarget.y, 0, colorNormal);
                                Effect.shake(2, 2, this.x, this.y);
                            } else if (chance <= 67) { 
                                this.currentLaserColor = colorCrit; this.currentLaserSize = 8.0; 
                                currentTarget.damage(baseDmg * 2);
                                reguHitFX.at(currentTarget.x, currentTarget.y, 0, colorCrit);
                                Effect.shake(4, 4, this.x, this.y);
                            } else { 
                                this.currentLaserColor = colorExplode; this.currentLaserSize = 6.5; 
                                currentTarget.damage(baseDmg * 0.5);
                                Damage.damage(this.team, currentTarget.x, currentTarget.y, 40, baseDmg, false, true); 
                                reguAreaExplosionFX.at(currentTarget.x, currentTarget.y, 0, colorExplode);
                                Effect.shake(3, 3, this.x, this.y);
                            }

                            if (tier == 3) {
                                let targetsFound = [];
                                Units.nearbyEnemies(this.team, currentTarget.x - reguSplitLaser.length, currentTarget.y - reguSplitLaser.length, reguSplitLaser.length * 2, reguSplitLaser.length * 2, u => {
                                    if (u != null && u != currentTarget && !u.dead) {
                                        targetsFound.push(u);
                                    }
                                });

                                if (targetsFound.length > 0) {
                                    for (let i = targetsFound.length - 1; i > 0; i--) {
                                        let j = Math.floor(Math.random() * (i + 1));
                                        let temp = targetsFound[i];
                                        targetsFound[i] = targetsFound[j];
                                        targetsFound[j] = temp;
                                    }

                                    let splitsFired = Math.min(6, targetsFound.length);
                                    for (let i = 0; i < splitsFired; i++) {
                                        let randomEnemy = targetsFound[i];
                                        let angleToRandomEnemy = Angles.angle(currentTarget.x, currentTarget.y, randomEnemy.x, randomEnemy.y);
                                        reguSplitLaser.create(this, this.team, currentTarget.x, currentTarget.y, angleToRandomEnemy, 1.0, 1.0);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    this.resetReguStatus();
                }
            } else {
                this.resetReguStatus();
            }
        },

        resetReguStatus() {
            this.target = null;
            this.lockTimer = Math.max(this.lockTimer - Time.delta * 2, 0); 
            this.isBurstShooting = false; 
        },

        draw() {
            this.super$draw();
            let centerGunX = this.x; 
            let centerGunY = this.y;

             if (this.target != null && !this.target.dead && this.shootCooldown <= 0) {
                let requiredLockTime = this.isBurstShooting ? 2 : ((this.getTier() == 2) ? 24 : 60);
                let chargeProgress = Math.min(1.0, this.lockTimer / requiredLockTime);

                if(chargeProgress > 0.05) {
                    Draw.z(Layer.bullet + 1);
                    let maxBallRadius = 12.0;
                    let currentRadius = maxBallRadius * chargeProgress + Mathf.absin(Time.time, 1.5, 1.0);
                    let ballColor = (this.continuousShotCount > 15) ? colorCrit : colorNormal;
                    
                    drawReguLaserRing(centerGunX, centerGunY, currentRadius * 0.6, currentRadius * 0.6, this.rotation + Time.time * 2, 0, ballColor, true);
                    drawReguLaserRing(centerGunX, centerGunY, currentRadius, currentRadius, this.rotation - Time.time * 3, 1.5, ballColor, false);
                    Draw.reset();
                }

                Draw.z(Layer.bullet + 1);
                let aimStroke = 1.0 + Mathf.absin(Time.time, 2.0, 0.3);
                Draw.color(reguAimColor);
                Lines.stroke(aimStroke);
                Lines.line(centerGunX, centerGunY, this.target.x, this.target.y);
                Fill.circle(this.target.x, this.target.y, 2 + Mathf.absin(Time.time, 1.5, 1));
                Draw.reset();
            }

            if (this.laserActiveTimer > 0) {
                Draw.z(Layer.bullet + 2);
                let progress = this.laserActiveTimer / 16; 
                let t = 1.0 - progress; 
                let laserZoomStroke = this.currentLaserSize * (1.0 + Mathf.absin(Time.time, 1.0, 0.2)) * progress;

                Draw.color(Color.white);
                Lines.stroke(laserZoomStroke * 0.35);
                Lines.line(centerGunX, centerGunY, this.laserEndX, this.laserEndY);

                Draw.color(this.currentLaserColor, progress);
                Lines.stroke(laserZoomStroke);
                Lines.line(centerGunX, centerGunY, this.laserEndX, this.laserEndY);

                let laserAngle = Angles.angle(centerGunX, centerGunY, this.laserEndX, this.laserEndY);
                let startOffset = 10 + 40; 
                let endOffset = 10 - 24;   
                let currentOffset = Mathf.lerp(startOffset, endOffset, t);

                let ringX = centerGunX + Angles.trnsx(laserAngle, currentOffset);
                let ringY = centerGunY + Angles.trnsy(laserAngle, currentOffset);
                let baseRadiusX = 2.0 * (1 + t * 6.0);
                let baseRadiusY = 5.0 * (1 + t * 6.0);
                let ringStroke = 1.5 * progress;

                drawReguLaserRing(ringX, ringY, baseRadiusX, baseRadiusY, laserAngle, ringStroke, this.currentLaserColor, false);

                let sphereForwardOffset = Mathf.lerp(0, 45, t);
                let ballShotX = centerGunX + Angles.trnsx(laserAngle, sphereForwardOffset);
                let ballShotY = centerGunY + Angles.trnsy(laserAngle, sphereForwardOffset);
                let distortedRadiusX = 12.0 * progress * 1.9; 
                let distortedRadiusY = 12.0 * progress * 0.2; 

                drawReguLaserRing(ballShotX, ballShotY, distortedRadiusX, distortedRadiusY, laserAngle, 0, this.currentLaserColor, true);
                Draw.reset();
            }
        },

        write(write) { 
            this.super$write(write); 
            write.i(this.getTier());
            write.f(this.continuousShotCount);
        },
        read(read, revision) { 
            this.super$read(read, revision); 
            this.setTier(read.i());
            this.continuousShotCount = read.f();
        }
    };
}
 
const reguilater = extend(PowerTurret, "reguilater", {});

reguilater.health = 250000;         
reguilater.size = 4;                
reguilater.range = 280;             
reguilater.reload = 9999;           
reguilater.shootType = reguFakeBullet; 
reguilater.consumePower(12);        

reguilater.targetAir = true;        
reguilater.targetGround = true;     
reguilater.configurable = true;     
reguilater.canControl = false;

reguilater.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

reguilater.buildType = () => extend(PowerTurret.PowerTurretBuild, reguilater, makeReguBuild());
