import { memo, useCallback, useEffect, useRef } from 'react';
import { graphql, useFragment, useRelayEnvironment } from 'react-relay';
import { fetchQuery } from 'relay-runtime';
import styled from 'styled-components';

import { BODY_FONT_FAMILY } from '~/components/core/Text/Text';
import transitions from '~/components/core/transitions';
import { NftFailureBoundary } from '~/components/NftFailureFallback/NftFailureBoundary';
import { NftFailureFallback } from '~/components/NftFailureFallback/NftFailureFallback';
import { SIDEBAR_ICON_DIMENSIONS } from '~/constants/sidebar';
import { useCollectionEditorContext } from '~/contexts/collectionEditor/CollectionEditorContext';
import { useNftErrorContext } from '~/contexts/NftErrorContext';
import { ContentIsLoadedEvent } from '~/contexts/shimmer/ShimmerContext';
import { SidebarNftIconFragment$key } from '~/generated/SidebarNftIconFragment.graphql';
import { SidebarNftIconPollerNewQuery } from '~/generated/SidebarNftIconPollerNewQuery.graphql';
import { SidebarNftIconPreviewAssetNew$key } from '~/generated/SidebarNftIconPreviewAssetNew.graphql';
import { useNftRetry, useThrowOnMediaFailure } from '~/hooks/useNftRetry';
import { useReportError } from '~/shared/contexts/ErrorReportingContext';
import { CouldNotRenderNftError } from '~/shared/errors/CouldNotRenderNftError';
import { ReportingErrorBoundary } from '~/shared/errors/ReportingErrorBoundary';
import getVideoOrImageUrlForNftPreview from '~/shared/relay/getVideoOrImageUrlForNftPreview';
import colors from '~/shared/theme/colors';
import { getBackgroundColorOverrideForContract } from '~/utils/token';

type SidebarNftIconProps = {
  tokenRef: SidebarNftIconFragment$key;
  handleTokenRenderError: (id: string) => void;
  handleTokenRenderSuccess: (id: string) => void;
};

