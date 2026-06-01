# DIGIPIN Checkout Middleware

Lightweight, dependency-free checkout widget for Shopify/WooCommerce style pages. It captures a delivery point, computes the India Post DIGIPIN entirely in the browser, and appends the result to native checkout metadata such as Address Line 2 or Shipping Notes.

## Files

- `src/digipin-encoder.js` - offline India Post DIGIPIN encoder/decoder.
- `src/checkout-digipin-widget.js` - Shadow DOM web component for checkout pages.
- `data/pincode-db.json` - small mock PIN-code centroid/bounding-box dictionary for testing.
- `demo/index.html` - local checkout demo.
- `test/offline.test.js` - network-free validation tests.

## Usage

```html
<textarea name="checkout[shipping_address][address2]"></textarea>
<script src="/src/digipin-encoder.js"></script>
<script src="/src/checkout-digipin-widget.js"></script>
<digipin-checkout pincode-src="/data/pincode-db.json"></digipin-checkout>
```

The component tries these checkout targets in order:

1. A custom selector from the `target` attribute.
2. Common Shopify/WooCommerce metadata and notes fields.
3. Common Address Line 2 fields.
4. A generated hidden `attributes[DIGIPIN]` field.

Generated values are written as `DIGIPIN: 39J-49L-L8T4` when appended to free-text shipping fields.

## Production PIN Database

`data/pincode-db.json` is intentionally a compact placeholder. For production, replace it with the full offline dictionary of India's postal PIN codes:

```json
{
  "110001": {
    "label": "New Delhi GPO, Delhi",
    "centroid": { "lat": 28.622788, "lon": 77.213033 },
    "bbox": { "minLat": 28.595, "maxLat": 28.65, "minLon": 77.185, "maxLon": 77.245 }
  }
}
```

The widget times out PIN database loading quickly and falls back to embedded sample entries, so checkout progression is not blocked when the asset is unavailable.
