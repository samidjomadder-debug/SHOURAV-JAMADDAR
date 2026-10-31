import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  SlidersHorizontal,
  History,
  AlertTriangle,
  Barcode,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Product, Category, UnitType, StockMovement } from '../../types';

export const ProductsView: React.FC = () => {
  const { activeBusiness, currentUser, lang, t, refreshData, showToast, dataVersion } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState('Stock Count Correction');

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  // Category Management State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNameBn, setNewCatNameBn] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formNameBn, setFormNameBn] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinAlert, setFormMinAlert] = useState<number>(5);
  const [formUnit, setFormUnit] = useState<UnitType>('pcs');

  // Raw data
  const products = useMemo(() => db.getProducts(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const categories = useMemo(() => db.getCategories(activeBusiness.id), [activeBusiness.id, dataVersion]);
  const stockMovements = useMemo(
    () => db.getStockMovements(activeBusiness.id, historyProduct ? historyProduct.id : undefined),
    [activeBusiness.id, historyProduct, dataVersion]
  );

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(term) ||
        (p.nameBn && p.nameBn.includes(term)) ||
        p.sku.toLowerCase().includes(term) ||
        p.barcode.includes(term);

      let matchStock = true;
      if (stockStatusFilter === 'low') matchStock = p.stock > 0 && p.stock <= p.minStockAlert;
      else if (stockStatusFilter === 'out') matchStock = p.stock <= 0;

      return matchCat && matchSearch && matchStock;
    });
  }, [products, selectedCategory, searchTerm, stockStatusFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormNameBn('');
    setFormSku('SKU-' + Math.floor(1000 + Math.random() * 9000));
    setFormBarcode(String(894000000000 + Math.floor(Math.random() * 999999)));
    setFormCategoryId(categories[0]?.id || '');
    setFormPurchasePrice(0);
    setFormSellingPrice(0);
    setFormStock(10);
    setFormMinAlert(5);
    setFormUnit('pcs');
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormNameBn(p.nameBn || '');
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategoryId(p.categoryId);
    setFormPurchasePrice(p.purchasePrice);
    setFormSellingPrice(p.sellingPrice);
    setFormStock(p.stock);
    setFormMinAlert(p.minStockAlert);
    setFormUnit(p.unit);
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const prod: Product = {
      id: editingProduct ? editingProduct.id : 'prod-' + Date.now(),
      businessId: activeBusiness.id,
      name: formName,
      nameBn: formNameBn || formName,
      sku: formSku,
      barcode: formBarcode,
      categoryId: formCategoryId || categories[0]?.id || 'cat-general',
      purchasePrice: formPurchasePrice,
      sellingPrice: formSellingPrice,
      stock: formStock,
      minStockAlert: formMinAlert,
      unit: formUnit,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveProduct(prod, currentUser.id, currentUser.name);
    refreshData();
    setShowProductModal(false);
    showToast(editingProduct ? 'Product updated!' : 'Product added to inventory!', 'success');
  };

  const handleDeleteProduct = (p: Product) => {
    if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
      db.deleteProduct(p.id, activeBusiness.id);
      refreshData();
      showToast('Product deleted.', 'info');
    }
  };

  // Adjust stock
  const openAdjustModal = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustQty(1);
    setAdjustType('add');
    setAdjustReason('Physical Stock Count');
    setShowAdjustModal(true);
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustQty <= 0) return;

    const delta = adjustType === 'add' ? adjustQty : -adjustQty;
    db.adjustStock(
      activeBusiness.id,
      adjustingProduct.id,
      delta,
      adjustReason,
      currentUser.id,
      currentUser.name
    );
    refreshData();
    setShowAdjustModal(false);
    showToast(`Stock updated for ${adjustingProduct.name}`, 'success');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: 'cat-' + Date.now(),
      businessId: activeBusiness.id,
      name: newCatName,
      nameBn: newCatNameBn || newCatName,
    };
    db.saveCategory(newCat);
    refreshData();
    setNewCatName('');
    setNewCatNameBn('');
    showToast(`Category "${newCat.name}" added!`, 'success');
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (confirm(`Delete category "${catName}"? Products in this category will keep their records.`)) {
      db.deleteCategory(catId, activeBusiness.id);
      refreshData();
      showToast(`Category "${catName}" removed.`, 'info');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#EEEEEE]">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">{t('inventory')}</h2>
          <p className="text-xs text-neutral-500">
            {lang === 'bn'
              ? 'পণ্য তালিকা, বর্তমান মজুদ, সতর্ক সংকেত ও সমন্বয়'
              : 'Product catalog, realtime stock levels, alerts, and adjustments'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => {
              setHistoryProduct(null);
              setShowHistoryModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-neutral-500" />
            <span>{t('stockHistory')}</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addProduct')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#EEEEEE] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t('searchProducts')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-[#E53935]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-2.5 text-xs font-medium border border-neutral-200 rounded-xl bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === 'bn' && c.nameBn ? c.nameBn : c.name}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="py-1.5 px-2.5 text-xs font-medium border border-neutral-200 rounded-xl bg-white"
          >
            <option value="all">All Stock Status</option>
            <option value="low">Low Stock Alert (&lt;= Limit)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl p-5 border border-[#EEEEEE]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 font-medium">
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">SKU / Barcode</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Cost Rate</th>
                <th className="py-2.5 px-3 text-right">Selling Rate</th>
                <th className="py-2.5 px-3 text-center">Stock Level</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.minStockAlert && p.stock > 0;
                const isOut = p.stock <= 0;
                const cat = categories.find((c) => c.id === p.categoryId);

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-neutral-900">
                        {lang === 'bn' && p.nameBn ? p.nameBn : p.name}
                      </p>
                      <p className="text-[10px] text-neutral-400">Unit: {p.unit}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-neutral-600">
                      <div>{p.sku}</div>
                      <div className="text-[10px] text-neutral-400">{p.barcode}</div>
                    </td>
                    <td className="py-3 px-3 text-neutral-600">
                      {cat ? (lang === 'bn' && cat.nameBn ? cat.nameBn : cat.name) : 'General'}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-neutral-600">
                      ৳{p.purchasePrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-neutral-900 tabular-nums">
                      ৳{p.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-xs text-neutral-900 tabular-nums">
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isOut
                            ? 'bg-red-100 text-[#E53935]'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button
                        onClick={() => openAdjustModal(p)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                        title="Adjust Stock (+/-)"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setHistoryProduct(p);
                          setShowHistoryModal(true);
                        }}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg cursor-pointer"
                        title="Movement Log"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-1.5 text-neutral-400 hover:text-[#E53935] hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Product Name (EN) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Miniket Rice 5kg"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 font-bengali">
                    নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমনঃ মিনিকেট চাল ৫ কেজি"
                    value={formNameBn}
                    onChange={(e) => setFormNameBn(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-bengali"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Cost Price (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Selling Price (৳) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl font-mono font-bold text-[#E53935]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    {editingProduct ? 'Current Stock' : 'Opening Stock'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as UnitType)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                  >
                    <option value="pcs">Pcs</option>
                    <option value="packet">Packet</option>
                    <option value="kg">Kg</option>
                    <option value="gm">Gm</option>
                    <option value="litre">Litre</option>
                    <option value="box">Box</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stock Adjustment (+/-) */}
      {showAdjustModal && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <h3 className="text-base font-bold text-neutral-900 pb-2 border-b border-neutral-100">
              {t('stockAdjustment')}: {adjustingProduct.name}
            </h3>

            <form onSubmit={handleConfirmAdjustment} className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex justify-between items-center">
                <span className="text-neutral-500">Current Stock:</span>
                <span className="font-black text-neutral-900 font-mono text-sm">
                  {adjustingProduct.stock} {adjustingProduct.unit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 text-center rounded-xl font-bold cursor-pointer transition-colors ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('subtract')}
                  className={`py-2 text-center rounded-xl font-bold cursor-pointer transition-colors ${
                    adjustType === 'subtract'
                      ? 'bg-[#E53935] text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  - Deduct Stock
                </button>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Quantity ({adjustingProduct.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl"
                >
                  <option value="Physical Stock Count Correction">Physical Stock Count Correction</option>
                  <option value="Damaged / Broken in Shop">Damaged / Broken in Shop</option>
                  <option value="Expired Product Disposal">Expired Product Disposal</option>
                  <option value="Sample / Gift to Customer">Sample / Gift to Customer</option>
                  <option value="Theft or Loss">Theft or Loss</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl shadow-xs"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Stock Movement Audit Log */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">
                {historyProduct ? `Stock History: ${historyProduct.name}` : 'Stock Movement Ledger'}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto mt-3 divide-y divide-neutral-100 flex-1 pr-1">
              {stockMovements.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  No stock movement history recorded yet.
                </div>
              ) : (
                stockMovements.map((sm) => (
                  <div key={sm.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-neutral-900">{sm.productName}</p>
                      <p className="text-[10px] text-neutral-500">{sm.reason}</p>
                      <p className="text-[10px] text-neutral-400 tabular-nums">{sm.date}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-black font-mono tabular-nums text-xs ${
                          sm.quantity >= 0 ? 'text-emerald-600' : 'text-[#E53935]'
                        }`}
                      >
                        {sm.quantity >= 0 ? `+${sm.quantity}` : sm.quantity}
                      </span>
                      <p className="text-[10px] text-neutral-400">
                        {sm.previousStock} &rarr; {sm.newStock}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Category Management */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Manage Product Categories</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form: Add Category */}
            <form onSubmit={handleAddCategory} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category (EN) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Beverages"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 font-bengali">বাংলা নাম</label>
                  <input
                    type="text"
                    placeholder="যেমনঃ পানীয়"
                    value={newCatNameBn}
                    onChange={(e) => setNewCatNameBn(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-neutral-200 rounded-xl font-bengali"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 font-bold text-white bg-[#E53935] hover:bg-[#C62828] rounded-xl text-xs transition-colors cursor-pointer"
              >
                + Add Category
              </button>
            </form>

            {/* List of existing categories */}
            <div className="mt-5 pt-3 border-t border-neutral-100">
              <p className="text-[11px] font-bold uppercase text-neutral-400 mb-2">
                Existing Categories ({categories.length})
              </p>
              <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto">
                {categories.map((c) => (
                  <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-800">{c.name}</span>
                      {c.nameBn && <span className="text-neutral-400 font-bengali ml-1.5">({c.nameBn})</span>}
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="text-neutral-400 hover:text-[#E53935] p-1"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
