(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/auth-service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Auth Service API Client
 * Handles all authentication-related API calls with secure token management
 */ __turbopack_context__.s([
    "authService",
    ()=>authService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/compiled/buffer/index.js [app-client] (ecmascript)");
const ACCESS_TOKEN_KEY = "sih_access_token";
const REFRESH_TOKEN_KEY = "sih_refresh_token";
const BASE_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://127.0.0.1:8000/api";
class AuthService {
    accessTokenKey = ACCESS_TOKEN_KEY;
    refreshTokenKey = REFRESH_TOKEN_KEY;
    setTokens(access, refresh) {
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.setItem(this.accessTokenKey, access);
            localStorage.setItem(this.refreshTokenKey, refresh);
        }
    }
    getAccessToken() {
        if ("TURBOPACK compile-time truthy", 1) {
            return localStorage.getItem(this.accessTokenKey);
        }
        //TURBOPACK unreachable
        ;
    }
    getRefreshToken() {
        if ("TURBOPACK compile-time truthy", 1) {
            return localStorage.getItem(this.refreshTokenKey);
        }
        //TURBOPACK unreachable
        ;
    }
    clearTokens() {
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.removeItem(this.accessTokenKey);
            localStorage.removeItem(this.refreshTokenKey);
        }
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
        if (response.status === 401 && retryCount === 0) {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
                try {
                    const newAccessToken = await this.refreshAccessToken(refreshToken);
                    return this.request(endpoint, options, 1);
                } catch (error) {
                    this.clearTokens();
                    if ("TURBOPACK compile-time truthy", 1) {
                        window.location.href = "/login";
                    }
                    throw new Error("Session expired. Please login again.");
                }
            }
        }
        if (!response.ok) {
            const error = await response.json().catch(()=>({}));
            throw new Error(error.detail || error.message || `API Error: ${response.status}`);
        }
        return response.json();
    }
    getCurrentUser() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const token = this.getAccessToken();
        if (!token) return null;
        try {
            const [, payload] = token.split(".");
            if (!payload) return null;
            const json = JSON.parse(this.base64UrlDecode(payload));
            return json;
        } catch (e) {
            return null;
        }
    }
    base64UrlDecode(input) {
        // Convert from base64url to base64
        let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
        // Pad with '=' to make length a multiple of 4
        const pad = base64.length % 4;
        if (pad) base64 += "=".repeat(4 - pad);
        if (("TURBOPACK compile-time value", "object") !== "undefined" && typeof window.atob === "function") {
            return decodeURIComponent(Array.prototype.map.call(window.atob(base64), (c)=>"%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join(""));
        }
        // Fallback for non-browser environments
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$buffer$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Buffer"].from(base64, "base64").toString("utf-8");
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
        const endpoint = preview ? "/leader/team/?preview=1" : "/leader/team/";
        return this.request(endpoint);
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
        return this.request("/poc/teams/");
    }
    async getPOCTeamDetail(teamId) {
        return this.request(`/poc/teams/${teamId}/`);
    }
    async logout() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.clearTokens();
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
            return response;
        } catch (error) {
            this.clearTokens();
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
            return response;
        } catch (error) {
            this.clearTokens();
            return {
                detail: "Logged out from all devices"
            };
        }
    }
}
const authService = new AuthService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/requests-service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Requests Service API Client
 * Handles all communication with the Requests microservice
 */ __turbopack_context__.s([
    "requestsService",
    ()=>requestsService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-service.ts [app-client] (ecmascript)");
;
const BASE_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_REQUESTS_SERVICE_URL || "http://127.0.0.1:8001/api";
const ACCESS_TOKEN_KEY = "sih_access_token";
async function apiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});
    const accessToken = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].getAccessToken();
    if (accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    let response = await fetch(url, {
        ...options,
        headers
    });
    if (response.status === 401) {
        const refreshToken = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].getRefreshToken();
        if (refreshToken) {
            try {
                const refreshResponse = await fetch(`${BASE_URL}/token/refresh/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        refresh: refreshToken
                    })
                });
                if (refreshResponse.ok) {
                    const { access } = await refreshResponse.json();
                    localStorage.setItem(ACCESS_TOKEN_KEY, access);
                    headers.set("Authorization", `Bearer ${access}`);
                    response = await fetch(url, {
                        ...options,
                        headers
                    });
                }
            } catch (error) {
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].clearTokens();
                window.location.href = "/login";
            }
        }
    }
    if (!response.ok) {
        const error = await response.json().catch(()=>({}));
        throw new Error(error.detail || error.message || `API Error: ${response.status}`);
    }
    return response.json();
}
const requestsService = {
    // List requests with filters
    async listRequests (params) {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append("category", params.category);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.fab_type) queryParams.append("fab_type", params.fab_type);
        if (params?.team_id) queryParams.append("team_id", params.team_id);
        if (params?.search) queryParams.append("search", params.search);
        if (params?.ordering) queryParams.append("ordering", params.ordering);
        if (params?.page) queryParams.append("page", params.page.toString());
        const endpoint = `/requests/?${queryParams.toString()}`;
        return apiCall(endpoint);
    },
    // Get queue snapshot
    async getQueueSnapshot (includePositions = true) {
        const endpoint = `/requests/queue/?include_positions=${includePositions}`;
        return apiCall(endpoint);
    },
    // Get single request
    async getRequest (id) {
        return apiCall(`/requests/${id}/`);
    },
    // Create BOM request
    async createBOMRequest (teamId, notes, items) {
        return apiCall("/requests/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                team_id: teamId,
                category: "BOM",
                notes,
                bom_items: items
            })
        });
    },
    // Create Additional request
    async createAdditionalRequest (teamId, notes, items) {
        return apiCall("/requests/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                team_id: teamId,
                category: "ADDITIONAL",
                notes,
                additional_items: items
            })
        });
    },
    // Create Fabrication request with file
    async createFabricationRequest (teamId, notes, fabDetails, file) {
        const formData = new FormData();
        formData.append("team_id", teamId);
        formData.append("category", "FABRICATION");
        formData.append("notes", notes);
        formData.append("fabrication", JSON.stringify(fabDetails));
        if (file) {
            formData.append("file", file);
        }
        const accessToken = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].getAccessToken();
        const headers = new Headers();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }
        const response = await fetch(`${BASE_URL}/requests/`, {
            method: "POST",
            headers,
            body: formData
        });
        if (!response.ok) {
            const error = await response.json().catch(()=>({}));
            throw new Error(error.detail || error.message || `API Error: ${response.status}`);
        }
        return response.json();
    },
    // Change request status
    async changeRequestStatus (id, toStatus, note) {
        return apiCall(`/requests/${id}/change_status/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                to_status: toStatus,
                note: note || ""
            })
        });
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/hooks/use-requests-ws.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useRequestsWS",
    ()=>useRequestsWS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * WebSocket hook for real-time requests queue updates
 * Handles automatic reconnection with exponential backoff
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-service.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
// Derive backend origin for WebSocket from NEXT_PUBLIC_REQUESTS_SERVICE_URL if provided.
// Fallback to current window.location.origin (same host/port as frontend) if not set.
function getBackendWsOrigin() {
    const envBase = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_REQUESTS_SERVICE_URL;
    if (envBase) {
        try {
            const u = new URL(envBase);
            return u.origin // strip path (/api)
            ;
        } catch (_) {
        // ignore malformed; fallback below
        }
    }
    if ("TURBOPACK compile-time truthy", 1) return window.location.origin;
    //TURBOPACK unreachable
    ;
}
const INITIAL_BACKOFF = 1000;
const MAX_BACKOFF = 30000;
function useRequestsWS(onEvent) {
    _s();
    const wsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const backoffRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(INITIAL_BACKOFF);
    const closedManuallyRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const reconnectTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(undefined);
    const getWsUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useRequestsWS.useCallback[getWsUrl]": ()=>{
            const token = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].getAccessToken();
            if (!token) return null;
            const origin = getBackendWsOrigin();
            if (!origin) return null;
            const secure = origin.startsWith("https://");
            const wsProtocol = secure ? "wss" : "ws";
            // Convert origin (http[s]://host[:port]) to ws(s)://host[:port]
            const hostPort = origin.replace(/^https?:\/\//, "");
            return `${wsProtocol}://${hostPort}/ws/requests/?token=${token}`;
        }
    }["useRequestsWS.useCallback[getWsUrl]"], []);
    const connect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useRequestsWS.useCallback[connect]": ()=>{
            const wsUrl = getWsUrl();
            if (!wsUrl) return;
            try {
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;
                ws.onopen = ({
                    "useRequestsWS.useCallback[connect]": ()=>{
                        console.log("[v0] WebSocket connected");
                        backoffRef.current = INITIAL_BACKOFF;
                    }
                })["useRequestsWS.useCallback[connect]"];
                ws.onmessage = ({
                    "useRequestsWS.useCallback[connect]": (event)=>{
                        try {
                            const message = JSON.parse(event.data);
                            onEvent(message);
                        } catch (error) {
                            console.error("[v0] Failed to parse WS message:", error);
                        }
                    }
                })["useRequestsWS.useCallback[connect]"];
                ws.onclose = ({
                    "useRequestsWS.useCallback[connect]": (evt)=>{
                        console.log("[v0] WebSocket closed", evt.code, evt.reason || "");
                        if (closedManuallyRef.current) return;
                        // Schedule reconnect with exponential backoff
                        reconnectTimeoutRef.current = setTimeout({
                            "useRequestsWS.useCallback[connect]": ()=>{
                                console.log("[v0] Attempting to reconnect with backoff:", backoffRef.current);
                                connect();
                                backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
                            }
                        }["useRequestsWS.useCallback[connect]"], backoffRef.current);
                    }
                })["useRequestsWS.useCallback[connect]"];
                ws.onerror = ({
                    "useRequestsWS.useCallback[connect]": (error)=>{
                        console.error("[v0] WebSocket error:", error);
                    }
                })["useRequestsWS.useCallback[connect]"];
            } catch (error) {
                console.error("[v0] Failed to create WebSocket:", error);
            }
        }
    }["useRequestsWS.useCallback[connect]"], [
        getWsUrl,
        onEvent
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useRequestsWS.useEffect": ()=>{
            closedManuallyRef.current = false;
            connect();
            return ({
                "useRequestsWS.useEffect": ()=>{
                    closedManuallyRef.current = true;
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                    }
                    if (wsRef.current) {
                        wsRef.current.close();
                    }
                }
            })["useRequestsWS.useEffect"];
        }
    }["useRequestsWS.useEffect"], [
        connect
    ]);
    return {
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
        close: ()=>{
            closedManuallyRef.current = true;
            wsRef.current?.close();
        }
    };
}
_s(useRequestsWS, "zL7cZ2V+ULHQYMrdoHyhfeQ6sww=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RequestsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$requests$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/requests-service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$requests$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/use-requests-ws.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function RequestsPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [requests, setRequests] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [userTeams, setUserTeams] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const user = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].getCurrentUser();
    // Fetch user's teams
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RequestsPage.useEffect": ()=>{
            const token = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].getAccessToken();
            if (!token) {
                router.push("/login");
                return;
            }
            if (user?.team_ids) {
                setUserTeams(user.team_ids);
            }
        }
    }["RequestsPage.useEffect"], [
        user,
        router
    ]);
    // Fetch requests for user's teams
    const fetchRequests = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RequestsPage.useCallback[fetchRequests]": async ()=>{
            try {
                setLoading(true);
                setError("");
                if (!userTeams.length) {
                    setRequests([]);
                    setLoading(false);
                    return;
                }
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$requests$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestsService"].listRequests({
                    ordering: "-created_at"
                });
                // Filter to only user's teams
                const filtered = response.results.filter({
                    "RequestsPage.useCallback[fetchRequests].filtered": (r)=>userTeams.includes(r.team_id)
                }["RequestsPage.useCallback[fetchRequests].filtered"]);
                setRequests(filtered);
            } catch (err) {
                console.error("[v0] Error fetching requests:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch requests");
            } finally{
                setLoading(false);
            }
        }
    }["RequestsPage.useCallback[fetchRequests]"], [
        userTeams
    ]);
    // WebSocket handler
    const handleWsEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "RequestsPage.useCallback[handleWsEvent]": (message)=>{
            if (userTeams.length === 0) return;
            if (message.event === "request_created" || message.event === "request_updated") {
                if (userTeams.includes(message.request?.team_id)) {
                    setRequests({
                        "RequestsPage.useCallback[handleWsEvent]": (prev)=>{
                            const filtered = prev.filter({
                                "RequestsPage.useCallback[handleWsEvent].filtered": (r)=>r.id !== message.request?.id
                            }["RequestsPage.useCallback[handleWsEvent].filtered"]);
                            return [
                                message.request,
                                ...filtered
                            ].sort({
                                "RequestsPage.useCallback[handleWsEvent]": (a, b)=>new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                            }["RequestsPage.useCallback[handleWsEvent]"]);
                        }
                    }["RequestsPage.useCallback[handleWsEvent]"]);
                }
            } else if (message.event === "state_transition") {
                setRequests({
                    "RequestsPage.useCallback[handleWsEvent]": (prev)=>prev.map({
                            "RequestsPage.useCallback[handleWsEvent]": (r)=>r.id === message.request_id ? {
                                    ...r,
                                    status: message.to
                                } : r
                        }["RequestsPage.useCallback[handleWsEvent]"])
                }["RequestsPage.useCallback[handleWsEvent]"]);
            }
        }
    }["RequestsPage.useCallback[handleWsEvent]"], [
        userTeams
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$requests$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRequestsWS"])(handleWsEvent);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RequestsPage.useEffect": ()=>{
            if (userTeams.length > 0) {
                fetchRequests();
            }
        }
    }["RequestsPage.useEffect"], [
        userTeams,
        fetchRequests
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-white border-b border-gray-200 sticky top-0 z-40",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-4 py-4 flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    src: "/images/image.png",
                                    alt: "Smart India Hackathon",
                                    width: 120,
                                    height: 40,
                                    className: "h-10 w-auto"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 95,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    src: "/images/gitam-logo-20-282-29.png",
                                    alt: "GITAM",
                                    width: 60,
                                    height: 40,
                                    className: "h-10 w-auto"
                                }, void 0, false, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 102,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 94,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-2xl font-bold",
                            style: {
                                color: "#002449"
                            },
                            children: "My Requests"
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 104,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/requests/new",
                            className: "px-4 py-2 text-white font-medium rounded-lg transition-opacity",
                            style: {
                                backgroundColor: "#f75700"
                            },
                            onMouseEnter: (e)=>e.currentTarget.style.opacity = "0.9",
                            onMouseLeave: (e)=>e.currentTarget.style.opacity = "1",
                            children: "New Request"
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 93,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "max-w-7xl mx-auto px-4 py-8",
                children: [
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-red-800",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 122,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 121,
                        columnNumber: 11
                    }, this),
                    loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-12",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-600",
                            children: "Loading requests..."
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 128,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 127,
                        columnNumber: 11
                    }, this) : requests.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mb-4",
                                children: "No requests yet"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 132,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/requests/new",
                                className: "inline-block px-4 py-2 text-white font-medium rounded-lg",
                                style: {
                                    backgroundColor: "#f75700"
                                },
                                children: "Create Your First Request"
                            }, void 0, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 131,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                        children: requests.map((request)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: `/requests/${request.id}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer h-full",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between mb-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "inline-block px-3 py-1 text-xs font-semibold text-white rounded-full",
                                                    style: {
                                                        backgroundColor: request.category === "BOM" ? "#002449" : request.category === "ADDITIONAL" ? "#007367" : "#f75700"
                                                    },
                                                    children: request.category
                                                }, void 0, false, {
                                                    fileName: "[project]/app/page.tsx",
                                                    lineNumber: 147,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "inline-block px-3 py-1 text-xs font-semibold rounded-full",
                                                    style: {
                                                        backgroundColor: request.status === "Submitted" ? "#f0e0c1" : request.status === "Processing" ? "#e3f2fd" : request.status === "Issued" ? "#e8f5e9" : "#ffebee",
                                                        color: request.status === "Submitted" ? "#f75700" : request.status === "Processing" ? "#002449" : request.status === "Issued" ? "#078e31" : "#c62828"
                                                    },
                                                    children: request.status
                                                }, void 0, false, {
                                                    fileName: "[project]/app/page.tsx",
                                                    lineNumber: 160,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/page.tsx",
                                            lineNumber: 146,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-lg font-semibold text-gray-900 mb-2",
                                            children: request.notes || "Untitled"
                                        }, void 0, false, {
                                            fileName: "[project]/app/page.tsx",
                                            lineNumber: 185,
                                            columnNumber: 19
                                        }, this),
                                        request.fabrication && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-600 mb-2",
                                            children: [
                                                request.fabrication.fab_type,
                                                " - ",
                                                request.fabrication.name
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/page.tsx",
                                            lineNumber: 188,
                                            columnNumber: 21
                                        }, this),
                                        request.bom_items?.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-600 mb-2",
                                            children: [
                                                request.bom_items.length,
                                                " items"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/page.tsx",
                                            lineNumber: 194,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-500",
                                            children: new Date(request.created_at).toLocaleDateString()
                                        }, void 0, false, {
                                            fileName: "[project]/app/page.tsx",
                                            lineNumber: 197,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/page.tsx",
                                    lineNumber: 145,
                                    columnNumber: 17
                                }, this)
                            }, request.id, false, {
                                fileName: "[project]/app/page.tsx",
                                lineNumber: 144,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 142,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 119,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
_s(RequestsPage, "bFCfN3oTWM9Tl0e8G6kJz3aOvQY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$requests$2d$ws$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRequestsWS"]
    ];
});
_c = RequestsPage;
var _c;
__turbopack_context__.k.register(_c, "RequestsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_be30c725._.js.map