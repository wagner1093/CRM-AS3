import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockSequences, mockSteps, mockEnrollments, mockConversations } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Clock, MessageSquare, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const FollowupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [toggledSequences, setToggledSequences] = useState<Record<string, boolean>>(
    Object.fromEntries(mockSequences.map(s => [s.id, s.active]))
  );

  const handleToggle = (seqId: string, name: string) => {
    setToggledSequences(prev => {
      const newState = !prev[seqId];
      toast({ title: newState ? "Sequência ativada" : "Sequência pausada", description: name });
      return { ...prev, [seqId]: newState };
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Follow-up</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie sequências automáticas de mensagens</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Sequências</h2>
          <div className="space-y-4">
            {mockSequences.map((seq, i) => {
              const steps = mockSteps.filter(s => s.sequence_id === seq.id);
              const enrollments = mockEnrollments.filter(e => e.sequence_id === seq.id);
              return (
                <motion.div
                  key={seq.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-sm">{seq.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{seq.trigger_type.replace("_", " ")}</p>
                    </div>
                    <Switch checked={toggledSequences[seq.id]} onCheckedChange={() => handleToggle(seq.id, seq.name)} />
                  </div>
                  <div className="space-y-2.5">
                    {steps.map((step, j) => (
                      <div key={step.id} className="flex items-start gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 text-[11px] font-semibold text-accent">
                          {j + 1}
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Dia {step.day_offset}: </span>
                          <span>{step.message_template.substring(0, 65)}...</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{enrollments.length} inscritos</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Inscrições Ativas</h2>
          <div className="space-y-4">
            {mockEnrollments.map((enroll, i) => {
              const conv = mockConversations.find(c => c.id === enroll.conversation_id);
              const seq = mockSequences.find(s => s.id === enroll.sequence_id);
              if (!conv || !seq) return null;
              return (
                <motion.div
                  key={enroll.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 cursor-pointer hover:border-accent/20 transition-colors"
                  onClick={() => navigate(`/inbox?conv=${conv.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/5 border border-border flex items-center justify-center text-xs font-semibold">
                        {conv.contact.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{conv.contact.full_name}</p>
                        <p className="text-xs text-muted-foreground">{seq.name}</p>
                      </div>
                    </div>
                    <Badge variant={enroll.status === "active" ? "default" : "secondary"} className="rounded-full">
                      {enroll.status === "active" ? "Ativo" : enroll.status}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Inscrito: {new Date(enroll.enrolled_at).toLocaleDateString("pt-BR")}
                    {enroll.last_sent_at && ` · Último envio: ${new Date(enroll.last_sent_at).toLocaleDateString("pt-BR")}`}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowupPage;
