# All Methods to Connect Mobile ↔ Firm Job Posts

## Summary Table

| Method | Latency | Complexity | Status | Use Case |
|--------|---------|-----------|--------|----------|
| **1. Direct DB Polling** | Real-time | Simple | ✅ Live | Jobs list, search, filters |
| **2. Pull-to-Refresh** | On-demand | Simple | ✅ Live | Manual refresh by user |
| **3. WebSocket Listener** | <100ms | Medium | 📋 Ready | Real-time new jobs alert |
| **4. Notification Push** | Seconds | Medium | 📋 Design | Job match notification |
| **5. Periodic Polling** | Minutes | Simple | ❌ Not needed | Fallback if above fail |
| **6. Webhook from Firm API** | Seconds | Hard | ❌ Complex | Alternative if separate DBs |

---

## Method 1: Direct Database Polling ✅ (CURRENT)

**How it works**: Mobile backend reads `POST table` where `status='PUBLISHED'`

### Endpoints

| Endpoint | Method | Auth | Returns |
|----------|--------|------|---------|
| `/api/jobs` | GET | No | All published posts with pagination |
| `/api/jobs/:id` | GET | No | Single post detail + firm + view count |
| `/api/jobs?search=...` | GET | No | Full-text search on title/description |
| `/api/jobs?type=REMOTE` | GET | No | Filter by locationType |
| `/api/jobs?emp=FULL_TIME` | GET | No | Filter by employmentType |

### Code (Mobile)

```typescript
// hooks/useJobs.ts
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/jobs?take=20').then(r => r.data),
    staleTime: 1000 * 60 * 5, // 5 min cache
    refetchInterval: 1000 * 60 * 10, // Refetch every 10 min if stale
  })
}
```

**When to refetch**:
- User opens Jobs tab
- User pulls-to-refresh
- Manual refetch button
- After successful apply

---

## Method 2: Pull-to-Refresh ✅ (CURRENT)

**How it works**: User swipes down, `refetch()` triggers immediate `GET /api/jobs`

### Code (Mobile UI)

```tsx
const { data: jobs, refetch, isRefetching } = useJobs()

<FlatList
  data={jobs}
  refreshControl={
    <RefreshControl 
      refreshing={isRefetching}
      onRefresh={refetch}
    />
  }
  ListEmptyComponent={
    isLoading ? <ActivityIndicator /> : <Text>No jobs</Text>
  }
/>
```

---

## Method 3: WebSocket Real-Time ✅ (READY FOR SPRINT 2)

**How it works**: Mobile opens persistent connection → firm posts job → mobile instantly notified

### Architecture

```
Firm Backend (port 3004)
  ↓ POST /api/posts/firm/:firmId
  ↓ Prisma: status = 'PUBLISHED'
  ↓ Emit: 'post:published' event
  ↓
WebSocket Server (shared or mobile backend)
  ↓
Mobile Client (Expo)
  ↓ Listens: 'posts:new'
  ↓ Updates: useJobs() cache
```

### Reference Backend Event Hook (NestJS)

```typescript
// In PostsService.createPost():
async createPost(...) {
  const newPost = await prisma.post.create(...)
  
  // Emit to WebSocket server
  this.eventsGateway.server.emit('post:published', {
    id: newPost.id,
    title: newPost.title,
    firm: newPost.firm,
  })
  
  return newPost
}
```

### Mobile Hook (Future)

```typescript
export function useJobsLive() {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const socket = io('http://localhost:3001', { /* auth */ })
    
    socket.on('post:published', (job) => {
      queryClient.setQueryData(['jobs'], (old) => [job, ...old])
    })
    
    return () => socket.disconnect()
  }, [])
}
```

---

## Method 4: Notification System 📋 (SPRINT 2+)

**How it works**: Firm posts job → system sends notification to matching candidates

### Flow

```
Firm posts job (POST /api/posts/firm/:firmId)
  ↓
Check job preferences (skills, location, salary)
  ↓
Find matching candidates
  ↓
POST /api/notifications with:
  - user_id
  - type: 'JOB_RECOMMENDATION'
  - title: 'New job posted: Senior React Dev'
  - link: '/job/post-id'
  ↓
Mobile fetches GET /api/notifications
  ↓
User sees in Alerts tab + push notification
```

### Backend (Reference)

```typescript
// In PostsService:
async createPost(firmId, userId, dto) {
  const post = await prisma.post.create({ ... })
  
  // Find candidates matching this job
  const matches = await prisma.user.findMany({
    where: {
      profile: {
        skills: { hasSome: dto.requiredSkills }
      }
    }
  })
  
  // Create notifications
  await prisma.notification.createMany({
    data: matches.map(user => ({
      user_id: user.id,
      type: 'JOB_RECOMMENDATION',
      title: `New job: ${post.title}`,
      link: `/job/${post.id}`
    }))
  })
}
```

---

## Method 5: Periodic Polling ❌ (NOT NEEDED)

Fallback if WebSocket fails. Not recommended for production.

```typescript
// Every 5 minutes
setInterval(async () => {
  const jobs = await api.get('/jobs?since=5m')
  updateUI(jobs)
}, 5 * 60 * 1000)
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────────┐
│ FIRM WEB APP (Colleague's Work)                 │
│  - Post creation: POST /api/posts/firm/:firmId  │
│  - Publish: PATCH /api/posts/firm/:firmId/:id   │
│  - Archive: DELETE /api/posts/.../archive       │
└─────────────────────────────────┬───────────────┘
                                  ↓
                        PostgreSQL (Shared)
                                  ↓
┌─────────────────────────────────────────────────┐
│ MOBILE APP (Your Work)                          │
│  - Fetch: GET /api/jobs                         │
│  - Detail: GET /api/jobs/:id                    │
│  - Search: GET /api/jobs?search=...             │
│  - Apply: POST /api/applications/post/:postId   │
└─────────────────────────────────────────────────┘
```

## Deployment Readiness

✅ **Dev (Now)**:  Jobs sync live via shared PostgreSQL + ngrok tunnel
✅ **Prod (Ready)**: Both backends → same cloud PostgreSQL

No additional servers, APIs, or webhooks needed for MVP.
