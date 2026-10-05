from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class Collection(CollectionCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = ""
    price: float = Field(ge=0)
    description: Optional[str] = ""
    collection_id: Optional[str] = None

class Product(ProductCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = ""


# ---------------- Auth helpers ----------------
async def get_current_user(request: Request) -> User:
    """Return the authenticated user, checking cookie first then Authorization header."""
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# ---------------- Auth routes ----------------
@api_router.post("/auth/session")
async def auth_session(request: Request, response: Response):
    """Exchange Emergent session_id for a session_token, create user + session, set cookie."""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing X-Session-ID header")

    async with httpx.AsyncClient(timeout=10.0) as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session id")
    data = resp.json()

    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", existing.get("name", "")),
                      "picture": data.get("picture", existing.get("picture", ""))}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", ""),
            "picture": data.get("picture", ""),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )

    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return User(**user_doc)


@api_router.get("/auth/me", response_model=User)
async def auth_me(user: User = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", samesite="none", secure=True)
    return {"ok": True}


# ---------------- Catalog routes (protected) ----------------
@api_router.get("/collections", response_model=List[Collection])
async def get_collections(user: User = Depends(get_current_user)):
    collections = await db.collections.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for collection in collections:
        if isinstance(collection.get("created_at"), str):
            collection["created_at"] = datetime.fromisoformat(collection["created_at"])
    return collections

@api_router.post("/collections", response_model=Collection)
async def create_collection(input: CollectionCreate, user: User = Depends(get_current_user)):
    if not input.name.strip():
        raise HTTPException(status_code=400, detail="Collection name is required")
    collection = Collection(name=input.name.strip(), description=(input.description or "").strip())
    doc = collection.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.collections.insert_one(doc)
    return collection

@api_router.get("/products", response_model=List[Product])
async def get_products(user: User = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for product in products:
        if isinstance(product.get("created_at"), str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
    return products

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate, user: User = Depends(get_current_user)):
    if not input.name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
    if input.collection_id:
        collection = await db.collections.find_one({"id": input.collection_id}, {"_id": 0, "id": 1})
        if not collection:
            raise HTTPException(status_code=400, detail="Selected collection does not exist")
    product = Product(name=input.name.strip(), sku=(input.sku or "").strip(), price=input.price,
                      description=(input.description or "").strip(), collection_id=input.collection_id)
    doc = product.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)
    if product.collection_id:
        await db.collections.update_one({"id": product.collection_id}, {"$inc": {"product_count": 1}})
    return product


# Include the router in the main app
app.include_router(api_router)

# CORS: allow_credentials requires explicit origins (no "*")
_cors_env = os.environ.get('CORS_ORIGINS', '').strip()
if _cors_env:
    cors_origins = [o.strip() for o in _cors_env.split(',') if o.strip()]
else:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
