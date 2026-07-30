"use client"

import { DateTime, Option } from "effect"
import { memo, JSX } from "react"
import { type WeekInfo, type Time } from "../utils/weekCalendarLayout"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/Tooltip"
import { useTranslations } from "next-intl"
import { tomorrowFont } from "@/lib/fonts"

export const TICK_LABEL_WIDTH = "4.5rem"
const WEEKDAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

type TimeSpanGridProps = {
	readonly week: WeekInfo
	readonly displayDayDuration: number
	readonly tickCount: number
	readonly days: ReadonlyArray<{ date: Time; dayIndex: number }>
	readonly gridRef: React.RefObject<HTMLDivElement | null>
}

function formatDayDate(date: Time): string {
	const parts = DateTime.toParts(date)
	const day = parts.day.toString().padStart(2, "0")
	const month = parts.month.toString().padStart(2, "0")
	return `${day}/${month}`
}

export const TimeSpanGrid = memo(function TimeSpanGrid(props: TimeSpanGridProps): JSX.Element {
	const { week, displayDayDuration, tickCount, days, gridRef } = props
	const t = useTranslations()

	const skipHourMin = Option.map(week.dstSkipPoint, ({ point }) => {
		const { hours, minutes } = DateTime.toParts(point)
		return hours * 60 + minutes
	})

	const spanDuration = displayDayDuration / tickCount

	let showedDstHint = false
	const rows: JSX.Element[] = []
	const dstExtra = displayDayDuration - 24

	for (let i = 0; i < tickCount; i++) {
		const totalMinutes = i * spanDuration * 60
		const hours = Math.floor(totalMinutes / 60)
		const minutes = Math.round(totalMinutes % 60)

		const displayOffset = Option.isSome(skipHourMin) && totalMinutes > skipHourMin.value ? dstExtra : 0
		const isDstBoundary = !showedDstHint && displayOffset !== 0
		if (isDstBoundary) showedDstHint = true

		let displayHours = hours - displayOffset
		if (displayHours < 0) displayHours += 24

		const padNumber = (n: number) => n.toString().padStart(2, "0")
		const displayTime = `${padNumber(displayHours)}:${padNumber(minutes)}`

		rows.push(
			<div key={`time-${i}`} data-time-span={i}
				className="flex items-start justify-end pr-2 pt-0.5 font-mono text-[0.65rem] font-bold text-neo-black/60 border-b-2 border-b-neo-black/20 border-r-2 border-r-neo-black/20 bg-neo-paper"
			>
				{isDstBoundary && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger className="text-neo-orange font-bold text-[0.6rem] cursor-help mr-1">(!)</TooltipTrigger>
							<TooltipContent side="right">
								<p>{t("Due to the daylight saving time transition the time rolls back 1 hour making it look like an extra duplicated hour appeared")}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
				{displayTime}
			</div>
		)

		for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
			rows.push(
				<div key={`cell-${i}-${dayIndex}`}
					className="border-b-2 border-b-neo-black/20 border-r border-r-neo-black/10 last:border-r-0 bg-neo-paper"
				/>
			)
		}
	}

	return (
		<div
			ref={gridRef}
			style={{
				display: "grid",
				gridTemplateColumns: `${TICK_LABEL_WIDTH} repeat(7, 1fr)`,
				gridTemplateRows: `auto repeat(${tickCount}, var(--grid-row-height))`,
			}}
			className="w-full"
		>
			<div className="sticky top-0 z-20 border-b-3 border-b-neo-black border-r-3 border-r-neo-black bg-neo-paper shadow-neo-down shadow-black/20" />
			{days.map((day, i) => (
				<div key={i} data-day-col={i}
					className="sticky top-0 z-20 flex flex-col items-center justify-center py-1.5 border-b-3 border-b-neo-black border-r-3 border-r-neo-black last:border-r-0 bg-neo-paper shadow-neo-down shadow-black/20"
				>
					<span className={`text-[0.65rem] font-bold text-neo-black uppercase tracking-micro leading-none ${tomorrowFont.className}`}>
						{t(WEEKDAY_KEYS[i])}
					</span>
					<span className="font-mono text-[0.55rem] font-bold text-neo-black/50 leading-none mt-0.5">
						{formatDayDate(day.date)}
					</span>
				</div>
			))}

			{rows}
		</div>
	)
})
