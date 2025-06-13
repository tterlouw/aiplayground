# Doner Order Website - Design Plan

## Project Overview
A mobile-first website for ordering food from a halal restaurant, designed for collaborative ordering with automatic time-based controls and SMS integration.

## 🎯 Core Requirements
- **Technology Stack**: HTML, CSS, JavaScript only
- **Mobile-First**: Optimized for smartphones
- **Hosting**: Azure App Service (Web App)
- **SMS Service**: Azure Communication Services for SMS delivery
- **Collaborative Ordering**: Multiple people can order through one session
- **Time-Based Automation**: Order finalization at 11:15 AM, daily reset after 2 PM
- **SMS Integration**: Send order summary to restaurant
- **Name Validation**: Prevent ordering without entering a name

## 🍽️ Menu Items (from prijslijst.txt)

### French Fries (Patat)
- Patat zonder (Plain fries) - €4.00
- Patat Met saus (Fries with sauce) - €4.50
- Patat Speciaal (Special fries with sauce and onions) - €5.00

### Döner Options
- Döner Box (with chicken/veal/falafel/halloumi + potato salad + sauce) - €8.50
- Drum Döner (chicken/veal/falafel/halloumi) - €8.50
- Drum Döner Menu (with salad, sauce, and drink) - €14.00

### Wraps & Sandwiches
- Kapsalon Klein (Small) - €8.00
- Kapsalon Groot (Large) - €10.00
- Broodje Falafel (Falafel sandwich) - €7.00
- Broodje Halloumi (Halloumi sandwich) - €7.00
- Broodje Döner (Döner sandwich) - €7.50

### Pizza
- Turkse Pizza Salade - €4.50
- Turkse Pizza Kaas - €5.50
- Turkse Pizza Deluxe - €8.50

### Menu Deals
- Döner Menu (with salad, sauce, and drink) - €13.00

## 📱 User Interface Design

### Mobile-First Material Design 3 Layout
```
┌─────────────────────────────────────┐
│          App Bar (64px)             │
│    🍽️ Döner Orders                  │
│         [⚙️ Admin]                   │
├─────────────────────────────────────┤
│       Surface Container (16px)      │
│  ┌─────────────────────────────────┐│
│  │      Name Input Field           ││
│  │   [Your Name] 💁‍♂️               ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│       Status Card (MD3 Level 1)     │
│  ⏰ Open until 11:15 | 👥 3 orders  │
├─────────────────────────────────────┤
│     Category Navigation Tabs        │
│ [🍟 Fries][🥙 Döner][🥪 Wraps]...   │
├─────────────────────────────────────┤
│        Product Grid (16px gap)      │
│ ┌─────────────┐ ┌─────────────────┐ │
│ │             │ │                 │ │
│ │ Product     │ │ Product Card    │ │
│ │ Image       │ │ €8.50           │ │
│ │             │ │ [+ Add] 👆       │ │
│ └─────────────┘ └─────────────────┘ │
├─────────────────────────────────────┤
│     Current Orders (Collapsible)    │
│ 📋 Orders (3) ▼                     │
│ • John: Döner Box (2x)              │
│ • Maria: Patat Speciaal (1x)        │
├─────────────────────────────────────┤
│      Floating Action Button         │
│           [📱 Send SMS]              │
└─────────────────────────────────────┘
```

### Material Design 3 Component Specifications

