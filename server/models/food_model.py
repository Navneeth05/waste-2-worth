from db import db
from datetime import datetime, timedelta
from firebase_admin import firestore
from notification_model import create_notification
import uuid


def upload_food(hotel_id, foodItem, quantity, location):

    food_id = f"food_{uuid.uuid4().hex[:8]}"

    expires_at = datetime.utcnow() + timedelta(hours=2)

    # 🆕 AI LOGIC (dummy for now)
    ai_label = "edible" if quantity > 0 else "non-edible"

    food_data = {
        "id": food_id,
        "hotelId": hotel_id,
        "foodItem": foodItem,
        "quantity": quantity,

        # 🆕 AI FIELDS
        "aiLabel": ai_label,
        "aiConfidence": 0.9,

        # 🆕 FULL STATUS SYSTEM
        "status": "available" if ai_label == "edible" else "waste_routed",

        "location": location,

        "claimedBy": None,
        "claimedAt": None,
        "pickedUpAt": None,

        "expiresAt": expires_at,
        "createdAt": datetime.utcnow()
    }
    if food_data["aiLabel"] == "edible":
        create_notification(
            recipient_id="all_ngos",
            type="new_food",
            title="🍱 New Food Available",
            message=f"{foodItem} ({quantity} kg) available",
            data={"foodId": food_id}
    )

    db.collection("food_uploads").document(food_id).set(food_data)

    return food_data

def claim_food(food_id, ngo_id):

    doc_ref = db.collection("food_uploads").document(food_id)

    @firestore.transactional
    def transaction_claim(transaction, doc_ref):
        snapshot = doc_ref.get(transaction=transaction)

        if not snapshot.exists:
            return {"error": "Food not found"}

        food = snapshot.to_dict()

        if food["status"] != "available":
            return {"error": "Already claimed"}

        transaction.update(doc_ref, {
            "status": "claimed",
            "claimedBy": ngo_id,
            "claimedAt": datetime.utcnow()
        })
        create_notification(
            recipient_id=food["hotelId"],
            type="food_claimed",
            title="🤝 Food Claimed",
            message="An NGO has claimed your food",
            data={"foodId": food_id}
        )

        return {"message": "Food claimed successfully"}

    transaction = db.transaction()
    return transaction_claim(transaction, doc_ref)


def complete_pickup(food_id):

    doc_ref = db.collection("food_uploads").document(food_id)

    doc_ref.update({
        "status": "picked_up",
        "pickedUpAt": datetime.utcnow()
    })
    create_notification(
        recipient_id=food["hotelId"],
        type="pickup_complete",
        title="✅ Pickup Completed",
        message="Food has been collected",
        data={"foodId": food_id}
    )

    return {"message": "Pickup completed"}