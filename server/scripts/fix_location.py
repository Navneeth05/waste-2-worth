from db import db

def validate_location(location):
    required_fields = ["lat", "lng", "address", "city", "zone"]

    for field in required_fields:
        if field not in location:
            raise ValueError(f"Missing {field} in location")


def fix_locations():

    users = db.collection("users").stream()

    for user in users:
        data = user.to_dict()

        # Only fix if location is still string
        if isinstance(data.get("location"), str):

            new_location = {
                "lat": 13.0827,
                "lng": 77.5877,
                "address": data["location"],
                "city": "Bangalore",
                "zone": "Zone A"
            }

            # ✅ Validate BEFORE saving
            validate_location(new_location)

            db.collection("users").document(data["id"]).update({
                "location": new_location
            })

            print(f"✅ Fixed {data['name']}")

    print("🎯 All locations updated successfully")


# Run function
fix_locations()