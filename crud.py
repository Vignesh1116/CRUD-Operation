from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os

app = FastAPI()

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

# Temporary storage
students = []

# Schema
class Student(BaseModel):
    id: int
    name: str 
    age: int
    course: str


# CREATE
@app.post("/students")
def create_student(student: Student):
    students.append(student)
    return {
        "message": "Student added successfully",
        "data": student
    }


# READ ALL
@app.get("/students")
def get_students():
    return students


# READ ONE
@app.get("/students/{student_id}")
def get_student(student_id: int):

    for student in students:
        if student.id == student_id:
            return student

    raise HTTPException(
        status_code=404,
        detail="Student not found"
    )


# UPDATE
@app.put("/students/{student_id}")
def update_student(student_id: int, updated_student: Student):

    for index, student in enumerate(students):
        if student.id == student_id:
            students[index] = updated_student

            return {
                "message": "Student updated successfully",
                "data": updated_student
            }

    raise HTTPException(
        status_code=404,
        detail="Student not found"
    )


# DELETE
@app.delete("/students/{student_id}")
def delete_student(student_id: int):

    for index, student in enumerate(students):
        if student.id == student_id:
            deleted_student = students.pop(index)

            return {
                "message": "Student deleted successfully",
                "data": deleted_student
            }

    raise HTTPException(
        status_code=404,
        detail="Student not found"
    )