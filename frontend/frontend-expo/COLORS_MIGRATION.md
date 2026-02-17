# Color Migration Guide for Frontend-Expo

This document tracks the migration from hardcoded colors to the centralized `Colors` constant based on `frontend/shared-theme.css`.

## Brand Color Mapping

### Red (Primary Brand Color)
- **Old**: `#DC2626`, `#B91C1C`, `#FEF2F2`, `#FEE2E2`, `#FECACA`
- **New**: `Colors.red[600]`, `Colors.red[700]`, `Colors.red[50]`, `Colors.red[100]`, `Colors.red[300]`
- **Usage**: Error states, recording button, destructive actions

### Blue (Secondary Brand Color)
- **Old**: `#2563EB`, `#3B82F6`, `#1D4ED8`, `#EFF6FF`, `#DBEAFE`, `#93C5FD`
- **New**: `Colors.blue[600]`, `Colors.blue[500]`, `Colors.blue[700]`, `Colors.blue[50]`, `Colors.blue[100]`, `Colors.blue[300]`
- **Usage**: Primary actions, links, in-progress states

### Neutral Grays
- **Old**: `#111`, `#374151`, `#6B7280`, `#9CA3AF`, `#E5E7EB`, `#F9FAFB`
- **New**: `Colors.primary`, `Colors.gray[700]`, `Colors.gray[500]`, `Colors.gray[400]`, `Colors.border`, `Colors.gray[50]`
- **Usage**: Text, borders, backgrounds

## Migration Status

### ✅ Completed Files
- [x] `constants/Colors.ts` - Created centralized color constants
- [x] `app/(tabs)/_layout.tsx` - Tab bar colors
- [x] `app/(tabs)/index.tsx` - Home screen
- [x] `app/(tabs)/appointments.tsx` - Appointments list

### 🔄 Remaining Files (To Be Updated)
The following files still contain hardcoded colors and should be updated:

#### High Priority (User-facing components)
- [ ] `components/shared/AlertModal.tsx`
- [ ] `components/shared/GuestDisclaimer.tsx`
- [ ] `components/shared/DeleteAppointmentButton.tsx`
- [ ] `components/pages/home/QuestionsModal.tsx`
- [ ] `app/login.tsx`
- [x] `app/appointment-metadata.tsx`
- [x] `app/appointment/[id].tsx`

#### Medium Priority (Detail screens)
- [ ] `components/pages/appointment-detail/DiagnosisSection.tsx`
- [ ] `components/pages/appointment-detail/FollowUpSection.tsx`
- [ ] `components/pages/appointment-detail/LearningsSection.tsx`
- [ ] `components/pages/appointment-detail/ReasonForVisitSection.tsx`
- [ ] `components/pages/appointment-detail/SummarySection.tsx`
- [ ] `components/pages/appointment-detail/TodosSection.tsx`

#### Low Priority (Other screens)
- [ ] `app/onboarding.tsx`
- [ ] `app/modal.tsx`
- [ ] `app/+not-found.tsx`
- [ ] `app/_layout.tsx`
- [ ] `components/shared/ReadMore.tsx`
- [ ] `assets/images/NotepadIllustration.tsx`

## Color Replacement Patterns

### Common Replacements
```typescript
// Import at top of file
import { Colors } from '@/constants/Colors';

// Background colors
'#fff' → Colors.background
'#F9FAFB' → Colors.gray[50]

// Text colors
'#111' → Colors.primary
'#6B7280' → Colors.gray[500]
'#374151' → Colors.gray[700]

// Border colors
'#E5E7EB' → Colors.border

// Brand colors
'#2563EB' → Colors.blue[600]  // Primary blue
'#DC2626' → Colors.red[600]   // Primary red
'#B91C1C' → Colors.red[700]   // Dark red

// Error states
'#FEF2F2' → Colors.red[50]    // Light red background
'#FECACA' → Colors.red[300]   // Red border

// Success states
'#DCFCE7' → Colors.green[500] // Light green (note: adjusted from legacy)
'#15803D' → Use Colors.primaryForeground on green background
```

## Notes
- The brand colors (red and blue) are now consistent with `frontend/app` and `frontend/landing`
- Legacy colors are kept in `LegacyColors` for backward compatibility during migration
- Green color for success states has been adjusted to match the brand palette (`#a37b73`)
- All white text should use `Colors.primaryForeground` for consistency
