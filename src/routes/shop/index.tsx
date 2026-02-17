import { createFileRoute } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import { ProductErrorState } from "@/components/error-states";
import { ProductLoadingState } from "@/components/loading-states";
import { ShopPageHeader } from "@/components/page-headers";
import ProductCard from "@/components/product-card";
import ProductFilterBadges from "@/components/product-filter-badges";
import SectionContainer from "@/components/section-container";
import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/typography";
import { useAuthUser } from "@/hooks/use-auth-user";
import useGetPendingProducts from "@/hooks/use-get-pending-products";
import {
	approvedProductsQueryOpt,
	productCountByStatusQueryOpt,
} from "@/hooks/use-get-products";
import useProductFilters from "@/hooks/use-product-filters";
import useShopPagination from "@/hooks/use-shop-pagination";
import { usePendingProductStore } from "@/store/pending-product";
import type {
	GetApprovedProductsFilterQuery,
	ShopSearch,
} from "@/types/product";
import { validateProductSearch } from "@/utils/validate-product-search";

const SHOP_PAGE_SIZE = 8;

const getApprovedFiltersFromSearch = (
	searchParams: ShopSearch,
): GetApprovedProductsFilterQuery => {
	const page = Math.max(0, searchParams.page ?? 0);

	return {
		limit: SHOP_PAGE_SIZE,
		offset: page * SHOP_PAGE_SIZE,
		category: searchParams.category,
		brand: searchParams.brand,
		condition: searchParams.condition,
		search: searchParams.search,
		priceMin: searchParams.priceMin,
		priceMax: searchParams.priceMax,
	};
};

export const Route = createFileRoute("/shop/")({
	beforeLoad: async ({ context, search }) => {
		const filters = getApprovedFiltersFromSearch(search);

		await Promise.all([
			context.queryClient
				.ensureQueryData(approvedProductsQueryOpt(filters))
				.catch(() => undefined),
			context.queryClient
				.ensureQueryData(productCountByStatusQueryOpt("approved"))
				.catch(() => undefined),
		]);
	},
	component: RouteComponent,
	validateSearch: validateProductSearch,
});

function RouteComponent() {
	const searchParams = Route.useSearch();
	const { showPending } = usePendingProductStore();
	const { data: user } = useAuthUser();
	const isAdmin = user?.role === "ADMIN";

	useProductFilters(searchParams);

	const {
		products,
		isLoading,
		isError,
		refetchProducts,
		page,
		totalPages,
		isFirstPage,
		isLastPage,
		previousPage,
		nextPage,
	} = useShopPagination();

	const {
		pendingProducts,
		isLoadingPendingProducts,
		isErrorPendingProducts,
		refetch: refetchPendingProducts,
	} = useGetPendingProducts({ isAdmin });

	const displayProducts = showPending ? pendingProducts : products;
	const displayIsLoading = showPending ? isLoadingPendingProducts : isLoading;
	const displayIsError = showPending ? isErrorPendingProducts : isError;
	const displayRefetch = showPending ? refetchPendingProducts : refetchProducts;

	return (
		<SectionContainer>
			<ShopPageHeader />

			<ProductFilterBadges />

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-200">
				{displayIsLoading ? (
					<ProductLoadingState />
				) : displayIsError || !displayProducts ? (
					<ProductErrorState refetch={displayRefetch} />
				) : displayProducts.length > 0 ? (
					displayProducts.map((product) => (
						<ProductCard key={product.id} product={product} />
					))
				) : (
					<div className="col-span-full flex flex-col justify-center items-center gap-4 text-center py-8 text-muted-foreground">
						<ListMusic size={40} />
						<H3>
							{showPending
								? "No pending products for approval"
								: "No products match your search here"}
						</H3>
					</div>
				)}
			</div>

			<div className="flex justify-center py-6">
				<div className="flex items-center gap-2">
					<Button
						onClick={previousPage}
						disabled={isFirstPage}
						className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
					>
						Previous
					</Button>
					<span className="px-4 py-2 text-sm text-muted-foreground">
						Page {page + 1} of {totalPages}
					</span>

					<Button
						onClick={nextPage}
						disabled={isLastPage}
						className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
					>
						Next
					</Button>
				</div>
			</div>
		</SectionContainer>
	);
}
