// Tên file: reign-buff.js
const reignDataMap = new ObjectMap();
const reignOriginals = {};

// Hàm hiển thị chữ nhảy lên trên đầu Unit khi kích hoạt kỹ năng
function showSkillPopup(unit, text, color) {
    if (!unit || unit.dead) return;
    Call.label(text, 1.5, unit.x, unit.y + 12);
}

// 1. Lưu thông số gốc và cài đặt chỉ số cơ bản cho Reign
Events.on(ClientLoadEvent, () => {
    let reign = UnitTypes.reign;
    if (!reign) return;

    reignOriginals.health = reign.health;
    reignOriginals.armor = reign.armor;

    reign.health = reignOriginals.health * 6; // +500% máu
    reign.armor = reignOriginals.armor + 90;   // +90 giáp
});

Events.on(WorldLoadEvent, () => {
    let reign = UnitTypes.reign;
    if (!reign || reignOriginals.health == null) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);
    if (isEnabled) {
        reign.health = reignOriginals.health * 6;
        reign.armor = reignOriginals.armor + 90;
    } else {
        reign.health = reignOriginals.health;
        reign.armor = reignOriginals.armor;
    }
});

// Hàm đếm số lượng Reign hiện tại của 1 Team
function getReignCount(team) {
    let count = 0;
    Groups.unit.each(u => {
        if (u.team == team && u.type == UnitTypes.reign && !u.dead) {
            count++;
        }
    });
    return count;
}

// 2. Xử lý nhận sát thương (Giảm 90% dmg nhận, Kỹ năng B, Kỹ năng D)
Events.on(EventType.UnitDamageEvent, event => {
    if (!Core.settings.getBool("newex-logic-support-units", true)) return;

    let u = event.unit;
    let b = event.bullet;

    // A. Nếu Reign gây sát thương (+120% dmg gốc + buff B)
    if (b && b.owner && b.owner.type == UnitTypes.reign && u && u.team != b.team) {
        let attackerData = reignDataMap.get(b.owner.id);
        let bonusMultiplier = 1.2; // Tăng 120% sát thương gốc mặc định

        if (attackerData) {
            bonusMultiplier += attackerData.damageStack; // Cộng thêm % từ Kỹ năng B
        }

        u.health -= (b.damage * bonusMultiplier);
    }

    // B. Nếu Reign bị nhận sát thương
    if (u && !u.dead && u.type == UnitTypes.reign) {
        let damageTaken = b ? b.damage : 0;

        // Giảm 90% sát thương nhận vào
        if (damageTaken > 0) {
            u.health = Math.min(u.maxHealth, u.health + damageTaken * 0.90);
        }

        if (!reignDataMap.containsKey(u.id)) {
            reignDataMap.put(u.id, {
                skillATimer: 0,
                skillBTimer: 0,
                damageStack: 0,
                skillCTriggered: false,
                skillCTimer: 0,
                lastHealthCheck: u.health,
                wasHitRecently: false
            });
        }
        let data = reignDataMap.get(u.id);
        data.wasHitRecently = true;

        // Kỹ năng D: Mỗi khi mất 10% máu -> Tạo vụ nổ 10 ô (80px) gây 1000 dmg
        let healthLost = data.lastHealthCheck - u.health;
        let threshold = u.maxHealth * 0.10;

        if (healthLost >= threshold) {
            data.lastHealthCheck = u.health;

            Damage.damage(u.team, u.x, u.y, 80, 1000, true, true);
            Fx.reactorExplosion.at(u.x, u.y);

            showSkillPopup(u, "[orange]D[white]", Color.orange);
        }
    }
});

// 3. Kỹ năng E: 50% cơ hội hồi sinh (Có check giới hạn spawn)
Events.on(EventType.UnitDestroyEvent, event => {
    if (!Core.settings.getBool("newex-logic-support-units", true)) return;

    let u = event.unit;
    if (u && u.type == UnitTypes.reign) {
        reignDataMap.remove(u.id);

        if (Mathf.chance(0.50)) {
            let spawnX = u.x;
            let spawnY = u.y;
            let team = u.team;

            Time.run(2, () => {
                // Kiểm tra nếu team chưa có con Reign nào khác thì mới cho hồi sinh
                if (getReignCount(team) < 1) {
                    let revived = UnitTypes.reign.spawn(team, spawnX, spawnY);
                    if (revived != null) {
                        Fx.spawn.at(spawnX, spawnY);
                        Fx.heal.at(spawnX, spawnY);
                        showSkillPopup(revived, "[green]E (Hồi Sinh)[white]", Color.green);
                    }
                }
            });
        }
    }
});

