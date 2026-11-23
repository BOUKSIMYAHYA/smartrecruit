import pdfParse from 'pdf-parse';
import { FileSecurity } from '../utils/fileSecurity.js';

export interface ParsedResumeData {
  text: string;
  pageCount: number;
  info: any;
  extractedSkills: string[];
  extractedExperiences: string[];
  extractedEducation: string[];
}

// Common tech & business skill ontology for high-accuracy extraction
const SKILL_DATABASE = [
  // Frontend
  'React', 'Vue', 'Vue.js', 'Angular', 'Next.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'TanStack Query',
  // Backend
  'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'PHP', 'Laravel', 'Symfony', 'C#', '.NET', 'Go', 'Rust',
  // Database & Cache
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Prisma', 'TypeORM', 'SQL Server', 'Oracle',
  // Cloud & DevOps
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'Terraform', 'Linux', 'Nginx',
  // Architecture & APIs
  'REST API', 'GraphQL', 'Microservices', 'Clean Architecture', 'TDD', 'Agile', 'Scrum', 'Kafka', 'RabbitMQ',
  // Data & AI
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Pandas', 'Scikit-learn', 'NLP', 'LLM',
  // General & Business
  'Management', 'Recrutement', 'RH', 'Communication', 'Gestion de projet', 'Leadership', 'Supply Chain', 'Vente', 'Finance'
];

export class PdfParserService {
  /**
   * Extract raw text from PDF buffer
   */
  public static async extractTextFromBuffer(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      const clean = FileSecurity.sanitizeTextForAi(data.text);
      return clean;
    } catch (error) {
      console.error('Erreur lors du parsing PDF:', error);
      throw new Error('Impossible d\'extraire le contenu du fichier PDF.');
    }
  }

  /**
   * Parse structured entities from PDF buffer
   */
  public static async parseResume(buffer: Buffer): Promise<ParsedResumeData> {
    try {
      const data = await pdfParse(buffer);
      const text = FileSecurity.sanitizeTextForAi(data.text);

      const foundSkills: string[] = [];
      for (const skill of SKILL_DATABASE) {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text)) {
          foundSkills.push(skill);
        }
      }

      // Extract rudimentary experience and education lines
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const expLines: string[] = [];
      const eduLines: string[] = [];

      let currentSection: 'exp' | 'edu' | 'other' = 'other';
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('expérien') || lower.includes('parcours prof') || lower.includes('work history') || lower.includes('employment')) {
          currentSection = 'exp';
          continue;
        } else if (lower.includes('formation') || lower.includes('diplôme') || lower.includes('études') || lower.includes('education')) {
          currentSection = 'edu';
          continue;
        } else if (lower.includes('compétence') || lower.includes('skills') || lower.includes('langue') || lower.includes('loisirs')) {
          currentSection = 'other';
        }

        if (currentSection === 'exp' && line.length > 5 && expLines.length < 15) {
          expLines.push(line);
        } else if (currentSection === 'edu' && line.length > 5 && eduLines.length < 10) {
          eduLines.push(line);
        }
      }

      return {
        text,
        pageCount: data.numpages,
        info: data.info,
        extractedSkills: Array.from(new Set(foundSkills)),
        extractedExperiences: expLines,
        extractedEducation: eduLines,
      };
    } catch (error) {
      console.error('Erreur parseResume:', error);
      throw error;
    }
  }
}
