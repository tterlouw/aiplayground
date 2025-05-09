#!/usr/bin/env python
"""
TOPdesk Client Tool

This script provides functionality to retrieve information from TOPdesk,
such as incidents and changes assigned to the authenticated user,
along with their status and latest comments.

Usage:
    python topdesk_client.py [command] [options]

Commands:
    setup: Configure your TOPdesk credentials
    my-incidents: Get incidents assigned to you
    my-changes: Get changes assigned to you
    incident-details [id]: Get details of a specific incident
    change-details [id]: Get details of a specific change
    check-updates: Check for new or updated incidents and changes
    summary: View a summary of all tracked incidents and changes
"""

import os
import sys
import json
import argparse
import datetime
import requests
import configparser
from typing import Dict, List, Any, Optional
from urllib.parse import urljoin
from requests.auth import HTTPBasicAuth

# Import the tracking utilities
from topdesk_utils import TopdeskTracker, print_activity_report, print_summary_report, format_date


class TopdeskClient:
    """Client for interacting with TOPdesk API"""

    def __init__(self, config_path: str = "config.ini"):
        """Initialize the TOPdesk client with credentials from config file"""
        self.config = configparser.ConfigParser()
        if not os.path.exists(config_path):
            print(f"Error: Config file '{config_path}' not found.")
            print("Run 'python topdesk_client.py setup' to create a config file.")
            sys.exit(1)
        
        self.config.read(config_path)
        self.url = self.config.get('Topdesk', 'url', fallback=None)
        self.username = self.config.get('Topdesk', 'username', fallback=None)
        self.password = self.config.get('Topdesk', 'password', fallback=None)
        self.api_key = self.config.get('Topdesk', 'api_key', fallback=None)
        
        if not self.url:
            print("Error: TOPdesk URL not configured")
            sys.exit(1)
            
        self.session = requests.Session()
        self._configure_auth()
        self.session.headers.update({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })

    def _configure_auth(self):
        """Configure authentication for requests"""
        if self.api_key:
            # API key authentication
            self.session.headers.update({
                'Authorization': f'Bearer {self.api_key}'
            })
        elif self.username and self.password:
            # Basic authentication
            self.session.auth = HTTPBasicAuth(self.username, self.password)
        else:
            print("Error: No valid authentication method configured")
            print("Please set up either username/password or API key in config.ini")
            sys.exit(1)

    def get_my_incidents(self) -> List[Dict[str, Any]]:
        """Get incidents assigned to the current user"""
        # Updated to use the correct TOPdesk API endpoint
        endpoint = "/tas/api/incidents"
        params = {
            "operator": "me",
            "status": "open",
            "page_size": 10,  # Limit to 10 most recent incidents
            "sort": "-creation_date"  # Sort by creation date descending
        }
        return self._make_request("GET", endpoint, params=params)

    def get_my_changes(self) -> List[Dict[str, Any]]:
        """Get changes assigned to the current user"""
        # Updated to use the correct TOPdesk API endpoint
        endpoint = "/tas/api/operatorchanges"
        params = {
            "operator": "me",
            "page_size": 10,  # Limit to 10 most recent changes
            "sort": "-creation_date"  # Sort by creation date descending
        }
        return self._make_request("GET", endpoint, params=params)

    def get_incident_details(self, incident_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific incident"""
        # Updated to use the correct TOPdesk API endpoint
        endpoint = f"/tas/api/incidents/{incident_id}"
        return self._make_request("GET", endpoint)

    def get_change_details(self, change_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific change"""
        # Updated to use the correct TOPdesk API endpoint
        endpoint = f"/tas/api/operatorchanges/{change_id}"
        return self._make_request("GET", endpoint)

    def get_comments(self, object_id: str, object_type: str) -> List[Dict[str, Any]]:
        """Get comments for an incident or change"""
        # Updated to use the correct TOPdesk API endpoint
        if object_type == "incident":
            endpoint = f"/tas/api/incidents/{object_id}/comments"
        else:  # change
            endpoint = f"/tas/api/operatorchanges/{object_id}/comments"
        
        return self._make_request("GET", endpoint)

    def _make_request(self, method: str, endpoint: str, params: Dict = None, data: Dict = None) -> Any:
        """Make request to TOPdesk API"""
        url = urljoin(self.url, endpoint)
        
        try:
            if method == "GET":
                response = self.session.get(url, params=params)
            elif method == "POST":
                response = self.session.post(url, json=data)
            elif method == "PUT":
                response = self.session.put(url, json=data)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()  # Raise exception for non-200 responses
            
            if response.text:
                return response.json()
            return None
            
        except requests.exceptions.HTTPError as e:
            print(f"HTTP Error: {e}")
            if response.text:
                print(f"Response: {response.text}")
            sys.exit(1)
        except requests.exceptions.ConnectionError:
            print(f"Error: Could not connect to {self.url}")
            sys.exit(1)
        except requests.exceptions.Timeout:
            print(f"Error: Request to {self.url} timed out")
            sys.exit(1)
        except requests.exceptions.RequestException as e:
            print(f"Error: {e}")
            sys.exit(1)
        except json.JSONDecodeError:
            print("Error: Could not parse response as JSON")
            print(f"Response: {response.text}")
            sys.exit(1)


def setup_config():
    """Set up the configuration file with TOPdesk credentials"""
    config = configparser.ConfigParser()
    
    print("TOPdesk Client Configuration Setup")
    print("==================================")
    print("Please provide your TOPdesk credentials.")
    
    url = input("TOPdesk URL [https://support.macaw.nl]: ") or "https://support.macaw.nl"
    
    auth_method = input("Authentication method (1 for username/password, 2 for API key) [1]: ") or "1"
    
    config['Topdesk'] = {
        'url': url
    }
    
    if auth_method == "1":
        username = input("Username: ")
        password = input("Password: ")
        config['Topdesk']['username'] = username
        config['Topdesk']['password'] = password
    else:
        api_key = input("API Key: ")
        config['Topdesk']['api_key'] = api_key
    
    with open("config.ini", "w") as config_file:
        config.write(config_file)
    
    print("Configuration saved to config.ini")
    print("Note: Your credentials are stored in plain text. Keep this file secure.")


def display_incident(incident: Dict[str, Any]):
    """Display incident information in a readable format"""
    print(f"Incident: {incident.get('number', 'N/A')}")  # Updated to use 'number' field
    print(f"Subject: {incident.get('subject', 'N/A')}")
    print(f"Status: {incident.get('status', {}).get('name', 'N/A')}")
    print(f"Created: {format_date(incident.get('creation_date', 'N/A'))}")
    print(f"Category: {incident.get('category', {}).get('name', 'N/A')}")
    print(f"Priority: {incident.get('priority', {}).get('name', 'N/A')}")
    print(f"Request: {incident.get('request', 'N/A')[:100]}...")
    print("-" * 50)


def display_change(change: Dict[str, Any]):
    """Display change information in a readable format"""
    print(f"Change: {change.get('number', 'N/A')}")  # Updated to use 'number' field
    print(f"Subject: {change.get('subject', 'N/A')}")
    print(f"Status: {change.get('status', {}).get('name', 'N/A')}")
    print(f"Template: {change.get('template', {}).get('name', 'N/A')}")
    print(f"Created: {format_date(change.get('creation_date', 'N/A'))}")
    print(f"Brief Description: {change.get('brief_description', 'N/A')}")
    print("-" * 50)


def display_comments(comments: List[Dict[str, Any]]):
    """Display comments in a readable format"""
    if not comments:
        print("No comments found.")
        return
        
    print(f"Comments ({len(comments)}):")
    for i, comment in enumerate(comments, 1):
        print(f"[{i}] {format_date(comment.get('creation_date', 'N/A'))} - {comment.get('creator', {}).get('name', 'Unknown')}")
        print(comment.get('text', 'N/A'))
        print("-" * 40)


def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description="TOPdesk Client Tool")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Setup command
    subparsers.add_parser("setup", help="Set up configuration")
    
    # My incidents command
    subparsers.add_parser("my-incidents", help="Get incidents assigned to you")
    
    # My changes command
    subparsers.add_parser("my-changes", help="Get changes assigned to you")
    
    # Incident details command
    incident_parser = subparsers.add_parser("incident-details", help="Get details of a specific incident")
    incident_parser.add_argument("id", help="Incident ID")
    
    # Change details command
    change_parser = subparsers.add_parser("change-details", help="Get details of a specific change")
    change_parser.add_argument("id", help="Change ID")
    
    # New tracking commands
    subparsers.add_parser("check-updates", help="Check for new or updated incidents and changes")
    subparsers.add_parser("summary", help="View a summary of all tracked incidents and changes")
    
    args = parser.parse_args()
    
    if args.command == "setup":
        setup_config()
        return
    
    if not args.command:
        parser.print_help()
        return
    
    client = TopdeskClient()
    
    if args.command == "my-incidents":
        incidents = client.get_my_incidents()
        print(f"Found {len(incidents)} incidents assigned to you:")
        for incident in incidents:
            display_incident(incident)
    
    elif args.command == "my-changes":
        changes = client.get_my_changes()
        print(f"Found {len(changes)} changes assigned to you:")
        for change in changes:
            display_change(change)
    
    elif args.command == "incident-details":
        incident = client.get_incident_details(args.id)
        display_incident(incident)
        comments = client.get_comments(args.id, "incident")
        display_comments(comments)
    
    elif args.command == "change-details":
        change = client.get_change_details(args.id)
        display_change(change)
        comments = client.get_comments(args.id, "change")
        display_comments(comments)
        
    elif args.command == "check-updates":
        # Initialize the tracker and check for updates
        tracker = TopdeskTracker(client)
        activities = tracker.get_new_activities()
        
        # Count total updates
        total_updates = (
            len(activities["new_incidents"]) + 
            len(activities["updated_incidents"]) +
            len(activities["new_changes"]) + 
            len(activities["updated_changes"])
        )
        
        if total_updates == 0:
            print("No new updates found.")
        else:
            print(f"Found {total_updates} updates in TOPdesk.")
            print_activity_report(activities)

    elif args.command == "summary":
        # Initialize the tracker and get a summary report
        tracker = TopdeskTracker(client)
        report = tracker.get_summary_report()
        print_summary_report(report)


if __name__ == "__main__":
    main()