#### App Bar (Primary Surface)
- **Height**: 64px
- **Background**: Primary color (#006A6B)
- **Elevation**: Level 0 (flat)
- **Title**: Headline Medium (28px)
- **Actions**: Icon buttons 48x48px touch target

#### Cards (Elevated Surfaces)
- **Background**: Surface Container
- **Elevation**: Level 1 (subtle shadow)
- **Border Radius**: 12px (md)
- **Padding**: 16px
- **Margin**: 8px between cards

#### Buttons (Material You Style)
- **Primary Button**: Filled button style
- **Secondary Button**: Outlined button style
- **Icon Buttons**: 48x48px touch target
- **Minimum Height**: 40px
- **Border Radius**: 20px (pill shape)

#### Input Fields (Outlined Style)
- **Border**: 1px solid Outline color
- **Border Radius**: 4px
- **Padding**: 16px horizontal, 12px vertical
- **Focus State**: 2px Primary color border
- **Label**: Floating label animation

### Material Design 3 Color Palette (Serene & Professional)

#### Primary Color System
- **Primary**: #006A6B (Deep Teal - calming, professional)
- **On Primary**: #FFFFFF (White text on primary)
- **Primary Container**: #6FF7F8 (Light teal container)
- **On Primary Container**: #002020 (Dark text on light teal)

#### Secondary Color System
- **Secondary**: #4A6363 (Muted Blue-Gray - sophisticated)
- **On Secondary**: #FFFFFF (White text on secondary)
- **Secondary Container**: #CCE8E8 (Light blue-gray container)
- **On Secondary Container**: #051F1F (Dark text on light container)

#### Tertiary Color System (Warm Accent)
- **Tertiary**: #526600 (Olive Green - natural, appetizing)
- **On Tertiary**: #FFFFFF (White text on tertiary)
- **Tertiary Container**: #D5ED78 (Light olive container)
- **On Tertiary Container**: #181E00 (Dark text on light olive)

#### Neutral Color System
- **Surface**: #FAFDFC (Off-white with hint of teal)
- **On Surface**: #191C1C (Near black for text)
- **Surface Variant**: #DAE5E4 (Light gray-teal)
- **On Surface Variant**: #3F4948 (Medium gray for secondary text)
- **Outline**: #6F7978 (Border color)
- **Outline Variant**: #BEC9C8 (Light border color)

#### Semantic Colors
- **Success**: #2E7D32 (Material Green)
- **On Success**: #FFFFFF
- **Success Container**: #C8E6C9
- **Warning**: #F57C00 (Material Orange)
- **On Warning**: #FFFFFF
- **Warning Container**: #FFE0B2
- **Error**: #D32F2F (Material Red)
- **On Error**: #FFFFFF
- **Error Container**: #FFCDD2

#### Background & Surface
- **Background**: #F7FAFA (Very light teal-tinted white)
- **On Background**: #191C1C
- **Surface Dim**: #D0D3D3
- **Surface Bright**: #F7FAFA
- **Surface Container Lowest**: #FFFFFF
- **Surface Container Low**: #F1F4F4
- **Surface Container**: #EBF0EF
- **Surface Container High**: #E5EAEA
- **Surface Container Highest**: #DFE4E4

## 🛠️ Technical Architecture

### File Structure
```
donerbestellijst/
├── index.html          # Main application
├── styles.css          # Mobile-first styling
├── script.js           # Core functionality
├── menu-data.js        # Product data
├── api/                # Azure Functions or API endpoints
│   └── sms-sender.js   # Azure Communication Services SMS handler
├── infra/              # Azure infrastructure (Bicep)
│   ├── main.bicep      # Main infrastructure template
│   └── main.parameters.json # Environment parameters
├── azure.yaml          # Azure Developer CLI configuration
└── plan.md            # This design document
```

### Data Structure
```javascript
// Order data model
{
  orders: [
    {
      id: "uuid",
      customerName: "John Doe",
      items: [
        {
          productId: "doner_box",
          productName: "Döner Box",
          quantity: 2,
          options: "chicken" // for items with variations
        }
      ],
      timestamp: "2025-06-13T10:30:00Z"
    }
  ],
  isOrderingOpen: true,
  lastReset: "2025-06-13",
  finalizationTime: "11:15"
}
```

## ⚙️ Core Functionality

### 1. Name Validation System
- **Input Field**: Prominent name input at top of page
- **Validation**: Check if name is entered before allowing orders
- **Storage**: Store customer name in session storage
- **Visual Feedback**: Highlight name field if empty when ordering

### 2. Product Ordering System
- **Product Cards**: Each menu item as a card with image, name, price
- **Order Button**: Large, touch-friendly buttons
- **Quantity Management**: + / - buttons for quantity adjustment
- **Instant Feedback**: Visual confirmation when item added

### 3. Time-Based Controls
- **Order Cutoff**: Disable ordering at 11:15 AM sharp
- **Visual Timer**: Show countdown to cutoff time
- **Daily Reset**: Clear all orders after 2 PM on first visit
- **Status Indicators**: Clear visual status of ordering availability

### 4. Order Management
- **Live Order List**: Real-time display of all orders
- **Grouping**: Group orders by customer name
- **Editing**: Allow customers to modify their own orders (before cutoff)
- **Summary**: Show total quantities per product for SMS

### 5. SMS Integration
- **Order Summary**: Generate clean list with just products and quantities
- **SMS Service**: Azure Communication Services SMS API
- **Authentication**: Managed Identity for secure access to Azure Communication Services
- **Format**: "Döner Orders - [Date]: 3x Döner Box, 2x Patat Met Saus, 1x Turkse Pizza..."
- **Admin Function**: Protected SMS send button
- **Endpoint**: Azure Function or API endpoint to handle SMS sending

## 👥 **Multi-User Collaborative Ordering System**

### **How Multiple Users Share One Order List**

#### **Scenario Example:**
```
📱 John's Phone          📱 Maria's Phone         📱 Ahmed's Phone
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Name: John          │ │ Name: Maria         │ │ Name: Ahmed         │
│ ✅ Döner Box (2x)   │ │ ✅ Patat Met Saus   │ │ ✅ Turkse Pizza     │
│                     │ │ ✅ Broodje Falafel  │ │ ✅ Döner Box (1x)   │
│ 📋 SHARED ORDER:    │ │ 📋 SHARED ORDER:    │ │ 📋 SHARED ORDER:    │
│ • John: Döner (2x)  │ │ • John: Döner (2x)  │ │ • John: Döner (2x)  │
│ • Maria: Patat (1x) │ │ • Maria: Patat (1x) │ │ • Maria: Patat (1x) │
│ • Maria: Falafel    │ │ • Maria: Falafel    │ │ • Maria: Falafel    │
│ • Ahmed: Pizza (1x) │ │ • Ahmed: Pizza (1x) │ │ • Ahmed: Pizza (1x) │
│ • Ahmed: Döner (1x) │ │ • Ahmed: Döner (1x) │ │ • Ahmed: Döner (1x) │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

#### **Technical Implementation for Shared Ordering**

### **1. Shared Local Storage Strategy**
```javascript
// All users access the same localStorage key on the domain
const SHARED_ORDER_KEY = 'doner_shared_orders';
const USER_SESSION_KEY = 'user_session_name';

// Data structure for collaborative orders
const sharedOrderData = {
  orders: [
    {
      id: generateUUID(),
      customerName: "John",
      items: [
        { productId: "doner_box", productName: "Döner Box", quantity: 2, options: "chicken" }
      ],
      timestamp: "2025-06-13T10:30:00Z",
      deviceId: "device_123" // Track which device added this
    },
    {
      id: generateUUID(),
      customerName: "Maria", 
      items: [
        { productId: "patat_saus", productName: "Patat Met Saus", quantity: 1 }
      ],
      timestamp: "2025-06-13T10:35:00Z",
      deviceId: "device_456"
    }
  ],
  isOrderingOpen: true,
  lastReset: "2025-06-13",
  orderDeadline: "11:15"
};
```

### **2. User Session Management**
```javascript
// Each user's session (stored separately per device)
function initializeUserSession() {
  let userName = sessionStorage.getItem(USER_SESSION_KEY);
  
  if (!userName) {
    // Prompt for name on first visit
    showNameInputDialog();
  } else {
    // Load existing session
    displayUserName(userName);
    loadSharedOrders();
  }
}

function saveUserOrder(productId, productName, quantity, options = null) {
  const userName = sessionStorage.getItem(USER_SESSION_KEY);
  
  if (!userName) {
    showNameRequiredAlert();
    return;
  }
  
  // Add to shared order list
  addToSharedOrders(userName, productId, productName, quantity, options);
  refreshOrderDisplay();
}
```

### **3. Real-Time Order Synchronization**
```javascript
// Sync orders across all devices viewing the same page
function refreshOrderDisplay() {
  const sharedOrders = JSON.parse(localStorage.getItem(SHARED_ORDER_KEY) || '{"orders": []}');
  const currentUser = sessionStorage.getItem(USER_SESSION_KEY);
  
  // Display all orders grouped by customer
  const ordersByCustomer = groupOrdersByCustomer(sharedOrders.orders);
  
  updateOrderListUI(ordersByCustomer, currentUser);
  updateOrderSummaryForSMS(sharedOrders.orders);
}

// Check for updates every few seconds (simple polling)
setInterval(() => {
  refreshOrderDisplay();
}, 5000); // Refresh every 5 seconds

// Also refresh when page gets focus (user switches back to tab)
window.addEventListener('focus', refreshOrderDisplay);
```

### **4. Individual User Experience**
```javascript
// Each user can only edit their own orders
function canUserEditOrder(order) {
  const currentUser = sessionStorage.getItem(USER_SESSION_KEY);
  return order.customerName === currentUser;
}

function displayOrderWithEditControls(order) {
  const currentUser = sessionStorage.getItem(USER_SESSION_KEY);
  const isEditable = order.customerName === currentUser;
  
  return `
    <div class="order-item ${isEditable ? 'editable' : 'readonly'}">
      <span class="customer-name">${order.customerName}:</span>
      <span class="product-info">${order.items[0].productName} (${order.items[0].quantity}x)</span>
      ${isEditable ? '<button class="edit-btn">✏️</button><button class="delete-btn">🗑️</button>' : ''}
    </div>
  `;
}
```

### **5. SMS Order Summary (All Users Combined)**
```javascript
function generateSMSOrderSummary() {
  const sharedOrders = JSON.parse(localStorage.getItem(SHARED_ORDER_KEY) || '{"orders": []}');
  
  // Combine all orders into product totals
  const productTotals = {};
  
  sharedOrders.orders.forEach(order => {
    order.items.forEach(item => {
      const key = `${item.productName}${item.options ? ` (${item.options})` : ''}`;
      productTotals[key] = (productTotals[key] || 0) + item.quantity;
    });
  });
  
  // Format for SMS: "3x Döner Box (chicken), 2x Patat Met Saus, 1x Turkse Pizza"
  const orderLines = Object.entries(productTotals)
    .map(([product, quantity]) => `${quantity}x ${product}`)
    .join(', ');
    
  return `Döner Orders - ${new Date().toLocaleDateString()}: ${orderLines}`;
}
```

### **Benefits of This Approach:**

#### **✅ User Experience**
- **Personal Control**: Each user manages their own orders
- **Shared Visibility**: Everyone sees the complete order list
- **Name-Based Organization**: Orders clearly grouped by person
- **Real-Time Updates**: Changes appear for all users

#### **✅ Technical Simplicity**
- **No Server Required**: Uses browser localStorage
- **No User Accounts**: Simple name-based identification
- **Offline Capable**: Works without internet (except for SMS)
- **Cross-Device**: Any phone can access the same order

#### **✅ Restaurant Benefits**
- **Single Order List**: One SMS with combined totals
- **Clear Organization**: Knows who ordered what
- **Accurate Quantities**: Automatic totaling prevents errors
- **Time Management**: Automatic 11:15 AM cutoff

### **User Flow Example:**
1. **Maria** opens website on her phone, enters "Maria"
2. **Maria** orders "Patat Met Saus" → appears in shared list
3. **John** opens same website on his phone, enters "John"  
4. **John** sees Maria's order already in the list
5. **John** adds "Döner Box (2x)" → both users see updated list
6. **Ahmed** joins later, adds his orders → all three see complete list
7. **At 11:15 AM** → ordering locks, admin sends SMS with totals

This creates a seamless collaborative ordering experience where multiple people can order from their individual phones while contributing to one unified order list! 🍽️📱

## 🔧 Technical Implementation

### Local Storage Strategy
```javascript
// Store in localStorage for persistence
const ORDER_STORAGE_KEY = 'doner_orders';
const LAST_RESET_KEY = 'last_reset_date';
const ADMIN_SMS_KEY = 'sms_sent_today';
```

### Time Management
```javascript
// Check ordering status
function isOrderingOpen() {
  const now = new Date();
  const cutoffTime = new Date();
  cutoffTime.setHours(11, 15, 0, 0);
  
  return now < cutoffTime;
}

// Check if reset needed
function shouldResetOrders() {
  const now = new Date();
  const lastReset = localStorage.getItem(LAST_RESET_KEY);
  
  return now.getHours() >= 14 && 
         (!lastReset || lastReset !== now.toDateString());
}
```

### SMS Integration
```javascript
// Azure Communication Services SMS function
async function sendOrderSMS(phoneNumber, orderSummary) {
  const response = await fetch('/api/sms-sender', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + await getAccessToken() // If needed
    },
    body: JSON.stringify({
      to: phoneNumber,
      message: orderSummary
    })
  });
  
  if (!response.ok) {
    throw new Error(`SMS sending failed: ${response.statusText}`);
  }
  
  return await response.json();
}
```

### Azure Communication Services Backend
```javascript
// Azure Function for SMS sending (api/sms-sender.js)
const { SmsClient } = require("@azure/communication-sms");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context, req) {
    try {
        // Use Managed Identity for authentication
        const credential = new DefaultAzureCredential();
        const smsClient = new SmsClient(
            process.env.COMMUNICATION_SERVICES_CONNECTION_STRING,
            credential
        );

        const sendResults = await smsClient.send({
            from: process.env.SMS_FROM_NUMBER,
            to: [req.body.to],
            message: req.body.message
        });

        context.res = {
            status: 200,
            body: { success: true, messageId: sendResults[0].messageId }
        };
    } catch (error) {
        context.log.error('SMS sending failed:', error);
        context.res = {
            status: 500,
            body: { success: false, error: error.message }
        };
    }
};
```

## 🎨 Material Design 3 Mobile UI Features

### Touch-Friendly Design
- **Button Size**: Minimum 48x48px touch targets (MD3 spec)
- **Spacing**: 16px minimum between interactive elements
- **Font Size**: Minimum 16px to prevent zoom on iOS
- **Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Ripple Effects**: Material ripple animations on touch

### Material Design 3 Responsive Breakpoints
- **Compact (Mobile)**: 0-599px (primary focus)
- **Medium (Tablet)**: 600-839px (secondary)
- **Expanded (Desktop)**: 840px+ (basic support)

### Interactive Material Components
- **Loading States**: Skeleton screens with shimmer effect
- **Error Handling**: Material snackbars for feedback
- **Success Feedback**: Bounce animations with haptic feedback
- **Real-time Updates**: Smooth counter animations
- **Micro-interactions**: Button state changes, hover effects

### Accessibility Features
- **Focus Management**: Clear focus indicators
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast Mode**: Enhanced visibility support
- **Reduced Motion**: Respects user motion preferences
- **Voice Navigation**: Proper heading structure

### Material Design 3 State Management
- **Default State**: Neutral, professional appearance
- **Hover State**: Subtle elevation and color changes
- **Active State**: Scale animation (0.95) with ripple
- **Disabled State**: Reduced opacity (38%) with no interactions
- **Loading State**: Pulsing animation with skeleton screens
- **Success State**: Green accent with bounce animation
- **Error State**: Red accent with shake animation

## 🔒 Security & Admin Features

### Admin Panel
- **Password Protection**: Simple password for SMS sending
- **Order Overview**: Complete order summary
- **Manual Controls**: Force reset, manual SMS send
- **Statistics**: Daily order counts

### Data Protection
- **No Personal Data Storage**: Only names and orders
- **Daily Cleanup**: Automatic data purging
- **Local Storage Only**: No server-side data persistence

### Azure Security
- **Managed Identity**: Secure authentication to Azure Communication Services
- **HTTPS Only**: Enforce SSL/TLS encryption for all connections
- **App Service Authentication**: Optional Azure AD integration for admin functions
- **Environment Variables**: Store sensitive configuration in Azure App Service settings
- **CORS Configuration**: Restrict cross-origin requests appropriately

## ☁️ Azure Infrastructure

### Azure Resources Required
- **Azure App Service**: Web app hosting (Static Web App alternative for dynamic content)
- **Azure Communication Services**: SMS functionality
- **Azure Function App**: Backend API for SMS sending (if using serverless approach)
- **Application Insights**: Monitoring and logging
- **Azure Key Vault**: Secure storage for connection strings and secrets

### Infrastructure as Code (Bicep)
```bicep
// infra/main.bicep - Main infrastructure template
targetScope = 'resourceGroup'

