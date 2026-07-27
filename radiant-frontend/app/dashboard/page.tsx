import { RadiantClient } from "@radiant/client"

import { DashboardRadioPicker } from "@/pgs/radiosList/DashboardRadioPicker"
import { runServerEffect } from "@/lib/serverApiClient"
import { DashboardShell } from "@/pgs/radioDashboard/DashboardShell"

export default async function DashboardPage() {
	const radios = await runServerEffect(RadiantClient.use((client) => client.radio.list()))

	return <DashboardShell sidebar="default">
		<DashboardRadioPicker initialRadios={radios} />
	</DashboardShell>
}
