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



require("galaxvorram");

require("emeralift-wall");


require("balashilon");




require("cargo-drone");
require("drone-launcher");


require("erysidus");
require("erysidus-drone");


require("buffetles");

require("forstarsilum");

require("persefer");




require("flasallow-factory");


require("dagger-aura");
require("crawler-dash");
require("vela");
require("flare");
require("nova");
require("atrax");
require("mace");
require("fortress");
require("scepter");
require("reign");
require("horizon");
require("zenith");
require("antumbra");
require("eclipse-buff");
require("pulsar-lightning");
require("quasar");
require("corvus");







require("endyr");









require("loadout-selection");

Events.on(ClientLoadEvent, e => {
  let zorynex = Vars.content.getByName(ContentType.planet, "zorynex") || 
                Vars.content.getByName(ContentType.planet, "newex-zorynex");

  if (!zorynex) return;

   const asteroidRing = new Planet("zorynex-asteroids", zorynex, 0.001, 0);
  
  asteroidRing.orbitRadius = 0;          
  asteroidRing.orbitTime = 1200;        
  asteroidRing.rotateTime = 600;
  asteroidRing.camRadius = 0.8;
  asteroidRing.drawOrbit = false;
  
  asteroidRing.hasAtmosphere = false;
  asteroidRing.accessible = false;
  asteroidRing.alwaysUnlocked = false;

   asteroidRing.mesh = extend(GenericMesh, {
      build() {
          let builder = new MeshBuilder();
          let count = 120; 
          let rand = new Rand(1337);

          let c1 = Color.valueOf("707070"); 
          let c2 = Color.valueOf("4a4a4a"); 
          let c3 = Color.valueOf("8e8e8e"); 

          for (let i = 0; i < count; i++) {
               let angle = rand.random(360.0) * Mathf.degRad;
              let radius = 2.2 + rand.range(0.6); 
              let elevation = rand.range(0.3);   

              let cx = Math.cos(angle) * radius;
              let cy = elevation;
              let cz = Math.sin(angle) * radius;

               let subBlocks = rand.random(3, 5);
              let baseSize = rand.random(0.08, 0.18);

              for (let j = 0; j < subBlocks; j++) {
                  let ox = cx + rand.range(baseSize * 0.3);
                  let oy = cy + rand.range(baseSize * 0.3);
                  let oz = cz + rand.range(baseSize * 0.3);

                  let sx = baseSize + rand.range(baseSize * 0.2);
                  let sy = baseSize + rand.range(baseSize * 0.2);
                  let sz = baseSize + rand.range(baseSize * 0.2);

                  let col = rand.chance(0.3) ? c3 : (rand.chance(0.5) ? c1 : c2);
                  builder.boxes(ox, oy, oz, sx, sy, sz, col);
              }
          }

          return builder.end();
      }
  });

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



