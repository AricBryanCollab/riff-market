import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import Counter from "@/components/counter";
import { FormField } from "@/components/form-field";
import { FormTextArea } from "@/components/form-text-area";
import ImageUploader from "@/components/image-uploader";
import { NumberField } from "@/components/number-field";
import { SearchableSelect } from "@/components/searchable-select";
import SectionContainer from "@/components/section-container";
import { LoadingButton } from "@/components/ui/loading-button";
import { Body, H4 } from "@/components/ui/typography";
import {
	listingCategoryOptions,
	listingConditionOptions,
} from "@/constants/select-options";
import useCreateListing from "@/hooks/use-create-listing";
import type { ListingCategory, ListingCondition } from "@/types/enum";
import { requireRole } from "@/utils/require-role";

export const Route = createFileRoute("/listing/new")({
	beforeLoad: async ({ context }) =>
		requireRole(context.queryClient, ["SELLER", "ADMIN"]),
	component: RouteComponent,
});

function RouteComponent() {
	const {
		listingDraft,
		images,
		isListingCreating,
		onChange,
		onSelectChange,
		onQuantityChange,
		onImagesChange,
		clearCreateListingForm,
		handleSubmit,
	} = useCreateListing();

	return (
		<SectionContainer>
			<div className="my-4 max-w-6xl flex flex-col gap-3">
				<H4>Add A New Listing To Sell</H4>
				<Body>
					Fill up the form to add the listing. RiffMarket App admin would check
					and approve the listing if it is valid to be sold in our community
					marketplace.
				</Body>
			</div>
			<form onSubmit={handleSubmit}>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					<FormField
						id="name"
						label="Listing Name"
						onChange={onChange}
						value={listingDraft.name}
					/>

					<FormField
						id="brand"
						label="Listing Brand"
						placeholder="eg. Fender, Gibson, Yamaha, Taylor"
						onChange={onChange}
						value={listingDraft.brand}
					/>

					<FormField
						id="model"
						label="Model Specification"
						placeholder="eg. American Standard, Jimi Hendrix Special Edition"
						onChange={onChange}
						value={listingDraft.model}
					/>

					<FormTextArea
						id="description"
						label="Listing Description"
						value={listingDraft.description}
						onChange={onChange}
						placeholder="Please provide a description for the listing. This gives the customer insights about the instrument, gear, or accessory you want to sell."
						maxLength={200}
						showCounter
						rows={5}
					/>

					<div className="lg:col-span-1">
						<SearchableSelect
							options={listingCategoryOptions.map((p) => ({
								label: p.label,
								value: p.value,
							}))}
							value={listingDraft.category}
							onValueChange={(value: string) =>
								onSelectChange("category", value as ListingCategory)
							}
							label="Listing Classification"
						/>

						<SearchableSelect
							options={listingConditionOptions.map((p) => ({
								label: p.label,
								value: p.value,
							}))}
							value={listingDraft.condition}
							onValueChange={(value: string) =>
								onSelectChange("condition", value as ListingCondition)
							}
							label="Listing Condition"
						/>
					</div>

					<div className="lg:col-span-1">
						<Counter
							inputId="stock"
							label="Stock Quantity"
							value={listingDraft.stock}
							onChange={onQuantityChange}
							min={0}
							max={10}
							showInput={true}
						/>

						<NumberField
							id="price"
							label="Listing Price Per Unit (TWD)"
							value={listingDraft.price}
							onChange={onChange}
							min={0}
							step={1}
						/>
					</div>
				</div>

				<div className="mt-6 ">
					<ImageUploader
						inputId="images"
						label="Listing Photos"
						images={images}
						onChange={onImagesChange}
						maxImages={5}
						icon={Camera}
					/>
				</div>

				<div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start md:justify-end">
					<LoadingButton
						disabled={isListingCreating}
						variant="outline"
						type="button"
						onClick={clearCreateListingForm}
					>
						Clear
					</LoadingButton>
					<LoadingButton loading={isListingCreating} type="submit">
						Add Listing
					</LoadingButton>
				</div>
			</form>
		</SectionContainer>
	);
}
