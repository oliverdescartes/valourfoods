# VALOUR Customer Proof Reel

Native Remotion composition for a premium 18-second vertical social advertisement.

## Composition

- ID: `ValourCustomerProof`
- Canvas: 1080 x 1920 (9:16)
- Frame rate: 30 FPS
- Duration: 540 frames / 18 seconds
- Master: `output/ValourCustomerProof-version-a.mp4`

## Timeline

| Frames | Time | Role | Content |
| --- | --- | --- | --- |
| 0-59 | 0:00-0:02 | New angle | Three customer-image cuts at 0.4-second intervals, then the Agartala customer-proof hook. |
| 60-149 | 0:02-0:05 | Contrast | Ordering in / long masala preparation contrasted with “They did neither.” |
| 150-209 | 0:05-0:07 | Bullseye proof 1 | Subham, Banamalipur; exact review over the supplied customer meal photograph. |
| 210-269 | 0:07-0:09 | Bullseye proof 2 | Kakoli, Hapania; exact review over the supplied cooking photograph. |
| 270-329 | 0:09-0:11 | Bullseye proof 3 | Depanki, Agartala; exact review over the supplied butter chicken photograph. |
| 330-419 | 0:11-0:14 | Product mechanism | Genuine jar image with add chicken / fry / pour / simmer / 15 minutes / 1 kg chicken explanation. |
| 420-539 | 0:14-0:18 | Outcome and CTA | Customer meal, genuine jar, supplied VALOUR logo, outcome, brand line and “See how it works.” |

## Exact customer reviews used

1. Subham, Banamalipur: “Tasty! creamy and onek beshi quantity.”
2. Kakoli, Hapania: “Amr ektu  bhoy chilo, bhalo hobe ki na! kintu rana ta shei hoyeche”
3. Depanki, Agartala: “The original butter chicken! please bring more recepies.”

Spelling, capitalization, spacing and punctuation are preserved from the supplied public testimonial records.

## Supplied visual assets used

- `public/customers/subham.png` - copied unchanged from `test4_x.png`
- `public/customers/kakoli.jpg` - copied unchanged from `testi_2.jpg`
- `public/customers/depanki.jpeg` - copied unchanged from `testi_5.jpeg`
- `public/product/velvety-butter-chicken.png` - copied unchanged from `velevty_butter_mockupM.png`
- `public/brand/valourblacklogo.webp` - copied unchanged from the supplied `valourblacklogo.webp`

The customer photographs, faces, food, kitchen settings, product packaging and VALOUR logo were not generated or retouched. Remotion applies crops, scale, translation and overlays only.

## Audio

`public/audio/valour-original-bed.wav` is an original, locally synthesized instrumental bed created for this project at a 150 BPM pulse. The first three image cuts align to its 0.4-second pulse. It contains no third-party recording. No voiceover was supplied, so a voiceover version was not produced.

## Verification

Run `npm run lint`, inspect `output/stills/`, and use:

```powershell
npx remotion studio --no-open
npx remotion render src/index.ts ValourCustomerProof output/ValourCustomerProof-version-a.mp4 --codec=h264 --crf=16 --audio-codec=aac --pixel-format=yuv420p
```
