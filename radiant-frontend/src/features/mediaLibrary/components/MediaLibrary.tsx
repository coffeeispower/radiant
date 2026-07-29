"use client"

import { MediaNode, Radio } from "@radiant/client"
import { useTranslations } from "next-intl"
import { useCallback, useRef, useState } from "react"

import { Button } from "@/components/Button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/Dialog"
import { Input } from "@/components/Input"
import { Label } from "@/components/label"
import { Panel } from "@/components/Panel"
import { cn } from "@/utils/cn"

import { MediaLibraryTree } from "./MediaLibraryTree"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { PropertiesDialog } from "./PropertiesDialog"
import { NewFolderIcon, UploadIcon } from "./MediaLibraryIcons"
import { useMediaTree } from "../hooks/useMediaTree"
import { MAX_NODE_NAME_LENGTH } from "../types"
import { useRadioDashboard } from "@/pgs/radioDashboard/RadioManagementDashboardRoot"
import { ScrollArea } from "@/components/ScrollArea"

interface MediaLibraryProps {
	className?: string
}

export function MediaLibrary({ className }: MediaLibraryProps) {
	const t = useTranslations()
	const { radio, mediaTreeAtom } = useRadioDashboard()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const tree = useMediaTree(radio.id, mediaTreeAtom)

	const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
	const [newFolderParentId, setNewFolderParentId] =
		useState<MediaNode.MediaNodeId | null>(null)
	const [newFolderName, setNewFolderName] = useState("")

	const handleUploadClick = useCallback(() => {
		fileInputRef.current?.click()
	}, [])

	const handleFileChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = event.target.files
			if (files && files.length > 0) {
				tree.uploadFiles(files, null)
			}
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		},
		[tree],
	)

	const openNewFolderDialog = useCallback((parentId: MediaNode.MediaNodeId | null) => {
		setNewFolderParentId(parentId)
		setNewFolderName("")
		setIsFolderDialogOpen(true)
	}, [])

	const handleNewFolderSubmit = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault()
			const trimmed = newFolderName.trim()
			if (trimmed.length === 0) return
			await tree.createFolder(trimmed, newFolderParentId)
			setIsFolderDialogOpen(false)
		},
		[newFolderName, newFolderParentId, tree],
	)

	return (
		<Panel
			title={t("Media Library")}
			className={cn("flex flex-col h-full", className)}
			contentClassName="flex-1 min-h-0 p-0"
			headerActions={
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleUploadClick}
						title={t("Upload audio files")}
					>
						<UploadIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => openNewFolderDialog(null)}
						title={t("New folder")}
					>
						<NewFolderIcon className="h-4 w-4" />
					</Button>
				</div>
			}
		>
			<input
				ref={fileInputRef}
				type="file"
				accept="audio/*"
				multiple
				className="hidden"
				onChange={handleFileChange}
			/>

			<MediaLibraryTree
				state={tree}
				actions={tree}
				onCreateFolder={openNewFolderDialog}
				className="min-h-0 h-full"
			/>
			<Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
				<DialogContent>
					<form onSubmit={handleNewFolderSubmit}>
						<DialogHeader>
							<DialogTitle>{t("New Folder")}</DialogTitle>
							<DialogDescription>
								{t("Enter a name for the new folder")}
							</DialogDescription>
						</DialogHeader>
						<div className="mt-4">
							<Label htmlFor="new-folder-name">{t("Folder name")}</Label>
							<Input
								id="new-folder-name"
								value={newFolderName}
								maxLength={MAX_NODE_NAME_LENGTH}
								autoFocus
								placeholder={t("Jingles")}
								className="mt-2"
								onChange={(e) => setNewFolderName(e.target.value)}
							/>
						</div>
						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => setIsFolderDialogOpen(false)}
							>
								{t("Cancel")}
							</Button>
							<Button
								type="submit"
								variant="default"
								disabled={newFolderName.trim().length === 0}
							>
								{t("Create")}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<DeleteConfirmDialog state={tree} actions={tree} />
			<PropertiesDialog state={tree} actions={tree} />
		</Panel>
	)
}
