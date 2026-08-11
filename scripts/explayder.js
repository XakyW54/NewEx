Events.on(ClientLoadEvent, e => {
  let explayder = Vars.content.getByName(ContentType.unit, "newex-explayder")
  if (!explayder) return

  // JS Object thuần lưu trữ bộ đếm theo unit.id
  let unitDataMap = {}

  // Dọn dẹp bộ nhớ khi unit bị phá hủy
  Events.on(EventType.UnitDestroyEvent, event => {
    if (event.unit && unitDataMap[event.unit.id]) {
      delete unitDataMap[event.unit.id]
    }
  })

  explayder.abilities.add(new JavaAdapter(Ability, {
    update(unit) {
      if (!unit) return

      let id = unit.id

      if (!unitDataMap[id]) {
        unitDataMap[id] = {
          movingTimer: 0,
          speedBoostTimer: 0
        }
      }

      let data = unitDataMap[id]

      // ============================================================
      // CƠ CHẾ 1: Di chuyển 3s liên tục -> Tăng 150% tốc chạy trong 20s
      // ============================================================
      let isMoving = unit.vel.len() > 0.1

      if (data.speedBoostTimer > 0) {
        // Đang trong thời gian Boost 20s
        data.speedBoostTimer -= Time.delta / 60

        // Tăng 150% tốc độ di chuyển (Tổng tốc = 2.5x)
        unit.speedMultiplier *= 2.5

        // Hiệu ứng vệt sáng năng lượng khi di chuyển nhanh
        if (Mathf.chance(0.3)) {
          try {
            Fx.trailFade.at(unit.x, unit.y, 4, Color.valueOf("66B1FF"))
          } catch(err) {}
        }

        if (data.speedBoostTimer <= 0) {
          data.speedBoostTimer = 0
          data.movingTimer = 0
        }
      } else {
        if (isMoving) {
          data.movingTimer += Time.delta / 60
          if (data.movingTimer >= 3.0) {
            data.speedBoostTimer = 20.0 // Bật Boost 20s
            data.movingTimer = 0
            
            // Dùng Fx.heal siêu an toàn, không sợ crash
            try {
              Fx.heal.at(unit.x, unit.y, 0, Color.valueOf("66B1FF"))
            } catch(err) {}
          }
        } else {
          data.movingTimer = 0
        }
      }

      // ============================================================
      // CƠ CHẾ 2: Mỗi 1% máu mất -> Tăng 1% độ dài tia laser & Damage
      // ============================================================
      let missingHealthRatio = 1.0 - (unit.health / unit.maxHealth)

      if (unit.mounts) {
        for (let i = 0; i < unit.mounts.length; i++) {
          let mount = unit.mounts[i]
          if (mount && mount.weapon && mount.weapon.bullet) {
            // Tăng độ dài (gốc 130) và Damage (gốc 16) theo % máu đã mất
            mount.weapon.bullet.length = 130 * (1 + missingHealthRatio)
            mount.weapon.bullet.damage = 16 * (1 + missingHealthRatio)
          }
        }
      }
    }
  }))
})