Events.on(ClientLoadEvent, e => {
  let explayder = Vars.content.getByName(ContentType.unit, "newex-explayder")
  if (!explayder) return

 
  let unitDataMap = {}

 
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

 
      let isMoving = unit.vel.len() > 0.1

      if (data.speedBoostTimer > 0) {
   
        data.speedBoostTimer -= Time.delta / 60

       
        unit.speedMultiplier *= 2.5

        
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
            data.speedBoostTimer = 20.0  
            
         
            try {
              Fx.heal.at(unit.x, unit.y, 0, Color.valueOf("66B1FF"))
            } catch(err) {}
          }
        } else {
          data.movingTimer = 0
        }
      }

 
      let missingHealthRatio = 1.0 - (unit.health / unit.maxHealth)

      if (unit.mounts) {
        for (let i = 0; i < unit.mounts.length; i++) {
          let mount = unit.mounts[i]
          if (mount && mount.weapon && mount.weapon.bullet) {
 
            mount.weapon.bullet.length = 130 * (1 + missingHealthRatio)
            mount.weapon.bullet.damage = 16 * (1 + missingHealthRatio)
          }
        }
      }
    }
  }))
})