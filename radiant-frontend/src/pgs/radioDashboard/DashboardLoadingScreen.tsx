"use client"

import { useEffect, useState } from "react"
import { tomorrowFont } from "@/lib/fonts"
import { cn } from "@/utils/cn"

const STEPS: { wave1: boolean; wave2: boolean }[] = [
	{ wave1: true, wave2: false },
	{ wave1: true, wave2: true },
	{ wave1: false, wave2: true },
	{ wave1: false, wave2: false },
]
const STEP_DURATION = 400

interface DashboardLoadingScreenProps {
	className?: string
}

export function DashboardLoadingScreen({ className }: DashboardLoadingScreenProps) {
	const [step, setStep] = useState(0)

	useEffect(() => {
		const id = setInterval(() => {
			setStep((prev) => (prev + 1) % STEPS.length)
		}, STEP_DURATION)
		return () => clearInterval(id)
	}, [])

	const { wave1: showWave1, wave2: showWave2 } = STEPS[step]

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center",
				className,
			)}
		>
			<span
				className={`${tomorrowFont.className} flex items-start text-[4rem] font-bold leading-none tracking-tighter select-none`}
			>
				R
				<svg
					width="6"
					height="5"
					viewBox="0 0 6 5"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="ml-0.5 -mt-2 h-5 w-5"
				>
					{showWave1 && (
						<path d="M0.705862 2.10848L1.92829 2.05142L3.20778 3.21678L3.26485 4.4392" stroke="black" />
					)}
					{showWave2 && (
						<path d="M4.82141 4.97908L4.72155 2.83984L2.16256 0.509116L0.0233162 0.608981" stroke="black" />
					)}
				</svg>
			</span>
		</div>
	)
}
