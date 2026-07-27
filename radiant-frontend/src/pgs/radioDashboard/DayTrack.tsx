"use client"

import { DateTime, Option } from "effect"
import { JSX } from "react"
import { Schedule } from "@radiant/client"
import { type WeekInfo, type DSTSkipPoint } from "./weekCalendarLayout"
import { ScheduleBlockCard } from "./ScheduleBlockCard"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/Tooltip"
import { useTranslations } from "next-intl"
import { Card } from "@/components/Card"

export type RenderedBlock = {
	readonly startMinuteOfDay: number
	readonly endMinuteOfDay: number
	readonly target: Schedule.ScheduleTarget
	readonly playbackMode: Schedule.BlockPlaybackMode
	readonly blockKind: "weekly" | "one-off"
}

type DayTrackProps = {
	readonly dayIndex: number
	readonly blocks: ReadonlyArray<RenderedBlock>
	readonly week: WeekInfo
	readonly dayHeight: number
	readonly displayDayDuration: number
	readonly isLast: boolean
	readonly topPad: number
}

const WEEKDAY_TO_JS_WEEKDAY: Record<number, number> = {
	0: 1, // Mon -> Monday
	1: 2, // Tue -> Tuesday
	2: 3, // Wed -> Wednesday
	3: 4, // Thu -> Thursday
	4: 5, // Fri -> Friday
	5: 6, // Sat -> Saturday
	6: 0, // Sun -> Sunday
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
): { topPx: number; heightPx: number; show: boolean; isAutumnDuplicate: boolean } | null {
	if (!Option.isSome(dstSkipPoint)) return null

	const { point, mode } = dstSkipPoint.value
	const parts = DateTime.toParts(point)
	const minuteOfDay = parts.hours * 60 + parts.minutes

	if (mode === "negative") {
		if (!isDST) return null
		return {
			topPx: (minuteOfDay / (displayDayDuration * 60)),
			heightPx: (60 / (displayDayDuration * 60)),
			show: true,
			isAutumnDuplicate: false,
		}
	}

	if (mode === "positive") {
		if (isDST) return null
		return {
			topPx: (minuteOfDay / (displayDayDuration * 60)),
			heightPx: (60 / (displayDayDuration * 60)),
			show: true,
			isAutumnDuplicate: true,
		}
	}

	return null
}

export function DayTrack(props: DayTrackProps): JSX.Element {
	const { dayIndex, blocks, week, dayHeight, displayDayDuration, isLast, topPad } = props
	const t = useTranslations("radio")

	const isDST = isDSTDay(dayIndex, week.dstSkipPoint)
	const dstRegion = getDSTSkipRegion(week.dstSkipPoint, displayDayDuration, isDST)

	return (
		<div className="relative h-full">
			{dstRegion && dstRegion.show && (
				<Card
					className="absolute left-0 right-0 bg-neutral-300 text-sm font-black flex items-center justify-center"
				>
					SKIPPED
				</Card>
			)}

			{blocks.map((block, i) => {
				const top = topPad + (block.startMinuteOfDay / (displayDayDuration * 60)) * dayHeight
				const height = ((block.endMinuteOfDay - block.startMinuteOfDay) / (displayDayDuration * 60)) * dayHeight

				return (
					<ScheduleBlockCard
						key={`${block.blockKind}-${i}`}
						block={block}
						style={{
							top: `${top}px`,
							height: `${Math.max(height, 4)}px`,
						}}
					/>
				)
			})}

			{!isLast && (
				<div className="absolute right-0 w-px bg-neo-black" style={{
					top: `${props.topPad}px`,
					height: `${dayHeight}px`
				}}/>
			)}
		</div>
	)
}
