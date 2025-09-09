// Global state
let currentServer = 'YinLeiHu2';
let craftingList = [];
let searchCache = new Map();

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadServers();
    loadCraftingList();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    // Server selection
    document.getElementById('serverSelect').addEventListener('change', function(e) {
        currentServer = e.target.value;
    });

    // Crafting list functionality
    document.getElementById('addItemBtn').addEventListener('click', showAddItemModal);
    document.getElementById('analyzeBtn').addEventListener('click', analyzeCraftingList);
    document.getElementById('clearListBtn').addEventListener('click', clearCraftingList);

    // Modal functionality
    document.getElementById('closeAddModal').addEventListener('click', hideAddItemModal);
    document.getElementById('confirmAddItem').addEventListener('click', confirmAddItem);
    document.getElementById('cancelAddItem').addEventListener('click', hideAddItemModal);
    document.getElementById('closeItemDetails').addEventListener('click', hideItemDetails);
    
    // Item search in modal
    document.getElementById('itemNameInput').addEventListener('input', searchItemsForModal);
}

// Load servers
async function loadServers() {
    try {
        const response = await fetch('/api/servers');
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('serverSelect');
            select.innerHTML = '';
            
            // Server name mapping
            const serverNameMap = {
                // 数据中心
                'luxingniao': '🌐 陆行鸟',
                'moguli': '🌐 莫古力',
                'maoxiaopang': '🌐 猫小胖',
                'doudouchai': '🌐 豆豆柴',
                'Aether': '🌐 Entire Aether Datacenter',
                'Crystal': '🌐 Entire Crystal Datacenter',
                'Primal': '🌐 Entire Primal Datacenter',
                'Dynamis': '🌐 Entire Dynamis Datacenter',
                'Elemental': '🌐 Entire Elemental Datacenter',
                'Gaia': '🌐 Entire Gaia Datacenter',
                'Light': '🌐 Entire Light Datacenter',
                'Mana': '🌐 Entire Mana Datacenter',
                'Materia': '🌐 Entire Materia Datacenter',
                'Meteor': '🌐 Entire Meteor Datacenter',
                // 中国服务器
                'HongYuHai': '红玉海', 'ShenYiZhiDi': '神意之地', 'LaNuoXiYa': '拉诺西亚',
                'HuanYingQunDao': '幻影群岛', 'MengYaChi': '萌芽池', 'YuZhouHeYin': '宇宙和音',
                'WoXianXiRan': '沃仙曦染', 'ChenXiWangZuo': '晨曦王座',
                'BaiYinXiang': '白银乡', 'BaiJinHuanXiang': '白金幻象', 'ShenQuanHen': '神拳痕',
                'ChaoFengTing': '潮风亭', 'LvRenZhanQiao': '旅人栈桥', 'FuXiaoZhiJian': '复仇之剑',
                'Longchaoshendian': '龙巢神殿', 'MengYuBaoJing': '梦羽宝境',
                'ZiShuiZhanQiao': '紫水栈桥', 'YanXia': '延夏', 'JingYuZhuangYuan': '静语庄园',
                'MoDuNa': '摩杜纳', 'HaiMaoChaWu': '海猫茶屋', 'RouFengHaiWan': '柔风海湾', 'HuPoYuan': '琥珀原',
                'ShuiJingTa2': '水晶塔', 'YinLeiHu2': '银泪湖', 'TaiYangHaiAn2': '太阳海岸',
                'YiXiuJiaDe2': '伊修加德', 'HongChaChuan2': '红茶川'
            };
            
            // Datacenter name mapping
            const datacenterNameMap = {
                '陆行鸟': '陆行鸟 (中国)',
                '莫古力': '莫古力 (中国)', 
                '猫小胖': '猫小胖 (中国)',
                '豆豆柴': '豆豆柴 (中国)'
            };
            
            // Sort datacenters to put Chinese servers first
            const sortedDatacenters = Object.keys(data.servers).sort((a, b) => {
                const chineseDatacenters = ['陆行鸟', '莫古力', '猫小胖', '豆豆柴'];
                const aIsChinese = chineseDatacenters.includes(a);
                const bIsChinese = chineseDatacenters.includes(b);
                
                if (aIsChinese && !bIsChinese) return -1;
                if (!aIsChinese && bIsChinese) return 1;
                return a.localeCompare(b);
            });
            
            sortedDatacenters.forEach(datacenter => {
                const servers = data.servers[datacenter];
                const optgroup = document.createElement('optgroup');
                optgroup.label = datacenterNameMap[datacenter] || datacenter;
                
                servers.forEach(server => {
                    const option = document.createElement('option');
                    option.value = server;
                    option.textContent = serverNameMap[server] || server;
                    if (server === data.default_server) {
                        option.selected = true;
                        currentServer = server;
                    }
                    optgroup.appendChild(option);
                });
                
                select.appendChild(optgroup);
            });
        }
    } catch (error) {
        console.error('Failed to load servers:', error);
    }
}

// Perform search
async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const searchBtn = document.getElementById('searchBtn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<div class="loading"></div> 搜索中...';
    searchBtn.disabled = true;

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (data.success) {
            displaySearchResults(data.results);
        } else {
            showError('搜索失败: ' + data.error);
        }
    } catch (error) {
        showError('搜索请求失败: ' + error.message);
    } finally {
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    }
}

// Display search results
function displaySearchResults(results) {
    const resultsSection = document.getElementById('searchResults');
    const resultsList = document.getElementById('searchResultsList');

    if (results.length === 0) {
        resultsList.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">未找到相关物品</p>';
    } else {
        resultsList.innerHTML = '';
        results.forEach(item => {
            const itemCard = createItemCard(item);
            resultsList.appendChild(itemCard);
        });
    }

    resultsSection.classList.remove('hidden');
}

