import TextButton from 'components/core/Button/TextButton';
import { useCallback } from 'react';
import { graphql, useFragment } from 'react-relay';
import styled from 'styled-components';
import FollowList from './FollowList';
import { useModalActions } from 'contexts/modal/ModalContext';
import { useTrack } from 'contexts/analytics/AnalyticsContext';
import { FollowerListButtonFragment$key } from '__generated__/FollowerListButtonFragment.graphql';

type Props = {
  userRef: FollowerListButtonFragment$key;
  className?: string;
};

export function pluralize(count: number, singular: string) {
  return count === 1 ? singular : `${singular}s`;
}

export default function FollowerListButton({ userRef, className }: Props) {
  const user = useFragment(
    graphql`
      fragment FollowerListButtonFragment on GalleryUser {
        ...FollowListFragment
      }
    `,
    userRef
  );

  const { showModal } = useModalActions();
  const track = useTrack();

  const handleClick = useCallback(() => {
    track('View Follower List Click');
    showModal({ content: <FollowList userRef={user} />, isPaddingDisabled: true });
  }, [showModal, track, user]);

  return (
    <StyledFollowerListButton className={className}>
      <TextButton text={`Followers`} onClick={handleClick}></TextButton>
    </StyledFollowerListButton>
  );
}

export const StyledFollowerListButton = styled.div`
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
`;
