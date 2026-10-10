const COLOR = Color.valueOf("ffff00"); 
const COLOR_ALT = Color.valueOf("e6005c");  
const WHITE = Color.valueOf("ffffff");

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

function isVietnamese() {
    let loc = Core.settings.get("locale", "en");
    if (!loc) loc = Core.settings.get("language", "en");
    return loc != null && loc.toString().toLowerCase().startsWith("vi");
}

const reqEmpericalMK2 = { copper: 8000, lead: 8000, titanium: 4000, thorium: 2000 };
const reqEmpericalMK2B = { copper: 8000, lead: 8000, titanium: 4000, surgeAlloy: 15000 };

let wing1Region = null;
let wing2Region = null;

function loadWingRegions() {
    if (!wing1Region || !wing1Region.found()) {
        wing1Region = Core.atlas.find("newex-emperical-wing1");
        if (!wing1Region.found()) wing1Region = Core.atlas.find(Vars.content.transformName("newex-emperical-wing1"));
    }
    if (!wing2Region || !wing2Region.found()) {
        wing2Region = Core.atlas.find("newex-emperical-wing2");
        if (!wing2Region.found()) wing2Region = Core.atlas.find(Vars.content.transformName("newex-emperical-wing2"));
    }
}

function updateEmpericalMenuVisibility() {
    const empericalBlock = Vars.content.block("newex-emperical") || Vars.content.block("emperical");
    if (!Vars.player || !empericalBlock) return;

    let playerTeam = Vars.player.team();
    let maxAllowed = 1; 
    let currentCount = 0;
    Groups.build.each(b => {
        if (b.block === empericalBlock && b.team === playerTeam) {
            currentCount++;
        }
    });

    if (currentCount < maxAllowed) {
        empericalBlock.buildVisibility = BuildVisibility.shown;
    } else {
        empericalBlock.buildVisibility = BuildVisibility.hidden;
    }
}

Events.on(WorldLoadEvent, event => {
    Time.run(10, () => {
        updateEmpericalMenuVisibility();
    });
});

Events.on(BlockBuildEndEvent, event => {
    updateEmpericalMenuVisibility();
});

Events.on(BlockDestroyEvent, event => {
    const empericalBlock = Vars.content.block("newex-emperical") || Vars.content.block("emperical");
    if (!empericalBlock) return;

    let destroyedTile = event.tile;
    if (!destroyedTile || !destroyedTile.build) return;

    let destroyedBuild = destroyedTile.build;
    let victimTeam = destroyedBuild.team;

    if (destroyedBuild.block instanceof CoreBlock) {
        let maxAllowed = 1; 
        let teamBlocks = [];
        Groups.build.each(b => {
            if (b.block === empericalBlock && b.team === victimTeam) {
                teamBlocks.push(b);
            }
        });

        if (teamBlocks.length > maxAllowed) {
            let toDestroy = teamBlocks.length - maxAllowed;
            for (let i = 0; i < toDestroy; i++) {
                let lastBlock = teamBlocks.pop();
                Call.sendMessage("[red]Đội " + victimTeam.name + " vượt quá giới hạn 1 Pháo Emperical duy nhất! Pháo thừa đã tự hủy![]");
                lastBlock.kill();
            }
        }
    }

    updateEmpericalMenuVisibility();
});

const CircleGatherEffect = new Effect(12, e => {
    Draw.z(Layer.effect);
    Draw.color(COLOR, COLOR_ALT, e.fin());
    
    for (let i = 0; i < 4; i++) {
        let angle = e.id * 90 + i * 90 + e.fin() * 180;
        let dist = 25 * e.fout(); 
        let px = e.x + Angles.trnsx(angle, dist);
        let py = e.y + Angles.trnsy(angle, dist);
        Fill.circle(px, py, 2 * e.fin());
    }
});

const CircleDisperseEffect = new Effect(15, e => {
    Draw.z(Layer.effect);
    Draw.color(COLOR_ALT, COLOR, e.fin());
    
    for (let i = 0; i < 6; i++) {
        let angle = e.id * 60 + i * 60;
        let dist = 30 * e.finpow(); 
        let px = e.x + Angles.trnsx(angle, dist);
        let py = e.y + Angles.trnsy(angle, dist);
        Fill.circle(px, py, 2.5 * e.fout());
    }
});

const EmpericalExplosionCircleEffect = new Effect(30, e => {
    Draw.z(Layer.effect);
    Draw.color(COLOR, COLOR_ALT, e.fin());
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, 15 * 8 * e.finpow());
    
    Draw.color(COLOR_ALT);
    Lines.stroke(2 * e.fout());
    Lines.circle(e.x, e.y, (15 * 8 * e.finpow()) * 0.8);
    
    Draw.reset();
});

const customTrailEffect = new Effect(16, e => {
    Draw.color(COLOR, COLOR_ALT, e.fin());
    Lines.stroke(3 * e.fout());
    Lines.lineAngle(e.x, e.y, e.rotation + 180, 8 * e.fout());
    Fill.circle(e.x, e.y, 2.5 * e.fout());
});

const ForceEffect = new Effect(50, e => {
    Draw.color(COLOR, COLOR_ALT, e.fin());
    Lines.stroke(5 * e.fout());
    Lines.circle(e.x, e.y, e.finpow() * 150);
});

const EmpericalExplosionEffect = new Effect(60, e => {
    Draw.color(COLOR_ALT);
    Lines.stroke(4 * e.fout());
    Lines.circle(e.x, e.y, e.finpow() * 400);
    Draw.color(COLOR);
    Fill.circle(e.x, e.y, e.fout() * 80);
});

