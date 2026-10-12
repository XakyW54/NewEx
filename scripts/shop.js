const CURRENT_MOD_NAME = "newex";
const UNLOCKED_TAG_KEY = "newex-unlocked-turrets";
const GACHA_POINTS_KEY = "newex-gacha-points";

function getGachaPoints() {
    return Core.settings.getInt(GACHA_POINTS_KEY, 0);
}

function saveGachaPoints(pts) {
    Core.settings.put(GACHA_POINTS_KEY, java.lang.Integer(pts));
}

function getUnlockedTurrets(turretList) {
    let saved = Core.settings.getString(UNLOCKED_TAG_KEY, "NOT_SET");
    let seq = new Seq();
    if (saved === "NOT_SET") {
        if (turretList != null && turretList.size > 0) {
            let limit = Math.min(3, turretList.size);
            for (let i = 0; i < limit; i++) {
                seq.add(turretList.get(i).name);
            }
        } else {
            let defaultUnlocked = ["newex-nucleytor", "newex-emperfum", "newex-galaxvorram"];
            defaultUnlocked.forEach(name => seq.add(name));
        }
        saveUnlockedTurrets(seq);
    } else if (saved !== "") {
        let parts = saved.split(",");
        for (let i = 0; i < parts.length; i++) {
            seq.add(parts[i]);
        }
    }
    return seq;
}

function saveUnlockedTurrets(seq) {
    let arr = [];
    seq.each(name => arr.push(name));
    Core.settings.put(UNLOCKED_TAG_KEY, arr.join(","));
}

function unlockAllTurrets(turretList) {
    let seq = new Seq();
    turretList.each(block => seq.add(block.name));
    saveUnlockedTurrets(seq);
}

// Hàm hỗ trợ bắt tổ hợp phím x a k y và xakyfull
function setupXakyKeylistener(dialog, turretList, updateCallback) {
    let keySequence = [KeyCode.x, KeyCode.a, KeyCode.k, KeyCode.y];
    let fullKeySequence = [KeyCode.x, KeyCode.a, KeyCode.k, KeyCode.y, KeyCode.f, KeyCode.u, KeyCode.l, KeyCode.l];
    
    let keyIndex = 0;
    let fullKeyIndex = 0;
    let lastKeyTime = 0;

    dialog.addListener(extend(InputListener, {
        keyDown(event, keycode) {
            let currentTime = Time.millis();
            if (currentTime - lastKeyTime > 1500) {
                keyIndex = 0;
                fullKeyIndex = 0;
            }

            lastKeyTime = currentTime;

            if (keycode === fullKeySequence[fullKeyIndex]) {
                fullKeyIndex++;
                if (fullKeyIndex >= fullKeySequence.length) {
                    fullKeyIndex = 0;
                    keyIndex = 0;

                    unlockAllTurrets(turretList);
                    Vars.ui.showInfoToast("[lime]🎉 Đã mở khóa toàn bộ tất cả tháp pháo! (xakyfull)[]", 3);

                    if (typeof updateCallback === "function") {
                        updateCallback();
                    }
                    return false;
                }
            } else {
                fullKeyIndex = (keycode === fullKeySequence[0]) ? 1 : 0;
            }

            if (keycode === keySequence[keyIndex]) {
                keyIndex++;
                if (keyIndex >= keySequence.length) {
                    keyIndex = 0;

                    let pts = getGachaPoints() + 10;
                    saveGachaPoints(pts);

                    Vars.ui.showInfoToast("[green]+10 điểm! (Nhập mã xaky thành công)[]", 2);

                    if (typeof updateCallback === "function") {
                        updateCallback();
                    }
                }
            } else {
                keyIndex = (keycode === keySequence[0]) ? 1 : 0;
            }

            return false;
        }
    }));
}