@description('The name of the environment')
param environmentName string = 'dev'

@description('Primary location for all resources')
param location string = resourceGroup().location

@description('Communication Services connection string')
@secure()
param communicationServicesConnectionString string

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'asp-doner-orders-${environmentName}'
  location: location
  sku: {
    name: 'F1' // Free tier for development
    tier: 'Free'
  }
  properties: {
    reserved: false
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: 'app-doner-orders-${environmentName}'
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      appSettings: [
        {
          name: 'COMMUNICATION_SERVICES_CONNECTION_STRING'
          value: communicationServicesConnectionString
        }
        {
          name: 'SMS_FROM_NUMBER'
          value: '+1234567890' // Configure your SMS number
        }
      ]
      netFrameworkVersion: 'v6.0'
      nodeVersion: '18-lts'
    }
  }
}

// Communication Services
resource communicationService 'Microsoft.Communication/CommunicationServices@2023-03-31' = {
  name: 'cs-doner-orders-${environmentName}'
  location: 'global'
  properties: {
    dataLocation: 'Europe'
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'ai-doner-orders-${environmentName}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
}

// Outputs
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output communicationServiceName string = communicationService.name
```

### Azure Developer CLI Configuration
```yaml
# azure.yaml
name: doner-orders
metadata:
  template: doner-orders@0.0.1-beta
services:
  web:
    project: .
    language: js
    host: appservice
infra:
  provider: bicep
```

### Deployment Commands
```bash
# Initialize Azure Developer CLI
azd init --template doner-orders

# Provision infrastructure and deploy
azd up

# Deploy code only (after initial setup)
azd deploy

# Monitor logs
azd logs

# Clean up resources
azd down
```

## 🚀 Development Phases

### Phase 1: Core Structure & Azure Setup (Day 1)
- ✅ HTML structure
- ✅ Basic CSS mobile layout
- ✅ Menu data integration
- ✅ Name validation
- ✅ Azure App Service configuration
- ✅ Azure Communication Services setup

### Phase 2: Ordering System & Backend (Day 2)
- ✅ Product display
- ✅ Order management
- ✅ Local storage
- ✅ Time controls
- ✅ Azure Function for SMS sending
- ✅ API integration

### Phase 3: Integration & Deployment (Day 3)
- ✅ SMS integration testing
- ✅ Admin panel
- ✅ Error handling
- ✅ Azure deployment (azd up)
- ✅ Testing & refinement

## 📊 Success Metrics

### User Experience
- **Load Time**: < 2 seconds on mobile
- **Touch Response**: < 100ms button response
- **Error Rate**: < 5% failed orders
- **User Completion**: > 90% successful name entry

### Business Impact
- **Order Accuracy**: Reduce manual order errors
- **Time Savings**: Faster order processing
- **User Adoption**: Daily usage tracking
- **SMS Delivery**: 99%+ successful deliveries

## 🔍 Testing Strategy

### Manual Testing
- **Device Testing**: iOS Safari, Android Chrome
- **Time Zone Testing**: Verify 11:15 AM cutoff works correctly
- **Reset Testing**: Confirm 2 PM daily reset
- **SMS Testing**: Verify message format and delivery using Azure Communication Services
- **Azure App Service**: Test hosting performance and reliability
- **Managed Identity**: Verify secure authentication to Azure services

### User Scenarios
1. **Happy Path**: Name → Order → Confirm → SMS via Azure Communication Services
2. **No Name Error**: Try to order without name
3. **Time Cutoff**: Order after 11:15 AM
4. **Daily Reset**: First visit after 2 PM
5. **Multiple Users**: Collaborative ordering
6. **Azure Integration**: Test SMS delivery through Azure Communication Services
7. **App Service Deployment**: Verify hosting on Azure App Service

---

*This design plan provides a comprehensive roadmap for building a mobile-first doner ordering website that meets all specified requirements while ensuring excellent user experience and reliable functionality.*

## Material Design 3 Typography

#### Font Specifications
- **Primary Font**: 'Roboto Flex', system-ui, -apple-system, sans-serif
- **Fallback Fonts**: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif

#### Type Scale
- **Display Large**: 57px / 64px line height, weight 400
- **Display Medium**: 45px / 52px line height, weight 400
- **Display Small**: 36px / 44px line height, weight 400
- **Headline Large**: 32px / 40px line height, weight 400
- **Headline Medium**: 28px / 36px line height, weight 400
- **Headline Small**: 24px / 32px line height, weight 400
- **Title Large**: 22px / 28px line height, weight 500
- **Title Medium**: 16px / 24px line height, weight 500
- **Title Small**: 14px / 20px line height, weight 500
- **Body Large**: 16px / 24px line height, weight 400
- **Body Medium**: 14px / 20px line height, weight 400
- **Body Small**: 12px / 16px line height, weight 400
- **Label Large**: 14px / 20px line height, weight 500
- **Label Medium**: 12px / 16px line height, weight 500
- **Label Small**: 11px / 16px line height, weight 500

### Material Design 3 Spacing System

#### Base Unit: 4px
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 20px
- **2xl**: 24px
- **3xl**: 32px
- **4xl**: 40px
- **5xl**: 48px
- **6xl**: 64px

#### Component Spacing
- **Button Padding**: 24px horizontal, 10px vertical
- **Card Padding**: 16px
- **List Item Padding**: 16px horizontal, 8px vertical
- **Section Margins**: 24px
- **Component Gaps**: 16px

### Material Design 3 Components

#### Elevation System
- **Level 0**: No shadow (default surface)
- **Level 1**: 0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px rgba(0,0,0,0.15)
- **Level 2**: 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px rgba(0,0,0,0.15)
- **Level 3**: 0px 4px 8px rgba(0,0,0,0.3), 0px 6px 20px rgba(0,0,0,0.15)
- **Level 4**: 0px 6px 10px rgba(0,0,0,0.3), 0px 8px 24px rgba(0,0,0,0.15)
- **Level 5**: 0px 8px 12px rgba(0,0,0,0.3), 0px 12px 28px rgba(0,0,0,0.15)

#### Border Radius
- **xs**: 4px (small elements)
- **sm**: 8px (buttons, inputs)
- **md**: 12px (cards, containers)
- **lg**: 16px (large cards)
- **xl**: 20px (modals, sheets)
- **2xl**: 28px (extra large containers)
- **full**: 50% (circular elements)

### Material Design 3 Animations

#### Duration System
- **Extra Fast**: 100ms (micro-interactions)
- **Fast**: 200ms (simple transitions)
- **Medium**: 300ms (standard transitions)
- **Slow**: 500ms (complex transitions)
- **Extra Slow**: 700ms (page transitions)

#### Easing Curves
- **Standard**: cubic-bezier(0.2, 0.0, 0, 1.0)
- **Decelerate**: cubic-bezier(0.0, 0.0, 0.2, 1.0)
- **Accelerate**: cubic-bezier(0.4, 0.0, 1.0, 1.0)
- **Emphasized**: cubic-bezier(0.2, 0.0, 0, 1.0)

#### Animation Specifications
- **Button Press**: Scale 0.95, duration 100ms
- **Card Hover**: Elevation increase, duration 200ms
- **Page Transition**: Slide + fade, duration 300ms
- **Loading States**: Pulse animation, duration 1000ms infinite
- **Success Feedback**: Scale bounce, duration 500ms

### Material Design 3 CSS Implementation

```css
/* Material Design 3 Doner Orders - Complete Implementation */

/* CSS Custom Properties (Design Tokens) */
:root {
  /* Primary Colors */
  --md-sys-color-primary: #006A6B;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-primary-container: #6FF7F8;
  --md-sys-color-on-primary-container: #002020;
  
  /* Secondary Colors */
  --md-sys-color-secondary: #4A6363;
  --md-sys-color-on-secondary: #FFFFFF;
  --md-sys-color-secondary-container: #CCE8E8;
  --md-sys-color-on-secondary-container: #051F1F;
  
  /* Tertiary Colors */
  --md-sys-color-tertiary: #526600;
  --md-sys-color-on-tertiary: #FFFFFF;
  --md-sys-color-tertiary-container: #D5ED78;
  --md-sys-color-on-tertiary-container: #181E00;
  
  /* Surface Colors */
  --md-sys-color-surface: #FAFDFC;
  --md-sys-color-on-surface: #191C1C;
  --md-sys-color-surface-variant: #DAE5E4;
  --md-sys-color-on-surface-variant: #3F4948;
  --md-sys-color-surface-container: #EBF0EF;
  --md-sys-color-surface-container-high: #E5EAEA;
  
  /* Semantic Colors */
  --md-sys-color-error: #D32F2F;
  --md-sys-color-on-error: #FFFFFF;
  --md-sys-color-success: #2E7D32;
  --md-sys-color-warning: #F57C00;
  
  /* Outline Colors */
  --md-sys-color-outline: #6F7978;
  --md-sys-color-outline-variant: #BEC9C8;
  
  /* Spacing System */
  --md-sys-spacing-xs: 4px;
  --md-sys-spacing-sm: 8px;
  --md-sys-spacing-md: 12px;
  --md-sys-spacing-lg: 16px;
  --md-sys-spacing-xl: 20px;
  --md-sys-spacing-2xl: 24px;
  --md-sys-spacing-3xl: 32px;
  --md-sys-spacing-4xl: 40px;
  
  /* Typography */
  --md-sys-typescale-headline-medium-font: 'Roboto Flex', system-ui, sans-serif;
  --md-sys-typescale-headline-medium-size: 28px;
  --md-sys-typescale-headline-medium-line-height: 36px;
  --md-sys-typescale-headline-medium-weight: 400;
  
  --md-sys-typescale-title-large-font: 'Roboto Flex', system-ui, sans-serif;
  --md-sys-typescale-title-large-size: 22px;
  --md-sys-typescale-title-large-line-height: 28px;
  --md-sys-typescale-title-large-weight: 500;
  
  --md-sys-typescale-body-large-font: 'Roboto Flex', system-ui, sans-serif;
  --md-sys-typescale-body-large-size: 16px;
  --md-sys-typescale-body-large-line-height: 24px;
  --md-sys-typescale-body-large-weight: 400;
  
  /* Elevation Shadows */
  --md-sys-elevation-level1: 0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px rgba(0,0,0,0.15);
  --md-sys-elevation-level2: 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px rgba(0,0,0,0.15);
  --md-sys-elevation-level3: 0px 4px 8px rgba(0,0,0,0.3), 0px 6px 20px rgba(0,0,0,0.15);
  
  /* Border Radius */
  --md-sys-shape-corner-sm: 8px;
  --md-sys-shape-corner-md: 12px;
  --md-sys-shape-corner-lg: 16px;
  --md-sys-shape-corner-xl: 20px;
  --md-sys-shape-corner-full: 50%;
  
  /* Animation Durations */
  --md-sys-motion-duration-short1: 100ms;
  --md-sys-motion-duration-short2: 200ms;
  --md-sys-motion-duration-medium1: 300ms;
  --md-sys-motion-duration-medium2: 500ms;
  
  /* Easing Curves */
  --md-sys-motion-easing-standard: cubic-bezier(0.2, 0.0, 0, 1.0);
  --md-sys-motion-easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1.0);
  --md-sys-motion-easing-emphasized: cubic-bezier(0.2, 0.0, 0, 1.0);
}