// Create item card
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'bg-gray-50 rounded-lg p-4 card-hover cursor-pointer border border-gray-200';
    
    const iconHtml = item.icon_url ? 
        `<img src="${item.icon_url}" alt="${item.name}" class="w-12 h-12 rounded-lg" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div class="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center" style="display:none;">
             <i class="fas fa-cube text-gray-600"></i>
         </div>` :
        `<div class="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
             <i class="fas fa-cube text-gray-600"></i>
         </div>`;
    
    card.innerHTML = `
        <div class="flex items-center space-x-3">
            ${iconHtml}
            <div class="flex-1 cursor-pointer" onclick="showItemDetails(${item.id})">
                <h3 class="font-medium text-gray-900">${item.name}</h3>
                <p class="text-sm text-gray-500">等级 ${item.level || 1} ${item.can_be_hq ? '• 可HQ' : ''}</p>
                <p class="text-xs text-gray-400 mt-1">${item.description || '暂无描述'}</p>
            </div>
            <div class="flex space-x-2">
                <button onclick="showItemDetails(${item.id})" 
                        class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="addToCraftingList(${item.id}, '${item.name.replace(/'/g, "\\'")}', 1, '${item.icon_url || ''}')" 
                        class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>
    `;

    return card;
}

// Crafting list management
function loadCraftingList() {
    const saved = localStorage.getItem('ff14-crafting-list');
    if (saved) {
        craftingList = JSON.parse(saved);
        updateCraftingListDisplay();
    }
}

function saveCraftingList() {
    localStorage.setItem('ff14-crafting-list', JSON.stringify(craftingList));
}

function addToCraftingList(itemId, itemName, quantity = 1, iconUrl = '') {
    const existing = craftingList.find(item => item.id === itemId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        craftingList.push({ id: itemId, name: itemName, quantity, icon_url: iconUrl });
    }
    saveCraftingList();
    updateCraftingListDisplay();
    showSuccess(`已添加 ${itemName} x${quantity} 到制作清单`);
}

function removeCraftingItem(itemId) {
    craftingList = craftingList.filter(item => item.id !== itemId);
    saveCraftingList();
    updateCraftingListDisplay();
}

function updateCraftingItemQuantity(itemId, quantity) {
    const item = craftingList.find(item => item.id === itemId);
    if (item) {
        item.quantity = Math.max(1, quantity);
        saveCraftingList();
        updateCraftingListDisplay();
    }
}

function clearCraftingList() {
    if (confirm('确定要清空制作清单吗？')) {
        craftingList = [];
        saveCraftingList();
        updateCraftingListDisplay();
        hideAnalysisResults();
    }
}

function updateCraftingListDisplay() {
    const emptyDiv = document.getElementById('emptyCraftingList');
    const itemsDiv = document.getElementById('craftingListItems');

    if (craftingList.length === 0) {
        emptyDiv.classList.remove('hidden');
        itemsDiv.classList.add('hidden');
    } else {
        emptyDiv.classList.add('hidden');
        itemsDiv.classList.remove('hidden');
        
        itemsDiv.innerHTML = '';
        craftingList.forEach(item => {
            const itemDiv = createCraftingListItem(item);
            itemsDiv.appendChild(itemDiv);
        });
        
        // Load market prices for all items
        loadCraftingListPrices();
    }
}

function createCraftingListItem(item) {
    const div = document.createElement('div');
    div.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg border';
    
    const iconHtml = item.icon_url ? 
        `<img src="${item.icon_url}" alt="${item.name}" class="w-10 h-10 rounded" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div class="w-10 h-10 bg-gray-300 rounded flex items-center justify-center" style="display:none;">
             <i class="fas fa-cube text-gray-600"></i>
         </div>` :
        `<div class="w-10 h-10 bg-gray-300 rounded flex items-center justify-center">
             <i class="fas fa-cube text-gray-600"></i>
         </div>`;
    
    div.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                ${iconHtml}
                <div>
                    <h4 class="font-medium">${item.name}</h4>
                    <p class="text-sm text-gray-500">物品ID: ${item.id}</p>
                    <p id="price-${item.id}" class="text-xs text-blue-600">价格加载中...</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <div class="text-right">
                    <p class="text-sm font-medium">数量: ${item.quantity}</p>
                    <p id="total-${item.id}" class="text-xs text-gray-500">总价: 计算中...</p>
                </div>
                <input type="number" value="${item.quantity}" min="1" 
                       onchange="updateCraftingItemQuantity(${item.id}, this.value)"
                       class="w-16 px-2 py-1 border border-gray-300 rounded text-center">
                <button onclick="showItemDetails(${item.id})" 
                        class="text-blue-500 hover:text-blue-700" title="查看详情">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="removeCraftingItem(${item.id})" 
                        class="text-red-500 hover:text-red-700" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return div;
}

// Modal functionality
function showAddItemModal() {
    document.getElementById('addItemModal').classList.remove('hidden');
    document.getElementById('itemNameInput').focus();
}

function hideAddItemModal() {
    document.getElementById('addItemModal').classList.add('hidden');
    document.getElementById('itemNameInput').value = '';
    document.getElementById('itemQuantityInput').value = '1';
    document.getElementById('itemSuggestions').classList.add('hidden');
}

