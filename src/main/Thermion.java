package main;

import arc.Core;
import arc.Events;
import arc.audio.Sound;
import arc.func.Cons;
import arc.func.Prov;
import arc.graphics.Color;
import arc.graphics.g2d.Draw;
import arc.graphics.g2d.Fill;
import arc.graphics.g2d.Lines;
import arc.math.Angles;
import arc.math.Mathf;
import arc.scene.ui.Label;
import arc.scene.style.BaseDrawable;
import arc.scene.style.Drawable;
import arc.scene.ui.TextButton;
import arc.scene.ui.TextButton.TextButtonStyle;
import arc.scene.ui.layout.Cell;
import arc.scene.ui.layout.Scl;
import arc.scene.ui.layout.Table;
import arc.struct.IntSeq;
import arc.struct.Seq;
import arc.util.Strings;
import arc.util.Time;
import arc.util.io.Reads;
import arc.util.io.Writes;
import mindustry.content.Items;
import mindustry.content.Liquids;
import mindustry.content.StatusEffects;
import mindustry.content.UnitTypes;
import mindustry.entities.Effect;
import mindustry.entities.Puddles;
import mindustry.entities.Units;
import mindustry.entities.units.AIController;
import mindustry.entities.bullet.BasicBulletType;
import mindustry.entities.bullet.BulletType;
import mindustry.entities.bullet.LightningBulletType;
import mindustry.game.EventType.Trigger;
import mindustry.game.Gamemode;
import mindustry.game.Team;
import mindustry.gen.Building;
import mindustry.gen.Bullet;
import mindustry.gen.Call;
import mindustry.gen.Groups;
import mindustry.gen.Hitboxc;
import mindustry.gen.Sounds;
import mindustry.gen.Teamc;
import mindustry.gen.Tex;
import mindustry.gen.Unit;
import mindustry.graphics.Layer;
import mindustry.graphics.Pal;
import mindustry.type.ItemStack;
import mindustry.type.StatusEffect;
import mindustry.type.UnitType;
import mindustry.type.Weapon;
import mindustry.ui.Bar;
import mindustry.ui.Styles;
import mindustry.ui.dialogs.BaseDialog;
import mindustry.world.Block;
import mindustry.world.Tile;

import static mindustry.Vars.*;

/**
 * Thermion — khối 5x5, cấp 1–5, ba dạng Yellow / Blue / Purple (+ Death).
 *
 * Quy ước đơn vị:
 *  - Điện: đơn vị / giây (= giá trị mỗi tick × 60).
 *  - affectRadius: tính bằng TILE; đổi sang world unit bằng affectRadiusWorld().
 *  - Thời gian: hằng số *_TICKS là tick (60 tick = 1 giây).
 *  - Mọi logic gây hiệu ứng lên thế giới chỉ chạy ở server / singleplayer (net.client() thì bỏ qua),
 *    trạng thái được đồng bộ qua write()/read() (sync = true).
 */
public class Thermion extends Block{

    // Form (dùng int thay enum để dễ convert sang JS)
    public static final int YELLOW = 0, BLUE = 1, PURPLE = 2, DEATH = 3;
    public static final int MAX_LEVEL = 5;

    // Mã config (gửi qua configure(int))
    public static final int CFG_ACTIVE = 10, CFG_UPGRADE = 20; // 0..2 = chuyển sang dạng tương ứng

    // ---------------------------------------------------------------- bảng số liệu (index = level - 1)
    static final float[] FORM_CHANGE_COOLDOWN_SEC = {120f, 105f, 90f, 75f, 60f};
    static final float[] FORM_CHANGE_TIME_SEC     = {5f, 4.5f, 4f, 3.5f, 3f};
    static final float[] HP_BONUS_PER_LEVEL       = {75f, 50f, 20f}; // theo form: Yellow, Blue, Purple (% mỗi cấp)

    // Yellow
    static final float[] SLOW_PERCENT    = {10f, 15f, 20f, 30f, 40f};
    static final float[] SPHERE_CHARGE   = {0f, 120f, 105f, 105f, 90f};
    static final float[] SPHERE_DAMAGE   = {0f, 300f, 500f, 700f, 1100f};
    /** Số quả cầu điện tối đa mỗi lượt nạp (level 1: chưa mở khóa). */
    static final float[] SPHERE_MAX      = {0f, 10f, 15f, 30f, 50f};
    /** Máu khiên = % dung tích dự trữ điện (pin) của lưới. */
    static final float[] SHIELD_PERCENT  = {0f, 0f, 50f, 75f, 100f};
    static final float[] SHIELD_COOLDOWN = {0f, 0f, 1200f, 900f, 600f};
    static final float[] MAGNETIC_PCT    = {0f, 0f, 0f, 1.5f, 2f};
    static final float[] BLADE_COUNT     = {0f, 0f, 0f, 1f, 2f};
    static final float[] BLADE_DAMAGE    = {0f, 0f, 0f, 400f, 500f};
    static final float[] BLADE_CREATE    = {0f, 0f, 0f, 1800f, 1200f};
    static final float EMP_DURATION = 5f * 60f, EMP_COOLDOWN = 120f * 60f;

    // Blue
    static final float[] BLASTER_CHANCE = {15f, 25f, 35f, 45f, 60f};
    static final float[] BLASTER_DAMAGE = {300f, 350f, 450f, 600f, 900f};
    static final float[] METEOR_CHANCE  = {0f, 5f, 10f, 15f, 20f};
    static final float[] METEOR_DAMAGE  = {0f, 1f, 1f, 2f, 2f};      // % máu tối đa
    static final float[] LASER_CHANCE   = {0f, 0f, 2f, 5f, 10f};
    static final float[] LASER_DAMAGE   = {0f, 0f, 250f, 400f, 700f}; // mỗi giây
    static final float[] LASER_TIME     = {0f, 0f, 2f, 2.5f, 3f};     // giây
    static final float[] RCT_TIME       = {0f, 0f, 0f, 900f, 600f};   // tick
    static final float[] RCT_AMOUNT     = {0f, 0f, 0f, 50f, 100f};    // % máu tối đa
    /** Thời gian gồng Asteroid (1 phút). */
    static final float ASTEROID_CHARGE_TICKS = 60f * 60f;
    /** Các pha của Asteroid. */
    static final int AST_NONE = 0, AST_CHARGE = 1, AST_FALL = 2; // FALL = tiểu hành tinh đang bay vào giữa bản đồ
    static final float SKY_HEIGHT = 1400f;         // chiều cao tia từ trời (world unit)
    static final float METEOR_FALL_TICKS = 27f;    // thời gian từ lúc thiên thạch xuất hiện tới lúc chạm đất
    static final float ASTEROID_TRAVEL_TICKS = 360f;  // thời gian tiểu hành tinh bay tới giữa bản đồ
    static final float ASTEROID_WAVE_TICKS = 150f;    // thời gian lan của sóng xung kích khi chạm
    static final float ASTEROID_BODY_TILES = 100f;    // bán kính tiểu hành tinh
    static final int   ASTEROID_CRATERS = 32;         // số hố thiên thạch trên thân tiểu hành tinh
    static final float ASTEROID_FLASH_TICKS = 300f;   // flashbang: 5 giây (giữ sáng rồi tan từ từ)
    static final float ASTEROID_FLASH_HOLD = 0.1f;    // phần đầu (tỉ lệ thời gian) giữ trắng xoá hoàn toàn
    static final float ASTEROID_QUAKE_TICKS = 3600f;  // thời gian rung màn hình (60 giây, gấp đôi trước đây)
    static final float ASTEROID_SHAKE_POWER = 60f;    // cường độ rung tối đa (Renderer giới hạn ở 100)
    static final float MUSHROOM_TICKS = 2160f;        // thời gian đám mây hình nấm (chậm hơn 4 lần so với 540 tick cũ)
    static final float MUSHROOM_TILES = 64f;          // bán kính mũ nấm (tile)
    static final float ASTEROID_COOLDOWN = 300f * 60f; // hồi chiêu Asteroid: 5 phút
    static final float DEATH_TICKS = 10f * 60f * 60f;  // sau Asteroid: ở dạng Death 10 phút rồi tự trở về dạng Blue
    static final float ORB_BULLET_RADIUS = 12f;        // bán kính vẽ đạn orb (world unit)
    static final float[] METEOR_FLAT = {0f, 50f, 75f, 125f, 250f}; // sát thương số mỗi quả
    static final float METEOR_RADIUS_TILES = 4f;       // gấp đôi trước đây (2 tile)
    static final int METEOR_PUDDLES = 3;               // số vũng mỗi quả (gấp ba)
    static final float METEOR_SLAG_CHANCE = 0.75f;     // 75% quả tạo vũng xỉ, 25% còn lại tạo vũng dầu
    static final float[] BLASTER_SPLASH_TILES = {2f, 2f, 2.5f, 2.5f, 3f}; // bán kính lan sát thương (tile)
    static final float BLASTER_SPLASH_FRAC = 1f / 3f;  // sát thương lan = 1/3 sát thương Blaster
    static final float LASER_SPLASH_FRAC = 0.5f;       // DeathLaser: kẻ địch khác trong phạm vi nhận 1/2 sát thương của mục tiêu
    static final float SHIELD_START_FRACTION = 0.10f;  // khiên mới xuất hiện (hoặc hồi sau khi vỡ) chỉ có 10% máu tối đa
    /** Nội tại dạng Yellow: sát thương cộng thêm = % máu tối đa của mục tiêu. */
    static final float BONUS_PER_MILLION = 0.005f;     // mỗi 1 triệu sức chứa điện +0.5%
    static final float BONUS_CAPACITY_CAP = 10000000f; // chỉ tính sức chứa tới 10 triệu
    static final float BONUS_BLADE_SCALE = 0.5f;       // DualBlade chỉ hưởng một nửa
    static final float SHIELD_REGEN_TICKS = 120f;      // khiên tự sửa 2 giây một lần
    static final float SHIELD_REGEN_FRACTION = 0.10f;  // mỗi lần rút tối đa 10% sức chứa tối đa của lưới
    static final float SHIELD_HIT_SOUND_GAP = 4f;      // giãn cách tối thiểu giữa hai tiếng đạn trúng khiên (tick)
    static final float DEATH_LASER_LOOP_TICKS = 46f;   // DeathLaserLoop.ogg dài 0,78 s: phát lại liên tục khi tia còn bắn
    static final float SPHERE_SPAWN_RADIUS_TILES = 15f; // quả cầu điện xuất hiện ngẫu nhiên trong vòng tròn này
    static final float ORB_Z = Layer.flyingUnit + 1f;  // layer của orb (đang nạp và đang bay): trên cả đơn vị bay
    static final float SHIELD_PUSH_SPEED = 2.5f;       // tốc độ (px/tick) khiên đẩy đơn vị địch hướng ra ngoài
    static final float BLADE_SPEED = 7f;               // tốc độ bay của lưỡi cưa (world unit / tick)
    static final float BLADE_RADIUS = 20f;             // bán kính vẽ lưỡi cưa (world unit)
    static final float BLADE_Z = Layer.flyingUnitLow;  // layer lưỡi cưa: trên block và unit mặt đất, dưới unit bay
    static final float BLASTER_INTERVAL = 15f, BLASTER_FALL_TICKS = 10f;
    /** Limitless: bán kính = 1/3 phạm vi ảnh hưởng; bullet không cùng team mất 5% (cấp 5: 10%) tốc độ ban đầu mỗi giây. */
    static final float LIMITLESS_RADIUS_DIV = 3f;
    static final float[] LIMITLESS_DECAY_PCT = {0f, 0f, 0f, 5f, 10f};
    static final float SHAPE_DELAY_TICKS = 120f;       // Shapeshifter: 2 giây
    static final float RANGE_BAR_REF = 50f;            // bar Affect Radius đầy ở mức này (tile)
    /** Hệ số alpha áp lên mọi lớp aura khi đang chuyển dạng (1 = bình thường). */
    static float auraAlpha = 1f;

    // Purple
    static final float[] ILLUSION_TIME     = {5f, 4.5f, 4f, 3.5f, 3f};
    static final float[] ILLUSION_CHANCE   = {5f, 10f, 15f, 20f, 25f};
    static final float[] ILLUSION_DURATION = {1f, 1.5f, 2f, 2.5f, 3f};
    static final float[] DRONE_TIME        = {0f, 10f, 8.5f, 7f, 5f};
    static final float[] SHAPE_TIME   = {0f, 0f, 10f, 9f, 8f};
    static final float[] SHAPE_CHANCE = {0f, 0f, 5f, 10f, 15f};
    static final float SHAPE_SCAN_TILES = 10f;
    static final float[] MIND_TIME   = {0f, 0f, 0f, 15f, 10f};
    static final float[] MIND_CHANCE = {0f, 0f, 0f, 10f, 15f};
    static final float MEGA_HYPNOSIS_COOLDOWN = 180f * 60f;

    // Chỉ số timer dùng chung
    static final int T_FIELD = 0, T_BLADE = 1, T_RCT = 2, T_ILLUSION = 3, T_DRONE = 4, T_SHAPE = 5, T_MIND = 6, T_ASTEROID = 7, T_UPGRADE = 8;

    static final Color YELLOW_COLOR = Color.gold,
                       BLUE_COLOR   = Color.sky,
                       PURPLE_COLOR = Color.purple,
                       GRAY_COLOR   = Color.gray;

    // màu tiểu hành tinh / hố thiên thạch / đám mây nấm
    static final Color ASTEROID_BODY_COLOR  = Color.valueOf("3a2f2a"),
                       ASTEROID_LIGHT_COLOR = Color.valueOf("7a6858"),
                       CRATER_RIM_COLOR     = Color.valueOf("6b5a4d"),
                       CRATER_PIT_COLOR     = Color.valueOf("231b18"),
                       CRATER_DEEP_COLOR    = Color.valueOf("120d0b"),
                       SMOKE_COLOR          = Color.valueOf("3b322d"),
                       ASH_COLOR            = Color.valueOf("6a5c52");

    /** Đã đăng ký hook vẽ lưỡi cưa (chỉ đăng ký một lần cho mọi khối Thermion). */
    static boolean bladeHookAdded = false;

    // ---------------------------------------------------------------- content phụ trợ
    public StatusEffect[] slowEffects = new StatusEffect[MAX_LEVEL]; // ElectrifiedField theo cấp
    public StatusEffect weakened;                                      // DeathLaser: -50% hoạt động
    public BulletType[] orbBullets = new BulletType[MAX_LEVEL];       // ElectricSphere theo cấp
    /** Drone thường của Purple (dựng trong constructor; null thì dùng UnitTypes.flare). */
    public UnitType droneType = null;
    /** Drone con (sinh ra khi drone chết). */
    /** Drone V2 (từ level 4). */
    public UnitType droneV2Type = null;

    public Thermion(String name){
        super(name);
        loadAssetSounds();
        size = 5;
        health = 5000;
        solid = true;
        update = true;
        sync = true;
        configurable = true;
        hasPower = true;
        outputsPower = false;
        consumesPower = false;

        for(int i = 0; i < MAX_LEVEL; i++){
            final float mult = 1f - SLOW_PERCENT[i] / 100f;
            slowEffects[i] = new StatusEffect(name + "-slow-" + (i + 1)){{
                speedMultiplier = mult;
                show = false;
                color = YELLOW_COLOR;
            }};

            final float dmg = SPHERE_DAMAGE[i];
            if(dmg > 0) {
                orbBullets[i] = new BasicBulletType(6f, dmg){{
                    width = ORB_BULLET_RADIUS * 2f;
                    height = ORB_BULLET_RADIUS * 2f;
                    hitSize = ORB_BULLET_RADIUS * 1.8f;
                    lifetime = 80f; // được kéo dài theo khoảng cách khi bắn (lifetimeScl)
                    homingPower = 0.2f;
                    homingRange = tilesize * 400f;
                    backColor = YELLOW_COLOR;
                    frontColor = Color.white;
                    trailColor = YELLOW_COLOR;
                    trailLength = 24;
                    trailWidth = ORB_BULLET_RADIUS * 0.6f;
                    intervalBullet = new LightningBulletType(){{
                        this.damage = dmg / 10;
                        this.lightningDamage = dmg / 10;
                        this.lightningColor = YELLOW_COLOR;
                        this.lightningLength = 7;
                    }};
                    bulletInterval = 6f;
                    intervalBullets = 1;
                    intervalRandomSpread = 360f;
                    collidesGround = true;
                    collidesAir = true;
                    hitSound = sndOrbHit(); // OrbHitSound.ogg
                }

                /** Nội tại: orb trúng đơn vị gây thêm % máu tối đa của nó (giáp vẫn tính). */
                @Override
                public void hitEntity(Bullet b, Hitboxc entity, float health){
                    super.hitEntity(b, entity, health);
                    if(net.client() || !(entity instanceof Unit)) return;
                    Unit u = (Unit)entity;
                    if(u.team == b.team || !u.isValid()) return;
                    float f = bonusFraction(nearestYellowCapacity(b.team, b.x, b.y));
                    if(f > 0f) u.damage(u.maxHealth * f);
                }

                /** Nội tại: orb trúng công trình cũng gây thêm % máu tối đa của nó. */
                @Override
                public void hitTile(Bullet b, Building build, float hx, float hy, float initialHealth, boolean direct){
                    super.hitTile(b, build, hx, hy, initialHealth, direct);
                    if(net.client() || build == null || build.team == b.team || !build.isValid()) return;
                    float f = bonusFraction(nearestYellowCapacity(b.team, b.x, b.y));
                    if(f > 0f) build.damage(build.maxHealth * f);
                }

                @Override
                public void draw(Bullet b){
                    Draw.z(ORB_Z); // nâng layer cho cả vệt và quả cầu
                    drawTrail(b);
                    drawOrb(b.x, b.y, ORB_BULLET_RADIUS, 1f); // cùng kiểu với orb đang nạp
                }};
            }
        }

        weakened = new StatusEffect(name + "-weakened"){{
            speedMultiplier = 0.5f;
            reloadMultiplier = 0.5f;
            show = false;
            color = BLUE_COLOR;
        }};

        droneType = createDroneType(name + "-drone");
        droneV2Type = createDroneV2Type(name + "-drone-v2");

        config(Integer.class, (ThermionBuild b, Integer v) -> b.handleConfig(v));

        // Lưỡi cưa được vẽ trong hook toàn cục, nên không bị ẩn khi khối Thermion nằm ngoài màn hình
        if(!bladeHookAdded){
            bladeHookAdded = true;
            Events.run(Trigger.draw, Thermion::drawAllBlades);
        }
    }

    // ---------------------------------------------------------------- drone của Purple
    // Drone thường (level 2-3): nhẹ, chỉ sát thương số.
    static final float DRONE_HEALTH = 200f;
    static final float DRONE_BULLET_DAMAGE = 25f;
    // Drone V2 (level 4+): chỉ số cũ của drone + hai khẩu laser xuyên.
    static final int DRONE_V2_LEVEL = 4;
    static final float DRONE_V2_HEALTH = 800f;
    static final float DRONE_V2_BULLET_DAMAGE = 90f;
    static final float DRONE_V2_BULLET_PCT = 0.01f;   // súng máy: thêm ngẫu nhiên 0..1% máu tối đa của mục tiêu
    static final float DRONE_LASER_DAMAGE = 400f;
    static final float DRONE_LASER_PCT = 0.15f;       // laser: thêm ngẫu nhiên 0..15% máu tối đa của mục tiêu
    static final float DRONE_LASER_RELOAD = 60f;
    static final int DRONE_LASER_PIERCE = 7;          // xuyên tối đa 7 mục tiêu
    static final float DRONE_LASER_SIDE_X = 7f;       // vị trí hai khẩu laser ở hai bên
    // chung
    static final float DRONE_RELOAD = 50f;
    static final int DRONE_SHOTS = 12;
    static final float DRONE_INACCURACY = 4f;
    static final float DRONE_SHOT_DELAY = 2f;         // 2 tick giữa mỗi viên trong một loạt

    /** Đạn drone: sát thương số + (nếu maxPct > 0) thêm ngẫu nhiên 0..maxPct máu tối đa của mục tiêu. */
    static BulletType createDroneBullet(float dmg, final float maxPct, float spd, float life, float w, float h, final int pierces){
        return new BasicBulletType(spd, dmg){{
            width = w;
            height = h;
            lifetime = life;
            backColor = PURPLE_COLOR;
            frontColor = Color.white;
            collidesAir = true;
            collidesGround = true;
            if(pierces > 1){
                pierce = true;
                pierceBuilding = true;
                pierceCap = pierces;
            }
        }

        @Override
        public void hitEntity(Bullet b, Hitboxc entity, float health){
            super.hitEntity(b, entity, health);
            if(maxPct <= 0f || net.client() || !(entity instanceof Unit)) return;
            Unit u = (Unit)entity;
            if(u.team == b.team || !u.isValid()) return;
            u.damage(u.maxHealth * Mathf.random(maxPct));
        }

        @Override
        public void hitTile(Bullet b, Building build, float hx, float hy, float initialHealth, boolean direct){
            super.hitTile(b, build, hx, hy, initialHealth, direct);
            if(maxPct <= 0f || net.client() || build == null || build.team == b.team || !build.isValid()) return;
            build.damage(build.maxHealth * Mathf.random(maxPct));
        }};
    }

    /** Thân drone dùng chung: flying, tốc độ ngang flare, mục tiêu do DroneAI chọn. */
    static void setupDroneBody(UnitType t, UnitType fl, float hp){
        t.constructor = fl.constructor;
        t.flying = true;
        t.health = hp;
        t.speed = fl.speed;
        t.accel = fl.accel;
        t.drag = fl.drag;
        t.rotateSpeed = fl.rotateSpeed;
        t.hitSize = fl.hitSize;
        t.engineOffset = fl.engineOffset;
        t.engineSize = fl.engineSize;
        t.lowAltitude = fl.lowAltitude;
        t.circleTarget = false;
        t.singleTarget = true; // mọi vũ khí cùng nhắm mục tiêu chính do DroneAI chọn
        t.itemCapacity = 0;
    }

