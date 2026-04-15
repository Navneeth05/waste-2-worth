from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from core.db import get_db

router = APIRouter(prefix="/ngo", tags=["NGO"])


# ── Pydantic Models ─────────────────────────────────────────────

class AwardPointsRequest(BaseModel):
    claim_id:       int
    points_awarded: int = 5    # NGO chooses: 3, 5, 8, or 10
    reason:         Optional[str] = "Pickup confirmed"


# ── Helper ───────────────────────────────────────────────────────

def get_ngo_id(x_user_id: Optional[str], x_user_role: Optional[str]) -> int:
    if not x_user_id or x_user_role != "ngo":
        raise HTTPException(status_code=401, detail="NGO authentication required")
    try:
        return int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user id")


# ── GET /api/ngo/available ───────────────────────────────────────
# Live feed of edible food available to claim
@router.get("/available")
def get_available_food(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    get_ngo_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = db.cursor(dictionary=True)
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
                f.uploaded_at,
                TIME_FORMAT(f.uploaded_at, '%h:%i %p') AS upload_time
            FROM food_uploads f
            JOIN users u ON f.hotel_id = u.id
            WHERE f.status = 'available' AND f.ai_label = 'edible'
            ORDER BY f.uploaded_at DESC
            """
        )
        return {"available": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()


# ── POST /api/ngo/claim/{upload_id} ─────────────────────────────
# Atomically claim a food upload — prevents double-claiming
@router.post("/claim/{upload_id}")
def claim_food(
    upload_id:   int,
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    ngo_id = get_ngo_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = db.cursor(dictionary=True)
    try:
        # Verify the upload exists and is still available
        cursor.execute(
            "SELECT id, status, hotel_id FROM food_uploads WHERE id = %s",
            (upload_id,),
        )
        food = cursor.fetchone()
        if not food:
            raise HTTPException(status_code=404, detail="Food upload not found")
        if food["status"] != "available":
            raise HTTPException(status_code=409, detail="Food has already been claimed")

        # Atomic update — rowcount=0 means another NGO just claimed it
        cursor.execute(
            "UPDATE food_uploads SET status = 'claimed' WHERE id = %s AND status = 'available'",
            (upload_id,),
        )
        if cursor.rowcount == 0:
            db.rollback()
            raise HTTPException(status_code=409, detail="Food was just claimed by another NGO")

        cursor.execute(
            "INSERT INTO food_claims (upload_id, ngo_id) VALUES (%s, %s)",
            (upload_id, ngo_id),
        )
        claim_id = cursor.lastrowid
        db.commit()
        return {"message": "Food claimed successfully", "claim_id": claim_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()


# ── POST /api/ngo/pickup/{claim_id}/confirm ──────────────────────
# NGO confirms physical pickup AND awards hygiene points to the hotel.
# Points are chosen by the NGO (3 / 5 / 8 / 10) — not auto-calculated.
@router.post("/pickup/{claim_id}/confirm")
def confirm_pickup_and_award_points(
    claim_id:    int,
    body:        AwardPointsRequest,
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    ngo_id = get_ngo_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = db.cursor(dictionary=True)
    try:
        # Validate claim belongs to this NGO
        cursor.execute(
            """
            SELECT fc.id, fc.upload_id, fc.status, fu.hotel_id
            FROM food_claims fc
            JOIN food_uploads fu ON fc.upload_id = fu.id
            WHERE fc.id = %s AND fc.ngo_id = %s
            """,
            (claim_id, ngo_id),
        )
        claim = cursor.fetchone()
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found or does not belong to this NGO")
        if claim["status"] == "confirmed":
            raise HTTPException(status_code=400, detail="Pickup already confirmed")
        if claim["status"] == "cancelled":
            raise HTTPException(status_code=400, detail="This claim was cancelled")

        hotel_id  = claim["hotel_id"]
        upload_id = claim["upload_id"]
        pts = max(1, min(body.points_awarded, 20))  # Clamp 1–20

        # Step 1: Confirm the claim
        cursor.execute(
            "UPDATE food_claims SET status = 'confirmed', confirmed_at = NOW() WHERE id = %s",
            (claim_id,),
        )
        # Step 2: Mark food as picked up
        cursor.execute(
            "UPDATE food_uploads SET status = 'picked_up' WHERE id = %s",
            (upload_id,),
        )
        # Step 3: Log the hygiene point award
        cursor.execute(
            """
            INSERT INTO hygiene_points_log (hotel_id, ngo_id, claim_id, points_awarded, reason)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (hotel_id, ngo_id, claim_id, pts, body.reason),
        )
        # Step 4: Add hygiene points to hotel
        cursor.execute(
            "UPDATE users SET hygiene_points = hygiene_points + %s WHERE id = %s AND role = 'hotel'",
            (pts, hotel_id),
        )
        # Step 5: Add notice points to NGO (10 per confirmed pickup)
        cursor.execute(
            "UPDATE users SET notice_points = notice_points + 10 WHERE id = %s AND role = 'ngo'",
            (ngo_id,),
        )
        db.commit()
        return {
            "message": f"Pickup confirmed! {pts} hygiene points awarded to hotel.",
            "hygiene_points_awarded": pts,
            "notice_points_earned":   10,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()


# ── GET /api/ngo/pickups ─────────────────────────────────────────
# NGO's full claim history from the DB
@router.get("/pickups")
def get_ngo_pickups(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    ngo_id = get_ngo_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                c.id            AS claim_id,
                u.name          AS hotel,
                f.food_item     AS item,
                f.quantity,
                f.location,
                c.status,
                c.claimed_at,
                c.confirmed_at,
                COALESCE(h.points_awarded, 0) AS hygiene_pts_awarded
            FROM food_claims c
            JOIN food_uploads f ON c.upload_id = f.id
            JOIN users u        ON f.hotel_id  = u.id
            LEFT JOIN hygiene_points_log h ON h.claim_id = c.id
            WHERE c.ngo_id = %s
            ORDER BY c.claimed_at DESC
            """,
            (ngo_id,),
        )
        return {"pickups": cursor.fetchall()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()


# ── GET /api/ngo/score ───────────────────────────────────────────
@router.get("/score")
def get_ngo_score(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    ngo_id = get_ngo_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                u.id,
                u.name,
                u.notice_points,
                (SELECT COUNT(*) FROM food_claims WHERE ngo_id = u.id AND status = 'confirmed') AS total_pickups,
                (SELECT COUNT(*) FROM food_claims WHERE ngo_id = u.id AND status = 'claimed')   AS pending_pickups
            FROM users u
            WHERE u.id = %s AND u.role = 'ngo'
            """,
            (ngo_id,),
        )
        return cursor.fetchone() or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()


# ── GET /api/ngo/dashboard ───────────────────────────────────────
@router.get("/dashboard")
def get_ngo_dashboard(
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    ngo_id = get_ngo_id(x_user_id, x_user_role)

    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                u.name,
                u.notice_points,
                (SELECT COUNT(*) FROM food_uploads
                    WHERE status = 'available' AND ai_label = 'edible')                           AS available_food_count,
                (SELECT COUNT(*) FROM food_claims
                    WHERE ngo_id = u.id AND status = 'confirmed')                                  AS pickups_done,
                (SELECT COUNT(*) FROM food_claims
                    WHERE ngo_id = u.id AND status = 'claimed')                                    AS pending_pickups,
                (SELECT COALESCE(SUM(fu.quantity * 3.5), 0)
                    FROM food_claims fc JOIN food_uploads fu ON fc.upload_id = fu.id
                    WHERE fc.ngo_id = u.id AND fc.status = 'confirmed')                            AS meals_served_estimate
            FROM users u
            WHERE u.id = %s AND u.role = 'ngo'
            """,
            (ngo_id,),
        )
        return cursor.fetchone() or {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()
