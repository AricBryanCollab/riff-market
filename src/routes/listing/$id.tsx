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
import { listingReviewsQueryOpt } from "@/hooks/use-listing-reviews";
import { optionalAuthUserQueryOpt } from "@/lib/tanstack-query/auth-user-query";
import { cn } from "@/lib/utils";
import { formatMoneyAmountMinor } from "@/utils/format-money";

const eyebrowClassName =
	"text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground";

const revealClassName =
	"animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both motion-reduce:animate-none";

export const Route = createFileRoute("/listing/$id")({
	beforeLoad: async ({ context, params }) => {
		const user = await context.queryClient
			.ensureQueryData(optionalAuthUserQueryOpt)
			.catch(() => null);

		await Promise.all([
			context.queryClient
				.ensureQueryData(listingByIdQueryOpt(params.id, user?.id ?? "public"))
				.catch(() => undefined),
			context.queryClient
				.ensureQueryData(listingReviewsQueryOpt(params.id))
				.catch(() => undefined),
		]);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/listing/$id" });
	const navigate = useNavigate();
	const { data: user, isPending: isAuthPending } = useAuthUser();
	const viewerKey = user?.id ?? "public";

	const {
		data: listing,
		isPending,
		isError,
	} = useQuery({
		...listingByIdQueryOpt(id, viewerKey),
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
				<p className="text-lg text-muted-foreground">Listing not found</p>
				<button
					type="button"
					onClick={() => navigate({ to: "/shop" })}
					className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
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
				<div className="flex items-center gap-3 rounded-2xl bg-card text-card-foreground p-4">
					<button
						type="button"
						onClick={() => navigate({ to: "/shop" })}
						className="size-10 flex justify-center cursor-pointer items-center rounded-full bg-muted-foreground hover:bg-foreground hover:text-background transition-colors"
					>
						<ArrowLeft size={28} />
					</button>
					<p className="font-medium">Back to Shop</p>
				</div>

				{/* LISTING MAIN SECTION */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* LISTING IMAGES */}
					<div className="flex flex-col gap-4 rounded-2xl bg-card text-card-foreground p-6">
						<div className="h-96 w-full rounded-xl bg-muted overflow-hidden">
							<img
								src={
									listing.images[selectedImage]?.url || listing.images[0]?.url
								}
								alt={listing.name}
								className="w-full h-full object-cover rounded-xl outline -outline-offset-1 outline-black/10 dark:outline-white/10"
							/>
						</div>
						{listing.images.length > 1 && (
							<div className="grid grid-cols-4 gap-3">
								{listing.images.slice(0, 4).map((img, idx) => (
									<button
										type="button"
										key={img.imageId}
										onClick={() => setSelectedImage(idx)}
										className={`h-20 w-full rounded-lg overflow-hidden transition-[opacity,box-shadow,scale] active:scale-[0.96] ${
											selectedImage === idx
												? "ring-2 ring-primary"
												: "opacity-70 hover:opacity-100"
										}`}
									>
										<img
											src={img.url}
											alt={`${listing.name} ${idx + 1}`}
											className="w-full h-full object-cover rounded-lg outline -outline-offset-1 outline-black/10 dark:outline-white/10"
										/>
									</button>
								))}
							</div>
						)}
					</div>

					<div className="rounded-2xl bg-card text-card-foreground p-6 md:p-8 space-y-6">
						{/* TITLE & BRAND */}
						<div className={cn(revealClassName, "space-y-3")}>
							<p className={eyebrowClassName}>
								{listing.brand}
								{listing.model && ` · ${listing.model}`}
							</p>
							<h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground text-balance">
								{listing.name}
							</h1>
							<Rating listingId={listing.id} />
						</div>

						{/* CATEGORY & STOCK */}
						<div
							className={cn(
								revealClassName,
								"flex flex-wrap items-center gap-2",
							)}
							style={{ animationDelay: "60ms" }}
						>
							<span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
								{getCategoryDisplay(listing.category).label}
							</span>
							<span className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-foreground ring-1 ring-border ring-inset tabular-nums">
								<span
									aria-hidden
									className={cn(
										"size-1.5 rounded-full",
										listing.stock > 0 ? "bg-emerald-500" : "bg-red-500",
									)}
								/>
								{listing.stock > 0
									? `${listing.stock} in stock`
									: "Out of stock"}
							</span>
						</div>

						{/* PRICE */}
						<div
							className={cn(
								revealClassName,
								"flex flex-wrap items-baseline gap-x-2 border-y py-5",
							)}
							style={{ animationDelay: "120ms" }}
						>
							<p className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
								{formatMoneyAmountMinor(
									listing.priceAmountMinor,
									listing.currencyCode,
								)}
							</p>
							<p className="text-sm text-muted-foreground">per unit</p>
						</div>

						{/* ACTIONS */}
						<div
							className={revealClassName}
							style={{ animationDelay: "180ms" }}
						>
							<ListingDetailsActions
								quantity={quantity}
								stock={listing.stock}
								isOrderable={listing.isOrderable}
								viewerCanEdit={listing.viewerCanEdit}
								viewerCanDelete={listing.viewerCanDelete}
								viewerCanApprove={listing.viewerCanApprove}
								viewerCanDecline={listing.viewerCanDecline}
								handleQuantityChange={handleQuantityChange}
							/>
						</div>

						{/* DESCRIPTION */}
						<div
							className={cn(revealClassName, "space-y-3 border-t pt-6")}
							style={{ animationDelay: "240ms" }}
						>
							<h3 className={eyebrowClassName}>Description</h3>
							<p className="text-foreground/80 leading-relaxed text-pretty">
								{listing.description}
							</p>
						</div>

						{/* SELLER INFO */}
						<div
							className={cn(
								revealClassName,
								"flex items-center gap-4 rounded-xl bg-muted/70 p-4 ring-1 ring-border ring-inset",
							)}
							style={{ animationDelay: "300ms" }}
						>
							<div
								aria-hidden
								className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold tracking-wide text-background"
							>
								{`${listing.seller.firstName.charAt(0)}${listing.seller.lastName.charAt(0)}`.toUpperCase()}
							</div>
							<div className="min-w-0">
								<p className={eyebrowClassName}>Sold by</p>
								<p className="truncate font-semibold text-foreground">
									{listing.seller.firstName} {listing.seller.lastName}
								</p>
								<a
									href={`mailto:${listing.seller.email}`}
									className="block truncate text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
								>
									{listing.seller.email}
								</a>
							</div>
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

				<ReviewSection listingId={listing.id} />
			</div>
		</SectionContainer>
	);
}
