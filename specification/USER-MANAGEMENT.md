# User Management & Role-Based Access Control

> Sprint 2 — detailed architecture for user roles, permissions, route guards,
> UI adaptation, and backend enforcement strategy.

---

## Role Model

Two roles for the initial release. The system is designed to add roles without schema changes.

| Role | Access | Description |
|---|---|---|
| `admin` | Chat + Knowledge Base + Settings + User Management | Full access; manages the system |
| `user` | Chat only | Standard user; can only interact with conversations |

**Future roles can be added** by extending the `Role` type and the permission matrix below —
no guard components or route definitions need to change.

```ts
// src/types/index.ts
export type Role = 'admin' | 'user'   // extend here for future roles

export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
  lastLoginAt: string | null
  isActive: boolean
}
```

---

## Permission Matrix

Centralised in one file. Every guard, every nav item, every API call reads from here.

```ts
// src/lib/permissions.ts

export type Permission =
  | 'chat:read'
  | 'chat:write'
  | 'knowledge:read'
  | 'knowledge:write'
  | 'knowledge:delete'
  | 'settings:read'
  | 'settings:write'
  | 'users:read'
  | 'users:write'
  | 'users:delete'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'chat:read', 'chat:write',
    'knowledge:read', 'knowledge:write', 'knowledge:delete',
    'settings:read', 'settings:write',
    'users:read', 'users:write', 'users:delete',
  ],
  user: [
    'chat:read', 'chat:write',
  ],
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(user, p))
}
```

---

## Auth Store — Role Awareness

`authStore` exposes a permission helper so components never import `permissions.ts` directly.

```ts
// src/features/auth/store.ts

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  login(credentials: UsernamePasswordCredentials | OAuthTokenCredentials): Promise<void>
  logout(): void
  setToken(token: string): void
  _setUser(user: User): void
  // Permission helpers — components use these, not permissions.ts
  can(permission: Permission): boolean
  canAny(permissions: Permission[]): boolean
}

// Implementation
can: (permission) => hasPermission(get().user, permission),
canAny: (permissions) => hasAnyPermission(get().user, permissions),
```

**Usage in any component:**
```ts
const can = useAuthStore(s => s.can)
if (can('knowledge:write')) { /* show upload button */ }
```

---

## Route Guard Architecture

Three guard components, each with a distinct responsibility.

```
<App>
 └── <AuthGuard>            ← Must be authenticated at all
      └── <RoleGuard>        ← Must have a specific permission
           └── <Page />
```

### `AuthGuard` — authentication only

```ts
// src/components/AuthGuard.tsx

export function AuthGuard({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
```

### `RoleGuard` — permission check

```ts
// src/components/RoleGuard.tsx

interface RoleGuardProps {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode   // default: redirect to / with toast
}

export function RoleGuard({ permission, children, fallback }: RoleGuardProps) {
  const can = useAuthStore(s => s.can)
  const { pushToast } = useUIStore()

  if (!can(permission)) {
    if (fallback) return <>{fallback}</>
    pushToast({ type: 'error', message: 'You do not have access to this page.', durationMs: 4000 })
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
```

### Route Definitions

```ts
// src/router.tsx

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout><LoginPage /></AuthLayout>,
  },
  {
    element: <AuthGuard><AppLayout /></AuthGuard>,    // all protected routes live here
    children: [
      {
        path: '/',
        element: <ChatPage />,    // accessible to all authenticated users
      },
      {
        path: '/knowledge-base',
        element: (
          <RoleGuard permission="knowledge:read">
            <KnowledgeBasePage />
          </RoleGuard>
        ),
      },
      {
        path: '/settings',
        element: (
          <RoleGuard permission="settings:read">
            <SettingsPage />
          </RoleGuard>
        ),
      },
      {
        path: '/users',
        element: (
          <RoleGuard permission="users:read">
            <UserManagementPage />
          </RoleGuard>
        ),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
```

---

## Sidebar — Permission-Driven Navigation

The sidebar renders nav items conditionally. It reads the same permission matrix —
there is no separate "show/hide" config.

```ts
// src/features/nav/navItems.ts

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  permission: Permission | null    // null = visible to all authenticated users
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Chat',           path: '/',               icon: MessageSquare, permission: null },
  { label: 'Knowledge Base', path: '/knowledge-base', icon: Database,      permission: 'knowledge:read' },
  { label: 'Settings',       path: '/settings',       icon: Settings,      permission: 'settings:read' },
  { label: 'Users',          path: '/users',           icon: Users,         permission: 'users:read' },
]
```

```ts
// src/layouts/Sidebar.tsx

export function Sidebar() {
  const can = useAuthStore(s => s.can)

  const visibleItems = NAV_ITEMS.filter(item =>
    item.permission === null || can(item.permission)
  )

  return (
    <nav>
      {visibleItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          <item.icon size={16} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
```

**Result:** An admin sees all four nav items. A standard user sees only "Chat".
Adding a new nav item with a new permission requires editing only `navItems.ts`.

---

## User Management Page (`/users`) — Admin Only

A full CRUD interface for managing users. Only admins can reach this route.

### Features
- User table: name, email, role badge, status (active/inactive), last login, actions
- Invite user — sends an email invite link (POST `/api/users/invite`)
- Change role — dropdown in the table row (PATCH `/api/users/:id`)
- Deactivate / reactivate user (PATCH `/api/users/:id/status`)
- Delete user with confirmation dialog (DELETE `/api/users/:id`)
- Search by name or email (client-side)
- Filter by role and status

