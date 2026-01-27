import { create } from "zustand";
import type { DialogType } from "@/types/enum";

interface DialogState {
	isOpen: boolean;
	dialogType: DialogType | null;
	setOpenDialog: (type: DialogType) => void;
	setCloseDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
	isOpen: false,
	dialogType: null,
	setOpenDialog: (type: DialogType) =>
		set(() => ({ isOpen: true, dialogType: type })),
	setCloseDialog: () => set(() => ({ isOpen: false, dialogType: null })),
}));