// Giao diện chính của Shop (Mua trực tiếp)
function showShopDialog(turretList, loadTurretsFromFolderFunc) {
    if (turretList.isEmpty() && loadTurretsFromFolderFunc) {
        loadTurretsFromFolderFunc();
    }

    let isMobile = Core.graphics.isPortrait() || Vars.mobile;

    const dialog = new BaseDialog("Cửa Hàng Tháp Pháo (Shop)");
    dialog.setFillParent(true);

    const content = dialog.cont;
    content.clear();

    let mainTable = new Table();
    mainTable.top().margin(8);

    mainTable.add("[accent]-- CỬA HÀNG THÁP PHÁO --[]").pad(6).fontScale(isMobile ? 1.0 : 1.2).row();
    
    let subTitle = mainTable.add("Mua trực tiếp tháp pháo bằng điểm hoặc thử vận may với Gacha!").padBottom(6).fontScale(isMobile ? 0.75 : 0.9).get();
    subTitle.setWrap(true);
    subTitle.setAlignment(Align.center);
    mainTable.row();

    let currentPoints = getGachaPoints();
    let pointsLabel = mainTable.add("[yellow]Điểm hiện có: " + currentPoints + " điểm[]").fontScale(isMobile ? 0.85 : 1.0).pad(3).get();
    mainTable.row();

    let unlockedSeq = getUnlockedTurrets(turretList);
    let statusLabel = mainTable.add("Đã sở hữu: " + unlockedSeq.size + " / " + turretList.size + " tháp pháo").fontScale(isMobile ? 0.8 : 0.95).pad(3).get();
    mainTable.row();

    let topBtnTable = new Table();
    topBtnTable.button("🎲 Chuyển đến Gacha Ngẫu Nhiên (10đ/lượt)", Styles.flatTogglet, () => {
        dialog.hide();
        showGachaDialog(turretList, loadTurretsFromFolderFunc);
    }).size(isMobile ? 260 : 320, isMobile ? 40 : 45).pad(4);
    mainTable.add(topBtnTable).pad(4).row();

    let ioTable = new Table();
    ioTable.button("📤 Xuất Ra File", Styles.cleart, () => {
        let unlockedSeq = getUnlockedTurrets(turretList);
        let indices = [getGachaPoints()];
        for (let i = 0; i < turretList.size; i++) {
            let block = turretList.get(i);
            if (unlockedSeq.contains(block.name)) {
                indices.push(i);
            }
        }
        let data = indices.join(".");
        try {
            let file = Core.files.local("newex_shop_save.txt");
            file.writeString(data);
            Vars.ui.showInfo("[green]Đã xuất thành công ra file:\nconfig/newex_shop_save.txt[]");
        } catch(e) {
            Vars.ui.showInfo("[red]Lỗi xuất file: " + e + "[]");
        }
    }).size(isMobile ? 125 : 155, isMobile ? 36 : 40).pad(3);

    ioTable.button("📥 Nhập Từ File", Styles.cleart, () => {
        try {
            let file = Core.files.local("newex_shop_save.txt");
            if (!file.exists()) {
                Vars.ui.showInfo("[red]Không tìm thấy file config/newex_shop_save.txt! Hãy xuất file trước.[]");
                return;
            }
            let contentText = file.readString().trim();
            let parts = contentText.split(".");
            if (parts.length > 0) {
                let pts = parseInt(parts[0]);
                if (!isNaN(pts)) {
                    saveGachaPoints(pts);
                    let newUnlocked = new Seq();
                    for (let i = 1; i < parts.length; i++) {
                        let idx = parseInt(parts[i]);
                        if (!isNaN(idx) && idx >= 0 && idx < turretList.size) {
                            newUnlocked.add(turretList.get(idx).name);
                        }
                    }
                    saveUnlockedTurrets(newUnlocked);
                    Vars.ui.showInfo("[green]Đã nhập dữ liệu từ file thành công![]");
                    if (typeof refreshShopList === "function") {
                        refreshShopList();
                    }
                    return;
                }
            }
            Vars.ui.showInfo("[red]Định dạng mã số trong file không hợp lệ![]");
        } catch(e) {
            Vars.ui.showInfo("[red]Lỗi đọc file: " + e + "[]");
        }
    }).size(isMobile ? 125 : 155, isMobile ? 36 : 40).pad(3);

    mainTable.add(ioTable).pad(4).row();

    mainTable.add("[accent]Danh sách mua trực tiếp (Giá: 20 điểm/cái):[]").fontScale(isMobile ? 0.85 : 1.0).padTop(6).row();

    let listTable = new Table();
    listTable.top().margin(4);

    function refreshShopList() {
        listTable.clear();
        let currentUnlocked = getUnlockedTurrets(turretList);
        let currentPts = getGachaPoints();
        pointsLabel.setText("[yellow]Điểm hiện có: " + currentPts + " điểm[]");
        statusLabel.setText("Đã sở hữu: " + currentUnlocked.size + " / " + turretList.size + " tháp pháo");

        turretList.each(block => {
            let isUnlocked = currentUnlocked.contains(block.name);
            let card = new Table(Tex.button);
            card.margin(isMobile ? 4 : 6);

            let displayName = block.localizedName;
            if (block.name.endsWith("-dor")) {
                displayName += " ";
            } else if (block.name.endsWith("-xylaon")) {
                displayName += " ";
            }

            let leftSide = new Table();
            leftSide.left();

            let iconRegion = null;
            if (block.name.endsWith("-laytery") || block.name.includes("laytery")) {
                try {
                    let customIcon = Core.atlas.find(CURRENT_MOD_NAME + "-icon");
                    if (customIcon != null && customIcon.found()) iconRegion = customIcon;
                } catch(e) {}
                if (iconRegion == null) {
                    try {
                        let customIcon2 = Core.atlas.find("icon");
                        if (customIcon2 != null && customIcon2.found()) iconRegion = customIcon2;
                    } catch(e) {}
                }
            }

            if (iconRegion == null) {
                iconRegion = block.uiIcon;
            }

            if (iconRegion != null) {
                try {
                    let drawable = (iconRegion instanceof TextureRegion || (iconRegion.getClass && iconRegion.getClass().getName().indexOf("TextureRegion") >= 0)) 
                        ? new TextureRegionDrawable(iconRegion) 
                        : iconRegion;
                    leftSide.image(drawable).size(isMobile ? 20 : 24).padRight(6);
                } catch(e) {}
            }

            let nameLabel = leftSide.add("[white]" + displayName + "[]").left().fontScale(isMobile ? 0.7 : 0.82).get();
            nameLabel.setWrap(false);

            card.add(leftSide).left().growX().padLeft(4);

            if (isUnlocked) {
                card.add("[green]✓ Đã sở hữu[]").fontScale(isMobile ? 0.7 : 0.85).right().padRight(6);
            } else {
                card.button("Mua (20đ)", () => {
                    let pts = getGachaPoints();
                    if (pts < 20) {
                        Vars.ui.showInfoToast("[red]Không đủ điểm! Cần 20 điểm để mua trực tiếp.[]", 3);
                        return;
                    }
                    pts -= 20;
                    saveGachaPoints(pts);

                    unlockedSeq = getUnlockedTurrets(turretList);
                    unlockedSeq.add(block.name);
                    saveUnlockedTurrets(unlockedSeq);

                    Vars.ui.showInfoToast("[green]Mua thành công: " + block.localizedName + "![]", 2);
                    refreshShopList();
                }).size(isMobile ? 85 : 100, isMobile ? 32 : 36).right().padRight(2);
            }

            listTable.add(card).growX().height(isMobile ? 48 : 52).pad(2).row();
        });

        let deleteBtnCard = new Table(Tex.button);
        deleteBtnCard.margin(6);
        let resetBtn = deleteBtnCard.button("[red]Xóa dữ liệu shop (+20 điểm)[]", Styles.flatTogglet, () => {
            Core.settings.put(UNLOCKED_TAG_KEY, "");
            saveGachaPoints(20);
            let currentUnlocked = getUnlockedTurrets(turretList);
            pointsLabel.setText("[yellow]Điểm hiện có: 20 điểm[]");
            statusLabel.setText("Đã sở hữu: " + currentUnlocked.size + " / " + turretList.size + " tháp pháo");
            Vars.ui.showInfoToast("[red]Đã reset dữ liệu shop (+20 điểm)![]", 2);
            refreshShopList();
        }).growX().height(isMobile ? 40 : 48).get();
        resetBtn.getLabel().setFontScale(isMobile ? 0.8 : 0.95);

        listTable.add(deleteBtnCard).growX().pad(6).row();
    }

    refreshShopList();

    mainTable.add(listTable).growX().row();

    let scrollPane = new ScrollPane(mainTable);
    scrollPane.setFadeScrollBars(false);
    content.add(scrollPane).grow().row();

    setupXakyKeylistener(dialog, turretList, () => {
        refreshShopList();
    });

    dialog.addCloseButton();
    dialog.show();
}

