# 📧 Abandoned Cart Email Design System

## Professional Minimalist Aesthetic

All three abandoned cart recovery emails now follow the same professional minimalist design language as the existing order confirmation emails.

---

## Design Principles

### Typography
- **Headings**: Georgia serif (28px h1, 20px h2)
- **Body text**: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)
- **Font weights**: 400 for headings (elegant), 500-600 for emphasis

### Color Palette
```css
#1c1917 - Primary text (dark stone)
#78716c - Muted text (stone-500)
#fafaf9 - Background light (stone-50)
#e7e5e4 - Borders (stone-200)
#a8a29e - Footer text (stone-400)
#ffffff - Pure white for cards
```

### Layout Elements
- **Borders**: 1px solid (no rounded corners)
- **Backgrounds**: Flat colors (no gradients)
- **Accents**: Simple border-left for highlights
- **Spacing**: Generous padding (20px-30px)
- **Max-width**: 600px for emails

### Email Components
- Clean table-based layout
- Product images: 70px square with 1px border
- No shadows, no rounded corners
- Subtle hover states on buttons
- Professional CTAs with solid borders

---

## Email Templates

### 1️⃣ First Reminder (1 Hour)
**Subject**: ✨ Sie haben etwas Wunderschönes vergessen! 🛍️

**Features**:
- Gentle reminder about forgotten items
- Clean product list with images
- Simple "Zum Warenkorb" CTA button
- Minimalist footer with contact info

**Tone**: Friendly, helpful, non-pushy

---

### 2️⃣ Discount Offer (24 Hours)
**Subject**: 🎁 Nur für Sie: 10% Rabatt wartet! ✨

**Features**:
- Prominent coupon code display (bordered box, no dashed borders)
- "Exklusiver Rabatt" heading
- Professional savings calculation table
  - Zwischensumme (original price)
  - Rabatt (10%) in darker text
  - Ihr Preis (final price) with border-top separator
- Expiration date (48 hours from send)
- "Jetzt einlösen" CTA button

**Tone**: Appreciative, exclusive, value-focused

**Savings Display**:
```
Zwischensumme     €100.00
Rabatt (10%)      -€10.00
─────────────────────────
Ihr Preis         €90.00
```

---

### 3️⃣ Final Reminder (3 Days)
**Subject**: ⏰ Letzte Chance! Ihre Lieblinge warten noch 💝

**Features**:
- "Letzte Erinnerung" heading
- Urgency messaging (subtle, not aggressive)
- Product availability warning
- Conditional coupon reminder (if exists):
  - Border-left accent box
  - "Ihr Gutschein ist noch gültig"
  - Code display with emphasis
- Social proof section:
  - ⭐⭐⭐⭐⭐ (5 stars)
  - Customer quote in italics
  - "Über 10.000 zufriedene Kunden"
- Cart expiration note
- "Jetzt abschließen" CTA button

**Tone**: Final opportunity, helpful urgency, customer-centric

---

## Technical Implementation

### File Structure
```
lib/email/abandoned-cart.ts
├── sendAbandonedCartEmail1h()   - Send 1h reminder
├── sendAbandonedCartEmail24h()  - Send 24h with coupon
├── sendAbandonedCartEmail3d()   - Send 3d final reminder
├── generateEmail1hHTML()        - 1h email template
├── generateEmail24hHTML()       - 24h email template (with coupon)
└── generateEmail3dHTML()        - 3d email template (with social proof)
```

### Key Functions
```typescript
// 1h Reminder - Simple, friendly
generateEmail1hHTML(cart, recoveryUrl) 
→ Clean product list + basic CTA

// 24h Discount - Professional, value-focused
generateEmail24hHTML(cart, recoveryUrl)
→ Coupon box + savings calculation + expiration date

// 3d Final - Urgent but elegant
generateEmail3dHTML(cart, recoveryUrl)
→ Availability warning + coupon reminder + social proof + expiration note
```

### Email Components Breakdown

