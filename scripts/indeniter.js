const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

 
if (typeof global !== "undefined") {
    if (!global.bemodStacks) global.bemodStacks = {};
    if (!global.cornerBuffedTurrets) global.cornerBuffedTurrets = {};
}

function getBemodStatus() {
    if (typeof bemod !== "undefined" && bemod != null) return bemod;
    return Vars.content.getByName(ContentType.status, "newex-bemod");
}

const reqMK2 = { titanium: 500, silicon: 300 };
const reqMK2B = { titanium: 800, silicon: 400, plastanium: 200 }; 
const reqSpecial = { copper: 4000, lead: 4000, silicon: 4000 };
 
const bulletCircleTrailFx = new Effect(12, cons(e => {
    Draw.z(Layer.bullet - 0.01);

    let col = Color.valueOf("#ffcc00");
    let randomMaxRadius = Mathf.randomSeed(e.id, 10, 20); 
    let currentRadius = randomMaxRadius * Interp.pow2Out.apply(e.fin()); 
    let alpha = 0.6 * (1.0 - e.fin());

    Draw.color(col);
    Draw.alpha(alpha * 0.4);
    Fill.circle(e.x, e.y, currentRadius);

    Draw.color(col);
    Draw.alpha(alpha); 
    Lines.stroke(3.0 * (1.0 - e.fin()));
    Lines.circle(e.x, e.y, currentRadius);

    Draw.reset();
}));

 
const buffTurretPulseFx = new Effect(40, cons(e => {
    Draw.z(Layer.effect + 0.05);

    let col = Color.valueOf("#00ffcc");
    
    let targetSize = (e.data != null && typeof e.data === "number") ? e.data : 16;
    let baseRadius = (targetSize * (2 / 3)) / 2; 

    let pulse = Math.sin(e.fin() * Math.PI * 2) * (baseRadius * 0.25); 
    let currentRadius = Math.max(2, baseRadius + pulse);
    let alpha = 0.8 * (1.0 - e.fin());

    Draw.color(col);
    Draw.alpha(alpha * 0.25);
    Fill.circle(e.x, e.y, currentRadius);

    Draw.color(col);
    Draw.alpha(alpha);
    Lines.stroke(2.0 * (1.0 - e.fin()));
    Lines.circle(e.x, e.y, currentRadius);

    Draw.reset();
}));
 
const hel = new Effect(35, cons(e => {
    Draw.z(Layer.effect + 0.01);

    if (e.data == null || typeof e.data.tx === "undefined") return;

    let x1 = e.x, y1 = e.y;
    let x2 = e.data.tx, y2 = e.data.ty;
    let alpha = 1.0 - e.fin();

    let colorRand = Mathf.randomSeed(e.id + Math.floor(e.fin() * 10));
    Draw.color(Color.valueOf("#00ffcc"), Color.valueOf("#ffffff"), colorRand);
    Lines.stroke(1.2 * alpha);

    let segments = 8;
    let lastX = x1, lastY = y1;

    for (let i = 1; i <= segments; i++) {
        let progress = i / segments;
        let nx = Mathf.lerp(x1, x2, progress);
        let ny = Mathf.lerp(y1, y2, progress);

        if (i < segments) {
            let offset = (1.0 - Math.abs(progress - 0.5) * 2) * 6.0;
            let randX = Mathf.randomSeed(e.id * 100 + i + Math.floor(e.fin() * 5), -offset, offset);
            let randY = Mathf.randomSeed(e.id * 200 + i + Math.floor(e.fin() * 5), -offset, offset);
            nx += randX;
            ny += randY;
        }

        Lines.line(lastX, lastY, nx, ny);
        
        let chanceRand = Mathf.randomSeed(e.id * 300 + i);
        if (chanceRand < 0.3) {
            Fill.circle(nx, ny, 1.0 * alpha);
        }

        lastX = nx;
        lastY = ny;
    }

    Draw.reset();
}));
 
function createExplosionEffect(radius, colorHex) {
    let col = colorHex ? Color.valueOf(colorHex) : Color.valueOf("#ff3300");
    return new Effect(50, cons(e => {
        Draw.z(Layer.effect + 0.1);
        let maxRadius = radius;
        let alpha = 1.0 - e.fin();

        Draw.color(col);
        Draw.alpha(alpha * 0.35);
        Fill.circle(e.x, e.y, maxRadius);

        Draw.color(col);
        Draw.alpha(alpha * 0.7);
        Lines.stroke(2.5 * alpha);
        Lines.circle(e.x, e.y, maxRadius);

        const ringColors = [
            Color.valueOf("#ffffff"), 
            Color.valueOf("#ffcc00"), 
            col 
        ];

        for (let i = 0; i < 3; i++) {
            let delay = i * 0.12;
            if (e.fin() > delay) {
                let progress = (e.fin() - delay) / (1.0 - delay);
                let smoothProgress = Interp.pow3Out.apply(progress);
                let dynamicRadius = maxRadius * smoothProgress;

                Draw.color(ringColors[i]);
                Draw.alpha(alpha * (1.0 - smoothProgress));
                Lines.stroke((14.0 - i * 3.0) * (1.0 - smoothProgress));
                Lines.circle(e.x, e.y, dynamicRadius);
            }
        }

        Draw.reset();
    }));
}

