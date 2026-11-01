const NexNet = global.NexNet;
const PerfCore = global.PerfCore;
const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqTyterYiMK2 = { silicon: 150, titanium: 100, thorium: 80 };
const reqTyterYiMK3 = { silicon: 250, titanium: 180, thorium: 120, plastanium: 60 };

const SWORD_LIGHT = "#ffffff";
const SWORD_MAIN = "#ffe066";
const SWORD_DARK = "#ffd700";
const SWORD_DEEP = "#ff8800";

const CRYSTAL_LIGHT = "#ffffff";
const CRYSTAL_MAIN  = "#e0f7ff";
const CRYSTAL_DARK  = "#80deea";
const CRYSTAL_DEEP  = "#00bcd4";

const swordMuzzleFx = new Effect(15, cons(e => {
    Draw.color(Color.valueOf(SWORD_MAIN), Color.valueOf(SWORD_LIGHT), e.fin());
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, 7.0 * e.finpow());
}));

const crystalMuzzleFx = new Effect(15, cons(e => {
    Draw.color(Color.valueOf(CRYSTAL_MAIN), Color.valueOf(CRYSTAL_LIGHT), e.fin());
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, 8.0 * e.finpow());
}));

const swordLaunchFx = new Effect(18, cons(e => {
    Draw.color(Color.valueOf(SWORD_LIGHT), Color.valueOf(SWORD_MAIN), e.fin());
    Lines.stroke(1.2 * e.fout());
    Lines.circle(e.x, e.y, 6.0 * e.finpow());
    Angles.randLenVectors(e.id, 4, 12.0 * e.finpow(), (x, y) => {
        Fill.circle(e.x + x, e.y + y, 1.0 * e.fout());
    });
}));

const swordHitFx = new Effect(20, cons(e => {
    Draw.color(Color.valueOf(SWORD_LIGHT), Color.valueOf(SWORD_MAIN), e.fin());
    Lines.stroke(1.5 * e.fout());
    Lines.circle(e.x, e.y, 10.0 * e.finpow());

    Angles.randLenVectors(e.id, 5, 14.0 * e.finpow(), (x, y) => {
        Draw.color(Color.valueOf(SWORD_MAIN));
        Fill.circle(e.x + x, e.y + y, 1.4 * e.fout());
    });
}));

const swordExplosionFx = new Effect(25, cons(e => {
    let size = 14.0 * e.finpow();
    let spinRot = e.rotation + (e.fin() * 60.0);

    Draw.color(Color.valueOf(SWORD_DEEP));
    Draw.alpha(0.8 * e.fout());
    Drawf.tri(e.x, e.y, 4.0 * e.fout(), size * 1.3, spinRot);
    Drawf.tri(e.x, e.y, 4.0 * e.fout(), size * 1.3, spinRot + 180);

    Draw.color(Color.valueOf(SWORD_MAIN));
    Draw.alpha(1.0 * e.fout());
    Drawf.tri(e.x, e.y, 3.0 * e.fout(), size, spinRot + 90);
    Drawf.tri(e.x, e.y, 3.0 * e.fout(), size, spinRot + 270);

    Draw.reset();
}));

const skyLaserFx = new Effect(40, cons(e => {
    Draw.color(Color.white, Color.valueOf(CRYSTAL_LIGHT), e.fin());
    Lines.stroke(8.0 * e.fout());
    Lines.line(e.x, e.y + 400.0, e.x, e.y);
    Draw.color(Color.valueOf(CRYSTAL_MAIN));
    Lines.stroke(3.0 * e.fout());
    Lines.line(e.x, e.y + 400.0, e.x, e.y);
}));

const jigsawAssembleFx = new Effect(45, cons(e => {
    Draw.color(Color.valueOf(CRYSTAL_LIGHT), Color.valueOf(SWORD_MAIN), e.fin());
    let progress = e.fin();

    for(let i = 0; i < 10; i++) {
        let seed = e.id + i * 13;
        let yOffset = Mathf.randomSeed(seed, -45, 45);
        let startX = e.x - 120 - Mathf.randomSeed(seed + 1, 0, 50);
        let currentX = Mathf.lerp(startX, e.x, progress);
        let currentY = e.y + yOffset * (1.0 - progress);
        Drawf.tri(currentX, currentY, 5.0 * e.fout(), 10.0 * e.fout(), 45);
    }

    for(let i = 0; i < 10; i++) {
        let seed = e.id + i * 17 + 200;
        let yOffset = Mathf.randomSeed(seed, -45, 45);
        let startX = e.x + 120 + Mathf.randomSeed(seed + 1, 0, 50);
        let currentX = Mathf.lerp(startX, e.x, progress);
        let currentY = e.y + yOffset * (1.0 - progress);
        Drawf.tri(currentX, currentY, 5.0 * e.fout(), 10.0 * e.fout(), 225);
    }
}));

const starFlashFx = new Effect(45, cons(e => {
    Draw.color(Color.white, Color.valueOf(CRYSTAL_LIGHT), e.fin());
    let size = e.finpow() * 130.0;
    let rot = e.fin() * 50.0;
    for(let i = 0; i < 4; i++){
        Drawf.tri(e.x, e.y, 18.0 * e.fout(), size, i * 90.0 + rot);
        Drawf.tri(e.x, e.y, 18.0 * e.fout(), size, i * 90.0 + 45.0 + rot);
    }
    Draw.color(Color.white);
    Fill.circle(e.x, e.y, e.fout() * 40.0);
}));

