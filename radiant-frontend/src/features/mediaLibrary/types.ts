import { MediaNode } from "@radiant/client"
import { CSSProperties } from "react"

export const TREE_INDENT_PX = 48
export const TREE_BASE_PADDING_PX = 8
export const MAX_NODE_NAME_LENGTH = 255

export function treeIndentStyle(depth: number): CSSProperties {
	return { paddingLeft: `${depth * TREE_INDENT_PX + TREE_BASE_PADDING_PX}px` }
}

export type SelectionState = {
	selectedIds: ReadonlySet<MediaNode.MediaNodeId>
	lastSelectedId: MediaNode.MediaNodeId | null
	focusedId: MediaNode.MediaNodeId | null
}

export const EMPTY_SELECTION: SelectionState = {
	selectedIds: new Set(),
	lastSelectedId: null,
	focusedId: null,
}

export interface VisibleNode {
	id: MediaNode.MediaNodeId
	name: string
	kind: MediaNode.MediaNodeKind
	depth: number
	parentId: MediaNode.MediaNodeId | null
}
