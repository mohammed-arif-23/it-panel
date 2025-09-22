# Unified College Application System

A comprehensive web application that combines NPTEL course tracking and seminar booking systems into a single unified platform for college students.

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Getting Started](#getting-started)
6. [User Guide](#user-guide)
7. [Development Guide](#development-guide)
8. [Project Structure](#project-structure)

## Overview

The Unified College Application System is a Next.js 15 web application designed to streamline two critical academic activities for college students:
1. **NPTEL Course Tracking** - Manage weekly assignments and track progress for online courses
2. **Seminar Booking** - Book presentation slots with a fair random selection system

The system provides a unified authentication mechanism where students can access both services using a single registration number, making it convenient to manage all academic activities in one place.

## Key Features

### 🎓 NPTEL Course Management
- **Course Enrollment**: Register for NPTEL courses with course details
- **Progress Tracking**: Visual progress indicators with completion percentages
- **Weekly Assignment Management**: Update status for each week's assignments (Not Started → In Progress → Completed)
- **Time-Based Unlocking**: Weeks unlock automatically after completing the previous week
- **Multi-Course Support**: Enroll in multiple courses simultaneously

### 📅 Seminar Booking System
- **Daily Booking Window**: Book presentation slots during designated hours (6:00 PM - 11:59 PM)
- **Fair Selection Process**: Random student selection at midnight using a transparent algorithm
- **Real-Time Status Updates**: View today's and tomorrow's selections instantly
- **Holiday Awareness**: Automatic rescheduling when seminars fall on holidays
- **Presentation History**: Track past and upcoming presentations

### 📋 Assignment Submission
- **Class-Specific Assignments**: View assignments relevant to your class year
- **Cloud Storage Integration**: Secure file uploads to Cloudinary
- **Submission Tracking**: Monitor submitted assignments and received marks
- **Deadline Management**: Clear visibility of due dates and overdue status

### 🔐 Unified Authentication
- **Single Registration**: One-time registration with registration number
- **Service Registration**: Choose which services to use (NPTEL, Seminar, or both)
- **Password Management**: Secure password setting and reset functionality
- **Profile Management**: Complete and update personal information
- **Persistent Sessions**: Stay logged in across visits

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktops, tablets, and mobile devices
- **Intuitive Navigation**: Clean and user-friendly interface
- **Real-Time Feedback**: Instant status updates and notifications
- **Visual Indicators**: Color-coded status badges and progress bars

## Technology Stack

- **Frontend Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **Database**: Supabase (PostgreSQL)
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Authentication**: Custom implementation with localStorage
- **Cloud Storage**: Cloudinary for file uploads
- **Email Service**: Nodemailer for OTP delivery

## System Architecture

### Frontend Architecture
The application follows a component-based architecture with:
- **Next.js App Router**: For server-side rendering and routing
- **React Context API**: For global state management (AuthContext)
- **Reusable UI Components**: Custom-built components using Tailwind CSS
- **Protected Routes**: Automatic redirection based on authentication status

### Backend Architecture
- **Supabase Backend**: As a service (BaaS) for database operations
- **API Routes**: Next.js API routes for server-side logic
- **Database Helpers**: Utility functions for common database operations
- **Service Layer**: Specialized services for holidays, fines, and time management

### Data Flow
1. **Authentication**: User logs in with registration number
2. **Profile Verification**: System checks if profile is complete
3. **Service Access**: User navigates to desired service (NPTEL/Seminar/Assignments)
4. **Data Operations**: CRUD operations through Supabase database
5. **Real-Time Updates**: Automatic UI refresh on data changes

## Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or pnpm package manager
- Supabase account for database
- Cloudinary account for file storage (optional)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd unified-college-app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
Create a `.env.local` file in the root directory with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**:
- Create a new Supabase project
- Run the SQL script from `database-schema.sql` in your Supabase SQL editor

5. **Development Server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Deployment
For production deployment:
```bash
npm run build
npm run start
```

Recommended hosting platforms:
- Vercel (optimal for Next.js applications)
- Netlify
- Any Node.js compatible hosting service

## User Guide

### Registration and Login

1. **Initial Access**:
   - Visit the homepage
   - Enter your registration number to begin
   - If you're a new user, your account will be automatically created

2. **Profile Setup**:
   - Complete your profile with name, email, mobile, and class year
   - This information is required to access system features

3. **Password Management**:
   - Set a password for your account during first login
   - Use the "Forgot Password" feature to reset if needed
   - OTP-based verification for password changes

### NPTEL Course Tracking

1. **Course Registration**:
   - Navigate to NPTEL section from dashboard
   - Fill in course details (name, ID, duration)
   - Submit registration form

2. **Progress Management**:
   - View weekly assignments in a grid layout
   - Update status using dropdown menus
   - Weeks unlock automatically after completing previous week
   - Track overall progress with visual indicators

### Seminar Booking

1. **Booking Process**:
   - Access seminar section from dashboard
   - Enter your presentation topic
   - Submit booking during open window (6:00 PM - 11:59 PM)

2. **Selection System**:
   - Random selection occurs at midnight
   - View today's and tomorrow's selections
   - Check presentation history

3. **Holiday Handling**:
   - System automatically reschedules seminars on holidays
   - Notifications for rescheduled dates

### Assignment Submission

1. **View Assignments**:
   - Access assignments section from dashboard
   - See class-specific assignments with due dates

2. **Submit Work**:
   - Upload PDF files (up to 10MB)
   - Track submission status
   - View marks when graded

## Development Guide

### Project Structure
```
unified-college-app/
├── app/                          # Next.js app directory with pages
│   ├── layout.tsx               # Root layout with AuthProvider
│   ├── page.tsx                 # Home page with login
│   ├── nptel/                   # NPTEL dashboard
│   ├── seminar/                 # Seminar dashboard
│   ├── assignments/             # Assignment management
│   ├── profile/                 # Profile management
│   ├── verify/                  # Password verification
│   └── register/                # Registration pages
├── components/                   # Reusable UI components
│   ├── ui/                      # Base UI components
│   └── admin/                   # Admin-specific components
├── contexts/                     # React contexts
│   └── AuthContext.tsx         # Authentication state management
├── lib/                         # Utility libraries
│   ├── supabase.ts             # Database client and helpers
│   ├── time-utils.ts           # Time management utilities
│   └── utils.ts                # General utilities
├── types/                       # TypeScript type definitions
└── public/                      # Static assets
```

### Key Components

#### Authentication System
- Located in `contexts/AuthContext.tsx`
- Manages user state, login/logout functionality
- Handles service registrations and profile data

#### NPTEL Module
- Main file: `app/nptel/page.tsx`
- Features course enrollment and progress tracking
- Implements time-based week unlocking

#### Seminar Module
- Main file: `app/seminar/page.tsx`
- Handles booking, selection, and presentation tracking
- Integrates with holiday service for rescheduling

#### Assignments Module
- Main file: `app/assignments/page.tsx`
- Manages assignment viewing and submission
- Integrates with Cloudinary for file storage

### Development Best Practices

1. **Type Safety**: Use TypeScript for all components and utilities
2. **Component Reusability**: Create reusable UI components in `components/`
3. **State Management**: Use React Context for global state
4. **API Integration**: Use Next.js API routes for server-side logic
5. **Error Handling**: Implement proper error handling and user feedback
6. **Responsive Design**: Ensure mobile-first responsive design
7. **Performance**: Optimize loading states and data fetching

### Customization

#### Styling
- Use Tailwind CSS classes for styling
- Maintain consistent color scheme and typography
- Follow existing component patterns

#### Adding New Features
1. Create new pages in `app/` directory
2. Implement required components in `components/`
3. Add necessary API routes in `app/api/`
4. Update types in `types/` if needed
5. Add database schema updates if required

## Contributing

When contributing to this project:

1. Follow the existing code structure and naming conventions
2. Use TypeScript for type safety
3. Implement proper error handling
4. Add appropriate loading states
5. Ensure responsive design
6. Test all functionalities thoroughly

## Support

For issues or questions about the unified college application system:

1. Check the database schema in `database-schema.sql`
2. Review the type definitions in `types/database.ts`
3. Examine the helper functions in `lib/supabase.ts`
4. Test authentication flow in `contexts/AuthContext.tsx`

## License

This project is designed for educational institutions and internal college use.