# Admin Panel Setup Guide

## Overview
This admin panel is built with Next.js, NextAuth.js, and shadcn/ui components. It provides a complete admin interface with authentication, route protection, and user management features.

## Features

### 🔐 Authentication
- **Static Credentials**: Simple login system with predefined users
- **Role-based Access**: Admin and regular user roles
- **Route Protection**: Middleware-based route protection

### 👥 User Management
- **User Dashboard**: Overview of all platform users
- **User Statistics**: Active, inactive, and pending users
- **User Actions**: Edit, email, and manage users
- **Search & Filter**: Find users by name or email

### 📊 Analytics
- **Performance Metrics**: Page views, unique visitors, conversion rates
- **User Growth**: Monthly registration trends
- **Traffic Sources**: Where users come from
- **Top Pages**: Most visited pages

### ⚙️ Settings
- **General Settings**: Site name, description, contact emails
- **User Management**: Registration and verification settings
- **File Upload**: Size limits and allowed file types
- **Notifications**: Email notification preferences
- **System Settings**: Maintenance mode and security options

## Login Credentials

### Admin User
- **Email**: `admin@example.com`
- **Password**: `123456789`
- **Role**: Admin (access to all admin features)

### Regular User
- **Email**: `user@example.com`
- **Password**: `user123`
- **Role**: Regular User (redirected to dashboard)

## File Structure

```
src/app/
├── admin/
│   ├── layout.tsx          # Admin layout with sidebar navigation
│   ├── dashboard/
│   │   └── page.tsx        # Main admin dashboard
│   ├── users/
│   │   └── page.tsx        # User management page
│   ├── analytics/
│   │   └── page.tsx        # Analytics and reports
│   └── settings/
│       └── page.tsx        # Platform settings
├── (auth_route)/
│   └── login/
│       └── page.tsx        # Login page
├── api/auth/
│   └── [...nextauth]/
│       └── route.ts        # NextAuth configuration
└── middleware.ts           # Route protection middleware
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Access Admin Panel**
   - Navigate to `http://localhost:3000/login`
   - Login with admin credentials: `admin@example.com` / `123456789`
   - You'll be redirected to the admin dashboard

## Route Protection

The middleware automatically:
- Redirects unauthenticated users to `/login`
- Redirects non-admin users away from `/admin/*` routes
- Redirects admin users to `/admin/dashboard` when accessing other routes

## Customization

### Adding New Admin Pages
1. Create a new page in `src/app/admin/your-page/page.tsx`
2. Add navigation item in `src/app/admin/layout.tsx`
3. The route will be automatically protected by middleware

### Modifying User Roles
Edit the `STATIC_USERS` array in `src/app/api/auth/[...nextauth]/route.ts` to add new users or modify roles.

### Styling
The admin panel uses Tailwind CSS with shadcn/ui components. Customize the appearance by modifying the component classes or adding new CSS.

## Security Notes

- This is a demo setup with static credentials
- In production, implement proper password hashing
- Add database integration for user management
- Implement proper session management
- Add CSRF protection and other security measures

## Dependencies

- **Next.js 15**: React framework
- **NextAuth.js**: Authentication
- **shadcn/ui**: UI components
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Formik & Yup**: Form handling and validation
