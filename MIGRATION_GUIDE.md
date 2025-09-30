# Migration Guide - Client Creation Refactor

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Clerk account and project set up
- Both frontend (Next.js) and backend (Express) codebases ready

## Step-by-Step Migration

### Step 1: Database Migration

```bash
# Navigate to your project root
cd /path/to/next-shadcn-dashboard-starter

# Generate and apply Prisma migration
npx prisma migrate dev --name add_agency_roles_and_timestamps

# This will:
# - Add new AGENCY_ADMIN, AGENCY_ANALYST, CLIENT_VIEWER roles
# - Add createdAt and updatedAt to Client model
# - Keep INTERNAL_ADMIN and CLIENT_MEMBER for backward compatibility
```

**If you have existing data**, run this SQL after migration:

```sql
-- Map old roles to new roles
UPDATE "ClientMembership" 
SET role = 'AGENCY_ADMIN' 
WHERE role = 'INTERNAL_ADMIN';

UPDATE "ClientMembership" 
SET role = 'CLIENT_VIEWER' 
WHERE role = 'CLIENT_MEMBER';

-- Verify the changes
SELECT role, COUNT(*) 
FROM "ClientMembership" 
GROUP BY role;
```

### Step 2: Update Environment Variables

Add to your `.env.local`:

```env
# Backend API URL (required for production)
ATLAS_BACKEND_URL=http://localhost:3001

# Or for deployment
ATLAS_BACKEND_URL=https://your-backend-domain.com

# Existing Clerk variables (ensure these are set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database (existing)
DATABASE_DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Step 3: Configure Clerk Webhooks

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Configure:
   ```
   Endpoint URL: https://your-domain.com/api/clerk/webhook
   
   Select Events:
   ✓ organization.created
   ✓ organization.deleted
   ✓ organizationMembership.created
   ✓ organizationMembership.updated
   ✓ organizationMembership.deleted
   ✓ organizationInvitation.accepted
   ```
6. Copy the **Signing Secret** and add to `.env.local` as `CLERK_WEBHOOK_SECRET`

### Step 4: Assign Agency Roles to Users

For users who should be able to create and manage clients:

#### Via Clerk Dashboard:
1. Go to **Users**
2. Select the user
3. Click **Metadata** tab
4. Add to **Public metadata**:
   ```json
   {
     "roles": ["AGENCY_ADMIN"]
   }
   ```
5. Click **Save**

#### Via API (programmatic):
```typescript
import { clerkClient } from '@clerk/nextjs/server';

const clerk = await clerkClient();

await clerk.users.updateUserMetadata('user_xxx', {
  publicMetadata: {
    roles: ['AGENCY_ADMIN'] // or 'AGENCY_ANALYST'
  }
});
```

### Step 5: Install Dependencies (if needed)

The refactor uses existing dependencies, but verify you have:

```bash
npm install zod react-hook-form @hookform/resolvers sonner
# or
pnpm add zod react-hook-form @hookform/resolvers sonner
```

### Step 6: Restart Services

```bash
# Terminal 1: Backend (Express)
node index.js

