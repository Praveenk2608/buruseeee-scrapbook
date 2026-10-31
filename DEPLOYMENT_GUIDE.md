# 🎀 BURUSEEEE'S BIRTHDAY SURPRISE WEBSITE
## Cloud Storage & Public Deployment Guide (Supabase + Vercel)

This guide takes you step-by-step through connecting **Supabase Cloud Storage** and deploying your website on **Vercel** with a single public link that works on both mobile and desktop!

---

### 🛡️ Security Overview
* **No Secret Keys Exposed**: The app only uses the public `anon` key. The `service-role` secret key is never used.
* **No Account Required for Visitors**: Buruseeee and friends can open the website link on any phone or computer without signing up or logging in.
* **Admin PIN Protection**: Uploading, editing, and deleting memories is locked behind your secret PIN (default: `2608`).

---

## ☁️ STEP 1: Set Up Supabase (100% Free)

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **"New Project"**, name it `buruseeee-birthday`, choose a database password and nearest region.
3. Once the project finishes creating (takes ~1 minute), click on the **SQL Editor** tab in the left sidebar.
4. Click **"New query"**, paste the entire contents of [`supabase_setup.sql`](file:///C:/Users/prave/Downloads/buruseeee-scrapbook/supabase_setup.sql), and click **RUN**.
   > *This automatically creates the `birthday-media` storage bucket, `birthday_wishes_videos` table, `birthday_gallery_photos` table, public read access, and Realtime sync!*
5. In the left sidebar, click **Project Settings** (gear icon) ➡️ **API**.
6. Copy these two values:
   - **Project URL** (e.g. `https://your-id.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

## 💻 STEP 2: Test Locally with Cloud Storage (Optional)

1. In your project directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Paste your Supabase values into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_ADMIN_PIN=2608
   ```
3. Run `npm run dev`. The website will show **"Cloud Sync On"** in the gallery and wishes sections!

---

## 🚀 STEP 3: Deploy to Vercel via GitHub

### A. Push Code to GitHub
1. Open your terminal in `C:\Users\prave\Downloads\buruseeee-scrapbook`.
2. Run:
   ```bash
   git init
   git add .
   git commit -m "feat: baby pink birthday scrapbook for buruseeee with cloud storage"
   git branch -M main
   ```
3. Create a new private or public repository on [GitHub](https://github.com/new) named `buruseeee-scrapbook`.
4. Link and push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/buruseeee-scrapbook.git
   git push -u origin main
   ```

### B. Deploy on Vercel
1. Go to [https://vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New..."** ➡️ **"Project"**.
3. Find your `buruseeee-scrapbook` repository and click **"Import"**.
4. In the **Environment Variables** section, add:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon public key |
   | `VITE_ADMIN_PIN` | `2608` (or your chosen secret PIN) |
5. Click **"Deploy"**!
6. Vercel will build and assign your website a public link like `https://buruseeee-scrapbook.vercel.app`.

---

## 📱 How to Use on Mobile & Desktop

1. **Viewing**: Anyone opening the link will see the complete scrapbook, all 53 original photos, the 8 friendship chapters, games, music, cake, and all uploaded wishes videos!
2. **Uploading Friends' Videos**:
   - Scroll to **"MESSAGES FROM MY FAVOURITE PEOPLE 💌"**.
   - Click **"Upload Videos"**. If locked, enter PIN `2608`.
   - Select MP4, MOV, or WEBM files.
   - Enter your friend's name and cute caption.
   - The video is instantly saved to Supabase Cloud and becomes visible to everyone worldwide!
3. **Uploading New Photos**:
   - Scroll to **"Our Photo Gallery"**.
   - Click **"Upload Photos"**. Enter PIN `2608` if prompted.
   - The photos are immediately stored in the cloud and pinned to the Polaroid wall.
