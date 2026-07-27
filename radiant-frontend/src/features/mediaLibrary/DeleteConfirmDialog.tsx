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

import { MediaTreeActions, MediaTreeState } from "./useMediaTree"

interface DeleteConfirmDialogProps {
	state: MediaTreeState
	actions: MediaTreeActions
}

export function DeleteConfirmDialog({ state, actions }: DeleteConfirmDialogProps) {
	const t = useTranslations()
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
					<DialogTitle>{t("Delete Items")}</DialogTitle>
					<DialogDescription>
						{targetIds.size === 1
							? t("Are you sure you want to delete this item")
							: t("Are you sure you want to delete these {count} items", { count: targetIds.size })}
						{count > targetIds.size && (
							<span className="mt-1 block text-sm font-medium text-black/70">
								{t("This will also delete {count} nested item(s)", { count: count - targetIds.size })}
							</span>
						)}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="ghost" onClick={handleCancel}>
						{t("Cancel")}
					</Button>
					<Button variant="default" onClick={handleConfirm}>
						{t("Delete")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
