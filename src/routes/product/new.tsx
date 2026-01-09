import { createFileRoute } from "@tanstack/react-router";
import { Camera, FileMusic } from "lucide-react";
import Button from "@/components/button";
import { Counter } from "@/components/counter";
import ImageUploader from "@/components/imageuploader";
import Input from "@/components/input";
import NumberInput from "@/components/numberinput";
import SectionContainer from "@/components/sectioncontainer";
import Select from "@/components/select";
import TextArea from "@/components/textarea";
import { Body, H4 } from "@/components/typography";
import { productCategoryOptions } from "@/constants/selectOptions";

export const Route = createFileRoute("/product/new")({
	component: RouteComponent,
});

function RouteComponent() {
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
			<form>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					<Input
						inputId="name"
						label="Product Name"
						onChange={() => {}}
						value=""
					/>

					<Input
						inputId="brand"
						label="Product Brand"
						placeholder="eg. Fender, Gibson, Yamaha, Taylor"
						onChange={() => {}}
						value=""
					/>

					<Input
						inputId="model"
						label="Model Specification"
						placeholder="eg. American Standard, Jimi Hendrix Special Edition"
						onChange={() => {}}
						value=""
					/>

					<Select
						options={productCategoryOptions.map((p) => ({
							label: p.label,
							value: p.value,
							icon: p.icon,
						}))}
						value=""
						icon={FileMusic}
						onChangeValue={() => {}}
						label="Product Classification"
					/>

					<TextArea
						inputId="description"
						label="Product Description"
						value=""
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
							max={30}
							step={1}
							showInput={true}
						/>

						<NumberInput
							inputId="price"
							label="Product Price Per Unit"
							value={100}
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
						disabled={false}
					/>
				</div>

				<div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-start md:justify-end">
					<Button variant="outline" type="button">
						Clear
					</Button>
					<Button variant="primary" type="submit">
						Add Product
					</Button>
				</div>
			</form>
		</SectionContainer>
	);
}
