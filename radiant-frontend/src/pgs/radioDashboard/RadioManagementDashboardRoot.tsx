"use client"

import { PropsWithoutRef } from "react";
import { useGenerateGetRadioAtom } from "@/context/radiantClient";
import { Radio } from "@radiant/client";
import { MediaLibrary } from "./MediaLibrary";
import { WeekCalendar } from "./WeekCalendar";
import { DashboardLoadingScreen } from "./DashboardLoadingScreen";
import styled from "styled-components";
import { useAtomValue } from "@effect-atom/atom-react";

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
	const radioAtom = useGenerateGetRadioAtom(props.initialRadio.id);
	const radio = useAtomValue(radioAtom);

	if (radio._tag !== "Success") {
		return <DashboardLoadingScreen className="absolute inset-0 bg-canvas" />;
	}

	return <GridLayout>
		<WeekCalendar radioAtom={radioAtom} className="[grid-area:A] bg-surface"/>
		<MediaLibrary radioId={props.initialRadio.id} className="[grid-area:B]"/>
	</GridLayout>
}
