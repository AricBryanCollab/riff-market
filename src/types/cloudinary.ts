export interface CloudinaryImageRef {
	url: string;
	publicId: string;
}

export type CloudinaryImageSource = string | CloudinaryImageRef;
