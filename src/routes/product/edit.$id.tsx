import {
	createFileRoute,
	useNavigate,
	useParams,
} from "@tanstack/react-router";
import { Camera, FileMusic } from "lucide-react";
import Button from "@/components/button";
import Counter from "@/components/counter";
import { ProductDetailErrorState } from "@/components/errorstates";
import ImageUploader from "@/components/imageuploader";
import Input from "@/components/input";
import { ProductLoadingState } from "@/components/loadingstates";
import NumberInput from "@/components/numberinput";
import SectionContainer from "@/components/sectioncontainer";
import Select from "@/components/select";
import TextArea from "@/components/textarea";
import { Body, H4 } from "@/components/typography";
import { productCategoryOptions } from "@/constants/selectOptions";
import useUpdateProduct from "@/hooks/useUpdateProduct";

export const Route = createFileRoute("/product/edit/$id")({
	component: RouteComponent,
});

function RouteComponent() {
	const { id } = useParams({ from: "/product/edit/$id" });
	const navigate = useNavigate();

	const {
		productData,
		loadingProduct,
		isErrorProduct,
		onChange,
		refetchProductDetails,
	} = useUpdateProduct(id);

	if (!productData || isErrorProduct) {
		return <ProductDetailErrorState refetch={refetchProductDetails} />;
	}

	if (loadingProduct) {
		return <ProductLoadingState />;
	}

	return (
		<SectionContainer>
			<div className="my-4 max-w-6xl flex flex-col gap-3">
				<H4>Edit Your Product Information</H4>
				<Body>
					Fill up the form to edit your product. Please note that after
					submitting your changes, your product will be set to pending status
					and will require approval from the RiffMarket App admin before it
					becomes visible in the marketplace again.
				</Body>
				<Body className="text-accent font-semibold">
					Important Note: If you upload new images, your previous product photos
					will be permanently deleted and replaced with the new ones.
				</Body>
			</div>

			<form onSubmit={() => {}}>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					<Input
						inputId="name"
						label="Product Name"
						onChange={onChange}
						value={productData.name}
					/>

					<Input
						inputId="brand"
						label="Product Brand"
						placeholder="eg. Fender, Gibson, Yamaha, Taylor"
						onChange={onChange}
						value={productData.brand}
					/>

					<Input
						inputId="model"
						label="Model Specification"
						placeholder="eg. American Standard, Jimi Hendrix Special Edition"
						onChange={onChange}
						value={productData.model}
					/>

					<Select
						options={productCategoryOptions.map((p) => ({
							label: p.label,
							value: p.value,
							icon: p.icon,
						}))}
						value={productData.category}
						icon={FileMusic}
						onChangeValue={() => {}}
						label="Product Classification"
					/>

					<TextArea
						inputId="description"
						label="Product Description"
						value={""}
						onChange={() => {}}
						placeholder="Please provide a description for the product you want to sell. This gives the customer insights about the instrument/gear/accessory you want to sell."
						maxLength={200}
						resize="none"
						showCounter
						rows={5}
					/>

					<div className="lg:col-span-1">
						<Counter
							inputId="stock"
							label="Stock Quantity"
							value={0}
							onChange={() => {}}
							min={0}
							max={10}
							showInput={true}
						/>

						<NumberInput
							inputId="price"
							label="Product Price Per Unit"
							value={0}
							decimalPlaces={2}
							onChange={() => {}}
						/>
					</div>
				</div>

				<div className="mt-6 ">
					<ImageUploader
						inputId="images"
						label="Product Photos"
						images={[]}
						onChange={() => {}}
						maxImages={5}
						maxSizeMB={5}
						icon={Camera}
					/>
				</div>

				<div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start md:justify-end">
					<Button
						loading={false}
						variant="outline"
						type="button"
						action={() => navigate({ to: `/products/${id}` })}
					>
						Go Back
					</Button>
					<Button loading={false} variant="primary" type="submit">
						Update My Product
					</Button>
				</div>
			</form>
		</SectionContainer>
	);
}
