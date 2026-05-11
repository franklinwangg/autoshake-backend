from bs4 import BeautifulSoup
from pathlib import Path


class ResumeEditor:
    def __init__(self, html_path):
        self.html_path = html_path

        with open(html_path, "r", encoding="utf-8") as f:
            self.soup = BeautifulSoup(f.read(), "html.parser")

    # ---------------------------------------------------
    # INTERNAL HELPERS
    # ---------------------------------------------------

    def _find_section(self, section_title):
        sections = self.soup.find_all("div", class_="section")

        for section in sections:
            title = section.find("div", class_="section-title")

            if title and title.text.strip().lower() == section_title.lower():
                return section

        raise ValueError(f"Section '{section_title}' not found.")

    def _clear_section_content(self, section):
        children = list(section.children)

        for child in children:
            if getattr(child, "get", lambda x, y=None: None)("class") != ["section-title"]:
                child.extract()

    # ---------------------------------------------------
    # GENERIC SECTION UPDATE
    # ---------------------------------------------------

    def update_section(self, section_title, html_content):
        section = self._find_section(section_title)

        self._clear_section_content(section)

        new_content = BeautifulSoup(html_content, "html.parser")
        section.append(new_content)

    # ---------------------------------------------------
    # HEADER
    # ---------------------------------------------------

    def update_header(
        self,
        name,
        title,
        email=None,
        linkedin=None,
        github=None,
        portfolio=None
    ):
        header = self.soup.find("div", class_="header")

        if not header:
            raise ValueError("Header section not found.")

        # Name
        h1 = header.find("h1")
        h1.string = name

        # Title
        subtitle = header.find("p")
        subtitle.string = title

        # Contact Links
        contact = header.find("div", class_="contact")

        links = []

        if email:
            links.append(f'<a href="mailto:{email}">{email}</a>')

        if linkedin:
            links.append(f'<a href="{linkedin}">LinkedIn</a>')

        if github:
            links.append(f'<a href="{github}">GitHub</a>')

        if portfolio:
            links.append(f'<a href="{portfolio}">Portfolio</a>')

        contact.clear()

        contact.append(
            BeautifulSoup(" | ".join(links), "html.parser")
        )

    # ---------------------------------------------------
    # SUMMARY
    # ---------------------------------------------------

    def update_summary(self, summary_text):
        html = f"<p>{summary_text}</p>"

        self.update_section("Summary", html)

    # ---------------------------------------------------
    # SKILLS
    # ---------------------------------------------------

    def update_skills(self, skills):
        """
        skills = ["Python", "React", "AWS"]
        """

        skills_html = '<div class="skills">'

        for skill in skills:
            skills_html += f'<div class="skill">{skill}</div>'

        skills_html += "</div>"

        self.update_section("Skills", skills_html)

    # ---------------------------------------------------
    # EXPERIENCE
    # ---------------------------------------------------

    def update_experience(self, experiences):
        """
        experiences = [
            {
                "title": "...",
                "company": "...",
                "date": "...",
                "bullets": [...]
            }
        ]
        """

        html = ""

        for exp in experiences:
            bullets = "".join(
                [f"<li>{b}</li>" for b in exp["bullets"]]
            )

            html += f"""
            <div class="item">
                <div class="item-header">
                    <div>
                        <div class="item-title">{exp['title']}</div>
                        <div class="item-subtitle">{exp['company']}</div>
                    </div>

                    <div class="date">{exp['date']}</div>
                </div>

                <ul>
                    {bullets}
                </ul>
            </div>
            """

        self.update_section("Experience", html)

    # ---------------------------------------------------
    # EDUCATION
    # ---------------------------------------------------

    def update_education(self, education_list):
        """
        education_list = [
            {
                "school": "...",
                "degree": "...",
                "date": "...",
                "details": "..."
            }
        ]
        """

        html = ""

        for edu in education_list:
            html += f"""
            <div class="item">
                <div class="item-header">
                    <div>
                        <div class="item-title">{edu['school']}</div>
                        <div class="item-subtitle">{edu['degree']}</div>
                    </div>

                    <div class="date">{edu['date']}</div>
                </div>

                <p>{edu['details']}</p>
            </div>
            """

        self.update_section("Education", html)

    # ---------------------------------------------------
    # PROJECTS
    # ---------------------------------------------------

    def update_projects(self, projects):
        """
        projects = [
            {
                "name": "...",
                "date": "...",
                "bullets": [...]
            }
        ]
        """

        html = ""

        for project in projects:
            bullets = "".join(
                [f"<li>{b}</li>" for b in project["bullets"]]
            )

            html += f"""
            <div class="item">
                <div class="item-header">
                    <div>
                        <div class="item-title">{project['name']}</div>
                    </div>

                    <div class="date">{project['date']}</div>
                </div>

                <ul>
                    {bullets}
                </ul>
            </div>
            """

        self.update_section("Projects", html)

    # ---------------------------------------------------
    # SAVE
    # ---------------------------------------------------

    def save(self, output_path=None):
        output_path = output_path or self.html_path

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(str(self.soup))

        print(f"Resume saved to: {output_path}")


# =======================================================
# EXAMPLE USAGE
# =======================================================

if __name__ == "__main__":

    editor = ResumeEditor("resume.html")

    # ---------------- HEADER ----------------

    editor.update_header(
        name="Chaavan Sure",
        title="Software Engineer | AI Systems | Full Stack Developer",
        email="chaavan@example.com",
        linkedin="https://linkedin.com/in/chaavan",
        github="https://github.com/chaavan",
        portfolio="https://chaavan.dev"
    )

    # ---------------- SUMMARY ----------------

    editor.update_summary(
        """
        Computer Science student focused on AI systems,
        automation infrastructure, scalable web platforms,
        and applied machine learning.
        """
    )

    # ---------------- SKILLS ----------------

    editor.update_skills([
        "Python",
        "TypeScript",
        "React",
        "Next.js",
        "PostgreSQL",
        "AWS",
        "Docker",
        "Machine Learning",
        "FastAPI",
        "Node.js"
    ])

    # ---------------- EXPERIENCE ----------------

    editor.update_experience([
        {
            "title": "AI Researcher",
            "company": "UCSC Research Lab",
            "date": "2025 - Present",
            "bullets": [
                "Built AI simulation tooling for autonomous systems",
                "Developed scalable ML data pipelines",
                "Worked on multi-agent evaluation systems"
            ]
        },

        {
            "title": "Software Engineer Intern",
            "company": "Startup Company",
            "date": "2024 - 2025",
            "bullets": [
                "Developed backend APIs using FastAPI",
                "Built internal automation tooling",
                "Improved database performance and reliability"
            ]
        }
    ])

    # ---------------- EDUCATION ----------------

    editor.update_education([
        {
            "school": "University of California, Santa Cruz",
            "degree": "B.S. Computer Science: Game Design",
            "date": "2023 - 2026",
            "details": "Dean's List, GPA: 3.9+"
        }
    ])

    # ---------------- PROJECTS ----------------

    editor.update_projects([
        {
            "name": "AI Workflow Automation Platform",
            "date": "2025",
            "bullets": [
                "Built multi-agent workflow infrastructure",
                "Integrated Gmail, Drive, and Calendar APIs",
                "Created scalable automation backend"
            ]
        },

        {
            "name": "eVTOL Simulation System",
            "date": "2026",
            "bullets": [
                "Designed vertiport placement models",
                "Built ADS-B conflict simulation system",
                "Implemented route safety evaluation tools"
            ]
        }
    ])


    editor.save("generated_resume.html")