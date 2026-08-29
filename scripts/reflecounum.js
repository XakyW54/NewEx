 const packRun = (fn) => new java.lang.Runnable({ run: fn });
const packProv = (fn) => new Packages.arc.func.Prov({ get: fn });
const packCons2 = (fn) => new Cons2({ get: fn });
const packBoolf = (fn) => new Packages.arc.func.Boolf({ get: fn });
const packFloatp = (fn) => new Packages.arc.func.Floatp({ get: fn });
const packFunc = (fn) => new Packages.arc.func.Func({ get: fn });

 const reqMK2 = { titanium: 400, silicon: 300, thorium: 200 };
const reqMK2B = { titanium: 600, silicon: 500, plastanium: 350, surgeAlloy: 150 };
const reqSpecial = { copper: 4000, lead: 4000, silicon: 4000 };

 const reflectorColor = Color.valueOf("#d000ff");
const reflectorGlow = Color.valueOf("#00f0ff");

 const perk4Bullet = extend(BasicBulletType, {
    speed: 8,
    damage: 30,
    lifetime: 180,
    homingPower: 0.20,
    homingRange: 300,
    pierce: true,
    pierceCap: 4,
    frontColor: reflectorGlow,
    backColor: Color.white
});

const perk6Bullet = extend(BasicBulletType, {
    speed: 18,
    damage: 150,
    lifetime: 60,
    homingPower: 0.15,
    homingRange: 400,
    pierce: true,
    pierceCap: 20,
    splashDamage: 120,
    splashDamageRadius: 20,
    frontColor: reflectorColor,
    backColor: Color.white
});

 const reflectEffect = new Effect(15, e => {
    Draw.color(reflectorGlow, reflectorColor, e.fout());
    Lines.stroke(e.fout() * 2.5);
    Lines.poly(e.x, e.y, 6, e.fin() * 12);
});

const shockwaveFx = new Effect(30, e => {
    Draw.color(reflectorColor, reflectorGlow, e.fout());
    Lines.stroke(e.fout() * 3);
    Lines.circle(e.x, e.y, e.fin() * 200);
    Draw.reset();
});

 const reflecounum = extend(Turret, "reflecounum", {
    size: 3,
    health: 2400,
    hasPower: true,
    hasItems: true,
    configurable: true,
    saveConfig: true,

    init() {
        this.super$init();
    }
});

 reflecounum.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null) {
        let val = Number(value);
        if (val >= 10) {
            tile.setPerkTier(val - 10);
        } else {
            tile.setTier(val);
        }
    }
}));

