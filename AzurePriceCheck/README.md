# Azure VM Price Comparison Tool with Real-Time API Integration

A comprehensive web application for comparing Azure Virtual Machine pricing between On-Demand and Reserved Instance options across all VM tiers, **now enhanced with real-time Azure pricing data**.

## 🚀 NEW: Real-Time Azure API Integration

This application now connects directly to **Azure's Retail Prices API** to provide:
- **Live pricing data** updated automatically from Azure
- **Regional accuracy** with real pricing for different Azure regions  
- **Always current** - prices reflect the latest Azure pricing changes
- **Intelligent fallback** - uses estimated data if API is unavailable
- **Smart caching** - 30-minute cache to optimize performance
- **Retry logic** - Robust error handling with exponential backoff

## Features

- **Real-time Price Comparison**: Compare On-Demand vs 1-Year vs 3-Year Reserved Instance pricing
- **All VM Tiers Supported**: General Purpose, Compute Optimized, Memory Optimized, Storage Optimized, and GPU instances
- **Multi-OS Support**: Linux and Windows pricing comparison
- **Interactive Filtering**: Filter by region, operating system, and VM tier
- **Visual Analytics**: Interactive charts showing price differences
- **Savings Calculator**: Automatic calculation of potential savings with reserved instances
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, Azure-themed interface following Microsoft design guidelines

## VM Tiers Included

### General Purpose (B & D Series)
- **B Series**: Burstable performance VMs (B1s, B1ms, B2s, B2ms, B4ms)
- **D Series**: Balanced compute, memory, and network (D2s_v3 through D32s_v3)

### Compute Optimized (F Series)
- **F Series**: High CPU-to-memory ratio (F2s_v2 through F32s_v2)

### Memory Optimized (E Series)
- **E Series**: High memory-to-CPU ratio (E2s_v3 through E32s_v3)

### Storage Optimized (L Series)
- **L Series**: High disk throughput and IO (L4s through L32s)

### GPU (NC Series)
- **NC Series**: GPU-enabled VMs for compute workloads (NC6, NC12, NC24)

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Grid, Flexbox, CSS Custom Properties
- **Charts**: Custom Canvas-based visualizations
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG 2.1 compliant
- **Performance**: Optimized for fast loading and smooth interactions

## Azure API Integration Details

### 🔗 **Azure Retail Prices API**
- **Endpoint**: `https://prices.azure.com/api/retail/prices`
- **Authentication**: None required (public API)
- **Rate Limits**: Handled with intelligent retry logic
- **Caching**: 30-minute local cache for performance optimization
- **Regions Supported**: East US, West US, West Europe, Southeast Asia

### 📊 **Data Processing**
- **Real-time On-Demand pricing** from Azure API
- **Estimated Reserved Instance pricing** (35% and 55% savings based on typical Azure discounts)
- **Automatic VM tier detection** from Azure ARM SKU names
- **Smart fallback** to display "API unavailable" message when Azure API is not accessible
- **Regional price variations** accurately reflected from live Azure data

### 🛡️ **Reliability Features**
- **Exponential backoff** retry logic (up to 3 attempts)
- **Connection timeout** handling (10-second timeout)
- **Rate limiting** detection and automatic retry
- **Error graceful degradation** to fallback data
- **Status indicators** showing live vs estimated data

### 🔄 **Cache Management**
- **Intelligent caching** by region and OS combination
- **30-minute cache expiration** for fresh data
- **Manual refresh** clears cache for immediate updates
- **Memory efficient** with automatic cleanup

## File Structure

```
AzurePriceCheck/
├── index.html          # Main HTML file (uses app-api.js by default)
├── styles.css          # CSS styles and Azure theme
├── app.js              # Fallback version (shows "API unavailable" message)
├── app-api.js          # Enhanced API-integrated version (real-time Azure data)
└── README.md           # This documentation
```

## Two Versions Available

### 🔄 **app-api.js** (Default - Real-Time API Version)
- Connects to Azure Retail Prices API for live data
- Intelligent caching and retry logic
- Status indicators showing data source
- Graceful degradation to fallback messages

### 📋 **app.js** (Fallback Version)
- Shows clear "API not available" messages
- No external API dependencies
- Demonstrates UI structure and design
- Useful for development and testing

## Getting Started