function SidebarNftIcon({
  tokenRef,
  handleTokenRenderError,
  handleTokenRenderSuccess,
}: SidebarNftIconProps) {
  const token = useFragment(
    graphql`
      fragment SidebarNftIconFragment on Token {
        dbid
        contract {
          contractAddress {
            address
          }
        }
        media {
          ... on Media {
            fallbackMedia {
              mediaURL
            }
          }

          ... on SyncingMedia {
            __typename
          }
        }
        ...SidebarNftIconPreviewAssetNew
      }
    `,
    tokenRef
  );

  const { stagedTokenIds, toggleTokenStaged } = useCollectionEditorContext();

  const isSelected = stagedTokenIds.has(token.dbid);

  const mountRef = useRef(false);

  useEffect(() => {
    // When NFT is selected, scroll Staging Area to the added NFT.
    // But don't do this when this component is first mounted (we dont want to scroll to the bottom when we load the DnD)
    if (mountRef.current && isSelected) {
      document.getElementById(token.dbid)?.scrollIntoView({ behavior: 'smooth' });
    }

    mountRef.current = true;
  }, [token.dbid, isSelected]);

  const contractAddress = token.contract?.contractAddress?.address ?? '';

  const backgroundColorOverride = getBackgroundColorOverrideForContract(contractAddress);

  const {
    isFailed,
    handleNftLoaded,
    handleNftError,
    retryKey,
    refreshMetadata,
    refreshingMetadata,
  } = useNftRetry({ tokenId: token.dbid });

  const handleClick = useCallback(() => {
    if (isFailed) {
      refreshMetadata();

      return;
    }

    toggleTokenStaged(token.dbid);
  }, [isFailed, toggleTokenStaged, token.dbid, refreshMetadata]);

  const handleError = useCallback<ContentIsLoadedEvent>(
    (event) => {
      handleNftError(event);
      handleTokenRenderError(token.dbid);
    },
    [handleNftError, handleTokenRenderError, token.dbid]
  );

  const handleLoad = useCallback<ContentIsLoadedEvent>(
    (event) => {
      handleNftLoaded(event);
      handleTokenRenderSuccess(token.dbid);
    },
    [handleNftLoaded, handleTokenRenderSuccess, token.dbid]
  );

  const relayEnvironment = useRelayEnvironment();
  const { clearTokenFailureState } = useNftErrorContext();
  useEffect(
    function pollTokenWhileStillSyncing() {
      const POLLING_INTERVAL_MS = 5000;
      if (token.media?.__typename !== 'SyncingMedia') {
        return;
      }

      let timeoutId: ReturnType<typeof setTimeout>;

      async function refreshToken() {
        const refreshedToken = await fetchQuery<SidebarNftIconPollerNewQuery>(
          relayEnvironment,
          graphql`
            query SidebarNftIconPollerNewQuery($id: DBID!) {
              tokenById(id: $id) {
                ... on Token {
                  media {
                    __typename
                  }
                }

                ...SidebarNftIconFragment
              }
            }
          `,
          { id: token.dbid }
        ).toPromise();

        if (refreshedToken?.tokenById?.media?.__typename === 'SyncingMedia') {
          // We're still syncing, so queue up another refresh
          timeoutId = setTimeout(refreshToken, POLLING_INTERVAL_MS);
        } else {
          // If the token was failing before, we need to make sure
          // that it's error state gets cleared on the chance
          // that it just got loaded.
          clearTokenFailureState([token.dbid]);
        }
      }

      timeoutId = setTimeout(refreshToken, POLLING_INTERVAL_MS);

      return () => clearTimeout(timeoutId);
    },
    [clearTokenFailureState, relayEnvironment, token.dbid, token.media?.__typename]
  );

  if (token.media?.__typename === 'SyncingMedia') {
    return (
      <LoadingContainer>
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <NftFailureBoundary
      key={retryKey}
      tokenId={token.dbid}
      fallback={
        <StyledSidebarNftIcon backgroundColorOverride={backgroundColorOverride}>
          <NftFailureFallback
            size="tiny"
            tokenId={token.dbid}
            onRetry={refreshMetadata}
            refreshing={refreshingMetadata}
          />
        </StyledSidebarNftIcon>
      }
      onError={handleError}
    >
      <ReportingErrorBoundary
        fallback={
          <StyledSidebarNftIcon backgroundColorOverride={backgroundColorOverride}>
            <RawSidebarPreviewAsset
              onLoad={handleLoad}
              type="image"
              isSelected={isSelected ?? false}
              src={token.media?.fallbackMedia?.mediaURL}
            />
            <StyledOutline onClick={handleClick} isSelected={isSelected} />
          </StyledSidebarNftIcon>
        }
      >
        <StyledSidebarNftIcon backgroundColorOverride={backgroundColorOverride}>
          <SidebarPreviewAsset
            tokenRef={token}
            onLoad={handleLoad}
            isSelected={isSelected ?? false}
          />
          <StyledOutline onClick={handleClick} isSelected={isSelected} />
        </StyledSidebarNftIcon>
      </ReportingErrorBoundary>
    </NftFailureBoundary>
  );
}

const LoadingContainer = styled.div`
  width: ${SIDEBAR_ICON_DIMENSIONS}px;
  height: ${SIDEBAR_ICON_DIMENSIONS}px;

  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${colors.offWhite};
`;

const LoadingText = styled.span`
  font-family: ${BODY_FONT_FAMILY};
  font-style: normal;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;

  color: ${colors.metal};
`;

function RawSidebarPreviewAsset({
  type,
  isSelected,
  src,
  onLoad,
}: {
  type: 'video' | 'image';
  isSelected: boolean;
  src: string | null | undefined;
  onLoad: () => void;
  alt?: string | null;
}) {
  if (!src) {
    throw new CouldNotRenderNftError('SidebarNftIcon', 'missing src');
  }

  const { handleError } = useThrowOnMediaFailure('SidebarPreviewAsset');

  // Some OpenSea assets don't have an image url,
  // so render a freeze-frame of the video instead
  if (type === 'video')
    return (
      <StyledVideo onLoadedData={onLoad} onError={handleError} isSelected={isSelected} src={src} />
    );

  return (
    <StyledImage
      isSelected={isSelected}
      src={src}
      alt="token"
      onLoad={onLoad}
      onError={handleError}
    />
  );
}

type SidebarPreviewAssetProps = {
  tokenRef: SidebarNftIconPreviewAssetNew$key;
  onLoad: ContentIsLoadedEvent;
  isSelected: boolean;
};

function SidebarPreviewAsset({ tokenRef, onLoad, isSelected }: SidebarPreviewAssetProps) {
  const token = useFragment(
    graphql`
      fragment SidebarNftIconPreviewAssetNew on Token {
        ...getVideoOrImageUrlForNftPreviewFragment
      }
    `,
    tokenRef
  );

  const reportError = useReportError();
  const previewUrlSet = getVideoOrImageUrlForNftPreview({
    tokenRef: token,
    handleReportError: reportError,
  });

  if (!previewUrlSet?.urls.small) {
    throw new CouldNotRenderNftError('SidebarNftIcon', 'could not find small image url');
  }

  return (
    <RawSidebarPreviewAsset
      type={previewUrlSet.type}
      isSelected={isSelected}
      src={previewUrlSet.urls.small}
      onLoad={onLoad}
    />
  );
}

export const StyledSidebarNftIcon = styled.div<{ backgroundColorOverride: string }>`
  position: relative;
  width: ${SIDEBAR_ICON_DIMENSIONS}px;
  height: ${SIDEBAR_ICON_DIMENSIONS}px;
  
  // Important to show the refresh tooltip
  overflow: visible;

  display: flex;
  justify-content: center;
  align-items: center;
  ${({ backgroundColorOverride }) =>
    backgroundColorOverride && `background-color: ${backgroundColorOverride}`}};

  &:hover {
    cursor: pointer;
  }
`;

type SelectedProps = {
  isSelected?: boolean;
};

const StyledOutline = styled.div<SelectedProps>`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;

  border: ${({ isSelected }) => (isSelected ? 2 : 0)}px solid ${colors.activeBlue};

  user-select: none;
`;

const StyledImage = styled.img<SelectedProps>`
  max-height: 100%;
  max-width: 100%;
  transition: opacity ${transitions.cubic};
  opacity: ${({ isSelected }) => (isSelected ? 0.5 : 1)};
`;

const StyledVideo = styled.video<SelectedProps>`
  max-height: 100%;
  max-width: 100%;
  transition: opacity ${transitions.cubic};
  opacity: ${({ isSelected }) => (isSelected ? 0.5 : 1)};
`;

export default memo(SidebarNftIcon);
