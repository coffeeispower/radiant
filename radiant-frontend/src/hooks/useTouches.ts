import { useEffect, useRef } from "react";


type TouchId = number;
type Vec2 = { x: number; y: number };
type TouchesMap = Map<TouchId, Vec2>;
type ReadonlyTouchesMap = ReadonlyMap<TouchId, Vec2>;
/**
 * Handles boilerplate code to keep track of touches on a given element.
 *
 * Calls `onTouchUpdate` with the new touches map after the triggered event which may affect multiple pointers,
 * the touchId, and whether the touch was down or up.
 *
 * @param ref The element which the user will interact with
 * @param onTouchUpdate Callback so you get notified when the user taps the screen
 */
export function useTouches(ref: React.RefObject<HTMLElement | null>, onTouchUpdate: (touches: ReadonlyTouchesMap, touchId: TouchId, down: boolean) => void) {
	const touchesMap = useRef<TouchesMap>(new Map());
	const updateTouches = (e: TouchEvent) => {
		for (const touch of e.changedTouches) {
			touchesMap.current.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
		}
	};
	useEffect(() => {
		if(!ref.current) return console.warn("useTouches: ref is null, please make sure you have assign the ref to a valid element");
		const abortController = new AbortController();
		const signal = abortController.signal;
		ref.current.addEventListener("touchstart", (e) => {
			updateTouches(e);
			for (const touch of e.changedTouches) {
				onTouchUpdate(touchesMap.current, touch.identifier, true);
			}
		}, {signal});
		ref.current.addEventListener("touchmove", (e) => {
			updateTouches(e);
			for (const touch of e.changedTouches) {
				onTouchUpdate(touchesMap.current, touch.identifier, true);
			}
		}, {signal});
		ref.current.addEventListener("touchend", (e) => {
			for (const touch of e.changedTouches) {
				touchesMap.current.delete(touch.identifier);
			}
			for (const touch of e.changedTouches) {
				onTouchUpdate(touchesMap.current, touch.identifier, false);
			}
		}, {signal});
		return () => abortController.abort();
	});
}

// bitflags for pinch zoom axis
export enum AllowedAxis {
	X = 1 << 0,
	Y = 1 << 1,
}

type PinchData = {
	distanceDifferencePx: number; // The change in distance between the two pointers since the pinch started
	distanceDifferenceRatio: number; // The change in distance between the two pointers since the pinch started, as a ratio of the total distance
	// The center of the pinch is the point in the middle of the two pointers
	// The user may have moved the 2 fingers in a way that the center is not the same as the center of the pinch when it started
	// So this gives you that offset so you can move the viewport to follow the users fingers
	pinchCenterDeltaPx: Vec2;
};

type PinchEvents = {
	// This is called when the user first puts 2 fingers on the screen and starts moving them
	// This is called before any onPinchUpdate so you can use this to save any state before doing any destructive updates
	// to the viewport state
	onPinchStart(center: Vec2): void;

	// This is called every time the user moves their 2 fingers on the screen while the user is already pinching
	onPinchUpdate(pinchData: PinchData): void;

	// This is called after any finger from the 2 fingers are lifted up
	// You can use this to commit the changes to the viewport state
	onPinchEnd(pinchData: PinchData): void;
}

