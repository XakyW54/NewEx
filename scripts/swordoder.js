const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

const reqPerkA = { copper: 2000, lead: 2000, silicon: 2000 };
const reqPerkB = { titanium: 1000, thorium: 1000, graphite: 1000 };

// 1. Hàm vẽ thanh kiếm
function drawSword(x, y, rot, scale) {
    let swordLength = 18.0 * scale; 
    let swordWidth = 4.5 * scale;   
    let hiltWidth = 8.0 * scale;    

    let offset = 4.0 * scale;
    let originX = x - Angles.trnsx(rot, offset);
    let originY = y - Angles.trnsy(rot, offset);

    Draw.color(Color.valueOf("#ffe066")); 
    Draw.alpha(1.0);
    
    let tipX = originX + Angles.trnsx(rot, swordLength);
    let tipY = originY + Angles.trnsy(rot, swordLength);
    let backX = originX;
    let backY = originY;

    let leftX = originX + Angles.trnsx(rot + 90, swordWidth / 2);
    let leftY = originY + Angles.trnsy(rot + 90, swordWidth / 2);
    let rightX = originX + Angles.trnsx(rot - 90, swordWidth / 2);
    let rightY = originY + Angles.trnsy(rot - 90, swordWidth / 2);

    Fill.quad(tipX, tipY, leftX, leftY, backX, backY, rightX, rightY);

    Draw.color(Color.white);
    Lines.stroke(1.5 * scale);
    Lines.line(backX, backY, tipX, tipY);

    Draw.color(Color.valueOf("#ffaa00"));
    let hiltLeftX = originX + Angles.trnsx(rot + 90, hiltWidth / 2);
    let hiltLeftY = originY + Angles.trnsy(rot + 90, hiltWidth / 2);
    let hiltRightX = originX + Angles.trnsx(rot - 90, hiltWidth / 2);
    let hiltRightY = originY + Angles.trnsy(rot - 90, hiltWidth / 2);
    
    Lines.stroke(2.5 * scale);
    Lines.line(hiltLeftX, hiltLeftY, hiltRightX, hiltRightY);
}

// 2. Hàm gây sát thương vòng cung
function damageArc(team, x, y, rotation, radius, arcAngle, damageAmount) {
    let originX = x - Angles.trnsx(rotation, radius);
    let originY = y - Angles.trnsy(rotation, radius);
    
    let startAngle = rotation - arcAngle / 2;
    let steps = 18; 
    let angleStep = arcAngle / steps;
    let hitRadius = 50.0;

    for (let i = 0; i <= steps; i++) {
        let currentAngle = startAngle + angleStep * i;
        let px = originX + Angles.trnsx(currentAngle, radius);
        let py = originY + Angles.trnsy(currentAngle, radius);

        Damage.damage(team, px, py, hitRadius, damageAmount, true, true);
    }
}

