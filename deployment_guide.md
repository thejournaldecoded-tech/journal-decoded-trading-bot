# 🚀 Deploying JournalDecoded Trading Platform to Render & Neon (Free Tier)









## 📦 Step 1: Upload the Code to GitHub (Using Terminal & Personal Access Token)

If you are using a different GitHub account on your computer, you can authorize and push the code directly using a **Personal Access Token (classic)**.

### 1.1 Generate your GitHub Personal Access Token (PAT)
1. Log in to the GitHub account you want to use in your browser.
2. Click your profile picture (top-right) and go to **Settings**.
3. Scroll all the way down on the left sidebar and click **Developer settings**.
4. Expand **Personal access tokens** and select **Tokens (classic)**.
5. Click the **Generate new token** dropdown and select **Generate new token (classic)**.
6. Configure the token details:
   * **Note:** `antigravity-deploy` (or anything you like)
   * **Expiration:** Choose 30 days (or no expiration)
   * **Scopes:** Check the **`repo`** checkbox (this allows command line pushes to repositories).
7. Scroll to the bottom and click **Generate token**.
8. **Copy the token immediately** (it starts with `ghp_`). *You will not be able to see it again!*

### 1.2 Initialize Git & Push from the Terminal
Open your terminal in the project root (`JD-CODE-FULL-AI-ML`) and run the following commands:

1. **Initialize a local Git repository & Commit your files:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. **Rename default branch to `main`:**
   ```bash
   git branch -M main
   ```
3. **Connect to your GitHub Repository using your Token:**
   Replace `<YOUR_TOKEN>` with your copied `ghp_...` token and run:
   ```bash
   git remote add origin https://<YOUR_TOKEN>@github.com/thejournaldecoded-tech/journal-decoded-trading-bot.git
   ```
   *(If the remote `origin` already exists, run `git remote set-url origin https://<YOUR_TOKEN>@github.com/thejournaldecoded-tech/journal-decoded-trading-bot.git` instead)*
4. **Push the code to GitHub:**
   ```bash
   git push -u origin main
   ```

---

## 🗄️ Step 2: Set Up & Connect a New Neon Database
To shift your database to a fresh, globally accessible instance on Neon:

### 2.1 Create Your Neon Project
1. Log in to the [Neon Console](https://console.neon.tech/).
2. Click **Create Project**.
3. Name your project (e.g., `journal-decoded-db`).
4. Select the PostgreSQL version (default `16` or `15` is fine).
5. Choose a region closest to where you will deploy Render (e.g., **US East** or **Europe**).
6. Click **Create Project**.

### 2.2 Copy Your Connection String
1. Once created, you will see a **Connection Details** popup or a dashboard showing your connection string.
2. Ensure the selection drop-down is set to **SQLAlchemy** or **URI**.
3. Copy the connection string. It will look like:
   ```
   postgresql://neondb_owner:npg_xxxxxxx@ep-xxxx-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this string safely. This is the value you will use for your `DATABASE_URL` env variable.

### 2.3 Automatic Table Creation
You do **not** need to manually import database SQL schemas or run manual tables creation. 
On backend startup, the application runs:
```python
Base.metadata.create_all(bind=engine)
```
This automatically inspects your SQLAlchemy models (Users, Trades, Candles, etc.) and creates the entire database structure inside Neon the moment the backend connects for the first time!

---

## 📊 Step 3: Deploy Backend on Render (Web Service)
Your FastAPI backend runs as a Render **Web Service**.

1. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Select your pushed GitHub repository from the list.
3. Configure the service settings:
   - **Name**: `journaldecoded-backend` (or similar)
   - **Environment / Runtime**: `Python`
   - **Root Directory**: `backend` *(CRITICAL: Tell Render to look inside the backend subdirectory)*
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. Click **Advanced** to add **Environment Variables**:
   - Add Key: `DATABASE_URL`
     - Value: *(Paste your copied **Neon Connection String** here)*
   - Add Key: `PYTHON_VERSION`
     - Value: `3.11.0`
5. Click **Create Web Service**.
6. Wait for Render to build and deploy. Once finished, Render will display your live Backend URL at the top of the page (e.g., `https://journaldecoded-backend.onrender.com`). **Copy this URL.**

---

## 🌐 Step 4: Deploy Frontend on Render (Static Site)
Your React frontend compiles into static assets and will run on Render **Static Site** hosting.

1. In the Render Dashboard, click **New +** -> **Static Site**.
2. Select your pushed GitHub repository.
3. Configure the site settings:
   - **Name**: `journaldecoded-frontend`
   - **Root Directory**: `frontend` *(CRITICAL: Tell Render to build from the frontend subdirectory)*
   - **Branch**: `main`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`
   - **Instance Type**: `Free`
4. Click **Advanced** to add **Environment Variables**:
   - Add Key: `REACT_APP_API_URL`
     - Value: `https://journaldecoded-backend.onrender.com` *(Paste your copied Render Backend URL here, without a trailing slash)*
   - Add Key: `REACT_APP_WS_URL`
     - Value: `wss://journaldecoded-backend.onrender.com` *(Change `https` to `wss` for secure WebSockets connection)*
5. Click **Create Static Site**.
6. Wait for the build process to finish. When complete, Render will give you your live Frontend URL (e.g., `https://journaldecoded-frontend.onrender.com`).

---

## 🌱 Step 5: Seed Your New Database
Since your new Neon database is empty, you need to register a user and populate initial historical data:

1. **Register a User:**
   - Go to your live Frontend URL.
   - Go to the `/login` or register screen, or use the interactive interface to register your new account.
2. **Seed historical Candles & AI features:**
   - Open your deployed Backend Swagger documentation: `https://journaldecoded-backend.onrender.com/docs`
   - Locate the `/api/candle/seed` or `/api/bulk/seed` POST endpoints.
   - Click **Try it out** and run them to populate initial market data for models to function correctly.

---

## 🔗 Step 6: Add CORS Authorization (Optional)
By default, the backend has CORS enabled for all origins (`allow_origins=["*"]`) for development. This is already active in `backend/main.py`.

If you want to restrict access to only your deployed frontend:
1. Open [backend/main.py](file:///Users/JD-CODE-FULL-AI-ML/backend/main.py).
2. Update the CORS origins array:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-frontend-domain.onrender.com"], # Replace with your deployed frontend URL
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
3. Commit and push your changes to GitHub. Render will automatically redeploy both backend and frontend.

---

## 💡 Troubleshooting on Render Free Tier
* **Cold Starts**: Render's free tier spins down web services after 15 minutes of inactivity. The first request to your backend might take 50-60 seconds to respond as it wakes up. The frontend might show "Disconnected" or loading screens during this period.
* **WebSocket Issues**: Ensure that the `REACT_APP_WS_URL` env variable uses the `wss://` protocol (secure WebSockets), as standard `ws://` connections are blocked by browsers on HTTPS sites.
* **Log Check**: You can view the live console output in the **Logs** tab of your Render dashboard for both services.
