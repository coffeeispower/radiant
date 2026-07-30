import React from "react";

export type DndState = {

};

function createDndState(): DndState {
	return {

	}
}
type DndContext = [DndState, React.Dispatch<React.SetStateAction<DndState>>];
const DUMMY_DND_CONTEXT = [createDndState(), () => {}] as DndContext;
export const DndStateContext = React.createContext<DndContext>(DUMMY_DND_CONTEXT);

export function useDndState() {
	return React.useContext(DndStateContext)
}

export function DndStateProvider(props: { children: React.ReactNode }) {
	const state = React.useState<DndState>(createDndState())
	return <DndStateContext.Provider value={state}>
		{props.children}
	</DndStateContext.Provider>
}