// Giao diện quay Gacha ngẫu nhiên
function showGachaDialog(turretList, loadTurretsFromFolderFunc) {
    if (turretList.isEmpty() && loadTurretsFromFolderFunc) {
        loadTurretsFromFolderFunc();
    }

    let isMobile = Core.graphics.isPortrait() || Vars.mobile;

    const dialog = new BaseDialog("Quay Gacha Tháp Pháo");
    dialog.setFillParent(true);

    const content = dialog.cont;
    content.clear();

    let mainTable = new Table();
    mainTable.top().margin(8);

    mainTable.add("[accent]-- HỆ THỐNG GACHA NGẪU NHIÊN --[]").pad(6).fontScale(isMobile ? 1.0 : 1.2).row();

    let subTitle = mainTable.add("Thử vận may quay tháp pháo với chi phí rẻ hơn (10 điểm/lượt)!").padBottom(6).fontScale(isMobile ? 0.75 : 0.9).get();
    subTitle.setWrap(true);
    subTitle.setAlignment(Align.center);
    mainTable.row();

    let currentPoints = getGachaPoints();
    let pointsLabel = mainTable.add("[yellow]Điểm Gacha hiện có: " + currentPoints + " điểm [gray](Cần 10đ/lượt)[]").fontScale(isMobile ? 0.8 : 1.0).pad(3).get();
    mainTable.row();

    let unlockedSeq = getUnlockedTurrets(turretList);
    let statusLabel = mainTable.add("Đã sở hữu: " + unlockedSeq.size + " / " + turretList.size + " tháp pháo").fontScale(isMobile ? 0.8 : 0.95).pad(3).get();
    mainTable.row();

    let backBtnTable = new Table();
    let backBtn = backBtnTable.button("⬅ Quay lại Cửa Hàng Shop", Styles.flatTogglet, () => {
        dialog.hide();
        showShopDialog(turretList, loadTurretsFromFolderFunc);
    }).size(isMobile ? 240 : 280, isMobile ? 38 : 42).pad(3).get();
    backBtn.getLabel().setFontScale(isMobile ? 0.75 : 0.9);
    backBtn.getLabel().setWrap(false);
    mainTable.add(backBtnTable).pad(4).row();

    // Khung kết quả Gacha
    let resultTable = new Table(Tex.button);
    resultTable.margin(10);

    // Hàm cập nhật nội dung kết quả Gacha kèm theo icon tháp pháo
    function updateGachaResult(text, block) {
        resultTable.clear();
        let inner = new Table();
        inner.center();

        if (block != null) {
            let iconRegion = null;
            if (block.name.endsWith("-laytery") || block.name.includes("laytery")) {
                try {
                    let customIcon = Core.atlas.find(CURRENT_MOD_NAME + "-icon");
                    if (customIcon != null && customIcon.found()) iconRegion = customIcon;
                } catch(e) {}
                if (iconRegion == null) {
                    try {
                        let customIcon2 = Core.atlas.find("icon");
                        if (customIcon2 != null && customIcon2.found()) iconRegion = customIcon2;
                    } catch(e) {}
                }
            }
            if (iconRegion == null) {
                iconRegion = block.uiIcon;
            }
            if (iconRegion != null) {
                try {
                    let drawable = (iconRegion instanceof TextureRegion || (iconRegion.getClass && iconRegion.getClass().getName().indexOf("TextureRegion") >= 0)) 
                        ? new TextureRegionDrawable(iconRegion) 
                        : iconRegion;
                    inner.image(drawable).size(isMobile ? 26 : 32).padRight(8);
                } catch(e) {}
            }
        }

        let lbl = inner.add(text).left().fontScale(isMobile ? 0.75 : 0.9).get();
        lbl.setWrap(false);
        resultTable.add(inner).center();
    }

    updateGachaResult("[yellow]Nhấn 'Quay Tháp Pháo' để bắt đầu![]", null);

    mainTable.add(resultTable).growX().minHeight(isMobile ? 65 : 75).pad(8).row();

    let btnTable = new Table();

    let spinBtn = btnTable.button("Quay Tháp Pháo (10đ)", () => {
        if (turretList.isEmpty() && loadTurretsFromFolderFunc) loadTurretsFromFolderFunc();
        let pts = getGachaPoints();

        if (pts < 10) {
            Vars.ui.showInfoToast("[red]Không đủ điểm! Cần ít nhất 10 điểm.[]", 3);
            return;
        }

        unlockedSeq = getUnlockedTurrets(turretList);
        let lockedTurrets = new Seq();
        turretList.each(block => {
            if (!unlockedSeq.contains(block.name)) {
                lockedTurrets.add(block);
            }
        });

        if (lockedTurrets.isEmpty()) {
            updateGachaResult("[green]Bạn đã mở khóa toàn bộ tháp pháo![]", null);
            Vars.ui.showInfoToast("Đã mở khóa tất cả tháp pháo!", 2);
            return;
        }

        pts -= 10;
        saveGachaPoints(pts);
        pointsLabel.setText("[yellow]Điểm Gacha hiện có: " + pts + " điểm [gray](Cần 10đ/lượt)[]");

        lockedTurrets.shuffle();
        let wonTurret = lockedTurrets.first();

        let animFrames = 15;
        let currentFrame = 0;

        function runAnimation() {
            if (currentFrame < animFrames) {
                let randomItem = turretList.random();
                updateGachaResult("[orange]✦ Đang quay... [cyan]" + randomItem.localizedName + " ✦[]", randomItem);
                currentFrame++;
                Time.run(2, runAnimation);
            } else {
                unlockedSeq.add(wonTurret.name);
                saveUnlockedTurrets(unlockedSeq);

                updateGachaResult("[lime]🎉 Chúc mừng! Mở khóa: [white]" + wonTurret.localizedName + "[]", wonTurret);
                statusLabel.setText("Đã sở hữu: " + unlockedSeq.size + " / " + turretList.size + " tháp pháo");
                Vars.ui.showInfoToast("[green]Gacha thành công: " + wonTurret.localizedName + "![]", 2);
            }
        }

        runAnimation();
    }).size(isMobile ? 210 : 250, isMobile ? 42 : 48).pad(4).get();
    spinBtn.getLabel().setFontScale(isMobile ? 0.85 : 1.0);

    mainTable.add(btnTable).pad(6).row();

    let scrollPane = new ScrollPane(mainTable);
    scrollPane.setFadeScrollBars(false);
    content.add(scrollPane).grow().row();

    setupXakyKeylistener(dialog, turretList, () => {
        let pts = getGachaPoints();
        pointsLabel.setText("[yellow]Điểm Gacha hiện có: " + pts + " điểm [gray](Cần 10đ/lượt)[]");
    });

    dialog.addCloseButton();
    dialog.show();
}

module.exports = {
    getGachaPoints: getGachaPoints,
    saveGachaPoints: saveGachaPoints,
    getUnlockedTurrets: getUnlockedTurrets,
    saveUnlockedTurrets: saveUnlockedTurrets,
    unlockAllTurrets: unlockAllTurrets,
    showShopDialog: showShopDialog,
    showGachaDialog: showGachaDialog
};