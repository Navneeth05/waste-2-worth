from core.db import get_db, get_cursor
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
import os
import jwt

from routes.hotel_routes import router as hotel_router
from routes.ngo_routes   import router as ngo_router
from routes.muni_routes  import router as muni_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────
    print("\n" + "="*50)
    print("WASTE2WORTH API STARTING...")
    print("="*50)
    try:
        db = get_db()
        if db:
            print("DATABASE STATUS: CONNECTED (PostgreSQL on Render)")
            db.close()
        else:
            print("DATABASE STATUS: DISCONNECTED")
            print("TIP: Ensure PostgreSQL credentials in server/.env are correct.")
    except Exception as exc:
        print(f"DATABASE STATUS: ERROR — {exc}")
        print("Server will continue running. Endpoints requiring DB will return 500.")
    print("="*50 + "\n")
    yield
    # ── Shutdown ─────────────────────────────────────────────────
    print("Waste2Worth API shutting down.")

app = FastAPI(title="Waste2Worth API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET = "your_secret_key"

app.include_router(hotel_router, prefix="/api")
app.include_router(ngo_router,   prefix="/api")
app.include_router(muni_router,  prefix="/api")


# ── Pydantic Models ─────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name:      str
    email:     str
    password:  str
    role:      str
    phone:     Optional[str] = ""
    city:      Optional[str] = ""
    latitude:  Optional[float] = None   # GPS from browser
    longitude: Optional[float] = None


class LoginRequest(BaseModel):
    email:    str
    password: str
    role:     Optional[str] = None


class UpdateProfileRequest(BaseModel):
    name:  str
    email: str
    phone: Optional[str] = None
    city:  Optional[str] = None
    zone:  Optional[str] = None


# ── POST /api/auth/register ──────────────────────────────────────
@app.post("/api/auth/register")
def register(req: RegisterRequest):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)

    cursor.execute("SELECT id FROM users WHERE email = %s", (req.email,))
    if cursor.fetchone():
        cursor.close(); db.close()
        raise HTTPException(status_code=400, detail="User already exists")

    try:
        cursor.execute(
            """
            INSERT INTO users (name, email, password, role, phone, city, latitude, longitude)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (req.name, req.email, req.password, req.role,
             req.phone or "", req.city or "",
             req.latitude, req.longitude),
        )
        db.commit()
        print(f"[REGISTER] {req.name} ({req.email}) role={req.role}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()

    return {"message": "User registered successfully"}


# ── POST /api/auth/login ─────────────────────────────────────────
@app.post("/api/auth/login")
def login(req: LoginRequest):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = get_cursor(db)
    cursor.execute("SELECT * FROM users WHERE email = %s", (req.email,))
    db_user = cursor.fetchone()
    cursor.close(); db.close()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Plain text password comparison
    if db_user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid password")

    if req.role and db_user["role"] != req.role:
        raise HTTPException(status_code=403, detail=f"Account is not a {req.role} account")

    token = jwt.encode(
        {"email": db_user["email"], "role": db_user["role"], "id": db_user["id"]},
        SECRET, algorithm="HS256",
    )

    return {
        "message": "Login successful",
        "token":   token,
        "user": {
            "id":            db_user["id"],
            "name":          db_user["name"],
            "role":          db_user["role"],
            "email":         db_user["email"],
            "phone":         db_user.get("phone", ""),
            "city":          db_user.get("city", ""),
            "latitude":      float(db_user["latitude"]) if db_user.get("latitude") else None,
            "longitude":     float(db_user["longitude"]) if db_user.get("longitude") else None,
            "notice_points": db_user.get("notice_points", 0),
        },
    }


# ── POST /api/profile/update ─────────────────────────────────────
@app.post("/api/profile/update")
def update_profile(
    body:      UpdateProfileRequest,
    x_user_id:   Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    uid = int(x_user_id)
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    cursor = get_cursor(db)
    try:
        # Check email uniqueness (excluding current user)
        cursor.execute("SELECT id FROM users WHERE email=%s AND id!=%s", (body.email, uid))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email is already in use by another account")

        cursor.execute(
            """
            UPDATE users 
            SET name=%s, email=%s, phone=%s, city=%s, zone=%s 
            WHERE id=%s
            """,
            (body.name, body.email, body.phone or "", body.city or "", body.zone or "", uid)
        )
        db.commit()

        # Fetch updated user to return
        cursor.execute("SELECT id, name, email, role, phone, city, zone, latitude, longitude FROM users WHERE id=%s", (uid,))
        updated = cursor.fetchone()
        return {"message": "Profile updated successfully", "user": updated}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close(); db.close()


# ── GET /api/health ──────────────────────────────────────────────
@app.get("/api/health")
def health():
    db = get_db()
    ok = db is not None
    if db: db.close()
    return {"status": "ok", "database": "connected" if ok else "disconnected"}


if __name__ == "__main__":
    import uvicorn
    # Render provides PORT environment variable
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)