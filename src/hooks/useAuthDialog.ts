import { useDialogStore } from "@/store/dialog";

const useAuthDialog = () => {
	const { setOpenDialog, setCloseDialog } = useDialogStore();

	const handleSwitchAuth = (switchTo: "signin" | "signup") => {
		setCloseDialog();

		setOpenDialog(switchTo);
	};

	return {
		handleSwitchAuth,
	};
};

export default useAuthDialog;
