(function() {
    const DRONE_IDS = [
        "duo", "scatter", "scorch", "hail", "wave", "lancer", "arc", "parallax", "swarmer",
        "salvo", "segment", "tsunami", "fuse", "ripple", "cyclone", "foreshadow", "spectre", "meltdown",
        "breach", "diffuse", "sublimate", "titan", "disperse", "afflict", "lustre", "scathe", "smite", "malign",
        "forstarsilum"
    ];

    const FORSTAR_CHARGE_TICKS = 60;
    const FORSTAR_NORMAL_ATK_PCT = 80;
    const FORSTAR_NORMAL_HP_PCT = 20;
    const FORSTAR_BASE_DMG = 78;
    const FORSTAR_MIN_OWNED = 2;
    const FORSTAR_RAGE_CHANCE = 0.4;
    const FORSTAR_RAGE_HP_PCT = 250;
    const FORSTAR_RAGE_ATK_PCT = 120;
    const FORSTAR_RANGE = 320;
    const FORSTAR_COST = 20;
    const FORSTAR_TRUE_PCT = 0.75;
    const FORSTAR_CRIT_CHANCE = 0.50;
    const FORSTAR_CRIT_MUL = 4.0;
    const FORSTAR_STARLIGHT_CHANCE = 0.09;
    const FORSTAR_HPSTRIKE_CHANCE = 0.10;
    const FORSTAR_HPSTRIKE_PCT = 0.01;
    const FORSTAR_STARLIGHT_ITEM = "newex-starlight";
    const STAR_KIND = "newex-pvp-star";

    const MAP_ID = "pvpnewex3110";
    const REWARD_POINTS = 30;

    const TAG_ACTIVE = "newex-pvp";
    const KEY_EXP = "newex-pvp-exp-percent";
    const KEY_DRONES = "newex-pvp-max-drones";
    const KEY_SHIELD = "newex-pvp-shield-min";
    const KEY_HUD = "newex-pvp-hud";
    const KEY_HUD_X = "newex-pvp-hud-x";
    const KEY_HUD_Y = "newex-pvp-hud-y";
    const KEY_KD = "newex-pvp-kd";
    const KEY_KD_X = "newex-pvp-kd-x";
    const KEY_KD_Y = "newex-pvp-kd-y";
    const RESPAWN_SEC = [2, 4, 6, 9, 12];
    const CORE_MOUNT = -2;
    const DEFAULT_EXP = 100;
    const DEFAULT_DRONES = 3;
    const LIMIT_EXP = 1000;
    const LIMIT_DRONES = 12;
    const DEFAULT_SHIELD_MIN = 15;
    const LIMIT_SHIELD_MIN = 600;
    const SHIELD_HP = 15000;
    const SHIELD_BUFFER = 1000000;
    const SHIELD_SYNC_TICKS = 30;
    const SHIELD_KIND = "newex-pvp-shield";
    const SHIELD_COLOR = Color.valueOf("#d000ff");
    const SHIELD_GLOW = Color.valueOf("#00f0ff");
    const SHIELD_GOLD = Color.valueOf("#ffe58a");

    const SYNC_KIND = "newex-pvp-sync";
    const REQ_UP = "newex-pvp-up";
    const REQ_BUY = "newex-pvp-buy";
    const REQ_SELL = "newex-pvp-sell";
    const REQ_UNIT = "newex-pvp-unit";
    const REQ_MODE = "newex-pvp-mode";

    const MAX_LEVEL = 99;
    const KEY_MAXLV = "newex-pvp-max-level";
    const LIMIT_MAXLV = 999;
    const FREE_SWITCH_LEVEL = 5;
    const STAT_PER_PAGE = 4;
    const TURRET_PER_PAGE = 5;
    const UNIT_PER_PAGE = 5;
    const ARMY_PER_PAGE = 5;
    const TIER_MAX = 7;
    const STAT_MAX = 20;
    const START_POINTS = 3;
    const PASSIVE_EXP = 60;
    const PASSIVE_INTERVAL = 3600;
    const MAX_WAVE_UNITS = 200;
    const PCT_STAT = 8;
    const MAXHP_DMG_DIV = 3;
    const REIGN_HP_MUL = 1.5;
    const DISRUPT_SPEED_MUL = 2.2;

    function maxHpDmgPct(l) {
        return (l + 1) * 0.1 / MAXHP_DMG_DIV;
    }
    const EXP_PER_HP = 0.1;
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
    const DMG_PER_ARMOR = 0.03;
    const KNOCK_PER = 1.0;

    const TURRET_OVERRIDES = {
        scatter: { spread: 8, rapidMul: 0.4 },
        parallax: { equip: true, beam: true, pull: true, beamDps: 24, pullForce: 0.6 },
        salvo: { equip: true, rail: true, rangeTiles: 33, railPct: 150, railLen: 33, railWidth: 9, railInterval: 120 },
        meltdown: { equip: true, blast: true, rangeTiles: 20, blastPct: 100, blastRadius: 3, blastInterval: 60 },
        sublimate: { liquidAmmo: "ozone" },
        scorch: { aura: true, auraRange: 15, auraAtkPct: 50, auraArmorPct: 50 },
        lustre: { equip: false },
        scathe: { equip: false, dmgAtkPct: 100 },
        hail: { rangeMul: 2.5 },
        lancer: { rangeMul: 1.5 },
        ripple: { rangeMul: 2.5 },
        fuse: { dmgArmorPct: 200, dmgCopy: true },
        smite: { unitRateMul: 1.8 },
        malign: { costFixed: 18, stackCost: 1, unitRateMul: 0.5, lifeMul: 0.7 },
        foreshadow: { costMul: 2 },
        forstarsilum: { equip: true, star: true, costFixed: FORSTAR_COST, rangeTiles: FORSTAR_RANGE / 8 },
        breach: { costFixed: 1, dmgAtkPct: 100 }
    };

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
        scathe: ROLE_DEALER, smite: ROLE_ATTACK, malign: ROLE_DEALER, forstarsilum: ROLE_DEALER
    };

    function roleText(id) {
        let r = TURRET_ROLES[id];
        if (r === ROLE_BRAWLER) return "[orange]" + tr("Cận chiến (Brawler)", "Brawler") + "[]";
        if (r === ROLE_ATTACK) return "[scarlet]" + tr("Tấn công (Attack)", "Attack") + "[]";
        if (r === ROLE_DEFENSE) return "[sky]" + tr("Phòng thủ (Defense)", "Defense") + "[]";
        if (r === ROLE_DEALER) return "[gold]" + tr("Sát thương (Damage Dealer)", "Damage Dealer") + "[]";
        return "";
    }

    let shredMap = new Map();
    let starState = {};


    function starRewardStarlight(team) {
        if (Vars.net.client() || team == null) return;
        try {
            let core = team.core();
            if (core == null) return;
            let item = Vars.content.getByName(ContentType.item, FORSTAR_STARLIGHT_ITEM);
            if (item != null && Math.random() < FORSTAR_STARLIGHT_CHANCE) {
                core.items.add(item, 1);
                try { Call.effect(Fx.itemTransfer, core.x, core.y, 0, Color.valueOf("ffda66")); } catch (err) {}
            }
        } catch (err) {}
    }

    function starOnHit(b, entity, wasDead) {
        if (entity == null || wasDead) return;
        if (!Vars.net.client() && Math.random() < FORSTAR_HPSTRIKE_CHANCE) {
            try { entity.damagePierce(entity.maxHealth * FORSTAR_HPSTRIKE_PCT); } catch (err) {}
        }
        if (entity.dead === true || entity.health <= 0) starRewardStarlight(b.team);
    }

    let starHitFx = null;
    let starShockFx = null;
    let starBlastFx = null;
    let starPartFx = null;
    try {
        starHitFx = extend(ParticleEffect, {
            line: true, particles: 8, lifetime: 26, length: 35, cone: -40,
            lenFrom: 6, lenTo: 6,
            colorFrom: Color.valueOf("A9D8FF"), colorTo: Color.valueOf("66B1FF")
        });
        starBlastFx = extend(ParticleEffect, {
            line: true, particles: 32, lifetime: 55, length: 130, cone: 360,
            lenFrom: 20, lenTo: 2, strokeFrom: 7, strokeTo: 0,
            colorFrom: Color.white, colorTo: Color.valueOf("3399FF")
        });
        starPartFx = extend(ParticleEffect, {
            particles: 24, lifetime: 60, length: 90, cone: 360,
            sizeFrom: 6, sizeTo: 0,
            colorFrom: Color.valueOf("A9D8FF"), colorTo: Color.valueOf("1a4a88")
        });
        starShockFx = new Effect(40, new Cons({
            get: function(e) {
                let fin = e.fin();
                let fout = e.fout();
                let steps = 30;
                let rad = e.rotation * Mathf.degRad;
                let cosA = Math.cos(rad);
                let sinA = Math.sin(rad);
                let rings = [[30, 80, 35, 5.0, "66B1FF", "FFFFFF"], [20, 50, 65, 3.0, "3399FF", "A9D8FF"]];
                for (let r = 0; r < rings.length; r++) {
                    let rg = rings[r];
                    Draw.color(Color.valueOf(rg[5]), Color.valueOf(rg[4]), fin);
                    Lines.stroke(rg[3] * fout);
                    let rx0 = fin * rg[0];
                    let ry0 = fin * rg[1];
                    let off = fin * rg[2];
                    let cx = e.x + cosA * off;
                    let cy = e.y + sinA * off;
                    let lx0 = 0;
                    let ly0 = 0;
                    for (let i = 0; i <= steps; i++) {
                        let ang = (i * (360 / steps)) * Mathf.degRad;
                        let lx = Math.cos(ang) * rx0;
                        let ly = Math.sin(ang) * ry0;
                        let px = cx + (lx * cosA - ly * sinA);
                        let py = cy + (lx * sinA + ly * cosA);
                        if (i > 0) Lines.line(lx0, ly0, px, py);
                        lx0 = px;
                        ly0 = py;
                    }
                }
                Draw.reset();
            }
        }));
    } catch (err) {
        Log.err("[NexPvp] cannot create forstarsilum effects: " + err);
    }

    function starFxAt(fxo, x, y, rot) {
        if (fxo == null) return;
        try {
            if (!Vars.net.client()) {
                Call.effect(fxo, x, y, rot, Color.white);
                return;
            }
        } catch (err) {}
        try { fxo.at(x, y, rot); } catch (err) {}
    }

    let starNormalBullet = null;
    let starUltBullet = null;
    try {
        starNormalBullet = extend(BasicBulletType, {
            speed: 10, damage: FORSTAR_BASE_DMG, lifetime: FORSTAR_RANGE / 10, width: 20, height: 40,
            shrinkX: 0, shrinkY: 0,
            frontColor: Color.valueOf("bbdefb"), backColor: Color.valueOf("90caf9"),
            sprite: "newex-starsword",
            inaccuracy: 0,
            pierce: true, pierceCap: 999, pierceBuilding: true, knockback: 1, impact: true,
            hitEffect: starHitFx, despawnEffect: starHitFx,
            hitEntity: function(b, entity, health) {
                let wasDead = entity.dead === true || entity.health <= 0;
                this.super$hitEntity(b, entity, health);
                starOnHit(b, entity, wasDead);
            }
        });
        starUltBullet = extend(BasicBulletType, {
            speed: 25, damage: 1, lifetime: 30, width: 35, height: 70,
            shrinkX: 0, shrinkY: 0,
            frontColor: Color.white, backColor: Color.valueOf("bbdefb"),
            sprite: "newex-starsword",
            inaccuracy: 0,
            pierce: true, pierceCap: 999, pierceBuilding: true, knockback: 4.0, impact: true,
            pierceArmor: true,
            absorbable: false, hittable: false, reflectable: false,
            hitEffect: starHitFx, despawnEffect: starHitFx,
            hitEntity: function(b, entity, health) {
                let wasDead = entity.dead === true || entity.health <= 0;
                this.super$hitEntity(b, entity, health);
                if (wasDead) return;
                let td = Number(b.data);
                if (!Vars.net.client()) {
                    if (td > 0) {
                        try {
                            entity.health -= td;
                            if (entity.health <= 0) entity.kill();
                        } catch (err) {}
                    }
                    try {
                        if (entity.armor !== undefined) entity.armor = entity.armor * 0.5;
                    } catch (err) {}
                    if (Math.random() < FORSTAR_CRIT_CHANCE) {
                        try { entity.damage(b.damage * FORSTAR_CRIT_MUL); } catch (err) {}
                    }
                }
                if (Math.random() < FORSTAR_CRIT_CHANCE) {
                    try {
                        if (starShockFx != null) starShockFx.at(b.x, b.y, b.rotation());
                        if (starBlastFx != null) starBlastFx.at(b.x, b.y);
                        if (starPartFx != null) starPartFx.at(b.x, b.y);
                        Effect.shake(14, 14, b.x, b.y);
                    } catch (err) {}
                }
                starOnHit(b, entity, false);
            },
            hitTile: function(b, build, x, y, initialHealth, direct) {
                this.super$hitTile(b, build, x, y, initialHealth, direct);
                if (Vars.net.client() || build == null) return;
                let td = Number(b.data);
                if (td > 0) {
                    try {
                        build.health -= td;
                        if (build.health <= 0) {
                            build.kill();
                            starRewardStarlight(b.team);
                        }
                    } catch (err) {}
                }
            }
        });
    } catch (err) {
        Log.err("[NexPvp] cannot create forstarsilum bullets: " + err);
    }

    const STATS = [
        { vi: "Máu", en: "Health", f: function(l) { return "+" + (l * HP_PCT) + "%  +" + (l * HP_FLAT) + " " + tr("máu", "HP"); } },
        { vi: "Giáp", en: "Armor", f: function(l) { return "+" + (l * ARM_FLAT) + " " + tr("giáp", "armor") + "  -" + armorCut(l).toFixed(1) + "% " + tr("sát thương nhận", "damage taken"); } },
        { vi: "Tấn công", en: "Attack", f: function(l) { return "+" + (l * ATK_PCT) + "%  +" + (l * ATK_FLAT).toFixed(1) + " " + tr("sát thương/phát", "dmg/hit"); } },
        { vi: "Tốc độ di chuyển", en: "Move speed", f: function(l) { return "+" + (l * SPD_PCT) + "%  +" + (l * SPD_FLAT).toFixed(2) + " " + tr("tốc", "speed"); } },
        { vi: "Tốc độ bắn", en: "Fire rate", f: function(l) { return "+" + (l * 6) + "%"; } },
        { vi: "Tỉ lệ bạo kích", en: "Crit chance", f: function(l) { return (l * 2) + "%"; } },
        { vi: "Sát thương bạo kích", en: "Crit damage", f: function(l) { return (150 + l * 12) + "%"; } },
        { vi: "Xuyên giáp", en: "Armor pierce", f: function(l) { return (l * 5) + "%"; } },
        { vi: "Sát thương % máu tối đa", en: "Max HP damage", mx: 9, f: function(l) { return maxHpDmgPct(l).toFixed(2) + "%"; } },
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
    let equipRail = {};
    let hostOwner = {};
    let builtOwner = {};
    let auraSeen = {};
    let respawnLock = {};
    let coreT = 0;
    let deathOk = null;
    let hudPanel = null;
    let kdPanel = null;
    let hudLastW = 0;
    let hudLastH = 0;
    let swapPending = {};
    let burstState = {};
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

    function maxDrones() {
        let v = DEFAULT_DRONES;
        try { v = Core.settings.getInt(KEY_DRONES, DEFAULT_DRONES); } catch (err) {}
        if (!(v >= 0)) v = DEFAULT_DRONES;
        return Math.min(LIMIT_DRONES, Math.floor(v));
    }

    function shieldMinutes() {
        let v = DEFAULT_SHIELD_MIN;
        try { v = Core.settings.getInt(KEY_SHIELD, DEFAULT_SHIELD_MIN); } catch (err) {}
        if (!(v >= 0)) v = DEFAULT_SHIELD_MIN;
        return Math.min(LIMIT_SHIELD_MIN, Math.floor(v));
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

    function addExp(pl, amount) {
        let st = bind(pl);
        if (st.lv >= maxLevel()) return;
        st.exp += amount;
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

    function addKill(pl) {
        let st = bind(pl);
        st.k = (st.k || 0) + 1;
        dirty = true;
    }

    function addDeath(pl) {
        let st = bind(pl);
        st.dd = (st.dd || 0) + 1;
        dirty = true;
    }

    function broadcast() {
        let out = {};
        for (let id in byId) {
            let s = byId[id];
            out[id] = [s.lv, Math.floor(s.exp), s.pts, s.s, s.d, s.u || 0, s.p, s.b || 0, s.k || 0, s.dd || 0];
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
                n[id] = { lv: a[0], exp: a[1], pts: a[2], s: a[3], d: a[4], u: a[5] || 0, p: pp, b: a[7] || 0, k: a[8] || 0, dd: a[9] || 0 };
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
            Vars.netClient.addPacketHandler(STAR_KIND, new Cons({
                get: function(content) { onStar(content); }
            }));
            Vars.netClient.addPacketHandler(SHIELD_KIND, new Cons({
                get: function(content) { onShieldSync(content); }
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
            if (ov.costFixed != null) cost = ov.costFixed;
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
            if (d.ov.rangeMul) {
                let m = d.ov.rangeMul;
                try { d.block.range = d.block.range * m; } catch (err) {}
                try {
                    let pr = ammoPairs(d.block);
                    for (let j = 0; j < pr.length; j++) {
                        let abt = pr[j].v;
                        if (abt == null) continue;
                        try {
                            if (className(abt) === "LaserBulletType") abt.length = abt.length * m;
                            else if (abt.scaleLife !== true) abt.lifetime = abt.lifetime * m;
                        } catch (err2) {}
                    }
                } catch (err) {}
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
        builtOwner[b.id] = pl.id;
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

    function fireEquip(u, def, bt, mp, tx, ty, dmgOverride, lifeMul) {
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

        if (dmgOverride != null && def.ov && def.ov.dmgCopy) {
            try {
                let cbt = bt.copy();
                cbt.damage = dmgOverride;
                bt = cbt;
            } catch (err) {}
        }

        let ls = 1;
        try {
            if (bt.scaleLife === true) {
                let rng = bt.range > 0 ? bt.range : bt.speed * bt.lifetime;
                if (rng > 0) ls = Math.max(0.05, Math.min((def.ov && def.ov.rangeMul) || 1, Mathf.dst(x, y, tx, ty) / rng));
            }
        } catch (err) {}

        for (let k = 0; k < shots; k++) {
            let a = ang + (k - (shots - 1) / 2) * spread + (Math.random() - 0.5) * 2 * inacc;
            let blt = null;
            try {
                blt = bt.create(own, u.team, x, y, a, -1, 1, ls, null);
            } catch (err) {
                try {
                    blt = bt.create(own, u.team, x, y, a);
                } catch (err2) {
                    logOnce("create:" + def.id, "bullet create failed for " + def.id + ": " + err2);
                }
            }
            if (dmgOverride != null && blt != null) {
                try { blt.damage = dmgOverride; } catch (err3) {}
            }
            if (lifeMul != null && lifeMul !== 1 && blt != null) {
                try { blt.lifetime = blt.lifetime * lifeMul; } catch (err4) {}
            }
        }
        if (!Vars.headless) {
            try { blk.shootSound.at(mp.x, mp.y, 0.9 + Math.random() * 0.2); } catch (err) {}
        }
        if (def.ov && def.ov.star) {
            try { if (blk.shootEffect != null) blk.shootEffect.at(x, y, ang); } catch (err) {}
            try { if (blk.smokeEffect != null) blk.smokeEffect.at(x, y, ang); } catch (err) {}
        }
        logOnce("fired:" + def.id, "equip turret fired: " + def.id, true);
        return true;
    }

    function turretCost(st, def) {
        let c = def.cost;
        if (def.ov && def.ov.stackCost) c += ownedCount(st, def.id) * def.ov.stackCost;
        return c;
    }

    function turretSellValue(st, def) {
        let c = def.cost;
        if (def.ov && def.ov.stackCost) c += Math.max(0, ownedCount(st, def.id) - 1) * def.ov.stackCost;
        return c;
    }

    function mountRate(def, u, pfx) {
        if (def.ov && def.ov.unitRateMul && pfx === "u" && u.isCoreHost !== true) return def.ov.unitRateMul;
        return 1;
    }

    function mountLife(def, u, pfx) {
        let m = 1;
        if (def.ov && def.ov.lifeMul) m *= def.ov.lifeMul;
        if (def.ov && def.ov.unitLifeMul && pfx === "u" && u.isCoreHost !== true) m *= def.ov.unitLifeMul;
        return m;
    }

    function ovDamage(pl, u, def, forBuilt) {
        if (!def.ov || !(def.ov.dmgAtkPct || def.ov.dmgArmorPct)) return null;
        let v = 0;
        if (def.ov.dmgAtkPct) v += attackPower(pl, u) * def.ov.dmgAtkPct / 100;
        if (def.ov.dmgArmorPct) v += armorPower(pl, u) * def.ov.dmgArmorPct / 100;
        if (!forBuilt) {
            let st = byId[pl.id];
            if (st != null) v -= st.s[2] * ATK_FLAT;
        }
        return Math.max(1, v);
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

    function starAim(u, def, mp, bt, ast) {
        if (ast != null && ast.shoot) return { x: ast.x, y: ast.y };
        let t = findTarget(u, def, mp);
        if (t == null) return null;
        return leadPos(mp, t, bt);
    }

    function starStart(key) {
        starState[key] = { charge: FORSTAR_CHARGE_TICKS, rt: 0 };
    }

    function onStar(content) {
        try { starStart(String(content)); } catch (err) {}
    }

    function fireStarUlt(pl, u, def, mp, tx, ty, key) {
        let bt = starUltBullet != null ? starUltBullet : equipBullet(def);
        if (bt == null) return false;
        let own = u.isCoreHost === true ? u.build : u;
        let ang = Angles.angle(mp.x, mp.y, tx, ty);
        let blt = null;
        try {
            blt = bt.create(own, u.team, mp.x, mp.y, ang);
        } catch (err) {
            logOnce("starcreate", "star ult bullet create failed: " + err);
            return false;
        }
        if (blt != null) {
            let total = hpPower(pl, u) * FORSTAR_RAGE_HP_PCT / 100 + attackPower(pl, u) * FORSTAR_RAGE_ATK_PCT / 100;
            try { blt.damage = total * (1 - FORSTAR_TRUE_PCT); } catch (err) {}
            try { blt.data = total * FORSTAR_TRUE_PCT; } catch (err) {}
        }
        equipAng[key] = ang;
        starFxAt(starShockFx, mp.x, mp.y, ang);
        starFxAt(starBlastFx, mp.x, mp.y, ang);
        starFxAt(starPartFx, mp.x, mp.y, ang);
        if (!Vars.headless) {
            try { Effect.shake(5, 5, mp.x, mp.y); } catch (err) {}
        }
        return true;
    }

    function starMount(pl, u, def, k, n, key, ast) {
        let ss = starState[key];
        let mp = mountPos(u, k, n);
        let cd = equipCd[key];
        if (cd === undefined) cd = 0;
        cd -= Time.delta * Math.max(0.1, u.reloadMultiplier);
        if (cd < 0) cd = 0;

        if (ss !== undefined && ss.charge >= 0) {
            ss.charge -= Time.delta;
            ss.rt -= Time.delta;
            if (ss.rt <= 0) {
                ss.rt = 8;
                let ct = findTarget(u, def, mp);
                if (ct != null) equipAng[key] = Angles.angle(mp.x, mp.y, ct.x, ct.y);
            }
            if (ss.charge <= 0) {
                delete starState[key];
                let rb = starUltBullet != null ? starUltBullet : equipBullet(def);
                let aim = rb != null ? starAim(u, def, mp, rb, ast) : null;
                if (aim == null) {
                    let a0 = equipAng[key];
                    if (a0 === undefined) a0 = u.rotation;
                    aim = { x: mp.x + Mathf.cosDeg(a0) * 200, y: mp.y + Mathf.sinDeg(a0) * 200 };
                }
                fireStarUlt(pl, u, def, mp, aim.x, aim.y, key);
                cd = Math.max(cd, Math.max(5, def.block.reload));
            }
            equipCd[key] = cd;
            return;
        }

        if (cd <= 0) {
            let bt = starNormalBullet != null ? starNormalBullet : equipBullet(def);
            if (bt == null) logOnce("nobt:" + def.id, "no bullet type found for equipped turret " + def.id);
            let aim = bt != null ? starAim(u, def, mp, bt, ast) : null;
            if (bt != null && aim != null) {
                equipAng[key] = Angles.angle(mp.x, mp.y, aim.x, aim.y);
                let dmg = FORSTAR_BASE_DMG + attackPower(pl, u) * FORSTAR_NORMAL_ATK_PCT / 100 + hpPower(pl, u) * FORSTAR_NORMAL_HP_PCT / 100;
                if (fireEquip(u, def, bt, mp, aim.x, aim.y, dmg)) {
                    cd = Math.max(5, def.block.reload);
                    if (!Vars.net.client() && ownedCount(byId[pl.id], def.id) >= FORSTAR_MIN_OWNED && Math.random() < FORSTAR_RAGE_CHANCE) {
                        starStart(key);
                        if (Vars.net.server()) {
                            try { Call.clientPacketReliable(STAR_KIND, key); } catch (err) {}
                        }
                    }
                }
            } else {
                equipAng[key] = u.rotation;
            }
        }
        equipCd[key] = cd;
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
            if (def.ov && def.ov.star) {
                if (ast == null) ast = hostAim(u, pl);
                starMount(pl, u, def, k, n, key, ast);
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
            cd -= Time.delta * Math.max(0.1, u.reloadMultiplier) * mountRate(def, u, pfx);
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
                    if (fireEquip(u, def, bt, mp, tx, ty, ovDamage(pl, u, def, false), mountLife(def, u, pfx))) {
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

    let swordReg;
    let starGlow = null;

    function swordRegion() {
        if (swordReg === undefined) {
            swordReg = null;
            try {
                let r = Core.atlas.find("newex-starsword");
                if (r != null && r.found()) swordReg = r;
            } catch (err) {}
        }
        return swordReg;
    }

    function drawStarCharge(u, def, key, k, n) {
        let ss = starState[key];
        if (ss === undefined || !(ss.charge >= 0)) return;
        if (starGlow == null) starGlow = new Color(0.56, 0.79, 0.98, 1);
        let p = Math.min(1, Math.max(0, 1 - ss.charge / FORSTAR_CHARGE_TICKS));
        let mp = mountPos(u, k, n);
        let ang = equipAng[key];
        if (ang === undefined) ang = u.rotation;
        let sc = Math.max(0.45, Math.min(1.2, u.hitSize / 36));
        let rg = swordRegion();
        let mx = mp.x + Mathf.cosDeg(ang) * 14 * sc;
        let my = mp.y + Mathf.sinDeg(ang) * 14 * sc;
        let baseR = 35 * sc * (1 - p * 0.7);
        try {
            Draw.z(Layer.effect + 1);
            for (let i = 0; i < 5; i++) {
                let a = ang + (i - 2) * 25 * (1 - p);
                let cx = Mathf.lerp(mp.x + Mathf.cosDeg(a) * baseR, mx, p);
                let cy = Mathf.lerp(mp.y + Mathf.sinDeg(a) * baseR, my, p);
                Draw.color(Color.white);
                Draw.alpha(0.4 + p * 0.6);
                if (rg != null) {
                    Draw.rect(rg, cx, cy, 35 * sc, 50 * sc, ang - 90);
                } else {
                    Lines.stroke(2.5 * sc);
                    Lines.lineAngle(cx, cy, ang, 20 * sc);
                }
            }
            Draw.reset();
        } catch (err) {
            Draw.reset();
        }
    }

    let iceCore = null;
    let iceMid = null;
    let iceEdge = null;
    let iceClear = null;
    let iceLine = null;
    let iceDeep = null;

    function drawIceZone(u, def, key) {
        let rng = (def.ov.rangeTiles || 20) * Vars.tilesize;
        let c = auraState(u, rng, key);
        let I = c.i;
        let T = Time.time;
        if (iceCore == null) {
            iceCore = new Color(0.85, 0.96, 1, 1);
            iceMid = new Color(0.2, 0.55, 1, 1);
            iceEdge = new Color(0.04, 0.2, 0.85, 0);
            iceClear = new Color(0.45, 0.8, 1, 0);
            iceLine = Color.valueOf("8fd0ff");
            iceDeep = Color.valueOf("2e6bff");
        }
        try {
            Draw.z(Layer.flyingUnit + 1);
            Draw.color(iceLine, 0.22 + 0.25 * I);
            Lines.stroke(1.2 + I);
            try { Lines.dashCircle(u.x, u.y, rng); } catch (err) { Lines.circle(u.x, u.y, rng); }
            Draw.reset();
        } catch (err) {}
        if (I < 0.02) return;
        try {
            let breathe = 1 + Mathf.sin(T, 30, 0.025);

            Draw.z(Layer.groundUnit - 1);
            Draw.blend(Blending.additive);
            iceMid.a = 0.2 * I;
            Fill.light(u.x, u.y, 64, rng * breathe, iceMid, iceEdge);
            iceCore.a = 0.3 * I;
            iceClear.a = 0;
            Fill.light(u.x, u.y, 44, rng * 0.5 * (1 + Mathf.sin(T, 12, 0.05)), iceCore, iceClear);

            Draw.z(Layer.flyingUnit + 1);

            for (let k = 0; k < 5; k++) {
                let ph = (T * 0.005 + k / 5) % 1;
                let r = rng * (0.05 + 0.95 * ph);
                let fade = Math.min(1, ph * 7) * Math.pow(1 - ph, 1.2);
                Draw.color(iceCore, iceDeep, ph);
                Draw.alpha(0.55 * fade * I);
                Lines.stroke(1 + 2.6 * (1 - ph));
                Lines.circle(u.x, u.y, r);
            }

            for (let i = 0; i < 24; i++) {
                Draw.color(iceLine, 0.5 * I);
                Lines.stroke(2);
                Lines.arc(u.x, u.y, rng * 0.97, 0.03, T * 0.35 + i * 15);
            }
            for (let i = 0; i < 12; i++) {
                Draw.color(iceCore, 0.35 * I);
                Lines.stroke(1.2);
                Lines.arc(u.x, u.y, rng * 0.86, 0.05, -T * 0.5 + i * 30);
            }

            let hexR = rng * 0.45;
            let hexR2 = rng * 0.62;
            let rot1 = T * 0.3;
            let rot2 = -T * 0.2;
            Draw.color(iceLine, 0.55 * I);
            Lines.stroke(1.6);
            Lines.poly(u.x, u.y, 6, hexR, rot1);
            Draw.color(iceDeep, 0.5 * I);
            Lines.stroke(1.2);
            Lines.poly(u.x, u.y, 6, hexR2, rot2);
            for (let i = 0; i < 6; i++) {
                let a1 = (rot1 + i * 60) * Mathf.degRad;
                let a2 = (rot2 + i * 60) * Mathf.degRad;
                Draw.color(iceCore, iceDeep, 0.5);
                Draw.alpha(0.3 * I);
                Lines.stroke(1);
                Lines.line(u.x + Math.cos(a1) * hexR, u.y + Math.sin(a1) * hexR, u.x + Math.cos(a2) * hexR2, u.y + Math.sin(a2) * hexR2);
                Draw.color(iceCore, 0.7 * I);
                Fill.poly(u.x + Math.cos(a1) * hexR, u.y + Math.sin(a1) * hexR, 4, 4.5, T * 0.8 + i * 40);
            }

            for (let i = 0; i < 6; i++) {
                let a = (T * 0.45 + i * 60) * Mathf.degRad;
                Draw.color(iceLine, 0.4 * I);
                Lines.stroke(1.4);
                Lines.line(u.x, u.y, u.x + Math.cos(a) * rng * 0.34, u.y + Math.sin(a) * rng * 0.34);
            }

            for (let j = 0; j < 56; j++) {
                let rd = (T * 0.0032 * (0.7 + (j % 5) * 0.12) + j * 0.6180339) % 1;
                let r = rng * (0.05 + 0.93 * rd);
                let a = j * 2.39996 + Math.sin(T * 0.02 + j) * 0.2;
                let mx = u.x + Math.cos(a) * r;
                let my = u.y + Math.sin(a) * r;
                let fade = Math.sin(rd * Math.PI);
                let sz = (0.7 + (j % 3) * 0.45) * (1.1 - rd * 0.5);
                Draw.color(iceCore, iceDeep, rd);
                Draw.alpha(0.8 * fade * I);
                Fill.circle(mx, my, sz);
                Draw.alpha(0.12 * fade * I);
                Fill.circle(mx, my, sz * 3);
                if (j % 7 === 0) {
                    Draw.color(Color.white, 0.7 * fade * I);
                    Lines.stroke(0.9);
                    Lines.line(mx - sz * 3, my, mx + sz * 3, my);
                    Lines.line(mx, my - sz * 3, mx, my + sz * 3);
                }
            }

            Draw.z(Layer.flyingUnit + 0.5);
            iceCore.a = 0.5 * I;
            iceClear.a = 0;
            Fill.light(u.x, u.y, 28, u.hitSize * (0.95 + 0.06 * Math.sin(T * 0.13)), iceCore, iceClear);

            Draw.blend();
            Draw.reset();
            try { Drawf.light(u.x, u.y, rng * 1.25, iceLine, 0.45 * I); } catch (err) {}
        } catch (err) {
            Draw.blend();
            Draw.reset();
            logOnce("icezone", "ice zone draw failed: " + err);
        }
    }

    function drawMounts(pl, u, list, pfx) {
            let n = list.length;
            if (n === 0) return;
            let auraDrawn = false;
            let iceDrawn = false;
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
                    if (!auraDrawn) {
                        auraDrawn = true;
                        drawFireZone(u, def, key);
                    }
                    continue;
                }
                if (def.ov && def.ov.blast && !iceDrawn) {
                    iceDrawn = true;
                    drawIceZone(u, def, key);
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
                if (def.ov && def.ov.star) drawStarCharge(u, def, key, k, n);
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
        let left = shieldMinCache * 3600 - matchT;
        return left > 0 ? left : 0;
    }

    function fmtTicks(t) {
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

    function applyStats(unit) {
        if (!isActive()) return;
        let s = statsOf(unit);
        if (s == null) return;

        let isPl = false;
        try { isPl = unit.isPlayer(); } catch (err) {}
        let tHp = unit.type.health;
        if (isPl && unit.type === UnitTypes.reign) tHp *= REIGN_HP_MUL;
        let hpT = tHp * (1 + s[0] * HP_PCT / 100) + s[0] * HP_FLAT;
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
        if (isPl && unit.type === UnitTypes.disrupt) unit.speedMultiplier *= DISRUPT_SPEED_MUL;
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

    function builtOverride(b, o, pid) {
        try {
            let nm = String(o.block.name).replace(/^newex-/, "");
            let d = droneDefs().map[normId(nm)];
            if (d == null || !d.ov || !(d.ov.dmgAtkPct || d.ov.dmgArmorPct)) return;
            let pl = Groups.player.getByID(pid);
            if (pl == null) return;
            let pu = pl.unit();
            if (pu == null || !pu.isValid()) return;
            let v = ovDamage(pl, pu, d, true);
            if (v != null) {
                b.damage = v;
                rolled[b.id] = 1;
                rolledN++;
            }
        } catch (err) {}
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
                if (hp === undefined) {
                    let bp = builtOwner[o.id];
                    if (bp !== undefined) builtOverride(b, o, bp);
                    return;
                }
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
        for (let bid in builtOwner) return true;
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
        spawnFx(x, y);
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
            let want = tierType(activeTier(st));
            if (u.type === want && u.team == pl.team()) {
                delete swapPending[pl.id];
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
        for (let key6 in starState) {
            if (present[key6.split(":")[0]] !== true) delete starState[key6];
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
                if (o == null || typeof o.getPlayer !== "function" || o.team == tgt.team) return;
                let ss = statsOf(o);
                if (ss == null) return;
                let lv = ss[PCT_STAT] || 0;
                let pct = maxHpDmgPct(lv);
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
                if (dp != null && isPvpTeam(u.team)) { startRespawnLock(dp); addDeath(dp); }
            } catch (err) {}
            if (u.team == Vars.state.rules.waveTeam) {
                let gained = killExp(u);
                let rx = u.x;
                let ry = u.y;
                Groups.player.each(new Cons({
                    get: function(pl) {
                        let pu = pl.unit();
                        if (pu == null || !pu.isValid()) return;
                        let dx = pu.x - rx;
                        let dy = pu.y - ry;
                        if (dx * dx + dy * dy <= CREDIT_RADIUS * CREDIT_RADIUS) {
                            if (gained > 0) addExp(pl, gained);
                            addKill(pl);
                        }
                    }
                }));
                return;
            }
            let pid = soldierOwner[u.id];
            if (pid === undefined) return;
            delete soldierOwner[u.id];
            let sg = killExp(u);
            Groups.player.each(new Cons({
                get: function(pl2) {
                    if (pl2.id === pid) {
                        if (sg > 0) addExp(pl2, sg);
                        addKill(pl2);
                    }
                }
            }));
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
            equipRail = {};
            starState = {};
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
            swapPending = {};
            burstState = {};
            barrackT = {};
            soldiers = {};
            soldierOwner = {};
            passiveT = PASSIVE_INTERVAL;
            logged = {};
            rolled = {};
            rolledN = 0;
            builtOwner = {};
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
            let parts = String(payload).split("|");
            let mode = parts.length > 1 ? parts[1] : "b";
            let d = droneDefs().map[parts[0]];
            if (d == null) return;
            let price = turretCost(st, d);
            if (st.pts < price) return;
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
            st.pts -= price;
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
            let sellVal = turretSellValue(st, d);
            removeTurret(st.p[idx], d);
            st.d.splice(idx, 1);
            st.p.splice(idx, 1);
            st.pts += sellVal;
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
            if (kind === REQ_UP) touchUp(1, parseInt(parts[0]));
            else if (kind === REQ_UNIT) touchUp(0, parseInt(parts[0]));
            else if (kind === REQ_BUY) touchUp(2, String(parts[0]));
            else if (kind === REQ_BARR) touchUp(3, "b");
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
        let ov = def.ov || {};
        if (ov.aura) return tr("Toả vùng " + (ov.auraRange || 15) + " ô, mỗi giây gây " + (ov.auraAtkPct || 0) + "% tấn công + " + (ov.auraArmorPct || 0) + "% giáp, đốt cháy mục tiêu",
            "Aura of " + (ov.auraRange || 15) + " tiles, deals " + (ov.auraAtkPct || 0) + "% attack + " + (ov.auraArmorPct || 0) + "% armor per second, burns targets");
        if (ov.rail) return tr("Mục tiêu trong " + ov.rangeTiles + " ô: mỗi " + ((ov.railInterval || 120) / 60) + "s bắn 1 tia railgun xuyên mọi mục tiêu, gây " + (ov.railPct || 150) + "% tấn công (dài " + (ov.railLen || 33) + ", rộng " + (ov.railWidth || 9) + ")",
            "Target within " + ov.rangeTiles + " tiles: every " + ((ov.railInterval || 120) / 60) + "s fires a piercing railgun shot dealing " + (ov.railPct || 150) + "% attack (length " + (ov.railLen || 33) + ", width " + (ov.railWidth || 9) + ")");
        if (ov.blast) return tr("Mục tiêu vào " + ov.rangeTiles + " ô: mỗi giây tạo 1 vụ nổ gây " + (ov.blastPct || 100) + "% tấn công",
            "Target within " + ov.rangeTiles + " tiles: 1 explosion per second dealing " + (ov.blastPct || 100) + "% attack");
        if (ov.star) return tr("Tầm " + FORSTAR_RANGE + "px. Đạn kiếm xuyên: " + FORSTAR_BASE_DMG + " + " + FORSTAR_NORMAL_ATK_PCT + "% tấn công + " + FORSTAR_NORMAL_HP_PCT + "% máu tối đa. Khi sở hữu từ " + FORSTAR_MIN_OWNED + " pháo trở lên: mỗi phát có " + Math.round(FORSTAR_RAGE_CHANCE * 100) + "% tụ kiếm " + (FORSTAR_CHARGE_TICKS / 60) + "s rồi bắn đòn nộ: " + FORSTAR_RAGE_HP_PCT + "% máu tối đa + " + FORSTAR_RAGE_ATK_PCT + "% tấn công (" + Math.round(FORSTAR_TRUE_PCT * 100) + "% sát thương chuẩn, xuyên giáp, giảm 50% giáp mục tiêu, " + Math.round(FORSTAR_CRIT_CHANCE * 100) + "% bạo kích x" + FORSTAR_CRIT_MUL + "). " + Math.round(FORSTAR_HPSTRIKE_CHANCE * 100) + "% gây thêm " + Math.round(FORSTAR_HPSTRIKE_PCT * 100) + "% máu tối đa mục tiêu; " + Math.round(FORSTAR_STARLIGHT_CHANCE * 100) + "% rơi Starlight khi hạ mục tiêu (áp dụng khi gắn Unit/Lõi)",
            "Range " + FORSTAR_RANGE + "px. Piercing sword shot: " + FORSTAR_BASE_DMG + " + " + FORSTAR_NORMAL_ATK_PCT + "% attack + " + FORSTAR_NORMAL_HP_PCT + "% max HP. When you own " + FORSTAR_MIN_OWNED + "+ of them: each shot has a " + Math.round(FORSTAR_RAGE_CHANCE * 100) + "% chance to charge " + (FORSTAR_CHARGE_TICKS / 60) + "s then fire a rage strike: " + FORSTAR_RAGE_HP_PCT + "% max HP + " + FORSTAR_RAGE_ATK_PCT + "% attack (" + Math.round(FORSTAR_TRUE_PCT * 100) + "% true damage, armor piercing, halves target armor, " + Math.round(FORSTAR_CRIT_CHANCE * 100) + "% crit x" + FORSTAR_CRIT_MUL + "). " + Math.round(FORSTAR_HPSTRIKE_CHANCE * 100) + "% chance to deal extra " + Math.round(FORSTAR_HPSTRIKE_PCT * 100) + "% target max HP; " + Math.round(FORSTAR_STARLIGHT_CHANCE * 100) + "% Starlight drop on kill (when mounted on Unit/Core)");
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
            if (def.ov && (def.ov.aura || def.ov.blast || def.ov.rail || def.ov.star)) return 0;
            if (def.ov && def.ov.beam) return Math.round(def.ov.beamDps || 36);
            let bt = equipBullet(def);
            if (bt != null && bt.damage > 0) return Math.round(bt.damage);
        } catch (err) {}
        return 0;
    }

    function turretHeader(p, st, w, cols) {
        let info = new Table(Styles.black6);
        info.margin(8);
        info.defaults().growX().uniformX().minWidth(0);
        info.add("[lightgray]Unit[]  [white]" + equipCount(st) + "/" + equipSlots(st) + "[]").center();
        info.add("[lightgray]" + tr("Lõi", "Core") + "[]  [white]" + coreCount(st) + "/" + coreSlots(st) + "[]").center();
        info.add("[lightgray]" + tr("Xây", "Build") + "[]  [white]" + builtCount(st) + "/" + maxDrones() + "[]").center();
        p.add(info).colspan(cols).width(w).pad(4).row();
        p.add("[lightgray]" + tr("Mỗi cấp +1 ô. Có thể mua nhiều pháo cùng loại.", "+1 slot per level. You can buy the same turret many times.") + "[]").colspan(cols).width(w).left().wrap().pad(2).row();
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
        let price = turretCost(st, def);
        let afford = st.pts >= price;
        let tabStyle = Styles.togglet != null ? Styles.togglet : Styles.defaultt;
        let iconSz = narrowScreen() ? 32 : (Vars.mobile ? 44 : 36);

        let top = new Table();
        top.left();
        top.add(new Image(def.block.uiIcon)).size(iconSz).padRight(10).top();
        let col = new Table();
        col.left();
        col.add("[white]" + def.block.localizedName + "[]").left().row();
        if (roleText(def.id).length > 0) col.add(roleText(def.id)).left().row();
        col.add("[yellow]" + tr("Giá: ", "Cost: ") + price + tr(" điểm", " pt") + "[]").left();
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

        let groups = [
            { m: "e", name: "Unit", list: [] },
            { m: "c", name: tr("Lõi", "Core"), list: [] },
            { m: "b", name: tr("Xây", "Build"), list: [] }
        ];
        for (let n = 0; n < owned.length; n++) {
            let pp = st.p[owned[n]];
            let gm = pp >= 0 ? "b" : (pp === EQUIPPED ? "e" : "c");
            for (let g = 0; g < groups.length; g++) {
                if (groups[g].m === gm) groups[g].list.push(owned[n]);
            }
        }
        let canMove = { b: canBuild, e: def.equip && canEquip, c: def.equip && canCore };
        for (let g = 0; g < groups.length; g++) {
            let grp = groups[g];
            if (grp.list.length === 0) continue;
            let j = grp.list[grp.list.length - 1];

            card.image().color(Pal.gray).width(inner).height(1).padTop(8).padBottom(4).row();

            let hdr = new Table();
            hdr.add("[accent]" + grp.name + "  x" + grp.list.length + "[]").left().growX();
            hdr.button(tr("Bán 1", "Sell 1"), new Runnable({ run: function() { send(REQ_SELL, String(j)); } })).width(narrowScreen() ? 72 : (Vars.mobile ? 96 : 80)).height(btnH());
            card.add(hdr).width(inner).row();

            let row = new Table();
            row.defaults().growX().uniformX().height(btnH()).pad(2).minWidth(0);
            for (let t = 0; t < groups.length; t++) {
                let tg = groups[t];
                if (tg.m === grp.m) continue;
                let mb = row.button("> " + tg.name, tabStyle, new Runnable({ run: function() { send(REQ_MODE, j + "|" + tg.m); } })).get();
                mb.setDisabled(!canMove[tg.m]);
            }
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
            let cost = BARRACKS[lv].cost;
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
        out.push([tr("Sát thương % máu tối đa", "Max HP damage"), maxHpDmgPct(s[8]).toFixed(2) + "%"]);
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
            let tb = tabs.button(names[i], tabStyle, new Runnable({ run: function() { upTab = ix; upPage = 0; ver++; } })).growX().height(btnH()).pad(2).get();
            tb.setChecked(upTab === i);
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
            let hH = measureHeight(function(p) { turretHeader(p, st, innerW, cols); });
            let cardH = 0;
            for (let i = 0; i < defs.list.length; i++) {
                let card = turretCard(st, defs.list[i], cw);
                card.pack();
                if (card.getPrefHeight() > cardH) cardH = card.getPrefHeight();
            }
            let rows = Math.max(1, Math.floor(Math.max(0, availH - hH) / Math.max(1, cardH)));
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
            if (start === 0) turretHeader(body, st, innerW, cols);
            let colCount = 0;
            for (let j = start; j < end; j++) {
                body.add(turretCard(st, defs.map[turOrder[j]], cw)).width(cw).pad(4).top().left();
                colCount++;
                if (colCount % cols === 0) body.row();
            }
        } else {
            if (start === 0) armyHeader(body, st, innerW);
            armyList(body, st, innerW, start, end);
        }
        c.add(body).width(W).row();

        if (totalPages > 1) {
            let nav = new Table();
            let navBtnW = narrowScreen() ? 56 : 72;
            let prevBtn = nav.button("<", new Runnable({ run: function() { if (upPage > 0) { upPage--; ver++; } } })).size(navBtnW, btnH()).get();
            prevBtn.setDisabled(upPage <= 0);
            nav.add("[white]" + (upPage + 1) + "/" + totalPages + "[]").width(80).center();
            let nextBtn = nav.button(">", new Runnable({ run: function() { if (upPage < totalPages - 1) { upPage++; ver++; } } })).size(navBtnW, btnH()).get();
            nextBtn.setDisabled(upPage >= totalPages - 1);
            c.add(nav).width(W).pad(4).row();
        }
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
        viewUp = [recentUp[0].slice(), recentUp[1].slice(), recentUp[2].slice(), recentUp[3].slice()];
        dialog.update(new Runnable({
            run: function() {
                if (!nearOwnCore()) {
                    dialog.hide();
                    return;
                }
                let w = Core.graphics.getWidth() * 10000 + Core.graphics.getHeight();
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

    function kdVisible() {
        try { return Core.settings.getBool(KEY_KD, true); } catch (err) {}
        return true;
    }

    function kdSavePos() {
        if (kdPanel == null) return;
        try {
            Core.settings.put(KEY_KD_X, java.lang.Float(kdPanel.x));
            Core.settings.put(KEY_KD_Y, java.lang.Float(kdPanel.y));
        } catch (err) {}
    }

    function kdClamp() {
        if (kdPanel == null) return;
        let mx = Math.max(0, screenW() - kdPanel.getWidth());
        let my = Math.max(0, screenH() - kdPanel.getHeight());
        kdPanel.setPosition(Mathf.clamp(kdPanel.x, 0, mx), Mathf.clamp(kdPanel.y, 0, my));
        kdSavePos();
    }

    function kdLine() {
        let st = localState();
        let k = st != null ? (st.k || 0) : 0;
        let d = st != null ? (st.dd || 0) : 0;
        return "[accent]Kill: [white]" + k + "[]   [scarlet]Death: [white]" + d + "[]";
    }

    Events.on(ClientLoadEvent, new Cons({
        get: function(e) {
            if (Vars.headless) return;
            try {
                Core.bundle.getProperties().put("setting." + KEY_KD + ".name", tr("Hiện UI Kill/Death PvP (Shift+3)", "Show PvP Kill/Death UI (Shift+3)"));
                Vars.ui.settings.game.checkPref(KEY_KD, true);
            } catch (err) {
                Log.err("[NexPvp] cannot add KD setting: " + err);
            }
            let t = new Table(Styles.black6);
            kdPanel = t;
            t.margin(6);
            t.name = "newex-pvp-kd";
            t.touchable = Touchable.enabled;
            t.label(new Prov({ get: function() { return kdLine(); } })).left().get().setFontScale(Vars.mobile ? 0.9 : 0.85);
            t.visibility = new Boolp({ get: function() { return isActive() && Vars.ui.hudfrag.shown && kdVisible(); } });
            t.pack();
            if (Core.settings.has(KEY_KD_X) && Core.settings.has(KEY_KD_Y)) {
                t.setPosition(Core.settings.getFloat(KEY_KD_X, 0), Core.settings.getFloat(KEY_KD_Y, 0));
                kdClamp();
            } else {
                let by = hudPanel != null ? hudPanel.y - t.getHeight() - 6 : screenH() - t.getHeight() - (Vars.mobile ? 140 : 120);
                let bx = hudPanel != null ? hudPanel.x : (screenW() - t.getWidth()) / 2;
                t.setPosition(bx, Math.max(0, by));
                kdClamp();
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
                        kdSavePos();
                    }
                },
                touchUp(event, x, y, pointer, button) {
                    dragging = false;
                }
            }));
            Vars.ui.hudGroup.addChild(t);
        }
    }));

    if (!Vars.headless) {
        let kdLastW = 0;
        let kdLastH = 0;
        Events.run(Trigger.update, new Runnable({
            run: function() {
                if (kdPanel == null) return;
                let w = Core.graphics.getWidth();
                let h = Core.graphics.getHeight();
                if (w !== kdLastW || h !== kdLastH) {
                    kdLastW = w;
                    kdLastH = h;
                    kdClamp();
                }
                if (!isActive()) return;
                try {
                    let sh = Core.input.keyDown(KeyCode.shiftLeft) || Core.input.keyDown(KeyCode.shiftRight);
                    if (sh && Core.input.keyTap(KeyCode.num3) && !Core.scene.hasKeyboard()) {
                        Core.settings.put(KEY_KD, kdVisible() ? java.lang.Boolean.FALSE : java.lang.Boolean.TRUE);
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

            content.add(tr("Giới hạn pháo xây gần lõi (PvP):", "Built turret limit (PvP):")).padBottom(4).row();
            let drTable = new Table();
            let drField = drTable.field(String(maxDrones()), text => {}).width(120).get();
            drField.setFilter(TextField.TextFieldFilter.digitsOnly);
            drField.setMaxLength(2);
            drTable.add(tr("pháo (0 - " + LIMIT_DRONES + ")", "turrets (0 - " + LIMIT_DRONES + ")")).padLeft(8);
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
            shField.setMaxLength(3);
            shTable.add(tr("phút (mặc định " + DEFAULT_SHIELD_MIN + ")", "min (default " + DEFAULT_SHIELD_MIN + ")")).padLeft(8);
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

                let n = parseInt(drField.getText());
                if (isNaN(n) || n < 0) n = DEFAULT_DRONES;
                if (n > LIMIT_DRONES) n = LIMIT_DRONES;
                Core.settings.put(KEY_DRONES, java.lang.Integer(n));
            };
        }
    };

    global.NexPvp = api;
})();