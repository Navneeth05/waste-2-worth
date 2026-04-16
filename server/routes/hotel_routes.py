from fastapi import APIRouter, HTTPException, Header, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from core.db import get_db, get_cursor
from services.ai_model import classify_image

router = APIRouter(prefix="/hotel", tags=["Hotel"])


class FoodUploadRequest(BaseModel):
    food_item:  str
    quantity:   float
    ai_label:   str           # "edible" or "non-edible"
    location:   Optional[str]   = ""
    latitude:   Optional[float] = None   # hotel's GPS lat
    longitude:  Optional[float] = None   # hotel's GPS lng
    notes:      Optional[str]   = ""


def get_hotel_id(x_user_id, x_user_role) -> int:
    if not x_user_id or x_user_role != "hotel":
        raise HTTPException(status_code=401, detail="Hotel authentication required")
    try:
        return int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user id")


# ── POST /api/hotel/classify ─────────────────────────────────────
# Accepts an image file, runs the .h5 AI model, returns the label.
# Called by the frontend immediately after the user picks a photo.
@router.post("/classify")
async def classify_food(
    file:        UploadFile    = File(...),
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    get_hotel_id(x_user_id, x_user_role)  # must be logged in as hotel

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, png, webp, etc.)")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        result = classify_image(image_bytes)
        # result = { "label": "edible"|"non-edible", "confidence": 0.97, "routed_to": "NGO"|"Municipal" }
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")


