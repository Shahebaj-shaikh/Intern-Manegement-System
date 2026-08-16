# Security Documentation

## 1. Authentication

The application uses JWT-based authentication.

### Access Tokens

Access tokens are generated after successful login and are required for protected API requests.

Protected requests use:

```text
Authorization: Bearer <access-token>