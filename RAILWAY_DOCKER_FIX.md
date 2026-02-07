# Railway Docker Build Error - FIXED

## ❌ Error: `/requirements.txt: not found`

**Root Cause**: Railway is building from the **project root** instead of the `backend/` folder.

## ✅ **SOLUTION (Choose One)**

### Option 1: Set Root Directory (Recommended)

1. **Railway Dashboard** → Your service → **Settings**
2. **Source** section → **Root Directory**
3. Enter: `backend`
4. Click **Update**
5. Go to **Deployments** → **Redeploy**

This tells Railway to build from the `backend/` folder where all files are located.

---

### Option 2: Delete and Recreate Service

If the Root Directory setting doesn't appear or doesn't work:

1. **Delete** the current Railway service
2. **New** → **Deploy from GitHub repo**
3. Select your `metis` repository
4. **IMPORTANT**: During setup, under **Variables** or **Settings**:
   - Find **Root Directory** or **Source Directory**
   - Set it to: `backend`
5. Add all environment variables
6. Deploy

---

### Option 3: Use Nixpacks Instead of Docker

If you prefer Nixpacks (Railway's build system):

1. **Railway Settings** → **Build**
2. Change **Builder** from "Dockerfile" to "Nixpacks"
3. Make sure **Root Directory** is set to `backend`
4. Redeploy

The `nixpacks.toml` and `railway.json` files I created will handle the build.

---

## 🔍 Why This Happened

Railway is executing:
```bash
# From project root (WRONG)
docker build -f backend/Dockerfile .

# It should be:
docker build -f Dockerfile backend/
# OR build from backend directory
```

The Dockerfile says `COPY requirements.txt .` which expects `requirements.txt` in the same directory. But from the root, that file is at `backend/requirements.txt`.

---

## 📋 **Verification Steps**

After setting Root Directory to `backend`:

1. **Check Build Logs** - Should show:
   ```
   ✓ COPY requirements.txt .
   ✓ RUN pip install -r requirements.txt
   ```

2. **Check Deploy Logs** - Should show:
   ```
   Starting gunicorn...
   Listening on 0.0.0.0:5000
   ```

3. **Test Health Check**:
   ```bash
   curl https://your-railway-url.up.railway.app/
   # Should return: "Hello, World! MongoDB is connected..."
   ```

---

## 🎯 **Quick Checklist**

- [ ] Root Directory = `backend` ← **THIS IS THE FIX**
- [ ] Environment variables added (MONGO_URI, GROQ_API_KEY, etc.)
- [ ] Builder = Dockerfile or Nixpacks (both work)
- [ ] Redeploy after changing settings

---

## 📸 **Where to Find Root Directory Setting**

**Railway Dashboard:**
```
Service → Settings → Source → Root Directory
```

Type: `backend`
Click: Update

---

## 🆘 **Still Not Working?**

If you don't see a "Root Directory" field in Railway:

1. Your Railway project might be old
2. Delete the service and create new one
3. Railway will ask for Root Directory during creation
4. Or use Railway CLI:

```bash
railway up --service backend --path ./backend
```
