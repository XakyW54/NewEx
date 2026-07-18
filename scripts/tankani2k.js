const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// Yêu cầu tài nguyên nâng cấp cấu hình tháp pháo
const reqMK2 = { copper: 4000, lead: 4000, titanium: 0 };
const reqMK2B = { copper: 4000, lead: 4000, titanium: 2000 };

// Cấu hình cơ chế thăng tiến sát thương (Stack) giống Aekon
const hitsPerStack = 10; // 10 phát trúng = 1 tầng
const maxStack = 8;      // Tối đa 8 tầng (+80% sát thương)

// ==================== ĐỊNH NGHĨA HIỆU ỨNG VỤ NỔ CRUMBLE ====================
const crumbleExplosionEffect = new Effect(40, cons(e => {
    let previousZ = Draw.z();
    Draw.z(Layer.effect);

    // Lớp 1: Sóng xung kích bung mạnh từ trong ra ngoài (Vòng tròn đặc mờ dần)
    Draw.color(Pal.redDust, Pal.redderDust, e.fin());
    Lines.stroke(e.fout() * 6.0);
    Lines.circle(e.x, e.y, Interp.pow3Out.apply(e.fin()) * 45.0);


    // LỚP 3 ĐÃ SỬA ĐỔI: Hiệu ứng biến mất từ trong ra (Hollow Out / Expand Fade)
    let flashColor = Color.white.cpy().lerp(Pal.redDust, e.fin());
    flashColor.a = e.fout();
    Draw.color(flashColor);
    Lines.stroke(e.fout() * 8.0); // Nét vẽ dày lúc đầu và mỏng dần về sau
    Lines.circle(e.x, e.y, Interp.pow2Out.apply(e.fin()) * 35.0);


    Draw.z(previousZ);
    Draw.reset();
}));

// ==================== ĐỊNH NGHĨA ĐẠN HỆ THỐNG ====================

// Đạn gốc của Tankani-2k (MK1)
const tankaniNormalBullet = extend(BasicBulletType, {
    speed: 15, damage: 1115, width: 10, height: 33, lifetime: 60,
    frontColor: Color.valueOf("#e0ea87"), backColor: Color.valueOf("#e5ff00"),
    trailColor: Color.valueOf("#daea80"),
    
    // Khi trúng mục tiêu: Tích điểm tầng cho tháp pháo
    hitEntity(b, entity, health) {
        let owner = b.owner;
        if (owner != null && owner.addHitPoint !== undefined) {
            owner.addHitPoint();
        }
        this.super$hitEntity(b, entity, health);
    }
});

// Đạn MK2: Sát thương phạm vi 50px
const tankaniMK2Bullet = extend(BasicBulletType, {
    speed: 15, damage: 1115, width: 10, height: 33, lifetime: 60,
    frontColor: Color.valueOf("#e0ea87"), backColor: Color.valueOf("#00ff4c"),
    trailColor: Color.valueOf("#daea80"),
    splashDamageRadius: 50,
    splashDamage: 558,
    hitEffect: crumbleExplosionEffect,    
    despawnEffect: crumbleExplosionEffect,

    hitEntity(b, entity, health) {
        let owner = b.owner;
        if (owner != null && owner.addHitPoint !== undefined) {
            owner.addHitPoint();
        }
        this.super$hitEntity(b, entity, health);
    }
});

// Đạn MK2B: Bắn không quân chuyên dụng
const tankaniMK2BBullet = extend(BasicBulletType, {
    speed: 20, damage: 1, width: 10, height: 33, lifetime: 60,
    frontColor: Color.valueOf("#ff8a80"), backColor: Color.valueOf("#ff1744"),
    trailColor: Color.valueOf("#ff5252"),
    splashDamageRadius: 150,
    splashDamage: 892,
    collidesGround: false,   
    collidesAir: true,
    hitEffect: crumbleExplosionEffect,    
    despawnEffect: crumbleExplosionEffect,

    hitEntity(b, entity, health) {
        let owner = b.owner;
        if (owner != null && owner.addHitPoint !== undefined) {
            owner.addHitPoint();
        }
        this.super$hitEntity(b, entity, health);
    }
});

// ==================== KHỞI TẠO BLOCK THÁP PHÁO ====================

