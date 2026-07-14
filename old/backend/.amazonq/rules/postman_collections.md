# Postman Collections Rules

## Naming Convention for API Requests

When creating Postman collections, always include:

1. **Role Requirements** in request names:

   - `(OWNER/COOPERATOR)` - requires merchant role
   - `(CLIENT)` - requires client role
   - `(ADMIN)` - requires admin role
   - `(ANY ROLE)` - accessible to all roles

2. **Parameter Requirements** in request names:

   - `- requires merchantId` - needs merchantId parameter
   - `- requires userId` - needs userId parameter
   - `- requires couponId` - needs couponId parameter
   - `- auto merchant` - automatically detects merchant from JWT
   - `- no params` - no additional parameters needed

3. **Folder Organization**:
   - Group by role: `👑 MERCHANT ONLY`, `👤 CLIENT ONLY`, `🌍 PUBLIC`
   - Use emojis for visual clarity
   - Separate by functionality

## Example Request Names

✅ **Good:**

- `"Add Points to User (OWNER/COOPERATOR) - requires userId"`
- `"Get Point Balance (CLIENT) - requires merchantId"`
- `"Get My Coupons (CLIENT) - no params"`
- `"Create Coupon (OWNER/COOPERATOR) - auto merchant"`

❌ **Bad:**

- `"Add Points"` - unclear role and parameters
- `"Get Balance"` - missing role and parameter info
- `"Create Coupon"` - no role indication

## File Organization

- All Postman collections must be saved in `postman_collections/` folder
- Use descriptive filenames with version/purpose indicators
- Example: `EasyBons_Merchant_Coupons_Final.postman_collection.json`

## Collection Structure

```
👑 MERCHANT ONLY - [Feature Name]
  ├── Request Name (OWNER/COOPERATOR) - parameter info
  └── Request Name (OWNER/COOPERATOR) - parameter info

👤 CLIENT ONLY - [Feature Name]
  ├── Request Name (CLIENT) - parameter info
  └── Request Name (CLIENT) - parameter info

🌍 PUBLIC - [Feature Name]
  ├── Request Name (ANY ROLE) - parameter info
  └── Request Name (ANY ROLE) - parameter info
```

This ensures immediate clarity about:

- Which role can use each endpoint
- What parameters are required
- Whether merchant context is auto-detected or manual
