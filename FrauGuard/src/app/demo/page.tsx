
'use client'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  FileImage, 
  AlertTriangle, 
  CheckCircle, 
  Upload, 
  Loader2,
  Settings,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

// Available LLM models
const LLM_MODELS = [
  { id: 'glm-5', name: 'GLM-5', description: 'ZhipuAI free-tier chat model' },
  { id: 'qwen3.5-plus', name: 'Qwen 3.5 Plus', description: 'Alibaba Cloud DashScope model' },
]

export default function Home() {
  // State management
  const [mode, setMode] = useState<'raw' | 'rag'>('raw')
  const [selectedModel, setSelectedModel] = useState('glm-5')
  const [activeTab, setActiveTab] = useState('fraud')
  
  // Fraud detection state
  const [fraudText, setFraudText] = useState('')
  const [fraudLoading, setFraudLoading] = useState(false)
  const [fraudResult, setFraudResult] = useState<{
    probability: number
    reason: string
  } | null>(null)
  
  // OCR state
  const [ocrImage, setOcrImage] = useState<File | null>(null)
  const [ocrPrompt, setOcrPrompt] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState<{
    ocr_text: string
    llm_output: string
  } | null>(null)

  // Fraud detection handler
  const handleFraudDetection = async () => {
    if (!fraudText.trim()) {
      toast.error('Please enter text to analyze')
      return
    }
    
    setFraudLoading(true)
    setFraudResult(null)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fraudText, model: selectedModel, mode })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setFraudResult({
          probability: data.probability,
          reason: data.reason
        })
        toast.success('Analysis complete!')
      } else {
        toast.error(data.error || 'Analysis failed')
      }
    } catch {
      toast.error('Failed to connect to server')
    } finally {
      setFraudLoading(false)
    }
  }

  // OCR handler
  const handleOCR = async () => {
    if (!ocrImage) {
      toast.error('Please upload an image')
      return
    }
    
    setOcrLoading(true)
    setOcrResult(null)
    
    try {
      const formData = new FormData()
      formData.append('file', ocrImage)
      formData.append('mode', mode)
      formData.append('prompt', ocrPrompt)
      formData.append('model', selectedModel)
      
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.llm_output) {
        setOcrResult({
          ocr_text: data.ocr_text,
          llm_output: data.llm_output
        })
        toast.success('Image processed successfully!')
      } else {
        toast.error(data.error || 'Processing failed')
      }
    } catch {
      toast.error('Failed to connect to server')
    } finally {
      setOcrLoading(false)
    }
  }

  // Get risk level color and label
  const getRiskLevel = (probability: number) => {
    if (probability >= 0.7) return {
      label: 'HIGH RISK',
      color: 'destructive' as const,
      textColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500',
      trackColor: 'bg-red-100 dark:bg-red-900/30',
      badgeClass: 'bg-red-600 text-white',
      icon: AlertTriangle,
    }
    if (probability >= 0.4) return {
      label: 'MEDIUM RISK',
      color: 'default' as const,
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500',
      trackColor: 'bg-amber-100 dark:bg-amber-900/30',
      badgeClass: 'bg-amber-500 text-white',
      icon: AlertTriangle,
    }
    return {
      label: 'LOW RISK',
      color: 'default' as const,
      textColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500',
      trackColor: 'bg-green-100 dark:bg-green-900/30',
      badgeClass: 'bg-green-600 text-white',
      icon: CheckCircle,
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  FraudGuard AI
                </h1>
                <p className="text-lg text-muted-foreground">
                  Protect yourself from scams and fraud
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-base px-4 py-2 gap-2">
              <Sparkles className="w-5 h-5" />
              AI-Powered Protection
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Settings Panel */}
        <Card className="mb-8 border-2 border-primary/20 bg-card shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Settings className="w-7 h-7 text-primary" />
              AI Settings
            </CardTitle>
            <CardDescription className="text-lg">
              Configure your AI assistant preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-8">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-6 bg-muted/50 rounded-2xl">
                <div className="space-y-1">
                  <Label htmlFor="mode-toggle" className="text-xl font-semibold">
                    Processing Mode
                  </Label>
                  <p className="text-base text-muted-foreground">
                    {mode === 'rag' 
                      ? 'RAG: Uses context retrieval for detailed analysis' 
                      : 'Raw: Direct AI analysis without context'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-medium ${mode === 'raw' ? 'text-primary' : 'text-muted-foreground'}`}>
                    Raw
                  </span>
                  <Switch
                    id="mode-toggle"
                    checked={mode === 'rag'}
                    onCheckedChange={(checked) => setMode(checked ? 'rag' : 'raw')}
                    className="data-[state=checked]:bg-primary scale-125"
                  />
                  <span className={`text-lg font-medium ${mode === 'rag' ? 'text-primary' : 'text-muted-foreground'}`}>
                    RAG
                  </span>
                </div>
              </div>

              {/* Model Selection */}
              <div className="flex items-center justify-between p-6 bg-muted/50 rounded-2xl">
                <div className="space-y-1">
                  <Label htmlFor="model-select" className="text-xl font-semibold">
                    AI Model
                  </Label>
                  <p className="text-base text-muted-foreground">
                    {LLM_MODELS.find(m => m.id === selectedModel)?.description ?? 'Select a model'}
                  </p>
                </div>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger id="model-select" className="w-[180px] h-12 text-lg rounded-xl">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {LLM_MODELS.map((model) => (
                      <SelectItem 
                        key={model.id} 
                        value={model.id}
                        className="py-3 text-lg"
                      >
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 h-16 rounded-2xl bg-muted p-1.5">
            <TabsTrigger 
              value="fraud" 
              className="h-full text-lg font-semibold rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-md"
            >
              <Shield className="w-6 h-6 mr-2" />
              <span className="hidden sm:inline">Fraud Detection</span>
              <span className="sm:hidden">Fraud</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ocr" 
              className="h-full text-lg font-semibold rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-md"
            >
              <FileImage className="w-6 h-6 mr-2" />
              <span className="hidden sm:inline">Image Analysis</span>
              <span className="sm:hidden">Image</span>
            </TabsTrigger>
          </TabsList>

          {/* Fraud Detection Tab */}
          <TabsContent value="fraud" className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Check for Scams</CardTitle>
                <CardDescription className="text-lg">
                  Paste any suspicious message, email, or text to check if it&apos;s a potential scam
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="fraud-text" className="text-xl font-semibold">
                    Message to Analyze
                  </Label>
                  <Textarea
                    id="fraud-text"
                    placeholder="Paste the suspicious message here... For example: 'Congratulations! You've won $1,000,000. Click here to claim your prize...'"
                    value={fraudText}
                    onChange={(e) => setFraudText(e.target.value)}
                    className="min-h-[180px] text-lg rounded-xl border-2 focus:border-primary p-4"
                  />
                </div>
                
                <Button 
                  onClick={handleFraudDetection}
                  disabled={fraudLoading || !fraudText.trim()}
                  size="lg"
                  className="w-full h-14 text-xl font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {fraudLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-6 h-6 mr-2" />
                      Check for Fraud
                    </>
                  )}
                </Button>

                {fraudResult && (() => {
                  const risk = getRiskLevel(fraudResult.probability)
                  const RiskIcon = risk.icon
                  return (
                  <div className="space-y-4 p-6 bg-muted/50 rounded-2xl border-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">Analysis Result</h3>
                      <Badge 
                        variant={risk.color}
                        className={`text-lg px-4 py-2 ${risk.badgeClass}`}
                      >
                        <RiskIcon className="w-5 h-5 mr-1" />
                        {risk.label}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg">
                        <span>Risk Score:</span>
                        <span className={`font-bold ${risk.textColor}`}>{Math.round(fraudResult.probability * 100)}%</span>
                      </div>
                      <div className={`relative h-4 w-full overflow-hidden rounded-full ${risk.trackColor}`}>
                        <div
                          className={`h-full rounded-full transition-all ${risk.bgColor}`}
                          style={{ width: `${fraudResult.probability * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-card rounded-xl border">
                      <p className="text-lg font-medium mb-2">Reason:</p>
                      <div className="text-lg text-muted-foreground prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            strong: ({node, ...props}) => (
                              <strong className="font-bold text-red-600 dark:text-red-400" {...props} />
                            ),
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          }}
                        >
                          {fraudResult.reason}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  )
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OCR Tab */}
          <TabsContent value="ocr" className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Analyze Image</CardTitle>
                <CardDescription className="text-lg">
                  Upload an image to extract text and get AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xl font-semibold">Upload Image</Label>
                  <div className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center hover:border-primary/60 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setOcrImage(e.target.files?.[0] || null)}
                      className="hidden"
                      id="ocr-upload"
                    />
                    <label 
                      htmlFor="ocr-upload" 
                      className="cursor-pointer flex flex-col items-center gap-4"
                    >
                      <Upload className="w-16 h-16 text-primary/60" />
                      {ocrImage ? (
                        <div className="text-center">
                          <p className="text-xl font-medium text-primary">{ocrImage.name}</p>
                          <p className="text-base text-muted-foreground">Click to change image</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-xl font-medium">Click to upload image</p>
                          <p className="text-base text-muted-foreground">Supports JPG, PNG, GIF</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="ocr-prompt" className="text-xl font-semibold">
                    Additional Instructions (Optional)
                  </Label>
                  <Textarea
                    id="ocr-prompt"
                    placeholder="What would you like to know about this image? For example: 'Is this a scam message?' or 'Summarize the content'"
                    value={ocrPrompt}
                    onChange={(e) => setOcrPrompt(e.target.value)}
                    className="min-h-[100px] text-lg rounded-xl border-2 focus:border-primary p-4"
                  />
                </div>

                <Button 
                  onClick={handleOCR}
                  disabled={ocrLoading || !ocrImage}
                  size="lg"
                  className="w-full h-14 text-xl font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  {ocrLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileImage className="w-6 h-6 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>

                {ocrResult && (
                  <div className="space-y-4 p-6 bg-muted/50 rounded-2xl border-2">
                    <h3 className="text-2xl font-bold">Results</h3>
                    
                    <div className="p-4 bg-card rounded-xl border">
                      <p className="text-lg font-medium mb-2">Extracted Text:</p>
                      <p className="text-lg text-muted-foreground whitespace-pre-wrap">{ocrResult.ocr_text}</p>
                    </div>

                    <div className="p-4 bg-card rounded-xl border">
                      <p className="text-lg font-medium mb-2">AI Analysis:</p>
                      <div className="text-lg text-muted-foreground prose prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            // ✅ Style warnings in red + bold for elderly users
                            strong: ({node, ...props}) => (
                              <strong className="font-bold text-red-600 dark:text-red-400" {...props} />
                            ),
                            // ✅ Style headers with proper spacing
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-3" {...props} />,
                            // ✅ Style lists with proper indentation
                            ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-2" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            // ✅ Keep paragraphs with spacing
                            p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                          }}
                        >
                          {ocrResult.llm_output}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-lg text-muted-foreground">
            Stay safe online. When in doubt, verify through official channels.
          </p>
        </div>
      </footer>
    </div>
  )
}
