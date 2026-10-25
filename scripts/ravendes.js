const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const isEn = () => Core.settings.getString("locale").startsWith("en");

const reqMK2 = { titanium: 500, silicon: 300, plastanium: 0 };
const reqMK2B = { titanium: 800, silicon: 400, plastanium: 200 }; 

const GOLD_LIGHT = "#ffffff"; 
const GOLD_MAIN = "#ffe066";  
const GOLD_DARK = "#ffd700";  
const GOLD_DEEP = "#ffaa00";  

const royalMuzzleFx = new Effect(15, cons(e => {
    Draw.color(Color.valueOf(GOLD_MAIN), Color.valueOf(GOLD_DARK), e.fin());
    Lines.stroke(2.0 * e.fout());
    Lines.circle(e.x, e.y, 10.0 * e.finpow());
}));

const royalHitFx = new Effect(20, cons(e => {
    Draw.color(Color.valueOf(GOLD_LIGHT), Color.valueOf(GOLD_MAIN), e.fin());
    Lines.stroke(1.8 * e.fout());
    Lines.circle(e.x, e.y, 14.0 * e.finpow());
    
    Angles.randLenVectors(e.id, 6, 20.0 * e.finpow(), (x, y) => {
        Draw.color(Color.valueOf(GOLD_MAIN));
        Fill.circle(e.x + x, e.y + y, 1.8 * e.fout());
    });
}));

const royalStarExplosionFx = new Effect(25, cons(e => {
    let size = 22.0 * e.finpow();
    let spinRot = e.rotation + (e.fin() * 45.0);

    Draw.color(Color.valueOf(GOLD_DEEP));
    Draw.alpha(0.8 * e.fout());
    for(let i = 0; i < 4; i++) {
        Drawf.tri(e.x, e.y, 6.0 * e.fout(), size * 1.3, spinRot + (i * 90));
    }

    Draw.color(Color.valueOf(GOLD_MAIN));
    Draw.alpha(1.0 * e.fout());
    for(let i = 0; i < 4; i++) {
        Drawf.tri(e.x, e.y, 4.5 * e.fout(), size, spinRot + (i * 90));
    }

    Draw.color(Color.valueOf(GOLD_LIGHT));
    for(let i = 0; i < 4; i++) {
        Drawf.tri(e.x, e.y, 2.5 * e.fout(), size * 0.6, spinRot + 45 + (i * 90));
    }

    Angles.randLenVectors(e.id, 8, 25.0 * e.finpow(), (x, y) => {
        Draw.color(Color.valueOf(GOLD_LIGHT), Color.valueOf(GOLD_MAIN), e.fin());
        Fill.circle(e.x + x, e.y + y, 2.0 * e.fout());
    });

    Draw.reset();
}));

const royalCritHitFx = new Effect(18, cons(e => {
    Draw.color(Color.valueOf("#ffcc00"), Color.white, e.fin());
    Lines.stroke(2.0 * e.fout());
    Lines.circle(e.x, e.y, 12.0 * e.finpow());
    Angles.randLenVectors(e.id, 5, 16.0 * e.finpow(), (x, y) => {
        Fill.circle(e.x + x, e.y + y, 1.5 * e.fout());
    });
}));

const royalSparkTrailFx = new Effect(25, cons(e => {
    Draw.color(Color.valueOf(GOLD_MAIN), Color.valueOf(GOLD_DEEP), e.fin());
    Draw.alpha(0.85 * e.fout());
    
    let spin = e.rotation + (e.fin() * 120.0);
    let rx = e.x;
    let ry = e.y;
    Angles.randLenVectors(e.id, 1, 3.0, (x, y) => {
        rx += x;
        ry += y;
    });
    let size = (1.2 + ((e.id % 5) * 0.2)) * e.fout();

    for(let i = 0; i < 4; i++){
        let a = spin + (i * 90);
        Drawf.tri(rx, ry, size * 0.8, size * 3.5, a);
    }
}));

