#!/usr/bin/env python3
"""
Explore Notion Databases
Lists all accessible databases and their properties to help with mapping.
"""

import os
import json
from notion_client import Client

# API Key provided by user
NOTION_TOKEN = "ntn_j19050474307JT5jau3vvSYWdrIpgGvqkp0Myzw35FwdCf"

def main():
    notion = Client(auth=NOTION_TOKEN)
    
    print("Searching for databases...")
    # Search all objects and filter in Python to avoid API version issues
    response = notion.search()
    
    databases = []
    
    for result in response["results"]:
        if result["object"] != "database":
            continue
            
        db_info = {
            "id": result["id"],
            "title": result["title"][0]["plain_text"] if result["title"] else "Untitled",
            "properties": list(result["properties"].keys())
        }
        databases.append(db_info)
        
        print(f"\n=== Database: {db_info['title']} ({db_info['id']}) ===")
        print("Properties:")
        for prop_name, prop_data in result["properties"].items():
            print(f"  - {prop_name}: {prop_data['type']}")

    # Save schema for analysis
    with open(".tmp/notion_schemas.json", "w") as f:
        json.dump(response["results"], f, indent=2)
    
    print(f"\nFound {len(databases)} databases. Schema saved to .tmp/notion_schemas.json")

if __name__ == "__main__":
    main()
