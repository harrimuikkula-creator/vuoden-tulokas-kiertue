# Vuoden Tulokas Stand Up -kiertue

Show-pohjainen landing page Vuoden Tulokas Stand Up -kiertueelle.

## Paikallinen ajo

```bash
npm install
cp .env.example .env.local
npm run dev
```

Avaa [http://localhost:3000](http://localhost:3000).

Tuotantobuild:

```bash
npm run build
npm start
```

## Sisällön muokkaus (Google Sheets)

Muokattavat tekstit, keikat ja arvostelut tulevat Google Sheetistä. Koomikoiden biot, kuvat ja linkit pysyvät koodissa (`src/data/comedians.ts`) — ne tulevat eri kautta.

**Sheet:** [Vuoden Tulokas — sivuston tekstit](https://docs.google.com/spreadsheets/d/161_R11bCnYHRPKTPAAfYlj7dz2fDUlt0WoX2DXyTaPI/edit)

| Välilehti | Mitä |
|-----------|------|
| `Site` | Otsikot, tagline, tarina, navigaatio, meta-kuvaus, lipputekstit |
| `Shows` | Keikat: `date`, `dateIso`, `venue`, `city`, `ticketUrl` |
| `Quotes` | Arvostelulainaukset: `text`, `attribution` |

### Jaa sheet lukulinkillä (pakollinen)

Sivusto lukee Sheetin julkisena CSV:nä. Tee kerran:

1. Avaa Sheet → **Jaa**
2. Yleinen käyttöoikeus → **Linkin saaneet voivat katsella**
3. Kopioi Sheet-ID `.env.local` / Vercel env -muuttujaan `GOOGLE_SHEETS_ID`

Ilman jakoa sivusto käyttää `src/data/`-fallbackeja.

### Muokkaajalle

1. Muokkaa soluja Sheetissä (älä vaihda `Site`-välilehden `key`-sarakkeen arvoja).
2. Tallennus on automaattinen.
3. Nettisivu päivittää sisällön noin minuutin välein (`revalidate = 60`).

Uusi keikka: lisää rivi `Shows`-välilehdelle.  
Uusi arvostelu: lisää rivi `Quotes`-välilehdelle.  
Tyhjä solu `Site`-välilehdellä säilyttää sivuston oletustekstin.

### Vercel

Lisää Environment Variable:

- `GOOGLE_SHEETS_ID` = `161_R11bCnYHRPKTPAAfYlj7dz2fDUlt0WoX2DXyTaPI`

## Koodissa pysyvä sisältö

| Tiedosto | Mitä |
|----------|------|
| `src/data/comedians.ts` | Koomikot, oletusbiot ja some. Esittelyteksti, kuva ja videolinkit täydentyvät StandUppAppin kiertueelta «Kuvat ja markkinointi», kun julkaisu on päällä. |
| `src/data/tour.ts` | Kuvat / polut (posteri, logo, teaser-kuva) |
| `src/data/siteCopy.ts`, `shows.ts`, `quotes.ts` | Fallbackit jos Sheet ei ole saatavilla |

Brand-kuvat: `public/tour-poster.jpg`, `public/tour-logo.jpg`, `public/harri-muikkula.jpg`.

## Stack

Next.js (App Router) + TypeScript + CSS Modules. Sisältö Google Sheetsistä. Vercel-valmis.
