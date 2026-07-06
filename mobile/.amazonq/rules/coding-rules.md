# Coding Rules

## General Rules
- Write only the ABSOLUTE MINIMAL amount of code needed
- Avoid verbose implementations
- Do NOT add code that doesn't directly contribute to the solution

## Important: Do NOT Restore Deleted Code
- If you see that something was deleted from a file (e.g., `style={{lineHeight: '160%'}}`), it was deleted intentionally
- DO NOT add it back in your changes
- Respect user's decisions about code removal
- If user explicitly removes something, assume it's not needed

## Style Rules
- Use Tailwind classes wherever possible instead of inline styles
- Only use inline styles when absolutely necessary (e.g., dynamic values, custom fonts)
- Prefer Typography component over Text component
- Use custom colors from tailwind.config.js (e.g., `bg-modal-bg`, `text-accent`)

## Component Architecture
- Extract reusable components to separate files
- Keep components small and focused
- Pass modal content from parent components, don't hardcode it inside
- Use proper TypeScript types for all props

## Translation Rules
- ALL user-facing text must come from translation files (pl.ts, en.ts)
- Never hardcode Polish or English text in components
- Use `t('Section.key')` for all labels, messages, and UI text

## Import Rules
- ALWAYS check existing imports in a file before making changes
- When adding usage of a new symbol, verify it is imported
- When removing usage of a symbol, remove its import if no longer needed
- Never assume an import exists — read the file's imports first

## Import Verification (STRICT)
- ALWAYS read the first 10-15 lines of a file BEFORE making any changes to verify current imports
- ALWAYS read the imports again AFTER making changes to confirm they are correct
- NEVER assume an import was added — verify it exists in the file
- When adding a new symbol usage, check if it's imported; if not, add it explicitly
- When removing a symbol usage, check if it's still used elsewhere before removing the import
