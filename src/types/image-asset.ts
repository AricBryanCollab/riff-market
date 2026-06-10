export type ImageAssetRef = {
	url: string;
	publicId: string;
};

export type CleanupImageAssetRef = {
	url: string;
	provider: string;
	assetType: string;
	providerAssetId: string;
};
