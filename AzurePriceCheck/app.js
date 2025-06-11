// Azure VM Price Comparison Application
// This application provides price comparison between on-demand and reserved instance pricing for Azure VMs

class AzureVMPriceComparison {
    constructor() {
        this.vmData = [];
        this.filteredData = [];
        this.chart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPricingData();
        this.updateLastUpdated();
        this.createChart();
    }

    // Load pricing data - API integration not available in this version
    loadPricingData() {
        this.showApiUnavailableMessage();
    }

    // Show message that API is not available
    showApiUnavailableMessage() {
        const tableBody = document.getElementById('price-table-body');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                        <div style="font-size: 1.2rem; margin-bottom: 10px;">🔌 Azure API Integration Not Available</div>
                        <p>Real-time pricing data is not available in this version.</p>
                        <p>Please use the API-enabled version (app-api.js) for live Azure pricing data.</p>
                    </td>
                </tr>
            `;
        }

        // Update summary cards to show no data
        document.getElementById('avg-savings').textContent = '--';
        document.getElementById('best-deal').textContent = '--';
        document.getElementById('vm-count').textContent = '0';
    }

    setupEventListeners() {
        const regionSelect = document.getElementById('region-select');
        const osSelect = document.getElementById('os-select');
        const tierSelect = document.getElementById('tier-select');
        const refreshBtn = document.getElementById('refresh-prices');

        [regionSelect, osSelect, tierSelect].forEach(select => {
            if (select) {
                select.addEventListener('change', () => this.showApiUnavailableMessage());
            }
        });

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.showApiUnavailableMessage());
        }
    }

    renderTable() {
        this.showApiUnavailableMessage();
    }

    updateSummaryCards() {
        document.getElementById('avg-savings').textContent = '--';
        document.getElementById('best-deal').textContent = '--';
        document.getElementById('vm-count').textContent = '0';
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
        
        // Show API unavailable message
        ctx.fillStyle = '#666';
        ctx.font = '20px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('🔌 Azure API Integration Required', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '14px Segoe UI';
        ctx.fillText('Use app-api.js for real-time pricing data', canvas.width / 2, canvas.height / 2 + 10);
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