const WingChargeLaserEffect = new Effect(20, e => {
    if (!e.data) return;
    Draw.z(Layer.effect);
    Draw.color(COLOR_ALT, COLOR, e.fin());
    Lines.stroke(2 * e.fout());
    Lines.line(e.x, e.y, e.data.x, e.data.y);
    Fill.circle(e.data.x, e.data.y, 3 * e.fout());
    Draw.reset();
});

const paralyzed = extend(StatusEffect, "paralyzed", {
    localizedName: "Paralyzed",
    speedMultiplier: 0.6,
    reloadMultiplier: 0.5
});

const oppressive = extend(StatusEffect, "oppressive", {
    localizedName: "Oppressive",
    speedMultiplier: 0,
    reloadMultiplier: 0
});

function getMaxHealth(entity) {
    if (!entity) return 0;
    if (typeof entity.maxHealth === "function") return entity.maxHealth();
    if (entity.maxHealth !== undefined) return entity.maxHealth;
    if (entity.build) {
        if (typeof entity.build.maxHealth === "function") return entity.build.maxHealth();
        if (entity.build.maxHealth !== undefined) return entity.build.maxHealth;
    }
    return 0;
}

function applyDamage(entity, amount) {
    if (!entity || amount <= 0) return;
    if (typeof entity.damage === "function") {
        entity.damage(amount);
    } else if (entity.build && typeof entity.build.damage === "function") {
        entity.build.damage(amount);
    }
}

function handleCustomHit(bullet, other, hitX, hitY) {
    if (!bullet || !bullet.owner) return;

    let turret = bullet.owner;
    let targetX = hitX !== undefined ? hitX : (other ? other.x : bullet.x);
    let targetY = hitY !== undefined ? hitY : (other ? other.y : bullet.y);

    let maxHp = getMaxHealth(other);

    if (other && maxHp > 0 && Mathf.chance(0.5)) {
        applyDamage(other, maxHp * 0.05);
    }

    if (turret.getTier && turret.getTier() == 1 && maxHp > 0 && other) {
        applyDamage(other, maxHp * 0.01);
    }

    if (turret.getTier && turret.getTier() == 2) {
        let splashDmg = bullet.damage * 5.0;
        let splashRadius = 50 * 8;
        Damage.damage(bullet.team, targetX, targetY, splashRadius, splashDmg);
        if (Mathf.chance(0.3)) {
            EmpericalExplosionEffect.at(targetX, targetY);
        }
    }
}

const EmpericalBullet_Frag = extend(BasicBulletType, {
    damage: 0,
    speed: 1,
    lifetime: 14.4,
    width: 0,
    height: 0,
    lightning: 2,
    lightningDamage: 85,
    lightningLength: 7,
    lightningColor: COLOR,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        handleCustomHit(b, entity, entity.x, entity.y);
    },
    hitTile(b, tile, health) {
        this.super$hitTile(b, tile, health);
        let target = (tile && tile.build) ? tile.build : tile;
        if (target) handleCustomHit(b, target, target.x, target.y);
    }
});

const EmpericalBullet_Interval = extend(BasicBulletType, {
    damage: 0,
    speed: 0,
    lifetime: 0,
    width: 0,
    height: 0,
    lightning: 2,
    lightningDamage: 35,
    lightningLength: 7,
    lightningColor: COLOR,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        handleCustomHit(b, entity, entity.x, entity.y);
    },
    hitTile(b, tile, health) {
        this.super$hitTile(b, tile, health);
        let target = (tile && tile.build) ? tile.build : tile;
        if (target) handleCustomHit(b, target, target.x, target.y);
    }
});

const EmpericalBullet = extend(BasicBulletType, {
    damage: 500,
    speed: 5,
    lifetime: 72,
    width: 20,
    height: 20,
    trailWidth: 0,
    trailLength: 0,
    trailEffect: customTrailEffect,
    trailInterval: 4,
    frontColor: COLOR,
    backColor: COLOR_ALT,
    trailColor: COLOR_ALT,
    status: StatusEffects.shocked,
    statusDuration: 60,
    homingPower: 0.05,
    homingRange: 360,
    homingDelay: 14.4,
    splashDamage: 180,
    splashDamageRadius: 60,
    lightning: 3,
    lightningDamage: 95,
    lightningLength: 10,
    lightningColor: COLOR,
    pierce: true,
    pierceCap: 1,
    fragBullets: 2,
    fragBullet: EmpericalBullet_Frag,
    bulletInterval: 6,
    intervalBullet: EmpericalBullet_Interval,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && typeof b.owner.heal === "function") {
            let maxHp = getMaxHealth(b.owner);
            b.owner.heal(maxHp * 0.001);
        }
        handleCustomHit(b, entity, entity.x, entity.y);
    },

    hitTile(b, tile, health) {
        this.super$hitTile(b, tile, health);
        let target = (tile && tile.build) ? tile.build : tile;
        if (target) handleCustomHit(b, target, target.x, target.y);
    },

    despawned(b) {
        this.super$despawned(b);
        if (!b.hit) {
            let splashRadius = 15 * 8;
            let splashDmg = this.damage * 1.5;
            Damage.damage(b.team, b.x, b.y, splashRadius, splashDmg);
            EmpericalExplosionCircleEffect.at(b.x, b.y);
        }
    }
});

