import { Dispatch, SetStateAction, useEffect, useLayoutEffect, useRef } from "react";
import { AllowedAxis, usePinchZoom } from "@/hooks/useTouches";

const ZOOM_FACTOR = 1.2;
const MIN_PIXELS_PER_MINUTE = 1;
const MAX_PIXELS_PER_MINUTE = 12;
const DEFAULT_PIXELS_PER_MINUTE = 4;

/**
 * ── Mental model: calendar space × viewport ──────────────────────────────
 *
 * Think of the calendar as a 2D logical plane (calendar space).
 * At any zoom level the viewport is a rectangular window into that plane,
 * scaled by pixelsPerMinute and positioned by scrollTop.
 *
 * When you put two fingers on the screen, each finger lands on a specific
 * (x, y) coordinate in calendar space.  As you spread or pinch your
 * fingers, those TWO calendar-space points MUST stay under the SAME
 * physical finger positions on screen — otherwise the content slides
 * away from your fingers and the gesture feels broken.
 *
 * The distance between the fingers in calendar space is fixed throughout
 * the gesture (your fingers aren't sliding along the glass relative to
 * each other in calendar space — they're just moving apart/squeezing
 * in screen space).  So the problem reduces to keeping the MIDPOINT
 * between the fingers anchored.
 *
 * ── 1D algebra (Y axis) ─────────────────────────────────────────────────
 *
 *     H  = header height (px, from the grid DOM)
 *     v  = pinch centre Y relative to viewport top (px)
 *          e.g. halfway between two finger-tops, measured from the
 *          viewport bounding rect
 *     p  = pixelsPerMinute before this update
 *     s  = scrollTop before this update
 *
 *     Calendar-space Y under the centre:
 *         cy = s + v - H                       [pixels from content top]
 *
 *     Calendar time at that point:
 *         t  = cy / p                          [minutes]
 *
 * After the zoom, the fingers have moved in screen space: the centre
 * is now at v' (px from viewport top) and the scale is p'.
 * We want the SAME calendar time t to be at v':
 *
 *         t  = (s' + v' - H) / p'
 *
 * Substituting t from above:
 *
 *         (s + v - H) / p  =  (s' + v' - H) / p'
 *         s' + v' - H      =  (s + v - H) × p'/p
 *         s'               =  (s + v - H) × (p'/p) - v' + H
 *
 * That's exactly what both handlers compute.
 *
 * ── Wheel vs pinch ──────────────────────────────────────────────────────
 *
 * wheel (in the useEffect):
 *     v  = mouseY           (mouse doesn't move during the scroll tick)
 *     v' = v                (same point — cursor stays still)
 *     p  = prevPpm
 *     p' = newPpm
 *     s  = viewport.scrollTop at event time
 *
 *     s' = (s + v - H) × (p'/p) - v + H
 *
 * pinch (in the onPinchUpdate callback):
 *     v  = state.centerViewportY   (centre at gesture START)
 *     v' = v + pinchCenterDeltaPx.y  (centre NOW, accounting for
 *                                      the user sliding both fingers)
 *     p  = state.ppm               (zoom level at gesture START)
 *     p' = newPpm                  (= p × distanceDifferenceRatio)
 *     s  = state.scrollTop         (scrollTop at gesture START)
 *
 *     s' = (s + v - H) × (p'/p) - v' + H
 *
 * All "state.*" values are captured in onPinchStart and never changed
 * during the gesture.  Each onPinchUpdate computes an atomic diff
 * against that immutable snapshot, so accumulated drift is impossible.
 *
 * ── Why useLayoutEffect? ────────────────────────────────────────────────
 *
 * We must NOT set scrollTop BEFORE the grid re-renders with the new PPM.
 * If we did, the browser would paint a frame where the row heights are
 * still at the old scale but the scroll position is already at the new
 * value — the content under the cursor would jump.
 *
 * Instead we store the target scrollTop in `pendingScrollTopRef` and let
 * a useLayoutEffect apply it after the DOM is committed with the new PPM,
 * guaranteeing a single correct paint.
 *
 * The only exception is when the PPM is clamped to MIN/MAX and no
 * re-render will fire: in that case we apply scrollTop immediately
 * because the grid dimensions won't change. */
