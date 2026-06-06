from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import os

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# --- Database Setup ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./students.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Model ---
class StudentDB(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    course = Column(String)

# Create tables
Base.metadata.create_all(bind=engine)

# --- FastAPI Setup ---
app = FastAPI(title="NexusEdu PRO API", description="Professional Student Management API")

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

# --- Pydantic Schemas ---
class StudentCreate(BaseModel):
    id: int
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=5, le=100)
    course: str = Field(..., min_length=2, max_length=100)

def student_to_dict(student):
    return {
        "id": student.id,
        "name": student.name,
        "age": student.age,
        "course": student.course
    }

# --- API Endpoints ---

# CREATE
@app.post("/students")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(StudentDB).filter(StudentDB.id == student.id).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Student ID already registered")
    
    # We use dict() for compatibility with both Pydantic v1 and v2, though model_dump() is preferred in v2
    student_data = student.dict() if hasattr(student, "dict") else student.model_dump()
    new_student = StudentDB(**student_data)
    
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return {
        "message": "Student added successfully",
        "data": student_to_dict(new_student)
    }

# READ ALL
@app.get("/students")
def get_students(db: Session = Depends(get_db)):
    students = db.query(StudentDB).all()
    return [student_to_dict(s) for s in students]

# READ ONE
@app.get("/students/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student_to_dict(student)

# UPDATE
@app.put("/students/{student_id}")
def update_student(student_id: int, updated_student: StudentCreate, db: Session = Depends(get_db)):
    student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update fields
    student_data = updated_student.dict() if hasattr(updated_student, "dict") else updated_student.model_dump()
    for key, value in student_data.items():
        setattr(student, key, value)
        
    db.commit()
    db.refresh(student)
    
    return {
        "message": "Student updated successfully",
        "data": student_to_dict(student)
    }

# DELETE
@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.delete(student)
    db.commit()
    
    return {
        "message": "Student deleted successfully",
        "data": student_to_dict(student)
    }