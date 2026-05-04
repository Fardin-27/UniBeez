import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { getImageUrl } from "../utils/imageUrl";

const categories = [
  "books", "electronics", "clothing", "stationery",
  "furniture", "sports", "food", "accessories", "other",
];

const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { API_URL } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "1",
    category: "books",
    productCondition: "new",
  });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();
      const p = data.product;
      setForm({
        title: p.title || "",
        description: p.description || "",
        price: String(p.price ?? ""),
        quantity: String(p.quantity ?? "1"),
        category: p.category || "books",
        productCondition: p.productCondition || "new",
      });
      setExistingImages(p.images || []);
    } catch {
      navigate("/my-products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append("existingImages", JSON.stringify(existingImages));
      newImages.forEach((img) => formData.append("images", img));

      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update product");
      navigate("/my-products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const removeExistingImage = (idx: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx: number) => {
    setNewImages(newImages.filter((_, i) => i !== idx));
  };

  if (loading) return <LoadingSpinner text="Loading product..." />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Edit Product</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-5">
        {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100 font-medium">{error}</div>}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
          <input type="text" required value={form.title} onChange={set("title")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea required value={form.description} onChange={set("description")} rows={4}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (৳)</label>
            <input type="number" required min="0" step="0.01" value={form.price} onChange={set("price")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label>
            <input type="number" required min="1" value={form.quantity} onChange={set("quantity")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
            <select value={form.category} onChange={set("category")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all">
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condition</label>
            <select value={form.productCondition} onChange={set("productCondition")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all">
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Images</label>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div className="flex gap-3 mb-3 flex-wrap">
              {existingImages.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">&times;</button>
                </div>
              ))}
            </div>
          )}

          {/* New image upload */}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewImages([...newImages, ...Array.from(e.target.files || [])])}
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold hover:file:bg-brand-100 file:transition-colors file:cursor-pointer"
          />

          {/* New image previews */}
          {newImages.length > 0 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {newImages.map((file, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-brand-200 shadow-sm">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/my-products")}
            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all duration-300 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 shadow-sm hover:shadow-glow transition-all duration-300 text-sm"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage;
