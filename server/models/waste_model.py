from db import db
from datetime import datetime
import uuid


def create_waste_report(food):

    quantity = food["quantity"]

    if quantity >= 15:
        urgency = "high"
    elif quantity >= 7:
        urgency = "medium"
    else:
        urgency = "low"

    report_id = f"waste_{uuid.uuid4().hex[:8]}"

    waste_data = {
        "id": report_id,
        "uploadId": food["id"],
        "hotelId": food["hotelId"],
        "foodItem": food["foodItem"],
        "quantity": quantity,
        "location": food["location"],

        "urgency": urgency,
        "status": "pending",

        "createdAt": datetime.utcnow()
    }

    db.collection("waste_reports").document(report_id).set(waste_data)

    return waste_data