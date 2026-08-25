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
            },

            drawConfigure() {
                this.super$drawConfigure();
                
                 Draw.color(Color.sky);
                Lines.stroke(1);
                Lines.circle(this.x, this.y, this.maxRange);

                 if (Mathf.dst(this.x, this.y, this.targetX, this.targetY) <= this.maxRange && (this.targetX !== this.x || this.targetY !== this.y)) {
                    Lines.dashLine(this.x, this.y, this.targetX, this.targetY, Math.floor(Mathf.dst(this.x, this.y, this.targetX, this.targetY) / 8));
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
        }
    }
});