    /** Súng máy: loạt 12 viên, mỗi viên cách nhau 2 tick, lệch 4 độ. */
    static Weapon droneGun(final BulletType shot){
        return new Weapon(){{
            reload = DRONE_RELOAD;
            x = 0f;
            y = 0f;
            top = false;
            mirror = false;
            inaccuracy = DRONE_INACCURACY;
            shoot.shots = DRONE_SHOTS;
            shoot.shotDelay = DRONE_SHOT_DELAY;
            shootSound = sndMachineGun(); // MachineGunShootSound.ogg
            bullet = shot;
        }};
    }

    /** Drone thường: 200 máu, tốc độ ngang flare, súng máy 25 sát thương/viên (không có sát thương %). */
    static UnitType createDroneType(String droneName){
        final UnitType fl = UnitTypes.flare;
        if(fl == null) return null;
        UnitType t = new UnitType(droneName);
        setupDroneBody(t, fl, DRONE_HEALTH);
        t.weapons.add(droneGun(createDroneBullet(DRONE_BULLET_DAMAGE, 0f, 4f, 45f, 6f, 10f, 1)));
        return t;
    }

    /** Drone V2: 800 máu + súng máy 90 (+0..1% máu tối đa) + hai laser hai bên bắn luân phiên (400 +0..15%, xuyên 7). */
    static UnitType createDroneV2Type(String droneName){
        final UnitType fl = UnitTypes.flare;
        if(fl == null) return null;
        UnitType t = new UnitType(droneName);
        setupDroneBody(t, fl, DRONE_V2_HEALTH);
        t.weapons.add(droneGun(createDroneBullet(DRONE_V2_BULLET_DAMAGE, DRONE_V2_BULLET_PCT, 4f, 45f, 6f, 10f, 1)));
        final BulletType laser = createDroneBullet(DRONE_LASER_DAMAGE, DRONE_LASER_PCT, 7f, 40f, 8f, 28f, DRONE_LASER_PIERCE); // tầm 280 > súng máy 180
        t.weapons.add(new Weapon(){{
            reload = DRONE_LASER_RELOAD;
            x = DRONE_LASER_SIDE_X;
            y = 0f;
            top = false;
            mirror = true;     // hai khẩu hai bên
            alternate = true;  // thay phiên nhau bắn
            inaccuracy = 0f;
            shootSound = sndDroneLaser(); // DroneShootLaser.ogg
            bullet = laser;
        }});
        return t;
    }

    // ---------------------------------------------------------------- tiện ích tĩnh
    public static float powerRequirement(int level){
        return level * level * 1000f;
    }

    static float val(float[] table, int level){
        return table[Mathf.clamp(level, 1, MAX_LEVEL) - 1];
    }

    static float formHealthBonus(int form, int level){
        if(form < YELLOW || form > PURPLE) return 0f;
        return HP_BONUS_PER_LEVEL[form] * level;
    }

    static Color formColor(int form){
        switch(form){
            case YELLOW: return YELLOW_COLOR;
            case BLUE: return BLUE_COLOR;
            case PURPLE: return PURPLE_COLOR;
            default: return GRAY_COLOR;
        }
    }

    // ---------------------------------------------------------------- chi phí nâng cấp
    static final int MAX_COST_ITEMS = 8; // số ô lưu tiến độ trả góp (hiện tối đa 7 loại tài nguyên)
    static ItemStack[][] upgradeCosts;

    /** Chi phí để lên level + 1 (null nếu đã tối đa). Dựng lười vì Items chỉ tồn tại sau khi content được load. */
    static ItemStack[] upgradeCost(int level){
        if(level < 1 || level >= MAX_LEVEL) return null;
        if(isSandbox()){ // sandbox: mọi giá nâng cấp bằng 0 (vẫn chỉ lên từng cấp một)
            ItemStack[] base = baseUpgradeCost(level);
            ItemStack[] free = new ItemStack[base.length];
            for(int i = 0; i < base.length; i++) free[i] = new ItemStack(base[i].item, 0);
            return free;
        }
        return baseUpgradeCost(level);
    }

    /** Đang chơi ở chế độ sandbox. */
    static boolean isSandbox(){
        return state != null && state.rules != null && state.rules.mode() == Gamemode.sandbox;
    }

    static ItemStack[] baseUpgradeCost(int level){
        if(upgradeCosts == null){
            upgradeCosts = new ItemStack[][]{
                // 1 -> 2
                ItemStack.with(Items.copper, 500, Items.silicon, 100, Items.metaglass, 200),
                // 2 -> 3
                ItemStack.with(Items.copper, 1500, Items.silicon, 600, Items.metaglass, 1000, Items.titanium, 500, Items.plastanium, 200),
                // 3 -> 4
                ItemStack.with(Items.copper, 6000, Items.silicon, 3000, Items.titanium, 2500, Items.plastanium, 1600, Items.thorium, 1500, Items.phaseFabric, 600),
                // 4 -> 5
                ItemStack.with(Items.copper, 45000, Items.silicon, 17000, Items.titanium, 24000, Items.plastanium, 11000, Items.thorium, 21000, Items.phaseFabric, 12000, Items.surgeAlloy, 7000)
            };
        }
        return upgradeCosts[level - 1];
    }

    // ---------------------------------------------------------------- âm thanh (tra tên lúc chạy)
    // Tên trong class Sounds khác nhau giữa các bản Mindustry, nên thử lần lượt nhiều tên bằng reflection.
    // Không tìm thấy thì bỏ qua âm đó (không lỗi biên dịch) và ghi cảnh báo một lần vào log.
    static final java.util.HashMap<String, Sound> soundCache = new java.util.HashMap<>();

    static Sound snd(String key, String... names){
        if(soundCache.containsKey(key)) return soundCache.get(key);
        Sound found = null;
        for(String n : names){
            try{
                Object o = Sounds.class.getField(n).get(null);
                if(o instanceof Sound){
                    found = (Sound)o;
                    break;
                }
            }catch(Throwable ignored){}
        }
        if(found == null) arc.util.Log.warn("[Thermion] không tìm thấy âm thanh '@' trong Sounds (đã thử: @)", key, String.join(", ", names));
        soundCache.put(key, found);
        return found;
    }

    static Sound sndShootBig(){ return snd("shootBig", "shootBig", "shootbig", "bigshot", "shootAltLong", "shootAlt", "shotgun", "shoot"); }
    static Sound sndSpark(){ return snd("spark", "spark", "electric", "shock", "flux"); }
    static Sound sndPulse(){ return snd("pulse", "pulse", "shockBlast", "empulse", "laserblast", "laserBlast", "lasercharge", "laserCharge"); }
    static Sound sndLaser(){ return snd("laser", "laser", "lasershoot", "laserShoot", "shootLaser", "beam", "laserbeam", "laserBeam"); }
    static Sound sndLaserBig(){ return snd("laserBig", "laserbig", "laserBig", "laserblast", "laserBlast", "laserbeam", "laserBeam", "lasercharge", "laserCharge"); }
    static Sound sndExplosionBig(){ return snd("explosionBig", "explosionbig", "explosionBig", "bigExplosion", "largeExplosion", "corexplode", "coreExplode", "explosion"); }

    // ---------------------------------------------------------------- nội tại dạng Yellow: sát thương % máu tối đa
    /** Các Thermion đang chạy (đăng ký trong updateTile, chỉ dùng ở server) để tra sức chứa điện lúc đạn trúng. */
    static final Seq<ThermionBuild> instances = new Seq<>();

    /** Tỉ lệ máu tối đa cộng thêm: mỗi 1 triệu sức chứa +0.5%, chỉ tính tới 10 triệu (tối đa 5%). */
    static float bonusFraction(float capacity){
        return Math.min(Math.max(capacity, 0f), BONUS_CAPACITY_CAP) / 1000000f * BONUS_PER_MILLION;
    }

    /** Sức chứa điện của Thermion Yellow gần (px, py) nhất cùng team; 0 nếu không có. */
    static float nearestYellowCapacity(Team team, float px, float py){
        ThermionBuild best = null;
        float bestD = Float.MAX_VALUE;
        for(int i = instances.size - 1; i >= 0; i--){
            ThermionBuild t = instances.get(i);
            if(!t.isValid()){
                instances.remove(i);
                continue;
            }
            if(t.team != team || t.form != YELLOW) continue;
            float d = Mathf.dst2(t.x, t.y, px, py);
            if(d < bestD){
                bestD = d;
                best = t;
            }
        }
        return best == null ? 0f : best.gridCapacity();
    }

    // ---------------------------------------------------------------- âm thanh trong assets/sounds
    static final String[] ASSET_SOUNDS = {
        "DeathLaserExplosion", "DeathLaserLoop", "DroneShootLaser", "DualBladeHitSound",
        "EnergyShieldBreak", "EnergyShieldHit", "MachineGunShootSound", "MeteoroidHitSound", "OrbHitSound", "OrbShootSound"
    };
    static final java.util.HashMap<String, Sound> assetSounds = new java.util.HashMap<>();
    static boolean assetSoundsLoaded = false;

    /** Nạp mọi file trong assets/sounds. Phải gọi lúc load content (hàng đợi asset chỉ được xử lý ở màn hình tải). */
    static void loadAssetSounds(){
        if(assetSoundsLoaded) return;
        assetSoundsLoaded = true;
        for(String n : ASSET_SOUNDS){
            try{
                assetSounds.put(n, mindustry.Vars.tree.loadSound(n));
            }catch(Throwable t){
                arc.util.Log.err("[Thermion] không nạp được sounds/@.ogg", n);
                arc.util.Log.err(t);
            }
        }
    }

    /** Âm thanh trong assets theo tên file; nạp lỗi thì dùng âm dự phòng có sẵn của game để không bị câm. */
    static Sound pick(String assetName, Prov<Sound> fallback){
        Sound s = assetSounds.get(assetName);
        return s != null ? s : fallback.get();
    }

    /** Âm từ assets không có id trong class Sounds nên không gửi qua Call được. */
    static boolean isAssetSound(Sound s){
        return s != null && assetSounds.containsValue(s);
    }

    static Sound sndOrbShoot(){ return pick("OrbShootSound", Thermion::sndShootBig); }
    static Sound sndMachineGun(){ return pick("MachineGunShootSound", () -> Sounds.shoot); }
    static Sound sndDroneLaser(){ return pick("DroneShootLaser", Thermion::sndLaser); }
    static Sound sndOrbHit(){ return pick("OrbHitSound", () -> Sounds.none); }
    static Sound sndShieldHit(){ return pick("EnergyShieldHit", Thermion::sndSpark); }
    static Sound sndShieldBreak(){ return pick("EnergyShieldBreak", Thermion::sndPulse); }
    static Sound sndBladeHit(){ return pick("DualBladeHitSound", Thermion::sndSpark); }
    static Sound sndMeteorHit(){ return pick("MeteoroidHitSound", () -> Sounds.explosion); }
    static Sound sndDeathLaserLoop(){ return pick("DeathLaserLoop", Thermion::sndLaserBig); }
    static Sound sndDeathLaserBlast(){ return pick("DeathLaserExplosion", Thermion::sndExplosionBig); }

    // ---------------------------------------------------------------- ngôn ngữ UI
    /** Ngôn ngữ UI: lưu trong settings (đổi được trong Info); mặc định theo ngôn ngữ của game (vi -> tiếng Việt, còn lại -> English). */
    static boolean vi(){
        String s = Core.settings.getString("thermion-lang", "");
        if(s.equals("vi")) return true;
        if(s.equals("en")) return false;
        return Core.bundle != null && Core.bundle.getLocale() != null && "vi".equals(Core.bundle.getLocale().getLanguage());
    }

    /** Chọn chuỗi theo ngôn ngữ UI hiện tại. */
    static String tr(String en, String vi){
        return vi() ? vi : en;
    }

    // ---------------------------------------------------------------- mô tả skill (bảng Info / Upgrade)
    // bảng chỉ số phụ cho phần Info (index = level - 1)
    static final float[] T_SHIELD_RADIUS = {0f, 0f, 5f, 10f, 15f};
    static final float[] T_SHIELD_REGEN_TIME = {0f, 0f, SHIELD_REGEN_TICKS / 60f, SHIELD_REGEN_TICKS / 60f, SHIELD_REGEN_TICKS / 60f};
    static final float[] T_SHIELD_REGEN_PCT  = {0f, 0f, SHIELD_REGEN_FRACTION * 100f, SHIELD_REGEN_FRACTION * 100f, SHIELD_REGEN_FRACTION * 100f};
    static final float[] T_EMP_DURATION  = {0f, 0f, 0f, 0f, EMP_DURATION / 60f};
    static final float[] T_EMP_COOLDOWN  = {0f, 0f, 0f, 0f, EMP_COOLDOWN / 60f};
    static final float[] T_BLASTER_BEAMS = {1f, 2f, 3f, 4f, 5f};
    static final float[] T_METEOR_MAX    = {0f, 6f, 9f, 12f, 15f};
    static final float[] T_LASER_ZONE    = {0f, 0f, 6f, 8f, 10f};
    static final float[] T_LIMIT_DECAY   = LIMITLESS_DECAY_PCT;
    static final float[] T_AST_CHARGE    = {0f, 0f, 0f, 0f, ASTEROID_CHARGE_TICKS / 60f};
    static final float[] T_AST_DEATH     = {0f, 0f, 0f, 0f, DEATH_TICKS / 60f};
    static final float[] T_AST_COOLDOWN  = {0f, 0f, 0f, 0f, ASTEROID_COOLDOWN / 60f};
    static final float[] T_MEGA_COOLDOWN = {0f, 0f, 0f, 0f, MEGA_HYPNOSIS_COOLDOWN / 60f};

    /** Một chỉ số của skill theo level; giá trị hiển thị = table[level - 1] / div. Nhãn có hai ngôn ngữ. */
    static final class Stat{
        final String en, vi, unit;
        final float[] table;
        final float div;

        Stat(String en, String vi, float[] table, String unit, float div){
            this.en = en;
            this.vi = vi;
            this.table = table;
            this.unit = unit;
            this.div = div;
        }

        Stat(String en, String vi, float[] table, String unit){
            this(en, vi, table, unit, 1f);
        }

        String label(){
            return tr(en, vi);
        }

        float at(int level){
            return val(table, level) / div;
        }
    }

    static final class Skill{
        final String name, descEn, descVi;
        final int unlock;
        final boolean active;
        final Stat[] stats;

        Skill(String name, int unlock, boolean active, String descEn, String descVi, Stat... stats){
            this.name = name;
            this.unlock = unlock;
            this.active = active;
            this.descEn = descEn;
            this.descVi = descVi;
            this.stats = stats;
        }

        String desc(){
            return tr(descEn, descVi);
        }
    }

