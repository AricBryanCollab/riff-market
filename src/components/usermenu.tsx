import Button from "@/components/button";
import { useDialogStore } from "@/store/dialog";

const UserMenu = () => {
	const { setOpenDialog } = useDialogStore();

	return (
		<div className="flex items-center gap-3">
			<Button action={() => setOpenDialog("signin")} variant="outline">
				Login
			</Button>
			<Button action={() => setOpenDialog("signup")} variant="primary">
				Get Started
			</Button>
		</div>
	);
};

export default UserMenu;
