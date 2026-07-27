"use client"

import { MediaNode } from "@radiant/client"

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ContextMenu"

import {
	CutIcon,
	DeleteIcon,
	NewFolderIcon,
	PasteIcon,
	RenameIcon,
	UploadIcon,
} from "./MediaLibraryIcons"
import { MediaTreeActions, MediaTreeState } from "./useMediaTree"

interface MediaLibraryContextMenuProps {
	children: React.ReactNode
	actions: MediaTreeActions
	state: MediaTreeState
	onUploadHere: (parentId: MediaNode.MediaNodeId | null) => void
	onNewFolder: (parentId: MediaNode.MediaNodeId | null) => void
}

function getSelectedFolders(
	state: MediaTreeState,
): MediaNode.MediaNodeId[] {
	const folders: MediaNode.MediaNodeId[] = []
	for (const id of state.selection.selectedIds) {
		const node = state.findNodeById(id)
		if (node && node.kind === "folder") {
			folders.push(id)
		}
	}
	return folders
}

function hasSingleFolderSelection(state: MediaTreeState): boolean {
	const folders = getSelectedFolders(state)
	return folders.length === 1
}

function getSingleFolderId(state: MediaTreeState): MediaNode.MediaNodeId | null {
	const folders = getSelectedFolders(state)
	return folders.length === 1 ? folders[0] : null
}

function hasSingleSelection(state: MediaTreeState): boolean {
	return state.selection.selectedIds.size === 1
}

export function MediaLibraryContextMenu({
	children,
	actions,
	state,
	onUploadHere,
	onNewFolder,
}: MediaLibraryContextMenuProps) {
	const hasSelection = state.selection.selectedIds.size > 0
	const singleFolderId = getSingleFolderId(state)
	const canUpload = hasSingleFolderSelection(state)
	const canCreateFolder = hasSingleFolderSelection(state)
	const canRename = hasSingleSelection(state)

	const handleCut = () => {
		actions.cutToClipboard()
	}

	const handlePaste = () => {
		const targetParentId = singleFolderId
		actions.pasteFromClipboard(targetParentId)
	}

	const handleRename = () => {
		if (state.selection.selectedIds.size === 1) {
			const id = Array.from(state.selection.selectedIds)[0]
			actions.startRename(id)
		}
	}

	const handleDelete = () => {
		actions.requestContextMenu({
			kind: "deleteConfirm",
			targetIds: new Set(state.selection.selectedIds),
		})
	}

	const handleProperties = () => {
		if (state.selection.selectedIds.size === 1) {
			const id = Array.from(state.selection.selectedIds)[0]
			actions.requestContextMenu({
				kind: "properties",
				targetIds: new Set([id]),
			})
		}
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					disabled={!canUpload}
					onSelect={() => onUploadHere(singleFolderId)}
				>
					<UploadIcon className="mr-2 h-4 w-4" />
					Upload File
				</ContextMenuItem>
				<ContextMenuItem
					disabled={!canCreateFolder}
					onSelect={() => onNewFolder(singleFolderId)}
				>
					<NewFolderIcon className="mr-2 h-4 w-4" />
					Create Folder
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem
					disabled={!canRename}
					onSelect={handleRename}
				>
					<RenameIcon className="mr-2 h-4 w-4" />
					Rename
				</ContextMenuItem>
				<ContextMenuItem
					disabled={!hasSelection}
					onSelect={handleDelete}
				>
					<DeleteIcon className="mr-2 h-4 w-4" />
					Delete
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem onSelect={handleCut}>
					<CutIcon className="mr-2 h-4 w-4" />
					Cut
				</ContextMenuItem>
				<ContextMenuItem
					disabled={state.clipboard === null}
					onSelect={handlePaste}
				>
					<PasteIcon className="mr-2 h-4 w-4" />
					Paste
				</ContextMenuItem>
				{state.clipboard !== null && (
					<ContextMenuItem onSelect={actions.cancelClipboard}>
						Cancel Move
					</ContextMenuItem>
				)}
				<ContextMenuSeparator />
				<ContextMenuItem
					disabled={!hasSingleSelection}
					onSelect={handleProperties}
				>
					Properties
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	)
}