    /** Skill của từng dạng (index theo YELLOW / BLUE / PURPLE), xếp theo level mở khóa. */
    static final Skill[][] SKILLS = {
        { // Yellow
            new Skill("ElectrifiedField", 1, false,
                "Slows every enemy inside the affect radius. Each slowed enemy is wrapped in an electric ring.",
                "Làm chậm mọi kẻ địch trong phạm vi ảnh hưởng. Mỗi kẻ địch bị làm chậm có một vòng điện bao quanh.",
                new Stat("Slow", "Làm chậm", SLOW_PERCENT, "%")),
            new Skill("ElectricSphere", 2, false,
                "Every enemy in range spawns an electric orb at a random spot inside a 15-tile circle around the block. When fully charged, all orbs fly to their targets and deal damage, shedding lightning bolts along the way. The number of orbs per volley is capped by level (nearest enemies first). Innate: each orb hit also deals extra damage equal to a percentage of the target's max health (armor applies): +0.5% per 1 million of grid power capacity, counted up to 10 million.",
                "Mỗi kẻ địch trong phạm vi tạo ra một quả cầu điện, xuất hiện ngẫu nhiên trong vòng tròn bán kính 15 tile quanh khối. Nạp đủ thời gian thì mọi quả cầu bay tới mục tiêu, gây sát thương kèm sét. Số quả cầu tối đa mỗi lượt bị giới hạn theo level (ưu tiên địch gần nhất). Nội tại: mỗi lần orb trúng còn gây thêm sát thương bằng % máu tối đa của mục tiêu (có tính giáp): +0.5% cho mỗi 1 triệu sức chứa điện, tính tới 10 triệu.",
                new Stat("Charge time", "Thời gian nạp", SPHERE_CHARGE, " tick"),
                new Stat("Damage", "Sát thương", SPHERE_DAMAGE, ""),
                new Stat("Max orbs per volley", "Số quả cầu tối đa", SPHERE_MAX, "")),
            new Skill("EnergyShield", 3, false,
                "An energy shield (radius 5 / 10 / 15 tiles at levels 3 / 4 / 5) that blocks every enemy bullet entering it and pushes every enemy unit inside it out (buildings cannot be moved); each bullet drains the shield by its damage. Shield health is a share of the grid's total battery capacity (50% / 75% / 100% at levels 3 / 4 / 5), so no batteries means no shield. Whenever it appears (or returns after breaking, following a cooldown) it only has 10% health and must fill up by repairing itself every 2 seconds by drawing power from the batteries, at most 10% of the grid's max capacity per repair.",
                "Khiên (bán kính 5 / 10 / 15 tile ở level 3 / 4 / 5) chặn mọi đạn địch bay vào và đẩy mọi đơn vị địch trong khiên ra ngoài (công trình không di chuyển được); mỗi viên đạn trừ vào máu khiên bằng sát thương của nó. Máu khiên bằng một tỉ lệ dung tích dự trữ điện (pin) của lưới (50% / 75% / 100% ở level 3 / 4 / 5), không có pin thì không có khiên. Mỗi lần xuất hiện (hoặc hồi lại sau khi vỡ, theo thời gian hồi) khiên chỉ có 10% máu và phải tự sửa 2 giây một lần để đầy dần bằng điện trong pin, mỗi lần rút tối đa 10% sức chứa tối đa của lưới.",
                new Stat("Shield health (% of grid battery capacity)", "Máu khiên (% dung tích pin của lưới)", SHIELD_PERCENT, "%"),
                new Stat("Repair interval", "Chu kỳ tự sửa", T_SHIELD_REGEN_TIME, "s"),
                new Stat("Max drain per repair (% of grid capacity)", "Rút tối đa mỗi lần sửa (% sức chứa lưới)", T_SHIELD_REGEN_PCT, "%"),
                new Stat("Cooldown when broken", "Thời gian hồi khi vỡ", SHIELD_COOLDOWN, "s", 60f),
                new Stat("Radius (tiles)", "Bán kính (tile)", T_SHIELD_RADIUS, "")),
            new Skill("MagneticField", 4, false,
                "Every second, deals true damage (ignores armor) equal to a percentage of max health to every enemy in range.",
                "Mỗi giây gây sát thương chuẩn (xuyên giáp) bằng một tỉ lệ % máu tối đa lên mọi kẻ địch trong phạm vi.",
                new Stat("True damage per second (% max health)", "Sát thương chuẩn mỗi giây (% máu tối đa)", MAGNETIC_PCT, "%")),
            new Skill("DualBlade", 4, false,
                "Builds circular saw blades. Once built, each blade flies off on its own to the nearest enemy, clings to it and cuts (4 hits per second), then looks for a new target; with no enemies it returns to orbit around the block. Level 4 has 1 blade, level 5 has 2. Innate: each hit also deals extra damage as a percentage of the target's max health, at half the effect of ElectricSphere (+0.25% per 1 million of grid power capacity, up to 10 million).",
                "Chế tạo lưỡi cưa tròn. Chế tạo xong, mỗi lưỡi tự bay đi tìm kẻ địch gần nhất, bám vào cắt (4 nhát mỗi giây) rồi tìm mục tiêu mới; không có địch thì quay về quỹ đạo quanh khối. Level 4 có 1 lưỡi, level 5 có 2 lưỡi. Nội tại: mỗi nhát còn gây thêm sát thương bằng % máu tối đa của mục tiêu, hiệu quả bằng một nửa ElectricSphere (+0.25% cho mỗi 1 triệu sức chứa điện, tính tới 10 triệu).",
                new Stat("Blades", "Số lưỡi", BLADE_COUNT, ""),
                new Stat("Damage per hit", "Sát thương mỗi nhát", BLADE_DAMAGE, ""),
                new Stat("Build time", "Thời gian chế tạo", BLADE_CREATE, "s", 60f)),
            new Skill("ElectromagneticPulse", 5, true,
                "Active skill. Disables every enemy unit and building in range. Can be reused as soon as its cooldown ends.",
                "Kỹ năng chủ động. Toàn bộ đơn vị và công trình địch trong phạm vi bị vô hiệu hóa. Có thể dùng lặp lại (chỉ bị giới hạn bởi thời gian hồi).",
                new Stat("Disable duration", "Thời gian vô hiệu", T_EMP_DURATION, "s"),
                new Stat("Cooldown", "Thời gian hồi", T_EMP_COOLDOWN, "s"))
        },
        { // Blue
            new Skill("Blaster", 1, false,
                "Every second, each enemy in range has a chance to be locked on and hit by 1 up to (level) lasers falling from the sky, 15 ticks apart. Each beam deals base damage plus base damage x (beam count) / 5. The last beam also deals (1/2 x level)% of the target's max health (applied once). Enemies next to the target (within the splash radius) take 1/3 of the damage the target receives.",
                "Mỗi giây, mỗi kẻ địch trong phạm vi có một xác suất bị khóa mục tiêu và hứng ngẫu nhiên 1 đến (level) tia laser từ trời, cách nhau 15 tick. Mỗi tia gây sát thương cơ bản + sát thương cơ bản x (số tia) / 5. Tia cuối gây thêm (1/2 x level)% máu tối đa của mục tiêu (chỉ cộng một lần). Kẻ địch bên cạnh mục tiêu (trong bán kính lan) nhận 1/3 sát thương mà mục tiêu nhận.",
                new Stat("Chance per second", "Xác suất mỗi giây", BLASTER_CHANCE, "%"),
                new Stat("Base damage", "Sát thương cơ bản", BLASTER_DAMAGE, ""),
                new Stat("Max beams", "Số tia tối đa", T_BLASTER_BEAMS, ""),
                new Stat("Splash radius (tiles)", "Bán kính lan (tile)", BLASTER_SPLASH_TILES, "")),
            new Skill("Meteor", 2, false,
                "Every second, each enemy has a chance to be hit by 3 up to (level x 3) meteors. Each meteor explodes in a 4-tile radius for a percentage of max health plus flat damage, and leaves 3 puddles (75% slag, 25% oil).",
                "Mỗi giây, mỗi kẻ địch có một xác suất bị kéo xuống ngẫu nhiên 3 đến (level x 3) thiên thạch. Mỗi quả nổ bán kính 4 tile, gây sát thương % máu tối đa + sát thương số, và để lại 3 vũng (75% xỉ, 25% dầu).",
                new Stat("Chance per second", "Xác suất mỗi giây", METEOR_CHANCE, "%"),
                new Stat("Damage (% max health)", "Sát thương (% máu tối đa)", METEOR_DAMAGE, "%"),
                new Stat("Flat damage", "Sát thương số", METEOR_FLAT, ""),
                new Stat("Max meteors per hit", "Số thiên thạch tối đa", T_METEOR_MAX, "")),
            new Skill("DeathLaser", 3, false,
                "Every second, each enemy has a chance to be locked by a laser from the sky that follows it and deals damage every second (other enemies in the zone take half of that damage). Around the beam, enemy units lose 50% of their activity and enemy buildings run 50% slower. When the beam ends it explodes, dealing (random 2 to 5) x level % of max health to enemies in the zone.",
                "Mỗi giây, mỗi kẻ địch có một xác suất bị khóa bằng tia laser từ trời, tia bám theo mục tiêu và gây sát thương mỗi giây (kẻ địch khác trong phạm vi nhận 1/2 sát thương đó). Trong phạm vi 2 x level tile quanh tia: đơn vị địch giảm 50% hoạt động, công trình địch chậm 50%. Bắn xong tia phát nổ, gây (ngẫu nhiên 2 đến 5) x level % máu tối đa lên kẻ địch trong phạm vi đó.",
                new Stat("Chance per second", "Xác suất mỗi giây", LASER_CHANCE, "%"),
                new Stat("Damage per second", "Sát thương mỗi giây", LASER_DAMAGE, ""),
                new Stat("Beam time", "Thời gian bắn", LASER_TIME, "s"),
                new Stat("Weaken zone radius (tiles)", "Bán kính vùng làm yếu (tile)", T_LASER_ZONE, "")),
            new Skill("Limitless", 4, false,
                "Inside a zone one third the size of the affect radius, every bullet that does not belong to Thermion's team loses 5% of its original speed each second (10% at level 5).",
                "Trong vùng bằng 1/3 phạm vi ảnh hưởng, mọi bullet không thuộc team của Thermion mất 5% tốc độ ban đầu mỗi giây (cấp 5: 10%).",
                new Stat("Speed lost per second", "Tốc độ mất mỗi giây", T_LIMIT_DECAY, "%")),
            new Skill("RCT", 4, false,
                "Periodically heals Thermion for a percentage of its max health.",
                "Định kỳ hồi một tỉ lệ % máu tối đa cho Thermion.",
                new Stat("Heal interval", "Chu kỳ hồi", RCT_TIME, "s", 60f),
                new Stat("Heal amount (% max health)", "Lượng hồi (% máu tối đa)", RCT_AMOUNT, "%")),
            new Skill("Asteroid", 5, true,
                "Active skill. Charges for 1 minute: form change and affect radius are locked, enemies in range are frozen and their bullets stop dead, and Thermion no longer depends on the power grid. Then a huge asteroid flies to the center of the map and wipes out every unit and building outside the locked radius (except Thermions). Afterwards Thermion falls into Death form for 10 minutes (the cooldown is frozen meanwhile), then reawakens in Blue form.",
                "Kỹ năng chủ động. Gồng 1 phút: khóa chuyển dạng và khóa phạm vi ảnh hưởng, địch trong phạm vi bị đóng băng, đạn địch bị chặn đứng, Thermion không còn phụ thuộc lưới điện. Sau đó một tiểu hành tinh bay về giữa bản đồ và tiêu diệt mọi đơn vị lẫn công trình nằm ngoài phạm vi đã khóa (trừ Thermion). Dùng xong Thermion vào dạng Death trong 10 phút (hồi chiêu bị khóa trong lúc này) rồi tự trở về dạng Blue.",
                new Stat("Charge time", "Thời gian gồng", T_AST_CHARGE, "s"),
                new Stat("Time in Death form", "Thời gian ở dạng Death", T_AST_DEATH, "s"),
                new Stat("Cooldown", "Thời gian hồi", T_AST_COOLDOWN, "s"))
        },
        { // Purple
            new Skill("Illusion", 1, false,
                "Periodically, each enemy in range has a chance to fall into an illusion and be disabled. The disable time shrinks with armor: x (1 - armor / 100).",
                "Định kỳ, mỗi kẻ địch trong phạm vi có một xác suất rơi vào ảo giác và bị vô hiệu hóa. Thời gian vô hiệu giảm theo giáp: x (1 - giáp / 100).",
                new Stat("Interval", "Chu kỳ", ILLUSION_TIME, "s"),
                new Stat("Chance", "Xác suất", ILLUSION_CHANCE, "%"),
                new Stat("Disable duration", "Thời gian vô hiệu", ILLUSION_DURATION, "s")),
            new Skill("Drone", 2, false,
                "Periodically summons 1 drone, with no limit on the number. Drones are flying units with flare speed that hunt enemies inside Thermion's affect radius and every 50 ticks fire a volley of 12 bullets 2 ticks apart. Levels 2-3: a Drone (200 health, 25 damage per bullet). Level 4+: a Drone V2 is summoned instead (800 health, 90 damage per bullet plus 0-1% of the target's max health, and two side lasers firing alternately every 60 ticks for 400 damage plus 0-15% of the target's max health, piercing up to 7 targets). Drones vanish when Thermion is destroyed, removed or leaves Purple form.",
                "Định kỳ triệu hồi 1 drone, không giới hạn số lượng. Drone là flying unit tốc độ ngang flare, tự tìm kẻ địch trong phạm vi ảnh hưởng của Thermion và cứ 50 tick bắn một loạt 12 viên cách nhau 2 tick. Level 2-3: Drone thường (200 máu, mỗi viên 25 sát thương). Level 4 trở lên: triệu hồi Drone V2 thay thế (800 máu, mỗi viên 90 sát thương + ngẫu nhiên 0-1% máu tối đa của mục tiêu, thêm hai súng laser hai bên bắn luân phiên, reload 60, 400 sát thương + ngẫu nhiên 0-15% máu tối đa, xuyên tối đa 7 mục tiêu). Drone biến mất khi Thermion bị phá hủy, bị xóa hoặc rời dạng Purple.",
                new Stat("Summon interval", "Chu kỳ triệu hồi", DRONE_TIME, "s")),
            new Skill("Shapeshifter", 3, false,
                "Periodically, each enemy in range has a chance to be locked on. After 2 seconds, an allied unit of the same type appears at that spot with exactly the stats the target had when locked (health, armor, shield).",
                "Định kỳ, mỗi kẻ địch trong phạm vi có một xác suất bị khóa mục tiêu. Sau 2 giây, một đơn vị đồng minh cùng loại xuất hiện tại vị trí đó với chỉ số y hệt lúc bị khóa (máu, giáp, khiên).",
                new Stat("Interval", "Chu kỳ", SHAPE_TIME, "s"),
                new Stat("Chance", "Xác suất", SHAPE_CHANCE, "%")),
            new Skill("Hypnosis", 3, false,
                "Passive. When Thermion is destroyed while in Purple form, every enemy unit in the affect radius is turned into an ally.",
                "Bị động. Khi Thermion bị phá hủy ở dạng Purple, mọi đơn vị địch trong phạm vi ảnh hưởng bị biến thành đồng minh."),
            new Skill("MindControl", 4, false,
                "Periodically, each enemy in range has a chance to be turned into an ally.",
                "Định kỳ, mỗi kẻ địch trong phạm vi có một xác suất bị biến thành đồng minh.",
                new Stat("Interval", "Chu kỳ", MIND_TIME, "s"),
                new Stat("Chance", "Xác suất", MIND_CHANCE, "%")),
            new Skill("Mega Hypnosis", 5, true,
                "Active skill. Triggers Hypnosis without needing to be destroyed. Can be reused as soon as its cooldown ends.",
                "Kỹ năng chủ động. Kích hoạt Hypnosis mà không cần bị phá hủy. Có thể dùng lặp lại (chỉ bị giới hạn bởi thời gian hồi).",
                new Stat("Cooldown", "Thời gian hồi", T_MEGA_COOLDOWN, "s"))
        }
    };

    static String formRole(int f){
        switch(f){
            case YELLOW: return tr(
                "Electric defender. Slows and shocks enemies, shields the area against bullets and carves targets apart with saw blades. Has the largest max-health bonus of the three forms.",
                "Phòng thủ bằng điện. Làm chậm và giật điện kẻ địch, dựng khiên chặn đạn và dùng lưỡi cưa xẻ mục tiêu. Có phần thưởng máu tối đa lớn nhất trong ba dạng.");
            case BLUE: return tr(
                "Orbital bombardment. Lasers, meteors and death rays rain from the sky, enemy bullets are slowed and Thermion heals itself. Level 5 unlocks Asteroid.",
                "Pháo kích từ quỹ đạo. Laser, thiên thạch và tia tử thần giáng từ trên trời, đạn địch bị làm chậm và Thermion tự hồi máu. Level 5 mở khóa Asteroid.");
            default: return tr(
                "Control and summoning. Disables, converts and clones enemies, and summons drones to fight for you. Converts everything nearby when destroyed.",
                "Kiểm soát và triệu hồi. Vô hiệu hóa, chiêu mộ và nhân bản kẻ địch, triệu hồi drone chiến đấu cho bạn. Khi bị phá hủy sẽ chiêu mộ mọi thứ xung quanh.");
        }
    }

    static String fmt(float v){
        return Math.abs(v - Math.round(v)) < 0.001f ? String.valueOf(Math.round(v)) : Strings.fixed(v, 1);
    }

    /** Thẻ màu markup của dạng, ví dụ "[#ffd37fff]". */
    static String colorTag(int form){
        return "[#" + formColor(form) + "]";
    }

    static float dialogWidth(){
        return Math.min(480f, Core.graphics.getWidth() / Scl.scl(1f) * 0.92f);
    }

    /** Thêm vùng cuộn vào dialog, kích thước theo màn hình (để dialog dài không tràn màn hình điện thoại). */
    static void dialogPane(BaseDialog d, Cons<Table> build){
        float sc = Scl.scl(1f);
        d.cont.pane(Styles.noBarPane, build).size(dialogWidth(), Core.graphics.getHeight() / sc * 0.62f);
    }

    /** Label tự xuống dòng, rộng vừa dialog. */
    static Cell<Label> wrapLabel(Table t, Prov<CharSequence> text){
        return wrapLabel(t, text, dialogWidth() - 40f);
    }

    /** Label tự xuống dòng với chiều rộng cho trước (dùng trong các card). */
    static Cell<Label> wrapLabel(Table t, Prov<CharSequence> text, float width){
        Cell<Label> c = t.label(text).width(width).left();
        c.get().setWrap(true);
        return c;
    }

    /** Tiêu đề một mục: chữ Pal.accent + đường kẻ Pal.accent ngắn ngay bên dưới (rộng bằng chữ). */
    static void section(Table t, String title){
        t.table(h -> {
            h.add("[#" + Pal.accent + "]" + title + "[]").left().row();
            h.image().color(Pal.accent).height(3f).growX();
        }).left().padTop(14f).padBottom(6f).row();
    }

    /** Thụt lề nội dung dưới mỗi mục. */
    static final float CONTENT_INDENT = 16f;

    /** Bọc một drawable và vẽ thêm viền xám lên trên. */
    static Drawable grayBordered(final Drawable inner){
        return new BaseDrawable(){
            @Override
            public void draw(float x, float y, float w, float h){
                if(inner != null) inner.draw(x, y, w, h);
                float st = Scl.scl(2f);
                Draw.color(Color.gray);
                Lines.stroke(st);
                Lines.rect(x + st / 2f, y + st / 2f, w - st, h - st);
                Draw.reset();
            }
        };
    }

    static TextButtonStyle grayBtnStyle;

    /** Kiểu nút có viền màu xám (dựng khi cần vì Styles chỉ có sau khi game load). */
    static TextButtonStyle grayBtn(){
        if(grayBtnStyle == null){
            TextButtonStyle st = new TextButtonStyle(Styles.flatBordert);
            st.up = grayBordered(st.up);
            st.over = grayBordered(st.over);
            st.down = grayBordered(st.down);
            st.disabled = grayBordered(st.disabled);
            st.checked = grayBordered(st.checked);
            grayBtnStyle = st;
        }
        return grayBtnStyle;
    }

    /** Nút trở về nằm dưới cùng dialog, viền xám (vẫn giữ phím back/escape của addCloseButton). */
    static void addBackButton(BaseDialog d){
        d.addCloseButton();
        d.buttons.clear();
        d.buttons.button(tr("Back", "Trở về"), grayBtn(), d::hide).size(210f, 64f);
    }

    /** Thời gian mm:ss từ số tick. */
    /** Số gọn cho bar: 1234 -> "1234", 12345 -> "12.3k", 2500000 -> "2.50M". */
    static String compactNum(float v){
        float a = Math.abs(v);
        if(a >= 1000000f) return Strings.fixed(v / 1000000f, 2) + "M";
        if(a >= 10000f) return Strings.fixed(v / 1000f, 1) + "k";
        return String.valueOf(Math.round(v));
    }

    static String timeText(float ticks){
        int sec = Math.max(0, (int)Math.ceil(ticks / 60f));
        return (sec / 60) + ":" + (sec % 60 < 10 ? "0" : "") + (sec % 60);
    }

    // ---------------------------------------------------------------- HÀM VẼ (port từ thermion.js)
    /** Callback cho drawMultiLayer: (scale, overrideColor|null, alpha, strokeScale). */
    interface LayerDraw{
        void draw(float scale, Color override, float alpha, float strokeScale);
    }

    /** Vẽ 3 lớp: to + nhạt, chuẩn, nhỏ + trắng sáng. */
    static void drawMultiLayer(LayerDraw f){
        f.draw(1.3f, null, 0.3f * auraAlpha, 1.4f);
        f.draw(1.0f, null, 1.0f * auraAlpha, 1.0f);
        f.draw(0.65f, Color.white, 0.9f * auraAlpha, 0.6f);
    }

    /** Như drawMultiLayer nhưng ba lớp chênh nhau rất ít (1.12 / 1.0 / 0.82) — dùng cho lưỡi cưa. */
    static void drawTightLayers(LayerDraw f){
        f.draw(1.12f, null, 0.35f * auraAlpha, 1.1f);
        f.draw(1.0f, null, 1.0f * auraAlpha, 1.0f);
        f.draw(0.82f, Color.white, 0.8f * auraAlpha, 0.85f);
    }

    /** Xung lục giác lan ra từ tâm. */
    static void drawCorePulse(float x, float y, Color color, float scale){
        Draw.color(color);
        float r = (Time.time * 2f) % 24f * scale;
        float alpha = 1f - (r / (24f * scale));
        Draw.alpha(Math.max(0f, alpha) * auraAlpha);
        Lines.stroke(2f);
        Lines.poly(x, y, 6, r, Time.time * 2f);
        Draw.reset();
    }

    /** Vòng nổ thiên thạch khi đang gồng Asteroid (progress 0..1). */
    static void drawMeteorImpact(float x, float y, float radius, float progress){
        Draw.color(Color.scarlet, Color.orange, progress);
        Lines.stroke(3f * (1f - progress));
        Lines.circle(x, y, radius * progress);
        Draw.color(Color.orange);
        Fill.circle(x, y, (1f - progress) * 8f);
        Draw.reset();
    }

    /** Một hố thiên thạch: gờ miệng hố sáng, lòng hố tối, bóng đổ lệch về phía trên-trái (ánh sáng từ trên-trái). */
    static void drawCrater(float cx, float cy, float cr){
        Draw.color(CRATER_RIM_COLOR);
        Draw.alpha(0.55f);
        Fill.circle(cx, cy, cr * 1.12f);
        Draw.color(CRATER_PIT_COLOR);
        Draw.alpha(0.75f);
        Fill.circle(cx, cy, cr * 0.94f);
        Draw.color(CRATER_DEEP_COLOR);
        Draw.alpha(0.8f);
        Fill.circle(cx - cr * 0.14f, cy + cr * 0.14f, cr * 0.72f);
        Draw.reset();
    }

    /**
     * Thân tiểu hành tinh: đá tối + vùng sáng phía trên-trái + các hố thiên thạch.
     * Vị trí và kích thước hố ngẫu nhiên theo seed (hố to vẽ trước, hố nhỏ vẽ chồng lên sau).
     */
    static void drawAsteroidBody(float px, float py, float rad, long seed){
        Draw.color(ASTEROID_BODY_COLOR);
        Draw.alpha(0.6f);
        Fill.poly(px, py, 64, rad, 0f);
        Draw.color(ASTEROID_LIGHT_COLOR);
        Draw.alpha(0.18f);
        Fill.circle(px - rad * 0.16f, py + rad * 0.16f, rad * 0.78f);

        for(int k = 0; k < ASTEROID_CRATERS; k++){
            float u = k / (float)(ASTEROID_CRATERS - 1);
            float cr = rad * (0.02f + 0.16f * (float)Math.pow(1f - u, 2.2f)) * Mathf.randomSeed(seed + k * 131L + 5L, 0.75f, 1.25f);
            float ca = Mathf.randomSeed(seed + k * 197L + 11L, 0f, 360f);
            float cd = (rad - cr * 1.2f) * (float)Math.sqrt(Mathf.randomSeed(seed + k * 263L + 17L, 0f, 1f));
            drawCrater(px + Angles.trnsx(ca, cd), py + Angles.trnsy(ca, cd), cr);
        }
        Draw.reset();
    }

    /** Đổi nhiệt độ (0..1) thành màu: khói đen → cam → trắng nóng. */
    static void heatColor(float heat, float alpha){
        heat = Mathf.clamp(heat);
        if(heat > 0.5f) Draw.color(Color.orange, Color.white, (heat - 0.5f) * 2f);
        else Draw.color(SMOKE_COLOR, Color.orange, heat * 2f);
        Draw.alpha(alpha);
    }

    /**
     * Đám mây hình nấm khổng lồ (nhìn nghiêng, hướng "lên" = +y).
     * s = bán kính mũ nấm (world unit), p = tiến độ 0..1. Gồm vành bụi ở mặt đất, thân cột bốc lên,
     * cầu lửa ở gốc, váy khói và mũ nấm cuộn tròn; nguội dần từ trắng → cam → khói đen rồi tan.
     */
    static void drawMushroomCloud(float x, float y, float s, float p){
        final long sd = 4242L;
        final float fade = Mathf.clamp((1f - p) * 4f);                                          // tan dần ở 25% cuối
        final float rise = 1f - (float)Math.pow(1f - Mathf.clamp(p / 0.6f), 3f);                // bốc lên nhanh rồi chậm
        final float capGrow = 1f - (float)Math.pow(1f - Mathf.clamp((p - 0.08f) / 0.55f), 2f);  // mũ nấm nở ra
        final float height = s * 2.6f * rise;
        final float capR = s * (0.25f + 0.75f * capGrow);
        final float capY = y + height;
        final float cool = 1.15f - p * 1.5f;                                                    // nhiệt chung giảm dần

        Draw.z(Layer.effect + 1f);

        // vành bụi lan ra trên mặt đất
        final float dustR = s * (0.5f + Mathf.clamp(p / 0.5f));
        for(int i = 0; i < 16; i++){
            float a = i * 22.5f + Mathf.randomSeed(sd + i * 3L, -8f, 8f);
            Draw.color(ASH_COLOR);
            Draw.alpha(0.55f * fade);
            Fill.circle(x + Mathf.cosDeg(a) * dustR, y + Mathf.sinDeg(a) * dustR * 0.22f, s * 0.22f);
        }

        // thân cột: loe rộng ở gốc, thon dần lên trên
        for(int i = 0; i < 22; i++){
            float f = i / 21f;
            float px = x + Mathf.randomSeed(sd + 100L + i, -1f, 1f) * s * 0.07f;
            float py = y + height * f;
            float pr = s * (0.16f + 0.4f * (1f - f) * (1f - f)) * Mathf.randomSeed(sd + 200L + i, 0.9f, 1.15f);
            float heat = cool + (1f - f) * 0.3f;
            heatColor(heat, 0.22f * fade);
            Fill.circle(px, py, pr * 1.35f);
            heatColor(heat, 0.85f * fade);
            Fill.circle(px, py, pr);
        }

        // cầu lửa ở gốc cột
        final float fb = 1f - Mathf.clamp(p / 0.35f);
        if(fb > 0f){
            Draw.color(Color.white, Color.orange, 1f - fb);
            Draw.alpha(fade * (0.4f + 0.6f * fb));
            Fill.circle(x, y, s * (0.5f + 0.5f * Mathf.clamp(p / 0.08f)) * (0.6f + 0.4f * fb));
        }

        if(capGrow > 0f){
            // váy khói dưới mũ nấm
            for(int i = 0; i < 12; i++){
                float a = i * 30f + Mathf.randomSeed(sd + 300L + i, -10f, 10f);
                heatColor(cool - 0.25f, 0.8f * fade);
                Fill.circle(x + Mathf.cosDeg(a) * capR * 0.62f, capY - capR * 0.28f + Mathf.sinDeg(a) * capR * 0.22f, capR * 0.27f);
            }

            // vành mũ nấm: các cụm khói xếp theo elip, xoay chậm cho cảm giác cuộn
            for(int i = 0; i < 28; i++){
                float a = i * (360f / 28f) + Mathf.randomSeed(sd + 500L + i, -6f, 6f) + p * 40f;
                float k = Mathf.randomSeed(sd + 600L + i, 0.85f, 1.05f);
                heatColor(cool + 0.15f - 0.3f * Mathf.sinDeg(a), 0.9f * fade);
                Fill.circle(x + Mathf.cosDeg(a) * capR * k, capY + Mathf.sinDeg(a) * capR * 0.5f * k,
                    capR * Mathf.randomSeed(sd + 650L + i, 0.22f, 0.32f));
            }

            // ruột mũ nấm: nóng hơn vành
            for(int i = 0; i < 16; i++){
                float a = Mathf.randomSeed(sd + 700L + i, 0f, 360f);
                float rr = capR * 0.75f * (float)Math.sqrt(Mathf.randomSeed(sd + 800L + i, 0f, 1f));
                heatColor(cool + 0.3f, 0.9f * fade);
                Fill.circle(x + Mathf.cosDeg(a) * rr, capY + Mathf.sinDeg(a) * rr * 0.5f,
                    capR * Mathf.randomSeed(sd + 850L + i, 0.2f, 0.32f));
            }
        }
        Draw.reset();
    }

