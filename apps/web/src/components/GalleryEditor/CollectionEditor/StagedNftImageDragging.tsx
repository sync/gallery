import { useMemo } from 'react';
import { graphql, useFragment } from 'react-relay';
import styled, { keyframes } from 'styled-components';

import { StagedNftImageDraggingFragment$key } from '~/generated/StagedNftImageDraggingFragment.graphql';
import { StagedNftImageDraggingWithoutFallbackFragment$key } from '~/generated/StagedNftImageDraggingWithoutFallbackFragment.graphql';
import { useImageFailureCheck } from '~/hooks/useImageFailureCheck';
import useMouseUp from '~/hooks/useMouseUp';
import { useThrowOnMediaFailure } from '~/hooks/useNftRetry';
import { useReportError } from '~/shared/contexts/ErrorReportingContext';
import { CouldNotRenderNftError } from '~/shared/errors/CouldNotRenderNftError';
import { ReportingErrorBoundary } from '~/shared/errors/ReportingErrorBoundary';
import getVideoOrImageUrlForNftPreview from '~/shared/relay/getVideoOrImageUrlForNftPreview';
import colors from '~/shared/theme/colors';
import { getBackgroundColorOverrideForContract } from '~/utils/token';

type StagedNftImageDraggingProps = {
  tokenRef: StagedNftImageDraggingFragment$key;
  onLoad: () => void;
  size: number;
};

function StagedNftImageDragging({ tokenRef, onLoad, size }: StagedNftImageDraggingProps) {
  const token = useFragment(
    graphql`
      fragment StagedNftImageDraggingFragment on Token {
        media {
          ... on Media {
            fallbackMedia {
              mediaURL
            }
          }
        }

        ...StagedNftImageDraggingWithoutFallbackFragment
      }
    `,
    tokenRef
  );

  return (
    <ReportingErrorBoundary
      fallback={
        <RawStagedNftImageDragging
          onLoad={onLoad}
          size={size}
          url={token.media?.fallbackMedia?.mediaURL}
          type="image"
        />
      }
    >
      <StagedNftImageDraggingWithoutFallback tokenRef={token} onLoad={onLoad} size={size} />
    </ReportingErrorBoundary>
  );
}

type StagedNftImageDraggingWithoutFallbackProps = {
  tokenRef: StagedNftImageDraggingWithoutFallbackFragment$key;
  onLoad: () => void;
  size: number;
};

function StagedNftImageDraggingWithoutFallback({
  tokenRef,
  size,
  onLoad,
}: StagedNftImageDraggingWithoutFallbackProps) {
  const token = useFragment(
    graphql`
      fragment StagedNftImageDraggingWithoutFallbackFragment on Token {
        contract {
          contractAddress {
            address
          }
        }
        ...getVideoOrImageUrlForNftPreviewFragment
      }
    `,
    tokenRef
  );

  const reportError = useReportError();
  const result = getVideoOrImageUrlForNftPreview({
    tokenRef: token,
    handleReportError: reportError,
  });

  const contractAddress = token.contract?.contractAddress?.address ?? '';
  const backgroundColorOverride = getBackgroundColorOverrideForContract(contractAddress);

  if (result?.urls.large) {
    return (
      <RawStagedNftImageDragging
        size={size}
        onLoad={onLoad}
        type={result.type}
        url={result.urls.large}
        backgroundColorOverride={backgroundColorOverride}
      />
    );
  } else {
    throw new CouldNotRenderNftError('StagedNftImageDragging', 'Nft did not have a large url');
  }
}

type RawStagedNftImageDraggingProps = {
  size: number;
  type: 'image' | 'video';
  url: string | null | undefined;
  onLoad: () => void;
  backgroundColorOverride?: string;
};

