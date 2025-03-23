import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
    index("routes/home.jsx"),
    { path: "register", file: "routes/register.jsx" },
    { path: "login", file: "routes/login.jsx" },
    { path: "chat", file: "routes/chat.jsx" },
    { path: "verify", file: "routes/verify.jsx" },
] satisfies RouteConfig;