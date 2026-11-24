# Fysio — Rehab & Träningsapp (PWA)

En mobilvänlig webbapp (PWA) på svenska för att guida och logga dina fysiopass. Förladdad med grundprogrammet från **Fysiohuset Göteborg (Jannis)** och lätt att anpassa efter hand.

## Funktioner

- **Starta dagens pass**: Förinställt med växling mellan ben- och bålövningar enligt Jannis rekommendation (2 set/ben, 2–3 bålset, 30–60 s AMRAP & 30–60 s vila).
- **Tydliga övningsillustrationer**: Skräddarsydda illustrationer för startövningarna, samt möjlighet att ladda upp egna foton eller klistra in YouTube-/videolänkar när du lägger till nya övningar.
- **Smart timer med naturlig svensk röstcoach**:
  - Stöder både **tidsbaserade set (AMRAP / hålltid)** och **reps-baserad tempo-timer** (räknar ut totaltid utifrån antal reps × sekunder/rep och visar aktuell rep).
  - Automatiskt **sidbyte** (Vänster sida → kort paus för sidbyte → Höger sida) och **vila** med `+15s` förlängning och förhandsvisning av nästa övning.
  - Korta, lugna röstsignaler (*3, 2, 1 · Start · Halvvägs · Byt sida · Stopp · Klart*) inspelade med naturliga svenska röster (**Sofie** och **Mattias**) som fungerar offline, plus **Wake Lock** så skärmen inte slocknar under passet.
- **Träningskalender**: Se vilka dagar du tränat senaste månaderna, veckomål (`2–3 ggr/vecka`), hur kroppen kändes och eventuella anteckningar — plus manuell loggning.
- **Redigera programmet**: Lägg till, ta bort, ändra ordning och justera tider/reps/vila/sidbyte. Allt sparas lokalt på enheten (offline) med JSON-export och import.

## Kör lokalt

```bash
npm install
npm run dev
```

## Publicera på GitHub Pages (för mobilen)

Projektet innehåller färdig workflow i `.github/workflows/deploy.yml`:

1. Gå till **Settings → Pages** i ditt GitHub-repo (`MarvinJohannisson/rehab`).
2. Välj **Source: GitHub Actions**.
3. Vid varje push till `main` byggs och publiceras appen automatiskt.
4. Öppna länken i mobilen (Safari på iOS / Chrome på Android) och välj **Lägg till på hemskärmen** för att använda den som en riktig app!
