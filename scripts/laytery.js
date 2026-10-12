print("LAYTERY SYSTEM CORE - OPTIMIZED LASER SYSTEM LOADED");

const laytAimColor = new Color(0, 1, 0.66, 0.27); 
const colorNormal = Color.valueOf("#00ffaa");   

const laytMuzzleFX = new Effect(15, e => {
    let tColor = e.data || colorNormal;
    Draw.color(tColor);
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 16);
    Draw.reset();
});

const laytHitFX = new Effect(20, e => {
    let tColor = e.data || colorNormal;
    Draw.color(Color.white, tColor, e.fin());
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, e.fin() * 20);
    Angles.randLenVectors(e.id, 8, 26 * e.fin(), (x, y) => {
        Fill.circle(e.x + x, e.y + y, 2.0 * e.fout());
    });
    Draw.reset();
});

const laytFakeBullet = extend(BulletType, {
    init(b) { if (b) b.remove(); },
    draw(b) {}
});
laytFakeBullet.speed = 0;
laytFakeBullet.lifetime = 1;

const packRun = (func) => new java.lang.Runnable({ run: func });

function isEnglish() {
    try {
        let loc = Core.settings.get("locale", "default");
        if (loc && loc.startsWith("en")) return true;
        if (Vars.ui && Vars.ui.getLanguage && Vars.ui.getLanguage().startsWith("en")) return true;
    } catch(e) {}
    return false;
}

