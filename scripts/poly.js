const polyOriginals = {};

Events.on(ClientLoadEvent, cons(e => {
    let poly = Vars.content.getByName(ContentType.unit, "poly");
    if (poly == null) return;

    polyOriginals.health = poly.health;
    polyOriginals.armor = poly.armor;
    polyOriginals.speed = poly.speed;
    polyOriginals.buildSpeed = poly.buildSpeed;
    polyOriginals.mineSpeed = poly.mineSpeed;
    polyOriginals.mineTier = poly.mineTier;
    polyOriginals.range = poly.range;
    polyOriginals.maxRange = poly.maxRange;
    polyOriginals.itemCapacity = poly.itemCapacity;
}));

Events.on(WorldLoadEvent, cons(e => {
    let poly = Vars.content.getByName(ContentType.unit, "poly");
    if (poly == null || polyOriginals.health == null) return;

    let isEnabled = Core.settings.getBool("newex-logic-support-units", true);

    if (isEnabled) {
        poly.health = polyOriginals.health * 6.0;
        poly.armor = polyOriginals.armor * 6.0;
        poly.speed = polyOriginals.speed * 6.0;
        poly.buildSpeed = polyOriginals.buildSpeed * 6.0;
        poly.mineSpeed = polyOriginals.mineSpeed * 6.0;
        poly.mineTier = Math.floor(polyOriginals.mineTier * 6.0);
        poly.range = polyOriginals.range * 6.0;
        poly.maxRange = polyOriginals.maxRange * 6.0;
        poly.itemCapacity = 500;
    } else {
        poly.health = polyOriginals.health;
        poly.armor = polyOriginals.armor;
        poly.speed = polyOriginals.speed;
        poly.buildSpeed = polyOriginals.buildSpeed;
        poly.mineSpeed = polyOriginals.mineSpeed;
        poly.mineTier = polyOriginals.mineTier;
        poly.range = polyOriginals.range;
        poly.maxRange = polyOriginals.maxRange;
        poly.itemCapacity = polyOriginals.itemCapacity;
    }
}));