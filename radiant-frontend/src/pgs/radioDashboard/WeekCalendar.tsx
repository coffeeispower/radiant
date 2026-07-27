"use client"
import { DateTime, Option } from "effect";
import { JSX, PropsWithoutRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { ScrollArea } from "@/components/ScrollArea";
import { useTranslations } from "next-intl";
import { Radio } from "@radiant/client";
import { GetRadioAtom, useGenerateScheduleBlocksAtom } from "@/context/radiantClient";
import { useAtomValue } from "@effect-atom/atom-react";
import { makeWeekInfo, type Time } from "./weekCalendarLayout";
import { useElementSize } from "@/hooks/useElementSize";
import { cn } from "@/utils/cn";
import { TimeSpanGrid } from "./TimeSpanGrid";
import { BlockOverlay } from "./BlockOverlay";
import { tomorrowFont } from "@/lib/fonts";

const DEFAULT_PIXELS_PER_MINUTE = 4;
const MIN_PIXELS_PER_MINUTE = 1;
const MAX_PIXELS_PER_MINUTE = 12;
const ZOOM_FACTOR = 1.2;

export function WeekCalendar(props: PropsWithoutRef<{radioAtom: GetRadioAtom, className?: string}>) {

	const t = useTranslations();
	const calendarViewportSize = useElementSize<HTMLDivElement>();
	const radio = useAtomValue(props.radioAtom);

	const timezone = radio._tag === "Success" ? radio.value.timezone : "UTC";

	const currentWeek = useMemo(() => DateTime.setZone(DateTime.unsafeNow(), DateTime.zoneUnsafeMakeNamed(timezone)), [timezone]);
	const weekInfo = makeWeekInfo(currentWeek);

	const rangeStart = useMemo(() => new Date(DateTime.toEpochMillis(weekInfo.weekStart)).toISOString(), [weekInfo.weekStart]);
	const rangeEnd = useMemo(() => new Date(DateTime.toEpochMillis(weekInfo.weekEnd)).toISOString(), [weekInfo.weekEnd]);

	const scheduleBlocksAtom = useGenerateScheduleBlocksAtom(radio._tag === "Success" ? radio.value.id : ("radio_placeholder" as Radio.RadioId), rangeStart, rangeEnd);
	const scheduleBlocks = useAtomValue(scheduleBlocksAtom);

	const days = useMemo(() => {
		const result: { date: Time; dayIndex: number }[] = []
		for (let i = 0; i < 7; i++) {
			const day = DateTime.add(weekInfo.weekStart, { days: i })
			result.push({ date: day, dayIndex: i })
		}
		return result
	}, [weekInfo.weekStart])

	const [pixelsPerMinute, setPixelsPerMinute] = useState(DEFAULT_PIXELS_PER_MINUTE);
	const pixelsPerMinuteRef = useRef(pixelsPerMinute);
	pixelsPerMinuteRef.current = pixelsPerMinute;

	const gridRef = useRef<HTMLDivElement>(null);
	const [rowMeasurements, setRowMeasurements] = useState<ReadonlyArray<{ top: number; height: number }>>([]);
	const [colMeasurements, setColMeasurements] = useState<ReadonlyArray<{ left: number; width: number }>>([]);

	const measureGrid = useCallback(() => {
		if (!gridRef.current) return;
		const timeSpanEls = gridRef.current.querySelectorAll<HTMLElement>("[data-time-span]");
		const dayColEls = gridRef.current.querySelectorAll<HTMLElement>("[data-day-col]");

		const rows = Array.from(timeSpanEls).map((el) => ({ top: el.offsetTop, height: el.offsetHeight }));
		const cols = Array.from(dayColEls).map((el) => ({ left: el.offsetLeft, width: el.offsetWidth }));

		setRowMeasurements(rows);
		setColMeasurements(cols);
	}, []);

	const zoomAnchorRef = useRef<{ scrollTop: number; mouseY: number; headerHeight: number; oldPPM: number } | null>(null);

	const wheelCleanupRef = useRef<(() => void) | null>(null);

	const setScrollAreaRef = useCallback((el: HTMLDivElement | null) => {
		wheelCleanupRef.current?.();
		wheelCleanupRef.current = null;

		const viewport = el?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") ?? null;
		(calendarViewportSize.ref as React.MutableRefObject<HTMLElement | null>).current = viewport;

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
		}
	}, []);

	useLayoutEffect(() => {
		if (calendarViewportSize.pass >= 2) {
			measureGrid();

			if (zoomAnchorRef.current) {
				const { scrollTop, mouseY, headerHeight, oldPPM } = zoomAnchorRef.current;
				const f = pixelsPerMinute / oldPPM;
				const newScrollTop = f * scrollTop + (f - 1) * (mouseY - headerHeight);
				const viewport = calendarViewportSize.ref.current;
				if (viewport) {
					viewport.scrollTop = Math.max(0, newScrollTop);
				}
				zoomAnchorRef.current = null;
			}
		}
	}, [calendarViewportSize.pass, calendarViewportSize.width, calendarViewportSize.height, measureGrid, pixelsPerMinute]);

	if(radio._tag != "Success") return;

	let displayDayDuration = 24;
	if(Option.isSome(weekInfo.dstSkipPoint)) {
		displayDayDuration += weekInfo.dstSkipPoint.value.mode == "positive" ? 1 : 0;
	}

	const tickCount = displayDayDuration * 4;
	const spanDurationMinutes = (displayDayDuration * 60) / tickCount;
	const rowHeight = pixelsPerMinute * spanDurationMinutes;
	const zoomPercent = Math.round((pixelsPerMinute / DEFAULT_PIXELS_PER_MINUTE) * 100);

	return (
		<Card className={cn("flex flex-col", props.className)}>
			<CardHeader className="px-4 py-2 flex flex-row items-center justify-between">
				<CardTitle className={`font-sans font-semibold ${tomorrowFont.className}`}>{t("Schedule")}</CardTitle>
				<span className="font-mono text-[0.6rem] font-bold text-neo-black/40 uppercase">
					{zoomPercent}%
				</span>
			</CardHeader>
			<CardContent className="flex-1 min-h-0 border-t-3">
				<ScrollArea ref={setScrollAreaRef} className="h-full">
					<div className="relative">
						{calendarViewportSize.pass >= 2 && (
							<TimeSpanGrid
								week={weekInfo}
								displayDayDuration={displayDayDuration}
								tickCount={tickCount}
								rowHeight={rowHeight}
								days={days}
								gridRef={gridRef}
							/>
						)}
						{calendarViewportSize.pass >= 2 && scheduleBlocks._tag === "Success" && (
							<BlockOverlay
								week={weekInfo}
								weeklyRules={scheduleBlocks.value.weekly.rules}
								weeklyOccurrences={scheduleBlocks.value.weekly.occurrences}
								oneOffBlocks={scheduleBlocks.value.oneOff.items}
								timezone={radio.value.timezone}
								displayDayDuration={displayDayDuration}
								rowMeasurements={rowMeasurements}
								colMeasurements={colMeasurements}
							/>
						)}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	)
}
