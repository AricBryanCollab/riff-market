import { createFileRoute } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import { ProductErrorState } from "@/components/errorstates";
import { ProductLoadingState } from "@/components/loadingstates";
import { ShopPageHeader } from "@/components/pageheaders";
import ProductCard from "@/components/productcard";
import ProductFilterBadges from "@/components/productfilterbadges";
import SectionContainer from "@/components/sectioncontainer";
import { Button } from "@/components/ui/button";
import { H3 } from "@/components/ui/typography";
import useProductFilters from "@/hooks/useProductFilters";

export const Route = createFileRoute("/shop/")({
	component: RouteComponent,
});

function RouteComponent() {
	const {
		searchTerm,
		selectedCategory,
		showPending,
		filteredProducts,
		productList,
		isPending,
		isError,
		totalPages,
		page,
		isFirstPage,
		isLastPage,
		nextPage,
		previousPage,
		handleSearchChange,
		handleCategoryChange,
		handleShowPending,
		handleShowAll,
		refetchProductList,
	} = useProductFilters();

	if (isPending) {
		return <ProductLoadingState />;
	}

	if (isError || !productList) {
		return <ProductErrorState refetch={refetchProductList} />;
	}

	return (
		<SectionContainer>
			<ShopPageHeader
				searchTerm={searchTerm}
				onSearchChange={handleSearchChange}
			/>

			<ProductFilterBadges
				showPending={showPending}
				selectedCategory={selectedCategory}
				onShowAll={handleShowAll}
				onShowPending={handleShowPending}
				onCategorySelect={handleCategoryChange}
			/>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-h-200">
				{filteredProducts.length > 0 ? (
					filteredProducts.map((product) => (
						<ProductCard key={product.id} product={product} />
					))
				) : (
					<div className="col-span-full flex flex-col justify-center items-center gap-4 text-center py-8 text-muted-foreground">
						<ListMusic size={28} />
						<H3>No products match your search here</H3>
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