reflecounum.buildType = () => extend(Turret.TurretBuild, reflecounum, {
    
    created() {
        this.super$created();
        this._tier = 0;                  
        this._perkTier = 0;              
        this._maxShieldHp = 5000;        
        this._shieldHp = 5000;           
        this._absorbedDamage = 0;        
        this._shieldBroken = false;      
        this._cooldownTimer = 0;         
        this._hitTimer = 0;              
        
        this._perk1Timer = 0;
        this._perk2Timer = 0;
        this._rebuildTimer = 0;
        this._perk5Timer = 0;
        this._perk6Absorbed = 0;
        this._orbitingBullets = [];      

        this.updateMaxShield();
        this._shieldHp = this._maxShieldHp;
    },

     getMaxShieldHp() {
        if (this._maxShieldHp === undefined || isNaN(this._maxShieldHp) || this._maxShieldHp <= 0) {
            this.updateMaxShield();
        }
        return this._maxShieldHp || 5000;
    },

    getShieldHp() {
        if (this._shieldHp === undefined || isNaN(this._shieldHp)) {
            this._shieldHp = this.getMaxShieldHp();
        }
        return Math.max(0, this._shieldHp);
    },

    isShieldBroken() {
        return !!this._shieldBroken;
    },

    getTier() {
        return this._tier !== undefined ? this._tier : 0;
    },

    setTier(val) {
        this._tier = Number(val);
        this.updateMaxShield();
    },

    getPerkTier() {
        return this._perkTier !== undefined ? this._perkTier : 0;
    },

    setPerkTier(val) {
        this._perkTier = Number(val);
        this.updateMaxShield();
    },

    damageShield(amount) {
        if (this.isShieldBroken()) return;
        
        this._shieldHp = (this.getShieldHp()) - amount;
        this._absorbedDamage = (this._absorbedDamage || 0) + amount;
        
        if (this._shieldHp <= 0) {
            this._shieldHp = 0;
            this._shieldBroken = true;
            this._cooldownTimer = 0;
            Fx.shieldBreak.at(this.x, this.y, this.getShieldRadius(), reflectorColor);
        }
    },

    getShieldRadius() {
        let baseRadius = (reflecounum.size * Vars.tilesize) / 2 + 8;
        let perkMult = 1.0;
        let p = this.getPerkTier();

        if (p === 1) perkMult += 1.50;      
        else if (p === 2) perkMult += 0.50; 
        else if (p === 3) perkMult += 0.30; 
        else if (p === 4) perkMult += 1.00; 
        else if (p === 5) perkMult += 2.00; 
        else if (p === 6) perkMult += 2.00; 

        return baseRadius * perkMult;
    },

    updateMaxShield() {
        let t = this.getTier();
        let baseMax = 5000;
        if (t === 1) baseMax = 7500;       
        else if (t === 2) baseMax = 15000; 

        let perkMult = 1.0;
        let p = this.getPerkTier();
        if (p === 1) perkMult += 0.50;      
        else if (p === 2) perkMult += 0.90; 
        else if (p === 3) perkMult += 0.30; 
        else if (p === 4) perkMult += 1.00; 
        else if (p === 5) perkMult += 3.00; 
        else if (p === 6) perkMult += 3.00; 

        let oldMax = this._maxShieldHp || baseMax;
        this._maxShieldHp = baseMax * perkMult;

        if (this._shieldHp === undefined) {
            this._shieldHp = this._maxShieldHp;
        } else if (!this._shieldBroken) {
            this._shieldHp = Math.min(this._maxShieldHp, (this._shieldHp / oldMax) * this._maxShieldHp);
        }
    },

    getAbsorbRatio() {
        let t = this.getTier();
        if (t === 1) return 0.80; 
        if (t === 2) return 0.40; 
        return 0.50;             
    },

    getReflectingChance() {
        let t = this.getTier();
        if (t === 1) return 0.75; 
        if (t === 2) return 1.00; 
        return 0.60;             
    },

    updateTile() {
        this.super$updateTile();

        if (this._hitTimer > 0) {
            this._hitTimer -= Time.delta;
        }

        if (this.isShieldBroken()) {
            this._shieldHp = 0;
            this._cooldownTimer += Time.delta;
            
            if (this._cooldownTimer >= 300) {
                this.updateMaxShield();
                this._shieldBroken = false;
                this._shieldHp = this.getMaxShieldHp();
                this._cooldownTimer = 0;
                Fx.shieldWave.at(this.x, this.y, this.getShieldRadius(), reflectorColor);
            }
            return;
        }

        let perk = this.getPerkTier();
        let currentRadius = this.getShieldRadius();

         if (perk === 1) {
            this._perk1Timer += Time.delta;
            if (this._perk1Timer >= 30) {
                this._perk1Timer = 0;
                Units.nearby(this.team, this.x, this.y, 200, cons(u => {
                    if (u != null && u.isValid()) {
                        u.heal(u.maxHealth * 0.10);
                        Fx.heal.at(u.x, u.y);
                    }
                }));
            }
        }

         if (perk === 2) {
            this._perk2Timer += Time.delta;
            if (this._perk2Timer >= 60) {
                this._perk2Timer = 0;
                Vars.indexer.eachBlock(this.team, this.x, this.y, 350, packBoolf(b => b.damaged()), cons(b => {
                    b.heal(b.maxHealth * 0.05);
                    Fx.healBlock.at(b.x, b.y);
                }));
            }

            if (this._rebuildTimer === undefined) this._rebuildTimer = 0;
            this._rebuildTimer += Time.delta;

            if (this._rebuildTimer >= 300) {
                let teamData = this.team.data();
                if (teamData != null && teamData.plans != null && teamData.plans.size > 0) {
                    let range = 350;
                    let rebuiltAny = false;

                    for (let i = teamData.plans.size - 1; i >= 0; i--) {
                        let plan = teamData.plans.get(i);
                        
                        if (plan != null && plan.block != null) {
                            let wx = plan.x * Vars.tilesize;
                            let wy = plan.y * Vars.tilesize;

                            if (Mathf.within(this.x, this.y, wx, wy, range)) {
                                let tile = Vars.world.tile(plan.x, plan.y);
                                
                                if (tile != null) {
                                    if (tile.block() === plan.block) {
                                        teamData.plans.remove(i);
                                        continue; 
                                    }

                                    tile.setNet(plan.block, this.team, plan.rotation);

                                    Fx.chainLightning.at(this.x, this.y, 0, reflectorGlow, new Vec2(wx, wy));
                                    Fx.placeBlock.at(wx, wy, plan.block.size);

                                    teamData.plans.remove(i);
                                    rebuiltAny = true;
                                    break; 
                                }
                            }
                        }
                    }

                    if (rebuiltAny) {
                        this._rebuildTimer = 0;
                    }
                }
            }
        }

         if (perk === 5) {
            this._perk5Timer += Time.delta;
            if (this._perk5Timer >= 300) {
                this._perk5Timer = 0;
                Units.nearby(this.team, this.x, this.y, 500, cons(u => {
                    if (u != null && u.isValid()) {
                        u.heal(u.maxHealth * 0.10);
                        Fx.heal.at(u.x, u.y);
                    }
                }));

                Vars.indexer.eachBlock(this.team, this.x, this.y, 500, packBoolf(b => b.damaged()), cons(b => {
                    if (b != null && b.isValid()) {
                        b.heal(b.maxHealth * 0.10);
                        Fx.healBlock.at(b.x, b.y);
                    }
                }));
            }
        }

         if (!this.isShieldBroken() && Groups.bullet != null && Groups.bullet.size() > 0) {
            try {
                Groups.bullet.intersect(this.x - currentRadius, this.y - currentRadius, currentRadius * 2, currentRadius * 2, cons(b => {
                    if (this.isShieldBroken()) return;

                    if (b != null && b.team != this.team && b.type != null && Mathf.within(this.x, this.y, b.x, b.y, currentRadius)) {
                        
                        this._hitTimer = 25;
                        let rawDamage = b.damage;
                        let absorbRatio = this.getAbsorbRatio();
                        let absorbed = rawDamage * absorbRatio;

                        this.damageShield(absorbed);

                        if (this.isShieldBroken()) return;

                         if (perk === 3 && (this._absorbedDamage || 0) >= 1000) {
                            shockwaveFx.at(this.x, this.y);
                            Units.nearbyEnemies(this.team, this.x, this.y, 200, cons(enemy => {
                                if (enemy != null && enemy.isValid()) enemy.damage(100);
                            }));
                            Units.nearby(this.team, this.x, this.y, 200, cons(ally => {
                                if (ally != null && ally.isValid()) ally.heal(100);
                            }));
                            Vars.indexer.eachBlock(this.team, this.x, this.y, 200, packBoolf(b => true), cons(build => {
                                if (build != null && build.isValid()) build.heal(100);
                            }));
                        }

                         if (perk === 6) {
                            this._perk6Absorbed = (this._perk6Absorbed || 0) + absorbed;
                            if (this._perk6Absorbed >= 100 && this._orbitingBullets.length < 8) {
                                this._orbitingBullets.push(true);
                                this._perk6Absorbed -= 100;
                            }

                            if ((this._absorbedDamage || 0) >= 1000 && this._orbitingBullets.length >= 8) {
                                let target = Units.bestTarget(this.team, this.x, this.y, 600, e => true, b => true, (unit, x, y) => -unit.maxHealth);
                                let targetX = target ? target.x : this.x + 100;
                                let targetY = target ? target.y : this.y + 100;

                                for (let i = 0; i < 8; i++) {
                                    let angle = (i / 8) * 360;
                                    let bx = this.x + Mathf.cosDeg(angle) * 20;
                                    let by = this.y + Mathf.sinDeg(angle) * 20;
                                    perk6Bullet.create(this, this.team, bx, by, Angles.angle(bx, by, targetX, targetY));
                                }
                                this._orbitingBullets = [];
                            }
                        }

                         if ((this._absorbedDamage || 0) >= 1000) {
                            this._absorbedDamage -= 1000;
                        }

                         if (Mathf.chance(this.getReflectingChance())) {
                            let oldX = b.x;
                            let oldY = b.y;
                            let oldRot = b.rotation();

                            if (perk === 4) {
                                b.remove();
                                let target = Units.closestEnemy(this.team, oldX, oldY, 300, e => true);
                                let targetAngle = target ? Angles.angle(oldX, oldY, target.x, target.y) : oldRot + 180;

                                perk4Bullet.damage = rawDamage;
                                perk4Bullet.create(this, this.team, oldX, oldY, targetAngle);
                            } else {
                                b.team = this.team;
                                b.rotation(oldRot + 180);
                                b.vel.trns(oldRot + 180, b.vel.len());
                            }

                            reflectEffect.at(oldX, oldY, oldRot);
                        } else {
                            b.remove();
                        }
                    }
                }));
            } catch (err) {
             }
        }
    },

     draw() {
        this.super$draw();

        let currentRadius = this.getShieldRadius();

        if (!this.isShieldBroken() && this.getShieldHp() > 0) {
            Draw.z(Layer.shields);

            let isHit = this._hitTimer > 0;
            let hitFactor = isHit ? (this._hitTimer / 25) : 0;

            let coreAlpha = 0.08 + (hitFactor * 0.25);
            Draw.color(isHit ? reflectorGlow : reflectorColor, coreAlpha);
            Fill.poly(this.x, this.y, 6, currentRadius);

            Lines.stroke(isHit ? 2.8 : 1.5);
            Draw.color(isHit ? Color.white : reflectorColor, 0.8 + (hitFactor * 0.2));
            Lines.poly(this.x, this.y, 6, currentRadius);

            Draw.color(reflectorGlow, 0.5 + (hitFactor * 0.5));
            Lines.stroke(1.0);
            Lines.poly(this.x, this.y, 6, currentRadius - 3);

            if (isHit) {
                Draw.color(reflectorGlow, hitFactor);
                Lines.stroke(1.2);
                
                let innerRad = currentRadius * 0.65;
                Lines.poly(this.x, this.y, 6, innerRad);

                for (let i = 0; i < 6; i++) {
                    let a1 = i * 60;
                    let a2 = (i + 1) * 60;
                    Lines.line(
                        this.x + Mathf.cosDeg(a1) * innerRad,
                        this.y + Mathf.sinDeg(a1) * innerRad,
                        this.x + Mathf.cosDeg(a2) * currentRadius,
                        this.y + Mathf.sinDeg(a2) * currentRadius
                    );
                }
            }

            if (this.getPerkTier() === 6 && this._orbitingBullets.length > 0) {
                Draw.color(reflectorGlow);
                for (let i = 0; i < this._orbitingBullets.length; i++) {
                    let angle = (i / 8) * 360 + Time.time * 2;
                    let bx = this.x + Mathf.cosDeg(angle) * 20;
                    let by = this.y + Mathf.sinDeg(angle) * 20;
                    Fill.circle(bx, by, 3.5);
                }
            }

            Draw.reset();
        }
    },

    buildConfiguration(table) {
        table.clear(); table.row();
        let tier = this.getTier();

        table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
            let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Reflecounum", {});
            
            let reqCell = dialog.cont.label(packProv(() => {
                let core = this.team.core();
                if (core == null) return "[red]Không tìm thấy Lõi Đội![]";

                let currentCopper = core.items.get(Items.copper);
                let currentLead = core.items.get(Items.lead);
                let currentTitanium = core.items.get(Items.titanium);
                let currentSilicon = core.items.get(Items.silicon);
                let currentThorium = core.items.get(Items.thorium);
                let currentPlastanium = core.items.get(Items.plastanium);
                let currentSurge = core.items.get(Items.surgeAlloy);

                let copCol = currentCopper >= reqSpecial.copper ? "[green]" : "[red]";
                let leaCol = currentLead >= reqSpecial.lead ? "[green]" : "[red]";
                let silColSp = currentSilicon >= reqSpecial.silicon ? "[green]" : "[red]";

                let titColor1 = currentTitanium >= reqMK2.titanium ? "[green]" : "[red]";
                let silColor1 = currentSilicon >= reqMK2.silicon ? "[green]" : "[red]";
                let thoColor1 = currentThorium >= reqMK2.thorium ? "[green]" : "[red]";

                let titColor2 = currentTitanium >= reqMK2B.titanium ? "[green]" : "[red]";
                let silColor2 = currentSilicon >= reqMK2B.silicon ? "[green]" : "[red]";
                let plaColor2 = currentPlastanium >= reqMK2B.plastanium ? "[green]" : "[red]";
                let surColor2 = currentSurge >= reqMK2B.surgeAlloy ? "[green]" : "[red]";

                return "[gold]YÊU CẦU TÀI NGUYÊN KHO LÕI:[]\n" +
                       "[orange]★ PHÚC LỢI ĐẶC BIỆT:[] Đồng: " + copCol + currentCopper + "[]/4000 | Chì: " + leaCol + currentLead + "[]/4000 | Silicon: " + silColSp + currentSilicon + "[]/4000\n" +
                       "[cyan]Nhánh MK2:[] Titan: " + titColor1 + currentTitanium + "[]/" + reqMK2.titanium + " | Silicon: " + silColor1 + currentSilicon + "[]/" + reqMK2.silicon + " | Thorium: " + thoColor1 + currentThorium + "[]/" + reqMK2.thorium + "\n" +
                       "[purple]Nhánh MK2B:[] Titan: " + titColor2 + currentTitanium + "[]/" + reqMK2B.titanium + " | Silicon: " + silColor2 + currentSilicon + "[]/" + reqMK2B.silicon + " | Nhựa: " + plaColor2 + currentPlastanium + "[]/" + reqMK2B.plastanium + " | Surge: " + surColor2 + currentSurge + "[]/" + reqMK2B.surgeAlloy;
            }));
            
            reqCell.width(380).get().setWrap(true);
            reqCell.get().setAlignment(Align.left);
            dialog.cont.row(); dialog.cont.add().height(10).row();

            let branchesTable = new Table();

            let spBox = new Table(); 
            spBox.background(Styles.black6); 
            spBox.margin(12);
            spBox.add("[gold]★ PHÚC LỢI NÂNG CẤP ĐẶC BIỆT (NGẪU NHIÊN) ★[]").row();

            let currentPerk = this.getPerkTier();

            if (currentPerk == 0) {
                let spD = spBox.add("Kích hoạt giao thức nâng cấp ngẫu nhiên nhận 1 trong 6 phúc lợi vĩnh viễn:\n" +
                                     " • [yellow]Phúc lợi 1 (~19.6%):[] Bán kính khiên +150%, HP khiên +50%, Hồi 10% HP/0.5s cho Unit trong 200px.\n" +
                                     " • [orange]Phúc lợi 2 (~29.4%):[] Bán kính khiên +50%, HP khiên +90%, Tự động xây lại tường & pháo bị nổ trong 350px (mỗi 5s).\n" +
                                     " • [cyan]Phúc lợi 3 (~19.6%):[] Bán kính khiên +30%, HP khiên +30%, Tích 1000 Dmg nổ sóng âm 100 Dmg (200px) & hồi 100 HP cho đồng minh.\n" +
                                     " • [purple]Phúc lợi 4 (~29.4%):[] Bán kính khiên +100%, HP khiên +100%, Đạn phản có Truy đuổi & Xuyên thấu 4.\n" +
                                     " • [green]Phúc lợi 5 (1% SIÊU HIẾM):[] Bán kính khiên +200%, HP khiên +300%, Hồi 10% HP/5s trong 500px, Chia sẻ 50% Dmg từ đồng minh vào khiên.\n" +
                                     " • [red]Phúc lợi 6 (1% SIÊU HIẾM):[] Bán kính khiên +200%, HP khiên +300%, Tích 100 Dmg đẻ 1 đạn năng lượng quanh pháo, Đủ 1000 Dmg bắn 8 đạn xé gió mục tiêu HP cao nhất!");
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
                if (currentPerk == 1) perkText = "[yellow]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 1\n• Bán kính khiên +150%\n• Độ bền khiên +50%\n• Hồi 10% HP/0.5s cho Unit đồng minh trong 200px[]";
                if (currentPerk == 2) perkText = "[orange]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 2\n• Bán kính khiên +50%\n• Độ bền khiên +90%\n• Tự động xây lại tường & pháo bị hủy hoàn toàn trong 350px (mỗi 5s)[]";
                if (currentPerk == 3) perkText = "[cyan]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 3\n• Bán kính khiên +30%\n• Độ bền khiên +30%\n• Tích 1000 Dmg nổ sóng âm 100 Dmg (200px) & hồi 100 HP cho đồng minh[]";
                if (currentPerk == 4) perkText = "[purple]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 4\n• Bán kính khiên +100%\n• Độ bền khiên +100%\n• Đạn phản ngược có Truy đuổi & Xuyên thấu 4[]";
                if (currentPerk == 5) perkText = "[green]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 5 (1% SIÊU HIẾM)\n• Bán kính khiên +200%\n• Độ bền khiên +300%\n• Hồi 10% HP/5s cho Unit & Công trình trong 500px\n• Chia sẻ 50% Dmg nhận vào từ đồng minh trong 250px[]";
                if (currentPerk == 6) perkText = "[red]✔ ĐÃ KÍCH HOẠT: PHÚC LỢI 6 (1% SIÊU HIẾM)\n• Bán kính khiên +200%\n• Độ bền khiên +300%\n• Đủ 1000 Dmg hấp thụ bắn 8 đạn năng lượng xé gió (Xuyên 20, Splash Dmg 20px) vào mục tiêu HP cao nhất![]";

                let spD = spBox.add(perkText);
                spD.width(360).get().setWrap(true); 
                spD.get().setAlignment(Align.left);
            }

            branchesTable.add(spBox).width(360); 
            branchesTable.row();
            branchesTable.add().height(12).row();

            if (tier == 0) {
                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(MK2 - TRỐNG THỦ KHIÊN)===[]").row();
                let b1D = b1.add("[white]• Hấp thụ sát thương khiên: [green]80%[] (+30%)\n" +
                                 "• Độ bền khiên gốc: [green]7,500 HP[] (+50%)\n" +
                                 "• Tỷ lệ phản ngược đạn: [yellow]75%[] (+15%)\n" +
                                 "• Thời gian hồi khi khiên vỡ: [white]5.0 giây[]");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.titanium) >= reqMK2.titanium && core.items.get(Items.silicon) >= reqMK2.silicon && core.items.get(Items.thorium) >= reqMK2.thorium) {
                        core.items.remove(Items.titanium, reqMK2.titanium); 
                        core.items.remove(Items.silicon, reqMK2.silicon);
                        core.items.remove(Items.thorium, reqMK2.thorium);
                        
                        Fx.upgradeCore.at(this.x, this.y); Fx.shieldWave.at(this.x, this.y, this.getShieldRadius(), reflectorColor); Effect.shake(4, 4, this.x, this.y);
                        this.setTier(1);
                        this.configure(1);
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(MK2B - PHẢN XẠ TUYỆT ĐỐI)===[]").row();
                let b2D = b2.add("[white]• Hấp thụ sát thương khiên: [red]40%[] (-10%)\n" +
                                 "• Độ bền khiên gốc: [green]15,000 HP[] (+200%)\n" +
                                 "• Tỷ lệ phản ngược đạn: [gold]100% TUYỆT ĐỐI[]\n" +
                                 "• Thời gian hồi khi khiên vỡ: [green]2.0 giây[] (Siêu tốc)");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if (core != null && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon && core.items.get(Items.plastanium) >= reqMK2B.plastanium && core.items.get(Items.surgeAlloy) >= reqMK2B.surgeAlloy) {
                        core.items.remove(Items.titanium, reqMK2B.titanium); 
                        core.items.remove(Items.silicon, reqMK2B.silicon); 
                        core.items.remove(Items.plastanium, reqMK2B.plastanium);
                        core.items.remove(Items.surgeAlloy, reqMK2B.surgeAlloy);
                        
                        Fx.bigShockwave.at(this.x, this.y); Fx.shieldWave.at(this.x, this.y, this.getShieldRadius(), reflectorColor); Effect.shake(4, 4, this.x, this.y);
                        this.setTier(2);
                        this.configure(2);
                        dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); }
                })).size(180, 38);

                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);
            } else {
                let statusLabel = (tier == 1) ? "[cyan]ĐÃ NÂNG CẤP THÀNH PHÁO MK2[]" : "[purple]ĐÃ NÂNG CẤP THÀNH PHÁO MK2B[]";
                branchesTable.add(statusLabel).row();
            }

            let scroll = new ScrollPane(branchesTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(420);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Nâng cấp hệ thống Reflecounum");

        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Reflecounum ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1) ⚡[]\n• Độ bền khiên: 5,000 HP | Tỷ lệ hấp thụ: 50%\n• Tỷ lệ phản đạn: 60% | Tái nạp khi vỡ: 5.0s";
            else if (currentTier == 1) descStr = "[cyan]⚡ THÔNG SỐ CƠ BẢN (MK2) ⚡[]\n• Độ bền khiên: 7,500 HP | Tỷ lệ hấp thụ: 80%\n• Tỷ lệ phản đạn: 75% | Tái nạp khi vỡ: 5.0s";
            else if (currentTier == 2) descStr = "[purple]⚡ THÔNG SỐ CƠ BẢN (MK2B) ⚡[]\n• Độ bền khiên: 15,000 HP | Tỷ lệ hấp thụ: 40%\n• Tỷ lệ phản đạn: 100% TUYỆT ĐỐI | Tái nạp khi vỡ: 2.0s";

            let perk = this.getPerkTier();
            if (perk > 0) {
                descStr += "\n\n[gold]★ ĐÃ KÍCH HOẠT PHÚC LỢI ĐẶC BIỆT ★[]";
                if (perk == 1) descStr += "\n[yellow]• Phúc lợi 1: Bán kính khiên +150%, HP khiên +50%, Hồi 10% HP/0.5s cho Unit trong 200px.[]";
                if (perk == 2) descStr += "\n[orange]• Phúc lợi 2: Bán kính khiên +50%, HP khiên +90%, Tự động xây lại tường & pháo bị hủy hoàn toàn trong 350px (mỗi 5s).[]";
                if (perk == 3) descStr += "\n[cyan]• Phúc lợi 3: Bán kính khiên +30%, HP khiên +30%, Tích 1000 Dmg nổ sóng âm 100 Dmg & hồi 100 HP cho đồng minh.[]";
                if (perk == 4) descStr += "\n[purple]• Phúc lợi 4: Bán kính khiên +100%, HP khiên +100%, Đạn phản ngược có Truy đuổi & Xuyên 4.[]";
                if (perk == 5) descStr += "\n[green]• Phúc lợi 5 (1%): Bán kính khiên +200%, HP khiên +300%, Hồi 10% HP/5s trong 500px, Chia sẻ 50% Dmg từ đồng minh vào khiên.[]";
                if (perk == 6) descStr += "\n[red]• Phúc lợi 6 (1%): Bán kính khiên +200%, HP khiên +300%, Tích 1000 Dmg bắn 8 đạn xé gió mục tiêu HP cao nhất.[]";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            let cell = infoTable.add(descStr).width(360);
            cell.get().setWrap(true); cell.get().setAlignment(Align.left);
            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).maxHeight(400);
            dialog.addCloseButton(); dialog.show();
        })).size(50, 40).tooltip("Xem thông số chi tiết pháo");
    },

    write(write) {
        this.super$write(write);
        write.b(this.getTier());
        write.b(this.getPerkTier());
        write.f(this.getShieldHp());
        write.f(this._absorbedDamage !== undefined ? this._absorbedDamage : 0);
        write.bool(this.isShieldBroken());
    },

    read(read, revision) {
        this.super$read(read, revision);
        this.setTier(read.b());
        if (revision >= 1) {
            this.setPerkTier(read.b());
        } else {
            this._perkTier = 0;
        }
        this._shieldHp = read.f();
        this._absorbedDamage = read.f();
        this._shieldBroken = read.bool();
        
        this.updateMaxShield();
        if (isNaN(this._shieldHp)) this._shieldHp = this.getMaxShieldHp();
    }
});

 reflecounum.addBar("shield", packFunc(e => {
    return new Bar(
         packProv(() => {
            if (!e) return "Khiên: 0 / 0";
            if (typeof e.isShieldBroken === "function" && e.isShieldBroken()) return "Khiên: [ĐÃ VỠ]";
            
            let cur = (typeof e.getShieldHp === "function") ? Math.floor(e.getShieldHp()) : 0;
            let max = (typeof e.getMaxShieldHp === "function") ? Math.floor(e.getMaxShieldHp()) : 5000;
            
            return "Khiên: " + cur + " / " + max;
        }),
         packProv(() => (e && typeof e.isShieldBroken === "function" && e.isShieldBroken()) ? Color.gray : reflectorColor),
         packFloatp(() => {
            if (!e || (typeof e.isShieldBroken === "function" && e.isShieldBroken())) return 0.0;
            let cur = (typeof e.getShieldHp === "function") ? e.getShieldHp() : 0;
            let max = (typeof e.getMaxShieldHp === "function") ? e.getMaxShieldHp() : 5000;
            if (max <= 0) return 0.0;
            
            return Math.max(0.0, Math.min(1.0, cur / max));
        })
    );
}));

 Events.on(UnitDamageEvent, cons(e => {
    let unit = e.unit;
    if (unit == null || !unit.isValid()) return;

    let range = 250;
    Vars.indexer.eachBlock(unit.team, unit.x, unit.y, range, packBoolf(b => true), cons(build => {
        if (build != null && build.isValid()) {
            if (typeof build.damageShield === "function" && typeof build.getPerkTier === "function" && typeof build.isShieldBroken === "function") {
                if (build.getPerkTier() === 5 && !build.isShieldBroken()) {
                    let sharedDmg = e.amount * 0.50;
                    build.damageShield(sharedDmg);
                }
            }
        }
    }));
}));