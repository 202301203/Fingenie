def generate_common_size_pls(items_list):
    sales_item = next((item for item in items_list if item["particulars"].lower() == "sales revenue"), None)

    if not sales_item:
        return {"error": "Sales revenue not found in the provided data."}

    sales_previous = sales_item["previous_year_raw"]
    sales_current = sales_item["current_year_raw"]

    output_rows = []
    for item in items_list:
        prev_amt = item["previous_year_raw"]
        curr_amt = item["current_year_raw"]

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
    # Helper to safely convert to float
    import re
    def to_number(val):
        if val is None:
            return 0.0
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            # Remove commas, currency symbols, and extra text
            cleaned = re.sub(r"[^0-9.\-]", "", val)
            try:
                return float(cleaned)
            except ValueError:
                return 0.0
        return 0.0


    # 1. Calculate totals
    total_previous = sum(to_number(item["previous_year_raw"]) for item in items_list)
    total_current = sum(to_number(item["current_year_raw"]) for item in items_list)

    # 2. Build common size data
    output = []
    for item in items_list:
        prev_amt = to_number(item["previous_year_raw"])
        curr_amt = to_number(item["current_year_raw"])

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

    return {
        "totals": {
            "previous_year": total_previous,
            "current_year": total_current
        },
        "rows": output
    }

#comparative PLS statements
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
    Generates a full comparative P&L statement, including calculated totals,
    with a corrected structure.
    """
    total_revenue_prev, total_revenue_curr = 0, 0
    total_expenses_prev, total_expenses_curr = 0, 0
    income_tax_prev, income_tax_curr = 0, 0
    
    revenue_rows = []
    expense_rows = []
    tax_row = {}

    revenue_particulars = ["sales revenue", "other income"]
    tax_particulars = ["income tax"]

    for item in items_list:
        particulars = item["particulars"]
        try:
            curr_amt = float(item.get('current_year_raw', 0))
            prev_amt = float(item.get('previous_year_raw', 0))
        except (ValueError, TypeError):
            curr_amt, prev_amt = 0, 0

        abs_change, pct_change = _calculate_change(prev_amt, curr_amt)
        
        processed_row = {
            "particulars": particulars.title(),
            "previous_year_amount": prev_amt,
            "current_year_amount": curr_amt,
            "increase_decrease_amount": abs_change,
            "increase_decrease_percentage": pct_change
        }
        
        if particulars.lower() in revenue_particulars:
            total_revenue_prev += prev_amt
            total_revenue_curr += curr_amt
            revenue_rows.append(processed_row)
        elif particulars.lower() in tax_particulars:
            income_tax_prev += prev_amt
            income_tax_curr += curr_amt
            processed_row["particulars"] = f"Less: {processed_row['particulars']}"
            tax_row = processed_row
        else:  # Assume all other items are expenses
            total_expenses_prev += prev_amt
            total_expenses_curr += curr_amt
            expense_rows.append(processed_row)
    
    pbt_prev = total_revenue_prev - total_expenses_prev
    pbt_curr = total_revenue_curr - total_expenses_curr
    pat_prev = pbt_prev - income_tax_prev
    pat_curr = pbt_curr - income_tax_curr

    total_revenue_abs, total_revenue_pct = _calculate_change(total_revenue_prev, total_revenue_curr)
    total_expenses_abs, total_expenses_pct = _calculate_change(total_expenses_prev, total_expenses_curr)
    pbt_abs, pbt_pct = _calculate_change(pbt_prev, pbt_curr)
    pat_abs, pat_pct = _calculate_change(pat_prev, pat_curr)

    final_output_rows = []
    
    final_output_rows.extend(revenue_rows)
    final_output_rows.append({
        "particulars": "Total Revenue",
        "previous_year_amount": total_revenue_prev,
        "current_year_amount": total_revenue_curr,
        "increase_decrease_amount": total_revenue_abs,
        "increase_decrease_percentage": total_revenue_pct
    })
    
    final_output_rows.extend(expense_rows)
    final_output_rows.append({
        "particulars": "Total Expenses",
        "previous_year_amount": total_expenses_prev,
        "current_year_amount": total_expenses_curr,
        "increase_decrease_amount": total_expenses_abs,
        "increase_decrease_percentage": total_expenses_pct
    })
    
    final_output_rows.append({
        "particulars": "Profit Before Tax",
        "previous_year_amount": pbt_prev,
        "current_year_amount": pbt_curr,
        "increase_decrease_amount": pbt_abs,
        "increase_decrease_percentage": pbt_pct
    })

    if tax_row:
        final_output_rows.append(tax_row)

    final_output_rows.append({
        "particulars": "Profit After Tax",
        "previous_year_amount": pat_prev,
        "current_year_amount": pat_curr,
        "increase_decrease_amount": pat_abs,
        "increase_decrease_percentage": pat_pct
    })
    
    return {"rows": final_output_rows}

# // added comparative analysis of balance sheet
def perform_comparative_analysis(items_list: list) -> list:
    """
    Takes a list of financial items and calculates the comparative analysis.
    Returns a new list of dictionaries including the calculated fields.
    """
    comparative_results = []
    for item in items_list:
        particulars = item.get('particulars')
        try:
            current_year = float(item.get('current_year_raw', 0))
            previous_year = float(item.get('previous_year_raw', 0))
        except (ValueError, TypeError):
            current_year, previous_year = 0, 0

        increase_decrease_abs = current_year - previous_year
        increase_decrease_pct = (increase_decrease_abs / previous_year * 100) if previous_year != 0 else 0

        comparative_results.append({
            'particulars': particulars,
            'current_year': current_year,
            'previous_year': previous_year,
            'increase_decrease_absolute': round(increase_decrease_abs, 2),
            'increase_decrease_percentage': round(increase_decrease_pct, 2)
        })
    return comparative_results

