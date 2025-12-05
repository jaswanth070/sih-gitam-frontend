module.exports = [
"[project]/lib/session-store.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearSessionCache",
    ()=>clearSessionCache,
    "getSessionSnapshot",
    ()=>getSessionSnapshot,
    "getStoredAdminTeams",
    ()=>getStoredAdminTeams,
    "getStoredCurrentUser",
    ()=>getStoredCurrentUser,
    "getStoredLeaderTeam",
    ()=>getStoredLeaderTeam,
    "getStoredPOCTeamDetail",
    ()=>getStoredPOCTeamDetail,
    "getStoredPOCTeams",
    ()=>getStoredPOCTeams,
    "getStoredVolunteerTeamDetail",
    ()=>getStoredVolunteerTeamDetail,
    "getStoredVolunteerTeams",
    ()=>getStoredVolunteerTeams,
    "storeAdminTeams",
    ()=>storeAdminTeams,
    "storeCurrentUser",
    ()=>storeCurrentUser,
    "storeLeaderTeam",
    ()=>storeLeaderTeam,
    "storePOCTeamDetail",
    ()=>storePOCTeamDetail,
    "storePOCTeams",
    ()=>storePOCTeams,
    "storeVolunteerTeamDetail",
    ()=>storeVolunteerTeamDetail,
    "storeVolunteerTeams",
    ()=>storeVolunteerTeams
]);
const SESSION_KEY = "sih_session_cache_v1";
function isBrowser() {
    return ("TURBOPACK compile-time value", "undefined") !== "undefined" && typeof window.localStorage !== "undefined";
}
function readSession() {
    if (!isBrowser()) return {};
    //TURBOPACK unreachable
    ;
}
function writeSession(payload) {
    if (!isBrowser()) return;
    //TURBOPACK unreachable
    ;
}
function mergeSession(partial) {
    const existing = readSession();
    const next = {
        ...existing,
        ...partial
    };
    writeSession(next);
    return next;
}
function clearSessionCache() {
    if (!isBrowser()) return;
    //TURBOPACK unreachable
    ;
}
function storeCurrentUser(user) {
    mergeSession({
        currentUser: user
    });
}
function getStoredCurrentUser() {
    const session = readSession();
    return session.currentUser ?? null;
}
function storeLeaderTeam(team) {
    mergeSession({
        leaderTeam: team
    });
}
function getStoredLeaderTeam() {
    const session = readSession();
    return session.leaderTeam ?? null;
}
function storePOCTeams(teams) {
    mergeSession({
        pocTeams: teams
    });
}
function getStoredPOCTeams() {
    const session = readSession();
    return Array.isArray(session.pocTeams) ? session.pocTeams : [];
}
function storePOCTeamDetail(team) {
    if (!team?.id) return;
    const session = readSession();
    const nextDetails = {
        ...session.pocTeamDetails ?? {},
        [team.id]: team
    };
    mergeSession({
        pocTeamDetails: nextDetails
    });
}
function getStoredPOCTeamDetail(teamId) {
    if (!teamId) return null;
    const session = readSession();
    const lookup = session.pocTeamDetails ?? {};
    return lookup[teamId] ?? null;
}
function storeAdminTeams(teams) {
    mergeSession({
        adminTeams: teams
    });
}
function getStoredAdminTeams() {
    const session = readSession();
    return Array.isArray(session.adminTeams) ? session.adminTeams : [];
}
function storeVolunteerTeams(teams) {
    mergeSession({
        volunteerTeams: teams
    });
}
function getStoredVolunteerTeams() {
    const session = readSession();
    return Array.isArray(session.volunteerTeams) ? session.volunteerTeams : [];
}
function storeVolunteerTeamDetail(team) {
    if (!team?.id) return;
    const session = readSession();
    const nextDetails = {
        ...session.volunteerTeamDetails ?? {},
        [team.id]: team
    };
    mergeSession({
        volunteerTeamDetails: nextDetails
    });
}
function getStoredVolunteerTeamDetail(teamId) {
    if (!teamId) return null;
    const session = readSession();
    const lookup = session.volunteerTeamDetails ?? {};
    return lookup[teamId] ?? null;
}
function getSessionSnapshot() {
    return readSession();
}
}),
"[project]/lib/auth-service.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Auth Service API Client
 * Handles all authentication-related API calls with secure token management
 */ __turbopack_context__.s([
    "authService",
    ()=>authService,
    "buildAuthBaseUrl",
    ()=>buildAuthBaseUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/session-store.ts [app-ssr] (ecmascript)");
;
const ACCESS_TOKEN_KEY = "sih_access_token";
const REFRESH_TOKEN_KEY = "sih_refresh_token";
const FALLBACK_AUTH_BASE_URL = "http://127.0.0.1:8000/auth/api";
function normalizeAuthPath(pathname) {
    let normalized = pathname.replace(/\/+$/, "");
    if (!normalized) return "/auth/api";
    if (!normalized.startsWith("/")) normalized = `/${normalized}`;
    if (normalized.endsWith("/auth/api")) return normalized;
    if (normalized.endsWith("/auth")) return `${normalized}/api`;
    if (normalized.endsWith("/api")) return normalized;
    return `${normalized}/auth/api`;
}
function buildAuthBaseUrl() {
    const raw = ("TURBOPACK compile-time value", "http://127.0.0.1:8000/");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (raw.startsWith("/")) {
        return normalizeAuthPath(raw);
    }
    try {
        const url = new URL(raw);
        url.pathname = normalizeAuthPath(url.pathname);
        return `${url.origin}${url.pathname}`;
    } catch (err) {
        console.warn("[auth-service] invalid NEXT_PUBLIC_AUTH_SERVICE_URL, using default", err);
        return FALLBACK_AUTH_BASE_URL;
    }
}
const BASE_URL = buildAuthBaseUrl();
class AuthService {
    accessTokenKey = ACCESS_TOKEN_KEY;
    refreshTokenKey = REFRESH_TOKEN_KEY;
    setTokens(access, refresh) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
    getAccessToken() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return null;
    }
    getRefreshToken() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return null;
    }
    clearTokens() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
    async request(endpoint, options = {}, retryCount = 0) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = new Headers(options.headers || {});
        const accessToken = this.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }
        const response = await fetch(url, {
            ...options,
            headers
        });
        const isRefreshRequest = endpoint.includes("/token/refresh/");
        if (response.status === 401) {
            const refreshToken = this.getRefreshToken();
            if (!isRefreshRequest && retryCount === 0 && refreshToken) {
                try {
                    await this.refreshAccessToken(refreshToken);
                    return this.request(endpoint, options, 1);
                } catch (error) {
                    this.clearTokens();
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSessionCache"])();
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
                    throw new Error("Session expired. Please login again.");
                }
            }
            this.clearTokens();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSessionCache"])();
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
        }
        if (!response.ok) {
            const error = await response.json().catch(()=>({}));
            const detailMessage = (error.detail || error.message || "").toString().toLowerCase();
            if (detailMessage.includes("token") && (detailMessage.includes("expired") || detailMessage.includes("invalid"))) {
                this.clearTokens();
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSessionCache"])();
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
            throw new Error(error.detail || error.message || `API Error: ${response.status}`);
        }
        return response.json();
    }
    getCurrentUser() {
        if ("TURBOPACK compile-time truthy", 1) return null;
        //TURBOPACK unreachable
        ;
        const token = undefined;
    }
    base64UrlDecode(input) {
        // Convert from base64url to base64
        let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
        // Pad with '=' to make length a multiple of 4
        const pad = base64.length % 4;
        if (pad) base64 += "=".repeat(4 - pad);
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Fallback for non-browser environments
        return Buffer.from(base64, "base64").toString("utf-8");
    }
    async login(request) {
        const response = await this.request("/token/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });
        this.setTokens(response.access, response.refresh);
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return response;
    }
    async refreshAccessToken(refreshToken) {
        const response = await this.request("/token/refresh/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                refresh: refreshToken
            })
        });
        const accessToken = response.access;
        localStorage.setItem(this.accessTokenKey, accessToken);
        return accessToken;
    }
    async requestOTP(email) {
        return this.request("/auth/send-otp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                purpose: "first_login"
            })
        });
    }
    async verifyOTPAndSetPassword(request) {
        return this.request("/auth/verify-otp/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });
    }
    async autoLogin(email, password) {
        return this.login({
            email,
            password
        });
    }
    async getTeamDetails(preview = false) {
        if (!preview) {
            const cached = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredLeaderTeam"])();
            if (cached) return cached;
        }
        const endpoint = preview ? "/leader/team/?preview=1" : "/leader/team/";
        const data = await this.request(endpoint);
        if (!preview) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeLeaderTeam"])(data);
        }
        return data;
    }
    async confirmTeamDetails() {
        return this.request("/leader/team/confirm/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        });
    }
    async getPOCTeams() {
        const cached = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredPOCTeams"])();
        if (cached.length) return cached;
        const data = await this.request("/poc/teams/");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storePOCTeams"])(data);
        return data;
    }
    async getPOCTeamDetail(teamId) {
        const cached = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredPOCTeamDetail"])(teamId);
        if (cached) return cached;
        const data = await this.request(`/poc/teams/${teamId}/`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storePOCTeamDetail"])(data);
        return data;
    }
    async getAdminTeams() {
        const cached = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredAdminTeams"])();
        if (cached.length) return cached;
        const data = await this.request("/admin/teams/");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeAdminTeams"])(data);
        return data;
    // return this.request("/poc/teams/")
    }
    async getVolunteerTeams() {
        const cached = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredVolunteerTeams"])();
        if (cached.length) return cached;
        const data = await this.request("/volunteer/teams/");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeVolunteerTeams"])(data);
        return data;
    }
    async getVolunteerTeamDetail(teamId) {
        const cached = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredVolunteerTeamDetail"])(teamId);
        if (cached) return cached;
        const data = await this.request(`/volunteer/teams/${teamId}/`);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeVolunteerTeamDetail"])(data);
        return data;
    }
    async updateTeamCheckIn(teamId, payload, method = "PATCH") {
        let body;
        if (method === "PATCH") {
            body = {
                ...payload
            };
        } else {
            body = {
                members_checked_in: Boolean(payload.members_checked_in),
                members_checked_out: Boolean(payload.members_checked_out),
                check_in_remarks: payload.check_in_remarks ?? "",
                room_allocation: payload.room_allocation ?? ""
            };
        }
        Object.keys(body).forEach((key)=>{
            if (body[key] === undefined) {
                delete body[key];
            }
        });
        const response = await this.request(`/teams/${teamId}/check-in/`, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
        // Update session caches for all relevant user roles
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeVolunteerTeamDetail"])(response);
        const volunteerTeams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredVolunteerTeams"])();
        if (volunteerTeams.length) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeVolunteerTeams"])(volunteerTeams.map((team)=>team.id === response.id ? {
                    ...team,
                    ...response
                } : team));
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storePOCTeamDetail"])(response);
        const pocTeams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredPOCTeams"])();
        if (pocTeams.length) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storePOCTeams"])(pocTeams.map((team)=>team.id === response.id ? {
                    ...team,
                    ...response
                } : team));
        }
        const adminTeams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredAdminTeams"])();
        if (adminTeams.length) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeAdminTeams"])(adminTeams.map((team)=>team.id === response.id ? {
                    ...team,
                    ...response
                } : team));
        }
        const leaderTeam = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getStoredLeaderTeam"])();
        if (leaderTeam?.id === response.id) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storeLeaderTeam"])(response);
        }
        return response;
    }
    async logout() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.clearTokens();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSessionCache"])();
            return {
                detail: "Logged out"
            };
        }
        try {
            const response = await this.request("/auth/logout/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refresh: refreshToken
                })
            });
            this.clearTokens();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSessionCache"])();
            return response;
        } catch (error) {
            this.clearTokens();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSessionCache"])();
            return {
                detail: "Logged out"
            };
        }
    }
    async logoutAll() {
        try {
            const response = await this.request("/auth/logout_all/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            this.clearTokens();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSessionCache"])();
            return response;
        } catch (error) {
            this.clearTokens();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearSessionCache"])();
            return {
                detail: "Logged out from all devices"
            };
        }
    }
    async initializeUserContext(force = false) {
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const user = undefined;
    }
}
const authService = new AuthService();
}),
"[project]/app/confirm-team/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ConfirmTeamPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-service.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
function ConfirmTeamPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [team, setTeam] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [confirming, setConfirming] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchTeamDetails = async ()=>{
            try {
                const teamData = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].getTeamDetails(true);
                setTeam(teamData);
            } catch (err) {
                setError(err.message || "Failed to load team details");
            } finally{
                setLoading(false);
            }
        };
        fetchTeamDetails();
    }, []);
    const handleConfirm = async ()=>{
        setConfirming(true);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].confirmTeamDetails();
            router.push("/dashboard");
        } catch (err) {
            setError(err.message || "Failed to confirm team details");
            setConfirming(false);
        }
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-white flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-12 h-12 border-4 border-gray-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"
                    }, void 0, false, {
                        fileName: "[project]/app/confirm-team/page.tsx",
                        lineNumber: 46,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600 font-medium",
                        children: "Loading team details..."
                    }, void 0, false, {
                        fileName: "[project]/app/confirm-team/page.tsx",
                        lineNumber: 47,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/confirm-team/page.tsx",
                lineNumber: 45,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/confirm-team/page.tsx",
            lineNumber: 44,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-white border-b border-gray-200",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    src: "/sih_banner.png",
                                    alt: "Smart India Hackathon banner",
                                    width: 320,
                                    height: 90,
                                    className: "h-20 w-auto",
                                    priority: true
                                }, void 0, false, {
                                    fileName: "[project]/app/confirm-team/page.tsx",
                                    lineNumber: 59,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-16 w-px bg-gray-300",
                                    "aria-hidden": "true"
                                }, void 0, false, {
                                    fileName: "[project]/app/confirm-team/page.tsx",
                                    lineNumber: 67,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    src: "/gitam_logo.png",
                                    alt: "GITAM",
                                    width: 240,
                                    height: 90,
                                    className: "h-16 w-auto"
                                }, void 0, false, {
                                    fileName: "[project]/app/confirm-team/page.tsx",
                                    lineNumber: 68,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/confirm-team/page.tsx",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl font-bold text-center md:text-right",
                            style: {
                                color: "#002449"
                            },
                            children: "Team Confirmation"
                        }, void 0, false, {
                            fileName: "[project]/app/confirm-team/page.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/confirm-team/page.tsx",
                    lineNumber: 57,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/confirm-team/page.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "max-w-6xl mx-auto px-4 py-8",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-3xl md:text-4xl font-bold mb-2",
                                    style: {
                                        color: "#002449"
                                    },
                                    children: "Confirm Team Details"
                                }, void 0, false, {
                                    fileName: "[project]/app/confirm-team/page.tsx",
                                    lineNumber: 79,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-gray-600",
                                    children: "Please verify your team information before proceeding to the dashboard"
                                }, void 0, false, {
                                    fileName: "[project]/app/confirm-team/page.tsx",
                                    lineNumber: 82,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/confirm-team/page.tsx",
                            lineNumber: 78,
                            columnNumber: 11
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-red-50 border border-red-200 rounded-lg p-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-red-800",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/app/confirm-team/page.tsx",
                                lineNumber: 87,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/confirm-team/page.tsx",
                            lineNumber: 86,
                            columnNumber: 13
                        }, this),
                        team && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white border border-gray-200 rounded-lg p-8 shadow-md",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-2xl font-bold mb-6",
                                            style: {
                                                color: "#f75700"
                                            },
                                            children: "Team Information"
                                        }, void 0, false, {
                                            fileName: "[project]/app/confirm-team/page.tsx",
                                            lineNumber: 95,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "pb-4 border-b border-gray-200",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs font-medium text-gray-500 uppercase mb-2",
                                                            children: "Team Name"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 101,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-lg font-semibold text-gray-900",
                                                            children: team.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 102,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/confirm-team/page.tsx",
                                                    lineNumber: 100,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "pb-4 border-b border-gray-200",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs font-medium text-gray-500 uppercase mb-2",
                                                            children: "Institution"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 106,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-lg font-semibold text-gray-900",
                                                            children: team.institution
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 107,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/confirm-team/page.tsx",
                                                    lineNumber: 105,
                                                    columnNumber: 19
                                                }, this),
                                                team.problem_statement && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "pb-4 border-b border-gray-200 md:col-span-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs font-medium text-gray-500 uppercase mb-2",
                                                            children: "Problem Statement"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 112,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-lg font-semibold text-gray-900",
                                                            children: team.problem_statement.title
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 113,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm font-medium mt-2",
                                                            style: {
                                                                color: "#f75700"
                                                            },
                                                            children: [
                                                                "ID: ",
                                                                team.problem_statement.id
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 114,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/confirm-team/page.tsx",
                                                    lineNumber: 111,
                                                    columnNumber: 21
                                                }, this),
                                                team.faculty_mentor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "pb-4 border-b border-gray-200",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs font-medium text-gray-500 uppercase mb-2",
                                                            children: "Faculty Mentor"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 122,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-lg font-semibold text-gray-900",
                                                            children: team.faculty_mentor.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 123,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/confirm-team/page.tsx",
                                                    lineNumber: 121,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/confirm-team/page.tsx",
                                            lineNumber: 99,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/confirm-team/page.tsx",
                                    lineNumber: 94,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white border border-gray-200 rounded-lg p-8 shadow-md",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-2xl font-bold mb-6",
                                            style: {
                                                color: "#f75700"
                                            },
                                            children: [
                                                "Team Members (",
                                                team.members?.length || 0,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/confirm-team/page.tsx",
                                            lineNumber: 131,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                                            children: team.members?.map((member, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "font-semibold text-gray-900",
                                                            children: member.user.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 141,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-gray-600 mt-2 break-all",
                                                            children: member.user.email
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 142,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-xs font-bold mt-3 uppercase",
                                                            style: {
                                                                color: "#f75700"
                                                            },
                                                            children: member.role
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/confirm-team/page.tsx",
                                                            lineNumber: 143,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, idx, true, {
                                                    fileName: "[project]/app/confirm-team/page.tsx",
                                                    lineNumber: 137,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/app/confirm-team/page.tsx",
                                            lineNumber: 135,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/confirm-team/page.tsx",
                                    lineNumber: 130,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white border border-gray-200 rounded-lg p-8 shadow-md",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "p-4 rounded-lg",
                                                style: {
                                                    backgroundColor: "#f0e0c1"
                                                },
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm font-medium text-gray-900",
                                                    children: "Please review all information above carefully. Once confirmed, you will be redirected to your dashboard."
                                                }, void 0, false, {
                                                    fileName: "[project]/app/confirm-team/page.tsx",
                                                    lineNumber: 155,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/confirm-team/page.tsx",
                                                lineNumber: 154,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col sm:flex-row gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: handleConfirm,
                                                        disabled: confirming,
                                                        className: "flex-1 py-3 text-white font-semibold rounded-lg transition-opacity disabled:opacity-50",
                                                        style: {
                                                            backgroundColor: "#f75700"
                                                        },
                                                        onMouseEnter: (e)=>!confirming && (e.currentTarget.style.opacity = "0.9"),
                                                        onMouseLeave: (e)=>!confirming && (e.currentTarget.style.opacity = "1"),
                                                        children: confirming ? "Confirming..." : "Confirm & Continue"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/confirm-team/page.tsx",
                                                        lineNumber: 162,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>router.push("/"),
                                                        className: "flex-1 py-3 text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors",
                                                        children: "Cancel"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/confirm-team/page.tsx",
                                                        lineNumber: 172,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/confirm-team/page.tsx",
                                                lineNumber: 161,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/confirm-team/page.tsx",
                                        lineNumber: 153,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/confirm-team/page.tsx",
                                    lineNumber: 152,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/confirm-team/page.tsx",
                    lineNumber: 77,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/confirm-team/page.tsx",
                lineNumber: 76,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/confirm-team/page.tsx",
        lineNumber: 54,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_50a26cda._.js.map