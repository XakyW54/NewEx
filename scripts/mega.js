const megaOriginals = {};

Events.on(ClientLoadEvent, cons(e => {
    let mega = Vars.content.getByName(ContentType.unit, "mega");
    if (mega == null) return;

    megaOriginals.health = mega.health;
    megaOriginals.armor = mega.armor;
    megaOriginals.speed = mega.speed;
    megaOriginals.buildSpeed = mega.buildSpeed;
    megaOriginals.mineSpeed = mega.mineSpeed;
    megaOriginals.mineTier = mega.mineTier;
    megaOriginals.range = mega.range;
    megaOriginals.maxRange = mega.maxRange;
    megaOriginals.itemCapacity = mega.itemCapacity;
}));

Events.on(WorldLoadEvent, cons(e => {
    let mega = Vars.content.getByName(ContentType.unit, "mega");
    if (mega == null || megaOriginals.health == null) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    if (isEnabled) {
        mega.health = megaOriginals.health * 6.0;
        mega.armor = megaOriginals.armor * 6.0;
        mega.speed = megaOriginals.speed * 6.0;
        mega.buildSpeed = megaOriginals.buildSpeed * 6.0;
        mega.mineSpeed = megaOriginals.mineSpeed * 6.0;
        mega.mineTier = Math.floor(megaOriginals.mineTier * 6.0);
        mega.range = megaOriginals.range * 6.0;
        mega.maxRange = megaOriginals.maxRange * 6.0;
        mega.itemCapacity = 500;
    } else {
        mega.health = megaOriginals.health;
        mega.armor = megaOriginals.armor;
        mega.speed = megaOriginals.speed;
        mega.buildSpeed = megaOriginals.buildSpeed;
        mega.mineSpeed = megaOriginals.mineSpeed;
        mega.mineTier = megaOriginals.mineTier;
        mega.range = megaOriginals.range;
        mega.maxRange = megaOriginals.maxRange;
        mega.itemCapacity = megaOriginals.itemCapacity;
    }
}));