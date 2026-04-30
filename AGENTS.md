# AGENTS.md - KFC Recruitment Website

## Structure
- **Frontend**: Next.js 14 (App Router) at root `/`
- **Backend**: NestJS at `/backend/`
- Two separate `package.json` files with their own `npm run db:*` scripts

## Prisma & Database
- Schema file: `backend/prisma/schema.prisma` (NOT at root)
- **All Prisma commands must run from `backend/` directory**
- Database port: **5433** (not default 5432)
- PostgreSQL user: `postgres`, password: `trongtriet5`
- Database name: `kfc_recruitment`

## Field Naming Convention
- **DB columns use `snake_case`** with `@map` in Prisma: `full_name`, `is_active`, etc.
- **Prisma uses camelCase** in generated types but queries use snake_case
- When fixing TypeScript errors, check:
  - `fullName` → `full_name` in select/include
  - `managedStores` → `amStores` (User→Store many-to-many)
  - `store` → `Store` for Campaign include (uppercase relation name)
  - `store` → `store` for RecruitmentProposal include (lowercase)

## Prisma Relations Gotchas
- Model names in `include` must match Prisma schema exactly:
  - Campaign: `include: { Store: true }` (capital S)
  - RecruitmentProposal: `include: { store: true }` (lowercase s)
  - Headcount: `include: { store: true }` (lowercase)
- Candidate model has NO relations to `form`, `source`, `proposal`, `auditLogs`
- RecruitmentForm has NO relations to `fields`, `positions` - query separately
- Source has NO relation to `candidates`

## Hard Delete vs Soft Delete
- **Candidate/Campaign delete**: Use `prisma.xxx.delete()` (hard delete)
- Do NOT use soft delete (`deletedAt`) - inconsistent with UI expectations
- Dashboard queries don't filter by deletedAt for hard-deleted records

## Environment Files
- Root `.env`: PostgreSQL connection (used by frontend Prisma client)
- `backend/.env`: Backend config (DATABASE_URL, JWT_SECRET, PORT, FRONTEND_URL)
- Frontend needs `NEXT_PUBLIC_API_URL=http://localhost:3001`

## Ports
- Frontend: `3000`
- Backend: **3001**

## Commands
```bash
# Backend
cd backend && npm run start:dev    # Dev server
cd backend && npm run build        # Build

# Frontend
npm run dev                        # Next.js dev server
npm run build                      # Next.js build

# Prisma
cd backend && npx prisma db push   # Sync schema to DB
cd backend && npx prisma generate  # Generate Prisma client
cd backend && npm run db:seed      # Seed data
```

## API Patterns
- List endpoints use `findMany({ include: {...} })` with explicit relations
- Single GET uses `findUnique({ include: {...} })` for full data with relations
- Form fields need separate query: `prisma.formField.findMany({ where: { formId } })`
- User roles: ADMIN, MANAGER, AM, USER (SM/TA), RECRUITER, HEAD_OF_DEPARTMENT

## Frontend Key Files
- Form management: `components/recruitment/FormsAndLinksManager.tsx`
- Candidate lists: `components/recruitment/CandidatesList.tsx`
- User settings: `app/settings/users/page.tsx`
- Public apply: `app/apply/page.tsx`

## Notes
- Backend uses `@nestjs/config` for env loading
- Global ValidationPipe with `whitelist: true` enabled
- CORS enabled for frontend origin