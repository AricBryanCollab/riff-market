import { createFileRoute, Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import {
	ArrowRight,
	ChevronDown,
	Handshake,
	Search,
	Shield,
	ShoppingBag,
	Sparkles,
	Users,
} from "lucide-react";
import { useId, useState } from "react";
import AboutHero from "@/assets/about-hero.jpg";
import SectionContainer from "@/components/sectioncontainer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/about")({
	component: AboutComponent,
});

function AboutComponent() {
	return (
		<div className="overflow-hidden">
			{/* HERO - Full bleed editorial style */}
			<section className="relative min-h-[90vh] flex items-end">
				<img
					src={AboutHero}
					alt=""
					fetchPriority="high"
					className="absolute inset-0 w-full h-full object-cover"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
				<SectionContainer>
					<div className="relative z-10 pb-16 md:pb-24">
						<p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4">
							Est. 2024
						</p>
						<h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl">
							Where Musicians
							<span className="block text-muted-foreground">
								Find Their Sound
							</span>
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
								We connect passionate players with the gear that shapes their
								sound—whether you're hunting for a vintage Stratocaster or
								selling your first pedal.
							</p>
							<p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-2xl">
								Every listing is verified. Every seller is vetted. Every
								transaction is protected. Because your gear isn't just
								equipment—it's your voice.
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
							icon={<Shield className="w-8 h-8" aria-hidden="true" />}
							number="01"
							title="Verified & Protected"
							description="Every seller goes through our verification process. Every transaction is backed by our buyer protection guarantee. No surprises, no scams."
							alignment="left"
						/>
						<BenefitCard
							icon={<Users className="w-8 h-8" aria-hidden="true" />}
							number="02"
							title="Community First"
							description="Join thousands of musicians who buy, sell, and trade gear daily. Read real reviews, connect with sellers, and become part of something bigger."
							alignment="right"
						/>
						<BenefitCard
							icon={<Sparkles className="w-8 h-8" aria-hidden="true" />}
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
							icon={<Search className="w-10 h-10" aria-hidden="true" />}
							step="01"
							title="Discover"
							description="Browse thousands of verified listings. Filter by brand, condition, price—find exactly what you're looking for."
						/>
						<StepCard
							icon={<ShoppingBag className="w-10 h-10" aria-hidden="true" />}
							step="02"
							title="Purchase"
							description="Buy with confidence. Secure checkout, buyer protection, and transparent seller ratings on every transaction."
						/>
						<StepCard
							icon={<Handshake className="w-10 h-10" aria-hidden="true" />}
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
							Join thousands of musicians already buying and selling on
							RiffMarket.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<LinkButton to="/shop" variant="primary">
								Start Shopping
								<ArrowRight className="w-5 h-5" aria-hidden="true" />
							</LinkButton>
							<LinkButton to="/shop" variant="outline">
								Sell Your Gear
							</LinkButton>
						</div>
					</div>
				</SectionContainer>
			</section>
		</div>
	);
}

const linkButtonVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-full text-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
	{
		variants: {
			variant: {
				primary: "bg-foreground text-background hover:bg-foreground/90",
				outline:
					"border-2 border-foreground text-foreground hover:bg-foreground hover:text-background",
			},
			size: {
				default: "px-8 py-4",
				sm: "px-6 py-3 text-base",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
		},
	},
);

interface LinkButtonProps extends VariantProps<typeof linkButtonVariants> {
	to: string;
	children: React.ReactNode;
	className?: string;
}

function LinkButton({
	to,
	variant,
	size,
	className,
	children,
}: LinkButtonProps) {
	return (
		<Link
			to={to}
			className={cn(linkButtonVariants({ variant, size, className }))}
		>
			{children}
		</Link>
	);
}

const benefitCardVariants = cva("grid md:grid-cols-12 gap-6 items-start", {
	variants: {
		alignment: {
			left: "",
			right: "md:text-right",
		},
	},
	defaultVariants: {
		alignment: "left",
	},
});

interface BenefitCardProps extends VariantProps<typeof benefitCardVariants> {
	icon: React.ReactNode;
	number: string;
	title: string;
	description: string;
}

function BenefitCard({
	icon,
	number,
	title,
	description,
	alignment = "left",
}: BenefitCardProps) {
	const isRight = alignment === "right";

	return (
		<div className={cn(benefitCardVariants({ alignment }))}>
			<div
				className={cn("md:col-span-5", isRight && "md:order-2 md:col-start-8")}
			>
				<div
					className={cn(
						"flex items-center gap-4 mb-4",
						isRight && "md:justify-end",
					)}
				>
					<div className="p-3 bg-secondary rounded-xl">{icon}</div>
					<span className="text-6xl md:text-7xl font-bold text-secondary">
						{number}
					</span>
				</div>
			</div>
			<div
				className={cn(
					"md:col-span-6",
					isRight ? "md:order-1 md:col-start-1" : "md:col-start-7",
				)}
			>
				<h3 className="text-2xl md:text-3xl font-bold mb-3">{title}</h3>
				<p className="text-lg text-muted-foreground leading-relaxed">
					{description}
				</p>
			</div>
		</div>
	);
}

const stepCardVariants = cva("text-center p-8 md:p-10", {
	variants: {
		highlight: {
			true: "bg-card rounded-2xl shadow-sm",
			false: "",
		},
	},
	defaultVariants: {
		highlight: false,
	},
});

interface StepCardProps extends VariantProps<typeof stepCardVariants> {
	icon: React.ReactNode;
	step: string;
	title: string;
	description: string;
	className?: string;
}

function StepCard({
	icon,
	step,
	title,
	description,
	highlight,
	className,
}: StepCardProps) {
	return (
		<div className={cn(stepCardVariants({ highlight, className }))}>
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

const faqContentVariants = cva(
	"grid transition-[grid-template-rows,opacity] duration-300",
	{
		variants: {
			open: {
				true: "grid-rows-[1fr] opacity-100",
				false: "grid-rows-[0fr] opacity-0",
			},
		},
		defaultVariants: {
			open: false,
		},
	},
);

interface FAQItemProps {
	question: string;
	answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
	const [isOpen, setIsOpen] = useState(false);
	const id = useId();
	const buttonId = `${id}-button`;
	const contentId = `${id}-content`;

	return (
		<div className="py-6">
			<button
				id={buttonId}
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between text-left group"
				type="button"
				aria-expanded={isOpen}
				aria-controls={contentId}
			>
				<span className="text-lg md:text-xl font-semibold pr-4 group-hover:text-foreground/70 transition-colors">
					{question}
				</span>
				<ChevronDown
					className={cn(
						"w-5 h-5 flex-shrink-0 transition-transform duration-300",
						isOpen && "rotate-180",
					)}
					aria-hidden="true"
				/>
			</button>
			<section
				id={contentId}
				aria-labelledby={buttonId}
				className={cn(faqContentVariants({ open: isOpen }))}
			>
				<div className="overflow-hidden">
					<p className="text-muted-foreground leading-relaxed pt-4">{answer}</p>
				</div>
			</section>
		</div>
	);
}
