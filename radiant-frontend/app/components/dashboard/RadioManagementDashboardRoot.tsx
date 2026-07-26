"use client"

import { PropsWithoutRef, useMemo } from "react";
import { useGenerateGetRadioAtom } from "../../lib/atoms/radiantClient";
import { Radio } from "@radiant/client";
import { WeekCalendar } from "./WeekCalendar";

export function RadioManagementDashboardRoot(props: PropsWithoutRef<{initialRadio: Radio.RadioInfo}>) {
	const radioAtom = useGenerateGetRadioAtom(props.initialRadio);
	return <WeekCalendar radioAtom={radioAtom} />
}