Events.on(ClientLoadEvent, cons(e => {
    // Lấy block tháp pháo Tankani-2k từ hệ thống
    const turretBlock = Vars.content.getByName(ContentType.block, "newex-tankani2k");

    if (turretBlock != null) {
        turretBlock.configurable = true;
        turretBlock.inaccuracy = 0; // Độ lệch tâm bằng 0 tuyệt đối

        turretBlock.config(java.lang.Integer, packCons2((tile, value) => {
            if (tile != null && tile.setTier !== undefined) {
                tile.setTier(value);
            }
        }));

        // Áp dụng chuẩn cú pháp gọn gàng của Vendicum sử dụng hàm lấy tỷ lệ từ thực thể tháp pháo
        turretBlock.addBar("damageStack", new Func({
            get: function(e){
                return new Bar(
                    new Prov({ 
                        get: function(){ 
                            let hits = e.hitPoints === undefined ? 0 : e.hitPoints;
                            return "DMG: +" + Math.floor(e.getStackRatio() * 80) + "%"; 
                        } 
                    }),
                    new Prov({ 
                        get: function(){ 
                            return Color.orange; 
                        } 
                    }),
                    new Floatp({ 
                        get: function(){ 
                            return e.getStackRatio(); 
                        } 
                    }),
                );
            }
        }));

        turretBlock.buildType = () => extend(ItemTurret.ItemTurretBuild, turretBlock, {
            tierState: 0, 
            limitCheck: 0, 
            
            // Các thuộc tính tích lũy sát thương được lưu nội bộ
            hitPoints: 0,
            damageStack: 0,

            // Hàm hỗ trợ lấy tỷ lệ tầng phục vụ riêng cho thanh Bar hiển thị phía trên
            getStackRatio() {
                if (this.damageStack === undefined) return 0.0;
                return this.damageStack / 8.0; // Trả về số thực từ 0.0 đến 1.0
            },
            getTier() { return this.tierState == null ? 0 : this.tierState; },
            
            setTier(val) { 
                this.tierState = val;
                if (val == 0) this.health = 565;
                if (val == 1) this.health = 735; 
                if (val == 2) this.health = 950;
                this.maxHealth = this.health;
            },

            // Hàm xử lý tăng điểm Hits và thăng Tầng sát thương
            addHitPoint() {
                if (this.damageStack >= maxStack) return;

                this.hitPoints++;
                let newStack = Math.floor(this.hitPoints / hitsPerStack);
                
                if (newStack > this.damageStack) {
                    this.damageStack = Math.min(newStack, maxStack);
                    Fx.upgradeCore.at(this.x, this.y); // Hiệu ứng nâng cấp khi tăng tầng thành công
                }
            },

            // Tăng sát thương dựa theo cấp Stack thực tế (Cộng thêm tối đa 80%)
            getModifiedDamage(baseDmg) {
                let multiplier = 1.0 + (this.damageStack * 0.1);
                return Math.round(baseDmg * multiplier);
            },

            // Gấp đôi tầm bắn cho cấp MK2B
            range() {
                let tier = this.getTier();
                if (tier == 2) {
                    return this.super$range() * 2;
                }
                return this.super$range();
            },

            // Loại bỏ mục tiêu mặt đất cho cấp MK2B
            findTarget() {
                this.super$findTarget();
                let tier = this.getTier();
                if (tier == 2 && this.target != null) {
                    if (this.target.isFlying === undefined || !this.target.isFlying()) {
                        this.target = null;
                    }
                }
            },

            // Giao diện UI nâng cấp pháo
            buildConfiguration(table) {
                table.clear(); table.row();
                let tier = this.getTier();

                if (tier == 0) {
                    table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                        let dialog = extend(BaseDialog, "Trung tâm nâng cấp Tankani-2k", {});
                        
                        let reqCell = dialog.cont.label(packProv(() => {
                            let core = this.team.core();
                            if (core == null) return "[red]Không tìm thấy Lõi Đội![]";
                            let currentcopper = core.items.get(Items.copper);
                            let currentlead = core.items.get(Items.lead);
                            let currenttitanium = core.items.get(Items.titanium);
                            
                            let copColor1 = currentcopper >= reqMK2.copper ? "[green]" : "[red]";
                            let leaColor1 = currentlead >= reqMK2.lead ? "[green]" : "[red]";
                            
                            let copColor2 = currentcopper >= reqMK2B.copper ? "[green]" : "[red]";
                            let leaColor2 = currentlead >= reqMK2B.lead ? "[green]" : "[red]";
                            let titColor2 = currenttitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                            
                            return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                                   "[cyan]Nhánh Cấu Hình MK2:[]\n" +
                                   " • Đồng: " + copColor1 + currentcopper + "[] / " + reqMK2.copper + "\n" +
                                   " • Chì: " + leaColor1 + currentlead + "[] / " + reqMK2.lead + "\n" +
                                   "[purple]Nhánh Biến Thể Chuyên Không MK2B:[]\n" +
                                   " • Đồng: " + copColor2 + currentcopper + "[] / " + reqMK2B.copper + "\n" +
                                   " • Chì: " + leaColor2 + currentlead + "[] / " + reqMK2B.lead + "\n" +
                                   " • Titan: " + titColor2 + currenttitanium + "[] / " + reqMK2B.titanium;
                        }));
                        
                        reqCell.width(360).get().setWrap(true);
                        reqCell.get().setAlignment(Align.left);
                        dialog.cont.row(); dialog.cont.add().height(10).row();

                        let branchesTable = new Table();

                        // NHÁNH TIẾN HÓA: MK2
                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                        b1.add("[cyan]===(MK2)===[]").row();
                        let b1D = b1.add("Tích hợp công nghệ nổ mảnh diện rộng:\n" +
                                         " [white]• Tăng lượng máu chống chịu lên [green]735 HP[].[]\n" +
                                         " [white]• Giữ nguyên cơ chế bắn đa mục tiêu (Đất & Không) và tầm bắn gốc.[]\n" +
                                         " [white]• Đạn chạm mục tiêu kích nổ lan phạm vi [orange]50 pixel[].[]\n" +
                                         " [white]• Mục tiêu chính nhận [red]1115 sát thương gốc[] trực diện.[]\n" +
                                         " [white]• Kẻ địch lân cận chịu [yellow]558 sát thương nổ lan[] (50%).[]");
                        b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                        b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                            let core = this.team.core();
                            if (core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead) {
                                core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead);
                                Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                                this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                            } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                        })).size(180, 38);

                        // NHÁNH TIẾN HÓA: MK2B
                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                        b2.add("[purple]===(MK2B)===[]").row();
                        let b2D = b2.add("Chuyển đổi sang tổ hợp pháo phòng không hạng nặng:\n" +
                                         " [white]• Gia tăng lượng máu tối đa lên cực đại [green]950 HP[].[]\n" +
                                         " [white]• Mở rộng [ultra-light]gấp đôi tầm bắn hiệu dụng [green](x2 Range)[][].[]\n" +
                                         " [white]• [red]Loại bỏ hoàn toàn khả năng bắn mục tiêu mặt đất[].[]\n" +
                                         " [white]• Tăng tốc độ đạn bay lên [sky]20.0[] chuyên dụng diệt Không Quân.[]\n" +
                                         " [white]• Đạn nổ áp suất tạo vùng sát thương lan rộng tới [pink]150 pixel[].[]\n" +
                                         " [white]• Gây [orange]892 sát thương diện rộng[] (80% lực bắn gốc).[]");
                        b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                        b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                            let core = this.team.core();
                            if (core != null && core.items.get(Items.copper) >= reqMK2B.copper && core.items.get(Items.lead) >= reqMK2B.lead && core.items.get(Items.titanium) >= reqMK2B.titanium) {
                                core.items.remove(Items.copper, reqMK2B.copper); core.items.remove(Items.lead, reqMK2B.lead); core.items.remove(Items.titanium, reqMK2B.titanium);
                                Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
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
                    })).size(50, 40).tooltip("Nâng cấp cấu trúc hỏa lực tháp pháo");
                } else {
                    table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                        Vars.ui.showInfo("[scarlet]HỆ THỐNG TANKANI ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA![]");
                    })).size(50, 40).tooltip("Đã đạt cấp tối đa");
                }

                // NÚT THÔNG TIN CẤU HÌNH TIẾN ĐỘ THÁP PHÁO
                table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                    let title = " Thông số Tankani-2k: ";
                    let descStr = "";
                    let currentTier = this.getTier();

                    let statStackStr = "\n[scarlet]⚡ CƠ CHẾ TIẾN HÓA (HITS) ⚡[]\n" +
                                       "[lightgray]Số phát bắn trúng:[] [yellow]" + this.hitPoints + " Hits[]\n" +
                                       "[lightgray]Cấp độ tầng lực:[] [orange]Tầng " + this.damageStack + " / 8[]\n" +
                                       "[lightgray]Sát thương cộng thêm:[] [green]+" + (this.damageStack * 10) + "%[] (Tối đa +80%)\n";

                    if (currentTier == 0) {
                        title += "[yellow](MK1)[]";
                        descStr = "[gold]⚡ THÔNG SỐ GỐC CHƯA NÂNG CẤP (MK1) ⚡[]\n" +
                                  "[lightgray]Máu tháp pháo:[] [green]565 HP[]\n" +
                                  "[lightgray]Trạng thái mục tiêu:[] Đất & Không\n" +
                                  "[lightgray]Sát thương mục tiêu đơn:[] [red]" + this.getModifiedDamage(1115) + " Sát thương[] (Gốc: 1115)\n" +
                                  statStackStr +
                                  "[scarlet]⚠ Giới hạn đặt: Tối đa 1 cấu trúc/đội[]";
                    } else if (currentTier == 1) {
                        title += "[cyan](MK2)[]";
                        descStr = "[cyan]⚡ CẤU HÌNH ĐẠN DIỆN RỘNG (MK2) ⚡[]\n" +
                                  "[lightgray]Máu tháp pháo:[] [green]735 HP[]\n" +
                                  "[lightgray]Vùng nổ lan (Splash):[] [orange]50 Pixel[]\n" +
                                  "[lightgray]Sát thương trực diện:[] [red]" + this.getModifiedDamage(1115) + " Sát thương[] (Gốc: 1115)\n" +
                                  "[lightgray]Sát thương nổ lan:[] [yellow]" + this.getModifiedDamage(558) + " Sát thương[] (Gốc: 558)\n" +
                                  statStackStr +
                                  "[scarlet]⚠ Giới hạn đặt: Tối đa 1 cấu trúc/đội[]";
                    } else if (currentTier == 2) {
                        title += "[purple](MK2B)[]";
                        descStr = "[purple]⚡ CẤU HÌNH PHÒNG KHÔNG HẠNG NẶNG (MK2B) ⚡[]\n" +
                                  "[lightgray]Máu tháp pháo:[] [green]950 HP[]\n" +
                                  "[lightgray]Tầm bắn:[] [green]Gấp đôi tầm bắn gốc (x2 Range)[]\n" +
                                  "[lightgray]Trạng thái mục tiêu:[] [red]Chỉ bắn KHÔNG QUÂN[]\n" +
                                  "[lightgray]Vùng nổ lan áp suất:[] [pink]150 Pixel[]\n" +
                                  "[lightgray]Sát thương nổ phòng không:[] [orange]" + this.getModifiedDamage(892) + " Sát thương[] (Gốc: 892)\n" +
                                  statStackStr +
                                  "[scarlet]⚠ Giới hạn đặt: Tối đa 1 cấu trúc/đội[]";
                    }

                    let dialog = extend(BaseDialog, title, {});
                    let infoTable = new Table();
                    let cell = infoTable.add(descStr).width(360);
                    cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                    let scroll = new ScrollPane(infoTable);
                    scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400);
                    dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip("Xem chi tiết thông số hệ thống");
            },

            config() { return java.lang.Integer(this.getTier()); },

            // Khớp thuộc tính đạn và thay đổi trực tiếp thông số đạn gốc trước khi bắn
            shoot(type) {
                let tier = this.getTier();
                if (tier == 1) {
                    tankaniMK2Bullet.damage = this.getModifiedDamage(1115);
                    tankaniMK2Bullet.splashDamage = this.getModifiedDamage(558);
                    this.super$shoot(tankaniMK2Bullet);
                } else if (tier == 2) {
                    tankaniMK2BBullet.damage = this.getModifiedDamage(1);
                    tankaniMK2BBullet.splashDamage = this.getModifiedDamage(892);
                    this.super$shoot(tankaniMK2BBullet);
                } else {
                    tankaniNormalBullet.damage = this.getModifiedDamage(1115);
                    this.super$shoot(tankaniNormalBullet);
                }
            },

            // Kiểm tra giới hạn đặt 1 block duy nhất
            updateTile() {
                this.limitCheck += Time.delta;
                if (this.limitCheck >= 15) { 
                    this.limitCheck = 0; 
                    let count = 0; 
                    let firstBuild = null;
                    
                    Groups.build.each(b => {
                        if (b.block == turretBlock && b.team == this.team) { 
                            count++; 
                            if (firstBuild == null) firstBuild = b; 
                        }
                    });
                    
                    if (count > 1 && this !== firstBuild) {
                        Call.sendMessage("[red]Giới hạn: Chỉ được đặt tối đa 1 tháp pháo Tankani-2k! Cấu trúc thừa đã tự hủy![]"); 
                        this.kill(); 
                        return;
                    }
                }

                this.super$updateTile();
            },

            // Ghi trạng thái lưu game
            write(write) {
                this.super$write(write); 
                write.b(this.getTier()); 
                write.i(this.hitPoints);     
                write.b(this.damageStack);   
            },
            
            // Đọc trạng thái khi tải game
            read(read, revision) {
                this.super$read(read, revision); 
                this.setTier(read.b()); 
                this.hitPoints = read.i();   
                this.damageStack = read.b(); 
                this.limitCheck = 0;
            }
        });
    }
}));