import { Programme, Founder, FAQItem } from '../types/website';

export const PROGRAMMES: Programme[] = [
  {
    id: 'diploma-it',
    title: 'Diploma in Information Technology',
    category: 'Diploma',
    duration: '12 Months',
    level: 'Undergraduate Diploma',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    description: 'A comprehensive foundational diploma covering computer hardware, networking fundamentals, database administration, web programming, and IT service management.',
    careerOutcomes: ['IT Support Specialist', 'Network Administrator', 'Systems Analyst', 'Technical Support Engineer'],
    prerequisites: 'High School Certificate / WASSCE or equivalent diploma',
    tuitionFee: 'GHS 4,500 / year (Instalment options available)',
    modules: ['Computer Systems & Hardware', 'Networking & Protocols', 'Introduction to SQL Databases', 'Web Development Fundamentals', 'IT Infrastructure & Support']
  },
  {
    id: 'cloud-computing',
    title: 'Cloud Computing',
    category: 'Certification',
    duration: '6 Months',
    level: 'Professional Certification',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    description: 'Master multi-cloud architecture, AWS & GCP infrastructure, containerization, serverless computing, and Cloud Security for enterprise systems.',
    careerOutcomes: ['Cloud Solutions Architect', 'AWS/GCP Cloud Specialist', 'Infrastructure Engineer', 'Site Reliability Engineer'],
    prerequisites: 'Basic knowledge of networking and operating systems',
    tuitionFee: 'GHS 3,200 (Flexible payment plans available)',
    modules: ['Cloud Infrastructure & Architecture', 'Amazon Web Services (AWS) Core', 'Google Cloud Platform (GCP) Fundamentals', 'Serverless & Microservices', 'Cloud Security & Compliance']
  },
  {
    id: 'web-development',
    title: 'Web Development',
    category: 'Certification',
    duration: '6 Months',
    level: 'Professional Certification',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80',
    description: 'Full-stack modern web development training covering HTML5/CSS3, JavaScript (ES6+), React.js, Node.js, Express, and RESTful API deployment.',
    careerOutcomes: ['Full Stack Web Developer', 'Frontend Developer', 'Node.js Backend Developer', 'UI Engineer'],
    prerequisites: 'Basic computer literacy and passion for coding',
    tuitionFee: 'GHS 2,800 (Instalment plans available)',
    modules: ['Modern HTML5 & Responsive Tailwind CSS', 'JavaScript Deep Dive & Async Programming', 'React.js & State Management', 'Node.js & Express API Development', 'Full Stack Deployment & Testing']
  },
  {
    id: 'devops-engineering',
    title: 'DevOps Engineering',
    category: 'Certification',
    duration: '6 Months',
    level: 'Professional Certification',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    description: 'Bridge software development and IT operations through continuous integration, CI/CD pipelines, Docker, Kubernetes, Terraform, and automated deployment.',
    careerOutcomes: ['DevOps Engineer', 'CI/CD Pipeline Specialist', 'Infrastructure Automation Engineer', 'Build Engineer'],
    prerequisites: 'Prior familiarity with Linux and basic scripting',
    tuitionFee: 'GHS 3,500 (Instalment plans available)',
    modules: ['Linux Systems & Shell Scripting', 'Git Version Control & Workflows', 'Docker & Containerization', 'Kubernetes Cluster Administration', 'CI/CD with Jenkins & GitHub Actions', 'Terraform Infrastructure as Code']
  },
  {
    id: 'cyber-security',
    title: 'Cyber Security',
    category: 'Diploma',
    duration: '9 Months',
    level: 'Advanced Diploma',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    description: 'Learn offensive and defensive security strategies, threat monitoring, penetration testing, network defense, cryptography, and security compliance.',
    careerOutcomes: ['Cyber Security Analyst', 'Penetration Tester', 'SOC Analyst', 'Information Security Officer'],
    prerequisites: 'Basic understanding of networking concepts',
    tuitionFee: 'GHS 4,200 (Flexible payment plans available)',
    modules: ['Ethical Hacking & Reconnaissance', 'Network Defense & Firewalls', 'Security Information & Event Management (SIEM)', 'Web Application Security & OWASP', 'Incident Response & Digital Forensics']
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing',
    category: 'Certification',
    duration: '4 Months',
    level: 'Professional Certification',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    description: 'Comprehensive digital growth strategies, search engine optimization (SEO), paid advertising campaigns, content marketing, and web analytics.',
    careerOutcomes: ['Digital Marketing Specialist', 'SEO Manager', 'Social Media Strategist', 'Growth Hacker'],
    prerequisites: 'Open to all backgrounds',
    tuitionFee: 'GHS 2,200 (Instalment plans available)',
    modules: ['Search Engine Optimization (SEO)', 'Pay-Per-Click Advertising (Google Ads)', 'Social Media Strategy & Marketing', 'Content Strategy & Email Campaigns', 'Web Analytics & Conversion Rate Optimization']
  }
];

