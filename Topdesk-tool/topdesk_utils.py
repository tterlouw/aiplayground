#!/usr/bin/env python
"""
TOPdesk Utilities

Additional functionality for working with the TOPdesk API,
focused on tracking and monitoring activities.
"""

import datetime
import os
import json
from typing import Dict, List, Any, Optional
from dateutil.parser import parse as parse_date


class TopdeskTracker:
    """Tools for tracking TOPdesk items over time"""
    
    def __init__(self, client, cache_file="topdesk_cache.json"):
        """Initialize the tracker with a TOPdesk client"""
        self.client = client
        self.cache_file = cache_file
        self.cache = self._load_cache()
        
    def _load_cache(self):
        """Load cached data from file if available"""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                # If file is corrupted or can't be read, start fresh
                return {"incidents": {}, "changes": {}, "last_check": None}
        else:
            return {"incidents": {}, "changes": {}, "last_check": None}
            
    def _save_cache(self):
        """Save cache data to file"""
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)

    def get_new_activities(self):
        """Get new activities since last check for incidents and changes"""
        # Get current time for this check
        now = datetime.datetime.now().isoformat()
        last_check = self.cache.get("last_check")
        
        # Get latest incidents and changes
        my_incidents = self.client.get_my_incidents()
        my_changes = self.client.get_my_changes()
        
        # Track new or updated items
        new_incidents = []
        updated_incidents = []
        new_changes = []
        updated_changes = []
        
        # Process incidents
        for incident in my_incidents:
            incident_id = incident.get('id', '')
            if incident_id:
                # Check if this is a new incident
                if incident_id not in self.cache["incidents"]:
                    new_incidents.append(incident)
                    self.cache["incidents"][incident_id] = {
                        "last_status": incident.get("status", {}).get("name", "Unknown"),
                        "last_comment_date": None
                    }
                else:
                    # Check if status has changed
                    current_status = incident.get("status", {}).get("name", "Unknown")
                    if current_status != self.cache["incidents"][incident_id]["last_status"]:
                        updated_incidents.append({
                            "incident": incident,
                            "old_status": self.cache["incidents"][incident_id]["last_status"],
                            "new_status": current_status,
                            "type": "status_change"
                        })
                        self.cache["incidents"][incident_id]["last_status"] = current_status
                
                # Check for new comments
                comments = self.client.get_comments(incident_id, "incident")
                if comments:
                    latest_comment = comments[0]  # Comments are usually returned newest first
                    latest_date = latest_comment.get("creation_date")
                    
                    if latest_date:
                        cached_last_comment = self.cache["incidents"][incident_id]["last_comment_date"]
                        
                        # If we have no cached comment date or this one is newer
                        if not cached_last_comment or latest_date > cached_last_comment:
                            updated_incidents.append({
                                "incident": incident,
                                "comment": latest_comment,
                                "type": "new_comment"
                            })
                            self.cache["incidents"][incident_id]["last_comment_date"] = latest_date
                            

        # Process changes (similar logic to incidents)
        for change in my_changes:
            change_id = change.get('id', '')
            if change_id:
                # Check if this is a new change
                if change_id not in self.cache["changes"]:
                    new_changes.append(change)
                    self.cache["changes"][change_id] = {
                        "last_status": change.get("status", {}).get("name", "Unknown"),
                        "last_comment_date": None
                    }
                else:
                    # Check if status has changed
                    current_status = change.get("status", {}).get("name", "Unknown")
                    if current_status != self.cache["changes"][change_id]["last_status"]:
                        updated_changes.append({
                            "change": change,
                            "old_status": self.cache["changes"][change_id]["last_status"],
                            "new_status": current_status,
                            "type": "status_change"
                        })
                        self.cache["changes"][change_id]["last_status"] = current_status
                        
                # Check for new comments
                comments = self.client.get_comments(change_id, "change")
                if comments:
                    latest_comment = comments[0]  # Comments are usually returned newest first
                    latest_date = latest_comment.get("creation_date")
                    
                    if latest_date:
                        cached_last_comment = self.cache["changes"][change_id]["last_comment_date"]
                        
                        # If we have no cached comment date or this one is newer
                        if not cached_last_comment or latest_date > cached_last_comment:
                            updated_changes.append({
                                "change": change,
                                "comment": latest_comment,
                                "type": "new_comment"
                            })
                            self.cache["changes"][change_id]["last_comment_date"] = latest_date
        
        # Update last check time
        self.cache["last_check"] = now
        self._save_cache()
        
        return {
            "new_incidents": new_incidents,
            "updated_incidents": updated_incidents,
            "new_changes": new_changes,
            "updated_changes": updated_changes
        }
        
    def get_summary_report(self):
        """Generate a summary report of all tracked incidents and changes"""
        incidents = []
        changes = []
        
        # Get detailed information about each tracked incident
        for incident_id in self.cache["incidents"]:
            try:
                incident_details = self.client.get_incident_details(incident_id)
                if incident_details:
                    incidents.append({
                        "id": incident_id,
                        "number": incident_details.get("number", "N/A"),
                        "subject": incident_details.get("subject", "N/A"),
                        "status": incident_details.get("status", {}).get("name", "Unknown"),
                        "last_updated": incident_details.get("modification_date", "Unknown"),
                        "priority": incident_details.get("priority", {}).get("name", "Unknown"),
                    })
            except Exception:
                # If we can't get details, add minimal information
                incidents.append({
                    "id": incident_id,
                    "status": self.cache["incidents"][incident_id]["last_status"],
                    "error": "Could not retrieve complete details"
                })
                
        # Get detailed information about each tracked change
        for change_id in self.cache["changes"]:
            try:
                change_details = self.client.get_change_details(change_id)
                if change_details:
                    changes.append({
                        "id": change_id,
                        "number": change_details.get("number", "N/A"),
                        "subject": change_details.get("subject", "N/A"),
                        "status": change_details.get("status", {}).get("name", "Unknown"),
                        "last_updated": change_details.get("modification_date", "Unknown"),
                    })
            except Exception:
                # If we can't get details, add minimal information
                changes.append({
                    "id": change_id,
                    "status": self.cache["changes"][change_id]["last_status"],
                    "error": "Could not retrieve complete details"
                })
                
        return {
            "incidents": sorted(incidents, key=lambda x: x.get("last_updated", ""), reverse=True),
            "changes": sorted(changes, key=lambda x: x.get("last_updated", ""), reverse=True),
            "last_check": self.cache.get("last_check", "Never")
        }


