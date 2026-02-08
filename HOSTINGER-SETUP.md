# Setup Hostinger – dal nuovo sito al login

Hai creato un **nuovo sito** Node.js: serve un **database MySQL** per quel sito. Segui questi passi in ordine.

---

## Passo 1 – Crea il database MySQL (hPanel)

1. In **hPanel** vai in **Databases** → **Management** (o “Gestione database”).
2. Compila il form **“Create New MySQL Database and User”**:
   - **Database name:** scegli un nome (es. `wagdb` o `wagservices`). Hostinger aggiungerà un prefisso (es. `u12345678_wagdb`).
   - **Username:** scegli un nome utente (es. `waguser`). Anche qui ci sarà un prefisso.
   - **Password:** inventa una password sicura e **salvala** (ti serve dopo).
3. Clicca **Create**.

Scrivi da qualche parte i **3 valori** che vedi nella tabella sotto (nome database completo, utente completo, password). Esempio: `u12345678_wagdb`, `u12345678_waguser`, `TuaPassword123`.

---

## Passo 2 – Importa le tabelle in phpMyAdmin

1. Nella stessa sezione **Databases**, nella riga del database appena creato clicca **“Enter phpMyAdmin”**.
2. Apri il **database** (nome che hai scritto al passo 1) nel menu a sinistra.
3. Vai nella scheda **Import** / **Importa**.
4. **Scegli file** e seleziona **`database.sql`** (lo trovi nella root del progetto su GitHub: [github.com/ge8282uhe/wag-services](https://github.com/ge8282uhe/wag-services) → `database.sql` → Download / Raw → salva come `database.sql`).
5. Clicca **Go** / **Esegui**.
6. Controlla che compaiano le tabelle **users**, **quotes**, **portfolio_items** con i dati iniziali.

---

## Passo 3 – Variabili d’ambiente nella Node.js app

1. In hPanel apri il **tuo sito** (la Node.js app wag-services).
2. Trova **“Environment variables”** (nella schermata di deploy/configurazione).
3. Aggiungi queste **4 variabili** usando i valori **del nuovo database** (quelli del passo 1):

   | Nome | Valore |
   |------|--------|
   | `DB_HOST` | `localhost` |
   | `DB_NAME` | *(nome completo del database, es. `u12345678_wagdb`)* |
   | `DB_USER` | *(nome completo utente, es. `u12345678_waguser`)* |
   | `DB_PASSWORD` | *(password che hai messo alla creazione)* |

   Salva.

---

## Passo 4 – Deploy

Nella pagina della Node.js app clicca **“Deploy”** (o **“Redeploy”**) e attendi la fine della build.

---

## Passo 5 – Prova il login

Apri il sito e accedi con:

- **Email:** `admin@wagservices.it`  
- **Password:** `admin123`

Se il login funziona, il setup è completo.

---

**Riassunto:** crei database + utente → importi `database.sql` in phpMyAdmin → metti nome DB, utente e password nelle variabili d’ambiente della Node.js app → Deploy.
