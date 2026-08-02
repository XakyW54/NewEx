/* PLASANOD TURRET SYSTEM - CONTINUOUS TURRET MECHANIC (PURE POWER + PLAYER CONTROLLABLE + ADVANCED LASER DRAW) */

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqPlasanodMK2 = { silicon: 3000, plastanium: 1500, surgeAlloy: 500 };
const reqPlasanodMK2B = { silicon: 4000, thorium: 2000, phaseFabric: 800 };

// 1. Tạo loại đạn Continuous Laser mặc định cho pháo
const plasanodLaser = extend(ContinuousLaserBulletType, {
    length: 280,
    damage: 35, // Sát thương liên tục (DPS)
    width: 6,
    lifetime: 10,
    drawSize: 300,
    incendChance: 0,
    colors: [Color.valueOf("84e184"), Color.white]
});

// 2. Kế thừa từ ContinuousTurret
let plasanod = extend(ContinuousTurret, "plasanod", {
    squareSprite: false,
    basePrefix: "reinforced-",
    
    load(){
        this.super$load();
        this.customBaseRegion = Core.atlas.find(this.basePrefix + "block-" + this.size);
    }
});

// Cấu hình thông số ContinuousTurret
plasanod.health = 4200;
plasanod.size = 3;
plasanod.range = 280;
plasanod.targetAir = true;
plasanod.targetGround = true;
plasanod.configurable = true;

// Gán đạn tia laser liên tục
plasanod.shootType = plasanodLaser;

// Bật tính năng điều khiển & Năng lượng thuần
plasanod.playerControllable = true; // Cho phép người chơi điều khiển
plasanod.unitSort = UnitSorts.strongest;
plasanod.hasPower = true;
plasanod.consumePower(15.0);        // 15.0 Power/s

plasanod.category = Category.turret;

plasanod.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) tile.setTier(value);
}));

