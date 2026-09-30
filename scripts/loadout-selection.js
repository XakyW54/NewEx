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
    let customWaveBtn = null;
    let lastSkipTime = 0;

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

        // --- 1. GIỚI HẠN THÁP PHÁO ---
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

        // --- 2. TĂNG CHỈ SỐ MÁU & SÁT THƯƠNG ĐỊCH ---
        content.add("[accent]-- CHỈ SỐ ĐỊCH THEO TỪNG WAVE --[]").padTop(10).row();
        
        // Tăng Máu
        content.add("% Máu tăng thêm trên mỗi Wave:").padBottom(4).row();
        let currentHp = Core.settings.getInt("newex-hp-per-wave-percent", 10);
        let hpFieldTable = new Table();
        let hpField = hpFieldTable.field(currentHp.toString(), text => {}).width(120).get();
        hpField.setFilter(TextField.TextFieldFilter.digitsOnly);
        hpField.setMaxLength(3);
        hpFieldTable.add("% / Wave").padLeft(8);
        content.add(hpFieldTable).pad(5).row();

        // Tăng Sát Thương
        content.add("% Sát thương tăng thêm trên mỗi Wave:").padBottom(4).padTop(6).row();
        let currentDmg = Core.settings.getInt("newex-dmg-per-wave-percent", 10);
        let dmgFieldTable = new Table();
        let dmgField = dmgFieldTable.field(currentDmg.toString(), text => {}).width(120).get();
        dmgField.setFilter(TextField.TextFieldFilter.digitsOnly);
        dmgField.setMaxLength(3);
        dmgFieldTable.add("% / Wave").padLeft(8);
        content.add(dmgFieldTable).pad(5).row();

        // --- 3. CÀI ĐẶT THỜI GIAN KÍCH HOẠT WAVE ---
        content.add("[accent]-- QUẢN LÝ WAVE --[]").padTop(10).row();
        let fastWaveEnabled = Core.settings.getBool("newex-allow-fast-wave", false);
        let btnFastWave = new TextButton("Bật Nút Gọi Wave Thủ Công", Styles.togglet);
        btnFastWave.getLabel().setFontScale(0.85);
        btnFastWave.setChecked(fastWaveEnabled);
        content.add(btnFastWave).size(250, 48).pad(5).row();

        // --- 4. CHẾ ĐỘ HIỂN THỊ THANH MÁU ---
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

        // --- 5. LOGIC UNIT VANILLA BUFF ---
        content.add("[accent]-- LOGIC UNIT VANILLA BUFF --[]").padTop(10).row();

        let unitsEnabled = Core.settings.getBool("newex-logic-support-units", true);

        let btnUnits = new TextButton("Bật Buff Units Vanilla", Styles.togglet);
        btnUnits.getLabel().setFontScale(0.85);
        btnUnits.setChecked(unitsEnabled);

        content.add(btnUnits).size(220, 48).pad(5).row();

        // --- 6. NÚT XEM THÔNG TIN README.MD ---
        content.add("[accent]-- THÔNG TIN CHI TIẾT --[]").padTop(10).row();
        content.button("Xem README / Update Log", Icon.info, () => {
            showReadmeDialog();
        }).size(240, 48).pad(5).row();

        // --- LƯU CÀI ĐẶT ---
        content.button("Lưu Cài Đặt", () => {
            let newValue = Math.floor(slider.getValue());
            Core.settings.put("newex-max-turrets", java.lang.Integer(newValue));

            let parsedHp = parseInt(hpField.getText()) || 0;
            if (parsedHp > 999) parsedHp = 999;
            if (parsedHp < 0) parsedHp = 0;
            Core.settings.put("newex-hp-per-wave-percent", java.lang.Integer(parsedHp));

            let parsedDmg = parseInt(dmgField.getText()) || 0;
            if (parsedDmg > 999) parsedDmg = 999;
            if (parsedDmg < 0) parsedDmg = 0;
            Core.settings.put("newex-dmg-per-wave-percent", java.lang.Integer(parsedDmg));

            Core.settings.put("newex-allow-fast-wave", java.lang.Boolean(btnFastWave.isChecked()));

            let selectedStyle = "off";
            if (btnShowHp.isChecked()) selectedStyle = "show-hp";
            else if (btnHp.isChecked()) selectedStyle = "hp";

            Core.settings.put("newex-hp-style", selectedStyle);
            Core.settings.put("newex-logic-support-units", java.lang.Boolean(btnUnits.isChecked()));

            Vars.ui.showInfo("Đã lưu cài đặt Newex thành công!");
            dialog.hide();
        }).size(170, 45).padTop(12);

        let scrollPane = new ScrollPane(content);
        scrollPane.setFadeScrollBars(false);
        mainContent.add(scrollPane).grow().row();

        dialog.addCloseButton();
        dialog.show();
    }

    // --- LOGIC XỬ LÝ BUFF MÁU VÀ SÁT THƯƠNG ĐỊCH THEO WAVE ---
    function applyEnemyBuffs(unit) {
        if (unit == null || unit.team == Vars.state.rules.defaultTeam) return;

        let wave = Vars.state.wave;
        if (wave <= 1) return;

        let hpPercent = Core.settings.getInt("newex-hp-per-wave-percent", 10);
        let dmgPercent = Core.settings.getInt("newex-dmg-per-wave-percent", 10);

        // Tính toán Hệ số nhân dựa trên Wave hiện tại (Wave 2 bắt đầu tính 1 lần buff)
        let hpMultiplier = 1 + ((wave - 1) * (hpPercent / 100));
        let dmgMultiplier = 1 + ((wave - 1) * (dmgPercent / 100));

        if (hpMultiplier > 1) {
            unit.maxHealth = unit.maxHealth * hpMultiplier;
            unit.health = unit.maxHealth;
        }

        if (dmgMultiplier > 1) {
            unit.damageMultiplier = (unit.damageMultiplier || 1) * dmgMultiplier;
        }
    }

    // Lắng nghe khi có bất kỳ Unit nào được sinh ra trên bản đồ
    Events.on(UnitCreateEvent, event => {
        if (event.unit != null) {
            applyEnemyBuffs(event.unit);
        }
    });

    // --- TẠO NÚT GỌI WAVE RIÊNG TRÊN GIAO DIỆN (UI) ---
    function buildCustomWaveButton() {
        if (customWaveBtn != null) return;

        customWaveBtn = new Table();
        customWaveBtn.bottom().right().margin(10);

        let btn = customWaveBtn.button("Gọi Wave", Icon.play, () => {
            let currentTime = Time.millis();
            if (currentTime - lastSkipTime >= 400) {
                lastSkipTime = currentTime;
                if (Vars.logic != null && Vars.state.isGame()) {
                    // Ép buộc sinh Wave mới ngay lập tức
                    Vars.logic.skipWave();
                }
            }
        }).size(130, 48).get();

        btn.getLabel().setFontScale(0.85);

        if (Vars.ui != null && Vars.ui.hudGroup != null) {
            Vars.ui.hudGroup.addChild(customWaveBtn);
        }
    }

    Events.on(ClientLoadEvent, event => {
        loadTurretsFromFolder();

        try {
            Vars.ui.menufrag.addButton("Cài đặt Newex", Icon.settings, () => {
                showConfigDialog();
            });
        } catch(e) {}
    });

    Events.run(Trigger.update, () => {
        let isEnabled = Core.settings.getBool("newex-allow-fast-wave", false);
        let inGame = Vars.state != null && Vars.state.isGame();

        if (isEnabled && inGame) {
            if (customWaveBtn == null) {
                buildCustomWaveButton();
            }
            if (customWaveBtn != null) {
                customWaveBtn.visible = true;
            }
        } else {
            if (customWaveBtn != null) {
                customWaveBtn.visible = false;
            }
        }
    });

    Events.on(WorldLoadEvent, event => {
        if (customWaveBtn != null) {
            customWaveBtn.remove();
            customWaveBtn = null;
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