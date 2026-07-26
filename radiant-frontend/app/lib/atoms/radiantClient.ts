import { Atom, AtomHttpApi, Result } from "@effect-atom/atom-react"
import { FetchHttpClient } from "@effect/platform"
import { ApiContract, Radio, User } from "@radiant/client"
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



export function useGenerateGetRadioAtom(initialRadio: Radio.RadioInfo) {
	const radioId = initialRadio.id;
	const radioReactivityKey = "radio:" + radioId

	const radioAtom = useMemo(
		() =>
			RadiantAtomClient.query("radio", "get", {
				reactivityKeys: [radioListReactivityKey, radioReactivityKey],
				path: {
					radioId: radioId,
				},
			}).pipe(
				// This atom will always default to the initialRadio while it's loading
				Atom.map((r) => !Result.isFailure(r) ? Result.success(Result.getOrElse(r, () => initialRadio)) : r)
			),
		[radioId],
	)
	return radioAtom;
}


export type GetRadioAtom = ReturnType<typeof useGenerateGetRadioAtom>;
