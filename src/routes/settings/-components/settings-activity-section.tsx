import type { UserRole } from "@/types/enum";
import { SettingsOrdersSection } from "./settings-orders-section";
import { SettingsSellerProductsSection } from "./settings-seller-products-section";

export function SettingsActivitySection({ userRole }: { userRole: UserRole }) {
	if (userRole === "CUSTOMER") {
		return <CustomerSettingsActivity />;
	}

	if (userRole === "SELLER") {
		return <SellerSettingsActivity />;
	}

	return null;
}

function CustomerSettingsActivity() {
	return <SettingsOrdersSection userRole="CUSTOMER" />;
}

function SellerSettingsActivity() {
	return (
		<>
			<SettingsOrdersSection userRole="SELLER" />
			<SettingsSellerProductsSection />
		</>
	);
}
