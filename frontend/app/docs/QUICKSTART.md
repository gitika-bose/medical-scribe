# 🚀 Medical Scribe Frontend - Quick Start Guide

## Prerequisites
- Node.js 18 or higher
- npm or pnpm package manager

## Installation & Running

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will be available at **http://localhost:5173**

### 3. Build for Production
```bash
npm run build
```

Output will be in the `dist/` folder.

## 📱 Testing on Mobile

### Test Locally on Phone
1. Find your computer's local IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` (look for inet)

2. Start dev server with host flag:
   ```bash
   npm run dev -- --host
   ```

3. Access from phone: `http://YOUR_IP:5173`

### Browser DevTools Mobile Testing
1. Open Chrome DevTools (F12)
2. Click the device toolbar icon (Ctrl+Shift+M)
3. Select a mobile device preset or custom dimensions

## 🗂️ Current App Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main app
│   │   ├── routes.ts            # Route configuration
│   │   ├── store.ts             # Mock state store
│   │   └── components/          # All components (flat structure)
│   │       ├── Login.tsx        # Login page
│   │       ├── Home.tsx         # Home dashboard
│   │       ├── Listening.tsx    # Recording interface
│   │       ├── Appointments.tsx # Appointments list
│   │       ├── AppointmentDetail.tsx # Single appointment
│   │       ├── ui/              # shadcn/ui components
│   │       └── figma/           # Figma-specific utilities
│   ├── styles/                  # CSS and styling
│   └── main.tsx                 # App entry point
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.ts               # Vite configuration
└── postcss.config.mjs           # PostCSS/Tailwind config
```

## 🧭 App Navigation Flow

```
┌──────────┐
│  Login   │ (/)
└────┬─────┘
     │
     ▼
┌──────────┐
│   Home   │ (/home)
└────┬─────┘
     │
     ├─► Start Recording
     │   ┌─────────────┐
     │   │  Listening  │ (/listening)
     │   └──────┬──────┘
     │          │
     │          ▼
     │   ┌──────────────────┐
     │   │ Appointment      │ (/appointments/:id)
     │   │ Detail           │
     │   └──────────────────┘
     │
     └─► View Appointments
         ┌──────────────┐
         │ Appointments │ (/appointments)
         │ List         │
         └──────┬───────┘
                │
                ▼
         ┌──────────────────┐
         │ Appointment      │ (/appointments/:id)
         │ Detail           │
         └──────────────────┘
```

## 📄 Pages Overview

### 1. Login (`/`)
- Entry point for authentication
- **Action needed**: Integrate with Firebase Auth

### 2. Home (`/home`)
- Main dashboard with large "Start" button
- Bottom navigation (Account, Appointments)
- **Mobile-optimized**: Large touch target for Start button

### 3. Listening (`/listening`)
- Active recording interface with pulsing mic icon
- "Generate Questions" button
- "End" button to complete recording
- **Action needed**: Integrate with audio recording API

### 4. Appointments (`/appointments`)
- List view of all appointments
- **Action needed**: Fetch from backend API

### 5. Appointment Detail (`/appointments/:id`)
- Individual appointment details
- Shows summary, plan, notes, documents
- **Action needed**: Fetch and display structured SOAP notes

## 🎨 Styling System

### Tailwind CSS
The app uses Tailwind CSS for styling. Common patterns:

```tsx
// Responsive design
<div className="p-4 md:p-6 lg:p-8">

// Mobile-first approach
<button className="w-full md:w-auto">

// Colors from theme
<div className="bg-blue-600 text-white">
```

### Theme Customization
Edit `src/styles/theme.css` to customize colors, spacing, etc.

## 🔧 Common Tasks

### Adding a New Page
1. Create component in `src/app/components/`
2. Add route in `src/app/routes.ts`
3. Update navigation as needed

### Adding a New UI Component
- Use existing shadcn/ui components from `src/app/components/ui/`
- Or create new reusable components

### Styling Tips
- Use Tailwind utilities for most styling
- Use `hover:` prefix for hover states
- Use `md:` `lg:` for responsive breakpoints
- Check `src/styles/theme.css` for custom CSS variables

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| React 18.3 | UI framework |
| React Router 7 | Client-side routing |
| Tailwind CSS 4 | Utility-first styling |
| Radix UI | Accessible UI primitives |
| Lucide React | Icon library |
| Vite 6 | Build tool & dev server |

## 🔜 Next Steps

1. **Test the app**: Run `npm run dev` and explore all pages
2. **Mobile testing**: Test on actual mobile device
3. **Review structure**: Read `FRONTEND_SETUP.md` for detailed analysis
4. **Plan integration**: Prepare for backend API integration

## 💡 Development Tips

### Hot Module Replacement (HMR)
- Vite provides instant HMR
- Changes reflect immediately without full reload
- State is preserved during updates

### TypeScript
- The app uses TypeScript
- Add type definitions for better autocomplete
- Fix any `any` types for type safety

### Component Development
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use composition over prop drilling

## 📞 Support

For issues or questions:
1. Check `FRONTEND_SETUP.md` for detailed documentation
2. Review Vite docs: https://vitejs.dev
3. Check React Router docs: https://reactrouter.com

## ✅ Verification Checklist

- [ ] Dependencies installed successfully
- [ ] Dev server runs without errors
- [ ] Can navigate between all pages
- [ ] UI renders correctly on desktop
- [ ] UI renders correctly on mobile viewport
- [ ] No console errors in browser

---

**Ready to start development!** 🎉
