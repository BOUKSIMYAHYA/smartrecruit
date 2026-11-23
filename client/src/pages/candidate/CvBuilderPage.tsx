import React, { useState, useRef } from 'react';
import { CvLivePreview } from '../../components/candidate/CvLivePreview.js';
import { ApiClient } from '../../services/api.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Save,
  Download,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Check,
  Loader2,
} from 'lucide-react';

export const CvBuilderPage: React.FC = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'exp' | 'edu' | 'skills' | 'languages' | 'certs'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // CV Data State
  const [cvData, setCvData] = useState({
    personalInfo: {
      fullName: 'Yassine Toufik',
      email: 'yassine.toufik@estc.ma',
      phone: '+212 6 12 34 56 78',
      title: 'Ingénieur d\'État / Lauréat EST Casablanca',
      city: 'Casablanca',
      country: 'Maroc',
      linkedIn: 'linkedin.com/in/yassine-toufik',
      portfolio: 'github.com/yassine-toufik',
      summary:
        'Lauréat de l\'École Supérieure de Technologie de Casablanca avec expertise en génie logiciel, développement d\'applications web full stack réactives et gestion de bases de données relationnelles.',
    },
    experiences: [
      {
        id: '1',
        jobTitle: 'Senior Full Stack Developer',
        company: 'TechCorp Solutions',
        location: 'Paris, France',
        startDate: '2022',
        endDate: 'Présent',
        isCurrent: true,
        description:
          'Développement de microservices Node.js haute disponibilité.\nCréation d\'interfaces React 18 avec Tailwind CSS et TanStack Query.\nAmélioration des performances PostgreSQL réduisant la latence moyenne de 40%.',
      },
      {
        id: '2',
        jobTitle: 'Développeur Frontend Web',
        company: 'Digital Factory',
        location: 'Lyon, France',
        startDate: '2020',
        endDate: '2022',
        isCurrent: false,
        description:
          'Intégration d\'applications SaaS sous React et TypeScript.\nCollaboration avec l\'équipe UI/UX pour l\'implémentation d\'un Design System complet.',
      },
    ],
    education: [
      {
        id: '1',
        degree: 'DUT / Licence Professionnelle en Génie Logiciel',
        fieldOfStudy: 'Génie Informatique',
        institution: 'École Supérieure de Technologie de Casablanca (ESTC)',
        location: 'Casablanca, Maroc',
        startDate: '2021',
        endDate: '2023',
        description: 'Formation approfondie en conception logicielle, architectures distribuées et bases de données.',
      },
    ],
    skills: [
      { name: 'React', level: 5 },
      { name: 'TypeScript', level: 5 },
      { name: 'Node.js', level: 4 },
      { name: 'PostgreSQL', level: 4 },
      { name: 'Docker', level: 3 },
      { name: 'Git & CI/CD', level: 4 },
    ],
    languages: [
      { name: 'Français', level: 'Langue maternelle' },
      { name: 'Anglais', level: 'Courant professionnel (C1)' },
    ],
    certifications: [
      { title: 'AWS Certified Developer', issuer: 'Amazon Web Services', year: '2023' },
    ],
  });

  // Export to PDF using html2canvas & jsPDF
  const handleExportPdf = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const element = previewRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CV_${cvData.personalInfo.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erreur export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Save to database
  const handleSaveToPlatform = async () => {
    setIsSaving(true);
    try {
      await ApiClient.savePlatformResume(
        `CV de ${cvData.personalInfo.fullName} (${cvData.personalInfo.title})`,
        cvData
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde CV:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Éditeur Interactif Haute Définition
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Créateur de CV Professionnel
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Remplissez les informations à gauche, visualisez votre CV en temps réel à droite, sauvegardez sur votre profil ou téléchargez en PDF.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveToPlatform}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#868889] hover:bg-[#6f7172] text-white transition-all flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Enregistré sur la plateforme !' : 'Enregistrer sur mon profil'}</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#004b82] hover:bg-[#003660] text-white shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Exporter en PDF</span>
          </button>
        </div>
      </div>

      {/* Split Screen Layout: Left Form, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-navy-800 space-y-5">
          {/* Tabs */}
          <div className="flex border-b border-[#e2e5e7] overflow-x-auto pb-2 gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'info' ? 'bg-[#004b82] text-white' : 'text-[#868889] hover:bg-gray-100'
              }`}
            >
              Identité
            </button>
            <button
              onClick={() => setActiveTab('exp')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'exp' ? 'bg-[#004b82] text-white' : 'text-[#868889] hover:bg-gray-100'
              }`}
            >
              Expériences
            </button>
            <button
              onClick={() => setActiveTab('edu')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'edu' ? 'bg-[#004b82] text-white' : 'text-[#868889] hover:bg-gray-100'
              }`}
            >
              Formations
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'skills' ? 'bg-[#004b82] text-white' : 'text-[#868889] hover:bg-gray-100'
              }`}
            >
              Compétences
            </button>
            <button
              onClick={() => setActiveTab('languages')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'languages' ? 'bg-[#004b82] text-white' : 'text-[#868889] hover:bg-gray-100'
              }`}
            >
              Langues & Certifs
            </button>
          </div>

          {/* TAB 1: Personal Info */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={cvData.personalInfo.fullName}
                  onChange={(e) =>
                    setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, fullName: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Titre professionnel</label>
                <input
                  type="text"
                  value={cvData.personalInfo.title}
                  onChange={(e) =>
                    setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, title: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={cvData.personalInfo.email}
                    onChange={(e) =>
                      setCvData({
                        ...cvData,
                        personalInfo: { ...cvData.personalInfo, email: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={cvData.personalInfo.phone}
                    onChange={(e) =>
                      setCvData({
                        ...cvData,
                        personalInfo: { ...cvData.personalInfo, phone: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                  <input
                    type="text"
                    value={cvData.personalInfo.city}
                    onChange={(e) =>
                      setCvData({
                        ...cvData,
                        personalInfo: { ...cvData.personalInfo, city: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Pays</label>
                  <input
                    type="text"
                    value={cvData.personalInfo.country}
                    onChange={(e) =>
                      setCvData({
                        ...cvData,
                        personalInfo: { ...cvData.personalInfo, country: e.target.value },
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Profil & Résumé</label>
                <textarea
                  rows={4}
                  value={cvData.personalInfo.summary}
                  onChange={(e) =>
                    setCvData({
                      ...cvData,
                      personalInfo: { ...cvData.personalInfo, summary: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-xl leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Experiences */}
          {activeTab === 'exp' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Postes occupés ({cvData.experiences.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCvData({
                      ...cvData,
                      experiences: [
                        ...cvData.experiences,
                        {
                          id: String(Date.now()),
                          jobTitle: 'Nouveau poste',
                          company: 'Entreprise',
                          location: 'Ville',
                          startDate: '2023',
                          endDate: 'Présent',
                          isCurrent: true,
                          description: 'Description des missions et technologies.',
                        },
                      ],
                    })
                  }
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un poste</span>
                </button>
              </div>

              {cvData.experiences.map((exp, idx) => (
                <div key={exp.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-navy-700 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-gray-200">Poste #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCvData({
                          ...cvData,
                          experiences: cvData.experiences.filter((e) => e.id !== exp.id),
                        })
                      }
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Intitulé du poste"
                    value={exp.jobTitle}
                    onChange={(e) => {
                      const updated = [...cvData.experiences];
                      updated[idx].jobTitle = e.target.value;
                      setCvData({ ...cvData, experiences: updated });
                    }}
                    className="w-full p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg font-semibold"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Entreprise"
                      value={exp.company}
                      onChange={(e) => {
                        const updated = [...cvData.experiences];
                        updated[idx].company = e.target.value;
                        setCvData({ ...cvData, experiences: updated });
                      }}
                      className="w-full p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Localisation"
                      value={exp.location}
                      onChange={(e) => {
                        const updated = [...cvData.experiences];
                        updated[idx].location = e.target.value;
                        setCvData({ ...cvData, experiences: updated });
                      }}
                      className="w-full p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Début (ex: 2021)"
                      value={exp.startDate}
                      onChange={(e) => {
                        const updated = [...cvData.experiences];
                        updated[idx].startDate = e.target.value;
                        setCvData({ ...cvData, experiences: updated });
                      }}
                      className="w-full p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Fin (ex: 2023 ou Présent)"
                      value={exp.endDate}
                      onChange={(e) => {
                        const updated = [...cvData.experiences];
                        updated[idx].endDate = e.target.value;
                        setCvData({ ...cvData, experiences: updated });
                      }}
                      className="w-full p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Missions réalisées, stack technique, réalisations..."
                    value={exp.description}
                    onChange={(e) => {
                      const updated = [...cvData.experiences];
                      updated[idx].description = e.target.value;
                      setCvData({ ...cvData, experiences: updated });
                    }}
                    className="w-full p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Education */}
          {activeTab === 'edu' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Formations & Diplômes ({cvData.education.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCvData({
                      ...cvData,
                      education: [
                        ...cvData.education,
                        {
                          id: String(Date.now()),
                          degree: 'Nouveau diplôme',
                          fieldOfStudy: 'Domaine d\'études',
                          institution: 'École / Université',
                          location: 'Ville',
                          startDate: '2020',
                          endDate: '2023',
                          description: '',
                        },
                      ],
                    })
                  }
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter une formation</span>
                </button>
              </div>

              {cvData.education.map((edu, idx) => (
                <div key={edu.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-navy-700 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-gray-200">Formation #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCvData({
                          ...cvData,
                          education: cvData.education.filter((e) => e.id !== edu.id),
                        })
                      }
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Diplôme ou titre"
                    value={edu.degree}
                    onChange={(e) => {
                      const updated = [...cvData.education];
                      updated[idx].degree = e.target.value;
                      setCvData({ ...cvData, education: updated });
                    }}
                    className="w-full p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg font-semibold"
                  />

                  <input
                    type="text"
                    placeholder="Établissement / Université"
                    value={edu.institution}
                    onChange={(e) => {
                      const updated = [...cvData.education];
                      updated[idx].institution = e.target.value;
                      setCvData({ ...cvData, education: updated });
                    }}
                    className="w-full p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Skills */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Compétences techniques & métiers ({cvData.skills.length})
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCvData({
                      ...cvData,
                      skills: [...cvData.skills, { name: 'Nouvelle compétence', level: 4 }],
                    })
                  }
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>

              <div className="space-y-3">
                {cvData.skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-navy-800 border border-gray-200 dark:border-navy-700">
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => {
                        const updated = [...cvData.skills];
                        updated[idx].name = e.target.value;
                        setCvData({ ...cvData, skills: updated });
                      }}
                      className="flex-1 bg-transparent border-0 text-xs font-semibold focus:outline-none"
                    />
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={skill.level}
                      onChange={(e) => {
                        const updated = [...cvData.skills];
                        updated[idx].level = Number(e.target.value);
                        setCvData({ ...cvData, skills: updated });
                      }}
                      className="w-20"
                    />
                    <span className="text-[11px] font-bold text-blue-600 w-4">{skill.level}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCvData({
                          ...cvData,
                          skills: cvData.skills.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-gray-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Languages & Certifications */}
          {activeTab === 'languages' && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Langues</h3>
                {cvData.languages.map((lang, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={lang.name}
                      onChange={(e) => {
                        const updated = [...cvData.languages];
                        updated[idx].name = e.target.value;
                        setCvData({ ...cvData, languages: updated });
                      }}
                      className="flex-1 p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={lang.level}
                      onChange={(e) => {
                        const updated = [...cvData.languages];
                        updated[idx].level = e.target.value;
                        setCvData({ ...cvData, languages: updated });
                      }}
                      className="flex-1 p-2 bg-gray-50 dark:bg-navy-800 border border-gray-200 rounded-lg"
                    />
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2">Certifications</h3>
                {cvData.certifications.map((cert, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-gray-200 dark:border-navy-700 space-y-2">
                    <input
                      type="text"
                      placeholder="Titre de la certification"
                      value={cert.title}
                      onChange={(e) => {
                        const updated = [...cvData.certifications];
                        updated[idx].title = e.target.value;
                        setCvData({ ...cvData, certifications: updated });
                      }}
                      className="w-full p-1.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 rounded font-semibold"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Organisme émetteur"
                        value={cert.issuer}
                        onChange={(e) => {
                          const updated = [...cvData.certifications];
                          updated[idx].issuer = e.target.value;
                          setCvData({ ...cvData, certifications: updated });
                        }}
                        className="flex-1 p-1.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Année"
                        value={cert.year}
                        onChange={(e) => {
                          const updated = [...cvData.certifications];
                          updated[idx].year = e.target.value;
                          setCvData({ ...cvData, certifications: updated });
                        }}
                        className="w-20 p-1.5 bg-gray-50 dark:bg-navy-800 border border-gray-200 rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Column (7 cols) */}
        <div className="lg:col-span-7 bg-gray-100 dark:bg-navy-950 p-4 rounded-2xl border border-gray-200 dark:border-navy-800 overflow-x-auto">
          <div className="text-center pb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Aperçu Réel en Temps Réel (Format Page A4)
          </div>
          <CvLivePreview data={cvData} previewRef={previewRef} />
        </div>
      </div>
    </div>
  );
};
