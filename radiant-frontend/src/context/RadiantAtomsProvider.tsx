"use client"

import { RegistryProvider } from "@effect-atom/atom-react"
import type { ReactNode } from "react"

type RadiantAtomsProviderProps = {
	children: ReactNode
}

export function RadiantAtomsProvider({ children }: RadiantAtomsProviderProps) {
	return (
		<RegistryProvider>
			{children}
		</RegistryProvider>
	)
}
