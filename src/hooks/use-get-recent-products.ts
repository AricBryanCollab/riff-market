import { useQuery } from "@tanstack/react-query";
import { getRecentProducts } from "@/lib/tanstack-query/product-queries";
import { queryKeys } from "@/lib/tanstack-query/query-keys";

const useGetRecentProducts = () => {
	const {
		data: recentProducts,
		isPending: isLoadingRecentProducts,
		isError: isErrorRecentProducts,
		refetch: refetchRecentProducts,
	} = useQuery({
		queryKey: queryKeys.products.recent,
		queryFn: getRecentProducts,
		staleTime: 1000 * 60 * 5,
	});

	return {
		recentProducts,
		isLoadingRecentProducts,
		isErrorRecentProducts,
		refetchRecentProducts,
	};
};

export default useGetRecentProducts;
