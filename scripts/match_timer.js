const SETTINGS_KEY = "match-timer-state";
const RESUME_WINDOW_MS = 30 * 60 * 1000;
const COUNT_WHILE_AWAY = false;
const SAVE_INTERVAL = 300;
const TIMER_LABEL = "Time";

let session = null;
let pendingInit = true;
let saveTimer = 0;
let timerContainer = null;
let timerVisible = true;

let timerX = Core.settings.getFloat("newex-timer-x", 200);
let timerY = Core.settings.getFloat("newex-timer-y", 200);

function pad(n){
    return n < 10 ? "0" + n : "" + n;
}

function formatTime(total){
    let s = Math.max(0, Math.floor(total));
    let h = Math.floor(s / 3600);
    let m = Math.floor((s % 3600) / 60);
    let sec = s % 60;
    return h > 0 ? pad(h) + ":" + pad(m) + ":" + pad(sec) : pad(m) + ":" + pad(sec);
}

function currentKey(){
    let prefix = Vars.net.active() ? "net:" : "local:";
    let sector = Vars.state.rules.sector;
    if(sector != null){
        return prefix + "sector:" + sector.planet.name + ":" + sector.id;
    }
    let name = "unknown";
    try{
        name = String(Vars.state.map.name());
    }catch(err){}
    return prefix + "map:" + name;
}

function readSaved(){
    try{
        let raw = String(Core.settings.getString(SETTINGS_KEY, ""));
        if(raw.length == 0) return null;
        let data = JSON.parse(raw);
        if(data == null || typeof data.key != "string") return null;
        return data;
    }catch(err){
        return null;
    }
}

function writeSaved(force){
    if(session == null) return;
    try{
        let json = JSON.stringify({
            key: session.key,
            elapsed: session.elapsed,
            wave: session.wave,
            lastSeen: session.lastSeen,
            ended: session.ended
        });
        Core.settings.put(SETTINGS_KEY, new java.lang.String(json));
        if(force) Core.settings.forceSave();
    }catch(err){}
}

function initSession(){
    let now = Date.now();
    let key = currentKey();
    let wave = Vars.state.wave;
    let saved = readSaved();

    let resume = saved != null
        && saved.key == key
        && !saved.ended
        && wave >= (saved.wave | 0)
        && (RESUME_WINDOW_MS <= 0 || now - saved.lastSeen <= RESUME_WINDOW_MS);

    let elapsed = 0;
    if(resume){
        elapsed = Number(saved.elapsed) || 0;
        if(COUNT_WHILE_AWAY){
            elapsed += Math.max(0, (now - saved.lastSeen) / 1000);
        }
    }

    session = {
        key: key,
        elapsed: elapsed,
        wave: wave,
        lastSeen: now,
        ended: false,
        resumed: resume
    };
    pendingInit = false;
    saveTimer = 0;
    writeSaved(false);
}

function endSession(){
    if(session == null || session.ended) return;
    session.ended = true;
    session.lastSeen = Date.now();
    writeSaved(true);
}

function timerText(){
    if(session == null) return TIMER_LABEL + " [white]" + formatTime(0);
    let color = session.ended ? "[scarlet]" : "[accent]";
    return "[lightgray]" + TIMER_LABEL + " " + color + formatTime(session.elapsed);
}

function centerTimer(){
    if(timerContainer != null){
        let screenW = Core.graphics.getWidth();
        let screenH = Core.graphics.getHeight();
        let containerW = timerContainer.getWidth() || 120;
        let containerH = timerContainer.getHeight() || 40;

        timerX = (screenW - containerW) / 2;
        timerY = (screenH - containerH) / 2;

        timerContainer.setPosition(timerX, timerY);

        Core.settings.put("newex-timer-x", java.lang.Float(timerX));
        Core.settings.put("newex-timer-y", java.lang.Float(timerY));
    }
}

Events.run(EventType.Trigger.update, () => {
    let shiftPressed = Core.input.keyDown(KeyCode.shiftLeft) || Core.input.keyDown(KeyCode.shiftRight);
    if(shiftPressed && Core.input.keyTap(KeyCode.num1)){
        timerVisible = !timerVisible;
        if(timerVisible){
            centerTimer();
        }
    }

    if(!Vars.state.isGame()){
        if(session != null){
            session.lastSeen = Date.now();
            writeSaved(true);
            session = null;
        }
        pendingInit = true;
        return;
    }

    if(session == null || pendingInit){
        if(session != null){
            session.lastSeen = Date.now();
            writeSaved(false);
        }
        initSession();
    }

    if(session.ended || Vars.state.isPaused() || Vars.state.gameOver) return;

    session.elapsed += Time.delta / 60;
    session.wave = Vars.state.wave;
    session.lastSeen = Date.now();

    saveTimer += Time.delta;
    if(saveTimer >= SAVE_INTERVAL){
        saveTimer = 0;
        writeSaved(false);
    }
});

Events.on(EventType.WorldLoadEvent, e => {
    pendingInit = true;
});

Events.on(EventType.GameOverEvent, e => {
    endSession();
});

if(EventType.SectorCaptureEvent != null){
    Events.on(EventType.SectorCaptureEvent, e => {
        endSession();
    });
}

Events.on(EventType.ClientLoadEvent, e => {
    let container = new Table();
    timerContainer = container;
    container.setPosition(timerX, timerY);

    let innerTable = new Table(Styles.black6);
    innerTable.label(() => timerText()).pad(6);
    container.add(innerTable);

    container.name = "match-timer";
    container.touchable = Touchable.enabled;
    container.visibility = () => Vars.state.isGame() && Vars.ui.hudfrag.shown && timerVisible;

    container.pack();

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    container.addListener(extend(InputListener, {
        touchDown(event, x, y, pointer, button){
            isDragging = false;
            dragOffsetX = x;
            dragOffsetY = y;
            return true;
        },
        touchDragged(event, x, y, pointer){
            if(Math.abs(x - dragOffsetX) > 5 || Math.abs(y - dragOffsetY) > 5){
                isDragging = true;
            }
            if(isDragging){
                let rawX = container.x + x - dragOffsetX;
                let rawY = container.y + y - dragOffsetY;

                let maxX = Math.max(0, Core.graphics.getWidth() - container.getWidth());
                let maxY = Math.max(0, Core.graphics.getHeight() - container.getHeight());

                let newX = Mathf.clamp(rawX, 0, maxX);
                let newY = Mathf.clamp(rawY, 0, maxY);

                container.setPosition(newX, newY);

                timerX = newX;
                timerY = newY;
                Core.settings.put("newex-timer-x", java.lang.Float(timerX));
                Core.settings.put("newex-timer-y", java.lang.Float(timerY));
            }
        },
        touchUp(event, x, y, pointer, button){
            isDragging = false;
        }
    }));

    Vars.ui.hudGroup.addChild(container);
});

global.matchTimer = {
    getSeconds: () => session == null ? 0 : session.elapsed,
    format: formatTime,
    isEnded: () => session != null && session.ended,
    reset: () => {
        if(session == null) return;
        session.elapsed = 0;
        session.ended = false;
        session.lastSeen = Date.now();
        writeSaved(true);
    }
};