    /** Vẽ lưỡi cưa của mọi Thermion trong hook Trigger.draw, nên vẫn hiện khi khối nằm ngoài màn hình. */
    static void drawAllBlades(){
        if(!state.isGame()) return;
        Groups.build.each(b -> {
            if(b instanceof ThermionBuild) ((ThermionBuild)b).drawBlades();
        });
    }

    static void drawYellowAura(float x, float y, int level, float t){
        final float coreRadius = 7f + (float)Math.sin(t * 0.15f) * 2f;
        final float baseAngle = -t * 2f;
        final float radiusBase = 16f;

        drawMultiLayer((scale, override, alpha, strokeScale) -> {
            Draw.color(override != null ? override : Color.gold);
            Draw.alpha(alpha);
            Fill.circle(x, y, coreRadius * scale);
            for(int i = 0; i < 8; i++){
                float angle = baseAngle + i * 45f;
                float offset = (float)Math.sin(t * 0.1f + i) * 5f;
                float cr = radiusBase + Math.max(0f, offset);
                Fill.poly(x + Mathf.cosDeg(angle) * cr, y + Mathf.sinDeg(angle) * cr, 3, 4f * scale, angle + 90f);
            }
            Draw.reset();
        });

        if(level >= 3){
            drawMultiLayer((scale, override, alpha, strokeScale) -> {
                if(override != null) Draw.color(override);
                else Draw.color(Color.yellow, Color.orange, ((float)Math.sin(t * 0.05f) + 1f) * 0.5f);
                Draw.alpha(alpha * 0.7f);
                Lines.stroke(1.5f * strokeScale);
                Lines.poly(x, y, 8, 36f * scale, t * 1.5f);
                Draw.reset();
            });
        }
    }

    static void drawBlueAura(float x, float y, float t){
        final float sf = 1f + (float)Math.sin(t * 0.1f) * 0.25f;
        final float coreRadius = (7f + (float)Math.sin(t * 0.15f) * 2f) * sf;
        final float radius1 = 22f * sf, radius2 = 30f * sf;
        final float angle1 = (t * 3f) % 360f;
        final float angle2 = (180f - t * 4f) % 360f;

        drawMultiLayer((scale, override, alpha, strokeScale) -> {
            Draw.color(override != null ? override : Color.sky);
            Draw.alpha(alpha);
            Fill.circle(x, y, coreRadius * scale);
            Lines.stroke(2f * strokeScale);
            Lines.arc(x, y, radius1, 0.75f, angle1);
            Lines.arc(x, y, radius2, 0.75f, angle2);
            Draw.reset();
        });
    }

    static void drawPurpleAura(float x, float y, float t){
        final float radius = 28f;
        final float baseAngle = t * 2f;

        drawMultiLayer((scale, override, alpha, strokeScale) -> {
            for(int i = 0; i < 4; i++){
                float subAngle = t * 2f + i * 90f;
                float subR = 12f + (float)Math.sin(t * 0.1f + i) * 3f;
                Draw.color(override != null ? override : Color.violet);
                Draw.alpha(alpha);
                Fill.circle(x + Mathf.cosDeg(subAngle) * subR, y + Mathf.sinDeg(subAngle) * subR, 3.5f * scale);
            }

            Draw.color(override != null ? override : Color.purple);
            Draw.alpha(alpha);
            Fill.circle(x, y, (6f + (float)Math.cos(t * 0.1f) * 1.5f) * scale);
            Lines.stroke(1.5f * strokeScale);
            Lines.circle(x, y, radius);
            for(int i = 0; i < 4; i++){
                float angle = baseAngle + i * 90f;
                Fill.poly(x + Mathf.cosDeg(angle) * radius, y + Mathf.sinDeg(angle) * radius, 3, 5f * scale, angle);
            }
            Draw.reset();
        });
    }

    /** Vẽ phạm vi ảnh hưởng (hiện khi chọn khối). */
    static void drawThermionRange(float x, float y, float radius, Color formColor){
        Draw.z(Layer.overlayUI);
        Draw.color(formColor);
        Draw.alpha(0.6f);
        Lines.stroke(2f);
        Lines.poly(x, y, 12, radius, Time.time * 0.5f);

        float pulseR = (Time.time % 90f) / 90f * radius;
        Draw.alpha(1f - (pulseR / radius));
        Lines.stroke(1f);
        Lines.circle(x, y, pulseR);

        Draw.alpha(0.8f);
        for(int i = 0; i < 4; i++){
            float a = i * 90f + Time.time * 0.2f;
            Fill.square(x + Mathf.cosDeg(a) * radius, y + Mathf.sinDeg(a) * radius, 3f, a);
        }

        Draw.alpha(0.15f);
        Fill.circle(x, y, radius);
        Draw.reset();
    }

    // ---------------------------------------------------------------- HIỆU ỨNG TỰ VẼ (không dùng Fx vanilla)
    /** Tia laser 3 lớp bắn từ trên trời xuống điểm (x, y). */
    static void skyBeam(float x, float y, float width, float alpha, float height, Color c){
        final float top = y + height;
        drawMultiLayer((scale, override, a, strokeScale) -> {
            Draw.color(override != null ? override : c);
            Draw.alpha(a * alpha);
            Lines.stroke(Math.max(0.1f, width * scale));
            Lines.line(x, y, x, top);
            Fill.circle(x, y, width * 0.9f * scale);
            Draw.reset();
        });
    }

    /** Tia laser 3 lớp từ (x1,y1) tới (x2,y2). */
    static void beamTo(float x1, float y1, float x2, float y2, float width, Color c){
        drawMultiLayer((scale, override, a, strokeScale) -> {
            Draw.color(override != null ? override : c);
            Draw.alpha(a);
            Lines.stroke(Math.max(0.1f, width * scale));
            Lines.line(x1, y1, x2, y2);
            Fill.circle(x1, y1, width * 0.9f * scale);
            Draw.reset();
        });
    }

    /** Lưỡi cưa tròn 3 lớp (chênh lệch tỉ lệ nhỏ): đĩa + răng cưa xoay. */
    static void drawSaw(float sx, float sy, float rad, float rot, float am){
        drawTightLayers((scale, override, a, strokeScale) -> {
            Draw.color(override != null ? override : Color.gold);
            Draw.alpha(a * am);
            float rr = rad * scale;
            Fill.circle(sx, sy, rr * 0.62f);
            int teeth = 10;
            float step = 360f / teeth;
            for(int k = 0; k < teeth; k++){
                float ang = rot + k * step;
                float a1 = ang - step * 0.32f, a2 = ang + step * 0.32f, tip = ang + step * 0.25f;
                Fill.tri(
                    sx + Angles.trnsx(a1, rr * 0.55f), sy + Angles.trnsy(a1, rr * 0.55f),
                    sx + Angles.trnsx(a2, rr * 0.55f), sy + Angles.trnsy(a2, rr * 0.55f),
                    sx + Angles.trnsx(tip, rr), sy + Angles.trnsy(tip, rr));
            }
            Draw.reset();
        });
    }

    /** Orb điện: ba lớp chênh lệch tỉ lệ nhỏ (1.18 / 1.0 / 0.72). glow 0..1 làm lớp giữa sáng hơn. */
    static void drawOrb(float ox, float oy, float r, float glow){
        Draw.color(Color.gold, 0.45f);
        Fill.circle(ox, oy, r * 1.18f);
        Draw.color(Color.gold, 0.7f + 0.3f * Mathf.clamp(glow));
        Fill.circle(ox, oy, r);
        Draw.color(Color.white);
        Fill.circle(ox, oy, r * 0.72f);
        Draw.reset();
    }

    /** Vòng điện zigzag quanh một mục tiêu (ElectrifiedField). */
    static void drawElectricRing(float x, float y, float r, float t){
        Draw.color(Color.gold, Color.white, 0.3f);
        Draw.alpha(0.85f);
        Lines.stroke(1.2f);
        int seg = 10;
        float px = 0f, py = 0f;
        for(int i = 0; i <= seg; i++){
            float a = i * 360f / seg + t * 3f;
            float rr = r + (float)Math.sin(t * 0.7f + i * 2.3f) * 2f;
            float cx = x + Mathf.cosDeg(a) * rr, cy = y + Mathf.sinDeg(a) * rr;
            if(i > 0) Lines.line(px, py, cx, cy);
            px = cx;
            py = cy;
        }
        Draw.reset();
    }

    /** Dấu hiệu bị vô hiệu: hai cung xoay và một quân thoi nhấp nhô. */
    static void drawStunMark(float x, float y, float r, float t, Color c){
        Draw.color(c);
        Draw.alpha(0.9f);
        Lines.stroke(1.5f);
        Lines.arc(x, y, r + 4f, 0.25f, t * 5f);
        Lines.arc(x, y, r + 4f, 0.25f, t * 5f + 180f);
        Fill.square(x, y + r + 8f + (float)Math.sin(t * 0.2f) * 2f, 2f, 45f);
        Draw.reset();
    }

    public static final Effect

    // ---- Yellow
    FX_SPHERE = new Effect(14f, 100f, e -> {
        Draw.color(Color.white, e.color, e.fin());
        Lines.stroke(2f * e.fout());
        Lines.circle(e.x, e.y, 3f + 9f * e.finpow());
        Draw.reset();
    }),

    FX_SHIELD_BREAK = new Effect(40f, 400f, e -> {
        Draw.color(e.color, Color.white, e.fout());
        Lines.stroke(3f * e.fout());
        Lines.poly(e.x, e.y, 6, e.rotation * (1f + 0.4f * e.finpow()), Time.time * 0.3f);
        for(int i = 0; i < 6; i++){
            float a = i * 60f + 15f;
            float r1 = e.rotation * (1f + 0.2f * e.fin());
            float r2 = r1 + 14f * e.fout();
            Lines.line(e.x + Angles.trnsx(a, r1), e.y + Angles.trnsy(a, r1), e.x + Angles.trnsx(a, r2), e.y + Angles.trnsy(a, r2));
        }
        Draw.reset();
    }),

    FX_MAGNETIC = new Effect(30f, 100f, e -> {
        Draw.color(e.color, Color.white, e.fin());
        Lines.stroke(1f + 2f * e.fin());
        Lines.circle(e.x, e.y, 22f * e.fout());
        for(int i = 0; i < 4; i++){
            float a = i * 90f + 45f;
            float r1 = 30f * e.fout(), r2 = 16f * e.fout();
            Lines.line(e.x + Angles.trnsx(a, r1), e.y + Angles.trnsy(a, r1), e.x + Angles.trnsx(a, r2), e.y + Angles.trnsy(a, r2));
        }
        Draw.reset();
    }),

    FX_BLADE_SLASH = new Effect(12f, 100f, e -> {
        Draw.color(Color.white, e.color, e.fin());
        Lines.stroke(3f * e.fout());
        Lines.lineAngleCenter(e.x, e.y, e.rotation, 26f * e.finpow());
        Lines.lineAngleCenter(e.x, e.y, e.rotation + 90f, 14f * e.finpow());
        Draw.reset();
    }),

    FX_EMP = new Effect(55f, 6000f, e -> {
        float r = e.rotation * e.finpow();
        Draw.color(e.color, Color.white, e.fout());
        Lines.stroke(6f * e.fout());
        Lines.circle(e.x, e.y, r);
        Lines.stroke(2f * e.fout());
        Lines.circle(e.x, e.y, r * 0.7f);
        for(int i = 0; i < 18; i++){
            float a = i * 20f + Mathf.randomSeed(e.id + i, -6f, 6f);
            float r2 = r * 0.82f;
            Lines.line(e.x + Angles.trnsx(a, r2), e.y + Angles.trnsy(a, r2), e.x + Angles.trnsx(a, r), e.y + Angles.trnsy(a, r));
        }
        Draw.reset();
    }),

    // ---- Blue
    /** Tia laser ngắn rơi từ trời xuống rồi nổ vòng tại điểm chạm. */
    FX_BLASTER = new Effect(16f, 1700f, e -> {
        float split = 0.6f;
        if(e.fin() < split){
            final float fall = e.fin() / split;
            final float head = e.y + 520f * (1f - fall);
            drawMultiLayer((scale, override, a, strokeScale) -> {
                Draw.color(override != null ? override : e.color);
                Draw.alpha(a);
                Lines.stroke(5f * scale);
                Lines.line(e.x, head, e.x, head + 110f);
                Fill.circle(e.x, head, 4f * scale);
                Draw.reset();
            });
        }else{
            float pr = (e.fin() - split) / (1f - split);
            Draw.color(Color.white, e.color, pr);
            Lines.stroke(3f * (1f - pr));
            Lines.circle(e.x, e.y, 6f + 16f * pr);
            Draw.alpha(1f - pr);
            Fill.circle(e.x, e.y, 6f * (1f - pr));
        }
        Draw.reset();
    }),

    /** rotation = bán kính vùng nổ. Thiên thạch xuất hiện rất cao và rơi nhanh, chạm đất ở 60% thời gian. */
    FX_METEOR = new Effect(45f, 900f, e -> {
        float split = 0.6f;
        if(e.fin() < split){
            float f = e.fin() / split;
            float hx = e.x + 220f * (1f - f), hy = e.y + 640f * (1f - f);
            Draw.color(Color.scarlet, Color.orange, f);
            Lines.stroke(5f);
            Lines.line(hx, hy, hx + 220f * 0.12f, hy + 640f * 0.12f);
            Draw.color(Color.orange, Color.white, f);
            Fill.circle(hx, hy, 6f);
        }else{
            drawMeteorImpact(e.x, e.y, e.rotation > 0f ? e.rotation : 30f, (e.fin() - split) / (1f - split));
        }
        Draw.reset();
    }),

    /** rotation = phạm vi giảm hoạt động (world unit). Được phát lại liên tục khi laser còn bắn. */
    FX_DEATH_LASER = new Effect(12f, 1700f, e -> {
        float fade = Math.min(1f, e.fout() * 2f);
        float pulse = 1f + 0.2f * (float)Math.sin(Time.time * 0.5f);
        skyBeam(e.x, e.y, 18f * pulse * fade, 1f, SKY_HEIGHT, e.color);
        Draw.color(e.color);
        Draw.alpha(0.6f * fade);
        Lines.stroke(2f);
        Lines.poly(e.x, e.y, 16, e.rotation, Time.time * 0.5f);
        Draw.alpha(0.08f * fade);
        Fill.circle(e.x, e.y, e.rotation);
        Draw.reset();
    }),

    FX_DEATH_BLAST = new Effect(40f, 1700f, e -> {
        Draw.color(Color.white, e.color, e.fin());
        Lines.stroke(8f * e.fout());
        Lines.circle(e.x, e.y, e.rotation * e.finpow());
        Draw.alpha(0.35f * e.fout());
        Fill.circle(e.x, e.y, e.rotation * 0.5f * e.fout());
        skyBeam(e.x, e.y, 32f * e.fout(), e.fout(), SKY_HEIGHT, e.color);
        Draw.reset();
    }),

    FX_HEAL = new Effect(45f, 400f, e -> {
        Draw.color(e.color, Color.white, e.fout());
        Lines.stroke(3f * e.fout());
        Lines.circle(e.x, e.y, e.rotation * 0.5f + e.rotation * e.finpow());
        for(int i = 0; i < 6; i++){
            float a = i * 60f, rr = e.rotation * 0.6f;
            float px = e.x + Angles.trnsx(a, rr), py = e.y + Angles.trnsy(a, rr) + 30f * e.fin();
            float sz = 3.5f * e.fout();
            Lines.stroke(1.5f * e.fout() + 0.5f);
            Lines.line(px - sz, py, px + sz, py);
            Lines.line(px, py - sz, px, py + sz);
        }
        Draw.reset();
    }),

    /** Tiểu hành tinh (bán kính ASTEROID_BODY_TILES) bay từ điểm chiếu tia (e.x, e.y) tới giữa bản đồ. rotation = seed của các hố thiên thạch. */
    FX_ASTEROID_FALL = new Effect(ASTEROID_TRAVEL_TICKS, 40000f, e -> {
        final float acx = world.unitWidth() / 2f, acy = world.unitHeight() / 2f;
        final float ap = e.fin();
        final float px = Mathf.lerp(e.x, acx, ap), py = Mathf.lerp(e.y, acy, ap);
        final float rad = ASTEROID_BODY_TILES * tilesize;

        drawAsteroidBody(px, py, rad, (long)(e.rotation * 100f));
        drawMultiLayer((scale, override, a, strokeScale) -> {
            Draw.color(override != null ? override : Color.orange);
            Draw.alpha(a * 0.7f);
            Lines.stroke(30f * strokeScale);
            Lines.poly(px, py, 64, rad, 0f);
            Draw.reset();
        });
        Draw.reset();
    }),

    /** Flashbang: trắng xoá toàn màn hình, giữ sáng ngắn rồi tan từ từ (làm mượt đầu và cuối) trong ASTEROID_FLASH_TICKS. */
    FX_ASTEROID_FLASH = new Effect(ASTEROID_FLASH_TICKS, 100000f, e -> {
        Draw.z(Layer.overlayUI + 10f);
        Draw.color(Color.white);
        final float left = 1f - Mathf.clamp((e.fin() - ASTEROID_FLASH_HOLD) / (1f - ASTEROID_FLASH_HOLD));
        Draw.alpha(left * left * (3f - 2f * left)); // smoothstep: giảm đều, không tắt đột ngột
        Fill.rect(Core.camera.position.x, Core.camera.position.y, Core.camera.width * 1.3f, Core.camera.height * 1.3f);
        Draw.reset();
    }),

    /** Rung màn hình cực mạnh, giảm dần (shake được gọi lại mỗi khung hình để giữ đúng cường độ). */
    FX_ASTEROID_QUAKE = new Effect(ASTEROID_QUAKE_TICKS, 100000f, e -> {
        renderer.shake(ASTEROID_SHAKE_POWER * (float)Math.pow(e.fout(), 0.6f), 6f);
    }),

    /** Sóng xung kích: 3 vòng lan ra tới góc xa nhất bản đồ (rotation = khoảng cách đó) + tia xung kích + cầu lửa ban đầu. */
    FX_ASTEROID_IMPACT = new Effect(ASTEROID_WAVE_TICKS, 100000f, e -> {
        final float reach = Math.max(e.rotation, 400f);

        for(int k = 0; k < 3; k++){
            float lag = k * 0.12f;
            float p = Mathf.clamp((e.fin() - lag) / (1f - lag));
            if(p <= 0f) continue;
            float eased = 1f - (1f - p) * (1f - p); // lan nhanh rồi chậm dần
            float r = reach * eased;
            float left = 1f - p;

            if(k == 0){ // vùng áp suất phía sau mặt sóng
                Draw.color(Color.orange);
                Draw.alpha(0.14f * left);
                Fill.circle(e.x, e.y, r);
            }
            if(k == 0) Draw.color(Color.white, Color.orange, p);
            else if(k == 1) Draw.color(Color.orange, Color.scarlet, p);
            else Draw.color(ASH_COLOR, SMOKE_COLOR, p);
            Draw.alpha(0.3f + 0.7f * left);
            Lines.stroke((60f - 15f * k) * (0.25f + 0.75f * left));
            Lines.circle(e.x, e.y, r);
        }

        // tia xung kích toả ra từ mặt sóng ngoài cùng
        final float p0 = e.fin();
        final float r0 = reach * (1f - (1f - p0) * (1f - p0));
        Draw.color(Color.white, Color.orange, p0);
        Draw.alpha(0.8f * (1f - p0));
        Lines.stroke(10f * (1f - p0));
        for(int i = 0; i < 48; i++){
            float a = i * 7.5f + Mathf.randomSeed(i * 31L + 5L, -3f, 3f);
            float len = 120f + 260f * Mathf.randomSeed(i * 57L + 9L, 0f, 1f);
            float r1 = Math.max(0f, r0 - len);
            Lines.line(e.x + Angles.trnsx(a, r1), e.y + Angles.trnsy(a, r1), e.x + Angles.trnsx(a, r0), e.y + Angles.trnsy(a, r0));
        }

        // cầu lửa chói lòa ở tâm vụ nổ
        final float fb = Mathf.clamp(1f - e.fin() * 2.2f);
        if(fb > 0f){
            Draw.color(Color.white, Color.orange, e.fin() * 2.2f);
            Draw.alpha(fb);
            Fill.circle(e.x, e.y, 520f * (1f - fb * 0.4f));
        }
        Draw.reset();
    }),

