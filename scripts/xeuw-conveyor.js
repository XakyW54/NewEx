Events.on(ContentInitEvent, () => {
    const xeuwGate = Vars.content.block("newex-xeuw-conveyor-mk1");

    if (xeuwGate != null) {
        // Effect 1: Hạt tam giác 5px bay từ Cổng gửi -> Cổng nhận
        const teleportEffect = new Effect(20, e => {
            Draw.color(Color.sky, Color.white, e.fin());
            
            // Lấy góc quay truyền từ rotation
            let rad = e.rotation * Mathf.degRad;
            let speed = 25 * e.fin();
            
            // Tính vị trí di chuyển chuẩn xác
            let px = e.x + Math.cos(rad) * speed;
            let py = e.y + Math.sin(rad) * speed;
            
            // Vẽ tam giác 3 cạnh, bán kính 5px thu nhỏ dần
            Fill.poly(px, py, 3, 5 * e.fout(), e.rotation);
        });

        // Effect 2: Hạt tam giác bị hút vào Cổng nhận
        const receiveEffect = new Effect(25, e => {
            Draw.color(Color.sky, Pal.heal, e.fin());
            
            // Hạt xuất phát từ ngoài thu nhỏ dần vào tâm
            let radius = 14 * e.fout();
            let angle = e.rotation + e.fin() * 180;
            let rad = angle * Mathf.degRad;
            
            let rx = e.x + Math.cos(rad) * radius;
            let ry = e.y + Math.sin(rad) * radius;

            // Vẽ tam giác nhỏ bị hút vào tâm
            Fill.poly(rx, ry, 3, 4 * e.fout(), angle);
        });

        xeuwGate.buildType = () => extend(StorageBlock.StorageBuild, xeuwGate, {
            targetX: 0,
            targetY: 0,
            isTeleporting: false,
            selectingTarget: false,
            maxRange: 380, // Phạm vi tối đa 380px (~47.5 ô)

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

                    // Kiểm tra phạm vi 380px
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

                // Lắng nghe chọn điểm
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

                // Kiểm tra điều kiện dịch chuyển đồ trong tầm 380px
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

                                // 1. Bắn các hạt tam giác 5px bay về phía cổng nhận (dùng rotation để truyền góc)
                                if (Mathf.chance(0.4)) {
                                    teleportEffect.at(
                                        this.x + Mathf.range(3), 
                                        this.y + Mathf.range(3), 
                                        angleToTarget + Mathf.range(12)
                                    );
                                }

                                // 2. Hiệu ứng hạt tam giác bị hút vào ở cổng nhận
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

                // Dải sáng hạt tam giác xoay ở tâm khi đang hoạt động
                if (this.isTeleporting) {
                    Draw.color(Color.sky);
                    Draw.alpha(0.6 + Math.sin(Time.time / 4) * 0.3);
                    Lines.stroke(1.5);
                    Lines.poly(this.x, this.y, 3, 5 + Math.sin(Time.time / 5) * 2, Time.time * 3);
                    Draw.reset();
                }
            },

            drawConfigure() {
                this.super$drawConfigure();
                
                // Vẽ vòng tròn phạm vi 380px khi bấm chọn
                Draw.color(Color.sky);
                Lines.stroke(1);
                Lines.circle(this.x, this.y, this.maxRange);

                // Vẽ đường nối nét đứt nếu trong phạm vi
                if (Mathf.dst(this.x, this.y, this.targetX, this.targetY) <= this.maxRange && (this.targetX !== this.x || this.targetY !== this.y)) {
                    Lines.dashLine(this.x, this.y, this.targetX, this.targetY, Math.floor(Mathf.dst(this.x, this.y, this.targetX, this.targetY) / 8));
                }
                Draw.reset();
            }
        });
    }
});

// HIỂN THỊ PHẠM VI KHI CẦM KHỐI TRÊN TAY
Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && build.name === "newex-xeuw-conveyor-mk1") {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        if (tile != null) {
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;
            Drawf.dashCircle(centerX, centerY, 380, Color.sky);
        }
    }
});