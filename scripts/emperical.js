const COLOR = Color.valueOf("ffff00"); // Vàng chói
const COLOR_ALT = Color.valueOf("e6005c"); // Hồng đỏ đậm
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
const reqEmpericalMK2B = { copper: 8000, lead: 8000, titanium: 4000, surgethorium: 1500 };

///// CUSTOM EFFECTS /////

// Hiệu ứng hạt tụ hội vào tâm (0.2s = 12 ticks)
const CircleGatherEffect = new Effect(12, e => {
    Draw.z(Layer.effect);
    Draw.color(COLOR, COLOR_ALT, e.fin());
    
    for (let i = 0; i < 4; i++) {
        let angle = e.id * 90 + i * 90 + e.fin() * 180;
        let dist = 25 * e.fout(); // Bay từ ngoài vào trong
        let px = e.x + Angles.trnsx(angle, dist);
        let py = e.y + Angles.trnsy(angle, dist);
        Fill.circle(px, py, 2 * e.fin());
    }
});

// Hiệu ứng hạt nổ phân tán ra xung quanh khi vòng ma pháp biến mất
const CircleDisperseEffect = new Effect(15, e => {
    Draw.z(Layer.effect);
    Draw.color(COLOR_ALT, COLOR, e.fin());
    
    for (let i = 0; i < 6; i++) {
        let angle = e.id * 60 + i * 60;
        let dist = 30 * e.finpow(); // Bay tỏa ra ngoài
        let px = e.x + Angles.trnsx(angle, dist);
        let py = e.y + Angles.trnsy(angle, dist);
        Fill.circle(px, py, 2.5 * e.fout());
    }
});

