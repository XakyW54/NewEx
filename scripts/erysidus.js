const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });

const reqMK2 = { copper: 2500, lead: 2000, silicon: 1500 };
const reqMK2B = { copper: 3500, lead: 3000, silicon: 2500, titanium: 1500 };

const customHitEffect = new Effect(20, new Cons({
    get: function(e){
        Draw.color(Color.valueOf("90caf9"), Color.white, e.fout());
        Lines.stroke(e.fout() * 2.0);
        Lines.circle(e.x, e.y, e.fin() * 12.0);
    }
}));

 
const critEffect = new Effect(25, new Cons({
    get: function(e){
        Draw.color(Color.gold, Color.orange, e.fout());
        Lines.stroke(e.fout() * 3.0);
        Lines.circle(e.x, e.y, e.fin() * 18.0);
    }
}));

 
function applyCritDamage(bullet, target, baseDamage, ownerBuild){
    if(target == null || ownerBuild == null) return baseDamage;

    let stacks = ownerBuild.killStacks || 0;
    
    let critChance = 0.05 + (stacks * 0.01);
    let critMultiplier = (stacks >= 50) ? 2.0 : 1.5;

    let finalDamage = baseDamage;

    if(Mathf.chance(critChance)){
        finalDamage *= critMultiplier;
        critEffect.at(target.x, target.y);
    }

    return finalDamage;
}

 
const ironManBeam = extend(LaserBulletType, {
    damage: 45,
    length: 280,
    width: 28,
    lifetime: 4,
    colors: [Color.valueOf("90caf9"), Color.valueOf("e3f2fd"), Color.white],
    sideAngle: 45,
    sideWidth: 1.8,
    sideLength: 22,
    hitEffect: customHitEffect,
    despawnEffect: Fx.none,
    drawSize: 300,
    pierce: true,

    hitEntity(b, other, initialHealth){
        if(other != null && b != null && b.owner != null){
            let ownerBuild = b.owner;
            let currentHp = other.health;
            
            let dmgBuff = 1.0 + ((ownerBuild.killStacks || 0) * 0.01);
            let calculatedDmg = this.damage * dmgBuff;

            if(other.isFlying !== undefined && other.isFlying()){
                calculatedDmg *= 2.0;
            }

            let finalDmg = applyCritDamage(b, other, calculatedDmg, ownerBuild);
            other.damage(finalDmg);

            if(currentHp <= finalDmg || other.dead || !other.isAdded()){
                if(ownerBuild.addKillStack !== undefined){
                    ownerBuild.addKillStack();
                }
            }
        }
    }
});

 
const closeRangeBullet = extend(BasicBulletType, {
    absorbable: true,
    lifetime: 40,
    speed: 7,
    damage: 78,
    height: 20,
    width: 8,
    hitEffect: customHitEffect,
    despawnEffect: customHitEffect,
    pierce: true,

   
    draw(b){
        Draw.color(Color.valueOf("90caf9"));
        Lines.stroke(3.5);
        Lines.lineAngle(b.x, b.y, b.rotation(), 14);
        
        Draw.color(Color.valueOf("e3f2fd"));
        Lines.stroke(1.5);
        Lines.lineAngle(b.x, b.y, b.rotation(), 10);
        
        Draw.reset();
    },

    hitEntity(b, other, initialHealth){
        if(other != null && b != null && b.owner != null){
            let ownerBuild = b.owner;
            let dmgBuff = 1.0 + ((ownerBuild.killStacks || 0) * 0.01);
            let finalDmg = applyCritDamage(b, other, this.damage * dmgBuff, ownerBuild);
            other.damage(finalDmg);
        }
    }
});

function spawnErysidusDrone(team, x, y, rotation, tier){
    let droneType = Vars.content.getByName(ContentType.unit, "newex-erysidus-drone") || Vars.content.getByName(ContentType.unit, "erysidus-drone");

    if(droneType != null){
        let drone = droneType.create(team);
        if(drone != null){
            drone.set(x, y);
            drone.rotation = rotation;
            
            if(drone.setTier !== undefined){
                drone.setTier(tier);
            }
            
            if(tier === 1){
                drone.maxHealth = 1650;
                drone.health = 1650;
            } else if(tier === 2){
                drone.maxHealth = 2100;
                drone.health = 2100;
            } else {
                drone.maxHealth = 1250;
                drone.health = 1250;
            }
            
            drone.add();
            Fx.spawn.at(x, y);
        }
    }
}

