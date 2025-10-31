# Quick Start Guide: Secret Santa Exchange Platform

## 🎄 Local Development Setup

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Text editor or IDE
- Optional: Local web server for development

### Option 1: Direct File Opening (Simplest)
1. Clone or download the repository
2. Open `index.html` directly in your web browser
3. Start developing! Changes are immediately visible on refresh

### Option 2: Local Web Server (Recommended)
```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)  
npx http-server .

# Using PHP (if installed)
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## 🚀 GitHub Pages Deployment

### Automatic Deployment
1. Push your code to GitHub repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch"
4. Choose "main" branch and "/ (root)"
5. Your site will be live at `https://yourusername.github.io/repository-name`

### Custom Domain (Optional)
1. Add a `CNAME` file to repository root with your domain
2. Configure DNS with your domain provider
3. Enable "Enforce HTTPS" in GitHub Pages settings

## 👥 Using the Application

### For Admins

#### Creating Your First Exchange
1. **Register as Admin**:
   - Open the application
   - Click "Register" 
   - Enter your name and email
   - Set role to "Admin" (typically first user becomes admin)

2. **Create Exchange**:
   - Navigate to Admin Dashboard
   - Click "Create New Exchange"
   - Enter festive name (e.g., "Office Holiday Party 2025")
   - Set gift budget (e.g., "$25", "Under $50")
   - Save the exchange

3. **Share with Participants**:
   - Copy the exchange URL or share the main site link
   - Participants can browse and join available exchanges

4. **Generate Gift Assignments**:
   - Wait for at least 3 participants to join
   - Click "Generate Assignments" in the exchange
   - Assignments are automatically created and participants notified

### For Participants

#### Joining an Exchange
1. **Register**:
   - Visit the site
   - Click "Register"
   - Enter your name and email
   - Add your gift preferences/wish list

2. **Join Exchange**:
   - Browse available exchanges
   - Click "Join" on your preferred exchange
   - You're now part of the Secret Santa!

3. **View Your Assignment**:
   - After admin generates assignments
   - Check your dashboard to see who you're giving a gift to
   - View their wish list and the gift budget

## 🛠️ Development Workflow

### File Structure Overview
```
├── index.html              # Main entry point
├── css/                    # Styles and Christmas theme
├── js/                     # Application logic
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   └── components/        # UI components
├── assets/                # Images and icons
└── tests/                 # Basic test pages
```

### Making Changes
1. **Styles**: Edit files in `css/` directory
2. **Logic**: Modify JavaScript files in `js/` directory
3. **Theme**: Update `css/christmas.css` for festive elements
4. **Test**: Open `tests/basic-flows.html` to verify functionality

### Adding New Features
1. Create new component in `js/components/`
2. Add corresponding styles in `css/`
3. Update router in `js/app.js` if new page needed
4. Test functionality with sample data

## 🎨 Christmas Theme Customization

### Color Scheme
- Primary: `#c41e3a` (Christmas Red)
- Secondary: `#2e7d32` (Christmas Green)  
- Accent: `#ffd700` (Gold)
- Background: `#f8f9fa` (Snow White)

### Adding Festive Elements
- Update `css/christmas.css` for animations
- Modify Christmas greetings in `js/services/theme.js`
- Add seasonal graphics to `assets/images/`

## 📱 Mobile Compatibility

The application is fully responsive and works on:
- iOS Safari (iPhone/iPad)
- Android Chrome
- Mobile Firefox
- All modern mobile browsers

## 🔧 Troubleshooting

### Common Issues

**"Can't see my data after refresh"**
- Check if localStorage is enabled in your browser
- Private/incognito mode may clear data on close

**"Assignment generation failed"**
- Ensure at least 3 participants have joined
- Check browser console for error messages

**"Site not loading on GitHub Pages"**
- Verify repository is public or you have GitHub Pro
- Check that `index.html` exists in the root directory
- Allow up to 10 minutes for deployment

**"Mobile layout looks broken"**
- Clear browser cache
- Check viewport meta tag in `index.html`
- Test on different mobile browsers

### Getting Help
1. Check browser developer console for JavaScript errors
2. Verify all files are properly linked in `index.html`
3. Test with different browsers to isolate issues
4. Use browser debugging tools to inspect localStorage data

## 🎯 Next Steps

After setup:
1. **Customize Theme**: Personalize colors and Christmas elements
2. **Add Features**: Extend functionality based on user feedback
3. **Optimize**: Minify CSS/JS for better performance
4. **Monitor**: Check GitHub Pages analytics and user feedback

Your Secret Santa Exchange Platform is now ready to spread holiday cheer! 🎅🎁