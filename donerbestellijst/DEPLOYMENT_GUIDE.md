# Döner Orders - Azure Deployment Guide

## Manual Azure Setup Instructions

### 📋 Prerequisites
- Azure subscription with necessary permissions
- Azure CLI installed (optional, for verification)

### 🚀 Step 1: Create Azure Communication Services

1. **Create Communication Services Resource**:
   - Navigate to Azure Portal → Create a resource
   - Search for "Communication Services"
   - Resource name: `doner-orders-sms` (or your choice)
   - Resource group: Create new or use existing
   - Region: Choose your preferred region
   - Data location: Choose appropriate data residency

2. **Get Connection String**:
   - After deployment, go to resource → Keys and Connection Strings
   - Copy the **Connection String** (you'll need this for App Service settings)

3. **Optional - Get Phone Number**:
   - Go to Phone Numbers → Get phone number
   - Choose your country and number type
   - Complete purchase process
   - Note: You can test without buying a number using the provided test numbers

### 🌐 Step 2: Create Azure App Service

1. **Create Web App**:
   - Navigate to Azure Portal → Create a resource
   - Search for "Web App"
   - Subscription: Select your subscription
   - Resource Group: Use same as Communication Services
   - Name: `doner-orders-app` (must be globally unique)
   - Publish: **Code**
   - Runtime stack: **Node.js 22 LTS** (or later)
   - Operating System: **Linux** (recommended)
   - Region: Same as Communication Services
   - App Service Plan: Create new - **Basic B1** or higher

2. **Configure App Settings**:
   - Go to your Web App → Configuration → Application settings
   - Add these **New application settings**:

   ```
   ACS_CONNECTION_STRING = endpoint=https://donerbestelling.europe.communication.azure.com/;accesskey=E5gLyvZj65ubvZmA1q023ra3ovlvCOftNZiVCO6Ouzo7AUddh7zmJQQJ99BFACULyCpkxZ0VAAAAAZCSZqLj
   RESTAURANT_PHONE_NUMBER = +0031646322061
   ADMIN_PASSWORD = [Choose a secure password]
   CORS_ORIGINS = *
   NODE_ENV = production
   WEBSITE_NODE_DEFAULT_VERSION = 22-lts
   ACS_PHONE_NUMBER = [Your Azure Communication Services phone number]
   ```

   - Click **Save**
   
   **Note**: The connection string above is your actual ACS connection string. The `ACS_PHONE_NUMBER` should be set to a phone number you've purchased through Azure Communication Services, or you can use test numbers provided by Azure.

### 📁 Step 3: Deploy Website Files

**Option A: FTP Deployment**
1. Go to Web App → Deployment Center → FTP/Credentials
2. Copy FTP hostname, username, and password
3. Upload all files from `donerbestellijst` folder to `/site/wwwroot/`

**Option B: Local Git Deployment**
1. Go to Web App → Deployment Center → Local Git
2. Follow the git commands to push your code

**Option C: ZIP Deployment (Recommended)**
1. Create a ZIP file with these website files (**DO NOT include node_modules**):
   - index.html
   - styles.css
   - script.js
   - menu-data.js
   - manifest.json
   - package.json
   - server.js
   - web.config
   - sw.js

2. Use Azure CLI or Kudu to deploy:
   ```bash
   az webapp deployment source config-zip --resource-group <resource-group> --name <app-name> --src <zip-file-path>
   ```

**Important:** Azure App Service will automatically run `npm install` based on your `package.json` file during deployment. You should **NEVER** upload the `node_modules` folder.

### 🔧 Step 4: Test Deployment

1. **Access Website**:
   - Go to `https://your-app-name.azurewebsites.net`
   - Verify the website loads correctly

2. **Test SMS Functionality**:
   - Enter a name and add some orders
   - Click Admin panel (⚙️ button)
   - Enter a test phone number (your own for testing)
   - Click "Send SMS to Restaurant"
   - Enter admin password when prompted

3. **Health Check**:
   - Visit `https://your-app-name.azurewebsites.net/api/health`
   - Should return JSON with status "healthy" and SMS configuration status

### 🛠️ Required Files Summary

Make sure these files are in your web root (`/site/wwwroot/`):

**Frontend Files:**
- `index.html` - Main website page
- `styles.css` - Material Design 3 styles
- `script.js` - Main application logic (updated for real SMS API)
- `menu-data.js` - Product catalog
- `manifest.json` - PWA manifest

**Backend Files:**
- `server.js` - Node.js API server
- `package.json` - Node.js dependencies
- `web.config` - IIS configuration for Azure App Service

### 🔒 Security Notes

- **Admin Password**: Change the default admin password in App Settings
- **Phone Number Validation**: The API validates international phone number format
- **Rate Limiting**: API is rate-limited to 10 requests per 15 minutes per IP
- **CORS**: Configured to allow all origins (adjust for production if needed)

### 📱 SMS Testing

**Test Phone Numbers** (no charge):
- Use your test number: `+0031646322061` for testing
- Azure Communication Services provides test numbers in some regions
- Test with your own phone number to verify SMS delivery

**Message Format:**
```
Döner Orders - [Date]: [Order Summary]
Example: "Döner Orders - 6/13/2025: 2x Döner Box (Chicken), 1x Patat Speciaal, 3x Turkse Pizza Kaas"
```

### 🐛 Troubleshooting

**Website not loading:**
- Check Application Settings are saved
- Verify Node.js version in App Settings
- Check Application Logs in Azure Portal

**SMS not working:**
- Verify ACS_CONNECTION_STRING is correct
- Check phone number format (+31612345678)
- Review Application Logs for errors
- Test API health endpoint

**Orders not syncing:**
- localStorage is used for collaborative ordering
- Each user needs to enter their name
- Orders sync every 5 seconds automatically

### 📊 Monitoring

- **Application Insights**: Can be enabled for detailed monitoring
- **Application Logs**: Available in Azure Portal → Log stream
- **Metrics**: Monitor requests, response times, and errors

## 🎉 You're Ready!

Your döner ordering website should now be fully functional with:
- ✅ Mobile-first responsive design
- ✅ Collaborative ordering between multiple users
- ✅ Automatic time-based controls (11:15 AM cutoff, 2 PM reset)
- ✅ Real SMS integration with Azure Communication Services
- ✅ Admin panel for order management
- ✅ Progressive Web App features
