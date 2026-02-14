# Medical Scribe Frontend - Setup & Organization Guide

## 📋 Current Structure Analysis

### Tech Stack
- **Framework:** React 18.3.1 with TypeScript
- **Build Tool:** Vite 6.3.5
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4.1.12
- **UI Components:** Radix UI (shadcn/ui style) + Material UI
- **State Management:** Simple in-memory store (needs upgrade)

### Current Pages
1. **Login** (`/`) - Authentication entry point
2. **Home** (`/home`) - Main dashboard with Start button
3. **Listening** (`/listening`) - Active recording interface
4. **Appointments** (`/appointments`) - List of all appointments
5. **AppointmentDetail** (`/appointments/:id`) - Individual appointment view

### Current Issues
❌ **Flat component structure** - All components in one directory
❌ **No clear separation** between pages, layouts, and reusable components
❌ **Mock state management** - Simple in-memory store
❌ **Mixed UI libraries** - Both Radix UI and Material UI (unnecessary duplication)
❌ **No type definitions** - TypeScript types scattered

## 🎯 Recommended Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main app component
│   │   └── routes.tsx           # Route definitions
│   ├── pages/                   # Page components
│   │   ├── LoginPage/
│   │   │   ├── index.tsx
│   │   │   └── LoginPage.module.css (if needed)
│   │   ├── HomePage/
│   │   │   └── index.tsx
│   │   ├── ListeningPage/
│   │   │   └── index.tsx
│   │   ├── AppointmentsPage/
│   │   │   └── index.tsx
│   │   └── AppointmentDetailPage/
│   │       └── index.tsx
│   ├── components/              # Reusable components
│   │   ├── ui/                  # shadcn/ui components (keep as-is)
│   │   ├── shared/              # Shared components
│   │   │   ├── BottomNav/
│   │   │   ├── RecordButton/
│   │   │   └── AppointmentCard/
│   │   └── layout/              # Layout components
│   │       ├── MainLayout/
│   │       └── AuthLayout/
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useRecording.ts
│   │   └── useAppointments.ts
│   ├── lib/                     # Utilities and helpers
│   │   ├── api.ts               # API client (future)
│   │   ├── storage.ts           # Local storage utilities
│   │   └── utils.ts             # General utilities
│   ├── types/                   # TypeScript type definitions
│   │   ├── appointment.ts
│   │   ├── user.ts
│   │   └── api.ts
│   ├── store/                   # State management
│   │   ├── index.ts             # Main store setup
│   │   ├── appointmentStore.ts  # Appointment state
│   │   └── authStore.ts         # Auth state
│   └── styles/                  # Global styles
│       ├── fonts.css
│       ├── tailwind.css
│       ├── theme.css
│       └── index.css
```

## 📱 Mobile-First Design Principles

The app is already using Tailwind's responsive classes, but we should ensure:

### Responsive Breakpoints
```css
/* Tailwind default breakpoints - already configured */
sm: 640px   // Small devices
md: 768px   // Medium devices  
lg: 1024px  // Large devices
xl: 1280px  // Extra large devices
```

### Mobile Optimizations
- ✅ **Touch targets**: Min 44x44px for buttons (currently implemented)
- ✅ **Bottom navigation**: Easily reachable (already in Home.tsx)
- ✅ **Large tap areas**: Start button is adequately sized
- ⚠️ **Viewport meta**: Need to verify in index.html
- ⚠️ **Safe areas**: iOS notch/home indicator padding needed
- ⚠️ **Orientation lock**: Consider for recording screen

## 🚀 How to Run

### Prerequisites
```bash
Node.js 18+ and npm/pnpm
```

### Installation
```bash
cd frontend
npm install
# or
pnpm install
```

### Development Server
```bash
npm run dev
# App will be available at http://localhost:5173
```

### Build for Production
```bash
npm run build
# Output will be in dist/
```

### Preview Production Build
```bash
npm run preview
```

## 🔧 Next Steps (Implementation Plan)

### Phase 1: Reorganization (Current)
- [x] Analyze current structure
- [ ] Create new folder structure
- [ ] Move components to appropriate folders
- [ ] Update import paths
- [ ] Test that everything still works

### Phase 2: Mobile Optimization
- [ ] Add viewport meta tags
- [ ] Implement safe area insets for iOS
- [ ] Add touch feedback for all buttons
- [ ] Test on various screen sizes
- [ ] Add loading states and skeletons

### Phase 3: State Management
- [ ] Replace mock store with proper state management
- [ ] Add localStorage persistence
- [ ] Implement optimistic updates

### Phase 4: API Integration (Future)
- [ ] Create API client
- [ ] Integrate with backend endpoints
- [ ] Add error handling
- [ ] Implement authentication flow

## 📝 Component Organization Guidelines

### Pages
- One page component per route
- Contains page-specific logic
- Composes reusable components
- Handles data fetching

### Components
- **UI Components**: Low-level, reusable (buttons, inputs, cards)
- **Shared Components**: Higher-level, reusable across pages
- **Layout Components**: Page layouts, navigation

### File Naming
- **Pages**: `HomePage`, `LoginPage`, etc.
- **Components**: `BottomNav`, `RecordButton`, etc.
- **Hooks**: `useAuth`, `useAppointments`, etc.
- **Types**: `appointment.ts`, `user.ts`, etc.

## 🎨 Styling Approach

### Current Setup
- **Tailwind CSS**: Utility-first approach
- **CSS Modules**: Available but not heavily used
- **Theme**: Custom colors and variables in theme.css

### Best Practices
- Use Tailwind utilities for most styling
- Use CSS modules for complex component-specific styles
- Keep theme variables in theme.css
- Use className composition with `clsx` or `cn` helper

## 🔐 Environment Variables

Create `.env.local` for local development:
```env
VITE_API_URL=http://localhost:8080
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
```

## 🧪 Testing (Future)

Recommended setup:
- **Unit Tests**: Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright or Cypress

## 📦 Dependencies Review

### Keep
- React Router (navigation)
- Radix UI (accessible components)
- Tailwind CSS (styling)
- Lucide React (icons)

### Consider Removing
- Material UI (duplicates Radix UI functionality)
- React Slick (if not needed)
- React DnD (if not needed)

### Consider Adding
- Zustand or Jotai (lightweight state management)
- React Query/TanStack Query (API state management)
- Zod (schema validation)


