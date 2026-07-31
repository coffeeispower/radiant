import React from "react"
import { Schema } from "effect"

export type DndPosition = {
  viewport: { x: number; y: number }
  page: { x: number; y: number }
  element: { x: number; y: number }
}

export type DragSession = {
  payload: unknown
  position: { x: number; y: number }
  renderPreview?: () => React.ReactNode
}

export type DndState = {
  session: DragSession | null
  hoveredTargetId: string | null
}

export type DropTargetCallbacks = {
  onDrop?: (data: unknown, position: DndPosition) => void
  onHoverEnter?: (data: unknown, position: DndPosition) => void
  onHover?: (data: unknown, position: DndPosition) => void
  onLeave?: () => void
}

export type DropTargetRegEntry = {
  id: string
  element: HTMLElement
  schema: Schema.Schema<any, any, never>
  getCallbacks: () => DropTargetCallbacks
}

type DndContextType = {
  state: DndState
  setDragSession: (session: DragSession | null) => void
  setHoveredTargetId: (id: string | null) => void
  registerDropTarget: (id: string, entry: DropTargetRegEntry) => void
  unregisterDropTarget: (id: string) => void
}

const DndContext = React.createContext<DndContextType | null>(null)

export function useDndContext() {
  const ctx = React.useContext(DndContext)
  if (!ctx) throw new Error("useDndContext must be used within DndProvider")
  return ctx
}

export function DndProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DndState>({
    session: null,
    hoveredTargetId: null,
  })
  const sessionRef = React.useRef<DragSession | null>(null)
  const hoveredTargetIdRef = React.useRef<string | null>(null)
  const registryRef = React.useRef<Map<string, DropTargetRegEntry>>(new Map())
  const portalRef = React.useRef<HTMLDivElement | null>(null)

  const setDragSession = React.useCallback((session: DragSession | null) => {
    sessionRef.current = session
    setState((prev) => ({ ...prev, session }))
  }, [])

  const setHoveredTargetId = React.useCallback((id: string | null) => {
    hoveredTargetIdRef.current = id
    setState((prev) => ({ ...prev, hoveredTargetId: id }))
  }, [])

  const registerDropTarget = React.useCallback(
    (id: string, entry: DropTargetRegEntry) => {
      registryRef.current.set(id, entry)
    },
    [],
  )

  const unregisterDropTarget = React.useCallback((id: string) => {
    registryRef.current.delete(id)
  }, [])

  React.useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const session = sessionRef.current
      if (!session) return

      if (portalRef.current) {
        portalRef.current.style.setProperty("--dnd-x", `${e.clientX}px`)
        portalRef.current.style.setProperty("--dnd-y", `${e.clientY}px`)
      }

      setState((prev) => {
        if (!prev.session) return prev
        return {
          ...prev,
          session: {
            payload: prev.session.payload,
            position: { x: e.clientX, y: e.clientY },
            renderPreview: prev.session.renderPreview,
          },
        }
      })

      const leaveHovered = () => {
        if (hoveredTargetIdRef.current) {
          const prevReg = registryRef.current.get(hoveredTargetIdRef.current)
          prevReg?.getCallbacks().onLeave?.()
        }
        setHoveredTargetId(null)
      }

      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (!(el instanceof HTMLElement)) {
        leaveHovered()
        return
      }

      const targetEl = el.closest("[data-dnd-id]") as HTMLElement | null
      if (!targetEl) {
        leaveHovered()
        return
      }

      const targetId = targetEl.dataset.dndId
      if (!targetId) {
        leaveHovered()
        return
      }

      const reg = registryRef.current.get(targetId)
      if (!reg) {
        leaveHovered()
        return
      }

      if (!Schema.is(reg.schema)(session.payload)) {
        leaveHovered()
        return
      }

      const decoded = session.payload
      const rect = targetEl.getBoundingClientRect()
      const position: DndPosition = {
        viewport: { x: e.clientX, y: e.clientY },
        page: { x: e.pageX, y: e.pageY },
        element: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      }

      const callbacks = reg.getCallbacks()

      if (hoveredTargetIdRef.current !== targetId) {
        if (hoveredTargetIdRef.current) {
          const prevReg = registryRef.current.get(hoveredTargetIdRef.current)
          prevReg?.getCallbacks().onLeave?.()
        }
        setHoveredTargetId(targetId)
        callbacks.onHoverEnter?.(decoded, position)
      }

      callbacks.onHover?.(decoded, position)
    }

    const handlePointerUp = (e: PointerEvent) => {
      const session = sessionRef.current
      if (!session) return

      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el instanceof HTMLElement) {
        const targetEl = el.closest("[data-dnd-id]") as HTMLElement | null
        if (targetEl) {
          const targetId = targetEl.dataset.dndId
          if (targetId) {
            const reg = registryRef.current.get(targetId)
            if (reg) {
              if (Schema.is(reg.schema)(session.payload)) {
                const rect = targetEl.getBoundingClientRect()
                const position: DndPosition = {
                  viewport: { x: e.clientX, y: e.clientY },
                  page: { x: e.pageX, y: e.pageY },
                  element: { x: e.clientX - rect.left, y: e.clientY - rect.top },
                }
                reg.getCallbacks().onDrop?.(session.payload, position)
              }
            }
          }
        }
      }

      if (hoveredTargetIdRef.current) {
        const prevReg = registryRef.current.get(hoveredTargetIdRef.current)
        prevReg?.getCallbacks().onLeave?.()
      }

      setHoveredTargetId(null)
      setDragSession(null)
    }

    const handlePointerCancel = () => {
      const session = sessionRef.current
      if (!session) return

      if (hoveredTargetIdRef.current) {
        const prevReg = registryRef.current.get(hoveredTargetIdRef.current)
        prevReg?.getCallbacks().onLeave?.()
      }

      setHoveredTargetId(null)
      setDragSession(null)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerCancel)
    }
  }, [setDragSession, setHoveredTargetId])

  const ctxValue = React.useMemo(
    () => ({
      state,
      setDragSession,
      setHoveredTargetId,
      registerDropTarget,
      unregisterDropTarget,
    }),
    [state, setDragSession, setHoveredTargetId, registerDropTarget, unregisterDropTarget],
  )

  return (
    <DndContext.Provider value={ctxValue}>
      {children}
      {state.session && (
        <div
          ref={portalRef}
          style={
            {
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 9999,
              "--dnd-x": `${state.session.position.x}px`,
              "--dnd-y": `${state.session.position.y}px`,
            } as React.CSSProperties
          }
        >
          {state.session.renderPreview?.()}
        </div>
      )}
    </DndContext.Provider>
  )
}
