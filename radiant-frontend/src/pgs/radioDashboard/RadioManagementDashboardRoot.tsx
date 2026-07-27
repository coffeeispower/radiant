"use client"

import { PropsWithoutRef, useMemo } from "react";
import { useGenerateGetRadioAtom } from "@/context/radiantClient";
import { Radio } from "@radiant/client";
import { WeekCalendar } from "./WeekCalendar";
import styled from "styled-components";
import { Atom, Result } from "@effect-atom/atom-react";
import { constant } from "effect/Function";

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
	const radioAtom = useGenerateGetRadioAtom(props.initialRadio.id).pipe(Atom.withServerValue(constant(Result.success(props.initialRadio))));
	return <GridLayout>
		<WeekCalendar radioAtom={radioAtom} className="[grid-area:A] bg-surface"/>

	</GridLayout>
}
