(function () {
    const colorCache = {};
    const frameCountCache = {};
    const slotLast = {};

    function region(name, fallback) {
        if (fallback !== undefined) return Core.atlas.find(name, fallback);
        return Core.atlas.find(name);
    }

    function color(hex) {
        let c = colorCache[hex];
        if (c === undefined) { c = Color.valueOf(hex); colorCache[hex] = c; }
        return c;
    }

    function teamBlocks(team, block) {
        try {
            return team.data().getBuildings(block);
        } catch (e) {
            return null;
        }
    }

    function scanCount(team, block) {
        const key = (team ? team.id : -1) + ":" + block.id;
        let e = frameCountCache[key];
        if (e !== undefined && e.t === Time.time) return e;
        let count = 0, first = null;
        Groups.build.each(b => {
            if (b.block === block && (team == null || b.team === team)) {
                count++;
                if (first == null) first = b;
            }
        });
        e = { t: Time.time, count: count, first: first };
        frameCountCache[key] = e;
        return e;
    }

    function teamCount(team, block) {
        if (block == null) return 0;
        if (team != null) {
            let l = teamBlocks(team, block);
            if (l != null) return l.size;
            return scanCount(team, block).count;
        }
        try {
            let total = 0;
            let act = Vars.state.teams.active;
            for (let i = 0; i < act.size; i++) total += act.get(i).getBuildings(block).size;
            return total;
        } catch (e) {
            return scanCount(null, block).count;
        }
    }

    function firstOf(team, block) {
        let l = teamBlocks(team, block);
        if (l != null) return l.size > 0 ? l.first() : null;
        return scanCount(team, block).first;
    }

    function every(key, ticks) {
        let last = slotLast[key];
        if (last === undefined || Time.time - last >= ticks || Time.time < last) {
            slotLast[key] = Time.time;
            return true;
        }
        return false;
    }

    const _vr = new Rect();
    function onScreen(x, y, pad) {
        Core.camera.bounds(_vr);
        let p = pad === undefined ? 0 : pad;
        return x >= _vr.x - p && x <= _vr.x + _vr.width + p && y >= _vr.y - p && y <= _vr.y + _vr.height + p;
    }

    let lvl = 0, lowCount = 0, midCount = 0;
    Events.run(Trigger.update, () => {
        if (!Vars.state.isGame() || Time.time % 30 > Time.delta) return;
        let fps = Core.graphics.getFramesPerSecond();
        if (fps < 25) { lowCount++; midCount++; } else if (fps < 40) { lowCount = 0; midCount++; } else { lowCount = 0; midCount = 0; }
        lvl = lowCount >= 4 ? 2 : (midCount >= 4 ? 1 : 0);
    });
    function level() { return lvl; }

    global.PerfCore = {
        region: region, color: color,
        teamBlocks: teamBlocks, teamCount: teamCount, firstOf: firstOf,
        every: every, onScreen: onScreen, level: level
    };
})();
