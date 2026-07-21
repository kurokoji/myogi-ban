import { Accordion } from "@mantine/core";
import { type ReactNode, useEffect, useState } from "react";
import {
  readOpenSidebarSections,
  writeOpenSidebarSections,
} from "../../sidebar-sections";

interface SidebarStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SidebarSection {
  value: string;
  label: ReactNode;
  content: ReactNode;
}

interface SidebarAccordionProps {
  fixedContent?: ReactNode;
  revealSection?: string;
  sections: SidebarSection[];
  storage?: SidebarStorage;
}

export function SidebarAccordion({
  fixedContent,
  revealSection,
  sections,
  storage = window.localStorage,
}: SidebarAccordionProps): React.ReactElement {
  const [openSections, setOpenSections] = useState<string[]>(() =>
    readOpenSidebarSections(storage, ["layout"]),
  );

  useEffect(() => {
    if (!revealSection) return;
    setOpenSections((current) => {
      if (current.includes(revealSection)) return current;
      const next = [...current, revealSection];
      writeOpenSidebarSections(storage, next);
      return next;
    });
  }, [revealSection, storage]);

  const changeOpenSections = (values: string[]) => {
    setOpenSections(values);
    writeOpenSidebarSections(storage, values);
  };

  return (
    <>
      {fixedContent}
      <Accordion
        className="sidebar-accordion"
        multiple
        transitionDuration={0}
        value={openSections}
        onChange={changeOpenSections}
      >
        {sections.map((section) => (
          <Accordion.Item key={section.value} value={section.value}>
            <Accordion.Control>{section.label}</Accordion.Control>
            <Accordion.Panel>{section.content}</Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </>
  );
}
