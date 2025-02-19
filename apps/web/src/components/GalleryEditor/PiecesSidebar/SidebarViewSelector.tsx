import { useCallback, useState } from 'react';
import styled from 'styled-components';

import { Dropdown } from '~/components/core/Dropdown/Dropdown';
import { DropdownItem } from '~/components/core/Dropdown/DropdownItem';
import { DropdownSection } from '~/components/core/Dropdown/DropdownSection';
import IconContainer from '~/components/core/IconContainer';
import { HStack } from '~/components/core/Spacer/Stack';
import { BaseM } from '~/components/core/Text/Text';
import DoubleArrowsIcon from '~/icons/DoubleArrowsIcon';
import { useTrack } from '~/shared/contexts/AnalyticsContext';

export type SidebarView = 'Collected' | 'Created' | 'Hidden';

type SidebarViewSelectorProps = {
  selectedView: SidebarView;
  onSelectedViewChange: (selectedView: SidebarView) => void;
};

export function SidebarViewSelector({
  selectedView,
  onSelectedViewChange,
}: SidebarViewSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const track = useTrack();

  const onSelectView = useCallback(
    (selectedView: SidebarView) => {
      track('Editor Sidebar Dropdown Clicked', { variant: selectedView });
      onSelectedViewChange(selectedView);
      setIsDropdownOpen(false);
    },
    [track, onSelectedViewChange]
  );

  return (
    <Container>
      <Selector gap={10} align="center" onClick={() => setIsDropdownOpen(true)}>
        <BaseM>{selectedView}</BaseM>
        <IconContainer variant="stacked" size="sm" icon={<DoubleArrowsIcon />} />
      </Selector>
      <StyledDropdown
        position="right"
        active={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
      >
        <DropdownSection>
          <DropdownItem onClick={() => onSelectView('Collected')}>
            <BaseM>Collected</BaseM>
          </DropdownItem>
          <DropdownItem onClick={() => onSelectView('Created')}>
            <BaseM>Created</BaseM>
          </DropdownItem>
          <DropdownItem onClick={() => onSelectView('Hidden')}>
            <BaseM>Hidden</BaseM>
          </DropdownItem>
        </DropdownSection>
      </StyledDropdown>
    </Container>
  );
}

const Selector = styled(HStack)`
  cursor: pointer;
`;

const Container = styled.div`
  position: relative;
`;

const StyledDropdown = styled(Dropdown)`
  width: 100px;
`;
