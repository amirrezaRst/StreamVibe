![StreamVibe](https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/project-thumbnail.jpg?raw=true)

# <img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/logo.png?raw=true" alt="StreamVibe logo" width="42" height="42" valign="middle"> StreamVibe

**A full-stack streaming platform — movies, TV series, cinema ticketing and paid subscriptions — built end-to-end with the MERN stack and Next.js.**

[![GitHub stars](https://img.shields.io/github/stars/amirrezaRst/StreamVibe?style=social)](https://github.com/amirrezaRst/StreamVibe/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/amirrezaRst/StreamVibe?style=social)](https://github.com/amirrezaRst/StreamVibe/network/members)
[![Live Demo](https://img.shields.io/badge/demo-streamvibe.arostami.dev-E50000?logo=vercel&logoColor=white)](https://streamvibe.arostami.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)

---

## Table of Contents
1. [Overview](#overview)
2. [Screenshots](#screenshots)
3. [Features](#features)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Live Demo](#live-demo)
8. [License](#license)
9. [Contact](#contact)

---

## **Overview** <a name="overview"></a>

StreamVibe is a fully working streaming platform, not a UI mockup with placeholder data. Every feature listed below is wired end-to-end: real Stripe checkout for cinema tickets and subscriptions, a real seat-hold system with expiry, a real admin console with revenue analytics, and a real content catalogue — **43 movies, 34 series, 307 episodes, 163 actors, 68 directors and 24 composers** — sourced from Wikipedia and reproducible from an empty database with one command (`npm run seed`).

It's built as a portfolio piece that demonstrates production-shaped decisions rather than tutorial shortcuts: server-side price enforcement instead of trusting the client, idempotent payment webhooks, plan-gated download/quality entitlements checked on the server, and a seed pipeline that turns a fresh clone into a working demo without a database dump.

### Highlights
- 🎬 **Real catalogue** — movies, series and episodes with genuine metadata, cast/crew credits and artwork pulled from Wikipedia, not lorem-ipsum placeholders.
- 💳 **Real payments** — Stripe Checkout for both cinema ticket purchases and subscription plans, with webhook-verified, idempotent activation and refund handling.
- 🎟️ **Cinema booking** — cinema/hall selection, a live seat map with time-limited holds, and a ticket history you can look up by booking code.
- 🔐 **Plan-gated entitlements** — download access and max streaming quality are enforced server-side per subscription tier, not just hidden in the UI.
- 🛠️ **A real admin console** — catalogue CRUD, booking/payment ledgers, revenue analytics, review moderation, and cast/crew management, all behind role-gated routes.
- 📱 **Responsive, accessible UI** — built with Tailwind, keyboard-navigable, with dedicated loading/empty/error states instead of infinite skeletons.

---

## **Screenshots** <a name="screenshots"></a>

<table>
<tr>
<td width="50%">

**Homepage**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/home.jpg?raw=true" alt="StreamVibe homepage" width="100%">

</td>
<td width="50%">

**Movie detail**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/movie-detail.jpg?raw=true" alt="Movie detail page" width="100%">

</td>
</tr>
<tr>
<td width="50%">

**Explore — spotlight carousel**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/explore-spotlight.jpg?raw=true" alt="Explore page spotlight carousel" width="100%">

</td>
<td width="50%">

**Cinema booking — live seat map**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/cinema-booking.jpg?raw=true" alt="Cinema seat selection and booking" width="100%">

</td>
</tr>
<tr>
<td width="50%">

**Subscription plans**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/subscriptions.jpg?raw=true" alt="Subscription plans and comparison table" width="100%">

</td>
<td width="50%">

**Custom 404 — "Scene Missing"**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/error-404.jpg?raw=true" alt="Branded 404 error page" width="100%">

</td>
</tr>
</table>

### Admin console

<table>
<tr>
<td width="50%">

**Overview — revenue & analytics**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/admin-overview.jpg?raw=true" alt="Admin dashboard overview with revenue chart" width="100%">

</td>
<td width="50%">

**Catalogue management**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/admin-movies.jpg?raw=true" alt="Admin movie catalogue table" width="100%">

</td>
</tr>
<tr>
<td width="50%">

**Bookings & payments ledger**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/admin-bookings.jpg?raw=true" alt="Admin bookings and payment status ledger" width="100%">

</td>
<td width="50%">

**Cast & crew management**
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/admin-people.jpg?raw=true" alt="Admin people (cast and crew) management" width="100%">

</td>
</tr>
</table>

<details>
<summary><b>Mobile view</b></summary>
<br>
<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/mobile-home.jpg?raw=true" alt="Mobile responsive homepage" width="320">
</details>

---

## **Features** <a name="features"></a>

### Streaming & Discovery
- Movie and TV series catalogue with genre browsing, trending/most-popular/new-released rails, and full-text search across titles and people.
- A custom video player with quality switching that resumes at the same timestamp instead of restarting, buffering states, and full keyboard controls.
- Actor, director and composer pages with filmography, linked from every title they're credited on.
- Reviews with star ratings, spoiler-veiled text, and admin moderation before anything goes public.
- Server-rendered pages with real `generateMetadata`, Open Graph tags, JSON-LD structured data, and a dynamically generated sitemap/robots.txt.

### Cinema Booking & Payments
- Cinema and showtime selection by date, with a live seat map (standard / premium / VIP pricing tiers).
- Seats are held with a countdown timer and released automatically if checkout isn't completed — no permanently "stuck" reservations.
- Real Stripe Checkout for ticket purchases, with webhook-verified confirmation, idempotent activation (safe to call twice), and automatic refunds when a hold expires mid-payment or a booking is cancelled.

### Subscriptions & Billing
- Three subscription tiers (Basic / Standard / Premium) with monthly and yearly billing, checked out through Stripe.
- Entitlements — max streaming quality and download access — are enforced **server-side** per plan, not just hidden behind a disabled button in the UI.
- Free trial flow, plan comparison table, and a return page that reconciles the Stripe session before showing success.

### Admin Console
- Full CRUD for movies, series, episodes, cast, crew and composers, with drag-to-reorder spotlight curation.
- Revenue and ticket-sales analytics with a real time-series chart, top-titles ranking, and occupancy stats.
- Booking and payment ledgers with per-transaction status (paid / refunded / expired), searchable by booking code.
- Cinema, hall and showtime management; user management; review moderation queue; support ticket inbox.
- A guarded delete flow: removing a director, actor or musician who's still credited on a title is blocked with a clear message instead of silently orphaning the reference.

### Reliability & Polish
- A one-command, idempotent seed pipeline (`npm run seed`) that populates a brand-new database with a full working catalogue — no database dump required to get a working demo running.
- Branded 404 and error pages (shown above) instead of framework defaults, with dedicated `not-found` and `error` boundaries throughout the app.
- JWT access + refresh token auth with httpOnly cookies, rate-limited auth endpoints, and `helmet`-hardened HTTP headers.
- Joi validation on every write path, kept in sync with the Mongoose schemas it guards.

---

## **Tech Stack** <a name="tech-stack"></a>

### Frontend
<p align="left">
  <img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/nextjs-logo.png?raw=true" alt="Next.js" width="50" style="margin: 0 12px;">
  <img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/reactjs-logo.png?raw=true" alt="React" width="50" style="margin: 0 12px;">
  <img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/tailwind-logo.png?raw=true" alt="Tailwind CSS" width="50" style="margin: 0 12px;">
</p>

Next.js 14 (App Router) · React 18 · Tailwind CSS · Zustand for client state · react-hook-form · react-toastify

### Backend
<p align="left">
  <img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/nodejs-logo.png?raw=true" alt="Node.js" width="50" style="margin: 0 12px;">
  <img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/expressjs-logo.png?raw=true" alt="Express.js" width="50" style="margin: 0 12px;">
  <img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/mongodb-logo.png?raw=true" alt="MongoDB" width="50" style="margin: 0 12px;">
</p>

Node.js · Express · MongoDB / Mongoose · Joi validation · JWT auth (access + refresh) · Stripe (Checkout, webhooks, refunds) · Multer (uploads) · Sharp (image processing) · Resend (transactional email) · Helmet + express-rate-limit

---

## **Getting Started** <a name="getting-started"></a>

You'll need Node.js and a MongoDB instance (local or Atlas) before starting. The project is split into two independent apps — `backend` and `frontend` — each with its own dependencies and its own dev server.

### 1. Clone the repository
```bash
git clone https://github.com/amirrezaRst/StreamVibe.git
cd StreamVibe
```

### 2. Backend setup
```bash
cd backend
npm install
cp config/config.env.example config/config.env
```
Fill in `config/config.env` — every value is commented with where to get it (Mongo connection string, JWT secrets, a [Resend](https://resend.com) API key, and **test-mode** Stripe keys from the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys); this project never touches real money).

Start the API:
```bash
npm run dev
```
This runs at `http://localhost:5000`. Make sure MongoDB is reachable first.

**Seed the catalogue** — a fresh database has no movies, series, cast, cinemas or hero carousel:
```bash
npm run seed
```
This runs every seed step in the order it depends on: real movie/series/actor/director data with generated art, slugs, composer credits and bios, cinemas/halls/showtimes, the explore-page spotlight, then real posters, cast photos and Season 1 episode data pulled from Wikipedia. On a machine with no network access, use `npm run seed:offline` instead to skip the Wikipedia-dependent steps (the catalogue still works, just with generated placeholder art and no episodes). Only run it once — re-running it against an already-seeded database resets uploaded art and video files back to placeholders.

### 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
The default `.env` already points at `http://localhost:5000` — no changes needed for local development. This runs at `http://localhost:3000`.

### 4. You're running StreamVibe
Open `http://localhost:3000` with both servers up. To reach the admin console at `/admin`, promote a registered account's `role` to `"admin"` directly in MongoDB (there's no self-serve admin signup, by design).

> **Testing payments locally:** cinema checkout and subscriptions both go through Stripe Checkout in test mode. To receive webhook events locally, run the [Stripe CLI](https://docs.stripe.com/stripe-cli): `stripe listen --forward-to localhost:5000/api/payment/webhook`, and paste the signing secret it prints into `STRIPE_WEBHOOK_SECRET`.

---

## **Environment Variables** <a name="environment-variables"></a>

Both apps ship a committed `.env.example` — `backend/config/config.env.example` and `frontend/.env.example` — with every variable documented inline. Copy them to `config.env` / `.env` and fill in real values rather than reading a table here that could drift out of sync with the code.

---

## **Live Demo** <a name="live-demo"></a>

🔗 **[streamvibe.arostami.dev](https://streamvibe.arostami.dev/)**

The live deployment runs the same codebase as this repository, connected to a real (test-mode) Stripe account — cinema tickets and subscriptions can be checked out end-to-end without any special setup.

<img src="https://github.com/amirrezaRst/StreamVibe/blob/master/frontend/public/github/screenshots/full-homepage.jpg?raw=true" alt="StreamVibe homepage — full page" width="100%">

---

## **License** <a name="license"></a>

This project doesn't currently ship a formal open-source license — it's shared as a portfolio and reference piece. If you'd like to reuse, fork, or build on it beyond that, reach out (see [Contact](#contact)) and we can sort out terms.

---

## **Contact**

If you're looking for collaboration on web or app development projects, or if you're in need of professional software development services, we'd be happy to connect. We are open to working with clients and other developers to deliver high-quality, successful projects.

- 📧 Email: [amirreza.rostami.0073@gmail.com](mailto:amirreza.rostami.0073@gmail.com)
- 🌐 Website: [https://arostami.dev/en](https://arostami.dev/en)
- 💼 LinkedIn: [LinkedIn Profile](https://www.linkedin.com/in/amirreza-rostami-2861b7265/)
- 🌐 Telegram: [Telegram](https://web.telegram.org/a/#478283953)

Feel free to get in touch via email or social media if you're interested in working together.
