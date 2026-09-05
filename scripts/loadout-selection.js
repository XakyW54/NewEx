(function() {
    const CURRENT_MOD_NAME = "newex";
    
    const fallbackTurrets = [
        "nucleytor", "emperfum", "galaxvorram", "bayrowfyr", "dor",
        "flazerd", "erysidus", "blixalum", "heliyron", "persefer",
        "tankani2k", "zoj", "reflecounum", "swordoder", "buffetles",
        "maxitoner", "xylaon", "lyvervon", "vendicum", "drone-launcher",
        "holyder", "plasanod", "tankani4k", "therdum", "lazash",
        "forstarsilum", "hitekalum", "reguilater", "lavunder", "blaw",
        "dtg-soldern", "indeniter", "rangtaturs", "tyber"
    ];

    let turretList = new Seq();
    let selectedTurrets = new Seq();

    function loadTurretsFromFolder() {
        turretList.clear();
        let mod = Vars.mods.getMod(CURRENT_MOD_NAME);
        
        if (mod != null && mod.root != null) {
            let turretsDir = mod.root.child("content").child("blocks").child("turrets");
            
            if (turretsDir.exists() && turretsDir.isDirectory()) {
                let files = turretsDir.list();
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];
                    let blockName = file.nameWithoutExtension();
                    let fullName = CURRENT_MOD_NAME + "-" + blockName;
                    
                    let block = Vars.content.block(fullName);
                    if (block != null) {
                        turretList.add(block);
                    }
                }
            }
        }

        if (turretList.isEmpty()) {
            fallbackTurrets.forEach(name => {
                let block = Vars.content.block(CURRENT_MOD_NAME + "-" + name);
                if (block != null) {
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

    // Hàm băm chuỗi JS an toàn không lo crash hashCode
    function getStringHash(str) {
        let hash = 0;
        let s = String(str);
        for (let i = 0; i < s.length; i++) {
            let char = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // Tạo key lưu trữ an toàn dựa theo Map/Sector hiện tại
    function getWorldSaveKey() {
        if (Vars.state.map != null) {
            let mapName = String(Vars.state.map.name());
            return "newex-saved-turrets-" + getStringHash(mapName);
        }
        return "newex-saved-turrets-default";
    }

    function getSavedTurretsForCurrentWorld() {
        let key = getWorldSaveKey();
        let savedString = Core.settings.getString(key, "");
        if (!savedString || savedString === "") return null;
        return savedString.split(",");
    }

    function applyTurretVisibility(allowedNamesSeq) {
        turretList.each(block => {
            if (allowedNamesSeq.contains(block.name)) {
                block.buildVisibility = BuildVisibility.shown;
            } else {
                block.buildVisibility = BuildVisibility.hidden;
            }
        });
    }

    function showTurretSelectionDialog() {
        selectedTurrets.clear();
        const maxCount = getMaxSelectCount();
        
        const dialog = new BaseDialog("Chọn Tháp Pháo (" + CURRENT_MOD_NAME + ")");
        dialog.setFillParent(true);

        const contentTable = dialog.cont;
        contentTable.clear();

        let titleLabel = contentTable.add("Vui lòng chọn đúng " + maxCount + " tháp pháo (Lựa chọn sẽ bị khóa cố định cho map này):").pad(8).get();
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

        contentTable.button("Xác nhận", () => {
            if (selectedTurrets.size !== maxCount) {
                Vars.ui.showInfo("Bạn phải chọn đúng " + maxCount + " tháp pháo!");
                return;
            }

            let savedArray = [];
            let allowedNames = new Seq();
            selectedTurrets.each(block => {
                savedArray.push(block.name);
                allowedNames.add(block.name);
            });

            Core.settings.put(getWorldSaveKey(), savedArray.join(","));
            applyTurretVisibility(allowedNames);

            dialog.hide();
        }).size(180, 50).pad(10);

        dialog.show();
    }

    function showConfigDialog() {
        if (turretList.isEmpty()) loadTurretsFromFolder();

        const dialog = new BaseDialog("Cài Đặt Mod Newex");
        const content = dialog.cont;

        content.add("Số lượng tháp pháo chọn mỗi trận:").padBottom(10).row();

        let currentLimit = getMaxSelectCount();
        let textLabel = content.add(currentLimit >= turretList.size ? "Tất cả (Full)" : currentLimit.toString()).fontScale(1.4).get();
        content.row();

        let maxSliderVal = Math.max(1, turretList.size);
        let slider = content.slider(1, maxSliderVal, 1, Math.min(currentLimit, maxSliderVal), value => {
            let val = Math.floor(value);
            if (val >= turretList.size) {
                textLabel.setText("Tất cả (Full)");
            } else {
                textLabel.setText(val.toString());
            }
        }).width(220).pad(10).get();
        content.row();

        content.button("Lưu cài đặt", () => {
            let newValue = Math.floor(slider.getValue());
            Core.settings.put("newex-max-turrets", java.lang.Integer(newValue));
            
            if (newValue >= turretList.size) {
                Vars.ui.showInfo("Đã lưu: Mở toàn bộ tháp pháo (Bỏ qua bảng chọn).");
            } else {
                Vars.ui.showInfo("Đã lưu số lượng tháp pháo cần chọn là: " + newValue);
            }
            
            dialog.hide();
        }).size(160, 45).padTop(10);

        dialog.addCloseButton();
        dialog.show();
    }

    Events.on(ClientLoadEvent, event => {
        loadTurretsFromFolder();

        try {
            Vars.ui.menufrag.addButton("Cài đặt Newex", Icon.settings, () => {
                showConfigDialog();
            });
        } catch(e) {}

        Core.app.post(() => {
            if (Vars.ui.menuGroup != null) {
                let table = new Table();
                table.top().left();
                table.button("Cài đặt Newex", Icon.settings, () => {
                    showConfigDialog();
                }).size(150, 45).pad(10);
                Vars.ui.menuGroup.addChild(table);
            }
        });
    });

    Events.on(WorldLoadEvent, event => {
        if (turretList.isEmpty()) loadTurretsFromFolder();

        if (isFullSelection()) {
            unlockAllTurrets();
            return;
        }

        let savedNames = getSavedTurretsForCurrentWorld();
        if (savedNames != null && savedNames.length > 0) {
            let allowedNames = new Seq();
            for (let i = 0; i < savedNames.length; i++) {
                allowedNames.add(savedNames[i]);
            }
            applyTurretVisibility(allowedNames);
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