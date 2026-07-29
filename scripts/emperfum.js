/* EMPERFUM TURRET SYSTEM - EXACT DOR UI STYLE */

const packCons2 = (func) => new Cons2({ get: func });
const packRun = (func) => new java.lang.Runnable({ run: func });
const packProv = (func) => new Prov({ get: func });

// ==========================================
// --- CHI PHÍ NÂNG CẤP TÙY CHỈNH ---
// ==========================================
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
    
    let offset1 = 12 - (e.fin() * 18); 
    let bx1 = e.x + Angles.trnsx(baseAngle, offset1);
    let by1 = e.y + Angles.trnsy(baseAngle, offset1);
    drawWindRing(bx1, by1, 3.0 + (e.fin() * 5.0), e.fin() * 15.0, baseAngle, 2.2 * e.fout(), tColor);

    let offset2 = 18 - (e.fin() * 26);
    let bx2 = e.x + Angles.trnsx(baseAngle, offset2);
    let by2 = e.y + Angles.trnsy(baseAngle, offset2);
    drawWindRing(bx2, by2, 4.0 + (e.fin() * 7.0), e.fin() * 22.0, baseAngle, 1.8 * e.fout(), Color.white);

    let offset3 = 35 - (e.fin() * 20); 
    let bx3 = e.x + Angles.trnsx(baseAngle, offset3);
    let by3 = e.y + Angles.trnsy(baseAngle, offset3);
    drawWindRing(bx3, by3, 2.0 + (e.fin() * 10.0), e.fin() * 28.0, baseAngle, 2.0 * e.fout(), tColor);

    let offset4 = 55 - (e.fin() * 40); 
    let bx4 = e.x + Angles.trnsx(baseAngle, offset4);
    let by4 = e.y + Angles.trnsy(baseAngle, offset4);
    drawWindRing(bx4, by4, 1.0 + (e.fin() * 7.0), e.fin() * 20.0, baseAngle, 1.6 * e.fout(), Color.white);
});

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
        table.clear(); 
        table.row();
        let tier = this.getTier();

        if(tier == 0) {
            table.button(Icon.upOpen, Styles.cleari, 40, packRun(() => {
                let dialog = extend(BaseDialog, "Trung tâm nâng cấp pháo Emperfum", {});
                
                // --- BẢNG YÊU CẦU TÀI NGUYÊN ---
                let reqTable = new Table();
                reqTable.background(Styles.black6);
                reqTable.margin(10);

                let reqCell = reqTable.add("").width(320).get();
                reqCell.setWrap(true);
                reqCell.setAlignment(Align.left);

                reqTable.update(packRun(() => {
                    let core = this.team.core();
                    if(core == null) {
                        reqCell.setText("[red]⚠️ KHÔNG THẤY LÕI ĐỘI![]");
                        return;
                    }
                    
                    // Lấy tài nguyên Lõi hiện có
                    let cSurge = core.items.get(Items.surgeAlloy);
                    let cPla = core.items.get(Items.plastanium);
                    let cCop = core.items.get(Items.copper);

                    let cTho = core.items.get(Items.thorium);
                    let cTit = core.items.get(Items.titanium);
                    let cSil = core.items.get(Items.silicon);

                    // Đổi màu hiển thị (Xanh: Đủ / Đỏ: Thiếu)
                    let surCol1 = cSurge >= reqMK2.surgeAlloy ? "[lime]" : "[scarlet]";
                    let plaCol1 = cPla >= reqMK2.plastanium ? "[lime]" : "[scarlet]";
                    let copCol1 = cCop >= reqMK2.copper ? "[lime]" : "[scarlet]";
                    
                    let thoCol2 = cTho >= reqMK2B.thorium ? "[lime]" : "[scarlet]";
                    let titCol2 = cTit >= reqMK2B.titanium ? "[lime]" : "[scarlet]";
                    let silCol2 = cSil >= reqMK2B.silicon ? "[lime]" : "[scarlet]";

                    reqCell.setText(
                        "[gold]📦 KHO TÀI NGUYÊN LÕI CẦN THIẾT:[]\n\n" +
                        "[cyan]🔹 Nhánh MK2 (Xuyên Phá / Đánh Đất):[]\n" +
                        " • Hợp kim Surge: " + surCol1 + cSurge + "[] / " + reqMK2.surgeAlloy + "\n" +
                        " • Nhựa Plastanium: " + plaCol1 + cPla + "[] / " + reqMK2.plastanium + "\n" +
                        " • Đồng (Copper): " + copCol1 + cCop + "[] / " + reqMK2.copper + "\n\n" +
                        "[pink]🔸 Nhánh MK2B (Tầm Nhiệt / Phòng Không):[]\n" +
                        " • Thorium: " + thoCol2 + cTho + "[] / " + reqMK2B.thorium + "\n" +
                        " • Titan: " + titCol2 + cTit + "[] / " + reqMK2B.titanium + "\n" +
                        " • Silicon: " + silCol2 + cSil + "[] / " + reqMK2B.silicon
                    );
                }));

                dialog.cont.add(reqTable).width(340).padBottom(10).row();

                // --- BẢNG CÁC NHÁNH NÂNG CẤP ---
                let branchesTable = new Table();

                // NHÁNH MK2
                let b1 = new Table(); b1.background(Styles.black8); b1.margin(10);
                b1.add("[cyan]⚡ [BOLD]CẤU HÌNH MK2 - GIA TỐC XUYÊN PHÁ[] ⚡").center().row();
                b1.add().height(6).row();
                let b1D = b1.add(
                    "[lightgray]Tối ưu hóa rãnh nòng từ tính, gia tăng hỏa lực càn quét mặt đất:\n" +
                    "• [white]Máu tháp pháo: [green]1,885 HP[] [lime](+30%)[]\n" +
                    "• [white]Tầm bắn: [orange]420 pixel[]\n" +
                    "• [white]Sát thương: [yellow]500 thô + 750 nổ diện rộng[]\n" +
                    "• [white]Đặc tính: [gold]Xuyên qua 15 mục tiêu[], phân tách đạn chùm 2 tầng càn quét công trình/kẻ địch."
                ).width(300).get();
                b1D.setWrap(true); b1D.setAlignment(Align.left); b1.row();
                b1.add().height(8).row();
                b1.button("[cyan]KÍCH HOẠT MK2[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && 
                       core.items.get(Items.surgeAlloy) >= reqMK2.surgeAlloy && 
                       core.items.get(Items.plastanium) >= reqMK2.plastanium && 
                       core.items.get(Items.copper) >= reqMK2.copper){
                        
                        // Trừ tài nguyên Lõi
                        core.items.remove(Items.surgeAlloy, reqMK2.surgeAlloy); 
                        core.items.remove(Items.plastanium, reqMK2.plastanium);
                        core.items.remove(Items.copper, reqMK2.copper);

                        Fx.upgradeCore.at(this.x, this.y); 
                        Fx.mineHuge.at(this.x, this.y); 
                        Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(1)); 
                        dialog.hide(); 
                        this.deselect();
                    } else { 
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2![]"); 
                    }
                })).size(200, 40).center();

                // NHÁNH MK2B
                let b2 = new Table(); b2.background(Styles.black8); b2.margin(10);
                b2.add("[pink]🔥 [BOLD]CẤU HÌNH MK2B - XUNG KÍCH TẦM NHIỆT[] 🔥").center().row();
                b2.add().height(6).row();
                let b2D = b2.add(
                    "[lightgray]Chuyển đổi sang hệ thống phòng không tầm xa chuyên dụng:\n" +
                    "• [white]Máu tháp pháo: [green]2,610 HP[] [lime](+80%)[]\n" +
                    "• [white]Tầm bắn: [orange]380 pixel[]\n" +
                    "• [white]Sát thương: [red]1,175 thô + 1,762 nổ diện rộng[]\n" +
                    "• [white]Đặc tính: [pink]Tự động bẻ lái khóa mục tiêu bay[], đạn nổ tỏa ra 40 mảnh đạn truy đuổi phụ."
                ).width(300).get();
                b2D.setWrap(true); b2D.setAlignment(Align.left); b2.row();
                b2.add().height(8).row();
                b2.button("[pink]KÍCH HOẠT MK2B[]", packRun(() => {
                    let core = this.team.core();
                    if(core != null && 
                       core.items.get(Items.thorium) >= reqMK2B.thorium && 
                       core.items.get(Items.titanium) >= reqMK2B.titanium && 
                       core.items.get(Items.silicon) >= reqMK2B.silicon){
                        
                        // Trừ tài nguyên Lõi
                        core.items.remove(Items.thorium, reqMK2B.thorium); 
                        core.items.remove(Items.titanium, reqMK2B.titanium); 
                        core.items.remove(Items.silicon, reqMK2B.silicon);

                        Fx.bigShockwave.at(this.x, this.y); 
                        Fx.mineHuge.at(this.x, this.y); 
                        Effect.shake(4, 4, this.x, this.y);
                        this.configure(java.lang.Integer(2)); 
                        dialog.hide(); 
                        this.deselect();
                    } else { 
                        Vars.ui.showInfo("[red]Không đủ tài nguyên cho nhánh MK2B![]"); 
                    }
                })).size(200, 40).center();

                branchesTable.add(b1).width(320).padBottom(10).row();
                branchesTable.add(b2).width(320).row();

                let scroll = new ScrollPane(branchesTable);
                scroll.setScrollingDisabled(true, false);
                dialog.cont.add(scroll).width(340).maxHeight(320);
                dialog.addCloseButton(); 
                dialog.show();
            })).size(50, 40).tooltip("Nâng cấp hệ thống Emperfum");
        } else {
            table.button(Icon.lock, Styles.cleari, 40, packRun(() => {
                Vars.ui.showInfo("[scarlet]HỆ THỐNG EMPERFUM ĐÃ ĐẠT GIỚI HẠN CẤU HÌNH TIẾN HÓA![]");
            })).size(50, 40).tooltip("Đã đạt cấp tối đa");
        }

        // --- NÚT XEM BẢNG THÔNG TIN MÔ TẢ PHÁO ---
        table.button(Icon.info, Styles.cleari, 40, packRun(() => {
            let title = " Thông số pháo Emperfum: ";
            let descStr = "";
            let currentTier = this.getTier();

            if (currentTier == 0) {
                title += "[yellow](MK1)[]";
                descStr = "[gold]⚡ THÔNG SỐ CƠ BẢN (MK1 - CƠ BẢN) ⚡[]\n\n" +
                          "• [lightgray]Máu pháo:[] [green]1,450 HP[]\n" +
                          "• [lightgray]Tầm bắn:[] [orange]380 pixel[]\n" +
                          "• [lightgray]Mục tiêu:[] Đất & Khai hỏa Pyro\n" +
                          "• [lightgray]Sát thương:[] [yellow]500 thô[] + đạn chùm phân tách\n" +
                          "• [lightgray]Khả năng xuyên:[] [white]15 mục tiêu[]\n\n" +
                          "[sky]💡 Mô tả: Pháo càn quét diện rộng giai đoạn đầu. Bắn đạn chính tích tụ vòng năng lượng oval, khi chạm mục tiêu sẽ giải phóng 12 đạn con bộc phá.[]";
            } 
            else if (currentTier == 1) {
                title += "[cyan](MK2)[]";
                descStr = "[cyan]⚡ THÔNG SỐ CẤU HÌNH (MK2 - XUYÊN PHÁ) ⚡[]\n\n" +
                          "• [lightgray]Máu pháo:[] [green]1,885 HP [lime](+30%)[]\n" +
                          "• [lightgray]Tầm bắn:[] [orange]420 pixel[]\n" +
                          "• [lightgray]Mục tiêu:[] Chuyên Đánh Đất\n" +
                          "• [lightgray]Sát thương:[] [yellow]500 thô + 750 nổ diện rộng[]\n" +
                          "• [lightgray]Khả năng xuyên:[] [yellow]15 mục tiêu[]\n\n" +
                          "[lime]💡 Mô tả: Tăng cường kết cấu nòng từ tính xanh lam. Đạn chính bay nhanh hơn, xuyên qua toàn bộ đội hình địch và kích hoạt chuỗi nổ bộc phá liên hoàn.[]";
            } 
            else if (currentTier == 2) {
                title += "[pink](MK2B)[]";
                descStr = "[pink]⚡ THÔNG SỐ CẤU HÌNH (MK2B - TRUY ĐUỔI TẦM NHIỆT) ⚡[]\n\n" +
                          "• [lightgray]Máu pháo:[] [green]2,610 HP [lime](+80%)[]\n" +
                          "• [lightgray]Tầm bắn:[] [orange]380 pixel[]\n" +
                          "• [lightgray]Mục tiêu:[] Chuyên Phòng Không (Bay)\n" +
                          "• [lightgray]Sát thương:[] [red]1,175 thô + 1,762 nổ diện rộng[]\n" +
                          "• [lightgray]Khả năng bẻ lái:[] [pink]Truy đuổi tầm nhiệt 200px[]\n\n" +
                          "[purple]🔥 Mô tả: Chuyển đổi toàn bộ mạch năng lượng sang sắc hồng xung kích. Tự động bẻ lái đuổi theo các đơn vị không quân địch, phát nổ thành hàng chục mảnh đạn truy đuổi phụ.[]";
            }

            let dialog = extend(BaseDialog, title, {});
            let infoTable = new Table();
            infoTable.background(Styles.black6);
            infoTable.margin(12);

            let cell = infoTable.add(descStr).width(320);
            cell.get().setWrap(true); 
            cell.get().setAlignment(Align.left);

            let scroll = new ScrollPane(infoTable);
            scroll.setScrollingDisabled(true, false);
            dialog.cont.add(scroll).width(340).maxHeight(360);
            dialog.addCloseButton(); 
            dialog.show();
        })).size(50, 40).tooltip("Xem thông số chi tiết hệ thống");
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
