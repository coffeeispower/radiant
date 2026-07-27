"use client"

import { useDraggable } from "@dnd-kit/core"
import { MediaNode } from "@radiant/client"
import { useLayoutEffect, useRef, useState } from "react"

import { groteskFont } from "@/lib/fonts"
import { cn } from "@/utils/cn"

import { MusicFileIcon } from "./MediaLibraryIcons"
import { MediaTreeActions } from "./useMediaTree"
import { MAX_NODE_NAME_LENGTH, treeIndentStyle, VisibleNode } from "./types"

interface FileRowProps {
	node: VisibleNode
 isSelected: boolean
 isFocused: boolean
 isRenaming: boolean
	actions: MediaTreeActions
}

export function FileRow({ node, isSelected, isFocused, isRenaming, actions }: FileRowProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [renameValue, setRenameValue] = useState(node.name)

	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: node.id,
		data: { node },
	})

	useLayoutEffect(() => {
		if (isRenaming) {
			setRenameValue(node.name)
			inputRef.current?.focus()
			inputRef.current?.select()
		}
	}, [isRenaming, node.name])

	const handleRenameKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault()
			const trimmed = renameValue.trim()
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
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			style={treeIndentStyle(node.depth)}
			className={cn(
				"flex cursor-pointer select-none items-center gap-2 border-2 border-transparent px-2 py-1",
				groteskFont.className,
				isDragging && "opacity-50",
				isSelected && "bg-signal-warm/30 border-signal-warm",
				isFocused && !isSelected && "bg-surface-muted",
				!isSelected && !isFocused && "hover:bg-surface-muted/50",
			)}
			onClick={(e) => actions.selectNode(node.id, e.ctrlKey, e.shiftKey)}
			role="treeitem"
			aria-selected={isSelected}
			tabIndex={-1}
			data-node-id={node.id}
		>
			<MusicFileIcon className="h-5 w-4 shrink-0" />
			{isRenaming ? (
				<input
					ref={inputRef}
					type="text"
					value={renameValue}
					maxLength={MAX_NODE_NAME_LENGTH}
					className="min-w-0 flex-1 border-2 border-neo-black bg-white px-1 py-0.5 text-sm font-bold outline-none"
					onChange={(e) => setRenameValue(e.target.value)}
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
