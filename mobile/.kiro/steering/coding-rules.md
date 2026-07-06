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
