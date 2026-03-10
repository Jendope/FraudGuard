'use client'

import { useState, useEffect, useRef, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Brain, 
  Bell, 
  Users, 
  Lock, 
  MessageCircle, 
  ChevronRight, 
  Menu, 
  X,
  CheckCircle2,
  Star,
  ArrowRight,
  Heart,
  Eye,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Database,
  RefreshCw,
  FileSearch,
  TrendingUp,
  Cpu,
  BookOpen,
  Github,
  ExternalLink
} from 'lucide-react'

// Scroll-triggered fade-in hook
function useFadeIn<T extends HTMLElement = HTMLDivElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, visible]
}

// Header Component
function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Validation', href: '#validation' },
    { label: 'Team', href: '#team' },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 leading-tight">HK FraudGuard</span>
              <span className="text-xs text-gray-500 hidden sm:block">RAG-Based Detection</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="https://github.com/Jendope/allinone" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="ghost" className="text-gray-600 gap-2">
                <Github className="w-5 h-5" />
                GitHub
              </Button>
            </a>
            <a href="#how-it-works">
              <Button className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full px-6">
                Try Demo
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t py-4">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 px-4 pt-4 border-t">
                <a 
                  href="https://github.com/Jendope/allinone" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full justify-center gap-2">
                    <Github className="w-5 h-5" />
                    View on GitHub
                  </Button>
                </a>
                <a href="#how-it-works" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center bg-gradient-to-r from-teal-500 to-emerald-600 text-white">
                    Try Demo
                  </Button>
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-emerald-50" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-orange-200/20 to-red-200/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
              <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-full text-sm font-medium">
                <Brain className="w-4 h-4 mr-2" />
                LLM + RAG Powered
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 px-4 py-2 rounded-full text-sm font-medium">
                <MapPin className="w-4 h-4 mr-2" />
                Hong Kong Focused
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Fraud Detection{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-600">
                Powered by AI
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Advanced fraud detection system using Large Language Models and Retrieval-Augmented Generation to protect Hong Kong residents from scams.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="https://github.com/Jendope/allinone" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-full px-8 h-14 text-lg shadow-lg shadow-teal-500/25 gap-2">
                  <Github className="w-5 h-5" />
                  View Project
                </Button>
              </a>
              <a href="#features">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-2">
                  Learn More
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            </div>
            
            {/* Key Metrics */}
            <div className="mt-10 grid grid-cols-3 gap-6">
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-gray-900">606</p>
                <p className="text-sm text-gray-500">Fraud Articles</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-gray-900">86.4%</p>
                <p className="text-sm text-gray-500">Accuracy</p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-3xl font-bold text-gray-900">Daily</p>
                <p className="text-sm text-gray-500">Updates</p>
              </div>
            </div>
          </div>
          
          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src="/hk-fraudguard-hero.png" 
                alt="HK FraudGuard AI Protection" 
                className="w-full h-auto rounded-3xl shadow-2xl shadow-teal-500/10"
              />
            </div>
            {/* Floating Cards */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-float">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Scam Detected</p>
                <p className="text-xs text-gray-500">Score: 8.5/10</p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-float-delayed">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                <Database className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">RAG Analysis</p>
                <p className="text-xs text-gray-500">3 Similar Cases</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const [ref, visible] = useFadeIn()

  const features = [
    {
      icon: Brain,
      title: 'LLM-Powered Analysis',
      description: 'DeepSeek-v3.2 provides intelligent fraud analysis with explainable reasoning.',
      color: 'from-teal-500 to-emerald-600'
    },
    {
      icon: Database,
      title: 'RAG Knowledge Base',
      description: 'Retrieval-Augmented Generation grounds analysis in 606 verified fraud cases from HK01.',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      icon: RefreshCw,
      title: 'Daily Updates',
      description: 'Automated daily knowledge base updates at 02:00 HKT to catch emerging scam tactics.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Eye,
      title: 'Explainable Results',
      description: 'Fraud probability scores (0-10) with justifications referencing similar verified cases.',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: MapPin,
      title: 'Hong Kong Focus',
      description: 'Specifically trained on Hong Kong fraud patterns from local news sources.',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Lock,
      title: 'Privacy Compliant',
      description: 'Complies with Hong Kong Personal Data (Privacy) Ordinance (Cap. 486).',
      color: 'from-green-500 to-emerald-600'
    }
  ]

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Badge className="mb-4 bg-teal-100 text-teal-700">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Advanced Fraud Detection Technology
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our RAG-based system combines LLM intelligence with verified fraud case data for accurate detection.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`group bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: visible ? `${index * 100}ms` : '0ms' }}
            >
              <CardContent className="p-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorksSection() {
  const [ref, visible] = useFadeIn()

  const steps = [
    {
      step: '01',
      title: 'Data Collection',
      description: 'Web scraping pipeline harvests fraud cases from HK01 news API. 606 articles collected from Jan 2024 - Feb 2026.',
      icon: Database
    },
    {
      step: '02',
      title: 'Vector Embedding',
      description: 'Articles are embedded using Sentence-BERT (text2vec-base-chinese) and stored in ChromaDB vector database.',
      icon: Cpu
    },
    {
      step: '03',
      title: 'Semantic Retrieval',
      description: 'When you submit a query, we retrieve the top 3 most similar fraud cases using cosine similarity.',
      icon: FileSearch
    },
    {
      step: '04',
      title: 'LLM Analysis',
      description: 'DeepSeek-v3.2 analyzes the query with retrieved context, producing a fraud score (0-10) with explanation.',
      icon: Brain
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white overflow-hidden">
      <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Badge className="mb-4 bg-emerald-100 text-emerald-700">How It Works</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            RAG Pipeline Architecture
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A four-stage pipeline combining retrieval and generation for accurate fraud detection.
          </p>
        </div>
        
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-200 via-emerald-200 to-teal-200 transform -translate-y-1/2" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: visible ? `${index * 150}ms` : '0ms' }}
              >
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                      {step.step}
                    </div>
                    <step.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Validation Section
function ValidationSection() {
  const metrics = [
    { value: '86.4%', label: 'Alignment with HKMA Patterns', description: 'Validated against HKMA-verified scam patterns' },
    { value: '85', label: 'Validation Samples', description: 'Manually annotated test samples' },
    { value: '606', label: 'Knowledge Base Articles', description: 'Fraud cases from HK01 news' },
    { value: '3', label: 'Top-K Retrieval', description: 'Similar cases retrieved per query' }
  ]

  return (
    <section id="validation" className="py-20 bg-gradient-to-br from-teal-600 to-emerald-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-white/20 text-white">Validation Results</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Proven Accuracy
          </h2>
          <p className="text-lg text-teal-100 max-w-2xl mx-auto">
            Our pipeline has been validated against Hong Kong Monetary Authority (HKMA) verified scam patterns.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div 
              key={index} 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-colors"
            >
              <p className="text-4xl sm:text-5xl font-bold text-white mb-2">{metric.value}</p>
              <p className="text-white font-medium mb-1">{metric.label}</p>
              <p className="text-teal-100 text-sm">{metric.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-teal-100 text-sm max-w-2xl mx-auto">
            Validation performed on a held-out test set with manual annotations. The pipeline achieves strong alignment with verified fraud patterns while providing explainable justifications.
          </p>
        </div>
      </div>
    </section>
  )
}

// Tech Stack Section
function TechStackSection() {
  const technologies = [
    { name: 'DeepSeek-v3.2', category: 'LLM', description: 'Via Alibaba Cloud DashScope API' },
    { name: 'ChromaDB', category: 'Vector DB', description: 'v0.4 with persistent storage' },
    { name: 'Sentence-BERT', category: 'Embeddings', description: 'text2vec-base-chinese model' },
    { name: 'Python', category: 'Language', description: 'Jupyter Notebook environment' },
    { name: 'HK01 API', category: 'Data Source', description: 'Public news API endpoint' },
    { name: 'GitHub Actions', category: 'Automation', description: 'Daily update workflow' }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-teal-100 text-teal-700">Technology</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built with Modern AI Stack
          </h2>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {technologies.map((tech, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-lg transition-shadow flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{tech.name}</p>
                <p className="text-xs text-teal-600 font-medium">{tech.category}</p>
                <p className="text-sm text-gray-500 mt-1">{tech.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Team Section
function TeamSection() {
  const team = [
    {
      name: 'Tan James Anthroi',
      studentId: '240350922',
      email: '240350922@stu.vtc.edu.hk'
    },
    {
      name: 'Lin Yueying',
      studentId: '240444846',
      email: '240444846@stu.vtc.edu.hk'
    },
    {
      name: 'Tan Xiuhao',
      studentId: '240253372',
      email: '240253372@stu.vtc.edu.hk'
    }
  ]

  return (
    <section id="team" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-teal-100 text-teal-700">Team</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Student Research Team
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Final Year Project - Fraud Detection Using LLMs and RAG
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {team.map((member, index) => (
            <Card 
              key={index}
              className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow text-center"
            >
              <CardContent className="p-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-sm text-gray-500 mb-2">Student ID: {member.studentId}</p>
                <a 
                  href={`mailto:${member.email}`} 
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1"
                >
                  <Mail className="w-4 h-4" />
                  {member.email}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  const [ref, visible] = useFadeIn()

  return (
    <section className="py-20 bg-white">
      <div
        ref={ref}
        className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-3xl transform rotate-1" />
          <div className="relative bg-gradient-to-r from-teal-500 to-emerald-600 rounded-3xl p-8 sm:p-12">
            <BookOpen className="w-12 h-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Academic Research Prototype
            </h2>
            <p className="text-lg text-teal-100 mb-8 max-w-xl mx-auto">
              This is a Jupyter Notebook-based research prototype. Explore the code and methodology on GitHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://github.com/Jendope/allinone" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-white text-teal-700 hover:bg-gray-100 rounded-full px-8 h-14 text-lg font-semibold gap-2">
                  <Github className="w-5 h-5" />
                  View Repository
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
              <a
                href="https://github.com/Jendope/allinone/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-white/25 text-white border-2 border-white hover:bg-white/40 rounded-full px-8 h-14 text-lg font-semibold">
                  Read Documentation
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Constraints Section
function ConstraintsSection() {
  const constraints = [
    {
      title: 'API Token Limitations',
      description: 'DashScope free-tier allocations (~1,000 tokens/day/account) restrict comprehensive testing.'
    },
    {
      title: 'Platform Restrictions',
      description: 'Screen reading functionality is technically infeasible on iOS due to Apple\'s sandboxing architecture.'
    },
    {
      title: 'Source Homogeneity',
      description: 'Knowledge base comprises 100% HK01-sourced articles, introducing potential bias.'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Implementation Constraints</h2>
          <p className="text-gray-600">Transparent documentation of current limitations</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {constraints.map((constraint, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-4 border border-amber-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900">{constraint.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{constraint.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">HK FraudGuard</span>
                <p className="text-xs text-gray-400">RAG-Based Fraud Detection</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              A research prototype leveraging LLMs and RAG to detect fraudulent communications targeting Hong Kong residents.
            </p>
            <a 
              href="https://github.com/Jendope/allinone" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300"
            >
              <Github className="w-5 h-5" />
              View on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          
          {/* Project Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Project</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#validation" className="hover:text-white transition-colors">Validation</a></li>
                <li><a href="#team" className="hover:text-white transition-colors">Team</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href="https://github.com/Jendope/allinone" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a 
                    href="https://github.com/Jendope/allinone/blob/main/README.md" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} HK FraudGuard - Final Year Project
          </p>
          <p className="text-gray-500 text-sm">
            Fraud Detection Using LLMs and RAG
          </p>
        </div>
      </div>
    </footer>
  )
}

// Main Page Component
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ValidationSection />
      <TechStackSection />
      <TeamSection />
      <ConstraintsSection />
      <CTASection />
      <Footer />
      
      {/* Custom Styles for Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
          animation-delay: 1s;
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </main>
  )
}
