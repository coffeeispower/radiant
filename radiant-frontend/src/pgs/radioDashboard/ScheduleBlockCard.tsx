"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/utils/cn"
import { Schedule } from "@radiant/client"

type BlockLike = {
	readonly target: Schedule.ScheduleTarget
	readonly playbackMode: Schedule.BlockPlaybackMode
}

const targetTypeStyles: Record<Schedule.ScheduleTarget["targetType"], string> = {
	audio_file: "bg-neo-mint",
	playlist: "bg-neo-orange",
}

export function ScheduleBlockCard(props: {
	block: BlockLike
	style?: React.CSSProperties
	className?: string
}) {
	const { block, style, className } = props
	const t = useTranslations()
	const targetLabel = block.target.targetType === "audio_file" ? t("AUDIO") : t("PLAYLIST")

	return (
		<div
			style={style}
			className={cn(
				"absolute border-3 border-neo-black shadow-neo-badge overflow-hidden cursor-default select-none",
				"flex flex-col justify-start px-1.5 py-0.5",
				targetTypeStyles[block.target.targetType],
				className,
			)}
		>
			<span className="font-mono text-[0.6rem] font-bold leading-tight truncate text-neo-black uppercase tracking-micro">
				{targetLabel}
			</span>
			{block.playbackMode === "restart" && (
				<span className="font-mono text-[0.5rem] font-bold text-neo-black/60 leading-tight uppercase">
					{t("RST")}
				</span>
			)}
		</div>
	)
}