# ── POST /api/hotel/upload ───────────────────────────────────────
# AI result (edible/non-edible) determines routing:
#   edible     → status='available'   (visible to NGOs)
#   non-edible → status='waste_routed' (visible to Municipal)
@router.post("/upload")
def upload_food(
    body: FoodUploadRequest,
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    hotel_id = get_hotel_id(x_user_id, x_user_role)

    if body.ai_label not in ("edible", "non-edible"):
        raise HTTPException(status_code=400, detail="ai_label must be 'edible' or 'non-edible'")
    if not body.quantity or body.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")

    status = "available" if body.ai_label == "edible" else "waste_routed"

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)
    try:
        # If no GPS provided, use hotel's registered coordinates
        lat, lng = body.latitude, body.longitude
        if lat is None or lng is None:
            cursor.execute(
                "SELECT latitude, longitude, city FROM users WHERE id = %s",
                (hotel_id,),
            )
            u = cursor.fetchone()
            if u:
                lat = lat or (float(u["latitude"]) if u.get("latitude") else None)
                lng = lng or (float(u["longitude"]) if u.get("longitude") else None)

        cursor.execute(
            """
            INSERT INTO food_uploads
                (hotel_id, food_item, quantity, ai_label, status, location, latitude, longitude, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (hotel_id, body.food_item, body.quantity, body.ai_label,
             status, body.location or "", lat, lng, body.notes or ""),
        )
        upload_id = cursor.fetchone()["id"]
        db.commit()

        # Routing message sent back to frontend
        routed_to = "NGO" if body.ai_label == "edible" else "Municipal waste collection"
        return {
            "message":   f"Food uploaded and routed to {routed_to}",
            "upload_id": upload_id,
            "status":    status,
            "routed_to": routed_to,
            "latitude":  lat,
            "longitude": lng,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()


# ── GET /api/hotel/history ───────────────────────────────────────
@router.get("/history")
def get_hotel_history(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    hotel_id = get_hotel_id(x_user_id, x_user_role)
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)
    try:
        cursor.execute(
            """
            SELECT
                f.id            AS upload_id,
                f.food_item,
                f.quantity,
                f.ai_label,
                f.status,
                f.location,
                f.latitude,
                f.longitude,
                f.uploaded_at,
                TO_CHAR(f.uploaded_at, 'YYYY-MM-DD')  AS date,
                TO_CHAR(f.uploaded_at, 'HH12:MI AM')  AS time,

                -- Who collected it?
                CASE
                    WHEN f.ai_label = 'non-edible' AND f.status = 'picked_up'
                        THEN 'Municipal'
                    WHEN f.ai_label = 'non-edible'
                        THEN 'Municipal (Pending)'
                    WHEN u_ngo.name IS NOT NULL
                        THEN u_ngo.name
                    WHEN f.status = 'claimed'
                        THEN 'NGO (Claimed)'
                    WHEN f.status = 'available'
                        THEN 'Awaiting NGO'
                    ELSE '—'
                END AS collector_name,

                CASE
                    WHEN f.ai_label = 'non-edible' THEN 'Municipal'
                    WHEN u_ngo.name IS NOT NULL     THEN 'NGO'
                    ELSE 'NGO'
                END AS collector_type,

                COALESCE(h.points_awarded, 0) AS hygiene_points
            FROM food_uploads f
            LEFT JOIN food_claims c  ON f.id = c.upload_id AND c.status = 'confirmed'
            LEFT JOIN hygiene_points_log h ON h.claim_id = c.id
            LEFT JOIN users u_ngo    ON c.ngo_id = u_ngo.id
            WHERE f.hotel_id = %s
            ORDER BY f.uploaded_at DESC
            """,
            (hotel_id,),
        )
        rows = cursor.fetchall()
        # Convert Decimal types for JSON serialization
        result = []
        for row in rows:
            r = dict(row)
            if r.get("quantity"):
                r["quantity"] = float(r["quantity"])
            if r.get("latitude"):
                r["latitude"] = float(r["latitude"])
            if r.get("longitude"):
                r["longitude"] = float(r["longitude"])
            result.append(r)
        return {"history": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()


# ── GET /api/hotel/dashboard ─────────────────────────────────────
@router.get("/dashboard")
def get_hotel_dashboard(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    hotel_id = get_hotel_id(x_user_id, x_user_role)
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)
    try:
        cursor.execute(
            """
            SELECT
                u.name,
                u.city,
                (SELECT COUNT(*) FROM food_uploads WHERE hotel_id = u.id)                         AS total_uploads,
                (SELECT COUNT(*) FROM food_uploads WHERE hotel_id = u.id AND ai_label = 'edible') AS edible_uploads,
                (SELECT COUNT(*) FROM food_claims fc JOIN food_uploads fu ON fc.upload_id = fu.id
                    WHERE fu.hotel_id = u.id AND fc.status = 'confirmed')                          AS pickups_completed,
                (SELECT COALESCE(SUM(quantity), 0) FROM food_uploads
                    WHERE hotel_id = u.id AND ai_label = 'edible')                                 AS kg_donated,
                u.hygiene_points
            FROM users u
            WHERE u.id = %s AND u.role = 'hotel'
            """,
            (hotel_id,),
        )
        row = cursor.fetchone()
        if row:
            r = dict(row)
            if r.get("kg_donated"):
                r["kg_donated"] = float(r["kg_donated"])
            return r
        return {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()


# ── GET /api/hotel/score ─────────────────────────────────────────
@router.get("/score")
def get_hotel_score(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    hotel_id = get_hotel_id(x_user_id, x_user_role)
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)
    try:
        cursor.execute(
            """
            SELECT
                u.id,
                u.name,
                (SELECT COUNT(*) FROM food_uploads WHERE hotel_id = u.id AND ai_label = 'edible')  AS total_edible,
                (SELECT COUNT(*) FROM food_uploads WHERE hotel_id = u.id AND ai_label = 'non-edible') AS total_waste,
                (SELECT COUNT(*) FROM food_claims fc JOIN food_uploads fu ON fc.upload_id = fu.id
                    WHERE fu.hotel_id = u.id AND fc.status = 'confirmed')                             AS pickups_done,
                u.hygiene_points
            FROM users u
            WHERE u.id = %s AND u.role = 'hotel'
            """,
            (hotel_id,),
        )
        return cursor.fetchone() or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()
