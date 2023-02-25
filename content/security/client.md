# Client Security

Homechart's Android, iOS, and Web clients are developed using TypeScript and standard web development tooling.  Here are some of the methods we use to help keep Homechart's client code free of vulnerabilities:

- **Limit Third-Party Libraries**: We try and use as few third-party libraries as possible, and when we do select a third-party library, we review the codebase to ensure it's something we are comfortable maintaining.
- **No Cookies**: We do not use cookies for client-side authentication and authorization.
- **Secure Software Supply Chain**: We require a clean `npm audit` for every pull request and build.