// BuildType cho ContinuousTurret
plasanod.buildType = () => extend(ContinuousTurret.ContinuousTurretBuild, plasanod, {
    tierState: 0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        this.health = (val == 2) ? 6500 : 4200; 
        this.maxHealth = this.health;
    },

    range(){
        let tier = this.getTier();
        return (tier == 1) ? 450 : ((tier == 2) ? 220 : 280);
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let inv = core.items;
                    
                    let sil = inv.get(Items.silicon), plas = inv.get(Items.plastanium), surg = inv.get(Items.surgeAlloy);
                    let tho = inv.get(Items.thorium), pha = inv.get(Items.phaseFabric);
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                           "[cyan]Nhánh Cấu Hình MK2[]\n" +
                           " • Silicon: " + (sil >= reqPlasanodMK2.silicon ? "[green]" : "[red]") + sil + "[] / " + reqPlasanodMK2.silicon + "\n" +
                           " • Plastanium: " + (plas >= reqPlasanodMK2.plastanium ? "[green]" : "[red]") + plas + "[] / " + reqPlasanodMK2.plastanium + "\n" +
                           " • Surge Alloy: " + (surg >= reqPlasanodMK2.surgeAlloy ? "[green]" : "[red]") + surg + "[] / " + reqPlasanodMK2.surgeAlloy + "\n" +
                           "[purple]Nhánh Biến Thể MK2B[]\n" +
                           " • Silicon: " + (sil >= reqPlasanodMK2B.silicon ? "[green]" : "[red]") + sil + "[] / " + reqPlasanodMK2B.silicon + "\n" +
                           " • Thorium: " + (tho >= reqPlasanodMK2B.thorium ? "[green]" : "[red]") + tho + "[] / " + reqPlasanodMK2B.thorium + "\n" +
                           " • Phase Fabric: " + (pha >= reqPlasanodMK2B.phaseFabric ? "[green]" : "[red]") + pha + "[] / " + reqPlasanodMK2B.phaseFabric;
                }));
                
                reqCell.width(360).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2)===[]").row();
                let b1D = b1.add("[white]• Tầm bắn: [green]+60%[] (450 px)\n" +
                                 "• sát thương gốc: [green]+114%[] (75 DPS)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Tia Laser Siêu Dẫn — Chiếu chùm tia liên tục gây hiệu ứng Giật Điện (Shocked) kèm 15% tỷ lệ phóng sét lan sang các mục tiêu lân cận.[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.silicon) >= reqPlasanodMK2.silicon && core.items.get(Items.plastanium) >= reqPlasanodMK2.plastanium && core.items.get(Items.surgeAlloy) >= reqPlasanodMK2.surgeAlloy){
                        core.items.remove(Items.silicon, reqPlasanodMK2.silicon); core.items.remove(Items.plastanium, reqPlasanodMK2.plastanium); core.items.remove(Items.surgeAlloy, reqPlasanodMK2.surgeAlloy);
                        Fx.upgradeCore.at(this.x, this.y); Fx.impactReactorExplosion.at(this.x, this.y); Effect.shake(8, 8, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B)===[]").row();
                let b2D = b2.add("[white]• Máu cấu trúc: [green]+55%[] (6,500 HP)\n" +
                                 "• Tầm bắn: [red]-21%[] (220 px)\n" +
                                 "• sát thương gốc: [green]+357%[] (160 DPS)\n\n" +
                                 "[lightgray]Kỹ năng đặc biệt: Xoáy Trọng Lực Cận Chiến — Tập trung năng lượng hủy diệt tầm gần, thiêu rụi mục tiêu với hiệu ứng Nóng Chảy, Điện Hóa và phát sét ma quỷ diện rộng.[]");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.silicon) >= reqPlasanodMK2B.silicon && core.items.get(Items.thorium) >= reqPlasanodMK2B.thorium && core.items.get(Items.phaseFabric) >= reqPlasanodMK2B.phaseFabric){
                        core.items.remove(Items.silicon, reqPlasanodMK2B.silicon); core.items.remove(Items.thorium, reqPlasanodMK2B.thorium); core.items.remove(Items.phaseFabric, reqPlasanodMK2B.phaseFabric);
                        Fx.bigShockwave.at(this.x, this.y); Fx.reactorExplosion.at(this.x, this.y); Effect.shake(10, 10, this.x, this.y);
                        this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
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
            let currentTier = this.getTier();
            let title = " Thông số pháo \"Plasanod\": ";
            let descStr = "";

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                          "[lightgray]Máu cấu trúc:[] [green]4,200 HP[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]280 pixel[]\n" +
                          "[lightgray]sát thương gốc:[] [white]35 DPS[]\n" +
                          "[lightgray]Mức tiêu thụ điện:[] [yellow]15.0 EU/s[]\n\n" +
                          "[cyan]⚡ CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                          "• Tia Laser Năng Lượng Liên Tục: Quét chùm tia thiêu rụi mục tiêu theo thời gian thực.\n" +
                          "• Hỗ trợ điều khiển trực tiếp bởi người chơi.";
            } else if (currentTier == 1) {
                title += "[cyan]THÔNG SỐ NÂNG CẤP MK2[]";
                descStr = "[cyan]⚡ THÔNG SỐ NÂNG CẤP MK2 ⚡[]\n" +
                          "[lightgray]Máu cấu trúc:[] [green]4,200 HP[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [orange]450 pixel (+60%)[]\n" +
                          "[lightgray]sát thương gốc:[] [white]75 DPS (+114%)[]\n\n" +
                          "[cyan]⚡ CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                          "• Laser Siêu Dẫn Tầm Xa: Bổ sung hiệu ứng Giật Điện (Shocked) liên tục lên đối phương.\n" +
                          "• Phóng Sét Phụ: 15% tỷ lệ tạo ra các tia sét lan sang kẻ địch xung quanh.";
            } else if (currentTier == 2) {
                title += "[purple]THÔNG SỐ NÂNG CẤP MK2B[]";
                descStr = "[purple]⚡ THÔNG SỐ NÂNG CẤP MK2B ⚡[]\n" +
                          "[lightgray]Máu cấu trúc:[] [green]6,500 HP (+55%)[]\n" +
                          "[lightgray]Tầm bắn hiệu dụng:[] [red]220 pixel (-21%)[]\n" +
                          "[lightgray]sát thương gốc:[] [white]160 DPS (+357%)[]\n\n" +
                          "[purple]🔥 CƠ CHẾ KỸ NĂNG ĐẶC BIỆT:[]\n" +
                          "• Xoáy Trọng Lực Cận Chiến: Áp dụng đồng thời 2 trạng thái Nóng Chảy (Melting) & Điện Hóa (Electrified).\n" +
                          "• Sét Ma Quỷ: Liên tục phát ra các luồng sét gây sát thương diện rộng bộc phá.";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true);
            
            // Đã sửa thứ tự ở đây
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Trung tâm nâng cấp pháo");
    },

    config() { return java.lang.Integer(this.getTier()); },

    // --- CẬP NHẬT HIỆU ỨNG TRẠNG THÁI & SÁT THƯƠNG ĐẶC BIỆT ---
    updateTile(){
        this.super$updateTile();
        let tier = this.getTier();

        // 1. Xác định vị trí mục tiêu thực tế mà laser nhắm tới
        let bx = this.x, by = this.y;
        let tx = bx, ty = by;

        let realBullet = null;
        if(this.bullets != null && this.bullets.size > 0){
            let entry = this.bullets.first();
            if(entry != null && entry.bullet != null && entry.bullet.isAdded()){
                realBullet = entry.bullet;
            }
        }

        if(realBullet != null){
            tx = realBullet.aimX;
            ty = realBullet.aimY;
        } else if(this.target != null && !this.isControlled()){
            tx = this.target.x;
            ty = this.target.y;
        } else {
            let len = this.range();
            tx = bx + Angles.trnsx(this.rotation, len);
            ty = by + Angles.trnsy(this.rotation, len);
        }

        // 2. Chỉ gây sát thương/hiệu ứng khi đang hoạt động và đang bắn
        if(this.efficiency > 0 && this.isShooting){
            let currentDamage = (tier == 2) ? 160 : ((tier == 1) ? 75 : 35);

            // Tìm kẻ địch/công trình nằm ĐÚNG tại vị trí chiếu laser
            let hitTarget = Units.closestTarget(this.team, tx, ty, 20, u => true, b => true);

            if(hitTarget != null){
                // Gây sát thương DPS chuẩn
                hitTarget.damage(currentDamage * Time.delta / 60.0);
                
                // An toàn: Chỉ áp dụng Status Effect nếu đối tượng là Unit (có hàm apply)
                if(hitTarget.apply !== undefined){
                    if(tier == 1) {
                        hitTarget.apply(StatusEffects.shocked, 60);
                    } else if(tier == 2) {
                        hitTarget.apply(StatusEffects.melting, 60);
                        hitTarget.apply(StatusEffects.electrified, 60);
                    }
                }

                // Tạo tia sét phụ
                if(Mathf.chanceDelta(0.15)){
                    Lightning.create(this.team, Color.valueOf(tier == 2 ? "bf40bf" : "00ffcc"), 25, hitTarget.x, hitTarget.y, Mathf.random(360), 6);
                }
            }
        }
    },

    // --- HÀM DRAW VẼ CHÙM TIA BỔ SUNG (ĐÃ SỬA INTERP CHUẨN) ---
    draw(){
        if(plasanod.customBaseRegion != null && plasanod.customBaseRegion.found()){
            Draw.rect(plasanod.customBaseRegion, this.x, this.y);
        } else {
            Draw.rect(plasanod.baseRegion, this.x, this.y);
        }

        if(plasanod.region != null && plasanod.region.found()){
            Draw.rect(plasanod.region, this.x, this.y, this.rotation - 90);
        }

        if(this.efficiency > 0 && this.isShooting){
            let tier = this.getTier();
            let tmpColor = (tier == 2) ? Color.valueOf("bf40bf") : ((tier == 1) ? Color.valueOf("00ffcc") : Color.valueOf("84e184"));
            
            let bx = this.x, by = this.y;
            let tx = bx, ty = by;

            let realBullet = null;
            if(this.bullets != null && this.bullets.size > 0){
                let entry = this.bullets.first();
                if(entry != null && entry.bullet != null && entry.bullet.isAdded()){
                    realBullet = entry.bullet;
                }
            }

            if(realBullet != null){
                tx = realBullet.aimX;
                ty = realBullet.aimY;
            } else if(this.target != null && !this.isControlled()){
                tx = this.target.x;
                ty = this.target.y;
            } else {
                let len = this.range();
                tx = bx + Angles.trnsx(this.rotation, len);
                ty = by + Angles.trnsy(this.rotation, len);
            }
            
            let oscMag = 0.15, oscScl = 3.0;
            let darkenPartWarmup = this.efficiency;
            let stroke = (1.0 - oscMag + Mathf.absin(Time.time, oscScl, oscMag)) * (darkenPartWarmup + 1.0) * 4.0;

            Draw.draw(Layer.effect, packRun(() => {
                // 1. Thân Laser chính & Lõi laser
                Draw.color(tmpColor);
                Lines.stroke(stroke);
                Lines.line(bx, by, tx, ty);

                Draw.color(Color.white);
                Lines.stroke(stroke * 0.64 * (2.0 + darkenPartWarmup) / 3.0);
                Lines.line(bx, by, tx, ty);

                // 2. Hiệu ứng ánh sáng
                Drawf.light(tx, ty, bx, by, stroke, tmpColor, 0.76);
                Drawf.light(bx, by, stroke * 4.0, tmpColor, 0.76);
                Drawf.light(tx, ty, stroke * 3.0, tmpColor, 0.76);

                // 3. Hạt hiệu ứng tỏa ra xung quanh
                let particles = 64;
                let particleLife = 60.0;
                let particleLen = 6.0;
                let rand = new Rand(this.id);

                let base = Time.time / particleLife;
                for (let i = 0; i < particles; i++) {
                    let fin = (rand.random(1.0) + base) % 1.0;
                    let fout = 1.0 - fin;
                    let fslope = (fin < 0.5) ? fin * 2.0 : (1.0 - fin) * 2.0;
                    let len = rand.random(particleLen * 0.7, particleLen * 1.3) * Mathf.curve(fin, 0.2, 0.9) * (darkenPartWarmup / 2.5 + 1.0);
                    let centerDeg = rand.random(Mathf.pi);

                    // SỬA CHUẨN: Dùng Math.pow cho pow3In (fin^3)
                    let pow3InVal = fin * fin * fin;
                    // SỬA CHUẨN: Dùng tính toán toán học cho pow2Out (1 - (1-fin)^2)
                    let pow2OutVal = 1.0 - (1.0 - fin) * (1.0 - fin);

                    Tmp.v1.trns(this.rotation, pow3InVal * rand.random(30, 60) - rand.range(8) - 6, (((rand.random(18, 28) * (fout + 1.0) / 2.0 + 2.0) / (3.0 * fin / 7.0 + 1.3) - 1.0) + rand.range(3)) * Math.cos(centerDeg));
                    let angle = Mathf.slerp(Tmp.v1.angle() - 180, this.rotation, pow2OutVal);
                    Tmp.v1.scl(darkenPartWarmup / 3.7 + 1.0);
                    Tmp.v1.add(bx, by);

                    Draw.color(Tmp.c2.set(tmpColor), Color.white, fin * 0.7);
                    Lines.stroke(Mathf.curve(fslope, 0, 0.42) * 1.2 * Mathf.curve(fin, 0, 0.6));
                    Lines.lineAngleCenter(Tmp.v1.x, Tmp.v1.y, angle, len);
                }

                // 4. Lớp Laser cực sáng (Trắng)
                if (darkenPartWarmup > 0.005) {
                    Draw.color(Color.white);
                    Lines.stroke(stroke * 0.55 * darkenPartWarmup);
                    Lines.line(bx, by, tx, ty);
                }

                Draw.reset();
            }));
        }
    },

    write(write){ this.super$write(write); write.b(this.getTier()); },
    read(read, revision){ this.super$read(read, revision); this.setTier(read.b()); }
});
