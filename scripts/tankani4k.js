const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

 
const reqMK2 = { copper: 6000, lead: 6000, titanium: 0 }; 
const reqMK2B = { copper: 6000, lead: 6000, titanium: 3000 }; 

 
const hitsPerStack = 10; 
const maxStackNormal = 8; 
const maxStackMK2B = 18; 

 

const crumbleExplosionEffect = new Effect(40, new Cons({
    get: function(e) {
        let previousZ = Draw.z(); 
        Draw.z(Layer.effect); 

        Draw.color(Pal.redDust, Pal.redderDust, e.fin()); 
        Lines.stroke(e.fout() * 6.0); 
        Lines.circle(e.x, e.y, Interp.pow3Out.apply(e.fin()) * 45.0); 

        let flashColor = Color.white.cpy().lerp(Pal.redDust, e.fin()); 
        flashColor.a = e.fout(); 
        Draw.color(flashColor); 
        Lines.stroke(flashColor); 
        Lines.circle(e.x, e.y, Interp.pow2Out.apply(e.fin()) * 35.0); 

        Draw.z(previousZ); 
        Draw.reset(); 
    }
}));

const circleOutEffect = new Effect(30, new Cons({
    get: function(e) {
        Draw.color(Pal.accent, Color.white, e.fin());
        Lines.stroke(e.fout() * 3.0);
        Lines.circle(e.x, e.y, Interp.circleOut.apply(e.fin()) * 40.0);
    }
}));

const hitSparkLargeEffect = new Effect(40, new Cons({
    get: function(e) {
        Draw.color(e.color, Color.white, e.fout() * 0.3);
        Lines.stroke(e.fout() * 1.6);

        Mathf.rand.setSeed(e.id);
        let count = 18;
        for (let i = 0; i < count; i++) {
            let len = e.finpow() * 27.0 * Mathf.rand.random(0.2, 1.0);
            let ang = Mathf.rand.random(360.0);
            let x = e.x + Angles.trnsx(ang, len);
            let y = e.y + Angles.trnsy(ang, len);
            
            Lines.lineAngle(x, y, ang, e.fout() * Mathf.rand.random(4, 8) + 2.0);
        }
    }
}));

const tankaniDespawnEffect = new MultiEffect(
    crumbleExplosionEffect,
    circleOutEffect,
    hitSparkLargeEffect
);

 

const tankaniNormalBullet = extend(BasicBulletType, { 
    speed: 15, damage: 1673, width: 10, height: 33, lifetime: 60, 
    frontColor: Color.valueOf("#e0ea87"), backColor: Color.valueOf("#e5ff00"), 
    trailColor: Color.valueOf("#daea80"), 
    hitEffect: tankaniDespawnEffect,
    despawnEffect: tankaniDespawnEffect,
    
    hitEntity(b, entity, health) { 
        let owner = b.owner; 
        if (owner != null && owner.addHitPoint !== undefined) { 
            owner.addHitPoint(); 
        }
        this.super$hitEntity(b, entity, health); 
    }
});

const tankaniMK2Bullet = extend(BasicBulletType, { 
    speed: 15, damage: 1673, width: 10, height: 33, lifetime: 60, 
    frontColor: Color.valueOf("#e0ea87"), backColor: Color.valueOf("#00ff4c"), 
    trailColor: Color.valueOf("#daea80"), 
    splashDamageRadius: 50, 
    splashDamage: 837, 
    hitEffect: tankaniDespawnEffect,    
    despawnEffect: tankaniDespawnEffect,

    hitEntity(b, entity, health) { 
        let owner = b.owner; 
        if (owner != null && owner.addHitPoint !== undefined) { 
            owner.addHitPoint(); 
        }
        this.super$hitEntity(b, entity, health); 
    }
});

const tankaniMK2BBullet = extend(BasicBulletType, { 
    speed: 20, damage: 0.8, width: 10, height: 33, lifetime: 60, 
    frontColor: Color.valueOf("#ff8a80"), backColor: Color.valueOf("#ff1744"), 
    trailColor: Color.valueOf("#ff5252"), 
    splashDamageRadius: 150, 
    splashDamage: 1070, 
    collidesGround: true,  
    collidesAir: true, 
    hitEffect: tankaniDespawnEffect,    
    despawnEffect: tankaniDespawnEffect,

    hitEntity(b, entity, health) { 
        let owner = b.owner; 
        if (owner != null && owner.addHitPoint !== undefined) { 
            owner.addHitPoint(); 
        }
        this.super$hitEntity(b, entity, health); 
    }
});

 

