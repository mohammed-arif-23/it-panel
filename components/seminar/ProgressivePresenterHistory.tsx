'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  User, 
  ArrowLeft, 
  ArrowRight, 
  Trophy, 
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  History,
  Star,
  Award
} from 'lucide-react'
import { seminarTimingService } from '../../lib/seminarTimingService'

export type PresenterHistoryStep = 'overview' | 'details'

interface PresenterSelection {
  student: {
    id: string
    name: string
    register_number: string
    class_year?: string
  }
  seminarDate: string
  selectedAt: string
}

interface ProgressivePresenterHistoryProps {
  presenterHistory: PresenterSelection[]
  isLoading: boolean
  classYear: string
}

const historySteps = [
  { id: 1, title: 'Overview', description: 'Recent presentations', icon: History },
  { id: 2, title: 'Details', description: 'Complete history', icon: Calendar }
]

export function ProgressivePresenterHistory({ 
  presenterHistory, 
  isLoading, 
  classYear 
}: ProgressivePresenterHistoryProps) {
  const [currentStep, setCurrentStep] = useState<PresenterHistoryStep>('overview')
  const [selectedPresenter, setSelectedPresenter] = useState<PresenterSelection | null>(null)

  const getStepNumber = (step: PresenterHistoryStep): number => {
    switch (step) {
      case 'overview': return 1
      case 'details': return 2
      default: return 1
    }
  }

  const getCurrentStepInfo = () => {
    return historySteps.find(step => step.id === getStepNumber(currentStep))
  }

  const handleNext = () => {
    switch (currentStep) {
      case 'overview':
        setCurrentStep('details')
        break
    }
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'details':
        setCurrentStep('overview')
        break
    }
  }

  const renderOverviewStep = () => {
    const recentPresentations = presenterHistory.slice(0, 3)
    
    return (
      <div className="space-y-4 slide-in-left">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">Recent Presentations</h3>
          <p className="text-sm text-[var(--color-text-muted)]">{classYear} • Recent presentations</p>
        </div>

        {recentPresentations.length > 0 ? (
          <div className="space-y-3">
            {recentPresentations.map((selection, index) => {
              const isUpcoming = new Date(selection.seminarDate) > new Date()
              const isPast = new Date(selection.seminarDate) < new Date()
              
              return (
                <div 
                  key={index} 
                  className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                    isUpcoming 
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300' 
                      : isPast 
                      ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300' 
                      : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedPresenter(selection)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isUpcoming ? 'bg-blue-100' : isPast ? 'bg-gray-100' : 'bg-purple-100'
                      }`}>
                        <User className={`h-5 w-5 ${
                          isUpcoming ? 'text-blue-600' : isPast ? 'text-gray-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className={`font-bold ${
                          isUpcoming ? 'text-blue-900' : isPast ? 'text-gray-700' : 'text-purple-900'
                        }`}>
                          {selection.student.name}
                        </h4>
                        <p className={`text-sm ${
                          isUpcoming ? 'text-blue-700' : isPast ? 'text-gray-600' : 'text-purple-700'
                        }`}>
                          {selection.student.register_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        isUpcoming ? 'text-blue-600' : isPast ? 'text-gray-500' : 'text-purple-600'
                      }`}>
                        {seminarTimingService.formatDateWithDay(selection.seminarDate).split(',')[0]}
                      </p>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        isUpcoming 
                          ? 'bg-blue-100 text-blue-700' 
                          : isPast 
                          ? 'bg-gray-100 text-gray-600' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {isUpcoming ? 'Upcoming' : isPast ? 'Completed' : 'Today'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-200">
            <div className="p-3 bg-gray-100 rounded-lg inline-block mb-3">
              <User className="h-8 w-8 mx-auto text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-2">No recent presentations</p>
            <p className="text-xs text-gray-400">
              Past and upcoming presentations will appear here
            </p>
          </div>
        )}

        {presenterHistory.length > 3 && (
          <Button 
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <span>View Complete History</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }

  const renderDetailsStep = () => {
    return (
      <div className="space-y-4 slide-in-left">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-[var(--color-text-muted)] hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-primary)]">Complete History</h3>
            <p className="text-xs text-[var(--color-text-muted)]">All {presenterHistory.length} presentations</p>
          </div>
          <div className="w-16"></div>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-50">
          {presenterHistory.map((selection, index) => {
            const isUpcoming = new Date(selection.seminarDate) > new Date()
            const isPast = new Date(selection.seminarDate) < new Date()
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                  isUpcoming 
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' 
                    : isPast 
                    ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200' 
                    : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isUpcoming ? 'bg-blue-100' : isPast ? 'bg-gray-100' : 'bg-purple-100'
                    }`}>
                      <User className={`h-4 w-4 ${
                        isUpcoming ? 'text-blue-600' : isPast ? 'text-gray-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className={`font-semibold text-sm ${
                        isUpcoming ? 'text-blue-900' : isPast ? 'text-gray-700' : 'text-purple-900'
                      }`}>
                        {selection.student.name}
                      </h4>
                      <p className={`text-xs ${
                        isUpcoming ? 'text-blue-700' : isPast ? 'text-gray-600' : 'text-purple-700'
                      }`}>
                        {selection.student.register_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${
                      isUpcoming ? 'text-blue-600' : isPast ? 'text-gray-500' : 'text-purple-600'
                    }`}>
                      {seminarTimingService.formatDateWithDay(selection.seminarDate).split(',')[0]}
                    </p>
                    <p className={`text-xs ${
                      isUpcoming ? 'text-blue-500' : isPast ? 'text-gray-400' : 'text-purple-500'
                    }`}>
                      {seminarTimingService.formatTime12Hour(new Date(selection.selectedAt))}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Button 
          onClick={() => setCurrentStep('overview')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
        >
          <span>Back to Overview</span>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      </div>
    )
  }


  const renderCurrentStep = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12 slide-in-left">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <History className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-sm text-[var(--color-secondary)] font-medium">Loading presentation history...</p>
        </div>
      )
    }

    switch (currentStep) {
      case 'overview':
        return renderOverviewStep()
      case 'details':
        return renderDetailsStep()
      default:
        return renderOverviewStep()
    }
  }

  const currentStepInfo = getCurrentStepInfo()

  return (
    <div className="saas-card p-5">
      {/* Header with step indicator */}
      <div className="flex items-center space-x-3 mb-5">
        <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
          {currentStepInfo && <currentStepInfo.icon className="h-5 w-5 text-purple-600" />}
        </div>
        <div>
          <h3 className="text-base font-bold text-[var(--color-primary)]">
            {currentStepInfo?.title || 'Presenter History'}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            {currentStepInfo?.description || classYear}
          </p>
        </div>
        {/* Step indicator dots */}
        <div className="flex-1 flex justify-end space-x-2">
          {historySteps.map((step) => (
            <div
              key={step.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step.id === getStepNumber(currentStep)
                  ? 'bg-purple-600 w-6'
                  : step.id < getStepNumber(currentStep)
                  ? 'bg-purple-400'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      {renderCurrentStep()}
    </div>
  )
}
