import { PageEditor } from '@/components/pages/editor/pageEditor.component';

export default function EditPageRoute({ params }: { params: { id: string } }) {
  return <PageEditor pageId={Number(params.id)} />;
}
