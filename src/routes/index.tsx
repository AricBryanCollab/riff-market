import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyFeaturedProductState } from "@/components/empty-states";
import { HeroFeaturedProductErrorState } from "@/components/error-states";
import CategoryGrid from "@/components/home/category-grid";
import Footer from "@/components/home/footer";
import HeroCarousel from "@/components/home/hero-carousel";
import RecentListings from "@/components/home/recent-listings";
import { HeroFeaturedProductLoading } from "@/components/loading-states";
import SectionContainer from "@/components/section-container";
import { H2 } from "@/components/ui/typography";
import useGetProducts from "@/hooks/use-get-products";
export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const { featuredProducts, loadingFeatured, isErrorFeatured } =
		useGetProducts();

	return (
		<SectionContainer>
			{loadingFeatured ? (
				<HeroFeaturedProductLoading />
			) : isErrorFeatured ? (
				<HeroFeaturedProductErrorState />
			) : featuredProducts && featuredProducts.length > 0 ? (
				<HeroCarousel products={featuredProducts} />
			) : (
				<EmptyFeaturedProductState />
			)}

			<section className="py-12">
				<div className="my-10">
					<H2 className="text-foreground">Browse by Category</H2>
				</div>
				<CategoryGrid />
			</section>
			<section className="py-12">
				<div className="flex justify-between items-center my-10">
					<H2 className="text-foreground">Recent Listings</H2>
					<div className="flex items-center justify-between mb-6">
						<Link
							to="/shop"
							className="text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							View all →
						</Link>
					</div>
				</div>
				<RecentListings />
			</section>
			<section>
				<Footer />
			</section>
		</SectionContainer>
	);
}
