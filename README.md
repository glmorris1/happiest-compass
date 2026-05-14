# Happiest Compass

A static mobile web app for Vercel. It asks for GPS and device-orientation access, then points the compass needle toward one saved destination and shows distance in miles or feet.

## Run locally

Open `index.html` directly, or serve the folder:

```sh
npx serve .
```

Device orientation and GPS are most reliable on a real phone over HTTPS. Vercel deployments are HTTPS by default.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel.
3. Use the default static project settings.

## Deploy to GitHub Pages

1. Create a public GitHub repository named `happiest-compass`.
2. Upload the files in this folder to the repository root.
3. In GitHub, open Settings -> Pages.
4. Set Source to "Deploy from a branch".
5. Set Branch to `main` and folder to `/root`.
6. Save. The app will publish at `https://YOUR_USERNAME.github.io/happiest-compass/`.

## Adjust the locations

Edit the `DESTINATIONS` array at the top of `app.js`.
