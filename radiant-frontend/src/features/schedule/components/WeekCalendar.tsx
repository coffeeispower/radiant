"use client"
import { DateTime, Option } from "effect";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/Panel";
import { ScrollArea } from "@/components/ScrollArea";
import { Spinner } from "@/components/Spinner";
import { Button } from "@/components/Button";
import { useTranslations } from "next-intl";
import { useAtomValue, Result, useAtomRefresh } from "@effect-atom/atom-react";
import { useRadioDashboard } from "@/pgs/radioDashboard/RadioManagementDashboardRoot";
import { makeWeekInfo, type Time } from "../utils/weekCalendarLayout";

import { cn } from "@/utils/cn";
import { TimeSpanGrid } from "./TimeSpanGrid";
import { BlockOverlay } from "./BlockOverlay";
import { useWeekCalendarZoom, DEFAULT_PIXELS_PER_MINUTE, MIN_PIXELS_PER_MINUTE, MAX_PIXELS_PER_MINUTE, ZOOM_FACTOR } from "../hooks/useWeekCalendarZoom";
import { useGridMeasurement } from "../hooks/useGridMeasurement";

function ScheduleLoading() {
	return (
		<div className="flex items-center justify-center py-12">
			<Spinner className="text-lg text-black/40" />
		</div>
	);
}

function ScheduleError({ onRetry }: { onRetry: () => void }) {
	const t = useTranslations();
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<p className="text-sm font-bold text-black/60">{t("Failed to load schedule")}</p>
			<Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
				{t("Retry")}
			</Button>
		</div>
	);
}

export function WeekCalendar({ className }: { className?: string }) {
	const t = useTranslations();
	const { radio, scheduleBlocksAtom } = useRadioDashboard();
	const [pixelsPerMinute, setPixelsPerMinute] = useState(DEFAULT_PIXELS_PER_MINUTE);

	const currentWeek = useMemo(
		() => DateTime.setZone(DateTime.unsafeNow(), DateTime.zoneUnsafeMakeNamed(radio.timezone)),
		[radio.timezone],
	);
	const weekInfo = makeWeekInfo(currentWeek);

	const rangeStart = useMemo(() => new Date(DateTime.toEpochMillis(weekInfo.weekStart)).toISOString(), [weekInfo.weekStart]);
	const rangeEnd = useMemo(() => new Date(DateTime.toEpochMillis(weekInfo.weekEnd)).toISOString(), [weekInfo.weekEnd]);

	const scheduleBlocks = useAtomValue(scheduleBlocksAtom);
	const refreshSchedule = useAtomRefresh(scheduleBlocksAtom);

	const days = useMemo(() => {
		const result: { date: Time; dayIndex: number }[] = []
		for (let i = 0; i < 7; i++) {
			const day = DateTime.add(weekInfo.weekStart, { days: i })
			result.push({ date: day, dayIndex: i })
		}
		return result
	}, [weekInfo.weekStart]);

	const scrollAreaRef = useRef<HTMLDivElement | null>(null);

	/** Number of hours to display per day column. Normally 24, but during DST
	 *  transitions it can be 25 (fall back: hour repeats) or 23 (spring forward:
	 *  hour skipped). This affects grid row count and spacing. */
	let displayDayDuration = 24;
	if (Option.isSome(weekInfo.dstSkipPoint)) {
		displayDayDuration += weekInfo.dstSkipPoint.value.mode == "positive" ? 1 : 0;
	}

	const tickCount = displayDayDuration * 4;
	const spanDurationMinutes = (displayDayDuration * 60) / tickCount;
	const rowHeight = pixelsPerMinute * spanDurationMinutes;
	const zoomPercent = Math.round((pixelsPerMinute / DEFAULT_PIXELS_PER_MINUTE) * 100);

	const { gridRef, rowMeasurements, colMeasurements, measure: measureGrid } = useGridMeasurement(tickCount, rowHeight);

	const zoomIn = () => setPixelsPerMinute((prev) => Math.min(MAX_PIXELS_PER_MINUTE, prev * ZOOM_FACTOR));
	const zoomOut = () => setPixelsPerMinute((prev) => Math.max(MIN_PIXELS_PER_MINUTE, prev / ZOOM_FACTOR));

	useWeekCalendarZoom(
		pixelsPerMinute,
		setPixelsPerMinute,
		measureGrid,
		scrollAreaRef,
		gridRef,
	);

	return (
		<Panel
			title={t("Schedule")}
			className={cn("flex flex-col", className)}
			contentClassName="flex-1 min-h-0 p-0"
			headerActions={
				<div className="flex items-center gap-1">
					<button
						className="font-mono text-[0.6rem] font-bold text-neo-black/40 cursor-pointer bg-transparent border-none p-0"
						onClick={zoomOut}
					>
						−
					</button>
					<span className="font-mono text-[0.6rem] font-bold text-neo-black/40 uppercase min-w-[3ch] text-center">
						{zoomPercent}%
					</span>
					<button
						className="font-mono text-[0.6rem] font-bold text-neo-black/40 cursor-pointer bg-transparent border-none p-0"
						onClick={zoomIn}
					>
						+
					</button>
				</div>
			}
		>
			{Result.match(scheduleBlocks, {
				onInitial: () => <ScheduleLoading />,
				onFailure: () => <ScheduleError onRetry={refreshSchedule} />,
				onSuccess: ({ value }) => (
					<ScrollArea ref={scrollAreaRef} className="h-full">
						<div className="relative" style={{ "--grid-row-height": `${rowHeight}px` } as React.CSSProperties}>
							<TimeSpanGrid
								week={weekInfo}
								displayDayDuration={displayDayDuration}
								tickCount={tickCount}
								days={days}
								gridRef={gridRef}
							/>
							<BlockOverlay
								week={weekInfo}
								weeklyRules={value.weekly.rules}
								weeklyOccurrences={value.weekly.occurrences}
								oneOffBlocks={value.oneOff.items}
								timezone={radio.timezone}
								displayDayDuration={displayDayDuration}
								rowMeasurements={rowMeasurements}
								colMeasurements={colMeasurements}
							/>
						</div>
					</ScrollArea>
				),
			})}
		</Panel>
	)
}
