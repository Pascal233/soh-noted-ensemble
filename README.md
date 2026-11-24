# Soh NOTED Ensemble — Website

> **"Noted Well"** | Kumasi, Ashanti, Ghana

---

## Project Structure

```
Soh NOTED Ensemble/
├── index.html          ← Full website (all sections, single page)
├── css/
│   └── styles.css      ← All styles — Montserrat + Cormorant Garamond
├── js/
│   └── main.js         ← Navigation, ticket modal, Paystack, MoMo/USSD
├── images/
│   └── logo.png        ← ⚠ Add your logo file here (name it logo.png)
└── README.md
```

---

## To Open the Website

Open `index.html` in any browser — no server or install needed.

---

## What is on the Website

| Section | What it shows |
|---|---|
| **Hero** | Your name, tagline, logo, location, stats |
| **What We Do** | 6 cards explaining concerts, sacred music, event performances, workshops, soloists, recordings |
| **About** | Your story, values (excellence, community, heritage, inspiration) |
| **Repertoire** | 4 music genre cards on a navy background |
| **Concerts** | 3 concert cards with Buy Tickets button each |
| **Gallery** | Photo grid (replace placeholders with real photos) |
| **Team** | 8 member cards (fill in real names) |
| **Testimonials** | 6 audience / client reviews |
| **Contact** | Address, phone, email, rehearsal times, social links, contact form |

---

## Fonts Used

- **Montserrat** — body text, navigation, labels (Google Fonts, free)
- **Cormorant Garamond** — headings, display text, quotes (Google Fonts, free)

---

## Things to Customise Before Going Live

### 1. Add your logo
Copy your logo image to `images/` and name it `logo.png`.

### 2. Add your Paystack public key
In `js/main.js` around line 93, replace:
```js
const KEY = 'pk_live_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY';
```
Get your key from [dashboard.paystack.com](https://dashboard.paystack.com).

### 3. Add your phone number
Search for `+233 XX XXX XXXX` in `index.html` and replace with your real number. There are several places — in the contact section, MoMo instructions, and USSD box.

### 4. Add your email
Replace `info@sohnoted.com` with your real email address.

### 5. Add team member names
In `index.html`, scroll to the **Team** section and fill in real names, roles, and voice parts.

### 6. Add real gallery photos
Replace the placeholder tiles in the **Gallery** section with:
```html
<img src="images/your-photo.jpg" alt="Description" style="width:100%;height:100%;object-fit:cover;" />
```

### 7. Update concert details
Update dates, venues and prices in both `index.html` (concert cards) and `js/main.js` (the `CONCERTS` object).

### 8. Add social media links
Search for `href="#"` on the social link buttons and replace `#` with your real profile URLs.

### 9. Connect the contact form
Currently the form simulates sending. For real email delivery:
- **Formspree** (free): [formspree.io](https://formspree.io) — add your endpoint to the form action
- **EmailJS**: [emailjs.com](https://www.emailjs.com) — works from the browser with no backend

### 10. Add your rehearsal venue
Search for `[Add rehearsal venue]` and replace with the real location.

---

## Payment Methods

| Method | How it works |
|---|---|
| **Paystack** | Card and bank transfer — handled via Paystack popup |
| **MTN Mobile Money** | Customer dials `*170#` and sends to your merchant number |
| **Vodafone Cash** | Customer dials `*110#` |
| **AirtelTigo** | Customer dials `*500#` |
| **Pay at Door** | Customer reserves a seat, pays at the venue on the night |

---

## Brand Colours

| Colour | Hex |
|---|---|
| Navy Blue | `#1a2a5e` |
| Crimson Red | `#8b1a2e` |
| Gold Accent | `#c9a84c` |
| White | `#ffffff` |

---

## Free Hosting

Drag the whole folder to [app.netlify.com/drop](https://app.netlify.com/drop) — your site goes live instantly at a free URL with no sign-up required.
