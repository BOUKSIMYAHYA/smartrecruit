import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../services/api.js';
import { Interview } from '../../types/index.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Calendar as CalendarIcon,
  Video,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Star,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InterviewsCalendarPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Feedback Modal
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInterviews = async () => {
    setIsLoading(true);
    try {
      const res = await ApiClient.getInterviews();
      setInterviews(res.interviews);
    } catch (err) {
      console.error('Erreur chargement entretiens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const handleUpdateStatus = async (interviewId: string, status: any) => {
    try {
      await ApiClient.updateInterview(interviewId, { status });
      await fetchInterviews();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;
    setIsSubmitting(true);
    try {
      await ApiClient.updateInterview(selectedInterview.id, {
        feedback,
        rating: Number(rating),
        status: 'COMPLETED',
      });
      setSelectedInterview(null);
      await fetchInterviews();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Calendrier & Gestion des Entretiens
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Planifiez, suivez les convocations candidats et consignez les retours d'évaluation.
          </p>
        </div>
        <span className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200 self-start sm:self-auto">
          {interviews.length} entretien(s) au total
        </span>
      </div>

      {/* Interviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-20 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#004b82] mb-2" />
            <p className="text-xs">Chargement des entretiens...</p>
          </div>
        ) : interviews.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-navy-900 rounded-2xl p-12 text-center text-gray-400 border border-gray-200 dark:border-navy-800">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Aucun entretien planifié pour le moment</p>
            <p className="text-xs text-gray-500 mt-1">Planifiez des entretiens directement depuis le dossier de chaque candidat.</p>
            <div className="mt-4">
              <Link
                to="/hr/applications"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004b82] text-white hover:bg-[#003660] transition-colors"
              >
                Accéder aux candidatures
              </Link>
            </div>
          </div>
        ) : (
          interviews.map((item) => {
            const candUser = item.application?.candidateProfile?.user;
            const candName = candUser ? `${candUser.firstName || ''} ${candUser.lastName || ''}`.trim() || candUser.email : 'Candidat';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-navy-900 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-navy-800 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {item.type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.status === 'SCHEDULED'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                    <p className="text-xs font-semibold text-[#004b82] mt-0.5">
                      Candidat : {candName}
                    </p>
                    <p className="text-[11px] text-[#868889]">Poste : {item.application?.job?.title}</p>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 pt-2 border-t border-gray-100 dark:border-navy-800">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#004b82]" />
                      <span>
                        {new Intl.DateTimeFormat('fr-FR', {
                          dateStyle: 'full',
                          timeStyle: 'short',
                        }).format(new Date(item.scheduledAt))}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Durée : {item.durationMinutes} min</span>
                    </div>

                    {item.meetingLink && (
                      <div className="flex items-center gap-2 truncate">
                        <Video className="w-3.5 h-3.5 text-[#004b82] flex-shrink-0" />
                        <a
                          href={item.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#004b82] hover:underline truncate"
                        >
                          {item.meetingLink}
                        </a>
                      </div>
                    )}
                  </div>

                  {item.feedback && (
                    <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-navy-800 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                        <span>Note : {item.rating}/5</span>
                      </div>
                      <p className="italic">"{item.feedback}"</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/hr/applications/${item.applicationId}`}
                      className="px-2.5 py-1.5 bg-[#004b82]/10 text-[#004b82] hover:bg-[#004b82] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Dossier
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedInterview(item);
                        setFeedback(item.feedback || '');
                        setRating(item.rating || 4);
                      }}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold"
                    >
                      {item.feedback ? 'Feedback' : 'Évaluer'}
                    </button>
                  </div>

                  {item.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                    >
                      Terminé
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Feedback Modal */}
      {selectedInterview && (
        <Modal
          isOpen={Boolean(selectedInterview)}
          onClose={() => setSelectedInterview(null)}
          title={`Compte-rendu d'entretien : ${selectedInterview.title}`}
          maxWidth="md"
        >
          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Note globale du candidat (sur 5)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full"
                />
                <span className="font-bold text-base text-amber-500">{rating}/5</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Commentaires & Observations du recruteur
              </label>
              <textarea
                rows={4}
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Points forts démontrés, aisance relationnelle, niveau technique..."
                className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedInterview(null)}
                className="px-4 py-2 font-semibold text-gray-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Enregistrer l'évaluation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
