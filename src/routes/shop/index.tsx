import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListMusic } from "lucide-react";
import { useState } from "react";
import AnimatedLoader from "@/components/animatedloader";
import Button from "@/components/button";
import ProductActions from "@/components/productactions";
import ProductCard from "@/components/productcard";
import SectionContainer from "@/components/sectioncontainer";
import { Body, H3 } from "@/components/typography";
import { productsQueryOpt } from "@/routes/shop/route";

export const Route = createFileRoute("/shop/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [searchTerm, setSearchTerm] = useState("");
	const {
		data: productList,
		isPending,
		isError,
		refetch,
	} = useQuery(productsQueryOpt);

	if (isError) {
		return (
			<div className="flex flex-col justify-center items-center w-full min-h-screen gap-4">
				<p className="text-destructive text-lg my-4">
					Error gathering the products
				</p>
				<Button variant="primary" action={() => refetch()}>
					Try Again
				</Button>
			</div>
		);
	}

	if (isPending && !productList) {
		return (
			<div className="flex flex-col items-center py-12">
				<AnimatedLoader text="Gathering available instruments" />
			</div>
		);
	}

	if (!productList || productList.length === 0) {
		return (
			<div className="col-span-full text-center py-12">
				<p className="text-muted-foreground text-lg">No products available</p>
			</div>
		);
	}

	const filteredProducts = productList.filter((product) => {
		const query = searchTerm.toLowerCase();
		return (
			product.name.toLowerCase().includes(query) ||
			product.brand.toLowerCase().includes(query) ||
			product.model.toLowerCase().includes(query)
		);
	});

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	return (
		<SectionContainer>
			<div className="flex flex-col gap-6 rounded-xl bg-white p-4 md:flex-row md:items-center md:justify-between">
				<div>
					<H3 className="tracking-wider">Browse Music Tools</H3>
					<Body className="mt-1">
						Discover guitars, pedals, keyboards, and accessories in this
						community-based marketplace
					</Body>
				</div>

				<div className="flex flex-col md:flex-row items-center gap-2">
					<ProductActions
						searchTerm={searchTerm}
						handleSearchTerm={handleSearchChange}
					/>
				</div>
			</div>

			<div className="flex flex-wrap gap-4 my-4">
				<div className="px-4 py-1 rounded-full border shadow-md">
					<p>Guitars</p>
				</div>
				<div className="px-4 py-1 rounded-full border shadow-md">
					<p>Pedals</p>
				</div>
				<div className="px-4 py-1 rounded-full border shadow-md">
					<p>Accessories</p>
				</div>
				<div className="px-4 py-1 rounded-full border shadow-md">
					<p>Keyboard</p>
				</div>
			</div>

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
				<div className="h-10 w-40 rounded-full bg-slate-300" />
			</div>
		</SectionContainer>
	);
}
