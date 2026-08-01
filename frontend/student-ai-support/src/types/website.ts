export interface Programme {
  id: string;
  title: string;
  category: 'Diploma' | 'Certification';
  duration: string;
  level: string;
  image: string;
  description: string;
  careerOutcomes: string[];
  prerequisites: string;
  tuitionFee: string;
  modules: string[];
}

export interface Founder {
  name: string;
  role: string;
  image: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Admissions' | 'Fees' | 'Academics' | 'General';
}

export interface ApplicationFormData {
  fullName: string;
  email: string;
  phone: string;
  programmeId: string;
  highestQualification: string;
  startDate: string;
}
