// Tên file: antumbra-laser.js
// Mô tả: Ép buộc cập nhật tầm bắn (range) của đạn gốc và Antumbra theo lifetime của đạn kim.

const antumbraRed = Color.valueOf("#feb380");

// 1. TẠO LOẠI ĐẠN KIM SIÊU DÀI VÀ XỬ LÝ GÂY 1% HP SÁT THƯƠNG
const needleBullet = extend(BasicBulletType, {
    hitEntity(b, entity, health){
        this.super$hitEntity(b, entity, health);
        
        if(entity != null && entity.health > 0){
            let percentDamage = entity.health * 0.01; // 1% máu hiện tại
            entity.damage(percentDamage);
        }
    }
});

// Cấu hình đạn kim
needleBullet.speed = 12;
needleBullet.damage = 10;
needleBullet.width = 2;              // Chiều rộng rất nhỏ
needleBullet.height = 80;            // Chiều dài rất dài
needleBullet.frontColor = Color.white;
needleBullet.backColor = antumbraRed;
needleBullet.trailColor = antumbraRed;
needleBullet.trailWidth = 1;
needleBullet.trailLength = 15;
needleBullet.lifetime = 45;          // Lifetime đạn kim (12 * 45 = 540px)
needleBullet.pierce = true;          // Xuyên qua kẻ địch
needleBullet.pierceCap = 3;
needleBullet.hitEffect = Fx.hitBulletColor;
needleBullet.despawnEffect = Fx.none;

// 2. ÉP CẬP NHẬT RANGE CHO CẢ VŨ KHÍ LẪN UNIT
Events.on(ClientLoadEvent, () => {
    let antumbra = UnitTypes.antumbra;
    if(antumbra != null && antumbra.weapons != null){
        
        // Tính toán khoảng cách tối đa (540 pixels / ~67.5 ô)
        let newRange = needleBullet.speed * needleBullet.lifetime;

        for(let i = 0; i < antumbra.weapons.size; i++){
            let w = antumbra.weapons.get(i);
            if(!w || !w.bullet) continue;

            // 1. Gán lifetime mới
            w.bullet.lifetime = needleBullet.lifetime;

            // 2. ÉP CẬP NHẬT TRỰC TIẾP BIẾN RANGE CỦA ĐẠN GỐC (Bắt buộc để vũ khí nhận tầm bắn mới)
            w.bullet.range = newRange;

            // Gán đạn kim bắn kèm từ nòng súng
            if(w.bullet.spawnBullets == null){
                w.bullet.spawnBullets = Seq.with(needleBullet);
            } else {
                w.bullet.spawnBullets.add(needleBullet);
            }
        }

        // Ép Antumbra cập nhật lại tầm nhắm bắn xa nhất
        antumbra.maxRange = newRange;
        antumbra.aimDst = newRange;
    }
}); 