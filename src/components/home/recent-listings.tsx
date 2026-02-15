import { EmptyRecentProducts } from "@/components/empty-states";
import { RecentProductsError } from "@/components/error-states";
import { RecentProductsLoading } from "@/components/loading-states";
import ProductCard from "@/components/product-card";

import useGetRecentProducts from "@/hooks/use-get-recent-products";

const RecentListings = () => {
	const {
		recentProducts,
		isLoadingRecentProducts,
		isErrorRecentProducts,
		refetchRecentProducts,
	} = useGetRecentProducts();

	if (isLoadingRecentProducts) {
		return <RecentProductsLoading />;
	}

	if (isErrorRecentProducts) {
		return <RecentProductsError refetch={refetchRecentProducts} />;
	}

	if (!recentProducts || recentProducts.length === 0) {
		return <EmptyRecentProducts />;
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{recentProducts.map((product) => (
				<ProductCard key={product.id} product={product} />
			))}
		</div>
	);
};

export default RecentListings;