// Hiệu ứng laser trời giội xuống mục tiêu khi bị đánh trúng
const SkyLaserStrikeEffect = new Effect(25, e => {
    Draw.z(Layer.effect + 1);
    Draw.blend(Blending.additive);

    // Kéo nghiêng sang bên trái (startX = e.x - 400, startY = e.y + 1200)
    let startX = e.x - 400;
    let startY = e.y + 1200;

    Draw.color(COLOR_ALT, 0.6 * e.fout());
    Lines.stroke(10 * e.fout());
    Lines.line(startX, startY, e.x, e.y);

    Draw.color(COLOR, 0.85 * e.fout());
    Lines.stroke(5 * e.fout());
    Lines.line(startX, startY, e.x, e.y);

    Draw.color(WHITE, 1.0 * e.fout());
    Lines.stroke(2.0 * e.fout());
    Lines.line(startX, startY, e.x, e.y);

    Fill.circle(e.x, e.y, 10 * e.fout());

    Draw.blend();
    Draw.reset();
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

///// STATUS EFFECTS /////

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

///// HELPER FUNCTIONS /////

// Hàm lấy Máu Tối Đa an toàn từ Unit hoặc Building
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

// Hàm gây sát thương an toàn lên Entity
function applyDamage(entity, amount) {
    if (!entity || amount <= 0) return;
    if (typeof entity.damage === "function") {
        entity.damage(amount);
    } else if (entity.build && typeof entity.build.damage === "function") {
        entity.build.damage(amount);
    }
}

///// HANDLER VA CHẠM /////

function handleCustomHit(bullet, other, hitX, hitY) {
    if (!bullet || !bullet.owner) return;

    let turret = bullet.owner;
    let targetX = hitX !== undefined ? hitX : (other ? other.x : bullet.x);
    let targetY = hitY !== undefined ? hitY : (other ? other.y : bullet.y);

    let maxHp = getMaxHealth(other);

    // 1. CƠ CHẾ SUPERCHARGED: Laser Trời giội xuống mục tiêu (1% max HP + 500 dmg)
    let isCharged = turret.isSuperCharged || (turret.shootCount !== undefined && turret.shootCount >= 30);
    if (isCharged) {
        let skyStrikeDmg = 500 + (maxHp * 0.01);
        if (other) applyDamage(other, skyStrikeDmg);
        SkyLaserStrikeEffect.at(targetX, targetY);
    }

    // 2. CƠ CHẾ TIER 1 (MK2): Gây thêm 1% max HP
    if (turret.getTier && turret.getTier() == 1 && maxHp > 0 && other) {
        applyDamage(other, maxHp * 0.01);
    }

    // 3. CƠ CHẾ TIER 2 (MK2B): Bão nổ lan rộng
    if (turret.getTier && turret.getTier() == 2) {
        let splashDmg = bullet.damage * 5.0;
        let splashRadius = 50 * 8;
        Damage.damage(bullet.team, targetX, targetY, splashRadius, splashDmg);
        EmpericalExplosionEffect.at(targetX, targetY);
    }
}

///// BULLET TYPES /////

const EmpericalBullet_Frag = extend(BasicBulletType, {
    damage: 0,
    speed: 1,
    lifetime: 14.4,
    width: 0,
    height: 0,
    lightning: 3,
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
    trailInterval: 2,
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
    lightning: 5,
    lightningDamage: 95,
    lightningLength: 10,
    lightningColor: COLOR,
    pierce: true,
    pierceCap: 1,
    fragBullets: 3,
    fragBullet: EmpericalBullet_Frag,
    bulletInterval: 1,
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
    trailInterval: 2,
    frontColor: COLOR,
    backColor: COLOR_ALT,
    trailColor: COLOR_ALT,
    homingPower: 1,
    homingRange: 180,
    lightning: 4,
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
    trailInterval: 1,
    frontColor: WHITE,
    backColor: COLOR_ALT,
    trailColor: COLOR,
    homingPower: 1,
    homingRange: 90,
    lightning: 4,
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
        this.super$hitTile(b, tile, health);
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
        this.super$hitTile(b, tile, health);
        let target = (tile && tile.build) ? tile.build : tile;
        if (target) handleCustomHit(b, target, target.x, target.y);
    }
});

///// DRAWING UTILITIES /////

function DrawChargingSkyBeam(x, y, shootCount) {
    Draw.z(Layer.effect + 1);
    Draw.blend(Blending.additive);

    let progress = Math.min(shootCount / 30, 1.0);
    // Lệch điểm bắt đầu trên trời sang bên trái mạnh hơn (x - 800)
    let startX = x - 800;
    let startY = y + 1600;

    let beamWidth = ((2 + progress * 18) + Mathf.absin(Time.time, 3, 2)) * 0.20;

    Draw.color(COLOR_ALT, 0.3 * progress);
    Lines.stroke(beamWidth * 1.5);
    Lines.line(startX, startY, x, y);

    Draw.color(COLOR, 0.7 * progress);
    Lines.stroke(beamWidth);
    Lines.line(startX, startY, x, y);

    Draw.color(WHITE, 0.9 * progress);
    Lines.stroke(beamWidth * 0.3);
    Lines.line(startX, startY, x, y);

    Draw.color(COLOR, 0.8 * progress);
    Fill.circle(x, y, (3 + progress * 12) * 0.2);

    Draw.blend();
    Draw.reset();
}

function DrawSuperSkyBeam(x, y, animProgress, fadeProgress) {
    Draw.z(Layer.effect + 1);
    Draw.blend(Blending.additive);

    // Nghiêng hẳn sang bên trái (x - 800) và cao vượt màn hình (y + 1600)
    let startX = x - 800;
    let startY = y + 1600;

    let currentTargetX = Mathf.lerp(x - 25, x, animProgress);
    let currentTargetY = Mathf.lerp(y + 75, y, animProgress);

    let baseWidth = ((40 + animProgress * 30) + Mathf.absin(Time.time, 4, 8)) * 0.20;
    let beamWidth = baseWidth * fadeProgress;
    let alpha = fadeProgress;

    Draw.color(COLOR_ALT, 0.5 * alpha);
    Lines.stroke(beamWidth * 1.6);
    Lines.line(startX, startY, currentTargetX, currentTargetY);

    Draw.color(COLOR, 0.85 * alpha);
    Lines.stroke(beamWidth);
    Lines.line(startX, startY, currentTargetX, currentTargetY);

    Draw.color(WHITE, 1.0 * alpha);
    Lines.stroke(beamWidth * 0.4);
    Lines.line(startX, startY, currentTargetX, currentTargetY);

    if (animProgress > 0) {
        Draw.color(COLOR_ALT, 0.7 * alpha);
        Fill.circle(currentTargetX, currentTargetY, (5 + 7.5 * animProgress) * fadeProgress * 0.8);
        Draw.color(COLOR, 0.9 * alpha);
        Fill.circle(currentTargetX, currentTargetY, (2.5 + 5 * animProgress) * fadeProgress * 0.8);
        Draw.color(WHITE, 1.0 * alpha);
        Fill.circle(currentTargetX, currentTargetY, (1.25 + 2.5 * animProgress) * fadeProgress * 0.8);
    }

    Draw.blend();
    Draw.reset();
}

function DrawMagicCircle(x, y, radius, intensity) {
    Draw.z(Layer.effect);
    Draw.blend(Blending.additive);

    Draw.color(COLOR_ALT, 0.35 * intensity);
    Lines.stroke(6 * intensity);
    Lines.poly(x, y, 3, radius * 1.15, Time.time);
    Lines.poly(x, y, 3, radius * 1.15, -Time.time);
    Lines.poly(x, y, 360, radius * 1.1, 0);

    Draw.color(COLOR, intensity);
    Lines.stroke(2 * intensity);
    Lines.poly(x, y, 3, radius, Time.time);
    Lines.poly(x, y, 3, radius, -Time.time);
    Lines.poly(x, y, 360, radius, 0);

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
    Lines.poly(x, y, 180, radius * 1.1, 0);
    Lines.poly(x2, y2, 180, (radius / 2) * 1.15, 0);
    Draw.alpha(0.3 * intensity);
    Fill.circle(x3, y3, (radius / 4) * 1.3);

    Draw.color(COLOR, intensity);
    Lines.stroke(2 * intensity);
    Lines.poly(x, y, 180, radius, 0);
    Lines.poly(x2, y2, 180, radius / 2, 0);
    Fill.circle(x3, y3, radius / 4);
    Lines.poly(x, y, 3, radius, Time.time + 90);
    Lines.poly(x, y, 3, radius, -Time.time - 90);
    Lines.poly(x2, y2, radius / 2, Time.time);
    Lines.poly(x2, y2, radius / 2, Time.time + 180);

    Draw.blend();
    Draw.reset();
}

///// MAIN BLOCK LOGIC /////

Events.on(ContentInitEvent, () => {
    const Emperical = Vars.content.block("newex-emperical");
    if (!Emperical) return;

    Emperical.configurable = true;
    Emperical.logicConfigurable = true;

    Emperical.addBar("atkSpeed", atk => new Bar(
        new Prov({
            get: function() {
                let count = atk.getShootC();
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
                let count = atk.getShootC();
                return count / 30;
            }
        })
    ));

    Emperical.config(java.lang.Integer, packCons2((tile, value) => {
        if (tile != null && typeof tile.setTier === "function") tile.setTier(value);
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

        beamTimer: 0,          
        beamFadeTimer: 0,      
        isSuperCharged: false,

        circleIntroTimer: 0,   
        hasCreatedIntro: false,
        wasActiveLastFrame: false,

        getTier() { return this.tierState == null ? 0 : this.tierState; },
        setTier(val) {
            this.tierState = val;
            this.shootCount = 0;
            this.beamTimer = 0;
            this.beamFadeTimer = 0;
            this.isSuperCharged = false;
        },

        range() {
            let baseRange = this.super$range();
            return (this.getTier() == 2) ? baseRange * 1.5 : baseRange;
        },

        config() {
            return java.lang.Integer.valueOf(this.getTier());
        },

        buildConfiguration(table) {
            table.clear();
            let tier = this.getTier();
            let vi = isVietnamese();

            if (tier == 0) {
                table.button(Icon.upOpen, Styles.cleari, 44, packRun(() => {
                    let dialogTitle = vi ? "Trung tâm nâng cấp Emperical" : "Emperical Upgrade Center";
                    let dialog = extend(BaseDialog, dialogTitle, {});
                    let reqCell = dialog.cont.label(packProv(() => {
                        let core = this.team.core();
                        if (core == null) return vi ? "[red]Không tìm thấy Lõi Đội![]" : "[red]Team Core not found![]";
                        let currentCopper = core.items.get(Items.copper);
                        let currentLead = core.items.get(Items.lead);
                        let currentTitanium = core.items.get(Items.titanium);
                        let currentThorium = core.items.get(Items.thorium);
                        let currentSurge = core.items.get(Items.surgeAlloy || Items.silicon);

                        let copColor1 = currentCopper >= reqEmpericalMK2.copper ? "[green]" : "[red]";
                        let leaColor1 = currentLead >= reqEmpericalMK2.lead ? "[green]" : "[red]";
                        let titColor1 = currentTitanium >= reqEmpericalMK2.titanium ? "[green]" : "[red]";
                        let thoColor1 = currentThorium >= reqEmpericalMK2.thorium ? "[green]" : "[red]";

                        let copColor2 = currentCopper >= reqEmpericalMK2B.copper ? "[green]" : "[red]";
                        let leaColor2 = currentLead >= reqEmpericalMK2B.lead ? "[green]" : "[red]";
                        let titColor2 = currentTitanium >= reqEmpericalMK2B.titanium ? "[green]" : "[red]";
                        let surColor2 = currentSurge >= reqEmpericalMK2B.surgethorium ? "[green]" : "[red]";

                        if (vi) {
                            return "[yellow]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                                   "[cyan]Nhánh Nâng Cấp MK2[]\n • Đồng: " + copColor1 + currentCopper + "[] / " + reqEmpericalMK2.copper + "\n • Chì: " + leaColor1 + currentLead + "[] / " + reqEmpericalMK2.lead + "\n • Titan: " + titColor1 + currentTitanium + "[] / " + reqEmpericalMK2.titanium + "\n • Thorium: " + thoColor1 + currentThorium + "[] / " + reqEmpericalMK2.thorium + "\n" +
                                   "[purple]Nhánh Tầm Xa MK2B[]\n • Đồng: " + copColor2 + currentCopper + "[] / " + reqEmpericalMK2B.copper + "\n • Chì: " + leaColor2 + currentLead + "[] / " + reqEmpericalMK2B.lead + "\n • Titan: " + titColor2 + currentTitanium + "[] / " + reqEmpericalMK2B.titanium + "\n • Hợp kim Surge: " + surColor2 + currentSurge + "[] / " + reqEmpericalMK2B.surgethorium;
                        } else {
                            return "[yellow]CORE VAULT RESOURCE REQUIREMENTS:[]\n" +
                                   "[cyan]MK2 Upgrade Path[]\n • Copper: " + copColor1 + currentCopper + "[] / " + reqEmpericalMK2.copper + "\n • Lead: " + leaColor1 + currentLead + "[] / " + reqEmpericalMK2.lead + "\n • Titanium: " + titColor1 + currentTitanium + "[] / " + reqEmpericalMK2.titanium + "\n • Thorium: " + thoColor1 + currentThorium + "[] / " + reqEmpericalMK2.thorium + "\n" +
                                   "[purple]MK2B Long-Range Path[]\n • Copper: " + copColor2 + currentCopper + "[] / " + reqEmpericalMK2B.copper + "\n • Lead: " + leaColor2 + currentLead + "[] / " + reqEmpericalMK2B.lead + "\n • Titanium: " + titColor2 + currentTitanium + "[] / " + reqEmpericalMK2B.titanium + "\n • Surge Alloy: " + surColor2 + currentSurge + "[] / " + reqEmpericalMK2B.surgethorium;
                        }
                    }));

                    reqCell.width(360).get().setWrap(true);
                    reqCell.get().setAlignment(Align.left);
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
                        let core = this.team.core();
                        if (core != null && core.items.get(Items.copper) >= reqEmpericalMK2.copper && core.items.get(Items.lead) >= reqEmpericalMK2.lead && core.items.get(Items.titanium) >= reqEmpericalMK2.titanium && core.items.get(Items.thorium) >= reqEmpericalMK2.thorium) {
                            core.items.remove(Items.copper, reqEmpericalMK2.copper); core.items.remove(Items.lead, reqEmpericalMK2.lead); core.items.remove(Items.titanium, reqEmpericalMK2.titanium); core.items.remove(Items.thorium, reqEmpericalMK2.thorium);
                            Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                            this.configure(java.lang.Integer.valueOf(1)); dialog.hide(); this.deselect();
                        } else {
                            Vars.ui.showInfo(vi ? "[red]Không đủ tài nguyên nâng cấp MK2![]" : "[red]Not enough resources for MK2![]");
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
                        let core = this.team.core();
                        let surge = Items.surgeAlloy || Items.silicon;
                        if (core != null && core.items.get(Items.copper) >= reqEmpericalMK2B.copper && core.items.get(Items.lead) >= reqEmpericalMK2B.lead && core.items.get(Items.titanium) >= reqEmpericalMK2B.titanium && core.items.get(surge) >= reqEmpericalMK2B.surgethorium) {
                            core.items.remove(Items.copper, reqEmpericalMK2B.copper); core.items.remove(Items.lead, reqEmpericalMK2B.lead); core.items.remove(Items.titanium, reqEmpericalMK2B.titanium); core.items.remove(surge, reqEmpericalMK2B.surgethorium);
                            Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                            this.configure(java.lang.Integer.valueOf(2)); dialog.hide(); this.deselect();
                        } else {
                            Vars.ui.showInfo(vi ? "[red]Không đủ tài nguyên nâng cấp MK2B![]" : "[red]Not enough resources for MK2B![]");
                        }
                    })).size(180, 38);

                    branchesTable.add(b1).width(340); branchesTable.row();
                    branchesTable.add().height(12).row();
                    branchesTable.add(b2).width(340);

                    let scroll = new ScrollPane(branchesTable);
                    scroll.setScrollingDisabled(true, false);
                    dialog.cont.add(scroll).maxHeight(400);
                    dialog.addCloseButton(); dialog.show();
                })).size(44, 44).tooltip(vi ? "Nâng cấp tháp pháo" : "Upgrade turret");
            } else {
                table.button(Icon.lock, Styles.cleari, 44, packRun(() => {
                    let activeMsg = vi ? (tier == 1 ? "[cyan]ĐANG HOẠT ĐỘNG Ở CẤU HÌNH EMPERICAL MK2![]" : "[purple]ĐANG HOẠT ĐỘNG Ở CẤU HÌNH EMPERICAL MK2B![]")
                                       : (tier == 1 ? "[cyan]CURRENTLY ACTIVE IN EMPERICAL MK2![]" : "[purple]CURRENTLY ACTIVE IN EMPERICAL MK2B![]");
                    Vars.ui.showInfo(activeMsg);
                })).size(44, 44).tooltip(vi ? "Cấu hình hiện tại" : "Current config");
            }

            table.button(Icon.info, Styles.cleari, 44, packRun(() => {
                let infoTitle = vi ? "Thông tin pháo Emperical" : "Emperical Turret Specs";
                let curTierStr = tier == 0 ? "[white]Gốc (Tier 1)[]" : (tier == 1 ? "[cyan]MK2[]" : "[purple]MK2B[]");
                
                let descStr = "";
                if (tier == 0) {
                    descStr = vi ? "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n" +
                                   "[lightgray]Cấu hình hiện tại:[] " + curTierStr + "\n" +
                                   "[lightgray]Tầm bắn gốc:[] [orange]360 pixel[]\n" +
                                   "[lightgray]Gia tốc bắn tối đa:[] [cyan]+900% (30 cộng dồn)[]\n\n" +
                                   "[cyan]⚡ CƠ CHẾ KỸ NĂNG:[]\n" +
                                   "• Hỏa lực hỗn hợp: Khai hỏa đạn năng lượng, tên lửa, móc kéo, sấm sét và Laser áp chế.\n" +
                                   "• Laser Giội Mục Tiêu: Khi pháo được Laser Trời chiếu vào, mọi đạn đánh trúng kẻ địch sẽ gọi 1 Laser Trời chiếu xún gây [yellow]1% Max HP + 500 Sát thương[]!\n" +
                                   "• Hồi phục bản thân & Sóng xung kích triệt tiêu đạn địch."
                                 : "[gold]⚡ BASE SPECS (MK1) ⚡[]\n" +
                                   "[lightgray]Current Config:[] " + curTierStr + "\n" +
                                   "[lightgray]Base Range:[] [orange]360 pixels[]\n" +
                                   "[lightgray]Max Speed Accelerate:[] [cyan]+900% (30 stacks)[]\n\n" +
                                   "[cyan]⚡ SPECIAL MECHANICS:[]\n" +
                                   "• Mixed Salvo: Fires Orbs, Missiles, Hooks, Lightning, and Oppressive Lasers.\n" +
                                   "• Target Sky Strike: When Supercharged, hits trigger Sky Laser dealing [yellow]1% Max HP + 500 DMG[]!\n" +
                                   "• Self-Healing & Bullet-Canceling Shockwaves.";
                } else if (tier == 1) {
                    descStr = vi ? "[cyan]⚡ CẤU HÌNH CẢI TIẾN MK2 ⚡[]\n" +
                                   "[lightgray]Cấu hình hiện tại:[] " + curTierStr + "\n" +
                                   "[lightgray]Sát thương tổng:[] [green]+50%[]\n" +
                                   "[lightgray]Tầm bắn:[] [orange]360 pixel[]\n\n" +
                                   "[cyan]⚡ CƠ CHẾ ĐẶC BIỆT MK2:[]\n" +
                                   "• Bắn trúng gây thêm [yellow]1% Max HP[] của mục tiêu thành sát thương trực tiếp.\n" +
                                   "• Giữ nguyên cơ chế Laser Giội Mục Tiêu và sóng xung kích triệt tiêu đạn."
                                 : "[cyan]⚡ ENHANCED SPECS MK2 ⚡[]\n" +
                                   "[lightgray]Current Config:[] " + curTierStr + "\n" +
                                   "[lightgray]Overall Damage:[] [green]+50%[]\n" +
                                   "[lightgray]Effective Range:[] [orange]360 pixels[]\n\n" +
                                   "[cyan]⚡ MK2 SPECIAL MECHANICS:[]\n" +
                                   "• On-hit deals extra [yellow]1% Max HP[] bonus damage to target.\n" +
                                   "• Retains Target Sky Strike and bullet-canceling shockwaves.";
                } else if (tier == 2) {
                    descStr = vi ? "[purple]⚡ CẤU HÌNH TẦM XA MK2B ⚡[]\n" +
                                   "[lightgray]Cấu hình hiện tại:[] " + curTierStr + "\n" +
                                   "[lightgray]Sát thương gốc:[] [red]-20%[]\n" +
                                   "[lightgray]Tầm bắn hiệu dụng:[] [green]540 pixel (+50%)[]\n\n" +
                                   "[purple]🔥 CƠ CHẾ ĐẶC BIỆT MK2B:[]\n" +
                                   "• Siêu bão nổ lan: Đạn đánh trúng gây [orange]500% Sát thương gốc[] trong phạm vi rộng [yellow]50 ô (400px)[]!\n" +
                                   "• Giữ nguyên cơ chế Laser Giội Mục Tiêu khi pháo SuperCharged."
                                 : "[purple]⚡ LONG-RANGE SPECS MK2B ⚡[]\n" +
                                   "[lightgray]Current Config:[] " + curTierStr + "\n" +
                                   "[lightgray]Base Damage:[] [red]-20%[]\n" +
                                   "[lightgray]Effective Range:[] [green]540 pixels (+50%)[]\n\n" +
                                   "[purple]🔥 MK2B SPECIAL MECHANICS:[]\n" +
                                   "• Massive Splash Blast: On-hit triggers [orange]500% Base DMG[] splash blast in [yellow]50 tiles (400px)[] radius!\n" +
                                   "• Retains Target Sky Strike when Supercharged.";
                }

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
            Groups.bullet.each(b => {
                if (b.team != this.team && Mathf.len2(b.x - x, b.y - y) <= radSq) {
                    b.remove();
                }
            });
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
                if (this.shootCount >= 30) {
                    if (!this.isSuperCharged) {
                        if (this.beamTimer < 12) {
                            this.beamTimer += Time.delta;
                            return;
                        } else {
                            this.isSuperCharged = true;
                            this.beamFadeTimer = 15;
                        }
                    } else {
                        this.beamFadeTimer = 15;
                    }
                }

                let extraBoost = this.isSuperCharged ? 10.0 : 0.0;
                let speedFactor = 1.0 / (1.0 + (this.shootCount * 0.3) + extraBoost);
                
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
                            if (this.shootCount < 30) {
                                this.isSuperCharged = false;
                                this.beamTimer = 0;
                            }
                            this.shootCountTimer = 0;
                        } else {
                            this.shootCountTimer += Time.delta;
                        }
                    } else {
                        this.stopShootTimer += Time.delta;
                    }
                }
            }

            if (!this.isSuperCharged && this.beamFadeTimer > 0) {
                this.beamFadeTimer -= Time.delta;
            }

            if (this.isShooting && this.hasAmmo()) this.stopShootTimer = 0;
        },

        draw() {
            this.super$draw();

            if (this.shootCount > 0 || this.beamFadeTimer > 0) {
                let introFactor = (this.circleIntroTimer > 0) ? Math.max(0, 1.0 - (this.circleIntroTimer / 12)) : 1.0;
                let intensity = (Mathf.clamp(this.shootCount, 0, 10) / 10) * introFactor;

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

                if (this.shootCount > 0 && this.shootCount < 30) {
                    DrawChargingSkyBeam(this.x, this.y, this.shootCount);
                }

                if (this.shootCount >= 30 || this.beamFadeTimer > 0) {
                    let animProgress = Math.min(this.beamTimer / 12, 1.0);
                    let fadeProgress = Math.max(this.beamFadeTimer / 15, 0.0);
                    DrawSuperSkyBeam(this.x, this.y, animProgress, fadeProgress);
                }
            }
        },

        write(write) {
            this.super$write(write);
            write.b(this.getTier());
            write.f(this.mainReloadTimer);
            write.f(this.supReloadTimer);
            write.i(this.shootCount);
            write.f(this.stopShootTimer);
            write.f(this.beamTimer);
            write.f(this.beamFadeTimer);
            write.bool(this.isSuperCharged);
        },

        read(read, revision) {
            this.super$read(read, revision);
            this.setTier(read.b());
            this.mainReloadTimer = read.f();
            this.supReloadTimer = read.f();
            this.shootCount = read.i();
            this.stopShootTimer = read.f();
            this.beamTimer = read.f();
            this.beamFadeTimer = read.f();
            this.isSuperCharged = read.bool();
        }
    });
});