# Happiest Compass

A static mobile web app. It asks for GPS and device-orientation access, then points the compass needle toward one saved destination and shows distance in miles or feet.

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

The app will publish at `https://glmorris1.github.io/happiest-compass/`.

## Adjust the location

Edit the `DESTINATIONS` array at the top of `app.js`.
