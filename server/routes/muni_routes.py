from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from core.db import get_db, get_cursor

router = APIRouter(prefix="/muni", tags=["Municipal"])


def get_muni_id(x_user_id: Optional[str], x_user_role: Optional[str]) -> int:
    if not x_user_id or x_user_role != "muni":
        raise HTTPException(status_code=401, detail="Municipal authentication required")
    try:
        return int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user id")


# ── GET /api/muni/waste ──────────────────────────────────────────
# All non-edible food uploads (status = 'waste_routed') from hotels.
# These are visible only to Municipal users to collect.
@router.get("/waste")
def get_waste_list(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    get_muni_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)
    try:
        cursor.execute(
            """
            SELECT
                f.id            AS upload_id,
                u.name          AS hotel_name,
                u.zone,
                u.city,
                f.food_item,
                f.quantity,
                f.location,
                f.latitude,
                f.longitude,
                f.status,
                f.uploaded_at,
                TO_CHAR(f.uploaded_at, 'YYYY-MM-DD')  AS date,
                TO_CHAR(f.uploaded_at, 'HH12:MI AM')  AS time
            FROM food_uploads f
            JOIN users u ON f.hotel_id = u.id
            WHERE f.ai_label = 'non-edible'
              AND f.status IN ('waste_routed', 'available')
            ORDER BY f.uploaded_at DESC
            """
        )
        rows = cursor.fetchall()
        result = []
        for row in rows:
            r = dict(row)
            if r.get("quantity"): r["quantity"] = float(r["quantity"])
            if r.get("latitude"): r["latitude"] = float(r["latitude"])
            if r.get("longitude"): r["longitude"] = float(r["longitude"])
            result.append(r)
        return {"waste": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()


# ── POST /api/muni/collect/{upload_id} ──────────────────────────
# Municipal marks a waste item as collected (picked_up).
@router.post("/collect/{upload_id}")
def mark_collected(
    upload_id:   int,
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    get_muni_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)
    try:
        cursor.execute(
            "SELECT id, status, ai_label FROM food_uploads WHERE id = %s",
            (upload_id,),
        )
        item = cursor.fetchone()
        if not item:
            raise HTTPException(status_code=404, detail="Upload not found")
        if item["ai_label"] != "non-edible":
            raise HTTPException(status_code=400, detail="This item is edible — handled by NGO, not Municipal")
        if item["status"] == "picked_up":
            raise HTTPException(status_code=409, detail="Already collected")

        cursor.execute(
            "UPDATE food_uploads SET status = 'picked_up' WHERE id = %s",
            (upload_id,),
        )
        db.commit()
        return {"message": "Waste marked as collected", "upload_id": upload_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()


# ── GET /api/muni/dashboard ──────────────────────────────────────
@router.get("/dashboard")
def get_muni_dashboard(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    get_muni_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)
    try:
        cursor.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM food_uploads
                    WHERE ai_label = 'non-edible' AND status = 'waste_routed')  AS pending,
                (SELECT COUNT(*) FROM food_uploads
                    WHERE ai_label = 'non-edible' AND status = 'picked_up')     AS collected,
                (SELECT COALESCE(SUM(quantity), 0) FROM food_uploads
                    WHERE ai_label = 'non-edible')                              AS total_kg,
                (SELECT COUNT(DISTINCT zone) FROM users
                    WHERE role = 'hotel' AND zone IS NOT NULL AND zone != '')    AS zones_active
            """
        )
        row = cursor.fetchone()
        if row:
            r = dict(row)
            if r.get("total_kg"):
                r["total_kg"] = float(r["total_kg"])
            return r
        return {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()
