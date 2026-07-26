import { RadiantClient, Radio } from "@radiant/client"
import { Effect, Either, Option } from "effect"
import { notFound, unauthorized } from "next/navigation"
import { useMemo } from "react"
import { DashboardShell } from "../../../components/dashboard/DashboardShell"
import { WeekCalendar } from "../../../components/dashboard/WeekCalendar"
import { RadiantAtomClient, radioListReactivityKey } from "../../../lib/atoms/radiantClient"
import { runServerEffect } from "../../../lib/serverApiClient"
import { Atom, Result } from "@effect-atom/atom-react"
import { RadioManagementDashboardRoot } from "../../../components/dashboard/RadioManagementDashboardRoot"


async function fetchServerRadio(radioId: Radio.RadioId) {
	if (!radioId.startsWith("radio_")) return notFound()
	const initialRadioResult = (
		await runServerEffect(
			RadiantClient.use((client) =>
				client.radio.get({ path: { radioId: radioId as Radio.RadioId } }),
			).pipe(Effect.either),
		)
	)
	if(Either.isLeft(initialRadioResult)) {
		switch(initialRadioResult.left._tag) {
			case "Unauthorized":
				unauthorized();
			case "RadioNotFound":
				notFound();
		}
		throw initialRadioResult.left
	}
	const initialRadio = initialRadioResult.right;
	return initialRadio;
}

export default async function RadioMainPage({
	params,
}: {
	params: PromiseLike<{ radioId: Radio.RadioId }>
}) {
	let { radioId } = await params
	const initialRadio = await fetchServerRadio(radioId);
	return (
		<DashboardShell>
			<RadioManagementDashboardRoot initialRadio={initialRadio}/>
		</DashboardShell>
	)
}
