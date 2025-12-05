"use client"

import { useCallback, useLayoutEffect, useRef } from "react"
import type { ReactNode } from "react"
import Lenis from "lenis"

import "./scroll-stack.css"

interface ScrollStackProps {
  children: ReactNode
  className?: string
  itemDistance?: number
  itemScale?: number
  itemStackDistance?: number
  stackPosition?: string | number
  scaleEndPosition?: string | number
  baseScale?: number
  rotationAmount?: number
  blurAmount?: number
  useWindowScroll?: boolean
  enableLenis?: boolean
  onStackComplete?: () => void
}

interface ScrollStackItemProps {
  children: ReactNode
  itemClassName?: string
}

interface InfrastructureCard {
  title: string
  description: string
}

type TransformState = {
  translateY: number
  scale: number
  rotation: number
  blur: number
}

const ScrollStackItem = ({ children, itemClassName = "" }: ScrollStackItemProps) => (
  <div className={`scroll-stack-card ${itemClassName}`.trim()}>{children}</div>
)

const ScrollStack = ({
  children,
  className = "",
  itemDistance = 60,
  itemScale = 0.055,
  itemStackDistance = 22,
  stackPosition = "18%",
  scaleEndPosition = "8%",
  baseScale = 0.76,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = true,
  enableLenis = false,
  onStackComplete,
}: ScrollStackProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const stackCompletedRef = useRef(false)
  const animationFrameRef = useRef<number | null>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const lastTransformsRef = useRef<Map<number, TransformState>>(new Map())
  const isUpdatingRef = useRef(false)
  const frameScheduledRef = useRef(false)

  const calculateProgress = useCallback((scrollTop: number, start: number, end: number) => {
    if (scrollTop <= start) return 0
    if (scrollTop >= end) return 1
    const distance = end - start
    return distance <= 0 ? 1 : (scrollTop - start) / distance
  }, [])

  const parsePercentage = useCallback((value: string | number, containerHeight: number) => {
    if (typeof value === "string" && value.includes("%")) {
      return (parseFloat(value) / 100) * containerHeight
    }
    return typeof value === "number" ? value : parseFloat(value)
  }, [])

  const getScrollData = useCallback(() => {
    if (useWindowScroll || !scrollerRef.current) {
      return {
        scrollTop: typeof window !== "undefined" ? window.scrollY : 0,
        containerHeight: typeof window !== "undefined" ? window.innerHeight : 0,
      }
    }
    return {
      scrollTop: scrollerRef.current.scrollTop,
      containerHeight: scrollerRef.current.clientHeight,
    }
  }, [useWindowScroll])

  const getElementOffset = useCallback(
    (element: HTMLDivElement) => {
      if (useWindowScroll || !scrollerRef.current) {
        const rect = element.getBoundingClientRect()
        return rect.top + (typeof window !== "undefined" ? window.scrollY : 0)
      }
      return element.offsetTop
    },
    [useWindowScroll],
  )

  const updateCardTransforms = useCallback(() => {
    if (!cardsRef.current.length || isUpdatingRef.current) return

    isUpdatingRef.current = true

    const { scrollTop, containerHeight } = getScrollData()
    const stackPositionPx = parsePercentage(stackPosition, containerHeight)
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight)

    const endElement = (useWindowScroll ? document : scrollerRef.current)?.querySelector<HTMLDivElement>(".scroll-stack-end")
    const endElementTop = endElement ? getElementOffset(endElement) : 0

    cardsRef.current.forEach((card, index) => {
      const cardTop = getElementOffset(card)
      const triggerStart = cardTop - stackPositionPx - itemStackDistance * index
      const triggerEnd = cardTop - scaleEndPositionPx
      const pinStart = triggerStart
      const pinEnd = Math.max(triggerEnd, endElementTop - containerHeight * 0.55)

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd)
      const targetScale = Math.min(0.98, baseScale + index * itemScale)
      const scaleRaw = 1 - scaleProgress * (1 - targetScale)
      const scale = Math.max(targetScale, Math.min(1, scaleRaw))
      const rotation = rotationAmount ? index * rotationAmount * scaleProgress : 0

      let blur = 0
      if (blurAmount) {
        let topCardIndex = 0
        for (let j = 0; j < cardsRef.current.length; j += 1) {
          const jCardTop = getElementOffset(cardsRef.current[j])
          const jTriggerStart = jCardTop - stackPositionPx - itemStackDistance * j
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j
          }
        }
        if (index < topCardIndex) {
          blur = Math.max(0, (topCardIndex - index) * blurAmount)
        }
      }

      let translateY = 0
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd

      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + itemStackDistance * index
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + itemStackDistance * index
      }

      const newTransform: TransformState = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100,
      }

      const lastTransform = lastTransformsRef.current.get(index)
      const hasChanged =
        !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : ""

        card.style.transform = transform
        card.style.filter = filter
        card.style.zIndex = String(cardsRef.current.length - index)

        lastTransformsRef.current.set(index, newTransform)
      }

      if (index === cardsRef.current.length - 1) {
        const isInView = scrollTop >= pinStart && scrollTop <= pinEnd
        if (isInView && !stackCompletedRef.current) {
          stackCompletedRef.current = true
          onStackComplete?.()
        } else if (!isInView && stackCompletedRef.current) {
          stackCompletedRef.current = false
        }
      }
    })

    isUpdatingRef.current = false
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
    useWindowScroll,
  ])

  const requestTransformUpdate = useCallback(() => {
    if (frameScheduledRef.current) {
      return
    }
    frameScheduledRef.current = true
    animationFrameRef.current = requestAnimationFrame(() => {
      frameScheduledRef.current = false
      updateCardTransforms()
    })
  }, [updateCardTransforms])

  const setupLenis = useCallback(() => {
    if (!useWindowScroll || !enableLenis) {
      return null
    }

    if (lenisRef.current || typeof window === "undefined") {
      return lenisRef.current
    }

    const lenis = new Lenis({
      duration: 1.08,
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
    })

    lenisRef.current = lenis

    return lenis
  }, [useWindowScroll])

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return undefined
    }

    const scroller = scrollerRef.current
    const cards = Array.from(
      (useWindowScroll ? document : scroller)?.querySelectorAll<HTMLDivElement>(".scroll-stack-card") ?? [],
    )

    cardsRef.current = cards

    cards.forEach((card, index) => {
      if (index < cards.length - 1) {
        card.style.marginBottom = `${itemDistance}px`
      }
      card.style.transformOrigin = "top center"
      card.style.backfaceVisibility = "hidden"
      card.style.perspective = "1000px"
      card.style.zIndex = String(cards.length - index)
    })

    const resizeHandler = () => {
      lastTransformsRef.current.clear()
      updateCardTransforms()
    }

    window.addEventListener("resize", resizeHandler)

    const lenis = setupLenis()
    updateCardTransforms()

    const scrollTarget: EventTarget | null = useWindowScroll ? window : scroller
    const handleScroll = () => {
      requestTransformUpdate()
    }

    scrollTarget?.addEventListener("scroll", handleScroll, { passive: true })

    let rafId: number | null = null
    if (lenis) {
      const raf = (time: number) => {
        lenis.raf(time)
        requestTransformUpdate()
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    }

    return () => {
      window.removeEventListener("resize", resizeHandler)
      scrollTarget?.removeEventListener("scroll", handleScroll)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      frameScheduledRef.current = false

      if (rafId) {
        cancelAnimationFrame(rafId)
      }

      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }

      stackCompletedRef.current = false
      cardsRef.current = []
      lastTransformsRef.current.clear()
      isUpdatingRef.current = false
    }
  }, [
    itemDistance,
    setupLenis,
    updateCardTransforms,
    requestTransformUpdate,
    useWindowScroll,
  ])

  return (
    <div className={`scroll-stack-scroller ${className}`.trim()} ref={scrollerRef}>
      <div className="scroll-stack-inner">
        {children}
        <div className="scroll-stack-end" />
      </div>
    </div>
  )
}

