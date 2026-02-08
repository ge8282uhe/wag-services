# Importare il database in phpMyAdmin (Hostinger)

## Passi

1. **Apri phpMyAdmin**  
   Usa il link che Hostinger ti ha dato (es. dal pannello sotto “Database” o “phpMyAdmin”). Accedi con **nome database** e **password del database** (quelli che vedi in hPanel nelle credenziali MySQL).

2. **Crea o seleziona il database**  
   - Se non esiste ancora: in phpMyAdmin clicca **“Nuovo”** / **“New”**, dai un nome al database (es. `u825008747_wag` o come indicato da Hostinger), collation `utf8mb4_unicode_ci`, e crea.  
   - Se esiste già: clicca sul nome del database nella colonna a sinistra.

3. **Importa il file SQL**  
   - Con il database selezionato, apri la scheda **“Importa”** / **“Import”**.  
   - Clicca **“Scegli file”** / **“Choose File”** e seleziona **`database.sql`** (dalla cartella del progetto).  
   - In basso clicca **“Esegui”** / **“Go”**.  
   - Attendi il messaggio di successo.

4. **Verifica**  
   Nella colonna a sinistra dovresti vedere le tabelle: **users**, **quotes**, **portfolio_items**, con i dati iniziali (2 utenti, 2 voci portfolio).

---

## Credenziali di accesso (dopo l’import)

- **Admin:** `admin@wagservices.it` / `admin123`  
- **Utente test:** `user@wagservices.it` / `user123`

---

## Nota

L’app Node.js in locale usa **SQLite** (`data/database.sqlite`). Questo file **database.sql** serve per **MySQL su Hostinger**: dopo l’import, se fai girare l’app Node su Hostinger e la configuri per usare MySQL (nome DB, utente e password che vedi in hPanel), login e dati useranno questo database.
