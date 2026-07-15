const packCons = (func) => new Cons({ get: func }); 
const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqMK2 = { titanium: 500, silicon: 300 };
const reqMK2B = { titanium: 800, silicon: 400, plastanium: 200 }; 

const gainPerShotMK1 = 0.015; 
const coolSpeedMK1 = 0.15;   

const gainPerShotMK2 = 0.02; 
const coolSpeedMK2 = 0.12;   

const gainPerShotMK2B = 0.03; 
const coolSpeedMK2B = 0.08;  

// =========================================================
// HỆ THỐNG HIỆU ỨNG TỰ TẠO (CUSTOM EFFECTS)
// =========================================================

// Hiệu ứng hạt li ti phun ra từ cánh (Zoom từ 5px -> 0px)
const wingParticleEffect = new Effect(35, e => {
    Draw.color(Color.lightGray, Color.gray, e.fin());
    
    // Giảm kích thước tối đa xuống 2.2px và thu nhỏ dần về 0
    let size = 1.8 * e.fout();
    
    // Tăng tốc độ để hạt bay ra xa hơn (không dùng e.fout() ở đây để tránh bị hút ngược lại)
    let speed = 1.4; 
    let rad = e.rotation * Mathf.degRad;
    
    // Tọa độ tịnh tiến tịnh tiến liên tục đi ra xa theo thời gian e.time
    let px = e.x + Math.cos(rad) * speed * e.time;
    let py = e.y + Math.sin(rad) * speed * e.time;
    
    Fill.circle(px, py, size);
    Draw.reset();
});

const mk1TrailEffect = new Effect(22, e => {
    Draw.color(Color.white, Color.valueOf("#fff6c8"), e.fin());
    Lines.stroke(1.5 * e.fout());
    let len = 14.0 * e.fout(); 
    let rad = e.rotation * Mathf.degRad;
    Lines.line(e.x, e.y, e.x - Math.cos(rad) * len, e.y - Math.sin(rad) * len);
    Draw.reset();
});

const mk2TrailEffect = new Effect(22, e => {
    Draw.color(Color.white, Color.valueOf("#b4baff"), e.fin());
    Lines.stroke(1.5 * e.fout());
    let len = 14.0 * e.fout(); 
    let rad = e.rotation * Mathf.degRad;
    Lines.line(e.x, e.y, e.x - Math.cos(rad) * len, e.y - Math.sin(rad) * len);
    Draw.reset();
});

const mk2bTrailEffect = new Effect(22, e => {
    Draw.color(Color.white, Color.valueOf("#ff2525"), e.fin());
    Lines.stroke(1.5 * e.fout());
    let len = 14.0 * e.fout(); 
    let rad = e.rotation * Mathf.degRad;
    Lines.line(e.x, e.y, e.x - Math.cos(rad) * len, e.y - Math.sin(rad) * len);
    Draw.reset();
});

const mk3HitElectricEffect = new Effect(15, e => {
    Draw.color(Color.white, Color.sky, e.fin());
    let rand = new Rand(e.id);
    Lines.stroke(1.0 * e.fout());
    for(let i = 0; i < 3; i++){
        let angle = rand.random(360);
        let len = rand.random(5, 15);
        let tx = e.x + Angles.trnsx(angle, len);
        let ty = e.y + Angles.trnsy(angle, len);
        Lines.line(e.x, e.y, tx, ty);
    }
    Draw.reset();
});

// Hiệu ứng hạt buff di chuyển lên trên
const nucleytorBuffEffect = new Effect(40, e => {
    let size = e.rotation > 0 ? e.rotation : 16; 
    let halfSize = size / 2;
    let rand = new Rand(e.id);
    for(let i = 0; i < 3; i++){
        let rx = rand.random(-halfSize, halfSize);
        let pLife = rand.random(0.5, 1.0); 
        let progress = Math.min(e.fin() / pLife, 1.0);
        if (progress < 1.0) {
            let fout = 1.0 - progress;
            let travelDistance = rand.random(size * 0.8, size * 1.3);
            let ry = -halfSize + (progress * travelDistance);
            let startColor = Color.valueOf("39e75f");
            let endColor = Color.valueOf("00a2ff");
            let currentColor = startColor.cpy().lerp(endColor, progress);
            Draw.color(currentColor);
            let lineLength = 8.0 * fout;
            Lines.stroke(1.0 * fout); 
            Lines.line(e.x + rx, e.y + ry - lineLength / 2, e.x + rx, e.y + ry + lineLength / 2);
        }
    }
    Draw.reset();
});

