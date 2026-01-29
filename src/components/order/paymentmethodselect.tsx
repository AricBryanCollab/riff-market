import { CreditCard } from "lucide-react";
import { SearchableSelect } from "@/components/searchable-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { paymentMethodOptions } from "@/constants/selectOptions";

interface PaymentMethodSelectProps {
	value: string;
	onValueChange: (value: string) => void;
}

const PaymentMethodSelect = ({
	value,
	onValueChange,
}: PaymentMethodSelectProps) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CreditCard className="w-5 h-5" />
					Payment Method
				</CardTitle>
			</CardHeader>
			<CardContent>
				<SearchableSelect
					options={paymentMethodOptions.map((p) => ({
						label: p.label,
						value: p.value,
					}))}
					value={value}
					onValueChange={onValueChange}
					label="Select Payment Method"
				/>
			</CardContent>
		</Card>
	);
};

export default PaymentMethodSelect;
