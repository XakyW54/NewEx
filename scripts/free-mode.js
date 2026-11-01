(function() {
    const TARGET_AMOUNT = 100000;
    const CHECK_INTERVAL = 5;
    let lastCheck = 0;

    function isFreeMode() {
        let rules = Vars.state != null ? Vars.state.rules : null;
        return rules != null && (rules.infiniteResources === true || rules.editor === true);
    }

    function fillCore(core) {
        if (core == null || core.items == null) return;
        let target = Math.max(TARGET_AMOUNT, core.storageCapacity);
        Vars.content.items().each(item => {
            if (item == null || item.hidden) return;
            if (core.items.get(item) < target) core.items.set(item, target);
        });
    }

    function topUpTeam(team) {
        if (team == null) return;
        let cores = team.cores();
        if (cores == null) return;
        for (let i = 0; i < cores.size; i++) fillCore(cores.get(i));
    }

    Events.run(Trigger.update, () => {
        if (Vars.net.client() || !Vars.state.isGame()) return;
        if (Time.time - lastCheck < CHECK_INTERVAL && Time.time >= lastCheck) return;
        lastCheck = Time.time;
        if (!isFreeMode()) return;

        topUpTeam(Vars.state.rules.defaultTeam);
        if (Vars.player != null && Vars.player.team() != Vars.state.rules.defaultTeam) {
            topUpTeam(Vars.player.team());
        }
    });

    global.NexFree = {
        active: isFreeMode,
        fill: topUpTeam
    };
})();