/* Global Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--md-sys-typescale-body-large-font);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  font-weight: var(--md-sys-typescale-body-large-weight);
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* App Bar Component */
.md-app-bar {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 var(--md-sys-spacing-lg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.md-app-bar__title {
  font-family: var(--md-sys-typescale-headline-medium-font);
  font-size: var(--md-sys-typescale-headline-medium-size);
  line-height: var(--md-sys-typescale-headline-medium-line-height);
  font-weight: var(--md-sys-typescale-headline-medium-weight);
  flex: 1;
}

/* Material Cards */
.md-card {
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-md);
  padding: var(--md-sys-spacing-lg);
  margin: var(--md-sys-spacing-sm);
  box-shadow: var(--md-sys-elevation-level1);
  transition: all var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}

.md-card:hover {
  box-shadow: var(--md-sys-elevation-level2);
  transform: translateY(-1px);
}

.md-card--elevated {
  box-shadow: var(--md-sys-elevation-level3);
}

/* Material Buttons */
.md-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 10px var(--md-sys-spacing-2xl);
  border: none;
  border-radius: var(--md-sys-shape-corner-xl);
  font-family: var(--md-sys-typescale-body-large-font);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--md-sys-motion-duration-short1) var(--md-sys-motion-easing-standard);
  position: relative;
  overflow: hidden;
  min-width: 48px; /* Accessibility touch target */
}

