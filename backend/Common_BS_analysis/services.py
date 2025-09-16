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
