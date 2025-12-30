import {
	ArrowLeft,
	ArrowRight,
	DollarSign,
	Filter,
	Package,
	Star,
	Tag,
} from "lucide-react";
import { useState } from "react";
import { useSidebarStore } from "@/store/sidebar";

const ShopSidebar = () => {
	const { isExpanded, toggleSidebar } = useSidebarStore();

	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
	const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
	const [priceMin, setPriceMin] = useState<string>("");
	const [priceMax, setPriceMax] = useState<string>("");

	const clearAllFilters = () => {
		setSelectedCategories([]);
		setSelectedConditions([]);
		setSelectedBrands([]);
		setPriceMin("");
		setPriceMax("");
	};

	const activeFiltersCount =
		selectedCategories.length +
		selectedConditions.length +
		selectedBrands.length +
		(priceMin || priceMax ? 1 : 0);

	return (
		<aside
			className={`shrink-0 border-r border-slate-200 bg-white fixed z-50 h-screen overflow-hidden transition-all duration-300 ease-in-out ${
				isExpanded ? "w-80" : "w-16"
			}`}
		>
			{/* Header */}
			<div
				className={`flex items-center gap-3 px-4 py-6 border-b border-slate-200 ${isExpanded ? "justify-between" : "justify-center"}`}
			>
				{isExpanded && (
					<div className="flex items-center gap-2">
						<h1 className="text-xl font-bold font-secondary tracking-wide text-slate-800">
							RiffMarket
						</h1>
					</div>
				)}
				<button
					type="button"
					className="cursor-pointer bg-primary hover:bg-accent duration-300 transition-all text-white p-2 rounded-lg shadow-sm hover:shadow-md active:scale-95"
					onClick={toggleSidebar}
					aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
				>
					{isExpanded ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
				</button>
			</div>

			{/* Content - Only show when expanded */}
			{isExpanded && (
				<div className="flex flex-col h-[calc(100vh-89px)]">
					{/* Filter Header */}
					<div className="px-4 py-4 border-b border-slate-200 bg-slate-50">
						<div className="flex items-center gap-2">
							<Filter size={18} className="text-slate-600" />
							<h2 className="font-semibold text-slate-700">Filters</h2>
							{activeFiltersCount > 0 && (
								<span className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded-full font-medium">
									{activeFiltersCount}
								</span>
							)}
						</div>
					</div>

					{/* Scrollable Filters */}
					<div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar">
						{/* Category Filter */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Package size={16} className="text-slate-600" />
								<h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
									Category
								</h3>
							</div>
							<div className="space-y-1.5">
								{[
									"Electric Guitars",
									"Acoustic Guitars",
									"Bass Guitars",
									"Amplifiers",
									"Effects Pedals",
									"Strings",
									"Accessories",
								].map((category) => (
									<label
										key={category}
										className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors group"
									>
										<input
											type="checkbox"
											checked={selectedCategories.includes(category)}
											onChange={() => {}}
											className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0"
										/>
										<span className="text-sm text-slate-700 group-hover:text-slate-900">
											{category}
										</span>
									</label>
								))}
							</div>
						</div>

						{/* Price Range Filter */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<DollarSign size={16} className="text-slate-600" />
								<h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
									Price Range
								</h3>
							</div>
							<div className="flex gap-2 items-center">
								<input
									type="number"
									placeholder="Min"
									value={priceMin}
									onChange={(e) => setPriceMin(e.target.value)}
									className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
								/>
								<span className="text-slate-400">—</span>
								<input
									type="number"
									placeholder="Max"
									value={priceMax}
									onChange={(e) => setPriceMax(e.target.value)}
									className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
								/>
							</div>
						</div>

						{/* Condition Filter */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Star size={16} className="text-slate-600" />
								<h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
									Condition
								</h3>
							</div>
							<div className="space-y-1.5">
								{["New", "Like New", "Excellent", "Good", "Fair"].map(
									(condition) => (
										<label
											key={condition}
											className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors group"
										>
											<input
												type="checkbox"
												checked={selectedConditions.includes(condition)}
												onChange={() => {}}
												className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0"
											/>
											<span className="text-sm text-slate-700 group-hover:text-slate-900">
												{condition}
											</span>
										</label>
									),
								)}
							</div>
						</div>

						{/* Brand Filter */}
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Tag size={16} className="text-slate-600" />
								<h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">
									Brand
								</h3>
							</div>
							<div className="space-y-1.5">
								{[
									"Fender",
									"Gibson",
									"Ibanez",
									"PRS",
									"Yamaha",
									"Taylor",
									"Martin",
									"ESP",
								].map((brand) => (
									<label
										key={brand}
										className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors group"
									>
										<input
											type="checkbox"
											checked={selectedBrands.includes(brand)}
											onChange={() => {}}
											className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-2 focus:ring-slate-400 focus:ring-offset-0"
										/>
										<span className="text-sm text-slate-700 group-hover:text-slate-900">
											{brand}
										</span>
									</label>
								))}
							</div>
						</div>
					</div>

					{/* Footer Actions */}
					<div className="px-4 py-4 border-t border-slate-200 bg-slate-50 space-y-2">
						<button
							type="button"
							className="w-full bg-primary text-white px-4 py-2.5 rounded-md hover:bg-accent transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
						>
							<Filter size={16} />
							Apply Filters
						</button>
						<button
							type="button"
							onClick={clearAllFilters}
							disabled={activeFiltersCount === 0}
							className="w-full bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-md hover:bg-slate-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
						>
							Clear All
						</button>
					</div>
				</div>
			)}

			{/* Collapsed State Icons */}
			{!isExpanded && (
				<div className="flex flex-col items-center gap-6 mt-6">
					<div
						className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
						title="Filters"
					>
						<Filter size={20} className="text-slate-600" />
					</div>
					{activeFiltersCount > 0 && (
						<div className="size-6 bg-primary text-white text-xs rounded-full flex items-center justify-center font-semibold">
							{activeFiltersCount}
						</div>
					)}
				</div>
			)}
		</aside>
	);
};

export default ShopSidebar;
