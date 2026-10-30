// =====================================================================
//  NewMode - SURVIVAL (map: newmodesurvival.msav) - Multiplayer Support
// =====================================================================
(function() {
    const KILL_GOAL = 1000;
    const REWARD_POINTS = 100;
    const WAVE_SPACING_SEC = 0;
    const SAFE_RADIUS_TILES = 0;
    const DEFAULT_SAFE_TILES = 50;
    const EDGE_MARGIN_TILES = 3;
    const MAX_TRIES = 80;

    const TAG_ACTIVE = "newex-survival";
    const TAG_KILLS = "newex-survival-kills";

    const isEn = () => String(Core.settings.getString("locale")).startsWith("en");
    let winning = false;

    function getTags() {
        let r = Vars.state != null ? Vars.state.rules : null;
        return (r != null && r.tags != null) ? r.tags : null;
    }

    function isActive() {
        if (Vars.state == null || !Vars.state.isGame()) return false;
        let tags = getTags();
        if (tags == null) return false;
        return String(tags.get(TAG_ACTIVE, "0")) === "1";
    }

    function getKills() {
        let tags = getTags();
        if (tags == null) return 0;
        return parseInt(String(tags.get(TAG_KILLS, "0"))) || 0;
    }

    function setKills(n) {
        let tags = getTags();
        if (tags != null) tags.put(TAG_KILLS, String(n));
    }

    // --- ĐỒNG BỘ MẠNG QUA NexNet ---
    if (global.NexNet != null) {
        global.NexNet.on("newex-survival-sync-kills", (player, payload) => {
            let k = parseInt(payload) || 0;
            setKills(k);
        }, true, 100);
    }

    function safeRadiusWorld() {
        let ts = Vars.tilesize;
        if (SAFE_RADIUS_TILES > 0) return SAFE_RADIUS_TILES * ts;
        let r = Vars.state.rules.enemyCoreBuildRadius;
        return (r > 0) ? r : DEFAULT_SAFE_TILES * ts;
    }

    function getCorePositions() {
        let out = [];
        let team = Vars.state.rules.defaultTeam;
        let cores = team != null ? team.cores() : null;
        if (cores == null) return out;
        for (let i = 0; i < cores.size; i++) {
            let c = cores.get(i);
            if (c != null) out.push({ x: c.x, y: c.y });
        }
        return out;
    }

    function tooCloseToCore(wx, wy, cores, minDist) {
        for (let i = 0; i < cores.length; i++) {
            let dx = wx - cores[i].x;
            let dy = wy - cores[i].y;
            if (Math.sqrt(dx * dx + dy * dy) < minDist) return true;
        }
        return false;
    }

    function isSpawnable(tx, ty, type, clear) {
        for (let dx = -clear; dx <= clear; dx++) {
            for (let dy = -clear; dy <= clear; dy++) {
                let t = Vars.world.tile(tx + dx, ty + dy);
                if (t == null) return false;
                if (t.solid() || t.build != null) return false;
            }
        }
        let f = Vars.world.tile(tx, ty).floor();
        if (type.naval === true) return f.isLiquid;
        if (type.flying !== true && f.isDeep()) return false;
        return true;
    }

    function pickSpawnPos(type, cores, minDist) {
        let w = Vars.world.width();
        let h = Vars.world.height();
        let m = EDGE_MARGIN_TILES;
        if (w <= 2 * m || h <= 2 * m) return null;

        let ts = Vars.tilesize;
        let clear = Math.min(4, Math.max(1, Math.ceil(type.hitSize / (2 * ts))));

        for (let pass = 0; pass < 2; pass++) {
            let cr = pass === 0 ? clear : 1;
            for (let i = 0; i < MAX_TRIES; i++) {
                let tx = m + Math.floor(Math.random() * (w - 2 * m));
                let ty = m + Math.floor(Math.random() * (h - 2 * m));
                let wx = tx * ts;
                let wy = ty * ts;
                if (tooCloseToCore(wx, wy, cores, minDist)) continue;
                if (!isSpawnable(tx, ty, type, cr)) continue;
                return { x: wx, y: wy };
            }
        }
        return null;
    }

    function facingCore(wx, wy, cores) {
        if (cores.length === 0) return 0;
        let best = cores[0];
        let bd = Infinity;
        for (let i = 0; i < cores.length; i++) {
            let d = Math.pow(cores[i].x - wx, 2) + Math.pow(cores[i].y - wy, 2);
            if (d < bd) { bd = d; best = cores[i]; }
        }
        return Math.atan2(best.y - wy, best.x - wx) * 180 / Math.PI;
    }

    function spawnOne(g, waveIndex, team, cores, minDist) {
        let pos = pickSpawnPos(g.type, cores, minDist);
        if (pos == null) return false;

        let unit = g.type.create(team);
        if (g.effect != null) unit.apply(g.effect, 999999);
        if (g.items != null) unit.addItem(g.items.item, g.items.amount);
        unit.shield = g.getShield(waveIndex);
        unit.set(pos.x, pos.y);
        unit.rotation = facingCore(pos.x, pos.y, cores);

        unit.apply(StatusEffects.unmoving, 30);
        unit.apply(StatusEffects.invincible, 60);
        unit.add();

        Events.fire(new UnitSpawnEvent(unit));
        Fx.spawn.at(pos.x, pos.y);
        return true;
    }

    function spawnWave(waveIndex) {
        let rules = Vars.state.rules;
        let team = rules.waveTeam;
        let cores = getCorePositions();
        let minDist = safeRadiusWorld();

        let total = 0;
        let missed = 0;

        rules.spawns.each(g => {
            if (g == null || g.type == null) return;
            let n = g.getSpawned(waveIndex);
            for (let i = 0; i < n; i++) {
                if (spawnOne(g, waveIndex, team, cores, minDist)) total++;
                else missed++;
            }
        });
    }

    Events.on(WaveEvent, e => {
        if (Vars.net.client() || !isActive() || Vars.state.gameOver) return;
        spawnWave(Vars.state.wave - 2);
    });

    function formatTime() {
        try {
            if (global.matchTimer != null) return String(global.matchTimer.format(global.matchTimer.getSeconds()));
        } catch (err) {}
        return "--:--";
    }

    function win() {
        if (winning) return;
        winning = true;

        api.lastResult = {
            kills: getKills(),
            wave: Vars.state.wave,
            time: formatTime()
        };

        Time.run(5, () => {
            let team = Vars.state.rules.defaultTeam;
            try {
                Vars.logic.gameOver(team);
            } catch (err) {
                Vars.state.gameOver = true;
                Events.fire(new GameOverEvent(team));
            }
        });
    }

    Events.on(UnitDestroyEvent, e => {
        if (Vars.net.client() || !isActive() || Vars.state.gameOver || winning) return;
        let u = e.unit;
        if (u == null || u.team != Vars.state.rules.waveTeam) return;

        let k = getKills() + 1;
        setKills(k);

        if (global.NexNet != null) {
            global.NexNet.send("newex-survival-sync-kills", String(k));
        }

        if (k >= KILL_GOAL) win();
    });

    Events.on(WorldLoadEvent, e => {
        winning = false;
    });

    const HUD_W = 150;
    const SKILL_BTN_H = 28;

    function openSkillList() {
        try {
            if (global.NexSkills != null && global.NexSkills.showSkillList != null) global.NexSkills.showSkillList();
        } catch (err) {}
    }

    function hudLine1() {
        let k = Math.min(getKills(), KILL_GOAL);
        return (isEn() ? "[accent]Kills [white]" : "[accent]Diệt [white]") + k +
               "[lightgray]/" + KILL_GOAL +
               (isEn() ? "  [accent]W [white]" : "  [accent]Đợt [white]") + Vars.state.wave;
    }

    function lvInfo() {
        try {
            if (global.NexSkills != null) return global.NexSkills.getLocalLevelInfo();
        } catch (err) {}
        return null;
    }

    function expText() {
        let info = lvInfo();
        if (info == null) return "";
        let lv = (isEn() ? "Lv " : "Cấp ") + info.level;
        if (info.need <= 0) return lv + " MAX";
        return lv + "  " + info.exp + "/" + info.need;
    }

    function expFrac() {
        let info = lvInfo();
        if (info == null) return 0;
        if (info.need <= 0) return 1;
        return Math.max(0, Math.min(1, info.exp / info.need));
    }

    Events.on(ClientLoadEvent, e => {
        if (Vars.headless) return;

        let hasSavedPos = Core.settings.has("newex-survival-hud-x") && Core.settings.has("newex-survival-hud-y");
        let hudX = Core.settings.getFloat("newex-survival-hud-x", -1);
        let hudY = Core.settings.getFloat("newex-survival-hud-y", -1);

        let t = new Table(Styles.black6);
        t.margin(4);
        t.name = "newex-survival-hud";
        t.touchable = Touchable.enabled;
        t.table(cons(r => {
            r.left();
            r.label(() => hudLine1()).width(HUD_W).left().get().setFontScale(0.8);
        })).left();
        t.row();
        t.add(new Bar(
            new Prov({ get: function() { return expText(); } }),
            new Prov({ get: function() { return Pal.accent; } }),
            new Floatp({ get: function() { return expFrac(); } })
        )).size(HUD_W, 14).padTop(2);
        t.row();
        let skillIcon = Icon.list || Icon.book || Icon.info;
        let sb = t.button(isEn() ? "Skills" : "Kĩ năng", skillIcon, () => openSkillList()).size(HUD_W, SKILL_BTN_H).padTop(3).get();
        sb.getLabel().setFontScale(0.8);
        t.visibility = () => isActive() && Vars.ui.hudfrag.shown;
        t.pack();

        if (!hasSavedPos) {
            hudX = Core.graphics.getWidth() / 2 - t.getWidth() / 2;
            hudY = Core.graphics.getHeight() - t.getHeight() - 70;
        }
        t.setPosition(hudX, hudY);

        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;

        t.addListener(extend(InputListener, {
            touchDown(event, x, y, pointer, button) {
                isDragging = false;
                dragOffsetX = x;
                dragOffsetY = y;
                return true;
            },
            touchDragged(event, x, y, pointer) {
                if (Math.abs(x - dragOffsetX) > 5 || Math.abs(y - dragOffsetY) > 5) {
                    isDragging = true;
                }
                if (isDragging) {
                    let rawX = t.x + x - dragOffsetX;
                    let rawY = t.y + y - dragOffsetY;

                    let maxX = Math.max(0, Core.graphics.getWidth() - t.getWidth());
                    let maxY = Math.max(0, Core.graphics.getHeight() - t.getHeight());

                    hudX = Mathf.clamp(rawX, 0, maxX);
                    hudY = Mathf.clamp(rawY, 0, maxY);

                    t.setPosition(hudX, hudY);

                    Core.settings.put("newex-survival-hud-x", java.lang.Float(hudX));
                    Core.settings.put("newex-survival-hud-y", java.lang.Float(hudY));
                }
            },
            touchUp(event, x, y, pointer, button) {
                isDragging = false;
            }
        }));

        Vars.ui.hudGroup.addChild(t);
    });

    const api = {
        MAP_ID: "newmodesurvival",
        KILL_GOAL: KILL_GOAL,
        REWARD_POINTS: REWARD_POINTS,
        lastResult: null,
        isActive: isActive,
        getKills: getKills,

        onBegin: function() {
            winning = false;
            api.lastResult = null;

            let r = Vars.state.rules;
            r.tags.put(TAG_ACTIVE, "1");
            setKills(0);

            r.waves = true;
            r.waveTimer = true;
            r.attackMode = false;
            r.winWave = 0;
            if (WAVE_SPACING_SEC > 0) {
                r.waveSpacing = WAVE_SPACING_SEC * 60;
                Vars.state.wavetime = r.waveSpacing;
            }
        },

        onResume: function() {
            winning = false;
            api.lastResult = null;
            Vars.ui.showInfoToast((isEn() ? "Survival: " : "Survival: đã diệt ") + getKills() + "/" + KILL_GOAL, 3);
        }
    };

    global.NexSurvival = api;
})();