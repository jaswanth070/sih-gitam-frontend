module.exports = [
"[project]/lib/auth-service.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Auth Service API Client
 * Handles all authentication-related API calls with secure token management
 */ __turbopack_context__.s([
    "authService",
    ()=>authService
]);
const ACCESS_TOKEN_KEY = "sih_access_token";
const REFRESH_TOKEN_KEY = "sih_refresh_token";
const BASE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://127.0.0.1:8000/api";
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
        if (response.status === 401 && retryCount === 0) {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
                try {
                    const newAccessToken = await this.refreshAccessToken(refreshToken);
                    return this.request(endpoint, options, 1);
                } catch (error) {
                    this.clearTokens();
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
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
}),
"[project]/lib/requests-service.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Requests Service API Client
 * Handles all communication with the Requests microservice
 */ __turbopack_context__.s([
    "requestsService",
    ()=>requestsService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-service.ts [app-ssr] (ecmascript)");
;
const BASE_URL = process.env.NEXT_PUBLIC_REQUESTS_SERVICE_URL || "http://127.0.0.1:8001/api";
const ACCESS_TOKEN_KEY = "sih_access_token";
async function apiCall(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});
    const accessToken = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].getAccessToken();
    if (accessToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }
    let response = await fetch(url, {
        ...options,
        headers
    });
    if (response.status === 401) {
        const refreshToken = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].getRefreshToken();
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
                __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].clearTokens();
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
        const accessToken = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].getAccessToken();
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
}),
"[project]/hooks/use-requests-ws.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useRequestsWS",
    ()=>useRequestsWS
]);
/**
 * WebSocket hook for real-time requests queue updates
 * Handles automatic reconnection with exponential backoff
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-service.ts [app-ssr] (ecmascript)");
"use client";
;
;
// Derive backend origin for WebSocket from NEXT_PUBLIC_REQUESTS_SERVICE_URL if provided.
// Fallback to current window.location.origin (same host/port as frontend) if not set.
function getBackendWsOrigin() {
    const envBase = process.env.NEXT_PUBLIC_REQUESTS_SERVICE_URL;
    if (envBase) {
        try {
            const u = new URL(envBase);
            return u.origin // strip path (/api)
            ;
        } catch (_) {
        // ignore malformed; fallback below
        }
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return null;
}
const INITIAL_BACKOFF = 1000;
const MAX_BACKOFF = 30000;
function useRequestsWS(onEvent) {
    const wsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const backoffRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(INITIAL_BACKOFF);
    const closedManuallyRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const reconnectTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(undefined);
    const getWsUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const token = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].getAccessToken();
        if (!token) return null;
        const origin = getBackendWsOrigin();
        if (!origin) return null;
        const secure = origin.startsWith("https://");
        const wsProtocol = secure ? "wss" : "ws";
        // Convert origin (http[s]://host[:port]) to ws(s)://host[:port]
        const hostPort = origin.replace(/^https?:\/\//, "");
        return `${wsProtocol}://${hostPort}/ws/requests/?token=${token}`;
    }, []);
    const connect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const wsUrl = getWsUrl();
        if (!wsUrl) return;
        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            ws.onopen = ()=>{
                console.log("[v0] WebSocket connected");
                backoffRef.current = INITIAL_BACKOFF;
            };
            ws.onmessage = (event)=>{
                try {
                    const message = JSON.parse(event.data);
                    onEvent(message);
                } catch (error) {
                    console.error("[v0] Failed to parse WS message:", error);
                }
            };
            ws.onclose = (evt)=>{
                console.log("[v0] WebSocket closed", evt.code, evt.reason || "");
                if (closedManuallyRef.current) return;
                // Schedule reconnect with exponential backoff
                reconnectTimeoutRef.current = setTimeout(()=>{
                    console.log("[v0] Attempting to reconnect with backoff:", backoffRef.current);
                    connect();
                    backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
                }, backoffRef.current);
            };
            ws.onerror = (error)=>{
                console.error("[v0] WebSocket error:", error);
            };
        } catch (error) {
            console.error("[v0] Failed to create WebSocket:", error);
        }
    }, [
        getWsUrl,
        onEvent
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        closedManuallyRef.current = false;
        connect();
        return ()=>{
            closedManuallyRef.current = true;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [
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
}),
"[project]/app/poc/teams/[id]/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>POCTeamDetailsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth-service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$requests$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/requests-service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$requests$2d$ws$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/use-requests-ws.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
;
;
function POCTeamDetailsPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const teamId = params.id;
    const [team, setTeam] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [requests, setRequests] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const fetchTeamDetails = async ()=>{
            try {
                const teamData = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].getPOCTeamDetail(teamId);
                setTeam(teamData);
            } catch (err) {
                setError(err.message || "Failed to load team details");
            } finally{
                setLoading(false);
            }
        };
        if (teamId) {
            fetchTeamDetails();
        }
    }, [
        teamId
    ]);
    const handleWsEvent = (message)=>{
        if (message.event === "request_created" || message.event === "request_updated") {
            if (message.request?.team_id === teamId) {
                setRequests((prev)=>{
                    const filtered = prev.filter((r)=>r.id !== message.request?.id);
                    return [
                        message.request,
                        ...filtered
                    ].sort((a, b)=>new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                });
            }
        } else if (message.event === "state_transition") {
            setRequests((prev)=>prev.map((r)=>r.id === message.request_id ? {
                        ...r,
                        status: message.to
                    } : r));
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$use$2d$requests$2d$ws$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRequestsWS"])(handleWsEvent);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!teamId) return;
        const fetchRequests = async ()=>{
            try {
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$requests$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestsService"].listRequests({
                    team_id: teamId,
                    ordering: "-created_at"
                });
                setRequests(response.results);
            } catch (err) {
                console.error("Error fetching requests:", err);
            }
        };
        fetchRequests();
    }, [
        teamId
    ]);
    const handleStatusChange = async (requestId, newStatus)=>{
        try {
            const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$requests$2d$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["requestsService"].changeRequestStatus(requestId, newStatus);
            setRequests((prev)=>prev.map((r)=>r.id === updated.id ? updated : r));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update status");
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
                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                        lineNumber: 86,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600 font-medium",
                        children: "Loading team details..."
                    }, void 0, false, {
                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                        lineNumber: 87,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                lineNumber: 85,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/poc/teams/[id]/page.tsx",
            lineNumber: 84,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "bg-white border-b border-gray-200 sticky top-0 z-40",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-6xl mx-auto px-4 py-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        src: "/images/image.png",
                                        alt: "Smart India Hackathon",
                                        width: 120,
                                        height: 40,
                                        className: "h-10 w-auto"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 100,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        src: "/images/gitam-logo-20-282-29.png",
                                        alt: "GITAM",
                                        width: 60,
                                        height: 40,
                                        className: "h-10 w-auto"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 107,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                lineNumber: 99,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-2xl font-bold",
                                style: {
                                    color: "#002449"
                                },
                                children: "Team Details"
                            }, void 0, false, {
                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                lineNumber: 115,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/dashboard",
                                className: "text-gray-600 hover:text-gray-900 font-medium",
                                children: "← Back"
                            }, void 0, false, {
                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                        lineNumber: 98,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/poc/teams/[id]/page.tsx",
                    lineNumber: 97,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                lineNumber: 96,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "max-w-6xl mx-auto px-4 py-8",
                children: [
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-red-800",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/app/poc/teams/[id]/page.tsx",
                            lineNumber: 128,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                        lineNumber: 127,
                        columnNumber: 11
                    }, this),
                    team && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white border border-gray-200 rounded-lg p-8 shadow-md",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold mb-6",
                                        style: {
                                            color: "#f75700"
                                        },
                                        children: "Team Information"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 136,
                                        columnNumber: 15
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
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 142,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-lg font-semibold text-gray-900",
                                                        children: team.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 143,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                lineNumber: 141,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pb-4 border-b border-gray-200",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-medium text-gray-500 uppercase mb-2",
                                                        children: "Institution"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 147,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-lg font-semibold text-gray-900",
                                                        children: team.institution
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 148,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                lineNumber: 146,
                                                columnNumber: 17
                                            }, this),
                                            team.problem_statement && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pb-4 border-b border-gray-200 md:col-span-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-medium text-gray-500 uppercase mb-2",
                                                        children: "Problem Statement"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 153,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-lg font-semibold text-gray-900",
                                                        children: team.problem_statement.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 154,
                                                        columnNumber: 21
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
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 155,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                lineNumber: 152,
                                                columnNumber: 19
                                            }, this),
                                            team.faculty_mentor && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pb-4 border-b border-gray-200",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-medium text-gray-500 uppercase mb-2",
                                                        children: "Faculty Mentor"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 163,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-lg font-semibold text-gray-900",
                                                        children: team.faculty_mentor.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 164,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                lineNumber: 162,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 140,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                lineNumber: 135,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white border border-gray-200 rounded-lg p-8 shadow-md",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
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
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 172,
                                        columnNumber: 15
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
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 182,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-gray-600 mt-2 break-all",
                                                        children: member.user.email
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 183,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs font-bold mt-3 uppercase",
                                                        style: {
                                                            color: "#f75700"
                                                        },
                                                        children: member.role
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 184,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, idx, true, {
                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                lineNumber: 178,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 176,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                lineNumber: 171,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white border border-gray-200 rounded-lg p-8 shadow-md",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-2xl font-bold mb-6",
                                        style: {
                                            color: "#f75700"
                                        },
                                        children: [
                                            "Requests (",
                                            requests.length,
                                            ")"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 193,
                                        columnNumber: 15
                                    }, this),
                                    requests.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-center py-12",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-600",
                                            children: "No requests from this team yet"
                                        }, void 0, false, {
                                            fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                            lineNumber: 199,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 198,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-y-4",
                                        children: requests.map((request)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-start justify-between mb-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex-1",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex items-center gap-3 mb-2",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "px-3 py-1 text-xs font-semibold text-white rounded-full",
                                                                                style: {
                                                                                    backgroundColor: request.category === "BOM" ? "#002449" : request.category === "ADDITIONAL" ? "#007367" : "#f75700"
                                                                                },
                                                                                children: request.category
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                                lineNumber: 211,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "px-3 py-1 text-xs font-semibold text-white rounded-full",
                                                                                style: {
                                                                                    backgroundColor: request.status === "Submitted" ? "#f75700" : request.status === "Processing" ? "#002449" : request.status === "Issued" ? "#078e31" : "#999"
                                                                                },
                                                                                children: request.status
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                                lineNumber: 224,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                        lineNumber: 210,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                        className: "font-semibold text-gray-900",
                                                                        children: request.notes || "Untitled Request"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                        lineNumber: 240,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm text-gray-600 mt-2",
                                                                        children: new Date(request.created_at).toLocaleDateString()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                        lineNumber: 241,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                lineNumber: 209,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                href: `/requests/${request.id}`,
                                                                className: "text-blue-600 hover:text-blue-800 font-medium text-sm",
                                                                children: "View Details →"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                lineNumber: 246,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 208,
                                                        columnNumber: 23
                                                    }, this),
                                                    request.bom_items && request.bom_items.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 p-3 bg-gray-50 rounded-lg text-sm",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "font-medium text-gray-700",
                                                            children: [
                                                                "BOM Items: ",
                                                                request.bom_items.length
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                            lineNumber: 257,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 256,
                                                        columnNumber: 25
                                                    }, this),
                                                    request.additional_items && request.additional_items.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 p-3 bg-gray-50 rounded-lg text-sm",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "font-medium text-gray-700",
                                                            children: [
                                                                "Additional Items: ",
                                                                request.additional_items.length
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                            lineNumber: 263,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 262,
                                                        columnNumber: 25
                                                    }, this),
                                                    request.fabrication && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 p-3 bg-gray-50 rounded-lg text-sm",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "font-medium text-gray-700",
                                                            children: [
                                                                request.fabrication.fab_type,
                                                                " - ",
                                                                request.fabrication.name
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                            lineNumber: 271,
                                                            columnNumber: 27
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 270,
                                                        columnNumber: 25
                                                    }, this),
                                                    (request.status === "Submitted" || request.status === "Processing") && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 flex flex-wrap gap-2",
                                                        children: [
                                                            request.status === "Submitted" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>handleStatusChange(request.id, "Processing"),
                                                                        className: "px-4 py-2 text-white font-medium text-sm rounded-lg transition-opacity",
                                                                        style: {
                                                                            backgroundColor: "#078e31"
                                                                        },
                                                                        onMouseEnter: (e)=>e.currentTarget.style.opacity = "0.9",
                                                                        onMouseLeave: (e)=>e.currentTarget.style.opacity = "1",
                                                                        children: "Accept"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                        lineNumber: 282,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>handleStatusChange(request.id, "Cannot be Processed"),
                                                                        className: "px-4 py-2 text-white font-medium text-sm rounded-lg transition-opacity",
                                                                        style: {
                                                                            backgroundColor: "#f75700"
                                                                        },
                                                                        onMouseEnter: (e)=>e.currentTarget.style.opacity = "0.9",
                                                                        onMouseLeave: (e)=>e.currentTarget.style.opacity = "1",
                                                                        children: "Reject"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                        lineNumber: 291,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true),
                                                            request.status === "Processing" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>handleStatusChange(request.id, "Issued"),
                                                                        className: "px-4 py-2 text-white font-medium text-sm rounded-lg transition-opacity",
                                                                        style: {
                                                                            backgroundColor: "#078e31"
                                                                        },
                                                                        onMouseEnter: (e)=>e.currentTarget.style.opacity = "0.9",
                                                                        onMouseLeave: (e)=>e.currentTarget.style.opacity = "1",
                                                                        children: "Mark as Issued"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                        lineNumber: 305,
                                                                        columnNumber: 31
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>handleStatusChange(request.id, "Cannot be Processed"),
                                                                        className: "px-4 py-2 text-white font-medium text-sm rounded-lg transition-opacity",
                                                                        style: {
                                                                            backgroundColor: "#f75700"
                                                                        },
                                                                        onMouseEnter: (e)=>e.currentTarget.style.opacity = "0.9",
                                                                        onMouseLeave: (e)=>e.currentTarget.style.opacity = "1",
                                                                        children: "Cannot Process"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                                        lineNumber: 314,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                        lineNumber: 279,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, request.id, true, {
                                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                                lineNumber: 204,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                        lineNumber: 202,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                                lineNumber: 192,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poc/teams/[id]/page.tsx",
                        lineNumber: 133,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/poc/teams/[id]/page.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/poc/teams/[id]/page.tsx",
        lineNumber: 94,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_122f2066._.js.map