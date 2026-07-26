"use client"

import { PropsWithoutRef, useMemo } from "react";
import { useGenerateGetRadioAtom } from "../../lib/atoms/radiantClient";
import { Radio } from "@radiant/client";
import { WeekCalendar } from "./WeekCalendar";
import styled from "styled-components";

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
	const radioAtom = useGenerateGetRadioAtom(props.initialRadio);
	return <GridLayout>
		<WeekCalendar radioAtom={radioAtom} className="[grid-area:A] bg-surface"/>

	</GridLayout>
}
