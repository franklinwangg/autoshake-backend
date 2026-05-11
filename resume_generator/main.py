#import libraries
from pylatex import Command, Document, Section, Subsection
from pylatex.utils import NoEscape, italic


#load resume templates
def fill_document(doc):
    with doc.create(Section("Education")):
        doc.append("Bachelor of Science in Computer Science, University of Example, 2015-2019")

    with doc.create(Section("Experience")):
        with doc.create(Subsection("Software Engineer at Tech Company")):
            doc.append("Developed and maintained web applications using Python and JavaScript.")


if __name__ == "__main__":
    # Basic document
    doc = Document("basic")
    fill_document(doc)

    doc.generate_pdf(clean_tex=False)
    doc.generate_tex()

    # Document with `\maketitle` command activated
    doc = Document()

    doc.preamble.append(Command("title", "Awesome Title"))
    doc.preamble.append(Command("author", "Anonymous author"))
    doc.preamble.append(Command("date", NoEscape(r"\today")))
    doc.append(NoEscape(r"\maketitle"))

    fill_document(doc)

    doc.generate_pdf("basic_maketitle", clean_tex=False)
