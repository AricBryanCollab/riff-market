import {
	createFileRoute,
	redirect,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { Camera } from "lucide-react";
import Counter from "@/components/counter";
import { ListingDetailErrorState } from "@/components/error-states";
import { FormField } from "@/components/form-field";
import { FormTextArea } from "@/components/form-text-area";
import ImageUploader from "@/components/image-uploader";
import { ListingLoadingState } from "@/components/loading-states";
import { NumberField } from "@/components/number-field";
import { SearchableSelect } from "@/components/searchable-select";
import SectionContainer from "@/components/section-container";
import { LoadingButton } from "@/components/ui/loading-button";
import { Body, BodySmall, H4 } from "@/components/ui/typography";
import {
	listingCategoryOptions,
	listingConditionOptions,
} from "@/constants/select-options";
import { listingByIdQueryOpt } from "@/hooks/use-get-listings";
import useUpdateListing from "@/hooks/use-update-listing";
import type { ImageFile } from "@/hooks/use-upload-image";
import type { ListingCategory, ListingCondition } from "@/types/enum";
import { requireRole } from "@/utils/require-role";

export const Route = createFileRoute("/listing/edit/$id")({
	beforeLoad: async ({ context, params }) => {
		const user = await requireRole(context.queryClient, ["ADMIN", "SELLER"]);
		const listing = await context.queryClient
			.ensureQueryData(listingByIdQueryOpt(params.id, user.id))
			.catch(() => undefined);

		if (listing && !listing.viewerCanEdit) {
			throw redirect({ to: "/listing/$id", params: { id: params.id } });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/listing/edit/$id" });
	const navigate = useNavigate();

	const {
		listing,
		listingDraft,
		images,
		isListingLoading,
		isListingUpdateLoading,
		isListingError,
		onChange,
		onSelectChange,
		onQuantityChange,
		onImagesChange,
		handleSubmit,
		refetchListingDetails,
	} = useUpdateListing(id);

	if (isListingLoading) {
		return <ListingLoadingState />;
	}

	if (!listing || !listingDraft || isListingError) {
		return <ListingDetailErrorState refetch={refetchListingDetails} />;
	}

	return (
		<SectionContainer>
			<div className="my-4 max-w-6xl flex flex-col gap-3">
				<H4 className="text-balance">Edit {listing.name}</H4>
				<Body className="text-pretty text-muted-foreground">
					Saving sends this listing back to admin review.
				</Body>
			</div>

			<form onSubmit={handleSubmit}>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					<FormField
						id="name"
						label="Listing Name"
						onChange={onChange}
						value={listingDraft.name || ""}
					/>

					<FormField
						id="brand"
						label="Listing Brand"
						placeholder="eg. Fender, Gibson, Yamaha, Taylor"
						onChange={onChange}
						value={listingDraft.brand || ""}
					/>

					<FormField
						id="model"
						label="Model Specification"
						placeholder="eg. American Standard, Jimi Hendrix Special Edition"
						onChange={onChange}
						value={listingDraft.model || ""}
					/>

					<FormTextArea
						id="description"
						label="Listing Description"
						value={listingDraft.description || ""}
						onChange={onChange}
						placeholder="Please provide a description for the listing. This gives the customer insights about the instrument, gear, or accessory you want to sell."
						maxLength={200}
						showCounter
						rows={5}
					/>

					<div className="lg:col-span-1 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
						<SearchableSelect
							options={listingCategoryOptions.map((p) => ({
								label: p.label,
								value: p.value,
							}))}
							value={listingDraft.category || "OTHERS"}
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

					<div className="lg:col-span-1 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
						<Counter
							inputId="stock"
							label="Stock Quantity"
							value={listingDraft.stock || 0}
							onChange={onQuantityChange}
							min={0}
							max={10}
							showInput={true}
						/>

						<NumberField
							id="price"
							label="Listing Price Per Unit (TWD)"
							value={listingDraft.price || 0}
							onChange={onChange}
							min={0}
							step={1}
						/>
					</div>
				</div>

				<div className="mt-6 ">
					<ImageUploader<ImageFile>
						inputId="images"
						label="Listing Photos"
						images={images}
						onChange={onImagesChange}
						maxImages={5}
						icon={Camera}
					/>
					<BodySmall className="text-pretty text-muted-foreground">
						Photos you remove are deleted when you save.
					</BodySmall>
				</div>

				<div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start md:justify-end">
					<LoadingButton
						disabled={isListingUpdateLoading}
						variant="outline"
						type="button"
						onClick={() => navigate({ to: "/listing/$id", params: { id } })}
					>
						Go Back
					</LoadingButton>
					<LoadingButton loading={isListingUpdateLoading} type="submit">
						Update My Listing
					</LoadingButton>
				</div>
			</form>
		</SectionContainer>
	);
}
