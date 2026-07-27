import { Atom, AtomHttpApi, Result } from "@effect-atom/atom-react"
import { FetchHttpClient } from "@effect/platform"
import { ApiContract, Radio, Schedule, User } from "@radiant/client"
import { Option } from "effect"
import { useMemo } from "react"

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
