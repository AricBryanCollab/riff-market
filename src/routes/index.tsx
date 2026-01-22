import { createFileRoute } from "@tanstack/react-router";
import CategoryGrid from "@/components/home/CategoryGrid";
import HeroCarousel from "@/components/home/HeroCarousel";
import { mockCategories, featuredProducts } from "@/components/home/mocks";
import RecentListings from "@/components/home/RecentListings";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	return (
		<SectionContainer>
			<HeroCarousel products={featuredProducts} />

			<section className="py-12">
				<h2 className="text-xl font-semibold text-foreground mb-6">
					Browse by Category
				</h2>
				<CategoryGrid categories={mockCategories} />
			</section>

			<RecentListings />
		</SectionContainer>
	);
}
