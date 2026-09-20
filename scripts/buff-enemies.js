const buffedUnitIds = new java.util.HashSet();

function packRun(func) {
    return new java.lang.Runnable({ run: func });
}

function getWaveHealthMultiplier() {
    let hpPercentPerWave = Core.settings.getInt("newex-hp-per-wave-percent", 10);
    
    // Giới hạn an toàn từ 0 đến 999
    if (hpPercentPerWave <= 0) return 1.0;
    if (hpPercentPerWave > 999) hpPercentPerWave = 999;

    let currentWave = (Vars.state != null && Vars.state.wave > 0) ? Vars.state.wave : 1;
    
    let extraMultiplier = (currentWave * hpPercentPerWave) / 100.0;
    return 1.0 + extraMultiplier;
}

function applyHealthBuff(unit) {
    if (unit == null || unit.team == Vars.player.team()) return;

    let id = java.lang.Integer.valueOf(unit.id);

    if (!buffedUnitIds.contains(id)) {
        buffedUnitIds.add(id);

        let multiplier = getWaveHealthMultiplier();
        if (multiplier > 1.0) {
            unit.maxHealth = unit.maxHealth * multiplier;
            unit.health = unit.maxHealth;
            Fx.upgradeCore.at(unit.x, unit.y);
        }
    }
}

Events.on(UnitSpawnEvent, cons(e => {
    applyHealthBuff(e.unit);
}));

Events.on(WaveEvent, cons(e => {
    Time.run(10, packRun(() => {
        Groups.unit.each(cons(unit => {
            applyHealthBuff(unit);
        }));
    }));
}));

Events.on(UnitDestroyEvent, cons(e => {
    if (e.unit != null) {
        buffedUnitIds.remove(java.lang.Integer.valueOf(e.unit.id));
    }
}));