import { create } from "zustand";

interface SidebarState {
	isExpanded: boolean;
	toggleSidebar: () => void;
	setExpanded: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
	isExpanded: false,

	toggleSidebar: () => set((state) => ({ isExpanded: !state.isExpanded })),

	setExpanded: (value) => set(() => ({ isExpanded: value })),
}));
