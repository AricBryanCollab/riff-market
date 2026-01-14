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
import { productCategoryOptions } from "@/constants/selectOptions";
import { pendingProductsQueryOpt, productsQueryOpt } from "@/routes/shop/route";

export const Route = createFileRoute("/shop/")({
	component: RouteComponent,
});

function RouteComponent() {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [showPending, setShowPending] = useState(false);

	const {
		data: productList,
		isPending,
		isError,
		refetch,
	} = useQuery(productsQueryOpt);

	const {
		data: pendingProductList,
		isPending: isPendingProduct,
		isError: isPendingProductError,
	} = useQuery({ ...pendingProductsQueryOpt, enabled: showPending });

	if (isError || isPendingProductError) {
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

	if ((isPending && !productList) || (isPendingProduct && showPending)) {
		return (
			<div className="flex flex-col items-center py-12">
				<AnimatedLoader text="Gathering available instruments" />
			</div>
		);
	}

	const productsToDisplay = showPending ? pendingProductList : productList;

	if (!productsToDisplay || productsToDisplay.length === 0) {
		return (
			<div className="col-span-full text-center py-12">
				<p className="text-muted-foreground text-lg">
					{showPending ? "No pending products" : "No products available"}
				</p>
			</div>
		);
	}

	const filteredProducts = productsToDisplay.filter((product) => {
		const query = searchTerm.toLowerCase();
		const matchesSearch =
			product.name.toLowerCase().includes(query) ||
			product.brand.toLowerCase().includes(query) ||
			product.model.toLowerCase().includes(query);

		const matchesCategory = selectedCategory
			? product.category === selectedCategory
			: true;

		return matchesSearch && matchesCategory;
	});

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);
	};

	const handleShowPending = () => {
		setShowPending(true);
		setSelectedCategory(null);
	};

	const handleShowAll = () => {
		setShowPending(false);
		setSelectedCategory(null);
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

			<div className="flex flex-wrap gap-3 my-6">
				{/* All Categories */}
				<button
					type="button"
					onClick={handleShowAll}
					className={`px-5 py-2 rounded-full border-2 font-medium transition-all ${
						!showPending && selectedCategory === null
							? "bg-blue-500 text-white border-blue-500 shadow-lg scale-105"
							: "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
					}`}
				>
					All
				</button>

				{/* Pending Products */}
				<button
					type="button"
					onClick={handleShowPending}
					className={`px-5 py-2 rounded-full border-2 font-medium transition-all ${
						showPending
							? "bg-orange-500 text-white border-orange-500 shadow-lg scale-105"
							: "bg-white text-gray-700 border-gray-300 hover:border-orange-300 hover:bg-orange-50 shadow-sm"
					}`}
				>
					Pending
				</button>

				{/* Category Filters */}
				{!showPending &&
					productCategoryOptions.map((category) => {
						const CategoryIcon = category.icon;
						const isSelected = selectedCategory === category.value;

						return (
							<button
								key={category.value}
								type="button"
								onClick={() => setSelectedCategory(category.value)}
								className={`px-5 py-2 rounded-full border-2 font-medium transition-all flex items-center gap-2 ${
									isSelected
										? "bg-blue-500 text-white border-blue-500 shadow-lg scale-105"
										: "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
								}`}
							>
								<CategoryIcon size={16} />
								{category.label}
							</button>
						);
					})}
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