.md-button--filled {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.md-button--outlined {
  background-color: transparent;
  color: var(--md-sys-color-primary);
  border: 1px solid var(--md-sys-color-outline);
}

.md-button--text {
  background-color: transparent;
  color: var(--md-sys-color-primary);
}

/* Button Interactions */
.md-button:hover {
  box-shadow: var(--md-sys-elevation-level1);
}

.md-button:active {
  transform: scale(0.95);
}

.md-button:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}

/* Ripple Effect Animation */
.md-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-standard),
              height var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-standard);
}

.md-button:active::before {
  width: 300px;
  height: 300px;
}

/* Input Fields */
.md-text-field {
  position: relative;
  margin: var(--md-sys-spacing-sm) 0;
}

.md-text-field__input {
  width: 100%;
  padding: var(--md-sys-spacing-md) var(--md-sys-spacing-lg);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-sm);
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  transition: border-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}

.md-text-field__input:focus {
  outline: none;
  border-color: var(--md-sys-color-primary);
  border-width: 2px;
}

.md-text-field__label {
  position: absolute;
  left: var(--md-sys-spacing-lg);
  top: 50%;
  transform: translateY(-50%);
  color: var(--md-sys-color-on-surface-variant);
  pointer-events: none;
  transition: all var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}

.md-text-field__input:focus + .md-text-field__label,
.md-text-field__input:not(:placeholder-shown) + .md-text-field__label {
  top: 0;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--md-sys-color-primary);
  background-color: var(--md-sys-color-surface);
  padding: 0 4px;
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--md-sys-spacing-lg);
  padding: var(--md-sys-spacing-lg);
}

