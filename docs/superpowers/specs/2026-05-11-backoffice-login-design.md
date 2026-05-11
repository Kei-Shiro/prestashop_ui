# Backoffice Login Design

## Architecture
- **LoginPage.vue**: A Vue component with a login form (email, password, submit button).
- **State Management**: Local Vue efs for form inputs and error messages.
- **Authentication Logic**: Hardcoded check (dmin@test.com / password). On success, generates a mock token (dmin_token) in localStorage.
- **Route Protection**: Utilize Vue Router's eforeEach guard to redirect unauthenticated users to /login.

## Data Flow
1. User enters credentials.
2. Form submits to handleLogin.
3. If valid, set localStorage, redirect to /.
4. If invalid, display error message inline.

## Testing
- Test valid login redirects and sets token.
- Test invalid login shows error.
- Test unauthenticated access to protected routes redirects to login.
