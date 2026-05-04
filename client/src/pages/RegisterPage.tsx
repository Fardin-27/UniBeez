import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register({
        username: form.username,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-glow">
            <span className="text-white font-extrabold text-xl">U</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create your account</h1>
          <p className="text-slate-400 mt-2">Join the UniSphere campus community</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-card border border-slate-100 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100 font-medium">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
              <input
                type="text"
                required
                value={form.username}
                onChange={set("username")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={set("fullName")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all placeholder:text-slate-400"
              placeholder="you@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={set("password")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all placeholder:text-slate-400"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 shadow-sm hover:shadow-glow transition-all duration-300 text-sm"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
