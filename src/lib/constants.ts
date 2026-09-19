export const MAX_IMAGE_SIZE = 25 * 1024 * 1024;
export const MAX_IMAGES_PER_PRODUCT = 8;
export const MAX_IMAGE_DIMENSION = 1200;
export const IMAGE_QUALITY = 75;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/tiff",
] as const;
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_PRODUCT_NAME_LENGTH = 200;
export const MAX_CATEGORY_NAME_LENGTH = 100;
export const CURRENCY_SYMBOL = "Rs.";
export const PRODUCT_STATUS = {
  PUBLISHED: "published",
  DRAFT: "draft",
} as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