const fxNormal = createExplosionEffect(150);
const fxPerk3 = createExplosionEffect(225);
const fxPerk4 = createExplosionEffect(75);
const fxPerk5 = createExplosionEffect(150, "#00ffcc");
const fxPerk6 = createExplosionEffect(200, "#ff0055");
const fxCornerTurret = createExplosionEffect(50, "#ffaa00");
 
const perk5ShotgunBullet = extend(BasicBulletType, {
    speed: 11,
    damage: 18,
    lifetime: 30,
    width: 10,
    height: 14,
    pierce: true,
    pierceCap: 10,
    pierceBuilding: true,
    frontColor: Color.valueOf("#00ffff"),
    backColor: Color.valueOf("#0088ff"),
    hitEffect: Fx.hitBulletSmall,
    despawnEffect: Fx.hitBulletSmall
});
 
function triggerBemodExplosion(building, targetUnit, perkTier, isMK2, isSubExplosion, isCornerTurret) {
    if (targetUnit == null || !targetUnit.isValid()) return;

    let explosionX = targetUnit.x;
    let explosionY = targetUnit.y;

    let baseRadius = 150;
    let explosionRadius = baseRadius;
    if (isCornerTurret) explosionRadius = 50; 
    else if (perkTier == 3) explosionRadius = baseRadius * 1.50; 
    else if (perkTier == 4) explosionRadius = baseRadius * 0.50; 

    if (isCornerTurret) {
        fxCornerTurret.at(explosionX, explosionY);
    } else if (perkTier == 6) {
        fxPerk6.at(explosionX, explosionY);
    } else if (perkTier == 5) {
        fxPerk5.at(explosionX, explosionY);
    } else if (perkTier == 4) {
        fxPerk4.at(explosionX, explosionY);
    } else if (perkTier == 3) {
        fxPerk3.at(explosionX, explosionY);
    } else {
        if (typeof global !== "undefined" && global.bemodExplosionFx) {
            global.bemodExplosionFx.at(explosionX, explosionY);
        } else {
            fxNormal.at(explosionX, explosionY);
        }
    }
    Effect.shake(5, 5, explosionX, explosionY);

    let bemodStatus = getBemodStatus();

    targetUnit.unapply(bemodStatus);
    if (typeof global !== "undefined" && global.bemodStacks) {
        delete global.bemodStacks[targetUnit.id];
    }

    if (isCornerTurret) {
        Groups.unit.intersect(explosionX - 50, explosionY - 50, 100, 100, cons(nearUnit => {
            if (nearUnit != null && nearUnit.isValid() && nearUnit.within(explosionX, explosionY, 50) && nearUnit.team != building.team) {
                let totalDmg = 500 + (nearUnit.maxHealth * 0.02);
                nearUnit.damage(totalDmg);
            }
        }));
        return;
    }

    if (perkTier == 4) {
        Groups.unit.intersect(explosionX - explosionRadius, explosionY - explosionRadius, explosionRadius * 2, explosionRadius * 2, cons(nearUnit => {
            if (nearUnit != null && nearUnit.isValid() && nearUnit.within(explosionX, explosionY, explosionRadius) && nearUnit.team != building.team) {
                nearUnit.damage(500);
            }
        }));
    } else {
        let baseFlatDmg = isMK2 ? 500 : 100;
        let basePercentDmg = isMK2 ? 0.03 : 0.01;

        let dmgMult = 1.0;
        if (perkTier == 2) dmgMult = 2.5; 
        if (perkTier == 3) dmgMult = 1.5; 

        let finalFlatDmg = baseFlatDmg * dmgMult;
        let finalPercentDmg = basePercentDmg * dmgMult;

        let reqStacks = (perkTier == 1) ? 7 : 10;

        Groups.unit.intersect(explosionX - explosionRadius, explosionY - explosionRadius, explosionRadius * 2, explosionRadius * 2, cons(nearUnit => {
            if (nearUnit != null && nearUnit.isValid() && nearUnit.within(explosionX, explosionY, explosionRadius) && nearUnit.team != building.team) {
                
                let totalDamage = finalFlatDmg + (nearUnit.maxHealth * finalPercentDmg);
                nearUnit.damage(totalDamage);

                if (!isSubExplosion && bemodStatus != null) {
                    let addStacks = 0;
                    if (perkTier == 1) addStacks = 10; 
                    if (perkTier == 2) addStacks = 5;  
                    if (perkTier == 6) addStacks = 10;

                    if (addStacks > 0) {
                        nearUnit.apply(bemodStatus, 60 * 10);
                        let nid = nearUnit.id;
                        if (typeof global !== "undefined" && global.bemodStacks) {
                            global.bemodStacks[nid] = (global.bemodStacks[nid] || 0) + addStacks;

                            if (global.bemodStacks[nid] >= reqStacks) {
                                Time.run(1, packRun(() => {
                                    if (nearUnit != null && nearUnit.isValid()) {
                                        let subFlag = (perkTier == 6) ? false : true;
                                        triggerBemodExplosion(building, nearUnit, perkTier, isMK2, subFlag);
                                    }
                                }));
                            }
                        }
                    }
                }
            }
        }));
    }

    if (perkTier == 5) {
        for (let extra = 1; extra <= 2; extra++) {
            Time.run(extra * 12, packRun(() => {
                if (targetUnit != null) {
                    fxPerk5.at(explosionX, explosionY);
                    Effect.shake(3, 3, explosionX, explosionY);
                    
                    Groups.unit.intersect(explosionX - explosionRadius, explosionY - explosionRadius, explosionRadius * 2, explosionRadius * 2, cons(nearUnit => {
                        if (nearUnit != null && nearUnit.isValid() && nearUnit.within(explosionX, explosionY, explosionRadius) && nearUnit.team != building.team) {
                            nearUnit.damage(nearUnit.maxHealth * 0.10);
                        }
                    }));
                }
            }));
        }
    }

    if (perkTier == 4 && !isSubExplosion) {
        let furthestTarget = null;
        let maxDist = -1;

        Groups.unit.intersect(explosionX - 150, explosionY - 150, 300, 300, cons(nearUnit => {
            if (nearUnit != null && nearUnit.isValid() && nearUnit.id != targetUnit.id && nearUnit.within(explosionX, explosionY, 150) && nearUnit.team != building.team) {
                let dist = nearUnit.dst(explosionX, explosionY);
                if (dist > maxDist) {
                    maxDist = dist;
                    furthestTarget = nearUnit;
                }
            }
        }));

        if (furthestTarget != null) {
            if (bemodStatus != null) {
                furthestTarget.apply(bemodStatus, 60 * 10);
                if (typeof global !== "undefined" && global.bemodStacks) {
                    global.bemodStacks[furthestTarget.id] = 10;
                }
            }
            triggerBemodExplosion(building, furthestTarget, perkTier, isMK2, true);
        }
    }
}
 
