import { FormField } from "@/components/form-field";
import { LoadingButton } from "@/components/ui/loading-button";

const UpdateProfileForm = () => {
	return (
		<form>
			<div className="flex flex-col w-full gap-4">
				<FormField
					id="firstName"
					label="First Name"
					type="text"
					value=""
					onChange={() => {}}
				/>

				<FormField
					id="lastName"
					label="Last Name"
					type="text"
					value=""
					onChange={() => {}}
				/>

				<FormField
					id="address"
					label="Address"
					type="text"
					value=""
					onChange={() => {}}
				/>

				<FormField
					id="phone"
					label="Phone Number"
					type="text"
					value=""
					onChange={() => {}}
				/>
				<div className="mb-6 flex justify-end items-center gap-3">
					<LoadingButton variant="outline">Cancel</LoadingButton>
					<LoadingButton type="submit" variant="default">
						Save
					</LoadingButton>
				</div>
			</div>
		</form>
	);
};

export default UpdateProfileForm;