function createRoyalStar4DrawFunction(coreColorHex, outerColorHex, starSize) {
    let coreColor = Color.valueOf(coreColorHex || GOLD_LIGHT);
    let outerColor = Color.valueOf(outerColorHex || GOLD_MAIN);
    let deepColor = Color.valueOf(GOLD_DEEP);
    let size = starSize || 16.0;

    return function(b) {
        let x = b.x, y = b.y;
        let spinRot = b.rotation() + (b.time * 8.0);

        Draw.color(deepColor);
        Draw.alpha(0.6 + Mathf.absin(b.time, 1.5, 0.3));
        for(let i = 0; i < 4; i++) {
            Drawf.tri(x, y, 4.5, size * 1.25, spinRot + (i * 90));
        }

        Draw.color(outerColor);
        Draw.alpha(0.95);
        for(let i = 0; i < 4; i++) {
            Drawf.tri(x, y, 3.8, size, spinRot + (i * 90));
        }

        Draw.color(outerColor);
        Draw.alpha(0.7);
        for(let i = 0; i < 4; i++) {
            Drawf.tri(x, y, 2.2, size * 0.55, spinRot + 45 + (i * 90));
        }

        Draw.color(coreColor);
        Draw.alpha(1.0);
        for(let i = 0; i < 4; i++) {
            Drawf.tri(x, y, 2.0, size * 0.6, spinRot + (i * 90));
        }

        Fill.circle(x, y, 2.2);
        Draw.reset();
    };
}

function applyDistanceDamageMultiplier(b, entity, tier) {
    if (entity == null || b.owner == null) return;

    let shooter = b.owner;
    let maxRange = shooter.range ? shooter.range() : 1200.0;
    let dist = Mathf.dst(shooter.x, shooter.y, entity.x, entity.y);

    if (tier == 2) {
        if (dist < maxRange * 0.4) {
            entity.damage(b.damage * 9.0);
            royalCritHitFx.at(entity.x, entity.y);
        } 
        else if (dist >= maxRange * 0.4 && dist < maxRange * 0.6) {
            entity.damage(b.damage * 5.55);
            royalCritHitFx.at(entity.x, entity.y);
        }
    } else {
        if (dist >= maxRange * 0.4 && dist < maxRange * 0.6) {
            entity.damage(b.damage * 5.55);
            royalCritHitFx.at(entity.x, entity.y);
        } 
        else if (dist >= maxRange * 0.6) {
            entity.damage(b.damage * 9.0);
            royalCritHitFx.at(entity.x, entity.y);
        }
    }

    if (entity instanceof Unit && ((entity.type != null && entity.type.name === "akenewm-inventer") || entity.isGalileoJS)) {
        entity.damage(b.damage * 5.0); 
        Fx.itemTransfer.at(entity.x, entity.y, 10, Color.valueOf(GOLD_MAIN));
    }
}

const ravendesBulletMK1 = extend(BasicBulletType, {
    speed: 20.8, damage: 75, width: 4.0, height: 16, shrinkX: 0, shrinkY: 0,
    homingPower: 0,
    frontColor: Color.valueOf(GOLD_LIGHT), backColor: Color.valueOf(GOLD_MAIN),
    splashDamage: 12, splashDamageRadius: 20,
    shootEffect: royalMuzzleFx, hitEffect: royalHitFx, despawnEffect: royalStarExplosionFx, 
    status: StatusEffects.melting, statusDuration: 80,
    trailEffect: royalSparkTrailFx, trailInterval: 2, trailParam: 1.5,
    hitEntity(b, entity, health) { 
        this.super$hitEntity(b, entity, health); 
        applyDistanceDamageMultiplier(b, entity, 0); 
    },
    draw: createRoyalStar4DrawFunction(GOLD_LIGHT, GOLD_MAIN, 16.0)
});

const ravendesBulletMK2 = extend(BasicBulletType, {
    speed: 23.4 * 1.5, damage: 105 * 1.5, width: 4.5, height: 20, shrinkX: 0, shrinkY: 0,
    homingPower: 0,
    frontColor: Color.valueOf(GOLD_LIGHT), backColor: Color.valueOf(GOLD_DARK),
    splashDamage: 20 * 1.5, splashDamageRadius: 28,
    shootEffect: royalMuzzleFx, hitEffect: royalHitFx, despawnEffect: royalStarExplosionFx, 
    status: StatusEffects.melting, statusDuration: 120,
    trailEffect: royalSparkTrailFx, trailInterval: 1.5, trailParam: 2.0,
    hitEntity(b, entity, health) { 
        this.super$hitEntity(b, entity, health); 
        applyDistanceDamageMultiplier(b, entity, 1); 
    },
    draw: createRoyalStar4DrawFunction(GOLD_LIGHT, GOLD_DARK, 18.0)
});