const infrastructureCards: InfrastructureCard[] = [
  {
    title: "3D Printing",
    description: "High-precision FDM and resin rigs for rapid iteration day or night.",
  },
  {
    title: "Laser Cutting",
    description: "Dual laser beds tuned for acrylic, ply, and composite panels with safety marshals on shift.",
  },
  {
    title: "Metal Cutting",
    description: "CNC saws and finishing bays ready for chassis work with trained fabrication support.",
  },
  {
    title: "Others",
    description: "Electronics pods, testing rigs, and mentor desks for fast cross-discipline fixes.",
  },
  {
    title: "All the best",
    description: "",
  },
]

export function InfrastructureScrollStack() {
  return (
    <section className="w-full border-t border-[#d9e2f2] bg-white px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#7b859c]">Infrastructure at GITAM</p>
          <h2 className="mt-2 text-3xl font-bold text-[#002449]">Scroll Through the Prototyping Stack</h2>
          <p className="mt-3 text-sm text-[#3f4a63]">
            Smooth scroll to see how fabrication labs, cutting floors, and support bays layer across the venue.
          </p>
        </header>

        <ScrollStack useWindowScroll>
          {infrastructureCards.map((card) => (
            <ScrollStackItem key={card.title}>
              <article
                className={`mx-auto flex min-h-[200px] w-full max-w-[680px] flex-col justify-center rounded-[20px] border border-[#d7e1f5] bg-white p-8 shadow-[0_18px_48px_rgba(0,36,73,0.08)] transition-transform duration-500 ${card.description ? "items-start text-left" : "items-center text-center"}`}
              >
                <h3
                  className={`font-semibold text-[#002449] ${card.description ? "text-[26px]" : "text-[30px] sm:text-[34px]"}`}
                >
                  {card.title}
                </h3>
                {card.description && <p className="mt-2 text-sm text-[#4c5874]">{card.description}</p>}
              </article>
            </ScrollStackItem>
          ))}
        </ScrollStack>
      </div>
    </section>
  )
}
