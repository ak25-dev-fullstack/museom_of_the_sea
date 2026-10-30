import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StormScene } from './StormScene';

describe('StormScene', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the video paused while waiting, then plays it once', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play');
    const { container, rerender } = render(<StormScene videoState="waiting" />);
    const video = container.querySelector('video');

    expect(play).not.toHaveBeenCalled();
    expect(video).not.toHaveAttribute('loop');

    rerender(<StormScene videoState="play" />);
    expect(play).toHaveBeenCalledOnce();
  });

  it('only shows a lightning strike once one is triggered', () => {
    const { container, rerender } = render(<StormScene />);
    expect(container.querySelector('.storm__flash')).toBeNull();

    rerender(<StormScene flashKey={1} />);
    expect(container.querySelector('.storm__flash')).not.toBeNull();
  });
});
