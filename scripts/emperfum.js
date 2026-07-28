/* EMPERFUM TURRET SYSTEM - CUSTOM DISTORTED MUZZLE RINGS */

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// Chi phí nâng cấp
const reqMK2 = { surgeAlloy: 500, plastanium: 1200, copper: 9000 };
const reqMK2B = { thorium: 1900, titanium: 2400, silicon: 3100 };

// ==========================================
// --- HÀM VẼ HÌNH TRÒN MÉO (TỪ BLIXALUM) ---
// ==========================================
function drawWindRing(cx, cy, radiusX, radiusY, angle, strokeWidth, color){
    Draw.color(color); 
    Lines.stroke(strokeWidth);
    let steps = 12; let lastX = 0, lastY = 0;
    let rad = angle * Mathf.degRad;
    let cosA = Math.cos(rad); let sinA = Math.sin(rad);
    
    for(let i = 0; i <= steps; i++){
        let a = (i * (360 / steps)) * Mathf.degRad;
        let lx = Math.cos(a) * radiusX; let ly = Math.sin(a) * radiusY;
        let rx = cx + (lx * cosA - ly * sinA); let ry = cy + (lx * sinA + ly * cosA);
        if(i > 0) Lines.line(lastX, lastY, rx, ry);
        lastX = rx; lastY = ry;
    }
    Draw.reset();
}

// ==========================================
// --- HIỆU ỨNG TÙY CHỈNH (CUSTOM EFFECTS) ---
// ==========================================

const emperfumMuzzleEffect = new Effect(20, e => {
    let tColor = e.data || Color.valueOf("#80deea");
    let baseAngle = e.rotation;
    
    // Vòng 1 & 2
    let offset1 = 12 - (e.fin() * 18); 
    let bx1 = e.x + Angles.trnsx(baseAngle, offset1);
    let by1 = e.y + Angles.trnsy(baseAngle, offset1);
    drawWindRing(bx1, by1, 3.0 + (e.fin() * 5.0), e.fin() * 15.0, baseAngle, 2.2 * e.fout(), tColor);

    let offset2 = 18 - (e.fin() * 26);
    let bx2 = e.x + Angles.trnsx(baseAngle, offset2);
    let by2 = e.y + Angles.trnsy(baseAngle, offset2);
    drawWindRing(bx2, by2, 4.0 + (e.fin() * 7.0), e.fin() * 22.0, baseAngle, 1.8 * e.fout(), Color.white);

    // Vòng 3: Bắt đầu từ 35px, lùi về 15px trước nòng (Kích thước lớn hơn vòng 4)
    let offset3 = 35 - (e.fin() * 20); 
    let bx3 = e.x + Angles.trnsx(baseAngle, offset3);
    let by3 = e.y + Angles.trnsy(baseAngle, offset3);
    let zoomX3 = 2.0 + (e.fin() * 10.0);
    let zoomY3 = e.fin() * 28.0;
    drawWindRing(bx3, by3, zoomX3, zoomY3, baseAngle, 2.0 * e.fout(), tColor);

    // Vòng 4: Bắt đầu từ 55px, lùi về 15px trước nòng (Kích thước nhỏ hơn vòng 3)
    let offset4 = 55 - (e.fin() * 40); 
    let bx4 = e.x + Angles.trnsx(baseAngle, offset4);
    let by4 = e.y + Angles.trnsy(baseAngle, offset4);
    let zoomX4 = 1.0 + (e.fin() * 7.0);
    let zoomY4 = e.fin() * 20.0;
    drawWindRing(bx4, by4, zoomX4, zoomY4, baseAngle, 1.6 * e.fout(), Color.white);
});

// Flash vòng tròn khi đẻ đạn
const clusterFlashEffect = new Effect(18, e => {
    Draw.color(Color.white, Color.valueOf("#80deea"), e.fin());
    Lines.stroke(e.fout() * 4);
    Lines.circle(e.x, e.y, e.finpow() * 28);
    Draw.color(Color.valueOf("#00bcd4"));
    Lines.stroke(e.fout() * 2);
    Lines.circle(e.x, e.y, e.finpow() * 16);
    Draw.reset();
});

