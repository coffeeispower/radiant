"use client"

import { scan } from "react-scan"

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
	scan({ enabled: true })
}

export function ReactScan() {
	return null
}
