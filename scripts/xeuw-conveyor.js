Events.on(ContentInitEvent, () => {
    const xeuwGate = Vars.content.block("newex-xeuw-conveyor-mk1");

    if (xeuwGate != null) {
        const teleportEffect = new Effect(20, e => {
            Draw.color(Color.sky, Color.white, e.fin());
            let rad = e.rotation * Mathf.degRad;
            let speed = 25 * e.fin();
            let px = e.x + Math.cos(rad) * speed;
            let py = e.y + Math.sin(rad) * speed;
            Fill.poly(px, py, 3, 5 * e.fout(), e.rotation);
        });

        const receiveEffect = new Effect(25, e => {
            Draw.color(Color.sky, Pal.heal, e.fin());
            let radius = 14 * e.fout();
            let angle = e.rotation + e.fin() * 180;
            let rad = angle * Mathf.degRad;
            let rx = e.x + Math.cos(rad) * radius;
            let ry = e.y + Math.sin(rad) * radius;
            Fill.poly(rx, ry, 3, 4 * e.fout(), angle);
        });

        // Hàm hỗ trợ vẽ đường vạch gạch di chuyển mượt
        const drawMovingDashLine = (x1, y1, x2, y2, color) => {
            let len = Mathf.dst(x1, y1, x2, y2);
            let dashLen = 6;
            let gapLen = 4;
            let step = dashLen + gapLen;
            let angle = Angles.angle(x1, y1, x2, y2);
            let offset = (Time.time * 1.5) % step;

            Draw.color(color);
            Lines.stroke(1.5);

            for (let d = offset; d < len; d += step) {
                let startD = d;
                let endD = Math.min(d + dashLen, len);
                if (startD < len) {
                    let sx = x1 + Angles.trnsx(angle, startD);
                    let sy = y1 + Angles.trnsy(angle, startD);
                    let ex = x1 + Angles.trnsx(angle, endD);
                    let ey = y1 + Angles.trnsy(angle, endD);
                    Lines.line(sx, sy, ex, ey);
                }
            }
            Draw.reset();
        };

        xeuwGate.buildType = () => extend(StorageBlock.StorageBuild, xeuwGate, {
            targetX: 0,
            targetY: 0,
            isTeleporting: false,
            selectingTarget: false,
            maxRange: 380, 

            created() {
                this.super$created();
                this.targetX = this.x;
                this.targetY = this.y;
            },

            buildConfiguration(table) {
                table.button(Icon.commandRally, () => {
                    this.deselect();
                    this.selectingTarget = true;
                    Vars.ui.hudfrag.showToast("Nhấp vào điểm đích trong tầm 380px!");
                }).size(40);
            },

            configured(builder, value) {
                this.super$configured(builder, value);
                if (typeof value === "number") {
                    let pos = Point2.unpack(value);
                    let destX = pos.x * Vars.tilesize;
                    let destY = pos.y * Vars.tilesize;

                    if (Mathf.dst(this.x, this.y, destX, destY) <= this.maxRange) {
                        this.targetX = destX;
                        this.targetY = destY;
                    } else {
                        Vars.ui.hudfrag.showToast("Mục tiêu vượt quá phạm vi 380px của Mk1!");
                    }
                }
            },

            write(write) {
                this.super$write(write);
                write.f(this.targetX);
                write.f(this.targetY);
            },

            read(read, revision) {
                this.super$read(read, revision);
                this.targetX = read.f();
                this.targetY = read.f();
            },

            updateTile() {
                this.super$updateTile();

                if (this.selectingTarget) {
                    if (Core.input.keyTap(KeyCode.mouseLeft)) {
                        let worldVec = Core.camera.unproject(Core.input.mouse());
                        let tile = Vars.world.tileWorld(worldVec.x, worldVec.y);
                        
                        if (tile != null) {
                            this.configure(Point2.pack(tile.x, tile.y));
                        }
                        this.selectingTarget = false;
                    }
                }

                this.isTeleporting = false;

                let dst = Mathf.dst(this.x, this.y, this.targetX, this.targetY);
                if (this.items != null && this.items.total() > 0 && dst > 1 && dst <= this.maxRange) {
                    let destTile = Vars.world.tileWorld(this.targetX, this.targetY);
                    
                    if (destTile != null && destTile.build != null) {
                        let targetBuild = destTile.build;
                        let itemToTransfer = this.items.first();

                        if (itemToTransfer != null && targetBuild.acceptItem(this, itemToTransfer)) {
                            let transferAmount = Math.min(this.items.get(itemToTransfer), Math.ceil(500 / 60));
                            
                            if (transferAmount > 0) {
                                this.items.remove(itemToTransfer, transferAmount);
                                targetBuild.handleItem(this, itemToTransfer);
                                this.isTeleporting = true;

                                let angleToTarget = Angles.angle(this.x, this.y, targetBuild.x, targetBuild.y);

                                if (Mathf.chance(0.4)) {
                                    teleportEffect.at(
                                        this.x + Mathf.range(3), 
                                        this.y + Mathf.range(3), 
                                        angleToTarget + Mathf.range(12)
                                    );
                                }

                                if (Mathf.chance(0.4)) {
                                    receiveEffect.at(
                                        targetBuild.x, 
                                        targetBuild.y, 
                                        Mathf.random(360)
                                    );
                                }
                            }
                        }
                    }
                }
            },

            draw() {
                Draw.rect(xeuwGate.region, this.x, this.y);

                if (this.isTeleporting) {
                    Draw.color(Color.sky);
                    Draw.alpha(0.6 + Math.sin(Time.time / 4) * 0.3);
                    Lines.stroke(1.5);
                    Lines.poly(this.x, this.y, 3, 5 + Math.sin(Time.time / 5) * 2, Time.time * 3);
                    Draw.reset();
                }

                if (this.selectingTarget) {
                    Draw.color(Color.sky);
                    Lines.stroke(1);
                    Lines.circle(this.x, this.y, this.maxRange);

                    let mouseWorld = Core.camera.unproject(Core.input.mouse());
                    let isWithinRange = Mathf.dst(this.x, this.y, mouseWorld.x, mouseWorld.y) <= this.maxRange;
                    let targetColor = isWithinRange ? Color.sky : Color.red;

                    // Đường vạch kẻ mượt từ khối đến vị trí chuột (vì chuyển item từ khối đến vị trí chọn)
                    drawMovingDashLine(this.x, this.y, mouseWorld.x, mouseWorld.y, targetColor);

                    let mouseTile = Vars.world.tileWorld(mouseWorld.x, mouseWorld.y);
                    if (mouseTile != null) {
                        Drawf.square(mouseTile.drawx(), mouseTile.drawy(), 4, 0, targetColor);
                    }
                }
            },

            drawConfigure() {
                this.super$drawConfigure();
                
                Draw.color(Color.sky);
                Lines.stroke(1);
                Lines.circle(this.x, this.y, this.maxRange);

                if (Mathf.dst(this.x, this.y, this.targetX, this.targetY) <= this.maxRange && (this.targetX !== this.x || this.targetY !== this.y)) {
                    // Vẽ đường vạch chạy mượt từ Khối (This) đến Đích (Target)
                    drawMovingDashLine(this.x, this.y, this.targetX, this.targetY, Color.sky);
                    Drawf.square(this.targetX, this.targetY, 4, 0, Color.sky);
                }
                Draw.reset();
            }
        });
    }
});

Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && build.name === "newex-xeuw-conveyor-mk1") {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        if (tile != null) {
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;
            Drawf.dashCircle(centerX, centerY, 380, Color.sky);
            Drawf.square(centerX, centerY, 4, 0, Color.sky);
        }
    }
});