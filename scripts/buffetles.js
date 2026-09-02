const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// Yêu cầu tài nguyên nâng cấp từ kho lõi
const reqMK2 = { thorium: 400, silicon: 300 };
const reqMK2B = { surgeAlloy: 150, silicon: 500, phaseFabric: 100 };

const critEffect = new Effect(20, e => {
    Draw.color(Color.gold, Color.scarlet, e.fin());
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, 4 + e.fin() * 12);

    for (let i = 0; i < 4; i++) {
        let angle = i * 90 + 45;
        let len = 3 + e.fin() * 10;
        Drawf.tri(
            e.x + Mathf.cosDeg(angle) * (len * 0.2), 
            e.y + Mathf.sinDeg(angle) * (len * 0.2), 
            3 * e.fout(), 
            len, 
            angle
        );
    }
});

const speedBuffEffect = new Effect(30, e => {
    Draw.color(Color.gold, Color.orange, e.fin());
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, 6 + e.fin() * 14);
});

const resetUpgradeEffect = new Effect(30, e => {
    Draw.color(Color.gold, Color.white, e.fin());
    Lines.stroke(3 * e.fout());
    Lines.circle(e.x, e.y, 8 + e.fin() * 20);
});

let buffetlesBlock = null;

Events.on(ContentInitEvent, () => {
    buffetlesBlock = Vars.content.blocks().find(b => b != null && b.name != null && b.name.endsWith("buffetles"));
    if (buffetlesBlock == null) return;

    buffetlesBlock.configurable = true;

    try {
        buffetlesBlock.addBar("crit_rate", new Func({
            get: function(e){
                return new Bar(
                    new Prov({ get: function(){ return "CRIT CHANCE: " + (e.getCritRate != null ? (e.getCritRate() * 100).toFixed(1) : "0") + "%"; } }),
                    new Prov({ get: function(){ return Color.scarlet; } }),
                    new Floatp({ get: function(){ return e.getCritRate != null ? e.getCritRate() : 0; } })
                );
            }
        }));

        buffetlesBlock.addBar("crit_damage", new Func({
            get: function(e){
                return new Bar(
                    new Prov({ get: function(){ return "CRIT DMG: +" + (e.getCritDamageMultiplier != null ? (e.getCritDamageMultiplier() * 100).toFixed(1) : "0") + "%"; } }),
                    new Prov({ get: function(){ return Color.gold; } }),
                    new Floatp({ get: function(){ return e.getCritDamageMultiplier != null ? Math.min(e.getCritDamageMultiplier() / 3.0, 1.0) : 0; } })
                );
            }
        }));
    } catch(err) {}

    buffetlesBlock.config(java.lang.Integer, packCons2((tile, value) => {
        if (tile != null && tile.setTier !== undefined) {
            tile.setTier(value);
        }
    }));

    buffetlesBlock.buildType = () => extend(ItemTurret.ItemTurretBuild, buffetlesBlock, {
        critStacks: 0,
        extraCritDamage: 0.0,
        tierState: 0, 
        speedBuffTimer: 0,
        trackedBullets: null,

        created(){
            this.super$created();
            this.trackedBullets = new Seq();
        },

        getTier(){ return this.tierState == null ? 0 : this.tierState; },

        setTier(val){
            this.tierState = val;
            Fx.upgradeCore.at(this.x, this.y);
        },

        getCritRate(){
            let ratePerStack = (this.getTier() == 1) ? 0.005 : 0.001;
            return 0.05 + (this.critStacks * ratePerStack);
        },

        getCritDamageMultiplier(){
            return 0.50 + this.extraCritDamage;
        },

        addStack(){
            this.critStacks++;
            if(this.getCritRate() >= 1.0){
                this.critStacks = 0;
                this.extraCritDamage += 0.15;
                resetUpgradeEffect.at(this.x, this.y);
            }
        },

        handleBullet(bullet, x, y, angle){
            this.super$handleBullet(bullet, x, y, angle);

            if(bullet != null){
                if(this.getTier() == 2){
                    bullet.damage *= 1.5;
                }

                let critRate = this.getCritRate();
                if(Mathf.chance(critRate)){
                    bullet.damage *= (1.0 + this.getCritDamageMultiplier());
                    critEffect.at(bullet.x, bullet.y);
                }

                this.addStack();

                if(this.getTier() == 1 && Mathf.chance(0.20)){
                    this.extraCritDamage += 0.01;
                }

                if(this.trackedBullets != null){
                    this.trackedBullets.add(bullet);
                }
            }
        },

        updateTile(){
            this.super$updateTile();

            if(this.speedBuffTimer > 0){
                this.speedBuffTimer -= Time.delta;
            }

            if(this.speedBuffTimer > 0 && this.isShooting && this.hasAmmo()){
                this.reloadCounter += Time.delta * 5.0 * this.efficiency;
            }

            if(this.trackedBullets != null && this.trackedBullets.size > 0){
                for(let i = this.trackedBullets.size - 1; i >= 0; i--){
                    let b = this.trackedBullets.get(i);
                    
                    let isRemoved = (b == null);
                    if(!isRemoved){
                        try {
                            if(b.added !== undefined) isRemoved = !b.added();
                            else if(b.isAdded !== undefined) isRemoved = !b.isAdded();
                        } catch(e) {
                            isRemoved = true;
                        }
                    }

                    if(isRemoved){
                        if(b != null && b.type != null && b.time < b.type.lifetime - 1){
                            if(Mathf.chance(0.20)){
                                this.speedBuffTimer = 60;
                                speedBuffEffect.at(this.x, this.y);
                            }
                        }
                        this.trackedBullets.remove(i);
                    }
                }
            }
        },

        draw(){
            this.super$draw();
            if(this.speedBuffTimer > 0){
                Draw.color(Color.gold, Color.orange, Mathf.absin(Time.time, 4, 1));
                Lines.stroke(1.5);
                Lines.circle(this.x, this.y, 10);
                Draw.reset();
            }
        },

        buildConfiguration(table){
            if (table == null) return;
            table.clear(); table.row();
            let tier = this.getTier();

            if(tier == 0) {
                table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                    if (Vars.ui == null) return;
                    let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Buffetles", {});
                    
                    if (dialog.cont != null) {
                        let reqCell = dialog.cont.add(new Table());
                        reqCell.get().add(new Label(packProv(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                            let currentThorium = core.items.get(Items.thorium);
                            let currentSilicon = core.items.get(Items.silicon);
                            let currentSurge = core.items.get(Items.surgeAlloy);
                            let currentPhase = core.items.get(Items.phaseFabric);

                            let thoColor1 = currentThorium >= reqMK2.thorium ? "[green]" : "[red]";
                            let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
                            
                            let surColor2 = currentSurge >= reqMK2B.surgeAlloy ? "[green]" : "[red]";
                            let silColor2 = currentSilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                            let phaColor2 = currentPhase >= reqMK2B.phaseFabric ? "[green]" : "[red]";

                            return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                                   "[cyan]Nhánh MK2:[]\n" +
                                   " • Thorium: " + thoColor1 + currentThorium + "[] / " + reqMK2.thorium + "\n" +
                                   " • Silicon: " + silColor1 + currentSilicon + "[] / " + reqMK2.silicon + "\n" +
                                   "[purple]Nhánh MK2B:[]\n" +
                                   " • Kim loại Surge: " + surColor2 + currentSurge + "[] / " + reqMK2B.surgeAlloy + "\n" +
                                   " • Silicon: " + silColor2 + currentSilicon + "[] / " + reqMK2B.silicon + "\n" +
                                   " • Vải Phase: " + phaColor2 + currentPhase + "[] / " + reqMK2B.phaseFabric;
                        }))).growX();

                        dialog.cont.row(); dialog.cont.add().height(10).row();

                        let branchesTable = new Table();

                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                        b1.add("[cyan]===(MK2 - BẠO KÍCH SIÊU TỐC)===[]").row();
                        let b1D = b1.add("[white]• Tăng tỉ lệ bạo kích/stack: [green]+0.5%[] (gốc 0.1%)\n\n" +
                                         "[lightgray]Kỹ năng đặc biệt: Tăng tốc tích lũy tỉ lệ bạo kích gấp 5 lần. Khi bắn đạn có 20% tỉ lệ tăng vĩnh viễn +1% sát thương bạo kích. Đạn trúng đích có 20% tỉ lệ tăng 500% tốc bắn trong 1s.[]");
                        b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                        b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if(core != null && core.items.get(Items.thorium) >= reqMK2.thorium && core.items.get(Items.silicon) >= reqMK2.silicon){
                                core.items.remove(Items.thorium, reqMK2.thorium); core.items.remove(Items.silicon, reqMK2.silicon);
                                Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                                this.configure(java.lang.Integer(1)); 
                                dialog.hide(); this.deselect();
                            } else { if(Vars.ui != null) Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                        })).size(180, 38);

                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                        b2.add("[purple]===(MK2B - BỘI PHÁT SÁT THƯƠNG)===[]").row();
                        let b2D = b2.add("[white]• Sát thương gốc của đạn: [green]+50.0%[]\n\n" +
                                         "[lightgray]Kỹ năng đặc biệt: Duy trì cơ chế bạo kích cực đại và đạn bắn trúng kẻ địch có 20% cơ hội tăng 500% tốc bắn trong 1s.[]");
                        b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                        b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if(core != null && core.items.get(Items.surgeAlloy) >= reqMK2B.surgeAlloy && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.phaseFabric) >= reqMK2B.phaseFabric){
                                core.items.remove(Items.surgeAlloy, reqMK2B.surgeAlloy); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.phaseFabric, reqMK2B.phaseFabric);
                                Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(4, 4, this.x, this.y);
                                this.configure(java.lang.Integer(2)); 
                                dialog.hide(); this.deselect();
                            } else { if(Vars.ui != null) Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                        })).size(180, 38);

                        branchesTable.add(b1).width(340); branchesTable.row();
                        branchesTable.add().height(12).row();
                        branchesTable.add(b2).width(340);

                        let scroll = new ScrollPane(branchesTable);
                        scroll.setScrollingDisabled(true, false);
                        dialog.cont.add(scroll).maxHeight(400);
                        dialog.addCloseButton(); dialog.show();
                    }
                })).size(50, 40).tooltip("Nâng cấp hệ thống Buffetles");
            } else {
                table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                    if (Vars.ui != null) Vars.ui.showInfo("[scarlet]HỆ THỐNG BUFFETLES ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
                })).size(50, 40).tooltip("Đã đạt cấp tối đa");
            }

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = " Thông số pháo Buffetles: ";
                let descStr = "";
                let currentTier = this.getTier();

                if (currentTier == 0) {
                    title += "[yellow](MK1)[]";
                    descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                              "[lightgray]Tỉ lệ bạo kích khởi điểm:[] [orange]5.0%[]\n" +
                              "[lightgray]Mức tích lũy:[] [white]+0.1% / stack[]\n" +
                              "[lightgray]Sát thương bạo kích:[] [yellow]+" + (this.getCritDamageMultiplier() * 100).toFixed(1) + "%[]\n\n" +
                              "[sky]⚡ CƠ CHẾ DỒN ĐẠP (STACKS):[]\n" +
                              "• Mỗi lần bắn sẽ tăng stack bạo kích.\n" +
                              "• Khi đạn trúng đích: 20% cơ hội tăng +500% tốc bắn trong 1 giây.\n" +
                              "• Khi tỉ lệ bạo kích đạt 100%, reset stack và cộng thêm 15% sát thương bạo kích vĩnh viễn.";
                } 
                else if (currentTier == 1) {
                    title += "[cyan](MK2)[]";
                    descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n" +
                              "[lightgray]Mức tích lũy bạo kích:[] [lime]+0.5% / stack (x5 tốc độ)[]\n" +
                              "[lightgray]Sát thương bạo kích hiện tại:[] [yellow]+" + (this.getCritDamageMultiplier() * 100).toFixed(1) + "%[]\n\n" +
                              "[lime]⚡ CƠ CHẾ ĐẶC BIỆT MK2:[]\n" +
                              "• Khi bắn có [yellow]20% tỉ lệ[] tăng thêm [green]+1% sát thương bạo kích[] vĩnh viễn.\n" +
                              "• Đạn trúng đích có [gold]20% cơ hội[] kích hoạt [orange]+500% tốc bắn[] trong 1 giây.";
                } 
                else if (currentTier == 2) {
                    title += "[purple](MK2B)[]";
                    descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n" +
                              "[lightgray]Sát thương gốc đạn:[] [lime]+50.0% DMG[]\n\n" +
                              "[purple]🔥 CƠ CHẾ ĐẶC BIỆT MK2B:[]\n" +
                              "• Đạn trúng đích có [gold]20% tỉ lệ[] tăng [orange]+500% tốc bắn[] trong 1 giây.";
                }

                if (Vars.ui == null) return;
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

        write(write){ 
            this.super$write(write); 
            write.i(this.critStacks);
            write.f(this.extraCritDamage);
            write.i(this.getTier());
        },
        read(read, revision){ 
            this.super$read(read, revision); 
            this.critStacks = read.i();
            this.extraCritDamage = read.f();
            this.tierState = read.i();
            if(this.trackedBullets == null) this.trackedBullets = new Seq();
        }
    });
});

// Xuất Module rỗng để chống lỗi null require trong main.js
module.exports = {};