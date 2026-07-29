"use client"

import { RadiantAtomClient } from "@/context/radiantClient"
import { Result, useAtomValue } from "@effect-atom/atom-react"
import { MediaNode, Radio } from "@radiant/client"
import { useEffect, useMemo, useState } from "react"

export function useCoverArt(
	radioId: Radio.RadioId,
	nodeId: MediaNode.MediaNodeId,
): string | null {
	const atom = useMemo(
		() =>
			RadiantAtomClient.query("mediaLibrary", "getCoverArt", {
				path: { radioId, nodeId },
			}),
		[radioId, nodeId],
	)

	const result = useAtomValue(atom)
	const [url, setUrl] = useState<string | null>(null)

	useEffect(() => {
		if (Result.isSuccess(result)) {
			const blob = new Blob([new Uint8Array(result.value)], { type: "image/jpeg" })
			const objectUrl = URL.createObjectURL(blob)
			setUrl(objectUrl)
			return () => URL.revokeObjectURL(objectUrl)
		}
		setUrl(null)
	}, [result])

	return url
}
