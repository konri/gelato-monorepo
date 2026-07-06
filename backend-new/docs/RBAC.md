# Role-Based Access Control (RBAC) Documentation

## Overview

The Gelato backend implements comprehensive Role-Based Access Control (RBAC) using TypeGraphQL's `@Authorized()` decorator and custom permission checkers.

## Roles

The system defines 6 distinct roles:

```typescript
enum Role {
  SUPER_ADMIN     // Full system access
  SPOTS_ADMIN     // Manages multiple spots
  SPOT_ADMIN      // Manages a single spot
  EMPLOYEE        // Works at a spot
  COURIER         // Delivers orders
  CLIENT          // Orders ice cream
}
```

### Role Hierarchy

**SUPER_ADMIN** (Highest privilege)
- Full access to all system resources
- Can create/update/delete users, spots, products, orders
- Can assign any role to any user
- Cannot be assigned by SPOTS_ADMIN

**SPOTS_ADMIN**
- Manages multiple spots
- Can create spots and assign SPOT_ADMIN, EMPLOYEE, COURIER roles
- Cannot assign SUPER_ADMIN or SPOTS_ADMIN roles
- Can view analytics across all managed spots

**SPOT_ADMIN**
- Manages a single spot
- Can update spot details they manage
- Can manage employees at their spot
- Can view orders for their spot
- Can approve couriers for their spot

**EMPLOYEE**
- Works at a specific spot
- Can view orders for their employment spot
- Can process orders and scan loyalty QR codes
- Limited to spot-specific operations

**COURIER**
- Delivers orders
- Can view assigned deliveries
- Can update delivery status and GPS location
- Can apply to work with specific spots

**CLIENT** (Lowest privilege)
- Can place orders
- Can view their own orders and profile
- Can earn and redeem loyalty points
- Can participate in referral program

## Implementation

### 1. TypeGraphQL AuthChecker

```typescript
// src/middleware/authMiddleware.ts
export function authChecker(
  { context }: any,
  roles: string[]
): boolean {
  const user = context.req.user;

  // If no roles specified, just check if user exists
  if (roles.length === 0) {
    return !!user;
  }

  // Check if user has any of the required roles
  if (!user || !user.roles) {
    return false;
  }

  return user.roles.some((userRole: string) => roles.includes(userRole));
}
```

### 2. Using @Authorized Decorator

```typescript
// Single role requirement
@Authorized([Role.SUPER_ADMIN])
@Mutation(() => Boolean)
async deleteUser(@Arg('userId') userId: string) {
  // Only SUPER_ADMIN can execute
}

// Multiple roles (OR logic)
@Authorized([Role.SUPER_ADMIN, Role.SPOTS_ADMIN])
@Mutation(() => SpotType)
async createSpot(...) {
  // Either SUPER_ADMIN or SPOTS_ADMIN can execute
}

// Any authenticated user
@Authorized()
@Query(() => UserType)
async me() {
  // Any logged-in user can execute
}
```

### 3. Custom Permission Checks

For complex permission logic beyond simple role checks:

```typescript
// src/decorators/CheckPermissions.ts
@CheckPermissions(async ({ req, prisma }) => {
  const user = req.user!;
  const spot = await prisma.spot.findUnique({ where: { id: spotId } });
  return canManageSpot(user.id, spotId, prisma);
})
@Mutation(() => SpotType)
async updateSpot(...) {
  // Custom permission logic
}
```

## Resolver Permissions

### AuthResolver
- `register`: Public
- `login`: Public
- `sendOTP`: Public
- `verifyOTP`: Public
- `me`: Authenticated users only
- `refreshToken`: Public (requires valid refresh token)
- `logout`: Authenticated users only

### UserResolver
- `users`: SUPER_ADMIN only
- `user(id)`: Authenticated (own profile) or ADMIN roles
- `updateUserRoles`: SUPER_ADMIN, SPOTS_ADMIN (with restrictions)
- `deleteUser`: SUPER_ADMIN only
- `usersByRole`: SUPER_ADMIN, SPOTS_ADMIN
- `searchUsers`: SUPER_ADMIN, SPOTS_ADMIN

### SpotResolver
- `spots`: Public (shows only active spots to non-admins)
- `spot(id)`: Public
- `spotsByCity`: Public
- `createSpot`: SUPER_ADMIN, SPOTS_ADMIN
- `updateSpot`: SUPER_ADMIN, SPOTS_ADMIN, SPOT_ADMIN (own spot only)
- `deleteSpot`: SUPER_ADMIN only
- `assignSpotAdmin`: SUPER_ADMIN, SPOTS_ADMIN
- `removeSpotAdmin`: SUPER_ADMIN, SPOTS_ADMIN

## Permission Helper Functions

