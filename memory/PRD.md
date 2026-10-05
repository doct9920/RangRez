# Product Collection Flow Enhancement

## Original problem statement
Users adding a product need to create a new collection without losing the product details they have already entered. After saving the collection, the product form should return with the same values and the new collection selected.

## Architecture decisions
- React Router provides separate product, new collection, and all collections views.
- The product draft is stored in sessionStorage while the user is creating a collection, so browser back/cancel does not discard entered values.
- FastAPI exposes collection and product endpoints backed by the existing MongoDB connection.
- Collections and products use UUID string identifiers and Pydantic response models, avoiding MongoDB ObjectId responses.
- Collection product counts are incremented when a product is created with a collection id.

## User personas
- Catalog manager: adds products and organizes them while entering the catalog.
- Small-shop owner: needs quick, low-friction collection creation without retyping product information.

## Core requirements (static)
- Product form includes name, SKU, price, description, and collection selection.
- Create New Collection preserves the current product draft.
- Saving a collection returns to the product form and automatically selects the new collection.
- Collections are immediately visible in All Collections.
- Product creation is linked to the chosen collection.
- Loading, success, validation, and failure states are visible.
- Back and cancel preserve the draft.

## What's been implemented

### 2026-10-05
- Replaced the starter screen with a catalog workspace and responsive sidebar navigation.
- Added New Product flow with draft preservation and collection selection.
- Added New Collection form with validation, success toast, and return-to-product flow.
- Added All Collections view with empty state and collection cards.
- Added FastAPI collection/product CRUD creation and listing endpoints.
- Added product-to-collection linkage and product count updates.
- Verified desktop/mobile flow, API linkage, validation, and no horizontal overflow through end-to-end QA.

## Prioritized backlog

### P0
- None remaining for the approved Phase 1 flow.

### P1
- Add edit and delete actions for products and collections.
- Add collection detail view showing its products.
- Add server-side validation that a supplied collection id exists before product creation.

### P2
- Add product search and collection filtering.
- Add optional product images and richer catalog metadata.
- Add inventory quantity and stock status.

## Next tasks
1. Build collection detail pages with the linked product list.
2. Add product editing and deletion with count recalculation.
3. Add search/filter controls once the catalog has more entries.