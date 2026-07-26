"use client"
import { DateTime, Duration, Option } from "effect";
import { groteskFont, tomorrowFont } from "../../lib/fonts"
import { JSX, PropsWithoutRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { useTranslations } from "next-intl";
import { Radio } from "@radiant/client";
import { GetRadioAtom, RadiantAtomClient, radioListReactivityKey } from "../../lib/atoms/radiantClient";
import { Atom, Result, useAtomValue } from "@effect-atom/atom-react";
import { makeWeekInfo, type Time, type WeekInfo } from "./weekCalendarLayout";
import { DivElementSize, useElementSize } from "../../lib/hooks/useElementSize";
import { cn } from "../../lib/utils";

const weekDays = [
	{ shortLabel: "Seg" },
	{ shortLabel: "Ter" },
	{ shortLabel: "Qua" },
	{ shortLabel: "Qui" },
	{ shortLabel: "Sex" },
	{ shortLabel: "Sab" },
	{ shortLabel: "Dom" },
] as const


function WeekDayTrack(props: PropsWithoutRef<{weekDay: (typeof weekDays)[number], i: number}>) {
	return <div className="h-full w-full">

		</div>
}


export function WeekCalendar(props: PropsWithoutRef<{radioAtom: GetRadioAtom, className?: string}>) {

	const t = useTranslations("radio");
	const calendarViewportSize = useElementSize<HTMLDivElement>();
	const radio = useAtomValue(props.radioAtom);
	if(radio._tag == "Failure") return;
	const currentWeek = useMemo(() => DateTime.unsafeMakeZoned({ year: 2026, month: 10, day: 22, hours: 12 }, { timeZone: radio.value.timezone, disambiguation: "compatible" }), []);
	const weekInfo = useMemo(() => makeWeekInfo(currentWeek), [currentWeek]);
	// ----- Debug stuff -----
	// const onKeyPress = useCallback((e: KeyboardEvent) => {
	// 	console.log(e.key)
	// 	if(e.key == "+")
	// 	divRef.current.style.height = (divRef.current.clientHeight + 20) + "px";
	// 	if(e.key == "-")
	// 		divRef.current.style.height = (divRef.current.clientHeight - 20) + "px";
	// }, []);
	// useEffect(() => {
	// 	document.addEventListener("keydown", onKeyPress);
	// 	return () => document.removeEventListener("keydown", onKeyPress);
	// })

	return (
		<Card className={cn("flex flex-col", props.className)}>
			<CardHeader className="p-4">
				<CardTitle>{t("schedule")}</CardTitle>
			</CardHeader>
			<CardContent className="h-full flex flex-col">
				<div className="m-4 relative h-full" ref={calendarViewportSize.ref}>
					{/* <div className="flex items-center justify-stretch h-full">
						{weekDays.map((weekDay, i) => <WeekDayTrack key={weekDay.shortLabel} weekDay={weekDay} i={i}/>)}
					</div> */}
					<TimeTicks week={weekInfo} calendarViewportSize={calendarViewportSize}/>
				</div>
			</CardContent>
		</Card>
	)
}
type TimeTicksProps = PropsWithoutRef<{week: WeekInfo, calendarViewportSize: DivElementSize}>;
const TICK_FONT = "14px ui-monospace, SFMono-Regular, monospace";
const TICK_MARGIN_PX = 8;
function measureTextHeight(text: string): number {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return 20;
	ctx.font = TICK_FONT;
	const metrics = ctx.measureText(text);
	return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
}

function TimeTicks(props: TimeTicksProps): JSX.Element {
	if(props.calendarViewportSize.pass == 1) return <></>;

	let displayDayDuration = 24;
	if(Option.isSome(props.week.dstSkipPoint)) {
		displayDayDuration += props.week.dstSkipPoint.value.mode == "positive" ? 1 : 0;
	}
	let skipHour = props.week.dstSkipPoint.pipe(Option.map(({point}) => {
		let {hours, minutes} = DateTime.toParts(point);
		return Duration.decode(`${hours} hours`).pipe(Duration.sum(`${minutes} minutes`));
	}));

	const textHeight = measureTextHeight("00:00");
	const tickDivHeight = textHeight + TICK_MARGIN_PX;

	let tickCount = displayDayDuration*4;
	let spacingPx = (props.calendarViewportSize.height / tickCount);
	while (spacingPx < tickDivHeight && tickCount > 1) {
		tickCount = Math.ceil(tickCount / 2);
		spacingPx = (props.calendarViewportSize.height / tickCount);
	}

	let interval = Duration.unsafeDivide(`${displayDayDuration} hours`, tickCount);
	let ticks: JSX.Element[] = [];
	for(let duration = Duration.zero, i = 0; Duration.lessThan(duration, `${displayDayDuration} hours`); duration = Duration.sum(duration, interval), i++) {

		// This is what will make the hour appear repeated on screen
		// When the tick is past the skip hour it will subtract one from the hour making it appear repeated
		//
		// Example:
		//
		//   -> duration (01:00) + displayOffset (0) = 1:00
		// --------- DST BOUNDARY ----------
		//   -> duration (02:00) + displayOffset (-1) = 1:00
		//

		let displayOffset = Option.isSome(skipHour) && Duration.greaterThan(duration, skipHour.value) ? (displayDayDuration - 24) : 0;
		let durationParts = duration.pipe(
			Duration.subtract(`${displayOffset} hours`),
			Duration.parts
		);
		let padNumber = (n: number) => n.toString().padStart(2, "0");
		let displayTime = `${padNumber(durationParts.hours)}:${padNumber(durationParts.minutes)}`;
		ticks.push(<div style={{
			top: `${spacingPx * i}px`,
			transform: "translateY(-50%)",
		}} className="left-0 right-0 absolute flex gap-4 items-center" key={displayTime}>
			<div className="w-10 inline-flex justify-end font-mono text-sm/[1.0]">{displayTime}</div>
			<div className="w-full border-t-1 border-t-black"/>
		</div>)
	}
	return <>{ticks}</>
}
