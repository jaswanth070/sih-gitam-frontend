module.exports = [
"[project]/components/infrastructure/infrastructure-scroll-stack.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "InfrastructureScrollStack",
    ()=>InfrastructureScrollStack
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const ScrollStackItem = ({ children, itemClassName = "" })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `scroll-stack-card ${itemClassName}`.trim(),
        children: children
    }, void 0, false, {
        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
        lineNumber: 43,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
const ScrollStack = ({ children, className = "", itemDistance = 60, itemScale = 0.055, itemStackDistance = 22, stackPosition = "18%", scaleEndPosition = "8%", baseScale = 0.76, rotationAmount = 0, blurAmount = 0, useWindowScroll = true, enableLenis = false, onStackComplete })=>{
    const scrollerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const stackCompletedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const animationFrameRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lenisRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const cardsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    const lastTransformsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const isUpdatingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const frameScheduledRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const calculateProgress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((scrollTop, start, end)=>{
        if (scrollTop <= start) return 0;
        if (scrollTop >= end) return 1;
        const distance = end - start;
        return distance <= 0 ? 1 : (scrollTop - start) / distance;
    }, []);
    const parsePercentage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((value, containerHeight)=>{
        if (typeof value === "string" && value.includes("%")) {
            return parseFloat(value) / 100 * containerHeight;
        }
        return typeof value === "number" ? value : parseFloat(value);
    }, []);
    const getScrollData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (useWindowScroll || !scrollerRef.current) {
            return {
                scrollTop: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 0,
                containerHeight: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 0
            };
        }
        return {
            scrollTop: scrollerRef.current.scrollTop,
            containerHeight: scrollerRef.current.clientHeight
        };
    }, [
        useWindowScroll
    ]);
    const getElementOffset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((element)=>{
        if (useWindowScroll || !scrollerRef.current) {
            const rect = element.getBoundingClientRect();
            return rect.top + (("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 0);
        }
        return element.offsetTop;
    }, [
        useWindowScroll
    ]);
    const updateCardTransforms = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!cardsRef.current.length || isUpdatingRef.current) return;
        isUpdatingRef.current = true;
        const { scrollTop, containerHeight } = getScrollData();
        const stackPositionPx = parsePercentage(stackPosition, containerHeight);
        const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);
        const endElement = (useWindowScroll ? document : scrollerRef.current)?.querySelector(".scroll-stack-end");
        const endElementTop = endElement ? getElementOffset(endElement) : 0;
        cardsRef.current.forEach((card, index)=>{
            const cardTop = getElementOffset(card);
            const triggerStart = cardTop - stackPositionPx - itemStackDistance * index;
            const triggerEnd = cardTop - scaleEndPositionPx;
            const pinStart = triggerStart;
            const pinEnd = Math.max(triggerEnd, endElementTop - containerHeight * 0.55);
            const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
            const targetScale = Math.min(0.98, baseScale + index * itemScale);
            const scaleRaw = 1 - scaleProgress * (1 - targetScale);
            const scale = Math.max(targetScale, Math.min(1, scaleRaw));
            const rotation = rotationAmount ? index * rotationAmount * scaleProgress : 0;
            let blur = 0;
            if (blurAmount) {
                let topCardIndex = 0;
                for(let j = 0; j < cardsRef.current.length; j += 1){
                    const jCardTop = getElementOffset(cardsRef.current[j]);
                    const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j;
                    if (scrollTop >= jTriggerStart) {
                        topCardIndex = j;
                    }
                }
                if (index < topCardIndex) {
                    blur = Math.max(0, (topCardIndex - index) * blurAmount);
                }
            }
            let translateY = 0;
            const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;
            if (isPinned) {
                translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * index;
            } else if (scrollTop > pinEnd) {
                translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * index;
            }
            const newTransform = {
                translateY: Math.round(translateY * 100) / 100,
                scale: Math.round(scale * 1000) / 1000,
                rotation: Math.round(rotation * 100) / 100,
                blur: Math.round(blur * 100) / 100
            };
            const lastTransform = lastTransformsRef.current.get(index);
            const hasChanged = !lastTransform || Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 || Math.abs(lastTransform.scale - newTransform.scale) > 0.001 || Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 || Math.abs(lastTransform.blur - newTransform.blur) > 0.1;
            if (hasChanged) {
                const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
                const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : "";
                card.style.transform = transform;
                card.style.filter = filter;
                card.style.zIndex = String(cardsRef.current.length - index);
                lastTransformsRef.current.set(index, newTransform);
            }
            if (index === cardsRef.current.length - 1) {
                const isInView = scrollTop >= pinStart && scrollTop <= pinEnd;
                if (isInView && !stackCompletedRef.current) {
                    stackCompletedRef.current = true;
                    onStackComplete?.();
                } else if (!isInView && stackCompletedRef.current) {
                    stackCompletedRef.current = false;
                }
            }
        });
        isUpdatingRef.current = false;
    }, [
        baseScale,
        blurAmount,
        calculateProgress,
        getElementOffset,
        getScrollData,
        itemScale,
        itemStackDistance,
        onStackComplete,
        parsePercentage,
        rotationAmount,
        scaleEndPosition,
        stackPosition,
        useWindowScroll
    ]);
    const requestTransformUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (frameScheduledRef.current) {
            return;
        }
        frameScheduledRef.current = true;
        animationFrameRef.current = requestAnimationFrame(()=>{
            frameScheduledRef.current = false;
            updateCardTransforms();
        });
    }, [
        updateCardTransforms
    ]);
    const setupLenis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!useWindowScroll || !enableLenis) {
            return null;
        }
        if ("TURBOPACK compile-time truthy", 1) {
            return lenisRef.current;
        }
        //TURBOPACK unreachable
        ;
        const lenis = undefined;
    }, [
        useWindowScroll
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) {
            return undefined;
        }
        //TURBOPACK unreachable
        ;
        const scroller = undefined;
        const cards = undefined;
        const resizeHandler = undefined;
        const lenis = undefined;
        const scrollTarget = undefined;
        const handleScroll = undefined;
        let rafId;
    }, [
        itemDistance,
        setupLenis,
        updateCardTransforms,
        requestTransformUpdate,
        useWindowScroll
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `scroll-stack-scroller ${className}`.trim(),
        ref: scrollerRef,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "scroll-stack-inner",
            children: [
                children,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "scroll-stack-end"
                }, void 0, false, {
                    fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                    lineNumber: 327,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
            lineNumber: 325,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
        lineNumber: 324,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const infrastructureCards = [
    {
        title: "3D Printing",
        description: "High-precision FDM and resin rigs for rapid iteration day or night."
    },
    {
        title: "Laser Cutting",
        description: "Dual laser beds tuned for acrylic, ply, and composite panels with safety marshals on shift."
    },
    {
        title: "Metal Cutting",
        description: "CNC saws and finishing bays ready for chassis work with trained fabrication support."
    },
    {
        title: "Others",
        description: "Electronics pods, testing rigs, and mentor desks for fast cross-discipline fixes."
    },
    {
        title: "All the best",
        description: ""
    }
];
function InfrastructureScrollStack() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "w-full border-t border-[#d9e2f2] bg-white px-6 py-12",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mx-auto flex w-full max-w-5xl flex-col gap-12",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs font-semibold uppercase tracking-[0.4em] text-[#7b859c]",
                            children: "Infrastructure at GITAM"
                        }, void 0, false, {
                            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                            lineNumber: 361,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "mt-2 text-3xl font-bold text-[#002449]",
                            children: "Scroll Through the Prototyping Stack"
                        }, void 0, false, {
                            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                            lineNumber: 362,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-3 text-sm text-[#3f4a63]",
                            children: "Smooth scroll to see how fabrication labs, cutting floors, and support bays layer across the venue."
                        }, void 0, false, {
                            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                            lineNumber: 363,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                    lineNumber: 360,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScrollStack, {
                    useWindowScroll: true,
                    children: infrastructureCards.map((card)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ScrollStackItem, {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                className: `mx-auto flex min-h-[200px] w-full max-w-[680px] flex-col justify-center rounded-[20px] border border-[#d7e1f5] bg-white p-8 shadow-[0_18px_48px_rgba(0,36,73,0.08)] transition-transform duration-500 ${card.description ? "items-start text-left" : "items-center text-center"}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: `font-semibold text-[#002449] ${card.description ? "text-[26px]" : "text-[30px] sm:text-[34px]"}`,
                                        children: card.title
                                    }, void 0, false, {
                                        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                                        lineNumber: 374,
                                        columnNumber: 17
                                    }, this),
                                    card.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-2 text-sm text-[#4c5874]",
                                        children: card.description
                                    }, void 0, false, {
                                        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                                        lineNumber: 379,
                                        columnNumber: 38
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                                lineNumber: 371,
                                columnNumber: 15
                            }, this)
                        }, card.title, false, {
                            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                            lineNumber: 370,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
                    lineNumber: 368,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
            lineNumber: 359,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/infrastructure/infrastructure-scroll-stack.tsx",
        lineNumber: 358,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=components_infrastructure_infrastructure-scroll-stack_tsx_86d8f727._.js.map