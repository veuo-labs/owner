import { productByIdAction, categoriesAction } from "@/app/api/categories/actions";
import { ProductForm } from "@/components/product-form";
import { notFound, redirect } from "next/navigation";

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { product } = await productByIdAction(id);
  if (!product) notFound();

  const { categories } = await categoriesAction();
  const { variants } = await productVariantsAction(id);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Edit product</h1>
      <ProductForm product={product} categories={categories ?? []} variants={variants ?? []} mode="edit" />
    </div>
  );
}

async function productVariantsAction(productId: string) {
  try {
    const res = await fetch(`/api/product-variants?productId=${productId}`);
    const json = await res.json();
    return json.variants || [];
  } catch {
    return [];
  }
}
