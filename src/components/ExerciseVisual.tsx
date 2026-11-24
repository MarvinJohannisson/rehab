import React, { useMemo, useState } from 'react';
import { Film, Image as ImageIcon, PlayCircle } from 'lucide-react';
import type { Exercise } from '../types';
import { getYouTubeEmbedUrl, isDirectVideoUrl } from '../utils/mediaUtils';

interface Props {
  exercise: Exercise;
  compact?: boolean;
}

type VisualTab = 'illustration' | 'media';

export const ExerciseVisual: React.FC<Props> = ({
  exercise,
  compact = false,
}) => {
  const hasIllustration = Boolean(exercise.illustrationUrl);
  const hasCustomMedia = Boolean(exercise.videoUrl || exercise.customImageUrl);

  const availableTabs = useMemo<VisualTab[]>(() => {
    const tabs: VisualTab[] = [];
    if (hasIllustration) tabs.push('illustration');
    if (hasCustomMedia) tabs.push('media');
    return tabs;
  }, [hasIllustration, hasCustomMedia]);

  const [selectedTab, setSelectedTab] = useState<VisualTab | null>(null);

  const activeTab: VisualTab | null = useMemo(() => {
    if (selectedTab && availableTabs.includes(selectedTab)) return selectedTab;
    return availableTabs[0] ?? null;
  }, [selectedTab, availableTabs]);

  const youtubeEmbed = getYouTubeEmbedUrl(exercise.videoUrl);
  const directVideo = isDirectVideoUrl(exercise.videoUrl);

  if (!activeTab) {
    return (
      <div className={`visual-stage ${compact ? 'compact' : ''}`}>
        <div className="visual-placeholder">
          <ImageIcon size={24} />
          <span>Ingen bild eller video tillagd än. Lägg till under Övningar.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="visual-box">
      {availableTabs.length > 1 && (
        <div className="visual-tabs" role="tablist" aria-label="Välj bild eller video">
          {hasIllustration && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'illustration'}
              className={`visual-tab ${activeTab === 'illustration' ? 'active' : ''}`}
              onClick={() => setSelectedTab('illustration')}
            >
              <ImageIcon size={13} />
              Illustration
            </button>
          )}
          {hasCustomMedia && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'media'}
              className={`visual-tab ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setSelectedTab('media')}
            >
              <Film size={13} />
              {exercise.videoUrl ? 'Video' : 'Eget foto'}
            </button>
          )}
        </div>
      )}

      <div className={`visual-stage ${compact ? 'compact' : ''}`}>
        {activeTab === 'illustration' && exercise.illustrationUrl && (
          <img
            src={exercise.illustrationUrl}
            alt={`Illustration för ${exercise.name}`}
            loading="lazy"
          />
        )}

        {activeTab === 'media' && (
          <>
            {youtubeEmbed ? (
              <iframe
                src={youtubeEmbed}
                title={`Video för ${exercise.name}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : directVideo && exercise.videoUrl ? (
              <video src={exercise.videoUrl} controls playsInline loop muted />
            ) : exercise.customImageUrl ? (
              <img
                src={exercise.customImageUrl}
                alt={`Foto för ${exercise.name}`}
              />
            ) : exercise.videoUrl ? (
              <div className="visual-placeholder">
                <PlayCircle size={28} />
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  Öppna övningslänk
                </a>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
