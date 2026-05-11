from weasyprint import HTML
from .edit_html import ResumeEditor

def edit_resume(
    html_path: str,
    output_path: str,
    resume_data: dict
):
    """
    Main function to edit/update a resume HTML file
    using structured JSON data.

    Args:
        html_path (str):
            Path to the existing HTML template.

        output_path (str):
            Where the updated HTML should be saved.

        resume_data (dict):
            Structured resume JSON object.
    """

    editor = ResumeEditor(html_path)

    # BASICS
    

    basics = resume_data.get("basics", {})

    links = basics.get("links", {})

    editor.update_header(
        name=basics.get("name", ""),
        title=basics.get("headline", ""),
        email=basics.get("email"),
        linkedin=links.get("linkedin"),
        github=links.get("github"),
        portfolio=links.get("website")
    )

    editor.update_summary(
        basics.get("summary", "")
    )

    
    # EXPERIENCE
    

    experience_data = []

    for exp in resume_data.get("experience", []):

        experience_data.append({
            "title": exp.get("position", ""),
            "company": exp.get("company", ""),
            "date": (
                f"{exp.get('startDate', '')} - "
                f"{exp.get('endDate', '')}"
            ),
            "bullets": exp.get("bullets", [])
        })

    editor.update_experience(experience_data)

    
    # EDUCATION
    

    education_data = []

    for edu in resume_data.get("education", []):

        details = []

        if edu.get("gpa"):
            details.append(f"GPA: {edu['gpa']}")

        if edu.get("honors"):
            details.append(
                "Honors: " + ", ".join(edu["honors"])
            )

        if edu.get("coursework"):
            details.append(
                "Coursework: " + ", ".join(edu["coursework"])
            )

        education_data.append({
            "school": edu.get("institution", ""),
            "degree": (
                f"{edu.get('degree', '')} "
                f"in {edu.get('field', '')}"
            ),
            "date": (
                f"{edu.get('startDate', '')} - "
                f"{edu.get('endDate', '')}"
            ),
            "details": " | ".join(details)
        })

    editor.update_education(education_data)

    
    # PROJECTS
    

    project_data = []

    for proj in resume_data.get("projects", []):

        bullets = proj.get("bullets", [])

        if proj.get("description"):
            bullets.insert(0, proj["description"])

        if proj.get("technologies"):
            bullets.append(
                "Technologies: " +
                ", ".join(proj["technologies"])
            )

        project_data.append({
            "name": proj.get("name", ""),
            "date": proj.get("date", ""),
            "bullets": bullets
        })

    editor.update_projects(project_data)

    
    # SKILLS
    

    all_skills = []

    for skill_group in resume_data.get("skills", []):

        category = skill_group.get("category", "")
        items = skill_group.get("items", [])

        formatted = f"{category}: " + ", ".join(items)

        all_skills.append(formatted)

    editor.update_skills(all_skills)

    
    # SAVE

    editor.save(output_path)


def export_to_pdf(html_path: str, output_path: str):
    with open(html_path, "r") as f:
        html_content = f.read()

    HTML(string=html_content).write_pdf(output_path)