#!/usr/bin/env python3
"""
Import Manual JSON Data to PostgreSQL
"""

import json
import psycopg2
import os

# Configuration
DB_HOST = "100.107.228.60"
DB_NAME = "hyrox_app_db"
DB_USER = "hyrox_admin"
DB_PASS = "hyrox_secure_pass"

def import_athlete_profile(cursor):
    print("Importing Athlete Profile...")
    with open(".tmp/manual_import_athlete.json", "r") as f:
        data = json.load(f)
        
    for item in data:
        # Note: 'property_' prefix is from user provided JSON keys
        main_goal = item.get("property_objectif_principal")
        secondary_goal = item.get("property_objectif_secondaire")
        weekly_volume = item.get("property_volume_hebdo_cible_min_100")
        constraints = item.get("property_contraintes")
        availability = item.get("property_disponibilit_s_semaine")
        equipment = item.get("property_mat_riel_disponible_lyon")
        perfs = item.get("property_mes_perfs_actuelles")
        
        cursor.execute("""
            INSERT INTO athlete_profile 
            (main_goal, secondary_goal, weekly_volume_target, constraints, availability_text, equipment_text, performance_text)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (main_goal, secondary_goal, weekly_volume, constraints, availability, equipment, perfs))
        
    print(f"Imported {len(data)} athlete profiles.")

def import_workout_types(cursor):
    print("Importing Workout Types...")
    with open(".tmp/manual_import_workouts.json", "r") as f:
        data = json.load(f)
        
    for item in data:
        name = item.get("name")
        description = item.get("property_description")
        intensity = item.get("property_intensit")
        category = item.get("property_cat_gorie")
        physio_objs = item.get("property_objectif_physiologique")
        duration = item.get("property_dur_e_typique_record")
        distance = item.get("property_distance_typique_km")
        
        # Ensure intensity is int or None
        if intensity == "": intensity = None
        
        cursor.execute("""
            INSERT INTO workout_library
            (name, description, intensity, category, physiological_objectives, typical_duration, typical_distance)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (name, description, intensity, category, physio_objs, duration, distance))

    print(f"Imported {len(data)} workout templates.")

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
        
        import_athlete_profile(cursor)
        import_workout_types(cursor)
        
        conn.close()
        print("Manual Import complete!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