function spawn16Smoke(build) {
    for (let i = 0; i < 16; i++) {
        let angle = i * 22.5;

        for (let d = 16; d <= 72; d += 18) {
            let sx = build.x + Angles.trnsx(angle, d);
            let sy = build.y + Angles.trnsy(angle, d);
            Fx.smoke.at(sx, sy, angle);
            Fx.smoke.at(sx + Mathf.range(10.0), sy + Mathf.range(10.0), angle + Mathf.range(30.0));
        }
    }
}

function drawSwordShape(x, y, rot, baseSize, progress, isCrystal) {
    let sz = baseSize * Mathf.curve(progress, 0.0, 1.0);
    if (sz <= 0.1) return;

    let alphaFactor = Mathf.clamp(progress);

    let deepColor = isCrystal ? CRYSTAL_DEEP : SWORD_DEEP;
    let mainColor = isCrystal ? CRYSTAL_MAIN : SWORD_MAIN;
    let lightColor = isCrystal ? CRYSTAL_LIGHT : SWORD_LIGHT;

    Draw.color(Color.valueOf(deepColor));
    Draw.alpha(0.7 * alphaFactor);
    Drawf.tri(x, y, sz * 0.4, sz * 2.7, rot);

    Drawf.tri(x, y, sz * 0.3, sz * 0.7, rot + 90);
    Drawf.tri(x, y, sz * 0.3, sz * 0.7, rot + 270);
    Drawf.tri(x, y, sz * 0.22, sz * 0.5, rot + 180);

    Draw.color(Color.valueOf(mainColor));
    Draw.alpha(0.95 * alphaFactor);
    Drawf.tri(x, y, sz * 0.26, sz * 2.2, rot);
    Drawf.tri(x, y, sz * 0.2, sz * 0.55, rot + 90);
    Drawf.tri(x, y, sz * 0.2, sz * 0.55, rot + 270);
    Drawf.tri(x, y, sz * 0.15, sz * 0.35, rot + 180);

    Draw.color(Color.valueOf(lightColor));
    Draw.alpha(1.0 * alphaFactor);
    Drawf.tri(x, y, sz * 0.09, sz * 1.2, rot);

    Fill.circle(x, y, 1.8 * alphaFactor);
    Draw.reset();
}

const MicroSwordBullet1 = extend(BasicBulletType, {
    speed: 15.4, damage: (140) * 3, width: 2.0, height: 7, shrinkX: 0, shrinkY: 0,
    homingPower: 0.15, homingRange: 140,
    pierce: true, pierceBuilding: true, pierceCap: 5,
    frontColor: Color.valueOf(SWORD_LIGHT), backColor: Color.valueOf(SWORD_MAIN),
    shootEffect: Fx.none, hitEffect: swordHitFx, despawnEffect: Fx.none,
    update(b) {
        this.super$update(b);
        let wave = Mathf.sin(b.time * 0.45) * 2.5;
        let perp = b.rotation() + 90;
        b.set(b.x + Angles.trnsx(perp, wave), b.y + Angles.trnsy(perp, wave));
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 5.0);
        drawSwordShape(b.x, b.y, b.rotation(), 4.2, spawnProgress, false);
    }
});

const MicroSwordBullet2 = extend(BasicBulletType, {
    speed: 15.4, damage: (140) * 3, width: 2.0, height: 7, shrinkX: 0, shrinkY: 0,
    homingPower: 0.18, homingRange: 150,
    pierce: true, pierceBuilding: true, pierceCap: 5,
    frontColor: Color.valueOf(SWORD_LIGHT), backColor: Color.valueOf(SWORD_MAIN),
    shootEffect: Fx.none, hitEffect: swordHitFx, despawnEffect: Fx.none,
    update(b) {
        this.super$update(b);
        let wave = Mathf.cos(b.time * 0.35) * 3.2;
        let perp = b.rotation() + 90;
        b.set(b.x + Angles.trnsx(perp, wave), b.y + Angles.trnsy(perp, wave));
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 5.0);
        drawSwordShape(b.x, b.y, b.rotation(), 4.2, spawnProgress, false);
    }
});

const MicroSwordBulletCrystal1 = extend(BasicBulletType, {
    speed: 15.4, damage: (140 * 4.8) * 3, width: 2.0, height: 7, shrinkX: 0, shrinkY: 0,
    homingPower: 0.18, homingRange: 150,
    pierce: true, pierceBuilding: true, pierceCap: 5,
    frontColor: Color.valueOf(CRYSTAL_LIGHT), backColor: Color.valueOf(CRYSTAL_MAIN),
    shootEffect: Fx.none, hitEffect: swordHitFx, despawnEffect: Fx.none,
    update(b) {
        this.super$update(b);
        let wave = Mathf.sin(b.time * 0.45) * 2.5;
        let perp = b.rotation() + 90;
        b.set(b.x + Angles.trnsx(perp, wave), b.y + Angles.trnsy(perp, wave));
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 5.0);
        drawSwordShape(b.x, b.y, b.rotation(), 4.2, spawnProgress, true);
    }
});

