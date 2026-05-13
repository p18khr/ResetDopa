# Deploying the public policy and deletion pages

The docs site is hosted from the `docs/` folder on GitHub Pages and mapped to `resetdopa.com` via the repository `CNAME` file.

Public URLs
- `https://resetdopa.com/privacy.html`
- `https://resetdopa.com/terms.html`
- `https://resetdopa.com/account/delete/`
- `https://resetdopa.com/account/delete/confirm/`

GitHub Pages setup
1. Push the `docs/` changes to `main`.
2. In GitHub repository settings, open Pages.
3. Set Source to `Deploy from a branch`.
4. Choose branch `main` and folder `/docs`.
5. Keep the `CNAME` file with `resetdopa.com` in the repository root.

Alternative: `gh-pages`
- You can also publish `docs/` to a `gh-pages` branch using the `gh-pages` package or a GitHub Actions workflow.
- If you do this, keep the same `CNAME` content so the domain remains `resetdopa.com`.

Suggested Play Console deletion URL copy
- `https://resetdopa.com/account/delete/ — Public page where authenticated users can request permanent account deletion. Deletion requires email confirmation and returns a deletion reference id. Contact: privacy@resetdopa.com`
