// Smart price calculation function
function calculateOptimalPrice(marketData, requiredQuantity) {
    // If no listings available, fall back to average price
    if (!marketData.listings || marketData.listings.length === 0) {
        const fallbackPrice = marketData.currentAveragePrice || marketData.minPrice || 0;
        return {
            averagePrice: fallbackPrice,
            totalCost: fallbackPrice * requiredQuantity,
            breakdown: [{
                price: fallbackPrice,
                quantity: requiredQuantity,
                source: 'average_price'
            }]
        };
    }

    // Sort listings by price (ascending)
    const sortedListings = marketData.listings
        .filter(listing => listing.pricePerUnit > 0)
        .sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    if (sortedListings.length === 0) {
        const fallbackPrice = marketData.currentAveragePrice || 0;
        return {
            averagePrice: fallbackPrice,
            totalCost: fallbackPrice * requiredQuantity,
            breakdown: [{
                price: fallbackPrice,
                quantity: requiredQuantity,
                source: 'average_price'
            }]
        };
    }

    // Calculate optimal purchase strategy
    let remainingQuantity = requiredQuantity;
    let totalCost = 0;
    const breakdown = [];

    for (const listing of sortedListings) {
        if (remainingQuantity <= 0) break;

        const quantityToBuy = Math.min(remainingQuantity, listing.quantity);
        const cost = quantityToBuy * listing.pricePerUnit;
        
        totalCost += cost;
        remainingQuantity -= quantityToBuy;
        
        breakdown.push({
            price: listing.pricePerUnit,
            quantity: quantityToBuy,
            retainer: listing.retainerName,
            hq: listing.hq
        });
    }

    // If we still need more items, use the highest price from available listings
    if (remainingQuantity > 0) {
        const highestPrice = sortedListings[sortedListings.length - 1].pricePerUnit;
        const additionalCost = remainingQuantity * highestPrice;
        totalCost += additionalCost;
        
        breakdown.push({
            price: highestPrice,
            quantity: remainingQuantity,
            source: 'estimated_additional'
        });
    }

    const averagePrice = totalCost / requiredQuantity;

    return {
        averagePrice: Math.round(averagePrice * 100) / 100,
        totalCost: Math.round(totalCost),
        breakdown: breakdown
    };
}