const ravendesBulletMK2B = extend(BasicBulletType, {
    speed: 25.0, damage: 140, width: 5.0, height: 22, shrinkX: 0, shrinkY: 0,
    homingPower: 0,
    frontColor: Color.valueOf(GOLD_LIGHT), backColor: Color.valueOf("#ff2525"),
    splashDamage: 30, splashDamageRadius: 35,
    shootEffect: royalMuzzleFx, hitEffect: royalHitFx, despawnEffect: royalStarExplosionFx, 
    status: StatusEffects.melting, statusDuration: 150,
    trailEffect: royalSparkTrailFx, trailInterval: 1.0, trailParam: 2.5,
    hitEntity(b, entity, health) { 
        this.super$hitEntity(b, entity, health); 
        applyDistanceDamageMultiplier(b, entity, 2); 
    },
    draw: createRoyalStar4DrawFunction(GOLD_LIGHT, "#ff2525", 20.0)
});

let customShootSound = Sounds.none;
Events.on(ClientLoadEvent, () => {
    try { customShootSound = Vars.tree.loadSound("ravendesshoot"); } catch(e) { }
});

Events.on(ContentInitEvent, () => {
    let Ravendes = Vars.content.getByName(ContentType.block, "newex-ravendes");
    if(!Ravendes) {
        Ravendes = Vars.content.blocks().find(b => b.name.endsWith("ravendes"));
    }
    if(!Ravendes) return;

    Ravendes.shootSound = Sounds.none;
    Ravendes.configurable = true;
    Ravendes.reload = 6.0;
    Ravendes.targetAir = true;
    Ravendes.targetGround = true;
    Ravendes.shootType = ravendesBulletMK1;

    Ravendes.config(java.lang.Integer, packCons2((tile, value) => {
        if (tile != null && tile.tryUpgrade !== undefined) {
            let val = Number(value);
            if (val == 1 || val == 2) {
                tile.tryUpgrade(val);
            } else {
                tile.setTier(val);
            }
        }
    }));

    Ravendes.addBar("dmg_bonus", new Func({
        get: function(e){
            return new Bar(
                new Prov({ get: function(){ 
                    if(e.target == null) return "DMG Multiplier: 100% (Base)";
                    let maxR = e.range();
                    let dist = Mathf.dst(e.x, e.y, e.target.x, e.target.y);
                    let tier = e.getTier ? e.getTier() : 0;
                    let mult = 1.0;
                    if (tier == 2) {
                        if (dist < maxR * 0.4) mult = 9.0;
                        else if (dist >= maxR * 0.4 && dist < maxR * 0.6) mult = 5.55;
                    } else {
                        if(dist >= maxR * 0.6) mult = 9.0;
                        else if(dist >= maxR * 0.4) mult = 5.55;
                    }
                    let pct = Math.floor(mult * 100);
                    return "DMG Multiplier: " + pct + "%";
                } }),
                new Prov({ get: function(){ return Color.orange; } }),
                new Floatp({ get: function(){ 
                    if(e.target == null) return 0.2;
                    let maxR = e.range();
                    let dist = Mathf.dst(e.x, e.y, e.target.x, e.target.y);
                    let tier = e.getTier ? e.getTier() : 0;
                    if (tier == 2) {
                        if (dist < maxR * 0.4) return 1.0;
                        else if (dist >= maxR * 0.4 && dist < maxR * 0.6) return 0.6;
                    } else {
                        if(dist >= maxR * 0.6) return 1.0;
                        else if(dist >= maxR * 0.4) return 0.6;
                    }
                    return 0.2;
                } })
            );
        }
    }));

    Ravendes.addBar("power_status", new Func({
        get: function(e){
            return new Bar(
                new Prov({ get: function(){ 
                    let hasPower = e.power != null && e.power.status > 0;
                    if(!hasPower) return "Thiếu điện năng";
                    return "Năng lượng: Đủ điều kiện hoạt động";
                } }),
                new Prov({ get: function(){ 
                    let hasPower = e.power != null && e.power.status > 0;
                    return hasPower ? Color.gold : Color.scarlet; 
                } }),
                new Floatp({ get: function(){ 
                    return e.power != null ? e.power.status : 0;
                } })
            );
        }
    }));

    Ravendes.buildType = () => extend(PowerTurret.PowerTurretBuild, Ravendes, {
        tierState: 0, 
        mk2bTimer: 0.0,
        mk2bDelayTimer: 0.0,
        mk2bPending: false,

        paidTitanium: 0,
        paidSilicon: 0,
        paidPlastanium: 0,

        peekAmmo(){
            let tier = this.getTier();
            if(tier == 1) return ravendesBulletMK2;
            if(tier == 2) return ravendesBulletMK2B;
            return ravendesBulletMK1;
        },

        getTier(){ return this.tierState == null ? 0 : this.tierState; },
        setTier(val){ 
            this.tierState = val;
            this.paidTitanium = 0;
            this.paidSilicon = 0;
            this.paidPlastanium = 0;
            if(val == 0) { this.health = 1200; }
            if(val == 1) { this.health = 1800 * 1.5; }
            if(val == 2) { this.health = 1600; }
            this.maxHealth = this.health;
        },

        range(){
            let tier = this.getTier();
            if(tier == 1) return 1200.0 * 1.5;
            if(tier == 2) return 1300.0;
            return 1200.0;
        },

        updateTile(){
            let tier = this.getTier();
            let hasPower = this.power != null && this.power.status > 0;

            if (tier == 1) {
                this.reloadCounter += Time.delta * 0.5;
                this.rotation = Angles.moveToward(this.rotation, this.targetRotation, 4.0 * 1.5 * Time.delta);
            }

            if (tier == 2 && hasPower) {
                if (this.target != null) {
                    this.mk2bTimer += Time.delta;
                    if (this.mk2bTimer >= 300.0) {
                        this.mk2bTimer = 0.0;
                        this.fireShotgunBurst();
                        this.mk2bPending = true;
                        this.mk2bDelayTimer = 0.0;
                    }
                }

                if (this.mk2bPending) {
                    this.mk2bDelayTimer += Time.delta;
                    if (this.mk2bDelayTimer >= 30.0) {
                        this.mk2bPending = false;
                        this.fireShotgunBurst();
                    }
                }
            } else {
                this.mk2bTimer = 0.0;
                this.mk2bPending = false;
                this.mk2bDelayTimer = 0.0;
            }

            this.super$updateTile();
        },

        fireShotgunBurst(){
            if (customShootSound != null && customShootSound != Sounds.none) {
                customShootSound.at(this.x, this.y, 1.0, 1.0);
            }

            if (royalMuzzleFx != null) {
                royalMuzzleFx.at(this.x, this.y, this.rotation);
            }

            let bulletType = ravendesBulletMK2B;
            let baseSpeed = bulletType.speed;
            let baseLife = this.range() / baseSpeed;

            for (let i = 0; i < 20; i++) {
                let randSpeed = baseSpeed * Mathf.random(0.5, 1.5);
                let angleOffset = Mathf.range(18.0);
                let b = bulletType.create(this, this.team, this.x, this.y, this.rotation + angleOffset, -1, randSpeed);
                if (b != null) {
                    b.lifetime = baseLife;
                }
            }
        },

        tryUpgrade(targetTier){
            if(this.getTier() != 0) return false;

            let req = (targetTier == 1) ? reqMK2 : (targetTier == 2 ? reqMK2B : null);
            if(req == null) return false;

            let core = this.team.core();
            if(core == null) return false;

            let reqT = req.titanium || 0;
            let reqS = req.silicon || 0;
            let reqP = req.plastanium || 0;

            let coreT = core.items.get(Items.titanium);
            let coreS = core.items.get(Items.silicon);
            let coreP = core.items.get(Items.plastanium);

            if(coreT >= reqT && coreS >= reqS && coreP >= reqP){
                if(reqT > 0) core.items.remove(Items.titanium, reqT);
                if(reqS > 0) core.items.remove(Items.silicon, reqS);
                if(reqP > 0) core.items.remove(Items.plastanium, reqP);

                this.setTier(targetTier);

                if(targetTier == 1) Fx.upgradeCore.at(this.x, this.y);
                else Fx.bigShockwave.at(this.x, this.y);
                Fx.mineHuge.at(this.x, this.y);
                Effect.shake(4, 4, this.x, this.y);
                return true;
            } else {
                if(!Vars.headless && Vars.player != null){
                    Vars.ui.showInfo(isEn() ? "[scarlet]Not enough resources in core![]" : "[scarlet]Không đủ tài nguyên trong lõi![]");
                }
                return false;
            }
        },

        drawSelect(){
            this.super$drawSelect();

            let maxR = this.range();
            let r40 = maxR * 0.4;
            let r60 = maxR * 0.6;

            Draw.color(Color.valueOf("#4488ff"));
            Lines.dashCircle(this.x, this.y, r40);

            Draw.color(Color.valueOf("#00ffff"));
            Lines.stroke(1.5);
            Lines.dashCircle(this.x, this.y, r60);

            Draw.color(Color.valueOf("#ff3300"));
            Lines.stroke(2.0);
            Lines.dashCircle(this.x, this.y, maxR);
            
            Draw.color(Color.valueOf("#ffaa00"));
            Draw.alpha(0.08);
            Fill.circle(this.x, this.y, maxR);

            Draw.reset();
        },

        shouldShoot(){
            let tier = this.getTier();
            if (tier == 2) return false;
            return this.super$shouldShoot();
        },

        shoot(type){
            if (customShootSound != null && customShootSound != Sounds.none) {
                customShootSound.at(this.x, this.y, 1.0, 1.0);
            }

            let tier = this.getTier();
            let bulletType = this.peekAmmo();
            let exactLifetime = this.range() / bulletType.speed;

            let b = bulletType.create(this, this.team, this.x, this.y, this.rotation);
            if (b != null) {
                b.lifetime = exactLifetime;
            }

            if (tier == 1 && Mathf.chance(0.2)) {
                for (let i = 0; i < 3; i++) {
                    let angleOffset = Mathf.range(18.0);
                    let extraB = bulletType.create(this, this.team, this.x, this.y, this.rotation + angleOffset);
                    if (extraB != null) {
                        extraB.lifetime = exactLifetime;
                    }
                }
            }
        },

        buildConfiguration(table){
            table.clear(); table.row();
            let tier = this.getTier();

            if(tier == 0) {
                table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                    let core = this.team.core();
                    let availT = core ? core.items.get(Items.titanium) : 0;
                    let availS = core ? core.items.get(Items.silicon) : 0;
                    let availP = core ? core.items.get(Items.plastanium) : 0;

                    let dialog = extend(BaseDialog, isEn() ? "Ravendes Upgrade Center" : "Trung tâm nâng cấp pháo Ravendes", {});
                    
                    let textT_MK2 = (availT >= reqMK2.titanium ? "[green]" : "[scarlet]") + availT + "[] / " + reqMK2.titanium;
                    let textS_MK2 = (availS >= reqMK2.silicon ? "[green]" : "[scarlet]") + availS + "[] / " + reqMK2.silicon;

                    let textT_MK2B = (availT >= reqMK2B.titanium ? "[green]" : "[scarlet]") + availT + "[] / " + reqMK2B.titanium;
                    let textS_MK2B = (availS >= reqMK2B.silicon ? "[green]" : "[scarlet]") + availS + "[] / " + reqMK2B.silicon;
                    let textP_MK2B = (availP >= reqMK2B.plastanium ? "[green]" : "[scarlet]") + availP + "[] / " + reqMK2B.plastanium;

                    let reqStr = isEn() ?
                        "[yellow]CORE RESOURCES / REQUIRED FOR UPGRADE:[]\n" +
                        "[cyan]MK2 Branch:[]\n" +
                        " • Titanium: " + textT_MK2 + "\n" +
                        " • Silicon: " + textS_MK2 + "\n" +
                        "[purple]MK2B Branch:[]\n" +
                        " • Titanium: " + textT_MK2B + "\n" +
                        " • Silicon: " + textS_MK2B + "\n" +
                        " • Plastanium: " + textP_MK2B :
                        "[yellow]TÀI NGUYÊN TRONG LÕI / CẦN NÂNG CẤP:[]\n" +
                        "[cyan]Nhánh MK2:[]\n" +
                        " • Titan: " + textT_MK2 + "\n" +
                        " • Silicon: " + textS_MK2 + "\n" +
                        "[purple]Nhánh MK2B:[]\n" +
                        " • Titan: " + textT_MK2B + "\n" +
                        " • Silicon: " + textS_MK2B + "\n" +
                        " • Nhựa Plastanium: " + textP_MK2B;

                    let reqCell = dialog.cont.add(reqStr);
                    reqCell.width(360).get().setWrap(true);
                    reqCell.get().setAlignment(Align.left);
                    dialog.cont.row(); dialog.cont.add().height(10).row();

                    let branchesTable = new Table();

                    let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                    b1.add("[#ffd700]👑 PHÂN NHÁNH A: PROTOCOL MK2 [ROYAL LONG-RANGE][]").row();
                    let b1D = b1.add("Tối ưu hóa tầm xa siêu cấp và gia tăng độ bền tháp.\n" +
                                     " • [#ffe066]Khung vách:[] Titan cường lực [green]2,700 HP[] (+50%).\n" +
                                     " • [#ffe066]Tầm bắn siêu xa:[] Tối đa [yellow]1800px[].");
                    b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                    b1.button("[#ffd700]KÍCH HOẠT MK2[]", packRun(() => {
                        if(Vars.net.active()){
                            Call.tileConfig(Vars.player, this, java.lang.Integer(1));
                        } else {
                            this.tryUpgrade(1);
                        }
                        dialog.hide();
                        this.deselect();
                    })).size(180, 38);

                    let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                    b2.add("[#ffaa00]⚡ PHÂN NHÁNH B: PROTOCOL MK2B [GOLDEN OVERCLOCK][]").row();
                    let b2D = b2.add("Sấy đạn ngôi sao hoàng gia cực nhanh càn quét mục tiêu.\n" +
                                     " • [#ffe066]Khung vách:[] Ép xung bền bỉ [green]1,600 HP[].\n" +
                                     " • [#ffe066]Tầm bắn:[] [yellow]1300px[] kèm đạn shotgun định kỳ.");
                    b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                    b2.button("[#ffaa00]KÍCH HOẠT MK2B[]", packRun(() => {
                        if(Vars.net.active()){
                            Call.tileConfig(Vars.player, this, java.lang.Integer(2));
                        } else {
                            this.tryUpgrade(2);
                        }
                        dialog.hide();
                        this.deselect();
                    })).size(180, 38);

                    branchesTable.add(b1).width(340); branchesTable.row();
                    branchesTable.add().height(12).row(); branchesTable.add(b2).width(340);
                    let scroll = new ScrollPane(branchesTable); scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400); dialog.addCloseButton(); dialog.show();
                })).size(50, 40).tooltip(isEn() ? "Upgrade Ravendes system" : "Nâng cấp hệ thống Ravendes");
            } else {
                table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                    Vars.ui.showInfo(isEn() ? "[scarlet]RAVENDES HAS REACHED MAX EVOLUTION LEVEL![]" : "[scarlet]HỆ THỐNG RAVENDES ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
                })).size(50, 40).tooltip(isEn() ? "Max level reached" : "Đã đạt cấp tối đa");
            }

            table.button(Icon.info, Styles.cleari, 40, packRun(() => {
                let title = "📡 HỆ THỐNG PHÁO RAVENDES ROYAL";
                let descStr = "[#ffd700]⚙️ THÔNG TIN TẦM BẮN & SÁT THƯƠNG:[]\n" +
                              "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                              " • [#ffe066]Năng lượng:[] Tháp tự động hoạt động khi có điện lưới.\n" +
                              " • [#ffe066]MK2:[] Tăng 50% mọi chỉ số và 20% tỉ lệ bắn thêm 3 viên (lệch 18°).\n" +
                              " • [#ffe066]MK2B:[] Đảo ngược vùng sát thương (càng gần càng to) và tự động bắn shotgun 20 viên mỗi 5s (2 lượt cách nhau 0.5s).";

                let dialog = extend(BaseDialog, title, {});
                let infoTable = new Table(); let cell = infoTable.add(descStr).width(360);
                cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                let scroll = new ScrollPane(infoTable); scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400); dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip(isEn() ? "View detailed stats" : "Xem thông số chi tiết hệ thống");
        },

        config() { return java.lang.Integer(this.getTier()); },

        write(write){ 
            this.super$write(write); 
            write.b(this.getTier()); 
            write.i(this.paidTitanium);
            write.i(this.paidSilicon);
            write.i(this.paidPlastanium);
        },
        read(read, revision){ 
            this.super$read(read, revision); 
            this.setTier(read.b()); 
            this.paidTitanium = read.i();
            this.paidSilicon = read.i();
            this.paidPlastanium = read.i();
        }
    });
});
