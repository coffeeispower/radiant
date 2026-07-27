import { DateTime, Duration, Option, Schema } from "effect";
import { JSX } from "react";

const TICKS_SPACING_MIN_EM = 4;
enum WeekDay {
	Sunday = 0,
	Monday,
	Tuesday,
	Wednesday,
	Thursday,
	Friday,
	Saturday
}
export type Time = DateTime.Zoned;

export const DSTSkipPoint = Schema.Struct({
	point: Schema.DateTimeZoned,
	/// "positive" skip point means it adds one hour, so an hour will appear repeated in the calendar, so it goes like 1h -> 1h -> 2h
	/// "negative" means one hour is deleted and skipped so 1h -> 3h directly
	mode: Schema.Literal("positive", "negative")
});
export const WeekInfo = Schema.Struct({
	weekStart: Schema.DateTimeZoned,
	weekEnd: Schema.DateTimeZoned,
	dstSkipPoint: Schema.Option(DSTSkipPoint)
}).pipe(
	Schema.filter((a) => DateTime.greaterThan(a.weekEnd, a.weekStart), {
		description: "INVARIANT: weekEnd must be after weekStart"
	})
);

export type DSTSkipPoint = typeof DSTSkipPoint.Type;
export type WeekInfo = typeof WeekInfo.Type;

export function getDSTSkipPoint(week: {weekStart: Time, weekEnd: Time}): Option.Option<DSTSkipPoint> {
	const startOffset = DateTime.zonedOffset(week.weekStart)
	const endOffset = DateTime.zonedOffset(week.weekEnd)

	if (startOffset === endOffset) {
		return Option.none()
	}

	// "positive" = fall back (offset decreases, hour repeats): 1h -> 1h -> 2h
	// "negative" = spring forward (offset increases, hour skipped): 1h -> 3h
	const mode: DSTSkipPoint["mode"] = endOffset < startOffset ? "positive" : "negative"

	const zone = week.weekStart.zone

	for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
		const day = DateTime.add(week.weekStart, { days: dayOffset })
		const nextDay = DateTime.add(day, { days: 1 })

		if (DateTime.zonedOffset(day) === DateTime.zonedOffset(nextDay)) {
			continue
		}

		const dayParts = DateTime.toParts(day)
		let hourCursor = DateTime.unsafeMakeZoned(
			{
				year: dayParts.year,
				month: dayParts.month,
				day: dayParts.day,
				hours: 0,
				minutes: 0,
				seconds: 0,
				millis: 0
			},
			{ timeZone: zone, adjustForTimeZone: true, disambiguation: "compatible" }
		)

		for (let h = 0; h < 24; h++) {
			const nextHour = DateTime.add(hourCursor, { hours: 1 })

			if (DateTime.zonedOffset(hourCursor) !== DateTime.zonedOffset(nextHour)) {
				return Option.some(DSTSkipPoint.make({ point: hourCursor, mode }))
			}

			hourCursor = nextHour
		}
	}

	return Option.none()
}

export function makeWeekInfo(week: Time): WeekInfo {
	const weekStart = DateTime.setParts(week, {
		weekDay: WeekDay.Monday,
		hours: 0,
		minutes: 0,
		seconds: 0
	})
	const weekEnd = DateTime.add(weekStart, {days: 7})
	const dstSkipPoint = getDSTSkipPoint({weekStart, weekEnd});
	return WeekInfo.make({
		weekStart,
		weekEnd,
		dstSkipPoint
	})
}
