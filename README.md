# Dosa Point — order menu

A single-page, no-build ordering dashboard for Dosa Point. Tap items to add them to an order and watch the total update live. Pure HTML/CSS/JS — no dependencies, no build step.

## Run it locally

Just open `index.html` in a browser. That's it.

## Deploy with GitHub Pages

1. Create a new repo on GitHub (e.g. `dosa-point`), don't initialize it with a README.
2. In this folder, run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/dosa-point.git
   git push -u origin main
   ```

3. On GitHub: go to **Settings → Pages**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`, then save.
4. Your site will be live at `https://<your-username>.github.io/dosa-point/` within a minute or two.

## Editing the menu

Open `index.html` and edit the `dosas` and `sides` arrays near the bottom of the file — each entry is just `{ id, name, price }`.
