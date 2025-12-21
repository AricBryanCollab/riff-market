import Button from "@/components/button";

const UserMenu = () => {
	return (
		<div className="flex items-center gap-3">
			<Button variant="outline">Login</Button>
			<Button variant="primary">Get Started</Button>
		</div>
	);
};

export default UserMenu;
