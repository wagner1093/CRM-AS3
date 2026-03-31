import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import loginCar from "@/assets/login-car.png";
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      if (activeTab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Login realizado com sucesso!" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 sm:px-12 lg:px-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(220 14% 96%), hsl(210 20% 92%))" }}>
        
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(210 90% 70% / 0.4), transparent)" }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.3), transparent)" }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md z-10"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(0 0% 9%), hsl(0 0% 20%))" }}>
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">AS3 Motors</span>
          </div>

          {/* Welcome */}
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Bem-vindo de volta</h1>
          <p className="text-muted-foreground text-sm mb-8">Entre com suas credenciais para acessar o CRM</p>

          {/* Tabs */}
          <div className="flex rounded-2xl p-1 mb-8"
            style={{
              background: "hsl(var(--glass))",
              backdropFilter: "blur(20px)",
              border: "1px solid hsl(var(--glass-border))",
            }}>
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-foreground text-background shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "signin" ? "Entrar" : "Criar Conta"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-13 rounded-xl border-none text-sm"
                  style={{
                    background: "hsl(var(--glass))",
                    backdropFilter: "blur(20px)",
                    boxShadow: "inset 0 1px 2px hsl(0 0% 0% / 0.04)",
                  }}
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-13 rounded-xl border-none text-sm"
                  style={{
                    background: "hsl(var(--glass))",
                    backdropFilter: "blur(20px)",
                    boxShadow: "inset 0 1px 2px hsl(0 0% 0% / 0.04)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Esqueceu a senha?
              </button>
            </div>

            {/* Submit */}
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-13 rounded-xl text-sm font-semibold relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, hsl(0 0% 9%), hsl(0 0% 20%))",
                  color: "hsl(0 0% 98%)",
                  boxShadow: "0 8px 30px hsl(0 0% 0% / 0.15)",
                }}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    Continuar <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Ou continue com</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social */}
          <div className="flex justify-center gap-4">
            {[
              { icon: "G", bg: "hsl(0 0% 100%)", color: "hsl(0 0% 20%)" },
              { icon: "", bg: "hsl(0 0% 9%)", color: "hsl(0 0% 100%)" },
              { icon: "f", bg: "hsl(220 90% 56%)", color: "hsl(0 0% 100%)" },
            ].map((s, i) => (
              <motion.button
                key={i}
                type="button"
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-md transition-shadow hover:shadow-lg"
                style={{
                  background: s.bg,
                  color: s.color,
                  border: i === 0 ? "1px solid hsl(var(--border))" : "none",
                }}
              >
                {i === 1 ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.89C10.1 6.87 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                  </svg>
                ) : (
                  s.icon
                )}
              </motion.button>
            ))}
          </div>

          {/* Footer text */}
          <p className="text-xs text-muted-foreground text-center mt-10 leading-relaxed max-w-xs mx-auto">
            Gerencie seus leads, acompanhe vendas e controle seu estoque de veículos com a plataforma mais moderna do mercado.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Car Image */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, hsl(210 60% 75%), hsl(210 70% 85%), hsl(200 50% 90%))" }}>
        
        {/* Glass overlay card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="absolute top-8 right-8 px-5 py-3 rounded-2xl z-10"
          style={{
            background: "hsl(0 0% 100% / 0.2)",
            backdropFilter: "blur(20px)",
            border: "1px solid hsl(0 0% 100% / 0.3)",
          }}
        >
          <p className="text-xs font-medium" style={{ color: "hsl(0 0% 20%)" }}>🚀 CRM Automotivo</p>
        </motion.div>

        {/* Floating stats card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="absolute bottom-20 left-8 px-6 py-4 rounded-2xl z-10"
          style={{
            background: "hsl(0 0% 100% / 0.25)",
            backdropFilter: "blur(24px)",
            border: "1px solid hsl(0 0% 100% / 0.35)",
          }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "hsl(0 0% 30%)" }}>Vendas este mês</p>
          <p className="text-2xl font-bold" style={{ color: "hsl(0 0% 10%)" }}>R$ 2.4M</p>
          <p className="text-xs mt-1" style={{ color: "hsl(152 60% 40%)" }}>↑ 18% vs mês anterior</p>
        </motion.div>

        {/* Car image */}
        <motion.img
          src={loginCar}
          alt="Carro esportivo"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="w-[85%] max-w-[600px] object-contain drop-shadow-2xl"
        />

        {/* Decorative circles */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(0 0% 100% / 0.6), transparent)" }} />
        <div className="absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(42 100% 50% / 0.4), transparent)" }} />
      </div>
    </div>
  );
};

export default LoginPage;
