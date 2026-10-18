import React, { useState, useRef, useEffect } from 'react';
import { ChevronsRight, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useI18n } from '../context/I18nContext';

export default function SliderCaptcha({ onVerify, onReset, isVerified, resetTrigger }) {
  const { t } = useI18n();
  const trackRef = useRef(null);
  const handleRef = useRef(null);

  const [dragProgress, setDragProgress] = useState(0); // 0 to 1
  const [isDragging, setIsDragging] = useState(false);
  const [sliderToken, setSliderToken] = useState(null);

  // Fetch a server-signed slider token on mount or reset
  useEffect(() => {
    async function fetchSliderToken() {
      try {
        const res = await api.get('/auth/slider-token');
        if (res.data?.success) {
          setSliderToken(res.data.sliderToken);
        }
      } catch (err) {
        // Fallback local token
        setSliderToken('local_slider_' + Date.now());
      }
    }
    if (!isVerified) {
      fetchSliderToken();
    }
  }, [isVerified, resetTrigger]);

  // Reset handle when resetTrigger changes
  useEffect(() => {
    if (!isVerified) {
      setDragProgress(0);
      setIsDragging(false);
    }
  }, [resetTrigger, isVerified]);

  const handleStart = (clientX) => {
    if (isVerified) return;
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || isVerified || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const handleWidth = 44; // width of slider button
    const maxDrag = trackRect.width - handleWidth;
    const currentX = clientX - trackRect.left - (handleWidth / 2);

    const clampedX = Math.max(0, Math.min(currentX, maxDrag));
    const progress = clampedX / maxDrag;

    setDragProgress(progress);

    // If dragged to 95%+, snap to completion
    if (progress >= 0.95) {
      setDragProgress(1);
      setIsDragging(false);
      if (onVerify) {
        onVerify(sliderToken || 'verified_token');
      }
    }
  };

  const handleEnd = () => {
    if (isVerified) return;
    if (dragProgress < 0.95) {
      // Rebound back to start
      setDragProgress(0);
      setIsDragging(false);
      if (onReset) onReset();
    }
  };

  // Mouse handlers
  const onMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  // Touch handlers
  const onTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      handleStart(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onMouseUp = () => {
      if (isDragging) handleEnd();
    };
    const onTouchMove = (e) => {
      if (isDragging && e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => {
      if (isDragging) handleEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, dragProgress, isVerified]);

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '44px',
        backgroundColor: '#262933',
        borderRadius: '8px',
        border: isVerified ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'border-color 0.2s ease',
        cursor: isVerified ? 'default' : 'pointer'
      }}
    >
      {/* Active Fill Track */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${dragProgress * 100}%`,
          backgroundColor: isVerified ? 'rgba(16, 185, 129, 0.35)' : 'rgba(91, 124, 255, 0.35)',
          transition: isDragging ? 'none' : 'width 0.3s ease',
          pointerEvents: 'none'
        }}
      />

      {/* Guide text */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: '0.88rem',
          fontWeight: '500',
          color: isVerified ? '#34d399' : 'rgba(255, 255, 255, 0.55)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          pointerEvents: 'none'
        }}
      >
        {isVerified ? (
          <>
            <CheckCircle2 size={16} color="#34d399" />
            <span>{t('slideVerified')}</span>
          </>
        ) : (
          t('slidePrompt')
        )}
      </span>

      {/* Slider Button Handle */}
      <div
        ref={handleRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        style={{
          position: 'absolute',
          left: `calc(${dragProgress * 100}% - ${dragProgress * 44}px)`,
          top: '0px',
          width: '44px',
          height: '44px',
          backgroundColor: isVerified ? '#10b981' : '#323644',
          borderRadius: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isVerified ? '#ffffff' : '#c3c7d6',
          cursor: isVerified ? 'default' : 'grab',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          transition: isDragging ? 'none' : 'left 0.3s ease, background-color 0.2s ease',
          zIndex: 2
        }}
        title={isVerified ? 'Verified' : 'Drag handle to verify'}
      >
        {isVerified ? (
          <CheckCircle2 size={20} color="#ffffff" />
        ) : (
          <ChevronsRight size={20} />
        )}
      </div>
    </div>
  );
}