// 3. Hiệu ứng nhát chém + Khói + Điện
const vSlashHitFx = new Effect(24, cons(e => {
    Draw.z(Layer.effect + 0.01);
    
    let fin = e.fin(); 
    let rot = e.rotation;
    
    let turretX = e.x;
    let turretY = e.y;

    let fxX = e.x + Angles.trnsx(rot, 15.0);
    let fxY = e.y + Angles.trnsy(rot, 15.0);

    let radius = 240.0;
    let arcAngle = 90.0;
    
    let originX = fxX - Angles.trnsx(rot, radius);
    let originY = fxY - Angles.trnsy(rot, radius);
    
    let startAngle = rot - arcAngle / 2;
    let endAngle = rot + arcAngle / 2;
    
    let currentAngle = startAngle + (endAngle - startAngle) * fin;
    let swordX = originX + Angles.trnsx(currentAngle, radius - 33.0);
    let swordY = originY + Angles.trnsy(currentAngle, radius - 33.0);
    
    let swordRot = currentAngle; 
    let scale = Math.max(0.0, 1.0 - fin) * 3.0;

    let alpha = 1.0 - fin;
    let headProgress = Math.min(1.0, fin * 1.2);
    let currentSweep = (startAngle + (endAngle - startAngle) * headProgress) - startAngle;

    // A. Vẽ vệt chém
    if (currentSweep > 0) {
        Draw.color(Color.valueOf("#ffe066"), Color.valueOf("#ff5500"), fin);
        Draw.alpha(alpha);
        Lines.stroke(36.0 * (scale / 3.0));
        Lines.arc(originX, originY, radius - 18.0, currentSweep / 360, startAngle);

        Draw.color(Color.white);
        Draw.alpha(alpha);
        Lines.stroke(15.0 * (scale / 3.0));
        Lines.arc(originX, originY, radius - 24.0, currentSweep / 360, startAngle);
    }

    // B. Khói
    let smokeCount = 20; 
    for (let i = 0; i <= smokeCount; i++) {
        let spawnProgress = i / smokeCount; 
        
        if (fin >= spawnProgress) {
            let stepAngle = startAngle + (endAngle - startAngle) * spawnProgress;
            let px = originX + Angles.trnsx(stepAngle, radius);
            let py = originY + Angles.trnsy(stepAngle, radius);

            let smokeSeed = e.id * 100 + i;
            let particleLife = (fin - spawnProgress) / (1.0 - spawnProgress + 0.0001);
            
            let baseAngle = stepAngle + 25.0; 
            let smAng = baseAngle + Mathf.randomSeed(smokeSeed, -30, 30);
            
            let flySpeed = 20.0 + Mathf.randomSeed(smokeSeed + 1, 0, 25);
            let flyDist = flySpeed * particleLife;
            
            let smX = px + Angles.trnsx(smAng, flyDist);
            let smY = py + Angles.trnsy(smAng, flyDist);

            let smSize = (2.5 + particleLife * 7.0 + Mathf.randomSeed(smokeSeed + 2, 0, 3));
            let smAlpha = alpha * (1.0 - particleLife) * 0.5;

            Draw.color(Color.gray, Color.darkGray, particleLife);
            Draw.alpha(Math.max(0.0, smAlpha));
            Fill.circle(smX, smY, smSize);

            if (Mathf.randomSeed(smokeSeed + 3, 0, 1) > 0.4) {
                Draw.color(Color.valueOf("#aee5ff"), Color.white, Mathf.randomSeed(smokeSeed + 4, 0, 1));
                Lines.stroke((1.5 + Mathf.randomSeed(smokeSeed + 5, 0, 1.5)) * (1.0 - particleLife));

                let sparkSeed = e.id * 1000 + i * 10 + Math.floor(fin * 15);
                let p1X = smX + Mathf.randomSeed(sparkSeed, -5, 5);
                let p1Y = smY + Mathf.randomSeed(sparkSeed + 1, -5, 5);
                let p2X = p1X + Mathf.randomSeed(sparkSeed + 2, -8, 8);
                let p2Y = p1Y + Mathf.randomSeed(sparkSeed + 3, -8, 8);

                Lines.line(p1X, p1Y, p2X, p2Y);
            }
        }
    }

    // C. Tia điện
    Draw.color(Color.valueOf("#aee5ff"), Color.white, Mathf.randomSeed(e.id + 99, 0, 1));
    Lines.stroke(2.5 * alpha);
    
    let beamLines = 3;
    for (let j = 0; j < beamLines; j++) {
        let beamSeed = e.id * 50 + j + Math.floor(fin * 20);
        let targetAngle = startAngle + (endAngle - startAngle) * Mathf.randomSeed(beamSeed, 0, fin);
        let targetX = originX + Angles.trnsx(targetAngle, radius);
        let targetY = originY + Angles.trnsy(targetAngle, radius);

        let midX = (turretX + targetX) / 2 + Mathf.randomSeed(beamSeed + 1, -20, 20);
        let midY = (turretY + targetY) / 2 + Mathf.randomSeed(beamSeed + 2, -20, 20);

        Lines.line(turretX, turretY, midX, midY);
        Lines.line(midX, midY, targetX, targetY);
    }

    // D. Thanh kiếm
    drawSword(swordX, swordY, swordRot, scale);

    Draw.reset();
}));

function triggerSlashArea(b) {
    if (b == null) return;
    
    let dataObj = b.data;
    if (dataObj != null && typeof dataObj === "object") {
        if (dataObj.slashed === true) return;
        dataObj.slashed = true;
        
        let mult = dataObj.mult !== undefined ? dataObj.mult : 1.0;
        let slashDmg = mult * 19.0;
        damageArc(b.team, b.x, b.y, b.rotation(), 240.0, 90.0, slashDmg);
    } else if (b.data === true) {
        return;
    } else {
        b.data = { slashed: true, mult: 1.0 };
        damageArc(b.team, b.x, b.y, b.rotation(), 240.0, 90.0, 19.0);
    }
}

