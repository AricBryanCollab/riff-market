export type ImageAssetRef = {
	readonly url: string;
	readonly publicId: string;
};

export type CleanupImageAssetRef = {
	readonly url: string;
	readonly provider: string;
	readonly assetType: string;
	readonly providerAssetId: string;
};
