from bs4 import BeautifulSoup


class ResumeEditor:
    def __init__(self, html_path):
        self.html_path = html_path
        with open(html_path, "r", encoding="utf-8") as f:
            self.soup = BeautifulSoup(f.read(), "html.parser")

    def _find_section(self, section_title):
        for section in self.soup.find_all("div", class_="section"):
            title = section.find("div", class_="section-title")
            if title and title.text.strip().lower() == section_title.lower():
                return section
        raise ValueError(f"Section '{section_title}' not found.")

    def _clear_section_content(self, section):
        for child in list(section.children):
            if getattr(child, "get", lambda x, y=None: None)("class") != ["section-title"]:
                child.extract()

    def update_section(self, section_title, html_content):
        section = self._find_section(section_title)
        self._clear_section_content(section)
        section.append(BeautifulSoup(html_content, "html.parser"))

    def update_header(self, name, title, email=None, linkedin=None, github=None, portfolio=None):
        header = self.soup.find("div", class_="header")
        if not header:
            raise ValueError("Header section not found.")

        header.find("h1").string = name
        header.find("p").string = title

        links = []
        if email:
            links.append(f'<a href="mailto:{email}">{email}</a>')
        if linkedin:
            links.append(f'<a href="{linkedin}">LinkedIn</a>')
        if github:
            links.append(f'<a href="{github}">GitHub</a>')
        if portfolio:
            links.append(f'<a href="{portfolio}">Portfolio</a>')

        contact = header.find("div", class_="contact")
        contact.clear()
        contact.append(BeautifulSoup(" | ".join(links), "html.parser"))

    def update_summary(self, summary_text):
        self.update_section("Summary", f"<p>{summary_text}</p>")

    def update_skills(self, skills):
        html = '<div class="skills">' + "".join(
            f'<div class="skill">{s}</div>' for s in skills
        ) + "</div>"
        self.update_section("Skills", html)

    def update_experience(self, experiences):
        html = ""
        for exp in experiences:
            bullets = "".join(f"<li>{b}</li>" for b in exp["bullets"])
            html += f"""
            <div class="item">
                <div class="item-header">
                    <div>
                        <div class="item-title">{exp['title']}</div>
                        <div class="item-subtitle">{exp['company']}</div>
                    </div>
                    <div class="date">{exp['date']}</div>
                </div>
                <ul>{bullets}</ul>
            </div>
            """
        self.update_section("Experience", html)

    def update_education(self, education_list):
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

    def update_projects(self, projects):
        html = ""
        for project in projects:
            bullets = "".join(f"<li>{b}</li>" for b in project["bullets"])
            html += f"""
            <div class="item">
                <div class="item-header">
                    <div>
                        <div class="item-title">{project['name']}</div>
                    </div>
                    <div class="date">{project['date']}</div>
                </div>
                <ul>{bullets}</ul>
            </div>
            """
        self.update_section("Projects", html)

    def save(self, output_path=None):
        output_path = output_path or self.html_path
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(str(self.soup))
