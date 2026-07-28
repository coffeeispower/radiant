import { useMemo } from "react";
import { MediaNode } from "@radiant/client";
import { useAtomValue, Result } from "@effect-atom/atom-react";
import { useRadioDashboard } from "@/pgs/radioDashboard/RadioManagementDashboardRoot";

function findNodeById(
	nodes: ReadonlyArray<{ id: MediaNode.MediaNodeId; name: string; children: ReadonlyArray<any> }>,
	id: MediaNode.MediaNodeId,
): string | undefined {
	for (const node of nodes) {
		if (node.id === id) return node.name;
		const found = findNodeById(node.children, id);
		if (found !== undefined) return found;
	}
	return undefined;
}

/** Returns the name of a media node by its ID, reactively from the media tree. */
export function useMediaNodeNameById(id: MediaNode.MediaNodeId | null): string | undefined {
	const { mediaTreeAtom } = useRadioDashboard();
	const treeResult = useAtomValue(mediaTreeAtom);

	return useMemo(() => {
		if (id === null) return undefined;
		if (!Result.isSuccess(treeResult)) return undefined;
		return findNodeById(treeResult.value, id);
	}, [id, treeResult]);
}
