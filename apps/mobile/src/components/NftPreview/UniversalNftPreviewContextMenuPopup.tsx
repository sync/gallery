import { useNavigation } from '@react-navigation/native';
import { ResizeMode } from 'expo-av';
import { PropsWithChildren, useCallback, useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { ContextMenuView, OnPressMenuItemEvent } from 'react-native-ios-context-menu';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import { shareUniversalToken } from 'src/utils/shareToken';

import { GallerySkeleton } from '~/components/GallerySkeleton';
import { NftPreviewAsset } from '~/components/NftPreview/NftPreviewAsset';
import { NftPreviewErrorFallback } from '~/components/NftPreview/NftPreviewErrorFallback';
import { Typography } from '~/components/Typography';
import { UniversalNftPreviewContextMenuPopupTokenFragment$key } from '~/generated/UniversalNftPreviewContextMenuPopupTokenFragment.graphql';
import { MainTabStackNavigatorProp } from '~/navigation/types';
import { fitDimensionsToContainerCover } from '~/screens/NftDetailScreen/NftDetailAsset/fitDimensionToContainer';
import { Dimensions } from '~/screens/NftDetailScreen/NftDetailAsset/types';
import { useTrack } from '~/shared/contexts/AnalyticsContext';
import { ReportingErrorBoundary } from '~/shared/errors/ReportingErrorBoundary';
import getVideoOrImageUrlForNftPreview from '~/shared/relay/getVideoOrImageUrlForNftPreview';

type NftPreviewContextMenuPopupProps = PropsWithChildren<{
  fallbackTokenUrl?: string;
  imageDimensions: Dimensions | null;
  tokenRef: UniversalNftPreviewContextMenuPopupTokenFragment$key;
}>;

const ENABLED_ARTIST = false;

export function UniversalNftPreviewContextMenuPopup({
  children,

  imageDimensions,
  fallbackTokenUrl,
  tokenRef,
}: NftPreviewContextMenuPopupProps) {
  const token = useFragment(
    graphql`
      fragment UniversalNftPreviewContextMenuPopupTokenFragment on Token {
        dbid
        name

        contract {
          name
        }

        media {
          ... on Media {
            previewURLs {
              large
            }
          }
        }
        ...getVideoOrImageUrlForNftPreviewFragment
        ...shareTokenUniversalFragment
      }
    `,
    tokenRef
  );

  const navigation = useNavigation<MainTabStackNavigatorProp>();
  const windowDimensions = useWindowDimensions();

  const tokenUrl = token.media?.previewURLs?.large ?? fallbackTokenUrl;
  const media = getVideoOrImageUrlForNftPreview({
    tokenRef: token,
    preferStillFrameFromGif: true,
  });
  const cachedPreviewAssetUrl = media?.urls.medium || media?.urls.small || null;

  const [popupAssetLoaded, setPopupAssetLoaded] = useState(false);

  const handlePopupAssetLoad = useCallback(() => {
    setPopupAssetLoaded(true);
  }, []);

  const handleMenuItemPress = useCallback<OnPressMenuItemEvent>(
    (event) => {
      if (event.nativeEvent.actionKey === 'view-details') {
        navigation.navigate('UniversalNftDetail', {
          cachedPreviewAssetUrl,
          tokenId: token.dbid,
        });
      } else if (event.nativeEvent.actionKey === 'share') {
        shareUniversalToken(token);
      }
    },
    [cachedPreviewAssetUrl, navigation, token]
  );

  const track = useTrack();

  return (
    <ContextMenuView
      // If we don't have a tokenUrl, we should bail
      isContextMenuEnabled={Boolean(tokenUrl)}
      onPressMenuItem={handleMenuItemPress}
      onMenuDidShow={() => {
        track('NFT Preview Long Press Popup');
      }}
      menuConfig={{
        menuTitle: '',
        menuItems: [
          {
            actionKey: 'view-details',
            actionTitle: 'View Details',
          },
          //   {
          //     actionKey: 'view-gallery',
          //     actionTitle: 'View Gallery',
          //   },
          // {
          //   actionKey: 'view-artist',
          //   actionTitle: 'View Artist',
          // },
          {
            actionKey: 'share',
            actionTitle: 'Share',
          },
        ],
      }}
      previewConfig={{
        previewType: 'CUSTOM',
        previewSize: 'INHERIT',
      }}
      renderPreview={() => {
        if (!tokenUrl) {
          throw new Error("NftPreviewContextMenu shown without a tokenUrl. This shouldn't happen.");
        }

        const MAX_WIDTH = windowDimensions.width - 40;

        // 400px seems to be the right number to make the popup look good on all devices
        // It's not as simple as screen height - (non image part of view) because the popup
        // doesn't go all the way to the top of the screen.
        const MAX_HEIGHT = Math.max(0, windowDimensions.height - 400);

        const finalDimensions = fitDimensionsToContainerCover({
          container: { width: MAX_WIDTH, height: MAX_HEIGHT },
          source: imageDimensions ?? { width: MAX_WIDTH, height: MAX_WIDTH }, // Square aspect ratio fallback
        });

        return (
          <View className="bg-white dark:bg-black-900">
            <View className="self-center" style={finalDimensions}>
              <ReportingErrorBoundary fallback={<NftPreviewErrorFallback />}>
                <NftPreviewAsset
                  priority="high"
                  tokenUrl={tokenUrl}
                  resizeMode={ResizeMode.CONTAIN}
                  onLoad={handlePopupAssetLoad}
                />
              </ReportingErrorBoundary>

              {popupAssetLoaded ? null : (
                <View className="absolute inset-0">
                  <GallerySkeleton>
                    <SkeletonPlaceholder.Item width="100%" height="100%" />
                  </GallerySkeleton>
                </View>
              )}
            </View>
            <View className="flex flex-col py-3 px-4 bg-black/90">
              {token.name && (
                <Typography
                  className="text-offWhite"
                  font={{ family: 'ABCDiatype', weight: 'Bold' }}
                >
                  {token.name}
                </Typography>
              )}

              {token.contract?.name && (
                <Typography
                  font={{
                    family: 'ABCDiatype',
                    weight: 'Regular',
                  }}
                  className="text-sm"
                >
                  <Text className="text-porcelain">{token.contract.name}</Text>
                  {ENABLED_ARTIST && <Text className="text-metal"> by riley.eth</Text>}
                </Typography>
              )}
            </View>
          </View>
        );
      }}
    >
      {children}
    </ContextMenuView>
  );
}