const MicroSwordBulletCrystal2 = extend(BasicBulletType, {
    speed: 15.4, damage: (140 * 4.8) * 3, width: 2.0, height: 7, shrinkX: 0, shrinkY: 0,
    homingPower: 0.2, homingRange: 160,
    pierce: true, pierceBuilding: true, pierceCap: 5,
    frontColor: Color.valueOf(CRYSTAL_LIGHT), backColor: Color.valueOf(CRYSTAL_MAIN),
    shootEffect: Fx.none, hitEffect: swordHitFx, despawnEffect: Fx.none,
    update(b) {
        this.super$update(b);
        let wave = Mathf.cos(b.time * 0.35) * 3.2;
        let perp = b.rotation() + 90;
        b.set(b.x + Angles.trnsx(perp, wave), b.y + Angles.trnsy(perp, wave));
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 5.0);
        drawSwordShape(b.x, b.y, b.rotation(), 4.2, spawnProgress, true);
    }
});

const MiniSwordBullet = extend(BasicBulletType, {
    speed: 4.2, damage: (126) * 3, width: 2.5, height: 10, shrinkX: 0, shrinkY: 0,
    homingPower: 0.1, homingRange: 150,
    pierce: true, pierceBuilding: true, pierceCap: 5,
    frontColor: Color.valueOf(CRYSTAL_LIGHT), backColor: Color.valueOf(CRYSTAL_MAIN),
    shootEffect: Fx.none, hitEffect: swordHitFx, despawnEffect: Fx.none,
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 8.0);
        drawSwordShape(b.x, b.y, b.rotation(), 6.3, spawnProgress, true);
    }
});

const FallingRainSword = extend(BasicBulletType, {
    speed: 7.0, damage: (100) * 3, width: 2.5, height: 10, shrinkX: 0, shrinkY: 0,
    homingPower: 0.0, pierce: true, pierceBuilding: true, pierceCap: 3,
    frontColor: Color.valueOf(SWORD_LIGHT), backColor: Color.valueOf(SWORD_MAIN),
    shootEffect: Fx.none, hitEffect: swordHitFx, despawnEffect: Fx.none,
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 5.0);
        drawSwordShape(b.x, b.y, b.rotation(), 6.3, spawnProgress, false);
    }
});

const FallingRainCrystal = extend(BasicBulletType, {
    speed: 7.0, damage: (155) * 3, width: 2.5, height: 10, shrinkX: 0, shrinkY: 0,
    homingPower: 0.0, pierce: true, pierceBuilding: true, pierceCap: 3,
    frontColor: Color.valueOf(CRYSTAL_LIGHT), backColor: Color.valueOf(CRYSTAL_MAIN),
    shootEffect: Fx.none, hitEffect: swordHitFx, despawnEffect: Fx.none,
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 5.0);
        drawSwordShape(b.x, b.y, b.rotation(), 6.3, spawnProgress, true);
    }
});

function triggerSwordRain(b, entity) {
    if (entity == null || b.owner == null) return;
    let tier = (b.owner.getTier !== undefined) ? b.owner.getTier() : 0;
    if (tier < 1) return;

    let isAbeta = (b.owner.isAbeta === true);
    let chance = isAbeta ? 0.3 : 0.1;

    if (Mathf.chance(chance)) {
        let count = 6;
        for (let i = 0; i < count; i++) {
            let ox = Mathf.range(45.0);
            let oy = Mathf.range(45.0);
            let sx = entity.x + ox + Mathf.range(10.0);
            let sy = entity.y + 160.0 + Mathf.range(20.0);
            let targetX = entity.x + ox;
            let targetY = entity.y + oy;
            let angle = Angles.angle(sx, sy, targetX, targetY);

            let bulletType = isAbeta ? FallingRainCrystal : FallingRainSword;
            let rainB = bulletType.create(b.owner, b.team, sx, sy, angle);
            if (rainB != null) {
                rainB.lifetime = 25.0;
            }
            Fx.itemTransfer.at(targetX, targetY, 6, Color.valueOf(SWORD_MAIN));
        }
    }
}

const SwordBulletMK1 = extend(BasicBulletType, {
    speed: 7.7, damage: (210) * 3, width: 3.2, height: 12, shrinkX: 0, shrinkY: 0,
    homingPower: 0.05, homingRange: 150,
    pierce: true, pierceBuilding: true, pierceCap: 20,
    frontColor: Color.valueOf(SWORD_LIGHT), backColor: Color.valueOf(SWORD_MAIN),
    splashDamage: 40 * 3, splashDamageRadius: 35,
    shootEffect: swordMuzzleFx, hitEffect: swordHitFx, despawnEffect: swordExplosionFx,
    status: StatusEffects.melting, statusDuration: 90,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && b.owner.addCharge !== undefined) {
            b.owner.addCharge(2.0);
        }
        if (entity != null && entity.maxHealth) {
            let maxHp = entity.maxHealth;
            let extraDmg = (b.vel.len() < this.speed * 0.7) ? (maxHp * 0.05) : 0.0;
            entity.damage(maxHp * 0.03 + extraDmg);
        }
        if (entity instanceof Unit && ((entity.type != null && entity.type.name === "akenewm-inventer") || entity.isGalileoJS)) {
            entity.damage(b.damage * 3.0);
            Fx.itemTransfer.at(entity.x, entity.y, 10, Color.valueOf(SWORD_MAIN));
        }
        triggerSwordRain(b, entity);
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 10.0);
        drawSwordShape(b.x, b.y, b.rotation(), 9.8, spawnProgress, false);
    }
});

