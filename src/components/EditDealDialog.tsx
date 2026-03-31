import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { DealWithRelations, useUpdateDeal, useUpdateContact, useUpdateVehicle, useDeleteDeal, useVehiclesAvailable } from "@/hooks/useDeals";
import { PIPELINE_STAGES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { User, Phone, Mail, Car, CreditCard, AlertTriangle, StickyNote, Trash2, Save, Percent, DollarSign, Palette, Gauge, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface EditDealDialogProps {
  deal: DealWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditDealDialog = ({ deal, open, onOpenChange }: EditDealDialogProps) => {
  const { toast } = useToast();
  const updateDeal = useUpdateDeal();
  const updateContact = useUpdateContact();
  const updateVehicle = useUpdateVehicle();
  const deleteDeal = useDeleteDeal();
  const { data: vehicles = [] } = useVehiclesAvailable();

  // Contact fields
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactNotes, setContactNotes] = useState("");
  const [leadSource, setLeadSource] = useState("");

  // Deal fields
  const [stage, setStage] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [dealNotes, setDealNotes] = useState("");
  const [vehicleInterest, setVehicleInterest] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  // Vehicle fields (when vehicle is linked)
  const [vBrand, setVBrand] = useState("");
  const [vModel, setVModel] = useState("");
  const [vYear, setVYear] = useState("");
  const [vColor, setVColor] = useState("");
  const [vMileage, setVMileage] = useState("");
  const [vPrice, setVPrice] = useState("");
  const [vStatus, setVStatus] = useState("");
  const [vDescription, setVDescription] = useState("");

  // Follow-up
  const [followupActive, setFollowupActive] = useState(false);

  useEffect(() => {
    if (deal) {
      setContactName(deal.contact?.name || "");
      setContactPhone(deal.contact?.whatsapp || deal.contact?.phone || "");
      setContactEmail(deal.contact?.email || "");
      setContactNotes("");
      setLeadSource("");
      setStage(deal.stage || "new");
      setPaymentType(deal.payment_type || "");
      setUrgency(deal.urgency || "");
      setDealValue(deal.value?.toString() || "");
      setDealNotes(deal.notes || "");
      setVehicleInterest(deal.vehicle_interest || "");
      setSelectedVehicleId(deal.vehicle_id || "");

      if (deal.vehicle) {
        setVBrand(deal.vehicle.brand || "");
        setVModel(deal.vehicle.model || "");
        setVYear(deal.vehicle.year?.toString() || "");
        setVColor(deal.vehicle.color || "");
        setVMileage(deal.vehicle.mileage?.toString() || "");
        setVPrice(deal.vehicle.price?.toString() || "");
        setVStatus(deal.vehicle.status || "");
        setVDescription("");
      }
    }
  }, [deal]);

  if (!deal) return null;

  const handleSaveContact = async () => {
    if (!deal.contact) return;
    try {
      await updateContact.mutateAsync({
        contactId: deal.contact.id,
        data: {
          name: contactName,
          phone: contactPhone || null,
          whatsapp: contactPhone || null,
          email: contactEmail || null,
          notes: contactNotes || null,
          lead_source: leadSource || null,
        },
      });
      toast({ title: "Contato atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveDeal = async () => {
    try {
      const vehicleId = selectedVehicleId && selectedVehicleId !== "none" ? selectedVehicleId : null;
      await updateDeal.mutateAsync({
        dealId: deal.id,
        data: {
          stage,
          payment_type: paymentType || null,
          urgency: urgency || null,
          value: dealValue ? parseFloat(dealValue) : null,
          notes: dealNotes || null,
          vehicle_interest: vehicleInterest || null,
          vehicle_id: vehicleId,
        },
      });
      toast({ title: "Negócio atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveVehicle = async () => {
    if (!deal.vehicle) return;
    try {
      await updateVehicle.mutateAsync({
        vehicleId: deal.vehicle.id,
        data: {
          brand: vBrand || null,
          model: vModel || null,
          year: vYear ? parseInt(vYear) : null,
          color: vColor || null,
          mileage: vMileage ? parseInt(vMileage) : null,
          price: vPrice ? parseFloat(vPrice) : null,
          status: vStatus || null,
          description: vDescription || null,
        },
      });
      toast({ title: "Veículo atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(deal.id);
      toast({ title: "Negócio excluído" });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            Editar Negócio
            <span className="text-xs font-normal text-muted-foreground">· {contactName}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contact" className="mt-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="contact" className="text-xs">Contato</TabsTrigger>
            <TabsTrigger value="deal" className="text-xs">Negócio</TabsTrigger>
            <TabsTrigger value="vehicle" className="text-xs">Veículo</TabsTrigger>
            <TabsTrigger value="followup" className="text-xs">Follow-up</TabsTrigger>
          </TabsList>

          {/* CONTACT TAB */}
          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Nome
              </Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Telefone / WhatsApp
                </Label>
                <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+55 11 99999-0000" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </Label>
                <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Origem do Lead</Label>
              <Select value={leadSource} onValueChange={setLeadSource}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  <SelectItem value="instagram_org">Instagram Orgânico</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="whatsapp_direto">WhatsApp Direto</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Observações do contato
              </Label>
              <Textarea value={contactNotes} onChange={e => setContactNotes(e.target.value)} rows={3} placeholder="Notas sobre o cliente..." />
            </div>
            <Button onClick={handleSaveContact} disabled={updateContact.isPending} className="w-full gap-2">
              <Save className="w-4 h-4" /> {updateContact.isPending ? "Salvando..." : "Salvar Contato"}
            </Button>
          </TabsContent>

          {/* DEAL TAB */}
          <TabsContent value="deal" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Etapa do Pipeline</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map(s => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Pagamento
                </Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
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
                  <SelectTrigger><SelectValue placeholder="Nível..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Valor do negócio (R$)
              </Label>
              <Input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="125000" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Interesse em veículo (texto livre)</Label>
              <Input value={vehicleInterest} onChange={e => setVehicleInterest(e.target.value)} placeholder="Ex: SUV até 150k..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Vincular veículo do estoque</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} {v.year} · R$ {(v.price || 0).toLocaleString("pt-BR")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Observações do negócio
              </Label>
              <Textarea value={dealNotes} onChange={e => setDealNotes(e.target.value)} rows={3} placeholder="Detalhes..." />
            </div>
            <Button onClick={handleSaveDeal} disabled={updateDeal.isPending} className="w-full gap-2">
              <Save className="w-4 h-4" /> {updateDeal.isPending ? "Salvando..." : "Salvar Negócio"}
            </Button>
          </TabsContent>

          {/* VEHICLE TAB */}
          <TabsContent value="vehicle" className="space-y-4 mt-4">
            {deal.vehicle ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Marca</Label>
                    <Input value={vBrand} onChange={e => setVBrand(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Modelo</Label>
                    <Input value={vModel} onChange={e => setVModel(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Ano</Label>
                    <Input type="number" value={vYear} onChange={e => setVYear(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Cor
                    </Label>
                    <Input value={vColor} onChange={e => setVColor(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5" /> KM
                    </Label>
                    <Input type="number" value={vMileage} onChange={e => setVMileage(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Preço (R$)
                    </Label>
                    <Input type="number" value={vPrice} onChange={e => setVPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Status</Label>
                    <Select value={vStatus} onValueChange={setVStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="reserved">Reservado</SelectItem>
                        <SelectItem value="sold">Vendido</SelectItem>
                        <SelectItem value="repasse">Repasse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Descrição / Observações</Label>
                  <Textarea value={vDescription} onChange={e => setVDescription(e.target.value)} rows={2} placeholder="Detalhes do veículo..." />
                </div>
                <Button onClick={handleSaveVehicle} disabled={updateVehicle.isPending} className="w-full gap-2">
                  <Save className="w-4 h-4" /> {updateVehicle.isPending ? "Salvando..." : "Salvar Veículo"}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Car className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>Nenhum veículo vinculado a este negócio.</p>
                <p className="text-xs mt-1">Vincule um veículo na aba "Negócio".</p>
              </div>
            )}
          </TabsContent>

          {/* FOLLOW-UP TAB */}
          <TabsContent value="followup" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/70">
              <div>
                <p className="text-sm font-medium">Follow-up automático</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ativar sequência de mensagens para este contato</p>
              </div>
              <Switch checked={followupActive} onCheckedChange={setFollowupActive} />
            </div>
            {followupActive && (
              <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-accent" />
                  <p className="text-sm font-medium">Sequência ativa</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  O follow-up será gerenciado pela integração com n8n. Quando ativado, o contato receberá mensagens
                  automáticas via WhatsApp conforme a sequência configurada.
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📩 Dia 0: Mensagem de boas-vindas</p>
                  <p>📩 Dia 1: Lembrete do veículo de interesse</p>
                  <p>📩 Dia 3: Última oportunidade</p>
                </div>
              </div>
            )}
            {!followupActive && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <RotateCcw className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>Ative o follow-up para enviar mensagens automáticas</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete */}
        <div className="mt-4 pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2">
                <Trash2 className="w-4 h-4" /> Excluir Negócio
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir negócio?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O negócio de "{contactName}" será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDealDialog;
