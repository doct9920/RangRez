from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


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
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
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

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

@api_router.get("/collections", response_model=List[Collection])
async def get_collections():
    collections = await db.collections.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for collection in collections:
        if isinstance(collection.get("created_at"), str):
            collection["created_at"] = datetime.fromisoformat(collection["created_at"])
    return collections

@api_router.post("/collections", response_model=Collection)
async def create_collection(input: CollectionCreate):
    if not input.name.strip():
        raise HTTPException(status_code=400, detail="Collection name is required")
    collection = Collection(name=input.name.strip(), description=(input.description or "").strip())
    doc = collection.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.collections.insert_one(doc)
    return collection

@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for product in products:
        if isinstance(product.get("created_at"), str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
    return products

@api_router.post("/products", response_model=Product)
async def create_product(input: ProductCreate):
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()