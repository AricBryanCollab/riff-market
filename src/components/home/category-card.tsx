import { Link } from "@tanstack/react-router";
import {
	AudioWaveform,
	Guitar,
	Headphones,
	KeyboardMusic,
	type LucideIcon,
	Music,
	PlugZap,
} from "lucide-react";
import type { ListingCategoryMeta } from "@/domains/listings/dto/listing-view";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
	category: ListingCategoryMeta;
}

const ICON_MAP: Record<string, LucideIcon> = {
	PlugZap,
	Guitar,
	KeyboardMusic,
	AudioWaveform,
	Headphones,
};

const OPTICAL_OFFSET: Record<string, string> = {
	PlugZap: "translate-x-px",
};

const CategoryCard = ({ category }: CategoryCardProps) => {
	const Icon = ICON_MAP[category.icon] ?? Music;

	return (
		<Link
			to="/shop"
			search={{ category: category.category }}
			className="group flex items-center gap-4 p-4 rounded-xl ring-1 ring-foreground/10 shadow-xs hover:ring-foreground/20 transition-shadow"
		>
			<div className="p-2.5 rounded-lg bg-muted group-hover:bg-foreground group-hover:text-background transition-colors">
				<Icon className={cn("size-6", OPTICAL_OFFSET[category.icon])} />
			</div>
			<div>
				<h3 className="font-medium text-foreground">{category.label}</h3>
				<p className="text-sm text-muted-foreground">
					{category.count} listings
				</p>
			</div>
		</Link>
	);
};

export default CategoryCard;