const SwordBulletMK2 = extend(BasicBulletType, {
    speed: 11.55, damage: (273) * 3, width: 3.5, height: 14, shrinkX: 0, shrinkY: 0,
    homingPower: 0.08, homingRange: 200,
    pierce: true, pierceBuilding: true, pierceCap: 30,
    frontColor: Color.valueOf(SWORD_LIGHT), backColor: Color.valueOf(SWORD_DARK),
    splashDamage: 60 * 3, splashDamageRadius: 45,
    shootEffect: swordMuzzleFx, hitEffect: swordHitFx, despawnEffect: swordExplosionFx,
    status: StatusEffects.melting, statusDuration: 130,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && b.owner.addCharge !== undefined) {
            b.owner.addCharge(2.0);
        }
        if (entity != null && entity.maxHealth) {
            let maxHp = entity.maxHealth;
            let extraDmg = (b.vel.len() < this.speed * 0.7) ? (maxHp * 0.05) : 0.0;
            entity.damage(maxHp * 0.03 + extraDmg);
        }
        if (entity instanceof Unit && ((entity.type != null && entity.type.name === "akenewm-inventer") || entity.isGalileoJS)) {
            entity.damage(b.damage * 3.0);
            Fx.itemTransfer.at(entity.x, entity.y, 10, Color.valueOf(SWORD_MAIN));
        }
        triggerSwordRain(b, entity);
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 10.0);
        drawSwordShape(b.x, b.y, b.rotation(), 11.2, spawnProgress, false);
    }
});

const SwordBulletMK3 = extend(BasicBulletType, {
    speed: 16.94, damage: (462) * 3, width: 3.8, height: 16, shrinkX: 0, shrinkY: 0,
    homingPower: 0.1, homingRange: 250,
    pierce: true, pierceBuilding: true, pierceCap: 40,
    frontColor: Color.valueOf(SWORD_LIGHT), backColor: Color.valueOf(SWORD_DARK),
    splashDamage: 80 * 3, splashDamageRadius: 55,
    shootEffect: swordMuzzleFx, hitEffect: swordHitFx, despawnEffect: swordExplosionFx,
    status: StatusEffects.melting, statusDuration: 160,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && b.owner.addCharge !== undefined) {
            b.owner.addCharge(2.0);
        }
        if (entity != null && entity.maxHealth) {
            let maxHp = entity.maxHealth;
            let isAbeta = (b.owner != null && b.owner.isAbeta === true);
            let baseHpDmg = maxHp * (isAbeta ? 0.08 : 0.03);
            let extraDmg = (b.vel.len() < this.speed * 0.7) ? (maxHp * 0.05) : 0.0;
            entity.damage(baseHpDmg + extraDmg);
        }
        if (entity instanceof Unit && ((entity.type != null && entity.type.name === "akenewm-inventer") || entity.isGalileoJS)) {
            entity.damage(b.damage * 3.0);
            Fx.itemTransfer.at(entity.x, entity.y, 10, Color.valueOf(SWORD_MAIN));
        }
        triggerSwordRain(b, entity);
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 10.0);
        drawSwordShape(b.x, b.y, b.rotation(), 11.9, spawnProgress, false);
    }
});

const SwordBulletCrystalMK1 = extend(BasicBulletType, {
    speed: 8.4, damage: (210 * 4.8) * 3, width: 3.5, height: 14, shrinkX: 0, shrinkY: 0,
    homingPower: 0.1, homingRange: 220,
    pierce: true, pierceBuilding: true, pierceCap: 35,
    frontColor: Color.valueOf(CRYSTAL_LIGHT), backColor: Color.valueOf(CRYSTAL_MAIN),
    splashDamage: 80 * 3, splashDamageRadius: 50,
    shootEffect: crystalMuzzleFx, hitEffect: swordHitFx, despawnEffect: swordExplosionFx,
    status: StatusEffects.freezing, statusDuration: 150,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && b.owner.addCharge !== undefined) {
            b.owner.addCharge(2.0);
        }
        if (entity != null && entity.maxHealth) {
            let maxHp = entity.maxHealth;
            let extraDmg = (b.vel.len() < this.speed * 0.7) ? (maxHp * 0.05) : 0.0;
            entity.damage(maxHp * 0.08 + extraDmg);
        }
        if (entity instanceof Unit && ((entity.type != null && entity.type.name === "akenewm-inventer") || entity.isGalileoJS)) {
            entity.damage(b.damage * 3.0);
            Fx.itemTransfer.at(entity.x, entity.y, 10, Color.valueOf(CRYSTAL_MAIN));
        }

        if (entity != null) {
            let miniDmg = b.damage * 0.6;
            for (let i = 0; i < 3; i++) {
                let angleOffset = i * 120.0 + Mathf.random(30.0);
                let spawnDist = 32.0;
                let sx = entity.x + Angles.trnsx(angleOffset, spawnDist);
                let sy = entity.y + Angles.trnsy(angleOffset, spawnDist);
                let shootAngle = Angles.angle(sx, sy, entity.x, entity.y);

                let miniB = MiniSwordBullet.create(b.owner, b.team, sx, sy, shootAngle);
                if (miniB != null) {
                    miniB.damage = miniDmg;
                    miniB.lifetime = 45.0;
                }
            }
        }
        triggerSwordRain(b, entity);
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 10.0);
        drawSwordShape(b.x, b.y, b.rotation(), 10.5, spawnProgress, true);
    }
});

