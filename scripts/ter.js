// File: scripts/ter.js

// ==========================================================================
// ĐỊNH NGHĨA LOGIC CHO UNIT: TER (MÁY CÀY TĂNG BẬT/TẮT LASER BẰNG NHẤP ĐÚP)
// CHỦ THỂ: TANKUNIT
// ==========================================================================

let lastTapTimeTer = 0;
const doubleTapIntervalTer = 250; // Khoảng thời gian nhấp đúp (0.25 giây) 

// Định nghĩa tia laser hình quạt (Sát thương 45, độ xuyên thấu cao) 
const terLaserBullet = extend(LaserBulletType, {
    damage: 45, 
    length: 160, // Tầm bắn 20 ô 
    width: 8, 
    colors: [Color.purple.cpy().mul(0.6), Color.purple, Color.white] 
});

Events.on(ClientLoadEvent, () => {
    const terUnit = Vars.content.getByName(ContentType.unit, "newex-ter");
    
    if(terUnit != null){
        terUnit.constructor = () => {
            return extend(Packages.mindustry.gen.TankUnit, {
                // Biến bổ trợ thao tác điều khiển
                wasTouchedPrevTer: false, 
                
                // Trạng thái bật/tắt sấy Laser chủ động bằng nhấp đúp
                isLaserModeActive: false,
                laserShotTimer: 0,

                update(){
                    this.super$update(); 

                    // 1. BẮT SỰ KIỆN NHẤP ĐÚP ĐỂ CHUYỂN ĐỔI TRẠNG THÁI BẮN LASER
                    if(Vars.player.unit() == this){ 
                        let isTouchedNow = Core.input.isTouched(); 
                        if(isTouchedNow && !this.wasTouchedPrevTer){ 
                            let currentTime = Time.millis(); 
                            if((currentTime - lastTapTimeTer) < doubleTapIntervalTer){ 
                                if(!this.dead){
                                    // Đổi trạng thái: Nếu đang bật thì tắt, nếu đang tắt thì bật
                                    this.isLaserModeActive = !this.isLaserModeActive;
                                    
                                    // Kích hoạt hiệu ứng hình ảnh báo hiệu chuyển chế độ
                                    if(this.isLaserModeActive){
                                        Fx.heal.at(this.x, this.y, 16, Color.purple);
                                    } else {
                                        Fx.smoke.at(this.x, this.y);
                                    }
                                }
                            }
                            lastTapTimeTer = currentTime; 
                        }
                        this.wasTouchedPrevTer = isTouchedNow; 
                    }

                    // 2. LOGIC XẢ LOẠT TIA LASER HÌNH QUẠT KHI TRẠNG THÁI ĐƯỢC BẬT
                    if(this.isLaserModeActive && !this.dead){
                        this.laserShotTimer += Time.delta;
                        
                        // Cứ mỗi 10 frames (~0.16s) sẽ quét bắn ra một đợt đạn 
                        if(Math.floor(this.laserShotTimer) % 10 === 0){ 
                            // Bắn cụm 3 tia laser quét thành một góc hình quạt 8 độ 
                            for(let i = -1; i <= 1; i++){ 
                                let shotAngle = this.rotation + (i * 4); 
                                terLaserBullet.create(this, this.team, this.x, this.y, shotAngle); 
                            }
                        }
                    } else {
                        this.laserShotTimer = 0;
                    }
                },

                draw(){
                    this.super$draw(); 

                    // VẼ HIỆU ỨNG VÒNG NĂNG LƯỢNG TÍM XUNG QUANH XE TĂNG KHI ĐANG BẬT CHẾ ĐỘ SẤY LASER
                    if(this.isLaserModeActive && !this.dead){
                        Draw.z(Layer.effect); 
                        Draw.color(Color.purple, Mathf.absin(Time.time, 2.0, 0.4));
                        Lines.stroke(1.5);
                        Lines.circle(this.x, this.y, this.hitSize + 3 + Mathf.absin(Time.time, 1.0, 1.0)); 
                        Draw.reset(); 
                    }
                }
            });
        };
    }
});