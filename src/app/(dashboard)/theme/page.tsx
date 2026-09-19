import { redirect } from "next/navigation";
import { getThemeData } from "@/app/api/theme/actions";
import ThemeClient from "./theme-client";

export const dynamic = "force-dynamic";

export default async function ThemePage() {
  const { themeConfig, products, storeName, storeSlug } = await getThemeData();
  if (!storeName) redirect("/dashboard");
  return <ThemeClient initialConfig={themeConfig} products={products} storeName={storeName} storeSlug={storeSlug} />;
}
