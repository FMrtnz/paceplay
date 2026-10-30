#PACEPLAY

## Getting started

npm install && npm run dev

- Test: `npm test`
- Build: `npm run build`

## Deployment (free)

Push to GitHub, then either:

- **GitHub Pages**: enable Pages with the "static" GitHub Actions workflow, serving the `dist` folder.
- **Cloudflare Pages**: build command `npm run build`, output directory `dist`.

HTTPS is required for GPS.