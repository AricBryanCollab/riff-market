import {
	CheckCircle,
	Heart,
	Pencil,
	ShoppingCart,
	Trash2,
	XCircle,
} from "lucide-react";

export const RoleActionConfigs = {
	CUSTOMER: [
		{
			icon: ShoppingCart,
			label: "Add to Cart",
			variant: "primary" as const,
			onClickKey: "addToCart" as const,
		},
		{
			icon: Heart,
			label: "",
			variant: "secondary" as const,
			onClickKey: "toggleFavorite" as const,
		},
	],
	SELLER: [
		{
			icon: Pencil,
			label: "Edit",
			variant: "primary" as const,
			onClickKey: "edit" as const,
		},
		{
			icon: Trash2,
			label: "Delete",
			variant: "destructive" as const,
			onClickKey: "delete" as const,
		},
	],
	ADMIN: [
		{
			icon: CheckCircle,
			label: "Accept",
			variant: "success" as const,
			onClickKey: "approve" as const,
		},
		{
			icon: XCircle,
			label: "Decline",
			variant: "destructive" as const,
			onClickKey: "decline" as const,
		},
	],
} as const;

export type RoleActionVariant =
	(typeof RoleActionConfigs)[keyof typeof RoleActionConfigs][number]["variant"];
