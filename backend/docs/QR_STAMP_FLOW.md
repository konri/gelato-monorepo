# QR Code Stamp Flow - Merchant Scans Client QR

## Flow Description

1. **Client shows QR code** containing their `userId`
2. **Merchant scans QR** and calls `addStampByUserId` mutation
3. **System automatically**:
   - Creates stamp card if doesn't exist (auto-activation)
   - Adds stamp to card
   - Updates balance and transactions

## Endpoints

### 1. Login as OWNER/COOPERATOR (Merchant)

```bash
# Login OWNER
curl --location '{{base_url}}/authorization/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "owner@gmail.com",
    "password": "hasloownergmail"
}'
```

### 2. Scan Client QR & Add Stamp (OWNER/COOPERATOR/ADMIN)

```bash
# Add Stamp by User ID - Auto-activates card if needed
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation AddStampByUserId($userId: String!, $templateId: String, $description: String!) { addStampByUserId(userId: $userId, templateId: $templateId, description: $description) { id cardId isUsed createdAt } }",
    "variables": {
        "userId": "CLIENT_USER_ID_FROM_QR",
        "templateId": "numero-uno-stamps-template",
        "description": "Purchase at store"
    }
}'
```

### 3. Verify Client's Card (Optional - as CLIENT)

```bash
# Get My Stamp Cards - Client checks their stamps
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "query { myStampCards { id stampsCollected stampsRequired merchant { name } template { title } stamps { id createdAt } } }"
}'
```

## Complete Flow Example

### Step 1: Client generates QR code

- Mobile app generates QR containing: `userId: "abc-123-def"`
- Client shows QR to merchant

### Step 2: Merchant scans QR

```bash
# Merchant is logged in as OWNER
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--data '{
    "query": "mutation { addStampByUserId(userId: \"abc-123-def\", description: \"Coffee purchase\") { id cardId createdAt } }"
}'
```

### Step 3: System response

```json
{
  "data": {
    "addStampByUserId": {
      "id": "stamp-id-123",
      "cardId": "card-id-456",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

## Auto-Activation Logic

The `addStampByUserId` mutation:

1. **Finds active card** for user at this merchant
2. **If no card exists**:
   - Uses `templateId` if provided
   - Otherwise finds first active template for merchant
   - Creates new card with template settings
3. **Adds stamp** to card
4. **Creates transaction** record
5. **Updates balance**

## Key Features

✅ **Auto-activation** - No need to manually activate card first
✅ **Template support** - Can specify which template to use
✅ **Merchant isolation** - Merchant can only add stamps to their own cards
✅ **Transaction history** - Full audit trail
✅ **Balance validation** - Prevents over-stamping

## Error Handling

- **Card already completed**: Returns 409 error if card has max stamps
- **Merchant not found**: Returns 404 if merchant doesn't exist
- **No template**: Uses default 10 stamps if no template specified

## Mobile App Integration

```javascript
// Client generates QR with userId
const clientQR = {
  userId: currentUser.id,
  type: 'STAMP_CARD',
}

// Merchant scans and calls API
const addStamp = async (scannedUserId) => {
  const mutation = `
    mutation AddStampByUserId($userId: String!, $description: String!) {
      addStampByUserId(
        userId: $userId
        description: $description
      ) {
        id
        cardId
        createdAt
      }
    }
  `

  return await graphqlClient.mutate({
    mutation,
    variables: {
      userId: scannedUserId,
      description: 'Purchase at store',
    },
  })
}
```

## Testing

1. **Get client userId**: Login as client, note the userId from JWT
2. **Login as merchant**: Get merchant JWT token
3. **Scan & stamp**: Call `addStampByUserId` with client's userId
4. **Verify**: Login as client, check `myStampCards` query

## Notes

- Merchant JWT automatically determines which merchant is adding stamp
- No need to pass `merchantId` - extracted from logged-in user
- First stamp automatically creates card (auto-activation)
- Template can be specified or system uses default/first active template
