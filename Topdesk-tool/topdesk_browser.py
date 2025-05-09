#!/usr/bin/env python
"""
TOPdesk Browser Client

This script provides a browser-based approach to interact with TOPdesk.
Instead of storing credentials in a config file, it opens a browser
and allows you to log in manually, then extracts the needed information.

Usage:
    python topdesk_browser.py [command]

Commands:
    my-incidents: Get incidents assigned to you
    my-changes: Get changes assigned to you
    incident-details [id]: Get details of a specific incident
    change-details [id]: Get details of a specific change
"""

import os
import sys
import json
import argparse
import datetime
import asyncio
from pathlib import Path
from typing import Dict, List, Any, Optional
from dateutil.parser import parse as parse_date

try:
    from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError, Request, Route
except ImportError:
    print("Playwright not installed. Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright", "python-dateutil"])
    subprocess.check_call([sys.executable, "-m", "playwright", "install"])
    from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError, Request, Route


# TOPdesk URL
TOPDESK_URL = "https://support.macaw.nl/"

# Cache file to store session data
SESSION_CACHE = "topdesk_session.json"

# Track when we last checked for updates
LAST_CHECK_FILE = "topdesk_lastcheck.json"

# Login timeout in milliseconds (5 minutes)
LOGIN_TIMEOUT = 300000  # 5 minutes


