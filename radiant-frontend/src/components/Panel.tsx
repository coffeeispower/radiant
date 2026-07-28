import { PropsWithChildren } from "react"

import { groteskFont, tomorrowFont } from "@/lib/fonts"
import { cn } from "@/utils/cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"

export function Panel(
	props: PropsWithChildren<{
		title: string
		kicker?: string
		className?: string
		contentClassName?: string
		headerActions?: React.ReactNode
	}>,
) {
	return (
		<Card className={cn("bg-white shadow-neo-panel-mobile", props.className)}>
			<CardHeader className="flex-row items-start justify-between gap-4 border-b-3 border-neo-black px-5 py-4 space-y-0">
				<div>
					{props.kicker ? (
						<p
							className={`text-[10px] font-extrabold uppercase tracking-[0.22em] text-black/55 ${groteskFont.className}`}
						>
							{props.kicker}
						</p>
					) : null}
					<CardTitle
						className={`${tomorrowFont.className} mt-2 text-xl font-extrabold uppercase text-neo-black`}
					>
						{props.title}
					</CardTitle>
				</div>
				{props.headerActions}
			</CardHeader>
			<CardContent className={cn("p-5", props.contentClassName)}>{props.children}</CardContent>
		</Card>
	)
}
