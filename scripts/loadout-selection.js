const modPrefix = "newex-";
const turretList = [
    "nucleytor", "emperfum", "galaxvorram", "bayrowfyr", "dor",
    "flazerd", "erysidus", "blixalum", "heliyron", "persefer",
    "tankani2k", "zoj", "reflecounum", "swordoder", "buffetles",
    "maxitoner", "xylaon", "lyvervon", "vendicum", "drone-launcher",
    "holyder", "plasanod", "tankani4k", "therdum", "lazash",
    "forstarsilum", "hitekalum", "reguilater", "lavunder", "blaw",
    "dtg-soldern", "indeniter", "rangtaturs", "tyber"
];

let selectedTurrets = new Seq();

function showTurretSelectionDialog() {
    selectedTurrets.clear();
    
    const dialog = new BaseDialog("Chọn 5 Tháp Pháo (Newex)");
    dialog.setFillParent(true);

    const contentTable = dialog.cont;
    contentTable.add("Vui lòng chọn đúng 5 tháp pháo để sử dụng trong trận này:").padBottom(10).row();

    const selectionTable = new Table();
    selectionTable.top();

    let cols = 0;
    turretList.forEach(name => {
        let fullName = modPrefix + name;
        let block = Vars.content.block(fullName);

        if (block != null) {
            // Sử dụng Styles.togglet để tạo nút có thể toggle chọn/bỏ chọn
            let btn = selectionTable.button(block.localizedName, Styles.togglet, () => {}).size(140, 50).pad(4).get();
            
            btn.clicked(() => {
                if (btn.isChecked()) {
                    if (selectedTurrets.size < 5) {
                        selectedTurrets.add(block);
                    } else {
                        btn.setChecked(false); // Vượt quá 5 tháp pháo thì hủy chọn
                    }
                } else {
                    selectedTurrets.remove(block);
                }
            });

            cols++;
            if (cols % 4 === 0) selectionTable.row();
        }
    });

    const scrollPane = new ScrollPane(selectionTable);
    contentTable.add(scrollPane).grow().row();

    // Nút xác nhận
    contentTable.button("Xác nhận", () => {
        if (selectedTurrets.size !== 5) {
            Vars.ui.showInfo("Bạn phải chọn đúng 5 tháp pháo!");
            return;
        }

        turretList.forEach(name => {
            let fullName = modPrefix + name;
            let block = Vars.content.block(fullName);
            if (block != null) {
                if (selectedTurrets.contains(block)) {
                    block.buildVisibility = BuildVisibility.shown;
                } else {
                    block.buildVisibility = BuildVisibility.hidden;
                }
            }
        });

        dialog.hide();
    }).size(200, 50).padTop(10);

    dialog.show();
}

Events.on(WorldLoadEvent, event => {
    turretList.forEach(name => {
        let block = Vars.content.block(modPrefix + name);
        if (block != null) {
            block.buildVisibility = BuildVisibility.hidden;
        }
    });

    Core.app.post(() => {
        showTurretSelectionDialog();
    });
});