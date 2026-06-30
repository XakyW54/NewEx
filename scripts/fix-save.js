 
function getTargetUnitNames() {
    return [
        "newex-leolyr",   
        "newex-kepber"  
    ];
}
 
Events.on(WorldLoadEvent, () => {
     Time.run(15, () => {
        if (Vars.state.isMenu() || Groups.unit == null) return;

         let unitNames = getTargetUnitNames();
        let validTypes = [];

         unitNames.forEach(name => {
            let type = Vars.content.getByName(ContentType.unit, name);
            if (type != null) {
                validTypes.push(type);
            }
        });

        if (validTypes.length === 0) return;

        let targetsToReplace = [];

         Groups.unit.each(u => {
            if (u != null && validTypes.includes(u.type)) {
                 if (u.isGalileoJS === undefined || u.level === undefined) {
                    
                    let savedLevel = 0;
                    
                     try {
                        if (u.stack != null && u.stack.item != null) {
                            if (u.stack.item.name === "spore-pod" || u.stack.item == Items.sporePod) {
                                savedLevel = u.stack.amount;
                            }
                        }
                    } catch (e) {
                        savedLevel = 0;
                    }

                    targetsToReplace.push({
                        type: u.type,
                        x: u.x,
                        y: u.y,
                        rotation: u.rotation,
                        team: u.team,
                        health: u.health,
                        level: savedLevel,
                        isPlayer: (Vars.player.unit() == u),
                        rawUnit: u
                    });
                }
            }
        });

         targetsToReplace.forEach(t => {
            try {
                t.rawUnit.remove();

                 let newUnit = t.type.spawn(t.team, t.x, t.y);
                if (newUnit != null) {
                    newUnit.rotation = t.rotation;
                    newUnit.health = Math.min(t.health, newUnit.maxHealth());

                     if (t.level > 0) {
                        newUnit.level = Math.min(10, t.level);
                        if (newUnit.stack != null) {
                            newUnit.stack.item = Items.sporePod;
                            newUnit.stack.amount = newUnit.level;
                        }
                    }

                     if (t.isPlayer) {
                        Vars.player.unit(newUnit);
                    }
                }
            } catch (err) {}
        });
    });
});