// ==========================================
// --- KHAI BÁO CÁC LOẠI ĐẠN ---
// ==========================================

const emperfumMicroBullet = extend(BasicBulletType, {
    speed: 4, drag: 0.025, damage: 350, splashDamage: 750,
    splashDamageRadius: 45, homingPower: 0.2, homingRange: 120,
    width: 4, height: 8, lifetime: 20,
    frontColor: Color.valueOf("#ffffff"), backColor: Color.valueOf("#e0f7fa"),
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    collidesAir: false, collidesGround: true, collidesTiles: true, collides: true,
    pierce: true, pierceCap: 15
});

const emperfumMicroBulletAir = extend(BasicBulletType, {
    speed: 4, drag: 0.025, damage: 822.5, splashDamage: 1762.5,
    splashDamageRadius: 45, homingPower: 0.25, homingRange: 150,
    width: 5, height: 10, lifetime: 20,
    frontColor: Color.valueOf("#ffffff"), backColor: Color.valueOf("#ff80ab"),
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    collidesAir: true, collidesGround: false, collidesTiles: false, collides: true,
    pierce: true, pierceCap: 15
});

const emperfumSubBullet = extend(BasicBulletType, {
    speed: 6, drag: 0.03, damage: 400, splashDamage: 750,
    splashDamageRadius: 45, homingPower: 0.15, homingRange: 160,
    width: 6, height: 12, lifetime: 24,
    frontColor: Color.valueOf("#e0f7fa"), backColor: Color.valueOf("#00bcd4"),
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    collidesAir: false, collidesGround: true, collidesTiles: true, collides: true,
    pierce: true, pierceCap: 15,

    despawned(b){
        if(Mathf.chance(0.8)){
            clusterFlashEffect.at(b.x, b.y);
            let ownerEntity = b.owner || b;
            for(let i = 0; i < 40; i++){
                let angle = (360 / 40) * i + Mathf.range(5);
                let micro = emperfumMicroBullet.create(ownerEntity, b.team, b.x, b.y, angle);
                if(micro != null){
                    micro.vel.setLength(Mathf.random(3.0, 7.0));
                    micro.lifetime = Mathf.random(10, 20);
                }
            }
        }
    },
    hit(b, x, y){ if(b.collided.size >= this.pierceCap) this.despawned(b); },
    hitTile(b, build, x, y, initialHealth, direct){
        this.super$hitTile(b, build, x, y, initialHealth, direct);
        if(b.collided.size >= this.pierceCap) this.despawned(b);
    }
});

const emperfumSubBulletAir = extend(BasicBulletType, {
    speed: 7, drag: 0.03, damage: 940, splashDamage: 1762.5,
    splashDamageRadius: 45, homingPower: 0.2, homingRange: 200,
    width: 7, height: 14, lifetime: 24,
    frontColor: Color.valueOf("#ff80ab"), backColor: Color.valueOf("#c2185b"),
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    collidesAir: true, collidesGround: false, collidesTiles: false, collides: true,
    pierce: true, pierceCap: 15,

    despawned(b){
        if(Mathf.chance(0.8)){
            clusterFlashEffect.at(b.x, b.y);
            let ownerEntity = b.owner || b;
            for(let i = 0; i < 40; i++){
                let angle = (360 / 40) * i + Mathf.range(5);
                let micro = emperfumMicroBulletAir.create(ownerEntity, b.team, b.x, b.y, angle);
                if(micro != null){
                    micro.vel.setLength(Mathf.random(3.0, 7.0));
                    micro.lifetime = Mathf.random(10, 20);
                }
            }
        }
    },
    hit(b, x, y){ if(b.collided.size >= this.pierceCap) this.despawned(b); },
    hitTile(b, build, x, y, initialHealth, direct){
        this.super$hitTile(b, build, x, y, initialHealth, direct);
        if(b.collided.size >= this.pierceCap) this.despawned(b);
    }
});

