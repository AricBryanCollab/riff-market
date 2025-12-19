import { create } from "zustand";

interface DialogState {
	isOpen: boolean;
	dialogType: string | null;
	setOpenDialog: (type: string) => void;
	setCloseDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
	isOpen: false,
	dialogType: null,
 	setOpenDialog: (type: string) =>
    	set(() => ({ isOpen: true, dialogType: type })),
 	setCloseDialog: () => set(() => ({ isOpen: false, dialogType: null })),
}));