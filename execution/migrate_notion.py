#!/usr/bin/env python3
"""
Migrate Notion Data to PostgreSQL (Search & Filter Strategy)
"""

import os
import psycopg2
from notion_client import Client

# Configuration
NOTION_TOKEN = "ntn_j19050474307JT5jau3vvSYWdrIpgGvqkp0Myzw35FwdCf"
DB_HOST = "100.107.228.60" 
DB_NAME = "hyrox_app_db"
DB_USER = "hyrox_admin"
DB_PASS = "hyrox_secure_pass"

# Target IDs (Data Sources)
ID_ATHLETE_PARAMS = "2bd0718c-b786-80f3-9338-000b3962e6b9"
ID_WORKOUT_TYPES = "2bd0718c-b786-8012-8d0f-000b8e98b445"
ID_SEANCES = "2bd0718c-b786-8072-8f48-000bb5c4fa23" # Optional: if we want to migrate sessions

def get_text(prop):
    if not prop: return None
    if prop["type"] == "title":
        return "".join([t["plain_text"] for t in prop["title"]])
    if prop["type"] == "rich_text":
        return "".join([t["plain_text"] for t in prop["rich_text"]])
    return None

def get_number(prop):
    if not prop or "number" not in prop: return None
    return prop["number"]

def get_select(prop):
    if not prop or "select" not in prop or not prop["select"]: return None
    return prop["select"]["name"]

def get_multi_select(prop):
    if not prop or "multi_select" not in prop: return []
    return [opt["name"] for opt in prop["multi_select"]]

def insert_athlete_profile(cursor, props):
    main_goal = get_text(props.get("Objectif principal")) # Title? No, Title is usually "Name"
    # In "Paramètres Athlète", title property is "Objectif principal" based on dump analysis?
    # Dump analysis: "Objectif principal: title". Correct.
    
    secondary_goal = get_text(props.get("Objectif secondaire"))
    weekly_volume = get_number(props.get("Volume hebdo cible (min) +/- 100"))
    constraints = get_text(props.get("Contraintes"))
    availability = get_text(props.get("Disponibilités semaine"))
    equipment = get_text(props.get("Matériel disponible – Lyon"))
    perfs = get_text(props.get("Mes perfs actuelles "))
    
    cursor.execute("""
        INSERT INTO athlete_profile 
        (main_goal, secondary_goal, weekly_volume_target, constraints, availability_text, equipment_text, performance_text)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (main_goal, secondary_goal, weekly_volume, constraints, availability, equipment, perfs))

def insert_workout_type(cursor, props):
    name = get_text(props.get("Nom")) # Title
    description = get_text(props.get("Description"))
    intensity = get_number(props.get("Intensité"))
    category = get_select(props.get("Catégorie"))
    physio_objs = get_multi_select(props.get("Objectif physiologique"))
    duration = get_text(props.get("Durée typique/record"))
    distance = get_number(props.get("Distance typique (km)"))
    
    cursor.execute("""
        INSERT INTO workout_library
        (name, description, intensity, category, physiological_objectives, typical_duration, typical_distance)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (name, description, intensity, category, physio_objs, duration, distance))

def main():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        notion = Client(auth=NOTION_TOKEN)
        
        print("Searching Notion pages...")
        # Search all, filtering later
        results = []
        has_more = True
        next_cursor = None
        
        while has_more:
            response = notion.search(start_cursor=next_cursor)
            results.extend(response["results"])
            has_more = response["has_more"]
            next_cursor = response["next_cursor"]
            print(f"Fetched {len(results)} items...")

        counts = {"athlete": 0, "workout": 0, "other": 0}

        for item in results:
            if item["object"] != "page": continue
            
            parent = item.get("parent", {})
            # Check both database_id and data_source_id
            pid = parent.get("database_id") or parent.get("data_source_id")
            
            if pid == ID_ATHLETE_PARAMS:
                insert_athlete_profile(cursor, item["properties"])
                counts["athlete"] += 1
            elif pid == ID_WORKOUT_TYPES:
                insert_workout_type(cursor, item["properties"])
                counts["workout"] += 1
            else:
                if counts["other"] < 5: # Print first 5
                     print(f"Skipped item with parent: {parent}")
                counts["other"] += 1
        
        conn.close()
        print(f"Migration complete!")
        print(f"Athlete Profiles: {counts['athlete']}")
        print(f"Workout Types: {counts['workout']}")
        print(f"Others skipped: {counts['other']}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
