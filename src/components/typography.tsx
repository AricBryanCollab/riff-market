interface TypographyProps {
	children: React.ReactNode;
	secondary?: boolean;
	className?: string;
}

export const H1 = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<h1
		className={`text-4xl md:text-5xl font-bold ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</h1>
);

export const H2 = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<h2
		className={`text-3xl md:text-4xl font-bold ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</h2>
);

export const H3 = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<h3
		className={`text-2xl md:text-3xl font-semibold ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</h3>
);

export const H4 = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<h4
		className={`text-xl md:text-2xl font-semibold ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</h4>
);

export const H5 = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<h5
		className={`text-lg md:text-xl font-semibold ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</h5>
);

export const H6 = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<h6
		className={`text-base md:text-lg font-semibold ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</h6>
);

export const Subtitle = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<p
		className={`text-lg md:text-xl font-medium text-muted-foreground ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</p>
);

export const Body = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<p
		className={`text-base leading-relaxed ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</p>
);

export const BodyLarge = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<p
		className={`text-lg leading-relaxed ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</p>
);

export const BodySmall = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<p
		className={`text-sm leading-relaxed ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</p>
);

export const Caption = ({
	children,
	secondary = false,
	className = "",
}: TypographyProps) => (
	<span
		className={`text-xs text-gray-400 ${secondary ? "font-secondary" : "font-sans"} ${className}`}
	>
		{children}
	</span>
);
