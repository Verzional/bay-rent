import { PageHeader } from '@/app/_components/common/page-header';
import { requireAdmin } from '@/lib/session';
import { getMaxCodeSequenceByType, listGarages } from '@/service/garage';
import { BatchCreateGarageDialog } from './_components/batch-create-garage-dialog';
import { GarageTable } from './_components/garage-table';

/**
 * Admin garage bay inventory and batch-creation page.
 */
export default async function AdminGaragesPage() {
  await requireAdmin();
  const [garages, maxSequenceByType] = await Promise.all([
    listGarages(),
    getMaxCodeSequenceByType(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Garage Bays"
        description="Manage all S###, C###, and E### bays and create sequential batches."
        actions={<BatchCreateGarageDialog maxSequenceByType={maxSequenceByType} />}
      />

      <GarageTable garages={garages} />
    </div>
  );
}
