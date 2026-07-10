export interface AccountProfilePictureAsset {
	readonly url: string;
	readonly publicId: string;
}

export interface AccountProfilePictureUpdateResult {
	readonly profilePic: string | null;
}
