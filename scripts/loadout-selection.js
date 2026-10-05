(function() {
    const CURRENT_MOD_NAME = "newex";
    const TAG_KEY = "newex-selected-turrets";
    
    const fallbackTurrets = [
        "nucleytor", "emperfum", "galaxvorram", "bayrowfyr", "dor",
        "flazerd", "erysidus", "blixalum", "heliyron", "persefer",
        "tankani2k", "zoj", "reflecounum", "swordoder", "buffetles",
        "maxitoner", "xylaon", "lyvervon", "vendicum", "drone-launcher",
        "holyder", "plasanod", "tankani4k", "therdum", "lazash",
        "forstarsilum", "hitekalum", "reguilater", "lavunder", "blaw",
        "dtg-soldern", "indeniter", "rangtaturs", "tyber", "endyr"
    ];

    let turretList = new Seq();
    let selectedTurrets = new Seq();
    let customWaveContainer = null;
    let waveBtnAdded = false;
    let lastSkipTime = 0;

    let btnX = Core.settings.getFloat("newex-wave-btn-x", 200);
    let btnY = Core.settings.getFloat("newex-wave-btn-y", 200);

    let autoFpsSavedEffects = true;
    let isFpsThrottled = false;

    // Cache Settings để tối ưu hiệu năng (Tránh gọi Core.settings liên tục trong update/events)
    let autoLowFpsSetting = true;
    let showWaveBtnSetting = true;
    let hpPerWavePercentSetting = 10;
    let fpsOptPercentSetting = 0;

    function reloadCachedSettings() {
        autoLowFpsSetting = Core.settings.getBool("newex-auto-low-fps", true);
        showWaveBtnSetting = Core.settings.getBool("newex-show-wave-btn", true);
        hpPerWavePercentSetting = Core.settings.getInt("newex-hp-per-wave-percent", 10);
        fpsOptPercentSetting = Core.settings.getInt("newex-fps-opt-percent", 0);
    }

    // Delta Providers cố định tránh tạo object GC liên tục
    const normalDeltaProvider = () => Math.min(Core.graphics.getDeltaTime() * 60, 3);
    const slowDeltaProvider = () => Math.min(Core.graphics.getDeltaTime() * 60, 3) * 0.8;

    // Biến quản lý NewMode
    let isPlayingNewMode = false;
    let currentMapName = "[redces]ᑈᐴᐾᐶᒅ";
    const NEWMODE_SLOT_NAME = "NewEx_NewMode_Save";

    function loadTurretsFromFolder() {
        turretList.clear();
        let mod = Vars.mods.getMod(CURRENT_MOD_NAME);
        
        if (mod != null && mod.root != null) {
            let blocksDir = mod.root.child("content").child("blocks");
            
            if (blocksDir.exists() && blocksDir.isDirectory()) {
                blocksDir.walk(cons(file => {
                    if (!file.isDirectory()) {
                        let blockName = file.nameWithoutExtension();
                        let fullName = CURRENT_MOD_NAME + "-" + blockName;
                        let block = Vars.content.block(fullName);
                        if (block != null && block instanceof Turret && !turretList.contains(block)) {
                            turretList.add(block);
                        }
                    }
                }));
            }
        }

        if (turretList.isEmpty()) {
            fallbackTurrets.forEach(name => {
                let block = Vars.content.block(CURRENT_MOD_NAME + "-" + name);
                if (block != null && !turretList.contains(block)) {
                    turretList.add(block);
                }
            });
        }
    }

    function getMaxSelectCount() {
        return Core.settings.getInt("newex-max-turrets", 5);
    }

    function isFullSelection() {
        return getMaxSelectCount() >= turretList.size;
    }

    function unlockAllTurrets() {
        turretList.each(block => {
            block.buildVisibility = BuildVisibility.shown;
        });
    }

    function getSyncedTurretsFromWorld() {
        if (Vars.state.rules != null && Vars.state.rules.tags != null) {
            let savedString = Vars.state.rules.tags.get(TAG_KEY);
            if (savedString != null && String(savedString) !== "") {
                return String(savedString).split(",");
            }
        }
        return null;
    }

    function applyTurretVisibility(allowedNamesSeq) {
        turretList.each(block => {
            if (allowedNamesSeq != null && allowedNamesSeq.contains(block.name)) {
                block.buildVisibility = BuildVisibility.shown;
            } else {
                block.buildVisibility = BuildVisibility.hidden;
            }
        });
    }

    function triggerNextWave() {
        let currentTime = Time.millis();
        if (currentTime - lastSkipTime >= 400) {
            lastSkipTime = currentTime;
            if (Vars.state != null && Vars.state.isGame()) {
                if (Vars.logic != null) {
                    Vars.logic.runWave();
                }
            }
        }
    }

    function applyFpsOptimizationLevel(percent) {
        Core.settings.put("newex-fps-opt-percent", java.lang.Integer(percent));
        fpsOptPercentSetting = percent;
        
        if (percent >= 90) {
            Core.settings.put("effects", java.lang.Boolean(false));
            Core.settings.put("destroyedblocks", java.lang.Boolean(false));
            Core.settings.put("bloom", java.lang.Boolean(false));
            Core.settings.put("hits", java.lang.Boolean(false));
        } else if (percent >= 50) {
            Core.settings.put("effects", java.lang.Boolean(false));
            Core.settings.put("destroyedblocks", java.lang.Boolean(false));
            Core.settings.put("bloom", java.lang.Boolean(false));
            Core.settings.put("hits", java.lang.Boolean(true));
        } else if (percent >= 20) {
            Core.settings.put("effects", java.lang.Boolean(true));
            Core.settings.put("destroyedblocks", java.lang.Boolean(false));
            Core.settings.put("bloom", java.lang.Boolean(true));
            Core.settings.put("hits", java.lang.Boolean(true));
        } else {
            Core.settings.put("effects", java.lang.Boolean(true));
            Core.settings.put("destroyedblocks", java.lang.Boolean(true));
            Core.settings.put("bloom", java.lang.Boolean(true));
            Core.settings.put("hits", java.lang.Boolean(true));
        }
    }

    function centerWaveButton() {
        if (customWaveContainer != null) {
            let screenW = Core.graphics.getWidth();
            let screenH = Core.graphics.getHeight();
            let containerW = customWaveContainer.getWidth() || 160;
            let containerH = customWaveContainer.getHeight() || 40;

            btnX = (screenW - containerW) / 2;
            btnY = (screenH - containerH) / 2;

            customWaveContainer.setPosition(btnX, btnY);

            Core.settings.put("newex-wave-btn-x", java.lang.Float(btnX));
            Core.settings.put("newex-wave-btn-y", java.lang.Float(btnY));
        }
    }

    function injectWaveButtonToHUD() {
        if (waveBtnAdded) return;

        if (Vars.ui != null && Vars.ui.hudGroup != null) {
            let container = new Table();
            container.setPosition(btnX, btnY);

            let topBar = new Table();
            topBar.setBackground(Tex.whiteui);
            topBar.setColor(Color.black);

            let btnWave = new TextButton("Gọi Quái Wave", Styles.cleart);
            btnWave.getLabel().setFontScale(0.8);
            btnWave.setBackground(Tex.whiteui);
            btnWave.setColor(Color.valueOf("4a4a4a"));

            let btnToggleExpand = new TextButton("v", Styles.cleart);
            btnToggleExpand.getLabel().setFontScale(0.8);
            btnToggleExpand.setBackground(Tex.whiteui);
            btnToggleExpand.setColor(Color.valueOf("3a3a3a"));

            topBar.add(btnWave).size(130, 38).pad(2);
            topBar.add(btnToggleExpand).size(30, 38).pad(2);

            container.add(topBar).row();

            let expandTable = new Table();
            expandTable.setBackground(Tex.whiteui);
            expandTable.setColor(Color.valueOf("222222"));
            expandTable.visible = false;
            expandTable.margin(6);

            let currentFpsOpt = fpsOptPercentSetting;
            let optLabel = expandTable.add("Tối ưu FPS: " + currentFpsOpt + "%").fontScale(0.75).get();
            expandTable.row();

            expandTable.slider(0, 100, 1, currentFpsOpt, value => {
                let val = Math.floor(value);
                optLabel.setText("Tối ưu FPS: " + val + "%");
                applyFpsOptimizationLevel(val);
            }).width(150).pad(4).row();

            let autoFpsBtn = new TextButton("Tự ẩn effect & Slow motion x0.8 khi FPS < 20", Styles.togglet);
            autoFpsBtn.getLabel().setFontScale(0.65);
            autoFpsBtn.setChecked(autoLowFpsSetting);
            autoFpsBtn.clicked(() => {
                let checked = autoFpsBtn.isChecked();
                Core.settings.put("newex-auto-low-fps", java.lang.Boolean(checked));
                autoLowFpsSetting = checked;
            });
            expandTable.add(autoFpsBtn).size(150, 36).pad(2).row();

            container.add(expandTable).padTop(2).row();

            let isDragging = false;
            let dragOffsetX = 0;
            let dragOffsetY = 0;

            function addDragAndClick(buttonActor, onClickAction) {
                buttonActor.addListener(extend(InputListener, {
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
                            let rawX = container.x + x - dragOffsetX;
                            let rawY = container.y + y - dragOffsetY;

                            let maxX = Math.max(0, Core.graphics.getWidth() - container.getWidth());
                            let maxY = Math.max(0, Core.graphics.getHeight() - container.getHeight());

                            let newX = Mathf.clamp(rawX, 0, maxX);
                            let newY = Mathf.clamp(rawY, 0, maxY);

                            container.setPosition(newX, newY);

                            btnX = newX;
                            btnY = newY;
                            Core.settings.put("newex-wave-btn-x", java.lang.Float(btnX));
                            Core.settings.put("newex-wave-btn-y", java.lang.Float(btnY));
                        }
                    },
                    touchUp(event, x, y, pointer, button) {
                        if (!isDragging) {
                            onClickAction();
                        }
                        isDragging = false;
                    }
                }));
            }

            addDragAndClick(btnWave, () => {
                triggerNextWave();
            });

            addDragAndClick(btnToggleExpand, () => {
                expandTable.visible = !expandTable.visible;
                btnToggleExpand.setText(expandTable.visible ? "^" : "v");
            });

            Vars.ui.hudGroup.addChild(container);
            
            customWaveContainer = container;
            waveBtnAdded = true;
        }
    }

    // ================= CHẾ ĐỘ MỚI: NEW MODE =================
    function getNewModeSlot() {
        let slots = Vars.control.saves.getSaveSlots();
        return slots.find(s => s.name === NEWMODE_SLOT_NAME);
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

        let mapName = "redces";
        let slot = getNewModeSlot();
        let hasSave = isSlotValid(slot);

        let mapCard = new Table(Tex.button);
        mapCard.margin(12);

        mapCard.add("[white]Map: [redces]ᑈᐴᐾᐶᒅ[]").left().row();
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
            startNewModeMap(mapName);
        }).size(180, 45).pad(4);

        if (hasSave) {
            mapCard.button("Xóa Save & Chơi Mới", Styles.flatTogglet, () => {
                slot.delete();
                Vars.ui.showInfo("Đã xóa dữ liệu lưu của NewMode!");
                dialog.hide();
                showNewModeDialog();
            }).size(200, 45).pad(4);
        }

        mapTable.add(mapCard).growX().pad(6).row();

        let scrollPane = new ScrollPane(mapTable);
        content.add(scrollPane).grow().row();

        dialog.addCloseButton();
        dialog.show();
    }

    function startNewModeMap(mapName) {
        isPlayingNewMode = true;
        currentMapName = "[redces]ᑈᐴᐾᐶᒅ";

        let slot = getNewModeSlot();

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

                let newSlot = Vars.control.saves.addSave(NEWMODE_SLOT_NAME);
                newSlot.save();

                Vars.ui.showInfoToast("Đã khởi tạo màn chơi [redces]ᑈᐴᐾᐶᒅ!", 2);
                return;
            }
        }

        Vars.ui.showInfo("Không tìm thấy file maps/" + mapName + ".msav trong thư mục mod!");
    }

    function saveNewModeGame() {
        if (!isPlayingNewMode || !Vars.state.isGame()) return;
        try {
            let slot = getNewModeSlot();
            if (slot == null) {
                slot = Vars.control.saves.addSave(NEWMODE_SLOT_NAME);
            }
            slot.save();
            Vars.ui.showInfoToast("[accent]Đã tự động lưu trận NewMode![]", 2);
        } catch (e) {
            Log.err("Lỗi Save NewMode: " + e);
        }
    }

    function deleteNewModeSave() {
        if (isPlayingNewMode) {
            let slot = getNewModeSlot();
            if (slot != null) {
                slot.delete();
            }
            isPlayingNewMode = false;
        }
    }

    function showReadmeDialog() {
        let readmeContent = "Không tìm thấy file README.md trong mod.";
        let mod = Vars.mods.getMod(CURRENT_MOD_NAME);

        if (mod != null && mod.root != null) {
            let readmeFile = mod.root.child("README.md");
            if (readmeFile.exists()) {
                readmeContent = readmeFile.readString();
            }
        }

        const readmeDialog = new BaseDialog("Thông Tin Mod (README)");
        readmeDialog.setFillParent(true);

        const content = readmeDialog.cont;
        content.clear();

        let table = new Table();
        table.top().left().margin(12);

        let label = table.add(readmeContent).growX().get();
        label.setWrap(true);
        label.setAlignment(Align.left);

        let scrollPane = new ScrollPane(table);
        scrollPane.setFadeScrollBars(false);

        content.add(scrollPane).grow().row();

        readmeDialog.addCloseButton();
        readmeDialog.show();
    }

    function showTurretSelectionDialog() {
        selectedTurrets.clear();
        const maxCount = getMaxSelectCount();
        
        const dialog = new BaseDialog("Chọn Tháp Pháo (" + CURRENT_MOD_NAME + ")");
        dialog.setFillParent(true);

        const contentTable = dialog.cont;
        contentTable.clear();

        let titleLabel = contentTable.add("Vui lòng chọn tối đa " + maxCount + " tháp pháo cho trận đấu này:").pad(8).get();
        titleLabel.setWrap(true);
        titleLabel.setAlignment(Align.center);
        contentTable.row();

        const selectionTable = new Table();
        selectionTable.top().margin(10);

        let isMobile = Core.graphics.isPortrait() || Vars.mobile;
        let maxCols = isMobile ? 2 : 3;
        let cols = 0;

        turretList.each(block => {
            let btn = new TextButton(block.localizedName, Styles.togglet);
            btn.getLabel().setWrap(true);
            btn.getLabel().setFontScale(isMobile ? 0.8 : 0.9);

            btn.clicked(() => {
                if (btn.isChecked()) {
                    if (selectedTurrets.size < maxCount) {
                        selectedTurrets.add(block);
                    } else {
                        btn.setChecked(false);
                        Vars.ui.showInfo("Chỉ được chọn tối đa " + maxCount + " tháp pháo!");
                    }
                } else {
                    selectedTurrets.remove(block);
                }
            });

            selectionTable.add(btn).growX().height(isMobile ? 55 : 50).pad(4);

            cols++;
            if (cols % maxCols === 0) selectionTable.row();
        });

        const scrollPane = new ScrollPane(selectionTable);
        scrollPane.setFadeScrollBars(false);
        contentTable.add(scrollPane).grow().row();

        let buttonTable = new Table();

        buttonTable.button("Xác nhận & Đồng bộ", () => {
            if (selectedTurrets.size !== maxCount) {
                Vars.ui.showInfo("Bạn cần chọn đúng " + maxCount + " tháp pháo!");
                return;
            }

            let savedArray = [];
            let allowedNames = new Seq();
            selectedTurrets.each(block => {
                savedArray.push(block.name);
                allowedNames.add(block.name);
            });

            if (Vars.state.rules != null && Vars.state.rules.tags != null) {
                Vars.state.rules.tags.put(TAG_KEY, savedArray.join(","));
            }

            applyTurretVisibility(allowedNames);
            dialog.hide();
        }).size(180, 50).pad(6);

        buttonTable.button("Thoát vào trận", () => {
            let savedArray = [];
            let allowedNames = new Seq();
            selectedTurrets.each(block => {
                savedArray.push(block.name);
                allowedNames.add(block.name);
            });

            if (Vars.state.rules != null && Vars.state.rules.tags != null) {
                Vars.state.rules.tags.put(TAG_KEY, savedArray.join(","));
            }

            applyTurretVisibility(allowedNames);
            dialog.hide();
        }).size(160, 50).pad(6);

        contentTable.add(buttonTable).pad(10);

        dialog.show();
    }

    function showConfigDialog() {
        if (turretList.isEmpty()) loadTurretsFromFolder();

        const dialog = new BaseDialog("Cài Đặt Mod Newex");
        const mainContent = dialog.cont;
        mainContent.clear();

        let content = new Table();
        content.top().margin(10);

        // 1. GIỚI HẠN THÁP PHÁO
        content.add("[accent]-- GIỚI HẠN THÁP PHÁO --[]").row();
        content.add("Số lượng tháp pháo chọn mỗi trận:").padBottom(5).row();

        let currentLimit = getMaxSelectCount();
        let textLabel = content.add(currentLimit >= turretList.size ? "Tất cả (Full)" : currentLimit.toString()).fontScale(1.3).get();
        content.row();

        let maxSliderVal = Math.max(1, turretList.size);
        let slider = content.slider(1, maxSliderVal, 1, Math.min(currentLimit, maxSliderVal), value => {
            let val = Math.floor(value);
            if (val >= turretList.size) {
                textLabel.setText("Tất cả (Full)");
            } else {
                textLabel.setText(val.toString());
            }
        }).width(240).pad(8).get();
        content.row();

        // 2. MỨC ĐỘ TỐI ƯU FPS & ĐỒ HỌA TÙY CHỈNH
        content.add("[accent]-- TỐI ƯU FPS / ĐỒ HỌA --[]").padTop(10).row();
        content.add("Mức độ cắt giảm hiệu ứng (1%):").padBottom(4).row();
        
        let currentFpsOpt = fpsOptPercentSetting;
        let fpsLabel = content.add(currentFpsOpt + "%").fontScale(1.2).get();
        content.row();

        let fpsSlider = content.slider(0, 100, 1, currentFpsOpt, value => {
            let val = Math.floor(value);
            fpsLabel.setText(val + "%");
        }).width(240).pad(8).get();
        content.row();

        let btnAutoFps = new TextButton("Tự ẩn effect & Slow motion x0.8 khi FPS < 20", Styles.togglet);
        btnAutoFps.getLabel().setFontScale(0.8);
        btnAutoFps.setChecked(autoLowFpsSetting);
        content.add(btnAutoFps).size(280, 48).pad(4).row();

        // 3. CHỈ SỐ ĐỊCH THEO TỪNG WAVE
        content.add("[accent]-- CHỈ SỐ ĐỊCH THEO TỪNG WAVE --[]").padTop(10).row();
        content.add("% Máu tăng thêm trên mỗi Wave:").padBottom(4).row();
        let hpFieldTable = new Table();
        let hpField = hpFieldTable.field(hpPerWavePercentSetting.toString(), text => {}).width(120).get();
        hpField.setFilter(TextField.TextFieldFilter.digitsOnly);
        hpField.setMaxLength(3);
        hpFieldTable.add("% / Wave").padLeft(8);
        content.add(hpFieldTable).pad(5).row();

        // 4. QUẢN LÝ NÚT GỌI WAVE
        content.add("[accent]-- QUẢN LÝ NÚT GỌI WAVE --[]").padTop(10).row();
        let btnShowWave = new TextButton("Hiển thị nút Gọi Wave trên màn hình\n[gray](Phím tắt PC: Shift + N)[]", Styles.togglet);
        btnShowWave.getLabel().setFontScale(0.85);
        btnShowWave.setChecked(showWaveBtnSetting);
        content.add(btnShowWave).size(280, 54).pad(5).row();

        // 5. CHẾ ĐỘ HIỂN THỊ THANH MÁU (HP)
        content.add("[accent]-- CHẾ ĐỘ HIỂN THỊ THANH MÁU (HP) --[]").padTop(10).row();

        let currentHpStyle = Core.settings.getString("newex-hp-style", "show-hp");

        let styleGroup = new ButtonGroup();
        styleGroup.setMinCheckCount(0);

        let tableHp = new Table();

        let btnShowHp = new TextButton("Bật hp\n[gray](Ngang + số)[]", Styles.togglet);
        let btnHp = new TextButton("Bật hp\n[gray](Dọc cổ điển)[]", Styles.togglet);
        let btnOff = new TextButton("Tắt HP", Styles.togglet);

        btnShowHp.getLabel().setFontScale(0.8);
        btnHp.getLabel().setFontScale(0.8);
        btnOff.getLabel().setFontScale(0.8);

        styleGroup.add(btnShowHp);
        styleGroup.add(btnHp);
        styleGroup.add(btnOff);

        if (currentHpStyle === "show-hp") btnShowHp.setChecked(true);
        else if (currentHpStyle === "hp") btnHp.setChecked(true);
        else btnOff.setChecked(true);

        tableHp.add(btnShowHp).size(145, 54).pad(3);
        tableHp.add(btnHp).size(145, 54).pad(3);
        tableHp.add(btnOff).size(85, 54).pad(3);

        content.add(tableHp).row();

        // 6. THÔNG TIN CHI TIẾT
        content.add("[accent]-- THÔNG TIN CHI TIẾT --[]").padTop(10).row();
        content.button("Xem README / Update Log", Icon.info, () => {
            showReadmeDialog();
        }).size(240, 48).pad(5).row();

        content.button("Lưu Cài Đặt", () => {
            let newValue = Math.floor(slider.getValue());
            Core.settings.put("newex-max-turrets", java.lang.Integer(newValue));

            let optVal = Math.floor(fpsSlider.getValue());
            applyFpsOptimizationLevel(optVal);
            
            Core.settings.put("newex-auto-low-fps", java.lang.Boolean(btnAutoFps.isChecked()));

            let parsedHp = parseInt(hpField.getText()) || 0;
            if (parsedHp > 999) parsedHp = 999;
            if (parsedHp < 0) parsedHp = 0;
            Core.settings.put("newex-hp-per-wave-percent", java.lang.Integer(parsedHp));

            Core.settings.put("newex-show-wave-btn", java.lang.Boolean(btnShowWave.isChecked()));

            let selectedStyle = "off";
            if (btnShowHp.isChecked()) selectedStyle = "show-hp";
            else if (btnHp.isChecked()) selectedStyle = "hp";

            Core.settings.put("newex-hp-style", selectedStyle);

            // Cập nhật lại bộ nhớ đệm ngay khi lưu
            reloadCachedSettings();

            Vars.ui.showInfo("Đã lưu cài đặt Newex thành công!");
            dialog.hide();
        }).size(170, 45).padTop(12);

        let scrollPane = new ScrollPane(content);
        scrollPane.setFadeScrollBars(false);
        mainContent.add(scrollPane).grow().row();

        dialog.addCloseButton();
        dialog.show();
    }

    function applyEnemyBuffs(unit) {
        if (unit == null || unit.team == Vars.state.rules.defaultTeam) return;

        let wave = Vars.state.wave;
        if (wave <= 1) return;

        let hpPercent = hpPerWavePercentSetting;
        if (hpPercent <= 0) return;

        let hpMultiplier = 1 + ((wave - 1) * (hpPercent / 100));

        if (hpMultiplier > 1) {
            unit.maxHealth *= hpMultiplier;
            unit.health = unit.maxHealth;
        }
    }

    Events.on(UnitCreateEvent, event => {
        if (event.unit != null) {
            applyEnemyBuffs(event.unit);
        }
    });

    // Xóa Save khi Thua trận
    Events.on(GameOverEvent, event => {
        if (isPlayingNewMode) {
            deleteNewModeSave();
        }
    });

    // Lưu trận đấu khi người chơi thoát ra Menu
    Events.on(StateChangeEvent, event => {
        if (event.from === GameState.State.playing && event.to === GameState.State.menu) {
            if (isPlayingNewMode) {
                saveNewModeGame();
            }
        }
    });

    // Tự động lưu mỗi khi sang Wave mới
    Events.on(WaveEvent, event => {
        if (isPlayingNewMode && Vars.state.isGame()) {
            saveNewModeGame();
        }
    });

    Events.on(ClientLoadEvent, event => {
        loadTurretsFromFolder();
        reloadCachedSettings();
        applyFpsOptimizationLevel(fpsOptPercentSetting);

        try {
            Vars.ui.menufrag.addButton("NewMode", Icon.play, () => {
                showNewModeDialog();
            });

            Vars.ui.menufrag.addButton("Cài đặt Newex", Icon.settings, () => {
                showConfigDialog();
            });
        } catch(e) {}
    });

    Events.run(Trigger.update, () => {
        let inGame = Vars.state != null && Vars.state.isGame();

        if (inGame) {
            if (autoLowFpsSetting) {
                let currentFps = Core.graphics.getFramesPerSecond();
                
                if (currentFps < 20 && !isFpsThrottled) {
                    autoFpsSavedEffects = Core.settings.getBool("effects", true);
                    Core.settings.put("effects", java.lang.Boolean(false));
                    
                    Time.setDeltaProvider(slowDeltaProvider);
                    isFpsThrottled = true;
                } else if (currentFps > 45 && isFpsThrottled) {
                    Core.settings.put("effects", java.lang.Boolean(autoFpsSavedEffects));
                    
                    Time.setDeltaProvider(normalDeltaProvider);
                    isFpsThrottled = false;
                }
            }

            let shiftPressed = Core.input.keyDown(KeyCode.shiftLeft) || Core.input.keyDown(KeyCode.shiftRight);
            if (shiftPressed && Core.input.keyTap(KeyCode.n)) {
                showWaveBtnSetting = !showWaveBtnSetting;
                Core.settings.put("newex-show-wave-btn", java.lang.Boolean(showWaveBtnSetting));
                
                if (showWaveBtnSetting) {
                    Vars.ui.showInfoToast("Đã hiện nút Gọi Wave", 1.5);
                    centerWaveButton();
                } else {
                    Vars.ui.showInfoToast("Đã ẩn nút Gọi Wave", 1.5);
                }
            }

            if (showWaveBtnSetting) {
                if (!waveBtnAdded) {
                    injectWaveButtonToHUD();
                }
                if (customWaveContainer != null) {
                    customWaveContainer.visible = true;
                }
            } else {
                if (customWaveContainer != null) {
                    customWaveContainer.visible = false;
                }
            }
        } else {
            if (isFpsThrottled) {
                Time.setDeltaProvider(normalDeltaProvider);
                isFpsThrottled = false;
            }
            if (customWaveContainer != null) {
                customWaveContainer.visible = false;
            }
        }
    });

    Events.on(WorldLoadEvent, event => {
        waveBtnAdded = false;
        if (customWaveContainer != null) {
            customWaveContainer.remove();
            customWaveContainer = null;
        }

        if (turretList.isEmpty()) loadTurretsFromFolder();

        if (isFullSelection()) {
            unlockAllTurrets();
            return;
        }

        let syncedNames = getSyncedTurretsFromWorld();
        if (syncedNames != null && syncedNames.length > 0) {
            let allowedNames = new Seq();
            for (let i = 0; i < syncedNames.length; i++) {
                allowedNames.add(syncedNames[i]);
            }
            applyTurretVisibility(allowedNames);
            return;
        }

        if (Vars.net.client()) {
            turretList.each(block => {
                block.buildVisibility = BuildVisibility.hidden;
            });
            return;
        }

        turretList.each(block => {
            block.buildVisibility = BuildVisibility.hidden;
        });

        Core.app.post(() => {
            showTurretSelectionDialog();
        });
    });
})();