function spawnSubBulletsRandom(b, bulletType, count, minSpeed, maxSpeed, minLife, maxLife) {
    clusterFlashEffect.at(b.x, b.y);
    let ownerEntity = b.owner || b;
    for(let i = 0; i < count; i++){
        let angle = (360 / count) * i + Mathf.range(4);
        let child = bulletType.create(ownerEntity, b.team, b.x + Angles.trnsx(angle, 4), b.y + Angles.trnsy(angle, 4), angle);
        if(child != null){
            child.vel.setLength(Mathf.random(minSpeed, maxSpeed));
            child.lifetime = Mathf.random(minLife, maxLife);
        }
    }
}

const emperfumClusterBullet = extend(BasicBulletType, {
    speed: 7, drag: 0.03, damage: 450, splashDamage: 750, splashDamageRadius: 45,
    width: 10, height: 20, lifetime: 22,
    frontColor: Color.valueOf("#80deea"), backColor: Color.valueOf("#00bcd4"),
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    collidesAir: false, collidesGround: true, collidesTiles: true, collides: true,
    pierce: true, pierceCap: 15,

    despawned(b){ spawnSubBulletsRandom(b, emperfumSubBullet, 8, 4.0, 8.5, 12, 24); },
    hit(b, x, y){ if(b.collided.size >= this.pierceCap) spawnSubBulletsRandom(b, emperfumSubBullet, 8, 4.0, 8.5, 12, 24); },
    hitTile(b, build, x, y, initialHealth, direct){
        this.super$hitTile(b, build, x, y, initialHealth, direct);
        if(b.collided.size >= this.pierceCap) spawnSubBulletsRandom(b, emperfumSubBullet, 8, 4.0, 8.5, 12, 24);
    }
});

const emperfumClusterBulletAir = extend(BasicBulletType, {
    speed: 8, drag: 0.03, damage: 1057.5, splashDamage: 1762.5, splashDamageRadius: 45,
    width: 12, height: 24, lifetime: 22,
    frontColor: Color.valueOf("#ff80ab"), backColor: Color.valueOf("#880e4f"),
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    collidesAir: true, collidesGround: false, collidesTiles: false, collides: true,
    pierce: true, pierceCap: 15,

    despawned(b){ spawnSubBulletsRandom(b, emperfumSubBulletAir, 8, 4.0, 8.5, 12, 24); },
    hit(b, x, y){ if(b.collided.size >= this.pierceCap) spawnSubBulletsRandom(b, emperfumSubBulletAir, 8, 4.0, 8.5, 12, 24); },
    hitTile(b, build, x, y, initialHealth, direct){
        this.super$hitTile(b, build, x, y, initialHealth, direct);
        if(b.collided.size >= this.pierceCap) spawnSubBulletsRandom(b, emperfumSubBulletAir, 8, 4.0, 8.5, 12, 24);
    }
});

