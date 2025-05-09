#!/usr/bin/env node

/**
 * TOPdesk Client Tool (Stagehand Version)
 * 
 * A tool for interacting with TOPdesk to retrieve information about incidents and changes
 * assigned to you, including their status and latest comments.
 */

const { Stagehand } = require('stagehand');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// Configuration
const TOPDESK_URL = "https://support.macaw.nl/";
const AUTH_STATE_PATH = path.join(__dirname, "topdesk-auth-state.json");
const LAST_CHECK_FILE = path.join(__dirname, "topdesk-lastcheck.json");
const LOGIN_TIMEOUT = 300000; // 5 minutes

/**
 * TOPdesk Browser Client
 * Uses Stagehand to interact with TOPdesk through a browser
 */
class TopdeskBrowser {
  constructor(options = {}) {
    this.headless = options.headless || false;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.loggedIn = false;
    this.stagehand = null;
  }

  /**
   * Initialize the browser
   */
  async start() {
    // Initialize Stagehand correctly
    this.stagehand = new Stagehand({
      headless: this.headless,
      // Use the Edge browser which tends to handle Microsoft auth better
      browserType: 'chromium',
      // Setting slowMo helps with stability
      slowMo: 100
    });
    
    await this.stagehand.setup();
    this.browser = this.stagehand.browser;
    
    // Try to use saved cookies if they exist
    let contextOptions = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    };
    
