# Quick Start - Client Creation Refactor

## 🚀 Get Running in 5 Minutes

### 1. Run Database Migration
```bash
npx prisma migrate dev --name add_agency_roles_and_timestamps
```

### 2. Set Environment Variable
Add to `.env.local`:
```env
ATLAS_BACKEND_URL=http://localhost:3001
```

### 3. Assign Agency Role
In [Clerk Dashboard](https://dashboard.clerk.com) → Users → [Your User] → Metadata:

Add to **Public metadata**:
```json
{
  "roles": ["AGENCY_ADMIN"]
}
```

### 4. Restart Servers
```bash
# Terminal 1 - Backend
node index.js

# Terminal 2 - Frontend  
npm run dev
```

### 5. Test It Out!

1. **Log out and back in** (to refresh Clerk session)
2. Look for **"New Client"** button in sidebar
3. Click it, fill the form, create a client! 🎉

---

## What Changed?

### New Features ✨
- **Dialog-based client creation** (no more full page)
- **Clerk organization integration** (multi-tenant!)
- **Role-based access control** (Agency vs Client users)
- **User invitation system** (invite users to clients)
- **Automatic webhook sync** (Clerk → Database)

### New Components 🎨
- `CreateClientDialog` - Modern dialog for creating clients
- `InviteUserDialog` - Invite users to client organizations
- `ClientHeader` - Header with invite button (optional)

### New API Routes 🛣️
- `POST /api/create-client` - Creates client + Clerk org
- `POST /api/invite` - Sends Clerk invitation

### New Libraries 📚
- `/src/lib/auth/index.ts` - Authentication helpers
- `/src/lib/rbac.ts` - Role-based access control
- `/src/lib/api-client.ts` - Server-side data fetching
- `/src/lib/client-actions.ts` - Client-side actions

---

## Role Types

| Role | Can Create Clients | Can Invite Users | Can View All Clients |
|------|-------------------|------------------|---------------------|
| **AGENCY_ADMIN** | ✅ | ✅ | ✅ |
| **AGENCY_ANALYST** | ✅ | ✅ | ✅ |
| **CLIENT_ADMIN** | ❌ | ⚠️ (own org only) | ❌ |
| **CLIENT_VIEWER** | ❌ | ❌ | ❌ |

---

## Usage Examples

### Create a Client
```typescript
import { createClientAction } from '@/lib/client-actions';

const result = await createClientAction({
  name: 'Acme Corp',
  url: 'https://acme.com',
  cron: '0 3 * * 1', // Optional: Weekly on Monday at 3am
  startCrawl: true
});

// result = { clientId: 123, redirectUrl: '/dashboard/123/overview' }
```

### Invite a User
```typescript
import { inviteUserAction } from '@/lib/client-actions';

await inviteUserAction({
  clientId: 123,
  email: 'user@example.com',
  role: 'CLIENT_ADMIN' // or 'CLIENT_VIEWER'
});
```

### Check Permissions (Server)
```typescript
import { requireAgencyAccess, canManageClient } from '@/lib/rbac';

// Enforce agency access (redirects if not authorized)
const roles = await requireAgencyAccess();

// Check permissions
if (canManageClient(roles)) {
  // User can manage clients
}
```

### Fetch Clients (Server Component)
```typescript
import { listClients, getClient } from '@/lib/api-client';

// Get all clients
const clients = await listClients();

// Get specific client
const client = await getClient(123);
```

---

## Adding Invite Button to Pages

Want the invite button on a specific page? Add this:

```tsx
import { ClientHeader } from '@/components/common/client-header';

export default function YourPage({ clientId }: { clientId: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Client Dashboard</h1>
        <ClientHeader clientId={clientId} clientName="Client Name" />
      </div>
      {/* Rest of your page */}
    </div>
  );
}
```

---

## Webhook Setup (Production)

For production, configure Clerk webhooks:

1. **Clerk Dashboard** → Webhooks → Add Endpoint
2. **URL**: `https://yourdomain.com/api/clerk/webhook`
3. **Events**: Select all `organization.*` and `organizationMembership.*` events
4. **Copy signing secret** to `CLERK_WEBHOOK_SECRET` env var

---

## Troubleshooting

**Button not showing?**
- Log out and back in
- Check `publicMetadata.roles` in Clerk
- Clear browser cache

**Webhook not working?**
- Check `CLERK_WEBHOOK_SECRET` is set
- Ensure endpoint is publicly accessible
- View logs in Clerk Dashboard

**Backend errors?**
- Verify `ATLAS_BACKEND_URL` is correct
- Check backend is running
- Review CORS settings in `index.js`

---

## Files Reference

📄 **Full documentation**: `REFACTOR_SUMMARY.md`
📋 **Step-by-step migration**: `MIGRATION_GUIDE.md`
🎯 **This quick start**: `QUICK_START.md`

---

**You're all set! Happy coding! 🚀**
