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
        turretList.each(block => seq.add(block.name));
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

// Giao diện chính của Shop (Mua trực tiếp pháo Dor/Xylaon + Nút chuyển sang Gacha)
function showShopDialog(turretList, loadTurretsFromFolderFunc) {
    if (turretList.isEmpty() && loadTurretsFromFolderFunc) {
        loadTurretsFromFolderFunc();
    }

    const dialog = new BaseDialog("Cửa Hàng Tháp Pháo (Shop)");
    dialog.setFillParent(true);

    const content = dialog.cont;
    content.clear();

    content.add("[accent]-- CỬA HÀNG THÁP PHÁO --[]").pad(10).fontScale(1.2).row();
    content.add("Mua trực tiếp tháp pháo bằng điểm hoặc thử vận may với Gacha!").padBottom(8).row();

    let currentPoints = getGachaPoints();
    let pointsLabel = content.add("[yellow]Điểm hiện có: " + currentPoints + " điểm[]").fontScale(1.0).pad(4).get();
    content.row();

    let unlockedSeq = getUnlockedTurrets(turretList);
    let statusLabel = content.add("Đã sở hữu: " + unlockedSeq.size + " / " + turretList.size + " tháp pháo").fontScale(0.95).pad(4).get();
    content.row();

    // Nút chuyển sang giao diện Gacha
    let topBtnTable = new Table();
    topBtnTable.button("🎲 Chuyển đến Gacha Ngẫu Nhiên (10 điểm/lượt)", Styles.flatTogglet, () => {
        dialog.hide();
        showGachaDialog(turretList, loadTurretsFromFolderFunc);
    }).size(320, 45).pad(6);
    content.add(topBtnTable).pad(5).row();

    content.add("[accent]Danh sách mua trực tiếp (Giá: 20 điểm/cái):[]").padTop(6).row();

    let listTable = new Table();
    listTable.top().margin(5);

    function refreshShopList() {
        listTable.clear();
        let currentUnlocked = getUnlockedTurrets(turretList);
        let currentPts = getGachaPoints();
        pointsLabel.setText("[yellow]Điểm hiện có: " + currentPts + " điểm[]");
        statusLabel.setText("Đã sở hữu: " + currentUnlocked.size + " / " + turretList.size + " tháp pháo");

        turretList.each(block => {
            let isUnlocked = currentUnlocked.contains(block.name);
            let card = new Table(Tex.button);
            card.margin(6);

            let displayName = block.localizedName;
            if (block.name.endsWith("-dor")) {
                displayName += " [orange](20đ - Mở khóa Dor)[]";
            } else if (block.name.endsWith("-xylaon")) {
                displayName += " [cyan](20đ - Đổi Xylaon)[]";
            }

            card.add("[white]" + displayName + "[]").left().growX().padLeft(6);

            if (isUnlocked) {
                card.add("[green]✓ Đã sở hữu[]").right().padRight(10);
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
}).size(100, 36).right();
            }

            listTable.add(card).growX().pad(3).row();
        });

        // Nút xóa/reset dữ liệu shop
        let deleteBtnCard = new Table(Tex.button);
        deleteBtnCard.margin(10);
        deleteBtnCard.button("[red]Xóa dữ liệu shop (+20 điểm)[]", Styles.flatTogglet, () => {
            Core.settings.put(UNLOCKED_TAG_KEY, "");
            saveGachaPoints(20);
            let currentUnlocked = getUnlockedTurrets(turretList);
            pointsLabel.setText("[yellow]Điểm hiện có: 20 điểm[]");
            statusLabel.setText("Đã sở hữu: " + currentUnlocked.size + " / " + turretList.size + " tháp pháo");
            Vars.ui.showInfoToast("[red]Đã reset dữ liệu shop (+20 điểm)![]", 2);
            refreshShopList();
        }).growX().height(48);

        listTable.add(deleteBtnCard).growX().pad(10).row();
    }

    refreshShopList();

    let scrollPane = new ScrollPane(listTable);
    content.add(scrollPane).grow().row();

    dialog.addCloseButton();
    dialog.show();
}

// Giao diện quay Gacha ngẫu nhiên
function showGachaDialog(turretList, loadTurretsFromFolderFunc) {
    if (turretList.isEmpty() && loadTurretsFromFolderFunc) {
        loadTurretsFromFolderFunc();
    }

    const dialog = new BaseDialog("Quay Gacha Tháp Pháo");
    dialog.setFillParent(true);

    const content = dialog.cont;
    content.clear();

    content.add("[accent]-- HỆ THỐNG GACHA NGẪU NHIÊN --[]").pad(10).fontScale(1.2).row();
    content.add("Thử vận may quay tháp pháo với chi phí rẻ hơn (10 điểm/lượt)!").padBottom(8).row();

    let currentPoints = getGachaPoints();
    let pointsLabel = content.add("[yellow]Điểm Gacha hiện có: " + currentPoints + " điểm [gray](Cần 10 điểm/lượt)[]").fontScale(1.0).pad(4).get();
    content.row();

    let unlockedSeq = getUnlockedTurrets(turretList);
    let statusLabel = content.add("Đã sở hữu: " + unlockedSeq.size + " / " + turretList.size + " tháp pháo").fontScale(0.95).pad(4).get();
    content.row();

    // Nút quay lại Shop mua trực tiếp
    let backBtnTable = new Table();
    backBtnTable.button("⬅ Quay lại Cửa Hàng Shop", Styles.flatTogglet, () => {
        dialog.hide();
        showShopDialog(turretList, loadTurretsFromFolderFunc);
    }).size(250, 40).pad(4);
    content.add(backBtnTable).pad(5).row();

    let resultTable = new Table(Tex.button);
    resultTable.margin(15);
    let resultLabel = resultTable.add("[yellow]Nhấn nút 'Quay Tháp Pháo' bên dưới để bắt đầu![]").fontScale(1.05).get();
    resultTable.row();
    content.add(resultTable).size(360, 80).pad(10).row();

    let btnTable = new Table();

    btnTable.button("Quay Tháp Pháo (10đ)", () => {
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
            resultLabel.setText("[green]Bạn đã mở khóa toàn bộ tháp pháo![]");
            Vars.ui.showInfoToast("Đã mở khóa tất cả tháp pháo!", 2);
            return;
        }

        pts -= 10;
        saveGachaPoints(pts);
        pointsLabel.setText("[yellow]Điểm Gacha hiện có: " + pts + " điểm [gray](Cần 10 điểm/lượt)[]");

        lockedTurrets.shuffle();
        let wonTurret = lockedTurrets.first();

        let animFrames = 15;
        let currentFrame = 0;

        function runAnimation() {
            if (currentFrame < animFrames) {
                let randomItem = turretList.random();
                resultLabel.setText("[orange]✦ Đang quay... [cyan]" + randomItem.localizedName + " ✦[]");
                currentFrame++;
                Time.run(2, runAnimation);
            } else {
                unlockedSeq.add(wonTurret.name);
                saveUnlockedTurrets(unlockedSeq);

                resultLabel.setText("[lime]🎉 Chúc mừng! Đã mở khóa: [white]" + wonTurret.localizedName + "[]");
                statusLabel.setText("Đã sở hữu: " + unlockedSeq.size + " / " + turretList.size + " tháp pháo");
                Vars.ui.showInfoToast("[green]Gacha thành công: " + wonTurret.localizedName + "![]", 2);
            }
        }

        runAnimation();
    }).size(250, 48).pad(4);

    content.add(btnTable).pad(10).row();

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