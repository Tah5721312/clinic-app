# Guest Authentication Setup

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```env
# Guest Configuration (Server-side)
GUEST_EMAIL=guest@example.com
GUEST_PASSWORD=guest_password

# Public Guest Configuration (Client-side)
NEXT_PUBLIC_GUEST_EMAIL=guest@example.com
NEXT_PUBLIC_GUEST_PASSWORD=guest_password
```

## How Guest Authentication Works

1. **Guest Role**: Added to the ability system with limited permissions
2. **Guest Permissions**: Can only read Doctor and Appointment data
3. **Guest User ID**: Uses -1 as the unique identifier
4. **Authentication**: Uses environment variables for guest credentials

## Guest User Data Stored

When a user signs in as guest, the following data is stored:

```typescript
{
  id: "-1",
  name: "Guest User",
  email: process.env.GUEST_EMAIL,
  isAdmin: false,
  roleId: -1,
  isGuest: true
}
```

## Guest Permissions

- ✅ Read Doctor information
- ✅ Read Appointment information
- ❌ Create/Update/Delete any data
- ❌ Access user management
- ❌ Access admin features

## Usage

Users can click the "Sign in as Guest" button on the login page to access the application with limited permissions.
