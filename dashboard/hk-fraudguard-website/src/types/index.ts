// Team member types
export interface TeamMember {
  name: string
  studentId: string
  email: string
  initials: string
}

// Feature types
export interface Feature {
  icon: string
  title: string
  description: string
  gradient: string
}

// Pipeline step types
export interface PipelineStep {
  step: string
  title: string
  description: string
  icon: string
}

// Validation metric types
export interface ValidationMetric {
  value: string
  label: string
  description: string
}

// Technology types
export interface Technology {
  name: string
  category: string
  description: string
}

// Navigation link types
export interface NavLink {
  label: string
  href: string
}

// Project configuration
export interface ProjectConfig {
  name: string
  description: string
  url: string
  github: string
}
