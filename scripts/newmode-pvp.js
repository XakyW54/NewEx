(function() {
    const DRONE_IDS = [
        "duo", "scatter", "scorch", "hail", "wave", "lancer", "arc", "parallax", "swarmer",
        "salvo", "segment", "tsunami", "fuse", "ripple", "cyclone", "foreshadow", "spectre", "meltdown",
        "breach", "diffuse", "sublimate", "titan", "disperse", "afflict", "lustre", "scathe", "smite", "malign"
    ];

    const MAP_ID = "pvpnewex3110";
    const REWARD_POINTS = 30;

    const TAG_ACTIVE = "newex-pvp";
    const TAG_DATA = "newex-pvp-data";
    const TAG_TEAMS = "newex-pvp-teams";
    const TAG_ASSIGN = "newex-pvp-assign";
    const KEY_EXP = "newex-pvp-exp-percent";
    const KEY_DRONES = "newex-pvp-max-drones";
    const KEY_STORE = "newex-pvp-store";
    const KEY_HUD = "newex-pvp-hud";
    const KEY_HUD_X = "newex-pvp-hud-x";
    const KEY_HUD_Y = "newex-pvp-hud-y";
    const RESPAWN_SEC = [2, 4, 6, 9, 12];
    const CORE_MOUNT = -2;
    const DEFAULT_EXP = 100;
    const DEFAULT_DRONES = 3;
    const LIMIT_EXP = 1000;
    const LIMIT_DRONES = 12;

    const SYNC_KIND = "newex-pvp-sync";
    const REQ_UP = "newex-pvp-up";
    const REQ_BUY = "newex-pvp-buy";
    const REQ_SELL = "newex-pvp-sell";
    const REQ_UNIT = "newex-pvp-unit";
    const REQ_MODE = "newex-pvp-mode";

    const MAX_LEVEL = 99;
    const FREE_SWITCH_LEVEL = 5;
    const STAT_PER_PAGE = 4;
    const TURRET_PER_PAGE = 5;
    const STAT_MAX = 20;
    const START_POINTS = 3;
    const PASSIVE_EXP = 60;
    const PASSIVE_INTERVAL = 3600;
    const MAX_WAVE_UNITS = 200;
    const PCT_STAT = 8;
    const EXP_PER_HP = 0.1;
    const EXP_HP_BONUS_REF = 5000;
    const EXP_HP_BONUS_MAX = 1.5;
    const CREDIT_RADIUS = 420;
    const NEAR_CORE = 240;
    const AURA_BURN_TICKS = 600;
    const WAVE_SPACING = 2400;
    const FIRST_WAVE = 1200;
    const WAVE_UNIT_CAP = 1000;
    const EQUIPPED = -1;
    const EQUIP_SLOT_CAP = 12;
    const REQ_BARR = "newex-pvp-barr";
    const BARRACKS = [
        { t: "dagger", sec: 10, n: 1, cap: 4, cost: 3 },
        { t: "dagger", sec: 8, n: 1, cap: 6, cost: 4 },
        { t: "dagger", sec: 7, n: 2, cap: 8, cost: 5 },
        { t: "mace", sec: 12, n: 1, cap: 6, cost: 7 },
        { t: "mace", sec: 9, n: 1, cap: 8, cost: 9 },
        { t: "mace", sec: 7, n: 2, cap: 10, cost: 11 },
        { t: "fortress", sec: 14, n: 1, cap: 6, cost: 14 },
        { t: "fortress", sec: 10, n: 1, cap: 8, cost: 18 },
        { t: "scepter", sec: 25, n: 1, cap: 3, cost: 24 },
        { t: "reign", sec: 45, n: 1, cap: 2, cost: 32 }
    ];

    const WAVES = [
        { t: "dagger", b: 1, e: 60, sp: 1, n: 2, sc: 2, mx: 16 },
        { t: "mace", b: 8, e: 90, sp: 2, n: 1, sc: 2, mx: 10 },
        { t: "fortress", b: 18, e: 120, sp: 3, n: 1, sc: 2, mx: 8 },
        { t: "quasar", b: 32, e: 999, sp: 4, n: 1, sc: 3, mx: 6 },
        { t: "scepter", b: 45, e: 999, sp: 6, n: 1, sc: 4, mx: 3 },
        { t: "reign", b: 80, e: 999, sp: 10, n: 1, sc: 5, mx: 2 }
    ];

    const HP_PCT = 12;
    const HP_FLAT = 20;
    const ARM_FLAT = 1;
    const ARM_CUT = 1.5;
    const ARM_CUT_MAX = 50;
    const ATK_PCT = 8;
    const ATK_FLAT = 0.3;
    const SPD_PCT = 4;
    const SPD_FLAT = 0.01;

    function armorCut(l) {
        return Math.min(ARM_CUT_MAX, l * ARM_CUT);
    }

    const REGEN_PCT = 0.25;
    const REGEN_THRESHOLD = 0.99;
    const DMG_PER_HP = 0.00025;
    const DMG_PER_ARMOR = 0.01;
    const KNOCK_PER = 1.0;

    const TURRET_OVERRIDES = {
        scatter: { spread: 8, rapidMul: 0.4 },
        parallax: { equip: true, beam: true, pull: true, beamDps: 24, pullForce: 0.6 },
        salvo: { equip: true, rail: true, rangeTiles: 33, railPct: 150, railLen: 33, railWidth: 9, railInterval: 120 },
        meltdown: { equip: true, blast: true, rangeTiles: 20, blastPct: 100, blastRadius: 3, blastInterval: 60 },
        sublimate: { liquidAmmo: "hydrogen" },
        scorch: { aura: true, auraRange: 15, auraAtkPct: 50, auraArmorPct: 50 },
        lustre: { equip: false },
        scathe: { equip: false },
        malign: { costMul: 2 }
    };

    let shredMap = new Map();

    const STATS = [
        { vi: "Máu", en: "Health", f: function(l) { return "+" + (l * HP_PCT) + "%  +" + (l * HP_FLAT) + " " + tr("máu", "HP"); } },
        { vi: "Giáp", en: "Armor", f: function(l) { return "+" + (l * ARM_FLAT) + " " + tr("giáp", "armor") + "  -" + armorCut(l).toFixed(1) + "% " + tr("sát thương nhận", "damage taken"); } },
        { vi: "Tấn công", en: "Attack", f: function(l) { return "+" + (l * ATK_PCT) + "%  +" + (l * ATK_FLAT).toFixed(1) + " " + tr("sát thương/phát", "dmg/hit"); } },
        { vi: "Tốc độ di chuyển", en: "Move speed", f: function(l) { return "+" + (l * SPD_PCT) + "%  +" + (l * SPD_FLAT).toFixed(2) + " " + tr("tốc", "speed"); } },
        { vi: "Tốc độ bắn", en: "Fire rate", f: function(l) { return "+" + (l * 6) + "%"; } },
        { vi: "Tỉ lệ bạo kích", en: "Crit chance", f: function(l) { return (l * 2) + "%"; } },
        { vi: "Sát thương bạo kích", en: "Crit damage", f: function(l) { return (150 + l * 12) + "%"; } },
        { vi: "Xuyên giáp", en: "Armor pierce", f: function(l) { return (l * 5) + "%"; } },
        { vi: "Sát thương % máu tối đa", en: "Max HP damage", mx: 9, f: function(l) { return ((l + 1) / 10).toFixed(1) + "%"; } },
        { vi: "Hồi máu", en: "Regeneration", f: function(l) { return "+" + (l * REGEN_PCT).toFixed(2) + tr("% máu tối đa mỗi giây (khi máu dưới 99%)", "% max HP per second (when below 99% HP)"); } },
        { vi: "Sát thương theo máu", en: "HP-based damage", f: function(l) { return "+" + (l * DMG_PER_HP * 1000).toFixed(1) + "% " + tr("mỗi 1000 máu hiện tại", "per 1000 current HP"); } },
        { vi: "Sát thương theo giáp", en: "Armor-based damage", f: function(l) { return "+" + (l * DMG_PER_ARMOR * 10).toFixed(1) + "% " + tr("mỗi 10 giáp hiện tại", "per 10 current armor"); } },
        { vi: "Đẩy lùi", en: "Knockback", f: function(l) { return "+" + (l * KNOCK_PER).toFixed(2) + " " + tr("lực đẩy lùi", "knockback"); } }
    ];

    function statMax(i) {
        let m = STATS[i].mx;
        return m > 0 ? m : STAT_MAX;
    }

    let store = {};
    let byId = {};
    let teamsCache = null;
    let rolled = {};
    let rolledN = 0;
    let pierceCache = {};
    let defsCache = null;
    let equipCd = {};
    let equipAng = {};
    let equipBeam = {};
    let equipRail = {};
    let hostOwner = {};
    let auraSeen = {};
    let respawnLock = {};
    let coreT = 0;
    let deathOk = null;
    let hudPanel = null;
    let hudLastW = 0;
    let hudLastH = 0;
    let swapPending = {};
    let burstState = {};
    let logged = {};
    let passiveT = PASSIVE_INTERVAL;
    let ver = 0;
    let dirty = false;
    let syncT = 0;
    let saveT = 0;
    let winT = 0;
    let orphanT = 0;
    let turretT = 0;
    let pruneT = 0;
    let winning = false;
    let seenBoth = false;
    let assignCache = null;
    let seenPl = {};
    let upDialog = null;
    let upTab = 0;
    let upScroll = 0;
    let upPane = null;
    let restoreN = 0;

    let registered = false;

    function isEn() {
        return String(Core.settings.getString("locale")).startsWith("en");
    }

    function tr(vi, en) {
        return isEn() ? en : vi;
    }

    function getTags() {
        let r = Vars.state != null ? Vars.state.rules : null;
        return (r != null && r.tags != null) ? r.tags : null;
    }

    function fx(x, y) {
        try {
            if (!Vars.net.client()) {
                Call.effect(Fx.spawn, x, y, 0, Color.white);
                return;
            }
        } catch (err) {}
        try { Fx.spawn.at(x, y); } catch (err) {}
    }

    function spawnFx(x, y) {
        fx(x, y);
        try {
            if (!Vars.net.client()) Call.effect(Fx.spawn, x, y, 90, Color.white);
        } catch (err) {}
    }

    function syncRules() {
        try {
            if (Vars.net.server()) Call.setRules(Vars.state.rules);
        } catch (err) {}
    }

    function pvpTeams() {
        if (teamsCache != null) return teamsCache;
        let tags = getTags();
        let out = [];
        if (tags != null) {
            let str = String(tags.get(TAG_TEAMS, ""));
            if (str.length > 0) {
                let a = str.split(",");
                for (let i = 0; i < a.length; i++) {
                    let t = Team.get(parseInt(a[i]));
                    if (t != null && t !== Team.crux && t !== Team.derelict) out.push(t);
                }
            }
        }
        if (out.length < 2) {
            out = [];
            for (let i = 0; i < Team.all.length; i++) {
                let t = Team.all[i];
                if (t !== Team.derelict && t !== Team.crux && t.cores().size > 0) out.push(t);
            }
            let fill = [Team.sharded, Team.blue, Team.green, Team.malis];
            for (let k = 0; k < fill.length && out.length < 2; k++) {
                let has = false;
                for (let j = 0; j < out.length; j++) {
                    if (out[j] == fill[k]) has = true;
                }
                if (!has) out.push(fill[k]);
            }
            if (tags != null && Vars.state != null && Vars.state.isGame()) {
                let ids = [];
                for (let q = 0; q < out.length; q++) ids.push(out[q].id);
                tags.put(TAG_TEAMS, ids.join(","));
            }
        }
        teamsCache = out;
        return out;
    }

    function isPvpMap() {
        try {
            let m = Vars.state != null ? Vars.state.map : null;
            if (m == null || m.file == null) return false;
            return String(m.file.nameWithoutExtension()) === MAP_ID;
        } catch (err) {}
        return false;
    }

    function isActive() {
        if (Vars.state == null || !Vars.state.isGame()) return false;
        let tags = getTags();
        if (tags != null && String(tags.get(TAG_ACTIVE, "0")) === "1") return true;
        return isPvpMap();
    }

    function expPercent() {
        let v = DEFAULT_EXP;
        try { v = Core.settings.getInt(KEY_EXP, DEFAULT_EXP); } catch (err) {}
        if (!(v >= 0)) v = DEFAULT_EXP;
        return Math.min(LIMIT_EXP, v);
    }

    function maxDrones() {
        let v = DEFAULT_DRONES;
        try { v = Core.settings.getInt(KEY_DRONES, DEFAULT_DRONES); } catch (err) {}
        if (!(v >= 0)) v = DEFAULT_DRONES;
        return Math.min(LIMIT_DRONES, Math.floor(v));
    }

    function newState() {
        return { lv: 1, exp: 0, pts: START_POINTS, u: 0, s: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], d: [], p: [], b: 0 };
    }

    function getUid(pl) {
        try {
            let u = String(pl.uuid());
            if (u != null && u.length > 0) return u;
        } catch (err) {}
        return "id:" + pl.id;
    }

    function normState(s) {
        if (s == null || s.s == null || s.d == null) return null;
        if (typeof s.lv !== "number" || typeof s.exp !== "number" || typeof s.pts !== "number") return null;
        if (typeof s.u !== "number") s.u = 0;
        if (typeof s.b !== "number") s.b = 0;
        while (s.s.length < STATS.length) s.s.push(0);
        if (s.p == null || s.p.length !== s.d.length) {
            s.d = [];
            s.p = [];
        }
        return s;
    }

    function progress(s) {
        return s.lv * 1000000 + s.exp;
    }

    function readJson(str, into) {
        try {
            let o = JSON.parse(String(str));
            for (let k in o) {
                let s = normState(o[k]);
                if (s == null) continue;
                let cur = into[k];
                if (cur == null || progress(s) > progress(cur)) into[k] = s;
            }
        } catch (err) {}
    }

    function loadStore() {
        store = {};
        let tags = getTags();
        if (tags != null) readJson(tags.get(TAG_DATA, "{}"), store);
        if (!Vars.net.client()) {
            try { readJson(Core.settings.getString(KEY_STORE, "{}"), store); } catch (err) {}
        }
    }

    let lastForce = 0;

    function saveStore(force) {
        let tags = getTags();
        let json = "{}";
        try { json = JSON.stringify(store); } catch (err) { return; }
        if (tags != null && isActive()) {
            try { tags.put(TAG_DATA, json); } catch (err) {}
        }
        if (Vars.net.client()) return;
        try {
            let old = {};
            readJson(Core.settings.getString(KEY_STORE, "{}"), old);
            for (let k in old) {
                if (store[k] == null) store[k] = old[k];
            }
            Core.settings.put(KEY_STORE, JSON.stringify(store));
            let now = Time.millis();
            if (force === true || now - lastForce > 15000) {
                lastForce = now;
                Core.settings.forceSave();
            }
        } catch (err) {
            logOnce("savefail", "cannot persist player data: " + err);
        }
    }

    function bind(pl) {
        let st = byId[pl.id];
        if (st != null) return st;
        let uid = getUid(pl);
        st = store[uid];
        if (st == null) {
            st = newState();
            store[uid] = st;
        }
        byId[pl.id] = st;
        dirty = true;
        return st;
    }

    function changed() {
        dirty = true;
        ver++;
        saveStore(false);
    }

    function tierType(lv) {
        let list = [UnitTypes.merui, UnitTypes.cleroi, UnitTypes.anthicus, UnitTypes.tecta, UnitTypes.collaris];
        return list[Math.min(5, Math.max(1, lv)) - 1];
    }

    function tierCap(lv) {
        return Math.min(5, Math.max(1, lv));
    }

    function activeTier(st) {
        let cap = tierCap(st.lv);
        if (st.lv < FREE_SWITCH_LEVEL) return cap;
        let u = st.u;
        if (!(u >= 1) || u > 5) return cap;
        return u;
    }

    function expNeed(lv) {
        let n = lv - 1;
        return Math.round(100 + 70 * n + 12 * n * n);
    }

    function logOnce(key, msg, info) {
        if (logged[key] === true) return;
        logged[key] = true;
        if (info === true) Log.info("[NexPvp] " + msg);
        else Log.err("[NexPvp] " + msg);
    }

    function toast(pl, text) {
        try {
            if (global.NexNet != null) global.NexNet.toastTo(pl, text, 3);
        } catch (err) {}
    }

    function addExp(pl, amount) {
        let st = bind(pl);
        if (st.lv >= MAX_LEVEL) return;
        st.exp += amount;
        let before = st.lv;
        let up = 0;
        while (st.lv < MAX_LEVEL && st.exp >= expNeed(st.lv)) {
            st.exp -= expNeed(st.lv);
            st.lv++;
            st.pts++;
            up++;
        }
        if (st.lv >= MAX_LEVEL) st.exp = 0;
        if (up > 0) {
            toast(pl, tr("[accent]Lên cấp ", "[accent]Level up ") + st.lv + tr(" - +", " - +") + up + tr(" điểm nâng cấp và ô lắp pháo. Về lõi để nâng cấp!", " upgrade point(s) and turret slot(s). Return to your core!") +
                (before < FREE_SWITCH_LEVEL && st.lv >= FREE_SWITCH_LEVEL ? tr(" Đã mở đổi unit trong bảng nâng cấp!", " You can now switch units in the upgrade menu!") : ""));
            ver++;
        }
        dirty = true;
    }

    function broadcast() {
        let out = {};
        for (let id in byId) {
            let s = byId[id];
            out[id] = [s.lv, Math.floor(s.exp), s.pts, s.s, s.d, s.u || 0, s.p, s.b || 0];
        }
        if (Vars.net.server()) {
            try { Call.clientPacketReliable(SYNC_KIND, JSON.stringify({ d: out })); } catch (err) {}
        }
        ver++;
    }

    function onSync(content) {
        try {
            let o = JSON.parse(String(content));
            let n = {};
            for (let id in o.d) {
                let a = o.d[id];
                let pp = (a[6] != null && a[4] != null && a[6].length === a[4].length) ? a[6] : [];
                n[id] = { lv: a[0], exp: a[1], pts: a[2], s: a[3], d: a[4], u: a[5] || 0, p: pp, b: a[7] || 0 };
            }
            byId = n;
            ver++;
        } catch (err) {}
    }

    function register() {
        if (registered) return;
        try {
            if (Vars.netClient == null) return;
            Vars.netClient.addPacketHandler(SYNC_KIND, new Cons({
                get: function(content) { onSync(content); }
            }));
            registered = true;
        } catch (err) {}
    }

    register();
    Events.on(ClientLoadEvent, new Cons({ get: function(e) { register(); } }));
    Events.on(ServerLoadEvent, new Cons({ get: function(e) { register(); } }));
    Events.on(WorldLoadEvent, new Cons({ get: function(e) { register(); } }));

    function droneBlock(id) {
        let b = Vars.content.getByName(ContentType.block, "newex-" + id);
        if (b == null) b = Vars.content.getByName(ContentType.block, id);
        if (b == null) return null;
        if (b instanceof Turret) return b;
        try {
            if (typeof BaseTurret !== "undefined" && b instanceof BaseTurret) return b;
        } catch (err) {}
        return null;
    }

    function costOf(blk) {
        let w = 0;
        try {
            let rq = blk.requirements;
            for (let i = 0; i < rq.length; i++) w += rq[i].amount * rq[i].item.cost;
        } catch (err) {}
        return Math.max(1, Math.round(Math.sqrt(w) / 8));
    }

    function normId(id) {
        let x = String(id).replace(/^\s+|\s+$/g, "");
        if (x.indexOf("newex-") === 0) x = x.substring(6);
        return x;
    }

    function className(o) {
        try { return String(o.getClass().getSimpleName()); } catch (err) { return ""; }
    }

    function equippable(blk) {
        let cn = className(blk);
        if (cn === "ContinuousTurret" || cn === "ContinuousLiquidTurret" || cn === "LaserTurret" ||
            cn === "TractorBeamTurret" || cn === "PointDefenseTurret") return false;
        if (blk instanceof ItemTurret) return true;
        try { if (typeof PowerTurret !== "undefined" && blk instanceof PowerTurret) return true; } catch (err) {}
        try { if (typeof LiquidTurret !== "undefined" && blk instanceof LiquidTurret) return true; } catch (err) {}
        return false;
    }

    function droneDefs() {
        if (defsCache != null) return defsCache;
        let list = [];
        let map = {};
        for (let i = 0; i < DRONE_IDS.length; i++) {
            let id = normId(DRONE_IDS[i]);
            if (id.length === 0 || map[id] != null) continue;
            let blk = droneBlock(id);
            if (blk == null) {
                Log.warn("[NexPvp] DRONE_IDS: không tìm thấy pháo \"" + id + "\" (newex-" + id + " hoặc " + id + "), bỏ qua");
                continue;
            }
            let ov = TURRET_OVERRIDES[id] || {};
            let eq = ov.equip !== undefined ? ov.equip : equippable(blk);
            let cost = costOf(blk);
            if (ov.costMul) cost = Math.max(1, Math.round(cost * ov.costMul));
            let d = { id: id, block: blk, cost: cost, equip: eq, ov: ov };
            list.push(d);
            map[d.id] = d;
        }
        defsCache = { list: list, map: map };
        patchTurrets(list);
        return defsCache;
    }

    let patchedTurrets = false;

    function patchTurrets(list) {
        if (patchedTurrets) return;
        patchedTurrets = true;
        for (let i = 0; i < list.length; i++) {
            let d = list[i];
            if (d.ov.ground) setf(d.block, "targetGround", true);
            if (d.ov.spread !== undefined) setf(d.block, "inaccuracy", d.ov.spread);
            if (d.ov.rapidMul) {
                try { d.block.reload = Math.max(1, d.block.reload * d.ov.rapidMul); } catch (err) {}
            }
        }
    }

    function setf(o, k, v) {
        try { o[k] = v; } catch (err) {}
    }

    function isDummyBullet(bt) {
        try { return bt.speed === 0 && bt.lifetime === 0 && bt.damage === 0; } catch (err) { return false; }
    }

    function ammoPairs(blk) {
        let out = [];
        let map = null;
        try { map = blk.ammoTypes; } catch (err) { logOnce("amr:" + blk.name, "cannot read ammoTypes of " + blk.name + ": " + err); }
        if (map == null) return out;
        let pools = [];
        try { pools.push(Vars.content.items()); } catch (err) {}
        try { pools.push(Vars.content.liquids()); } catch (err) {}
        for (let p = 0; p < pools.length; p++) {
            let seq = pools[p];
            for (let i = 0; i < seq.size; i++) {
                try {
                    let k = seq.get(i);
                    let v = map.get(k);
                    if (v != null) out.push({ k: k, v: v });
                } catch (err) {}
            }
        }
        return out;
    }

    function ammoItemFor(block) {
        let pairs = ammoPairs(block);
        let best = null;
        for (let i = 0; i < pairs.length; i++) {
            if (best == null) best = pairs[i].k;
            if (!isDummyBullet(pairs[i].v)) {
                best = pairs[i].k;
                break;
            }
        }
        return best;
    }

    function hasAmmoSafe(b) {
        try { return b.hasAmmo(); } catch (err) { return true; }
    }

    function fillAmmo(b, def) {
        let blk = def.block;
        if (def.ov && def.ov.liquidAmmo && b.liquids != null) {
            try {
                let liq = Liquids[def.ov.liquidAmmo];
                if (liq != null) {
                    let cap = blk.liquidCapacity > 0 ? blk.liquidCapacity : 30;
                    let room = cap - b.liquids.currentAmount();
                    if (room > 0.1) b.liquids.add(liq, room);
                }
            } catch (err) {}
        }
        if (blk instanceof ItemTurret) {
            if (def.ammoItem === undefined) def.ammoItem = ammoItemFor(blk);
            let item = def.ammoItem;
            if (item == null) return;
            let max = blk.maxAmmo;
            let guard = 0;
            while (guard < 300 && b.totalAmmo < max) {
                guard++;
                let before = b.totalAmmo;
                b.handleItem(b, item);
                if (b.totalAmmo <= before) break;
            }
            if (!hasAmmoSafe(b)) {
                try {
                    b.ammo.add(new Packages.mindustry.world.blocks.defense.turrets.ItemTurret.ItemEntry(item, max));
                    b.totalAmmo = max;
                } catch (err) {}
            }
            return;
        }
        try {
            if (typeof LiquidTurret !== "undefined" && blk instanceof LiquidTurret) {
                let lp = ammoPairs(blk);
                if (lp.length > 0) {
                    let liq = lp[0].k;
                    let room = blk.liquidCapacity - b.liquids.currentAmount();
                    if (room > 0.1) b.liquids.add(liq, room);
                }
            }
        } catch (err) {}
    }

    function fillConsumers(b, def) {
        let blk = def.block;
        let list = null;
        try { list = blk.consumers; } catch (err) {}
        if (list == null) return;
        for (let i = 0; i < list.length; i++) {
            let c = list[i];
            if (c == null) continue;
            try {
                if (c.optional === true) continue;
                let cn = className(c);
                if (cn === "ConsumeItems" && b.items != null) {
                    let arr = c.items;
                    for (let k = 0; k < arr.length; k++) {
                        let need = Math.min(blk.itemCapacity, arr[k].amount * 2);
                        if (b.items.get(arr[k].item) < need) b.items.set(arr[k].item, need);
                    }
                } else if (cn === "ConsumeLiquid" && b.liquids != null) {
                    let cap = blk.liquidCapacity;
                    if (b.liquids.get(c.liquid) < cap * 0.9) b.liquids.set(c.liquid, cap);
                } else if ((cn === "ConsumeCoolant" || cn === "ConsumeLiquidFilter") && b.liquids != null) {
                    let capW = blk.liquidCapacity;
                    if (b.liquids.get(Liquids.water) < capW * 0.9) b.liquids.set(Liquids.water, capW);
                }
            } catch (err) {}
        }
    }

    function supplyTurret(b, def, tick, pl) {
        try { if (b.power != null) b.power.status = 1; } catch (err) {}
        let isT = def.block instanceof Turret;
        let low = isT && !hasAmmoSafe(b);
        if (!tick && !low) return;
        try {
            fillAmmo(b, def);
        } catch (err) {
            if (def.errLogged !== true) {
                def.errLogged = true;
                Log.err("[NexPvp] fillAmmo " + def.id + ": " + err);
            }
        }
        try { fillConsumers(b, def); } catch (err) {}
        if (isT && !hasAmmoSafe(b) && def.warned !== true) {
            def.warned = true;
            Log.err("[NexPvp] turret " + def.id + " (" + className(b) + ") has no ammo after auto supply");
            if (pl != null) toast(pl, "[scarlet]" + def.block.localizedName + tr(" không nhận được đạn tự động (", " could not be auto-supplied (") + className(b) + ")");
        }
    }

    function spotFree(tx, ty, size, off) {
        for (let dx = -1; dx <= size; dx++) {
            for (let dy = -1; dy <= size; dy++) {
                let t = Vars.world.tile(tx - off + dx, ty - off + dy);
                if (t == null || t.solid() || t.build != null || t.floor().isDeep()) return false;
            }
        }
        return true;
    }

    function turretSpot(core, blk) {
        let size = blk.size;
        let off = Math.floor((size - 1) / 2);
        let base = core.block.size / 2 + size / 2 + 2;
        for (let r = base; r < base + 26; r += 1.5) {
            let start = Math.random() * 6.2832;
            for (let k = 0; k < 16; k++) {
                let a = start + (k / 16) * 6.2832;
                let tx = Math.round(core.tile.x + Math.cos(a) * r);
                let ty = Math.round(core.tile.y + Math.sin(a) * r);
                if (spotFree(tx, ty, size, off)) return { x: tx, y: ty };
            }
        }
        return null;
    }

    function placeTurret(pl, def) {
        let core = pl.team().core();
        if (core == null) return -1;
        let spot = turretSpot(core, def.block);
        if (spot == null) return -1;
        let tile = Vars.world.tile(spot.x, spot.y);
        if (tile == null) return -1;
        tile.setNet(def.block, pl.team(), 0);
        let b = tile.build;
        if (b == null || b.block !== def.block) return -1;
        supplyTurret(b, def, true, pl);
        fx(b.x, b.y);
        return tile.pos();
    }

    function removeTurret(pos, def) {
        if (!(pos >= 0)) return;
        let b = Vars.world.build(pos);
        if (b != null && def != null && b.block === def.block) {
            b.tile.setNet(Blocks.air, Team.derelict, 0);
        }
    }

    function turretAlive(pos, def, team) {
        let b = Vars.world.build(pos);
        return b != null && b.isValid() && b.block === def.block && b.team == team;
    }

    function feedTurrets(pl, st, tick, auth) {
        let defs = droneDefs();
        if (st.p.length !== st.d.length) return;
        for (let i = st.d.length - 1; i >= 0; i--) {
            let def = defs.map[st.d[i]];
            let pos = st.p[i];
            if (def == null) {
                if (tick && auth) {
                    let ob = droneBlock(st.d[i]);
                    let refund = ob != null ? costOf(ob) : 0;
                    if (pos >= 0) {
                        let eb = Vars.world.build(pos);
                        if (eb != null && ob != null && eb.block === ob && eb.team == pl.team()) {
                            try { eb.tile.setNet(Blocks.air, Team.derelict, 0); } catch (err) {}
                        }
                    }
                    st.d.splice(i, 1);
                    st.p.splice(i, 1);
                    st.pts += refund;
                    toast(pl, tr("[accent]Pháo đã bị gỡ khỏi danh sách, hoàn lại ", "[accent]Turret removed from the list, refunded ") + refund + tr(" điểm", " pt"));
                    changed();
                }
                continue;
            }
            if (!(pos >= 0)) continue;
            if (tick && auth && !turretAlive(pos, def, pl.team())) {
                st.d.splice(i, 1);
                st.p.splice(i, 1);
                toast(pl, tr("[scarlet]Một pháo của bạn đã bị phá hủy: ", "[scarlet]One of your turrets was destroyed: ") + def.block.localizedName);
                changed();
                continue;
            }
            let b = Vars.world.build(pos);
            if (b == null || b.block !== def.block) continue;
            supplyTurret(b, def, tick, auth ? pl : null);
        }
    }

    function fallbackBullet(blk) {
        let bt = null;
        try {
            let range = blk.range > 0 ? blk.range : 160;
            bt = new BasicBulletType(6, 14);
            bt.lifetime = range / 6;
            bt.width = 7;
            bt.height = 10;
            logOnce("fb:" + blk.name, "no ammo data for " + blk.name + ", using fallback bullet");
        } catch (err) {}
        return bt;
    }

    function equipBullet(def) {
        if (def.eqBullet !== undefined) return def.eqBullet;
        let blk = def.block;
        let bt = null;
        let pairs = ammoPairs(blk);
        for (let i = 0; i < pairs.length; i++) {
            if (bt == null) bt = pairs[i].v;
            if (!isDummyBullet(pairs[i].v)) {
                bt = pairs[i].v;
                break;
            }
        }
        if (bt == null) {
            try { bt = blk.shootType; } catch (err) {}
        }
        if (bt == null) bt = fallbackBullet(blk);
        def.eqBullet = bt;
        return bt;
    }

    function aimState(u, pl) {
        let shoot = false;
        let ax = 0;
        let ay = 0;
        try {
            ax = u.aimX;
            ay = u.aimY;
            shoot = u.isShooting === true;
        } catch (err) {}
        try {
            if (pl != null && pl.shooting === true) {
                shoot = true;
                ax = u.aimX;
                ay = u.aimY;
            }
        } catch (err) {}
        try {
            let m = u.mounts;
            if (m != null) {
                for (let i = 0; i < m.length; i++) {
                    if (m[i].shoot === true) {
                        shoot = true;
                        ax = m[i].aimX;
                        ay = m[i].aimY;
                        break;
                    }
                }
            }
        } catch (err) {}
        return { shoot: shoot, x: ax, y: ay };
    }

    function equipList(st, defs) {
        let out = [];
        if (st == null || st.p.length !== st.d.length) return out;
        for (let i = 0; i < st.d.length; i++) {
            if (st.p[i] !== EQUIPPED) continue;
            let def = defs.map[st.d[i]];
            if (def != null && def.equip) out.push(def);
        }
        return out;
    }

    function coreList(st, defs) {
        let out = [];
        if (st == null || st.p.length !== st.d.length) return out;
        for (let i = 0; i < st.d.length; i++) {
            if (st.p[i] !== CORE_MOUNT) continue;
            let def = defs.map[st.d[i]];
            if (def != null && def.equip) out.push(def);
        }
        return out;
    }

    function coreHost(pl, st) {
        try {
            if (st == null || coreCount(st) === 0) return null;
            let core = pl.team().core();
            if (core == null || !core.isValid()) return null;
            return {
                isCoreHost: true,
                build: core,
                x: core.x,
                y: core.y,
                hitSize: core.block.size * Vars.tilesize * 1.4,
                rotation: 0,
                team: core.team,
                reloadMultiplier: 1 + (st.s[4] || 0) * 0.06
            };
        } catch (err) {}
        return null;
    }

    function hostAim(h, pl) {
        if (h.isCoreHost === true) return { shoot: false, x: 0, y: 0 };
        return aimState(h, pl);
    }

    let weaponCache = {};

    function weaponMounts(type) {
        let c = weaponCache[type.id];
        if (c === undefined) {
            c = [];
            try {
                let ws = type.weapons;
                for (let i = 0; i < ws.size; i++) {
                    let w = ws.get(i);
                    if (w == null || w.bullet == null) continue;
                    if (w.controllable === false) continue;
                    c.push({ x: w.x, y: w.y });
                }
            } catch (err) {}
            weaponCache[type.id] = c;
        }
        return c;
    }

    function mountPos(u, k, n) {
        if (u.isCoreHost !== true) {
            try {
                let wm = weaponMounts(u.type);
                if (wm.length > 0) {
                    let m = wm[k % wm.length];
                    let rot = u.rotation - 90;
                    return { x: u.x + Angles.trnsx(rot, m.x, m.y), y: u.y + Angles.trnsy(rot, m.x, m.y), w: true };
                }
            } catch (err) {}
        }
        if (n <= 1) return { x: u.x, y: u.y };
        let inner = Math.min(n, 6);
        let ring = k < inner ? 0 : 1;
        let cnt = ring === 0 ? inner : n - inner;
        let idx = ring === 0 ? k : k - inner;
        let a = u.rotation + (idx / cnt) * 360 + ring * (180 / cnt);
        let r = u.hitSize * (ring === 0 ? 0.28 : 0.5);
        if (n <= 6) r = u.hitSize * 0.3;
        return { x: u.x + Mathf.cosDeg(a) * r, y: u.y + Mathf.sinDeg(a) * r };
    }

    function mountScale(u, def, n) {
        let base = def.block.size * Vars.tilesize;
        let f = n <= 1 ? 0.6 : (n <= 6 ? 0.38 : 0.28);
        let want = u.hitSize * f;
        return Math.max(0.15, Math.min(1, want / base));
    }

    function findTarget(u, def, mp) {
        let blk = def.block;
        let ta = true;
        let tg = true;
        try { ta = blk.targetAir !== false; tg = blk.targetGround !== false; } catch (err) {}
        if (def.ov && def.ov.ground) tg = true;
        let range = 0;
        try { range = blk.range; } catch (err) {}
        if (!(range > 0)) range = 160;
        if (def.ov && def.ov.rangeTiles) range = def.ov.rangeTiles * Vars.tilesize;
        let team = u.team;
        let best = null;
        let bd = 1e9;
        try {
            Groups.unit.each(new Cons({
                get: function(e) {
                    if (e == null || e.team == team || e.team == Team.derelict || e.dead || !e.isValid()) return;
                    if (e.isFlying() ? !ta : !tg) return;
                    let d = Mathf.dst(mp.x, mp.y, e.x, e.y) - e.hitSize / 2;
                    if (d <= range && d < bd) {
                        bd = d;
                        best = e;
                    }
                }
            }));
        } catch (err) {
            logOnce("tgt1", "findTarget (unit): " + err);
        }
        if (best != null) return best;
        if (tg) {
            try {
                return Units.closestTarget(team, mp.x, mp.y, range,
                    new Boolf({ get: function(e) { return false; } }),
                    new Boolf({ get: function(bd2) { return true; } }));
            } catch (err) {
                logOnce("tgt2", "findTarget (building): " + err);
            }
        }
        return null;
    }

    function leadPos(mp, t, bt) {
        let tx = t.x;
        let ty = t.y;
        try {
            if (bt.speed > 0.01 && t.vel != null) {
                let v = Predict.intercept(mp.x, mp.y, t.x, t.y, t.vel.x, t.vel.y, bt.speed);
                if (v != null && !isNaN(v.x) && !isNaN(v.y)) {
                    tx = v.x;
                    ty = v.y;
                }
            }
        } catch (err) {}
        return { x: tx, y: ty };
    }

    function fireEquip(u, def, bt, mp, tx, ty) {
        let blk = def.block;
        let own = u.isCoreHost === true ? u.build : u;
        let ang = Angles.angle(mp.x, mp.y, tx, ty);
        let shots = 1;
        let spread = 0;
        try {
            shots = Math.min(12, Math.max(1, blk.shoot.shots));
            if (className(blk.shoot) === "ShootSpread") spread = blk.shoot.spread;
        } catch (err) {}
        if (def.ov && def.ov.shots) shots = def.ov.shots;
        let inacc = 0;
        try { inacc = blk.inaccuracy; } catch (err) {}
        let off = mp.w === true ? 0 : Math.min(blk.size * Vars.tilesize * 0.5, u.hitSize * 0.5);
        let x = mp.x + Mathf.cosDeg(ang) * off;
        let y = mp.y + Mathf.sinDeg(ang) * off;

        let ls = 1;
        try {
            if (bt.scaleLife === true) {
                let rng = bt.range > 0 ? bt.range : bt.speed * bt.lifetime;
                if (rng > 0) ls = Math.max(0.05, Math.min(1, Mathf.dst(x, y, tx, ty) / rng));
            }
        } catch (err) {}

        for (let k = 0; k < shots; k++) {
            let a = ang + (k - (shots - 1) / 2) * spread + (Math.random() - 0.5) * 2 * inacc;
            try {
                bt.create(own, u.team, x, y, a, -1, 1, ls, null);
            } catch (err) {
                try {
                    bt.create(own, u.team, x, y, a);
                } catch (err2) {
                    logOnce("create:" + def.id, "bullet create failed for " + def.id + ": " + err2);
                }
            }
        }
        if (!Vars.headless) {
            try { blk.shootSound.at(mp.x, mp.y, 0.9 + Math.random() * 0.2); } catch (err) {}
        }
        logOnce("fired:" + def.id, "equip turret fired: " + def.id, true);
        return true;
    }

    function mountFire(pl, list, u, pfx) {
        let n = list.length;
        if (n === 0) return;
        let ast = null;
        if (u.isCoreHost === true && u.build != null) hostOwner[u.build.id] = pl.id;
        for (let k = 0; k < n; k++) {
            let def = list[k];
            let key = pl.id + ":" + pfx + k + ":" + def.id;
            if (def.ov && def.ov.aura) {
                let acd = equipCd[key];
                if (acd === undefined) acd = 0;
                acd -= Time.delta * Math.max(0.1, u.reloadMultiplier);
                if (acd <= 0) {
                    auraTick(pl, u, def);
                    acd = 60;
                }
                equipCd[key] = acd;
                continue;
            }
            if (def.ov && def.ov.rail) {
                let rmp = mountPos(u, k, n);
                let rcd = equipCd[key];
                if (rcd === undefined) rcd = 0;
                rcd -= Time.delta * Math.max(0.1, u.reloadMultiplier);
                if (rcd <= 0) {
                    let rt = findTarget(u, def, rmp);
                    if (rt != null) {
                        equipAng[key] = Angles.angle(rmp.x, rmp.y, rt.x, rt.y);
                        railFire(pl, u, def, rmp, rt, key);
                        rcd = def.ov.railInterval || 120;
                    } else {
                        rcd = 0;
                    }
                }
                equipCd[key] = rcd;
                continue;
            }
            if (def.ov && def.ov.blast) {
                let bmp = mountPos(u, k, n);
                let bcd2 = equipCd[key];
                if (bcd2 === undefined) bcd2 = 0;
                bcd2 -= Time.delta * Math.max(0.1, u.reloadMultiplier);
                if (bcd2 <= 0) {
                    let bt2 = findTarget(u, def, bmp);
                    if (bt2 != null) {
                        equipAng[key] = Angles.angle(bmp.x, bmp.y, bt2.x, bt2.y);
                        blastAt(pl, u, def, bt2);
                        bcd2 = def.ov.blastInterval || 60;
                    } else {
                        bcd2 = 0;
                    }
                }
                equipCd[key] = bcd2;
                continue;
            }
            if (def.ov && def.ov.beam) {
                let mp = mountPos(u, k, n);
                if (ast == null) ast = hostAim(u, pl);
                let tx = null;
                let ty = null;
                let t = null;
                if (ast.shoot) {
                    tx = ast.x;
                    ty = ast.y;
                } else {
                    t = findTarget(u, def, mp);
                    if (t != null) { tx = t.x; ty = t.y; }
                }
                if (tx != null) {
                    let range = def.block.range > 0 ? def.block.range : 200;
                    if (t == null) t = findTarget(u, def, mp);
                    if (t != null && Mathf.dst(mp.x, mp.y, t.x, t.y) <= range) {
                        let dmg = (def.ov.beamDps || 36) * Time.delta / 60 * Math.max(0.1, u.reloadMultiplier);
                        try { t.damagePierce(dmg); } catch (err) { t.damage(dmg); }
                        if (def.ov.pull) {
                            try {
                                let dx = u.x - t.x;
                                let dy = u.y - t.y;
                                let dist = Math.sqrt(dx * dx + dy * dy);
                                if (dist > u.hitSize / 2 + t.hitSize / 2 + 16) {
                                    let f = (def.ov.pullForce || 0.6) * Time.delta;
                                    t.vel.add(dx / dist * f, dy / dist * f);
                                }
                            } catch (err) {}
                        }
                        equipAng[key] = Angles.angle(mp.x, mp.y, t.x, t.y);
                        equipBeam[key] = { x: t.x, y: t.y };
                    } else {
                        delete equipBeam[key];
                    }
                } else {
                    delete equipBeam[key];
                }
                continue;
            }
            if (def.ov && def.ov.burstCount) {
                let bs = burstState[key];
                if (bs === undefined) bs = { left: 0, t: 0 };
                if (bs.left > 0) {
                    bs.t -= Time.delta;
                    if (bs.t <= 0) {
                        fireBurstShot(u, pl, def, k, n, key);
                        bs.left--;
                        bs.t = def.ov.burstGap || 72;
                    }
                    burstState[key] = bs;
                    continue;
                }
                let bcd = equipCd[key];
                if (bcd === undefined) bcd = 0;
                bcd -= Time.delta * Math.max(0.1, u.reloadMultiplier);
                if (bcd < 0) bcd = 0;
                if (bcd <= 0) {
                    if (fireBurstShot(u, pl, def, k, n, key)) {
                        bs.left = def.ov.burstCount - 1;
                        bs.t = def.ov.burstGap || 72;
                        bcd = Math.max(5, def.block.reload);
                    }
                }
                burstState[key] = bs;
                equipCd[key] = bcd;
                continue;
            }
            let cd = equipCd[key];
            if (cd === undefined) cd = 0;
            cd -= Time.delta * Math.max(0.1, u.reloadMultiplier);
            if (cd < 0) cd = 0;
            if (cd <= 0) {
                let bt = equipBullet(def);
                if (bt == null) logOnce("nobt:" + def.id, "no bullet type found for equipped turret " + def.id);
                let mp = mountPos(u, k, n);
                let tx = null;
                let ty = null;
                if (ast == null) ast = hostAim(u, pl);
                if (ast.shoot) {
                    tx = ast.x;
                    ty = ast.y;
                } else if (bt != null) {
                    let t = findTarget(u, def, mp);
                    if (t != null) {
                        let lp = leadPos(mp, t, bt);
                        tx = lp.x;
                        ty = lp.y;
                    }
                }
                if (bt != null && tx != null) {
                    equipAng[key] = Angles.angle(mp.x, mp.y, tx, ty);
                    if (fireEquip(u, def, bt, mp, tx, ty)) {
                        let reload = def.block.reload;
                        if (def.ov && def.ov.reloadMul) reload *= def.ov.reloadMul;
                        cd = Math.max(5, reload);
                    }
                } else {
                    equipAng[key] = u.rotation;
                }
            }
            equipCd[key] = cd;
        }
    }

    function ownerOf(pl, u) {
        if (u.isCoreHost !== true) return u;
        try {
            let pu = pl.unit();
            if (pu != null && pu.isValid() && !pu.dead) return pu;
        } catch (err) {}
        return null;
    }

    function baseAttack(type) {
        let best = 0;
        try {
            let ws = type.weapons;
            for (let i = 0; i < ws.size; i++) {
                let bt = ws.get(i).bullet;
                if (bt == null) continue;
                let d = Math.max(bt.damage, bt.splashDamage);
                if (d > best) best = d;
            }
        } catch (err) {}
        return best > 0 ? best : 20;
    }

    function attackPower(pl, u) {
        let o = ownerOf(pl, u);
        let st = byId[pl.id];
        let s = st != null ? st.s : null;
        let flat = s != null ? s[2] * ATK_FLAT : 0;
        if (o != null) return (baseAttack(o.type) + flat) * Math.max(0.1, o.damageMultiplier);
        return (20 + flat) * (1 + (s != null ? s[2] * ATK_PCT / 100 : 0));
    }

    function armorPower(pl, u) {
        let o = ownerOf(pl, u);
        if (o != null) return Math.max(0, o.armor);
        let st = byId[pl.id];
        return st != null ? st.s[1] * ARM_FLAT : 0;
    }

    function knockUnit(pl, e, fx, fy) {
        let st = byId[pl.id];
        if (st == null || !(st.s[12] > 0)) return;
        try {
            let dx = e.x - fx;
            let dy = e.y - fy;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < 0.01) return;
            let f = st.s[12] * KNOCK_PER * 80;
            e.impulse(dx / d * f, dy / d * f);
        } catch (err) {}
    }

    let knockCache = {};

    function knockType(t, lv) {
        let key = t.id + ":" + lv + (t.pierceArmor ? "p" : "");
        let c = knockCache[key];
        if (c === undefined) {
            try {
                c = t.copy();
                c.knockback = t.knockback + lv * KNOCK_PER;
            } catch (err) {
                c = null;
            }
            knockCache[key] = c;
        }
        return c;
    }

    function railFire(pl, u, def, mp, t, key) {
        let ang = Angles.angle(mp.x, mp.y, t.x, t.y);
        let len = (def.ov.railLen || 33) * Vars.tilesize;
        let wid = def.ov.railWidth || 9;
        let cx = Mathf.cosDeg(ang);
        let cy = Mathf.sinDeg(ang);
        let x0 = mp.x;
        let y0 = mp.y;
        if (!Vars.net.client()) {
            let dmg = attackPower(pl, u) * (def.ov.railPct || 150) / 100;
            let team = u.team;
            let inLine = function(x, y, hs) {
                let dx = x - x0;
                let dy = y - y0;
                let along = dx * cx + dy * cy;
                if (along < -hs || along > len + hs) return false;
                return Math.abs(-dx * cy + dy * cx) <= wid / 2 + hs;
            };
            try {
                Groups.unit.each(new Cons({
                    get: function(e) {
                        if (e == null || e.team == team || e.team == Team.derelict || e.dead || !e.isValid()) return;
                        if (!inLine(e.x, e.y, e.hitSize / 2)) return;
                        try { e.damagePierce(dmg); } catch (err) { e.damage(dmg); }
                        knockUnit(pl, e, x0, y0);
                    }
                }));
            } catch (err) {}
            try {
                Vars.indexer.eachBlock(null, x0 + cx * len / 2, y0 + cy * len / 2, len / 2 + 24,
                    new Boolf({ get: function(b) { return b != null && b.team != team && b.team != Team.derelict && b.isValid() && inLine(b.x, b.y, b.block.size * Vars.tilesize / 2); } }),
                    new Cons({ get: function(b) { try { b.damagePierce(dmg); } catch (err) { b.damage(dmg); } } }));
            } catch (err) {}
        }
        equipRail[key] = { x1: x0, y1: y0, x2: x0 + cx * len, y2: y0 + cy * len, w: wid, t: Time.time };
        if (!Vars.headless) {
            try { Sounds.railgun.at(x0, y0, 0.9 + Math.random() * 0.2); } catch (err) {}
        }
    }

    function blastFx(x, y) {
        try {
            if (!Vars.net.client()) {
                Call.effect(Fx.blastExplosion, x, y, 0, Pal.lancerLaser);
                return;
            }
        } catch (err) {}
        try { Fx.blastExplosion.at(x, y); } catch (err) {}
    }

    function blastAt(pl, u, def, t) {
        let dmg = attackPower(pl, u) * (def.ov.blastPct || 100) / 100;
        let rad = (def.ov.blastRadius || 3) * Vars.tilesize;
        let x = t.x;
        let y = t.y;
        let team = u.team;
        if (!Vars.net.client()) {
            try { t.damagePierce(dmg); } catch (err) { try { t.damage(dmg); } catch (err2) {} }
            knockUnit(pl, t, u.x, u.y);
            try {
                Groups.unit.each(new Cons({
                    get: function(e) {
                        if (e == null || e === t || e.team == team || e.team == Team.derelict || e.dead || !e.isValid()) return;
                        if (Mathf.dst(x, y, e.x, e.y) - e.hitSize / 2 > rad) return;
                        try { e.damagePierce(dmg); } catch (err) { e.damage(dmg); }
                        knockUnit(pl, e, x, y);
                    }
                }));
            } catch (err) {}
        }
        blastFx(x, y);
    }

    function auraTick(pl, u, def) {
        let rng = (def.ov.auraRange || 15) * Vars.tilesize;
        let dps = (def.ov.auraAtkPct || 0) / 100 * attackPower(pl, u) + (def.ov.auraArmorPct || 0) / 100 * armorPower(pl, u);
        if (!(dps > 0)) dps = 1;
        try {
            Groups.unit.each(new Cons({
                get: function(e) {
                    if (e == null || e.team == u.team || e.team == Team.derelict || e.dead || !e.isValid()) return;
                    if (Mathf.dst(u.x, u.y, e.x, e.y) > rng) return;
                    try { e.damagePierce(dps); } catch (err) { e.damage(dps); }
                    knockUnit(pl, e, u.x, u.y);
                    try { e.apply(StatusEffects.burning, AURA_BURN_TICKS); } catch (err) {}
                }
            }));
        } catch (err) {}
    }

    function burstBullet(def) {
        if (def.ov.burstBt !== undefined) return def.ov.burstBt;
        let bt = equipBullet(def);
        let out = bt;
        if (bt != null && def.ov.pierceCap) {
            try {
                let c = bt.copy();
                c.pierceCap = def.ov.pierceCap;
                c.pierce = true;
                out = c;
                if (def.ov.shredPct) shredMap.set(c, def.ov.shredPct);
            } catch (err) {}
        }
        def.ov.burstBt = out;
        return out;
    }

    function fireBurstShot(u, pl, def, k, n, key) {
        let bt = burstBullet(def);
        if (bt == null) return false;
        let mp = mountPos(u, k, n);
        let ast = hostAim(u, pl);
        let tx = null;
        let ty = null;
        if (ast.shoot) {
            tx = ast.x;
            ty = ast.y;
        } else {
            let t = findTarget(u, def, mp);
            if (t != null) {
                let lp = leadPos(mp, t, bt);
                tx = lp.x;
                ty = lp.y;
            }
        }
        if (tx == null) return false;
        equipAng[key] = Angles.angle(mp.x, mp.y, tx, ty);
        return fireEquip(u, def, bt, mp, tx, ty);
    }

    const eachEquip = new Cons({
        get: function(pl) {
            let st = byId[pl.id];
            if (st == null || st.d.length === 0 || st.p.length !== st.d.length) return;
            let defs = droneDefs();
            let u = pl.unit();
            if (u != null && u.isValid() && !u.dead) mountFire(pl, equipList(st, defs), u, "u");
            let ch = coreHost(pl, st);
            if (ch != null) mountFire(pl, coreList(st, defs), ch, "c");
        }
    });

    function auraState(u, rng, key) {
        let c = auraSeen[key];
        if (c === undefined) {
            c = { t: -100, v: false, i: 0 };
            auraSeen[key] = c;
        }
        if (Time.time - c.t > 6) {
            c.t = Time.time;
            let found = false;
            try {
                Groups.unit.each(new Cons({
                    get: function(e) {
                        if (found || e == null || e.team == u.team || e.team == Team.derelict || e.dead || !e.isValid()) return;
                        if (Mathf.dst(u.x, u.y, e.x, e.y) <= rng) found = true;
                    }
                }));
            } catch (err) {}
            c.v = found;
        }
        c.i = Mathf.lerpDelta(c.i, c.v ? 1 : 0, 0.07);
        return c;
    }

    let heatCore = null;
    let heatMid = null;
    let heatEdge = null;
    let heatClear = null;

    function drawFireZone(u, def, key) {
        let rng = (def.ov.auraRange || 15) * Vars.tilesize;
        let c = auraState(u, rng, key);
        let I = c.i;
        let T = Time.time;
        if (heatCore == null) {
            heatCore = new Color(1, 0.86, 0.5, 1);
            heatMid = new Color(1, 0.45, 0.1, 1);
            heatEdge = new Color(0.8, 0.14, 0.02, 0);
            heatClear = new Color(1, 0.4, 0.05, 0);
        }
        try {
            Draw.z(Layer.flyingUnit + 1);
            Draw.color(Pal.lightFlame, 0.25 + 0.2 * I);
            Lines.stroke(1.2 + I);
            try { Lines.dashCircle(u.x, u.y, rng); } catch (err) { Lines.circle(u.x, u.y, rng); }
            Draw.reset();
        } catch (err) {}
        if (I < 0.02) return;
        try {
            let breathe = 1 + Mathf.sin(T, 26, 0.03);

            Draw.z(Layer.groundUnit - 1);
            Draw.blend(Blending.additive);
            heatMid.a = 0.24 * I;
            Fill.light(u.x, u.y, 56, rng * breathe, heatMid, heatEdge);
            heatCore.a = 0.34 * I;
            heatClear.a = 0;
            Fill.light(u.x, u.y, 40, rng * 0.5 * (1 + Mathf.sin(T, 11, 0.06)), heatCore, heatClear);

            Draw.z(Layer.flyingUnit + 1);
            for (let k = 0; k < 4; k++) {
                let ph = (T * 0.006 + k / 4) % 1;
                let r = rng * (0.06 + 0.94 * ph);
                let fade = Math.min(1, ph * 6) * Math.pow(1 - ph, 1.3);
                Draw.color(Pal.lightFlame, Pal.darkFlame, ph);
                Draw.alpha(0.5 * fade * I);
                Lines.stroke(1.2 + 2.2 * (1 - ph));
                let seg = 28;
                let px = 0;
                let py = 0;
                for (let q = 0; q <= seg; q++) {
                    let a = q / seg * 6.2832;
                    let rr = r * (1 + 0.02 * Math.sin(a * 5 + T * 0.08 + k * 2));
                    let x2 = u.x + Math.cos(a) * rr;
                    let y2 = u.y + Math.sin(a) * rr;
                    if (q > 0) Lines.line(px, py, x2, y2);
                    px = x2;
                    py = y2;
                }
            }

            for (let j = 0; j < 10; j++) {
                let rr = rng * (0.2 + 0.75 * ((j * 0.381966) % 1));
                let dir = j % 2 === 0 ? 1 : -1;
                Draw.color(Pal.lightFlame, 0.16 * I * (0.6 + 0.4 * Math.sin(T * 0.05 + j)));
                Lines.stroke(1);
                Lines.arc(u.x, u.y, rr, 0.07 + 0.03 * (j % 3), T * 0.12 * dir + j * 37);
            }

            for (let j = 0; j < 64; j++) {
                let rd = (T * 0.0035 * (0.7 + (j % 5) * 0.12) + j * 0.6180339) % 1;
                let r = rng * (0.05 + 0.93 * rd);
                let a = j * 2.39996 + Math.sin(T * 0.02 + j) * 0.2;
                let mx = u.x + Math.cos(a) * r;
                let my = u.y + Math.sin(a) * r;
                let fade = Math.sin(rd * Math.PI);
                let sz = (0.7 + (j % 3) * 0.45) * (1.1 - rd * 0.5);
                Draw.color(Pal.lightFlame, Pal.darkFlame, rd);
                Draw.alpha(0.75 * fade * I);
                Fill.circle(mx, my, sz);
                Draw.alpha(0.12 * fade * I);
                Fill.circle(mx, my, sz * 3);
            }

            Draw.z(Layer.flyingUnit + 0.5);
            heatCore.a = 0.45 * I;
            heatClear.a = 0;
            Fill.light(u.x, u.y, 28, u.hitSize * (0.95 + 0.06 * Math.sin(T * 0.13)), heatCore, heatClear);

            Draw.blend();
            Draw.reset();
            try { Drawf.light(u.x, u.y, rng * 1.25, Pal.lightFlame, 0.45 * I); } catch (err) {}
        } catch (err) {
            Draw.blend();
            Draw.reset();
            logOnce("firezone", "fire zone draw failed: " + err);
        }
    }

    const eachDrawEquip = new Cons({
        get: function(pl) {
            let st = byId[pl.id];
            if (st == null || st.d.length === 0 || st.p.length !== st.d.length) return;
            let u = pl.unit();
            if (u != null && u.isValid()) drawMounts(pl, u, equipList(st, droneDefs()), "u");
            let ch = coreHost(pl, st);
            if (ch != null) drawMounts(pl, ch, coreList(st, droneDefs()), "c");
        }
    });

    function drawMounts(pl, u, list, pfx) {
            let n = list.length;
            if (n === 0) return;
            let scl = 0.25;
            try { scl = Draw.scl; } catch (err) {}
            for (let k = 0; k < n; k++) {
                let def = list[k];
                let blk = def.block;
                let key = pl.id + ":" + pfx + k + ":" + def.id;
                Draw.reset();
                let rl = equipRail[key];
                if (rl !== undefined) {
                    let age = Time.time - rl.t;
                    if (age < 20) {
                        let fade = 1 - age / 20;
                        try {
                            Draw.z(Layer.flyingUnit + 2);
                            Draw.color(Pal.lancerLaser, fade);
                            Lines.stroke(rl.w * fade);
                            Lines.line(rl.x1, rl.y1, rl.x2, rl.y2);
                            Draw.color(Color.white, fade);
                            Lines.stroke(rl.w * 0.4 * fade);
                            Lines.line(rl.x1, rl.y1, rl.x2, rl.y2);
                            Draw.reset();
                        } catch (err) { Draw.reset(); }
                    } else {
                        delete equipRail[key];
                    }
                }
                if (def.ov && def.ov.aura) {
                    drawFireZone(u, def, key);
                    continue;
                }
                if (def.ov && def.ov.beam) {
                    let bp = equipBeam[key];
                    if (bp != null) {
                        try {
                            Draw.z(Layer.flyingUnit + 1);
                            Draw.color(Pal.lancerLaser);
                            Lines.stroke(3 * scl);
                            Lines.line(u.x, u.y, bp.x, bp.y);
                            Draw.reset();
                        } catch (err) {}
                    }
                    continue;
                }
                if (u.isCoreHost !== true) continue;
                let mp = mountPos(u, k, n);
                let sc = mountScale(u, def, n);
                let ang = equipAng[key];
                if (ang === undefined) ang = u.rotation;
                Draw.z(Layer.flyingUnit + 1);
                Draw.color();
                try {
                    let base = blk.baseRegion;
                    if (base != null && base.found()) {
                        Draw.rect(base, mp.x, mp.y, base.width * scl * sc, base.height * scl * sc);
                    }
                    let rg = blk.region;
                    if (rg != null && rg.found()) {
                        Draw.rect(rg, mp.x, mp.y, rg.width * scl * sc, rg.height * scl * sc, ang - 90);
                    } else {
                        let sz = blk.size * Vars.tilesize * sc;
                        Draw.rect(blk.uiIcon, mp.x, mp.y, sz, sz);
                    }
                } catch (err) {}
            }
    }

    if (!Vars.headless) {
        try {
            if (typeof Trigger !== "undefined" && Trigger.postDraw != null) {
                Events.run(Trigger.postDraw, new Runnable({
                    run: function() {
                        if (!isActive()) return;
                        try {
                            Groups.player.each(eachDrawEquip);
                            Draw.reset();
                        } catch (err) {}
                    }
                }));
            }
        } catch (err) {}
    }

    function statsOf(unit) {
        let p = null;
        try { p = unit.getPlayer(); } catch (err) {}
        let st = null;
        if (p != null) st = byId[p.id];
        else {
            let pid = soldierOwner[unit.id];
            if (pid !== undefined) st = byId[pid];
        }
        return st != null ? st.s : null;
    }

    function applyStats(unit) {
        if (!isActive()) return;
        let s = statsOf(unit);
        if (s == null) return;

        let hpT = unit.type.health * (1 + s[0] * HP_PCT / 100) + s[0] * HP_FLAT;
        if (Math.abs(unit.maxHealth - hpT) > 0.5) {
            let diff = hpT - unit.maxHealth;
            unit.maxHealth = hpT;
            if (diff > 0) unit.health += diff;
            else if (unit.health > hpT) unit.health = hpT;
        }

        unit.armor = unit.type.armor + s[1] * ARM_FLAT;
        let cut = armorCut(s[1]);
        if (cut > 0) unit.healthMultiplier *= 1 / (1 - cut / 100);

        let dm = 1 + s[2] * ATK_PCT / 100;
        if (s[5] > 0 && Math.random() < s[5] * 0.02) dm *= 1.5 + s[6] * 0.12;
        unit.damageMultiplier *= dm;
        let base = Math.max(0.1, unit.type.speed);
        unit.speedMultiplier *= (1 + s[3] * SPD_PCT / 100) * (1 + s[3] * SPD_FLAT / base);
        unit.reloadMultiplier *= 1 + s[4] * 0.06;
        if (s[9] > 0 && !Vars.net.client() && unit.health > 0 && unit.health < unit.maxHealth * REGEN_THRESHOLD) {
            unit.health = Math.min(unit.maxHealth, unit.health + unit.maxHealth * s[9] * REGEN_PCT / 100 * Time.delta / 60);
        }
        if (s[10] > 0) unit.damageMultiplier *= 1 + s[10] * DMG_PER_HP * unit.health;
        if (s[11] > 0) unit.damageMultiplier *= 1 + s[11] * DMG_PER_ARMOR * unit.armor;
    }

    const buffStatus = extend(StatusEffect, "pvp-buff", {
        update(unit, time) {
            this.super$update(unit, time);
            applyStats(unit);
        }
    });
    buffStatus.permanent = true;
    buffStatus.show = false;

    const equipStatus = extend(StatusEffect, "pvp-equip", {});
    equipStatus.permanent = true;
    equipStatus.show = false;
    try { equipStatus.disarm = true; } catch (err) {}

    function hasEquipped(st) {
        if (st == null || st.d.length === 0 || st.p.length !== st.d.length) return false;
        let defs = droneDefs();
        for (let i = 0; i < st.d.length; i++) {
            if (st.p[i] === EQUIPPED && defs.map[st.d[i]] != null && defs.map[st.d[i]].equip) return true;
        }
        return false;
    }

    function pierceType(t) {
        let c = pierceCache[t.id];
        if (c === undefined) {
            try {
                c = t.copy();
                c.pierceArmor = true;
            } catch (err) {
                c = null;
            }
            pierceCache[t.id] = c;
        }
        return c;
    }

    const eachBullet = new Cons({
        get: function(b) {
            let o = b.owner;
            if (o == null) return;
            if (b.time > 3 || rolled[b.id] === 1) return;
            let s = null;
            if (typeof o.getPlayer === "function") {
                s = statsOf(o);
            } else {
                let hp = hostOwner[o.id];
                if (hp === undefined) return;
                let hst = byId[hp];
                s = hst != null ? hst.s : null;
            }
            if (s == null) return;
            rolled[b.id] = 1;
            rolledN++;
            if (s[2] > 0) {
                try { b.damage += s[2] * ATK_FLAT; } catch (err) {}
            }
            if (s[7] > 0 && !b.type.pierceArmor && Math.random() < s[7] * 0.05) {
                let c = pierceType(b.type);
                if (c != null) {
                    try { b.type = c; } catch (err) {}
                }
            }
            if (s[12] > 0) {
                let kt = knockType(b.type, s[12]);
                if (kt != null) {
                    try { b.type = kt; } catch (err) {}
                }
            }
        }
    });

    function anyBulletStat() {
        for (let id in byId) {
            let s = byId[id].s;
            if (s[2] > 0 || s[7] > 0 || s[12] > 0) return true;
        }
        return false;
    }

    function coreSpawnPos(pl, type) {
        let core = pl.team().core();
        if (core == null) return null;
        let cx = Vars.world.width() * Vars.tilesize / 2;
        let cy = Vars.world.height() * Vars.tilesize / 2;
        let a = Angles.angle(core.x, core.y, cx, cy) + (Math.random() - 0.5) * 80;
        let r = core.block.size * Vars.tilesize / 2 + 28 + type.hitSize / 2;
        return { x: core.x + Mathf.cosDeg(a) * r, y: core.y + Mathf.sinDeg(a) * r, rot: a };
    }

    function swapUnit(pl, old, want) {
        let fromTier = false;
        for (let lv = 1; lv <= 5; lv++) {
            if (old.type === tierType(lv)) { fromTier = true; break; }
        }
        let x = old.x;
        let y = old.y;
        let rot = old.rotation;
        let frac = 1;
        if (fromTier && old.team != pl.team()) fromTier = false;
        if (fromTier) {
            frac = old.maxHealth > 0 ? old.health / old.maxHealth : 1;
        } else {
            let pos = coreSpawnPos(pl, want);
            if (pos != null) {
                x = pos.x;
                y = pos.y;
                rot = pos.rot;
            }
        }
        try { Call.unitDespawn(old); } catch (err) { old.remove(); }
        let nu = want.create(pl.team());
        nu.set(x, y);
        nu.rotation = rot;
        try { nu.spawnedByCore = true; } catch (err) {}
        nu.add();
        nu.health = nu.maxHealth * frac;
        pl.unit(nu);
        spawnFx(x, y);
    }

    function isPvpTeam(t) {
        let tl = pvpTeams();
        for (let i = 0; i < tl.length; i++) {
            if (tl[i] == t) return true;
        }
        return false;
    }

    function saveTeams() {
        let tags = getTags();
        let tl = pvpTeams();
        if (tags == null) return;
        let ids = [];
        for (let i = 0; i < tl.length; i++) ids.push(tl[i].id);
        try { tags.put(TAG_TEAMS, ids.join(",")); } catch (err) {}
    }

    function getAssign() {
        if (assignCache != null) return assignCache;
        assignCache = {};
        let tags = getTags();
        if (tags != null) {
            try {
                let o = JSON.parse(String(tags.get(TAG_ASSIGN, "{}")));
                for (let k in o) assignCache[k] = o[k];
            } catch (err) {}
        }
        return assignCache;
    }

    function saveAssign() {
        let tags = getTags();
        if (tags == null) return;
        try { tags.put(TAG_ASSIGN, JSON.stringify(getAssign())); } catch (err) {}
    }

    function derelictCores() {
        let out = [];
        try {
            Groups.build.each(new Cons({
                get: function(bd) {
                    if (bd != null && bd.isValid() && bd.team == Team.derelict && bd.block instanceof CoreBlock) out.push(bd);
                }
            }));
        } catch (err) {}
        if (out.length === 0) {
            try {
                let cs = Team.derelict.cores();
                for (let i = 0; i < cs.size; i++) {
                    if (cs.get(i) != null) out.push(cs.get(i));
                }
            } catch (err) {}
        }
        return out;
    }

    function teamFree(t) {
        if (t === Team.derelict || t === Team.crux || t == Vars.state.rules.waveTeam) return false;
        if (isPvpTeam(t)) return false;
        return t.cores().size === 0;
    }

    function freshTeam() {
        let cand = [Team.green, Team.blue, Team.malis, Team.sharded];
        for (let i = 0; i < cand.length; i++) {
            if (teamFree(cand[i])) return cand[i];
        }
        for (let id = 6; id < Team.all.length; id++) {
            let t = Team.get(id);
            if (t != null && teamFree(t)) return t;
        }
        return null;
    }

    function coreScore(c, tl) {
        let md = Infinity;
        for (let i = 0; i < tl.length; i++) {
            let cores = tl[i].cores();
            for (let j = 0; j < cores.size; j++) {
                let o = cores.get(j);
                if (o != null) md = Math.min(md, Mathf.dst(c.x, c.y, o.x, o.y));
            }
        }
        return md === Infinity ? 0 : md;
    }

    function claimCore() {
        let cores = derelictCores();
        if (cores.length === 0) return null;
        let t = freshTeam();
        if (t == null) return null;
        let tl = pvpTeams();
        let best = null;
        let bd = -1;
        for (let i = 0; i < cores.length; i++) {
            let sc = coreScore(cores[i], tl);
            if (sc > bd) { bd = sc; best = cores[i]; }
        }
        if (best == null) return null;
        let tile = best.tile;
        let blk = best.block;
        try { tile.setNet(blk, t, 0); } catch (err) { return null; }
        let nb = tile.build;
        if (nb == null || nb.team != t) return null;
        tl.push(t);
        saveTeams();
        normalizeRules(Vars.state.rules, [t]);
        syncRules();
        fx(nb.x, nb.y);
        return t;
    }

    function evictRed() {
        let cores = Team.crux.cores();
        if (cores == null || cores.size === 0) return;
        let tl = pvpTeams();
        let target = null;
        for (let i = 0; i < tl.length; i++) {
            if (tl[i].cores().size === 0) { target = tl[i]; break; }
        }
        let added = false;
        if (target == null) {
            target = freshTeam();
            added = true;
        }
        if (target == null) return;
        let list = [];
        for (let j = 0; j < cores.size; j++) {
            if (cores.get(j) != null) list.push(cores.get(j));
        }
        for (let k = 0; k < list.length; k++) {
            let tile = list[k].tile;
            let blk = list[k].block;
            try { tile.setNet(blk, target, 0); } catch (err) {}
        }
        if (added) {
            tl.push(target);
            saveTeams();
        }
        normalizeRules(Vars.state.rules, [target]);
    }

    function balanceTeam(pl) {
        let tl = pvpTeams();
        let best = null;
        let bn = Infinity;
        for (let i = 0; i < tl.length; i++) {
            let t = tl[i];
            let n = t.cores().size > 0 ? 0 : 1000;
            Groups.player.each(new Cons({
                get: function(o) {
                    if (o !== pl && o.team() == t) n++;
                }
            }));
            if (n < bn) { bn = n; best = t; }
        }
        return best != null ? best : tl[0];
    }

    function assignTeam(pl) {
        let prev = seenPl[pl.id];
        if (prev != null) {
            if (pl.team() != prev) pl.team(prev);
            return;
        }
        let asg = getAssign();
        let uid = getUid(pl);
        let team = null;
        let isHost = Vars.player != null && pl === Vars.player;
        let claimed = false;

        if (isHost) {
            team = isPvpTeam(pl.team()) ? pl.team() : balanceTeam(pl);
        } else {
            let sid = asg[uid];
            if (sid != null) {
                let old = Team.get(sid);
                if (old != null && isPvpTeam(old) && old.cores().size > 0) team = old;
            }
            if (team == null) {
                team = claimCore();
                claimed = team != null;
                if (team == null) team = balanceTeam(pl);
            }
        }

        asg[uid] = team.id;
        saveAssign();
        seenPl[pl.id] = team;
        if (pl.team() != team) pl.team(team);

        if (claimed) {
            let nm = String(pl.name);
            try {
                if (global.NexNet != null) {
                    global.NexNet.toastAll("[#" + String(team.color) + "]■[] [accent]" + nm +
                        tr(" đã nhận lõi bỏ hoang, lập đội mới!", " claimed a derelict core and formed a new team!"), 4);
                }
            } catch (err) {}
        }
    }

    const eachOrphan = new Cons({
        get: function(u) {
            if (!isPvpTeam(u.team)) return;
            if (u.isPlayer()) return;
            for (let lv = 1; lv <= 5; lv++) {
                if (u.type === tierType(lv)) {
                    try { Call.unitDespawn(u); } catch (err) { u.remove(); }
                    return;
                }
            }
        }
    });

    function holdDeath(pl) {
        if (deathOk !== false) {
            try {
                pl.deathTimer = 0;
                deathOk = true;
                return;
            } catch (err) {
                deathOk = false;
                logOnce("deathtimer", "cannot hold player deathTimer, using despawn fallback: " + err);
            }
        }
        try {
            let u = pl.unit();
            if (u != null && u.isValid()) {
                try { Call.unitDespawn(u); } catch (err) { u.remove(); }
            }
        } catch (err) {}
    }

    function startRespawnLock(pl) {
        let st = bind(pl);
        let tier = activeTier(st);
        let sec = RESPAWN_SEC[Math.min(RESPAWN_SEC.length, Math.max(1, tier)) - 1];
        let ticks = Math.max(0, sec * 60 - 60);
        if (ticks <= 0) return;
        respawnLock[pl.id] = ticks;
        toast(pl, tr("[scarlet]Hồi sinh sau ", "[scarlet]Respawn in ") + sec + tr(" giây", " s"));
    }

    const eachPlayerServer = new Cons({
        get: function(pl) {
            assignTeam(pl);
            let st = bind(pl);
            let lk = respawnLock[pl.id];
            if (lk !== undefined) {
                lk -= Time.delta;
                if (lk <= 0) delete respawnLock[pl.id];
                else {
                    respawnLock[pl.id] = lk;
                    holdDeath(pl);
                    return;
                }
            }
            let u = pl.unit();
            if (u == null || !u.isValid()) return;
            let want = tierType(activeTier(st));
            if (u.type === want && u.team == pl.team()) {
                delete swapPending[pl.id];
                return;
            }
            let isTier = false;
            for (let lv = 1; lv <= 5; lv++) {
                if (u.type === tierType(lv)) { isTier = true; break; }
            }
            let isCoreUnit = false;
            try {
                let cr = pl.team().core();
                isCoreUnit = cr != null && u.type === cr.block.unitType;
            } catch (err) {}
            if (!isTier && !isCoreUnit) {
                delete swapPending[pl.id];
                return;
            }
            let pend = swapPending[pl.id];
            if (pend != null && pend.want === want) {
                pend.t -= Time.delta;
                if (pend.t > 0) return;
            }
            swapPending[pl.id] = { want: want, t: 10 };
            swapUnit(pl, u, want);
        }
    });

    function coreStatsTick(dt) {
        let best = {};
        Groups.player.each(new Cons({
            get: function(pl) {
                let st = byId[pl.id];
                if (st == null) return;
                let tm = pl.team();
                if (tm == null || tm == Team.derelict) return;
                let b = best[tm.id];
                if (b === undefined) {
                    best[tm.id] = st.s.slice();
                } else {
                    for (let i = 0; i < st.s.length; i++) {
                        if (st.s[i] > b[i]) b[i] = st.s[i];
                    }
                }
            }
        }));
        for (let tid in best) {
            try {
                let team = Team.get(parseInt(tid));
                let sv = best[tid];
                let rule = Vars.state.rules.teams.get(team);
                let hpMul = (1 + sv[0] * HP_PCT / 100) / (1 - armorCut(sv[1]) / 100);
                rule.blockHealthMultiplier = hpMul;
                rule.blockDamageMultiplier = 1 + sv[2] * ATK_PCT / 100;
                if (sv[9] > 0) {
                    let cores = team.cores();
                    for (let i = 0; i < cores.size; i++) {
                        let cb = cores.get(i);
                        if (cb == null || !cb.isValid()) continue;
                        let mh = cb.block.health;
                        try { mh = cb.maxHealth(); } catch (err2) {}
                        if (cb.health < mh * REGEN_THRESHOLD) cb.heal(mh * sv[9] * REGEN_PCT / 100 * dt / 60);
                    }
                }
            } catch (err) {
                logOnce("corestats", "core stats failed: " + err);
            }
        }
    }

    const eachPassiveExp = new Cons({
        get: function(pl) { addExp(pl, PASSIVE_EXP); }
    });

    const eachPlayerCommon = new Cons({
        get: function(pl) {
            let u = pl.unit();
            if (u == null || !u.isValid()) return;
            if (!u.hasEffect(buffStatus)) u.apply(buffStatus, 1);
            if (hasEquipped(byId[pl.id])) {
                if (!u.hasEffect(equipStatus)) u.apply(equipStatus, 1);
            } else if (u.hasEffect(equipStatus)) {
                u.unapply(equipStatus);
            }
        }
    });

    const eachTurretOwner = new Cons({
        get: function(pl) {
            let st = byId[pl.id];
            if (st == null || st.d.length === 0) return;
            feedTurrets(pl, st, turretT <= 0, !Vars.net.client());
        }
    });

    function prune() {
        let present = {};
        Groups.player.each(new Cons({ get: function(pl) { present[pl.id] = true; } }));
        for (let id in byId) {
            if (present[id] !== true) {
                delete byId[id];
            }
        }
        for (let sid in seenPl) {
            if (present[sid] !== true) delete seenPl[sid];
        }
        for (let key in equipCd) {
            let pid = key.split(":")[0];
            if (present[pid] !== true) delete equipCd[key];
        }
        for (let key2 in equipAng) {
            if (present[key2.split(":")[0]] !== true) delete equipAng[key2];
        }
        for (let key5 in equipRail) {
            if (present[key5.split(":")[0]] !== true) delete equipRail[key5];
        }
        for (let key3 in equipBeam) {
            if (present[key3.split(":")[0]] !== true) delete equipBeam[key3];
        }
        for (let sid3 in swapPending) {
            if (present[sid3] !== true) delete swapPending[sid3];
        }
        for (let key4 in burstState) {
            if (present[key4.split(":")[0]] !== true) delete burstState[key4];
        }
        for (let sid2 in soldiers) {
            if (present[sid2] !== true) {
                if (!Vars.net.client()) removeSoldiers(sid2);
                delete soldiers[sid2];
                delete barrackT[sid2];
            }
        }
        if (rolledN > 3000) {
            rolled = {};
            rolledN = 0;
        }
    }

    let barrackT = {};
    let soldiers = {};
    let soldierOwner = {};

    function aliveSoldiers(pid) {
        let list = soldiers[pid];
        let out = [];
        if (list != null) {
            for (let i = 0; i < list.length; i++) {
                let u = Groups.unit.getByID(list[i]);
                if (u != null && u.isValid() && !u.dead) {
                    out.push(list[i]);
                    if (!u.hasEffect(buffStatus)) u.apply(buffStatus, 1);
                } else {
                    delete soldierOwner[list[i]];
                }
            }
        }
        soldiers[pid] = out;
        return out;
    }

    function groundAI() {
        try { return new Packages.mindustry.ai.types.GroundAI(); } catch (err) { return null; }
    }

    function spawnSoldier(pl, type) {
        let pos = coreSpawnPos(pl, type);
        if (pos == null) return null;
        prepareWaveType(type);
        let nu = type.create(pl.team());
        nu.set(pos.x, pos.y);
        nu.rotation = pos.rot;
        let ai = groundAI();
        if (ai != null) {
            try { nu.controller(ai); } catch (err) {}
        }
        nu.add();
        soldierOwner[nu.id] = pl.id;
        nu.apply(buffStatus, 1);
        spawnFx(pos.x, pos.y);
        return nu;
    }

    function removeSoldiers(pid) {
        let list = soldiers[pid];
        if (list == null) return;
        for (let i = 0; i < list.length; i++) {
            let u = Groups.unit.getByID(list[i]);
            if (u == null) continue;
            try { Call.unitDespawn(u); } catch (err) { try { u.remove(); } catch (err2) {} }
        }
    }

    const eachBarracks = new Cons({
        get: function(pl) {
            let st = byId[pl.id];
            if (st == null || !(st.b >= 1)) return;
            let cfg = BARRACKS[Math.min(st.b, BARRACKS.length) - 1];
            let type = UnitTypes[cfg.t];
            if (type == null || pl.team().core() == null) return;
            let t = barrackT[pl.id];
            if (t === undefined) t = cfg.sec * 60;
            t -= Time.delta;
            if (t > 0) {
                barrackT[pl.id] = t;
                return;
            }
            let alive = aliveSoldiers(pl.id);
            let room = cfg.cap - alive.length;
            if (room <= 0) {
                barrackT[pl.id] = 0;
                return;
            }
            let n = Math.min(cfg.n, room);
            for (let i = 0; i < n; i++) {
                let nu = spawnSoldier(pl, type);
                if (nu != null) alive.push(nu.id);
            }
            soldiers[pl.id] = alive;
            barrackT[pl.id] = cfg.sec * 60;
        }
    });

    function checkWin() {
        if (winning || Vars.state.gameOver) return;
        let tl = pvpTeams();
        let alive = [];
        for (let i = 0; i < tl.length; i++) {
            if (tl[i].cores().size > 0) alive.push(tl[i]);
        }
        if (alive.length >= 2) seenBoth = true;
        if (!seenBoth) return;
        if (alive.length === 1) win(alive[0]);
    }

    function win(team) {
        winning = true;
        Time.run(5, new Runnable({
            run: function() {
                try {
                    Vars.logic.gameOver(team);
                } catch (err) {
                    Vars.state.gameOver = true;
                    Events.fire(new GameOverEvent(team));
                }
            }
        }));
    }

    Events.run(Trigger.update, new Runnable({
        run: function() {
            if (!isActive() || Vars.state.isPaused()) return;
            let auth = !Vars.net.client();
            if (auth) {
                Groups.player.each(eachPlayerServer);
                Groups.player.each(eachBarracks);
                if (anyBulletStat()) Groups.bullet.each(eachBullet);
                syncT -= Time.delta;
                if (dirty && syncT <= 0) {
                    dirty = false;
                    syncT = 20;
                    broadcast();
                    saveT -= 20;
                    if (saveT <= 0) {
                        saveT = 600;
                        saveStore(false);
                    }
                } else if (syncT < -300) {
                    syncT = 20;
                    broadcast();
                }
                coreT -= Time.delta;
                if (coreT <= 0) {
                    coreT = 30;
                    coreStatsTick(30);
                }
                passiveT -= Time.delta;
                if (passiveT <= 0) {
                    passiveT = PASSIVE_INTERVAL;
                    Groups.player.each(eachPassiveExp);
                }
                orphanT -= Time.delta;
                if (orphanT <= 0) {
                    orphanT = 30;
                    Groups.unit.each(eachOrphan);
                }
                winT -= Time.delta;
                if (winT <= 0) {
                    winT = 60;
                    checkWin();
                }
                pruneT -= Time.delta;
                if (pruneT <= 0) {
                    pruneT = 300;
                    prune();
                }
            }
            Groups.player.each(eachPlayerCommon);

            turretT -= Time.delta;
            Groups.player.each(eachTurretOwner);
            if (turretT <= 0) turretT = 15;

            Groups.player.each(eachEquip);

            if (!auth) {
                pruneT -= Time.delta;
                if (pruneT <= 0) {
                    pruneT = 300;
                    prune();
                }
            }
        }
    }));

    function nearPos(x, y) {
        let teams = pvpTeams();
        for (let t = 0; t < teams.length; t++) {
            let cores = teams[t].cores();
            for (let i = 0; i < cores.size; i++) {
                let c = cores.get(i);
                if (Mathf.dst(x, y, c.x, c.y) < 200) return true;
            }
        }
        return false;
    }

    function tileClear(t) {
        if (t == null) return false;
        if (t.solid() || t.build != null) return false;
        if (t.block() !== Blocks.air) return false;
        if (t.floor().isDeep()) return false;
        return true;
    }

    function spawnPos(type) {
        let ts = Vars.tilesize;
        let w = Vars.world.width();
        let h = Vars.world.height();
        if (w < 5 || h < 5) return null;
        let rad = Math.min(3, Math.max(0, Math.ceil(type.hitSize / ts / 2) - 1));
        for (let i = 0; i < 120; i++) {
            let tx = 2 + Math.floor(Math.random() * (w - 4));
            let ty = 2 + Math.floor(Math.random() * (h - 4));
            let ok = true;
            for (let dx = -rad; dx <= rad && ok; dx++) {
                for (let dy = -rad; dy <= rad; dy++) {
                    if (!tileClear(Vars.world.tile(tx + dx, ty + dy))) { ok = false; break; }
                }
            }
            if (!ok) continue;
            let t = Vars.world.tile(tx, ty);
            let wx = t.worldx();
            let wy = t.worldy();
            if (nearPos(wx, wy)) continue;
            return { x: wx, y: wy };
        }
        return null;
    }

    function waveCount(g, w) {
        if (w < g.b || w > g.e || (w - g.b) % g.sp !== 0) return 0;
        return Math.min(g.mx, g.n + Math.floor(((w - g.b) / g.sp) / g.sc));
    }

    function allowWaveUnits(r) {
        try { if (!(r.unitCap >= WAVE_UNIT_CAP)) r.unitCap = WAVE_UNIT_CAP; } catch (err) {}
    }

    function prepareWaveType(type) {
        try { type.useUnitCap = false; } catch (err) {}
        try {
            let env = Vars.state.rules.env;
            if (!type.supportsEnv(env)) {
                type.envEnabled |= env;
                type.envDisabled &= ~env;
                type.envRequired = 0;
            }
        } catch (err) {}
    }

    function spawnWave(w) {
        if (Groups.player.size() === 0) return;
        allowWaveUnits(Vars.state.rules);
        let team = Vars.state.rules.waveTeam;
        let alive = 0;
        Groups.unit.each(new Cons({ get: function(u) { if (u.team == team) alive++; } }));
        for (let gi = 0; gi < WAVES.length; gi++) {
            let g = WAVES[gi];
            let type = UnitTypes[g.t];
            if (type == null) continue;
            if (type.flying === true || type.naval === true) continue;
            let n = waveCount(g, w);
            if (n <= 0) continue;
            prepareWaveType(type);
            for (let i = 0; i < n; i++) {
                if (alive >= MAX_WAVE_UNITS) return;
                let pos = spawnPos(type);
                if (pos == null) continue;
                let unit = type.create(team);
                unit.shield = Math.max(0, (w - g.b) * 6);
                unit.set(pos.x, pos.y);
                unit.apply(StatusEffects.invincible, 60);
                unit.add();
                alive++;
                Events.fire(new UnitSpawnEvent(unit));
                fx(pos.x, pos.y);
            }
        }
    }

    if (typeof PlayerLeave !== "undefined") {
        Events.on(PlayerLeave, new Cons({
            get: function(e) {
                if (Vars.net.client()) return;
                try { if (Object.keys(store).length > 0) saveStore(true); } catch (err) {}
            }
        }));
    }

    Events.on(WaveEvent, new Cons({
        get: function(e) {
            if (Vars.net.client() || !isActive() || Vars.state.gameOver) return;
            spawnWave(Vars.state.wave - 1);
            saveStore(true);
        }
    }));

    if (typeof UnitDamageEvent !== "undefined") {
        Events.on(UnitDamageEvent, new Cons({
            get: function(e) {
                if (Vars.net.client() || !isActive()) return;
                let b = e.bullet;
                let tgt = e.unit;
                if (b == null || tgt == null || tgt.dead || !tgt.isValid()) return;
                let shred = shredMap.get(b.type);
                if (shred) {
                    try { tgt.damagePierce(b.damage * shred); } catch (err) {
                        try { tgt.damage(b.damage * shred); } catch (err2) {}
                    }
                }
                let o = b.owner;
                if (o == null || typeof o.getPlayer !== "function" || o.team == tgt.team) return;
                let ss = statsOf(o);
                if (ss == null) return;
                let lv = ss[PCT_STAT] || 0;
                let pct = (lv + 1) * 0.1;
                let extra = tgt.maxHealth * pct / 100;
                if (extra > 0) {
                    try { tgt.damagePierce(extra); } catch (err) { tgt.damage(extra); }
                }
            }
        }));
    }

    function killExp(u) {
        let hp = u.maxHealth;
        let bonus = 1 + Math.min(EXP_HP_BONUS_MAX, hp / EXP_HP_BONUS_REF);
        return hp * EXP_PER_HP * bonus * expPercent() / 100;
    }

    Events.on(UnitDestroyEvent, new Cons({
        get: function(e) {
            if (Vars.net.client() || !isActive() || Vars.state.gameOver) return;
            let u = e.unit;
            if (u == null) return;
            try {
                let dp = u.getPlayer();
                if (dp != null && isPvpTeam(u.team)) startRespawnLock(dp);
            } catch (err) {}
            if (u.team == Vars.state.rules.waveTeam) {
                let gained = killExp(u);
                if (!(gained > 0)) return;
                let rx = u.x;
                let ry = u.y;
                Groups.player.each(new Cons({
                    get: function(pl) {
                        let pu = pl.unit();
                        if (pu == null || !pu.isValid()) return;
                        let dx = pu.x - rx;
                        let dy = pu.y - ry;
                        if (dx * dx + dy * dy <= CREDIT_RADIUS * CREDIT_RADIUS) addExp(pl, gained);
                    }
                }));
                return;
            }
            let pid = soldierOwner[u.id];
            if (pid === undefined) return;
            delete soldierOwner[u.id];
            let sg = killExp(u);
            if (!(sg > 0)) return;
            Groups.player.each(new Cons({
                get: function(pl2) {
                    if (pl2.id === pid) addExp(pl2, sg);
                }
            }));
        }
    }));

    Events.on(WorldLoadEvent, new Cons({
        get: function(e) {
            try { if (!Vars.net.client() && Object.keys(store).length > 0) saveStore(true); } catch (err) {}
            byId = {};
            teamsCache = null;
            assignCache = null;
            seenPl = {};
            defsCache = null;
            equipCd = {};
            equipAng = {};
            equipBeam = {};
            equipRail = {};
            auraSeen = {};
            respawnLock = {};
            swapPending = {};
            burstState = {};
            barrackT = {};
            soldiers = {};
            soldierOwner = {};
            passiveT = PASSIVE_INTERVAL;
            logged = {};
            rolled = {};
            rolledN = 0;
            winning = false;
            seenBoth = false;
            dirty = false;
            syncT = 0;
            ver++;
            if (upDialog != null) {
                try { upDialog.hide(); } catch (err) {}
                upDialog = null;
            }
            if (isActive()) loadStore();
            else store = {};

            if (!Vars.net.client()) {
                Time.run(2, new Runnable({
                    run: function() {
                        if (Vars.state == null || !Vars.state.isGame() || !isPvpMap()) return;
                        let tg = getTags();
                        if (tg != null && String(tg.get(TAG_ACTIVE, "0")) === "1") return;
                        api.onBegin();
                    }
                }));
            }
        }
    }));

    function reqState(player) {
        if (!isActive() || player == null) return null;
        let u = player.unit();
        let core = player.team().core();
        if (u == null || !u.isValid() || core == null) return null;
        if (Mathf.dst(u.x, u.y, core.x, core.y) > core.block.size * Vars.tilesize / 2 + NEAR_CORE) {
            toast(player, tr("[scarlet]Hãy về gần lõi để nâng cấp!", "[scarlet]Return near your core to upgrade!"));
            return null;
        }
        return bind(player);
    }

    if (global.NexNet != null) {
        global.NexNet.on(REQ_UP, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let k = parseInt(payload);
            if (!(k >= 0 && k < STATS.length)) return;
            if (st.pts < 1 || st.s[k] >= statMax(k)) return;
            st.pts--;
            st.s[k]++;
            changed();
        }, false, 60);

        global.NexNet.on(REQ_UNIT, function(player, payload) {
            let st = reqState(player);
            if (st == null || st.lv < FREE_SWITCH_LEVEL) return;
            let k = parseInt(payload);
            if (!(k >= 1 && k <= 5)) return;
            let nu = (k === tierCap(st.lv)) ? 0 : k;
            if ((st.u || 0) === nu) return;
            st.u = nu;
            toast(player, tr("[accent]Đã đổi sang unit: ", "[accent]Switched unit: ") + tierType(k).localizedName);
            changed();
        }, false, 400);

        global.NexNet.on(REQ_BUY, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let parts = String(payload).split("|");
            let mode = parts.length > 1 ? parts[1] : "b";
            let d = droneDefs().map[parts[0]];
            if (d == null) return;
            if (st.pts < d.cost) return;
            let pos;
            if (mode === "e" || mode === "c") {
                if (!d.equip) {
                    toast(player, tr("[scarlet]Pháo này không thể gắn lên unit/lõi!", "[scarlet]This turret cannot be mounted!"));
                    return;
                }
                if (mode === "e" ? equipCount(st) >= equipSlots(st) : coreCount(st) >= coreSlots(st)) {
                    toast(player, tr("[scarlet]Hết ô gắn!", "[scarlet]No free mount slot!"));
                    return;
                }
                pos = mode === "e" ? EQUIPPED : CORE_MOUNT;
            } else {
                if (builtCount(st) >= maxDrones()) {
                    toast(player, tr("[scarlet]Đã đạt giới hạn pháo xây!", "[scarlet]Built turret limit reached!"));
                    return;
                }
                pos = placeTurret(player, d);
                if (pos < 0) {
                    toast(player, tr("[scarlet]Không còn chỗ trống gần lõi để xây pháo này!", "[scarlet]No free space near the core for this turret!"));
                    return;
                }
            }
            st.pts -= d.cost;
            st.d.push(d.id);
            st.p.push(pos);
            changed();
        }, false, 60);

        global.NexNet.on(REQ_MODE, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let parts = String(payload).split("|");
            let idx = parseInt(parts[0]);
            let mode = parts.length > 1 ? parts[1] : "b";
            if (!(idx >= 0 && idx < st.d.length)) return;
            let d = droneDefs().map[st.d[idx]];
            if (d == null) return;
            let curP = st.p[idx];
            let cur = curP >= 0 ? "b" : (curP === EQUIPPED ? "e" : "c");
            if (cur === mode) return;
            if (mode === "b") {
                if (builtCount(st) >= maxDrones()) {
                    toast(player, tr("[scarlet]Đã đạt giới hạn pháo xây!", "[scarlet]Built turret limit reached!"));
                    return;
                }
                let pos = placeTurret(player, d);
                if (pos < 0) {
                    toast(player, tr("[scarlet]Không còn chỗ trống gần lõi để xây pháo này!", "[scarlet]No free space near the core for this turret!"));
                    return;
                }
                st.p[idx] = pos;
            } else {
                if (!d.equip) {
                    toast(player, tr("[scarlet]Pháo này không thể gắn lên unit/lõi!", "[scarlet]This turret cannot be mounted!"));
                    return;
                }
                if (mode === "e" ? equipCount(st) >= equipSlots(st) : coreCount(st) >= coreSlots(st)) {
                    toast(player, tr("[scarlet]Hết ô gắn!", "[scarlet]No free mount slot!"));
                    return;
                }
                removeTurret(curP, d);
                st.p[idx] = mode === "e" ? EQUIPPED : CORE_MOUNT;
            }
            changed();
        }, false, 60);

        global.NexNet.on(REQ_BARR, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let lv = st.b || 0;
            if (lv >= BARRACKS.length) return;
            let cost = BARRACKS[lv].cost;
            if (st.pts < cost) return;
            st.pts -= cost;
            st.b = lv + 1;
            toast(player, tr("[accent]Nhà máy lính cấp ", "[accent]Barracks level ") + st.b);
            changed();
        }, false, 300);

        global.NexNet.on(REQ_SELL, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let idx = parseInt(String(payload));
            if (!(idx >= 0 && idx < st.d.length)) return;
            let d = droneDefs().map[st.d[idx]];
            if (d == null) return;
            removeTurret(st.p[idx], d);
            st.d.splice(idx, 1);
            st.p.splice(idx, 1);
            st.pts += d.cost;
            changed();
        }, false, 60);
    }

    function builtCount(st) {
        let n = 0;
        for (let i = 0; i < st.p.length; i++) {
            if (st.p[i] >= 0) n++;
        }
        return n;
    }

    function equipCount(st) {
        let n = 0;
        for (let i = 0; i < st.p.length; i++) {
            if (st.p[i] === EQUIPPED) n++;
        }
        return n;
    }

    function coreCount(st) {
        let n = 0;
        for (let i = 0; i < st.p.length; i++) {
            if (st.p[i] === CORE_MOUNT) n++;
        }
        return n;
    }

    function coreSlots(st) {
        return Math.min(EQUIP_SLOT_CAP, Math.max(1, st.lv));
    }

    function equipSlots(st) {
        return Math.min(EQUIP_SLOT_CAP, Math.max(1, st.lv));
    }

    function localState() {
        if (Vars.player == null) return null;
        return byId[Vars.player.id];
    }

    function nearOwnCore() {
        if (Vars.player == null) return false;
        let u = Vars.player.unit();
        let core = Vars.player.team().core();
        if (u == null || !u.isValid() || core == null) return false;
        return Mathf.dst(u.x, u.y, core.x, core.y) <= core.block.size * Vars.tilesize / 2 + NEAR_CORE;
    }

    function send(kind, payload) {
        if (global.NexNet != null) global.NexNet.send(kind, payload);
    }

    function uiScale() {
        let s = 1;
        try { s = Scl.scl(1); } catch (err) {}
        return s > 0 ? s : 1;
    }

    function screenW() {
        try {
            let w = Core.scene.getWidth();
            if (w > 0) return w;
        } catch (err) {}
        return Core.graphics.getWidth() / uiScale();
    }

    function screenH() {
        try {
            let h = Core.scene.getHeight();
            if (h > 0) return h;
        } catch (err) {}
        return Core.graphics.getHeight() / uiScale();
    }

    function shortScreen() {
        return screenH() < 500;
    }

    function narrowScreen() {
        return screenW() < 520;
    }

    function panelW() {
        let w = Math.max(220, Math.min(screenW() - (shortScreen() ? 24 : 40), 640));
        return Math.min(w, Math.max(160, screenW() - 12));
    }

    function btnH() {
        if (!Vars.mobile) return 38;
        return shortScreen() ? 44 : 52;
    }

    function headH() {
        return (shortScreen() ? 58 : 80) + btnH() + 16;
    }

    function listH(extra) {
        let sh = screenH();
        let reserve = (shortScreen() ? 40 : 56) + (shortScreen() ? 52 : 72) + 24 + (extra === undefined ? headH() : extra);
        return Math.max(100, Math.min(sh - reserve, sh * 0.8));
    }

    function addClose(d) {
        if (!shortScreen()) {
            d.addCloseButton();
            return;
        }
        d.buttons.defaults().size(160, 44);
        d.buttons.button("@back", Icon.left, new Runnable({ run: function() { d.hide(); } }));
        d.closeOnBack();
    }

    function gridCols() {
        return panelW() >= 560 ? 2 : 1;
    }

    function cardW() {
        return Math.floor((panelW() - 36) / gridCols()) - 8;
    }

    function unitRow(p, st, t, cur, w) {
        let ut = tierType(t);
        let row = new Table(Styles.black6);
        row.margin(8);
        let selW = narrowScreen() ? 84 : 110;
        row.add(new Image(ut.uiIcon)).size(narrowScreen() ? 32 : 40).padRight(narrowScreen() ? 6 : 10);
        let col = new Table();
        col.left();
        col.add("[white]" + ut.localizedName + "[]").left().row();
        col.add("[lightgray]" + tr("Bậc ", "Tier ") + t + "[]").left();
        row.add(col).growX().left();
        if (t === cur) {
            row.add("[accent]" + tr("Đang dùng", "In use") + "[]").width(selW).center();
        } else {
            row.button(tr("Chọn", "Select"), new Runnable({ run: function() { send(REQ_UNIT, String(t)); } })).size(selW, btnH());
        }
        p.add(row).width(w).pad(4).row();
    }

    function statRow(p, st, i, w) {
        let lv = st.s[i];
        let row = new Table(Styles.black6);
        row.margin(8);
        let col = new Table();
        col.left();
        col.add("[white]" + tr(STATS[i].vi, STATS[i].en) + "[]   [lightgray]" + lv + "/" + statMax(i) + "[]").left().wrap().growX().row();
        col.add("[lightgray]" + STATS[i].f(lv) + (lv < statMax(i) ? "  >  " + STATS[i].f(lv + 1) : "  MAX") + "[]").left().wrap().growX();
        row.add(col).growX().left();
        let btn = row.button("+", new Runnable({ run: function() { send(REQ_UP, String(i)); } })).size(narrowScreen() ? 52 : 64, btnH()).padLeft(narrowScreen() ? 4 : 8).get();
        btn.setDisabled(st.pts < 1 || lv >= statMax(i));
        p.add(row).width(w).pad(4).row();
    }

    function turretDesc(def) {
        let ov = def.ov || {};
        if (ov.aura) return tr("Toả vùng " + (ov.auraRange || 15) + " ô, mỗi giây gây " + (ov.auraAtkPct || 0) + "% tấn công + " + (ov.auraArmorPct || 0) + "% giáp, đốt cháy mục tiêu",
            "Aura of " + (ov.auraRange || 15) + " tiles, deals " + (ov.auraAtkPct || 0) + "% attack + " + (ov.auraArmorPct || 0) + "% armor per second, burns targets");
        if (ov.rail) return tr("Mục tiêu trong " + ov.rangeTiles + " ô: mỗi " + ((ov.railInterval || 120) / 60) + "s bắn 1 tia railgun xuyên mọi mục tiêu, gây " + (ov.railPct || 150) + "% tấn công (dài " + (ov.railLen || 33) + ", rộng " + (ov.railWidth || 9) + ")",
            "Target within " + ov.rangeTiles + " tiles: every " + ((ov.railInterval || 120) / 60) + "s fires a piercing railgun shot dealing " + (ov.railPct || 150) + "% attack (length " + (ov.railLen || 33) + ", width " + (ov.railWidth || 9) + ")");
        if (ov.blast) return tr("Mục tiêu vào " + ov.rangeTiles + " ô: mỗi giây tạo 1 vụ nổ gây " + (ov.blastPct || 100) + "% tấn công",
            "Target within " + ov.rangeTiles + " tiles: 1 explosion per second dealing " + (ov.blastPct || 100) + "% attack");
        if (ov.pull) return tr("Tia kéo: gây sát thương và kéo mục tiêu trên không lại gần", "Tractor beam: damages and pulls air targets closer");
        if (ov.beam) return tr("Bắn tia laser liên tục vào mục tiêu", "Fires a continuous laser at the target");
        let parts = [];
        try { if (def.block.targetGround !== false) parts.push(tr("bộ binh", "ground")); } catch (err) {}
        try { if (def.block.targetAir !== false) parts.push(tr("máy bay", "air")); } catch (err) {}
        return parts.length > 0 ? tr("Bắn: ", "Targets: ") + parts.join(", ") : tr("Pháo tiêu chuẩn", "Standard turret");
    }

    function turretDmg(def) {
        try {
            if (!def.equip) return 0;
            if (def.ov && (def.ov.aura || def.ov.blast || def.ov.rail)) return 0;
            if (def.ov && def.ov.beam) return Math.round(def.ov.beamDps || 36);
            let bt = equipBullet(def);
            if (bt != null && bt.damage > 0) return Math.round(bt.damage);
        } catch (err) {}
        return 0;
    }

    function turretCard(st, def, cw) {
        let inner = Math.max(140, cw - 20);
        let owned = [];
        for (let j = 0; j < st.d.length; j++) {
            if (st.d[j] === def.id) owned.push(j);
        }
        let card = new Table(Styles.black6);
        card.margin(10);
        card.top().left();

        let canBuild = builtCount(st) < maxDrones();
        let canEquip = equipCount(st) < equipSlots(st);
        let canCore = coreCount(st) < coreSlots(st);
        let afford = st.pts >= def.cost;
        let tabStyle = Styles.togglet != null ? Styles.togglet : Styles.defaultt;
        let iconSz = narrowScreen() ? 32 : (Vars.mobile ? 44 : 36);

        let top = new Table();
        top.left();
        top.add(new Image(def.block.uiIcon)).size(iconSz).padRight(10).top();
        let col = new Table();
        col.left();
        col.add("[white]" + def.block.localizedName + "[]").left().row();
        col.add("[yellow]" + tr("Giá: ", "Cost: ") + def.cost + tr(" điểm", " pt") + "[]").left();
        top.add(col).left().growX();
        let tag = owned.length > 0 ? "[accent]x" + owned.length + "[]" : (!def.equip ? "[lightgray]" + tr("Chỉ xây", "Build only") + "[]" : "");
        if (tag.length > 0) top.add(tag).right().padLeft(6);
        card.add(top).width(inner).left().row();

        let dmg = turretDmg(def);
        let desc = turretDesc(def) + (dmg > 0 ? "\n[scarlet]" + tr("Sát thương: ", "Damage: ") + dmg + "[]" : "");
        card.add("[lightgray]" + desc + "[]").width(inner).left().wrap().padTop(6).row();

        card.image().color(Pal.gray).width(inner).height(2).padTop(8).padBottom(6).row();

        card.add("[lightgray]" + tr("Mua", "Buy") + "[]").left().row();
        let buy = new Table();
        buy.defaults().growX().uniformX().height(btnH()).pad(2).minWidth(0);
        let b1 = buy.button(tr("Xây", "Build"), new Runnable({ run: function() { send(REQ_BUY, def.id + "|b"); } })).get();
        b1.setDisabled(!afford || !canBuild);
        let b2 = buy.button("Unit", new Runnable({ run: function() { send(REQ_BUY, def.id + "|e"); } })).get();
        b2.setDisabled(!afford || !def.equip || !canEquip);
        let b3 = buy.button(tr("Lõi", "Core"), new Runnable({ run: function() { send(REQ_BUY, def.id + "|c"); } })).get();
        b3.setDisabled(!afford || !def.equip || !canCore);
        card.add(buy).width(inner).row();

        for (let n = 0; n < owned.length; n++) {
            let j = owned[n];
            let pp = st.p[j];
            let cur = pp >= 0 ? "b" : (pp === EQUIPPED ? "e" : "c");
            let curName = cur === "b" ? tr("Xây", "Build") : (cur === "e" ? "Unit" : tr("Lõi", "Core"));

            card.image().color(Pal.gray).width(inner).height(1).padTop(8).padBottom(4).row();

            let hdr = new Table();
            hdr.add("[accent]#" + (n + 1) + "[]  [lightgray]" + curName + "[]").left().growX();
            hdr.button(tr("Bán", "Sell"), new Runnable({ run: function() { send(REQ_SELL, String(j)); } })).width(narrowScreen() ? 64 : (Vars.mobile ? 88 : 72)).height(btnH());
            card.add(hdr).width(inner).row();

            let row = new Table();
            row.defaults().growX().uniformX().height(btnH()).pad(2).minWidth(0);
            let m1 = row.button(tr("Xây", "Build"), tabStyle, new Runnable({ run: function() { send(REQ_MODE, j + "|b"); } })).get();
            m1.setChecked(cur === "b");
            m1.setDisabled(cur === "b" || !canBuild);
            let m2 = row.button("Unit", tabStyle, new Runnable({ run: function() { send(REQ_MODE, j + "|e"); } })).get();
            m2.setChecked(cur === "e");
            m2.setDisabled(cur === "e" || !def.equip || !canEquip);
            let m3 = row.button(tr("Lõi", "Core"), tabStyle, new Runnable({ run: function() { send(REQ_MODE, j + "|c"); } })).get();
            m3.setChecked(cur === "c");
            m3.setDisabled(cur === "c" || !def.equip || !canCore);
            card.add(row).width(inner).row();
        }
        return card;
    }

    function armyDesc(i) {
        let cfg = BARRACKS[i];
        let ut = UnitTypes[cfg.t];
        let name = ut != null ? ut.localizedName : cfg.t;
        return name + "  x" + cfg.n + tr(" / ", " / ") + cfg.sec + "s  " + tr("tối đa ", "max ") + cfg.cap;
    }

    function armyTab(p, st, w) {
        let lv = st.b || 0;
        let box = new Table(Styles.black6);
        box.margin(10);
        box.add("[accent]" + tr("Nhà máy lính tự động", "Auto barracks") + "[]").left().row();
        box.add("[lightgray]" + tr("Sinh lính tại lõi, tự đi đánh lõi phe khác.", "Spawns soldiers at your core that march on enemy cores.") + "[]").left().wrap().growX().padBottom(6).row();
        if (lv < 1) {
            box.add("[white]" + tr("Chưa mua.", "Not purchased.") + "[]").left().row();
        } else {
            box.add("[white]" + tr("Cấp ", "Level ") + lv + "/" + BARRACKS.length + "[]  [accent]" + armyDesc(lv - 1) + "[]").left().wrap().growX().row();
        }
        if (lv < BARRACKS.length) {
            let cost = BARRACKS[lv].cost;
            box.add("[lightgray]" + tr("Tiếp theo: ", "Next: ") + armyDesc(lv) + "[]").left().wrap().growX().padTop(4).row();
            let b = box.button((lv < 1 ? tr("Mua", "Buy") : tr("Nâng cấp", "Upgrade")) + " (" + cost + tr(" điểm)", " pt)"), new Runnable({ run: function() { send(REQ_BARR, "1"); } })).growX().height(btnH()).padTop(8).get();
            b.setDisabled(st.pts < cost);
        } else {
            box.add("[accent]MAX[]").left().padTop(4).row();
        }
        p.add(box).width(w).pad(4).row();

        let list = new Table(Styles.black6);
        list.margin(10);
        for (let i = 0; i < BARRACKS.length; i++) {
            let c = (i + 1 === lv) ? "[accent]" : "[lightgray]";
            list.add(c + (i + 1) + ". " + armyDesc(i) + "  (" + BARRACKS[i].cost + tr(" điểm)", " pt)") + "[]").left().wrap().growX().row();
        }
        p.add(list).width(w).pad(4).row();
    }

    function scanLines(st) {
        let out = [];
        let u = null;
        try { u = Vars.player.unit(); } catch (err) {}
        if (u == null || !u.isValid()) return null;
        let ut = u.type;
        let s = st.s;
        let f1 = function(v) { return (Math.round(v * 100) / 100).toString(); };
        out.push([tr("Unit đang điều khiển", "Controlled unit"), "[accent]" + ut.localizedName + "[]  " + tr("(cấp ", "(tier ") + activeTier(st) + ")"]);
        out.push([tr("Máu", "Health"), Math.round(u.health) + " / " + Math.round(u.maxHealth) + "  [lightgray]" + tr("(gốc ", "(base ") + Math.round(ut.health) + ")[]"]);
        let hm = u.healthMultiplier > 0 ? u.healthMultiplier : 1;
        out.push([tr("Giáp", "Armor"), f1(u.armor) + "  [lightgray]" + tr("(gốc ", "(base ") + f1(ut.armor) + ")[]  " + tr("giảm sát thương nhận ", "damage taken reduced ") + f1((1 - 1 / hm) * 100) + "%"]);
        out.push([tr("Tấn công", "Attack"), "x" + f1(u.damageMultiplier)]);
        out.push([tr("Tốc độ di chuyển", "Move speed"), f1(ut.speed * u.speedMultiplier) + "  [lightgray]" + tr("(gốc ", "(base ") + f1(ut.speed) + ")  x" + f1(u.speedMultiplier) + "[]"]);
        out.push([tr("Tốc độ bắn", "Fire rate"), "x" + f1(u.reloadMultiplier)]);
        out.push([tr("Tỉ lệ bạo kích", "Crit chance"), (s[5] * 2) + "%"]);
        out.push([tr("Sát thương bạo kích", "Crit damage"), (150 + s[6] * 12) + "%"]);
        out.push([tr("Xuyên giáp", "Armor pierce"), (s[7] * 5) + "%"]);
        out.push([tr("Sát thương % máu tối đa", "Max HP damage"), ((s[8] + 1) / 10).toFixed(1) + "%"]);
        out.push([tr("Hồi máu", "Regeneration"), f1(u.maxHealth * s[9] * REGEN_PCT / 100) + tr(" máu/giây (khi dưới 99%)", " HP/s (below 99%)")]);
        out.push([tr("Sát thương theo máu", "HP-based damage"), "+" + f1(s[10] * DMG_PER_HP * u.health * 100) + "%"]);
        out.push([tr("Sát thương theo giáp", "Armor-based damage"), "+" + f1(s[11] * DMG_PER_ARMOR * u.armor * 100) + "%"]);
        out.push([tr("Đẩy lùi", "Knockback"), "+" + f1(s[12] * KNOCK_PER)]);
        out.push([tr("Pháo gắn", "Mounted turrets"), tr("unit ", "unit ") + equipCount(st) + "/" + equipSlots(st) + tr(", lõi ", ", core ") + coreCount(st) + "/" + coreSlots(st)]);
        return out;
    }

    function statDetailDialog(st) {
        let dialog = new BaseDialog(tr("Chi tiết chỉ số", "Stat details"));
        addClose(dialog);
        let W2 = Math.min(480, panelW());
        function fill() {
            dialog.cont.clear();
            let cur = localState();
            let lines = cur != null ? scanLines(cur) : null;
            dialog.cont.button(tr("Quét lại unit", "Rescan unit"), new Runnable({ run: function() { fill(); } })).width(W2).height(btnH()).pad(4).row();
            dialog.cont.pane(new Cons({
                get: function(p) {
                    p.margin(10);
                    p.top();
                    if (lines == null) {
                        p.add("[scarlet]" + tr("Không quét được: bạn chưa điều khiển unit nào.", "Scan failed: you are not controlling a unit.") + "[]").left().wrap().growX().row();
                        return;
                    }
                    for (let i = 0; i < lines.length; i++) {
                        p.add("[lightgray]" + lines[i][0] + "[]").left().wrap().growX().row();
                        p.add("[white]" + lines[i][1] + "[]").left().wrap().growX().padBottom(8).row();
                    }
                }
            })).width(W2).maxHeight(listH(btnH() + 12)).scrollX(false);
        }
        fill();
        dialog.show();
    }

    function buildDialog(d) {
        let c = d.cont;
        c.clear();
        upPane = null;
        let st = localState();
        if (st == null) {
            c.add(tr("Đang đồng bộ dữ liệu...", "Syncing data...")).pad(20).row();
            return;
        }
        let W = panelW();
        let defs = droneDefs();

        let head = new Table(Styles.black6);
        head.margin(shortScreen() ? 4 : 8);
        head.add("[accent]" + tr("Cấp ", "Level ") + st.lv + "/" + MAX_LEVEL + "[]").left();
        head.add("[white]" + tierType(activeTier(st)).localizedName + "[]").expandX().center();
        head.add("[yellow]" + tr("Điểm: ", "Points: ") + st.pts + "[]").right();
        head.row();
        head.add(new Bar(
            new Prov({ get: function() { return "EXP " + expText(); } }),
            new Prov({ get: function() { return Pal.accent; } }),
            new Floatp({ get: function() { return expFrac(); } })
        )).growX().height(shortScreen() ? 16 : (Vars.mobile ? 26 : 20)).colspan(3).padTop(shortScreen() ? 2 : 6);
        c.add(head).width(W).pad(4).row();

        if (upTab < 0 || upTab > 3) upTab = 0;
        let names = [
            tr("Unit", "Unit"),
            tr("Chỉ số", "Stats"),
            tr("Pháo", "Turrets"),
            tr("Lính", "Army")
        ];
        let tabStyle = Styles.togglet != null ? Styles.togglet : Styles.defaultt;
        let tabs = new Table();
        for (let i = 0; i < 4; i++) {
            let ix = i;
            let tb = tabs.button(names[i], tabStyle, new Runnable({ run: function() { upTab = ix; ver++; } })).growX().height(btnH()).pad(2).get();
            tb.setChecked(upTab === i);
        }
        c.add(tabs).width(W).row();

        let tab = upTab;
        let cols = gridCols();
        let cw = cardW();
        let cell = c.pane(new Cons({
            get: function(p) {
                p.margin(4);
                p.top();
                if (tab === 0) {
                    if (st.lv < FREE_SWITCH_LEVEL) {
                        p.add("[lightgray]" + tr("Đạt cấp " + FREE_SWITCH_LEVEL + " để được đổi unit tùy ý.", "Reach level " + FREE_SWITCH_LEVEL + " to switch units freely.") + "[]").pad(10).row();
                        return;
                    }
                    let cur = activeTier(st);
                    for (let t = 1; t <= 5; t++) unitRow(p, st, t, cur, W - 24);
                } else if (tab === 1) {
                    p.button(tr("Xem chi tiết chỉ số", "View stat details"), new Runnable({ run: function() { statDetailDialog(st); } })).width(W - 24).height(btnH()).pad(4).row();
                    for (let i = 0; i < STATS.length; i++) statRow(p, st, i, W - 24);
                } else if (tab === 2) {
                    let info = new Table(Styles.black6);
                    info.margin(8);
                    info.defaults().growX().uniformX().minWidth(0);
                    info.add("[lightgray]Unit[]  [white]" + equipCount(st) + "/" + equipSlots(st) + "[]").center();
                    info.add("[lightgray]" + tr("Lõi", "Core") + "[]  [white]" + coreCount(st) + "/" + coreSlots(st) + "[]").center();
                    info.add("[lightgray]" + tr("Xây", "Build") + "[]  [white]" + builtCount(st) + "/" + maxDrones() + "[]").center();
                    p.add(info).colspan(cols).width(W - 32).pad(4).row();
                    p.add("[lightgray]" + tr("Mỗi cấp +1 ô. Có thể mua nhiều pháo cùng loại.", "+1 slot per level. You can buy the same turret many times.") + "[]").colspan(cols).width(W - 32).left().wrap().pad(2).row();
                    for (let j = 0; j < defs.list.length; j++) {
                        p.add(turretCard(st, defs.list[j], cw)).width(cw).pad(4).top().left();
                        if ((j + 1) % cols === 0) p.row();
                    }
                } else {
                    armyTab(p, st, W - 24);
                }
            }
        })).width(W).maxHeight(listH()).scrollX(false);
        cell.row();
        upPane = cell.get();
        restoreN = upScroll > 0 ? 4 : 0;
    }

    function openUpgrade() {
        if (Vars.headless || !isActive()) return;
        if (upDialog != null && upDialog.isShown()) return;
        if (Core.scene.hasDialog()) return;
        if (!nearOwnCore()) {
            Vars.ui.showInfoToast(tr("[scarlet]Hãy về gần lõi và nhấn vào lõi để nâng cấp!", "[scarlet]Go near your core and tap it to upgrade!"), 2.5);
            return;
        }
        let dialog = new BaseDialog(tr("Nâng cấp PvP", "PvP Upgrades"));
        addClose(dialog);
        let lastVer = -1;
        let lastTab = -1;
        let lastW = -1;
        upTab = 0;
        upScroll = 0;
        restoreN = 0;
        dialog.update(new Runnable({
            run: function() {
                if (!nearOwnCore()) {
                    dialog.hide();
                    return;
                }
                let w = Core.graphics.getWidth() * 10000 + Core.graphics.getHeight();
                if (lastVer !== ver || lastTab !== upTab || lastW !== w) {
                    if (upPane != null && lastTab === upTab) {
                        try { upScroll = upPane.getScrollY(); } catch (err) {}
                    }
                    if (lastTab !== upTab) upScroll = 0;
                    lastVer = ver;
                    lastTab = upTab;
                    lastW = w;
                    buildDialog(dialog);
                } else if (restoreN > 0 && upPane != null) {
                    restoreN--;
                    try { upPane.setScrollYForce(upScroll); } catch (err) {
                        try { upPane.setScrollY(upScroll); } catch (err2) {}
                    }
                }
            }
        }));
        upDialog = dialog;
        dialog.show();
    }

    if (typeof TapEvent !== "undefined") {
        Events.on(TapEvent, new Cons({
            get: function(e) {
                if (Vars.headless || !isActive() || e.player !== Vars.player || e.tile == null) return;
                if (!(e.tile.block() instanceof CoreBlock)) return;
                if (e.tile.team() !== Vars.player.team()) return;
                openUpgrade();
            }
        }));
    }

    function hudLine() {
        let st = localState();
        if (st == null) return "";
        return "[accent]" + tr("Cấp ", "Lv ") + "[white]" + st.lv + "[]  [yellow]" + tr("ĐP ", "Pt ") + st.pts + "[]  [lightgray]" + tierType(activeTier(st)).localizedName + "[]";
    }

    function expText() {
        let st = localState();
        if (st == null) return "";
        if (st.lv >= MAX_LEVEL) return "MAX";
        return Math.floor(st.exp) + "/" + expNeed(st.lv);
    }

    function expFrac() {
        let st = localState();
        if (st == null || st.lv >= MAX_LEVEL) return 1;
        return Math.max(0, Math.min(1, st.exp / expNeed(st.lv)));
    }

    function hudVisible() {
        try { return Core.settings.getBool(KEY_HUD, true); } catch (err) {}
        return true;
    }

    function hudSetVisible(v) {
        try { Core.settings.put(KEY_HUD, v ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE); } catch (err) {}
    }

    function hudSavePos() {
        if (hudPanel == null) return;
        try {
            Core.settings.put(KEY_HUD_X, java.lang.Float(hudPanel.x));
            Core.settings.put(KEY_HUD_Y, java.lang.Float(hudPanel.y));
        } catch (err) {}
    }

    function hudCenter() {
        if (hudPanel == null) return;
        hudPanel.setPosition((screenW() - hudPanel.getWidth()) / 2, screenH() - hudPanel.getHeight() - (Vars.mobile ? 90 : 70));
        hudSavePos();
    }

    function hudClamp() {
        if (hudPanel == null) return;
        let mx = Math.max(0, screenW() - hudPanel.getWidth());
        let my = Math.max(0, screenH() - hudPanel.getHeight());
        hudPanel.setPosition(Mathf.clamp(hudPanel.x, 0, mx), Mathf.clamp(hudPanel.y, 0, my));
        hudSavePos();
    }

    Events.on(ClientLoadEvent, new Cons({
        get: function(e) {
            if (Vars.headless) return;
            try {
                Core.bundle.getProperties().put("setting." + KEY_HUD + ".name", tr("Hiện UI EXP PvP (Shift+2)", "Show PvP EXP UI (Shift+2)"));
                Vars.ui.settings.game.checkPref(KEY_HUD, true);
            } catch (err) {
                Log.err("[NexPvp] cannot add HUD setting: " + err);
            }
            const W = Vars.mobile ? 150 : 170;
            let t = new Table(Styles.black6);
            hudPanel = t;
            t.margin(4);
            t.name = "newex-pvp-hud";
            t.touchable = Touchable.enabled;
            t.label(new Prov({ get: function() { return hudLine(); } })).width(W).left().get().setFontScale(0.8);
            t.row();
            t.add(new Bar(
                new Prov({ get: function() { return expText(); } }),
                new Prov({ get: function() { return Pal.accent; } }),
                new Floatp({ get: function() { return expFrac(); } })
            )).size(W, 14).padTop(2);
            t.row();
            let ub = t.button(tr("Nâng cấp", "Upgrade"), Icon.up || Icon.add, new Runnable({ run: function() { openUpgrade(); } })).size(W, Vars.mobile ? 36 : 28).padTop(3).get();
            ub.getLabel().setFontScale(0.8);
            t.visibility = new Boolp({ get: function() { return isActive() && Vars.ui.hudfrag.shown && hudVisible(); } });
            t.pack();
            if (Core.settings.has(KEY_HUD_X) && Core.settings.has(KEY_HUD_Y)) {
                t.setPosition(Core.settings.getFloat(KEY_HUD_X, 0), Core.settings.getFloat(KEY_HUD_Y, 0));
                hudClamp();
            } else {
                hudCenter();
            }

            let dragging = false;
            let offX = 0;
            let offY = 0;
            t.addListener(extend(InputListener, {
                touchDown(event, x, y, pointer, button) {
                    dragging = false;
                    offX = x;
                    offY = y;
                    return true;
                },
                touchDragged(event, x, y, pointer) {
                    if (Math.abs(x - offX) > 5 || Math.abs(y - offY) > 5) dragging = true;
                    if (dragging) {
                        let mx = Math.max(0, screenW() - t.getWidth());
                        let my = Math.max(0, screenH() - t.getHeight());
                        t.setPosition(Mathf.clamp(t.x + x - offX, 0, mx), Mathf.clamp(t.y + y - offY, 0, my));
                        hudSavePos();
                    }
                },
                touchUp(event, x, y, pointer, button) {
                    dragging = false;
                }
            }));
            Vars.ui.hudGroup.addChild(t);
            hudLastW = Core.graphics.getWidth();
            hudLastH = Core.graphics.getHeight();
        }
    }));

    if (!Vars.headless) {
        Events.run(Trigger.update, new Runnable({
            run: function() {
                if (hudPanel == null) return;
                let w = Core.graphics.getWidth();
                let h = Core.graphics.getHeight();
                if (w !== hudLastW || h !== hudLastH) {
                    hudLastW = w;
                    hudLastH = h;
                    hudClamp();
                }
                if (!isActive()) return;
                try {
                    let sh = Core.input.keyDown(KeyCode.shiftLeft) || Core.input.keyDown(KeyCode.shiftRight);
                    if (sh && Core.input.keyTap(KeyCode.num2) && !Core.scene.hasKeyboard()) {
                        hudSetVisible(!hudVisible());
                    }
                } catch (err) {}
            }
        }));
    }

    function normalizeRules(r, tl) {
        try { r.infiniteResources = false; } catch (err) {}
        for (let i = 0; i < tl.length; i++) {
            try {
                let rule = r.teams.get(tl[i]);
                rule.infiniteResources = false;
                rule.fillItems = false;
                setf(rule, "infiniteAmmo", true);
                setf(rule, "cheat", true);
            } catch (err) {}
        }
    }

    const api = {
        MAP_ID: MAP_ID,
        REWARD_POINTS: REWARD_POINTS,
        isActive: isActive,

        onBegin: function() {
            winning = false;
            seenBoth = false;
            byId = {};
            equipCd = {};
            teamsCache = null;
            let r = Vars.state.rules;
            r.tags.put(TAG_ACTIVE, "1");
            r.tags.put(TAG_DATA, "{}");
            loadStore();
            saveStore(false);
            r.waves = true;
            r.waveTimer = true;
            r.attackMode = false;
            r.pvp = true;
            r.winWave = 0;
            r.waitEnemies = false;
            r.dropZoneRadius = 0;
            try { r.tags.remove(TAG_TEAMS); } catch (err) {}
            try { r.tags.remove(TAG_ASSIGN); } catch (err) {}
            teamsCache = null;
            assignCache = null;
            seenPl = {};
            let tl = pvpTeams();
            r.defaultTeam = tl[0];
            r.waveTeam = Team.crux;
            normalizeRules(r, tl);
            allowWaveUnits(r);
            evictRed();
            r.waveSpacing = WAVE_SPACING;
            r.initialWaveSpacing = FIRST_WAVE;
            r.spawns = new Seq();
            r.bannedBlocks.addAll(Vars.content.blocks());
            Vars.state.wave = 1;
            Vars.state.wavetime = FIRST_WAVE;
            syncRules();
            ver++;
        },

        onResume: function() {
            winning = false;
            seenBoth = false;
            teamsCache = null;
            Vars.state.rules.waveTeam = Team.crux;
            normalizeRules(Vars.state.rules, pvpTeams());
            allowWaveUnits(Vars.state.rules);
            evictRed();
            syncRules();
            Vars.ui.showInfoToast(tr("PvP Cày Cấp: đã tiếp tục trận đấu", "PvP Leveling: match resumed"), 3);
        },

        addSettings: function(content) {
            content.add(tr("[accent]-- PVP CÀY CẤP --[]", "[accent]-- PVP LEVELING --[]")).padTop(10).row();

            content.add(tr("% EXP nhận vào (PvP):", "EXP received (%) (PvP):")).padBottom(4).row();
            let expTable = new Table();
            let expField = expTable.field(String(expPercent()), text => {}).width(120).get();
            expField.setFilter(TextField.TextFieldFilter.digitsOnly);
            expField.setMaxLength(4);
            expTable.add(tr("% (100 = bình thường)", "% (100 = normal)")).padLeft(8);
            content.add(expTable).pad(5).row();

            content.add(tr("Giới hạn pháo xây gần lõi (PvP):", "Built turret limit (PvP):")).padBottom(4).row();
            let drTable = new Table();
            let drField = drTable.field(String(maxDrones()), text => {}).width(120).get();
            drField.setFilter(TextField.TextFieldFilter.digitsOnly);
            drField.setMaxLength(2);
            drTable.add(tr("pháo (0 - " + LIMIT_DRONES + ")", "turrets (0 - " + LIMIT_DRONES + ")")).padLeft(8);
            content.add(drTable).pad(5).row();

            return function() {
                let e = parseInt(expField.getText());
                if (isNaN(e) || e < 0) e = DEFAULT_EXP;
                if (e > LIMIT_EXP) e = LIMIT_EXP;
                Core.settings.put(KEY_EXP, java.lang.Integer(e));

                let n = parseInt(drField.getText());
                if (isNaN(n) || n < 0) n = DEFAULT_DRONES;
                if (n > LIMIT_DRONES) n = LIMIT_DRONES;
                Core.settings.put(KEY_DRONES, java.lang.Integer(n));
            };
        }
    };

    global.NexPvp = api;
})();