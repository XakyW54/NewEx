(function() {
    const packCons2 = (func) => new Cons2({ get: func });
    const packRun = (func) => new java.lang.Runnable({ run: func });
    const packProv = (func) => new Prov({ get: func });

    // Yêu cầu tài nguyên nâng cấp
    const reqMK2 = { titanium: 500, silicon: 300 };
    const reqMK2B = { titanium: 800, silicon: 400, plastanium: 200 }; 

    // Chỉ số tích tụ và suy giảm Buff
    const gainPerShotMK1 = 0.10; 
    const decaySpeedMK1 = 0.15; 

    const gainPerShotMK2 = 0.20; 
    const decaySpeedMK2 = 0.08; 

    const gainPerShotMK2B = 0.15; 
    const decaySpeedMK2B = 0.10; 

    const modPrefix = "newex";

    // TẦM BẮN TỐI ĐA CỦA ĐÒN DỒN LỰC (ULTIMATE): Speed 25 * Lifetime 30 = 750 pixel
    const ULT_RANGE = 750;

    // HIỆU ỨNG VA CHẠM THƯỜNG (CỦA GALILEO)
    const galileoHitEffect = extend(ParticleEffect, {
        line: true,
        particles: 8,
        lifetime: 26,
        length: 35,
        cone: -40,
        lenFrom: 6,
        lenTo: 6,
        colorFrom: Color.valueOf("A9D8FF"),
        colorTo: Color.valueOf("66B1FF")
    });

    // 1. HIỆU ỨNG VÒNG XÉ GIÓ OVAL CHUẨN THEO HƯỚNG BẮN
    const ultShockwaveEffect = new Effect(40, cons(e => {
        let fin = e.fin();
        let fout = e.fout();
        let steps = 30;

        let rad = e.rotation * Mathf.degRad;
        let cosA = Math.cos(rad);
        let sinA = Math.sin(rad);

        // VÒNG 1: VÒNG CHÍNH
        Draw.color(Color.white, Color.valueOf("66B1FF"), fin);
        Lines.stroke(5.0 * fout);

        let radiusX = fin * 30;  
        let radiusY = fin * 80;  
        let offset = fin * 35; 

        let cx = e.x + cosA * offset;
        let cy = e.y + sinA * offset;

        let lastX = 0, lastY = 0;

        for(let i = 0; i <= steps; i++){
            let angle = (i * (360 / steps)) * Mathf.degRad;
            
            let lx = Math.cos(angle) * radiusX;
            let ly = Math.sin(angle) * radiusY;

            let rx = cx + (lx * cosA - ly * sinA);
            let ry = cy + (lx * sinA + ly * cosA);

            if(i > 0) Lines.line(lastX, lastY, rx, ry);
            lastX = rx;
            lastY = ry;
        }

        // VÒNG 2: VÒNG TĂNG TỐC PHỤ
        Draw.color(Color.valueOf("A9D8FF"), Color.valueOf("3399FF"), fin);
        Lines.stroke(3.0 * fout);

        let radiusX2 = fin * 20;
        let radiusY2 = fin * 50;
        let offset2 = fin * 65;

        let cx2 = e.x + cosA * offset2;
        let cy2 = e.y + sinA * offset2;

        let lastX2 = 0, lastY2 = 0;

        for(let i = 0; i <= steps; i++){
            let angle = (i * (360 / steps)) * Mathf.degRad;
            
            let lx = Math.cos(angle) * radiusX2;
            let ly = Math.sin(angle) * radiusY2;

            let rx = cx2 + (lx * cosA - ly * sinA);
            let ry = cy2 + (lx * sinA + ly * cosA);

            if(i > 0) Lines.line(lastX2, lastY2, rx, ry);
            lastX2 = rx;
            lastY2 = ry;
        }

        Draw.reset();
    }));

    // Cụm tia năng lượng va chạm cao tần
    const ultBlastEffect = extend(ParticleEffect, {
        line: true,
        particles: 32,
        lifetime: 55,
        length: 130,
        cone: 360,
        lenFrom: 20,
        lenTo: 2,
        strokeFrom: 7,
        strokeTo: 0,
        colorFrom: Color.white,
        colorTo: Color.valueOf("3399FF")
    });

    // Vệt hạt năng lượng phát sáng bứt phá
    const ultParticlesEffect = extend(ParticleEffect, {
        particles: 24,
        lifetime: 60,
        length: 90,
        cone: 360,
        sizeFrom: 6,
        sizeTo: 0,
        colorFrom: Color.valueOf("A9D8FF"),
        colorTo: Color.valueOf("1a4a88")
    });

    // 2. CÁC LOẠI ĐẠN THƯỜNG
    const forstarsilumBullet = extend(BasicBulletType, {
        speed: 10, damage: 78, lifetime: 30, width: 20, height: 40,
        shrinkX: 0, shrinkY: 0,
        frontColor: Color.valueOf("bbdefb"), backColor: Color.valueOf("90caf9"),
        sprite: modPrefix + "-starsword",
        inaccuracy: 0,
        pierce: true, pierceCap: 999, pierceBuilding: true, knockback: 1, impact: true,
        hitEffect: galileoHitEffect,
        despawnEffect: galileoHitEffect
    });

    const forstarsilumMK2Bullet = extend(BasicBulletType, {
        speed: 12.5, damage: 105, lifetime: 30, width: 22, height: 44,
        shrinkX: 0, shrinkY: 0,
        frontColor: Color.valueOf("bbdefb"), backColor: Color.valueOf("90caf9"),
        sprite: modPrefix + "-starsword",
        inaccuracy: 0,
        pierce: true, pierceCap: 999, pierceBuilding: true, knockback: 1.4, impact: true,
        hitEffect: galileoHitEffect,
        despawnEffect: galileoHitEffect
    });

    const forstarsilumMK2BBullet = extend(BasicBulletType, {
        speed: 11.5, damage: 165, lifetime: 30, width: 24, height: 48,
        shrinkX: 0, shrinkY: 0,
        frontColor: Color.valueOf("ff8888"), backColor: Color.valueOf("dd4444"),
        sprite: modPrefix + "-starsword",
        inaccuracy: 0,
        pierce: true, pierceCap: 999, pierceBuilding: true, knockback: 2.0, impact: true, 
        homingPower: 0.18, homingRange: 300,
        hitEffect: galileoHitEffect,
        despawnEffect: galileoHitEffect
    });

    // ĐẠN DỒN LỰC (ULTIMATE)
    const ultBullet = extend(BasicBulletType, {
        speed: 25, damage: 850, lifetime: 30, width: 35, height: 70,
        shrinkX: 0, shrinkY: 0,
        frontColor: Color.white, backColor: Color.valueOf("bbdefb"),
        sprite: modPrefix + "-starsword",
        inaccuracy: 0,
        pierce: true, pierceCap: 999, pierceBuilding: true, knockback: 4.0, impact: true,
        
        armorPiercing: 0.80,

        hitEffect: galileoHitEffect,
        despawnEffect: galileoHitEffect,

        hitEntity: function(b, entity, health) {
            this.super$hitEntity(b, entity, health);

            if (entity.armor !== undefined) {
                entity.armor = entity.armor * 0.5;
            }

            if (Mathf.chance(0.50)) {
                let extraCritDmg = b.damage * 4.0;
                entity.damage(extraCritDmg);

                ultShockwaveEffect.at(b.x, b.y, b.rotation());
                ultBlastEffect.at(b.x, b.y);
                ultParticlesEffect.at(b.x, b.y);
                Effect.shake(14, 14, b.x, b.y);
            }
        }
    });

    // 3. GẮN LOGIC VÀO BLOCK
    Events.on(ContentInitEvent, () => {
        let forstarsilum = Vars.content.getByName(ContentType.block, modPrefix + "-forstarsilum");

        if (forstarsilum == null) return;

        forstarsilum.configurable = true;
        forstarsilum.shootType = forstarsilumBullet;

        forstarsilum.addBar("dmg_bonus", new Func({
            get: function(e){
                return new Bar(
                    new Prov({ get: function(){ return "DMG: +" + Math.floor(e.getDmgRatio() * 500) + "%"; } }),
                    new Prov({ get: function(){ return Color.orange; } }),
                    new Floatp({ get: function(){ return e.getDmgRatio(); } })
                );
            }
        }));

        forstarsilum.addBar("as_bonus", new Func({
            get: function(e){
                return new Bar(
                    new Prov({ get: function(){ return "AS: " + (Math.floor(e.getAsRatio() * 250) >= 0 ? "+" : "") + Math.floor(e.getAsRatio() * 250) + "%"; } }),
                    new Prov({ get: function(){ return Color.cyan; } }),
                    new Floatp({ get: function(){ return Math.max(e.getAsRatio(), 0); } })
                );
            }
        }));

        forstarsilum.config(java.lang.Integer, packCons2((tile, value) => {
            if (tile != null && tile.setTier !== undefined) {
                tile.setTier(value);
            }
        }));

        forstarsilum.buildType = () => extend(PowerTurret.PowerTurretBuild, forstarsilum, {
            energyState: 0.0,
            tierState: 0, 
            customRecoil: 0.0,
            
            chargeTimer: 0.0,
            isChargingUlt: false,
            noResetChanceMK2B: 0.80, // Tỷ lệ giữ buff ban đầu cho MK2B

            peekAmmo(){
                let tier = this.getTier();
                if(tier == 1) return forstarsilumMK2Bullet;
                if(tier == 2) return forstarsilumMK2BBullet;
                return forstarsilumBullet;
            },

            useAmmo(){
                return this.peekAmmo();
            },

            getTier(){ return this.tierState == null ? 0 : this.tierState; },
            setTier(val){ 
                this.tierState = val;
                if(val == 0) { this.health = 1200; }
                if(val == 1) { this.health = 1800; }
                if(val == 2) { this.health = 1600; }
                this.maxHealth = this.health;
            },

            range(){
                return ULT_RANGE; 
            },

            buildConfiguration(table){
                table.clear(); table.row();
                let tier = this.getTier();

                if(tier == 0) {
                    table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                        let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Forstarsilum", {});
                        
                        let reqCell = dialog.cont.label(packProv(() => {
                            let core = this.team.core();
                            if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                            let currentTitanium = core.items.get(Items.titanium);
                            let currentSilicon = core.items.get(Items.silicon);
                            let currentPlastanium = core.items.get(Items.plastanium);

                            let titColor1 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                            let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
                            
                            let titColor2 = currentTitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                            let silColor2 = currentSilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                            let plaColor2 = currentPlastanium >= reqMK2B.plastanium ? "[green]" : "[red]";

                            return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                                   "[cyan]Nhánh MK2:[]\n" +
                                   " • Titan: " + titColor1 + currentTitanium + "[] / " + reqMK2.titanium + "\n" +
                                   " • Silicon: " + silColor1 + currentSilicon + "[] / " + reqMK2.silicon + "\n" +
                                   "[purple]Nhánh MK2B:[]\n" +
                                   " • Titan: " + titColor2 + currentTitanium + "[] / " + reqMK2B.titanium + "\n" +
                                   " • Silicon: " + silColor2 + currentSilicon + "[] / " + reqMK2B.silicon + "\n" +
                                   " • Nhựa: " + plaColor2 + currentPlastanium + "[] / " + reqMK2B.plastanium;
                        }));
                        
                        reqCell.width(360).get().setWrap(true);
                        reqCell.get().setAlignment(Align.left);
                        dialog.cont.row(); dialog.cont.add().height(10).row();

                        let branchesTable = new Table();

                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                        b1.add("[cyan]===(MK2 - XUYÊN PHÁ NĂNG LƯỢNG)===[]").row();
                        let b1D = b1.add("[white]• Máu cấu trúc: [green]+50%[] (1,800 HP)\n" +
                                         "• Tầm bắn: [gold]750 px[]\n" +
                                         "• Sát thương gốc: [green]+34.6%[] (105 DMG)\n\n" +
                                         "[lightgray]Kỹ năng đặc biệt: Gia Tốc Từ Tính — Tích lũy buff gấp đôi (+20%/viên), [gold]40% cơ hội bắn đòn dồn lực (tụ kiếm 1s) theo mỗi phát bắn thường[].[]");
                        b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                        b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                            let core = this.team.core();
                            if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                                core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                                ultShockwaveEffect.at(this.x, this.y, this.rotation); Effect.shake(4, 4, this.x, this.y);
                                this.configure(java.lang.Integer(1)); 
                                dialog.hide(); this.deselect();
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                        })).size(180, 38);

                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                        b2.add("[purple]===(MK2B - TRUY ĐUỔI TẦM NHIỆT)===[]").row();
                        let b2D = b2.add("[white]• Máu cấu trúc: [green]+33.3%[] (1,600 HP)\n" +
                                         "• Tầm bắn: [gold]750 px[]\n" +
                                         "• Sát thương gốc: [green]+111.5%[] (165 DMG)\n\n" +
                                         "[lightgray]Kỹ năng đặc biệt: Duy Trì Năng Lượng — Sau khi bắn đòn dồn lực, [gold]có xác suất KHÔNG RESET thanh buff (80% -> 70% -> ... -> 0%)[].[]");
                        b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                        b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                            let core = this.team.core();
                            if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                                core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                                ultShockwaveEffect.at(this.x, this.y, this.rotation); Effect.shake(4, 4, this.x, this.y);
                                this.configure(java.lang.Integer(2)); 
                                dialog.hide(); this.deselect();
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                        })).size(180, 38);

                        branchesTable.add(b1).width(340); branchesTable.row();
                        branchesTable.add().height(12).row();
                        branchesTable.add(b2).width(340);

                        let scroll = new ScrollPane(branchesTable);
                        scroll.setScrollingDisabled(true, false);
                        dialog.cont.add(scroll).maxHeight(400);
                        dialog.addCloseButton(); dialog.show();
                    })).size(50, 40).tooltip("Nâng cấp hệ thống Forstarsilum");
                } else {
                    table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                        Vars.ui.showInfo("[scarlet]HỆ THỐNG FORSTARSILUM ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
                    })).size(50, 40).tooltip("Đã đạt cấp tối đa");
                }

                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = " Thông số pháo Forstarsilum: ";
                    let descStr = "";
                    let currentTier = this.getTier();

                    if (currentTier == 0) {
                        title += "[yellow](MK1)[]";
                        descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                                  "[lightgray]Máu tháp pháo:[] [green]1,200[]\n" +
                                  "[lightgray]Tầm bắn hiệu dụng:[] [orange]750 pixel[]\n" +
                                  "[lightgray]Sát thương gốc:[] [yellow]78.00 DMG[]\n" +
                                  "[lightgray]Tốc độ bắn:[] [white]1 phát / 1.0 giây[]\n\n" +
                                  "[sky]⚡ CƠ CHẾ NĂNG LƯỢNG TÍCH LŨY (BUFF):[]\n" +
                                  "• [lightgray]Tích lũy Buff:[] Mỗi phát bắn trúng/kích hoạt sẽ tăng [green]+10.0%[] buff.\n" +
                                  "• [lightgray]Suy giảm:[] Tự động suy giảm dần theo thời gian khi không bắn mục tiêu.";
                    } 
                    else if (currentTier == 1) {
                        title += "[cyan](MK2)[]";
                        descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                                  "[lightgray]Máu tháp pháo:[] [green]1,800 [lime](+50%)[]\n" +
                                  "[lightgray]Tầm bắn hiệu dụng:[] [orange]750 pixel[]\n" +
                                  "[lightgray]Sát thương gốc:[] [yellow]105.00 DMG [lime](+34.6%)[]\n\n" +
                                  "[lime]⚡ CƠ CHẾ ĐẶC BIỆT MK2:[]\n" +
                                  "• [lightgray]Xác suất Ult:[] Có [gold]40% cơ hội[] kích hoạt tụ kiếm 1s bắn đòn dồn lực theo mỗi phát bắn thường.\n" +
                                  "• [lightgray]Tốc độ tích tụ:[] Tăng [green]+20.0%[] buff mỗi phát bắn.\n" +
                                  "• [lightgray]Duy trì ổn định:[] Tốc độ rớt buff khi dừng bắn giảm còn [green]0.08/s[].";
                    } 
                    else if (currentTier == 2) {
                        title += "[purple](MK2B)[]";
                        descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                                  "[lightgray]Máu tháp pháo:[] [green]1,600 [lime](+33.3%)[]\n" +
                                  "[lightgray]Tầm bắn hiệu dụng:[] [orange]750 pixel[]\n" +
                                  "[lightgray]Sát thương gốc:[] [red]165.00 DMG (+111.5%)[]\n\n" +
                                  "[purple]🔥 CƠ CHẾ ĐẶC BIỆT MK2B:[]\n" +
                                  "• [lightgray]Không Reset Buff:[] Sau đòn dồn lực, có cơ hội [gold]giữ nguyên 100% buff[] không bị reset (80% -> 70% -> ... -> 0%).\n" +
                                  "• [lightgray]Mạch định vị:[] Đạn Starsword [pink]tự động bẻ lái tìm mục tiêu[] (300px).\n" +
                                  "• [lightgray]Tích lũy hỏa lực:[] Tăng [green]+15.0%[] buff/viên.";
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

            config() { return java.lang.Integer(this.getTier()); },

            // Hàm thực thi bắn đòn dồn lực ngay lập tức
            executeUltFire(muzzleX, muzzleY) {
                ultBullet.create(this, this.team, muzzleX, muzzleY, this.rotation, 1.0, 1.0);
                ultShockwaveEffect.at(muzzleX, muzzleY, this.rotation);
                Effect.shake(5, 5, this.x, this.y);
            },

            // Kích hoạt tiến trình gồng kiếm 1s cho mọi đòn dồn lực
            startUltCharge() {
                this.isChargingUlt = true;
                this.chargeTimer = 0.0;
            },

            updateTile(){
                this.super$updateTile();
                let tier = this.getTier();

                let currentDecay = decaySpeedMK1;
                if(tier == 1) currentDecay = decaySpeedMK2;
                if(tier == 2) currentDecay = decaySpeedMK2B;

                // Tự giảm buff khi dừng bắn và không trong trạng thái gồng
                if((!this.isShooting || !this.isActive()) && !this.isChargingUlt){ 
                    if(this.energyState > 0.0){ 
                        this.energyState = Math.max(this.energyState - (currentDecay * Time.delta / 60), 0.0); 
                    } 
                }

                // Tự động kích hoạt gồng khi đầy thanh năng lượng
                if(this.energyState >= 0.999 && !this.isChargingUlt){
                    this.startUltCharge();
                }

                // TIẾN TRÌNH TỤ 5 KIẾM (ĐỦ 60 TICKS = 1 GÂY MỚI BẮN)
                if(this.isChargingUlt){
                    this.chargeTimer += Time.delta;

                    if(this.chargeTimer >= 60.0){
                        let rad = this.rotation * Mathf.degRad;
                        let muzzleX = this.x + Math.cos(rad) * 12;
                        let muzzleY = this.y + Math.sin(rad) * 12;

                        this.executeUltFire(muzzleX, muzzleY);

                        // CƠ CHẾ MK2B: XÁC SUẤT KHÔNG RESET BUFF (80% -> 70% -> ... -> 0%)
                        if(tier == 2 && Mathf.chance(this.noResetChanceMK2B)){
                            this.energyState = 1.0; // Giữ nguyên đầy buff
                            this.noResetChanceMK2B = Math.max(this.noResetChanceMK2B - 0.10, 0.0); // Giảm 10% xác suất cho đòn sau
                        } else {
                            this.energyState = 0.0; // Reset buff về 0
                            this.noResetChanceMK2B = 0.80; // Reset lại xác suất ban đầu
                        }

                        this.chargeTimer = 0.0;
                        this.isChargingUlt = false;
                    }
                }

                this.customRecoil = Mathf.approach(this.customRecoil, 0.0, 0.12 * Time.delta);
            },

            shoot(type){
                if(this.isChargingUlt) return;

                this.super$shoot(type); 

                let tier = this.getTier();
                let currentGain = gainPerShotMK1;
                if(tier == 1) currentGain = gainPerShotMK2;
                if(tier == 2) currentGain = gainPerShotMK2B;

                // CƠ CHẾ MK2: 40% CƠ HỘI KÍCH HOẠT TỤ KIẾM BẮN ĐÒN DỒN LỰC KHI BẮN ĐẠN THƯỜNG
                if(tier == 1 && Mathf.chance(0.40)){
                    this.startUltCharge();
                }

                this.energyState = Math.min(this.energyState + currentGain, 1.0); 
                this.customRecoil = 1.0;
            },

            handleBullet(bullet, x, y, angle){ 
                if(bullet != null) bullet.damage = bullet.type.damage * (1 + this.energyState * 5); 
                this.super$handleBullet(bullet, x, y, angle); 
            },

            baseReloadSpeed(){ return this.efficiency * (1 + this.energyState * 2.5); },
            getDmgRatio(){ return this.energyState; }, 
            getAsRatio(){ return this.energyState; },

            draw(){
                let baseRegion = Core.atlas.find(this.block.basePrefix + "" + this.block.size);
                if(baseRegion.found()){
                    Draw.rect(baseRegion, this.x, this.y);
                } else {
                    this.super$draw(); 
                }

                let rad = this.rotation * Mathf.degRad;
                let cos = Math.cos(rad);
                let sin = Math.sin(rad);

                let maxBarrelRecoilDistance = -5.0; 
                let energyVal = this.energyState; 
                let sideMoveDistance = energyVal * 4.0; 

                let barrel1Region = Core.atlas.find(modPrefix + "-forstarsilum-barrel1");
                if(barrel1Region.found()){
                    let b1x = this.x - (sideMoveDistance * sin);
                    let b1y = this.y + (sideMoveDistance * cos);
                    Draw.rect(barrel1Region, b1x, b1y, this.rotation);
                }

                let barrel2Region = Core.atlas.find(modPrefix + "-forstarsilum-barrel2");
                if(barrel2Region.found()){
                    let b2x = this.x + (sideMoveDistance * sin);
                    let b2y = this.y - (sideMoveDistance * cos);
                    Draw.rect(barrel2Region, b2x, b2y, this.rotation);
                }

                let b1Offset = this.customRecoil * maxBarrelRecoilDistance;
                let b1Region = Core.atlas.find(modPrefix + "-forstarsilum-b1");
                if (b1Region.found()) {
                    let b1ax = this.x + b1Offset * cos;
                    let b1ay = this.y + b1Offset * sin;
                    Draw.rect(b1Region, b1ax, b1ay, this.rotation);
                }

                // HIỆU ỨNG TỤ 5 THANH KIẾM TRONG 1 GIÂY (60 TICKS) CHO MỌI ĐÒN DỒN LỰC
                if(this.isChargingUlt){
                    let swordRegion = Core.atlas.find(modPrefix + "-starsword");
                    if(swordRegion.found()){
                        Draw.z(Layer.effect + 1);
                        let progress = Math.min(this.chargeTimer / 60.0, 1.0); 
                        
                        let muzzleX = this.x + cos * 16;
                        let muzzleY = this.y + sin * 16;
                        let baseRadius = 35.0 * (1.0 - progress * 0.7); 

                        for(let i = 0; i < 5; i++){
                            let angleOffset = (i - 2) * 25.0 * (1.0 - progress); 
                            let swordAngle = this.rotation + angleOffset;
                            let swordRad = swordAngle * Mathf.degRad;

                            let currentX = Mathf.lerp(this.x + Math.cos(swordRad) * baseRadius, muzzleX, progress);
                            let currentY = Mathf.lerp(this.y + Math.sin(swordRad) * baseRadius, muzzleY, progress);

                            Draw.color(Color.white);
                            Draw.alpha(0.4 + progress * 0.6);
                            Draw.rect(swordRegion, currentX, currentY, 35, 50, this.rotation - 90);
                        }
                        Draw.reset();
                    }
                }
            },

            write(write){ 
                this.super$write(write); 
                write.b(this.getTier()); 
                write.f(this.energyState != null ? this.energyState : 0.0); 
                write.f(this.noResetChanceMK2B != null ? this.noResetChanceMK2B : 0.80);
            },
            read(read, revision){ 
                this.super$read(read, revision); 
                this.setTier(read.b()); 
                if(revision >= 1) this.energyState = read.f(); 
                if(revision >= 2) this.noResetChanceMK2B = read.f();
                this.customRecoil = 0.0;
            }
        });
    });
})();