.product-card {
  background-color: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-md);
  padding: var(--md-sys-spacing-lg);
  box-shadow: var(--md-sys-elevation-level1);
  transition: all var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
  cursor: pointer;
}

.product-card:hover {
  box-shadow: var(--md-sys-elevation-level2);
  transform: translateY(-2px);
}

.product-card__image {
  width: 100%;
  height: 120px;
  border-radius: var(--md-sys-shape-corner-sm);
  background-color: var(--md-sys-color-surface-variant);
  margin-bottom: var(--md-sys-spacing-sm);
  object-fit: cover;
}

.product-card__title {
  font-family: var(--md-sys-typescale-title-large-font);
  font-size: var(--md-sys-typescale-title-large-size);
  font-weight: var(--md-sys-typescale-title-large-weight);
  margin-bottom: var(--md-sys-spacing-xs);
}

.product-card__price {
  color: var(--md-sys-color-primary);
  font-weight: 600;
  margin-bottom: var(--md-sys-spacing-md);
}

/* Floating Action Button */
.md-fab {
  position: fixed;
  bottom: var(--md-sys-spacing-lg);
  right: var(--md-sys-spacing-lg);
  width: 56px;
  height: 56px;
  border-radius: var(--md-sys-shape-corner-lg);
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  box-shadow: var(--md-sys-elevation-level3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
  z-index: 90;
}

.md-fab:hover {
  transform: scale(1.05);
  box-shadow: var(--md-sys-elevation-level4);
}

.md-fab:active {
  transform: scale(0.95);
}

/* Status Indicators */
.status-chip {
  display: inline-flex;
  align-items: center;
  padding: var(--md-sys-spacing-xs) var(--md-sys-spacing-md);
  border-radius: var(--md-sys-shape-corner-sm);
  font-size: 12px;
  font-weight: 500;
  gap: var(--md-sys-spacing-xs);
}

.status-chip--success {
  background-color: var(--md-sys-color-success);
  color: var(--md-sys-color-on-error);
}

.status-chip--warning {
  background-color: var(--md-sys-color-warning);
  color: var(--md-sys-color-on-error);
}

/* Loading Animation */
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.loading {
  animation: pulse 1s infinite var(--md-sys-motion-easing-standard);
}

/* Success Animation */
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: scale(1); }
  40%, 43% { transform: scale(1.1); }
  70% { transform: scale(1.05); }
  90% { transform: scale(1.02); }
}

