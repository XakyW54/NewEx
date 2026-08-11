Events.on(ClientLoadEvent, e => {
  let zorynex = Vars.content.getByName(ContentType.planet, "newex-zorynex") || Vars.content.getByName(ContentType.planet, "zorynex")
  if (!zorynex) return

  // 1. Ép TechTree và Môi trường về Serpulo
  zorynex.techTree = Planets.serpulo.techTree
  zorynex.defaultEnv = Planets.serpulo.defaultEnv

  // 2. Cho phép phóng tàu / dùng bản thiết kế
  zorynex.allowLaunchLoadout = true
  zorynex.allowLaunchSchematics = true
  zorynex.allowLaunchToNumbered = true
  zorynex.allowSectorInvasion = true

  // 3. Quy tắc mặc định cho hành tinh Zorynex
  zorynex.ruleSetter = r => {
    r.bannedBlocks.clear()
    r.schematicsAllowed = true
  }

  // 4. Mesh 3D
  let meshList = []
  meshList.push(new NoiseMesh(zorynex, 123456, 6, 0.62, 3, 0.4, 0.8, 0.1, Color.valueOf("#2d3142"), Color.valueOf("#4f5d75"), 1, 0.5, 1.2, 0.5))
  meshList.push(new NoiseMesh(zorynex, 987654, 6, 0.64, 3, 0.5, 1.2, 0.2, Color.valueOf("#2a9d8f"), Color.valueOf("#e9c46a"), 1, 0.5, 2.0, 0.55))
  meshList.push(new NoiseMesh(zorynex, 456789, 6, 0.65, 5, 0.8, 0.5, 1.2, Color.valueOf("#1d2d44"), Color.valueOf("#748cab"), 2, 0.6, 1.5, 0.45))
  meshList.push(new NoiseMesh(zorynex, 777888, 6, 0.66, 6, 0.85, 0.35, 2.2, Color.valueOf("#e0f7fa"), Color.valueOf("#80deea"), 2, 0.7, 0.8, 0.35))
  
  zorynex.mesh = new MultiMesh(meshList)
})

// Mở khóa block khi load map Zorynex
Events.on(WorldLoadEvent, e => {
  if (Vars.state.isCampaign() && Vars.state.getSector() && Vars.state.getSector().planet) {
    if (Vars.state.getSector().planet.name.includes("zorynex")) {
      Vars.state.rules.bannedBlocks.clear()
    }
  }
})