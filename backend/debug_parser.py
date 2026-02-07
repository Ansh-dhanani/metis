"""Debug resume parser to see raw extraction"""

from models.metis.resume_parser import extract_text_from_pdf, extract_name, extract_email, extract_phone, split_name

# Test with your PDF
pdf_path = input("Enter path to your resume PDF: ")

print("\n" + "="*60)
print("EXTRACTING TEXT FROM PDF...")
print("="*60)

raw_text = extract_text_from_pdf(pdf_path)

print("\nRAW TEXT (first 1000 chars):")
print("-"*60)
print(raw_text[:1000])
print("-"*60)

print("\n\nFIRST 10 LINES:")
print("-"*60)
lines = raw_text.split('\n')
for i, line in enumerate(lines[:10], 1):
    print(f"{i}: [{line}]")
print("-"*60)

print("\n\nEXTRACTION RESULTS:")
print("-"*60)

name = extract_name(raw_text)
print(f"Name: [{name}]")

first, last = split_name(name)
print(f"First Name: [{first}]")
print(f"Last Name: [{last}]")

email = extract_email(raw_text)
print(f"Email: [{email}]")

phone = extract_phone(raw_text)
print(f"Phone: [{phone}]")

print("-"*60)
