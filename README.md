# வதம்பை இளந்தளிர் குழு (Vadambai Ilanthazhir Kuzhu)
### Full-Stack Private Village Event Management Platform

A complete, production-ready, responsive private member-only web application built for **வதம்பை இளந்தளிர் குழு** to manage members, events, dance performances, manual UPI payment collections, income/expenses with real-time balance calculations, announcements, attendance, and private event galleries.

---

## 🌟 Key Features

1. **Bilingual Support (Tamil & English)**:
   - Instant live language switcher (`தமிழ் | English`) without page refresh.
   - Rich natural Tamil translations across all modules, forms, modals, status badges, and Excel export reports.
   - Preference saved automatically in localStorage.

2. **Role-Based Access Control (4 Roles)**:
   - **Super Admin (முதன்மை நிர்வாகி)**: Full access to all operational features, member approvals, role management, and system settings.
   - **Leader (தலைவர் / நிர்வாகி)**: Operations, member approvals, payment verification, dance management, music track uploads, income/expense management, announcements, events, attendance, gallery, and Excel financial exports.
   - **Payment Collector (கட்டண வசூலிப்பாளர்)**: View assigned UPI & QR code details, verify member payments, review pending payments.
   - **Member (உறுப்பினர்)**: View profile, check payment status, submit UPI payment details & screenshot, listen to dance audio tracks, view schedule, attendance, and gallery.

3. **Approval-Based Authentication**:
   - New registrations are placed in `Pending Approval` (`நிலுவையில்`).
   - Access to platform dashboards is restricted until approved by a Leader or Super Admin.

4. **Manual UPI Payment Collection (No Gateway Fees)**:
   - Dedicated settings for **2 Assigned Village Payment Collectors** with individual UPI IDs and QR codes.
   - Members pay directly via UPI app or QR scan, then submit the amount, UTR / Transaction ID, and payment screenshot.
   - Payment collectors or leaders verify submissions with an audit trail (`verified_by`, `verified_at`).

5. **Dance & Song Management (Simple & Practical)**:
   - Contains strictly 5 fields: *Group Name*, *Performer Name*, *Duration*, *Song*, *Status*.
   - Built-in lightweight audio player for MP3, WAV, M4A tracks with seek and volume controls.

6. **Automated Finance & Excel Statement**:
   - Dynamic real-time calculation: `Total Income - Total Expenses = Current Balance`.
   - Category-wise expense breakdown and visual ratio comparison.
   - One-click multi-sheet Excel export for Income, Expenses, and Complete Financial Statement using `xlsx`.

7. **Attendance, Announcements, Events & Gallery**:
   - Attendance sessions (e.g. Dance Practice) with quick Present / Absent toggles.
   - Color-coded Announcements by priority (*Normal*, *Important*, *Urgent*).
   - Event scheduling with venue and time tracking.
   - Private event image gallery with full-screen lightbox viewer.

---

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router 7, Lucide Icons, SheetJS (`xlsx`)
- **Backend / DB**: Supabase (PostgreSQL with Row Level Security, Supabase Auth, Supabase Storage)
- **Deployment**: Vercel ready (`vercel.json` SPA routing included)

---

## 🛠️ Quick Start & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Note: If Supabase credentials are not provided yet, the application automatically runs in rich Demo / Mock mode with full offline persistence so all features and role dashboards can be tested immediately).*

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🗄️ Database Setup (Supabase)

1. Open your Supabase SQL Editor.
2. Run the SQL script located in `supabase/schema.sql` to generate all tables, triggers, helper functions, and RLS policies.
3. (Optional) Run `supabase/seed.sql` to populate initial demo records.
4. In **Supabase Storage**, ensure the following buckets exist and have public read enabled:
   - `payment-proofs`
   - `songs`
   - `gallery`
   - `avatars`

---

## 👥 Demo Logins for Quick Testing

You can switch between any role instantly using the **Role Switcher** in the top navigation bar or log in with these demo credentials:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@vadambai.org` | Any (e.g. `123456`) | Full Admin, Settings, Roles, Finance |
| **Leader** | `leader1@vadambai.org` | Any (e.g. `123456`) | Operations, Approvals, Dances, Finance |
| **Payment Collector 1** | `collector1@vadambai.org` | Any (e.g. `123456`) | Verify Slot 1 UPI Payments |
| **Payment Collector 2** | `collector2@vadambai.org` | Any (e.g. `123456`) | Verify Slot 2 UPI Payments |
| **Approved Member** | `member@vadambai.org` | Any (e.g. `123456`) | Submit payment, View schedule & music |
| **Pending User** | `pending@vadambai.org` | Any (e.g. `123456`) | Awaiting approval screen |

---

## 📱 Mobile Friendly

Fully optimized with responsive drawer navigation, touch-friendly tables/cards, audio controls, and full mobile payment workflow for seamless village community use on any phone or tablet.
