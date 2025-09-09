// New efficient method: Get recipe directly from item details
async function getRecipeForItem(itemId, itemName) {
    console.log(`Looking for recipe for ${itemName} (ID: ${itemId})...`);
    
    try {
        // Get item details first
        const itemResponse = await fetch(`https://cafemaker.wakingsands.com/item/${itemId}`, {
            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
        });

        if (itemResponse.ok) {
            const itemData = await itemResponse.json();
            console.log(`Item: ${itemData.Name}`);
            console.log(`Category: ${itemData.ItemUICategory?.Name || 'Unknown'}`);
            console.log(`Recipes: ${JSON.stringify(itemData.Recipes || [])}`);

            // Check if the item has recipes
            if (!itemData.Recipes || itemData.Recipes.length === 0) {
                console.log(`❌ ${itemName} has no recipes (gathering/base material)`);
                return null;
            }

            // Get the first recipe details
            const recipeInfo = itemData.Recipes[0];
            console.log(`Found recipe ID: ${recipeInfo.ID} (Level: ${recipeInfo.Level})`);

            const recipeResponse = await fetch(`https://cafemaker.wakingsands.com/Recipe/${recipeInfo.ID}`, {
                headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
            });

            if (recipeResponse.ok) {
                const recipeData = await recipeResponse.json();
                console.log(`✅ Recipe found for ${itemName}!`);
                console.log(`Craft Type: ${recipeData.CraftType?.Name}`);
                console.log(`Result Quantity: ${recipeData.AmountResult}`);
                
                console.log('Ingredients:');
                for (let i = 0; i < 10; i++) {
                    if (recipeData[`ItemIngredient${i}`] && recipeData[`AmountIngredient${i}`]) {
                        console.log(`  - ${recipeData[`ItemIngredient${i}`].Name} x${recipeData[`AmountIngredient${i}`]}`);
                    }
                }
                
                return recipeData;
            } else {
                console.log(`❌ Failed to get recipe details for ID: ${recipeInfo.ID}`);
                return null;
            }
        } else {
            console.log(`❌ Failed to get item details for ID: ${itemId}`);
            return null;
        }
    } catch (error) {
        console.error('Error getting recipe:', error);
        return null;
    }
}

// Test with 玫瑰金锭 (Rose Gold Ingot - ID: 5067)
async function testRoseGoldIngot() {
    console.log('=== Testing 玫瑰金锭 (Rose Gold Ingot) - ID: 5067 ===');
    await getRecipeForItem(5067, '玫瑰金锭');
}

// Test with 苍天石 (correct ID: 12912)
async function testCelestine() {
    console.log('\n=== Testing 苍天石 (Celestine) - ID: 12912 ===');
    await getRecipeForItem(12912, '苍天石');
}

// Test with 苍天石英 (gathering item - ID: 5164)
async function testCelestineQuartz() {
    console.log('\n=== Testing 苍天石英 (Celestine Quartz) - ID: 5164 ===');
    await getRecipeForItem(5164, '苍天石英');
}

// Test with a known craftable item (黑铁锭)
async function testIronIngot() {
    console.log('\n=== Testing 黑铁锭 (Iron Ingot) - ID: 5057 ===');
    await getRecipeForItem(5057, '黑铁锭');
}

// Run tests
async function runTests() {
    await testRoseGoldIngot();
    await testCelestine();
    await testCelestineQuartz();
    await testIronIngot();
    console.log('\nTests completed');
}

runTests().catch(error => {
    console.error('Test error:', error);
});