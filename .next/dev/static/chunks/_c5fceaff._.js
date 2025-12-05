(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn,
    "formatRequestTitle",
    ()=>formatRequestTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatRequestTitle(r) {
    const desc = (r.description || '').trim();
    if (desc) return desc;
    const notes = (r.notes || '').trim();
    if (notes) return notes;
    if (r.category === 'FABRICATION' && r.fabrication?.name) {
        return `${r.fabrication.fab_type} • ${r.fabrication.name}`;
    }
    if (r.category === 'BOM' && r.bom_items?.length) {
        const shown = r.bom_items.slice(0, 2).map((i)=>i.item_name).join(', ');
        const extra = r.bom_items.length > 2 ? ` (+${r.bom_items.length - 2} more)` : '';
        return `BOM: ${shown}${extra}`;
    }
    if (r.category === 'ADDITIONAL' && r.additional_items?.length) {
        const shown = r.additional_items.slice(0, 2).map((i)=>i.item_name).join(', ');
        const extra = r.additional_items.length > 2 ? ` (+${r.additional_items.length - 2} more)` : '';
        return `Additional: ${shown}${extra}`;
    }
    return `${r.category} #${r.id}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/infrastructure/infrastructure-scroll-stack.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InfrastructureScrollStack",
    ()=>InfrastructureScrollStack
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const infrastructureCards = [
    {
        title: "3D Printing",
        description: "High-precision FDM and resin rigs for rapid iteration day or night.",
        gradient: [
            "#5B3FFF",
            "#6B63FF"
        ]
    },
    {
        title: "Laser Cutting",
        description: "Dual laser beds tuned for acrylic, ply, and composite panels with safety marshals on shift.",
        gradient: [
            "#FF2D8D",
            "#FF5A7A"
        ]
    },
    {
        title: "Metal Cutting",
        description: "CNC saws and finishing bays ready for chassis work with trained fabrication support.",
        gradient: [
            "#36C3FF",
            "#6FF9C2"
        ]
    },
    {
        title: "All the best",
        gradient: [
            "#002449",
            "#002449"
        ],
        align: "center"
    }
];
function InfrastructureScrollStack() {
    _s();
    const cardRefs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const [activeIndex, setActiveIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "InfrastructureScrollStack.useEffect": ()=>{
            const nodes = cardRefs.current.filter({
                "InfrastructureScrollStack.useEffect.nodes": (node)=>Boolean(node)
            }["InfrastructureScrollStack.useEffect.nodes"]);
            if (!nodes.length) return undefined;
            const observer = new IntersectionObserver({
                "InfrastructureScrollStack.useEffect": (entries)=>{
                    entries.forEach({
                        "InfrastructureScrollStack.useEffect": (entry)=>{
                            if (entry.isIntersecting) {
                                const index = Number(entry.target.dataset.index);
                                if (!Number.isNaN(index)) {
                                    setActiveIndex(index);
                                }
                            }
                        }
                    }["InfrastructureScrollStack.useEffect"]);
                }
            }["InfrastructureScrollStack.useEffect"], {
                rootMargin: "-45% 0px -35% 0px",
                threshold: 0.2
            });
            nodes.forEach({
                "InfrastructureScrollStack.useEffect": (node)=>observer.observe(node)
            }["InfrastructureScrollStack.useEffect"]);
            return ({
                "InfrastructureScrollStack.useEffect": ()=>{
                    observer.disconnect();
                }
            })["InfrastructureScrollStack.useEffect"];
        }
    }["InfrastructureScrollStack.useEffect"], []);
    const baseTopRem = 8;
    const layerOffsetRem = 4.2;
    const overlapRem = 11;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "w-full border-t border-[#d9e2f2] bg-white px-6 py-16",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto flex w-full max-w-5xl flex-col gap-10",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs font-semibold uppercase tracking-[0.4em] text-[#7b859c]",
                            children: "Infrastructure at GITAM"
                        }, void 0, false, {
                            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                            lineNumber: 77,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "mt-2 text-3xl font-bold text-[#002449]",
                            children: "Scroll Through the Prototyping Stack"
                        }, void 0, false, {
                            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                            lineNumber: 78,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-3 text-sm text-[#3f4a63]",
                            children: "Glide through the fabrication hubs without lag—each card layers smoothly as you scroll down the timeline."
                        }, void 0, false, {
                            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                    lineNumber: 76,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative mt-8 pb-[22rem]",
                    children: infrastructureCards.map((card, index)=>{
                        const top = baseTopRem + index * layerOffsetRem;
                        const marginTop = index === 0 ? "0rem" : `-${overlapRem}rem`;
                        const isActive = index === activeIndex;
                        const [from, to] = card.gradient;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                            ref: (node)=>{
                                cardRefs.current[index] = node instanceof HTMLDivElement ? node : null;
                            },
                            "data-index": index,
                            style: {
                                top: `${top}rem`,
                                marginTop,
                                zIndex: infrastructureCards.length - index,
                                backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
                                transformStyle: "preserve-3d",
                                backfaceVisibility: "hidden"
                            },
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("sticky mx-auto flex w-full max-w-[720px] flex-col rounded-[32px] px-8 py-10 text-white shadow-[0_24px_60px_rgba(0,0,0,0.14)] transition-all duration-500", "will-change-transform", isActive ? "translate-y-0 scale-[1.02] shadow-[0_32px_90px_rgba(0,0,0,0.18)]" : "translate-y-2 scale-[0.98] opacity-90", card.align === "center" ? "items-center justify-center text-center" : "gap-4 justify-between"),
                            children: card.align === "center" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-4xl font-semibold tracking-wide",
                                children: card.title
                            }, void 0, false, {
                                fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                                lineNumber: 118,
                                columnNumber: 19
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-[11px] font-semibold uppercase tracking-[0.38em] text-white/75",
                                        children: "Fabrication Bay"
                                    }, void 0, false, {
                                        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                                        lineNumber: 121,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-3xl font-semibold",
                                        children: card.title
                                    }, void 0, false, {
                                        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                                        lineNumber: 122,
                                        columnNumber: 21
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-sm text-white/90",
                                        children: card.description
                                    }, void 0, false, {
                                        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                                        lineNumber: 123,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, void 0, true)
                        }, card.title, false, {
                            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                            lineNumber: 92,
                            columnNumber: 15
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                    lineNumber: 84,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
            lineNumber: 75,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
        lineNumber: 74,
        columnNumber: 5
    }, this);
}
_s(InfrastructureScrollStack, "PV3AeJtwRaJZQMXPSopd4JBvg84=");
_c = InfrastructureScrollStack;
var _c;
__turbopack_context__.k.register(_c, "InfrastructureScrollStack");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_c5fceaff._.js.map