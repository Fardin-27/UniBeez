// Product & Transaction module
import React, { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import type { CartItem } from "../types";

interface CartContextType {
  items: CartItem[];
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  getCartQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { API_URL, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const fetchCart = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/cart`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.cart?.items || []);
      }
    } catch {
      // silently fail
    }
  }, [API_URL, user]);

  const addToCart = async (productId: string, quantity = 1) => {
    const res = await fetch(`${API_URL}/api/cart/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ productId, quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setItems(data.cart?.items || []);
  };

  const removeFromCart = async (productId: string) => {
    const res = await fetch(`${API_URL}/api/cart/remove/${productId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setItems(data.cart?.items || []);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const res = await fetch(`${API_URL}/api/cart/update/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ quantity }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setItems(data.cart?.items || []);
  };

  const clearCart = async () => {
    await fetch(`${API_URL}/api/cart/clear`, {
      method: "DELETE",
      credentials: "include",
    });
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getCartQuantity = useCallback((productId: string) => {
    const item = items.find(
      (i) => (typeof i.product === "object" ? i.product._id : i.product) === productId
    );
    return item ? item.quantity : 0;
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, fetchCart, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, getCartQuantity }}
    >
      {children}
    </CartContext.Provider>
  );
};
