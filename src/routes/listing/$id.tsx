import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { ArrowLeft, Package } from "lucide-react";
import { useState } from "react";
import { AppDialog } from "@/components/app-dialog";
import DeleteListingConfirm from "@/components/delete-listing-confirm";
import { ListingDetailsActions } from "@/components/listing-actions";
import { ListingDetailsLoadingState } from "@/components/loading-states";
import Rating from "@/components/rating";
import ReviewSection from "@/components/review-section";
import SectionContainer from "@/components/section-container";
import { listingCategoryOptions } from "@/constants/select-options";
import { useAuthUser } from "@/hooks/use-auth-user";
import { listingByIdQueryOpt } from "@/hooks/use-get-listings";
import { optionalAuthUserQueryOpt } from "@/lib/tanstack-query/auth-user-query";
import { listingDetailViewerScopeForRole } from "@/lib/tanstack-query/query-keys";
import { formatMoneyAmountMinor } from "@/utils/format-money";

export const Route = createFileRoute("/listing/$id")({
	beforeLoad: async ({ context, params }) => {
		const user = await context.queryClient
			.ensureQueryData(optionalAuthUserQueryOpt)
			.catch(() => null);

		await context.queryClient
			.ensureQueryData(
				listingByIdQueryOpt(
					params.id,
					listingDetailViewerScopeForRole(user?.role),
				),
			)
			.catch(() => undefined);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/listing/$id" });
	const navigate = useNavigate();
	const { data: user, isPending: isAuthPending } = useAuthUser();
	const viewerScope = listingDetailViewerScopeForRole(user?.role);

	const {
		data: listing,
		isPending,
		isError,
	} = useQuery({
		...listingByIdQueryOpt(id, viewerScope),
		enabled: !isAuthPending,
	});

	const getCategoryDisplay = (category: string) => {
		const option = listingCategoryOptions.find((opt) => opt.value === category);
		return option || { value: category, label: category, icon: Package };
	};

	const [quantity, setQuantity] = useState(1);
	const [selectedImage, setSelectedImage] = useState(0);

	if (isAuthPending || isPending) {
		return <ListingDetailsLoadingState />;
	}

	if (isError || !listing) {
		return (
			<div className="flex flex-col justify-center items-center min-h-screen">
				<p className="text-lg text-gray-500">Listing not found</p>
				<button
					type="button"
					onClick={() => navigate({ to: "/shop" })}
					className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
				>
					Back to Shop
				</button>
			</div>
		);
	}

	const handleQuantityChange = (value: number) => {
		setQuantity(value);
	};

	return (
		<SectionContainer>
			<div className="flex w-full flex-col gap-8">
				{/* BACK TO SHOP */}
				<div className="flex items-center gap-3 rounded-2xl bg-white p-4">
					<button
						type="button"
						onClick={() => navigate({ to: "/shop" })}
						className="size-10 flex justify-center cursor-pointer items-center rounded-full bg-muted-foreground hover:bg-foreground hover:text-white transition-colors"
					>
						<ArrowLeft size={28} />
					</button>
					<p className="font-medium">Back to Shop</p>
				</div>

				{/* LISTING MAIN SECTION */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* LISTING IMAGES */}
					<div className="rounded-2xl bg-white p-6">
						<div className="h-96 w-full rounded-xl bg-slate-200 mb-4 overflow-hidden">
							<img
								src={
									listing.images[selectedImage]?.url || listing.images[0]?.url
								}
								alt={listing.name}
								className="w-full h-full object-cover"
							/>
						</div>
						<div className="grid grid-cols-4 gap-3">
							{listing.images.slice(0, 4).map((img, idx) => (
								<button
									type="button"
									key={img.imageId}
									onClick={() => setSelectedImage(idx)}
									className={`h-20 w-full rounded-lg overflow-hidden transition-all ${
										selectedImage === idx
											? "ring-2 ring-primary"
											: "opacity-70 hover:opacity-100"
									}`}
								>
									<img
										src={img.url}
										alt={`${listing.name} ${idx + 1}`}
										className="w-full h-full object-cover"
									/>
								</button>
							))}
						</div>
					</div>

					<div className="rounded-2xl bg-white p-6 space-y-6">
						{/* TITLE & BRAND */}
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<h1 className="text-3xl font-bold text-gray-900 mb-2">
									{listing.name}
								</h1>
								<p className="text-lg text-gray-600">
									{listing.brand} {listing.model && `• ${listing.model}`}
								</p>
							</div>
						</div>

						<Rating />

						{/* CATEGORY & STOCK */}
						<div className="flex items-center gap-3">
							{(() => {
								const categoryDisplay = getCategoryDisplay(listing.category);
								return (
									<span className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
										{categoryDisplay.label}
									</span>
								);
							})()}
							<span
								className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
									listing.stock > 0
										? "bg-green-100 text-green-700"
										: "bg-red-100 text-red-700"
								}`}
							>
								<Package size={16} />
								{listing.stock > 0
									? `${listing.stock} in stock`
									: "Out of stock"}
							</span>
						</div>

						{/* PRICE */}
						<div className="rounded-xl bg-slate-50 p-6 border-2 border-slate-200">
							<p className="text-4xl font-bold text-gray-900">
								{formatMoneyAmountMinor(
									listing.priceAmountMinor,
									listing.currencyCode,
								)}
							</p>
							<p className="text-sm text-gray-500 mt-1">Price per unit</p>
						</div>

						{/* ACTIONS */}
						<ListingDetailsActions
							quantity={quantity}
							stock={listing.stock}
							viewerCanEdit={listing.viewerCanEdit}
							viewerCanDelete={listing.viewerCanDelete}
							viewerCanApprove={listing.viewerCanApprove}
							viewerCanDecline={listing.viewerCanDecline}
							handleQuantityChange={handleQuantityChange}
						/>

						{/* DESCRIPTION */}
						<div className="pt-6 border-t">
							<h3 className="text-xl font-semibold text-gray-900 mb-3">
								Description
							</h3>
							<p className="text-gray-600 leading-relaxed">
								{listing.description}
							</p>
						</div>

						{/* SELLER INFO */}
						<div className="rounded-xl bg-blue-50 p-5 border border-blue-200">
							<h4 className="font-semibold text-blue-900 mb-1">
								Sold by {listing.seller.firstName} {listing.seller.lastName}
							</h4>
							<p className="text-sm text-blue-700">{listing.seller.email}</p>
						</div>
					</div>

					<AppDialog type="deleteListing" title="Delete Listing Confirmation">
						<DeleteListingConfirm
							id={id}
							name={listing.name}
							model={listing.model}
						/>
					</AppDialog>
				</div>

				<ReviewSection />
			</div>
		</SectionContainer>
	);
}
