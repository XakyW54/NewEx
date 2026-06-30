 
Events.on(BlockBuildEndEvent, (event) => {
     if (event.tile != null && event.tile.block() != null && !event.breaking) {
        
         let blockName = event.tile.block().name;
        
         if (blockName === "newex-leolyr-spawner" || blockName === "leolyr-spawner") {
            let tile = event.tile;
            let build = tile.build;
            
            if (build == null) return;

             Fx.shieldApply.at(build.x, build.y, 0, Color.sky);

             let task = new java.lang.Runnable({
                run: function() {
                     if (tile.build == build && build.isValid()) {
                        
                         let leolyrType = Vars.content.getByName(ContentType.unit, "newex-leolyr");
                        if (leolyrType != null) {
                            let unit = leolyrType.create(build.team);
                            unit.set(build.x, build.y);
                            unit.add();  
                            
                            if (unit.isGalileoJS) {
                                unit.level = 1;  
                            }
                        }

                         Fx.spawnShockwave.at(build.x, build.y);
                        Fx.shockwave.at(build.x, build.y);

                         tile.setAir();
                    }
                }
            });

             Time.run(300, task);
        }
    }
});
