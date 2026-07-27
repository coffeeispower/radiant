import { useTranslations } from "next-intl"

import { StatCard } from "@/components/StatCard"

export function FeatureStatsRow(props: { className?: string }) {
	const t = useTranslations()

	return (
		<div className={`flex flex-wrap items-start gap-4 ${props.className ?? ""}`}>
			<StatCard label={t("Playout")} accentClassName="bg-neo-paper">
				{t("Calendar driven")}
			</StatCard>
			<StatCard label={t("License")} accentClassName="bg-neo-mint">
				GPL-3.0
			</StatCard>
			<StatCard label={t("Output")} accentClassName="bg-neo-orange">
				{t("ICY ready")}
			</StatCard>
		</div>
	)
}