function createCustomBulletType(baseProperties) {
    return extend(BasicBulletType, Object.assign({}, baseProperties, {
        hitEntity(b, other, initialHealth) {
            this.super$hitEntity(b, other, initialHealth);
            if (other != null && b.owner != null && typeof b.owner.handleBulletHit === "function") {
                b.owner.handleBulletHit(b, other);
            }
        }
    }));
}
 
const indeniterBullet = createCustomBulletType({
    speed: 8, damage: 9, lifetime: 35, width: 16, height: 16, 
    frontColor: Color.white, backColor: Color.valueOf("#ff6b35"),
    pierce: false, hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail,
    trailEffect: bulletCircleTrailFx,
    trailInterval: 3
});

const indeniterMK2Bullet = createCustomBulletType({
    speed: 9.5, damage: 12.15, lifetime: 40, width: 20, height: 20, 
    frontColor: Color.valueOf("#ffcc00"), backColor: Color.valueOf("#ff3300"),  
    pierce: false, hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail,
    trailEffect: bulletCircleTrailFx,
    trailInterval: 2.5
});

const indeniterMK2BBullet = createCustomBulletType({
    speed: 8.5, damage: 9, lifetime: 90, width: 20, height: 20, 
    frontColor: Color.white, backColor: Color.valueOf("#d63031"),
    pierce: false, homingPower: 0.25, homingRange: 350,
    hitEffect: Fx.disperseTrail, despawnEffect: Fx.disperseTrail,
    trailEffect: bulletCircleTrailFx,
    trailInterval: 2
});
 
const indeniter = extend(ItemTurret, "indeniter", {
    configurable: true
});

indeniter.ammo(Items.silicon, indeniterBullet);

indeniter.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null) {
        let val = Number(value);
        if (val >= 10) {
            tile.setPerkTier(val - 10);
        } else {
            tile.setTier(val);
        }
    }
}));

