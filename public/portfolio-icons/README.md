# Icone portfolio (e favicon per i progetti)

Queste icone sono usate nella sezione **Lavori** del sito wagservices.it.

Puoi usarle anche come **favicon** sui rispettivi progetti:

- **Kreativa Project** (kreativaproject.netlify.app): copia `kreativa-favicon.png` nella root del progetto Kreativa e aggiungi nel `<head>`:
  ```html
  <link rel="icon" href="/kreativa-favicon.png" type="image/png">
  ```
  Oppure rinominala in `favicon.png` e usa `href="/favicon.png"`.

- **La Dolce Vita**: copia `ladolcevita-favicon.svg` nella root del progetto e aggiungi nel `<head>`:
  ```html
  <link rel="icon" href="/ladolcevita-favicon.svg" type="image/svg+xml">
  ```
  I browser moderni supportano i favicon in SVG. Per massima compatibilità puoi anche convertire l’SVG in PNG/ICO e usare quello.
