import { useCallback, useMemo } from 'react';
import { graphql, usePaginationFragment } from 'react-relay';
import styled from 'styled-components';

import { Button } from '~/components/core/Button/Button';
import { VStack } from '~/components/core/Spacer/Stack';
import { BaseM, TitleDiatypeL } from '~/components/core/Text/Text';
import { LatestFollowingFeedFragment$key } from '~/generated/LatestFollowingFeedFragment.graphql';
import { LatestFollowingFeedPaginationQuery } from '~/generated/LatestFollowingFeedPaginationQuery.graphql';
import { useTrack } from '~/shared/contexts/AnalyticsContext';

import { useTrackLoadMoreFeedEvents } from './analytics';
import { ITEMS_PER_PAGE } from './constants';
import FeedList from './FeedList';

type Props = {
  queryRef: LatestFollowingFeedFragment$key;
  onSeeAll: () => void;
};

export function LatestFollowingFeed({ onSeeAll, queryRef }: Props) {
  const {
    data: query,
    loadPrevious,
    hasPrevious,
  } = usePaginationFragment<LatestFollowingFeedPaginationQuery, LatestFollowingFeedFragment$key>(
    graphql`
      fragment LatestFollowingFeedFragment on Query
      @refetchable(queryName: "LatestFollowingFeedPaginationQuery") {
        ...FeedListFragment

        viewer {
          ... on Viewer {
            feed(before: $latestFollowingBefore, last: $latestFollowingLast)
              @connection(key: "ViewerFeedFragment_feed") {
              edges {
                node {
                  ... on FeedEvent {
                    __typename

                    ...FeedListEventDataFragment
                  }
                }
              }
            }
          }
        }
      }
    `,
    queryRef
  );

  const trackLoadMoreFeedEvents = useTrackLoadMoreFeedEvents();

  const loadNextPage = useCallback(() => {
    return new Promise<void>((resolve) => {
      trackLoadMoreFeedEvents('latest-following');
      // Infinite scroll component wants load callback to return a promise
      loadPrevious(ITEMS_PER_PAGE, { onComplete: () => resolve() });
    });
  }, [loadPrevious, trackLoadMoreFeedEvents]);

  const noViewerFeedEvents = !query.viewer?.feed?.edges?.length;

  const track = useTrack();

  const handleSeeWorldwideClick = useCallback(() => {
    track('Feed: Clicked worldwide button from inbox zero');
    onSeeAll();
  }, [onSeeAll, track]);

  const feedData = useMemo(() => {
    const events = [];

    for (const edge of query.viewer?.feed?.edges ?? []) {
      if (edge?.node?.__typename === 'FeedEvent' && edge.node) {
        events.push(edge.node);
      }
    }

    return events;
  }, [query.viewer?.feed?.edges]);

  return noViewerFeedEvents ? (
    <StyledEmptyFeed gap={12}>
      <VStack align="center">
        <TitleDiatypeL>It's quiet in here</TitleDiatypeL>
        <StyledEmptyFeedBody>
          Discover new collectors to follow in the worldwide feed.
        </StyledEmptyFeedBody>
      </VStack>
      <VStack>
        <Button variant="secondary" onClick={handleSeeWorldwideClick}>
          See worldwide activity
        </Button>
      </VStack>
    </StyledEmptyFeed>
  ) : (
    <FeedList
      feedEventRefs={feedData}
      loadNextPage={loadNextPage}
      hasNext={hasPrevious}
      queryRef={query}
      feedMode={'FOLLOWING'}
    />
  );
}

const StyledEmptyFeed = styled(VStack)`
  align-items: center;
  justify-content: center;
  padding-top: 35vh;
`;

const StyledEmptyFeedBody = styled(BaseM)`
  width: 194px;
  text-align: center;
`;