function drawNucleytorWindRing(cx, cy, radiusX, radiusY, angle, strokeWidth, color){
    Draw.color(color); 
    Lines.stroke(strokeWidth);
    let steps = 16; let lastX = 0, lastY = 0;
    let cosA = Math.cos(angle * Mathf.degRad); let sinA = Math.sin(angle * Mathf.degRad);
    for(let i = 0; i <= steps; i++){
        let a = (i * (360 / steps)) * Mathf.degRad;
        let lx = Math.cos(a) * radiusX; let ly = Math.sin(a) * radiusY;
        let rx = cx + (lx * cosA - ly * sinA); let ry = cy + (lx * sinA + ly * cosA);
        if(i > 0) Lines.line(lastX, lastY, rx, ry);
        lastX = rx; lastY = ry;
    }
    Draw.reset();
}

const applyGradiusAcceleration = (b, baseSpeed) => {
    let t = b.time; 
    let slowSpeed = baseSpeed * 0.15; 
    if (t < 30) {
        b.vel.setLength(slowSpeed);
    } else {
        let fastSpeed = slowSpeed * 9.0; 
        let timePassed = t - 30;
        let progress = Math.min(timePassed / 10.0, 1.0);
        let currentSpeed = Mathf.lerp(slowSpeed, fastSpeed, progress);
        b.vel.setLength(currentSpeed);
    }
};

// Các loại đạn
const nucleytorBullet = extend(BasicBulletType, {
    speed: 8, damage: 9, lifetime: 72, width: 9, height: 14,
    frontColor: Color.white, backColor: Color.valueOf("#ffef9e"),
    workspace: true, pierce: true, pierceCap: 3, pierceBuilding: true, knockback: 1, impact: true,
    hitEffect: Fx.smoke, despawnEffect: Fx.smoke,
    update(b) {
        this.super$update(b);
        applyGradiusAcceleration(b, this.speed);
        if (Mathf.chance(0.40)) { mk1TrailEffect.at(b.x, b.y, b.rotation()); }
    },
    draw(b) {
        this.super$draw(b);
        if (b.time >= 26) { 
            let bAngle = b.rotation();
            let effectTime = b.time - 24;
            if (effectTime <= 12) {
                let progress = effectTime / 20.0;
                let fout = 1.0 - progress;
                let offset = 42.0 - (progress * 90.0); 
                let rx = b.x + Angles.trnsx(bAngle, offset);
                let ry = b.y + Angles.trnsy(bAngle, offset);
                let zoomRadiusX = 1.0 + (progress * 9.0);
                let zoomRadiusY = 2.0 + (progress * 16.0);
                let thickness = 2.0 * fout;
                drawNucleytorWindRing(rx, ry, zoomRadiusX, zoomRadiusY, bAngle, thickness, this.backColor);
            }
        }
    }
});

