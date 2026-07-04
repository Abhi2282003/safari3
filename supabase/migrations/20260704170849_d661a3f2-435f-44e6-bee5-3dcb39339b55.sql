UPDATE public.seat_bookings
SET agent_collection_status = 'pending',
    collected_at = NULL
WHERE id IN (
  'ccb2f89d-2a89-4f50-afe5-600189297ed8',
  '74b64444-8d23-41af-bd7a-947e4b64eb81',
  '47518f91-f12d-4443-b998-371061b5b34e'
);

DELETE FROM public.agent_collection_payments
WHERE agent_id = '761d4f2f-8956-4350-838b-9589f84594a4'
  AND notes = 'Backfill: bulk mark as received (3 seats)';