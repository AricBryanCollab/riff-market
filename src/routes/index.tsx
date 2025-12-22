import { createFileRoute } from "@tanstack/react-router";
import Button from "@/components/button";
import Input from "@/components/input";

import SectionContainer from "@/components/sectioncontainer";
import Select from "@/components/select";
import { themeOptions } from "@/constants/themeOptions";
import { useThemeStore } from "@/store/theme";
import { useToastStore } from "@/store/toast";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { showToast } = useToastStore();
	const { theme, setTheme } = useThemeStore();

	return (
		<SectionContainer>
			<h1 className="text-4xl font-secondary font-semibold text-secondary">
				Test Rendering
			</h1>
			<div className="my-6">
				<Button
					action={() => showToast("Test Message for the Toast", "error")}
					variant="primary"
				>
					Test Button
				</Button>
			</div>
			<div className="w-fit">
				<Input inputId="test-123" label="Test" value="" onChange={() => {}} />

				<Select
					options={themeOptions.map((t) => ({
						label: t.label,
						value: t.value,
						icon: t.icon,
					}))}
					value={theme}
					onChangeValue={setTheme}
					label="Select Theme"
					placeholder="Search themes..."
					width="w-48"
					withSearchBar
				/>
			</div>
		</SectionContainer>
	);
}
