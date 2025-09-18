def get_ai_summary(analysis_data: list) -> str:
    """
    Sends calculated data to a Gen AI for a summary that serves a mixed audience.
    """
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel('gemini-1.5-flash')

        

        # 1. Format the data into a clear string for the prompt.
        data_string = ""
        for item in analysis_data:
            change = item['increase_decrease_percentage']
            data_string += f"- {item['particulars']}: Change of {change:.2f}%\n"

        # 2. Create the detailed prompt.
        prompt = f"""
        *ROLE:* You are a skilled business analyst.
        *AUDIENCE:* A diverse group, including both non-financial startup founders and finance students. Your summary must be clear for the founder and credible for the student.
        *GOAL:* Provide a balanced summary of the company's financial performance.

        *INSTRUCTIONS:*
        1.  Start with a 2-3 sentence high-level "Executive Summary".
        2.  Follow with a bulleted list of "Key Observations".
        3.  For each bullet point, state the observation (e.g., "Revenue grew by 11.1%").
        4.  Immediately after, add a simple explanation titled "What this means:" (e.g., "What this means: The company generated more sales this year than last year."). This makes it accessible to the non-financial reader.
        5.  Maintain a professional but accessible tone.

        *FINANCIAL DATA (Year-over-Year Changes):*
        {data_string}

        *ANALYSIS:*
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Could not generate AI summary. Error: {e}"