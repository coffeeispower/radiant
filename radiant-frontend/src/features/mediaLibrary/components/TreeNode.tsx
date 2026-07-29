"use client"

import { MediaNode } from "@radiant/client"
import { Option } from "effect"

import { FileRow } from "./FileRow"
import { FolderRow } from "./FolderRow"
import { MediaTreeActions, MediaTreeState } from "../hooks/useMediaTree"
import { VisibleNode } from "../types"

interface TreeNodeProps {
	node: VisibleNode
	state: MediaTreeState
	actions: MediaTreeActions
	dropTargetId: MediaNode.MediaNodeId | null
}

export function TreeNode({ node, state, actions, dropTargetId }: TreeNodeProps) {
	const isSelected = state.selection.selectedIds.has(node.id)
	const isFocused = state.selection.focusedId === node.id
	const isRenaming = Option.isSome(state.renamingId) && state.renamingId.value === node.id

	if (node.kind === "folder") {
		const isExpanded = state.expandedIds.has(node.id)
		const isDropTarget = dropTargetId === node.id

		return (
			<FolderRow
				node={node}
				isExpanded={isExpanded}
				isSelected={isSelected}
				isFocused={isFocused}
				isRenaming={isRenaming}
				isDropTarget={isDropTarget}
				actions={actions}
			/>
		)
	}

	return (
		<FileRow
			node={node}
			isSelected={isSelected}
			isFocused={isFocused}
			isRenaming={isRenaming}
			actions={actions}
		/>
	)
}
