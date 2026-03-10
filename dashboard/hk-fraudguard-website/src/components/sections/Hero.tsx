'use client'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowRight, Brain, MapPin, Shield, Database, Github, ExternalLink } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary-200/30 to-accent-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-orange-200/20 to-red-200/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <Badge variant="default" className="px-4 py-2">
                <Brain className="w-4 h-4 mr-2" />
                LLM + RAG Powered
              </Badge>
              <Badge variant="accent" className="px-4 py-2">
                <MapPin className="w-4 h-4 mr-2" />
                Hong Kong Focused
              </Badge>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Fraud Detection{' '}
                <span className="gradient-text">Powered by AI</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0">
                Advanced fraud detection system using Large Language Models and Retrieval-Augmented Generation to protect Hong Kong residents from scams.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="https://github.com/Jendope/Final-Year-Project" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="xl" className="gap-2">
                  <Github className="w-5 h-5" />
                  View Project
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
              <Button size="xl" variant="outline" className="gap-2">
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-4">
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
          
          {/* Right Content - Visual */}
          <div className="relative">
            <div className="relative z-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl p-8 shadow-glow">
              <div className="aspect-video bg-gradient-to-br from-primary-500 to-accent-600 rounded-2xl flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <Shield className="w-24 h-24 mx-auto mb-4 opacity-80" />
                  <p className="text-lg font-medium">HK FraudGuard</p>
                  <p className="text-sm opacity-80">AI-Powered Protection</p>
                </div>
              </div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-float">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Scam Detected</p>
                <p className="text-xs text-gray-500">Score: 8.5/10</p>
              </div>
            </div>
            
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 animate-float-delayed">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Database className="w-6 h-6 text-primary-600" />
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