**Header**:
- Centered text
- Georgia serif heading
- Muted subtitle color (#78716c)
- Border-bottom separator

**Product Card**:
- Background: #fafaf9
- Border: 1px solid #e7e5e4
- Image: 70px x 70px with border
- Name: 15px, weight 500
- Quantity: 14px, muted color
- Price: 16px, weight 600

**Coupon Box** (24h only):
- Background: #ffffff
- Border: 1px solid #e7e5e4
- Center-aligned
- Uppercase label
- Large code (24px, weight 600, letter-spacing 2px)
- Expiration date below

**Savings Table** (24h only):
- Three rows: Subtotal, Discount, Final
- Border-top on final row
- Right-aligned prices
- Discount in emphasized style

**Social Proof** (3d only):
- Background: #fafaf9
- Star rating (⭐ x5)
- Italic customer quote
- Muted customer count

**CTA Button**:
- Background: #1c1917
- Color: #ffffff
- Padding: 14px 40px
- Font-size: 15px, weight 500
- Border: 1px solid #1c1917
- No border-radius

**Footer**:
- Background: #fafaf9
- Border-top separator
- Contact info
- Copyright in muted color (#a8a29e)

---

## Design Consistency

### Matches Existing Templates
All abandoned cart emails now match the professional aesthetic of:
- `lib/email/templates/orderConfirmation.ts`
- Order status update emails
- Admin notification emails

### Removed Elements
❌ Colorful gradients (linear-gradient)  
❌ Rounded corners (border-radius)  
❌ Box shadows  
❌ Emojis in headings (kept in subjects only)  
❌ Bright colors (#dc2626, #7c3aed, #f59e0b)  

### Added Elements
✅ Georgia serif typography  
✅ Professional color palette (#1c1917, #78716c)  
✅ Clean table layouts  
✅ Simple border accents (border-left)  
✅ Flat backgrounds (#fafaf9, #ffffff)  
✅ Consistent spacing and padding  

---

## Email Preview Examples

### 1h Email Structure
```
┌─────────────────────────────────────┐
│     Sie haben etwas vergessen       │ [Header]
│     Ihre Produkte warten            │
├─────────────────────────────────────┤
│  Ihr Warenkorb ist noch gespeichert │ [Message]
│  Schließen Sie Ihre Bestellung ab   │
├─────────────────────────────────────┤
│  [Image]  Product Name         €X   │ [Products]
│           Menge: 1                  │
│  ─────────────────────────────      │
│  Gesamt                       €XXX  │
├─────────────────────────────────────┤
│      [ Zum Warenkorb ]              │ [CTA]
├─────────────────────────────────────┤
│  Bei Fragen kontaktieren Sie uns    │ [Footer]
│  kontakt@beautysalon.de             │
│  © 2024 Beauty Salon                │
└─────────────────────────────────────┘
```

### 24h Email Structure
```
┌─────────────────────────────────────┐
│     Ihr exklusiver Rabatt           │ [Header]
│  Wir schenken Ihnen 10% Rabatt      │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │ [Coupon]
│  │   IHR GUTSCHEINCODE           │  │
│  │   SAVE10-XXXX                 │  │
│  │   Gültig bis 06. Dezember     │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  Als Dankeschön für Ihr Interesse   │ [Message]
│  schenken wir Ihnen 10% Rabatt      │
├─────────────────────────────────────┤
│  [Image]  Product Name    €X  €Y    │ [Products]
│           Menge: 1                  │
│  ─────────────────────────────      │
│  Zwischensumme              €100    │
│  Rabatt (10%)               -€10    │
│  ─────────────────────────────      │
│  Ihr Preis                   €90    │
├─────────────────────────────────────┤
│      [ Jetzt einlösen ]             │ [CTA]
│  Gutschein gültig für 48 Stunden    │
├─────────────────────────────────────┤
│  Bei Fragen kontaktieren Sie uns    │ [Footer]
└─────────────────────────────────────┘
```

### 3d Email Structure
```
┌─────────────────────────────────────┐
│      Letzte Erinnerung              │ [Header]
│  Ihre ausgewählten Produkte warten  │
├─────────────────────────────────────┤
│  Wir möchten Sie nicht verlieren    │ [Message]
│  Die Verfügbarkeit kann sich ändern │
├─────────────────────────────────────┤
│  [Image]  Product Name         €X   │ [Products]
│           Menge: 1                  │
│           Begrenzte Verfügbarkeit   │
│  ─────────────────────────────      │
│  Gesamt                       €XXX  │
├─────────────────────────────────────┤
│  │ Ihr Gutschein ist noch gültig    │ [Coupon]
│  │ Code SAVE10-XXXX für 10% Rabatt  │ [If exists]
├─────────────────────────────────────┤
│      [ Jetzt abschließen ]          │ [CTA]
│  Dies ist Ihre letzte Erinnerung    │
├─────────────────────────────────────┤
│        ⭐⭐⭐⭐⭐                     │ [Social]
│  "Ausgezeichnete Qualität und       │
│   schnelle Lieferung!"              │
│  Über 10.000 zufriedene Kunden      │
├─────────────────────────────────────┤
│  Ihr Warenkorb wird in Kürze        │ [Note]
│  automatisch gelöscht               │
├─────────────────────────────────────┤
│  Bei Fragen kontaktieren Sie uns    │ [Footer]
└─────────────────────────────────────┘
```

---

## Testing

To test the new email designs:

```powershell
# Trigger email sending (requires CRON_SECRET in .env.local)
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer your-cron-secret"
}
Invoke-RestMethod -Uri "http://localhost:3000/api/abandoned-cart/send-emails" `
    -Method POST `
    -Headers $headers | ConvertTo-Json -Depth 10
```

Check inbox at: **nechay1996@gmail.com**

---

## Success Metrics

Expected improvements from professional redesign:
- ✅ Higher brand consistency
- ✅ Improved trust perception
- ✅ Better mobile rendering (simple layouts)
- ✅ Professional appearance
- ✅ Clear value communication (especially 24h email)

Target recovery rate: **20-30%**  
Additional revenue: **€5,000-10,000/month**

---

## Maintenance

All email templates are in: `lib/email/abandoned-cart.ts`

To update:
1. Modify HTML in `generateEmail{1h|24h|3d}HTML()` functions
2. Keep color palette consistent (#1c1917, #78716c, #fafaf9)
3. Use Georgia serif for headings
4. Maintain 1px solid borders (no rounded corners)
5. Test rendering in multiple email clients
6. Verify mobile responsiveness

---

## Reference

**Color Variables** (for future updates):
```css
--text-primary: #1c1917;    /* Headings, emphasis */
--text-muted: #78716c;      /* Secondary text, labels */
--bg-light: #fafaf9;        /* Card backgrounds */
--border: #e7e5e4;          /* Dividers, borders */
--footer: #a8a29e;          /* Footer text */
--white: #ffffff;           /* Pure white */
```

**Typography Scale**:
```css
h1: 28px Georgia serif
h2: 20px Georgia serif
body: 15px system fonts
small: 13px system fonts
footer: 12px system fonts
```

---

**Last Updated**: December 2024  
**Status**: ✅ Production Ready  
**Design System**: Professional Minimalist  