// 4. Vòng lặp chính: Kiểm tra giới hạn Spawn + Cập nhật Kỹ năng A, B, C
Events.run(Trigger.update, () => {
    if (Vars.state.isPaused() || Vars.state.isMenu()) return;
    if (!Core.settings.getBool("newex-logic-support-units", true)) return;

    // A. GIỚI HẠN SPAWN TỐI ĐA 1 REIGN PER TEAM
    // Gom nhóm Reign theo từng Team
    let teamReigns = {};

    Groups.unit.each(u => {
        if (u && !u.dead && u.type == UnitTypes.reign) {
            let teamId = u.team.id;
            if (!teamReigns[teamId]) {
                teamReigns[teamId] = [];
            }
            teamReigns[teamId].push(u);
        }
    });

    // Nếu team nào có nhiều hơn 1 Reign, giữ lại con cũ nhất và xóa các con thừa
    for (let teamId in teamReigns) {
        let list = teamReigns[teamId];
        if (list.length > 1) {
            // Giữ lại con đầu tiên (list[0]), xóa tất cả con sinh sau
            for (let i = 1; i < list.length; i++) {
                let excessUnit = list[i];
                Fx.spawn.at(excessUnit.x, excessUnit.y);
                reignDataMap.remove(excessUnit.id);
                excessUnit.remove(); // Xóa khỏi game
            }
        }
    }

    // B. CẬP NHẬT KỸ NĂNG CHO UNITS
    let units = Groups.unit.copy();
    for (let i = 0; i < units.size; i++) {
        let u = units.get(i);
        if (!u || u.dead || u.type != UnitTypes.reign) continue;

        if (!reignDataMap.containsKey(u.id)) {
            reignDataMap.put(u.id, {
                skillATimer: 0,
                skillBTimer: 0,
                damageStack: 0,
                skillCTriggered: false,
                skillCTimer: 0,
                lastHealthCheck: u.health,
                wasHitRecently: false
            });
        }

        let data = reignDataMap.get(u.id);

        // --- KỸ NĂNG A: Mỗi 2s có 50% tỉ lệ tăng 500% tốc bắn trong 2s ---
        data.skillATimer += Time.delta;
        if (data.skillATimer >= 120) {
            data.skillATimer = 0;
            if (Mathf.chance(0.50)) {
                u.apply(StatusEffects.overclock, 120);
                showSkillPopup(u, "[yellow]A[white]", Color.yellow);
            }
        }

        // --- KỸ NĂNG B: Mỗi 1s bị đánh tăng 1% sát thương (Tối đa +1000%) ---
        if (data.wasHitRecently) {
            data.skillBTimer += Time.delta;
            if (data.skillBTimer >= 60) {
                data.skillBTimer = 0;
                data.wasHitRecently = false;

                if (data.damageStack < 10.0) {
                    data.damageStack += 0.01;
                    showSkillPopup(u, "[red]B[white]", Color.red);
                }
            }
        }

        // --- KỸ NĂNG C: Khi dưới 50% máu, hồi 1%/s trong 50s (Chỉ 1 lần) ---
        if (!data.skillCTriggered && u.health < (u.maxHealth * 0.50)) {
            data.skillCTriggered = true;
            data.skillCTimer = 3000;
            showSkillPopup(u, "[cyan]C[white]", Color.cyan);
        }

        if (data.skillCTimer > 0) {
            data.skillCTimer -= Time.delta;
            if (Mathf.mod(data.skillCTimer, 60) < Time.delta) {
                u.health = Math.min(u.maxHealth, u.health + u.maxHealth * 0.01);
                Fx.heal.at(u.x, u.y);
            }
        }
    }
});