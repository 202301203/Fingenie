def generate_common_size_pls(items_list):
    sales_item = next((item for item in items_list if item["particulars"].lower() == "sales revenue"), None)

    if not sales_item:
        return {"error": "Sales revenue not found in the provided data."}

    sales_previous = sales_item["previous_year"]
    sales_current = sales_item["current_year"]

    output_rows = []
    for item in items_list:
        prev_amt = item["previous_year"]
        curr_amt = item["current_year"]

        # Calculate percentage of sales, handle division by zero
        prev_pct = round((prev_amt / sales_previous) * 100, 2) if sales_previous else 0
        curr_pct = round((curr_amt / sales_current) * 100, 2) if sales_current else 0

        output_rows.append({
            "particulars": item["particulars"],
            "amount_previous_year": prev_amt,
            "amount_current_year": curr_amt,
            "percentage_of_sales_previous_year": prev_pct,
            "percentage_of_sales_current_year": curr_pct
        })

    return { "rows": output_rows }

# Common_BS_analysis/services.py
def generate_common_size_statement(items_list):
    # 1. Calculate totals for previous & current year
    total_previous = sum(item["previous_year"] for item in items_list)
    total_current = sum(item["current_year"] for item in items_list)

    # 2. Build common size data
    output = []
    for item in items_list:
        prev_amt = item["previous_year"]
        curr_amt = item["current_year"]

        # avoid division by zero
        prev_pct = round((prev_amt / total_previous) * 100, 2) if total_previous else 0
        curr_pct = round((curr_amt / total_current) * 100, 2) if total_current else 0

        output.append({
            "particulars": item["particulars"],
            "amount": {
                "previous_year": prev_amt,
                "current_year": curr_amt
            },
            "percentage_of_total": {
                "previous_year": prev_pct,
                "current_year": curr_pct
            }
        })

    # 3. Return structured JSON
    return {
        "totals": {
            "previous_year": total_previous,
            "current_year": total_current
        },
        "rows": output
    }

def _calculate_change(prev_amt, curr_amt):
    """A helper function to calculate absolute and percentage change."""
    absolute_change = curr_amt - prev_amt
    percentage_change = 0
    if prev_amt != 0:
        percentage_change = round((absolute_change / prev_amt) * 100, 2)
    elif absolute_change > 0:
        percentage_change = 100.0
    return absolute_change, percentage_change

def generate_comparative_pls(items_list):
    """
    Generates a full comparative P&L statement, including calculated totals.
    """
    #Step 1: Initialize variables for totals
    total_revenue_prev, total_revenue_curr = 0, 0
    total_expenses_prev, total_expenses_curr = 0, 0
    income_tax_prev, income_tax_curr = 0, 0
    
    output_rows = []
    
    #Step 2: Process initial items and aggregate totals
    revenue_particulars = ["sales revenue", "other income"]
    tax_particulars = ["income tax"]

    for item in items_list:
        particulars = item["particulars"]
        prev_amt = item.get("previous_year", 0)
        curr_amt = item.get("current_year", 0)

        # Calculate change for the current item
        abs_change, pct_change = _calculate_change(prev_amt, curr_amt)
        
        # Add the processed item to our output list
        output_rows.append({
            "particulars": particulars.title(),
            "previous_year_amount": prev_amt,
            "current_year_amount": curr_amt,
            "increase_decrease_amount": abs_change,
            "increase_decrease_percentage": pct_change
        })
        
        if particulars.lower() in revenue_particulars:
            total_revenue_prev += prev_amt
            total_revenue_curr += curr_amt
        elif particulars.lower() in tax_particulars:
            income_tax_prev += prev_amt
            income_tax_curr += curr_amt
        else: # Assume all other items are expenses
            total_expenses_prev += prev_amt
            total_expenses_curr += curr_amt
    
    #Step 3: Calculate summary rows
    pbt_prev = total_revenue_prev - total_expenses_prev
    pbt_curr = total_revenue_curr - total_expenses_curr
    pat_prev = pbt_prev - income_tax_prev
    pat_curr = pbt_curr - income_tax_curr

    #Step 4: Calculate changes for summary rows
    total_revenue_abs, total_revenue_pct = _calculate_change(total_revenue_prev, total_revenue_curr)
    total_expenses_abs, total_expenses_pct = _calculate_change(total_expenses_prev, total_expenses_curr)
    pbt_abs, pbt_pct = _calculate_change(pbt_prev, pbt_curr)
    pat_abs, pat_pct = _calculate_change(pat_prev, pat_curr)

    #Step 5: Create and insert summary rows into the output
    # Note: Inserting at specific points to match the P&L statement structure.
    output_rows.insert(2, {
        "particulars": "Total Revenue",
        "previous_year_amount": total_revenue_prev,
        "current_year_amount": total_revenue_curr,
        "increase_decrease_amount": total_revenue_abs,
        "increase_decrease_percentage": total_revenue_pct
    })
    output_rows.append({
        "particulars": "Total Expenses",
        "previous_year_amount": total_expenses_prev,
        "current_year_amount": total_expenses_curr,
        "increase_decrease_amount": total_expenses_abs,
        "increase_decrease_percentage": total_expenses_pct
    })
    output_rows.append({
        "particulars": "Profit Before Tax",
        "previous_year_amount": pbt_prev,
        "current_year_amount": pbt_curr,
        "increase_decrease_amount": pbt_abs,
        "increase_decrease_percentage": pbt_pct
    })
    output_rows.append({
        "particulars": "Profit After Tax",
        "previous_year_amount": pat_prev,
        "current_year_amount": pat_curr,
        "increase_decrease_amount": pat_abs,
        "increase_decrease_percentage": pat_pct
    })
    
    return { "rows": output_rows }
