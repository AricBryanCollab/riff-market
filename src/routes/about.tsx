import { createFileRoute } from "@tanstack/react-router";
import AboutHero from "@/assets/about hero.jpg";
import Hero from "@/components/hero";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/about")({
	component: AboutComponent,
});

function AboutComponent() {
	return (
		<>
			{/* HERO  */}
			<Hero
				title="Learn What RiffMarket Is"
				caption="A musician-first marketplace where you can discover, sell, and explore guitar gear with confidence and community support"
				image={AboutHero}
			/>

			{/* WHAT IS RIFFMARKET */}
			<SectionContainer>
				<div className="min-h-[35vh] w-full rounded-2xl bg-white p-8">
					<h2 className="mb-4 text-2xl font-semibold">What Is RiffMarket?</h2>
					<div className="space-y-3">
						<div className="h-4 w-full rounded bg-slate-200" />
						<div className="h-4 w-11/12 rounded bg-slate-200" />
						<div className="h-4 w-10/12 rounded bg-slate-200" />
					</div>
				</div>
			</SectionContainer>

			{/* PERKS / BENEFITS */}
			<SectionContainer>
				<div className="min-h-[40vh] w-full rounded-2xl bg-slate-50 p-8">
					<h2 className="mb-6 text-2xl font-semibold">
						Why Musicians Choose RiffMarket
					</h2>
					<div className="grid gap-4 md:grid-cols-3">
						<div className="h-40 rounded-xl bg-emerald-100 p-4" />
						<div className="h-40 rounded-xl bg-emerald-100 p-4" />
						<div className="h-40 rounded-xl bg-emerald-100 p-4" />
					</div>
				</div>
			</SectionContainer>

			{/* HOW IT WORKS */}
			<SectionContainer>
				<div className="min-h-[40vh] w-full rounded-2xl bg-indigo-50 p-8">
					<h2 className="mb-6 text-2xl font-semibold">How RiffMarket Works</h2>
					<div className="grid gap-6 md:grid-cols-3">
						<div className="h-36 rounded-xl bg-indigo-200" />
						<div className="h-36 rounded-xl bg-indigo-200" />
						<div className="h-36 rounded-xl bg-indigo-200" />
					</div>
				</div>
			</SectionContainer>

			{/* FAQ */}
			<SectionContainer>
				<div className="min-h-[45vh] w-full rounded-2xl bg-white p-8">
					<h2 className="mb-6 text-2xl font-semibold">
						Frequently Asked Questions
					</h2>
					<div className="space-y-4">
						<div className="h-16 rounded-xl bg-slate-100" />
						<div className="h-16 rounded-xl bg-slate-100" />
						<div className="h-16 rounded-xl bg-slate-100" />
						<div className="h-16 rounded-xl bg-slate-100" />
					</div>
				</div>
			</SectionContainer>

			{/* CTA */}
			<SectionContainer>
				<div className="flex min-h-[30vh] w-full flex-col items-center justify-center rounded-2xl bg-amber-500 p-8 text-center text-white">
					<h2 className="text-3xl font-bold">
						Ready to Join the RiffMarket Community?
					</h2>
					<div className="mt-6 h-12 w-44 rounded-full bg-amber-300" />
				</div>
			</SectionContainer>
		</>
	);
}
