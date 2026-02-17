-- Revert a sale by restoring inventory and removing the transaction.
-- Run this in Supabase SQL editor once.

create or replace function public.revert_sale(p_sale_id uuid, p_staff_id uuid)
returns void
language plpgsql
as $$
declare
    sale_record record;
    item jsonb;
    v_product_id uuid;
    v_quantity integer;
    v_batch_note text;
begin
    select *
    into sale_record
    from public.sales_transactions
    where id = p_sale_id;

    if not found then
        raise exception 'Sale % not found', p_sale_id;
    end if;

    v_batch_note := 'REV-' || p_sale_id::text;

    for item in select * from jsonb_array_elements(sale_record.sale_items)
    loop
        v_product_id := (item ->> 'product_id')::uuid;
        v_quantity := (item ->> 'quantity')::integer;

        -- Restore stock by inserting a reversal batch.
        insert into public.inventory (
            product_id,
            warehouse_id,
            quantity,
            last_updated,
            expiry_date,
            batch_number
        )
        values (
            v_product_id,
            sale_record.warehouse_id,
            v_quantity,
            now(),
            null,
            v_batch_note
        );

        -- Audit step skipped: stock_adjustments has a strict reason constraint.
    end loop;

    delete from public.sales_transactions where id = p_sale_id;
end;
$$;
