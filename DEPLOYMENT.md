# Secret Santa Backend Deployment

## Railway Deployment

### Quick Deploy

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables** in Railway Dashboard:
   - `PORT`: 3001 (Railway sets this automatically)
   - `NODE_ENV`: production
   - `CORS_ORIGIN`: https://yourusername.github.io (replace with your GitHub Pages URL)

4. **Get Your API URL**
   - Railway will provide a URL like: `https://your-app.up.railway.app`
   - Copy this URL

5. **Update Frontend Config**
   - Edit `js/config.js`:
   ```javascript
   window.ENV = {
     API_URL: 'https://your-app.up.railway.app/api'
   };
   ```

### Manual Deployment (Alternative)

1. Push your `backend/` folder to a GitHub repository
2. In Railway dashboard:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set root directory to `backend/`
3. Railway will auto-detect Node.js and deploy

### Database Persistence

The `database.json` file will persist on Railway's filesystem. For production use, consider upgrading to PostgreSQL:

```bash
railway add postgresql
```

Then update `database.js` to use PostgreSQL instead of JSON file storage.

### Testing

After deployment:
```bash
curl https://your-app.up.railway.app/api/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## GitHub Pages (Frontend)

1. **Update Config** with Railway URL in `js/config.js`
2. **Push to GitHub**
3. **Enable GitHub Pages** in repository settings → Pages → main branch
4. Your frontend will be at: `https://yourusername.github.io/secret-santa`

## Local Development

```bash
# Backend
cd backend
npm install
node server.js

# Frontend
# Just open index.html or use Live Server
```