async function searchItemsForModal() {
    const query = document.getElementById('itemNameInput').value.trim();
    const suggestionsDiv = document.getElementById('itemSuggestions');
    
    if (query.length < 2) {
        suggestionsDiv.classList.add('hidden');
        return;
    }

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();
        if (data.success && data.results.length > 0) {
            suggestionsDiv.innerHTML = '';
            data.results.slice(0, 5).forEach(item => {
                const div = document.createElement('div');
                div.className = 'p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200';
                div.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-cube text-gray-400"></i>
                        <span>${item.name}</span>
                        <span class="text-xs text-gray-500">Lv.${item.level || 1}</span>
                    </div>
                `;
                div.onclick = () => selectItemForModal(item);
                suggestionsDiv.appendChild(div);
            });
            suggestionsDiv.classList.remove('hidden');
        } else {
            suggestionsDiv.classList.add('hidden');
        }
    } catch (error) {
        console.error('Search failed:', error);
    }
}

function selectItemForModal(item) {
    document.getElementById('itemNameInput').value = item.name;
    document.getElementById('itemNameInput').dataset.itemId = item.id;
    document.getElementById('itemSuggestions').classList.add('hidden');
}

function confirmAddItem() {
    const nameInput = document.getElementById('itemNameInput');
    const quantityInput = document.getElementById('itemQuantityInput');
    
    const itemId = parseInt(nameInput.dataset.itemId);
    const itemName = nameInput.value;
    const quantity = parseInt(quantityInput.value) || 1;
    
    if (!itemId || !itemName) {
        showError('请选择一个有效的物品');
        return;
    }
    
    addToCraftingList(itemId, itemName, quantity);
    hideAddItemModal();
}


// 修复后的价格加载函数（支持单服 & 数据中心）
async function loadCraftingListPrices() {
    console.log(`=== loadCraftingListPrices called with ${craftingList.length} items ===`);
    if (craftingList.length === 0) {
        console.log('Crafting list is empty, returning');
        return;
    }
    
    try {
        const itemIds = craftingList.map(item => item.id).join(',');
        const marketTarget = currentServer;
        console.log(`[PriceLoader] Fetching items [${itemIds}] from target: ${marketTarget}`);
        
        const response = await fetch(`https://universalis.app/api/v2/${marketTarget}/${itemIds}`, {
            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`[PriceLoader] Raw API response:`, data);
            
            craftingList.forEach(item => {
                let marketData = null;
                // 判断数据结构
                if (data.items) {
                    // 多物品格式
                    marketData = data.items[item.id] || data.items[item.id.toString()];
                    if (marketData) marketData.isDatacenter = !marketData.worldName;
                } else if (data.itemID) {
                    // 单物品（可能是单服，也可能是整个数据中心）
                    if (data.itemID === item.id || data.itemID === item.id.toString() ||
                        item.id === parseInt(data.itemID)) {
                        marketData = data;
                        marketData.isDatacenter = !data.worldName;
                    }
                } else if (craftingList.length === 1) {
                    marketData = data;
                    marketData.isDatacenter = !data.worldName;
                } else if (data[item.id]) {
                    marketData = data[item.id];
                    if (marketData) marketData.isDatacenter = !marketData.worldName;
                } else if (data[item.id.toString()]) {
                    marketData = data[item.id.toString()];
                    if (marketData) marketData.isDatacenter = !marketData.worldName;
                }
                
                const priceElement = document.getElementById(`price-${item.id}`);
                const totalElement = document.getElementById(`total-${item.id}`);
                
                if (marketData && priceElement && totalElement) {
                    console.log(`[PriceLoader] ✅ Item ${item.id} (${item.name}) data found. isDatacenter=${marketData.isDatacenter}`);
                    console.log(`[PriceLoader] Structure:`, {
                        hasListings: !!marketData.listings,
                        listingsCount: marketData.listings?.length || 0,
                        currentAveragePrice: marketData.currentAveragePrice,
                        minPrice: marketData.minPrice,
                        maxPrice: marketData.maxPrice
                    });
                    console.log(marketData.minPrice)
                    const priceCalc = calculateOptimalPrice(marketData, item.quantity);
                    if (priceCalc.averagePrice > 0) {
                        priceElement.innerHTML = `最优: ${priceCalc.averagePrice} | 最低: ${priceCalc.minPrice}`;
                        priceElement.className = 'text-xs text-blue-600';
                        totalElement.innerHTML = `总价: ${priceCalc.totalCost}`;
                        totalElement.className = 'text-xs text-green-600';
                        console.log(`[PriceLoader] 💰 Final price for ${item.name}: avg=${priceCalc.averagePrice}, min=${priceCalc.minPrice}, total=${priceCalc.totalCost}`);

                    } else {
                        priceElement.innerHTML = '暂无市场数据';
                        priceElement.className = 'text-xs text-gray-500';
                        totalElement.innerHTML = '总价: -';
                        totalElement.className = 'text-xs text-gray-500';
                        console.warn(`[PriceLoader] ⚠️ No valid price calculated for ${item.name}`);
                    }
                } else {
                    console.error(`[PriceLoader] ❌ No market data found for item ${item.id} (${item.name})`);
                    if (priceElement && totalElement) {
                        priceElement.innerHTML = '数据加载失败';
                        priceElement.className = 'text-xs text-red-500';
                        totalElement.innerHTML = '总价: -';
                        totalElement.className = 'text-xs text-gray-500';
                    }
                }
            });
        } else {
            console.error(`[PriceLoader] API request failed with status: ${response.status}`);
            const errorText = await response.text();
            console.error('[PriceLoader] Error response:', errorText);
            
            craftingList.forEach(item => {
                const priceElement = document.getElementById(`price-${item.id}`);
                const totalElement = document.getElementById(`total-${item.id}`);
                if (priceElement) {
                    priceElement.innerHTML = `API错误 (${response.status})`;
                    priceElement.className = 'text-xs text-red-500';
                }
                if (totalElement) {
                    totalElement.innerHTML = '总价: -';
                    totalElement.className = 'text-xs text-gray-500';
                }
            });
        }
    } catch (error) {
        console.error('[PriceLoader] Failed to load market prices:', error);
        craftingList.forEach(item => {
            const priceElement = document.getElementById(`price-${item.id}`);
            const totalElement = document.getElementById(`total-${item.id}`);
            if (priceElement) {
                priceElement.innerHTML = '网络请求失败';
                priceElement.className = 'text-xs text-red-500';
            }
            if (totalElement) {
                totalElement.innerHTML = '总价: -';
                totalElement.className = 'text-xs text-gray-500';
            }
        });
    }
}

// // 修复后的价格加载函数（支持单服 & 数据中心）
// async function loadCraftingListPrices() {
//     console.log(`=== loadCraftingListPrices called with ${craftingList.length} items ===`);
    
//     if (craftingList.length === 0) {
//         console.log('Crafting list is empty, returning');
//         return;
//     }

//     try {
//         // 获取所有物品ID
//         const itemIds = craftingList.map(item => item.id).join(',');
//         const marketTarget = currentServer;
        
//         console.log(`[PriceLoader] Fetching items [${itemIds}] from target: ${marketTarget}`);

