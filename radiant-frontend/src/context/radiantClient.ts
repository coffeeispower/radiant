import { Atom, AtomHttpApi, Result, useAtomSet } from "@effect-atom/atom-react"
import { FetchHttpClient } from "@effect/platform"
import { ApiContract, MediaNode, Radio, Schedule, User } from "@radiant/client"
import { Option } from "effect"
import { useCallback, useMemo } from "react"

export const radioListReactivityKey = "radio:list"
export const currentUserReactivityKey = "user:current"

export class RadiantAtomClient extends AtomHttpApi.Tag<RadiantAtomClient>()("RadiantAtomClient", {
	api: ApiContract.httpApi,
	httpClient: FetchHttpClient.layer,
	baseUrl: "",
}) {}

export const radioListAtom = RadiantAtomClient.query("radio", "list", {
	reactivityKeys: [radioListReactivityKey],
})


export const createRadioAtom = RadiantAtomClient.mutation("radio", "create")

export type CurrentUser = typeof User.User.Type
export type CurrentUserEncoded = typeof User.User.Encoded

export const currentUserAtom = RadiantAtomClient.query("users", "getSelf", {
	reactivityKeys: [currentUserReactivityKey],
})



export function useGenerateGetRadioAtom(radioId: Radio.RadioId) {
	const radioReactivityKey = "radio:" + radioId

	const radioAtom = useMemo(
		() =>
			RadiantAtomClient.query("radio", "get", {
				reactivityKeys: [radioListReactivityKey, radioReactivityKey],
				path: {
					radioId: radioId,
				},
			}),
		[radioId],
	)
	return radioAtom;
}


export type GetRadioAtom = ReturnType<typeof useGenerateGetRadioAtom>;


export function useGenerateScheduleBlocksAtom(
	radioId: Radio.RadioId,
	rangeStart: string,
	rangeEnd: string,
) {
	const atom = useMemo(
		() =>
			RadiantAtomClient.query("scheduleBlocks", "listBlocks", {
				path: {
					radioId: radioId,
				},
				urlParams: {
					rangeStart,
					rangeEnd,
				},
				reactivityKeys: ["radio:"+radioId+":schedule:listBlocks"]
			}),
		[radioId, rangeStart, rangeEnd],
	)
	return atom
}

export type ScheduleBlocksAtom = ReturnType<typeof useGenerateScheduleBlocksAtom>;

export function mediaLibraryTreeReactivityKey(radioId: Radio.RadioId): string {
	return `mediaLibrary:${radioId}:tree`
}

export function useMediaLibraryTreeAtom(radioId: Radio.RadioId) {
	const treeKey = mediaLibraryTreeReactivityKey(radioId)
	return useMemo(
		() =>
			RadiantAtomClient.query("mediaLibrary", "getTree", {
				path: { radioId },
				reactivityKeys: [treeKey],
			}),
		[radioId, treeKey],
	)
}

const createFolderAtom = RadiantAtomClient.mutation("mediaLibrary", "createFolder")
const renameNodeAtom = RadiantAtomClient.mutation("mediaLibrary", "renameNode")
const moveNodeAtom = RadiantAtomClient.mutation("mediaLibrary", "moveNode")
const deleteNodeAtom = RadiantAtomClient.mutation("mediaLibrary", "deleteNode")
const uploadFileAtom = RadiantAtomClient.mutation("mediaLibrary", "uploadFile")

export function useMediaLibraryMutations(radioId: Radio.RadioId) {
	const treeKey = mediaLibraryTreeReactivityKey(radioId)

	const createFolder = useAtomSet(createFolderAtom, { mode: "promiseExit" })
	const renameNode = useAtomSet(renameNodeAtom, { mode: "promiseExit" })
	const moveNode = useAtomSet(moveNodeAtom, { mode: "promiseExit" })
	const deleteNode = useAtomSet(deleteNodeAtom, { mode: "promiseExit" })
	const uploadFileMutate = useAtomSet(uploadFileAtom, { mode: "promiseExit" })


	return {
		createFolder: (name: string, parentId: MediaNode.MediaNodeId | null) =>
			createFolder({
				payload: { name, parentId },
				path: { radioId },
				reactivityKeys: [treeKey],
			}),
		renameNode: (nodeId: MediaNode.MediaNodeId, name: string) =>
			renameNode({
				payload: { name },
				path: { radioId, nodeId },
				reactivityKeys: [treeKey],
			}),
		moveNode: (nodeId: MediaNode.MediaNodeId, parentId: MediaNode.MediaNodeId | null) =>
			moveNode({
				payload: { parentId },
				path: { radioId, nodeId },
				reactivityKeys: [treeKey],
			}),
		deleteNode: (nodeId: MediaNode.MediaNodeId) =>
			deleteNode({
				path: { radioId, nodeId },
				reactivityKeys: [treeKey],
			}),
		uploadFile: (file: File, parentId: MediaNode.MediaNodeId | null) => {
			const formData = new FormData()
			formData.append("file", file)
			return uploadFileMutate({
				payload: formData,
				path: { radioId },
				urlParams: { name: file.name, parentId: parentId ?? undefined },
				reactivityKeys: [treeKey],
			})
		},
	}
}
