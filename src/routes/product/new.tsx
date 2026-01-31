import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import Counter from "@/components/counter";
import { FormField } from "@/components/form-field";
import { FormTextArea } from "@/components/form-textarea";
import ImageUploader from "@/components/imageuploader";
import { NumberField } from "@/components/number-field";
import { SearchableSelect } from "@/components/searchable-select";
import SectionContainer from "@/components/sectioncontainer";
import { Body, H4 } from "@/components/ui/typography";
import { LoadingButton } from "@/components/ui/loading-button";
import {
	productCategoryOptions,
	productConditionOptions,
} from "@/constants/selectOptions";
import useCreateProduct from "@/hooks/useCreateProduct";
import type { ProductCategory, ProductCondition } from "@/types/enum";
import { requireRole } from "@/utils/requireRole";

export const Route = createFileRoute("/product/new")({
	beforeLoad: () => requireRole(["SELLER", "ADMIN"]),
	component: RouteComponent,
});

function RouteComponent() {
	const {
		product,
		images,
		loading,
		onChange,
		onSelectChange,
		onQuantityChange,
		onImagesChange,
		clearCreateProductForm,
		handleSubmit,
	} = useCreateProduct();

	return (
		<SectionContainer>
			<div className="my-4 max-w-6xl flex flex-col gap-3">
				<H4>Add A New Product To Sell</H4>
				<Body>
					Fill up the form to add the product. RiffMarket App admin would check
					and approve the product if it is valid to be sold in our community
					marketplace.
				</Body>
			</div>
			<form onSubmit={handleSubmit}>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					<FormField
						id="name"
						label="Product Name"
						onChange={onChange}
						value={product.name}
					/>

					<FormField
						id="brand"
						label="Product Brand"
						placeholder="eg. Fender, Gibson, Yamaha, Taylor"
						onChange={onChange}
						value={product.brand}
					/>

					<FormField
						id="model"
						label="Model Specification"
						placeholder="eg. American Standard, Jimi Hendrix Special Edition"
						onChange={onChange}
						value={product.model}
					/>

					<FormTextArea
						id="description"
						label="Product Description"
						value={product.description}
						onChange={onChange}
						placeholder="Please provide a description for the product you want to sell. This gives the customer insights about the instrument/gear/accessory you want to sell."
						maxLength={200}
						showCounter
						rows={5}
					/>

					<div className="lg:col-span-1">
						<SearchableSelect
							options={productCategoryOptions.map((p) => ({
								label: p.label,
								value: p.value,
							}))}
							value={product.category}
							onValueChange={(value: string) =>
								onSelectChange("category", value as ProductCategory)
							}
							label="Product Classification"
						/>

						<SearchableSelect
							options={productConditionOptions.map((p) => ({
								label: p.label,
								value: p.value,
							}))}
							value={product.condition}
							onValueChange={(value: string) =>
								onSelectChange("condition", value as ProductCondition)
							}
							label="Product Condition"
						/>
					</div>

					<div className="lg:col-span-1">
						<Counter
							inputId="stock"
							label="Stock Quantity"
							value={product.stock}
							onChange={onQuantityChange}
							min={0}
							max={10}
							showInput={true}
						/>

						<NumberField
							id="price"
							label="Product Price Per Unit"
							value={product.price}
							onChange={onChange}
						/>
					</div>
				</div>

				<div className="mt-6 ">
					<ImageUploader
						inputId="images"
						label="Product Photos"
						images={images}
						onChange={onImagesChange}
						maxImages={5}
						maxSizeMB={5}
						icon={Camera}
					/>
				</div>

				<div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start md:justify-end">
					<LoadingButton
						loading={loading}
						variant="outline"
						type="button"
						onClick={clearCreateProductForm}
					>
						Clear
					</LoadingButton>
					<LoadingButton loading={loading} type="submit">
						Add Product
					</LoadingButton>
				</div>
			</form>
		</SectionContainer>
	);
}
