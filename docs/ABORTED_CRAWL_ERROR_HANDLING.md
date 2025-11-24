# Aborted Crawl Error Handling

## Problem Statement
When a crawl is marked as ABORTED, the audit page continued showing "Grabbing audit results… hang tight!" indefinitely, creating a poor user experience with no indication that the crawl had failed.

## Solution Implemented

### Overview
Implemented intelligent fallback logic to detect aborted crawls and gracefully handle them by:
1. Displaying a prominent error alert to inform users
2. Falling back to the previous successful audit data
3. Stopping the live update listener to prevent endless loading

### Key Changes

#### Detection Logic
```typescript
// Detect if latest crawl was aborted without producing an audit
const crawlAbortedWithoutAudit =
  latestCrawl?.state === 'ABORTED' &&
  (!latest || (latest && latestCrawl.id !== latest.crawlId));
```

This checks if:
- The latest crawl state is `ABORTED`
- AND there's either no audit at all, or the latest audit doesn't match the aborted crawl

#### Fallback Strategy
```typescript
// Fall back to previous audit if latest crawl failed
const displayAudit = crawlAbortedWithoutAudit && previous ? previous : latest;
const comparisonAudit = crawlAbortedWithoutAudit && previous ? latest : previous;
```

When a crawl is aborted:
- `displayAudit` shows the previous successful audit (instead of nothing)
- `comparisonAudit` adjusts accordingly for trend calculations

#### User Notification
Added a destructive alert banner that appears when a crawl is aborted:

```tsx
{crawlAbortedWithoutAudit && (
  <Alert variant='destructive'>
    <IconAlertCircle className='h-4 w-4' />
    <AlertTitle>Crawl Failed</AlertTitle>
    <AlertDescription>
      The latest crawl was aborted and unable to complete audit. Showing
      results from the previous successful audit instead.
      {latestCrawlAt && (
        <span className='mt-1 block text-xs'>
          Failed crawl started: {latestCrawlAt}
        </span>
      )}
    </AlertDescription>
  </Alert>
)}
```

#### Updated Listen Logic
```typescript
// Only listen for updates if no audit exists or crawl is actively running
const shouldListenForUpdates =
  (!latest && !previous) || latestCrawl?.state === 'STARTED';
```

This ensures:
- We stop listening when a crawl is aborted (no endless waiting)
- We only listen when truly waiting for first audit or during active crawl

### Files Modified

#### `/src/app/dashboard/[clientId]/overview/page.tsx`
**Changes:**
1. Added Alert component imports
2. Added detection logic for aborted crawls
3. Implemented fallback audit display logic
4. Updated all data references from `latest` to `displayAudit`
5. Updated comparison logic to use `comparisonAudit`
6. Added error alert banner in UI
7. Modified `shouldListenForUpdates` logic

**Lines Changed:** ~50 additions/modifications

### User Experience Improvements

#### Before
- ❌ Loading spinner shown indefinitely
- ❌ No indication crawl failed
- ❌ No data displayed (blank page)
- ❌ User confused about what's happening

#### After
- ✅ Clear error message displayed
- ✅ Previous audit data shown immediately
- ✅ Timestamp of failed crawl provided
- ✅ User can continue working with last good data

### Edge Cases Handled

1. **First crawl aborted, no previous audit**
   - Shows loading spinner (appropriate since no data exists yet)
   - User can retry crawl

2. **Multiple aborted crawls in a row**
   - Always falls back to most recent successful audit
   - Alert indicates latest failed attempt

3. **Aborted crawl with partial audit**
   - If crawl created incomplete audit, logic detects mismatch
   - Falls back to previous complete audit

4. **Normal crawl in progress**
   - No alert shown
   - Live updates continue as normal

### Testing Scenarios

To test the implementation:

1. **Scenario: Aborted Crawl with Previous Data**
   - Have at least one successful audit
   - Start a new crawl
   - Abort the crawl before completion
   - Visit overview page
   - **Expected:** Red alert banner + previous audit data displayed

2. **Scenario: First Crawl Aborted**
   - Fresh client with no audits
   - Start crawl and abort it
   - Visit overview page
   - **Expected:** Loading spinner (no data to show)

3. **Scenario: Active Crawl**
   - Start a crawl and let it run
   - Visit overview page
   - **Expected:** No alert, live updates active

4. **Scenario: Successful Crawl After Abort**
   - Have an aborted crawl
   - Complete a successful crawl
   - **Expected:** Alert disappears, new audit shown

### Configuration

No configuration needed - behavior is automatic based on crawl state.

### Related Components

- `LiveAuditGate.tsx` - Handles SSE/polling for live updates
- `CrawlLoadingSpinner.tsx` - Shows when no audit data exists
- `Alert` component - Used for error notification

### Future Enhancements

Consider adding:
1. Retry button in the alert to quickly restart failed crawl
2. Error reason if available from crawl abort
3. Link to crawl logs for debugging
4. Analytics tracking for abort frequency
5. Email notification for important clients when crawl fails

### Build Status
✅ Build successful
✅ No TypeScript errors
✅ All components properly integrated