//         const response = await fetch(`https://universalis.app/api/v2/${marketTarget}/${itemIds}`, {
//             headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
//         });

//         if (response.ok) {
//             const data = await response.json();
//             console.log(`[PriceLoader] Raw API response:`);
//             console.log(data); // 显示原始数据供调试

//             // 用于收集处理结果，方便输出统一日志
//             const logEntries = [];

//             craftingList.forEach(item => {
//                 let marketData = null;

//                 // 多物品或单物品结构判别逻辑
//                 if (data.items) {
//                     marketData = data.items[item.id] || data.items[item.id.toString()];
//                     if (marketData) marketData.isDatacenter = !marketData.worldName;
//                     if (marketData) marketData.isDatacenter = !marketData.worldName;
//                 } else if (data.itemID) {
//                     if (data.itemID === item.id || data.itemID === item.id.toString() ||
//                         item.id === parseInt(data.itemID)) {
//                         marketData = data;
//                         marketData.isDatacenter = !data.worldName;
//                     }
//                 } else if (craftingList.length === 1) {
//                     marketData = data;
//                     marketData.isDatacenter = !data.worldName;
//                     marketData.isDatacenter = !data.worldName;
//                 } else if (data[item.id]) {
//                     marketData = data[item.id];
//                     if (marketData) marketData.isDatacenter = !marketData.worldName;
//                     if (marketData) marketData.isDatacenter = !marketData.worldName;
//                 } else if (data[item.id.toString()]) {
//                     marketData = data[item.id.toString()];
//                     if (marketData) marketData.isDatacenter = !marketData.worldName;
//                     if (marketData) marketData.isDatacenter = !marketData.worldName;
//                 }

//                 const priceElement = document.getElementById(`price-${item.id}`);
//                 const totalElement = document.getElementById(`total-${item.id}`);

//                 // 创建日志条目
//                 const logEntry = {
//                     itemId: item.id,
//                     itemName: item.name,
//                     server: marketTarget,
//                     isDatacenter: undefined,
//                     foundData: false,
//                     status: 'ERROR'
//                 };

//                 // 检查是否找到市场数据
//                 if (marketData) {
//                     logEntry.foundData = true;
//                     logEntry.isDatacenter = marketData.isDatacenter;
//                     logEntry.listingsInfo = {
//                         hasListings: !!marketData.listings,
//                         listingsCount: marketData.listings?.length || 0,
//                         currentAveragePrice: marketData.currentAveragePrice,
//                         minPrice: marketData.minPrice,
//                         maxPrice: marketData.maxPrice
//                     };
//                 }

//                 // 如果找到市场数据并且DOM元素存在
//                 if (marketData && priceElement && totalElement) {
//                     console.log(`[PriceLoader] ✅ Processing item ${item.id} (${item.name})`);

//                     // 记录详细信息
//                     console.log(`[PriceLoader] Market Data Type: ${(marketData.isDatacenter ? 'Datacenter' : 'Single Server')}`);
//                     console.log(`[PriceLoader] Listings Count: ${marketData.listings?.length || 0}`);

//                     // 计算价格
//                     const priceCalc = calculateOptimalPrice(marketData, item.quantity);

//                     if (priceCalc.averagePrice > 0) {
//                         // 更新DOM元素
//                         priceElement.innerHTML = `最优: ${priceCalc.averagePrice.toLocaleString()} | 最低: ${priceCalc.minPrice.toLocaleString()}`;
//                         priceElement.className = 'text-xs text-blue-600';
//                         totalElement.innerHTML = `总价: ${priceCalc.totalCost.toLocaleString()}`;
//                         totalElement.className = 'text-xs text-green-600';
                        
//                         logEntry.status = 'SUCCESS';
//                         logEntry.finalPrice = priceCalc;
                        
//                         console.log(`[PriceLoader] 💰 Final price for ${item.name}: avg=${priceCalc.averagePrice}, min=${priceCalc.minPrice}, total=${priceCalc.totalCost}`);
//                     } else {
//                         priceElement.innerHTML = '暂无市场数据';
//                         priceElement.className = 'text-xs text-gray-500';
//                         totalElement.innerHTML = '总价: -';
//                         totalElement.className = 'text-xs text-gray-500';
                        
//                         logEntry.status = 'NO_DATA';
//                         console.warn(`[PriceLoader] ⚠️ No valid price calculated for ${item.name}`);
//                     }
//                 } else {
//                     // 错误情况下也要处理DOM
//                     if (priceElement) {
//                         priceElement.innerHTML = marketData ? '数据加载失败' : '暂无市场数据';
//                         priceElement.className = 'text-xs text-red-500';
//                     }
//                     if (totalElement) {
//                         totalElement.innerHTML = '总价: -';
//                         totalElement.className = 'text-xs text-gray-500';
//                     }
                    
//                     logEntry.status = 'ERROR';
//                     if (!marketData) {
//                         console.error(`[PriceLoader] ❌ No market data found for item ${item.id} (${item.name})`);
//                     }
//                     if (!priceElement || !totalElement) {
//                         console.error(`[PriceLoader] ❌ DOM elements not found for item ${item.id} (${item.name})`);
//                     }
//                 }

//                 // 添加当前项日志
//                 logEntries.push(logEntry);
//             });

//             // 统一组输出日志
//             console.group("📋 Price Loading Summary");
//             logEntries.forEach(entry => {
//                 const statusColor = entry.status === 'SUCCESS' ? '✅' : 
//                                   entry.status === 'NO_DATA' ? '⚠️' : '❌';
//                 console.log(`${statusColor} ${entry.itemName} (#${entry.itemId}) - ${entry.status}`);
//                 if (entry.finalPrice) {
//                     console.log(`   Price: avg=${entry.finalPrice.averagePrice}, min=${entry.finalPrice.minPrice}, total=${entry.finalPrice.totalCost}`);
//                 }
//             });
//             console.groupEnd();

//         } else {
//             console.error(`[PriceLoader] API request failed with status: ${response.status}`);
//             console.error(`[PriceLoader] API request failed with status: ${response.status}`);
//             const errorText = await response.text();
//             console.error('[PriceLoader] Error response:', errorText);

