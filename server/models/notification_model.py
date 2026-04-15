from db import db
from datetime import datetime
import uuid


def create_notification(recipient_id, type, title, message, data=None):

    notif_id = f"notif_{uuid.uuid4().hex[:8]}"

    notif_data = {
        "id": notif_id,
        "recipientId": recipient_id,

        # 🆕 TYPES
        "type": type,  # new_food, food_claimed, pickup_complete

        "title": title,
        "message": message,
        "data": data or {},

        "read": False,
        "createdAt": datetime.utcnow()
    }

    db.collection("notifications").document(notif_id).set(notif_data)

    return notif_data