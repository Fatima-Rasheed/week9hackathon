'use client';

import { X, ShoppingCart, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cartContext';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-900 text-lg">Your Cart</h2>
            {totalItems > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-medium text-gray-500">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add products to get started</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map(({ product, quantity }) => (
                <li key={product._id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                  {/* Image */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=ef4444&color=fff&size=56`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">💊</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</p>
                    <p className="text-xs text-gray-400 mb-2">{product.category}</p>
                    <div className="flex items-center justify-between">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(product._id, quantity - 1)}
                          className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:border-red-300 hover:text-red-500 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold text-gray-800 w-5 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product._id, quantity + 1)}
                          className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center hover:border-red-300 hover:text-red-500 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-red-600">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(product._id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-red-600">${totalPrice.toFixed(2)}</span>
            </div>
            <button className="w-full py-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-red-200">
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
