import psycopg2
import psycopg2.extras
import os
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv("server/.env")
load_dotenv(".env")

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "dpg-d7g3k0hf9bms73am9a90-a.singapore-postgres.render.com"),
    "user":     os.getenv("DB_USER", "waste2worth_user"),
    "password": os.getenv("DB_PASSWORD", "GRSu9jyus6DB6HPCEHFZLeeeru7qAUBD"),
    "dbname":   os.getenv("DB_NAME", "waste2worth"),
    "port":     int(os.getenv("DB_PORT", 5432)),
    "sslmode":  "require",
}

def seed():
    print("--- SEEDING POSTGRESQL WITH REAL-WORLD DATA ---")
    try:
        db = psycopg2.connect(**DB_CONFIG)
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # ─── Step 1: Create Tables ──────────────────────────────
        print("[1/5] Creating tables...")
        cursor.execute(open(os.path.join(os.path.dirname(__file__), "..", "postgres_setup.sql"), "r").read())
        db.commit()
        print("      Tables ready.")

        # ─── Step 2: Get user IDs ───────────────────────────────
        cursor.execute("SELECT id FROM users WHERE role = 'hotel'")
        hotel_ids = [row['id'] for row in cursor.fetchall()]
        
        cursor.execute("SELECT id FROM users WHERE role = 'ngo'")
        ngo_ids = [row['id'] for row in cursor.fetchall()]

        if not hotel_ids or not ngo_ids:
            print("[ERROR] No hotel or NGO users found. Seed users first via postgres_setup.sql.")
            return

        print(f"      Found {len(hotel_ids)} hotels, {len(ngo_ids)} NGOs")

        # ─── Step 3: Check if data already exists ───────────────
        cursor.execute("SELECT COUNT(*) AS cnt FROM food_uploads")
        existing = cursor.fetchone()['cnt']
        if existing > 5:
            print(f"      Already {existing} uploads in DB. Skipping seed to avoid duplicates.")
            print("[DONE] Database is already populated.")
            return

        # ─── Step 4: Add Food Uploads ───────────────────────────
        print("[2/5] Inserting food uploads...")
        food_items = [
            ("Mix Veg Curry", "edible"), ("Steamed Rice", "edible"), ("Dal Fry", "edible"),
            ("Paneer Butter Masala", "edible"), ("Naan & Roti", "edible"), ("Chicken Biryani", "edible"),
            ("Salad Trimmings", "non-edible"), ("Spoiled Milk", "non-edible"), ("Vegetable Peels", "non-edible"),
            ("Leftover Pasta", "edible"), ("Fruit Salad", "edible"), ("Egg Sandwich", "edible"),
            ("Expired Bread", "non-edible"), ("Coffee Grounds", "non-edible"),
            ("Samosa & Chutney", "edible"), ("Idli & Vada", "edible"), ("Rotten Vegetables", "non-edible"),
        ]

        locations = ["MG Road", "Indiranagar", "Koramangala", "Whitefield", "Jayanagar", "HSR Layout"]

        upload_claim_pairs = []

        for _ in range(25):
            hotel_id = random.choice(hotel_ids)
            item, label = random.choice(food_items)
            qty = round(random.uniform(2.0, 15.0), 1)
            loc = random.choice(locations) + ", Bangalore"
            
            # Random status
            if label == "non-edible":
                status = random.choice(["waste_routed", "picked_up"])
            else:
                status = random.choice(["available", "claimed", "picked_up"])

            # Random past date
            days_ago = random.randint(0, 6)
            uploaded_at = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))

            cursor.execute(
                """
                INSERT INTO food_uploads (hotel_id, food_item, quantity, ai_label, status, location, uploaded_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (hotel_id, item, qty, label, status, loc, uploaded_at)
            )
            upload_id = cursor.fetchone()['id']

            # If claimed or picked_up, create a claim record
            if label == "edible" and status in ["claimed", "picked_up"]:
                upload_claim_pairs.append((upload_id, hotel_id, status, uploaded_at))

        db.commit()
        print(f"      Inserted 25 food uploads.")

        # ─── Step 5: Create Claims & Award Points ───────────────
        print("[3/5] Creating claims and awarding points...")
        for upload_id, hotel_id, status, uploaded_at in upload_claim_pairs:
            ngo_id = random.choice(ngo_ids)
            claim_status = "confirmed" if status == "picked_up" else "claimed"
            confirmed_at = uploaded_at + timedelta(hours=random.randint(1, 4)) if claim_status == "confirmed" else None
            
            cursor.execute(
                "INSERT INTO food_claims (upload_id, ngo_id, status, confirmed_at) VALUES (%s, %s, %s, %s) RETURNING id",
                (upload_id, ngo_id, claim_status, confirmed_at)
            )
            claim_id = cursor.fetchone()['id']

            # If confirmed, award points
            if claim_status == "confirmed":
                pts = random.choice([5, 8, 10, 15])
                cursor.execute(
                    "INSERT INTO hygiene_points_log (hotel_id, ngo_id, claim_id, points_awarded) VALUES (%s, %s, %s, %s)",
                    (hotel_id, ngo_id, claim_id, pts)
                )
                cursor.execute("UPDATE users SET hygiene_points = hygiene_points + %s WHERE id = %s", (pts, hotel_id))
                cursor.execute("UPDATE users SET notice_points = notice_points + 10 WHERE id = %s", (ngo_id,))

        db.commit()
        print(f"      Created {len(upload_claim_pairs)} claims.")

        # ─── Summary ────────────────────────────────────────────
        print("[4/5] Verifying...")
        cursor.execute("SELECT COUNT(*) AS cnt FROM users")
        user_count = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) AS cnt FROM food_uploads")
        upload_count = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) AS cnt FROM food_claims")
        claim_count = cursor.fetchone()['cnt']
        cursor.execute("SELECT COUNT(*) AS cnt FROM hygiene_points_log")
        pts_count = cursor.fetchone()['cnt']

        print(f"      Users: {user_count} | Uploads: {upload_count} | Claims: {claim_count} | Points logged: {pts_count}")
        print("[SUCCESS] Database seeded with mock data!")
        
    except Exception as e:
        print(f"[ERROR] Seeding failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    seed()
