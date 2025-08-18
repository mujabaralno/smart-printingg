"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import { Plus, X, Trash2, Package, Ruler, FileText, Settings, Eye, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import type { QuoteFormData, Paper, Product } from "@/types";

// Mock supplier products database
const SUPPLIER_PRODUCTS = [
  {
    id: "PROD001",
    name: "Business Card Premium",
    category: "Business Cards",
    supplier: "PrintPro LLC",
    paperOptions: ["Art Paper 300gsm", "Matt Paper 350gsm"],
    minQuantity: 100,
    maxQuantity: 10000,
    price: "$0.12 per unit"
  },
  {
    id: "PROD002", 
    name: "Brochure Tri-fold",
    category: "Brochures",
    supplier: "Quality Print Co.",
    paperOptions: ["Glossy Paper 150gsm", "Matt Paper 200gsm"],
    minQuantity: 50,
    maxQuantity: 5000,
    price: "$0.85 per unit"
  },
  {
    id: "PROD003",
    name: "Flyer A5 Standard",
    category: "Flyers",
    supplier: "Fast Print Solutions",
    paperOptions: ["Art Paper 150gsm", "Bond Paper 80gsm"],
    minQuantity: 100,
    maxQuantity: 20000,
    price: "$0.25 per unit"
  }
];

// helper product kosong (sesuai tipe Product)
const createEmptyProduct = (): Product => ({
  productName: "",
  paperName: "",
  quantity: 100,
  sides: "1",
  printingSelection: "Digital",
  flatSize: { width: 9, height: 5.5, spine: 0 },
  closeSize: { width: 9, height: 5.5, spine: 0 },
  useSameAsFlat: true,
  papers: [{ name: "", gsm: "" }],
  finishing: [],
  colors: { front: "", back: "" }
});

interface Step3Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}