const SwordBulletCrystalMK2 = extend(BasicBulletType, {
    speed: 11.55, damage: (273 * 4.8) * 3, width: 3.6, height: 15, shrinkX: 0, shrinkY: 0,
    homingPower: 0.12, homingRange: 230,
    pierce: true, pierceBuilding: true, pierceCap: 38,
    frontColor: Color.valueOf(CRYSTAL_LIGHT), backColor: Color.valueOf(CRYSTAL_MAIN),
    splashDamage: 90 * 3, splashDamageRadius: 52,
    shootEffect: crystalMuzzleFx, hitEffect: swordHitFx, despawnEffect: swordExplosionFx,
    status: StatusEffects.freezing, statusDuration: 160,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && b.owner.addCharge !== undefined) {
            b.owner.addCharge(2.0);
        }
        if (entity != null && entity.maxHealth) {
            let maxHp = entity.maxHealth;
            let extraDmg = (b.vel.len() < this.speed * 0.7) ? (maxHp * 0.05) : 0.0;
            entity.damage(maxHp * 0.08 + extraDmg);
        }
        if (entity instanceof Unit && ((entity.type != null && entity.type.name === "akenewm-inventer") || entity.isGalileoJS)) {
            entity.damage(b.damage * 3.0);
            Fx.itemTransfer.at(entity.x, entity.y, 10, Color.valueOf(CRYSTAL_MAIN));
        }

        if (entity != null) {
            let miniDmg = b.damage * 0.6;
            for (let i = 0; i < 3; i++) {
                let angleOffset = i * 120.0 + Mathf.random(30.0);
                let spawnDist = 32.0;
                let sx = entity.x + Angles.trnsx(angleOffset, spawnDist);
                let sy = entity.y + Angles.trnsy(angleOffset, spawnDist);
                let shootAngle = Angles.angle(sx, sy, entity.x, entity.y);

                let miniB = MiniSwordBullet.create(b.owner, b.team, sx, sy, shootAngle);
                if (miniB != null) {
                    miniB.damage = miniDmg;
                    miniB.lifetime = 45.0;
                }
            }
        }
        triggerSwordRain(b, entity);
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 10.0);
        drawSwordShape(b.x, b.y, b.rotation(), 11.2, spawnProgress, true);
    }
});

const SwordBulletCrystalMK3 = extend(BasicBulletType, {
    speed: 16.94, damage: (462 * 4.8) * 3, width: 3.8, height: 16, shrinkX: 0, shrinkY: 0,
    homingPower: 0.15, homingRange: 260,
    pierce: true, pierceBuilding: true, pierceCap: 45,
    frontColor: Color.valueOf(CRYSTAL_LIGHT), backColor: Color.valueOf(CRYSTAL_MAIN),
    splashDamage: 110 * 3, splashDamageRadius: 60,
    shootEffect: crystalMuzzleFx, hitEffect: swordHitFx, despawnEffect: swordExplosionFx,
    status: StatusEffects.freezing, statusDuration: 180,

    hitEntity(b, entity, health) {
        this.super$hitEntity(b, entity, health);
        if (b.owner != null && b.owner.addCharge !== undefined) {
            b.owner.addCharge(2.0);
        }
        if (entity != null && entity.maxHealth) {
            let maxHp = entity.maxHealth;
            let extraDmg = (b.vel.len() < this.speed * 0.7) ? (maxHp * 0.05) : 0.0;
            entity.damage(maxHp * 0.08 + extraDmg);
        }
        if (entity instanceof Unit && ((entity.type != null && entity.type.name === "akenewm-inventer") || entity.isGalileoJS)) {
            entity.damage(b.damage * 3.0);
            Fx.itemTransfer.at(entity.x, entity.y, 10, Color.valueOf(CRYSTAL_MAIN));
        }

        if (entity != null) {
            let miniDmg = b.damage * 0.6;
            for (let i = 0; i < 3; i++) {
                let angleOffset = i * 120.0 + Mathf.random(30.0);
                let spawnDist = 32.0;
                let sx = entity.x + Angles.trnsx(angleOffset, spawnDist);
                let sy = entity.y + Angles.trnsy(angleOffset, spawnDist);
                let shootAngle = Angles.angle(sx, sy, entity.x, entity.y);

                let miniB = MiniSwordBullet.create(b.owner, b.team, sx, sy, shootAngle);
                if (miniB != null) {
                    miniB.damage = miniDmg;
                    miniB.lifetime = 45.0;
                }
            }
        }
        triggerSwordRain(b, entity);
    },
    draw(b) {
        let spawnProgress = Mathf.clamp(b.time / 10.0);
        drawSwordShape(b.x, b.y, b.rotation(), 11.9, spawnProgress, true);
    }
});

let TyterYi = extend(ItemTurret, "tyteryi", { squareSprite: false });

TyterYi.shootSound = Sounds.none;
TyterYi.requirements = ItemStack.with(Items.copper, 400, Items.lead, 280, Items.silicon, 200, Items.titanium, 150);
TyterYi.buildVisibility = BuildVisibility.shown;

