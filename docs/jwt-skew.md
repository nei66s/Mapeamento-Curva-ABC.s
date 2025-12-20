# JWT clock skew configuration

The project enforces a small allowance for clock skew when validating JWTs. By default a 60 second skew is permitted to accommodate small differences between client and server clocks.

- **Environment variable:** `JWT_MAX_CLOCK_SKEW_SECONDS`
- **Default:** `60` (seconds)
- **Purpose:** Allows a token to be treated as valid for up to `JWT_MAX_CLOCK_SKEW_SECONDS` seconds after its `exp` claim, and tolerates small discrepancies for `nbf` and `iat` checks.

To override the default, set the variable in your environment (for example in `.env.local` or in your deployment secrets):

```bash
JWT_MAX_CLOCK_SKEW_SECONDS=120
```

Adjust this value conservatively — large skew windows reduce the effectiveness of token expiration as a safety boundary.