1. **Clone or download** the project files to your local machine
2. **Open** `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
3. **The app will automatically** attempt to load real-time Azure pricing data
4. **Use the filters** to select your preferred:
   - **Region**: East US, West US, West Europe, Southeast Asia
   - **Operating System**: Linux or Windows
   - **VM Tier**: All tiers or specific categories
5. **View pricing comparisons** in the interactive table and chart
6. **Click "Refresh Prices"** to get the latest pricing data from Azure
7. **Check the status indicator** at the bottom to see if live or fallback data is being used

### 🔧 **Switching Versions**
- **For live data**: Keep `index.html` using `app-api.js` (default)
- **For fallback**: Change `index.html` to use `app.js` instead

## Features Overview

### Price Comparison Table
- Sortable columns for easy comparison
- Real-time savings calculations
- Color-coded savings indicators
- Responsive design for all screen sizes

### Interactive Charts
- Visual comparison of pricing tiers
- Top 10 VMs displayed for clarity
- Color-coded bars for different pricing models
- Responsive canvas-based implementation

### Smart Filtering
- **Region Selection**: East US, West US, West Europe, Southeast Asia
- **Operating System**: Linux vs Windows pricing
- **VM Tier Filtering**: Focus on specific workload types
- **Real-time Updates**: Instant filtering without page reload

### Summary Cards
- **Average Savings**: Shows typical savings with reserved instances
- **Best Deal**: Highlights maximum savings potential
- **VM Count**: Total VMs matching current filters

## Pricing Data Sources

### 🔴 **Live Data (app-api.js)**
- **Real-time pricing** from Azure Retail Prices API
- **Regional accuracy** for East US, West US, West Europe, Southeast Asia
- **On-demand pricing** directly from Azure
- **Reserved Instance estimates** calculated at 35% (1-year) and 55% (3-year) savings
- **Automatic updates** when Azure changes pricing

### 🟡 **Fallback Data (app.js)**
- **Clear messaging** when API is not available
- **UI demonstration** without external dependencies
- **Development-friendly** for testing and modifications

> **Note**: Reserved Instance pricing is estimated based on typical Azure savings percentages. For precise RI pricing, consult the official Azure Pricing Calculator or Azure portal.

## Browser Compatibility

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+
- **Mobile browsers**: iOS Safari 13+, Chrome Mobile 80+

## Performance Features

- **Optimized Rendering**: Efficient DOM manipulation
- **Responsive Images**: Scalable vector graphics
- **Fast Filtering**: Client-side data processing
- **Smooth Animations**: CSS transitions and transforms
- **Memory Efficient**: Minimal memory footprint

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Accessible color schemes
- **Focus Indicators**: Clear focus states
- **Responsive Text**: Scalable font sizes

## Development Notes

### Code Organization
- **Modular JavaScript**: Class-based architecture
- **Separation of Concerns**: HTML structure, CSS presentation, JS behavior
- **Error Handling**: Comprehensive error catching and user feedback
- **Performance Optimization**: Efficient algorithms and DOM updates

### Azure Integration Ready
The application is structured to easily integrate with Azure APIs:
- **Azure Resource Manager**: For live pricing data
- **Azure Cost Management**: For usage-based recommendations
- **Azure Marketplace**: For additional VM configurations
- **Azure Monitor**: For performance tracking

### Customization Options
- **Theming**: CSS custom properties for easy theme changes
- **Data Sources**: Configurable data loading from APIs or files
- **Regions**: Easy addition of new Azure regions
- **VM Types**: Simple addition of new VM configurations

## Future Enhancements

### 🚀 **Planned Features**
- **Reserved Instance API**: Direct integration with Azure RI pricing (requires authentication)
- **Cost Calculator**: Monthly/yearly cost projections with usage patterns
- **Usage Recommendations**: AI-powered VM size suggestions based on workload
- **Export Features**: PDF/CSV export of pricing comparisons
- **Advanced Filtering**: Filter by CPU count, RAM size, storage specifications
- **Price Alerts**: Email notifications for significant price changes
- **Multi-Cloud**: Comparison with AWS EC2 and Google Cloud Compute pricing

### 🔌 **Advanced API Integration**
The current implementation can be extended with:
- **Azure Cost Management API**: For historical pricing trends
- **Azure Resource Manager API**: For customer's current VM inventory
- **Azure Advisor API**: For personalized recommendations
- **Azure Monitor API**: For performance-based sizing suggestions

### 💡 **Enterprise Features**
- **Authentication**: Azure AD integration for personalized pricing
- **Multi-tenant**: Support for different Azure subscriptions
- **Custom Regions**: Support for Azure Government and specialized regions
- **Compliance**: SOC, HIPAA, and other compliance framework considerations

## Contributing

This project follows Azure development best practices:
- **Security**: No hardcoded credentials, secure API patterns ready
- **Performance**: Optimized for scale and responsiveness
- **Accessibility**: WCAG 2.1 AA compliance
- **Maintainability**: Clean, documented code structure

## License

This project is provided as-is for demonstration purposes. Pricing data is for educational use only.

## Support & Troubleshooting

### 🔍 **Common Issues**

**No data showing / API not available message:**
- Check internet connection
- Verify browser supports fetch API (modern browsers)
- Check browser console for CORS or network errors
- Azure API may be temporarily unavailable

**Prices seem outdated:**
- Click "Refresh Prices" button to clear cache
- Check the "Last updated" timestamp
- Verify you're using the API version (app-api.js)

**Chart not displaying:**
- Ensure browser supports HTML5 Canvas
- Check if data is available for selected filters
- Try refreshing the page

### 🛠️ **Development Issues**
1. Check the browser console for error messages
2. Verify all files are in the same directory
3. Ensure JavaScript is enabled
4. Try using a local web server for file:// protocol issues

### 📞 **Getting Help**
- Check browser compatibility (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Verify network connectivity to `prices.azure.com`
- Review console logs for detailed error information

---

**Built with ❤️ for the Azure community**
