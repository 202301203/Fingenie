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