//             // 错误处理：给所有商品设置错误状态
//             craftingList.forEach(item => {
//                 const priceElement = document.getElementById(`price-${item.id}`);
//                 const totalElement = document.getElementById(`total-${item.id}`);
                
//                 if (priceElement) {
//                     priceElement.innerHTML = `API错误 (${response.status})`;
//                     priceElement.className = 'text-xs text-red-500';
//                 }
//                 if (totalElement) {
//                     totalElement.innerHTML = '总价: -';
//                     totalElement.className = 'text-xs text-gray-500';
//                 }
//             });
//         }
//     } catch (error) {
//         console.error('[PriceLoader] Failed to load market prices:', error);
        
//         // 发生异常时也要更新所有商品的状态
//         craftingList.forEach(item => {
//             const priceElement = document.getElementById(`price-${item.id}`);
//             const totalElement = document.getElementById(`total-${item.id}`);
            
//             if (priceElement) {
//                 priceElement.innerHTML = '网络请求失败';
//                 priceElement.className = 'text-xs text-red-500';
//             }
//             if (totalElement) {
//                 totalElement.innerHTML = '总价: -';
//                 totalElement.className = 'text-xs text-gray-500';
//             }
//         });
//     }
// }


function calculateOptimalPrice(marketData, requiredQuantity) {
    console.log("=== [PriceCalc] Start calculateOptimalPrice ===");
    console.log("[PriceCalc] Required quantity:", requiredQuantity);
    console.log("[PriceCalc] Market data snapshot:", {
        currentAveragePrice: marketData.currentAveragePrice,
        minPrice: marketData.minPrice,
        maxPrice: marketData.maxPrice,
        listingsCount: marketData.listings?.length || 0,
        isDatacenter: marketData.isDatacenter || false
    });

    if (!marketData) {
        console.warn("[PriceCalc] ❌ marketData is null/undefined");
        return { averagePrice: 0, totalCost: 0, minPrice: 0, cheapestListings: [] };
    }
    
    // 基础价格信息
    const currentAvgPrice = marketData.currentAveragePrice || 0;
    const minPrice = marketData.minPrice || 0;
    const maxPrice = marketData.maxPrice || 0;
    
    console.log("[PriceCalc] Base prices:", {
        currentAvgPrice,
        minPrice,
        maxPrice
    });
    
    // 如果没有 listings，就退回到历史价格
    if (!marketData.listings || marketData.listings.length === 0) {
        const fallbackPrice = currentAvgPrice || minPrice || 0;
        console.log("[PriceCalc] No listings, fallback price:", fallbackPrice);
        return {
            averagePrice: fallbackPrice,
            totalCost: fallbackPrice * requiredQuantity,
            minPrice: minPrice || fallbackPrice,
            cheapestListings: []
        };
    }

    // 过滤并排序 listings
    const validListings = marketData.listings
        .filter(listing => listing && listing.pricePerUnit > 0)
        .sort((a, b) => a.pricePerUnit - b.pricePerUnit);

    console.log("[PriceCalc] Valid listings count:", validListings.length);
    if (validListings.length > 0) {
        console.log("[PriceCalc] Cheapest listing:", {
            price: validListings[0].pricePerUnit,
            quantity: validListings[0].quantity,
            world: validListings[0].worldName || "单服"
        });
        console.log("[PriceCalc] Most expensive listing:", {
            price: validListings[validListings.length - 1].pricePerUnit,
            quantity: validListings[validListings.length - 1].quantity,
            world: validListings[validListings.length - 1].worldName || "单服"
        });
    }

    if (validListings.length === 0) {
        const fallbackPrice = currentAvgPrice || minPrice || 0;
        console.warn("[PriceCalc] ⚠️ No valid listings after filtering, using fallback:", fallbackPrice);
        return {
            averagePrice: fallbackPrice,
            totalCost: fallbackPrice * requiredQuantity,
            minPrice: minPrice || fallbackPrice,
            cheapestListings: []
        };
    }

    // 逐个 listing 买货计算最优成本
    let remainingQuantity = requiredQuantity;
    let totalCost = 0;

    for (const listing of validListings) {
        if (remainingQuantity <= 0) break;

        const quantityToBuy = Math.min(remainingQuantity, listing.quantity || 1);
        const cost = quantityToBuy * listing.pricePerUnit;
        
        console.log(`[PriceCalc] Buying ${quantityToBuy} @ ${listing.pricePerUnit} (total ${cost}) from ${listing.worldName || "单服"}`);
        
        totalCost += cost;
        remainingQuantity -= quantityToBuy;
    }

    // 如果还不够，就用最高价补齐
    if (remainingQuantity > 0) {
        const highestPrice = validListings[validListings.length - 1].pricePerUnit;
        const extraCost = remainingQuantity * highestPrice;
        totalCost += extraCost;
        console.warn(`[PriceCalc] ⚠️ Not enough listings, filled ${remainingQuantity} with highest price ${highestPrice}, cost=${extraCost}`);
    }

    const averagePrice = totalCost / requiredQuantity;
    const calculatedMinPrice = validListings[0].pricePerUnit;

    // 👇 这里新增：保存前 5 条最低 listing
    const cheapestListings = validListings.slice(0, 5).map(l => ({
        price: l.pricePerUnit,
        quantity: l.quantity,
        world: l.worldName || "单服"
    }));

    console.log("[PriceCalc] ✅ Final result:", {
        averagePrice: Math.round(averagePrice * 100) / 100,
        totalCost: Math.round(totalCost),
        minPrice: calculatedMinPrice,
        cheapestListings
    });
    console.log("=== [PriceCalc] End calculateOptimalPrice ===");

    return {
        averagePrice: Math.round(averagePrice * 100) / 100,
        totalCost: Math.round(totalCost),
        minPrice: calculatedMinPrice,
        cheapestListings   // ✅ 加上这个
    };
}
// // 【完全修复版】适应 Universalis API 的两种结构
// function calculateOptimalPrice(marketData, requiredQuantity) {
//     console.log('[DEBUG] Input marketData:', marketData);

