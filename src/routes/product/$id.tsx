import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import AnimatedLoader from "@/components/animatedloader";
import Button from "@/components/button";
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
			<div className="flex justify-center items-center">
				<AnimatedLoader text="Loading Product Details" />
			</div>
		);
	}

	if (!productList || !product) {
		return (
			<div className="flex flex-col justify-center items-center">
				<p className="text-lg text-muted-foreground">Product not found</p>
			</div>
		);
	}

	return (
		<SectionContainer>
			<div className="max-w-6xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
					{/* Product Images */}
					<div className="space-y-4">
						{product?.images.length > 0 ? (
							<>
								<img
									src={product?.images[0]}
									alt={product?.name}
									className="w-full h-96 object-cover rounded-lg"
								/>
								{product?.images.length > 1 && (
									<div className="grid grid-cols-4 gap-2">
										{product?.images.slice(1).map((img, idx) => (
											<img
												key={img}
												src={img}
												alt={`${product?.name} ${idx + 2}`}
												className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-75"
											/>
										))}
									</div>
								)}
							</>
						) : (
							<div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
								<p className="text-gray-500">No image available</p>
							</div>
						)}
					</div>

					{/* Product Details */}
					<div className="space-y-4">
						<div>
							<h1 className="text-3xl font-bold mb-2">{product?.name}</h1>
							<p className="text-gray-600">
								{product?.brand} - {product?.model}
							</p>
						</div>

						<div className="flex items-center gap-2">
							<span className="px-3 py-1 bg-muted text-primary rounded-full text-sm">
								{product?.category}
							</span>
						</div>

						<div className="border-t border-b py-4">
							<p className="text-4xl font-bold text-primary">
								${product?.price.toFixed(2)}
							</p>
							<p className="text-sm text- mt-1">
								{product?.stock > 0 ? (
									<span className="text-green-600">
										In Stock ({product?.stock} available)
									</span>
								) : (
									<span className="text-red-600">Out of Stock</span>
								)}
							</p>
						</div>

						<div>
							<h2 className="font-semibold text-lg mb-2">Description</h2>
							<p className="text-gray-700 whitespace-pre-line">
								{product?.description}
							</p>
						</div>

						<div className="border rounded-lg p-4 bg-gray-50">
							<h3 className="font-semibold mb-2">Seller Information</h3>
							<p className="text-sm text-gray-700">
								<span className="font-medium">Name:</span>{" "}
								{product?.seller.firstName || "N/A"}
							</p>
						</div>

						<div className="flex gap-3 pt-4">
							<Button
								type="button"
								variant="primary"
								action={() => navigate({ to: `/product/edit/${id}` })}
							>
								Edit Product
							</Button>
							<Button
								variant="secondary"
								action={() => navigate({ to: "/shop" })}
							>
								Back to Shop
							</Button>
						</div>
					</div>
				</div>
			</div>
		</SectionContainer>
	);
}
