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
	const isOpen = state.pendingContextMenu?.kind === "properties"
	const targetId = isOpen
		? Array.from(state.pendingContextMenu?.targetIds ?? [])[0]
		: undefined
	const node = targetId ? state.findNodeById(targetId) : undefined

	const handleClose = () => {
		actions.dismissContextMenu()
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
