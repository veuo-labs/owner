import { categoriesAction } from "@/app/api/categories/actions";
import { ProductForm } from "@/components/product-form";
import { redirect } from "next/navigation";

export default async function NewProductPage() {
  const { categories } = await categoriesAction();
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Add product</h1>
      <ProductForm categories={categories ?? []} mode="create" />
    </div>
  );
}
