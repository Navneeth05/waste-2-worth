from db import db
import uuid
from datetime import datetime


def login_or_register(name, role, location, email, contact):

    users_ref = db.collection("users").where("email", "==", email).stream()

    for user in users_ref:
        return user.to_dict()

    user_id = f"{role}_{uuid.uuid4().hex[:8]}"

    new_user = {
        "id": user_id,
        "name": name,
        "role": role,
        "location": location,
        "email": email,
        "contact": contact,

        # 🆕 POINT SYSTEM
        "hygienePoints": 0,
        "hygieneScore": 50,
        "noticePoints": 0,
        "ngoLevel": "Bronze",

        "createdAt": datetime.utcnow()
    }

    db.collection("users").document(user_id).set(new_user)

    return new_user