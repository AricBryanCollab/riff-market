import { createFileRoute } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import { ProductErrorState } from "@/components/errorstates";
import { ProductLoadingState } from "@/components/loadingstates";
import { ShopPageHeader } from "@/components/pageheaders";
import ProductCard from "@/components/productcard";
import ProductFilterBadges from "@/components/productfilterbadges";
import SectionContainer from "@/components/sectioncontainer";

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
		handleSearchChange,
		handleCategoryChange,
		handleShowPending,
		handleShowAll,
		refetch,
	} = useProductFilters();

	if (isPending) {
		return <ProductLoadingState />;
	}

	if (isError || !productList) {
		return <ProductErrorState refetch={refetch} />;
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

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{filteredProducts.length > 0 ? (
					filteredProducts.map((product) => (
						<ProductCard key={product.id} product={product} />
					))
				) : (
					<div className="col-span-full flex justify-center items-center gap-4 text-center py-8 text-muted-foreground">
						<ListMusic size={28} />
						<p>No products match your search here</p>
					</div>
				)}
			</div>

			<div className="flex justify-center py-6">
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
						disabled
					>
						Previous
					</button>
					<span className="px-4 py-2 text-sm text-muted-foreground">
						Page 1 of 1
					</span>
					<button
						type="button"
						className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
						disabled
					>
						Next
					</button>
				</div>
			</div>
		</SectionContainer>
	);
}
