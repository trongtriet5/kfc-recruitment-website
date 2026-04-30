import { Candidate } from '@/types/recruitment'

interface CandidateCardProps {
  candidate: Candidate
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export function CandidateCard({ candidate, onClick, onContextMenu }: CandidateCardProps) {
  return (
    <div 
      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{candidate.full_name}</h3>
          <p className="text-sm text-gray-500">{candidate.phone}</p>
        </div>
        {candidate.status && (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
            {typeof candidate.status === 'string' ? candidate.status : candidate.status?.name}
          </span>
        )}
      </div>
      {candidate.position && (
        <p className="text-sm text-gray-600 mt-2">Vị trí: {candidate.position}</p>
      )}
      {candidate.store && (
        <p className="text-sm text-gray-500 mt-1">Cửa hàng: {candidate.store.name}</p>
      )}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <span>{new Date(candidate.createdAt).toLocaleDateString('vi-VN')}</span>
        {candidate.pic && (
          <span>PIC: {candidate.pic.full_name}</span>
        )}
      </div>
    </div>
  )
}