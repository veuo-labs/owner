"use client";

import { useEffect, useState } from "react";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  productCount?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    try {
      setError(null);
      const res = await fetch("/api/categories");
      const json = await res.json();
      setCategories(json.categories || []);
    } catch (e) {
      setError("Failed to load categories");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (json.category) {
        setNewName("");
        setAdding(false);
        loadCategories();
      } else {
        setError(json.error || "Failed to create category");
      }
    } catch (e) {
      setError("Failed to create category");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success !== false) loadCategories();
      else setError(json.error || "Failed to delete");
    } catch (e) {
      setError("Failed to delete");
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName.trim() }),
      });
      const json = await res.json();
      if (json.category) {
        setEditingId(null);
        loadCategories();
      } else {
        setError(json.error || "Failed to rename");
      }
    } catch (e) {
      setError("Failed to rename");
    }
  }

  function sortedCategories(): CategoryItem[] {
    return [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize products into categories.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground mt-6">Loading...</div>
      ) : sortedCategories().length === 0 && !adding ? (
        <div className="rounded-lg border border-border p-8 text-center mt-6">
          <p className="text-muted-foreground mb-4">No categories yet. Add your first category.</p>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add category
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border divide-y divide-border mt-6">
            {sortedCategories().map((category, index) => (
              <div key={category.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    disabled={index === 0}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
                    title="Move up"
                    onClick={() => {
                      const cats = [...categories];
                      const swapIndex = index - 1;
                      [cats[index], cats[swapIndex]] = [cats[swapIndex], cats[index]];
                      setCategories(cats);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                  </button>
                  <button
                    disabled={index === categories.length - 1}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
                    title="Move down"
                    onClick={() => {
                      const cats = [...categories];
                      const swapIndex = index + 1;
                      [cats[index], cats[swapIndex]] = [cats[swapIndex], cats[index]];
                      setCategories(cats);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                </div>

                {editingId === category.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleRename(category.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button onClick={() => handleRename(category.id)} disabled={loading} className="text-sm text-primary font-medium hover:text-primary/80">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-medium truncate">{category.name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground shrink-0">
                        {category.productCount ?? 0} {(category.productCount ?? 0) === 1 ? "product" : "products"}
                      </span>
                    </div>
                  </div>
                )}

                {editingId !== category.id && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditingId(category.id); setEditName(category.name); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Rename</button>
                    <button onClick={() => handleDelete(category.id)} className="text-xs text-muted-foreground hover:text-red-600 transition-colors">Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {adding ? (
            <form onSubmit={handleAdd} className="flex items-center gap-2 mt-4">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="Category name" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary" />
              <button type="submit" disabled={loading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{loading ? "Adding..." : "Add"}</button>
              <button type="button" onClick={() => setAdding(false)} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">Cancel</button>
            </form>
          ) : (
            <button onClick={() => setAdding(true)} className="text-sm text-primary font-medium hover:text-primary/80 mt-4">+ Add category</button>
          )}
        </>
      )}
    </div>
  );
}
