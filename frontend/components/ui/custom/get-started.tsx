import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const GetStartedButton = () => {
  return (
    <StyledWrapper>
      <Link href="/register">
        <button className="button button-item">
          <span className="button-bg">
            <span className="button-bg-layers">
              <span className="button-bg-layer button-bg-layer-1 -purple" />
              <span className="button-bg-layer button-bg-layer-2 -turquoise" />
              <span className="button-bg-layer button-bg-layer-3 -yellow" />
            </span>
          </span>
          <span className="button-inner">
            <span className="button-inner-static">Get Started</span>
            <span className="button-inner-hover">&nbsp; Let's Go !!</span>
          </span>
        </button>
      </Link>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  button {
    border: none;
    outline: none;
    cursor: pointer;
  }

  .button {
    position: relative;
    display: inline-flex;
    height: 3rem;
    align-items: center;
    border-radius: 9999px;
    padding-left: 2rem;
    padding-right: 2rem;
    font-family: Segoe UI;
    font-size: 1.2rem;
    font-weight: 640;
    color: #fafaf6;
    letter-spacing: -0.06em;
    border: 1px  solid #ffffff70;
    will-change: transform;
  }

  .button-item {
    color: hsl(var(--primary-foreground));
  }

  .button-item .button-bg {
    border-color: hsl(var(--primary));
    background-color: hsl(var(--primary));
  }

  .button-inner,
  .button-inner-hover,
  .button-inner-static {
    pointer-events: none;
    display: block;
  }

  .button-inner {
    position: relative;
    z-index: 1;
    transform: translateZ(0);
  }

  .button-inner-hover {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    transform: translateY(70%) translateZ(0);
    will-change: transform, opacity;
  }

  .button-inner-static {
    will-change: transform, opacity;
    transform: translateZ(0);
  }

  .button-bg {
    overflow: hidden;
    border-radius: 2rem;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: scale(1) translateZ(0);
    transition: transform 1.8s cubic-bezier(0.19, 1, 0.22, 1);
    z-index: 0;
    backface-visibility: hidden;
  }

  .button-bg,
  .button-bg-layer,
  .button-bg-layers {
    display: block;
  }

  .button-bg-layers {
    position: absolute;
    left: 50%;
    transform: translate(-50%) translateZ(0);
    top: -60%;
    aspect-ratio: 1 / 1;
    width: max(200%, 10rem);
    backface-visibility: hidden;
  }

  .button-bg-layer {
    border-radius: 9999px;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: scale(0) translateZ(0);
    will-change: transform;
    backface-visibility: hidden;
  }

  .button-bg-layer.-purple {
    background-color: oklch(0.92 0.26 285);
  }

  .button-bg-layer.-turquoise {
    background-color: oklch(0.25 0.22 260);
  }

  .button-bg-layer.-yellow {
    background-color: oklch(0.55 0.29 280);
  }

  .button:hover .button-inner-static {
    opacity: 0;
    transform: translateY(-70%) translateZ(0);
    transition:
      transform 1.4s cubic-bezier(0.19, 1, 0.22, 1),
      opacity 0.3s linear;
  }

  .button:hover .button-inner-hover {
    opacity: 1;
    transform: translateY(0) translateZ(0);
    transition:
      transform 1.4s cubic-bezier(0.19, 1, 0.22, 1),
      opacity 1.4s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .button:hover .button-bg-layer {
    transition:
      transform 1.3s cubic-bezier(0.19, 1, 0.22, 1),
      opacity 0.3s linear;
  }

  .button:hover .button-bg-layer-1 {
    transform: scale(1) translateZ(0);
  }

  .button:hover .button-bg-layer-2 {
    transition-delay: 0.1s;
    transform: scale(1) translateZ(0);
  }

  .button:hover .button-bg-layer-3 {
    transition-delay: 0.2s;
    transform: scale(1) translateZ(0);
  }`;

export default GetStartedButton;
