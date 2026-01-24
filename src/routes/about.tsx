import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Shield,
	Users,
	Sparkles,
	Search,
	ShoppingBag,
	Handshake,
	ChevronDown,
	ArrowRight,
} from "lucide-react";
import { useState } from "react";
import AboutHero from "@/assets/about hero.jpg";
import SectionContainer from "@/components/sectioncontainer";

export const Route = createFileRoute("/about")({
	component: AboutComponent,
});

function AboutComponent() {
	return (
		<div className="overflow-hidden">
			{/* HERO - Full bleed editorial style */}
			<section className="relative min-h-[90vh] flex items-end">
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: `url(${AboutHero})` }}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
				<SectionContainer>
					<div className="relative z-10 pb-16 md:pb-24">
						<p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4">
							Est. 2024
						</p>
						<h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl">
							Where Musicians
							<span className="block text-muted-foreground">Find Their Sound</span>
						</h1>
					</div>
				</SectionContainer>
			</section>

			{/* INTRO - Magazine spread feel */}
			<section className="py-24 md:py-32 border-b border-border">
				<SectionContainer>
					<div className="grid md:grid-cols-12 gap-8 md:gap-12">
						<div className="md:col-span-4">
							<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground sticky top-24">
								What is RiffMarket?
							</p>
						</div>
						<div className="md:col-span-8">
							<p className="text-2xl md:text-3xl lg:text-4xl font-medium leading-snug text-foreground/90">
								RiffMarket is the marketplace built by musicians, for musicians.
								We connect passionate players with the gear that shapes their sound—whether
								you're hunting for a vintage Stratocaster or selling your first pedal.
							</p>
							<p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-2xl">
								Every listing is verified. Every seller is vetted. Every transaction
								is protected. Because your gear isn't just equipment—it's your voice.
							</p>
						</div>
					</div>
				</SectionContainer>
			</section>

			{/* PULL QUOTE - Editorial callout */}
			<section className="py-20 md:py-28 bg-foreground text-background">
				<SectionContainer>
					<blockquote className="text-center">
						<p className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl mx-auto">
							"Your gear isn't just equipment—
							<span className="text-background/60">it's your voice."</span>
						</p>
					</blockquote>
				</SectionContainer>
			</section>

			{/* WHY RIFFMARKET - Staggered benefits */}
			<section className="py-24 md:py-32">
				<SectionContainer>
					<div className="mb-16 md:mb-24">
						<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
							Why Musicians Choose Us
						</p>
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-2xl">
							Built Different
						</h2>
					</div>

					<div className="space-y-16 md:space-y-24">
						<BenefitCard
							icon={<Shield className="w-8 h-8" />}
							number="01"
							title="Verified & Protected"
							description="Every seller goes through our verification process. Every transaction is backed by our buyer protection guarantee. No surprises, no scams."
							alignment="left"
						/>
						<BenefitCard
							icon={<Users className="w-8 h-8" />}
							number="02"
							title="Community First"
							description="Join thousands of musicians who buy, sell, and trade gear daily. Read real reviews, connect with sellers, and become part of something bigger."
							alignment="right"
						/>
						<BenefitCard
							icon={<Sparkles className="w-8 h-8" />}
							number="03"
							title="Curated Quality"
							description="No mass-produced junk. Every listing is reviewed for quality and accuracy. We're picky so you don't have to be."
							alignment="left"
						/>
					</div>
				</SectionContainer>
			</section>

			{/* HOW IT WORKS - Clean steps */}
			<section className="py-24 md:py-32 bg-secondary/50">
				<SectionContainer>
					<div className="text-center mb-16 md:mb-24">
						<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
							How It Works
						</p>
						<h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
							Three Simple Steps
						</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-8 md:gap-4">
						<StepCard
							icon={<Search className="w-10 h-10" />}
							step="01"
							title="Discover"
							description="Browse thousands of verified listings. Filter by brand, condition, price—find exactly what you're looking for."
						/>
						<StepCard
							icon={<ShoppingBag className="w-10 h-10" />}
							step="02"
							title="Purchase"
							description="Buy with confidence. Secure checkout, buyer protection, and transparent seller ratings on every transaction."
						/>
						<StepCard
							icon={<Handshake className="w-10 h-10" />}
							step="03"
							title="Connect"
							description="Join the community. Leave reviews, follow sellers, and become part of the RiffMarket family."
						/>
					</div>
				</SectionContainer>
			</section>

			{/* FAQ - Accordion style */}
			<section className="py-24 md:py-32 border-b border-border">
				<SectionContainer>
					<div className="grid md:grid-cols-12 gap-8 md:gap-12">
						<div className="md:col-span-4">
							<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
								FAQ
							</p>
							<h2 className="text-3xl md:text-4xl font-bold sticky top-24">
								Common
								<span className="block">Questions</span>
							</h2>
						</div>
						<div className="md:col-span-8">
							<div className="divide-y divide-border">
								<FAQItem
									question="How does buyer protection work?"
									answer="Every purchase is covered by our guarantee. If an item doesn't match the listing description or never arrives, we'll refund your purchase in full. No questions asked."
								/>
								<FAQItem
									question="Can anyone sell on RiffMarket?"
									answer="We welcome all musicians! New sellers go through a simple verification process to ensure quality and trust. Once verified, you can list unlimited items with competitive fees."
								/>
								<FAQItem
									question="What types of gear can I find?"
									answer="From electric and acoustic guitars to keyboards, pedals, and accessories. We focus on quality musical instruments and gear—no random electronics or unrelated items."
								/>
								<FAQItem
									question="How are sellers verified?"
									answer="Sellers provide identity verification and agree to our community standards. We also monitor seller behavior, ratings, and transaction history to maintain marketplace quality."
								/>
							</div>
						</div>
					</div>
				</SectionContainer>
			</section>

			{/* CTA - Bold finish */}
			<section className="py-24 md:py-32">
				<SectionContainer>
					<div className="text-center">
						<h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
							Ready to Find
							<span className="block">Your Sound?</span>
						</h2>
						<p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
							Join thousands of musicians already buying and selling on RiffMarket.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								to="/shop"
								className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 text-lg font-semibold rounded-full hover:bg-foreground/90 transition-colors"
							>
								Start Shopping
								<ArrowRight className="w-5 h-5" />
							</Link>
							<Link
								to="/shop"
								className="inline-flex items-center justify-center gap-2 border-2 border-foreground text-foreground px-8 py-4 text-lg font-semibold rounded-full hover:bg-foreground hover:text-background transition-colors"
							>
								Sell Your Gear
							</Link>
						</div>
					</div>
				</SectionContainer>
			</section>
		</div>
	);
}

