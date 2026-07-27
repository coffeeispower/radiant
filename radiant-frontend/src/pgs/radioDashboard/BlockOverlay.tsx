"use client"

import { DateTime, Option } from "effect"
import { JSX, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Schedule } from "@radiant/client"
import { type WeekInfo, type DSTSkipPoint } from "./weekCalendarLayout"
import { ScheduleBlockCard } from "./ScheduleBlockCard"

export type RenderedBlock = {
	readonly startMinuteOfDay: number
	readonly endMinuteOfDay: number
	readonly target: Schedule.ScheduleTarget
	readonly playbackMode: Schedule.BlockPlaybackMode
	readonly blockKind: "weekly" | "one-off"
}

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

const WEEKDAY_TO_INDEX: Record<number, number> = {
	1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6,
}

const WEEKDAY_TO_JS_WEEKDAY: Record<number, number> = {
	0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0,
}

function toMinuteOfDay(date: DateTime.Zoned): number {
	const parts = DateTime.toParts(date)
	return parts.hours * 60 + parts.minutes
}

function splitOneOffBlock(
	block: Schedule.ScheduleOneOffBlock,
	timezone: string,
): ReadonlyArray<{ startMinuteOfDay: number; endMinuteOfDay: number; weekday: number }> {
	const zone = DateTime.zoneUnsafeMakeNamed(timezone)
	const startZoned = DateTime.setZone(block.startsAt, zone)
	const endZoned = DateTime.setZone(block.endsAt, zone)

	const segments: { startMinuteOfDay: number; endMinuteOfDay: number; weekday: number }[] = []
	let cursor = startZoned

	while (DateTime.lessThan(cursor, endZoned)) {
		const cursorMinute = toMinuteOfDay(cursor)
		const cursorParts = DateTime.toParts(cursor)
		const weekday = cursorParts.weekDay
		const nextMidnight = DateTime.unsafeMakeZoned(
			{
				year: cursorParts.year,
				month: cursorParts.month,
				day: cursorParts.day,
				hours: 0,
				minutes: 0,
				seconds: 0,
				millis: 0,
			},
			{ timeZone: timezone, disambiguation: "compatible" },
		)
		const nextMidnightDay = DateTime.add(nextMidnight, { days: 1 })

		const segmentEnd = DateTime.min(endZoned, nextMidnightDay)
		const endMinute = DateTime.lessThan(segmentEnd, nextMidnightDay)
			? toMinuteOfDay(segmentEnd)
			: 24 * 60

		segments.push({
			startMinuteOfDay: cursorMinute,
			endMinuteOfDay: endMinute,
			weekday,
		})

		cursor = nextMidnightDay
	}

	return segments
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

export function BlockOverlay(props: BlockOverlayProps): JSX.Element {
	const { week, weeklyRules, weeklyOccurrences, oneOffBlocks, timezone, displayDayDuration, rowMeasurements, colMeasurements } = props
	const t = useTranslations()

	const blocksByDay = useMemo(() => {
		const byDay: RenderedBlock[][] = Array.from({ length: 7 }, () => [])

		const ruleMap = new Map<string, Schedule.ScheduleWeeklyBlock>()
		for (const rule of weeklyRules) {
			ruleMap.set(rule.id, rule)
		}

		for (const occ of weeklyOccurrences) {
			const dayIndex = WEEKDAY_TO_INDEX[occ.weekday]
			if (dayIndex === undefined) continue
			const rule = ruleMap.get(occ.blockId)
			if (!rule) continue
			byDay[dayIndex].push({
				startMinuteOfDay: occ.startMinuteOfDay,
				endMinuteOfDay: occ.endMinuteOfDay,
				target: rule.target,
				playbackMode: rule.playbackMode,
				blockKind: "weekly",
			})
		}

		for (const block of oneOffBlocks) {
			const segments = splitOneOffBlock(block, timezone)
			for (const seg of segments) {
				const dayIndex = WEEKDAY_TO_INDEX[seg.weekday]
				if (dayIndex === undefined) continue
				byDay[dayIndex].push({
					startMinuteOfDay: seg.startMinuteOfDay,
					endMinuteOfDay: seg.endMinuteOfDay,
					target: block.target,
					playbackMode: block.playbackMode,
					blockKind: "one-off",
				})
			}
		}

		return byDay
	}, [weeklyRules, weeklyOccurrences, oneOffBlocks, timezone])

	if (rowMeasurements.length === 0 || colMeasurements.length === 0) return <></>

	const spanDurationMinutes = (displayDayDuration * 60) / rowMeasurements.length

	return (
		<div className="absolute inset-0 pointer-events-none">
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
									style={{ position: "absolute", top, height, left: 2, right: 2 }}
								/>
							)
						})}
					</div>
				)
			})}
		</div>
	)
}
