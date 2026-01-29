import { MapPin } from "lucide-react";
import { FormTextArea } from "@/components/form-textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";

interface ShippingAddressFieldProps {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	clearAddress: () => void;
	setDefaultAddress: () => void;
	disabled?: boolean;
	isLoading?: boolean;
}

const ShippingAddressField = ({
	value,
	disabled = false,
	isLoading = false,
	onChange,
	clearAddress,
	setDefaultAddress,
}: ShippingAddressFieldProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MapPin className="w-5 h-5" />
					Shipping Address
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<FormTextArea
					id="shippingAddress"
					label="Delivery Address"
					value={value}
					onChange={onChange}
					placeholder="Enter your complete delivery address including street, city, state, and postal code"
					rows={4}
				/>
				<div className="flex items-center justify-end w-full gap-3">
					<LoadingButton
						loading={isLoading}
						variant="outline"
						type="button"
						onClick={clearAddress}
					>
						Clear
					</LoadingButton>
					<LoadingButton
						disabled={disabled}
						variant="secondary"
						type="button"
						onClick={setDefaultAddress}
					>
						Set Default Address
					</LoadingButton>
				</div>
			</CardContent>
		</Card>
	);
};

export default ShippingAddressField;
