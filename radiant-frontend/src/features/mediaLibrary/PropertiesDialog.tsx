"use client"

import { MediaNode } from "@radiant/client"

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

function formatKind(kind: MediaNode.MediaNodeKind): string {
	switch (kind) {
		case "folder":
			return "Folder"
		case "audio_file":
			return "Audio File"
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
						<DialogTitle>Properties</DialogTitle>
						<DialogDescription>Item not found.</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={handleClose}>
							Close
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
					<DialogTitle>Properties</DialogTitle>
					<DialogDescription>
						Details for {node.name}
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4 space-y-3">
					<div>
						<Label>Name</Label>
						<p className="mt-1 text-sm text-black/70">{node.name}</p>
					</div>
					<div>
						<Label>Type</Label>
						<p className="mt-1 text-sm text-black/70">{formatKind(node.kind)}</p>
					</div>
					<div>
						<Label>ID</Label>
						<p className="mt-1 text-sm text-black/70 font-mono">{node.id}</p>
					</div>
					{node.kind === "folder" && (
						<div>
							<Label>Contents</Label>
							<p className="mt-1 text-sm text-black/70">
								{node.children.length} direct items, {childCount} total (including subfolders)
							</p>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="ghost" onClick={handleClose}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