Events.on(ClientLoadEvent, new Cons({
    get: function(e) {
        const turretBlock = Vars.content.getByName(ContentType.block, "newex-tankani4k"); 

        if (turretBlock != null) { 
            turretBlock.configurable = true; 
            turretBlock.inaccuracy = 0; 

            turretBlock.config(java.lang.Integer, packCons2((tile, value) => { 
                if (tile != null && tile.setTier !== undefined) { 
                    tile.setTier(value); 
                }
            }));

            turretBlock.addBar("damageStack", new Func({ 
                get: function(e){ 
                    return new Bar( 
                        new Prov({  
                            get: function(){  
                                let max = e.getMaxStack();
                                let baseText = "DMG: +" + Math.floor(e.getStackRatio() * (max * 10)) + "%"; 
                                if(e.damageStack >= max) { 
                                    return baseText + " [cyan](XUYÊN GIÁP & PHÁ GIÁP)[]"; 
                                }
                                return baseText; 
                            } 
                        }),
                        new Prov({  
                            get: function(){  
                                return e.damageStack >= e.getMaxStack() ? Color.cyan : Color.orange;  
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
                hitPoints: 0, 
                damageStack: 0, 

                peekAmmo() {
                    let tier = this.getTier();
                    if (tier === 1) return tankaniMK2Bullet;
                    if (tier === 2) return tankaniMK2BBullet;
                    return tankaniNormalBullet;
                },

                useAmmo() {
                    let tier = this.getTier();
                    if (tier === 1) return tankaniMK2Bullet;
                    if (tier === 2) return tankaniMK2BBullet;
                    return tankaniNormalBullet;
                },

                getMaxStack() {
                    return this.getTier() === 2 ? maxStackMK2B : maxStackNormal;
                },

                getStackRatio() { 
                    if (this.damageStack === undefined) return 0.0; 
                    return this.damageStack / this.getMaxStack();  
                },
                
                getTier() { 
                    return this.tierState == null ? 0 : Number(this.tierState); 
                }, 
                
                setTier(val) {  
                    let numTier = Number(val);
                    this.tierState = numTier; 
                    if (numTier === 0) this.health = 848; 
                    if (numTier === 1) this.health = 1103;  
                    if (numTier === 2) this.health = 1425; 
                    this.maxHealth = this.health; 
                },

                addHitPoint() { 
                    let currentMax = this.getMaxStack();
                    if (this.damageStack >= currentMax) return; 

                    this.hitPoints++; 
                    let newStack = Math.floor(this.hitPoints / hitsPerStack); 
                    
                    if (newStack > this.damageStack) { 
                        this.damageStack = Math.min(newStack, currentMax); 
                        Fx.upgradeCore.at(this.x, this.y); 
                    }
                },

                getModifiedDamage(baseDmg) { 
                    let multiplier = 1.0 + (this.damageStack * 0.1); 
                    return Math.round(baseDmg * multiplier); 
                },

                range() { 
                    let tier = this.getTier(); 
                    if (tier === 2) { 
                        return this.super$range() * 2; 
                    }
                    return this.super$range(); 
                },

                buildConfiguration(table) { 
                    table.clear(); table.row(); 
                    let tier = this.getTier(); 

                    if (tier === 0) { 
                        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => { 
                            let dialog = extend(BaseDialog, "Trung tâm nâng cấp Tankani-4k", {}); 
                            
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
                                
                                return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI (ĐÃ TĂNG 50%):[]\n" + 
                                       "[cyan]Nhánh Cấu Hình MK2:[]\n" + 
                                       " • Đồng: " + copColor1 + currentcopper + "[] / " + reqMK2.copper + "\n" + 
                                       " • Chì: " + leaColor1 + currentlead + "[] / " + reqMK2.lead + "\n" + 
                                       "[purple]Nhánh Biến Thể Cường Hóa MK2B:[]\n" + 
                                       " • Đồng: " + copColor2 + currentcopper + "[] / " + reqMK2B.copper + "\n" + 
                                       " • Chì: " + leaColor2 + currentlead + "[] / " + reqMK2B.lead + "\n" + 
                                       " • Titan: " + titColor2 + currenttitanium + "[] / " + reqMK2B.titanium; 
                            }));
                            
                            reqCell.width(360).get().setWrap(true); 
                            reqCell.get().setAlignment(Align.left); 
                            dialog.cont.row(); dialog.cont.add().height(10).row(); 

                            let branchesTable = new Table(); 

                   
                            let b1 = new Table(); b1.background(Styles.black6); b1.margin(12); 
                            b1.add("[cyan]===(MK2)===[]").row(); 
                            let b1D = b1.add("Tích hợp công nghệ nổ mảnh diện rộng:\n" + 
                                             " [white]• Tăng lượng máu chống chịu lên [green]1103 HP[].[]\n" + 
                                             " [white]• Giữ nguyên cơ chế bắn đa mục tiêu (Đất & Không) và tầm bắn gốc.[]\n" + 
                                             " [white]• Đạn chạm mục tiêu kích nổ lan phạm vi [orange]50 pixel[].[]\n" + 
                                             " [white]• Tích tầng sát thương tối đa: [yellow]8 tầng (+80% DMG)[].[]"); 
                            b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row(); 
                            b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => { 
                                let core = this.team.core(); 
                                if (core != null && core.items.get(Items.copper) >= reqMK2.copper && core.items.get(Items.lead) >= reqMK2.lead) { 
                                    core.items.remove(Items.copper, reqMK2.copper); core.items.remove(Items.lead, reqMK2.lead); 
                                    Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y); 
                                    
                                    this.setTier(1); 
                                    this.configure(java.lang.Integer.valueOf(1)); 
                                    dialog.hide(); this.deselect(); 
                                } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); } 
                            })).size(180, 38); 

                       
                            let b2 = new Table(); b2.background(Styles.black6); b2.margin(12); 
                            b2.add("[purple]===(MK2B)===[]").row(); 
                            let b2D = b2.add("Chuyển đổi sang pháo cối tầm xa siêu tăng trưởng:\n" + 
                                             " [white]• Gia tăng lượng máu tối đa lên cực đại [green]1425 HP[].[]\n" + 
                                             " [white]• Mở rộng [ultra-light]gấp đôi tầm bắn hiệu dụng [green](x2 Range)[][].[]\n" + 
                                             " [white]• Tốc độ bắn [red]giảm 40%[][white], tấn công cả [orange]Đất & Không[].[]\n" + 
                                             " [white]• Giới hạn tích tầng đột phá lên tới [gold]18 tầng (Tối đa +180% DMG)[].[]\n" + 
                                             " [white]• Đạn nổ áp suất tạo vùng sát thương lan rộng tới [pink]150 pixel[].[]"); 
                            b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row(); 
                            b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => { 
                                let core = this.team.core(); 
                                if (core != null && core.items.get(Items.copper) >= reqMK2B.copper && core.items.get(Items.lead) >= reqMK2B.lead && core.items.get(Items.titanium) >= reqMK2B.titanium) { 
                                    core.items.remove(Items.copper, reqMK2B.copper); core.items.remove(Items.lead, reqMK2B.lead); core.items.remove(Items.titanium, reqMK2B.titanium); 
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
                        })).size(50, 40).tooltip("Nâng cấp cấu trúc hỏa lực tháp pháo"); 
                    } else { 
                        table.button(Icon.lock, Styles.cleari, 40, packRun(() => { 
                            Vars.ui.showInfo("[scarlet]HỆ THỐNG TANKANI ĐÃ ĐẠT GIỚI HẠN TIẾN HÓA![]"); 
                        })).size(50, 40).tooltip("Đã đạt cấp tối đa"); 
                    }

                    table.button(Icon.info, Styles.cleari, 40, packRun(() => { 
                        let title = " Thông số Tankani-4k: "; 
                        let descStr = ""; 
                        let currentTier = this.getTier(); 
                        let max = this.getMaxStack();

                        let statStackStr = "\n[scarlet]⚡ CƠ CHẾ TIẾN HÓA (HITS) ⚡[]\n" + 
                                           "[lightgray]Số phát bắn trúng:[] [yellow]" + this.hitPoints + " Hits[]\n" + 
                                           "[lightgray]Cấp độ tầng lực:[] [orange]Tầng " + this.damageStack + " / " + max + "[]\n" + 
                                           "[lightgray]Sát thương cộng thêm:[] [green]+" + (this.damageStack * 10) + "%[] (Tối đa +" + (max * 10) + "%)\n" + 
                                           (this.damageStack >= max ? "[cyan]🔥 Đạt mốc tối đa Sát thương: Kích hoạt đạn xuyên giáp 40% & Giảm hiệu quả giáp mục tiêu (armorMultiplier = 1.5)![]\n" : ""); 

                        if (currentTier === 0) { 
                            title += "[yellow](MK1)[]"; 
                            descStr = "[gold]⚡ THÔNG SỐ GỐC CHƯA NÂNG CẤP (MK1) ⚡[]\n" + 
                                      "[lightgray]Máu tháp pháo:[] [green]848 HP[]\n" + 
                                      "[lightgray]Trạng thái mục tiêu:[] Đất & Không\n" + 
                                      "[lightgray]Sát thương mục tiêu đơn:[] [red]" + this.getModifiedDamage(1673) + " Sát thương[] (Gốc: 1673)\n" + 
                                      statStackStr; 
                        } else if (currentTier === 1) { 
                            title += "[cyan](MK2)[]"; 
                            descStr = "[cyan]⚡ CẤU HÌNH ĐẠN DIỆN RỘNG (MK2) ⚡[]\n" + 
                                      "[lightgray]Máu tháp pháo:[] [green]1103 HP[]\n" + 
                                      "[lightgray]Vùng nổ lan (Splash):[] [orange]50 Pixel[]\n" + 
                                      "[lightgray]Sát thương trực diện:[] [red]" + this.getModifiedDamage(1673) + " Sát thương[] (Gốc: 1673)\n" + 
                                      "[lightgray]Sát thương nổ lan:[] [yellow]" + this.getModifiedDamage(837) + " Sát thương[] (Gốc: 837)\n" + 
                                      statStackStr; 
                        } else if (currentTier === 2) { 
                            title += "[purple](MK2B)[]"; 
                            descStr = "[purple]⚡ CẤU HÌNH PHÁO TẦM XA CƯỜNG HÓA (MK2B) ⚡[]\n" + 
                                      "[lightgray]Máu tháp pháo:[] [green]1425 HP[]\n" + 
                                      "[lightgray]Tầm bắn:[] [green]Gấp đôi tầm bắn gốc (x2 Range)[]\n" + 
                                      "[lightgray]Tốc độ bắn:[] [red]Chậm hơn 40%[]\n" + 
                                      "[lightgray]Trạng thái mục tiêu:[] Đất & Không\n" + 
                                      "[lightgray]Vùng nổ lan áp suất:[] [pink]150 Pixel[]\n" + 
                                      "[lightgray]Sát thương nổ lan (Đã giảm 20% gốc):[] [orange]" + this.getModifiedDamage(1070) + " Sát thương[] (Gốc: 1070)\n" + 
                                      statStackStr; 
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

                config() { return java.lang.Integer.valueOf(this.getTier()); }, 

                shoot(type) { 
                    let tier = this.getTier(); 
                    let currentMax = this.getMaxStack();
                    let activeSpecial = (this.damageStack >= currentMax); 

                    if (tier === 1) { 
                        tankaniMK2Bullet.damage = this.getModifiedDamage(1673); 
                        tankaniMK2Bullet.splashDamage = this.getModifiedDamage(837); 
                        
                        tankaniMK2Bullet.pierceArmor = activeSpecial; 
                        tankaniMK2Bullet.armorMultiplier = activeSpecial ? 1.5 : 1.0; 
                        tankaniMK2Bullet.status = StatusEffects.none; 
                        
                        this.super$shoot(tankaniMK2Bullet); 
                    } else if (tier === 2) { 
                        tankaniMK2BBullet.damage = this.getModifiedDamage(0.8); 
                        tankaniMK2BBullet.splashDamage = this.getModifiedDamage(1070); 
                        
                        tankaniMK2BBullet.pierceArmor = activeSpecial; 
                        tankaniMK2BBullet.armorMultiplier = activeSpecial ? 1.5 : 1.0; 
                        tankaniMK2BBullet.status = StatusEffects.none; 
                        
                        this.super$shoot(tankaniMK2BBullet); 
                        
                         this.reloadCounter = -turretBlock.reload * 0.667; 
                    } else { 
                        tankaniNormalBullet.damage = this.getModifiedDamage(1673); 
                        
                        tankaniNormalBullet.pierceArmor = activeSpecial; 
                        tankaniNormalBullet.armorMultiplier = activeSpecial ? 1.5 : 1.0; 
                        tankaniNormalBullet.status = StatusEffects.none; 
                        
                        this.super$shoot(tankaniNormalBullet); 
                    }
                },

                write(write) { 
                    this.super$write(write);  
                    write.b(this.getTier());   
                    write.i(this.hitPoints);      
                    write.b(this.damageStack);   
                },
                
                read(read, revision) { 
                    this.super$read(read, revision);  
                    this.setTier(read.b());  
                    this.hitPoints = read.i();   
                    this.damageStack = read.b();  
                }
            });
        }
    }
}));