"use client"

import { Atom, Result, useAtomValue } from "@effect-atom/atom-react"
import { MediaLibrary, MediaNode, Radio } from "@radiant/client"
import { Exit, Option } from "effect"
import { useCallback, useMemo, useState } from "react"

import {
	useMediaLibraryMutations,
} from "@/context/radiantClient"

import { EMPTY_SELECTION, SelectionState, VisibleNode } from "./types"

function flattenTree(
	nodes: ReadonlyArray<MediaLibrary.MediaLibraryTreeNode>,
	expandedIds: ReadonlySet<MediaNode.MediaNodeId>,
	depth: number,
	parentId: MediaNode.MediaNodeId | null,
): ReadonlyArray<VisibleNode> {
	const result: VisibleNode[] = []
	for (const node of nodes) {
		result.push({
			id: node.id,
			name: node.name,
			kind: node.kind,
			depth,
			parentId,
		})
		if (node.kind === "folder" && expandedIds.has(node.id)) {
			result.push(
				...flattenTree(node.children, expandedIds, depth + 1, node.id),
			)
		}
	}
	return result
}

function findNode(
	nodes: ReadonlyArray<MediaLibrary.MediaLibraryTreeNode>,
	id: MediaNode.MediaNodeId,
): MediaLibrary.MediaLibraryTreeNode | undefined {
	for (const node of nodes) {
		if (node.id === id) return node
		if (node.kind === "folder") {
			const found = findNode(node.children, id)
			if (found) return found
		}
	}
	return undefined
}

function countNodesRecursive(
	nodes: ReadonlyArray<MediaLibrary.MediaLibraryTreeNode>,
): number {
	let count = 0
	for (const node of nodes) {
		count += 1
		if (node.kind === "folder") {
			count += countNodesRecursive(node.children)
		}
	}
	return count
}

export interface ClipboardState {
	readonly nodeIds: ReadonlySet<MediaNode.MediaNodeId>
	readonly mode: "cut"
}

export interface ContextMenuRequest {
	readonly kind: "deleteConfirm" | "properties" | "uploadFile" | "createFolder"
	readonly targetIds: ReadonlySet<MediaNode.MediaNodeId>
}

export interface MediaTreeState {
	tree: Result.Result<
		ReadonlyArray<MediaLibrary.MediaLibraryTreeNode>,
		unknown
	>
	flatVisibleNodes: ReadonlyArray<VisibleNode>
	expandedIds: ReadonlySet<MediaNode.MediaNodeId>
	selection: SelectionState
	renamingId: Option.Option<MediaNode.MediaNodeId>
	clipboard: ClipboardState | null
	pendingContextMenu: ContextMenuRequest | null
	findNodeById: (id: MediaNode.MediaNodeId) => MediaLibrary.MediaLibraryTreeNode | undefined
	countRecursive: (ids: ReadonlySet<MediaNode.MediaNodeId>) => number
}

export interface MediaTreeActions {
	toggleExpand: (id: MediaNode.MediaNodeId) => void
	selectNode: (id: MediaNode.MediaNodeId, ctrlKey: boolean, shiftKey: boolean) => void
	moveFocus: (direction: "up" | "down" | "left" | "right") => void
	startRename: (id: MediaNode.MediaNodeId) => void
	cancelRename: () => void
	confirmRename: (name: string) => Promise<void>
	uploadFiles: (files: FileList, parentId: MediaNode.MediaNodeId | null) => Promise<void>
	createFolder: (name: string, parentId: MediaNode.MediaNodeId | null) => Promise<void>
	deleteSelected: () => Promise<void>
	deleteNodesByIds: (ids: ReadonlySet<MediaNode.MediaNodeId>) => Promise<void>
	moveNode: (nodeId: MediaNode.MediaNodeId, parentId: MediaNode.MediaNodeId | null) => Promise<void>
	cutToClipboard: () => void
	pasteFromClipboard: (targetParentId: MediaNode.MediaNodeId | null) => Promise<void>
	cancelClipboard: () => void
	requestContextMenu: (request: ContextMenuRequest) => void
	dismissContextMenu: () => void
}