export function useWeekCalendarZoom(
	pixelsPerMinute: number,
	setPixelsPerMinute: Dispatch<SetStateAction<number>>,
	measureGrid: () => void,
	scrollAreaRef: React.RefObject<HTMLDivElement | null>,
	gridRef: React.RefObject<HTMLDivElement | null>,
) {
	const pixelsPerMinuteRef = useRef(pixelsPerMinute);
	pixelsPerMinuteRef.current = pixelsPerMinute;

	const viewportRef = useRef<HTMLElement | null>(null);
	const pendingScrollTopRef = useRef<number | null>(null);

	useLayoutEffect(() => {
		const st = pendingScrollTopRef.current;
		if (st !== null) {
			pendingScrollTopRef.current = null;
			const viewport = viewportRef.current;
			if (viewport) viewport.scrollTop = st;
		}
	});

	useEffect(() => {
		const el = scrollAreaRef.current;
		if (!el) return;

		const viewport = el.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") ?? null;
		viewportRef.current = viewport;
		if (!viewport) return;

		const abort = new AbortController();

		viewport.addEventListener("wheel", (e) => {
			if (!e.shiftKey && !e.ctrlKey) return;
			e.preventDefault();

			const headerHeight = gridRef.current?.firstElementChild instanceof HTMLElement
				? gridRef.current.firstElementChild.offsetHeight
				: 0;
			const mouseY = e.clientY - viewport.getBoundingClientRect().top;
			const scrollTop = viewport.scrollTop;

			const prevPpm = pixelsPerMinuteRef.current;
			const newPpm = Math.min(MAX_PIXELS_PER_MINUTE, Math.max(MIN_PIXELS_PER_MINUTE, prevPpm * Math.pow(ZOOM_FACTOR, -e.deltaY / 100)));

			const contentOffset = scrollTop + mouseY - headerHeight;
			pendingScrollTopRef.current = contentOffset * (newPpm / prevPpm) - mouseY + headerHeight;
			setPixelsPerMinute(() => newPpm);
		}, { signal: abort.signal, passive: false });

		measureGrid();

		return () => {
			abort.abort();
			viewportRef.current = null;
		};
	}, []);

	const pinchState = useRef<{
		scrollTop: number;
		ppm: number;
		headerHeight: number;
		centerViewportY: number;
	} | null>(null);

	usePinchZoom(scrollAreaRef, AllowedAxis.Y, {
		onPinchStart: (center) => {
			const viewport = viewportRef.current;
			if (!viewport) return;

			const viewportRect = viewport.getBoundingClientRect();
			const headerHeight = gridRef.current?.firstElementChild instanceof HTMLElement
				? gridRef.current.firstElementChild.offsetHeight
				: 0;

			pinchState.current = {
				scrollTop: viewport.scrollTop,
				ppm: pixelsPerMinuteRef.current,
				headerHeight,
				centerViewportY: center.y - viewportRect.top,
			};
		},
		onPinchUpdate: (data) => {
			const state = pinchState.current;
			const viewport = viewportRef.current;
			if (!state || !viewport) return;

			const newPpm = Math.min(MAX_PIXELS_PER_MINUTE, Math.max(MIN_PIXELS_PER_MINUTE, state.ppm * data.distanceDifferenceRatio));
			const ratioR = newPpm / state.ppm;

			const currentCenterViewportY = state.centerViewportY + data.pinchCenterDeltaPx.y;
			const contentOffset = state.scrollTop + state.centerViewportY - state.headerHeight;
			const newScrollTop = contentOffset * ratioR - currentCenterViewportY + state.headerHeight;

			if (newPpm === pixelsPerMinuteRef.current) {
				viewport.scrollTop = newScrollTop;
			} else {
				pendingScrollTopRef.current = newScrollTop;
				setPixelsPerMinute(() => newPpm);
			}
		},
		onPinchEnd: () => {
			pinchState.current = null;
		},
	});
}

export { DEFAULT_PIXELS_PER_MINUTE, MIN_PIXELS_PER_MINUTE, MAX_PIXELS_PER_MINUTE, ZOOM_FACTOR };
