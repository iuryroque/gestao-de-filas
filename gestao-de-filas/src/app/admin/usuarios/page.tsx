"use client"

import React, { useState } from "react"
import { api } from "~/trpc/react"
import { useTheme } from "~/app/_components/ThemeContext"
import { Shield, User as UserIcon, Search, RefreshCw, Plus, Edit2, Trash2, X, Lock } from "lucide-react"

interface UserFormData {
  id?: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  groupId: string | null;
}

export default function UsuariosAdminPage() {
  const { highContrast } = useTheme()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null)
  
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    username: "",
    password: "",
    groupId: null
  })

  // TRPC Hooks
  const { data: users = [], isLoading, refetch } = api.admin.getUsers.useQuery()
  const { data: groups = [] } = api.admin.getGroups.useQuery()
  
  const saveUserMut = api.admin.saveUser.useMutation({
    onSuccess: () => {
      void refetch()
      closeModal()
    }
  })

  const deleteUserMut = api.admin.deleteUser.useMutation({
    onSuccess: () => void refetch()
  })

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openModal = (user?: any) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        username: user.username || "",
        password: "", // Don't show hashed password
        groupId: user.groupId
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: "",
        email: "",
        username: "",
        password: "",
        groupId: null
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveUserMut.mutate(formData)
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMut.mutate({ id })
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto pb-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className={`text-4xl font-display font-black tracking-tight mb-2 ${highContrast ? "text-white" : "text-primary"}`}>
            Controle de Operadores
          </h1>
          <p className={`text-sm font-body ${highContrast ? "text-white/60" : "text-secondary/70"}`}>
            Gerencie quem acessa o sistema e quais permissões eles possuem.
          </p>
        </div>

        <button 
          onClick={() => openModal()}
          className={`px-6 py-3 rounded-2xl flex items-center justify-center gap-3 font-display font-black shadow-lg transition-all hover:scale-105 active:scale-95 ${
            highContrast ? "bg-white text-black" : "bg-primary text-on-primary"
          }`}
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      <div className={`p-6 rounded-[2rem] flex flex-col gap-6 mb-8 transition-all ${
        highContrast ? "bg-black border border-white" : "bg-surface-lowest shadow-ambient border border-primary/5"
      }`}>
        <div className="flex justify-between items-center bg-transparent gap-4">
           <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl w-full max-w-sm transition-all ${
             highContrast ? "bg-white/10" : "bg-surface-low"
           }`}>
             <Search className={`w-5 h-5 ${highContrast ? "text-white/40" : "text-secondary/40"}`} />
             <input 
               type="text" 
               placeholder="Buscar por nome, email ou login..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className={`bg-transparent w-full outline-none text-sm font-body ${
                 highContrast ? "text-white placeholder:text-white/30" : "text-primary placeholder:text-secondary/40"
               }`}
             />
           </div>
           
           <button 
             onClick={() => void refetch()}
             className={`p-3 rounded-xl transition-all ${highContrast ? "hover:bg-white/10 text-white" : "hover:bg-primary/5 text-primary"}`}
           >
             <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin opacity-50" : ""}`} />
           </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b border-dashed ${highContrast ? "border-white/20 text-white/50" : "border-primary/10 text-secondary/50"}`}>
                <th className="pb-4 pt-2 px-4 text-[10px] uppercase tracking-widest font-black">Usuário</th>
                <th className="pb-4 pt-2 px-4 text-[10px] uppercase tracking-widest font-black">Login</th>
                <th className="pb-4 pt-2 px-4 text-[10px] uppercase tracking-widest font-black">Grupo (Perfil)</th>
                <th className="pb-4 pt-2 px-4 text-[10px] uppercase tracking-widest font-black">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm font-body italic opacity-50">
                    Sincronizando banco de dados...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm font-body italic opacity-50">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`group border-b border-dashed last:border-b-0 transition-colors ${
                    highContrast ? "border-white/10 hover:bg-white/5" : "border-primary/5 hover:bg-surface-low"
                  }`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          highContrast ? "bg-white text-black" : "bg-primary/10 text-primary"
                        }`}>
                          {user.image ? <img src={user.image} className="rounded-full" /> : <UserIcon className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-display font-bold ${highContrast ? "text-white" : "text-primary"}`}>
                            {user.name || "Sem Nome"}
                          </span>
                          <span className={`text-[10px] opacity-40 font-body ${highContrast ? "text-white" : ""}`}>
                            {user.email || "Email não cadastrado"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-sm font-mono font-bold ${highContrast ? "text-white/70" : "text-secondary/60"}`}>
                      @{user.username}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        highContrast ? "bg-white text-black" : "bg-primary/5 text-primary"
                      }`}>
                         {user.group?.name || "Sem Acesso"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                       <div className="flex items-center gap-2">
                         <button 
                           onClick={() => openModal(user)}
                           className={`p-2 rounded-lg transition-all ${highContrast ? "hover:bg-white/20 text-white" : "hover:bg-primary/5 text-primary"}`}
                           title="Editar Usuário"
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => handleDelete(user.id)}
                           className={`p-2 rounded-lg transition-all ${highContrast ? "hover:bg-error text-white" : "hover:bg-error/10 text-error"}`}
                           title="Excluir Usuário"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          
          <div className={`relative w-full max-w-lg p-10 rounded-[3rem] shadow-2xl animate-in fade-in zoom-in duration-300 ${
            highContrast ? "bg-black border-4 border-white" : "bg-surface-lowest"
          }`}>
            <div className="flex justify-between items-start mb-8">
               <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                   highContrast ? "bg-white text-black" : "bg-primary text-on-primary"
                 }`}>
                   <UserIcon className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className={`text-2xl font-display font-black leading-tight ${highContrast ? "text-white" : "text-primary"}`}>
                     {editingUser ? "Editar Operador" : "Novo Operador"}
                   </h3>
                   <p className={`text-xs font-body ${highContrast ? "text-white/60" : "text-secondary/60"}`}>
                     Preencha as informações de autenticação.
                   </p>
                 </div>
               </div>
               <button onClick={closeModal} className={`p-2 rounded-xl transition-all ${highContrast ? "text-white hover:bg-white/10" : "text-secondary hover:bg-primary/5"}`}>
                 <X className="w-6 h-6" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className={`text-[10px] uppercase font-black tracking-widest ml-1 ${highContrast ? "text-white/50" : "text-secondary/60"}`}>Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full px-5 py-3 rounded-xl border text-sm font-body outline-none focus:ring-2 ${
                      highContrast ? "bg-black border-white text-white focus:ring-white/20" : "bg-surface-low border-primary/10 text-primary focus:ring-primary/10"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-white">
                  <div className="space-y-2">
                    <label className={`text-[10px] uppercase font-black tracking-widest ml-1 ${highContrast ? "text-white/50" : "text-secondary/60"}`}>Username (@)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className={`w-full px-5 py-3 rounded-xl border text-sm font-body outline-none focus:ring-2 ${
                        highContrast ? "bg-black border-white text-white focus:ring-white/20" : "bg-surface-low border-primary/10 text-primary focus:ring-primary/10"
                      }`}
                      placeholder="login"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[10px] uppercase font-black tracking-widest ml-1 ${highContrast ? "text-white/50" : "text-secondary/60"}`}>Senha</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        required={!editingUser}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className={`w-full px-5 py-3 rounded-xl border text-sm font-body outline-none focus:ring-2 pr-10 ${
                          highContrast ? "bg-black border-white text-white focus:ring-white/20" : "bg-surface-low border-primary/10 text-primary focus:ring-primary/10"
                        }`}
                        placeholder={editingUser ? "Deixe em branco" : "Min. 4 chars"}
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] uppercase font-black tracking-widest ml-1 ${highContrast ? "text-white/50" : "text-secondary/60"}`}>Email Oficial</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-5 py-3 rounded-xl border text-sm font-body outline-none focus:ring-2 ${
                      highContrast ? "bg-black border-white text-white focus:ring-white/20" : "bg-surface-low border-primary/10 text-primary focus:ring-primary/10"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`text-[10px] uppercase font-black tracking-widest ml-1 ${highContrast ? "text-white/50" : "text-secondary/60"}`}>Grupo de Acesso</label>
                  <select 
                    required
                    value={formData.groupId || ""}
                    onChange={(e) => setFormData({...formData, groupId: e.target.value || null})}
                    className={`w-full px-5 py-3 rounded-xl border text-sm font-bold outline-none focus:ring-2 ${
                      highContrast ? "bg-black border-white text-white focus:ring-white/20" : "bg-surface-low border-primary/10 text-primary focus:ring-primary/10"
                    }`}
                  >
                    <option value="">Selecione um perfil...</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className={`flex-1 py-4 rounded-2xl font-bold transition-all ${
                    highContrast ? "text-white border border-white hover:bg-white/10" : "text-secondary bg-surface-low hover:bg-surface"
                  }`}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saveUserMut.isPending}
                  className={`flex-1 py-4 rounded-2xl font-display font-black shadow-lg transition-all hover:brightness-110 flex items-center justify-center gap-2 ${
                    highContrast ? "bg-white text-black" : "bg-primary text-on-primary"
                  }`}
                >
                  {saveUserMut.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingUser ? "Salvar Alterações" : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
