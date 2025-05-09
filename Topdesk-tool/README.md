# TOPdesk Client Tool

A tool for interacting with TOPdesk to retrieve information about incidents and changes assigned to you, including their status and latest comments.

## Features

- View incidents assigned to you
- View changes assigned to you
- Get detailed information about specific incidents
- Get detailed information about specific changes
- View comments on incidents and changes
- Track new or updated incidents and changes
- Monitor status changes and new comments

## Available Approaches

### 1. Browser-Based Client (topdesk_browser.py) - Recommended

Uses Playwright to automate browser interactions with TOPdesk. No credentials are stored - you'll log in manually when the browser opens.

### 2. API-Based Client (topdesk_client.py) 

Uses the TOPdesk API to retrieve information. Requires storing credentials in a config file.

## Setup Instructions

1. Ensure you have Python 3.8+ installed
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Install Playwright browsers:
   ```
   python -m playwright install
   ```

## Browser-Based Usage (Recommended)

This approach opens a browser where you can log in manually, providing better security since no credentials are stored.

### Basic Commands

```
python topdesk_browser.py my-incidents       # View your assigned incidents
python topdesk_browser.py my-changes         # View your assigned changes
python topdesk_browser.py incident-details <incident_id>  # View details of a specific incident
python topdesk_browser.py change-details <change_id>      # View details of a specific change
python topdesk_browser.py check-updates      # Check for new incidents, changes, comments, and status updates
```

### Handling Microsoft Authentication

If you encounter Microsoft authentication errors (AADSTS90561), the script will:

1. Display an error message explaining the issue
2. Save screenshots to help diagnose the problem
3. Wait for you to complete the login manually
4. Continue once you're logged in

**Recommended workflow for Microsoft authentication:**
1. First, log in to TOPdesk in your normal browser
2. Keep that browser open and session active
3. Then run the script - it may be able to reuse your authentication session

### Advanced Options

```
python topdesk_browser.py my-incidents --headless      # Run without showing the browser window (not recommended)
```

### Screenshot Files

The script generates several screenshots to help troubleshoot:
- `topdesk_login_screen.png` - Shows the initial login page
- `topdesk_logged_in.png` - Captured after successful login
- `topdesk_timeout.png` - Saved if login times out

## API-Based Usage (Alternative)

This approach uses the TOPdesk API directly. Note that it requires storing your credentials in a config file.

### Setting Up Credentials

```
python topdesk_client.py setup
```
Follow the prompts to configure your TOPdesk URL, username and password (or API key if available).

### Basic Commands

```
python topdesk_client.py my-incidents       # View your assigned incidents
python topdesk_client.py my-changes         # View your assigned changes
python topdesk_client.py incident-details <incident_id>  # View details of a specific incident
python topdesk_client.py change-details <change_id>      # View details of a specific change
python topdesk_client.py check-updates      # Check for new incidents, changes, comments, and status updates
python topdesk_client.py summary            # View a summary of all tracked incidents and changes
```

## Understanding the Output

Both script versions provide structured output with similar information:

### Incident/Change List Format
For each incident or change, you'll see:
- Reference number
- Subject
- Current status
- Creation date
- Other relevant metadata

### Comments Section
When viewing details, comments are displayed with:
- Creator name
- Timestamp
- Full comment text

### Update Notifications
When checking for updates, the output is grouped into categories:
- New incidents/changes
- Status changes
- New comments

## Security Considerations

- **Browser-based approach**: More secure - credentials are entered manually each time and never stored
- **API-based approach**: Less secure - credentials are stored in `config.ini` as plain text
- If you must use the API approach, consider these precautions:
  - Store `config.ini` outside your code repository
  - Add `config.ini` to your `.gitignore` file
  - Use an API key instead of your password if your TOPdesk instance supports it

## Troubleshooting

If you encounter issues:

1. **Authentication problems**:
   - Ensure your TOPdesk credentials are correct
   - For browser approach, try logging in manually first in a regular browser

2. **Microsoft authentication errors**:
   - Look for "AADSTS90561" error messages in screenshots or console output
   - Follow the recommendations for pre-logging in to TOPdesk in another browser

3. **No data returned**:
   - Verify you have incidents/changes assigned to you in TOPdesk
   - Check if your account has appropriate permissions

4. **Script errors**:
   - Ensure Python 3.8+ and all dependencies are installed
   - Check `requirements.txt` for necessary packages

If problems persist, examine the screenshots generated by the browser-based tool for clues about what might be happening.

## Development Notes

- Both scripts use the same data structure for compatibility
- Data is cached locally to track changes between runs
- The browser script (`topdesk_browser.py`) was designed to handle Microsoft/Azure AD authentication challenges