//     // 处理数据中心返回的复杂结构
//     let listings = marketData.listings || [];
    
//     // 如果是数据中心模式，需要转换为标准格式
//     if (marketData.dcName && marketData.listings) {
//         // 转换数据中心的listings结构
//         const convertedListings = marketData.listings.map(listing => ({
//             pricePerUnit: listing.pricePerUnit || listing.price,
//             quantity: listing.quantity,
//             hq: listing.hq,
//             retainerName: listing.retainerName,
//             worldName: listing.worldName,
//             worldID: listing.worldID
//         }));
//         listings = convertedListings;
//     }

//     if (listings.length === 0) {
//         // 如果是数据中心的结构，需要特殊处理
//         console.log('数据中心')
//         if (marketData.dcName && marketData.currentAveragePrice) {
//             const fallbackPrice = marketData.currentAveragePrice;
//             return {
//                 averagePrice: fallbackPrice,
//                 totalCost: fallbackPrice * requiredQuantity,
//                 breakdown: [{
//                     price: fallbackPrice,
//                     quantity: requiredQuantity,
//                     source: 'average_price'
//                 }]
//             };
//         }
        
//         const fallbackPrice = marketData.currentAveragePrice || marketData.minPrice || 0;
//         return {
//             averagePrice: fallbackPrice,
//             totalCost: fallbackPrice * requiredQuantity,
//             breakdown: [{
//                 price: fallbackPrice,
//                 quantity: requiredQuantity,
//                 source: 'average_price'
//             }]
//         };
//     }

//     // 过滤有效报价
//     const validListings = listings.filter(listing => {
//         const price = listing.pricePerUnit || listing.price;
//         return typeof price === 'number' && price > 0;
//     });

//     console.log("[PriceCalc] Valid listings count:", validListings.length);
//     if (validListings.length > 0) {
//         console.log("[PriceCalc] Cheapest listing:", {
//             price: validListings[0].pricePerUnit,
//             quantity: validListings[0].quantity,
//             world: validListings[0].worldName || "单服"
//         });
//         console.log("[PriceCalc] Most expensive listing:", {
//             price: validListings[validListings.length - 1].pricePerUnit,
//             quantity: validListings[validListings.length - 1].quantity,
//             world: validListings[validListings.length - 1].worldName || "单服"
//         });
//     }

//     if (validListings.length === 0) {
//         const fallbackPrice = marketData.currentAveragePrice || 0;
//         return {
//             averagePrice: fallbackPrice,
//             totalCost: fallbackPrice * requiredQuantity,
//             breakdown: [{
//                 price: fallbackPrice,
//                 quantity: requiredQuantity,
//                 source: 'average_price'
//             }]
//         };
//     }

//     // 排序报价
//     const sortedListings = validListings.sort((a, b) => {
//         const priceA = a.pricePerUnit || a.price;
//         const priceB = b.pricePerUnit || b.price;
//         return priceA - priceB;
//     });

//     // 逐个 listing 买货计算最优成本
//     let remainingQuantity = requiredQuantity;
//     let totalCost = 0;
//     const breakdown = [];

//     for (const listing of sortedListings) {
//         if (remainingQuantity <= 0) break;

//         const quantityToBuy = Math.min(remainingQuantity, listing.quantity || 1);
//         const price = listing.pricePerUnit || listing.price;
//         const cost = quantityToBuy * price;
        
//         totalCost += cost;
//         remainingQuantity -= quantityToBuy;
        
//         breakdown.push({
//             price: price,
//             quantity: quantityToBuy,
//             retainer: listing.retainerName,
//             hq: listing.hq,
//             world: listing.worldName
//         });
//     }

//     // 补足余量
//     if (remainingQuantity > 0 && sortedListings.length > 0) {
//         const lastPrice = sortedListings[sortedListings.length - 1].pricePerUnit || 
//                          sortedListings[sortedListings.length - 1].price;
//         const additionalCost = remainingQuantity * lastPrice;
//         totalCost += additionalCost;
        
//         breakdown.push({
//             price: lastPrice,
//             quantity: remainingQuantity,
//             source: 'estimated_additional'
//         });
//     }

//     const averagePrice = totalCost / requiredQuantity;

//     console.log('[RESULT] Final price calculation:', {
//         averagePrice: averagePrice,
//         totalCost: totalCost,
//         breakdown: breakdown
//     });

//     return {
//         averagePrice: Math.round(averagePrice * 100) / 100,
//         totalCost: Math.round(totalCost),
//         breakdown: breakdown
//     };
// }


// Recipe analysis
async function analyzeCraftingList() {
    if (craftingList.length === 0) {
        showError('制作清单为空');
        return;
    }

    const analyzeBtn = document.getElementById('analyzeBtn');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = '<div class="loading"></div> 分析中...';
    analyzeBtn.disabled = true;

    try {
        const response = await fetch('/api/analyze-crafting-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                items: craftingList,
                server: currentServer 
            })
        });

        const data = await response.json();
        if (data.success) {
            displayAnalysisResults(data.analysis);
        } else {
            showError('分析失败: ' + data.error);
        }
    } catch (error) {
        showError('分析请求失败: ' + error.message);
    } finally {
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
    }
}

