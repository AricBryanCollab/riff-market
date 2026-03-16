import { createFileRoute, Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import {
	ArrowRight,
	BadgeCheck,
	ChevronDown,
	type LucideIcon,
	MessageSquareQuote,
	ScanSearch,
	SlidersHorizontal,
	Star,
	TrendingUp,
	Users,
} from "lucide-react";
import { useId, useState } from "react";
import ReviewsHero from "@/assets/reviews-hero.jpg";
import SectionContainer from "@/components/section-container";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reviews/")({
	component: ReviewsComponent,
});

const marketplaceMetrics = [
	{
		value: "4.8/5",
		label: "Average seller experience score",
		description:
			"Ratings shaped by verified buyers who review delivery, accuracy, and condition.",
		icon: Star,
	},
	{
		value: "12k+",
		label: "Community reviews posted",
		description:
			"Detailed feedback across guitars, amps, pedals, studio gear, and accessories.",
		icon: MessageSquareQuote,
	},
	{
		value: "91%",
		label: "Buyers say reviews changed their shortlist",
		description:
			"Real comments surface the differences that spec sheets usually miss.",
		icon: TrendingUp,
	},
] as const;

const reviewPrinciples = [
	{
		number: "01",
		title: "Verified Buyer Context",
		description:
			"We highlight feedback from actual transactions, so the reviews you read come from players who lived with the gear after checkout.",
		icon: BadgeCheck,
		alignment: "left" as const,
	},
	{
		number: "02",
		title: "Useful Detail Over Hype",
		description:
			"Reviews focus on tone, feel, setup, condition accuracy, shipping care, and seller communication, not empty five-star noise.",
		icon: ScanSearch,
		alignment: "right" as const,
	},
	{
		number: "03",
		title: "Signals You Can Compare",
		description:
			"Patterns matter more than one opinion. We make it easier to spot recurring praise, recurring issues, and who the gear is actually for.",
		icon: Users,
		alignment: "left" as const,
	},
] as const;

const reviewSteps = [
	{
		step: "01",
		title: "Read the Story",
		description:
			"Start with the full review, not just the score. Look for how the player describes tone, condition, and first impressions.",
		icon: MessageSquareQuote,
	},
	{
		step: "02",
		title: "Compare the Pattern",
		description:
			"Check whether multiple buyers mention the same strengths or issues. Repetition is usually the most honest signal.",
		icon: SlidersHorizontal,
	},
	{
		step: "03",
		title: "Buy With Clarity",
		description:
			"Use reviews alongside listing photos and seller ratings to decide faster and with fewer surprises when the box arrives.",
		icon: ArrowRight,
	},
] as const;

const reviewFaqs = [
	{
		question: "Are reviews only from verified buyers?",
		answer:
			"We prioritize feedback tied to completed marketplace orders so the most visible reviews reflect real purchase experiences, shipping timelines, and condition checks.",
	},
	{
		question: "What should I pay attention to besides the star rating?",
		answer:
			"Look for specifics: how the seller packed the item, whether the condition matched the listing, how quickly it shipped, and how the gear performed after setup.",
	},
	{
		question: "Can reviews help me compare similar products?",
		answer:
			"Yes. Reviews often expose differences between models that specs flatten out, like neck feel, pedal noise floor, amp breakup, or how gear responds in a mix.",
	},
	{
		question: "Do sellers respond to feedback?",
		answer:
			"Sellers build trust through transparent communication and consistency over time. Reviews give buyers a record of how reliably a seller delivers on their listings.",
	},
] as const;

function ReviewsComponent() {
	return (
		<div className="overflow-hidden">
			<section className="relative flex min-h-[90vh] items-end">
				<img
					src={ReviewsHero}
					alt=""
					fetchPriority="high"
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-background via-background/65 to-transparent" />
				<SectionContainer>
					<div className="relative z-10 pb-16 md:pb-24">
						<p className="mb-4 text-sm uppercase tracking-[0.3em] text-muted-foreground">
							Player Reviews
						</p>
						<h1 className="max-w-5xl text-5xl leading-[0.9] font-bold tracking-tight md:text-7xl lg:text-8xl">
							Trusted Feedback
							<span className="block text-muted-foreground">
								From Real Musicians
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
								Why Reviews Matter
							</p>
						</div>
						<div className="md:col-span-8">
							<p className="text-2xl font-medium leading-snug text-foreground/90 md:text-3xl lg:text-4xl">
								The best buying decisions happen after you hear from people who
								already opened the case, plugged in, and put the gear through a
								real session.
							</p>
							<p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
								RiffMarket reviews are built to help you judge more than
								popularity. They reveal how products arrive, how sellers
								communicate, and how gear actually feels once it leaves the
								listing page.
							</p>
						</div>
					</div>
				</SectionContainer>
			</section>

			<section className="bg-foreground py-20 text-background md:py-28">
				<SectionContainer>
					<blockquote className="text-center">
						<p className="mx-auto max-w-4xl text-3xl leading-tight font-bold md:text-5xl lg:text-6xl">
							"The right review does more than rate the gear.
							<span className="text-background/60"> It explains the fit."</span>
						</p>
					</blockquote>
				</SectionContainer>
			</section>

			<section className="bg-secondary/50 py-24 md:py-32">
				<SectionContainer>
					<div className="mb-16 text-center md:mb-24">
						<p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
							Marketplace Snapshot
						</p>
						<h2 className="text-4xl font-bold md:text-5xl lg:text-6xl">
							What The Community Is Saying
						</h2>
					</div>

					<div className="grid gap-6 md:grid-cols-3">
						{marketplaceMetrics.map((metric) => (
							<MetricCard key={metric.label} {...metric} />
						))}
					</div>
				</SectionContainer>
			</section>

			<section className="py-24 md:py-32">
				<SectionContainer>
					<div className="mb-16 md:mb-24">
						<p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
							Why Players Trust These Reviews
						</p>
						<h2 className="max-w-3xl text-4xl font-bold md:text-5xl lg:text-6xl">
							Built For Better Buying Decisions
						</h2>
					</div>

					<div className="space-y-16 md:space-y-24">
						{reviewPrinciples.map((principle) => (
							<BenefitCard key={principle.number} {...principle} />
						))}
					</div>
				</SectionContainer>
			</section>

			<section className="bg-secondary/50 py-24 md:py-32">
				<SectionContainer>
					<div className="mb-16 text-center md:mb-24">
						<p className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">
							How To Use Reviews
						</p>
						<h2 className="text-4xl font-bold md:text-5xl lg:text-6xl">
							Three Simple Steps
						</h2>
					</div>

					<div className="grid gap-8 md:grid-cols-3 md:gap-4">
						{reviewSteps.map((step, index) => (
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
								Reviews
								<span className="block">Explained</span>
							</h2>
						</div>
						<div className="md:col-span-8">
							<div className="divide-y divide-border">
								{reviewFaqs.map((faq) => (
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
							Find Gear With
							<span className="block">More Confidence</span>
						</h2>
						<p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
							Read what musicians noticed after the unboxing, on the first gig,
							and weeks later when the hype wore off.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<LinkButton to="/shop" variant="primary">
								Browse Gear
								<ArrowRight className="h-5 w-5" aria-hidden="true" />
							</LinkButton>
							<LinkButton to="/community" variant="outline">
								Join The Community
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
