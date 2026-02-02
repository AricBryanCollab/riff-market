const Footer = () => {
	const currentYear = new Date().getFullYear();
	return (
		<footer className="border-t-2 border-muted">
			<div className="container mx-auto px-4 py-8">
				<div className="text-center text-sm text-muted-foreground">
					<p>© {currentYear} RiffMarket. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
