import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export function useGridMeasurement(tickCount: number, rowHeight: number) {
	const gridRef = useRef<HTMLDivElement>(null);
	const [headerHeight, setHeaderHeight] = useState(0);
	const [colLeft, setColLeft] = useState(0);
	const [colWidth, setColWidth] = useState(0);

	useLayoutEffect(() => {
		const grid = gridRef.current;
		if (!grid) return;
		const headerEl = grid.firstElementChild;
		setHeaderHeight(headerEl instanceof HTMLElement ? headerEl.offsetHeight : 0);
		const firstCol = grid.querySelector<HTMLElement>("[data-day-col='0']");
		if (firstCol) {
			setColLeft(firstCol.offsetLeft);
			setColWidth(firstCol.offsetWidth);
		}
	}, []);

	useEffect(() => {
		const handleResize = () => {
			const grid = gridRef.current;
			if (!grid) return;
			const headerEl = grid.firstElementChild;
			setHeaderHeight(headerEl instanceof HTMLElement ? headerEl.offsetHeight : 0);
			const firstCol = grid.querySelector<HTMLElement>("[data-day-col='0']");
			if (firstCol) {
				setColLeft(firstCol.offsetLeft);
				setColWidth(firstCol.offsetWidth);
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const rowMeasurements = useMemo(() => {
		if (headerHeight === 0) return [];
		return Array.from({ length: tickCount }, (_, i) => ({
			top: headerHeight + i * rowHeight,
			height: rowHeight,
		}));
	}, [tickCount, rowHeight, headerHeight]);

	const colMeasurements = useMemo(() => {
		if (colLeft === 0) return [];
		return Array.from({ length: 7 }, (_, i) => ({
			left: colLeft + i * colWidth,
			width: colWidth,
		}));
	}, [colLeft, colWidth]);

	const measure = useCallback(() => {}, []);

	return { gridRef, rowMeasurements, colMeasurements, measure } as const;
}
