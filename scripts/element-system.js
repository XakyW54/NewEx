(function() {
    const PROC_CHANCE = 0.20;
    const FROST_MAX_STACKS = 3;
    const FROST_DURATION = 300;
    const BURN_DURATION = 300;
    const BURN_FLAT_DAMAGE = 10;
    const BURN_DAMAGE_RATIO = 0.10;
    const HUANGHUO_DURATION = 600;
    const REACTION_BOTH_ORDERS = true;
    const ELEMENT_SEED = 20260425;
    const POLL_INTERVAL = 30;
    const CACHE_INTERVAL = 6;
    const ROLL_COOLDOWN = 12;
    const UNIT_COOLDOWN = 6;
    const ASSOC_RADIUS = 200;
    const MIN_DROP = 0.5;

    const TURRET_NAMES = ["aether-spiral", "bayrowfyr", "blaw", "blixalum", "buffetles", "dor", "drone-launcher", "dtg-soldern", "emperfum", "emperical", "endyr", "erysidus", "flazerd", "forstarsilum", "galaxvorram", "heliyron", "hitekalum", "holyder", "indeniter", "lavunder", "laytery", "lazash", "lyvervon", "maxitoner", "nethyr", "nucleytor", "overyr", "persefer", "plasanod", "rangtaturs", "ravendes", "reflecounum", "reguilater", "repulsyron", "sonicor", "swordoder", "tankani2k", "tankani4k", "tankani500", "tenytisyr", "therdum", "thermion", "tyber", "tyteryi", "vendicum", "xylaon", "zoj"];

    const AURA_TURRETS = { "newex-thermion": 45 };

    const elementOf = {};
    const marks = {};
    const track = {};
    const exactStamp = {};
    const rollCd = {};
    const unitCd = {};
    const targetMap = {};
    const turretCache = [];
    let statusCache = null;
    let lastPoll = 0;
    let lastCache = -999;
    let lastPrune = 0;
    let frame = 0;

    (function assign() {
        let names = TURRET_NAMES.slice().sort();
        let seed = ELEMENT_SEED;
        function rnd() {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        }
        for (let i = names.length - 1; i > 0; i--) {
            let j = Math.floor(rnd() * (i + 1));
            let tmp = names[i];
            names[i] = names[j];
            names[j] = tmp;
        }
        let half = Math.ceil(names.length / 2);
        for (let i = 0; i < names.length; i++) {
            elementOf["newex-" + names[i]] = i < half ? "frost" : "fire";
        }
    })();

    function isEn() {
        let loc = "";
        if (typeof Core !== "undefined" && Core.settings) loc = String(Core.settings.get("locale", "vi"));
        return loc.startsWith("en");
    }

    function getStatuses() {
        if (statusCache != null) return statusCache;
        let get = n => Vars.content.getByName(ContentType.status, "newex-" + n);
        let frost = [get("frostmark1"), get("frostmark2"), get("frostmark3")];
        let flame = get("flamemark");
        let huanghuo = get("hoanghoa");
        if (frost[0] == null || flame == null || huanghuo == null) return null;
        statusCache = { frost: frost, flame: flame, huanghuo: huanghuo };
        return statusCache;
    }

    function elementOfSource(source) {
        if (source == null) return null;
        let blk = source.block;
        if (blk === undefined || blk == null) return null;
        let e = elementOf[String(blk.name)];
        return e === undefined ? null : e;
    }

    function getMark(unit) {
        let m = marks[unit.id];
        if (m === undefined) {
            m = { unit: unit, frost: 0, frostEnd: 0, burnEnd: 0, burnDps: 0, burnNext: 0, huanghuoEnd: 0 };
            marks[unit.id] = m;
        }
        return m;
    }

    function clearFrost(unit, m) {
        let st = getStatuses();
        if (st != null) {
            for (let i = 0; i < st.frost.length; i++) {
                if (st.frost[i] != null) unit.unapply(st.frost[i]);
            }
        }
        m.frost = 0;
        m.frostEnd = 0;
    }

    function clearBurn(unit, m) {
        let st = getStatuses();
        if (st != null) unit.unapply(st.flame);
        m.burnEnd = 0;
        m.burnDps = 0;
        m.burnNext = 0;
    }

    function react(unit, m) {
        let st = getStatuses();
        if (st == null) return;
        clearFrost(unit, m);
        clearBurn(unit, m);
        m.huanghuoEnd = Time.time + HUANGHUO_DURATION;
        unit.apply(st.huanghuo, HUANGHUO_DURATION);
        try {
            Call.label(isEn() ? "[gold]HUANGHUO![]" : "[gold]HOÀNG HỎA![]", 1.4, unit.x, unit.y);
        } catch (err) {}
    }

    function applyFrost(unit) {
        let st = getStatuses();
        if (st == null) return;
        let m = getMark(unit);
        let now = Time.time;
        if (m.frost > 0 && now >= m.frostEnd) m.frost = 0;

        let prev = m.frost;
        m.frost = Math.min(FROST_MAX_STACKS, m.frost + 1);
        m.frostEnd = now + FROST_DURATION;

        if (prev > 0 && st.frost[prev - 1] != null && prev != m.frost) unit.unapply(st.frost[prev - 1]);
        let cur = st.frost[m.frost - 1];
        if (cur != null) unit.apply(cur, FROST_DURATION);

        if (REACTION_BOTH_ORDERS && m.burnEnd > now) react(unit, m);
    }

    function applyFire(unit, baseDmg) {
        let st = getStatuses();
        if (st == null) return;
        let m = getMark(unit);
        let now = Time.time;
        if (m.burnEnd > 0 && now >= m.burnEnd) {
            m.burnEnd = 0;
            m.burnDps = 0;
        }

        let dps = BURN_FLAT_DAMAGE + BURN_DAMAGE_RATIO * Math.max(0, baseDmg);
        if (m.burnEnd <= 0) m.burnNext = now + 60;
        m.burnDps = Math.max(m.burnDps, dps);
        m.burnEnd = now + BURN_DURATION;
        unit.apply(st.flame, BURN_DURATION);

        if (m.frost > 0 && m.frostEnd > now) react(unit, m);
    }

    function hit(source, unit, baseDmg) {
        if (Vars.net.client()) return;
        if (unit == null) return;
        exactStamp[unit.id] = frame;
        rollProc(source, unit, baseDmg);
    }

    function rollProc(source, unit, baseDmg) {
        if (Vars.net.client()) return;
        if (unit == null || !unit.isValid() || unit.dead) return;
        let element = elementOfSource(source);
        if (element == null) return;
        if (source.team == unit.team) return;
        if (!Mathf.chance(PROC_CHANCE)) return;

        if (element == "frost") applyFrost(unit);
        else applyFire(unit, Number(baseDmg) || 0);
    }

    function burnTick(unit, m) {
        try {
            unit.damagePierce(m.burnDps);
        } catch (err) {
            unit.damage(m.burnDps);
        }
        track[unit.id] = unit.health + unit.shield;
    }

    function clearAll() {
        for (let id in marks) delete marks[id];
        for (let id in track) delete track[id];
        for (let id in exactStamp) delete exactStamp[id];
        for (let id in rollCd) delete rollCd[id];
        for (let id in unitCd) delete unitCd[id];
        for (let id in targetMap) delete targetMap[id];
        turretCache.length = 0;
        statusCache = null;
        lastPoll = 0;
        lastCache = -999;
        lastPrune = 0;
    }

    function turretRange(b) {
        try {
            let r = Number(b.range());
            if (r > 0) return r;
        } catch (err) {}
        let br = Number(b.block.range);
        return br > 0 ? br : 200.0;
    }

    function refreshTurrets() {
        turretCache.length = 0;
        for (let id in targetMap) delete targetMap[id];
        Groups.build.each(cons(b => {
            if (b == null || !b.isValid()) return;
            if (elementOf[String(b.block.name)] === undefined) return;
            turretCache.push(b);
            let t = b.target;
            if (t != null && t instanceof Unit && t.isValid()) {
                let arr = targetMap[t.id];
                if (arr === undefined) {
                    arr = [];
                    targetMap[t.id] = arr;
                }
                arr.push(b);
            }
        }));
    }

    function rollFor(b, unit, drop, now) {
        let key = b.pos() + ":" + unit.id;
        let last = rollCd[key];
        if (last !== undefined && now - last < ROLL_COOLDOWN) return;
        rollCd[key] = now;
        rollProc(b, unit, drop);
    }

    function attribute(unit, drop, now) {
        let lastU = unitCd[unit.id];
        if (lastU !== undefined && now - lastU < UNIT_COOLDOWN) return;
        unitCd[unit.id] = now;

        let list = targetMap[unit.id];
        if (list !== undefined) {
            for (let i = 0; i < list.length; i++) {
                let b = list[i];
                if (b.isValid() && b.team != unit.team) rollFor(b, unit, drop, now);
            }
            return;
        }

        let best = null;
        let bestD = 1e18;
        let assoc2 = ASSOC_RADIUS * ASSOC_RADIUS;
        for (let i = 0; i < turretCache.length; i++) {
            let b = turretCache[i];
            if (b.team == unit.team || !b.isValid()) continue;
            let t = b.target;
            if (t == null) continue;
            let tx = t.x, ty = t.y;
            if ((tx - unit.x) * (tx - unit.x) + (ty - unit.y) * (ty - unit.y) > assoc2) continue;
            let reach = turretRange(b) + unit.hitSize;
            let d2 = (b.x - unit.x) * (b.x - unit.x) + (b.y - unit.y) * (b.y - unit.y);
            if (d2 > reach * reach || d2 >= bestD) continue;
            bestD = d2;
            best = b;
        }
        if (best != null) rollFor(best, unit, drop, now);
    }

    function observe(now) {
        frame++;
        if (turretCache.length == 0) {
            for (let id in track) delete track[id];
            return;
        }
        Groups.unit.each(cons(u => {
            if (u.dead || !u.isValid()) return;
            let id = u.id;
            let hp = u.health + u.shield;
            let prev = track[id];
            track[id] = hp;
            if (prev === undefined) return;
            let drop = prev - hp;
            if (drop < MIN_DROP) return;
            let ex = exactStamp[id];
            if (ex !== undefined && ex >= frame - 1) return;
            attribute(u, drop, now);
        }));

        if (now - lastPrune > 600 || now < lastPrune) {
            lastPrune = now;
            for (let id in track) delete track[id];
            for (let id in rollCd) if (now - rollCd[id] > 120) delete rollCd[id];
            for (let id in unitCd) if (now - unitCd[id] > 120) delete unitCd[id];
            for (let id in exactStamp) if (exactStamp[id] < frame - 120) delete exactStamp[id];
        }
    }

    function pollTurrets(now) {
        Groups.build.each(cons(b => {
            if (b == null || !b.isValid()) return;
            let name = String(b.block.name);

            let aura = AURA_TURRETS[name];
            if (aura !== undefined && b.affectRadius !== undefined) {
                let r = Number(b.affectRadius);
                if (!(r > 0)) return;
                Units.nearbyEnemies(b.team, b.x - r, b.y - r, r * 2, r * 2, cons(u => {
                    if (u.within(b.x, b.y, r)) hit(b, u, aura);
                }));
            }
        }));
    }

    Events.on(UnitDamageEvent, cons(e => {
        if (Vars.net.client()) return;
        let bullet = e.bullet;
        if (bullet == null) return;
        let owner = bullet.owner;
        if (owner == null || elementOfSource(owner) == null) return;
        hit(owner, e.unit, bullet.damage);
    }));

    Events.run(Trigger.update, () => {
        if (Vars.net.client() || !Vars.state.isGame()) return;
        let now = Time.time;
        if (now < lastPoll) lastPoll = now;
        if (now < lastCache) lastCache = -999;

        if (now - lastCache >= CACHE_INTERVAL) {
            lastCache = now;
            refreshTurrets();
        }

        for (let id in marks) {
            let m = marks[id];
            let u = m.unit;
            if (u == null || !u.isValid() || u.dead || !u.isAdded()) {
                delete marks[id];
                continue;
            }
            if (m.frost > 0 && now >= m.frostEnd) clearFrost(u, m);
            if (m.burnEnd > 0) {
                if (now >= m.burnEnd) {
                    m.burnEnd = 0;
                    m.burnDps = 0;
                } else if (now >= m.burnNext) {
                    m.burnNext += 60;
                    burnTick(u, m);
                }
            }
            if (m.frost <= 0 && m.burnEnd <= 0 && now >= m.huanghuoEnd) delete marks[id];
        }

        observe(now);

        if (now - lastPoll >= POLL_INTERVAL) {
            lastPoll = now;
            pollTurrets(now);
        }
    });

    Events.on(WorldLoadEvent, clearAll);

    Events.on(ClientLoadEvent, () => {
        TURRET_NAMES.forEach(n => {
            let blk = Vars.content.getByName(ContentType.block, "newex-" + n);
            if (blk == null) return;
            let el = elementOf["newex-" + n];
            let tag = el == "frost" ? "[#9bdcff]" : "[#ff9a3c]";
            let line;
            if (isEn()) {
                line = el == "frost"
                    ? "\n\n" + tag + "Element: Frost[] - 20% on hit to apply Frost (max 3 stacks, -10% move & fire rate each)."
                    : "\n\n" + tag + "Element: Flame[] - 20% on hit to apply Flame (10 + 10% base dmg per second).";
            } else {
                line = el == "frost"
                    ? "\n\n" + tag + "Nguyên tố: Băng giá[] - 20% khi trúng đích gắn ấn Băng giá (tối đa 3 tầng, mỗi tầng -10% di chuyển và tốc bắn)."
                    : "\n\n" + tag + "Nguyên tố: Lửa đốt[] - 20% khi trúng đích gắn ấn Lửa đốt (mỗi giây 10 + 10% sát thương gốc).";
            }
            if (blk.description != null && String(blk.description).indexOf("Nguyên tố:") < 0 && String(blk.description).indexOf("Element:") < 0) {
                blk.description = blk.description + line;
            }
        });
    });

    global.NexElement = {
        hit: hit,
        elementOf: elementOf,
        applyFrost: applyFrost,
        applyFire: applyFire
    };
})();
