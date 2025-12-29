import SectionContainer from "@/components/sectioncontainer";

interface HeroProps {
	image: string;
	title: string;
	caption?: string;
}

const Hero = ({ image, title, caption }: HeroProps) => {
	return (
		<SectionContainer>
			<div className="relative flex min-h-[80vh] w-full flex-col items-center justify-center rounded-2xl overflow-hidden p-8 text-center">
				<div
					style={{
						backgroundImage: `url(${image})`,
					}}
					className="absolute -z-10 inset-0 bg-cover bg-center"
				/>
				<div className="rounded-2xl bg-foreground/45 px-4 py-3">
					<h1 className="text-4xl font-secondary tracking-wider font-bold md:text-6xl text-background">
						{title}
					</h1>
					{caption && (
						<p className="mt-4 text-base md:text-lg lg:text-xl text-white/90 mx-auto max-w-2xl">
							{caption}
						</p>
					)}
				</div>
			</div>
		</SectionContainer>
	);
};

export default Hero;
