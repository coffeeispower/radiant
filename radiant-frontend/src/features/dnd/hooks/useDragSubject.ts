import { Schema } from "effect"
import React from "react"
import { useDndContext } from "../context/DndState"

const LONG_PRESS_DELAY = 500
const MOVE_TOLERANCE = 10

export function useDragSubject<T, I>(
  schema: Schema.Schema<T, I, never>,
  data: T,
  options?: {
    renderPreview?: () => React.ReactNode
  },
): { ref: React.RefObject<HTMLElement> } {
  const { setDragSession } = useDndContext()
  const ref = React.useRef<HTMLElement>(null!)
  const dataRef = React.useRef(data)
  dataRef.current = data
  const optionsRef = React.useRef(options)
  optionsRef.current = options

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    let dragTimer: ReturnType<typeof setTimeout> | null = null
    let activePointerId: number | null = null
    let activePointerType: string | null = null
    let dragging = false
    let startX = 0
    let startY = 0
    let lastX = 0
    let lastY = 0

    const clearTimer = () => {
      if (dragTimer) {
        clearTimeout(dragTimer)
        dragTimer = null
      }
    }

    const startDrag = () => {
      dragging = true
      try {
        if (activePointerId !== null) {
          el.setPointerCapture(activePointerId)
        }
      } catch {
        // pointer already inactive, drag won't start
      }
      setDragSession({
        payload: dataRef.current,
        position: { x: lastX, y: lastY },
        renderPreview: optionsRef.current?.renderPreview,
      })
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()

      if (!Schema.is(schema)(dataRef.current)) return

      clearTimer()
      activePointerId = e.pointerId
      activePointerType = e.pointerType
      lastX = e.clientX
      lastY = e.clientY

      if (e.pointerType === "touch") {
        startX = e.clientX
        startY = e.clientY
        dragging = false
        dragTimer = setTimeout(() => {
          dragTimer = null
          startDrag()
        }, LONG_PRESS_DELAY)
      } else {
        startDrag()
      }
    }

    const handlePointerUp = () => {
      clearTimer()
      dragging = false
      activePointerId = null
      activePointerType = null
    }

    const handlePointerCancel = () => {
      clearTimer()
      dragging = false
      activePointerId = null
      activePointerType = null
    }

    const handleContextMenu = (e: Event) => {
      if (activePointerType === "touch") {
        e.preventDefault()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (dragging) {
        if (e.cancelable) e.preventDefault()
        return
      }
      if (!dragTimer || activePointerId === null) return
      const touch = Array.from(e.touches).find((t) => t.identifier === activePointerId)
      if (!touch) return
      const dx = Math.abs(touch.clientX - startX)
      const dy = Math.abs(touch.clientY - startY)
      if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) {
        clearTimer()
        activePointerId = null
        return
      }
      lastX = touch.clientX
      lastY = touch.clientY
      if (e.cancelable) e.preventDefault()
    }

    el.style.setProperty("user-select", "none")
    el.style.setProperty("-webkit-user-select", "none")
    el.style.setProperty("-webkit-touch-callout", "none")

    el.addEventListener("pointerdown", handlePointerDown)
    el.addEventListener("pointerup", handlePointerUp)
    el.addEventListener("pointercancel", handlePointerCancel)
    el.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => {
      clearTimer()
      el.removeEventListener("pointerdown", handlePointerDown)
      el.removeEventListener("pointerup", handlePointerUp)
      el.removeEventListener("pointercancel", handlePointerCancel)
      el.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("touchmove", handleTouchMove)
      el.style.removeProperty("user-select")
      el.style.removeProperty("-webkit-user-select")
      el.style.removeProperty("-webkit-touch-callout")
    }
  }, [schema, setDragSession])

  return { ref }
}
