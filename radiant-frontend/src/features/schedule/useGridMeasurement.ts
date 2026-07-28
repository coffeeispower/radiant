import { useCallback, useLayoutEffect, useRef, useState } from "react";

/** Tracks row and column pixel measurements for a CSS grid, queried via
 *  `data-time-span` (rows) and `data-day-col` (columns) attributes.
 *
 *  Attach `gridRef` to the grid container, then call `measure()` after any
 *  layout change (zoom, resize) to refresh the measurements. */
export function useGridMeasurement() {
	const gridRef = useRef<HTMLDivElement>(null);
	const [rowMeasurements, setRowMeasurements] = useState<ReadonlyArray<{ top: number; height: number }>>([]);
	const [colMeasurements, setColMeasurements] = useState<ReadonlyArray<{ left: number; width: number }>>([]);

	const measure = useCallback(() => {
		if (!gridRef.current) return;
		const timeSpanEls = gridRef.current.querySelectorAll<HTMLElement>("[data-time-span]");
		const dayColEls = gridRef.current.querySelectorAll<HTMLElement>("[data-day-col]");

		const rows = Array.from(timeSpanEls).map((el) => ({ top: el.offsetTop, height: el.offsetHeight }));
		const cols = Array.from(dayColEls).map((el) => ({ left: el.offsetLeft, width: el.offsetWidth }));

		setRowMeasurements((prev) => {
			if (prev.length === rows.length && prev.every((r, i) => r.top === rows[i]!.top && r.height === rows[i]!.height)) return prev;
			return rows;
		});
		setColMeasurements((prev) => {
			if (prev.length === cols.length && prev.every((c, i) => c.left === cols[i]!.left && c.width === cols[i]!.width)) return prev;
			return cols;
		});
	}, []);

	useLayoutEffect(() => {
		measure();
	}, [measure]);

	return { gridRef, rowMeasurements, colMeasurements, measure } as const;
}
