import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FormTextArea } from "@/components/form-textarea";
import { SearchableSelect } from "@/components/searchable-select";
import SectionContainer from "@/components/sectioncontainer";
import { H2 } from "@/components/typography";
import { LoadingButton } from "@/components/ui/loading-button";
import { paymentMethodOptions } from "@/constants/selectOptions";
export const Route = createFileRoute("/checkout")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	return (
		<SectionContainer>
			<div className="my-6 relative flex items-center justify-center">
				<div className="absolute left-0 flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate({ to: "/cart" })}
						className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-muted-foreground transition-colors hover:bg-foreground hover:text-white"
					>
						<ArrowLeft size={28} />
					</button>
					<p className="hidden md:block">Back to Shop</p>
				</div>
				<H2>Order Checkout</H2>
			</div>
			<form>
				<div className="">
					<H2>Order List</H2>
				</div>

				<FormTextArea
					id="shippingAddress"
					label="Shipping Address"
					value=""
					onChange={() => {}}
					placeholder="Provide the complete where do you want your order to be delivered"
				/>

				<SearchableSelect
					options={paymentMethodOptions.map((p) => ({
						label: p.label,
						value: p.value,
					}))}
					value=""
					onValueChange={() => {}}
					label="Order Payment Method"
				/>

				<div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start md:justify-end">
					<LoadingButton
						loading={false}
						variant="outline"
						type="button"
						onClick={() => {}}
					>
						Clear
					</LoadingButton>
					<LoadingButton loading={false} type="submit">
						Place Order
					</LoadingButton>
				</div>
			</form>
		</SectionContainer>
	);
}
