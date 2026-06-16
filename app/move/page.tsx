import { Suspense } from 'react';

import { MoveListContainer } from '@/components/move/MoveListContainer';

export default function MovePage() {
  return (
    <Suspense>
      <MoveListContainer />
    </Suspense>
  );
}
