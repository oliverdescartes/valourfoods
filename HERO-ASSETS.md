# Mobile hero product assets

The hero currently displays only the approved Velvety Butter Chicken product. The selector, placeholder products and automatic rotation are temporarily removed.

## Current hero

- Product data comes from `assets/js/hero-products.js`.
- The photograph uses `liquid-hero__photo_bg.webp` as a complete background composition. No separate jar or dish overlays are added.
- The subheading reads “Simple steps. Clean Ingredients. Complete recipe”.
- Shop now links to the buying section at `#a-closer-look`.
- See how links to the cooking steps at `#valour-stack-story`.
- The photo has an accessible image description.

## Before adding a product range

Each additional product needs:

- An approved name and stable SKU or URL slug.
- An approved jar-and-finished-dish photograph with authentic packaging and readable artwork.
- A coordinated background colour and meaningful image description.
- Approved product description, pack size and serving information.
- Cooking instructions or a demonstration.
- A working purchase destination backed by actual product and pricing data.

The carousel controller and its timing checks remain in `assets/js/hero-carousel.js` and `assets/js/hero-carousel.test.cjs` for a future range. The current page does not load or initialise that controller.
