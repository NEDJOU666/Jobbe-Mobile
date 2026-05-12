# Job Posts Sync: Mobile ↔ Reference Backend Architecture

## Current State

- **Mobile Backend** (`Jobbe-api` @ port 3001): Lightweight Hono/Bun server
- **Reference Backend** (`jobfinder_ms` @ port 3004): Full NestJS with firms, posts, applications
- **Connection**: ngrok tunnel (reference backend → mobile app during dev)
- **Database**: Both point to same PostgreSQL instance

## Job Post Flow (Firm Creates → Candidate Sees)

### 1. Firm Posts Job (Reference Backend)

**Endpoint**: `POST /api/posts/firm/:firmId` (ngrok-tunneled, port 3004)

```
Recruiter on Web App
    ↓
POST /api/posts/firm/{firmId}
    ↓
PostsService.createPost(firmId, userId, CreatePostDto)
    ↓
prisma.post.create({
  company_id: firmId,
  status: 'DRAFT', // Initially
  title, description, employmentType, locationType, etc.
})
```

**Data saved to shared PostgreSQL** → `Post` table with `status='DRAFT'`

### 2. Post Approval (Reference Backend)

**Endpoint**: `PATCH /api/posts/firm/:firmId/:postId` (ngrok-tunneled)

Recruiter publishes post:
```
status: 'DRAFT' → 'PUBLISHED'
```

**KEY**: Update happens in shared DB. Mobile app will **automatically** see it via next fetch.

### 3. Mobile App Fetches Posts

**Endpoint**: `GET /api/jobs` (mobile backend @ port 3001, connects to shared DB)

```
Mobile User opens Jobs tab
    ↓
useJobs() hook
    ↓
api.get('/jobs?take=20')
    ↓
Jobbe-api routes/jobs.ts
    ↓
db.post.findMany({ 
  where: { status: 'PUBLISHED' } // Only published
})
    ↓
Returns firm info + post details + application counts
```

**Data flow**: Reference backend writes → Shared DB → Mobile backend reads

## All Connection Methods

### A. Direct Database Reads (Current & Recommended)

| Mobile Endpoint | Query | Notes |
|---|---|---|
| `GET /api/jobs` | `WHERE status='PUBLISHED'` | List all available jobs |
| `GET /api/jobs/:id` | `WHERE id=?` | Job detail + firm info |
| `GET /api/jobs?search=...` | Full-text search | Search by title/description |
| `GET /api/jobs?type=REMOTE` | Filter by locationType | Job type filters |
| `GET /api/jobs?emp=FULL_TIME` | Filter by employmentType | Employment type |

**Advantages**:
- ✅ Real-time (no polling or webhooks needed)
- ✅ Consistent with reference backend
- ✅ Pagination built-in
- ✅ Search & filters work out-of-box

### B. Pull-to-Refresh (Mobile App)

```tsx
const { data, refetch } = useJobs()

<RefreshControl onRefresh={refetch} />
```

**When user pulls down**, `refetch()` runs `GET /api/jobs` again → fresh posts.

### C. Real-time Sync (Future: WebSockets/SSE)

If you want **live updates** when a firm posts a job:

```
Mobile ← WebSocket ← Firm publishes post
```

Not needed for MVP, but reference backend has `POST` entity events infrastructure.

### D. Notifications (Future: Alerts Tab)

Job posted → Trigger notification → Push to candidate's **Alerts** tab

Currently: `GET /api/notifications` only shows application status changes. Can extend to include job postings.

## Database Schema Alignment

**Reference backend** (`jobfinder_ms`):
```sql
Post {
  id, title, description, 
  company_id (firm FK), 
  status (DRAFT|PUBLISHED|ARCHIVED),
  employmentType, locationType, location,
  creditCost, isPaid, 
  applicationDeadline, applyType,
  createdAt, updatedAt
}

Firm {
  id, name, logo, city, country, 
  description, website, domain_role, size
}
```

**Mobile backend** (`Jobbe-api`) Prisma schema: ✅ Must match exactly

Verify at: `D:\New folder\Jobbe-api\prisma\schema.prisma`

## Deployment Strategy

### Dev (Current)

```
Firm Web (local) → Reference Backend (port 3004)
  ngrok tunnel ↓
Mobile App (Expo) → Mobile Backend (port 3001) → same PostgreSQL
```

### Prod

```
Firm Web (https://firm.jobbe.com) → Reference Backend (prod)
Mobile App (Expo) → API Gateway (prod) → Mobile Backend (prod)
  ↓
  shared PostgreSQL (prod)
```

Both backends read/write same DB → automatic sync.

## ✅ Schema Verification

Both backends use identical schema:
- `Post` table with `status ENUM (DRAFT|PUBLISHED|CLOSED|ARCHIVED)`
- `Firms` table with `id, name, logo, city, country, description, website`
- Same enums: `PostStatus`, `EmploymentType`, `LocationType`, `ApplyType`
- `Application` table links `User + Post + Firm`

## Implementation Checklist

- [ ] **Dev**: ngrok tunnel reference backend, test mobile fetch
- [ ] **Feature**: Pull-to-refresh on Jobs tab
- [ ] **Feature**: Real-time job alerts via notifications
- [ ] **Feature**: WebSocket listener for instant new posts
- [ ] **Prod**: Deploy both backends to cloud, single PostgreSQL
