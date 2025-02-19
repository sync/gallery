import { useCallback } from 'react';
import { useFragment } from 'react-relay';
import { graphql } from 'relay-runtime';

import { useModalActions } from '~/contexts/modal/ModalContext';
import { AdmireButtonFragment$key } from '~/generated/AdmireButtonFragment.graphql';
import { AdmireButtonQueryFragment$key } from '~/generated/AdmireButtonQueryFragment.graphql';
import { AuthModal } from '~/hooks/useAuthModal';
import { AdmireIcon } from '~/icons/SocializeIcons';
import { useTrack } from '~/shared/contexts/AnalyticsContext';

type AdmireButtonProps = {
  eventRef: AdmireButtonFragment$key;
  queryRef: AdmireButtonQueryFragment$key;
  onAdmire: () => void;
  onRemoveAdmire: (feedItemId: string, feedItemDbid: string, viewerAdmireDbid: string) => void;
};

export function AdmireButton({ eventRef, queryRef, onAdmire, onRemoveAdmire }: AdmireButtonProps) {
  const feedItem = useFragment(
    graphql`
      fragment AdmireButtonFragment on FeedEventOrError {
        __typename
        ... on FeedEvent {
          id
          dbid

          viewerAdmire {
            dbid
          }
        }
        ... on Post {
          id
          dbid

          viewerAdmire {
            dbid
          }
        }
      }
    `,
    eventRef
  );

  if (feedItem.__typename !== 'FeedEvent' && feedItem.__typename !== 'Post') {
    throw new Error(`Unexpected typename: ${feedItem.__typename}`);
  }

  const query = useFragment(
    graphql`
      fragment AdmireButtonQueryFragment on Query {
        viewer {
          __typename
        }

        ...useAuthModalFragment
      }
    `,
    queryRef
  );
  const { showModal } = useModalActions();

  const track = useTrack();

  const handleRemoveAdmire = useCallback(async () => {
    if (!feedItem.viewerAdmire?.dbid) {
      return;
    }
    onRemoveAdmire(feedItem.id, feedItem.dbid, feedItem.viewerAdmire.dbid);
  }, [onRemoveAdmire, feedItem.dbid, feedItem.id, feedItem.viewerAdmire?.dbid]);

  const handleAdmire = useCallback(async () => {
    if (query.viewer?.__typename !== 'Viewer') {
      showModal({
        content: <AuthModal queryRef={query} />,
        headerText: 'Sign In',
      });

      return;
    }

    track('Admire Click');
    onAdmire();
  }, [query, track, onAdmire, showModal]);

  const hasViewerAdmiredEvent = Boolean(feedItem.viewerAdmire);

  return (
    <AdmireIcon
      onClick={hasViewerAdmiredEvent ? handleRemoveAdmire : handleAdmire}
      active={hasViewerAdmiredEvent}
    />
  );
}
