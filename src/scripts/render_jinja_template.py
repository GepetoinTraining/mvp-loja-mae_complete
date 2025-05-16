// src/scripts/render_jinja_template.py
import sys
import json
from jinja2 import Environment, FileSystemLoader, select_autoescape
from datetime import datetime
from dateutil import parser as date_parser # For robust date parsing
import os

def format_datetime(value, format="%d/%m/%Y %H:%M"):
    if isinstance(value, str):
        try:
            dt_object = date_parser.parse(value)
            return dt_object.strftime(format)
        except ValueError:
            return value # Return original if parsing fails
    elif isinstance(value, datetime):
        return value.strftime(format)
    return value

def format_currency(value):
    try:
        num = float(value)
        return f"{num:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except (ValueError, TypeError):
        return value

if __name__ == "__main__":
    template_file_path = sys.argv[1]
    data_json_string = sys.argv[2]

    template_dir = os.path.dirname(template_file_path)
    template_file = os.path.basename(template_file_path)

    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(['html', 'xml'])
    )
    env.filters['date'] = format_datetime
    env.filters['currency'] = format_currency # Add currency filter

    template = env.get_template(template_file)
    data = json.loads(data_json_string)
    
    html_output = template.render(data)
    print(html_output)

