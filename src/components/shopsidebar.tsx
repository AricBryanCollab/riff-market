import {
	ArrowLeft,
	ArrowRight,
	DollarSign,
	Filter,
	Package,
	Star,
	Tag,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	productCategoryOptions,
	productConditionOptions,
} from "@/constants/selectOptions";
import { useProductStore } from "@/store/products";
import { useSidebarStore } from "@/store/sidebar";

const POPULAR_BRANDS = [
	"Fender",
	"Gibson",
	"Ibanez",
	"PRS",
	"Yamaha",
	"Taylor",
	"Squeir",
	"Epiphone",
];

const ShopSidebar = () => {
	const { isExpanded, toggleSidebar } = useSidebarStore();

	const filters = useProductStore((state) => state.filters);
	const setCategory = useProductStore((state) => state.setCategory);
	const setCondition = useProductStore((state) => state.setCondition);
	const setBrand = useProductStore((state) => state.setBrand);
	const setPriceRange = useProductStore((state) => state.setPriceRange);
	const resetFilters = useProductStore((state) => state.resetFilters);

	const activeFiltersCount =
		(filters.category ? 1 : 0) +
		(filters.condition ? 1 : 0) +
		(filters.brand ? 1 : 0) +
		(filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0);

	const handlePriceMinChange = (value: string) => {
		const min = value ? Number(value) : undefined;
		setPriceRange(min, filters.priceMax);
	};

	const handlePriceMaxChange = (value: string) => {
		const max = value ? Number(value) : undefined;
		setPriceRange(filters.priceMin, max);
	};

	return (
		<aside
			className={`shrink-0 border-r bg-background fixed z-50 h-screen overflow-hidden transition-all duration-300 ease-in-out ${
				isExpanded ? "w-80" : "w-16"
			}`}
		>
			<div
				className={`flex items-center gap-3 px-4 py-6 border-b ${isExpanded ? "justify-between" : "justify-center"}`}
			>
				{isExpanded && (
					<div className="flex items-center gap-2">
						<h1 className="text-xl font-bold tracking-wide">RiffMarket</h1>
					</div>
				)}
				<Button
					variant="default"
					size="icon"
					onClick={toggleSidebar}
					aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
				>
					{isExpanded ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
				</Button>
			</div>

			{isExpanded && (
				<div className="flex flex-col h-[calc(100vh-89px)]">
					<div className="px-4 py-4 border-b bg-muted/50">
						<div className="flex items-center gap-2">
							<Filter size={18} className="text-muted-foreground" />
							<h2 className="font-semibold">Filters</h2>
							{activeFiltersCount > 0 && (
								<Badge variant="default" className="ml-auto">
									{activeFiltersCount}
								</Badge>
							)}
						</div>
					</div>

					{/* Scrollable Filters */}
					<ScrollArea className="flex-1">
						<div className="px-4 py-4 space-y-6">
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Package size={16} className="text-muted-foreground" />
										<h3 className="font-semibold text-sm uppercase tracking-wide">
											Category
										</h3>
									</div>
									{filters.category && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setCategory(undefined)}
											className="h-6 px-2"
										>
											<X size={14} />
										</Button>
									)}
								</div>
								<div className="space-y-2">
									{productCategoryOptions.map((category) => (
										<div
											key={category.value}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={`category-${category.value}`}
												checked={filters.category === category.value}
												onCheckedChange={(checked) => {
													setCategory(checked ? category.value : undefined);
												}}
											/>
											<Label
												htmlFor={`category-${category.value}`}
												className="text-sm font-normal cursor-pointer flex items-center gap-2"
											>
												{category.label}
											</Label>
										</div>
									))}
								</div>
							</div>

							<Separator />
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<DollarSign size={16} className="text-muted-foreground" />
										<h3 className="font-semibold text-sm uppercase tracking-wide">
											Price Range
										</h3>
									</div>
									{(filters.priceMin !== undefined ||
										filters.priceMax !== undefined) && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setPriceRange(undefined, undefined)}
											className="h-6 px-2"
										>
											<X size={14} />
										</Button>
									)}
								</div>
								<div className="flex gap-2 items-center">
									<Input
										type="number"
										placeholder="Min"
										value={filters.priceMin ?? ""}
										onChange={(e) => handlePriceMinChange(e.target.value)}
										className="flex-1"
									/>
									<span className="text-muted-foreground">—</span>
									<Input
										type="number"
										placeholder="Max"
										value={filters.priceMax ?? ""}
										onChange={(e) => handlePriceMaxChange(e.target.value)}
										className="flex-1"
									/>
								</div>
								{(filters.priceMin !== undefined ||
									filters.priceMax !== undefined) && (
									<p className="text-xs text-muted-foreground">
										{filters.priceMin !== undefined && `$${filters.priceMin}`}
										{filters.priceMin !== undefined &&
											filters.priceMax !== undefined &&
											" - "}
										{filters.priceMax !== undefined && `$${filters.priceMax}`}
									</p>
								)}
							</div>

							<Separator />
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Star size={16} className="text-muted-foreground" />
										<h3 className="font-semibold text-sm uppercase tracking-wide">
											Condition
										</h3>
									</div>
									{filters.condition && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setCondition(undefined)}
											className="h-6 px-2"
										>
											<X size={14} />
										</Button>
									)}
								</div>
								<div className="space-y-2">
									{productConditionOptions.map((condition) => (
										<div
											key={condition.value}
											className="flex items-center space-x-2"
										>
											<Checkbox
												id={`condition-${condition.value}`}
												checked={filters.condition === condition.value}
												onCheckedChange={(checked) => {
													setCondition(checked ? condition.value : undefined);
												}}
											/>
											<Label
												htmlFor={`condition-${condition.value}`}
												className="text-sm font-normal cursor-pointer"
											>
												{condition.label}
											</Label>
										</div>
									))}
								</div>
							</div>

							<Separator />

							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Tag size={16} className="text-muted-foreground" />
										<h3 className="font-semibold text-sm uppercase tracking-wide">
											Brand
										</h3>
									</div>
									{filters.brand && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setBrand(undefined)}
											className="h-6 px-2"
										>
											<X size={14} />
										</Button>
									)}
								</div>
								<div className="space-y-2">
									<Input
										type="text"
										placeholder="Search brands..."
										value={filters.brand ?? ""}
										onChange={(e) => setBrand(e.target.value || undefined)}
										className="w-full"
									/>
									<div className="text-xs text-muted-foreground">
										Popular brands:
									</div>
									<div className="flex flex-wrap gap-1.5">
										{POPULAR_BRANDS.map((brand) => (
											<Badge
												key={brand}
												variant={
													filters.brand === brand ? "default" : "outline"
												}
												className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
												onClick={() =>
													setBrand(filters.brand === brand ? undefined : brand)
												}
											>
												{brand}
											</Badge>
										))}
									</div>
								</div>
							</div>
						</div>
						<div className="px-4 py-4 border-t bg-muted/50 space-y-2">
							<Button
								variant="outline"
								className="w-full"
								onClick={resetFilters}
								disabled={activeFiltersCount === 0}
							>
								<X size={16} className="mr-2" />
								Clear All Filters
							</Button>
						</div>
					</ScrollArea>
				</div>
			)}

			{!isExpanded && (
				<div className="flex flex-col items-center gap-6 mt-6">
					<Button
						variant="ghost"
						size="icon"
						className="relative"
						title="Filters"
					>
						<Filter size={20} />
						{activeFiltersCount > 0 && (
							<Badge
								variant="default"
								className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
							>
								{activeFiltersCount}
							</Badge>
						)}
					</Button>
				</div>
			)}
		</aside>
	);
};

export default ShopSidebar;