```typescript
// Check if user has any of the specified roles
hasAnyRole(user, [Role.SUPER_ADMIN, Role.SPOTS_ADMIN])

// Check if user has all of the specified roles
hasAllRoles(user, [Role.SPOT_ADMIN, Role.EMPLOYEE])

// Check if user is super admin
isSuperAdmin(user)

// Check if user is any type of admin
isAnyAdmin(user)

// Check if user can manage a specific spot
await canManageSpot(userId, spotId, prisma)

// Check if user can view orders from a specific spot
await canViewSpotOrders(userId, spotId, prisma)
```

## Testing RBAC

### Test Credentials (from seed data)

```bash
# Super Admin
email: superadmin@gelato.com
password: admin123
roles: [SUPER_ADMIN]

# Test Client
email: client@test.com
password: client123
roles: [CLIENT]

# Test Courier
email: courier@test.com
password: courier123
roles: [COURIER]
```

### Example Test Queries

```graphql
# Login as super admin
mutation {
  login(email: "superadmin@gelato.com", password: "admin123") {
    accessToken
    user {
      id
      email
      roles
    }
  }
}

# Query all users (SUPER_ADMIN only)
query {
  users {
    id
    email
    roles
  }
}

# Update user roles (SUPER_ADMIN, SPOTS_ADMIN)
mutation {
  updateUserRoles(
    userId: "user-id-here"
    roles: [CLIENT, SPOT_ADMIN]
  ) {
    id
    email
    roles
  }
}

# Query users by role
query {
  usersByRole(role: COURIER) {
    id
    email
    name
    roles
  }
}

# Create a spot (SUPER_ADMIN, SPOTS_ADMIN)
mutation {
  createSpot(
    id: "new-spot-id"
    name: "Gelato Test Spot"
    address: "ul. Test 1"
    cityId: "city-id-here"
    latitude: 52.2297
    longitude: 21.0122
    phone: "+48123456789"
  ) {
    id
    name
  }
}
```

## Security Best Practices

1. **Always verify user roles** before performing sensitive operations
2. **Use SUPER_ADMIN role sparingly** - only for truly global operations
3. **Implement resource-level permissions** (e.g., SPOT_ADMIN can only manage their own spots)
4. **Audit sensitive operations** - log role assignments and deletions
5. **Never expose sensitive fields** in GraphQL types (password, tokenVersion)
6. **Use JWT tokenVersion** for instant token invalidation on logout
7. **Validate inputs** even for admin operations
8. **Implement rate limiting** on mutation operations

## Adding New Roles

To add a new role:

1. Update `prisma/schema.prisma`:
```prisma
enum Role {
  SUPER_ADMIN
  SPOTS_ADMIN
  SPOT_ADMIN
  EMPLOYEE
  COURIER
  CLIENT
  NEW_ROLE  // Add here
}
```

2. Run migration:
```bash
npm run prisma:migrate
```

3. Update `src/types/UserType.ts` to register the enum with TypeGraphQL

4. Add role-specific resolvers and permissions

5. Update this documentation

## Common Permission Patterns

### Pattern 1: Hierarchical Access
```typescript
// Admins can do X, users can only do Y
if (isSuperAdmin(user)) {
  // Full access
} else if (isAnyAdmin(user)) {
  // Limited admin access
} else {
  // Regular user access
}
```

### Pattern 2: Resource Ownership
```typescript
// Users can manage their own resources
if (user.id === resourceOwnerId || isAnyAdmin(user)) {
  // Allow operation
}
```

### Pattern 3: Spot Membership
```typescript
// Check if user belongs to a spot
const userSpot = await prisma.spot.findFirst({
  where: {
    OR: [
      { admins: { some: { id: user.id } } },
      { employees: { some: { id: user.id } } }
    ]
  }
});

if (userSpot && userSpot.id === targetSpotId) {
  // Allow spot-specific operation
}
```

## Error Messages

- `"Access denied! You need to be authorized to perform this action!"` - No authentication token or invalid token
- `"Access denied! You don't have permission for this action!"` - Authenticated but lacks required role
- `"You do not have permission to manage this spot"` - Spot-specific permission denied
- `"Insufficient permissions to assign admin roles"` - SPOTS_ADMIN trying to assign SUPER_ADMIN/SPOTS_ADMIN role

## Future Enhancements

1. **Fine-grained permissions** - Move beyond roles to specific permissions (e.g., `can_edit_products`, `can_process_refunds`)
2. **Permission caching** - Cache user permissions in Redis for performance
3. **Audit log** - Track all permission checks and role changes
4. **Time-based roles** - Temporary role assignments (e.g., EMPLOYEE role expires after X days)
5. **Multi-tenancy** - Separate permissions per organization/franchise