.success-animation {
  animation: bounce var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized);
}

/* Page Transition */
.page-enter {
  opacity: 0;
  transform: translateX(30px);
}

.page-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-decelerate),
              transform var(--md-sys-motion-duration-medium1) var(--md-sys-motion-easing-decelerate);
}

/* Responsive Design */
@media (max-width: 600px) {
  .product-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--md-sys-spacing-sm);
    padding: var(--md-sys-spacing-sm);
  }
  
  .md-card {
    margin: var(--md-sys-spacing-xs);
    padding: var(--md-sys-spacing-md);
  }
}

/* High Contrast Mode Support */
@media (prefers-contrast: high) {
  .md-card {
    border: 1px solid var(--md-sys-color-outline);
  }
  
  .md-button--outlined {
    border-width: 2px;
  }
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Material Design 3 JavaScript Animations

```javascript
// Material Design 3 Animation System
class MaterialAnimations {
  static durations = {
    extraFast: 100,
    fast: 200,
    medium: 300,
    slow: 500,
    extraSlow: 700
  };

  static easings = {
    standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1.0, 1.0)',
    emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)'
  };

  // Button press animation
  static animateButtonPress(element) {
    element.style.transform = 'scale(0.95)';
    element.style.transition = `transform ${this.durations.extraFast}ms ${this.easings.standard}`;
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, this.durations.extraFast);
  }

  // Ripple effect for buttons
  static createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple ${this.durations.medium}ms ${this.easings.decelerate};
      pointer-events: none;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, this.durations.medium);
  }

  // Success feedback animation
  static animateSuccess(element) {
    element.classList.add('success-animation');
    setTimeout(() => {
      element.classList.remove('success-animation');
    }, this.durations.slow);
  }

  // Page transition animation
  static animatePageTransition(element) {
    element.classList.add('page-enter');
    
    requestAnimationFrame(() => {
      element.classList.add('page-enter-active');
      element.classList.remove('page-enter');
    });
    
    setTimeout(() => {
      element.classList.remove('page-enter-active');
    }, this.durations.medium);
  }

  // Loading state animation
  static startLoading(element) {
    element.classList.add('loading');
  }

  static stopLoading(element) {
    element.classList.remove('loading');
  }
}

// CSS Animation Keyframes (add to your CSS)
const animationCSS = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;

// Inject animation CSS
const style = document.createElement('style');
style.textContent = animationCSS;
document.head.appendChild(style);
```