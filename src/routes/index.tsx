import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyFeaturedListingState } from "@/components/empty-states";
import { HeroFeaturedListingErrorState } from "@/components/error-states";
import CategoryGrid from "@/components/home/category-grid";
import Footer from "@/components/home/footer";
import HeroCarousel from "@/components/home/hero-carousel";
import RecentListings from "@/components/home/recent-listings";
import { HeroFeaturedListingLoading } from "@/components/loading-states";
import SectionContainer from "@/components/section-container";
import { H2 } from "@/components/ui/typography";
import { useFeaturedListings } from "@/hooks/use-get-listings";
export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const { featuredListings, loadingFeaturedListings, isErrorFeaturedListings } =
		useFeaturedListings();

	return (
		<SectionContainer>
			{loadingFeaturedListings ? (
				<HeroFeaturedListingLoading />
			) : isErrorFeaturedListings ? (
				<HeroFeaturedListingErrorState />
			) : featuredListings && featuredListings.length > 0 ? (
				<HeroCarousel listings={featuredListings} />
			) : (
				<EmptyFeaturedListingState />
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
