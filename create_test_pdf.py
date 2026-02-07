from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_resume_pdf(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "John Doe")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 65, "john.doe@example.com | 555-0123")
    
    # Summary
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 100, "Summary")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 115, "Experienced Software Engineer with 5 years of expertise in Python and AI.")
    
    # Experience
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 150, "Experience")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 165, "Senior Developer | Tech Corp")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 180, "2020 - Present")
    c.drawString(50, height - 195, "Leading backend development using Python and Flask.")
    
    # Skills
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 230, "Skills")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 245, "Python, SQL, Machine Learning, AWS, Docker")
    
    c.save()
    print(f"Created {filename}")

if __name__ == "__main__":
    create_resume_pdf("sample_resume.pdf")
