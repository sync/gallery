import { useMemo } from 'react';
import { graphql, useFragment } from 'react-relay';

import {
  useAnnouncementFragment$key,
  UserExperienceType,
} from '~/generated/useAnnouncementFragment.graphql';
import { getDaysSince, getTimeSince } from '~/shared/utils/time';

import { ANNOUNCEMENT_CONTENT } from './constants';

export type AnnouncementType = {
  key: UserExperienceType;
  title: string;
  description: string;
  date: string;
  time: string | null; // time since date
  experienced: boolean;
  link?: string;
  ctaText?: string;
};

export default function useAnnouncement(queryRef: useAnnouncementFragment$key) {
  const query = useFragment(
    graphql`
      fragment useAnnouncementFragment on Query {
        viewer {
          ... on Viewer {
            userExperiences {
              type
              experienced
            }
          }
        }
      }
    `,
    queryRef
  );

  const announcements = useMemo<AnnouncementType[]>(() => {
    const userExperiences = query.viewer?.userExperiences ?? [];
    const announcementsLists = ANNOUNCEMENT_CONTENT;

    return (
      announcementsLists
        // hide older announcements
        .filter((announcement) => {
          return getDaysSince(announcement.date) <= 30;
        })
        .map((announcement) => {
          return {
            ...announcement,
            key: announcement.key as UserExperienceType,
            time: getTimeSince(announcement.date),
            experienced: userExperiences.some(
              (userExperience) =>
                userExperience.type === announcement.key && userExperience.experienced
            ),
          };
        })
        .sort((a, b) => {
          if (a.date && b.date) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }
          return 0;
        })
    );
  }, [query.viewer?.userExperiences]);

  return {
    announcements,
    totalUnreadAnnouncements:
      announcements.filter((announcement) => !announcement.experienced).length ?? 0,
  };
}