class TopdeskBrowser:
    """Browser-based client for TOPdesk"""

    def __init__(self, headless=False):
        """Initialize the browser client"""
        self.headless = headless
        self.browser = None
        self.context = None
        self.page = None
        self.logged_in = False

    async def start(self):
        """Start the browser session"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            # Slower navigation but more reliable for complex sites
            slow_mo=100
        )
        self.context = await self.browser.new_context(
            # Emulate a desktop browser
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        )
        
        # Handle route interception for Microsoft login issues
        await self.context.route("**/*", self.handle_route)
        
        self.page = await self.context.new_page()

    async def handle_route(self, route: Route, request: Request):
        """Handle route interception - especially for Microsoft login issues"""
        # Check if this is a Microsoft login endpoint where we see AADSTS90561 errors
        if "login.microsoftonline.com" in request.url:
            print(f"Request method: {request.method} to {request.url}")
            # Let the request continue normally, we'll handle login issues in the ensure_logged_in method
            await route.continue_()
        else:
            # For all other URLs, continue normally
            await route.continue_()

    async def close(self):
        """Close the browser session"""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright'):
            await self.playwright.stop()

    async def ensure_logged_in(self):
        """Ensure we are logged in to TOPdesk"""
        if self.logged_in:
            return True

        # Navigate to the login page
        await self.page.goto(TOPDESK_URL)
        
        # Take a screenshot to debug what's happening
        await self.page.screenshot(path="topdesk_login_screen.png")
        
        print("\nSaved login screen to topdesk_login_screen.png for reference")
        
        # Check for Microsoft authentication errors
        error_text = await self.page.text_content("body") or ""
        if "AADSTS90561" in error_text:
            print("\n===== Microsoft Authentication Error Detected =====")
            print("The error 'AADSTS90561: The endpoint only accepts POST requests' was detected.")
            print("This is usually a browser automation limitation with Microsoft login.")
            print("\nPlease try the following:")
            print("1. Open TOPdesk in a regular browser window")
            print("2. Log in and stay logged in")
            print("3. Try running this script again")
            print("====================================================\n")
            
            # Wait longer to give more time to manually correct the situation
            print("Waiting 30 seconds to allow for manual login...")
            await asyncio.sleep(30)
        
        # Check if we're already on a TOPdesk page with common indicators of being logged in
        possible_logged_in_indicators = [
            'text=Log out',
            'text=Logout',
            'text=Sign out',
            'button:has-text("Log out")',
            '.navbar-right',  # Common class for right-side navbar that contains logout
            'a[href*="logout"]',
            '[aria-label="User menu"]',
            '.user-profile',
            '#operator-name',  # Common ID for showing logged-in user
            '.dashboards',     # Dashboard element usually only visible when logged in
            '.header-bar'      # TOPdesk header usually visible when logged in
        ]
        
        for selector in possible_logged_in_indicators:
            try:
                element = await self.page.query_selector(selector)
                if element:
                    print(f"Found logged in indicator: {selector}")
                    self.logged_in = True
                    return True
            except Exception:
                continue
        
        # Wait for the user to manually log in
        print("\n=============================================")
        print("Please log in to TOPdesk in the browser window")
        print("The script will continue once you're logged in")
        print(f"You have {LOGIN_TIMEOUT/60000} minutes to complete the login")
        print("=============================================\n")
        
        try:
            # Wait for any of the indicators that suggest successful login
            for selector in possible_logged_in_indicators:
                try:
                    await self.page.wait_for_selector(selector, timeout=LOGIN_TIMEOUT/len(possible_logged_in_indicators))
                    print(f"Login successful, detected: {selector}")
                    self.logged_in = True
                    await self.page.screenshot(path="topdesk_logged_in.png")
                    return True
                except PlaywrightTimeoutError:
                    continue
            
            # If we get here, none of the selectors were found within their timeouts
            # As a last resort, check for URL changes or other indicators
            await self.page.wait_for_function('''
                () => {
                    // Check if URL contains typical paths after login
                    return window.location.href.includes('/tas/secure/') || 
                           window.location.href.includes('/dashboard') ||
                           document.title.includes('Dashboard') ||
                           document.title.includes('TOPdesk');
                }
            ''', timeout=LOGIN_TIMEOUT)
            
            print("Login appears successful based on URL or page title")
            self.logged_in = True
            await self.page.screenshot(path="topdesk_logged_in.png")
            return True
            
        except PlaywrightTimeoutError:
            print(f"Login timed out after {LOGIN_TIMEOUT/60000} minutes.")
            print("Please check the screenshot to see what happened.")
            await self.page.screenshot(path="topdesk_timeout.png")
            return False

    async def get_my_incidents(self):
        """Get incidents assigned to the current user"""
        if not await self.ensure_logged_in():
            return []
            
        # Navigate to the incident overview page
        await self.page.goto(f"{TOPDESK_URL}tas/secure/incident")
        
        # Wait for the incident table to load
        await self.page.wait_for_selector('table.table-incidents')
        
        # Select view showing "Assigned to me"
        try:
            # Click the dropdown to show available views
            await self.page.click('text="View"')
            # Wait for the dropdown to appear and click "Assigned to me"
            await self.page.click('text="Assigned to me"', timeout=5000)
            # Wait for the table to update
            await asyncio.sleep(2)  # Give it a moment to update
        except PlaywrightTimeoutError:
            print("Could not switch to 'Assigned to me' view. Using default view.")
        
        # Extract incident data
        incidents = await self.page.evaluate('''() => {
            const rows = Array.from(document.querySelectorAll('table.table-incidents tbody tr'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                // Get the incident number and ID from the first cell
                const numberCell = cells[0] ? cells[0].textContent.trim() : 'N/A';
                const idMatch = cells[0]?.querySelector('a')?.getAttribute('href')?.match(/id=([^&]+)/);
                const id = idMatch ? idMatch[1] : '';
                
                // Get other data from cells
                const status = cells[1] ? cells[1].textContent.trim() : 'N/A';
                const briefDesc = cells[2] ? cells[2].textContent.trim() : 'N/A';
                const caller = cells[3] ? cells[3].textContent.trim() : 'N/A';
                const category = cells[4] ? cells[4].textContent.trim() : 'N/A';
                const creationDate = cells[5] ? cells[5].textContent.trim() : 'N/A';
                
                return {
                    id: id,
                    number: numberCell,
                    status: status,
                    subject: briefDesc,
                    caller: caller,
                    category: category,
                    creation_date: creationDate
                };
            });
        }''')
        
        return incidents

    async def get_my_changes(self):
        """Get changes assigned to the current user"""
        if not await self.ensure_logged_in():
            return []
            
        # Navigate to the changes overview page
        await self.page.goto(f"{TOPDESK_URL}tas/secure/operatorchange")
        
        # Wait for the changes table to load
        await self.page.wait_for_selector('table.table-changes', timeout=10000)
        
        # Try to select view showing changes assigned to me
        try:
            # Click the dropdown to show available views
            await self.page.click('text="View"')
            # Wait for the dropdown to appear and click appropriate option
            # Name might vary based on TOPdesk configuration
            await self.page.click('text="Assigned to me"', timeout=5000)
            # Wait for the table to update
            await asyncio.sleep(2)  # Give it a moment to update
        except PlaywrightTimeoutError:
            print("Could not switch to 'Assigned to me' view for changes. Using default view.")
        
        # Extract change data
        changes = await self.page.evaluate('''() => {
            const rows = Array.from(document.querySelectorAll('table.table-changes tbody tr'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                // Get the change number and ID from the first cell
                const numberCell = cells[0] ? cells[0].textContent.trim() : 'N/A';
                const idMatch = cells[0]?.querySelector('a')?.getAttribute('href')?.match(/id=([^&]+)/);
                const id = idMatch ? idMatch[1] : '';
                
                // Get other data from cells
                const status = cells[1] ? cells[1].textContent.trim() : 'N/A';
                const briefDesc = cells[2] ? cells[2].textContent.trim() : 'N/A';
                const template = cells[3] ? cells[3].textContent.trim() : 'N/A';
                const creationDate = cells[4] ? cells[4].textContent.trim() : 'N/A';
                
                return {
                    id: id,
                    number: numberCell,
                    status: status,
                    subject: briefDesc,
                    template: template,
                    creation_date: creationDate
                };
            });
        }''')
        
        return changes

    async def get_incident_details(self, incident_id):
        """Get detailed information about a specific incident"""
        if not await self.ensure_logged_in():
            return None
            
        # Navigate to the incident detail page
        await self.page.goto(f"{TOPDESK_URL}tas/secure/incident?action=details&id={incident_id}")
        
        # Wait for the incident details to load
        await self.page.wait_for_selector('.incident-view')
        
        # Give the page a moment to fully render
        await asyncio.sleep(1)
        
        # Extract incident details
        incident_details = await self.page.evaluate('''(id) => {
            // Basic incident details
            const number = document.querySelector('.page-header h1')?.textContent.trim() || 'N/A';
            const subject = document.querySelector('.page-header h2')?.textContent.trim() || 'N/A';
            const status = document.querySelector('.status-badge')?.textContent.trim() || 'N/A';
            
            // Try to get other details from form fields
            const getFieldValue = (label) => {
                const fieldLabel = Array.from(document.querySelectorAll('.control-label')).find(el => el.textContent.includes(label));
                return fieldLabel ? fieldLabel.nextElementSibling?.textContent.trim() || 'N/A' : 'N/A';
            };
            
            // Get the request/description text
            let request = '';
            const requestElement = document.querySelector('.request-container');
            if (requestElement) {
                request = requestElement.textContent.trim();
            }
            
            return {
                id: id,
                number: number,
                subject: subject,
                status: status,
                caller: getFieldValue('Caller'),
                category: getFieldValue('Category'),
                priority: getFieldValue('Priority'),
                request: request,
                creation_date: getFieldValue('Creation date'),
                operator: getFieldValue('Operator')
            };
        }''', incident_id)
        
        # Get comments for this incident
        comments = await self._get_comments_for_incident(incident_id)
        incident_details['comments'] = comments
        
        return incident_details

    async def get_change_details(self, change_id):
        """Get detailed information about a specific change"""
        if not await self.ensure_logged_in():
            return None
            
        # Navigate to the change detail page
        await self.page.goto(f"{TOPDESK_URL}tas/secure/operatorchange?action=details&id={change_id}")
        
        # Wait for the change details to load
        await self.page.wait_for_selector('.change-view')
        
        # Give the page a moment to fully render
        await asyncio.sleep(1)
        
        # Extract change details
        change_details = await self.page.evaluate('''(id) => {
            // Basic change details
            const number = document.querySelector('.page-header h1')?.textContent.trim() || 'N/A';
            const subject = document.querySelector('.page-header h2')?.textContent.trim() || 'N/A';
            const status = document.querySelector('.status-badge')?.textContent.trim() || 'N/A';
            
            // Try to get other details from form fields
            const getFieldValue = (label) => {
                const fieldLabel = Array.from(document.querySelectorAll('.control-label')).find(el => el.textContent.includes(label));
                return fieldLabel ? fieldLabel.nextElementSibling?.textContent.trim() || 'N/A' : 'N/A';
            };
            
            // Get the description text
            let briefDescription = '';
            const descElement = document.querySelector('.brief-description-container');
            if (descElement) {
                briefDescription = descElement.textContent.trim();
            }
            
            return {
                id: id,
                number: number,
                subject: subject,
                status: status,
                template: getFieldValue('Template'),
                brief_description: briefDescription,
                creation_date: getFieldValue('Creation date'),
                requester: getFieldValue('Requester'),
                manager: getFieldValue('Manager')
            };
        }''', change_id)
        
        # Get comments for this change
        comments = await self._get_comments_for_change(change_id)
        change_details['comments'] = comments
        
        return change_details

    async def _get_comments_for_incident(self, incident_id):
        """Get comments for a specific incident"""
        # Navigate to the comments tab
        try:
            # First check if there's a comments tab
            comment_tab = await self.page.query_selector('a[href="#tab-comments"]')
            if comment_tab:
                await comment_tab.click()
                await asyncio.sleep(1)  # Give time for comments to load
            else:
                # Maybe comments are already visible
                comment_section = await self.page.query_selector('.comments-container')
                if not comment_section:
                    return []
        except Exception as e:
            print(f"Error accessing comments tab: {e}")
            return []
        
        # Extract comments
        comments = await self.page.evaluate('''() => {
            const commentElements = Array.from(document.querySelectorAll('.comments-container .comment'));
            return commentElements.map(comment => {
                const header = comment.querySelector('.comment-header');
                const creator = header?.querySelector('.comment-creator')?.textContent.trim() || 'Unknown';
                const date = header?.querySelector('.comment-date')?.textContent.trim() || 'Unknown';
                const text = comment.querySelector('.comment-text')?.textContent.trim() || '';
                
                return {
                    creator: { name: creator },
                    creation_date: date,
                    text: text
                };
            });
        }''')
        
        return comments

    async def _get_comments_for_change(self, change_id):
        """Get comments for a specific change"""
        # Similar to incident comments but might have a different structure
        # Navigate to the comments tab if it exists
        try:
            # First check if there's a comments tab
            comment_tab = await self.page.query_selector('a[href="#tab-comments"]')
            if comment_tab:
                await comment_tab.click()
                await asyncio.sleep(1)  # Give time for comments to load
            else:
                # Maybe comments are already visible
                comment_section = await self.page.query_selector('.comments-container')
                if not comment_section:
                    return []
        except Exception as e:
            print(f"Error accessing comments tab: {e}")
            return []
        
        # Extract comments (same approach as incidents, but template might differ)
        comments = await self.page.evaluate('''() => {
            const commentElements = Array.from(document.querySelectorAll('.comments-container .comment'));
            return commentElements.map(comment => {
                const header = comment.querySelector('.comment-header');
                const creator = header?.querySelector('.comment-creator')?.textContent.trim() || 'Unknown';
                const date = header?.querySelector('.comment-date')?.textContent.trim() || 'Unknown';
                const text = comment.querySelector('.comment-text')?.textContent.trim() || '';
                
                return {
                    creator: { name: creator },
                    creation_date: date,
                    text: text
                };
            });
        }''')
        
        return comments

    async def check_for_updates(self):
        """Check for updates in incidents and changes since last check"""
        # Get current incidents and changes
        current_incidents = await self.get_my_incidents()
        current_changes = await self.get_my_changes()
        
        # Load previous state if available
        previous_data = self._load_previous_state()
        
        # Current timestamp
        now = datetime.datetime.now().isoformat()
        
        # Track new or updated items
        new_incidents = []
        updated_incidents = []
        new_changes = []
        updated_changes = []
        
        # Compare incidents
        for incident in current_incidents:
            incident_id = incident.get('id')
            if not incident_id:
                continue
                
            if incident_id not in previous_data.get('incidents', {}):
                # This is a new incident
                new_incidents.append(incident)
                # Fetch details to get any comments
                incident_details = await self.get_incident_details(incident_id)
                previous_data.setdefault('incidents', {})[incident_id] = {
                    'status': incident.get('status'),
                    'last_comment_date': self._get_latest_comment_date(incident_details.get('comments', [])),
                    'last_check': now
                }
            else:
                # Check if status has changed
                prev_status = previous_data['incidents'][incident_id].get('status')
                curr_status = incident.get('status')
                if prev_status and curr_status and prev_status != curr_status:
                    updated_incidents.append({
                        'incident': incident,
                        'old_status': prev_status,
                        'new_status': curr_status,
                        'type': 'status_change'
                    })
                    previous_data['incidents'][incident_id]['status'] = curr_status
                
                # Check for new comments
                incident_details = await self.get_incident_details(incident_id)
                latest_comment_date = self._get_latest_comment_date(incident_details.get('comments', []))
                prev_comment_date = previous_data['incidents'][incident_id].get('last_comment_date')
                
                if latest_comment_date and (not prev_comment_date or latest_comment_date > prev_comment_date):
                    # Find the newest comment
                    latest_comment = None
                    if incident_details.get('comments'):
                        # Sort by date descending and get the first one
                        sorted_comments = sorted(incident_details.get('comments', []), 
                                               key=lambda x: x.get('creation_date', ''), 
                                               reverse=True)
                        if sorted_comments:
                            latest_comment = sorted_comments[0]
                    
                    if latest_comment:
                        updated_incidents.append({
                            'incident': incident,
                            'comment': latest_comment,
                            'type': 'new_comment'
                        })
                    previous_data['incidents'][incident_id]['last_comment_date'] = latest_comment_date
        
        # Compare changes (similar logic to incidents)
        for change in current_changes:
            change_id = change.get('id')
            if not change_id:
                continue
                
            if change_id not in previous_data.get('changes', {}):
                # This is a new change
                new_changes.append(change)
                # Fetch details to get any comments
                change_details = await self.get_change_details(change_id)
                previous_data.setdefault('changes', {})[change_id] = {
                    'status': change.get('status'),
                    'last_comment_date': self._get_latest_comment_date(change_details.get('comments', [])),
                    'last_check': now
                }
            else:
                # Check if status has changed
                prev_status = previous_data['changes'][change_id].get('status')
                curr_status = change.get('status')
                if prev_status and curr_status and prev_status != curr_status:
                    updated_changes.append({
                        'change': change,
                        'old_status': prev_status,
                        'new_status': curr_status,
                        'type': 'status_change'
                    })
                    previous_data['changes'][change_id]['status'] = curr_status
                
                # Check for new comments
                change_details = await self.get_change_details(change_id)
                latest_comment_date = self._get_latest_comment_date(change_details.get('comments', []))
                prev_comment_date = previous_data['changes'][change_id].get('last_comment_date')
                
                if latest_comment_date and (not prev_comment_date or latest_comment_date > prev_comment_date):
                    # Find the newest comment
                    latest_comment = None
                    if change_details.get('comments'):
                        # Sort by date descending and get the first one
                        sorted_comments = sorted(change_details.get('comments', []), 
                                               key=lambda x: x.get('creation_date', ''), 
                                               reverse=True)
                        if sorted_comments:
                            latest_comment = sorted_comments[0]
                    
                    if latest_comment:
                        updated_changes.append({
                            'change': change,
                            'comment': latest_comment,
                            'type': 'new_comment'
                        })
                    previous_data['changes'][change_id]['last_comment_date'] = latest_comment_date
        
        # Update the last check time
        previous_data['last_check'] = now
        self._save_previous_state(previous_data)
        
        return {
            'new_incidents': new_incidents,
            'updated_incidents': updated_incidents,
            'new_changes': new_changes,
            'updated_changes': updated_changes
        }

    def _get_latest_comment_date(self, comments):
        """Get the latest comment date from a list of comments"""
        if not comments:
            return None
            
        # Extract dates and find the max
        dates = []
        for comment in comments:
            date_str = comment.get('creation_date')
            if date_str:
                dates.append(date_str)
        
        return max(dates) if dates else None

    def _load_previous_state(self):
        """Load previous state from file if available"""
        if os.path.exists(LAST_CHECK_FILE):
            try:
                with open(LAST_CHECK_FILE, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                # If file is corrupted or can't be read, start fresh
                return {'incidents': {}, 'changes': {}, 'last_check': None}
        else:
            return {'incidents': {}, 'changes': {}, 'last_check': None}
            
    def _save_previous_state(self, data):
        """Save state to file"""
        with open(LAST_CHECK_FILE, 'w') as f:
            json.dump(data, f, indent=2)


def format_date(date_str):
    """Format a date string into a more readable format"""
    if not date_str or date_str == 'N/A' or date_str == 'Unknown':
        return date_str
        
    try:
        dt = parse_date(date_str)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, TypeError):
        return date_str


def print_incidents(incidents):
    """Print incidents in a readable format"""
    print(f"\nFound {len(incidents)} incidents assigned to you:")
    if not incidents:
        print("No incidents found.")
        return
        
    for incident in incidents:
        print(f"\nIncident: {incident.get('number', 'N/A')}")
        print(f"Subject: {incident.get('subject', 'N/A')}")
        print(f"Status: {incident.get('status', 'N/A')}")
        print(f"Category: {incident.get('category', 'N/A')}")
        print(f"Created: {format_date(incident.get('creation_date', 'N/A'))}")
        if incident.get('request'):
            print(f"Request: {incident.get('request', 'N/A')[:100]}...")
        print("-" * 50)


def print_changes(changes):
    """Print changes in a readable format"""
    print(f"\nFound {len(changes)} changes assigned to you:")
    if not changes:
        print("No changes found.")
        return
        
    for change in changes:
        print(f"\nChange: {change.get('number', 'N/A')}")
        print(f"Subject: {change.get('subject', 'N/A')}")
        print(f"Status: {change.get('status', 'N/A')}")
        print(f"Template: {change.get('template', 'N/A')}")
        print(f"Created: {format_date(change.get('creation_date', 'N/A'))}")
        if change.get('brief_description'):
            print(f"Description: {change.get('brief_description', 'N/A')[:100]}...")
        print("-" * 50)


def print_comments(comments):
    """Print comments in a readable format"""
    if not comments:
        print("\nNo comments found.")
        return
        
    print(f"\nComments ({len(comments)}):")
    for i, comment in enumerate(comments, 1):
        creator = comment.get('creator', {}).get('name', 'Unknown')
        date = format_date(comment.get('creation_date', 'N/A'))
        text = comment.get('text', 'N/A')
        
        print(f"[{i}] {date} - {creator}")
        print(f"{text}")
        print("-" * 40)


def print_updates(updates):
    """Print updates in a readable format"""
    # Count total updates
    total_updates = (
        len(updates['new_incidents']) + 
        len(updates['updated_incidents']) +
        len(updates['new_changes']) + 
        len(updates['updated_changes'])
    )
    
    if total_updates == 0:
        print("\nNo new updates found.")
        return
        
    print(f"\nFound {total_updates} updates in TOPdesk:")
    
    # Print new incidents
    if updates['new_incidents']:
        print("\n=== New Incidents ===")
        for incident in updates['new_incidents']:
            print(f"[{incident.get('number', 'N/A')}] {incident.get('subject', 'N/A')}")
            print(f"Status: {incident.get('status', 'N/A')}")
            print("-" * 40)
    
    # Print updated incidents - status changes
    status_changes = [u for u in updates['updated_incidents'] if u['type'] == 'status_change']
    if status_changes:
        print("\n=== Status Changes ===")
        for update in status_changes:
            incident = update['incident']
            print(f"[{incident.get('number', 'N/A')}] {incident.get('subject', 'N/A')}")
            print(f"Status changed: {update['old_status']} → {update['new_status']}")
            print("-" * 40)
    
    # Print updated incidents - new comments
    comment_updates = [u for u in updates['updated_incidents'] if u['type'] == 'new_comment']
    if comment_updates:
        print("\n=== New Comments on Incidents ===")
        for update in comment_updates:
            incident = update['incident']
            comment = update['comment']
            print(f"[{incident.get('number', 'N/A')}] {incident.get('subject', 'N/A')}")
            creator = comment.get('creator', {}).get('name', 'Unknown')
            date = format_date(comment.get('creation_date', ''))
            print(f"Comment by {creator} on {date}:")
            text = comment.get('text', 'N/A')
            print(f"{text[:100]}..." if len(text) > 100 else text)
            print("-" * 40)
    
    # Print new changes
    if updates['new_changes']:
        print("\n=== New Changes ===")
        for change in updates['new_changes']:
            print(f"[{change.get('number', 'N/A')}] {change.get('subject', 'N/A')}")
            print(f"Status: {change.get('status', 'N/A')}")
            print("-" * 40)
    
    # Print updated changes - status changes
    status_changes = [u for u in updates['updated_changes'] if u['type'] == 'status_change']
    if status_changes:
        print("\n=== Change Status Updates ===")
        for update in status_changes:
            change = update['change']
            print(f"[{change.get('number', 'N/A')}] {change.get('subject', 'N/A')}")
            print(f"Status changed: {update['old_status']} → {update['new_status']}")
            print("-" * 40)
    
    # Print updated changes - new comments
    comment_updates = [u for u in updates['updated_changes'] if u['type'] == 'new_comment']
    if comment_updates:
        print("\n=== New Comments on Changes ===")
        for update in comment_updates:
            change = update['change']
            comment = update['comment']
            print(f"[{change.get('number', 'N/A')}] {change.get('subject', 'N/A')}")
            creator = comment.get('creator', {}).get('name', 'Unknown')
            date = format_date(comment.get('creation_date', ''))
            print(f"Comment by {creator} on {date}:")
            text = comment.get('text', 'N/A')
            print(f"{text[:100]}..." if len(text) > 100 else text)
            print("-" * 40)


async def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description="TOPdesk Browser Client")
    parser.add_argument("command", choices=["my-incidents", "my-changes", "incident-details", 
                                           "change-details", "check-updates"], 
                       help="Command to run")
    parser.add_argument("id", nargs="?", help="Incident or change ID (required for details)")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    
    args = parser.parse_args()
    
    # Initialize the browser
    client = TopdeskBrowser(headless=args.headless)
    
    try:
        # Start the browser
        await client.start()
        
        if args.command == "my-incidents":
            incidents = await client.get_my_incidents()
            print_incidents(incidents)
        
        elif args.command == "my-changes":
            changes = await client.get_my_changes()
            print_changes(changes)
        
        elif args.command == "incident-details":
            if not args.id:
                print("Error: Incident ID is required for incident-details command")
                return
                
            incident = await client.get_incident_details(args.id)
            if incident:
                # Display incident details
                print(f"\nIncident: {incident.get('number', 'N/A')}")
                print(f"Subject: {incident.get('subject', 'N/A')}")
                print(f"Status: {incident.get('status', 'N/A')}")
                print(f"Caller: {incident.get('caller', 'N/A')}")
                print(f"Category: {incident.get('category', 'N/A')}")
                print(f"Priority: {incident.get('priority', 'N/A')}")
                print(f"Operator: {incident.get('operator', 'N/A')}")
                print(f"Created: {format_date(incident.get('creation_date', 'N/A'))}")
                
                if incident.get('request'):
                    print(f"\nRequest:")
                    print(incident.get('request'))
                
                # Display comments
                print_comments(incident.get('comments', []))
        
        elif args.command == "change-details":
            if not args.id:
                print("Error: Change ID is required for change-details command")
                return
                
            change = await client.get_change_details(args.id)
            if change:
                # Display change details
                print(f"\nChange: {change.get('number', 'N/A')}")
                print(f"Subject: {change.get('subject', 'N/A')}")
                print(f"Status: {change.get('status', 'N/A')}")
                print(f"Template: {change.get('template', 'N/A')}")
                print(f"Requester: {change.get('requester', 'N/A')}")
                print(f"Manager: {change.get('manager', 'N/A')}")
                print(f"Created: {format_date(change.get('creation_date', 'N/A'))}")
                
                if change.get('brief_description'):
                    print(f"\nDescription:")
                    print(change.get('brief_description'))
                
                # Display comments
                print_comments(change.get('comments', []))
                
        elif args.command == "check-updates":
            updates = await client.check_for_updates()
            print_updates(updates)
                
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        print(traceback.format_exc())
    finally:
        # Always close the browser
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())