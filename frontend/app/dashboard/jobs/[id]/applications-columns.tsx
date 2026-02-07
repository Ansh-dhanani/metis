"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header"
import { Award, CheckCircle, Mail, Phone, X, RotateCcw, UserCheck, Brain, TrendingUp } from "lucide-react"
import { formatDate } from "@/lib/utils"

export interface Application {
  _id: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  status: string
  stage: string
  appliedAt: string
  assessmentScore?: number
  metisEvaluation?: {
    overall_score: number
    section_scores?: Record<string, number>
    confidence_level?: string
  }
  metisScore?: number
  advancedRanking?: {
    rank: number
    weighted_score: number
    final_score: number
    status: 'round_1' | 'round_2' | 'rejected'
  }
  // Pipeline scoring fields
  finalScore?: number
  round1Score?: number
  round2Score?: number
  interviewScore?: number
  interviewEvaluation?: {
    personality_score?: number
    technical_approach_score?: number
    communication_score?: number
    problem_solving_score?: number
    interview_score?: number
    strengths?: string[]
    areas_for_improvement?: string[]
    overall_assessment?: string
    hire_recommendation?: string
  }
  profileSnapshot: {
    skills?: string[]
    phone?: string
    linkedinUrl?: string
    githubUrl?: string
    portfolioUrl?: string
    experience?: any
    education?: any[]
    projects?: any[]
    certifications?: any[]
    resumeText?: string
  }
}

export const createApplicationColumns = (
  onSelect: (applicationId: string) => void,
  onViewProfile: (application: Application) => void,
  onAccept: (applicationId: string) => void,
  onReject: (applicationId: string) => void,
  onRemoveStatus: (applicationId: string) => void
): ColumnDef<Application>[] => [
  {
    accessorKey: "candidateName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Candidate" />
    ),
    cell: ({ row }) => {
      const application = row.original
      return (
        <div className="flex flex-col">
          <Button
            variant="link"
            className="h-auto p-0 justify-start font-medium"
            onClick={() => onViewProfile(application)}
          >
            {application.candidateName}
          </Button>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {application.candidateEmail}
          </span>
          {application.profileSnapshot?.phone && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {application.profileSnapshot.phone}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "skills",
    header: "Skills",
    cell: ({ row }) => {
      const skills = row.original.profileSnapshot?.skills || []
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {skills.slice(0, 3).map((skill, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{skills.length - 3}
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "assessmentScore",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Score" />
    ),
    cell: ({ row }) => {
      const score = row.original.assessmentScore
      if (score === null || score === undefined) {
        return <span className="text-muted-foreground text-sm">N/A</span>
      }
      return (
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold">{Math.round(score)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "metisScore",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="METIS AI" />
    ),
    cell: ({ row }) => {
      const metis = row.original.metisEvaluation
      if (!metis) {
        return <span className="text-muted-foreground text-sm">-</span>
      }
      const score = Math.round(metis.overall_score)
      const color = score >= 75 ? 'text-green-600' : score >= 55 ? 'text-yellow-600' : 'text-red-600'
      return (
        <div className="flex items-center gap-1">
          <Brain className={`h-4 w-4 ${color}`} />
          <span className={`font-semibold ${color}`}>{score}</span>
          {metis.confidence_level && (
            <Badge variant="outline" className="ml-1 text-xs">
              {metis.confidence_level}
            </Badge>
          )}
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const scoreA = rowA.original.metisEvaluation?.overall_score || 0
      const scoreB = rowB.original.metisEvaluation?.overall_score || 0
      return scoreA - scoreB
    },
  },
  {
    accessorKey: "finalScore",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Final Score" />
    ),
    cell: ({ row }) => {
      const finalScore = row.original.finalScore || row.original.metisScore
      const round1 = row.original.round1Score || row.original.metisScore
      const round2 = row.original.round2Score
      
      if (!finalScore) {
        return <span className="text-muted-foreground text-sm">Pending</span>
      }
      
      const score = Math.round(finalScore)
      const color = score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'
      
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Award className={`h-4 w-4 ${color}`} />
            <span className={`font-bold text-lg ${color}`}>{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          {round2 && (
            <div className="text-[10px] text-muted-foreground">
              R1: {Math.round(round1 || 0)} • R2: {Math.round(round2)}
            </div>
          )}
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const scoreA = rowA.original.finalScore || rowA.original.metisScore || 0
      const scoreB = rowB.original.finalScore || rowB.original.metisScore || 0
      return scoreA - scoreB
    },
  },
  {
    accessorKey: "ranking",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ranking" />
    ),
    cell: ({ row }) => {
      const ranking = row.original.advancedRanking
      if (!ranking) {
        return <span className="text-muted-foreground text-sm">-</span>
      }
      
      const statusConfig = {
        round_1: { label: 'Round 1', variant: 'default' as const, color: 'bg-blue-500' },
        round_2: { label: 'Round 2', variant: 'secondary' as const, color: 'bg-green-500' },
        rejected: { label: 'Rejected', variant: 'destructive' as const, color: 'bg-red-500' }
      }
      
      const config = statusConfig[ranking.status]
      
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-semibold">#{ranking.rank}</span>
          </div>
          <Badge variant={config.variant} className="text-xs">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {Math.round(ranking.final_score)}
          </span>
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const rankA = rowA.original.advancedRanking?.rank || 999
      const rankB = rowB.original.advancedRanking?.rank || 999
      return rankA - rankB
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge
          variant={
            status === "accepted"
              ? "default"
              : status === "rejected"
              ? "destructive"
              : status === "under_review"
              ? "secondary"
              : "outline"
          }
        >
          {status.replace("_", " ")}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "appliedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Applied Date" />
    ),
    cell: ({ row }) => {
      return <span className="text-sm">{formatDate(row.original.appliedAt)}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const application = row.original
      const status = application.status
      
      return (
        <div className="flex items-center gap-2">
          {status === "accepted" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemoveStatus(application._id)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
          {status === "rejected" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemoveStatus(application._id)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
          {status !== "accepted" && status !== "rejected" && (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => onAccept(application._id)}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject(application._id)}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onSelect(application._id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Select & Close Job
              </Button>
            </>
          )}
        </div>
      )
    },
  },
]
