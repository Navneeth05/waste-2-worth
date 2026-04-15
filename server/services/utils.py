from db import db
from datetime import datetime


def expire_food():

    foods = db.collection("food_uploads") \
        .where("status", "==", "available") \
        .stream()

    for doc in foods:
        food = doc.to_dict()

        if food["expiresAt"] < datetime.utcnow():
            db.collection("food_uploads").document(doc.id).update({
                "status": "expired"
            })

            print(f"⏰ Expired: {food['foodItem']}")