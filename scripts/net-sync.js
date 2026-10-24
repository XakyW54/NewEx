(function() {
    const REQ = "newex-req";
    const TOAST = "newex-toast";
    const SHAKE = "newex-shake";

    const handlers = {};
    const cooldowns = {};
    const lastUse = {};
    let registered = false;

    function isHostPlayer(player) {
        return player == null || player == Vars.player;
    }

    function dispatch(player, content) {
        let s = String(content);
        let i = s.indexOf("|");
        let kind = i < 0 ? s : s.substring(0, i);
        let payload = i < 0 ? "" : s.substring(i + 1);
        let entry = handlers[kind];
        if (entry == null) return;

        if (!isHostPlayer(player)) {
            if (entry.restricted && !Core.settings.getBool("newex-allow-client-actions", true)) return;
            let now = Time.millis();
            let key = player.id + ":" + kind;
            let wait = cooldowns[kind] != null ? cooldowns[kind] : 120;
            if (lastUse[key] != null && now - lastUse[key] < wait) return;
            lastUse[key] = now;
        }

        try {
            entry.fn(player, payload);
        } catch (err) {
            Log.err("[NexNet] " + kind + ": " + err);
        }
    }

    function on(kind, fn, restricted, cooldown) {
        handlers[kind] = { fn: fn, restricted: restricted === true };
        if (cooldown != null) cooldowns[kind] = cooldown;
    }

    function send(kind, payload) {
        let body = kind + "|" + (payload == null ? "" : String(payload));
        if (Vars.net.client()) {
            Call.serverPacketReliable(REQ, body);
        } else {
            dispatch(Vars.player, body);
        }
    }

    function showToast(text, dur) {
        if (Vars.headless || Vars.ui == null) return;
        Vars.ui.showInfoToast(text, dur);
    }

    function toastTo(player, text, dur) {
        if (isHostPlayer(player)) {
            showToast(text, dur);
            return;
        }
        if (player.con != null) {
            Call.clientPacketReliable(player.con, TOAST, dur + "|" + text);
        }
    }

    function toastAll(text, dur) {
        showToast(text, dur);
        if (Vars.net.server()) {
            Call.clientPacketReliable(TOAST, dur + "|" + text);
        }
    }

    function shake(intensity, duration, x, y) {
        if (!Vars.headless) Effect.shake(intensity, duration, x, y);
        if (Vars.net.server()) {
            Call.clientPacketReliable(SHAKE, intensity + "|" + duration + "|" + x + "|" + y);
        }
    }

    function fx(effect, x, y, rot, color) {
        if (effect == null) return;
        let r = rot == null ? 0 : rot;
        if (Vars.net.client()) {
            send("fx", effect.id + "|" + x + "|" + y + "|" + r);
            return;
        }
        Call.effect(effect, x, y, r, color == null ? Color.white : color);
    }

    function take(core, item, amount) {
        if (core == null || item == null) return;
        let n = Math.floor(Number(amount));
        if (!(n > 0)) return;
        if (Vars.net.client()) {
            send("take", item.id + "|" + n);
        } else {
            core.items.remove(item, n);
        }
    }

    function give(core, item, amount) {
        if (core == null || item == null) return;
        let n = Math.floor(Number(amount));
        if (!(n > 0)) return;
        if (!Vars.net.client()) core.items.add(item, n);
    }

    function configure(build, value) {
        if (build == null) return;
        if (Vars.net.active()) {
            Call.tileConfig(Vars.player, build, value);
        } else {
            build.configure(value);
        }
    }

    function setOverlay(tile, block) {
        if (tile == null || Vars.net.client()) return;
        tile.setOverlayNet(block);
    }

    function setBlock(tile, block, team, rotation) {
        if (tile == null || Vars.net.client()) return;
        tile.setNet(block, team == null ? Team.derelict : team, rotation == null ? 0 : rotation);
    }

    on("take", (player, payload) => {
        if (player == null) return;
        let a = payload.split("|");
        let item = Vars.content.getByID(ContentType.item, parseInt(a[0]));
        let amount = parseInt(a[1]);
        let core = player.team().core();
        if (core == null || item == null || !(amount > 0) || amount > 5000000) return;
        if (core.items.has(item, amount)) core.items.remove(item, amount);
    }, false, 0);

    on("fx", (player, payload) => {
        let a = payload.split("|");
        let id = parseInt(a[0]);
        let x = parseFloat(a[1]);
        let y = parseFloat(a[2]);
        let r = parseFloat(a[3]);
        if (isNaN(id) || isNaN(x) || isNaN(y)) return;
        if (id < 0 || id >= Effect.all.size) return;
        Call.effect(Effect.all.get(id), x, y, isNaN(r) ? 0 : r, Color.white);
    }, false, 0);

    function register() {
        if (registered) return;
        try {
            if (Vars.netServer == null || Vars.netClient == null) return;

            Vars.netServer.addPacketHandler(REQ, new Cons2({
                get: (player, content) => dispatch(player, content)
            }));

            Vars.netClient.addPacketHandler(TOAST, new Cons({
                get: (content) => {
                    let s = String(content);
                    let i = s.indexOf("|");
                    if (i < 0) return;
                    showToast(s.substring(i + 1), parseFloat(s.substring(0, i)) || 2);
                }
            }));

            Vars.netClient.addPacketHandler(SHAKE, new Cons({
                get: (content) => {
                    if (Vars.headless) return;
                    let a = String(content).split("|");
                    Effect.shake(parseFloat(a[0]), parseFloat(a[1]), parseFloat(a[2]), parseFloat(a[3]));
                }
            }));

            registered = true;
        } catch (err) {
            Log.err("[NexNet] register failed: " + err);
        }
    }

    register();
    Events.on(ClientLoadEvent, register);
    Events.on(ServerLoadEvent, register);
    Events.on(WorldLoadEvent, register);

    global.NexNet = {
        on: on,
        send: send,
        take: take,
        give: give,
        configure: configure,
        fx: fx,
        shake: shake,
        toastTo: toastTo,
        toastAll: toastAll,
        setOverlay: setOverlay,
        setBlock: setBlock,
        isHostPlayer: isHostPlayer
    };
})();