const EmpericalMissile = extend(MissileBulletType, {
    damage: 205,
    speed: 10,
    lifetime: 36,
    width: 5,
    height: 15,
    trailWidth: 0,
    trailLength: 0,
    trailEffect: customTrailEffect,
    trailInterval: 4,
    frontColor: COLOR,
    backColor: COLOR_ALT,
    trailColor: COLOR_ALT,
    homingPower: 1,
    homingRange: 180,
    lightning: 2,
    lightningDamage: 120,
    lightningLength: 7,
    lightningColor: COLOR,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && typeof b.owner.heal === "function") {
            let maxHp = getMaxHealth(b.owner);
            b.owner.heal(maxHp * 0.001);
        }
        handleCustomHit(b, entity, entity.x, entity.y);
    },

    hitTile(b, tile, health) {
        this.super$hitTile(b, tile, health);
        let target = (tile && tile.build) ? tile.build : tile;
        if (target) handleCustomHit(b, target, target.x, target.y);
    }
});

const EmpericalHook = extend(BasicBulletType, {
    damage: 60,
    speed: 20,
    lifetime: 18,
    width: 10,
    height: 10,
    trailWidth: 0,
    trailLength: 0,
    trailEffect: customTrailEffect,
    trailInterval: 3,
    frontColor: WHITE,
    backColor: COLOR_ALT,
    trailColor: COLOR,
    homingPower: 1,
    homingRange: 90,
    lightning: 2,
    lightningDamage: 165,
    lightningLength: 7,
    lightningColor: COLOR,

    hitEntity(b, other, initialHealth) {
        if (b.owner != null && typeof b.owner.heal === "function") {
            let maxHp = getMaxHealth(b.owner);
            b.owner.heal(maxHp * 0.001);
        }

        if (other && other.build == null && b.owner && typeof other.impulse === "function") {
            let angleToTurret = Mathf.angle(b.owner.x - other.x, b.owner.y - other.y);
            other.impulse(Angles.trnsx(angleToTurret, 400), Angles.trnsy(angleToTurret, 400));
        }
        this.super$hitEntity(b, other, initialHealth);
        handleCustomHit(b, other, other.x, other.y);
    },

    hitTile(b, tile, health) {
        this.super$hitTile(b, tile, health);
        let target = (tile && tile.build) ? tile.build : tile;
        if (target) handleCustomHit(b, target, target.x, target.y);
    }
});

const EmpericalLaser = extend(LaserBulletType, {
    damage: 900,
    lifetime: 30,
    width: 56,
    length: 480,
    pierce: true,
    pierceCap: 999,
    pierceArmor: true,
    colors: [COLOR_ALT, COLOR, WHITE],
    status: oppressive,
    statusDuration: 120,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && typeof b.owner.heal === "function") {
            let maxHp = getMaxHealth(b.owner);
            b.owner.heal(maxHp * 0.025);
        }
        handleCustomHit(b, entity, entity.x, entity.y);
    },

    hitTile(b, tile, health) {
        let target = (tile && tile.build) ? tile.build : tile;
        if (target) handleCustomHit(b, target, target.x, target.y);
    }
});

const EmpericalLightning = extend(LightningBulletType, {
    damage: 60,
    lightningLength: 45,
    lightningColor: COLOR_ALT,
    status: paralyzed,
    statusDuration: 90,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        handleCustomHit(b, entity, entity.x, entity.y);
    },

    hitTile(b, tile, health) {
        let target = (tile && tile.build) ? tile.build : tile;
        if (target) handleCustomHit(b, target, target.x, target.y);
    }
});

function DrawMagicCircle(x, y, radius, intensity) {
    Draw.z(Layer.effect);
    Draw.blend(Blending.additive);

    Draw.color(COLOR_ALT, 0.35 * intensity);
    Lines.stroke(6 * intensity);
    Lines.poly(x, y, 3, radius * 1.15, Time.time);
    Lines.poly(x, y, 3, radius * 1.15, -Time.time);
    Lines.poly(x, y, 24, radius * 1.1, 0);

    Draw.color(COLOR, intensity);
    Lines.stroke(2 * intensity);
    Lines.poly(x, y, 3, radius, Time.time);
    Lines.poly(x, y, 3, radius, -Time.time);
    Lines.poly(x, y, 24, radius, 0);

    Draw.blend();
    Draw.reset();
}

function DrawAura(x, y, radius, intensity) {
    let angle2 = Time.time;
    let angle3 = Time.time / 2;
    let x2 = x + (radius / 2) * Mathf.cosDeg(angle2);
    let y2 = y + (radius / 2) * Mathf.sinDeg(angle2);
    let x3 = x2 + (radius / 4) * Mathf.cosDeg(angle3);
    let y3 = y2 + (radius / 4) * Mathf.sinDeg(angle3);

    Draw.z(Layer.effect);
    Draw.blend(Blending.additive);

    Draw.color(COLOR_ALT, 0.3 * intensity);
    Lines.stroke(5 * intensity);
    Lines.poly(x, y, 16, radius * 1.1, 0);
    Lines.poly(x2, y2, 16, (radius / 2) * 1.15, 0);
    Draw.alpha(0.3 * intensity);
    Fill.circle(x3, y3, (radius / 4) * 1.3);

    Draw.color(COLOR, intensity);
    Lines.stroke(2 * intensity);
    Lines.poly(x, y, 16, radius, 0);
    Lines.poly(x2, y2, 16, radius / 2, 0);
    Fill.circle(x3, y3, radius / 4);
    Lines.poly(x, y, 3, radius, Time.time + 90);
    Lines.poly(x, y, 3, radius, -Time.time - 90);
    Lines.poly(x2, y2, radius / 2, Time.time);
    Lines.poly(x2, y2, radius / 2, Time.time + 180);

    Draw.blend();
    Draw.reset();
}

