# TOPdesk Client Tool v2 (Stagehand Version)

A Node.js-based tool for interacting with TOPdesk to retrieve information about incidents and changes assigned to you, including their status and latest comments. This version uses Stagehand for browser automation, providing better handling of authentication challenges.

## Key Features

- **Enhanced Microsoft Authentication Handling**: Special handling for the "AADSTS90561" error that occurs when authenticating with Microsoft accounts
- **Session Persistence**: Saves authentication state between runs to minimize the need to log in repeatedly
- **Improved Data Extraction**: Robust selectors for extracting data from complex TOPdesk interfaces
- **Comprehensive Tracking**: Monitors incidents and changes for status updates and new comments

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager
- A TOPdesk account with proper permissions

## Setup Instructions

1. Clone or download this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Make the script executable (Linux/Mac only):
   ```
   chmod +x topdesk-client.js
   ```

## Usage

### Basic Commands

```
node topdesk-client.js my-incidents       # View your assigned incidents
node topdesk-client.js my-changes         # View your assigned changes
node topdesk-client.js incident-details <incident_id>  # View details of a specific incident
node topdesk-client.js change-details <change_id>      # View details of a specific change
node topdesk-client.js check-updates      # Check for new incidents, changes, comments, and status updates
```

### Handling Microsoft Authentication

This implementation includes specialized handling for Microsoft authentication systems that often cause issues with automated tools. The script:

1. Detects the "AADSTS90561" error that occurs when a GET request is sent to endpoints requiring POST
2. Automatically converts certain requests to POST methods when needed
3. Takes screenshots and provides detailed guidance when authentication issues occur

**Recommended workflow for Microsoft authentication:**
1. First, log in to TOPdesk in your normal browser
2. Keep that browser open and session active
3. Run this script - it can often reuse your authentication session

### Advanced Options

```
node topdesk-client.js my-incidents --headless      # Run without showing the browser window (not recommended)
```

## Authentication State

The tool manages authentication in several ways:

1. **Session Storage**: Authentication state is saved to `topdesk-auth-state.json` after successful login
2. **Cookie Reuse**: Subsequent runs will attempt to use saved cookies before prompting for login
3. **Manual Login**: If needed, a browser window will open for you to log in manually
4. **Request Interception**: Special handling for Microsoft authentication endpoints to convert problematic GET requests to POST

## Debugging Features

The script generates several debugging files:

- `topdesk_login_screen.png` - Shows the initial login page
- `topdesk_logged_in.png` - Captured after successful login
- `topdesk_timeout.png` - Saved if login times out
- `topdesk-lastcheck.json` - Stores information about previously seen incidents and changes

## Security Considerations

This tool is designed with security in mind:
- No credentials are stored in code or configuration files
- Authentication is handled through your browser's standard login process
- Session data is stored locally but contains only cookies, not your username or password

## Troubleshooting

If you encounter issues:

1. **Authentication problems**:
   - Check the screenshots in the project directory
   - Look for "AADSTS90561" errors in the console output
   - Try logging in to TOPdesk manually in another browser first

2. **No data returned**:
   - Verify you have incidents/changes assigned to you in TOPdesk
   - Check your account permissions in TOPdesk

3. **Script errors**:
   - Make sure Node.js 14+ is installed
   - Check if all dependencies were installed correctly with `npm list`

## Differences from Python Version

This Node.js/Stagehand implementation provides several advantages over the Python/Playwright version:

1. **Better authentication handling**: More robust handling of Microsoft authentication challenges
2. **More efficient session persistence**: Improved cookie and storage state management
3. **Cleaner browser automation**: More reliable element selection and interaction