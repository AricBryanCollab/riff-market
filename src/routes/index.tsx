import { createFileRoute } from "@tanstack/react-router";
import { EmptyFeaturedProductState } from "@/components/emptystates";
import { HeroFeaturedProductErrorState } from "@/components/errorstates";
import CategoryGrid from "@/components/home/CategoryGrid";
import HeroCarousel from "@/components/home/HeroCarousel";
import { mockCategories } from "@/components/home/mocks";
import RecentListings from "@/components/home/RecentListings";
import { HeroFeaturedProductLoading } from "@/components/loadingstates";
import SectionContainer from "@/components/sectioncontainer";
import { H2 } from "@/components/typography";
import useGetProducts from "@/hooks/useGetProducts";
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
				<H2 className="text-xl font-semibold text-foreground mb-6">
					Browse by Category
				</H2>
				<CategoryGrid categories={mockCategories} />
			</section>

			<RecentListings />
		</SectionContainer>
	);
}
