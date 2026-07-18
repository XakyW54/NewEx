// 1. Định nghĩa Hiệu ứng số sát thương phong cách Damage Indicators
const damageIndicatorEffect = new Effect(45, cons(e => {
    if (e.data == null) return;

    let previousZ = Draw.z();
    Draw.z(Layer.effect + 1);

    let randX = Mathf.randomSeed(e.id, -12, 12);
    let randY = Mathf.randomSeed(e.id + 1, 10, 25);

    let currentX = e.x + (randX * e.fin(Interp.pow2Out));
    let currentY = e.y + (randY * e.fin(Interp.pow2Out));

    let fontColor = Color.valueOf("#ff3333").cpy(); 
    fontColor.a = e.fout(Interp.pow3In);

    let fontSize = 0.35 * e.fout(Interp.pow2Out);
    if(fontSize < 0.15) fontSize = 0.15; 

    Font.outline.draw(e.data, currentX, currentY, fontColor, fontSize, Align.center);

    Draw.z(previousZ);
}));

// 2. Lấy Unit từ hệ thống mod
const testDamageUnit = Vars.content.getByName(ContentType.unit, "newex-test-damage-display-unit");

if (testDamageUnit != null) {
    // Ép lại máu và giáp trực tiếp vào cấu hình gốc của UnitType
    testDamageUnit.health = 5000;
    testDamageUnit.armor = 15;

    // CÁCH KHÁC: Ghi đè hàm tạo thực thể bằng phương thức thiết lập Supplier (Đúng chuẩn cấu trúc lõi)
    testDamageUnit.constructor = new Prov({
        get: function() {
            return extend(MechUnit, {
                // Sử dụng hàm handleDamage (Hàm xử lý lượng sát thương thực sau khi qua mọi lớp lọc của game)
                handleDamage(amount) {
                    // Gọi hàm gốc để trừ máu trước nhằm tránh lỗi bất tử
                    this.super$handleDamage(amount);

                    // Bản thân 'amount' ở đây chính là lượng máu thực tế bị trừ đi
                    if (amount > 0.5) {
                        let damageText = java.lang.String.valueOf(Math.round(amount));
                        
                        // Kích hoạt hiệu ứng nảy số tại tọa độ hiện tại của Unit này
                        damageIndicatorEffect.at(this.x, this.y, 0, damageText);
                    }
                }
            });
        }
    });
}