export function useMediaTree(radioId: Radio.RadioId, treeAtom: Atom.Atom<Result.Result<ReadonlyArray<MediaLibrary.MediaLibraryTreeNode>, unknown>>): MediaTreeState & MediaTreeActions {
	const treeResult = useAtomValue(treeAtom)
	const mutations = useMediaLibraryMutations(radioId)

	const [expandedIds, setExpandedIds] = useState<
		ReadonlySet<MediaNode.MediaNodeId>
	>(() => new Set())
	const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION)
	const [renamingId, setRenamingId] = useState<Option.Option<MediaNode.MediaNodeId>>(
		Option.none(),
	)
	const [clipboard, setClipboard] = useState<ClipboardState | null>(null)
	const [pendingContextMenu, setPendingContextMenu] = useState<ContextMenuRequest | null>(null)

	const treeNodes = useMemo(() => {
		if (Result.isFailure(treeResult)) return []
		return Result.getOrElse(treeResult, () => [])
	}, [treeResult])

	const flatVisibleNodes = useMemo(
		() => flattenTree(treeNodes, expandedIds, 0, null),
		[treeNodes, expandedIds],
	)

	const toggleExpand = useCallback((id: MediaNode.MediaNodeId) => {
		setExpandedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}, [])

	const selectNode = useCallback(
		(id: MediaNode.MediaNodeId, ctrlKey: boolean, shiftKey: boolean) => {
			setSelection((prev) => {
				if (shiftKey && prev.lastSelectedId !== null) {
					const anchorIndex = flatVisibleNodes.findIndex(
						(n) => n.id === prev.lastSelectedId,
					)
					const targetIndex = flatVisibleNodes.findIndex((n) => n.id === id)
					if (anchorIndex === -1 || targetIndex === -1) return prev

					const start = Math.min(anchorIndex, targetIndex)
					const end = Math.max(anchorIndex, targetIndex)
					const rangeIds = flatVisibleNodes
						.slice(start, end + 1)
						.map((n) => n.id)

					if (ctrlKey) {
						const next = new Set(prev.selectedIds)
						for (const rid of rangeIds) next.add(rid)
						return {
							selectedIds: next,
							lastSelectedId: prev.lastSelectedId,
							focusedId: id,
						}
					}

					return {
						selectedIds: new Set(rangeIds),
						lastSelectedId: prev.lastSelectedId,
						focusedId: id,
					}
				}

				if (ctrlKey) {
					const next = new Set(prev.selectedIds)
					if (next.has(id)) {
						next.delete(id)
					} else {
						next.add(id)
					}
					return {
						selectedIds: next,
						lastSelectedId: id,
						focusedId: id,
					}
				}

				return {
					selectedIds: new Set([id]),
					lastSelectedId: id,
					focusedId: id,
				}
			})
		},
		[flatVisibleNodes],
	)

	const moveFocus = useCallback(
		(direction: "up" | "down" | "left" | "right") => {
			setSelection((prev) => {
				if (flatVisibleNodes.length === 0) return prev

				const currentIndex = prev.focusedId
					? flatVisibleNodes.findIndex((n) => n.id === prev.focusedId)
					: -1

				let nextIndex = currentIndex

				switch (direction) {
					case "up": {
						nextIndex = Math.max(0, currentIndex - 1)
						break
					}
					case "down": {
						nextIndex = Math.min(
							flatVisibleNodes.length - 1,
							currentIndex + 1,
						)
						break
					}
					case "left": {
						if (currentIndex === -1) break
						const current = flatVisibleNodes[currentIndex]
						const node = findNode(treeNodes, current.id)
						if (
							node &&
							node.kind === "folder" &&
							expandedIds.has(node.id)
						) {
							setExpandedIds((prev) => {
								const next = new Set(prev)
								next.delete(node.id)
								return next
							})
							return prev
						}
						if (current.parentId !== null) {
							nextIndex = flatVisibleNodes.findIndex(
								(n) => n.id === current.parentId,
							)
						}
						break
					}
					case "right": {
						if (currentIndex === -1) break
						const current = flatVisibleNodes[currentIndex]
						const node = findNode(treeNodes, current.id)
						if (node && node.kind === "folder") {
							if (!expandedIds.has(node.id)) {
								setExpandedIds((prev) => {
									const next = new Set(prev)
									next.add(node.id)
									return next
								})
								return prev
							}
							nextIndex = Math.min(
								flatVisibleNodes.length - 1,
								currentIndex + 1,
							)
						}
						break
					}
				}

			if (nextIndex === currentIndex || nextIndex === -1) return prev

			const nextId = flatVisibleNodes[nextIndex].id
			return {
				...prev,
				focusedId: nextId,
				selectedIds: new Set([nextId]),
				lastSelectedId: nextId,
			}
			})
		},
		[flatVisibleNodes, treeNodes, expandedIds],
	)

	const startRename = useCallback((id: MediaNode.MediaNodeId) => {
		setRenamingId(Option.some(id))
	}, [])

	const cancelRename = useCallback(() => {
		setRenamingId(Option.none())
	}, [])

	const confirmRename = useCallback(
		async (name: string) => {
			const nodeId = Option.getOrNull(renamingId)
			if (nodeId === null) return

			const exit = await mutations.renameNode(nodeId, name)
			if (Exit.isSuccess(exit)) {
				setRenamingId(Option.none())
			}
		},
		[renamingId, mutations],
	)

	const uploadFiles = useCallback(
		async (files: FileList, parentId: MediaNode.MediaNodeId | null) => {
			const fileArray: File[] = []
			for (let i = 0; i < files.length; i++) {
				fileArray.push(files[i])
			}
			const exits = await Promise.all(
				fileArray.map((file) => mutations.uploadFile(file, parentId)),
			)
			const failedCount = exits.filter(Exit.isFailure).length
			if (failedCount > 0) {
				console.error(`${failedCount} of ${fileArray.length} file(s) failed to upload`)
			}
		},
		[mutations],
	)

	const createFolder = useCallback(
		async (name: string, parentId: MediaNode.MediaNodeId | null) => {
			const exit = await mutations.createFolder(name, parentId)
			if (Exit.isSuccess(exit)) {
				if (parentId !== null) {
					setExpandedIds((prev) => {
						const next = new Set(prev)
						next.add(parentId)
						return next
					})
				}
				setRenamingId(Option.none())
			}
		},
		[mutations],
	)

	const deleteSelected = useCallback(async () => {
		await deleteNodesByIds(selection.selectedIds)
	}, [selection.selectedIds])

	const deleteNodesByIds = useCallback(
		async (ids: ReadonlySet<MediaNode.MediaNodeId>) => {
			const idArray: MediaNode.MediaNodeId[] = []
			ids.forEach((id) => idArray.push(id))
			const exits = await Promise.all(
				idArray.map((id) => mutations.deleteNode(id)),
			)
			const failedCount = exits.filter(Exit.isFailure).length
			if (failedCount > 0) {
				console.error(`${failedCount} of ${idArray.length} item(s) failed to delete`)
			}
			setSelection(EMPTY_SELECTION)
		},
		[mutations],
	)

	const moveNode = useCallback(
		async (nodeId: MediaNode.MediaNodeId, parentId: MediaNode.MediaNodeId | null) => {
			await mutations.moveNode(nodeId, parentId)
			if (parentId !== null) {
				setExpandedIds((prev) => {
					const next = new Set(prev)
					next.add(parentId)
					return next
				})
			}
		},
		[mutations],
	)

	const cutToClipboard = useCallback(() => {
		if (selection.selectedIds.size === 0) return
		setClipboard({
			nodeIds: new Set(selection.selectedIds),
			mode: "cut",
		})
	}, [selection.selectedIds])

	const pasteFromClipboard = useCallback(async (targetParentId: MediaNode.MediaNodeId | null) => {
		if (clipboard === null) return
		const ids = Array.from(clipboard.nodeIds)
		for (const id of ids) {
			await mutations.moveNode(id, targetParentId)
		}
		setClipboard(null)
		setSelection(EMPTY_SELECTION)
	}, [clipboard, mutations])

	const cancelClipboard = useCallback(() => {
		setClipboard(null)
	}, [])

	const requestContextMenu = useCallback((request: ContextMenuRequest) => {
		setPendingContextMenu(request)
	}, [])

	const dismissContextMenu = useCallback(() => {
		setPendingContextMenu(null)
	}, [])

	const findNodeById = useCallback(
		(id: MediaNode.MediaNodeId) => findNode(treeNodes, id),
		[treeNodes],
	)

	const countRecursive = useCallback(
		(ids: ReadonlySet<MediaNode.MediaNodeId>) => {
			let total = 0
			for (const id of ids) {
				const node = findNode(treeNodes, id)
				if (node) {
					if (node.kind === "folder") {
						total += countNodesRecursive(node.children)
					}
					total += 1
				}
			}
			return total
		},
		[treeNodes],
	)

	return {
		tree: treeResult,
		flatVisibleNodes,
		expandedIds,
		selection,
		renamingId,
		clipboard,
		pendingContextMenu,
		toggleExpand,
		selectNode,
		moveFocus,
		startRename,
		cancelRename,
		confirmRename,
		uploadFiles,
		createFolder,
		deleteSelected,
		deleteNodesByIds,
		moveNode,
		cutToClipboard,
		pasteFromClipboard,
		cancelClipboard,
		requestContextMenu,
		dismissContextMenu,
		findNodeById,
		countRecursive,
	}
}
