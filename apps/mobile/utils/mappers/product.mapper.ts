import type { ProductApi } from "@repo/types";

type ProductListItem =
    ProductApi.ResponseTypes["GetProductsWithCategory"]["data"]["items"][number];
type ProductListVariant = ProductListItem["variants"][number] & {
    priceWithTax?: number;
    compareAtPriceWithTax?: number | null;
};

type ProductDetail = ProductApi.ResponseTypes["GetProductById"]["data"];
type ProductVariant = ProductDetail["variants"][number];

export interface ProductCardItem {
    id: string;
    title: string;
    image: string;
    rating: number;
    reviews: number;
    price: number;
    originalPrice?: number;
    badge?: "Bestseller";
    variantId?: string;
    canAddToCart: boolean;
}

const PRODUCT_IMAGE_PLACEHOLDER =
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80";

function getVariantImage(variant: ProductVariant): string | null {
    return variant.image?.url || null;
}

function getPrimaryImageFromVariants(variants: ProductVariant[]): string | null {
    const withPrimaryImage = variants.find((variant) => variant.image?.isPrimary);
    if (withPrimaryImage) {
        return getVariantImage(withPrimaryImage);
    }

    const withAnyImage = variants.find((variant) => variant.image?.url);
    return withAnyImage ? getVariantImage(withAnyImage) : null;
}

function getListDisplayPrice(variants: ProductListItem["variants"]): {
    price: number;
    originalPrice?: number;
} {
    const displayVariants = variants.map(
        (variant) => variant as ProductListVariant,
    );
    const sortedByPrice = [...displayVariants].sort(
        (a, b) => (a.priceWithTax ?? a.price) - (b.priceWithTax ?? b.price),
    );
    const preferredVariant = sortedByPrice[0];

    if (!preferredVariant) {
        return { price: 0 };
    }

    const price = preferredVariant.priceWithTax ?? preferredVariant.price;
    const compareAtPrice =
        preferredVariant.compareAtPriceWithTax ?? preferredVariant.compareAtPrice;

    return compareAtPrice && compareAtPrice > price
        ? { price, originalPrice: compareAtPrice }
        : { price };
}

export function mapProductsToCardItems(products: ProductListItem[]): ProductCardItem[] {
    return products.map((product) => {
        const image =
            product.frontImageUrl ||
            getPrimaryImageFromVariants(product.variants) ||
            PRODUCT_IMAGE_PLACEHOLDER;

        const { price, originalPrice } = getListDisplayPrice(product.variants);
        const reviews = product.purchasedCount || 0;

        // Prefer active and in-stock variants for cart actions.
        const purchasableVariant =
            product.variants.find((variant) => variant.isActive && variant.stock > 0) ||
            product.variants.find((variant) => variant.isActive) ||
            product.variants[0];

        const variantId = purchasableVariant?.id;
        const canAddToCart = Boolean(purchasableVariant && purchasableVariant.isActive && purchasableVariant.stock > 0);

        return {
            id: product.id,
            title: product.name,
            image,
            rating: reviews > 0 ? 4.5 : 0,
            reviews,
            price,
            originalPrice,
            badge: reviews >= 20 ? "Bestseller" : undefined,
            variantId,
            canAddToCart,
        };
    });
}

export function mapProductDetailImage(
    product: ProductDetail,
    selectedVariant: ProductVariant | null,
): string {
    return (
        selectedVariant?.image?.url ||
        product.frontImageUrl ||
        getPrimaryImageFromVariants(product.variants) ||
        PRODUCT_IMAGE_PLACEHOLDER
    );
}
