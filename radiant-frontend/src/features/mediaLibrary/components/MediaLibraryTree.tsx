"use client"

import { Result } from "@effect-atom/atom-react"
import { MediaNode } from "@radiant/client"
import { useTranslations } from "next-intl"
import { Option } from "effect"
import { useCallback, useEffect, useRef, useState } from "react"

import { ScrollArea } from "@/components/ScrollArea"
import { Spinner } from "@/components/Spinner"
import { cn } from "@/utils/cn"

import { MediaLibraryContextMenu } from "./MediaLibraryContextMenu"
import { UploadIcon } from "./MediaLibraryIcons"
import closedFolderSvg from "@/assets/icons/closed_folder.svg"
import openFolderSvg from "@/assets/icons/open_folder.svg"
import musicFileIconSvg from "@/assets/icons/music_file_icon.svg"
import { TreeNode } from "./TreeNode"
import { MediaTreeActions, MediaTreeState } from "../hooks/useMediaTree"
import { VisibleNode } from "../types"

interface MediaLibraryTreeProps {
	state: MediaTreeState
	actions: MediaTreeActions
	onCreateFolder: (parentId: MediaNode.MediaNodeId | null) => void
	className?: string
}

export function MediaLibraryTree({ state, actions, onCreateFolder, className }: MediaLibraryTreeProps) {
	const t = useTranslations()
	const containerRef = useRef<HTMLDivElement>(null)
	const [isDraggingExternal, setIsDraggingExternal] = useState(false)
	const [externalDropTargetId, setExternalDropTargetId] =
		useState<MediaNode.MediaNodeId | null>(null)
	const [mounted, setMounted] = useState(false)
	useEffect(() => { setMounted(true) }, [])

	useEffect(() => {
		const links: HTMLLinkElement[] = []
		for (const src of [closedFolderSvg.src, openFolderSvg.src, musicFileIconSvg.src]) {
			const link = document.createElement("link")
			link.rel = "preload"
			link.as = "image"
			link.href = src
			document.head.appendChild(link)
			links.push(link)
		}
		return () => {
			for (const link of links) link.remove()
		}
	}, [])

	const handleNativeDragEnter = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault()
			if (event.dataTransfer.types.includes("Files")) {
				setIsDraggingExternal(true)
			}
		},
		[],
	)

	const handleNativeDragOver = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault()
			if (!isDraggingExternal) return

			const target = event.target as HTMLElement
			const nodeRow = target.closest("[data-node-id]")
			if (nodeRow) {
				const nodeId = nodeRow.getAttribute("data-node-id") as MediaNode.MediaNodeId | null
				setExternalDropTargetId(nodeId)
			} else {
				setExternalDropTargetId(null)
			}
		},
		[isDraggingExternal],
	)

	const handleNativeDragLeave = useCallback(
		(event: React.DragEvent) => {
			const relatedTarget = event.relatedTarget as HTMLElement | null
			if (relatedTarget && containerRef.current?.contains(relatedTarget)) return
			setIsDraggingExternal(false)
			setExternalDropTargetId(null)
		},
		[],
	)

	const handleNativeDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault()
			setIsDraggingExternal(false)
			setExternalDropTargetId(null)

			const files = event.dataTransfer.files
			if (files.length === 0) return

			const target = event.target as HTMLElement
			const nodeRow = target.closest("[data-node-id]")
			let parentId: MediaNode.MediaNodeId | null = null
			if (nodeRow) {
				parentId = nodeRow.getAttribute("data-node-id") as MediaNode.MediaNodeId | null
			}

			actions.uploadFiles(files, parentId)
		},
		[actions],
	)

	const handleContextMenuNode = useCallback(
		(node: VisibleNode, event: React.PointerEvent) => {
			if (event.button === 2) {
				// Right-click: select the node if not already part of the selection
				if (!state.selection.selectedIds.has(node.id)) {
					actions.selectNode(node.id, false, false)
				}
			}
		},
		[actions, state.selection.selectedIds],
	)

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (Option.isSome(state.renamingId)) return

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault()
					actions.moveFocus("down")
					break
				case "ArrowUp":
					event.preventDefault()
					actions.moveFocus("up")
					break
				case "ArrowRight":
					event.preventDefault()
					actions.moveFocus("right")
					break
				case "ArrowLeft":
					event.preventDefault()
					actions.moveFocus("left")
					break
				case "Enter": {
					event.preventDefault()
					if (event.altKey) {
						const targetId = state.selection.focusedId ?? Array.from(state.selection.selectedIds)[0]
						if (targetId) {
							actions.requestContextMenu({
								kind: "properties",
								targetIds: new Set([targetId]),
							})
						}
					} else {
						const focusedId = state.selection.focusedId
						if (focusedId) {
							actions.toggleExpand(focusedId)
						}
					}
					break
				}
				case "F2": {
					event.preventDefault()
					const focusedId = state.selection.focusedId
					if (focusedId) {
						actions.startRename(focusedId)
					}
					break
				}
				case "Delete": {
					event.preventDefault()
					if (state.selection.selectedIds.size > 0) {
						actions.deleteSelected()
					}
					break
				}
				case "a": {
					if (event.ctrlKey || event.metaKey) {
						event.preventDefault()
						const allIds = state.flatVisibleNodes.map((n) => n.id)
						// Select all visible nodes
						for (const id of allIds) {
							actions.selectNode(id, true, false)
						}
					}
					break
				}
				case "Escape":
					event.preventDefault()
					actions.cancelRename()
					break
			}
		},
		[state, actions],
	)

	const handleUploadHere = useCallback(
		(parentId: MediaNode.MediaNodeId | null) => {
			const input = document.createElement("input")
			input.type = "file"
			input.accept = "audio/*"
			input.multiple = true
			input.onchange = () => {
				if (input.files) {
					actions.uploadFiles(input.files, parentId)
				}
			}
			input.click()
		},
		[actions],
	)

	return (
		<div
			ref={containerRef}
			className={cn("relative h-full", className)}
			onDragEnter={handleNativeDragEnter}
			onDragOver={handleNativeDragOver}
			onDragLeave={handleNativeDragLeave}
			onDrop={handleNativeDrop}
		>
			<ScrollArea
				className="h-full"
			>
				<MediaLibraryContextMenu
					actions={actions}
					state={state}
					onUploadHere={handleUploadHere}
					onNewFolder={onCreateFolder}
				>
					<div
						role="tree"
						tabIndex={0}
						className="flex-1 outline-none"
						onKeyDown={handleKeyDown}
						onClick={(e) => {
							(e.currentTarget as HTMLElement).focus()
						}}
					>
						{mounted && state.tree._tag === "Initial" && (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<Spinner className="text-lg text-black/40" />
							</div>
						)}

					{state.flatVisibleNodes.map((node) => (
						<div key={node.id} onPointerDown={(e) => handleContextMenuNode(node, e)}>
							<TreeNode
								node={node}
								state={state}
								actions={actions}
								dropTargetId={externalDropTargetId}
							/>
						</div>
					))}

					{mounted && state.tree._tag !== "Initial" && state.flatVisibleNodes.length === 0 && !isDraggingExternal && (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 text-black/40">
								<UploadIcon className="h-8 w-8" />
							</div>
							<p className="text-sm font-bold text-black/40">
								{t("Drop audio files here or use Upload")}
							</p>
						</div>
					)}
				</div>
			</MediaLibraryContextMenu>
		</ScrollArea>

			{isDraggingExternal && (
				<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-4 border-dashed border-signal-warm bg-signal-warm/10">
					<div className="flex flex-col items-center gap-2">
						<UploadIcon className="h-8 w-8" />
						<span className="text-sm font-bold text-signal-warm">
							{t("Drop files to upload")}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}
