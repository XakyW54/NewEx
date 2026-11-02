(function() {
    const DRONE_IDS = [
        "duo", "scatter", "scorch", "hail", "wave", "lancer", "arc", "parallax", "swarmer",
        "salvo", "segment", "tsunami", "fuse", "ripple", "cyclone", "foreshadow", "spectre", "meltdown",
        "breach", "diffuse", "sublimate", "titan", "disperse", "afflict", "lustre", "scathe", "smite", "malign"
    ];

    const MAP_ID = "pvpnewex3110";
    const REWARD_POINTS = 30;

    const TAG_ACTIVE = "newex-pvp";
    const KEY_EXP = "newex-pvp-exp-percent";
    const KEY_MULTI = "newex-pvp-multi-turret";
    const KEY_BUILT = "newex-pvp-max-built";
    const DEFAULT_BUILT = 3;
    const LIMIT_BUILT = 12;
    const BUILD_FLOOR = "core-zone"; // chỉ xây pháo trên nền đặt lõi (để "" = xây trên mọi nền)
    const KEY_SHIELD = "newex-pvp-shield-min";
    const KEY_HUD = "newex-pvp-hud";
    const KEY_HUD_X = "newex-pvp-hud-x";
    const KEY_HUD_Y = "newex-pvp-hud-y";
    const KEY_JOY = "newex-pvp-joystick";
    const RESPAWN_SEC = [2, 4, 6, 9, 12];
    const IN_BAG = -2; // pháo trong túi đồ (giá trị cũ của "gắn lõi" -> tự động chuyển vào túi)
    const DEFAULT_EXP = 100;
    const LIMIT_EXP = 1000;
    const DEFAULT_SHIELD_MIN = 15;
    const LIMIT_SHIELD_MIN = 9999;
    const SHIELD_FOREVER_TICKS = 1000000000;
    const SHIELD_HP = 15000;
    const SHIELD_BUFFER = 1000000;
    const SHIELD_SYNC_TICKS = 30;
    const SHIELD_KIND = "newex-pvp-shield";
    const EXP_KIND = "newex-pvp-exp";
    const SHIELD_COLOR = Color.valueOf("#d000ff");
    const SHIELD_GLOW = Color.valueOf("#00f0ff");
    const SHIELD_GOLD = Color.valueOf("#ffe58a");

    const SYNC_KIND = "newex-pvp-sync";
    const REQ_UP = "newex-pvp-up";
    const REQ_BUY = "newex-pvp-buy";
    const REQ_SELL = "newex-pvp-sell";
    const REQ_UNIT = "newex-pvp-unit";
    const REQ_MODE = "newex-pvp-mode";
    const REQ_CHEAT = "newex-pvp-cheat";
    const CHEAT_SEQ = ["x", "a", "k", "y", "f", "u", "l", "l"];
    const CHEAT_POINTS = 999;
    const CHEAT_GAP_TICKS = 180;

    const MAX_LEVEL = 99;
    const KEY_MAXLV = "newex-pvp-max-level";
    const LIMIT_MAXLV = 999;
    const FREE_SWITCH_LEVEL = 5;
    const STAT_PER_PAGE = 4;
    const TURRET_PER_PAGE = 5;
    const UNIT_PER_PAGE = 5;
    const TIER_MAX = 7;
    const STAT_MAX = 20;
    const START_POINTS = 3;
    const PASSIVE_EXP = 60;
    const PASSIVE_INTERVAL = 3600;
    const MAX_WAVE_UNITS = 200;
    const REIGN_HP_MUL = 1.5;
    const DISRUPT_SPEED_MUL = 2.2;

    const EXP_PER_HP = 0.1;
    const DEATH_EXP_PCT = 10; // người thua nhận 10% EXP của unit mình
    const SOLDIER_EXP_PCT = 20; // % EXP (theo máu lính) chủ nhận khi lính của mình chết
    const KILL_EXP_PCT = 20;  // người thắng nhận 20% EXP của unit bị hạ
    const SPAWN_GUARD_TICKS = 600;
    const SPAWN_GUARD_DAMAGE_CUT = 99;
    const SPAWN_RAGE_TICKS = 180;
    const SPAWN_RAGE_MAXHP_PCT = 100;
    const EXP_HP_BONUS_REF = 5000;
    const EXP_HP_BONUS_MAX = 1.5;
    const CREDIT_RADIUS = 420;
    const NEAR_CORE = 240;
    const AURA_BURN_TICKS = 600;
    const WAVE_SPACING = 2400;
    const FIRST_WAVE = 1200;
    const WAVE_UNIT_CAP = 1000;
    const BONUS_WAVE_INTERVAL = 8 * 60 * 60;
    const BONUS_WAVE_TIMES = 10;
    const BONUS_WAVE_MAX_NEW = 300;
    let bonusWaveT = 0;
    const EQUIPPED = -1;
    const EQUIP_SLOT_CAP = 12;
    const REQ_BARR = "newex-pvp-barr";
    const ARMY_PER_PAGE = 5;
    const BARRACKS_DISCOUNT = 0.8; // giảm 80% giá nhà máy lính (trả 20%, tối thiểu 1 điểm)
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

    function barrackCost(i) {
        return Math.max(1, Math.ceil(BARRACKS[i].cost * (1 - BARRACKS_DISCOUNT)));
    }

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
    const DMG_PER_ARMOR = 0.03;
    const KNOCK_PER = 1.0;

    const ROLE_BRAWLER = "brawler";
    const ROLE_ATTACK = "attack";
    const ROLE_DEFENSE = "defense";
    const ROLE_DEALER = "dealer";
    const TURRET_ROLES = {
        duo: ROLE_BRAWLER, scatter: ROLE_ATTACK, scorch: ROLE_BRAWLER, hail: ROLE_ATTACK, wave: ROLE_BRAWLER,
        lancer: ROLE_ATTACK, arc: ROLE_BRAWLER, parallax: ROLE_BRAWLER, swarmer: ROLE_ATTACK, salvo: ROLE_ATTACK,
        segment: ROLE_DEFENSE, tsunami: ROLE_BRAWLER, fuse: ROLE_BRAWLER, ripple: ROLE_ATTACK, cyclone: ROLE_ATTACK,
        foreshadow: ROLE_DEALER, spectre: ROLE_ATTACK, meltdown: ROLE_BRAWLER, breach: ROLE_ATTACK, diffuse: ROLE_BRAWLER,
        sublimate: ROLE_BRAWLER, titan: ROLE_ATTACK, disperse: ROLE_ATTACK, afflict: ROLE_ATTACK, lustre: ROLE_ATTACK,
        scathe: ROLE_DEALER, smite: ROLE_ATTACK, malign: ROLE_DEALER
    };

    function roleText(id) {
        let r = TURRET_ROLES[id];
        if (r === ROLE_BRAWLER) return "[orange]" + tr("Cận chiến", "Brawler") + "[]";
        if (r === ROLE_ATTACK) return "[scarlet]" + tr("Tấn công", "Attack") + "[]";
        if (r === ROLE_DEFENSE) return "[sky]" + tr("Phòng thủ", "Defense") + "[]";
        if (r === ROLE_DEALER) return "[gold]" + tr("Sát thương", "Damage") + "[]";
        return "";
    }

    // thưởng chỉ số theo vai trò khi pháo đang được trang bị (mỗi pháo cộng dồn)
    const ROLE_ATK_PCT = 5;
    const ROLE_HP_PCT = 15;
    const ROLE_ARM_PCT = 10;
    const ROLE_ARM_FLAT = 5;
    const ROLE_CUT_PCT = 5;
    const ROLE_CUT_CAP = 60;
    const ROLE_ATK_MAX = 50;
    const ROLE_HP_MAX = 100;

    function roleDesc(id) {
        let r = TURRET_ROLES[id];
        if (r === ROLE_ATTACK) return tr("Trang bị: +" + ROLE_ATK_PCT + "% tấn công (tối đa " + ROLE_ATK_MAX + "%)", "Equipped: +" + ROLE_ATK_PCT + "% attack (max " + ROLE_ATK_MAX + "%)");
        if (r === ROLE_BRAWLER) return tr("Trang bị: +" + ROLE_HP_PCT + "% máu (tối đa " + ROLE_HP_MAX + "%)", "Equipped: +" + ROLE_HP_PCT + "% HP (max " + ROLE_HP_MAX + "%)");
        if (r === ROLE_DEFENSE) return tr("Trang bị: +" + ROLE_ARM_PCT + "% giáp, +" + ROLE_ARM_FLAT + " giáp, -" + ROLE_CUT_PCT + "% sát thương nhận (tối đa " + ROLE_CUT_CAP + "%)", "Equipped: +" + ROLE_ARM_PCT + "% armor, +" + ROLE_ARM_FLAT + " armor, -" + ROLE_CUT_PCT + "% damage taken (max " + ROLE_CUT_CAP + "%)");
        return "";
    }

    function roleCounts(st) {
        let o = { atk: 0, brl: 0, def: 0 };
        if (st == null || st.d == null) return o;
        for (let i = 0; i < st.d.length; i++) {
            if (st.p[i] !== EQUIPPED) continue;
            let r = TURRET_ROLES[st.d[i]];
            if (r === ROLE_ATTACK) o.atk++;
            else if (r === ROLE_BRAWLER) o.brl++;
            else if (r === ROLE_DEFENSE) o.def++;
        }
        return o;
    }

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
        { vi: "Hồi máu", en: "Regeneration", f: function(l) { return "+" + (l * REGEN_PCT).toFixed(2) + tr("% máu tối đa mỗi giây (khi máu dưới 99%)", "% max HP per second (when below 99% HP)"); } },
        { vi: "Sát thương theo máu", en: "HP-based damage", f: function(l) { return "+" + (l * DMG_PER_HP * 1000).toFixed(1) + "% " + tr("mỗi 1000 máu hiện tại", "per 1000 current HP"); } },
        { vi: "Sát thương theo giáp", en: "Armor-based damage", f: function(l) { return "+" + (l * DMG_PER_ARMOR * 10).toFixed(1) + "% " + tr("mỗi 10 giáp hiện tại", "per 10 current armor"); } },
        { vi: "Đẩy lùi", en: "Knockback", f: function(l) { return "+" + (l * KNOCK_PER).toFixed(2) + " " + tr("lực đẩy lùi", "knockback"); } }
    ];

    function statMax(i) {
        if (i === 0 || i === 1) return Infinity;
        let m = STATS[i].mx;
        return m > 0 ? m : STAT_MAX;
    }

    function statMaxLabel(i) {
        let m = statMax(i);
        return m === Infinity ? "\u221e" : String(m);
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
    let hostOwner = {};
    let auraSeen = {};
    let respawnLock = {};
    let deadUnit = {};
    let spawnBuff = {};
    let coreT = 0;
    let deathOk = null;
    let hudPanel = null;
    let hudLastW = 0;
    let hudLastH = 0;
    let swapPending = {};
    let barrackT = {};
    let soldiers = {};
    let soldierOwner = {};
    let prevUnit = {}; // unit tier còn sống của từng người chơi, để chặn nút respawn/về lõi
    let mountSt = {};
    let logged = {};
    let passiveT = PASSIVE_INTERVAL;
    let ver = 0;
    let dirty = false;
    let syncT = 0;
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
    let upPage = 0;
    let recentUp = [[], [], [], []];
    let viewUp = [[], [], [], []];
    let lastUpTab = 0;
    let upBodyEl = null;      // phần thân đang hiển thị (để chạy hiệu ứng thoát)
    let upPending = null;     // thao tác chuyển trang đang chờ hiệu ứng thoát xong
    let upEnterDir = 0;       // hướng lướt vào của trang mới (+1: sang phải, -1: về trái)
    let turCardHCache = { key: "", h: 0 };
    const UP_EXIT_MS = 90;
    const UP_ENTER_MS = 170;

    let matchT = 0;
    let shieldMinCache = DEFAULT_SHIELD_MIN;
    let shieldMinT = 0;
    let coreShield = {};
    let shieldRecs = [];
    let shieldStamp = 0;
    let shieldEnded = false;
    let shieldSyncT = 0;
    let shieldView = { inv: 0, at: 0, cores: {} };
    let shieldFlash = {};
    let shieldSeenHit = {};

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
        let out = [];
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

    function maxLevel() {
        let v = MAX_LEVEL;
        try { v = Core.settings.getInt(KEY_MAXLV, MAX_LEVEL); } catch (err) {}
        if (!(v >= 1)) v = MAX_LEVEL;
        return Math.min(LIMIT_MAXLV, Math.floor(v));
    }

    function expPercent() {
        let v = DEFAULT_EXP;
        try { v = Core.settings.getInt(KEY_EXP, DEFAULT_EXP); } catch (err) {}
        if (!(v >= 0)) v = DEFAULT_EXP;
        return Math.min(LIMIT_EXP, v);
    }

    function maxBuilt() {
        let v = DEFAULT_BUILT;
        try { v = Core.settings.getInt(KEY_BUILT, DEFAULT_BUILT); } catch (err) {}
        if (!(v >= 0)) v = DEFAULT_BUILT;
        return Math.min(LIMIT_BUILT, Math.floor(v));
    }

    function multiTurretOn() {
        try { return Core.settings.getBool(KEY_MULTI, true); } catch (err) {}
        return true;
    }

    function shieldMinutes() {
        let v = DEFAULT_SHIELD_MIN;
        try { v = Core.settings.getInt(KEY_SHIELD, DEFAULT_SHIELD_MIN); } catch (err) {}
        if (!(v >= 0)) v = DEFAULT_SHIELD_MIN;
        return Math.min(LIMIT_SHIELD_MIN, Math.floor(v));
    }

    function newState() {
        return { lv: 1, exp: 0, pts: START_POINTS, u: 0, s: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], d: [], p: [], b: 0, k: 0, dk: 0 };
    }

    function getUid(pl) {
        try {
            let u = String(pl.uuid());
            if (u != null && u.length > 0) return u;
        } catch (err) {}
        return "id:" + pl.id;
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
    }

    function tierType(lv) {
        if (lv === 6) return UnitTypes.reign;
        if (lv === 7) return UnitTypes.disrupt;
        let list = [UnitTypes.merui, UnitTypes.cleroi, UnitTypes.anthicus, UnitTypes.tecta, UnitTypes.collaris];
        return list[Math.min(5, Math.max(1, lv)) - 1];
    }

    function isExtraTier(lv) {
        return lv === 6 || lv === 7;
    }

    function tierCap(lv) {
        return Math.min(5, Math.max(1, lv));
    }

    function activeTier(st) {
        let cap = tierCap(st.lv);
        if (st.lv < FREE_SWITCH_LEVEL) return cap;
        let u = st.u;
        if (!(u >= 1) || u > TIER_MAX) return cap;
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

    function addExp(pl, amount, quiet) {
        let st = bind(pl);
        if (st.lv >= maxLevel()) return;
        st.exp += amount;
        if (quiet !== true) notifyExp(pl, amount);
        let before = st.lv;
        let up = 0;
        while (st.lv < maxLevel() && st.exp >= expNeed(st.lv)) {
            st.exp -= expNeed(st.lv);
            st.lv++;
            st.pts++;
            up++;
        }
        if (st.lv >= maxLevel()) st.exp = 0;
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
            out[id] = [s.lv, Math.floor(s.exp), s.pts, s.s, s.d, s.u || 0, s.p, s.b || 0, s.k || 0, s.dk || 0];
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
                n[id] = { lv: a[0], exp: a[1], pts: a[2], s: a[3], d: a[4], u: a[5] || 0, p: pp, b: a[7] || 0, k: a[8] || 0, dk: a[9] || 0 };
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
            Vars.netClient.addPacketHandler(SHIELD_KIND, new Cons({
                get: function(content) { onShieldSync(content); }
            }));
            Vars.netClient.addPacketHandler(EXP_KIND, new Cons({
                get: function(content) { onExpPacket(content); }
            }));
            registered = true;
        } catch (err) {}
    }

    register();
    Events.on(ClientLoadEvent, new Cons({ get: function(e) { register(); } }));
    Events.on(ServerLoadEvent, new Cons({ get: function(e) { register(); } }));
    Events.on(WorldLoadEvent, new Cons({ get: function(e) { register(); } }));

    function droneBlock(id) {
        let b = null;
        if (id === "parallax" || id === "segment") b = Vars.content.getByName(ContentType.block, id); // dùng bản gốc: tự động kéo/chặn đạn
        if (b == null) b = Vars.content.getByName(ContentType.block, "newex-" + id);
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
            let d = { id: id, block: blk, cost: costOf(blk), equip: true, mount: NO_MOUNT[id] !== true, ov: {}, kind: turretKind(blk) };
            list.push(d);
            map[d.id] = d;
        }
        defsCache = { list: list, map: map };
        return defsCache;
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
        // pháo dùng chất lỏng làm đạn (tsunami, wave, sublimate...): đổ đầy loại lỏng đầu tiên trong ammo
        try {
            if (b.liquids == null) return;
            let lp = ammoPairs(blk);
            for (let i = 0; i < lp.length; i++) {
                if (lp[i].k instanceof Liquid) {
                    let room = (blk.liquidCapacity > 0 ? blk.liquidCapacity : 30) - b.liquids.currentAmount();
                    if (room > 0.1) b.liquids.add(lp[i].k, room);
                    break;
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

    // đạn + điện + chất làm mát vô hạn cho pháo xây
    function supplyTurret(b, def, tick, pl) {
        try { if (b.power != null) b.power.status = 1; } catch (err) {}
        try {
            let hr = def.block.heatRequirement;
            if (hr > 0) {
                let full = hr * Math.max(1, def.block.maxHeatEfficiency);
                b.heatReq = full;
                if (b.sideHeat != null) for (let h = 0; h < b.sideHeat.length; h++) b.sideHeat[h] = full;
            }
        } catch (err) {}
        let isT = def.block instanceof Turret;
        let low = isT && !hasAmmoSafe(b);
        if (!tick && !low) return;
        try { fillAmmo(b, def); } catch (err) {
            if (def.errLogged !== true) {
                def.errLogged = true;
                Log.err("[NexPvp] fillAmmo " + def.id + ": " + err);
            }
        }
        try { fillConsumers(b, def); } catch (err) {}
        if (isT && !hasAmmoSafe(b) && def.warned !== true) {
            def.warned = true;
            if (pl != null) toast(pl, "[scarlet]" + def.block.localizedName + tr(" không nhận được đạn tự động", " could not be auto-supplied"));
        }
    }

    function enemyCores(team) {
        let out = [];
        Groups.build.each(new Cons({
            get: function(b) {
                try { if (b.block instanceof CoreBlock && b.team != team && b.team != Team.derelict) out.push(b.tile); } catch (err) {}
            }
        }));
        return out;
    }

    // nửa map phe ta = những ô gần lõi ta hơn mọi lõi địch (đường chia đôi vuông góc giữa các lõi)
    function ourSide(core, ec, tx, ty) {
        let d0 = Mathf.dst2(tx, ty, core.tile.x, core.tile.y);
        for (let i = 0; i < ec.length; i++) {
            if (Mathf.dst2(tx, ty, ec[i].x, ec[i].y) <= d0) return false;
        }
        return true;
    }

    function spotFree(tx, ty, size, off) {
        for (let dx = 0; dx < size; dx++) {
            for (let dy = 0; dy < size; dy++) {
                let t = Vars.world.tile(tx - off + dx, ty - off + dy);
                if (t == null || t.solid() || t.build != null || t.floor().isDeep()) return false;
                if (BUILD_FLOOR.length > 0 && String(t.floor().name) !== BUILD_FLOOR) return false;
            }
        }
        return true;
    }

    // vị trí hợp lệ: toàn bộ nền dưới pháo là nền đặt lõi, còn trống, và nằm ở nửa map phe ta
    function canBuildAt(core, ec, blk, tx, ty) {
        let off = Math.floor((blk.size - 1) / 2);
        return ourSide(core, ec, tx, ty) && spotFree(tx, ty, blk.size, off);
    }

    function placeTurret(pl, def, tx, ty) {
        let core = pl.team().core();
        if (core == null) return -1;
        if (!canBuildAt(core, enemyCores(core.team), def.block, tx, ty)) return -1;
        let tile = Vars.world.tile(tx, ty);
        if (tile == null) return -1;
        tile.setNet(def.block, pl.team(), 0);
        let b = tile.build;
        if (b == null || b.block !== def.block) return -1;
        supplyTurret(b, def, true, pl);
        hostOwner[b.id] = pl.id; // đạn của pháo xây nhận chỉ số của chủ
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
        if (st.p.length !== st.d.length) return;
        let defs = droneDefs();
        for (let i = st.d.length - 1; i >= 0; i--) {
            let def = defs.map[st.d[i]];
            let pos = st.p[i];
            if (def == null) {
                if (tick && auth) {
                    let ob = droneBlock(st.d[i]);
                    let refund = ob != null ? costOf(ob) : 0;
                    if (pos >= 0) removeTurret(pos, ob != null ? { block: ob } : null);
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
                st.p[i] = IN_BAG; // pháo bị phá -> trở về túi đồ, có thể xây lại
                toast(pl, tr("[scarlet]Pháo bị phá hủy, đã trả về túi đồ: ", "[scarlet]Turret destroyed, returned to your bag: ") + def.block.localizedName);
                changed();
                continue;
            }
            let b = Vars.world.build(pos);
            if (b == null || b.block !== def.block) continue;
            supplyTurret(b, def, tick, auth ? pl : null);
            if (auth) preferEnemyPlayer(b, def);
        }
    }

    // Tìm unit do PLAYER phe địch điều khiển, trong tầm pháo (tôn trọng targetAir/targetGround/minRange)
    function findEnemyPlayerTarget(b, def, range) {
        let blk = def.block;
        let ta = fld(blk, "targetAir", true) !== false;
        let tg = fld(blk, "targetGround", true) !== false;
        let minR = fld(blk, "minRange", 0);
        let team = b.team;
        let best = null;
        let bd = 1e18;
        try {
            Groups.unit.each(new Cons({
                get: function(e) {
                    if (e == null || e.team == team || e.team == Team.derelict || e.dead || !e.isValid()) return;
                    let isPl = false;
                    try { isPl = e.isPlayer(); } catch (err0) {}
                    if (!isPl) return;
                    if (e.isFlying() ? !ta : !tg) return;
                    try { if (!e.targetable(team)) return; } catch (err1) {}
                    let d = Mathf.dst(b.x, b.y, e.x, e.y);
                    if (d - e.hitSize / 2 > range || d < minR) return;
                    if (d < bd) { bd = d; best = e; }
                }
            }));
        } catch (err) {
            logOnce("fept", "findEnemyPlayerTarget: " + err);
        }
        return best;
    }

    // Mỗi tick: nếu có player phe địch trong tầm, ép pháo XÂY nhắm bắn người đó trước, ưu tiên
    // hơn mục tiêu do AI gốc của pháo tự chọn (lính, unit AI...). Chỉ áp dụng cho pháo xây,
    // không ảnh hưởng tới pháo lắp lên unit (hệ thống "equip" riêng, xử lý ở mountFire/resolveAim).
    let playerPrioT = {};
    const PLAYER_PRIO_INTERVAL = 15; // đỡ tốn hiệu năng: không quét Groups.unit mỗi tick cho từng pháo xây

    function preferEnemyPlayer(b, def) {
        if (def.kind === "point") return; // phòng thủ điểm bắn hạ đạn địch, không áp dụng ưu tiên nhắm player
        try {
            let key = b.id;
            let left = playerPrioT[key];
            if (left === undefined) left = 0;
            left -= Time.delta;
            if (left > 0) {
                playerPrioT[key] = left;
                return;
            }
            playerPrioT[key] = PLAYER_PRIO_INTERVAL;
            let range = turretRange(def);
            let t = findEnemyPlayerTarget(b, def, range);
            if (t != null) b.target = t;
        } catch (err) {
            logOnce("prioplayer:" + def.id, "prioritize enemy player failed: " + err);
        }
    }

    let loadedBt = {};

    // Đạn tạo lúc chạy (copy/fallback) hoặc chưa được game load sẽ có backRegion = null -> crash khi vẽ
    function ensureLoaded(bt) {
        if (bt == null) return;
        try {
            if (loadedBt[bt.id] === true) return;
            loadedBt[bt.id] = true;
            if (bt.backRegion == null || bt.frontRegion == null) bt.load();
        } catch (err) {
            logOnce("ld:" + bt, "bullet load failed: " + err);
        }
        try { ensureLoaded(bt.fragBullet); } catch (err) {}
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
        ensureLoaded(bt);
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
        let multi = multiTurretOn();
        let seen = {};
        for (let i = 0; i < st.d.length; i++) {
            if (st.p[i] !== EQUIPPED) continue;
            let def = defs.map[st.d[i]];
            if (def == null || !def.equip || !def.mount) continue;
            if (!multi && seen[def.id] === true) continue;
            seen[def.id] = true;
            out.push(def);
        }
        return out;
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

    function turretCost(st, def) {
        return def.cost;
    }

    function turretSellValue(st, def) {
        return def.cost;
    }

    function ownedCount(st, id) {
        let c = 0;
        if (st == null) return 0;
        for (let i = 0; i < st.d.length; i++) {
            if (st.d[i] === id) c++;
        }
        return c;
    }

    function hpPower(pl, u) {
        let o = ownerOf(pl, u);
        if (o != null) return Math.max(1, o.maxHealth);
        let st = byId[pl.id];
        let s = st != null ? st.s : null;
        let t = st != null ? tierType(activeTier(st)) : null;
        let base = t != null ? t.health * (t === UnitTypes.reign ? REIGN_HP_MUL : 1) : 350;
        return s != null ? base * (1 + s[0] * HP_PCT / 100) + s[0] * HP_FLAT : base;
    }

    // ===== Pháo vanilla: dùng đúng chỉ số + cơ chế gốc của game =====
    function fld(o, k, d) {
        try {
            let v = o[k];
            if (v === undefined || v === null) return d;
            return v;
        } catch (err) {
            return d;
        }
    }

    function isA(o, getCls) {
        try { return o instanceof getCls(); } catch (err) { return false; }
    }
    function turretKind(blk) {
        if (isA(blk, function() { return TractorBeamTurret; })) return "tractor";
        if (isA(blk, function() { return PointDefenseTurret; })) return "point";
        if (isA(blk, function() { return LaserTurret; })) return "laser";
        if (isA(blk, function() { return ContinuousTurret; }) || isA(blk, function() { return ContinuousLiquidTurret; })) return "cont";
        let cn = className(blk);
        if (cn === "TractorBeamTurret") return "tractor";
        if (cn === "PointDefenseTurret") return "point";
        if (cn === "LaserTurret") return "laser";
        if (cn === "ContinuousTurret" || cn === "ContinuousLiquidTurret") return "cont";
        return "shoot";
    }

    // Các pháo trong danh sách này LUÔN tự động ngắm/bắn theo AI (findTarget, giới hạn đúng range
    // của pháo), bỏ qua hoàn toàn input ngắm bắn của player — giống cơ chế pháo parallax (tractor).
    // -> dùng để fix pháo lustre bắn full map khi player tự điều khiển.
    const FORCE_AUTO_AIM = { lustre: true };

    // Các pháo trong danh sách này chỉ cho XÂY, không cho LẮP lên unit player.
    const NO_MOUNT = { scathe: true };

    function turretRange(def) {
        let r = fld(def.block, "range", 0);
        if (!(r > 0)) r = 160;
        return r;
    }

    function ammoRange(def, bt) {
        let r = turretRange(def);
        if (bt != null) r += fld(bt, "rangeChange", 0);
        return r;
    }

    function mstate(key, u) {
        let s = mountSt[key];
        if (s === undefined) {
            let a = 0;
            try { a = u.rotation; } catch (err) {}
            s = { rel: 0, ang: a, q: 0, tgt: null, tt: 0, barrel: 0, b: null, life: 0, k: 0, n: 1, charge: 0, bLife: 0 };
            mountSt[key] = s;
        }
        return s;
    }

    function findFire(u, def, mp, range) {
        let blk = def.block;
        let isLiq = false;
        try { isLiq = (typeof LiquidTurret !== "undefined") && blk instanceof LiquidTurret; } catch (err) {}
        if (!isLiq || fld(blk, "extinguish", true) !== true) return null;
        let bt = equipBullet(def);
        try {
            let lq = bt.liquid;
            if (lq == null || !lq.canExtinguish()) return null;
        } catch (err) {
            return null;
        }
        let ts = Vars.tilesize;
        let r = Math.floor(range / ts);
        let cx = Math.round(mp.x / ts);
        let cy = Math.round(mp.y / ts);
        let best = null;
        let bd = 0;
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                let tile = Vars.world.tile(cx + dx, cy + dy);
                if (tile == null) continue;
                if (!Fires.has(tile.x, tile.y)) continue;
                let d2 = Mathf.dst2(mp.x, mp.y, tile.worldx(), tile.worldy());
                if (d2 > range * range) continue;
                if (tile.build != null && tile.team() != u.team) continue;
                if (best == null || d2 < bd) {
                    bd = d2;
                    best = { x: tile.worldx(), y: tile.worldy(), ft: true, tx: tile.x, ty: tile.y, vel: null, hitSize: 0 };
                }
            }
        }
        return best;
    }

    function findTarget(u, def, mp, range) {
        let blk = def.block;
        let ta = fld(blk, "targetAir", true) !== false;
        let tg = fld(blk, "targetGround", true) !== false;
        if (range === undefined) range = turretRange(def);
        let minR = fld(blk, "minRange", 0);
        let sorter = fld(blk, "unitSort", null);
        let team = u.team;
        let best = null;
        let bc = 1e18;
        try {
            Groups.unit.each(new Cons({
                get: function(e) {
                    if (e == null || e.team == team || e.team == Team.derelict || e.dead || !e.isValid()) return;
                    if (e.isFlying() ? !ta : !tg) return;
                    try { if (!e.targetable(team)) return; } catch (err0) {}
                    let d = Mathf.dst(mp.x, mp.y, e.x, e.y);
                    if (d - e.hitSize / 2 > range || d < minR) return;
                    let c = d;
                    if (sorter != null) {
                        try { c = sorter.cost(e, mp.x, mp.y); } catch (err1) { c = d; }
                    }
                    if (c < bc) {
                        bc = c;
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

    function targetValid(t, u, def, mp, range) {
        if (t == null) return false;
        try {
            if (t.ft === true) return Fires.has(t.tx, t.ty) && Mathf.dst(mp.x, mp.y, t.x, t.y) <= range;
            if (t.team == u.team || t.team == Team.derelict || !t.isValid()) return false;
            if (t.dead === true) return false;
            let blk = def.block;
            let ta = fld(blk, "targetAir", true) !== false;
            let tg = fld(blk, "targetGround", true) !== false;
            let d = Mathf.dst(mp.x, mp.y, t.x, t.y);
            if (typeof t.isFlying === "function") {
                if (t.isFlying() ? !ta : !tg) return false;
                return d - t.hitSize / 2 <= range && d >= fld(blk, "minRange", 0);
            }
            if (!tg) return false;
            return d - t.block.size * Vars.tilesize / 2 <= range;
        } catch (err) {
            return false;
        }
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

    // Giống Turret.updateTile: chọn mục tiêu theo targetInterval, xoay bằng rotateSpeed, chỉ bắn khi trong shootCone
    function resolveAim(u, def, mp, ast, stt, bt, range) {
        if (ast.shoot && !FORCE_AUTO_AIM[def.id]) return { tx: ast.x, ty: ast.y, t: null };
        let blk = def.block;
        if (!targetValid(stt.tgt, u, def, mp, range)) stt.tgt = null;
        stt.tt -= Time.delta;
        if (stt.tt <= 0) {
            let iv = fld(blk, "targetInterval", 20);
            if (stt.tgt == null) {
                let niv = fld(blk, "newTargetInterval", -1);
                if (niv > 0) iv = niv;
            }
            stt.tt = iv;
            let nt = null;
            try { if (Groups.fire.size() > 0) nt = findFire(u, def, mp, range); } catch (err) {}
            if (nt == null) nt = findTarget(u, def, mp, range);
            stt.tgt = nt;
        }
        let t = stt.tgt;
        if (t == null) return null;
        let tx = t.x;
        let ty = t.y;
        if (bt != null && fld(blk, "predictTarget", true) !== false) {
            let lp = leadPos(mp, t, bt);
            tx = lp.x;
            ty = lp.y;
        }
        return { tx: tx, ty: ty, t: t };
    }

    function muzzle(u, blk, mp, rot) {
        let off = mp.w === true ? 0 : Math.min(blk.size * Vars.tilesize * 0.5, u.hitSize * 0.5);
        return { x: mp.x + Mathf.cosDeg(rot) * off, y: mp.y + Mathf.sinDeg(rot) * off };
    }

    // Giống Turret.shoot()/bullet(): dùng ShootPattern của pháo (số đạn, delay, spread, helix...), inaccuracy, velocityRnd, scaleLife
    function fireTurret(u, def, bt, stt, tx, ty, onBullet) {
        let blk = def.block;
        let own = u.isCoreHost === true ? u.build : u;
        let pat = fld(blk, "shoot", null);
        let inacc = fld(blk, "inaccuracy", 0) + fld(bt, "inaccuracy", 0);
        let vrnd = fld(blk, "velocityRnd", 0);
        let minR = fld(blk, "minRange", 0);
        let rng = ammoRange(def, bt);
        ensureLoaded(bt);

        let spawn = function(xo, yo, ao, mover) {
            stt.q = Math.max(0, stt.q - 1);
            try {
                if (u.isCoreHost !== true && (!u.isValid() || u.dead)) return;
                let mp = mountPos(u, stt.k, stt.n);
                let rot = stt.ang;
                let mz = muzzle(u, blk, mp, rot);
                let bx = mz.x + Angles.trnsx(rot - 90, xo, yo);
                let by = mz.y + Angles.trnsy(rot - 90, xo, yo);
                let a = rot + ao + (Math.random() * 2 - 1) * inacc;
                let ls = 1;
                try {
                    if (bt.scaleLife === true) {
                        let br = bt.range > 0 ? bt.range : bt.speed * bt.lifetime;
                        if (br > 0) ls = Math.max(minR / br, Math.min(rng / br, Mathf.dst(bx, by, tx, ty) / br));
                    }
                } catch (err) {}
                let vs = (1 - vrnd) + Math.random() * vrnd;
                let blt = null;
                try {
                    blt = bt.create(own, u.team, bx, by, a, -1, vs, ls, null, mover, tx, ty);
                } catch (err) {
                    try {
                        blt = bt.create(own, u.team, bx, by, a, -1, vs, ls);
                    } catch (err2) {
                        try {
                            blt = bt.create(own, u.team, bx, by, a);
                        } catch (err3) {
                            logOnce("create:" + def.id, "bullet create failed for " + def.id + ": " + err3);
                        }
                    }
                }
                if (blt != null && onBullet != null) onBullet(blt);
                if (!Vars.headless) {
                    try {
                        let se = fld(blk, "shootEffect", null);
                        if (se == null) se = bt.shootEffect;
                        se.at(bx, by, rot + ao, bt.hitColor);
                    } catch (err) {}
                    try { bt.smokeEffect.at(bx, by, rot + ao, bt.hitColor); } catch (err) {}
                    try {
                        let p0 = fld(blk, "soundPitchMin", 0.9);
                        let p1 = fld(blk, "soundPitchMax", 1.1);
                        blk.shootSound.at(bx, by, p0 + Math.random() * (p1 - p0));
                    } catch (err) {}
                }
            } catch (err) {
                logOnce("spawn:" + def.id, "shot failed for " + def.id + ": " + err);
            }
        };

        let delayed = fld(pat, "firstShotDelay", 0) > 0;
        if (!Vars.headless && delayed) {
            try {
                let mp0 = mountPos(u, stt.k, stt.n);
                try { blk.chargeSound.at(mp0.x, mp0.y, 1); } catch (err) {}
                try { bt.chargeEffect.at(mp0.x, mp0.y, stt.ang); } catch (err) {}
            } catch (err) {}
        }

        let handler = null;
        try {
            let H = Packages.mindustry.entities.pattern.ShootPattern$BulletHandler;
            handler = new H({
                shoot: function(xo, yo, ao, delay, mover) {
                    stt.q++;
                    if (delay > 0) {
                        Time.run(delay, new Runnable({ run: function() { spawn(xo, yo, ao, mover); } }));
                    } else {
                        spawn(xo, yo, ao, mover);
                    }
                }
            });
        } catch (err) {
            handler = null;
        }
        let done = false;
        if (handler != null && pat != null) {
            try {
                try {
                    pat.shoot(stt.barrel, handler, new Runnable({ run: function() { stt.barrel++; } }));
                } catch (err5) {
                    pat.shoot(stt.barrel, handler);
                }
                done = true;
            } catch (err4) {
                logOnce("pat:" + def.id, "shoot pattern failed for " + def.id + ": " + err4);
            }
        }
        if (!done) {
            let shots = 1;
            let spread = 0;
            try {
                shots = Math.min(12, Math.max(1, pat.shots));
                if (className(pat) === "ShootSpread") spread = pat.spread;
            } catch (err) {}
            for (let s = 0; s < shots; s++) {
                stt.q++;
                spawn(0, 0, (s - (shots - 1) / 2) * spread, null);
            }
        }
        logOnce("fired:" + def.id, "equip turret fired: " + def.id, true);
    }

    // ItemTurret / PowerTurret / LiquidTurret
    function shootTurret(u, def, mp, ast, stt, key) {
        let blk = def.block;
        let bt = equipBullet(def);
        if (bt == null) {
            logOnce("nobt:" + def.id, "no bullet type found for equipped turret " + def.id);
            return;
        }
        let reload = Math.max(1, fld(blk, "reload", 20));
        stt.rel = Math.min(reload, stt.rel + Time.delta * Math.max(0.1, u.reloadMultiplier) * fld(bt, "reloadMultiplier", 1));
        let range = ammoRange(def, bt);
        let aim = resolveAim(u, def, mp, ast, stt, bt, range);
        if (aim == null) {
            equipAng[key] = stt.ang;
            return;
        }
        let want = Angles.angle(mp.x, mp.y, aim.tx, aim.ty);
        stt.ang = Angles.moveToward(stt.ang, want, fld(blk, "rotateSpeed", 5) * Time.delta);
        equipAng[key] = stt.ang;
        if (stt.q > 0 && fld(fld(blk, "shoot", null), "firstShotDelay", 0) > 0) return;
        if (Angles.angleDist(stt.ang, want) < fld(blk, "shootCone", 8) && stt.rel >= reload) {
            fireTurret(u, def, bt, stt, aim.tx, aim.ty, null);
            stt.rel = stt.rel % reload;
        }
    }

    // LaserTurret (meltdown) và ContinuousTurret / ContinuousLiquidTurret (lustre, sublimate)
    function contTurret(u, def, mp, ast, stt, key, laser) {
        let blk = def.block;
        let bt = equipBullet(def);
        if (bt == null) {
            logOnce("nobt:" + def.id, "no bullet type found for equipped turret " + def.id);
            return;
        }
        let reload = Math.max(1, fld(blk, "reload", 20));
        let range = ammoRange(def, bt);
        let eff = Math.max(0.1, u.reloadMultiplier);
        let b = stt.b;
        let alive = false;
        if (b != null) {
            try { alive = b.isAdded() && b.type != null; } catch (err) { alive = false; }
            if (!alive) {
                stt.b = null;
                if (laser) stt.rel = reload;
            }
        }
        if (laser && !alive && stt.rel > 0) stt.rel -= Time.delta * eff;
        let aim = resolveAim(u, def, mp, ast, stt, bt, range);
        let want = stt.ang;
        let rs = fld(blk, "rotateSpeed", 5) * Time.delta;
        if (laser && alive) rs *= fld(blk, "firingMoveFract", 0.25);
        if (aim != null) {
            want = Angles.angle(mp.x, mp.y, aim.tx, aim.ty);
            stt.ang = Angles.moveToward(stt.ang, want, rs);
        }
        equipAng[key] = stt.ang;

        if (alive) {
            // Tia đang bắn: ép lifetime của đạn dài ra ngay lúc tạo (bên dưới) để engine không
            // tự huỷ đạn giữa chừng (đó là nguyên nhân gây "giật/bắn rời" khi lắp lên unit).
            // Việc kết thúc tia do CHÍNH ta quyết định (stt.life hoặc mất mục tiêu), không phụ
            // thuộc thời điểm Trigger.update chạy trước/sau update nội bộ của đạn.
            let keep = aim != null;
            if (laser) {
                stt.life -= Time.delta;
                keep = stt.life > 0;
            }
            let mz = muzzle(u, blk, mp, stt.ang);
            try {
                b.rotation(stt.ang);
                b.set(mz.x, mz.y);
                if (aim != null) {
                    b.aimX = aim.tx;
                    b.aimY = aim.ty;
                }
                if (keep) {
                    let base = stt.bLife > 0 ? stt.bLife : fld(bt, "lifetime", 100);
                    b.time = base * fld(b.type, "optimalLifeFract", 0.5);
                }
            } catch (err) {}
            if (!keep) {
                try { b.remove(); } catch (err) {}
                stt.b = null;
                stt.bLife = 0;
                if (laser) stt.rel = reload;
            }
            return;
        }

        if (aim == null) return;
        if (laser && stt.rel > 0) return;
        if (stt.q > 0) return;
        if (Angles.angleDist(stt.ang, want) >= fld(blk, "shootCone", 8)) return;

        fireTurret(u, def, bt, stt, aim.tx, aim.ty, function(blt) {
            stt.b = blt;
            stt.life = fld(blk, "shootDuration", 100);
            try {
                stt.bLife = blt.lifetime;
            } catch (err) {
                stt.bLife = fld(bt, "lifetime", 100);
            }
        });
    }

    // TractorBeamTurret (parallax)
    function tractorTurret(u, def, mp, stt, key) {
        let blk = def.block;
        let range = turretRange(def);
        let eff = Math.max(0.1, u.reloadMultiplier);
        if (!targetValid(stt.tgt, u, def, mp, range)) stt.tgt = null;
        stt.tt -= Time.delta;
        if (stt.tt <= 0) {
            stt.tt = fld(blk, "retargetTime", 5);
            stt.tgt = findTarget(u, def, mp, range);
        }
        let t = stt.tgt;
        if (t == null || typeof t.isFlying !== "function") {
            delete equipBeam[key];
            return;
        }
        let dest = Angles.angle(mp.x, mp.y, t.x, t.y);
        stt.ang = Angles.moveToward(stt.ang, dest, fld(blk, "rotateSpeed", 10) * Time.delta * eff);
        equipAng[key] = stt.ang;
        equipBeam[key] = { x: t.x, y: t.y };
        if (Angles.angleDist(stt.ang, dest) >= fld(blk, "shootCone", 6)) return;
        let dmg = fld(blk, "damage", 0);
        if (dmg > 0) {
            try { t.damageContinuous(dmg * eff); } catch (err) {
                try { t.damage(dmg * eff * Time.delta); } catch (err2) {}
            }
        }
        try {
            let st2 = fld(blk, "status", null);
            if (st2 != null && st2 !== StatusEffects.none) t.apply(st2, fld(blk, "statusDuration", 300));
        } catch (err) {}
        try {
            let dx = mp.x - t.x;
            let dy = mp.y - t.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.01) {
                let f = (fld(blk, "force", 12) + (1 - dist / range) * fld(blk, "scaledForce", 6)) * Time.delta * eff;
                let mag = Math.min(dist, f);
                t.impulse(dx / dist * mag, dy / dist * mag);
            }
        } catch (err) {}
    }

    // PointDefenseTurret (segment): bắn hạ đạn địch
    function pointTurret(u, def, mp, stt, key) {
        let blk = def.block;
        let range = turretRange(def);
        let reload = Math.max(1, fld(blk, "reload", 8));
        let eff = Math.max(0.1, u.reloadMultiplier);
        let team = u.team;
        let t = stt.tgt;
        if (t != null) {
            try {
                if (!t.isAdded() || t.team == team || !t.type.hittable || Mathf.dst(mp.x, mp.y, t.x, t.y) > range + t.hitSize / 2) t = null;
            } catch (err) { t = null; }
            stt.tgt = t;
        }
        stt.tt -= Time.delta;
        if (stt.tt <= 0) {
            stt.tt = fld(blk, "retargetTime", 5);
            let best = null;
            let bd = 1e18;
            try {
                Groups.bullet.each(new Cons({
                    get: function(bl) {
                        if (bl == null || bl.team == team || !bl.isAdded()) return;
                        try { if (!bl.type.hittable) return; } catch (err0) { return; }
                        let d2 = Mathf.dst2(mp.x, mp.y, bl.x, bl.y);
                        let lim = range + bl.hitSize / 2;
                        if (d2 > lim * lim) return;
                        if (d2 < bd) {
                            bd = d2;
                            best = bl;
                        }
                    }
                }));
            } catch (err) {}
            stt.tgt = best;
            t = best;
        }
        if (t == null) {
            equipAng[key] = stt.ang;
            return;
        }
        let dest = Angles.angle(mp.x, mp.y, t.x, t.y);
        stt.ang = Angles.moveToward(stt.ang, dest, fld(blk, "rotateSpeed", 20) * Time.delta);
        equipAng[key] = stt.ang;
        stt.rel += Time.delta * eff;
        if (Angles.angleDist(stt.ang, dest) < fld(blk, "shootCone", 8) && stt.rel >= reload) {
            let bdmg = fld(blk, "bulletDamage", 30);
            try {
                if (t.damage > bdmg) t.damage = t.damage - bdmg;
                else t.remove();
            } catch (err) {
                try { t.remove(); } catch (err2) {}
            }
            if (!Vars.headless) {
                try {
                    let sl = fld(blk, "shootLength", 5);
                    let sx = mp.x + Angles.trnsx(stt.ang, sl);
                    let sy = mp.y + Angles.trnsy(stt.ang, sl);
                    let col = fld(blk, "color", Color.white);
                    try { blk.beamEffect.at(sx, sy, stt.ang, col, new Packages.arc.math.geom.Vec2(t.x, t.y)); } catch (err) {}
                    try { blk.shootEffect.at(sx, sy, stt.ang, col); } catch (err) {}
                    try { blk.hitEffect.at(t.x, t.y, col); } catch (err) {}
                    try { blk.shootSound.at(sx, sy, 0.9 + Math.random() * 0.2); } catch (err) {}
                } catch (err) {}
            }
            stt.rel = 0;
        }
    }

    function mountFire(pl, list, u, pfx) {
        let n = list.length;
        if (n === 0) return;
        let ast = null;
        if (u.isCoreHost === true && u.build != null) hostOwner[u.build.id] = pl.id;
        for (let k = 0; k < n; k++) {
            let def = list[k];
            let key = pl.id + ":" + pfx + k + ":" + def.id;
            let mp = mountPos(u, k, n);
            let stt = mstate(key, u);
            stt.k = k;
            stt.n = n;
            if (ast == null) ast = hostAim(u, pl);
            try {
                if (def.kind === "tractor") tractorTurret(u, def, mp, stt, key);
                else if (def.kind === "point") pointTurret(u, def, mp, stt, key);
                else if (def.kind === "laser") contTurret(u, def, mp, ast, stt, key, true);
                else if (def.kind === "cont") contTurret(u, def, mp, ast, stt, key, false);
                else shootTurret(u, def, mp, ast, stt, key);
            } catch (err) {
                logOnce("mf:" + def.id, "mount update failed for " + def.id + ": " + err);
            }
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
        if (st == null || !(st.s[11] > 0)) return;
        try {
            let dx = e.x - fx;
            let dy = e.y - fy;
            let d = Math.sqrt(dx * dx + dy * dy);
            if (d < 0.01) return;
            let f = st.s[11] * KNOCK_PER * 80;
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
                ensureLoaded(c);
            } catch (err) {
                c = null;
            }
            knockCache[key] = c;
        }
        return c;
    }

    const eachEquip = new Cons({
        get: function(pl) {
            let st = byId[pl.id];
            if (st == null || st.d.length === 0 || st.p.length !== st.d.length) return;
            let defs = droneDefs();
            let u = pl.unit();
            if (u != null && u.isValid() && !u.dead) mountFire(pl, equipList(st, defs), u, "u");
        }
    });


    const eachDrawEquip = new Cons({
        get: function(pl) {
            let st = byId[pl.id];
            if (st == null || st.d.length === 0 || st.p.length !== st.d.length) return;
            let u = pl.unit();
            if (u != null && u.isValid()) drawMounts(pl, u, equipList(st, droneDefs()), "u");
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
                let mp = mountPos(u, k, n);
                if (def.kind === "tractor") {
                    let bp = equipBeam[key];
                    if (bp != null) {
                        let ok = false;
                        try {
                            let lr = blk.laser;
                            let le = blk.laserEnd;
                            if (lr != null && le != null && lr.found() && le.found()) {
                                Draw.z(Layer.flyingUnit + 1);
                                Draw.mixcol(blk.laserColor, 0.5);
                                Drawf.laser(lr, le, mp.x, mp.y, bp.x, bp.y, blk.laserWidth);
                                Draw.mixcol();
                                ok = true;
                            }
                        } catch (err) { Draw.reset(); }
                        if (!ok) {
                            try {
                                Draw.z(Layer.flyingUnit + 1);
                                Draw.color(Pal.lancerLaser);
                                Lines.stroke(3 * scl);
                                Lines.line(mp.x, mp.y, bp.x, bp.y);
                                Draw.reset();
                            } catch (err) {}
                        }
                    }
                }
                if (u.isCoreHost !== true) continue;
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
                            drawBuildPreview();
                            drawCoreShields();
                            Draw.reset();
                        } catch (err) {}
                    }
                }));
            }
        } catch (err) {}
    }

    // ===== Khiên lõi: bất tử đầu trận -> khiên hấp thụ SHIELD_HP =====
    function invulTicksLeft() {
        if (Vars.net.client()) {
            let l = shieldView.inv - (Time.time - shieldView.at);
            return l > 0 ? l : 0;
        }
        if (shieldMinT <= 0) {
            shieldMinCache = shieldMinutes();
            shieldMinT = 120;
        }
        if (shieldMinCache >= LIMIT_SHIELD_MIN) return SHIELD_FOREVER_TICKS;
        let left = shieldMinCache * 3600 - matchT;
        return left > 0 ? left : 0;
    }

    function fmtTicks(t) {
        if (t >= SHIELD_FOREVER_TICKS / 2) return "\u221e";
        let sec = Math.ceil(t / 60);
        let m = Math.floor(sec / 60);
        let r = sec % 60;
        return m + ":" + (r < 10 ? "0" : "") + r;
    }

    function shieldRadius(cb) {
        return cb.block.size * 7 + 10;
    }

    function shieldRec(id) {
        let r = coreShield[id];
        if (r === undefined) {
            r = { hp: SHIELD_HP, broken: false, hitN: 0, b: null, base: 0, pre: 0, inv: false, syncAt: -100, seen: 0 };
            coreShield[id] = r;
        }
        return r;
    }

    function shieldProtectedByReflect(cb) {
        try {
            return global.NexReflect != null && global.NexReflect.isProtected(cb) === true;
        } catch (err) {}
        return false;
    }

    function syncCore(cb, r) {
        if (!Vars.net.server()) return;
        if (Time.time - r.syncAt < 6 && Time.time >= r.syncAt) return;
        r.syncAt = Time.time;
        try { Call.tileDamage(cb, cb.health); } catch (err) {}
    }

    function sendShield(left) {
        if (!Vars.net.server()) return;
        let arr = [];
        for (let id in coreShield) {
            let r = coreShield[id];
            arr.push([parseInt(id), Math.round(r.hp), r.broken ? 1 : 0, r.hitN]);
        }
        try { Call.clientPacketUnreliable(SHIELD_KIND, JSON.stringify({ i: Math.round(left), c: arr })); } catch (err) {}
    }

    function onShieldSync(content) {
        try {
            let o = JSON.parse(String(content));
            let cs = {};
            for (let i = 0; i < o.c.length; i++) {
                let a = o.c[i];
                cs[a[0]] = { hp: a[1], broken: a[2] === 1, hitN: a[3] };
            }
            shieldView = { inv: o.i, at: Time.time, cores: cs };
        } catch (err) {}
    }

    function shieldBreakFx(cb) {
        try { Call.effect(Fx.shieldBreak, cb.x, cb.y, shieldRadius(cb), SHIELD_COLOR); } catch (err) {}
        try {
            Groups.player.each(new Cons({
                get: function(pl) {
                    if (pl.team() == cb.team) toast(pl, tr("[scarlet]Khiên lõi đã vỡ!", "[scarlet]Core shield broken!"));
                }
            }));
        } catch (err) {}
        shieldSyncT = 0;
    }

    function shieldBefore() {
        shieldRecs.length = 0;
        if (Vars.net.client() || !isActive() || Vars.state.gameOver) return;
        matchT += Time.delta;
        shieldMinT -= Time.delta;
        shieldStamp++;
        let left = invulTicksLeft();
        let inv = left > 0;
        if (inv) {
            shieldEnded = false;
        } else if (!shieldEnded) {
            shieldEnded = true;
            if (shieldMinCache > 0) {
                try {
                    if (global.NexNet != null) {
                        global.NexNet.toastAll(tr("[accent]Khiên bất tử của lõi đã hết! Chuyển sang khiên hấp thụ " + SHIELD_HP + " sát thương.",
                            "[accent]Core invincible shield ended! Now an absorb shield of " + SHIELD_HP + " damage."), 5);
                    }
                } catch (err) {}
            }
        }
        let tl = pvpTeams();
        for (let i = 0; i < tl.length; i++) {
            let cores = tl[i].cores();
            for (let j = 0; j < cores.size; j++) {
                let cb = cores.get(j);
                if (cb == null || !cb.isValid()) continue;
                let r = shieldRec(cb.id);
                r.seen = shieldStamp;
                if (inv && cb.health < cb.maxHealth) cb.health = cb.maxHealth;
                if (!inv && (r.broken || r.hp <= 0)) continue;
                if (shieldProtectedByReflect(cb)) continue;
                r.b = cb;
                r.base = cb.health;
                r.inv = inv;
                r.pre = cb.health + (inv ? SHIELD_BUFFER : r.hp);
                cb.health = r.pre;
                shieldRecs.push(r);
            }
        }
        shieldSyncT -= Time.delta;
        if (shieldSyncT <= 0) {
            shieldSyncT = SHIELD_SYNC_TICKS;
            for (let id in coreShield) {
                if (coreShield[id].seen !== shieldStamp) delete coreShield[id];
            }
            sendShield(left);
        }
    }

    function shieldAfter() {
        let n = shieldRecs.length;
        for (let i = 0; i < n; i++) {
            let r = shieldRecs[i];
            let cb = r.b;
            r.b = null;
            if (cb == null || !cb.isValid()) continue;
            let loss = r.pre - cb.health;
            if (loss <= 0.001) {
                cb.health = r.base;
                continue;
            }
            r.hitN++;
            if (r.inv) {
                cb.health = r.base;
                syncCore(cb, r);
                continue;
            }
            let paid = Math.min(loss, r.hp);
            r.hp -= paid;
            let rest = loss - paid;
            if (r.hp <= 0.001) {
                r.hp = 0;
                if (!r.broken) {
                    r.broken = true;
                    shieldBreakFx(cb);
                }
            }
            if (rest > 0.001) {
                let hp = r.base - rest;
                if (hp > 0) {
                    cb.health = hp;
                    syncCore(cb, r);
                } else {
                    cb.health = 0;
                    try { cb.kill(); } catch (err) {}
                }
            } else {
                cb.health = r.base;
                syncCore(cb, r);
            }
        }
        shieldRecs.length = 0;
    }

    if (Trigger.beforeGameUpdate !== undefined && Trigger.afterGameUpdate !== undefined) {
        Events.run(Trigger.beforeGameUpdate, new Runnable({
            run: function() {
                try { shieldBefore(); } catch (err) { logOnce("shb", "core shield (before): " + err); }
            }
        }));
        Events.run(Trigger.afterGameUpdate, new Runnable({
            run: function() {
                try { shieldAfter(); } catch (err) { logOnce("sha", "core shield (after): " + err); }
            }
        }));
    } else {
        Log.err("[NexPvp] Trigger.beforeGameUpdate/afterGameUpdate not found: core shield disabled");
    }

    function camVisible(x, y, r) {
        let cam = Core.camera;
        if (cam == null) return true;
        let hw = cam.width / 2 + r;
        let hh = cam.height / 2 + r;
        return Math.abs(x - cam.position.x) <= hw && Math.abs(y - cam.position.y) <= hh;
    }

    function shieldInfo(id) {
        if (!Vars.net.client()) {
            let r = coreShield[id];
            return r === undefined ? null : r;
        }
        let c = shieldView.cores[id];
        return c === undefined ? null : c;
    }

    function drawCoreShields() {
        let inv = invulTicksLeft() > 0;
        let tl = pvpTeams();
        let T = Time.time;
        for (let i = 0; i < tl.length; i++) {
            let cores = tl[i].cores();
            for (let j = 0; j < cores.size; j++) {
                let cb = cores.get(j);
                if (cb == null || !cb.isValid()) continue;
                let info = shieldInfo(cb.id);
                if (!inv && info != null && (info.broken || info.hp <= 0)) continue;
                if (!inv && info == null && Vars.net.client()) continue;
                let R = shieldRadius(cb);
                if (!camVisible(cb.x, cb.y, R + 16)) continue;

                let hn = info != null ? info.hitN : 0;
                let seen = shieldSeenHit[cb.id];
                if (seen === undefined) seen = hn;
                if (hn !== seen) shieldFlash[cb.id] = 25;
                shieldSeenHit[cb.id] = hn;
                let ft = shieldFlash[cb.id];
                ft = ft === undefined ? 0 : Math.max(0, ft - Time.delta);
                shieldFlash[cb.id] = ft;
                let hf = ft / 25;
                let hit = hf > 0;
                let col = inv ? SHIELD_GOLD : SHIELD_COLOR;
                let pulse = inv ? 0.5 + 0.5 * Math.sin(T * 0.06) : 0;
                try {
                    Draw.z(Layer.shields);
                    Draw.color(hit ? SHIELD_GLOW : col, 0.08 + hf * 0.25 + pulse * 0.07);
                    Fill.poly(cb.x, cb.y, 6, R);
                    Lines.stroke(hit ? 2.8 : 1.5);
                    Draw.color(hit ? Color.white : col, 0.8 + hf * 0.2);
                    Lines.poly(cb.x, cb.y, 6, R);
                    Draw.color(SHIELD_GLOW, 0.5 + hf * 0.5);
                    Lines.stroke(1.0);
                    Lines.poly(cb.x, cb.y, 6, R - 3);
                    if (hit) {
                        Draw.color(SHIELD_GLOW, hf);
                        let inner = R * 0.65;
                        Lines.poly(cb.x, cb.y, 6, inner);
                        for (let q = 0; q < 6; q++) {
                            Lines.line(
                                cb.x + Mathf.cosDeg(q * 60) * inner,
                                cb.y + Mathf.sinDeg(q * 60) * inner,
                                cb.x + Mathf.cosDeg((q + 1) * 60) * R,
                                cb.y + Mathf.sinDeg((q + 1) * 60) * R
                            );
                        }
                    }
                    Draw.reset();
                } catch (err) {
                    Draw.reset();
                }
            }
        }
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

    function statsStateOf(unit) {
        let p = null;
        try { p = unit.getPlayer(); } catch (err) {}
        if (p != null) return byId[p.id];
        let pid = soldierOwner[unit.id];
        return pid !== undefined ? byId[pid] : null;
    }

    function applyStats(unit) {
        if (!isActive()) return;
        let s = statsOf(unit);
        if (s == null) return;
        let rc = roleCounts(statsStateOf(unit));

        let isPl = false;
        try { isPl = unit.isPlayer(); } catch (err) {}
        let tHp = unit.type.health;
        if (isPl && unit.type === UnitTypes.reign) tHp *= REIGN_HP_MUL;
        let hpT = (tHp * (1 + s[0] * HP_PCT / 100) + s[0] * HP_FLAT) * (1 + Math.min(ROLE_HP_MAX, rc.brl * ROLE_HP_PCT) / 100);
        if (Math.abs(unit.maxHealth - hpT) > 0.5) {
            let diff = hpT - unit.maxHealth;
            unit.maxHealth = hpT;
            if (diff > 0) unit.health += diff;
            else if (unit.health > hpT) unit.health = hpT;
        }

        unit.armor = (unit.type.armor + s[1] * ARM_FLAT) * (1 + rc.def * ROLE_ARM_PCT / 100) + rc.def * ROLE_ARM_FLAT;
        let cut = Math.min(ROLE_CUT_CAP, armorCut(s[1]) + rc.def * ROLE_CUT_PCT);
        if (cut > 0) unit.healthMultiplier *= 1 / (1 - cut / 100);

        let dm = (1 + s[2] * ATK_PCT / 100) * (1 + Math.min(ROLE_ATK_MAX, rc.atk * ROLE_ATK_PCT) / 100);
        if (s[5] > 0 && Math.random() < s[5] * 0.02) dm *= 1.5 + s[6] * 0.12;
        unit.damageMultiplier *= dm;
        let base = Math.max(0.1, unit.type.speed);
        unit.speedMultiplier *= (1 + s[3] * SPD_PCT / 100) * (1 + s[3] * SPD_FLAT / base);
        if (isPl && unit.type === UnitTypes.disrupt) unit.speedMultiplier *= DISRUPT_SPEED_MUL;
        unit.reloadMultiplier *= 1 + s[4] * 0.06;
        if (s[8] > 0 && !Vars.net.client() && unit.health > 0 && unit.health < unit.maxHealth * REGEN_THRESHOLD) {
            unit.health = Math.min(unit.maxHealth, unit.health + unit.maxHealth * s[8] * REGEN_PCT / 100 * Time.delta / 60);
        }
        if (s[9] > 0) unit.damageMultiplier *= 1 + s[9] * DMG_PER_HP * unit.health;
        if (s[10] > 0) unit.damageMultiplier *= 1 + s[10] * DMG_PER_ARMOR * unit.armor;
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

    const spawnGuardStatus = extend(StatusEffect, "pvp-spawn-guard", {});
    spawnGuardStatus.healthMultiplier = 1 / (1 - SPAWN_GUARD_DAMAGE_CUT / 100);
    spawnGuardStatus.permanent = false;
    spawnGuardStatus.show = true;
    try { spawnGuardStatus.color = Color.valueOf("7fd8ff"); } catch (err) {}

    const spawnRageStatus = extend(StatusEffect, "pvp-spawn-rage", {});
    spawnRageStatus.permanent = false;
    spawnRageStatus.show = true;
    try { spawnRageStatus.color = Color.valueOf("ff5a5a"); } catch (err) {}

    function spawnLeft(pid, dur) {
        let t = spawnBuff[pid];
        if (t === undefined) return 0;
        return dur - (Time.time - t);
    }

    function hasEquipped(st) {
        if (st == null || st.d.length === 0 || st.p.length !== st.d.length) return false;
        let defs = droneDefs();
        for (let i = 0; i < st.d.length; i++) {
            if (st.p[i] === EQUIPPED && defs.map[st.d[i]] != null && defs.map[st.d[i]].equip && defs.map[st.d[i]].mount) return true;
        }
        return false;
    }

    function pierceType(t) {
        let c = pierceCache[t.id];
        if (c === undefined) {
            try {
                c = t.copy();
                c.pierceArmor = true;
                ensureLoaded(c);
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
            if (s[11] > 0) {
                let kt = knockType(b.type, s[11]);
                if (kt != null) {
                    try { b.type = kt; } catch (err) {}
                }
            }
        }
    });

    function anyBulletStat() {
        for (let id in byId) {
            let s = byId[id].s;
            if (s[2] > 0 || s[7] > 0 || s[11] > 0) return true;
        }
        return false;
    }

    function coreSpawnPos(pl, type) {
        return corePosOf(pl.team().core(), type);
    }

    function corePosOf(core, type) {
        if (core == null) return null;
        let cx = Vars.world.width() * Vars.tilesize / 2;
        let cy = Vars.world.height() * Vars.tilesize / 2;
        let a = Angles.angle(core.x, core.y, cx, cy) + (Math.random() - 0.5) * 80;
        let r = core.block.size * Vars.tilesize / 2 + 28 + type.hitSize / 2;
        return { x: core.x + Mathf.cosDeg(a) * r, y: core.y + Mathf.sinDeg(a) * r, rot: a };
    }

    function swapUnit(pl, old, want) {
        let fromTier = false;
        for (let lv = 1; lv <= TIER_MAX; lv++) {
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
        prevUnit[pl.id] = nu;
        spawnFx(x, y);
    }

    function onCoreZone(unit) {
        if (BUILD_FLOOR.length === 0) return true;
        try {
            let t = unit.tileOn();
            return t != null && String(t.floor().name) === BUILD_FLOOR;
        } catch (err) {}
        return false;
    }

    function canReturnCore(pv, core) {
        if (!onCoreZone(pv)) return false;
        try { return ourSide(core, enemyCores(core.team), pv.tileX(), pv.tileY()); } catch (err) {}
        return false;
    }

    function isPvpTeam(t) {
        let tl = pvpTeams();
        for (let i = 0; i < tl.length; i++) {
            if (tl[i] == t) return true;
        }
        return false;
    }

    function getAssign() {
        if (assignCache != null) return assignCache;
        assignCache = {};
        return assignCache;
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
            for (let lv = 1; lv <= TIER_MAX; lv++) {
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
            let dead = deadUnit[pl.id];
            if (dead !== undefined && u.id !== dead && !u.dead) {
                delete deadUnit[pl.id];
                spawnBuff[pl.id] = Time.time;
            }
            let gl = spawnLeft(pl.id, SPAWN_GUARD_TICKS);
            if (gl > 0) {
                if (!u.hasEffect(spawnGuardStatus)) u.apply(spawnGuardStatus, gl);
            } else if (spawnBuff[pl.id] !== undefined && spawnLeft(pl.id, SPAWN_RAGE_TICKS) <= 0) {
                delete spawnBuff[pl.id];
            }
            if (spawnLeft(pl.id, SPAWN_RAGE_TICKS) > 0) {
                if (!u.hasEffect(spawnRageStatus)) u.apply(spawnRageStatus, spawnLeft(pl.id, SPAWN_RAGE_TICKS));
            }
            let want = tierType(activeTier(st));
            let pv = prevUnit[pl.id];
            if (pv != null && pv !== u) {
                try {
                    let cr0 = pl.team().core();
                    let toCore = cr0 != null && u.type === cr0.block.unitType;
                    if (toCore && pv.isValid() && !pv.dead && pv.team == pl.team() && !canReturnCore(pv, cr0)) {
                        // người chơi bấm nút về lõi khi không đứng trên nền đặt lõi -> trả lại unit cũ
                        try { Call.unitDespawn(u); } catch (err) { u.remove(); }
                        pl.unit(pv);
                        toast(pl, tr("[scarlet]Chỉ về lõi được khi đứng trên nền đặt lõi ở nửa map phe ta!", "[scarlet]You can only return to core on core-zone floor on your half of the map!"));
                        return;
                    }
                } catch (err) {}
            }
            if (u.type === want && u.team == pl.team()) {
                delete swapPending[pl.id];
                prevUnit[pl.id] = u;
                return;
            }
            let isTier = false;
            for (let lv = 1; lv <= TIER_MAX; lv++) {
                if (u.type === tierType(lv)) { isTier = true; break; }
            }
            let isCoreUnit = false;
            try {
                let cr = pl.team().core();
                isCoreUnit = cr != null && u.type === cr.block.unitType;
            } catch (err) {}
            if (!isTier && !isCoreUnit) {
                delete swapPending[pl.id];
                if (pv != null && pv !== u && pv.isValid() && !pv.dead && pv.team == pl.team()) {
                    pl.unit(pv); // trả về unit cũ, chặn điều khiển pháo/lính
                    toast(pl, tr("[scarlet]Không được điều khiển pháo hoặc lính!", "[scarlet]You cannot control turrets or soldiers!"));
                }
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
                if (sv[8] > 0) {
                    let cores = team.cores();
                    for (let i = 0; i < cores.size; i++) {
                        let cb = cores.get(i);
                        if (cb == null || !cb.isValid()) continue;
                        let mh = cb.block.health;
                        try { mh = cb.maxHealth(); } catch (err2) {}
                        if (cb.health < mh * REGEN_THRESHOLD) cb.heal(mh * sv[8] * REGEN_PCT / 100 * dt / 60);
                    }
                }
            } catch (err) {
                logOnce("corestats", "core stats failed: " + err);
            }
        }
    }

    const eachPassiveExp = new Cons({
        get: function(pl) { addExp(pl, PASSIVE_EXP, true); }
    });

    const eachPlayerCommon = new Cons({
        get: function(pl) {
            let u = pl.unit();
            if (u == null || !u.isValid()) return;
            if (!u.hasEffect(buffStatus)) u.apply(buffStatus, 1);
            if (u.hasEffect(equipStatus)) u.unapply(equipStatus); // không còn vô hiệu vũ khí gốc
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
        for (let key3 in equipBeam) {
            if (present[key3.split(":")[0]] !== true) delete equipBeam[key3];
        }
        for (let sid4 in deadUnit) {
            if (present[sid4] !== true) delete deadUnit[sid4];
        }
        for (let sid5 in spawnBuff) {
            if (present[sid5] !== true) delete spawnBuff[sid5];
        }
        for (let sid3 in swapPending) {
            if (present[sid3] !== true) delete swapPending[sid3];
        }
        for (let sid2 in soldiers) {
            if (present[sid2] !== true) {
                if (!Vars.net.client()) removeSoldiers(sid2);
                delete soldiers[sid2];
                delete barrackT[sid2];
            }
        }
        for (let key4 in mountSt) {
            if (present[key4.split(":")[0]] !== true) delete mountSt[key4];
        }
        if (rolledN > 3000) {
            rolled = {};
            rolledN = 0;
        }
    }

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

    function spawnWave(w, capNew) {
        let fresh = capNew !== undefined;
        let maxUnits = fresh ? capNew : MAX_WAVE_UNITS;
        let spawned = 0;
        if (Groups.player.size() === 0) return 0;
        allowWaveUnits(Vars.state.rules);
        let team = Vars.state.rules.waveTeam;
        let alive = 0;
        if (!fresh) Groups.unit.each(new Cons({ get: function(u) { if (u.team == team) alive++; } }));
        for (let gi = 0; gi < WAVES.length; gi++) {
            let g = WAVES[gi];
            let type = UnitTypes[g.t];
            if (type == null) continue;
            if (type.flying === true || type.naval === true) continue;
            let n = waveCount(g, w);
            if (n <= 0) continue;
            prepareWaveType(type);
            for (let i = 0; i < n; i++) {
                if (alive >= maxUnits) return spawned;
                let pos = spawnPos(type);
                if (pos == null) continue;
                let unit = type.create(team);
                unit.shield = Math.max(0, (w - g.b) * 6);
                unit.set(pos.x, pos.y);
                unit.apply(StatusEffects.invincible, 60);
                unit.add();
                alive++;
                spawned++;
                Events.fire(new UnitSpawnEvent(unit));
                fx(pos.x, pos.y);
            }
        }
        return spawned;
    }

    Events.run(Trigger.update, new Runnable({
        run: function() {
            if (Vars.net.client() || !isActive() || Vars.state.gameOver || Vars.state.isPaused()) return;
            if (Groups.player.size() === 0) return;
            bonusWaveT += Time.delta;
            if (bonusWaveT < BONUS_WAVE_INTERVAL) return;
            bonusWaveT = 0;
            let w = Math.max(1, Vars.state.wave - 1);
            let wt = Vars.state.rules.waveTeam;
            let olds = [];
            Groups.unit.each(new Cons({ get: function(u) { if (u.team == wt && !u.dead && u.isValid()) olds.push(u); } }));
            let left = BONUS_WAVE_MAX_NEW;
            for (let i = 0; i < BONUS_WAVE_TIMES && left > 0; i++) {
                let n = spawnWave(w, left);
                left -= (n || 0);
            }
            for (let i = 0; i < olds.length; i++) {
                let ou = olds[i];
                if (ou == null || !ou.isValid()) continue;
                try { Call.unitDespawn(ou); } catch (err) {
                    try { ou.remove(); } catch (err2) {}
                }
            }
            try {
                Call.sendMessage(tr("[scarlet]Đã tự động spawn x" + BONUS_WAVE_TIMES + " đợt quái!", "[scarlet]Auto-spawned x" + BONUS_WAVE_TIMES + " waves!"));
            } catch (err) {}
        }
    }));

    Events.on(WaveEvent, new Cons({
        get: function(e) {
            if (Vars.net.client() || !isActive() || Vars.state.gameOver) return;
            spawnWave(Vars.state.wave - 1);
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
                if (b.team != null && b.team != tgt.team) teamHit[tgt.id] = { team: b.team, t: Time.time };
                if (o == null || typeof o.getPlayer !== "function" || o.team == tgt.team) return;
                try {
                    if (tgt.getPlayer() != null) {
                        let ap = o.getPlayer();
                        let apid = ap != null ? ap.id : soldierOwner[o.id];
                        if (apid !== undefined) lastHitBy[tgt.id] = { pid: apid, t: Time.time };
                    }
                } catch (err) {}
                try {
                    let rp = o.getPlayer();
                    if (rp != null && isPvpTeam(tgt.team) && spawnLeft(rp.id, SPAWN_RAGE_TICKS) > 0) {
                        let rx = tgt.maxHealth * SPAWN_RAGE_MAXHP_PCT / 100;
                        if (rx > 0) {
                            try { tgt.damagePierce(rx); } catch (err) { tgt.damage(rx); }
                        }
                    }
                } catch (err) {}
            }
        }));
    }

    let lastHitBy = {};
    let teamHit = {}; // phe nào đã bắn trúng unit gần nhất (kể cả pháo xây / pháo lắp)
    const KILL_CREDIT_TICKS = 900;

    function pvpKiller(u) {
        let rec = lastHitBy[u.id];
        delete lastHitBy[u.id];
        if (rec == null || Time.time - rec.t > KILL_CREDIT_TICKS) return null;
        let found = null;
        Groups.player.each(new Cons({ get: function(p) { if (p.id === rec.pid) found = p; } }));
        return found;
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
            let th = teamHit[u.id];
            delete teamHit[u.id];
            let hitTeam = (th != null && Time.time - th.t <= KILL_CREDIT_TICKS) ? th.team : null;
            try {
                let sPid = soldierOwner[u.id];
                if (sPid !== undefined) {
                    delete soldierOwner[u.id];
                    let gx = killExp(u) * SOLDIER_EXP_PCT / 100;
                    if (gx > 0) Groups.player.each(new Cons({ get: function(p) { if (p.id === sPid) addExp(p, gx); } }));
                }
                let dp = u.getPlayer();
                if (dp != null && isPvpTeam(u.team)) {
                    startRespawnLock(dp);
                    deadUnit[dp.id] = u.id;
                    delete spawnBuff[dp.id];
                    let killer = pvpKiller(u);
                    if (killer != null && killer.team() != dp.team()) {
                        try {
                            let ks = bind(killer);
                            ks.k = (ks.k || 0) + 1;
                            let ds = bind(dp);
                            ds.dk = (ds.dk || 0) + 1;
                            dirty = true;
                        } catch (err2) {}
                        let dx = killExp(u) * DEATH_EXP_PCT / 100;
                        if (dx > 0) addExp(dp, dx);
                        let kx = killExp(u) * KILL_EXP_PCT / 100;
                        if (kx > 0) addExp(killer, kx);
                    }
                } else {
                    delete lastHitBy[u.id];
                }
            } catch (err) {}
            if (u.team == Vars.state.rules.waveTeam) {
                let gained = killExp(u);
                let rx = u.x;
                let ry = u.y;
                let got = {};
                let gotTeam = {};
                if (hitTeam != null && gained > 0) gotTeam[hitTeam.id] = true; // pháo của phe hạ mục tiêu -> cả phe nhận EXP dù đứng xa
                Groups.player.each(new Cons({
                    get: function(pl) {
                        let pu = pl.unit();
                        if (pu == null || !pu.isValid()) return;
                        let dx = pu.x - rx;
                        let dy = pu.y - ry;
                        if (dx * dx + dy * dy <= CREDIT_RADIUS * CREDIT_RADIUS) {
                            if (gained > 0) {
                                addExp(pl, gained);
                                got[pl.id] = true;
                                gotTeam[pl.team().id] = true;
                            }
                        }
                    }
                }));
                // co-op: đồng minh cùng phe (ở xa) cũng nhận lượng EXP tương đương, mỗi người 1 lần
                if (gained > 0) {
                    Groups.player.each(new Cons({
                        get: function(pl) {
                            if (got[pl.id] !== true && gotTeam[pl.team().id] === true) addExp(pl, gained);
                        }
                    }));
                }
                return;
            }
        }
    }));

    Events.on(WorldLoadEvent, new Cons({
        get: function(e) {
            byId = {};
            teamsCache = null;
            assignCache = null;
            seenPl = {};
            defsCache = null;
            equipCd = {};
            equipAng = {};
            equipBeam = {};
            hostOwner = {};
            if (!Vars.headless) stopBuild();
            bonusWaveT = 0;
            matchT = 0;
            shieldMinT = 0;
            coreShield = {};
            shieldRecs = [];
            shieldEnded = false;
            shieldSyncT = 0;
            shieldView = { inv: 0, at: 0, cores: {} };
            shieldFlash = {};
            shieldSeenHit = {};
            recentUp = [[], [], [], []];
            viewUp = [[], [], [], []];
            lastUpTab = 0;
            auraSeen = {};
            respawnLock = {};
            deadUnit = {};
            spawnBuff = {};
            swapPending = {};
            prevUnit = {};
            barrackT = {};
            soldiers = {};
            soldierOwner = {};
            mountSt = {};
            lastHitBy = {};
            teamHit = {};
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
            store = {};

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

    function reqState(player, anyDist) {
        if (!isActive() || player == null) return null;
        let u = player.unit();
        let core = player.team().core();
        if (core == null) return null;
        if (u == null || !u.isValid() || u.dead) return bind(player);
        if (anyDist !== true && Mathf.dst(u.x, u.y, core.x, core.y) > core.block.size * Vars.tilesize / 2 + NEAR_CORE) {
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
            if (!(k >= 1 && k <= TIER_MAX)) return;
            let nu = (k === tierCap(st.lv)) ? 0 : k;
            if ((st.u || 0) === nu) return;
            st.u = nu;
            toast(player, tr("[accent]Đã đổi sang unit: ", "[accent]Switched unit: ") + tierType(k).localizedName);
            changed();
        }, false, 400);

        global.NexNet.on(REQ_BUY, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let d = droneDefs().map[String(payload).split("|")[0]];
            if (d == null) return;
            if (!multiTurretOn() && ownedCount(st, d.id) >= 1) {
                toast(player, tr("[scarlet]Đang tắt chế độ nhiều pháo cùng loại (Cài đặt Newex)!", "[scarlet]Multiple turrets of the same type is turned off (Newex settings)!"));
                return;
            }
            let price = turretCost(st, d);
            if (st.pts < price) return;
            if (!d.equip) {
                toast(player, tr("[scarlet]Pháo này không thể gắn lên unit!", "[scarlet]This turret cannot be mounted!"));
                return;
            }
            st.pts -= price;
            st.d.push(d.id);
            st.p.push(IN_BAG);
            toast(player, tr("[accent]Đã mua " + d.block.localizedName + " - xem trong Túi đồ.", "[accent]Bought " + d.block.localizedName + " - check your Bag."));
            changed();
        }, false, 60);

        // payload "idx|mode": e = lắp lên unit, b = xây quanh lõi, u (mặc định) = gỡ/thu hồi về túi
        global.NexNet.on(REQ_MODE, function(player, payload) {
            let parts = String(payload).split("|");
            let st = reqState(player, parts.length > 1 && parts[1] === "b");
            if (st == null) return;
            let idx = parseInt(parts[0]);
            let mode = parts.length > 1 ? parts[1] : "u";
            if (!(idx >= 0 && idx < st.d.length)) return;
            let d = droneDefs().map[st.d[idx]];
            if (d == null) return;
            let cur = st.p[idx];
            if (mode === "u") {
                if (cur === EQUIPPED) st.p[idx] = IN_BAG;
                else if (cur >= 0) { removeTurret(cur, d); st.p[idx] = IN_BAG; }
                else return;
                changed();
                return;
            }
            if (cur >= 0 || cur === EQUIPPED) return; // chỉ lắp/xây pháo đang nằm trong túi
            if (mode === "e") {
                if (!d.equip || !d.mount) {
                    toast(player, tr("[scarlet]Pháo này không thể gắn lên unit!", "[scarlet]This turret cannot be mounted!"));
                    return;
                }
                if (equipCount(st) >= equipSlots(st)) {
                    toast(player, tr("[scarlet]Hết ô gắn!", "[scarlet]No free mount slot!"));
                    return;
                }
                st.p[idx] = EQUIPPED;
            } else if (mode === "b") {
                if (builtCount(st) >= maxBuilt()) {
                    toast(player, tr("[scarlet]Đã đạt giới hạn pháo xây!", "[scarlet]Built turret limit reached!"));
                    return;
                }
                let tx = parseInt(parts[2]);
                let ty = parseInt(parts[3]);
                let pos = (isNaN(tx) || isNaN(ty)) ? -1 : placeTurret(player, d, tx, ty);
                if (pos < 0) {
                    toast(player, tr("[scarlet]Vị trí không hợp lệ: phải là nền đặt lõi còn trống ở nửa map phe ta!", "[scarlet]Invalid spot: needs free core-zone floor on your half of the map!"));
                    return;
                }
                st.p[idx] = pos;
            } else return;
            changed();
        }, false, 60);

        global.NexNet.on(REQ_BARR, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let lv = st.b || 0;
            if (lv >= BARRACKS.length) return;
            let cost = barrackCost(lv);
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
            let sellVal = turretSellValue(st, d);
            removeTurret(st.p[idx], d);
            st.d.splice(idx, 1);
            st.p.splice(idx, 1);
            st.pts += sellVal;
            changed();
        }, false, 60);

        global.NexNet.on(REQ_CHEAT, function(player, payload) {
            if (!isActive() || player == null) return;
            let st = bind(player);
            st.pts += CHEAT_POINTS;
            toast(player, tr("[accent]+" + CHEAT_POINTS + " điểm nâng cấp!", "[accent]+" + CHEAT_POINTS + " upgrade points!"));
            changed();
        }, false, 500);
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
        if (core == null) return false;
        if (u == null || !u.isValid() || u.dead || Vars.player.dead()) return true;
        return Mathf.dst(u.x, u.y, core.x, core.y) <= core.block.size * Vars.tilesize / 2 + NEAR_CORE;
    }

    function touchUp(tab, key) {
        let a = recentUp[tab];
        let i = a.indexOf(key);
        if (i >= 0) a.splice(i, 1);
        a.unshift(key);
        lastUpTab = tab;
    }

    function noteTouch(kind, payload) {
        try {
            let parts = String(payload).split("|");
            let st = localState();
            if (kind === REQ_BARR) touchUp(3, "b");
            else if (kind === REQ_UP) touchUp(1, parseInt(parts[0]));
            else if (kind === REQ_UNIT) touchUp(0, parseInt(parts[0]));
            else if (kind === REQ_BUY) touchUp(2, String(parts[0]));
            else if ((kind === REQ_MODE || kind === REQ_SELL) && st != null) {
                let idx = parseInt(parts[0]);
                if (idx >= 0 && idx < st.d.length) touchUp(2, String(st.d[idx]));
            }
        } catch (err) {}
    }

    function orderedBy(tab, base) {
        let seen = viewUp[tab];
        let out = [];
        for (let i = 0; i < seen.length; i++) {
            if (base.indexOf(seen[i]) >= 0) out.push(seen[i]);
        }
        for (let j = 0; j < base.length; j++) {
            if (out.indexOf(base[j]) < 0) out.push(base[j]);
        }
        return out;
    }

    function send(kind, payload) {
        noteTouch(kind, payload);
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
        let reserve = (shortScreen() ? 40 : 56) + (shortScreen() ? 52 : 72) + 24 + (extra === undefined ? headH() : extra) + (Vars.mobile ? 32 : 0);
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

    function measureHeight(buildFn) {
        let probe = new Table();
        buildFn(probe);
        probe.pack();
        return probe.getPrefHeight();
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
        col.add("[lightgray]" + (isExtraTier(t) ? tr("Đặc biệt", "Special") : (tr("Bậc ", "Tier ") + t)) + "[]").left();
        row.add(col).growX().left();
        if (t === cur) {
            row.add("[accent]" + tr("Đang dùng", "In use") + "[]").width(selW).center();
        } else {
            row.button(tr("Chọn", "Select"), new Runnable({ run: function() { send(REQ_UNIT, String(t)); } })).size(selW, btnH());
        }
        p.add(row).width(w).pad(4).row();
    }

    function statHeader(p, st, w) {
        p.button(tr("Xem chi tiết chỉ số", "View stat details"), new Runnable({ run: function() { statDetailDialog(st); } })).width(w).height(btnH()).pad(4).row();
    }

    function statRow(p, st, i, w) {
        let lv = st.s[i];
        let row = new Table(Styles.black6);
        row.margin(8);
        let col = new Table();
        col.left();
        col.add("[white]" + tr(STATS[i].vi, STATS[i].en) + "[]   [lightgray]" + lv + "/" + statMaxLabel(i) + "[]").left().wrap().growX().row();
        col.add("[lightgray]" + STATS[i].f(lv) + (lv < statMax(i) ? "  >  " + STATS[i].f(lv + 1) : "  MAX") + "[]").left().wrap().growX();
        row.add(col).growX().left();
        let btn = row.button("+", new Runnable({ run: function() { send(REQ_UP, String(i)); } })).size(narrowScreen() ? 52 : 64, btnH()).padLeft(narrowScreen() ? 4 : 8).get();
        btn.setDisabled(st.pts < 1 || lv >= statMax(i));
        p.add(row).width(w).pad(4).row();
    }

    function turretDesc(def) {
        let blk = def.block;
        let kind = def.kind;
        let rng = Math.round(turretRange(def) / Vars.tilesize * 10) / 10;
        let rangeTxt = tr(" Tầm: " + rng + " ô.", " Range: " + rng + " tiles.");
        // ghi chú: pháo tự ngắm/bắn theo AI trong đúng tầm, player không điều khiển được (như parallax)
        let autoTxt = FORCE_AUTO_AIM[def.id] === true
            ? tr(" [sky]Tự động bắn (không điều khiển được).[]", " [sky]Auto-fire (not player-controlled).[]")
            : "";
        if (def.mount === false) {
            autoTxt += tr(" [gray]Chỉ xây được, không thể lắp lên unit.[]", " [gray]Build only, cannot be mounted on a unit.[]");
        }
        if (kind === "tractor") {
            let dps = Math.round(fld(blk, "damage", 0) * 60 * 10) / 10;
            return tr("Tia kéo: kéo máy bay lại gần, gây " + dps + " sát thương/giây, lực kéo " + fld(blk, "force", 0) + "." + rangeTxt,
                "Tractor beam: pulls air units closer, deals " + dps + " dmg/s, force " + fld(blk, "force", 0) + "." + rangeTxt) + autoTxt;
        }
        if (kind === "point") {
            return tr("Phòng thủ điểm: bắn hạ đạn địch, mỗi " + fld(blk, "reload", 0) + " tick trừ " + fld(blk, "bulletDamage", 0) + " sát thương đạn." + rangeTxt,
                "Point defense: shoots down enemy bullets, every " + fld(blk, "reload", 0) + " ticks removes " + fld(blk, "bulletDamage", 0) + " bullet damage." + rangeTxt) + autoTxt;
        }
        if (kind === "laser") {
            return tr("Laser liên tục " + Math.round(fld(blk, "shootDuration", 0) / 6) / 10 + "s rồi nạp lại " + Math.round(fld(blk, "reload", 0) / 6) / 10 + "s." + rangeTxt,
                "Continuous laser for " + Math.round(fld(blk, "shootDuration", 0) / 6) / 10 + "s, then recharges " + Math.round(fld(blk, "reload", 0) / 6) / 10 + "s." + rangeTxt) + autoTxt;
        }
        if (kind === "cont") {
            return tr("Tia bắn liên tục khi có mục tiêu." + rangeTxt, "Fires a continuous beam while a target is in range." + rangeTxt) + autoTxt;
        }
        let parts = [];
        try { if (blk.targetGround !== false) parts.push(tr("bộ binh", "ground")); } catch (err) {}
        try { if (blk.targetAir !== false) parts.push(tr("máy bay", "air")); } catch (err) {}
        return (parts.length > 0 ? tr("Bắn: ", "Targets: ") + parts.join(", ") + "." : tr("Pháo tiêu chuẩn.", "Standard turret.")) + rangeTxt + autoTxt;
    }

    function turretDmg(def) {
        try {
            if (def.kind === "tractor" || def.kind === "point") return 0;
            let bt = equipBullet(def);
            if (bt != null && bt.damage > 0) return Math.round(bt.damage);
        } catch (err) {}
        return 0;
    }

    function turretHeader(p, st, w, cols) {
        p.add("[lightgray]" + tr("Pháo mua xong vào Túi đồ. Lắp: ", "Bought turrets go to Bag. Mounted: ") + "[white]" + equipCount(st) + "/" + equipSlots(st) + "[]  [lightgray]" + tr("Xây: ", "Built: ") + "[white]" + builtCount(st) + "/" + maxBuilt() + "[]  [lightgray]" + (multiTurretOn() ? tr("Mua được nhiều pháo cùng loại.", "Same turret can be bought many times.") : tr("Mỗi loại chỉ mua 1.", "1 per turret type.")) + "[]").colspan(cols).width(w).left().wrap().minWidth(0).pad(2).row();
    }

    function turretCard(st, def, cw) {
        let inner = Math.max(150, cw - 20);
        let ownedN = ownedCount(st, def.id);
        let card = new Table(Styles.black6);
        card.margin(8);
        card.top().left();

        let single = !multiTurretOn() && ownedN > 0;
        let price = turretCost(st, def);
        let iconSz = narrowScreen() ? 30 : (Vars.mobile ? 40 : 34);

        // dòng 1: icon + tên + x số lượng + nút mua
        let top = new Table();
        top.left();
        top.add(new Image(def.block.uiIcon)).size(iconSz).padRight(8);
        top.add("[white]" + def.block.localizedName + "[]" + (ownedN > 0 ? "  [accent]x" + ownedN + "[]" : "")).left().growX().minWidth(0).wrap();
        let buyBtn = top.button(tr("Mua", "Buy") + " " + price, new Runnable({ run: function() { send(REQ_BUY, def.id); } })).size(86, btnH()).padLeft(6).get();
        buyBtn.setDisabled(st.pts < price || !def.equip || single);
        card.add(top).width(inner).left().row();

        // dòng 2: vai trò + thưởng chỉ số
        let rd = roleDesc(def.id);
        card.add(roleText(def.id) + (rd.length > 0 ? "  [green]" + rd + "[]" : "")).width(inner).left().wrap().minWidth(0).padTop(4).row();

        // dòng 3: mô tả (tầm bắn, tự động/thủ công)
        card.add("[lightgray]" + turretDesc(def) + "[]").width(inner).left().wrap().minWidth(0).padTop(2).row();

        // dòng 4: sát thương
        let dmg = turretDmg(def);
        if (dmg > 0) card.add("[scarlet]" + tr("Sát thương: ", "Damage: ") + dmg + "[]").width(inner).left().wrap().minWidth(0).padTop(2).row();
        return card;
    }

    // ===== Túi đồ: pháo đã mua -> chỉ hiện icon + tên, nút Lắp/Tháo và Bán =====
    let bagDialog = null;

    let bagPage = 0;
    let bagRecent = [];

    function bagTouch(id) {
        let i = bagRecent.indexOf(id);
        if (i >= 0) bagRecent.splice(i, 1);
        bagRecent.unshift(id);
        bagPage = 0;
        ver++;
    }
    const BAG_PER_PAGE = 5;

    function buildBag(d) {
        let c = d.cont;
        c.clear();
        let st = localState();
        if (st == null) {
            c.add(tr("Đang đồng bộ dữ liệu...", "Syncing data...")).pad(20).row();
            return;
        }
        let defs = droneDefs();
        let W = Math.min(panelW(), 520);
        let slotFull = equipCount(st) >= equipSlots(st);
        let builtFull = builtCount(st) >= maxBuilt();

        let head = new Table(Styles.black6);
        head.margin(8);
        head.add("[accent]" + tr("Túi đồ", "Bag") + "[]").left().expandX();
        head.add("[lightgray]" + tr("Đang lắp: ", "Mounted: ") + "[white]" + equipCount(st) + "/" + equipSlots(st) + "[]  [lightgray]" + tr("Xây: ", "Built: ") + "[white]" + builtCount(st) + "/" + maxBuilt() + "[]").right();
        c.add(head).width(W).pad(4).row();

        // gom theo loại pháo: x1 x2 x3...
        let groups = [];
        let byType = {};
        for (let i = 0; i < st.d.length; i++) {
            let def = defs.map[st.d[i]];
            if (def == null) continue;
            let g = byType[def.id];
            if (g == null) {
                g = { def: def, bag: [], on: [], built: [] };
                byType[def.id] = g;
                groups.push(g);
            }
            if (st.p[i] === EQUIPPED) g.on.push(i);
            else if (st.p[i] >= 0) g.built.push(i);
            else g.bag.push(i);
        }
        groups.sort(function(x, y) {
            let ix = bagRecent.indexOf(x.def.id);
            let iy = bagRecent.indexOf(y.def.id);
            if (ix < 0) ix = 9999;
            if (iy < 0) iy = 9999;
            return ix - iy;
        });

        if (groups.length === 0) {
            c.add("[lightgray]" + tr("Túi đồ trống. Hãy mua pháo ở tab Pháo.", "Your bag is empty. Buy turrets in the Turrets tab.") + "[]").width(W).wrap().pad(20).row();
            return;
        }

        let rowH = btnH() + 22;
        let availH = Math.max(60, listH(btnH() * 2 + 40));
        let perPage = Math.min(BAG_PER_PAGE, Math.max(1, Math.floor(availH / rowH)));
        let totalPages = Math.max(1, Math.ceil(groups.length / perPage));
        if (bagPage < 0) bagPage = 0;
        if (bagPage > totalPages - 1) bagPage = totalPages - 1;
        let start = bagPage * perPage;
        let end = Math.min(groups.length, start + perPage);

        let btnW = narrowScreen() ? 50 : (Vars.mobile ? 70 : 62);
        let iconSz = narrowScreen() ? 32 : (Vars.mobile ? 44 : 36);
        let list = new Table();
        list.top();
        for (let n = start; n < end; n++) {
            let g = groups[n];
            let def = g.def;
            let total = g.bag.length + g.on.length + g.built.length;
            let row = new Table(Styles.black6);
            row.margin(8);
            row.add(new Image(def.block.uiIcon)).size(iconSz).padRight(10);
            let nm = "[white]" + def.block.localizedName + "[]  [accent]x" + total + "[]" +
                (g.on.length > 0 ? "\n[lightgray]" + tr("Đang lắp: ", "Mounted: ") + "[white]" + g.on.length + "[]" : "") +
                (g.built.length > 0 ? "\n[lightgray]" + tr("Đã xây: ", "Built: ") + "[white]" + g.built.length + "[]" : "");
            row.add(nm).left().growX().wrap().minWidth(0);
            let bagIdx = g.bag.length > 0 ? g.bag[0] : -1;
            let backIdx = g.on.length > 0 ? g.on[g.on.length - 1] : (g.built.length > 0 ? g.built[g.built.length - 1] : -1);
            let sellIdx = bagIdx >= 0 ? bagIdx : backIdx;
            let did = def.id;
            let ub = row.button(tr("Tháo", "Unmount"), new Runnable({ run: function() { bagTouch(did); send(REQ_MODE, backIdx + "|u"); } })).size(btnW, btnH()).padLeft(6).get();
            ub.setDisabled(backIdx < 0);
            let mb = row.button(tr("Lắp", "Mount"), new Runnable({ run: function() { bagTouch(did); send(REQ_MODE, bagIdx + "|e"); } })).size(btnW, btnH()).padLeft(4).get();
            mb.setDisabled(bagIdx < 0 || slotFull || !def.equip || !def.mount);
            let bb = row.button(tr("Xây", "Build"), new Runnable({ run: function() { bagTouch(did); startBuild(did); } })).size(btnW, btnH()).padLeft(4).get();
            bb.setDisabled(bagIdx < 0 || builtFull);
            row.button(tr("Bán", "Sell"), new Runnable({ run: function() { bagTouch(did); send(REQ_SELL, String(sellIdx)); } })).size(btnW, btnH()).padLeft(4);
            list.add(row).width(W - 24).pad(3).row();
        }
        c.add(list).width(W).top().row();

        if (totalPages > 1) {
            let nav = new Table();
            let navBtnW = narrowScreen() ? 56 : 72;
            let prevBtn = nav.button("<", new Runnable({ run: function() { if (bagPage > 0) { bagPage--; ver++; } } })).size(navBtnW, btnH()).get();
            prevBtn.setDisabled(bagPage <= 0);
            nav.add("[white]" + (bagPage + 1) + "/" + totalPages + "[]").width(80).center();
            let nextBtn = nav.button(">", new Runnable({ run: function() { if (bagPage < totalPages - 1) { bagPage++; ver++; } } })).size(navBtnW, btnH()).get();
            nextBtn.setDisabled(bagPage >= totalPages - 1);
            c.add(nav).width(W).pad(4).row();
        }
    }

    function openBag() {
        if (Vars.headless || !isActive()) return;
        if (bagDialog != null && bagDialog.isShown()) return;
        let dialog = new BaseDialog(tr("Túi đồ", "Bag"));
        addClose(dialog);
        bagPage = 0;
        let lastVer = -1;
        let lastW = -1;
        dialog.update(new Runnable({
            run: function() {
                if (!nearOwnCore()) {
                    dialog.hide();
                    return;
                }
                let w = Core.graphics.getWidth() * 10000 + Core.graphics.getHeight();
                if (lastVer !== ver || lastW !== w) {
                    lastVer = ver;
                    lastW = w;
                    buildBag(dialog);
                }
            }
        }));
        bagDialog = dialog;
        dialog.show();
    }

    function armyDesc(i) {
        let cfg = BARRACKS[i];
        let ut = UnitTypes[cfg.t];
        let name = ut != null ? ut.localizedName : cfg.t;
        return name + "  x" + cfg.n + " / " + cfg.sec + "s  " + tr("tối đa ", "max ") + cfg.cap;
    }

    function armyHeader(p, st, w) {
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
            let cost = barrackCost(lv);
            box.add("[lightgray]" + tr("Tiếp theo: ", "Next: ") + armyDesc(lv) + "[]").left().wrap().growX().padTop(4).row();
            let b = box.button((lv < 1 ? tr("Mua", "Buy") : tr("Nâng cấp", "Upgrade")) + " (" + cost + tr(" điểm)", " pt)"), new Runnable({ run: function() { send(REQ_BARR, "1"); } })).growX().height(btnH()).padTop(8).get();
            b.setDisabled(st.pts < cost);
        } else {
            box.add("[accent]MAX[]").left().padTop(4).row();
        }
        p.add(box).width(w).pad(4).row();
    }

    function armyList(p, st, w, start, end) {
        let lv = st.b || 0;
        let list = new Table(Styles.black6);
        list.margin(10);
        for (let i = start; i < end; i++) {
            let c = (i + 1 === lv) ? "[accent]" : "[lightgray]";
            list.add(c + (i + 1) + ". " + armyDesc(i) + "  (" + barrackCost(i) + tr(" điểm)", " pt)") + "[]").left().wrap().growX().row();
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
        out.push([tr("Hồi máu", "Regeneration"), f1(u.maxHealth * s[8] * REGEN_PCT / 100) + tr(" máu/giây (khi dưới 99%)", " HP/s (below 99%)")]);
        out.push([tr("Sát thương theo máu", "HP-based damage"), "+" + f1(s[9] * DMG_PER_HP * u.health * 100) + "%"]);
        out.push([tr("Sát thương theo giáp", "Armor-based damage"), "+" + f1(s[10] * DMG_PER_ARMOR * u.armor * 100) + "%"]);
        out.push([tr("Đẩy lùi", "Knockback"), "+" + f1(s[11] * KNOCK_PER)]);
        out.push([tr("Pháo gắn", "Mounted turrets"), "unit " + equipCount(st) + "/" + equipSlots(st) + tr(", xây ", ", built ") + builtCount(st) + "/" + maxBuilt()]);
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

    // ===== Hiệu ứng chuyển trang: lướt + mờ =====
    function slideEl(el, dir, enter, ms, done) {
        let t0 = Time.millis();
        let dist = Vars.mobile ? 28 : 40;
        let fin = false;
        let step = function() {
            if (fin) return;
            let k = Math.min(1, (Time.millis() - t0) / ms);
            let sh = enter ? (1 - Math.pow(1 - k, 3)) : (1 - k * k);
            let off = (enter ? 1 : -1) * (1 - sh) * dir * dist;
            try { el.color.a = sh; } catch (err) {}
            try { el.translation.set(off, 0); } catch (err) {}
            if (k >= 1) {
                fin = true;
                if (enter) {
                    try { el.color.a = 1; } catch (err) {}
                    try { el.translation.set(0, 0); } catch (err) {}
                }
                if (done != null) done();
            }
        };
        try { el.update(new Runnable({ run: step })); } catch (err) {}
        step();
    }

    function upCommit(bump) {
        let pd = upPending;
        if (pd == null) return;
        upPending = null;
        pd.apply();
        upEnterDir = pd.dir;
        if (bump) ver++;
    }

    function upNavigate(dir, apply) {
        let el = upBodyEl;
        if (el == null || upPending != null) {
            if (upPending != null) upCommit(false);
            apply();
            upEnterDir = dir;
            ver++;
            return;
        }
        upPending = { apply: apply, dir: dir };
        slideEl(el, dir, false, UP_EXIT_MS, function() { upCommit(true); });
    }

    function buildDialog(d) {
        let c = d.cont;
        c.clear();
        upBodyEl = null;
        let st = localState();
        if (st == null) {
            c.add(tr("Đang đồng bộ dữ liệu...", "Syncing data...")).pad(20).row();
            return;
        }
        let W = panelW();
        let defs = droneDefs();

        let head = new Table(Styles.black6);
        head.margin(shortScreen() ? 4 : 8);
        head.add("[accent]" + tr("Cấp ", "Level ") + st.lv + "/" + maxLevel() + "[]").left();
        head.add("[white]" + tierType(activeTier(st)).localizedName + "[]").expandX().center();
        let ptsBox = new Table();
        ptsBox.add("[yellow]" + tr("Điểm: ", "Points: ") + st.pts + "[]").right();
        ptsBox.button(tr("Túi đồ", "Bag") + " (" + st.d.length + ")", new Runnable({ run: function() { openBag(); } })).height(shortScreen() ? 32 : (Vars.mobile ? 40 : 32)).padLeft(8);
        head.add(ptsBox).right();
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
        let tabBtns = [];
        for (let i = 0; i < 4; i++) {
            let ix = i;
            let tb = tabs.button(names[i], tabStyle, new Runnable({ run: function() {
                if (ix === upTab) { upPage = 0; ver++; return; }
                let dir = ix > upTab ? 1 : -1;
                for (let j = 0; j < tabBtns.length; j++) tabBtns[j].setChecked(j === ix);
                upNavigate(dir, function() { upTab = ix; upPage = 0; });
            } })).growX().height(btnH()).pad(2).get();
            tb.setChecked(upTab === i);
            tabBtns.push(tb);
        }
        c.add(tabs).width(W).row();

        let tab = upTab;
        let cols = gridCols();
        let cw = cardW();

        let innerW = W - 24;
        let navH = btnH() + 12;
        let availH = Math.max(60, listH() - navH);

        let unitList = (tab === 0 && st.lv >= FREE_SWITCH_LEVEL) ? orderedBy(0, [1, 2, 3, 4, 5, 6, 7]) : null;
        let statOrder = [];
        for (let q = 0; q < STATS.length; q++) statOrder.push(q);
        statOrder = orderedBy(1, statOrder);
        let turOrder = orderedBy(2, defs.list.map(function(d) { return d.id; }));
        let itemCount = 1;
        let perPage = 1;
        if (tab === 0) {
            if (unitList != null) {
                itemCount = unitList.length;
                let rowH = measureHeight(function(p) { unitRow(p, st, unitList[0], activeTier(st), innerW); });
                perPage = Math.min(UNIT_PER_PAGE, Math.max(1, Math.floor(availH / Math.max(1, rowH))));
            } else {
                itemCount = 1;
                perPage = 1;
            }
        } else if (tab === 1) {
            itemCount = STATS.length;
            let hH = measureHeight(function(p) { statHeader(p, st, innerW); });
            let rowH = 0;
            for (let i = 0; i < STATS.length; i++) {
                let h = measureHeight((function(idx) { return function(p) { statRow(p, st, idx, innerW); }; })(i));
                if (h > rowH) rowH = h;
            }
            perPage = Math.min(STAT_PER_PAGE, Math.max(1, Math.floor(Math.max(0, availH - hH) / Math.max(1, rowH))));
        } else if (tab === 2) {
            itemCount = defs.list.length;
            let cwM = Math.max(cw, 260);
            let hH = measureHeight(function(p) { turretHeader(p, st, innerW, cols); });
            let cardH = 0;
            let ckey = cwM + "|" + cols + "|" + (Vars.mobile ? 1 : 0) + "|" + tr("v", "e") + "|" + defs.list.length;
            if (turCardHCache.key === ckey) {
                cardH = turCardHCache.h;
            } else {
                for (let i = 0; i < defs.list.length; i++) {
                    let card = turretCard(st, defs.list[i], cwM);
                    card.pack();
                    if (card.getPrefHeight() > cardH) cardH = card.getPrefHeight();
                }
                turCardHCache = { key: ckey, h: cardH };
            }
            let rows = Math.max(1, Math.floor(Math.max(0, availH - hH) / Math.max(1, cardH + 8)));
            perPage = Math.min(TURRET_PER_PAGE, rows) * cols;
        } else {
            itemCount = BARRACKS.length;
            let hH = measureHeight(function(p) { armyHeader(p, st, innerW); });
            let rowH = measureHeight(function(p) { armyList(p, st, innerW, 0, 1); });
            perPage = Math.min(ARMY_PER_PAGE, Math.max(1, Math.floor(Math.max(0, availH - hH) / Math.max(1, rowH))));
        }
        let totalPages = Math.max(1, Math.ceil(itemCount / perPage));
        if (upPage < 0) upPage = 0;
        if (upPage > totalPages - 1) upPage = totalPages - 1;
        let start = upPage * perPage;
        let end = Math.min(itemCount, start + perPage);

        let body = new Table();
        body.margin(4);
        body.top();
        if (tab === 0) {
            if (st.lv < FREE_SWITCH_LEVEL) {
                body.add("[lightgray]" + tr("Đạt cấp " + FREE_SWITCH_LEVEL + " để được đổi unit tùy ý.", "Reach level " + FREE_SWITCH_LEVEL + " to switch units freely.") + "[]").pad(10).row();
            } else {
                let cur = activeTier(st);
                for (let idx = start; idx < end; idx++) unitRow(body, st, unitList[idx], cur, innerW);
            }
        } else if (tab === 1) {
            if (start === 0) statHeader(body, st, innerW);
            for (let i = start; i < end; i++) statRow(body, st, statOrder[i], innerW);
        } else if (tab === 2) {
            let cwE = Math.max(cw, 260);
            let bodyW = (cwE + 8) * cols;
            if (start === 0) turretHeader(body, st, Math.max(innerW, bodyW - 8), cols);
            let colCount = 0;
            for (let j = start; j < end; j++) {
                body.add(turretCard(st, defs.map[turOrder[j]], cwE)).width(cwE).pad(4).top().left();
                colCount++;
                if (colCount % cols === 0) body.row();
            }
        } else {
            if (start === 0) armyHeader(body, st, innerW);
            armyList(body, st, innerW, start, end);
        }
        let nav = null;
        if (totalPages > 1) {
            nav = new Table();
            let navBtnW = narrowScreen() ? 56 : 72;
            let prevBtn = nav.button("<", new Runnable({ run: function() { if (upPage > 0) upNavigate(-1, function() { if (upPage > 0) upPage--; }); } })).size(navBtnW, btnH()).get();
            prevBtn.setDisabled(upPage <= 0);
            nav.add("[white]" + (upPage + 1) + "/" + totalPages + "[]").width(80).center();
            let nextBtn = nav.button(">", new Runnable({ run: function() { if (upPage < totalPages - 1) upNavigate(1, function() { if (upPage < totalPages - 1) upPage++; }); } })).size(navBtnW, btnH()).get();
            nextBtn.setDisabled(upPage >= totalPages - 1);
        }
        if (nav != null && Vars.mobile) c.add(nav).width(W).pad(4).row();
        // cả 4 trang (Unit / Chỉ số / Pháo / Lính) đều dùng cuộn lướt tự động theo kích thước giao diện:
        // cuộn dọc luôn bật (giới hạn theo chiều cao khả dụng), cuộn ngang chỉ bật khi nội dung rộng hơn khung.
        let hs;
        if (tab === 2) {
            let cwE2 = Math.max(cw, 260);
            hs = (cwE2 + 8) * cols > W - 8;
        } else {
            let bodyPrefW = 0;
            try { bodyPrefW = body.getPrefWidth(); } catch (err) {}
            hs = bodyPrefW > W + 1;
        }
        let sp = c.pane(body).width(W).maxHeight(Math.max(100, listH() - (nav != null ? navH : 0))).get();
        sp.setScrollingDisabled(!hs, false);
        sp.setFadeScrollBars(false);
        sp.setOverscroll(false, false);
        sp.setSmoothScrolling(true);
        c.row();
        upBodyEl = sp;
        if (upEnterDir !== 0) {
            let ed = upEnterDir;
            upEnterDir = 0;
            slideEl(sp, ed, true, UP_ENTER_MS, null);
        }
        if (nav != null && !Vars.mobile) c.add(nav).width(W).pad(4).row();
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
        upTab = lastUpTab;
        upPage = 0;
        upPending = null;
        upEnterDir = 0;
        upBodyEl = null;
        viewUp = [recentUp[0].slice(), recentUp[1].slice(), recentUp[2].slice(), recentUp[3].slice()];
        dialog.update(new Runnable({
            run: function() {
                if (!nearOwnCore()) {
                    dialog.hide();
                    return;
                }
                let w = Core.graphics.getWidth() * 10000 + Core.graphics.getHeight();
                if (upPending != null && (lastVer !== ver || lastW !== w)) upCommit(false);
                if (lastVer !== ver || lastTab !== upTab || lastW !== w) {
                    lastVer = ver;
                    lastTab = upTab;
                    lastW = w;
                    buildDialog(dialog);
                }
            }
        }));
        upDialog = dialog;
        dialog.show();
    }

    // ===== Số EXP nhảy lên trên đầu unit đang điều khiển =====
    const EXP_JUMP_SEC = 0.8;   // giai đoạn nhảy
    const EXP_FADE_SEC = 1.2;   // giai đoạn mờ dần
    const EXP_MERGE_SEC = 0.25; // các lần nhận EXP liền nhau trong khoảng này gộp thành 1 số
    let expPops = [];
    let expLastPos = null;

    // chạy ở phía máy chủ/host/offline: báo cho đúng người nhận EXP
    function notifyExp(pl, amount) {
        let n = Math.round(amount);
        if (n < 1) return;
        try {
            if (!Vars.headless && Vars.player != null && pl.id === Vars.player.id) {
                showExpPopup(n);
                return;
            }
        } catch (err) {
            logOnce("exppopup", "exp popup failed: " + err);
            return;
        }
        if (!Vars.net.server()) return;
        let msg = JSON.stringify({ p: pl.id, x: n });
        try { Call.clientPacketReliable(pl.con, EXP_KIND, msg); return; } catch (err) {}
        try { Call.clientPacketReliable(EXP_KIND, msg); } catch (err) {}
    }

    // chạy ở máy khách: chỉ hiện nếu gói tin dành cho mình
    function onExpPacket(content) {
        try {
            let o = JSON.parse(String(content));
            if (Vars.player != null && o.p === Vars.player.id) showExpPopup(o.x);
        } catch (err) {
            logOnce("exppacket", "exp packet failed: " + err);
        }
    }

    function makeExpLabel(text) {
        let L = Packages.arc.scene.ui.Label;
        let el = null;
        try { el = new L(text, Styles.outlineLabel); } catch (err) { el = new L(text); }
        el.touchable = Touchable.disabled;
        el.color.set(Pal.accent);
        return el;
    }

    function showExpPopup(n) {
        if (Vars.headless || Vars.ui == null || Vars.ui.hudGroup == null) return;
        let now = Time.millis();
        let last = expPops.length > 0 ? expPops[expPops.length - 1] : null;
        if (last != null && now - last.t0 < EXP_MERGE_SEC * 1000) {
            last.n += n;
            last.el.setText("+" + last.n + " EXP");
            return;
        }
        let el = makeExpLabel("+" + n + " EXP");
        Vars.ui.hudGroup.addChild(el);
        expPops.push({ el: el, n: n, t0: now });
        updateExpPops();
    }

    function clearExpPops() {
        for (let i = 0; i < expPops.length; i++) {
            try { expPops[i].el.remove(); } catch (err) {}
        }
        expPops = [];
        expLastPos = null;
    }

    function expStagePos(x, y) {
        let v = null;
        try { v = Core.input.mouseScreen(x, y); } catch (err) {}
        if (v == null || !isFinite(v.x) || !isFinite(v.y)) {
            try { v = Core.camera.project(x, y); } catch (err) {}
        }
        return v;
    }

    function updateExpPops() {
        if (expPops.length === 0) return;
        if (Vars.state == null || Vars.state.isMenu() || Vars.player == null) {
            clearExpPops();
            return;
        }
        let u = null;
        try { u = Vars.player.unit(); } catch (err) {}
        if (u != null && u.isValid() && !u.dead) expLastPos = { x: u.x, y: u.y, h: u.type.hitSize };
        let now = Time.millis();
        let base = Vars.mobile ? 1.1 : 1.25;
        let keep = [];
        for (let i = 0; i < expPops.length; i++) {
            let pp = expPops[i];
            let s = (now - pp.t0) / 1000;
            if (s >= EXP_JUMP_SEC + EXP_FADE_SEC || expLastPos == null) {
                try { pp.el.remove(); } catch (err) {}
                continue;
            }
            let off;
            let sc = base;
            let a = 1;
            if (s < EXP_JUMP_SEC) {
                let k = s / EXP_JUMP_SEC;
                off = 34 * (1 - Math.pow(1 - k, 3)) + 7 * Math.abs(Math.sin(k * Math.PI * 2.5)) * (1 - k);
                if (k < 0.3) {
                    let q = k / 0.3 - 1;
                    sc = base * (0.4 + 0.6 * (1 + 2.7 * q * q * q + 1.7 * q * q)); // nảy phóng to rồi về cỡ chuẩn
                }
            } else {
                let f = (s - EXP_JUMP_SEC) / EXP_FADE_SEC;
                a = 0.5 * (1 + Math.cos(f * Math.PI));
                off = 41 + 14 * f;
            }
            let v = expStagePos(expLastPos.x, expLastPos.y + expLastPos.h / 2 + 6);
            if (v == null) { keep.push(pp); continue; }
            pp.el.setFontScale(sc);
            pp.el.setSize(pp.el.getPrefWidth(), pp.el.getPrefHeight());
            pp.el.color.a = a;
            pp.el.setPosition(v.x, v.y + off, 1);
            keep.push(pp);
        }
        expPops = keep;
    }

    if (!Vars.headless) {
        Events.run(Trigger.update, new Runnable({
            run: function() {
                try { updateExpPops(); } catch (err) { logOnce("expupdate", "exp popup update failed: " + err); }
            }
        }));
        Events.on(WorldLoadEvent, new Cons({ get: function(e) { clearExpPops(); } }));
    }

    // ===== Danh sách người chơi (phím Tab): hiện số lần hạ người chơi khác và số lần bị người chơi khác hạ =====
    const LIST_TAG = "[#e0e0e1]";
    let listHooked = false;
    let listHookTick = 0;
    let listHookTry = 0;

    function scrollWidgetDeep(el, depth) {
        if (el == null || depth > 8) return null;
        try {
            if (el instanceof UI_ScrollPane) return el.getWidget();
            if (el instanceof UI_Group) {
                let ch = el.getChildren();
                for (let i = 0; i < ch.size; i++) {
                    let r = scrollWidgetDeep(ch.get(i), depth + 1);
                    if (r != null) return r;
                }
            }
        } catch (err) {}
        return null;
    }

    // bảng chứa các hàng người chơi của PlayerListFragment
    function findPlayerListContent() {
        try {
            let root = Core.scene.root;
            let c = root.find("players");
            if (c != null && c instanceof UI_Table) return c;
            let pl = root.find("playerlist");
            if (pl != null) {
                let w = scrollWidgetDeep(pl, 0);
                if (w != null && w instanceof UI_Table) return w;
            }
        } catch (err) {}
        return null;
    }

    function decoratePlayerList(content) {
        if (!isActive()) return;
        let players = [];
        let idx = 0;
        Groups.player.each(new Cons({ get: function(p) { players.push({ p: p, i: idx++ }); } }));
        let byName = {};
        for (let i = 0; i < players.length; i++) {
            let key = "n:" + String(players[i].p.name());
            if (byName[key] === undefined) byName[key] = [];
            byName[key].push(players[i]);
        }
        // trùng tên: sắp theo thứ tự danh sách của game (admin trước, rồi theo phe, rồi theo thứ tự vào)
        for (let key in byName) {
            byName[key].sort(function(a, b) {
                let aa = a.p.admin ? 0 : 1;
                let ba = b.p.admin ? 0 : 1;
                if (aa !== ba) return aa - ba;
                let at = a.p.team().id;
                let bt = b.p.team().id;
                if (at !== bt) return at - bt;
                return a.i - b.i;
            });
        }
        let seen = {};
        let rows = content.getChildren();
        for (let i = 0; i < rows.size; i++) {
            let row = rows.get(i);
            if (!(row instanceof UI_Table)) continue;
            let rc = row.getChildren();
            let lbl = null;
            let key = null;
            for (let j = 0; j < rc.size; j++) {
                let e = rc.get(j);
                if (lbl == null && e instanceof UI_Label) lbl = e;
                if (key == null && e.name != null) {
                    let kk = "n:" + String(e.name);
                    if (byName[kk] !== undefined) key = kk;
                }
            }
            if (lbl == null || key == null) continue;
            let k = seen[key] || 0;
            seen[key] = k + 1;
            let arr = byName[key];
            let pl = arr[Math.min(k, arr.length - 1)].p;
            let st = byId[pl.id];
            if (st == null) continue;
            let tail = "\n" + LIST_TAG + "[lightgray]" + tr("Hạ ", "Kills ") + "[green]" + (st.k || 0) + "[]   [lightgray]" + tr("Bị hạ ", "Deaths ") + "[scarlet]" + (st.dk || 0) + "[]";
            let cur = String(lbl.getText());
            let ci = cur.indexOf("\n" + LIST_TAG);
            let base = ci >= 0 ? cur.substring(0, ci) : cur;
            if (base + tail !== cur) lbl.setText(base + tail);
        }
    }

    function hookPlayerList() {
        if (listHooked || Vars.headless) return;
        let c = findPlayerListContent();
        if (c == null) return;
        // chạy mỗi khung hình ngay sau khi game dựng lại danh sách -> không bị nhấp nháy
        c.update(new Runnable({
            run: function() {
                try { decoratePlayerList(c); } catch (err) { logOnce("playerlist", "player list stats failed: " + err); }
            }
        }));
        listHooked = true;
        Log.info("[NexPvp] player list hooked");
    }

    if (!Vars.headless) {
        Events.on(WorldLoadEvent, new Cons({ get: function(e) { listHookTry = 0; } }));
        Events.run(Trigger.update, new Runnable({
            run: function() {
                if (listHooked || listHookTry > 60) return;
                listHookTick++;
                if (listHookTick % 30 !== 0) return;
                listHookTry++;
                try { hookPlayerList(); } catch (err) { logOnce("playerlisthook", "player list hook failed: " + err); }
                if (!listHooked && listHookTry === 61) Log.err("[NexPvp] player list not found, cannot show kills/deaths");
            }
        }));
    }

    // ===== Ẩn menu khối của game (góc dưới bên phải, cả PC lẫn mobile) khi đang ở chế độ PvP =====
    const KEY_HIDE_BLOCKMENU = "newex-pvp-hide-blockmenu";
    let blockHooked = false;
    let blockHookTry = 0;
    let blockHookTick = 0;
    let blockHookWay = "";

    function blockMenuHidden() {
        try { return isActive() && Core.settings.getBool(KEY_HIDE_BLOCKMENU, true); } catch (err) { return false; }
    }

    const UI_Group = Packages.arc.scene.Group;
    const UI_Table = Packages.arc.scene.ui.layout.Table;
    const UI_ScrollPane = Packages.arc.scene.ui.ScrollPane;
    const UI_Label = Packages.arc.scene.ui.Label;

    function uiRoots() {
        let groups = [];
        try { if (Vars.ui.hudGroup != null) groups.push(Vars.ui.hudGroup); } catch (err) {}
        try { if (Core.scene.root != null) groups.push(Core.scene.root); } catch (err) {}
        return groups;
    }

    // có ScrollPane ở bất kỳ cấp con nào không (menu khối có danh sách khối cuộn được)
    function hasScrollDeep(el, depth) {
        if (el == null || depth > 10) return false;
        try {
            if (el instanceof UI_ScrollPane) return true;
            if (el instanceof UI_Group) {
                let ch = el.getChildren();
                for (let i = 0; i < ch.size; i++) {
                    if (hasScrollDeep(ch.get(i), depth + 1)) return true;
                }
            }
        } catch (err) {}
        return false;
    }

    // leo từ 1 phần tử con lên phần tử nằm ngay dưới hudGroup / root (bảng "fill" chứa toàn bộ menu khối)
    function topLevelOf(el, groups) {
        let cur = el;
        for (let n = 0; n < 30 && cur != null; n++) {
            let par = cur.parent;
            if (par == null) return null;
            for (let g = 0; g < groups.length; g++) {
                if (par.equals(groups[g])) return cur;
            }
            cur = par;
        }
        return null;
    }

    // Script mod bị chặn reflection nên không lấy được field "toggler" -> tìm thẳng trong cây giao diện.
    function findBlockToggler() {
        let groups = uiRoots();
        // 1) theo tên các phần tử của menu khối (PlacementFragment)
        let names = ["blockfrag", "blocksSelect", "inputTable", "categoryTable"];
        for (let n = 0; n < names.length; n++) {
            for (let g = 0; g < groups.length; g++) {
                try {
                    let found = groups[g].find(names[n]);
                    if (found == null) continue;
                    let top = topLevelOf(found, groups);
                    if (top != null) { blockHookWay = "name:" + names[n]; return top; }
                } catch (err) {}
            }
        }
        // 2) theo cấu trúc: bảng neo góc dưới-phải có chứa danh sách cuộn
        for (let g = 0; g < groups.length; g++) {
            try {
                let ch = groups[g].getChildren();
                for (let i = 0; i < ch.size; i++) {
                    let el = ch.get(i);
                    try {
                        if (!(el instanceof UI_Table)) continue;
                        if (hudPanel != null && el.equals(hudPanel)) continue;
                        let al = el.getAlign();
                        if ((al & 4) === 0 || (al & 16) === 0) continue; // bottom + right
                        if (hasScrollDeep(el, 0)) { blockHookWay = "layout"; return el; }
                    } catch (err2) {}
                }
            } catch (err) {}
        }
        return null;
    }

    // ghi log danh sách phần tử của HUD để chẩn đoán khi không tìm thấy menu khối
    function dumpHudChildren() {
        let groups = uiRoots();
        for (let g = 0; g < groups.length; g++) {
            try {
                let ch = groups[g].getChildren();
                let out = [];
                for (let i = 0; i < ch.size && i < 40; i++) {
                    let el = ch.get(i);
                    let cn = "?";
                    try { cn = String(el.getClass().getSimpleName()); } catch (err) {}
                    let al = "";
                    try { al = el.getAlign(); } catch (err) {}
                    out.push(cn + "(" + (el.name != null ? el.name : "") + (al !== "" ? ",a" + al : "") + ")");
                }
                Log.err("[NexPvp] group" + g + " children: " + out.join(" | "));
            } catch (err) {}
        }
    }

    function hookBlockMenu() {
        if (blockHooked || Vars.headless) return;
        let tg = findBlockToggler();
        if (tg == null) return;
        let orig = tg.visibility;
        tg.visibility = new Boolp({
            get: function() {
                if (blockMenuHidden()) return false;
                if (orig != null) return orig.get();
                return Vars.ui.hudfrag.shown;
            }
        });
        blockHooked = true;
        Log.info("[NexPvp] block menu hooked (" + blockHookWay + ")");
    }

    if (!Vars.headless) {
        Events.on(ClientLoadEvent, new Cons({
            get: function(e) {
                try {
                    Core.bundle.getProperties().put("setting." + KEY_HIDE_BLOCKMENU + ".name", tr("Ẩn menu khối của game khi chơi PvP", "Hide the game's block menu in PvP"));
                    Vars.ui.settings.game.checkPref(KEY_HIDE_BLOCKMENU, true);
                } catch (err) {
                    Log.err("[NexPvp] cannot add block menu setting: " + err);
                }
                try { hookBlockMenu(); } catch (err) { logOnce("blockhook", "block menu hook failed: " + err); }
            }
        }));
        Events.on(WorldLoadEvent, new Cons({ get: function(e) { blockHookTry = 0; try { hookBlockMenu(); } catch (err) { logOnce("blockhook", "block menu hook failed: " + err); } } }));
        // dự phòng: thử gắn lại định kỳ (mỗi ~0,5s, tối đa 60 lần) nếu lần đầu chưa tìm thấy menu
        Events.run(Trigger.update, new Runnable({
            run: function() {
                if (blockHooked || blockHookTry > 60) return;
                blockHookTick++;
                if (blockHookTick % 30 !== 0) return;
                blockHookTry++;
                try { hookBlockMenu(); } catch (err) { logOnce("blockhook", "block menu hook failed: " + err); }
                if (!blockHooked && blockHookTry === 61) {
                    Log.err("[NexPvp] block menu not found, cannot hide it");
                    dumpHudChildren();
                }
            }
        }));
    }

    // ===== Chế độ chọn vị trí xây: chạm 2 lần vào cùng 1 ô trên nền đặt lõi =====
    let buildMode = null;
    let buildHud = null;

    function stopBuild() {
        buildMode = null;
        if (buildHud != null) {
            try { buildHud.remove(); } catch (err) {}
            buildHud = null;
        }
    }

    function bagIdxOf(st, id) {
        for (let i = 0; i < st.d.length; i++) {
            if (st.d[i] === id && st.p[i] !== EQUIPPED && !(st.p[i] >= 0)) return i;
        }
        return -1;
    }

    function buildStatus() {
        let m = buildMode;
        if (m == null) return "";
        let def = droneDefs().map[m.id];
        let nm = def != null ? def.block.localizedName : "";
        if (m.tx < 0) return "[accent]" + tr("Chạm 2 lần vào vị trí trên nền đặt lõi để xây ", "Tap twice on a core-zone tile to build ") + nm + "[]";
        return m.ok ? "[green]" + tr("Chạm lần nữa vào ô này để xây ", "Tap the same tile again to build ") + nm + "[]"
                    : "[scarlet]" + tr("Vị trí không hợp lệ (cần nền đặt lõi trống, nửa map phe ta)", "Invalid spot (need free core-zone on your half)") + "[]";
    }

    function showBuildHud() {
        let t = new Table();
        t.setFillParent(true);
        t.bottom();
        try { t.touchable = Touchable.childrenOnly; } catch (err) {}
        t.table(Styles.black6, new Cons({
            get: function(c) {
                c.margin(8);
                c.label(new Prov({ get: function() { return buildStatus(); } })).pad(4);
                c.button(tr("Hủy", "Cancel"), new Runnable({ run: function() { stopBuild(); } })).size(narrowScreen() ? 80 : 100, btnH());
            }
        })).padBottom(Vars.mobile ? 90 : 60);
        Core.scene.add(t);
        buildHud = t;
    }

    function startBuild(id) {
        if (Vars.headless || !isActive()) return;
        let st = localState();
        if (st == null || droneDefs().map[id] == null || bagIdxOf(st, id) < 0) return;
        if (upDialog != null) upDialog.hide();
        if (bagDialog != null) bagDialog.hide();
        stopBuild();
        buildMode = { id: id, tx: -1, ty: -1, ok: false, ec: [], ecT: -999 };
        showBuildHud();
    }

    function buildCheck(m, tx, ty) {
        let core = Vars.player.team().core();
        let def = droneDefs().map[m.id];
        if (core == null || def == null) return false;
        return canBuildAt(core, m.ec, def.block, tx, ty);
    }

    function buildTap(tile) {
        let m = buildMode;
        if (m == null) return;
        let core = Vars.player.team().core();
        if (core != null && Time.time - m.ecT > 30) { m.ec = enemyCores(core.team); m.ecT = Time.time; }
        if (m.tx === tile.x && m.ty === tile.y && m.ok) {
            let st = localState();
            let idx = st != null ? bagIdxOf(st, m.id) : -1;
            if (idx >= 0) send(REQ_MODE, idx + "|b|" + tile.x + "|" + tile.y);
            stopBuild();
            return;
        }
        m.tx = tile.x;
        m.ty = tile.y;
        m.ok = buildCheck(m, tile.x, tile.y);
    }

    function drawBuildPreview() {
        let m = buildMode;
        if (m == null) return;
        let core = Vars.player.team().core();
        let def = droneDefs().map[m.id];
        if (!isActive() || Vars.player.dead() || core == null || def == null) { stopBuild(); return; }
        if (Time.time - m.ecT > 30) { m.ec = enemyCores(core.team); m.ecT = Time.time; }
        let ts = Vars.tilesize;
        if (BUILD_FLOOR.length > 0) {
            let cx = Math.round(Core.camera.position.x / ts);
            let cy = Math.round(Core.camera.position.y / ts);
            Draw.z(Layer.overlayUI);
            Draw.color(Color.valueOf("4dff88"), 0.2);
            for (let x = cx - 24; x <= cx + 24; x++) {
                for (let y = cy - 24; y <= cy + 24; y++) {
                    let t = Vars.world.tile(x, y);
                    if (t == null || t.solid() || t.build != null) continue;
                    if (String(t.floor().name) !== BUILD_FLOOR) continue;
                    if (ourSide(core, m.ec, x, y)) Fill.rect(x * ts, y * ts, ts, ts);
                }
            }
        }
        if (m.tx >= 0) {
            let sz = def.block.size * ts;
            let px = m.tx * ts + def.block.offset;
            let py = m.ty * ts + def.block.offset;
            Draw.z(Layer.overlayUI + 1);
            Draw.color(m.ok ? Color.valueOf("4dff88") : Color.valueOf("ff4d4d"), 0.4);
            Fill.rect(px, py, sz, sz);
            Draw.color(m.ok ? Color.valueOf("4dff88") : Color.valueOf("ff4d4d"), 1);
            Lines.stroke(2);
            Lines.rect(px - sz / 2, py - sz / 2, sz, sz);
            Draw.color(Color.white, 0.6);
            Draw.rect(def.block.uiIcon, px, py, sz, sz);
        }
        Draw.reset();
    }

    if (typeof TapEvent !== "undefined") {
        Events.on(TapEvent, new Cons({
            get: function(e) {
                if (Vars.headless || !isActive() || e.player !== Vars.player || e.tile == null) return;
                if (buildMode != null) { buildTap(e.tile); return; }
                if (!(e.tile.block() instanceof CoreBlock)) return;
                if (e.tile.team() !== Vars.player.team()) return;
                openUpgrade();
            }
        }));
    }

    function hudLine() {
        let st = localState();
        if (st == null) return "";
        let sl = invulTicksLeft();
        let tail = sl > 0 ? "[cyan]" + tr("Khiên ", "Shield ") + fmtTicks(sl) + "[]" : "[lightgray]" + tierType(activeTier(st)).localizedName + "[]";
        return "[accent]" + tr("Cấp ", "Lv ") + "[white]" + st.lv + "[]  [yellow]" + tr("ĐP ", "Pt ") + st.pts + "[]  " + tail;
    }

    function expText() {
        let st = localState();
        if (st == null) return "";
        if (st.lv >= maxLevel()) return "MAX";
        return Math.floor(st.exp) + "/" + expNeed(st.lv);
    }

    function expFrac() {
        let st = localState();
        if (st == null || st.lv >= maxLevel()) return 1;
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

    if (!Vars.headless) {
        let cheatIdx = 0;
        let cheatT = 0;
        let cheatKeys = null;
        Events.run(Trigger.update, new Runnable({
            run: function() {
                if (!isActive()) {
                    cheatIdx = 0;
                    return;
                }
                try {
                    if (cheatKeys == null) {
                        cheatKeys = {};
                        let letters = "abcdefghijklmnopqrstuvwxyz";
                        for (let i = 0; i < letters.length; i++) cheatKeys[letters.charAt(i)] = KeyCode[letters.charAt(i)];
                    }
                    if (Core.scene.hasKeyboard()) {
                        cheatIdx = 0;
                        return;
                    }
                    if (cheatIdx > 0 && Time.time - cheatT > CHEAT_GAP_TICKS) cheatIdx = 0;
                    for (let ch in cheatKeys) {
                        if (!Core.input.keyTap(cheatKeys[ch])) continue;
                        if (ch === CHEAT_SEQ[cheatIdx]) cheatIdx++;
                        else cheatIdx = (ch === CHEAT_SEQ[0]) ? 1 : 0;
                        cheatT = Time.time;
                        if (cheatIdx >= CHEAT_SEQ.length) {
                            cheatIdx = 0;
                            send(REQ_CHEAT, "1");
                        }
                        break;
                    }
                } catch (err) {}
            }
        }));
    }

    let joyPad = null;
    let joyDx = 0;
    let joyDy = 0;
    let joyPointer = -1;
    let joyOx = 0;
    let joyOy = 0;
    const JOY_SIZE = 170;
    const JOY_R = JOY_SIZE / 2;
    const JOY_KNOB = JOY_R * 0.4;
    const JOY_REACH = JOY_R - JOY_KNOB;
    const JOY_DEAD = 0.12;
    const JOY_ZONE_W = 0.28;
    const JOY_ZONE_H = 0.56;
    const joyVec = new Vec2();
    const JOY_CAM_LAG = 0.5;

    function joyEnabled() {
        try { return Core.settings.getBool(KEY_JOY, true); } catch (err) {}
        return true;
    }

    function joyUnit() {
        if (Vars.player == null || Vars.player.dead()) return null;
        let u = Vars.player.unit();
        if (u == null || !u.isValid() || u.dead) return null;
        return u;
    }

    function joyShown() {
        if (!Vars.mobile || Vars.headless || !isActive() || !joyEnabled()) return false;
        if (!Vars.ui.hudfrag.shown || Core.scene.hasDialog()) return false;
        return joyUnit() != null;
    }

    function joyLocksCam() {
        return Vars.mobile && !Vars.headless && isActive() && joyEnabled();
    }

    function joyReset() {
        joyDx = 0;
        joyDy = 0;
        joyPointer = -1;
    }

    function joyTouch(x, y) {
        let dx = (x - joyOx) / JOY_REACH;
        let dy = (y - joyOy) / JOY_REACH;
        let len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1) {
            dx /= len;
            dy /= len;
            len = 1;
        }
        if (len < JOY_DEAD) {
            joyDx = 0;
            joyDy = 0;
        } else {
            joyDx = dx;
            joyDy = dy;
        }
    }

    function joyPlace() {
        if (joyPad == null) return;
        let gw = 0;
        let gh = 0;
        try {
            gw = Vars.ui.hudGroup.getWidth();
            gh = Vars.ui.hudGroup.getHeight();
        } catch (err) {}
        if (!(gw > 0)) gw = screenW();
        if (!(gh > 0)) gh = screenH();
        joyPad.setPosition(0, 0);
        joyPad.setSize(Math.floor(gw * JOY_ZONE_W), Math.floor(gh * JOY_ZONE_H));
    }

    Events.on(ClientLoadEvent, new Cons({
        get: function(e) {
            if (Vars.headless) return;
            try {
                Core.bundle.getProperties().put("setting." + KEY_JOY + ".name", tr("Bật joystick điều khiển unit (tắt camera tự do)", "Enable unit joystick (disables free camera)"));
                Vars.ui.settings.game.checkPref(KEY_JOY, true);
            } catch (err) {
                Log.err("[NexPvp] cannot add joystick setting: " + err);
            }
            if (!Vars.mobile) return;
            joyPad = extend(Element, {
                draw() {
                    if (joyPointer === -1) return;
                    let zx = joyPad.x + 2;
                    let zy = joyPad.y + 2;
                    let zw = joyPad.getWidth() - 4;
                    let zh = joyPad.getHeight() - 4;
                    Draw.color(Color.white, 0.55);
                    Lines.stroke(2.5);
                    Lines.dashLine(zx, zy, zx + zw, zy, Math.max(2, Math.round(zw / 18)));
                    Lines.dashLine(zx + zw, zy, zx + zw, zy + zh, Math.max(2, Math.round(zh / 18)));
                    Lines.dashLine(zx + zw, zy + zh, zx, zy + zh, Math.max(2, Math.round(zw / 18)));
                    Lines.dashLine(zx, zy + zh, zx, zy, Math.max(2, Math.round(zh / 18)));
                    let cx = joyPad.x + joyOx;
                    let cy = joyPad.y + joyOy;
                    Draw.color(Color.black, 0.35);
                    Fill.circle(cx, cy, JOY_R);
                    Draw.color(Color.white, 0.45);
                    Lines.stroke(3);
                    Lines.circle(cx, cy, JOY_R);
                    Draw.color(Pal.accent, 0.95);
                    Fill.circle(cx + joyDx * JOY_REACH, cy + joyDy * JOY_REACH, JOY_KNOB);
                    Draw.reset();
                }
            });
            joyPad.name = "newex-pvp-joystick";
            joyPad.touchable = Touchable.enabled;
            joyPad.visibility = new Boolp({ get: function() { return joyShown(); } });
            joyPad.addListener(extend(InputListener, {
                touchDown(event, x, y, pointer, button) {
                    if (joyPointer !== -1) return false;
                    joyPointer = pointer;
                    joyOx = x;
                    joyOy = y;
                    joyDx = 0;
                    joyDy = 0;
                    return true;
                },
                touchDragged(event, x, y, pointer) {
                    if (pointer !== joyPointer) return;
                    joyTouch(x, y);
                },
                touchUp(event, x, y, pointer, button) {
                    if (pointer !== joyPointer) return;
                    joyReset();
                }
            }));
            joyPlace();
            try { Vars.ui.hudGroup.addChildAt(0, joyPad); } catch (err) { Vars.ui.hudGroup.addChild(joyPad); }
        }
    }));

    if (!Vars.headless && Vars.mobile) {
        let joyLastW = 0;
        let joyLastH = 0;
        Events.run(Trigger.preDraw != null ? Trigger.preDraw : Trigger.update, new Runnable({
            run: function() {
                if (joyPad == null) return;
                let w = Core.graphics.getWidth();
                let h = Core.graphics.getHeight();
                if (w !== joyLastW || h !== joyLastH) {
                    joyLastW = w;
                    joyLastH = h;
                    joyPlace();
                }
                if (joyLocksCam()) {
                    let cu = joyUnit();
                    if (cu != null) {
                        try { Vars.control.input.panning = false; } catch (err) {}
                        try {
                            let cp = Core.camera.position;
                            let dtc = Math.min(0.1, Core.graphics.getDeltaTime());
                            let k = 1 - Math.exp(-dtc / JOY_CAM_LAG);
                            let ddx = cu.x - cp.x;
                            let ddy = cu.y - cp.y;
                            if (ddx * ddx + ddy * ddy < 0.01) cp.set(cu.x, cu.y);
                            else cp.set(cp.x + ddx * k, cp.y + ddy * k);
                        } catch (err) {}
                    }
                }
                if (!joyShown()) {
                    if (joyPointer !== -1 || joyDx !== 0 || joyDy !== 0) joyReset();
                    return;
                }
                if (joyPointer === -1 || (joyDx === 0 && joyDy === 0)) return;
                let u = joyUnit();
                if (u == null) return;
                try {
                    joyVec.set(joyDx, joyDy).limit(1).scl(u.speed());
                    u.movePref(joyVec);
                } catch (err) {
                    logOnce("joystick", "joystick move failed: " + err);
                }
            }
        }));
    }

    function normalizeRules(r, tl) {
        setf(r, "possessionAllowed", false);
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
            store = {};
            matchT = 0;
            shieldMinT = 0;
            coreShield = {};
            shieldEnded = false;
            r.waves = true;
            r.waveTimer = true;
            r.attackMode = false;
            r.pvp = true;
            r.winWave = 0;
            r.waitEnemies = false;
            r.dropZoneRadius = 0;
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

            let multiVal = multiTurretOn();
            content.check(tr("Cho phép trang bị nhiều pháo cùng loại (PvP)", "Allow multiple turrets of the same type (PvP)"), multiVal, new Boolc({
                get: function(v) { multiVal = v; }
            })).pad(5).left().row();

            content.add(tr("Giới hạn pháo xây gần lõi (PvP):", "Built turret limit (PvP):")).padBottom(4).row();
            let drTable = new Table();
            let drField = drTable.field(String(maxBuilt()), text => {}).width(120).get();
            drField.setFilter(TextField.TextFieldFilter.digitsOnly);
            drField.setMaxLength(2);
            drTable.add(tr("pháo (0 - " + LIMIT_BUILT + ")", "turrets (0 - " + LIMIT_BUILT + ")")).padLeft(8);
            content.add(drTable).pad(5).row();

            content.add(tr("Cấp tối đa (PvP):", "Max level (PvP):")).padBottom(4).row();
            let mlTable = new Table();
            let mlField = mlTable.field(String(maxLevel()), text => {}).width(120).get();
            mlField.setFilter(TextField.TextFieldFilter.digitsOnly);
            mlField.setMaxLength(3);
            mlTable.add(tr("cấp (1 - " + LIMIT_MAXLV + ", mặc định " + MAX_LEVEL + ")", "level (1 - " + LIMIT_MAXLV + ", default " + MAX_LEVEL + ")")).padLeft(8);
            content.add(mlTable).pad(5).row();

            content.add(tr("Thời gian khiên bất tử của lõi đầu trận (phút, 0 = tắt):", "Core invincible shield time at match start (minutes, 0 = off):")).padBottom(4).row();
            let shTable = new Table();
            let shField = shTable.field(String(shieldMinutes()), text => {}).width(120).get();
            shField.setFilter(TextField.TextFieldFilter.digitsOnly);
            shField.setMaxLength(4);
            shTable.add(tr("phút (0 - " + LIMIT_SHIELD_MIN + ", mặc định " + DEFAULT_SHIELD_MIN + "; " + LIMIT_SHIELD_MIN + " = lõi bất tử vĩnh viễn)", "min (0 - " + LIMIT_SHIELD_MIN + ", default " + DEFAULT_SHIELD_MIN + "; " + LIMIT_SHIELD_MIN + " = core invincible forever)")).padLeft(8).wrap().width(260);
            content.add(shTable).pad(5).row();

            return function() {
                let sm = parseInt(shField.getText());
                if (isNaN(sm) || sm < 0) sm = DEFAULT_SHIELD_MIN;
                if (sm > LIMIT_SHIELD_MIN) sm = LIMIT_SHIELD_MIN;
                Core.settings.put(KEY_SHIELD, java.lang.Integer(sm));

                let ml = parseInt(mlField.getText());
                if (isNaN(ml) || ml < 1) ml = MAX_LEVEL;
                if (ml > LIMIT_MAXLV) ml = LIMIT_MAXLV;
                Core.settings.put(KEY_MAXLV, java.lang.Integer(ml));

                let e = parseInt(expField.getText());
                if (isNaN(e) || e < 0) e = DEFAULT_EXP;
                if (e > LIMIT_EXP) e = LIMIT_EXP;
                Core.settings.put(KEY_EXP, java.lang.Integer(e));

                let nb = parseInt(drField.getText());
                if (isNaN(nb) || nb < 0) nb = DEFAULT_BUILT;
                if (nb > LIMIT_BUILT) nb = LIMIT_BUILT;
                Core.settings.put(KEY_BUILT, java.lang.Integer(nb));

                Core.settings.put(KEY_MULTI, multiVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
            };
        }
    };

    global.NexPvp = api;
})();