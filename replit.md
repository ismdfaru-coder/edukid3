# EduKid Learning Platform

## Overview

EduKid is a gamified, adaptive learning platform for children aged 5-14, inspired by the Sumdog learning system. The platform supports three user roles (Student, Teacher, Parent) and focuses on UK National Curriculum coverage (KS1, KS2, KS3 foundations). The system separates learning logic from game mechanics, featuring adaptive question delivery, mastery tracking, and role-specific dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for playful UI interactions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Session Management**: express-session with MemoryStore
- **API Design**: RESTful endpoints defined in shared/routes.ts with Zod validation

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: shared/schema.ts (shared between client and server)
- **Migrations**: drizzle-kit for schema management
- **Validation**: drizzle-zod for type-safe schema validation

### Authentication
- Role-based authentication (student, teacher, parent)
- Session-based auth with express-session
- Picture password support for young students (icon-based login)
- Standard username/password for teachers and parents

### Core Domain Models
- **Users**: Students, teachers, parents with role-specific fields
- **Classes**: Teacher-managed groups with join codes
- **Subjects/Topics**: Curriculum-aligned content hierarchy
- **Questions**: Multiple choice and drag-drop question types
- **Mastery**: Per-student, per-topic progress tracking
- **Learning Events**: Individual answer logs for analytics

### Key Design Patterns
- Shared types between frontend and backend via @shared alias
- API route definitions with Zod schemas for type safety
- Role-based protected routes in React
- Storage interface pattern for database abstraction

## External Dependencies

### Database
- PostgreSQL (configured via DATABASE_URL environment variable)
- Connection pooling via node-postgres (pg)

### UI Framework
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS for styling
- Google Fonts: Architects Daughter (playful), Outfit, Fredoka

### Session Storage
- MemoryStore for development (should use connect-pg-simple for production)

### Build & Development
- Vite for frontend bundling
- esbuild for server bundling
- Replit-specific plugins for development experience