    /** Đám mây hình nấm khổng lồ. rotation = bán kính mũ nấm (world unit). */
    FX_ASTEROID_MUSHROOM = new Effect(MUSHROOM_TICKS, 12000f, e -> {
        drawMushroomCloud(e.x, e.y, Math.max(e.rotation, 80f), e.fin());
    }),

    /** rotation = kích thước mục tiêu bị diệt. */
    FX_BLAST = new Effect(30f, 400f, e -> {
        float sz = Math.max(6f, e.rotation);
        Draw.color(Color.white, Color.orange, e.fin());
        Lines.stroke(2f * e.fout());
        Lines.circle(e.x, e.y, sz * (0.6f + e.finpow()));
        Draw.alpha(e.fout() * 0.8f);
        Fill.circle(e.x, e.y, Math.max(4f, sz * 0.5f) * e.fout());
        Draw.reset();
    }),

    // ---- Purple
    FX_PURPLE_BURST = new Effect(30f, 200f, e -> {
        Draw.color(e.color, Color.white, e.fout());
        Lines.stroke(2f * e.fout());
        Lines.poly(e.x, e.y, 6, 4f + 18f * e.finpow(), e.fin() * 90f);
        for(int i = 0; i < 4; i++){
            float a = i * 90f + e.fin() * 45f;
            Fill.poly(e.x + Angles.trnsx(a, 8f + 16f * e.finpow()), e.y + Angles.trnsy(a, 8f + 16f * e.finpow()), 3, 3f * e.fout(), a);
        }
        Draw.reset();
    }),

    FX_SHAPE = new Effect(45f, 200f, e -> {
        Draw.color(e.color, Color.white, e.fout());
        Lines.stroke(2f * e.fout());
        int sides = 3 + (int)(3f * e.fin());
        Lines.poly(e.x, e.y, sides, 4f + 16f * e.finpow(), e.fin() * 180f);
        Lines.poly(e.x, e.y, sides, 2f + 10f * e.finpow(), -e.fin() * 180f);
        Draw.reset();
    }),

    /** rotation = hitSize của unit bị thao túng. Con mắt mở ra phía trên unit. */
    FX_MIND = new Effect(55f, 200f, e -> {
        float ey = e.y + e.rotation * 0.5f + 8f + 14f * e.fin();
        float open = e.fslope();
        float w = 10f;
        Draw.color(e.color, Color.white, 0.3f);
        Lines.stroke(1.8f * (0.3f + e.fout()));
        int n = 10;
        for(int sgn = -1; sgn <= 1; sgn += 2){
            for(int i = 0; i < n; i++){
                float u0 = -1f + 2f * i / n, u1 = -1f + 2f * (i + 1) / n;
                Lines.line(e.x + u0 * w, ey + sgn * 5f * open * (1f - u0 * u0), e.x + u1 * w, ey + sgn * 5f * open * (1f - u1 * u1));
            }
        }
        Fill.circle(e.x, ey, 2.4f * open);
        Lines.stroke(2f * e.fout());
        Lines.circle(e.x, e.y, e.rotation * 0.9f * e.fout() + 2f);
        Draw.reset();
    }),

    /** rotation = phạm vi Hypnosis (world unit). */
    FX_HYPNOSIS = new Effect(70f, 8000f, e -> {
        for(int k = 0; k < 3; k++){
            float pr = Mathf.clamp(e.fin() * 1.5f - k * 0.18f);
            if(pr <= 0f) continue;
            Draw.color(e.color, Color.white, 1f - pr);
            Lines.stroke(4f * (1f - pr));
            Lines.poly(e.x, e.y, 6, e.rotation * pr, k * 30f);
            Draw.alpha(0.08f * (1f - pr));
            Fill.poly(e.x, e.y, 6, e.rotation * pr, k * 30f);
        }
        Draw.reset();
    });

    /**
     * AI của drone: tự tìm địch trong phạm vi ảnh hưởng của Thermion chủ rồi tiến lại bắn;
     * không có địch thì lượn quanh Thermion. Tự hủy khi chủ không còn tồn tại hoặc không còn ở dạng Purple.
     */
    public static class DroneAI extends AIController{
        public ThermionBuild owner;
        @Override
        public void updateUnit(){
            if(owner == null || !owner.isValid() || owner.form != PURPLE){
                if(unit != null && unit.isValid() && !net.client()) unit.kill();
                return;
            }
            // mục tiêu đã ra khỏi phạm vi ảnh hưởng thì bỏ
            float r = owner.affectRadiusWorld();
            if(target != null && !Mathf.within(target.getX(), target.getY(), owner.x, owner.y, r)) target = null;
            super.updateUnit();
        }

        /** Chỉ chọn địch (đơn vị, rồi công trình) nằm trong phạm vi ảnh hưởng của Thermion, tính quanh Thermion. */
        @Override
        public Teamc findTarget(float x, float y, float range, boolean air, boolean ground){
            if(owner == null || !owner.isValid()) return null;
            float r = owner.affectRadiusWorld();
            if(r <= 0f) return null;
            return Units.closestTarget(unit.team, owner.x, owner.y, r, u -> u.checkTarget(air, ground), t -> ground);
        }

        @Override
        public void updateMovement(){
            if(owner == null) return;
            if(target != null && unit.hasWeapons()){
                moveTo(target, unit.type.range * 0.8f);
                unit.lookAt(target);
            }else{
                moveTo(owner, owner.block.size * tilesize * 1.5f); // không có địch: ở gần Thermion
            }
        }
    }

    /** Tia DeathLaser đang bắn. */
    static class LaserBeam{
        Unit target;
        float tx, ty;
        float timeLeft;   // tick còn lại
        float secTimer;   // đếm tới mỗi giây để gây damage
        float weakenTimer;
        float fxTimer = 5f;
        float loopTimer;  // đếm để phát lại DeathLaserLoop
    }

    @Override
    public void setBars(){
        super.setBars();
        addBar("thermion-form", (ThermionBuild b) -> new Bar(() -> b.formBarText(), () -> b.formBarColor(), () -> b.formBarFraction()));
        addBar("thermion-range", (ThermionBuild b) -> new Bar(
            () -> tr("Affect Radius: ", "Phạm vi: ") + Strings.fixed(b.rangeBarValue(), 1),
            () -> formColor(b.form),
            () -> Mathf.clamp(b.rangeBarValue() / RANGE_BAR_REF)));
        addBar("thermion-storage", (ThermionBuild b) -> new Bar(() -> b.storageBarText(), () -> b.storageBarColor(), () -> b.storageBarFraction()));
        addBar("thermion-cooldown", (ThermionBuild b) -> new Bar(() -> b.cooldownBarText(), () -> formColor(b.form), () -> b.cooldownBarFraction()));
    }

    static String formName(int form){
        switch(form){
            case YELLOW: return "Yellow";
            case BLUE: return "Blue";
            case PURPLE: return "Purple";
            default: return "Death";
        }
    }

    // ================================================================= BUILDING
    public class ThermionBuild extends Building{
        public int level = 1;
        public int form = YELLOW;
        public int pendingForm = -1; // -1 = không có yêu cầu chuyển dạng

        public float formChangeTimer, formCooldown;

        final float[] timers = new float[9];
        float secondTimer;
        boolean secTick;

        // Yellow
        float sphereCharge;
        int orbCount;
        float shield, shieldMax, shieldCooldown;
        float shieldRegenTimer, shieldHitCd; // nhịp hồi khiên 2 giây / giãn cách tiếng đạn trúng khiên (không lưu)
        boolean shieldDirty = true;
        final float[] blades = new float[2];   // tiến độ chế tạo lưỡi cưa (tick)
        final float[] bladeX = new float[2], bladeY = new float[2], bladeHit = new float[2];
        final boolean[] bladeInit = new boolean[2];
        final Unit[] bladeTarget = new Unit[2];
        int orbSeed;
        /** Hồi chiêu chủ động dùng chung cho mọi dạng (0..1, 1 = sẵn sàng). Đóng băng khi chuyển dạng và khi ở dạng Death. */
        float skillCd = 1f;
        float empActiveTimer;
        /** Đang nâng cấp trả góp: paid[i] = lượng tài nguyên thứ i (theo upgradeCost(level)) đã trừ khỏi core. */
        boolean upgrading;
        final int[] paid = new int[MAX_COST_ITEMS];

        // Blue
        final Seq<LaserBeam> lasers = new Seq<>();
        int asteroidPhase = AST_NONE;
        float asteroidTimer, asteroidRadius, asteroidTx, asteroidTy;
        /** Thời gian còn lại ở dạng Death (tick) sau khi tung Asteroid; hết thì tự trở về dạng Blue. */
        float deathTimer;
        /** Đếm để phát lại DeathLaserLoop trong lúc gồng Asteroid (không lưu). */
        float chargeLoopTimer;

        // Bar Affect Radius chỉ làm mới 1 giây 1 lần (thời gian thực, ms)
        float rangeShown;
        long rangeStamp = -1L;

        // Purple
        final Seq<Unit> drones = new Seq<>();
        /** id drone đọc từ save, chờ gắn lại vào `drones` ở tick đầu. */
        final IntSeq savedDroneIds = new IntSeq();

        // ------------------------------------------------------------- điện
        public float totalPowerProduction(){
            return (power != null && power.graph != null) ? power.graph.getLastPowerProduced() * 60f : 0f;
        }

        public float totalPowerUse(){
            return (power != null && power.graph != null) ? power.graph.getLastPowerNeeded() * 60f : 0f;
        }

        public boolean hasEnoughPower(){
            if(asteroidPhase != AST_NONE) return true; // đang tung Asteroid: không phụ thuộc lưới điện
            return totalPowerProduction() >= powerRequirement(level);
        }

        public float powerNet(){
            return totalPowerProduction() - totalPowerUse();
        }

        /** Tổng dung tích dự trữ điện (pin) của lưới, đơn vị điện. */
        public float gridCapacity(){
            return (power != null && power.graph != null) ? power.graph.getTotalBatteryCapacity() : 0f;
        }

        /** Phạm vi theo điện năng hiện tại (tile), tối thiểu 0. Không bị khóa bởi Asteroid. */
        float liveAffectRadius(){
            return Math.max(0f, powerNet() / (100f * level));
        }

        /** Phạm vi tác dụng (tile), tối thiểu 0. */
        public float affectRadius(){
            if(asteroidPhase != AST_NONE) return asteroidRadius / tilesize; // phạm vi bị khóa khi tung chiêu
            return liveAffectRadius();
        }

        public float affectRadiusWorld(){
            return affectRadius() * tilesize;
        }

        /** Giá trị hiển thị trên bar Affect Radius: chỉ cập nhật 1 giây 1 lần để số không nhảy liên tục. */
        float rangeBarValue(){
            long now = Time.millis();
            if(rangeStamp < 0L || now < rangeStamp || now - rangeStamp >= 1000L){
                rangeStamp = now;
                rangeShown = affectRadius();
            }
            return rangeShown;
        }

        // ------------------------------------------------------------- máu
        @Override
        public float maxHealth(){
            return block.health * (1f + formHealthBonus(form, level) / 100f);
        }

        // ------------------------------------------------------------- cấp
        public void setLevel(int newLevel){
            newLevel = Mathf.clamp(newLevel, 1, MAX_LEVEL);
            if(newLevel == level) return;
            float frac = healthf();
            level = newLevel;
            clearUpgrade();
            health = Math.max(1f, frac * maxHealth());
            resetSkillStates();
        }

        // ------------------------------------------------------------- chuyển dạng
        public boolean canChangeForm(int to){
            return to >= YELLOW && to <= PURPLE
                && form != DEATH
                && to != form
                && pendingForm < 0
                && asteroidPhase == AST_NONE
                && formCooldown <= 0f
                && hasEnoughPower();
        }

        public void requestForm(int to){
            if(net.client() || !canChangeForm(to)) return;
            pendingForm = to;
            formChangeTimer = val(FORM_CHANGE_TIME_SEC, level) * 60f;
        }

        public void tickFormChange(){
            if(pendingForm < 0) return;
            formChangeTimer -= Time.delta;
            if(formChangeTimer <= 0f){
                int to = pendingForm;
                setForm(to);
                formCooldown = val(FORM_CHANGE_COOLDOWN_SEC, level) * 60f;
            }
        }

        public void setForm(int to){
            if(to < YELLOW || to > DEATH) return;
            float frac = healthf();
            if(form == PURPLE && to != PURPLE) killDrones(); // drone phụ thuộc vào dạng Purple
            form = to;
            pendingForm = -1;
            formChangeTimer = 0f;
            asteroidPhase = AST_NONE;
            if(to == DEATH) deathTimer = DEATH_TICKS;
            health = Math.max(1f, frac * maxHealth());
            resetSkillStates();
        }

        /** Tiêu diệt toàn bộ drone do Thermion này triệu hồi. Shapeshifter không bị ảnh hưởng. */
        void killDrones(){
            restoreDrones();
            for(Unit d : drones){
                if(d == null || !d.isValid()) continue;
                d.kill();
            }
            drones.clear();
        }

        /** Gắn lại drone từ id đã lưu (sau khi load save). */
        void restoreDrones(){
            if(savedDroneIds.isEmpty()) return;
            for(int i = 0; i < savedDroneIds.size; i++){
                Unit d = Groups.unit.getByID(savedDroneIds.get(i));
                if(d != null && d.isValid() && d.team == team && !drones.contains(d)){
                    DroneAI ai = new DroneAI();
                    ai.owner = this;
                    d.controller(ai);
                    drones.add(d);
                }
            }
            savedDroneIds.clear();
        }

        void resetSkillStates(){
            sphereCharge = 0f;
            orbCount = 0;
            shield = 0f;
            shieldCooldown = 0f;
            shieldRegenTimer = 0f;
            shieldHitCd = 0f;
            shieldDirty = true;
            blades[0] = blades[1] = 0f; // lưỡi cưa phải chế tạo lại sau nâng cấp / chuyển dạng
            bladeInit[0] = bladeInit[1] = false;
            bladeTarget[0] = bladeTarget[1] = null;
            lasers.clear();
            for(int i = 0; i < timers.length; i++) timers[i] = 0f;
        }

        boolean every(int index, float ticks){
            if(ticks <= 0f) return false;
            timers[index] += Time.delta;
            if(timers[index] >= ticks){
                timers[index] -= ticks;
                return true;
            }
            return false;
        }

        // ------------------------------------------------------------- tìm mục tiêu
        Seq<Unit> enemyUnits(float radiusWorld){
            Seq<Unit> out = new Seq<>();
            if(radiusWorld <= 0f) return out;
            Units.nearbyEnemies(team, x - radiusWorld, y - radiusWorld, radiusWorld * 2f, radiusWorld * 2f, u -> {
                if(u.isValid() && u.within(this, radiusWorld + u.hitSize / 2f)) out.add(u);
            });
            return out;
        }

        Seq<Building> enemyBuildings(float radiusWorld){
            Seq<Building> out = new Seq<>();
            if(radiusWorld <= 0f) return out;
            indexer.allBuildings(x, y, radiusWorld, b -> {
                if(b.team != team && b.team != Team.derelict) out.add(b);
            });
            return out;
        }

        void fx(Effect e, float ex, float ey, Color c){
            fx(e, ex, ey, 0f, c);
        }

        void fx(Effect e, float ex, float ey, float rot, Color c){
            if(net.server()) Call.effect(e, ex, ey, rot, c);
            else e.at(ex, ey, rot, c);
        }

        /** Âm thanh tại một vị trí (nghe nhỏ dần theo khoảng cách). */
        void sfx(Sound snd, float sx, float sy, float vol, float pitch){
            if(snd == null) return;
            if(isAssetSound(snd)){ // âm từ assets: chỉ phát tại máy này (singleplayer / máy chủ có giao diện)
                if(!headless) snd.at(sx, sy, pitch, vol);
            }else if(net.server()) Call.soundAt(snd, sx, sy, vol, pitch);
            else snd.at(sx, sy, pitch, vol);
        }

        /** Âm thanh toàn cục (không phụ thuộc vị trí camera) dùng cho Asteroid. */
        void sfxGlobal(Sound snd, float vol, float pitch){
            if(snd == null) return;
            if(isAssetSound(snd)){
                if(!headless) snd.play(vol, pitch, 0f);
            }else if(net.server()) Call.sound(snd, vol, pitch, 0f);
            else snd.play(vol, pitch, 0f);
        }

        void stun(Unit u, float ticks){
            u.apply(StatusEffects.unmoving, ticks);
            u.apply(StatusEffects.disarmed, ticks);
        }

        /** Làm công trình ngừng hoạt động: timeScale = 0 trong `ticks` tick (tự phục hồi khi hết thời gian). */
        void disableBuilding(Building b, float ticks){
            b.applySlowdown(0f, ticks);
        }

        // ------------------------------------------------------------- khiên (Yellow) chặn damage
        @Override
        public float handleDamage(float amount){
            if(form == YELLOW && level >= 3 && shieldCooldown <= 0f && shield > 0f && hasEnoughPower()){
                float absorbed = Math.min(shield, amount);
                shield -= absorbed;
                amount -= absorbed;
                if(shield <= 0f){
                    shield = 0f;
                    shieldCooldown = val(SHIELD_COOLDOWN, level);
                    fx(FX_SHIELD_BREAK, x, y, shieldRadius(), YELLOW_COLOR);
                    sfx(sndShieldBreak(), x, y, 1.5f, 1f);
                }
            }
            return amount;
        }

        // ------------------------------------------------------------- vòng đời
        @Override
        public void updateTile(){
            if(net.client()) return;
            if(!instances.contains(this)) instances.add(this);
            if(form == DEATH){
                updateDeath();
                return;
            }
            restoreDrones();
            if(asteroidPhase != AST_NONE){ // đang tung Asteroid: không phụ thuộc lưới điện, phạm vi đã bị khóa
                updateAsteroid();
                return;
            }
            if(!hasEnoughPower()) return; // thiếu điện: ngừng hoạt động hoàn toàn

            if(formCooldown > 0f) formCooldown -= Time.delta;
            if(empActiveTimer > 0f) empActiveTimer -= Time.delta;

            secTick = false;
            secondTimer += Time.delta;
            if(secondTimer >= 60f){
                secondTimer -= 60f;
                secTick = true;
            }

            if(pendingForm >= 0){
                tickFormChange();
                return;
            }

            // hồi chiêu chủ động (đóng băng khi đang chuyển dạng vì đã return ở trên)
            if(skillCd < 1f) skillCd = Math.min(1f, skillCd + Time.delta / skillCooldownTicks(form));

            switch(form){
                case YELLOW:
                    updateElectrifiedField();
                    if(level >= 2) updateElectricSphere();
                    if(level >= 3) updateEnergyShield();
                    if(level >= 4){
                        updateMagneticField();
                        updateDualBlade();
                    }
                    break;
                case BLUE:
                    updateBlaster();
                    if(level >= 2) updateMeteor();
                    if(level >= 3) updateDeathLaser();
                    if(level >= 4){
                        updateLimitless();
                        updateRCT();
                    }
                    break;
                case PURPLE:
                    updateIllusion();
                    if(level >= 2) updateDrone();
                    if(level >= 3) updateShapeshifter();
                    if(level >= 4) updateMindControl();
                    break;
                default: break;
            }
        }

        @Override
        public void onDestroyed(){
            // Hypnosis chỉ kích hoạt khi chết ở dạng Purple (không phải Death/Yellow/Blue)
            if(!net.client() && form == PURPLE && level >= 3){
                hypnosis();
            }
            if(!net.client()) killDrones(); // Thermion chết -> drone chết
            super.onDestroyed();
        }

        @Override
        public void onRemoved(){
            if(!net.client()) killDrones(); // Thermion bị xóa (tháo dỡ / thay thế) -> drone chết
            super.onRemoved();
        }

        /** Dạng Death sau Asteroid: không có kỹ năng, hồi chiêu vẫn chạy; hết 10 phút thì tự trở về dạng Blue. */
        void updateDeath(){
            // hồi chiêu chủ động bị khóa (đóng băng) suốt thời gian ở dạng Death; chỉ hồi lại sau khi trở về dạng Blue
            deathTimer -= Time.delta;
            if(deathTimer <= 0f){
                deathTimer = 0f;
                setForm(BLUE);
                fx(FX_HEAL, x, y, size * tilesize, BLUE_COLOR);
            }
        }

        @Override
        public byte version(){
            return 2; // 1: thêm trạng thái trả góp nâng cấp; 2: thêm deathTimer
        }

        @Override
        public void write(Writes w){
            super.write(w);
            w.b(level);
            w.b(form);
            w.b(pendingForm);
            w.f(formChangeTimer);
            w.f(formCooldown);
            w.f(shield);
            w.f(shieldCooldown);
            w.f(skillCd);
            w.f(empActiveTimer);
            w.b(asteroidPhase);
            w.f(asteroidTimer);
            w.f(asteroidRadius);
            w.f(asteroidTx);
            w.f(asteroidTy);
            for(int i = 0; i < 2; i++){
                w.f(blades[i]);
                w.f(bladeX[i]);
                w.f(bladeY[i]);
            }
            w.s(orbCount);
            w.f(sphereCharge);
            w.i(orbSeed);
            drones.removeAll(d -> d == null || !d.isValid());
            w.s(drones.size);
            for(Unit d : drones) w.i(d.id);
            w.bool(upgrading);
            for(int i = 0; i < MAX_COST_ITEMS; i++) w.i(paid[i]);
            w.f(deathTimer);
        }