Events.on(ContentInitEvent, () => {
    loadWingRegions();

    const Emperical = Vars.content.block("newex-emperical") || Vars.content.block("emperical");
    if (!Emperical) return;

    Emperical.configurable = true;

    try {
        Emperical.addBar("atkSpeed", atk => new Bar(
            new Prov({
                get: function() {
                    let count = atk.getShootC != null ? atk.getShootC() : 0;
                    return "Atk Speed: +" + (count * 30) + "%";
                }
            }),
            new Prov({
                get: function() {
                    return Color.cyan;
                }
            }),
            new Floatp({
                get: function() {
                    let count = atk.getShootC != null ? atk.getShootC() : 0;
                    return count / 30;
                }
            })
        ));
    } catch(err) {}

    Emperical.config(java.lang.Integer, packCons2((tile, value) => {
        if (tile != null && typeof tile.setTier === "function") {
            tile.setTier(value);
        }
    }));

    Emperical.buildType = () => extend(ItemTurret.ItemTurretBuild, Emperical, {
        tierState: 0,
        mainReloadTimer: 0,
        mainReloadTime: 60,

        supReloadTimer: 0,
        supReloadTime: 120,

        shootCount: 0,
        shootCountTimer: 0,
        stopShootTimer: 0,

        circleIntroTimer: 0,   
        hasCreatedIntro: false,
        wasActiveLastFrame: false,

        wingAlpha: 0,
        wingProgress: 0,
        wingChargeTimer: 0,

        getTier() { return this.tierState == null ? 0 : this.tierState; },
        setTier(val) {
            this.tierState = val;
            this.shootCount = 0;
            Fx.upgradeCore.at(this.x, this.y);
        },

        range() {
            let baseRange = this.super$range();
            return (this.getTier() == 2) ? baseRange * 1.5 : baseRange;
        },

        config() {
            return java.lang.Integer(this.getTier());
        },

        buildConfiguration(table) {
            if (table == null) return;
            table.clear(); table.row();
            let tier = this.getTier();
            let vi = isVietnamese();

            if (tier == 0) {
                table.button(Icon.upOpen, Styles.cleari, 44, packRun(() => {
                    let dialogTitle = vi ? "Trung tâm nâng cấp Emperical" : "Emperical Upgrade Center";
                    let dialog = extend(BaseDialog, dialogTitle, {});
                    
                    if (dialog.cont != null) {
                        let reqCell = dialog.cont.add(new Table());
                        reqCell.get().add(new Label(packProv(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if (core == null) return vi ? "[red]Không tìm thấy Lõi Đội![]" : "[red]Team Core not found![]";
                            let currentCopper = core.items.get(Items.copper);
                            let currentLead = core.items.get(Items.lead);
                            let currentTitanium = core.items.get(Items.titanium);
                            let currentThorium = core.items.get(Items.thorium);
                            let currentSurge = core.items.get(Items.surgeAlloy);

                            let copColor1 = currentCopper >= reqEmpericalMK2.copper ? "[green]" : "[red]";
                            let leaColor1 = currentLead >= reqEmpericalMK2.lead ? "[green]" : "[red]";
                            let titColor1 = currentTitanium >= reqEmpericalMK2.titanium ? "[green]" : "[red]";
                            let thoColor1 = currentThorium >= reqEmpericalMK2.thorium ? "[green]" : "[red]";

                            let copColor2 = currentCopper >= reqEmpericalMK2B.copper ? "[green]" : "[red]";
                            let leaColor2 = currentLead >= reqEmpericalMK2B.lead ? "[green]" : "[red]";
                            let titColor2 = currentTitanium >= reqEmpericalMK2B.titanium ? "[green]" : "[red]";
                            let surColor2 = currentSurge >= reqEmpericalMK2B.surgeAlloy ? "[green]" : "[red]";

                            if (vi) {
                                return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                                       "[cyan]Nhánh Nâng Cấp MK2[]\n • Đồng: " + copColor1 + currentCopper + "[] / " + reqEmpericalMK2.copper + "\n • Chì: " + leaColor1 + currentLead + "[] / " + reqEmpericalMK2.lead + "\n • Titan: " + titColor1 + currentTitanium + "[] / " + reqEmpericalMK2.titanium + "\n • Thorium: " + thoColor1 + currentThorium + "[] / " + reqEmpericalMK2.thorium + "\n" +
                                       "[purple]Nhánh Tầm Xa MK2B[]\n • Đồng: " + copColor2 + currentCopper + "[] / " + reqEmpericalMK2B.copper + "\n • Chì: " + leaColor2 + currentLead + "[] / " + reqEmpericalMK2B.lead + "\n • Titan: " + titColor2 + currentTitanium + "[] / " + reqEmpericalMK2B.titanium + "\n • Hợp kim Surge: " + surColor2 + currentSurge + "[] / " + reqEmpericalMK2B.surgeAlloy;
                            } else {
                                return "[yellow]CORE VAULT RESOURCE REQUIREMENTS:[]\n" +
                                       "[cyan]MK2 Upgrade Path[]\n • Copper: " + copColor1 + currentCopper + "[] / " + reqEmpericalMK2.copper + "\n • Lead: " + leaColor1 + currentLead + "[] / " + reqEmpericalMK2.lead + "\n • Titanium: " + titColor1 + currentTitanium + "[] / " + reqEmpericalMK2.titanium + "\n • Thorium: " + thoColor1 + currentThorium + "[] / " + reqEmpericalMK2.thorium + "\n" +
                                       "[purple]MK2B Long-Range Path[]\n • Copper: " + copColor2 + currentCopper + "[] / " + reqEmpericalMK2B.copper + "\n • Lead: " + leaColor2 + currentLead + "[] / " + reqEmpericalMK2B.lead + "\n • Titanium: " + titColor2 + currentTitanium + "[] / " + reqEmpericalMK2B.titanium + "\n • Surge Alloy: " + surColor2 + currentSurge + "[] / " + reqEmpericalMK2B.surgeAlloy;
                            }
                        }))).growX();

                        dialog.cont.row(); dialog.cont.add().height(10).row();

                        let branchesTable = new Table();

                        let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                        b1.add("[cyan]===(MK2)===[]").row();
                        let b1Text = vi ? "[white]• Sát thương gốc: [green]+50%[]\n" +
                                           "[white]• Cơ chế đòn đánh: Bắn trúng gây thêm [yellow]1% Max HP[] của mục tiêu thành sát thương bổ sung.[]"
                                        : "[white]• Base Damage: [green]+50%[]\n" +
                                           "[white]• Attack Mechanism: Hits deal extra [yellow]1% Max HP[] of target as bonus damage.[]";
                        let b1D = b1.add(b1Text);
                        b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();

                        b1.button(vi ? "[green]KÍCH HOẠT MK2[]" : "[green]ACTIVATE MK2[]", packRun(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if (core != null && 
                                core.items.get(Items.copper) >= reqEmpericalMK2.copper && 
                                core.items.get(Items.lead) >= reqEmpericalMK2.lead && 
                                core.items.get(Items.titanium) >= reqEmpericalMK2.titanium && 
                                core.items.get(Items.thorium) >= reqEmpericalMK2.thorium) {
                                
                                core.items.remove(Items.copper, reqEmpericalMK2.copper);
                                core.items.remove(Items.lead, reqEmpericalMK2.lead);
                                core.items.remove(Items.titanium, reqEmpericalMK2.titanium);
                                core.items.remove(Items.thorium, reqEmpericalMK2.thorium);

                                Fx.upgradeCore.at(this.x, this.y); 
                                Fx.mineHuge.at(this.x, this.y); 
                                Effect.shake(5, 5, this.x, this.y);

                                this.configure(java.lang.Integer(1)); 
                                dialog.hide(); this.deselect();
                            } else {
                                if (Vars.ui != null) Vars.ui.showInfo(vi ? "[red]Không đủ tài nguyên nâng cấp MK2![]" : "[red]Not enough resources for MK2![]");
                            }
                        })).size(180, 38);

                        let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                        b2.add("[purple]===(MK2B)===[]").row();
                        let b2Text = vi ? "[white]• Sát thương gốc: [red]-20%[]\n" +
                                           "[white]• Tầm bắn: [green]+50%[] (Lifetime đạn đồng bộ tầm bắn mới)\n" +
                                           "[white]• Hiệu ứng nổ lan: Bắn trúng mục tiêu gây nổ lan [orange]500% Sát thương gốc[] trong phạm vi [yellow]50 ô (400px)[]![]"
                                        : "[white]• Base Damage: [red]-20%[]\n" +
                                           "[white]• Attack Range: [green]+50%[] (Bullet lifetime synced to new range)\n" +
                                           "[white]• Splash Blast: On-hit deals [orange]500% Base DMG[] splash blast in [yellow]50 tiles (400px)[] radius![]";
                        let b2D = b2.add(b2Text);
                        b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();

                        b2.button(vi ? "[orange]KÍCH HOẠT MK2B[]" : "[orange]ACTIVATE MK2B[]", packRun(() => {
                            let core = this.team != null ? this.team.core() : null;
                            if (core != null && 
                                core.items.get(Items.copper) >= reqEmpericalMK2B.copper && 
                                core.items.get(Items.lead) >= reqEmpericalMK2B.lead && 
                                core.items.get(Items.titanium) >= reqEmpericalMK2B.titanium && 
                                core.items.get(Items.surgeAlloy) >= reqEmpericalMK2B.surgeAlloy) {
                                
                                core.items.remove(Items.copper, reqEmpericalMK2B.copper);
                                core.items.remove(Items.lead, reqEmpericalMK2B.lead);
                                core.items.remove(Items.titanium, reqEmpericalMK2B.titanium);
                                core.items.remove(Items.surgeAlloy, reqEmpericalMK2B.surgeAlloy);

                                Fx.bigShockwave.at(this.x, this.y); 
                                Fx.mineHuge.at(this.x, this.y); 
                                Effect.shake(5, 5, this.x, this.y);

                                this.configure(java.lang.Integer(2)); 
                                dialog.hide(); this.deselect();
                            } else {
                                if (Vars.ui != null) Vars.ui.showInfo(vi ? "[red]Không đủ tài nguyên nâng cấp MK2B![]" : "[red]Not enough resources for MK2B![]");
                            }
                        })).size(180, 38);

                        branchesTable.add(b1).width(340); branchesTable.row();
                        branchesTable.add().height(12).row();
                        branchesTable.add(b2).width(340);

                        let scroll = new ScrollPane(branchesTable);
                        scroll.setScrollingDisabled(true, false);
                        dialog.cont.add(scroll).maxHeight(400);
                        dialog.addCloseButton(); dialog.show();
                    }
                })).size(44, 44).tooltip(vi ? "Nâng cấp tháp pháo" : "Upgrade turret");
            } else {
                table.button(Icon.lock, Styles.cleari, 44, packRun(() => {
                    let activeMsg = vi ? (tier == 1 ? "[cyan]ĐANG HOẠT ĐỘNG Ở CẤU HÌNH EMPERICAL MK2![]" : "[purple]ĐANG HOẠT ĐỘNG Ở CẤU HÌNH EMPERICAL MK2B![]")
                                       : (tier == 1 ? "[cyan]CURRENTLY ACTIVE IN EMPERICAL MK2![]" : "[purple]CURRENTLY ACTIVE IN EMPERICAL MK2B![]");
                    if (Vars.ui != null) Vars.ui.showInfo(activeMsg);
                })).size(44, 44).tooltip(vi ? "Cấu hình hiện tại" : "Current config");
            }

            table.button(Icon.info, Styles.cleari, 44, packRun(() => {
                let infoTitle = vi ? "Thông tin pháo Emperical" : "Emperical Turret Specs";
                let curTierStr = tier == 0 ? "[white]Gốc (Tier 1)[]" : (tier == 1 ? "[cyan]MK2[]" : "[purple]MK2B[]");
                
                let descStr = "";
                if (tier == 0) {
                    descStr = vi ? "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                                   "[lightgray]Giới hạn xây dựng:[] [red]1 Pháo / Phe (Duy nhất)[]\n" +
                                   "[lightgray]Cấu hình hiện tại:[] " + curTierStr + "\n" +
                                   "[lightgray]Tầm bắn gốc:[] [orange]360 pixel[]\n" +
                                   "[lightgray]Gia tốc bắn tối đa:[] [cyan]+900% (30 cộng dồn)[]\n\n" +
                                   "[cyan]⚡ CƠ CHẾ KĨ NĂNG:[]\n" +
                                   "• Hỏa lực hỗn hợp: Khai hỏa đạn năng lượng, tên lửa, móc kéo, sấm sét và Laser áp chế.\n" +
                                   "• Sát thương % HP: [yellow]50% tỉ lệ mỗi viên đạn bắn ra sẽ gây thêm 5% Max HP[] trực tiếp vào mục tiêu!\n" +
                                   "• Hồi phục bản thân & Sóng xung kích triệt tiêu đạn địch."
                                 : "[gold]⚡ BASE SPECS (MK1) ⚡[]\n" +
                                   "[lightgray]Build Limit:[] [red]1 Turret / Team (Unique)[]\n" +
                                   "[lightgray]Current Config:[] " + curTierStr + "\n" +
                                   "[lightgray]Base Range:[] [orange]360 pixels[]\n" +
                                   "[lightgray]Max Speed Accelerate:[] [cyan]+900% (30 stacks)[]\n\n" +
                                   "[cyan]⚡ SPECIAL MECHANICS:[]\n" +
                                   "• Mixed Salvo: Fires Orbs, Missiles, Hooks, Lightning, and Oppressive Lasers.\n" +
                                   "• % Max HP Damage: [yellow]50% chance for each bullet hit to deal 5% Max HP[] bonus damage!\n" +
                                   "• Self-Healing & Bullet-Canceling Shockwaves.";
                } else if (tier == 1) {
                    descStr = vi ? "[cyan]⚡ CẤU HÌNH CẢI TIẾN MK2 ⚡[]\n" +
                                   "[lightgray]Giới hạn xây dựng:[] [red]1 Pháo / Phe (Duy nhất)[]\n" +
                                   "[lightgray]Cấu hình hiện tại:[] " + curTierStr + "\n" +
                                   "[lightgray]Sát thương tổng:[] [green]+50%[]\n" +
                                   "[lightgray]Tầm bắn:[] [orange]360 pixel[]\n\n" +
                                   "[cyan]⚡ CƠ CHẾ ĐẶC BIỆT MK2:[]\n" +
                                   "• Bắn trúng gây thêm [yellow]1% Max HP[] cố định + [yellow]50% tỉ lệ gây 5% Max HP[] trực tiếp.\n" +
                                   "• Giữ nguyên cơ chế sóng xung kích triệt tiêu đạn."
                                 : "[cyan]⚡ ENHANCED SPECS MK2 ⚡[]\n" +
                                   "[lightgray]Build Limit:[] [red]1 Turret / Team (Unique)[]\n" +
                                   "[lightgray]Current Config:[] " + curTierStr + "\n" +
                                   "[lightgray]Overall Damage:[] [green]+50%[]\n" +
                                   "[lightgray]Effective Range:[] [orange]360 pixels[]\n\n" +
                                   "[cyan]⚡ MK2 SPECIAL MECHANICS:[]\n" +
                                   "• On-hit deals extra [yellow]1% Max HP[] fixed + [yellow]50% chance to deal 5% Max HP[] bonus damage.\n" +
                                   "• Retains bullet-canceling shockwaves.";
                } else if (tier == 2) {
                    descStr = vi ? "[purple]⚡ CẤU HÌNH TẦM XA MK2B ⚡[]\n" +
                                   "[lightgray]Giới hạn xây dựng:[] [red]1 Pháo / Phe (Duy nhất)[]\n" +
                                   "[lightgray]Cấu hình hiện tại:[] " + curTierStr + "\n" +
                                   "[lightgray]Sát thương gốc:[] [red]-20%[]\n" +
                                   "[lightgray]Tầm bắn hiệu dụng:[] [green]540 pixel (+50%)[]\n\n" +
                                   "[purple]🔥 CƠ CHẾ ĐẶC BIỆT MK2B:[]\n" +
                                   "• Siêu bão nổ lan: Đạn đánh trúng gây [orange]500% Sát thương gốc[] trong phạm vi rộng [yellow]50 ô (400px)[]!\n" +
                                   "• Giữ nguyên cơ chế [yellow]50% tỉ lệ gây thêm 5% Max HP[] khi bắn trúng."
                                 : "[purple]⚡ LONG-RANGE SPECS MK2B ⚡[]\n" +
                                   "[lightgray]Build Limit:[] [red]1 Turret / Team (Unique)[]\n" +
                                   "[lightgray]Base Damage:[] [red]-20%[]\n" +
                                   "[lightgray]Effective Range:[] [green]540 pixels (+50%)[]\n\n" +
                                   "[purple]🔥 MK2B SPECIAL MECHANICS:[]\n" +
                                   "• Massive Splash Blast: On-hit triggers [orange]500% Base DMG[] splash blast in [yellow]50 tiles (400px)[] radius!\n" +
                                   "• Retains [yellow]50% chance to deal 5% Max HP[] bonus damage.";
                }

                if (Vars.ui == null) return;
                let infoDialog = extend(BaseDialog, infoTitle, {});
                let infoTable = new Table();
                let cell = infoTable.add(descStr).width(360);
                cell.get().setWrap(true); cell.get().setAlignment(Align.left);
                
                let scroll = new ScrollPane(infoTable);
                scroll.setScrollingDisabled(true, false);
                infoDialog.cont.add(scroll).maxHeight(400);
                infoDialog.addCloseButton();
                infoDialog.show();
            })).size(44, 44).tooltip(vi ? "Thông tin pháo" : "Turret Info");
        },

        shootPos(bulletType, x, y, rot) {
            let tier = this.getTier();
            let bullet = bulletType.create(this, this.team, x, y, rot);
            if (!bullet) return;

            let dmgMult = (tier == 1) ? 1.5 : ((tier == 2) ? 0.8 : 1.0);
            bullet.damage = bulletType.damage * dmgMult;

            if (tier == 2) {
                bullet.lifetime = bulletType.lifetime * 1.5;
            }
        },

        getShootC() {
            return this.shootCount;
        },

        force(x, y, radius) {
            ForceEffect.at(x, y);
            if (Sounds.explosionReactor2) Sounds.explosionReactor2.at(x, y, 0.75, 1);
            let radSq = radius * radius;
            
            Groups.bullet.intersect(x - radius, y - radius, radius * 2, radius * 2, cons(b => {
                if (b.team != this.team && Mathf.len2(b.x - x, b.y - y) <= radSq) {
                    b.remove();
                }
            }));
        },

        shootSalvo(sx, sy, soundPitch) {
            if (Sounds.shootSmite) Sounds.shootSmite.at(sx, sy, soundPitch, 1);
            this.shootPos(EmpericalBullet, sx, sy, Mathf.random(this.rotation - 45, this.rotation + 45));
            this.shootPos(EmpericalLightning, sx, sy, this.rotation);
            
            if (Mathf.chance(0.5)) this.shootPos(EmpericalHook, sx, sy, Mathf.random(this.rotation - 45, this.rotation + 45));
            if (Mathf.chance(0.6)) this.shootPos(EmpericalMissile, sx, sy, Mathf.random(this.rotation - 45, this.rotation + 45));
            if (Mathf.chance(0.15)) {
                this.shootPos(EmpericalLaser, sx, sy, this.rotation);
                if (Sounds.shootForeshadow) Sounds.shootForeshadow.at(sx, sy, soundPitch, 1);
            }
        },

        updateTile() {
            this.super$updateTile();

            let isActiveNow = (this.shootCount > 0);

            if (isActiveNow) {
                this.wingAlpha = Mathf.approachDelta(this.wingAlpha, 1.0, 0.05);
                this.wingProgress = Mathf.approachDelta(this.wingProgress, 1.0, 0.06);

                if (this.wingProgress > 0.8) {
                    this.wingChargeTimer += Time.delta;
                    if (this.wingChargeTimer >= 60) {
                        this.wingChargeTimer = 0;

                        let targetForward = 40 - 22;
                        let targetSide = 40;

                        let wing2X = this.x + Angles.trnsx(this.rotation, targetForward, targetSide);
                        let wing2Y = this.y + Angles.trnsy(this.rotation, targetForward, targetSide);

                        let wing1X = this.x + Angles.trnsx(this.rotation, targetForward, -targetSide);
                        let wing1Y = this.y + Angles.trnsy(this.rotation, targetForward, -targetSide);

                        WingChargeLaserEffect.at(this.x, this.y, 0, new Vec2(wing2X, wing2Y));
                        WingChargeLaserEffect.at(this.x, this.y, 0, new Vec2(wing1X, wing1Y));
                    }
                }
            } else {
                this.wingAlpha = Mathf.approachDelta(this.wingAlpha, 0.0, 0.05);
                this.wingProgress = Mathf.approachDelta(this.wingProgress, 0.0, 0.08);
                this.wingChargeTimer = 0;
            }

            if (isActiveNow && !this.wasActiveLastFrame) {
                this.circleIntroTimer = 12;
                this.hasCreatedIntro = false;
            } else if (!isActiveNow && this.wasActiveLastFrame) {
                let ex1 = this.x + Angles.trnsx(this.rotation, 40, 0);
                let ey1 = this.y + Angles.trnsy(this.rotation, 40, 0);
                let ex2 = this.x + Angles.trnsx(this.rotation, 40, 40);
                let ey2 = this.y + Angles.trnsy(this.rotation, 40, 40);
                let ex3 = this.x + Angles.trnsx(this.rotation, 40, -40);
                let ey3 = this.y + Angles.trnsy(this.rotation, 40, -40);

                CircleDisperseEffect.at(ex1, ey1);
                CircleDisperseEffect.at(ex2, ey2);
                CircleDisperseEffect.at(ex3, ey3);
            }

            if (this.circleIntroTimer > 0) {
                this.circleIntroTimer -= Time.delta;
                let ex1 = this.x + Angles.trnsx(this.rotation, 40, 0);
                let ey1 = this.y + Angles.trnsy(this.rotation, 40, 0);
                let ex2 = this.x + Angles.trnsx(this.rotation, 40, 40);
                let ey2 = this.y + Angles.trnsy(this.rotation, 40, 40);
                let ex3 = this.x + Angles.trnsx(this.rotation, 40, -40);
                let ey3 = this.y + Angles.trnsy(this.rotation, 40, -40);

                if (!this.hasCreatedIntro) {
                    CircleGatherEffect.at(ex1, ey1);
                    CircleGatherEffect.at(ex2, ey2);
                    CircleGatherEffect.at(ex3, ey3);
                    this.hasCreatedIntro = true;
                }
            }

            this.wasActiveLastFrame = isActiveNow;

            if (this.isShooting && this.hasAmmo()) {
                let speedFactor = 1.0 / (1.0 + (this.shootCount * 0.3));
                
                if (this.mainReloadTimer >= this.mainReloadTime * speedFactor) {
                    this.mainReloadTimer = 0;
                    if (this.shootCount < 30) this.shootCount++;

                    let shootx = this.x + Angles.trnsx(this.rotation, 40, 0);
                    let shooty = this.y + Angles.trnsy(this.rotation, 40, 0);

                    this.shootSalvo(shootx, shooty, Mathf.random(0.9, 1.1));
                    if (Mathf.chance(0.03)) this.force(this.x, this.y, 160);
                } else {
                    this.mainReloadTimer += Time.delta;
                }

                if (this.supReloadTimer >= this.supReloadTime * speedFactor) {
                    this.supReloadTimer = 0;

                    let shootx1 = this.x + Angles.trnsx(this.rotation, 40, 40);
                    let shooty1 = this.y + Angles.trnsy(this.rotation, 40, 40);
                    let shootx2 = this.x + Angles.trnsx(this.rotation, 40, -40);
                    let shooty2 = this.y + Angles.trnsy(this.rotation, 40, -40);

                    this.shootSalvo(shootx1, shooty1, 0.5);
                    if (Mathf.chance(0.03)) this.force(this.x, this.y, 80);

                    this.shootSalvo(shootx2, shooty2, 0.5);
                    if (Mathf.chance(0.03)) this.force(this.x, this.y, 80);
                } else {
                    this.supReloadTimer += Time.delta;
                }
            } else {
                this.mainReloadTimer = 0;
                this.supReloadTimer = 0;

                if (this.shootCount > 0) {
                    if (this.stopShootTimer >= 120) {
                        if (this.shootCountTimer >= 6) {
                            this.shootCount--;
                            this.shootCountTimer = 0;
                        } else {
                            this.shootCountTimer += Time.delta;
                        }
                    } else {
                        this.stopShootTimer += Time.delta;
                    }
                }
            }

            if (this.isShooting && this.hasAmmo()) this.stopShootTimer = 0;
        },

        draw() {
            this.super$draw();

            if (this.wingAlpha > 0.01) {
                loadWingRegions();

                let prog = Interp.pow2Out.apply(this.wingProgress);
                
                let targetForward = 40 - 22;
                let targetSide = 40;

                let curForward = targetForward * prog;
                let curSide = targetSide * prog;

                let ex2 = this.x + Angles.trnsx(this.rotation, curForward, curSide);
                let ey2 = this.y + Angles.trnsy(this.rotation, curForward, curSide);

                let ex3 = this.x + Angles.trnsx(this.rotation, curForward, -curSide);
                let ey3 = this.y + Angles.trnsy(this.rotation, curForward, -curSide);

                Draw.z(Layer.turret + 0.01);
                Draw.color(WHITE);
                Draw.alpha(this.wingAlpha);

                if (wing2Region && wing2Region.found()) {
                    Draw.rect(wing2Region, ex2, ey2, this.rotation - 90);
                }
                if (wing1Region && wing1Region.found()) {
                    Draw.rect(wing1Region, ex3, ey3, this.rotation - 90);
                }

                Draw.reset();
            }

            if (this.shootCount > 0 && this.wingProgress > 0.3) {
                let introFactor = (this.circleIntroTimer > 0) ? Math.max(0, 1.0 - (this.circleIntroTimer / 12)) : 1.0;
                let intensity = (Mathf.clamp(this.shootCount, 0, 10) / 10) * introFactor * Math.min(1.0, (this.wingProgress - 0.3) / 0.7);

                let ex1 = this.x + Angles.trnsx(this.rotation, 40, 0);
                let ey1 = this.y + Angles.trnsy(this.rotation, 40, 0);

                let ex2 = this.x + Angles.trnsx(this.rotation, 40, 40);
                let ey2 = this.y + Angles.trnsy(this.rotation, 40, 40);

                let ex3 = this.x + Angles.trnsx(this.rotation, 40, -40);
                let ey3 = this.y + Angles.trnsy(this.rotation, 40, -40);

                let ex4 = this.x + Angles.trnsx(this.rotation, -60, 0);
                let ey4 = this.y + Angles.trnsy(this.rotation, -60, 0);

                DrawMagicCircle(ex1, ey1, 16, intensity);
                DrawMagicCircle(ex2, ey2, 12, intensity);
                DrawMagicCircle(ex3, ey3, 12, intensity);
                DrawAura(ex4, ey4, 30, intensity);
            }
        },

        write(write) {
            this.super$write(write);
            write.i(this.getTier());
            write.f(this.mainReloadTimer);
            write.f(this.supReloadTimer);
            write.i(this.shootCount);
            write.f(this.stopShootTimer);
        },

        read(read, revision) {
            this.super$read(read, revision);
            this.tierState = read.i();
            this.mainReloadTimer = read.f();
            this.supReloadTimer = read.f();
            this.shootCount = read.i();
            this.stopShootTimer = read.f();
        }
    });
});