"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

import { cn } from "@/utils/cn"

const DOTS = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"]

interface SpinnerProps {
	className?: string
}

export function Spinner({ className }: SpinnerProps) {
	const t = useTranslations()
	const [mounted, setMounted] = useState(false)
	const [frame, setFrame] = useState(0)

	useEffect(() => {
		setMounted(true)
		const id = setInterval(() => {
			setFrame((prev) => (prev + 1) % DOTS.length)
		}, 80)
		return () => clearInterval(id)
	}, [])

	if (!mounted) return null

	return (
		<span className={cn("font-mono text-sm select-none", className)} aria-label={t("Loading")}>
			{DOTS[frame]}
		</span>
	)
}
