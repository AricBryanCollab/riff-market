import { useQuery } from "@tanstack/react-query";
import { optionalAuthUserQueryOpt } from "@/lib/tanstack-query/auth-user-query";

export const useAuthUser = () => {
	const userQuery = useQuery(optionalAuthUserQueryOpt);

	return {
		...userQuery,
		data: userQuery.data ?? null,
	};
};
