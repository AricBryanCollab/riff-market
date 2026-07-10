import { createFileRoute, Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import {
	ArrowRight,
	ChevronDown,
	type LucideIcon,
	MessageCircle,
	ShieldCheck,
	Sparkles,
	UserRoundPlus,
	Users,
	Waypoints,
} from "lucide-react";
import { useId, useState } from "react";
import CommunityHero from "@/assets/community-hero.jpg";
import SectionContainer from "@/components/section-container";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/community")({
	component: CommunityComponent,
});

const communityMetrics = [
	{
		value: "18k+",
		label: "Musicians browsing and trading each month",
		description:
			"A growing network of players, collectors, and builders exchanging gear knowledge every day.",
		icon: Users,
	},
	{
		value: "240+",
		label: "Daily conversations around gear and sellers",
		description:
			"Questions, follow-ups, and post-purchase feedback help the next buyer make a sharper call.",
		icon: MessageCircle,
	},
	{
		value: "89%",
		label: "Members say community trust drives repeat purchases",
		description:
			"Reliable communication and transparent behavior keep the marketplace healthy.",
		icon: ShieldCheck,
	},
] as const;

const communityPrinciples = [
	{
		number: "01",
		title: "Built Around Real Players",
		description:
			"RiffMarket works best when buyers and sellers speak the same language about condition, tone, setup, and expectations.",
		icon: Users,
		alignment: "left" as const,
	},
	{
		number: "02",
		title: "Trust Is Visible",
		description:
			"Profiles, reviews, and consistent transaction history make it easier to know who you are dealing with before you commit.",
		icon: ShieldCheck,
		alignment: "right" as const,
	},
	{
		number: "03",
		title: "Shared Taste Creates Discovery",
		description:
			"The community surfaces interesting gear faster, from overlooked workhorse pedals to rare instruments worth chasing.",
		icon: Sparkles,
		alignment: "left" as const,
	},
] as const;

const communitySteps = [
	{
		step: "01",
		title: "Show Up",
		description:
			"Create a profile, explore listings, and get a feel for how musicians describe the gear they care about.",
		icon: UserRoundPlus,
	},
	{
		step: "02",
		title: "Join The Conversation",
		description:
			"Ask thoughtful questions, read reviews, and follow the signals that experienced buyers and sellers leave behind.",
		icon: MessageCircle,
	},
	{
		step: "03",
		title: "Build Your Reputation",
		description:
			"Clear communication, accurate listings, and honest feedback compound into trust that makes every next transaction easier.",
		icon: Waypoints,
	},
] as const;

const communityFaqs = [
	{
		question: "What makes the RiffMarket community different?",
		answer:
			"It is centered on musicians and gear enthusiasts, so conversations tend to be specific, practical, and grounded in actual use instead of generic marketplace chatter.",
	},
	{
		question: "How do I build trust as a new member?",
		answer:
			"Start with accurate information, respond clearly, and follow through. Consistency matters more than volume when people decide whether to buy from you.",
	},
	{
		question: "Why does community matter in a marketplace?",
		answer:
			"A strong community improves discovery and reduces risk. Better questions, better reviews, and better seller behavior all come from members paying attention to each other.",
	},
	{
		question: "Can I participate even if I am mostly here to browse?",
		answer:
			"Yes. Reading reviews, watching seller patterns, and learning how players talk about gear is already valuable. Participation can start quietly and grow over time.",
	},
] as const;