export const FOUNDERS: Founder[] = [
  {
    name: 'William Mukoyani',
    role: 'Co-Founder & Executive Director',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Richard Vidzrakou',
    role: 'Co-Founder & Head of Academic Affairs',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Humaidu Ali Mohammed',
    role: 'Co-Founder & Chief Technology Officer',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Freda Kemphrey',
    role: 'Co-Founder & Director of Student Experience',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Hassanatu Ahmmed',
    role: 'Co-Founder & Head of Admissions',
    image: 'https://images.unsplash.com/photo-1580894732413-806716075932?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Frank Amoako',
    role: 'Co-Founder & Lead Cloud Architect',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80'
  },
  {
    name: 'Joel Addition',
    role: 'Co-Founder & Director of Partnerships',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
  }
];

export const HIGHLIGHTS = [
  {
    title: 'Industry-Focused Curriculum',
    description: 'Designed in direct consultation with leading tech firms across West Africa and international software enterprises.',
    icon: 'code'
  },
  {
    title: 'Experienced Instructors',
    description: 'Learn directly from veteran software architects, cloud engineers, and active industry practitioners.',
    icon: 'school'
  },
  {
    title: 'Flexible Online Learning',
    description: 'Study at your own pace with self-guided modules, live interactive lectures, and recorded lab sessions.',
    icon: 'devices'
  },
  {
    title: 'Practical Projects',
    description: 'Graduate with a portfolio of real-world capstone projects built to industry software standards.',
    icon: 'rocket_launch'
  },
  {
    title: 'Career-Focused Education',
    description: 'Dedicated career coaching, resume building workshops, and direct placement assistance with partner companies.',
    icon: 'work'
  },
  {
    title: 'AI-Powered Student Support',
    description: 'Access 24/7 instant academic assistance, policy guidance, and course assistance powered by our Hypervisor AI.',
    icon: 'psychology'
  }
];

export const WHY_HYPERVISOR = [
  {
    title: 'Practical Learning',
    description: 'Our teaching methodology prioritizes hands-on coding, live lab setups, and real-world system debugging over purely theoretical lectures.',
    icon: 'terminal'
  },
  {
    title: 'Industry Relevant Skills',
    description: 'We update our technical curriculum quarterly to reflect current frameworks, cloud platforms, and security standards demanded by employers.',
    icon: 'stars'
  },
  {
    title: 'Flexible Learning Options',
    description: 'Whether you prefer intensive evening classes or weekend virtual bootcamps, our flexible timetables accommodate working professionals.',
    icon: 'schedule'
  },
  {
    title: 'Student Support Ecosystem',
    description: 'From academic advising to peer tutoring groups and 24/7 AI assistance, every student receives comprehensive guidance from day one.',
    icon: 'diversity_3'
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Admissions',
    question: 'What are the basic entry requirements for Hypervisor programmes?',
    answer: 'Applicants should hold a High School Certificate (WASSCE / SSSCE / O-Level) or an equivalent diploma. Basic computer literacy and a passion for technology are required for all technical tracks.'
  },
  {
    id: 'faq-2',
    category: 'Fees',
    question: 'Are flexible tuition payment plans available?',
    answer: 'Yes! We offer 3-part and 4-part instalment options for all diplomas and certification programmes. Students can pay tuition via credit card, wire transfer, or Mobile Money (MTN MoMo, Telecel Cash, AT Money).'
  },
  {
    id: 'faq-3',
    category: 'Academics',
    question: 'Are classes conducted online or on-campus in Accra?',
    answer: 'Hypervisor Educational Complex provides hybrid learning options. All lectures and lab sessions are live-streamed online with interactive recording archives, and students in Accra can also join optional in-person weekend workshops.'
  },
  {
    id: 'faq-4',
    category: 'Admissions',
    question: 'How long does the admission application process take?',
    answer: 'Once you submit your application online, our admissions team reviews your document within 48 hours. Successful candidates receive an official Admission Offer Letter via email.'
  },
  {
    id: 'faq-5',
    category: 'General',
    question: 'What certificate or diploma do I receive upon graduation?',
    answer: 'Graduates receive an officially accredited Hypervisor Educational Complex Certificate or Advanced Diploma, along with transcript verification credentials that can be shared with employers worldwide.'
  }
];
