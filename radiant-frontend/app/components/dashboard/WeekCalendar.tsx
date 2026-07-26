"use client"
import { DateTime } from "effect";
import { groteskFont, tomorrowFont } from "../../lib/fonts"
import { PropsWithoutRef, useCallback, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { useTranslations } from "next-intl";
import { Radio } from "@radiant/client";
import { GetRadioAtom, RadiantAtomClient, radioListReactivityKey } from "../../lib/atoms/radiantClient";
import { Atom, Result } from "@effect-atom/atom-react";

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


export function WeekCalendar(props: PropsWithoutRef<{radioAtom: GetRadioAtom}>) {

	const t = useTranslations("radio");

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
		<Card>
			<CardHeader className="p-3">
				<CardTitle className="text-xl" >{t("schedule")}</CardTitle>
			</CardHeader>
			<CardContent className="h-full">
				<div className="flex items-center justify-stretch h-full">
					{weekDays.map((weekDay, i) => <WeekDayTrack key={weekDay.shortLabel} weekDay={weekDay} i={i}/>)}
				</div>
			</CardContent>
		</Card>
	)
}