/**
 * Handles pinch gestures on a given element and calls `onPinchUpdate` with the new pinch data.
 * The pinch data is always relative to the start of the gesture so you can atomically treat the pinch as an atomic operation instead of a series of separate events.
 *
 * NOTE: This is built on top of the `useTouches` function
 *
 * ── Geometry ────────────────────────────────────────────────────────────
 *
 * A pinch gesture involves two fingers acting as control points.
 * Imagine the user's two fingers as points on a 2D plane:
 *
 *            FINGER A (x₁, y₁)
 *              ●
 *               \
 *                \  distance (hypotenuse)
 *                 \       ● FINGER B (x₂, y₂)
 *                  \     /
 *                   \   /
 *                    \ /
 *                     O  ← center (midpoint)
 *
 *           dx = x₂ - x₁
 *           dy = y₂ - y₁
 *
 *   distance = √(dx² + dy²)    ← Pythagorean theorem
 *   center   = ((x₁+x₂)/2, (y₁+y₂)/2)
 *
 * When the user spreads their fingers, `distance` grows.
 * When they pinch together, `distance` shrinks.
 * When they slide both fingers (e.g. panning), `center` moves
 * while `distance` stays roughly constant.
 *
 * ── What each field in PinchData means ──────────────────────────────────
 *
 *   distanceDifferencePx
 *       How much the fingers have spread/pinched since the gesture started,
 *       measured in absolute pixels.
 *           = currentDistance - startDistance
 *       Positive  → fingers spreading apart (zoom in).
 *       Negative  → fingers pinching together (zoom out).
 *
 *   distanceDifferenceRatio
 *       The same spread/pinch expressed as a dimensionless multiplier.
 *           = currentDistance / startDistance
 *       Examples:
 *           1.0  → no change
 *           1.5  → 50% wider (zoom in by 1.5×)
 *           0.5  → 50% narrower (zoom out to 0.5×)
 *
 *   pinchCenterDeltaPx
 *       How far the midpoint between the fingers has shifted since the
 *       gesture started.
 *           = currentCenter - startCenter
 *       This lets the consumer pan the viewport to track the user's fingers.
 *       Respects `allowsAxis`: if AllowedAxis.X is not set, x is clamped to 0.
 *
 * ── Lifecycle ───────────────────────────────────────────────────────────
 *
 *   onPinchStart(center)  ── fired once when the second finger hits the screen; `center` is the midpoint in client coords
 *         │
 *         ├── onPinchUpdate(data)   ← finger movement detected
 *         ├── onPinchUpdate(data)   ← more movement
 *         ├── ... (0 or more times)
 *         │
 *   onPinchEnd(data) ── fired when either finger lifts
 *
 * All update data is RELATIVE TO GESTURE START, not to the previous frame.
 * This means consumers can treat the entire pinch as a single atomic
 * operation ("zoomed by 1.3× and panned by (15, -8) px from origin")
 * without accumulating floating-point drift from incremental deltas.
 *
 * ── Start-state snapshot ────────────────────────────────────────────────
 *
 * On the first frame where 2 touches are detected, we save:
 *   pinchStart = { distance, center }
 *
 * Every subsequent frame computes PinchData by diffing against this
 * snapshot. When the gesture ends we reset the ref so the next pinch
 * starts fresh.
 *
 * We `return` immediately after `onPinchStart` to avoid firing a
 * no-op onPinchUpdate (distanceDelta ≈ 0, centerDelta ≈ 0) for the
 * very same touchstart event that began the pinch.
 *
 * @param ref The element which the user will interact with
 * @param allowsAxis bit flags for which axis to allow pinch zoom on
 * @param events Callbacks for the pinch lifecycle
 */
export function usePinchZoom(ref: React.RefObject<HTMLElement | null>, allowsAxis: AllowedAxis, events: PinchEvents) {
	const pinchStart = useRef<{ distance: number; center: Vec2 } | null>(null);
	const lastPinchData = useRef<PinchData | null>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const abort = new AbortController();
		const signal = abort.signal;
		el.addEventListener("gesturestart", (e) => e.preventDefault(), { signal });
		el.addEventListener("gesturechange", (e) => e.preventDefault(), { signal });
		el.addEventListener("gestureend", (e) => e.preventDefault(), { signal });
		el.addEventListener("touchmove", (e) => {
			if (e.touches.length >= 2) e.preventDefault();
		}, { signal, passive: false });
		return () => abort.abort();
	});

	useTouches(ref, (touches, _touchId, down) => {
		if (touches.size === 2 && down) {
			const [posA, posB] = touches.values();
			const dx = posB.x - posA.x;
			const dy = posB.y - posA.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const center: Vec2 = {
				x: (posA.x + posB.x) / 2,
				y: (posA.y + posB.y) / 2,
			};

			if (!pinchStart.current) {
				pinchStart.current = { distance, center };
				events.onPinchStart(center);
				return;
			}

			const distanceDifferencePx = distance - pinchStart.current.distance;
			const distanceDifferenceRatio = distance / pinchStart.current.distance;
			const pinchCenterDeltaPx: Vec2 = {
				x: (allowsAxis & AllowedAxis.X) ? center.x - pinchStart.current.center.x : 0,
				y: (allowsAxis & AllowedAxis.Y) ? center.y - pinchStart.current.center.y : 0,
			};

			const pd: PinchData = { distanceDifferencePx, distanceDifferenceRatio, pinchCenterDeltaPx };
			lastPinchData.current = pd;
			events.onPinchUpdate(pd);
		}

		if (!down && pinchStart.current) {
			events.onPinchEnd(
				lastPinchData.current ?? { distanceDifferencePx: 0, distanceDifferenceRatio: 1, pinchCenterDeltaPx: { x: 0, y: 0 } },
			);
			pinchStart.current = null;
			lastPinchData.current = null;
		}
	});
}
