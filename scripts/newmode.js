(function() {
    const CURRENT_MOD_NAME = "newex";
    const GACHA_POINTS_KEY = "newex-gacha-points";
    
    let activeMapName = null;
    let isPlayingNewMode = false;

    // Danh sách các map trong NewMode[cite: 3]
    const mapsList = [
        { id: "Newbie", displayName: "Newbie" },
        { id: "redces", displayName: "Redces ᑈᐴᐾᐶᒅ" },
        { id: "sentyderd", displayName: "Sentyderd" },
        { id: "defxy1", displayName: "Def Xy-1" },
        { id: "defxy2", displayName: "Def Xy-2" }


    ];

    function getNewModeSlot(mapId) {
        let slots = Vars.control.saves.getSaveSlots();
        return slots.find(s => s.name === "NewEx_NewMode_Save_" + mapId);
    }

    function isSlotValid(slot) {
        return slot != null && slot.file != null && slot.file.exists();
    }

    function showNewModeDialog() {
        const dialog = new BaseDialog("NewMode - Chọn Màn Chơi");
        dialog.setFillParent(true);

        const content = dialog.cont;
        content.clear();

        content.add("[accent]CHỌN BẢN ĐỒ NEWMODE[]").pad(10).fontScale(1.2).row();

        let mapTable = new Table();
        mapTable.top().margin(10);

        mapsList.forEach(mapInfo => {
            let slot = getNewModeSlot(mapInfo.id);
            let hasSave = isSlotValid(slot);

            let mapCard = new Table(Tex.button);
            mapCard.margin(12);

            mapCard.add("[white]Map: " + mapInfo.displayName + "[]").left().row();
            if (hasSave) {
                let titleText = "Save File";
                try {
                    if (slot.getDialogTitle) {
                        titleText = slot.getDialogTitle();
                    } else if (slot.getName) {
                        titleText = slot.getName();
                    }
                } catch(e) {}
                mapCard.add("[yellow]Có dữ liệu lưu từ trận trước (" + titleText + ")[]").left().padBottom(6).row();
            } else {
                mapCard.add("[gray]Màn chơi mới (Chưa có Save)[]").left().padBottom(6).row();
            }

            let btnText = hasSave ? "Tiếp Tục Chơi" : "Bắt Đầu Chơi";
            mapCard.button(btnText, Styles.flatTogglet, () => {
                dialog.hide();
                startNewModeMap(mapInfo.id);
            }).size(180, 45).pad(4);

            if (hasSave) {
                mapCard.button("Xóa Save & Chơi Mới", Styles.flatTogglet, () => {
                    slot.delete();
                    Vars.ui.showInfo("Đã xóa dữ liệu lưu của " + mapInfo.displayName + "!");
                    dialog.hide();
                    showNewModeDialog();
                }).size(200, 45).pad(4);
            }

            mapTable.add(mapCard).growX().pad(6).row();
        });

        let scrollPane = new ScrollPane(mapTable);
        content.add(scrollPane).grow().row();

        dialog.addCloseButton();
        dialog.show();
    }

    function startNewModeMap(mapName) {
        isPlayingNewMode = true;
        activeMapName = mapName;

        let slotName = "NewEx_NewMode_Save_" + mapName;
        let slots = Vars.control.saves.getSaveSlots();
        let slot = slots.find(s => s.name === slotName);

        if (isSlotValid(slot)) {
            try {
                slot.load();
                Vars.state.set(GameState.State.playing);
                Vars.ui.showInfoToast("Đã tải lại trận đấu NewMode thành công!", 2);
                return;
            } catch (e) {
                Log.err("Lỗi load save NewMode, tạo lại trận mới: " + e);
            }
        }

        let mod = Vars.mods.getMod(CURRENT_MOD_NAME);
        if (mod != null && mod.root != null) {
            let mapFile = mod.root.child("maps").child(mapName + ".msav");
            if (mapFile.exists()) {
                let map = MapIO.createMap(mapFile, true);

                Vars.logic.reset();
                Vars.world.loadMap(map);
                Vars.state.rules = map.applyRules(Gamemode.survival);
                Vars.logic.play();

                let newSlot = Vars.control.saves.addSave(slotName);
                newSlot.save();

                Vars.ui.showInfoToast("Đã khởi tạo màn chơi " + mapName + "!", 2);
                return;
            }
        }

        Vars.ui.showInfo("Không tìm thấy file maps/" + mapName + ".msav trong thư mục mod!");
    }

    function saveNewModeGame() {
        if (!isPlayingNewMode || !activeMapName || !Vars.state.isGame()) return;
        try {
            let slotName = "NewEx_NewMode_Save_" + activeMapName;
            let slots = Vars.control.saves.getSaveSlots();
            let slot = slots.find(s => s.name === slotName);
            if (slot == null) {
                slot = Vars.control.saves.addSave(slotName);
            }
            slot.save();
            Vars.ui.showInfoToast("[accent]Đã tự động lưu trận NewMode![]", 2);
        } catch (e) {
            Log.err("Lỗi Save NewMode: " + e);
        }
    }

    function deleteNewModeSave() {
        if (isPlayingNewMode && activeMapName) {
            let slotName = "NewEx_NewMode_Save_" + activeMapName;
            let slots = Vars.control.saves.getSaveSlots();
            let slot = slots.find(s => s.name === slotName);
            if (slot != null) {
                slot.delete();
            }
            isPlayingNewMode = false;
            activeMapName = null;
        }
    }

    Events.on(GameOverEvent, event => {
        if (isPlayingNewMode) {
            if (event.winner != null && event.winner == Vars.state.rules.defaultTeam) {
                let currentPts = Core.settings.getInt(GACHA_POINTS_KEY, 0) + 1;
                Core.settings.put(GACHA_POINTS_KEY, java.lang.Integer(currentPts));
                Vars.ui.showInfoToast("[accent]Chiến thắng NewMode! Nhận +1 điểm Gacha (Tổng: " + currentPts + ")[ ]", 3);
            }
            deleteNewModeSave();
        }
    });

    Events.on(StateChangeEvent, event => {
        if (event.from === GameState.State.playing && event.to === GameState.State.menu) {
            if (isPlayingNewMode) {
                saveNewModeGame();
            }
        }
    });

    Events.on(WaveEvent, event => {
        if (isPlayingNewMode && Vars.state.isGame()) {
            saveNewModeGame();
            
            // Thưởng +1 điểm gacha cứ mỗi khi qua được 10 đợt (wave)
            if (Vars.state.wave > 0 && Vars.state.wave % 10 === 0) {
                let currentPts = Core.settings.getInt(GACHA_POINTS_KEY, 0) + 1;
                Core.settings.put(GACHA_POINTS_KEY, java.lang.Integer(currentPts));
                Vars.ui.showInfoToast("[accent]Đã qua đợt " + Vars.state.wave + "! Nhận +1 điểm Gacha (Tổng: " + currentPts + ")[ ]", 3);
            }
        }
    });

    Events.on(ClientLoadEvent, event => {
        try {
            Vars.ui.menufrag.addButton("NewMode", Icon.play, () => {
                showNewModeDialog();
            });
        } catch(e) {}
    });
})();