const nucleytorMK2Bullet = extend(BasicBulletType, {
    speed: 10, damage: 9, lifetime: 78, width: 13, height: 20, 
    frontColor: Color.valueOf("#ffeb3a"), backColor: Color.valueOf("#50dbc4"),
    maxRange: 420, circleCheck: true, workspace: true, pierce: true, pierceCap: 5, pierceBuilding: true, knockback: 1.4, impact: true,
    hitEffect: Fx.smoke, despawnEffect: Fx.smoke,
    update(b) {
        this.super$update(b);
        applyGradiusAcceleration(b, this.speed);
        if (Mathf.chance(0.40)) { mk2TrailEffect.at(b.x, b.y, b.rotation()); }
    },
    draw(b) {
        this.super$draw(b);
        if (b.time >= 26) { 
            let bAngle = b.rotation();
            let effectTime = b.time - 24;
            if (effectTime <= 12) {
                let progress = effectTime / 20.0;
                let fout = 1.0 - progress;
                let offset = 42.0 - (progress * 90.0); 
                let rx = b.x + Angles.trnsx(bAngle, offset);
                let ry = b.y + Angles.trnsy(bAngle, offset);
                let zoomRadiusX = 1.0 + (progress * 9.0);
                let zoomRadiusY = 2.0 + (progress * 16.0);
                let thickness = 2.0 * fout;
                drawNucleytorWindRing(rx, ry, zoomRadiusX, zoomRadiusY, bAngle, thickness, this.backColor);
            }
        }
    }
});

const nucleytorMK2BBullet = extend(BasicBulletType, {
    speed: 9, damage: 9, lifetime: 75, width: 5, height: 64,
    frontColor: Color.white, backColor: Color.valueOf("#831006"),
    trailChance: 2.0, trailColor: Color.valueOf("#ff2525"),
    workspace: true, pierce: false, pierceBuilding: false, knockback: 2.8, impact: true, 
    hitEffect: mk3HitElectricEffect, despawnEffect: mk3HitElectricEffect,   
    update(b) {
        this.super$update(b);
        applyGradiusAcceleration(b, this.speed);
        if (Mathf.chance(0.40)) { mk2bTrailEffect.at(b.x, b.y, b.rotation()); }
    },
    draw(b) {
        this.super$draw(b);
        if (b.time >= 26) { 
            let bAngle = b.rotation();
            let effectTime = b.time - 24;
            if (effectTime <= 12) {
                let progress = effectTime / 20.0;
                let fout = 1.0 - progress;
                let offset = 42.0 - (progress * 90.0); 
                let rx = b.x + Angles.trnsx(bAngle, offset);
                let ry = b.y + Angles.trnsy(bAngle, offset);
                let zoomRadiusX = 1.0 + (progress * 9.0);
                let zoomRadiusY = 2.0 + (progress * 16.0);
                let thickness = 2.0 * fout;
                drawNucleytorWindRing(rx, ry, zoomRadiusX, zoomRadiusY, bAngle, thickness, this.backColor);
            }
        }
    }
});

// Khởi tạo block Turret
const nucleytor = extend(ItemTurret, "nucleytor", {
    configurable: true,
    recoil: 0.0 
});

nucleytor.addBar("dmg_bonus", new Func({
    get: function(e){
        return new Bar(
            new Prov({ get: function(){ return "DMG: +" + Math.floor(e.getDmgRatio() * 1200) + "%"; } }),
            new Prov({ get: function(){ return Color.orange; } }),
            new Floatp({ get: function(){ return e.getDmgRatio(); } })
        );
    }
}));

nucleytor.addBar("as_bonus", new Func({
    get: function(e){
        return new Bar(
            new Prov({ get: function(){ return "AS: " + (Math.floor(e.getAsRatio() * 50) >= 0 ? "+" : "") + Math.floor(e.getAsRatio() * 50) + "%"; } }),
            new Prov({ get: function(){ return Color.cyan; } }),
            new Floatp({ get: function(){ return Math.max(e.getAsRatio(), 0); } })
        );
    }
}));

nucleytor.ammo(Items.silicon, nucleytorBullet);

nucleytor.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