function drawLaytLaserRing(cx, cy, radiusX, radiusY, laserAngle, strokeWidth, color, isFill){
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
 
function makeLaytBuild() {
    return {
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

        canControl() { return false; },

        buildConfiguration(table) {
            table.clear(); table.row();
            let en = isEnglish();

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = en ? " \"Laytery\" Turret Stats: " : " Thông số pháo \"Laytery\": ";
                let descStr = en ?
                    "[gold]⚡ BASIC STATS ⚡[]\n" +
                    "[lightgray]Structure Health:[] [green]5,200[]\n" +
                    "[lightgray]Effective Range:[] [orange]224 pixels[] (28 Tiles)\n" +
                    "[lightgray]Base Damage:[] [yellow]60 DMG / shot[]\n" +
                    "[lightgray]Power Required:[] [gainsboro]12.00 units/sec[]\n\n" +
                    "[sky]⚡ MECHANICS:[]\n" +
                    "• Focuses energy to lock and fire at mixed Air & Ground targets.\n" +
                    "• Barrel rotation speed continuously increases while tracking targets.\n" +
                    "• Damage increases linearly up to +100% during sustained firing." :
                    "[gold]⚡ THÔNG SỐ CƠ BẢN ⚡[]\n" +
                    "[lightgray]Máu cấu trúc:[] [green]5,200[]\n" +
                    "[lightgray]Tầm bắn hiệu dụng:[] [orange]224 pixel[] (28 Ô)\n" +
                    "[lightgray]sát thương gốc:[] [yellow]60 DMG / phát bắn[]\n" +
                    "[lightgray]Năng lượng yêu cầu:[] [gainsboro]12.00 đơn vị/giây[]\n\n" +
                    "[sky]⚡ CƠ CHẾ:[]\n" +
                    "• Tập trung năng lượng khóa và bắn mục tiêu hỗn hợp Không & Đất.\n" +
                    "• Tốc độ xoay nòng tăng tiến liên tục theo thời gian bám đuổi mục tiêu.\n" +
                    "• Sát thương tăng tiến tuyến tính, đạt tối đa +100% khi duy trì xả súng liên tục.";

                let dialog = extend(BaseDialog, title, {});
                let infoTable = new Table();
                let cell = infoTable.add(descStr).width(360);
                cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                let scroll = new ScrollPane(infoTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip(en ? "Turret Stats" : "Thông số tháp pháo");
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

                        let requiredLockTime = 60;

                        if (this.lockTimer >= requiredLockTime) {
                            this.lockTimer = 0; 
                            this.laserActiveTimer = 16; 
                            this.laserEndX = currentTarget.x;
                            this.laserEndY = currentTarget.y;

                            this.shootCooldown = 80; 

                            if (this.continuousShotCount < this.maxContinuousBonus) {
                                this.continuousShotCount++;
                            }

                            let dmgMultiplier = 1.0 + (this.continuousShotCount / this.maxContinuousBonus);
                            let baseDmg = 60 * dmgMultiplier; // Giảm 50% so với gốc 120

                            this.currentLaserColor = colorNormal; 
                            this.currentLaserSize = 5.0; 
                            
                            currentTarget.damage(baseDmg);
                            laytHitFX.at(currentTarget.x, currentTarget.y, 0, colorNormal);
                            Effect.shake(2, 2, this.x, this.y);
                        }
                    }
                } else {
                    this.resetLaytStatus();
                }
            } else {
                this.resetLaytStatus();
            }
        },

        resetLaytStatus() {
            this.target = null;
            this.lockTimer = Math.max(this.lockTimer - Time.delta * 2, 0); 
        },

        draw() {
            this.super$draw();
            let centerGunX = this.x; 
            let centerGunY = this.y;

             if (this.target != null && !this.target.dead && this.shootCooldown <= 0) {
                let requiredLockTime = 60;
                let chargeProgress = Math.min(1.0, this.lockTimer / requiredLockTime);

                if(chargeProgress > 0.05) {
                    Draw.z(Layer.bullet + 1);
                    let maxBallRadius = 12.0;
                    let currentRadius = maxBallRadius * chargeProgress + Mathf.absin(Time.time, 1.5, 1.0);
                    let ballColor = colorNormal;
                    
                    drawLaytLaserRing(centerGunX, centerGunY, currentRadius * 0.6, currentRadius * 0.6, this.rotation + Time.time * 2, 0, ballColor, true);
                    drawLaytLaserRing(centerGunX, centerGunY, currentRadius, currentRadius, this.rotation - Time.time * 3, 1.5, ballColor, false);
                    Draw.reset();
                }

                Draw.z(Layer.bullet + 1);
                let aimStroke = 1.0 + Mathf.absin(Time.time, 2.0, 0.3);
                Draw.color(laytAimColor);
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

                drawLaytLaserRing(ringX, ringY, baseRadiusX, baseRadiusY, laserAngle, ringStroke, this.currentLaserColor, false);

                let sphereForwardOffset = Mathf.lerp(0, 45, t);
                let ballShotX = centerGunX + Angles.trnsx(laserAngle, sphereForwardOffset);
                let ballShotY = centerGunY + Angles.trnsy(laserAngle, sphereForwardOffset);
                let distortedRadiusX = 12.0 * progress * 1.9; 
                let distortedRadiusY = 12.0 * progress * 0.2; 

                drawLaytLaserRing(ballShotX, ballShotY, distortedRadiusX, distortedRadiusY, laserAngle, 0, this.currentLaserColor, true);
                Draw.reset();
            }
        },

        write(write) { 
            this.super$write(write); 
            write.f(this.continuousShotCount);
        },
        read(read, revision) { 
            this.super$read(read, revision); 
            this.continuousShotCount = read.f();
        }
    };
}
 
const laytery = extend(PowerTurret, "laytery", {});

laytery.health = 5200;         
laytery.size = 4;                
laytery.range = 224;             // Giảm 20% so với gốc 280 (280 * 0.8 = 224)
laytery.reload = 9999;           
laytery.shootType = laytFakeBullet; 
laytery.consumePower(12);        

laytery.targetAir = true;        
laytery.targetGround = true;     
laytery.configurable = true;     
laytery.canControl = false;

laytery.buildType = () => extend(PowerTurret.PowerTurretBuild, laytery, makeLaytBuild());