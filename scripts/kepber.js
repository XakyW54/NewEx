// ==========================================================================
// ĐỊNH NGHĨA LOGIC CHO UNIT: KEPBER (MOD: newex) - NÂNG CẤP TOÀN DIỆN
// ==========================================================================

let lastTapTimeKepber = 0;
const doubleTapIntervalKepber = 250; 

// Định nghĩa tia laser phụ khi đứng yên (Sát thương 45, độ xuyên thấu cao)
const kepberLaserBullet = extend(LaserBulletType, {
    damage: 45,
    length: 160, // Tầm bắn 20 ô (1 ô = 8 pixels)
    width: 8,
    colors: [Color.purple.cpy().mul(0.6), Color.purple, Color.white]
});

Events.on(ClientLoadEvent, () => {
    const kepberUnit = Vars.content.getByName(ContentType.unit, "newex-kepber");
    
    if(kepberUnit != null){
        kepberUnit.constructor = () => {
            return extend(Packages.mindustry.gen.LegsUnit, {
                // Biến bổ trợ dịch chuyển (TP)
                moveTimer: 0,
                teleportCooldown: 0,
                isTeleportingEffect: false,
                wasTouchedPrevKepber: false,
                
                effectTimer: 0,
                maxEffectDuration: 25, 
                posA_X: 0, posA_Y: 0,
                posB_X: 0, posB_Y: 0,

                // Biến bổ trợ trạng thái bắn laser khi đứng yên
                stillTimer: 0,
                laserCooldown: 0,
                isLaserFiring: false,
                laserFireDuration: 0,

                update(){
                    this.super$update();

                    if(this.teleportCooldown > 0) this.teleportCooldown--;
                    if(this.laserCooldown > 0) this.laserCooldown--;

                    let shouldTriggerTP = false;

                    // 1. KIỂM TRA ĐIỀU KIỆN TỰ ĐỘNG DI CHUYỂN HOẶC NHẤN ĐÚP ĐỂ TP
                    if(Vars.player.unit() == this){
                        let isTouchedNow = Core.input.isTouched();
                        if(isTouchedNow && !this.wasTouchedPrevKepber){
                            let currentTime = Time.millis();
                            if((currentTime - lastTapTimeKepber) < doubleTapIntervalKepber){
                                if(this.teleportCooldown <= 0 && !this.dead){
                                    shouldTriggerTP = true;
                                }
                            }
                            lastTapTimeKepber = currentTime;
                        }
                        this.wasTouchedPrevKepber = isTouchedNow;
                    }

                    // Tự động tích tụ thời gian di chuyển nếu đang chạy
                    if(this.vel.len() > 0.1 && !this.dead){
                        this.moveTimer += Time.delta;
                        if(this.moveTimer >= 120 && this.teleportCooldown <= 0){
                            shouldTriggerTP = true;
                        }
                        this.stillTimer = 0; // Đang chạy thì reset bộ đếm đứng yên
                    } else if(!this.dead) {
                        this.moveTimer = 0;
                        this.stillTimer += Time.delta; // Tích lũy thời gian đứng yên
                    }

                    // 2. THỰC THI LOGIC DỊCH CHUYỂN TỨC THỜI (XUYÊN TƯỜNG + NÉ ĐIỂM KẸT)
                    if(shouldTriggerTP){
                        // Ngẫu nhiên khoảng cách dịch chuyển từ 3 đến 7 ô (1 ô = 8 pixels -> 24 đến 56 pixels)
                        let randomTiles = 3 + Math.floor(Math.random() * 5); 
                        let tpDistance = randomTiles * 8; 
                        let moveAngle = this.vel.len() > 0.1 ? this.vel.angle() : this.rotation;

                        let targetX = this.x + Angles.trnsx(moveAngle, tpDistance);
                        let targetY = this.y + Angles.trnsy(moveAngle, tpDistance);

                        // Kiểm tra xem vị trí đích đến có bị chặn bởi tường (Solid block) hay không
                        let isTargetSolid = Vars.world.solid(Vars.world.toTile(targetX), Vars.world.toTile(targetY));

                        if(isTargetSolid){
                            // Nếu đích đến là tường dày đặc, giữ nguyên vị trí đứng hiện tại để né kẹt
                            this.posA_X = this.x;
                            this.posA_Y = this.y;
                            this.posB_X = this.x;
                            this.posB_Y = this.y;
                        } else {
                            // Nếu vị trí trống, cho phép dịch chuyển xuyên qua các vật thể trung gian
                            this.posA_X = this.x;
                            this.posA_Y = this.y;
                            this.posB_X = targetX;
                            this.posB_Y = targetY;
                            this.set(this.posB_X, this.posB_Y);
                        }

                        // Kích hoạt sát thương nổ tại điểm đích B
                        Damage.damage(this.team, this.posB_X, this.posB_Y, 32, 100, false, true);
                        Fx.blastExplosion.at(this.posB_X, this.posB_Y);
                        Fx.shockwave.at(this.posB_X, this.posB_Y); 

                        this.isTeleportingEffect = true;
                        this.effectTimer = this.maxEffectDuration;

                        this.moveTimer = 0;
                        this.teleportCooldown = 30; 
                    }

                    // 3. LOGIC BẮN LOẠT TIA LASER HÌNH QUẠT KHI ĐỨNG YÊN
                    // Đứng yên liên tục 3 giây (180 frames) và hết cooldown hồi chiêu
                    if(this.stillTimer >= 180 && this.laserCooldown <= 0 && !this.isLaserFiring && !this.dead){
                        this.isLaserFiring = true;
                        // Thời gian xả đạn ngẫu nhiên xung quanh mốc ~5 giây (300 frames)
                        this.laserFireDuration = 240 + Math.floor(Math.random() * 120); 
                    }

                    if(this.isLaserFiring){
                        // Cứ mỗi 10 frames (~0.16s) đứng yên sẽ quét bắn ra một đợt đạn
                        if(Math.floor(this.laserFireDuration) % 10 === 0){
                            // Bắn cụm 3 tia laser quét thành một góc hình quạt 8 độ (từ -4 độ đến +4 độ so với hướng nhìn)
                            for(let i = -1; i <= 1; i++){
                                let shotAngle = this.rotation + (i * 4);
                                kepberLaserBullet.create(this, this.team, this.x, this.y, shotAngle);
                            }
                        }
                        
                        this.laserFireDuration -= Time.delta;
                        
                        // Nếu lỡ di chuyển giữa chừng hoặc hết thời gian xả đạn, tắt chế độ sấy laser
                        if(this.laserFireDuration <= 0 || this.vel.len() > 0.1 || this.dead){
                            this.isLaserFiring = false;
                            this.laserCooldown = 180; // Cài thời gian hồi chiêu là đúng 3 giây (180 frames)
                        }
                    }

                    // Tiến trình giảm thời gian hiệu ứng hố đen
                    if(this.isTeleportingEffect){
                        this.effectTimer -= Time.delta;
                        if(this.effectTimer <= 0) this.isTeleportingEffect = false;
                    }
                },

                draw(){
                    this.super$draw();

                    // VẼ HIỆU ỨNG HỐ ĐEN VŨ TRỤ CÓ ZOOM THU NHỎ MƯỢT
                    if(this.isTeleportingEffect){
                        Draw.z(Layer.effect + 1); 
                        
                        let progress = this.effectTimer / this.maxEffectDuration;
                        let zoomScale = progress > 0.5 ? 1.0 : (progress * 2.0); 
                        let currentRadius = this.hitSize * zoomScale; 

                        if(currentRadius > 0.1){
                            // --- VẼ HỐ ĐEN TẠI VỊ TRÍ CŨ A ---
                            Draw.color(Color.black);
                            Fill.circle(this.posA_X, this.posA_Y, currentRadius);
                            Draw.color(Color.purple);
                            Lines.stroke(2.5 * zoomScale); 
                            Lines.circle(this.posA_X, this.posA_Y, currentRadius + Mathf.absin(Time.time, 1.5, 1.5 * zoomScale));

                            // --- VẼ HỐ ĐEN TẠI VỊ TRÍ MỚI B ---
                            Draw.color(Color.black);
                            Fill.circle(this.posB_X, this.posB_Y, currentRadius);
                            Draw.color(Color.purple);
                            Lines.stroke(2.5 * zoomScale);
                            Lines.circle(this.posB_X, this.posB_Y, currentRadius + Mathf.absin(Time.time, 1.5, 1.5 * zoomScale));
                            
                            Draw.reset(); 
                        }
                    }

                    // VẼ HIỆU ỨNG SẠC NĂNG LƯỢNG TÍM KHI ĐỨNG YÊN CHUẨN BỊ SẤY LASER
                    if(this.stillTimer >= 60 && this.laserCooldown <= 0 && !this.dead){
                        Draw.z(Layer.effect);
                        Draw.color(Color.purple, Mathf.absin(Time.time, 2.0, 0.4));
                        Lines.stroke(1.2);
                        Lines.circle(this.x, this.y, this.hitSize + 2 + Mathf.absin(Time.time, 1.0, 1.0));
                        Draw.reset();
                    }
                }
            });
        };
    }
});