function displayAnalysisResults(analysis) {
    const resultsDiv = document.getElementById('analysisResults');
    const contentDiv = document.getElementById('analysisContent');
    
    let html = '<div class="space-y-6">';
    
    // Summary
    html += `
        <div class="bg-blue-50 p-4 rounded-lg">
            <h3 class="font-semibold text-blue-800 mb-2">分析摘要</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="text-center">
                    <p class="text-blue-600 font-bold text-lg">${analysis.total_items}</p>
                    <p class="text-blue-800">总物品数</p>
                </div>
                <div class="text-center">
                    <p class="text-green-600 font-bold text-lg">${analysis.total_materials}</p>
                    <p class="text-blue-800">所需材料</p>
                </div>
                <div class="text-center">
                    <p class="text-purple-600 font-bold text-lg">${analysis.estimated_cost.toLocaleString()}</p>
                    <p class="text-blue-800">预估成本</p>
                </div>
                <div class="text-center">
                    <p class="text-orange-600 font-bold text-lg">${analysis.craftable_items}</p>
                    <p class="text-blue-800">可制作物品</p>
                </div>
            </div>
        </div>
    `;
    
    // Materials breakdown
    if (analysis.materials && analysis.materials.length > 0) {
        html += `
            <div>
                <h3 class="font-semibold mb-3">所需材料清单</h3>
                <div class="overflow-x-auto">
                    <table class="w-full border border-gray-200 rounded-lg">
                        <thead class="bg-gray-100">
                            <tr>
                                <th class="px-4 py-2 text-left">材料名称</th>
                                <th class="px-4 py-2 text-center">所需数量</th>
                                <th class="px-4 py-2 text-right">单价</th>
                                <th class="px-4 py-2 text-right">总价</th>
                                <th class="px-4 py-2 text-center">来源</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        analysis.materials.forEach((material, index) => {
            console.log(`Material Index: ${index}`, material);
            html += `
                <tr class="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
                    <td class="px-4 py-2">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-cube text-gray-400"></i>
                            <span>${material.name}</span>
                        </div>
                    </td>
                    <td class="px-4 py-2 text-center font-mono">${material.quantity}</td>
                    <td class="px-4 py-2 text-right font-mono">${material.unit_price?.toLocaleString() || '-'}</td>
                    <td class="px-4 py-2 text-right font-mono">${material.total_price?.toLocaleString() || '-'}</td>
                    <td class="px-4 py-2 text-center">
                        <span class="px-2 py-1 rounded text-xs ${material.source === 'craftable' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                            ${material.source === 'craftable' ? '可制作' : '市场购买'}
                        </span>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div></div>';
    }
    
    html += '</div>';
    contentDiv.innerHTML = html;
    resultsDiv.classList.remove('hidden');
}

function hideAnalysisResults() {
    document.getElementById('analysisResults').classList.add('hidden');
}

// Test function for debugging price loading
async function testPriceLoading() {
    console.log('=== Test Price Loading ===');
    console.log(`Current server: ${currentServer}`);
    console.log(`Crafting list length: ${craftingList.length}`);
    
    if (craftingList.length === 0) {
        alert('制作清单为空！请先添加一些物品。');
        return;
    }
    
    // Add a test item if list is empty
    if (craftingList.length === 0) {
        craftingList.push({ id: 5057, name: '黑铁锭', quantity: 1, icon_url: '' });
        updateCraftingListDisplay();
    }
    
    console.log('Calling loadCraftingListPrices...');
    await loadCraftingListPrices();
    console.log('loadCraftingListPrices completed');
}

function hideItemDetails() {
    document.getElementById('itemDetailsModal').classList.add('hidden');
}

