(function() {
    const CURRENT_MOD_NAME = "newex";
    const TAG_KEY = "newex-selected-turrets";
    const UNLOCKED_TAG_KEY = "newex-unlocked-turrets";
    const GACHA_POINTS_KEY = "newex-gacha-points";
    
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

    const normalDeltaProvider = () => Math.min(Core.graphics.getDeltaTime() * 60, 3);
    const slowDeltaProvider = () => Math.min(Core.graphics.getDeltaTime() * 60, 3) * 0.8;

    const packCons = (func) => new Cons({ get: func });

    function draw3DRotatedEllipseWave(centerX, centerY, radiusX, radiusY, rotationDeg) {
        let points = 20;
        let rotationRad = rotationDeg * Mathf.degRad;
        let cosRot = Math.cos(rotationRad);
        let sinRot = Math.sin(rotationRad);
        
        let localX = radiusX;
        let localY = 0;
        let lastX = centerX + (localX * cosRot - localY * sinRot);
        let lastY = centerY + (localX * sinRot + localY * cosRot);
        
        for (let i = 1; i <= points; i++) {
            let angle = (i * 360 / points) * Mathf.degRad;
            localX = Math.cos(angle) * radiusX;
            localY = Math.sin(angle) * radiusY;
            
            let nextX = centerX + (localX * cosRot - localY * sinRot);
            let nextY = centerY + (localX * sinRot + localY * cosRot);
            
            Lines.line(lastX, lastY, nextX, nextY);
            
            lastX = nextX;
            lastY = nextY;
        }
    }

    const customShockwaveEffect = new Effect(40, packCons((e) => {
        Draw.z(Layer.effect + 4);
        let f = e.fin();
        let alpha = 1.0 - Interp.pow3Out.apply(f);
        let radius = 10 + (240 * Interp.pow2Out.apply(f));

        Lines.stroke(6 * alpha, Color.valueOf("ffb380"));
        Lines.circle(e.x, e.y, radius);

        Lines.stroke(3 * alpha, Color.white);
        Lines.circle(e.x, e.y, radius * 0.85);

        Draw.reset();
    }));

    const meteorFallingEffect = new Effect(50, packCons((e) => {
        Draw.z(Layer.effect + 5);
        let f = e.fin(); 

        let portalX = e.x - 220;
        let portalY = e.y + 450;

        let currentX = Mathf.lerp(portalX, e.x, f);
        let currentY = Mathf.lerp(portalY, e.y, f);

        if (f < 0.85) {
            let portalAlpha = f < 0.15 ? f / 0.15 : (0.85 - f) / 0.7;

            let starRegion = Core.atlas.find("newex-star-field");
            if (!starRegion.found()) starRegion = Core.atlas.find("star-field");

            if (starRegion.found()) {
                Draw.color(Color.white);
                Draw.alpha(portalAlpha * 0.8);
                Draw.rect(starRegion, portalX, portalY, 108, 108, Time.time * 3.0);
            }

            let blackholeRegion = Core.atlas.find("newex-blackhole-pulse");
            if (!blackholeRegion.found()) blackholeRegion = Core.atlas.find("blackhole-pulse");

            if (blackholeRegion.found()) {
                Draw.color(Color.white);
                Draw.alpha(portalAlpha);
                Draw.rect(blackholeRegion, portalX, portalY, 90, 90, Time.time * -6.0);
            }

            Draw.color(Color.valueOf("1a1721"));
            Draw.alpha(portalAlpha * 0.6);
            Fill.circle(portalX, portalY, 18 + Math.sin(Time.time * 0.15) * 2);

            Draw.color(Color.black);
            Draw.alpha(portalAlpha);
            Fill.circle(portalX, portalY, 14);
        }

        let waveAngle = 33; 
        let waveRadius = 6 + (28 * Interp.pow2Out.apply(f));
        Lines.stroke(2.0 * (1.0 - f), Color.valueOf("ffb380"));
        draw3DRotatedEllipseWave(currentX, currentY, waveRadius, waveRadius * 0.4, waveAngle);

        let flightAngle = Angles.angle(portalX, portalY, e.x, e.y);
        let tailAngle = flightAngle + 180;

        if (Mathf.chance(0.8)) {
            let tailX = currentX + Angles.trnsx(tailAngle, 6);
            let tailY = currentY + Angles.trnsy(tailAngle, 6);
            Fx.smoke.at(tailX + Mathf.range(3), tailY + Mathf.range(3));
        }

        let meteorRegion = Core.atlas.find("newex-basalt-bluff");
        if (!meteorRegion.found()) {
            meteorRegion = Core.atlas.find("basalt-bluff");
        }

        if (meteorRegion.found()) {
            Draw.color(Color.white);
            let rotation = Time.time * 15.0; 
            Draw.rect(meteorRegion, currentX, currentY, 24, 24, rotation);
        } else {
            Draw.color(Color.valueOf("594e48"));
            Fill.circle(currentX, currentY, 9);
        }

        Draw.reset();
    }));

    function spawnRandomMeteor(tx, ty) {
        let targetTile = Vars.world.tileWorld(tx, ty);
        if (targetTile == null) return;

        Fx.reactorExplosion.at(tx, ty);
        Fx.dynamicExplosion.at(tx, ty);
        Fx.smokeCloud.at(tx, ty);
        customShockwaveEffect.at(tx, ty);
        Effect.shake(14, 14, tx, ty);

        Damage.damage(tx, ty, 30 * Vars.tilesize, 1000);

        let destroyRadius = 15;
        let outerRadius = 30;

        for (let rx = -outerRadius; rx <= outerRadius; rx++) {
            for (let ry = -outerRadius; ry <= outerRadius; ry++) {
                let dist = Math.sqrt(rx * rx + ry * ry);
                let tileX = targetTile.x + rx;
                let tileY = targetTile.y + ry;
                let t = Vars.world.tile(tileX, tileY);

                if (t != null && t.build != null) {
                    let b = t.build;

                    if (dist <= destroyRadius) {
                        b.kill();
                    } else if (dist <= outerRadius) {
                        b.damage(1000);
                    }
                }
            }
        }

        let vanillaOres = [
            Blocks.oreCopper,
            Blocks.oreLead,
            Blocks.oreCoal,
            Blocks.oreTitanium,
            Blocks.oreThorium,
            Blocks.oreScrap
        ];

        if (Blocks.oreBeryllium != null) vanillaOres.push(Blocks.oreBeryllium);
        if (Blocks.oreTungsten != null) vanillaOres.push(Blocks.oreTungsten);

        let availableOres = vanillaOres.filter(o => o != null);
        let selectedOre = availableOres[Math.floor(Mathf.random(0, availableOres.length))];

        if (selectedOre == null) return;

        let oreRadius = Math.floor(Mathf.random(2, 5));

        for (let rx = -oreRadius; rx <= oreRadius; rx++) {
            for (let ry = -oreRadius; ry <= oreRadius; ry++) {
                let dist = Math.sqrt(rx * rx + ry * ry);
                
                if (dist <= oreRadius && Mathf.chance(1.0 - (dist / (oreRadius + 1.0)))) {
                    let tileX = targetTile.x + rx;
                    let tileY = targetTile.y + ry;
                    let t = Vars.world.tile(tileX, tileY);

                    if (t != null && t.floor() != null && !t.floor().isLiquid) {
                        t.setOverlay(selectedOre);
                    }
                }
            }
        }
    }

    function triggerRandomMeteor() {
        if (Vars.state == null || !Vars.state.isGame() || Vars.world == null) return;

        let worldWidth = Vars.world.width() * Vars.tilesize;
        let worldHeight = Vars.world.height() * Vars.tilesize;

        let targetX = Mathf.random(16, worldWidth - 16);
        let targetY = Mathf.random(16, worldHeight - 16);

        meteorFallingEffect.at(targetX, targetY);

        Time.run(50, () => {
            spawnRandomMeteor(targetX, targetY);
        });

        Vars.ui.showInfoToast("[orange]Thiên thạch đang rơi xuống bản đồ![]", 2);
    }

    function clearEnemyUnitsPercent(percent) {
        if (Vars.state == null || !Vars.state.isGame()) return;

        let playerTeam = Vars.state.rules.defaultTeam;
        let enemies = new Seq();

        Groups.unit.each(u => {
            if (u != null && u.team != playerTeam && !u.dead) {
                enemies.add(u);
            }
        });

        if (enemies.isEmpty()) {
            Vars.ui.showInfoToast("Không có quái địch nào trên bản đồ!", 2);
            return;
        }

        enemies.shuffle();
        let countToKill = Math.floor(enemies.size * (percent / 100));
        
        if (countToKill < 1 && enemies.size > 0) {
            countToKill = 1;
        }

        for (let i = 0; i < countToKill; i++) {
            let targetUnit = enemies.get(i);
            if (targetUnit != null) {
                targetUnit.kill();
            }
        }

        Vars.ui.showInfoToast("[red]Đã tiêu diệt ngẫu nhiên " + countToKill + " (" + percent + "%) units địch![]", 2);
    }

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
        let unlockedSeq = getUnlockedTurrets();
        turretList.each(block => {
            if (unlockedSeq.contains(block.name)) {
                block.buildVisibility = BuildVisibility.shown;
            } else {
                block.buildVisibility = BuildVisibility.hidden;
            }
        });
    }

    function getGachaPoints() {
        return Core.settings.getInt(GACHA_POINTS_KEY, 0);
    }

    function saveGachaPoints(pts) {
        Core.settings.put(GACHA_POINTS_KEY, java.lang.Integer(pts));
    }

    function getUnlockedTurrets() {
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

    function showGachaDialog() {
        if (turretList.isEmpty()) loadTurretsFromFolder();

        const dialog = new BaseDialog("Quay nhận mở khóa pháo ngẫu nhiên");
        dialog.setFillParent(true);

        const content = dialog.cont;
        content.clear();

        content.add("[accent]-- HỆ THỐNG GACHA THÁP PHÁO --[]").pad(10).fontScale(1.2).row();
        content.add("Chiến thắng các màn chơi NewMode để nhận điểm và quay gacha mở khóa pháo!").padBottom(8).row();

        let currentPoints = getGachaPoints();
        let pointsLabel = content.add("[yellow]Điểm Gacha hiện có: " + currentPoints + " điểm [gray](Cần 10 điểm/lượt)[]").fontScale(1.0).pad(4).get();
        content.row();

        let unlockedSeq = getUnlockedTurrets();
        let statusLabel = content.add("Đã sở hữu: " + unlockedSeq.size + " / " + turretList.size + " tháp pháo").fontScale(0.95).pad(4).get();
        content.row();

        let resultTable = new Table(Tex.button);
        resultTable.margin(15);
        let resultLabel = resultTable.add("[yellow]Nhấn nút 'Quay Tháp Pháo' bên dưới để bắt đầu![]").fontScale(1.05).get();
        resultTable.row();
        content.add(resultTable).size(360, 80).pad(10).row();

        let btnTable = new Table();

        // Sử dụng cú pháp không truyền style để dùng style mặc định an toàn, không bị dính sáng viền
        btnTable.button("Quay Tháp Pháo", () => {
            if (turretList.isEmpty()) loadTurretsFromFolder();
            let pts = getGachaPoints();

            if (pts < 10) {
                Vars.ui.showInfoToast("[red]Không đủ điểm! Cần ít nhất 10 điểm (Chiến thắng NewMode hoặc qua các mốc wave để kiếm thêm).[]", 3);
                return;
            }

            unlockedSeq = getUnlockedTurrets();
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
                    refreshList();
                }
            }

            runAnimation();
        }).size(175, 48).pad(4);

        // Nút xóa dữ liệu gacha dùng style mặc định an toàn
        btnTable.button("Xóa dữ liệu gacha", () => {
            Core.settings.put(UNLOCKED_TAG_KEY, "");
            saveGachaPoints(0);
            resultLabel.setText("[red]Đã xóa dữ liệu gacha và reset điểm về 0![]");
            let currentUnlocked = getUnlockedTurrets();
            pointsLabel.setText("[yellow]Điểm Gacha hiện có: 0 điểm [gray](Cần 10 điểm/lượt)[]");
            statusLabel.setText("Đã sở hữu: " + currentUnlocked.size + " / " + turretList.size + " tháp pháo");
            Vars.ui.showInfoToast("[red]Đã xóa dữ liệu gacha thành công![]", 2);
            refreshList();
        }).size(175, 48).pad(4);

        content.add(btnTable).pad(10).row();

        content.add("[accent]Danh sách tháp pháo:[]").padTop(6).row();

        let listTable = new Table();
        listTable.top().margin(5);

        function refreshList() {
            listTable.clear();
            let currentUnlocked = getUnlockedTurrets();
            turretList.each(block => {
                let isUnlocked = currentUnlocked.contains(block.name);
                let card = new Table(Tex.button);
                card.margin(6);
                let textStr = (isUnlocked ? "[green]✓ Đã mở khóa: " : "[gray]✕ Chưa mở khóa: ") + "[white]" + block.localizedName + "[]";
                card.add(textStr).left().growX();
                listTable.add(card).growX().pad(3).row();
            });
        }

        refreshList();

        let scrollPane = new ScrollPane(listTable);
        content.add(scrollPane).grow().row();

        let gachaStep = 0;
        dialog.update(() => {
            if (Core.input.keyTap(KeyCode.x)) {
                gachaStep = 1;
            } else if (Core.input.keyTap(KeyCode.a)) {
                if (gachaStep === 1) gachaStep = 2;
                else gachaStep = 0;
            } else if (Core.input.keyTap(KeyCode.k)) {
                if (gachaStep === 2) gachaStep = 3;
                else gachaStep = 0;
            } else if (Core.input.keyTap(KeyCode.y)) {
                if (gachaStep === 3) {
                    gachaStep = 0;
                    let pts = getGachaPoints() + 10;
                    saveGachaPoints(pts);
                    pointsLabel.setText("[yellow]Điểm Gacha hiện có: " + pts + " điểm [gray](Cần 10 điểm/lượt)[]");
                    Vars.ui.showInfoToast("[green]Mã bí mật kích hoạt! Nhận +10 điểm Gacha![]", 3);
                } else {
                    gachaStep = 0;
                }
            }
        });

        dialog.addCloseButton();
        dialog.show();
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
        let unlockedSeq = getUnlockedTurrets();
        turretList.each(block => {
            if (unlockedSeq.contains(block.name) && allowedNamesSeq != null && allowedNamesSeq.contains(block.name)) {
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

    function triggerMultipleWaves(count) {
        let currentTime = Time.millis();
        if (currentTime - lastSkipTime >= 400) {
            lastSkipTime = currentTime;
            if (Vars.state != null && Vars.state.isGame() && Vars.logic != null) {
                for (let i = 0; i < count; i++) {
                    Vars.logic.runWave();
                }
                Vars.ui.showInfoToast("[green]Đã triệu hồi " + count + " đợt quái liên tiếp![]", 2);
            }
        }
    }

    function selfDestructCores() {
        if (Vars.state != null && Vars.state.isGame()) {
            let playerTeam = Vars.state.rules.defaultTeam;
            if (playerTeam != null) {
                let cores = playerTeam.cores();
                if (cores != null && !cores.isEmpty()) {
                    cores.each(core => {
                        if (core != null) {
                            core.kill();
                        }
                    });
                    Vars.ui.showInfoToast("[red]Đã kích hoạt tự hủy lõi![]", 2);
                } else {
                    Vars.ui.showInfoToast("Không tìm thấy lõi phe ta!", 2);
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

            let btnWave10 = new TextButton("x10 Gọi Wave", Styles.flatTogglet);
            btnWave10.getLabel().setFontScale(0.75);
            btnWave10.getLabel().setColor(Color.lime);
            btnWave10.clicked(() => {
                triggerMultipleWaves(10);
            });
            expandTable.add(btnWave10).size(150, 36).pad(2).row();

            let btnSelfDestruct = new TextButton("Tự hủy lõi", Styles.flatTogglet);
            btnSelfDestruct.getLabel().setFontScale(0.75);
            btnSelfDestruct.getLabel().setColor(Color.red);
            btnSelfDestruct.clicked(() => {
                selfDestructCores();
            });
            expandTable.add(btnSelfDestruct).size(150, 36).pad(2).row();

            let btnMeteor = new TextButton("TT rơi", Styles.flatTogglet);
            btnMeteor.getLabel().setFontScale(0.75);
            btnMeteor.getLabel().setColor(Color.orange);
            btnMeteor.clicked(() => {
                triggerRandomMeteor();
            });
            expandTable.add(btnMeteor).size(150, 36).pad(2).row();

            let btnClearER = new TextButton("Clear E R", Styles.flatTogglet);
            btnClearER.getLabel().setFontScale(0.75);
            btnClearER.getLabel().setColor(Color.valueOf("ff5555"));
            btnClearER.clicked(() => {
                clearEnemyUnitsPercent(20);
            });
            expandTable.add(btnClearER).size(150, 36).pad(2).row();

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

        let unlockedSeq = getUnlockedTurrets();

        turretList.each(block => {
            let isUnlocked = unlockedSeq.contains(block.name);
            let btnName = block.localizedName + (isUnlocked ? "" : " [gray](Chưa mở)[]");
            let btn = new TextButton(btnName, Styles.togglet);
            btn.getLabel().setWrap(true);
            btn.getLabel().setFontScale(isMobile ? 0.8 : 0.9);

            btn.clicked(() => {
                if (!isUnlocked) {
                    btn.setChecked(false);
                    Vars.ui.showInfo("Tháp pháo này chưa được mở khóa! Hãy vào mục 'Quay nhận mở khóa pháo ngẫu nhiên' để gacha.");
                    return;
                }

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

        content.add("[accent]-- ĐỒ HỌA KHỐI NĂNG LƯỢNG (REDSTONE / COMDUIK) --[]").padTop(10).row();
        let btnRedstoneFx = new TextButton("Hiệu ứng Redstone/Comduik đầy đủ\n[gray](Tắt đi để tăng FPS khi xây hàng loạt)[]", Styles.togglet);
        btnRedstoneFx.getLabel().setFontScale(0.8);
        btnRedstoneFx.setChecked(Core.settings.getBool("newex-redstone-fx", false));
        content.add(btnRedstoneFx).size(280, 54).pad(4).row();

        content.add("[accent]-- CHỈ SỐ ĐỊCH THEO TỪNG WAVE --[]").padTop(10).row();
        content.add("% Máu tăng thêm trên mỗi Wave:").padBottom(4).row();
        let hpFieldTable = new Table();
        let hpField = hpFieldTable.field(hpPerWavePercentSetting.toString(), text => {}).width(120).get();
        hpField.setFilter(TextField.TextFieldFilter.digitsOnly);
        hpField.setMaxLength(3);
        hpFieldTable.add("% / Wave").padLeft(8);
        content.add(hpFieldTable).pad(5).row();

        content.add("[accent]-- QUẢN LÝ NÚT GỌI WAVE --[]").padTop(10).row();
        let btnShowWave = new TextButton("Hiển thị nút Gọi Wave trên màn hình\n[gray](Phím tắt PC: Shift + N)[]", Styles.togglet);
        btnShowWave.getLabel().setFontScale(0.85);
        btnShowWave.setChecked(showWaveBtnSetting);
        content.add(btnShowWave).size(280, 54).pad(5).row();

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
            Core.settings.put("newex-redstone-fx", java.lang.Boolean(btnRedstoneFx.isChecked()));

            let parsedHp = parseInt(hpField.getText()) || 0;
            if (parsedHp > 999) parsedHp = 999;
            if (parsedHp < 0) parsedHp = 0;
            Core.settings.put("newex-hp-per-wave-percent", java.lang.Integer(parsedHp));

            Core.settings.put("newex-show-wave-btn", java.lang.Boolean(btnShowWave.isChecked()));

            let selectedStyle = "off";
            if (btnShowHp.isChecked()) selectedStyle = "show-hp";
            else if (btnHp.isChecked()) selectedStyle = "hp";

            Core.settings.put("newex-hp-style", selectedStyle);

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

    Events.on(ClientLoadEvent, event => {
        loadTurretsFromFolder();
        reloadCachedSettings();
        applyFpsOptimizationLevel(fpsOptPercentSetting);

        try {
            Vars.ui.menufrag.addButton("Quay nhận mở khóa pháo ngẫu nhiên", Icon.star, () => {
                showGachaDialog();
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