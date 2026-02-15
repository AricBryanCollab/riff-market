import { createFileRoute } from "@tanstack/react-router";
import CommunityHero from "@/assets/reviews-hero.jpg";
import Hero from "@/components/hero";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/community")({
	component: CommunityComponent,
});

function CommunityComponent() {
	return (
		<>
			{/* HERO */}
			<Hero
				title="The RiffMarket Community"
				caption="Connect with guitarists, gear enthusiasts, and musicians who share your passion for tone and craft"
				image={CommunityHero}
			/>
			{/* COMMUNITY STATS */}
			<SectionContainer>
				<div className="min-h-[25vh] w-full rounded-2xl bg-white p-8">
					<div className="grid gap-4 md:grid-cols-3">
						<div className="h-24 rounded-xl bg-sky-100" />
						<div className="h-24 rounded-xl bg-sky-100" />
						<div className="h-24 rounded-xl bg-sky-100" />
					</div>
				</div>
			</SectionContainer>

			{/* USER FILTERS */}
			<SectionContainer>
				<div className="flex flex-wrap gap-3 rounded-2xl bg-slate-50 p-6">
					<div className="h-10 w-28 rounded-full bg-slate-200" />
					<div className="h-10 w-28 rounded-full bg-slate-200" />
					<div className="h-10 w-28 rounded-full bg-slate-200" />
				</div>
			</SectionContainer>

			{/* USER LIST */}
			<SectionContainer>
				<div className="min-h-[50vh] w-full rounded-2xl bg-white p-8">
					<h2 className="mb-6 text-2xl font-semibold">Community Members</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 12 }).map((_, i) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: just a placeholder
								key={i}
								className="flex items-center gap-4 rounded-xl bg-slate-100 p-4"
							>
								<div className="h-14 w-14 rounded-full bg-slate-300" />
								<div className="flex-1">
									<div className="h-4 w-3/4 rounded bg-slate-400" />
									<div className="mt-2 h-3 w-1/2 rounded bg-slate-300" />
								</div>
							</div>
						))}
					</div>
				</div>
			</SectionContainer>

			{/* CTA */}
			<SectionContainer>
				<div className="flex min-h-[25vh] w-full flex-col items-center justify-center rounded-2xl bg-emerald-500 p-8 text-center text-white">
					<h2 className="text-3xl font-bold">Join the Conversation</h2>
					<div className="mt-6 h-12 w-44 rounded-full bg-emerald-300" />
				</div>
			</SectionContainer>
		</>
	);
}