function BenefitCard({
	icon,
	number,
	title,
	description,
	alignment,
}: {
	icon: React.ReactNode;
	number: string;
	title: string;
	description: string;
	alignment: "left" | "right";
}) {
	return (
		<div
			className={`grid md:grid-cols-12 gap-6 items-start ${
				alignment === "right" ? "md:text-right" : ""
			}`}
		>
			<div
				className={`md:col-span-5 ${
					alignment === "right" ? "md:order-2 md:col-start-8" : ""
				}`}
			>
				<div
					className={`flex items-center gap-4 mb-4 ${
						alignment === "right" ? "md:justify-end" : ""
					}`}
				>
					<div className="p-3 bg-secondary rounded-xl">{icon}</div>
					<span className="text-6xl md:text-7xl font-bold text-secondary">
						{number}
					</span>
				</div>
			</div>
			<div
				className={`md:col-span-6 ${
					alignment === "right" ? "md:order-1 md:col-start-1" : "md:col-start-7"
				}`}
			>
				<h3 className="text-2xl md:text-3xl font-bold mb-3">{title}</h3>
				<p className="text-lg text-muted-foreground leading-relaxed">
					{description}
				</p>
			</div>
		</div>
	);
}

function StepCard({
	icon,
	step,
	title,
	description,
}: {
	icon: React.ReactNode;
	step: string;
	title: string;
	description: string;
}) {
	return (
		<div className="text-center p-8 md:p-10">
			<div className="inline-flex items-center justify-center p-4 bg-foreground text-background rounded-2xl mb-6">
				{icon}
			</div>
			<p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-2">
				Step {step}
			</p>
			<h3 className="text-2xl font-bold mb-3">{title}</h3>
			<p className="text-muted-foreground leading-relaxed">{description}</p>
		</div>
	);
}

function FAQItem({
	question,
	answer,
}: {
	question: string;
	answer: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="py-6">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between text-left group"
				type="button"
			>
				<span className="text-lg md:text-xl font-semibold pr-4 group-hover:text-foreground/70 transition-colors">
					{question}
				</span>
				<ChevronDown
					className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>
			<div
				className={`overflow-hidden transition-all duration-300 ${
					isOpen ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0"
				}`}
			>
				<p className="text-muted-foreground leading-relaxed">{answer}</p>
			</div>
		</div>
	);
}
