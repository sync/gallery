import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback } from 'react';
import { Share, View, ViewProps } from 'react-native';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import { SettingsIcon } from 'src/icons/SettingsIcon';

import { BackButton } from '~/components/BackButton';
import { DarkModeToggle } from '~/components/DarkModeToggle';
import { FollowButton } from '~/components/FollowButton';
import { IconContainer } from '~/components/IconContainer';
import { GalleryProfileNavBarFragment$key } from '~/generated/GalleryProfileNavBarFragment.graphql';
import { GalleryProfileNavBarQueryFragment$key } from '~/generated/GalleryProfileNavBarQueryFragment.graphql';
import { MainTabStackNavigatorProp } from '~/navigation/types';
import { useLoggedInUserId } from '~/shared/relay/useLoggedInUserId';

import { QRCodeIcon } from '../../icons/QRCodeIcon';
import { ShareIcon } from '../../icons/ShareIcon';

type ScreenName = 'Profile' | 'Gallery' | 'Collection';
type RouteParams = {
  Gallery: { galleryId: string };
  Collection: { collectionId: string };
  Profile: { username: string };
};

type GalleryProfileNavBarProps = {
  style?: ViewProps['style'];
  shouldShowBackButton: boolean;
  queryRef: GalleryProfileNavBarQueryFragment$key;
  userRef: GalleryProfileNavBarFragment$key;
  screen: ScreenName;
};

export function GalleryProfileNavBar({
  style,
  queryRef,
  userRef,
  shouldShowBackButton,
  screen,
}: GalleryProfileNavBarProps) {
  const query = useFragment(
    graphql`
      fragment GalleryProfileNavBarQueryFragment on Query {
        ...useLoggedInUserIdFragment
        ...FollowButtonQueryFragment
      }
    `,
    queryRef
  );

  const user = useFragment(
    graphql`
      fragment GalleryProfileNavBarFragment on GalleryUser {
        __typename
        id
        username

        ...FollowButtonUserFragment
      }
    `,
    userRef
  );

  const navigation = useNavigation<MainTabStackNavigatorProp>();

  const loggedInUserId = useLoggedInUserId(query);

  const isLoggedInUser = loggedInUserId === user.id;

  const route = useRoute<RouteProp<RouteParams, ScreenName>>();
  const { params } = route;

  const handleShare = useCallback(() => {
    if (screen === 'Gallery' && 'galleryId' in params) {
      Share.share({
        url: `https://gallery.so/${user.username}/galleries/${params.galleryId}`,
      });
      return;
    }

    if (screen === 'Collection' && 'collectionId' in params) {
      Share.share({
        url: `https://gallery.so/${user.username}/${params.collectionId}`,
      });
      return;
    }

    Share.share({ url: `https://gallery.so/${user.username}` });
  }, [params, screen, user.username]);

  const handleQrCode = useCallback(() => {
    if (user.username) {
      navigation.navigate('ProfileQRCode', { username: user.username });
    }
  }, [navigation, user.username]);

  const handleSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return (
    <View style={style} className="flex flex-row justify-between bg-white dark:bg-black-900">
      {shouldShowBackButton ? <BackButton /> : <DarkModeToggle />}

      <View className="flex flex-row items-center space-x-2">
        {isLoggedInUser && (
          <IconContainer
            eventElementId="Profile QR Code Icon"
            eventName="Profile QR Code Icon Clicked"
            icon={<QRCodeIcon />}
            onPress={handleQrCode}
          />
        )}
        <IconContainer
          eventElementId="Profile Share Icon"
          eventName="Profile Share Icon Clicked"
          icon={<ShareIcon />}
          onPress={handleShare}
        />

        <IconContainer
          eventElementId="Settings Share Icon"
          eventName="Settings Icon Clicked"
          icon={<SettingsIcon />}
          onPress={handleSettings}
        />

        {!isLoggedInUser && <FollowButton queryRef={query} userRef={user} />}
      </View>
    </View>
  );
}

type GalleryProfileNavbarFallbackProps = {
  style?: ViewProps['style'];
  shouldShowBackButton: boolean;
};

export function GalleryProfileNavbarFallback({
  style,
  shouldShowBackButton,
}: GalleryProfileNavbarFallbackProps) {
  return (
    <View style={style} className="flex flex-row justify-between bg-white dark:bg-black-900">
      {shouldShowBackButton ? <BackButton /> : <DarkModeToggle />}

      <View className="flex flex-row items-center space-x-2"></View>
    </View>
  );
}
