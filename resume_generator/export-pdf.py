from weasyprint import HTML

with open("/home/nataniel/Desktop/projects/AutoShake/resume_generator/templates/templateOne.html", "r") as f:
    html_content = f.read()

HTML(string=html_content).write_pdf("report.pdf")