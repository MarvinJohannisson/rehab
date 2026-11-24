import React, { useMemo, useState } from 'react';
import { Film, Image as ImageIcon, PlayCircle, Sparkles } from 'lucide-react';
import type { Exercise, VisualPreference } from '../types';
import { getYouTubeEmbedUrl, isDirectVideoUrl } from '../utils/mediaUtils';
import { ExerciseAnimation } from './ExerciseAnimation';

interface Props {
  exercise: Exercise;
  preferredVisual: VisualPreference;
  onChangePreference?: (pref: VisualPreference) => void;
  compact?: boolean;
}

export const ExerciseVisual: React.FC<Props> = ({
  exercise,
  preferredVisual,
  onChangePreference,
  compact = false,
}) => {
  const hasIllustration = Boolean(exercise.illustrationUrl);
  const hasAnimation = Boolean(exercise.animationKey);
  const hasCustomMedia = Boolean(exercise.videoUrl || exercise.customImageUrl);

  const availableTabs = useMemo<VisualPreference[]>(() => {
    const tabs: VisualPreference[] = [];
    if (hasIllustration) tabs.push('illustration');
    if (hasAnimation) tabs.push('animation');
    if (hasCustomMedia) tabs.push('media');
    return tabs;
  }, [hasIllustration, hasAnimation, hasCustomMedia]);

  const [localTab, setLocalTab] = useState<VisualPreference | null>(null);

  const activeTab: VisualPreference | null = useMemo(() => {
    const candidate = localTab ?? preferredVisual;
    if (availableTabs.includes(candidate)) return candidate;
    return availableTabs[0] ?? null;
  }, [localTab, preferredVisual, availableTabs]);

  const handleSelectTab = (tab: VisualPreference) => {
    setLocalTab(tab);
    if (tab === 'illustration' || tab === 'animation') {
      onChangePreference?.(tab);
    }
  };

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
        <div className="visual-tabs" role="tablist" aria-label="Välj visningsläge för övning">
          {hasIllustration && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'illustration'}
              className={`visual-tab ${activeTab === 'illustration' ? 'active' : ''}`}
              onClick={() => handleSelectTab('illustration')}
            >
              <ImageIcon size={13} />
              Illustration
            </button>
          )}
          {hasAnimation && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'animation'}
              className={`visual-tab ${activeTab === 'animation' ? 'active' : ''}`}
              onClick={() => handleSelectTab('animation')}
            >
              <Sparkles size={13} />
              Animation
            </button>
          )}
          {hasCustomMedia && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'media'}
              className={`visual-tab ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => handleSelectTab('media')}
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

        {activeTab === 'animation' && exercise.animationKey && (
          <ExerciseAnimation animationKey={exercise.animationKey} />
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
