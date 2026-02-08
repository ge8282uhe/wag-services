# Setup Hostinger – 3 passi (fai solo questi)

L’app e il database sono già pronti. Devi solo dire a Hostinger **quale database usare** e rilanciare il deploy.

---

## Passo 1 – Variabili d’ambiente (Environment)

1. In **hPanel** apri il tuo sito (la Node.js app).
2. Cerca **“Environment variables”** / **“Variabili d’ambiente”** (o dentro “Deployment details” / “Build settings” / “Settings”).
3. **Aggiungi** queste 4 variabili (nome = valore):

   | Nome | Valore |
   |------|--------|
   | `DB_HOST` | `localhost` |
   | `DB_NAME` | `u825008747_WAGservices` |
   | `DB_USER` | `u825008747_Tronco` |
   | `DB_PASSWORD` | *(incolla la password del database MySQL)* |

   Salva.

---

## Passo 2 – Redeploy

Nella stessa pagina della Node.js app clicca **“Redeploy”** / **“Deploy”** (o “Rideploy”) e attendi che la build finisca.

---

## Passo 3 – Prova il login

Apri il sito e prova ad accedere con:

- **Email:** `admin@wagservices.it`  
- **Password:** `admin123`

Se il login va a buon fine, il setup è completo.

---

**Se non trovi “Environment variables”:** nella dashboard del sito cerca “Settings”, “Deployment”, “Build” o “Configure” e lì dovresti trovare la sezione per le variabili d’ambiente.
