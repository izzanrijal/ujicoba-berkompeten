'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Question {
  id: string
  scenario: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  correct_answer: string
  image_url?: string
  subtopic_id: string
  competence: string
}

interface Answer {
  answer: string
  confidence: string
}

export default function TestInterface() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testCode = searchParams.get('testCode')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [showImageModal, setShowImageModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/questions?testCode=${testCode}`)
        const data = await response.json()
        const questionData = data[2].data
        setQuestions(questionData)
        setAnswers(questionData.map(() => ({ answer: '', confidence: '' })))
      } catch (error) {
        console.error('Error loading questions:', error)
      }
    }

    if (testCode) {
      fetchQuestions()
    }
  }, [testCode])

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = { ...newAnswers[currentQuestion], answer: value }
    setAnswers(newAnswers)
  }

  const handleConfidenceChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = { ...newAnswers[currentQuestion], confidence: value }
    setAnswers(newAnswers)
  }

  const isPartiallyAnswered = (index: number) => {
    return (answers[index].answer !== '' && answers[index].confidence === '') ||
           (answers[index].answer === '' && answers[index].confidence !== '');
  }

  const tryNavigate = (newIndex: number) => {
    if (isPartiallyAnswered(currentQuestion)) {
      setShowWarningModal(true)
    } else {
      setCurrentQuestion(newIndex)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      tryNavigate(currentQuestion + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      tryNavigate(currentQuestion - 1)
    }
  }

  const goToQuestion = (index: number) => {
    tryNavigate(index)
  }

  const handleSubmitTest = () => {
    const unansweredQuestions = answers.filter(answer => !answer.answer || !answer.confidence)
    if (unansweredQuestions.length > 0) {
      setShowSubmitModal(true)
    } else {
      submitTest()
    }
  }

  const submitTest = async () => {
    try {
      setIsSubmitting(true)
      
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const testData = {
        userId: userData.user_id,
        testCode: testCode,
        answers: answers.map((answer, index) => ({
          ...answer,
          question_id: questions[index].id,
          correct_answer: questions[index].correct_answer,
          subtopic_id: questions[index].subtopic_id,
          competence: questions[index].competence
        })),
        endTime: new Date().toISOString()
      }
      
      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      if (response.ok) {
        router.push(`/results?testCode=${testCode}`)
      } else {
        throw new Error('Failed to submit test')
      }
    } catch (error) {
      console.error('Error submitting test:', error)
    } finally {
      setIsSubmitting(false)
      setShowSubmitModal(false)
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'very-confident':
        return 'bg-green-500'
      case 'unsure':
        return 'bg-yellow-500'
      case 'dont-know':
        return 'bg-red-500'
      default:
        return 'bg-gray-300'
    }
  }

  if (questions.length === 0) {
    return <div>Loading...</div>
  }

  const currentQuestionData = questions[currentQuestion]

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Question {currentQuestion + 1} / {questions.length}</h1>
        <Button onClick={handleSubmitTest} disabled={isSubmitting}>Submit Test</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="mb-4 text-gray-600">{currentQuestionData.scenario}</p>
          <h2 className="text-xl font-semibold mb-4">{currentQuestionData.question}</h2>
          
          {currentQuestionData.image_url && (
            <div className="mb-4">
              <Image 
                src={currentQuestionData.image_url}
                width={500}
                height={300}
                alt="Question image"
                className="max-w-md mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageModal(true)}
              />
            </div>
          )}

          <RadioGroup value={answers[currentQuestion].answer} onValueChange={handleAnswerChange} className="space-y-2">
            {['A', 'B', 'C', 'D', 'E'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${option}`} />
                <Label htmlFor={`option-${option}`}>{currentQuestionData[`option_${option.toLowerCase()}` as keyof Question]}</Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Confidence Level:</h3>
            <RadioGroup value={answers[currentQuestion].confidence} onValueChange={handleConfidenceChange} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very-confident" id="very-confident" />
                <Label htmlFor="very-confident">Sangat Yakin (Very Confident)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unsure" id="unsure" />
                <Label htmlFor="unsure">Masih Ragu (Unsure)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dont-know" id="dont-know" />
                <Label htmlFor="dont-know">Saya Tidak Tahu untuk jawaban soal ini (I Don't Know)</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-6">
        <Button onClick={previousQuestion} disabled={currentQuestion === 0}>Previous</Button>
        <Select value={currentQuestion.toString()} onValueChange={(value) => goToQuestion(parseInt(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Go to question..." />
          </SelectTrigger>
          <SelectContent>
            {questions.map((_, index) => (
              <SelectItem key={index} value={index.toString()}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${getConfidenceColor(answers[index].confidence)}`}></div>
                  Question {index + 1}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={nextQuestion} disabled={currentQuestion === questions.length - 1}>Next</Button>
      </div>

      <div className="grid grid-cols-10 gap-2 mt-6">
        {answers.map((answer, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className={`${getConfidenceColor(answer.confidence)}`}
            onClick={() => goToQuestion(index)}
          >
            {index + 1}
          </Button>
        ))}
      </div>

      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Question Image</DialogTitle>
          </DialogHeader>
          {currentQuestionData.image_url && (
            <Image 
              src={currentQuestionData.image_url}
              width={1000}
              height={600}
              alt="Question image (enlarged)"
              className="w-full"
            />
          )}
          <DialogFooter>
            <Button onClick={() => setShowImageModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test</DialogTitle>
            <DialogDescription>
              {answers.some(answer => !answer.answer || !answer.confidence) ? (
                <div>
                  Some questions are unanswered or missing confidence levels. Are you sure you want to submit?
                </div>
              ) : (
                <div>
                  Are you sure you want to submit the test?
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>No</Button>
            <Button onClick={submitTest}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWarningModal} onOpenChange={setShowWarningModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warning</DialogTitle>
            <DialogDescription>
              Please complete both answer and confidence level before moving to the next question.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowWarningModal(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