// Cloudflare Functions API Router
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        let response;

        switch (true) {
            case path === 'servers':
                response = await handleServers(request, env);
                break;
            case path === 'search' && request.method === 'POST':
                response = await handleSearch(request, env);
                break;
            case path.startsWith('item/') && request.method === 'GET':
                response = await handleItemDetails(request, env);
                break;
            case path.startsWith('recipe/') && request.method === 'GET':
                response = await handleRecipe(request, env);
                break;
            case path === 'analyze-crafting-list' && request.method === 'POST':
                response = await handleAnalyzeCraftingList(request, env);
                break;
            default:
                response = new Response(JSON.stringify({ error: 'Not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
        }

        // Add CORS headers to response
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        return response;
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// API Handlers
async function handleServers(request, env) {
    // Try to get servers from XIVAPI first, fallback to static list
    try {
        const response = await fetch("https://cafemaker.wakingsands.com/servers/dc", {
            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.data) {
                // Transform the API response to our format
                const servers = {};
                const datacenters = {};
                
                data.data.forEach(dc => {
                    const worldNames = dc.worlds.map(world => world.name);
                    servers[dc.name] = worldNames;
                    // Add datacenter as a selectable option
                    datacenters[dc.name] = dc.name;
                });

                return new Response(JSON.stringify({
                    success: true,
                    servers: servers,
                    datacenters: datacenters,
                    default_server: "HongYuHai"
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
    } catch (error) {
        console.warn('Failed to fetch servers from API:', error);
    }

    // Fallback to static server list
    const servers = {
        "陆行鸟": ["陆行鸟", "HongYuHai", "ShenYiZhiDi", "LaNuoXiYa", "HuanYingQunDao", "MengYaChi", "YuZhouHeYin", "WoXianXiRan", "ChenXiWangZuo"],
        "莫古力": ["莫古力", "BaiYinXiang", "BaiJinHuanXiang", "ShenQuanHen", "ChaoFengTing", "LvRenZhanQiao", "FuXiaoZhiJian", "Longchaoshendian", "MengYuBaoJing"],
        "猫小胖": ["猫小胖", "ZiShuiZhanQiao", "YanXia", "JingYuZhuangYuan", "MoDuNa", "HaiMaoChaWu", "RouFengHaiWan", "HuPoYuan"],
        "豆豆柴": ["豆豆柴", "ShuiJingTa2", "YinLeiHu2", "TaiYangHaiAn2", "YiXiuJiaDe2", "HongChaChuan2"],
        "Aether": ["Aether", "Adamantoise", "Cactuar", "Faerie", "Gilgamesh", "Jenova", "Midgardsormr", "Sargatanas", "Siren"],
        "Crystal": ["Crystal", "Balmung", "Brynhildr", "Coeurl", "Diabolos", "Goblin", "Malboro", "Mateus", "Zalera"],
        "Primal": ["Primal", "Behemoth", "Excalibur", "Exodus", "Famfrit", "Hyperion", "Lamia", "Leviathan", "Ultros"],
        "Dynamis": ["Dynamis", "Halicarnassus", "Maduin", "Marilith", "Seraph"],
        "Elemental": ["Elemental", "Aegis", "Atomos", "Carbuncle", "Garuda", "Gungnir", "Kujata", "Tonberry", "Typhon"],
        "Gaia": ["Gaia", "Alexander", "Bahamut", "Durandal", "Fenrir", "Ifrit", "Ridill", "Tiamat", "Ultima"],
        "Light": ["Light", "Alpha", "Lich", "Odin", "Phoenix", "Raiden", "Shiva", "Twintania", "Zodiark"],
        "Mana": ["Mana", "Anima", "Asura", "Chocobo", "Hades", "Ixion", "Masamune", "Pandaemonium", "Titan"],
        "Materia": ["Materia", "Bismarck", "Ravana", "Sephirot", "Sophia", "Zurvan"],
        "Meteor": ["Meteor", "Belias", "Mandragora", "Ramuh", "Shinryu", "Unicorn", "Valefor", "Yojimbo", "Zeromus"]
    };

    // Create datacenter mapping for Chinese servers
    const datacenters = {
        "陆行鸟": "陆行鸟",
        "莫古力": "莫古力", 
        "猫小胖": "猫小胖",
        "豆豆柴": "豆豆柴",
        "Aether": "Aether",
        "Crystal": "Crystal",
        "Primal": "Primal",
        "Dynamis": "Dynamis",
        "Elemental": "Elemental",
        "Gaia": "Gaia",
        "Light": "Light",
        "Mana": "Mana",
        "Materia": "Materia",
        "Meteor": "Meteor"
    };

    return new Response(JSON.stringify({
        success: true,
        servers: servers,
        datacenters: datacenters,
        default_server: "HongYuHai"
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleSearch(request, env) {
    const { query } = await request.json();

    if (!query || query.trim().length === 0) {
        return new Response(JSON.stringify({
            success: false,
            error: '请输入搜索关键词'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Search items using CafeMaker API
        const searchUrl = `https://cafemaker.wakingsands.com/search?indexes=item&string=${encodeURIComponent(query)}&limit=20`;
        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'FF14CraftingAssistant/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        const results = data.Results?.map(item => ({
            id: item.ID,
            name: item.Name,
            description: item.Description || '',
            level: item.LevelItem || 1,
            can_be_hq: item.CanBeHq || false,
            icon_url: item.Icon ? `https://cafemaker.wakingsands.com${item.Icon}` : ''
        })) || [];

        return new Response(JSON.stringify({
            success: true,
            results: results,
            count: results.length
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: `搜索失败: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleItemDetails(request, env) {
    const url = new URL(request.url);
    const itemId = url.pathname.split('/').pop();
    const server = url.searchParams.get('server') || 'HongYuHai';

    try {
        // Get item details from CafeMaker
        const itemResponse = await fetch(`https://cafemaker.wakingsands.com/item/${itemId}`, {
            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
        });

        if (!itemResponse.ok) {
            throw new Error(`Item not found: ${itemId}`);
        }

        const itemData = await itemResponse.json();

        // Get market data from Universalis
        let marketData = null;
        try {
            // Support both individual servers and datacenters
            const marketResponse = await fetch(`https://universalis.app/api/v2/${server}/${itemId}`, {
                headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
            });

            if (marketResponse.ok) {
                const market = await marketResponse.json();
                
                // Determine if this is datacenter data or server data
                const isDatacenter = ['陆行鸟', '莫古力', '猫小胖', '豆豆柴', 'Aether', 'Crystal', 'Primal', 'Dynamis', 'Elemental', 'Gaia', 'Light', 'Mana', 'Materia', 'Meteor'].includes(server);
                
                marketData = {
                    server: server,
                    is_datacenter: isDatacenter,
                    average_price: market.currentAveragePrice || 0,
                    average_price_nq: market.currentAveragePriceNQ || 0,
                    average_price_hq: market.currentAveragePriceHQ || 0,
                    min_price: market.minPrice || 0,
                    max_price: market.maxPrice || 0,
                    last_update: market.lastUploadTime ? new Date(market.lastUploadTime).toISOString() : null,
                    listings: market.listings?.slice(0, 10).map(listing => ({
                        price: listing.pricePerUnit,
                        quantity: listing.quantity,
                        hq: listing.hq,
                        retainer: listing.retainerName,
                        world: listing.worldName
                    })) || [],
                    history: market.recentHistory?.slice(0, 10).map(sale => ({
                        price: sale.pricePerUnit,
                        quantity: sale.quantity,
                        hq: sale.hq,
                        timestamp: new Date(sale.timestamp * 1000).toISOString(),
                        buyer: sale.buyerName,
                        world: sale.worldName
                    })) || [],
                    listings_count: market.listings?.length || 0
                };
            }
        } catch (marketError) {
            console.warn('Market data fetch failed:', marketError);
        }

        return new Response(JSON.stringify({
            success: true,
            data: {
                item: {
                    id: itemData.ID,
                    name: itemData.Name,
                    description: itemData.Description || '',
                    level: itemData.LevelItem || 1,
                    can_be_hq: itemData.CanBeHq || false,
                    icon_url: itemData.Icon ? `https://cafemaker.wakingsands.com${itemData.Icon}` : ''
                },
                market: marketData
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: `获取物品信息失败: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleRecipe(request, env) {
    const url = new URL(request.url);
    const itemId = url.pathname.split('/').pop();

    console.log(`Looking for recipe for item ID: ${itemId}`);

    try {
        // Method 1: Get item details first to check for recipes
        const itemResponse = await fetch(`https://cafemaker.wakingsands.com/item/${itemId}`, {
            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
        });

        if (!itemResponse.ok) {
            throw new Error(`Item not found: ${itemId}`);
        }

        const itemData = await itemResponse.json();
        console.log(`Item: ${itemData.Name} (Category: ${itemData.ItemUICategory?.Name || 'Unknown'})`);

        // Check if the item has recipes in its data
        if (!itemData.Recipes || itemData.Recipes.length === 0) {
            console.log(`Item ${itemId} has no recipes`);
            return new Response(JSON.stringify({
                success: true,
                recipe: null,
                message: '该物品没有配方或为基础材料'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get the first recipe (most items have only one recipe)
        const recipeInfo = itemData.Recipes[0];
        console.log(`Found recipe ID: ${recipeInfo.ID} (Level: ${recipeInfo.Level}, ClassJob: ${recipeInfo.ClassJobID})`);

        // Get detailed recipe information
        const recipeResponse = await fetch(`https://cafemaker.wakingsands.com/Recipe/${recipeInfo.ID}`, {
            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
        });

        if (!recipeResponse.ok) {
            throw new Error(`Recipe not found: ${recipeInfo.ID}`);
        }

        const recipeData = await recipeResponse.json();
        console.log(`Recipe details loaded for ${recipeData.ItemResult?.Name || 'Unknown Item'}`);

        // Parse ingredients from the recipe data
        const ingredients = [];
        for (let i = 0; i < 10; i++) {
            const ingredientKey = `ItemIngredient${i}`;
            const amountKey = `AmountIngredient${i}`;

            if (recipeData[ingredientKey] && recipeData[amountKey]) {
                ingredients.push({
                    id: recipeData[ingredientKey].ID,
                    name: recipeData[ingredientKey].Name,
                    quantity: recipeData[amountKey],
                    icon_url: recipeData[ingredientKey].Icon ? `https://cafemaker.wakingsands.com${recipeData[ingredientKey].Icon}` : ''
                });
            }
        }

        console.log(`Successfully found recipe with ${ingredients.length} ingredients`);

        return new Response(JSON.stringify({
            success: true,
            recipe: {
                id: recipeData.ID,
                craft_type: recipeData.CraftType?.Name || '未知',
                result_quantity: recipeData.AmountResult || 1,
                ingredients: ingredients
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error(`Recipe search error for item ${itemId}:`, error);
        return new Response(JSON.stringify({
            success: false,
            error: `获取配方失败: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleAnalyzeCraftingList(request, env) {
    const { items, server } = await request.json();

    if (!items || items.length === 0) {
        return new Response(JSON.stringify({
            success: false,
            error: '制作清单为空'
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const analysis = {
            total_items: items.length,
            total_materials: 0,
            estimated_cost: 0,
            craftable_items: 0,
            materials: []
        };

        const materialMap = new Map();

        // Analyze each item in the crafting list using the new efficient method
        for (const item of items) {
            try {
                console.log(`Analyzing item: ${item.name} (ID: ${item.id}) x${item.quantity}`);
                
                // Get item details first to check for recipes
                const itemResponse = await fetch(`https://cafemaker.wakingsands.com/item/${item.id}`, {
                    headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
                });

                if (itemResponse.ok) {
                    const itemData = await itemResponse.json();
                    
                    // Check if the item has recipes
                    if (itemData.Recipes && itemData.Recipes.length > 0) {
                        analysis.craftable_items++;
                        
                        // Get the first recipe
                        const recipeInfo = itemData.Recipes[0];
                        console.log(`Found recipe ID: ${recipeInfo.ID} for ${item.name}`);
                        
                        // Get detailed recipe information
                        const recipeResponse = await fetch(`https://cafemaker.wakingsands.com/Recipe/${recipeInfo.ID}`, {
                            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
                        });

                        if (recipeResponse.ok) {
                            const recipeData = await recipeResponse.json();
                            console.log(`Processing ingredients for ${item.name}`);

                            // Process ingredients
                            for (let i = 0; i < 10; i++) {
                                const ingredientKey = `ItemIngredient${i}`;
                                const amountKey = `AmountIngredient${i}`;

                                if (recipeData[ingredientKey] && recipeData[amountKey]) {
                                    const materialId = recipeData[ingredientKey].ID;
                                    const materialName = recipeData[ingredientKey].Name;
                                    const requiredAmount = recipeData[amountKey] * item.quantity;

                                    console.log(`  Material: ${materialName} x${requiredAmount}`);

                                    if (materialMap.has(materialId)) {
                                        materialMap.get(materialId).quantity += requiredAmount;
                                    } else {
                                        materialMap.set(materialId, {
                                            id: materialId,
                                            name: materialName,
                                            quantity: requiredAmount,
                                            source: 'market' // Default to market, can be enhanced to check if craftable
                                        });
                                    }
                                }
                            }
                        } else {
                            console.warn(`Failed to get recipe details for ${recipeInfo.ID}`);
                        }
                    } else {
                        console.log(`Item ${item.name} has no recipes (gathering/base material)`);
                    }
                } else {
                    console.warn(`Failed to get item details for ${item.id}`);
                }
            } catch (itemError) {
                console.warn(`Failed to analyze item ${item.id}:`, itemError);
            }
        }

        // Convert material map to array and get market prices
        const materials = Array.from(materialMap.values());
        analysis.total_materials = materials.length;

        // Get market prices for materials (batch request)
        if (materials.length > 0) {
            try {
                const materialIds = materials.map(m => m.id).join(',');
                // Support both individual servers and datacenters
                const marketResponse = await fetch(`https://universalis.app/api/v2/${server}/${materialIds}`, {
                    headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
                });

                if (marketResponse.ok) {
                    const marketData = await marketResponse.json();

                    materials.forEach(material => {
                        const itemMarketData = marketData.items?.[material.id] || marketData;
                        if (itemMarketData) {
                            const priceCalculation = calculateOptimalPrice(itemMarketData, material.quantity);
                            material.unit_price = priceCalculation.averagePrice;
                            material.total_price = priceCalculation.totalCost;
                            material.price_breakdown = priceCalculation.breakdown;
                            analysis.estimated_cost += material.total_price;
                        }
                    });
                }
            } catch (marketError) {
                console.warn('Failed to get market prices:', marketError);
            }
        }

        analysis.materials = materials.sort((a, b) => (b.total_price || 0) - (a.total_price || 0));

        return new Response(JSON.stringify({
            success: true,
            analysis: analysis
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: `分析失败: ${error.message}`
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}