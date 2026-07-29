"use client"

import { MediaNode } from "@radiant/client"
import { useTranslations } from "next-intl"

import { Button } from "@/components/Button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/Dialog"
import { Label } from "@/components/label"
import { useRadioDashboard } from "@/pgs/radioDashboard/RadioManagementDashboardRoot"

import { MusicFileIcon } from "./MediaLibraryIcons"
import { useCoverArt } from "./useCoverArt"
import { MediaTreeActions, MediaTreeState } from "./useMediaTree"

interface PropertiesDialogProps {
	state: MediaTreeState
	actions: MediaTreeActions
}

function formatKind(kind: MediaNode.MediaNodeKind, t: ReturnType<typeof useTranslations>): string {
	switch (kind) {
		case "folder":
			return t("Folder")
		case "audio_file":
			return t("Audio File")
		default:
			return kind
	}
}

function countAllDescendants(
	state: MediaTreeState,
	id: MediaNode.MediaNodeId,
): number {
	const node = state.findNodeById(id)
	if (!node || node.kind !== "folder") return 0
	let count = 0
	for (const child of node.children) {
		count += 1
		if (child.kind === "folder") {
			count += countAllDescendants(state, child.id)
		}
	}
	return count
}

export function PropertiesDialog({ state, actions }: PropertiesDialogProps) {
	const t = useTranslations()
	const { radio } = useRadioDashboard()
	const isOpen = state.pendingContextMenu?.kind === "properties"
	const targetId = isOpen
		? Array.from(state.pendingContextMenu?.targetIds ?? [])[0]
		: undefined
	const node = targetId ? state.findNodeById(targetId) : undefined
	const coverArtUrl = useCoverArt(radio.id, node?.id ?? "" as MediaNode.MediaNodeId)

	const handleClose = () => {
		actions.dismissContextMenu()
		document.querySelector<HTMLElement>('[role="tree"]')?.focus()
	}

	if (!node) {
		return (
			<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("Properties")}</DialogTitle>
						<DialogDescription>{t("Item not found")}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={handleClose}>
							{t("Close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		)
	}

	const childCount = node.kind === "folder" ? countAllDescendants(state, node.id) : 0

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("Properties")}</DialogTitle>
					<DialogDescription>
						{t("Details for {name}", { name: node.name })}
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4 space-y-3">
					{node.kind === "audio_file" && (
						<div className="flex justify-center">
							<div className="relative aspect-square w-40 overflow-hidden border-3 border-neo-black bg-neo-paper shadow-neo-badge">
								{coverArtUrl ? (
									<img
										src={coverArtUrl}
										alt={node.name}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center">
										<MusicFileIcon className="h-12 w-12 text-black/20" />
									</div>
								)}
							</div>
						</div>
					)}
					<div>
						<Label>{t("Name")}</Label>
						<p className="mt-1 text-sm text-black/70">{node.name}</p>
					</div>
					<div>
						<Label>{t("Type")}</Label>
						<p className="mt-1 text-sm text-black/70">{formatKind(node.kind, t)}</p>
					</div>
					<div>
						<Label>{t("ID")}</Label>
						<p className="mt-1 text-sm text-black/70 font-mono">{node.id}</p>
					</div>
					{node.kind === "folder" && (
						<div>
							<Label>{t("Contents")}</Label>
							<p className="mt-1 text-sm text-black/70">
								{t("{direct} direct items, {total} total (including subfolders)", { direct: node.children.length, total: childCount })}
							</p>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="ghost" onClick={handleClose}>
						{t("Close")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
