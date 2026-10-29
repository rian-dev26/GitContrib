import { ContributionClassification } from '../../types';
import { Badge } from '../ui/Badge';

export interface StatusBadgeProps {
  status: ContributionClassification;
  confidence?: number;
  showConfidence?: boolean;
}

/**
 * StatusBadge menampilkan hasil klasifikasi YES / NO dari model Machine Learning.
 * Menggunakan aksen positif (#89E19C) untuk YES dan aksen negatif lembut (#E06C75) untuk NO.
 */
export function StatusBadge({ status, confidence, showConfidence = false }: StatusBadgeProps) {
  const isYes = status === 'YES';

  return (
    <Badge
      variant={isYes ? 'success' : 'danger'}
      size="sm"
      dot
      className="font-mono font-medium tracking-wide"
    >
      {status}
      {showConfidence && confidence !== undefined && (
        <span className="text-[10px] opacity-80 font-normal ml-0.5">
          ({Math.round(confidence * 100)}%)
        </span>
      )}
    </Badge>
  );
}
