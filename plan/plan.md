# Product Collection Flow Enhancement

## What it is
New Product form se user product details bharte hue nayi collection create kar sakega.
Collection save hone ke baad user ko wahi filled form par wapas laaya jayega, bina data खोए.

## Who it's for
Un users ke liye jo products add karte waqt unhe turant nayi ya existing collection mein organize karna chahte hain.

## Core features and experience
- New Product page par user product details fill karega.
- “Create New Collection” action current product form ko temporary preserve karega.
- Collection page par user collection ka naam/details bhar kar save karega.
- Save ke turant baad nayi collection “All Collections” mein visible hogi.
- User ko New Product page par wapas laaya jayega.
- Product form bilkul wahi filled values ke saath restore hoga.
- Nayi collection automatically selected hogi.
- User “Create Product” karke product ko selected collection ke andar save kar sakega.
- Back navigation ya cancellation par entered product data unnecessarily lose nahi hoga.

## Phase 1: what gets built now
- Existing New Product flow mein temporary form-state preservation.
- Create New Collection navigation and collection save flow.
- Saved collection ka immediate All Collections update.
- New Product form ka exact restoration after collection creation.
- Newly created collection ka automatic selection.
- Product creation ko selected collection se connect karna.
- Loading, save-success, validation, and failure states for the complete flow.