const emperfumMainBulletMK1 = extend(BasicBulletType, {
    speed: 18, drag: 0.035, damage: 500, splashDamageRadius: 15,
    width: 20, height: 40, lifetime: 120,
    frontColor: Color.valueOf("#ffffff"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 4, trailLength: 10,
    hitEffect: Fx.hitBulletColor, despawnEffect: Fx.hitBulletColor,
    collidesAir: true, collidesGround: true, collidesTiles: true, collides: true,
    pierce: true, pierceCap: 15,

    draw(b) {
        this.super$draw(b);
        let bAngle = b.rotation();
        let travelProgress = ((b.time * 0.08)) % 1.0;
        let fout = 1.0 - travelProgress; 
        let offset = 16.0 - (travelProgress * 30.0);
        let rx = b.x + Angles.trnsx(bAngle, offset);
        let ry = b.y + Angles.trnsy(bAngle, offset);
        let zoomFactor = travelProgress * 1.5; 
        if (fout > 0.05) drawWindRing(rx, ry, 3.0 + zoomFactor * 5.0, 6.0 + zoomFactor * 10.0, bAngle, 2.0 * fout, Color.valueOf("#80deea"));
    },

    despawned(b){ spawnSubBulletsRandom(b, emperfumClusterBullet, 12, 5.0, 9.5, 15, 28); },
    hit(b, x, y){ 
        spawnSubBulletsRandom(b, emperfumClusterBullet, 12, 5.0, 9.5, 15, 28);
        b.remove();
    },
    hitTile(b, build, x, y, initialHealth, direct){
        this.super$hitTile(b, build, x, y, initialHealth, direct);
        spawnSubBulletsRandom(b, emperfumClusterBullet, 12, 5.0, 9.5, 15, 28);
        b.remove();
    }
});

const emperfumMainBulletMK2 = extend(BasicBulletType, {
    speed: 18, drag: 0.0, damage: 500, splashDamage: 750, splashDamageRadius: 45,
    width: 20, height: 40, lifetime: 120,
    frontColor: Color.valueOf("#ffffff"), backColor: Color.valueOf("#00bcd4"),
    trailColor: Color.valueOf("#80deea"), trailWidth: 4, trailLength: 10,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    collidesAir: false, collidesGround: true, collidesTiles: true, collides: true,
    pierce: true, pierceCap: 15,

    draw(b) {
        this.super$draw(b);
        let bAngle = b.rotation();
        let travelProgress = ((b.time * 0.08)) % 1.0;
        let fout = 1.0 - travelProgress; 
        let offset = 16.0 - (travelProgress * 30.0);
        let rx = b.x + Angles.trnsx(bAngle, offset);
        let ry = b.y + Angles.trnsy(bAngle, offset);
        let zoomFactor = travelProgress * 1.5; 
        if (fout > 0.05) drawWindRing(rx, ry, 3.0 + zoomFactor * 5.0, 6.0 + zoomFactor * 10.0, bAngle, 2.0 * fout, Color.valueOf("#00bcd4"));
    },

    update(b){
        this.super$update(b);
        if(b.data != null){
            let target = b.data;
            if(Mathf.dst(b.x, b.y, target.x, target.y) <= 12){
                b.remove();
            }
        }
    },
    despawned(b){ spawnSubBulletsRandom(b, emperfumClusterBullet, 12, 5.0, 9.5, 15, 28); },
    hit(b, x, y){ 
        spawnSubBulletsRandom(b, emperfumClusterBullet, 12, 5.0, 9.5, 15, 28);
        b.remove();
    },
    hitTile(b, build, x, y, initialHealth, direct){
        this.super$hitTile(b, build, x, y, initialHealth, direct);
        spawnSubBulletsRandom(b, emperfumClusterBullet, 12, 5.0, 9.5, 15, 28);
        b.remove();
    }
});

const emperfumMainBulletMK2B = extend(BasicBulletType, {
    speed: 22, drag: 0.0, damage: 1175, splashDamage: 1762.5, splashDamageRadius: 45,
    width: 24, height: 48, lifetime: 120,
    frontColor: Color.valueOf("#ffffff"), backColor: Color.valueOf("#e91e63"),
    trailColor: Color.valueOf("#ff80ab"), trailWidth: 5, trailLength: 12,
    hitEffect: Fx.blastExplosion, despawnEffect: Fx.blastExplosion,
    collidesAir: true, collidesGround: false, collidesTiles: false, collides: true,
    pierce: true, pierceCap: 15,

    draw(b) {
        this.super$draw(b);
        let bAngle = b.rotation();
        let travelProgress = ((b.time * 0.08)) % 1.0;
        let fout = 1.0 - travelProgress; 
        let offset = 16.0 - (travelProgress * 30.0);
        let rx = b.x + Angles.trnsx(bAngle, offset);
        let ry = b.y + Angles.trnsy(bAngle, offset);
        let zoomFactor = travelProgress * 1.5; 
        if (fout > 0.05) drawWindRing(rx, ry, 4.0 + zoomFactor * 6.0, 8.0 + zoomFactor * 12.0, bAngle, 2.0 * fout, Color.valueOf("#ff80ab"));
    },

    update(b){
        this.super$update(b);
        if(b.data != null){
            let target = b.data;
            if(Mathf.dst(b.x, b.y, target.x, target.y) <= 12){
                b.remove();
            }
        }
    },
    despawned(b){ spawnSubBulletsRandom(b, emperfumClusterBulletAir, 12, 5.0, 9.5, 15, 28); },
    hit(b, x, y){ 
        spawnSubBulletsRandom(b, emperfumClusterBulletAir, 12, 5.0, 9.5, 15, 28);
        b.remove();
    },
    hitTile(b, build, x, y, initialHealth, direct){
        this.super$hitTile(b, build, x, y, initialHealth, direct);
        spawnSubBulletsRandom(b, emperfumClusterBulletAir, 12, 5.0, 9.5, 15, 28);
        b.remove();
    }
});

// ==========================================
// --- KHAI BÁO THÁP PHÁO EMPERFUM ---
// ==========================================

let emperfum = extend(ItemTurret, "emperfum", {
    squareSprite: false
});

emperfum.health = 1450;
emperfum.size = 3;
emperfum.reload = 300;
emperfum.range = 380;
emperfum.configurable = true;
emperfum.category = Category.turret;

emperfum.shootEffect = Fx.none;
emperfum.smokeEffect = Fx.none;
emperfum.targetAir = true;
emperfum.targetGround = true;

emperfum.ammoTypes.put(Items.pyratite, emperfumMainBulletMK1);

emperfum.hasLiquids = true;
let coolantConsume = new ConsumeCoolant(0.2);
coolantConsume.booster = false;
emperfum.consume(coolantConsume);

emperfum.config(java.lang.Integer, packCons2((tile, value) => {
    if (tile != null && tile.setTier !== undefined) {
        tile.setTier(value);
    }
}));

emperfum.buildType = () => extend(ItemTurret.ItemTurretBuild, emperfum, {
    tierState: 0,

    getTier(){ return this.tierState == null ? 0 : this.tierState; },
    setTier(val){ 
        this.tierState = val;
        if(val == 0) { this.health = 1450; }
        if(val == 1) { this.health = 1885; }
        if(val == 2) { this.health = 2610; }
        this.maxHealth = this.health;
    },

    findTarget(){
        let tier = this.getTier();
        if(tier == 2){
            this.target = Units.closestEnemy(this.team, this.x, this.y, this.range(), u => u != null && u.isFlying());
        } else {
            this.target = Units.closestEnemy(this.team, this.x, this.y, this.range(), u => u != null && !u.isFlying());
        }
    },

    getClampedTarget(){
        let maxRange = this.range();
        let dst = Mathf.dst(this.x, this.y, this.targetPos.x, this.targetPos.y);
        
        if(dst <= maxRange){
            return new Vec2(this.targetPos.x, this.targetPos.y);
        } else {
            let angle = Angles.angle(this.x, this.y, this.targetPos.x, this.targetPos.y);
            return new Vec2(
                this.x + Angles.trnsx(angle, maxRange),
                this.y + Angles.trnsy(angle, maxRange)
            );
        }
    },

    buildConfiguration(table){
        table.clear(); table.defaults().size(40);
        let tier = this.getTier();

        // NÚT THÔNG TIN (i)
        table.button(Icon.info, Styles.cleari, packRun(() => {
            let infoDialog = extend(BaseDialog, "THÔNG SỐ PHÁO EMPERFUM", {});
            
            let infoText = "";
            if(tier == 0){
                infoText = "[yellow]== CẤU HÌNH CƠ BẢN (MK1) ==[]\n\n" +
                           "• [stat]Máu (HP):[] 1,450\n" +
                           "• [stat]Sát thương gốc:[] 500 (Thẳng) + Tách 12 đạn Cluster\n" +
                           "• [stat]Phạm vi bắn:[] " + (emperfum.range / 8) + " ô (" + emperfum.range + "px)\n" +
                           "• [stat]Mục tiêu:[] Đất & Không\n" +
                           "• [stat]Cơ chế bắn:[] Bắn đạn xuyên thấu, tách thành 12 đạn con khi va chạm hoặc hết thời gian bay. Cần nạp Pyratite & Chất làm lạnh.";
            } else if(tier == 1){
                infoText = "[cyan]== CẤU HÌNH NÂNG CẤP (MK2 - CHUYÊN ĐẤT) ==[]\n\n" +
                           "• [stat]Máu (HP):[] 1,885 (+30%)\n" +
                           "• [stat]Sát thương gốc:[] 500 (Gốc) + 750 (Nổ AoE)\n" +
                           "• [stat]Phạm vi bắn:[] " + (emperfum.range / 8) + " ô (" + emperfum.range + "px)\n" +
                           "• [stat]Mục tiêu:[] Chỉ MẶT ĐẤT\n" +
                           "• [stat]Cơ chế bắn:[] Định vị theo con trỏ chuột, bay tới điểm chỉ định sẽ lập tức phát nổ AoE và đẻ đạn tầng 2-3-4 tự động truy đuổi.";
            } else if(tier == 2){
                infoText = "[purple]== CẤU HÌNH PHÒNG KHÔNG (MK2B) ==[]\n\n" +
                           "• [stat]Máu (HP):[] 2,610 (+80%)\n" +
                           "• [stat]Sát thương gốc:[] 1,175 (Gốc) + 1,762.5 (Nổ AoE)\n" +
                           "• [stat]Phạm vi bắn:[] " + (emperfum.range / 8) + " ô (" + emperfum.range + "px)\n" +
                           "• [stat]Mục tiêu:[] Chỉ TRÊN KHÔNG\n" +
                           "• [stat]Cơ chế bắn:[] Siêu tăng cường +135% toàn bộ sát thương! Định vị bay theo con trỏ chuột và kích nổ diện rộng khắc chế hoàn toàn không quân.";
            }

            let cell = infoDialog.cont.add(infoText);
            cell.width(360).get().setWrap(true);
            cell.get().setAlignment(Align.left);
            infoDialog.addCloseButton();
            infoDialog.show();
        })).tooltip("Thông tin thông số pháo");

        // NÚT NÂNG CẤP (^)
        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Emperfum", {});
                
                let reqCell = dialog.cont.label(packProv(() => {
                    let core = this.team.core();
                    if(core == null) return "[red]Không tìm thấy Lõi Đội![]";
                    let inv = core.items;
                    let c = inv.get(Items.copper), s = inv.get(Items.surgeAlloy), p = inv.get(Items.plastanium);
                    let th = inv.get(Items.thorium), ti = inv.get(Items.titanium), si = inv.get(Items.silicon);
                    
                    return "[yellow]YÊU CẦU TÀI NGUYÊN NÂNG CẤP:[]\n\n" +
                           "[cyan]Cấu Hình MK2 (Chuyên Đất - Định Vị Trỏ Chuột):[]\n" +
                           " • Surge Alloy: " + (s >= reqMK2.surgeAlloy ? "[green]" : "[red]") + s + "[] / " + reqMK2.surgeAlloy + "\n" +
                           " • Plastanium: " + (p >= reqMK2.plastanium ? "[green]" : "[red]") + p + "[] / " + reqMK2.plastanium + "\n" +
                           " • Đồng: " + (c >= reqMK2.copper ? "[green]" : "[red]") + c + "[] / " + reqMK2.copper + "\n\n" +
                           "[purple]Cấu Hình MK2B (Chuyên Không - Siêu Tăng Cường +135% Stats):[]\n" +
                           " • Thorium: " + (th >= reqMK2B.thorium ? "[green]" : "[red]") + th + "[] / " + reqMK2B.thorium + "\n" +
                           " • Titan: " + (ti >= reqMK2B.titanium ? "[green]" : "[red]") + ti + "[] / " + reqMK2B.titanium + "\n" +
                           " • Silicon: " + (si >= reqMK2B.silicon ? "[green]" : "[red]") + si + "[] / " + reqMK2B.silicon;
                }));
                
                reqCell.width(380).get().setWrap(true);
                reqCell.get().setAlignment(Align.left);
                dialog.cont.row(); dialog.cont.add().height(10).row();

                let branchesTable = new Table();

                let b1 = new Table(); b1.background(Styles.black6); b1.margin(12);
                b1.add("[cyan]===(CẤU HÌNH MK2)===[]").row();
                let b1D = b1.add("Mạch định vị con trỏ chuột & Nổ trong tầm bắn:\n" +
                                 " • Bay tới vị trí con trỏ nổ ngay.\n" +
                                 " • Tăng +200% bán kính nổ AoE.\n" +
                                 " • Tỷ lệ đẻ đạn tầng 4 tăng lên 80%.");
                b1D.width(340).get().setWrap(true); b1D.get().setAlignment(Align.left); b1.row();
                b1.button("[green]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.surgeAlloy) >= reqMK2.surgeAlloy && core.items.get(Items.plastanium) >= reqMK2.plastanium && core.items.get(Items.copper) >= reqMK2.copper){
                        core.items.remove(Items.surgeAlloy, reqMK2.surgeAlloy); core.items.remove(Items.plastanium, reqMK2.plastanium); core.items.remove(Items.copper, reqMK2.copper);
                        Fx.upgradeCore.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(1)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho MK2![]"); }
                })).size(180, 38);

                let b2 = new Table(); b2.background(Styles.black6); b2.margin(12);
                b2.add("[purple]===(CẤU HÌNH MK2B)===[]").row();
                let b2D = b2.add("Chế độ Phòng Không Cao Cấp:\n" +
                                 " • CHỈ bắn và gây sát thương mục tiêu TRÊN KHÔNG.\n" +
                                 " • Bay theo con trỏ chuột & nổ trong tầm bắn tối đa.\n" +
                                 " • Tăng +135% TOÀN BỘ CHỈ SỐ sát thương!");
                b2D.width(340).get().setWrap(true); b2D.get().setAlignment(Align.left); b2.row();
                b2.button("[orange]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && core.items.get(Items.thorium) >= reqMK2B.thorium && core.items.get(Items.titanium) >= reqMK2B.titanium && core.items.get(Items.silicon) >= reqMK2B.silicon){
                        core.items.remove(Items.thorium, reqMK2B.thorium); core.items.remove(Items.titanium, reqMK2B.titanium); core.items.remove(Items.silicon, reqMK2B.silicon);
                        Fx.bigShockwave.at(this.x, this.y); Fx.mineHuge.at(this.x, this.y); Effect.shake(5, 5, this.x, this.y);
                        this.configure(java.lang.Integer(2)); dialog.hide(); this.deselect();
                    } else { Vars.ui.showInfo("[red]Không đủ tài nguyên cho MK2B![]"); }
                })).size(180, 38);

                branchesTable.add(b1).width(340); branchesTable.row();
                branchesTable.add().height(12).row();
                branchesTable.add(b2).width(340);

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).maxHeight(400);
                dialog.addCloseButton(); dialog.show();
            })).tooltip("Nâng cấp tháp pháo Emperfum");
        } else {
            table.button(Icon.lock, Styles.cleari, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG EMPERFUM ĐÃ ĐẠT CẤP ĐỘ TỐI ĐA![]");
            })).tooltip("Đã đạt cấp tối đa");
        }
    },

    config() { return java.lang.Integer(this.getTier()); },

    shoot(type){
        let tier = this.getTier();
        let targetPos = this.getClampedTarget();

        let bulletToShoot = emperfumMainBulletMK1;
        let muzzleColor = Color.valueOf("#80deea");

        if(tier == 1) {
            bulletToShoot = emperfumMainBulletMK2;
            muzzleColor = Color.valueOf("#00bcd4");
        }
        if(tier == 2) {
            bulletToShoot = emperfumMainBulletMK2B;
            muzzleColor = Color.valueOf("#ff80ab");
        }

        let spawnX = this.x + Angles.trnsx(this.rotation, 10);
        let spawnY = this.y + Angles.trnsy(this.rotation, 10);

        emperfumMuzzleEffect.at(spawnX, spawnY, this.rotation, muzzleColor);

        let b = bulletToShoot.create(this, this.team, spawnX, spawnY, this.rotation);
        if(b != null){
            b.data = targetPos;
            if(tier >= 1){
                let dist = Mathf.dst(this.x, this.y, targetPos.x, targetPos.y);
                b.lifetime = (dist / bulletToShoot.speed) + 2;
            }
        }
    },

    write(write){ this.super$write(write); write.b(this.getTier()); },
    read(read, revision){ this.super$read(read, revision); this.setTier(read.b()); }
});