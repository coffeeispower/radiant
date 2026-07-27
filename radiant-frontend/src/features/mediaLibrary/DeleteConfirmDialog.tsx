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

import { MediaTreeActions, MediaTreeState } from "./useMediaTree"

interface DeleteConfirmDialogProps {
	state: MediaTreeState
	actions: MediaTreeActions
}

export function DeleteConfirmDialog({ state, actions }: DeleteConfirmDialogProps) {
	const isOpen = state.pendingContextMenu?.kind === "deleteConfirm"
	const targetIds = state.pendingContextMenu?.targetIds ?? new Set()
	const count = state.countRecursive(targetIds)

	const handleConfirm = async () => {
		await actions.deleteNodesByIds(targetIds)
		actions.dismissContextMenu()
	}

	const handleCancel = () => {
		actions.dismissContextMenu()
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Items</DialogTitle>
					<DialogDescription>
						{targetIds.size === 1
							? `Are you sure you want to delete this item?`
							: `Are you sure you want to delete these ${targetIds.size} items?`}
						{count > targetIds.size && (
							<span className="mt-1 block text-sm font-medium text-black/70">
								This will also delete {count - targetIds.size} nested item{count - targetIds.size > 1 ? "s" : ""}.
							</span>
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" onClick={handleCancel}>
						Cancel
					</Button>
					<Button variant="default" onClick={handleConfirm}>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
