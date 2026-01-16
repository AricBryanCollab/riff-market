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
			requiresStock: true,
			onClickKey: "addToCart" as const,
		},
		{
			icon: Heart,
			label: "",
			variant: "secondary" as const,
			requiresStock: false,
			onClickKey: "toggleFavorite" as const,
		},
	],
	SELLER: [
		{
			icon: Pencil,
			label: "Edit",
			variant: "primary" as const,
			requiresStock: true,
			onClickKey: "edit" as const,
		},
		{
			icon: Trash2,
			label: "Delete",
			variant: "destructive" as const,
			requiresStock: true,
			onClickKey: "delete" as const,
		},
	],
	ADMIN: [
		{
			icon: CheckCircle,
			label: "Accept",
			variant: "success" as const,
			requiresStock: true,
			onClickKey: "approve" as const,
		},
		{
			icon: XCircle,
			label: "Decline",
			variant: "destructive" as const,
			requiresStock: true,
			onClickKey: "delete" as const,
		},
	],
} as const;

export const ButtonStyles = {
	primary: "bg-primary hover:bg-accent",
	destructive: "bg-destructive hover:bg-rose-400",
	success: "bg-success hover:bg-emerald-300",
	secondary: "bg-slate-200 hover:bg-slate-300",
} as const;
