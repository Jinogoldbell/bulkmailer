<<<<<<< HEAD
# Postbag - Bulk Mail App (MERN)

Send one email to many recipients from a React UI. Express + Nodemailer does the sending, MongoDB keeps a record of every send, and a simple admin login protects it all.

## Features

- **Compose** - subject, message (plain text or HTML), and multiple recipients (type, paste a list, or mix separators: comma, semicolon, space, new line)
- **Validation** - invalid addresses are highlighted, duplicates skipped, and the server re-validates everything
- **Per-recipient delivery** - each person gets their own copy (no CC/BCC leaks); results are tracked individually
- **Status messages** - success, partial success, or failure banners after every send
- **History** - paginated list, status filter, expandable detail (message + per-recipient result), delete
- **Admin auth** - bcrypt-hashed password in MongoDB, JWT sessions, rate-limited login
- **Logging** - HTTP + app logs to console and `server/logs/server.log`
- **Dry-run mode** - test the whole flow without an SMTP account

## Setup

Requires Node 18+ and a running MongoDB (local or Atlas).

```bash
npm run install:all
cp server/.env.example server/.env     # then edit it
npm run dev                            # API on :5000, UI on :5173
```

Open http://localhost:5173 and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`. The admin user is created automatically on first start.

### Try it without SMTP

Set `MAIL_DRY_RUN=true` in `server/.env`. Sends are simulated and still recorded in history.

### Using Gmail

1. Turn on 2-Step Verification for the Google account.
2. Create an **App Password** (Google Account > Security > App passwords).
3. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=<your address>`, `SMTP_PASS=<app password>`.

Gmail caps free accounts at roughly 500 messages a day. For larger volumes use a transactional provider (SendGrid, Mailgun, Amazon SES, Brevo) - just change the SMTP settings.

## API

All `/api/mail` routes need `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ email, password }` -> `{ token, user }` |
| GET | `/api/auth/me` | Current admin |
| POST | `/api/mail/send` | `{ subject, body, recipients[], isHtml }` -> sends and stores the record |
| GET | `/api/mail?page=&limit=&status=` | Paginated history |
| GET | `/api/mail/:id` | Full record with per-recipient results |
| DELETE | `/api/mail/:id` | Remove from history |
| GET | `/api/health` | Liveness check |

## Data model (`Mail`)

```
subject, body, isHtml
recipients: [{ email, status: pending|sent|failed, error }]
totalRecipients, sentCount, failedCount
status: sending | sent | partial | failed
error, sentBy (User), createdAt, completedAt
```

## Structure

```
server/src
  config.js  logger.js  app.js  index.js
  models/        User.js  Mail.js
  routes/        auth.js  mail.js
  services/      mailer.js        (nodemailer, batching, error mapping)
  middleware/    auth.js  errorHandler.js
client/src
  pages/         Login  Compose  History
  components/    Layout  RecipientInput  StatusBadge
  api.js  auth.jsx  emails.js  styles.css
```

## Production

```bash
npm run build                 # builds client/dist
NODE_ENV=production npm start # Express serves the API and the built UI on one port
```

Use a strong `JWT_SECRET`, change the seeded admin password, and put the app behind HTTPS.

## Design notes and limits

- Sending is synchronous: the request returns when all messages have been attempted. `MAX_RECIPIENTS` (default 200) keeps requests short. For thousands of recipients, move sending to a queue (BullMQ + Redis) and poll history for progress.
- Messages go out in batches of `SEND_CONCURRENCY` (default 5) over a pooled SMTP connection.
- HTML mode sends your markup as written; only the signed-in admin can send, but still avoid pasting untrusted HTML.
- Records left on "sending" by a crash are marked failed on the next start.
- There is no unsubscribe handling. If you email people who have not asked to hear from you, laws like CAN-SPAM and GDPR apply.
=======
# BulkMail
>>>>>>> 80d8d4a1adc30aa20036d30e5e49fe3f763a501e
