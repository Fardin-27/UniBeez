// Admin & Feedback module
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminFlaggedPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [flaggedProducts, setFlaggedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/flagged`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setFlaggedProducts(data.flaggedProducts || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const unflagProduct = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/flag/product/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isFlagged: false, flagReason: "" }),
      });
      if (res.ok) {
        setFlaggedProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch { /* ignore */ }
  };

  if (loading) return <LoadingSpinner text="Loading flagged content..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Flagged Content</h1>

      {/* Flagged Products */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-5">
          Flagged Products ({flaggedProducts.length})
        </h2>
        {!flaggedProducts.length ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-card">
            <p className="text-slate-400 font-medium">No flagged products</p>
          </div>
        ) : (
          <div className="space-y-4">
            {flaggedProducts.map((p: any) => (
              <div key={p._id} className="bg-white border border-slate-100 rounded-2xl shadow-card p-5 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{p.title}</h3>
                  <p className="text-sm text-slate-400 capitalize mt-0.5">{p.category} — ৳{p.price}</p>
                  <p className="text-sm text-red-500 mt-1.5 font-medium">Reason: {p.flagReason}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Seller: {typeof p.seller === "object" ? p.seller.fullName : p.seller}
                  </p>
                </div>
                <button onClick={() => unflagProduct(p._id)}
                  className="px-4 py-2 bg-emerald-50 text-emerald-600 text-sm rounded-xl font-semibold hover:bg-emerald-100 border border-emerald-100 transition-all">
                  Unflag
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFlaggedPage;
