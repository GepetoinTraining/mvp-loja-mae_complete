"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export function PerfilForm() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [nome, setNome] = useState("");
  const [tituloLoja, setTituloLoja] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.name ?? "");
      setTituloLoja(user.tituloLoja ?? "");
      setEmail(user.email ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!nome || !email) return alert("Nome e e-mail são obrigatórios.");
    if (senha && senha !== confirmacaoSenha) {
      return alert("As senhas não coincidem.");
    }

    setLoading(true);

    const res = await fetch("/api/usuario", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user?.id,
        name: nome,
        tituloLoja,
        email,
        senha: senha || undefined,
        avatarUrl,
      }),
    });

    setLoading(false);

    if (res.ok) {
      const updated = await res.json();
      setUser(updated); // Atualiza Zustand
      localStorage.setItem("vendedorId", updated.id);
      alert("Perfil atualizado com sucesso!");
    } else {
      alert("Erro ao atualizar perfil.");
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Meu Perfil</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Nome completo</label>
        <input
          className="w-full border px-3 py-2 rounded"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Título da loja</label>
        <input
          className="w-full border px-3 py-2 rounded"
          value={tituloLoja}
          onChange={(e) => setTituloLoja(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">E-mail</label>
        <input
          type="email"
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Nova senha</label>
        <input
          type="password"
          className="w-full border px-3 py-2 rounded"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Confirmar nova senha</label>
        <input
          type="password"
          className="w-full border px-3 py-2 rounded"
          value={confirmacaoSenha}
          onChange={(e) => setConfirmacaoSenha(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Foto de perfil (URL)</label>
        <input
          className="w-full border px-3 py-2 rounded"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
      >
        {loading ? "Salvando..." : "Salvar alterações"}
      </button>
    </div>
  );
}
