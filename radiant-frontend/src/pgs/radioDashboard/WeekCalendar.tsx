"use client"
import { DateTime, Option } from "effect";
import { JSX, PropsWithoutRef, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { useTranslations } from "next-intl";
import { Radio } from "@radiant/client";
import { GetRadioAtom, useGenerateScheduleBlocksAtom } from "@/context/radiantClient";
import { useAtomValue } from "@effect-atom/atom-react";
import { makeWeekInfo, type Time } from "./weekCalendarLayout";
import { useElementSize } from "@/hooks/useElementSize";
import { cn } from "@/utils/cn";
import { TimeSpanGrid, TICK_LABEL_WIDTH } from "./TimeSpanGrid";
import { BlockOverlay } from "./BlockOverlay";

const TICK_FONT = "14px ui-monospace, SFMono-Regular, monospace";
const TICK_MARGIN_PX = 14;
let _tickTextHeight: number | null = null;
function getTickTextHeight(): number {
	if (_tickTextHeight !== null) return _tickTextHeight;
	const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
	const ctx = canvas?.getContext("2d");
	if (!ctx) { _tickTextHeight = 20; return _tickTextHeight; }
	ctx.font = TICK_FONT;
	const metrics = ctx.measureText("00:00");
	_tickTextHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
	return _tickTextHeight;
}

export function WeekCalendar(props: PropsWithoutRef<{radioAtom: GetRadioAtom, className?: string}>) {

	const t = useTranslations("radio");
	const calendarViewportSize = useElementSize<HTMLDivElement>();
	const radio = useAtomValue(props.radioAtom);

	const timezone = radio._tag === "Success" ? radio.value.timezone : "UTC";

	const currentWeek = DateTime.setZone(DateTime.unsafeNow(), DateTime.zoneUnsafeMakeNamed(timezone));
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

	useLayoutEffect(() => {
		if (calendarViewportSize.pass >= 2) {
			measureGrid();
		}
	}, [calendarViewportSize.pass,calendarViewportSize.width, calendarViewportSize.height ,measureGrid]);

	if(radio._tag != "Success") return;

	const innerHeight = calendarViewportSize.height;

	let displayDayDuration = 24;
	if(Option.isSome(weekInfo.dstSkipPoint)) {
		displayDayDuration += weekInfo.dstSkipPoint.value.mode == "positive" ? 1 : 0;
	}

	const tickDivHeight = getTickTextHeight() + TICK_MARGIN_PX;
	let tickCount = displayDayDuration * 4;
	let rowHeight = innerHeight / tickCount;
	while (rowHeight < tickDivHeight && tickCount > 1) {
		tickCount = Math.floor(tickCount / 2);
		rowHeight = innerHeight / tickCount;
	}

	return (
		<Card className={cn("flex flex-col", props.className)}>
			<CardHeader className="p-4">
				<CardTitle>{t("schedule")}</CardTitle>
			</CardHeader>
			<CardContent className="h-full flex flex-col border-t-3">
				<div className="relative h-full flex flex-col" ref={calendarViewportSize.ref}>
					<div className="flex-1 relative">
						{calendarViewportSize.pass >= 2 && (
							<TimeSpanGrid
								week={weekInfo}
								displayDayDuration={displayDayDuration}
								tickCount={tickCount}
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
				</div>
			</CardContent>
		</Card>
	)
}