indeniter.buildType = () => extend(ItemTurret.ItemTurretBuild, indeniter, {
    created() {
        this.super$created();
        this.tierState = 0;
        this.perkTierState = 0;
        this.customRecoil = 0.0;
        this.nonRecoil = 0.0;
        this.shootingVisual = 0.0;
        this.energyCharge = 0.0;  
        this.isBursting = false;
        this.subBulletTimer = 0.0; 
        return this;
    },

    getPerkTier() {
        return (this.perkTierState == null) ? 0 : this.perkTierState;
    },

    setPerkTier(val) {
        this.perkTierState = Number(val);
        this.setTier(this.getTier());
    },

    peekAmmo(){
        let tier = this.getTier();
        if(tier == 1) return indeniterMK2Bullet;
        if(tier == 2) return indeniterMK2BBullet;
        return indeniterBullet;
    },

    getTier(){ 
        return (this.tierState == null) ? 0 : this.tierState; 
    },

    setTier(val){ 
        this.tierState = Number(val);
        this.isBursting = false;

        let perk = this.getPerkTier();
        let pMult = (perk == 3) ? 1.50 : 1.0;

        if(this.tierState == 0) { 
            this.health = Math.round(1200 * pMult); 
            this.reload = (60 / pMult);
        }
        if(this.tierState == 1) { 
            this.health = Math.round(1800 * pMult); 
            this.reload = (52 / pMult); 
        }
        if(this.tierState == 2) { 
            this.health = Math.round(1600 * pMult); 
            this.reload = (180 / pMult);
        }
        this.maxHealth = this.health;
    },

    range(){
        let tier = this.getTier();
        let baseR = 250;
        if(tier == 1) baseR = 350; 
        if(tier == 2) baseR = 750; 

        return (this.getPerkTier() == 3) ? baseR * 1.50 : baseR;
    },

    handleBulletHit(b, other) {
        if (other == null) return;
        let status = getBemodStatus();

        let perkTier = this.getPerkTier();
        let baseDmg = b.type.damage;
        let dmgMult = 1.0;
        if (perkTier == 1) dmgMult += 2.15; 
        if (perkTier == 3) dmgMult += 0.50; 
        if (perkTier == 6) dmgMult += 5.00;

        let finalDmg = baseDmg * dmgMult;
        other.damage(finalDmg);

        if (perkTier == 5) {
            if (Mathf.chance(0.80)) {
                let bulletType = this.peekAmmo();
                bulletType.create(this, this.team, this.x, this.y, this.rotation + Mathf.range(5));
            }

            if (Mathf.chance(0.10)) {
                for (let i = 0; i < 40; i++) {
                    let spreadAngle = this.rotation + Mathf.range(8);
                    let bullet = perk5ShotgunBullet.create(this, this.team, this.x, this.y, spreadAngle);
                    if (bullet != null) {
                        bullet.vel.setLength(Mathf.random(15, 45));
                    }
                }
            }
        }

        let chance = 0.30;
        let tier = this.getTier();
        if (tier == 1) chance = 0.45;
        if (tier == 2) chance = 1.00;

        if (perkTier == 3) chance = Math.min(1.0, chance * 1.50);

        if (Mathf.chance(chance) && status != null) {
            other.apply(status, 60 * 10);
            let id = other.id;
            if (typeof global !== "undefined" && global.bemodStacks) {
                global.bemodStacks[id] = (global.bemodStacks[id] || 0) + 1;

                let reqStacks = (perkTier == 1) ? 7 : 10;

                if (global.bemodStacks[id] >= reqStacks) {
                    triggerBemodExplosion(this, other, perkTier, tier == 1, false);
                }
            }
        }
    },

    shoot(type){
        if (!this.hasAmmo()) return;

        let tier = this.getTier();

        if (tier == 2) {
            if (this.isBursting) return;
            this.isBursting = true;
            
            for (let i = 0; i < 10; i++) {
                Time.run(i * 5, packRun(() => {
                    if (this.isValid() && this.hasAmmo()) {
                        this.super$shoot(type);
                        this.customRecoil = 1.0;
                        this.nonRecoil = 1.0;
                    }
                }));
            }

            Time.run(45, packRun(() => { if (this.isValid()) this.reloadCounter = 0; }));
            Time.run(225, packRun(() => { if (this.isValid()) this.isBursting = false; }));
        } else {
            this.super$shoot(type); 
            this.customRecoil = 1.0;
            this.nonRecoil = 1.0;
        }
    },

    updateTile(){
        this.super$updateTile();

        this.customRecoil = Mathf.approach(this.customRecoil, 0.0, 0.12 * Time.delta);
        this.nonRecoil = Mathf.approach(this.nonRecoil, 0.0, 0.12 * Time.delta);

        let isTargeting = (this.target != null || this.isShooting);
        let visualSpeed = 0.05 * Time.delta;
        if (isTargeting) {
            this.shootingVisual = Mathf.approach(this.shootingVisual, 1.0, visualSpeed);
        } else {
            this.shootingVisual = Mathf.approach(this.shootingVisual, 0.0, visualSpeed);
        }

            let activeShooting = (this.isShooting || this.isBursting) && this.hasAmmo();
        let chargeSpeed = activeShooting ? 0.1 * Time.delta : 0.08 * Time.delta;
        this.energyCharge = Mathf.approach(this.energyCharge, activeShooting ? 1.0 : 0.0, chargeSpeed);

        let perk = this.getPerkTier();

        if (perk == 4 && this.hasAmmo() && this.isShooting) {
            this.subBulletTimer += Time.delta;
            if (this.subBulletTimer >= 42) {
                this.subBulletTimer = 0;
                let bulletAngle = this.rotation;
                let offset = 4;
                let cos = Math.cos(bulletAngle * Mathf.degRad);
                let sin = Math.sin(bulletAngle * Mathf.degRad);

                let bulletType = this.peekAmmo();
                bulletType.create(this, this.team, this.x + sin * offset, this.y - cos * offset, bulletAngle);
                bulletType.create(this, this.team, this.x - sin * offset, this.y + cos * offset, bulletAngle);
            }
        } else {
            this.subBulletTimer = 0;
        }

        if (perk == 5 && this.timer.get(0, 300)) { 
            let candidates = [];
            let processedIds = {}; 

            let tileX = this.tileX();
            let tileY = this.tileY();
            let radiusTiles = 4; 

            for (let dx = -radiusTiles; dx <= radiusTiles; dx++) {
                for (let dy = -radiusTiles; dy <= radiusTiles; dy++) {
                    let otherBuild = Vars.world.build(tileX + dx, tileY + dy);

                    if (otherBuild != null && !processedIds[otherBuild.id]) {
                        processedIds[otherBuild.id] = true; 

                        if (otherBuild != this && otherBuild.team == this.team && otherBuild instanceof ItemTurret.ItemTurretBuild) {
                            let d = this.dst(otherBuild);
                            if (d <= 32.0) {
                                candidates.push({ build: otherBuild, dist: d });
                            }
                        }
                    }
                }
            }

            candidates.sort((a, b) => a.dist - b.dist);

            let limit = Math.min(4, candidates.length);
            for (let i = 0; i < limit; i++) {
                let targetBuild = candidates[i].build;
                if (typeof global !== "undefined" && global.cornerBuffedTurrets) {
                    global.cornerBuffedTurrets[targetBuild.id] = this;

                    let turretPixelSize = targetBuild.block.size * Vars.tilesize;
                    buffTurretPulseFx.at(targetBuild.x, targetBuild.y, 0, turretPixelSize);

                    hel.at(this.x, this.y, 0, { tx: targetBuild.x, ty: targetBuild.y });
                }
            }
        }
    },

buildConfiguration(table) {
    table.clear(); 
    table.row();

      table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
        let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Indeniter", {});
        
           let reqCell = dialog.cont.label(packProv(() => {
            let core = this.team.core();
            if (core == null) return "[red]Không tìm thấy Lõi Đội![]";
            let cCop = core.items.get(Items.copper);
            let cLea = core.items.get(Items.lead);
            let cTit = core.items.get(Items.titanium);
            let cSil = core.items.get(Items.silicon);
            let cPla = core.items.get(Items.plastanium);

            let copCol = cCop >= reqSpecial.copper ? "[green]" : "[red]";
            let leaCol = cLea >= reqSpecial.lead ? "[green]" : "[red]";
            let silColSp = cSil >= reqSpecial.silicon ? "[green]" : "[red]";

            let titColor1 = cTit >= reqMK2.titanium ? "[green]" : "[red]";
            let silColor1 = cSil >= reqMK2.silicon ? "[green]" : "[red]";
            
            let titColor2 = cTit >= reqMK2B.titanium ? "[green]" : "[red]";
            let silColor2 = cSil >= reqMK2B.silicon ? "[green]" : "[red]";
            let plaColor2 = cPla >= reqMK2B.plastanium ? "[green]" : "[red]";

            return "[gold]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                   "[orange]★ PHÚC LỢI ĐẶC BIỆT:[] Đồng: " + copCol + cCop + "[]/4000 | Chì: " + leaCol + cLea + "[]/4000 | Silicon: " + silColSp + cSil + "[]/4000\n" +
                   "[cyan]Nhánh MK2:[] Titan: " + titColor1 + cTit + "[]/" + reqMK2.titanium + " | Silicon: " + silColor1 + cSil + "[]/" + reqMK2.silicon + "\n" +
                   "[purple]Nhánh MK2B:[] Titan: " + titColor2 + cTit + "[]/" + reqMK2B.titanium + " | Silicon: " + silColor2 + cSil + "[]/" + reqMK2B.silicon + " | Nhựa: " + plaColor2 + cPla + "[]/" + reqMK2B.plastanium;
        }));
        
        reqCell.width(380).get().setWrap(true);
        reqCell.get().setAlignment(Align.left);
        dialog.cont.row(); 
        dialog.cont.add().height(10).row();

        let branchesTable = new Table();
 
        let spBox = new Table(); 
        spBox.background(Styles.black6); 
        spBox.margin(12);
        spBox.add("[gold]★ PHÚC LỢI NÂNG CẤP ĐẶC BIỆT (NGẪU NHIÊN) ★[]").row();

        let currentPerk = this.getPerkTier();
        let tier = this.getTier();

        if (currentPerk == 0) {
            let spD = spBox.add("Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 6 phúc lợi vĩnh viễn:\n" +
                                 " • [yellow]Phúc lợi 1 (~19.6%):[] +215% Sát thương, Nổ gán 10 tầng Bemod phụ, Giảm mốc nổ còn 7.\n" +
                                 " • [orange]Phúc lợi 2 (~29.4%):[] Nổ gán 5 tầng Bemod phụ diện rộng, +150% Sát thương vụ nổ.\n" +
                                 " • [cyan]Phúc lợi 3 (~19.6%):[] +50% Tất cả chỉ số (Dmg, Tỉ lệ, Tầm bắn, Phạm vi nổ).\n" +
                                 " • [purple]Phúc lợi 4 (~29.4%):[] Nổ 500 Dmg thuần, Nổ lây mục tiêu xa nhất 150px, Bắn đạn kép.\n" +
                                 " • [green]Phúc lợi 5 (1% SIÊU HIẾM):[] 80% Bắn thêm đạn, 10% Shotgun 40 viên, Nổ x3 lần, Buff cho 4 pháo đồng minh gần nhất (tia điện hel + vòng Zoom 2/3 size).\n" +
                                 " • [red]Phúc lợi 6 (1% SIÊU HIẾM):[] +500% Sát thương gốc, Vụ nổ Bemod gán ngay 10 tầng tạo chuỗi nổ dây chuyền vĩnh viễn!");
            spD.width(360).get().setWrap(true); 
            spD.get().setAlignment(Align.left); 
            spBox.row();

            spBox.button("[gold]QUAY PHÚC LỢI (4K Đồng/Chì/Silicon)[]", packRun(() => {
                let core = this.team.core();
                if (core != null && core.items.get(Items.copper) >= 4000 && core.items.get(Items.lead) >= 4000 && core.items.get(Items.silicon) >= 4000) {
                    core.items.remove(Items.copper, 4000); 
                    core.items.remove(Items.lead, 4000); 
                    core.items.remove(Items.silicon, 4000);
 
                    let rand = Mathf.random(100);
                    let resultPerk = 3; 

                    if (rand < 1.0) {
                        resultPerk = 5; 
                    } else if (rand < 2.0) {
                        resultPerk = 6; 
                    } else if (rand < 2.0 + 19.6) {
                        resultPerk = 1;
                    } else if (rand < 2.0 + 19.6 + 29.4) {
                        resultPerk = 2;
                    } else if (rand < 2.0 + 19.6 + 29.4 + 19.6) {
                        resultPerk = 3;
                    } else {
                        resultPerk = 4;
                    }

                    this.setPerkTier(resultPerk);
                    this.configure(10 + resultPerk); 

                    Fx.upgradeCore.at(this.x, this.y); 
                    Effect.shake(6, 6, this.x, this.y);

                    let perkName = "";
                    if (resultPerk == 1) perkName = "[yellow]PHÚC LỢI 1[]";
                    else if (resultPerk == 2) perkName = "[orange]PHÚC LỢI 2[]";
                    else if (resultPerk == 3) perkName = "[cyan]PHÚC LỢI 3[]";
                    else if (resultPerk == 4) perkName = "[purple]PHÚC LỢI 4[]";
                    else if (resultPerk == 5) perkName = "[green]★ PHÚC LỢI 5 (1% SIÊU HIẾM) ★[]";
                    else perkName = "[red]★ PHÚC LỢI 6 (1% SIÊU HIẾM) ★[]";

                    Vars.ui.showInfo("[gold]BẠN ĐÃ TRÚNG:[]\n" + perkName);

                    dialog.hide(); 
                    this.deselect();
                } else { 
                    Vars.ui.showInfo("[red]Không đủ tài nguyên cho Phúc Lợi Đặc Biệt![]"); 
                }
            })).size(300, 40);
        } else {
            let perkText = "";
            if (currentPerk == 1) perkText = "[yellow]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1\n• Sát thương +215%\n• Nổ gán 10 tầng Bemod phụ\n• Mốc nổ giảm còn 7 tầng[]";
            if (currentPerk == 2) perkText = "[orange]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2\n• Nổ gán 5 tầng Bemod phụ xung quanh\n• Sát thương nổ +150%[]";
            if (currentPerk == 3) perkText = "[cyan]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3\n• Tăng 50% Mọi chỉ số pháo & hiệu ứng nổ[]";
            if (currentPerk == 4) perkText = "[purple]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 4\n• Nổ 500 Dmg thuần (Bán kính 75px)\n• Nổ lây mục tiêu xa nhất 150px\n• Bắn đạn kép mỗi 0.7s[]";
            if (currentPerk == 5) perkText = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 5 (1% SIÊU HIẾM)\n• 80% Bắn thêm 1 đạn phụ\n• 10% Shotgun 40 viên, tốc độ ngẫu nhiên\n• Bemod nổ x3 lần (+10% Max HP)\n• Buff 4 pháo đồng minh gần nhất (Tia điện hel, nổ 500 Dmg + 2% Max HP)[]";
            if (currentPerk == 6) perkText = "[red]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 6 (1% SIÊU HIẾM)\n• Sát thương gốc +500%\n• Vụ nổ Bemod gán ngay 10 tầng Bemod tạo chuỗi nổ dây chuyền vĩnh viễn![]";

            let spD = spBox.add(perkText);
            spD.width(360).get().setWrap(true); 
            spD.get().setAlignment(Align.left);
        }

        branchesTable.add(spBox).width(360); 
        branchesTable.row();
        branchesTable.add().height(12).row();
 
        if (tier == 0) {
            let b1 = new Table(); 
            b1.background(Styles.black6); 
            b1.margin(12);
            b1.add("[cyan]===(MK2)===[]").row();
            let b1D = b1.add("Nâng cấp vi mạch gia tốc hỏa lực:\n" +
                             " • Tầm bắn tăng [green]350 pixel (+40%)[]\n" +
                             " • Sát thương tăng [green]12.15 (+35%)[]\n" +
                             " • Tốc độ bắn tăng [pink]+15%[]\n" +
                             " • Tỉ lệ gán Bemod: [yellow]45% (+15%)[]\n" +
                             " • Sát thương Bemod nổ: [red]500 + 3% Max HP[]");
            b1D.width(340).get().setWrap(true); 
            b1D.get().setAlignment(Align.left); 
            b1.row();
            b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                let core = this.team.core();
                if (core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon) {
                    core.items.remove(Items.titanium, reqMK2.titanium); 
                    core.items.remove(Items.silicon, reqMK2.silicon);
                    
                    this.setTier(1);
                    this.configure(1); 

                    Fx.upgradeCore.at(this.x, this.y); 
                    Fx.mineHuge.at(this.x, this.y); 
                    Effect.shake(4, 4, this.x, this.y);

                    dialog.hide(); 
                    this.deselect();
                } else { 
                    Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); 
                }
            })).size(180, 38);

            let b2 = new Table(); 
            b2.background(Styles.black6); 
            b2.margin(12);
            b2.add("[purple]===(MK2B)===[]").row();
            let b2D = b2.add("Cấu hình Oanh tạc Tầm xa Định vị:\n" +
                             " • Phạm vi bắn siêu xa [green]750 pixel (+200%)[]\n" +
                             " • Bắn loạt [orange]10 viên liên tiếp[] nghỉ [pink]3 giây[]\n" +
                             " • Đạn truy đuổi mục tiêu mạnh [red](homingPower = 0.25)[]\n" +
                             " • Tỉ lệ gán Bemod: [yellow]100% tuyệt đối[]");
            b2D.width(340).get().setWrap(true); 
            b2D.get().setAlignment(Align.left); 
            b2.row();
            b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                let core = this.team.core();
                if (core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium) {
                    core.items.remove(Items.titanium, reqMK2B.titanium); 
                    core.items.remove(Items.silicon, reqMK2B.silicon); 
                    core.items.remove(Items.plastanium, reqMK2B.plastanium);
                    
                    this.setTier(2);
                    this.configure(2); 

                    Fx.bigShockwave.at(this.x, this.y); 
                    Fx.mineHuge.at(this.x, this.y); 
                    Effect.shake(4, 4, this.x, this.y);

                    dialog.hide(); 
                    this.deselect();
                } else { 
                    Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); 
                }
            })).size(180, 38);

            branchesTable.add(b1).width(360); 
            branchesTable.row();
            branchesTable.add().height(12).row();
            branchesTable.add(b2).width(360);
        } else {
            let statusLabel = (tier == 1) ? "[cyan]ĐÃ NÂNG CẤP THÀNH PHÁO MK2[]" : "[purple]ĐÃ NÂNG CẤP THÀNH PHÁO MK2B[]";
            branchesTable.add(statusLabel).row();
        }

        let scroll = new ScrollPane(branchesTable);
        scroll.setScrollingDisabled(true, false);
        dialog.cont.add(scroll).maxHeight(420);
        dialog.addCloseButton(); 
        dialog.show();
    })).size(50, 40).tooltip("Nâng cấp hệ thống Indeniter");

 
    table.button(Icon.info, Styles.cleari, 40, packRun(() => {
        let title = " Thông số pháo Indeniter ";
        let descStr = "";
        let currentTier = this.getTier();

        if (currentTier == 0) descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n• Máu: 1,200 | Tầm bắn: 250px | Sát thương đạn: 9.0\n• Tỉ lệ gán Bemod: 30%";
        else if (currentTier == 1) descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n• Máu: 1,800 | Tầm bắn: 350px | Sát thương đạn: 12.15\n• Tỉ lệ gán Bemod: 45% | Nổ Bemod: 500 + 3% Max HP";
        else if (currentTier == 2) descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n• Máu: 1,600 | Tầm bắn: 750px | Sát thương đạn: 9.0\n• Chế độ: Bắn loạt 10 viên | Tỉ lệ gán Bemod: 100%";

        let perk = this.getPerkTier();
        if (perk > 0) {
            descStr += "\n\n[gold]★ ĐÃ KÍCH HOẠT PHÚC LỢI ĐẶC BIỆT ★[]";
            if (perk == 1) descStr += "\n[yellow]• Phúc lợi 1: Sát thương +215%, Nổ gán 10 tầng Bemod phụ, Giới hạn nổ: 7 tầng.[]";
            if (perk == 2) descStr += "\n[orange]• Phúc lợi 2: Nổ gán 5 tầng Bemod phụ xung quanh, Sát thương nổ +150%.[]";
            if (perk == 3) descStr += "\n[cyan]• Phúc lợi 3: +50% Mọi chỉ số pháo & hiệu ứng nổ.[]";
            if (perk == 4) descStr += "\n[purple]• Phúc lợi 4: Nổ 500 Dmg thuần (75px), Nổ lây mục tiêu xa nhất 150px, Bắn đạn kép mỗi 0.7s.[]";
            if (perk == 5) descStr += "\n[green]• Phúc lợi 5 (1%): 80% Bắn đạn phụ, 10% Shotgun 40 viên, Nổ x3 lần, Buff 4 pháo đồng minh gần nhất (Quét mỗi 5s + Tia điện hel & Vòng Zoom 2/3 size).[]";
            if (perk == 6) descStr += "\n[red]• Phúc lợi 6 (1%): +500% Sát thương gốc, Vụ nổ Bemod gán 10 tầng tạo chuỗi nổ dây chuyền vĩnh viễn![]";
        }

        let dialog = extend(BaseDialog, title, {});
        let infoTable = new Table();
        let cell = infoTable.add(descStr).width(360);
        cell.get().setWrap(true); 
        cell.get().setAlignment(Align.left);

        let scroll = new ScrollPane(infoTable);
        scroll.setScrollingDisabled(true, false);
        dialog.cont.add(scroll).maxHeight(400);
        dialog.addCloseButton(); 
        dialog.show();
    })).size(50, 40).tooltip("Xem thông số chi tiết hệ thống");
},
 



    config() { return this.getTier(); },

    draw(){
        let modName = this.block.name.split("-")[0]; 
        let baseRegion = Core.atlas.find(this.block.basePrefix + "" + this.block.size);
        
 
        if(baseRegion.found()){
            Draw.rect(baseRegion, this.x, this.y);
        } else {
            this.super$draw(); 
        }

        let rad = this.rotation * Mathf.degRad;
        let cos = Math.cos(rad);
        let sin = Math.sin(rad);

 
        let baseZ = Layer.turret;

 
        Draw.z(baseZ - 0.01);

 
        let wingSpread = this.shootingVisual * 15.0;

        let wing1Region = Core.atlas.find(modName + "-indeniter-wing1");
        if (wing1Region.found()) {
            let w1x = this.x - wingSpread * sin;
            let w1y = this.y + wingSpread * cos;
            Draw.rect(wing1Region, w1x, w1y, this.rotation);
        }

        let wing2Region = Core.atlas.find(modName + "-indeniter-wing2");
        if (wing2Region.found()) {
            let w2x = this.x + wingSpread * sin;
            let w2y = this.y - wingSpread * cos;
            Draw.rect(wing2Region, w2x, w2y, this.rotation);
        }

 
        let maxNonRecoilDistance = -8.0;
        let nonRecoilOffset = this.nonRecoil * maxNonRecoilDistance; 
        let nonBaseBack = -8.8; 
        let nonBaseLeft = 8.8;  

        let nonRegion = Core.atlas.find(modName + "-indeniter-non");
        if (nonRegion.found()) {
            let nonX = this.x + (nonBaseBack + nonRecoilOffset) * cos - nonBaseLeft * sin;
            let nonY = this.y + (nonBaseBack + nonRecoilOffset) * sin + nonBaseLeft * cos;
            
            Draw.rect(nonRegion, nonX, nonY, this.rotation);
        }

   
        Draw.z(baseZ);

        let barrel1Region = Core.atlas.find(modName + "-indeniter-barrel1");
        if(barrel1Region.found()) Draw.rect(barrel1Region, this.x, this.y, this.rotation);

        let barrel2Region = Core.atlas.find(modName + "-indeniter-barrel2");
        if(barrel2Region.found()) Draw.rect(barrel2Region, this.x, this.y, this.rotation);

        let b1Offset = this.customRecoil * -5.0;
        let b1Region = Core.atlas.find(modName + "-indeniter-b1");
        if (b1Region.found()) {
            let b1ax = this.x + b1Offset * cos;
            let b1ay = this.y + b1Offset * sin;
            Draw.rect(b1Region, b1ax, b1ay, this.rotation);
        }

            if (this.energyCharge > 0.001) {
            Draw.z(Layer.turret + 0.01);

 
            let bulletType = this.peekAmmo();
            let energyColor = bulletType.backColor ? bulletType.backColor : Color.valueOf("#ffcc00");

                    let barrelOffset = 14.0 + (this.customRecoil * -5.0); 
            let ballX = this.x + barrelOffset * cos;
            let ballY = this.y + barrelOffset * sin;

                    let pulse = Mathf.absin(Time.time, 3.0, 1.5);
            let baseRadius = (5.0 + pulse) * this.energyCharge;

                     Draw.color(energyColor);
            Draw.alpha(0.35 * this.energyCharge);
            Fill.circle(ballX, ballY, baseRadius * 1.8);

 
            Draw.color(energyColor);
            Draw.alpha(0.8 * this.energyCharge);
            Lines.stroke(1.5 * this.energyCharge);
            Lines.circle(ballX, ballY, baseRadius * 1.3);
 
            Draw.color(Color.white);
            Draw.alpha(0.9 * this.energyCharge);
            Fill.circle(ballX, ballY, baseRadius * 0.7);
        }

        Draw.reset();
    },

    write(write){ 
        this.super$write(write); 
        write.b(this.getTier()); 
        write.b(this.getPerkTier());
    },
    read(read, revision){ 
        this.super$read(read, revision); 
        this.setTier(read.b()); 
        if (revision >= 1) {
            this.setPerkTier(read.b());
        } else {
            this.perkTierState = 0;
        }
        this.customRecoil = 0.0;
        this.nonRecoil = 0.0;
        this.shootingVisual = 0.0;
        this.energyCharge = 0.0;
        this.isBursting = false;
        this.subBulletTimer = 0.0;
    }
});
 
Events.on(UnitDamageEvent, cons(e => {
    let unit = e.unit;
    if (unit == null || !unit.isValid()) return;

    if (typeof global !== "undefined" && global.cornerBuffedTurrets) {
        Groups.build.each(cons(build => {
            let sourceIndeniter = global.cornerBuffedTurrets[build.id];
            
            if (build != null && build.isValid() && sourceIndeniter != null && sourceIndeniter.isValid()) {
                if (unit.team != build.team && build.team == sourceIndeniter.team && build.dst(unit) <= build.range() + 20) {
                    let status = getBemodStatus();
                    
                    if (status != null && Mathf.chance(0.35)) { 
                        unit.apply(status, 60 * 10);
                        let id = unit.id;
                        
                        if (global.bemodStacks) {
                            global.bemodStacks[id] = (global.bemodStacks[id] || 0) + 1;
                            
                            if (global.bemodStacks[id] >= 10) {
                                triggerBemodExplosion(build, unit, 0, false, true, true);
                            }
                        }
                    }
                }
            }
        }));
    }
}));