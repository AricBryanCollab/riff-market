import GuitarPick from "@/assets/guitarpick";

interface AnimatedLoaderProps {
	text?: string;
	containerSizeClass?: string;
	svgSize?: number;
	textSize?: string;
	pingSize?: string;
}

const AnimatedLoader = ({
	text = "Loading",
	containerSizeClass = "w-full min-h-screen",
	pingSize = "size-64",
	textSize = "text-2xl",
	svgSize = 200,
}: AnimatedLoaderProps) => {
	return (
		<div
			className={`flex flex-col items-center justify-center ${containerSizeClass}`}
		>
			{/* Music Note Container */}
			<div className="relative">
				{/* Pulsing background circles - adjusted sizes for better proportion */}
				<div className="absolute inset-0 flex items-center justify-center">
					<div
						className={`${pingSize} bg-primary rounded-full opacity-10 animate-ping`}
					></div>
				</div>

				<div
					className="relative z-10"
					style={{ animation: "bounce 1.5s ease-in-out infinite" }}
				>
					<GuitarPick size={svgSize} className="text-primary drop-shadow-2xl" />
				</div>
			</div>

			<div className="text-center mt-4">
				<p
					className={`${textSize} font-semibold tracking-wide text-foreground`}
				>
					{text}
					<span className="inline-flex ml-1">
						<span className="animate-bounce" style={{ animationDelay: "0ms" }}>
							.
						</span>
						<span
							className="animate-bounce"
							style={{ animationDelay: "150ms" }}
						>
							.
						</span>
						<span
							className="animate-bounce"
							style={{ animationDelay: "300ms" }}
						>
							.
						</span>
					</span>
				</p>
			</div>
		</div>
	);
};

export default AnimatedLoader;
