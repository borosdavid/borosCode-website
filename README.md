# BorosCode

A [boroscode.com](https://boroscode.com/) nyilvános, magyar nyelvű projektfőoldala. A kezdőoldal tartalma a `public/index.html`, a megjelenés a `public/styles.css` fájlban szerkeszthető. Az első bemutatott projekt az Otthontár.

## Helyi ellenőrzés

Node.js 22 vagy újabb verzióval, a repository gyökerében:

```sh
npm ci
npm run dev
npm run check
```

A `dev` a helyi előnézetet indítja, a `check` telepítés nélkül próbálja ki a Wrangler csomagolását.

## Cloudflare Workers Builds

| Beállítás | Érték |
| --- | --- |
| GitHub repository | `borosdavid/borosCode-website` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | Üresen maradhat |
| Deploy command | `npm run deploy` |
| Node.js | 22 vagy újabb |

A `wrangler.jsonc` megadja a Worker nevét és a publikálandó `public/` könyvtárat. A `name` értékének egyeznie kell a Cloudflare-ben már létrehozott Worker nevével. Az alapértelmezett érték `boroscode`. A már a Workerhez rendelt `boroscode.com` egyéni domaint a Workers Builds beállításakor meg lehet tartani.

A betűtípus a Space Grotesk, licencszövege a `licenses/space-grotesk.txt` fájlban található. A tárolódobozok illusztrációja a főoldalhoz készült.
