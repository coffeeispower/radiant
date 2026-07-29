"use client"

import { DateTime, Option } from "effect"
import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { Schedule } from "@radiant/client"
import { type WeekInfo, type DSTSkipPoint } from "../utils/weekCalendarLayout"
import { type RenderedBlock, buildBlocksByDay } from "../utils/blockLayout"
import { ScheduleBlockCard } from "./ScheduleBlockCard"

type BlockOverlayProps = {
	readonly week: WeekInfo
	readonly weeklyRules: ReadonlyArray<Schedule.ScheduleWeeklyBlock>
	readonly weeklyOccurrences: ReadonlyArray<Schedule.WeeklyOccurrence>
	readonly oneOffBlocks: ReadonlyArray<Schedule.ScheduleOneOffBlock>
	readonly timezone: string
	readonly displayDayDuration: number
	readonly rowMeasurements: ReadonlyArray<{ top: number; height: number }>
	readonly colMeasurements: ReadonlyArray<{ left: number; width: number }>
}

const WEEKDAY_TO_JS_WEEKDAY: Record<number, number> = {
	0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0,
}

function isDSTDay(dayIndex: number, dstSkipPoint: Option.Option<DSTSkipPoint>): boolean {
	if (!Option.isSome(dstSkipPoint)) return false
	const dstParts = DateTime.toParts(dstSkipPoint.value.point)
	return dstParts.weekDay === WEEKDAY_TO_JS_WEEKDAY[dayIndex]
}

function getDSTSkipRegion(
	dstSkipPoint: Option.Option<DSTSkipPoint>,
	displayDayDuration: number,
	isDST: boolean,
): { startMinute: number; endMinute: number; show: boolean; isAutumnDuplicate: boolean } | null {
	if (!Option.isSome(dstSkipPoint)) return null

	const { point, mode } = dstSkipPoint.value
	const parts = DateTime.toParts(point)
	const minuteOfDay = parts.hours * 60 + parts.minutes

	if (mode === "negative") {
		if (!isDST) return null
		return { startMinute: minuteOfDay + 60, endMinute: minuteOfDay + 120, show: true, isAutumnDuplicate: false }
	}

	if (mode === "positive") {
		if (isDST) return null
		return { startMinute: minuteOfDay + 60, endMinute: minuteOfDay + 120, show: true, isAutumnDuplicate: true }
	}

	return null
}

/** Converts a minute-of-day to a pixel Y coordinate using the row measurements. */
function minuteToPixel(
	minute: number,
	spanDurationMinutes: number,
	rowMeasurements: ReadonlyArray<{ top: number; height: number }>,
): number {
	const row = Math.floor(minute / spanDurationMinutes)
	const fraction = (minute % spanDurationMinutes) / spanDurationMinutes
	const clampedRow = Math.min(row, rowMeasurements.length - 1)
	return rowMeasurements[clampedRow].top + fraction * rowMeasurements[clampedRow].height
}

export function BlockOverlay(props: BlockOverlayProps) {
	const { week, weeklyRules, weeklyOccurrences, oneOffBlocks, timezone, displayDayDuration, rowMeasurements, colMeasurements } = props
	const t = useTranslations()

	const blocksByDay = useMemo(
		() => buildBlocksByDay(weeklyRules, weeklyOccurrences, oneOffBlocks, timezone),
		[weeklyRules, weeklyOccurrences, oneOffBlocks, timezone],
	)

	if (rowMeasurements.length === 0 || colMeasurements.length === 0) return <></>

	const spanDurationMinutes = (displayDayDuration * 60) / rowMeasurements.length

	return (
		<div className="absolute inset-0 z-10">
			{blocksByDay.map((blocks, dayIndex) => {
				const col = colMeasurements[dayIndex]
				if (!col) return null

				const isDST = isDSTDay(dayIndex, week.dstSkipPoint)
				const dstRegion = getDSTSkipRegion(week.dstSkipPoint, displayDayDuration, isDST)

				return (
					<div key={dayIndex} style={{ position: "absolute", left: col.left, width: col.width, top: 0, bottom: 0 }}>
						{dstRegion && dstRegion.show && (() => {
							const top = minuteToPixel(dstRegion.startMinute, spanDurationMinutes, rowMeasurements)
							const bottom = minuteToPixel(dstRegion.endMinute, spanDurationMinutes, rowMeasurements)
							return (
								<div
									style={{ position: "absolute", top, height: bottom - top, left: 2, right: 2 }}
									className="bg-neutral-300 border-3 border-neo-black shadow-neo-badge overflow-hidden cursor-default select-none flex items-center justify-center z-0"
								>
									<span className="font-mono text-[0.6rem] font-bold text-neo-black uppercase tracking-micro">
										{t("SKIPPED")}
									</span>
								</div>
							)
						})()}

						{blocks.map((block, i) => {
							const top = minuteToPixel(block.startMinuteOfDay, spanDurationMinutes, rowMeasurements)
							const bottom = minuteToPixel(block.endMinuteOfDay, spanDurationMinutes, rowMeasurements)
							const height = Math.max(bottom - top, 4)

							return (
								<ScheduleBlockCard
									key={`${block.blockKind}-${i}`}
									block={block}
									height={height}
									style={{ position: "absolute", top, left: 2, right: 2 }}
								/>
							)
						})}
					</div>
				)
			})}
		</div>
	)
}
