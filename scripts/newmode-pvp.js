(function() {
    const DRONE_IDS = [
        "duo", "scatter", "scorch", "hail", "wave", "lancer", "arc", "parallax", "swarmer",
        "salvo", "segment", "tsunami", "fuse", "ripple", "cyclone", "foreshadow", "spectre", "meltdown",
        "breach", "diffuse", "sublimate", "titan", "disperse", "afflict", "lustre", "scathe", "smite", "malign"
    ];

    const MAP_ID = "pvpnewex3110";
    const REWARD_POINTS = 30;

    const TAG_ACTIVE = "newex-pvp";
    const TAG_STORE = "newex-pvp-store"; // lưu tiến trình trang update (cấp, EXP, điểm nâng, chỉ số, pilot...) vào save để không mất khi out/vào lại
    const KEY_EXP = "newex-pvp-exp-percent";
    const KEY_MULTI = "newex-pvp-multi-turret";
    const KEY_PVB = "newex-pvp-player-vs-bot";
    const KEY_BVB = "newex-pvp-bot-vs-bot";
    const KEY_BUILT = "newex-pvp-max-built";
    const DEFAULT_BUILT = 3;
    const LIMIT_BUILT = 12;
    const KEY_EXT = "newex-pvp-ext";   // bật chế độ NewMode ở map ngoài (EXP + biến về + xây dựng)
    const KEY_BZONE = "newex-pvp-build-zone";     // xây pháo chỉ trên nền đặt lõi
    const KEY_RZONE = "newex-pvp-return-zone";    // biến về chỉ khi đứng trên nền đặt lõi
    const KEY_UPANY = "newex-pvp-up-anywhere";    // vào trang update không cần gần lõi
    const KEY_WRAND = "newex-pvp-wave-random";    // địch wave spawn ngẫu nhiên khắp bản đồ
    const KEY_TERR = "newex-pvp-territory";       // bán kính địa bàn mỗi phe (ô), 0 = nửa map
    const LIMIT_TERR = 100;
    const EXT_BUILD_RANGE = 100;      // map ngoài: chỉ xây cách lõi tối đa 100 ô
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
    const PFX_KIND = "newex-pvp-pfx";
    const CORE_KIND = "newex-pvp-coredie";
    const SHIELD_COLOR = Color.valueOf("#d000ff");
    const SHIELD_GLOW = Color.valueOf("#00f0ff");
    const SHIELD_GOLD = Color.valueOf("#ffe58a");

    const SYNC_KIND = "newex-pvp-sync";
    const REQ_UP = "newex-pvp-up";
    const REQ_BUY = "newex-pvp-buy";
    const REQ_SELL = "newex-pvp-sell";
    const REQ_UNIT = "newex-pvp-unit";
    const REQ_PILOT = "newex-pvp-pilot";
    const PILOT_XIKI = 1;
    const PILOT_XAKY = 3;
    const PILOT_HIST = 4;            // HistekaIMsp Pilot (miễn phí)
    const HIST_STAT_PCT = 0;      // +15% máu, giáp, tốc bắn, tốc chạy, tầm đạn, tấn công, EXP
    const HIST_PIERCE_ADD = 0;    // +15% tỉ lệ xuyên giáp
    const HIST_SHIELD_PCT = 0;    // khiên cá nhân = 15% máu tối đa (tự hồi)
    const HIST_REGEN_PCT = 0;    // hồi 0.525% máu tối đa mỗi giây
    const HIST_SOLDIER_DMG = 0;   // +15% sát thương lên lính spawn từ lõi
    const HIST_WAVE_DMG = 0;      // +15% sát thương lên quái wave
    const HIST_PLAYER_DMG = 0;    // +15% sát thương lên unit người chơi
    const HIST_ARMOR_SHRED = 0; // đạn bào 5.25% giáp mục tiêu
    const XAKY_MIN_LEVEL = 11;       // cấp mở khóa Dash
    const XAKY_HP_MUL = 0.8;         // -20% máu
    const XAKY_SPD_MUL = 1.2;        // +20% tốc độ di chuyển
    const XAKY_CD = 10 * 60;         // hồi chiêu Dash 10s (tick)
    const XAKY_DASH = 96;            // quãng Dash tối đa (12 ô)
    let xakyCdAt = {};
    let xakyPrev = {};
    const PILOT_EMPIX = 2;           // empixeand
    const EMPIX_MIN_LEVEL = 11;      // cấp tối thiểu để chiêu mộ
    const EMPIX_ATK_PCT = 0.05;      // +5% tấn công
    const EMPIX_HP_PCT = 0.05;       // +5% máu
    const EMPIX_HEAL_HP = 0.5;       // máu tụt xuống dưới 50%
    const EMPIX_HEAL_CHANCE = 0.5;   // tỉ lệ 50% hồi đầy máu
    const EMPIX_HEAL_CD = 5 * 60 * 60; // hồi chiêu 5 phút (tick)
    let coreCine = null;               // hoạt ảnh lõi nổ (client): {x,y,t,dur}
    let coreKilled = {};               // lõi do ta chủ động cho nổ (đã chiếu hoạt ảnh)
    let coreDying = {};                // cb.id -> {b,t} (server): lõi đang chờ nổ
    const CORE_DIE_TICKS = 240;        // 4s: camera lướt tới lõi rồi mới nổ
    let empixCdAt = {};              // pid -> Time.time lần hồi máu gần nhất
    let empixLow = {};               // pid -> đang dưới ngưỡng và đã tung xúc xắc
    const XIKI_EXP_PCT = 0.05;   // +5% EXP mỗi lần nhận EXP
    const XIKI_LVUP_PCT = 0.05;  // lên cấp: +5% EXP của cấp mới
    const XIKI_LVUP_FLAT = 500;  // lên cấp: +500 EXP
    const REQ_MODE = "newex-pvp-mode";
    const REQ_CHEAT = "newex-pvp-cheat";
    const REQ_PT = "newex-pvp-pt";
    const REQ_RESET = "newex-pvp-reset";
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
    const STAT_MAIN = 12;   // số chỉ số hiển thị ở trang chỉ số; chỉ số kế tiếp nằm ở trang lính
    const STAT_ARMY = 12;   // tầm bắn + thời gian tồn tại đạn của lính
    const RANGE_PCT = 5;    // mỗi cấp: +5% tầm bắn (và tốc độ bay đạn) của lính (tối đa cấp 20 = +100%)
    const LIFE_PCT = 10;    // mỗi cấp: +10% thời gian tồn tại đạn của lính (tối đa cấp 20 = +200%)
    const START_POINTS = 3;
    const PASSIVE_EXP = 60;
    const PASSIVE_INTERVAL = 3600;
    const MAX_WAVE_UNITS = 200;
    const REIGN_HP_MUL = 1.5;
    const DISRUPT_SPEED_MUL = 2.2;

    const EXP_PER_HP = 0.1;
    const DEATH_EXP_PCT = 10; // người thua nhận 10% EXP của unit mình
    const SOLDIER_EXP_PCT = 10; // lính từ lõi/nhà máy lính chết thì KHÔNG ai nhận EXP (đặt > 0 để bật lại: % EXP chủ lính nhận)
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
    const WAVE_UNIT_CAP = 400;
    const BONUS_WAVE_INTERVAL = 8 * 60 * 60;
    const BONUS_WAVE_TIMES = 5;
    const BONUS_WAVE_MAX_NEW = 150;
    let bonusWaveT = 0;
    const EQUIPPED = -1;
    const EQUIP_SLOT_CAP = 12;
    const REQ_BARR = "newex-pvp-barr";
    const REQ_WALL = "newex-pvp-wall"; // mua / xây / nâng cấp khối tường tăng giới hạn lính
    const WALL_NONE = -3;              // chưa mua (IN_BAG = trong túi, >=0 = vị trí đã xây)
    const WALL_CHAIN = ["copper-wall", "titanium-wall", "plastanium-wall", "thorium-wall", "phase-wall", "surge-wall"];
    const WALL_COST = [2, 3, 5, 8, 12, 16]; // [0] = giá mua, [1..5] = giá nâng cấp (điểm)
    const WALL_BUILD_ID = "__wall";
    const REQ_CMD = "newex-pvp-cmd"; // bật/tắt ra lệnh cho lính; tập kết; theo người chơi
    const ARMY_PER_PAGE = 5;
    const BARRACKS_DISCOUNT = 0.8; // giảm 80% giá nhà máy lính (trả 20%, tối thiểu 1 điểm)
    const BARRACKS = [
        { t: "stell", sec: 10, n: 1, cap: 4, cost: 3 },
        { t: "stell", sec: 8, n: 1, cap: 6, cost: 4 },
        { t: "stell", sec: 7, n: 2, cap: 8, cost: 5 },
        { t: "locus", sec: 12, n: 1, cap: 6, cost: 7 },
        { t: "locus", sec: 9, n: 1, cap: 8, cost: 9 },
        { t: "locus", sec: 7, n: 2, cap: 10, cost: 11 },
        { t: "precept", sec: 14, n: 1, cap: 6, cost: 14 },
        { t: "precept", sec: 10, n: 1, cap: 8, cost: 18 },
        { t: "vanquish", sec: 25, n: 1, cap: 4, cost: 24 },
        { t: "vanquish", sec: 20, n: 1, cap: 5, cost: 28 },
        { t: "conquer", sec: 45, n: 1, cap: 2, cost: 32 },
        { t: "conquer", sec: 35, n: 1, cap: 3, cost: 40 }
    ];

    let wallBlocks = null;
    function wallBlock(i) {
        if (wallBlocks == null) {
            wallBlocks = [];
            for (let k = 0; k < WALL_CHAIN.length; k++) { let b = null; try { b = Vars.content.block(WALL_CHAIN[k]); } catch (err) {} wallBlocks.push(b); }
        }
        return wallBlocks[Math.max(0, Math.min(WALL_CHAIN.length - 1, i))];
    }
    function wallBonus(st) {
        if (st == null || st.w === undefined || st.w === WALL_NONE) return 0;
        return 1 + (st.wl || 0);
    }

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
    const DMG_PCT_MAXHP = 0.05; // mỗi cấp: mỗi lần đạn trúng gây thêm 0.05% máu tối đa của mục tiêu (cấp 20 = 1%)
    const DMG_PER_ARMOR = 0.03;
    const WRAND_DMG_PCT = 5; // mỗi cấp: +5% sát thương lên quái từ đợt spawn ngẫu nhiên (tối đa cấp 20 = +100%)
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

    // pháo malign: hiệu ứng khi đang TRANG BỊ lên unit (pháo xây ra không bị ảnh hưởng)
    const MALIGN_ID = "malign";
    const MALIGN_SPEED_MUL = 0.5;   // -50% tốc độ di chuyển
    const MALIGN_ATK_PCT = 5;       // +5% tấn công
    const MALIGN_RELOAD_MUL = 0.2;  // -80% tốc độ bắn
    const MALIGN_LIFE_MUL = 0.9;    // -10% thời gian tồn tại của đạn

    function malignEquipped(st) {
        if (st == null || st.d == null || st.p == null || st.p.length !== st.d.length) return false;
        for (let i = 0; i < st.d.length; i++) {
            if (st.d[i] === MALIGN_ID && st.p[i] === EQUIPPED) return true;
        }
        return false;
    }

    const SMITE_ID = "smite";
    const LUSTRE_ID = "lustre";
    const LUSTRE_ATK_PCT = 18; // mỗi lustre trang bị thêm: +18% tấn công, không thêm tia
    const SMITE_ATK_PCT = 18;  // mỗi smite trang bị thêm: +18% tấn công, không thêm đạn
    const LIGHT_SPD_PCT = 8;   // trang bị duo / breach: +8% tốc độ di chuyển (không cộng dồn)
    function equippedCount(st, id) {
        let n = 0;
        if (st == null || st.d == null || st.p == null || st.p.length !== st.d.length) return 0;
        for (let i = 0; i < st.d.length; i++) if (st.d[i] === id && st.p[i] === EQUIPPED) n++;
        return n;
    }

    function roleDesc(id) {
        let s = roleDescBase(id);
        if (id === LUSTRE_ID) s += tr(". Mỗi lustre trang bị thêm không bắn thêm tia, chỉ +" + LUSTRE_ATK_PCT + "% tấn công", ". Extra copies fire no extra beams, only +" + LUSTRE_ATK_PCT + "% attack each");
        if (id === "duo" || id === "breach") {
            s += tr(". Thêm: +" + LIGHT_SPD_PCT + "% tốc độ di chuyển (không cộng dồn)", ". Also: +" + LIGHT_SPD_PCT + "% move speed (does not stack)");
        }
        return s;
    }

    function roleDescBase(id) {
        if (id === SMITE_ID) return tr("Trang bị: +" + ROLE_ATK_PCT + "% tấn công (tối đa " + ROLE_ATK_MAX + "%). Mỗi pháo trang bị thêm không bắn thêm đạn, chỉ +" + SMITE_ATK_PCT + "% tấn công",
            "Equipped: +" + ROLE_ATK_PCT + "% attack (max " + ROLE_ATK_MAX + "%). Extra copies fire no extra bullets, only +" + SMITE_ATK_PCT + "% attack each");
        if (id === MALIGN_ID) {
            return tr("Trang bị: -" + Math.round((1 - MALIGN_SPEED_MUL) * 100) + "% tốc độ di chuyển, +" + MALIGN_ATK_PCT + "% tấn công, -" + Math.round((1 - MALIGN_RELOAD_MUL) * 100) + "% tốc độ bắn, -" + Math.round((1 - MALIGN_LIFE_MUL) * 100) + "% thời gian tồn tại của đạn",
                "Equipped: -" + Math.round((1 - MALIGN_SPEED_MUL) * 100) + "% move speed, +" + MALIGN_ATK_PCT + "% attack, -" + Math.round((1 - MALIGN_RELOAD_MUL) * 100) + "% fire rate, -" + Math.round((1 - MALIGN_LIFE_MUL) * 100) + "% bullet lifetime");
        }
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
        { vi: "Sát thương % máu tối đa", en: "Max HP % damage", f: function(l) { return "+" + (l * DMG_PCT_MAXHP).toFixed(2) + "% " + tr("máu tối đa của mục tiêu mỗi lần trúng", "of target max HP per hit"); } },
        { vi: "Sát thương theo giáp", en: "Armor-based damage", f: function(l) { return "+" + (l * DMG_PER_ARMOR * 10).toFixed(1) + "% " + tr("mỗi 10 giáp hiện tại", "per 10 current armor"); } },
        { vi: "Đẩy lùi", en: "Knockback", f: function(l) { return "+" + (l * KNOCK_PER).toFixed(2) + " " + tr("lực đẩy lùi", "knockback"); } },
        { vi: "Tầm bắn & đạn của lính", en: "Soldier range & bullet life", f: function(l) { return "+" + (l * RANGE_PCT) + "% " + tr("tầm bắn & tốc độ bay đạn", "range & bullet speed") + "  +" + (l * LIFE_PCT) + "% " + tr("thời gian tồn tại đạn", "bullet lifetime"); } },
        { vi: "Sát thương quái spawn ngẫu nhiên", en: "Random-spawn monster damage", f: function(l) { return "+" + (l * WRAND_DMG_PCT) + "% " + tr("sát thương khi đánh trúng quái từ đợt spawn ngẫu nhiên", "damage when hitting monsters from random spawn waves"); } }
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
    const PROFILE = true; // đặt false để tắt đo
    let profAcc = {}, profFrames = 0;
    function pn() { return PROFILE ? Time.nanos() : 0; }
    function pe(name, t0) { if (PROFILE) profAcc[name] = (profAcc[name] || 0) + (Time.nanos() - t0) / 1e6; }
    let rolled = {};
    let bulletStatT = 0, bulletStatOn = false, wallT = 0, orphanTypes = null;
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
    let autoPauseFixed = false;
    let botT = 0;
    const BOT_COMBAT_R = 650; // địch trong bán kính này mới tính là đang giao tranh
    // ===== nhiều bot: mỗi bot 1 ctx; BC = ctx đang chạy =====
    let bots = [];
    function newBotCtx() {
        return { botPl: null, botBuyT: 0, botScanT: 0, botDbgT: 0, botRetreatT: 0, botHome: false, botBuyTrip: false, botAttack: false,
            botNoBuyT: 0, botNoAtkT: 0, botPlanT: 0, botBaseT: 0, botIncomeT: 0, botMin: 0, botBase: null, botEnemyPos: null,
            botCoreHit: 0, botCoreHp: 0, botAlertT: 0, botFightT: 0, botMissionT: 0, botRebuildCd: 0, botMem: {}, botSkip: null,
            botSkipT: 0, botStuckT: 0, botLastX: 0, botLastY: 0, botDeadT: 60, botTarget: null, botIdle: {}, botBan: {}, botBad: {},
            botIdleT: 0, botSaveCost: 0, botSeen: null, botSeenAt: -1e9, botSeenT: 0, botSwapPend: false, botSwapT0: 0,
            botScout: false, botScoutT0: 0, botSm: 1, botNoShotT: 0, botResetPend: false, botResetT0: 0 };
    }
    let BC = newBotCtx();
    const BOT_MAX = 8;
    function pvbOn() { return setBool(KEY_PVB, false); }
    function bvbOn() { return setBool(KEY_BVB, false); }
    function botOf(id) { for (let i = 0; i < bots.length; i++) if (bots[i].botPl.id === id) return bots[i]; return null; }
    function botUnitOf(u) { if (u == null) return null; for (let i = 0; i < bots.length; i++) if (bots[i].botPl._unit === u) return bots[i]; return null; }
    function isBotId(id) { return id <= BOT_ID && id > BOT_ID - 64; }
    function isBotPl(p) { return p != null && isBotId(p.id) && botOf(p.id) != null; }
    // chủ của unit: người chơi thật hoặc bot (để áp chỉ số + kỹ năng pilot)
    function ownerPl(u) {
        let p = null;
        try { p = u.getPlayer(); } catch (err) {}
        if (p == null) { let b = botUnitOf(u); if (b != null) p = b.botPl; }
        return p;
    }
    function botSmart() {
        let n = 0, t = BC.botPl.team();
        for (let i = 0; i < bots.length; i++) if (bots[i].botPl.team() === t) n++;
        return Math.max(1, n);
    }
    // Player vs Bot: phe của người chơi (khác phe bot)
    function pvbHumanTeam() {
        let bt = bots.length > 0 ? bots[0].botPl.team() : null, tl = pvpTeams(), found = null;
        Groups.player.each(new Cons({ get: function(p) {
            let t = seenPl[p.id];
            if (found == null && t !== undefined && t !== bt && isPvpTeam(t)) found = t;
        } }));
        if (found != null) return found;
        if (Vars.player != null && isPvpTeam(Vars.player.team()) && Vars.player.team() != bt) return Vars.player.team();
        for (let i = 0; i < tl.length; i++) if (tl[i] != bt && tl[i].cores().size > 0) return tl[i];
        return tl[0];
    }
    const botDest = new Packages.arc.math.geom.Vec2();
    const botGoal = new Packages.arc.math.geom.Vec2();
    // học unit/pilot của player địch: phải tới gần BOT_SEE_R nhìn 1 lần, rồi về nền + biến về lõi mới đổi
    let hudPanel = null;
    let hudLastW = 0;
    let hudLastH = 0;
    let swapPending = {};
    let barrackT = {};
    let rally = {}; // điểm tập kết lính theo người chơi (chỉ máy chủ)
    let soldiers = {};
    let soldierOwner = {};
    let prevUnit = {}; // unit tier còn sống của từng người chơi, để chặn nút respawn/về lõi
    let mountSt = {};
    let logged = {};
    let passiveT = PASSIVE_INTERVAL;
    let ver = 0;
    let stVer = 0;
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

    // isFull: map PvP (đầy đủ: bot, lính lõi, khiên, wave riêng, nền đặt lõi...)
    function isFull() {
        if (Vars.state == null || !Vars.state.isGame()) return false;
        let tags = getTags();
        if (tags != null && String(tags.get(TAG_ACTIVE, "0")) === "1") return true;
        return isPvpMap();
    }

    function setBool(k, d) {
        try { return Core.settings.getBool(k, d); } catch (err) {}
        return d;
    }
    function buildZoneOn() { return setBool(KEY_BZONE, true); }
    function returnZoneOn() { return setBool(KEY_RZONE, true); }
    function upAnywhere() { return setBool(KEY_UPANY, false); }
    function waveRandomOn() { return setBool(KEY_WRAND, true); }
    function terrRadius() {
        let v = 0;
        try { v = Core.settings.getInt(KEY_TERR, 0); } catch (err) {}
        if (!(v > 0)) return isFull() ? 0 : EXT_BUILD_RANGE;
        return Math.min(LIMIT_TERR, Math.floor(v));
    }

    function extEnabled() {
        try { return Core.settings.getBool(KEY_EXT, true); } catch (err) {}
        return true;
    }

    // isExt: map bất kỳ khác (sinh tồn/tấn công...): chỉ EXP khi diệt quái + đổi unit + xây dựng
    function isExt() {
        try {
            if (Vars.state == null || !Vars.state.isGame() || Vars.state.isEditor()) return false;
            if (!extEnabled() || Vars.state.rules.pvp || isFull()) return false;
            return true;
        } catch (err) {}
        return false;
    }

    function isActive() {
        return isFull() || isExt();
    }

    function isTierUnit(u) {
        if (u == null) return false;
        for (let lv = 1; lv <= TIER_MAX; lv++) {
            if (u.type === tierType(lv)) return true;
        }
        return false;
    }

    // đang điều khiển unit PvP? (map PvP: luôn; map ngoài: chỉ khi unit là unit cấp của mode)
    function pvpOn(pl) {
        if (isFull()) return true;
        try { return pl != null && isTierUnit(pl.unit()); } catch (err) {}
        return false;
    }

    function pvpCtl() {
        try { return isFull() || (isActive() && Vars.player != null && isTierUnit(Vars.player.unit())); } catch (err) {}
        return false;
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
        return { lv: 1, exp: 0, pts: START_POINTS, u: 0, s: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], d: [], p: [], b: 0, pi: 0, kc: [0, 0, 0], w: WALL_NONE, wl: 0 };
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
        while (st.s.length < STATS.length) st.s.push(0);
        byId[pl.id] = st;
        dirty = true;
        return st;
    }

    function changed() {
        dirty = true;
        stVer++;
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
        if (st.pi === PILOT_XIKI) amount = amount * (1 + XIKI_EXP_PCT); // xikipilot: +5% EXP nhận
        if (st.pi === PILOT_HIST) amount = amount * (1 + HIST_STAT_PCT); // histeka: +15% EXP nhận
        st.exp += amount;
        if (quiet !== true) notifyExp(pl, amount);
        let before = st.lv;
        let up = 0;
        while (st.lv < maxLevel() && st.exp >= expNeed(st.lv)) {
            st.exp -= expNeed(st.lv);
            st.lv++;
            st.pts++;
            up++;
            if (st.pi === PILOT_XIKI && st.lv < maxLevel()) st.exp += XIKI_LVUP_FLAT + expNeed(st.lv) * XIKI_LVUP_PCT; // xikipilot: thưởng khi lên cấp
        }
        if (st.lv >= maxLevel()) st.exp = 0;
        if (up > 0) {
            toast(pl, tr("[accent]Lên cấp ", "[accent]Level up ") + st.lv + tr(" - +", " - +") + up + tr(" điểm nâng cấp và ô lắp pháo. Về lõi để nâng cấp!", " upgrade point(s) and turret slot(s). Return to your core!") +
                (before < FREE_SWITCH_LEVEL && st.lv >= FREE_SWITCH_LEVEL ? tr(" Đã mở đổi unit trong bảng nâng cấp!", " You can now switch units in the upgrade menu!") : ""));
            stVer++;
        }
        dirty = true;
    }

    // Ghi toàn bộ tiến trình (store: cấp, EXP, điểm, chỉ số, pilot, kill...) vào rules.tags của map,
    // để khi slot.save() chạy (mỗi wave / trước khi thoát), dữ liệu này được lưu cùng file save.
    function persistStore() {
        try {
            if (Vars.net.client()) return; // chỉ máy chủ/host mới giữ dữ liệu gốc
            let r = Vars.state.rules;
            if (r == null || r.tags == null) return;
            r.tags.put(TAG_STORE, JSON.stringify(store));
        } catch (err) { logOnce("persiststore", "persist store failed: " + err); }
    }

    // Đọc lại tiến trình đã lưu từ rules.tags (sau khi load save / tiếp tục trận) thay vì xóa trắng.
    function restoreStore() {
        try {
            let r = Vars.state.rules;
            let raw = (r != null && r.tags != null) ? String(r.tags.get(TAG_STORE, "")) : "";
            store = (raw && raw.length > 0) ? JSON.parse(raw) : {};
        } catch (err) {
            logOnce("restorestore", "restore store failed: " + err);
            store = {};
        }
    }

    function broadcast() {
        let out = {};
        for (let id in byId) {
            let s = byId[id];
            out[id] = [s.lv, Math.floor(s.exp), s.pts, s.s, s.d, s.u || 0, s.p, s.b || 0, s.pi || 0, s.kc || [0, 0, 0], s.cmd || 0, s.w === undefined ? WALL_NONE : s.w, s.wl || 0];
        }
        if (Vars.net.server()) {
            try { Call.clientPacketReliable(SYNC_KIND, JSON.stringify({ d: out })); } catch (err) {}
        }
        stVer++;
    }

    function onSync(content) {
        try {
            let o = JSON.parse(String(content));
            let n = {};
            for (let id in o.d) {
                let a = o.d[id];
                let pp = (a[6] != null && a[4] != null && a[6].length === a[4].length) ? a[6] : [];
                while (a[3].length < STATS.length) a[3].push(0);
                n[id] = { lv: a[0], exp: a[1], pts: a[2], s: a[3], d: a[4], u: a[5] || 0, p: pp, b: a[7] || 0, pi: a[8] || 0, kc: a[9] || [0, 0, 0], cmd: a[10] || 0, w: a[11] === undefined ? WALL_NONE : a[11], wl: a[12] || 0 };
            }
            byId = n;
            stVer++;
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
            Vars.netClient.addPacketHandler(PFX_KIND, new Cons({
                get: function(content) { try { let s0 = String(content); let id = parseInt(s0); pilotFxAt[id] = Time.time; if (s0.indexOf("x") >= 0) xakyCdAt[id] = Time.time; else empixCdAt[id] = Time.time; } catch (err) {} }
            }));
            Vars.netClient.addPacketHandler(CORE_KIND, new Cons({
                get: function(content) { try { let a = String(content).split("|"); coreDeathFx(parseFloat(a[0]), parseFloat(a[1]), parseFloat(a[2])); } catch (err) {} }
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
                if (BUILD_FLOOR.length > 0 && isFull() && buildZoneOn() && String(t.floor().name) !== BUILD_FLOOR) return false;
            }
        }
        return true;
    }

    // vị trí hợp lệ: toàn bộ nền dưới pháo là nền đặt lõi, còn trống, và nằm ở nửa map phe ta
    function canBuildAt(core, ec, blk, tx, ty) {
        let off = Math.floor((blk.size - 1) / 2);
        let rr = terrRadius(); // >0: địa bàn = bán kính quanh lõi (tối đa 100 ô); 0: nửa map phe ta (chỉ map PvP)
        if (rr > 0) {
            if (Mathf.dst(tx, ty, core.tile.x, core.tile.y) > rr) return false;
        } else if (!ourSide(core, ec, tx, ty)) return false;
        return spotFree(tx, ty, blk.size, off);
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
            hostOwner[b.id] = pl.id; // luôn gắn chủ (kể cả sau khi tải lại map) để đạn nhận chỉ số
            if (st.s[4] > 0) {
                // tốc độ bắn từ trang nâng cấp chỉ số
                let rm = 1 + st.s[4] * 0.06;
                try { b.applyBoost(rm, 5); } catch (err) {
                    try { b.timeScale = Math.max(b.timeScale, rm); b.timeScaleDuration = 5; } catch (err2) {}
                }
            }
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
            let plUnits = [];
            Groups.player.each(new Cons({ get: function(p) { let pu = p.unit(); if (pu != null) plUnits.push(pu); } }));
            for (let bi = 0; bi < bots.length; bi++) { let bu = bots[bi].botPl.unit(); if (bu != null) plUnits.push(bu); }
            for (let pi = 0; pi < plUnits.length; pi++) (function(e) {
                {
                    if (e == null || e.team == team || e.team == Team.derelict || e.dead || !e.isValid()) return;
                    if (e.isFlying() ? !ta : !tg) return;
                    try { if (!e.targetable(team)) return; } catch (err1) {}
                    let d = Mathf.dst(b.x, b.y, e.x, e.y);
                    if (d - e.hitSize / 2 > range || d < minR) return;
                    if (d < bd) { bd = d; best = e; }
                }
            })(plUnits[pi]);
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
            if ((!multi || def.id === SMITE_ID || def.id === LUSTRE_ID) && seen[def.id] === true) continue;
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

    // pháo có giá leo thang: mỗi cái đang sở hữu làm giá lần mua tiếp theo +100% (x2 mỗi lần)
    const ESCALATE_IDS = { malign: true };
    const ESCALATE_PCT = 100;

    function turretCostAt(def, owned) {
        if (ESCALATE_IDS[def.id] !== true) return def.cost;
        return Math.ceil(def.cost * Math.pow(1 + ESCALATE_PCT / 100, Math.min(owned, 30)));
    }

    function turretCost(st, def) {
        return turretCostAt(def, ownedCount(st, def.id));
    }

    // bán = hoàn đúng số điểm đã trả cho cái mua gần nhất (giá lúc sở hữu n-1 cái), tránh bug cày điểm
    function turretSellValue(st, def) {
        return turretCostAt(def, Math.max(0, ownedCount(st, def.id) - 1));
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
            let ftCons = new Cons({
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
            });
            let rr0 = range + 64;
            try { Units.nearbyEnemies(team, mp.x - rr0, mp.y - rr0, rr0 * 2, rr0 * 2, ftCons); }
            catch (err9) { Groups.unit.each(ftCons); }
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
                let pdCons = new Cons({
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
                });
                try { Groups.bullet.intersect(mp.x - range - 16, mp.y - range - 16, (range + 16) * 2, (range + 16) * 2, pdCons); }
                catch (err8) { Groups.bullet.each(pdCons); }
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
            if (!pvpOn(pl)) return;
            let st = byId[pl.id];
            if (st == null || st.d.length === 0 || st.p.length !== st.d.length) return;
            let defs = droneDefs();
            let u = pl.unit();
            if (u != null && u.isValid() && !u.dead) mountFire(pl, equipList(st, defs), u, "u");
        }
    });


    const eachDrawEquip = new Cons({
        get: function(pl) {
            if (!pvpOn(pl)) return;
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

    // ===== Hoạt ảnh icon xikipilot khi lên cấp: nhảy lên đầu unit 1s rồi thụt về, kèm vạch gạch trái -> phải =====
    const PILOT_FX_TICKS = 132; // 2.2s
    const PILOT_Z = 10000;     // layer cao nhất
    let pilotLastLv = {};
    let pilotFxAt = {};
    function drawPilotFor(pl, ui) {
        let st = byId[pl.id];
        if (st == null) return;
        let prev = pilotLastLv[pl.id];
        pilotLastLv[pl.id] = st.lv;
        if (st.pi === PILOT_XIKI && prev !== undefined && st.lv > prev) pilotFxAt[pl.id] = Time.time;
        if (!ui) return; // vòng vẽ thế giới chỉ phát hiện lên cấp; hoạt ảnh vẽ ở lớp UI phía trên
        let at = pilotFxAt[pl.id];
        if (at === undefined || !(st.pi > 0)) return;
        let t = Time.time - at;
        if (t < 0 || t >= PILOT_FX_TICKS) { if (t >= PILOT_FX_TICKS) delete pilotFxAt[pl.id]; return; }
        let u = pl.unit();
        if (u == null || !u.isValid() || u.dead) return;
        let reg = pilotIconRegion(st.pi);
        if (reg == null) return;
        let p = t / PILOT_FX_TICKS;
        let h = Math.sin(p * Math.PI);          // 0 -> 1 -> 0: nhảy lên rồi thụt về
        let k = (Core.graphics.getWidth() / Core.camera.width) / uiScale() * (Vars.mobile ? 3 : 1); // đơn vị thế giới -> đơn vị UI (mobile x3)
        let size = 36 * k * Math.min(1, h * 3);     // trồi ra / chui vào unit
        let sv = expStagePos(u.x, u.y + u.hitSize / 2 + (6 + h * 42) * (Vars.mobile ? 3 : 1));
        if (sv == null) return;
        let cx = sv.x, cy = sv.y;
        Draw.reset();
        Draw.color();
        Draw.rect(reg, cx, cy, size, size);
        if (st.pi === PILOT_EMPIX) {
            // empixeand: các hạt dấu cộng xanh lá bay lên cùng pilot, mờ dần rồi biến mất khi vẫn đang bay lên
            for (let i = 0; i < 7; i++) {
                let delay = i * 0.07;
                let q = (p - delay) / 0.6;               // tiến độ riêng của từng hạt
                if (q <= 0 || q >= 1) continue;
                let ox = ((i * 37 % 11) - 5) * 3.2 * k;  // lệch ngang cố định theo hạt
                let px = cx + ox + Math.sin(q * 6 + i) * 3 * k;
                let py = cy + (8 + q * 46) * k;          // luôn bay lên
                let a = 1 - q * q;                       // mờ dần
                let r = (3 + (i % 3)) * k;
                Draw.color(Color.valueOf("4cff5a"), a);
                Lines.stroke(2.2 * k);
                Lines.line(px - r, py, px + r, py);
                Lines.line(px, py - r, px, py + r);
            }
            Draw.reset();
            return;
        }
        let left = p < 0.5;
        let sp = left ? p * 2 : (p - 0.5) * 2;
        let fade = Math.sin(sp * Math.PI);
        if (fade > 0.02) {
            let angs = left ? [160, 135, 110] : [20, 45, 70];
            Draw.color(Pal.accent, fade);
            Lines.stroke(3.6 * k);
            for (let i = 0; i < 3; i++) {
                let a = angs[i];
                let r1 = (27 + sp * 9) * k, r2 = r1 + 15 * k;
                Lines.line(cx + Angles.trnsx(a, r1), cy + Angles.trnsy(a, r1), cx + Angles.trnsx(a, r2), cy + Angles.trnsy(a, r2));
            }
        }
        Draw.reset();
    }
    const eachDrawPilot = new Cons({ get: function(pl) { drawPilotFor(pl); } });
    // lớp UI vẽ hoạt ảnh pilot: luôn được đưa lên trên cùng (cao hơn số EXP nhảy)
    let pilotOverlay = null;
    function drawPilotUI() {
        Groups.player.each(new Cons({ get: function(pl) { drawPilotFor(pl, true); } }));
        for (let bi = 0; bi < bots.length; bi++) drawPilotFor(bots[bi].botPl, true);
    }
    if (!Vars.headless) {
        Events.on(ClientLoadEvent, new Cons({
            get: function(e) {
                try {
                    pilotOverlay = extend(Element, {
                        draw() {
                            if (!isActive()) return;
                            try { drawPilotUI(); } catch (err) { logOnce("pilotui", "pilot ui failed: " + err); }
                            Draw.reset();
                        }
                    });
                    pilotOverlay.touchable = Touchable.disabled;
                    pilotOverlay.name = "newex-pvp-pilotfx";
                    pilotOverlay.setSize(screenW(), screenH());
                    Vars.ui.hudGroup.addChild(pilotOverlay);
                    pilotOverlay.toFront();
                } catch (err) { Log.err("[NexPvp] cannot add pilot overlay: " + err); }
            }
        }));
    }

    function drawPilotIcons() {
        Groups.player.each(eachDrawPilot);
        for (let bi = 0; bi < bots.length; bi++) drawPilotFor(bots[bi].botPl);
    }

    if (!Vars.headless) {
        try {
            if (typeof Trigger !== "undefined" && Trigger.postDraw != null) {
                Events.run(Trigger.postDraw, new Runnable({
                    run: function() {
                        if (!isActive()) return;
                        try {
                            let t8 = pn();
                            Groups.player.each(eachDrawEquip);
                            drawBuildPreview();
                            drawCmdMark();
                            drawCoreShields();
                            drawPilotIcons();
                            pe("draw", t8);
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
        if (Vars.net.client() || !isFull() || Vars.state.gameOver) return;
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
                if (coreDying[cb.id] !== undefined) { cb.health = cb.maxHealth; continue; }
                let r = shieldRec(cb.id);
                r.seen = shieldStamp;
                if (inv && cb.health < cb.maxHealth) cb.health = cb.maxHealth;
                                let prot = shieldProtectedByReflect(cb);
                r.prot = prot;
                r.b = cb;
                r.base = cb.health;
                r.inv = inv;
                r.pre = cb.health + (inv || prot ? SHIELD_BUFFER : Math.max(r.hp, 0) + SHIELD_BUFFER);
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

    function startCoreDeath(cb) {
        if (coreDying[cb.id] !== undefined) return;
        coreDying[cb.id] = { b: cb, t: 0 };
        coreDeathFx(cb.x, cb.y, CORE_DIE_TICKS);
        try { if (Vars.net.server()) Call.clientPacketReliable(CORE_KIND, Math.round(cb.x) + "|" + Math.round(cb.y) + "|" + CORE_DIE_TICKS); } catch (err) {}
    }
    // client: bắt đầu hoạt ảnh camera + hiệu ứng nổ dồn
    function coreDeathFx(x, y, dur) {
        if (Vars.headless) return;
        coreCine = { x: x, y: y, t: 0, dur: dur, fx: 0 };
    }
    // lõi chết theo đường khác (không qua khiên): chiếu camera ngay lúc nổ
    // pháo do mode xây: tháo/phá thì biến mất ngay, không hoàn trả item (pháo tự về túi đồ nhờ feedTurrets)
    function isModeTurretPos(pos) {
        for (let k in byId) {
            let st = byId[k];
            if (st != null && st.p != null && st.p.indexOf(pos) >= 0) return true;
        }
        return false;
    }

    Events.on(BlockBuildBeginEvent, new Cons({ get: function(e) {
        try {
            if (Vars.net.client() || !isActive() || !e.breaking || e.tile == null) return;
            let cb = e.tile.build;
            if (cb == null) return;
            let prev = cb.prevBuild;
            if (prev == null || prev.size < 1) return;
            let ob = prev.first();
            if (ob == null) return;
            if (hostOwner[ob.id] === undefined && !isModeTurretPos(ob.tile.pos())) return;
            e.tile.setNet(Blocks.air, Team.derelict, 0);
        } catch (err) { logOnce("nodecon", "no-refund failed: " + err); }
    } }));

    Events.on(BlockDestroyEvent, new Cons({ get: function(e) {
        try {
            if (Vars.net.client() || !isFull()) return;
            let b = e.tile.build;
            if (b == null || !(b.block instanceof Packages.mindustry.world.blocks.storage.CoreBlock)) return;
            if (coreKilled[b.id]) { delete coreKilled[b.id]; return; }
            coreDeathFx(b.x, b.y, 30);
            if (Vars.net.server()) Call.clientPacketReliable(CORE_KIND, Math.round(b.x) + "|" + Math.round(b.y) + "|30");
        } catch (err) {}
    } }));
    Events.run(Trigger.update, new Runnable({ run: function() {
        if (Vars.net.client()) return;
        for (let id in coreDying) {
            let d = coreDying[id];
            d.t += Time.delta;
            let cb = d.b;
            if (cb == null || !cb.isValid()) { delete coreDying[id]; continue; }
            cb.health = cb.maxHealth;
            if (d.t >= CORE_DIE_TICKS) {
                delete coreDying[id];
                coreKilled[cb.id] = true;
                try { cb.health = 0; cb.kill(); } catch (err) {}
            }
        }
    } }));

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
            if (r.prot) {
                let hp0 = r.base - loss;
                if (hp0 > 0) cb.health = hp0;
                else { cb.health = cb.maxHealth; startCoreDeath(cb); }
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
                    cb.health = cb.maxHealth;
                    startCoreDeath(cb);
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
        p = ownerPl(unit);
        let st = null;
        if (p != null) st = byId[p.id];
        else {
            let pid = soldierOwner[unit.id];
            if (pid !== undefined) st = byId[pid];
        }
        if (st == null) return null;
        if (st.pi === PILOT_HIST) { // histeka: +1 điểm nâng cấp cho toàn thẻ ở trang chỉ số
            let h = st._hs;
            if (h == null) { h = st._hs = st.s.slice(); }
            for (let i = 0; i < h.length; i++) h[i] = i !== STAT_ARMY ? Math.min(st.s[i] + 1, statMax(i)) : st.s[i];
            return h;
        }
        return st.s;
    }

    function statsStateOf(unit) {
        let p = null;
        p = ownerPl(unit);
        if (p != null) return byId[p.id];
        let pid = soldierOwner[unit.id];
        return pid !== undefined ? byId[pid] : null;
    }

    // empixeand: máu < 50% -> 50% hồi đầy máu, hồi chiêu 5 phút (chỉ tung xúc xắc 1 lần mỗi lần tụt xuống dưới ngưỡng)
    // xakypilot: quãng Dash an toàn. Không quân: bay xuyên (chỉ giới hạn trong map). Bộ binh: dừng cách tường/công trình 1 ô.
    function xakyDashDist(u, ang) {
        let d = XAKY_DASH;
        if (u.isFlying()) return d;
        for (let l = 4; l <= d; l += 4) {
            let t = Vars.world.tileWorld(u.x + Angles.trnsx(ang, l), u.y + Angles.trnsy(ang, l));
            if (t == null || t.solid()) return Math.max(0, l - 4 - 8 - u.hitSize / 2);
        }
        return d;
    }

    function xakyCheck(unit, pl, st) {
        let id = pl.id;
        let hp = unit.health + unit.shield;
        let r = xakyPrev[id];
        xakyPrev[id] = { u: unit.id, hp: hp, mh: unit.maxHealth };
        if (r == null || r.u !== unit.id || r.mh !== unit.maxHealth || hp >= r.hp - 0.01) return;
        if (st.lv < XAKY_MIN_LEVEL || unit.dead) return;
        let at = xakyCdAt[id];
        if (at !== undefined && Time.time >= at && Time.time - at < XAKY_CD) return;
        let ang = unit.vel.len() > 0.1 ? unit.vel.angle() : unit.rotation;
        let d = xakyDashDist(unit, ang);
        if (d < 4) return; // sát tường: không Dash, không tốn hồi chiêu
        let ox = unit.x, oy = unit.y;
        let nx = ox + Angles.trnsx(ang, d), ny = oy + Angles.trnsy(ang, d);
        nx = Mathf.clamp(nx, 0, Vars.world.width() * Vars.tilesize);
        ny = Mathf.clamp(ny, 0, Vars.world.height() * Vars.tilesize);
        unit.set(nx, ny);
        xakyCdAt[id] = Time.time;
        pilotFxAt[id] = Time.time;
        try { Call.effect(Fx.spawnShockwave, ox, oy, 0, Color.white); Call.effect(Fx.spawnShockwave, nx, ny, 0, Color.white); } catch (err) {}
        try { if (Vars.net.server()) Call.clientPacketReliable(PFX_KIND, id + "x"); } catch (err) {}
    }

    function empixFx(id) {
        try { pilotFxAt[id] = Time.time; } catch (err) {}
        try { if (Vars.net.server()) Call.clientPacketReliable(PFX_KIND, String(id)); } catch (err) {}
    }
    function empixHeal(unit) {
        let pl = null;
        pl = ownerPl(unit);
        if (pl == null || unit.dead || unit.health <= 0) return;
        let id = pl.id;
        if (unit.health >= unit.maxHealth * EMPIX_HEAL_HP) { empixLow[id] = false; return; }
        if (empixLow[id]) return;
        let at = empixCdAt[id];
        if (at !== undefined && Time.time - at < EMPIX_HEAL_CD && Time.time >= at) return; // đang hồi chiêu
        empixLow[id] = true;
        if (Math.random() < EMPIX_HEAL_CHANCE) {
            unit.health = unit.maxHealth;
            empixCdAt[id] = Time.time;
            empixFx(id);
            try { Fx.healWaveMend.at(unit.x, unit.y, unit.hitSize); } catch (err) {}
            toast(pl, tr("[accent]Empixeand Pilot đã hồi đầy máu cho bạn! (hồi chiêu 5 phút)", "[accent]Empixeand Pilot fully healed you! (5 min cooldown)"));
        }
    }

    // empixeand: bị hạ gục (vd. one hit) vẫn có 50% tỉ lệ hồi sinh đầy máu tại chỗ, dùng chung hồi chiêu 5 phút
    function empixRevive(u) {
        let pl = null;
        pl = ownerPl(u);
        if (pl == null) return false;
        let st = byId[pl.id];
        if (st == null || st.pi !== PILOT_EMPIX) return false;
        let id = pl.id;
        if (empixLow[id]) return false; // đã tung xúc xắc ở lần tụt máu này
        let at = empixCdAt[id];
        if (at !== undefined && Time.time - at < EMPIX_HEAL_CD && Time.time >= at) return false;
        empixLow[id] = true;
        if (!(Math.random() < EMPIX_HEAL_CHANCE)) return false;
        empixCdAt[id] = Time.time;
        let type = u.type, team = u.team, x = u.x, y = u.y, rot = u.rotation, sbc = true;
        try { sbc = u.spawnedByCore; } catch (err) {}
        Time.run(1, new Runnable({ run: function() {
            try {
                let cur = pl.unit();
                if (cur != null && cur.isValid() && !cur.dead && cur.type !== UnitTypes.block) cur.remove();
                let nu = type.create(team);
                nu.set(x, y);
                nu.rotation = rot;
                try { nu.spawnedByCore = sbc; } catch (err) {}
                nu.add();
                nu.health = nu.maxHealth;
                pl.unit(nu);
                prevUnit[pl.id] = nu;
                empixLow[id] = false;
                empixFx(id);
                try { Fx.healWaveMend.at(x, y, nu.hitSize); } catch (err) {}
                toast(pl, tr("[accent]Empixeand Pilot đã cứu bạn khỏi cái chết! (hồi chiêu 5 phút)", "[accent]Empixeand Pilot saved you from death! (5 min cooldown)"));
            } catch (err) { logOnce("empixrevive", "empix revive failed: " + err); }
        } }));
        return true;
    }

    function applyStats(unit) {
        if (!isActive() || (!isFull() && !isTierUnit(unit))) return;
        let s = statsOf(unit);
        if (s == null) return;
        let stOwn = statsStateOf(unit);
        let rc = roleCounts(stOwn);

        let isPl = false;
        try { isPl = unit.isPlayer() || botUnitOf(unit) != null; } catch (err) {}
        let tHp = unit.type.health;
        if (isPl && unit.type === UnitTypes.reign) tHp *= REIGN_HP_MUL;
        let hpT = (tHp * (1 + s[0] * HP_PCT / 100) + s[0] * HP_FLAT) * (1 + Math.min(ROLE_HP_MAX, rc.brl * ROLE_HP_PCT) / 100);
        let empixOn = isPl && stOwn != null && stOwn.pi === PILOT_EMPIX;
        if (empixOn) hpT *= 1 + EMPIX_HP_PCT;
        let xakyOn = isPl && stOwn != null && stOwn.pi === PILOT_XAKY;
        if (xakyOn) hpT *= XAKY_HP_MUL;
        let histOn = isPl && stOwn != null && stOwn.pi === PILOT_HIST;
        if (histOn) hpT *= 1 + HIST_STAT_PCT;
        if (Math.abs(unit.maxHealth - hpT) > 0.5) {
            let diff = hpT - unit.maxHealth;
            unit.maxHealth = hpT;
            if (diff > 0) unit.health += diff;
            else if (unit.health > hpT) unit.health = hpT;
        }

        unit.armor = (unit.type.armor + s[1] * ARM_FLAT) * (1 + rc.def * ROLE_ARM_PCT / 100) + rc.def * ROLE_ARM_FLAT;
        if (histOn) unit.armor *= 1 + HIST_STAT_PCT;
        let cut = Math.min(ROLE_CUT_CAP, armorCut(s[1]) + rc.def * ROLE_CUT_PCT);
        if (cut > 0) unit.healthMultiplier *= 1 / (1 - cut / 100);

        let dm = (1 + s[2] * ATK_PCT / 100) * (1 + Math.min(ROLE_ATK_MAX, rc.atk * ROLE_ATK_PCT) / 100);
        if (s[5] > 0 && Math.random() < s[5] * 0.02) dm *= 1.5 + s[6] * 0.12;
        if (empixOn) dm *= 1 + EMPIX_ATK_PCT;
        if (histOn) dm *= 1 + HIST_STAT_PCT;
        unit.damageMultiplier *= dm;
        if (empixOn && !Vars.net.client()) empixHeal(unit);
        let base = Math.max(0.1, unit.type.speed);
        unit.speedMultiplier *= (1 + s[3] * SPD_PCT / 100) * (1 + s[3] * SPD_FLAT / base);
        if (isPl && unit.type === UnitTypes.disrupt) unit.speedMultiplier *= DISRUPT_SPEED_MUL;
        if (xakyOn) unit.speedMultiplier *= XAKY_SPD_MUL;
        if (histOn) unit.speedMultiplier *= 1 + HIST_STAT_PCT;
        unit.reloadMultiplier *= 1 + s[4] * 0.06;
        if (histOn) {
            unit.reloadMultiplier *= 1 + HIST_STAT_PCT;
            if (!Vars.net.client() && unit.health > 0) {
                // hồi máu + khiên cá nhân tự hồi
                if (unit.health < unit.maxHealth) unit.health = Math.min(unit.maxHealth, unit.health + unit.maxHealth * HIST_REGEN_PCT / 100 * Time.delta / 60);
                let shCap = unit.maxHealth * HIST_SHIELD_PCT;
                if (unit.shield < shCap) unit.shield = Math.min(shCap, unit.shield + shCap * 0.1 * Time.delta / 60);
            }
        }
        if (s[8] > 0 && !Vars.net.client() && unit.health > 0 && unit.health < unit.maxHealth * REGEN_THRESHOLD) {
            unit.health = Math.min(unit.maxHealth, unit.health + unit.maxHealth * s[8] * REGEN_PCT / 100 * Time.delta / 60);
        }
        if (s[10] > 0) unit.damageMultiplier *= 1 + s[10] * DMG_PER_ARMOR * unit.armor;
        if (isPl && malignEquipped(stOwn)) {
            unit.speedMultiplier *= MALIGN_SPEED_MUL;
            unit.damageMultiplier *= 1 + MALIGN_ATK_PCT / 100;
            unit.reloadMultiplier *= MALIGN_RELOAD_MUL;
        }
        let nLu = equippedCount(stOwn, LUSTRE_ID);
        if (nLu > 1) unit.damageMultiplier *= 1 + (nLu - 1) * LUSTRE_ATK_PCT / 100;
        let nSm = equippedCount(stOwn, SMITE_ID);
        if (nSm > 1) unit.damageMultiplier *= 1 + (nSm - 1) * SMITE_ATK_PCT / 100;
        if (equippedCount(stOwn, "duo") > 0 || equippedCount(stOwn, "breach") > 0) unit.speedMultiplier *= 1 + LIGHT_SPD_PCT / 100;
        if (xakyOn && !Vars.net.client()) xakyCheck(unit, ownerPl(unit), stOwn);
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
            if (b.time > 3) return;
            let o = b.owner;
            if (o == null) return;
            if (rolled[b.id] === 1) return;
            let s = null;
            let st = null;
            let isUnitOwner = typeof o.getPlayer === "function";
            if (isUnitOwner) {
                st = statsStateOf(o);
            } else {
                let hp = hostOwner[o.id];
                if (hp === undefined) return;
                st = byId[hp];
            }
            s = st != null ? st.s : null;
            if (s == null) return;
            rolled[b.id] = 1;
            rolledN++;
            if (isUnitOwner) {
                // đang trang bị malign: đạn của người chơi sống ngắn hơn
                let isPl = false;
                try { isPl = o.isPlayer() || botUnitOf(o) != null; } catch (err) {}
                if (s[STAT_ARMY] > 0 && soldierOwner[o.id] !== undefined) {
                    let rangeMul = 1 + s[STAT_ARMY] * RANGE_PCT / 100;   // tối đa +100% (tầm bắn & tốc độ bay)
                    let lifeMul = 1 + s[STAT_ARMY] * LIFE_PCT / 100;     // tối đa +200% (thời gian tồn tại), dư thời lượng để đạn bay kịp tới tầm xa hơn
                    try { b.lifetime *= lifeMul; } catch (err) {}
                    try { b.vel.scl(rangeMul); } catch (err) {}
                }
                if (isPl && malignEquipped(st)) {
                    try { b.lifetime *= MALIGN_LIFE_MUL; } catch (err) {}
                }
                if (isPl && st.pi === PILOT_HIST) {
                    try { b.lifetime *= 1 + HIST_STAT_PCT; } catch (err) {}
                }
            }
            if (s[2] > 0) {
                try { b.damage += s[2] * ATK_FLAT; } catch (err) {}
            }
            if (!isUnitOwner) {
                // pháo xây: bạo kích + sát thương theo giáp (unit thì đã tính trong applyStats)
                try {
                    if (s[5] > 0 && Math.random() < s[5] * 0.02) b.damage *= 1.5 + s[6] * 0.12;
                    if (s[10] > 0) b.damage *= 1 + s[10] * DMG_PER_ARMOR * (s[1] * ARM_FLAT);
                } catch (err) {}
            }
            let histPierce = isUnitOwner && st.pi === PILOT_HIST;
            if ((s[7] > 0 || histPierce) && !b.type.pierceArmor && Math.random() < s[7] * 0.05 + (histPierce ? HIST_PIERCE_ADD : 0)) {
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
            if (s[2] > 0 || s[5] > 0 || s[7] > 0 || s[10] > 0 || s[11] > 0) return true;
            if (malignEquipped(byId[id])) return true;
            if (byId[id].pi === PILOT_HIST) return true;
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
        try { nu.spawnedByCore = !isBotPl(pl); } catch (err) {} // bot: false, nếu không game sẽ despawn unit sau khi lên cấp
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
        if (!returnZoneOn()) return true;
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

        let spec = bvbOn();
        let fromBot = !spec && !pvbOn() && bots.length > 0 && bots[0].botPl.team().cores().size > 0;
        if (spec) {
            team = Team.derelict; // Bot vs Bot: người chơi chỉ xem
        } else if (pvbOn()) {
            team = pvbHumanTeam(); // Player vs Bot: mọi người cùng 1 phe
        } else if (fromBot) {
            team = bots[0].botPl.team(); // người thật vào -> thay chỗ bot
        } else if (isHost) {
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

        if (!spec) asg[uid] = team.id;
        seenPl[pl.id] = team;
        if (pl.team() != team) pl.team(team);
        if (spec) { try { let u0 = pl.unit(); if (u0 != null && !u0.dead) u0.remove(); } catch (err) {} }
        if (fromBot) replaceBot(pl);

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
            if (botUnitOf(u) != null) return;
            if (orphanTypes == null) { orphanTypes = []; for (let k = 1; k <= TIER_MAX; k++) orphanTypes.push(tierType(k)); }
            for (let lv = 0; lv < orphanTypes.length; lv++) {
                if (u.type === orphanTypes[lv]) {
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

    // Map ngoài: bấm "biến về" lần 1 -> drone vanilla (xây dựng), lần 2 -> unit PvP, cứ thế lặp lại. Không cần nền đặt lõi.
    let extPvp = {};
    function extSwap(pl, st, u) {
        let cr = pl.team().core();
        let isCoreUnit = cr != null && u.type === cr.block.unitType;
        let isTier = isTierUnit(u);
        let mode = extPvp[pl.id];
        if (mode === undefined) mode = true; // vào map: dùng unit PvP, bấm về lần 1 -> drone
        let pv = prevUnit[pl.id];
        if (isTier) mode = true;
        else if (isCoreUnit && pv != null && pv !== u && !pv.dead && pv.team == pl.team()) mode = !mode; // vừa bấm biến về (unit cũ không chết)
        extPvp[pl.id] = mode;
        if (!mode || (!isTier && !isCoreUnit)) {
            delete swapPending[pl.id];
            prevUnit[pl.id] = u;
            return;
        }
        let want = tierType(activeTier(st));
        if (u.type === want && u.team == pl.team()) {
            delete swapPending[pl.id];
            prevUnit[pl.id] = u;
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

    const eachPlayerServer = new Cons({
        get: function(pl) {
            if (isFull()) assignTeam(pl);
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
            if (!isFull()) { extSwap(pl, st, u); return; }
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
        eachPl(new Cons({
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
            if (!pvpOn(pl)) return;
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
        eachPl(new Cons({ get: function(pl) { present[pl.id] = true; } }));
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
        let nowT = Time.time;
        for (let k1 in teamHit) { if (nowT - teamHit[k1].t > KILL_CREDIT_TICKS) delete teamHit[k1]; }
        for (let k2 in lastHitBy) { if (nowT - lastHitBy[k2].t > KILL_CREDIT_TICKS) delete lastHitBy[k2]; }
        for (let k3 in soldierAI) { if (Groups.unit.getByID(parseInt(k3)) == null) delete soldierAI[k3]; }
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

    // có công trình địch (tường...) chắn giữa lính và mục tiêu?
    function soldierWallBetween(u, tg) {
        try {
            if (u.isFlying()) return false;
            let d = Mathf.dst(u.x, u.y, tg.x, tg.y);
            for (let l = 12; l < d - 16; l += 8) {
                let f = l / d;
                let t = Vars.world.tileWorld(u.x + (tg.x - u.x) * f, u.y + (tg.y - u.y) * f);
                if (t != null && t.solid() && (t.build == null || (t.build !== tg && t.build.team !== u.team))) return true;
            }
        } catch (err) {}
        return false;
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
            let room = cfg.cap + wallBonus(st) - alive.length;
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

    // AI lính: mục tiêu vào tầm bắn -> dừng lại diệt (khóa mục tiêu đó); ra khỏi tầm -> bỏ qua, quay lại GroundAI (đi đánh lõi địch)
    let soldierAI = {};
    const anyTarget = new Boolf({ get: function(e) { return true; } });
    const eachSoldierAI = new Cons({
        get: function(pl) {
            let list = soldiers[pl.id];
            if (list == null) return;
            let stO = byId[pl.id], cmdOn = stO != null && stO.cmd === 1, anchor = null, atk = null, hasRally = false;
            if (cmdOn) {
                anchor = rally[pl.id];
                hasRally = anchor != null;
                if (anchor != null && (anchor.uid !== undefined || anchor.bpos !== undefined)) { // mục tiêu tấn công: bám theo vị trí hiện tại
                    let tu2 = anchor.uid !== undefined ? Groups.unit.getByID(anchor.uid) : Vars.world.build(anchor.bpos);
                    if (tu2 != null && tu2.isValid() && !tu2.dead && tu2.team != pl.team()) { anchor = { x: tu2.x, y: tu2.y }; atk = tu2; }
                    else { delete rally[pl.id]; anchor = null; }
                }
                if (anchor == null) { let ou = pl.unit(); if (ou != null && ou.isValid() && !ou.dead) anchor = { x: ou.x, y: ou.y }; }
            }
            for (let i = 0; i < list.length; i++) {
                let u = Groups.unit.getByID(list[i]);
                if (u == null || !u.isValid() || u.dead) { delete soldierAI[list[i]]; continue; }
                try {
                    let s = soldierAI[u.id];
                    if (s === undefined) { s = { t: Math.floor(Math.random() * 10), tg: null, hold: false }; soldierAI[u.id] = s; }
                    if (cmdOn) { // chế độ ra lệnh: dùng CommandAI của game (tự tìm đường, né vật cản, tự đánh)
                        let ai = s.isCmd ? u.controller() : null;
                        if (ai == null) { ai = new Packages.mindustry.ai.types.CommandAI(); u.controller(ai); s.isCmd = true; s.hold = false; s.cmdKey = null; s.cmdT = 0; }
                        if (anchor != null) {
                            let key = atk != null ? "a" + atk.id : (hasRally ? "p" + Math.round(anchor.x) + "," + Math.round(anchor.y) : "f");
                            s.cmdT -= Time.delta;
                            if (key !== s.cmdKey || (key === "f" && s.cmdT <= 0 && (s.lx === undefined || Mathf.dst(anchor.x, anchor.y, s.lx, s.ly) > 64))) {
                                s.cmdKey = key;
                                s.cmdT = 45 + Math.floor(Math.random() * 30);
                                s.lx = anchor.x; s.ly = anchor.y;
                                if (atk != null) ai.commandTarget(atk, false);
                                else if (key === "f" && Mathf.dst(u.x, u.y, anchor.x, anchor.y) <= 110) ai.clearCommands();
                                else ai.commandPosition(Tmp.v2.set(anchor.x, anchor.y));
                            }
                        }
                        continue;
                    }
                    if (s.isCmd) { s.isCmd = false; s.hold = false; let g0 = groundAI(); if (g0 != null) u.controller(g0); }
                    s.rT = (s.rT || 0) - Time.delta;
                    if (s.rT <= 0 || s.r0 === undefined) { s.rT = 60; s.r0 = u.range(); }
                    let rng = s.r0;
                    let sst = byId[soldierOwner[u.id]];
                    if (sst != null && sst.s[STAT_ARMY] > 0) rng *= 1 + sst.s[STAT_ARMY] * RANGE_PCT / 100;
                    if (s.hp !== undefined && u.health < s.hp - 0.01) s.hurt = 300;
                    s.hp = u.health;
                    if (s.hurt > 0) {
                        s.hurt -= Time.delta;
                        s.cgT = (s.cgT || 0) - Time.delta;
                        if (s.cg != null && Units.invalidateTarget(s.cg, u.team, u.x, u.y)) s.cg = null;
                        if (s.cg == null && s.cgT <= 0) {
                            s.cgT = 10;
                            s.cg = Units.closestTarget(u.team, u.x, u.y, Math.max(rng * 2.5, 480), anyTarget, anyTarget);
                        }
                        if (s.cg != null) {
                            if (!s.hold) { s.hold = true; u.controller(new Packages.mindustry.ai.types.NoAI()); }
                            // bị bắn: đứng lại bắn trả, giữ khoảng cách an toàn (không chạy về lõi)
                            let cd = Mathf.dst(u.x, u.y, s.cg.x, s.cg.y);
                            u.lookAt(s.cg.x, s.cg.y);
                            u.aim(s.cg.x, s.cg.y);
                            u.controlWeapons(true, true); // luôn bắn, kể cả khi đang lùi
                            s.wbT = (s.wbT || 0) - Time.delta;
                            if (s.wbT <= 0) { s.wbT = 6; s.wb = soldierWallBetween(u, s.cg); }
                            if (s.wb) {
                                u.movePref(Tmp.v1.setZero());
                            } else {
                                if (cd > rng * 0.85) soldierGo(u, s, s.cg.x, s.cg.y, rng * 0.75);
                                else if (cd < rng * 0.55 && cd > 1) soldierGo(u, s, s.cg.x + (u.x - s.cg.x) / cd * rng * 0.7, s.cg.y + (u.y - s.cg.y) / cd * rng * 0.7, 8); // lùi ra tầm an toàn
                                else u.movePref(Tmp.v1.setZero());
                            }
                            continue;
                        }
                    }
                    if (s.tg != null && Units.invalidateTarget(s.tg, u.team, u.x, u.y, rng)) s.tg = null; // ra khỏi tầm / chết -> bỏ
                    s.t -= Time.delta;
                    if (s.tg == null && s.t <= 0) {
                        s.t = 10;
                        s.tg = Units.closestTarget(u.team, u.x, u.y, rng, anyTarget, anyTarget);
                    }
                    if (s.tg != null) {
                        if (!s.hold) { s.hold = true; u.controller(new Packages.mindustry.ai.types.NoAI()); }
                        if (s.tgRef !== s.tg) { s.tgRef = s.tg; s.aimT = 0; s.approachLv = 0; } // đổi mục tiêu -> reset đếm giờ nhắm
                        u.lookAt(s.tg.x, s.tg.y);
                        u.aim(s.tg.x, s.tg.y);
                        u.controlWeapons(true, true);
                        // Nhắm cùng 1 mục tiêu vài giây mà chưa hạ được (có thể đang bắn trượt) -> tiến gần hơn để tăng khả năng trúng
                        s.aimT = (s.aimT || 0) + Time.delta;
                        if (s.aimT > 180 && (s.approachLv || 0) < 2) {
                            s.aimT = 0;
                            s.approachLv = (s.approachLv || 0) + 1;
                        }
                        if (s.approachLv > 0) {
                            let closeDist = rng * (s.approachLv === 1 ? 0.5 : 0.22);
                            if (Mathf.dst(u.x, u.y, s.tg.x, s.tg.y) > closeDist) soldierGo(u, s, s.tg.x, s.tg.y, closeDist);
                            else u.movePref(Tmp.v1.setZero());
                        }
                    } else if (cmdOn) {
                        // chế độ ra lệnh: không tự đi đánh lõi; về điểm tập kết (hoặc đi theo chủ), thấy địch trong tầm thì bắn
                        if (!s.hold) { s.hold = true; u.controller(new Packages.mindustry.ai.types.NoAI()); }
                        u.controlWeapons(false, false);
                        if (anchor != null && Mathf.dst(u.x, u.y, anchor.x, anchor.y) > 110) soldierGo(u, s, anchor.x, anchor.y, 90);
                        else u.movePref(Tmp.v1.setZero());
                    } else if (s.hold) {
                        s.hold = false;
                        u.controlWeapons(false, false);
                        let ai = groundAI();
                        if (ai != null) u.controller(ai);
                    }
                } catch (err) { logOnce("soldierai", "soldier AI failed: " + err); }
            }
        }
    });

    // như botGo nhưng chỉ hỏi controlPath mỗi ~10 tick (botGo hỏi mỗi frame cho từng lính -> rất nặng)
    function soldierGo(u, s, tx, ty, stopDist) {
        let v = Tmp.v1;
        if (Mathf.dst(u.x, u.y, tx, ty) <= stopDist) { v.setZero(); u.movePref(v); return; }
        s.pT = (s.pT || 0) - Time.delta;
        if (s.pT <= 0 || s.px === undefined) {
            s.pT = 10 + Math.floor(Math.random() * 4);
            s.px = tx; s.py = ty;
            try {
                botGoal.set(tx, ty);
                let r = Vars.controlPath.getPathPosition(u, botGoal, botGoal);
                if (!r.unreachable) {
                    if (r.move) { s.px = r.dest.x; s.py = r.dest.y; } else { s.px = u.x; s.py = u.y; }
                }
            } catch (err) {}
        }
        v.set(s.px - u.x, s.py - u.y);
        if (v.len() > 0.1) v.setLength(u.speed()); else v.setZero();
        u.movePref(v);
    }

    function placeWall(pl, lv, tx, ty) {
        let core = pl.team().core();
        let blk = wallBlock(lv);
        if (core == null || blk == null) return -1;
        if (!canBuildAt(core, enemyCores(core.team), blk, tx, ty)) return -1;
        let tile = Vars.world.tile(tx, ty);
        if (tile == null) return -1;
        tile.setNet(blk, pl.team(), 0);
        let b = tile.build;
        if (b == null || b.block !== blk) return -1;
        fx(b.x, b.y);
        return tile.pos();
    }

    // tường bị phá -> về túi đồ (giữ cấp), xây lại được
    const eachWall = new Cons({
        get: function(pl) {
            let st = byId[pl.id];
            if (st == null || !(st.w >= 0)) return;
            let blk = wallBlock(st.wl || 0), b = Vars.world.build(st.w);
            if (b == null || !b.isValid() || b.block !== blk || b.team != pl.team()) {
                st.w = IN_BAG;
                try { toast(pl, tr("[scarlet]Khối tường bị phá, đã về túi đồ.", "[scarlet]Wall destroyed, returned to your bag.")); } catch (err) {}
                changed();
            }
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

    // ===== Bot A.I: 1 người chơi -> đấu với bot; người thứ 2 vào sẽ thay chỗ bot =====
    // Bot chỉ: đuổi bắn unit wave để cày cấp, dùng điểm mua/xây pháo quanh lõi.
    // Bot tự nâng chỉ số bằng điểm dư; đổi unit/pilot theo player địch sau khi nhìn thấy (<=80 ô) và biến về nhà.
    const BOT_ID = -4242;
    const BOT_LEASH = 3200;  // không đuổi mục tiêu xa lõi hơn mức này (đơn vị thế giới)
    const BOT_HOME_R = 110;  // đứng chờ gần lõi trong bán kính này
    const BOT_SPOT_TRIES = 400;
    const BOT_SPOT_RANGE = 80; // tìm chỗ xây trong bán kính (ô) quanh lõi; ưu tiên gần lõi
    const BOT_NO_TURRET = { tractor: true, point: true };

    // lặp qua người chơi thật + bot
    function eachPl(cons) {
        if (bvbOn()) Groups.player.each(new Cons({ get: function(p) { if (p.team() != Team.derelict) cons.get(p); } }));
        else Groups.player.each(cons);
        for (let i = 0; i < bots.length; i++) if (bots[i] != null) cons.get(bots[i].botPl);
    }

    function makeBotPl(team, id, k) {
        let o = { id: id, name: "[orange]BOT[] NexBot" + (k > 0 ? " " + (k + 1) : ""), admin: false, shooting: false, deathTimer: 0, _team: team, _unit: null };
        o.team = function(t) {
            if (t !== undefined) { o._team = t; return t; }
            return o._team;
        };
        o.unit = function(x) {
            if (x === undefined) return o._unit;
            o._unit = x;
            if (x != null) {
                try { x.controller(new Packages.mindustry.ai.types.NoAI()); } catch (err) {} // tự điều khiển bằng botTick
            }
            return x;
        };
        o.uuid = function() { return "bot:" + id; };
        return o;
    }

    // đội có lõi, chưa có người thật. Trả null nếu còn người chưa được xếp đội
    function botTeam() {
        let pending = false;
        Groups.player.each(new Cons({ get: function(p) { if (seenPl[p.id] === undefined) pending = true; } }));
        if (pending) return null;
        let tl = pvpTeams();
        for (let i = 0; i < tl.length; i++) {
            let t = tl[i];
            if (t.cores().size === 0) continue;
            let human = false;
            Groups.player.each(new Cons({ get: function(p) { if (p.team() == t) human = true; } }));
            if (!human) return t;
        }
        return null;
    }

    function wipeBuilt(st) {
        let defs = droneDefs();
        for (let i = 0; i < st.p.length; i++) {
            if (st.p[i] >= 0) removeTurret(st.p[i], defs.map[st.d[i]]);
        }
    }

    function createBot(team) {
        let k = 0;
        while (botOf(BOT_ID - k) != null) k++;
        let ctx = newBotCtx();
        ctx.botPl = makeBotPl(team, BOT_ID - k, k);
        bots.push(ctx);
        let pl = ctx.botPl;
        seenPl[pl.id] = team;
        let st = bind(pl), pils = [PILOT_XIKI, PILOT_XAKY, PILOT_HIST];
        st.pi = pils[k % pils.length];
        let src = null; // bot mới vào: lấy 1 phần tiến độ của đồng đội để theo kịp
        for (let i = 0; i < bots.length; i++) {
            if (bots[i] === ctx || bots[i].botPl.team() !== team) continue;
            let s0 = byId[bots[i].botPl.id];
            if (s0 != null && (src == null || s0.lv > src.lv)) src = s0;
        }
        if (src != null) { st.lv = src.lv; st.s = src.s.slice(); st.b = src.b || 0; st.pts = Math.floor(src.pts * 0.5); changed(); }
        try {
            if (global.NexNet != null && bots.length === 1) {
                global.NexNet.toastAll("[#" + String(team.color) + "]■[] " + tr("[accent]Bot NexBot giữ chỗ đối thủ - có người vào sẽ nhường chỗ.", "[accent]NexBot holds the opponent slot - it leaves when a player joins."), 4);
            }
        } catch (err) {}
    }

    function removeBot(wipe, ctx) {
        ctx = ctx || BC;
        let p = ctx.botPl;
        if (p == null) return;
        let ix = bots.indexOf(ctx);
        if (ix >= 0) bots.splice(ix, 1);
        let st = byId[p.id];
        if (wipe && st != null) { try { wipeBuilt(st); } catch (err) {} }
        try {
            let u = p._unit;
            if (u != null && u.isValid()) Call.unitDespawn(u);
        } catch (err) {
            try { p._unit.remove(); } catch (err2) {}
        }
        delete byId[p.id];
        delete seenPl[p.id];
        delete prevUnit[p.id];
        delete store[p.uuid()];
        if (BC === ctx) BC = newBotCtx();
        changed();
    }

    // người thật vào: kế thừa cấp + pháo của bot nếu người đó chưa có tiến độ, ngược lại dọn pháo bot
    function replaceBot(pl) {
        let ctx = bots[0];
        if (ctx == null) return;
        let bp = ctx.botPl;
        let bst = byId[bp.id];
        let hst = bind(pl);
        let inherit = bst != null && hst.lv <= 1 && hst.exp <= 0 && hst.d.length === 0;
        if (inherit) {
            byId[pl.id] = bst;
            store[getUid(pl)] = bst;
            for (let i = 0; i < bst.p.length; i++) {
                if (!(bst.p[i] >= 0)) continue;
                let b = Vars.world.build(bst.p[i]);
                if (b != null) hostOwner[b.id] = pl.id;
            }
        }
        removeBot(!inherit, ctx);
    }

    // danh sách đội cần có bot (1 phần tử = 1 bot)
    function botDesired() {
        let out = [], tl = pvpTeams();
        if (bvbOn()) { // Bot vs Bot: mỗi phe 1 bot
            for (let i = 0; i < tl.length; i++) if (tl[i].cores().size > 0) out.push(tl[i]);
            return out;
        }
        let n = Groups.player.size();
        if (n < 1) return out;
        if (pvbOn()) { // Player vs Bot: số bot = số người chơi, cùng 1 phe đối diện
            let bt = bots.length > 0 ? bots[0].botPl.team() : null;
            if (bt == null || bt.cores().size === 0) {
                let ht = pvbHumanTeam();
                bt = null;
                for (let i = 0; i < tl.length; i++) if (tl[i] != ht && tl[i].cores().size > 0) { bt = tl[i]; break; }
                if (bt == null) bt = claimCore();
            }
            if (bt != null) for (let i = 0; i < Math.min(n, BOT_MAX); i++) out.push(bt);
            return out;
        }
        if (n !== 1) return out; // 0 người: dọn; >=2 người: đã đủ đối thủ thật
        if (bots.length > 0) { out.push(bots[0].botPl.team()); return out; }
        let t = botTeam();
        if (t == null) t = claimCore(); // map chỉ có lõi bỏ hoang -> bot nhận lõi đó lập đội
        if (t == null) logOnce("botnoteam", "bot: không có đội/lõi trống để đặt bot (cores: " + derelictCores().length + ")", true);
        else out.push(t);
        return out;
    }

    function botManage() {
        if (!isFull() || Vars.state.gameOver || winning) {
            logOnce("botinactive", "bot: chế độ chưa active (isFull=" + isFull() + ")", true);
            return;
        }
        let pending = false;
        Groups.player.each(new Cons({ get: function(p) { if (seenPl[p.id] === undefined) pending = true; } }));
        if (pending) return;
        let want = botDesired(), need = {};
        for (let i = 0; i < want.length; i++) need[want[i].id] = (need[want[i].id] || 0) + 1;
        for (let i = bots.length - 1; i >= 0; i--) {
            let t = bots[i].botPl.team();
            if ((need[t.id] || 0) > 0) need[t.id]--;
            else removeBot(true, bots[i]);
        }
        for (let tid in need) {
            let tm = Team.get(parseInt(tid));
            for (let k = 0; k < need[tid]; k++) {
                createBot(tm);
                logOnce("botmade" + tm.id + "_" + k, "bot đã vào đội " + tm.name, true);
            }
        }
    }

    const BOT_PLAYER_AGGRO = 900; // thấy player địch trong bán kính này (quanh bot hoặc lõi) thì tấn công
    function botEnemyOk(e, u) {
        return e != null && e !== BC.botSkip && e.isValid() && !e.dead && e.team !== u.team;
    }
    // pr = tầm bắn pháo đã lắp của bot: chỉ CHUYỂN sang bắn player địch khi player đó lọt vào đúng tầm này, farm wave vẫn ưu tiên khi không có player trong tầm
    function pickWave(u, core, pr) {
        let wt = Vars.state.rules.waveTeam;
        let best = null;
        let bd = BOT_LEASH * BOT_LEASH;
        Groups.unit.each(new Cons({
            get: function(e) {
                if (!botEnemyOk(e, u)) return;
                let isWave = e.team === wt;
                let isSold = !isWave && soldierOwner[e.id] !== undefined; // lính của phe địch (từ nhà máy lính)
                if (!isWave && !isSold) return;
                if (Mathf.dst2(core.x, core.y, e.x, e.y) > BOT_LEASH * BOT_LEASH) return;
                let d = Mathf.dst2(u.x, u.y, e.x, e.y);
                if (isSold) { if (d > BOT_PLAYER_AGGRO * BOT_PLAYER_AGGRO) return; d *= 0.6; } // lính địch đang tới: ưu tiên dọn
                d *= 0.5 + 0.5 * Math.max(0, Math.min(1, e.health / Math.max(1, e.maxHealth))); // ưu tiên mục tiêu yếu máu để hạ nhanh
                if (d < bd) { bd = d; best = e; }
            }
        }));
        // player địch chỉ chen vào khi ĐANG trong tầm bắn của pháo bot (không rời mục tiêu wave vì player ở xa)
        let pr0 = pr > 0 ? pr : BOT_PLAYER_AGGRO;
        let pr2 = pr0 * pr0;
        eachPl(new Cons({
            get: function(p) {
                let e = p.unit();
                if (e == null || !botEnemyOk(e, u) || e.team === wt) return;
                let d = Mathf.dst2(u.x, u.y, e.x, e.y);
                if (d <= pr2 && d < bd) { bd = d; best = e; }
            }
        }));
        return best;
    }

    // đánh giá thế trận: true nếu bất lợi (máu thấp, hoặc kẻ địch quanh đây mạnh hơn nhiều)
    function botUnfavorable(u) {
        let hp = u.health + u.shield;
        if (u.health / u.maxHealth < 0.3) return true;
        let myDps = Math.max(1, u.type.estimateDps());
        let enemyHp = 0, enemyDps = 0, n = 0;
        let r2 = 450 * 450;
        Groups.unit.each(new Cons({
            get: function(e) {
                if (e.team === u.team || e.dead || !e.isValid() || Mathf.dst2(u.x, u.y, e.x, e.y) > r2) return;
                if (e.team === Team.derelict) return;
                enemyHp += e.health + e.shield;
                enemyDps += Math.max(1, e.type.estimateDps());
                n++;
            }
        }));
        if (n === 0) return false;
        // thời gian để địch hạ bot vs thời gian để bot hạ hết địch
        let tDie = hp / enemyDps;
        let tKill = enemyHp / myDps;
        return tDie < tKill * 0.8;
    }

    // đi tới (tx,ty) bằng pathfinding của game (né tường/địa hình); trả về false nếu không tới được
    function botGo(u, tx, ty, stopDist) {
        let v = Tmp.v1;
        let dist = Mathf.dst(u.x, u.y, tx, ty);
        if (dist <= stopDist) { v.setZero(); u.movePref(v); return true; }
        let ok = true;
        let dx = tx, dy = ty;
        try {
            botGoal.set(tx, ty);
            let r = Vars.controlPath.getPathPosition(u, botGoal, botGoal);
            if (r.unreachable) ok = false;
            else if (r.move) { dx = r.dest.x; dy = r.dest.y; }
            else { v.setZero(); u.movePref(v); return true; } // đường đang tính, chờ
        } catch (err) { logOnce("botpath", "controlPath lỗi, dùng đi thẳng: " + err); }
        v.set(dx - u.x, dy - u.y);
        if (v.len() > 0.1) v.setLength(u.speed()); else v.setZero();
        u.movePref(v);
        return ok;
    }

    function spawnBotUnit() {
        let core = BC.botPl.team().core();
        if (core == null) return;
        let st = bind(BC.botPl);
        let t = tierType(activeTier(st));
        let pos = corePosOf(core, t);
        if (pos == null) return;
        let nu = t.create(BC.botPl.team());
        nu.set(pos.x, pos.y);
        nu.rotation = pos.rot;
        try { nu.spawnedByCore = false; } catch (err) {} // PHẢI false: game gốc despawn unit spawnedByCore không phải player (UnitComp.update)
        nu.add();
        BC.botPl.unit(nu);
        prevUnit[BC.botPl.id] = nu;
        spawnFx(pos.x, pos.y);
    }

    function botBagCount(st) {
        let n = 0;
        for (let i = 0; i < st.p.length; i++) if (st.p[i] === IN_BAG) n++;
        return n;
    }

    const BOT_IDLE_SELL = 5400; // pháo không có mục tiêu / không bắn trong 90s -> bán
    const BOT_BAN_TICKS = 7200; // không mua lại đúng loại đó trong 2 phút
    function botSellIdle(pl, st) {
        if (st.p.length !== st.d.length) return;
        let defs = droneDefs(), now = Time.time, sold = false;
        for (let i = st.d.length - 1; i >= 0; i--) {
            let pos = st.p[i];
            if (!(pos >= 0)) continue;
            let d = defs.map[st.d[i]], b = Vars.world.build(pos);
            if (d == null || b == null || b.block !== d.block) continue;
            let act = true;
            try { act = b.isShooting() || b.target != null; } catch (err) {}
            let r = BC.botIdle[pos];
            if (r == null || r.id !== d.id || act) { BC.botIdle[pos] = { id: d.id, t: now }; continue; }
            if (now - r.t < Math.max(2400, BOT_IDLE_SELL - 600 * (BC.botSm - 1))) continue;
            st.pts += turretSellValue(st, d);
            BC.botBad[b.tile.x + "," + b.tile.y] = true;
            BC.botBan[d.id] = now + BOT_BAN_TICKS;
            removeTurret(pos, d);
            st.d.splice(i, 1);
            st.p.splice(i, 1);
            delete BC.botIdle[pos];
            sold = true;
            Log.info("[NexPvp] bot bán " + d.id + " (không bắn), điểm=" + st.pts);
        }
        if (sold) { BC.botMem = {}; BC.botNoBuyT = 0; changed(); }
    }

    // học từ player phe kia (người có nhiều pháo nhất): loại pháo xây / gắn và vị trí so với lõi họ
    function botLearn(pl) {
        let out = { b: {}, e: {}, pos: [] };
        let best = null, bn = -1;
        let bo = botOf(pl.id), kid = bo != null ? bo.botKillerId : undefined;
        eachPl(new Cons({
            get: function(p) {
                if (p === pl || p.team() === pl.team() || p.team() === Vars.state.rules.waveTeam) return;
                let s0 = byId[p.id];
                if (kid !== undefined && p.id === kid && s0 != null) { best = p; bn = 1e9; return; } // ưu tiên người vừa hạ bot
                if (s0 != null && s0.d.length > bn) { bn = s0.d.length; best = p; }
            }
        }));
        if (best == null) return out;
        let s1 = byId[best.id], ec = best.team().core();
        for (let i = 0; i < s1.d.length; i++) {
            let id = s1.d[i];
            if (s1.p[i] === EQUIPPED) out.e[id] = (out.e[id] || 0) + 1;
            else if (s1.p[i] >= 0) {
                out.b[id] = (out.b[id] || 0) + 1;
                let b = Vars.world.build(s1.p[i]);
                if (b != null && ec != null) out.pos.push({ id: id, dx: b.tile.x - ec.tile.x, dy: b.tile.y - ec.tile.y });
            }
        }
        return out;
    }

    const BOT_JIT = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
    // vị trí lắp theo player địch: đối xứng qua lõi trước, rồi cùng chiều
    function botLearnSpot(core, ec, d, L) {
        for (let sg = -1; sg <= 1; sg += 2) {
            for (let i = 0; i < L.pos.length; i++) {
                if (L.pos[i].id !== d.id) continue;
                for (let j = 0; j < BOT_JIT.length; j++) {
                    let tx = core.tile.x + sg * L.pos[i].dx + BOT_JIT[j][0];
                    let ty = core.tile.y + sg * L.pos[i].dy + BOT_JIT[j][1];
                    if (canBuildAt(core, ec, d.block, tx, ty)) return { x: tx, y: ty };
                }
            }
        }
        return null;
    }

    // xây lại pháo đã bị phá (nằm trong túi): đúng chỗ cũ, không được thì theo player địch, rồi chỗ ngẫu nhiên
    function botRebuild(pl) {
        let st = bind(pl), core = pl.team().core();
        if (core == null || st.p.length !== st.d.length) return true;
        let defs = droneDefs(), ec = enemyCores(core.team), L = botLearn(pl), ok = true, did = false;
        for (let i = 0; i < st.d.length; i++) {
            if (st.p[i] !== IN_BAG) continue;
            if (builtCount(st) >= maxBuilt()) break;
            let d = defs.map[st.d[i]];
            if (d == null) continue;
            let pos = -1, m = BC.botMem[i];
            if (m != null && m.id === st.d[i] && m.pos >= 0) {
                let tl = Vars.world.tile(m.pos);
                if (tl != null) pos = placeTurret(pl, d, tl.x, tl.y);
            }
            if (pos < 0) {
                let sp = botLearnSpot(core, ec, d, L) || botFindSpot(pl, d);
                if (sp != null) pos = placeTurret(pl, d, sp.x, sp.y);
            }
            if (pos >= 0) { st.p[i] = pos; did = true; } else ok = false;
        }
        if (did) changed();
        return ok;
    }

    // phòng thủ lõi: ưu tiên unit player địch, rồi unit địch khác gần lõi
    function botPickDefend(u, core) {
        let best = null, bd = 1e12, pb = null, pbd = 1e12;
        Groups.unit.each(new Cons({
            get: function(e) {
                if (!botEnemyOk(e, u) || e.team === Team.derelict) return;
                let d = Mathf.dst2(core.x, core.y, e.x, e.y);
                let lim = e.range() + core.block.size * Vars.tilesize / 2 + 48; // chỉ tính kẻ đang trong tầm đánh được lõi, ra ngoài tầm thì bỏ qua
                if (d > lim * lim) return;
                let isP = false;
                try { isP = e.isPlayer() || botUnitOf(e) != null; } catch (err) {}
                if (isP) { if (d < pbd) { pbd = d; pb = e; } }
                else if (d < bd) { bd = d; best = e; }
            }
        }));
        return pb != null ? pb : best;
    }

    function botTick() {
        for (let i = 0; i < bots.length; i++) {
            BC = bots[i];
            try { botTickOne(); } catch (err) { logOnce("bottick", "bot tick failed: " + err); }
        }
    }

    // tầm bắn thật của bot: max/min trong các pháo ĐÃ LẮP (EQUIPPED); không có pháo nào thì dùng tầm vũ khí gốc của unit
    function botGearRanges(pl, u) {
        let st = byId[pl.id];
        let mx = 0, mn = 1e18;
        if (st != null) {
            let list = equipList(st, droneDefs());
            for (let i = 0; i < list.length; i++) { let r = turretRange(list[i]); if (r > mx) mx = r; if (r < mn) mn = r; }
        }
        if (mx <= 0) { try { mx = u.type.maxRange; } catch (err) {} mn = mx; }
        return { max: Math.max(48, mx), min: Math.max(48, mn) };
    }

    function botTickOne() {
        let pl = BC.botPl;
        BC.botSm = botSmart();
        if (pl == null || !isFull() || Vars.state.isPaused()) return;
        let core = pl.team().core();
        if (core == null) return;
        let u = pl._unit;
        if (u != null && (!u.isValid() || u.dead)) {
            pl._unit = null;
            u = null;
            BC.botTarget = null;
            let st0 = bind(pl);
            BC.botDeadT = Math.max(60, RESPAWN_SEC[Math.min(RESPAWN_SEC.length, Math.max(1, activeTier(st0))) - 1] * 60);
        }
        if (u == null) {
            BC.botDeadT -= Time.delta;
            if (BC.botDeadT <= 0) spawnBotUnit();
            return;
        }
        let gr = botGearRanges(pl, u);
        let maxR = gr.max, minR = gr.min;
        BC.botDbgT -= Time.delta;
        if (BC.botDbgT <= 0) {
            BC.botDbgT = 600;
            let nearD = 99999, wn = 0, wt0 = Vars.state.rules.waveTeam;
            Groups.unit.each(new Cons({ get: function(e) { if (e.team === wt0 && !e.dead) { wn++; let dd = Math.round(Mathf.dst(core.x, core.y, e.x, e.y)); if (dd < nearD) nearD = dd; } } }));
            let st1 = bind(pl);
            Log.info("[NexPvp] botdbg unit=" + u.type.name + " pos=" + Math.round(u.tileX()) + "," + Math.round(u.tileY()) + " core=" + core.tileX() + "," + core.tileY() + " wave=" + Vars.state.wave + " waveUnits=" + wn + " nearest=" + nearD + " target=" + (BC.botTarget != null) + " pts=" + st1.pts + " turrets=" + builtCount(st1) + " ctrl=" + u.controller().getClass().getSimpleName() + " paused=" + Vars.state.isPaused());
        }
        // 1) tìm / giữ mục tiêu: ưu tiên farm wave, chỉ bắn player địch khi nó vào tầm bắn pháo
        BC.botScanT -= Time.delta;
        if (BC.botTarget == null || !BC.botTarget.isValid() || BC.botTarget.dead || BC.botScanT <= 0) {
            if (BC.botScanT <= 0) BC.botScanT = 20;
            BC.botTarget = (BC.botFightT > 0 ? botPickDefend(u, core) : null) || pickWave(u, core, maxR);
            if (BC.botTarget != null) logOnce("botfound", "bot: thấy unit wave " + BC.botTarget.type.name + " cách " + Math.round(Mathf.dst(core.x, core.y, BC.botTarget.x, BC.botTarget.y)), true);
        }
        BC.botSeenT -= Time.delta;
        if (BC.botSeenT <= 0) { BC.botSeenT = 30; try { botSee(u); } catch (err) { logOnce("botsee", "bot see failed: " + err); } }
        // --- không bắn thứ gì một lúc (không phải đang đi dò/tấn công/về nhà/mua) -> biến về để reset tìm quái wave ---
        let shotNow = false;
        try { shotNow = u.isShooting(); } catch (err) {}
        if (shotNow || BC.botAttack || BC.botScout || BC.botHome || BC.botBuyTrip || BC.botFightT > 0 || BC.botSwapPend || BC.botResetPend) BC.botNoShotT = 0;
        else if ((BC.botNoShotT += Time.delta) > BOT_NOSHOT_RESET) { BC.botNoShotT = 0; BC.botResetPend = true; BC.botResetT0 = Time.time; Log.info("[NexPvp] bot không bắn gì, về nhà biến về để reset"); }
        // --- thu nhập theo thời gian: càng chơi lâu bot càng được nhiều điểm ---
        BC.botIncomeT += Time.delta;
        if (BC.botIncomeT >= 3600) {
            BC.botIncomeT = 0;
            BC.botMin++;
            let stI = bind(pl);
            stI.pts += Math.round((1 + Math.floor(BC.botMin / 5)) * (1 + 0.35 * (BC.botSm - 1)));
            changed();
        }
        BC.botIdleT -= Time.delta;
        if (BC.botIdleT <= 0) {
            BC.botIdleT = 60;
            try { botSellIdle(pl, bind(pl)); } catch (err) { logOnce("botidle", "bot idle sell failed: " + err); }
        }
        if (BC.botSkipT > 0) { BC.botSkipT -= Time.delta; if (BC.botSkipT <= 0) BC.botSkip = null; }
        if (BC.botRetreatT > 0) BC.botRetreatT -= Time.delta;
        if (BC.botNoBuyT > 0) BC.botNoBuyT -= Time.delta;
        if (BC.botNoAtkT > 0) BC.botNoAtkT -= Time.delta;
        if (BC.botFightT > 0) BC.botFightT -= Time.delta;
        if (BC.botRebuildCd > 0) BC.botRebuildCd -= Time.delta;
        // --- nhiệm vụ khẩn: lõi bị đánh / pháo xây bị phá -> chạy tới nền đặt lõi, không bắn, biến về ---
        let stM = bind(pl);
        for (let mi = 0; mi < stM.p.length; mi++) if (stM.p[mi] >= 0) BC.botMem[mi] = { id: stM.d[mi], pos: stM.p[mi] };
        // lõi bị đánh (máu giảm hoặc khiên trúng đạn): chưa chiến đấu -> biến về trước; đang chiến đấu -> gia hạn
        let shR = coreShield[core.id], shN = shR != null ? shR.hitN : 0;
        if ((BC.botCoreHp > 0 && core.health < BC.botCoreHp - 0.5) || shN !== BC.botCoreHit) {
            if (BC.botFightT <= 0) BC.botAlertT = 900; else BC.botFightT = 900;
        }
        BC.botCoreHit = shN;
        BC.botCoreHp = core.health;
        let needRb = BC.botRebuildCd <= 0 && botBagCount(stM) > 0 && builtCount(stM) < maxBuilt();
        if (BC.botAlertT > 0 || needRb) {
            BC.botMissionT += Time.delta;
            if (BC.botMissionT > 1500) { BC.botMissionT = 0; BC.botAlertT = 0; BC.botRebuildCd = 1800; }
            else {
                BC.botBaseT -= Time.delta;
                if (BC.botBase == null || BC.botBaseT <= 0) { BC.botBase = botFindBase(u, core); BC.botBaseT = 120; }
                u.controlWeapons(false, false);
                botGo(u, BC.botBase != null ? BC.botBase.x : core.x, BC.botBase != null ? BC.botBase.y : core.y, 8);
                if (botIsBase(u)) {
                    if (needRb && !botRebuild(pl)) BC.botRebuildCd = 1800;
                    let wasAlert = BC.botAlertT > 0;
                    if (botRecall(pl, u, core)) {
                        BC.botMissionT = 0;
                        BC.botAlertT = 0;
                        if (wasAlert) BC.botFightT = 900; // hồi sinh xong: đánh kẻ đang tấn công lõi
                    }
                }
                BC.botLastX = u.x; BC.botLastY = u.y;
                return;
            }
        } else BC.botMissionT = 0;
        let hpf = u.health / u.maxHealth;
        let t = BC.botTarget;
        let combat = t != null && t.isValid() && !t.dead && Mathf.dst(u.x, u.y, t.x, t.y) <= BOT_COMBAT_R;
        if (combat && botUnfavorable(u)) { BC.botRetreatT = 240; BC.botFleeT = Math.max(BC.botFleeT || 0, 300); }
        if (BC.botHitT > 0) {
            BC.botHitT -= Time.delta;
            if (BC.botRetreatT < 120) BC.botRetreatT = 120; // bị player địch bắn: rút về nền/biến về
            BC.botRevengeT = 3600;                          // xong sẽ quay lại đánh player
            BC.botFleeT = 600;                              // rút liên tục tới khi biến về được (không quay đầu tiến lên)
        } else if (BC.botRevengeT > 0) BC.botRevengeT -= Time.delta;
        if (BC.botFleeT > 0) BC.botFleeT -= Time.delta;
        BC.botPlanT -= Time.delta;
        if (BC.botPlanT <= 0) { BC.botPlanT = Math.max(45, 120 - 20 * (BC.botSm - 1)); botPlan(pl, u, core, combat, hpf); }
        let onBase = botIsBase(u);
        if (BC.botHome || BC.botRetreatT > 0 || BC.botFleeT > 0 || BC.botBuyTrip) {
            BC.botBaseT -= Time.delta;
            if (BC.botBase == null || BC.botBaseT <= 0) { BC.botBase = botFindBase(u, core); BC.botBaseT = 120; }
        }
        let bx = BC.botBase != null ? BC.botBase.x : core.x;
        let by = BC.botBase != null ? BC.botBase.y : core.y;

        if (BC.botHome || BC.botRetreatT > 0 || BC.botFleeT > 0) {
            // máu thấp / bất lợi: về nền đặt lõi gần nhất, vừa lùi vừa bắn nếu địch còn trong tầm
            botGo(u, bx, by, 8);
            // đứng trên nền đặt lõi (nửa map phe ta) thì mới được biến về lõi: unit mới hồi sinh đầy máu
            if (onBase && ((BC.botHome && (hpf < 0.7 || BC.botSwapPend || BC.botResetPend)) || BC.botFleeT > 0 || BC.botRetreatT > 0) && botRecall(pl, u, core)) return;
            BC.botNpT = (BC.botNpT || 0) - Time.delta;
            if (BC.botNpT <= 0) { BC.botNpT = 10; BC.botNp = botNearestPlayer(u); }
            let at = (BC.botNp != null && BC.botNp.isValid() && !BC.botNp.dead) ? BC.botNp : t; // rút lui: ưu tiên ngắm player địch gần nhất, nhưng chỉ bắn khi trong tầm pháo
            if (at != null && at.isValid() && !at.dead && Mathf.dst(u.x, u.y, at.x, at.y) <= maxR) {
                u.lookAt(at.x, at.y); u.aim(at.x, at.y); u.controlWeapons(true, true);
            } else u.controlWeapons(false, false);
        } else if (combat) {
            botChase(u, t, maxR, minR);
        } else if (BC.botBuyTrip) {
            // có điểm: về nền đặt lõi để xây pháo / nâng nhà máy lính
            botGo(u, bx, by, 8);
            u.controlWeapons(false, false);
            if (onBase) {
                BC.botBuyT -= Time.delta;
                if (BC.botBuyT <= 0) {
                    BC.botBuyT = 60;
                    if (!botShop(pl)) BC.botNoBuyT = 1800;
                }
            }
        } else if (BC.botAttack && BC.botEnemyPos != null) {
            // đủ mạnh hơn player phe kia: sang tấn công
            let gx = BC.botEnemyPos.x, gy = BC.botEnemyPos.y;
            let ge = botEnemyUnit(u);
            if (ge != null) { gx = ge.x; gy = ge.y; }
            let dist = Mathf.dst(u.x, u.y, gx, gy);
            if (!botGo(u, gx, gy, maxR * 0.75)) { BC.botAttack = false; BC.botNoAtkT = 1800; }
            u.lookAt(gx, gy); u.aim(gx, gy);
            u.controlWeapons(true, dist <= maxR);
        } else if (BC.botScout) {
            // đi dò: tới trong 80 ô để nhìn player địch (botSee tự ghi nhận)
            let ge = botEnemyUnit(u);
            if (ge == null || !botGo(u, ge.x, ge.y, BOT_SEE_R * 0.8)) { BC.botScout = false; BC.botSeenAt = Time.time - BOT_SCOUT_EVERY + 1800; }
            u.controlWeapons(false, false);
        } else if (t != null) {
            botChase(u, t, maxR, minR);
        } else {
            botGo(u, core.x, core.y, BOT_HOME_R);
            u.controlWeapons(false, false);
        }
        BC.botLastX = u.x; BC.botLastY = u.y;
    }

    const BOT_SEE_R = 640;        // 80 ô
    const BOT_NOSHOT_RESET = 2700; // 45s không bắn gì -> về nhà biến về để tìm lại quái wave
    const BOT_SCOUT_EVERY = 5400; // 90s chưa nhìn player địch -> đi dò lại

    // chọn unit/pilot muốn đổi theo mẫu botSeen (null nếu không đổi được/không cần)
    function botSwapWant(st) {
        if (BC.botSeen == null || st.lv < FREE_SWITCH_LEVEL) return null;
        let k = Math.min(TIER_MAX, Math.max(1, BC.botSeen.u));
        let nu = (k === tierCap(st.lv)) ? 0 : k;
        let pi = BC.botSeen.pi;
        if (pi === PILOT_EMPIX && st.lv < EMPIX_MIN_LEVEL) pi = st.pi || 0;
        if (nu === (st.u || 0) && pi === (st.pi || 0)) return null;
        return { u: nu, pi: pi };
    }

    // bot nhìn thấy player địch trong 80 ô -> ghi nhớ unit + pilot, chờ về nhà mới áp dụng
    function botSee(u) {
        let seen = null;
        eachPl(new Cons({
            get: function(p) {
                if (seen != null || p === BC.botPl || p.team() === u.team || p.team() === Vars.state.rules.waveTeam) return;
                let e = p.unit(), s0 = byId[p.id];
                if (e == null || e.dead || !e.isValid() || s0 == null) return;
                if (Mathf.dst2(u.x, u.y, e.x, e.y) > BOT_SEE_R * BOT_SEE_R) return;
                seen = { u: activeTier(s0), pi: s0.pi || 0 };
            }
        }));
        if (seen == null) return;
        BC.botSeen = seen;
        BC.botSeenAt = Time.time;
        BC.botScout = false;
        if (!BC.botSwapPend && botSwapWant(bind(BC.botPl)) != null) { BC.botSwapPend = true; BC.botSwapT0 = Time.time; }
    }

    function botApplySwap(pl) {
        if (!BC.botSwapPend) return;
        BC.botSwapPend = false;
        let st = bind(pl), w = botSwapWant(st);
        if (w == null) return;
        st.u = w.u;
        st.pi = w.pi;
        changed();
        Log.info("[NexPvp] bot đổi theo địch: unit=" + activeTier(st) + " pilot=" + st.pi);
    }

    function botRecall(pl, u, core) {
        if (!canReturnCore(u, core)) return false;
        spawnFx(u.x, u.y);
        try { Call.unitDespawn(u); } catch (err) { try { u.remove(); } catch (e2) {} }
        pl._unit = null;
        BC.botTarget = null;
        BC.botHome = false;
        BC.botRetreatT = 0;
        try { botApplySwap(pl); } catch (err) { logOnce("botswap", "bot swap failed: " + err); }
        BC.botResetPend = false;
        BC.botFleeT = 0;
        BC.botNoShotT = 0;
        BC.botDeadT = 90; // ~1.5s rồi hồi sinh tại lõi
        return true;
    }

    // đứng trong tầm bắn: đi vòng quanh mục tiêu (strafe) và lùi nếu bị áp sát, thay vì đứng yên làm bia
    function botStrafe(u, t, maxR, dist) {
        let dx = t.x - u.x, dy = t.y - u.y;
        let len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        let sgn = (Math.floor(Time.time / 100) + (u.id & 1)) % 2 === 0 ? 1 : -1;
        let px = -dy / len * sgn, py = dx / len * sgn;
        let back = dist < maxR * 0.45 ? -0.9 : (dist > maxR * 0.7 ? 0.5 : 0);
        let v = Tmp.v1;
        v.set(px * 0.8 + dx / len * back, py * 0.8 + dy / len * back);
        if (v.len() > 0.05) v.setLength(u.speed()); else v.setZero();
        u.movePref(v);
    }

    const BOT_ENG_SCAN = 300; // 5s: quét lại xem pháo tầm ngắn hơn đã gây sát thương chưa

    function botChase(u, t, maxR, minR) {
        if (BC.botEngTgt !== t) { BC.botEngTgt = t; BC.botEngR = 0; BC.botEngOn = false; } // đổi mục tiêu -> reset về tầm xa nhất
        let useR = BC.botEngR > 0 ? BC.botEngR : maxR;
        let dist = Mathf.dst(u.x, u.y, t.x, t.y);
        if (useR >= 110 && dist <= useR * 0.9 && dist > 20) {
            if (minR < maxR) { // có pháo tầm ngắn hơn chưa chắc đã trúng -> định kỳ kiểm tra, không trúng thì ép lại gần hơn
                if (!BC.botEngOn) { BC.botEngOn = true; BC.botEngScanT = BOT_ENG_SCAN; }
                else if ((BC.botEngScanT -= Time.delta) <= 0) { BC.botEngScanT = BOT_ENG_SCAN; if (dist > minR) BC.botEngR = minR; }
            }
            BC.botStuckT = 0;
            u.lookAt(t.x, t.y);
            u.aim(t.x, t.y);
            u.controlWeapons(true, true);
            if (t.team !== Vars.state.rules.waveTeam) botStrafe(u, t, useR, dist); // quái wave: đứng yên mà bắn
            return;
        }
        BC.botEngOn = false;
        let reach = botGo(u, t.x, t.y, useR * 0.75);
        if (!reach) { BC.botSkip = t; BC.botSkipT = 180; BC.botTarget = null; }
        if (dist > useR * 0.75 && Mathf.dst(u.x, u.y, BC.botLastX, BC.botLastY) < 0.3) BC.botStuckT += Time.delta; else BC.botStuckT = 0;
        if (BC.botStuckT > 300) { BC.botSkip = t; BC.botSkipT = 180; BC.botTarget = null; BC.botStuckT = 0; }
        u.lookAt(t.x, t.y);
        u.aim(t.x, t.y);
        u.controlWeapons(true, dist <= useR);
    }

    function botIsBase(u) {
        let t = Vars.world.tileWorld(u.x, u.y);
        return t != null && String(t.floor().name) === BUILD_FLOOR;
    }

    // ô nền đặt lõi (trống, nửa map phe ta) gần bot nhất
    function botFindBase(u, core) {
        let ec = enemyCores(core.team);
        let tx = u.tileX(), ty = u.tileY(), best = null, bd = 1e12;
        for (let dx = -60; dx <= 60; dx += 2) {
            for (let dy = -60; dy <= 60; dy += 2) {
                let t = Vars.world.tile(tx + dx, ty + dy);
                if (t == null || t.solid() || t.build != null || String(t.floor().name) !== BUILD_FLOOR) continue;
                if (!ourSide(core, ec, t.x, t.y)) continue;
                let d = dx * dx + dy * dy;
                if (d < bd) { bd = d; best = t; }
            }
        }
        return best == null ? null : { x: best.worldx(), y: best.worldy() };
    }

    function botPower(st) {
        let defs = droneDefs();
        let w = (st.lv || 1) * 10 + (st.b || 0) * 8;
        for (let i = 0; i < st.d.length; i++) {
            let d = defs.map[st.d[i]];
            if (d != null && st.p[i] >= 0) w += d.cost * 6;
        }
        return w;
    }

    function botEnemyPower(pl) {
        let best = 0;
        eachPl(new Cons({
            get: function(p) {
                if (p.team() === pl.team()) return;
                best = Math.max(best, botPower(bind(p)));
            }
        }));
        return best;
    }

    function botNearestPlayer(u) {
        let r = null, bd = 1e12;
        eachPl(new Cons({
            get: function(p) {
                if (p.team() === u.team || p.team() === Vars.state.rules.waveTeam) return;
                let e = p.unit();
                if (e == null || e.dead || !e.isValid()) return;
                let d = Mathf.dst2(u.x, u.y, e.x, e.y);
                if (d < bd) { bd = d; r = e; }
            }
        }));
        return r;
    }

    function botEnemyUnit(u) {
        let r = null;
        eachPl(new Cons({
            get: function(p) {
                let e = p.unit();
                if (r == null && e != null && botEnemyOk(e, u) && e.team !== Vars.state.rules.waveTeam) r = e;
            }
        }));
        return r;
    }

    // need: điểm tối thiểu để mua 1 pháo học từ địch (gắn lên unit hoặc xây); gain: điểm thu được nếu bán pháo thừa; need=0 nếu không có gì để học
    function botLearnInfo(pl, st) {
        let out = { need: 0, gain: 0 };
        if (st.p.length !== st.d.length) return out;
        let defs = droneDefs(), L = botLearn(pl), multi = multiTurretOn(), now = Time.time;
        let own = function(id, eq) {
            let c = 0;
            for (let k = 0; k < st.d.length; k++) if (st.d[k] === id && (eq ? st.p[k] === EQUIPPED : st.p[k] >= 0)) c++;
            return c;
        };
        let hasEx = false;
        for (let i = 0; i < st.d.length; i++) {
            let dd = defs.map[st.d[i]];
            if (!(st.p[i] >= 0) || dd == null || own(st.d[i], false) <= (L.b[st.d[i]] || 0)) continue;
            out.gain += turretSellValue(st, dd);
            hasEx = true;
        }
        let slotFree = equipCount(st) < equipSlots(st), full = builtCount(st) >= maxBuilt();
        for (let j = 0; j < defs.list.length; j++) {
            let d = defs.list[j];
            if (BOT_NO_TURRET[d.kind] === true || !d.equip) continue;
            if (!multi && ownedCount(st, d.id) >= 1) continue;
            if ((BC.botBan[d.id] || 0) > now) continue;
            let eq = slotFree && (L.e[d.id] || 0) > own(d.id, true);
            let bd = (L.b[d.id] || 0) > own(d.id, false);
            if (!eq && !(bd && (!full || hasEx))) continue;
            let c = turretCost(st, d);
            if (out.need === 0 || c < out.need) out.need = c;
        }
        return out;
    }

    function botWantsBuy(st, ln) {
        if (ln != null && ln.need > 0) return st.pts + ln.gain >= ln.need; // địch có pháo để học: chỉ đi mua khi đủ điểm (kể cả bán pháo thừa)
        let defs = droneDefs();
        let minC = 1e9;
        if (builtCount(st) < maxBuilt()) {
            for (let j = 0; j < defs.list.length; j++) {
                let d = defs.list[j];
                if (BOT_NO_TURRET[d.kind] === true || !d.equip) continue;
                if (!multiTurretOn() && ownedCount(st, d.id) >= 1) continue;
                minC = Math.min(minC, turretCost(st, d));
            }
        }
        let bl = st.b || 0;
        if (bl < BARRACKS.length) minC = Math.min(minC, barrackCost(bl));
        return st.pts >= minC;
    }

    // trọng số ưu tiên chỉ số: máu, tấn công, giáp, tốc độ bắn, rồi các chỉ số còn lại (bỏ qua Đẩy lùi)
    const BOT_STAT_W = [3, 2, 3, 1, 2, 1, 1, 1, 1, 1, 0];
    function botSpendStats(pl, st, reserve) {
        let guard = 60;
        reserve = reserve || 0;
        while (st.pts - reserve >= 1 && guard-- > 0) {
            let bk = -1, bv = 1e12;
            for (let k = 0; k < STATS.length && k < BOT_STAT_W.length; k++) {
                if (!(BOT_STAT_W[k] > 0) || st.s[k] >= statMax(k)) continue;
                let v = st.s[k] / BOT_STAT_W[k];
                if (v < bv) { bv = v; bk = k; }
            }
            if (bk < 0) break;
            st.pts--;
            st.s[bk]++;
        }
        changed();
    }

    // đọc tình hình: có cần về hồi máu / về xây không, có đủ mạnh để sang tấn công không
    function botPlan(pl, u, core, combat, hpf) {
        BC.botHome = hpf < 0.7; // dưới 70% máu mới về lõi, còn lại cứ farm/tấn công bình thường
        if (BC.botSwapPend) { // đã thấy địch đổi unit/pilot: về nền, biến về lõi để đổi (quá 60s không về được thì bỏ)
            if (Time.time - BC.botSwapT0 > 3600) BC.botSwapPend = false; else BC.botHome = true;
        }
        if (BC.botResetPend) { // không bắn gì quá lâu: về nền, biến về lõi để làm mới (quá 60s không về được thì bỏ)
            if (Time.time - BC.botResetT0 > 3600) BC.botResetPend = false; else BC.botHome = true;
        }
        let st = bind(pl);
        let ln = botLearnInfo(pl, st);
        BC.botSaveCost = (ln.need > 0 && st.pts + ln.gain < ln.need) ? ln.need : 0; // chưa đủ điểm mua pháo học từ địch -> tích điểm, không tiêu vào chỉ số
        BC.botBuyTrip = !combat && !BC.botHome && BC.botNoBuyT <= 0 && botWantsBuy(st, ln);
        // không còn gì để mua -> dồn phần điểm DƯ (ngoài khoản dành mua pháo học từ địch) vào chỉ số
        if (st.pts - ln.need >= 1 && !BC.botBuyTrip && (BC.botNoBuyT > 0 || !botWantsBuy(st, ln))) {
            try { botSpendStats(pl, st, ln.need); } catch (err) { logOnce("botstats", "bot stats failed: " + err); }
        }
        let wt = Vars.state.rules.waveTeam, nearWave = 0;
        Groups.unit.each(new Cons({
            get: function(e) { if (e.team === wt && !e.dead && Mathf.dst2(core.x, core.y, e.x, e.y) < 900 * 900) nearWave++; }
        }));
        BC.botAttack = false; // không chủ động đánh úp căn cứ địch: chỉ farm wave, bắn trả khi player vào tầm, <70% máu thì rút
        let sgE = botEnemyUnit(u);
        if (BC.botScout) {
            if (sgE == null || hpf < 0.7 || nearWave >= 6 || Time.time - BC.botScoutT0 > 3600) { BC.botScout = false; BC.botSeenAt = Time.time - BOT_SCOUT_EVERY + 1800; }
        } else if (sgE != null && !combat && !BC.botHome && !BC.botSwapPend && hpf > 0.8 && nearWave < 4 && Time.time - BC.botSeenAt > BOT_SCOUT_EVERY) {
            BC.botScout = true; BC.botScoutT0 = Time.time;
        }
    }

    function botFindSpot(pl, def) {
        let core = pl.team().core();
        if (core == null) return null;
        let ec = enemyCores(core.team);
        let blk = def.block;
        let minR = Math.ceil(core.block.size / 2) + Math.ceil(blk.size / 2) + 1;
        for (let i = 0; i < BOT_SPOT_TRIES; i++) {
            let a = Math.random() * 360;
            let r = minR + Math.random() * Math.random() * BOT_SPOT_RANGE;
            let tx = Math.round(core.tile.x + Mathf.cosDeg(a) * r);
            let ty = Math.round(core.tile.y + Mathf.sinDeg(a) * r);
            if (canBuildAt(core, ec, blk, tx, ty)) return { x: tx, y: ty };
        }
        return null;
    }

    // mua / lắp đúng loại pháo player địch đang dùng; thiếu điểm thì bán pháo thừa (loại địch không dùng) hoặc tích điểm
    // trả về 1: đã mua, 2: đang tích điểm, 0: không có gì để học
    function botBuyLearned(pl, st, defs, L, core0, own, lrn, slotFree) {
        BC.botSaveCost = 0;
        let multi = multiTurretOn(), now = Time.time, ec = enemyCores(core0.team), list = [];
        for (let j = 0; j < defs.list.length; j++) {
            let d = defs.list[j];
            if (BOT_NO_TURRET[d.kind] === true || !d.equip) continue;
            if (!multi && ownedCount(st, d.id) >= 1) continue;
            if ((BC.botBan[d.id] || 0) > now || lrn(d) <= 0) continue;
            list.push({ d: d, eq: slotFree && (L.e[d.id] || 0) > own(d.id, true) });
        }
        list.sort(function(a, b) { return ((b.eq ? 1 : 0) - (a.eq ? 1 : 0)) || (a.d.cost - b.d.cost); }); // lắp lên unit trước, rồi rẻ trước
        let excess = function() {
            let out = [];
            for (let i = 0; i < st.d.length; i++) {
                let dd = defs.map[st.d[i]];
                if (!(st.p[i] >= 0) || dd == null || own(st.d[i], false) <= (L.b[st.d[i]] || 0)) continue;
                out.push({ i: i, v: turretSellValue(st, dd) });
            }
            out.sort(function(a, b) { return a.v - b.v; });
            return out;
        };
        for (let c = 0; c < list.length; c++) {
            let d = list[c].d, isEq = list[c].eq, spot = null;
            if (!isEq) {
                spot = botLearnSpot(core0, ec, d, L);
                if (spot != null && BC.botBad[spot.x + "," + spot.y] === true) spot = null;
                for (let k = 0; k < 6 && spot == null; k++) {
                    let sp = botFindSpot(pl, d);
                    if (sp != null && BC.botBad[sp.x + "," + sp.y] !== true) spot = sp;
                }
                if (spot == null) { logOnce("botnospot:" + d.id, "bot: không có chỗ xây " + d.id + ", thử loại khác", true); continue; }
            }
            let need = turretCost(st, d);
            let needSlot = !isEq && builtCount(st) >= maxBuilt();
            let ex = excess(), gain = 0;
            for (let k = 0; k < ex.length; k++) gain += ex[k].v;
            if (needSlot && ex.length === 0) continue; // toàn pháo cần giữ, không có chỗ nhường
            if (st.pts < need && st.pts + gain < need) {
                if (BC.botSaveCost === 0 || need < BC.botSaveCost) BC.botSaveCost = need; // chưa đủ: tích điểm
                continue;
            }
            let guard = 0;
            while ((st.pts < need || (needSlot && builtCount(st) >= maxBuilt())) && guard++ < 12) {
                ex = excess();
                if (ex.length === 0) break;
                let k = ex[0].i, dd = defs.map[st.d[k]];
                st.pts += turretSellValue(st, dd);
                removeTurret(st.p[k], dd);
                Log.info("[NexPvp] bot bán " + dd.id + " (thừa so với địch) lấy điểm mua " + d.id);
                st.d.splice(k, 1);
                st.p.splice(k, 1);
                BC.botMem = {};
                need = turretCost(st, d);
            }
            if (st.pts < need || (needSlot && builtCount(st) >= maxBuilt())) { changed(); continue; }
            if (isEq) {
                st.pts -= need;
                st.d.push(d.id);
                st.p.push(EQUIPPED);
                Log.info("[NexPvp] bot gắn " + d.id + " (học theo địch)");
                changed();
                return 1;
            }
            let pos = placeTurret(pl, d, spot.x, spot.y);
            if (pos < 0) { changed(); continue; }
            Log.info("[NexPvp] bot xây " + d.id + " tại " + spot.x + "," + spot.y + " (học theo địch, còn " + (st.pts - need) + " điểm)");
            st.pts -= need;
            st.d.push(d.id);
            st.p.push(pos);
            changed();
            return 1;
        }
        return BC.botSaveCost > 0 ? 2 : 0;
    }

    // mua pháo mạnh nhất trong tầm điểm (hoặc nâng nhà máy lính nếu tình hình cần); trả về true nếu đã mua gì đó
    function botShop(pl) {
        let st = bind(pl);
        if (st.p.length !== st.d.length) return false;
        let defs = droneDefs();
        let nb = builtCount(st);
        let full = nb >= maxBuilt();
        // nhà máy lính: nâng khi pháo đã đủ ô, khi nhà máy tụt so với số pháo, hoặc khi player địch mạnh hơn
        let bl = st.b || 0;
        let lnI = botLearnInfo(pl, st);
        if (bl < BARRACKS.length && st.pts - barrackCost(bl) >= lnI.need) {
            let weaker = botEnemyPower(pl) > botPower(st);
            if (full || bl < 1 + Math.floor(nb / 2) || weaker) {
                st.pts -= barrackCost(bl);
                st.b = bl + 1;
                Log.info("[NexPvp] bot nâng nhà máy lính lên cấp " + st.b);
                changed();
                return true;
            }
        }
        let wi = -1;
        if (full) {
            for (let i = 0; i < st.d.length; i++) {
                let dd = defs.map[st.d[i]];
                if (!(st.p[i] >= 0) || dd == null) continue;
                if (wi < 0 || dd.cost < defs.map[st.d[wi]].cost) wi = i;
            }
            if (wi < 0) return false;
        }
        let wc = full ? defs.map[st.d[wi]].cost : 0;
        let wRefund = full ? turretSellValue(st, defs.map[st.d[wi]]) : 0;
        let L = botLearn(pl);
        let core0 = pl.team().core();
        if (core0 == null) return false;
        let slotFree = equipCount(st) < equipSlots(st);
        let own = function(id, eq) {
            let c = 0;
            for (let k = 0; k < st.d.length; k++) if (st.d[k] === id && (eq ? st.p[k] === EQUIPPED : st.p[k] >= 0)) c++;
            return c;
        };
        let lrn = function(d) {
            return Math.max(0, (L.b[d.id] || 0) - own(d.id, false)) + (slotFree ? Math.max(0, (L.e[d.id] || 0) - own(d.id, true)) : 0);
        };
        let rl = botBuyLearned(pl, st, defs, L, core0, own, lrn, slotFree);
        if (rl === 1) return true;
        if (rl === 2) return false; // đang tích điểm cho pháo địch dùng
        if (slotFree) { // địch chưa trang bị pháo nào -> bot tự trang bị ngẫu nhiên 1 loại mua được
            let enE = 0;
            for (let k in L.e) enE += L.e[k];
            if (enE === 0) {
                let rc = [], tn = Time.time;
                for (let j = 0; j < defs.list.length; j++) {
                    let d = defs.list[j];
                    if (BOT_NO_TURRET[d.kind] === true || !d.equip) continue;
                    if (!multiTurretOn() && ownedCount(st, d.id) >= 1) continue;
                    if ((BC.botBan[d.id] || 0) > tn || turretCost(st, d) > st.pts) continue;
                    rc.push(d);
                }
                if (rc.length > 0) {
                    let rd = rc[Math.floor(Math.random() * rc.length)];
                    st.pts -= turretCost(st, rd);
                    st.d.push(rd.id);
                    st.p.push(EQUIPPED);
                    Log.info("[NexPvp] bot gắn ngẫu nhiên " + rd.id + " (địch chưa trang bị)");
                    changed();
                    return true;
                }
            }
        }
        let cands = [], now = Time.time;
        for (let j = 0; j < defs.list.length; j++) {
            let d = defs.list[j];
            if (BOT_NO_TURRET[d.kind] === true || !d.equip) continue;
            if (turretCost(st, d) > st.pts + wRefund) continue;
            if (full && d.cost < wc * Math.max(1.2, 2 - 0.15 * (BC.botSm - 1))) continue;
            if (full && d.id === st.d[wi]) continue; // không thay pháo bằng chính loại đó (giá leo thang)
            if (!multiTurretOn() && ownedCount(st, d.id) >= 1) continue;
            if ((BC.botBan[d.id] || 0) > now) continue; // loại vừa bán vì không bắn
            cands.push({ d: d, ls: lrn(d) > 0 ? 1 : 0 }); // ưu tiên loại pháo player địch đang dùng
        }
        cands.sort(function(x, y) { return (y.ls - x.ls) || (y.d.cost - x.d.cost); });
        let ec0 = enemyCores(core0.team);
        for (let c = 0; c < cands.length; c++) {
            let best = cands[c].d;
            if (slotFree && (L.e[best.id] || 0) > own(best.id, true)) {
                let ep = turretCost(st, best);
                if (ep > st.pts) continue;
                st.pts -= ep;
                st.d.push(best.id);
                st.p.push(EQUIPPED);
                Log.info("[NexPvp] bot gắn " + best.id + " (học theo địch)");
                changed();
                return true;
            }
            let spot = botLearnSpot(core0, ec0, best, L);
            if (spot != null && BC.botBad[spot.x + "," + spot.y] === true) spot = null;
            if (spot == null) {
                for (let k = 0; k < 6 && spot == null; k++) {
                    let sp = botFindSpot(pl, best);
                    if (sp != null && BC.botBad[sp.x + "," + sp.y] !== true) spot = sp;
                }
            }
            if (spot == null) { logOnce("botnospot:" + best.id, "bot: không có chỗ xây " + best.id + ", thử loại khác", true); continue; }
            let pos = placeTurret(pl, best, spot.x, spot.y);
            if (pos < 0) continue;
            let bPrice = turretCost(st, best);
            if (full) {
                st.pts += wRefund;
                removeTurret(st.p[wi], defs.map[st.d[wi]]);
                st.d.splice(wi, 1);
                st.p.splice(wi, 1);
            }
            Log.info("[NexPvp] bot xây " + best.id + " tại " + spot.x + "," + spot.y + " (còn " + (st.pts - bPrice) + " điểm)");
            st.pts -= bPrice;
            st.d.push(best.id);
            st.p.push(pos);
            changed();
            return true;
        }
        return false;
    }

    // Trigger.update vẫn chạy khi game đang tạm dừng -> gỡ "Đang chờ người chơi..." của game gốc 1 lần mỗi map
    Events.run(Trigger.update, new Runnable({
        run: function() {
            if (autoPauseFixed || Vars.net.client() || !isFull()) return;
            autoPauseFixed = true;
            try {
                let r = Vars.state.rules;
                if (r.pvpAutoPause) { r.pvpAutoPause = false; syncRules(); }
                if (Vars.state.isPaused()) Vars.state.set(Packages.mindustry.core.GameState.State.playing);
            } catch (err) { logOnce("autopause", "cannot disable pvp auto pause: " + err); }
        }
    }));

    Events.run(Trigger.update, new Runnable({
        run: function() {
            if (!isActive() || Vars.state.isPaused()) return;
            let auth = !Vars.net.client();
            let full = isFull();
            if (auth) {
                let t9 = pn(); eachPl(eachPlayerServer); pe("playerServer", t9);
                botT -= Time.delta;
                if (full && botT <= 0) {
                    botT = 60;
                    try { botManage(); } catch (err) { logOnce("botmanage", "bot manage failed: " + err); }
                }
                let t1 = pn(); if (full) botTick(); pe("botTick", t1);
                let t2 = pn(); if (full) eachPl(eachBarracks); pe("barracks", t2);
                let t3 = pn(); if (full) eachPl(eachSoldierAI); pe("soldierAI", t3);
                bulletStatT -= Time.delta;
                if (bulletStatT <= 0) { bulletStatT = 30; bulletStatOn = anyBulletStat(); }
                let t4 = pn(); if (bulletStatOn) Groups.bullet.each(eachBullet); pe("bullets", t4);
                wallT -= Time.delta;
                if (full && wallT <= 0) { wallT = 30; eachPl(eachWall); }
                syncT -= Time.delta;
                if (dirty && syncT <= 0) {
                    dirty = false;
                    syncT = 20;
                    broadcast();
                    persistStore();
                } else if (syncT < -300) {
                    syncT = 20;
                    broadcast();
                    persistStore();
                }
                coreT -= Time.delta;
                if (full && coreT <= 0) {
                    coreT = 30;
                    coreStatsTick(30);
                }
                passiveT -= Time.delta;
                if (full && passiveT <= 0) {
                    passiveT = PASSIVE_INTERVAL;
                    eachPl(eachPassiveExp);
                }
                orphanT -= Time.delta;
                if (orphanT <= 0) {
                    orphanT = 30;
                    let t5 = pn(); Groups.unit.each(eachOrphan); pe("orphan", t5);
                }
                winT -= Time.delta;
                if (full && winT <= 0) {
                    winT = 60;
                    checkWin();
                }
                pruneT -= Time.delta;
                if (pruneT <= 0) {
                    pruneT = 300;
                    prune();
                }
            }
            let ta = pn(); eachPl(eachPlayerCommon); pe("playerCommon", ta);

            turretT -= Time.delta;
            let t6 = pn(); eachPl(eachTurretOwner); pe("turretOwner", t6);
            if (turretT <= 0) turretT = 15;

            let t7 = pn(); eachPl(eachEquip); pe("equip", t7);

            if (!auth) {
                pruneT -= Time.delta;
                if (pruneT <= 0) {
                    pruneT = 300;
                    prune();
                }
            }
        }
    }));

    if (PROFILE) {
        Events.run(Trigger.update, new Runnable({ run: function() {
            profFrames++;
            if (profFrames < 300) return;
            let out = [];
            for (let k in profAcc) out.push(k + "=" + (profAcc[k] / profFrames).toFixed(2) + "ms");
            Log.info("[NexPvp][prof] avg ms/frame over " + profFrames + " frames, units=" + Groups.unit.size() + ", bullets=" + Groups.bullet.size() + " | " + out.join(" "));
            profAcc = {}; profFrames = 0;
        } }));
    }

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
            if (!waveRandomOn()) { // tắt ngẫu nhiên: địch chỉ xuất hiện ở vùng giữa bản đồ
                tx = Math.floor(w * 0.35 + Math.random() * w * 0.3);
                ty = Math.floor(h * 0.35 + Math.random() * h * 0.3);
            }
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
            if (Vars.net.client() || !isFull() || Vars.state.gameOver || Vars.state.isPaused()) return;
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
            if (Vars.net.client() || !isFull() || Vars.state.gameOver) return;
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
                if (o == null || o.team == tgt.team) return;
                try {
                    let bb = botUnitOf(tgt);
                    if (bb != null && o.team !== Vars.state.rules.waveTeam && typeof o.getPlayer === "function" && ownerPl(o) != null) { bb.botHitT = 300; bb.botHitBy = o; }
                } catch (err) {}
                // chủ của viên đạn: unit người chơi / lính -> getPlayer hoặc soldierOwner; pháo xây (Building) -> hostOwner
                let isUnitOwner = typeof o.getPlayer === "function";
                let apid;
                if (isUnitOwner) {
                    let ap = null;
                    ap = ownerPl(o);
                    apid = ap != null ? ap.id : soldierOwner[o.id];
                } else {
                    apid = hostOwner[o.id];
                }
                if (apid === undefined) return;
                try {
                    let ost = byId[apid];
                    let os = ost != null ? ost.s : null;
                    if (os != null && os[9] > 0 && tgt.maxHealth > 0) {
                        let ex = tgt.maxHealth * os[9] * DMG_PCT_MAXHP / 100;
                        try { tgt.damagePierce(ex); } catch (err) { tgt.damage(ex); }
                    }
                    // Chỉ số mới: +sát thương khi đánh trúng quái từ đợt spawn ngẫu nhiên (team quái wave)
                    if (os != null && os[13] > 0 && tgt.team == Vars.state.rules.waveTeam) {
                        let exw = b.damage * os[13] * WRAND_DMG_PCT / 100;
                        try { tgt.damagePierce(exw); } catch (err) { tgt.damage(exw); }
                    }
                } catch (err) {}
                try {
                    let hst = byId[apid];
                    if (hst != null && hst.pi === PILOT_HIST) {
                        let bonus = 0;
                        if (tgt.team == Vars.state.rules.waveTeam) bonus = HIST_WAVE_DMG;
                        else if (soldierOwner[tgt.id] !== undefined) bonus = HIST_SOLDIER_DMG;
                        else if (tgt.isPlayer() || botUnitOf(tgt) != null) bonus = HIST_PLAYER_DMG;
                        if (bonus > 0) tgt.damage(b.damage * bonus);
                        if (tgt.armor > 0) tgt.damagePierce(Math.min(b.damage, tgt.armor * HIST_ARMOR_SHRED)); // bào 5% giáp
                    }
                } catch (err) {}
                try {
                    lastHitBy[tgt.id] = { pid: apid, t: Time.time };
                } catch (err) {}
                if (!isUnitOwner) return;
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
            if (empixRevive(u)) return;
            try {
                let kr = lastHitBy[u.id];
                let up0 = u.getPlayer();
                let bu0 = botUnitOf(u);
                let upid = up0 != null ? up0.id : (bu0 != null ? bu0.botPl.id : undefined);
                if (upid !== undefined) bumpKc(upid, 2);
                if (bu0 != null && kr != null && Time.time - kr.t <= KILL_CREDIT_TICKS && kr.pid !== bu0.botPl.id) { // bot bị hạ bởi player: quét & học theo cách lắp pháo của người đó
                    bu0.botKillerId = kr.pid;
                    Log.info("[NexPvp] bot bị hạ bởi player " + kr.pid + ", quét và học theo pháo của người đó");
                }
                if (kr != null && Time.time - kr.t <= KILL_CREDIT_TICKS) bumpKc(kr.pid, upid !== undefined ? 1 : 0);
            } catch (err) {} // empixeand cứu khỏi cú đánh chí mạng: không tính kill
            let th = teamHit[u.id];
            delete teamHit[u.id];
            let hitTeam = (th != null && Time.time - th.t <= KILL_CREDIT_TICKS) ? th.team : null;
            try {
                let sPid = soldierOwner[u.id];
                if (sPid !== undefined) {
                    delete soldierOwner[u.id];
                    let gx = killExp(u) * SOLDIER_EXP_PCT / 100;
                    Groups.player.each(new Cons({ get: function(p) { if (p.id === sPid && gx > 0) addExp(p, gx); } }));
                    let sk = pvpKiller(u);
                    if (sk != null && sk.team() != u.team) { // dùng team của lính (chủ có thể là bot, không nằm trong Groups.player)
                        let skx = killExp(u) * KILL_EXP_PCT / 100;
                        if (skx > 0) addExp(sk, skx);
                    }
                }
                let dp = u.getPlayer();
                // Dọn lastHitBy[u.id] ở MỌI trường hợp chết (kể cả người chơi hồi sinh trong trận PvP đầy đủ) -
                // trước đây nhánh này không xoá, mỗi lần chết/hồi sinh để lại 1 entry rác vĩnh viễn (id unit không tái dùng),
                // tích tụ dần gây giật/lag theo thời gian chơi càng lâu.
                delete lastHitBy[u.id];
                if (dp != null && isFull() && isPvpTeam(u.team)) {
                    startRespawnLock(dp);
                    deadUnit[dp.id] = u.id;
                    delete spawnBuff[dp.id];
                    let killer = pvpKiller(u);
                    if (killer != null && killer.team() != dp.team()) {
                        let dx = killExp(u) * DEATH_EXP_PCT / 100;
                        if (dx > 0) addExp(dp, dx);
                        let kx = killExp(u) * KILL_EXP_PCT / 100;
                        if (kx > 0) addExp(killer, kx);
                    }
                }
            } catch (err) {}
            if (u.team == Vars.state.rules.waveTeam) {
                let gained = killExp(u);
                let rx = u.x;
                let ry = u.y;
                let got = {};
                let gotTeam = {};
                if (hitTeam != null && gained > 0) gotTeam[hitTeam.id] = true; // pháo của phe hạ mục tiêu -> cả phe nhận EXP dù đứng xa
                eachPl(new Cons({
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
                    eachPl(new Cons({
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
            pilotRecent = []; viewPilot = []; bagRecent = []; viewBag = [];
            lastUpTab = 0;
            auraSeen = {};
            respawnLock = {};
            deadUnit = {};
            spawnBuff = {};
            swapPending = {};
            prevUnit = {};
            extPvp = {};
            barrackT = {};
            rally = {};
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
            stVer++;
            bots = [];
            BC = newBotCtx();
            autoPauseFixed = false;
            if (upDialog != null) {
                try { upDialog.hide(); } catch (err) {}
                upDialog = null;
            }
            restoreStore(); // khôi phục tiến trình trang update đã lưu (nếu có) thay vì xóa trắng

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
        if (anyDist !== true && !upAnywhere() && Mathf.dst(u.x, u.y, core.x, core.y) > core.block.size * Vars.tilesize / 2 + NEAR_CORE) {
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

        global.NexNet.on(REQ_PILOT, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let k = parseInt(payload);
            if (k !== 0 && k !== PILOT_XIKI && k !== PILOT_EMPIX && k !== PILOT_XAKY && k !== PILOT_HIST) return;
            if ((st.pi || 0) === k) return;
            if (k === PILOT_EMPIX && st.lv < EMPIX_MIN_LEVEL) return; // cần cấp 11
            st.pi = k;
            toast(player, k === PILOT_XIKI ? tr("[accent]Đã chiêu mộ Xiki Pilot!", "[accent]Recruited Xiki Pilot!") :
                k === PILOT_XAKY ? tr("[accent]Đã chiêu mộ Xaky Pilot!", "[accent]Recruited Xaky Pilot!") :
                k === PILOT_HIST ? tr("[accent]Đã chiêu mộ HistekaIMsp Pilot!", "[accent]Recruited HistekaIMsp Pilot!") :
                k === PILOT_EMPIX ? tr("[accent]Đã chiêu mộ Empixeand Pilot!", "[accent]Recruited Empixeand Pilot!") :
                tr("[lightgray]Đã cho pilot nghỉ.", "[lightgray]Pilot dismissed."));
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
            try { if (Vars.state.isCampaign() && !d.block.unlockedNowHost()) { toast(player, tr("[scarlet]Pháo này chưa được nghiên cứu!", "[scarlet]This turret is not researched yet!")); return; } } catch (err) {}
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

        global.NexNet.on(REQ_RESET, function(player, payload) {
            let st = reqState(player);
            if (st == null) return;
            let refund = 0;
            if (String(payload) === "stat") {
                for (let k = 0; k < STATS.length; k++) { if (k === STAT_ARMY) continue; refund += st.s[k]; st.s[k] = 0; }
            } else {
                refund += st.s[STAT_ARMY]; st.s[STAT_ARMY] = 0;
                for (let i = 0; i < (st.b || 0); i++) refund += barrackCost(i);
                if ((st.b || 0) > 0) { st.b = 0; try { removeSoldiers(player.id); } catch (err) {} delete barrackT[player.id]; }
                if (st.w !== undefined && st.w !== WALL_NONE) {
                    for (let wi = 0; wi <= (st.wl || 0); wi++) refund += WALL_COST[wi];
                    if (st.w >= 0) removeTurret(st.w, { block: wallBlock(st.wl || 0) });
                    st.w = WALL_NONE; st.wl = 0;
                }
            }
            if (refund <= 0) return;
            st.pts += refund;
            st.exp = 0;
            toast(player, tr("[accent]Đã reset, hoàn ", "[accent]Reset, refunded ") + refund + tr(" điểm. EXP cấp hiện tại = 0.", " pts. Current level EXP = 0."));
            changed();
        }, false, 300);

        global.NexNet.on(REQ_CMD, function(player, payload) {
            let st = reqState(player, true); // ra lệnh ở bất cứ đâu
            if (st == null || (st.b || 0) < 1) return;
            let c = String(payload), pid = player.id;
            if (c === "t") {
                st.cmd = st.cmd === 1 ? 0 : 1;
                delete rally[pid];
                toast(player, st.cmd === 1 ? tr("[accent]Ra lệnh cho lính: BẬT (lính theo bạn; Shift+9 tập kết tại con trỏ, Shift+0 theo bạn)", "[accent]Soldier commands: ON (soldiers follow you; Shift+9 rally at cursor, Shift+0 follow)") : tr("[accent]Ra lệnh cho lính: TẮT (lính tự đi đánh)", "[accent]Soldier commands: OFF (soldiers march automatically)"));
            } else if (st.cmd === 1) {
                if (c === "f") delete rally[pid];
                else if (c === "h") { let u = player.unit(); if (u != null && u.isValid()) rally[pid] = { x: u.x, y: u.y }; }
                else if (c.indexOf("au:") === 0) {
                    let tu = Groups.unit.getByID(parseInt(c.substring(3)));
                    if (tu != null && tu.isValid() && !tu.dead && tu.team != player.team()) rally[pid] = { x: tu.x, y: tu.y, uid: tu.id };
                } else if (c.indexOf("ab:") === 0) {
                    let bp = parseInt(c.substring(3)), tb = Vars.world.build(bp);
                    if (tb != null && tb.isValid() && tb.team != player.team()) rally[pid] = { x: tb.x, y: tb.y, bpos: bp };
                } else if (c.indexOf("r:") === 0) {
                    let xy = c.substring(2).split(",");
                    let rx = parseFloat(xy[0]), ry = parseFloat(xy[1]);
                    if (isFinite(rx) && isFinite(ry)) rally[pid] = { x: Mathf.clamp(rx, 0, Vars.world.width() * Vars.tilesize), y: Mathf.clamp(ry, 0, Vars.world.height() * Vars.tilesize) };
                }
            }
            changed();
        }, false, 100);

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

        global.NexNet.on(REQ_WALL, function(player, payload) {
            let parts = String(payload).split("|");
            let mode = parts[0];
            let st = reqState(player, mode === "b");
            if (st == null) return;
            let w = st.w === undefined ? WALL_NONE : st.w;
            let lv = st.wl || 0;
            if (mode === "buy") {
                if (w !== WALL_NONE || st.pts < WALL_COST[0]) return;
                st.pts -= WALL_COST[0];
                st.w = IN_BAG;
                st.wl = 0;
                toast(player, tr("[accent]Đã mua copper-wall (+1 giới hạn lính) - xem trong Túi đồ.", "[accent]Bought copper-wall (+1 soldier cap) - check your Bag."));
                changed();
            } else if (mode === "b") {
                if (w !== IN_BAG) return;
                let tx = parseInt(parts[1]), ty = parseInt(parts[2]);
                let pos = (isNaN(tx) || isNaN(ty)) ? -1 : placeWall(player, lv, tx, ty);
                if (pos < 0) {
                    toast(player, tr("[scarlet]Vị trí không hợp lệ: phải là nền đặt lõi còn trống ở nửa map phe ta!", "[scarlet]Invalid spot: needs free core-zone floor on your half of the map!"));
                    return;
                }
                st.w = pos;
                changed();
            } else if (mode === "up") {
                if (!(w >= 0) || lv >= WALL_CHAIN.length - 1) return;
                let cost = WALL_COST[lv + 1];
                if (st.pts < cost) return;
                let b = Vars.world.build(w), nb = wallBlock(lv + 1);
                if (b == null || !b.isValid() || nb == null) return;
                let tile = b.tile;
                tile.setNet(nb, player.team(), 0);
                if (tile.build == null || tile.build.block !== nb) return;
                st.pts -= cost;
                st.wl = lv + 1;
                toast(player, tr("[accent]Nâng cấp tường: ", "[accent]Wall upgraded: ") + nb.localizedName + " (+" + wallBonus(st) + tr(" giới hạn lính)", " soldier cap)"));
                changed();
            }
        }, false, 60);

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

        global.NexNet.on(REQ_PT, function(player, payload) {
            if (!isActive() || player == null) return;
            let tm = player.team();
            if (String(payload) === "foe") {
                let found = null;
                Groups.player.each(new Cons({ get: function(o) { if (o.team() !== tm) found = o.team(); } }));
                for (let bi = 0; bi < bots.length; bi++) if (found == null && bots[bi].botPl.team() !== tm) found = bots[bi].botPl.team();
                if (found == null) return;
                tm = found;
            }
            Groups.player.each(new Cons({ get: function(o) { if (o.team() === tm) bind(o).pts++; } }));
            for (let bi = 0; bi < bots.length; bi++) if (bots[bi].botPl.team() === tm) bind(bots[bi].botPl).pts++;
            changed();
        }, false, 100);
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
        if (upAnywhere() && Vars.player.team().core() != null) return true;
        let u = Vars.player.unit();
        let core = Vars.player.team().core();
        if (core == null) return false;
        if (u == null || !u.isValid() || u.dead || Vars.player.dead()) return true;
        return Mathf.dst(u.x, u.y, core.x, core.y) <= core.block.size * Vars.tilesize / 2 + NEAR_CORE;
    }

    let sigCache = "", sigAt = 0, sigN = 0;
    // phiên bản giao diện: chỉ đổi khi người chơi thao tác UI hoặc dữ liệu của CHÍNH MÌNH đổi (không đổi vì EXP/dữ liệu người khác) -> hết giật
    function curVer() {
        let t = Time.millis();
        if (t - sigAt > 200) {
            sigAt = t;
            let sg = "";
            try { let st = localState(); if (st != null) sg = JSON.stringify(st, function(k, v) { return (k === "exp" || k === "_hs") ? undefined : v; }); } catch (err) {}
            if (sg !== sigCache) { sigCache = sg; sigN++; }
        }
        return ver + "|" + sigN;
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
            else if (kind === REQ_PILOT) { let pk = parseInt(parts[0]); if (pk === 0 && st != null) pk = st.pi; if (pk > 0) pilotTouch(pk); }
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
        if (kind === REQ_CMD) cmdMark = null;
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

    // hẹp = điện thoại màn hình dọc (scene rộng < 720 đơn vị) hoặc scene rất nhỏ
    function narrowScreen() {
        // màn hình dọc (cao > rộng) luôn dùng bố cục hẹp, bất kể số đo rộng bao nhiêu
        return screenW() < 520 || screenH() > screenW();
    }

    function portraitScreen() {
        return screenH() > screenW();
    }

    // chiều rộng khung nội dung: màn hình dọc/hẹp thì chừa lề cho viền dialog + thanh cuộn, không bao giờ vượt màn hình
    function panelW() {
        // BaseDialog tự thêm lề/viền/thanh cuộn quanh nội dung -> chừa rộng (90) khi hẹp, nếu không dialog sẽ rộng hơn màn hình
        let margin = narrowScreen() ? 90 : (shortScreen() ? 24 : 40);
        let w = Math.max(200, Math.min(screenW() - margin, narrowScreen() ? 480 : 640));
        return Math.min(w, Math.max(160, screenW() - (narrowScreen() ? 90 : 40)));
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
        return !narrowScreen() && panelW() >= 560 ? 2 : 1;
    }

    function cardW() {
        return Math.floor((panelW() - 36) / gridCols()) - 8;
    }

    // độ rộng tối thiểu của thẻ pháo: màn hình hẹp thì cho co lại theo khung thay vì ép 260
    function cardMinW() {
        return narrowScreen() ? 170 : 260;
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
        row.add(col).growX().left().minWidth(0);
        if (t === cur) {
            row.add("[accent]" + tr("Đang dùng", "In use") + "[]").width(selW).center();
        } else {
            row.button(tr("Chọn", "Select"), new Runnable({ run: function() { send(REQ_UNIT, String(t)); } })).size(selW, btnH());
        }
        p.add(row).width(w).pad(4).row();
    }

    function resetBtn(p, st, w, mode) {
        let refund = 0;
        if (mode === "stat") for (let k = 0; k < STATS.length; k++) { if (k !== STAT_ARMY) refund += st.s[k]; }
        else {
            refund += st.s[STAT_ARMY];
            for (let i = 0; i < (st.b || 0); i++) refund += barrackCost(i);
        }
        let b = p.button(tr("Reset (hoàn " + refund + " điểm, EXP cấp hiện tại về 0)", "Reset (refund " + refund + " pt, current level EXP -> 0)"), new Runnable({ run: function() {
            Vars.ui.showConfirm(tr("Reset", "Reset"), tr("Hoàn lại điểm đã nâng và đặt EXP cấp hiện tại về 0. Tiếp tục?", "Refund spent points and set current level EXP to 0. Continue?"), new Runnable({ run: function() { send(REQ_RESET, mode); } }));
        } })).width(w).height(btnH()).pad(4).get();
        b.setDisabled(refund <= 0);
        b.row();
    }

    function statHeader(p, st, w) {
        resetBtn(p, st, w, "stat");
        p.button(tr("Xem chi tiết chỉ số", "View stat details"), new Runnable({ run: function() { statDetailDialog(st); } })).width(w).height(btnH()).pad(4).row();
    }

    function statRow(p, st, i, w) {
        let lv = st.s[i] + (st.pi === PILOT_HIST && i !== STAT_ARMY ? 1 : 0); // histeka: hiển thị +1 cấp
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
        let inner = Math.max(narrowScreen() ? 130 : 150, cw - 20);
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
        let buyBtn = top.button(tr("Mua", "Buy") + " " + price, new Runnable({ run: function() { send(REQ_BUY, def.id); } })).size(narrowScreen() ? 72 : 86, btnH()).padLeft(6).get();
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
    let viewBag = []; // ảnh chụp thứ tự lúc mở túi: tương tác không làm thẻ nhảy, lần mở sau mới lên đầu

    function bagTouch(id) {
        let i = bagRecent.indexOf(id);
        if (i >= 0) bagRecent.splice(i, 1);
        bagRecent.unshift(id);
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
                g = { def: def, bag: [], on: [], built: [], n: groups.length };
                byType[def.id] = g;
                groups.push(g);
            }
            if (st.p[i] === EQUIPPED) g.on.push(i);
            else if (st.p[i] >= 0) g.built.push(i);
            else g.bag.push(i);
        }
        groups.sort(function(x, y) {
            let ix = viewBag.indexOf(x.def.id);
            let iy = viewBag.indexOf(y.def.id);
            if (ix < 0) ix = 9999;
            if (iy < 0) iy = 9999;
            return (ix - iy) || (x.n - y.n);
        });

        if (groups.length === 0) {
            c.add("[lightgray]" + tr("Túi đồ trống. Hãy mua pháo ở tab Pháo.", "Your bag is empty. Buy turrets in the Turrets tab.") + "[]").width(W).wrap().pad(20).row();
            return;
        }

        let rowH = btnH() + 22 + (narrowScreen() ? btnH() + 6 : 0);
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
            let bt = row;
            if (narrowScreen()) { row.row(); bt = new Table(); }
            let bagIdx = g.bag.length > 0 ? g.bag[0] : -1;
            let backIdx = g.on.length > 0 ? g.on[g.on.length - 1] : (g.built.length > 0 ? g.built[g.built.length - 1] : -1);
            let sellIdx = bagIdx >= 0 ? bagIdx : backIdx;
            let did = def.id;
            let ub = bt.button(tr("Tháo", "Unmount"), new Runnable({ run: function() { bagTouch(did); send(REQ_MODE, backIdx + "|u"); } })).size(btnW, btnH()).padLeft(6).get();
            ub.setDisabled(backIdx < 0);
            let mb = bt.button(tr("Lắp", "Mount"), new Runnable({ run: function() { bagTouch(did); send(REQ_MODE, bagIdx + "|e"); } })).size(btnW, btnH()).padLeft(4).get();
            mb.setDisabled(bagIdx < 0 || slotFull || !def.equip || !def.mount);
            let bb = bt.button(tr("Xây", "Build"), new Runnable({ run: function() { bagTouch(did); startBuild(did); } })).size(btnW, btnH()).padLeft(4).get();
            bb.setDisabled(bagIdx < 0 || builtFull);
            bt.button(tr("Bán", "Sell"), new Runnable({ run: function() { bagTouch(did); send(REQ_SELL, String(sellIdx)); } })).size(btnW, btnH()).padLeft(4);
            if (narrowScreen()) row.add(bt).colspan(2).growX().padTop(6).row();
            list.add(row).width(W - 24).pad(3).row();
        }
        c.add(list).width(W).top().row();
        if (st.w === IN_BAG) {
            let wr = new Table(Styles.black6);
            wr.margin(8);
            let wb0 = wallBlock(st.wl || 0);
            if (wb0 != null) wr.add(new Image(wb0.uiIcon)).size(32).padRight(10);
            wr.add("[white]" + wallName(st.wl || 0) + "[]  [accent]+" + wallBonus(st) + tr(" lính", " cap") + "[]").left().growX().wrap().minWidth(0);
            wr.button(tr("Xây", "Build"), new Runnable({ run: function() { startWallBuild(); } })).size(narrowScreen() ? 72 : 90, btnH()).padLeft(6);
            c.add(wr).width(W - 24).pad(3).row();
        }

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

    // ===== Chiêu mộ pilot cho unit người chơi =====
    function pilotIconRegion(pi) {
        try {
            if (pi === PILOT_EMPIX) {
                if (Core.atlas.has("newex-empixeand")) return Core.atlas.find("newex-empixeand");
                if (Core.atlas.has("empixeand")) return Core.atlas.find("empixeand");
                return null;
            }
            if (pi === PILOT_XAKY) {
                if (Core.atlas.has("newex-xakypilot")) return Core.atlas.find("newex-xakypilot");
                if (Core.atlas.has("xakypilot")) return Core.atlas.find("xakypilot");
                return null;
            }
            if (pi === PILOT_HIST) {
                if (Core.atlas.has("newex-histeka")) return Core.atlas.find("newex-histeka");
                if (Core.atlas.has("histeka")) return Core.atlas.find("histeka");
                return null;
            }
            if (Core.atlas.has("newex-xikipilot")) return Core.atlas.find("newex-xikipilot");
            if (Core.atlas.has("xikipilot")) return Core.atlas.find("xikipilot");
        } catch (err) {}
        return null;
    }

    // ===== Xem ảnh pilot: zoom bung ra, chạm & lướt tự do để xoay nhẹ tấm ảnh =====
    function openPilotZoom(pi, name) {
        if (Vars.headless) return;
        let reg = pilotIconRegion(pi);
        if (reg == null) return;
        let dlg = new BaseDialog(String(name));
        let t0 = Time.time;
        let tx = 0, ty = 0;       // vị trí chạm (lệch so với tâm), đơn vị UI
        let cx = 0, cy = 0;       // giá trị làm mượt
        let down = false;
        let view = extend(Element, {
            draw() {
                try {
                    let w = this.getWidth(), h = this.getHeight();
                    let age = Mathf.clamp((Time.time - t0) / 24);
                    let k = Interp.swingOut.apply(age);                 // hoạt ảnh phóng to bật ra
                    if (!down) { tx = Mathf.lerp(tx, 0, 0.07 * Time.delta); ty = Mathf.lerp(ty, 0, 0.07 * Time.delta); } // thả tay: ảnh từ từ về chính giữa
                    cx = Mathf.lerp(cx, tx, 0.22 * Time.delta);
                    cy = Mathf.lerp(cy, ty, 0.22 * Time.delta);
                    let base = Math.min(w, h) * 0.92 * k;
                    let ratio = reg.height > 0 ? reg.width / reg.height : 1;
                    let rot = Mathf.clamp(-cx * 0.06, -16, 16);          // lướt ngang: xoay nhẹ
                    let sq = 1 - Math.min(0.14, Math.abs(cy) * 0.0016);  // lướt dọc: nghiêng, ảnh bị ép nhẹ
                    let sh = 1 - Math.min(0.10, Math.abs(cx) * 0.0010);
                    let px = this.x + w / 2 + cx * 0.25;
                    let py = this.y + h / 2 + cy * 0.25;
                    Draw.reset();
                    Draw.color(0, 0, 0, 0.45 * Math.min(1, k));
                    Fill.rect(px + 5, py - 5, base * ratio * sh, base * sq);   // bóng đổ
                    Draw.color(Color.white);
                    Draw.alpha(Math.min(1, age * 3));
                    Draw.rect(reg, px, py, base * ratio * sh, base * sq, rot);
                    Draw.reset();
                } catch (err) { logOnce("pilotzoom", "pilot zoom failed: " + err); }
            }
        });
        view.touchable = Touchable.enabled;
        view.addListener(extend(InputListener, {
            touchDown(event, x, y, pointer, button) {
                down = true;
                tx = x - view.getWidth() / 2; ty = y - view.getHeight() / 2;
                return true;
            },
            touchDragged(event, x, y, pointer) {
                tx = Mathf.clamp(x - view.getWidth() / 2, -view.getWidth() / 2, view.getWidth() / 2);
                ty = Mathf.clamp(y - view.getHeight() / 2, -view.getHeight() / 2, view.getHeight() / 2);
            },
            touchUp(event, x, y, pointer, button) { down = false; }
        }));
        dlg.cont.add(view).grow();
        dlg.cont.row();
        dlg.cont.add("[lightgray]" + tr("Chạm và lướt để xoay ảnh", "Touch and drag to tilt the image") + "[]").padTop(4);
        dlg.addCloseButton();
        dlg.show();
    }

    let pilotPage = 0;
    let pilotLastW = -1;
    let pilotRecent = [];
    let viewPilot = [];

    function pilotTouch(pi) {
        let i = pilotRecent.indexOf(pi);
        if (i >= 0) pilotRecent.splice(i, 1);
        pilotRecent.unshift(pi);
    }

    function pilotOrdered(list) {
        let out = [];
        for (let i = 0; i < viewPilot.length; i++) {
            for (let j = 0; j < list.length; j++) if (list[j][0] === viewPilot[i]) out.push(list[j]);
        }
        for (let j = 0; j < list.length; j++) if (out.indexOf(list[j]) < 0) out.push(list[j]);
        return out;
    }

    function pilotList() {
        return [
            [PILOT_XIKI, "Xiki Pilot",
                "+5% EXP mỗi lần nhận EXP. Khi lên cấp: +5% EXP cấp mới và +500 EXP, kèm hoạt ảnh icon.",
                "+5% EXP on every EXP gain. On level up: +5% of new level EXP and +500 EXP, with an icon animation.", 1],
            [PILOT_EMPIX, "Empixeand Pilot",
                "+5% tấn công và +5% máu. Máu dưới 50%: 50% hồi đầy máu (hồi chiêu 5 phút).",
                "+5% attack and +5% HP. Below 50% HP: 50% chance to fully heal (5 min cooldown).", EMPIX_MIN_LEVEL],
            [PILOT_XAKY, "Xaky Pilot",
                "-20% máu, +20% tốc độ di chuyển. Từ cấp " + XAKY_MIN_LEVEL + ": khi nhận sát thương sẽ Dash theo hướng di chuyển (hồi chiêu 10s). Bộ binh dừng cách tường/công trình 1 ô, không quân bay xuyên.",
                "-20% HP, +20% move speed. From level " + XAKY_MIN_LEVEL + ": taking damage makes you Dash in your move direction (10s cooldown). Ground units stop 1 tile short of walls/buildings; air units fly through.", 1],
            [PILOT_HIST, "HistekaIMsp Pilot",
                "Mạnh toàn diện, không điểm yếu! +1 cấp cho mọi thẻ ở trang chỉ số.",
                "All-rounder, no weakness! +1 level on every stat card in the stats page.", 1]
        ];
    }

    function pilotCard(p, st, W, d) {
        let pi = d[0], minLv = d[4];
        let on = st.pi === pi;
        let locked = st.lv < minLv;
        let box = new Table(Styles.black6);
        box.margin(8);
        let isz = narrowScreen() ? 48 : 64;
        let reg = pilotIconRegion(pi);
        if (reg != null) {
            let iconImg = box.image(reg).size(isz).top().left().padRight(8).get();
            iconImg.touchable = Touchable.enabled;
            iconImg.clicked(new Runnable({ run: function() { openPilotZoom(pi, d[1]); } })); // chạm icon: zoom ảnh pilot
        } else box.add().size(isz).padRight(8);
        let info = new Table();
        info.left();
        let tag = on ? "[green]" + tr("Đã chiêu mộ", "Recruited") + "[]" :
            (locked ? "[scarlet]" + tr("Cần cấp ", "Need Lv ") + minLv + "[]" : "[lightgray]" + tr("Miễn phí", "Free") + "[]");
        info.add("[accent]" + d[1] + "[]  " + tag).left().wrap().growX().minWidth(0).row();
        info.add("[lightgray]" + tr(d[2], d[3]) + "[]").left().wrap().growX().minWidth(0).padTop(3).row();
        if (pi === PILOT_EMPIX || pi === PILOT_XAKY) {
            info.label(new Prov({ get: function() {
                let cdm = pi === PILOT_XAKY ? xakyCdAt : empixCdAt;
                let at = Vars.player != null ? cdm[Vars.player.id] : undefined;
                let left = at === undefined ? 0 : Math.ceil(((pi === PILOT_XAKY ? XAKY_CD : EMPIX_HEAL_CD) - (Time.time - at)) / 60);
                if (at === undefined || left <= 0 || Time.time < at) return "[green]" + tr("Hồi chiêu: sẵn sàng", "Cooldown: ready") + "[]";
                return "[scarlet]" + tr("Hồi chiêu: ", "Cooldown: ") + Math.floor(left / 60) + ":" + (left % 60 < 10 ? "0" : "") + (left % 60) + "[]";
            } })).left().padTop(3).row();
        }
        box.add(info).growX().minWidth(0).top();
        box.row();
        let txt = on ? tr("Cho nghỉ", "Dismiss") : (locked ? tr("Chưa đủ cấp " + minLv, "Need level " + minLv) : tr("Chiêu mộ", "Recruit"));
        let b = box.button(txt, new Runnable({ run: function() { if (!on && locked) return; send(REQ_PILOT, on ? "0" : String(pi)); } })).growX().height(btnH()).colspan(2).padTop(6).get();
        if (!on && locked) b.setDisabled(true);
        p.add(box).width(W).pad(3).row();
    }

    function buildPilot(dialog) {
        let c = dialog.cont;
        c.clear();
        let st = localState();
        if (st == null) return;
        let W = Math.min(panelW(), 520) - 24;
        let list = pilotOrdered(pilotList());
        let navH = btnH() + 12;
        let availH = Math.max(60, listH() - navH);
        let cardH = 0;
        for (let i = 0; i < list.length; i++) {
            let h = measureHeight(function(p) { pilotCard(p, st, W, list[i]); });
            if (h > cardH) cardH = h;
        }
        let perPage = Math.max(1, Math.min(list.length, Math.floor(availH / Math.max(1, cardH + 6))));
        let totalPages = Math.max(1, Math.ceil(list.length / perPage));
        if (pilotPage < 0) pilotPage = 0;
        if (pilotPage > totalPages - 1) pilotPage = totalPages - 1;
        let start = pilotPage * perPage;
        let end = Math.min(list.length, start + perPage);
        let body = new Table();
        body.top();
        for (let i = start; i < end; i++) pilotCard(body, st, W, list[i]);
        let sp = c.pane(body).width(W + 24).maxHeight(Math.max(100, listH() - (totalPages > 1 ? navH : 0))).get();
        sp.setScrollingDisabled(true, false);
        sp.setFadeScrollBars(false);
        sp.setOverscroll(false, false);
        c.row();
        if (totalPages > 1) {
            let nav = new Table();
            let nb = narrowScreen() ? 56 : 72;
            let pv = nav.button("<", new Runnable({ run: function() { if (pilotPage > 0) { pilotPage--; ver++; } } })).size(nb, btnH()).get();
            pv.setDisabled(pilotPage <= 0);
            nav.add("[white]" + (pilotPage + 1) + "/" + totalPages + "[]").width(narrowScreen() ? 56 : 80).center();
            let nx = nav.button(">", new Runnable({ run: function() { if (pilotPage < totalPages - 1) { pilotPage++; ver++; } } })).size(nb, btnH()).get();
            nx.setDisabled(pilotPage >= totalPages - 1);
            c.add(nav).width(W + 24).pad(4).row();
        }
    }

    function openPilot() {
        if (Vars.headless || !isActive()) return;
        let dialog = new BaseDialog(tr("Chiêu mộ pilot", "Recruit pilot"));
        pilotPage = 0;
        pilotLastW = -1;
        viewPilot = pilotRecent.slice();
        addClose(dialog);
        let lastVer = -1;
        dialog.update(new Runnable({
            run: function() {
                if (!nearOwnCore()) { dialog.hide(); return; }
                let w0 = Core.graphics.getWidth() * 10000 + Core.graphics.getHeight();
                let cv = curVer(); if (lastVer !== cv || pilotLastW !== w0) { lastVer = cv; pilotLastW = w0; buildPilot(dialog); }
            }
        }));
        dialog.show();
    }

    function openBag() {
        if (Vars.headless || !isActive()) return;
        if (bagDialog != null && bagDialog.isShown()) return;
        let dialog = new BaseDialog(tr("Túi đồ", "Bag"));
        addClose(dialog);
        bagPage = 0;
        viewBag = bagRecent.slice();
        let lastVer = -1;
        let lastW = -1;
        dialog.update(new Runnable({
            run: function() {
                if (!nearOwnCore()) {
                    dialog.hide();
                    return;
                }
                let w = Core.graphics.getWidth() * 10000 + Core.graphics.getHeight();
                let cv = curVer();
                if (lastVer !== cv || lastW !== w) {
                    lastVer = cv;
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

    function wallName(i) { let b = wallBlock(i); return b != null ? b.localizedName : WALL_CHAIN[i]; }

    function wallCard(p, st, w) {
        let ws = st.w === undefined ? WALL_NONE : st.w;
        let lv = st.wl || 0, mx = WALL_CHAIN.length - 1;
        let box = new Table(Styles.black6);
        box.margin(10);
        box.add("[accent]" + tr("Khối tường: tăng giới hạn lính", "Wall block: raises soldier cap") + "[]").left().row();
        box.add("[lightgray]" + tr("Mỗi cấp +1 giới hạn lính sinh từ lõi.", "Each level adds +1 to the soldier cap.") + "[]").left().wrap().growX().padBottom(6).row();
        if (ws === WALL_NONE) {
            box.add("[white]" + tr("Chưa mua. Mua ", "Not bought. Buy ") + wallName(0) + " (+1)[]").left().wrap().growX().row();
            let bb = box.button(tr("Mua", "Buy") + " (" + WALL_COST[0] + tr(" điểm)", " pt)"), new Runnable({ run: function() { send(REQ_WALL, "buy"); } })).growX().height(btnH()).padTop(8).get();
            bb.setDisabled(st.pts < WALL_COST[0]);
        } else {
            box.add("[white]" + wallName(lv) + "  " + tr("Cấp ", "Level ") + lv + "/" + mx + "  [accent]+" + (1 + lv) + tr(" lính", " cap") + "[]").left().wrap().growX().row();
            if (ws === IN_BAG) {
                box.add("[lightgray]" + tr("Đang trong Túi đồ.", "In your Bag.") + "[]").left().row();
                box.button(tr("Xây", "Build"), new Runnable({ run: function() { startWallBuild(); } })).growX().height(btnH()).padTop(6).row();
            } else if (lv < mx) {
                let cost = WALL_COST[lv + 1];
                box.add("[lightgray]" + tr("Tiếp theo: ", "Next: ") + wallName(lv + 1) + "[]").left().row();
                let ub = box.button(tr("Nâng cấp", "Upgrade") + " (" + cost + tr(" điểm)", " pt)"), new Runnable({ run: function() { send(REQ_WALL, "up"); } })).growX().height(btnH()).padTop(6).get();
                ub.setDisabled(st.pts < cost);
            } else {
                box.add("[accent]MAX[]").left().padTop(4).row();
            }
        }
        p.add(box).width(w).pad(4).row();
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
        if (lv >= 1) {
            let co = st.cmd === 1;
            box.button(tr("Ra lệnh cho lính: ", "Soldier commands: ") + (co ? tr("[green]BẬT[]", "[green]ON[]") : tr("[scarlet]TẮT[]", "[scarlet]OFF[]")), new Runnable({ run: function() { send(REQ_CMD, "t"); } })).growX().height(btnH()).padTop(6).row();
            if (co) {
                box.add("[lightgray]" + tr("Lính đi theo bạn, thấy địch trong tầm thì bắn. Shift+9: tập kết tại con trỏ. Shift+0: theo bạn.", "Soldiers follow you and shoot enemies in range. Shift+9: rally at cursor. Shift+0: follow you.") + "[]").left().wrap().growX().padTop(4).row();
                box.button(tr("Tập kết tại vị trí tôi", "Rally at my position"), new Runnable({ run: function() { send(REQ_CMD, "h"); } })).growX().height(btnH()).padTop(4).row();
                box.button(tr("Lính theo tôi", "Soldiers follow me"), new Runnable({ run: function() { send(REQ_CMD, "f"); } })).growX().height(btnH()).padTop(4).row();
            }
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
        wallCard(p, st, w);
        statRow(p, st, STAT_ARMY, w);
        resetBtn(p, st, w, "army");
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

    function scanLines(st, u0) {
        let out = [];
        let u = u0 === undefined ? null : u0;
        if (u0 === undefined) { try { u = Vars.player.unit(); } catch (err) {} }
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
        out.push([tr("Sát thương % máu tối đa", "Max HP % damage"), "+" + f1(s[9] * DMG_PCT_MAXHP) + tr("% máu tối đa mục tiêu/lần trúng", "% target max HP per hit")]);
        out.push([tr("Sát thương theo giáp", "Armor-based damage"), "+" + f1(s[10] * DMG_PER_ARMOR * u.armor * 100) + "%"]);
        out.push([tr("Đẩy lùi", "Knockback"), "+" + f1(s[11] * KNOCK_PER)]);
        out.push([tr("Pháo gắn", "Mounted turrets"), "unit " + equipCount(st) + "/" + equipSlots(st) + tr(", xây ", ", built ") + builtCount(st) + "/" + maxBuilt()]);
        return out;
    }

    // ===== Danh sách unit người chơi (host, bạn bè, bot): chỉ quét 1 lần mỗi lần bấm =====
    const KEY_ULIST = "newex-pvp-unitlist";
    let ulistPanel = null, ulistW = 0, ulistH = 0;
    function ulistClamp() {
        let t = ulistPanel;
        if (t == null) return;
        t.setPosition(Mathf.clamp(t.x, 0, Math.max(0, screenW() - t.getWidth())), Mathf.clamp(t.y, 0, Math.max(0, screenH() - t.getHeight())));
        try {
            Core.settings.put(KEY_ULIST + "-x", java.lang.Float(t.x));
            Core.settings.put(KEY_ULIST + "-y", java.lang.Float(t.y));
        } catch (err) {}
    }
    function ulistOn() {
        try { return Core.settings.getBool(KEY_ULIST, true); } catch (err) {}
        return true;
    }

    function bumpKc(pid, i) {
        let st = byId[pid];
        if (st == null) return;
        if (st.kc == null) st.kc = [0, 0, 0];
        st.kc[i]++;
        dirty = true;
    }

    function plName(pid) {
        if (isBotId(pid)) return "[orange]NexBot" + (BOT_ID - pid + 1) + "[]";
        let n = "#" + pid;
        Groups.player.each(new Cons({ get: function(p) { if (p.id === pid) n = String(p.name); } }));
        return n;
    }

    function plUnit(pid) {
        let r = null;
        if (isBotId(pid)) { let bo = botOf(pid); if (bo != null) r = bo.botPl.unit(); }
        else Groups.player.each(new Cons({ get: function(p) { if (p.id === pid) r = p.unit(); } }));
        return (r != null && r.isValid() && !r.dead) ? r : null;
    }

    function kcText(st) {
        let k = st.kc || [0, 0, 0];
        return "[lightgray]" + tr("Diệt mục tiêu: ", "Target kills: ") + "[white]" + k[0] + "[]  [lightgray]" + tr("Diệt player: ", "Player kills: ") + "[white]" + k[1] + "[]  [lightgray]" + tr("Bị hạ: ", "Deaths: ") + "[white]" + k[2] + "[]";
    }

    function openUnitDetail(pid) {
        let d = new BaseDialog(tr("Chi tiết unit", "Unit details"));
        addClose(d);
        let W = Math.min(panelW(), 520);
        let fill = function() {
            d.cont.clear();
            d.cont.button(tr("Quét lại", "Rescan"), new Runnable({ run: function() { fill(); } })).width(W).height(btnH()).pad(4).row();
            d.cont.pane(new Cons({ get: function(p) {
                p.margin(10);
                p.top();
                let st = byId[pid];
                if (st == null) { p.add("[scarlet]" + tr("Người chơi đã rời đi.", "Player left.") + "[]").row(); return; }
                p.add("[accent]" + plName(pid) + "[]  [white]" + tr("Cấp ", "Lv ") + st.lv + "[]").left().wrap().growX().row();
                p.add(kcText(st)).left().wrap().growX().padBottom(6).row();
                let u = plUnit(pid);
                let lines = u != null ? scanLines(st, u) : null;
                if (lines == null) {
                    p.add("[lightgray]" + tr("Unit: ", "Unit: ") + "[white]" + tierType(activeTier(st)).localizedName + "[]  [scarlet]" + tr("(không quét được: unit đang chết/chưa hồi sinh)", "(cannot scan: unit dead/respawning)") + "[]").left().wrap().growX().padBottom(6).row();
                } else {
                    for (let i = 0; i < lines.length; i++) {
                        p.add("[lightgray]" + lines[i][0] + "[]").left().wrap().growX().row();
                        p.add("[white]" + lines[i][1] + "[]").left().wrap().growX().padBottom(4).row();
                    }
                }
                p.add("[accent]" + tr("Chỉ số đã nâng", "Upgraded stats") + "[]").left().padTop(6).row();
                let any = false;
                for (let i = 0; i < STATS.length; i++) {
                    if (!(st.s[i] > 0)) continue;
                    any = true;
                    p.add("[lightgray]" + tr(STATS[i].vi, STATS[i].en) + "[]  [white]" + st.s[i] + "/" + statMaxLabel(i) + "[]").left().wrap().growX().row();
                }
                if (!any) p.add("[lightgray]-[]").left().row();
                p.add("[accent]" + tr("Pháo lắp trên unit ", "Turrets mounted ") + equipCount(st) + "/" + equipSlots(st) + "[]").left().padTop(8).row();
                let defs = droneDefs();
                if (st.p.length === st.d.length) {
                    for (let i = 0; i < st.d.length; i++) {
                        if (st.p[i] !== EQUIPPED) continue;
                        let def = defs.map[st.d[i]];
                        if (def == null) continue;
                        let row = new Table();
                        row.add(new Image(def.block.uiIcon)).size(28).padRight(6);
                        row.add("[white]" + def.block.localizedName + "[]  " + roleText(def.id)).left();
                        p.add(row).left().padTop(2).row();
                    }
                }
                p.add("[lightgray]" + tr("Pháo xây: ", "Built: ") + "[white]" + builtCount(st) + "/" + maxBuilt() + "[]  " + tr("Nhà máy lính: ", "Barracks: ") + "[white]" + (st.b || 0) + "[]").left().padTop(6).row();
            } })).width(W).maxHeight(listH(btnH() + 12)).scrollX(false);
        };
        fill();
        d.show();
    }

    function openUnitList() {
        if (Vars.headless || !isActive()) return;
        let d = new BaseDialog(tr("Unit người chơi", "Player units"));
        addClose(d);
        let W = Math.min(panelW(), 520);
        let fill = function() {
            d.cont.clear();
            d.cont.button(tr("Quét lại", "Rescan"), new Runnable({ run: function() { fill(); } })).width(W).height(btnH()).pad(4).row();
            d.cont.pane(new Cons({ get: function(p) {
                p.top();
                let n = 0;
                for (let id in byId) {
                    let pid = parseInt(id);
                    let st = byId[id];
                    if (st == null) continue;
                    n++;
                    let row = new Table(Styles.black6);
                    row.margin(8);
                    row.touchable = Touchable.enabled;
                    row.add(new Image(tierType(activeTier(st)).uiIcon)).size(narrowScreen() ? 32 : 40).padRight(10);
                    let col = new Table();
                    col.left();
                    col.add("[white]" + plName(pid) + "[]  [accent]" + tr("Cấp ", "Lv ") + st.lv + "[]").left().wrap().growX().row();
                    col.add(kcText(st)).left().wrap().growX();
                    row.add(col).growX().left().minWidth(0);
                    row.clicked(new Runnable({ run: function() { openUnitDetail(pid); } }));
                    p.add(row).width(W - 24).pad(4).row();
                }
                if (n === 0) p.add("[lightgray]" + tr("Chưa có dữ liệu.", "No data yet.") + "[]").pad(10).row();
            } })).width(W).maxHeight(listH(btnH() + 12)).scrollX(false);
        };
        fill();
        d.show();
    }

    if (!Vars.headless) {
        Events.on(ClientLoadEvent, new Cons({
            get: function(e) {
                try {
                    Core.bundle.getProperties().put("setting." + KEY_ULIST + ".name", tr("Hiện nút danh sách unit player (PvP)", "Show PvP player unit list button"));
                    Vars.ui.settings.game.checkPref(KEY_ULIST, true);
                } catch (err) { Log.err("[NexPvp] cannot add unit list setting: " + err); }
                try {
                    let t = new Table(Styles.black6);
                    ulistPanel = t;
                    t.margin(6);
                    t.name = "newex-pvp-unitlist";
                    t.touchable = Touchable.enabled;
                    t.image(Icon.players || Icon.add).size(Vars.mobile ? 26 : 22).padRight(6);
                    t.add(tr("Unit", "Units")).get().setFontScale(0.9);
                    t.visibility = new Boolp({ get: function() { return isActive() && Vars.ui.hudfrag.shown && ulistOn(); } });
                    t.pack();
                    if (Core.settings.has(KEY_ULIST + "-x") && Core.settings.has(KEY_ULIST + "-y")) t.setPosition(Core.settings.getFloat(KEY_ULIST + "-x", 0), Core.settings.getFloat(KEY_ULIST + "-y", 0));
                    else t.setPosition(4, (screenH() - t.getHeight()) / 2);
                    ulistClamp();
                    let dragging = false, offX = 0, offY = 0;
                    t.addListener(extend(InputListener, {
                        touchDown(event, x, y, pointer, button) { dragging = false; offX = x; offY = y; return true; },
                        touchDragged(event, x, y, pointer) {
                            if (Math.abs(x - offX) > 5 || Math.abs(y - offY) > 5) dragging = true;
                            if (dragging) {
                                t.setPosition(t.x + x - offX, t.y + y - offY);
                                ulistClamp();
                            }
                        },
                        touchUp(event, x, y, pointer, button) {
                            if (!dragging) openUnitList();
                            dragging = false;
                        }
                    }));
                    Vars.ui.hudGroup.addChild(t);
                    ulistW = Core.graphics.getWidth();
                    ulistH = Core.graphics.getHeight();
                    Events.run(Trigger.update, new Runnable({ run: function() {
                        let w = Core.graphics.getWidth(), h = Core.graphics.getHeight();
                        if (w !== ulistW || h !== ulistH) { ulistW = w; ulistH = h; ulistClamp(); }
                    } }));
                } catch (err) { Log.err("[NexPvp] cannot add unit list button: " + err); }
            }
        }));
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
        if (Vars.state.isCampaign()) {
            // chiến dịch: chỉ hiện pháo đã nghiên cứu/mở khóa
            let fl = [];
            for (let i = 0; i < defs.list.length; i++) { try { if (defs.list[i].block.unlockedNow()) fl.push(defs.list[i]); } catch (err) {} }
            defs = { list: fl, map: defs.map };
        }

        let head = new Table(Styles.black6);
        head.margin(shortScreen() ? 4 : 8);
        let bagBtnH = shortScreen() ? 32 : (Vars.mobile ? 40 : 32);
        let bagLabel = tr("Túi đồ", "Bag") + " (" + st.d.length + ")";
        let bagRun = new Runnable({ run: function() { openBag(); } });
        let pilotRun = new Runnable({ run: function() { openPilot(); } });
        let pilotLabel = "Pilot";
        if (narrowScreen()) {
            // màn hình dọc/hẹp: tách 2 hàng (Cấp + tên unit / Điểm + Túi đồ) để không bị tràn ngang
            head.add("[accent]" + tr("Cấp ", "Level ") + st.lv + "/" + maxLevel() + "[]").left().minWidth(0);
            head.add("[white]" + tierType(activeTier(st)).localizedName + "[]").expandX().right().minWidth(0);
            head.row();
            head.add("[yellow]" + tr("Điểm: ", "Points: ") + st.pts + "[]").left().minWidth(0).padTop(2);
            let nb = new Table();
            nb.button(pilotLabel, pilotRun).height(bagBtnH).minWidth(0);
            nb.button(bagLabel, bagRun).height(bagBtnH).minWidth(0).padLeft(4);
            head.add(nb).right().padTop(2);
            head.row();
        } else {
            head.add("[accent]" + tr("Cấp ", "Level ") + st.lv + "/" + maxLevel() + "[]").left();
            head.add("[white]" + tierType(activeTier(st)).localizedName + "[]").expandX().center();
            let ptsBox = new Table();
            ptsBox.add("[yellow]" + tr("Điểm: ", "Points: ") + st.pts + "[]").right();
            ptsBox.button(pilotLabel, pilotRun).height(bagBtnH).padLeft(8);
            ptsBox.button(bagLabel, bagRun).height(bagBtnH).padLeft(4);
            head.add(ptsBox).right();
            head.row();
        }
        head.add(new Bar(
            new Prov({ get: function() { return "EXP " + expText(); } }),
            new Prov({ get: function() { return Pal.accent; } }),
            new Floatp({ get: function() { return expFrac(); } })
        )).growX().height(shortScreen() ? 16 : (Vars.mobile ? 26 : 20)).colspan(narrowScreen() ? 2 : 3).padTop(shortScreen() ? 2 : 6);
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
            } })).growX().uniformX().minWidth(0).height(narrowScreen() ? Math.min(btnH(), 44) : btnH()).pad(2).get();
            try { if (narrowScreen()) tb.getLabel().setFontScale(0.85); } catch (err) {}
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
        for (let q = 0; q < STATS.length; q++) { if (q !== STAT_ARMY) statOrder.push(q); } // mọi chỉ số trừ chỉ số riêng của lính (hiển thị ở trang lính)
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
            itemCount = statOrder.length;
            let hH = measureHeight(function(p) { statHeader(p, st, innerW); });
            let rowH = 0;
            for (let i = 0; i < statOrder.length; i++) {
                let h = measureHeight((function(idx) { return function(p) { statRow(p, st, idx, innerW); }; })(statOrder[i]));
                if (h > rowH) rowH = h;
            }
            perPage = Math.min(STAT_PER_PAGE, Math.max(1, Math.floor(Math.max(0, availH - hH) / Math.max(1, rowH))));
        } else if (tab === 2) {
            itemCount = defs.list.length;
            let cwM = Math.max(cw, cardMinW());
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
            let cwE = Math.max(cw, cardMinW());
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
            nav.add("[white]" + (upPage + 1) + "/" + totalPages + "[]").width(narrowScreen() ? 56 : 80).center();
            let nextBtn = nav.button(">", new Runnable({ run: function() { if (upPage < totalPages - 1) upNavigate(1, function() { if (upPage < totalPages - 1) upPage++; }); } })).size(navBtnW, btnH()).get();
            nextBtn.setDisabled(upPage >= totalPages - 1);
        }
        if (nav != null && Vars.mobile) c.add(nav).width(W).pad(4).row();
        // cả 4 trang (Unit / Chỉ số / Pháo / Lính) đều dùng cuộn lướt tự động theo kích thước giao diện:
        // cuộn dọc luôn bật (giới hạn theo chiều cao khả dụng), cuộn ngang chỉ bật khi nội dung rộng hơn khung.
        let hs;
        if (tab === 2) {
            let cwE2 = Math.max(cw, cardMinW());
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
                let cv = curVer();
                if (upPending != null && (lastVer !== cv || lastW !== w)) upCommit(false);
                if (lastVer !== cv || lastTab !== upTab || lastW !== w) {
                    lastVer = cv;
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
        if (isBotPl(pl)) return;
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
        try { if (pilotOverlay != null) pilotOverlay.toFront(); } catch (err) {}
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

    // ===== Ẩn menu khối của game (góc dưới bên phải, cả PC lẫn mobile) khi đang ở chế độ PvP =====
    const KEY_HIDE_BLOCKMENU = "newex-pvp-hide-blockmenu";
    let blockHooked = false;
    let blockHookTry = 0;
    let blockHookTick = 0;
    let blockHookWay = "";
    let blockHookedEl = null; // bảng menu khối đã gắn hook (PlacementFragment.rebuild() sẽ thay bảng này bằng bảng mới)

    function blockMenuHidden() {
        try { return isFull() && Core.settings.getBool(KEY_HIDE_BLOCKMENU, true); } catch (err) { return false; }
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

    // game gọi PlacementFragment.rebuild() sau khi tải map / mở khóa khối -> bảng cũ bị gỡ, bảng mới chưa có hook
    function blockHookStale() {
        if (!blockHooked || blockHookedEl == null) return false;
        try { return blockHookedEl.parent == null; } catch (err) { return true; }
    }

    function hookBlockMenu() {
        if (Vars.headless) return;
        if (blockHookStale()) { blockHooked = false; blockHookedEl = null; }
        if (blockHooked) return;
        let tg = findBlockToggler();
        if (tg == null) return;
        if (blockHookedEl != null && tg.equals(blockHookedEl) && blockHooked) return;
        let orig = tg.visibility;
        tg.visibility = new Boolp({
            get: function() {
                if (blockMenuHidden()) return false;
                if (orig != null) return orig.get();
                return Vars.ui.hudfrag.shown;
            }
        });
        blockHooked = true;
        blockHookedEl = tg;
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
                blockHookTick++;
                // đã gắn: cứ ~0,25s kiểm tra bảng còn nằm trong giao diện không, nếu bị game dựng lại thì gắn lại
                if (blockHooked) {
                    if (blockHookTick % 5 === 0 && blockHookStale()) {
                        blockHooked = false;
                        blockHookedEl = null;
                        blockHookTry = 0;
                        try { hookBlockMenu(); } catch (err) { logOnce("blockhook", "block menu hook failed: " + err); }
                    }
                    return;
                }
                if (blockHookTry > 60) {
                    if (blockHookTick % 120 === 0) { blockHookTry = 40; }
                    else return;
                }
                if (blockHookTick % 15 !== 0) return;
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

    // ===== UI ra lệnh lính: nút giữa màn hình -> bảng nhỏ phía dưới (theo tôi / điều hướng) =====
    let cmdPick = false, cmdOpen = false, cmdMark = null, cmdCenter = null, cmdBottom = null;

    function cmdOn() {
        let st = localState();
        return !Vars.headless && st != null && st.cmd === 1 && isActive() && (st.b || 0) >= 1;
    }

    function cmdTargetAt(tile) {
        let team = Vars.player.team(), mw = Core.input.mouseWorld(), best = null, bd = 28 * 28;
        Groups.unit.each(new Cons({ get: function(e) {
            if (e.team === team || e.team === Team.derelict || e.dead || !e.isValid()) return;
            let d = Mathf.dst2(e.x, e.y, mw.x, mw.y);
            if (d < bd) { bd = d; best = e; }
        } }));
        if (best != null) return { x: best.x, y: best.y, uid: best.id, key: "u" + best.id };
        let b = tile.build;
        if (b != null && b.team != team && b.team != Team.derelict && tile.block() instanceof CoreBlock) return { x: b.x, y: b.y, bpos: b.tile.pos(), key: "b" + b.tile.pos() };
        if (tile.solid() && tile.build == null) return null; // tường địa hình tự nhiên: bỏ qua
        return { x: tile.worldx(), y: tile.worldy(), key: "t" + tile.x + "," + tile.y };
    }

    function cmdTap(tile) {
        if (tile == null) return;
        let g = cmdTargetAt(tile);
        if (g == null) return;
        let m = cmdMark;
        if (m != null && m.st === 1 && m.key === g.key) { // chạm lần 2: X -> O, bắt đầu ra lệnh
            send(REQ_CMD, g.uid !== undefined ? "au:" + g.uid : (g.bpos !== undefined ? "ab:" + g.bpos : "r:" + Math.round(g.x) + "," + Math.round(g.y)));
            g.st = 2;
            cmdMark = g;
            cmdPick = false;
            return;
        }
        g.st = 1;
        cmdMark = g;
    }

    function drawCmdMark() {
        let m = cmdMark;
        if (m == null) return;
        if (!cmdOn()) { cmdMark = null; return; }
        let x = m.x, y = m.y;
        if (m.uid !== undefined) {
            let tu = Groups.unit.getByID(m.uid);
            if (tu == null || !tu.isValid() || tu.dead) { cmdMark = null; return; }
            x = tu.x; y = tu.y;
        }
        Draw.z(Layer.overlayUI + 1);
        Lines.stroke(2.5);
        if (m.st === 1) {
            Draw.color(Color.valueOf("ffd34d"));
            Lines.line(x - 6, y - 6, x + 6, y + 6);
            Lines.line(x - 6, y + 6, x + 6, y - 6);
        } else {
            Draw.color(Color.valueOf("4dff88"));
            Lines.circle(x, y, 8);
        }
        Draw.reset();
    }

    function cmdStatus() {
        if (!cmdPick) return "[lightgray]" + tr("Chọn lệnh cho lính", "Pick a soldier command") + "[]";
        if (cmdMark == null) return "[accent]" + tr("Chạm vị trí / lõi / unit địch (dấu X)", "Tap a spot / core / enemy unit (X mark)") + "[]";
        return "[yellow]" + tr("Chạm lần nữa vào dấu X để bắt đầu (O)", "Tap the X again to start (O)") + "[]";
    }

    function buildCmdUi() {
        cmdCenter = new Table(Styles.black6);
        cmdCenter.margin(8);
        cmdCenter.touchable = Touchable.enabled;
        cmdCenter.add("[accent]" + tr("Ra lệnh lính", "Soldier orders") + "[]").pad(4);
        cmdCenter.pack();
        let kx = "newex-pvp-cmd-x", ky = "newex-pvp-cmd-y";
        let cmdClamp = function() {
            cmdCenter.setPosition(Mathf.clamp(cmdCenter.x, 0, Math.max(0, screenW() - cmdCenter.getWidth())), Mathf.clamp(cmdCenter.y, 0, Math.max(0, screenH() - cmdCenter.getHeight())));
        };
        if (Core.settings.has(kx) && Core.settings.has(ky)) cmdCenter.setPosition(Core.settings.getFloat(kx, 0), Core.settings.getFloat(ky, 0));
        else cmdCenter.setPosition((screenW() - cmdCenter.getWidth()) / 2, (screenH() - cmdCenter.getHeight()) / 2);
        cmdClamp();
        let dragging = false, offX = 0, offY = 0;
        cmdCenter.addListener(extend(InputListener, {
            touchDown(event, x, y, pointer, button) { dragging = false; offX = x; offY = y; return true; },
            touchDragged(event, x, y, pointer) {
                if (Math.abs(x - offX) > 5 || Math.abs(y - offY) > 5) dragging = true;
                if (dragging) {
                    cmdCenter.setPosition(cmdCenter.x + x - offX, cmdCenter.y + y - offY);
                    cmdClamp();
                }
            },
            touchUp(event, x, y, pointer, button) {
                if (dragging) {
                    try { Core.settings.put(kx, java.lang.Float(cmdCenter.x)); Core.settings.put(ky, java.lang.Float(cmdCenter.y)); } catch (err) {}
                } else {
                    cmdOpen = !cmdOpen;
                    if (!cmdOpen) cmdPick = false;
                }
                dragging = false;
            }
        }));
        Core.scene.add(cmdCenter);

        cmdBottom = new Table();
        cmdBottom.setFillParent(true);
        cmdBottom.bottom();
        try { cmdBottom.touchable = Touchable.childrenOnly; } catch (err) {}
        let padB = Math.round(Math.max(8, Math.min(Vars.mobile ? 90 : 60, screenH() * 0.12)));
        cmdBottom.table(Styles.black6, new Cons({ get: function(c) {
            c.margin(8);
            c.label(new Prov({ get: function() { return cmdStatus(); } })).colspan(2).wrap().width(narrowScreen() ? 240 : 320).pad(4).row();
            c.button(tr("Theo dõi tôi", "Follow me"), new Runnable({ run: function() { cmdPick = false; send(REQ_CMD, "f"); } })).size(narrowScreen() ? 110 : 140, btnH()).pad(3);
            c.button(tr("Điều hướng", "Move / attack"), new Runnable({ run: function() { cmdPick = true; cmdMark = null; } })).size(narrowScreen() ? 110 : 140, btnH()).pad(3);
        } })).padBottom(padB);
        Core.scene.add(cmdBottom);
    }

    if (!Vars.headless) {
        Events.run(Trigger.update, new Runnable({ run: function() {
            if (cmdCenter == null) {
                if (Core.scene == null || Vars.ui == null || Vars.ui.hudGroup == null) return;
                try { buildCmdUi(); } catch (err) { logOnce("cmdui", "command ui failed: " + err); cmdCenter = {}; return; }
            }
            if (cmdCenter.visible === undefined) return;
            let on = cmdOn() && buildMode == null;
            if (!cmdOn()) { cmdOpen = false; cmdPick = false; }
            cmdCenter.visible = on;
            cmdBottom.visible = on && cmdOpen;
        } }));
    }

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
        let def = buildDef(m.id);
        let nm = def != null ? def.block.localizedName : "";
        if (m.tx < 0) return "[accent]" + tr("Chạm 2 lần vào vị trí trên nền đặt lõi để xây ", "Tap twice on a core-zone tile to build ") + nm + "[]";
        return m.ok ? "[green]" + tr("Chạm lần nữa vào ô này để xây ", "Tap the same tile again to build ") + nm + "[]"
                    : "[scarlet]" + tr("Vị trí không hợp lệ (cần nền đặt lõi trống, nửa map phe ta)", "Invalid spot (need free core-zone on your half)") + "[]";
    }

    // bảng thông báo xây: co giãn theo kích thước UI, tự dựng lại khi đổi cỡ màn hình
    function fillBuildHud(t) {
        t.clear();
        t.bottom();
        let narrow = narrowScreen();
        let maxW = Math.max(180, Math.min(screenW() - 20, narrow ? 440 : 680));
        let bw = narrow ? 80 : 100;
        let padB = Math.round(Math.max(8, Math.min(Vars.mobile ? 90 : 60, screenH() * 0.12)));
        t.table(Styles.black6, new Cons({
            get: function(c) {
                c.margin(narrow ? 6 : 8);
                let lw = narrow ? maxW - 12 : maxW - bw - 24;
                let lb = c.label(new Prov({ get: function() { return buildStatus(); } })).width(lw).wrap().pad(4).get();
                lb.setFontScale(narrow ? 0.85 : 1);
                if (narrow) c.row();
                c.button(tr("Hủy", "Cancel"), new Runnable({ run: function() { stopBuild(); } })).size(bw, btnH()).pad(narrow ? 2 : 4);
            }
        })).padBottom(padB);
    }

    function showBuildHud() {
        let t = new Table();
        t.setFillParent(true);
        try { t.touchable = Touchable.childrenOnly; } catch (err) {}
        let key = screenW() + "x" + screenH();
        fillBuildHud(t);
        t.update(new Runnable({ run: function() {
            let k = screenW() + "x" + screenH();
            if (k !== key) { key = k; fillBuildHud(t); }
        } }));
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

    function buildDef(id) {
        if (id === WALL_BUILD_ID) { let b = wallBlock((localState() || {}).wl || 0); return b != null ? { block: b } : null; }
        return droneDefs().map[id];
    }

    function startWallBuild() {
        if (Vars.headless || !isActive()) return;
        let st = localState();
        if (st == null || st.w !== IN_BAG) return;
        if (upDialog != null) upDialog.hide();
        if (bagDialog != null) bagDialog.hide();
        stopBuild();
        buildMode = { id: WALL_BUILD_ID, tx: -1, ty: -1, ok: false, ec: [], ecT: -999 };
        showBuildHud();
    }

    function buildCheck(m, tx, ty) {
        let core = Vars.player.team().core();
        let def = buildDef(m.id);
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
            if (m.id === WALL_BUILD_ID) send(REQ_WALL, "b|" + tile.x + "|" + tile.y);
            else {
                let idx = st != null ? bagIdxOf(st, m.id) : -1;
                if (idx >= 0) send(REQ_MODE, idx + "|b|" + tile.x + "|" + tile.y);
            }
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
        let def = buildDef(m.id);
        if (!isActive() || Vars.player.dead() || core == null || def == null) { stopBuild(); return; }
        if (Time.time - m.ecT > 30) { m.ec = enemyCores(core.team); m.ecT = Time.time; }
        let ts = Vars.tilesize;
        if (BUILD_FLOOR.length > 0 && isFull() && buildZoneOn()) {
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
                if (cmdPick) { cmdTap(e.tile); return; }
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

    function hudLvText() {
        let st = localState();
        return st == null ? "" : "[accent]" + tr("Cấp ", "Lv ") + "[white]" + st.lv + "[]";
    }

    function hudPtText() {
        let st = localState();
        return st == null ? "" : "[yellow]" + tr("ĐP ", "Pt ") + st.pts + "[]";
    }

    function hudTailText() {
        let st = localState();
        if (st == null) return "";
        let sl = invulTicksLeft();
        return sl > 0 ? "[cyan]" + tr("Khiên ", "Shield ") + fmtTicks(sl) + "[]" : "[lightgray]" + tierType(activeTier(st)).localizedName + "[]";
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
            t.margin(6);
            t.touchable = Touchable.enabled;
            let top = new Table();
            top.label(new Prov({ get: function() { return hudLvText(); } })).left().growX().get().setFontScale(0.85);
            top.label(new Prov({ get: function() { return hudPtText(); } })).right().get().setFontScale(0.85);
            t.add(top).width(W);
            t.row();
            t.add(new Bar(
                new Prov({ get: function() { return expText(); } }),
                new Prov({ get: function() { return Pal.accent; } }),
                new Floatp({ get: function() { return expFrac(); } })
            )).size(W, Vars.mobile ? 18 : 16).padTop(4);
            t.row();
            let tl = t.label(new Prov({ get: function() { return hudTailText(); } })).width(W).padTop(4).get();
            tl.setFontScale(0.8);
            tl.setAlignment(1);
            t.row();
            let ub = t.button(tr("Nâng cấp", "Upgrade"), Icon.up || Icon.add, new Runnable({ run: function() { openUpgrade(); } })).size(W, Vars.mobile ? 36 : 28).padTop(5).get();
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

    let camBot = 0;
    let camMode = 0; // 0: theo unit, 1: góc nhìn tự do, 2: camera bot
    function camNote(on) {
        try { Vars.ui.showInfoToast(camMode === 2 ? tr("Camera bot: BẬT", "Bot camera: ON") : camMode === 1 ? tr("Góc nhìn tự do: BẬT", "Free view: ON") : tr("Camera: theo unit", "Camera: follow unit"), 2); } catch (err) {}
        try { if (camMode === 0) Vars.control.input.panning = false; } catch (err) {}
    }
    if (!Vars.headless) {
        Events.run(Trigger.preDraw != null ? Trigger.preDraw : Trigger.update, new Runnable({
            run: function() {
                if (coreCine != null) {
                    try {
                        let c = coreCine, dt = Math.min(6, Core.graphics.getDeltaTime() * 60);
                        c.t += dt;
                        Vars.control.input.panning = true;
                        let cp = Core.camera.position;
                        let k = 1 - Math.exp(-dt / 18);
                        cp.set(cp.x + (c.x - cp.x) * k, cp.y + (c.y - cp.y) * k);
                        if (c.t > 60 && c.t < c.dur) {
                            c.fx += dt;
                            if (c.fx >= 6) {
                                c.fx = 0;
                                let pw = (c.t - 60) / (c.dur - 60), rx = c.x + (Math.random() - 0.5) * 60, ry = c.y + (Math.random() - 0.5) * 60;
                                try { Fx.explosion.at(rx, ry); } catch (err) {}
                                if (pw > 0.5) try { Fx.smokeCloud.at(rx, ry); } catch (err) {}
                                try { Effect.shake(2 + pw * 6, 10, c.x, c.y); } catch (err) {}
                            }
                        }
                        if (c.t >= c.dur + 90) { coreCine = null; if (camMode === 0) Vars.control.input.panning = false; }
                    } catch (err) { coreCine = null; }
                    return;
                }
                if (camMode === 0) return;
                if (!isActive()) { camMode = 0; return; }
                try {
                    Vars.control.input.panning = true;
                    let cp = Core.camera.position;
                    if (camMode === 2) {
                        let bu = bots.length > 0 ? bots[Math.min(camBot, bots.length - 1)].botPl.unit() : null;
                        if (bu != null && bu.isValid() && !bu.dead) cp.set(bu.x, bu.y);
                    } else {
                        let sp = 900 * Math.min(0.1, Core.graphics.getDeltaTime()), K = KeyCode;
                        if (!Core.scene.hasKeyboard()) {
                            if (Core.input.keyDown(K.left)) cp.x -= sp;
                            if (Core.input.keyDown(K.right)) cp.x += sp;
                            if (Core.input.keyDown(K.up)) cp.y += sp;
                            if (Core.input.keyDown(K.down)) cp.y -= sp;
                        }
                    }
                } catch (err) {}
            }
        }));
    }

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
                    if (sh && !Core.scene.hasKeyboard()) {
                        if (Core.input.keyTap(KeyCode.num5)) { camMode = camMode === 1 ? 0 : 1; camNote(camMode === 1); }
                        if (Core.input.keyTap(KeyCode.num6)) { if (camMode === 2 && camBot + 1 < bots.length) camBot++; else { camMode = camMode === 2 ? 0 : 2; camBot = 0; } camNote(camMode === 2); }
                        if (Core.input.keyTap(KeyCode.num9)) { let mw = Core.input.mouseWorld(); send(REQ_CMD, "r:" + Math.round(mw.x) + "," + Math.round(mw.y)); }
                        if (Core.input.keyTap(KeyCode.num0)) send(REQ_CMD, "f");
                        if (Core.input.keyTap(KeyCode.num7)) send(REQ_PT, "me");
                        if (Core.input.keyTap(KeyCode.num8)) send(REQ_PT, "foe");
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
    const JOY_LAG_SEC = 1.5; // camera trễ sau khi biến về / bị hạ / vừa hồi sinh
    const JOY_CAM_MIN_SPD = 900; // đơn vị thế giới/giây
    let joyLagT = 0;
    let joyPrevUnit = null;
    let joyPrevX = 0;
    let joyPrevY = 0;

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
        if (!Vars.mobile || Vars.headless || !pvpCtl() || !joyEnabled()) return false;
        if (!Vars.ui.hudfrag.shown || Core.scene.hasDialog()) return false;
        return joyUnit() != null;
    }

    function joyLocksCam() {
        return Vars.mobile && !Vars.headless && pvpCtl() && joyEnabled() && camMode === 0 && coreCine == null;
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
        let side = Math.floor(Math.min(gw, gh) * 0.5); // vùng vuông, cả màn dọc lẫn ngang
        joyPad.setSize(side, side);
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
                    let dtl = Math.min(0.1, Core.graphics.getDeltaTime());
                    if (cu == null) {
                        if (joyPrevUnit != null) joyLagT = JOY_LAG_SEC; // vừa bị hạ
                        joyPrevUnit = null;
                    } else {
                        let jx = cu.x - joyPrevX, jy = cu.y - joyPrevY;
                        // unit mới (hồi sinh / biến về) hoặc dịch chuyển tức thời -> bật trễ
                        if (cu !== joyPrevUnit || jx * jx + jy * jy > 400 * 400) joyLagT = JOY_LAG_SEC;
                        joyPrevUnit = cu;
                        joyPrevX = cu.x;
                        joyPrevY = cu.y;
                    }
                    if (joyLagT > 0) joyLagT -= dtl;
                    if (cu != null) {
                        try { Vars.control.input.panning = false; } catch (err) {}
                        try {
                            let cp = Core.camera.position;
                            let dtc = Math.min(0.1, Core.graphics.getDeltaTime());
                            let ddx = cu.x - cp.x;
                            let ddy = cu.y - cp.y;
                            let dd = Math.sqrt(ddx * ddx + ddy * ddy);
                            // tốc độ tối thiểu không đổi -> gần tới không bị chậm lại
                            let step = Math.max(dd * (1 - Math.exp(-dtc / JOY_CAM_LAG)), JOY_CAM_MIN_SPD * dtc);
                            if (joyLagT <= 0 || dd <= step) cp.set(cu.x, cu.y);
                            else cp.set(cp.x + ddx / dd * step, cp.y + ddy / dd * step);
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
        setf(r, "pvpAutoPause", false); // không tự dừng game khi chưa đủ 2 đội có người (bot sẽ giữ chỗ)
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
        persistStore: persistStore,

        onBegin: function() {
            winning = false;
            seenBoth = false;
            byId = {};
            equipCd = {};
            teamsCache = null;
            let r = Vars.state.rules;
            r.tags.put(TAG_ACTIVE, "1");
            store = {};
            r.tags.put(TAG_STORE, "{}");
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
            stVer++;
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

        addSettings: function(outer) {
            outer.button(tr("NewMode PvP - Tùy chỉnh", "NewMode PvP - Settings"), Icon.settings, function() {
                let d = new BaseDialog("NewMode PvP");
                let c = new Table();
                c.top().margin(10);
                let save = api._build(c);
                d.cont.add(new ScrollPane(c)).grow().row();
                d.hidden(function() { try { save(); } catch (err) {} });
                d.addCloseButton();
                d.show();
            }).size(280, 54).pad(6).row();
            return function() {};
        },

        _build: function(content) {
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

            let bzVal = buildZoneOn();
            content.check(tr("Chỉ xây pháo đã mua trên nền đặt lõi", "Build owned turrets only on core-zone floor"), bzVal, new Boolc({
                get: function(v) { bzVal = v; }
            })).pad(5).left().row();
            let rzVal = returnZoneOn();
            content.check(tr("Cần đứng trên nền đặt lõi để biến về", "Must stand on core-zone to return to core"), rzVal, new Boolc({
                get: function(v) { rzVal = v; }
            })).pad(5).left().row();
            let uaVal = upAnywhere();
            content.check(tr("Không cần ở gần lõi vẫn vào trang nâng cấp", "Open upgrade page without being near core"), uaVal, new Boolc({
                get: function(v) { uaVal = v; }
            })).pad(5).left().row();
            let wrVal = waveRandomOn();
            content.check(tr("Địch từ wave spawn ngẫu nhiên khắp bản đồ (tắt = chỉ ở giữa)", "Wave enemies spawn randomly across the map (off = center only)"), wrVal, new Boolc({
                get: function(v) { wrVal = v; }
            })).pad(5).left().row();
            content.add(tr("Địa bàn mỗi phe (ô quanh lõi, 0 = nửa map; tối đa " + LIMIT_TERR + "):", "Territory per team (tiles around core, 0 = half map; max " + LIMIT_TERR + "):")).padBottom(4).row();
            let tTable = new Table();
            let tField = tTable.field(String(Core.settings.getInt(KEY_TERR, 0)), text => {}).width(120).get();
            tField.setFilter(TextField.TextFieldFilter.digitsOnly);
            tField.setMaxLength(3);
            tTable.add(tr("ô (map ngoài: 0 = " + EXT_BUILD_RANGE + ")", "tiles (other maps: 0 = " + EXT_BUILD_RANGE + ")")).padLeft(8);
            content.add(tTable).pad(5).row();

            let extVal = extEnabled();
            content.check(tr("Dùng NewMode ở map khác (EXP diệt quái, biến về đổi unit, xây dựng)", "Use NewMode on other maps (kill EXP, return toggles unit, building)"), extVal, new Boolc({
                get: function(v) { extVal = v; }
            })).pad(5).left().row();

            let pvbVal = pvbOn();
            content.check(tr("Player vs Bot: mọi người chơi cùng 1 phe đấu phe bot (thêm người = thêm bot, bot càng thông minh)", "Player vs Bot: all players on one side vs the bot team (more players = more bots, smarter bots)"), pvbVal, new Boolc({
                get: function(v) { pvbVal = v; }
            })).pad(5).left().row();
            let bvbVal = bvbOn();
            content.check(tr("Bot vs Bot: người chơi chỉ xem, 2 phe đều là bot (ưu tiên hơn Player vs Bot; áp dụng khi mở map; phím 6 đổi camera bot)", "Bot vs Bot: players only watch, both sides are bots (overrides Player vs Bot; applies on map open; key 6 cycles bot cameras)"), bvbVal, new Boolc({
                get: function(v) { bvbVal = v; }
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

                Core.settings.put(KEY_BZONE, bzVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
                Core.settings.put(KEY_RZONE, rzVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
                Core.settings.put(KEY_UPANY, uaVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
                Core.settings.put(KEY_WRAND, wrVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
                let tv = parseInt(tField.getText());
                if (isNaN(tv) || tv < 0) tv = 0;
                if (tv > LIMIT_TERR) tv = LIMIT_TERR;
                Core.settings.put(KEY_TERR, java.lang.Integer(tv));
                Core.settings.put(KEY_EXT, extVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
                Core.settings.put(KEY_MULTI, multiVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
                Core.settings.put(KEY_PVB, pvbVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
                Core.settings.put(KEY_BVB, bvbVal ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
            };
        }
    };

    global.NexPvp = api;
})();