function CommunityComponent() {
	return (
		<div className="overflow-hidden">
			<section className="relative flex min-h-[90vh] items-end">
				<img
					src={CommunityHero}
					alt=""
					fetchPriority="high"
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-background via-background/65 to-transparent" />
				<SectionContainer>
					<div className="relative z-10 pb-16 md:pb-24">
						<p className="mb-4 text-sm uppercase tracking-[0.3em] text-muted-foreground">
							The Community
						</p>
						<h1 className="max-w-5xl text-5xl leading-[0.9] font-bold tracking-tight md:text-7xl lg:text-8xl">
							Where Musicians
							<span className="block text-muted-foreground">
								Trade More Than Gear
							</span>
						</h1>
					</div>
				</SectionContainer>
			</section>

			<section className="border-b border-border py-24 md:py-32">
				<SectionContainer>
					<div className="grid gap-8 md:grid-cols-12 md:gap-12">
						<div className="md:col-span-4">
							<p className="sticky top-24 text-sm uppercase tracking-[0.2em] text-muted-foreground">
								Why Community Matters
							</p>
						</div>
						<div className="md:col-span-8">
							<p className="text-2xl font-medium leading-snug text-foreground/90 md:text-3xl lg:text-4xl">
								The strongest marketplaces are not just catalogues. They are
								networks of people who share taste, context, and enough trust to
								help each other buy smarter.
							</p>
							<p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
								RiffMarket connects players who care about the details: how gear
								was treated, how it sounds in use, and whether a seller follows
								through when it matters. That shared standard is the
								marketplace.
							</p>
						</div>
					</div>
				</SectionContainer>
			</section>

			<section className="bg-foreground py-20 text-background md:py-28">
				<SectionContainer>
					<blockquote className="text-center">
						<p className="mx-auto max-w-4xl text-3xl leading-tight font-bold md:text-5xl lg:text-6xl">
							"A good marketplace moves listings.
							<span className="text-background/60">
								{" "}
								A great one builds trust.
							</span>
							"
						</p>
					</blockquote>
				</SectionContainer>
			</section>

			<section className="bg-secondary/50 py-24 md:py-32">
				<SectionContainer>
					<div className="mb-16 text-center md:mb-24">
						<p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
							Community Snapshot
						</p>
						<h2 className="text-4xl font-bold md:text-5xl lg:text-6xl">
							A Marketplace With Memory
						</h2>
					</div>

					<div className="grid gap-6 md:grid-cols-3">
						{communityMetrics.map((metric) => (
							<MetricCard key={metric.label} {...metric} />
						))}
					</div>
				</SectionContainer>
			</section>

			<section className="py-24 md:py-32">
				<SectionContainer>
					<div className="mb-16 md:mb-24">
						<p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
							How The Community Works
						</p>
						<h2 className="max-w-3xl text-4xl font-bold md:text-5xl lg:text-6xl">
							Signals, Standards, And Shared Taste
						</h2>
					</div>

					<div className="space-y-16 md:space-y-24">
						{communityPrinciples.map((principle) => (
							<BenefitCard key={principle.number} {...principle} />
						))}
					</div>
				</SectionContainer>
			</section>

			<section className="bg-secondary/50 py-24 md:py-32">
				<SectionContainer>
					<div className="mb-16 text-center md:mb-24">
						<p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
							Get Started
						</p>
						<h2 className="text-4xl font-bold md:text-5xl lg:text-6xl">
							Three Simple Steps
						</h2>
					</div>

					<div className="grid gap-8 md:grid-cols-3 md:gap-4">
						{communitySteps.map((step, index) => (
							<StepCard key={step.step} {...step} highlight={index === 1} />
						))}
					</div>
				</SectionContainer>
			</section>

			<section className="border-b border-border py-24 md:py-32">
				<SectionContainer>
					<div className="grid gap-8 md:grid-cols-12 md:gap-12">
						<div className="md:col-span-4">
							<p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
								FAQ
							</p>
							<h2 className="sticky top-24 text-3xl font-bold md:text-4xl">
								Community
								<span className="block">Guidelines</span>
							</h2>
						</div>
						<div className="md:col-span-8">
							<div className="divide-y divide-border">
								{communityFaqs.map((faq) => (
									<FAQItem key={faq.question} {...faq} />
								))}
							</div>
						</div>
					</div>
				</SectionContainer>
			</section>

			<section className="py-24 md:py-32">
				<SectionContainer>
					<div className="text-center">
						<h2 className="mb-6 text-4xl font-bold md:text-6xl lg:text-7xl">
							Join A Marketplace
							<span className="block">That Knows The Difference</span>
						</h2>
						<p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
							Meet musicians who care about clear listings, honest feedback, and
							gear worth talking about after the sale.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<LinkButton to="/shop" variant="primary">
								Explore Listings
								<ArrowRight className="h-5 w-5" aria-hidden="true" />
							</LinkButton>
							<LinkButton to="/reviews" variant="outline">
								Read Reviews
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

function MetricCard({
	value,
	label,
	description,
	icon: Icon,
}: {
	value: string;
	label: string;
	description: string;
	icon: LucideIcon;
}) {
	return (
		<div className="rounded-3xl border border-border bg-background p-8">
			<div className="mb-8 inline-flex rounded-2xl bg-secondary p-4">
				<Icon className="h-7 w-7" aria-hidden="true" />
			</div>
			<p className="mb-3 text-4xl font-bold md:text-5xl">{value}</p>
			<h3 className="mb-3 text-xl font-semibold">{label}</h3>
			<p className="leading-relaxed text-muted-foreground">{description}</p>
		</div>
	);
}

const benefitCardVariants = cva("grid items-start gap-6 md:grid-cols-12", {
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
	icon: LucideIcon;
	number: string;
	title: string;
	description: string;
}

function BenefitCard({
	icon: Icon,
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
						"mb-4 flex items-center gap-4",
						isRight && "md:justify-end",
					)}
				>
					<div className="rounded-xl bg-secondary p-3">
						<Icon className="h-8 w-8" aria-hidden="true" />
					</div>
					<span className="text-6xl font-bold text-secondary md:text-7xl">
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
				<h3 className="mb-3 text-2xl font-bold md:text-3xl">{title}</h3>
				<p className="text-lg leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>
		</div>
	);
}

const stepCardVariants = cva("p-8 text-center md:p-10", {
	variants: {
		highlight: {
			true: "rounded-2xl bg-card shadow-sm",
			false: "",
		},
	},
	defaultVariants: {
		highlight: false,
	},
});

interface StepCardProps extends VariantProps<typeof stepCardVariants> {
	icon: LucideIcon;
	step: string;
	title: string;
	description: string;
	className?: string;
}

function StepCard({
	icon: Icon,
	step,
	title,
	description,
	highlight,
	className,
}: StepCardProps) {
	return (
		<div className={cn(stepCardVariants({ highlight, className }))}>
			<div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-foreground p-4 text-background">
				<Icon className="h-10 w-10" aria-hidden="true" />
			</div>
			<p className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
				Step {step}
			</p>
			<h3 className="mb-3 text-2xl font-bold">{title}</h3>
			<p className="leading-relaxed text-muted-foreground">{description}</p>
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
				className="group flex w-full items-center justify-between text-left"
				type="button"
				aria-expanded={isOpen}
				aria-controls={contentId}
			>
				<span className="pr-4 text-lg font-semibold transition-colors group-hover:text-foreground/70 md:text-xl">
					{question}
				</span>
				<ChevronDown
					className={cn(
						"h-5 w-5 shrink-0 transition-transform duration-300",
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
					<p className="pt-4 leading-relaxed text-muted-foreground">{answer}</p>
				</div>
			</section>
		</div>
	);
}