async function getItemRecipe(itemId) {
    try {
        const response = await fetch(`/api/recipe/${itemId}`);
        const data = await response.json();
        
        if (data.success && data.recipe) {
            const recipe = data.recipe;
            let recipeHtml = `
                <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h6 class="font-semibold mb-3">配方信息</h6>
                    <p class="mb-2"><strong>制作职业:</strong> ${recipe.craft_type}</p>
                    <p class="mb-3"><strong>产出数量:</strong> ${recipe.result_quantity}</p>
                    <h6 class="font-medium mb-2">所需材料:</h6>
                    <div class="space-y-2">
                        ${recipe.ingredients.map(ingredient => `
                            <div class="flex items-center space-x-2 text-sm">
                                ${ingredient.icon_url ? 
                                    `<img src="${ingredient.icon_url}" alt="${ingredient.name}" class="w-6 h-6 rounded">` :
                                    `<div class="w-6 h-6 bg-gray-300 rounded flex items-center justify-center">
                                        <i class="fas fa-cube text-gray-400 text-xs"></i>
                                     </div>`
                                }
                                <span>${ingredient.name} x${ingredient.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            // Append recipe info to existing content
            const content = document.getElementById('itemDetailsContent');
            content.innerHTML += recipeHtml;
        } else {
            showError(data.message || '该物品没有配方');
        }
    } catch (error) {
        showError('获取配方失败: ' + error.message);
    }
}

// Utility functions
function showSuccess(message) {
    // Simple success notification - you can enhance this
    alert('✅ ' + message);
}

function showError(message) {
    // Simple error notification - you can enhance this
    alert('❌ ' + message);
}

// 统一的市场数据获取函数
async function fetchMarketData(itemIds, server) {
    console.log(`[MarketAPI] Fetching market data for items: ${itemIds} on server: ${server}`);
    
    try {
        // 构建API URL - itemIds可以是单个ID或逗号分隔的多个ID
        const apiUrl = `https://universalis.app/api/v2/${server}/${itemIds}`;
        console.log(`[MarketAPI] Request URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: { 
                'User-Agent': 'FF14CraftingAssistant/1.0',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[MarketAPI] Raw response:`, data);
        
        return data;
    } catch (error) {
        console.error('[MarketAPI] Failed to fetch market data:', error);
        throw error;
    }
}

// 处理市场数据的统一函数
function processMarketData(rawData, itemId) {
    console.log(`[MarketProcessor] Processing data for item ${itemId}`);
    
    let marketData = null;
    
    // 判断数据结构并提取对应物品的数据
    if (rawData.items) {
        // 多物品格式
        marketData = rawData.items[itemId] || rawData.items[itemId.toString()];
    } else if (rawData.itemID) {
        // 单物品格式
        if (rawData.itemID == itemId) {
            marketData = rawData;
        }
    } else if (rawData.listings !== undefined) {
        // 直接就是市场数据
        marketData = rawData;
    }
    
    if (!marketData) {
        console.warn(`[MarketProcessor] No data found for item ${itemId}`);
        return null;
    }
    
    // 标准化数据格式
    const processed = {
        itemId: itemId,
        server: rawData.worldName || currentServer,
        isDatacenter: !rawData.worldName,
        lastUploadTime: marketData.lastUploadTime,
        listings: marketData.listings || [],
        recentHistory: marketData.recentHistory || [],
        currentAveragePrice: marketData.currentAveragePrice || 0,
        minPrice: marketData.minPrice || 0,
        maxPrice: marketData.maxPrice || 0,
        listingsCount: marketData.listings ? marketData.listings.length : 0
    };
    
    // 确保listings数据格式正确
    processed.listings = processed.listings.map(listing => ({
        price: listing.pricePerUnit,
        pricePerUnit: listing.pricePerUnit,
        quantity: listing.quantity,
        hq: listing.hq || false,
        retainer: listing.retainerName,
        retainerName: listing.retainerName,
        world: listing.worldName,
        worldName: listing.worldName,
        lastReviewTime: listing.lastReviewTime,
        materia: listing.materia || []
    })).sort((a, b) => a.price - b.price);
    
    console.log(`[MarketProcessor] Processed data:`, {
        itemId: processed.itemId,
        server: processed.server,
        isDatacenter: processed.isDatacenter,
        listingsCount: processed.listingsCount,
        minPrice: processed.minPrice,
        avgPrice: processed.currentAveragePrice
    });
    
    return processed;
}

// 修复物品详情显示函数
async function showItemDetails(itemId) {
    const modal = document.getElementById('itemDetailsModal');
    const title = document.getElementById('itemDetailsTitle');
    const content = document.getElementById('itemDetailsContent');
    
    // Show loading
    content.innerHTML = `
        <div class="text-center py-8">
            <div class="loading mx-auto mb-4"></div>
            <p class="text-gray-600">加载物品信息中...</p>
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    try {
        // 并行获取物品信息和市场数据
        const [itemResponse, marketData] = await Promise.all([
            fetch(`/api/item/${itemId}`),
            fetchMarketData(itemId, currentServer)
        ]);
        
        const itemData = await itemResponse.json();
        
        if (itemData.success) {
            const item = itemData.data.item;
            const processedMarket = processMarketData(marketData, itemId);
            
            title.textContent = item.name;
            
            let html = `
                <div class="flex items-start space-x-4 mb-6">
                    ${item.icon_url ? 
                        `<img src="${item.icon_url}" alt="${item.name}" class="w-16 h-16 rounded-lg">` :
                        `<div class="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                            <i class="fas fa-cube text-gray-600"></i>
                         </div>`
                    }
                    <div class="flex-1">
                        <h4 class="text-xl font-semibold">${item.name}</h4>
                        <p class="text-gray-600 mt-1">${item.description || '暂无描述'}</p>
                        <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>等级: ${item.level}</span>
                            ${item.can_be_hq ? '<span class="text-purple-600">可HQ</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
            
            // Market data
            if (processedMarket) {

                html += `
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        ${processedMarket.isDatacenter ? '<p class="text-sm text-blue-600 mb-3"><i class="fas fa-info-circle mr-1"></i>显示数据中心的市场数据</p>' : ''}
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div class="text-center">
                                <p class="text-sm text-gray-600">平均价格</p>
                                <p class="text-lg font-bold text-blue-600">${processedMarket.currentAveragePrice.toLocaleString()}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-600">最低价格</p>
                                <p class="text-lg font-bold text-green-600">${processedMarket.minPrice.toLocaleString()}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-600">最高价格</p>
                                <p class="text-lg font-bold text-red-600">${processedMarket.maxPrice.toLocaleString()}</p>
                            </div>
                            <div class="text-center">
                                <p class="text-sm text-gray-600">在售数量</p>
                                <p class="text-lg font-bold text-yellow-600">${processedMarket.listingsCount}</p>
                            </div>
                        </div>
                        
                        ${processedMarket.listings && processedMarket.listings.length > 0 ? `
                            <h6 class="font-medium mb-2">最便宜的在售商品</h6>
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm">
                                    <thead class="bg-gray-100">
                                        <tr>
                                            <th class="px-2 py-1 text-right">价格</th>
                                            <th class="px-2 py-1 text-center">数量</th>
                                            <th class="px-2 py-1 text-center">品质</th>
                                            <th class="px-2 py-1 text-left">雇员</th>
                                            ${processedMarket.isDatacenter ? '<th class="px-2 py-1 text-left">服务器</th>' : ''}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${processedMarket.listings.slice(0, 5).map(listing => `
                                            <tr class="border-t">
                                                <td class="px-2 py-1 text-right font-mono">${listing.price.toLocaleString()}</td>
                                                <td class="px-2 py-1 text-center">${listing.quantity}</td>
                                                <td class="px-2 py-1 text-center">
                                                    <span class="px-1 py-0.5 rounded text-xs ${listing.hq ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
                                                        ${listing.hq ? 'HQ' : 'NQ'}
                                                    </span>
                                                </td>
                                                <td class="px-2 py-1 text-left">${listing.retainer || '-'}</td>
                                                ${processedMarket.isDatacenter ? `<td class="px-2 py-1 text-left">${listing.world || '-'}</td>` : ''}
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : '<p class="text-gray-500 text-center py-2">暂无在售商品</p>'}
                    </div>
                `;
            } else {
                html += `
                    <div class="bg-gray-50 rounded-lg p-4 mb-4">
                        <h5 class="font-semibold mb-3">市场数据</h5>
                        <p class="text-gray-500 text-center py-4">无法获取市场数据</p>
                    </div>
                `;
            }
            
            // Recipe info
            html += `
                <div class="flex space-x-2">
                    <button onclick="getItemRecipe(${item.id})" 
                            class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">
                        <i class="fas fa-hammer mr-1"></i>查看配方
                    </button>
                    <button onclick="addToCraftingList(${item.id}, '${item.name.replace(/'/g, "\\'")}', 1, '${item.icon_url || ''}')" 
                            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                        <i class="fas fa-plus mr-1"></i>添加到清单
                    </button>
                </div>
            `;
            
            content.innerHTML = html;
        } else {
            content.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-600">加载失败: ${itemData.error}</p>
                </div>
            `;
        }
    } catch (error) {
        content.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-600">请求失败: ${error.message}</p>
            </div>
        `;
    }
}
