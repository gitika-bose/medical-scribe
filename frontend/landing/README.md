# Juno Landing Page

This is the landing page for Juno, a privacy-first health companion app.

## Development

### Environment Variables

The landing page uses environment variables to configure the URL of the main Juno app:

- **Production**: Uses `VITE_APP_URL` from `.env` (points to https://patient-scribe-app.web.app)
- **Local Development**: Create a `.env.local` file with `VITE_APP_URL=http://localhost:5173` to point to your local app instance

The `.env.local` file is already in `.gitignore` (via the `*.local` pattern) and will not be committed to version control.

### Running Locally

```bash
npm install
npm run dev
```

The landing page will be available at `http://localhost:5174` (or another port if 5174 is in use).

### Building for Production

```bash
npm run build
```

### Deploying

The landing page is automatically deployed to Firebase Hosting when changes are pushed to the main branch via GitHub Actions.

## Features

- **Full-screen responsive design**: Adapts to all screen sizes (mobile, tablet, desktop)
- **Environment-aware navigation**: "Go to App" button points to production or local app based on environment
- **Privacy-focused messaging**: Highlights Juno's commitment to user privacy
- **Modern UI**: Clean, professional design with smooth animations

## Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px - 1024px
- **Large Desktop**: > 1400px