### Data Shape

```ts
// GET /api/users
interface UserListResponse {
  users: User[]
  total: number
}

// POST /api/users/invite
interface InviteUserRequest {
  email: string
  role: Role
}

// PATCH /api/users/:id
interface UpdateUserRequest {
  role?: Role
  isActive?: boolean
}
```

### Components
- `UserManagementPage`
- `UserTable`, `UserRow`
- `RoleBadge` — colour-coded: admin = purple, user = gray
- `InviteUserModal` — email + role select + send button
- `ConfirmDeactivateDialog`

### React Query Integration

```ts
// Queries
useQuery(['users'], api.getUsers)

// Mutations — all with optimistic updates
useMutation(api.inviteUser,    { onSuccess: () => queryClient.invalidateQueries(['users']) })
useMutation(api.updateUser,    { onMutate: optimisticRoleUpdate, onError: rollback })
useMutation(api.deactivateUser,{ onMutate: optimisticStatusUpdate, onError: rollback })
useMutation(api.deleteUser,    { onSuccess: () => queryClient.invalidateQueries(['users']) })
```

---

## Fine-Grained UI Permission Checks

Some UI elements are inside pages that are accessible but have sub-features gated by permission.
Use the `can()` helper inline rather than wrapping with a guard component.

```ts
// Example: Knowledge Base page — read is allowed for admin
// but write/delete actions are checked inline

function KnowledgeBasePage() {
  const can = useAuthStore(s => s.can)

  return (
    <div>
      <DocumentTable />
      {can('knowledge:write') && <FileUploader />}
      {can('knowledge:delete') && <BulkDeleteButton />}
    </div>
  )
}
```

---

## Backend Enforcement (Contract with the API)

The frontend guards are UX only — they hide routes and buttons but do not enforce security.
The backend must enforce every permission independently. This section defines the contract
so the frontend and backend stay aligned.

### Required API Behaviour

| Endpoint | Required permission | 403 response body |
|---|---|---|
| `GET /api/conversations` | `chat:read` | `{ code: 'FORBIDDEN', required: 'chat:read' }` |
| `POST /api/chat` | `chat:write` | `{ code: 'FORBIDDEN', required: 'chat:write' }` |
| `GET /api/documents` | `knowledge:read` | `{ code: 'FORBIDDEN', required: 'knowledge:read' }` |
| `POST /api/upload` | `knowledge:write` | `{ code: 'FORBIDDEN', required: 'knowledge:write' }` |
| `DELETE /api/documents/:id` | `knowledge:delete` | `{ code: 'FORBIDDEN', required: 'knowledge:delete' }` |
| `GET /api/settings` | `settings:read` | `{ code: 'FORBIDDEN', required: 'settings:read' }` |
| `POST /api/settings` | `settings:write` | `{ code: 'FORBIDDEN', required: 'settings:write' }` |
| `GET /api/users` | `users:read` | `{ code: 'FORBIDDEN', required: 'users:read' }` |
| `POST /api/users/invite` | `users:write` | `{ code: 'FORBIDDEN', required: 'users:write' }` |
| `PATCH /api/users/:id` | `users:write` | `{ code: 'FORBIDDEN', required: 'users:write' }` |
| `DELETE /api/users/:id` | `users:delete` | `{ code: 'FORBIDDEN', required: 'users:delete' }` |

### Frontend Handling of 403

The Axios interceptor maps 403 responses to a toast and does NOT redirect (unlike 401).
The user stays on the current page with an error message.

```ts
// src/services/httpClient.ts

httpClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    if (error.response?.status === 403) {
      useUIStore.getState().pushToast({
        type: 'error',
        message: 'You do not have permission to perform this action.',
        durationMs: 5000,
      })
    }
    return Promise.reject(error)
  }
)
```

---

## MSW Handlers — RBAC Simulation

MSW handlers check the `Authorization` header and simulate role-based responses,
so RBAC can be tested end-to-end without a real backend.

```ts
// src/mocks/handlers/documents.ts

http.get('/api/documents', ({ request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const user = resolveUserFromMockToken(token)   // looks up mock user by token

  if (!user || !hasPermission(user, 'knowledge:read')) {
    return HttpResponse.json({ code: 'FORBIDDEN', required: 'knowledge:read' }, { status: 403 })
  }
  return HttpResponse.json({ documents: MOCK_DOCUMENTS })
})
```

---

## Invite Flow — New User Onboarding

```
Admin fills InviteUserModal (email + role)
     │
     ▼
POST /api/users/invite
     │
     ▼
Server sends invite email with a one-time token link:
  https://app.yourdomain.com/accept-invite?token=<token>
     │
     ▼
AcceptInvitePage (/accept-invite)
  - Validates token (GET /api/users/invite/:token)
  - User sets their password
  - POST /api/users/invite/:token/accept { password }
  - Redirected to /login with success toast
```

### Routes to Add for Invite Flow
- `/accept-invite` — public route (outside `AuthGuard`)
- `GET /api/users/invite/:token` — validate token, return email + role
- `POST /api/users/invite/:token/accept` — set password, activate account

---

## Summary

```
Permission defined in permissions.ts
       │
       ├── authStore.can() — used in components
       ├── RoleGuard — used on routes
       ├── Sidebar navItems — filters nav links
       └── API interceptor — handles 403 responses

Role assigned at invite time, changeable by admin via /users page
Backend enforces independently — frontend guards are UX only
```