# Terminal 2: Frontend (Next.js)
npm run dev
```

### Step 7: Test the Implementation

#### Test 1: Create a Client (Agency User)

1. Log in with a user that has `AGENCY_ADMIN` role
2. Look for "New Client" button in the sidebar under "Management"
3. Click and fill in the form:
   - **Client Name**: "Test Client"
   - **Primary Domain**: "https://example.com"
   - **CRON Schedule**: "0 3 * * 1" (optional)
   - **Kick off crawl**: Toggle on
4. Click "Create Client"
5. Should redirect to `/dashboard/{clientId}/overview`

**Verify:**
- ✓ Client appears in database
- ✓ Clerk organization created
- ✓ Crawl started (if toggled)
- ✓ User can see client in sidebar dropdown

#### Test 2: Invite User to Client

1. Navigate to a client dashboard
2. Look for "Invite User" button (in header or page)
3. Click and enter:
   - **Email**: "newuser@example.com"
   - **Role**: "Client Admin" or "Client Viewer"
4. Click "Send Invite"

**Verify:**
- ✓ User receives Clerk invitation email
- ✓ Toast notification shows success

#### Test 3: Accept Invitation

1. Log out from agency user
2. Log in as the invited user (or create account via invitation link)
3. Accept the organization invitation

**Verify:**
- ✓ User sees the client in their client list
- ✓ ClientMembership record created via webhook
- ✓ User can access client dashboard
- ✓ Permissions match assigned role

#### Test 4: Client User Access

1. Log in as CLIENT_VIEWER user
2. Try to access "New Client" button

**Verify:**
- ✓ Button should NOT appear (agency only)
- ✓ User can view client data
- ✓ User cannot modify settings (if role is VIEWER)

## Troubleshooting

### Issue: "New Client" button not appearing

**Solution:**
1. Check user has agency role in Clerk metadata
2. Verify role is in `publicMetadata` not `privateMetadata`
3. Log out and log back in to refresh session
4. Check browser console for errors

### Issue: Webhook not syncing memberships

**Solution:**
1. Verify webhook endpoint is accessible (not localhost in production)
2. Check webhook signing secret matches `.env.local`
3. View webhook logs in Clerk Dashboard
4. Test webhook with Clerk's test feature

### Issue: Backend not receiving requests

**Solution:**
1. Verify `ATLAS_BACKEND_URL` is set correctly
2. Check CORS configuration in `index.js`
3. Ensure backend is running on correct port
4. Check network tab in browser for failed requests

### Issue: Client creation fails

**Solution:**
1. Check database connection
2. Verify Prisma schema is up to date: `npx prisma generate`
3. Check backend logs for errors
4. Verify Clerk API keys are valid

### Issue: TypeScript errors in new files

**Solution:**
1. Regenerate Prisma types: `npx prisma generate`
2. Restart TypeScript server in IDE
3. Check all imports are correct
4. Run `npm run build` to see all errors

## Rollback Plan

If you need to rollback:

### 1. Revert Database Migration
```bash
# This will rollback the last migration
npx prisma migrate resolve --rolled-back add_agency_roles_and_timestamps
```

### 2. Remove New Files
```bash
rm src/lib/auth/index.ts
rm src/lib/rbac.ts
rm src/lib/api-client.ts
rm src/lib/client-actions.ts
rm src/app/api/create-client/route.ts
rm src/app/api/invite/route.ts
rm src/components/common/create-client-dialog.tsx
rm src/components/common/invite-user-dialog.tsx
rm src/components/common/client-header.tsx
```

### 3. Restore Original Files
Use git to restore modified files:
```bash
git checkout HEAD -- index.js
git checkout HEAD -- src/app/new-client/page.tsx
git checkout HEAD -- src/components/layout/app-sidebar.tsx
git checkout HEAD -- src/app/api/clerk/webhook/route.ts
git checkout HEAD -- prisma/schema.prisma
```

## Post-Migration Checklist

- [ ] Database migrated successfully
- [ ] Environment variables configured
- [ ] Clerk webhooks set up
- [ ] Agency roles assigned to admin users
- [ ] Client creation tested
- [ ] User invitation tested
- [ ] Access control verified
- [ ] Existing clients still accessible
- [ ] Backend endpoints working
- [ ] Frontend builds without errors

## Next Steps

1. **Add Invite Button to Pages**: Add `<ClientHeader>` component to client dashboard pages where you want invite functionality

2. **Create Agency Dashboard**: Build a dedicated overview page for agency users showing all clients

3. **Add Client Management Page**: Create `/dashboard/clients` page for agency users to manage all clients

4. **Enhance Permissions**: Add fine-grained permissions for different actions

5. **Add Audit Logging**: Track client creation, invitations, and role changes

6. **Monitor Webhooks**: Set up alerts for webhook failures

## Support

For issues or questions:
- Check `REFACTOR_SUMMARY.md` for detailed implementation notes
- Review code comments in new files
- Check Clerk documentation: https://clerk.com/docs
- Review Prisma docs: https://www.prisma.io/docs

---

**Migration completed successfully! 🎉**
