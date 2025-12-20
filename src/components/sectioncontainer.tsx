const SectionContainer = ({ children }: { children: React.ReactNode }) => {
	return (
		<section className="relative mx-auto max-w-7xl items-center justify-between px-4 py-8">
			{children}
		</section>
	);
};

export default SectionContainer;
