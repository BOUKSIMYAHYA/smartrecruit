import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api.js';
import { RoleBadge } from '../../components/common/Badge.js';
import { Modal } from '../../components/common/Modal.js';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  FileText,
  Activity,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const UsersRbacPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Role Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState('RECRUITER');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Collaborator Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignJobId, setAssignJobId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, logRes, jRes] = await Promise.all([
        ApiClient.getHrUsers(),
        ApiClient.getAuditLogs().catch(() => ({ logs: [] })),
        ApiClient.getHrJobs().catch(() => ({ jobs: [] })),
      ]);
      setUsers(uRes.users);
      setAuditLogs(logRes.logs);
      setJobs(jRes.jobs);
      if (uRes.users.length > 0) setAssignUserId(uRes.users[0].id);
      if (jRes.jobs.length > 0) setAssignJobId(jRes.jobs[0].id);
    } catch (err) {
      console.error('Erreur chargement RBAC:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsUpdatingRole(true);
    try {
      await ApiClient.updateUserRole(selectedUser.id, selectedRole);
      setSelectedUser(null);
      await fetchData();
      alert('Rôle utilisateur mis à jour avec succès.');
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de rôle.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await ApiClient.toggleUserStatus(user.id);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserId || !assignJobId) return;
    setIsAssigning(true);
    try {
      await ApiClient.assignJobCollaborator(assignJobId, assignUserId);
      setIsAssignModalOpen(false);
      await fetchData();
      alert('Responsable assigné au poste avec succès.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const isSuperAdminEmail = (email: string) =>
    ['yhykk8899@gmail.com', 'saadtoufik67@gmail.com'].includes(email.toLowerCase());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Gestion des Utilisateurs RH & Contrôle d'Accès (RBAC)
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Attribution des rôles, protection des privilèges et journal d'audit de sécurité des opérations sensibles.
          </p>
        </div>

        <button
          onClick={() => setIsAssignModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-navy-900 text-white hover:bg-navy-800 transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Assigner responsable opérationnel</span>
        </button>
      </div>

      {/* Security Rule Notice Banner */}
      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Politique de Sécurité Serveur Impérative :</p>
          <p className="leading-relaxed">
            Les comptes <strong>yhykk8899@gmail.com</strong> et <strong>saadtoufik67@gmail.com</strong> sont configurés de façon inviolable côté serveur avec le rôle <code>SUPER_ADMIN</code>. Les utilisateurs ordinaires ne peuvent jamais modifier leur propre rôle ou s'élever en administrateurs.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-gray-200 dark:border-navy-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Équipe RH & Administrateurs ({users.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-navy-800 text-[11px] uppercase font-bold text-gray-400 border-b border-gray-200 dark:border-navy-700">
              <tr>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Adresse e-mail</th>
                <th className="py-3 px-4">Rôle attribué</th>
                <th className="py-3 px-4">Postes assignés</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#004b82] mb-2" />
                    <span>Chargement des utilisateurs...</span>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isInitialAdmin = isSuperAdminEmail(u.email);
                  const assignedJobs = u.assignedJobs || [];

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-navy-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{u.firstName ? `${u.firstName} ${u.lastName || ''}` : 'Utilisateur RH'}</span>
                        {isInitialAdmin && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">
                            PROTECT
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="py-3.5 px-4">
                        {assignedJobs.length === 0 ? (
                          <span className="text-gray-400">Accès global ou non assigné</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedJobs.map((aj: any, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-mono">
                                {aj.job.reference}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.isActive ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedRole(u.role);
                            }}
                            disabled={isInitialAdmin}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                            title="Modifier le rôle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isInitialAdmin}
                            className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${
                              u.isActive ? 'text-gray-400 hover:text-rose-600' : 'text-gray-400 hover:text-emerald-600'
                            }`}
                            title={u.isActive ? 'Désactiver le compte' : 'Activer le compte'}
                          >
                            {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-gray-200 dark:border-navy-800 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Registre d'audit et traçabilité des opérations</h2>
          </div>
          <span className="text-[10px] text-gray-400">50 dernières opérations sensibles</span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-navy-800 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-200 dark:border-navy-700 sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Date & Heure</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Entité Cible</th>
                <th className="py-2.5 px-4">Utilisateur / Auteur</th>
                <th className="py-2.5 px-4">Adresse IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-navy-800 font-mono text-[11px]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400 italic font-sans text-xs">
                    Aucun événement d'audit consigné
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-navy-800/50">
                    <td className="py-2 px-4 text-gray-400">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2 px-4 font-bold text-blue-600">{log.action}</td>
                    <td className="py-2 px-4">{log.targetType} ({log.targetId ? log.targetId.slice(0, 8) : 'N/A'})</td>
                    <td className="py-2 px-4 font-sans">{log.user?.email || 'Système'}</td>
                    <td className="py-2 px-4 text-gray-400">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {selectedUser && (
        <Modal
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          title={`Modifier le rôle : ${selectedUser.email}`}
          maxWidth="md"
        >
          <form onSubmit={handleRoleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Sélectionnez le nouveau rôle applicatif
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Accès total système)</option>
                <option value="HR_ADMIN">HR_ADMIN (Administration recrutement)</option>
                <option value="HR_MANAGER">HR_MANAGER (Gestion des recrutements & validation)</option>
                <option value="OPERATIONAL_MANAGER">OPERATIONAL_MANAGER (Accès aux postes assignés)</option>
                <option value="RECRUITER">RECRUITER (Tri, entretiens, présélection)</option>
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 font-semibold text-gray-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isUpdatingRole}
                className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Enregistrer le rôle
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Collaborator Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assigner un Responsable Opérationnel à un poste"
        maxWidth="md"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Poste concerné</label>
            <select
              value={assignJobId}
              onChange={(e) => setAssignJobId(e.target.value)}
              required
              className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.reference})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Responsable RH / Opérationnel</label>
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              required
              className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 font-semibold text-gray-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isAssigning}
              className="px-5 py-2.5 rounded-xl font-bold bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50"
            >
              Valider l'assignation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
