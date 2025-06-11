// Azure VM Price Comparison Application with Real-Time API Integration
// This application provides price comparison between on-demand and reserved instance pricing for Azure VMs
// Enhanced with real-time Azure Retail Prices API integration

class AzureVMPriceComparison {
    constructor() {
        this.vmData = [];
        this.filteredData = [];
        this.chart = null;
        this.priceCache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes cache
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.lastRegion = null;
        this.lastOS = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPricingData();
    }    // Load pricing data from Azure Retail Prices API with fallback to mock data
    async loadPricingData() {
        this.showLoadingState();
        this.updateApiStatus('loading', 'Connecting to Azure API...');
        
        try {
            // Try to load from Azure API first
            const apiData = await this.fetchAzurePricing();
            if (apiData && apiData.length > 0) {
                this.vmData = apiData;
                this.updateApiStatus('live', `Live data: ${apiData.length} VMs from Azure API`);
                console.log(`Loaded ${apiData.length} VM prices from Azure API`);
            } else {
                throw new Error('No data received from Azure API');
            }
        } catch (error) {
            console.warn('Failed to load from Azure API, using mock data:', error.message);
            this.loadMockData();
            this.updateApiStatus('fallback', 'Using estimated pricing data');
        }
        
        this.filteredData = [...this.vmData];
        this.hideLoadingState();
        this.renderTable();
        this.updateLastUpdated();
        this.createChart();
    }

    // Fetch real-time pricing from Azure Retail Prices API
    async fetchAzurePricing() {
        const selectedRegion = document.getElementById('region-select')?.value || 'us-east';
        const selectedOS = document.getElementById('os-select')?.value || 'linux';
        
        // Map our regions to Azure location names
        const regionMap = {
            'us-east': 'eastus',
            'us-west': 'westus2', 
            'eu-west': 'westeurope',
            'asia-southeast': 'southeastasia'
        };
        
        const azureRegion = regionMap[selectedRegion];
        const cacheKey = `${azureRegion}-${selectedOS}`;
        
        // Check cache first
        const cached = this.priceCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            console.log('Using cached pricing data');
            return cached.data;
        }

