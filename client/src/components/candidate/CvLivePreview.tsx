import React from 'react';
import { Mail, Phone, MapPin, Globe, Linkedin, Award, Briefcase, GraduationCap, CheckCircle } from 'lucide-react';

interface CvPreviewProps {
  data: {
    personalInfo: {
      fullName: string;
      email: string;
      phone: string;
      title: string;
      city: string;
      country: string;
      linkedIn: string;
      portfolio: string;
      summary: string;
    };
    experiences: Array<{
      id: string;
      jobTitle: string;
      company: string;
      location: string;
      startDate: string;
      endDate: string;
      isCurrent: boolean;
      description: string;
    }>;
    education: Array<{
      id: string;
      degree: string;
      fieldOfStudy: string;
      institution: string;
      location: string;
      startDate: string;
      endDate: string;
      description: string;
    }>;
    skills: Array<{ name: string; level: number }>;
    languages: Array<{ name: string; level: string }>;
    certifications: Array<{ title: string; issuer: string; year: string }>;
  };
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const CvLivePreview: React.FC<CvPreviewProps> = ({ data, previewRef }) => {
  const { personalInfo, experiences, education, skills, languages, certifications } = data;

  return (
    <div
      ref={previewRef as any}
      className="bg-white text-gray-900 w-full max-w-[800px] mx-auto min-h-[1050px] shadow-2xl rounded-sm p-8 md:p-12 font-sans border border-gray-200"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Header */}
      <div className="border-b-2 border-estc-blue pb-6 mb-6">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight text-estc-blue">
          {personalInfo.fullName || 'Prénom Nom'}
        </h1>
        <p className="text-lg font-semibold text-estc-gray mt-1">
          {personalInfo.title || 'Titre Professionnel Souhaité'}
        </p>

        {/* Contact Strip */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-estc-gray">
          {personalInfo.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-estc-blue" />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-estc-blue" />
              {personalInfo.phone}
            </span>
          )}
          {(personalInfo.city || personalInfo.country) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-estc-blue" />
              {[personalInfo.city, personalInfo.country].filter(Boolean).join(', ')}
            </span>
          )}
          {personalInfo.linkedIn && (
            <span className="flex items-center gap-1">
              <Linkedin className="w-3.5 h-3.5 text-estc-blue" />
              {personalInfo.linkedIn}
            </span>
          )}
          {personalInfo.portfolio && (
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-estc-blue" />
              {personalInfo.portfolio}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-2 border-b border-gray-200 pb-1">
            Profil & Synthèse Professionnelle
          </h2>
          <p className="text-xs leading-relaxed text-gray-700">{personalInfo.summary}</p>
        </div>
      )}

      {/* Two columns layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Column (Exp & Edu) */}
        <div className="md:col-span-2 space-y-6">
          {/* Work Experience */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 border-b border-gray-200 pb-1 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-estc-blue" />
              <span>Expériences Professionnelles</span>
            </h2>

            {experiences.length === 0 ? (
              <p className="text-xs italic text-gray-400">Aucune expérience renseignée</p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="relative pl-4 border-l-2 border-[#004b82]/40">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-bold text-gray-900">{exp.jobTitle}</h3>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {exp.startDate} - {exp.isCurrent ? 'Présent' : exp.endDate}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-estc-blue">
                      {exp.company} {exp.location ? `• ${exp.location}` : ''}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 border-b border-gray-200 pb-1 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-estc-blue" />
              <span>Formations & Diplômes</span>
            </h2>

            {education.length === 0 ? (
              <p className="text-xs italic text-gray-400">Aucune formation renseignée</p>
            ) : (
              <div className="space-y-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="relative pl-4 border-l-2 border-[#004b82]/30">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-sm font-bold text-gray-900">{edu.degree}</h3>
                      <span className="text-[11px] text-gray-500">
                        {edu.startDate} - {edu.endDate}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-estc-blue">
                      {edu.institution} {edu.location ? `• ${edu.location}` : ''}
                    </p>
                    {edu.description && (
                      <p className="text-xs text-gray-600 mt-0.5">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column (Skills, Languages, Certifications) */}
        <div className="space-y-6">
          {/* Skills */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 border-b border-gray-200 pb-1">
              Compétences Clés
            </h2>
            {skills.length === 0 ? (
              <p className="text-xs italic text-gray-400">Aucune compétence</p>
            ) : (
              <div className="space-y-2">
                {skills.map((skill, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-medium mb-0.5">
                      <span className="text-gray-800">{skill.name}</span>
                      <span className="text-gray-400 text-[10px]">{skill.level}/5</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-estc-blue h-full rounded-full"
                        style={{ width: `${(skill.level / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Languages */}
          {languages && languages.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 border-b border-gray-200 pb-1">
                Langues
              </h2>
              <div className="space-y-1.5">
                {languages.map((lang, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="font-medium text-gray-800">{lang.name}</span>
                    <span className="text-gray-500">{lang.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-navy-900 mb-3 border-b border-gray-200 pb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-estc-blue" />
                <span>Certifications</span>
              </h2>
              <div className="space-y-2">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="text-xs">
                    <p className="font-semibold text-gray-900">{cert.title}</p>
                    <p className="text-gray-500 text-[11px]">
                      {cert.issuer} {cert.year ? `(${cert.year})` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
