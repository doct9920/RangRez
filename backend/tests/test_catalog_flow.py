import os
import uuid

import requests


BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


def test_collection_product_linkage_and_count():
    suffix = uuid.uuid4().hex[:8]
    collection = requests.post(
        f"{BASE_URL}/api/collections",
        json={"name": f"TEST Collection {suffix}", "description": "regression"},
        timeout=10,
    )
    assert collection.status_code == 200
    collection_data = collection.json()
    assert collection_data["name"] == f"TEST Collection {suffix}"
    assert collection_data["product_count"] == 0

    product = requests.post(
        f"{BASE_URL}/api/products",
        json={
            "name": f"TEST Product {suffix}",
            "sku": f"SKU-{suffix}",
            "price": 38,
            "description": "regression product",
            "collection_id": collection_data["id"],
        },
        timeout=10,
    )
    assert product.status_code == 200
    product_data = product.json()
    assert product_data["collection_id"] == collection_data["id"]

    collections = requests.get(f"{BASE_URL}/api/collections", timeout=10)
    assert collections.status_code == 200
    stored = next(item for item in collections.json() if item["id"] == collection_data["id"])
    assert stored["product_count"] == 1


def test_blank_names_are_rejected():
    collection = requests.post(f"{BASE_URL}/api/collections", json={"name": "   "}, timeout=10)
    assert collection.status_code == 400
    product = requests.post(
        f"{BASE_URL}/api/products", json={"name": " ", "price": 1}, timeout=10
    )
    assert product.status_code == 400