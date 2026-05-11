from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()

# Define a Pydantic model for the resume data
class ResumeData(BaseModel):
    name: str
    email: str
    phone: str
    education: list
    experience: list
    skills: list


@app.post("/generate_resume/")
async def generate_resume(resume_data: ResumeData):
    # Here you would add the logic to generate the resume using the provided data
    # For example, you could call a function that fills in a template and generates a PDF
    return {"message": "Resume generated successfully", "data": resume_data}