    try {
      const storagePath = path.resolve(AUTH_STATE_PATH);
      if (await fileExists(storagePath)) {
        console.log("Using saved authentication state...");
        contextOptions.storageState = storagePath;
      } else {
        console.log("No saved authentication state found, starting fresh session");
      }
    } catch (e) {
      console.log("Error loading auth state:", e.message);
      console.log("Starting fresh session");
    }
    
    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    
    // Setup request interception to handle Microsoft auth issues
    await this.setupRouteHandling();
  }

  /**
   * Configure route handling for Microsoft authentication
   */
  async setupRouteHandling() {
    await this.page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      
      if (url.includes('login.microsoftonline.com')) {
        console.log(`Intercepted ${request.method()} request to Microsoft login`);
        // Special handling for Microsoft login
        if (request.method() === 'GET' && (url.includes('/oauth2/') || url.includes('/authorize'))) {
          console.log('Converting GET to POST for Microsoft authentication');
          try {
            await route.continue({ method: 'POST' });
            return;
          } catch (e) {
            console.error("Error modifying request:", e);
            await route.continue();
            return;
          }
        }
      }
      await route.continue();
    });
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.context) {
      try {
        await this.context.close();
      } catch (e) {
        console.log("Error closing context:", e.message);
      }
    }
    
    if (this.stagehand) {
      try {
        await this.stagehand.teardown();
      } catch (e) {
        console.log("Error tearing down stagehand:", e.message);
      }
    }
  }

  /**
   * Ensure we are logged in to TOPdesk
   */
  async ensureLoggedIn() {
    if (this.loggedIn) {
      return true;
    }

    // Navigate to the login page
    await this.page.goto(TOPDESK_URL);
    
    // Take a screenshot to help with debugging
    await this.page.screenshot({ path: path.join(__dirname, "topdesk_login_screen.png") });
    console.log("\nSaved login screen to topdesk_login_screen.png for reference");
    
    // Check for Microsoft authentication errors
    const pageContent = await this.page.evaluate(() => document.body.innerText);
    if (pageContent.includes("AADSTS90561")) {
      console.log("\n===== Microsoft Authentication Error Detected =====");
      console.log("The error 'AADSTS90561: The endpoint only accepts POST requests' was detected.");
      console.log("This is usually a browser automation limitation with Microsoft login.");
      console.log("\nPlease try the following:");
      console.log("1. Open TOPdesk in a regular browser window");
      console.log("2. Log in and stay logged in");
      console.log("3. Try running this script again");
      console.log("====================================================\n");
      
      // Wait to give time to manually correct the situation
      console.log("Waiting 30 seconds to allow for manual login...");
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    // Check if we're already logged in by looking for common indicators
    const isLoggedIn = await this.checkIfLoggedIn();
    if (isLoggedIn) {
      console.log("Already logged in to TOPdesk");
      this.loggedIn = true;
      // Save state for future use
      await this.context.storageState({ path: AUTH_STATE_PATH });
      return true;
    }
    
    // Wait for the user to manually log in
    console.log("\n=============================================");
    console.log("Please log in to TOPdesk in the browser window");
    console.log("The script will continue once you're logged in");
    console.log(`You have ${LOGIN_TIMEOUT/60000} minutes to complete the login`);
    console.log("=============================================\n");
    
    try {
      // Wait for login to complete by checking for indicators periodically
      await this.page.waitForFunction(() => {
        // Check for various indicators that suggest successful login
        const loggedInIndicators = [
          document.body.textContent.includes('Log out'),
          document.body.textContent.includes('Logout'),
          document.body.textContent.includes('Sign out'),
          document.querySelector('.navbar-right') !== null,
          document.querySelector('a[href*="logout"]') !== null,
          document.querySelector('[aria-label="User menu"]') !== null,
          document.querySelector('.user-profile') !== null,
          document.querySelector('#operator-name') !== null,
          document.querySelector('.dashboards') !== null,
          document.querySelector('.header-bar') !== null,
          window.location.href.includes('/tas/secure/'),
          window.location.href.includes('/dashboard'),
          document.title.includes('Dashboard'),
          document.title.includes('TOPdesk')
        ];
        return loggedInIndicators.some(indicator => indicator === true);
      }, { timeout: LOGIN_TIMEOUT });
      
      // Save authentication state for future use
      await this.context.storageState({ path: AUTH_STATE_PATH });
      console.log("Login successful! Authentication state saved for future use.");
      
      await this.page.screenshot({ path: path.join(__dirname, "topdesk_logged_in.png") });
      this.loggedIn = true;
      return true;
    } catch (error) {
      console.log(`Login timed out after ${LOGIN_TIMEOUT/60000} minutes.`);
      await this.page.screenshot({ path: path.join(__dirname, "topdesk_timeout.png") });
      console.log("Please check the screenshot to see what happened.");
      return false;
    }
  }

  /**
   * Check if we're currently logged in to TOPdesk
   */
  async checkIfLoggedIn() {
    try {
      const indicators = [
        'text=Log out',
        'text=Logout',
        'text=Sign out',
        'button:has-text("Log out")',
        '.navbar-right',
        'a[href*="logout"]',
        '[aria-label="User menu"]',
        '.user-profile',
        '#operator-name',
        '.dashboards',
        '.header-bar'
      ];

      for (const selector of indicators) {
        const element = await this.page.$(selector);
        if (element) {
          console.log(`Found logged in indicator: ${selector}`);
          return true;
        }
      }

      // Also check URL and page title
      const url = this.page.url();
      const title = await this.page.title();
      
      if (url.includes('/tas/secure/') || 
          url.includes('/dashboard') || 
          title.includes('Dashboard') || 
          title.includes('TOPdesk')) {
        console.log("Detected logged in state from URL or page title");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  }

  /**
   * Get incidents assigned to the current user
   */
  async getMyIncidents() {
    if (!await this.ensureLoggedIn()) {
      return [];
    }
    
    // Navigate to the incident overview page
    await this.page.goto(`${TOPDESK_URL}tas/secure/incident`);
    
    // Wait for the incident table to load
    await this.page.waitForSelector('table.table-incidents');
    
    // Try to select view showing "Assigned to me"
    try {
      // Click the dropdown to show available views
      await this.page.click('text="View"');
      // Wait for the dropdown to appear and click "Assigned to me"
      await this.page.click('text="Assigned to me"', { timeout: 5000 });
      // Wait for the table to update
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Could not switch to 'Assigned to me' view. Using default view.");
    }
    
    // Extract incident data
    const incidents = await this.page.evaluate(() => {
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
    });
    
    return incidents;
  }

  /**
   * Get changes assigned to the current user
   */
  async getMyChanges() {
    if (!await this.ensureLoggedIn()) {
      return [];
    }
    
    // Navigate to the changes overview page
    await this.page.goto(`${TOPDESK_URL}tas/secure/operatorchange`);
    
    // Wait for the changes table to load
    try {
      await this.page.waitForSelector('table.table-changes', { timeout: 10000 });
    } catch (error) {
      console.log("Changes table not found. You may not have access to changes.");
      return [];
    }
    
    // Try to select view showing changes assigned to me
    try {
      // Click the dropdown to show available views
      await this.page.click('text="View"');
      // Wait for the dropdown to appear and click appropriate option
      await this.page.click('text="Assigned to me"', { timeout: 5000 });
      // Wait for the table to update
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Could not switch to 'Assigned to me' view for changes. Using default view.");
    }
    
    // Extract change data
    const changes = await this.page.evaluate(() => {
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
    });
    
    return changes;
  }

  /**
   * Get detailed information about a specific incident
   */
  async getIncidentDetails(incidentId) {
    if (!await this.ensureLoggedIn()) {
      return null;
    }
    
    // Navigate to the incident detail page
    await this.page.goto(`${TOPDESK_URL}tas/secure/incident?action=details&id=${incidentId}`);
    
    // Wait for the incident details to load
    try {
      await this.page.waitForSelector('.incident-view');
    } catch (error) {
      console.log("Incident details page not loaded correctly.");
      return null;
    }
    
    // Give the page a moment to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract incident details
    const incidentDetails = await this.page.evaluate((id) => {
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
    }, incidentId);
    
    // Get comments for this incident
    const comments = await this.getCommentsForIncident(incidentId);
    incidentDetails.comments = comments;
    
    return incidentDetails;
  }

  /**
   * Get detailed information about a specific change
   */
  async getChangeDetails(changeId) {
    if (!await this.ensureLoggedIn()) {
      return null;
    }
    
    // Navigate to the change detail page
    await this.page.goto(`${TOPDESK_URL}tas/secure/operatorchange?action=details&id=${changeId}`);
    
    // Wait for the change details to load
    try {
      await this.page.waitForSelector('.change-view');
    } catch (error) {
      console.log("Change details page not loaded correctly.");
      return null;
    }
    
    // Give the page a moment to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract change details
    const changeDetails = await this.page.evaluate((id) => {
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
    }, changeId);
    
    // Get comments for this change
    const comments = await this.getCommentsForChange(changeId);
    changeDetails.comments = comments;
    
    return changeDetails;
  }

  /**
   * Get comments for a specific incident
   */
  async getCommentsForIncident(incidentId) {
    // Navigate to the comments tab
    try {
      // First check if there's a comments tab
      const commentTab = await this.page.$('a[href="#tab-comments"]');
      if (commentTab) {
        await commentTab.click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Give time for comments to load
      } else {
        // Maybe comments are already visible
        const commentSection = await this.page.$('.comments-container');
        if (!commentSection) {
          return [];
        }
      }
    } catch (error) {
      console.log(`Error accessing comments tab: ${error}`);
      return [];
    }
    
    // Extract comments
    const comments = await this.page.evaluate(() => {
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
    });
    
    return comments;
  }

  /**
   * Get comments for a specific change
   */
  async getCommentsForChange(changeId) {
    // Similar to incident comments but might have a different structure
    try {
      // First check if there's a comments tab
      const commentTab = await this.page.$('a[href="#tab-comments"]');
      if (commentTab) {
        await commentTab.click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Give time for comments to load
      } else {
        // Maybe comments are already visible
        const commentSection = await this.page.$('.comments-container');
        if (!commentSection) {
          return [];
        }
      }
    } catch (error) {
      console.log(`Error accessing comments tab: ${error}`);
      return [];
    }
    
    // Extract comments (same approach as incidents, but template might differ)
    const comments = await this.page.evaluate(() => {
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
    });
    
    return comments;
  }

  /**
   * Check for updates in incidents and changes since last check
   */
  async checkForUpdates() {
    // Get current incidents and changes
    const currentIncidents = await this.getMyIncidents();
    const currentChanges = await this.getMyChanges();
    
    // Load previous state if available
    const previousData = await this.loadPreviousState();
    
    // Current timestamp
    const now = new Date().toISOString();
    
    // Track new or updated items
    const newIncidents = [];
    const updatedIncidents = [];
    const newChanges = [];
    const updatedChanges = [];
    
    // Process incidents
    for (const incident of currentIncidents) {
      const incidentId = incident.id;
      if (!incidentId) continue;
      
      if (!previousData.incidents[incidentId]) {
        // This is a new incident
        newIncidents.push(incident);
        
        // Fetch details to get any comments
        const incidentDetails = await this.getIncidentDetails(incidentId);
        previousData.incidents[incidentId] = {
          status: incident.status,
          last_comment_date: this.getLatestCommentDate(incidentDetails?.comments || []),
          last_check: now
        };
      } else {
        // Check if status has changed
        const prevStatus = previousData.incidents[incidentId].status;
        const currStatus = incident.status;
        
        if (prevStatus && currStatus && prevStatus !== currStatus) {
          updatedIncidents.push({
            incident: incident,
            old_status: prevStatus,
            new_status: currStatus,
            type: 'status_change'
          });
          previousData.incidents[incidentId].status = currStatus;
        }
        
        // Check for new comments
        const incidentDetails = await this.getIncidentDetails(incidentId);
        const latestCommentDate = this.getLatestCommentDate(incidentDetails?.comments || []);
        const prevCommentDate = previousData.incidents[incidentId].last_comment_date;
        
        if (latestCommentDate && (!prevCommentDate || latestCommentDate > prevCommentDate)) {
          // Find the newest comment
          const sortedComments = (incidentDetails?.comments || []).sort((a, b) => {
            return b.creation_date.localeCompare(a.creation_date);
          });
          
          if (sortedComments.length > 0) {
            updatedIncidents.push({
              incident: incident,
              comment: sortedComments[0],
              type: 'new_comment'
            });
          }
          
          previousData.incidents[incidentId].last_comment_date = latestCommentDate;
        }
      }
    }
    
    // Process changes (similar logic to incidents)
    for (const change of currentChanges) {
      const changeId = change.id;
      if (!changeId) continue;
      
      if (!previousData.changes[changeId]) {
        // This is a new change
        newChanges.push(change);
        
        // Fetch details to get any comments
        const changeDetails = await this.getChangeDetails(changeId);
        previousData.changes[changeId] = {
          status: change.status,
          last_comment_date: this.getLatestCommentDate(changeDetails?.comments || []),
          last_check: now
        };
      } else {
        // Check if status has changed
        const prevStatus = previousData.changes[changeId].status;
        const currStatus = change.status;
        
        if (prevStatus && currStatus && prevStatus !== currStatus) {
          updatedChanges.push({
            change: change,
            old_status: prevStatus,
            new_status: currStatus,
            type: 'status_change'
          });
          previousData.changes[changeId].status = currStatus;
        }
        
        // Check for new comments
        const changeDetails = await this.getChangeDetails(changeId);
        const latestCommentDate = this.getLatestCommentDate(changeDetails?.comments || []);
        const prevCommentDate = previousData.changes[changeId].last_comment_date;
        
        if (latestCommentDate && (!prevCommentDate || latestCommentDate > prevCommentDate)) {
          // Find the newest comment
          const sortedComments = (changeDetails?.comments || []).sort((a, b) => {
            return b.creation_date.localeCompare(a.creation_date);
          });
          
          if (sortedComments.length > 0) {
            updatedChanges.push({
              change: change,
              comment: sortedComments[0],
              type: 'new_comment'
            });
          }
          
          previousData.changes[changeId].last_comment_date = latestCommentDate;
        }
      }
    }
    
    // Update the last check time
    previousData.last_check = now;
    await this.savePreviousState(previousData);
    
    return {
      new_incidents: newIncidents,
      updated_incidents: updatedIncidents,
      new_changes: newChanges,
      updated_changes: updatedChanges
    };
  }

  /**
   * Get the latest comment date from a list of comments
   */
  getLatestCommentDate(comments) {
    if (!comments || comments.length === 0) {
      return null;
    }
    
    // Extract dates and find the max
    const dates = comments
      .map(comment => comment.creation_date)
      .filter(date => date);
    
    return dates.length > 0 ? dates.sort().reverse()[0] : null;
  }

  /**
   * Load previous state from file
   */
  async loadPreviousState() {
    try {
      const data = await fs.readFile(LAST_CHECK_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // If file is corrupted or can't be read, start fresh
      return {
        incidents: {},
        changes: {},
        last_check: null
      };
    }
  }

  /**
   * Save state to file
   */
  async savePreviousState(data) {
    await fs.writeFile(LAST_CHECK_FILE, JSON.stringify(data, null, 2));
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format a date string into a more readable format
 */
function formatDate(dateStr) {
  if (!dateStr || dateStr === 'N/A' || dateStr === 'Unknown') {
    return dateStr;
  }
  
  try {
    const date = new Date(dateStr);
    return date.toISOString().replace('T', ' ').slice(0, 19);
  } catch (error) {
    return dateStr;
  }
}

/**
 * Print incidents in a readable format
 */
function printIncidents(incidents) {
  console.log(`\nFound ${incidents.length} incidents assigned to you:`);
  
  if (incidents.length === 0) {
    console.log("No incidents found.");
    return;
  }
  
  for (const incident of incidents) {
    console.log(`\nIncident: ${incident.number || 'N/A'}`);
    console.log(`Subject: ${incident.subject || 'N/A'}`);
    console.log(`Status: ${incident.status || 'N/A'}`);
    console.log(`Category: ${incident.category || 'N/A'}`);
    console.log(`Created: ${formatDate(incident.creation_date || 'N/A')}`);
    
    if (incident.request) {
      console.log(`Request: ${incident.request.substring(0, 100)}...`);
    }
    
    console.log("-".repeat(50));
  }
}

/**
 * Print changes in a readable format
 */
function printChanges(changes) {
  console.log(`\nFound ${changes.length} changes assigned to you:`);
  
  if (changes.length === 0) {
    console.log("No changes found.");
    return;
  }
  
  for (const change of changes) {
    console.log(`\nChange: ${change.number || 'N/A'}`);
    console.log(`Subject: ${change.subject || 'N/A'}`);
    console.log(`Status: ${change.status || 'N/A'}`);
    console.log(`Template: ${change.template || 'N/A'}`);
    console.log(`Created: ${formatDate(change.creation_date || 'N/A')}`);
    
    if (change.brief_description) {
      console.log(`Description: ${change.brief_description.substring(0, 100)}...`);
    }
    
    console.log("-".repeat(50));
  }
}

/**
 * Print comments in a readable format
 */
function printComments(comments) {
  if (!comments || comments.length === 0) {
    console.log("\nNo comments found.");
    return;
  }
  
  console.log(`\nComments (${comments.length}):`);
  
  comments.forEach((comment, i) => {
    const creator = comment.creator?.name || 'Unknown';
    const date = formatDate(comment.creation_date || 'N/A');
    const text = comment.text || 'N/A';
    
    console.log(`[${i + 1}] ${date} - ${creator}`);
    console.log(`${text}`);
    console.log("-".repeat(40));
  });
}

/**
 * Print updates in a readable format
 */
function printUpdates(updates) {
  // Count total updates
  const totalUpdates = 
    updates.new_incidents.length + 
    updates.updated_incidents.length +
    updates.new_changes.length + 
    updates.updated_changes.length;
  
  if (totalUpdates === 0) {
    console.log("\nNo new updates found.");
    return;
  }
  
  console.log(`\nFound ${totalUpdates} updates in TOPdesk:`);
  
  // Print new incidents
  if (updates.new_incidents.length > 0) {
    console.log("\n=== New Incidents ===");
    updates.new_incidents.forEach(incident => {
      console.log(`[${incident.number || 'N/A'}] ${incident.subject || 'N/A'}`);
      console.log(`Status: ${incident.status || 'N/A'}`);
      console.log("-".repeat(40));
    });
  }
  
  // Print updated incidents - status changes
  const statusChanges = updates.updated_incidents.filter(u => u.type === 'status_change');
  if (statusChanges.length > 0) {
    console.log("\n=== Status Changes ===");
    statusChanges.forEach(update => {
      const incident = update.incident;
      console.log(`[${incident.number || 'N/A'}] ${incident.subject || 'N/A'}`);
      console.log(`Status changed: ${update.old_status} → ${update.new_status}`);
      console.log("-".repeat(40));
    });
  }
  
  // Print updated incidents - new comments
  const commentUpdates = updates.updated_incidents.filter(u => u.type === 'new_comment');
  if (commentUpdates.length > 0) {
    console.log("\n=== New Comments on Incidents ===");
    commentUpdates.forEach(update => {
      const incident = update.incident;
      const comment = update.comment;
      console.log(`[${incident.number || 'N/A'}] ${incident.subject || 'N/A'}`);
      const creator = comment.creator?.name || 'Unknown';
      const date = formatDate(comment.creation_date || '');
      console.log(`Comment by ${creator} on ${date}:`);
      const text = comment.text || 'N/A';
      console.log(text.length > 100 ? `${text.substring(0, 100)}...` : text);
      console.log("-".repeat(40));
    });
  }
  
  // Print new changes
  if (updates.new_changes.length > 0) {
    console.log("\n=== New Changes ===");
    updates.new_changes.forEach(change => {
      console.log(`[${change.number || 'N/A'}] ${change.subject || 'N/A'}`);
      console.log(`Status: ${change.status || 'N/A'}`);
      console.log("-".repeat(40));
    });
  }
  
  // Print updated changes - status changes
  const changeStatusChanges = updates.updated_changes.filter(u => u.type === 'status_change');
  if (changeStatusChanges.length > 0) {
    console.log("\n=== Change Status Updates ===");
    changeStatusChanges.forEach(update => {
      const change = update.change;
      console.log(`[${change.number || 'N/A'}] ${change.subject || 'N/A'}`);
      console.log(`Status changed: ${update.old_status} → ${update.new_status}`);
      console.log("-".repeat(40));
    });
  }
  
  // Print updated changes - new comments
  const changeCommentUpdates = updates.updated_changes.filter(u => u.type === 'new_comment');
  if (changeCommentUpdates.length > 0) {
    console.log("\n=== New Comments on Changes ===");
    changeCommentUpdates.forEach(update => {
      const change = update.change;
      const comment = update.comment;
      console.log(`[${change.number || 'N/A'}] ${change.subject || 'N/A'}`);
      const creator = comment.creator?.name || 'Unknown';
      const date = formatDate(comment.creation_date || '');
      console.log(`Comment by ${creator} on ${date}:`);
      const text = comment.text || 'N/A';
      console.log(text.length > 100 ? `${text.substring(0, 100)}...` : text);
      console.log("-".repeat(40));
    });
  }
}

/**
 * Main function to run the tool
 */
async function main() {
  program
    .name('topdesk-client')
    .description('TOPdesk Client Tool (Stagehand Version)')
    .version('1.0.0');
  
  program
    .command('my-incidents')
    .description('Get incidents assigned to you')
    .option('--headless', 'Run in headless mode (no browser UI)', false)
    .action(async (options) => {
      const client = new TopdeskBrowser({ headless: options.headless });
      try {
        await client.start();
        const incidents = await client.getMyIncidents();
        printIncidents(incidents);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        await client.close();
      }
    });
  
  program
    .command('my-changes')
    .description('Get changes assigned to you')
    .option('--headless', 'Run in headless mode (no browser UI)', false)
    .action(async (options) => {
      const client = new TopdeskBrowser({ headless: options.headless });
      try {
        await client.start();
        const changes = await client.getMyChanges();
        printChanges(changes);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        await client.close();
      }
    });
  
  program
    .command('incident-details <id>')
    .description('Get details of a specific incident')
    .option('--headless', 'Run in headless mode (no browser UI)', false)
    .action(async (id, options) => {
      const client = new TopdeskBrowser({ headless: options.headless });
      try {
        await client.start();
        const incident = await client.getIncidentDetails(id);
        if (incident) {
          console.log(`\nIncident: ${incident.number || 'N/A'}`);
          console.log(`Subject: ${incident.subject || 'N/A'}`);
          console.log(`Status: ${incident.status || 'N/A'}`);
          console.log(`Caller: ${incident.caller || 'N/A'}`);
          console.log(`Category: ${incident.category || 'N/A'}`);
          console.log(`Priority: ${incident.priority || 'N/A'}`);
          console.log(`Operator: ${incident.operator || 'N/A'}`);
          console.log(`Created: ${formatDate(incident.creation_date || 'N/A')}`);
          
          if (incident.request) {
            console.log(`\nRequest:`);
            console.log(incident.request);
          }
          
          printComments(incident.comments || []);
        } else {
          console.log(`No incident found with ID: ${id}`);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        await client.close();
      }
    });
  
  program
    .command('change-details <id>')
    .description('Get details of a specific change')
    .option('--headless', 'Run in headless mode (no browser UI)', false)
    .action(async (id, options) => {
      const client = new TopdeskBrowser({ headless: options.headless });
      try {
        await client.start();
        const change = await client.getChangeDetails(id);
        if (change) {
          console.log(`\nChange: ${change.number || 'N/A'}`);
          console.log(`Subject: ${change.subject || 'N/A'}`);
          console.log(`Status: ${change.status || 'N/A'}`);
          console.log(`Template: ${change.template || 'N/A'}`);
          console.log(`Requester: ${change.requester || 'N/A'}`);
          console.log(`Manager: ${change.manager || 'N/A'}`);
          console.log(`Created: ${formatDate(change.creation_date || 'N/A')}`);
          
          if (change.brief_description) {
            console.log(`\nDescription:`);
            console.log(change.brief_description);
          }
          
          printComments(change.comments || []);
        } else {
          console.log(`No change found with ID: ${id}`);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        await client.close();
      }
    });
  
  program
    .command('check-updates')
    .description('Check for new or updated incidents and changes')
    .option('--headless', 'Run in headless mode (no browser UI)', false)
    .action(async (options) => {
      const client = new TopdeskBrowser({ headless: options.headless });
      try {
        await client.start();
        const updates = await client.checkForUpdates();
        printUpdates(updates);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        await client.close();
      }
    });
  
  // Parse arguments and execute commands
  await program.parseAsync(process.argv);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
}

module.exports = {
  TopdeskBrowser
};