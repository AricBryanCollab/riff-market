import { createFileRoute } from "@tanstack/react-router";
import HomeHero from "@/assets/home hero.jpg";
import Hero from "@/components/hero";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<>
			{/* HERO */}
			<Hero
				title="Find Your Perfect Guitar Tone"
				caption="A marketplace built for musicians, not just shopper "
				image={HomeHero}
			/>
			{/* CATEGORIES */}
			<SectionContainer>
				<div className="min-h-[40vh] w-full rounded-2xl bg-slate-100 p-8">
					<h2 className="mb-4 text-2xl font-semibold">Shop by Category</h2>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
						<div className="h-32 rounded-xl bg-slate-300" />
						<div className="h-32 rounded-xl bg-slate-300" />
						<div className="h-32 rounded-xl bg-slate-300" />
						<div className="h-32 rounded-xl bg-slate-300" />
						<div className="h-32 rounded-xl bg-slate-300" />
						<div className="h-32 rounded-xl bg-slate-300" />
					</div>
				</div>
			</SectionContainer>

			{/* VALUE PROPOSITION */}
			<SectionContainer>
				<div className="min-h-[35vh] w-full rounded-2xl bg-white p-8">
					<h2 className="mb-6 text-2xl font-semibold">Why RiffMarket?</h2>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="h-40 rounded-xl bg-emerald-100" />
						<div className="h-40 rounded-xl bg-emerald-100" />
						<div className="h-40 rounded-xl bg-emerald-100" />
					</div>
				</div>
			</SectionContainer>

			{/* FEATURED SELLERS */}
			<SectionContainer>
				<div className="min-h-[35vh] w-full rounded-2xl bg-slate-50 p-8">
					<h2 className="mb-6 text-2xl font-semibold">
						Featured Sellers & Brands
					</h2>
					<div className="flex gap-4 overflow-x-auto">
						<div className="h-32 w-48 shrink-0 rounded-xl bg-amber-200" />
						<div className="h-32 w-48 shrink-0 rounded-xl bg-amber-200" />
						<div className="h-32 w-48 shrink-0 rounded-xl bg-amber-200" />
						<div className="h-32 w-48 shrink-0 rounded-xl bg-amber-200" />
					</div>
				</div>
			</SectionContainer>

			{/* LEARN / GUIDES */}
			<SectionContainer>
				<div className="min-h-[30vh] w-full rounded-2xl bg-indigo-50 p-8">
					<h2 className="mb-4 text-2xl font-semibold">Learn & Improve</h2>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="h-40 rounded-xl bg-indigo-200" />
						<div className="h-40 rounded-xl bg-indigo-200" />
					</div>
				</div>
			</SectionContainer>

			{/* COMMUNITY */}
			<SectionContainer>
				<div className="min-h-[30vh] w-full rounded-2xl bg-orange-50 p-8">
					<h2 className="mb-4 text-2xl font-semibold">Built for Guitarists</h2>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="h-36 rounded-xl bg-orange-200" />
						<div className="h-36 rounded-xl bg-orange-200" />
						<div className="h-36 rounded-xl bg-orange-200" />
					</div>
				</div>
			</SectionContainer>

			{/* CTA */}
			<SectionContainer>
				<div className="flex min-h-[25vh] w-full flex-col items-center justify-center rounded-2xl bg-slate-900 p-8 text-center text-white">
					<h2 className="text-3xl font-bold">
						Ready to Start Your Tone Journey?
					</h2>
					<div className="mt-6 h-12 w-40 rounded-full bg-slate-700" />
				</div>
			</SectionContainer>

			{/* FOOTER */}
			<SectionContainer>
				<div className="min-h-[20vh] w-full rounded-2xl bg-slate-800 p-8 text-white">
					<div className="grid gap-4 md:grid-cols-4">
						<div className="h-24 rounded bg-slate-700" />
						<div className="h-24 rounded bg-slate-700" />
						<div className="h-24 rounded bg-slate-700" />
						<div className="h-24 rounded bg-slate-700" />
					</div>
				</div>
			</SectionContainer>
		</>
	);
}
