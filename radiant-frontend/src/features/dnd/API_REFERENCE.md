# DnD API Reference

A universal drag-and-drop subsystem built on **Effect Schemas** as the data contract between drag sources and drop targets. Sources and targets never see each other's components — they only agree on a schema. Type discrimination is done by Effect itself: tagged classes (`Schema.TaggedClass`) carry a `_tag` literal, and validation fails for mismatched payloads.

The payload is never encoded or decoded: the source's object is passed through as-is and only **validated** with `Schema.is` on the target side, so the target receives the original object reference.

This allows for completely decoupled components to be dragged and dropped between each other, and for drag sources to be dragged from anywhere without they having to know about each other causing spaghetti code.

## Requirements

- All schemas passed to the API must have **no requirements**: `Schema.Schema<T, I, never>` (third type parameter `never`).
- Using **tagged structs** (`Schema.TaggedClass`, `Schema.TaggedStruct`, `Schema.Struct` + `Schema.Literal("_tag")`) is recommended so that dropping a source onto a target with a different schema is rejected during validation.
- `DndProvider` must wrap any component using the hooks.

## Files

| File | Contents |
| --- | --- |
| `context/DndState.tsx` | `DndProvider`, `useDndContext`, shared types |
| `hooks/useDragSubject.ts` | `useDragSubject` — makes an element a drag source |
| `hooks/useDropTarget.ts` | `useDropTarget` — makes an element a drop target |

## Provider

### `DndProvider`

```tsx
function DndProvider({ children }: { children: React.ReactNode }): React.JSX.Element
```

Provides the drag context, owns the drop-target registry, and listens to global `pointermove` / `pointerup` events while a drag session is active. While a session is active it renders a fixed, full-viewport `pointer-events: none` portal (z-index `9999`) that hosts the source's preview.

```tsx
import { DndProvider } from "@/features/dnd/context/DndState"

<DndProvider>
  <YourApp />
</DndProvider>
```

### `useDndContext`

```ts
function useDndContext(): DndContextType
```

Throws if called outside a `DndProvider`. Used internally by the hooks; only needed directly for advanced cases (e.g. reading the active session).

```ts
type DndContextType = {
  state: DndState
  setDragSession: (session: DragSession | null) => void
  setHoveredTargetId: (id: string | null) => void
  registerDropTarget: (id: string, entry: DropTargetRegEntry) => void
  unregisterDropTarget: (id: string) => void
}
```

## Types

### `DndPosition`

```ts
type DndPosition = {
  viewport: { x: number; y: number } // relative to the viewport
  page: { x: number; y: number }     // relative to the document
  element: { x: number; y: number }  // relative to the drop target's top-left
}
```

Passed to every hover/drop callback.

### `DropTargetCallbacks`

```ts
type DropTargetCallbacks = {
  onDrop?: (data: unknown, position: DndPosition) => void
  onHoverEnter?: (data: unknown, position: DndPosition) => void
  onHover?: (data: unknown, position: DndPosition) => void
  onLeave?: () => void
}
```

The untyped (internal) version. The hook exposes a typed version — see `useDropTarget`.

## Hooks

### `useDragSubject`

Makes an element a drag source.

```ts
function useDragSubject<T, I>(
  schema: Schema.Schema<T, I, never>,
  data: T,
  options?: {
    renderPreview?: () => React.ReactNode
  },
): { ref: React.RefObject<HTMLElement> }
```

| Param | Description |
| --- | --- |
| `schema` | Schema for `data`. Used to validate the payload when the drag starts (`Schema.is`). |
| `data` | The payload to transfer. Read fresh on every render (kept in a ref). |
| `options.renderPreview` | Returns the node rendered in the drag portal while the session is active. Optional — no preview is shown if omitted. |

Behavior:

- A left-button `pointerdown` (`e.button === 0`, with `preventDefault()`) starts the session. The pointer is **captured** (`setPointerCapture`) so the drag keeps receiving events even if the pointer leaves the window.
- **Mouse/pen**: the drag starts immediately.
- **Touch**: the drag starts only after the finger stays still for ~500 ms. Moving beyond a small tolerance cancels the pending drag and lets the browser scroll normally. Once the hold commits, `touchmove` is `preventDefault`'d so the drag never turns into a scroll gesture. Native long-press behaviors (text selection, iOS callout) are suppressed on the source element.
- `data` is validated with `schema` (`Schema.is`). If validation fails, no drag starts.
- The returned `ref` must be attached to the element you want to drag. The hook only wires up the element once it is mounted (checked via `ref.current` in an effect).
- The element can be any `HTMLElement`. When attaching to a specific element type (e.g. a `<div>`), the ref may need a cast: `ref={ref as RefObject<HTMLDivElement>}`.

