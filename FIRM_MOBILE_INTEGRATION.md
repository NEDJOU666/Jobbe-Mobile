# Firm ↔ Mobile Integration: Exact Endpoints & Flow

## Your Colleague's Side (Firm Web App)

### Endpoints Your Colleague Uses

All running on **reference backend** (port 3004, ngrok-tunneled):

| Endpoint | Method | Purpose | Example |
|----------|--------|---------|---------|
| `POST /api/posts/firm/:firmId` | POST | Create job posting | `{ title, description, employmentType, ... }` |
| `PATCH /api/posts/firm/:firmId/:postId` | PATCH | Edit/publish job | `{ status: 'PUBLISHED' }` |
| `DELETE /api/posts/firm/:firmId/:postId/archive` | DELETE | Archive job | Mark as ARCHIVED |
| `GET /api/posts/firm/:firmId` | GET | List firm's jobs | See drafts, published, archived |

**Database Effect**:
```
POST table updated with:
  - id, title, description
  - company_id (firmId), createdBy (userId)
  - status: 'DRAFT' → 'PUBLISHED' → 'ARCHIVED'
  - employmentType, locationType, location
  - applicationDeadline, creditCost, properties
```

---

## Your Side (Mobile App)

### Step 1: Candidate Views Jobs

**Your endpoint** (mobile backend @ port 3001):
```
GET /api/jobs?skip=0&take=20&search=&type=&emp=
```

**Your hook** (`hooks/useJobs.ts`):
```typescript
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs').then(r => r.data),
  })
}
```

**Your screen** (`app/(tabs)/index.tsx`):
```tsx
const { data: jobs, isLoading } = useJobs()

jobs.map(job => (
  <JobCard
    key={job.id}
    title={job.title}
    firm={job.firm.name}
    location={job.location}
    type={job.locationType}
    employment={job.employmentType}
    onPress={() => navigate(`/job/${job.id}`)}
  />
))
```

### Step 2: Job Data Journey

```
Firm posts: "Senior React Developer"
  ↓
Reference Backend (3004) stores in PostgreSQL
  ↓
Mobile Backend (3001) queries: SELECT * FROM "Post" WHERE status='PUBLISHED'
  ↓
Mobile App calls: GET /api/jobs
  ↓
Mobile App displays in Jobs feed
```

### Step 3: Candidate Applies

**Your endpoint** (mobile backend @ port 3001):
```
POST /api/applications/post/:postId
Body: { coverLetter?, resumeName? }
```

**Your hook** (`hooks/useApplications.ts`):
```typescript
export function useApply() {
  return useMutation({
    mutationFn: (payload) => 
      api.post(`/applications/post/${payload.postId}`, {
        coverLetter: payload.coverLetter,
        resumeName: payload.resumeName,
      })
  })
}
```

**Application record created in PostgreSQL**:
```
Application {
  id: 'app-123',
  post_id: 'post-456',     ← References firm's job posting
  user_id: 'user-789',     ← Candidate
  firm_id: 'firm-000',     ← Extracted from post
  status: ['PENDING_REVIEW'],
  coverLetter: '...',
  createdAt: now
}
```

---

## Real-Time Flow (Dev Setup)

```
┌──────────────────────────────────┐
│ Colleague's Local Machine        │
│ Reference Backend (NestJS/3004)  │
└────────────────┬─────────────────┘
                 │
                 ↓ ngrok tunnel
            [ngrok URL]
                 │
                 ↓
        PostgreSQL (localhost:5432)
        jobfinder2 database
                 ↓
                 ↑
         ┌───────┴────────┐
         │                │
    ┌────┴──────┐    ┌────┴──────────┐
    │ Your Local│    │ Expo Simulator │
    │Mobile Bak │    │   (Your Dev)   │
    │(Hono/3001)│    │                │
    └────┬──────┘    └────┬───────────┘
         │                │
    GET /api/jobs   <──── │
         │                │
    Shows: "Senior React Dev"
         ↓                
    POST /api/applications/post/456
         ↓
    Application saved to DB
```

---

## Environment Variables

### Reference Backend (Colleague's)
```
DATABASE_URL=postgresql://postgres:root@localhost:5432/jobfinder2
JWT_SECRET=...
NGROK_TOKEN=...
```

### Mobile Backend (Yours)
```
DATABASE_URL=postgresql://postgres:root@localhost:5432/jobfinder2  ← SAME DB
```

### Mobile App (Expo)
```
EXPO_PUBLIC_API_URL=http://localhost:3001/api  ← Your backend
  (In prod: ngrok tunnel to your backend OR direct to cloud)
```

---

## Timeline

1. ✅ **Now**: Colleague posts job on firm web app
2. ✅ **Immediately**: Job appears in mobile app's Jobs feed (same DB)
3. ✅ **Instantly**: Candidate applies from mobile
4. ✅ **Immediately**: Application appears in firm web app's dashboard

**No polling, no webhooks, no message queues** — just PostgreSQL replication across two backends.

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Mobile doesn't see firm's posts | Firm didn't publish (status='DRAFT') | Check `POST.status` in DB |
| Old posts showing after firm edits | Cache stale | Pull-to-refresh or wait 5 min |
| Mobile app can't reach backend | ngrok tunnel down | Re-run `ngrok http 3001` |
| Application not saving | Authentication token invalid | Check `/lib/api.ts` refresh logic |
