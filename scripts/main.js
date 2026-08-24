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




require("xeuw-conveyor");
require("wuex-conveyor");





require("obs-ore");



require("drexkou-drills");






require("antikei-logic");


require("hitekalum");




require("core-raykstone");

require("laser-brey");







require("redstone-wall");
require("generat-machine");
require("comduik");
require("pinfyr");








Events.on(ClientLoadEvent, e => {
 
  let zorynex = Vars.content.getByName(ContentType.planet, "zorynex") || 
                Vars.content.getByName(ContentType.planet, "newex-zorynex");

  if (!zorynex) return;

 
  zorynex.techTree = Planets.serpulo.techTree;

 
  if (Planets.serpulo.techTree != null) {
    Planets.serpulo.techTree.addPlanet(zorynex);
  }

 
  Vars.content.blocks().each(block => {
 
    if (block.name.startsWith("newex-") || block.miniverse != null) {
      block.shownPlanets.add(zorynex);
    }
  });

 
  zorynex.defaultEnv = Planets.serpulo.defaultEnv;
  zorynex.allowLaunchLoadout = true;
  zorynex.allowLaunchSchematics = true;
  zorynex.allowLaunchToNumbered = true;
  zorynex.allowSectorInvasion = true;

 
  zorynex.ruleSetter = r => {
    r.bannedBlocks.clear();
    r.schematicsAllowed = true;
    r.waveTeam = Team.crux;
    r.hideSpawns = true;
    r.coreDestroyClear = true;
  };
});

 
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















require("suv-27");
require("reykor");
require("terickal");