        @Override
        public void read(Reads r, byte revision){
            super.read(r, revision);
            level = Mathf.clamp(r.b(), 1, MAX_LEVEL);
            form = r.b();
            pendingForm = r.b();
            formChangeTimer = r.f();
            formCooldown = r.f();
            shield = r.f();
            shieldCooldown = r.f();
            skillCd = r.f();
            empActiveTimer = r.f();
            asteroidPhase = r.b();
            asteroidTimer = r.f();
            asteroidRadius = r.f();
            asteroidTx = r.f();
            asteroidTy = r.f();
            for(int i = 0; i < 2; i++){
                blades[i] = r.f();
                bladeX[i] = r.f();
                bladeY[i] = r.f();
            }
            orbCount = r.s();
            sphereCharge = r.f();
            orbSeed = r.i();
            int dc = r.s();
            savedDroneIds.clear();
            for(int i = 0; i < dc; i++) savedDroneIds.add(r.i());
            if(revision >= 1){
                upgrading = r.bool();
                for(int i = 0; i < MAX_COST_ITEMS; i++) paid[i] = r.i();
            }else{
                clearUpgrade();
            }
            if(revision >= 2) deathTimer = r.f();
            else if(form == DEATH) deathTimer = DEATH_TICKS; // save cũ đang ở Death: bắt đầu đếm 10 phút
            shieldDirty = false;
        }

        // ============================================================= YELLOW
        /** Làm chậm kẻ địch trong affectRadius. */
        public void updateElectrifiedField(){
            if(!every(T_FIELD, 5f)) return;
            float r = affectRadiusWorld();
            StatusEffect s = slowEffects[level - 1];
            for(Unit u : enemyUnits(r)) u.apply(s, 12f);
        }

        /** Vị trí quả cầu thứ i: ngẫu nhiên (theo orbSeed) trong hình tròn bán kính 15 tile quanh tâm khối. */
        float orbX(int i){
            long sd = orbSeed * 977L + i * 2L;
            float a = Mathf.randomSeed(sd, 0f, 360f);
            float rr = SPHERE_SPAWN_RADIUS_TILES * tilesize * (float)Math.sqrt(Mathf.randomSeed(sd + 1L, 0f, 1f));
            return x + Angles.trnsx(a, rr);
        }

        float orbY(int i){
            long sd = orbSeed * 977L + i * 2L;
            float a = Mathf.randomSeed(sd, 0f, 360f);
            float rr = SPHERE_SPAWN_RADIUS_TILES * tilesize * (float)Math.sqrt(Mathf.randomSeed(sd + 1L, 0f, 1f));
            return y + Angles.trnsy(a, rr);
        }

        /** Tích cầu điện (số quả = số địch trong phạm vi), hết chargeTime thì bắn. */
        public void updateElectricSphere(){
            Seq<Unit> enemies = enemyUnits(affectRadiusWorld());
            final int cap = (int)val(SPHERE_MAX, level);
            if(enemies.size > cap){ // quá giới hạn quả cầu: ưu tiên địch gần Thermion nhất
                enemies.sort(u -> u.dst2(this));
                enemies.truncate(cap);
            }
            orbCount = enemies.size;
            if(orbCount == 0){
                sphereCharge = 0f;
                return;
            }
            sphereCharge += Time.delta;
            if(sphereCharge < val(SPHERE_CHARGE, level)) return;
            sphereCharge = 0f;

            BulletType bt = orbBullets[level - 1];
            if(bt == null) return;
            for(int i = 0; i < orbCount; i++){
                Unit t = enemies.get(i);
                float bx = orbX(i), by = orbY(i);
                float ang = Angles.angle(bx, by, t.x, t.y);
                // kéo dài lifetime theo khoảng cách để đạn luôn kịp tới mục tiêu
                float travel = Mathf.dst(t.x - bx, t.y - by) / bt.speed;
                float lifeScl = Math.max(1.5f, travel * 1.8f / bt.lifetime);
                bt.createNet(team, bx, by, ang, -1f, 1f, lifeScl);
                fx(FX_SPHERE, bx, by, ang, YELLOW_COLOR);
            }
            sfx(sndOrbShoot(), x, y, 1.2f, Mathf.random(0.95f, 1.05f)); // cả loạt orb (OrbShootSound.ogg)
            orbSeed++; // lần nạp sau xuất hiện ở các vị trí ngẫu nhiên mới
        }

        public float shieldRadius(){
            return val(T_SHIELD_RADIUS, level) * tilesize;
        }

        /**
         * Máu khiên tối đa = percent% dung tích dự trữ điện (pin) của lưới (cấp 3: 50%, cấp 4: 75%, cấp 5: 100%).
         * Không có pin thì khiên coi như không có. Khiên tự sửa 2 giây một lần bằng điện trong pin,
         * mỗi lần rút tối đa 10% sức chứa tối đa của lưới (1 đơn vị điện = 1 máu khiên).
         * Khiên chặn mọi bullet địch bay vào shieldRadius(): mỗi viên trừ khiên bằng damage của nó.
         */
        public void updateEnergyShield(){
            final float capacity = gridCapacity();
            shieldMax = val(SHIELD_PERCENT, level) / 100f * capacity;
            if(shieldHitCd > 0f) shieldHitCd -= Time.delta;

            if(shieldCooldown > 0f){
                shieldCooldown -= Time.delta;
                if(shieldCooldown <= 0f){
                    shieldCooldown = 0f;
                    shield = Math.max(0f, shieldMax) * SHIELD_START_FRACTION; // hồi lại sau khi vỡ chỉ có 10%, phải rút điện để tăng dần
                    shieldRegenTimer = 0f;
                }
                return;
            }
            if(shieldMax <= 0f){ // không có pin: coi như không có khiên (không phải bị vỡ nên không tính hồi chiêu)
                shield = 0f;
                shieldDirty = true; // có pin trở lại thì nạp đầy
                return;
            }
            if(shieldDirty){
                shield = shieldMax * SHIELD_START_FRACTION; // vừa xuất hiện chỉ có 10% máu tối đa
                shieldDirty = false;
            }
            if(shield > shieldMax) shield = shieldMax;

            // tự sửa: 2 giây một lần, mỗi lần rút tối đa 10% sức chứa tối đa của lưới
            if(shield < shieldMax){
                shieldRegenTimer += Time.delta;
                if(shieldRegenTimer >= SHIELD_REGEN_TICKS){
                    shieldRegenTimer -= SHIELD_REGEN_TICKS;
                    if(power != null && power.graph != null){
                        float want = Math.min(shieldMax - shield, capacity * SHIELD_REGEN_FRACTION);
                        shield += power.graph.useBatteries(want);
                    }
                }
            }else{
                shieldRegenTimer = 0f;
            }

            // chặn bullet địch trong phạm vi khiên
            final float sr = shieldRadius();
            Groups.bullet.intersect(x - sr, y - sr, sr * 2f, sr * 2f, (Bullet b) -> {
                if(shield <= 0f || b.team == team || !b.type.absorbable || !b.within(this, sr)) return;
                shield -= b.damage();
                b.absorb();
                fx(FX_SPHERE, b.x, b.y, 0f, YELLOW_COLOR);
                if(shieldHitCd <= 0f){ // nhiều viên trúng cùng lúc chỉ phát một tiếng
                    shieldHitCd = SHIELD_HIT_SOUND_GAP;
                    sfx(sndShieldHit(), b.x, b.y, 0.7f, Mathf.random(0.9f, 1.1f));
                }
            });
            if(shield <= 0f){
                shield = 0f;
                shieldCooldown = val(SHIELD_COOLDOWN, level);
                fx(FX_SHIELD_BREAK, x, y, sr, YELLOW_COLOR);
                sfx(sndShieldBreak(), x, y, 1.5f, 1f);
            }else{
                // khiên còn hoạt động: đẩy toàn bộ đơn vị địch trong phạm vi khiên ra ngoài (công trình không di chuyển được)
                for(Unit u : enemyUnits(sr)) pushOutOfShield(u);
            }
        }

        /** Đặt thành phần vận tốc hướng ra khỏi tâm khối của đơn vị thành ít nhất SHIELD_PUSH_SPEED (không cộng dồn nên không bị văng quá xa). */
        void pushOutOfShield(Unit u){
            float dx = u.x - x, dy = u.y - y;
            float d = Mathf.len(dx, dy);
            float nx, ny;
            if(d < 0.001f){ // đúng tâm: chọn hướng cố định theo id
                float a = u.id % 360;
                nx = Mathf.cosDeg(a);
                ny = Mathf.sinDeg(a);
            }else{
                nx = dx / d;
                ny = dy / d;
            }
            float radial = u.vel.x * nx + u.vel.y * ny;
            if(radial < SHIELD_PUSH_SPEED){
                float add = SHIELD_PUSH_SPEED - radial;
                u.vel.add(nx * add, ny * add);
            }
        }

        /** Mỗi giây: sát thương chuẩn percent% máu tối đa của địch trong phạm vi. */
        public void updateMagneticField(){
            if(!secTick) return;
            float pct = val(MAGNETIC_PCT, level) / 100f;
            boolean hit = false;
            for(Unit u : enemyUnits(affectRadiusWorld())){
                u.damagePierce(u.maxHealth * pct);
                fx(FX_MAGNETIC, u.x, u.y, YELLOW_COLOR);
                hit = true;
            }
            if(hit) sfx(sndSpark(), x, y, 0.8f, 0.8f);
        }

        /**
         * Lưỡi cưa tròn: cấp 4 = 1 lưỡi, cấp 5 = 2 lưỡi. Sau khi chế tạo xong, mỗi lưỡi tự bay đi
         * tìm địch gần nhất, bám vào cắt (4 lần/giây) rồi tìm mục tiêu mới; không có địch thì quay về quỹ đạo.
         */
        public void updateDualBlade(){
            int count = (int)val(BLADE_COUNT, level);
            float create = val(BLADE_CREATE, level);
            float r = affectRadiusWorld();
            float dmg = val(BLADE_DAMAGE, level);
            float home = size * tilesize * 0.5f + BLADE_RADIUS + 6f; // quỹ đạo chờ nằm ngoài rìa khối
            boolean retarget = every(T_BLADE, 10f);
            Seq<Unit> enemies = null;

            for(int i = 0; i < count; i++){
                if(blades[i] < create){
                    // đang chế tạo: lơ lửng trên quỹ đạo
                    blades[i] += Time.delta;
                    float oa = Time.time * 6f + i * 180f;
                    bladeX[i] = x + Angles.trnsx(oa, home);
                    bladeY[i] = y + Angles.trnsy(oa, home);
                    bladeInit[i] = false;
                    bladeTarget[i] = null;
                    continue;
                }
                if(!bladeInit[i]){
                    bladeX[i] = x;
                    bladeY[i] = y;
                    bladeHit[i] = 0f;
                    bladeInit[i] = true;
                }

                Unit tg = bladeTarget[i];
                if(tg != null && (!tg.isValid() || !tg.within(this, r + tg.hitSize / 2f))) tg = null;
                if(tg == null && retarget){
                    if(enemies == null) enemies = enemyUnits(r);
                    Unit other = count > 1 ? bladeTarget[1 - i] : null;
                    float best = Float.MAX_VALUE;
                    for(Unit u : enemies){
                        float d = Mathf.dst(u.x - bladeX[i], u.y - bladeY[i]) + (u == other ? 400f : 0f);
                        if(d < best){
                            best = d;
                            tg = u;
                        }
                    }
                }
                bladeTarget[i] = tg;

                float tx, ty;
                boolean cutting = false;
                if(tg != null){
                    float reach = tg.hitSize / 2f + 6f;
                    if(Mathf.dst(tg.x - bladeX[i], tg.y - bladeY[i]) <= reach + 4f){
                        float ca = Time.time * 14f + i * 180f; // xoay quanh mục tiêu khi đang cắt
                        tx = tg.x + Angles.trnsx(ca, reach * 0.8f);
                        ty = tg.y + Angles.trnsy(ca, reach * 0.8f);
                        cutting = true;
                    }else{
                        tx = tg.x;
                        ty = tg.y;
                    }
                }else{
                    float ha = Time.time * 6f + i * 180f;
                    tx = x + Angles.trnsx(ha, home);
                    ty = y + Angles.trnsy(ha, home);
                }

                float dx = tx - bladeX[i], dy = ty - bladeY[i];
                float dist = Mathf.dst(dx, dy);
                if(dist > 0.001f){
                    float step = Math.min(dist, BLADE_SPEED * Time.delta);
                    bladeX[i] += dx / dist * step;
                    bladeY[i] += dy / dist * step;
                }

                if(cutting){
                    bladeHit[i] += Time.delta;
                    if(bladeHit[i] >= 15f){
                        bladeHit[i] -= 15f;
                        tg.damage(dmg);
                        float bf = bonusFraction(gridCapacity()) * BONUS_BLADE_SCALE; // nội tại: một nửa hiệu quả với DualBlade
                        if(bf > 0f && tg.isValid()) tg.damage(tg.maxHealth * bf);
                        fx(FX_BLADE_SLASH, tg.x, tg.y, Mathf.random(360f), YELLOW_COLOR);
                        sfx(sndBladeHit(), tg.x, tg.y, 1.2f, Mathf.random(0.9f, 1.1f)); // DualBladeHitSound.ogg
                    }
                }
            }
        }

        /** Chủ động: toàn bộ đơn vị + công trình địch trong phạm vi ngừng hoạt động 5s. Hồi 2 phút. */
        public void activateElectromagneticPulse(){
            if(net.client() || form != YELLOW || level < 5 || pendingForm >= 0) return;
            if(!hasEnoughPower() || skillCd < 1f) return;
            skillCd = 0f;
            empActiveTimer = EMP_DURATION;

            float r = affectRadiusWorld();
            for(Unit u : enemyUnits(r)) stun(u, EMP_DURATION);
            for(Building b : enemyBuildings(r)) disableBuilding(b, EMP_DURATION);
            fx(FX_EMP, x, y, r, YELLOW_COLOR);
            sfx(sndPulse(), x, y, 2f, 0.9f);
        }

        // ============================================================= BLUE
        /** Mỗi giây: chance% khóa mục tiêu, bắn 1..level tia laser từ trời, mỗi tia cách nhau 15 tick. */
        public void updateBlaster(){
            if(!secTick) return;
            final float chance = val(BLASTER_CHANCE, level) / 100f;
            final float dmg = val(BLASTER_DAMAGE, level);
            final float extraPct = 0.5f * level / 100f; // (1/2 × level)% máu tối đa
            final float splashRad = val(BLASTER_SPLASH_TILES, level) * tilesize;

            for(Unit u : enemyUnits(affectRadiusWorld())){
                if(!Mathf.chance(chance)) continue;
                final int beams = Mathf.random(1, level);
                final float perBeam = dmg + dmg * beams / 5f;
                final float extra = u.maxHealth * extraPct; // chỉ cộng một lần, không nhân theo số tia

                for(int i = 0; i < beams; i++){
                    final boolean last = i == beams - 1;
                    final float ox = Mathf.range(8f), oy = Mathf.range(6f);
                    Time.run(i * BLASTER_INTERVAL, () -> {
                        if(!u.isValid()) return;
                        fx(FX_BLASTER, u.x + ox, u.y + oy, BLUE_COLOR);
                        Time.run(BLASTER_FALL_TICKS, () -> { // sát thương khi tia chạm đất
                            if(!u.isValid()) return;
                            sfx(sndLaser(), u.x, u.y, 0.9f, Mathf.random(0.9f, 1.2f));
                            u.damage(perBeam);
                            if(last) u.damage(extra);
                            // lan sang kẻ địch bên cạnh: 1/3 sát thương mục tiêu vừa nhận
                            final float splash = (perBeam + (last ? extra : 0f)) * BLASTER_SPLASH_FRAC;
                            for(Unit v : unitsAround(u.x, u.y, splashRad)){
                                if(v != u) v.damage(splash);
                            }
                        });
                    });
                }
            }
        }

        /** Mỗi giây: chance% bị kéo xuống 3..level*3 thiên thạch. Mỗi quả nổ diện rộng + 3 vũng (75% xỉ / 25% dầu). */
        public void updateMeteor(){
            if(!secTick) return;
            final float chance = val(METEOR_CHANCE, level) / 100f;
            final float pct = val(METEOR_DAMAGE, level) / 100f;
            final float flat = val(METEOR_FLAT, level);
            final float rad = METEOR_RADIUS_TILES * tilesize;

            for(Unit u : enemyUnits(affectRadiusWorld())){
                if(!Mathf.chance(chance)) continue;
                int count = Mathf.random(3, level * 3);
                for(int i = 0; i < count; i++){
                    final float d = Mathf.random(0f, 25f);
                    final float ix = u.x + Mathf.range(tilesize * 2f), iy = u.y + Mathf.range(tilesize * 2f);
                    Time.run(d, () -> fx(FX_METEOR, ix, iy, rad, Color.orange));
                    Time.run(d + METEOR_FALL_TICKS, () -> meteorImpact(ix, iy, rad, pct, flat));
                }
            }
        }

        /** Thiên thạch chạm đất: sát thương % máu tối đa + sát thương số cho mọi địch trong bán kính, và các vũng xỉ. */
        void meteorImpact(float ix, float iy, float rad, float pct, float flat){
            sfx(sndMeteorHit(), ix, iy, 1.4f, Mathf.random(0.9f, 1.1f)); // MeteoroidHitSound.ogg
            for(Unit v : unitsAround(ix, iy, rad)){
                v.damage(v.maxHealth * pct + flat);
            }
            // mỗi quả: 75% để lại vũng xỉ, 25% để lại vũng dầu
            final mindustry.type.Liquid liq = Mathf.chance(METEOR_SLAG_CHANCE) ? Liquids.slag : Liquids.oil;
            for(int k = 0; k < METEOR_PUDDLES; k++){
                Tile t = world.tileWorld(ix + Mathf.range(rad), iy + Mathf.range(rad));
                if(t != null) Puddles.deposit(t, liq, 20f);
            }
        }

        /** Tia laser liên tục + giảm 50% hoạt động trong 2×level tile + nổ sau khi bắn xong. */
        public void updateDeathLaser(){
            // khóa mục tiêu mới
            if(secTick){
                float chance = val(LASER_CHANCE, level) / 100f;
                for(Unit u : enemyUnits(affectRadiusWorld())){
                    if(!Mathf.chance(chance)) continue;
                    LaserBeam b = new LaserBeam();
                    b.target = u;
                    b.tx = u.x;
                    b.ty = u.y;
                    b.timeLeft = val(LASER_TIME, level) * 60f;
                    lasers.add(b);
                    sfx(sndDeathLaserLoop(), u.x, u.y, 2f, 1f); // DeathLaserLoop.ogg, phát lại bên dưới khi tia còn bắn
                }
            }

            float range = 2f * level * tilesize;
            float dps = val(LASER_DAMAGE, level);

            for(int i = lasers.size - 1; i >= 0; i--){
                LaserBeam b = lasers.get(i);
                if(b.target != null && b.target.isValid()){
                    b.tx = b.target.x;
                    b.ty = b.target.y;
                }

                b.timeLeft -= Time.delta;
                b.secTimer += Time.delta;
                b.loopTimer += Time.delta;
                if(b.loopTimer >= DEATH_LASER_LOOP_TICKS){ // lặp tiếng tia laser cho tới khi bắn xong
                    b.loopTimer -= DEATH_LASER_LOOP_TICKS;
                    if(b.timeLeft > DEATH_LASER_LOOP_TICKS * 0.5f) sfx(sndDeathLaserLoop(), b.tx, b.ty, 2f, 1f);
                }
                b.weakenTimer += Time.delta;
                b.fxTimer += Time.delta;
                if(b.fxTimer >= 5f){ // tia laser từ trời xuống mục tiêu + vùng giảm hoạt động
                    b.fxTimer = 0f;
                    fx(FX_DEATH_LASER, b.tx, b.ty, range, BLUE_COLOR);
                }

                // giảm 50% khả năng hoạt động trong phạm vi
                if(b.weakenTimer >= 10f){
                    b.weakenTimer = 0f;
                    for(Unit u : unitsAround(b.tx, b.ty, range)) u.apply(weakened, 20f);
                    for(Building e : buildingsAround(b.tx, b.ty, range)) e.applySlowdown(0.5f, 20f);
                }

                // damage mỗi giây
                if(b.secTimer >= 60f){
                    b.secTimer -= 60f;
                    if(b.target != null && b.target.isValid()){
                        b.target.damage(dps);
                        // kẻ địch khác trong phạm vi nhận 1/2 sát thương mà mục tiêu nhận
                        for(Unit v : unitsAround(b.tx, b.ty, range)){
                            if(v != b.target) v.damage(dps * LASER_SPLASH_FRAC);
                        }
                    }
                }

                // kết thúc -> nổ (chỉ sau khi bắn xong)
                if(b.timeLeft <= 0f){
                    float pct = Mathf.random(2, 5) * level / 100f;
                    for(Unit u : unitsAround(b.tx, b.ty, range)){
                        u.damage(u.maxHealth * pct);
                    }
                    fx(FX_DEATH_BLAST, b.tx, b.ty, range, BLUE_COLOR);
                    sfx(sndDeathLaserBlast(), b.tx, b.ty, 1.2f, Mathf.random(0.95f, 1.05f)); // DeathLaserExplosion.ogg
                    lasers.remove(i);
                }
            }
        }

        Seq<Unit> unitsAround(float cx, float cy, float rWorld){
            Seq<Unit> out = new Seq<>();
            Units.nearbyEnemies(team, cx - rWorld, cy - rWorld, rWorld * 2f, rWorld * 2f, u -> {
                if(u.isValid() && u.within(cx, cy, rWorld + u.hitSize / 2f)) out.add(u);
            });
            return out;
        }

        Seq<Building> buildingsAround(float cx, float cy, float rWorld){
            Seq<Building> out = new Seq<>();
            indexer.allBuildings(cx, cy, rWorld, b -> {
                if(b.team != team && b.team != Team.derelict) out.add(b);
            });
            return out;
        }

