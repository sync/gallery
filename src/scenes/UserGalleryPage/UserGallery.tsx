import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';
import styled from 'styled-components';

import breakpoints from '~/components/core/breakpoints';
import { VStack } from '~/components/core/Spacer/Stack';
import { useModalState } from '~/contexts/modal/ModalContext';
import { UserGalleryFragment$key } from '~/generated/UserGalleryFragment.graphql';
import useKeyDown from '~/hooks/useKeyDown';
import { useIsMobileOrMobileLargeWindowWidth } from '~/hooks/useWindowSize';
import useDisplayFullPageNftDetailModal from '~/scenes/NftDetailPage/useDisplayFullPageNftDetailModal';
import NotFound from '~/scenes/NotFound/NotFound';
import { UserGalleryLayout } from '~/scenes/UserGalleryPage/UserGalleryLayout';
import { UserNameAndDescriptionHeader } from '~/scenes/UserGalleryPage/UserNameAndDescriptionHeader';

type Props = {
  queryRef: UserGalleryFragment$key;
};

function UserGallery({ queryRef }: Props) {
  const query = useFragment(
    graphql`
      fragment UserGalleryFragment on Query {
        viewer {
          ... on Viewer {
            user {
              dbid
            }
            viewerGalleries {
              gallery {
                dbid
              }
            }
          }
        }

        user: userByUsername(username: $username) @required(action: THROW) {
          ... on GalleryUser {
            __typename

            featuredGallery @required(action: THROW) {
              ...UserGalleryLayoutFragment
            }

            ...UserNameAndDescriptionHeader
          }
          ... on ErrUserNotFound {
            __typename
          }
        }

        ...UserGalleryLayoutQueryFragment
      }
    `,
    queryRef
  );

  const { user } = query;
  const { push } = useRouter();

  const galleryId = query.viewer?.viewerGalleries?.[0]?.gallery?.dbid;

  const loggedInUserId = query.viewer?.user?.dbid;
  const isLoggedIn = Boolean(loggedInUserId);

  const { isModalOpenRef } = useModalState();

  const navigateToEdit = useCallback(() => {
    if (!isLoggedIn) return;
    if (isModalOpenRef.current) return;
    void push({ pathname: '/gallery/[galleryId]/edit', query: { galleryId: galleryId as string } });
  }, [isLoggedIn, isModalOpenRef, push, galleryId]);

  useKeyDown('e', navigateToEdit);
  useDisplayFullPageNftDetailModal();

  const isMobile = useIsMobileOrMobileLargeWindowWidth();

  if (user.__typename === 'ErrUserNotFound') {
    return <NotFound />;
  }

  if (user.__typename !== 'GalleryUser') {
    throw new Error(`Expected user to be type GalleryUser. Received: ${user.__typename}`);
  }

  return (
    <Container gap={isMobile ? 12 : 24}>
      <UserNameAndDescriptionHeader userRef={user} />
      <Divider />
      <UserGalleryLayout galleryRef={user.featuredGallery} queryRef={query} />
    </Container>
  );
}

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #e7e7e7;
`;

const Container = styled(VStack)`
  margin-top: 10px;

  @media only screen and ${breakpoints.tablet} {
    margin-top: 24px;
  }

  width: 100%;
  max-width: 1200px;
`;

export default UserGallery;