        try {
            // Build API URL for Azure Retail Prices API
            const baseUrl = 'https://prices.azure.com/api/retail/prices';
            const filters = [
                `armRegionName eq '${azureRegion}'`,
                `serviceName eq 'Virtual Machines'`,
                `priceType eq 'Consumption'`, // On-demand pricing
                selectedOS === 'linux' ? `productName contains 'Linux'` : `productName contains 'Windows'`
            ];
            
            const url = `${baseUrl}?$filter=${encodeURIComponent(filters.join(' and '))}`;
            
            console.log('Fetching pricing from Azure API...');
            const response = await this.fetchWithRetry(url);
            
            if (!response.ok) {
                throw new Error(`Azure API returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const processedData = this.processAzureApiData(data.Items, selectedOS);
            
            // Cache the results
            this.priceCache.set(cacheKey, {
                data: processedData,
                timestamp: Date.now()
            });
            
            return processedData;
            
        } catch (error) {
            console.error('Error fetching Azure pricing:', error);
            throw error;
        }
    }

    // Process Azure API response into our format
    processAzureApiData(apiItems, selectedOS) {
        const vmMap = new Map();
        
        // Group by VM size and calculate averages
        apiItems.forEach(item => {
            if (!item.armSkuName || !item.unitPrice) return;
            
            const vmSize = this.extractVMSize(item.armSkuName);
            if (!vmSize) return;
            
            const tier = this.determineVMTier(vmSize);
            const specs = this.getVMSpecs(vmSize);
            
            if (!vmMap.has(vmSize)) {
                vmMap.set(vmSize, {
                    size: vmSize,
                    tier: tier,
                    vcpus: specs.vcpus,
                    ram: specs.ram,
                    onDemand: item.unitPrice,
                    reserved1yr: item.unitPrice * 0.65, // Estimated 35% savings
                    reserved3yr: item.unitPrice * 0.45, // Estimated 55% savings
                    os: selectedOS,
                    lastUpdated: new Date().toISOString()
                });
            }
        });
        
        return Array.from(vmMap.values()).filter(vm => vm.onDemand > 0);
    }

    // Extract VM size from ARM SKU name
    extractVMSize(armSkuName) {
        // Azure ARM SKU patterns: Standard_D2s_v3, Standard_F4s_v2, etc.
        const match = armSkuName.match(/Standard_([A-Z0-9_v]+)/i);
        return match ? match[1] : null;
    }

    // Determine VM tier based on size
    determineVMTier(vmSize) {
        if (vmSize.startsWith('B')) return 'general';
        if (vmSize.startsWith('D')) return 'general';
        if (vmSize.startsWith('F')) return 'compute';
        if (vmSize.startsWith('E')) return 'memory';
        if (vmSize.startsWith('L')) return 'storage';
        if (vmSize.startsWith('NC') || vmSize.startsWith('ND') || vmSize.startsWith('NV')) return 'gpu';
        return 'general';
    }

    // Get VM specifications (simplified lookup)
    getVMSpecs(vmSize) {
        const specs = {
            // B Series
            'B1s': { vcpus: 1, ram: 1 },
            'B1ms': { vcpus: 1, ram: 2 },
            'B2s': { vcpus: 2, ram: 4 },
            'B2ms': { vcpus: 2, ram: 8 },
            'B4ms': { vcpus: 4, ram: 16 },
            // D Series
            'D2s_v3': { vcpus: 2, ram: 8 },
            'D4s_v3': { vcpus: 4, ram: 16 },
            'D8s_v3': { vcpus: 8, ram: 32 },
            'D16s_v3': { vcpus: 16, ram: 64 },
            'D32s_v3': { vcpus: 32, ram: 128 },
            // F Series
            'F2s_v2': { vcpus: 2, ram: 4 },
            'F4s_v2': { vcpus: 4, ram: 8 },
            'F8s_v2': { vcpus: 8, ram: 16 },
            'F16s_v2': { vcpus: 16, ram: 32 },
            'F32s_v2': { vcpus: 32, ram: 64 },
            // E Series
            'E2s_v3': { vcpus: 2, ram: 16 },
            'E4s_v3': { vcpus: 4, ram: 32 },
            'E8s_v3': { vcpus: 8, ram: 64 },
            'E16s_v3': { vcpus: 16, ram: 128 },
            'E32s_v3': { vcpus: 32, ram: 256 }
        };
        
        return specs[vmSize] || { vcpus: 1, ram: 1 };
    }

    // Fetch with retry logic and exponential backoff
    async fetchWithRetry(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Azure-VM-Price-Comparison/1.0'
            },
            timeout: 10000,
            ...options
        };

        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);
                
                const response = await fetch(url, {
                    ...defaultOptions,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    this.retryCount = 0; // Reset retry count on success
                    return response;
                }
                
                if (response.status === 429) { // Rate limited
                    const retryAfter = response.headers.get('Retry-After') || Math.pow(2, attempt);
                    console.log(`Rate limited, retrying after ${retryAfter}s`);
                    await this.delay(retryAfter * 1000);
                    continue;
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                
            } catch (error) {
                if (attempt === this.maxRetries) {
                    throw error;
                }
                
                const delayMs = Math.pow(2, attempt) * 1000; // Exponential backoff
                console.log(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`, error.message);
                await this.delay(delayMs);
            }
        }
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Show loading state
    showLoadingState() {
        this.isLoading = true;
        const tableBody = document.getElementById('price-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="loading">
                        <div class="loading-animation">🔄 Loading real-time pricing from Azure...</div>
                    </td>
                </tr>
            `;
        }
        
        const refreshBtn = document.getElementById('refresh-prices');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Loading...';
        }
    }

    // Hide loading state
    hideLoadingState() {
        this.isLoading = false;
        const refreshBtn = document.getElementById('refresh-prices');
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Refresh Prices';
        }
    }

    // Fallback mock data for when Azure API is unavailable
    loadMockData() {
        console.log('Loading fallback mock data...');
        this.vmData = [
            // General Purpose - B Series
            { size: 'B1s', tier: 'general', vcpus: 1, ram: 1, onDemand: 0.0104, reserved1yr: 0.0068, reserved3yr: 0.0045, os: 'linux' },
            { size: 'B1ms', tier: 'general', vcpus: 1, ram: 2, onDemand: 0.0208, reserved1yr: 0.0135, reserved3yr: 0.0090, os: 'linux' },
            { size: 'B2s', tier: 'general', vcpus: 2, ram: 4, onDemand: 0.0416, reserved1yr: 0.0270, reserved3yr: 0.0180, os: 'linux' },
            { size: 'B2ms', tier: 'general', vcpus: 2, ram: 8, onDemand: 0.0832, reserved1yr: 0.0540, reserved3yr: 0.0360, os: 'linux' },
            { size: 'B4ms', tier: 'general', vcpus: 4, ram: 16, onDemand: 0.1664, reserved1yr: 0.1080, reserved3yr: 0.0720, os: 'linux' },

            // General Purpose - D Series
            { size: 'D2s_v3', tier: 'general', vcpus: 2, ram: 8, onDemand: 0.096, reserved1yr: 0.0624, reserved3yr: 0.0416, os: 'linux' },
            { size: 'D4s_v3', tier: 'general', vcpus: 4, ram: 16, onDemand: 0.192, reserved1yr: 0.1248, reserved3yr: 0.0832, os: 'linux' },
            { size: 'D8s_v3', tier: 'general', vcpus: 8, ram: 32, onDemand: 0.384, reserved1yr: 0.2496, reserved3yr: 0.1664, os: 'linux' },
            { size: 'D16s_v3', tier: 'general', vcpus: 16, ram: 64, onDemand: 0.768, reserved1yr: 0.4992, reserved3yr: 0.3328, os: 'linux' },
            { size: 'D32s_v3', tier: 'general', vcpus: 32, ram: 128, onDemand: 1.536, reserved1yr: 0.9984, reserved3yr: 0.6656, os: 'linux' },

            // Compute Optimized - F Series
            { size: 'F2s_v2', tier: 'compute', vcpus: 2, ram: 4, onDemand: 0.085, reserved1yr: 0.0553, reserved3yr: 0.0368, os: 'linux' },
            { size: 'F4s_v2', tier: 'compute', vcpus: 4, ram: 8, onDemand: 0.169, reserved1yr: 0.1099, reserved3yr: 0.0732, os: 'linux' },
            { size: 'F8s_v2', tier: 'compute', vcpus: 8, ram: 16, onDemand: 0.338, reserved1yr: 0.2197, reserved3yr: 0.1464, os: 'linux' },
            { size: 'F16s_v2', tier: 'compute', vcpus: 16, ram: 32, onDemand: 0.676, reserved1yr: 0.4394, reserved3yr: 0.2928, os: 'linux' },
            { size: 'F32s_v2', tier: 'compute', vcpus: 32, ram: 64, onDemand: 1.352, reserved1yr: 0.8788, reserved3yr: 0.5856, os: 'linux' },

            // Memory Optimized - E Series
            { size: 'E2s_v3', tier: 'memory', vcpus: 2, ram: 16, onDemand: 0.126, reserved1yr: 0.0819, reserved3yr: 0.0546, os: 'linux' },
            { size: 'E4s_v3', tier: 'memory', vcpus: 4, ram: 32, onDemand: 0.252, reserved1yr: 0.1638, reserved3yr: 0.1092, os: 'linux' },
            { size: 'E8s_v3', tier: 'memory', vcpus: 8, ram: 64, onDemand: 0.504, reserved1yr: 0.3276, reserved3yr: 0.2184, os: 'linux' },
            { size: 'E16s_v3', tier: 'memory', vcpus: 16, ram: 128, onDemand: 1.008, reserved1yr: 0.6552, reserved3yr: 0.4368, os: 'linux' },
            { size: 'E32s_v3', tier: 'memory', vcpus: 32, ram: 256, onDemand: 2.016, reserved1yr: 1.3104, reserved3yr: 0.8736, os: 'linux' },

            // Storage Optimized - L Series
            { size: 'L4s', tier: 'storage', vcpus: 4, ram: 32, onDemand: 0.294, reserved1yr: 0.1911, reserved3yr: 0.1274, os: 'linux' },
            { size: 'L8s', tier: 'storage', vcpus: 8, ram: 64, onDemand: 0.588, reserved1yr: 0.3822, reserved3yr: 0.2548, os: 'linux' },
            { size: 'L16s', tier: 'storage', vcpus: 16, ram: 128, onDemand: 1.176, reserved1yr: 0.7644, reserved3yr: 0.5096, os: 'linux' },
            { size: 'L32s', tier: 'storage', vcpus: 32, ram: 256, onDemand: 2.352, reserved1yr: 1.5288, reserved3yr: 1.0192, os: 'linux' },

            // GPU - NC Series
            { size: 'NC6', tier: 'gpu', vcpus: 6, ram: 56, onDemand: 0.90, reserved1yr: 0.585, reserved3yr: 0.39, os: 'linux' },
            { size: 'NC12', tier: 'gpu', vcpus: 12, ram: 112, onDemand: 1.80, reserved1yr: 1.17, reserved3yr: 0.78, os: 'linux' },
            { size: 'NC24', tier: 'gpu', vcpus: 24, ram: 224, onDemand: 3.60, reserved1yr: 2.34, reserved3yr: 1.56, os: 'linux' },

            // Windows variants (higher pricing)
            { size: 'D2s_v3', tier: 'general', vcpus: 2, ram: 8, onDemand: 0.192, reserved1yr: 0.1248, reserved3yr: 0.0832, os: 'windows' },
            { size: 'D4s_v3', tier: 'general', vcpus: 4, ram: 16, onDemand: 0.384, reserved1yr: 0.2496, reserved3yr: 0.1664, os: 'windows' },
            { size: 'F4s_v2', tier: 'compute', vcpus: 4, ram: 8, onDemand: 0.276, reserved1yr: 0.1794, reserved3yr: 0.1196, os: 'windows' },
            { size: 'E4s_v3', tier: 'memory', vcpus: 4, ram: 32, onDemand: 0.404, reserved1yr: 0.2626, reserved3yr: 0.1750, os: 'windows' }
        ];
    }

    setupEventListeners() {
        const regionSelect = document.getElementById('region-select');
        const osSelect = document.getElementById('os-select');
        const tierSelect = document.getElementById('tier-select');
        const refreshBtn = document.getElementById('refresh-prices');

        [regionSelect, osSelect, tierSelect].forEach(select => {
            if (select) {
                select.addEventListener('change', () => this.handleFilterChange());
            }
        });

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshPrices());
        }
    }

    // Handle filter changes - reload data if region or OS changes
    async handleFilterChange() {
        const currentRegion = document.getElementById('region-select')?.value;
        const currentOS = document.getElementById('os-select')?.value;
        
        // If region or OS changed, reload pricing data
        if (this.lastRegion !== currentRegion || this.lastOS !== currentOS) {
            this.lastRegion = currentRegion;
            this.lastOS = currentOS;
            await this.loadPricingData();
        } else {
            // Just filter existing data
            this.filterData();
        }
    }

    filterData() {
        const selectedOS = document.getElementById('os-select').value;
        const selectedTier = document.getElementById('tier-select').value;

        this.filteredData = this.vmData.filter(vm => {
            const osMatch = vm.os === selectedOS;
            const tierMatch = selectedTier === 'all' || vm.tier === selectedTier;
            return osMatch && tierMatch;
        });

        this.renderTable();
        this.updateSummaryCards();
        this.updateChart();
    }

    renderTable() {
        const tbody = document.getElementById('price-table-body');
        tbody.innerHTML = '';

        if (this.filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No VMs found for selected filters</td></tr>';
            return;
        }

        // Sort by on-demand price
        const sortedData = this.filteredData.sort((a, b) => a.onDemand - b.onDemand);

        sortedData.forEach(vm => {
            const savings1yr = ((vm.onDemand - vm.reserved1yr) / vm.onDemand * 100);
            const savings3yr = ((vm.onDemand - vm.reserved3yr) / vm.onDemand * 100);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="vm-size">${vm.size}</td>
                <td>${vm.vcpus}</td>
                <td>${vm.ram}</td>
                <td>$${vm.onDemand.toFixed(4)}</td>
                <td>$${vm.reserved1yr.toFixed(4)}</td>
                <td>$${vm.reserved3yr.toFixed(4)}</td>
                <td class="savings-positive">${savings1yr.toFixed(1)}%</td>
                <td class="savings-positive">${savings3yr.toFixed(1)}%</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateSummaryCards() {
        if (this.filteredData.length === 0) return;

        const avgSavings1yr = this.filteredData.reduce((sum, vm) => {
            return sum + ((vm.onDemand - vm.reserved1yr) / vm.onDemand * 100);
        }, 0) / this.filteredData.length;

        const maxSavings3yr = Math.max(...this.filteredData.map(vm => 
            ((vm.onDemand - vm.reserved3yr) / vm.onDemand * 100)
        ));

        document.getElementById('avg-savings').textContent = `${avgSavings1yr.toFixed(0)}%`;
        document.getElementById('best-deal').textContent = `${maxSavings3yr.toFixed(0)}%`;
        document.getElementById('vm-count').textContent = `${this.filteredData.length}`;
    }

    createChart() {
        const canvas = document.getElementById('price-chart');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 400;
        
        this.updateChart();
    }

    updateChart() {
        const canvas = document.getElementById('price-chart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.filteredData.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '20px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Take first 10 VMs for the chart
        const chartData = this.filteredData.slice(0, 10);
        const margin = 60;
        const chartWidth = canvas.width - (margin * 2);
        const chartHeight = canvas.height - (margin * 2);
        const barWidth = chartWidth / chartData.length / 3 - 10;

        // Find max price for scaling
        const maxPrice = Math.max(...chartData.flatMap(vm => [vm.onDemand, vm.reserved1yr, vm.reserved3yr]));
        const scale = chartHeight / maxPrice;

        // Colors
        const colors = {
            onDemand: '#d13438',
            reserved1yr: '#ff8c00',
            reserved3yr: '#107c10'
        };

        // Draw bars
        chartData.forEach((vm, index) => {
            const x = margin + (index * chartWidth / chartData.length);
            
            // On-demand bar
            const onDemandHeight = vm.onDemand * scale;
            ctx.fillStyle = colors.onDemand;
            ctx.fillRect(x, margin + chartHeight - onDemandHeight, barWidth, onDemandHeight);
            
            // 1-year reserved bar
            const reserved1yrHeight = vm.reserved1yr * scale;
            ctx.fillStyle = colors.reserved1yr;
            ctx.fillRect(x + barWidth + 5, margin + chartHeight - reserved1yrHeight, barWidth, reserved1yrHeight);
            
            // 3-year reserved bar
            const reserved3yrHeight = vm.reserved3yr * scale;
            ctx.fillStyle = colors.reserved3yr;
            ctx.fillRect(x + (barWidth + 5) * 2, margin + chartHeight - reserved3yrHeight, barWidth, reserved3yrHeight);
            
            // VM size label
            ctx.fillStyle = '#323130';
            ctx.font = '12px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText(vm.size, x + barWidth * 1.5, margin + chartHeight + 20);
        });

        // Draw legend
        const legendY = 20;
        ctx.font = '14px Segoe UI';
        
        ctx.fillStyle = colors.onDemand;
        ctx.fillRect(20, legendY, 15, 15);
        ctx.fillStyle = '#323130';
        ctx.textAlign = 'left';
        ctx.fillText('On-Demand', 45, legendY + 12);
        
        ctx.fillStyle = colors.reserved1yr;
        ctx.fillRect(150, legendY, 15, 15);
        ctx.fillStyle = '#323130';
        ctx.fillText('1-Year Reserved', 175, legendY + 12);
        
        ctx.fillStyle = colors.reserved3yr;
        ctx.fillRect(320, legendY, 15, 15);
        ctx.fillStyle = '#323130';
        ctx.fillText('3-Year Reserved', 345, legendY + 12);

        // Chart title
        ctx.font = '16px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('Hourly Pricing Comparison (Top 10 VMs)', canvas.width / 2, legendY + 12);
    }

    async refreshPrices() {
        if (this.isLoading) return; // Prevent multiple concurrent refreshes
        
        console.log('Refreshing prices...');
        
        // Clear cache to force fresh data
        this.priceCache.clear();
        
        // Reload pricing data
        await this.loadPricingData();
    }

    // Update API status indicator
    updateApiStatus(status, message) {
        const statusIndicator = document.getElementById('api-status-indicator');
        const statusText = document.getElementById('api-status-text');
        const statusContainer = document.querySelector('.api-status');
        
        if (statusIndicator && statusText && statusContainer) {
            // Remove all status classes
            statusContainer.classList.remove('live', 'fallback', 'loading');
            
            // Add appropriate class and update content
            switch (status) {
                case 'live':
                    statusContainer.classList.add('live');
                    statusIndicator.textContent = '🟢';
                    break;
                case 'fallback':
                    statusContainer.classList.add('fallback');
                    statusIndicator.textContent = '🟡';
                    break;
                case 'loading':
                    statusContainer.classList.add('loading');
                    statusIndicator.textContent = '🔄';
                    break;
            }
            
            statusText.textContent = message;
        }
    }

    updateLastUpdated() {
        const now = new Date();
        const formatted = now.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('last-updated').textContent = formatted;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new AzureVMPriceComparison();
    } catch (error) {
        console.error('Failed to initialize Azure VM Price Comparison:', error);
        document.body.innerHTML = `
            <div class="error">
                <h2>Application Error</h2>
                <p>Failed to load the price comparison tool. Please refresh the page and try again.</p>
                <p>Error details: ${error.message}</p>
            </div>
        `;
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AzureVMPriceComparison;
}
