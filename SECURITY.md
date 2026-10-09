# Security Policy

## Supported Versions
CareerFit AI actively maintains and patches the current stable release.

## Reporting a Vulnerability
CareerFit AI takes data privacy and candidate confidentiality seriously. Resume data contains personally identifiable information (PII).
If you discover a security vulnerability, please submit a responsible disclosure report to security@careerfit.ai.
We commit to acknowledging your report within 48 hours and providing coordinated disclosure.

## Security Practices
- Passwords hashed with bcrypt (salt rounds: 10)
- Bearer JWT token verification with expiration
- Rate limiting on authentication and AI analysis routes
- Zero public resume exposure (user-scoped data isolation)
- File type and 10MB size validation
- No stack traces exposed in API error responses