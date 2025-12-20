import { createFileRoute } from "@tanstack/react-router";
import Button from "@/components/button";
import Dialog from "@/components/dialog";
import Input from "@/components/input";
import Navbar from "@/components/navbar";
import Select from "@/components/select";

import { useDialogStore } from "@/store/dialog";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { setOpenDialog } = useDialogStore();

	return (
		<div className="h-screen bg-[#f3f3f2]">
			<Navbar />
			<section className="relative py-20 px-6 text-center">
				<h1 className="text-4xl font-secondary font-semibold text-secondary">
					Test Rendering
				</h1>
				<div className="my-6">
					<Button action={() => setOpenDialog("test")} variant="primary">
						Test Button
					</Button>
				</div>
				<div className="w-fit">
					{/** biome-ignore lint/correctness/useUniqueElementIds: temporary just for test */}
					<Input id="test-123" label="Test" value="" onChange={() => {}} />

					<Select
						options={["Option 1", "Option 2", "Option 3"]}
						onChangeValue={() => {}}
						value=""
					/>
				</div>
				<Dialog type="test" title="Test Dialog">
					<p>Sample Dialog is rendered here</p>
				</Dialog>
			</section>
		</div>
	);
}
