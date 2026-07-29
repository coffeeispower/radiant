"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/utils/cn"
import { Schedule } from "@radiant/client"
import { useMediaNodeNameById } from "@/features/mediaLibrary/useMediaNodeNameById"
import styled from "styled-components"
import { useEffect, useState } from "react"

type BlockLike = {
	readonly target: Schedule.ScheduleTarget
}

const targetTypeStyles: Record<Schedule.ScheduleTarget["targetType"], string> = {
	audio_file: "bg-neo-mint",
	playlist: "bg-neo-orange",
} as const

const UNKNOWN_TARGET_STYLE = "bg-neutral-200"

const MIN_HEIGHT_FOR_ALWAYS_VISIBLE_TEXT = 30

const SizedDiv = styled.div<{ $height: number }>`
	interpolate-size: allow-keywords;
	height: ${({ $height }) => $height}px;
	&:hover {

		/**
			* calc-size is an experimental feature but it is the cleanest way to make the block not contract when hovered when the
		  * height is bigger than the actual content
		*/
		height: calc-size(fit-content, max(size, ${({ $height }) => $height}px));
	}
`;

export function ScheduleBlockCard(props: {
	block: BlockLike
	height: number
	style?: React.CSSProperties
	className?: string
}) {
	const { block, height, style, className } = props
	const t = useTranslations()
	const targetLabel = block.target.targetType === "audio_file" ? t("AUDIO") : t("PLAYLIST")
	const nodeName = useMediaNodeNameById(
		block.target.targetType === "audio_file" ? block.target.mediaNodeId : null,
	)
	const hasMinHeight = height > MIN_HEIGHT_FOR_ALWAYS_VISIBLE_TEXT

	// This is a hack to make transition not affect zooming in and out the time table and delaying layout shifts
	// The transition will only affect hovering the card, not changing its height via the `height` prop
	const [showTransition, setShowTransition] = useState(false);
	useEffect(() => {
		setShowTransition(false);
		let t = setTimeout(() => setShowTransition(true), 50);
		return () => clearTimeout(t);
	}, [height]);
	// ------ END OF HACK -------

	return (
		<SizedDiv
			$height={height}
			style={style}
			className={cn(
				"absolute left-2 right-2 border-3 border-neo-black shadow-neo-badge cursor-default select-none",
				"duration-150 ease-out",
				"hover:z-50 group",
				showTransition ? "transition-[height]" : "transition-none",
				targetTypeStyles[block.target.targetType] ?? UNKNOWN_TARGET_STYLE,
				className,
			)}
			data-has-min-height={hasMinHeight || undefined}
		>
			<div className="h-max flex flex-col justify-start px-1.5 py-0.5">
				<span className="font-mono text-[0.6rem] font-bold leading-tight truncate text-neo-black uppercase tracking-micro not-group-hover:not-in-data-has-min-height:opacity-0 transition-opacity">
					{targetLabel}
				</span>
				{nodeName && (
					<span className="font-mono text-[0.5rem] font-bold text-neo-black/60 leading-tight truncate not-group-hover:not-in-data-has-min-height:opacity-0 transition-opacity">
						{nodeName}
					</span>
				)}
			</div>
		</SizedDiv>
	)
}
