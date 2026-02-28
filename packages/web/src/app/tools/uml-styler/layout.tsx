import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UML Styler - ShardDen',
  description: 'Create beautiful UML diagrams with Mermaid and PlantUML',
};

export default function UMLStylerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}