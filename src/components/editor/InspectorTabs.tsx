import { Tabs } from "@mantine/core";
import { type ReactNode, useEffect, useState } from "react";

export interface InspectorTab {
  value: string;
  label: ReactNode;
  content: ReactNode;
}

interface InspectorTabsProps {
  tabs: InspectorTab[];
  activeTab?: string;
}

export function InspectorTabs({
  tabs,
  activeTab,
}: InspectorTabsProps): React.ReactElement {
  const [value, setValue] = useState(activeTab ?? tabs[0]?.value ?? null);

  useEffect(() => {
    if (activeTab) setValue(activeTab);
  }, [activeTab]);

  return (
    <Tabs
      className="inspector-tabs"
      keepMounted={false}
      value={value}
      onChange={(next) => next && setValue(next)}
    >
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab key={tab.value} value={tab.value}>
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Panel key={tab.value} value={tab.value}>
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}
