import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import AboutHero from "@/assets/about hero.jpg";
import SectionContainer from "@/components/sectioncontainer";
import {
	Zap,
	Users,
	CheckCircle,
	ArrowRight,
	Star,
	ChevronDown,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/about")({
	component: AboutComponent,
});

function AboutComponent() {
	return (
		<div className="overflow-hidden bg-background">
			{/* HERO - Zine cover style */}
			<section className="relative min-h-screen flex items-center justify-center py-20">
				<div className="absolute inset-0 overflow-hidden">
					<div
						className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-10"
						style={{
							backgroundImage: `url(${AboutHero})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							filter: "grayscale(100%) contrast(120%)",
						}}
					/>
				</div>

				<SectionContainer>
					<div className="relative">
						{/* Rotated accent label */}
						<div className="absolute -left-4 top-0 -rotate-90 origin-left">
							<span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
								Issue 001 • 2024
							</span>
						</div>

						<div className="text-center md:text-left">
							<h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter">
								RIFF
								<span className="block text-amber-500">MARKET</span>
							</h1>

							<div className="mt-8 md:mt-12 max-w-xl">
								<p className="text-xl md:text-2xl font-medium border-l-4 border-amber-500 pl-4">
									The musician-first marketplace for gear that matters.
								</p>
							</div>

							{/* Scattered tags */}
							<div className="mt-12 flex flex-wrap gap-3">
								<span className="px-4 py-2 bg-foreground text-background text-sm font-bold uppercase tracking-wide">
									Verified Sellers
								</span>
								<span className="px-4 py-2 border-2 border-foreground text-sm font-bold uppercase tracking-wide rotate-1">
									Buyer Protected
								</span>
								<span className="px-4 py-2 bg-amber-500 text-white text-sm font-bold uppercase tracking-wide -rotate-1">
									Community First
								</span>
							</div>
						</div>
					</div>
				</SectionContainer>
			</section>

			{/* MANIFESTO */}
			<section className="py-20 md:py-32 bg-foreground text-background">
				<SectionContainer>
					<div className="max-w-4xl">
						<p className="text-xs uppercase tracking-[0.3em] text-background/50 mb-6">
							Our Manifesto
						</p>

						<div className="space-y-6 text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
							<p>We believe gear is personal.</p>
							<p className="text-background/60">
								That your first guitar isn't just wood and strings—
							</p>
							<p>it's the start of something.</p>
							<p className="text-background/60">
								We built RiffMarket for musicians who get it.
							</p>
							<p>
								<span className="text-amber-500">No scams.</span>{" "}
								<span className="text-amber-500">No junk.</span>{" "}
								<span className="text-amber-500">No BS.</span>
							</p>
							<p className="text-background/60">Just great gear,</p>
							<p>honest deals,</p>
							<p className="text-background/60">and a community that has your back.</p>
						</div>
					</div>
				</SectionContainer>
			</section>

			{/* WHY US - Collage cards */}
			<section className="py-20 md:py-32">
				<SectionContainer>
					<div className="mb-12 md:mb-20">
						<h2 className="text-4xl md:text-6xl font-black">
							Why
							<span className="text-amber-500"> Us?</span>
						</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-6 md:gap-8">
						<ZineCard
							icon={<Zap className="w-8 h-8" />}
							title="Verified Everything"
							description="Every seller. Every listing. Checked and approved before it goes live."
							rotation="-rotate-1"
							accent="border-t-amber-500"
						/>
						<ZineCard
							icon={<Users className="w-8 h-8" />}
							title="Real Community"
							description="Thousands of musicians buying, selling, and actually talking to each other."
							rotation="rotate-1"
							accent="border-t-foreground"
						/>
						<ZineCard
							icon={<CheckCircle className="w-8 h-8" />}
							title="Protected Deals"
							description="If something goes wrong, we fix it. Full refund guarantee on every purchase."
							rotation="-rotate-1"
							accent="border-t-amber-500"
						/>
					</div>
				</SectionContainer>
			</section>

			{/* HOW IT WORKS - Stepped layout */}
			<section className="py-20 md:py-32 bg-secondary/50">
				<SectionContainer>
					<div className="mb-12 md:mb-20">
						<h2 className="text-4xl md:text-6xl font-black">
							How It
							<span className="text-amber-500"> Works</span>
						</h2>
					</div>

					<div className="space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
						<ZineStep
							number="01"
							title="Find Your Gear"
							description="Browse verified listings. Search by brand, price, condition. We've got the good stuff."
						/>
						<ZineStep
							number="02"
							title="Buy Safe"
							description="Secure checkout. Buyer protection. Transparent ratings. No sketchy vibes."
							offset={true}
						/>
						<ZineStep
							number="03"
							title="Join the Crew"
							description="Leave reviews. Connect with sellers. Become part of something real."
						/>
					</div>
				</SectionContainer>
			</section>

			{/* TESTIMONIALS - Quote cards */}
			<section className="py-20 md:py-32">
				<SectionContainer>
					<div className="mb-12 md:mb-20">
						<h2 className="text-4xl md:text-6xl font-black">
							What They
							<span className="text-amber-500"> Say</span>
						</h2>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						<QuoteCard
							quote="Finally, a marketplace that doesn't feel like I'm gambling with my money."
							author="Sarah M."
							role="Guitarist, Portland"
							rotation="-rotate-1"
						/>
						<QuoteCard
							quote="Sold my old Telecaster in two days. The buyer was actually a real person who cared about the guitar."
							author="Mike T."
							role="Seller since 2024"
							rotation="rotate-1"
						/>
					</div>
				</SectionContainer>
			</section>

			{/* FAQ - Raw style */}
			<section className="py-20 md:py-32 bg-foreground text-background">
				<SectionContainer>
					<div className="mb-12 md:mb-20">
						<h2 className="text-4xl md:text-6xl font-black">
							FAQ
							<span className="text-amber-500">*</span>
						</h2>
						<p className="text-background/50 mt-2 text-sm">
							*Frequently asked questions, obviously
						</p>
					</div>

					<div className="max-w-2xl space-y-2">
						<ZineFAQ
							question="How does buyer protection work?"
							answer="Simple: if your item doesn't match the listing or never arrives, you get your money back. Full stop. No forms, no hassle, no waiting."
						/>
						<ZineFAQ
							question="Can anyone sell?"
							answer="Yep. Complete our quick verification (takes 5 minutes), agree to not be a jerk, and you're in. We keep fees low so you keep more cash."
						/>
						<ZineFAQ
							question="What kind of gear is on here?"
							answer="Guitars (electric, acoustic, bass), keyboards, synths, pedals, amps, quality accessories. We don't do random electronics—just music gear."
						/>
						<ZineFAQ
							question="How do I know sellers are legit?"
							answer="We verify everyone. Check IDs, monitor behavior, boot problem sellers fast. Our community keeps each other honest."
						/>
					</div>
				</SectionContainer>
			</section>

			{/* CTA - Bold finish */}
			<section className="py-20 md:py-32 bg-amber-500">
				<SectionContainer>
					<div className="text-center">
						<h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight">
							STOP SCROLLING.
							<span className="block">START PLAYING.</span>
						</h2>

						<div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								to="/shop"
								className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-4 text-lg font-black uppercase tracking-wide hover:bg-foreground/90 transition-colors"
							>
								Browse Gear
								<ArrowRight className="w-5 h-5" />
							</Link>
							<Link
								to="/shop"
								className="inline-flex items-center justify-center gap-2 border-3 border-foreground text-foreground px-8 py-4 text-lg font-black uppercase tracking-wide hover:bg-foreground hover:text-amber-500 transition-colors"
							>
								Sell Yours
							</Link>
						</div>
					</div>
				</SectionContainer>
			</section>
		</div>
	);
}

function ZineCard({
	icon,
	title,
	description,
	rotation,
	accent,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	rotation: string;
	accent: string;
}) {
	return (
		<div
			className={`${rotation} hover:rotate-0 transition-transform duration-300 bg-card border-2 border-foreground ${accent} border-t-4 p-6 md:p-8`}
		>
			<div className="mb-4 text-amber-500">{icon}</div>
			<h3 className="text-xl md:text-2xl font-black mb-3 uppercase tracking-tight">
				{title}
			</h3>
			<p className="text-muted-foreground leading-relaxed">{description}</p>
		</div>
	);
}

function ZineStep({
	number,
	title,
	description,
	offset = false,
}: {
	number: string;
	title: string;
	description: string;
	offset?: boolean;
}) {
	return (
		<div className={`${offset ? "md:mt-16" : ""}`}>
			<span className="text-7xl md:text-8xl font-black text-amber-500/20">
				{number}
			</span>
			<h3 className="text-2xl md:text-3xl font-black -mt-8 mb-3">{title}</h3>
			<p className="text-muted-foreground leading-relaxed">{description}</p>
		</div>
	);
}

function QuoteCard({
	quote,
	author,
	role,
	rotation,
}: {
	quote: string;
	author: string;
	role: string;
	rotation: string;
}) {
	return (
		<div
			className={`${rotation} hover:rotate-0 transition-transform duration-300 bg-card border-2 border-foreground p-6 md:p-8`}
		>
			<div className="flex gap-1 mb-4">
				{[...Array(5)].map((_, i) => (
					<Star
						key={`star-${author}-${i}`}
						className="w-4 h-4 fill-amber-500 text-amber-500"
					/>
				))}
			</div>
			<blockquote className="text-lg md:text-xl font-bold mb-6 leading-snug">
				"{quote}"
			</blockquote>
			<div>
				<p className="font-black">{author}</p>
				<p className="text-sm text-muted-foreground">{role}</p>
			</div>
		</div>
	);
}

function ZineFAQ({
	question,
	answer,
}: {
	question: string;
	answer: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="border-b border-background/20">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between py-5 text-left group"
				type="button"
			>
				<span className="text-lg md:text-xl font-bold pr-4 group-hover:text-amber-500 transition-colors">
					{question}
				</span>
				<ChevronDown
					className={`w-5 h-5 flex-shrink-0 text-amber-500 transition-transform duration-300 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>
			<div
				className={`overflow-hidden transition-all duration-300 ${
					isOpen ? "max-h-48 pb-5" : "max-h-0"
				}`}
			>
				<p className="text-background/70 leading-relaxed">{answer}</p>
			</div>
		</div>
	);
}