        /** Trong 1/3 affectRadius, mọi bullet không cùng team mất 5% (cấp 5: 10%) tốc độ ban đầu mỗi giây. */
        public void updateLimitless(){
            final float r = affectRadiusWorld() / LIMITLESS_RADIUS_DIV;
            if(r <= 0f) return;
            final float pct = val(LIMITLESS_DECAY_PCT, level) / 100f;
            if(pct <= 0f) return;
            Groups.bullet.intersect(x - r, y - r, r * 2f, r * 2f, (Bullet b) -> {
                if(b.team == team || !b.within(this, r)) return;
                float spd = b.vel.len();
                if(spd <= 0.0001f) return;
                // bullet có type.speed = 0 (laser, đạn tăng tốc...) thì lấy tốc độ hiện tại làm gốc để vẫn bị chậm
                float base = b.type.speed > 0.0001f ? b.type.speed : spd;
                float dec = base * pct / 60f * Time.delta;
                b.vel.setLength(Math.max(0f, spd - dec));
            });
        }

        /** Mỗi `time` tick hồi amount% máu tối đa. */
        public void updateRCT(){
            if(!every(T_RCT, val(RCT_TIME, level))) return;
            heal(maxHealth() * val(RCT_AMOUNT, level) / 100f);
            fx(FX_HEAL, x, y, size * tilesize, BLUE_COLOR);
        }

        /** Chủ động: bắt đầu gồng chiêu. Khóa chuyển dạng và khóa phạm vi ảnh hưởng cho tới khi chuyển sang Death. */
        public void activateAsteroid(){
            if(net.client() || form != BLUE || level < 5 || pendingForm >= 0 || asteroidPhase != AST_NONE) return;
            if(!hasEnoughPower() || skillCd < 1f) return;
            skillCd = 0f;
            // Khóa phạm vi TRƯỚC khi đổi pha: nếu đổi pha trước, affectRadius() sẽ trả về asteroidRadius cũ (= 0)
            asteroidRadius = liveAffectRadius() * tilesize;
            asteroidPhase = AST_CHARGE;
            asteroidTimer = ASTEROID_CHARGE_TICKS;
            // khối ở nửa trái bản đồ chiếu tia về (2W, 2H), nửa phải về (-W, 2H)
            float w = world.unitWidth(), h = world.unitHeight();
            asteroidTx = x < w / 2f ? 2f * w : -w;
            asteroidTy = 2f * h;
            lasers.clear();
            chargeLoopTimer = DEATH_LASER_LOOP_TICKS; // phát tiếng loop ngay tick đầu tiên
        }

        /** Gồng -> tiểu hành tinh bay về tâm bản đồ -> va chạm. Địch trong phạm vi luôn bị đóng băng. */
        void updateAsteroid(){
            final float r = asteroidRadius;

            if(every(T_ASTEROID, 5f)){
                for(Unit u : enemyUnits(r)) stun(u, 20f);
                for(Building b : enemyBuildings(r)) disableBuilding(b, 20f);
            }
            Groups.bullet.intersect(x - r, y - r, r * 2f, r * 2f, (Bullet b) -> {
                if(b.team != team && b.within(this, r)) b.vel.setZero();
            });

            // đang gồng: lặp DeathLaserLoop.ogg (0,78 s) tại khối cho tới hết thời gian gồng
            if(asteroidPhase == AST_CHARGE){
                chargeLoopTimer += Time.delta;
                if(chargeLoopTimer >= DEATH_LASER_LOOP_TICKS){
                    chargeLoopTimer -= DEATH_LASER_LOOP_TICKS;
                    if(asteroidTimer > DEATH_LASER_LOOP_TICKS * 0.5f) sfx(sndDeathLaserLoop(), x, y, 2f, 1f);
                }
            }

            asteroidTimer -= Time.delta;
            if(asteroidTimer > 0f) return;

            if(asteroidPhase == AST_CHARGE){
                asteroidPhase = AST_FALL;
                asteroidTimer = ASTEROID_TRAVEL_TICKS;
                fx(FX_ASTEROID_FALL, asteroidTx, asteroidTy, Mathf.random(1f, 1000f), Color.orange); // rotation = seed hố thiên thạch
            }else if(asteroidPhase == AST_FALL){
                asteroidStrike();
            }
        }

        /**
         * Va chạm: duyệt toàn bộ unit và block trên bản đồ, đưa vào danh sách nếu không phải Thermion
         * và không nằm trong phạm vi ảnh hưởng đã khóa. Duyệt xong mới gọi kill().
         */
        void asteroidStrike(){
            final float r = asteroidRadius;
            final float cx = world.unitWidth() / 2f, cy = world.unitHeight() / 2f;

            final Seq<Unit> doomedUnits = new Seq<>();
            Groups.unit.each(u -> {
                if(u.isValid() && !u.within(this, r)) doomedUnits.add(u);
            });

            final Seq<Building> doomedBuilds = new Seq<>();
            Groups.build.each(b -> {
                if(b == null || !b.isValid() || b instanceof ThermionBuild || b.within(this, r)) return;
                doomedBuilds.add(b);
            });

            fx(FX_ASTEROID_FLASH, cx, cy, 0f, Color.white);
            fx(FX_ASTEROID_QUAKE, cx, cy, 0f, Color.orange);
            fx(FX_ASTEROID_IMPACT, cx, cy, Mathf.dst(cx, cy), Color.orange);
            fx(FX_ASTEROID_MUSHROOM, cx, cy, MUSHROOM_TILES * tilesize, Color.orange);

            for(Unit u : doomedUnits){
                fx(FX_BLAST, u.x, u.y, u.hitSize, Color.orange);
                u.kill();
            }
            for(Building b : doomedBuilds){
                fx(FX_BLAST, b.x, b.y, b.block.size * tilesize, Color.orange);
                b.kill();
            }

            setForm(DEATH); // sau khi tung chiêu -> dạng Death 10 phút (đồng thời đặt lại asteroidPhase), rồi tự về dạng Blue
        }

        // ============================================================= PURPLE
        /** Mỗi `time` giây, mỗi địch chance% rơi vào ảo giác, vô hiệu duration giây (giảm theo giáp). */
        public void updateIllusion(){
            if(!every(T_ILLUSION, val(ILLUSION_TIME, level) * 60f)) return;
            float chance = val(ILLUSION_CHANCE, level) / 100f;
            float base = val(ILLUSION_DURATION, level) * 60f;
            for(Unit u : enemyUnits(affectRadiusWorld())){
                if(!Mathf.chance(chance)) continue;
                float dur = base * (1f - Mathf.clamp(u.armor / 100f));
                if(dur > 0f){
                    stun(u, dur);
                    fx(FX_PURPLE_BURST, u.x, u.y, PURPLE_COLOR);
                }
            }
        }

        /** Mỗi `time` giây triệu hồi 1 drone (level 4+: Drone V2), không giới hạn số lượng. */
        public void updateDrone(){
            drones.removeAll(d -> d == null || !d.isValid());
            if(!every(T_DRONE, val(DRONE_TIME, level) * 60f)) return;
            // không giới hạn số lượng; level 4+ triệu hồi Drone V2 thay cho drone thường
            UnitType type = level >= DRONE_V2_LEVEL && droneV2Type != null ? droneV2Type : droneType != null ? droneType : UnitTypes.flare;
            Unit d = type.create(team);
            float off = size * tilesize / 2f;
            d.set(x + Mathf.range(off), y + Mathf.range(off));
            DroneAI ai = new DroneAI();
            ai.owner = this;
            d.controller(ai);
            d.add();
            drones.add(d);
            fx(FX_PURPLE_BURST, d.x, d.y, PURPLE_COLOR);
        }

        /**
         * Mỗi `time` giây, địch chance% bị khóa mục tiêu. Chụp lại chỉ số hiện tại của mục tiêu,
         * 2 giây sau tạo một unit cùng loại với chỉ số y hệt lúc đó (Time.run).
         */
        public void updateShapeshifter(){
            if(!every(T_SHAPE, val(SHAPE_TIME, level) * 60f)) return;
            float chance = val(SHAPE_CHANCE, level) / 100f;
            final Team tm = team;

            for(Unit u : enemyUnits(affectRadiusWorld())){
                if(!Mathf.chance(chance)) continue;

                final UnitType snapType = u.type;
                final float sx = u.x, sy = u.y, srot = u.rotation;
                final float shp = u.health, smax = u.maxHealth, ssh = u.shield, sarm = u.armor;
                fx(FX_SHAPE, sx, sy, PURPLE_COLOR);

                Time.run(SHAPE_DELAY_TICKS, () -> {
                    if(net.client()) return;
                    Unit s = snapType.create(tm);
                    s.set(sx, sy);
                    s.rotation = srot;
                    s.maxHealth = smax;
                    s.health = shp;
                    s.shield = ssh;
                    s.armor = sarm;
                    s.add();
                    fx(FX_SHAPE, sx, sy, PURPLE_COLOR);
                });
            }
        }

        /** Mỗi `time` giây, địch chance% biến thành đồng minh. */
        public void updateMindControl(){
            if(!every(T_MIND, val(MIND_TIME, level) * 60f)) return;
            float chance = val(MIND_CHANCE, level) / 100f;
            for(Unit u : enemyUnits(affectRadiusWorld())){
                if(!Mathf.chance(chance)) continue;
                convert(u);
            }
        }

        void convert(Unit u){
            u.team(team);
            u.resetController();
            fx(FX_MIND, u.x, u.y, u.hitSize, PURPLE_COLOR);
        }

        /** Chủ động: kích hoạt Hypnosis không cần chết. Hồi 3 phút. */
        public void activateMegaHypnosis(){
            if(net.client() || form != PURPLE || level < 5 || pendingForm >= 0) return;
            if(!hasEnoughPower() || skillCd < 1f) return;
            skillCd = 0f;
            hypnosis();
        }

        /** Biến toàn bộ unit địch trong affectRadius thành đồng minh. */
        public void hypnosis(){
            float r = affectRadiusWorld();
            fx(FX_HYPNOSIS, x, y, r, PURPLE_COLOR);
            for(Unit u : enemyUnits(r)) convert(u);
        }

        // ============================================================= điều khiển / UI
        void activateActiveSkill(){
            switch(form){
                case YELLOW: activateElectromagneticPulse(); break;
                case BLUE: activateAsteroid(); break;
                case PURPLE: activateMegaHypnosis(); break;
                default: break;
            }
        }

        void handleConfig(int v){
            if(v >= YELLOW && v <= PURPLE) requestForm(v);
            else if(v == CFG_ACTIVE) activateActiveSkill();
            else if(v == CFG_UPGRADE) startUpgrade(); // mua bằng tài nguyên trong core, thiếu thì trả góp
        }

        @Override
        public void buildConfiguration(Table table){
            table.button("Yellow", Styles.flatBordert, () -> configure(YELLOW)).size(90f, 40f).disabled(b -> !canChangeForm(YELLOW));
            table.button("Blue", Styles.flatBordert, () -> configure(BLUE)).size(90f, 40f).disabled(b -> !canChangeForm(BLUE));
            table.button("Purple", Styles.flatBordert, () -> configure(PURPLE)).size(90f, 40f).disabled(b -> !canChangeForm(PURPLE));
            table.row();
            table.button(tr("Active skill", "Kỹ năng chủ động"), Styles.flatBordert, () -> configure(CFG_ACTIVE)).colspan(3).growX().height(40f)
                .disabled(b -> level < 5 || form == DEATH || asteroidPhase != AST_NONE);
            table.row();
            table.table(t -> {
                t.button(tr("Upgrade", "Nâng cấp"), Styles.flatBordert, this::showUpgradeDialog).size(135f, 40f)
                    .disabled(b -> level >= MAX_LEVEL || form == DEATH);
                t.button(tr("Info", "Thông tin"), Styles.flatBordert, this::showInfoDialog).size(135f, 40f);
            }).colspan(3).growX();
        }

        // ============================================================= nâng cấp (trả góp)
        /** Lượng tài nguyên thứ i còn phải trả. */
        int remaining(ItemStack[] cost, int i){
            return Math.max(0, cost[i].amount - paid[i]);
        }

        /** Lõi đang có ít nhất một loại tài nguyên còn thiếu để trả. */
        boolean canPayAny(){
            ItemStack[] cost = upgradeCost(level);
            Building c = core();
            if(cost == null || c == null) return false;
            if(isSandbox()) return true; // giá 0: luôn nâng được
            for(int i = 0; i < cost.length; i++){
                if(remaining(cost, i) > 0 && c.items.get(cost[i].item) > 0) return true;
            }
            return false;
        }

        public boolean canUpgrade(){
            return level < MAX_LEVEL && form != DEATH && asteroidPhase == AST_NONE && canPayAny();
        }

        void clearUpgrade(){
            upgrading = false;
            for(int i = 0; i < paid.length; i++) paid[i] = 0;
        }

        int paidTotal(){
            int sum = 0;
            for(int v : paid) sum += v;
            return sum;
        }

        /** Tiến độ trả góp 0..1 (trung bình tiến độ từng loại tài nguyên). */
        float paidFraction(){
            ItemStack[] cost = upgradeCost(level);
            if(cost == null || cost.length == 0) return 1f;
            float sum = 0f;
            for(int i = 0; i < cost.length; i++) sum += cost[i].amount <= 0 ? 1f : Math.min(1f, paid[i] / (float)cost[i].amount);
            return sum / cost.length;
        }

        /** Server: mỗi lần bấm chỉ trả MỘT lần, lấy đúng lượng tài nguyên lõi đang có. Đủ hết thì lên cấp. */
        void startUpgrade(){
            if(net.client() || !canUpgrade()) return;
            payInstallment();
        }

        void payInstallment(){
            ItemStack[] cost = upgradeCost(level);
            if(cost == null){
                clearUpgrade();
                return;
            }
            Building c = core();
            if(c == null) return;

            boolean done = true, took = false;
            for(int i = 0; i < cost.length; i++){
                int need = remaining(cost, i);
                if(need > 0){
                    int take = Math.min(need, c.items.get(cost[i].item));
                    if(take > 0){
                        c.items.remove(cost[i].item, take);
                        paid[i] += take;
                        took = true;
                    }
                }
                if(paid[i] < cost[i].amount) done = false;
            }
            if(took) upgrading = true;
            if(done) setLevel(level + 1); // setLevel xóa trạng thái trả góp
        }

        int coreAmount(ItemStack s){
            Building c = core();
            return c == null ? 0 : c.items.get(s.item);
        }

        /** "Tên: a -> b" với giá trị mới được tô nổi. */
        String changeLine(String label, float a, float b, String unit){
            return label + ": " + fmt(a) + unit + " -> [accent]" + fmt(b) + unit + "[]";
        }

        float maxHealthAt(int f, int lv){
            return block.health * (1f + formHealthBonus(f, lv) / 100f);
        }

        void showUpgradeDialog(){
            final BaseDialog d = new BaseDialog(tr("Upgrade Thermion", "Nâng cấp Thermion"));
            addBackButton(d);
            final Table body = new Table();
            final int[] sig = {Integer.MIN_VALUE};
            body.update(() -> { // dựng lại khi level / tiến độ trả góp / ngôn ngữ đổi
                int sg = level * 1000003 + paidTotal() * 31 + (vi() ? 1 : 0) + (isSandbox() ? 7 : 0);
                if(sig[0] != sg){
                    sig[0] = sg;
                    buildUpgradeBody(body);
                }
            });
            dialogPane(d, p -> p.add(body).width(dialogWidth() - 30f).left());
            d.show();
        }

        void buildUpgradeBody(Table t){
            t.clear();
            t.defaults().left().pad(3f);
            final float cw = dialogWidth() - 90f; // bề rộng nội dung trong card

            final ItemStack[] cost = upgradeCost(level);
            if(cost == null){
                t.add(tr("Maximum level reached.", "Đã đạt cấp tối đa.")).row();
                return;
            }
            final int next = level + 1;

            t.add("[accent]Level " + level + "  ->  " + next + "[]").padTop(4f).row();

            // ---- tài nguyên
            section(t, tr("Resources", "Tài nguyên"));
            t.table(c -> {
                c.defaults().left().pad(3f);
                for(int i = 0; i < cost.length; i++){
                    final int idx = i;
                    final ItemStack s = cost[i];
                    c.image(s.item.uiIcon).size(26f).padRight(6f);
                    c.add(s.item.localizedName).padRight(10f);
                    c.label(() -> {
                        int have = coreAmount(s);
                        int rem = Math.max(0, s.amount - paid[idx]);
                        String col = rem == 0 ? "[lightgray]" : have >= rem ? "[green]" : "[scarlet]";
                        return col + have + "[] / " + rem + (paid[idx] > 0 ? "  [lightgray](" + paid[idx] + "/" + s.amount + ")[]" : "");
                    });
                    c.row();
                }
                c.add(new Bar(() -> tr("Paid ", "Đã trả ") + (int)(paidFraction() * 100f) + "%", () -> Pal.accent, this::paidFraction))
                    .colspan(3).growX().height(26f).padTop(6f).row();
                wrapLabel(c, () -> "[lightgray]" + tr("In core / still needed  (paid / total)", "Trong lõi / còn cần  (đã trả / tổng)") + "[]", cw).colspan(3).row();
            }).growX().padLeft(CONTENT_INDENT).row();

            // ---- cách trả góp
            t.table(c -> wrapLabel(c, () -> tr(
                "Pressing the button pays once, taking only what the core currently holds. Come back and press again to pay more; the upgrade completes automatically when everything is paid.",
                "Mỗi lần bấm chỉ trả một lần, lấy đúng lượng tài nguyên lõi đang có. Quay lại bấm tiếp để trả thêm; đủ tất cả thì tự lên cấp."), cw).row()).growX().padTop(4f).padLeft(CONTENT_INDENT).row();

            // ---- skill mới
            section(t, tr("New skills", "Kỹ năng mới"));
            t.table(c -> {
                c.defaults().left().pad(3f);
                final boolean[] any = {false};
                for(int f = YELLOW; f <= PURPLE; f++){
                    for(final Skill sk : SKILLS[f]){
                        if(sk.unlock != next) continue;
                        any[0] = true;
                        c.add(colorTag(f) + formName(f) + "[]: " + colorTag(f) + sk.name + "[]" + (sk.active ? "  [accent](" + tr("active", "chủ động") + ")[]" : "")).padTop(4f).row();
                        wrapLabel(c, () -> "[lightgray]" + sk.desc() + "[]", cw).row();
                    }
                }
                if(!any[0]) c.add(tr("(none)", "(không có)")).row();
            }).growX().padLeft(CONTENT_INDENT).row();

            // ---- thay đổi chỉ số
            section(t, tr("Stat changes", "Thay đổi chỉ số"));
            t.table(c -> {
                c.defaults().left().pad(3f);
                c.add("[accent]" + tr("General", "Chung") + "[]").row();
                wrapLabel(c, () -> changeLine(tr("Power required", "Điện yêu cầu"), powerRequirement(level), powerRequirement(next), " /s"), cw).row();
                wrapLabel(c, () -> changeLine(tr("Form change time", "Thời gian đổi dạng"), val(FORM_CHANGE_TIME_SEC, level), val(FORM_CHANGE_TIME_SEC, next), "s"), cw).row();
                wrapLabel(c, () -> changeLine(tr("Form reload", "Hồi chiêu đổi dạng"), val(FORM_CHANGE_COOLDOWN_SEC, level), val(FORM_CHANGE_COOLDOWN_SEC, next), "s"), cw).row();

                for(int f = YELLOW; f <= PURPLE; f++){
                    final int fm = f;
                    c.add(colorTag(f) + formName(f) + "[]").padTop(8f).row();
                    wrapLabel(c, () -> changeLine(tr("Max health", "Máu tối đa"), maxHealthAt(fm, level), maxHealthAt(fm, next), ""), cw).row();
                    for(final Skill sk : SKILLS[f]){
                        if(sk.unlock > level) continue;
                        for(final Stat st : sk.stats){
                            final float a = st.at(level), b = st.at(next);
                            if(Math.abs(a - b) < 0.0001f) continue;
                            wrapLabel(c, () -> colorTag(fm) + sk.name + "[] - " + changeLine(st.label(), a, b, st.unit), cw).row();
                        }
                    }
                }
            }).growX().padLeft(CONTENT_INDENT).row();

            // ---- nút
            Cell<TextButton> ub = t.button("", grayBtn(), () -> configure(CFG_UPGRADE)).growX().height(46f).padTop(12f);
            ub.disabled(b -> !canUpgrade());
            final TextButton tb = ub.get();
            tb.update(() -> tb.setText(upgrading ? tr("Pay installment", "Trả góp") : tr("Upgrade", "Nâng cấp")));
            t.row();
            wrapLabel(t, () -> canUpgrade() ? "" : "[lightgray]" + tr("The core holds none of the missing resources right now.", "Lõi hiện không có tài nguyên nào còn thiếu.") + "[]", cw).row();
        }

        // ============================================================= info
        void showInfoDialog(){
            final BaseDialog d = new BaseDialog(tr("Thermion Info", "Thông tin Thermion"));
            addBackButton(d);
            final Table body = new Table();
            final int[] sig = {-1};
            body.update(() -> { // dựng lại khi đổi ngôn ngữ hoặc đổi level
                int sg = (vi() ? 1 : 0) + level * 2;
                if(sig[0] != sg){
                    sig[0] = sg;
                    buildInfoBody(body);
                }
            });
            dialogPane(d, p -> p.add(body).width(dialogWidth() - 30f).left());
            d.show();
        }