def format_date(date_string, format_str="%Y-%m-%d %H:%M:%S"):
    """Format a date string from TOPdesk API into a readable format"""
    if not date_string:
        return "Unknown"
    try:
        dt = parse_date(date_string)
        return dt.strftime(format_str)
    except (ValueError, TypeError):
        return date_string


def print_activity_report(activities):
    """Print a formatted report of activities"""
    # Print new incidents
    if activities["new_incidents"]:
        print("\n=== New Incidents ===")
        for incident in activities["new_incidents"]:
            print(f"[{incident.get('number', 'N/A')}] {incident.get('subject', 'N/A')}")
            print(f"Status: {incident.get('status', {}).get('name', 'Unknown')}")
            print("-" * 40)
    
    # Print updated incidents - status changes
    status_changes = [u for u in activities["updated_incidents"] if u["type"] == "status_change"]
    if status_changes:
        print("\n=== Status Changes ===")
        for update in status_changes:
            incident = update["incident"]
            print(f"[{incident.get('number', 'N/A')}] {incident.get('subject', 'N/A')}")
            print(f"Status changed: {update['old_status']} → {update['new_status']}")
            print("-" * 40)
    
    # Print updated incidents - new comments
    comment_updates = [u for u in activities["updated_incidents"] if u["type"] == "new_comment"]
    if comment_updates:
        print("\n=== New Comments on Incidents ===")
        for update in comment_updates:
            incident = update["incident"]
            comment = update["comment"]
            print(f"[{incident.get('number', 'N/A')}] {incident.get('subject', 'N/A')}")
            print(f"Comment by {comment.get('creator', {}).get('name', 'Unknown')} on {format_date(comment.get('creation_date', ''))}:")
            print(f"{comment.get('text', 'N/A')[:100]}...")
            print("-" * 40)
    
    # Print changes in similar fashion
    if activities["new_changes"]:
        print("\n=== New Changes ===")
        for change in activities["new_changes"]:
            print(f"[{change.get('number', 'N/A')}] {change.get('subject', 'N/A')}")
            print(f"Status: {change.get('status', {}).get('name', 'Unknown')}")
            print("-" * 40)
    
    # Print updated changes - status changes
    status_changes = [u for u in activities["updated_changes"] if u["type"] == "status_change"]
    if status_changes:
        print("\n=== Change Status Updates ===")
        for update in status_changes:
            change = update["change"]
            print(f"[{change.get('number', 'N/A')}] {change.get('subject', 'N/A')}")
            print(f"Status changed: {update['old_status']} → {update['new_status']}")
            print("-" * 40)
    
    # Print updated changes - new comments
    comment_updates = [u for u in activities["updated_changes"] if u["type"] == "new_comment"]
    if comment_updates:
        print("\n=== New Comments on Changes ===")
        for update in comment_updates:
            change = update["change"]
            comment = update["comment"]
            print(f"[{change.get('number', 'N/A')}] {change.get('subject', 'N/A')}")
            print(f"Comment by {comment.get('creator', {}).get('name', 'Unknown')} on {format_date(comment.get('creation_date', ''))}:")
            print(f"{comment.get('text', 'N/A')[:100]}...")
            print("-" * 40)


def print_summary_report(report):
    """Print a summary report of all tracked incidents and changes"""
    print("\n====== TOPdesk Summary Report ======")
    print(f"Last checked: {format_date(report['last_check'])}\n")
    
    # Print incidents
    print(f"=== Incidents ({len(report['incidents'])}) ===")
    if report["incidents"]:
        for incident in report["incidents"]:
            if "error" in incident:
                print(f"[{incident.get('id', 'Unknown')}] ERROR: {incident['error']}")
                continue
                
            print(f"[{incident['number']}] {incident['subject']}")
            print(f"Status: {incident['status']} | Priority: {incident.get('priority', 'N/A')}")
            print(f"Last updated: {format_date(incident.get('last_updated', ''))}")
            print("-" * 40)
    else:
        print("No incidents found.")
    
    # Print changes
    print(f"\n=== Changes ({len(report['changes'])}) ===")
    if report["changes"]:
        for change in report["changes"]:
            if "error" in change:
                print(f"[{change.get('id', 'Unknown')}] ERROR: {change['error']}")
                continue
                
            print(f"[{change['number']}] {change['subject']}")
            print(f"Status: {change['status']}")
            print(f"Last updated: {format_date(change.get('last_updated', ''))}")
            print("-" * 40)
    else:
        print("No changes found.")