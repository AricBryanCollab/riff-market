import { FormField } from "@/components/form-field";
import { LoadingButton } from "@/components/ui/loading-button";

import useUpdateUser from "@/hooks/useUpdateUser";

const UpdateProfileForm = () => {
	const {
		userData,
		loadingUpdateUser,
		onChange,
		handleCloseDialog,
		handleSubmit,
	} = useUpdateUser();

	return (
		<form onSubmit={handleSubmit}>
			<div className="flex flex-col w-full gap-4">
				<FormField
					id="firstName"
					label="First Name"
					type="text"
					value={userData?.firstName || ""}
					onChange={onChange}
				/>

				<FormField
					id="lastName"
					label="Last Name"
					type="text"
					value={userData?.lastName || ""}
					onChange={onChange}
				/>

				<FormField
					id="address"
					label="Address"
					type="text"
					value={userData?.address || ""}
					onChange={onChange}
				/>

				<FormField
					id="phone"
					label="Phone Number"
					type="text"
					value={userData?.phone || ""}
					onChange={onChange}
				/>

				<div className="mb-6 flex justify-end items-center gap-3">
					<LoadingButton
						disabled={loadingUpdateUser}
						onClick={handleCloseDialog}
						variant="outline"
					>
						Cancel
					</LoadingButton>
					<LoadingButton
						loading={loadingUpdateUser}
						type="submit"
						variant="default"
					>
						Save
					</LoadingButton>
				</div>
			</div>
		</form>
	);
};

export default UpdateProfileForm;
