# Happiest Compass

A static mobile web app. It asks for GPS and device-orientation access, then points the compass needle toward one saved destination and shows distance in miles or feet.

## Pages

- Happiest Compass: `https://glmorris1.github.io/happiest-compass/`
- Lanikai Beach Compass: `https://glmorris1.github.io/happiest-compass/lanikai-beach/`
- Perry High School Compass: `https://glmorris1.github.io/happiest-compass/perry-high-school/`

## Run locally

Open `index.html` directly, or serve the folder:

```sh
npm run dev
```

Device orientation and GPS are most reliable on a real phone over HTTPS.

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

1. Keep this repository public for free GitHub Pages hosting.
2. In GitHub, open Settings -> Pages.
3. Under Build and deployment, choose GitHub Actions.
4. Push to `main` or run the workflow manually.

The main app will publish at `https://glmorris1.github.io/happiest-compass/`, the Lanikai Beach page will publish at `https://glmorris1.github.io/happiest-compass/lanikai-beach/`, and the Perry High School page will publish at `https://glmorris1.github.io/happiest-compass/perry-high-school/`.

## Adjust the location

Edit the `DESTINATIONS` array at the top of `app.js`, or edit the page-specific target in `lanikai-beach/app.js` or `perry-high-school/app.js`.
