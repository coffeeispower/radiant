import { DateTime, Option } from "effect";
import { useMemo } from "react";
import { Schedule } from "@radiant/client";
import { type WeekInfo, type DSTSkipPoint } from "./weekCalendarLayout";

export type RenderedBlock = {
	readonly startMinuteOfDay: number
	readonly endMinuteOfDay: number
	readonly target: Schedule.ScheduleTarget
	readonly blockKind: "weekly" | "one-off"
}

/** Maps ISO weekday numbers (1=Mon..7=Sun) to 0-based array indices (0..6). */
const WEEKDAY_TO_INDEX: Record<number, number> = {
	1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6,
};

function toMinuteOfDay(date: DateTime.Zoned): number {
	const parts = DateTime.toParts(date)
	return parts.hours * 60 + parts.minutes
}

/** Splits a one-off block that spans midnight into per-day segments.
 *  Example: block from Monday 10pm to Tuesday 2am becomes:
 *  [{ startMinuteOfDay: 1320, endMinuteOfDay: 1440, weekday: 1 },
 *   { startMinuteOfDay: 0, endMinuteOfDay: 120, weekday: 2 }] */
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

/** Groups weekly and one-off blocks into per-day arrays (index 0 = Monday).
 *  This is the main data transformation for the block overlay — it resolves
 *  weekly occurrences to their rules and splits multi-day one-off blocks. */
export function buildBlocksByDay(
	weeklyRules: ReadonlyArray<Schedule.ScheduleWeeklyBlock>,
	weeklyOccurrences: ReadonlyArray<Schedule.WeeklyOccurrence>,
	oneOffBlocks: ReadonlyArray<Schedule.ScheduleOneOffBlock>,
	timezone: string,
): ReadonlyArray<ReadonlyArray<RenderedBlock>> {
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
				blockKind: "one-off",
			})
		}
	}

	return byDay
}
