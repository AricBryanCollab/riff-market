import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import AnimatedLoader from "@/components/animatedloader";
import SectionContainer from "@/components/sectioncontainer";
import { productsQueryOpt } from "@/routes/shop/route";

export const Route = createFileRoute("/product/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/product/$id" });
	const { data: productList, isPending } = useQuery(productsQueryOpt);
	const navigate = useNavigate();

	const product = productList?.find((p) => p.id === id);

	if (isPending) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<AnimatedLoader text="Loading Product Details" />
			</div>
		);
	}

	if (!productList || !product) {
		return (
			<div className="flex flex-col justify-center items-center min-h-screen">
				<p className="text-lg text-gray-500">Product not found</p>
			</div>
		);
	}

	return (
		<SectionContainer>
			<div className="flex w-full flex-col gap-8">
				{/* BACK TO SHOP */}
				<div className="flex just items-center gap-3 rounded-2xl bg-white p-4">
					<button
						type="button"
						onClick={() => navigate({ from: "/shop" })}
						className="size-10 flex justify-center cursor-pointer items-center rounded-full bg-muted-foreground hover:bg-foreground hover:text-white"
					>
						<ArrowLeft size={28} />
					</button>
					<p>Back to Shop</p>
				</div>

				{/* PRODUCT MAIN SECTION */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* PRODUCT IMAGES */}
					<div className="rounded-2xl bg-white p-6">
						<div className="h-96 w-full rounded-xl bg-slate-200 mb-4" />
						<div className="grid grid-cols-4 gap-3">
							<div className="h-20 w-full rounded-lg bg-slate-300" />
							<div className="h-20 w-full rounded-lg bg-slate-200" />
							<div className="h-20 w-full rounded-lg bg-slate-200" />
							<div className="h-20 w-full rounded-lg bg-slate-200" />
						</div>
					</div>

					{/* PRODUCT INFO */}
					<div className="rounded-2xl bg-white p-6 space-y-6">
						{/* TITLE & BRAND */}
						<div>
							<div className="h-8 w-3/4 rounded bg-slate-300 mb-3" />
							<div className="h-4 w-1/2 rounded bg-slate-200" />
						</div>

						{/* RATING */}
						<div className="flex items-center gap-3 pb-4 border-b">
							<div className="flex gap-1">
								<div className="h-5 w-5 rounded bg-yellow-300" />
								<div className="h-5 w-5 rounded bg-yellow-300" />
								<div className="h-5 w-5 rounded bg-yellow-300" />
								<div className="h-5 w-5 rounded bg-yellow-300" />
								<div className="h-5 w-5 rounded bg-slate-200" />
							</div>
							<div className="h-4 w-20 rounded bg-slate-200" />
						</div>

						{/* CATEGORY & STOCK */}
						<div className="flex items-center gap-3">
							<div className="h-8 w-24 rounded-full bg-blue-100" />
							<div className="h-8 w-28 rounded-full bg-green-100" />
						</div>

						{/* PRICE */}
						<div className="rounded-xl bg-slate-50 p-6 border-2 border-slate-200">
							<div className="h-10 w-40 rounded bg-slate-300 mb-2" />
							<div className="h-3 w-48 rounded bg-slate-200" />
						</div>

						{/* QUANTITY SELECTOR */}
						<div className="flex items-center gap-4">
							<div className="h-4 w-20 rounded bg-slate-300" />
							<div className="flex items-center border-2 border-slate-300 rounded-lg">
								<div className="h-10 w-12 bg-slate-100" />
								<div className="h-10 w-16 border-x-2 border-slate-300 bg-white" />
								<div className="h-10 w-12 bg-slate-100" />
							</div>
						</div>

						{/* ACTION BUTTONS */}
						<div className="flex gap-4 pt-4">
							<div className="flex-1 h-12 rounded-lg bg-blue-500" />
							<div className="h-12 w-24 rounded-lg bg-slate-200" />
						</div>

						{/* DESCRIPTION */}
						<div className="pt-6 border-t">
							<div className="h-6 w-32 rounded bg-slate-300 mb-3" />
							<div className="space-y-2">
								<div className="h-4 w-full rounded bg-slate-200" />
								<div className="h-4 w-full rounded bg-slate-200" />
								<div className="h-4 w-3/4 rounded bg-slate-200" />
							</div>
						</div>

						{/* SELLER INFO */}
						<div className="rounded-xl bg-blue-50 p-5 border border-blue-200">
							<div className="h-5 w-40 rounded bg-blue-200 mb-2" />
							<div className="h-4 w-48 rounded bg-blue-100" />
						</div>
					</div>
				</div>

				{/* REVIEWS SECTION */}
				<div className="rounded-2xl bg-white p-6">
					<div className="h-8 w-56 rounded bg-slate-300 mb-8" />

					{/* REVIEW SUMMARY */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
						<div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl">
							<div className="h-16 w-24 rounded bg-slate-300 mb-3" />
							<div className="flex gap-1 mb-2">
								<div className="h-6 w-6 rounded bg-yellow-300" />
								<div className="h-6 w-6 rounded bg-yellow-300" />
								<div className="h-6 w-6 rounded bg-yellow-300" />
								<div className="h-6 w-6 rounded bg-yellow-300" />
								<div className="h-6 w-6 rounded bg-slate-200" />
							</div>
							<div className="h-4 w-24 rounded bg-slate-200" />
						</div>

						<div className="col-span-2 space-y-3">
							{[1, 2, 3, 4, 5].map((i) => (
								<div key={i} className="flex items-center gap-3">
									<div className="h-4 w-8 rounded bg-slate-300" />
									<div className="flex-1 h-3 bg-slate-200 rounded-full" />
									<div className="h-4 w-12 rounded bg-slate-200" />
								</div>
							))}
						</div>
					</div>

					{/* INDIVIDUAL REVIEWS */}
					<div className="space-y-6">
						{[1, 2, 3].map((i) => (
							<div key={i} className="border rounded-xl p-6 bg-slate-50">
								<div className="flex items-start justify-between mb-4">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<div className="flex gap-1">
												<div className="h-4 w-4 rounded bg-yellow-300" />
												<div className="h-4 w-4 rounded bg-yellow-300" />
												<div className="h-4 w-4 rounded bg-yellow-300" />
												<div className="h-4 w-4 rounded bg-yellow-300" />
												<div className="h-4 w-4 rounded bg-slate-200" />
											</div>
											<div className="h-4 w-24 rounded bg-slate-300" />
										</div>
										<div className="h-3 w-40 rounded bg-slate-200" />
									</div>
								</div>
								<div className="space-y-2">
									<div className="h-4 w-full rounded bg-slate-200" />
									<div className="h-4 w-full rounded bg-slate-200" />
									<div className="h-4 w-2/3 rounded bg-slate-200" />
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</SectionContainer>
	);
}
