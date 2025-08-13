# add_taxi_rank.py
import psycopg2
from psycopg2.extras import Json

# Database connection info
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "taxipoint_db"
DB_USER = "postgres"
DB_PASSWORD = "admin"

def add_taxi_rank():
    # Connect to the database
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cursor = conn.cursor()

    # Taxi rank data
    taxi_rank = {
        "name": "Central Rank",
        "description": "Busy central taxi rank in Johannesburg",
        "address": "Main Street 123",
        "latitude": -26.2041,
        "longitude": 28.0473,
        "district": "Johannesburg",
        "routes_served": ["Route1", "Route2", "Route3"],
        "hours": {"Mon-Fri": "6am-10pm", "Sat-Sun": "7am-9pm"},
        "phone": "0123456789",
        "facilities": {"wifi": True, "restrooms": True, "parking": False}
    }

    # Insert statement (ID is auto-generated)
    insert_query = """
    INSERT INTO taxi_ranks 
    (name, description, address, latitude, longitude, district, routes_served, hours, phone, facilities)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING id;
    """

    # Execute the query
    cursor.execute(insert_query, (
        taxi_rank["name"],
        taxi_rank["description"],
        taxi_rank["address"],
        taxi_rank["latitude"],
        taxi_rank["longitude"],
        taxi_rank["district"],
        Json(taxi_rank["routes_served"]),
        Json(taxi_rank["hours"]),
        taxi_rank["phone"],
        Json(taxi_rank["facilities"])
    ))

    # Fetch the auto-generated ID
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    print(f"Taxi rank added successfully with ID: {new_id}")

if __name__ == "__main__":
    add_taxi_rank()
