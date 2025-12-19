import { create } from "zustand";

export type ToastStatus = "success" | "error" | "default";

interface ToastState {
  isVisible: boolean;
  message: string;
  status: ToastStatus;
}

interface ToastActions {
	showToast: (message: string, status?: ToastStatus) => void;
	hideToast: () => void;
}

type ToastStore = ToastState & ToastActions;

export const useToastStore = create<ToastStore>((set) => ({
  isVisible: false,
  message: "",
  status: "default",

  showToast: (message, status = "default") =>
    set({
      isVisible: true,
      message,
      status,
    }),

  hideToast: () =>
    set({
      isVisible: false,
      message: "",
      status: "default",
    }),
}));
