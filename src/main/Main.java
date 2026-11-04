package main;

import mindustry.content.Items;
import mindustry.mod.Mod;
import mindustry.type.Category;
import mindustry.type.ItemStack;
import mindustry.world.Block;

public class Main extends Mod {
    public static Block test;
    
    @Override
    public void loadContent() {
        test = new Thermion("test") {{
            requirements(Category.turret, ItemStack.with(Items.copper, 1));
        }};
    }
}