Events.on(ContentInitEvent, () => {
    const pinfyr = Vars.content.block("newex-pinfyr");

    if (pinfyr != null) {
        pinfyr.update = true;

        pinfyr.buildType = prov(() => {
            return extend(Building, {
                updateTile() {
                    this.super$updateTile();

 
                    if (this.power && this.power.status > 0) {
                        let capacity = this.block.consPower.capacity;
                        let currentStored = this.power.status * capacity;

                        for (let i = 0; i < 4; i++) {
                            if (currentStored <= 0) break;

                            let target = this.nearby(i);
                            if (target != null && target.team === this.team && target.power != null && target.block.consPower != null) {
                               
                                if (target.block === pinfyr) continue;

                                let targetCap = target.block.consPower.capacity;
                                if (targetCap > 0) {
                                    let targetCurrent = target.power.status * targetCap;
                                    let needed = targetCap - targetCurrent;

                                    if (needed > 0) {
                                        let transfer = Math.min(currentStored, Math.min(needed, 800 / 60));
                                        currentStored -= transfer;
                                        target.power.status = Math.min(1.0, (targetCurrent + transfer) / targetCap);
                                    }
                                }
                            }
                        }

                        this.power.status = currentStored / capacity;
                    }
                }
            });
        });
    }
});