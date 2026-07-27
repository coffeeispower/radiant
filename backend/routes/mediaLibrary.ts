import { FileSystem, HttpApiBuilder, HttpServerResponse } from "@effect/platform"
import * as RadiantClient from "@radiant/client"
import { CurrentUser } from "@radiant/client/contract"
import { Effect, Stream } from "effect"

import { RadioManager } from "../services"
import { MediaLibraryService } from "../services/MediaLibraryService"

const ensureRadioOwner = Effect.fn("http.mediaLibrary.ensureRadioOwner")(function* (
	radioId: RadiantClient.Radio.RadioId,
) {
	const radioManager = yield* RadioManager.RadioManager
	const userId = yield* CurrentUser
	yield* radioManager.getUserRadioInfo(userId, radioId)
})

export const mediaLibraryGroupLive = HttpApiBuilder.group(
	RadiantClient.ApiContract.httpApi,
	"mediaLibrary",
	(handlers) =>
		handlers
			.handle(
				"getTree",
				Effect.fn("http.mediaLibrary.getTree")(function* ({ path: { radioId } }) {
					yield* ensureRadioOwner(radioId)

					const mediaLibrary = yield* MediaLibraryService
					return yield* mediaLibrary.getTree(radioId)
				}),
			)
			.handle(
				"uploadFile",
				Effect.fn("http.mediaLibrary.uploadFile")(function* ({ path: { radioId }, urlParams, payload }) {
					yield* ensureRadioOwner(radioId)

					const mediaLibrary = yield* MediaLibraryService
					const fs = yield* FileSystem.FileSystem
					const content = Stream.fromEffect(fs.readFile(payload.file.path))

					return yield* mediaLibrary.uploadAudioFile({
						radioId,
						parentId: urlParams.parentId ?? null,
						name: urlParams.name,
						contentType: payload.file.contentType,
						content,
					})
				}),
			)
			.handle(
				"getCoverArt",
				Effect.fn("http.mediaLibrary.getCoverArt")(function* ({ path: { radioId, nodeId } }) {
					yield* ensureRadioOwner(radioId)

					const mediaLibrary = yield* MediaLibraryService
					const coverArt = yield* mediaLibrary.getCoverArt({ radioId, nodeId })

					return HttpServerResponse.stream(coverArt.content, {
						contentType: coverArt.contentType,
						headers: {
							"cache-control": "public, max-age=3600",
						},
					})
				}),
			)
			.handle(
				"createFolder",
				Effect.fn("http.mediaLibrary.createFolder")(function* ({ path: { radioId }, payload }) {
					yield* ensureRadioOwner(radioId)

					const mediaLibrary = yield* MediaLibraryService
					return yield* mediaLibrary.createFolder({
						radioId,
						parentId: payload.parentId,
						name: payload.name,
					})
				}),
			)
			.handle(
				"renameNode",
				Effect.fn("http.mediaLibrary.renameNode")(function* ({
					path: { radioId, nodeId },
					payload,
				}) {
					yield* ensureRadioOwner(radioId)

					const mediaLibrary = yield* MediaLibraryService
					return yield* mediaLibrary.renameNode({
						radioId,
						nodeId,
						name: payload.name,
					})
				}),
			)
			.handle(
				"moveNode",
				Effect.fn("http.mediaLibrary.moveNode")(function* ({ path: { radioId, nodeId }, payload }) {
					yield* ensureRadioOwner(radioId)

					const mediaLibrary = yield* MediaLibraryService
					return yield* mediaLibrary.moveNode({
						radioId,
						nodeId,
						parentId: payload.parentId,
					})
				}),
			)
			.handle(
				"deleteNode",
				Effect.fn("http.mediaLibrary.deleteNode")(function* ({ path: { radioId, nodeId } }) {
					yield* ensureRadioOwner(radioId)

					const mediaLibrary = yield* MediaLibraryService
					return yield* mediaLibrary.deleteNode({
						radioId,
						nodeId,
					})
				}),
			),
)
