"use client"

import { createContext, PropsWithoutRef, useContext } from "react";
import { DateTime } from "effect";
import { Atom, Result, useAtomValue } from "@effect-atom/atom-react";
import { Radio } from "@radiant/client";
import { useGenerateGetRadioAtom, useGenerateScheduleBlocksAtom, useMediaLibraryTreeAtom, ScheduleBlocksAtom, MediaLibraryTreeAtom } from "@/context/radiantClient";
import { MediaLibrary } from "@/features/mediaLibrary/MediaLibrary";
import { WeekCalendar } from "@/features/schedule/WeekCalendar";
import { makeWeekInfo } from "@/features/schedule/weekCalendarLayout";
import { DashboardLoadingScreen } from "./DashboardLoadingScreen";
import styled from "styled-components";

type RadioDashboardContextValue = {
	radio: Radio.RadioInfo
	scheduleBlocksAtom: ScheduleBlocksAtom
	mediaTreeAtom: MediaLibraryTreeAtom
}

const RadioDashboardContext = createContext<RadioDashboardContextValue | null>(null);

export function useRadioDashboard() {
	const ctx = useContext(RadioDashboardContext);
	if (!ctx) throw new Error("useRadioDashboard must be used within RadioDashboardProvider");
	return ctx;
}

function useRadioDashboardValue(initialRadio: Radio.RadioInfo): RadioDashboardContextValue | null {
	const radioAtom = useGenerateGetRadioAtom(initialRadio.id);
	const radio = useAtomValue(radioAtom);

	const weekInfo = makeWeekInfo(
		DateTime.setZone(DateTime.unsafeNow(), DateTime.zoneUnsafeMakeNamed(
			radio._tag === "Success" ? radio.value.timezone : initialRadio.timezone,
		)),
	);
	const rangeStart = new Date(DateTime.toEpochMillis(weekInfo.weekStart)).toISOString();
	const rangeEnd = new Date(DateTime.toEpochMillis(weekInfo.weekEnd)).toISOString();

	const scheduleBlocksAtom = useGenerateScheduleBlocksAtom(initialRadio.id, rangeStart, rangeEnd);
	const scheduleBlocks = useAtomValue(scheduleBlocksAtom);

	const mediaTreeAtom = useMediaLibraryTreeAtom(initialRadio.id);
	const mediaTree = useAtomValue(mediaTreeAtom);

	const allReady = Result.all([radio, scheduleBlocks, mediaTree]);

	if (allReady._tag !== "Success") return null;
	const [radioInfo] = allReady.value;
	return { radio: radioInfo, scheduleBlocksAtom, mediaTreeAtom };
}

const GridLayout = styled.div`
	display: grid;
	grid-template-columns: repeat(8, 1fr);
	grid-template-rows: repeat(3, 1fr);
	grid-template-areas:
			"A A A A A A B B"
			"A A A A A A B B"
			"A A A A A A C C";
	gap: 16px;
	padding: 16px;
	background-color: var(--color-canvas);
	inset: 0px;
	position: absolute;
`;

export function RadioManagementDashboardRoot(props: PropsWithoutRef<{initialRadio: Radio.RadioInfo}>) {
	const value = useRadioDashboardValue(props.initialRadio);

	if (!value) {
		return <DashboardLoadingScreen className="absolute inset-0 bg-canvas" />;
	}

	return (
		<RadioDashboardContext.Provider value={value}>
			<GridLayout>
				<WeekCalendar className="[grid-area:A] bg-surface"/>
				<MediaLibrary className="[grid-area:B]"/>
			</GridLayout>
		</RadioDashboardContext.Provider>
	);
}
