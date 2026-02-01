#!/usr/bin/env python3
"""
Analyze Notion Dump
Parses .tmp/notion_schemas.json to extract database schemas.
"""

import json
import os

def main():
    with open(".tmp/notion_schemas.json", "r") as f:
        results = json.load(f)

    databases = {}
    
    # helper to process properties
    def process_properties(props):
        schema = {}
        for name, data in props.items():
            schema[name] = data["type"]
        return schema

    for item in results:
        # Check for direct database/datasource objects
        if item["object"] in ["database", "data_source"]:
            db_id = item["id"]
            title_obj = item.get("title", [])
            title = title_obj[0]["plain_text"] if title_obj else "Untitled"
            
            # Update/Overwite if exists (prefer direct object)
            databases[db_id] = {
                "title": title,
                "type": item["object"],
                "properties": process_properties(item.get("properties", {}))
            }
            
        # Check pages to find parent databases we might have missed
        elif item["object"] == "page":
            parent = item.get("parent", {})
            if parent.get("type") in ["database_id", "data_source_id"]:
                db_id = parent.get("database_id") or parent.get("data_source_id")
                # We can't get the title easily from child, but we can register ID
                if db_id and db_id not in databases:
                     databases[db_id] = {
                         "title": "Unknown (Inferred from Pages)",
                         "type": "inferred",
                         "properties": process_properties(item.get("properties", {}))
                     }

    print(f"Found {len(databases)} databases:")
    for db_id, info in databases.items():
        print(f"\nID: {db_id}")
        print(f"Title: {info['title']}")
        print(f"Type: {info['type']}")
        print("Properties:")
        for prop, ptype in info["properties"].items():
             print(f"  - {prop}: {ptype}")

if __name__ == "__main__":
    main()
