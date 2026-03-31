import { useState, useMemo } from "react";
import { useAllVehicles, useCreateVehicle, useEditVehicle, useDeleteVehicle, SupabaseVehicle } from "@/hooks/useVehicles";
import { useAllVehicleImages, useUploadVehicleImage } from "@/hooks/useVehicleImages";
import { VehiclePhotoUpload } from "@/components/VehiclePhotoUpload";
import {
  Search, Car, Plus, Edit, Trash2, MoreHorizontal, DollarSign, Gauge, Palette,
  Shield, FileText, ExternalLink, Fuel, Banknote, Receipt, Wrench, Sparkles, FileCheck, StickyNote
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type VehicleStatus = "available" | "reserved" | "sold" | "repasse";

const statusMap: Record<string, { label: string; color: string }> = {
  available: { label: "Disponível", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  reserved: { label: "Reservado", color: "bg-amber-50 text-amber-700 border-amber-200" },
  sold: { label: "Vendido", color: "bg-destructive/10 text-destructive border-destructive/20" },
  repasse: { label: "Repasse", color: "bg-primary/10 text-primary border-primary/20" },
};

interface VehicleForm {
  brand: string;
  model: string;
  version: string;
  year: string;
  color: string;
  mileage: string;
  price: string;
  status: VehicleStatus;
  description: string;
  condition: string;
  engine: string;
  power: string;
  leather_seats: boolean;
  sunroof: boolean;
  electric_trunk: boolean;
  fuel: string;
  armored: boolean;
  armor_type: string;
  armor_company: string;
  glass_brand: string;
  // Financial
  purchase_price: string;
  commission_as3: string;
  commission_external: string;
  commission_armor: string;
  commission_financing: string;
  cost_repairs: string;
  cost_detailing: string;
  cost_documentation: string;
  cost_other: string;
  notes_internal: string;
}

const emptyForm: VehicleForm = {
  brand: "", model: "", version: "", year: "2024", color: "", mileage: "",
  price: "", status: "available", description: "", condition: "", engine: "",
  power: "", leather_seats: false, sunroof: false, electric_trunk: false,
  fuel: "", armored: false, armor_type: "", armor_company: "", glass_brand: "",
  purchase_price: "", commission_as3: "", commission_external: "",
  commission_armor: "", commission_financing: "", cost_repairs: "",
  cost_detailing: "", cost_documentation: "", cost_other: "", notes_internal: "",
};

function formatPriceDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("pt-BR");
}

function parsePriceValue(formatted: string | undefined): number {
  if (!formatted) return 0;
  const digits = formatted.replace(/\D/g, "");
  return Number(digits) || 0;
}

/** Reusable R$ input */
function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
      <Input
        placeholder={placeholder || "0"}
        value={formatPriceDisplay(value)}
        onChange={e => onChange(e.target.value.replace(/\D/g, ""))}
        className="rounded-xl pl-9"
      />
    </div>
  );
}

const InventoryPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<SupabaseVehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>({ ...emptyForm });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const { data: vehicles = [], isLoading } = useAllVehicles();
  const createVehicle = useCreateVehicle();
  const editVehicle = useEditVehicle();
  const deleteVehicle = useDeleteVehicle();
  const uploadImage = useUploadVehicleImage();

  const vehicleIds = useMemo(() => vehicles.map(v => v.id), [vehicles]);
  const { data: allImages = [] } = useAllVehicleImages(vehicleIds);
  const imagesByVehicle = useMemo(() => {
    const map: Record<string, string> = {};
    for (const img of allImages) {
      if (!map[img.vehicle_id]) map[img.vehicle_id] = img.url;
    }
    return map;
  }, [allImages]);

  const updateForm = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const handlePriceChange = (raw: string) => {
    updateForm("price", raw.replace(/\D/g, ""));
  };

  const filtered = vehicles.filter(v => {
    const text = `${v.brand || ""} ${v.model || ""} ${v.version || ""} ${v.year || ""} ${v.color || ""}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (statusFilter === "all" || v.status === statusFilter);
  });

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === "available").length,
    reserved: vehicles.filter(v => v.status === "reserved").length,
    sold: vehicles.filter(v => v.status === "sold").length,
  };

  const buildVehicleData = () => ({
    brand: form.brand.trim() || null,
    model: form.model.trim() || null,
    version: form.version.trim() || null,
    year: parseInt(form.year) || null,
    color: form.color.trim() || null,
    mileage: form.mileage ? parseInt(form.mileage) : null,
    price: form.price ? parsePriceValue(form.price) : null,
    status: form.status || null,
    description: form.description.trim() || null,
    condition: form.condition.trim() || null,
    engine: form.engine.trim() || null,
    power: form.power.trim() || null,
    leather_seats: form.leather_seats,
    sunroof: form.sunroof,
    electric_trunk: form.electric_trunk,
    fuel: form.fuel.trim() || null,
    armored: form.armored,
    armor_type: form.armored ? (form.armor_type.trim() || null) : null,
    armor_company: form.armored ? (form.armor_company.trim() || null) : null,
    glass_brand: form.armored ? (form.glass_brand.trim() || null) : null,
    purchase_price: form.purchase_price ? parsePriceValue(form.purchase_price) : null,
    commission_as3: form.commission_as3 ? parsePriceValue(form.commission_as3) : null,
    commission_external: form.commission_external ? parsePriceValue(form.commission_external) : null,
    commission_armor: form.commission_armor ? parsePriceValue(form.commission_armor) : null,
    commission_financing: form.commission_financing ? parsePriceValue(form.commission_financing) : null,
    cost_repairs: form.cost_repairs ? parsePriceValue(form.cost_repairs) : null,
    cost_detailing: form.cost_detailing ? parsePriceValue(form.cost_detailing) : null,
    cost_documentation: form.cost_documentation ? parsePriceValue(form.cost_documentation) : null,
    cost_other: form.cost_other ? parsePriceValue(form.cost_other) : null,
    notes_internal: form.notes_internal.trim() || null,
  });

  const handleAdd = async () => {
    if (!form.brand.trim() || !form.model.trim() || !form.price) {
      toast({ title: "Preencha marca, modelo e preço", variant: "destructive" });
      return;
    }
    try {
      const data = buildVehicleData();
      const result = await createVehicle.mutateAsync({
        brand: data.brand!,
        model: data.model!,
        ...data,
      });
      if (pendingFiles.length > 0 && result?.id) {
        for (let i = 0; i < pendingFiles.length; i++) {
          await uploadImage.mutateAsync({ vehicleId: result.id, file: pendingFiles[i], position: i });
        }
      }
      setForm({ ...emptyForm });
      setPendingFiles([]);
      setAddDialogOpen(false);
      toast({ title: "✅ Veículo adicionado!", description: `${form.brand} ${form.model}` });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleOpenEdit = (v: SupabaseVehicle) => {
    setEditingVehicle(v);
    setForm({
      brand: v.brand || "",
      model: v.model || "",
      version: v.version || "",
      year: String(v.year || 2024),
      color: v.color || "",
      mileage: v.mileage != null ? String(v.mileage) : "",
      price: v.price != null ? String(v.price) : "",
      status: (v.status as VehicleStatus) || "available",
      description: v.description || "",
      condition: v.condition || "",
      engine: v.engine || "",
      power: v.power || "",
      leather_seats: v.leather_seats ?? false,
      sunroof: v.sunroof ?? false,
      electric_trunk: v.electric_trunk ?? false,
      fuel: v.fuel || "",
      armored: v.armored ?? false,
      armor_type: v.armor_type || "",
      armor_company: v.armor_company || "",
      glass_brand: v.glass_brand || "",
      purchase_price: v.purchase_price != null ? String(v.purchase_price) : "",
      commission_as3: v.commission_as3 != null ? String(v.commission_as3) : "",
      commission_external: v.commission_external != null ? String(v.commission_external) : "",
      commission_armor: v.commission_armor != null ? String(v.commission_armor) : "",
      commission_financing: v.commission_financing != null ? String(v.commission_financing) : "",
      cost_repairs: v.cost_repairs != null ? String(v.cost_repairs) : "",
      cost_detailing: v.cost_detailing != null ? String(v.cost_detailing) : "",
      cost_documentation: v.cost_documentation != null ? String(v.cost_documentation) : "",
      cost_other: v.cost_other != null ? String(v.cost_other) : "",
      notes_internal: v.notes_internal || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingVehicle) return;
    try {
      await editVehicle.mutateAsync({
        vehicleId: editingVehicle.id,
        data: buildVehicleData(),
      });
      setEditDialogOpen(false);
      setEditingVehicle(null);
      toast({ title: "✅ Veículo atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleChangeStatus = async (vehicleId: string, newStatus: VehicleStatus) => {
    try {
      await editVehicle.mutateAsync({ vehicleId, data: { status: newStatus } });
      toast({ title: `Status alterado para "${statusMap[newStatus].label}"` });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      await deleteVehicle.mutateAsync(vehicleId);
      toast({ title: "Veículo removido" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // Calculate totals for the financial summary
  const totalCosts = parsePriceValue(form.cost_repairs) + parsePriceValue(form.cost_detailing) +
    parsePriceValue(form.cost_documentation) + parsePriceValue(form.cost_other);
  const totalCommissions = parsePriceValue(form.commission_as3) + parsePriceValue(form.commission_external) +
    parsePriceValue(form.commission_armor) + parsePriceValue(form.commission_financing);
  const salePrice = parsePriceValue(form.price);
  const purchasePrice = parsePriceValue(form.purchase_price);
  const estimatedProfit = salePrice - purchasePrice - totalCosts - totalCommissions;

  const vehicleInfoTab = (
    <div className="grid grid-cols-2 gap-3 pr-1">
      {/* Dados principais */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Dados do Veículo</div>
      <div className="space-y-1.5">
        <Label className="text-xs">Marca *</Label>
        <Input placeholder="Toyota" value={form.brand} onChange={e => updateForm("brand", e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Modelo *</Label>
        <Input placeholder="Corolla" value={form.model} onChange={e => updateForm("model", e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Versão</Label>
        <Input placeholder="XEi 2.0 Flex" value={form.version} onChange={e => updateForm("version", e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Ano</Label>
        <Input type="number" value={form.year} onChange={e => updateForm("year", e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Cor</Label>
        <Input placeholder="Prata" value={form.color} onChange={e => updateForm("color", e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Preço de Venda (R$) *</Label>
        <Input
          placeholder="1.500.000"
          value={formatPriceDisplay(form.price)}
          onChange={e => handlePriceChange(e.target.value)}
          className="rounded-xl"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">KM</Label>
        <Input type="number" placeholder="18000" value={form.mileage} onChange={e => updateForm("mileage", e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Condição</Label>
        <Select value={form.condition} onValueChange={v => updateForm("condition", v)}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="novo">Novo (0km)</SelectItem>
            <SelectItem value="seminovo">Seminovo</SelectItem>
            <SelectItem value="usado">Usado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Motor e performance */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3">Motor & Performance</div>
      <div className="space-y-1.5">
        <Label className="text-xs">Motor</Label>
        <Input placeholder="2.0 Turbo" value={form.engine} onChange={e => updateForm("engine", e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Potência</Label>
        <Input placeholder="272 cv" value={form.power} onChange={e => updateForm("power", e.target.value)} className="rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Combustível</Label>
        <Select value={form.fuel} onValueChange={v => updateForm("fuel", v)}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="flex">Flex</SelectItem>
            <SelectItem value="gasolina">Gasolina</SelectItem>
            <SelectItem value="etanol">Etanol</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
            <SelectItem value="eletrico">Elétrico</SelectItem>
            <SelectItem value="hibrido">Híbrido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select value={form.status} onValueChange={v => updateForm("status", v)}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Disponível</SelectItem>
            <SelectItem value="reserved">Reservado</SelectItem>
            <SelectItem value="sold">Vendido</SelectItem>
            <SelectItem value="repasse">Repasse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Opcionais */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3">Opcionais</div>
      <div className="col-span-2 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={form.leather_seats} onCheckedChange={v => updateForm("leather_seats", !!v)} />
          <span className="text-sm">Bancos de Couro</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={form.sunroof} onCheckedChange={v => updateForm("sunroof", !!v)} />
          <span className="text-sm">Teto Solar</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={form.electric_trunk} onCheckedChange={v => updateForm("electric_trunk", !!v)} />
          <span className="text-sm">Mala Elétrica</span>
        </label>
      </div>

      {/* Blindagem */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3">Blindagem</div>
      <div className="col-span-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={form.armored} onCheckedChange={v => updateForm("armored", !!v)} />
          <span className="text-sm font-medium">Veículo Blindado</span>
        </label>
      </div>
      {form.armored && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Blindagem</Label>
            <Input placeholder="Nível III-A" value={form.armor_type} onChange={e => updateForm("armor_type", e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Blindadora</Label>
            <Input placeholder="Carbon" value={form.armor_company} onChange={e => updateForm("armor_company", e.target.value)} className="rounded-xl" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Marca do Vidro</Label>
            <Input placeholder="O'Gara" value={form.glass_brand} onChange={e => updateForm("glass_brand", e.target.value)} className="rounded-xl" />
          </div>
        </>
      )}

      {/* Fotos */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3">Fotos</div>
      <div className="col-span-2">
        <VehiclePhotoUpload
          vehicleId={editingVehicle?.id}
          pendingFiles={!editingVehicle ? pendingFiles : undefined}
          onPendingFilesChange={!editingVehicle ? setPendingFiles : undefined}
        />
      </div>

      {/* Descrição */}
      <div className="col-span-2 space-y-1.5 pt-2">
        <Label className="text-xs">Descrição / Observações</Label>
        <Textarea placeholder="Detalhes visíveis publicamente..." value={form.description} onChange={e => updateForm("description", e.target.value)} className="rounded-xl" rows={3} />
      </div>
    </div>
  );

  const financialTab = (
    <div className="grid grid-cols-2 gap-3 pr-1">
      {/* Resumo financeiro */}
      <div className="col-span-2 rounded-xl border border-border bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5" /> Resumo Financeiro
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Preço de Venda:</span>
            <span className="font-semibold">{salePrice > 0 ? `R$ ${salePrice.toLocaleString("pt-BR")}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Preço de Compra:</span>
            <span className="font-semibold">{purchasePrice > 0 ? `R$ ${purchasePrice.toLocaleString("pt-BR")}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Custos:</span>
            <span className="font-semibold text-destructive">{totalCosts > 0 ? `- R$ ${totalCosts.toLocaleString("pt-BR")}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Comissões:</span>
            <span className="font-semibold text-destructive">{totalCommissions > 0 ? `- R$ ${totalCommissions.toLocaleString("pt-BR")}` : "—"}</span>
          </div>
        </div>
        <div className="border-t border-border pt-2 flex justify-between text-sm">
          <span className="font-semibold">Lucro Estimado:</span>
          <span className={`font-bold text-base ${estimatedProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
            {salePrice > 0 || purchasePrice > 0
              ? `R$ ${estimatedProfit.toLocaleString("pt-BR")}`
              : "—"}
          </span>
        </div>
      </div>

      {/* Preços */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2 flex items-center gap-1.5">
        <Banknote className="w-3.5 h-3.5" /> Valores de Compra e Venda
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Preço de Compra (quanto pagamos)</Label>
        <MoneyInput value={form.purchase_price} onChange={v => updateForm("purchase_price", v)} placeholder="150.000" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Valor de Venda (preço ao cliente)</Label>
        <MoneyInput value={form.price} onChange={v => updateForm("price", v)} placeholder="200.000" />
      </div>

      {/* Comissões */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 flex items-center gap-1.5">
        <DollarSign className="w-3.5 h-3.5" /> Comissões
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Comissão AS3</Label>
        <MoneyInput value={form.commission_as3} onChange={v => updateForm("commission_as3", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Comissão Externa</Label>
        <MoneyInput value={form.commission_external} onChange={v => updateForm("commission_external", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Comissão Blindagem</Label>
        <MoneyInput value={form.commission_armor} onChange={v => updateForm("commission_armor", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Comissão Financiamento</Label>
        <MoneyInput value={form.commission_financing} onChange={v => updateForm("commission_financing", v)} />
      </div>

      {/* Custos */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 flex items-center gap-1.5">
        <Wrench className="w-3.5 h-3.5" /> Custos Operacionais
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><Wrench className="w-3 h-3" /> Reparos / Mecânica</Label>
        <MoneyInput value={form.cost_repairs} onChange={v => updateForm("cost_repairs", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><Sparkles className="w-3 h-3" /> Estética / Detalhamento</Label>
        <MoneyInput value={form.cost_detailing} onChange={v => updateForm("cost_detailing", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><FileCheck className="w-3 h-3" /> Documentação</Label>
        <MoneyInput value={form.cost_documentation} onChange={v => updateForm("cost_documentation", v)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs flex items-center gap-1"><Receipt className="w-3 h-3" /> Outros Custos</Label>
        <MoneyInput value={form.cost_other} onChange={v => updateForm("cost_other", v)} />
      </div>

      {/* Notas internas */}
      <div className="col-span-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-3 flex items-center gap-1.5">
        <StickyNote className="w-3.5 h-3.5" /> Notas Internas
      </div>
      <div className="col-span-2 space-y-1.5">
        <Textarea
          placeholder="Anotações internas sobre custos, parceiros, observações financeiras..."
          value={form.notes_internal}
          onChange={e => updateForm("notes_internal", e.target.value)}
          className="rounded-xl"
          rows={4}
        />
      </div>
    </div>
  );

  const vehicleFormTabs = (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4">
        <TabsTrigger value="info" className="rounded-xl gap-1.5 text-xs">
          <Car className="w-3.5 h-3.5" /> Informações do Veículo
        </TabsTrigger>
        <TabsTrigger value="financial" className="rounded-xl gap-1.5 text-xs">
          <DollarSign className="w-3.5 h-3.5" /> Controle Interno
        </TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="max-h-[55vh] overflow-y-auto">
        {vehicleInfoTab}
      </TabsContent>
      <TabsContent value="financial" className="max-h-[55vh] overflow-y-auto">
        {financialTab}
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus veículos disponíveis</p>
        </div>
        <Button onClick={() => { setForm({ ...emptyForm }); setPendingFiles([]); setAddDialogOpen(true); }} className="rounded-xl gap-2 shadow-md">
          <Plus className="w-4 h-4" /> Novo Veículo
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar veículo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64 rounded-xl glass-input border-0 h-10" />
        </div>
        <div className="flex gap-1.5">
          {[
            { key: "all", label: "Todos" },
            { key: "available", label: "Disponíveis" },
            { key: "reserved", label: "Reservados" },
            { key: "sold", label: "Vendidos" },
            { key: "repasse", label: "Repasse" },
          ].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`filter-pill text-xs ${statusFilter === f.key ? "active" : ""}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Car, accent: "text-foreground" },
          { label: "Disponíveis", value: stats.available, icon: Car, accent: "text-success" },
          { label: "Reservados", value: stats.reserved, icon: Shield, accent: "text-warning" },
          { label: "Vendidos", value: stats.sold, icon: DollarSign, accent: "text-accent" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }} className="glass-card p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl bg-muted/50 ${s.accent}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{isLoading ? "-" : s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Vehicle grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((vehicle, i) => {
            const st = statusMap[vehicle.status || "available"] || statusMap.available;
            return (
              <motion.div key={vehicle.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.35 }} className="glass-card group overflow-hidden">
                <div className="h-44 bg-muted/40 rounded-xl flex items-center justify-center mb-4 overflow-hidden mx-4 mt-4">
                  {imagesByVehicle[vehicle.id] ? (
                    <img src={imagesByVehicle[vehicle.id]} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Car className="w-16 h-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-500" />
                  )}
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h3 className="font-semibold text-base">{vehicle.brand} {vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground">{vehicle.version && `${vehicle.version} · `}{vehicle.year}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  <p className="text-2xl font-bold mt-2 tracking-tight">
                    R$ {(vehicle.price || 0).toLocaleString("pt-BR")}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    {vehicle.color && <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> {vehicle.color}</span>}
                    {vehicle.mileage != null && <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {vehicle.mileage.toLocaleString("pt-BR")} km</span>}
                    {vehicle.fuel && <span className="flex items-center gap-1"><Fuel className="w-3 h-3" /> {vehicle.fuel}</span>}
                    {vehicle.armored && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Blindado</span>}
                  </div>

                  {vehicle.description && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1 line-clamp-2">
                      <FileText className="w-3 h-3 mt-0.5 shrink-0" /> {vehicle.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs h-8" onClick={() => handleOpenEdit(vehicle)}>
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => handleOpenEdit(vehicle)} className="gap-2 text-xs">
                          <Edit className="w-3.5 h-3.5" /> Editar veículo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleChangeStatus(vehicle.id, "available")} disabled={vehicle.status === "available"} className="gap-2 text-xs">
                          <Car className="w-3.5 h-3.5 text-emerald-600" /> Marcar Disponível
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStatus(vehicle.id, "reserved")} disabled={vehicle.status === "reserved"} className="gap-2 text-xs">
                          <Shield className="w-3.5 h-3.5 text-amber-600" /> Marcar Reservado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStatus(vehicle.id, "sold")} disabled={vehicle.status === "sold"} className="gap-2 text-xs">
                          <DollarSign className="w-3.5 h-3.5 text-destructive" /> Marcar Vendido
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleChangeStatus(vehicle.id, "repasse")} disabled={vehicle.status === "repasse"} className="gap-2 text-xs">
                          <ExternalLink className="w-3.5 h-3.5 text-primary" /> Marcar Repasse
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(vehicle.id)} className="gap-2 text-xs text-destructive">
                          <Trash2 className="w-3.5 h-3.5" /> Remover veículo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <Car className="w-12 h-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum veículo encontrado.</p>
        </div>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Novo Veículo
            </DialogTitle>
          </DialogHeader>
          {vehicleFormTabs}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleAdd} disabled={createVehicle.isPending} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> {createVehicle.isPending ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vehicle Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" /> Editar Veículo
            </DialogTitle>
          </DialogHeader>
          {vehicleFormTabs}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={editVehicle.isPending} className="rounded-xl gap-2">
              <Edit className="w-4 h-4" /> {editVehicle.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
