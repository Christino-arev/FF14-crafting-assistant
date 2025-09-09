// Test specific item (钴铁锭 ID: 5059) with 豆豆柴
async function testSpecificItem() {
    console.log('=== Testing 钴铁锭 (ID: 5059) with 豆豆柴 ===');
    
    const itemId = 5059;
    const datacenter = '豆豆柴';
    
    try {
        console.log(`Testing: ${datacenter}/${itemId}`);
        const response = await fetch(`https://universalis.app/api/v2/${datacenter}/${itemId}`, {
            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
        });
        
        console.log(`Response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API call successful');
            console.log(`ItemID: ${data.itemID}`);
            console.log(`dcName: ${data.dcName}`);
            console.log(`Listings: ${data.listings?.length || 0}`);
            console.log(`Current average price: ${data.currentAveragePrice}`);
            console.log(`Min price: ${data.minPrice}`);
            
            if (data.listings && data.listings.length > 0) {
                const sortedListings = data.listings
                    .filter(listing => listing.pricePerUnit > 0)
                    .sort((a, b) => a.pricePerUnit - b.pricePerUnit);
                
                console.log(`Valid listings: ${sortedListings.length}`);
                if (sortedListings.length > 0) {
                    console.log(`Price range: ${sortedListings[0].pricePerUnit} - ${sortedListings[sortedListings.length-1].pricePerUnit}`);
                    console.log(`First few listings:`);
                    sortedListings.slice(0, 3).forEach((listing, i) => {
                        console.log(`  ${i+1}. ${listing.pricePerUnit} gil x${listing.quantity} (${listing.hq ? 'HQ' : 'NQ'}) - ${listing.worldName}`);
                    });
                }
            } else {
                console.log('❌ No listings found');
            }
        } else {
            console.log(`❌ API call failed: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(`Response body: ${text.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    
    // Test with individual server for comparison
    console.log('\n=== Testing with YinLeiHu2 for comparison ===');
    try {
        const response = await fetch(`https://universalis.app/api/v2/YinLeiHu2/${itemId}`, {
            headers: { 'User-Agent': 'FF14CraftingAssistant/1.0' }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Server API call successful');
            console.log(`ItemID: ${data.itemID}`);
            console.log(`worldName: ${data.worldName}`);
            console.log(`Listings: ${data.listings?.length || 0}`);
            console.log(`Current average price: ${data.currentAveragePrice}`);
            console.log(`Min price: ${data.minPrice}`);
        }
    } catch (error) {
        console.log(`❌ Server test error: ${error.message}`);
    }
}

testSpecificItem();