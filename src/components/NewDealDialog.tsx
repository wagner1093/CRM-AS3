import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDeal, useContacts, useVehiclesAvailable } from "@/hooks/useDeals";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Car, CreditCard, AlertTriangle, StickyNote } from "lucide-react";

interface NewDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewDealDialog = ({ open, onOpenChange }: NewDealDialogProps) => {
  const { toast } = useToast();
  const createDeal = useCreateDeal();
  const { data: contacts = [] } = useContacts();
  const { data: vehicles = [] } = useVehiclesAvailable();

  const [mode, setMode] = useState<"new" | "existing">("new");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleInterest, setVehicleInterest] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setMode("new");
    setSelectedContactId("");
    setName("");
    setPhone("");
    setEmail("");
    setVehicleInterest("");
    setSelectedVehicleId("");
    setPaymentType("");
    setUrgency("");
    setValue("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let contactName = name;
    let contactPhone = phone;
    let contactEmail = email;

    if (mode === "existing" && selectedContactId) {
      const c = contacts.find(c => c.id === selectedContactId);
      if (c) {
        contactName = c.name;
        contactPhone = c.whatsapp || c.phone || "";
        contactEmail = c.email || "";
      }
    }

    if (!contactName.trim()) {
      toast({ title: "Informe o nome do contato", variant: "destructive" });
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    const vehicleText = selectedVehicle
      ? `${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year}`
      : vehicleInterest;

    try {
      await createDeal.mutateAsync({
        contactName,
        contactPhone: contactPhone || undefined,
        contactEmail: contactEmail || undefined,
        vehicleInterest: vehicleText || undefined,
        paymentType: paymentType || undefined,
        urgency: urgency || undefined,
        value: value ? parseFloat(value) : undefined,
        notes: notes || undefined,
        stage: "new",
      });
      toast({ title: "Negócio criado!", description: contactName });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro ao criar negócio", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Novo Negócio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Contact mode toggle */}
          <div className="flex rounded-xl p-1 bg-muted">
            {(["new", "existing"] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {m === "new" ? "Novo Contato" : "Contato Existente"}
              </button>
            ))}
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Selecionar Contato</Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um contato..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.whatsapp || c.phone ? `· ${c.whatsapp || c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Nome *
                </Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Telefone
                  </Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+55 11 99999-0000" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Vehicle */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Veículo de interesse
              </Label>
              {vehicles.length > 0 ? (
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione do estoque..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (digitar manualmente)</SelectItem>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.brand} {v.model} {v.year} · R$ {(v.price || 0).toLocaleString("pt-BR")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              {(!selectedVehicleId || selectedVehicleId === "none") && (
                <Input
                  value={vehicleInterest}
                  onChange={e => setVehicleInterest(e.target.value)}
                  placeholder="Ex: Corolla 2023, SUV até 150k..."
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Pagamento
                </Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a_vista">À Vista</SelectItem>
                    <SelectItem value="financiamento">Financiamento</SelectItem>
                    <SelectItem value="troca">Troca</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                    <SelectItem value="indefinido">Indefinido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Urgência
                </Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Nível..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Valor estimado (R$)</Label>
              <Input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="125000"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Observações
              </Label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Detalhes sobre o negócio..."
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createDeal.isPending}>
            {createDeal.isPending ? "Criando..." : "Criar Negócio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDealDialog;
