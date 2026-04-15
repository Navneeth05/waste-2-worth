from models import login_or_register
from food_model import upload_food, claim_food, complete_pickup
from utils import expire_food

location = {
    "lat": 13.0827,
    "lng": 77.5877,
    "address": "Yelahanka",
    "city": "Bangalore",
    "zone": "Zone A"
}

hotel = login_or_register("Hotel A", "hotel", location, "h@gmail.com", "111")
ngo = login_or_register("NGO A", "ngo", location, "n@gmail.com", "222")

food = upload_food(hotel["id"], "Rice", 10, location)

claim_food(food["id"], ngo["id"])

complete_pickup(food["id"])

expire_food()