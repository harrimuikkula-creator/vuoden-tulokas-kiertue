# Vuoden Tulokas Stand Up -kiertue

Show-pohjainen landing page Vuoden Tulokas Stand Up -kiertueelle.

## Paikallinen ajo

```bash
npm install
npm run dev
```

Avaa [http://localhost:3000](http://localhost:3000).

Tuotantobuild:

```bash
npm run build
npm start
```

## Sisällön muokkaus

Kaikki helposti vaihtuva sisältö on `src/data/`-kansiossa:

| Tiedosto | Mitä |
|----------|------|
| `tour.ts` | Nimi, tagline, tarina, teaser-URL |
| `shows.ts` | Keikat (päivä, paikka, lippulinkki) |
| `comedians.ts` | Koomikot, biot, some, YouTube-klipit |
| `quotes.ts` | Arvostelulainaukset |

Brand-kuvat: `public/tour-poster.jpg`, `public/tour-logo.jpg`, `public/harri-muikkula.jpg`.

## Stack

Next.js (App Router) + TypeScript + CSS Modules. Vercel-valmis.
