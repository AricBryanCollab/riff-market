import { cn } from "@/lib/utils";

interface TypographyProps {
	children: React.ReactNode;
	className?: string;
}

export const H1 = ({ children, className = "" }: TypographyProps) => (
	<h1
		className={cn(
			"scroll-m-20 text-4xl font-extrabold tracking-tight text-balance lg:text-5xl",
			className,
		)}
	>
		{children}
	</h1>
);

export const H2 = ({ children, className = "" }: TypographyProps) => (
	<h2
		className={cn(
			"scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl",
			className,
		)}
	>
		{children}
	</h2>
);

export const H3 = ({ children, className = "" }: TypographyProps) => (
	<h3
		className={cn(
			"scroll-m-20 text-2xl font-semibold tracking-tight",
			className,
		)}
	>
		{children}
	</h3>
);

export const H4 = ({ children, className = "" }: TypographyProps) => (
	<h4
		className={cn(
			"scroll-m-20 text-xl font-semibold tracking-tight",
			className,
		)}
	>
		{children}
	</h4>
);

export const H5 = ({ children, className = "" }: TypographyProps) => (
	<h5
		className={cn(
			"scroll-m-20 text-lg font-semibold tracking-tight",
			className,
		)}
	>
		{children}
	</h5>
);

export const H6 = ({ children, className = "" }: TypographyProps) => (
	<h6
		className={cn(
			"scroll-m-20 text-base font-semibold tracking-tight",
			className,
		)}
	>
		{children}
	</h6>
);

export const Lead = ({ children, className = "" }: TypographyProps) => (
	<p className={cn("text-xl text-muted-foreground", className)}>{children}</p>
);

export const Body = ({ children, className = "" }: TypographyProps) => (
	<p className={cn("text-base leading-7", className)}>{children}</p>
);

export const Paragraph = ({ children, className = "" }: TypographyProps) => (
	<p className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}>
		{children}
	</p>
);

export const BodyLarge = ({ children, className = "" }: TypographyProps) => (
	<p className={cn("text-lg font-semibold", className)}>{children}</p>
);

export const BodySmall = ({ children, className = "" }: TypographyProps) => (
	<p className={cn("text-sm font-medium leading-none", className)}>
		{children}
	</p>
);

export const Muted = ({ children, className = "" }: TypographyProps) => (
	<p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);

export const Caption = ({ children, className = "" }: TypographyProps) => (
	<span className={cn("text-xs text-muted-foreground", className)}>
		{children}
	</span>
);

type InlineCodeProps = Pick<TypographyProps, "children" | "className">;

export const InlineCode = ({ children, className = "" }: InlineCodeProps) => (
	<code
		className={cn(
			"relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
			className,
		)}
	>
		{children}
	</code>
);

export const Blockquote = ({ children, className = "" }: TypographyProps) => (
	<blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
		{children}
	</blockquote>
);

export const List = ({ children, className = "" }: TypographyProps) => (
	<ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}>
		{children}
	</ul>
);