TyterYi.health = 3000;
TyterYi.size = 3;
TyterYi.reload = 34.0;
TyterYi.inaccuracy = 1.0;
TyterYi.range = 1920.0;
TyterYi.configurable = true;
TyterYi.category = Category.turret;

TyterYi.ammoTypes.put(Items.silicon, SwordBulletMK1);

TyterYi.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) tile.setTier(value);
}));

TyterYi.buildType = () => extend(ItemTurret.ItemTurretBuild, TyterYi, {
    tierState: 0, limitCheck: 0,
    swords: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    isReloading: false,
    lastShotTick: -999,
    internalCharge: 0.0,
    isAbeta: false,
    isTransforming: false,
    transitionTimer: 0.0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){
        this.tierState = val;
        if(val == 0) this.health = 3000;
        if(val == 1) this.health = 5400;
        if(val == 2) this.health = 6600;
        this.maxHealth = this.health;
    },

    range(){
        let tier = this.getTier();
        if(tier == 1) return 2560.2;
        if(tier == 2) return 4224.0;
        return 1920.0;
    },

    drawSelect(){
        this.super$drawSelect();
    },

    getMaxSwords(){
        return this.isAbeta ? 6 : 4;
    },

    addCharge(amount){
        if(!this.isAbeta && !this.isTransforming) {
            this.internalCharge += amount;
            if(this.internalCharge >= 100.0) {
                this.internalCharge = 100.0;
                this.isTransforming = true;
                this.transitionTimer = 120.0;
                spawn16Smoke(this);
                skyLaserFx.at(this.x, this.y);
                jigsawAssembleFx.at(this.x, this.y);
            }
        }
    },

    draw(){
        this.super$draw();

        let chargeRatio = Mathf.clamp(this.internalCharge / 100.0);
        let ringRadius = 14.0;

        Draw.color(Color.darkGray);
        Lines.stroke(1.5);
        Lines.circle(this.x, this.y, ringRadius);

        let ringColor = this.isAbeta ? CRYSTAL_MAIN : SWORD_MAIN;
        Draw.color(Color.valueOf(ringColor));
        Lines.stroke(2.5);
        if(chargeRatio > 0.0) {
            let segments = 36;
            let totalAngle = chargeRatio * 360.0;
            let activeSegs = Math.max(1, Math.floor(segments * chargeRatio));
            for(let j = 0; j < activeSegs; j++) {
                let a1 = (j / segments) * 360.0;
                let a2 = ((j + 1) / segments) * 360.0;
                if(a2 > totalAngle) a2 = totalAngle;
                let x1 = this.x + Angles.trnsx(a1, ringRadius);
                let y1 = this.y + Angles.trnsy(a1, ringRadius);
                let x2 = this.x + Angles.trnsx(a2, ringRadius);
                let y2 = this.y + Angles.trnsy(a2, ringRadius);
                Lines.line(x1, y1, x2, y2);
            }
        }

        let percentStr = new java.lang.String(this.isAbeta ? "ABETA" : (this.isTransforming ? "TRANS..." : Math.floor(this.internalCharge) + "%"));
        Fonts.outline.getData().setScale(0.38);
        Fonts.outline.draw(percentStr, this.x, this.y - 18.0, Align.center);
        Fonts.outline.getData().setScale(1.0);

        let maxS = this.getMaxSwords();
        let backAngle = this.rotation + 180.0;

        for(let i = 0; i < maxS; i++){
            let prog = this.swords[i];
            if(prog <= 0.01) continue;

            let offsetDist = 11.0 + (i * 3.5);
            let sideOffset = (maxS == 6) ? ((i - 2.5) * 4.5) : ((i - 1.5) * 6.0);

            let floatOffsetX = 0.0;
            let floatOffsetY = 0.0;
            if(prog >= 1.0) {
                floatOffsetX = Mathf.absin(Time.time * 2.5 + i * 25.0, 15.0, 1.5);
                floatOffsetY = Mathf.absin(Time.time * 3.0 + i * 35.0, 15.0, 1.5);
            }

            let targetX = this.x + Angles.trnsx(backAngle, offsetDist + floatOffsetX) + Angles.trnsx(backAngle + 90, sideOffset + floatOffsetY);
            let targetY = this.y + Angles.trnsy(backAngle, offsetDist + floatOffsetX) + Angles.trnsy(backAngle + 90, sideOffset + floatOffsetY);

            let sideSideAngle = (i % 2 == 0) ? (backAngle + 90.0) : (backAngle - 90.0);
            let startX = this.x + Angles.trnsx(sideSideAngle, 45.0);
            let startY = this.y + Angles.trnsy(sideSideAngle, 45.0);

            let moveProg = Mathf.curve(prog, 0.0, 1.0);
            let curX = Mathf.lerp(startX, targetX, moveProg);
            let curY = Mathf.lerp(startY, targetY, moveProg);

            drawSwordShape(curX, curY, this.rotation, 7.7, prog, this.isAbeta);
        }
        Draw.reset();
    },

    updateTile(){
        this.limitCheck += Time.delta;
        if(this.limitCheck >= 15){
            this.limitCheck = 0; let _lim = PerfCore.teamBlocks(this.team, TyterYi); let count = _lim != null ? _lim.size : 0; let firstBuild = (_lim != null && count > 0) ? _lim.first() : null;
            if(count > 10 && this !== firstBuild){ Call.sendMessage("[red]CẢNH BÁO QUÁ TẢI MẠNG LƯỚI: Giới hạn tối đa 10 đơn vị TyterYi trên cùng hệ thống![]"); this.kill(); return; }
        }

        if(this.isTransforming) {
            this.transitionTimer -= Time.delta;
            if(Mathf.chance(0.5)) {
                spawn16Smoke(this);
            }

            if(this.transitionTimer <= 0) {
                this.isTransforming = false;
                this.isAbeta = true;
                spawn16Smoke(this);
                skyLaserFx.at(this.x, this.y);
                jigsawAssembleFx.at(this.x, this.y);
                starFlashFx.at(this.x, this.y);
            }
        }

        let maxS = this.getMaxSwords();

        if(this.isAbeta) {
            this.internalCharge -= 0.05 * Time.delta;
            if(this.internalCharge <= 0.0) {
                this.internalCharge = 0.0;
                this.isAbeta = false;
                spawn16Smoke(this);
                skyLaserFx.at(this.x, this.y);
                jigsawAssembleFx.at(this.x, this.y);
                starFlashFx.at(this.x, this.y);
            }
        }

        let allEmpty = true;
        for(let i = 0; i < maxS; i++) {
            if(this.swords[i] > 0.0) {
                allEmpty = false;
                break;
            }
        }

        if(allEmpty) {
            this.isReloading = true;
        }

        if(this.isReloading) {
            let targetIdx = -1;
            for(let i = 0; i < maxS; i++) {
                if(this.swords[i] < 1.0) {
                    targetIdx = i;
                    break;
                }
            }

            if(targetIdx != -1) {
                let baseRecharge = (this.getTier() == 2) ? (Time.delta / 22.0) : ((this.getTier() == 1) ? (Time.delta / 35.0) : (Time.delta / 45.0));
                let rechargeSpeed = this.isAbeta ? (baseRecharge * 1.5) : baseRecharge;

                this.swords[targetIdx] += rechargeSpeed;
                if(this.swords[targetIdx] >= 1.0) {
                    this.swords[targetIdx] = 1.0;
                }
            } else {
                this.isReloading = false;
            }
        }

        let tier = this.getTier();
        if (tier == 2) {
            this.block.reload = 14.0;
            this.inaccuracy = 1.5;
        } else if (tier == 1) {
            this.block.reload = 34.0;
            this.inaccuracy = 0.8;
        } else {
            this.block.reload = 34.0;
            this.inaccuracy = 1.0;
        }

        this.super$updateTile();
    },

    shoot(type){
        if(this.isTransforming) return;

        let currentTick = Time.time;
        let tier = this.getTier();
        let requiredCooldown = this.isAbeta ? 14 : (tier == 2 ? 17 : 26);
        if (currentTick - this.lastShotTick < requiredCooldown) {
            return;
        }

        if(this.isReloading) {
            return;
        }

        let maxS = this.getMaxSwords();
        let firedIndex = -1;
        for(let i = 0; i < maxS; i++) {
            if(this.swords[i] >= 1.0) {
                firedIndex = i;
                break;
            }
        }

        if(firedIndex == -1) {
            return;
        }

        this.lastShotTick = currentTick;
        this.swords[firedIndex] = 0.0;

        let bulletType;
        if(this.isAbeta) {
            if(tier == 2) bulletType = SwordBulletCrystalMK3;
            else if(tier == 1) bulletType = SwordBulletCrystalMK2;
            else bulletType = SwordBulletCrystalMK1;
        } else {
            if(tier == 2) bulletType = SwordBulletMK3;
            else if(tier == 1) bulletType = SwordBulletMK2;
            else bulletType = SwordBulletMK1;
        }

        let exactLifetime = this.range() / bulletType.speed;

        let backAngle = this.rotation + 180.0;
        let leftAngle = this.rotation + 90.0;

        let spawnX = this.x + Angles.trnsx(backAngle, 12.0) + Angles.trnsx(leftAngle, 9.0);
        let spawnY = this.y + Angles.trnsy(backAngle, 12.0) + Angles.trnsy(leftAngle, 9.0);

        let b = bulletType.create(this, this.team, spawnX, spawnY, this.rotation);
        if (b != null) {
            b.lifetime = exactLifetime;

            if (Mathf.chance(0.5)) {
                b.vel.scl(0.5);
            }

            swordLaunchFx.at(spawnX, spawnY, this.rotation);

            if (tier == 2) {
                let count = 4;
                for (let k = 1; k <= count; k++) {
                    let backDist = k * 10.0 + Mathf.random(5.0);
                    let sideSign = (k % 2 == 0) ? 1 : -1;
                    let sideOffset = sideSign * (7.0 + k * 3.0 + Mathf.random(4.0));

                    let microX = spawnX - Angles.trnsx(this.rotation, backDist) + Angles.trnsx(this.rotation + 90, sideOffset);
                    let microY = spawnY - Angles.trnsy(this.rotation, backDist) + Angles.trnsy(this.rotation + 90, sideOffset);

                    let microBulletType;
                    if(this.isAbeta) {
                        microBulletType = (k % 2 == 0) ? MicroSwordBulletCrystal1 : MicroSwordBulletCrystal2;
                    } else {
                        microBulletType = (k % 2 == 0) ? MicroSwordBullet1 : MicroSwordBullet2;
                    }

                    let mb = microBulletType.create(this, this.team, microX, microY, this.rotation);
                    if (mb != null) {
                        mb.lifetime = exactLifetime;
                    }
                }
            }
        }
    },

    buildConfiguration(table){
        table.clear(); table.row();
        let tier = this.getTier();

        if(tier < 2) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let nextTier = tier + 1;
                let dialog = extend(BaseDialog, nextTier == 1 ? "TRUNG TÂM NÂNG CẤP MK2" : "TRUNG TÂM NÂNG CẤP MK3", {});
                dialog.cont.add(nextTier == 1 ? "[#ffe066]=== NÂNG CẤP LÊN PROTOCOL MK2 ===[]" : "[#ffaa00]=== NÂNG CẤP LÊN PROTOCOL MK3 ===[]").row();

                let reqSnapshot = (() => {
                    let core = this.team.core(); if(core == null) return "[red]CRITICAL ERROR: Mất tín hiệu với Kho Lõi Trung Tâm![]";
                    let getVal = (item) => core.items.get(Vars.content.item(item));
                    let req = nextTier == 1 ? reqTyterYiMK2 : reqTyterYiMK3;

                    let sil = getVal("silicon"), tit = getVal("titanium"), tho = getVal("thorium"), pla = getVal("plastanium");
                    let cSil = sil >= req.silicon ? "[#00ff88]" : "[red]";
                    let cTit = tit >= req.titanium ? "[#00ff88]" : "[red]";
                    let cTho = tho >= req.thorium ? "[#00ff88]" : "[red]";
                    let cPla = nextTier == 2 ? (pla >= req.plastanium ? "[#ffe066]" : "[red]") : "";

                    let resStr = "[#ffd700]👑 TÀI NGUYÊN KHO TRUNG TÂM:[]\n" +
                                 " • Si: " + cSil + sil + "[]/" + req.silicon + "\n" +
                                 " • Ti: " + cTit + tit + "[]/" + req.titanium + "\n" +
                                 " • Th: " + cTho + tho + "[]/" + req.thorium;
                    if(nextTier == 2) {
                        resStr += "\n • Plastanium: " + cPla + pla + "[]/" + req.plastanium;
                    }
                    return resStr;
                })();
                dialog.cont.add(reqSnapshot.toString()).row(); dialog.cont.add().height(10).row();

                let btnText = nextTier == 1 ? "[#ffd700]KÍCH HOẠT MK2[]" : "[#ffaa00]KÍCH HOẠT MK3[]";
                dialog.cont.button(btnText, packRun(() => {
                    let core = this.team.core();
                    let req = nextTier == 1 ? reqTyterYiMK2 : reqTyterYiMK3;
                    let hasMats = core != null &&
                                  core.items.get(Vars.content.item("silicon")) >= req.silicon &&
                                  core.items.get(Vars.content.item("titanium")) >= req.titanium &&
                                  core.items.get(Vars.content.item("thorium")) >= req.thorium;
                    if(nextTier == 2 && core != null) {
                        hasMats = hasMats && core.items.get(Vars.content.item("plastanium")) >= req.plastanium;
                    }

                    if(hasMats) {
                        NexNet.take(core, Vars.content.item("silicon"), req.silicon);
                        NexNet.take(core, Vars.content.item("titanium"), req.titanium);
                        NexNet.take(core, Vars.content.item("thorium"), req.thorium);
                        if(nextTier == 2) {
                            NexNet.take(core, Vars.content.item("plastanium"), req.plastanium);
                        }
                        NexNet.fx(Fx.upgradeCore, this.x, this.y); NexNet.fx(Fx.explosion, this.x, this.y);
                        this.configure(java.lang.Integer(nextTier)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]ERROR: Vật tư nguyên liệu không đủ![]"); }
                })).size(200, 42);

                dialog.addCloseButton(); dialog.show();
            })).size(50, 40).tooltip("Tái cấu trúc nâng cấp");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[#00ff88]SYSTEM LOG: Đơn vị TyterYi đã đạt cấp độ bão hòa tối đa (MAX LEVEL MK3).[]");
            })).size(50, 40).tooltip("Hệ thống đạt giới hạn");
        }

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = "📡 HỆ THỐNG PHÁO TYTERYI ABETA & MK3";
            let descStr = "[#ffe066]⚙️ THÔNG TIN CƠ CHẾ NÂNG CẤP & ABETA:[]\n" +
                          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                          " • [#ffd700]Hiệu ứng chuyển đổi:[] Ngưng 2 giây, mảnh ghép 2 bên bay vào, laser từ trời, khói lan tỏa xa và ngôi sao sáng lớn.\n" +
                          " • [#ffaa00]Mưa Kiếm (MK2/MK3):[] Mở khóa khi đạt MK2 hoặc MK3.\n" +
                          " • [#00e5ff]Trạng thái Abeta:[] Cộng dồn nhân sát thương theo cấp, triệu hồi kiếm nhỏ khi trúng đích.";

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table(); let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable); scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400); dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Truy xuất dữ liệu kỹ thuật");
    },

    config() { return java.lang.Integer(this.getTier()); },
    write(w){ this.super$write(w); w.b(this.getTier()); },
    read(r, revision){ this.super$read(r, revision); this.setTier(r.b()); }
});