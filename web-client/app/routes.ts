import { type RouteConfig, index } from '@react-router/dev/routes';

export default [
    index('routes/home.jsx'),
    { path: 'register', file: 'routes/register.jsx' },
    { path: 'login', file: 'routes/login.jsx' },
    { path: 'chat', file: 'routes/chat.jsx' },
    { path: 'verify', file: 'routes/verify.jsx' },
    { path: 'settings', file: 'routes/settings.jsx' },
    { path: 'admin/users', file: 'routes/users.jsx' },
    { path: '403', file: 'routes/403.jsx' },
    { path: 'user-info', file: 'routes/user-info.jsx' },
    { path: 'reset-password', file: 'routes/reset-password.jsx' },
    { path: 'send-password-reset-request', file: 'routes/send-password-reset-request.jsx' },
] satisfies RouteConfig;