import { Schema } from "effect"
import React from "react"
import {
  useDndContext,
  type DndPosition,
  type DropTargetCallbacks,
  type DropTargetRegEntry,
} from "../context/DndState"

type DropCallbacks<T> = {
  onDrop?: (data: T, position: DndPosition) => void
  onHoverEnter?: (data: T, position: DndPosition) => void
  onHover?: (data: T, position: DndPosition) => void
  onLeave?: () => void
}

export function useDropTarget<T, I>(
  schema: Schema.Schema<T, I, never>,
  callbacks?: DropCallbacks<T>,
): { ref: React.RefObject<HTMLElement>; isOver: boolean } {
  const id = React.useId()
  const { state, registerDropTarget, unregisterDropTarget } = useDndContext()
  const ref = React.useRef<HTMLElement>(null!)
  const callbacksRef = React.useRef(callbacks)
  callbacksRef.current = callbacks

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    el.setAttribute("data-dnd-id", id)

    const entry: DropTargetRegEntry = {
      id,
      element: el,
      schema,
      getCallbacks: () => (callbacksRef.current ?? {}) as DropTargetCallbacks,
    }

    registerDropTarget(id, entry)

    return () => {
      unregisterDropTarget(id)
      el.removeAttribute("data-dnd-id")
    }
  }, [id, schema, registerDropTarget, unregisterDropTarget])

  return {
    ref,
    isOver: state.hoveredTargetId === id,
  }
}