const Step3ProductSpec: FC<Step3Props> = ({ formData, setFormData }) => {
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  const updateProduct = (idx: number, patch: Partial<Product>) => {
    const next = [...formData.products];
    next[idx] = { ...next[idx], ...patch };
    setFormData((prev): QuoteFormData => ({ ...prev, products: next }));
  };

  const handleSizeChange = (
    idx: number,
    sizeType: "flatSize" | "closeSize",
    dimension: "width" | "height" | "spine",
    value: string
  ) => {
    const p = formData.products[idx];
    const newSize = {
      ...p[sizeType],
      [dimension]: value !== "" ? parseFloat(value) : null,
    };
    updateProduct(idx, { [sizeType]: newSize } as Partial<Product>);
    if (sizeType === "flatSize" && p.useSameAsFlat) {
      updateProduct(idx, { closeSize: newSize } as Partial<Product>);
    }
  };

  // paper
  const handlePaperChange = (
    pIdx: number,
    paperIdx: number,
    field: keyof Paper,
    value: string
  ) => {
    const product = formData.products[pIdx];
    const newPapers = [...product.papers];
    newPapers[paperIdx] = { ...newPapers[paperIdx], [field]: value };
    updateProduct(pIdx, { papers: newPapers });
  };

  const addPaper = (pIdx: number) => {
    const product = formData.products[pIdx];
    updateProduct(pIdx, { papers: [...product.papers, { name: "", gsm: "" }] });
  };

  const removePaper = (pIdx: number, paperIdx: number) => {
    const product = formData.products[pIdx];
    if (product.papers.length <= 1) return;
    updateProduct(pIdx, {
      papers: product.papers.filter((_, i) => i !== paperIdx),
    });
  };

  // finishing with side selection for two-sided products
  const toggleFinishing = (pIdx: number, option: string, side?: string) => {
    const product = formData.products[pIdx];
    const finishingKey = side ? `${option}-${side}` : option;
    const finishing = product.finishing.includes(finishingKey)
      ? product.finishing.filter((x) => x !== finishingKey)
      : [...product.finishing, finishingKey];
    updateProduct(pIdx, { finishing });
  };

  // add/remove product
  const addProduct = () => {
    setFormData(
      (prev): QuoteFormData => ({
        ...prev,
        products: [...prev.products, createEmptyProduct()],
      })
    );
  };

  const removeProduct = (idx: number) => {
    if (formData.products.length <= 1) return;
    setFormData(
      (prev): QuoteFormData => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== idx),
      })
    );
  };

  const handleSupplierProductSelect = (supplierProduct: typeof SUPPLIER_PRODUCTS[0]) => {
    // This would update the current product with supplier data
    console.log("Selected supplier product:", supplierProduct);
    setSupplierDialogOpen(false);
  };

  const SupplierProductDialog = () => (
    <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supplier Product Catalog</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4">
            {SUPPLIER_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSupplierProductSelect(product)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">{product.name}</h4>
                    <p className="text-sm text-gray-600">Category: {product.category}</p>
                    <p className="text-sm text-gray-600">Supplier: {product.supplier}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {product.minQuantity} - {product.maxQuantity} units
                    </p>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Paper Options:</span>
                      <div className="mt-1">
                        {product.paperOptions.map((paper, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                            {paper}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">{product.price}</p>
                    <Button size="sm" className="mt-2">
                      Select Product
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-slate-900">Product Specification</h3>
        <p className="text-slate-600">Configure your printing products, sizes, and specifications</p>
      </div>

      {/* Products */}
      {formData.products.map((product, idx) => (
        <Card key={idx} className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    {product.productName ? product.productName : `Product ${idx + 1}`}
                  </CardTitle>
                  <p className="text-sm text-slate-500">Product specifications and details</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 hover:from-purple-600 hover:to-purple-700 px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Supplier Products
                    </Button>
                  </DialogTrigger>
                </Dialog>
                {formData.products.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProduct(idx)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Basic Information and Color Options - Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Basic Product Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Product Name</Label>
                    <Select
                      value={product.productName}
                      onValueChange={(v) => updateProduct(idx, { productName: v })}
                    >
                      <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Business Card">Business Card</SelectItem>
                        <SelectItem value="Flyer A5">Flyer A5</SelectItem>
                        <SelectItem value="Brochure">Brochure</SelectItem>
                        <SelectItem value="Book">Book</SelectItem>
                        <SelectItem value="Poster">Poster</SelectItem>
                        <SelectItem value="Letterhead">Letterhead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="100"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      value={product.quantity ?? ""}
                      onChange={(e) =>
                        updateProduct(idx, {
                          quantity: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Sides</Label>
                    <Select
                      value={product.sides}
                      onValueChange={(v) =>
                        updateProduct(idx, { sides: v as "1" | "2" })
                      }
                    >
                      <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Side</SelectItem>
                        <SelectItem value="2">2 Sides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Printing Selection</Label>
                    <Select
                      value={product.printingSelection}
                      onValueChange={(v) =>
                        updateProduct(idx, {
                          printingSelection: v as Product["printingSelection"],
                        })
                      }
                    >
                      <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select Printing" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Digital">Digital</SelectItem>
                        <SelectItem value="Offset">Offset</SelectItem>
                        <SelectItem value="Either">Either</SelectItem>
                        <SelectItem value="Both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Color Options */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-blue-600" />
                  Color Options
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Front Side</Label>
                    <Select
                      value={product.colors?.front || ""}
                      onValueChange={(v) => updateProduct(idx, { 
                        colors: { ...product.colors, front: v } 
                      })}
                    >
                      <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select Color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 Color">1 Color</SelectItem>
                        <SelectItem value="2 Colors">2 Colors</SelectItem>
                        <SelectItem value="3 Colors">3 Colors</SelectItem>
                        <SelectItem value="4 Colors (CMYK)">4 Colors (CMYK)</SelectItem>
                        <SelectItem value="4+1 Colors">4+1 Colors</SelectItem>
                        <SelectItem value="4+2 Colors">4+2 Colors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {product.sides === "2" && (
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-slate-700">Back Side</Label>
                      <Select
                        value={product.colors?.back || ""}
                        onValueChange={(v) => updateProduct(idx, { 
                          colors: { ...product.colors, back: v } 
                        })}
                      >
                        <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                          <SelectValue placeholder="Select Color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1 Color">1 Color</SelectItem>
                          <SelectItem value="2 Colors">2 Colors</SelectItem>
                          <SelectItem value="3 Colors">3 Colors</SelectItem>
                          <SelectItem value="4 Colors (CMYK)">4 Colors (CMYK)</SelectItem>
                          <SelectItem value="4+1 Colors">4+1 Colors</SelectItem>
                          <SelectItem value="4+2 Colors">4+2 Colors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Size Details */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                <Ruler className="w-5 h-5 mr-2 text-blue-600" />
                Size Details (cm)
              </h4>
              
              {/* Flat Size (Open) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Flat Size (Open)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Width</Label>
                    <Input
                      type="number"
                      placeholder="Width"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      min={0}
                      step="0.1"
                      value={product.flatSize.width ?? ""}
                      onChange={(e) =>
                        handleSizeChange(
                          idx,
                          "flatSize",
                          "width",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Height</Label>
                    <Input
                      type="number"
                      placeholder="Height"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      min={0}
                      step="0.1"
                      value={product.flatSize.height ?? ""}
                      onChange={(e) =>
                        handleSizeChange(
                          idx,
                          "flatSize",
                          "height",
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Spine</Label>
                    <Input
                      type="number"
                      placeholder="Spine"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      value={product.flatSize.spine ?? ""}
                      min={0}
                      step="0.1"
                      onChange={(e) =>
                        handleSizeChange(
                          idx,
                          "flatSize",
                          "spine",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Close Size (Closed) with Same Dimensions Checkbox */}
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Label className="text-sm font-medium text-slate-700">Close Size (Closed)</Label>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors">
                    <Checkbox
                      id={`same-${idx}`}
                      checked={product.useSameAsFlat}
                      onCheckedChange={(checked) =>
                        updateProduct(idx, {
                          useSameAsFlat: Boolean(checked),
                          closeSize: Boolean(checked)
                            ? product.flatSize
                            : product.closeSize,
                        })
                      }
                      className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4"
                    />
                    <Label htmlFor={`same-${idx}`} className="text-xs font-medium text-blue-700 cursor-pointer whitespace-nowrap">
                      Use same dimensions as Flat Size
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Width</Label>
                    <Input
                      type="number"
                      placeholder="Width"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      min={0}
                      step="0.1"
                      value={product.closeSize.width ?? ""}
                      onChange={(e) =>
                        handleSizeChange(
                          idx,
                          "closeSize",
                          "width",
                          e.target.value
                        )
                      }
                      disabled={product.useSameAsFlat}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Height</Label>
                    <Input
                      type="number"
                      placeholder="Height"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      min={0}
                      step="0.1"
                      value={product.closeSize.height ?? ""}
                      onChange={(e) =>
                        handleSizeChange(
                          idx,
                          "closeSize",
                          "height",
                          e.target.value
                        )
                      }
                      disabled={product.useSameAsFlat}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Spine</Label>
                    <Input
                      type="number"
                      placeholder="Spine"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      value={product.closeSize.spine ?? ""}
                      min={0}
                      step="0.1"
                      onChange={(e) =>
                        handleSizeChange(
                          idx,
                          "closeSize",
                          "spine",
                          e.target.value
                        )
                      }
                      disabled={product.useSameAsFlat}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Paper Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Paper Details
                </h4>
                <Button
                  variant="outline"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl"
                  size="sm"
                  onClick={() => addPaper(idx)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Paper
                </Button>
              </div>
              
              <div className="space-y-4">
                {product.papers.map((paper, pIndex) => (
                  <div
                    key={pIndex}
                    className="border border-slate-200 p-4 rounded-xl bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium text-slate-700">Paper {pIndex + 1}</h5>
                      {product.papers.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePaper(idx, pIndex)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          title="Remove paper"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">Paper Name</Label>
                        <Input
                          placeholder="e.g. Art Paper"
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                          value={paper.name}
                          onChange={(e) =>
                            handlePaperChange(idx, pIndex, "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">GSM</Label>
                        <Input
                          placeholder="e.g. 150"
                          className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                          value={paper.gsm}
                          onChange={(e) =>
                            handlePaperChange(idx, pIndex, "gsm", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Finishing Options */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Finishing Options
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  "Embossing",
                  "UV Spot", 
                  "Lamination",
                  "Foiling",
                  "Die Cutting",
                  "Varnishing",
                ].map((option) => (
                  <div key={option} className="group">
                    <div className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                      product.finishing.some(f => f.startsWith(option))
                        ? 'bg-blue-50'
                        : 'bg-transparent'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`fin-${idx}-${option}`}
                          checked={product.finishing.some(f => f.startsWith(option))}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              // Remove all variants of this finishing option
                              const updatedFinishing = product.finishing.filter(f => !f.startsWith(option));
                              updateProduct(idx, { finishing: updatedFinishing });
                            } else {
                              // Add default side when checked
                              const finishingKey = product.sides === "2" ? `${option}-Front` : option;
                              const updatedFinishing = [...product.finishing.filter(f => !f.startsWith(option)), finishingKey];
                              updateProduct(idx, { finishing: updatedFinishing });
                            }
                          }}
                          className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4 rounded-md"
                        />
                        <Label
                          htmlFor={`fin-${idx}-${option}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors"
                        >
                          {option}
                        </Label>
                      </div>
                      
                      {product.sides === "2" && product.finishing.some(f => f.startsWith(option)) && (
                        <Select
                          value={product.finishing.find(f => f.startsWith(option))?.split('-')[1] || "Front"}
                          onValueChange={(side) => {
                            // Remove old variants and add new one
                            const updatedFinishing = product.finishing.filter(f => !f.startsWith(option));
                            updatedFinishing.push(`${option}-${side}`);
                            updateProduct(idx, { finishing: updatedFinishing });
                          }}
                        >
                          <SelectTrigger className="w-20 h-7 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md text-xs bg-white shadow-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Front">Front</SelectItem>
                            <SelectItem value="Back">Back</SelectItem>
                            <SelectItem value="Both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Add Product Button */}
      <div className="text-center">
        <Button
          variant="outline"
          className="py-6 px-8 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 rounded-xl transition-all duration-300"
          onClick={addProduct}
        >
          <Plus className="h-5 w-5 mr-2" /> Add Another Product
        </Button>
      </div>

      {/* Supplier Product Dialog */}
      <SupplierProductDialog />
    </div>
  );
};

export default Step3ProductSpec;