function RawStagedNftImageDragging({
  url,
  type,
  size,
  onLoad,
  backgroundColorOverride,
}: RawStagedNftImageDraggingProps) {
  if (!url) {
    throw new CouldNotRenderNftError('RawStagedNftImageDragging', 'Nft did not have a url');
  }

  const isMouseUp = useMouseUp();

  // slightly enlarge the image when dragging
  const zoomedSize = useMemo(() => size * 1.02, [size]);

  return type === 'video' ? (
    <StagedNftImageDraggingVideo
      zoomedSize={zoomedSize}
      isMouseUp={isMouseUp}
      url={url}
      onLoad={onLoad}
    />
  ) : (
    <StagedNftImageDraggingImage
      zoomedSize={zoomedSize}
      isMouseUp={isMouseUp}
      backgroundColorOverride={backgroundColorOverride ?? ''}
      url={url}
      onLoad={onLoad}
    />
  );
}

type StagedNftImageDraggingVideoProps = {
  zoomedSize: number;
  isMouseUp: boolean;
  url: string;
  onLoad: () => void;
};

function StagedNftImageDraggingVideo({
  zoomedSize,
  isMouseUp,
  url,
  onLoad,
}: StagedNftImageDraggingVideoProps) {
  const { handleError } = useThrowOnMediaFailure('StagedNftImageDraggingVideo');

  return (
    <VideoContainer isMouseUp={isMouseUp} size={zoomedSize}>
      <StyledDraggingVideo onLoadedData={onLoad} onError={handleError} src={url} />
    </VideoContainer>
  );
}

type StagedNftImageDraggingImageProps = {
  zoomedSize: number;
  isMouseUp: boolean;
  backgroundColorOverride: string;
  url: string;
  onLoad: () => void;
};

function StagedNftImageDraggingImage({
  zoomedSize,
  isMouseUp,
  backgroundColorOverride,
  url,
}: StagedNftImageDraggingImageProps) {
  const { handleError } = useThrowOnMediaFailure('StagedNftImageDraggingImage');

  // We have to use this since we're not using an actual img element
  useImageFailureCheck({ url, onError: handleError });

  return (
    <ImageContainer size={zoomedSize} backgroundColorOverride={backgroundColorOverride}>
      <StyledDraggingImage srcUrl={url} isMouseUp={isMouseUp} size={zoomedSize} />
    </ImageContainer>
  );
}

const grow = keyframes`
  from {height: 280px; width: 280px}
  to {height: 284px; width: 284px}
`;

const VideoContainer = styled.div<{ isMouseUp: boolean; size: number }>`
  // TODO handle non square videos
  box-shadow: 0px 0px 16px 4px rgb(0 0 0 / 34%);
  height: ${({ size }) => size}px;
  width: ${({ size }) => size}px;

  // we need to manually use isMouseUp instead of :active to set the grabbing cursor
  // because this element was never clicked, so it is not considered active
  cursor: ${({ isMouseUp }) => (isMouseUp ? 'grab' : 'grabbing')};
`;

const StyledDraggingVideo = styled.video`
  width: 100%;
`;

const ImageContainer = styled.div<{ size: number; backgroundColorOverride: string }>`
  background-color: ${({ backgroundColorOverride }) =>
    backgroundColorOverride ? backgroundColorOverride : colors.white};
  height: ${({ size }) => size}px;
  width: ${({ size }) => size}px;
`;

const StyledDraggingImage = styled.div<{
  srcUrl: string;
  isMouseUp: boolean;
  size: number;
}>`
  background-image: ${({ srcUrl }) => `url(${srcUrl})`};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;

  box-shadow: 0px 0px 16px 4px rgb(0 0 0 / 34%);
  height: ${({ size }) => size}px;
  width: ${({ size }) => size}px;

  // we need to manually use isMouseUp instead of :active to set the grabbing cursor
  // because this element was never clicked, so it is not considered active
  cursor: ${({ isMouseUp }) => (isMouseUp ? 'grab' : 'grabbing')};

  // TODO investigate smooth scaling
  // transition: width 200ms, height 200ms;
  // animation: ${grow} 50ms linear;
`;

export default StagedNftImageDragging;