        void buildInfoBody(Table t){
            t.clear();
            t.defaults().left().pad(3f);
            final float cw = dialogWidth() - 90f;

            // ---- ngôn ngữ
            t.table(row -> {
                row.add(tr("Language: ", "Ngôn ngữ: ")).padRight(8f);
                row.button(vi() ? "Tiếng Việt" : "English", grayBtn(), () -> Core.settings.put("thermion-lang", vi() ? "en" : "vi")).size(140f, 36f);
            }).left().row();

            // ---- tổng quan
            section(t, tr("Overview", "Tổng quan"));
            t.table(c -> {
                c.defaults().left().pad(3f);
                wrapLabel(c, () -> tr(
                    "Thermion is a 5x5 multi-form war machine powered by your grid. It needs a minimum power output to operate, and a bigger power surplus gives it a bigger affect radius. It can switch between three forms, each with its own passive skills, and unlocks more skills as it levels up. At level 5 every form gains a powerful active skill.",
                    "Thermion là cỗ máy chiến tranh 5x5 nhiều dạng chạy bằng lưới điện của bạn. Nó cần một công suất điện tối thiểu để hoạt động, và phần điện dư càng lớn thì phạm vi ảnh hưởng càng rộng. Thermion có thể đổi giữa ba dạng, mỗi dạng có các kỹ năng bị động riêng, và mở khóa thêm kỹ năng khi lên cấp. Ở level 5, mỗi dạng có thêm một kỹ năng chủ động mạnh."), cw).row();
                c.label(() -> tr("Level: ", "Cấp: ") + level + " / " + MAX_LEVEL).row();
                c.label(() -> tr("Form: ", "Dạng: ") + colorTag(form) + formName(form) + "[]").row();
                c.label(() -> {
                    float prod = totalPowerProduction(), req = powerRequirement(level);
                    return tr("Power output: ", "Công suất điện: ") + (prod >= req ? "[green]" : "[scarlet]") + fmt(prod) + "[] / " + fmt(req) + " /s";
                }).row();
                c.label(() -> tr("Affect radius: ", "Phạm vi ảnh hưởng: ") + Strings.fixed(affectRadius(), 1) + tr(" tiles", " tile")).row();
                c.label(() -> tr("Max health: ", "Máu tối đa: ") + fmt(maxHealth())).row();
            }).growX().padLeft(CONTENT_INDENT).row();

            // ---- tiến trình theo cấp
            section(t, tr("Level progression", "Tiến trình theo cấp"));
            t.table(c -> {
                c.defaults().pad(4f);
                String[] heads = {tr("Lv", "Cấp"), tr("Power /s", "Điện /s"), tr("Switch", "Đổi dạng"), tr("Reload", "Hồi"), tr("Max HP +", "Máu tối đa +")};
                for(String h : heads) c.add("[lightgray]" + h + "[]");
                c.row();
                for(int lv = 1; lv <= MAX_LEVEL; lv++){
                    final int L = lv;
                    String[] cells = {
                        String.valueOf(L),
                        fmt(powerRequirement(L)),
                        fmt(val(FORM_CHANGE_TIME_SEC, L)) + "s",
                        fmt(val(FORM_CHANGE_COOLDOWN_SEC, L)) + "s",
                        colorTag(YELLOW) + fmt(formHealthBonus(YELLOW, L)) + "[]/" + colorTag(BLUE) + fmt(formHealthBonus(BLUE, L)) + "[]/" + colorTag(PURPLE) + fmt(formHealthBonus(PURPLE, L)) + "[]%"
                    };
                    for(final String cell : cells) c.label(() -> (L == level ? "[accent]" : "") + cell);
                    c.row();
                }
                wrapLabel(c, () -> "[lightgray]" + tr(
                    "Power: minimum output to operate. Switch: time to change form. Reload: wait before changing form again. Max HP: bonus for Yellow / Blue / Purple.",
                    "Điện: công suất tối thiểu để hoạt động. Đổi dạng: thời gian đổi. Hồi: thời gian chờ trước khi đổi dạng lần nữa. Máu tối đa: phần thưởng cho Yellow / Blue / Purple.") + "[]", cw).colspan(5).padTop(4f).row();
            }).growX().padLeft(CONTENT_INDENT).row();

            // ---- ba dạng
            for(int f = YELLOW; f <= PURPLE; f++){
                final int fm = f;
                section(t, formName(f));
                t.table(c -> {
                    c.defaults().left().pad(3f);
                    wrapLabel(c, () -> formRole(fm), cw).row();
                    boolean anyUnlocked = false;
                    for(Skill sk : SKILLS[fm]) if(sk.unlock <= level) anyUnlocked = true;
                    if(anyUnlocked) c.add("[accent]" + tr("Skills (tap for details)", "Kỹ năng (bấm để xem chi tiết)") + "[]").padTop(6f).row();
                    for(final Skill sk : SKILLS[fm]){
                        if(sk.unlock > level) continue; // chưa mở khoá thì không hiện
                        c.table(row -> {
                            row.defaults().left();
                            row.button(colorTag(fm) + sk.name + "[]" + (sk.active ? "  (" + tr("active", "chủ động") + ")" : ""), grayBtn(), () -> showSkillDialog(fm, sk))
                                .width(cw - 90f).height(38f);
                            row.label(() -> (level >= sk.unlock ? "[green]" : "[scarlet]") + "Lv" + sk.unlock + "[]").padLeft(8f).width(70f);
                        }).left().row();
                    }
                }).growX().padLeft(CONTENT_INDENT).row();
            }

            // ---- Death
            section(t, "Death");
            t.table(c -> wrapLabel(c, () -> tr(
                "After Asteroid, Thermion collapses into Death form for 10 minutes: no skills, no form change and no upgrades. Then it reawakens in Blue form. Asteroid's cooldown keeps running meanwhile.",
                "Sau Asteroid, Thermion rơi vào dạng Death trong 10 phút: không có kỹ năng, không đổi dạng và không nâng cấp. Sau đó nó tự trở về dạng Blue. Hồi chiêu Asteroid vẫn chạy trong thời gian này."), cw).row()).growX().padLeft(CONTENT_INDENT).row();

            // ---- lưu ý
            section(t, tr("Good to know", "Cần biết"));
            t.table(c -> {
                c.defaults().left().pad(3f);
                wrapLabel(c, () -> tr("- If the power output drops below the requirement, Thermion stops working completely.", "- Nếu công suất điện thấp hơn mức yêu cầu, Thermion ngừng hoạt động hoàn toàn."), cw).row();
                wrapLabel(c, () -> tr("- Changing form takes a few seconds, then needs a reload before the next change.", "- Đổi dạng mất vài giây, sau đó cần thời gian hồi trước khi đổi tiếp."), cw).row();
                wrapLabel(c, () -> tr("- Active skills share one cooldown across all forms; it freezes while changing form.", "- Mọi kỹ năng chủ động dùng chung một thời gian hồi cho cả ba dạng; hồi chiêu đóng băng khi đang đổi dạng."), cw).row();
                wrapLabel(c, () -> tr("- Upgrades are paid from the core and can be paid in installments.", "- Nâng cấp được trả bằng tài nguyên trong lõi và có thể trả góp."), cw).row();
            }).growX().padLeft(CONTENT_INDENT).row();
        }

        void showSkillDialog(final int f, final Skill sk){
            final BaseDialog d = new BaseDialog(colorTag(f) + sk.name + "[]");
            addBackButton(d);
            dialogPane(d, p -> {
                p.defaults().left().pad(3f);
                final float cw = dialogWidth() - 90f;
                p.add(colorTag(f) + formName(f) + "[] - " + (sk.active ? tr("Active", "Chủ động") : tr("Passive", "Bị động"))).row();
                p.label(() -> level >= sk.unlock
                    ? "[green]" + tr("Unlocked", "Đã mở khóa") + "[]"
                    : "[scarlet]" + tr("Locked - needs level ", "Chưa mở khóa - cần level ") + sk.unlock + tr(" (current: ", " (hiện tại: ") + level + ")[]").row();

                section(p, tr("Description", "Mô tả"));
                p.table(c -> wrapLabel(c, () -> sk.desc(), cw).row()).growX().padLeft(CONTENT_INDENT).row();

                if(sk.stats.length > 0){
                    section(p, tr("Stats by level", "Chỉ số theo cấp"));
                    p.table(c -> {
                        c.defaults().pad(4f);
                        // hàng tiêu đề: Lv a, Lv b, ... (level hiện tại tô nổi)
                        c.add("");
                        for(int lv = sk.unlock; lv <= MAX_LEVEL; lv++){
                            final int L = lv;
                            c.label(() -> (L == level ? "[accent]" : "[lightgray]") + "Lv" + L + "[]");
                        }
                        c.row();
                        for(final Stat st : sk.stats){
                            c.label(() -> st.label()).width(150f).left().get().setWrap(true);
                            for(int lv = sk.unlock; lv <= MAX_LEVEL; lv++){
                                final int L = lv;
                                c.label(() -> (L == level ? "[accent]" : L < level ? "" : "[lightgray]") + fmt(st.at(L)) + st.unit);
                            }
                            c.row();
                        }
                    }).growX().padLeft(CONTENT_INDENT).row();
                }
            });
            d.show();
        }

        @Override
        public Object config(){
            return null;
        }

        // ============================================================= bar
        float skillCooldownTicks(int f){
            switch(f){
                case YELLOW: return EMP_COOLDOWN;
                case BLUE: return ASTEROID_COOLDOWN;
                case PURPLE: return MEGA_HYPNOSIS_COOLDOWN;
                default: return 1f;
            }
        }

        float changeProgress(){
            float total = Math.max(1f, val(FORM_CHANGE_TIME_SEC, level) * 60f);
            return Mathf.clamp(1f - formChangeTimer / total);
        }

        String formBarText(){
            if(form == DEATH) return "Death: " + timeText(deathTimer);
            if(pendingForm >= 0) return tr("Changing", "Đang đổi");
            if(formCooldown > 0f) return tr("Reload: ", "Hồi: ") + Strings.fixed(formCooldown / 60f, 1) + "s";
            return formName(form);
        }

        Color formBarColor(){
            if(pendingForm >= 0) return changeProgress() < 0.5f ? formColor(form) : formColor(pendingForm);
            return formColor(form);
        }

        float formBarFraction(){
            if(form == DEATH) return Mathf.clamp(deathTimer / DEATH_TICKS);
            if(pendingForm >= 0){
                float p = changeProgress();
                return p < 0.5f ? 1f - p * 2f : (p - 0.5f) * 2f; // form cũ tụt dần rồi form mới dâng dần
            }
            if(form != DEATH && formCooldown > 0f){
                return 1f - Mathf.clamp(formCooldown / Math.max(1f, val(FORM_CHANGE_COOLDOWN_SEC, level) * 60f));
            }
            return 1f;
        }

        /** Dạng Yellow từ level 3 trở lên: bar này hiện máu khiên thay cho lượng điện lưu trữ. */
        boolean showShieldBar(){
            return form == YELLOW && level >= 3;
        }

        float gridStored(){
            return (power != null && power.graph != null) ? power.graph.getBatteryStored() : 0f;
        }

        /** Máu khiên tối đa tính trực tiếp từ dung tích pin (client không nhận shieldMax từ server). */
        float shieldMaxNow(){
            return val(SHIELD_PERCENT, level) / 100f * gridCapacity();
        }

        String storageBarText(){
            if(showShieldBar()) return tr("Shield Health: ", "Máu khiên: ") + compactNum(shield) + "/" + compactNum(shieldMaxNow());
            return tr("Storage: ", "Lưu trữ: ") + compactNum(gridStored()) + "/" + compactNum(gridCapacity());
        }

        Color storageBarColor(){
            return showShieldBar() ? YELLOW_COLOR : Pal.powerBar;
        }

        float storageBarFraction(){
            float max = showShieldBar() ? shieldMaxNow() : gridCapacity();
            float cur = showShieldBar() ? shield : gridStored();
            return max > 0f ? Mathf.clamp(cur / max) : 0f;
        }

        String cooldownBarText(){
            if(form == DEATH) return tr("Cooldown: Locked", "Hồi chiêu: Khóa");
            if(asteroidPhase == AST_CHARGE) return tr("Charging: ", "Đang gồng: ") + Strings.fixed(asteroidTimer / 60f, 1) + "s";
            if(asteroidPhase == AST_FALL) return tr("Impact: ", "Va chạm: ") + Strings.fixed(asteroidTimer / 60f, 1) + "s";
            if(level < 5) return tr("Cooldown: --", "Hồi chiêu: --");
            return tr("Cooldown: ", "Hồi chiêu: ") + (int)(skillCd * 100f) + "%";
        }

        float cooldownBarFraction(){
            if(asteroidPhase == AST_CHARGE) return Mathf.clamp(1f - asteroidTimer / ASTEROID_CHARGE_TICKS);
            if(asteroidPhase == AST_FALL) return Mathf.clamp(1f - asteroidTimer / ASTEROID_TRAVEL_TICKS);
            if(level < 5) return 0f;
            return Mathf.clamp(skillCd); // ở dạng Death thanh này đứng yên vì hồi chiêu bị khóa
        }

        // ============================================================= vẽ
        /** Bán kính vòng phụ đề (world unit), chỉ lấy mẫu lại 15 tick một lần. */
        float ringRadius, ringStamp = -1000f;

        /** Vòng phạm vi ảnh hưởng luôn hiện (không cần chọn khối): màu của form, alpha 0.5, cập nhật 15 tick/lần. */
        void drawRangeRing(){
            if(ringStamp > Time.time || Time.time - ringStamp >= 15f){
                ringStamp = Time.time;
                ringRadius = affectRadiusWorld();
            }
            if(ringRadius <= 0f) return;
            Draw.z(Layer.blockOver);
            Draw.color(formColor(form), 0.5f);
            Lines.stroke(1.5f);
            Lines.circle(x, y, ringRadius);
            Draw.reset();
        }

        @Override
        public void draw(){
            super.draw();
            if(form == DEATH) return;
            drawRangeRing();

            float t = Time.time;
            Draw.z(Layer.blockOver);

            // Asteroid: chỉ vẽ một tia laser xanh 3 lớp, không vẽ aura
            if(asteroidPhase != AST_NONE){
                drawAsteroidBeam(t);
                Draw.reset();
                return;
            }
            if(!hasEnoughPower()) return; // không đủ điện: không vẽ aura

            if(pendingForm >= 0){
                // aura cũ mờ dần, aura mới đậm dần
                float p = changeProgress();
                drawAuraOf(form, t, 1f - p);
                drawAuraOf(pendingForm, t, p);
            }else{
                drawAuraOf(form, t, 1f);
                drawSkillVisuals(t, formColor(form));
            }
            Draw.reset();
        }

        void drawAuraOf(int f, float t, float am){
            auraAlpha = am;
            drawCorePulse(x, y, formColor(f), 1f);
            switch(f){
                case YELLOW: drawYellowAura(x, y, level, t); break;
                case BLUE: drawBlueAura(x, y, t); break;
                case PURPLE: drawPurpleAura(x, y, t); break;
                default: break;
            }
            auraAlpha = 1f;
            Draw.reset();
        }

        /** Tia xanh 3 lớp từ khối tới tiểu hành tinh; nhấp nhô như aura Blue và lớn dần theo tiến độ gồng. */
        void drawAsteroidBeam(float t){
            float cx = world.unitWidth() / 2f, cy = world.unitHeight() / 2f;
            float ex = asteroidTx, ey = asteroidTy;
            float progress = 1f;
            if(asteroidPhase == AST_FALL){
                float f = Mathf.clamp(1f - asteroidTimer / ASTEROID_TRAVEL_TICKS);
                ex = Mathf.lerp(asteroidTx, cx, f);
                ey = Mathf.lerp(asteroidTy, cy, f);
            }else{
                progress = Mathf.clamp(1f - asteroidTimer / ASTEROID_CHARGE_TICKS);
            }
            float sf = 1f + (float)Math.sin(t * 0.1f) * 0.25f;
            float w = (5f + 11f * progress) * sf;
            Draw.z(Layer.effect);
            beamTo(x, y, ex, ey, w, BLUE_COLOR);
        }

        /** Hình ảnh riêng cho từng skill đang hoạt động (tính toán phía client từ trạng thái đồng bộ). */
        void drawSkillVisuals(float t, Color fc){
            float r = affectRadiusWorld();
            Seq<Unit> enemies = enemyUnits(r);

            // xung nhỏ trên mỗi kẻ địch trong phạm vi
            for(Unit u : enemies) drawCorePulse(u.x, u.y, fc, 0.5f);

            // dấu hiệu bị vô hiệu (EMP / Illusion)
            if(form == YELLOW || form == PURPLE){
                for(Unit u : enemies){
                    if(u.hasEffect(StatusEffects.disarmed) && u.hasEffect(StatusEffects.unmoving)){
                        drawStunMark(u.x, u.y, u.hitSize * 0.6f, t, fc);
                    }
                }
            }

            switch(form){
                case YELLOW: drawYellowSkills(t, r, enemies); break;
                case BLUE: drawBlueSkills(t, r); break;
                default: break;
            }
        }

        void drawYellowSkills(float t, float r, Seq<Unit> enemies){
            // ElectrifiedField: vòng điện zigzag trên mỗi địch bị làm chậm
            for(Unit u : enemies) drawElectricRing(u.x, u.y, u.hitSize * 0.6f + 5f, t);

            // ElectricSphere: quả cầu ở vị trí ngẫu nhiên trong vòng tròn 15 tile, to và sáng dần khi nạp
            if(level >= 2 && orbCount > 0){
                float cf = Mathf.clamp(sphereCharge / val(SPHERE_CHARGE, level));
                int n = orbCount; // đã bị giới hạn theo level ở updateElectricSphere
                float orbR = 9f + 7f * cf; // to hơn trước (4 + 5 * cf)
                final float prevZ = Draw.z();
                Draw.z(ORB_Z); // nâng layer: orb nằm trên đơn vị và các hiệu ứng khác
                for(int i = 0; i < n; i++){
                    float ox = orbX(i) + (float)Math.sin(t * 0.1f + i) * 2f;
                    float oy = orbY(i) + (float)Math.cos(t * 0.12f + i) * 2f;
                    drawOrb(ox, oy, orbR, cf);
                }
                Draw.z(prevZ);
            }

            // EnergyShield: vòng tròn đúng bằng phạm vi chặn đạn, 3 lớp blending
            // luôn hiện đều khi đã mở khóa và chưa vỡ; không phụ thuộc shield/shieldMax (shieldMax dao động theo điện và không được đồng bộ cho client)
            if(level >= 3 && shield > 0f && shieldCooldown <= 0f){
                final float f = 1f;
                final float sr = shieldRadius();
                Draw.z(Layer.shields);
                drawMultiLayer((scale, override, alpha, strokeScale) -> {
                    Draw.color(override != null ? override : YELLOW_COLOR);
                    Draw.alpha(alpha * (0.35f + 0.5f * f));
                    Lines.stroke(4f * strokeScale);
                    Lines.circle(x, y, sr);
                    Draw.alpha(alpha * 0.05f * f);
                    Fill.circle(x, y, sr);
                    Draw.reset();
                });
                Draw.color(YELLOW_COLOR, 0.25f * f);
                Lines.stroke(1.5f);
                Lines.poly(x, y, 6, sr * 0.96f, t * 0.3f);
                Draw.z(Layer.blockOver);
            }

            // DualBlade được vẽ riêng trong drawBlades() (hook Trigger.draw)

            // EMP: đánh dấu công trình địch đang bị vô hiệu
            if(level >= 5 && empActiveTimer > 0f && r > 0f){
                for(Building b : enemyBuildings(r)){
                    drawStunMark(b.x, b.y, b.block.size * tilesize / 2f, t, YELLOW_COLOR);
                }
            }
        }

        /**
         * DualBlade: lưỡi cưa tròn (mờ khi đang chế tạo, sáng khi đã sẵn sàng bay đi cắt).
         * Gọi từ hook Trigger.draw nên không bị ẩn khi khối nằm ngoài màn hình; layer thấp hơn mọi block.
         */
        void drawBlades(){
            if(!isValid() || form != YELLOW || level < 4 || asteroidPhase != AST_NONE || pendingForm >= 0 || !hasEnoughPower()) return;
            final float t = Time.time;
            final int bc = (int)val(BLADE_COUNT, level);
            final float create = val(BLADE_CREATE, level);
            Draw.z(BLADE_Z);
            for(int i = 0; i < bc; i++){
                if(bladeX[i] == 0f && bladeY[i] == 0f) continue;
                float prog = Mathf.clamp(blades[i] / create);
                drawSaw(bladeX[i], bladeY[i], BLADE_RADIUS, t * 25f + i * 40f, prog >= 1f ? 1f : 0.15f + 0.35f * prog);
            }
            Draw.reset();
        }

        void drawBlueSkills(float t, float r){
            // Limitless: vùng 1/3 affectRadius làm chậm bullet; vòng nhỏ đánh dấu bullet bị chậm
            if(level >= 4 && r > 0f){
                final float lr = r / LIMITLESS_RADIUS_DIV;
                Draw.color(BLUE_COLOR);
                Draw.alpha(0.35f);
                Lines.stroke(1.5f);
                for(int i = 0; i < 4; i++) Lines.arc(x, y, lr, 0.18f, t * 0.8f + i * 90f);
                Draw.alpha(0.05f);
                Fill.circle(x, y, lr);

                Groups.bullet.intersect(x - lr, y - lr, lr * 2f, lr * 2f, (Bullet b) -> {
                    if(b.team == team || !b.within(this, lr)) return;
                    Draw.color(BLUE_COLOR, Color.white, 0.4f);
                    Draw.alpha(0.9f);
                    Lines.stroke(1f);
                    Lines.circle(b.x, b.y, 3f + (float)Math.sin(t * 0.4f + b.id) * 1f);
                });
            }
        }

        @Override
        public void drawConfigure(){
            super.drawConfigure();
            float r = affectRadiusWorld();
            if(r > 0f) drawThermionRange(x, y, r, formColor(form));
        }
    }
}