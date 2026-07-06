# Curl Generation Rules for Postman

When generating curl commands for API testing:

1. **Always use `{{base_url}}` instead of localhost or any hardcoded URL**

   - Replace `localhost:4000` with `{{base_url}}`
   - Replace `http://localhost:4000` with `{{base_url}}`
   - Replace any hardcoded API URLs with `{{base_url}}`

2. **Never include Authorization header with actual tokens**

   - Do not add `Authorization: Bearer YOUR_JWT_TOKEN`
   - Do not add `Authorization: Bearer <token>`
   - Let Postman handle authentication through environment variables

3. **Use Postman variable format**

   - URLs should use `{{base_url}}/graphql` format
   - Other variables should use `{{variable_name}}` format

4. **Always add descriptive comments before curl commands**

   - Add `# Title: Description` before each curl
   - Use clear, descriptive names for Postman import
   - Example: `# Get User Activities - All Types`

5. **Example format:**

   ```bash
   # Get User Activities - All Types
   curl --location '{{base_url}}/graphql' \
   --header 'Content-Type: application/json' \
   --data '{
       "query": "query { ... }"
   }'
   ```

6. **Do NOT include:**
   - `--header 'Authorization: Bearer YOUR_JWT_TOKEN'`
   - `localhost:4000` or any hardcoded URLs
   - Actual token values