const swordoderBulletBase = extend(BasicBulletType, {
    speed: 6,
    damage: 30,
    width: 10,
    height: 14,
    hitEffect: vSlashHitFx,
    despawnEffect: vSlashHitFx,
    buildingDamageMultiplier: 1.0,

    despawned(b) {
        this.super$despawned(b);
        triggerSlashArea(b);
    },

    collided(b, other) {
        let result = this.super$collided(b, other);
        triggerSlashArea(b);

        if (other != null && b.owner != null && typeof b.owner.handleSwordoderHit === "function") {
            b.owner.handleSwordoderHit(b, other);
        }
        return result;
    },

    draw(b) {
        Draw.z(Layer.bullet);
        drawSword(b.x, b.y, b.rotation(), 1.0);
        Draw.reset();
    }
});

const swordoder = extend(ItemTurret, "swordoder", {
    configurable: true
});

swordoder.health = 3600;
swordoder.range = 105;
swordoder.reload = 120;

swordoder.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null) {
        let val = Number(value);
        if (val >= 20) {
            tile.setPerkB(val - 20);
        } else if (val >= 10) {
            tile.setPerkA(val - 10);
        }
    }
}));

swordoder.buildType = () => extend(ItemTurret.ItemTurretBuild, swordoder, {
    created() {
        this.super$created();
        this.perkAState = 0;
        this.perkBState = 0;
        this.buff3BTimer = 0.0;
        this.subBulletTaskTimer = 0.0;
        this.pendingSubBullets = 0;
        return this;
    },

    getPerkA() { return this.perkAState || 0; },
    setPerkA(val) { this.perkAState = Number(val); },
    getPerkB() { return this.perkBState || 0; },
    setPerkB(val) { this.perkBState = Number(val); },

    range() {
        let perkA = this.getPerkA();
        let baseR = 105;
        if (perkA == 1) baseR = 105 * 1.5;
        if (perkA == 2) baseR = 105 * 1.2;
        if (perkA == 3) baseR = 105 * 0.7;
        return baseR;
    },

    handleSwordoderHit(bullet, target) {
        let perkA = this.getPerkA();

        if (perkA == 2 && target != null) {
            Damage.damage(this.team, target.x, target.y, 10, 10, true, true);
        }

        if (this.getPerkB() == 1 && Mathf.chance(0.15)) {
            this.fireExtraSubBullets(10, 8.0);
        }

        if (this.getPerkB() == 3 && Mathf.chance(0.30)) {
            this.buff3BTimer = 15 * 60;
        }
    },

    fireExtraSubBullets(count, spreadDeg) {
        let currentRange = this.range();
        let targetDist = Math.max(1.0, currentRange - 1.0);
        let perkA = this.getPerkA();
        let baseDmg = 30;
        let slashMultiplier = 1.0;

        if (perkA == 1) { baseDmg *= 1.5; slashMultiplier = 1.5; }
        else if (perkA == 2) { baseDmg *= 1.2; slashMultiplier = 1.2; }
        else if (perkA == 3) { baseDmg *= 3.0; slashMultiplier = 3.0; }

        for (let i = 0; i < count; i++) {
            let rndSpeed = Mathf.random(4.0, 10.0);
            let calculatedLifetime = targetDist / rndSpeed;
            let angle = this.rotation + Mathf.range(spreadDeg);
            
            let b = swordoderBulletBase.create(this, this.team, this.x, this.y, angle);
            if (b != null) {
                b.data = { slashed: false, mult: slashMultiplier };
                b.vel.setLength(rndSpeed);
                b.lifetime = calculatedLifetime;
                b.damage = baseDmg;
            }
        }
    },

    updateTile() {
        this.super$updateTile();

        if (this.buff3BTimer > 0) {
            this.buff3BTimer -= Time.delta;
        }

        // Xử lý đợt bắn thứ hai (bên góc +30 deg) sau 0.2s cho Phúc lợi 1B
        if (this.pendingSubBullets > 0) {
            this.subBulletTaskTimer -= Time.delta;
            if (this.subBulletTaskTimer <= 0) {
                this.fire1BSidePattern(30.0); // Bắn góc +30 độ
                this.pendingSubBullets = 0;
            }
        }

        let perkA = this.getPerkA();
        let baseReload = (perkA == 3) ? 60 : 120;
        let currentReload = (this.buff3BTimer > 0) ? (baseReload / 2.2) : baseReload;

        if (this.hasAmmo()) {
            if (this.timer.get(0, currentReload)) {
                this.findTarget();

                let isControlled = this.isControlled() || this.logicControlled();
                
                if (this.target != null) {
                    this.wasShooting = true;
                    this.turnToTarget(this.angleTo(this.target));
                    this.shoot(swordoderBulletBase);
                } else if (isControlled && this.isShooting) {
                    this.wasShooting = true;
                    this.shoot(swordoderBulletBase);
                } else {
                    this.wasShooting = false;
                }
            }
        }
    },

    // Hàm thực thi xả toàn bộ đạn Phúc lợi A theo góc nghiêng ấn định (Ví dụ +30° hoặc -30°)
    fire1BSidePattern(angleOffset) {
        let perkA = this.getPerkA();
        let baseDmg = 30;
        let bulletCount = 1;
        let spreadDeg = 0.0;
        let currentRange = this.range();
        let slashMultiplier = 1.0;

        let targetDist = Math.max(1.0, currentRange - 1.0);

        if (perkA == 1) {
            baseDmg *= 1.5;
            slashMultiplier = 1.5;
            bulletCount = 15;
            spreadDeg = 12.0;
        } else if (perkA == 2) {
            baseDmg *= 1.2;
            slashMultiplier = 1.2;
            bulletCount = 8;
            spreadDeg = 0.0;
        } else if (perkA == 3) {
            baseDmg *= 3.0;
            slashMultiplier = 3.0;
            bulletCount = 4;
            spreadDeg = 0.0;
        }

        if (this.targetPos != null && (this.target != null || this.isControlled())) {
            let distToTarget = Mathf.dst(this.x, this.y, this.targetPos.x, this.targetPos.y);
            targetDist = Math.min(distToTarget, targetDist);
        }

        let baseAngle = this.rotation + angleOffset;

        for (let i = 0; i < bulletCount; i++) {
            let rndSpeed = (bulletCount == 1) ? 6.0 : Mathf.random(3.0, 9.0);
            let calculatedLifetime = targetDist / rndSpeed;
            let angle = baseAngle + (spreadDeg > 0 ? Mathf.range(spreadDeg) : 0);

            let b = swordoderBulletBase.create(this, this.team, this.x, this.y, angle);
            if (b != null) {
                b.data = { slashed: false, mult: slashMultiplier };
                b.vel.setLength(rndSpeed);
                b.lifetime = calculatedLifetime;
                b.damage = baseDmg;
            }
        }
    },

    shoot(type) {
        let perkA = this.getPerkA();
        let perkB = this.getPerkB();

        // NẾU CÓ PHÚC LỢI 1B: ĐỔI HOÀN TOÀN CÁCH BẮN SANG 2 GÓC -30° VÀ +30°
        if (perkB == 1) {
            // Bắn đợt 1 ngay lập tức ở góc -30°
            this.fire1BSidePattern(-30.0);

            // Đặt lịch bắn đợt 2 ở góc +30° sau 0.2 giây (12 tick)
            this.pendingSubBullets = 1;
            this.subBulletTaskTimer = 12.0;

            return; // Thoát hàm shoot chính để hủy cách bắn thẳng
        }

        // CÁC TRƯỜNG HỢP BẮN BÌNH THƯỜNG (KHI KHÔNG CÓ PHÚC LỢI 1B)
        let baseDmg = 30;
        let bulletCount = 1;
        let spreadDeg = 0.0;
        let currentRange = this.range();
        let slashMultiplier = 1.0;

        let targetDist = Math.max(1.0, currentRange - 1.0);

        if (perkA == 1) {
            baseDmg *= 1.5;
            slashMultiplier = 1.5;
            bulletCount = 15;
            spreadDeg = 12.0;
        } else if (perkA == 2) {
            baseDmg *= 1.2;
            slashMultiplier = 1.2;
            bulletCount = 8;
            spreadDeg = 0.0;
        } else if (perkA == 3) {
            baseDmg *= 3.0;
            slashMultiplier = 3.0;
            bulletCount = 4;
            spreadDeg = 0.0;
        }

        // Kỹ năng phụ Phúc lợi 2B
        if (perkB == 2 && Mathf.chance(0.50)) {
            let healAmount = this.maxHealth;
            let excess = (this.health + healAmount) - this.maxHealth;
            this.health = Math.min(this.maxHealth, this.health + healAmount);

            if (excess > 0) {
                this.fireExtraSubBullets(20, 4.0);
            }
        }

        if (this.targetPos != null && (this.target != null || this.isControlled())) {
            let distToTarget = Mathf.dst(this.x, this.y, this.targetPos.x, this.targetPos.y);
            targetDist = Math.min(distToTarget, targetDist);
        }

        for (let i = 0; i < bulletCount; i++) {
            let rndSpeed = (bulletCount == 1) ? 6.0 : Mathf.random(3.0, 9.0);
            let calculatedLifetime = targetDist / rndSpeed;
            let angle = this.rotation + (spreadDeg > 0 ? Mathf.range(spreadDeg) : 0);

            let b = swordoderBulletBase.create(this, this.team, this.x, this.y, angle);
            if (b != null) {
                b.data = { slashed: false, mult: slashMultiplier };
                b.vel.setLength(rndSpeed);
                b.lifetime = calculatedLifetime;
                b.damage = baseDmg;
            }
        }
    },

    buildConfiguration(table) {
        table.clear();
        table.row();

        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Swordoder", {});

            let reqCell = dialog.cont.label(packProv(() => {
                let core = this.team.core();
                if (core == null) return "[red]Không tìm thấy Lõi Đội![]";

                let cCop = core.items.get(Items.copper);
                let cLea = core.items.get(Items.lead);
                let cSil = core.items.get(Items.silicon);
                let cTit = core.items.get(Items.titanium);
                let cTho = core.items.get(Items.thorium);
                let cGra = core.items.get(Items.graphite);

                let colCop = cCop >= reqPerkA.copper ? "[green]" : "[red]";
                let colLea = cLea >= reqPerkA.lead ? "[green]" : "[red]";
                let colSil = cSil >= reqPerkA.silicon ? "[green]" : "[red]";

                let colTit = cTit >= reqPerkB.titanium ? "[green]" : "[red]";
                let colTho = cTho >= reqPerkB.thorium ? "[green]" : "[red]";
                let colGra = cGra >= reqPerkB.graphite ? "[green]" : "[red]";

                return "[gold]YÊU CẦU TÀI NGUYÊN LÕI (CẤP MK1):[]\n" +
                       "[yellow]★ ROLL PHÚC LỢI A:[] Đồng: " + colCop + cCop + "[]/2000 | Chì: " + colLea + cLea + "[]/2000 | Silicon: " + colSil + cSil + "[]/2000\n" +
                       "[cyan]★ ROLL PHÚC LỢI B:[] Titan: " + colTit + cTit + "[]/1000 | Thorium: " + colTho + cTho + "[]/1000 | Than chì: " + colGra + cGra + "[]/1000\n" +
                       "[gray](Pháo Swordoder Mk1 nâng cấp trực tiếp qua hệ thống Phúc lợi)[]";
            }));

            reqCell.width(380).get().setWrap(true);
            reqCell.get().setAlignment(Align.left);
            dialog.cont.row();
            dialog.cont.add().height(10).row();

            let mainTable = new Table();

            let boxA = new Table();
            boxA.background(Styles.black6);
            boxA.margin(12);
            boxA.add("[yellow]★ ROLL PHÚC LỢI A (NGẪU NHIÊN) ★[]").row();

            let perkA = this.getPerkA();
            if (perkA == 0) {
                let txtADesc = boxA.add("Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi A:\n" +
                                        " • [green]Phúc lợi 1A:[] +50% Sát thương (Đạn 45, Chém 28.5), Tầm bắn +50% (157.5px), Shotgun 15 viên.\n" +
                                        " • [green]Phúc lợi 2A:[] +20% Sát thương (Đạn 36, Chém 22.8), Tầm bắn +20% (126px), Bắn 8 viên +10 Dmg lan.\n" +
                                        " • [green]Phúc lợi 3A:[] +200% Sát thương (Đạn 90, Chém 57), Tầm bắn -30% (73.5px), Bắn liên tiếp 4 viên + Nạp nhanh (1s).");
                txtADesc.width(340).get().setWrap(true);
                txtADesc.get().setAlignment(Align.left);
                boxA.row();

                boxA.button("[yellow]QUAY PHÚC LỢI A (2K Đồng/Chì/Silicon)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.copper) >= 2000 && core.items.get(Items.lead) >= 2000 && core.items.get(Items.silicon) >= 2000) {
                        core.items.remove(Items.copper, 2000);
                        core.items.remove(Items.lead, 2000);
                        core.items.remove(Items.silicon, 2000);

                        let res = Math.floor(Mathf.random(1, 3.99));
                        this.setPerkA(res);
                        this.configure(10 + res);

                        Fx.upgradeCore.at(this.x, this.y);
                        Effect.shake(4, 4, this.x, this.y);
                        Vars.ui.showInfo("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[yellow]PHÚC LỢI " + res + "A[]");
                        dialog.hide();
                        this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên roll Phúc lợi A![]");
                    }
                })).size(280, 40);
            } else {
                let txtA = "";
                if (perkA == 1) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1A\n• Sát thương Đạn +50% (45) | Chém +50% (28.5)\n• Tầm bắn +50% (157.5px)\n• Bắn Shotgun 15 viên[]";
                if (perkA == 2) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2A\n• Sát thương Đạn +20% (36) | Chém +20% (22.8)\n• Tầm bắn +20% (126px)\n• Bắn 8 viên + 10 Dmg lan[]";
                if (perkA == 3) txtA = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3A\n• Sát thương Đạn +200% (90) | Chém +200% (57)\n• Tầm bắn -30% (73.5px)\n• Bắn liên tiếp 4 viên + Nạp đạn nhanh (1s)[]";

                let txtACell = boxA.add(txtA);
                txtACell.width(340).get().setWrap(true);
                txtACell.get().setAlignment(Align.left);
            }

            mainTable.add(boxA).width(360).row();
            mainTable.add().height(12).row();

            let boxB = new Table();
            boxB.background(Styles.black6);
            boxB.margin(12);
            boxB.add("[cyan]★ ROLL PHÚC LỢI B (NGẪU NHIÊN) ★[]").row();

            let perkB = this.getPerkB();
            if (perkB == 0) {
                let txtBDesc = boxB.add("Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 3 phúc lợi B:\n" +
                                        " • [cyan]Phúc lợi 1B:[] Đổi hoàn toàn kiểu bắn sang 2 bên góc 30° (-30° trước, +30° sau 0.2s) + 15% Cơ hội bắn thêm 10 đạn phụ.\n" +
                                        " • [cyan]Phúc lợi 2B:[] 50% Cơ hội hồi 100% máu khi bắn (Hồi dư xả 20 đạn phụ).\n" +
                                        " • [cyan]Phúc lợi 3B:[] 30% Cơ hội tăng 120% Tốc độ bắn trong 15s khi trúng địch.");
                txtBDesc.width(340).get().setWrap(true);
                txtBDesc.get().setAlignment(Align.left);
                boxB.row();

                boxB.button("[cyan]QUAY PHÚC LỢI B (1K Titan/Thorium/Graphite)[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.titanium) >= 1000 && core.items.get(Items.thorium) >= 1000 && core.items.get(Items.graphite) >= 1000) {
                        core.items.remove(Items.titanium, 1000);
                        core.items.remove(Items.thorium, 1000);
                        core.items.remove(Items.graphite, 1000);

                        let res = Math.floor(Mathf.random(1, 3.99));
                        this.setPerkB(res);
                        this.configure(20 + res);

                        Fx.upgradeCore.at(this.x, this.y);
                        Effect.shake(4, 4, this.x, this.y);
                        Vars.ui.showInfo("[gold]BẠN ĐÃ ROLL TRÚNG:[]\n[cyan]PHÚC LỢI " + res + "B[]");
                        dialog.hide();
                        this.deselect();
                    } else {
                        Vars.ui.showInfo("[red]Không đủ tài nguyên roll Phúc lợi B![]");
                    }
                })).size(280, 40);
            } else {
                let txtB = "";
                if (perkB == 1) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1B\n• Đổi kiểu bắn sang 2 bên góc 30° (-30° -> 0.2s -> +30°)\n• Bắn nguyên chùm đạn của Phúc lợi A theo góc nghiêng\n• 15% Tỉ lệ bắn thêm 10 đạn phụ (Độ lệch 8°)[]";
                if (perkB == 2) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2B\n• 50% Tỉ lệ hồi 100% máu khi bắn\n• Nếu vượt Max HP: Bắn thêm 20 đạn phụ (Độ lệch 4°)[]";
                if (perkB == 3) txtB = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3B\n• 30% Tỉ lệ tăng 120% tốc độ bắn trong 15s khi trúng mục tiêu[]";

                let txtBCell = boxB.add(txtB);
                txtBCell.width(340).get().setWrap(true);
                txtBCell.get().setAlignment(Align.left);
            }

            mainTable.add(boxB).width(360);

            let scroll = new ScrollPane(mainTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton();
            dialog.show();
        })).size(50, 40).tooltip("Trung tâm nâng cấp pháo Swordoder");

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Swordoder Mk1 ";
            
            let descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN PHÁO SWORDODER (MK1) ⚡[]\n" +
                          "• Máu: 3,600 | Tầm bắn: 105px (13.1 ô) | Sát thương gốc: 30.0 + 19 (Chém)\n" +
                          "• Cơ chế gốc: Bắn 1 viên đạn đơn. Khi đạn chạm/despawn tạo vệt chém gây 19 sát thương diện rộng.\n" +
                          "• Nâng cấp: Nâng cấp trực tiếp chỉ số và kỹ năng qua hệ thống Phúc lợi A & B.";

            let perkA = this.getPerkA();
            let perkB = this.getPerkB();

            if (perkA > 0) {
                descStr += "\n\n[yellow]★ ĐÃ KÍCH HOẠT PHÚC LỢI A ★[]";
                if (perkA == 1) {
                    descStr += "\n[green]• Phúc lợi 1A: Sát thương Đạn +50% (45), Chém +50% (28.5), Tầm bắn +50% (157.5px), Shotgun 15 viên.[]";
                }
                if (perkA == 2) {
                    descStr += "\n[green]• Phúc lợi 2A: Sát thương Đạn +20% (36), Chém +20% (22.8), Tầm bắn +20% (126px), Bắn 8 viên + 10 Dmg lan.[]";
                }
                if (perkA == 3) {
                    descStr += "\n[green]• Phúc lợi 3A: Sát thương Đạn +200% (90), Chém +200% (57), Tầm bắn -30% (73.5px), Bắn liên tiếp 4 viên + Nạp nhanh (1s).[]";
                }
            }

            if (perkB > 0) {
                descStr += "\n\n[cyan]★ ĐÃ KÍCH HOẠT PHÚC LỢI B ★[]";
                if (perkB == 1) {
                    descStr += "\n[green]• Phúc lợi 1B: Đổi kiểu bắn sang 2 bên góc 30° (-30° bắn trước, +30° bắn sau 0.2s). Ghi đè kiểu bắn của Phúc lợi A![]\n" +
                               "  [gray]Kỹ năng đặc biệt: 15% cơ hội bắn bổ sung loạt 10 đạn phụ phân tán khi trúng mục tiêu.[]";
                }
                if (perkB == 2) {
                    descStr += "\n[green]• Phúc lợi 2B: Giữ nguyên các chỉ số cơ bản.[]\n" +
                               "  [gray]Kỹ năng đặc biệt: 50% cơ hội hồi 100% máu khi bắn. Nếu máu đã đầy, bắn xả thêm 20 đạn phụ.[]";
                }
                if (perkB == 3) {
                    descStr += "\n[green]• Phúc lợi 3B: Tốc độ bắn buff +120% khi kích hoạt.[]\n" +
                               "  [gray]Kỹ năng đặc biệt: 30% cơ hội tự kích hoạt buff siêu tốc độ bắn duy trì trong 15s mỗi khi bắn trúng địch.[]";
                }
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
        })).size(50, 40).tooltip("Xem thông số pháo Swordoder Mk1");
    },

    write(write) {
        this.super$write(write);
        write.b(this.getPerkA());
        write.b(this.getPerkB());
    },

    read(read, revision) {
        this.super$read(read, revision);
        this.setPerkA(read.b());
        this.setPerkB(read.b());
    }
});
