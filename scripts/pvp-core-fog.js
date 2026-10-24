 
(function() {
    const CORE_FOG_RADIUS = 60 * Vars.tilesize;
    const FOG_FADE_DURATION_SEC = 3 * 60; 

     function getFogDurationMinutes() {
        return Core.settings.getInt("newex-fog-duration", 5);
    }

     function getCoreFogCenter(core) {
        let seedX = core.tileX();
        let seedY = core.tileY();
        let rx = (Math.sin(seedX * 12.9898 + seedY * 78.233) * 43758.5453) % 1;
        let ry = (Math.sin(seedX * 39.3468 + seedY * 11.135) * 21915.5432) % 1;
        
        let maxOffsetPixels = 10 * Vars.tilesize; 
        return {
            x: core.x + rx * maxOffsetPixels,
            y: core.y + ry * maxOffsetPixels
        };
    }

     Events.run(Trigger.draw, () => {
        if (Vars.state == null || !Vars.state.isGame() || !Vars.state.rules.pvp) return;

        let playerTeam = Vars.player != null ? Vars.player.team() : Vars.state.rules.defaultTeam;
        if (playerTeam == null) return;

        let elapsedSeconds = Vars.state.tick / 60;
        let startDisappearSec = getFogDurationMinutes() * 60;

        if (elapsedSeconds >= (startDisappearSec + FOG_FADE_DURATION_SEC)) {
            return;
        }

        let fogAlpha = 1.0;
        if (elapsedSeconds > startDisappearSec) {
            let fadeProgress = (elapsedSeconds - startDisappearSec) / FOG_FADE_DURATION_SEC;
            fogAlpha = Mathf.clamp(1.0 - fadeProgress, 0.0, 1.0);
        }

        if (fogAlpha <= 0.001) return;

        Draw.z(Layer.effect + 10);

        let allTeams = Team.all;
        for (let i = 0; i < allTeams.length; i++) {
            let t = allTeams[i];
            if (t == null || t == playerTeam || t.cores().isEmpty()) {
                continue;
            }

            let cores = t.cores();
            for (let j = 0; j < cores.size; j++) {
                let core = cores.get(j);
                if (core == null) continue;

                let center = getCoreFogCenter(core);

                if (Core.camera.bounds(Tmp.r1).overlaps(Tmp.r2.set(center.x - CORE_FOG_RADIUS, center.y - CORE_FOG_RADIUS, CORE_FOG_RADIUS * 2, CORE_FOG_RADIUS * 2))) {
                    
                     Draw.color(Color.black);
                    Draw.alpha(fogAlpha * 0.92);
                    Fill.circle(center.x, center.y, CORE_FOG_RADIUS);

                     Draw.color(Color.valueOf("111118"));
                    Draw.alpha(fogAlpha * 0.5);
                    Lines.stroke(12 * fogAlpha);
                    Lines.circle(center.x, center.y, CORE_FOG_RADIUS);

                     if (Mathf.chance(0.15)) {
                        let randomAngle = Mathf.random(360);
                        let randomDist = Mathf.random(CORE_FOG_RADIUS * 0.8);
                        let px = center.x + Angles.trnsx(randomAngle, randomDist);
                        let py = center.y + Angles.trnsy(randomAngle, randomDist);

                        Draw.color(Color.darkGray);
                        Draw.alpha(fogAlpha * 0.3);
                        Fill.circle(px, py, Mathf.random(8, 20));
                    }
                }
            }
        }

        Draw.reset();
    });

     Events.on(WorldLoadEvent, event => {
        if (Vars.state != null && Vars.state.isGame() && Vars.state.rules.pvp) {
            let dur = getFogDurationMinutes();
            Time.run(120, () => {
                Vars.ui.showInfoToast(
                    Core.settings.getString("locale").startsWith("en") 
                        ? "[accent]PvP Mode: Core Fog active! Starts fading after " + dur + " min(s).[]" 
                        : "[accent]Chế độ PvP: Sương mù Lõi đã bật! Bắt đầu tan sau " + dur + " phút.[]",
                    5
                );
            });
        }
    });

    let notifiedFade = false;
    Events.on(WorldLoadEvent, event => { notifiedFade = false; });

    Events.run(Trigger.update, () => {
        if (Vars.state != null && Vars.state.isGame() && Vars.state.rules.pvp) {
            let elapsedSeconds = Vars.state.tick / 60;
            let startDisappearSec = getFogDurationMinutes() * 60;

            if (elapsedSeconds >= startDisappearSec && !notifiedFade) {
                notifiedFade = true;
                Vars.ui.showInfoToast(
                    Core.settings.getString("locale").startsWith("en") 
                        ? "[orange]Enemy Core Fog is starting to dissipate...[]" 
                        : "[orange]Sương mù bảo vệ Lõi đối phương bắt đầu tan rã...[]",
                    5
                );
            }
        }
    });

     function injectFogSettingsUI(content, isEn) {
        content.add(isEn ? "[accent]-- PVP CORE FOG SETTINGS --[]" : "[accent]-- CÀI ĐẶT SƯƠNG MÙ LÕI PVP --[]").padTop(10).row();
        content.add(isEn ? "Fog active duration before fading (Minutes):" : "Thời gian sương mù trước khi bắt đầu tan (Phút):").padBottom(4).row();
        
        let currentFogDur = getFogDurationMinutes();
        let fogDurLabel = content.add(currentFogDur + " " + (isEn ? "min(s)" : "phút")).fontScale(1.2).get();
        content.row();

        let fogSlider = content.slider(1, 15, 1, currentFogDur, value => {
            let val = Math.floor(value);
            fogDurLabel.setText(val + " " + (isEn ? "min(s)" : "phút"));
        }).width(240).pad(8).get();
        content.row();

         return {
            save: function() {
                let fogVal = Math.floor(fogSlider.getValue());
                Core.settings.put("newex-fog-duration", java.lang.Integer(fogVal));
            }
        };
    }

    module.exports = {
        injectFogSettingsUI: injectFogSettingsUI
    };
})();