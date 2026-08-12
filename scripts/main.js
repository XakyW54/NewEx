require("hp");
require("fix-save");


 

 
 
require("dor");
 
require("xylaon");

require("vendicum");

require("tyber");

require("rangtaturs");

require("dtg-soldern");

require("lavunder");

require("lyvervon-system");

require("holyder-system");

require("reguilater");

require("flazerd");

require("blaw");

require("blixalum");

require("nucleytor");

require("tankani2k");

require("tankani4k");

require("heliyron");

require("emperfum");

require("plasanod");

require("indeniter");

require("reflecounum");

require("therdum");

require("swordoder");

require("lazash");

require("zoj");

require("maxitoner");

require("persefer");







Events.on(ClientLoadEvent, e => {
  // 1. Tìm hành tinh Zorynex
  let zorynex = Vars.content.getByName(ContentType.planet, "zorynex") || 
                Vars.content.getByName(ContentType.planet, "newex-zorynex");

  if (!zorynex) return;

  // 2. Gán Cây công nghệ Serpulo cho Zorynex
  zorynex.techTree = Planets.serpulo.techTree;

  // 3. Đăng ký Zorynex cho tất cả các khối trong cây Serpulo
  if (Planets.serpulo.techTree != null) {
    Planets.serpulo.techTree.addPlanet(zorynex);
  }

  // 4. GIẢI PHÁP CHÍNH: Thêm Zorynex vào `shownPlanets` cho tất cả các khối của Mod "newex"
  Vars.content.blocks().each(block => {
    // Nếu là khối do mod tạo ra (chứa tiền tố "newex") hoặc có thuộc tính minDatabaseClass/mininum...
    if (block.name.startsWith("newex-") || block.miniverse != null) {
      block.shownPlanets.add(zorynex);
    }
  });

  // 5. Cấu hình môi trường & khởi chạy
  zorynex.defaultEnv = Planets.serpulo.defaultEnv;
  zorynex.allowLaunchLoadout = true;
  zorynex.allowLaunchSchematics = true;
  zorynex.allowLaunchToNumbered = true;
  zorynex.allowSectorInvasion = true;

  // 6. Quy tắc chơi
  zorynex.ruleSetter = r => {
    r.bannedBlocks.clear();
    r.schematicsAllowed = true;
    r.waveTeam = Team.crux;
    r.hideSpawns = true;
    r.coreDestroyClear = true;
  };
});

// 7. Xử lý khi tải vào bản đồ thuộc Zorynex
Events.on(WorldLoadEvent, e => {
  if (Vars.state.isCampaign() && Vars.state.getSector() && Vars.state.getSector().planet) {
    let currentPlanet = Vars.state.getSector().planet;
    if (currentPlanet.name.includes("zorynex")) {
      Vars.state.rules.bannedBlocks.clear();
      Vars.state.rules.schematicsAllowed = true;
    }
  }
});



require("explayder");
require("cores");
require("planets");

require("elorix");



require("copesblock");

require("sta");



require("leolyr-summoner");

require("leolyr");






require("syrufpat-factory");








require("damage-display");


