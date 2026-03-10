## Technology Stack

This project is a browser-based web application built with the following technologies:

### Core Framework
- **Next.js 16** - React framework with the App Router
- **TypeScript 5** - Type-safe JavaScript for better developer experience
- **Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### UI Components & Styling
- **shadcn/ui** - Accessible component library built on Radix UI
- **Lucide React** - Icon library
- **Framer Motion** - Animation library for React
- **Next Themes** - Dark/light mode support

### Forms & Validation
- **React Hook Form** - Performant forms with validation
- **Zod** - TypeScript-first schema validation

### State Management & Data Fetching
- **Zustand** - Simple, scalable state management
- **TanStack Query** - Data fetching and synchronization
- **Fetch API** - HTTP requests

### Database & Backend
- **Prisma** - Type-safe ORM
- **NextAuth.js** - Authentication solution

### Advanced UI Features
- **TanStack Table** - Tables and data grids
- **DND Kit** - Drag-and-drop toolkit for React
- **Recharts** - Charting library
- **Sharp** - Image processing

### Internationalization & Utilities
- **Next Intl** - Internationalization for Next.js
- **date-fns** - Date utilities
- **ReactUse** - Collection of useful React hooks

## Project Overview

FraudGuard is a modern dashboard-style web application that runs in the browser.  
It is designed to demonstrate fraud detection and monitoring concepts, including data visualization, authentication, and a responsive user interface.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
└── lib/                # Utility functions and configurations
```

## Available Features & Components

This project includes a comprehensive set of modern web development tools:

### UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio, Resizable Panels
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast (Sonner), Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu, Pagination
- **Overlay**: Dialog, Sheet, Popover, Tooltip, Hover Card
- **Data Display**: Badge, Avatar, Calendar

### Advanced Data Features
- **Tables**: Powerful data tables with sorting, filtering, pagination (TanStack Table)
- **Charts**: Beautiful visualizations with Recharts
- **Forms**: Type-safe forms with React Hook Form + Zod validation

### Interactive Features
- **Animations**: Smooth micro-interactions with Framer Motion
- **Drag & Drop**: Modern drag-and-drop functionality with DND Kit
- **Theme Switching**: Built-in dark/light mode support

### Backend Integration
- **Authentication**: Ready-to-use auth flows with NextAuth.js
- **Database**: Type-safe database operations with Prisma
- **API Client**: HTTP requests with Fetch + TanStack Query
- **State Management**: Simple and scalable with Zustand

### Production Features
- **Internationalization**: Multi-language support with Next Intl
- **Image Optimization**: Automatic image processing with Sharp
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Essential Hooks**: 100+ useful React hooks with ReactUse for common patterns

---
