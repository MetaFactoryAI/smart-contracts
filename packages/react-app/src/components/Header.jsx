import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://www.metafactory.ai/" target="_blank" rel="noopener noreferrer">
      <PageHeader title="MetaFactory" subTitle="🖼 Wearable and claiming dev" style={{ cursor: "pointer" }} />
    </a>
  );
}
