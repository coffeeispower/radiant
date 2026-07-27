"use client"

import { useDraggable, useDroppable } from "@dnd-kit/core"
import { MediaNode } from "@radiant/client"
import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { groteskFont } from "@/lib/fonts"
import { cn } from "@/utils/cn"

import { ChevronIcon, ClosedFolderIcon, OpenFolderIcon } from "./MediaLibraryIcons"
import { MediaTreeActions } from "./useMediaTree"
import { MAX_NODE_NAME_LENGTH, treeIndentStyle, VisibleNode } from "./types"

interface FolderRowProps {
	node: VisibleNode
	isExpanded: boolean
	isSelected: boolean
	isFocused: boolean
	isRenaming: boolean
	isDropTarget: boolean
	actions: MediaTreeActions
}

export function FolderRow({
	node,
	isExpanded,
	isSelected,
	isFocused,
	isRenaming,
	isDropTarget,
	actions,
}: FolderRowProps) {
	const inputRef = useRef<HTMLInputElement>(null)

	const { attributes, listeners, setNodeRef: setDragNodeRef, isDragging } =
		useDraggable({
			id: node.id,
			data: { node },
		})

	const { setNodeRef: setDropNodeRef } = useDroppable({
		id: `drop-${node.id}`,
		data: { node, type: "folder" },
	})

	const setRefs = (el: HTMLElement | null) => {
		setDragNodeRef(el)
		setDropNodeRef(el)
	}

	useEffect(() => {
		if (isRenaming) {
			inputRef.current!.value = node.name;
			inputRef.current!.focus()
		}
	}, [isRenaming, node.name])

	const handleRenameKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault()
			const trimmed = inputRef.current!.value.trim()
			if (trimmed.length > 0 && trimmed.length <= MAX_NODE_NAME_LENGTH) {
				actions.confirmRename(trimmed)
			}
		} else if (event.key === "Escape") {
			event.preventDefault()
			actions.cancelRename()
		}
	}

	const handleRenameBlur = () => {
		actions.cancelRename()
	}

	return (
		<div
			ref={setRefs}
			{...listeners}
			{...attributes}
			style={treeIndentStyle(node.depth)}
			className={cn(
				"flex cursor-pointer select-none items-center gap-2 border-2 border-transparent px-2 py-1",
				groteskFont.className,
				isDragging && "opacity-50",
				isDropTarget && "border-signal-warm",
				isSelected && "bg-signal-warm/30 border-signal-warm",
				isFocused && !isSelected && "bg-surface-muted",
				!isSelected && !isFocused && "hover:bg-surface-muted/50",
			)}
			onClick={(e) => {
				actions.selectNode(node.id, e.ctrlKey, e.shiftKey)
				if (!e.ctrlKey && !e.shiftKey) {
					actions.toggleExpand(node.id)
				}
			}}
			role="treeitem"
			aria-selected={isSelected}
			aria-expanded={isExpanded}
			tabIndex={-1}
			data-node-id={node.id}
		>
			<button
				className="flex h-4 w-4 shrink-0 items-center justify-center"
				tabIndex={-1}
			>
				<ChevronIcon expanded={isExpanded} className="h-2.5 w-2.5" />
			</button>
			{isExpanded ? (
				<OpenFolderIcon className="h-4 w-5 shrink-0" />
			) : (
				<ClosedFolderIcon className="h-4 w-4 shrink-0" />
			)}
			{isRenaming ? (
				<input
					ref={inputRef}
					type="text"
					maxLength={MAX_NODE_NAME_LENGTH}
					className="min-w-0 flex-1 border-2 border-neo-black bg-white px-1 py-0.5 text-sm font-bold outline-none"
					onKeyDown={handleRenameKeyDown}
					onBlur={handleRenameBlur}
					onClick={(e) => e.stopPropagation()}
				/>
			) : (
				<span className="min-w-0 flex-1 truncate text-sm font-bold">
					{node.name}
				</span>
			)}
		</div>
	)
}