Events.on(ClientLoadEvent, new Cons({
    get: function(e){
        Events.on(BlockDestroyEvent, new Cons({
            get: function(event){
                if(event.tile != null && event.tile.build != null){
                    let build = event.tile.build;
                    if(build.block != null && build.block.name.endsWith("erysidus")){
                        let tier = build.getTier ? build.getTier() : 0;
                        spawnErysidusDrone(build.team, build.x, build.y, build.rotation, tier);
                    }
                }
            }
        }));

        const erysidusBlock = Vars.content.getByName(ContentType.block, "newex-erysidus");

        if(erysidusBlock != null){
            erysidusBlock.configurable = true;

            erysidusBlock.config(java.lang.Integer, packCons2((tile, value) => {
                if(tile != null && tile.setTier !== undefined){
                    tile.setTier(value);
                }
            }));

            erysidusBlock.buildType = () => extend(ItemTurret.ItemTurretBuild, erysidusBlock, {
                tierState: 0,
                subGunTimer: 0,
                beamChargeTimer: 0,
                beamDurationTimer: 0,
                killStacks: 0,

                getTier(){
                    return this.tierState == null ? 0 : Number(this.tierState);
                },

                setTier(val){
                    let numTier = Number(val);
                    this.tierState = numTier;
                    if(numTier === 0) this.health = 1250;
                    if(numTier === 1) this.health = 1650;
                    if(numTier === 2) this.health = 2100;
                    this.maxHealth = this.health;
                },

                addKillStack(){
                    if(this.killStacks < 50){
                        this.killStacks++;
                        Fx.heal.at(this.x, this.y);
                    }
                },

drawPlace(x, y, rotation, valid){
        this.super$drawPlace(x, y, rotation, valid);

        let realX = x * Vars.tilesize + this.offset;
        let realY = y * Vars.tilesize + this.offset;

              dashCircle(realX, realY, 100, Pal.remove);

             dashCircle(realX, realY, getDynamicRange(0), Pal.place);

     },

                updateTile(){
                    this.super$updateTile();

                    let tier = this.getTier();

                    let beamTarget = Units.bestTarget(this.team, this.x, this.y, 280, e => e.checkTarget(true, true), e => e.health, (a, b) => b - a);
                    let hasTargetInBeamRange = (beamTarget != null) || (this.target != null && this.dst(this.target) <= 280);

                    if(this.hasAmmo()){
                        if(this.beamDurationTimer <= 0){
                            if(this.beamChargeTimer < 300){
                                this.beamChargeTimer += Time.delta;
                            }
                            
                            if(this.beamChargeTimer >= 300 && hasTargetInBeamRange){
                                this.beamChargeTimer = 0;
                                this.beamDurationTimer = 42;
                            }
                        }
                    } else {
                        if(this.beamDurationTimer <= 0){
                            this.beamChargeTimer = Math.max(0, this.beamChargeTimer - Time.delta);
                        }
                    }

                    if(this.beamDurationTimer > 0 && this.hasAmmo()){
                        this.beamDurationTimer -= Time.delta;

                        let targetAngle = this.rotation;
                        if(beamTarget != null){
                            targetAngle = this.angleTo(beamTarget);
                        } else if(this.target != null){
                            targetAngle = this.angleTo(this.target);
                        }

                        this.rotation = Mathf.slerpDelta(this.rotation, targetAngle, 0.2);

                        if(Mathf.mod(this.beamDurationTimer, 3) < Time.delta){
                            let beamDmg = (tier === 2) ? 68 : 45;
                            let beam = ironManBeam.create(this, this.team, this.x, this.y, targetAngle, 1, 1);
                            if(beam != null) beam.damage = beamDmg;
                            
                            Effect.shake(1.5, 1.5, this.x, this.y);
                        }
                    }

                    if(this.beamDurationTimer <= 0 && this.hasAmmo() && this.isShooting && this.target != null){
                        let dst = this.dst(this.target);
                        
                        if(dst <= 270){
                            this.subGunTimer += Time.delta;

                            let delay = (tier === 1) ? 6 : 12;

                            if(this.subGunTimer >= delay){
                                this.subGunTimer = 0;

                                let angleOffset = Mathf.range(4);
                                let tr = new Vec2();
                                tr.trns(this.rotation, 12);

                                let bulletDmg = (tier === 2) ? 117 : 78;

                                let bullet = closeRangeBullet.create(
                                    this,
                                    this.team,
                                    this.x + tr.x,
                                    this.y + tr.y,
                                    this.rotation + angleOffset,
                                    1,
                                    1
                                );
                                
                                if(bullet != null){
                                    bullet.damage = bulletDmg;
                                }

                                customHitEffect.at(this.x + tr.x, this.y + tr.y);
                            }
                        } else {
                            this.subGunTimer = 0;
                        }
                    } else if(this.beamDurationTimer > 0) {
                        this.subGunTimer = 0;
                    }
                },

                drawSelect(){
                    this.super$drawSelect();
                    
                    Draw.color(Color.valueOf("90caf9"));
                    Lines.stroke(1.0);
                    Lines.dashCircle(this.x, this.y, 280);
                    Draw.reset();
                },

                shoot(type){
                    let tier = this.getTier();

                    this.super$shoot(type);

                    if(tier === 1){
                        this.reloadCounter += erysidusBlock.reload * (1.3 / 2.3);
                    }
                },

                buildConfiguration(table){
                    table.clear(); table.row();
                    let tier = this.getTier();

                    if(tier === 0){
                        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                            let dialog = extend(BaseDialog, "Trung tâm nâng cấp Erysidus", {});
                            
                            let reqCell = dialog.cont.label(() => {
                                let core = this.team.core();
                                if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                                let currentcopper = core.items.get(Items.copper);
                                let currentlead = core.items.get(Items.lead);
                                let currentsilicon = core.items.get(Items.silicon);
                                let currenttitanium = core.items.get(Items.titanium);
                                
                                let copColor1 = currentcopper >= reqMK2.copper ? "[green]" : "[red]";
                                let leaColor1 = currentlead >= reqMK2.lead ? "[green]" : "[red]";
                                let silColor1 = currentsilicon >= reqMK2.silicon ? "[green]" : "[red]";

                                let copColor2 = currentcopper >= reqMK2B.copper ? "[green]" : "[red]";
                                let leaColor2 = currentlead >= reqMK2B.lead ? "[green]" : "[red]";
                                let silColor2 = currentsilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                                let titColor2 = currenttitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                                
                                return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                                       "[cyan]Nhánh Cấu Hình MK2 (Tốc độ):[]\n" +
                                       " • Đồng: " + copColor1 + currentcopper + "[] / " + reqMK2.copper + "\n" +
                                       " • Chì: " + leaColor1 + currentlead + "[] / " + reqMK2.lead + "\n" +
                                       " • Silicon: " + silColor1 + currentsilicon + "[] / " + reqMK2.silicon + "\n" +
                                       "[purple]Nhánh Cấu Hình MK2B (Sát Thương):[]\n" +
                                       " • Đồng: " + copColor2 + currentcopper + "[] / " + reqMK2B.copper + "\n" +
                                       " • Chì: " + leaColor2 + currentlead + "[] / " + reqMK2B.lead + "\n" +
                                       " • Silicon: " + silColor2 + currentsilicon + "[] / " + reqMK2B.silicon + "\n" +
                                       " • Titan: " + titColor2 + currenttitanium + "[] / " + reqMK2B.titanium;
                            });
                            
                            reqCell.width(360).get().setWrap(true);
                            reqCell.get().setAlignment(Align.left);
                            dialog.cont.row(); dialog.cont.add().height(10).row();

                            let branchesTable = new Table();

                            let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                            b1.add("[cyan]===(MK2 - SIÊU TỐC HỎA LỰC)===[]").row();
                            let b1D = b1.add("Tối ưu hóa hệ thống nạp đạn và xả hỏa lực:\n" +
                                             " [white]• Tăng lượng máu tối đa lên [green]1650 HP[].[]\n" +
                                             " [white]• Tăng [cyan]130% tốc độ pháo tên lửa[].[]\n" +
                                             " [white]• Đạn cận chiến bắn siêu tốc ([yellow]0.1s/viên[]).[]");
                            b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                            b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                                let core = this.team.core();
                                if(core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead && core.items.get(Items.silicon) >= reqMK2.silicon){
                                    core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead); core.items.remove(Items.silicon, reqMK2.silicon);
                                    Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                                    
                                    this.setTier(1);
                                    this.configure(java.lang.Integer.valueOf(1));
                                    dialog.hide(); this.deselect();
                                } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                            })).size(180, 38);

                            let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                            b2.add("[purple]===(MK2B - CƯỜNG HÓA SÁT THƯƠNG)===[]").row();
                            let b2D = b2.add("Đột phá công nghệ cường hóa năng lượng:\n" +
                                             " [white]• Gia tăng lượng máu lên tối đa [green]2100 HP[].[]\n" +
                                             " [white]• Tăng [red]50% sát thương[] cho tất cả đạn phụ và Chưởng Repulsor.[]");
                            b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                            b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                                let core = this.team.core();
                                if(core != null && core.items.get(Items.copper) >= reqMK2B.copper && core.items.get(Items.lead) >= reqMK2B.lead && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.titanium) >= reqMK2B.titanium){
                                    core.items.remove(Items.copper, reqMK2B.copper); core.items.remove(Items.lead, reqMK2B.lead); core.items.remove(Items.silicon, reqMK2B.silicon); core.items.remove(Items.titanium, reqMK2B.titanium);
                                    Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                                    
                                    this.setTier(2);
                                    this.configure(java.lang.Integer.valueOf(2));
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
                        })).size(50, 40).tooltip("Nâng cấp cấu trúc hỏa lực Erysidus");
                    } else {
                        table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                            Vars.ui.showInfo("[scarlet]HỆ THỐNG ERYSIDUS ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA![]");
                        })).size(50, 40).tooltip("Đã đạt cấp tối đa");
                    }

                    table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                        let title = " Thông số Erysidus: ";
                        let descStr = "";
                        let currentTier = this.getTier();

                        let stacks = this.killStacks || 0;
                        let critChance = 5 + stacks;
                        let critDmg = (stacks >= 50) ? 100 : 50;
                        let maxStatus = (stacks >= 50) ? " [gold](TỐI ĐA!)[]" : "";

                        let buffStatus = "\n\n[gold]⭐ THÔNG SỐ BUFF KẾT LIỄU ⭐[]\n" +
                                         "[lightgray]Tầng Buff tiêu diệt:[] [cyan]" + stacks + "/50 Stack[]" + maxStatus + "\n" +
                                         "[lightgray]Tỉ lệ Bạo kích (Crit Rate):[] [yellow]" + critChance + "%[] (Gốc 5% + " + stacks + "%)\n" +
                                         "[lightgray]Sát thương Bạo kích (Crit DMG):[] [orange]+" + critDmg + "%[]" + (stacks >= 50 ? " [gold](+50% Max Stack)[]" : "");

                        if(currentTier === 0){
                            title += "[yellow](MK1)[]";
                            descStr = "[gold]⚡ THÔNG SỐ GỐC (MK1) ⚡[]\n" +
                                      "[lightgray]Máu:[] [green]1250 HP[]\n" +
                                      "[lightgray]Đạn cận chiến:[] Bắn mỗi 0.2s\n" +
                                      "[lightgray]Tia Repulsor:[] Phát mỗi 5s khi có mục tiêu" + buffStatus;
                        } else if(currentTier === 1){
                            title += "[cyan](MK2)[]";
                            descStr = "[cyan]⚡ CẤU HÌNH TỐC ĐỘ (MK2) ⚡[]\n" +
                                      "[lightgray]Máu:[] [green]1650 HP[]\n" +
                                      "[lightgray]Tốc độ xả đạn:[] [green]+130% Tốc độ bắn[]\n" +
                                      "[lightgray]Đạn cận chiến:[] Bắn mỗi 0.1s" + buffStatus;
                        } else if(currentTier === 2){
                            title += "[purple](MK2B)[]";
                            descStr = "[purple]⚡ CẤU HÌNH SÁT THƯƠNG (MK2B) ⚡[]\n" +
                                      "[lightgray]Máu:[] [green]2100 HP[]\n" +
                                      "[lightgray]Chưởng Repulsor:[] [orange]+50% Sát thương gốc[]" + buffStatus;
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

                config(){ return java.lang.Integer.valueOf(this.getTier()); },

                draw(){
                    this.super$draw();
                },

                write(write){
                    this.super$write(write);
                    write.b(this.getTier());
                    write.f(this.beamChargeTimer);
                    write.f(this.beamDurationTimer);
                    write.i(this.killStacks);
                },

                read(read, revision){
                    this.super$read(read, revision);
                    this.setTier(read.b());
                    this.beamChargeTimer = read.f();
                    this.beamDurationTimer = read.f();
                    this.killStacks = read.i();
                }
            });
        }
    }
}));