```tsx
import { useDragSubject } from "@/features/dnd/hooks/useDragSubject"

function SongCard({ song }: { song: SongBlock }) {
  const { ref } = useDragSubject(SongBlock, song, {
    renderPreview: () => (
      <div style={{ transform: "translate(calc(var(--dnd-x) + 16px), calc(var(--dnd-y) + 16px))" }}>
        {song.title}
      </div>
    ),
  })
  return <div ref={ref as React.RefObject<HTMLDivElement>}>{song.title}</div>
}
```

### `useDropTarget`

Makes an element a drop target.

```ts
function useDropTarget<T, I>(
  schema: Schema.Schema<T, I, never>,
  callbacks?: DropCallbacks<T>,
): { ref: React.RefObject<HTMLElement>; isOver: boolean }
```

```ts
type DropCallbacks<T> = {
  onDrop?: (data: T, position: DndPosition) => void
  onHoverEnter?: (data: T, position: DndPosition) => void
  onHover?: (data: T, position: DndPosition) => void
  onLeave?: () => void
}
```

| Param | Description |
| --- | --- |
| `schema` | Schema the incoming payload must satisfy. The session's payload is validated against it (`Schema.is`); on failure the target is rejected. |
| `callbacks` | Optional handlers. Kept fresh in a ref, so they never go stale. |

Return values:

| Value | Description |
| --- | --- |
| `ref` | Attach to the element to make it a drop target. The hook registers the element (`data-dnd-id` attribute) and unregisters it on unmount. |
| `isOver` | `true` while the cursor is over a valid payload on this target. Use it for highlight styling. |

Callback lifecycle:

1. `onHoverEnter` — fires once when the cursor enters a **valid** hover (schema matches, target not already hovered).
2. `onHover` — fires on every `pointermove` while over the target.
3. `onLeave` — fires when the cursor leaves the target, moves over an invalid region/target, or the drag ends (pointerup).
4. `onDrop` — fires on `pointerup` while the cursor is over this target and the payload validates against the schema.

```tsx
import { useDropTarget } from "@/features/dnd/hooks/useDropTarget"

function SongDropZone() {
  const { ref, isOver } = useDropTarget(SongBlock, {
    onDrop: (song, position) => addSong(song, position.element),
    onHoverEnter: (song) => console.log("entered with", song.title),
  })
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={isOver ? "highlighted" : ""}>
      Drop zone
    </div>
  )
}
```

## CSS Variables

While a drag session is active, the portal container carries the current cursor position in **viewport-relative pixels**:

| Variable | Description |
| --- | --- |
| `--dnd-x` | Current cursor `clientX` |
| `--dnd-y` | Current cursor `clientY` |

The variables are updated via `style.setProperty` on the portal element each `pointermove`, so the preview node itself never re-renders while dragging. Position the preview with a transform, for example:

```tsx
style={{ transform: "translate(calc(var(--dnd-x) + 16px), calc(var(--dnd-y) + 16px))" }}
```

## How it works

1. **Start** — `pointerdown` on a drag subject validates its payload (`Schema.is`) and stores a `DragSession` holding the **original object reference**.
2. **Move** — the global `pointermove` handler:
   - pushes `--dnd-x` / `--dnd-y` onto the portal,
   - updates the session position (React state),
   - hit-tests the cursor with `document.elementFromPoint` + `closest("[data-dnd-id]")`,
   - looks up the target in the registry,
   - validates the payload with the target's schema (`Schema.is`) — **failure silently rejects the target**,
   - drives the `onHoverEnter` / `onHover` / `onLeave` lifecycle and `hoveredTargetId`.
3. **Drop** — the global `pointerup` handler re-hit-tests, validates once more, and calls `onDrop` with the original payload if valid; then fires `onLeave` on the previously hovered target and clears the session.

Everything runs inside React (state, effects, context); the only direct DOM writes are the CSS variables, the `data-dnd-id` attribute on registered targets, and the pointer capture / `touchmove` prevention / user-select suppression applied to drag sources.

A browser-initiated cancellation (`pointercancel`, e.g. a touch gesture the OS takes over) cleanly ends the session: it fires `onLeave` on the hovered target, clears the highlight, and aborts the drag without a drop.
