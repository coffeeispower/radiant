import { useCallback, useRef } from "react";

const ZOOM_FACTOR = 1.2;
const MIN_PIXELS_PER_MINUTE = 1;
const MAX_PIXELS_PER_MINUTE = 12;
const DEFAULT_PIXELS_PER_MINUTE = 4;

/** Manages zoom state for the week calendar grid.
 *
 *  Returns a `setScrollAreaRef` callback to attach to the ScrollArea root.
 *  The callback wires up a `wheel` listener (Shift+scroll) on the Radix
 *  viewport to zoom in/out while keeping the content under the cursor stable. */
export function useWeekCalendarZoom(
	pixelsPerMinute: number,
	setPixelsPerMinute: (fn: (prev: number) => number) => void,
	measureGrid: () => void,
	setViewportElement: (el: HTMLElement | null) => void,
) {
	const pixelsPerMinuteRef = useRef(pixelsPerMinute);
	pixelsPerMinuteRef.current = pixelsPerMinute;

	const zoomAnchorRef = useRef<{ scrollTop: number; mouseY: number; headerHeight: number; oldPPM: number } | null>(null);
	const wheelCleanupRef = useRef<(() => void) | null>(null);
	const gridRef = useRef<HTMLDivElement | null>(null);

	/** Attaches to the ScrollArea root element. Wires up the Radix viewport
	 *  detection, wheel-based zoom, and grid measurement on mount. */
	const setScrollAreaRef = useCallback((el: HTMLDivElement | null) => {
		wheelCleanupRef.current?.();
		wheelCleanupRef.current = null;

		/** FRAGILE: queries a Radix internal DOM attribute.
		 *  If `@radix-ui/react-scroll-area` changes its markup, this breaks
		 *  silently (viewport becomes null, zoom stops working).
		 *  Test after any Radix upgrade. */
		const viewport = el?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") ?? null;
		setViewportElement(viewport);

		if (viewport) {
			const handleWheel = (e: WheelEvent) => {
				if (!e.shiftKey) return;
				e.preventDefault();

				const headerHeight = gridRef.current?.firstElementChild instanceof HTMLElement
					? gridRef.current.firstElementChild.offsetHeight
					: 0;

				zoomAnchorRef.current = {
					scrollTop: viewport.scrollTop,
					mouseY: e.clientY - viewport.getBoundingClientRect().top,
					headerHeight,
					oldPPM: pixelsPerMinuteRef.current,
				};

				setPixelsPerMinute((prev) => Math.min(MAX_PIXELS_PER_MINUTE, Math.max(MIN_PIXELS_PER_MINUTE, prev * Math.pow(ZOOM_FACTOR, -e.deltaY / 100))));
			};
			viewport.addEventListener("wheel", handleWheel, { passive: false });
			wheelCleanupRef.current = () => viewport.removeEventListener("wheel", handleWheel);
			measureGrid();
		}
	}, [measureGrid, setPixelsPerMinute, setViewportElement]);

	return { setScrollAreaRef, zoomAnchorRef, gridRef } as const;
}

export { DEFAULT_PIXELS_PER_MINUTE, MIN_PIXELS_PER_MINUTE, MAX_PIXELS_PER_MINUTE, ZOOM_FACTOR };
