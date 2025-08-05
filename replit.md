# LernBlitz - AI-Powered Learning Tool

## Overview

LernBlitz is a web application that generates personalized learning content using AI. Users can input any topic and instantly receive a comprehensive 7-day learning plan, interactive flashcards, and multiple-choice quizzes. The application is designed for students, apprentices, and anyone looking to learn new subjects quickly and efficiently.

The tool leverages OpenAI's GPT-4o model to create structured educational content and provides an intuitive interface for studying and sharing learning materials. Built as a viral-first web application, it prioritizes speed, accessibility, and shareability across social platforms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system for accessible, customizable components
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form processing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript throughout the entire stack for consistency and type safety
- **API Design**: REST architecture with structured error handling and request/response logging
- **Content Generation**: OpenAI GPT-4o integration for AI-powered learning content creation
- **Data Storage**: In-memory storage with interface abstraction for future database integration
- **Middleware**: CORS handling, JSON parsing, and request duration tracking

### Data Storage Solutions
- **Current Implementation**: In-memory storage using Map objects for rapid development and testing
- **Database Ready**: Drizzle ORM configured for PostgreSQL with migration support
- **Schema Design**: 
  - Users table for authentication (prepared for future implementation)
  - Learning plans table storing topic, generated content (plan, flashcards, quiz) as JSONB
  - UUID primary keys for scalability and security

### Authentication and Authorization
- **Current State**: Authentication infrastructure prepared but not implemented
- **Future Implementation**: User registration and login system with session management
- **Security**: Password hashing and secure session storage planned
- **Session Storage**: PostgreSQL-based session store configuration ready

### External Service Integrations
- **OpenAI API**: GPT-4o model for generating learning plans, flashcards, and quiz content
- **Content Generation Strategy**: Parallel API calls for faster response times
- **Error Handling**: Comprehensive error handling for AI service failures with user-friendly fallbacks
- **Rate Limiting**: Prepared for production-scale API usage management

### Key Architectural Decisions

**Monorepo Structure**: Organized as client/server/shared for code reusability and type sharing across frontend and backend.

**Type-First Development**: Shared TypeScript schemas using Zod for runtime validation and type generation, ensuring consistency between frontend and backend.

**Component-Driven UI**: Extensive use of Radix UI primitives wrapped in custom components for accessibility and consistency while maintaining design flexibility.

**AI-First Content Strategy**: Core functionality built around AI content generation with structured prompts and parallel processing for optimal user experience.

**Progressive Enhancement**: Memory storage for MVP with database infrastructure ready for scaling, allowing rapid iteration while maintaining production readiness.

**Mobile-Responsive Design**: Tailwind CSS with mobile-first approach and custom hooks for device detection, ensuring optimal experience across all devices.

The architecture prioritizes rapid development and viral growth potential while maintaining clean separation of concerns and scalability for future enhancements.