import SectionContainer from "@/components/sectioncontainer";
import { H1, H4 } from "@/components/ui/typography";

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
				<div className="rounded-2xl bg-foreground/45 px-4 py-3 text-white">
					<H1 className="text-4xlmd:text-6xl">{title}</H1>
					{caption && <H4 className="mt-2 lg:text-left">{caption}</H4>}
				</div>
			</div>
		</SectionContainer>
	);
};

export default Hero;
