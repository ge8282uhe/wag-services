# Far funzionare WAG Services su Hostinger (con login e API)

Il deploy dalla sezione **Git** copia solo i file e non avvia Node.js. Per avere il sito completo (login, dashboard, API) devi usare il **deploy come applicazione Node.js**.

## Passi in hPanel

1. **Avvia il deploy Node.js**
   - In hPanel vai in **Websites** → seleziona il sito.
   - Cerca **"Node.js"** nel menu o nella sezione **Advanced**.
   - Avvia il flusso **"Node.js application deployment"** (o simile).

2. **Collega GitHub**
   - Scegli **Connect GitHub**.
   - Autorizza Hostinger e seleziona il repository **ge8282uhe/wag-services**.
   - Branch: **main**.

3. **Impostazioni di build**
   - **Start command:** `node server.js` oppure `npm start`
   - **Application root:** lascia vuoto (la root del repo contiene già `server.js` e `package.json`).
   - Se richiesto, **Node.js version:** 20.x o 22.x.

4. **Variabili d’ambiente** (obbligatorie per login e database)
   In hPanel, nella sezione Environment / Variabili del deploy Node.js, aggiungi:
   - `NODE_ENV` = `production`
   - `PORT` = (di solito lo imposta Hostinger; se no, `3000`)
   - **Per usare il database MySQL** (così il login funziona):
     - `DB_HOST` = `localhost`
     - `DB_NAME` = `u825008747_WAGservices` (il nome del database che vedi in Databases)
     - `DB_USER` = `u825008747_Tronco` (l’utente MySQL)
     - `DB_PASSWORD` = (la password del database MySQL, quella di phpMyAdmin)

   Se queste quattro variabili MySQL sono impostate, l’app si connette al database che hai importato in phpMyAdmin. Senza di esse, l’app userebbe SQLite (che su Hostinger spesso non è adatto).

5. **Avvia il deploy**
   - Conferma e attendi la build. Hostinger eseguirà `npm install` e avvierà `node server.js`.

Dopo il deploy, il sito risponderà sia per le pagine sia per le API (`/api/login`, `/api/quotes`, ecc.).

---

## Se usi solo il deploy Git (senza Node)

Ho aggiunto un **index.html nella root** del progetto che reindirizza a `public/index.html`. Dopo un nuovo push (e un eventuale deploy automatico), aprendo il tuo dominio non avrai più 404 e vedrai la home.  
Login, registrazione e dashboard **non** funzioneranno perché il server Node non è in esecuzione: per quelli serve il deploy come app Node.js descritto sopra.
