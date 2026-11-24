import React from 'react';
import type { AnimationKey } from '../types';

interface Props {
  animationKey: AnimationKey;
}

export const ExerciseAnimation: React.FC<Props> = ({ animationKey }) => {
  switch (animationKey) {
    case 'wall-squat':
      return (
        <>
          <svg
            viewBox="0 0 320 220"
            className="anim-svg"
            role="img"
            aria-label="Animation av benböj vid vägg på ett ben"
          >
            {/* Floor & Wall */}
            <line x1="28" y1="194" x2="260" y2="194" stroke="#D5D0C5" strokeWidth="3" strokeLinecap="round" />
            <rect x="246" y="24" width="18" height="170" rx="4" fill="#E4DFD4" />
            <line x1="246" y1="24" x2="246" y2="194" stroke="#C5BEB0" strokeWidth="2.5" />

            {/* Movement guide arrow */}
            <g className="anim-arrow-pulse">
              <line x1="214" y1="78" x2="214" y2="132" stroke="#C67628" strokeWidth="3" strokeLinecap="round" />
              <path d="M208 86 L214 76 L220 86" fill="none" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M208 124 L214 134 L220 124" fill="none" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Fixed planted front foot */}
            <path d="M168 192 L198 192" stroke="#1B241F" strokeWidth="7" strokeLinecap="round" />

            {/* Moving body */}
            <g className="anim-squat-body">
              {/* Back leg (light toe support) */}
              <path
                d="M138 118 L120 156 L92 168"
                fill="none"
                stroke="#7C8780"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Front working leg */}
              <path
                d="M138 118 L182 140 L176 172"
                fill="none"
                stroke="#2E6F5E"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Torso */}
              <path
                d="M138 118 L160 66"
                fill="none"
                stroke="#1B241F"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Arms pushing wall */}
              <path
                d="M162 74 L242 74"
                fill="none"
                stroke="#D4A383"
                strokeWidth="9"
                strokeLinecap="round"
              />
              {/* Head */}
              <circle cx="168" cy="44" r="14" fill="#1B241F" />
            </g>
          </svg>
          <span className="anim-caption">Tryck mot väggen · Sätet bak · Tryck upp på ett ben</span>
        </>
      );

    case 'bear-crawl':
      return (
        <>
          <svg
            viewBox="0 0 320 220"
            className="anim-svg"
            role="img"
            aria-label="Animation av krypa på alla fyra"
          >
            {/* Mat */}
            <rect x="30" y="176" width="260" height="8" rx="4" fill="#E4DFD4" />

            {/* Direction arrows */}
            <g className="anim-arrow-pulse">
              <path d="M126 52 L196 52" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M188 46 L198 52 L188 58" fill="none" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M134 46 L124 52 L134 58" fill="none" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Bear crawl figure */}
            <g className="anim-crawl-group">
              {/* Far arm & far leg (opposite pair B) */}
              <g className="anim-limb-b">
                <path d="M196 106 L194 170" stroke="#7C8780" strokeWidth="9" strokeLinecap="round" />
              </g>
              <g className="anim-limb-a">
                <path d="M118 106 L112 152 L82 168" fill="none" stroke="#7C8780" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* Flat braced torso */}
              <path d="M116 104 L200 104" stroke="#1B241F" strokeWidth="16" strokeLinecap="round" />
              {/* Core brace accent line */}
              <line x1="132" y1="112" x2="184" y2="112" stroke="#2E6F5E" strokeWidth="4" strokeLinecap="round" />

              {/* Head looking down */}
              <circle cx="222" cy="100" r="13" fill="#1B241F" />

              {/* Near arm & near leg (opposite pair A) */}
              <g className="anim-limb-a">
                <path d="M198 106 L206 170" stroke="#D4A383" strokeWidth="10" strokeLinecap="round" />
              </g>
              <g className="anim-limb-b">
                <path d="M120 106 L132 154 L98 170" fill="none" stroke="#2E6F5E" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </svg>
          <span className="anim-caption">Knäna nära golvet · Rak bål · Motsatt hand & fot</span>
        </>
      );

    case 'bear-to-crab':
      return (
        <>
          <svg
            viewBox="0 0 320 220"
            className="anim-svg"
            role="img"
            aria-label="Animation av växling från alla fyra till omvänd position"
          >
            <line x1="24" y1="178" x2="296" y2="178" stroke="#D5D0C5" strokeWidth="3" strokeLinecap="round" />

            {/* Pose A: Quadruped hover */}
            <g className="anim-pose-a">
              <path d="M46 116 L110 116" stroke="#1B241F" strokeWidth="13" strokeLinecap="round" />
              <circle cx="126" cy="112" r="11" fill="#1B241F" />
              <path d="M108 118 L108 172" stroke="#D4A383" strokeWidth="8.5" strokeLinecap="round" />
              <path d="M50 118 L60 156 L38 172" fill="none" stroke="#2E6F5E" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Rotation arrow */}
            <g className="anim-arrow-pulse">
              <path
                d="M142 108 Q162 84 182 108"
                fill="none"
                stroke="#C67628"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path d="M175 106 L184 109 L181 99" fill="none" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M182 132 Q162 154 142 132"
                fill="none"
                stroke="#C67628"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path d="M149 134 L140 131 L143 141" fill="none" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Pose B: Reverse crab low hover (belly up, glutes near floor) */}
            <g className="anim-pose-b">
              <path d="M222 146 L264 120" stroke="#1B241F" strokeWidth="13" strokeLinecap="round" />
              <circle cx="278" cy="108" r="11" fill="#1B241F" />
              <path d="M262 124 L268 172" stroke="#D4A383" strokeWidth="8.5" strokeLinecap="round" />
              <path d="M222 146 L202 126 L196 172" fill="none" stroke="#2E6F5E" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
          <span className="anim-caption">Växla långsamt · Sätet nära golvet · Håll ihop magen</span>
        </>
      );

    case 'forward-reverse-lunge':
      return (
        <>
          <svg
            viewBox="0 0 320 220"
            className="anim-svg"
            role="img"
            aria-label="Animation av utfallssteg framåt och direkt bakåt"
          >
            <line x1="24" y1="184" x2="296" y2="184" stroke="#D5D0C5" strokeWidth="3" strokeLinecap="round" />

            {/* Pose A: Forward Lunge (green working leg stepping forward) */}
            <g className="anim-pose-a">
              <path d="M88 118 L64 150 L44 176" fill="none" stroke="#7C8780" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M88 118 L124 132 L124 178" fill="none" stroke="#2E6F5E" strokeWidth="11.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M88 118 L90 66" stroke="#1B241F" strokeWidth="13" strokeLinecap="round" />
              <circle cx="91" cy="46" r="12" fill="#1B241F" />
            </g>

            {/* Bidirectional transition arc */}
            <g className="anim-arrow-pulse">
              <path
                d="M138 96 Q162 76 186 96"
                fill="none"
                stroke="#C67628"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path d="M178 96 L188 97 L184 87" fill="none" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M146 96 L136 97 L140 87" fill="none" stroke="#C67628" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            {/* Pose B: Reverse Lunge (same green leg stepping straight back) */}
            <g className="anim-pose-b">
              <path d="M234 118 L268 132 L268 178" fill="none" stroke="#7C8780" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M234 118 L208 150 L188 176" fill="none" stroke="#2E6F5E" strokeWidth="11.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M234 118 L234 66" stroke="#1B241F" strokeWidth="13" strokeLinecap="round" />
              <circle cx="234" cy="46" r="12" fill="#1B241F" />
            </g>
          </svg>
          <span className="anim-caption">Samma ben framåt → direkt bakåt i ett flöde</span>
        </>
      );
  }
};
