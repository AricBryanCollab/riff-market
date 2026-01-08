import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import ProductCard from "@/components/productcard";
import SectionContainer from "@/components/sectioncontainer";
import { Body, BodySmall, H3 } from "@/components/typography";
import { mockProducts } from "@/constants/mockproducts";

export const Route = createFileRoute("/shop/")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	return (
		<SectionContainer>
			{/* PAGE HEADER */}
			<div className="flex flex-col gap-6 rounded-xl bg-white p-4 md:flex-row md:items-center md:justify-between">
				<div>
					<H3 className="tracking-wider">Browse Music Tools</H3>
					<Body className="mt-1">
						Discover guitars, pedals, keyboards, and accessories in this
						community-based marketplace
					</Body>
				</div>

				<div className="flex flex-col md:flex-row items-center gap-2">
					<div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
						<Search className="h-4 w-4 text-slate-400" />
						<input
							type="text"
							placeholder="Search products"
							className="outline-none text-sm text-slate-700 placeholder:text-slate-400 bg-transparent w-48"
						/>
					</div>
					<button
						type="button"
						onClick={() => navigate({ to: "/product/new" })}
						className="flex items-center cursor-pointer gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent transition-colors whitespace-nowrap"
					>
						<Plus className="size-4" />
						<BodySmall>Add Button</BodySmall>
					</button>
				</div>
			</div>

			{/* ACTIVE FILTERS */}
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

			{/* PRODUCT GRID */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{mockProducts.map((product) => (
					<ProductCard key={product.id} product={product} />
				))}
			</div>

			{/* PAGINATION / LOAD MORE */}
			<div className="flex justify-center py-6">
				<div className="h-10 w-40 rounded-full bg-slate-300" />
			</div>
		</SectionContainer>
	);
}
