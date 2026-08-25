Events.on(ContentInitEvent, () => {
    const wuexConveyor = Vars.content.block("newex-wuex-conveyor-mk1");

    if (wuexConveyor != null) {
 
        const teleportEffect = new Effect(20, e => {
            Draw.color(Pal.heal, Color.white, e.fin());
            let rad = e.rotation * Mathf.degRad;
            let speed = 25 * e.fin();
            let px = e.x + Math.cos(rad) * speed;
            let py = e.y + Math.sin(rad) * speed;
            Fill.poly(px, py, 3, 5 * e.fout(), e.rotation);
        });

 
        const receiveEffect = new Effect(25, e => {
            Draw.color(Pal.heal, Color.green, e.fin());
            let radius = 14 * e.fout();
            let angle = e.rotation + e.fin() * 180;
            let rad = angle * Mathf.degRad;
            let rx = e.x + Math.cos(rad) * radius;
            let ry = e.y + Math.sin(rad) * radius;
            Fill.poly(rx, ry, 3, 4 * e.fout(), angle);
        });

        wuexConveyor.buildType = () => extend(StorageBlock.StorageBuild, wuexConveyor, {
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
                    Vars.ui.hudfrag.showToast("Nhấp vào nguồn lấy item trong tầm 380px!");
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
                        Vars.ui.hudfrag.showToast("Mục tiêu vượt quá phạm vi 380px!");
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
                if (dst > 1 && dst <= this.maxRange) {
                    let sourceTile = Vars.world.tileWorld(this.targetX, this.targetY);
                    
                    if (sourceTile != null && sourceTile.build != null) {
                        let sourceBuild = sourceTile.build;

                        if (sourceBuild.items != null && sourceBuild.items.total() > 0) {
                            let itemToPull = sourceBuild.items.first();

                            if (itemToPull != null && this.acceptItem(sourceBuild, itemToPull) && this.items.get(itemToPull) < this.getMaximumAccepted(itemToPull)) {
                                sourceBuild.items.remove(itemToPull, 1);
                                this.handleItem(sourceBuild, itemToPull);
                                this.isTeleporting = true;

                                let angleToThis = Angles.angle(sourceBuild.x, sourceBuild.y, this.x, this.y);

                                if (Mathf.chance(0.3)) {
                                    teleportEffect.at(
                                        sourceBuild.x + Mathf.range(3), 
                                        sourceBuild.y + Mathf.range(3), 
                                        angleToThis + Mathf.range(12)
                                    );
                                }

                                if (Mathf.chance(0.3)) {
                                    receiveEffect.at(this.x, this.y, Mathf.random(360));
                                }
                            }
                        }
                    }
                }

            
                if (this.items != null && this.items.total() > 0) {
                    this.dump();
                }
            },

            draw() {
                this.super$draw();

                if (this.isTeleporting) {
                    Draw.color(Pal.heal);
                    Draw.alpha(0.6 + Math.sin(Time.time / 4) * 0.3);
                    Lines.stroke(1.5);
                    Lines.poly(this.x, this.y, 3, 5 + Math.sin(Time.time / 5) * 2, Time.time * 3);
                    Draw.reset();
                }
            },

            drawConfigure() {
                this.super$drawConfigure();
                
                Draw.color(Pal.heal);
                Lines.stroke(1);
                Lines.circle(this.x, this.y, this.maxRange);

                if (Mathf.dst(this.x, this.y, this.targetX, this.targetY) <= this.maxRange && (this.targetX !== this.x || this.targetY !== this.y)) {
                    Drawf.dashLine(Pal.heal, this.x, this.y, this.targetX, this.targetY);
                }
                Draw.reset();
            }
        });
    }
});

 
Events.run(Trigger.draw, () => {
    let build = Vars.control.input.block;
    if (build != null && build.name === "newex-wuex-conveyor-mk1") {
        let tile = Vars.world.tileWorld(Core.input.mouseWorldX(), Core.input.mouseWorldY());
        if (tile != null) {
            let centerX = tile.drawx() + build.offset;
            let centerY = tile.drawy() + build.offset;
            Drawf.dashCircle(centerX, centerY, 380, Pal.heal);
        }
    }
});