nucleytor.buildType = () => extend(ItemTurret.ItemTurretBuild, nucleytor, {
    energyState: 0.0, 
    tierState: 0, 
    limitCheck: 0,
    customRecoil: 0.0,
    combatProgress: 0.0, 
    coreOpen: 0.0, 
    amplifierTimer: 0.0,
    isAmplified: false,
    maxAmplifierDuration: 30.0 * 60.0, 

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        if(val == 0) { this.health = 1200; }
        if(val == 1) { this.health = 1800; }
        if(val == 2) { this.health = 1600; }
        this.maxHealth = this.health;
    },

    range(){
        let tier = this.getTier();
        if(tier == 1) return 420; 
        if(tier == 2) return 360; 
        return 320;               
    },

    armor() {
        return this.super$armor() + (this.isAmplified ? 20 : 0);
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Nucleytor", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let currentTitanium = core.items.get(Items.titanium);
                    let currentSilicon = core.items.get(Items.silicon);
                    let currentPlastanium = core.items.get(Items.plastanium);

                    let titColor1 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                    let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
                    
                    let titColor2 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                    let silColor2 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
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
                b1.add("[cyan]===(MK2 - XUYÊN PHÁ)===[]").row();
                let b1D = b1.add("Cải tiến cấu trúc nòng hạt nhân gia tốc:\n" +
                                 " [white]• Sát thương cơ bản điều chỉnh thành [green]9 đơn vị[] và tầm bắn rộng [green]420 pixel[].[]\n" +
                                 " [white]• Đạn xuyên qua tối đa [yellow]5 mục tiêu[].[]\n" +
                                 " [white]• Tối ưu hóa tản nhiệt, giữ gia tốc lâu hơn khi dừng bắn.[]\n" +
                                 " [white]• Nâng cấp giáp tháp pháo, tăng [green]+50% Máu[].[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon){
                        core.items.remove(Items.titanium, reqMK2.titanium); core.items.remove(Items.silicon, reqMK2.silicon);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(1)); 
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B - TIẾN HÓA)===[]").row();
                let b2D = b2.add("Chuyển đổi sang lõi nhiệt phân rã:\n" +
                                 " [white]• Sát thương tinh chỉnh thành [green]9 đơn vị[], gia tốc nhiệt lượng cực nhanh ([green]+3% mỗi phát bắn[]).[]\n" +
                                 " [white]• Tầm bắn đạt [green]360 pixel[].[]\n" +
                                 " [white]• Loại bỏ hoàn toàn khả năng xuyên thấu và tự dẫn đường.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium){
                        core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.plastanium, reqMK2B.plastanium);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
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
            })).size(50, 40).tooltip("Nâng cấp hệ thống Nucleytor");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG NUCLEYTOR ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Nucleytor: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,200[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]320 pixel[]\n" +
                          "[lightgray]Sát thương cơ bản:[] [yellow]9.00[]\n" +
                          "[lightgray]Khả năng xuyên thấu:[] [white]3 mục tiêu[]\n" +
                          "[scarlet]⚠ Giới hạn: Tối đa 10 cấu trúc trên sân[]\n\n" +
                          "[sky]⚡ CƠ CHẾ GIA TỐC HẠT NHÂN:[]\n" +
                          "• [lightgray]Cơ chế bắn tích năng:[] Tháp pháo khởi đầu ở trạng thái yếu nhất. Mỗi phát bắn sẽ tích tụ [green]+1.5%[] gia tốc lõi hạt nhân.\n" +
                          "• [lightgray]Hiệu ứng cực đại:[] Sát thương tăng [orange]+1200%[] và tốc độ bắn tăng [cyan]+50%[].\n" +
                          "• [orange]Trạng thái Nuclear Amplifier:[] Khi tích đầy 100% năng lượng, pháo vào trạng thái [yellow]Nuclear Amplifier trong 30s[]. Nhận thêm [green]+20 Giáp[] và [cyan]+50% Tốc độ bắn[] cho các tháp pháo đồng minh lân cận bán kính 100 pixel.\n" +
                          "• [lightgray]Hiệu ứng đạn:[] Đạn bay chậm trong [yellow]0.5 giây đầu[] để tích năng lượng, sau đó bung xòe vòng từ trường phản lực rồi phóng vụt đi với hiệu ứng vệt xé gió màu vàng nhạt.";
            } 
            else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,800 [lime](+50%)[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]420 pixel [lime](+31.2%)[]\n" +
                          "[lightgray]Sát thương cơ bản:[] [yellow]9.00[]\n" +
                          "[lightgray]Khả năng xuyên thấu:[] [yellow]5 mục tiêu [lime](+2)[]\n" +
                          "[scarlet]⚠ Giới hạn: Tối đa 10 cấu trúc trên sân[]\n\n" +
                          "[lime]⚡ CƠ CHẾ GIA TỐC HẠT NHÂN (MK2):[]\n" +
                          "• [lightgray]Bắn tích năng:[] Mỗi phát bắn gia tốc thêm [green]+2.0%[] năng lượng tích lũy.\n" +
                          "• [lightgray]Hiệu ứng cực đại:[] Sát thương tăng [orange]+1200%[] và tốc độ bắn tăng [cyan]+50%[].\n" +
                          "• [orange]Trạng thái Nuclear Amplifier:[] Khi tích đầy 100% năng lượng, pháo vào trạng thái [yellow]Nuclear Amplifier trong 60s[]. Nhận thêm [green]+20 Giáp[] và [cyan]+50% Tốc độ bắn[] cho các tháp pháo đồng minh lân cận bán kính 100 pixel.\n" +
                          "• [lightgray]Bộ giữ nhiệt cải tiến:[] Khi dừng bắn, năng lượng hạ nhiệt chậm hơn giúp duy trì trạng thái quá tải lâu hơn.";
            } 
            else if (currentTier == 2) {
                title += "[purple](MK2B)[]";
                descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                          "[lightgray]Máu tháp pháo:[] [green]1,600 [lime](+33.3%)[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]360 pixel [lime](+12.5%)[]\n" +
                          "[lightgray]Sát thương cơ bản:[] [red]9.00[]\n" +
                          "[lightgray]Khả năng xuyên thấu:[] [red]Không (Mất khả năng xuyên)[]\n" +
                          "[scarlet]⚠ Giới hạn: Tối đa 10 cấu trúc trên sân[]\n\n" +
                          "[purple]🔥 CƠ CHẾ GIA TỐC HẠT NHÂN (MK2B):[]\n" +
                          "• [lightgray]Siêu kích phát nổ:[] Mỗi phát bắn gia tốc thần tốc [pink]+3.0%[] nhiệt lượng. Súng đạt đỉnh công suất cực nhanh.\n" +
                          "• [lightgray]Hiệu ứng cực đại:[] Sát thương tăng [orange]+1200%[] và tốc độ bắn tăng [cyan]+50%[].\n" +
                          "• [orange]Trạng thái Nuclear Amplifier:[] Khi tích đầy 100% năng lượng, pháo vào trạng thái [yellow]Nuclear Amplifier trong 30s[]. Nhận thêm [green]+20 Giáp[] và [cyan]+50% Tốc độ bắn[] cho các tháp pháo đồng minh lân cận bán kính 100 pixel.";
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

updateTile(){
        this.limitCheck += Time.delta;
        if(this.limitCheck >= 15){
            this.limitCheck = 0; let count = 0; let firstBuild = null;
            Groups.build.each(packCons(b => { if(b.block == nucleytor && b.team == this.team) { count++; if(firstBuild == null) firstBuild = b; } }));
            if(count > 10 && this !== firstBuild){ Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 10 pháo Nucleytor!"); this.kill(); return; }
        }

        this.super$updateTile();
        let tier = this.getTier();

        // TRẠNG THÁI CHIẾN ĐẤU
        let inCombat = this.isShooting || (this.isActive() && this.target != null);
        if (inCombat) {
            this.combatProgress = Mathf.approach(this.combatProgress, 1.0, 0.05 * Time.delta);
        } else {
            this.combatProgress = Mathf.approach(this.combatProgress, 0.0, 0.03 * Time.delta);
        }

// ====================================================================
        // HIỆU ỨNG HẠT LI TI PHUN TỪ VỊ TRÍ CHÉO 2 BÊN CÁCH TÂM PHÁO 3 PIXEL (HƯỚNG NGƯỢC LẠI)
        // ====================================================================
        if (inCombat && !this.isAmplified && Mathf.chance(0.35 * Time.delta)) {
            let rad = this.rotation * Mathf.degRad;
            let cos = Math.cos(rad);
            let sin = Math.sin(rad);

            // Tọa độ chéo sang 2 bên sườn cố định 3 pixel từ tâm
            let sideDist = 5.0; 

            let wingLeftX = this.x + (sideDist * -sin);
            let wingLeftY = this.y + (sideDist * cos);
            
            let wingRightX = this.x + (-sideDist * -sin);
            let wingRightY = this.y + (-sideDist * cos);

            // ĐẢO NGƯỢC HƯỚNG PHUN: Thay vì hướng về sau (-135 / +135), hạt sẽ phun chéo lên phía trước (+45 / -45)
            let leftAngle = this.rotation + 145 + Mathf.range(10);
            let rightAngle = this.rotation - 145 + Mathf.range(10);

            // Kích hoạt hiệu ứng hạt li ty siêu mịn bay ra xa theo hướng mới
            wingParticleEffect.at(wingLeftX, wingLeftY, leftAngle);
            wingParticleEffect.at(wingRightX, wingRightY, rightAngle);
        }

        if (this.energyState >= 1.0 && !this.isAmplified) {
            this.isAmplified = true;
            let durationSeconds = (tier == 1) ? 60.0 : 30.0;
            this.maxAmplifierDuration = durationSeconds * 60.0;
            this.amplifierTimer = this.maxAmplifierDuration;
            
            Fx.shockwave.at(this.x, this.y); 
            Effect.shake(6, 6, this.x, this.y);
        }

        if (this.isAmplified) {
            this.energyState = 1.0; 
            this.amplifierTimer -= Time.delta;

            Units.nearbyBuildings(
                this.x,
                this.y,
                100, 
                packCons(other => {
                    if (other == null || other == this) return;
                    try {
                        if (other.team == this.team && other instanceof Turret.TurretBuild) {
                            if (other.reloadCounter !== undefined && other.hasAmmo()) {
                                let speedMultiplier = 0.5; 
                                other.reloadCounter += Time.delta * Math.max(other.efficiency, 0.1) * speedMultiplier;
                            }
                            if (Math.random() < 0.08) {
                                nucleytorBuffEffect.at(other.x, other.y, other.block.size * 8);
                            }
                        }
                    } catch (err) {}
                })
            );

            if (this.amplifierTimer <= 0) {
                this.isAmplified = false;
                this.energyState = 0.0; 
                Fx.blastExplosion.at(this.x, this.y); 
                Effect.shake(1.5, 1.5, this.x, this.y);
            }
        }

        let currentCoolSpeed = coolSpeedMK1;
        if(tier == 1) currentCoolSpeed = coolSpeedMK2;
        if(tier == 2) currentCoolSpeed = coolSpeedMK2B;

        if(!this.isShooting || !this.hasAmmo() || !this.isActive()){ 
            if(this.energyState > 0.0 && !this.isAmplified){ 
                this.energyState = Math.max(this.energyState - (currentCoolSpeed * Time.delta / 60), 0.0); 
            } 
        }

        this.coreOpen = Mathf.approach(this.coreOpen, this.isAmplified ? 1.0 : 0.0, 0.08 * Time.delta);

        this.customRecoil = Mathf.approach(this.customRecoil, 0.0, 0.12 * Time.delta);
    },

    shoot(type){
        let tier = this.getTier();
        let bulletToShoot = nucleytorBullet;
        let currentGain = gainPerShotMK1;

        if(tier == 1) {
            bulletToShoot = nucleytorMK2Bullet;
            currentGain = gainPerShotMK2;
        } else if(tier == 2) {
            bulletToShoot = nucleytorMK2BBullet;
            currentGain = gainPerShotMK2B;
        }

        this.super$shoot(bulletToShoot); 
        
        if (!this.isAmplified) {
            this.energyState = Math.min(this.energyState + currentGain, 1.0); 
        }
        
        this.customRecoil = 1.0;
    },

    handleBullet(bullet, x, y, angle){ 
        if(bullet != null) bullet.damage = bullet.type.damage * (1 + this.energyState * 12); 
        this.super$handleBullet(bullet, x, y, angle); 
    },

    baseReloadSpeed(){ return this.efficiency * (1 + this.energyState * 0.5); },
    getDmgRatio(){ return this.energyState; }, 
    getAsRatio(){ return this.energyState; },

    draw(){
        let modName = this.block.name.split("-")[0]; 

        // 1. VẼ ĐẾ THÁP PHÁO (BASE LAYER)
        let baseRegion = Core.atlas.find(this.block.basePrefix + "" + this.block.size);
        if(baseRegion.found()){
            Draw.rect(baseRegion, this.x, this.y);
        } else {
            this.super$draw(); 
        }

        let rad = this.rotation * Mathf.degRad;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);

        let bodyReg = Core.atlas.find(modName + "-nucleytor-body");
        let por1Reg = Core.atlas.find(modName + "-nucleytor-por1");
        let por2Reg = Core.atlas.find(modName + "-nucleytor-por2");
        let wing1Reg = Core.atlas.find(modName + "-nucleytor-wing1");
        let wing2Reg = Core.atlas.find(modName + "-nucleytor-wing2");
        let arr1Reg = Core.atlas.find(modName + "-nucleytor-arr1");
        let arr2Reg = Core.atlas.find(modName + "-nucleytor-arr2");
        let cored1Reg = Core.atlas.find(modName + "-nucleytor-cored1");
        let cored2Reg = Core.atlas.find(modName + "-nucleytor-cored2");

        // =========================================================
        // 2. CỬA GIÓ CÁNH - WINGS LAYER (CHUYỂN ĐỘNG CHÉO 2 PIXEL)
        // =========================================================
        if(wing1Reg.found() && wing2Reg.found()){
            let wSide = this.combatProgress * 1.414;   
            let wBack = this.combatProgress * -1.414;

            let w1x = this.x + (wSide * -sin) + (wBack * cos);
            let w1y = this.y + (wSide * cos) + (wBack * sin);
            Draw.rect(wing1Reg, w1x, w1y, this.rotation - 90);

            let w2x = this.x + (-wSide * -sin) + (wBack * cos);
            let w2y = this.y + (-wSide * cos) + (wBack * sin);
            Draw.rect(wing2Reg, w2x, w2y, this.rotation - 90);
        }

        // =========================================================
        // 3. CỔNG XẢ - PORTS LAYER (Tịnh tiến sườn 1px + giật lùi recoil)
        // =========================================================
        if(por1Reg.found() && por2Reg.found()){
            let pSide = this.combatProgress * 1.0; 
            let pBack = this.customRecoil * -8.0; 

            let p1x = this.x + (pSide * -sin) + (pBack * cos);
            let p1y = this.y + (pSide * cos) + (pBack * sin);
            Draw.rect(por1Reg, p1x, p1y, this.rotation - 90);

            let p2x = this.x + (-pSide * -sin) + (pBack * cos);
            let p2y = this.y + (-pSide * cos) + (pBack * sin);
            Draw.rect(por2Reg, p2x, p2y, this.rotation - 90);
        }

        // =========================================================
        // 4. THÂN THÁP PHÁO CHÍNH - BODY LAYER (Tĩnh)
        // =========================================================
        if(bodyReg.found()){
            Draw.rect(bodyReg, this.x, this.y, this.rotation - 90);
        }

        // =========================================================
        // 5. MŨI TÊN GIA TỐC - ARROWS LAYER (Tiến lên 2px và GIỮ YÊN khi CHIẾN ĐẤU)
        // =========================================================
        if(arr1Reg.found() && arr2Reg.found()){
            let aForward = this.combatProgress * 2.0; 

            let a1x = this.x + (aForward * cos);
            let a1y = this.y + (aForward * sin);
            Draw.rect(arr1Reg, a1x, a1y, this.rotation - 90);

            let a2x = this.x + (aForward * cos);
            let a2y = this.y + (aForward * sin);
            Draw.rect(arr2Reg, a2x, a2y, this.rotation - 90);
        }

        // =========================================================
        // 6. CỬA CHE LÒ & CƠ CHẾ LÕI HẠT NHÂN (CORE & DOORS LAYER)
        // =========================================================
        
        // A. QUẢ CẦU NĂNG LƯỢNG LỤC GIÁC (CHỈ HIỆN KHI CÓ BUFF)
        if(this.coreOpen > 0.01){
            Draw.blend(Blending.additive); 
            
            let coreColor = Color.valueOf("#39e75f"); 
            if(this.getTier() == 1) coreColor = Color.sky; 
            if(this.getTier() == 2) coreColor = Color.valueOf("#ff2525"); 

            let coreOffsetY = -5.0; 
            let coreX = this.x + (coreOffsetY * cos);
            let coreY = this.y + (coreOffsetY * sin);

            let baseSize = 7.0; 
            let pulse = Mathf.absin(Time.time, 5.0, 0.8); 
            let hexRadius = (baseSize + pulse) * this.coreOpen;

            let hexRotation = Time.time * 0.8; 

            Draw.color(coreColor);
            Lines.stroke(1.5 * this.coreOpen);
            
            Lines.poly(coreX, coreY, 6, hexRadius, hexRotation);
            Fill.poly(coreX, coreY, 6, hexRadius * 0.5, -hexRotation);

            Draw.blend();
            Draw.reset();
        }

        // B. HAI CỬA CHE LÒ (Tịnh tiến ra ngoài đúng 3.0 pixel)
        if(cored1Reg.found() && cored2Reg.found()){
            let cSide = this.coreOpen * 3.0; 

            let c1x = this.x + (cSide * -sin);
            let c1y = this.y + (cSide * cos);
            Draw.rect(cored1Reg, c1x, c1y, this.rotation - 90);

            let c2x = this.x + (-cSide * -sin);
            let c2y = this.y + (-cSide * cos);
            Draw.rect(cored2Reg, c2x, c2y, this.rotation - 90);
        }

        // =========================================================
        // 7. VÒNG TỪ TRƯỜNG TẦM XA (NUCLEAR AMPLIFIER FIELD LAYER)
        // =========================================================
        if (this.isAmplified) {
            let maxRadius = 100.0;
            let radius = maxRadius;
            let elapsed = this.maxAmplifierDuration - this.amplifierTimer;
            let animDuration = 45.0; 

            if (elapsed < animDuration) {
                let progress = elapsed / animDuration;
                radius = maxRadius * Mathf.pow(progress, 0.5); 
            } else if (this.amplifierTimer < animDuration) {
                let progress = this.amplifierTimer / animDuration;
                radius = maxRadius * Mathf.pow(progress, 0.5); 
            }

            if (radius > 0.1) {
                let greenColor = Color.valueOf("39e75f"); 
                let yellowBorder = Color.valueOf("ffeb82"); 
                let strokeWidth = 1.2 + Mathf.absin(Time.time, 8, 0.5);

                let segments = 60; 
                let step = 360 / segments;
                
                Draw.color(yellowBorder);
                Lines.stroke(strokeWidth + 1.2);
                for(let i = 0; i < segments; i += 2) {
                    let angle1 = i * step * Mathf.degRad;
                    let angle2 = (i + 1) * step * Mathf.degRad;
                    Lines.line(
                        this.x + Math.cos(angle1) * radius, 
                        this.y + Math.sin(angle1) * radius, 
                        this.x + Math.cos(angle2) * radius, 
                        this.y + Math.sin(angle2) * radius
                    );
                }

                Draw.color(greenColor);
                Lines.stroke(strokeWidth);
                for(let i = 0; i < segments; i += 2) {
                    let angle1 = i * step * Mathf.degRad;
                    let angle2 = (i + 1) * step * Mathf.degRad;
                    Lines.line(
                        this.x + Math.cos(angle1) * radius, 
                        this.y + Math.sin(angle1) * radius, 
                        this.x + Math.cos(angle2) * radius, 
                        this.y + Math.sin(angle2) * radius
                    );
                }
                Draw.reset();
            }
        }
    }
});