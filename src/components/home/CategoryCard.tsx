import { Link } from "@tanstack/react-router";
import { type LucideIcon, Mic2, Music, Piano, Zap } from "lucide-react";
import type { CategoryMeta } from "@/types/product";

interface CategoryCardProps {
	category: CategoryMeta;
}

const ICON_MAP: Record<string, LucideIcon> = {
	Zap,
	Music,
	Piano,
	Mic2,
};

const CategoryCard = ({ category }: CategoryCardProps) => {
	const Icon = ICON_MAP[category.icon] ?? Music;

	return (
		<Link
			to="/shop"
			search={{ category: category.category }}
			className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-foreground transition-colors"
		>
			<div className="p-3 rounded-lg bg-muted group-hover:bg-foreground group-hover:text-background transition-colors">
				<Icon className="w-5 h-5" />
			</div>
			<div>
				<h3 className="font-medium text-foreground">{category.label}</h3>
				<p className="text-sm text-muted-foreground">{category.count} listings</p>
			</div>
		</Link>
	);
};

export default CategoryCard;
