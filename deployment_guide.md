# 🚀 Deploying JournalDecoded Trading Platform to Render & Neon (Free Tier)




## 📊 Step 3: Deploy Backend on Render (Web Service)
Your FastAPI backend runs as a Render **Web Service**.




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
